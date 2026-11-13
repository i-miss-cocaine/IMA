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
function makeSheet(rows) {
  const data = (rows || []).map(row => row.slice());
  return {
    getLastRow() { return data.length; },
    getDataRange() { return { getValues: () => data.map(row => row.slice()) }; },
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          const count = numRows || 1, width = numCols || 1;
          return data.slice(row - 1, row - 1 + count).map(line => line.slice(col - 1, col - 1 + width));
        },
        setValues(values) {
          values.forEach((line, i) => {
            const target = data[row - 1 + i] || (data[row - 1 + i] = []);
            line.forEach((value, j) => { target[col - 1 + j] = value; });
          });
        }
      };
    },
    appendRow(row) { data.push(row.slice()); },
    snapshot() { return data.map(row => row.slice()); }
  };
}
const GRANT_HEADERS = ["InstitutionID","GrantID","ResourceType","ResourceID","OwnerDepartmentID","TargetDepartmentID","AllowedFieldsJSON","AllowedDocumentIDsJSON","AuthorizedBy","AuthorizedAt","ValidFrom","ExpiresAt","Status","RevokedAt","RevokedBy"];
const OWNER_HEADERS = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
const SCOPE_HEADERS = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID","InstitutionID","MembershipID","ResponsibilityID"];
const LOG_HEADERS = ["ID","Timestamp","Servicio","Función","Severidad","CódigoError","Mensaje","DatosPayload","RolUsuario"];
const now = Date.now();
function ownerRow(institution="I1", type="EXPEDIENTE", id="DOC-1", department="D1") {
  return ["OWN-1",institution,type,id,department,"ACTIVE","U0",new Date(now).toISOString(),new Date(now).toISOString()];
}
function scopeRow(institution="I1", department="D2") {
  return ["ASG-1","U2","R2","DEPARTAMENTO",JSON.stringify([department]),"ACTIVO","U0",new Date(now).toISOString(),"","",false,"",institution,"M2","RESP-2"];
}
function grantRow(institution="I1", grantId="DRG-1", status="ACTIVE") {
  return [institution,grantId,"EXPEDIENTE","DOC-1","D1","D2",'["nombre"]','["DOC-A"]',"U1",new Date(now).toISOString(),new Date(now-1000).toISOString(),new Date(now+86400000).toISOString(),status,status==="REVOKED"?new Date(now).toISOString():"",status==="REVOKED"?"U1":""];
}
function makeRuntime(options={}) {
  const sheets = {};
  if (options.owners !== false) sheets.ResourceOwnership = makeSheet(options.ownerRows || [OWNER_HEADERS, ownerRow()]);
  if (options.scopes !== false) sheets.AsignacionesAmbitosRoles = makeSheet(options.scopeRows || [SCOPE_HEADERS, scopeRow()]);
  if (options.grants) sheets.DepartmentReferenceGrants = makeSheet(options.grants);
  sheets.LogsSistema = makeSheet([LOG_HEADERS]);
  if (options.auditFailure) sheets.LogsSistema.appendRow = function() { throw new Error("AUDIT_UNAVAILABLE"); };
  const state = {
    sheets, permissions: Object.assign({manageDepartmentReferenceGrants:true,getDepartmentReferenceGrants:true}, options.permissions||{}),
    context: options.context || {status:"success",authorized:true,institutionId:"I1",institutionWide:true,scopes:[{scopeType:"INSTITUCION",scopeValues:["I1"]}]},
    lockBusy: !!options.lockBusy, logs:[], uuid:0
  };
  const ss = {
    getSheetByName(name) { return state.sheets[name] || null; },
    insertSheet(name) { const sheet=makeSheet([]); state.sheets[name]=sheet; return sheet; }
  };
  const runtime = {
    SPREADSHEET_ID:"LOCAL",
    SpreadsheetApp:{openById(){return ss;}},
    LockService:{getScriptLock(){return {tryLock(){return !state.lockBusy;},releaseLock(){}};}},
    Utilities:{getUuid(){return "uuid-"+(++state.uuid);}},
    getUserVerifiedRole(p){return p && p._verifiedUserId ? (p.role||"Admin") : "NO_ACCESS";},
    getDynamicPermissionsForRole(role,action){return state.permissions[action]===true;},
    getUserContextScope(){return state.context;},
    logStructuredEvent(...args){if(options.auditFailure) throw new Error("AUDIT_UNAVAILABLE"); state.logs.push(args);},
    Date, String, JSON, Array, Object, isNaN
  };
  const start=source.indexOf("const DEPARTMENT_REFERENCE_GRANT_SHEET_");
  const end=source.indexOf("function evaluateDepartmentReferenceAccess_(input)");
  assert.ok(start>=0 && end>start,"grant administration block exists");
  const definitions='const RESOURCE_OWNERSHIP_HEADERS_='+JSON.stringify(OWNER_HEADERS)+';\n'+source.slice(start,end)+
    '\nthis.createGrant=createDepartmentReferenceGrant; this.listGrants=getDepartmentReferenceGrants; this.revokeGrant=revokeDepartmentReferenceGrant;';
  vm.runInNewContext(definitions,runtime);
  return {runtime,state};
}
function admin(extra={}) { return Object.assign({_verifiedUserId:"U1",role:"Admin"},extra); }
function validPayload(extra={}) {
  return Object.assign(admin(), {resourceType:"EXPEDIENTE",resourceId:"DOC-1",targetDepartmentId:"D2",
    allowedFields:["nombre","grado"],allowedDocumentIds:["DOC-A"],
    validFrom:new Date(now-1000).toISOString(),expiresAt:new Date(now+86400000).toISOString()},extra);
}
{
  const h=makeRuntime(), r=h.runtime.createGrant(validPayload());
  assert.equal(r.status,"success",JSON.stringify(r));
  assert.equal(r.ownerDepartmentId,"D1");
  assert.equal(r.authorizedBy,"U1");
  assert.equal(h.state.sheets.DepartmentReferenceGrants.snapshot().length,2);
  assert.equal(h.state.sheets.DepartmentReferenceGrants.snapshot()[1][12],"ACTIVE");
  assert.equal(h.state.sheets.LogsSistema.snapshot().length,3,"authorization and completion audit events are persisted");
  assert.equal(h.state.sheets.LogsSistema.snapshot()[1][5],"DEPARTMENT_REFERENCE_GRANT_CREATE_AUTHORIZED");
}
{
  const h=makeRuntime(), r=h.runtime.createGrant(validPayload());
  assert.equal(h.runtime.listGrants(admin()).data.length,1);
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow("I2")]});
  assert.equal(h.runtime.listGrants(admin()).data.length,0,"other tenant grants never returned");
}
{
  const h=makeRuntime(), r=h.runtime.createGrant(validPayload());
  const revoked=h.runtime.revokeGrant(admin({grantId:r.grantId}));
  assert.equal(revoked.status,"success");
  const row=h.state.sheets.DepartmentReferenceGrants.snapshot()[1];
  assert.equal(row[12],"REVOKED"); assert.equal(row[14],"U1");
  assert.equal(h.state.sheets.LogsSistema.snapshot().length,5,"create and revoke authorization/completion events are persisted");
  assert.equal(h.state.sheets.LogsSistema.snapshot()[3][5],"DEPARTMENT_REFERENCE_GRANT_REVOKE_AUTHORIZED");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow("I1","DRG-1","REVOKED")]});
  const r=h.runtime.revokeGrant(admin({grantId:"DRG-1"}));
  assert.equal(r.status,"success"); assert.equal(r.unchanged,true);
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow("I1","DRG-1","REVOKED")]});
  assert.equal(h.runtime.revokeGrant(admin({grantId:"FOREIGN"})).code,"DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
}
{
  const h=makeRuntime(), r=h.runtime.createGrant(validPayload());
  assert.equal(h.runtime.createGrant(validPayload()).code,"DEPARTMENT_REFERENCE_GRANT_ALREADY_ACTIVE");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow("I1","DRG-1","REVOKED")]});
  const r=h.runtime.createGrant(validPayload());
  assert.equal(r.status,"success","a new grant may follow a revocation");
  const rows=h.state.sheets.DepartmentReferenceGrants.snapshot();
  assert.equal(rows.length,3,"revoked history is appended, never overwritten");
  assert.equal(rows[1][12],"REVOKED");
  assert.equal(rows[2][12],"ACTIVE");
  assert.notEqual(rows[1][1],rows[2][1]);
}
{
  const h=makeRuntime({permissions:{manageDepartmentReferenceGrants:false}});
  assert.equal(h.runtime.createGrant(validPayload()).code,"AUTH_PERMISSION_DENIED");
  assert.equal(h.state.sheets.DepartmentReferenceGrants,undefined);
}
{
  const h=makeRuntime({permissions:{getDepartmentReferenceGrants:false}});
  assert.equal(h.runtime.listGrants(admin()).code,"AUTH_PERMISSION_DENIED");
}
{
  const h=makeRuntime({context:{status:"success",authorized:true,institutionId:"I1",institutionWide:false,scopes:[]}});
  assert.equal(h.runtime.createGrant(validPayload()).code,"INSTITUTION_WIDE_SCOPE_REQUIRED");
  assert.equal(h.state.sheets.DepartmentReferenceGrants,undefined);
}
{
  const h=makeRuntime({context:{status:"success",authorized:true,institutionId:"I1",institutionWide:true,scopes:[]}});
  assert.equal(h.runtime.createGrant(validPayload()).code,"INSTITUTION_WIDE_SCOPE_REQUIRED");
}
{
  const h=makeRuntime({scopeRows:[SCOPE_HEADERS,scopeRow("I2","D2")]});
  assert.equal(h.runtime.createGrant(validPayload()).code,"DEPARTMENT_REFERENCE_TARGET_NOT_ACTIVE");
}
{
  const h=makeRuntime({owners:false});
  assert.equal(h.runtime.createGrant(validPayload()).code,"RESOURCE_OWNERSHIP_UNVERIFIED");
}
{
  const h=makeRuntime({ownerRows:[OWNER_HEADERS,ownerRow(),ownerRow()]});
  assert.equal(h.runtime.createGrant(validPayload()).code,"RESOURCE_OWNERSHIP_AMBIGUOUS");
}
{
  const h=makeRuntime();
  assert.equal(h.runtime.createGrant(validPayload({targetDepartmentId:"D1"})).code,"DEPARTMENT_REFERENCE_GRANT_TARGET_IS_OWNER");
}
{
  const h=makeRuntime();
  assert.equal(h.runtime.createGrant(validPayload({allowedFields:[]})).code,"DEPARTMENT_REFERENCE_GRANT_REQUEST_INVALID");
  assert.equal(h.runtime.createGrant(validPayload({allowedFields:["*"]})).code,"DEPARTMENT_REFERENCE_GRANT_REQUEST_INVALID");
  assert.equal(h.runtime.createGrant(validPayload({allowedFields:["nombre","nombre"]})).code,"DEPARTMENT_REFERENCE_GRANT_REQUEST_INVALID");
  assert.equal(h.runtime.createGrant(validPayload({allowedDocumentIds:["DOC-A","DOC-A"]})).code,"DEPARTMENT_REFERENCE_GRANT_REQUEST_INVALID");
}
{
  const h=makeRuntime();
  assert.equal(h.runtime.createGrant(validPayload({validFrom:"invalid"})).code,"DEPARTMENT_REFERENCE_GRANT_REQUEST_INVALID");
  assert.equal(h.runtime.createGrant(validPayload({validFrom:new Date(now+5000).toISOString(),expiresAt:new Date(now+4000).toISOString()})).code,"DEPARTMENT_REFERENCE_GRANT_REQUEST_INVALID");
}
{
  const h=makeRuntime({lockBusy:true});
  assert.equal(h.runtime.createGrant(validPayload()).code,"DEPARTMENT_REFERENCE_GRANT_LOCK_TIMEOUT");
  assert.equal(h.state.sheets.DepartmentReferenceGrants,undefined);
}
{
  const h=makeRuntime({lockBusy:true,grants:[GRANT_HEADERS,grantRow()]});
  assert.equal(h.runtime.revokeGrant(admin({grantId:"DRG-1"})).code,"DEPARTMENT_REFERENCE_GRANT_LOCK_TIMEOUT");
  assert.equal(h.state.sheets.DepartmentReferenceGrants.snapshot()[1][12],"ACTIVE");
}
{
  const h=makeRuntime({grants:[["Wrong","Schema"]]});
  assert.equal(h.runtime.listGrants(admin()).code,"DEPARTMENT_REFERENCE_GRANT_SCHEMA_MISMATCH");
}
{
  const h=makeRuntime({grants:[GRANT_HEADERS,grantRow(),grantRow()]});
  assert.equal(h.runtime.revokeGrant(admin({grantId:"DRG-1"})).code,"DEPARTMENT_REFERENCE_GRANT_AMBIGUOUS");
}
{
  const h=makeRuntime({context:{status:"error",code:"ROLE_SCOPE_NOT_INITIALIZED"}});
  assert.equal(h.runtime.createGrant(validPayload()).code,"ROLE_SCOPE_NOT_INITIALIZED");
}
{
  assert.ok(source.includes('case "createDepartmentReferenceGrant": result = createDepartmentReferenceGrant(payload); break;'));
  assert.ok(source.includes('case "getDepartmentReferenceGrants": result = getDepartmentReferenceGrants(payload); break;'));
  assert.ok(source.includes('case "revokeDepartmentReferenceGrant": result = revokeDepartmentReferenceGrant(payload); break;'));
}
{
  const h=makeRuntime({auditFailure:true});
  const r=h.runtime.createGrant(validPayload());
  assert.equal(r.status,"error");
  assert.equal(r.code,"AUDIT_UNAVAILABLE");
  assert.equal(h.state.sheets.DepartmentReferenceGrants.snapshot().length,1,"only the schema header may be initialized when authorization audit fails");
  assert.equal(h.state.sheets.LogsSistema.snapshot().length,1,"failed audit must not append a success event");
}
{
  const h=makeRuntime({auditFailure:true,grants:[GRANT_HEADERS,grantRow()]});
  const r=h.runtime.revokeGrant(admin({grantId:"DRG-1"}));
  assert.equal(r.status,"error");
  assert.equal(r.code,"AUDIT_UNAVAILABLE");
  assert.equal(h.state.sheets.DepartmentReferenceGrants.snapshot()[1][12],"ACTIVE",
    "grant remains active if revocation audit cannot be recorded");
}
process.stdout.write("Department reference grant administration contract: 26 scenarios PASS.\n");
