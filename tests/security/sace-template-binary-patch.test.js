"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const tools = require("../../js/sace-template.js");
const root = path.join(__dirname, "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root,
  "docs/architecture/Plantillas/SACE/manifest.json"), "utf8"));
for (const template of manifest.templates) {
  const file = path.join(root, "docs/architecture/Plantillas/SACE", template.fileName);
  const original = fs.readFileSync(file);
  const before = tools.inspect(original);
  const templateInfo = tools.inspectTemplate(original);
  const alteredHeader = Buffer.from(original);
  const headerEncodings = [Buffer.from("PARCIAL II", "utf16le"), Buffer.from("PARCIAL II", "latin1")];
  const headerNeedle = headerEncodings.find(value => alteredHeader.indexOf(value) !== -1);
  assert.ok(headerNeedle, "partial II header bytes must be present in the source workbook");
  const headerOffset = alteredHeader.indexOf(headerNeedle);
  alteredHeader[headerOffset + headerNeedle.length - (headerNeedle === headerEncodings[0] ? 2 : 1)] = "X".charCodeAt(0);
  assert.throws(() => tools.inspectTemplate(alteredHeader), /SACE_HEADER_LAYOUT_MISMATCH/,
    "candidate inspection must reject a workbook whose partial headers no longer match the cell mapping");
  assert.equal(templateInfo.students.length, 22, "template inspection must return every student row");
  assert.ok(Object.values(templateInfo.metadata).every(value => typeof value === "string" && value.trim()),
    "template inspection must return all five context fields");
  assert.ok(templateInfo.students.every(student => student.documentMarker && student.identity && student.name),
    "template roster must include document type, identity and name");
  const rows = Array.from({ length: 22 }, (_, index) => ({
    partial1Absences: index % 3,
    partial1: 60 + index + 0.25,
    partial2Absences: index % 4,
    partial2: 70 + index + 0.5,
    recovery: index % 5 === 0 ? 85 + index / 10 : null
  }));
  const sourceStudents = templateInfo.students.map((student, index) => Object.assign({}, student, rows[index])).reverse();
  const mappedRows = tools.mapRowsToTemplate(templateInfo, sourceStudents, templateInfo.metadata);
  assert.deepEqual(mappedRows, rows, "template roster mapping must follow identity rather than source row order");
  const alternateIdentityFormatting = sourceStudents.map(student => Object.assign({}, student));
  alternateIdentityFormatting[0].identity = alternateIdentityFormatting[0].identity.replace(/-/g, "/");
  assert.deepEqual(tools.mapRowsToTemplate(templateInfo, alternateIdentityFormatting, templateInfo.metadata), rows,
    "template identity normalization must match USER/Academic/provider canonical punctuation removal");
  const normalizedIdentityCollision = sourceStudents.map(student => Object.assign({}, student));
  normalizedIdentityCollision[1].identity = normalizedIdentityCollision[0].identity.replace(/-/g, "/");
  assert.throws(() => tools.mapRowsToTemplate(templateInfo, normalizedIdentityCollision, templateInfo.metadata),
    /SACE_STUDENT_IDENTITY_DUPLICATE/,
    "different punctuation must not conceal two source records with the same canonical identity");

  const output = tools.fill(original, mappedRows, { scale: { min: 0, max: 100, precision: 2 } });
  const candidateOutput = tools.prepareCandidateExport(original, sourceStudents, templateInfo.metadata,
    { scale: { min: 0, max: 100, precision: 2 } });
  assert.deepEqual(candidateOutput, output, "candidate export pipeline must inspect, map and patch consistently");
  assert.throws(() => tools.prepareCandidateExport(original, sourceStudents,
    Object.assign({}, templateInfo.metadata, { subject: "Asignatura distinta" }),
    { scale: { min: 0, max: 100, precision: 2 } }), /SACE_TEMPLATE_CONTEXT_MISMATCH:subject/);
  assert.ok(output instanceof Uint8Array);
  assert.equal(output.length, original.length, "OLE file size must remain unchanged");
  const after = tools.inspect(output);
  assert.ok(after.workbookSize > 0, "patched workbook stream must remain non-empty");
  assert.ok(after.workbookSize <= after.workbookCapacity, "patched workbook must fit its original OLE sector chain");
  assert.deepEqual(after.dimension, before.dimension);
  assert.deepEqual(after.merges.slice().sort(), before.merges.slice().sort());
  assert.equal(after.formulaCount, before.formulaCount);
  assert.equal(after.validationCount, before.validationCount);
  assert.equal(after.sheetProtectionFlag, before.sheetProtectionFlag);
  assert.equal(after.workbookProtectionFlag, before.workbookProtectionFlag);
  for (let index = 0; index < 22; index++) {
    const row = index + 8, expected = rows[index];
    assert.equal(after.get("E" + row), expected.partial1);
    assert.equal(after.get("G" + row), expected.partial2);
    assert.equal(after.get("H" + row), expected.recovery);
    assert.equal(after.get("D" + row), expected.partial1Absences, "partial I absence count must be mapped");
    assert.equal(after.get("F" + row), expected.partial2Absences, "partial II absence count must be mapped");
    assert.equal(after.get("A" + row), before.get("A" + row), "document marker must remain unchanged");
    assert.equal(after.get("B" + row), before.get("B" + row), "identity must remain unchanged");
    assert.equal(after.get("C" + row), before.get("C" + row), "student name must remain unchanged");
  }
  for (const [address, cell] of before.cells.entries()) {
    if (/^[DEFGH](?:[8-9]|1\d|2\d)$/.test(address)) continue;
    assert.deepEqual(after.cells.get(address), cell, "unmapped cell changed: " + address);
  }
  const invalidAbsences = rows.map(row => Object.assign({}, row));
  invalidAbsences[0].partial1Absences = -1;
  assert.throws(() => tools.fill(original, invalidAbsences, { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_ABSENCE_VALUE_INVALID/);
  const fractionalAbsences = rows.map(row => Object.assign({}, row));
  fractionalAbsences[0].partial2Absences = 1.5;
  assert.throws(() => tools.fill(original, fractionalAbsences, { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_ABSENCE_VALUE_INVALID/);
  const missingGrade = rows.map(row => Object.assign({}, row));
  missingGrade[0].partial1 = null;
  assert.throws(() => tools.fill(original, missingGrade, { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_GRADE_VALUE_REQUIRED/);
  assert.throws(() => tools.fill(original, rows.slice(1), { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_STUDENT_COUNT_MISMATCH/);

  const whitespaceGrade = rows.map(row => Object.assign({}, row));
  whitespaceGrade[0].partial1 = "   ";
  assert.throws(() => tools.fill(original, whitespaceGrade, { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_GRADE_VALUE_REQUIRED/);
  const booleanGrade = rows.map(row => Object.assign({}, row));
  booleanGrade[0].partial2 = false;
  assert.throws(() => tools.fill(original, booleanGrade, { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_GRADE_VALUE_REQUIRED/);
  const blankRecovery = rows.map(row => Object.assign({}, row));
  blankRecovery[0].recovery = "   ";
  const blankRecoveryOutput = tools.inspect(tools.fill(original, blankRecovery,
    { scale: { min: 0, max: 100, precision: 2 } }));
  assert.equal(blankRecoveryOutput.get("H8"), null, "whitespace recovery remains blank, not numeric zero");
  const blankAbsence = rows.map(row => Object.assign({}, row));
  blankAbsence[0].partial1Absences = "   ";
  const blankAbsenceOutput = tools.inspect(tools.fill(original, blankAbsence,
    { scale: { min: 0, max: 100, precision: 2 } }));
  assert.equal(blankAbsenceOutput.get("D8"), before.get("D8"), "blank absence input preserves the template cell");
  assert.throws(() => tools.fill(original, rows, { scale: { min: "   ", max: 100, precision: 2 } }),
    /SACE_SCALE_CONFIGURATION_REQUIRED/);

  assert.throws(() => tools.fill(original, rows, {}), /SACE_SCALE_CONFIGURATION_REQUIRED/);
  assert.throws(() => tools.fill(original, rows, { scale: { min: 0, max: 100, precision: 1 } }),
    /SACE_SCALE_PRECISION_UNSUPPORTED/);
}
assert.throws(() => tools.inspect(new Uint8Array([1, 2, 3, 4])), /SACE_OLE_SIGNATURE_INVALID/);

const templateInfo = {
  metadata: {
    institution: "Centro Técnico de Prueba",
    modality: "Bachillerato Técnico Profesional",
    gradeSection: "Onceavo Grado Sección 1",
    schedule: "Jornada Matutina",
    subject: "Informática Aplicada"
  },
  students: [
    { identity: "0801-1991-00002", name: "Luis Gómez", documentMarker: "HND" },
    { identity: "0801-1990-00001", name: "Ana Pérez", documentMarker: "HND" }
  ]
};
const expectedContext = {
  institution: "Centro Tecnico de Prueba",
  modality: "Bachillerato Tecnico Profesional",
  gradeSection: "Onceavo Grado Seccion 1",
  schedule: "Jornada  Matutina",
  subject: "Informatica Aplicada"
};
const sourceStudents = [
  { identity: "0801.1990.00001", name: "Ana Perez", documentMarker: "hnd",
    partial1Absences: 1, partial1: 90, partial2Absences: 0, partial2: 92, recovery: null },
  { identity: "0801 1991 00002", name: "Luis  Gomez", documentMarker: "HND",
    partial1Absences: 2, partial1: 77, partial2Absences: 1, partial2: 82, recovery: 85 }
];
assert.deepEqual(tools.mapRowsToTemplate(templateInfo, sourceStudents, expectedContext), [
  { partial1Absences: 2, partial1: 77, partial2Absences: 1, partial2: 82, recovery: 85 },
  { partial1Absences: 1, partial1: 90, partial2Absences: 0, partial2: 92, recovery: null }
], "mapping must normalize accents, whitespace and identity separators, then follow template order");

assert.throws(() => tools.mapRowsToTemplate(templateInfo, sourceStudents,
  Object.assign({}, expectedContext, { institution: "Otro Centro" })),
  /SACE_TEMPLATE_CONTEXT_MISMATCH:institution/);
const duplicateSource = [sourceStudents[0], Object.assign({}, sourceStudents[1], { identity: "0801 1990 00001" })];
assert.throws(() => tools.mapRowsToTemplate(templateInfo, duplicateSource, expectedContext),
  /SACE_STUDENT_IDENTITY_DUPLICATE/);
const duplicateTemplate = Object.assign({}, templateInfo, {
  students: [templateInfo.students[0], Object.assign({}, templateInfo.students[0])]
});
assert.throws(() => tools.mapRowsToTemplate(duplicateTemplate, sourceStudents, expectedContext),
  /SACE_TEMPLATE_ROSTER_INVALID/);
const missingIdentity = [Object.assign({}, sourceStudents[0], { identity: " " }), sourceStudents[1]];
assert.throws(() => tools.mapRowsToTemplate(templateInfo, missingIdentity, expectedContext),
  /SACE_STUDENT_IDENTITY_REQUIRED/);
const mismatchedRoster = Object.assign({}, templateInfo, {
  students: [templateInfo.students[0], { identity: "0801-2000-00003", name: "Otro Alumno", documentMarker: "HND" }]
});
assert.throws(() => tools.mapRowsToTemplate(mismatchedRoster, sourceStudents, expectedContext),
  /SACE_STUDENT_ROSTER_MISMATCH/);
const mismatchedName = Object.assign({}, templateInfo, {
  students: [Object.assign({}, templateInfo.students[0], { name: "Nombre distinto" }), templateInfo.students[1]]
});
assert.throws(() => tools.mapRowsToTemplate(mismatchedName, sourceStudents, expectedContext),
  /SACE_STUDENT_NAME_MISMATCH/);
const mismatchedDocument = Object.assign({}, templateInfo, {
  students: [Object.assign({}, templateInfo.students[0], { documentMarker: "OTRO" }), templateInfo.students[1]]
});
assert.throws(() => tools.mapRowsToTemplate(mismatchedDocument, sourceStudents, expectedContext),
  /SACE_STUDENT_DOCUMENT_TYPE_MISMATCH/);

const missingSourceDocumentMarker = [Object.assign({}, sourceStudents[0], { documentMarker: "" }), sourceStudents[1]];
assert.throws(() => tools.mapRowsToTemplate(templateInfo, missingSourceDocumentMarker, expectedContext),
  /SACE_STUDENT_DOCUMENT_TYPE_MISMATCH/);
const missingTemplateDocumentMarker = Object.assign({}, templateInfo, {
  students: [Object.assign({}, templateInfo.students[0], { documentMarker: "" }), templateInfo.students[1]]
});
assert.throws(() => tools.mapRowsToTemplate(missingTemplateDocumentMarker, sourceStudents, expectedContext),
  /SACE_STUDENT_DOCUMENT_TYPE_MISMATCH/);

assert.throws(() => tools.mapRowsToTemplate(templateInfo, sourceStudents.slice(1), expectedContext),
  /SACE_STUDENT_COUNT_MISMATCH/);

process.stdout.write("sace-template-binary-patch: PASS (3 templates; mapped cells only; OLE size preserved)\\n");
