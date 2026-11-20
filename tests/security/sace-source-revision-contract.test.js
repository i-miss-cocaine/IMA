"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const paths={Academic:"backend/academic-service/Code.gs",User:"backend/user-service/Code.gs",Exam:"backend/exam-service/Code.gs"};
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
for(const [service,path] of Object.entries(paths)){const source=fs.readFileSync(path,"utf8");new vm.Script(source,{filename:path});const helper=extract(source,"getSace"+service+"SourceRevisionLocked_")+"\n"+extract(source,"advanceSace"+service+"SourceRevisionLocked_")+"\nthis.read=getSace"+service+"SourceRevisionLocked_;this.advance=advanceSace"+service+"SourceRevisionLocked_;";const props={};const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v;}})},Utilities:{getUuid:()=>"epoch-12345678"},Number,Error};vm.runInNewContext(helper,ctx);assert.equal(ctx.read(),"epoch-12345678:0");assert.equal(ctx.advance(),"epoch-12345678:1");assert.equal(ctx.advance(),"epoch-12345678:2");assert.equal(props["IMA_SACE_"+service.toUpperCase()+"_SOURCE_REVISION"],"epoch-12345678:2");
const failingProperties = {};
let propertyWrites = 0;
const failingContext = {
  PropertiesService: { getScriptProperties: () => ({
    getProperty: key => failingProperties[key] || null,
    setProperty: (key,value) => { propertyWrites++; if (propertyWrites === 2) throw new Error("TEST_PERSISTENCE_FAILURE"); failingProperties[key] = value; }
  }) },
  Utilities: { getUuid: () => "epoch-12345678" }, Number, Error
};
vm.runInNewContext(helper, failingContext);
assert.equal(failingContext.read(), "epoch-12345678:0");
assert.throws(() => failingContext.advance(), /TEST_PERSISTENCE_FAILURE/,
  service + " must abort a revision increment when ScriptProperties persistence fails");
assert.equal(failingProperties["IMA_SACE_"+service.toUpperCase()+"_SOURCE_REVISION"], "epoch-12345678:0",
  service + " must not advance the token when persistence fails");
