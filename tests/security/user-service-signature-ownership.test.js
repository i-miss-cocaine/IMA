const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next === -1 ? source.length : next);
}

function makeHarness(options = {}) {
  const documentRows = [
    ["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileID"],
    [options.documentId || "DOC-1", options.expedienteId === undefined ? "EXP-1" : options.expedienteId,
      options.storedSolicitudId === undefined ? "SOL-1" : options.storedSolicitudId,
      "Identidad","identidad.pdf",options.driveFileId === undefined ? "DRIVE-1" : options.driveFileId]
  ];
  const admissionRows = [
    ["SolicitudID","SolicitanteID","EstudianteID","TipoTramite","Descripcion","Fecha","Estado","","","","","","","","ExpedienteID"],
    ["SOL-1","U-REQUESTER","STU-1","Constancia","Solicitud de constancia","","EnRevision","","","","","","","","EXP-1"]
  ];
  const documentSheet = {
    reads:0,
    getLastRow(){return documentRows.length;},
    getDataRange(){this.reads++;return {getValues(){return documentRows.map(row=>row.slice());}};}
  };
  const admissionSheet = {
    reads:0,
    getDataRange(){this.reads++;return {getValues(){return admissionRows.map(row=>row.slice());}};}
  };
  const transactions = {
    rows:[["TransaccionID","DocumentoID","SolicitudID","FirmanteID","FirmanteNombre","FirmanteEmail","MecanismoFirma","ProveedorID","DocumentoHash","Estado","FechaSolicitud","FechaRespuesta","CertificadoX509Ref"]],
    reads:0,appends:[],
    getDataRange(){this.reads++;const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
    appendRow(row){assert.equal(state.held,true,"transaction append must occur while lock is held");this.appends.push(row.slice());this.rows.push(row.slice());}
  };
  const ss = {
    getSheetByName(name){
      assert.equal(state.held,true,"document and admission sheets must be read under lock");
      if(name==="DocumentosEstudiante")return documentSheet;
      if(name==="SolicitudesAdmision")return admissionSheet;
      return null;
    }
  };
  const state={held:false,lockAttempts:0,releases:0,spreadsheetOpens:0,txSheetRequests:0,
    ownershipCalls:[],events:[],permissionCalls:0,driveReads:0};
  const context={
    validateRolePermission:(action,payload)=>{state.permissionCalls++;assert.equal(action,"createAdvancedSignatureRequest");return {authorized:options.permissionAllowed!==false};},
    getUserVerifiedRole:payload=>{if(options.identityAllowed===false)return "NO_ACCESS";payload._verifiedUserId="ACTOR-1";return options.role||"Director";},
    getUserContextScope:()=>options.scopeAllowed===false
      ?{status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED"}
      :{status:"success",userId:"ACTOR-1",role:options.role||"Director",institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},
    assertRecordOwnership:(payload,type,id,operation)=>{
      assert.equal(state.held,true,"ownership must be checked under lock");
      state.ownershipCalls.push({type,id,operation});
      if(options.ownerAuthorized===false)return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};
      const departmentId=options.ownerDepartment||"D1";
      if(departmentId!=="D1")return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};
      return {authorized:true,departmentId};
    },
    LockService:{getScriptLock:()=>({tryLock:()=>{state.lockAttempts++;if(options.lockAvailable===false)return false;state.held=true;return true;},
      releaseLock:()=>{assert.equal(state.held,true);state.held=false;state.releases++;}})},
    SpreadsheetApp:{openById:id=>{assert.equal(state.held,true);assert.equal(id,"SPREADSHEET");state.spreadsheetOpens++;return ss;}},
    SPREADSHEET_ID:"SPREADSHEET",
    getOrCreateSheet:(_ss,name)=>{assert.equal(state.held,true);assert.equal(name,"TransaccionesFirmaAvanzada");state.txSheetRequests++;return transactions;},
    Utilities:{
      getUuid:()=>"UUID-1",
      DigestAlgorithm:{SHA_256:"SHA_256"},
      computeDigest:(algorithm,bytes)=>{assert.equal(algorithm,"SHA_256");assert.deepEqual(Array.from(bytes),[1,2,3]);return Array(32).fill(1);}
    },
    DriveApp:{getFileById:fileId=>{
      assert.equal(state.held,true,"Drive file bytes must be read while the lock is held");
      assert.equal(state.ownershipCalls.length,1,"Drive bytes must not be read before ownership verification");
      state.driveReads++;assert.equal(fileId,"DRIVE-1");
      if(options.driveReadFails)throw new Error("drive access denied");
      return {getBlob:()=>({getBytes:()=>options.fileBytes===undefined?[1,2,3]:options.fileBytes})};
    }},
    logStructuredEvent:(_service,_action,_level,code,_message,data,role)=>state.events.push({code,data,role}),
    Date
  };
  vm.runInNewContext(extractFunction("assertAdvancedSignatureDocumentScope_")+"\n"+extractFunction("createAdvancedSignatureRequest"),context);
  const payload={documentoId:options.requestDocumentId||"DRIVE-1",solicitudId:options.requestSolicitudId===undefined?"SOL-1":options.requestSolicitudId,
    firmanteId:"SIGNER-1",firmanteNombre:"Firmante de prueba",firmanteEmail:"signer@example.test"};
  return {execute:()=>context.createAdvancedSignatureRequest(payload),payload,transactions,documentSheet,admissionSheet,state};
}

