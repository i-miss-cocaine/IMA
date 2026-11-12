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
const assignScopeFn = extractFunction(source, "assignRoleScope");
const verifiedFn = extractFunction(source, "getUserVerifiedRole");
const membershipDateFn = extractFunction(source, "parseUserRoleMembershipDate_");
const membershipStateFn = extractFunction(source, "getUserRoleMembershipState_");
const resolveMembershipFn = extractFunction(source, "resolveUserRoleMembership_");
const configuredRoleFn = extractFunction(source, "isConfiguredRbacRole_");
const permissionFn = extractFunction(source, "validateRolePermission");

const roleHeaders = ["RolInternoID","CodigoInterno","NombreResponsabilidad","Descripcion","Departamento","AreaAcademica","TipoResponsabilidad","VigenciaMeses","PermiteSuplencia","Estado","CreadoPor","FechaCreacion","FechaActualizacion","ResponsibilityID"];
const capabilityHeaders = ["ResponsibilityID","Nombre","Descripcion","ModulosJSON","CapacidadesJSON","Estado","CreadoPor","FechaActualizacion"];
const roleRows = [roleHeaders,["RI-1","R-COORD","Coordinación","Supervisión","DEP-A","AREA-A","Academica",12,"No","Activo","U-ADMIN","2026-01-01","2026-01-01","RESP-ACA"]];
const capabilityRows = [capabilityHeaders,["RESP-ACA","Coordinación académica","Metadatos de función",'["mod_coordinacion"]','["CAP_CONSULTAR","CAP_ADMINISTRAR"]',"Activa","U-ADMIN","2026-01-01"]];
const scopeHeaders = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID","InstitutionID","MembershipID","ResponsibilityID"];
const scopeRows = [scopeHeaders,["A-1","U-1","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-1","RI-1"]];
const membershipHeaders = ["MembershipID","UserID","RoleID","InstitutionID","Status","StartAt","EndAt","CreatedBy","CreatedAt","UpdatedAt","RevokedBy","RevokedAt"];
const membershipRows = [membershipHeaders,["MEM-1","U-1","Director","INST-1","ACTIVE","","","U-ADMIN","2026-01-01","2026-01-01","",""]];

