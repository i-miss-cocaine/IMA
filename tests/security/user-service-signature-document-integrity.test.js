const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs","utf8");
new vm.Script(source,{filename:"backend/user-service/Code.gs"});
function extractFunction(name) {
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(start,next<0?source.length:next);
}
const pdf1=Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (signature-v1) >>\nendobj\nstartxref\n9\n%%EOF\n","utf8");
const pdf2=Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (signature-v2) >>\nendobj\nstartxref\n9\n%%EOF\n","utf8");
const hash=bytes=>crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");

function makeHarness(options={}) {
  const state={lockHeld:false,releases:0,fileReads:0,blobReads:0,uuid:0,scopeCalls:0};
  const documentRow=["DOC-1","","REQ-1","Constancia","document.pdf","FILE-1","","","","","USER-UPLOADER","","","v1",hash(pdf1)];
  const signatureRows=[["FirmaID","SolicitudID","DocumentoID","FirmanteID","RolFirmante","TipoFirma","TokenVerificacion","FechaFirma","IpMetadata"]];
  const sheet={
    rows:signatureRows,
    getLastRow:()=>signatureRows.length,
    getLastColumn:()=>Math.max(1,...signatureRows.map(row=>row.length)),
    getDataRange:()=>({getValues:()=>signatureRows.map(row=>row.slice())}),
    getRange(row,column,rowCount,columnCount) {
      const countR=rowCount||1,countC=columnCount||1;
      return {
        getValues:()=>Array.from({length:countR},(_,ri)=>Array.from({length:countC},(_,ci)=>(signatureRows[row-1+ri]||[])[column-1+ci]||"")),
        setValue(value) {
          while(signatureRows.length<row)signatureRows.push([]);
          while(signatureRows[row-1].length<column)signatureRows[row-1].push("");
          signatureRows[row-1][column-1]=value;
        }
      };
    },
    appendRow:row=>signatureRows.push(row.slice())
  };
  const documentSheet={
    getLastRow:()=>options.issuedDocument?1:2,
    getDataRange:()=>({getValues:()=>options.issuedDocument
      ?[["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl","FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones","VersionDocumento","SHA256"]]
      :[["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl","FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones","VersionDocumento","SHA256"],documentRow.slice()]})
  };
  const issuedRow=["DOC-ISSUED","TPL-1","USER-1","ISSUER-1","{}","issued","CUV-1","FILE-1","",
    "2026-11-15T06:00:00.000Z","","1.0",1,"2026-000001",hash(pdf1),
    "DOC-ISSUED:1.0:2026-11-15T06:00:00.000Z",""];
  const issuedSheet={getLastRow:()=>options.issuedDocument?2:1,
    getDataRange:()=>({getValues:()=>options.issuedDocument
      ?[["DocumentoID","PlantillaID","EstudianteUserId","SolicitanteUserId","DatosJSON","EstadoDoc","CodigoVerificacion","DriveFileID","DriveURL","FechaEmision","Observaciones","VersionPlantilla","Correlativo","NumeroCorrelativo","SHA256","VersionDocumento","SolicitudID"],issuedRow.slice()]
      :[["DocumentoID","PlantillaID","EstudianteUserId","SolicitanteUserId","DatosJSON","EstadoDoc","CodigoVerificacion","DriveFileID","DriveURL","FechaEmision","Observaciones","VersionPlantilla","Correlativo","NumeroCorrelativo","SHA256","VersionDocumento","SolicitudID"]]})};
  const usersSheet={getDataRange:()=>({getValues:()=>[["UserID","","","","","","","","","PersonaID"],["USER-1","","","","","","","","","PERSON-1"]]})};
  const expedienteSheet={getDataRange:()=>({getValues:()=>[["ExpedienteID","PersonaID"],["EXP-1","PERSON-1"]]})};
  let fileBytes=Buffer.from(options.fileBytes||pdf1);
  let sharing=options.sharing||"PRIVATE";
  let mutateOnSecondRead=!!options.mutateOnSecondRead;
  const file={
    isTrashed:()=>false,
    getSharingAccess:()=>sharing,
    getName:()=>"document.pdf",
    getBlob:()=>{
      state.blobReads++;
      const snapshot=Buffer.from(fileBytes);
      if(mutateOnSecondRead&&state.blobReads===1)fileBytes=Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (raced) >>\nendobj\nstartxref\n9\n%%EOF\n");
      return {getBytes:()=>Array.from(snapshot),getContentType:()=>"application/pdf"};
    }
  };
  const ss={getSheetByName:name=>{
    if(name==="DocumentosEstudiante")return documentSheet;
    if(name==="DocumentosEscolaresEmitidos")return issuedSheet;
    if(name==="Usuarios")return options.issuedDocument?usersSheet:null;
    if(name==="ExpedientesEstudiantes")return options.issuedDocument?expedienteSheet:null;
    return null;
  }};
  const context={
    Buffer,require,Date,Math,SPREADSHEET_ID:"TEST-SPREADSHEET",
    validateRolePermission:()=>({authorized:true}),
    getUserVerifiedRole:()=> "Director",
    getUserContextScope:()=>({status:"success",userId:"USER-1",role:"Director",institutionId:"INST-1",departmentIds:["DEP-1"]}),
    assertRecordOwnership:(_payload,type,id,operation)=>{
      state.scopeCalls++;
      assert.equal(type,options.issuedDocument?"EXPEDIENTE_ESTUDIANTE":"SOLICITUD_ADMISION");
      assert.equal(id,options.issuedDocument?"EXP-1":"REQ-1");
      assert.equal(operation,"UPDATE");
      return {authorized:true,departmentId:"DEP-1"};
    },
    SpreadsheetApp:{openById:id=>{assert.equal(id,"TEST-SPREADSHEET");return ss;}},
    getOrCreateSheet:(_ss,name)=>{assert.equal(name,"FirmasConformidades");return sheet;},
    LockService:{getScriptLock:()=>({
      tryLock:()=>{if(state.lockHeld)return false;state.lockHeld=true;return true;},
      releaseLock:()=>{assert.equal(state.lockHeld,true);state.lockHeld=false;state.releases++;}
    })},
    DriveApp:{Access:{PRIVATE:"PRIVATE"},getFileById:id=>{state.fileReads++;assert.equal(id,"FILE-1");return file;}},
    Utilities:{
      DigestAlgorithm:{SHA_256:"SHA_256"},
      base64Encode:value=>Buffer.from(value).toString("base64"),
      base64Decode:value=>Array.from(Buffer.from(value,"base64")),
      newBlob:value=>({getBytes:()=>Array.from(Buffer.from(String(value),"utf8"))}),
      computeDigest:(_algorithm,bytes)=>Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest()),
      getUuid:()=> "uuid-"+String(++state.uuid).padStart(8,"0")
    },
    logStructuredEvent:()=>{}
  };
  vm.runInNewContext([
    extractFunction("validateFileBinaryIntegrity"),
    extractFunction("computeDocumentSHA256"),
    extractFunction("ensureDocumentSignatureSchema_"),
    extractFunction("assertAdvancedSignatureDocumentScope_"),
    extractFunction("registerDocumentSignature")
  ].join("\n\n"),context);
  return {context,state,rows:signatureRows,documentRow,setSharing:value=>{sharing=value;},
    setFileBytes:value=>{fileBytes=Buffer.from(value);},setVersion:(version,bytes)=>{
      documentRow[13]=version;documentRow[14]=hash(bytes);fileBytes=Buffer.from(bytes);
    }};
}