{
  const valid=makeHarness();
  const result=valid.execute();
  assert.equal(result.status,"success");
  assert.equal(result.documentoId,"DOC-1","Drive file references must resolve to the canonical document ID");
  assert.equal(valid.transactions.appends.length,1);
  assert.equal(valid.transactions.appends[0][1],"DOC-1");
  assert.equal(valid.transactions.appends[0][2],"SOL-1");
  assert.equal(valid.transactions.appends[0][3],"SIGNER-1");
  assert.equal(valid.transactions.appends[0][8],"01".repeat(32),"persist the SHA-256 digest of the actual source bytes");
  assert.equal(result.documentoHash,"01".repeat(32));
  assert.equal(valid.state.driveReads,1);
  assert.equal(valid.state.ownershipCalls.length,1);
  assert.deepEqual(valid.state.ownershipCalls[0],{type:"EXPEDIENTE_ESTUDIANTE",id:"EXP-1",operation:"UPDATE"});
  assert.equal(valid.state.events[0].code,"ADVANCED_SIGNATURE_REQUEST_CREATED");
  assert.equal(valid.state.events[0].data.actorUserId,"ACTOR-1");
  assert.equal(valid.state.held,false);
  assert.equal(valid.state.releases,1);

  assert.throws(()=>valid.execute(),/SIGNATURE_REQUEST_ALREADY_PENDING/);
  assert.equal(valid.transactions.appends.length,1,"a second pending request for the same document/signer must not be created");
  assert.equal(valid.state.releases,2);

  const crossDepartment=makeHarness({ownerDepartment:"D2"});
  assert.throws(()=>crossDepartment.execute(),/RESOURCE_SCOPE_DENIED/);
  assert.equal(crossDepartment.state.txSheetRequests,0);
  assert.equal(crossDepartment.transactions.appends.length,0);
  assert.equal(crossDepartment.state.held,false);
  assert.equal(crossDepartment.state.releases,1);

  const noOwnership=makeHarness({ownerAuthorized:false});
  assert.throws(()=>noOwnership.execute(),/RESOURCE_SCOPE_DENIED/);
  assert.equal(noOwnership.state.txSheetRequests,0);
  assert.equal(noOwnership.transactions.appends.length,0);
  assert.equal(noOwnership.state.driveReads,0,"do not read source bytes before ownership is authorized");

  const mismatchedRequest=makeHarness({requestSolicitudId:"SOL-OTHER"});
  assert.throws(()=>mismatchedRequest.execute(),/RESOURCE_NOT_FOUND/);
  assert.equal(mismatchedRequest.state.ownershipCalls.length,0);
  assert.equal(mismatchedRequest.state.txSheetRequests,0);

  const busy=makeHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.equal(busy.state.spreadsheetOpens,0);
  assert.equal(busy.documentSheet.reads,0);
  assert.equal(busy.state.releases,0);
  assert.equal(busy.state.driveReads,0);

  const deniedRole=makeHarness({permissionAllowed:false});
  assert.throws(()=>deniedRole.execute(),/AUTH_PERMISSION_DENIED/);
  assert.equal(deniedRole.state.lockAttempts,0);
  assert.equal(deniedRole.state.spreadsheetOpens,0);

  const noIdentity=makeHarness({identityAllowed:false});
  assert.throws(()=>noIdentity.execute(),/AUTH_PERMISSION_DENIED|VERIFIED_IDENTITY_REQUIRED/);
  assert.equal(noIdentity.state.lockAttempts,0);

  const forgedHash=makeHarness();
  forgedHash.payload.documentoHash="0".repeat(64);
  assert.throws(()=>forgedHash.execute(),/DOCUMENT_HASH_MISMATCH/);
  assert.equal(forgedHash.transactions.appends.length,0);
  assert.equal(forgedHash.state.driveReads,1);

  const malformedHash=makeHarness();
  malformedHash.payload.documentoHash="not-a-sha256";
  assert.throws(()=>malformedHash.execute(),/DOCUMENT_HASH_FORMAT_INVALID/);
  assert.equal(malformedHash.transactions.appends.length,0);

  const missingFile=makeHarness({driveFileId:"",requestDocumentId:"DOC-1"});
  assert.throws(()=>missingFile.execute(),/SIGNATURE_SOURCE_FILE_UNAVAILABLE/);
  assert.equal(missingFile.state.driveReads,0);
  assert.equal(missingFile.transactions.appends.length,0);

  const emptyFile=makeHarness({fileBytes:[]});
  assert.throws(()=>emptyFile.execute(),/SIGNATURE_SOURCE_FILE_EMPTY/);
  assert.equal(emptyFile.transactions.appends.length,0);

  const inaccessibleFile=makeHarness({driveReadFails:true});
  assert.throws(()=>inaccessibleFile.execute(),/SIGNATURE_SOURCE_FILE_UNAVAILABLE/);
  assert.equal(inaccessibleFile.transactions.appends.length,0);

  const requestOnly=makeHarness({expedienteId:"",storedSolicitudId:"SOL-1"});
  requestOnly.execute();
  assert.deepEqual(requestOnly.state.ownershipCalls[0],{type:"SOLICITUD_ADMISION",id:"SOL-1",operation:"UPDATE"});
}

