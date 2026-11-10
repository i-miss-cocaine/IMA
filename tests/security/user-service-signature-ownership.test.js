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
      "Identidad","identidad.pdf","DRIVE-1"]
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
    ownershipCalls:[],events:[],permissionCalls:0};
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
    Utilities:{getUuid:()=>"UUID-1"},
    computeDocumentSHA256:value=>"SHA256:"+value,
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

  const mismatchedRequest=makeHarness({requestSolicitudId:"SOL-OTHER"});
  assert.throws(()=>mismatchedRequest.execute(),/RESOURCE_NOT_FOUND/);
  assert.equal(mismatchedRequest.state.ownershipCalls.length,0);
  assert.equal(mismatchedRequest.state.txSheetRequests,0);

  const busy=makeHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.equal(busy.state.spreadsheetOpens,0);
  assert.equal(busy.documentSheet.reads,0);
  assert.equal(busy.state.releases,0);

  const deniedRole=makeHarness({permissionAllowed:false});
  assert.throws(()=>deniedRole.execute(),/AUTH_PERMISSION_DENIED/);
  assert.equal(deniedRole.state.lockAttempts,0);
  assert.equal(deniedRole.state.spreadsheetOpens,0);

  const noIdentity=makeHarness({identityAllowed:false});
  assert.throws(()=>noIdentity.execute(),/AUTH_PERMISSION_DENIED|VERIFIED_IDENTITY_REQUIRED/);
  assert.equal(noIdentity.state.lockAttempts,0);

  const requestOnly=makeHarness({expedienteId:"",storedSolicitudId:"SOL-1"});
  requestOnly.execute();
  assert.deepEqual(requestOnly.state.ownershipCalls[0],{type:"SOLICITUD_ADMISION",id:"SOL-1",operation:"UPDATE"});
}

console.log("USER advanced signature request document ownership, RBAC, idempotency and lock contracts: PASS");
