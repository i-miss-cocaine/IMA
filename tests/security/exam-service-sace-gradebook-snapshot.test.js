"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/exam-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}

const safeErrorContext = {};
vm.createContext(safeErrorContext);
vm.runInContext(extract("getSaceSafeErrorCode_") + "\nthis.safeErrorCode=getSaceSafeErrorCode_;", safeErrorContext);
assert.equal(safeErrorContext.safeErrorCode(new Error("SACE_GRADEBOOK_ROSTER_DUPLICATE")), "SACE_GRADEBOOK_ROSTER_DUPLICATE");
assert.equal(safeErrorContext.safeErrorCode(new Error("student STU-1 private detail")), "INTERNAL_ERROR");
assert(extract("doPost").includes("getSaceSafeErrorCode_(err)"),
  "SACE gradebook errors must retain safe machine-readable codes");

const basePayload = {
  sessionToken: "SESSION-TEACHER",
  profesorId: "TEACHER-1",
  anoId: "YEAR-2026",
  periodoId: "PER-2026-1",
  parcial: "I Parcial",
  grado: "11",
  seccion: "A",
  asignatura: "Informática",
  studentIds: ["STU-1", "STU-2"]
};
const fixture = {
  status: "success",
  data: {
    alumnos: [
      { userId: "STU-1", nombreCompleto: "Ana Pérez", email: "private-ana@example.test" },
      { userId: "STU-2", nombreCompleto: "Luis Gómez", email: "private-luis@example.test" },
      { userId: "STU-3", nombreCompleto: "Fuera del roster", email: "private-other@example.test" }
    ],
    resumenes: {
      "STU-1": { userId: "STU-1", status: "calculated", notaFinal: 91.25, avancePonderado: 91.25, ponderacionPendiente: 0, privateField: "must-not-leak" },
      "STU-2": { userId: "STU-2", status: "pending", notaFinal: null, avancePonderado: null, ponderacionPendiente: 100 },
      "STU-3": { userId: "STU-3", status: "calculated", notaFinal: 100 }
    },
    recuperaciones: [
      { recuperacionId: "REC-1", userId: "STU-1", evaluacionId: "CAT-1", notaFinalCalculada: 95, privateField: "x" },
      { userId: "STU-3", evaluacionId: "CAT-2", notaFinalCalculada: 99 }
    ],
    estadoPeriodo: "Cerrado",
    contexto: {
      anoId: "YEAR-2026", periodoId: "I Parcial", grado: "11",
      seccion: "A", asignatura: "Informática", institutionId: "INST-1"
    }
  }
};

function createContext(snapshot = fixture, closureRows = [
  ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "Estado"],
  ["CLOSE-1", "YEAR-2026", "I Parcial", "11", "A", "Informática", "Cerrado"],
  ["CLOSE-2", "YEAR-2026", "II Parcial", "11", "A", "Informática", "Cerrado"]
], secondSnapshot = null) {
  const calls = { authorization: 0, worker: 0, lockActive: false };
  const second = secondSnapshot || snapshot;
  const context = {
    withAuthorizedExamRead_(action, payload, reader) {
      calls.authorization++;
      assert.ok(["getSaceGradebookSnapshot", "getSaceGradebookSnapshots"].includes(action));
      assert.equal(payload.sessionToken, "SESSION-TEACHER");
      calls.lockActive = true;
      try {
        return reader({ sourceRevision: "EXAM-EPOCH-123456:0", actor: { userId: "TEACHER-1", role: "Profesor" },
          scope: { authorized: true, institutionId: "INST-1" },
          ss: { getSheetByName(name) {
            return name === "CierresPeriodos" ? {
              getDataRange() { return { getValues() { return closureRows.map(row => row.slice()); } }; }
            } : null;
          } }
        });
      } finally { calls.lockActive = false; }
    },
    getGradebookDataUnlocked_(payload, authorizedContext) {
      calls.worker++;
      assert.equal(calls.lockActive, true, "all period reads must remain inside one authorized read lock");
      assert.equal(authorizedContext.actor.userId, "TEACHER-1");
      assert.equal(payload.profesorId, "TEACHER-1");
      return String(payload.parcial) === "II Parcial" ? second : snapshot;
    },
    String, Number, Array, Object, Map, Set, Error
  };
  vm.createContext(context);
  vm.runInContext(extract("buildSaceGradebookSnapshotUnlocked_") +
    "\n" + extract("getSaceGradebookSnapshot") + "\n" + extract("getSaceGradebookSnapshots") +
    "\nthis.runSnapshot=getSaceGradebookSnapshot; this.runSnapshots=getSaceGradebookSnapshots;", context);
  return { context, calls };
}