console.log("USER advanced signature request ownership, actual-file SHA-256, hash-claim validation, RBAC, idempotency and lock contracts: PASS");


function makeStatusHarness(options = {}) {
  const transactionRow = ["TX-1","DOC-1","SOL-1","SIGNER-1","Signer","signer@example.test",
    "FirmaAvanzadaCualificada","PSC-1","HASH-1",options.status || "Pendiente","2026-11-10T12:00:00.000Z","","CERT-SECRET"];
  const state = {held:false,opens:0,keyReads:0,detailReads:0,ownershipCalls:0,releases:0,events:[]};
  const sheet = {
    getLastRow:()=>2,
    getRange:(row,col,numRows,numCols)=>({
      getValues:()=>{
        if(row===2&&col===1&&numCols===3){state.keyReads++;return [[transactionRow[0],transactionRow[1],transactionRow[2]]];}
        if(row===2&&col===1&&numCols===13){state.detailReads++;return [transactionRow.slice()];}
        throw new Error("Unexpected transaction range read");
      }
    })
  };
  const ss = {getSheetByName:name=>{assert.equal(state.held,true);assert.equal(name,"TransaccionesFirmaAvanzada");return sheet;}};
  const context = {
    validateRolePermission:(action)=>{assert.equal(action,"checkAdvancedSignatureStatus");return {authorized:options.permissionAllowed!==false};},
    getUserVerifiedRole:payload=>{payload._verifiedUserId="ACTOR-1";return "Director";},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(options.lockAvailable===false)return false;state.held=true;return true;},
      releaseLock:()=>{assert.equal(state.held,true);state.held=false;state.releases++;}})},
    SpreadsheetApp:{openById:()=>{assert.equal(state.held,true);state.opens++;return ss;}},
    SPREADSHEET_ID:"SPREADSHEET",
    getOrCreateSheet:(_ss,name)=>{assert.equal(name,"TransaccionesFirmaAvanzada");return sheet;},
    assertAdvancedSignatureDocumentScope_:(_payload,_ss,docId,requestId,operation)=>{
      state.ownershipCalls++;
      assert.equal(state.keyReads,1,"minimal transaction keys must be read before ownership");
      assert.equal(state.detailReads,0,"private transaction details must not be read before ownership");
      assert.equal(docId,"DOC-1");assert.equal(requestId,"SOL-1");assert.equal(operation,"READ");
      return {authorized:options.ownerAuthorized!==false,code:"RESOURCE_SCOPE_DENIED"};
    },
    logStructuredEvent:(_service,_fn,_level,code,_message,data,role)=>state.events.push({code,data,role}),
    Date
  };
  vm.runInNewContext(extractFunction("checkAdvancedSignatureStatus"),context);
  const payload={transaccionId:"TX-1"};
  return {execute:(extra)=>context.checkAdvancedSignatureStatus(Object.assign({},payload,extra||{})),state,payload};
}

