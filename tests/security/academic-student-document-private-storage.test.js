const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname,"../../backend/academic-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/academic-service/Code.gs"});
function extractFunction(name) {
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(start,next<0?source.length:next);
}
const names=[
  "validateFileBinaryIntegrity","computeDocumentSHA256","getDocumentDuplicatePolicy_","ensureStudentDocumentSchema_",
  "ensureDocumentVersionHistorySchema_","getOrCreatePrivateStudentDocumentFolder_",
  "rollbackPrivateStudentDocumentFile_","getVerifiedPrivateStudentDocumentFile_",
  "nextStudentDocumentVersion_","uploadStudentDocument","verifyDocumentIntegritySha256","getStudentDocumentFile_",
  "getStudentDocumentAccessTokenSecret_","studentDocumentTokenHex_","studentDocumentTokenConstantTimeEqual_",
  "studentDocumentTokenDigest_","studentDocumentTokenSignature_","createStudentDocumentAccessToken",
  "decodeStudentDocumentAccessToken_","logStudentDocumentAccessDecision_","studentDocumentAccessError_",
  "consumeStudentDocumentAccessToken_","getSecureDocumentStream","getStudentDocuments","restoreDocumentVersion"
];
const functions=names.map(extractFunction);
const pdf1=Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (first) >>\nendobj\nstartxref\n9\n%%EOF\n","utf8");
const pdf2=Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (second) >>\nendobj\nstartxref\n9\n%%EOF\n","utf8");

function makeSheet(initialRows=[]) {
  const rows=initialRows.map(row=>row.slice());
  return {
    rows,
    getLastRow:()=>rows.length,
    getLastColumn:()=>Math.max(1,...rows.map(row=>row.length)),
    getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),
    getRange(row,column,rowCount,columnCount) {
      const rCount=rowCount||1,cCount=columnCount||1;
      return {
        getValues:()=>Array.from({length:rCount},(_,ri)=>Array.from({length:cCount},(_,ci)=>(rows[row-1+ri]||[])[column-1+ci]||"")),
        setValue(value) {
          while(rows.length<row)rows.push([]);
          while(rows[row-1].length<column)rows[row-1].push("");
          rows[row-1][column-1]=value;
        },
        setValues(values) {
          for(let ri=0;ri<rCount;ri++){
            while(rows.length<row+ri)rows.push([]);
            while(rows[row-1+ri].length<column-1)rows[row-1+ri].push("");
            rows[row-1+ri].splice(column-1,cCount,...values[ri]);
          }
        }
      };
    },
    appendRow(row){rows.push(row.slice());},
    insertRowBefore(index){rows.splice(index-1,0,[]);}
  };
}

