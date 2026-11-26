"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Falta " + name);
  const next = /\nfunction [A-Za-z0-9_$]+\s*\(/g;
  next.lastIndex = start + 10;
  const match = next.exec(source);
  return source.slice(start, match ? match.index : source.length);
}
function run(source, names, context) {
  vm.runInNewContext(names.map(name => extractFunction(source, name)).join("\n"), context);
  return context;
}
const userSource = read("backend/user-service/Code.gs");
const academicSource = read("backend/academic-service/Code.gs");
const accountingSource = read("backend/accounting-service/Code.gs");

test("la clave de correspondencia incluye sistema, entidad, identificador legado e institución", () => {
  const context = run(userSource, ["identityCompositeKey_"], {});
  const a = context.identityCompositeKey_("SACE", "estudiante", "001", "INST-1");
  assert.equal(a, context.identityCompositeKey_("SACE", "ESTUDIANTE", "001", "INST-1"));
  assert.notEqual(a, context.identityCompositeKey_("ERP", "estudiante", "001", "INST-1"));
  assert.notEqual(a, context.identityCompositeKey_("SACE", "estudiante", "001", "INST-2"));
  assert.notEqual(a, context.identityCompositeKey_("SACE", "estudiante", "002", "INST-1"));
});

test("los homónimos con identificadores contradictorios no se fusionan automáticamente", () => {
  const context = run(userSource, ["identityClassifyCandidate_"], {
    normalizeString: value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(),
    identityDateKey_: value => String(value || "").slice(0, 10)
  });
  const conflict = context.identityClassifyCandidate_(
    { fullName: "Ana Pérez", identificacion: "0801-1111", fechaNacimiento: "2000-01-01" },
    { fullName: "Ana Pérez", identificacion: "0801-9999", fechaNacimiento: "2000-01-01" }
  );
  assert.equal(conflict, null);
  const homonym = context.identityClassifyCandidate_(
    { fullName: "Ana Pérez", identificacion: "", fechaNacimiento: "2000-01-01" },
    { fullName: "Ana Perez", identificacion: "", fechaNacimiento: "2000-01-01" }
  );
  assert.equal(homonym.clasificacionIdentidad, "POSIBLE_DUPLICADO");
  assert.equal(homonym.requiereRevisionHumana, true);
  assert.equal(homonym.fusionAutomaticaPermitida, false);
  const exact = context.identityClassifyCandidate_(
    { fullName: "Ana Pérez", identificacion: "0801-1111" },
    { fullName: "Ana Pérez", identificacion: "0801-1111" }
  );
  assert.equal(exact.clasificacionIdentidad, "COINCIDENCIA_EXACTA_PENDIENTE_CONFIRMACION");
  assert.equal(exact.fusionAutomaticaPermitida, false);
});

