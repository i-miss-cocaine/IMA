"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const provider = require("../../js/sace-data-provider.js");
const templates = require("../../js/sace-template.js");
const orchestrator = require("../../js/sace-export-orchestrator.js");
const root = path.join(__dirname, "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root,
  "docs/architecture/Plantillas/SACE/manifest.json"), "utf8"));

for (const entry of manifest.templates) {
  const file = path.join(root, "docs/architecture/Plantillas/SACE", entry.fileName);
  const templateBytes = new Uint8Array(fs.readFileSync(file));
  const templateInfo = templates.inspectTemplate(templateBytes);
  const sourceRows = Array.from({ length: 22 }, (_, index) => ({
    partial1Absences: index % 3,
    partial1: 60 + index + 0.25,
    partial2Absences: index % 4,
    partial2: 70 + index + 0.5,
    recovery: null
  }));
  const studentRows = templateInfo.students.map((student, index) => ({
    userId: "STU-" + String(index + 1).padStart(2, "0"),
    identity: student.identity,
    name: student.name,
    documentType: "SYNTHETIC-" + String(student.documentMarker).trim().toUpperCase(),
    documentMarker: "",
    values: sourceRows[index]
  }));
  const roster = studentRows.slice().reverse();
  const expectedContext = {
    anoId: "2026",
    grado: "11",
    seccion: "A",
    asignatura: templateInfo.metadata.subject,
    asignaturaId: "SUB-TEST",
    institutionId: "INST-TEST",
    teacherUserId: "TEACHER-TEST"
  };
  const periods = [
    { periodoId: "PER-1", anoId: "2026", fechaInicio: "2026-01-01", fechaFin: "2026-03-31" },
    { periodoId: "PER-2", anoId: "2026", fechaInicio: "2026-04-01", fechaFin: "2026-06-30" }
  ];
  function gradebook(periodId, gradeIndex) {
    const summaries = {};
    studentRows.forEach(student => {
      summaries[student.userId] = {
        status: "calculated",
        notaFinal: gradeIndex === 1 ? student.values.partial1 : student.values.partial2
      };
    });
    return {
      status: "success",
      data: {
        contexto: {
          anoId: expectedContext.anoId,
          periodoId: periodId,
          grado: expectedContext.grado,
          seccion: expectedContext.seccion,
          asignatura: expectedContext.asignatura,
          institutionId: expectedContext.institutionId
        },
        estadoPeriodo: "Cerrado",
        alumnos: roster.map(student => ({ userId: student.userId, nombreCompleto: student.name })),
        resumenes: summaries,
        recuperaciones: []
      }
    };
  }
  const attendanceSessions = [];
  for (let index = 0; index < 2; index++) {
    attendanceSessions.push({
      sesionId: "P1-S" + (index + 1), fecha: "2026-02-0" + (index + 2),
      grado: "11", seccion: "A", asignaturaId: "SUB-TEST",
      docenteUserId: "TEACHER-TEST", estado: "Cerrada"
    });
  }
  for (let index = 0; index < 4; index++) {
    attendanceSessions.push({
      sesionId: "P2-S" + (index + 1), fecha: "2026-05-0" + (index + 2),
      grado: "11", seccion: "A", asignaturaId: "SUB-TEST",
      docenteUserId: "TEACHER-TEST", estado: "Cerrada"
    });
  }
  const attendanceRecords = [];
  attendanceSessions.forEach(session => {
    const firstPeriod = session.sesionId.startsWith("P1-");
    const sessionIndex = Number(session.sesionId.split("S")[1]) - 1;
    studentRows.forEach(student => {
      const absenceLimit = firstPeriod ? student.values.partial1Absences : student.values.partial2Absences;
      attendanceRecords.push({
        sesionId: session.sesionId,
        userId: student.userId,
        estadoAsistencia: sessionIndex < absenceLimit ? "Ausente" : "Presente",
        justificado: false
      });
    });
  });
  const identityRecords = studentRows.map(student => ({
    userId: student.userId,
    identity: student.identity,
    name: student.name,
    documentType: student.documentType,
    documentMarker: ""
  }));
  const documentTypeMappings = Array.from(new Map(studentRows.map(student => [
    student.documentType, student.identity && templateInfo.students.find(row => row.identity === student.identity).documentMarker
  ])).entries()).map(([documentType, documentMarker]) => ({ documentType, documentMarker }));
  const partial1Gradebook = gradebook("PER-1", 1);
  const partial2Gradebook = gradebook("PER-2", 2);
  const attendanceSnapshot = {
    status: "success",
    data: {
      expectedContext,
      periods,
      gradebookSnapshots: [
        { periodoId: "PER-1", snapshot: partial1Gradebook },
        { periodoId: "PER-2", snapshot: partial2Gradebook }
      ],
      identityRecords,
      attendanceSessions,
      attendanceRecords
    },
    limitations: ["synthetic source snapshot; no live service or official SACE mapping"]
  };
  const spoofedGradebook = gradebook("PER-1", 1);
  spoofedGradebook.data.resumenes[studentRows[0].userId].notaFinal = 0;
  const result = orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes,
    attendanceSnapshot,
    partial1PeriodId: "PER-1",
    partial2PeriodId: "PER-2",
    partial1Gradebook: spoofedGradebook,
    partial2Gradebook: spoofedGradebook,
    documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" },
    expectedTemplateContext: templateInfo.metadata,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  });
  assert.equal(result.status, "candidate");
  assert.equal(templates.inspect(result.outputBytes).get("E8"), sourceRows[0].partial1,
    "the wrapper must use the gradebook snapshots returned by Academic-Service, not caller-supplied overrides");
  assert.equal(result.sourceStudentCount, 22);
  assert.equal(result.verifiedRowCount, 22);
  assert.equal(result.outputBytes.length, templateBytes.length);
  assert(result.limitations.includes("synthetic source snapshot; no live service or official SACE mapping"));
  const output = templates.inspect(result.outputBytes);
  sourceRows.forEach((expected, index) => {
    const row = 8 + index;
    assert.equal(output.get("D" + row), expected.partial1Absences);
    assert.equal(output.get("E" + row), expected.partial1);
    assert.equal(output.get("F" + row), expected.partial2Absences);
    assert.equal(output.get("G" + row), expected.partial2);
    assert.equal(output.get("H" + row), expected.recovery);
  });
  assert.throws(() => orchestrator.prepareCandidateExportFromSnapshot({
    templateBytes, attendanceSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2",
    partial1Gradebook: gradebook("PER-1", 1), partial2Gradebook: gradebook("PER-2", 2),
    documentTypeMappings: [], expectedTemplateContext: templateInfo.metadata,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_DOCUMENT_TYPE_MAPPING_REQUIRED/);
}

const incompleteAcademicSnapshot = { status: "success", data: { gradebookSnapshots: [] } };
assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
  attendanceSnapshot: incompleteAcademicSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2"
}), /SACE_GRADEBOOK_SNAPSHOTS_REQUIRED/);
const duplicateAcademicSnapshot = { status: "success", data: { gradebookSnapshots: [
  { periodoId: "PER-1", snapshot: { status: "success", data: { contexto: { periodoId: "PER-1" } } } },
  { periodoId: "PER-1", snapshot: { status: "success", data: { contexto: { periodoId: "PER-1" } } } }
] } };
assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
  attendanceSnapshot: duplicateAcademicSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2"
}), /SACE_GRADEBOOK_SNAPSHOT_PERIOD_DUPLICATE/);
const mismatchedAcademicSnapshot = { status: "success", data: { gradebookSnapshots: [
  { periodoId: "PER-1", snapshot: { status: "success", data: { contexto: { periodoId: "PER-2" } } } },
  { periodoId: "PER-2", snapshot: { status: "success", data: { contexto: { periodoId: "PER-2" } } } }
] } };
assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
  attendanceSnapshot: mismatchedAcademicSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2"
}), /SACE_GRADEBOOK_SNAPSHOT_PERIOD_MISMATCH/);
assert.throws(() => orchestrator.prepareCandidateExportFromSnapshot({}), /SACE_TEMPLATE_BYTES_REQUIRED/);
process.stdout.write("sace-export-orchestrator-contract: PASS (3 templates, Academic gradebook snapshots to binary candidate, 22 roster rows each)\n");
