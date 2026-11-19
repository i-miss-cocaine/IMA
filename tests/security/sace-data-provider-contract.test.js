"use strict";
const assert = require("node:assert/strict");
const provider = require("../../js/sace-data-provider.js");
function gradebook(periodoId, options = {}) {
  const students = options.students || [
    { userId: "STU-1", nombreCompleto: "Ana Pérez" },
    { userId: "STU-2", nombreCompleto: "Luis Gómez" }
  ];
  return { status: "success", data: {
    alumnos: students,
    resumenes: options.summaries || {
      "STU-1": { status: "calculated", notaFinal: 91.25 },
      "STU-2": { status: "calculated", notaFinal: 84 }
    },
    recuperaciones: options.recuperaciones || [],
    estadoPeriodo: options.estadoPeriodo || "Cerrado",
    contexto: { anoId: "2026", periodoId, grado: "11", seccion: "A",
      asignatura: "Informática", institutionId: "INST-1" }
  }};
}
const expectedContext = { anoId: "2026", grado: "11", seccion: "A",
  asignatura: "Informática", asignaturaId: "INF-01", institutionId: "INST-1", teacherUserId: "PROF-1" };
const periods = {
  partial1Period: { periodoId: "PER-1", fechaInicio: "2026-02-01", fechaFin: "2026-04-30" },
  partial2Period: { periodoId: "PER-2", fechaInicio: "2026-05-01", fechaFin: "2026-07-31" }
};
const sessions = [
  { sesionId: "S-1", fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-1" },
  { sesionId: "S-2", fecha: "2026-05-03", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-1" },
  { sesionId: "S-OTHER", fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "MAT-01", docenteUserId: "PROF-1" },
  { sesionId: "S-OTHER-TEACHER", fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-2" },
  { sesionId: "S-OUTSIDE", fecha: "2026-08-01", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-1" }
];
const attendance = [
  { sesionId: "S-1", userId: "STU-1", estadoAsistencia: "Ausente", justificado: true },
  { sesionId: "S-1", userId: "STU-2", estadoAsistencia: "Presente" },
  { sesionId: "S-2", userId: "STU-1", estadoAsistencia: "Tardanza" },
  { sesionId: "S-2", userId: "STU-2", estadoAsistencia: "Falta" }
];
const identityRecords = [
  { userId: "STU-1", identity: "0801-2000-00001", documentMarker: "HND", name: "Ana Perez" },
  { userId: "STU-2", identity: "0801-2000-00002", documentMarker: "HND", name: "Luis Gomez" }
];
function build(overrides = {}) {
  return provider.buildCandidateStudents(Object.assign({
    expectedContext, ...periods,
    partial1Gradebook: gradebook("PER-1"), partial2Gradebook: gradebook("PER-2"),
    attendanceSessions: sessions, attendanceRecords: attendance, identityRecords
  }, overrides));
}
const result = build();
assert.equal(result.status, "candidate");
assert.deepEqual(result.sourceStudents.map(row => [
  row.userId, row.partial1Absences, row.partial1, row.partial2Absences, row.partial2, row.recovery
]), [
  ["STU-1", 1, 91.25, 0, 91.25, null],
  ["STU-2", 0, 84, 1, 84, null]
]);
assert.equal(result.attendance.partial1.sessions, 1);
assert.equal(result.attendance.partial2.sessions, 1);
assert.match(result.attendance.absencePolicy, /justified absences remain counted/);
assert.throws(() => build({ attendanceRecords: attendance.slice(1) }), /SACE_ATTENDANCE_RECORD_MISSING:partial1/);
assert.throws(() => build({ attendanceRecords: attendance.concat(attendance[0]) }), /SACE_ATTENDANCE_RECORD_DUPLICATE:partial1/);
assert.throws(() => build({ partial2Gradebook: gradebook("PER-2", { estadoPeriodo: "Abierto" }) }), /SACE_GRADEBOOK_PERIOD_NOT_CLOSED:partial2/);
assert.throws(() => build({ partial1Gradebook: gradebook("PER-1", {
  summaries: { "STU-1": { status: "provisional", notaFinal: null }, "STU-2": { status: "calculated", notaFinal: 84 } }
}) }), /SACE_GRADE_NOT_FINAL:partial1/);
assert.throws(() => build({ partial1Gradebook: gradebook("PER-1", {
  recuperaciones: [{ userId: "STU-1", notaFinalCalculada: 99 }]
}) }), /SACE_RECOVERY_MAPPING_UNVERIFIED:partial1/);
assert.throws(() => build({ identityRecords: identityRecords.slice(1) }), /SACE_IDENTITY_RECORD_MISSING/);
assert.throws(() => build({ attendanceSessions: sessions.concat(sessions[0]) }), /SACE_ATTENDANCE_SESSION_DUPLICATE/);
assert.throws(() => build({ identityRecords: identityRecords.concat(identityRecords[0]) }), /SACE_IDENTITY_RECORD_DUPLICATE/);
assert.throws(() => build({ partial2Period: { periodoId: "PER-1", fechaInicio: "2026-05-01", fechaFin: "2026-07-31" } }), /SACE_PERIODS_MUST_BE_DISTINCT/);
assert.throws(() => build({ expectedContext: Object.assign({}, expectedContext, { grado: "12" }) }), /SACE_GRADEBOOK_CONTEXT_MISMATCH:partial1:grado/);
assert.throws(() => build({ attendanceRecords: attendance.concat({
  sesionId: "S-1", userId: "STU-OUT", estadoAsistencia: "Presente"
}) }), /SACE_ATTENDANCE_STUDENT_OUTSIDE_ROSTER:partial1/);
assert.throws(() => build({ attendanceSessions: sessions.filter(row => row.sesionId !== "S-1") }), /SACE_ATTENDANCE_SESSIONS_EMPTY:partial1/);
process.stdout.write("sace-data-provider-contract: PASS (synthetic gradebooks, roster, attendance and identity records)\n");
