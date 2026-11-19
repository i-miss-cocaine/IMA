"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../../teacher-dashboard.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "../../js/teacher.js"), "utf8");
for (const id of ["gb-rubric-title", "gb-rubric-criteria", "gb-rubric-list",
  "gb-competency-student", "gb-competency-id", "gb-indicator-id",
  "gb-competency-rubric", "gb-competency-level", "gb-competency-observations",
  "gb-competency-list"]) assert.ok(html.includes('id="' + id + '"'), "missing UI control " + id);
for (const contract of [
  "fetchApi('EXAM', 'getRubrics'",
  "fetchApi('EXAM', 'saveRubric'",
  "fetchApi('EXAM', 'getCompetencyEvaluations'",
  "fetchApi('EXAM', 'saveCompetencyEvaluation'",
  "renderGradebookAssessmentOptions()",
  "gradebookCompetencyRequestVersion", "gradebookRubricRequestVersion"
]) assert.ok(js.includes(contract), "missing UI integration " + contract);
assert.ok(js.includes("requestVersion !== gradebookRubricRequestVersion"),
  "stale rubric responses must be discarded after context changes");
assert.ok(js.includes("requestVersion !== gradebookCompetencyRequestVersion"),
  "stale competency responses must be discarded");
for (const id of ["gb-catalog-program", "gb-catalog-competency-id", "gb-catalog-competency-name",
  "gb-catalog-indicator-id", "gb-catalog-indicator-name", "btn-gb-save-catalog-item",
  "gb-competency-catalog", "gb-catalog-department", "gb-competency-department-id"]) assert.ok(html.includes('id="' + id + '"'), "missing catalog UI control " + id);
assert.ok(js.includes("fetchApi('EXAM', 'getCompetencyCatalog'"));
assert.ok(js.includes("fetchApi('EXAM', 'saveCompetencyCatalogItem'"));
assert.ok(js.includes("gradebookCatalogRequestVersion"));
assert.ok(js.includes("gradebookCompetencyCatalog[Number(document.getElementById('gb-competency-catalog')?.value)]?.departmentId"));
process.stdout.write("teacher-gradebook-rubric-competency-ui: PASS (16 contracts)\n");
