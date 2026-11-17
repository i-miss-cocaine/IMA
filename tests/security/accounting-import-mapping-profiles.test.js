const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next < 0 ? source.length : next);
}
function extractConst(name) {
  const start = source.indexOf("const " + name);
  assert.notEqual(start, -1, "missing const " + name);
  const end = source.indexOf("];", start);
  assert.notEqual(end, -1, "missing const terminator " + name);
  return source.slice(start, end + 2);
}
const profileCode = [
  extractConst("ACCOUNTING_IMPORT_MAPPING_PROFILE_HEADERS_"),
  extractFunction("ensureImportMappingProfilesSheet_"),
  extractFunction("importMappingProfileContext_"),
  extractFunction("normalizeImportMappingProfile_"),
  extractFunction("saveImportMappingProfile"),
  extractFunction("getImportMappingProfiles"),
  extractFunction("migrationStableJson_"),
  extractFunction("migrationHash_")
].join("\n\n");

const schemas = {
  persona: { service: "USER", sheet: "Personas", headers: ["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto","TelefonoContacto","EstadoPersona","FechaCreacion","FechaActualizacion","Observaciones"] },
  curso: { service: "ACCOUNTING", sheet: "Cursos", headers: ["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"] },
  estudiante: { service: "ACADEMIC", sheet: "ExpedientesEstudiantes", headers: ["ExpedienteID","PersonaID","CodigoInstitucional","FechaNacimiento","Nacionalidad","DireccionResidencia","FotografiaUrl","EstadoExpediente","FechaCreacion","FechaActualizacion","Observaciones"] },
  empleado: { service: "ACCOUNTING", sheet: "ExpedientesLaborales", headers: ["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"] },
  empleadoOwnership: { service: "USER", sheet: "", headers: [] }
};

function makeHarness() {
  const state = { actor: { userId: "U-1", role: "Contador", institutionId: "INST-1", authorized: true }, allowed: true, lockHeld: false, uuid: 0, events: [] };
  const rows = [[""]];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    appendRow: row => rows.push(row.slice()),
    getRange(row, column, rowCount, columnCount) {
      return { setValues(values) {
        for (let r = 0; r < rowCount; r++) {
          while (rows.length < row + r) rows.push([]);
          rows[row - 1 + r].splice(column - 1, columnCount, ...values[r]);
        }
      }};
    }
  };
  const context = {
    MIGRATION_OWNER_SCHEMAS_: schemas,
    SPREADSHEET_ID: "TEST_ONLY",
    getVerifiedAccountingIdentity_: payload => payload && payload.sessionToken ? Object.assign({}, state.actor) : { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" },
    accountingHasInstitutionalImportPermission_: () => state.allowed,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_INSTITUTION_ID" ? "INST-1" : "" }) },
    SpreadsheetApp: { openById: id => { assert.equal(id, "TEST_ONLY"); return { getSheetByName: name => name === "PerfilesMapeoColumnas" ? sheet : null }; } },
    getOrCreateSheet: (_ss, name) => { assert.equal(name, "PerfilesMapeoColumnas"); return sheet; },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (state.lockHeld) return false; state.lockHeld = true; return true; }, releaseLock: () => { state.lockHeld = false; } }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" }, Charset: { UTF_8: "UTF_8" },
      computeDigest: (_algorithm, value) => Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest()).map(byte => byte > 127 ? byte - 256 : byte),
      getUuid: () => "UUID-" + (++state.uuid)
    },
    logStructuredEvent: (...args) => state.events.push(args),
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error, Set
  };
  vm.runInNewContext(profileCode, context);
  return { context, state, rows };
}

function validPayload(overrides = {}) {
  return Object.assign({
    sessionToken: "SESSION-1", profileName: "Matrícula SACE 2026", sistemaOrigen: "SACE",
    tipoEntidad: "estudiante", destinoModulo: "ACADEMIC",
    sourceHeaders: ["ID_LEGADO","Nombres","Apellidos","DNI"],
    columnaMapeo: { identificador: "ID_LEGADO", campos: { PersonaID: "DNI", CodigoInstitucional: "ID_LEGADO" } }
  }, overrides);
}

