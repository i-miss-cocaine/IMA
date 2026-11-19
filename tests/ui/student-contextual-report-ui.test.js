"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../../student-dashboard.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "../../js/student.js"), "utf8");
for (const id of ["student-report-year", "student-report-period",
  "btn-refresh-academic-results", "student-academic-results-container"]) {
  assert.ok(html.includes('id="' + id + '"'), "missing report UI control " + id);
}
assert.ok(js.includes("fetchApi('EXAM', 'getStudentAcademicReport'"));
assert.ok(js.includes("userId: requestedUserId, anoId, periodoId"));
assert.ok(js.includes("res.data.libroConsolidado"));
assert.ok(js.includes("Ver desglose de evaluación"));
assert.ok(js.includes("category.notaFinalAplicada"));
assert.ok(js.includes("category.recuperacionAplicada === true"));
assert.ok(js.includes("item.ponderacionPendiente"));

assert.ok(js.includes("report.esDocumentoOficial === true"));
assert.ok(js.includes("studentAcademicReportRequestVersion"));
assert.ok(js.includes('requestedUserId !== String(currentUser?.userId || "").trim()'),
  "stale report responses must not leak between switched students");
assert.ok(!js.includes("const califs = res.data.calificaciones || []"),
  "student report must not fall back to legacy uncontextualized grades");
process.stdout.write("student-contextual-report-ui: PASS (9 contracts)\\n");
