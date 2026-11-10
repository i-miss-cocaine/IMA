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
  const state={held:false,lockAttempts:0,releases:0,spreadsheetOpens:0,txSheetRequests:0,
    ownershipCalls:[],events:[],permissionCalls:0,driveReads:0};
  const signerRole=options.signerRole||"Director";
  const userRows=[["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta"],
    [options.signerId||"SIGNER-1",options.signerName||"Nombre canónico","","",options.signerEmail||"canonico@example.test","",""+signerRole,"","",options.signerPersonId||"PERS-SIGNER",options.signerState===undefined?"Activa":options.signerState]];
  if(options.duplicateSigner)userRows.push(userRows[1].slice());
  const scopeRows=[["AsignacionID","UserId","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserId"]];
  if(options.scopeRows)options.scopeRows.forEach(row=>scopeRows.push(row.slice()));
  else if(options.includeScope!==false)scopeRows.push(["ASG-1","SIGNER-1",signerRole,options.scopeType||"DEPARTAMENTO",options.scopeValues||JSON.stringify(["D1"]),"Activo","","","","","",""]);
  const expedienteRows=[["ExpedienteID","PersonaID"],["EXP-1",options.expedientePersonId||"PERS-STUDENT"]];
  const relationRows=[["RelacionID","ExpedienteID","ResponsableID","TipoParentesco","EsRepresentanteLegal","EsContactoEmergencia","EsResponsableFinanciero","AutorizadoPickUp","AccesoPortal","Estado","Observaciones"],
    ["REL-1","EXP-1","RESP-1","Madre",true,false,false,false,options.portalAccess===undefined?"Sí":options.portalAccess,options.relationState||"Activo",""]];
  const guardianRows=[["ResponsableID","PersonaID","Nombres","Apellidos","Identificacion","Telefono","Email","Direccion","Ocupacion","Estado"],
    ["RESP-1",options.guardianPersonId||"PERS-GUARD","Nombre","Tutora","","","guardian@example.test","","","Activo"]];
  const makeSheet=rows=>({getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())})});
  const sheets={Usuarios:makeSheet(userRows),AsignacionesAmbitosRoles:makeSheet(scopeRows),
    ExpedientesEstudiantes:makeSheet(expedienteRows),RelacionesEstudianteTutor:makeSheet(relationRows),
    ResponsablesTutores:makeSheet(guardianRows)};
  const ss = {
    getSheetByName(name){
      assert.equal(state.held,true,"document and signer records must be read under lock");
      if(name==="DocumentosEstudiante")return documentSheet;
      if(name==="SolicitudesAdmision")return admissionSheet;
      return sheets[name]||null;
    }
  };
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
  vm.runInNewContext(extractFunction("assertAdvancedSignatureDocumentScope_")+"\n"+extractFunction("assertAdvancedSignatureSignerScope_")+"\n"+extractFunction("createAdvancedSignatureRequest"),context);
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
  assert.equal(valid.transactions.appends[0][4],"Nombre canónico","signer name must come from the trusted user record");
  assert.equal(valid.transactions.appends[0][5],"canonico@example.test","signer email must come from the trusted user record");
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


  const missingSigner=makeHarness({signerId:"UNKNOWN"});
  assert.throws(()=>missingSigner.execute(),/SIGNATURE_SIGNER_NOT_FOUND/);
  assert.equal(missingSigner.state.txSheetRequests,0);
  assert.equal(missingSigner.state.driveReads,0);

  const duplicateSigner=makeHarness({duplicateSigner:true});
  assert.throws(()=>duplicateSigner.execute(),/SIGNATURE_SIGNER_ID_AMBIGUOUS/);
  assert.equal(duplicateSigner.transactions.appends.length,0);

  const inactiveSigner=makeHarness({signerState:"Suspendida"});
  assert.throws(()=>inactiveSigner.execute(),/SIGNATURE_SIGNER_INACTIVE/);
  assert.equal(inactiveSigner.state.txSheetRequests,0);

  const outOfDepartmentSigner=makeHarness({scopeValues:'["D2"]'});
  assert.throws(()=>outOfDepartmentSigner.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);
  assert.equal(outOfDepartmentSigner.state.txSheetRequests,0);

  const noScopeSigner=makeHarness({includeScope:false});
  assert.throws(()=>noScopeSigner.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);
  assert.equal(noScopeSigner.transactions.appends.length,0);

  const expiredScopeSigner=makeHarness({scopeRows:[["ASG-1","SIGNER-1","Director","DEPARTAMENTO",'["D1"]',"Activo","","","2020-01-01","2021-01-01","",""]]});
  assert.throws(()=>expiredScopeSigner.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);

  const institutionScopeSigner=makeHarness({scopeType:"INSTITUCION",scopeValues:'["INST-1"]'});
  assert.equal(institutionScopeSigner.execute().status,"success");

  const studentSigner=makeHarness({signerRole:"Estudiante",signerPersonId:"PERS-STUDENT",includeScope:false});
  assert.equal(studentSigner.execute().status,"success");

  const wrongStudentSigner=makeHarness({signerRole:"Estudiante",signerPersonId:"PERS-OTHER",includeScope:false});
  assert.throws(()=>wrongStudentSigner.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);

  const guardianSigner=makeHarness({signerRole:"Madre",signerPersonId:"PERS-GUARD",includeScope:false});
  assert.equal(guardianSigner.execute().status,"success");

  const unrelatedGuardian=makeHarness({signerRole:"Madre",signerPersonId:"PERS-OTHER",includeScope:false});
  assert.throws(()=>unrelatedGuardian.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);

  const disabledGuardianPortal=makeHarness({signerRole:"Madre",signerPersonId:"PERS-GUARD",portalAccess:"No",includeScope:false});
  assert.throws(()=>disabledGuardianPortal.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);

  const inactiveGuardianRelation=makeHarness({signerRole:"Madre",signerPersonId:"PERS-GUARD",relationState:"Revocado",includeScope:false});
  assert.throws(()=>inactiveGuardianRelation.execute(),/SIGNATURE_SIGNER_SCOPE_DENIED/);

  const requestOnly=makeHarness({expedienteId:"",storedSolicitudId:"SOL-1"});
  requestOnly.execute();
  assert.deepEqual(requestOnly.state.ownershipCalls[0],{type:"SOLICITUD_ADMISION",id:"SOL-1",operation:"UPDATE"});
}

