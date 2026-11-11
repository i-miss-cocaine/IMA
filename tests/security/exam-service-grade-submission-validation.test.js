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
        delivery: { row: ["EEX-1", "EXM-1", "STU-1", new Date(), "{}", "0.00", "Pendiente"] , rowIndex: 1 },
        deliverySheet: { getRange(...args) { return { setValues(rows) { calls.writes.push({ args, rows }); } }; } }
      });
    },
    Number, Math, Error
  };
  vm.runInNewContext(extract("gradeExamSubmission"), runtime);
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
console.log("exam-service-grade-submission-validation: " + scenarios + "/" + scenarios + " PASS");
