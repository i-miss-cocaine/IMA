"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("backend/task-service/Code.gs","utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extract(name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(start,next<0?source.length:next);
}
function makeSheet(rows){
  return {rows:rows.map(row=>row.slice()),getDataRange(){return {getValues:()=>this.rows.map(row=>row.slice())};},
    getLastRow(){return this.rows.length;},appendRow(row){this.rows.push(row.slice());},
    getRange(row,col,numRows,numCols){return {setValues:values=>{for(let r=0;r<numRows;r++)for(let c=0;c<numCols;c++)this.rows[row-1+r][col-1+c]=values[r][c];}};}};
}
const deliveryHeaders=["EntregaID","TareaID","EstudianteID","FechaEnvio","ArchivoId","Calificacion","Estado","Comentario","MimeType","EliminadaPor","EliminadaRol","EliminadaEn","MotivoEliminacion"];
const deliveryRow=["DEL-1","TASK-1","STU-1",new Date("2026-11-16T10:00:00Z"),"FILE-OLD","","Eliminada","Nota antigua","application/pdf","TEACHER-1","Profesor",new Date("2026-11-16T11:00:00Z"),"Retirada"];
const deliverySheet=makeSheet([deliveryHeaders,deliveryRow]);
const taskSheet=makeSheet([["TareaID","Tipo","Titulo","Descripcion","Parcial","Asignatura","Grado","Seccion","FechaLimite","Original","ProfesorID","Estado"],["TASK-1","Tarea","Tarea 1","","1","Matemáticas","6","A","","","TEACHER-1","Activa"]]);
const metadataRow=Array(21).fill("");
metadataRow[11]="TASK-1";metadataRow[14]="activo";metadataRow[15]="FILE-NEW";metadataRow[19]="STU-1";
const metadataSheet=makeSheet([Array(21).fill("H"),metadataRow]);
const versionSheet=makeSheet([
  ["ID","EntregaID","TareaID","UserID","VersionNum","ArchivoUrl","FileID","MimeType","TextoRespuesta","EnlaceExterno","FechaEnvio","Estado","Observaciones"],
  ["VER-OLD","DEL-1","TASK-1","STU-1",1,"","FILE-OLD","application/pdf","old","","2026-11-16T10:00:00Z","Enviada",""]
]);
const ss={};
let uuid=0,lockReleased=0,lockAvailable=true;
const runtime={
  SPREADSHEET_ID:"TEST-SHEET",
  getDriveStorageQuotaMetricsReport:()=>({status:"success",metrics:{porcentajeUso:50}}),
  SpreadsheetApp:{openById:()=>ss},
  getSheetOrThrow:(_ss,name)=>name==="Tareas"?taskSheet:name==="Entregas"?deliverySheet:null,
  assertTaskServiceStudentCanAccessTask:()=>true,
  extractTaskServiceFileId:value=>String(value||"").trim(),
  ensureTaskServiceFileMetadataSheet:()=>metadataSheet,
  getOrCreateSheet:(_ss,name)=>name==="EntregasVersiones"?versionSheet:null,
  LockService:{getScriptLock:()=>({tryLock:()=>lockAvailable,releaseLock:()=>{lockReleased++;}})},
  Utilities:{getUuid:()=>"NEW-"+(++uuid)},
  normalizeString:value=>String(value||"").trim().toLowerCase(),
  Logger:{log:()=>{}},
  Date,String,Error,Object,Array,Number,JSON,Math
};
vm.runInNewContext(extract("submitAssignment")+"\nthis.submit=submitAssignment;",runtime);
const result=runtime.submit({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",userId:"STU-1",tareaId:"TASK-1",
  fileId:"FILE-NEW",mimeType:"application/pdf",textoRespuesta:"new response",enlaceExterno:"https://example.test/new"});
assert.equal(result.status,"success");
assert.equal(result.data.entregaId,"DEL-1");
assert.equal(result.data.versionNum,2);
const row=deliverySheet.rows[1];
assert.equal(row[4],"FILE-NEW");
assert.equal(row[5],"","resubmitting a deleted delivery must clear the prior grade, not store an external URL in the grade column");
assert.equal(row[6],"Pendiente de revisión");
assert.equal(row[7],"");
assert.equal(row[9],"");assert.equal(row[10],"");assert.equal(row[11],"");assert.equal(row[12],"");
assert.equal(versionSheet.rows.length,3);
assert.equal(versionSheet.rows[2][1],"DEL-1");
assert.equal(versionSheet.rows[2][4],2);
assert.equal(versionSheet.rows[2][6],"FILE-NEW");
assert.equal(versionSheet.rows[2][9],"https://example.test/new","external link belongs in version history, not the delivery grade column");
assert.equal(lockReleased,1);
const beforeTimeoutRow=deliverySheet.rows[1].slice(),beforeTimeoutVersions=versionSheet.rows.length;
lockAvailable=false;
assert.throws(()=>runtime.submit({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",userId:"STU-1",tareaId:"TASK-1",
  fileId:"FILE-NEW",mimeType:"application/pdf",textoRespuesta:"retry",enlaceExterno:"https://example.test/retry"}),/TASK_SUBMISSION_LOCK_TIMEOUT/);
assert.deepEqual(deliverySheet.rows[1],beforeTimeoutRow,"lock timeout leaves the active delivery unchanged");
assert.equal(versionSheet.rows.length,beforeTimeoutVersions,"lock timeout creates no extra version");
assert.equal(lockReleased,1,"a lock not acquired is not released");
const getStudentTasksFn=extract("getStudentTasks");
assert(getStudentTasksFn.includes('const canSeeDeletedSubmissions = role === "Profesor" || isTaskServiceAdministrativeRole(role);'));
assert(getStudentTasksFn.includes('normalizeString(row[6]) !== "eliminada"'));
console.log("PASS task-service submission resubmit contract: 1 runtime + 2 visibility assertions");