{
  const h = makeHarness();
  const saved = h.context.saveImportMappingProfile(validPayload());
  assert.equal(saved.status, "success");
  assert.equal(saved.version, 1);
  assert.equal(h.rows.length, 2);
  assert.equal(h.rows[0][0], "PerfilID", "blank Sheets must initialize headers in row one");
  const listed = h.context.getImportMappingProfiles({ sessionToken: "SESSION-1", tipoEntidad: "estudiante", sistemaOrigen: "SACE" });
  assert.equal(listed.status, "success");
  assert.equal(listed.profiles.length, 1);
  assert.deepEqual(Array.from(listed.profiles[0].sourceHeaders), ["ID_LEGADO","Nombres","Apellidos","DNI"]);
  assert.equal(listed.profiles[0].columnaMapeo.campos.PersonaID, "DNI");

  const updated = h.context.saveImportMappingProfile(validPayload({
    profileId: saved.profileId,
    columnaMapeo: { identificador: "ID_LEGADO", campos: { PersonaID: "DNI", CodigoInstitucional: "ID_LEGADO", Nacionalidad: "Nombres" } }
  }));
  assert.equal(updated.status, "success");
  assert.equal(updated.profileId, saved.profileId);
  assert.equal(updated.version, 2);
  assert.equal(h.rows.length, 3, "editing a profile appends a new version instead of overwriting history");
  const latest = h.context.getImportMappingProfiles({ sessionToken: "SESSION-1", tipoEntidad: "estudiante", sistemaOrigen: "SACE" });
  assert.equal(latest.profiles.length, 1);
  assert.equal(latest.profiles[0].version, 2);
  assert.equal(latest.profiles[0].columnaMapeo.campos.Nacionalidad, "Nombres");
}

{
  const h = makeHarness();
  h.state.allowed = false;
  assert.equal(h.context.saveImportMappingProfile(validPayload()).code, "IMPORT_PERMISSION_DENIED");
  assert.equal(h.rows.length, 1, "denied users cannot create a profile");
  h.state.allowed = true;
  assert.equal(h.context.saveImportMappingProfile(validPayload({ sourceHeaders: ["ID_LEGADO","DNI","DNI"] })).code, "IMPORT_MAPPING_PROFILE_HEADERS_INVALID");
  assert.equal(h.context.saveImportMappingProfile(validPayload({ columnaMapeo: { identificador: "MISSING", campos: { PersonaID: "DNI" } } })).code, "IMPORT_MAPPING_PROFILE_MAPPING_INVALID");
  assert.equal(h.context.saveImportMappingProfile(validPayload({ destinoModulo: "ACCOUNTING" })).code, "MIGRATION_DESTINATION_MISMATCH");
  assert.equal(h.context.saveImportMappingProfile(validPayload({ columnaMapeo: { identificador: "ID_LEGADO", campos: { CodigoInstitucional: "ID_LEGADO" } } })).code, "IMPORT_MAPPING_PROFILE_REQUIRED_FIELDS_MISSING");
  assert.equal(h.rows.length, 1, "invalid profiles must not write");
}

{
  const h = makeHarness();
  const first = h.context.saveImportMappingProfile(validPayload());
  const otherName = h.context.saveImportMappingProfile(validPayload({ profileName: "Matrícula 2027" }));
  assert.equal(otherName.status, "success");
  const renameCollision = h.context.saveImportMappingProfile(validPayload({ profileId: first.profileId, profileName: "Matrícula 2027" }));
  assert.equal(renameCollision.code, "IMPORT_MAPPING_PROFILE_NAME_CONFLICT");
  h.state.lockHeld = true;
  assert.equal(h.context.saveImportMappingProfile(validPayload({ profileName: "Bloqueado" })).code, "IMPORT_MAPPING_PROFILE_LOCK_TIMEOUT");
  h.state.lockHeld = false;
}

{
  const h = makeHarness();
  const first = h.context.saveImportMappingProfile(validPayload());
  h.state.actor = { userId: "U-2", role: "Contador", institutionId: "INST-1", authorized: true };
  const otherUser = h.context.getImportMappingProfiles({ sessionToken: "SESSION-2" });
  assert.equal(otherUser.status, "success");
  assert.equal(otherUser.profiles.length, 0, "profiles must remain private to their owner");
  assert.equal(h.context.saveImportMappingProfile(validPayload({ profileId: first.profileId })).code, "IMPORT_MAPPING_PROFILE_NOT_FOUND");
}

console.log("Import mapping profile contract PASS: authorization, schema validation, owner isolation, exact header binding, version history and lock contention.");