assert.equal(hash(pdf1),hash(Array.from(pdf1)),"fixture raw bytes hash baseline");

{
  const h=makeHarness();
  assert.throws(()=>h.context.registerDocumentSignature({solicitudId:"REQ-1",documentoId:"DOC-1",
    firmanteId:"FORGED",_verifiedUserId:"USER-1"}),/SIGNER_IDENTITY_MISMATCH/);
  assert.equal(h.state.fileReads,0,"forged signer is rejected before Drive lookup");
  assert.equal(h.rows.length,1);
}
{
  const h=makeHarness();
  assert.throws(()=>h.context.registerDocumentSignature({solicitudId:"REQ-1",documentoId:"DOC-1",
    documentoHash:"a".repeat(64),_verifiedUserId:"USER-1"}),/DOCUMENT_HASH_MISMATCH/);
  assert.equal(h.rows.length,1);
  assert.equal(h.state.lockHeld,false);
}
{
  const h=makeHarness();
  h.setFileBytes("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (altered) >>\nendobj\nstartxref\n9\n%%EOF\n");
  assert.throws(()=>h.context.registerDocumentSignature({solicitudId:"REQ-1",documentoId:"DOC-1",
    _verifiedUserId:"USER-1",_verifiedRole:"Director"}),/DOCUMENT_INTEGRITY_MISMATCH/);
  assert.equal(h.rows.length,1);
}
{
  const h=makeHarness({sharing:"ANYONE_WITH_LINK"});
  assert.throws(()=>h.context.registerDocumentSignature({solicitudId:"REQ-1",documentoId:"DOC-1",
    _verifiedUserId:"USER-1"}),/DOCUMENT_FILE_NOT_PRIVATE/);
  assert.equal(h.rows.length,1);
}
{
  const h=makeHarness();
  const payload={solicitudId:"REQ-1",documentoId:"DOC-1",firmanteId:"USER-1",
    documentoHash:hash(pdf1),rolFirmante:"Administrador",ipOrigen:"203.0.113.7",
    _verifiedUserId:"USER-1",_verifiedRole:"Director"};
  const first=h.context.registerDocumentSignature(payload);
  assert.equal(first.status,"success");
  assert.equal(first.documentoHash,hash(pdf1));
  assert.equal(first.versionDocumento,"v1");
  assert.equal(first.transaccionId,first.firmaId);
  assert.equal(h.rows[1][3],"USER-1");
  assert.equal(h.rows[1][4],"Director");
  assert.equal(h.rows[1][8],"NO_DISPONIBLE");
  assert.equal(h.rows[1][9],hash(pdf1));
  assert.equal(h.rows[1][11],"v1");
  assert.equal(h.rows[1][12],"SESION_VERIFICADA");
  const second=h.context.registerDocumentSignature(payload);
  assert.equal(second.isExisting,true);
  assert.equal(h.rows.length,2,"same version/signature retry is idempotent");
  h.setVersion("v2",pdf2);
  const third=h.context.registerDocumentSignature({...payload,documentoHash:hash(pdf2)});
  assert.equal(third.status,"success");
  assert.equal(third.versionDocumento,"v2");
  assert.equal(h.rows.length,3,"new version requires a separate signature");
  assert.equal(h.state.releases,3);
  assert.equal(h.state.lockHeld,false);
}
{
  const h=makeHarness();
  h.state.lockHeld=true;
  assert.throws(()=>h.context.registerDocumentSignature({solicitudId:"REQ-1",documentoId:"DOC-1",
    _verifiedUserId:"USER-1"}),/Servicio ocupado/);
  assert.equal(h.state.fileReads,0);
  assert.equal(h.rows.length,1);
  h.state.lockHeld=false;
}
{
  const h=makeHarness({issuedDocument:true});
  const result=h.context.registerDocumentSignature({documentoId:"DOC-ISSUED",_verifiedUserId:"USER-1",_verifiedRole:"Director"});
  assert.equal(result.status,"success");
  assert.equal(result.versionDocumento,"DOC-ISSUED:1.0:2026-11-15T06:00:00.000Z");
  assert.equal(h.rows[1][1],"DOC:DOC-ISSUED");
  assert.equal(h.rows[1][2],"DOC-ISSUED");
  assert.equal(h.rows[1][9],hash(pdf1));
  assert.equal(h.state.scopeCalls,1);
}

{
  const h=makeHarness({mutateOnSecondRead:true});
  assert.throws(()=>h.context.registerDocumentSignature({solicitudId:"REQ-1",documentoId:"DOC-1",
    _verifiedUserId:"USER-1"}),/DOCUMENT_CHANGED_DURING_SIGNING/);
  assert.equal(h.rows.length,1);
  assert.equal(h.state.lockHeld,false);
}
console.log("user-service-signature-document-integrity: PASS");
