"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}

const periods = [
  { periodoId: "PER-1", parcial: "I Parcial" },
  { periodoId: "PER-2", parcial: "II Parcial" }
];
const studentIds = ["STU-1", "STU-2"];
const expectedContext = {
  anoId: "YEAR-2026", grado: "11", seccion: "A",
  asignatura: "Informática", institutionId: "INST-1"
};
function snapshot(periodoId, parcial, institutionId = "INST-1") {
  return { status: "success", data: {
    alumnos: studentIds.map(userId => ({ userId, nombreCompleto: userId + " Name" })),
    resumenes: Object.fromEntries(studentIds.map(userId => [userId, { userId, status: "calculated", notaFinal: 90, avancePonderado: 90, ponderacionPendiente: 0 }])),
    recuperaciones: [],
    estadoPeriodo: "Cerrado",
    contexto: Object.assign({}, expectedContext, { periodoId, parcial, institutionId })
  } };
}
const successResponse = {
  status: "success",
  sourceRevision: "EXAM-EPOCH-123456:0",
  data: { snapshots: [
    { periodoId: "PER-1", parcial: "I Parcial", snapshot: snapshot("PER-1", "I Parcial") },
    { periodoId: "PER-2", parcial: "II Parcial", snapshot: snapshot("PER-2", "II Parcial") }
  ] }
};
function createTransport(response = successResponse, status = 200) {
  const calls = [];
  const context = {
    getRequestSessionToken_(request) { return request.sessionToken; },
    PropertiesService: { getScriptProperties() {
      return { getProperty(name) {
        assert.equal(name, "IMA_EXAM_SERVICE_URL");
        return "https://script.google.com/macros/s/EXAM_SERVICE/exec";
      } };
    } },
    UrlFetchApp: { fetch(url, options) {
      calls.push({ url, options });
      return { getResponseCode() { return status; }, getContentText() { return JSON.stringify(response); } };
    } },
    String, Array, Object, Set, Map, Error, JSON
  };
  vm.createContext(context);
  vm.runInContext(extract("requestSaceGradebookSnapshotsFromExam_") +
    "\nthis.callTransport=requestSaceGradebookSnapshotsFromExam_;", context);
  return { context, calls };
}
const request = { sessionToken: "SESSION-TEACHER" };
const transport = createTransport();
const result = transport.context.callTransport(request, studentIds, "TEACHER-1", expectedContext, periods);
assert.deepEqual(JSON.parse(JSON.stringify(result.map(item => [item.periodoId, item.parcial, item.snapshot.status]))), [
  ["PER-1", "I Parcial", "success"], ["PER-2", "II Parcial", "success"]
]);
assert.equal(transport.calls.length, 1, "both periods must use one remote Exam-Service request");
assert.equal(transport.calls[0].url, "https://script.google.com/macros/s/EXAM_SERVICE/exec");
assert.equal(transport.calls[0].options.method, "post");
const envelope = JSON.parse(transport.calls[0].options.payload);
assert.equal(envelope.action, "getSaceGradebookSnapshots");
assert.equal(envelope.payload.sessionToken, "SESSION-TEACHER");
assert.deepEqual(envelope.payload.periods, periods);
assert.deepEqual(envelope.payload.studentIds, studentIds);
assert.equal(envelope.payload.profesorId, "TEACHER-1");
const extraSummary = JSON.parse(JSON.stringify(successResponse));
extraSummary.data.snapshots[0].snapshot.data.resumenes["STU-3"] = { userId: "STU-3", status: "calculated", notaFinal: 90 };
assert.throws(() => createTransport(extraSummary).context.callTransport(
  request, studentIds, "TEACHER-1", expectedContext, periods
), /SACE_GRADEBOOK_RESPONSE_SUMMARY_SCOPE_INVALID/);
const missingSummary = JSON.parse(JSON.stringify(successResponse));
delete missingSummary.data.snapshots[0].snapshot.data.resumenes["STU-2"];
assert.throws(() => createTransport(missingSummary).context.callTransport(
  request, studentIds, "TEACHER-1", expectedContext, periods
), /SACE_GRADEBOOK_RESPONSE_SUMMARY_SCOPE_INVALID/);
const invalidRecovery = JSON.parse(JSON.stringify(successResponse));
invalidRecovery.data.snapshots[0].snapshot.data.recuperaciones = [
  { recuperacionId: "REC-1", userId: "STU-3", evaluacionId: "CAT-1", notaFinalCalculada: 95 }
];
assert.throws(() => createTransport(invalidRecovery).context.callTransport(
  request, studentIds, "TEACHER-1", expectedContext, periods
), /SACE_GRADEBOOK_RESPONSE_RECOVERY_INVALID/);


const wrongInstitution = JSON.parse(JSON.stringify(successResponse));
wrongInstitution.data.snapshots[1].snapshot.data.contexto.institutionId = "INST-OTHER";
assert.throws(() => createTransport(wrongInstitution).context.callTransport(
  request, studentIds, "TEACHER-1", expectedContext, periods
), /SACE_GRADEBOOK_RESPONSE_CONTEXT_INVALID:institutionId/);
const missingPeriod = JSON.parse(JSON.stringify(successResponse));
missingPeriod.data.snapshots.pop();
assert.throws(() => createTransport(missingPeriod).context.callTransport(
  request, studentIds, "TEACHER-1", expectedContext, periods
), /SACE_GRADEBOOK_RESPONSE_INCOMPLETE/);
assert.throws(() => createTransport().context.callTransport(
  request, studentIds, "TEACHER-1", expectedContext, [
    periods[0], { periodoId: "PER-1", parcial: "II Parcial" }
  ]
), /SACE_GRADEBOOK_PERIOD_MAPPING_INVALID/);
assert.throws(() => createTransport({ status: "error", code: "EXAM_SERVICE_UNAVAILABLE" }, 503)
  .context.callTransport(request, studentIds, "TEACHER-1", expectedContext, periods),
  /EXAM_SERVICE_UNAVAILABLE/);
console.log("academic-sace-gradebook-batch-transport: PASS (single authenticated request, exact two-period mapping, context and roster validation)");
