const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/user-service/Code.gs"), "utf8");
const scopeFn = extractFunction(source, "getUserContextScope");
const validateFn = extractFunction(source, "validateRoleScopeAccess");
const assignFn = extractFunction(source, "assignRoleScope");
const permissionFn = extractFunction(source, "validateRolePermission");

const headers = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"];
const rows = [
  headers,
  ["A-1","U-1","Director","DEPARTAMENTO",'["DEP-A","DEP-B"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-2","U-1","Director","DEPARTAMENTO",'["DEP-OLD"]',"Activo","U-ADMIN","2025-01-01","2024-01-01","2025-12-31","No",""],
  ["A-3","U-1","Director","DEPARTAMENTO",'["DEP-FUTURE"]',"Activo","U-ADMIN","2026-01-01","2027-01-01","2027-12-31","No",""],
  ["A-4","U-1","Administrador","INSTITUCION",'["INST-1"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-5","U-2","Director","DEPARTAMENTO",'["DEP-X"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-6","U-1","Director","DEPARTAMENTO",'["DEP-REVOKED"]',"Revocado","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""]
];

function makeContext() {
  const claims = {
    "token-u1-director": { userId: "U-1", role: "Director" },
    "token-u1-admin": { userId: "U-1", role: "Administrador" },
    "token-u2-director": { userId: "U-2", role: "Director" },
    "token-u3-director": { userId: "U-3", role: "Director" }
  };
  const ctx = {
    SPREADSHEET_ID: "LOCAL",
    getIdentityInstitutionId_: () => "INST-1",
    getUserVerifiedRole(payload) {
      const c = claims[payload && payload.sessionToken];
      if (!c) return "NO_ACCESS";
      payload._verifiedUserId = c.userId;
      payload._verifiedRole = c.role;
      return c.role;
    },
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, "LOCAL");
        return { getSheetByName(name) {
          return name === "AsignacionesAmbitosRoles" ? { getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }) } : null;
        }};
      }
    },
    PUBLIC_ACTIONS: [],
    IDENTITY_MANAGER_ACTIONS_: [],
    validateContextualAccess: () => ({ authorized: true }),
    getDynamicPermissionsForRole: () => null,
    ROLE_PERMISSIONS: {},
    logStructuredEvent: () => {}
  };
  vm.runInNewContext(scopeFn + "\n" + validateFn + "\n" + permissionFn + "\nthis.getUserContextScope=getUserContextScope;this.validateRoleScopeAccess=validateRoleScopeAccess;this.validateRolePermission=validateRolePermission;", ctx);
  return ctx;
}

const ctx = makeContext();
const spoofed = { sessionToken: "token-u1-director", userId: "U-2", role: "Administrador", authRole: "Administrador" };
const context = ctx.getUserContextScope(spoofed);
assert.equal(context.status, "success");
assert.equal(context.userId, "U-1", "payload userId must not override signed identity");
assert.equal(context.role, "Director", "payload role must not override signed identity");
assert.deepEqual(Array.from(context.departmentIds), ["DEP-A","DEP-B"]);
assert.equal(context.institutionWide, false, "administrator privileges are not inferred from a spoofed role");
assert.equal(context.scopes.some(s => s.scopeValues.includes("DEP-OLD")), false, "expired scopes are excluded");
assert.equal(context.scopes.some(s => s.scopeValues.includes("DEP-FUTURE")), false, "future scopes are excluded");
assert.equal(context.scopes.some(s => s.scopeValues.includes("DEP-REVOKED")), false, "revoked scopes are excluded");

const allowed = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-director", userId: "U-2", scopeType: "DEPARTAMENTO", requestedValue: "DEP-A" });
assert.equal(allowed.status, "success");
assert.equal(allowed.authorized, true);
const denied = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-director", scopeType: "DEPARTAMENTO", requestedValue: "DEP-X" });
assert.equal(denied.authorized, false, "another user's department must be denied");

const institutional = ctx.getUserContextScope({ sessionToken: "token-u1-admin" });
assert.equal(institutional.status, "success");
assert.equal(institutional.institutionWide, true, "institution-wide access requires an explicit active INSTITUCION assignment");
const institutionGrant = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-admin", scopeType: "DEPARTAMENTO", requestedValue: "DEP-UNLISTED" });
assert.equal(institutionGrant.authorized, true);

const noScope = ctx.getUserContextScope({ sessionToken: "token-u3-director", userId: "U-1" });
assert.equal(noScope.status, "error");
assert.equal(noScope.code, "DEPARTMENT_SCOPE_NOT_ASSIGNED");

const invalid = ctx.getUserContextScope({ userId: "U-1", role: "Administrador" });
assert.equal(invalid.status, "error");
assert.equal(invalid.code, "VERIFIED_IDENTITY_REQUIRED");

const permission = ctx.validateRolePermission("getUserContextScope", { sessionToken: "token-u1-director" });
assert.equal(permission.authorized, true, "any authenticated user may read their own scope context");

const assignCtx = {};
vm.runInNewContext(assignFn + "\nthis.assignRoleScope=assignRoleScope;", assignCtx);
const spoofAssign = assignCtx.assignRoleScope({ authRole: "Administrador", role: "Administrador", userId: "U-2", roleId: "Director", scopeType: "DEPARTAMENTO", scopeValues: ["DEP-A"] });
assert.equal(spoofAssign.status, "error");
assert.equal(spoofAssign.code, "VERIFIED_IDENTITY_REQUIRED", "scope assignment must not trust client-supplied role");

console.log("Department scope contract: verified identity, role-bound active scopes, explicit institution scope, fail-closed defaults and spoof resistance passed.");