function spreadsheet() {
  return { getSheetByName(name) {
    if (name === "CatalogoRolesInternos") return { getDataRange: () => ({ getValues: () => roleRows.map(r => r.slice()) }) };
    if (name === "ResponsabilidadesInstitucionales") return { getDataRange: () => ({ getValues: () => capabilityRows.map(r => r.slice()) }) };
    if (name === "AsignacionesAmbitosRoles") return { getDataRange: () => ({ getValues: () => scopeRows.map(r => r.slice()) }) };
    if (name === "MembresiasRolesRBAC") return { getDataRange: () => ({ getValues: () => membershipRows.map(r => r.slice()) }) };
    if (name === "MatrizPermisosRoles") return null;
    return null;
  }};
}
const joinCtx = { normalizeString: v => String(v || "").trim().toLowerCase(), SPREADSHEET_ID:"LOCAL", ROLE_PERMISSIONS:{Director:true}, getIdentityInstitutionId_:()=>"INST-1", SpreadsheetApp:{openById:()=>spreadsheet()} };
vm.runInNewContext("const USER_ROLE_MEMBERSHIP_HEADERS_ = "+JSON.stringify(membershipHeaders)+";\n"+membershipDateFn+"\n"+configuredRoleFn+"\n"+membershipStateFn+"\n"+resolveMembershipFn+"\n"+recordFn+"\n"+resolveFn+"\n"+roleCatalogFn+"\n"+assignmentsFn+"\nthis.resolveActiveInternalResponsibility_=resolveActiveInternalResponsibility_;this.getInternalRoleCatalog=getInternalRoleCatalog;this.getInternalRoleAssignments=getInternalRoleAssignments;", joinCtx);
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
let responsibilityLockBusy = false, responsibilityLockReleases = 0;
const authCtx = {
  LockService: { getScriptLock: () => ({ waitLock: () => { if (responsibilityLockBusy) throw new Error("WRITE_LOCK_BUSY"); }, releaseLock: () => { responsibilityLockReleases++; } }) },
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
vm.runInNewContext(verifiedFn + "\n" + recordFn + "\n" + saveFn + "\n" + manageFn + "\nthis.saveInstitutionalResponsibility=saveInstitutionalResponsibility;this.manageInternalRoleCatalog=manageInternalRoleCatalog;", authCtx);
const spoofedSave = authCtx.saveInstitutionalResponsibility({authRole:"Administrador",role:"Administrador",name:"No autorizado"});
assert.equal(spoofedSave.code,"AUTH_PERMISSION_DENIED","client-supplied roles cannot authorize responsibility catalog writes");
const saved = authCtx.saveInstitutionalResponsibility({sessionToken:"valid-admin",name:"Coordinación de área",modules:["mod_coord"],capabilities:["CAP_ADMINISTRAR"]});
assert.equal(saved.status,"success");
assert.equal(capabilityRows.at(-1)[6],"U-ADMIN","audit actor is derived from verified identity");
const capabilityCountBeforeBusyWrite = capabilityRows.length;
responsibilityLockBusy = true;
const busySave = authCtx.saveInstitutionalResponsibility({sessionToken:"valid-admin",name:"No debe guardarse",modules:[],capabilities:[]});
assert.equal(busySave.code,"WRITE_LOCK_BUSY");
assert.equal(capabilityRows.length,capabilityCountBeforeBusyWrite,"a busy write lock prevents concurrent responsibility catalog writes");
responsibilityLockBusy = false;
const spoofedManage = authCtx.manageInternalRoleCatalog({authRole:"RecursosHumanos",nombreResponsabilidad:"Rol falso"});
assert.equal(spoofedManage.code,"AUTH_PERMISSION_DENIED","client-supplied roles cannot authorize internal role writes");
const managed = authCtx.manageInternalRoleCatalog({sessionToken:"valid-hr",nombreResponsabilidad:"Supervisor",responsibilityId:saved.responsibilityId});
assert.equal(managed.status,"success");
assert.equal(roleRows.at(-1)[13],saved.responsibilityId,"internal roles persist an explicit link to an active institutional responsibility");
const roleCountBeforeBusyWrite = roleRows.length;
responsibilityLockBusy = true;
const busyManage = authCtx.manageInternalRoleCatalog({sessionToken:"valid-hr",nombreResponsabilidad:"No debe guardarse"});
assert.equal(busyManage.code,"WRITE_LOCK_BUSY");
assert.equal(roleRows.length,roleCountBeforeBusyWrite,"a busy write lock prevents concurrent internal role catalog writes");
responsibilityLockBusy = false;
const sameRole = authCtx.manageInternalRoleCatalog({sessionToken:"valid-hr",nombreResponsabilidad:"Supervisor",responsibilityId:saved.responsibilityId});
assert.equal(sameRole.rolInternoId,managed.rolInternoId);
assert.equal(roleRows.length,roleCountBeforeBusyWrite,"repeated role creation is idempotent under the script lock");

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

 
// C1.621 lifecycle contract: responsibility and membership revocation must remove effective access.
const lifecycleMembershipRows = [membershipHeaders,["MEM-LIFE","U-LIFE","Director","INST-1","ACTIVE","","","U-ADMIN","2026-01-01","2026-01-01","",""]];
const lifecycleResponsibilityRows = [capabilityHeaders,["RESP-LIFE","Responsabilidad vigente","Metadatos",'["mod_coord"]','["CAP_CONSULTAR"]',"Activa","U-ADMIN","2026-01-01"]];
const lifecycleInternalRoleRows = [roleHeaders,["RI-LIFE","R-LIFE","Coordinación","Descripción","DEP-A","AREA-A","Academica",12,"No","Activo","U-ADMIN","2026-01-01","2026-01-01","RESP-LIFE"]];
const lifecycleScopeRows = [scopeHeaders,["A-LIFE","U-LIFE","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-LIFE","RI-LIFE"]];
const lifecycleSheets = {
  MembresiasRolesRBAC:{getDataRange:()=>({getValues:()=>lifecycleMembershipRows.map(r=>r.slice())})},
  MatrizPermisosRoles:null,
  ResponsabilidadesInstitucionales:{getDataRange:()=>({getValues:()=>lifecycleResponsibilityRows.map(r=>r.slice())})},
  CatalogoRolesInternos:{getDataRange:()=>({getValues:()=>lifecycleInternalRoleRows.map(r=>r.slice())})},
  AsignacionesAmbitosRoles:{getDataRange:()=>({getValues:()=>lifecycleScopeRows.map(r=>r.slice())})}
};
const lifecycleCtx = {
  SPREADSHEET_ID:"LOCAL",
  ROLE_PERMISSIONS:{Director:true,Auditor:true},
  getIdentityInstitutionId_:()=>"INST-1",
  normalizeString:v=>String(v||"").trim().toLowerCase(),
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>lifecycleSheets[name]||null})}
};
const lifecycleCode = `
const USER_ROLE_MEMBERSHIP_HEADERS_ = ${JSON.stringify(membershipHeaders)};
${membershipDateFn}
${configuredRoleFn}
${membershipStateFn}
${resolveMembershipFn}
${recordFn}
${resolveFn}
${assignmentsFn}
${extractFunction(source,"getUserContextScope")}
function verifySessionToken(token) {
  if (token !== "session-director") return null;
  var active = resolveUserRoleMembership_("U-LIFE","Director","INST-1","MEM-LIFE");
  return active ? {userId:"U-LIFE",role:"Director",membershipId:"MEM-LIFE",institutionId:"INST-1"} : null;
}
function getUserVerifiedRole(payload) {
  var claims = verifySessionToken(payload && payload.sessionToken);
  if (!claims) return "NO_ACCESS";
  payload._verifiedUserId = claims.userId;
  return claims.role;
}
this.getUserContextScope = getUserContextScope;
this.getInternalRoleAssignments = getInternalRoleAssignments;
`;
vm.runInNewContext(lifecycleCode,lifecycleCtx);
const liveContext = lifecycleCtx.getUserContextScope({sessionToken:"session-director"});
assert.equal(liveContext.status,"success","active membership and responsibility resolve a live scope");
assert.deepEqual(Array.from(liveContext.departmentIds),["DEP-A"]);
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,1);