function makeHarness(options={}) {
  const state={lockHeld:false,lockReleases:0,uuid:0,docSequence:0,fileSequence:0,scopeChecks:0,identityChecks:0,permissionCalls:[],folderAccess:"PRIVATE",
    failFileSharing:false,actorUserId:"USER-1",now:Date.now(),tokenCache:new Map(),scriptProperties:new Map(),auditEvents:[]};
  const docHeader=["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl",
    "FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones","VersionDocumento","SHA256"];
  const historyHeader=["VersionID","DocumentoID","NombreArchivo","DriveFileId","DriveUrl","FechaCreacion","ArchivadoPor",
    "MotivoArchivado","FechaArchivado","VersionDocumento","SHA256"];
  const docRows=options.documentRows || [docHeader];
  const historyRows=options.historyRows || [historyHeader];
  const sheets={
    DocumentosEstudiante:makeSheet(docRows),
    HistorialVersionesDocumentos:makeSheet(historyRows),
    ExpedientesEstudiantes:makeSheet([["ExpedienteID","PersonaID"],["EXP-1","PERSON-1"]])
  };
  const files=new Map();
  const folder={
    getSharingAccess:()=>state.folderAccess,
    setSharing(access){state.folderAccess=access;},
    createFile(blob) {
      const id="STUDENT-FILE-"+(++state.fileSequence);
      const bytes=Buffer.from(blob.getBytes());
      let access="PRIVATE",trashed=false;
      const file={
        getId:()=>id,getName:()=>blob.name,getMimeType:()=>blob.mimeType,
        getSharingAccess:()=>access,
        setSharing(next){if(state.failFileSharing)throw new Error("SHARING_UPDATE_FAILED");access=next;},
        isTrashed:()=>trashed,setTrashed:()=>{trashed=true;},
        getBlob:()=>({getBytes:()=>Array.from(bytes),getContentType:()=>blob.mimeType})
      };
      files.set(id,file);
      return file;
    }
  };
  const root={
    getFoldersByName:()=>({hasNext:()=>true,next:()=>folder}),
    createFolder:()=>folder
  };
  const lock={
    tryLock:()=>{if(state.lockHeld)return false;state.lockHeld=true;return true;},
    waitLock:ms=>{assert.ok(ms===5000||ms===10000);if(state.lockHeld)throw new Error("LOCK_BUSY");state.lockHeld=true;},
    releaseLock:()=>{assert.equal(state.lockHeld,true);state.lockHeld=false;state.lockReleases++;}
  };
  class TestDate extends Date {
    constructor(...args){super(...(args.length?args:[state.now]));}
    static now(){return state.now;}
  }
  const scriptCache={
    put(key,value,ttl){state.tokenCache.set(key,{value,expiresAt:state.now+Number(ttl)*1000});},
    get(key){assert.equal(state.lockHeld,true,"one-use token lookup is serialized");const item=state.tokenCache.get(key);if(!item||item.expiresAt<=state.now){state.tokenCache.delete(key);return null;}return item.value;},
    remove(key){assert.equal(state.lockHeld,true,"one-use token removal is serialized");state.tokenCache.delete(key);}
  };
  const context={
    STUDENT_DOCUMENT_ACCESS_TOKEN_TTL_SECONDS_:60,
    Buffer,require,Date:TestDate,Math,String,Array,Object,Number,JSON,isNaN,Uint8Array,
    SPREADSHEET_ID:"IN_MEMORY",
    SpreadsheetApp:{openById:id=>{assert.equal(id,"IN_MEMORY");return {getSheetByName:name=>sheets[name]||null};}},
    getOrCreateSheet:(_ss,name)=>{
      if(!sheets[name]){
        if(name==="DocumentosEstudiante")sheets[name]=makeSheet([docHeader]);
        else if(name==="HistorialVersionesDocumentos")sheets[name]=makeSheet([historyHeader]);
        else sheets[name]=makeSheet([]);
      }
      return sheets[name];
    },
    LockService:{getScriptLock:()=>lock},
    validateRolePermission:action=>{state.permissionCalls.push(action);return{authorized:!(options.denyPreview && action==="previewStudentDocument")};},
    CacheService:{getScriptCache:()=>scriptCache},
    PropertiesService:{getScriptProperties:()=>({
      getProperty:key=>state.scriptProperties.get(key)||"",
      setProperty:(key,value)=>{state.scriptProperties.set(key,String(value));}
    })},
    DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},getRootFolder:()=>root,
      getFileById:id=>{if(!files.has(id))throw new Error("FILE_NOT_FOUND");return files.get(id);}},
    Utilities:{
      DigestAlgorithm:{SHA_256:"SHA_256"},
      MacAlgorithm:{HMAC_SHA_256:"HMAC_SHA_256"},
      Charset:{UTF_8:"UTF-8"},
      base64Decode:value=>Buffer.from(value,"base64"),
      base64Encode:value=>Buffer.from(value).toString("base64"),
      newBlob(bytes,mimeType,name){const data=Buffer.from(bytes);return{name,mimeType,getBytes:()=>Array.from(data),getDataAsString:()=>data.toString("utf8")};},
      computeDigest:(_algorithm,bytes)=>Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest()),
      computeHmacSignature:(_algorithm,message,key)=>Array.from(crypto.createHmac("sha256",String(key)).update(String(message)).digest()),
      getUuid:()=> "12345678-1234-1234-1234-" + String(++state.uuid).padStart(12,"0")
    },
    MimeType:{PDF:"application/pdf"},
    assertStudentRequestScopeAccess_:()=>{state.scopeChecks++;return options.revokeScopeAfterInitial && state.scopeChecks>1?{authorized:false,code:"DEPARTMENT_SCOPE_ACCESS_DENIED"}:{authorized:true,departmentId:"DEP-1"};},
    assertStudentDocumentScopeAccess_:()=>({authorized:true,accessType:"STAFF",departmentId:"DEP-1"}),
    getVerifiedAcademicIdentity_:()=>{state.identityChecks++;return options.revokeIdentityAfterInitial && state.identityChecks>1?{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"}:{authorized:true,userId:state.actorUserId,role:"Secretary"};},
    generateInstitutionalId:()=>({generatedId:"DOC-"+(++state.docSequence)}),
    logStructuredEvent:(...args)=>{state.auditEvents.push(args);},logDebug:()=>{}
  };
  vm.createContext(context);
  vm.runInContext(functions.join("\n\n")+"\nthis.upload=uploadStudentDocument;this.verify=verifyDocumentIntegritySha256;this.download=getStudentDocumentFile_;this.list=getStudentDocuments;this.restore=restoreDocumentVersion;this.issueToken=createStudentDocumentAccessToken;this.stream=getSecureDocumentStream;",context);
  return {state,sheets,files,context,setFileBytes(id,value){const file=files.get(id);assert.ok(file);file.getBlob=()=>({getBytes:()=>Array.from(Buffer.from(value)),getContentType:()=>"application/pdf"});},
    setFileSharing(id,value){const file=files.get(id);assert.ok(file);file.getSharingAccess=()=>value;}};
}
function upload(h,pdf,label="ACTA") {
  return h.context.upload({expedienteId:"EXP-1",solicitudId:"SOL-1",tipoDocumento:label,
    fileName:"acta.pdf",fileData:"data:application/pdf;base64,"+pdf.toString("base64"),
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
}

{
  const h=makeHarness();
  const result=upload(h,pdf1);
  assert.equal(result.status,"success");
  assert.equal(result.versionDocumento,"1.0");
  assert.equal(result.integridadVerificada,true);
  assert.equal(result.driveFileId,undefined);
  const row=h.sheets.DocumentosEstudiante.rows[1];
  const hash1=crypto.createHash("sha256").update(pdf1).digest("hex");
  assert.equal(row[5],"STUDENT-FILE-1");
  assert.equal(row[6],"","Drive URL must not be persisted");
  assert.equal(row[13],"1.0");
  assert.equal(row[14],hash1);
  assert.equal(h.sheets.DocumentosEstudiante.rows[0][15],"HashSHA256");
  assert.equal(row[15],hash1);
  assert.equal(row[16],"");
  assert.equal(row[17],"");
  assert.equal(h.files.get(row[5]).getSharingAccess(),"PRIVATE");
  const explicitVerification=h.context.verify({documentoId:row[0],solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(explicitVerification.status,"success");
  assert.equal(explicitVerification.integridadVerificada,true);
  const downloaded=h.context.download({documentoId:row[0],solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(downloaded.status,"success");
  assert.equal(downloaded.sha256Hash,hash1);
  assert.equal(Buffer.from(downloaded.fileData,"base64").equals(pdf1),true);
  const listed=h.context.list({expedienteId:"EXP-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(listed.status,"success");
  assert.equal(listed.documents[0].integridadVerificada,true);
  assert.equal("driveFileId" in listed.documents[0],false);
  assert.equal("driveUrl" in listed.documents[0],false);
  assert.equal(h.context.list({}).code,"RESOURCE_SCOPE_DENIED","document metadata queries require an expediente or application ID");
  const previewDenied=makeHarness({denyPreview:true});
  const previewDeniedUpload=upload(previewDenied,pdf1);
  const deniedPreview=previewDenied.context.issueToken({documentoId:previewDeniedUpload.documentoId,solicitudId:"SOL-1",operation:"PREVIEW"});
  assert.equal(deniedPreview.code,"AUTH_PERMISSION_DENIED","preview requires its own RBAC permission");
  const invalidOperation=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1",operation:"METADATA"});
  assert.equal(invalidOperation.code,"DOCUMENT_ACCESS_OPERATION_INVALID","metadata-only requests cannot mint a binary token");
  const previewToken=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1",operation:"PREVIEW"});
  assert.equal(previewToken.status,"success");
  const previewStream=h.context.stream({documentoId:row[0],solicitudId:"SOL-1",operation:"PREVIEW",
    versionDocumento:previewToken.versionDocumento,accessToken:previewToken.accessToken});
  assert.equal(previewStream.status,"success");
  assert.equal(Buffer.from(previewStream.fileData,"base64").equals(pdf1),true);
  assert.equal(h.state.auditEvents.some(event=>event[3]==="DOCUMENT_PREVIEWED"),true);
  const previewReplay=h.context.stream({documentoId:row[0],solicitudId:"SOL-1",operation:"PREVIEW",accessToken:previewToken.accessToken});
  assert.equal(previewReplay.code,"DOCUMENT_ACCESS_TOKEN_REVOKED_OR_REPLAYED","preview tokens are one-use");
  const operationMismatch=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1",operation:"PREVIEW"});
  assert.equal(h.context.stream({documentoId:row[0],solicitudId:"SOL-1",operation:"DOWNLOAD",accessToken:operationMismatch.accessToken}).code,
    "DOCUMENT_ACCESS_TOKEN_BINDING_MISMATCH","a preview token cannot be upgraded to download");
  assert.ok(h.state.permissionCalls.includes("previewStudentDocument"));
  const issued=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1"});
  assert.equal(issued.status,"success");
  assert.equal(issued.expiresInSeconds,60);
  const streamed=h.context.stream({documentoId:row[0],solicitudId:"SOL-1",versionDocumento:issued.versionDocumento,accessToken:issued.accessToken});
  assert.equal(streamed.status,"success");
  assert.equal(Buffer.from(streamed.fileData,"base64").equals(pdf1),true);
  assert.equal("downloadUrl" in streamed,false);
  assert.equal("driveUrl" in streamed,false);
  assert.equal(h.state.auditEvents.some(event=>event[3]==="DOCUMENT_DOWNLOADED"),true);
  assert.equal(h.state.auditEvents.some(event=>event[3]==="DOCUMENT_ACCESS_TOKEN_ISSUED"),true);
  const replay=h.context.stream({documentoId:row[0],solicitudId:"SOL-1",versionDocumento:issued.versionDocumento,accessToken:issued.accessToken});
  assert.equal(replay.code,"DOCUMENT_ACCESS_TOKEN_REVOKED_OR_REPLAYED","download tokens are one-use");
  const userBound=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1"});
  h.state.actorUserId="USER-2";
  assert.equal(h.context.stream({documentoId:row[0],solicitudId:"SOL-1",accessToken:userBound.accessToken}).code,
    "DOCUMENT_ACCESS_TOKEN_BINDING_MISMATCH","a token cannot be transferred to another user");
  h.state.actorUserId="USER-1";
  const versionBound=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1"});
  const currentVersion=row[13];
  row[13]="2.0";
  assert.equal(h.context.stream({documentoId:row[0],solicitudId:"SOL-1",accessToken:versionBound.accessToken}).code,
    "DOCUMENT_ACCESS_TOKEN_BINDING_MISMATCH","a token cannot be reused after the document version changes");
  row[13]=currentVersion;
  const wrongDocument=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1"});
  assert.equal(h.context.stream({documentoId:"DOC-OTHER",solicitudId:"SOL-1",accessToken:wrongDocument.accessToken}).code,
    "DOCUMENT_ACCESS_TOKEN_BINDING_MISMATCH","a token cannot be transferred to another document");
  const contentionToken=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1"});
  h.state.lockHeld=true;
  assert.equal(h.context.stream({documentoId:row[0],solicitudId:"SOL-1",accessToken:contentionToken.accessToken}).code,
    "DOCUMENT_ACCESS_TOKEN_REVOKED_OR_REPLAYED","lock contention fails closed without consuming a token");
  h.state.lockHeld=false;
  assert.equal(h.context.stream({documentoId:row[0],solicitudId:"SOL-1",accessToken:contentionToken.accessToken}).status,"success",
    "a token survives a lock timeout and can be consumed once the lock is available");
  const expired=h.context.issueToken({documentoId:row[0],solicitudId:"SOL-1"});
  h.state.now+=61000;
  assert.equal(h.context.stream({documentoId:row[0],solicitudId:"SOL-1",accessToken:expired.accessToken}).code,
    "DOCUMENT_ACCESS_TOKEN_INVALID","expired tokens are rejected");
  h.state.now-=61000;
  assert.equal(h.state.auditEvents.some(event=>event[3]==="DOCUMENT_ACCESS_DENIED"),true,
    "invalid, expired, replayed and mismatched attempts are logged without exposing file details");
}

{
  const h=makeHarness();
  upload(h,pdf1);
  const firstRow=h.sheets.DocumentosEstudiante.rows[1].slice();
  upload(h,pdf2);
  const current=h.sheets.DocumentosEstudiante.rows[1];
  const history=h.sheets.HistorialVersionesDocumentos.rows;
  const oldHash=crypto.createHash("sha256").update(pdf1).digest("hex");
  const newHash=crypto.createHash("sha256").update(pdf2).digest("hex");
  assert.equal(current[13],"1.1");
  assert.equal(current[14],newHash);
  assert.equal(current[6],"");
  assert.equal(history.length,2);
  assert.equal(history[1][1],firstRow[0]);
  assert.equal(history[1][3],firstRow[5]);
  assert.equal(history[1][4],"");
  assert.equal(history[1][9],"1.0");
  assert.equal(history[1][10],oldHash);
  const restored=h.context.restore({documentoId:firstRow[0],versionId:history[1][0],solicitudId:"SOL-1",
    motivo:"Prueba de restauración",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(restored.status,"success");
  assert.equal(restored.versionDocumento,"1.0");
  assert.equal(restored.sha256Hash,oldHash);
  assert.equal(h.sheets.DocumentosEstudiante.rows[1][5],firstRow[5]);
  assert.equal(h.sheets.DocumentosEstudiante.rows[1][13],"1.0");
  const download=h.context.download({documentoId:firstRow[0],solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(Buffer.from(download.fileData,"base64").equals(pdf1),true);
}

{
  const h=makeHarness();
  upload(h,pdf1);
  const row=h.sheets.DocumentosEstudiante.rows[1];
  h.setFileBytes(row[5],pdf2);
  const tampered=h.context.download({documentoId:row[0],solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(tampered.status,"error");
  assert.equal(tampered.code,"DOCUMENT_INTEGRITY_MISMATCH");
}

{
  const h=makeHarness();
  upload(h,pdf1);
  const row=h.sheets.DocumentosEstudiante.rows[1];
  h.setFileSharing(row[5],"ANYONE_WITH_LINK");
  const denied=h.context.download({documentoId:row[0],solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(denied.status,"error");
  assert.equal(denied.code,"DOCUMENT_FILE_NOT_PRIVATE");
}

{
  const h=makeHarness();
  assert.throws(()=>h.context.upload({expedienteId:"EXP-1",solicitudId:"SOL-1",tipoDocumento:"ACTA",
    fileName:"payload.exe",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"}),/DANGEROUS_FILE_EXTENSION|UNSUPPORTED_FILE_FORMAT/);
  assert.equal(h.files.size,0);
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,1);
}

{
  const h=makeHarness();
  h.state.failFileSharing=true;
  assert.throws(()=>upload(h,pdf1),/SHARING_UPDATE_FAILED/);
  assert.equal(h.files.size,1);
  const file=[...h.files.values()][0];
  assert.equal(file.isTrashed(),true,"failed privacy enforcement must roll back the newly created file");
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,1);
}

{
  const h=makeHarness({revokeScopeAfterInitial:true});
  const result=upload(h,pdf1);
  assert.equal(result.status,"error");
  assert.equal(result.code,"DEPARTMENT_SCOPE_ACCESS_DENIED");
  assert.equal(h.state.scopeChecks,2,"scope must be rechecked after acquiring the write lock");
  assert.equal(h.files.size,0,"revoked scope cannot create a Drive file");
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,1,"revoked scope cannot persist a document row");
}

{
  const h=makeHarness({revokeIdentityAfterInitial:true});
  const result=upload(h,pdf1);
  assert.equal(result.status,"error");
  assert.equal(result.code,"VERIFIED_IDENTITY_CHANGED");
  assert.equal(h.files.size,0,"changed identity cannot create a Drive file");
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,1,"changed identity cannot persist a document row");
}

{
  const h=makeHarness();
  h.state.lockHeld=true;
  assert.throws(()=>upload(h,pdf1),/DOCUMENT_FOLDER_LOCK_UNAVAILABLE/);
  assert.equal(h.files.size,0,"lock contention must not create an orphan or persist a row");
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,1);
}

{
  const legacyRow=["VER-LEGACY","DOC-OLD","old.pdf","OLD-FILE","https://drive.example/legacy",
    "2026-01-01","USER-OLD","legacy snapshot","2026-01-02"];
  const h=makeHarness({historyRows:[legacyRow]});
  const result=upload(h,pdf1);
  assert.equal(result.status,"success");
  const history=h.sheets.HistorialVersionesDocumentos.rows;
  assert.equal(history[0][0],"VersionID");
  assert.equal(history[1][0],"VER-LEGACY","legacy history row must be preserved after header migration");
}

{
  const h=makeHarness();
  upload(h,pdf1);
  upload(h,pdf2);
  const current=h.sheets.DocumentosEstudiante.rows[1].slice();
  const historyLength=h.sheets.HistorialVersionesDocumentos.rows.length;
  h.state.lockHeld=true;
  assert.throws(()=>h.context.restore({documentoId:current[0],versionId:h.sheets.HistorialVersionesDocumentos.rows[1][0],
    solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"}),/DOCUMENT_UPLOAD_LOCK_UNAVAILABLE/);
  assert.deepEqual(h.sheets.DocumentosEstudiante.rows[1],current,"restore lock contention must not mutate the active document");
  assert.equal(h.sheets.HistorialVersionesDocumentos.rows.length,historyLength);
  h.state.lockHeld=false;
}

{
  const h=makeHarness();
  upload(h,pdf1);
  const row=h.sheets.DocumentosEstudiante.rows[1];
  const response=h.context.download({documentoId:row[0],solicitudId:"OTHER-SOL",
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(response.status,"error");
  assert.equal(response.code,"RESOURCE_NOT_FOUND");
}


{
  const h=makeHarness();
  const first=upload(h,pdf1);
  const second=h.context.upload({expedienteId:"EXP-2",solicitudId:"SOL-2",tipoDocumento:"ACTA",
    fileName:"renombrada.pdf",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(second.status,"error");
  assert.equal(second.code,"DUPLICATE_DOCUMENT_EXACT");
  assert.equal(h.files.size,1,"exact repository duplicate must not create another Drive file");
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,2);
}

{
  const h=makeHarness();
  const first=upload(h,pdf1);
  const same=h.context.upload({expedienteId:"EXP-1",solicitudId:"SOL-1",tipoDocumento:"ACTA",
    fileName:"acta-renombrada.pdf",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(same.status,"success");
  assert.equal(same.idempotent,true);
  assert.equal(same.documentoId,first.documentoId);
  assert.equal(h.files.size,1);
}

{
  const h=makeHarness();
  const first=h.context.upload({expedienteId:"EXP-1",solicitudId:"SOL-1",tipoDocumento:"ACTA",
    fileName:"acta.pdf",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),importBatchId:"BATCH-1",
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  const duplicate=h.context.upload({expedienteId:"EXP-2",solicitudId:"SOL-2",tipoDocumento:"ACTA",
    fileName:"acta-copia.pdf",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),importBatchId:"BATCH-1",
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(duplicate.code,"DUPLICATE_EXACT_WITHIN_BATCH");
  assert.equal(h.files.size,1);
}

{
  const h=makeHarness();
  upload(h,pdf1);
  h.sheets.ConfiguracionInstitucional=makeSheet([
    ["Clave","Valor","Estado"],
    ["POLITICA_DUPLICADOS_DOCUMENTALES","CREAR_ENLACE_REFERENCIA_SIN_DUPLICAR_ARCHIVO","Activo"]
  ]);
  const reference=h.context.upload({expedienteId:"EXP-2",solicitudId:"SOL-2",tipoDocumento:"ACTA",
    fileName:"referencia.pdf",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(reference.status,"success");
  assert.equal(reference.duplicate,true);
  assert.equal(reference.duplicateType,"REFERENCIA_SIN_COPIA");
  assert.equal(reference.fileCreated,false);
  assert.equal(h.files.size,1,"reference policy must reuse the original Drive file");
  assert.equal(h.sheets.DocumentosEstudiante.rows.length,3);
  assert.equal(h.sheets.DocumentosEstudiante.rows[2][5],h.sheets.DocumentosEstudiante.rows[1][5]);
  assert.equal(h.sheets.DocumentosEstudiante.rows[2][17],h.sheets.DocumentosEstudiante.rows[1][0]);
}

{
  const h=makeHarness();
  const hash=crypto.createHash("sha256").update(pdf1).digest("hex");
  h.sheets.InventarioDocumentalLegado=makeSheet([
    ["DocumentoId","InstitutionID","HashSHA256"],
    ["LEG-1","INST-1",hash]
  ]);
  const duplicate=h.context.upload({expedienteId:"EXP-1",solicitudId:"SOL-1",tipoDocumento:"ACTA",
    fileName:"acta.pdf",fileData:"data:application/pdf;base64,"+pdf1.toString("base64"),
    _verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(duplicate.code,"DUPLICATE_LEGACY_INVENTORY");
  assert.equal(h.files.size,0,"legacy inventory duplicate must be detected before Drive write");
}

{
  const h=makeHarness();
  upload(h,pdf1);
  const row=h.sheets.DocumentosEstudiante.rows[1];
  h.setFileBytes(row[5],pdf2);
  const verification=h.context.verify({documentoId:row[0],solicitudId:"SOL-1",_verifiedUserId:"USER-1",_verifiedRole:"Secretary"});
  assert.equal(verification.status,"error");
  assert.equal(verification.code,"DOCUMENT_INTEGRITY_MISMATCH");
}

const secretary = fs.readFileSync(path.join(__dirname,"../../js/secretary.js"),"utf8");
assert.ok(secretary.includes("createStudentDocumentAccessToken"));
assert.ok(secretary.includes("getSecureDocumentStream"));
assert.ok(!secretary.includes("'getStudentDocumentFile'"),"legacy direct download action is not used by the client");
assert.ok(!secretary.includes("d.driveUrl"),"student-document UI must not render direct Drive URLs");

assert.match(source,/case "getSecureDocumentStream": result = getSecureDocumentStream\(payload\); break;/);
assert.match(source,/case "getStudentDocumentFile": result = \{ status: "error", code: "SECURE_DOCUMENT_STREAM_REQUIRED"/);
assert.doesNotMatch(source,/driveUrl: r\[6\]/);
assert.match(source,/case "createStudentDocumentAccessToken": result = createStudentDocumentAccessToken\(payload\); break;/);
assert.match(source,/const secureDocumentAction = \["createStudentDocumentAccessToken", "getSecureDocumentStream"\]/);
assert.match(source,/requestedDocumentOperation === "PREVIEW" \? "previewStudentDocument" : "getStudentDocumentFile"/);
assert.match(source,/claims.operation !== requestedOperation/);
assert.match(source,/validateContextualAccess\(permissionAction, payload, verifiedUserId, userRole\)/);
assert.doesNotMatch(source,/getDownloadUrl\(\)/);
assert.match(source,/function consumeStudentDocumentAccessToken_\(tokenId, token\)[\s\S]*lock\.waitLock\(5000\)[\s\S]*cache\.remove\(key\)/);
console.log("academic-student-document-private-storage: PASS");