{
  const valid=makeStatusHarness({status:"Completada"});
  const result=valid.execute();
  assert.equal(result.status,"success");
  assert.equal(result.estadoTransaccion,"Completada");
  assert.equal(result.esFirmadoValido,false,"a completed status is not proof of a cryptographically valid signature");
  assert.equal(result.verificacionCriptograficaPendiente,true);
  assert.equal(result.requiereValidacionAutenticadaProveedor,true);
  assert.equal(result.documentoId,"DOC-1");
  assert.equal("certificadoX509Ref" in result,false,"private certificate reference must not be exposed");
  assert.equal(valid.state.detailReads,1);
  assert.equal(valid.state.ownershipCalls,1);
  assert.equal(valid.state.held,false);
  assert.equal(valid.state.releases,1);
  assert.equal(valid.state.events[0].code,"ADVANCED_SIGNATURE_STATUS_VIEWED");

  const denied=makeStatusHarness({ownerAuthorized:false});
  assert.throws(()=>denied.execute(),/RESOURCE_SCOPE_DENIED/);
  assert.equal(denied.state.keyReads,1);
  assert.equal(denied.state.detailReads,0,"out-of-scope transaction details must remain unread");
  assert.equal(denied.state.releases,1);

  const busy=makeStatusHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.equal(busy.state.opens,0);
  assert.equal(busy.state.keyReads,0);
  assert.equal(busy.state.detailReads,0);
  assert.equal(busy.state.releases,0);

  const forgedCallback=makeStatusHarness();
  assert.throws(()=>forgedCallback.execute({respuestaProveedor:{estado:"Completada",certificado:"FORGED"}}),
    /SIGNATURE_CALLBACK_AUTHENTICATION_REQUIRED/);
  assert.equal(forgedCallback.state.opens,0,"client-supplied provider responses must be rejected before storage access");
}

