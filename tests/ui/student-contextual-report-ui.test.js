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
assert.ok(js.includes("userId: currentUser.userId, anoId, periodoId"));
assert.ok(js.includes("res.data.libroConsolidado"));
assert.ok(js.includes("report.esDocumentoOficial === true"));
assert.ok(!js.includes("const califs = res.data.calificaciones || []"),
  "student report must not fall back to legacy uncontextualized grades");
process.stdout.write("student-contextual-report-ui: PASS (9 contracts)\\n");
