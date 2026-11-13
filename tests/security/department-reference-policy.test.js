const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });

function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

const runtime = { Date, JSON, String, Array, Object, isNaN };
vm.runInNewContext(extractFunction(source, "evaluateDepartmentReferenceAccess_") +
  "\nthis.evaluate = evaluateDepartmentReferenceAccess_;", runtime);

const POLICY_KEY = "POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL";
const NOW = "2026-11-13T12:00:00.000Z";
function grant(overrides) {
  return Object.assign({
    InstitutionID: "I1", GrantID: "G1", ResourceType: "EXPEDIENTE", ResourceID: "E1",
    OwnerDepartmentID: "D2", TargetDepartmentID: "D1",
    AllowedFieldsJSON: '["Nombre","Estado"]', AllowedDocumentIDsJSON: '["DOC-1"]',
    AuthorizedBy: "U9", AuthorizedAt: "2026-11-12T00:00:00.000Z",
    ValidFrom: "2026-11-01T00:00:00.000Z", ExpiresAt: "2026-12-01T00:00:00.000Z",
    Status: "ACTIVE", RevokedAt: ""
  }, overrides || {});
}
function input(overrides) {
  const base = {
    actorContext: {
      status: "success", verified: true, userId: "U1", membershipId: "M1", roleId: "R1",
      institutionId: "I1", activeDepartmentId: "D1", institutionWide: false,
      institutionWideAuthorized: false
    },
    resourceOwnership: {
      authorized: true, institutionId: "I1", departmentId: "D2",
      resourceType: "EXPEDIENTE", resourceId: "E1"
    },
    institutionalConfig: { institutionId: "I1", key: POLICY_KEY, value: "PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL" },
    referenceGrants: [grant()], operation: "READ_REFERENCE",
    requestedFields: ["Nombre"], requestedDocumentIds: ["DOC-1"], now: NOW
  };
  const result = Object.assign({}, base, overrides || {});
  if (overrides && overrides.actorContext) result.actorContext = Object.assign({}, base.actorContext, overrides.actorContext);
  if (overrides && overrides.resourceOwnership) result.resourceOwnership = Object.assign({}, base.resourceOwnership, overrides.resourceOwnership);
  if (overrides && overrides.institutionalConfig && base.institutionalConfig) result.institutionalConfig = Object.assign({}, base.institutionalConfig, overrides.institutionalConfig);
  return result;
}
function evaluate(overrides) { return runtime.evaluate(input(overrides)); }

{
  const result = evaluate({});
  assert.equal(result.authorized, true);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_ALLOWED");
  assert.equal(result.requiresStandardAuthorization, true);
  assert.equal(result.auditEvent.grantId, "G1");
  assert.equal(result.auditEvent.authorizedBy, "U9");
}
{
  const result = evaluate({ institutionalConfig: null });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "CROSS_DEPARTMENT_BLOCKED", "missing policy defaults to strict");
}
{
  const result = evaluate({ institutionalConfig: null, resourceOwnership: { departmentId: "D1" }, operation: "DOWNLOAD" });
  assert.equal(result.authorized, true, "same department continues to standard authorization");
  assert.equal(result.requiresStandardAuthorization, true);
  assert.equal(result.code, "SAME_DEPARTMENT_ALLOWED");
}
{
  const result = evaluate({ actorContext: { institutionWide: true, institutionWideAuthorized: true }, operation: "EXPORT" });
  assert.equal(result.authorized, true);
  assert.equal(result.code, "INSTITUTIONAL_SCOPE_ALLOWED");
}
{
  const result = evaluate({ actorContext: { institutionWide: true, institutionWideAuthorized: false } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "INSTITUTION_WIDE_SCOPE_UNVERIFIED");
}
{
  const result = evaluate({ operation: "DOWNLOAD" });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "CROSS_DEPARTMENT_OPERATION_DENIED");
}
{
  const result = evaluate({ requestedFields: ["Nombre", "NotasConfidenciales"] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_SCOPE_EXCEEDED");
}
{
  const result = evaluate({ requestedDocumentIds: ["DOC-1", "DOC-2"] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_SCOPE_EXCEEDED");
}
{
  const result = evaluate({ referenceGrants: [] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
}
{
  const result = evaluate({ referenceGrants: [grant(), grant({ GrantID: "G2" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_AMBIGUOUS");
}
{
  const result = evaluate({ referenceGrants: [grant({ ExpiresAt: "2026-11-13T11:59:59.000Z" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_OUT_OF_WINDOW");
}
{
  const result = evaluate({ referenceGrants: [grant({ ValidFrom: "2026-11-13T12:00:01.000Z" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_OUT_OF_WINDOW");
}
{
  const result = evaluate({ referenceGrants: [grant({ RevokedAt: "2026-11-13T11:00:00.000Z" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_INVALID");
}
{
  const result = evaluate({ referenceGrants: [grant({ Status: "REVOKED" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_INVALID");
}
{
  const result = evaluate({ referenceGrants: [grant({ AuthorizedAt: "not-a-date" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_INVALID");
}
{
  const result = evaluate({ referenceGrants: [grant({ AllowedFieldsJSON: '["*"]' })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_ALLOWLIST_INVALID");
}
{
  const result = evaluate({ requestedFields: ["*"] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "REFERENCE_WILDCARD_NOT_ALLOWED");
}
{
  const result = evaluate({ institutionalConfig: { institutionId: "I2" } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_POLICY_CONFIG_INVALID");
}
{
  const result = evaluate({ institutionalConfig: { value: "ALLOW_ALL" } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_POLICY_CONFIG_INVALID");
}
{
  const result = evaluate({ institutionalConfig: { value: "UNRECOGNIZED_POLICY" } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_POLICY_UNKNOWN");
}
{
  const result = evaluate({ resourceOwnership: { institutionId: "I2" } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "RESOURCE_OWNERSHIP_UNVERIFIED");
}
{
  const result = evaluate({ resourceOwnership: { authorized: false } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "RESOURCE_OWNERSHIP_UNVERIFIED");
}
{
  const result = evaluate({ actorContext: { verified: false } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "VERIFIED_REFERENCE_CONTEXT_REQUIRED");
}
{
  const result = evaluate({ actorContext: { membershipId: "" } });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "VERIFIED_REFERENCE_CONTEXT_REQUIRED");
}
{
  const result = evaluate({ requestedFields: [], requestedDocumentIds: [] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "REFERENCE_ALLOWLIST_REQUEST_REQUIRED");
}
{
  const result = evaluate({ referenceGrants: [grant({ InstitutionID: "I2" })] });
  assert.equal(result.authorized, false);
  assert.equal(result.code, "DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
}
{
  const result = evaluate({ requestedFields: ["Nombre", "Estado"], requestedDocumentIds: [] });
  assert.equal(result.authorized, true);
  assert.equal(result.auditEvent.requestedFields.length, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(result, "allowedFields"), false);
}
{
  const result = evaluate({ requestedFields: ["NotasConfidenciales"] });
  assert.equal(result.authorized, false);
  assert.equal(result.auditEvent.decision, "DENY");
  assert.equal(result.auditEvent.requestedFields[0], "NotasConfidenciales", "denied requests remain auditable");
  assert.equal(Object.prototype.hasOwnProperty.call(result, "allowedFields"), false);
}
process.stdout.write("Department reference policy contract: 28 scenarios PASS.\n");
