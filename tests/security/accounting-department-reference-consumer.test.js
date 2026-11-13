const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, name + " exists");
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next < 0 ? source.length : next);
}
const helperSource = extractFunction("authorizeAccountingDepartmentReferenceReadViaUser_");
const readerSource = extractFunction("getEmployeeDocuments");
const secret = "accounting-reference-secret-with-more-than-32-characters";
const defaultFields = ["categoriaDoc", "fechaCarga"];
const defaultDocs = ["DOC-B"];
function makeSheet(rows) {
  return { getDataRange() { return { getValues() { return rows.map(row => row.slice()); } }; } };
}
function makeRuntime(options = {}) {
  const calls = [];
  let uuidSequence = 0;
  const documentRows = [
    ["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"],
    ["DOC-A","EXP-A","Contrato","Contrato A","https://drive.example/private-a","2026-01-01","U-A","Privado","nota privada A"],
    ["DOC-B","EXP-B","Identidad","Identidad B","https://drive.example/private-b","2026-02-02","U-B","Restringido","nota privada B"]
  ];
  const employeeRows = [
    ["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],
    ["EXP-A","P-A","U-A","Docente","DEP-A","","2025-01-01","","Activo",""],
    ["EXP-B","P-B","U-B","Docente","DEP-B","","2025-01-01","","Activo",""]
  ];
  const sheets = {
    DocumentosLaborales: makeSheet(documentRows),
    ExpedientesLaborales: makeSheet(employeeRows)
  };
  const context = {
    Date,String,Array,Object,Number,Math,JSON,isNaN,SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById(){return{getSheetByName(name){return sheets[name]||null;}};}},
    PropertiesService:{getScriptProperties(){return{getProperty(name){
      if(name==="IMA_USER_SERVICE_URL")return options.url===undefined?"https://user.example/exec":options.url;
      if(name==="IMA_DEPARTMENT_REFERENCE_HMAC_SECRET")return options.secret===undefined?secret:options.secret;
      return null;
    }};}},
    Utilities:{MacAlgorithm:{HMAC_SHA_256:"HMAC_SHA_256"},getUuid(){uuidSequence++;return String(uuidSequence).padStart(12,"0")+"-1234-1234-1234-123456789012";},
      computeHmacSignature(algorithm,body,key){return Array.from(crypto.createHmac("sha256",key).update(body).digest());}},
    UrlFetchApp:{fetch(url,request){
      calls.push({url,request});
      if(options.fetchError)throw new Error("network unavailable");
      if(url!=="https://user.example/exec")throw new Error("unexpected URL");
      const envelope=JSON.parse(request.payload);
      assert.equal(envelope.sourceService,"ACCOUNTING");assert.equal(envelope.targetService,"USER");
      assert.equal(envelope.action,"authorizeDepartmentReferenceRead");
      assert.equal(envelope.payload.resourceType,"EXPEDIENTE_LABORAL");assert.equal(envelope.payload.resourceId,"EXP-B");
      assert.equal(envelope.payload.sessionToken,"staff");
      if(options.expectedActiveDepartmentId!==undefined)assert.equal(envelope.payload.activeDepartmentId,options.expectedActiveDepartmentId);
      if(options.expectNoActiveDepartment)assert.equal(Object.prototype.hasOwnProperty.call(envelope.payload,"activeDepartmentId"),false);
      const body=envelope.requestId+"|"+envelope.timestamp+"|"+envelope.correlationId+"|"+envelope.sourceService+"|"+envelope.targetService+"|"+envelope.action+"|"+JSON.stringify(envelope.payload);
      assert.equal(envelope.hmacSignature,crypto.createHmac("sha256",secret).update(body).digest("hex"));
      if(options.httpCode)return{getResponseCode(){return options.httpCode;},getContentText(){return"{}";}};
      if(options.malformed)return{getResponseCode(){return 200;},getContentText(){return"not-json";}};
      const response=options.response||{status:"success",authorized:true,requiresStandardAuthorization:true,
        approvedFields:envelope.payload.requestedFields,approvedDocumentIds:envelope.payload.requestedDocumentIds,grantId:"GRANT-EMP-1",auditEventId:"AUDIT-EMP-1"};
      return{getResponseCode(){return 200;},getContentText(){return JSON.stringify(response);}};
    }},
    getVerifiedAccountingIdentity_(payload){
      if(!payload||payload.sessionToken==="invalid")return{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
      return payload.sessionToken==="employee"?{authorized:true,userId:"U-EMP",role:"Empleado"}:{authorized:true,userId:"U-STAFF",role:"Director"};
    },
    assertEmployeeExpedienteScopeAccess_(payload,ss,expedienteId){
      if(options.scopeCode)return{authorized:false,code:options.scopeCode};
      if(options.sameDepartment)return{authorized:true,accessType:"DEPARTMENT",departmentId:"DEP-A"};
      if(payload&&payload.sessionToken==="employee"&&expedienteId==="EXP-A")return{authorized:true,accessType:"SELF"};
      return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    }
  };
  vm.createContext(context);
  vm.runInContext(helperSource+"\n"+readerSource+"\nthis.read=getEmployeeDocuments;",context);
  return{context,calls,sheets,documentRows,employeeRows};
}
function request(overrides={}){return Object.assign({expedienteId:"EXP-B",sessionToken:"staff",activeDepartmentId:"DEP-A",
  referenceRequestedFields:defaultFields.slice(),referenceDocumentIds:defaultDocs.slice()},overrides);}
{
 const h=makeRuntime({expectedActiveDepartmentId:"DEP-A"}),r=h.context.read(request());
 assert.equal(r.status,"success");assert.equal(r.referenceOnly,true);assert.equal(r.grantId,"GRANT-EMP-1");assert.equal(r.auditEventId,"AUDIT-EMP-1");
 assert.deepEqual(JSON.parse(JSON.stringify(r.documentos)),[{documentoId:"DOC-B",categoriaDoc:"Identidad",fechaCarga:"2026-02-02"}]);
 assert.equal(h.calls.length,1);
}
{
 const h=makeRuntime({sameDepartment:true}),r=h.context.read(request({expedienteId:"EXP-A",referenceDocumentIds:undefined,referenceRequestedFields:undefined}));
 assert.equal(r.status,"success");assert.equal(r.referenceOnly,undefined);assert.equal(r.documentos.length,1);
 assert.equal(r.documentos[0].archivoUrl,"https://drive.example/private-a");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({response:{status:"error",authorized:false,code:"DEPARTMENT_REFERENCE_GRANT_NOT_FOUND"}});
 const r=h.context.read(request());assert.equal(r.status,"error");assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,1);
}
{
 const h=makeRuntime({response:{status:"success",authorized:true,requiresStandardAuthorization:false,approvedFields:defaultFields,approvedDocumentIds:defaultDocs,grantId:"G",auditEventId:"A"}});
 assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime({response:{status:"success",authorized:true,requiresStandardAuthorization:true,approvedFields:["categoriaDoc"],approvedDocumentIds:defaultDocs,grantId:"G",auditEventId:"A"}});
 assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime({fetchError:true});assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime({httpCode:503});assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime({malformed:true});assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime({url:"http://user.example/exec"});assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({secret:"short"});assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({referenceRequestedFields:["archivoUrl"]}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({referenceDocumentIds:["DOC-B","DOC-B"]}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read({sessionToken:"staff"});
 assert.equal(r.status,"success");assert.equal(r.documentos.length,0);assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({referenceDocumentIds:["DOC-404"]}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime();h.documentRows.push(h.documentRows[2].slice());
 const r=h.context.read(request());assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime();h.employeeRows.push(h.employeeRows[2].slice());
 const r=h.context.read(request());assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({scopeCode:"RESOURCE_OWNER_UNRESOLVED"});
 const r=h.context.read(request());assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({sessionToken:"invalid"}));
 assert.equal(r.code,"VERIFIED_IDENTITY_REQUIRED");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({referenceRequestedFields:[]}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({expectedActiveDepartmentId:"DEP-B"}),r=h.context.read(request({activeDepartmentId:"DEP-B"}));
 assert.equal(r.status,"success");assert.equal(h.calls.length,1);
}
{
 const h=makeRuntime({expectNoActiveDepartment:true}),r=h.context.read(request({activeDepartmentId:undefined}));
 assert.equal(r.status,"success");assert.equal(h.calls.length,1);
}
{
 const h=makeRuntime(),r=h.context.read(request({sessionToken:"employee"}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime();h.context.read(request());h.context.read(request());
 const ids=h.calls.map(call=>JSON.parse(call.request.payload).requestId);
 assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1]);
}
{
 const h=makeRuntime({scopeCode:"ACTIVE_DEPARTMENT_REQUIRED"});
 const r=h.context.read(request());assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read({sessionToken:"employee"});
 assert.equal(r.status,"success");assert.deepEqual(JSON.parse(JSON.stringify(r.documentos)).map(d=>d.documentoId),["DOC-A"]);assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({referenceRequestedFields:["categoriaDoc","fechaCarga","estadoVisibilidad"]}));
 assert.equal(r.status,"success");assert.equal(r.documentos[0].estadoVisibilidad,"Restringido");
 assert.deepEqual(Object.keys(r.documentos[0]),["documentoId","categoriaDoc","fechaCarga","estadoVisibilidad"]);
}
{
 const h=makeRuntime({response:{status:"success",authorized:true,requiresStandardAuthorization:true,approvedFields:defaultFields,approvedDocumentIds:defaultDocs,grantId:"G",auditEventId:""}});
 assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime(),r=h.context.read(request({referenceRequestedFields:["categoriaDoc","categoriaDoc"]}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime(),r=h.context.read(request({expedienteId:"EXP-MISSING"}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime();h.documentRows[0][4]="ArchivoPrivado";
 const r=h.context.read(request());assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
process.stdout.write("ACCOUNTING department reference consumer contract: 29 scenarios PASS.\n");
