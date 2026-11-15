"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
assert.doesNotThrow(() => new Function(source));
const start = source.indexOf("function normalizeHonduranIdentity_(value) {");
const end = source.indexOf("\n\n// [TAREA-F5-003]", start);
assert.ok(start >= 0 && end > start, "Honduran identity normalizer must exist");
const context = {};
vm.runInNewContext(source.slice(start, end), context);
assert.equal(context.normalizeHonduranIdentity_("0801199012345"), "0801199012345");
assert.equal(context.normalizeHonduranIdentity_("0801-1990-12345"), "0801199012345");
for (const invalid of ["0801 1990 12345", "080119901234", "08011990123456", "0801-199-12345", "0801-1990-1234A"]) {
  assert.throws(() => context.normalizeHonduranIdentity_(invalid), /DNI_HONDURAS_FORMAT_INVALID/);
}
assert.equal(context.normalizeHonduranIdentity_(""), "");
assert.equal(context.normalizeHonduranIdentityForComparison_("0801-1990-12345"), "0801199012345");
const admission = source.slice(source.indexOf("function createAdmissionRequest(payload) {"), source.indexOf("\nfunction ", source.indexOf("function createAdmissionRequest(payload) {") + 10));
assert.ok(admission.includes("normalizeHonduranIdentity_(identificacion)"));
assert.ok(admission.includes("normalizeHonduranIdentityForComparison_(r[6])"));
const student = fs.readFileSync("js/student.js", "utf8");
assert.ok(student.includes("/^\\d{13}$/"));
assert.ok(student.includes("/^\\d{4}-\\d{4}-\\d{5}$/"));
console.log("PASS admission identity: backend accepts only 13 digits or 4-4-5 hyphen format and normalizes consistently");
