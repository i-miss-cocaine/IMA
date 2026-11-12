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
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/user-service/Code.gs"), "utf8");
const recordFn = extractFunction(source, "getInstitutionalResponsibilityRecord_");
const resolveFn = extractFunction(source, "resolveActiveInternalResponsibility_");
const saveFn = extractFunction(source, "saveInstitutionalResponsibility");
const manageFn = extractFunction(source, "manageInternalRoleCatalog");
const catalogFn = extractFunction(source, "getInstitutionalResponsibilitiesCatalog");
const roleCatalogFn = extractFunction(source, "getInternalRoleCatalog");
const assignmentsFn = extractFunction(source, "getInternalRoleAssignments");
const verifiedFn = extractFunction(source, "getUserVerifiedRole");
const permissionFn = extractFunction(source, "validateRolePermission");

const roleHeaders = ["RolInternoID","CodigoInterno","NombreResponsabilidad","Descripcion","Departamento","AreaAcademica","TipoResponsabilidad","VigenciaMeses","PermiteSuplencia","Estado","CreadoPor","FechaCreacion","FechaActualizacion","ResponsibilityID"];
const capabilityHeaders = ["ResponsibilityID","Nombre","Descripcion","ModulosJSON","CapacidadesJSON","Estado","CreadoPor","FechaActualizacion"];
const roleRows = [roleHeaders,["RI-1","R-COORD","Coordinación","Supervisión","DEP-A","AREA-A","Academica",12,"No","Activo","U-ADMIN","2026-01-01","2026-01-01","RESP-ACA"]];
const capabilityRows = [capabilityHeaders,["RESP-ACA","Coordinación académica","Metadatos de función",'["mod_coordinacion"]','["CAP_CONSULTAR","CAP_ADMINISTRAR"]',"Activa","U-ADMIN","2026-01-01"]];
const scopeHeaders = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID","InstitutionID","MembershipID","ResponsibilityID"];
const scopeRows = [scopeHeaders,["A-1","U-1","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-1","RI-1"]];

function spreadsheet() {
  return { getSheetByName(name) {
    if (name === "CatalogoRolesInternos") return { getDataRange: () => ({ getValues: () => roleRows.map(r => r.slice()) }) };
    if (name === "ResponsabilidadesInstitucionales") return { getDataRange: () => ({ getValues: () => capabilityRows.map(r => r.slice()) }) };
    if (name === "AsignacionesAmbitosRoles") return { getDataRange: () => ({ getValues: () => scopeRows.map(r => r.slice()) }) };
    return null;
  }};
}
const joinCtx = { normalizeString: v => String(v || "").trim().toLowerCase(), SPREADSHEET_ID:"LOCAL", getIdentityInstitutionId_:()=>"INST-1", SpreadsheetApp:{openById:()=>spreadsheet()} };
vm.runInNewContext(recordFn + "\n" + resolveFn + "\n" + roleCatalogFn + "\n" + assignmentsFn + "\nthis.resolveActiveInternalResponsibility_=resolveActiveInternalResponsibility_;this.getInternalRoleCatalog=getInternalRoleCatalog;this.getInternalRoleAssignments=getInternalRoleAssignments;", joinCtx);
const linked = joinCtx.resolveActiveInternalResponsibility_(spreadsheet(),"RI-1");
assert.equal(linked.institutionalResponsibilityId,"RESP-ACA");
assert.deepEqual(Array.from(linked.institutionalResponsibility.capabilities),["CAP_CONSULTAR","CAP_ADMINISTRAR"],"capabilities are exposed as organizational metadata");
assert.equal(joinCtx.resolveActiveInternalResponsibility_(spreadsheet(),"RI-MISSING"),null,"unknown internal responsibilities fail closed");
const roleCatalog = joinCtx.getInternalRoleCatalog({});
assert.equal(roleCatalog.data[0].responsibilityId,"RESP-ACA");
assert.equal(roleCatalog.data[0].institutionalResponsibility.capabilities.includes("CAP_ADMINISTRAR"),true);
const assignmentList = joinCtx.getInternalRoleAssignments({userId:"U-1",roleId:"Director",membershipId:"MEM-1"});
assert.equal(assignmentList.status,"success");
assert.equal(assignmentList.data.length,1);
assert.equal(assignmentList.data[0].roleId,"Director");
assert.equal(assignmentList.data[0].rolInternoId,"RI-1","the internal responsibility comes from ResponsibilityID, not the RBAC RoleID column");
assert.equal(assignmentList.data[0].responsibility.institutionalResponsibilityId,"RESP-ACA");
assert.equal(joinCtx.getInternalRoleAssignments({userId:"U-1",roleId:"Director",membershipId:"MEM-2"}).data.length,0,"another membership cannot read the assignment");

