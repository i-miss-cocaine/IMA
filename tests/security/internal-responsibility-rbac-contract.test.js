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
  var claims = token === "session-director"
    ? {userId:"U-LIFE",role:"Director",membershipId:"MEM-LIFE",institutionId:"INST-1"}
    : (token === "session-auditor"
      ? {userId:"U-LIFE",role:"Auditor",membershipId:"MEM-AUD",institutionId:"INST-1"}
      : null);
  if (!claims) return null;
  var active = resolveUserRoleMembership_(claims.userId,claims.role,claims.institutionId,claims.membershipId);
  return active ? claims : null;
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


// C1.624: responsibility capabilities remain descriptive metadata; malformed or ambiguous catalog records fail closed.
const catalogFixture = rows => {
  const ctx = {SPREADSHEET_ID:"LOCAL",SpreadsheetApp:{openById:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())})})})}};
  vm.runInNewContext(catalogFn+"\nthis.getInstitutionalResponsibilitiesCatalog=getInstitutionalResponsibilitiesCatalog;",ctx);
  return ctx.getInstitutionalResponsibilitiesCatalog({});
};
const duplicateResponsibilityRows=[capabilityHeaders,capabilityRows[1].slice(),capabilityRows[1].slice()];
assert.deepEqual(Array.from(catalogFixture(duplicateResponsibilityRows).responsabilidades),[],"duplicate ResponsibilityIDs are excluded rather than first-row-wins");
const malformedCapabilityRows=[capabilityHeaders,capabilityRows[1].slice()];
malformedCapabilityRows[1][4]='["CAP_ADMINISTRAR",{"permission":"approveFinancialRecords"}]';
assert.deepEqual(Array.from(catalogFixture(malformedCapabilityRows).responsabilidades),[],"non-string capability metadata is rejected by the catalog reader");
const duplicateCapabilityRows=[capabilityHeaders,capabilityRows[1].slice()];
duplicateCapabilityRows[1][4]='["CAP_ADMINISTRAR"," CAP_ADMINISTRAR "]';
assert.deepEqual(Array.from(catalogFixture(duplicateCapabilityRows).responsabilidades),[],"duplicate normalized capability identifiers are rejected");
const malformedRecordRows=[capabilityHeaders,malformedCapabilityRows[1].slice()];
const malformedRecordCtx={getSheetByName:()=>({getDataRange:()=>({getValues:()=>malformedRecordRows.map(r=>r.slice())})})};
const malformedRecord = (() => {
  const ctx={};
  vm.runInNewContext(recordFn+"\nthis.getInstitutionalResponsibilityRecord_=getInstitutionalResponsibilityRecord_;",ctx);
  return ctx.getInstitutionalResponsibilityRecord_(malformedRecordCtx,"RESP-ACA");
})();
assert.equal(malformedRecord,null,"malformed capability metadata cannot resolve an effective responsibility");
const duplicateRoleRows=[roleHeaders,roleRows[1].slice(),roleRows[1].slice()];
const duplicateRoleCtx={SPREADSHEET_ID:"LOCAL",normalizeString:v=>String(v||"").trim().toLowerCase(),SpreadsheetApp:{openById:()=>({getSheetByName:name=>({getDataRange:()=>({getValues:()=>(name==="CatalogoRolesInternos"?duplicateRoleRows:capabilityRows).map(r=>r.slice())})})})}};
vm.runInNewContext(recordFn+"\n"+roleCatalogFn+"\nthis.getInternalRoleCatalog=getInternalRoleCatalog;",duplicateRoleCtx);
assert.deepEqual(Array.from(duplicateRoleCtx.getInternalRoleCatalog({}).data),[],"duplicate RolInternoIDs are excluded from the administrative role catalog");
const beforeDuplicateCapabilityWrite=capabilityRows.length;
const duplicateCapabilityWrite=authCtx.saveInstitutionalResponsibility({sessionToken:"valid-admin",name:"Duplicated capability",modules:["mod_unique"],capabilities:["CAP_ADMINISTRAR"," CAP_ADMINISTRAR "]});
assert.equal(duplicateCapabilityWrite.code,"RESPONSIBILITY_CATALOG_INVALID","writes reject duplicate capability identifiers after trimming");
assert.equal(capabilityRows.length,beforeDuplicateCapabilityWrite,"invalid capability metadata causes no partial catalog write");
permissionCtx.getDynamicPermissionsForRole=()=>null;
const capabilitySpoof = permissionCtx.validateRolePermission("approveFinancialRecords",{responsibility:{institutionalResponsibility:{capabilities:["CAP_ADMINISTRAR"]}}});
assert.equal(capabilitySpoof.authorized,false,"a responsibility capability does not authorize an action without an explicit RBAC matrix grant");
console.log("C1.624 responsibility/capability integrity contract: duplicate IDs, malformed capability metadata, duplicate normalized identifiers, no partial writes, and RBAC separation PASS.");


