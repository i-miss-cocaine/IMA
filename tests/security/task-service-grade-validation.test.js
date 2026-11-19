"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/task-service/Code.gs", "utf8");
assert.doesNotThrow(() => new Function(source));
const start = source.indexOf("function normalizeTaskGradeScore_(value) {");
const end = source.indexOf("\n\nfunction gradeSubmissionWithRubric", start);
assert.ok(start >= 0 && end > start, "grade normalizer must exist");
const context = {};
vm.runInNewContext(source.slice(start, end), context);
assert.equal(context.normalizeTaskGradeScore_(0), 0);
assert.equal(context.normalizeTaskGradeScore_(100), 100);
assert.equal(context.normalizeTaskGradeScore_("75.50"), 75.5);
for (const invalid of ["", null, undefined, -0.01, 100.01, "abc", 1.234]) {
  assert.throws(() => context.normalizeTaskGradeScore_(invalid));
}
const normal = source.slice(source.indexOf("function gradeSubmission(payload) {"), source.indexOf("\nfunction ", source.indexOf("function gradeSubmission(payload) {") + 10));
const rubric = source.slice(source.indexOf("function gradeSubmissionWithRubric(payload) {"), source.indexOf("\nfunction ", source.indexOf("function gradeSubmissionWithRubric(payload) {") + 10));
assert.ok(normal.includes("normalizeTaskGradeScore_(p.calificacion)"));
assert.ok(rubric.includes("normalizeTaskGradeScore_(p.calificacion)"));
assert.ok(normal.includes("rowData[calificacionCol]=normalizedGrade"));
assert.ok(rubric.includes("rowData[calificacionCol]=normalizedGrade"));
console.log("PASS task grade validation: required numeric score, 0-100 inclusive, maximum two decimals");
