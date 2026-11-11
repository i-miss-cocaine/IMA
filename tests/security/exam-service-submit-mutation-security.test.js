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
  const events = [], state = { lockAttempts: 0, releases: 0, workerCalls: 0, permissionCalls: 0, identityCalls: 0 };
  const actor = options.actor === undefined ? { authorized: true, userId: "STUDENT-1", role: "Estudiante" } : options.actor;
  const actors = options.actors || [actor, options.actorAfterLock === undefined ? actor : options.actorAfterLock];
  const permissions = options.permissions || [options.permission !== false, options.permissionAfterLock !== false];
  const handler = new Function("validateRolePermission", "getVerifiedExamIdentity_", "LockService", "submitExamUnlocked_",
    extractFunction("submitExam") + "; return submitExam;")(
    () => { events.push("permission"); const result=permissions[state.permissionCalls++]; return { authorized: result === true }; },
    () => { events.push("identity"); return actors[state.identityCalls++]; },
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
test("RBAC revoked while waiting for lock is rejected without invoking worker", () => { const x=submitRuntime({permissions:[true,false]}); assert.equal(x.error,"RESOURCE_NOT_AVAILABLE"); assert.deepEqual(x.events,["permission","identity","lock","permission","release"]); assert.equal(x.state.workerCalls,0); assert.equal(x.state.releases,1); });
test("identity degraded under lock is rejected without invoking worker", () => { const x=submitRuntime({actorAfterLock:{authorized:true,userId:" ",role:"Estudiante"}}); assert.equal(x.error,"RESOURCE_NOT_AVAILABLE"); assert.deepEqual(x.events,["permission","identity","lock","permission","identity","release"]); assert.equal(x.state.workerCalls,0); assert.equal(x.state.releases,1); });
test("valid student rechecks permission and identity under lock", () => { const x=submitRuntime(); assert.deepEqual(x.events,["permission","identity","lock","permission","identity","worker","release"]); assert.equal(x.result.status,"success"); assert.equal(x.state.releases,1); assert.equal(x.state.permissionCalls,2); assert.equal(x.state.identityCalls,2); });
test("Alumno remains accepted", () => { const x=submitRuntime({actor:{authorized:true,userId:"A1",role:"Alumno"}}); assert.equal(x.error,undefined); assert.equal(x.state.workerCalls,1); });
test("lock timeout does not invoke worker or revalidate", () => { const x=submitRuntime({timeout:true}); assert.equal(x.error,"EXAM_SUBMISSION_LOCK_TIMEOUT"); assert.equal(x.state.workerCalls,0); assert.equal(x.state.releases,0); assert.equal(x.state.permissionCalls,1); });
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
test("reentrant submission during appendRow is rejected while the outer ScriptLock is held", () => {
  const submit = extractFunction("submitExam");
  const worker = extractFunction("submitExamUnlocked_");
  const state = { permissions: 0, identities: 0, opens: 0, locks: 0, releases: 0, held: false, writes: 0, nestedErrors: [] };
  const actor = { authorized: true, userId: "STUDENT-1", role: "Estudiante" };
  const examRows = [["ID","Titulo","Asignatura","Grado","Seccion","FechaLimite","Tiempo","Estado","ProfesorID","","","","Intentos"], ["EXAM-1","Evaluación","Matemáticas","10","A","","","Activo","TEACHER-1","","","",2]];
  const questionRows = [["PreguntaID","ExamenID","Tipo","Texto","Opciones","RespuestaCorrecta"], ["Q1","EXAM-1","opcion_multiple","2+2","{}","4"]];
  const deliveryRows = [["EntregaID","ExamenID","EstudianteID","Fecha","Respuestas","Calificacion","Estado"]];
  let handler;
  function nested() { try { handler({ examenId: "EXAM-1", respuestas: [{ preguntaId: "Q1", respuestaEstudiante: "4" }] }); } catch (error) { state.nestedErrors.push(error.message); } }
  const deliveries = { getDataRange() { return { getValues() { return deliveryRows; } }; }, appendRow(row) { state.writes++; deliveryRows.push(row); nested(); } };
  const examSheet = { getDataRange() { return { getValues() { return examRows; } }; } };
  const questionSheet = { getDataRange() { return { getValues() { return questionRows; } }; } };
  const ss = { getSheetByName(name) { return ({ Examenes: examSheet, PreguntasExamen: questionSheet, EntregasExamen: deliveries })[name] || null; } };
  const lock = { tryLock() { state.locks++; if (state.held) return false; state.held = true; return true; }, releaseLock() { state.releases++; state.held = false; } };
  const runtime = {
    validateRolePermission() { state.permissions++; return { authorized: true }; },
    getVerifiedExamIdentity_() { state.identities++; return actor; },
    LockService: { getScriptLock() { return lock; } },
    getExamReadContext_() { state.opens++; return { actor, ss, studentActor: true, profile: {}, scope: {} }; },
    getSheetOrThrow(sheet, name) { const value = sheet.getSheetByName(name); if (!value) throw new Error("missing " + name); return value; },
    isExamAssignedToStudent_() { return true; },
    assertExamResourceOwnershipForScope_() { return { authorized: true }; },
    normalizeString(value) { return String(value || "").trim().toLowerCase(); },
    Date, JSON, String, Set, Array, parseInt, Error
  };
  handler = new Function("runtime", "with (runtime) { " + submit + "\n" + worker + "; return submitExam; }")(runtime);
  const result = handler({ examenId: "EXAM-1", respuestas: [{ preguntaId: "Q1", respuestaEstudiante: "4" }] });
  assert.equal(result.status, "success");
  assert.deepEqual(state.nestedErrors, ["EXAM_SUBMISSION_LOCK_TIMEOUT"]);
  assert.equal(state.permissions, 3); assert.equal(state.identities, 3);
  assert.equal(state.locks, 2); assert.equal(state.releases, 1); assert.equal(state.held, false);
  assert.equal(state.opens, 1); assert.equal(state.writes, 1); assert.equal(deliveryRows.length, 2);
});
const failed=cases.filter(x=>x.result!=="PASS");
console.log(JSON.stringify({passed:cases.length-failed.length,total:cases.length,cases},null,2));
if(failed.length)process.exitCode=1;
