"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function readRolePermissions(relativePath) {
  const source = fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");
  new vm.Script(source, { filename: relativePath });
  const start = source.indexOf("const ROLE_PERMISSIONS =");
  assert.ok(start >= 0, "ROLE_PERMISSIONS exists in " + relativePath);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      const roleCode = source.slice(start, i + 1) + "\nthis.roles = ROLE_PERMISSIONS;";
      return { source, roles: vm.runInNewContext(roleCode, {}) };
    }
  }
  throw new Error("Unbalanced ROLE_PERMISSIONS in " + relativePath);
}

const academic = readRolePermissions("../../backend/academic-service/Code.gs");
const user = readRolePermissions("../../backend/user-service/Code.gs");
const accountingRoles = readRolePermissions("../../backend/accounting-service/Code.gs");
const accounting = accountingRoles.source;
const academicAuditor = academic.roles.Auditor || [];
const userAuditor = user.roles.Auditor || [];
const accountingAuditor = accountingRoles.roles.Auditor || [];

assert.ok(academicAuditor.includes("getStudentDocuments"));
assert.ok(academicAuditor.includes("getStudentFile"));
assert.ok(academicAuditor.includes("getStudentDocumentFile"), "the internal permission key authorizes only the tokenized proxy");
assert.ok(academicAuditor.includes("previewStudentDocument"), "preview is a separate read-only permission for the tokenized proxy");
assert.ok(academicAuditor.includes("verifyDocumentIntegritySha256"));
assert.ok(academicAuditor.includes("getPendingDocumentsReport"));
assert.ok(userAuditor.includes("getLegacyDocumentInventory"));
assert.ok(userAuditor.includes("getAuditReport"));
assert.ok(userAuditor.includes("viewAuditLogs"),"Auditor retains the explicit read-only audit RBAC grant");
assert.ok(userAuditor.includes("getUserRoleMemberships"));
assert.ok(userAuditor.includes("switchActiveRole"),"Auditor may switch only among already assigned memberships");

const mutatingAction = /^(create|save|update|delete|remove|grant|revoke|manage|upload|write|import|restore|purge|configure|approve|register|submit|assign|cancel|archive|close|process|generate|set|mark|reply|send|accept)/i;
assert.equal(JSON.stringify(Array.from(accountingAuditor)), JSON.stringify(["getAccountingMigrationFileAudit"]),
  "Accounting Auditor receives only its institution-scoped audit reader");
for (const [service, actions] of [["ACADEMIC", academicAuditor], ["USER", userAuditor], ["ACCOUNTING", accountingAuditor]]) {
  assert.ok(actions.length > 0, service + " Auditor has an explicit allowlist");
  assert.equal(JSON.stringify(Array.from(actions).filter(action => mutatingAction.test(action))), "[]",
    service + " Auditor cannot mutate, delete, approve, upload or administer records");
}
assert.doesNotMatch(userAuditor.join("|"), /getNotificationAuditLogs|manageUserRoleMemberships|purgeStructuredLogs/);
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next < 0 ? source.length : next);
}
const userPermissionContext = {
  PUBLIC_ACTIONS: [], ROLE_PERMISSIONS: user.roles, IDENTITY_MANAGER_ACTIONS_: [], TICKET_ADMIN_ROLES_: [],
  getUserVerifiedRole: () => "Auditor", validateContextualAccess: () => ({ authorized: true }),
  getDynamicPermissionsForRole: () => true, hasActiveDelegationForAction: () => ({ delegante: "ADMIN", delId: "D-1" }),
  logStructuredEvent: () => {}
};
vm.runInNewContext(extractFunction(user.source, "validateRolePermission") +
  "\nthis.check = validateRolePermission;", userPermissionContext);
assert.equal(userPermissionContext.check("getAuditReport", { _verifiedUserId: "AUD-1" }).authorized, true);
assert.equal(userPermissionContext.check("viewAuditLogs", { _verifiedUserId: "AUD-1" }).authorized, true);
assert.equal(userPermissionContext.check("importDataWithColumnMapping", { _verifiedUserId: "AUD-1" }).authorized, false,
  "a dynamic wildcard cannot grant the Auditor a write action");
const academicPermissionContext = {
  PUBLIC_ACTIONS: [], ROLE_PERMISSIONS: academic.roles,
  verifySessionToken: () => ({ userId: "AUD-1", role: "Auditor" }),
  auditTeacherJustificationDenied_: () => {}, validateContextualAccess: () => ({ authorized: true }),
  getDynamicPermissionsForRole: () => true, hasActiveDelegationForAction: () => ({ delegante: "ADMIN", delId: "D-1" }),
  logStructuredEvent: () => {}
};
const academicRequestHelpers = ["getRequestSessionToken_","getRequestPermissionAction_","getVerifiedRequestSessionClaims_","getCachedRequestAuthorization_","cacheRequestAuthorization_"]
  .map(name => extractFunction(academic.source,name)).join("\n");