const corruptProperties = { ["IMA_SACE_"+service.toUpperCase()+"_SOURCE_REVISION"]: "corrupt" };
const corruptContext = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => corruptProperties[key] || null, setProperty: (key,value) => { corruptProperties[key] = value; } }) },
  Utilities: { getUuid: () => "epoch-12345678" }, Number, Error
};
vm.runInNewContext(helper, corruptContext);
assert.throws(() => corruptContext.read(), /SACE_SOURCE_REVISION_INVALID/, service + " rejects corrupted epochs");
const exhaustedProperties = { ["IMA_SACE_"+service.toUpperCase()+"_SOURCE_REVISION"]: "epoch-12345678:"+Number.MAX_SAFE_INTEGER };
const exhaustedContext = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => exhaustedProperties[key] || null, setProperty: (key,value) => { exhaustedProperties[key] = value; } }) },
  Utilities: { getUuid: () => "epoch-12345678" }, Number, Error
};
vm.runInNewContext(helper, exhaustedContext);
assert.throws(() => exhaustedContext.advance(), /SACE_SOURCE_REVISION_EXHAUSTED/, service + " rejects counter overflow");
}
const academic=fs.readFileSync(paths.Academic,"utf8"),user=fs.readFileSync(paths.User,"utf8"),exam=fs.readFileSync(paths.Exam,"utf8");
for(const name of ["configureSchoolYear","manageAcademicPeriod","closeAttendanceSession","saveClassAttendance","bulkApplyAttendanceStatus","saveDailyAttendance","createCanonicalAbsenceJustification_","reviewCanonicalAbsenceJustification_","reconcilePendingAttendanceJustifications","convertAdmissionToStudent","createStudentEnrollment","registerStudentEnrollment","changeStudentSection","recordStudentTransfer","recordStudentWithdrawal","processStudentGraduation","reconcileStudentLifecycleState"])assert(extract(academic,name).includes("advanceSaceAcademicSourceRevisionLocked_"),"Academic writer missing revision "+name);
for(const name of ["manageUserRoleMemberships","createPerson","linkPersonAccount","manageAccountState","registerUser"])assert(extract(user,name).includes("advanceSaceUserSourceRevisionLocked_"),"USER writer missing revision "+name);
for(const name of ["withAuthorizedGradebookSave_","withAuthorizedStudentRecoveryMutation_","withAuthorizedStudentGradeRectification_","withAuthorizedPeriodGradebookClosure_","withAuthorizedPeriodGradebookSubmission_","withAuthorizedPeriodGradebookReopen_"])assert(extract(exam,name).includes("advanceSaceExamSourceRevisionLocked_"),"Exam writer missing revision "+name);
assert(extract(academic,"getSaceAttendanceSnapshot").includes("SACE_SOURCE_CHANGED_DURING_SNAPSHOT"));
assert(extract(academic,"getSaceAttendanceSnapshot").includes("sourceRevisions:"), "Academic normal snapshot must return all captured source revisions");
assert(extract(user,"getSaceStudentIdentityDirectory_").includes("sourceRevision"), "USER normal identity response must return its source revision");
assert(extract(exam,"withAuthorizedExamRead_").includes("getSaceExamSourceRevisionLocked_"), "Exam reads capture revision inside the authorized ScriptLock");
assert(extract(exam,"getSaceGradebookSnapshots").includes("sourceRevision"), "Exam normal batch snapshot must return its source revision");
function assertRevisionPrecedesWrite(source,name,revisionFn){
 const body=extract(source,name), revision=body.indexOf(revisionFn);
 assert.notEqual(revision,-1,name+" has a revision guard");
 const calls=["appendRow(",".setValue(",".setValues(",".deleteRow(",".deleteRows(",".clearContent("].map(x=>body.indexOf(x)).filter(x=>x>=0);
 const internal=body.indexOf("registerStudentEnrollmentInternal_(");
 const firstWrite=calls.length?Math.min(...calls):internal;
 if(firstWrite>=0)assert.ok(revision<firstWrite,name+" advances its revision before the first mutation");
}
for(const name of ["configureSchoolYear","manageAcademicPeriod","closeAttendanceSession","saveClassAttendance","bulkApplyAttendanceStatus","saveDailyAttendance","createCanonicalAbsenceJustification_","reviewCanonicalAbsenceJustification_","reconcilePendingAttendanceJustifications","convertAdmissionToStudent","createStudentEnrollment","registerStudentEnrollment","changeStudentSection","recordStudentTransfer","recordStudentWithdrawal","processStudentGraduation","reconcileStudentLifecycleState"])assertRevisionPrecedesWrite(academic,name,"advanceSaceAcademicSourceRevisionLocked_");
for(const name of ["manageUserRoleMemberships","createPerson","linkPersonAccount","manageAccountState","registerUser"])assertRevisionPrecedesWrite(user,name,"advanceSaceUserSourceRevisionLocked_");
for(const name of ["withAuthorizedGradebookSave_","withAuthorizedStudentRecoveryMutation_","withAuthorizedStudentGradeRectification_","withAuthorizedPeriodGradebookClosure_","withAuthorizedPeriodGradebookSubmission_","withAuthorizedPeriodGradebookReopen_"]){
 const body=extract(exam,name);assert.ok(body.indexOf("advanceSaceExamSourceRevisionLocked_")<body.indexOf("return mutation(context)"),name+" increments before its mutation callback");
}

assert(extract(user,"getSaceStudentIdentityDirectory_").includes("revisionOnly"));
assert(extract(exam,"getSaceGradebookSnapshots").includes("revisionOnly"));
console.log("PASS: 3 revision helpers, monotonic counters, fail-closed persistence/corruption/overflow, snapshot revalidation, and 28 writer/endpoint contracts with pre-write ordering");