console.log("USER advanced signature request ownership, signer identity/scope, canonical profile, actual-file SHA-256, hash-claim validation, RBAC, idempotency and lock contracts: PASS");


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
  if (options.extraRows) options.extraRows.forEach(row=>rows.push(row.slice()));
  const state = { held:false, opens:0, fullReads:0, keyReads:0, releases:0, scopes:[], events:[], requestOwnershipCalls:0 };
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
    SpreadsheetApp:{openById:()=>{assert.equal(state.held,true);state.opens++;return {getSheetByName:name=>{assert.equal(name,"FirmasConformidades");return options.sheetMissing?null:sheet;}};}},
    SPREADSHEET_ID:"SHEET",
    assertRecordOwnership:(_payload,type,id,op)=>{
      assert.equal(state.held,true,"request ownership must be revalidated under the certificate lock");
      state.requestOwnershipCalls++;
      assert.equal(type,"SOLICITUD_ADMISION");assert.equal(id,"SOL-1");assert.equal(op,"READ");
      return {authorized:options.requestOwner!==false};
    },
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
  assert.equal(valid.state.requestOwnershipCalls,0);
  assert.equal("ipOrigen" in certificate.pistaAuditoriaFirmantes[0],false,"raw IP addresses must not be exposed");
  assert.equal(certificate.naturalezaCertificado,"RESUMEN_AUDITORIA_NO_PROBATORIO");
  assert.equal(certificate.verificacionCriptografica,"NO_VERIFICADA");
  assert.equal(certificate.requiereValidacionAutenticadaProveedor,true);
  assert.match(certificate.alcanceIntegridadSHA256,/no es firma electrónica/);
  const certificateWithoutDigest={...certificate};delete certificateWithoutDigest.certificadoIntegridadSHA256;
  assert.equal(certificate.certificadoIntegridadSHA256,"HASH-CERT:"+JSON.stringify(certificateWithoutDigest));

  const documentOnly=makeAuditCertificateHarness();
  assert.equal(documentOnly.run({documentoId:"DOC-1"}).solicitudId,"SOL-1");

  const missingSheet=makeAuditCertificateHarness({sheetMissing:true});
  assert.throws(()=>missingSheet.run({documentoId:"DOC-1",solicitudId:"SOL-1"}),/NO_SIGNATURES_FOUND/);
  assert.equal(missingSheet.state.scopes.length,1,"document ownership is checked even when the signature sheet is absent");
  assert.equal(missingSheet.state.fullReads,0);
  assert.equal(missingSheet.state.releases,1);

  const ambiguous=makeAuditCertificateHarness();
  assert.throws(()=>ambiguous.run({solicitudId:"SOL-1"}),/RESOURCE_REFERENCE_AMBIGUOUS/);
  assert.equal(ambiguous.state.requestOwnershipCalls,1,"request ownership must be checked before signature-key lookup");
  assert.equal(ambiguous.state.keyReads,1);
  assert.equal(ambiguous.state.fullReads,0);

  const requestDenied=makeAuditCertificateHarness({requestOwner:false});
  assert.throws(()=>requestDenied.run({solicitudId:"SOL-1"}),/RESOURCE_NOT_FOUND/);
  assert.equal(requestDenied.state.requestOwnershipCalls,1);
  assert.equal(requestDenied.state.opens,0,"unauthorized requests must be denied before opening signature storage");
  assert.equal(requestDenied.state.keyReads,0,"unauthorized requests must not enumerate signature references");
  assert.equal(requestDenied.state.fullReads,0);
  assert.equal(requestDenied.state.releases,1);

  const transaction=makeAuditCertificateHarness();
  const transactionCertificate=transaction.run({transactionId:"TOK-3"});
  assert.equal(transactionCertificate.solicitudId,"SOL-2");
  assert.equal(transactionCertificate.totalFirmantes,1);
  assert.equal("ipOrigen" in transactionCertificate.pistaAuditoriaFirmantes[0],false);

  const unknownTransaction=makeAuditCertificateHarness();
  assert.throws(()=>unknownTransaction.run({transactionId:"UNKNOWN-TOKEN"}),/RESOURCE_NOT_FOUND/);
  assert.equal(unknownTransaction.state.fullReads,0);
  const ambiguousTransaction=makeAuditCertificateHarness({extraRows:[
    ["SIG-4","SOL-1","DOC-2","U-4","Director","Conformidad manual","TOK-3","","","HASH-DOC-2","HASH-SIG-4"]
  ]});
  assert.throws(()=>ambiguousTransaction.run({transactionId:"TOK-3"}),/RESOURCE_NOT_FOUND/);
  assert.equal(ambiguousTransaction.state.fullReads,0);

  const mismatch=makeAuditCertificateHarness();
  assert.throws(()=>mismatch.run({documentoId:"DOC-1",solicitudId:"SOL-1",transactionId:"TOK-3"}),/SIGNATURE_TRANSACTION_NOT_FOUND/);

  const denied=makeAuditCertificateHarness({owner:false});
  assert.throws(()=>denied.run({documentoId:"DOC-1",solicitudId:"SOL-1"}),/RESOURCE_NOT_FOUND/);
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
  assert.equal("ipOrigen" in noEvidenceCertificate.pistaAuditoriaFirmantes[0],false);
  assert.equal(noEvidenceCertificate.pistaAuditoriaFirmantes[0].signatureHash,null);
}

