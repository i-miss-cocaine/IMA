"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");new vm.Script(source);
function extract(n){const m=new RegExp("function "+n+"\\s*\\(").exec(source);assert.ok(m);const o=source.indexOf("{",m.index);let d=0,q="",e=false;for(let i=o;i<source.length;i++){const c=source[i];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c===q)q="";continue;}if(c==="'"||c==='"'||c==="`"){q=c;continue;}if(c==="{")d++;else if(c==="}"&&--d===0)return source.slice(m.index,i+1);}throw Error("unbalanced "+n);}
function sh(rows,hooks={}){return{rows,appends:0,getDataRange(){return{getValues:()=>this.rows.map(r=>r.slice())};},getLastRow(){return this.rows.length;},appendRow(r){this.appends++;if(this.onAppend)this.onAppend(r);if(hooks.onAppend)hooks.onAppend(r);this.rows.push(r.slice());}};}
function fx(o={}){const h={u:["UserID","Nombre","Grado","Seccion","Email","RolLegacy","Rol"],c:["ID","Fecha","Parcial","Grado","Sección","Asignatura","Unidad","Tema","profesorId"],g:["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro"],cl:["CierreID","AnoID","PeriodoID","Grado","Seccion","Asignatura","ProfesorID","Estado","FechaCierre"]};
const u=[h.u,["S1","Student","10","A","","","Estudiante"]];if(o.duplicate)u.push(u[1].slice());
const cfg=[h.c,["C1","","P1","10","A","Math","","","T1"]];if(o.otherSubject)cfg.push(["C2","","P1","10","A","Science","","","T1"]);if(o.otherPeriod)cfg.push(["C3","","P2","10","A","Math","","","T1"]);if(o.otherTeacher)cfg[1][8]="T2";if(o.noAssignment)cfg.splice(1,1);
const cats=["CAT-1","CAT-2","CAT-3","CAT-4"],g=[h.g,...cats.map((x,i)=>["G"+i,x,"S1",80,80,false,true,"",""])];if(o.draft)g[1][5]=true;if(o.unpublished)g[1][6]=false;if(o.missing)g.pop();if(o.duplicateCat)g.push(g[1].slice());if(o.badScore)g[1][3]=101;
const cl=[h.cl];if(o.existing)cl.push(["CL","2026","P1","10","A","Math","T1","Cerrado",""]);if(o.badSchema)cl[0]=["wrong"];
const sheets={Usuarios:sh(u),ConfiguracionAcademica:sh(cfg),CalificacionesEstudiantes:sh(g)};if(!o.missingClosure)sheets.CierresPeriodos=sh(cl);
const stats={opens:0,acq:0,rel:0,held:false,events:[],insertions:0};const ss={getSheetByName(n){return sheets[n]||null;},insertSheet(n){stats.insertions++;sheets[n]=sh([],{onAppend:o.onClosureAppend});if(stats.onInsert){const callback=stats.onInsert;stats.onInsert=null;callback();}return sheets[n];}};
const actors=o.actors||[o.actor||{authorized:true,userId:"T1",role:"Profesor"}],scope=o.scope||{authorized:true,institutionId:"I1",institutionWide:false};let actorCalls=0,permissionCalls=0;
const rt={SPREADSHEET_ID:"X",LockService:{getScriptLock(){stats.events.push("lock");return{tryLock(){stats.acq++;if(o.timeout||stats.held)return false;stats.held=true;return true;},releaseLock(){stats.rel++;stats.held=false;}};}},validateRolePermission(){stats.events.push("rbac");const sequence=Array.isArray(o.permissions)?o.permissions:null;return{authorized:sequence?sequence[Math.min(permissionCalls++,sequence.length-1)]===true:o.denied!==true};},getVerifiedExamIdentity_(){stats.events.push("identity");return actors[Math.min(actorCalls++,actors.length-1)];},getVerifiedExamDepartmentScope_(){return scope;},SpreadsheetApp:{openById(){stats.events.push("sheets");stats.opens++;if(stats.onOpen){const callback=stats.onOpen;stats.onOpen=null;callback();}return ss;}},getSheetOrThrow(s,n){const x=s.getSheetByName(n);if(!x)throw Error("MISSING_"+n);return x;},getOrCreateSheet(s,n){return s.getSheetByName(n)||s.insertSheet(n);},normalizeString(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();},Utilities:{getUuid(){return"U1";}}};
const ns=["closePeriodGradebook","withAuthorizedPeriodGradebookClosure_","getAuthorizedPeriodGradebookClosureContext_","closePeriodGradebookUnlocked_"];vm.runInNewContext(ns.map(extract).join("\n")+"\nthis.closePeriodGradebook=closePeriodGradebook;",rt);
return{rt,sheets,stats,call(p={}){return rt.closePeriodGradebook(Object.assign({sessionToken:"t",anoId:"2026",periodoId:"P1",grado:"10",seccion:"A",asignatura:"Math",profesorId:"T1"},p));}};}
let n=0;function t(f){f();n++;}
t(()=>{const x=fx(),r=x.call();assert.equal(r.status,"success");assert.equal(x.sheets.CierresPeriodos.rows.length,2);assert.equal(x.sheets.CierresPeriodos.rows[1][6],"T1");assert.equal(x.stats.rel,1);});
t(()=>assert.throws(()=>fx().call({profesorId:"T2"}),/RESOURCE_NOT_AVAILABLE/));
t(()=>{const x=fx({denied:true});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.equal(x.stats.opens,0);const y=fx({actor:{authorized:false}});assert.throws(()=>y.call(),/RESOURCE_NOT_AVAILABLE/);assert.equal(y.stats.opens,0);});
t(()=>{for(const role of ["Estudiante","Alumno","Tutor","Unknown"])assert.throws(()=>fx({actor:{authorized:true,userId:"X",role}}).call(),/RESOURCE_NOT_AVAILABLE/);assert.equal(fx({actor:{authorized:true,userId:"A",role:"Administrador"},scope:{authorized:true,institutionId:"I1",institutionWide:true}}).call().status,"success");assert.throws(()=>fx({actor:{authorized:true,userId:"A",role:"Administrador"},scope:{authorized:true,institutionId:"I1",institutionWide:false}}).call(),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{for(const o of [{noAssignment:true},{otherTeacher:true}])assert.throws(()=>fx(o).call(),/RESOURCE_NOT_AVAILABLE/);});
t(()=>{assert.throws(()=>fx({otherSubject:true}).call(),/CONTEXT_AMBIGUOUS/);assert.throws(()=>fx({otherPeriod:true}).call(),/CONTEXT_AMBIGUOUS/);});
t(()=>{assert.throws(()=>fx({duplicate:true}).call(),/ROSTER_EMPTY/);const x=fx();x.sheets.Usuarios.rows.pop();assert.throws(()=>x.call(),/ROSTER_EMPTY/);});
t(()=>{for(const o of [{draft:true},{unpublished:true},{missing:true},{duplicateCat:true},{badScore:true}])assert.throws(()=>fx(o).call(),/GRADEBOOK_CLOSURE_/);});
t(()=>{assert.throws(()=>fx({existing:true}).call(),/ALREADY_EXISTS/);assert.throws(()=>fx({badSchema:true}).call(),/SCHEMA_INVALID/);});
t(()=>{const x=fx({missingClosure:true});assert.equal(x.call().status,"success");assert.equal(x.sheets.CierresPeriodos.rows.length,2);const y=fx({missingClosure:true,denied:true});assert.throws(()=>y.call());assert.equal(y.sheets.CierresPeriodos,undefined);});
t(()=>{for(const p of [{anoId:""},{periodoId:""},{grado:""},{seccion:""},{asignatura:""}])assert.throws(()=>fx().call(p),/REQUIRED_CONTEXT/);});
t(()=>{const x=fx({timeout:true});assert.throws(()=>x.call(),/LOCK_TIMEOUT/);assert.equal(x.stats.opens,0);const y=fx();y.call();assert.equal(y.stats.rel,1);});
t(()=>{const x=fx();x.call();assert.throws(()=>x.call(),/ALREADY_EXISTS/);assert.equal(x.sheets.CierresPeriodos.rows.length,2);});
t(()=>{const x=fx({actor:{authorized:true,userId:"A",role:"Administrador"},scope:{authorized:true,institutionId:"I1",institutionWide:true},otherSubject:true});assert.throws(()=>x.call(),/CONTEXT_AMBIGUOUS/);});
t(()=>{const x=fx();x.stats.onOpen=()=>assert.throws(()=>x.call(),/LOCK_TIMEOUT/);assert.equal(x.call().status,"success");assert.equal(x.stats.acq,2);assert.equal(x.stats.rel,1);});
t(()=>{const x=fx();x.rt.Utilities.getUuid=()=>"CL";x.sheets.CierresPeriodos.rows.push(["CIERRE-CL","2025","P0","9","B","Science","T1","Cerrado",""]);assert.throws(()=>x.call(),/ID_COLLISION/);});

// El preflight debe rechazar RBAC antes de adquirir ScriptLock o abrir Sheets.
t(()=>{const x=fx({denied:true});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual(x.stats.events,["rbac"]);assert.equal(x.stats.acq,0);assert.equal(x.stats.opens,0);});
// La identidad incompleta, no autorizada o con rol no admitido se rechaza antes del lock.
t(()=>{for(const actor of [
 {authorized:false,userId:"T1",role:"Profesor"},
 {authorized:true,userId:"",role:"Profesor"},
 {authorized:true,userId:"  ",role:"Profesor"},
 {authorized:true,userId:"X",role:"Estudiante"},
 {authorized:true,userId:"X",role:"Tutor"}
]){const x=fx({actor});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual(x.stats.events,["rbac","identity"]);assert.equal(x.stats.acq,0);assert.equal(x.stats.opens,0);}});
 // La ruta autorizada valida dos veces RBAC/identidad: preflight y contexto dentro del lock.
t(()=>{const x=fx();assert.equal(x.call().status,"success");assert.deepEqual(x.stats.events.slice(0,6),["rbac","identity","lock","rbac","identity","sheets"]);assert.equal(x.stats.events.filter(v=>v==="rbac").length,2);assert.equal(x.stats.events.filter(v=>v==="identity").length,2);assert.deepEqual([x.stats.acq,x.stats.rel,x.stats.held],[1,1,false]);});

// La identidad debe seguir completa durante la revalidación bajo lock; un userId en blanco no puede abrir Sheets.
t(()=>{const x=fx({actors:[{authorized:true,userId:"T1",role:"Profesor"},{authorized:true,userId:"   ",role:"Profesor"}]});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual(x.stats.events.slice(0,5),["rbac","identity","lock","rbac","identity"]);assert.equal(x.stats.opens,0);assert.deepEqual([x.stats.acq,x.stats.rel,x.stats.held],[1,1,false]);});
// Revocación RBAC entre preflight y contexto: denegar bajo lock antes de consultar identidad o abrir Sheets.
t(()=>{const x=fx({permissions:[true,false]});const before=JSON.stringify(x.sheets.CierresPeriodos.rows);assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual(x.stats.events,["rbac","identity","lock","rbac"]);assert.deepEqual([x.stats.acq,x.stats.rel,x.stats.held],[1,1,false]);assert.equal(x.stats.opens,0);assert.equal(JSON.stringify(x.sheets.CierresPeriodos.rows),before);});
// La reentrada durante appendRow debe quedar contenida por el mismo ScriptLock.
t(()=>{
  const x=fx(), sheet=x.sheets.CierresPeriodos, append=sheet.appendRow.bind(sheet);
  let nestedError="";
  sheet.appendRow=function(row){
    try{x.call();}catch(error){nestedError=error.message;}
    append(row);
  };
  const result=x.call();
  assert.equal(result.status,"success");
  assert.match(nestedError,/GRADEBOOK_CLOSURE_LOCK_TIMEOUT/);
  assert.equal(sheet.rows.length,2,"la solicitud exterior debe crear un único cierre");
  assert.equal(x.stats.opens,1,"la solicitud anidada no debe abrir Sheets");
  assert.deepEqual([x.stats.acq,x.stats.rel,x.stats.held],[2,1,false]);
});
// La reentrada durante insertSheet debe quedar contenida antes de inicializar CierresPeriodos.
t(()=>{const x=fx({missingClosure:true});let nestedError="";x.stats.onInsert=()=>{try{x.call();}catch(error){nestedError=error.message;}};const result=x.call();const sheet=x.sheets.CierresPeriodos;assert.equal(result.status,"success");assert.match(nestedError,/GRADEBOOK_CLOSURE_LOCK_TIMEOUT/);assert.equal(x.stats.insertions,1,"la hoja de cierres debe insertarse una sola vez");assert.deepEqual(sheet.rows[0],["CierreID","AnoID","PeriodoID","Grado","Seccion","Asignatura","ProfesorID","Estado","FechaCierre"]);assert.equal(sheet.rows.length,2,"solo una fila de cierre debe persistirse");assert.equal(sheet.appends,2,"solo encabezado y cierre exterior");assert.deepEqual([x.stats.opens,x.stats.acq,x.stats.rel,x.stats.held],[1,2,1,false]);});
// La reentrada durante appendRow de encabezados no puede inicializar o cerrar dos veces.
t(()=>{const x=fx({missingClosure:true});let nestedError="",nested=0;x.stats.onInsert=()=>{x.sheets.CierresPeriodos.onAppend=row=>{if(row[0]!=="CierreID"||nested++)return;try{x.call();}catch(error){nestedError=error.message;}};};const result=x.call();const sheet=x.sheets.CierresPeriodos;assert.equal(result.status,"success");assert.equal(nested,1);assert.match(nestedError,/GRADEBOOK_CLOSURE_LOCK_TIMEOUT/);assert.deepEqual(sheet.rows[0],["CierreID","AnoID","PeriodoID","Grado","Seccion","Asignatura","ProfesorID","Estado","FechaCierre"]);assert.equal(sheet.rows.length,2);assert.equal(sheet.appends,2);assert.deepEqual([x.stats.opens,x.stats.acq,x.stats.rel,x.stats.held],[1,2,1,false]);});
console.log("exam-service-period-gradebook-closure-security: PASS ("+n+"/24)");
