const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });

const OWNER_HEADERS = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
const GRANT_HEADERS = ["InstitutionID","GrantID","ResourceType","ResourceID","OwnerDepartmentID","TargetDepartmentID","AllowedFieldsJSON","AllowedDocumentIDsJSON","AuthorizedBy","AuthorizedAt","ValidFrom","ExpiresAt","Status","RevokedAt","RevokedBy"];
const LOG_HEADERS = ["ID","Timestamp","Servicio","Función","Severidad","CódigoError","Mensaje","DatosPayload","RolUsuario"];
const now = Date.now();
function makeSheet(rows) {
  const data=(rows||[]).map(row=>row.slice());
  return {
    getLastRow(){return data.length;},
    getDataRange(){return {getValues:()=>data.map(row=>row.slice())};},
    appendRow(row){data.push(row.slice());},
    snapshot(){return data.map(row=>row.slice());}
  };
}
function ownerRow(institution="I1",department="D1",id="DOC-1") {
  return ["OWN-1",institution,"EXPEDIENTE",id,department,"ACTIVE","U0",new Date(now).toISOString(),new Date(now).toISOString()];
}
function grantRow(overrides={}) {
  const row={InstitutionID:"I1",GrantID:"DRG-1",ResourceType:"EXPEDIENTE",ResourceID:"DOC-1",
    OwnerDepartmentID:"D1",TargetDepartmentID:"D2",AllowedFieldsJSON:'["nombre"]',
    AllowedDocumentIDsJSON:'["DOC-A"]',AuthorizedBy:"U0",AuthorizedAt:new Date(now-1000).toISOString(),
    ValidFrom:new Date(now-1000).toISOString(),ExpiresAt:new Date(now+86400000).toISOString(),
    Status:"ACTIVE",RevokedAt:"",RevokedBy:""};
  Object.assign(row,overrides);
  return [row.InstitutionID,row.GrantID,row.ResourceType,row.ResourceID,row.OwnerDepartmentID,row.TargetDepartmentID,
    row.AllowedFieldsJSON,row.AllowedDocumentIDsJSON,row.AuthorizedBy,row.AuthorizedAt,row.ValidFrom,row.ExpiresAt,
    row.Status,row.RevokedAt,row.RevokedBy];
}
function makeRuntime(options={}) {
  const sheets={
    ResourceOwnership:makeSheet(options.owners===undefined?[OWNER_HEADERS,ownerRow()]:options.owners),
    LogsSistema:makeSheet([LOG_HEADERS])
  };
  if(options.grants!==undefined) sheets.DepartmentReferenceGrants=makeSheet(options.grants);
  if(options.auditFailure) sheets.LogsSistema.appendRow=function(){throw new Error("AUDIT_UNAVAILABLE");};
  const context=options.context||{status:"success",authorized:true,institutionId:"I1",membershipId:"M1",
    institutionWide:false,departmentIds:["D2"],activeDepartmentId:"D2"};
  const ss={getSheetByName(name){return sheets[name]||null;},insertSheet(name){const sh=makeSheet([]);sheets[name]=sh;return sh;}};
  const permissions=Object.assign({readDepartmentReference:true,readInstitutionWideDepartmentReferences:false},options.permissions||{});
  const runtime={
    SPREADSHEET_ID:"LOCAL",
    SpreadsheetApp:{openById(){return ss;}},
    Utilities:{getUuid(){return "audit-"+Math.random().toString(16).slice(2);}},
    getUserVerifiedRole(p){return p&&p._verifiedUserId?(p.role||"Admin"):"NO_ACCESS";},
    getDynamicPermissionsForRole(role,action){return permissions[action]===true;},
    getUserContextScope(){return context;},
    getDepartmentReferencePolicy_(institutionId){
      if(options.policyError)return {status:"error",code:options.policyError};
      return {status:"success",institutionId,key:"POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL",
        value:options.policy||"PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL"};
    },
    Date,String,JSON,Array,Object,isNaN
  };
  const start=source.indexOf("const DEPARTMENT_REFERENCE_GRANT_SHEET_");
  const end=source.indexOf("function registerResourceOwnership(");
  assert.ok(start>=0&&end>start,"reference grant and evaluator implementation exists");
  const definitions='const RESOURCE_OWNERSHIP_HEADERS_='+JSON.stringify(OWNER_HEADERS)+';\n'+
    'const DEPARTMENT_REFERENCE_POLICY_KEY_="POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL";\n'+
    source.slice(start,end)+
    '\nthis.authorizeRead=authorizeDepartmentReferenceRead;';
  vm.runInNewContext(definitions,runtime);
  return {runtime,sheets,context};
}
function payload(extra={}) {
  return Object.assign({_verifiedUserId:"U2",role:"Docente",resourceType:"EXPEDIENTE",resourceId:"DOC-1",
    requestedFields:["nombre"],requestedDocumentIds:["DOC-A"]},extra);
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()]});
  const r=h.runtime.authorizeRead(payload());
  assert.equal(r.status,"success");
  assert.equal(r.authorized,true);
  assert.equal(r.code,"DEPARTMENT_REFERENCE_ALLOWED");
  assert.equal(r.requiresStandardAuthorization,true);
  assert.deepEqual(r.approvedFields,["nombre"]);
  assert.deepEqual(r.approvedDocumentIds,["DOC-A"]);
  assert.ok(r.auditEventId);
  assert.equal(h.sheets.LogsSistema.snapshot().length,2);
  assert.equal(h.sheets.LogsSistema.snapshot()[1][5],"DEPARTMENT_REFERENCE_READ_ALLOWED");
  assert.equal(Object.hasOwn(r,"content"),false,"authorization never returns resource content");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],policy:"BLOQUEO_TOTAL_CROSS_DEPARTAMENTO"});
  const r=h.runtime.authorizeRead(payload());
  assert.equal(r.status,"error");
  assert.equal(r.code,"CROSS_DEPARTMENT_BLOCKED");
  assert.equal(h.sheets.LogsSistema.snapshot()[1][5],"DEPARTMENT_REFERENCE_READ_DENIED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow({TargetDepartmentID:"D3"})]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()]});
  assert.equal(h.runtime.authorizeRead(payload({requestedFields:["calificacion"]})).code,"DEPARTMENT_REFERENCE_SCOPE_EXCEEDED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow({Status:"REVOKED",RevokedAt:new Date(now).toISOString(),RevokedBy:"U0"})]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_INVALID");
}
{
  const h=makeRuntime();
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
}
{
  const h=makeRuntime({owners:[OWNER_HEADERS] ,grants:[GRANT_HEADERS,grantRow()]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"RESOURCE_OWNERSHIP_UNVERIFIED");
}
{
  const h=makeRuntime({owners:[OWNER_HEADERS,ownerRow(),ownerRow()],grants:[GRANT_HEADERS,grantRow()]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"RESOURCE_OWNERSHIP_UNVERIFIED","ambiguous ownership remains indistinguishable from missing ownership at the read boundary");
}
{
  const h=makeRuntime({grants:[["wrong","schema"]]});
  const r=h.runtime.authorizeRead(payload());
  assert.equal(r.code,"DEPARTMENT_REFERENCE_GRANT_SCHEMA_MISMATCH");
  assert.equal(h.sheets.LogsSistema.snapshot()[1][5],"DEPARTMENT_REFERENCE_READ_DENIED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],auditFailure:true});
  const r=h.runtime.authorizeRead(payload());
  assert.equal(r.status,"error");
  assert.equal(r.authorized,false);
  assert.equal(r.code,"DEPARTMENT_REFERENCE_AUDIT_PERSIST_FAILED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],permissions:{readDepartmentReference:false}});
  assert.equal(h.runtime.authorizeRead(payload()).code,"AUTH_PERMISSION_DENIED");
  assert.equal(h.sheets.LogsSistema.snapshot().length,1);
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],context:{status:"success",authorized:true,institutionId:"I1",
    membershipId:"M1",institutionWide:false,departmentIds:["D2","D3"],activeDepartmentId:""}});
  assert.equal(h.runtime.authorizeRead(payload()).code,"ACTIVE_DEPARTMENT_REQUIRED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],context:{status:"success",authorized:true,institutionId:"I1",
    membershipId:"M1",institutionWide:true,departmentIds:[],activeDepartmentId:""}});
  assert.equal(h.runtime.authorizeRead(payload()).code,"INSTITUTION_WIDE_SCOPE_UNVERIFIED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],context:{status:"success",authorized:true,institutionId:"I1",
    membershipId:"M1",institutionWide:true,departmentIds:[],activeDepartmentId:""},
    permissions:{readInstitutionWideDepartmentReferences:true}});
  const r=h.runtime.authorizeRead(payload());
  assert.equal(r.status,"success");
  assert.equal(r.code,"INSTITUTIONAL_SCOPE_ALLOWED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],context:{status:"success",authorized:true,institutionId:"I1",
    membershipId:"",institutionWide:false,departmentIds:["D2"],activeDepartmentId:"D2"}});
  assert.equal(h.runtime.authorizeRead(payload()).code,"VERIFIED_REFERENCE_CONTEXT_REQUIRED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],policyError:"DEPARTMENT_REFERENCE_POLICY_SCHEMA_MISMATCH"});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_POLICY_UNKNOWN");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()]});
  assert.equal(h.runtime.authorizeRead(payload({requestedDocumentIds:["DOC-B"],requestedFields:[]})).code,"DEPARTMENT_REFERENCE_SCOPE_EXCEEDED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()]});
  assert.equal(h.runtime.authorizeRead(payload({requestedFields:["*"]})).code,"REFERENCE_WILDCARD_NOT_ALLOWED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow({InstitutionID:"I2"})]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow(),grantRow({GrantID:"DRG-2"})]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_AMBIGUOUS");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow({ValidFrom:new Date(now+60000).toISOString()})]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_OUT_OF_WINDOW");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow({ExpiresAt:new Date(now-1000).toISOString()})]});
  assert.equal(h.runtime.authorizeRead(payload()).code,"DEPARTMENT_REFERENCE_GRANT_OUT_OF_WINDOW");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow()],context:{status:"success",authorized:true,institutionId:"I2",
    membershipId:"M2",institutionWide:false,departmentIds:["D2"],activeDepartmentId:"D2"}});
  assert.equal(h.runtime.authorizeRead(payload()).code,"RESOURCE_OWNERSHIP_UNVERIFIED");
}
process.stdout.write("Department reference read authorization contract: 23 scenarios PASS.\n");