const { context, calls } = createContext();
const result = context.runSnapshot(basePayload);
assert.equal(result.status, "success");
assert.equal(calls.authorization, 1, "the existing authenticated, serialized read boundary must be reused");
assert.equal(calls.worker, 1, "the existing contextual gradebook reader must be reused");
assert.deepEqual(JSON.parse(JSON.stringify(result.data.alumnos)), [
  { userId: "STU-1", nombreCompleto: "Ana Pérez", grado: "11", seccion: "A" },
  { userId: "STU-2", nombreCompleto: "Luis Gómez", grado: "11", seccion: "A" }
]);
assert.deepEqual(JSON.parse(JSON.stringify(result.data.resumenes)), {
  "STU-1": { userId: "STU-1", status: "calculated", notaFinal: 91.25, avancePonderado: 91.25, ponderacionPendiente: 0 },
  "STU-2": { userId: "STU-2", status: "pending", notaFinal: null, avancePonderado: null, ponderacionPendiente: 100 }
});
assert.deepEqual(JSON.parse(JSON.stringify(result.data.recuperaciones)), [
  { recuperacionId: "REC-1", userId: "STU-1", evaluacionId: "CAT-1", notaFinalCalculada: 95 }
]);
assert.equal(result.data.recuperaciones[0].recuperacionId, "REC-1",
  "the stable recovery identifier must survive the minimal interservice DTO for duplicate detection");
assert.equal(result.data.contexto.periodoId, "PER-2026-1", "academic PeriodoID must be returned separately from the explicit Exam-Service parcial label");
assert.equal(result.data.contexto.parcial, "I Parcial");
assert.equal(result.data.estadoPeriodo, "Cerrado");
assert.equal(JSON.stringify(result).includes("private-ana"), false, "student email must not leave Exam-Service");
assert.equal(JSON.stringify(result).includes("must-not-leak"), false, "unapproved gradebook fields must not leave Exam-Service");
const extraSummary = createContext().context.runSnapshot(basePayload);
assert.equal(Object.prototype.hasOwnProperty.call(extraSummary.data.resumenes, "STU-3"), false,
  "summary records outside the requested subset must not be exposed");
const invalidSummary = JSON.parse(JSON.stringify(fixture));
invalidSummary.data.resumenes["STU-1"].notaFinal = 101;
assert.throws(() => createContext(invalidSummary).context.runSnapshot(basePayload), /SACE_GRADEBOOK_SUMMARY_GRADE_INVALID/);
const unknownSummaryStatus = JSON.parse(JSON.stringify(fixture));
unknownSummaryStatus.data.resumenes["STU-1"].status = "unverified";
assert.throws(() => createContext(unknownSummaryStatus).context.runSnapshot(basePayload), /SACE_GRADEBOOK_SUMMARY_STATUS_INVALID/);
const missingRecoveryId = JSON.parse(JSON.stringify(fixture));
delete missingRecoveryId.data.recuperaciones[0].recuperacionId;
assert.throws(() => createContext(missingRecoveryId).context.runSnapshot(basePayload), /SACE_GRADEBOOK_RECOVERY_ID_REQUIRED/);
const duplicateRecoveryId = JSON.parse(JSON.stringify(fixture));
duplicateRecoveryId.data.recuperaciones.push(Object.assign({}, duplicateRecoveryId.data.recuperaciones[0], { evaluacionId: "CAT-2" }));
assert.throws(() => createContext(duplicateRecoveryId).context.runSnapshot(basePayload), /SACE_GRADEBOOK_RECOVERY_DUPLICATE/);
const invalidRecoveryGrade = JSON.parse(JSON.stringify(fixture));
invalidRecoveryGrade.data.recuperaciones[0].notaFinalCalculada = 120;
assert.throws(() => createContext(invalidRecoveryGrade).context.runSnapshot(basePayload), /SACE_GRADEBOOK_RECOVERY_GRADE_INVALID/);


