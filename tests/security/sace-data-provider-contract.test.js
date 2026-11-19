"use strict";
const assert = require("node:assert/strict");
const provider = require("../../js/sace-data-provider.js");
const templateTools = require("../../js/sace-template.js");
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
  partial1Period: { periodoId: "PER-1", anoId: "2026", fechaInicio: "2026-02-01", fechaFin: "2026-04-30" },
  partial2Period: { periodoId: "PER-2", anoId: "2026", fechaInicio: "2026-05-01", fechaFin: "2026-07-31" }
};
const sessions = [
  { sesionId: "S-1", fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-1", estado: "Cerrada", fechaCierre: "2026-02-03T08:00:00.000Z" },
  { sesionId: "S-2", fecha: "2026-05-03", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-1", estado: "Finalizada", fechaCierre: "2026-05-03T08:00:00.000Z" },
  { sesionId: "S-OTHER", fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "MAT-01", docenteUserId: "PROF-1", estado: "Cerrada", fechaCierre: "2026-02-03T08:00:00.000Z" },
  { sesionId: "S-OTHER-TEACHER", fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-2", estado: "Cerrada", fechaCierre: "2026-02-03T08:00:00.000Z" },
  { sesionId: "S-OUTSIDE", fecha: "2026-08-01", grado: "11", seccion: "A", asignaturaId: "INF-01", docenteUserId: "PROF-1", estado: "Cerrada", fechaCierre: "2026-08-01T08:00:00.000Z" }
];
const attendance = [
  { sesionId: "S-1", userId: "STU-1", estadoAsistencia: "Ausente", justificado: true, justificacionVerificada: true },
  { sesionId: "S-1", userId: "STU-2", estadoAsistencia: "Presente", justificado: false, justificacionVerificada: true },
  { sesionId: "S-2", userId: "STU-1", estadoAsistencia: "Tardanza", justificado: false, justificacionVerificada: true },
  { sesionId: "S-2", userId: "STU-2", estadoAsistencia: "Falta", justificado: true, justificacionVerificada: true }
];
const identityRecords = [
  { userId: "STU-1", identity: "0801-2000-00001", documentType: "DNI", documentMarker: "HND", name: "Ana Perez" },
  { userId: "STU-2", identity: "0801-2000-00002", documentType: "DNI", documentMarker: "HND", name: "Luis Gomez" }
];
function build(overrides = {}) {
  return provider.buildCandidateStudents(Object.assign({
    expectedContext, ...periods,
    partial1Gradebook: gradebook("PER-1"), partial2Gradebook: gradebook("PER-2"),
    attendanceSessions: sessions, attendanceRecords: attendance, identityRecords,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }
  }, overrides));
}
const result = build();
assert.equal(result.status, "candidate");
const attendancePasses = { sessions: 0, records: 0 };
const countedSessions = sessions.slice();
countedSessions.forEach = function(callback, thisArg) {
  attendancePasses.sessions++;
  return Array.prototype.forEach.call(this, callback, thisArg);
};
const countedRecords = attendance.slice();
countedRecords.forEach = function(callback, thisArg) {
  attendancePasses.records++;
  return Array.prototype.forEach.call(this, callback, thisArg);
};
build({ attendanceSessions: countedSessions, attendanceRecords: countedRecords });
assert.deepEqual(attendancePasses, { sessions: 1, records: 1 },
  "both periods must share one attendance-session pass and one attendance-record pass");
assert.equal(result.sourceStudents[0].documentType, "DNI");
assert.deepEqual(result.sourceStudents.map(row => [
  row.userId, row.partial1Absences, row.partial1, row.partial2Absences, row.partial2, row.recovery
]), [
  ["STU-1", 1, 91.25, 0, 91.25, null],
  ["STU-2", 0, 84, 1, 84, null]
]);
assert.equal(result.attendance.partial1.sessions, 1);
assert.equal(result.attendance.partial2.sessions, 1);
assert.deepEqual(result.attendance.absencePolicy, {
  justifiedAbsenceMode: "COUNT",
  verification: "explicit-input-not-confirmed-against-official-SACE-rule"
});
const justifiedStateRecords = attendance.map(record => record.sesionId === "S-1" && record.userId === "STU-1"
  ? Object.assign({}, record, { estadoAsistencia: "Justificada" }) : record);
assert.equal(build({ attendanceRecords: justifiedStateRecords }).sourceStudents[0].partial1Absences, 1,
  "a canonically verified Justificada state remains an absence under COUNT");
assert.equal(build({ attendanceRecords: justifiedStateRecords,
  absencePolicy: { justifiedAbsenceMode: "EXCLUDE" } }).sourceStudents[0].partial1Absences, 0,
  "a canonically verified Justificada state is excluded only under EXCLUDE");
assert.throws(() => build({ attendanceRecords: justifiedStateRecords.map(record => record.sesionId === "S-1" && record.userId === "STU-1"
  ? Object.assign({}, record, { justificado: false }) : record) }), /SACE_ATTENDANCE_JUSTIFICATION_UNVERIFIED/);
assert.throws(() => build({ attendanceRecords: attendance.map(record => record.sesionId === "S-1" && record.userId === "STU-1"
  ? Object.assign({}, record, { estadoAsistencia: "EstadoDesconocido" }) : record) }), /SACE_ATTENDANCE_STATE_UNSUPPORTED/);
const justifiedTardinessRecords = attendance.map(record => record.sesionId === "S-2" && record.userId === "STU-1"
  ? Object.assign({}, record, { justificado: true, justificacionVerificada: true }) : record);
assert.equal(build({ attendanceRecords: justifiedTardinessRecords }).sourceStudents[0].partial2Absences, 0,
  "a canonically justified tardiness must not become an absence under COUNT");
assert.equal(build({ attendanceRecords: justifiedTardinessRecords,
  absencePolicy: { justifiedAbsenceMode: "EXCLUDE" } }).sourceStudents[0].partial2Absences, 0,
  "a canonically justified tardiness must not become an absence under EXCLUDE");

assert(result.limitations.some(item => item.includes("justified-absence treatment is explicit input")));
const excludedJustified = build({ absencePolicy: { justifiedAbsenceMode: "EXCLUDE" } });
assert.deepEqual(excludedJustified.sourceStudents.map(row => [row.partial1Absences, row.partial2Absences]), [
  [0, 0], [0, 0]
]);
assert.throws(() => build({ absencePolicy: undefined }), /SACE_ABSENCE_POLICY_REQUIRED/);
assert.throws(() => build({ absencePolicy: { justifiedAbsenceMode: "IGNORE" } }), /SACE_ABSENCE_POLICY_INVALID/);
assert.throws(() => build({ attendanceRecords: attendance.map((record, index) =>
  index === 0 ? Object.assign({}, record, { justificacionVerificada: false }) : record
) }), /SACE_ATTENDANCE_JUSTIFICATION_UNVERIFIED:partial1/);
const missingJustificationState = attendance.map((record, index) => {
  if (index !== 0) return record;
  const copy = Object.assign({}, record); delete copy.justificado; return copy;
});
assert.throws(() => build({ attendanceRecords: missingJustificationState }),
  /SACE_ATTENDANCE_JUSTIFICATION_STATE_REQUIRED:partial1/);
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
assert.throws(() => build({ attendanceSessions: sessions.map(session => session.sesionId === "S-1" ? Object.assign({}, session, { estado: "Abierta" }) : session) }), /SACE_ATTENDANCE_SESSION_NOT_CLOSED:partial1/);
assert.throws(() => build({ attendanceSessions: sessions.map(session => session.sesionId === "S-1" ? Object.assign({}, session, { fechaCierre: "" }) : session) }), /SACE_ATTENDANCE_SESSION_CLOSE_TIMESTAMP_REQUIRED:partial1/);
assert.throws(() => build({ identityRecords: identityRecords.concat(identityRecords[0]) }), /SACE_IDENTITY_RECORD_DUPLICATE/);
assert.throws(() => build({ partial2Period: { periodoId: "PER-1", anoId: "2026", fechaInicio: "2026-05-01", fechaFin: "2026-07-31" } }), /SACE_PERIODS_MUST_BE_DISTINCT/);
assert.throws(() => build({ partial1Period: Object.assign({}, periods.partial1Period, { anoId: "2025" }) }), /SACE_PERIOD_YEAR_MISMATCH:partial1/);
assert.throws(() => build({ partial1Period: Object.assign({}, periods.partial1Period, { anoId: "" }) }), /SACE_PERIOD_YEAR_REQUIRED:partial1/);
assert.throws(() => build({ partial2Period: Object.assign({}, periods.partial2Period, { fechaInicio: "2026-04-15" }) }), /SACE_PERIOD_RANGE_OVERLAP_OR_ORDER_INVALID/);
assert.throws(() => build({ expectedContext: Object.assign({}, expectedContext, { grado: "12" }) }), /SACE_GRADEBOOK_CONTEXT_MISMATCH:partial1:grado/);
assert.throws(() => build({ attendanceRecords: attendance.concat({
  sesionId: "S-1", userId: "STU-OUT", estadoAsistencia: "Presente"
}) }), /SACE_ATTENDANCE_STUDENT_OUTSIDE_ROSTER:partial1/);
assert.throws(() => build({ attendanceSessions: sessions.filter(row => row.sesionId !== "S-1") }), /SACE_ATTENDANCE_SESSIONS_EMPTY:partial1/);

const fromSnapshot = provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: {
    status: "success",
    data: {
      expectedContext,
      periods: [periods.partial1Period, periods.partial2Period],
      identityRecords,
      attendanceSessions: sessions,
      attendanceRecords: attendance
    },
    limitations: ["snapshot fixture"]
  },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2"),
  documentTypeMappings: [{ documentType: "DNI", documentMarker: "HND" }],
  absencePolicy: { justifiedAbsenceMode: "COUNT" }
});
assert.deepEqual(fromSnapshot.sourceStudents, result.sourceStudents);
assert(fromSnapshot.limitations.includes("snapshot fixture"));
assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: {
    status: "success",
    data: {
      expectedContext,
      periods: [periods.partial1Period, periods.partial2Period],
      identityRecords: identityRecords.map((row, index) => index === 0 ? Object.assign({}, row, { documentType: "" }) : row),
      attendanceSessions: sessions,
      attendanceRecords: attendance
    }
  },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2"),
  documentTypeMappings: [{ documentType: "DNI", documentMarker: "HND" }]
}), /SACE_STUDENT_DOCUMENT_TYPE_REQUIRED/);
assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: {
    status: "success",
    data: {
      expectedContext,
      periods: [periods.partial1Period, periods.partial2Period],
      identityRecords,
      attendanceSessions: sessions,
      attendanceRecords: attendance
    }
  },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2")
}), /SACE_DOCUMENT_TYPE_MAPPING_REQUIRED/);
assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: {
    status: "success",
    data: {
      expectedContext,
      periods: [periods.partial1Period, periods.partial2Period],
      identityRecords,
      attendanceSessions: sessions,
      attendanceRecords: attendance
    }
  },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2"),
  documentTypeMappings: [{ documentType: "PASAPORTE", documentMarker: "PASS" }]
}), /SACE_DOCUMENT_TYPE_MAPPING_MISSING/);
assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: {
    status: "success",
    data: {
      expectedContext,
      periods: [periods.partial1Period, periods.partial2Period],
      identityRecords,
      attendanceSessions: sessions,
      attendanceRecords: attendance
    }
  },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2"),
  documentTypeMappings: [
    { documentType: "DNI", documentMarker: "HND" },
    { documentType: " dni ", documentMarker: "DNI" }
  ]
}), /SACE_DOCUMENT_TYPE_MAPPING_DUPLICATE/);
assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: {
    status: "success",
    data: {
      expectedContext,
      periods: [periods.partial1Period, periods.partial2Period],
      identityRecords: identityRecords.map(row => Object.assign({}, row, { documentMarker: "OTHER" })),
      attendanceSessions: sessions,
      attendanceRecords: attendance
    }
  },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2"),
  documentTypeMappings: [{ documentType: "DNI", documentMarker: "HND" }]
}), /SACE_DOCUMENT_TYPE_MAPPING_CONFLICT/);

assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: { status: "success", data: { expectedContext, periods: [periods.partial1Period, periods.partial2Period] } },
  partial1PeriodId: "PER-1",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2")
}), /SACE_IDENTITY_DIRECTORY_REQUIRED/);
assert.throws(() => provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: { status: "success", data: { expectedContext, periods: [periods.partial1Period, periods.partial2Period], identityRecords, attendanceSessions: sessions, attendanceRecords: attendance } },
  partial1PeriodId: "PER-2",
  partial2PeriodId: "PER-2",
  partial1Gradebook: gradebook("PER-1"),
  partial2Gradebook: gradebook("PER-2")
}), /SACE_PERIODS_MUST_BE_DISTINCT/);

const mappedRows = templateTools.mapRowsToTemplate({
  metadata: {
    institution: "Centro de Prueba",
    modality: "Bachillerato Técnico",
    gradeSection: "11 A",
    schedule: "Jornada Matutina",
    subject: "Informática"
  },
  students: [
    { identity: "0801-2000-00001", name: "Ana Pérez", documentMarker: "HND" },
    { identity: "0801-2000-00002", name: "Luis Gómez", documentMarker: "HND" }
  ]
}, fromSnapshot.sourceStudents, {
  institution: "Centro de Prueba",
  modality: "Bachillerato Tecnico",
  gradeSection: "11 A",
  schedule: "Jornada Matutina",
  subject: "Informatica"
});
assert.deepEqual(mappedRows, [
  { partial1Absences: 1, partial1: 91.25, partial2Absences: 0, partial2: 91.25, recovery: null },
  { partial1Absences: 0, partial1: 84, partial2Absences: 1, partial2: 84, recovery: null }
], "provider output must map directly to SACE template rows by verified identity and document type");
process.stdout.write("sace-data-provider-contract: PASS (synthetic gradebooks, roster, attendance and identity records)\n");
