"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../../teacher-dashboard.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "../../js/teacher.js"), "utf8");

const requiredIds = [
  "nav-gradebook", "section-gradebook", "gb-filter-grado", "gb-filter-seccion",
  "gb-filter-asignatura", "gb-filter-parcial", "gb-table-body", "gb-status-text",
  "gb-status-badge", "btn-gb-config-weights", "btn-gb-register-recovery",
  "btn-gb-close-period", "btn-gb-save-all"
];
for (const id of requiredIds) {
  assert.match(html, new RegExp('id="' + id + '"'), "teacher dashboard must expose " + id);
}
assert.match(js, /navGradebook\?\.addEventListener\('click',[\s\S]*?initGradebookModule\(\)/,
  "gradebook navigation must initialize the visible section");
assert.match(js, /scope\.GranularConfig/, "gradebook filters must derive from assigned academic context");
assert.match(js, /scope\.ParcialActual\s*\|\|\s*window\.PARCIAL_ACTUAL/,
  "gradebook period must use the active institutional period");
assert.match(js, /fetchApi\('EXAM',\s*'getGradebookData'/,
  "gradebook must read the consolidated server source");
assert.match(js, /fetchApi\('EXAM',\s*'saveGradebookGrades'/,
  "gradebook must persist through the authorized server handler");
assert.match(js, /fetchApi\('EXAM',\s*'saveGradebookWeightConfiguration'/,
  "gradebook must save institution/context-specific weights");
assert.match(js, /fetchApi\('EXAM',\s*'saveStudentRecovery'/,
  "recovery must use the contextual gradebook mutation");
assert.match(js, /periodoId:\s*document\.getElementById\('gb-filter-parcial'\)/,
  "recovery must carry the selected academic period");
assert.match(js, /let gradebookRequestVersion = 0/, "gradebook reads must have a monotonic request sequence");
assert.match(js, /if \(requestVersion !== gradebookRequestVersion\) return/,
  "late responses must not overwrite a newer academic context");
assert.match(js, /function getGradebookContextPayload\(\)/,
  "mutations must use the last context returned by the authorized read");
assert.match(js, /const gradebookContext = getGradebookContextPayload\(\)/,
  "period closure must snapshot the loaded academic context");
assert.match(js, /if \(invalidScore\)[\s\S]*No se guardó ningún cambio/,
  "invalid batch scores must be rejected before persistence");
console.log("teacher-gradebook-context-ui: PASS (" + requiredIds.length + " DOM contracts)");