function makeManualSignatureHarness(options = {}) {
  const headers=["FirmaID","SolicitudID","DocumentoID","FirmanteID","RolFirmante","TipoFirma","TokenVerificacion","FechaFirma","IPOrigen","DocumentoHash","SignatureHash"];
  const initial=options.rows||[];
  const rows=[headers].concat(initial.map(row=>row.slice()));
  const state={held:false,opens:0,reads:0,appends:0,releases:0,ownershipCalls:0,events:[]};
  const sheet={
    getDataRange(){assert.equal(state.held,true);state.reads++;return {getValues:()=>rows.map(row=>row.slice())};},
    appendRow(row){assert.equal(state.held,true);state.appends++;rows.push(row.slice());}
  };
  const context={
    validateRolePermission:action=>{assert.equal(action,"registerDocumentSignature");return {authorized:options.permissionAllowed!==false};},
    getUserVerifiedRole:payload=>{payload._verifiedUserId=options.actorId||"ACTOR-1";return options.role||"Director";},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(options.lockAvailable===false)return false;state.held=true;return true;},
      releaseLock:()=>{assert.equal(state.held,true);state.held=false;state.releases++;}})},
    SpreadsheetApp:{openById:()=>{assert.equal(state.held,true);state.opens++;return {}; }},
    SPREADSHEET_ID:"SPREADSHEET",
    assertAdvancedSignatureDocumentScope_:(_payload,_ss,docId,requestId,operation)=>{
      state.ownershipCalls++;assert.equal(state.held,true);assert.equal(docId,"DOC-1");assert.equal(requestId,"SOL-1");assert.equal(operation,"UPDATE");
      return {authorized:options.ownerAuthorized!==false,code:"RESOURCE_SCOPE_DENIED",documentId:"DOC-CANONICAL",departmentId:"D1"};
    },
    getOrCreateSheet:(_ss,name)=>{assert.equal(state.held,true);assert.equal(name,"FirmasConformidades");return sheet;},
    Utilities:{getUuid:()=>"UUID-1"},
    computeDocumentSHA256:value=>"HASH:"+value,
    logStructuredEvent:(_service,_fn,_level,code,_message,data,role)=>state.events.push({code,data,role}),
    Date
  };
  vm.runInNewContext(extractFunction("registerDocumentSignature"),context);
  const payload={solicitudId:"SOL-1",documentoId:"DOC-1",firmanteId:options.signerId||"ACTOR-1",
    tipoFirma:options.tipoFirma||"Conformidad Digital Institucional",documentoHash:options.documentoHash===undefined?"DOC-HASH-1":options.documentoHash};
  return {execute:()=>context.registerDocumentSignature(payload),state,rows,payload};
}

{
  const valid=makeManualSignatureHarness();
  const result=valid.execute();
  assert.equal(result.status,"success");
  assert.equal(result.documentoHash,"DOC-HASH-1");
  assert.match(result.signatureHash,/^HASH:/);
  assert.equal(valid.rows[1][2],"DOC-CANONICAL","persist canonical document identity");
  assert.equal(valid.rows[1][3],"ACTOR-1","the signer must be the verified actor");
  assert.equal(valid.state.ownershipCalls,1);
  assert.equal(valid.state.appends,1);
  assert.equal(valid.state.events[0].data.actorUserId,"ACTOR-1");
  assert.equal(valid.state.events[0].role,"Director");
  assert.equal(valid.state.held,false);
  assert.equal(valid.state.releases,1);

  const existingRow=["SIG-EXISTING","SOL-1","DOC-CANONICAL","ACTOR-1","Director",
    "Conformidad Digital Institucional","VERIF-EXISTING","2026-11-10T12:00:00.000Z","NO_DISPONIBLE","DOC-HASH-1","HASH:stable"];
  const retry=makeManualSignatureHarness({rows:[existingRow]});
  const retryResult=retry.execute();
  assert.equal(retryResult.isExisting,true);
  assert.equal(retryResult.firmaId,"SIG-EXISTING");
  assert.equal(retry.state.appends,0,"an exact retry must not append a second signature");

  const changedHash=makeManualSignatureHarness({rows:[existingRow],documentoHash:"OTHER-HASH"});
  assert.throws(()=>changedHash.execute(),/SIGNATURE_ALREADY_REGISTERED/);
  assert.equal(changedHash.state.appends,0);

  const ambiguous=makeManualSignatureHarness({rows:[existingRow,existingRow]});
  assert.throws(()=>ambiguous.execute(),/RESOURCE_OWNERSHIP_AMBIGUOUS/);
  assert.equal(ambiguous.state.appends,0);

  const wrongSigner=makeManualSignatureHarness({signerId:"OTHER-USER"});
  assert.throws(()=>wrongSigner.execute(),/SIGNER_IDENTITY_MISMATCH/);
  assert.equal(wrongSigner.state.lockAttempts||0,0);

  const advanced=makeManualSignatureHarness({tipoFirma:"Firma Avanzada Cualificada X.509"});
  assert.throws(()=>advanced.execute(),/SIGNATURE_PROVIDER_CALLBACK_REQUIRED/);
  assert.equal(advanced.state.opens,0);

  const denied=makeManualSignatureHarness({ownerAuthorized:false});
  assert.throws(()=>denied.execute(),/RESOURCE_SCOPE_DENIED/);
  assert.equal(denied.state.reads,0);
  assert.equal(denied.state.appends,0);

  const busy=makeManualSignatureHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.equal(busy.state.opens,0);
  assert.equal(busy.state.reads,0);
  assert.equal(busy.state.releases,0);

  const forbidden=makeManualSignatureHarness({permissionAllowed:false});
  assert.throws(()=>forbidden.execute(),/AUTH_PERMISSION_DENIED/);
  assert.equal(forbidden.state.lockAttempts||0,0);
}