console.log("USER signature audit certificate identity, ownership, isolation, evidence and lock contracts: PASS");


function makeProviderCallbackHarness(options = {}) {
  const cacheValues = new Map();
  const state = { held:false, lockAttempts:0, releases:0, cacheGets:0, cachePuts:0, events:[], secretReads:[] };
  const secret = options.secret === undefined ? "S".repeat(40) : options.secret;
  const context = {
    Date: { now: () => options.now || 1794344400000 },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => {
      state.secretReads.push(key);
      return options.secretUnavailable ? null : secret;
    }})},
    computeHmacSignature: (message, key) => {
      assert.equal(key, secret);
      return "a".repeat(64);
    },
    LockService: { getScriptLock: () => ({
      tryLock: () => { state.lockAttempts++; if(options.lockAvailable===false)return false; state.held=true; return true; },
      releaseLock: () => { assert.equal(state.held,true); state.held=false; state.releases++; }
    })},
    CacheService: { getScriptCache: () => ({
      get: key => { state.cacheGets++; return cacheValues.get(key)||null; },
      put: (key,value,ttl) => { state.cachePuts++; assert.equal(ttl,600); cacheValues.set(key,value); }
    })},
    logStructuredEvent: (_service,_action,_level,code,_message,data) => state.events.push({code,data})
  };
  vm.runInNewContext(extractFunction("handleSignatureProviderCallback_"), context);
  const payload = { transaccionId:"TX-123", estadoProveedor:"completed", referenciaEvento:"EVT-1" };
  const envelope = {
    sourceService:"SIGNATURE_PROVIDER:PSC_HN", targetService:"USER",
    action:"signatureStatusCallback", requestId:"REQ-CALLBACK-123",
    timestamp:context.Date.now(), correlationId:"CORR-123", payload,
    hmacSignature:"a".repeat(64)
  };
  return { run:extra=>context.handleSignatureProviderCallback_(Object.assign({},envelope,extra||{})), envelope, state };
}