lifecycleResponsibilityRows[1][5]="Inactiva";
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","deactivated institutional responsibility removes effective scope");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"assignment listing hides a deactivated responsibility");
lifecycleResponsibilityRows[1][5]="Activa";

lifecycleInternalRoleRows[1][9]="Inactivo";
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","deactivated internal role removes effective scope");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"assignment listing hides an inactive internal role");
lifecycleInternalRoleRows[1][9]="Activo";

lifecycleMembershipRows[1][4]="REVOKED";
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"VERIFIED_IDENTITY_REQUIRED","revoked membership invalidates the previously issued session");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"assignment listing hides a revoked membership");
lifecycleMembershipRows[1][4]="ACTIVE";

lifecycleMembershipRows[1][2]="Auditor";
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"VERIFIED_IDENTITY_REQUIRED","role change invalidates the previous role-bound session");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"assignment listing hides an assignment after its role changes");
lifecycleMembershipRows[1][2]="Director";

lifecycleMembershipRows[1][6]=new Date("2000-01-01T00:00:00.000Z");
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"VERIFIED_IDENTITY_REQUIRED","expired membership invalidates the previous session");
console.log("C1.621 lifecycle contract: responsibility deactivation, internal-role deactivation, membership revocation, role changes and expiry remove effective scope and assignment visibility.");


