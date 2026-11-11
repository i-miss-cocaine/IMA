"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
function extractFunction(name) {
  const match = new RegExp("function " + name + "\\s*\\(").exec(source);
  assert.ok(match, "missing function " + name);
  const end = source.indexOf("\nfunction ", match.index + 10);
  return source.slice(match.index, end < 0 ? source.length : end);
}
function makeSheet(rows) {
  return { getDataRange() { return { getValues() { return rows.map(row => row.slice()); } }; } };
}
function runtime(options = {}) {
  const deliveries = [
    ["DEL-1","EXM-1","STU-1",new Date(),JSON.stringify([{preguntaId:"Q-1",respuestaEstudiante:"A"}]),95,"Calificado",""],
    ["DEL-P","EXM-1","STU-1",new Date(),JSON.stringify([{preguntaId:"Q-1",respuestaEstudiante:"A"}]),null,"Pendiente",""],
    ["DEL-2","EXM-1","STU-2",new Date(),JSON.stringify([{preguntaId:"Q-1",respuestaEstudiante:"B"}]),40,"Calificado",""]
  ];
  const deliverySheetRows = [["EntregaExamenID","ExamenID","UserID","Fecha","Respuestas","Nota","Estado","Comentario"], ...deliveries];
  const sheets = {
    EntregasExamen: makeSheet(deliverySheetRows),
    Examenes: makeSheet([["ExamenID","Titulo","Asignatura","Grado","Seccion","Fecha","Tiempo","Estado","ProfesorID"],["EXM-1","Examen de prueba","Ciencias","8","A","","","Activo","PROF-1"]]),
    PreguntasExamen: makeSheet([["PreguntaID","ExamenID","Tipo","Texto","OpcionesJSON","RespuestaCorrecta"],["Q-1","EXM-1","opcion_multiple","¿2+2?","{}","A"]])
  };
  let held = false, acquires = 0, releases = 0;
  const ss = { getSheetByName(name) { return sheets[name] || null; } };
  const context = {
    LockService: { getScriptLock() { return {
      tryLock() { acquires++; if (options.beforeAcquire) { const cb=options.beforeAcquire; options.beforeAcquire=null; cb(); }
        if (options.lockAvailable === false || held) return false; held=true; return true; },
      releaseLock() { releases++; held=false; }
    }; } },
    SpreadsheetApp: { openById() { return ss; } },
    SPREADSHEET_ID: "TEST",
    getSheetOrThrow(spreadsheet,name) { const sheet=spreadsheet.getSheetByName(name); if(!sheet) throw new Error("MISSING_SHEET"); return sheet; },
    validateRolePermission(action,payload) { return options.permission === false ? {authorized:false} : {authorized:true}; },
    getExamReadContext_(payload, studentId) {
      if (options.expectedStudentId) assert.equal(studentId, options.expectedStudentId);
      if (options.contextError) throw new Error("RESOURCE_NOT_AVAILABLE");
      return { actor: options.actor || {userId:"STU-1",role:"Estudiante",authorized:true},
        ss, studentActor: options.studentActor !== false, guardianActor: !!options.guardianActor,
        profile: {userId:options.profileUserId || "STU-1"}, scope: {authorized:true} };
    },
    assertExamResourceOwnershipForScope_() { return {authorized: options.ownership !== false}; },
    normalizeString(value) { return String(value || "").trim().toLowerCase(); }
  };
  const names=["getExamResult","withAuthorizedExamResultRead_","getAuthorizedExamResultReadContext_","getExamResultUnlocked_"];
  vm.runInNewContext(names.map(extractFunction).join("\n")+"\nthis.getExamResult=getExamResult;",context);
  return {context,deliveries,deliverySheetRows,sheets,stats:()=>({acquires,releases,held})};
}
const ok=runtime({expectedStudentId:"STU-1"});
const result=ok.context.getExamResult({entregaExamenId:"DEL-1",sessionToken:"student"});
assert.equal(result.data.calificacionTotal,95);
assert.equal(result.data.resultadosDetallados[0].respuestaCorrecta,"A");
assert.equal(result.data.resultadosDetallados[0].esCorrecta,true);
assert.deepEqual(ok.stats(),{acquires:1,releases:1,held:false},"read uses and releases shared script lock");
assert.throws(()=>runtime().context.getExamResult({entregaExamenId:"DEL-P"}),/RESOURCE_NOT_AVAILABLE/,"student cannot read ungraded answer key");
assert.throws(()=>runtime({profileUserId:"STU-2"}).context.getExamResult({entregaExamenId:"DEL-1"}),/RESOURCE_NOT_AVAILABLE/,"student cannot read another student's result");
assert.throws(()=>runtime({permission:false}).context.getExamResult({entregaExamenId:"DEL-1"}),/RESOURCE_NOT_AVAILABLE/,"explicit getExamResult permission is required");
assert.throws(()=>runtime({ownership:false}).context.getExamResult({entregaExamenId:"DEL-1"}),/RESOURCE_NOT_AVAILABLE/,"exam ownership and scope are required");
assert.throws(()=>runtime({lockAvailable:false}).context.getExamResult({entregaExamenId:"DEL-1"}),/EXAM_RESULT_READ_LOCK_TIMEOUT/,"lock timeout fails closed");
const raced=runtime({beforeAcquire(){raced.deliverySheetRows.splice(1,1);}});
assert.throws(()=>raced.context.getExamResult({entregaExamenId:"DEL-1"}),/RESOURCE_NOT_AVAILABLE/,"delivery deleted before lock acquisition is re-read and denied");
assert.deepEqual(raced.stats(),{acquires:1,releases:1,held:false},"lock is released when the locked re-read denies a deleted delivery");
const teacher=runtime({actor:{userId:"PROF-OTHER",role:"Profesor"},studentActor:false});
assert.throws(()=>teacher.context.getExamResult({entregaExamenId:"DEL-1"}),/RESOURCE_NOT_AVAILABLE/,"teacher cannot read another teacher's exam result");
process.stdout.write("exam-service-exam-result-security: PASS\\n");
