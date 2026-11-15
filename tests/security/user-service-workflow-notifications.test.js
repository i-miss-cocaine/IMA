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
    appendRow(row){data.push(row.slice());},getRange(row,col,numRows=1,numCols=1){return {
      getValues(){return Array.from({length:numRows},(_,r)=>Array.from({length:numCols},(_,c)=>(data[row-1+r]||[])[col-1+c]===undefined?"":data[row-1+r][col-1+c]));},
      setValue(value){while(data.length<row)data.push([]);while(data[row-1].length<col)data[row-1].push("");data[row-1][col-1]=value;}
    };}};
}
function extractFunction(name) {
  const start=source.indexOf("function "+name+"(");
  assert.notEqual(start,-1,"missing function "+name);
  const open=source.indexOf("{",start);
  let depth=0,quote="",escaped=false,lineComment=false,blockComment=false;
  for(let i=open;i<source.length;i++){
    const c=source[i],next=source[i+1];
    if(lineComment){if(c==="\n")lineComment=false;continue;}
    if(blockComment){if(c==="*"&&next==="/"){blockComment=false;i++;}continue;}
    if(quote){if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote="";continue;}
    if(c==="/"&&next==="/"){lineComment=true;i++;continue;}
    if(c==="/"&&next==="*"){blockComment=true;i++;continue;}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){quote=c;continue;}
    if(c==="{")depth++;
    else if(c==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("unclosed function "+name);
}
function loadContext(extra={}) {
  const context={console,Date,Math,JSON,String,Number,Array,Object,Error,RegExp};
  const notificationStart=source.indexOf("function escapeNotificationHtml_");
  const notificationEnd=source.indexOf("// [TAREA-F6-024]",notificationStart);
  assert.ok(notificationStart>=0&&notificationEnd>notificationStart,"notification function block must be present");
  const notificationFunctions=source.slice(notificationStart,notificationEnd);
  const retryStart=source.indexOf("function retryFailedNotificationsQueue(payload) {");
  const retryEnd=source.indexOf("// [F10-Task12]",retryStart);
  assert.ok(retryStart>=0&&retryEnd>retryStart,"notification retry function must be present");
  const retryFunction=source.slice(retryStart,retryEnd);
  const isolatedSource=[
    'const SPREADSHEET_ID="TEST";',
    'const FRONTEND_URL="https://portal.example.test/";',
    retryFunction,
    notificationFunctions,
    extractFunction("processWorkflowDecision")
  ].join("\n");
  vm.runInNewContext(isolatedSource,context,{timeout:10000});
  Object.keys(extra).forEach(key=>{context[key]=extra[key];});
  return context;
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
  const notificationSheet=makeSheet([["NotificacionID","UserId","Tipo","Titulo","Mensaje","Fecha","Leido","Categoria","Enlace","DedupKey","Estado","Email"]]);
  let lockHeld=false;
  const context=loadContext({SpreadsheetApp:{openById(){return {};}},
    getOrCreateSheet(){return notificationSheet;},
    LockService:{getScriptLock(){return {waitLock(){if(lockHeld)throw Error("busy");lockHeld=true;},releaseLock(){lockHeld=false;}};}},
    Utilities:{getUuid(){return "EMAIL-UUID";}},MailApp:{sendEmail(){throw new Error("Service invoked too many times: email quota exceeded");}},
    logStructuredEvent(){}});
  const pending=context.sendMultiChannelNotification({userId:"USR-1",emailRecipient:"user@example.test",titulo:"Aviso",mensaje:"Estado",deduplicationKey:"WF|QUOTA"});
  assert.equal(pending.status,"success");
  assert.equal(pending.estadoEntrega,"Pendiente_Reintento","quota failures must remain visible and retryable");
  assert.equal(notificationSheet.data[1][10],"Pendiente_Reintento");
  assert.equal(notificationSheet.data[1][11],"user@example.test");
}
{
  const notificationSheet=makeSheet([["NotificacionID","UserId","Tipo","Titulo","Mensaje","Fecha","Leido","Categoria","Enlace","DedupKey","Estado","Email"]]);
  let lockHeld=false;
  const context=loadContext({SpreadsheetApp:{openById(){return {};}},
    getOrCreateSheet(){return notificationSheet;},
    LockService:{getScriptLock(){return {waitLock(){if(lockHeld)throw Error("busy");lockHeld=true;},releaseLock(){lockHeld=false;}};}},
    Utilities:{getUuid(){return "LEGACY-EMAIL";}},MailApp:{sendEmail(payload){assert.equal(payload.to,"legacy@example.test");}},
    logStructuredEvent(){}});
  const result=context.sendMultiChannelNotification({userId:"legacy@example.test",titulo:"Aviso",mensaje:"Estado"});
  assert.equal(result.emailSent,true,"legacy email-as-userId callers must remain compatible");
  assert.equal(notificationSheet.data[1][10],"Entregado");
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
{
  const notificationSheet=makeSheet([["NotificacionID","UserId","Tipo","Titulo","Mensaje","Fecha","Leido","Categoria","Enlace","DedupKey","Estado","Email"]]);
  let lockBusy=false,lockHeld=false,uuid=0,capturedHtml="",mailCalls=0;
  const context=loadContext({
    SpreadsheetApp:{openById(){return {};}},
    getOrCreateSheet(){return notificationSheet;},
    LockService:{getScriptLock(){return {waitLock(){if(lockBusy||lockHeld)throw Error("LOCK_BUSY");lockHeld=true;},releaseLock(){lockHeld=false;}};}},
    Utilities:{getUuid(){return "RETRY-"+(++uuid);}},
    MailApp:{sendEmail(payload){mailCalls++;if(mailCalls===1)throw Error("MAIL_QUOTA_EXCEEDED");capturedHtml=payload.htmlBody;}},
    logStructuredEvent(){}
  });
  const pending=context.sendMultiChannelNotification({userId:"USR-1",emailRecipient:"user@example.test",titulo:"<script>alert(1)</script>",mensaje:"<img src=x onerror=alert(1)>",deduplicationKey:"WF|RETRY"});
  assert.equal(pending.estadoEntrega,"Pendiente_Reintento");
  lockBusy=true;
  const skipped=context.retryFailedNotificationsQueue({authRole:"Sistema"});
  assert.equal(skipped.skippedLocked,1);
  assert.equal(notificationSheet.data[1][10],"Pendiente_Reintento");
  lockBusy=false;
  const retried=context.retryFailedNotificationsQueue({authRole:"Sistema"});
  assert.equal(retried.resolvedCount,1);
  assert.equal(notificationSheet.data[1][10],"Entregado");
  assert.match(capturedHtml,/&lt;script&gt;/);
  assert.match(capturedHtml,/&lt;img/);
  assert.doesNotMatch(capturedHtml,/<script>|<img/);
}
assert.equal(loadContext().escapeNotificationHtml_("<script>\"&'"),"&lt;script&gt;&quot;&amp;&#39;");
console.log("PASS user-service workflow notifications: transitions, public-only payload, consent, post-commit lock release, atomic dedupe, lock timeout, HTML escaping");