// C1.622: stable assignment identity, explicit reassignment, duplicate detection and tenant isolation.
const writeRows = [scopeHeaders,["A-UPDATE","U-1","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ORIGINAL","2026-01-01","","","No","","INST-1","MEM-1","RI-1"]];
const writeSheet = {
  getLastRow:()=>writeRows.length,
  getDataRange:()=>({getValues:()=>writeRows.map(r=>r.slice())}),
  appendRow:row=>{writeRows.push(row.slice());},
  getRange:(row,col,numRows,numCols)=>({
    setValue:value=>{writeRows[row-1][col-1]=value;},
    setValues:values=>{for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)writeRows[row-1+i][col-1+j]=values[i][j];}
  })
};
let uuidCounter=0, lockReleased=0, changeEvents=[];
const writerCtx = {
  SPREADSHEET_ID:"LOCAL",getIdentityInstitutionId_:()=>"INST-1",
  LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{lockReleased++;}})},
  Utilities:{getUuid:()=>"UUID-"+(++uuidCounter)},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>writeSheet})},
  getOrCreateSheet:()=>writeSheet,
  getUserRoleMembershipState_:(user,institution)=>({hasRecords:true}),
  resolveUserRoleMembership_:(user,role,institution)=>({membershipId:writerCtx.membershipForUser||"MEM-1",institutionId:institution,roleId:role}),
  resolveActiveInternalResponsibility_:(ss,id)=>["RI-1","RI-2"].includes(id)?{responsibilityId:id}:null,
  recordEntityChangeLog:(...args)=>changeEvents.push(args),
  logStructuredEvent:()=>{}
};
writerCtx.membershipForUser="MEM-1";
vm.runInNewContext(assignScopeFn+"\nthis.assignRoleScope=assignRoleScope;",writerCtx);
const writerPayload={_verifiedRole:"Director",_verifiedUserId:"U-ADMIN",userId:"U-1",roleId:"Director",scopeType:"DEPARTAMENTO",scopeValues:["DEP-B"],responsibilityId:"RI-2"};
const reassignedResponsibility=writerCtx.assignRoleScope(writerPayload);
assert.equal(reassignedResponsibility.status,"success");
assert.equal(reassignedResponsibility.assignmentId,"A-UPDATE","responsibility update preserves stable assignment ID");
assert.equal(writeRows.length,2,"responsibility update does not create a residual duplicate row");
assert.equal(writeRows[1][14],"RI-2");
assert.equal(writeRows[1][4],'["DEP-B"]');
assert.equal(writeRows[1][6],"U-ORIGINAL","update preserves original creator");
assert.equal(changeEvents[0][2].responsibilityId,"RI-1","audit before-image includes previous responsibility");
assert.equal(changeEvents[0][3].responsibilityId,"RI-2","audit after-image includes new responsibility");

writerCtx.membershipForUser="MEM-2";
const membershipTransfer=writerCtx.assignRoleScope({...writerPayload,assignmentId:"A-UPDATE",scopeValues:["DEP-C"],responsibilityId:"RI-1"});
assert.equal(membershipTransfer.status,"success","explicit assignment ID permits controlled membership reassignment");
assert.equal(writeRows.length,2,"membership reassignment updates the selected row, not append a duplicate");
assert.equal(writeRows[1][13],"MEM-2");
assert.equal(writeRows[1][14],"RI-1");

const duplicateRows=[scopeHeaders,writeRows[1].slice(),writeRows[1].slice()];
const duplicateSheet=Object.assign({},writeSheet,{getLastRow:()=>duplicateRows.length,getDataRange:()=>({getValues:()=>duplicateRows.map(r=>r.slice())}),getRange:(row,col,nr,nc)=>({setValues:values=>{for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)duplicateRows[row-1+i][col-1+j]=values[i][j];},setValue:value=>{duplicateRows[row-1][col-1]=value;}})});
writerCtx.getOrCreateSheet=()=>duplicateSheet;
const duplicateResult=writerCtx.assignRoleScope({...writerPayload,assignmentId:"A-UPDATE"});
assert.equal(duplicateResult.code,"ROLE_SCOPE_ASSIGNMENT_DUPLICATE");
assert.equal(duplicateRows.length,3,"duplicate detection performs no write");

