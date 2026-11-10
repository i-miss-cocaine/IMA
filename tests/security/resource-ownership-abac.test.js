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
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const rows = [];
const sheet = {
  getLastRow() { return rows.length; },
  appendRow(row) { rows.push(row.slice()); },
  getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
  getRange(row, col) { return { setValue(value) { rows[row - 1][col - 1] = value; } }; }
};
const contexts = {
  U1: { status: "success", userId: "U1", role: "Coordinador", institutionId: "I1", departmentIds: ["D1"], institutionWide: false },
  U2: { status: "success", userId: "U2", role: "Coordinador", institutionId: "I1", departmentIds: ["D2"], institutionWide: false },
  U3: { status: "success", userId: "U3", role: "ResponsableGlobal", institutionId: "I1", departmentIds: [], institutionWide: true },
  U4: { status: "success", userId: "U4", role: "ResponsableGlobal", institutionId: "I2", departmentIds: ["D1"], institutionWide: true }
};
const claims = {
  "coord-token": { userId: "U1", role: "Coordinador" },
  "other-token": { userId: "U2", role: "Coordinador" },
  "global-token": { userId: "U3", role: "ResponsableGlobal" },
  "foreign-token": { userId: "U4", role: "ResponsableGlobal" },
  "director-token": { userId: "U2", role: "Director" }
};
const runtime = {
  PUBLIC_ACTIONS: [], IDENTITY_MANAGER_ACTIONS_: [], IDENTITY_MANAGER_ROLES_: [], TICKET_ADMIN_ROLES_: [],
  ROLE_PERMISSIONS: { Director: ["*"] },
  getUserVerifiedRole(payload) {
    const c = claims[payload && payload.sessionToken];
    if (!c) return "NO_ACCESS";
    payload._verifiedUserId = c.userId; payload._verifiedRole = c.role; return c.role;
  },
  getUserContextScope(payload) {
    const c = claims[payload && payload.sessionToken];
    if (!c) return { status: "error", code: "VERIFIED_IDENTITY_REQUIRED" };
    payload._verifiedUserId = c.userId; payload._verifiedRole = c.role; return contexts[c.userId];
  },
  getDynamicPermissionsForRole(role, action) { return role === "Coordinador" && action === "registerResourceOwnership" ? true : null; },
  validateContextualAccess: () => ({ authorized: true }),
  hasActiveDelegationForAction: () => false,
  logStructuredEvent() {},
  SPREADSHEET_ID: "LOCAL",
  SpreadsheetApp: { openById() { return { getSheetByName: () => sheet }; } },
  getOrCreateSheet() { return sheet; },
  LockService: { getScriptLock() { return { tryLock: () => true, releaseLock() {} }; } },
  Utilities: { getUuid: () => "UUID-1" }
};
const validateFn = extractFunction(source, "validateRolePermission");
const registerFn = extractFunction(source, "registerResourceOwnership");
const assertFn = extractFunction(source, "assertRecordOwnership");
vm.runInNewContext(validateFn + "\n" + registerFn + "\n" + assertFn +
  "\nthis.validate = validateRolePermission; this.register = registerResourceOwnership; this.assertOwner = assertRecordOwnership;", runtime);
const spoofedInstitution = { sessionToken: "coord-token", institutionId: "I-ATTACKER", departmentId: "D1", resourceType: "EXPEDIENTE", resourceId: "EXP-001" };
assert.equal(runtime.validate("registerResourceOwnership", spoofedInstitution).authorized, true);
const registered = runtime.register(spoofedInstitution);
assert.equal(registered.status, "success");
assert.equal(rows[1][1], "I1", "institutionId comes from verified context, not payload");
assert.equal(rows[1][4], "D1");
assert.equal(rows[1][5], "ACTIVE");
assert.equal(runtime.assertOwner({ sessionToken: "coord-token", departmentId: "D2" }, "EXPEDIENTE", "EXP-001", "READ").authorized, true);
const cross = runtime.assertOwner({ sessionToken: "other-token", departmentId: "D1" }, "EXPEDIENTE", "EXP-001", "READ");
assert.equal(cross.authorized, false); assert.equal(cross.code, "RESOURCE_SCOPE_DENIED");
assert.equal(runtime.assertOwner({ sessionToken: "global-token" }, "EXPEDIENTE", "EXP-001", "READ").authorized, true);
assert.equal(runtime.assertOwner({ sessionToken: "foreign-token" }, "EXPEDIENTE", "EXP-001", "READ").authorized, false);
const missing = runtime.assertOwner({ sessionToken: "coord-token" }, "EXPEDIENTE", "UNKNOWN", "READ");
assert.equal(missing.authorized, false); assert.equal(missing.code, "RESOURCE_OWNERSHIP_UNVERIFIED");
assert.equal(runtime.validate("registerResourceOwnership", { sessionToken: "director-token" }).authorized, false, "no hardcoded admin-role bypass");
const outOfScope = runtime.register({ sessionToken: "coord-token", departmentId: "D2", resourceType: "EXPEDIENTE", resourceId: "EXP-002" });
assert.equal(outOfScope.code, "DEPARTMENT_SCOPE_DENIED");
rows.push(rows[1].slice());
const duplicate = runtime.assertOwner({ sessionToken: "coord-token" }, "EXPEDIENTE", "EXP-001", "READ");
assert.equal(duplicate.authorized, false); assert.equal(duplicate.code, "RESOURCE_OWNERSHIP_AMBIGUOUS");
process.stdout.write("resource-ownership-abac: all synthetic isolation assertions passed\n");
