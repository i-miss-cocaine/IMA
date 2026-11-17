"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/academic-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/academic-service/Code.gs"});
function extractFunction(name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(start,next<0?source.length:next);
}
const reader=extractFunction("getStudentDocuments");
assert.doesNotMatch(source,/function authorizeDepartmentReferenceReadViaUser_/,"ACADEMIC no longer contains an interservice permission requester");
assert.doesNotMatch(reader,/UrlFetchApp|computeHmacSignature|IMA_DEPARTMENT_REFERENCE_HMAC_SECRET|authorizeDepartmentReferenceRead/,"ordinary academic document reads do not call USER to request a per-operation grant");
function makeSheet(rows){return{getDataRange(){return{getValues(){return rows.map(row=>row.slice());}};}};}
function makeRuntime(){
  const calls={scope:0,network:0,args:[]};
  const sheets={
    DocumentosEstudiante:makeSheet([
      ["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl","FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones","VersionDocumento","SHA256"],
      ["DOC-1","EXP-1","SOL-1","ACTA","Acta.pdf","FILE-1","https://drive.google.com/file/FILE-1","2026-01-02","","VALIDADO","U1","","","1.0","hash"],
      ["DOC-2","EXP-1","SOL-1","IDENTIDAD","Identidad.pdf","FILE-2","https://drive.google.com/file/FILE-2","2026-01-03","","PENDIENTE","U1","","","1.0","hash2"]
    ])
  };
  const context={
    SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById(){return{getSheetByName(name){return sheets[name]||null;}};}},
    assertStudentRequestScopeAccess_(request,ss,expedienteId,solicitudId){
      calls.scope++;calls.args.push({expedienteId,solicitudId});
      return {authorized:request._allowScope!==false,code:"RESOURCE_SCOPE_DENIED"};
    },
    UrlFetchApp:{fetch(){calls.network++;throw new Error("interservice call must not happen");}},
    String,Array,Object,Number,JSON,isNaN
  };
  vm.createContext(context);
  vm.runInContext(reader+"\nthis.read=getStudentDocuments;",context);
  return{context,calls};
}
{
 const h=makeRuntime(),r=h.context.read({expedienteId:"EXP-1",sessionToken:"session"});
 assert.equal(r.status,"success");
 assert.equal(r.documents.length,2);
 assert.equal(h.calls.scope,1,"one expediente-level check covers all attached documents");
 assert.equal(h.calls.network,0,"no second service permission request");
 assert.equal("driveFileId" in r.documents[0],false);
 assert.equal("driveUrl" in r.documents[0],false);
}
{
 const h=makeRuntime(),r=h.context.read({expedienteId:"EXP-1",sessionToken:"session",_allowScope:false,
   referenceRequestedFields:["nombreArchivo"],referenceDocumentIds:["DOC-1"]});
 assert.equal(r.status,"error");
 assert.equal(r.code,"RESOURCE_SCOPE_DENIED");
 assert.equal(h.calls.scope,1);
 assert.equal(h.calls.network,0,"reference metadata cannot trigger a USER authorization round trip");
}
{
 const h=makeRuntime(),r=h.context.read({solicitudId:"SOL-1",sessionToken:"session"});
 assert.equal(r.status,"success");
 assert.equal(r.documents.length,2);
 assert.equal(h.calls.scope,1,"application-level listing is authorized once");
 assert.equal(h.calls.args[0].solicitudId,"sol-1");
}
process.stdout.write("Academic document reference consumer: one local scope check, no interservice permission round trip (3 scenarios PASS).\n");