const tenantRows=[scopeHeaders,["A-OTHER","U-1","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-OTHER","MEM-OTHER","RI-1"]];
const tenantSheet=Object.assign({},writeSheet,{getLastRow:()=>tenantRows.length,getDataRange:()=>({getValues:()=>tenantRows.map(r=>r.slice())}),getRange:(row,col,nr,nc)=>({setValues:values=>{for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)tenantRows[row-1+i][col-1+j]=values[i][j];},setValue:value=>{tenantRows[row-1][col-1]=value;}})});
writerCtx.getOrCreateSheet=()=>tenantSheet;
const tenantResult=writerCtx.assignRoleScope({...writerPayload,assignmentId:"A-OTHER"});
assert.equal(tenantResult.code,"ROLE_SCOPE_ASSIGNMENT_OWNERSHIP_MISMATCH","an assignment ID from another institution cannot be reassigned");
assert.equal(tenantRows[1][12],"INST-OTHER","tenant isolation preserves the foreign row unchanged");

const stableRows=[scopeHeaders,["A-STABLE","U-1","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-2","RI-1"]];
const stableSheet=Object.assign({},writeSheet,{getLastRow:()=>stableRows.length,getDataRange:()=>({getValues:()=>stableRows.map(r=>r.slice())}),getRange:(row,col,nr,nc)=>({setValues:values=>{for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)stableRows[row-1+i][col-1+j]=values[i][j];},setValue:value=>{stableRows[row-1][col-1]=value;}})});
writerCtx.getOrCreateSheet=()=>stableSheet;
const retry1=writerCtx.assignRoleScope({...writerPayload,assignmentId:undefined,responsibilityId:"RI-1"});
const retry2=writerCtx.assignRoleScope({...writerPayload,assignmentId:undefined,responsibilityId:"RI-2"});
assert.equal(retry1.assignmentId,"A-STABLE");
assert.equal(retry2.assignmentId,"A-STABLE","retry with changed responsibility is idempotent on stable membership scope key");
assert.equal(stableRows.length,2);
assert.equal(stableRows[1][14],"RI-2");
assert.ok(lockReleased>=5,"every writer path releases its ScriptLock");
console.log("C1.622 assignment lifecycle contract: stable-ID responsibility update, explicit membership reassignment, idempotent retry, duplicate fail-closed behavior, tenant isolation and lock release PASS.");


// C1.623: listing and effective-context readers reject transitional or ambiguous assignment rows.
lifecycleMembershipRows[1][6] = ""; // restore active membership after the expiry case above
const intermediateScopeHeaders = scopeHeaders.slice(0,14);
const intermediateScopeRows = [intermediateScopeHeaders,["A-INTERMEDIATE","U-LIFE","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-LIFE"]];
lifecycleSheets.AsignacionesAmbitosRoles = {getDataRange:()=>({getValues:()=>intermediateScopeRows.map(r=>r.slice())})};
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"the intermediate membership schema cannot expose an assignment without ResponsibilityID");
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","the effective-context reader rejects the same intermediate schema");

const duplicateAssignmentRows = [scopeHeaders,lifecycleScopeRows[1].slice(),lifecycleScopeRows[1].slice()];
lifecycleSheets.AsignacionesAmbitosRoles = {getDataRange:()=>({getValues:()=>duplicateAssignmentRows.map(r=>r.slice())})};
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"duplicate AssignmentIDs are excluded from administrative listing");
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","duplicate AssignmentIDs cannot create effective scopes");
console.log("C1.623 reader-integrity contract: transitional-schema consistency and duplicate AssignmentID fail-closed behavior PASS.");
