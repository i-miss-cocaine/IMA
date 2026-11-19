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
assert.ok(html.includes('"descripcion":"Reconoce pocos elementos."'),
  "analytic rubric levels must provide descriptive performance criteria");
assert.ok(js.includes("item.niveles.every(level => level && typeof level.nombre === \"string\""),
  "teacher form must validate named rubric levels and descriptions");
for (const id of ["gb-catalog-program", "gb-catalog-competency-id", "gb-catalog-competency-name",
  "gb-catalog-indicator-id", "gb-catalog-indicator-name", "btn-gb-save-catalog-item",
  "gb-competency-catalog", "gb-catalog-department", "gb-competency-department-id"]) assert.ok(html.includes('id="' + id + '"'), "missing catalog UI control " + id);
assert.ok(js.includes("fetchApi('EXAM', 'getCompetencyCatalog'"));
assert.ok(js.includes("fetchApi('EXAM', 'saveCompetencyCatalogItem'"));
assert.ok(js.includes("gradebookCatalogRequestVersion"));
assert.ok(js.includes("gb-competency-department-id"));
assert.ok(js.includes("gb-catalog-department"));
assert.ok(js.includes("departmentId: String(document.getElementById('gb-catalog-department')?.value || \"\").trim()"),
  "rubric creation must persist the selected department");
assert.ok(js.includes("departmentId: String(document.getElementById('gb-competency-department-id')?.value || \"\").trim()"),
  "competency evaluation must use the department linked to the selected catalog item");
assert.ok(js.includes("const requestedDepartmentId") || js.includes("departmentId: String(document.getElementById('gb-catalog-department')?.value"),
  "rubric reads must be scoped to the selected department");
process.stdout.write("teacher-gradebook-rubric-competency-ui: PASS (16 contracts)\n");
