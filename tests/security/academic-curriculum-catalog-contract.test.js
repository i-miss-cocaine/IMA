"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}

function makeSheet(headers, initialRows) {
  const header = headers.slice();
  const rows = (initialRows || []).map(row => row.slice());
  return {
    getLastColumn: () => header.length,
    getLastRow: () => rows.length + 1,
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          if (row === 1 && (numRows || 1) === 1) return [header.slice(col - 1, col - 1 + (numCols || 1))];
          return [];
        },
        setValue(value) { header[col - 1] = value; },
        setValues(values) { values[0].forEach((value, index) => { header[col - 1 + index] = value; }); }
      };
    },
    getDataRange: () => ({ getValues: () => [header.slice(), ...rows.map(row => row.slice())] }),
    appendRow: row => rows.push(row.slice()),
    _header: header,
    _rows: rows
  };
}

const functions = [
  extractFunction("getStudyPlanColumnMap_"),
  extractFunction("normalizeStudyPlanValidity_"),
  extractFunction("getStudyPlans"),
  extractFunction("createStudyPlan")
].join("\n");

function contextFor(sheet) {
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({}) },
    getOrCreateSheet: (_ss, name) => { assert.equal(name, "PlanesEstudio"); return sheet; },
    Utilities: { getUuid: () => "00000000-0000-4000-8000-000000000001" },
    Date, Number, String, Error
  };
  vm.runInNewContext(functions + "\nthis.readPlans=getStudyPlans;this.createPlan=createStudyPlan;", context);
  return context;
}

const canonical = makeSheet(
  ["PlanID","Nombre","Version","Grado","VigenciaInicio","VigenciaFin","Estado"],
  [["PLAN-1","BTP","1.0","12","2026","2027","Vigente"]]
);
const canonicalContext = contextFor(canonical);
const listed = canonicalContext.readPlans({});
assert.equal(listed.data[0].estado, "Vigente", "canonical Estado column is read by header, not fixed offset");
assert.equal(listed.data[0].vigenciaInicio, "2026");
assert.equal(listed.data[0].vigenciaFin, "2027");
assert.equal(listed.data[0].vigencia, "2026 - 2027");
const created = canonicalContext.createPlan({
  nombre: "BTP Técnico", grado: "12", version: "2.0",
  vigenciaInicio: "2028-01-01", vigenciaFin: "2029-12-31"
});
assert.equal(created.data.planId, "PLAN-00000000-0000-4000-8000-000000000001");
assert.equal(canonical._rows[1][4], "2028-01-01");
assert.equal(canonical._rows[1][5], "2029-12-31");
assert.equal(canonical._rows[1][6], "Vigente");
assert.throws(() => canonicalContext.createPlan({
  nombre: "BTP Técnico", grado: "12", version: "2.0",
  vigenciaInicio: "2028-01-01", vigenciaFin: "2029-12-31"
}), /Ya existe una versión/);
assert.throws(() => canonicalContext.createPlan({
  nombre: "Rango inválido", grado: "12", vigenciaInicio: "2029", vigenciaFin: "2028"
}), /no puede ser posterior/);
assert.throws(() => canonicalContext.createPlan({ nombre: "Sin vigencia", grado: "12" }), /Vigencia inválida/);

const legacy = makeSheet(
  ["PlanID","Nombre","Version","Grado","Estado","Vigencia"],
  [["PLAN-OLD","Plan heredado","1.0","11","Vigente","2025"]]
);
const legacyContext = contextFor(legacy);
const legacyListed = legacyContext.readPlans({});
assert.equal(legacyListed.data[0].estado, "Vigente", "legacy Estado remains in its original column");
assert.equal(legacyListed.data[0].vigencia, "2025");
assert.equal(legacyListed.data[0].vigenciaLegacyOnly, true);
const legacyCreated = legacyContext.createPlan({
  nombre: "Plan nuevo", grado: "11", version: "1.0", vigencia: "2026"
});
assert.equal(legacyCreated.status, "success");
assert.deepEqual(legacy._header, ["PlanID","Nombre","Version","Grado","Estado","Vigencia","VigenciaInicio","VigenciaFin"]);
const newLegacyRow = legacy._rows[1];
assert.equal(newLegacyRow[4], "Vigente", "legacy Estado column is not overwritten");
assert.equal(newLegacyRow[5], "", "legacy Vigencia column is preserved and not repurposed");
assert.equal(newLegacyRow[6], "2026");
assert.equal(newLegacyRow[7], "2026");

console.log("academic-curriculum-catalog-contract: PASS (canonical and legacy plan schemas)");