test("el registro legado es idempotente, separa fuentes y exige revisión humana", () => {
  const headers = ["idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataforma","institucionId",
    "hashRegistroOrigen","fechaRegistro","versionMapeo","estadoCorrespondencia","metodoCoincidencia","nivelConfianza","registradoPor"];
  function makeSheet(rows) {
    return {
      rows,
      getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
      appendRow(row) { rows.push(row.slice()); },
      getLastRow() { return rows.length; },
      deleteRow(index) { rows.splice(index - 1, 1); },
      getRange(row, col) { return { setValue(value) { rows[row - 1][col - 1] = value; } }; }
    };
  }
  const mapping = makeSheet([headers]), audit = makeSheet([["Id","Decision"]]);
  let institution = "INST-1", sequence = 0, waits = 0, releases = 0;
  const context = run(userSource, ["identityCompositeKey_", "registerLegacyIdentifierMapping"], {
    requireIdentityManager_: () => ({ actorId: "HR-1", role: "Administrador" }),
    getIdentityInstitutionId_: () => institution,
    ensureIdentityMappingSheet_: () => mapping,
    ensureIdentityDecisionSheet_: () => audit,
    appendIdentityDecisionAudit_: (sheet, entry) => sheet.appendRow([entry.idMapeo, entry.decision]),
    identityTextCell_: value => String(value || ""),
    identityHash_: () => "HASH",
    LockService: { getScriptLock: () => ({ waitLock() { waits++; }, releaseLock() { releases++; } }) },
    Utilities: { getUuid: () => "UUID-" + (++sequence) }
  });
  const first = context.registerLegacyIdentifierMapping({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001" });
  assert.equal(first.estadoCorrespondencia, "PENDIENTE_REVISION");
  const completed = context.registerLegacyIdentifierMapping({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001", idNuevoPlataforma: "EST-1" });
  assert.equal(completed.idempotent, true);
  assert.equal(completed.estadoCorrespondencia, "PENDIENTE_REVISION");
  assert.equal(mapping.rows[1][4], "EST-1");
  assert.equal(context.registerLegacyIdentifierMapping({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001", idNuevoPlataforma: "EST-1" }).idempotent, true);
  assert.throws(() => context.registerLegacyIdentifierMapping({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001", idNuevoPlataforma: "EST-2" }), /IDENTITY_MAPPING_CONFLICT/);
  const otherSource = context.registerLegacyIdentifierMapping({ sistemaOrigen: "ERP", tipoEntidad: "estudiante", idOriginalLegado: "001" });
  assert.equal(otherSource.idempotent, false);
  institution = "INST-2";
  const otherInstitution = context.registerLegacyIdentifierMapping({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001" });
  assert.equal(otherInstitution.idempotent, false);
  assert.equal(mapping.rows.length, 4);
  assert.equal(audit.rows.length, 5);
  assert.equal(waits, releases);
});

test("ACCOUNTING resuelve solo correspondencias confirmadas y únicas", () => {
  const context = run(accountingSource, ["resolveAccountingIdentityFromSnapshot_"], {});
  const entry = { sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001",
    idNuevoPlataforma: "EST-1", institucionId: "INST-1", estadoCorrespondencia: "CONFIRMADA" };
  const valid = context.resolveAccountingIdentityFromSnapshot_({ institutionId: "INST-1", entries: [entry] }, "SACE", "estudiante", "001", "INST-1");
  assert.equal(valid.valid, true);
  assert.equal(valid.idNuevoPlataforma, "EST-1");
  const pending = context.resolveAccountingIdentityFromSnapshot_({ institutionId: "INST-1", entries: [{ ...entry, estadoCorrespondencia: "PENDIENTE_REVISION" }] }, "SACE", "estudiante", "001", "INST-1");
  assert.equal(pending.code, "IDENTITY_MAPPING_NOT_CONFIRMED");
  const duplicate = context.resolveAccountingIdentityFromSnapshot_({ institutionId: "INST-1", entries: [entry, entry] }, "SACE", "estudiante", "001", "INST-1");
  assert.equal(duplicate.code, "IDENTITY_UNIQUENESS_VIOLATION");
  const crossTenant = context.resolveAccountingIdentityFromSnapshot_({ institutionId: "INST-1", entries: [entry] }, "SACE", "estudiante", "001", "INST-2");
  assert.equal(crossTenant.code, "IDENTITY_MAPPING_NOT_FOUND");
});

test("el transporte de ACCOUNTING usa POST directo con el contexto de sesión, sin HMAC", () => {
  const requests = [];
  const context = {
    ACCOUNTING_SERVICE_ENDPOINTS_: {
      USER: "https://script.google.com/macros/s/USER/exec",
      ACADEMIC: "https://script.google.com/macros/s/ACADEMIC/exec"
    },
    isAccountingTrustedAppsScriptEndpoint_: url => /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url),
    UrlFetchApp: { fetch(url, options) {
      requests.push({ url, options });
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
        status: "success", data: { status: "success", authorized: true, verified: true, service: "USER", institutionId: "INST-1", entries: [], uniquenessViolations: [] }
      }) };
    } }
  };
  run(accountingSource, ["requestAccountingService_", "requestAccountingUserAuthorization_", "requestAccountingIdentityMapSnapshot_", "requestAccountingTrustedOwnerSnapshot_"], context);
  const auth = context.requestAccountingUserAuthorization_("verifyAccountingSession", { sessionToken: "SESSION", institutionId: "INST-1" });
  assert.equal(auth.authorized, true);
  assert.equal(requests[0].url, context.ACCOUNTING_SERVICE_ENDPOINTS_.USER);
  const authBody = JSON.parse(requests[0].options.payload);
  assert.equal(authBody.action, "verifyAccountingSession");
  assert.equal(authBody.payload.sessionToken, "SESSION");
  assert.equal(Object.prototype.hasOwnProperty.call(authBody, "hmacSignature"), false);
  const snapshot = context.requestAccountingIdentityMapSnapshot_({ sessionToken: "SESSION", institutionId: "INST-1", lookups: [{ sourceName: "SACE", entityType: "estudiante", legacyIds: ["001"] }] });
  assert.equal(snapshot.verified, true);
  assert.equal(JSON.parse(requests[1].options.payload).action, "getMigrationIdentityMapSnapshot");
  const academic = context.requestAccountingTrustedOwnerSnapshot_("ACADEMIC", { sessionToken: "SESSION", institutionId: "INST-1", entityType: "estudiante", targetIds: ["EST-1"] });
  assert.equal(academic.verified, true);
  assert.equal(requests[2].url, context.ACCOUNTING_SERVICE_ENDPOINTS_.ACADEMIC);
  assert.equal(JSON.parse(requests[2].options.payload).action, "getMigrationTargetExistenceSnapshot");
});

test("los writes de migración a USER/ACADEMIC usan el transporte directo", () => {
  const calls = [];
  const context = { requestAccountingService_: (service, action, payload) => { calls.push({ service, action, payload }); return { status: "success", idempotent: false }; } };
  run(accountingSource, ["sendMigrationOwnerRequest_"], context);
  const result = context.sendMigrationOwnerRequest_("ACADEMIC", "writeMigratedEntity", { sessionToken: "SESSION", institutionId: "INST-1" });
  assert.equal(result.status, "success");
  assert.deepEqual(calls[0], { service: "ACADEMIC", action: "writeMigratedEntity", payload: { sessionToken: "SESSION", institutionId: "INST-1" } });
});

test("USER reutiliza la identidad verificada y aplica el alcance institucional a la sesión", () => {
  let verifyCalls = 0;
  const context = {
    getUserVerifiedRole(payload) {
      if (!payload.__identityVerified) {
        payload.__identityVerified = true;
        payload._verifiedUserId = "U-1";
        payload._verifiedRole = "Importador";
        payload._verifiedClaims = { userId: "U-1", role: "Importador", institutionId: "INST-1", membershipId: "MEM-1" };
      }
      return payload._verifiedRole;
    },
    getIdentityInstitutionId_: () => "INST-1",
    verifySessionToken: () => { verifyCalls++; throw new Error("No debe volver a verificar el token"); }
  };
  run(userSource, ["getAccountingVerifiedSessionContext_", "verifyAccountingSession"], context);
  const payload = { sessionToken: "SESSION" };
  const verified = context.verifyAccountingSession(payload);
  assert.equal(verified.status, "success");
  assert.equal(verified.userId, "U-1");
  assert.equal(verifyCalls, 0);
  const crossTenant = context.getAccountingVerifiedSessionContext_({ ...payload, _verifiedClaims: { userId: "U-2", role: "Importador", institutionId: "INST-2" }, __identityVerified: true, _verifiedRole: "Importador" });
  assert.equal(crossTenant.code, "INSTITUTION_SCOPE_DENIED");
});

test("USER autoriza el puente de importación solo con permiso y no concede acceso a Auditor", () => {
  const context = {
    PUBLIC_ACTIONS: [],
    getUserVerifiedRole: payload => { payload._verifiedUserId = "U-1"; return payload.role; },
    getDynamicPermissionsForRole: (role, action) => role === "Importador" && action === "importDataWithColumnMapping"
  };
  run(userSource, ["validateRolePermission"], context);
  assert.equal(context.validateRolePermission("writeMigratedEntity", { role: "Importador" }).authorized, true);
  assert.equal(context.validateRolePermission("writeMigratedEntity", { role: "Auditor" }).authorized, false);
  assert.equal(context.validateRolePermission("verifyAccountingSession", { role: "Auditor" }).authorized, true);
  assert.equal(context.validateRolePermission("authorizeAccountingAuditRead", { role: "Auditor" }).authorized, true);
});

test("USER rechaza escrituras de migración fuera de la institución verificada", () => {
  let writes = 0;
  const context = {
    getUserVerifiedRole: payload => { payload._verifiedClaims = { userId: "U-1", role: "Importador", institutionId: "INST-1" }; return "Importador"; },
    getIdentityInstitutionId_: () => "INST-1",
    getDynamicPermissionsForRole: () => true,
    applyTrustedMigrationWrite_: () => { writes++; return { status: "success" }; }
  };
  run(userSource, ["getAccountingVerifiedSessionContext_", "writeMigratedEntity"], context);
  const denied = context.writeMigratedEntity({ sessionToken: "SESSION", institutionId: "INST-2" });
  assert.equal(denied.code, "INSTITUTION_SCOPE_DENIED");
  assert.equal(writes, 0);
  const allowed = context.writeMigratedEntity({ sessionToken: "SESSION", institutionId: "INST-1" });
  assert.equal(allowed.status, "success");
  assert.equal(writes, 1);
});

test("ACADEMIC asigna permiso de importación a las acciones directas de migración", () => {
  const context = run(academicSource, ["getRequestPermissionAction_"], {});
  for (const action of ["getMigrationTargetExistenceSnapshot", "writeMigratedEntity", "compensateMigratedEntity"]) {
    assert.equal(context.getRequestPermissionAction_(action, {}), "importDataWithColumnMapping");
  }
});

test("ACADEMIC solo ejecuta writes directos con sesión e institución verificadas", () => {
  let writes = 0;
  const context = {
    getVerifiedRequestSessionClaims_: () => ({ userId: "U-1", role: "Importador", institutionId: "INST-1" }),
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "INST-1" }) },
    applyTrustedMigrationWrite_: () => { writes++; return { status: "success" }; }
  };
  run(academicSource, ["writeMigratedEntity"], context);
  const denied = context.writeMigratedEntity({ institutionId: "INST-2" });
  assert.equal(denied.code, "VERIFIED_IDENTITY_REQUIRED");
  assert.equal(writes, 0);
  const allowed = context.writeMigratedEntity({ institutionId: "INST-1" });
  assert.equal(allowed.status, "success");
  assert.equal(writes, 1);
});

test("el transporte directo no depende de Script Properties ni de secretos HMAC para identidad", () => {
  for (const name of ["requestAccountingUserAuthorization_", "requestAccountingIdentityMapSnapshot_", "requestAccountingTrustedOwnerSnapshot_"]) {
    const fn = extractFunction(accountingSource, name);
    assert.doesNotMatch(fn, /PropertiesService|resolveInterServiceSecret_|hmacSignature|accountingComputeHmacSignature_/);
  }
  const directHelper = extractFunction(accountingSource, "requestAccountingService_");
  assert.doesNotMatch(directHelper, /PropertiesService|resolveInterServiceSecret_|hmacSignature|accountingComputeHmacSignature_/);
});

test("las reimportaciones de persona son idempotentes y no duplican filas", () => {
  const targetHeaders = ["PersonaID", "NombreCompleto", "Identificacion", "EmailContacto"];
  const journalHeaders = ["Key", "Type", "Id", "Payload", "State", "Action", "Before", "After", "Date", "Correlation"];
  function makeSheet(rows) {
    return {
      rows,
      getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
      appendRow(row) { rows.push(row.slice()); },
      getLastRow() { return rows.length; },
      deleteRow(index) { rows.splice(index - 1, 1); },
      getRange(row, col, numRows, numCols) {
        return { setValues(values) { for (let r = 0; r < numRows; r++) for (let c = 0; c < numCols; c++) rows[row - 1 + r][col - 1 + c] = values[r][c]; } };
      }
    };
  }
  const sheets = { Personas: makeSheet([targetHeaders]), MigracionEscrituras: makeSheet([journalHeaders]) };
  const context = {
    MIGRATION_WRITER_SCHEMAS_: { persona: { sheet: "Personas", headers: targetHeaders } },
    MIGRATION_WRITER_JOURNAL_HEADERS_: journalHeaders,
    SPREADSHEET_ID: "SS-1",
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { openById: () => ({}) },
    ensureMigrationWriterSheet_: (ss, name) => sheets[name],
    migrationStableJson_: value => JSON.stringify(value),
    migrationSafeCell_: value => String(value == null ? "" : value),
    migrationEncodeSnapshot_: value => value
  };
  run(userSource, ["applyTrustedMigrationWrite_"], context);
  const base = { tipoEntidad: "persona", idNuevoPlataforma: "PER-1",
    datos: { NombreCompleto: "Ana Pérez", Identificacion: "0801-1111", EmailContacto: "ana@example.test" } };
  const first = context.applyTrustedMigrationWrite_({ ...base, idempotencyKey: "SACE-FILE-1-ROW-1" });
  const repeated = context.applyTrustedMigrationWrite_({ ...base, idempotencyKey: "SACE-FILE-1-ROW-1" });
  const secondSource = context.applyTrustedMigrationWrite_({ ...base, idempotencyKey: "ERP-FILE-2-ROW-1" });
  assert.equal(first.idempotent, false);
  assert.equal(repeated.idempotent, true);
  assert.equal(secondSource.accion, "UPDATE");
  assert.equal(sheets.Personas.rows.length, 2);
  assert.equal(sheets.MigracionEscrituras.rows.length, 3);
});

test("las reimportaciones de estudiantes requieren snapshot y conservan idempotencia", () => {
  const targetHeaders = ["EstudianteID", "CodigoInstitucional", "NombreCompleto"];
  const journalHeaders = ["Key", "Type", "Id", "Payload", "State", "Action", "Before", "After", "Date", "Correlation"];
  function makeSheet(rows) {
    return {
      rows,
      getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
      appendRow(row) { rows.push(row.slice()); },
      getLastRow() { return rows.length; },
      deleteRow(index) { rows.splice(index - 1, 1); },
      getRange(row, col, numRows, numCols) {
        return { setValues(values) { for (let r = 0; r < numRows; r++) for (let c = 0; c < numCols; c++) rows[row - 1 + r][col - 1 + c] = values[r][c]; } };
      }
    };
  }
  const sheets = { Estudiantes: makeSheet([targetHeaders]), MigracionEscrituras: makeSheet([journalHeaders]) };
  const context = {
    MIGRATION_WRITER_SCHEMAS_: { estudiante: { sheet: "Estudiantes", headers: targetHeaders } },
    MIGRATION_WRITER_JOURNAL_HEADERS_: journalHeaders,
    SPREADSHEET_ID: "SS-2",
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { openById: () => ({}) },
    ensureMigrationWriterSheet_: (ss, name) => sheets[name],
    migrationStableJson_: value => JSON.stringify(value),
    migrationSafeCell_: value => String(value == null ? "" : value),
    migrationEncodeSnapshot_: value => value,
    migrationNormalizeImportDate_: (field, value) => value,
    migrationHash_: value => "HASH-" + String(value)
  };
  run(academicSource, ["applyTrustedMigrationWrite_"], context);
  const base = { tipoEntidad: "estudiante", idNuevoPlataforma: "EST-1", institutionId: "INST-1",
    targetSnapshotVerified: true, expectedTargetPresent: false,
    datos: { CodigoInstitucional: "STU-001", NombreCompleto: "Ana Pérez" } };
  assert.throws(() => context.applyTrustedMigrationWrite_({ ...base, targetSnapshotVerified: false, idempotencyKey: "STU-1" }), /IMPORT_TARGET_SNAPSHOT_UNVERIFIED/);
  const first = context.applyTrustedMigrationWrite_({ ...base, idempotencyKey: "STU-1" });
  const repeated = context.applyTrustedMigrationWrite_({ ...base, idempotencyKey: "STU-1" });
  assert.equal(first.idempotent, false);
  assert.equal(repeated.idempotent, true);
  assert.equal(sheets.Estudiantes.rows.length, 2);
  assert.equal(sheets.MigracionEscrituras.rows.length, 2);
});

test("el rollback entrega el contexto de sesión sin almacenarlo en registros temporales", () => {
  const calls = [];
  const context = { sendMigrationOwnerRequest_: (service, action, payload) => { calls.push({ service, action, payload }); } };
  run(accountingSource, ["rollbackMigrationOwnerWrites_"], context);
  const applied = [{ service: "USER", ownership: false, tipoEntidad: "persona", idempotencyKey: "KEY-1", payload: { id: "PER-1" } }];
  context.rollbackMigrationOwnerWrites_(applied, "SESSION", "INST-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, "compensateMigratedEntity");
  assert.equal(calls[0].payload.sessionToken, "SESSION");
  assert.equal(calls[0].payload.institutionId, "INST-1");
  assert.equal(Object.prototype.hasOwnProperty.call(applied[0], "sessionToken"), false);
});

test("los endpoints de ACCOUNTING coinciden con los endpoints registrados en config.js", () => {
  const config = read("js/config.js");
  const serviceConfig = config.slice(config.indexOf("SERVICE_URLS"), config.indexOf("window.SERVICE_REGISTRY"));
  const userMatch = serviceConfig.match(/USER\s*:\s*[\'"]([^\'"]+)[\'"]/);
  const academicMatch = serviceConfig.match(/ACADEMIC\s*:\s*[\'"]([^\'"]+)[\'"]/);
  const endpointsMatch = accountingSource.match(/const ACCOUNTING_SERVICE_ENDPOINTS_\s*=\s*\{([\s\S]*?)\};/);
  assert.ok(userMatch && academicMatch && endpointsMatch);
  const endpoints = endpointsMatch[1];
  assert.equal(endpoints.match(/USER\s*:\s*"([^"]+)"/)[1], userMatch[1]);
  assert.equal(endpoints.match(/ACADEMIC\s*:\s*"([^"]+)"/)[1], academicMatch[1]);
});

test("los resolutores directo e inverso respetan fuente, institución y revisión", () => {
  const rows = [
    ["Id","Sistema","Tipo","Legado","Interno","Institucion","Hash","Fecha","Version","Estado","Metodo","Confianza","Actor"],
    ["M-1","SACE","estudiante","001","EST-1","INST-1","H1","","1","CONFIRMADA","","","HR-1"],
    ["M-2","ERP","estudiante","001","EST-1","INST-1","H2","","1","CONFIRMADA","","","HR-1"],
    ["M-3","SACE","estudiante","002","EST-2","INST-1","H3","","1","PENDIENTE_REVISION","","","HR-1"],
    ["M-4","SACE","usuario","U-OLD","USR-1","INST-1","H4","","1","CONFIRMADA","","","HR-1"],
    ["M-5","SACE","estudiante","001","EST-9","INST-2","H5","","1","CONFIRMADA","","","HR-1"]
  ];
  const context = run(userSource, ["identityCompositeKey_", "resolveInternalIdFromLegacy", "resolveLegacyIdFromInternal", "resolveUserByLegacyId"], {
    requireIdentityManager_: () => ({ actorId: "HR-1", role: "Administrador" }),
    getIdentityInstitutionId_: () => "INST-1",
    getIdentityMappingSheet_: () => ({ getDataRange: () => ({ getValues: () => rows }) })
  });
  const forward = context.resolveInternalIdFromLegacy({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "001" });
  assert.equal(forward.status, "success");
  assert.equal(forward.idNuevoPlataforma, "EST-1");
  const pending = context.resolveInternalIdFromLegacy({ sistemaOrigen: "SACE", tipoEntidad: "estudiante", idOriginalLegado: "002" });
  assert.equal(pending.status, "pending_review");
  const reverse = context.resolveLegacyIdFromInternal({ tipoEntidad: "estudiante", idNuevoPlataforma: "EST-1" });
  assert.deepEqual(reverse.referencias.map(item => item.sistemaOrigen).sort(), ["ERP", "SACE"]);
  const filtered = context.resolveLegacyIdFromInternal({ tipoEntidad: "estudiante", idNuevoPlataforma: "EST-1", sistemaOrigen: "ERP" });
  assert.equal(filtered.referencias.length, 1);
  const user = context.resolveUserByLegacyId({ sistemaOrigen: "SACE", idOriginalLegado: "U-OLD" });
  assert.equal(user.idNuevoPlataforma, "USR-1");
  assert.equal(context.resolveLegacyIdFromInternal({ tipoEntidad: "estudiante", idNuevoPlataforma: "EST-9" }).referencias.length, 0);
});

test("la confirmación requiere revisión humana, destino existente y deja auditoría inmutable", () => {
  const rows = [
    ["Id","Sistema","Tipo","Legado","Interno","Institucion","Hash","Fecha","Version","Estado","Metodo","Confianza","Actor"],
    ["M-1","SACE","estudiante","001","EST-1","INST-1","H1","","1","PENDIENTE_REVISION","","","HR-1"],
    ["M-2","SACE","estudiante","002","EST-404","INST-1","H2","","1","PENDIENTE_REVISION","","","HR-1"]
  ];
  const audit = [];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    getRange(row, col) { return { setValue(value) { rows[row - 1][col - 1] = value; } }; }
  };
  let targetExists = true, waits = 0, releases = 0;
  const context = run(userSource, ["reviewLegacyIdentifierMapping"], {
    requireIdentityManager_: () => ({ actorId: "HR-1", role: "Administrador" }),
    getIdentityInstitutionId_: () => "INST-1",
    ensureIdentityMappingSheet_: () => sheet,
    ensureIdentityDecisionSheet_: () => ({}),
    identityTargetExists_: () => targetExists,
    appendIdentityDecisionAudit_: (auditSheet, entry) => audit.push(entry),
    LockService: { getScriptLock: () => ({ waitLock() { waits++; }, releaseLock() { releases++; } }) }
  });
  const confirmed = context.reviewLegacyIdentifierMapping({ idMapeo: "M-1", decision: "CONFIRMAR", motivo: "Validación documental" });
  assert.equal(confirmed.estadoCorrespondencia, "CONFIRMADA");
  assert.equal(rows[1][9], "CONFIRMADA");
  assert.equal(audit.length, 1);
  assert.equal(context.reviewLegacyIdentifierMapping({ idMapeo: "M-1", decision: "CONFIRMAR", motivo: "Reintento idempotente" }).idempotent, true);
  assert.equal(audit.length, 1);
  assert.throws(() => context.reviewLegacyIdentifierMapping({ idMapeo: "M-1", decision: "RECHAZAR", motivo: "Cambio posterior" }), /IDENTITY_DECISION_CONFLICT/);
  targetExists = false;
  assert.throws(() => context.reviewLegacyIdentifierMapping({ idMapeo: "M-2", decision: "CONFIRMAR", motivo: "Destino inexistente" }), /IDENTITY_TARGET_NOT_FOUND_OR_UNSUPPORTED/);
  assert.equal(rows[2][9], "PENDIENTE_REVISION");
  assert.equal(waits, releases);
});

test("USER publica el directorio SACE solo al docente autenticado dueño de la solicitud", () => {
  const context = {
    getUserVerifiedRole: payload => {
      payload._verifiedClaims = { userId: "TEACHER-1", role: "Profesor", institutionId: "INST-1" };
      return "Profesor";
    },
    SPREADSHEET_ID: "USER-SS",
    SpreadsheetApp: { openById: () => ({ getSheetByName(name) {
      const data = {
        Usuarios: [
          ["UserId","Rol","PersonaID","EstadoCuenta"],
          ["TEACHER-1","Profesor","P-TEACHER","ACTIVA"],
          ["STUDENT-1","Estudiante","P-STUDENT","ACTIVA"]
        ],
        Personas: [
          ["PersonaID","Nombres","Apellidos","Identificacion","EstadoPersona","TipoIdentificacion"],
          ["P-TEACHER","Docente","Prueba","0801-T","ACTIVA","DNI"],
          ["P-STUDENT","Ana","Pérez","0801-1111","ACTIVA","DNI"]
        ]
      };
      return { getDataRange: () => ({ getValues: () => data[name] }) };
    } }) },
    getSaceUserSourceRevisionLocked_: () => "REV-1",
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }
  };
  run(userSource, ["getSaceStudentIdentityDirectory_"], context);
  const result = context.getSaceStudentIdentityDirectory_({
    sessionToken: "SESSION", teacherUserId: "TEACHER-1", institutionId: "INST-1", studentIds: ["STUDENT-1"]
  });
  assert.equal(result.status, "success");
  assert.equal(result.data[0].userId, "STUDENT-1");
  assert.equal(result.data[0].identity, "0801-1111");
  assert.throws(() => context.getSaceStudentIdentityDirectory_({
    sessionToken: "SESSION", teacherUserId: "TEACHER-2", institutionId: "INST-1", studentIds: ["STUDENT-1"]
  }), /SACE_IDENTITY_CALLER_INVALID/);
});

test("ACADEMIC consulta el directorio SACE mediante POST directo con sesión, sin HMAC ni Script Properties", () => {
  const requests = [];
  const context = {
    ACADEMIC_USER_SERVICE_ENDPOINT_: "https://script.google.com/macros/s/USER/exec",
    getRequestSessionToken_: () => "SESSION",
    UrlFetchApp: { fetch(url, options) {
      requests.push({ url, options });
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
        status: "success", sourceRevision: "REV-1", data: [{ userId: "STUDENT-1", identity: "0801-1111", name: "Ana Pérez", documentType: "DNI" }]
      }) };
    } }
  };
  run(academicSource, ["requestSaceStudentIdentityDirectoryFromUser_"], context);
  const result = context.requestSaceStudentIdentityDirectoryFromUser_(
    { sessionToken: "SESSION" }, ["STUDENT-1"], "INST-1", "TEACHER-1", false
  );
  assert.equal(result.length, 1);
  assert.equal(result.sourceRevision, "REV-1");
  assert.equal(requests[0].url, context.ACADEMIC_USER_SERVICE_ENDPOINT_);
  const body = JSON.parse(requests[0].options.payload);
  assert.equal(body.action, "getSaceStudentIdentityDirectory");
  assert.equal(body.payload.sessionToken, "SESSION");
  assert.equal(Object.prototype.hasOwnProperty.call(body, "hmacSignature"), false);
  assert.equal(requests[0].options.contentType, "text/plain");
});

test("el directorio SACE no depende de sobres HMAC en el manejador USER", () => {
  const handler = extractFunction(userSource, "handleTrustedMigrationEnvelope_");
  assert.doesNotMatch(handler, /getSaceStudentIdentityDirectory/);
  assert.match(handler, /registerMigratedResourceOwnership/);
  assert.match(handler, /compensateMigratedResourceOwnership/);
  const request = extractFunction(academicSource, "requestSaceStudentIdentityDirectoryFromUser_");
  assert.doesNotMatch(request, /createInterServiceEnvelope|PropertiesService|IMA_MIGRATION_HMAC_SECRET/);
});
