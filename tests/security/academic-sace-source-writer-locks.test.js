"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}

function harness(options = {}) {
  const state = { held: false, waits: 0, releases: 0, reads: 0, writes: 0,
    failLock: !!options.failLock, failRead: !!options.failRead };
  const tables = {
    AnosLectivos: [
      ["AnoID", "Nombre", "FechaInicio", "FechaFin", "InicioClases", "FinClases", "Estado", "Rol", "Creado", "Tipo", "FinAdmin", "Limite"],
      ["YEAR-1", "2025", "2025-01-01", "2025-12-31", "", "", "Activo", "Director", "", "", "", ""]
    ],
    PeriodosAcademicos: [
      ["PeriodoID", "AnoID", "Nombre", "Tipo", "FechaInicio", "FechaFin", "Orden", "Estado"],
      ["P1", "YEAR-1", "I Parcial", "Parcial", "2026-01-01", "2026-03-31", 1, "Cerrado"]
    ]
  };
  const assertHeld = () => assert.equal(state.held, true, "sheet access must occur while ScriptLock is held");
  const sheets = {};
  for (const name of Object.keys(tables)) {
    sheets[name] = {
      getDataRange() {
        assertHeld(); state.reads++;
        if (state.failRead) throw new Error("read failed");
        return { getValues() { return tables[name].map(row => row.slice()); } };
      },
      getLastRow() { assertHeld(); return tables[name].length; },
      appendRow(row) { assertHeld(); state.writes++; tables[name].push(row.slice()); },
      getRange(row, col) {
        assertHeld();
        return { setValue(value) { assertHeld(); state.writes++; tables[name][row - 1][col - 1] = value; } };
      }
    };
  }
  const lock = {
    waitLock(ms) {
      state.waits++; assert.equal(ms, 10000);
      if (state.failLock || state.held) throw new Error("busy");
      state.held = true;
    },
    releaseLock() { assert.equal(state.held, true); state.held = false; state.releases++; }
  };
  const context = {
    SPREADSHEET_ID: "TEST",
    LockService: { getScriptLock() { return lock; } },
    SpreadsheetApp: { openById(id) {
      assert.equal(id, "TEST");
      return { getSheetByName(name) { return sheets[name] || null; } };
    } },
    getOrCreateSheet(ss, name) { return ss.getSheetByName(name); },
    logStructuredEvent() { assertHeld(); },
    Date, String, Object, Array, Error, Math
  };
  vm.createContext(context);
  vm.runInContext(extract("configureSchoolYear") + "\n" + extract("manageAcademicPeriod") +
    "\nthis.configure = configureSchoolYear; this.manage = manageAcademicPeriod;", context);
  return { state, tables, context };
}

const validYear = { authRole: "Director", anoId: "YEAR-1", nombre: "2026",
  fechaInicio: "2026-01-01", fechaFin: "2026-12-31" };
{
  const h = harness(), result = h.context.configure(validYear);
  assert.equal(result.status, "success");
  assert.equal(h.tables.AnosLectivos[1][1], "2026");
  assert.equal(h.state.waits, 1); assert.equal(h.state.releases, 1); assert.equal(h.state.held, false);
}
{
  const h = harness({ failLock: true }), result = h.context.configure(validYear);
  assert.equal(result.code, "LOCK_TIMEOUT");
  assert.equal(h.state.reads, 0); assert.equal(h.state.writes, 0); assert.equal(h.state.releases, 0);
}
{
  const h = harness(), result = h.context.manage({ periodoId: "P1", nombre: "Primer Parcial", estado: "Cerrado" });
  assert.equal(result.status, "success");
  assert.equal(h.tables.PeriodosAcademicos[1][2], "Primer Parcial");
  assert.equal(h.state.waits, 1); assert.equal(h.state.releases, 1); assert.equal(h.state.held, false);
}
{
  const h = harness(), result = h.context.manage({ anoId: "YEAR-1", nombre: "Segundo Parcial",
    fechaInicio: "2026-04-01", fechaFin: "2026-06-30" });
  assert.equal(result.status, "success"); assert.equal(h.tables.PeriodosAcademicos.length, 3);
  assert.equal(h.state.releases, 1); assert.equal(h.state.held, false);
}
{
  const h = harness({ failLock: true });
  assert.throws(() => h.context.manage({ periodoId: "P1", estado: "Activo" }), /LOCK_TIMEOUT/);
  assert.equal(h.state.reads, 0); assert.equal(h.state.writes, 0); assert.equal(h.state.releases, 0);
}
{
  const h = harness({ failRead: true }), result = h.context.configure(validYear);
  assert.equal(result.status, "error"); assert.equal(h.state.releases, 1); assert.equal(h.state.held, false);
}
{
  const h = harness({ failRead: true });
  assert.throws(() => h.context.manage({ periodoId: "P1", estado: "Activo" }), /read failed/);
  assert.equal(h.state.releases, 1); assert.equal(h.state.held, false);
}
console.log("PASS: 7 Academic SACE source-writer lock contracts");
