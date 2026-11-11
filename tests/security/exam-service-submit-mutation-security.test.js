"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new Function(source);
function extractFunction(name) {
  const match = new RegExp("function\\s+" + name + "\\s*\\([^)]*\\)\\s*\\{").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "\`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unclosed function " + name);
}
function submitRuntime(options = {}) {
  const events = [], state = { lockAttempts: 0, releases: 0, workerCalls: 0 };
  const actor = options.actor === undefined ? { authorized: true, userId: "STUDENT-1", role: "Estudiante" } : options.actor;
  const handler = new Function("validateRolePermission", "getVerifiedExamIdentity_", "LockService", "submitExamUnlocked_",
    extractFunction("submitExam") + "; return submitExam;")(
    () => { events.push("permission"); return { authorized: options.permission !== false }; },
    () => { events.push("identity"); return actor; },
    { getScriptLock() { return { tryLock() { events.push("lock"); state.lockAttempts++; return !options.timeout; },
      releaseLock() { events.push("release"); state.releases++; } }; } },
    () => { events.push("worker"); state.workerCalls++; return { status: "success" }; });
  let result, error;
  try { result = handler({}); } catch (e) { error = e.message; }
  return { events, state, result, error };
}
const cases = [];
function test(name, fn) { try { fn(); cases.push({ name, result: "PASS" }); } catch (e) { cases.push({ name, result: "FAIL", error: e.message }); } }
test("RBAC denial precedes identity and lock", () => { const x=submitRuntime({permission:false}); assert.equal(x.error,"RESOURCE_NOT_AVAILABLE"); assert.deepEqual(x.events,["permission"]); assert.equal(x.state.lockAttempts,0); });
test("invalid signed identity is rejected before lock", () => { const x=submitRuntime({actor:{authorized:false,userId:"S1",role:"Estudiante"}}); assert.equal(x.error,"RESOURCE_NOT_AVAILABLE"); assert.deepEqual(x.events,["permission","identity"]); assert.equal(x.state.lockAttempts,0); });
test("empty signed userId is rejected before lock", () => { const x=submitRuntime({actor:{authorized:true,userId:" ",role:"Estudiante"}}); assert.equal(x.error,"RESOURCE_NOT_AVAILABLE"); assert.equal(x.state.lockAttempts,0); assert.equal(x.state.workerCalls,0); });
test("non-student role is rejected before lock", () => { const x=submitRuntime({actor:{authorized:true,userId:"T1",role:"Profesor"}}); assert.equal(x.error,"RESOURCE_NOT_AVAILABLE"); assert.equal(x.state.lockAttempts,0); });
test("valid student checks permission and identity before lock and releases it", () => { const x=submitRuntime(); assert.deepEqual(x.events,["permission","identity","lock","worker","release"]); assert.equal(x.result.status,"success"); assert.equal(x.state.releases,1); });
test("Alumno remains accepted", () => { const x=submitRuntime({actor:{authorized:true,userId:"A1",role:"Alumno"}}); assert.equal(x.error,undefined); assert.equal(x.state.workerCalls,1); });
test("lock timeout does not invoke worker", () => { const x=submitRuntime({timeout:true}); assert.equal(x.error,"EXAM_SUBMISSION_LOCK_TIMEOUT"); assert.equal(x.state.workerCalls,0); assert.equal(x.state.releases,0); });
test("shared exam context rejects invalid or incomplete identity before Sheets", () => {
 const context=new Function("getVerifiedExamIdentity_","SpreadsheetApp","SPREADSHEET_ID","getExamStudentProfile_","getVerifiedGuardianStudentIds_","getVerifiedExamDepartmentScope_",extractFunction("getExamReadContext_")+"; return getExamReadContext_;");
 let opens=0; const api={openById(){opens++;return {};}};
 for(const actor of [{authorized:false,userId:"S1",role:"Estudiante"},{authorized:true,userId:"",role:"Estudiante"},{authorized:true,userId:" ",role:"Estudiante"}]){
  const fn=context(()=>actor,api,"SHEET",()=>null,()=>[],()=>({authorized:true}));
  assert.throws(()=>fn({}),/RESOURCE_NOT_AVAILABLE/);
 } assert.equal(opens,0);
});
test("shared context accepts a complete student identity", () => {
 const actor={authorized:true,userId:"S1",role:"Estudiante"};
 const context=new Function("getVerifiedExamIdentity_","SpreadsheetApp","SPREADSHEET_ID","getExamStudentProfile_","getVerifiedGuardianStudentIds_","getVerifiedExamDepartmentScope_",extractFunction("getExamReadContext_")+"; return getExamReadContext_;");
 const result=context(()=>actor,{openById(){return {};}},"SHEET",()=>({userId:"S1",role:"Estudiante"}),()=>[],()=>({authorized:true}))({});
 assert.equal(result.actor.userId,"S1"); assert.equal(result.studentActor,true);
});
const failed=cases.filter(x=>x.result!=="PASS");
console.log(JSON.stringify({passed:cases.length-failed.length,total:cases.length,cases},null,2));
if(failed.length)process.exitCode=1;