{
  const valid=makeProviderCallbackHarness();
  const accepted=valid.run();
  assert.equal(accepted.code,"SIGNATURE_CALLBACK_AUTHENTICATED_PENDING_VALIDATION");
  assert.equal(accepted.callbackAuthenticated,true);
  assert.equal(accepted.estadoTransaccionActualizado,false,"an authenticated callback must not mutate transaction state before provider-specific validation");
  assert.equal(accepted.verificacionCriptografica,"NO_VERIFICADA");
  assert.equal(valid.state.cachePuts,1);
  assert.equal(valid.state.releases,1);
  assert.equal(valid.state.events[0].code,"SIGNATURE_PROVIDER_CALLBACK_AUTHENTICATED");
  assert.throws(()=>valid.run(),/SIGNATURE_CALLBACK_REPLAY_DETECTED/);
  assert.equal(valid.state.cachePuts,1);

  const invalidSignature=makeProviderCallbackHarness();
  assert.throws(()=>invalidSignature.run({hmacSignature:"b".repeat(64)}),/SIGNATURE_CALLBACK_AUTHENTICATION_FAILED/);
  assert.equal(invalidSignature.state.lockAttempts,0,"unauthenticated IDs must not be reserved in replay cache");

  const unknownProvider=makeProviderCallbackHarness({secretUnavailable:true});
  assert.throws(()=>unknownProvider.run(),/SIGNATURE_CALLBACK_SECRET_NOT_CONFIGURED/);
  assert.equal(unknownProvider.state.lockAttempts,0);

  const stale=makeProviderCallbackHarness();
  assert.throws(()=>stale.run({timestamp:stale.envelope.timestamp-300001}),/SIGNATURE_CALLBACK_ENVELOPE_INVALID/);
  assert.equal(stale.state.secretReads.length,0);

  const wrongTarget=makeProviderCallbackHarness();
  assert.throws(()=>wrongTarget.run({targetService:"TASK"}),/SIGNATURE_CALLBACK_ENVELOPE_INVALID/);
  assert.equal(wrongTarget.state.secretReads.length,0);

  const invalidPayload=makeProviderCallbackHarness();
  assert.throws(()=>invalidPayload.run({payload:{transaccionId:"TX-1",estadoProveedor:"completed",certificado:"forged"}}),/SIGNATURE_CALLBACK_PAYLOAD_INVALID/);
  assert.equal(invalidPayload.state.secretReads.length,0);

  const busy=makeProviderCallbackHarness({lockAvailable:false});
  assert.throws(()=>busy.run(),/SIGNATURE_CALLBACK_SERVICE_BUSY/);
  assert.equal(busy.state.cacheGets,0);
  assert.equal(busy.state.cachePuts,0);
  assert.equal(busy.state.releases,0);
}
console.log("USER generic signature-provider callback authentication, replay protection and non-probative state contract: PASS");

