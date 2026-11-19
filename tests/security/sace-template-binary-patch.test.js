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
  const rows = Array.from({ length: 22 }, (_, index) => ({
    partial1Absences: index % 3,
    partial1: 60 + index + 0.25,
    partial2Absences: index % 4,
    partial2: 70 + index + 0.5,
    recovery: index % 5 === 0 ? 85 + index / 10 : null
  }));
  const output = tools.fill(original, rows, { scale: { min: 0, max: 100, precision: 2 } });
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
assert.throws(() => tools.mapRowsToTemplate(templateInfo, sourceStudents.slice(1), expectedContext),
  /SACE_STUDENT_COUNT_MISMATCH/);

process.stdout.write("sace-template-binary-patch: PASS (3 templates; mapped cells only; OLE size preserved)\\n");
