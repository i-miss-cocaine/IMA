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
    partial1: 60 + index + 0.25,
    partial2: 70 + index + 0.5,
    recovery: index % 5 === 0 ? 85 + index / 10 : null
  }));
  const output = tools.fill(original, rows, { scale: { min: 0, max: 100, precision: 2 } });
  assert.ok(output instanceof Uint8Array);
  assert.equal(output.length, original.length, "OLE file size must remain unchanged");
  const after = tools.inspect(output);
  assert.equal(after.workbookSize, before.workbookSize + 22 * 10 +
    rows.filter(row => row.recovery !== null).length * 8 - 6);
  assert.ok(after.workbookSize <= after.workbookCapacity);
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
    assert.equal(after.get("D" + row), before.get("D" + row), "partial I absence count must remain unchanged");
    assert.equal(after.get("F" + row), before.get("F" + row), "partial II absence count must remain unchanged");
    assert.equal(after.get("A" + row), before.get("A" + row), "document marker must remain unchanged");
    assert.equal(after.get("B" + row), before.get("B" + row), "identity must remain unchanged");
    assert.equal(after.get("C" + row), before.get("C" + row), "student name must remain unchanged");
  }
  for (const [address, cell] of before.cells.entries()) {
    if (/^[EGH](?:[8-9]|1\d|2\d)$/.test(address)) continue;
    assert.deepEqual(after.cells.get(address), cell, "unmapped cell changed: " + address);
  }
  const missingGrade = rows.map(row => Object.assign({}, row));
  missingGrade[0].partial1 = null;
  assert.throws(() => tools.fill(original, missingGrade, { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_GRADE_VALUE_REQUIRED/);
  assert.throws(() => tools.fill(original, rows.slice(1), { scale: { min: 0, max: 100, precision: 2 } }),
    /SACE_STUDENT_COUNT_MISMATCH/);
  assert.throws(() => tools.fill(original, rows, {}), /SACE_SCALE_CONFIGURATION_REQUIRED/);
}
assert.throws(() => tools.inspect(new Uint8Array([1, 2, 3, 4])), /SACE_OLE_SIGNATURE_INVALID/);
process.stdout.write("sace-template-binary-patch: PASS (3 templates; mapped cells only; OLE size preserved)\\n");