// C1.625: multi-role contexts must bind every scope to the exact signed RBAC role.
lifecycleSheets.AsignacionesAmbitosRoles = {getDataRange:()=>({getValues:()=>lifecycleScopeRows.map(r=>r.slice())})};
lifecycleMembershipRows.push(["MEM-AUD","U-LIFE","Auditor","INST-1","ACTIVE","","","U-ADMIN","2026-01-01","2026-01-01","",""]);
lifecycleResponsibilityRows.push(["RESP-AUD","Responsabilidad de auditoría","Metadatos",'["mod_auditoria"]','["CAP_CONSULTAR"]',"Activa","U-ADMIN","2026-01-01"]);
lifecycleInternalRoleRows.push(["RI-AUD","R-AUD","Auditoría","Consulta","DEP-B","AREA-B","Administrativa",12,"No","Activo","U-ADMIN","2026-01-01","2026-01-01","RESP-AUD"]);
lifecycleScopeRows.push(["A-AUD","U-LIFE","Auditor","DEPARTAMENTO",'["DEP-B"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-AUD","RI-AUD"]);
// A normalized alias is not the exact role bound to MEM-LIFE and must never inherit its scope.
lifecycleScopeRows.push(["A-ROLE-ALIAS","U-LIFE","Direct-or","DEPARTAMENTO",'["DEP-X"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-LIFE","RI-AUD"]);

const directorContext = lifecycleCtx.getUserContextScope({sessionToken:"session-director"});
assert.equal(directorContext.status,"success");
assert.deepEqual(Array.from(directorContext.departmentIds),["DEP-A"],"Director receives only the scope bound to the Director membership");
assert.equal(directorContext.scopes.length,1,"a punctuation-normalized role alias cannot inject another scope into the signed role context");
const auditorContext = lifecycleCtx.getUserContextScope({sessionToken:"session-auditor"});
assert.equal(auditorContext.status,"success");
assert.deepEqual(Array.from(auditorContext.departmentIds),["DEP-B"],"Auditor receives only the scope bound to the Auditor membership");
assert.equal(auditorContext.scopes.length,1,"the second active membership remains isolated from the first");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,1,"administrative listing and effective context agree on exact role/membership binding");
console.log("C1.625 multi-role context contract: exact signed role binding, cross-role isolation and alias rejection PASS.");

 
// C1.626: department selection and independent revocation/expiry across active memberships.
lifecycleScopeRows.push(["A-D2","U-LIFE","Director","DEPARTAMENTO",'["DEP-A2"]',"Activo","U-ADMIN","2026-01-01","","","No","","INST-1","MEM-LIFE","RI-LIFE"]);
const directorAllDepartments = lifecycleCtx.getUserContextScope({sessionToken:"session-director"});
assert.equal(directorAllDepartments.status,"success");
assert.deepEqual(Array.from(directorAllDepartments.departmentIds),["DEP-A","DEP-A2"],"the Director context exposes only departments bound to its membership");
const directorSelectedDepartment = lifecycleCtx.getUserContextScope({sessionToken:"session-director",activeDepartmentId:"DEP-A2"});
assert.equal(directorSelectedDepartment.status,"success");
assert.deepEqual(Array.from(directorSelectedDepartment.departmentIds),["DEP-A2"],"active department selection narrows the context to the selected authorized department");
assert.equal(directorSelectedDepartment.scopes.length,1);
assert.deepEqual(Array.from(directorSelectedDepartment.scopes[0].scopeValues),["DEP-A2"]);
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director",activeDepartmentId:"DEP-B"}).code,"ACTIVE_SCOPE_NOT_ASSIGNED","department selection cannot switch into another membership's department");
assert.deepEqual(Array.from(lifecycleCtx.getUserContextScope({sessionToken:"session-auditor"}).departmentIds),["DEP-B"],"department selection tests do not broaden the Auditor context");

// Revoking Director's membership must not revoke the same user's independent Auditor membership.
lifecycleMembershipRows[1][4]="REVOKED";
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"VERIFIED_IDENTITY_REQUIRED","revocation invalidates the session bound to the revoked membership");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"revoked membership assignments disappear from administrative listing");
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-auditor"}).status,"success","revoking Director membership leaves the independent Auditor membership active");
assert.deepEqual(Array.from(lifecycleCtx.getUserContextScope({sessionToken:"session-auditor"}).departmentIds),["DEP-B"]);
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Auditor",membershipId:"MEM-AUD"}).data.length,1,"the active Auditor assignment remains visible after Director revocation");
lifecycleMembershipRows[1][4]="ACTIVE";

// Expiry has the same per-membership isolation as explicit revocation.
lifecycleMembershipRows[1][6]=new Date("2000-01-01T00:00:00.000Z");
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"VERIFIED_IDENTITY_REQUIRED","expired Director membership invalidates its previously issued session");
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-auditor"}).status,"success","expiring Director membership does not invalidate Auditor membership");
assert.deepEqual(Array.from(lifecycleCtx.getUserContextScope({sessionToken:"session-auditor"}).departmentIds),["DEP-B"]);
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Auditor",membershipId:"MEM-AUD"}).data.length,1,"Auditor assignment remains active after Director membership expiry");
console.log("C1.626 multi-role context contract: active-department selection, cross-membership denial, independent revocation and expiry PASS.");

 
// C1.627: explicit RBAC permissions are resolved from the authenticated role membership, never from responsibility metadata.
lifecycleMembershipRows[1][6]="";
const rbacMatrixRows = [
  ["RoleID","PermissionID","Action","Permitted","Scope"],
  ["Director","P-DIR-APPROVE","approveFinancialRecords",true,"INST-1"],
  ["Auditor","P-AUD-APPROVE","approveFinancialRecords",false,"INST-1"],
  ["Auditor","P-AUD-AUDIT","viewAuditLogs",true,"INST-1"],
  ["Director","P-DIR-AUDIT","viewAuditLogs",false,"INST-1"]
];
const rbacCacheValues = {};
const rbacCache = {
  get:key=>Object.prototype.hasOwnProperty.call(rbacCacheValues,key)?rbacCacheValues[key]:null,
  put:(key,value)=>{rbacCacheValues[key]=value;}
};
const rbacCtx = {
  SPREADSHEET_ID:"LOCAL",
  PUBLIC_ACTIONS:[],
  IDENTITY_MANAGER_ACTIONS_:[],
  IDENTITY_MANAGER_ROLES_:[],
  ROLE_PERMISSIONS:{Director:[],Auditor:[]},
  getIdentityInstitutionId_:()=> "INST-1",
  getDynamicPermissionCacheKey_:()=> "rbac-c1-627",
  CacheService:{getScriptCache:()=>rbacCache},
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="MatrizPermisosRoles"?{
    getLastRow:()=>rbacMatrixRows.length,
    getDataRange:()=>({getValues:()=>rbacMatrixRows.map(row=>row.slice())})
  }:lifecycleSheets[name]||null})},
  validateContextualAccess:()=>({authorized:true}),
  hasActiveDelegationForAction:()=>null,
  logStructuredEvent:()=>{}
};
const rbacCode = `
const USER_ROLE_MEMBERSHIP_HEADERS_ = ${JSON.stringify(membershipHeaders)};
${membershipDateFn}
${configuredRoleFn}
${membershipStateFn}
${resolveMembershipFn}
${extractFunction(source,"resolveUserRoleMembership_")}
${extractFunction(source,"isConfiguredRbacRole_")}
${extractFunction(source,"getUserVerifiedRole")}
${extractFunction(source,"getDynamicPermissionsForRole")}
${extractFunction(source,"validateRolePermission")}
function verifySessionToken(token) {
  var claims = token === "session-director"
    ? {userId:"U-LIFE",role:"Director",membershipId:"MEM-LIFE",institutionId:"INST-1"}
    : (token === "session-auditor"
      ? {userId:"U-LIFE",role:"Auditor",membershipId:"MEM-AUD",institutionId:"INST-1"}
      : null);
  if (!claims) return null;
  return resolveUserRoleMembership_(claims.userId,claims.role,claims.institutionId,claims.membershipId) ? claims : null;
}
this.validateRolePermission=validateRolePermission;
`;
vm.runInNewContext(rbacCode,rbacCtx);
const directorApproval = rbacCtx.validateRolePermission("approveFinancialRecords",{sessionToken:"session-director"});
assert.equal(directorApproval.authorized,true,"Director receives only its explicit institution RBAC grant");
const auditorApproval = rbacCtx.validateRolePermission("approveFinancialRecords",{sessionToken:"session-auditor",responsibility:{institutionalResponsibility:{capabilities:["CAP_ADMINISTRAR"]}}});
assert.equal(auditorApproval.authorized,false,"Auditor cannot inherit Director approval and responsibility capabilities cannot elevate permission");
const auditorAudit = rbacCtx.validateRolePermission("viewAuditLogs",{sessionToken:"session-auditor"});
assert.equal(auditorAudit.authorized,true,"Auditor receives its explicit audit grant");
const directorAudit = rbacCtx.validateRolePermission("viewAuditLogs",{sessionToken:"session-director"});
assert.equal(directorAudit.authorized,false,"Director does not inherit Auditor audit grant");
lifecycleMembershipRows[1][4]="REVOKED";
assert.equal(rbacCtx.validateRolePermission("approveFinancialRecords",{sessionToken:"session-director"}).authorized,false,"revoking Director membership removes its explicit action grant");
assert.equal(rbacCtx.validateRolePermission("viewAuditLogs",{sessionToken:"session-auditor"}).authorized,true,"Director revocation does not remove Auditor's independent explicit grant");
lifecycleMembershipRows[1][4]="ACTIVE";
console.log("C1.627 explicit RBAC membership contract: role-specific grants/denials, no cross-role inheritance, capability non-elevation and independent revocation PASS.");

 
// C1.628: effective context and administrative assignment listing must resolve the same unique responsibility chain.
lifecycleMembershipRows[1][6]="";
const directorEffectiveForListing = lifecycleCtx.getUserContextScope({sessionToken:"session-director"});
const directorAdministrativeAssignments = lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"});
assert.equal(directorEffectiveForListing.status,"success");
assert.equal(directorAdministrativeAssignments.status,"success");
assert.equal(directorAdministrativeAssignments.data.length,2,"both active Director scopes are listed");
assert.deepEqual(
  Array.from(directorEffectiveForListing.scopes.map(scope=>scope.responsibilityId).sort()),
  Array.from(directorAdministrativeAssignments.data.map(item=>item.responsibilityId).sort()),
  "effective context and administrative listing expose the same responsibility IDs"
);
assert.equal(directorEffectiveForListing.scopes[0].responsibility.institutionalResponsibilityId,"RESP-LIFE");
assert.equal(directorAdministrativeAssignments.data[0].responsibility.institutionalResponsibilityId,"RESP-LIFE");

