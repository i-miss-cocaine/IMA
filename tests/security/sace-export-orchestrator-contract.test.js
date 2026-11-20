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
  const originalTemplateBytes = Array.from(templateBytes);
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
          parcial: gradeIndex === 1 ? "I Parcial" : "II Parcial",
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
    const fecha = "2026-02-0" + (index + 2);
    attendanceSessions.push({
      sesionId: "P1-S" + (index + 1), fecha,
      grado: "11", seccion: "A", asignaturaId: "SUB-TEST",
      docenteUserId: "TEACHER-TEST", estado: "Cerrada", fechaCierre: fecha + "T08:00:00.000Z"
    });
  }
  for (let index = 0; index < 4; index++) {
    const fecha = "2026-05-0" + (index + 2);
    attendanceSessions.push({
      sesionId: "P2-S" + (index + 1), fecha,
      grado: "11", seccion: "A", asignaturaId: "SUB-TEST",
      docenteUserId: "TEACHER-TEST", estado: "Cerrada", fechaCierre: fecha + "T08:00:00.000Z"
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
        justificado: false,
        justificacionVerificada: true
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
    sourceRevisions: {
      academic: "123e4567-e89b-12d3-a456-426614174000:7",
      user: "123e4567-e89b-12d3-a456-426614174000:4",
      exam: "123e4567-e89b-12d3-a456-426614174000:9"
    },
    data: {
      expectedContext,
      periods,
      gradebookSnapshots: [
        { periodoId: "PER-1", parcial: "I Parcial", snapshot: partial1Gradebook },
        { periodoId: "PER-2", parcial: "II Parcial", snapshot: partial2Gradebook }
      ],
      identityRecords,
      attendanceSessions,
      attendanceRecords
    },
    limitations: ["synthetic source snapshot; no live service or official SACE mapping"]
  };
  const contextMapping = { academic: expectedContext, template: templateInfo.metadata };
  const spoofedGradebook = gradebook("PER-1", 1);
  spoofedGradebook.data.resumenes[studentRows[0].userId].notaFinal = 0;
  const snapshotBeforeExport = JSON.parse(JSON.stringify(attendanceSnapshot));
  const mappingsBeforeExport = JSON.parse(JSON.stringify(documentTypeMappings));
  const contextMappingBeforeExport = JSON.parse(JSON.stringify(contextMapping));
  const spoofedGradebookBeforeExport = JSON.parse(JSON.stringify(spoofedGradebook));
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
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  });
  assert.equal(result.status, "candidate");
  assert.equal(result.sourceRevisionStatus, "present");
  assert.deepEqual(result.sourceRevisions, attendanceSnapshot.sourceRevisions,
    "candidate metadata retains the stable source revisions without writing them into the workbook");
  const outputBinaryText = Buffer.from(result.outputBytes).toString("latin1");
  assert.equal(outputBinaryText.includes("123e4567-e89b-12d3-a456-426614174000:7"), false,
    "source revision tokens stay in candidate metadata and never enter the XLS binary");

  assert.ok(result.limitations.some(item => item.includes("retained as candidate metadata only")));

  assert.equal(templates.inspect(result.outputBytes).get("E8"), sourceRows[0].partial1,
    "the wrapper must use the gradebook snapshots returned by Academic-Service, not caller-supplied overrides");
  assert.equal(result.sourceStudentCount, 22);
  assert.equal(result.verifiedRowCount, 22);
  const legacySnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  delete legacySnapshot.sourceRevisions;
  const legacyResult = orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: legacySnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  });
  assert.equal(legacyResult.sourceRevisionStatus, "absent");
  assert.equal(legacyResult.sourceRevisions, null);
  assert.ok(legacyResult.limitations.some(item => item.includes("cross-service stability cannot be attested")));
  const malformedRevisionSnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  malformedRevisionSnapshot.sourceRevisions.user = "broken";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: malformedRevisionSnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_SOURCE_REVISIONS_INVALID/);
  const malformedEpochSnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  malformedEpochSnapshot.sourceRevisions.user = "--------:0";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: malformedEpochSnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_SOURCE_REVISIONS_INVALID/);

  assert.equal(result.outputBytes.length, templateBytes.length);
  assert.notEqual(result.outputBytes, templateBytes, "candidate generation must return a separate byte buffer");
  assert.deepEqual(Array.from(templateBytes), originalTemplateBytes, "candidate generation must not mutate the source template bytes");
  assert.deepEqual(attendanceSnapshot, snapshotBeforeExport, "candidate generation must not mutate the Academic attendance/gradebook snapshot");
  assert.deepEqual(documentTypeMappings, mappingsBeforeExport, "candidate generation must not mutate explicit document mappings");
  assert.deepEqual(contextMapping, contextMappingBeforeExport, "candidate generation must not mutate academic/template context mapping");
  assert.deepEqual(spoofedGradebook, spoofedGradebookBeforeExport, "candidate generation must not mutate caller-supplied gradebook objects");
  const repeatedResult = orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2",
    documentTypeMappings, absencePolicy: { justifiedAbsenceMode: "COUNT" },
    expectedTemplateContext: templateInfo.metadata, academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  });
  assert.deepEqual(Array.from(repeatedResult.outputBytes), Array.from(result.outputBytes),
    "repeated candidate generation with identical inputs must be deterministic");

  const originalInspect = templates.inspect;
  const originalInspectTemplate = templates.inspectTemplate;
  const originalMapRows = templates.mapRowsToTemplate;
  const originalFill = templates.fill;
  const originalPrepare = templates.prepareCandidateExport;
  const operationCounts = { inspect: 0, inspectTemplate: 0, mapRows: 0, fill: 0, prepare: 0 };
  templates.inspect = function() {
    operationCounts.inspect++;
    return originalInspect.apply(this, arguments);
  };
  templates.inspectTemplate = function() {
    operationCounts.inspectTemplate++;
    return originalInspectTemplate.apply(this, arguments);
  };
  templates.mapRowsToTemplate = function() {
    operationCounts.mapRows++;
    return originalMapRows.apply(this, arguments);
  };
  templates.fill = function() {
    operationCounts.fill++;
    return originalFill.apply(this, arguments);
  };
  templates.prepareCandidateExport = function() {
    operationCounts.prepare++;
    return originalPrepare.apply(this, arguments);
  };
  try {
    const optimized = orchestrator.prepareCandidateExportFromAcademicSnapshot({
      templateBytes, attendanceSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2",
      documentTypeMappings, absencePolicy: { justifiedAbsenceMode: "COUNT" },
      expectedTemplateContext: templateInfo.metadata, academicTemplateContextMapping: contextMapping,
      options: { scale: { min: 0, max: 100, precision: 2 } }
    });
    assert.deepEqual(Array.from(optimized.outputBytes), Array.from(result.outputBytes));
  } finally {
    templates.inspect = originalInspect;
    templates.inspectTemplate = originalInspectTemplate;
    templates.mapRowsToTemplate = originalMapRows;
    templates.fill = originalFill;
    templates.prepareCandidateExport = originalPrepare;
  }
  assert.deepEqual(operationCounts, {
    inspect: 2,
    inspectTemplate: 1,
    mapRows: 1,
    fill: 1,
    prepare: 0
  }, "the orchestrator must reuse the parsed template and mapped rows instead of repeating inspection/mapping");
  assert(result.limitations.includes("synthetic source snapshot; no live service or official SACE mapping"));
  assert(result.limitations.some(item => item.includes("not been independently verified against an official SACE source")));
  assert(result.limitations.some(item => item.includes("no verified mapping from the local SedeID source")));
  assert(result.limitations.some(item => item.includes("no unambiguous JornadaID relationship")));
  assert(result.limitations.some(item => item.includes("Template source, official status, effective dates and applicable academic year are not verified")));
  const openSessionSnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  openSessionSnapshot.data.attendanceSessions[0].estado = "Abierta";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: openSessionSnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_ATTENDANCE_SESSION_NOT_CLOSED:partial1/);
  const mismatchedPartialMapping = JSON.parse(JSON.stringify(attendanceSnapshot));
  mismatchedPartialMapping.data.gradebookSnapshots[0].parcial = "II Parcial";
  mismatchedPartialMapping.data.gradebookSnapshots[0].snapshot.data.contexto.parcial = "II Parcial";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: mismatchedPartialMapping,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_GRADEBOOK_PARTIAL_MAPPING_MISMATCH:partial1/);
  const inconsistentPartialSnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  inconsistentPartialSnapshot.data.gradebookSnapshots[0].snapshot.data.contexto.parcial = "II Parcial";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: inconsistentPartialSnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_GRADEBOOK_PARTIAL_SNAPSHOT_MISMATCH/);
  const unverifiedRecoverySnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  unverifiedRecoverySnapshot.data.gradebookSnapshots[0].snapshot.data.recuperaciones = [
    { userId: studentRows[0].userId, evaluacionId: "REC-1", notaFinalCalculada: 95 }
  ];
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: unverifiedRecoverySnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_RECOVERY_MAPPING_UNVERIFIED:partial1/);
  const mismatchedGradebookYear = JSON.parse(JSON.stringify(attendanceSnapshot));
  mismatchedGradebookYear.data.gradebookSnapshots[0].snapshot.data.contexto.anoId = "2025";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: mismatchedGradebookYear,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_GRADEBOOK_CONTEXT_MISMATCH:partial1:anoId/);
  const mismatchedPeriodYear = JSON.parse(JSON.stringify(attendanceSnapshot));
  mismatchedPeriodYear.data.periods[0].anoId = "2025";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: mismatchedPeriodYear,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_PERIOD_YEAR_MISMATCH:partial1/);
  const overlappingPeriodRanges = JSON.parse(JSON.stringify(attendanceSnapshot));
  overlappingPeriodRanges.data.periods[1].fechaInicio = "2026-03-15";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: overlappingPeriodRanges,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_PERIOD_RANGE_OVERLAP_OR_ORDER_INVALID/);
  const mismatchedAcademicMapping = Object.assign({}, contextMapping, {
    academic: Object.assign({}, expectedContext, { seccion: "B" })
  });
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2",
    documentTypeMappings, absencePolicy: { justifiedAbsenceMode: "COUNT" },
    expectedTemplateContext: templateInfo.metadata, academicTemplateContextMapping: mismatchedAcademicMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_TEMPLATE_CONTEXT_MAPPING_MISMATCH:academic.seccion/);
  const mismatchedAcademicYearMapping = Object.assign({}, contextMapping, {
    academic: Object.assign({}, expectedContext, { anoId: "2025" })
  });
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2",
    documentTypeMappings, absencePolicy: { justifiedAbsenceMode: "COUNT" },
    expectedTemplateContext: templateInfo.metadata, academicTemplateContextMapping: mismatchedAcademicYearMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_TEMPLATE_CONTEXT_MAPPING_MISMATCH:academic.anoId/);
  const mismatchedTemplateMapping = Object.assign({}, contextMapping, {
    template: Object.assign({}, templateInfo.metadata, { gradeSection: "12 B" })
  });
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot, partial1PeriodId: "PER-1", partial2PeriodId: "PER-2",
    documentTypeMappings, absencePolicy: { justifiedAbsenceMode: "COUNT" },
    expectedTemplateContext: templateInfo.metadata, academicTemplateContextMapping: mismatchedTemplateMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_TEMPLATE_CONTEXT_MAPPING_MISMATCH:template.gradeSection/);
  const missingCloseSnapshot = JSON.parse(JSON.stringify(attendanceSnapshot));
  missingCloseSnapshot.data.attendanceSessions[0].fechaCierre = "";
  assert.throws(() => orchestrator.prepareCandidateExportFromAcademicSnapshot({
    templateBytes, attendanceSnapshot: missingCloseSnapshot,
    partial1PeriodId: "PER-1", partial2PeriodId: "PER-2", documentTypeMappings,
    absencePolicy: { justifiedAbsenceMode: "COUNT" }, expectedTemplateContext: templateInfo.metadata,
    academicTemplateContextMapping: contextMapping,
    options: { scale: { min: 0, max: 100, precision: 2 } }
  }), /SACE_ATTENDANCE_SESSION_CLOSE_TIMESTAMP_REQUIRED:partial1/);
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
  { periodoId: "PER-1", parcial: "I Parcial", snapshot: { status: "success", data: { contexto: { periodoId: "PER-1", parcial: "I Parcial" } } } },
  { periodoId: "PER-1", parcial: "I Parcial", snapshot: { status: "success", data: { contexto: { periodoId: "PER-1", parcial: "I Parcial" } } } }
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
