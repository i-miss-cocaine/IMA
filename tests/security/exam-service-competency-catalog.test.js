"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const backend = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
const teacher = fs.readFileSync(path.join(__dirname, "../../js/teacher.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../../teacher-dashboard.html"), "utf8");
new vm.Script(backend, { filename: "backend/exam-service/Code.gs" });
new vm.Script(teacher, { filename: "js/teacher.js" });
function extract(name) {
  const match = new RegExp("function " + name + "\\s*\\(").exec(backend);
  assert.ok(match, "missing " + name);
  const start = backend.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = start; i < backend.length; i++) {
    const c = backend[i], next = backend[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return backend.slice(match.index, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const headers = ["ID", "InstitutionID", "AnoID", "Grado", "AsignaturaID", "CompetenciaID",
  "Competencia", "IndicadorID", "Indicador", "ProgramaCurricular", "Estado",
  "RegisteredBy", "CreatedAt", "UpdatedAt", "ContextKey"];
function norm(value) { return String(value == null ? "" : value).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toLowerCase(); }
const sandbox = { normalizeString: norm };
vm.runInNewContext(extract("competencyCatalogContextKey_") + "\\n" +
  extract("getCompetencyCatalogUnlocked_") + ";this.read=getCompetencyCatalogUnlocked_;", sandbox);
function row(id, institution, year, grade, subject, competency, indicator, program, state = "ACTIVE") {
  const item = { institutionId: institution, anoId: year, grado: grade, asignaturaId: subject,
    competenciaId: competency, indicadorId: indicator, programaCurricular: program };
  return [id, institution, year, grade, subject, competency, "Competencia " + competency,
    indicator, "Indicador " + indicator, program, state, "ADMIN", "2026-01-01", "2026-01-01",
    sandbox.competencyCatalogContextKey_(item)];
}
function fixture(rows) {
  const values = [headers, ...rows];
  return { ss: { getSheetByName: name => name === "CatalogoCompetencias"
    ? { getDataRange: () => ({ getValues: () => values.map(r => r.slice()) }) } : null },
    scope: { institutionId: "INST-A", authorized: true } };
}
const valid = row("C1", "INST-A", "2026", "10", "MAT", "COMP-1", "IND-1", "PLAN-A");
let result = sandbox.read({ anoId: "2026", grado: "10", asignaturaId: "MAT" }, fixture([
  valid, row("C2", "INST-B", "2026", "10", "MAT", "COMP-2", "IND-2", "PLAN-A"),
  row("C3", "INST-A", "2025", "10", "MAT", "COMP-3", "IND-3", "PLAN-A"),
  row("C4", "INST-A", "2026", "10", "MAT", "COMP-4", "IND-4", "PLAN-A", "INACTIVE")
]));
assert.equal(result.total, 1);
assert.equal(result.data[0].competenciaId, "COMP-1");
assert.equal(result.data[0].indicadorId, "IND-1");
assert.throws(() => sandbox.read({}, fixture([valid, valid])), /COMPETENCY_CATALOG_DUPLICATE_ENTRY/);
const bad = fixture([valid]);
bad.ss.getSheetByName = () => ({ getDataRange: () => ({ getValues: () => [headers.slice(0, 8)] }) });
assert.throws(() => sandbox.read({}, bad), /COMPETENCY_CATALOG_SCHEMA_INVALID/);
for (const contract of [
  "function getCompetencyCatalog(payload)",
  "function saveCompetencyCatalogItem(payload)",
  "COMPETENCY_CATALOG_LOCK_TIMEOUT",
  "getVerifiedExamDepartmentScope_(p, ss, actor)",
  "COMPETENCY_CATALOG_ITEM_NOT_FOUND",
  "catalogMatches.length !== 1",
  "COMPETENCY_CATALOG_CONTEXT_REQUIRED"
]) assert.ok(backend.includes(contract), "missing backend contract " + contract);
for (const id of ["gb-catalog-program", "gb-catalog-competency-id", "gb-catalog-competency-name",
  "gb-catalog-indicator-id", "gb-catalog-indicator-name", "btn-gb-save-catalog-item",
  "gb-competency-catalog"]) assert.ok(html.includes('id="' + id + '"'), "missing UI " + id);
for (const contract of ["fetchApi('EXAM', 'getCompetencyCatalog'",
  "fetchApi('EXAM', 'saveCompetencyCatalogItem'", "gradebookCatalogRequestVersion",
  "requestVersion !== gradebookCatalogRequestVersion", "programaCurricular: String(gradebookCompetencyCatalog"]) {
  assert.ok(teacher.includes(contract), "missing teacher integration " + contract);
}
process.stdout.write("exam-service-competency-catalog: PASS (18 contracts)\\n");
