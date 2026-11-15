"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
assert.doesNotThrow(() => new Function(source));
assert.match(source, /function dispatchWorkflowStatusNotification_\(/);
assert.match(source, /workflowResponse\.notificacion = dispatchWorkflowStatusNotification_\(/);
assert.match(source, /deduplicationKey:\s*\["WORKFLOW",\s*solicitudId,\s*decisionId,\s*state,\s*userId\]/);
assert.match(source, /lock\.releaseLock\(\);\s*\}\s*if \(workflowNotificationContext\)/);
assert.doesNotMatch(source.slice(source.indexOf("function dispatchWorkflowStatusNotification_"), source.indexOf("// [TAREA-F6-024]")), /observacionesInternas/);
function makeSheet(rows) {
  const data=rows.map(row=>row.slice());
  return {data,getLastRow(){return data.length;},getDataRange(){return {getValues(){return data.map(row=>row.slice());}};},
    appendRow(row){data.push(row.slice());},getRange(row,col){return {setValue(value){while(data.length<row)data.push([]);while(data[row-1].length<col)data[row-1].push("");data[row-1][col-1]=value;}};}};
}
function loadContext(extra={}) {
  const context={console,Date,Math,JSON,String,Number,Array,Object,Error,RegExp,
    PropertiesService:{getScriptProperties(){return {getProperty(){return null;}};}},
    SPREADSHEET_ID:"TEST",FRONTEND_URL:"https://portal.example.test/",...extra};
  vm.runInNewContext(source,context,{timeout:2000});return context;
}
for(const state of ["Requiere Corrección","Aprobada","Rechazada"]) {
  let sent=null;
  const users=makeSheet([["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta"],
    ["USR-1","Solicitante","","","user@example.test","","Estudiante","","","","ACTIVO"]]);
  const context=loadContext({SpreadsheetApp:{openById(){return {getSheetByName(name){return name==="Usuarios"?users:null;}};}},
    sendMultiChannelNotification(payload){sent=payload;return {status:"success",notificacionId:"NTF-1"};}});
  const result=context.dispatchWorkflowStatusNotification_({solicitudId:"TRAM-1",decisionId:"DEC-1",destinatarioUserId:"USR-1",estado:state,
    observacionesPublicas:"Dato público",observacionesInternas:"NO DEBE SALIR",fechaLimite:"2026-12-01"});
  assert.equal(result.status,"success");assert.equal(sent.userId,"USR-1");assert.equal(sent.emailRecipient,"");
  assert.match(sent.mensaje,new RegExp(state));assert.match(sent.mensaje,/Dato público/);assert.doesNotMatch(sent.mensaje,/NO DEBE SALIR/);
  assert.match(sent.deduplicationKey,/TRAM-1\|DEC-1/);assert.equal(sent.enlaceAccion,"https://portal.example.test/");
}
{
  let sent=null;
  const users=makeSheet([["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta","ConsentimientoCorreo"],
    ["USR-1","Solicitante","","","user@example.test","","Estudiante","","","","ACTIVO","TRUE"]]);
  const context=loadContext({SpreadsheetApp:{openById(){return {getSheetByName(){return users;}};}},
    sendMultiChannelNotification(payload){sent=payload;return {status:"success"};}});
  context.dispatchWorkflowStatusNotification_({solicitudId:"T",decisionId:"D",destinatarioUserId:"USR-1",estado:"Aprobada"});
  assert.equal(sent.emailRecipient,"user@example.test");
}
{
  const notificationSheet=makeSheet([["NotificacionID","UserId","Tipo","Titulo","Mensaje","Fecha","Leido","Categoria","Enlace","DedupKey","Estado","Email"]]);
  let lockBusy=false,lockHeld=false,uuid=0;
  const context=loadContext({SpreadsheetApp:{openById(){return {};}},
    getOrCreateSheet(_ss,name){assert.equal(name,"BandejaNotificaciones");return notificationSheet;},
    LockService:{getScriptLock(){return {waitLock(){if(lockBusy||lockHeld)throw new Error("LOCK_BUSY");lockHeld=true;},releaseLock(){lockHeld=false;}};}},
    Utilities:{getUuid(){return "UUID-"+(++uuid);}},logStructuredEvent(){}});
  const payload={userId:"USR-1",titulo:"Aviso",mensaje:"Estado",deduplicationKey:"WF|T|D|Aprobada|USR-1"};
  const first=context.sendMultiChannelNotification(payload),second=context.sendMultiChannelNotification(payload);
  assert.equal(first.status,"success");assert.equal(second.deduplicated,true);assert.equal(notificationSheet.data.length,2);
  lockBusy=true;const busy=context.sendMultiChannelNotification({...payload,deduplicationKey:"WF|T|D2|Aprobada|USR-1"});
  assert.equal(busy.code,"NOTIFICATION_LOCK_TIMEOUT");assert.equal(notificationSheet.data.length,2);
}
{
  const lockState={held:false};
  const request=["TRAM-1","USR-1","STU-1","Solicitud Administrativa","Descripción","","En Revisión","Secretaría","","2026-11-15","", "2026-12-01"];
  const requests=makeSheet([["SolicitudID","UserId","EstudianteID","TipoTramite","Descripcion","AdjuntoUrl","Estado","AsignadoA","Observaciones","FechaSolicitud","FechaActualizacion","FechaLimite"],request]);
  const decisions=makeSheet([["DecisionID","SolicitudID","Etapa","Revisor","Accion","Internas","Publicas","Fecha","IP","HashPrevio","HashActual"]]);
  let notificationContext=null;
  const context=loadContext({LockService:{getScriptLock(){return {tryLock(){lockState.held=true;return true;},releaseLock(){lockState.held=false;}};}},
    getOrCreateSheet(_ss,name){return name==="SolicitudesTramites"?requests:decisions;},SpreadsheetApp:{openById(){return {};}},
    computeDocumentSHA256(){return "a".repeat(64);},
    dispatchWorkflowStatusNotification_(payload){assert.equal(lockState.held,false);notificationContext=payload;return {status:"success",notificacionId:"NTF-1"};},
    logStructuredEvent(){}});
  const result=context.processWorkflowDecision({solicitudId:"TRAM-1",accionDecision:"DEVUELTO_CORRECCION",_verifiedUserId:"ADMIN-1",
    _verifiedRole:"Secretaría",observacionesInternas:"INTERNAL SECRET",observacionesPublicas:"Corrige el dato"});
  assert.equal(result.status,"success");assert.equal(result.nuevoEstado,"Requiere Corrección");
  assert.equal(notificationContext.destinatarioUserId,"USR-1");assert.equal(notificationContext.observacionesPublicas,"Corrige el dato");
  assert.equal(requests.data[1][6],"Requiere Corrección");assert.equal(lockState.held,false);
}
assert.equal(loadContext().escapeNotificationHtml_("<script>\"&'"),"&lt;script&gt;&quot;&amp;&#39;");
console.log("PASS user-service workflow notifications: transitions, public-only payload, consent, post-commit lock release, atomic dedupe, lock timeout, HTML escaping");
