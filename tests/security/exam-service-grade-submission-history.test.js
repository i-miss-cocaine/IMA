"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/exam-service/Code.gs"});
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
 const deliveryRows=[["EntregaID","ExamenID","EstudianteID","Fecha","Respuestas","Calificacion","Estado","Comentario","Tema","Asignatura"],
  ["DEL-1","EX-1","STU-1",new Date(),"[]",options.oldGrade===undefined?"70.00":options.oldGrade,"Calificado","Comentario anterior","",""]];
 const deliverySheet=makeSheet(deliveryRows,{failGradeWrite:options.failGradeWrite});
 let historySheet=options.badSchema?makeSheet([["Incorrecto"]]):(options.failAppend?makeSheet([["RectificacionID","TipoEntrega","EntregaID","RecursoID","EstudianteID","NotaAnterior","NotaNueva","Motivo","ActorID","RolActor","Fecha"]],{failAppend:true}):null);
 const ss={getSheetByName(name){return name==="EntregasExamen"?deliverySheet:name==="HistorialRectificacionesEntregasExamen"?historySheet:null;},
  insertSheet(){historySheet=makeSheet([]);return historySheet;}};
 const context={ss,actor:{userId:"PROF-VERIFICADO",role:"Profesor"},examId:"EX-1",entregaId:"DEL-1",
  delivery:{row:deliveryRows[1].slice(),rowIndex:1},deliverySheet,scope:{institutionId:"INST-1",departmentIds:["DEP-1"]}};
 const runtime={withAuthorizedExamSubmissionMutation_(payload,action,callback){assert.equal(action,"gradeExamSubmission");if(options.denied)throw new Error("RESOURCE_NOT_AVAILABLE");return callback(context);},
  Utilities:{getUuid:()=>"uuid-1"},Date,Number,Math,String,Error,isNaN};
 const headerDeclaration=source.match(/var EXAM_GRADE_RECTIFICATION_HEADERS_ = \[[^\]]+\];/);assert.ok(headerDeclaration,"history schema declaration exists");
 const code=[headerDeclaration[0],extract("normalizeExamGradeHistoryValue_"),extract("getOrCreateExamGradeRectificationHistorySheet_"),
  extract("prepareExamGradeRectificationEvent_"),extract("appendExamGradeRectificationEvent_"),extract("gradeExamSubmission")].join("\n");
 vm.runInNewContext(code,runtime);
 return {runtime,context,deliverySheet,history:()=>historySheet,call(payload){return runtime.gradeExamSubmission(payload);}};
}
let count=0;function test(fn){fn();count++;}
const payload={calificacion:85,estado:"Calificado",comentario:"Revisado",temaAsociado:"Álgebra",asignaturaAsociada:"Matemáticas"};
test(()=>{const x=fixture({oldGrade:""});const r=x.call(payload);assert.equal(r.status,"success");assert.equal(r.rectificacionRegistrada,false);assert.equal(x.deliverySheet.rows[1][5],"85.00");assert.equal(x.history(),null);});
test(()=>{const x=fixture();assert.throws(()=>x.call(payload),/GRADE_RECTIFICATION_REASON_REQUIRED/);assert.equal(x.deliverySheet.rows[1][5],"70.00");assert.equal(x.history(),null);});
test(()=>{const x=fixture();const r=x.call({...payload,motivoRectificacion:"Corrección por error de transcripción",_verifiedUserId:"ATACANTE"});assert.equal(r.rectificacionRegistrada,true);assert.equal(x.deliverySheet.rows[1][5],"85.00");const row=x.history().rows[1];assert.equal(row[1],"EXAMEN");assert.equal(row[2],"DEL-1");assert.equal(row[3],"EX-1");assert.equal(row[4],"STU-1");assert.equal(row[5],"70.00");assert.equal(row[6],"85.00");assert.equal(row[7],"Corrección por error de transcripción");assert.equal(row[8],"PROF-VERIFICADO");assert.equal(row[9],"Profesor");assert.ok(row[10] instanceof Date);});
test(()=>{const x=fixture();const r=x.call({...payload,calificacion:"70",motivoRectificacion:""});assert.equal(r.rectificacionRegistrada,false);assert.equal(x.history(),null);});
test(()=>{const x=fixture();assert.throws(()=>x.call({...payload,motivoRectificacion:"x".repeat(1001)}),/GRADE_RECTIFICATION_REASON_INVALID/);assert.equal(x.deliverySheet.rows[1][5],"70.00");});
test(()=>{const x=fixture({badSchema:true});assert.throws(()=>x.call({...payload,motivoRectificacion:"Cambio autorizado"}),/EXAM_GRADE_RECTIFICATION_HISTORY_SCHEMA_INVALID/);assert.equal(x.deliverySheet.rows[1][5],"70.00");});
test(()=>{const x=fixture({failAppend:true});assert.throws(()=>x.call({...payload,motivoRectificacion:"Cambio autorizado"}),/EXAM_GRADE_RECTIFICATION_AUDIT_WRITE_FAILED/);assert.equal(x.deliverySheet.rows[1][5],"70.00");});
test(()=>{const x=fixture({denied:true});assert.throws(()=>x.call({...payload,motivoRectificacion:"Cambio autorizado"}),/RESOURCE_NOT_AVAILABLE/);assert.equal(x.deliverySheet.rows[1][5],"70.00");});
process.stdout.write("exam-service-grade-submission-history: "+count+"/"+count+" PASS\n");
