const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, name + " exists");
  const next = source.indexOf("\nfunction ", start + 10);
  const comment = source.indexOf("\n\n// [TAREA-F6-022]", start);
  const end = comment >= 0 && (next < 0 || comment < next) ? comment : next;
  return source.slice(start, end < 0 ? source.length : end);
}
const helperSource = extractFunction("authorizeDepartmentReferenceReadViaUser_");
const readerSource = extractFunction("getStudentDocuments");
const secret = "academic-reference-secret-with-more-than-32-characters";
const defaultFields = ["tipoDocumento", "nombreArchivo"];
const defaultDocs = ["DOC-1"];
function makeSheet(rows) { return { getDataRange() { return { getValues() { return rows; } }; } }; }
function makeRuntime(options = {}) {
  const calls = [];
  const documentRows = [
    ["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl","FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones"],
    ["DOC-1","EXP-1","","ACTA","Acta de nacimiento.pdf","PRIVATE-DRIVE-ID","https://drive.google.com/private","2026-01-02","","VALIDADO","U1","U2","dato privado"],
    ["DOC-2","EXP-1","","IDENTIDAD","Identidad.pdf","PRIVATE-DRIVE-ID-2","https://drive.google.com/private2","2026-01-03","","PENDIENTE","U1","","otro dato privado"]
  ];
  const sheets = { DocumentosEstudiante: makeSheet(documentRows), ExpedientesEstudiantes: makeSheet([["ExpedienteID","PersonaID"],["EXP-1","PERSON-1"]]) };
  const context = {
    Date,String,Array,Object,Number,Math,JSON,isNaN,SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById(){return{getSheetByName(name){return sheets[name]||null;}};}},
    DriveApp:{getFileById(){if(options.referenceMode)throw new Error("reference path must not touch Drive");return{isTrashed(){return false;}};}},
    PropertiesService:{getScriptProperties(){return{getProperty(name){
      if(name==="IMA_USER_SERVICE_URL")return options.url===undefined?"https://user.example/exec":options.url;
      if(name==="IMA_DEPARTMENT_REFERENCE_HMAC_SECRET")return options.secret===undefined?secret:options.secret;
      return null;
    }};}},
    Utilities:{MacAlgorithm:{HMAC_SHA_256:"HMAC_SHA_256"},getUuid(){return"12345678-1234-1234-1234-123456789012";},
      computeHmacSignature(algorithm,body,key){return Array.from(crypto.createHmac("sha256",key).update(body).digest());}},
    UrlFetchApp:{fetch(url,request){
      calls.push({url,request});
      if(options.fetchError)throw new Error("network unavailable");
      if(url!=="https://user.example/exec")throw new Error("unexpected URL");
      const envelope=JSON.parse(request.payload);
      assert.equal(envelope.sourceService,"ACADEMIC");assert.equal(envelope.targetService,"USER");
      assert.equal(envelope.action,"authorizeDepartmentReferenceRead");
      assert.equal(envelope.payload.resourceType,"EXPEDIENTE_ESTUDIANTE");assert.equal(envelope.payload.resourceId,"EXP-1");
      assert.equal(envelope.payload.sessionToken,"signed-session-token");
      const body=envelope.requestId+"|"+envelope.timestamp+"|"+envelope.correlationId+"|"+envelope.sourceService+"|"+envelope.targetService+"|"+envelope.action+"|"+JSON.stringify(envelope.payload);
      assert.equal(envelope.hmacSignature,crypto.createHmac("sha256",secret).update(body).digest("hex"));
      if(options.httpCode)return{getResponseCode(){return options.httpCode;},getContentText(){return"{}";}};
      if(options.malformed)return{getResponseCode(){return 200;},getContentText(){return"not-json";}};
      const response=options.response||{status:"success",authorized:true,requiresStandardAuthorization:true,
        approvedFields:envelope.payload.requestedFields,approvedDocumentIds:envelope.payload.requestedDocumentIds,grantId:"GRANT-1",auditEventId:"AUDIT-1"};
      return{getResponseCode(){return 200;},getContentText(){return JSON.stringify(response);}};
    }},
    assertStudentDocumentScopeAccess_(){return options.sameDepartment?{authorized:true,departmentId:"DEP-A"}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};}
  };
  vm.createContext(context);
  vm.runInContext("const ACADEMIC_DEPARTMENT_REFERENCE_SAFE_FIELDS_=[\"tipoDocumento\",\"nombreArchivo\",\"fechaRecepcion\",\"fechaVencimiento\",\"estadoRevision\"];\n"+
    helperSource+"\n"+readerSource+"\nthis.read=getStudentDocuments;",context);
  return{context,calls};
}
function request(overrides={}){return Object.assign({expedienteId:"EXP-1",sessionToken:"signed-session-token",
  referenceRequestedFields:defaultFields.slice(),referenceDocumentIds:defaultDocs.slice()},overrides);}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request());
 assert.equal(r.status,"success");assert.equal(r.referenceOnly,true);assert.equal(r.grantId,"GRANT-1");assert.equal(r.auditEventId,"AUDIT-1");
 assert.deepEqual(JSON.parse(JSON.stringify(r.documents)),[{documentoId:"DOC-1",tipoDocumento:"ACTA",nombreArchivo:"Acta de nacimiento.pdf"}]);
 assert.equal(h.calls.length,1);assert.equal(h.calls[0].request.contentType,"application/json");assert.equal(h.calls[0].request.method,"post");
}
{
 const h=makeRuntime({sameDepartment:true}),r=h.context.read(request());
 assert.equal(r.status,"success");assert.equal(r.referenceOnly,undefined);assert.equal(r.documents.length,2);
 assert.equal(r.documents[0].driveFileId,"PRIVATE-DRIVE-ID");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true,response:{status:"error",authorized:false,code:"DEPARTMENT_REFERENCE_GRANT_NOT_FOUND"}});
 const r=h.context.read(request());assert.equal(r.status,"error");assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(r.documents,undefined);
}
{
 const h=makeRuntime({referenceMode:true,response:{status:"success",authorized:true,requiresStandardAuthorization:false,approvedFields:defaultFields,approvedDocumentIds:defaultDocs,grantId:"G",auditEventId:"A"}});
 assert.equal(h.context.read(request()).status,"error");
}
{
 const h=makeRuntime({referenceMode:true,response:{status:"success",authorized:true,requiresStandardAuthorization:true,approvedFields:["tipoDocumento"],approvedDocumentIds:defaultDocs,grantId:"G",auditEventId:"A"}});
 assert.equal(h.context.read(request()).status,"error");
}
{
 const h=makeRuntime({referenceMode:true,fetchError:true});assert.equal(h.context.read(request()).code,"RESOURCE_NOT_FOUND");
}
{
 const h=makeRuntime({referenceMode:true,httpCode:503});assert.equal(h.context.read(request()).status,"error");
}
{
 const h=makeRuntime({referenceMode:true,malformed:true});assert.equal(h.context.read(request()).status,"error");
}
{
 const h=makeRuntime({referenceMode:true,url:"http://user.example/exec"});assert.equal(h.context.read(request()).status,"error");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true,secret:"short"});assert.equal(h.context.read(request()).status,"error");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request({referenceRequestedFields:["driveUrl"]}));
 assert.equal(r.code,"DEPARTMENT_REFERENCE_REQUEST_INVALID");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request({referenceDocumentIds:["DOC-1","DOC-1"]}));
 assert.equal(r.code,"DEPARTMENT_REFERENCE_REQUEST_INVALID");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request({solicitudId:"SOL-1",expedienteId:undefined}));
 assert.equal(r.status,"success");assert.equal(r.documents.length,0);assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request({referenceDocumentIds:["DOC-404"]}));
 assert.equal(r.code,"RESOURCE_NOT_FOUND");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request({referenceDocumentIds:["DOC-1","DOC-2"]}));
 assert.equal(r.status,"success");assert.equal(r.documents.length,2);
 assert.equal(r.documents.every(d=>!("driveUrl"in d)&&!("driveFileId"in d)&&!("historialVersiones"in d)),true);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read({sessionToken:"signed-session-token"});
 assert.equal(r.status,"error");assert.equal(h.calls.length,0);
}
{
 const h=makeRuntime({referenceMode:true}),r=h.context.read(request({referenceRequestedFields:[]}));
 assert.equal(r.status,"error");assert.equal(h.calls.length,0);
}
process.stdout.write("ACADEMIC department reference consumer contract: 17 scenarios PASS.\n");
