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
  curso: { sheet: "Cursos", headers: ["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"] },
  empleado: { sheet: "ExpedientesLaborales", headers: ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"] }
};
const sheets = new Map();
const spreadsheet = {
  getSheetByName(name) { return sheets.get(name) || null; },
  insertSheet(name) { const sheet = new Sheet(); sheets.set(name, sheet); return sheet; }
};
let lockCount = 0, releaseCount = 0, lockBusy = false, permission = true, identity = {
  authorized: true, userId: "U-1", role: "Administrador", institutionId: "INST-1"
};
let remoteResponse = { status: "success", accepted: true }, lastEnvelope = null, auditEvents = [];
const secret = "migration-transport-secret-with-more-than-32-characters";
const runtime = {
  MIGRATION_WRITER_SCHEMAS_: schemas,
  MIGRATION_WRITER_JOURNAL_HEADERS_: ["IdempotencyKey","TipoEntidad","IdNuevoPlataforma","PayloadJSON","Estado","Accion","FilaAnteriorJSON","FilaNuevaJSON","Fecha","CorrelationId"],
  MIGRATION_WRITER_JOURNAL_SHEET_: "MigracionEscrituras_ACCOUNTING",
  SPREADSHEET_ID: "SHEET-1",
  Date, String, JSON, Array, Object, Number, Math, RegExp, Error,
  getVerifiedAccountingIdentity_: () => identity,
  recordInterServiceCredentialUsage_: event => { auditEvents.push(event); return { recorded: true }; },
  accountingHasInstitutionalImportPermission_: () => permission,
  migrationHash_: value => crypto.createHash("sha256").update(String(value)).digest("hex"),
  resolveInterServiceSecret_: (sourceService, credentialType, purpose) => {
    assert.equal(sourceService, "ACCOUNTING");
    assert.equal(credentialType, "IMA_MIGRATION_HMAC_SECRET");
    assert.equal(purpose, "SIGN");
    return secret;
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({
    IMA_USER_SERVICE_URL: "https://script.google.com/macros/s/AKfycbUSER123/exec",
    IMA_ACADEMIC_SERVICE_URL: "https://script.google.com/macros/s/AKfycbACADEMIC123/exec",
    IMA_MIGRATION_HMAC_SECRET: secret
  })[key] || "" }) },
  SpreadsheetApp: { openById: id => { assert.equal(id, "SHEET-1"); return spreadsheet; } },
  LockService: { getScriptLock: () => ({
    waitLock(ms) { assert.equal(ms, 10000); if (lockBusy) throw new Error("LOCK_TIMEOUT"); lockCount++; },
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
    assert.ok(["https://script.google.com/macros/s/AKfycbUSER123/exec", "https://script.google.com/macros/s/AKfycbACADEMIC123/exec"].includes(url));
    lastEnvelope = JSON.parse(options.payload);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify(remoteResponse) };
  } }
};
const names = [
  "migrationStableJson_", "migrationNormalizeImportDate_", "normalizeMigrationNaturalKey_", "isAccountingTrustedAppsScriptEndpoint_", "accountingComputeHmacSignature_", "createInterServiceEnvelope",
  "ensureMigrationWriterSheet_", "migrationSafeCell_", "migrationEncodeSnapshot_", "migrationDecodeSnapshot_",
  "applyTrustedAccountingMigrationWrite_", "compensateTrustedAccountingMigrationWrite_", "sendMigrationOwnerRequest_"
];
vm.runInNewContext(names.map(extract).join("\n") +
  "\nthis.api={write:applyTrustedAccountingMigrationWrite_,compensate:compensateTrustedAccountingMigrationWrite_,send:sendMigrationOwnerRequest_,envelope:createInterServiceEnvelope,stable:migrationStableJson_};",
  runtime);

