"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });
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
const schemas = {
  curso: { sheet: "Cursos", headers: ["CursoID", "Nombre", "Nota", "FechaInicio"] },
  empleado: { sheet: "ExpedientesLaborales", headers: ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"] }
};
const sheets = new Map();
const spreadsheet = {
  getSheetByName(name) { return sheets.get(name) || null; },
  insertSheet(name) { const sheet = new Sheet(); sheets.set(name, sheet); return sheet; }
};
let lockCount = 0, releaseCount = 0, permission = true, identity = {
  authorized: true, userId: "U-1", role: "Administrador", institutionId: "INST-1"
};
let remoteResponse = { status: "success", accepted: true }, lastEnvelope = null;
const secret = "migration-transport-secret-with-more-than-32-characters";
const runtime = {
  MIGRATION_WRITER_SCHEMAS_: schemas,
  MIGRATION_WRITER_JOURNAL_HEADERS_: ["IdempotencyKey","TipoEntidad","IdNuevoPlataforma","PayloadJSON","Estado","Accion","FilaAnteriorJSON","FilaNuevaJSON","Fecha","CorrelationId"],
  SPREADSHEET_ID: "SHEET-1",
  Date, String, JSON, Array, Object, Number, Math, RegExp, Error,
  getVerifiedAccountingIdentity_: () => identity,
  accountingHasInstitutionalImportPermission_: () => permission,
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({
    IMA_USER_SERVICE_URL: "https://user.example.test/exec",
    IMA_ACADEMIC_SERVICE_URL: "https://academic.example.test/exec",
    IMA_MIGRATION_HMAC_SECRET: secret
  })[key] || "" }) },
  SpreadsheetApp: { openById: id => { assert.equal(id, "SHEET-1"); return spreadsheet; } },
  LockService: { getScriptLock: () => ({
    waitLock(ms) { assert.equal(ms, 10000); lockCount++; },
    releaseLock() { releaseCount++; }
  }) },
  Utilities: {
    MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
    getUuid: () => "12345678-1234-1234-1234-123456789012",
    computeHmacSignature(_algorithm, message, key) {
      return Array.from(crypto.createHmac("sha256", key).update(String(message)).digest());
    }
  },
  UrlFetchApp: { fetch(url, options) {
    assert.equal(url, "https://user.example.test/exec");
    lastEnvelope = JSON.parse(options.payload);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify(remoteResponse) };
  } }
};
const names = [
  "migrationStableJson_", "accountingComputeHmacSignature_", "createInterServiceEnvelope",
  "ensureMigrationWriterSheet_", "migrationSafeCell_", "migrationEncodeSnapshot_", "migrationDecodeSnapshot_",
  "applyTrustedAccountingMigrationWrite_", "compensateTrustedAccountingMigrationWrite_", "sendMigrationOwnerRequest_"
];
vm.runInNewContext(names.map(extract).join("\n") +
  "\nthis.api={write:applyTrustedAccountingMigrationWrite_,compensate:compensateTrustedAccountingMigrationWrite_,send:sendMigrationOwnerRequest_,envelope:createInterServiceEnvelope};",
  runtime);

const payload = {
  tipoEntidad: "curso", idNuevoPlataforma: "CURSO-1", idempotencyKey: "KEY-1",
  institutionId: "INST-1", sessionToken: "SIGNED", correlationId: "CORR-0001",
  datos: { Nombre: "=HYPERLINK(\"https://evil.test\")", Nota: 90, FechaInicio: "2026-02-01" }
};
{
  const inserted = runtime.api.write(payload);
  assert.equal(inserted.status, "success");
  assert.equal(inserted.idempotent, false);
  const target = sheets.get("Cursos");
  assert.equal(target.rows.length, 2);
  assert.equal(target.rows[1][0], "CURSO-1");
  assert.equal(target.rows[1][1], "'=HYPERLINK(\"https://evil.test\")", "formula-like imported text is neutralized");
  assert.equal(sheets.get("MigracionEscrituras").rows.length, 2);
  const retry = runtime.api.write(payload);
  assert.equal(retry.idempotent, true);
  assert.equal(target.rows.length, 2, "idempotent retry does not duplicate rows");
  assert.throws(() => runtime.api.write({ ...payload, datos: { ...payload.datos, Nota: 91 } }), /MIGRATION_IDEMPOTENCY_CONFLICT/);
  const compensated = runtime.api.compensate({ idempotencyKey: "KEY-1" });
  assert.equal(compensated.compensated, true);
  assert.equal(target.rows.length, 1, "insert compensation removes only the owned row");
  assert.equal(runtime.api.compensate({ idempotencyKey: "KEY-1" }).idempotent, true);
  assert.throws(() => runtime.api.write(payload), /MIGRATION_WRITE_ALREADY_COMPENSATED/);
}
{
  const target = new Sheet([schemas.curso.headers, ["CURSO-2", "Antes", 70, "2025-01-01"]]);
  sheets.set("Cursos", target);
  const updatePayload = { ...payload, idNuevoPlataforma: "CURSO-2", idempotencyKey: "KEY-2",
    datos: { Nombre: "Después", Nota: 88, FechaInicio: "2026-03-01" } };
  const updated = runtime.api.write(updatePayload);
  assert.equal(updated.accion, "UPDATE");
  assert.equal(target.rows[1][1], "Después");
  assert.equal(runtime.api.compensate({ idempotencyKey: "KEY-2" }).compensated, true);
  assert.deepEqual(target.rows[1], ["CURSO-2", "Antes", 70, "2025-01-01"], "update compensation restores the exact prior row");
}
{
  permission = false;
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-DENIED" }), /IMPORT_PERMISSION_DENIED/);
  permission = true;
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-FIELD", datos: { Unknown: "x" } }), /MIGRATION_FIELD_NOT_ALLOWED/);
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-TENANT", institutionId: "INST-2" }), /AUTH_PERMISSION_DENIED/);
}
{
  const result = runtime.api.send("USER", "registerMigratedResourceOwnership", { sessionToken: "SIGNED", resourceId: "EMP-1" });
  assert.equal(result.accepted, true);
  assert.equal(lastEnvelope.sourceService, "ACCOUNTING");
  assert.equal(lastEnvelope.targetService, "USER");
  assert.equal(lastEnvelope.action, "registerMigratedResourceOwnership");
  runtime.api.send("ACADEMIC", "writeMigratedEntity", { sessionToken: "SIGNED", tipoEntidad: "estudiante", idNuevoPlataforma: "EST-1", datos: { PersonaID: "PER-1" } });
  assert.equal(lastEnvelope.targetService, "ACADEMIC", "student entities are written by the ACADEMIC owner service");
  const body = [lastEnvelope.requestId, lastEnvelope.timestamp, lastEnvelope.correlationId,
    lastEnvelope.sourceService, lastEnvelope.targetService, lastEnvelope.action, JSON.stringify(lastEnvelope.payload)].join("|");
  assert.equal(lastEnvelope.hmacSignature, crypto.createHmac("sha256", secret).update(body).digest("hex"),
    "USER owner writes use the exact shared migration HMAC secret and canonical envelope");
  remoteResponse = { status: "error", code: "OWNER_DENIED" };
  assert.throws(() => runtime.api.send("USER", "registerMigratedResourceOwnership", {}), /OWNER_DENIED/);
}
assert.equal(lockCount, releaseCount, "all successful and failed write paths release their script lock");
process.stdout.write("Accounting migration writer: insert/update, idempotency, compensation, tenant/permission isolation, formula safety and USER HMAC transport PASS.\n");