// A duplicate institutional ResponsibilityID makes the linked chain ambiguous and must fail closed in both readers.
lifecycleResponsibilityRows.push(lifecycleResponsibilityRows[1].slice());
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","duplicate ResponsibilityID removes effective scopes");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"duplicate ResponsibilityID is also excluded from administrative assignments");
lifecycleResponsibilityRows.pop();

// A duplicate internal role ID must likewise be rejected by both readers.
lifecycleInternalRoleRows.push(lifecycleInternalRoleRows[1].slice());
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","duplicate RolInternoID removes effective scopes");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"duplicate RolInternoID is excluded from administrative assignments");
lifecycleInternalRoleRows.pop();

// A dangling ResponsibilityID cannot be repaired by a valid role or scope row.
lifecycleInternalRoleRows[1][13]="RESP-MISSING";
assert.equal(lifecycleCtx.getUserContextScope({sessionToken:"session-director"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED","dangling institutional responsibility link denies effective context");
assert.equal(lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data.length,0,"dangling responsibility link is excluded from administrative listing");
lifecycleInternalRoleRows[1][13]="RESP-LIFE";
console.log("C1.628 responsibility-chain contract: effective/admin reader parity, duplicate responsibility/internal-role rejection and dangling-link fail-closed PASS.");

 
// C1.629: deterministic interleaving proves ScriptLock prevents duplicate concurrent scope creation.
const concurrentRows=[scopeHeaders];
const concurrentSheet={
  getLastRow:()=>concurrentRows.length,
  getDataRange:()=>({getValues:()=>concurrentRows.map(row=>row.slice())}),
  appendRow:row=>{concurrentRows.push(row.slice());},
  getRange:(row,col,nr,nc)=>({
    setValue:value=>{concurrentRows[row-1][col-1]=value;},
    setValues:values=>{for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)concurrentRows[row-1+i][col-1+j]=values[i][j];}
  })
};
let concurrentLockHeld=false, nestedAttempted=false, nestedConcurrentResult=null, concurrentLockReleases=0, concurrentUuid=0;
let concurrentCtx;
const concurrentLock={
  waitLock:()=>{
    if(concurrentLockHeld)throw new Error("WRITE_LOCK_BUSY");
    concurrentLockHeld=true;
    if(!nestedAttempted){
      nestedAttempted=true;
      nestedConcurrentResult=concurrentCtx.assignRoleScope(concurrentPayload);
    }
  },
  releaseLock:()=>{concurrentLockHeld=false;concurrentLockReleases++;}
};
concurrentCtx={
  SPREADSHEET_ID:"LOCAL",
  getIdentityInstitutionId_:()=>"INST-1",
  LockService:{getScriptLock:()=>concurrentLock},
  Utilities:{getUuid:()=>"CONCURRENT-"+(++concurrentUuid)},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>concurrentSheet})},
  getOrCreateSheet:()=>concurrentSheet,
  getUserRoleMembershipState_:()=>({hasRecords:true}),
  resolveUserRoleMembership_:(user,role,institution)=>({membershipId:"MEM-CONCURRENT",institutionId:institution,roleId:role}),
  resolveActiveInternalResponsibility_:(_ss,id)=>id==="RI-CONCURRENT"?{responsibilityId:id}:null,
  recordEntityChangeLog:()=>{},
  logStructuredEvent:()=>{}
};
vm.runInNewContext(assignScopeFn+"\nthis.assignRoleScope=assignRoleScope;",concurrentCtx);
const concurrentPayload={_verifiedRole:"Director",_verifiedUserId:"U-ADMIN",userId:"U-CONCURRENT",roleId:"Director",scopeType:"DEPARTAMENTO",scopeValues:["DEP-CONCURRENT"],responsibilityId:"RI-CONCURRENT"};
const firstConcurrentWrite=concurrentCtx.assignRoleScope(concurrentPayload);
assert.equal(firstConcurrentWrite.status,"success","the lock owner completes the assignment");
assert.equal(nestedConcurrentResult.code,"WRITE_LOCK_BUSY","the overlapping request is rejected while the first request owns ScriptLock");
assert.equal(concurrentRows.length,2,"overlapping requests create exactly one assignment row");
assert.equal(concurrentRows[1][1],"U-CONCURRENT");
assert.equal(concurrentRows[1][13],"MEM-CONCURRENT");
assert.equal(concurrentLockReleases,1,"only the lock owner releases the acquired lock");
const retryConcurrentWrite=concurrentCtx.assignRoleScope(concurrentPayload);
assert.equal(retryConcurrentWrite.status,"success");
assert.equal(retryConcurrentWrite.assignmentId,firstConcurrentWrite.assignmentId,"a retry after lock release reuses the stable assignment");
assert.equal(concurrentRows.length,2,"a retry does not append a duplicate assignment");
assert.equal(concurrentLockReleases,2,"both successful lock acquisitions are released");
console.log("C1.629 deterministic concurrency contract: overlapping scope writes serialize, busy request fails closed, retry is idempotent and no duplicate row is created PASS.");

 
// C1.630: effective context and administrative listing must apply identical date boundaries.
const NativeDateForTemporalContract = Date;
const fixedTemporalNow = NativeDateForTemporalContract.parse("2026-11-12T18:00:00.000Z");
const FixedTemporalDate = class extends NativeDateForTemporalContract {
  constructor(...args) { if(args.length===0) super(fixedTemporalNow); else super(...args); }
  static now() { return fixedTemporalNow; }
};
const priorTemporalSheet = lifecycleSheets.AsignacionesAmbitosRoles;
lifecycleCtx.Date = FixedTemporalDate;
const temporalRows = [scopeHeaders,["A-TEMP","U-LIFE","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","U-ADMIN","2026-01-01","2026-11-12T18:00:00.000Z","2026-11-12T18:00:00.000Z","No","","INST-1","MEM-LIFE","RI-LIFE"]];
lifecycleSheets.AsignacionesAmbitosRoles = {getDataRange:()=>({getValues:()=>temporalRows.map(row=>row.slice())})};
const assertTemporalParity = (startAt,endAt,expectedActive,label) => {
  temporalRows[1][8]=startAt;
  temporalRows[1][9]=endAt;
  const effective = lifecycleCtx.getUserContextScope({sessionToken:"session-director"});
  const listed = lifecycleCtx.getInternalRoleAssignments({userId:"U-LIFE",roleId:"Director",membershipId:"MEM-LIFE"}).data;
  assert.equal(effective.status==="success",expectedActive,label+" effective context");
  assert.equal(listed.length,expectedActive?1:0,label+" administrative listing");
};
assertTemporalParity("2026-11-12T18:00:00.000Z","2026-11-12T18:00:00.000Z",true,"exact start/end boundary is inclusive");
assertTemporalParity("2026-11-12T18:00:00.001Z","",false,"future start is inactive");
assertTemporalParity("","2026-11-11T23:59:59.999Z",false,"past end is inactive");
assertTemporalParity("invalid-date","",false,"invalid start is rejected");
assertTemporalParity("","invalid-date",false,"invalid end is rejected");
assertTemporalParity("","",true,"empty dates mean unbounded validity");
assertTemporalParity("","0",false,"epoch end date is expired and cannot be treated as an empty date");
lifecycleSheets.AsignacionesAmbitosRoles = priorTemporalSheet;
delete lifecycleCtx.Date;
console.log("C1.630 temporal parity contract: inclusive boundaries, future/past dates, invalid dates, empty bounds and epoch-valued expiry parity PASS.");





