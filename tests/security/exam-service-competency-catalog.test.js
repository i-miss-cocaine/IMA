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
const headers = ["ID", "InstitutionID", "DepartmentID", "AnoID", "Grado", "Seccion",
  "AsignaturaID", "CompetenciaID", "Competencia", "IndicadorID", "Indicador", "ProgramaCurricular",
  "Estado", "RegisteredBy", "CreatedAt", "UpdatedAt", "ContextKey"];
function norm(value) { return String(value == null ? "" : value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }
const sandbox = { normalizeString: norm, COMPETENCY_CATALOG_HEADERS_: headers };
vm.runInNewContext(extract("competencyCatalogContextKey_") + "\n" +
  extract("getCompetencyCatalogUnlocked_") + ";this.read=getCompetencyCatalogUnlocked_;", sandbox);
function row(id, institution, year, grade, subject, competency, indicator, program, state = "ACTIVE") {
  const item = { institutionId: institution, departmentId: "DEPT-A", anoId: year, grado: grade,
    seccion: "A", asignaturaId: subject, competenciaId: competency, indicadorId: indicator,
    programaCurricular: program };
  return [id, institution, "DEPT-A", year, grade, "A", subject, competency, "Competencia " + competency,
    indicator, "Indicador " + indicator, program, state, "ADMIN", "2026-01-01", "2026-01-01",
    sandbox.competencyCatalogContextKey_(item)];
}
function fixture(rows) {
  const values = [headers, ...rows];
  return { ss: { getSheetByName: name => name === "CatalogoCompetencias"
    ? { getDataRange: () => ({ getValues: () => values.map(r => r.slice()) }) } : null },
    scope: { institutionId: "INST-A", departmentIds: ["DEPT-A"], institutionWide: false, authorized: true } };
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

function mutationFixture(options = {}) {
  const state = { held: false, opens: 0, uuid: 0, rowsWritten: 0, nestedError: "" };
  const actor = { authorized: true, userId: "PROF-1", role: "Profesor" };
  const scope = { authorized: true, institutionId: "INST-A", departmentIds: ["DEPT-A"], institutionWide: false };
  function makeSheet(rows, kind) {
    const sheet = {
      rows: rows.map(row => row.slice()),
      getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
      appendRow(row) {
        this.rows.push(row.slice());
        if (kind === "catalog") {
          state.rowsWritten++;
          if (options.onCatalogAppend) options.onCatalogAppend(row.slice());
        }
      },
      getRange(row, column, rowCount, columnCount) {
        return {
          setValues(values) {
            for (let r = 0; r < values.length; r++) {
              for (let c = 0; c < values[r].length; c++) sheet.rows[row - 1 + r][column - 1 + c] = values[r][c];
            }
          },
          setValue(value) { sheet.rows[row - 1][column - 1] = value; }
        };
      }
    };
    return sheet;
  }
  const catalogSheet = makeSheet([], "catalog");
  const configSheet = makeSheet([["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"],
    ["CFG-1", "", "P1", "10", "A", "MAT", "", "", "PROF-1"]], "config");
  const ss = { getSheetByName(name) {
    if (name === "CatalogoCompetencias") return catalogSheet;
    if (name === "ConfiguracionAcademica") return configSheet;
    return null;
  }};
  const lock = {
    tryLock() { if (options.timeout || state.held) return false; state.held = true; return true; },
    releaseLock() { state.held = false; }
  };
  const runtime = {
    COMPETENCY_CATALOG_HEADERS_: headers,
    validateRolePermission: () => ({ authorized: true }),
    getVerifiedExamIdentity_: () => actor,
    LockService: { getScriptLock: () => lock },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    getVerifiedExamDepartmentScope_: () => scope,
    getSheetOrThrow: (spreadsheet, name) => spreadsheet.getSheetByName(name),
    getOrCreateSheet: (spreadsheet, name) => spreadsheet.getSheetByName(name),
    normalizeString: norm,
    Utilities: { getUuid() { state.uuid++; return "UUID-" + state.uuid; } }
  };
  vm.runInNewContext(extract("saveCompetencyCatalogItem") + ";this.save=saveCompetencyCatalogItem;", runtime);
  const payload = { anoId: "2026", grado: "10", seccion: "A", asignaturaId: "MAT", periodoId: "P1",
    competenciaId: "COMP-1", competencia: "Resolver problemas", indicadorId: "IND-1",
    indicador: "Resuelve problemas contextualizados", programaCurricular: "PLAN-A" };
  return { state, catalogSheet, payload, save: p => runtime.save(p || payload) };
}
const mutation = mutationFixture();
const created = mutation.save();
assert.equal(created.status, "success");
assert.equal(mutation.catalogSheet.rows.length, 2);
assert.equal(mutation.catalogSheet.rows[1][2], "DEPT-A");
assert.equal(mutation.catalogSheet.rows[1][5], "A");
assert.deepEqual(JSON.parse(mutation.catalogSheet.rows[1][16]),
  ["inst-a", "dept-a", "2026", "10", "a", "mat", "plan-a", "comp-1", "ind-1"]);
const updated = mutation.save(Object.assign({}, mutation.payload, {
  competencia: "Resolver problemas matemáticos"
}));
assert.equal(updated.actualizado, true);
assert.equal(mutation.catalogSheet.rows.length, 2);
assert.equal(mutation.catalogSheet.rows[1][8], "Resolver problemas matemáticos");
assert.equal(mutation.state.held, false);
const deniedAssignment = mutationFixture();
assert.throws(() => deniedAssignment.save(Object.assign({}, deniedAssignment.payload, { asignaturaId: "SCI" })),
  /RESOURCE_NOT_AVAILABLE/);
assert.equal(deniedAssignment.catalogSheet.rows.length, 0);
const timedOut = mutationFixture({ timeout: true });
assert.throws(() => timedOut.save(), /COMPETENCY_CATALOG_LOCK_TIMEOUT/);
assert.equal(timedOut.state.opens, 0);
let nestedError = "";
const concurrent = mutationFixture({ onCatalogAppend(row) {
  if (String(row[0]).startsWith("COMP-CAT-")) {
    try { concurrent.save(); } catch (error) { nestedError = error.message; }
  }
}});
const outer = concurrent.save();
assert.equal(outer.status, "success");
assert.match(nestedError, /COMPETENCY_CATALOG_LOCK_TIMEOUT/);
assert.equal(concurrent.catalogSheet.rows.length, 2);
assert.equal(concurrent.state.rowsWritten, 2);

process.stdout.write("exam-service-competency-catalog: PASS (24 contracts)\n");