console.log("USER manual conformity signer identity, ownership, idempotency and lock contracts: PASS");

function makeAuditCertificateHarness(options = {}) {
  const rows = [
    ["FirmaID","SolicitudID","DocumentoID","FirmanteID","RolFirmante","TipoFirma","TokenVerificacion","FechaFirma","IPOrigen","DocumentoHash","SignatureHash"],
    ["SIG-1","SOL-1","DOC-1","U-1","Director","Conformidad manual","TOK-1","2026-11-10T10:00:00Z","10.0.0.1","HASH-DOC","HASH-SIG-1"],
    ["SIG-2","SOL-1","DOC-2","U-2","Secretaría","Conformidad manual","TOK-2","2026-11-10T11:00:00Z","10.0.0.2","HASH-DOC-2","HASH-SIG-2"],
    ["SIG-3","SOL-2","DOC-1","U-3","Director","Conformidad manual","TOK-3","","","",""]
  ];
  const state = { held:false, fullReads:0, keyReads:0, releases:0, scopes:[], events:[] };
  const sheet = {
    getLastRow:()=>rows.length,
    getRange:(row,col,numRows,numCols)=>({getValues:()=>{state.keyReads++;return rows.slice(row-1,row-1+numRows).map(r=>r.slice(col-1,col-1+numCols));}}),
    getDataRange:()=>({getValues:()=>{assert.equal(state.held,true);state.fullReads++;return rows.map(r=>r.slice());}})
  };
  const context = {
    validateRolePermission:(action)=>{assert.equal(action,"generateSignatureAuditCertificate");return {authorized:options.permission!==false};},
    getUserVerifiedRole:payload=>{if(options.identity===false)return "NO_ACCESS";payload._verifiedUserId="ACTOR-1";return "Director";},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(options.lock===false)return false;state.held=true;return true;},
      releaseLock:()=>{assert.equal(state.held,true);state.held=false;state.releases++;}})},
    SpreadsheetApp:{openById:()=>{assert.equal(state.held,true);return {getSheetByName:name=>{assert.equal(name,"FirmasConformidades");return sheet;}};}},
    SPREADSHEET_ID:"SHEET",
    getOrCreateSheet:(_ss,name)=>{assert.equal(name,"FirmasConformidades");return sheet;},
    assertAdvancedSignatureDocumentScope_:(_payload,_ss,doc,req,op)=>{
      state.scopes.push({doc,req,op});
      return options.owner===false?{authorized:false,code:"RESOURCE_SCOPE_DENIED"}:
        {authorized:true,documentId:doc,solicitudId:req||"SOL-1",departmentId:"D1",role:"Director"};
    },
    computeDocumentSHA256:value=>"HASH-CERT:"+value,
    logStructuredEvent:(_s,_a,_l,code,_m,data)=>state.events.push({code,data}),
    Date
  };
  vm.runInNewContext(extractFunction("generateSignatureAuditCertificate"),context);
  return {run:payload=>context.generateSignatureAuditCertificate(payload),state};
}

