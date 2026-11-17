"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("backend/task-service/Code.gs","utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extract(name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing function "+name);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(start,next<0?source.length:next);
}
function makeSheet(rows,options){
  options=options||{};
  return {
    rows:rows.map(row=>row.slice()),
    getDataRange(){return {getValues:()=>this.rows.map(row=>row.slice())};},
    getLastRow(){return this.rows.length;},
    appendRow(row){if(options.failAppend)throw new Error("synthetic append failure");this.rows.push(row.slice());},
    deleteRow(row){if(options.failDeleteRow)throw new Error("synthetic delete failure");this.rows.splice(row-1,1);},
    getRange(row,col,numRows,numCols){
      const sheet=this;
      return {setValues(values){
        if(options.failSetValues)throw new Error("synthetic row write failure");
        for(let r=0;r<numRows;r++){
          const target=sheet.rows[row-1+r];
          while(target.length<col-1+numCols)target.push("");
          for(let c=0;c<numCols;c++)target[col-1+c]=values[r][c];
        }
      }};
    }
  };
}
function fixture(options){
  options=options||{};
  const deliveryRows=[
    ["EntregaID","TareaID","EstudianteID","TextoRespuesta","ArchivoId","EnlaceExterno","Estado","Comentario","MimeType"],
    ["DEL-1","TASK-1","STU-1","respuesta","FILE-1","","Enviada","Anterior","application/pdf"]
  ];
  const taskRows=[["TareaID","Titulo"],["TASK-1","Tarea de prueba"]];
  const deliverySheet=makeSheet(deliveryRows,{failDeleteRow:options.failDeleteRow,failSetValues:options.failDeleteWrite});
  const commentsSheet=makeSheet([],{failAppend:options.failCommentAppend});
  const versionsSheet=makeSheet([
    ["VersionID","EntregaID","TareaID","EstudianteID","Version","ArchivoUrl","FileId","MimeType","TextoRespuesta","EnlaceExterno","FechaEnvio","Estado","Observaciones"],
    ["VER-1","DEL-1","TASK-1","STU-1",1,"https://drive.google.com/file/d/FILE-1/view","FILE-1","application/pdf","respuesta","",new Date("2026-11-17T10:00:00Z"),"Enviada",""]
  ]);
  const taskSheet=makeSheet(taskRows);
  const ss={};
  const state={identityCalls:0,accessCalls:0,lockAttempts:0,releases:0,
    actor:options.actor||{authorized:true,userId:"PROF-1",role:"Profesor"},fileTrashed:false};
  const driveFile={
    isTrashed:()=>state.fileTrashed,
    setTrashed(value){
      if(value&&options.failTrash)throw new Error("synthetic Drive failure");
      if(!value&&options.failRestore)throw new Error("synthetic Drive restore failure");
      state.fileTrashed=value;
    }
  };
  const runtime={
    getVerifiedTaskIdentity_:()=>{state.identityCalls++;return state.actor;},
    getTaskServiceSubmissionAccess_:(payload,operation,verifiedIdentity)=>{
      state.accessCalls++;
      assert.equal(operation,options.expectedOperation||"RETURN_FOR_REVISION");
      if(options.denied)throw new Error("RESOURCE_NOT_FOUND");
      const actor=verifiedIdentity||state.actor;
      const currentDeliveries=deliverySheet.rows.slice(1);
      return {ss,identity:actor,role:actor.role,isStaff:options.isStaff!==false,task:["TASK-1","Tarea de prueba"],
        taskId:"TASK-1",delivery:currentDeliveries[0],deliveries:currentDeliveries,studentId:"STU-1"};
    },
    getSheetOrThrow:(_ss,name)=>name==="Entregas"?deliverySheet:name==="Tareas"?taskSheet:null,
    getOrCreateSheet:(_ss,name)=>name==="ComentariosEntregas"?commentsSheet:versionsSheet,
    LockService:{getScriptLock:()=>({tryLock:()=>{state.lockAttempts++;return !options.lockTimeout;},releaseLock:()=>{state.releases++;}})},
    Utilities:{getUuid:()=>"UUID-1"},
    normalizeString:value=>String(value||"").trim().toLowerCase(),
    extractTaskServiceFileId:value=>String(value||"").trim(),
    DriveApp:{getFileById:()=>driveFile,getFolderById:()=>driveFile},
    logDebug:()=>{},
    Date,String,Error,Object,Array,Number,JSON
  };
  const names=["withAuthorizedTaskSubmissionMutation_","returnSubmissionForRevision","deleteSubmission",
    "getSubmissionVersions","addSubmissionComment","getSubmissionComments"];
  const program=names.map(extract).join("\n")+
    "\nthis.api={returnSubmissionForRevision,deleteSubmission,getSubmissionVersions,addSubmissionComment,getSubmissionComments};";
  vm.runInNewContext(program,runtime);
  return {api:runtime.api,state,deliverySheet,commentsSheet,versionsSheet};
}
let passed=0;
function test(fn){fn();passed++;}
test(()=>{
  const x=fixture({expectedOperation:"RETURN_FOR_REVISION"});
  const result=x.api.returnSubmissionForRevision({entregaId:"DEL-1",comentario:"Corregir el procedimiento"});
  assert.equal(result.status,"success");assert.equal(result.comentarioRegistrado,true);
  assert.equal(x.deliverySheet.rows[1][6],"DevueltaCorrección");
  assert.equal(x.deliverySheet.rows[1][7],"Corregir el procedimiento");
  const comment=x.commentsSheet.rows[1];
  assert.equal(comment[1],"DEL-1");assert.equal(comment[2],"TASK-1");
  assert.equal(comment[3],"PROF-1");assert.equal(comment[4],"Profesor");
  assert.equal(comment[5],"Corregir el procedimiento");assert.equal(comment[6],true);
  assert.ok(Number.isFinite(Date.parse(comment[7])));
  assert.equal(x.state.identityCalls,1);assert.equal(x.state.releases,1);
});
test(()=>{
  const x=fixture({expectedOperation:"RETURN_FOR_REVISION",failCommentAppend:true});
  assert.throws(()=>x.api.returnSubmissionForRevision({entregaId:"DEL-1",comentario:"No guardar"}),/synthetic append failure/);
  assert.equal(x.deliverySheet.rows[1][6],"Enviada");
  assert.equal(x.deliverySheet.rows[1][7],"Anterior");
  assert.equal(x.state.releases,1);
});
test(()=>{
  const x=fixture({expectedOperation:"RETURN_FOR_REVISION",lockTimeout:true});
  assert.throws(()=>x.api.returnSubmissionForRevision({entregaId:"DEL-1",comentario:"No guardar"}),/TASK_SUBMISSION_MUTATION_LOCK_TIMEOUT/);
  assert.equal(x.deliverySheet.rows[1][6],"Enviada");assert.equal(x.commentsSheet.rows.length,0);
});
test(()=>{
  const x=fixture({expectedOperation:"RETURN_FOR_REVISION",denied:true});
  assert.throws(()=>x.api.returnSubmissionForRevision({entregaId:"DEL-1",comentario:"No guardar"}),/RESOURCE_NOT_FOUND/);
  assert.equal(x.deliverySheet.rows[1][6],"Enviada");
});
test(()=>{
  const x=fixture({expectedOperation:"DELETE_SUBMISSION"});
  x.commentsSheet.rows=[["ID","EntregaID"],["C1","DEL-1"]];
  const result=x.api.deleteSubmission({entregaId:"DEL-1",motivo:"Solicitud de corrección"});
  assert.equal(result.status,"success");assert.equal(result.alreadyDeleted,false);
  assert.equal(x.deliverySheet.rows.length,2,"logical deletion preserves the delivery row");
  const headers=x.deliverySheet.rows[0].map(v=>String(v).toLowerCase());
  const row=x.deliverySheet.rows[1];
  assert.equal(row[headers.indexOf("estado")],"Eliminada");
  assert.equal(row[headers.indexOf("eliminadapor")],"PROF-1");
  assert.equal(row[headers.indexOf("eliminadarol")],"Profesor");
  assert.ok(Number.isFinite(Date.parse(row[headers.indexOf("eliminadaen")])));
  assert.equal(row[headers.indexOf("motivoeliminacion")],"Solicitud de corrección");
  assert.equal(x.state.fileTrashed,false,"logical deletion preserves the private Drive file");
  assert.equal(x.commentsSheet.rows.length,2,"comments remain linked to the retained delivery");
  assert.equal(x.versionsSheet.rows.length,2,"versions remain linked to the retained delivery");
  const deletedAt=row[headers.indexOf("eliminadaen")];
  const repeated=x.api.deleteSubmission({entregaId:"DEL-1",motivo:"No sobrescribir"});
  assert.equal(repeated.alreadyDeleted,true);
  assert.equal(x.deliverySheet.rows[1][headers.indexOf("eliminadaen")],deletedAt,"repeated delete is idempotent");
  assert.equal(x.state.releases,2);
});
test(()=>{
  const x=fixture({expectedOperation:"DELETE_SUBMISSION",failDeleteWrite:true});
  assert.throws(()=>x.api.deleteSubmission({entregaId:"DEL-1"}),/synthetic row write failure/);
  assert.equal(x.deliverySheet.rows[1][6],"Enviada");
  assert.equal(x.state.fileTrashed,false);
  assert.equal(x.state.releases,1);
});
test(()=>{
  const x=fixture({expectedOperation:"DELETE_SUBMISSION",lockTimeout:true});
  assert.throws(()=>x.api.deleteSubmission({entregaId:"DEL-1"}),/TASK_SUBMISSION_MUTATION_LOCK_TIMEOUT/);
  assert.equal(x.deliverySheet.rows[1][6],"Enviada");assert.equal(x.state.fileTrashed,false);
});
test(()=>{
  const x=fixture({expectedOperation:"READ_HISTORY"});
  const result=x.api.getSubmissionVersions({entregaId:"DEL-1"});
  assert.equal(result.data.length,1);assert.equal(result.data[0].fileId,"FILE-1");
  assert.equal(Object.prototype.hasOwnProperty.call(result.data[0],"archivoUrl"),false,"version history must not expose a raw Drive URL");
});
test(()=>{
  const x=fixture({expectedOperation:"COMMENT",actor:{authorized:true,userId:"STU-1",role:"Estudiante"},isStaff:false});
  const result=x.api.addSubmissionComment({entregaId:"DEL-1",mensaje:"Mi comentario",autorId:"ATTACKER",rolAutor:"Administrador",esPrivado:true});
  assert.equal(result.status,"success");
  const row=x.commentsSheet.rows[1];
  assert.equal(row[3],"STU-1");assert.equal(row[4],"Estudiante");assert.equal(row[5],"Mi comentario");
  assert.equal(row[6],false,"students cannot create private notes");
});
test(()=>{
  const x=fixture({expectedOperation:"READ_HISTORY",actor:{authorized:true,userId:"STU-1",role:"Estudiante"},isStaff:false});
  x.commentsSheet.rows=[
    ["ID","EntregaID","TareaID","AutorID","RolAutor","Mensaje","EsPrivado","FechaCreacion"],
    ["C1","DEL-1","TASK-1","PROF-1","Profesor","Private",true,new Date()],
    ["C2","DEL-1","TASK-1","STU-1","Estudiante","Public",false,new Date()]
  ];
  const result=x.api.getSubmissionComments({entregaId:"DEL-1"});
  assert.deepEqual(result.data.map(row=>row.comentarioId),["C2"]);
});
test(()=>{
  const x=fixture({expectedOperation:"READ_HISTORY"});
  x.commentsSheet.rows=[
    ["ID","EntregaID","TareaID","AutorID","RolAutor","Mensaje","EsPrivado","FechaCreacion"],
    ["C1","DEL-1","TASK-1","PROF-1","Profesor","Private",true,new Date()],
    ["C2","DEL-1","TASK-1","STU-1","Estudiante","Public",false,new Date()]
  ];
  const result=x.api.getSubmissionComments({entregaId:"DEL-1"});
  assert.deepEqual(result.data.map(row=>row.comentarioId),["C1","C2"]);
});
console.log("PASS task-service submission mutation contract: "+passed+" tests");