{
  const nonStringStatus=makeProviderCallbackHarness();
  assert.throws(()=>nonStringStatus.run({payload:{transaccionId:"TX-1",estadoProveedor:{status:"completed"}}}),/SIGNATURE_CALLBACK_PAYLOAD_INVALID/);
  assert.equal(nonStringStatus.state.secretReads.length,0,"non-string provider status must be rejected before secret lookup");
  const oversizedCorrelation=makeProviderCallbackHarness();
  assert.throws(()=>oversizedCorrelation.run({correlationId:"C".repeat(129)}),/SIGNATURE_CALLBACK_ENVELOPE_INVALID/);
  assert.equal(oversizedCorrelation.state.secretReads.length,0);
}
console.log("USER callback strict scalar and correlation bounds: PASS");


function makeProviderConfigHarness(initialRows = [], options = {}) {
  let rows = initialRows.map(row => row.slice());
  const state = { held:false, opens:0, creates:0, lockAttempts:0, releases:0, reads:0 };
  const sheet = {
    getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => { state.reads++; return rows.map(row => row.slice()); } }),
    getRange: (row, col, rowCount, colCount) => ({
      getValues: () => Array.from({length:rowCount},(_,ri)=>Array.from({length:colCount},(_,ci)=>(rows[row-1+ri]||[])[col-1+ci] ?? "")),
      setValues: values => { for(let ri=0;ri<values.length;ri++){while(rows.length<row+ri)rows.push([]);rows[row-1+ri]=values[ri].slice();} },
      clearContent: () => { if(rows[row-1])rows[row-1][col-1]=""; }
    }),
    appendRow: row => rows.push(row.slice()),
    insertRowBefore: row => rows.splice(row-1,0,[])
  };
  const ss = {
    getSheetByName: name => name==="ConfiguracionFirmaAvanzada" ? (options.noSheet ? null : sheet) : null,
    insertSheet: name => { assert.equal(name,"ConfiguracionFirmaAvanzada"); state.creates++; options.noSheet=false; return sheet; }
  };
  const propertyValues = new Map(Object.entries(options.properties || {}));
  const properties = {
    getProperty: key => propertyValues.get(key) || null,
    setProperty: (key,value) => propertyValues.set(key,String(value)),
    deleteProperty: key => propertyValues.delete(key)
  };
  const context = {
    LockService: { getScriptLock: () => ({
      tryLock: () => { state.lockAttempts++; if(options.lockAvailable===false)return false; state.held=true; return true; },
      releaseLock: () => { assert.equal(state.held,true); state.held=false; state.releases++; }
    })},
    PropertiesService: { getScriptProperties: () => properties },
    SpreadsheetApp: { openById: () => { state.opens++; return ss; } },
    SPREADSHEET_ID: "SPREADSHEET"
  };
  ["getAdvancedSignatureProviderSecretPropertyKey_","validateAdvancedSignatureProviderConfigJSON_",
    "ensureAdvancedSignatureProviderSheet_","configureAdvancedSignatureProvider",
    "getAdvancedSignatureProviderConfig"].forEach(name => vm.runInNewContext(extractFunction(name),context));
  return {configure:p=>context.configureAdvancedSignatureProvider(p),get:p=>context.getAdvancedSignatureProviderConfig(p||{}),state,rows:()=>rows,properties:propertyValues};
}
{
  const configured=makeProviderConfigHarness();
  const result=configured.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC de prueba",endpointUrl:"https://psc.example.test/api",apiKey:"API-SECRET-DO-NOT-STORE",hmacSecret:"H".repeat(40),_verifiedUserId:"ACTOR-1"});
  assert.equal(result.apiKeyConfigurada,true);assert.equal(result.hmacSecretConfigurado,true);
  assert.equal(configured.properties.get("IMA_SIGNATURE_PROVIDER_PSC_HN_API_KEY"),"API-SECRET-DO-NOT-STORE");
  assert.equal(configured.properties.get("IMA_SIGNATURE_PROVIDER_PSC_HN_HMAC_SECRET"),"H".repeat(40));
  assert.equal(configured.rows()[1][3],"");assert.equal(configured.rows()[1][10],"ACTOR-1");
  const publicConfig=configured.get();
  assert.equal(publicConfig.proveedores[0].apiKey,"••••••••");assert.equal(publicConfig.proveedores[0].hmacSecretConfigurado,true);
  assert.equal(JSON.stringify(publicConfig).includes("API-SECRET-DO-NOT-STORE"),false);
  assert.equal(JSON.stringify(publicConfig).includes("H".repeat(40)),false);
  configured.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC de prueba",endpointUrl:"https://psc.example.test/api"});
  assert.equal(configured.properties.get("IMA_SIGNATURE_PROVIDER_PSC_HN_API_KEY"),"API-SECRET-DO-NOT-STORE");

  const legacy=makeProviderConfigHarness([["PSC_OLD","PSC anterior","https://old.example.test","LEGACY-SECRET","FirmaAvanzadaCualificada","Habilitado","X.509_v3","Activo","{}","",""]]);
  legacy.configure({proveedorId:"PSC_NEW",nombreProveedor:"PSC nuevo"});
  assert.equal(legacy.properties.get("IMA_SIGNATURE_PROVIDER_PSC_OLD_API_KEY"),"LEGACY-SECRET");
  assert.equal(legacy.rows()[1][3],"");assert.equal(legacy.rows()[2][3],"");

  const precedence=makeProviderConfigHarness([
    ["ProveedorID","NombreProveedor","EndpointURL","ApiKeyLegacy","TipoMecanismo","PoliticaSelladoTiempo","FormatoCertificado","Estado","ConfiguracionJSON","FechaActualizacion","ActualizadoPor"],
    ["PSC_HN","PSC","https://psc.example.test","STALE-SECRET","FirmaAvanzadaCualificada","Habilitado","X.509_v3","Activo","{}","",""]
  ],{properties:{IMA_SIGNATURE_PROVIDER_PSC_HN_API_KEY:"ROTATED-SECRET"}});
  precedence.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC"});
  assert.equal(precedence.properties.get("IMA_SIGNATURE_PROVIDER_PSC_HN_API_KEY"),"ROTATED-SECRET");assert.equal(precedence.rows()[1][3],"");

  configured.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC de prueba",eliminarApiKey:true,eliminarHmacSecret:true});
  assert.equal(configured.properties.has("IMA_SIGNATURE_PROVIDER_PSC_HN_API_KEY"),false);
  assert.equal(configured.properties.has("IMA_SIGNATURE_PROVIDER_PSC_HN_HMAC_SECRET"),false);

  const sensitive=makeProviderConfigHarness();
  assert.throws(()=>sensitive.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC",configuracionJSON:{apiKey:"LEAK"}}),/SIGNATURE_PROVIDER_SECRET_IN_CONFIGURATION/);
  assert.equal(sensitive.state.opens,0);
  const endpoint=makeProviderConfigHarness();
  assert.throws(()=>endpoint.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC",endpointUrl:"https://user:pass@psc.example.test"}),/SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.equal(endpoint.state.opens,0);
  const weakHmac=makeProviderConfigHarness();
  assert.throws(()=>weakHmac.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC",hmacSecret:"short"}),/SIGNATURE_PROVIDER_HMAC_SECRET_INVALID/);
  assert.equal(weakHmac.state.opens,0);

  const busy=makeProviderConfigHarness([],{lockAvailable:false});
  assert.throws(()=>busy.configure({proveedorId:"PSC_HN",nombreProveedor:"PSC"}),/SIGNATURE_PROVIDER_CONFIGURATION_BUSY/);
  assert.equal(busy.state.opens,0);assert.equal(busy.state.releases,0);

  const empty=makeProviderConfigHarness([],{noSheet:true}),emptyConfig=empty.get();
  assert.equal(emptyConfig.proveedores.length,0);assert.equal(emptyConfig.configuracionDisponible,false);assert.equal(empty.state.creates,0);

  const legacyEndpoint=makeProviderConfigHarness([
    ["ProveedorID","NombreProveedor","EndpointURL","ApiKeyLegacy","TipoMecanismo","PoliticaSelladoTiempo","FormatoCertificado","Estado","ConfiguracionJSON","FechaActualizacion","ActualizadoPor"],
    ["PSC_LEGACY","PSC","https://user:pass@psc.example.test?token=SECRET","","FirmaAvanzadaCualificada","Habilitado","X.509_v3","Activo","{}","",""]
  ]);
  const safeLegacyView=legacyEndpoint.get();
  assert.equal(safeLegacyView.proveedores[0].endpointUrl,"");assert.equal(safeLegacyView.proveedores[0].endpointCredentialDetected,true);
}
console.log("USER signature provider credentials, legacy migration, masking, removal and read-only config contracts: PASS");
