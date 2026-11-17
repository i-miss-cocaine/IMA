"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/academic-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/academic-service/Code.gs"});
function extract(name){const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==='"'||c==="'"||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const names=["getRequestSessionToken_","getRequestPermissionAction_","getVerifiedRequestSessionClaims_","getCachedRequestAuthorization_","cacheRequestAuthorization_","clearRequestAuthorizationContext_","validateRolePermission","getVerifiedAcademicIdentity_"];
let verifyCalls=0,contextCalls=0,dynamicCalls=0;
const rt={PUBLIC_ACTIONS:[],ROLE_PERMISSIONS:{Profesor:["saveAcademicRecord","previewStudentDocument","getStudentDocumentFile"]},
verifySessionToken(token){verifyCalls++;return token==="valid"?{userId:"T1",role:"Profesor",sessionId:"S1"}:null;},
validateContextualAccess(){contextCalls++;return {authorized:true};},getDynamicPermissionsForRole(){dynamicCalls++;return null;},
hasActiveDelegationForAction(){return false;},auditTeacherJustificationDenied_(){},logStructuredEvent(){}};
const runSource=names.map(extract).join("\n")+"\nthis.validate=validateRolePermission;this.identity=getVerifiedAcademicIdentity_;this.clear=clearRequestAuthorizationContext_;";
vm.runInNewContext(runSource,rt);
let n=0;function t(fn){fn();n++;}
t(()=>{const p={sessionToken:"valid"};assert.equal(rt.validate("saveAcademicRecord",p).authorized,true);assert.equal(rt.validate("saveAcademicRecord",p).authorized,true);assert.equal(verifyCalls,1);assert.equal(contextCalls,1);assert.equal(dynamicCalls,1);});
t(()=>{const p={sessionToken:"valid"};rt.validate("saveAcademicRecord",p);rt.validate("getStudentDocumentFile",p);assert.equal(verifyCalls,2);assert.equal(contextCalls,3);assert.equal(dynamicCalls,3);});
t(()=>{const p={sessionToken:"valid",operation:"PREVIEW"};assert.equal(rt.validate("getStudentDocumentFile",p).authorized,true);assert.equal(rt.validate("getStudentDocumentFile",p).authorized,true);assert.equal(verifyCalls,3);assert.equal(contextCalls,4);assert.equal(dynamicCalls,4);});
t(()=>{const p={sessionToken:"valid"};rt.validate("saveAcademicRecord",p);assert.equal(rt.identity(p).userId,"T1");assert.equal(rt.identity(p).userId,"T1");assert.equal(verifyCalls,4);});
t(()=>{const p={sessionToken:"valid",_imaAuthorizationCache:{token:"valid",actions:{saveAcademicRecord:"Administrador"}},_imaVerifiedSessionToken:"valid",_imaVerifiedSessionClaims:{userId:"ATTACKER",role:"Administrador"}};rt.clear(p);assert.equal(rt.validate("saveAcademicRecord",p).authorized,true);assert.equal(verifyCalls,5);assert.equal(rt.identity(p).userId,"T1");});
t(()=>{const p={sessionToken:"valid"};rt.validate("saveAcademicRecord",p);p.sessionToken="invalid";assert.equal(rt.validate("saveAcademicRecord",p).authorized,false);assert.equal(verifyCalls,7);});
const doPost=extract("doPost"),createAdmission=extract("createAdmissionRequest");
assert(doPost.includes("clearRequestAuthorizationContext_(payload)"));
assert(doPost.indexOf("clearRequestAuthorizationContext_(payload)")<doPost.indexOf("validateRolePermission(action, payload)"));
assert(!doPost.includes("checkAndRegisterIdempotencyKey")&&!doPost.includes("saveIdempotentResult"),"ordinary CRUD no longer performs generic idempotency checks");
assert(createAdmission.includes("checkAndRegisterIdempotencyKey")&&createAdmission.includes("saveIdempotentResult"),"public admission duplicate protection is preserved");
console.log("academic-service-single-auth-context: PASS ("+n+"/6)");
