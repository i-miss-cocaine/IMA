"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
function fixture(options = {}) {
  const calls = { writes: [], wrapper: 0, payload: null, action: null };
  const runtime = {
    withAuthorizedExamSubmissionMutation_(payload, action, callback) {
      calls.wrapper++; calls.payload = payload; calls.action = action;
      if (options.denied) throw new Error("RESOURCE_NOT_AVAILABLE");
      return callback({
        delivery: { row: ["EEX-1", "EXM-1", "STU-1", new Date(), "{}", "", "Pendiente"] , rowIndex: 1 },
        deliverySheet: {
          getDataRange() { return { getValues() { return [["EntregaExamenID","ExamenID","UserID","FechaEntrega","RespuestasJSON","NotaTotal","Estado","ComentarioDocente","TemaAsociado","AsignaturaAsociada"]]; } }; },
          getRange(...args) { return { setValues(rows) { calls.writes.push({ args, rows }); } }; }
        }
      });
    },
    Number, Math, Error,
    prepareExamGradeRectificationEvent_() { return null; },
    appendExamGradeRectificationEvent_() { throw new Error("Unexpected rectification append in first-grade validation fixture"); }
  };
  const historyHeader = source.match(/var EXAM_GRADE_RECTIFICATION_HEADERS_ = \[[^\]]+\];/);
  assert.ok(historyHeader, "grade history schema is declared");
  const gradeCode = [historyHeader[0], extract("normalizeExamGradeHistoryValue_"),
    extract("getOrCreateExamGradeRectificationHistorySheet_"), extract("prepareExamGradeRectificationEvent_"),
    extract("appendExamGradeRectificationEvent_"), extract("gradeExamSubmission")].join("\n");
  vm.runInNewContext(gradeCode, runtime);
  return { calls, call(payload) { return runtime.gradeExamSubmission(payload); } };
}
let scenarios = 0;
function test(fn) { fn(); scenarios++; }
test(() => {
  const x = fixture(), result = x.call({ calificacion: "98.5", estado: "Calificado", comentario: "Bien", temaAsociado: "Álgebra", asignaturaAsociada: "Matemáticas" });
  assert.equal(result.status, "success");
  assert.equal(x.calls.action, "gradeExamSubmission");
  assert.equal(x.calls.writes.length, 1);
  assert.equal(x.calls.writes[0].rows[0][5], "98.50");
  assert.equal(x.calls.writes[0].rows[0][6], "Calificado");
  assert.equal(x.calls.writes[0].rows[0][8], "Álgebra");
});
test(() => {
  const x = fixture(); x.call({ calificacion: 0, estado: "Calificado" });
  assert.equal(x.calls.writes[0].rows[0][5], "0.00");
});
test(() => {
  const x = fixture(); x.call({ calificacion: 100, estado: "Calificado" });
  assert.equal(x.calls.writes[0].rows[0][5], "100.00");
});
test(() => {
  const x = fixture(); x.call({ calificacion: 0.1 + 0.2, estado: "Calificado" });
  assert.equal(x.calls.writes[0].rows[0][5], "0.30");
});
for (const score of [-0.01, 100.01, NaN, Infinity, "abc", "", null, undefined, "10.123"]) {
  test(() => {
    const x = fixture();
    assert.throws(() => x.call({ calificacion: score, estado: "Calificado" }), /EXAM_GRADE_INVALID/);
    assert.equal(x.calls.writes.length, 0);
  });
}
test(() => {
  const x = fixture();
  assert.throws(() => x.call({ calificacion: 90 }), /EXAM_GRADE_METADATA_INVALID/);
  assert.equal(x.calls.writes.length, 0);
});
test(() => {
  const x = fixture();
  assert.throws(() => x.call({ calificacion: 90, estado: "Calificado", comentario: 7 }), /EXAM_GRADE_METADATA_INVALID/);
  assert.equal(x.calls.writes.length, 0);
});
test(() => {
  const x = fixture();
  assert.throws(() => x.call({ calificacion: 90, estado: "Calificado", comentario: "x".repeat(2001) }), /EXAM_GRADE_METADATA_INVALID/);
  assert.equal(x.calls.writes.length, 0);
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call({ calificacion: 90, estado: "Calificado" }), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.calls.writes.length, 0);
});