const payload = {
  tipoEntidad: "curso", idNuevoPlataforma: "CURSO-1", idempotencyKey: "KEY-1",
  institutionId: "INST-1", sessionToken: "SIGNED", correlationId: "CORR-0001",
  targetSnapshotVerified: true, expectedTargetPresent: false, expectedTargetRowHash: "",
  datos: { NombreCurso: "=HYPERLINK(\"https://evil.test\")", Categoria: "Capacitación", Modalidad: "Virtual", Estado: "Activo", FechaCreacion: "2026-02-01", UltimaModificacion: "2026-02-02" }
};
{
  const target = new Sheet([schemas.curso.headers]);
  sheets.set("Cursos", target);
  assert.throws(() => runtime.api.write({ ...payload, idNuevoPlataforma: "CURSO-UNVERIFIED",
    idempotencyKey: "KEY-UNVERIFIED", targetSnapshotVerified: false }),
    /IMPORT_TARGET_SNAPSHOT_UNVERIFIED/);
  assert.equal(target.rows.length, 1, "unverified destination cannot receive a new accounting row");
}
{
  const inserted = runtime.api.write(payload);
  assert.equal(inserted.status, "success");
  assert.equal(inserted.idempotent, false);
  const target = sheets.get("Cursos");
  assert.equal(target.rows.length, 2);
  assert.equal(target.rows[1][0], "CURSO-1");
  assert.equal(target.rows[1][1], "'=HYPERLINK(\"https://evil.test\")", "formula-like imported text is neutralized");
  assert.ok(target.rows[1][10] instanceof Date, "ISO date values are stored as spreadsheet dates");
  assert.equal(target.rows[1][10].toISOString(), "2026-02-01T00:00:00.000Z");
  assert.ok(target.rows[1][11] instanceof Date, "last-modified ISO dates are normalized");
  assert.equal(target.rows[1][11].toISOString(), "2026-02-02T00:00:00.000Z");
  assert.equal(sheets.get("MigracionEscrituras_ACCOUNTING").rows.length, 2);
  const retry = runtime.api.write(payload);
  assert.equal(retry.idempotent, true);
  assert.equal(target.rows.length, 2, "idempotent retry does not duplicate rows");
  assert.throws(() => runtime.api.write({ ...payload, datos: { ...payload.datos, Categoria: "Otra" } }), /MIGRATION_IDEMPOTENCY_CONFLICT/);
  const compensated = runtime.api.compensate({ idempotencyKey: "KEY-1" });
  assert.equal(compensated.compensated, true);
  assert.equal(target.rows.length, 1, "insert compensation removes only the owned row");
  assert.equal(runtime.api.compensate({ idempotencyKey: "KEY-1" }).idempotent, true);
  assert.throws(() => runtime.api.write(payload), /MIGRATION_WRITE_ALREADY_COMPENSATED/);
}
{
  const expectedBefore = { CursoID: "CURSO-2", NombreCurso: "Antes", Categoria: "Capacitación", ProveedorResponsable: "", Modalidad: "Virtual", DuracionHoras: "", Requisitos: "", DirigidoA: "", Estado: "Activo", CreadoPor: "", FechaCreacion: "", UltimaModificacion: "" };
  const target = new Sheet([schemas.curso.headers, schemas.curso.headers.map(header => expectedBefore[header] === undefined ? "" : expectedBefore[header])]);
  sheets.set("Cursos", target);
  const updatePayload = { ...payload, idNuevoPlataforma: "CURSO-2", idempotencyKey: "KEY-2",
    targetSnapshotVerified: true, expectedTargetPresent: true,
    expectedTargetRowHash: runtime.migrationHash_(runtime.api.stable(expectedBefore)),
    datos: { NombreCurso: "Después", Categoria: "Capacitación", Modalidad: "Presencial", Estado: "Activo" } };
  const updated = runtime.api.write(updatePayload);
  assert.equal(updated.accion, "UPDATE");
  assert.equal(target.rows[1][1], "Después");
  assert.equal(runtime.api.compensate({ idempotencyKey: "KEY-2" }).compensated, true);
  assert.deepEqual(target.rows[1], schemas.curso.headers.map((header, index) => expectedBefore[header] === undefined ? "" : expectedBefore[header]), "update compensation restores the exact prior row");
}
{
  const routedPayload = { ...payload, idNuevoPlataforma: "CURSO-ROUTE", idempotencyKey: "KEY-ROUTE",
    expectedTargetPresent: false, datos: { NombreCurso: "Routed", Categoria: "Gestión" } };
  const routed = runtime.api.send("ACCOUNTING", "writeMigratedEntity", routedPayload);
  assert.equal(routed.status, "success");
  assert.equal(routed.accion, "INSERT", "ACCOUNTING owner dispatch reaches the journaled local writer");
  const routedCompensation = runtime.api.send("ACCOUNTING", "compensateMigratedEntity", { idempotencyKey: "KEY-ROUTE" });
  assert.equal(routedCompensation.compensated, true);
  assert.equal(sheets.get("Cursos").rows.some(row => row[0] === "CURSO-ROUTE"), false);
}
{
  const expected = { CursoID: "CURSO-3", NombreCurso: "Original", Categoria: "Capacitación", ProveedorResponsable: "", Modalidad: "Virtual", DuracionHoras: "", Requisitos: "", DirigidoA: "", Estado: "Activo", CreadoPor: "", FechaCreacion: "", UltimaModificacion: "" };
  const target = new Sheet([schemas.curso.headers, schemas.curso.headers.map(header => expected[header] === undefined ? "" : expected[header])]);
  sheets.set("Cursos", target);
  const stale = { ...payload, idNuevoPlataforma: "CURSO-3", idempotencyKey: "KEY-STALE",
    expectedTargetPresent: true, expectedTargetRowHash: runtime.migrationHash_(runtime.api.stable(expected)),
    datos: { NombreCurso: "Importado", Categoria: "Capacitación", Modalidad: "Virtual", Estado: "Activo" } };
  target.rows[1][2] = 61;
  assert.throws(() => runtime.api.write(stale), /IMPORT_TARGET_CHANGED_AFTER_PREVIEW/);
  assert.equal(target.rows[1][2], 61, "stale preview never overwrites a concurrent target edit");
}
{
  permission = false;
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-DENIED" }), /IMPORT_PERMISSION_DENIED/);
  permission = true;
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-FIELD", datos: { Unknown: "x" } }), /MIGRATION_FIELD_NOT_ALLOWED/);
    assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-DATE-INVALID", datos: { NombreCurso: "Invalid", FechaCreacion: "not-a-date" } }), /MIGRATION_DATE_INVALID/);
  assert.throws(() => runtime.api.write({ ...payload, idempotencyKey: "KEY-TENANT", institutionId: "INST-2" }), /AUTH_PERMISSION_DENIED/);
}
{
  const result = runtime.api.send("USER", "registerMigratedResourceOwnership", { sessionToken: "SIGNED", resourceId: "EMP-1" });
  assert.equal(result.accepted, true);
  assert.equal(lastEnvelope.sourceService, "ACCOUNTING");
  assert.ok(auditEvents.some(event => event.direction === "OUTBOUND" && event.sourceService === "ACCOUNTING"), "migration owner request usage is audited");
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
  const originalProperties = runtime.PropertiesService.getScriptProperties;
  runtime.PropertiesService.getScriptProperties = () => ({ getProperty: key =>
    key === "IMA_USER_SERVICE_URL" ? "https://evil.example/exec" :
    key === "IMA_MIGRATION_HMAC_SECRET" ? secret : "" });
  assert.throws(() => runtime.api.send("USER", "registerMigratedResourceOwnership", {}), /MIGRATION_OWNER_SERVICE_NOT_CONFIGURED/,
    "arbitrary HTTPS endpoints are rejected before outbound requests");
  runtime.PropertiesService.getScriptProperties = originalProperties;
}
{
  const employeePayload = { ...payload, tipoEntidad: "empleado", idNuevoPlataforma: "EMP-1", idempotencyKey: "KEY-EMP",
    expectedTargetPresent: false,
    datos: { PersonaId: "PER-1", UserId: "U-1", Puesto: "Docente", Departamento: "DEP-A",
      CentroCosto: "CC-1", FechaIngreso: "2026-02-01", EstadoLaboral: "ACTIVO", Observaciones: "Alta" } };
  const employeeWrite = runtime.api.write(employeePayload);
  assert.equal(employeeWrite.status, "success");
  const employeeSheet = sheets.get("ExpedientesLaborales");
  assert.equal(employeeSheet.rows[1][0], "EMP-1");
  assert.equal(employeeSheet.rows[1][1], "PER-1");
  assert.ok(employeeSheet.rows[1][6] instanceof Date, "employee start date is normalized");
  assert.equal(runtime.api.compensate({ idempotencyKey: "KEY-EMP" }).compensated, true);
  assert.equal(employeeSheet.rows.length, 1, "employee insert compensation removes the exact inserted row");
}
{
  const target = sheets.get("Cursos");
  const beforeRows = target.rows.map(row => row.slice());
  lockBusy = true;
  assert.throws(() => runtime.api.write({ ...payload, idNuevoPlataforma: "CURSO-LOCK", idempotencyKey: "KEY-LOCK" }), /LOCK_TIMEOUT/);
  lockBusy = false;
  assert.deepEqual(target.rows, beforeRows, "lock contention prevents any partial row mutation");
}
{
  const target = new Sheet([schemas.curso.headers,
    ["CURSO-OLD","Curso duplicado","","","","","","","Activo","","",""]]);
  sheets.set("Cursos", target);
  assert.throws(() => runtime.api.write({ ...payload, idNuevoPlataforma: "CURSO-NEW", idempotencyKey: "KEY-NATURAL-DUP",
    targetSnapshotVerified: true, expectedTargetPresent: false, expectedTargetRowHash: "",
    datos: { NombreCurso: "Curso duplicado", Categoria: "Capacitación", Modalidad: "Virtual", Estado: "Activo" } }),
    /MIGRATION_NATURAL_KEY_DUPLICATE/);
  assert.equal(target.rows.length, 2, "a natural-key duplicate inserted after preview is rejected under the writer lock");
}
assert.equal(lockCount, releaseCount, "all acquired script locks are released, including failed write paths");
process.stdout.write("Accounting migration writer: insert/update, idempotency, stale snapshot, compensation, lock contention, tenant/permission isolation, formula safety and USER HMAC transport PASS.\n");
