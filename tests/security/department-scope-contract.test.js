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
const assignmentsFn = extractFunction(source, "getInternalRoleAssignments");
const ownershipFn = extractFunction(source, "assertRecordOwnership");
const responsibilityFn = extractFunction(source, "resolveActiveInternalResponsibility_");
const permissionCacheKeyFn = extractFunction(source, "getDynamicPermissionCacheKey_");
const dynamicPermissionsFn = extractFunction(source, "getDynamicPermissionsForRole");

const headers = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID","InstitutionID","MembershipID","ResponsibilityID"];
const rows = [
  headers,
  ["A-1","U-1","Director","DEPARTAMENTO",'["DEP-A","DEP-B"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-2","U-1","Director","DEPARTAMENTO",'["DEP-OLD"]',"Activo","U-ADMIN","2025-01-01","2024-01-01","2025-12-31","No",""],
  ["A-3","U-1","Director","DEPARTAMENTO",'["DEP-FUTURE"]',"Activo","U-ADMIN","2026-01-01","2027-01-01","2027-12-31","No",""],
  ["A-4","U-1","Administrador","INSTITUCION",'["INST-1"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-5","U-2","Director","DEPARTAMENTO",'["DEP-X"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-6","U-1","Director","DEPARTAMENTO",'["DEP-REVOKED"]',"Revocado","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-7","U-1","Director","NIVEL",'["BASICA"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No",""],
  ["A-8","U-1","Director","DEPARTAMENTO",'["DEP-M1"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No","","INST-1","MEM-1"],
  ["A-9","U-1","Director","DEPARTAMENTO",'["DEP-M2"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No","","INST-1","MEM-2"],
  ["A-10","U-1","Director","DEPARTAMENTO",'["DEP-OTHER-INST"]',"Activo","U-ADMIN","2026-01-01","2026-01-01","2027-01-01","No","","INST-2","MEM-3"]
];
rows[8].push("RESP-ACTIVE");
rows[9].push("RESP-ACTIVE");
rows[10].push("RESP-ACTIVE");

const ownershipRows = [
  ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status"],
  ["OWN-A","INST-1","EXPEDIENTE","RES-A","DEP-A","ACTIVE"],
  ["OWN-B","INST-1","EXPEDIENTE","RES-B","DEP-B","ACTIVE"]
];

function makeContext() {
  const claims = {
    "token-u1-director": { userId: "U-1", role: "Director" },
    "token-u1-director-m1": { userId: "U-1", role: "Director", membershipId: "MEM-1", institutionId: "INST-1" },
    "token-u1-director-mismatch": { userId: "U-1", role: "Director", membershipId: "MEM-2", institutionId: "INST-2" },
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
    verifySessionToken: token => claims[token] || null,
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, "LOCAL");
        return { getSheetByName(name) {
          if (name === "AsignacionesAmbitosRoles") return { getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }) };
          if (name === "CatalogoRolesInternos") return { getDataRange: () => ({ getValues: () => [["RolInternoID","CodigoInterno","NombreResponsabilidad","Descripcion","Departamento","AreaAcademica","TipoResponsabilidad","VigenciaMeses","PermiteSuplencia","Estado","CreadoPor","FechaCreacion","FechaActualizacion"],["RESP-ACTIVE","COORD","Coordinación","","DEP-M1","","Académica",12,"No","Activo","U-ADMIN","2026-01-01","2026-01-01"]] }) };
          if (name === "ResourceOwnership") return { getLastRow: () => ownershipRows.length, getDataRange: () => ({ getValues: () => ownershipRows.map(r => r.slice()) }) };
          return null;
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
  vm.runInNewContext(responsibilityFn + "\n" + scopeFn + "\n" + validateFn + "\n" + ownershipFn + "\n" + permissionFn + "\nthis.getUserContextScope=getUserContextScope;this.validateRoleScopeAccess=validateRoleScopeAccess;this.assertRecordOwnership=assertRecordOwnership;this.validateRolePermission=validateRolePermission;", ctx);
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

const activeContext = ctx.getUserContextScope({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-B" });
assert.equal(activeContext.status, "success");
assert.equal(activeContext.activeDepartmentId, "DEP-B");
assert.deepEqual(Array.from(activeContext.departmentIds), ["DEP-B"], "active department narrows the union of authorized departments");
assert.deepEqual(Array.from(activeContext.scopes, s => s.scopeType), ["DEPARTAMENTO"], "unrelated scope dimensions are excluded in a department-specific context");
assert.deepEqual(Array.from(activeContext.scopes[0].scopeValues), ["DEP-B"]);
assert.equal(activeContext.institutionWide, false, "active department context cannot retain institution-wide bypass");
const activeAllowed = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-B", scopeType: "DEPARTAMENTO", requestedValue: "DEP-B" });
assert.equal(activeAllowed.authorized, true);
assert.equal(activeAllowed.activeDepartmentId, "DEP-B");
const activeDenied = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-B", scopeType: "DEPARTAMENTO", requestedValue: "DEP-A" });
assert.equal(activeDenied.authorized, false, "a selected department cannot access another assigned department");

const selectedResource = ctx.assertRecordOwnership({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-B" }, "EXPEDIENTE", "RES-B", "READ");
assert.equal(selectedResource.authorized, true, "ownership in the selected department remains accessible");
assert.equal(selectedResource.departmentId, "DEP-B");
const otherDepartmentResource = ctx.assertRecordOwnership({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-B" }, "EXPEDIENTE", "RES-A", "READ");
assert.equal(otherDepartmentResource.authorized, false, "ownership outside the active department is denied");
assert.equal(otherDepartmentResource.code, "RESOURCE_SCOPE_DENIED");
const unionResource = ctx.assertRecordOwnership({ sessionToken: "token-u1-director" }, "EXPEDIENTE", "RES-A", "READ");
assert.equal(unionResource.authorized, true, "omitting active context preserves the previously authorized department union");
const activeOtherDimensionDenied = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-B", scopeType: "NIVEL", requestedValue: "BASICA" });
assert.equal(activeOtherDimensionDenied.authorized, false, "unrelated scope dimensions fail closed in a department-specific context");
const unassignedActive = ctx.getUserContextScope({ sessionToken: "token-u1-director", activeDepartmentId: "DEP-X" });
assert.equal(unassignedActive.status, "error");
assert.equal(unassignedActive.code, "ACTIVE_SCOPE_NOT_ASSIGNED");
const institutionalActive = ctx.getUserContextScope({ sessionToken: "token-u1-admin", activeDepartmentId: "DEP-A" });
assert.equal(institutionalActive.status, "error", "institution-wide role cannot select an unverified department from its broad grant");
assert.equal(institutionalActive.code, "ACTIVE_SCOPE_NOT_ASSIGNED");

const institutional = ctx.getUserContextScope({ sessionToken: "token-u1-admin" });
assert.equal(institutional.status, "success");
assert.equal(institutional.institutionWide, true, "institution-wide access requires an explicit active INSTITUCION assignment");
const institutionGrant = ctx.validateRoleScopeAccess({ sessionToken: "token-u1-admin", scopeType: "DEPARTAMENTO", requestedValue: "DEP-UNLISTED" });
assert.equal(institutionGrant.authorized, true);

const membershipScoped = ctx.getUserContextScope({ sessionToken: "token-u1-director-m1" });
assert.equal(membershipScoped.status, "success");
assert.equal(membershipScoped.membershipId, "MEM-1");
assert.deepEqual(Array.from(membershipScoped.departmentIds), ["DEP-M1"], "scope is bound to the signed membership, not merely user and role");
assert.equal(membershipScoped.scopes.some(scope => scope.scopeValues.includes("DEP-M2")), false, "another membership's scope is not inherited");
assert.equal(membershipScoped.scopes.some(scope => scope.scopeValues.includes("DEP-OTHER-INST")), false, "another institution's scope is not inherited");
const membershipInstitutionMismatch = ctx.getUserContextScope({ sessionToken: "token-u1-director-mismatch" });
assert.equal(membershipInstitutionMismatch.status, "error");
assert.equal(membershipInstitutionMismatch.code, "ROLE_MEMBERSHIP_INSTITUTION_MISMATCH", "a signed membership for another tenant is rejected");

const noScope = ctx.getUserContextScope({ sessionToken: "token-u3-director", userId: "U-1" });
assert.equal(noScope.status, "error");
assert.equal(noScope.code, "DEPARTMENT_SCOPE_NOT_ASSIGNED");

const invalid = ctx.getUserContextScope({ userId: "U-1", role: "Administrador" });
assert.equal(invalid.status, "error");
assert.equal(invalid.code, "VERIFIED_IDENTITY_REQUIRED");

const permission = ctx.validateRolePermission("getUserContextScope", { sessionToken: "token-u1-director" });
assert.equal(permission.authorized, true, "any authenticated user may read their own scope context");

const assignedScopeRows = [headers.slice()];
const assignSheet = {
  getLastRow: () => assignedScopeRows.length,
  getDataRange: () => ({ getValues: () => assignedScopeRows.map(row => row.slice()) }),
  getRange: (row, col) => ({ setValue: value => { while (assignedScopeRows.length < row) assignedScopeRows.push([]); assignedScopeRows[row - 1][col - 1] = value; } }),
  appendRow: row => assignedScopeRows.push(row.slice())
};
const assignCtx = {
  SPREADSHEET_ID: "LOCAL",
  getIdentityInstitutionId_: () => "INST-1",
  getUserRoleMembershipState_: () => ({ hasRecords: true }),
  resolveActiveInternalResponsibility_: (_ss, id) => id === "RESP-ACTIVE" ? { responsibilityId: id } : null,
  resolveUserRoleMembership_: () => ({ membershipId: "MEM-TARGET-1", institutionId: "INST-1", roleId: "Director" }),
  SpreadsheetApp: { openById: id => { assert.equal(id, "LOCAL"); return {}; } },
  getOrCreateSheet: (_ss, name) => { assert.equal(name, "AsignacionesAmbitosRoles"); return assignSheet; },
  Utilities: { getUuid: () => "12345678-1234-1234-1234-123456789012" },
  recordEntityChangeLog: () => {},
  logStructuredEvent: () => {}
};
vm.runInNewContext(assignFn + "\nthis.assignRoleScope=assignRoleScope;", assignCtx);
const spoofAssign = assignCtx.assignRoleScope({ authRole: "Administrador", role: "Administrador", userId: "U-2", roleId: "Director", responsibilityId: "RESP-ACTIVE", scopeType: "DEPARTAMENTO", scopeValues: ["DEP-A"] });
assert.equal(spoofAssign.status, "error");
assert.equal(spoofAssign.code, "VERIFIED_IDENTITY_REQUIRED", "scope assignment must not trust client-supplied role");
const boundAssignment = assignCtx.assignRoleScope({ _verifiedRole: "Administrador", _verifiedUserId: "U-ADMIN", userId: "U-1", roleId: "Director", responsibilityId: "RESP-ACTIVE", scopeType: "DEPARTAMENTO", scopeValues: ["DEP-A"] });
assert.equal(boundAssignment.status, "success");
assert.equal(boundAssignment.membershipId, "MEM-TARGET-1");
assert.equal(assignedScopeRows[1][12], "INST-1", "new scope assignment stores its institution");
assert.equal(assignedScopeRows[1][13], "MEM-TARGET-1", "new scope assignment stores its exact RBAC membership");
assert.equal(assignedScopeRows[1][14], "RESP-ACTIVE", "new scope assignment stores its active organizational responsibility");
assignCtx.resolveUserRoleMembership_ = () => ({ membershipId: "MEM-TARGET-2", institutionId: "INST-1", roleId: "Director" });
const secondMembershipAssignment = assignCtx.assignRoleScope({ _verifiedRole: "Administrador", _verifiedUserId: "U-ADMIN", userId: "U-1", roleId: "Director", responsibilityId: "RESP-ACTIVE", scopeType: "DEPARTAMENTO", scopeValues: ["DEP-B"] });
assert.equal(secondMembershipAssignment.status, "success");
assert.equal(assignedScopeRows.length, 3, "a different membership receives a separate assignment row");
assert.equal(assignedScopeRows[2][13], "MEM-TARGET-2");
assert.equal(assignedScopeRows[2][14], "RESP-ACTIVE");
assignCtx.resolveUserRoleMembership_ = () => null;
const inactiveMembershipAssignment = assignCtx.assignRoleScope({ _verifiedRole: "Administrador", _verifiedUserId: "U-ADMIN", userId: "U-1", roleId: "Director", responsibilityId: "RESP-ACTIVE", scopeType: "DEPARTAMENTO", scopeValues: ["DEP-C"] });
assert.equal(inactiveMembershipAssignment.status, "error");
assert.equal(inactiveMembershipAssignment.code, "ROLE_MEMBERSHIP_NOT_ACTIVE");
assert.equal(assignedScopeRows.length, 3, "no scope is written without a unique active target membership");


const assignmentNow = new Date();
const futureStart = new Date(assignmentNow.getTime() + 24 * 60 * 60 * 1000).toISOString();
const pastEnd = new Date(assignmentNow.getTime() - 24 * 60 * 60 * 1000).toISOString();
const assignmentRows = [
  headers.slice(0,12),
  ["R-1","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN",assignmentNow.toISOString(),"","", "No",""],
  ["R-2","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-FUTURE"]',"Activo","U-ADMIN",assignmentNow.toISOString(),futureStart,"", "No",""],
  ["R-3","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-EXPIRED"]',"Activo","U-ADMIN",assignmentNow.toISOString(),"",pastEnd, "No",""],
  ["R-4","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-BAD-START"]',"Activo","U-ADMIN",assignmentNow.toISOString(),"fecha-invalida","", "No",""],
  ["R-5","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-BAD-END"]',"Activo","U-ADMIN",assignmentNow.toISOString(),"","fecha-invalida", "No",""],
  ["R-6","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-UNBOUNDED"]',"Activo","U-ADMIN",assignmentNow.toISOString(),"","", "No",""],
  ["R-7","U-1","ROL-INT-1","DEPARTAMENTO",'["DEP-REVOKED"]',"Revocado","U-ADMIN",assignmentNow.toISOString(),"","", "No",""]
];
const assignmentCtx = {
  SPREADSHEET_ID: "LOCAL",
  SpreadsheetApp: { openById: id => { assert.equal(id,"LOCAL"); return {}; } },
  getOrCreateSheet: (_ss,name) => {
    assert.equal(name,"AsignacionesAmbitosRoles");
    return { getDataRange: () => ({ getValues: () => assignmentRows.map(row => row.slice()) }) };
  }
};
vm.runInNewContext(assignmentsFn + "\nthis.getInternalRoleAssignments=getInternalRoleAssignments;", assignmentCtx);
const currentAssignments = assignmentCtx.getInternalRoleAssignments({userId:"U-1",rolInternoId:"ROL-INT-1"});
assert.equal(currentAssignments.status,"success");
assert.deepEqual(Array.from(currentAssignments.data, row => row.asignacionId), ["R-1","R-6"], "future, expired, malformed and revoked assignments must not be effective");
const historicalAssignments = assignmentCtx.getInternalRoleAssignments({userId:"U-1",rolInternoId:"ROL-INT-1",soloVigentes:false});
assert.equal(historicalAssignments.status,"success");
assert.equal(historicalAssignments.data.some(row => row.asignacionId === "R-2"),true,"non-current listing retains future assignments when explicitly requested");

const permissionCache = new Map();
let activeTenant = "INST-1";
const permissionRows = [
  ["rol","modulo","accion","permitido","ambito"],
  ["Director","General","readRecords",true,"Global"],
  ["Director","General","readRecords",false,"INST-1"],
  ["Director","General","readRecords",true,"INST-2"]
];
const permissionCtx = {
  SPREADSHEET_ID: "LOCAL",
  getIdentityInstitutionId_: () => activeTenant,
  CacheService: { getScriptCache: () => ({ get: key => permissionCache.get(key) || null, put: (key,value) => permissionCache.set(key,value), remove: key => permissionCache.delete(key) }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => ({ getLastRow: () => permissionRows.length, getDataRange: () => ({ getValues: () => permissionRows }) }) }) }
};
vm.runInNewContext(permissionCacheKeyFn + "\n" + dynamicPermissionsFn + "\nthis.getDynamicPermissionsForRole=getDynamicPermissionsForRole;", permissionCtx);
assert.equal(permissionCtx.getDynamicPermissionsForRole("Director","readRecords"), false, "institution deny overrides global allow");
activeTenant = "INST-2";
assert.equal(permissionCtx.getDynamicPermissionsForRole("Director","readRecords"), true, "institution two uses its own permission rule and cache");
activeTenant = "INST-1";
assert.equal(permissionCtx.getDynamicPermissionsForRole("Director","readRecords"), false, "institution one cache remains isolated");

console.log("Department scope contract: verified identity, role-bound active scopes, institution-isolated dynamic permissions, effective assignment windows, fail-closed defaults and spoof resistance passed.");
