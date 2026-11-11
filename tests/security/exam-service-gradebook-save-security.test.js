"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/exam-service/Code.gs"});
function extract(name){const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==='"'||c==="'"||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const GH=["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro"];
const CH=["ID","Fecha","Parcial","Grado","Sección","Asignatura","Unidad","Tema","profesorId"];
const CL=["ID","Fecha","Parcial","Grado","Seccion","Asignatura","ProfesorID","Estado"];
function sheet(rows){return {rows:rows.map(r=>r.slice()),writes:0,getLastRow(){return this.rows.length},getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())}},appendRow(r){this.rows.push(r.slice())},getRange(r,c,n=1,w=1){return {setValues:v=>{this.writes++;if(this.fail)throw Error("write failed");for(let i=0;i<n;i++)for(let j=0;j<w;j++)this.rows[r-1+i][c-1+j]=v[i][j]}}}};}
function fixture(o={}){const actor=o.actor||{authorized:true,userId:"P1",role:"Profesor"};const scope=o.scope||{authorized:true,institutionId:"I1",institutionWide:false,departmentIds:["D1"]};const grades=[GH,["G1","CAT-1","S1",70,70,true,false,"",new Date()]];if(o.duplicate)grades.push(grades[1].slice());if(o.badSchema)grades[0][0]="BAD";
const config=[CH,["A1",new Date(),"I parcial","10","A","Matemáticas","","","P1"]];if(o.foreignAssignment)config[1][8]="P2";
const closures=[CL];if(o.closed)closures.push(["C1",new Date(),"I parcial","10","A","Matemáticas","P1","Cerrado"]);
const sheets={CalificacionesEstudiantes:sheet(grades),Usuarios:sheet([["ID","Nombre","Grado","Seccion","Email","Rol","RolActual"],["S1","Student","10","A","","","Estudiante"],["S2","Other","10","B","","","Estudiante"]]),ConfiguracionAcademica:sheet(config),CierresPeriodos:sheet(closures)};
if(o.category) sheets.CategoriasEvaluacion=sheet([["ID","Nombre","Ambito","PorcentajePonderacion","EscalaID","Estado"],["CAT-X","X","Global",10,"100","Activo"]]);
const ss={getSheetByName:n=>sheets[n]||null};let held=false,acquired=0,released=0,opens=0;
const rt={SPREADSHEET_ID:"X",LockService:{getScriptLock:()=>({tryLock(){acquired++;if(o.timeout||held)return false;held=true;return true},releaseLock(){released++;held=false}})},validateRolePermission:()=>({authorized:o.denied!==true}),getVerifiedExamIdentity_:()=>actor,getVerifiedExamDepartmentScope_:()=>scope,SpreadsheetApp:{openById(){opens++;return ss}},getSheetOrThrow:(s,n)=>{if(!s.getSheetByName(n))throw Error("missing "+n);return s.getSheetByName(n)},normalizeString:v=>String(v||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().trim(),Utilities:{getUuid:()=>o.uuid||"UUID1"}};
vm.runInNewContext(["saveGradebookGrades","withAuthorizedGradebookSave_","getAuthorizedGradebookSaveContext_","saveGradebookGradesUnlocked_"].map(extract).join("\\n")+"\\nthis.run=saveGradebookGrades;",rt);
return {rt,sheets,stats:()=>({acquired,released,opens,held}),call(p={}){return rt.run(Object.assign({sessionToken:"signed",profesorId:"P1",grado:"10",seccion:"A",asignatura:"Matemáticas",parcial:"I parcial",calificaciones:[{evaluacionId:"CAT-1",userId:"S1",notaObtenida:88,puntajePonderado:88}]},p));}};}
let n=0;function t(fn){fn();n++;}
t(()=>{const x=fixture(),r=x.call();assert.equal(r.status,"success");assert.equal(x.sheets.CalificacionesEstudiantes.rows[1][3],88);assert.equal(x.sheets.CalificacionesEstudiantes.rows[1][6],true);assert.deepEqual(x.stats(),{acquired:1,released:1,opens:1,held:false});});
t(()=>{for(const role of ["Administrador","Desarrollador","Dirección","Director","Secretaría"]){const x=fixture({actor:{authorized:true,userId:"I",role},scope:{authorized:true,institutionId:"I1",institutionWide:true,departmentIds:[]}});assert.equal(x.call().status,"success");}});
t(()=>{for(const role of ["Estudiante","Alumno","Padre","Tutor","Responsable","Auditor"]){assert.throws(()=>fixture({actor:{authorized:true,userId:"X",role}}).call(),/RESOURCE_NOT_AVAILABLE/);}});
t(()=>{assert.throws(()=>fixture({denied:true}).call(),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{assert.throws(()=>fixture({scope:{authorized:false}}).call(),/RESOURCE_NOT_AVAILABLE/);assert.throws(()=>fixture({scope:{authorized:true,institutionId:"I",institutionWide:false,departmentIds:[]}}).call(),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{assert.throws(()=>fixture({foreignAssignment:true}).call(),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{assert.throws(()=>fixture().call({profesorId:"P2"}),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{assert.throws(()=>fixture().call({seccion:"B"}),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{assert.throws(()=>fixture().call({calificaciones:[{evaluacionId:"CAT-1",userId:"S2",notaObtenida:80}]}),/GRADEBOOK_ENTRY_OUT_OF_SCOPE/);});
t(()=>{for(const v of ["88x","1e2","-1","101","1.234",NaN,Infinity,true,{},null])assert.throws(()=>fixture().call({calificaciones:[{evaluacionId:"CAT-1",userId:"S1",notaObtenida:v}]}),/GRADEBOOK_GRADE_INVALID/);});
t(()=>{assert.equal(fixture().call({calificaciones:[{evaluacionId:"CAT-1",userId:"S1",notaObtenida:"100.00"}]}).status,"success");});
t(()=>{assert.throws(()=>fixture().call({calificaciones:[{evaluacionId:"CAT-1",userId:"S1",notaObtenida:80},{evaluacionId:"CAT-1",userId:"S1",notaObtenida:90}]}),/GRADEBOOK_ENTRY_DUPLICATE/);});
t(()=>{assert.throws(()=>fixture({duplicate:true}).call(),/GRADEBOOK_RECORD_AMBIGUOUS/);});
t(()=>{assert.throws(()=>fixture({badSchema:true}).call(),/GRADEBOOK_SCHEMA_INVALID/);});
t(()=>{assert.throws(()=>fixture({closed:true}).call(),/GRADEBOOK_PERIOD_CLOSED/);});
t(()=>{assert.throws(()=>fixture().call({parcial:""}),/GRADEBOOK_CONTEXT_REQUIRED/);});
t(()=>{assert.throws(()=>fixture().call({calificaciones:[]}),/GRADEBOOK_BATCH_INVALID/);assert.throws(()=>fixture().call({calificaciones:Array(501).fill({evaluacionId:"CAT-1",userId:"S1",notaObtenida:80})}),/GRADEBOOK_BATCH_INVALID/);});
t(()=>{assert.throws(()=>fixture().call({calificaciones:[{evaluacionId:"UNKNOWN",userId:"S1",notaObtenida:80}]}),/GRADEBOOK_ENTRY_OUT_OF_SCOPE/);});
t(()=>{assert.throws(()=>fixture({category:true}).call({calificaciones:[{evaluacionId:"CAT-X",userId:"S1",notaObtenida:80}]}),/GRADEBOOK_CATEGORY_OWNERSHIP_UNVERIFIED/);});
t(()=>{const x=fixture({timeout:true});assert.throws(()=>x.call(),/GRADEBOOK_SAVE_LOCK_TIMEOUT/);assert.equal(x.stats().opens,0);});
t(()=>{const x=fixture();x.sheets.CalificacionesEstudiantes.fail=true;assert.throws(()=>x.call(),/write failed/);assert.equal(x.sheets.CalificacionesEstudiantes.rows[1][3],70);});
t(()=>{const x=fixture();x.call({calificaciones:[{evaluacionId:"CAT-2",userId:"S1",notaObtenida:95}]});assert.equal(x.sheets.CalificacionesEstudiantes.rows.length,3);assert.match(x.sheets.CalificacionesEstudiantes.rows[2][0],/^CALIF-/);});
t(()=>{const x=fixture();assert.throws(()=>x.call({esAnoHistoricoAnterior:true}),/GRADEBOOK_HISTORICAL_YEAR_IMMUTABLE/);assert.throws(()=>x.call({esPadreDeEstudiante:true}),/GRADEBOOK_SELF_CHILD_FORBIDDEN/);});
console.log("exam-service-gradebook-save-security: PASS ("+n+"/23)");