test(() => {
  const examContext = extract("getAuthorizedExamMutationContext_");
  const deliveryContext = extract("getAuthorizedExamSubmissionMutationContext_");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  const handler = extract("gradeExamSubmission");
  const state = {
    permissionCalls: 0, identityCalls: 0, opens: 0, deliveryReads: 0,
    examReads: 0, lockAttempts: 0, releases: 0, held: false,
    writes: 0, nestedErrors: [], events: []
  };
  const payload = {
    entregaId: "EEX-1", examenId: "EXM-1", calificacion: 94.5,
    estado: "Calificado", comentario: "Correcto"
  };
  let grade;
  const actor = { authorized: true, userId: "TEACHER-1", role: "Profesor" };
  const deliveryRows = [
    ["EntregaID","ExamenID","EstudianteID","Fecha","Respuestas","Calificacion","Estado"],
    ["EEX-1","EXM-1","STU-1",new Date(),"[]","","Pendiente"]
  ];
  const examRows = [
    ["ID","Titulo","Asignatura","Grado","Seccion","FechaLimite","Tiempo","Estado","ProfesorID"],
    ["EXM-1","Evaluación","Matemáticas","10","A","","","Activo","TEACHER-1"]
  ];
  const deliverySheet = {
    getDataRange() { state.deliveryReads++; state.events.push("delivery-read"); return { getValues() { return deliveryRows; } }; },
    getRange() { return { setValues(rows) {
      state.writes++; state.events.push("delivery-write");
      try { grade(payload); } catch (error) { state.nestedErrors.push(error.message); }
      deliveryRows[1] = rows[0].slice();
    } }; }
  };
  const examSheet = {
    getDataRange() { state.examReads++; state.events.push("exam-read"); return { getValues() { return examRows; } }; }
  };
  const ss = {
    getSheetByName(name) {
      state.events.push("sheet:" + name);
      return name === "EntregasExamen" ? deliverySheet : name === "Examenes" ? examSheet : null;
    }
  };
  const runtime = {
    validateRolePermission() { state.permissionCalls++; return { authorized: true }; },
    getVerifiedExamIdentity_() { state.identityCalls++; return actor; },
    LockService: { getScriptLock() { return {
      tryLock() { state.lockAttempts++; state.events.push("lock:" + state.lockAttempts); if (state.held) return false; state.held = true; return true; },
      releaseLock() { state.releases++; state.held = false; state.events.push("release"); }
    }; } },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    SPREADSHEET_ID: "SYNTHETIC-SHEET",
    prepareExamGradeRectificationEvent_() { return null; },
    getSheetOrThrow(sheet, name) { const value = sheet.getSheetByName(name); if (!value) throw new Error("missing " + name); return value; },
    getVerifiedExamDepartmentScope_() { return { authorized: true, institutionId: "INST-1", departmentIds: ["DEP-1"] }; },
    assertExamResourceOwnershipForScope_() { return { authorized: true }; },
    Number, Math, Error, String, Date
  };
  const executable = [examContext, deliveryContext, wrapper, handler].join("\n");
  grade = new Function("runtime", "with (runtime) { " + executable + "; return gradeExamSubmission; }")(runtime);
  const result = grade(payload);
  assert.equal(result.status, "success");
  assert.deepEqual(state.nestedErrors, ["EXAM_SUBMISSION_LOCK_TIMEOUT"]);
  assert.equal(state.permissionCalls, 4, "outer preflight/context checks and nested preflight must be enforced");
  assert.equal(state.identityCalls, 4, "nested identity must be verified before lock contention");
  assert.equal(state.lockAttempts, 2, "nested call must attempt the shared lock and time out");
  assert.equal(state.releases, 1);
  assert.equal(state.held, false);
  assert.equal(state.opens, 2, "outer delivery and exam contexts each open Sheets once; nested call must not open it");
  assert.equal(state.deliveryReads, 1);
  assert.equal(state.examReads, 1);
  assert.equal(state.writes, 1, "only the outer grade may write");
  assert.equal(deliveryRows.length, 2);
  assert.equal(deliveryRows[1][0], "EEX-1");
  assert.equal(deliveryRows[1][1], "EXM-1");
  assert.equal(deliveryRows[1][5], "94.50");
  assert.equal(deliveryRows[1][6], "Calificado");
  assert.equal(state.events[state.events.length - 1], "release");
}, "grade mutation reentry");

console.log("exam-service-grade-submission-validation: " + scenarios + "/" + scenarios + " PASS");