const authClaims = { "valid-admin": {userId:"U-ADMIN",role:"Administrador"}, "valid-hr": {userId:"U-HR",role:"RecursosHumanos"} };
const authCtx = {
  verifySessionToken: token => authClaims[token] || null,
  getUserVerifiedRole: undefined,
  getOrCreateSheet: (_ss,name) => name === "ResponsabilidadesInstitucionales" ? responsibilitySheet : roleSheet,
  SpreadsheetApp: {openById:()=>({getSheetByName:name=>name==="ResponsabilidadesInstitucionales"?{getDataRange:()=>({getValues:()=>capabilityRows}),getLastRow:()=>capabilityRows.length}:null})},
  SPREADSHEET_ID:"LOCAL",
  Utilities:{getUuid:()=>"11111111-2222-3333-4444-555555555555"},
  normalizeString:v=>String(v||"").trim().toLowerCase(),
  recordEntityChangeLog:()=>{},
  logStructuredEvent:()=>{}
};
const responsibilitySheet = {
  getLastRow:()=>capabilityRows.length,
  getDataRange:()=>({getValues:()=>capabilityRows.map(r=>r.slice())}),
  appendRow:r=>capabilityRows.push(r.slice()),
  getRange:(row,col,numRows,numCols)=>({setValues:values=>{capabilityRows[row-1]=values[0].slice();}})
};
const roleSheet = {
  getDataRange:()=>({getValues:()=>roleRows.map(r=>r.slice())}),
  getRange:(row,col,numRows,numCols)=>({setValue:v=>{roleRows[row-1][col-1]=v;},setValues:values=>{roleRows[row-1]=values[0].slice();}}),
  appendRow:r=>roleRows.push(r.slice())
};
vm.runInNewContext(verifiedFn + "\n" + saveFn + "\n" + manageFn + "\nthis.saveInstitutionalResponsibility=saveInstitutionalResponsibility;this.manageInternalRoleCatalog=manageInternalRoleCatalog;", authCtx);
const spoofedSave = authCtx.saveInstitutionalResponsibility({authRole:"Administrador",role:"Administrador",name:"No autorizado"});
assert.equal(spoofedSave.code,"AUTH_PERMISSION_DENIED","client-supplied roles cannot authorize responsibility catalog writes");
const saved = authCtx.saveInstitutionalResponsibility({sessionToken:"valid-admin",name:"Coordinación de área",modules:["mod_coord"],capabilities:["CAP_ADMINISTRAR"]});
assert.equal(saved.status,"success");
assert.equal(capabilityRows.at(-1)[6],"U-ADMIN","audit actor is derived from verified identity");
const spoofedManage = authCtx.manageInternalRoleCatalog({authRole:"RecursosHumanos",nombreResponsabilidad:"Rol falso"});
assert.equal(spoofedManage.code,"AUTH_PERMISSION_DENIED","client-supplied roles cannot authorize internal role writes");
const managed = authCtx.manageInternalRoleCatalog({sessionToken:"valid-hr",nombreResponsabilidad:"Supervisor",responsibilityId:saved.responsibilityId});
assert.equal(managed.status,"success");
assert.equal(roleRows.at(-1)[13],saved.responsibilityId,"internal roles persist an explicit link to an active institutional responsibility");

const emptyCatalogCtx = { SPREADSHEET_ID:"LOCAL", SpreadsheetApp:{openById:()=>({getSheetByName:()=>null})} };
vm.runInNewContext(catalogFn + "\nthis.getInstitutionalResponsibilitiesCatalog=getInstitutionalResponsibilitiesCatalog;",emptyCatalogCtx);
const emptyCatalog = emptyCatalogCtx.getInstitutionalResponsibilitiesCatalog({});
assert.equal(emptyCatalog.status,"success");
assert.equal(emptyCatalog.configured,false);
assert.deepEqual(Array.from(emptyCatalog.responsabilidades),[],"unconfigured responsibilities are not fabricated as active records");

const permissionCtx = {
  PUBLIC_ACTIONS:[], IDENTITY_MANAGER_ACTIONS_:[], IDENTITY_MANAGER_ROLES_:[],
  getUserVerifiedRole:()=> "Director",
  validateContextualAccess:()=>({authorized:true}),
  getDynamicPermissionsForRole:()=>null,
  ROLE_PERMISSIONS:{},
  hasActiveDelegationForAction:()=>null,
  logStructuredEvent:()=>{}
};
vm.runInNewContext(permissionFn + "\nthis.validateRolePermission=validateRolePermission;",permissionCtx);
const deniedByRbac = permissionCtx.validateRolePermission("approveFinancialRecords",{});
assert.equal(deniedByRbac.authorized,false,"CAP_ADMINISTRAR in an organizational responsibility does not grant RBAC permission");
permissionCtx.getDynamicPermissionsForRole=()=>true;
assert.equal(permissionCtx.validateRolePermission("approveFinancialRecords",{}).authorized,true,"only an explicit RBAC matrix grant authorizes the action");

console.log("Internal responsibility RBAC contract: verified-identity writes, linked active responsibility metadata, tenant/membership assignment filtering, no fabricated catalog fallback, and strict separation between capabilities and RBAC permissions passed.");
