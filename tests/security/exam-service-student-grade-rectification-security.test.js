"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert"),path=require("path");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/exam-service/Code.gs"});
function extract(name){const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==='"'||c==="'"||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const GH=["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro"];
const AH=["RectificacionID","EvaluacionID","UserID","Accion","NotaAnterior","NotaNueva","Motivo","AutorizadoPor","Fecha"];
function mkSheet(rows){return {rows:rows.map(r=>r.slice()),getLastRow(){return this.rows.length},getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())}},appendRow(r){this.rows.push(r.slice())},deleteRow(i){this.rows.splice(i-1,1)},getRange(row,col,n=1,w=1){return {setValue:v=>{this.rows[row-1][col-1]=v},setValues:values=>{if(this.failWriteOnce){this.failWriteOnce=false;throw Error("write failed");}for(let a=0;a<n;a++)for(let b=0;b<w;b++)this.rows[row-1+a][col-1+b]=values[a][b]}}}};}
function fixture(o={}){const grades=[GH.slice(),["G-1","E-1","S-1",75,75,false,true,"original",new Date("2026-01-01")]];if(o.noGrade)grades.splice(1,1);if(o.duplicate)grades.push(grades[1].slice());if(o.badSchema)grades[0][0]="Wrong";if(o.incomplete)grades[1][1]="";if(o.badOldGrade)grades[1][3]="bad";
const users=[["ID","Nombre","Grado","Seccion","Email","Rol","RolActual"],["S-1","Student","10","A","","","Estudiante"]];if(o.duplicateStudent)users.push(users[1].slice());if(o.nonStudent)users[1][6]="Profesor";
const gs=mkSheet(grades),as=o.noAudit?null:mkSheet(o.badAudit?[[...AH.slice(0,1),"Wrong",...AH.slice(2)]]:o.emptyAudit?[]:[AH.slice()]);
const sheets={CalificacionesEstudiantes:gs,Usuarios:mkSheet(users),HistorialRectificacionesNotas:as};
const stats={acquired:0,released:0,opens:0,held:false};
const actor=o.actor||{authorized:true,userId:"SEC-1",role:"Secretaría"};
const scope=o.scope||{authorized:true,institutionId:"INST-1",institutionWide:true};
const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>sheets[n]=mkSheet([])};
const rt={LockService:{getScriptLock:()=>({tryLock(){stats.acquired++;if(o.timeout||stats.held)return false;stats.held=true;return true},releaseLock(){stats.released++;stats.held=false}})},validateRolePermission:()=>({authorized:o.denied!==true}),getVerifiedExamIdentity_:()=>o.invalidIdentity?{authorized:false}:actor,getVerifiedExamDepartmentScope_:()=>scope,SpreadsheetApp:{openById(){stats.opens++;if(stats.onOpen){const f=stats.onOpen;stats.onOpen=null;f();}return ss}},getSheetOrThrow:(s,n)=>{const x=s.getSheetByName(n);if(!x)throw Error("missing "+n);return x},getOrCreateSheet:(s,n)=>s.getSheetByName(n)||s.insertSheet(n),normalizeString:v=>String(v||"").trim().toLowerCase(),Utilities:{getUuid:()=>o.uuid||"UUID-1"},logDebug(){} ,SPREADSHEET_ID:"TEST"};
const names=["rectifyStudentGrade","withAuthorizedStudentGradeRectification_","getAuthorizedStudentGradeRectificationContext_","rectifyStudentGradeUnlocked_"];vm.runInNewContext(names.map(extract).join("\n")+"\nthis.rectifyStudentGrade=rectifyStudentGrade;",rt);
return {rt,sheets,stats,call(p={}){return rt.rectifyStudentGrade(Object.assign({sessionToken:"signed",calificacionId:"G-1",notaNueva:88,motivo:"Corrección documentada"},p));}};}
let n=0;function test(f){f();n++;}
test(()=>{const x=fixture(),r=x.call();assert.equal(r.status,"success");assert.equal(x.sheets.CalificacionesEstudiantes.rows[1][3],88);const a=x.sheets.HistorialRectificacionesNotas.rows[1];assert.equal(a[1],"E-1");assert.equal(a[2],"S-1");assert.equal(a[7],"SEC-1");assert.equal(x.stats.released,1)});
test(()=>{for(const role of ["Administrador","Desarrollador","Dirección","Director","Secretaría"])assert.equal(fixture({actor:{authorized:true,userId:"A",role}}).call().status,"success")});
test(()=>{for(const role of ["Profesor","Estudiante","Alumno","Tutor","Padre","Responsable","Auditor","Unknown"])assert.throws(()=>fixture({actor:{authorized:true,userId:"X",role}}).call(),/RESOURCE_NOT_AVAILABLE/)});
test(()=>{assert.throws(()=>fixture({denied:true}).call(),/RESOURCE_NOT_AVAILABLE/);assert.throws(()=>fixture({invalidIdentity:true}).call(),/RESOURCE_NOT_AVAILABLE/)});
test(()=>{for(const scope of [{authorized:false,institutionId:"I",institutionWide:true},{authorized:true,institutionId:"",institutionWide:true},{authorized:true,institutionId:"I",institutionWide:false}])assert.throws(()=>fixture({scope}).call(),/RESOURCE_NOT_AVAILABLE/)});
test(()=>{for(const p of [{calificacionId:""},{notaNueva:null},{motivo:"corto"},{motivo:"x".repeat(2001)}])assert.throws(()=>fixture().call(p),/REQUIRED_FIELDS_INVALID/)});
test(()=>{for(const notaNueva of ["88abc","1e2","-1","101","1.234",NaN,Infinity,{},true])assert.throws(()=>fixture().call({notaNueva}),/GRADE_INVALID/)});
test(()=>{assert.equal(fixture().call({notaNueva:"100.00"}).notaNueva,100);assert.equal(fixture().call({notaNueva:"0"}).notaNueva,0)});
test(()=>{assert.throws(()=>fixture({noGrade:true}).call(),/RECORD_NOT_FOUND/)});
test(()=>{assert.throws(()=>fixture({duplicate:true}).call(),/RECORD_AMBIGUOUS/)});
test(()=>{assert.throws(()=>fixture({badSchema:true}).call(),/SCHEMA_INVALID/)});
test(()=>{assert.throws(()=>fixture({incomplete:true}).call(),/RECORD_INVALID/)});
test(()=>{assert.throws(()=>fixture({badOldGrade:true}).call(),/RECORD_INVALID/)});
test(()=>{assert.throws(()=>fixture({duplicateStudent:true}).call(),/RESOURCE_NOT_AVAILABLE/)});
test(()=>{assert.throws(()=>fixture({nonStudent:true}).call(),/RESOURCE_NOT_AVAILABLE/)});
test(()=>{const x=fixture();assert.equal(x.call({evaluacionId:"E-1",userId:"S-1",calificacionId:""}).status,"success")});
test(()=>{assert.throws(()=>fixture().call({calificacionId:"G-1",evaluacionId:"OTHER"}),/RECORD_INVALID/)});
test(()=>{const x=fixture({noAudit:true});assert.equal(x.call().status,"success");assert.equal(x.sheets.HistorialRectificacionesNotas.rows.length,2)});
test(()=>{assert.throws(()=>fixture({badAudit:true}).call(),/AUDIT_SCHEMA_INVALID/)});
test(()=>{const x=fixture({emptyAudit:true});assert.equal(x.call().status,"success");assert.deepEqual(x.sheets.HistorialRectificacionesNotas.rows[0],AH)});
test(()=>{assert.throws(()=>fixture({uuid:" "}).call(),/AUDIT_ID_COLLISION/)});
test(()=>{const x=fixture();x.sheets.HistorialRectificacionesNotas.appendRow=()=>{throw Error("audit write")};assert.throws(()=>x.call(),/WRITE_FAILED/);assert.equal(x.sheets.CalificacionesEstudiantes.rows[1][3],75)});
test(()=>{const x=fixture();x.sheets.CalificacionesEstudiantes.failWriteOnce=true;assert.throws(()=>x.call(),/WRITE_FAILED/);assert.equal(x.sheets.HistorialRectificacionesNotas.rows.length,1)});
test(()=>{const x=fixture({timeout:true});assert.throws(()=>x.call(),/LOCK_TIMEOUT/);assert.equal(x.stats.opens,0);assert.equal(x.stats.released,0)});
test(()=>{const x=fixture();x.stats.onOpen=()=>assert.throws(()=>x.call(),/LOCK_TIMEOUT/);assert.equal(x.call().status,"success");assert.equal(x.stats.acquired,2);assert.equal(x.stats.released,1)});
test(()=>{const x=fixture();x.call();assert.throws(()=>x.call(),/AUDIT_ID_COLLISION/)});
test(()=>{const x=fixture();assert.equal(x.call({autorizadoPor:"Attacker",_verifiedUserId:"FAKE"}).status,"success");assert.equal(x.sheets.HistorialRectificacionesNotas.rows[1][7],"SEC-1")});
test(()=>{for(const options of [{denied:true},{invalidIdentity:true},{actor:{authorized:true,userId:"",role:"Secretaría"}},{actor:{authorized:true,userId:"X",role:"Profesor"}}]){const x=fixture(options);assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.equal(x.stats.acquired,0,"denial must not acquire ScriptLock");assert.equal(x.stats.opens,0,"denial must not open Sheets");}});
console.log("exam-service-student-grade-rectification-security: PASS ("+n+"/28)");
