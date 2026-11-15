"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
function extract(name) {
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
  getRange(row, column, rowCount = 1, columnCount = 1) {
    return {
      getValues: () => this.rows.slice(row - 1, row - 1 + rowCount).map(item => item.slice(column - 1, column - 1 + columnCount)),
      setValues: values => values.forEach((item, index) => { this.rows[row - 1 + index] = item.slice(); }),
      setValue: value => { if (!this.rows[row - 1]) this.rows[row - 1] = []; this.rows[row - 1][column - 1] = value; }
    };
  }
  appendRow(row) { this.rows.push(row.slice()); }
  deleteRow(row) { this.rows.splice(row - 1, 1); }
}
const schema = { sheet: "ExpedientesEstudiantes", headers: [
  "ExpedienteID","PersonaID","CodigoInstitucional","FechaNacimiento","Nacionalidad","DireccionResidencia",
  "FotografiaUrl","EstadoExpediente","FechaCreacion","FechaActualizacion","Observaciones"
] };
const sheets = new Map();
const spreadsheet = {
  getSheetByName(name) { return sheets.get(name) || null; },
  insertSheet(name) { const sheet = new Sheet(); sheets.set(name, sheet); return sheet; }
};
let lockCount = 0, releaseCount = 0;
const runtime = {
  MIGRATION_WRITER_SCHEMAS_: { estudiante: schema },
  MIGRATION_WRITER_JOURNAL_HEADERS_: ["IdempotencyKey","TipoEntidad","IdNuevoPlataforma","PayloadJSON","Estado","Accion","FilaAnteriorJSON","FilaNuevaJSON","Fecha","CorrelationId"],
  SPREADSHEET_ID: "ACADEMIC-SHEET",
  Date, String, JSON, Array, Object, Number, Math, RegExp, Error,
  Utilities: { DigestAlgorithm: { SHA_256: "SHA_256" },
    computeDigest: (_algorithm, value) => Array.from(crypto.createHash("sha256").update(String(value)).digest()) },
  SpreadsheetApp: { openById: id => { assert.equal(id, "ACADEMIC-SHEET"); return spreadsheet; } },
  LockService: { getScriptLock: () => ({ waitLock(ms) { assert.equal(ms, 10000); lockCount++; }, releaseLock() { releaseCount++; } }) }
};
const names = [
  "migrationStableJson_", "migrationHash_", "migrationNormalizeImportDate_", "migrationSafeCell_",
  "migrationEncodeSnapshot_", "migrationDecodeSnapshot_", "ensureMigrationWriterSheet_",
  "applyTrustedMigrationWrite_", "compensateTrustedMigrationWrite_"
];
vm.runInNewContext(names.map(extract).join("\n") +
  "\nthis.api={write:applyTrustedMigrationWrite_,compensate:compensateTrustedMigrationWrite_};", runtime);
const payload = {
  tipoEntidad: "estudiante", idNuevoPlataforma: "EXP-1", idempotencyKey: "STUDENT-KEY-1",
  correlationId: "CORR-STUDENT-1", targetSnapshotVerified: true, expectedTargetPresent: false,
  expectedTargetRowHash: "",
  datos: { PersonaID: "PER-1", CodigoInstitucional: "=FORMULA()", FechaNacimiento: "2004-05-06",
    EstadoExpediente: "Activo", Observaciones: "Importación" }
};
{
  const result = runtime.api.write(payload);
  assert.equal(result.status, "success");
  assert.equal(result.accion, "INSERT");
  const target = sheets.get("ExpedientesEstudiantes");
  assert.equal(target.rows.length, 2);
  assert.equal(target.rows[1][0], "EXP-1");
  assert.equal(target.rows[1][2], "'=FORMULA()", "formula-like student identifiers are neutralized");
  assert.ok(target.rows[1][3] instanceof Date);
  assert.equal(target.rows[1][3].toISOString(), "2004-05-06T00:00:00.000Z");
  assert.equal(runtime.api.write(payload).idempotent, true);
  assert.equal(target.rows.length, 2, "retries do not duplicate student records");
  assert.equal(runtime.api.compensate({ idempotencyKey: "STUDENT-KEY-1" }).compensated, true);
  assert.equal(target.rows.length, 1, "compensation removes the inserted student record");
}
{
  const target = new Sheet([schema.headers, ["EXP-2","PER-2","CODE-2",new Date("2003-01-01T00:00:00.000Z"),"HN","","","Activo","","",""]]);
  sheets.set("ExpedientesEstudiantes", target);
  const before = {};
  schema.headers.forEach((header, index) => { before[header] = target.rows[1][index]; });
  const update = { ...payload, idNuevoPlataforma: "EXP-2", idempotencyKey: "STUDENT-KEY-2",
    expectedTargetPresent: true, expectedTargetRowHash: runtime.migrationHash_(runtime.migrationStableJson_(before)),
    datos: { PersonaID: "PER-2", CodigoInstitucional: "CODE-2B", FechaNacimiento: "2003-02-02",
      Nacionalidad: "HN", EstadoExpediente: "Activo" } };
  assert.equal(runtime.api.write(update).accion, "UPDATE");
  assert.equal(target.rows[1][2], "CODE-2B");
  assert.equal(runtime.api.compensate({ idempotencyKey: "STUDENT-KEY-2" }).compensated, true);
  assert.equal(target.rows[1][2], "CODE-2");
  assert.equal(target.rows[1][3].toISOString(), "2003-01-01T00:00:00.000Z");
}
{
  const target = new Sheet([schema.headers, ["EXP-3","PER-3","CODE-3","","","","","Activo","","",""]]);
  sheets.set("ExpedientesEstudiantes", target);
  const before = {};
  schema.headers.forEach((header, index) => { before[header] = target.rows[1][index]; });
  const stale = { ...payload, idNuevoPlataforma: "EXP-3", idempotencyKey: "STUDENT-KEY-3",
    expectedTargetPresent: true, expectedTargetRowHash: runtime.migrationHash_(runtime.migrationStableJson_(before)),
    datos: { PersonaID: "PER-3", CodigoInstitucional: "CHANGED" } };
  target.rows[1][2] = "CONCURRENT-UPDATE";
  assert.throws(() => runtime.api.write(stale), /IMPORT_TARGET_CHANGED_AFTER_PREVIEW/);
  assert.equal(target.rows[1][2], "CONCURRENT-UPDATE", "stale preview cannot overwrite a concurrent student update");
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "STUDENT-DATE-INVALID",
    datos: { PersonaID: "PER-1", FechaNacimiento: "not-a-date" } }), /MIGRATION_DATE_INVALID/);
}
assert.equal(lockCount, releaseCount, "all Academic writer paths release the script lock");
process.stdout.write("ACADEMIC student migration writer: insert/update, idempotency, compensation, date normalization, stale-write rejection and formula safety PASS.\n");
