"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/exam-service/Code.gs"});
function extract(name){
 const re=new RegExp("function "+name+"\\s*\\("),m=re.exec(source);assert.ok(m,"missing "+name);
 const start=source.indexOf("{",m.index);let depth=0,quote="",escaped=false,line=false,block=false;
 for(let i=start;i<source.length;i++){const c=source[i],n=source[i+1];
  if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}
  if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}
  if(c==="'"||c==='"'||c==="\`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(m.index,i+1);
 }throw Error("unbalanced "+name);
}
function sheet(rows){return {rows,getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())};}};}
function fixture(o={}){
 const sheets={
 Usuarios:sheet([["UserID","Nombre","Grado","Seccion","Email","","Rol"],["STU-1","Ana","10","A","","","Estudiante"],["STU-2","Luis","10","B","","","Estudiante"]]),
 Matriculas:sheet([["MatriculaID","Fecha","UserID","X","Grado","Seccion","Periodo","X","Estado"],["MAT-1",new Date("2026-01-01"),"STU-1","","10","A","P1","","Activa"],["MAT-2",new Date("2026-01-02"),"STU-2","","10","B","P1","","Activa"],["MAT-1",new Date(),"STU-1","","10","A","P2","","Activa"],["MAT-3",new Date(),"STU-1","","10","A","P3","","Activa"]]),
 CalificacionesEstudiantes:sheet([["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro"],
 ["CAL-1","E-1","STU-1",85,8.5,false,true,"Visible",new Date("2026-02-01")],
 ["CAL-2","E-2","STU-1",90,9,true,false,"Borrador oculto",null],
 ["CAL-3","E-3","STU-2",70,7,false,true,"Otro",null],
 ["CAL-DUP","E-4","STU-1",1,1,false,true,"Dup",null],["CAL-DUP","E-5","STU-1",2,2,false,true,"Dup",null]]),
 RecuperacionesEstudiante:sheet([["ID","EvaluacionID","UserID","NotaOriginal","NotaRecuperada","NotaFinalCalculada","MetodoAplicado","AutorizadoPor","Fecha"],
 ["REC-1","E-1","STU-1",50,80,80,"MAX","ADMIN",new Date("2026-03-01")],
 ["REC-2","E-2","STU-2",40,60,60,"MAX","ADMIN",null],
 ["REC-DUP","E-3","STU-1",10,20,20,"MAX","ADMIN",null],["REC-DUP","E-4","STU-1",15,25,25,"MAX","ADMIN",null]]),
 CategoriasEvaluacion:sheet([["ID","Nombre","Ambito","PorcentajePonderacion","EscalaID","Estado"],["CAT-1","Tareas","Global",35,"100","Activo"]])
 };
 if(o.missing)for(const n of o.missing)delete sheets[n];
 const ss={getSheetByName:n=>sheets[n]||null};
 const actor=o.actor||{userId:"STU-1",role:"Estudiante"};
 const context={actor,ss,scope:{authorized:o.authorized!==false,institutionWide:o.institutionWide!==false},guardianActor:o.guardian===true,profile:o.guardian?{userId:"STU-1",role:"Estudiante"}:null};
 let held=false,locks=0,releases=0;
 const ctx={LockService:{getScriptLock(){return {tryLock(){locks++;if(o.lockAvailable===false||held)return false;held=true;return true;},releaseLock(){releases++;held=false;}};}},
 getAuthorizedExamReadContext_(action,p){if(action!=="getStudentAcademicReport"||o.permissionDenied||!context.scope.authorized)throw Error("RESOURCE_NOT_AVAILABLE");return context;}};
 const names=["getStudentAcademicReport","getStudentAcademicReportUnlocked_","withAuthorizedExamRead_","getExamStudentProfile_","getSheetOrThrow"];
 const code=names.map(extract).join("\n")+";this.report=getStudentAcademicReport;";
 const sandbox={...ctx};vm.runInNewContext(code,sandbox);
 return {call:p=>sandbox.report(p),sheets,stats:()=>({locks,releases,held})};
}
const cases=[];function test(n,f){f();cases.push(n);}function denied(f,re=/RESOURCE_NOT_AVAILABLE/){assert.throws(f,re);}
test("student report binds authenticated identity",()=>{const r=fixture().call({});assert.equal(r.data.userId,"STU-1");assert.deepEqual(r.data.matriculas.map(x=>x.matriculaId),["MAT-3"]);assert.deepEqual(r.data.calificaciones.map(x=>x.calificacionId),["CAL-1"]);assert.deepEqual(r.data.recuperaciones.map(x=>x.recuperacionId),["REC-1"]);});
test("student cannot request another student's report",()=>denied(()=>fixture().call({userId:"STU-2"})));
test("guardian reads only verified linked student",()=>{const r=fixture({actor:{userId:"GUARD",role:"Tutor"},guardian:true}).call({userId:"STU-1"});assert.equal(r.data.userId,"STU-1");});
test("guardian cannot change linked student",()=>denied(()=>fixture({actor:{userId:"GUARD",role:"Tutor"},guardian:true}).call({userId:"STU-2"})));
test("guardian without verified relationship denied",()=>denied(()=>fixture({actor:{userId:"GUARD",role:"Tutor"}}).call({userId:"STU-1"})));
test("institutional access requires institution-wide scope",()=>denied(()=>fixture({actor:{userId:"ADMIN",role:"Administrador"},institutionWide:false}).call({userId:"STU-1"})));
test("institutional access requires explicit unique student",()=>denied(()=>fixture({actor:{userId:"ADMIN",role:"Administrador"}}).call({})));
test("institutional role reads explicit student",()=>assert.equal(fixture({actor:{userId:"ADMIN",role:"Administrador"}}).call({userId:"STU-1"}).data.userId,"STU-1"));
test("teacher direct access denied and RBAC removed",()=>{denied(()=>fixture({actor:{userId:"PROF",role:"Profesor"}}).call({userId:"STU-1"}));assert.ok(!/"Profesor": \[([\s\S]*?)\n  \],/.exec(source)[1].includes('"getStudentAcademicReport"'));});
test("unknown role denied",()=>denied(()=>fixture({actor:{userId:"X",role:"Coordinador"}}).call({userId:"STU-1"})));
test("permission denial fails closed",()=>denied(()=>fixture({permissionDenied:true}).call({})));
test("unauthorized scope denied",()=>denied(()=>fixture({authorized:false}).call({})));
test("lock timeout fails closed",()=>{const x=fixture({lockAvailable:false});denied(()=>x.call({}),/EXAM_READ_LOCK_TIMEOUT/);assert.deepEqual(x.stats(),{locks:1,releases:0,held:false});});
test("lock released after successful report",()=>{const x=fixture();x.call({});assert.deepEqual(x.stats(),{locks:1,releases:1,held:false});});
test("missing sheets return empty arrays without creating sheets",()=>{const x=fixture({missing:["Matriculas","CalificacionesEstudiantes","RecuperacionesEstudiante","CategoriasEvaluacion"]});const r=x.call({});assert.deepEqual(r.data.matriculas,[]);assert.deepEqual(r.data.calificaciones,[]);assert.deepEqual(r.data.recuperaciones,[]);assert.deepEqual(r.data.categories,[]);assert.equal(x.sheets.Matriculas,undefined);});
test("draft unpublished grades remain hidden",()=>assert.deepEqual(fixture().call({}).data.calificaciones.map(x=>x.calificacionId),["CAL-1"]));
test("duplicate matrícula IDs excluded",()=>assert.deepEqual(fixture().call({}).data.matriculas.map(x=>x.matriculaId),["MAT-1"]));
test("duplicate grade IDs excluded",()=>assert.ok(!fixture().call({}).data.calificaciones.some(x=>x.calificacionId==="CAL-DUP")));
test("duplicate recovery IDs excluded",()=>assert.ok(!fixture().call({}).data.recuperaciones.some(x=>x.recuperacionId==="REC-DUP")));
test("grade schema mismatch fails closed",()=>{const x=fixture();x.sheets.CalificacionesEstudiantes.rows[0][0]="bad";denied(()=>x.call({}),/STUDENT_ACADEMIC_REPORT_SCHEMA_INVALID/);});
test("recovery schema mismatch fails closed",()=>{const x=fixture();x.sheets.RecuperacionesEstudiante.rows[0][0]="bad";denied(()=>x.call({}),/STUDENT_ACADEMIC_REPORT_SCHEMA_INVALID/);});
test("category schema mismatch fails closed",()=>{const x=fixture();x.sheets.CategoriasEvaluacion.rows[0][0]="bad";denied(()=>x.call({}),/STUDENT_ACADEMIC_REPORT_SCHEMA_INVALID/);});
test("invalid dates normalized to null",()=>{const x=fixture();x.sheets.CalificacionesEstudiantes.rows[1][8]="bad";assert.equal(x.call({}).data.calificaciones[0].fechaRegistro,null);});
test("empty and invalid grade numbers preserve zero fallback",()=>{const x=fixture();x.sheets.CalificacionesEstudiantes.rows[1][3]="bad";assert.equal(x.call({}).data.calificaciones[0].notaObtenida,0);});
test("no sheet mutation during report reads",()=>{const x=fixture();const before=Object.keys(x.sheets).sort();x.call({});assert.deepEqual(Object.keys(x.sheets).sort(),before);});
process.stdout.write("exam-service-student-academic-report-security: PASS ("+cases.length+" scenarios)\n");
