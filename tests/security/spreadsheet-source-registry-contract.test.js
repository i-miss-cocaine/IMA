"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
  const marker = "function " + name + "(";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === String.fromCharCode(96)) { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}

function makeSheet(initialRows) {
  const rows = (initialRows || []).map(row => row.slice());
  return {
    _rows:rows,
    getLastRow() { return rows.length; },
    getLastColumn() { return rows.reduce((max, row) => Math.max(max, row.length), 0); },
    getDataRange() {
      const width = this.getLastColumn();
      return { getValues:() => rows.map(row => Array.from({length:width}, (_,i) => row[i] === undefined ? "" : row[i])) };
    },
    getRange(row, column, numRows, numColumns) {
      return {
        getValues() {
          const result = [];
          for (let r=0; r<numRows; r++) {
            const source = rows[row - 1 + r] || [];
            result.push(Array.from({length:numColumns}, (_,c) => source[column - 1 + c] === undefined ? "" : source[column - 1 + c]));
          }
          return result;
        },
        setValues(values) {
          values.forEach((valuesRow, r) => {
            const targetIndex = row - 1 + r;
            while (rows.length <= targetIndex) rows.push([]);
            for (let c=0; c<numColumns; c++) rows[targetIndex][column - 1 + c] = valuesRow[c] === undefined ? "" : valuesRow[c];
          });
        }
      };
    },
    appendRow(row) { rows.push(row.slice()); },
    insertRowBefore(rowIndex) { rows.splice(rowIndex - 1, 0, []); }
  };
}

function makeHarness(source, initialRows) {
  const registrySheet = initialRows === undefined ? null : makeSheet(initialRows);
  const registry = {
    getSheetByName(name) { return name === "CatalogoSpreadsheets" ? registrySheet : null; },
    insertSheet(name) {
      assert.equal(name, "CatalogoSpreadsheets");
      const created = makeSheet([]);
      this.getSheetByName = requested => requested === name ? created : null;
      this._created = created;
      return created;
    }
  };
  const targets = new Map();
  ["TGT-1","TGT-2","TGT-3","TGT-4","TGT-5","TGT-9"].forEach(id => targets.set(id, {
    getId:() => id, getName:() => "Spreadsheet " + id, getSheets:() => [{}]
  }));
  const stats = { locks:0, releases:0, uuid:0 };
  const context = {
    SPREADSHEET_ID:"REGISTRY",
    SpreadsheetApp:{ openById(id) {
      if (id === "REGISTRY") return registry;
      if (targets.has(id)) return targets.get(id);
      throw new Error("not found");
    } },
    LockService:{ getScriptLock() { return {
      waitLock() { stats.locks++; },
      releaseLock() { stats.releases++; }
    }; } },
    Utilities:{ getUuid() { stats.uuid++; return "00000000-0000-4000-8000-" + String(stats.uuid).padStart(12,"0"); } },
    Date, Object, String, Number, Array, RegExp, Error
  };
  const constantStart = source.indexOf("const SOURCE_REGISTRY_HEADERS_ = [");
  assert.notEqual(constantStart, -1, "source registry headers missing");
  const constantEnd = source.indexOf("];", constantStart) + 2;
  const names = [
    "normalizeSpreadsheetSourceHeader_","normalizeSpreadsheetSourceText_","normalizeSpreadsheetSourceContext_",
    "getSpreadsheetSourceKey_","ensureSpreadsheetSourceSchema_","getSpreadsheetSourceRecords_",
    "isSpreadsheetSourceActive_","normalizeSpreadsheetSourceStatus_","validateSpreadsheetSourceTarget_",
    "registerSpreadsheetSource","resolveSpreadsheetSource","getSpreadsheetCatalog"
  ];
  const snippets = [source.slice(constantStart, constantEnd), ...names.map(name => extractFunction(source, name))];
  vm.runInNewContext(snippets.join("\n"), context);
  return { context, registry, sheet:registrySheet || registry._created, stats };
}

function baseContext(overrides) {
  return Object.assign({
    dominioArea:"ACADEMICO", anoLectivo:"2026", departamentoId:"D1",
    servicio:"ACADEMIC", tipoInformacion:"CATALOGO_ASIGNATURAS",
    schemaVersion:"1.0", spreadsheetId:"TGT-1", _verifiedUserId:"director-1"
  }, overrides || {});
}

