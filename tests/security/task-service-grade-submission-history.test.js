"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/task-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
const teacherSource=fs.readFileSync(path.join(__dirname,"../../js/teacher.js"),"utf8");
const teacherHtml=fs.readFileSync(path.join(__dirname,"../../teacher-dashboard.html"),"utf8");
new vm.Script(teacherSource,{filename:"js/teacher.js"});
function extract(name){
 const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1);
 const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}
 throw new Error("unbalanced "+name);
}
function makeSheet(rows,options={}){
 return {rows:rows.map(row=>row.slice()),getLastRow(){return this.rows.length;},
  getDataRange(){return {getValues:()=>this.rows.map(row=>row.slice())};},
  appendRow(row){if(options.failAppend)throw new Error("synthetic append failure");this.rows.push(row.slice());},
  getRange(row,col,numRows,numCols){const self=this;return {setValues(values){if(options.failGradeWrite)throw new Error("synthetic grade write failure");for(let i=0;i<values.length;i++)self.rows[row-1+i]=values[i].slice();}};}
 };
}
function fixture(options={}){
 const deliveryRows=[["EntregaID","TareaID","EstudianteID","Fecha","Archivo","calificacion","estado","comentario"],
  ["DEL-1","TASK-1","STU-1",new Date(),"file",options.oldGrade===undefined?"70":options.oldGrade,"revisada","Anterior"]];
 const deliverySheet=makeSheet(deliveryRows,{failGradeWrite:options.failGradeWrite});
 const taskSheet=makeSheet([["ID","Nombre"],["TASK-1","Tarea"]]);
 let historySheet=options.badSchema?makeSheet([["Incorrecto"]]):(options.failAppend?makeSheet([["RectificacionID","TipoEntrega","EntregaID","RecursoID","EstudianteID","NotaAnterior","NotaNueva","Motivo","ActorID","RolActor","Fecha"]],{failAppend:true}):null);
 const ss={getSheetByName(name){return name==="Entregas"?deliverySheet:name==="Tareas"?taskSheet:name==="HistorialRectificacionesEntregas"?historySheet:null;},
  insertSheet(){historySheet=makeSheet([]);return historySheet;}};
 const actor={authorized:true,userId:"PROF-VERIFICADO",role:"Profesor"};
 const state={permissionCalls:0,identityCalls:0,accessCalls:0,lockAttempts:0,releases:0,held:false};
 const rubricSheet=makeSheet([]);
 const runtime={
  validateRolePermission(){state.permissionCalls++;return {authorized:options.permissionDenied!==true};},
  getVerifiedTaskIdentity_(){state.identityCalls++;return actor;},
  LockService:{getScriptLock(){return {tryLock(){state.lockAttempts++;if(options.lockTimeout||state.held)return false;state.held=true;return true;},releaseLock(){state.releases++;state.held=false;}};}},
  getTaskServiceSubmissionAccess_(payload,operation){state.accessCalls++;assert.equal(operation,"GRADE");if(options.denied)throw new Error("RESOURCE_NOT_FOUND");const verified=runtime.getVerifiedTaskIdentity_(payload);return {ss,identity:verified,role:"Profesor",isStaff:options.isStaff!==false,task:["TASK-1","Tarea"],taskId:"TASK-1",delivery:deliveryRows[1],deliveries:options.duplicateDelivery?[deliveryRows[1],deliveryRows[1]]:[deliveryRows[1]],studentId:"STU-1"};},
  getSheetOrThrow(sheet,name){const value=sheet.getSheetByName(name);if(!value)throw new Error("missing "+name);return value;},
  Utilities:{getUuid:()=>"uuid-1"},normalizeString:value=>String(value||"").trim().toLowerCase(),
  getOrCreateSheet(){return rubricSheet;},Date,Number,Math,String,Error,JSON
 };
 const headerDeclaration=source.match(/var TASK_GRADE_RECTIFICATION_HEADERS_ = \[[^\]]+\];/);assert.ok(headerDeclaration,"history schema declaration exists");
 const code=[headerDeclaration[0],...["normalizeTaskGradeHistoryValue_","getOrCreateTaskGradeRectificationHistorySheet_","prepareTaskGradeRectificationEvent_","appendTaskGradeRectificationEvent_","withAuthorizedTaskSubmissionMutation_","gradeSubmission","gradeSubmissionWithRubric"].map(extract)].join("\n");
 vm.runInNewContext(code,runtime);
 return {runtime,state,deliverySheet,history:()=>historySheet,rubricSheet,call(payload){return runtime.gradeSubmission(payload);},callRubric(payload){return runtime.gradeSubmissionWithRubric(payload);}};
}
let count=0;function test(fn){fn();count++;}
const base={entregaId:"DEL-1",calificacion:"85",estado:"revisada",comentario:"Actualizada"};
test(()=>{const x=fixture({oldGrade:""});const r=x.call(base);assert.equal(r.status,"success");assert.equal(r.rectificacionRegistrada,false);assert.equal(x.deliverySheet.rows[1][5],"85");assert.equal(x.history(),null);assert.equal(x.state.releases,1);});
test(()=>{const x=fixture();assert.throws(()=>x.call(base),/GRADE_RECTIFICATION_REASON_REQUIRED/);assert.equal(x.deliverySheet.rows[1][5],"70");assert.equal(x.history(),null);assert.equal(x.state.releases,1);});
test(()=>{const x=fixture();const r=x.call({...base,motivoRectificacion:"Corrección de captura"});assert.equal(r.rectificacionRegistrada,true);assert.equal(x.deliverySheet.rows[1][5],"85");const row=x.history().rows[1];assert.equal(row[1],"TAREA");assert.equal(row[2],"DEL-1");assert.equal(row[3],"TASK-1");assert.equal(row[4],"STU-1");assert.equal(row[5],"70");assert.equal(row[6],"85");assert.equal(row[7],"Corrección de captura");assert.equal(row[8],"PROF-VERIFICADO");assert.equal(row[9],"Profesor");assert.ok(row[10] instanceof Date);});
test(()=>{const x=fixture({failAppend:true});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/TASK_GRADE_RECTIFICATION_AUDIT_WRITE_FAILED/);assert.equal(x.deliverySheet.rows[1][5],"70");});
test(()=>{const x=fixture({badSchema:true});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/TASK_GRADE_RECTIFICATION_HISTORY_SCHEMA_INVALID/);assert.equal(x.deliverySheet.rows[1][5],"70");});
test(()=>{const x=fixture({denied:true});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/RESOURCE_NOT_FOUND/);assert.equal(x.deliverySheet.rows[1][5],"70");assert.equal(x.state.releases,1);});
test(()=>{const x=fixture({isStaff:false});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/RESOURCE_NOT_FOUND/);assert.equal(x.deliverySheet.rows[1][5],"70");});
test(()=>{const x=fixture({duplicateDelivery:true});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/RESOURCE_NOT_FOUND/);assert.equal(x.deliverySheet.rows[1][5],"70");});
test(()=>{const x=fixture({lockTimeout:true});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/TASK_SUBMISSION_GRADE_LOCK_TIMEOUT/);assert.equal(x.deliverySheet.rows[1][5],"70");assert.equal(x.state.releases,0);});
test(()=>{const x=fixture();const r=x.callRubric({...base,motivoRectificacion:"Corrección con rúbrica",rubricaEvaluacionJSON:{criterio:1}});assert.equal(r.rectificacionRegistrada,true);assert.equal(x.history().rows[1][7],"Corrección con rúbrica");assert.equal(x.rubricSheet.rows.length,2);});
test(()=>{const x=fixture();x.call({...base,motivoRectificacion:"Cambio",_verifiedUserId:"ATACANTE"});assert.equal(x.history().rows[1][8],"PROF-VERIFICADO");});
test(()=>{const x=fixture({permissionDenied:true});assert.throws(()=>x.call({...base,motivoRectificacion:"Cambio"}),/RESOURCE_NOT_FOUND/);assert.equal(x.deliverySheet.rows[1][5],"70");});
test(()=>{assert.ok(teacherHtml.includes('id="motivo-rectificacion"'));assert.ok(teacherSource.includes("motivoRectificacion: document.getElementById('motivo-rectificacion')?.value || ''"));assert.ok(teacherSource.includes("res.rectificacionRegistrada"));});
process.stdout.write("task-service-grade-submission-history: "+count+"/"+count+" PASS\n");
