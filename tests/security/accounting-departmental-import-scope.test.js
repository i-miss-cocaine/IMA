const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced " + name);
}
const accounting = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
const shared = fs.readFileSync(path.resolve(__dirname, "../../backend/shared/DepartmentCatalogContract.gs"), "utf8");
const names = ["getVerifiedAccountingIdentity_", "getVerifiedDepartmentScopeForSession_", "getVerifiedAccountingDepartmentScope_", "mapMigrationRowToTarget_", "buildAccountingDepartmentalImportPreflight_", "validateImportPreview", "importDataWithColumnMapping"];
const functions = names.map(name => extractFunction(accounting, name));
functions.push(extractFunction(shared, "validateDepartmentalImportScope_"));
const schema = { service: "ACCOUNTING", sheet: "ExpedientesLaborales", headers: ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"] };
const assignmentHeaders = ["AsignacionAmbitoID", "UserID", "RoleID", "ScopeType", "ScopeValues", "Estado", "CreadoPor", "FechaCreacion", "FechaInicio", "FechaFin", "EsSuplente", "SuplenteDeUserID", "InstitutionID", "MembershipID", "ResponsibilityID"];
let assignmentRows = [assignmentHeaders, ["ASG-1", "U-1", "Director", "DEPARTAMENTO", '["DEP-A","DEP-B"]', "Activo", "U-ADMIN", "", "", "", "No", "", "INST-1", "MEM-1", "RESP-1"]];
const auditRows = [], writes = [], rollbackBatches = [];
let writerAttempts = 0, failWriterAt = 0;
const assignmentSheet = { getDataRange: () => ({ getValues: () => assignmentRows.map(row => row.slice()) }) };
const spreadsheet = { getSheetByName: name => name === "AsignacionesAmbitosRoles" ? assignmentSheet : null };
const claims = { signed: { userId: "U-1", role: "Director", membershipId: "MEM-1", institutionId: "INST-1" } };
const context = {
  SPREADSHEET_ID: "TEST", MIGRATION_OWNER_SCHEMAS_: { empleado: schema },
  verifySessionToken: token => claims[token] || null,
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_INSTITUTION_ID" ? "INST-1" : null }) },
  SpreadsheetApp: { openById: () => spreadsheet },
  resolveInternalResponsibilityForRoleScope_: () => ({ responsibilityId: "RESP-1" }),
  getOrCreateSheet: (_ss, name) => { assert.equal(name, "AuditoriaMigraciones"); return { appendRow: row => auditRows.push(row) }; },
  Utilities: { getUuid: () => "RUN-1" },
  resolveCrossReferenceIdentifier: () => ({ status: "success", idNuevoPlataforma: "EMP-1" }),
  migrationStableJson_: value => JSON.stringify(value), migrationHash_: () => "HASH-1",
  sendMigrationOwnerRequest_: (_type, action, payload) => {
    if (action === "compensateMigratedEntity") return { status: "success", compensated: true };
    writerAttempts++;
    if (writerAttempts === failWriterAt) throw new Error("MOCK_OWNER_WRITE_FAILED");
    writes.push(payload);
    return { status: "success" };
  },
  rollbackMigrationOwnerWrites_: applied => { rollbackBatches.push(applied.slice()); return []; }
};
vm.runInNewContext(functions.join("\n") + "\nthis.api = { build: buildAccountingDepartmentalImportPreflight_, preview: validateImportPreview, run: importDataWithColumnMapping };", context);
const base = { sessionToken: "signed", activeDepartmentId: "DEP-A", tipoEntidad: "empleado", sistemaOrigen: "Legacy", destinoModulo: "ExpedientesLaborales", columnaMapeo: { identificador: "legacyId", campos: { Puesto: "Puesto", Departamento: "Departamento" } }, filasData: [{ legacyId: "LEG-1", Puesto: "Docente" }] };
const preflight = context.api.build(base, spreadsheet, schema);
assert.equal(preflight.valid, true);
assert.equal(preflight.departmentId, "DEP-A");
assert.equal(preflight.rows[0].Departamento, "DEP-A");
const preview = context.api.preview(base);
assert.equal(preview.status, "success");
assert.equal(preview.departamentoDestino, "DEP-A");
const mixed = context.api.build({ ...base, filasData: [{ legacyId: "LEG-1", Puesto: "Docente", Departamento: "DEP-B" }] }, spreadsheet, schema);
assert.equal(mixed.valid, false);
assert.equal(mixed.code, "DEPARTMENT_IMPORT_MIXED_DEPARTMENTS");
const freeText = context.api.build({ ...base, filasData: [{ legacyId: "LEG-1", Puesto: "Docente", Departamento: "Departamento A" }] }, spreadsheet, schema);
assert.equal(freeText.valid, false);
const deniedPreview = context.api.preview({ ...base, activeDepartmentId: "DEP-X" });
assert.equal(deniedPreview.status, "error");
assert.equal(deniedPreview.resumenValidation.filasValidas, 0);
assignmentRows = [assignmentHeaders, ["ASG-2", "U-1", "Director", "INSTITUCION", '["INST-1"]', "Activo", "U-ADMIN", "", "", "", "No", "", "INST-1", "MEM-1", "RESP-1"]];
const institutionWide = context.api.build({ ...base, activeDepartmentId: "" }, spreadsheet, schema);
assert.equal(institutionWide.valid, false);
assignmentRows = [assignmentHeaders, ["ASG-1", "U-1", "Director", "DEPARTAMENTO", '["DEP-A","DEP-B"]', "Activo", "U-ADMIN", "", "", "", "No", "", "INST-1", "MEM-1", "RESP-1"]];
claims.legacy = { userId: "U-1", role: "Director" };
const missingMembership = context.api.build({ ...base, sessionToken: "legacy" }, spreadsheet, schema);
assert.equal(missingMembership.valid, false);
const nonDepartmentEntity = context.api.build({ ...base, tipoEntidad: "curso" }, spreadsheet, schema);
assert.equal(nonDepartmentEntity.valid, true);
assert.equal(nonDepartmentEntity.applicable, false);
let denied = false;
try { context.api.run({ ...base, activeDepartmentId: "DEP-X" }); } catch (error) { denied = String(error.message).includes("ACTIVE_SCOPE_NOT_ASSIGNED"); }
assert.equal(denied, true);
assert.equal(auditRows.length, 0);
assert.equal(writes.length, 0);
const imported = context.api.run(base);
assert.equal(imported.status, "success");
assert.equal(writes.length, 1);
assert.equal(writes[0].datos.Departamento, "DEP-A");
assert.equal(auditRows.length, 1);

const retry = context.api.run(base);
assert.equal(retry.status, "success");
assert.equal(writes[1].idempotencyKey, writes[0].idempotencyKey, "retry retains a stable idempotency key");

const beforeMixedWriters = writerAttempts, beforeMixedAudit = auditRows.length;
let mixedImportDenied = false;
try {
  context.api.run({ ...base, filasData: [
    { legacyId: "LEG-1", Puesto: "Docente", Departamento: "DEP-A" },
    { legacyId: "LEG-2", Puesto: "Docente", Departamento: "DEP-B" }
  ] });
} catch (error) { mixedImportDenied = String(error.message).includes("DEPARTMENT_IMPORT_MIXED_DEPARTMENTS"); }
assert.equal(mixedImportDenied, true);
assert.equal(writerAttempts, beforeMixedWriters, "the entire mixed batch is rejected before the first writer");
assert.equal(auditRows.length, beforeMixedAudit, "a rejected batch creates no migration audit row");

failWriterAt = writerAttempts + 2;
const rollback = context.api.run({ ...base, filasData: [
  { legacyId: "LEG-3", Puesto: "Docente" },
  { legacyId: "LEG-4", Puesto: "Docente" }
] });
assert.equal(rollback.code, "MIGRATION_BATCH_ROLLED_BACK");
assert.equal(rollback.estado, "rolled_back");
assert.equal(rollbackBatches.at(-1).length, 1, "the first successful write is compensated after the second writer fails");
assert.equal(auditRows.at(-1)[8], "rolled_back");
console.log("Accounting departmental import scope: 13 scenarios passed.");