function runService(path) {
  const source = fs.readFileSync(path, "utf8");
  const harness = makeHarness(source);
  const api = harness.context;
  const first = api.registerSpreadsheetSource(baseContext());
  assert.equal(first.status, "success");
  assert.equal(first.data.usable, true);
  assert.match(first.fuenteId, /^SRC-/);
  assert.equal(harness.sheet._rows[0][0], "FuenteID");
  assert.equal(harness.sheet._rows[0].length, 14, "empty registry gets complete headers");

  const resolved = api.resolveSpreadsheetSource(baseContext({ spreadsheetId:"" }));
  assert.equal(resolved.resolved, true);
  assert.equal(resolved.spreadsheetId, "TGT-1");
  assert.equal(resolved.departamentoId, "D1");
  assert.equal(resolved.servicio, "ACADEMIC");
  assert.equal(resolved.tipoInformacion, "CATALOGO_ASIGNATURAS");

  api.registerSpreadsheetSource(baseContext({ departamentoId:"D2", spreadsheetId:"TGT-2" }));
  api.registerSpreadsheetSource(baseContext({ servicio:"USER", spreadsheetId:"TGT-3" }));
  api.registerSpreadsheetSource(baseContext({ tipoInformacion:"GRADEBOOK", spreadsheetId:"TGT-4" }));
  assert.equal(api.getSpreadsheetCatalog({}).total, 4, "composite keys isolate department, service and information type");
  assert.equal(api.getSpreadsheetCatalog({ departamentoId:"D1", servicio:"ACADEMIC", tipoInformacion:"CATALOGO_ASIGNATURAS" }).total, 1);

  const updated = api.registerSpreadsheetSource(baseContext({ spreadsheetId:"TGT-5" }));
  assert.equal(updated.fuenteId, first.fuenteId, "same composite key updates its row instead of duplicating");
  assert.equal(api.getSpreadsheetCatalog({}).total, 4);
  assert.equal(api.resolveSpreadsheetSource(baseContext({ spreadsheetId:"" })).spreadsheetId, "TGT-5");

  assert.throws(() => api.resolveSpreadsheetSource(baseContext({ departamentoId:"D404", spreadsheetId:"" })), /SOURCE_SPREADSHEET_NOT_FOUND/);
  assert.throws(() => api.resolveSpreadsheetSource(baseContext({ schemaVersion:"2.0", spreadsheetId:"" })), /SOURCE_SCHEMA_VERSION_MISMATCH/);
  assert.throws(() => api.registerSpreadsheetSource(baseContext({ departamentoId:"", spreadsheetId:"TGT-1" })), /SOURCE_CONTEXT_REQUIRED/);
  assert.throws(() => api.registerSpreadsheetSource(baseContext({ departamentoId:"D8", spreadsheetId:"MISSING" })), /SOURCE_SPREADSHEET_UNAVAILABLE/);

  api.registerSpreadsheetSource(baseContext({ departamentoId:"D9", spreadsheetId:"TGT-9", estado:"Inactivo" }));
  assert.throws(() => api.resolveSpreadsheetSource(baseContext({ departamentoId:"D9", spreadsheetId:"" })), /SOURCE_SPREADSHEET_DISABLED/);
  assert.equal(api.getSpreadsheetCatalog({}).total, 4);
  assert.equal(api.getSpreadsheetCatalog({ includeInactive:true }).total, 5);

  const duplicateRow = harness.sheet._rows.find(row => row[0] === first.fuenteId).slice();
  harness.sheet.appendRow(duplicateRow);
  assert.throws(() => api.resolveSpreadsheetSource(baseContext({ spreadsheetId:"" })), /SOURCE_SPREADSHEET_AMBIGUOUS/);
  assert.equal(harness.stats.locks, harness.stats.releases, "every registry lock is released");
}

for (const path of ["backend/academic-service/Code.gs", "backend/user-service/Code.gs"]) runService(path);

const academic = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
const user = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const resolverStart = "const SOURCE_REGISTRY_HEADERS_ = [";
const academicResolver = academic.slice(academic.indexOf(resolverStart), academic.indexOf("\n// [TAREA-F5-019]", academic.indexOf(resolverStart)));
const userResolver = user.slice(user.indexOf(resolverStart), user.indexOf("\n// [TASK-049]", user.indexOf(resolverStart)));
assert.equal(academicResolver, userResolver, "Academic and User source registry contracts must stay identical");

const legacyRows = [["SRC-LEGACY","CIENCIAS","2025","TGT-1","legacy-url","Activo","1.0","old source"]];
const legacy = makeHarness(academic, legacyRows);
const legacyCatalog = legacy.context.getSpreadsheetCatalog({ includeInactive:true });
assert.equal(legacy.sheet._rows[0][0], "FuenteID", "legacy row without headers is migrated by inserting a header row");
assert.equal(legacy.sheet._rows[1][0], "SRC-LEGACY", "legacy source data is preserved");
assert.equal(legacyCatalog.total, 1);
assert.equal(legacyCatalog.data[0].usable, false);
assert.equal(legacyCatalog.data[0].migrationRequired, true);
assert.equal(legacy.sheet._rows[0].length, 14);

const oldHeaders = [["FuenteID","DominioArea","AnoLectivo","SpreadsheetID","UrlAcceso","Estado","SchemaVersion","Observaciones"],
  ["SRC-OLD","CIENCIAS","2025","TGT-1","old-url","Activo","1.0","legacy header"]];
const extended = makeHarness(academic, oldHeaders);
const extendedCatalog = extended.context.getSpreadsheetCatalog({ includeInactive:true });
assert.equal(extended.sheet._rows[0].length, 14, "legacy headers gain the composite key columns at the end");
assert.equal(extended.sheet._rows[1][0], "SRC-OLD", "legacy rows are not overwritten");
assert.equal(extendedCatalog.data[0].migrationRequired, true);

console.log("Spreadsheet source registry contract: composite keys, fail-closed resolution, schema version, access, locking and legacy preservation PASS.");
