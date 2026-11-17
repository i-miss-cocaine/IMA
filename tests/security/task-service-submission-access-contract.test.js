"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("backend/task-service/Code.gs","utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extract(name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const open=source.indexOf("{",start);
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=open;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(line){if(c==="\n")line=false;continue;}
    if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
    if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote=null;continue;}
    if(c==="/"&&n==="/"){line=true;i++;continue;}
    if(c==="/"&&n==="*"){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==="\x60"){quote=c;continue;}
    if(c==="{")depth++;
    else if(c==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("unterminated function "+name);
}
function makeSheet(rows){
  return {rows:rows.map(row=>row.slice()),getDataRange(){return {getValues:()=>this.rows.map(row=>row.slice())};},
    getLastRow(){return this.rows.length;},appendRow(row){this.rows.push(row.slice());}};
}
const actors={
  S1:{authorized:true,userId:"STU-1",role:"Estudiante"},
  S2:{authorized:true,userId:"STU-2",role:"Estudiante"},
  T1:{authorized:true,userId:"TEACHER-1",role:"Profesor"},
  T2:{authorized:true,userId:"TEACHER-2",role:"Profesor"},
  G1:{authorized:true,userId:"GUARDIAN-1",role:"Responsable"},
  G2:{authorized:true,userId:"GUARDIAN-2",role:"Responsable"},
  G3:{authorized:true,userId:"GUARDIAN-3",role:"Tutor"},
  A1:{authorized:true,userId:"ADMIN-1",role:"Administrador"}
};
const tasks=[
  ["TareaID","Tipo","Titulo","Descripcion","Parcial","Asignatura","Grado","Seccion","FechaLimite","Original","ProfesorID","Estado"],
  ["TASK-1","Tarea","Tarea uno","","1","Matemáticas","6","A","","","TEACHER-1","Activa"],
  ["TASK-2","Tarea","Tarea dos","","1","Ciencias","6","B","","","TEACHER-2","Activa"]
];
const deliveries=[
  ["EntregaID","TareaID","EstudianteID","FechaEnvio","ArchivoId","EnlaceExterno","Estado","Comentario","MimeType"],
  ["DEL-1","TASK-1","STU-1",new Date("2026-11-17T09:00:00Z"),"FILE-1","","Enviada","","application/pdf"],
  ["DEL-2","TASK-2","STU-2",new Date("2026-11-17T09:05:00Z"),"FILE-2","","Enviada","","application/pdf"],
  ["DEL-3","TASK-1","STU-1",new Date("2026-11-17T09:10:00Z"),"FILE-3","","Eliminada","","application/pdf"]
];
const comments=[
  ["ID","EntregaID","TareaID","AutorID","RolAutor","Mensaje","EsPrivado","FechaCreacion"],
  ["C1","DEL-1","TASK-1","TEACHER-1","Profesor","Nota privada 1",true,new Date()],
  ["C2","DEL-1","TASK-1","STU-1","Estudiante","Comentario público 1",false,new Date()],
  ["C3","DEL-2","TASK-2","TEACHER-2","Profesor","Nota privada 2",true,new Date()],
  ["C4","DEL-2","TASK-2","STU-2","Estudiante","Comentario público 2",false,new Date()],
  ["C5","DEL-3","TASK-1","TEACHER-1","Profesor","Nota privada eliminada",true,new Date()],
  ["C6","DEL-3","TASK-1","STU-1","Estudiante","Comentario público eliminado",false,new Date()]
];
const versions=[
  ["VersionID","EntregaID","TareaID","EstudianteID","Version","ArchivoUrl","FileId","MimeType","TextoRespuesta","EnlaceExterno","FechaEnvio","Estado","Observaciones"],
  ["V1","DEL-1","TASK-1","STU-1",1,"https://drive.google.com/file/d/FILE-1/view","FILE-1","application/pdf","v1","",new Date(),"Enviada",""],
  ["V0","DEL-1","TASK-1","STU-1",0,"https://drive.google.com/file/d/FILE-OLD/view","FILE-OLD","application/pdf","old version","",new Date("2026-11-16T09:00:00Z"),"Enviada",""],
  ["V2","DEL-2","TASK-2","STU-2",1,"https://drive.google.com/file/d/FILE-2/view","FILE-2","application/pdf","v2","",new Date(),"Enviada",""],
  ["V3","DEL-3","TASK-1","STU-1",1,"https://drive.google.com/file/d/FILE-3/view","FILE-3","application/pdf","v3","",new Date(),"Enviada",""]
];
const sheets={Entregas:makeSheet(deliveries),Tareas:makeSheet(tasks),ComentariosEntregas:makeSheet(comments),EntregasVersiones:makeSheet(versions)};
const ss={getSheetByName:name=>sheets[name]||null};
const studentTaskAccess={"STU-1":["TASK-1"],"STU-2":["TASK-2"]};
const guardianLinks={"GUARDIAN-1":["STU-1"],"GUARDIAN-2":["STU-2"],"GUARDIAN-3":[]};
const fileStore={
  "FILE-1":{getMimeType:()=>"application/pdf",getName:()=>"one.pdf",getSize:()=>1024},
  "FILE-2":{getMimeType:()=>"application/pdf",getName:()=>"two.pdf",getSize:()=>1024},
  "FILE-3":{getMimeType:()=>"application/pdf",getName:()=>"three.pdf",getSize:()=>1024},
  "FILE-OLD":{getMimeType:()=>"application/pdf",getName:()=>"old-version.pdf",getSize:()=>512}
};
const runtime={
  SPREADSHEET_ID:"TEST-SHEET",
  SpreadsheetApp:{openById:()=>ss},
  getSheetOrThrow:(_ss,name)=>{if(!sheets[name])throw new Error("missing sheet "+name);return sheets[name];},
  getVerifiedTaskIdentity_:payload=>actors[payload&&payload.sessionToken]||{authorized:false,code:"INVALID_SESSION"},
  isTaskServiceAdministrativeRole:role=>["Administrador","Desarrollador","Dirección","Secretaría"].includes(role),
  assertTaskServiceTeacherCanManageTask:(payload,task)=>{
    const actor=actors[payload&&payload.sessionToken]||(payload&&payload._imaVerifiedTaskIdentity&&payload._imaVerifiedTaskIdentity.actor);
    if(!actor||!actor.authorized)throw new Error("RESOURCE_NOT_FOUND");
    if(runtime.isTaskServiceAdministrativeRole(actor.role))return true;
    if(actor.role==="Profesor"&&String(task[10]||"").trim()===actor.userId)return true;
    throw new Error("RESOURCE_NOT_FOUND");
  },
  getTaskServiceGuardianStudentIds:guardianId=>guardianLinks[guardianId]||[],
  assertTaskServiceStudentCanAccessTask:(_ss,studentId,task)=>{
    if(!(studentTaskAccess[studentId]||[]).includes(String(task[0])))throw new Error("RESOURCE_NOT_FOUND");
    return true;
  },
  getOrCreateSheet:(_ss,name)=>sheets[name],
  normalizeString:value=>String(value||"").trim().toLowerCase(),
  extractTaskServiceFileId:value=>String(value||"").trim(),
  DriveApp:{getFileById:id=>fileStore[id]},
  denialLogs:[],
  Logger:{log:message=>denialLogs.push(String(message))},
  Utilities:{getUuid:()=>"NEW-COMMENT"},
  Date,String,Error,Object,Array,Number,JSON,Math
};
const names=["getTaskServiceSubmissionAccess_","getSubmissionComments","getSubmissionVersions","addSubmissionComment","getSubmissionDocumentPreviewUrl"];
const program=names.map(extract).join("\n")+"\nthis.api={getTaskServiceSubmissionAccess_,getSubmissionComments,getSubmissionVersions,addSubmissionComment,getSubmissionDocumentPreviewUrl};";
vm.runInNewContext(program,runtime);
let passed=0;function test(fn){fn();passed++;}
function call(fn,token,deliveryId,extra){return runtime.api[fn](Object.assign({sessionToken:token,entregaId:deliveryId},extra||{}));}
test(()=>{const x=call("getSubmissionComments","S1","DEL-1");assert.deepEqual(x.data.map(row=>row.comentarioId),["C2"]);});
test(()=>{const x=call("getSubmissionComments","G1","DEL-1");assert.deepEqual(x.data.map(row=>row.comentarioId),["C2"]);});
test(()=>{const x=call("getSubmissionComments","T1","DEL-1");assert.deepEqual(x.data.map(row=>row.comentarioId),["C1","C2"]);});
test(()=>{assert.throws(()=>call("getSubmissionComments","T2","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{assert.throws(()=>call("getSubmissionComments","S2","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{assert.throws(()=>call("getSubmissionComments","G2","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{assert.throws(()=>call("getSubmissionComments","G3","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{const x=call("getSubmissionVersions","S1","DEL-1");assert.deepEqual(x.data.map(row=>row.versionId),["V1","V0"]);assert.equal(Object.prototype.hasOwnProperty.call(x.data[0],"archivoUrl"),false);});
test(()=>{assert.throws(()=>call("getSubmissionVersions","S2","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{assert.throws(()=>call("getSubmissionVersions","T2","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{const x=call("getSubmissionVersions","G1","DEL-1");assert.deepEqual(x.data.map(row=>row.versionId),["V1","V0"]);});
test(()=>{assert.throws(()=>call("getSubmissionVersions","G2","DEL-1"),/RESOURCE_NOT_FOUND/);});
test(()=>{const x=call("getSubmissionVersions","T1","DEL-1");assert.deepEqual(x.data.map(row=>row.versionId),["V1","V0"]);});
test(()=>{assert.throws(()=>call("getSubmissionComments","S1","DEL-3"),/RESOURCE_NOT_FOUND/);});
test(()=>{assert.throws(()=>call("getSubmissionComments","G1","DEL-3"),/RESOURCE_NOT_FOUND/);});
test(()=>{const x=call("getSubmissionComments","T1","DEL-3");assert.deepEqual(x.data.map(row=>row.comentarioId),["C5","C6"]);});
test(()=>{assert.throws(()=>call("getSubmissionComments","T2","DEL-3"),/RESOURCE_NOT_FOUND/);});
test(()=>{const x=call("addSubmissionComment","S1","DEL-1",{mensaje:"Nueva nota",autorId:"FORGED",rolAutor:"Administrador",esPrivado:true});assert.equal(x.status,"success");const row=sheets.ComentariosEntregas.rows.at(-1);assert.equal(row[3],"STU-1");assert.equal(row[4],"Estudiante");assert.equal(row[6],false);});
test(()=>{const x=call("addSubmissionComment","T1","DEL-1",{mensaje:"Nota docente",autorId:"FORGED",rolAutor:"Estudiante",esPrivado:true});assert.equal(x.status,"success");const row=sheets.ComentariosEntregas.rows.at(-1);assert.equal(row[3],"TEACHER-1");assert.equal(row[4],"Profesor");assert.equal(row[6],true);});
test(()=>{assert.throws(()=>call("addSubmissionComment","T2","DEL-1",{mensaje:"No permitido"}),/RESOURCE_NOT_FOUND/);});
test(()=>{const x=call("getSubmissionDocumentPreviewUrl","S1","", {fileId:"FILE-1"});assert.equal(x.status,"success");});
test(()=>{const x=call("getSubmissionDocumentPreviewUrl","S1","", {fileId:"FILE-OLD"});assert.equal(x.status,"success","a prior version file remains previewable through its authorized delivery");});
test(()=>{const x=call("getSubmissionDocumentPreviewUrl","T1","", {fileId:"FILE-1"});assert.equal(x.status,"success");});
test(()=>{const x=call("getSubmissionDocumentPreviewUrl","G1","", {fileId:"FILE-1"});assert.equal(x.status,"success");});
test(()=>{const x=call("getSubmissionDocumentPreviewUrl","G1","", {fileId:"FILE-OLD"});assert.equal(x.status,"success","a linked guardian may preview the student's prior version");});
test(()=>{assert.equal(call("getSubmissionDocumentPreviewUrl","T2","",{fileId:"FILE-1"}).status,"error");});
test(()=>{assert.equal(call("getSubmissionDocumentPreviewUrl","S2","",{fileId:"FILE-1"}).status,"error");});
test(()=>{assert.equal(call("getSubmissionDocumentPreviewUrl","S1","",{fileId:"FILE-3"}).status,"error");});
test(()=>{sheets.EntregasVersiones.rows.push(["V-AMBIG","DEL-2","TASK-2","STU-2",2,"","FILE-OLD","application/pdf","","",new Date(),"Enviada",""]);assert.equal(call("getSubmissionDocumentPreviewUrl","S1","",{fileId:"FILE-OLD"}).status,"error","a file referenced by multiple deliveries must fail closed");sheets.EntregasVersiones.rows.pop();});
test(()=>{assert.equal(call("getSubmissionDocumentPreviewUrl","T1","",{fileId:"FILE-3"}).status,"success");});
assert(denialLogs.some(message=>message.includes("SUBMISSION_ACCESS_DENIED")&&message.includes("operation=READ_HISTORY")),"denied resource access attempts are recorded");
assert(!denialLogs.some(message=>message.includes("Nota privada")),"denial logs never contain private comment content");
console.log("PASS task-service submission access contract: "+passed+" tests");
