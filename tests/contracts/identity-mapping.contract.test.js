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
