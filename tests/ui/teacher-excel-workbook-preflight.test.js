"use strict";
// Structural workbook analysis is isolated from browser DOM and persistence.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../../js/teacher.js"), "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced " + name);
}

const XLSX = {
  utils: {
    sheet_to_json(sheet, options) {
      const offset = Number(options && options.range || 0);
      return (sheet.grid || []).slice(offset).map(row => row.slice());
    }
  }
};
const context = { XLSX, Uint8Array, Array, Object, String, Number, Date, RegExp, Error };
vm.createContext(context);
vm.runInContext(
  extractFunction("validateExcelFileEnvelope") + "\n" +
  extractFunction("analyzeExcelWorkbook") +
  "\nthis.validate=validateExcelFileEnvelope;this.analyze=analyzeExcelWorkbook;",
  context
);

function workbook(grid, options = {}) {
  const sheet = Object.assign({ grid, "!merges": [] }, options.sheet || {});
  const names = options.names || ["Datos"];
  const metadata = options.metadata || names.map(name => ({ name, Hidden: 0 }));
  const sheets = {};
  sheets[names[0]] = sheet;
  for (let i = 1; i < names.length; i++) sheets[names[i]] = { grid: [["Auxiliar"]], "!merges": [] };
  return { SheetNames: names, Workbook: { Sheets: metadata }, Sheets: sheets };
}

const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const validEnvelope = context.validate({ name: "libro.xlsx", size: 4, type: mime }, new Uint8Array([0x50,0x4B,0x03,0x04]));
assert.equal(validEnvelope.valid, true);
assert.equal(context.validate({ name: "libro.xls", size: 4, type: mime }, new Uint8Array([0x50,0x4B,0x03,0x04])).valid, false);
assert.equal(context.validate({ name: "libro.xlsx", size: 4, type: "text/plain" }, new Uint8Array([0x50,0x4B,0x03,0x04])).valid, false);
assert.equal(context.validate({ name: "libro.xlsx", size: 0, type: mime }, new Uint8Array([])).valid, false);
assert.ok(context.validate({ name: "libro.xlsx", size: 5, type: mime }, new Uint8Array([0x50,0x4B,0x03,0x04])).errors.some(x => x.code === "FILE_READ_TRUNCATED"));

const simple = workbook([["ID","Nombre","Nota"],["A-1","Ana",95]]);
const good = context.analyze(simple, "Datos", 0);
assert.equal(good.valid, true);
assert.equal(good.data.length, 1);
assert.equal(good.data[0].Nombre, "Ana");
assert.equal(good.previewRows[0][1], "Ana");

const multi = workbook([["ID","Nombre"],["A-1","Ana"]], {
  names: ["Datos","Resumen","Oculta"],
  metadata: [{name:"Datos",Hidden:0},{name:"Resumen",Hidden:0},{name:"Oculta",Hidden:1}]
});
assert.equal(context.analyze(multi, "", 0).valid, false);
assert.ok(context.analyze(multi, "", 0).errors.some(x => x.code === "VISIBLE_SHEET_SELECTION_REQUIRED"));
const chosen = context.analyze(multi, "Datos", 0);
assert.equal(chosen.valid, true);
assert.ok(chosen.warnings.some(x => x.code === "HIDDEN_SHEETS_PRESENT"));

const shifted = context.analyze(workbook([["Reporte institucional"],["ID","Nombre"],["A-2","Luis"]]), "Datos", 1);
assert.equal(shifted.valid, true);
assert.ok(shifted.warnings.some(x => x.code === "HEADER_ROW_SHIFTED"));

const duplicate = context.analyze(workbook([["ID","Nombre","Nombre"],["A-1","Ana","Ana"]]), "Datos", 0);
assert.equal(duplicate.valid, false);
assert.ok(duplicate.errors.some(x => x.code === "DUPLICATE_HEADERS"));

const repeated = context.analyze(workbook([["ID","Nombre"],["A-1","Ana"],["ID","Nombre"]]), "Datos", 0);
assert.equal(repeated.valid, false);
assert.ok(repeated.errors.some(x => x.code === "REPEATED_HEADER_ROWS"));

const blankAndMixed = context.analyze(workbook([["ID","Nota"],["A-1",95],[null,null],["A-2","Aprobado"]], {
  sheet: { "!merges": [{s:{r:0,c:0},e:{r:0,c:1}}] }
}), "Datos", 0);
assert.equal(blankAndMixed.valid, true);
assert.ok(blankAndMixed.warnings.some(x => x.code === "BLANK_ROWS_PRESENT"));
assert.ok(blankAndMixed.warnings.some(x => x.code === "MERGED_CELLS_PRESENT"));
assert.ok(blankAndMixed.warnings.some(x => x.code === "COLUMN_TYPE_INCONSISTENCY"));

const unresolved = workbook([["ID","Valor"],["A-1",null]], { sheet: { C2: { f: "SUM(A1:A1)" } } });
const unresolvedResult = context.analyze(unresolved, "Datos", 0);
assert.equal(unresolvedResult.valid, false);
assert.ok(unresolvedResult.errors.some(x => x.code === "FORMULAS_WITHOUT_CACHED_VALUES"));

const formulaError = workbook([["ID","Valor"],["A-1",null]], { sheet: { B2: { t: "e", v: 23, w: "#REF!" } } });
assert.ok(context.analyze(formulaError, "Datos", 0).errors.some(x => x.code === "FORMULA_CELL_ERRORS"));

const emptyData = context.analyze(workbook([["ID","Nombre"],[null,null]]), "Datos", 0);
assert.equal(emptyData.valid, false);
assert.ok(emptyData.errors.some(x => x.code === "DATA_ROWS_EMPTY"));

console.log("Teacher Excel preflight: extension/MIME/magic bytes, truncation, multi-sheet selection, shifted/duplicate/repeated headers, hidden sheets, merged/blank cells, formula errors and type inconsistencies passed.");
