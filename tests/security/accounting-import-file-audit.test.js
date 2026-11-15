"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

class Sheet {
  constructor(rows = []) { this.rows = rows.map(row => row.slice()); }
  getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; }
  getLastRow() { return this.rows.length; }
  appendRow(row) { this.rows.push(row.slice()); }
  getRange(row, column, rowCount, columnCount) {
    return { setValues: values => values.forEach((value, index) => {
      this.rows[row - 1 + index] = value.slice(0, columnCount);
    }) };
  }
}

const sheet = new Sheet();
let acquired = 0, released = 0, sheetLookups = 0, lockBusy = false;
const runtime = {
  Date, String, Number, JSON, Array, Object, Error,
  getOrCreateSheet(_ss, name) {
    assert.equal(name, "AuditoriaMigracionesArchivos");
    assert.ok(acquired > released, "audit sheet schema is inspected only while the script lock is held");
    sheetLookups++;
    return sheet;
  },
  LockService: { getScriptLock: () => ({
    waitLock(ms) { assert.equal(ms, 10000); if (lockBusy) throw new Error("LOCK_TIMEOUT"); acquired++; },
    releaseLock() { released++; }
  }) }
};
vm.runInNewContext(extractFunction("appendAccountingMigrationFileHashAudit_") +
  "\nthis.audit = appendAccountingMigrationFileHashAudit_;", runtime);

const preview = { runId: "RUN-001", fileHash: "a".repeat(64), previewHash: "b".repeat(64) };
const input = { nombreArchivo: "cursos-renombrado.xlsx", sistemaOrigen: "LEGACY",
  tipoEntidad: "curso", destinoModulo: "ACCOUNTING", correlationId: "CORR-001" };
const actor = { institutionId: "INST-001", userId: "USER-001" };
runtime.audit({}, input, preview, actor, "SUCCESS", 3);
assert.equal(sheet.rows.length, 2);
assert.deepEqual(sheet.rows[0], ["RunId","InstitutionID","NombreArchivo","HashSHA256","PreviewHash","SistemaOrigen",
  "TipoEntidad","DestinoModulo","ActorUserId","Fecha","Estado","RegistrosEscritos","CorrelationId"]);
assert.equal(sheet.rows[1][1], "INST-001");
assert.equal(sheet.rows[1][2], "cursos-renombrado.xlsx");
assert.equal(sheet.rows[1][3], preview.fileHash, "the binary SHA-256 is persisted independently of the filename");
assert.equal(sheet.rows[1][4], preview.previewHash);
assert.equal(sheet.rows[1][10], "SUCCESS");
assert.equal(sheet.rows[1][11], 3);
assert.equal(sheet.rows[1][12], "CORR-001");
assert.throws(() => runtime.audit({}, input, { ...preview, fileHash: "invalid" }, actor, "SUCCESS", 3),
  /MIGRATION_FILE_HASH_REQUIRED/);
assert.equal(sheet.rows.length, 2, "invalid hashes never enter the audit ledger");
runtime.audit({}, input, { ...preview, runId: "RUN-002" }, actor, "SUCCESS", 2);
assert.equal(sheet.rows.length, 3, "subsequent runs append records without duplicating the header");
assert.equal(sheet.rows.filter(row => row[0] === "RunId").length, 1);
const beforeBusyLookups = sheetLookups, beforeBusyRows = sheet.rows.length;
lockBusy = true;
assert.throws(() => runtime.audit({}, input, { ...preview, runId: "RUN-LOCK" }, actor, "SUCCESS", 1), /LOCK_TIMEOUT/);
assert.equal(sheetLookups, beforeBusyLookups, "a lock timeout cannot inspect or mutate the audit sheet");
assert.equal(sheet.rows.length, beforeBusyRows);
assert.equal(acquired, 2);
assert.equal(released, 2, "the audit lock is released after each successful persistence");
process.stdout.write("Accounting migration file audit: institution binding, filename-independent SHA-256 persistence, preview binding, status and lock release PASS.\n");