assert.throws(() => createContext(fixture).context.runSnapshot(Object.assign({}, basePayload, {
  studentIds: ["STU-1", "STU-1"]
})), /SACE_GRADEBOOK_ROSTER_DUPLICATE/);
assert.throws(() => createContext(fixture).context.runSnapshot(Object.assign({}, basePayload, {
  studentIds: ["STU-UNKNOWN"]
})), /SACE_GRADEBOOK_STUDENT_OUTSIDE_CLASS/);
const openPeriod = JSON.parse(JSON.stringify(fixture)); openPeriod.data.estadoPeriodo = "Abierto";
assert.throws(() => createContext(openPeriod).context.runSnapshot(basePayload), /SACE_GRADEBOOK_PERIOD_NOT_CLOSED/);
const wrongInstitution = JSON.parse(JSON.stringify(fixture)); wrongInstitution.data.contexto.institutionId = "INST-OTHER";
assert.throws(() => createContext(wrongInstitution).context.runSnapshot(basePayload), /SACE_GRADEBOOK_CONTEXT_MISMATCH:institutionId/);
const wrongPeriod = JSON.parse(JSON.stringify(fixture)); wrongPeriod.data.contexto.periodoId = "PER-OTHER";
assert.throws(() => createContext(wrongPeriod).context.runSnapshot(basePayload), /SACE_GRADEBOOK_PERIOD_MAPPING_MISMATCH/);
const missingSummary = JSON.parse(JSON.stringify(fixture)); delete missingSummary.data.resumenes["STU-2"];
assert.throws(() => createContext(missingSummary).context.runSnapshot(basePayload), /SACE_GRADEBOOK_SUMMARY_MISSING/);
const wrongYearClosure = [
  ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "Estado"],
  ["CLOSE-OLD", "YEAR-2025", "I Parcial", "11", "A", "Informática", "Cerrado"]
];
assert.throws(() => createContext(fixture, wrongYearClosure).context.runSnapshot(basePayload), /SACE_GRADEBOOK_PERIOD_NOT_CLOSED/);
const duplicateClosures = [
  ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "Estado"],
  ["CLOSE-1", "YEAR-2026", "I Parcial", "11", "A", "Informática", "Cerrado"],
  ["CLOSE-2", "YEAR-2026", "I Parcial", "11", "A", "Informática", "Cerrado"]
];
assert.throws(() => createContext(fixture, duplicateClosures).context.runSnapshot(basePayload), /SACE_GRADEBOOK_CLOSURE_AMBIGUOUS/);
const duplicateRoster = JSON.parse(JSON.stringify(fixture)); duplicateRoster.data.alumnos.push(duplicateRoster.data.alumnos[0]);
assert.throws(() => createContext(duplicateRoster).context.runSnapshot(basePayload), /SACE_GRADEBOOK_ROSTER_AMBIGUOUS/);

const permissions = source.slice(source.indexOf("const ROLE_PERMISSIONS"), source.indexOf("// [TAREA-F4-P0-01]"));
const professor = /"Profesor": \[([\s\S]*?)\n  \],/.exec(permissions);
assert(professor && professor[1].includes('"getSaceGradebookSnapshot"') && professor[1].includes('"getSaceGradebookSnapshots"'),
  "only the existing teacher role permission list should grant the new snapshot action");