{
  const valid=makeAuditCertificateHarness();
  const certificate=valid.run({documentoId:"DOC-1",solicitudId:"SOL-1"});
  assert.equal(certificate.totalFirmantes,1,"certificate must include only the exact request/document pair");
  assert.equal(certificate.pistaAuditoriaFirmantes[0].firmaId,"SIG-1");
  assert.equal(certificate.pistaAuditoriaFirmantes[0].tokenVerificacion,undefined,"verification tokens must not be exposed");
  assert.equal(valid.state.scopes[0].op,"READ");
  assert.equal(valid.state.fullReads,1);
  assert.equal(valid.state.releases,1);
  assert.equal(valid.state.events[0].code,"SIGNATURE_AUDIT_CERTIFICATE_VIEWED");

  const documentOnly=makeAuditCertificateHarness();
  assert.equal(documentOnly.run({documentoId:"DOC-1"}).solicitudId,"SOL-1");

  const ambiguous=makeAuditCertificateHarness();
  assert.throws(()=>ambiguous.run({solicitudId:"SOL-1"}),/RESOURCE_REFERENCE_AMBIGUOUS/);
  assert.equal(ambiguous.state.fullReads,0);

  const transaction=makeAuditCertificateHarness();
  const transactionCertificate=transaction.run({transactionId:"TOK-3"});
  assert.equal(transactionCertificate.solicitudId,"SOL-2");
  assert.equal(transactionCertificate.totalFirmantes,1);

  const mismatch=makeAuditCertificateHarness();
  assert.throws(()=>mismatch.run({documentoId:"DOC-1",solicitudId:"SOL-1",transactionId:"TOK-3"}),/SIGNATURE_TRANSACTION_NOT_FOUND/);

  const denied=makeAuditCertificateHarness({owner:false});
  assert.throws(()=>denied.run({documentoId:"DOC-1",solicitudId:"SOL-1"}),/RESOURCE_SCOPE_DENIED/);
  assert.equal(denied.state.fullReads,0,"private signature rows must not be read before ownership succeeds");
  assert.equal(denied.state.releases,1);

  const noPermission=makeAuditCertificateHarness({permission:false});
  assert.throws(()=>noPermission.run({documentoId:"DOC-1"}),/AUTH_PERMISSION_DENIED/);
  assert.equal(noPermission.state.releases,0);

  const noIdentity=makeAuditCertificateHarness({identity:false});
  assert.throws(()=>noIdentity.run({documentoId:"DOC-1"}),/VERIFIED_IDENTITY_REQUIRED/);
  assert.equal(noIdentity.state.releases,0);

  const busy=makeAuditCertificateHarness({lock:false});
  assert.throws(()=>busy.run({documentoId:"DOC-1"}),/Servicio ocupado/);
  assert.equal(busy.state.fullReads,0);
  assert.equal(busy.state.releases,0);

  const noEvidence=makeAuditCertificateHarness();
  const noEvidenceCertificate=noEvidence.run({transactionId:"TOK-3"});
  assert.equal(noEvidenceCertificate.documentoOriginalSHA256,null);
  assert.equal(noEvidenceCertificate.pistaAuditoriaFirmantes[0].timestampUTC,null);
  assert.equal(noEvidenceCertificate.pistaAuditoriaFirmantes[0].ipOrigen,null);
  assert.equal(noEvidenceCertificate.pistaAuditoriaFirmantes[0].signatureHash,null);
}

console.log("USER signature audit certificate identity, ownership, isolation, evidence and lock contracts: PASS");
