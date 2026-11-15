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
const accounting = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
const academicAuditor = academic.roles.Auditor || [];
const userAuditor = user.roles.Auditor || [];

assert.ok(academicAuditor.includes("getStudentDocuments"));
assert.ok(academicAuditor.includes("getStudentFile"));
assert.ok(academicAuditor.includes("getStudentDocumentFile"), "the internal permission key authorizes only the tokenized proxy");
assert.ok(academicAuditor.includes("verifyDocumentIntegritySha256"));
assert.ok(academicAuditor.includes("getPendingDocumentsReport"));
assert.ok(userAuditor.includes("getLegacyDocumentInventory"));
assert.ok(userAuditor.includes("getAuditReport"));
assert.ok(userAuditor.includes("getUserRoleMemberships"));

const mutatingAction = /^(create|save|update|delete|remove|grant|revoke|manage|upload|write|import|restore|purge|configure|approve|register|submit|assign|cancel|archive|close|process|generate|set|mark|reply|send|accept|switch)/i;
for (const [service, actions] of [["ACADEMIC", academicAuditor], ["USER", userAuditor]]) {
  assert.ok(actions.length > 0, service + " Auditor has an explicit allowlist");
  assert.deepEqual(actions.filter(action => mutatingAction.test(action)), [],
    service + " Auditor cannot mutate, delete, approve, upload or administer records");
}
assert.doesNotMatch(userAuditor.join("|"), /getNotificationAuditLogs|manageUserRoleMemberships|purgeStructuredLogs/);
assert.match(academic.source,/const permissionAction = \["createStudentDocumentAccessToken", "getSecureDocumentStream"\]/);
assert.match(accounting,/request\.action === "validateImportPreview"/);
assert.match(accounting,/IMPORT_COMMIT_NOT_EXPOSED/,"ACCOUNTING exposes no import write action to the read-only Auditor");
process.stdout.write("Read-only Auditor role: Academic/User allowlists, document proxy permission alias and disabled Accounting writes PASS.\n");