vm.runInNewContext(academicRequestHelpers + "\n" + extractFunction(academic.source, "validateRolePermission") +
  "\nthis.check = validateRolePermission;", academicPermissionContext);
assert.equal(academicPermissionContext.check("getStudentDocumentFile", { sessionToken: "AUD-TOKEN", operation: "DOWNLOAD" }).authorized, true);
assert.equal(academicPermissionContext.check("getStudentDocumentFile", { sessionToken: "AUD-TOKEN", operation: "PREVIEW" }).authorized, true);
assert.equal(academicPermissionContext.check("deleteStudentDocument", { sessionToken: "AUD-TOKEN" }).authorized, false,
  "dynamic permissions and delegations cannot elevate the Auditor beyond the read-only allowlist");
assert.match(user.source,/if \(String\(claims\.role\) === "Auditor"\) return \{ status: "error", code: "IMPORT_PERMISSION_DENIED" \}/,
  "trusted ACCOUNTING authorization explicitly denies Auditor imports");
let trustedAction = "authorizeAccountingImport";
let trustedRole = "Auditor";
let institutionWideAuditScope = true;
const trustedHandlerContext = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => "trusted-migration-secret-at-least-32-characters" }) },
  verifyInterServiceEnvelope: () => ({ sourceService: "ACCOUNTING", action: trustedAction,
    payload: { sessionToken: "AUD-TOKEN" } }),
  verifySessionToken: () => ({ userId: "AUD-1", role: trustedRole, institutionId: "INST-1" }),
  getDynamicPermissionsForRole: () => true,
  getUserContextScope: () => ({ status: "success", authorized: true, institutionWide: institutionWideAuditScope })
};
vm.runInNewContext(extractFunction(user.source, "handleTrustedMigrationEnvelope_") +
  "\nthis.handle = handleTrustedMigrationEnvelope_;", trustedHandlerContext);
assert.equal(trustedHandlerContext.handle({}).code, "IMPORT_PERMISSION_DENIED",
  "even a dynamic wildcard cannot authorize a trusted Accounting import for Auditor");
trustedAction = "authorizeAccountingAuditRead";
const auditAuthorization = trustedHandlerContext.handle({});
assert.equal(auditAuthorization.status, "success");
assert.equal(auditAuthorization.auditReadPermissionVerified, true);
institutionWideAuditScope = false;
assert.equal(trustedHandlerContext.handle({}).code, "INSTITUTION_SCOPE_DENIED",
  "department-only Auditor scope cannot read institution-wide Accounting audit");
institutionWideAuditScope = true;
trustedRole = "Director";
assert.equal(trustedHandlerContext.handle({}).code, "AUDIT_READ_PERMISSION_DENIED",
  "only the explicit Auditor role receives this Accounting audit grant");
assert.match(user.source,/\["Director", "Administrador", "Auditor"\]\.indexOf\(role\)/,
  "institution-wide inventory access for Auditor still requires an institution-wide verified scope");
assert.match(user.source,/if \(actorRole === "Auditor"\)[\s\S]*scope\.institutionWide !== true/,
  "global audit logs are restricted to Auditors with institution-wide verified scope");
assert.match(academic.source,/function getStudentDocumentFile\(payload\)/,"ACADEMIC exposes one direct document read endpoint");
assert.match(academic.source,/action !== "getStudentDocumentFile"/,"only the direct document endpoint maps PREVIEW to its own RBAC action");
assert.match(academic.source,/case "getStudentDocumentFile": result = getStudentDocumentFile\(payload\); break;/,"the dispatcher routes direct document reads");
assert.match(accounting,/request\.action === "validateImportPreview"/);
assert.match(accounting,/request\.action === "getAccountingMigrationFileAudit"/,
  "ACCOUNTING exposes a read-only institution-bound audit endpoint for Auditor");
assert.match(accounting,/request\.action === "importDataWithColumnMapping"/,
  "ACCOUNTING commit is routed but must pass its independent authorization and preview gates");
assert.match(accounting,/accountingHasInstitutionalImportPermission_\(\{ roleId: auth\.role/);
assert.match(accounting,/if \(input\.previewConfirmed !== true \|\| !input\.previewHash/);
assert.equal(userAuditor.includes("authorizeAccountingImport"),false,
  "Auditor cannot satisfy the import permission required by ACCOUNTING write/preview handlers");
process.stdout.write("Read-only Auditor role: Academic/User read-only allowlists, dynamic-permission override and Auditor import denial PASS.\n");