assert(extract("doPost").includes('case "getSaceGradebookSnapshot": result = getSaceGradebookSnapshot(payload); break;'));
assert(extract("doPost").includes('case "getSaceGradebookSnapshots": result = getSaceGradebookSnapshots(payload); break;'));
const handler = extract("getSaceGradebookSnapshot");
const batchHandler = extract("getSaceGradebookSnapshots");
assert(batchHandler.includes('withAuthorizedExamRead_("getSaceGradebookSnapshots"'));
assert(batchHandler.includes("buildSaceGradebookSnapshotUnlocked_"));
assert(handler.includes('withAuthorizedExamRead_("getSaceGradebookSnapshot"'));
assert(extract("buildSaceGradebookSnapshotUnlocked_").includes("getGradebookDataUnlocked_(snapshotRequest, context)"));

const revisionOnlyContext = createContext();
const revisionOnlyResult = revisionOnlyContext.context.runSnapshots({ sessionToken: "SESSION-TEACHER", revisionOnly: true });
assert.equal(revisionOnlyResult.status, "success");
assert.equal(revisionOnlyResult.sourceRevision, "EXAM-EPOCH-123456:0");
assert.equal(Object.prototype.hasOwnProperty.call(revisionOnlyResult, "data"), false,
  "revisionOnly returns only the Exam source revision");
assert.equal(revisionOnlyContext.calls.authorization, 1, "revisionOnly still uses the authorized read boundary");
assert.equal(revisionOnlyContext.calls.worker, 0, "revisionOnly does not scan gradebooks");

const secondFixture = JSON.parse(JSON.stringify(fixture));
secondFixture.data.contexto.periodoId = "II Parcial";
const batchContext = createContext(fixture, undefined, secondFixture);
const batchResult = batchContext.context.runSnapshots(Object.assign({}, basePayload, {
  periods: [
    { periodoId: "PER-2026-1", parcial: "I Parcial" },
    { periodoId: "PER-2026-2", parcial: "II Parcial" }
  ]
}));
assert.equal(batchResult.status, "success");
assert.equal(batchContext.calls.authorization, 1, "both period reads must share one authorization/lock boundary");
assert.equal(batchContext.calls.worker, 2, "the batch reads both gradebooks inside the same lock");
assert.deepEqual(JSON.parse(JSON.stringify(batchResult.data.snapshots.map(item => [
  item.periodoId, item.parcial, item.snapshot.data.contexto.periodoId
]))), [
  ["PER-2026-1", "I Parcial", "PER-2026-1"],
  ["PER-2026-2", "II Parcial", "PER-2026-2"]
]);
assert.throws(() => createContext().context.runSnapshots(Object.assign({}, basePayload, {
  periods: [
    { periodoId: "PER-2026-1", parcial: "I Parcial" },
    { periodoId: "PER-2026-1", parcial: "II Parcial" }
  ]
})), /SACE_GRADEBOOK_PERIOD_MAPPING_DUPLICATE/);
const secondWrongInstitution = JSON.parse(JSON.stringify(secondFixture));
secondWrongInstitution.data.contexto.institutionId = "INST-OTHER";
assert.throws(() => createContext(fixture, undefined, secondWrongInstitution).context.runSnapshots(Object.assign({}, basePayload, {
  periods: [
    { periodoId: "PER-2026-1", parcial: "I Parcial" },
    { periodoId: "PER-2026-2", parcial: "II Parcial" }
  ]
})), /SACE_GRADEBOOK_CONTEXT_MISMATCH:institutionId/);

console.log("exam-service-sace-gradebook-snapshot: PASS (teacher RBAC boundary, contextual gradebook, closed period, explicit period mapping, roster subset and minimal DTO)");
