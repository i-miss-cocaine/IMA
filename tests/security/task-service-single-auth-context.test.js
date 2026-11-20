"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/task-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extract(name){const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==='"'||c==="'"||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const names=["getRequestSessionToken_","getVerifiedRequestSessionClaims_","getCachedRequestAuthorization_","cacheRequestAuthorization_","clearRequestAuthorizationContext_","validateRolePermission","getVerifiedTaskIdentity_"];
let verifyCalls=0,contextCalls=0,dynamicCalls=0;
const rt={PUBLIC_ACTIONS:[],ROLE_PERMISSIONS:{Profesor:["createTask","gradeSubmission","createStudyMaterial"]},
verifySessionToken(token){verifyCalls++;return token==="valid"?{userId:"T1",role:"Profesor",sessionId:"S1"}:null;},
validateContextualAccess(){contextCalls++;return {authorized:true};},getDynamicPermissionsForRole(){dynamicCalls++;return null;},
hasActiveDelegationForAction(){return false;},Logger:{log(){}}};
const runSource=names.map(extract).join("\n")+"\nthis.validate=validateRolePermission;this.identity=getVerifiedTaskIdentity_;this.clear=clearRequestAuthorizationContext_;";
vm.runInNewContext(runSource,rt);
let n=0;function t(fn){fn();n++;}
t(()=>{const p={sessionToken:"valid"};assert.equal(rt.validate("createTask",p).authorized,true);assert.equal(rt.validate("createTask",p).authorized,true);assert.equal(verifyCalls,1);assert.equal(contextCalls,1);assert.equal(dynamicCalls,1);});
t(()=>{const p={sessionToken:"valid"};rt.validate("createTask",p);rt.validate("gradeSubmission",p);assert.equal(verifyCalls,2);assert.equal(contextCalls,3);assert.equal(dynamicCalls,3);});
t(()=>{const p={sessionToken:"valid"};rt.validate("createTask",p);assert.equal(rt.identity(p).userId,"T1");assert.equal(rt.identity(p).userId,"T1");assert.equal(verifyCalls,3,"task identity reuses verified session claims");});
t(()=>{const p={sessionToken:"valid",_imaAuthorizationCache:{token:"valid",actions:{createTask:"Administrador"}},_imaVerifiedSessionToken:"valid",_imaVerifiedSessionClaims:{userId:"ATTACKER",role:"Administrador"}};rt.clear(p);assert.equal(rt.validate("createTask",p).authorized,true);assert.equal(verifyCalls,4);assert.equal(rt.identity(p).userId,"T1");});
t(()=>{const p={sessionToken:"valid"};rt.validate("createTask",p);p.sessionToken="invalid";assert.equal(rt.validate("createTask",p).authorized,false);assert.equal(verifyCalls,6);});
const previewFn = extract("getSubmissionDocumentPreviewUrl");
assert(previewFn.includes("getVerifiedTaskIdentity_(payload)"));
assert(!previewFn.includes("getVerifiedRequestSessionClaims_(payload)"), "preview reuses the dispatcher-verified identity instead of validating the session twice");
assert(previewFn.includes('getTaskServiceSubmissionAccess_(accessPayload,"READ_CONTENT",identity)'));

{
 const actor={authorized:true,userId:"PROF-1",role:"Profesor"};
 const scope={authorized:true,userId:"PROF-1",role:"Profesor",institutionId:"INST-1",departmentIds:["D1"],institutionWide:false};
 const classroomRows=[
  ["AulaID","OfertaID","Nombre","Grado","Seccion","Asignatura","ProfesorID","Estado"],
  ["CLASS-1","OFFER-1","Class 1","6","A","Matemáticas","PROF-1","Activa"]
 ];
 const assignmentRows=[
  ["ID","OfertaID","ProfesorID","Rol","Inicio","Fin","Estado"],
  ["AS-1","OFFER-1","PROF-1","Titular","2026-01-01","2099-12-31","Activo"]
 ];
 const classSheet={getDataRange:()=>({getValues:()=>classroomRows})};
 const assignmentSheet={getDataRange:()=>({getValues:()=>assignmentRows})};
 const ss={getSheetByName:name=>name==="AsignacionesDocentes"?assignmentSheet:null};
 const state={identityCalls:0,scopeCalls:0,ownershipCalls:0,openCalls:0};
 const context={
  SPREADSHEET_ID:"LOCAL",
  SpreadsheetApp:{openById:()=>{state.openCalls++;return ss;}},
  getVerifiedTaskIdentity_:()=>{state.identityCalls++;return actor;},
  getVerifiedTaskDepartmentScope_:(_payload,passedSS,passedActor)=>{state.scopeCalls++;assert.equal(passedSS,ss);assert.equal(passedActor,actor);return scope;},
  getSheetOrThrow:(_ss,name)=>{assert.equal(name,"AulasVirtuales");return classSheet;},
  assertTaskServiceResourceOwnership_:(_payload,type,id,_operation,passedSS,passedActor,passedScope)=>{
   state.ownershipCalls++;assert.equal(passedSS,ss);assert.equal(passedActor,actor);assert.equal(passedScope,scope);
   return {authorized:true,departmentId:type==="TAREA"?"D1":context.classDepartmentId||"D1"};
  },
  isTaskServiceAdministrativeRole:()=>false,
  normalizeString:value=>String(value||"").trim().toLowerCase(),
  isInTeacherList:(value,list)=>!list||String(list).split(",").map(x=>x.trim()).includes(String(value).trim()),
  classDepartmentId:"D1",
  Date,String,Error
 };
 const names=["getTaskServiceAuthorizedClassrooms","isTaskServiceTeacherTaskAuthorized_","assertTaskServiceTeacherCanManageTask"];
 vm.runInNewContext(names.map(extract).join("\n")+"\nthis.guard=assertTaskServiceTeacherCanManageTask;",context);
 const task=["TASK-1","Tarea","Math","","P1","Matemáticas","6","A","","","PROF-1"];
 assert.equal(context.guard({sessionToken:"valid"},task,"UPDATE"),true);
 assert.equal(state.identityCalls,1,"task guard resolves verified actor once");
 assert.equal(state.scopeCalls,1,"task guard reuses one department-scope decision");
 assert.equal(state.openCalls,1,"task guard reuses one Spreadsheet handle");
 assert.equal(state.ownershipCalls,2,"task and classroom ownership remain distinct resource checks");
 const mismatchContext={...context,classDepartmentId:"D2"};
 vm.runInNewContext(names.map(extract).join("\n")+"\nthis.guard=assertTaskServiceTeacherCanManageTask;",mismatchContext);
 assert.throws(()=>mismatchContext.guard({sessionToken:"valid"},task,"UPDATE"),/RESOURCE_NOT_FOUND/);
}

console.log("task-service-single-auth-context: PASS ("+n+"/5)");
