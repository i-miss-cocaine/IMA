"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const safeErrorContext = {};
vm.createContext(safeErrorContext);
vm.runInContext(extract("getSaceSafeErrorCode_") + "\nthis.safeErrorCode=getSaceSafeErrorCode_;", safeErrorContext);
assert.equal(safeErrorContext.safeErrorCode(new Error("SACE_IDENTITY_CALLER_INVALID")), "SACE_IDENTITY_CALLER_INVALID");
assert.equal(safeErrorContext.safeErrorCode(new Error("private student data: 0801-2000-00001")), "INTERNAL_ERROR");
assert(extract("doPost").includes("trustedSaceIdentityRequest ? getSaceSafeErrorCode_(err)"),
  "trusted USER SACE identity errors must retain safe machine-readable codes");

const tables = {
  Usuarios: [
    ["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta"],
    ["STU-1", "Ana Pérez", "11", "A", "", "", "Estudiante", "", 1, "PER-1", "Activa"],
    ["STU-2", "Luis Gómez", "11", "A", "", "", "Estudiante", "", 2, "PER-2", "Activa"],
    ["TEACHER-1", "Docente", "", "", "", "", "Profesor", "", "", "PER-T", "Activa"]
  ],
  Personas: [
    ["PersonaID", "Nombres", "Apellidos", "Identificacion", "EmailContacto", "TelefonoContacto", "EstadoPersona", "FechaCreacion", "FechaActualizacion", "Observaciones", "TipoIdentificacion"],
    ["PER-1", "Ana", "Pérez", "0801-2000-00001", "", "", "Activa", "", "", "", "DNI"],
    ["PER-2", "Luis", "Gómez", "0801-2000-00002", "", "", "Activa", "", "", "", "DNI"]
  ]
};
function contextFor(claims = { userId: "TEACHER-1", role: "Profesor", institutionId: "INST-1" }, overrides = {}) {
  const sheets = {};
  Object.keys(tables).forEach(name => {
    const rows = overrides[name] || tables[name];
    sheets[name] = { getDataRange() { return { getValues() { return rows.map(row => row.slice()); } }; } };
  });
  const context = Object.assign({
    SPREADSHEET_ID: "USER-SHEET",
    verifySessionToken(token) { return token === "SESSION-OK" ? claims : null; },
    SpreadsheetApp: { openById(id) {
      assert.equal(id, "USER-SHEET");
      return { getSheetByName(name) { return sheets[name] || null; } };
    } },
    LockService: { getScriptLock() { return {
      waitLock(timeout) { assert.equal(timeout, 10000); context.lockWaits++; if (context.lockFails) throw new Error("lock timeout"); context.lockHeld = true; },
      releaseLock() { assert.equal(context.lockHeld, true); context.lockHeld = false; context.lockReleases++; }
    }; } },
    lockWaits: 0, lockReleases: 0, lockHeld: false, lockFails: false,
    Date, String, Number, Array, Object, Set, Error, Math, JSON
  }, overrides.globals || {});
  vm.createContext(context);
  vm.runInContext(extract("getSaceStudentIdentityDirectory_") + "\nthis.readDirectory=getSaceStudentIdentityDirectory_;", context);
  return context;
}
const request = {
  sessionToken: "SESSION-OK",
  teacherUserId: "TEACHER-1",
  institutionId: "INST-1",
  studentIds: ["STU-1", "STU-2"]
};
const successfulDirectoryContext = contextFor();
const result = successfulDirectoryContext.readDirectory(request);
assert.deepEqual({ waits: successfulDirectoryContext.lockWaits, releases: successfulDirectoryContext.lockReleases, held: successfulDirectoryContext.lockHeld },
  { waits: 1, releases: 1, held: false }, "identity and account reads must share one released USER-Service lock");
assert.equal(result.status, "success");
assert.deepEqual(Array.from(result.data, row => [row.userId, row.identity, row.documentType, row.name]), [
  ["STU-1", "0801-2000-00001", "DNI", "Ana Pérez"],
  ["STU-2", "0801-2000-00002", "DNI", "Luis Gómez"]
]);
assert(!Object.prototype.hasOwnProperty.call(result.data[0], "email"));
assert(!Object.prototype.hasOwnProperty.call(result.data[0], "telefono"));
const legacyPeople = tables.Personas.map(row => row.slice(0, 10));
const legacyResult = contextFor(undefined, { Personas: legacyPeople }).readDirectory(request);
assert.equal(legacyResult.data[0].documentType, "", "legacy identity rows do not receive an inferred document type");

assert.throws(() => contextFor().readDirectory(Object.assign({}, request, { sessionToken: "BAD" })), /SACE_IDENTITY_CALLER_INVALID/);
const lockTimeoutContext = contextFor(undefined, { globals: { LockService: { getScriptLock() {
  return { waitLock() { throw new Error("busy"); }, releaseLock() { throw new Error("must not release unowned lock"); } };
} } } });
assert.throws(() => lockTimeoutContext.readDirectory(request), /SACE_IDENTITY_SOURCE_LOCK_TIMEOUT/);

assert.throws(() => contextFor({ userId: "TEACHER-1", role: "Estudiante", institutionId: "INST-1" }).readDirectory(request), /SACE_IDENTITY_CALLER_INVALID/);
assert.throws(() => contextFor().readDirectory(Object.assign({}, request, { teacherUserId: "OTHER" })), /SACE_IDENTITY_CALLER_INVALID/);
assert.throws(() => contextFor().readDirectory(Object.assign({}, request, { institutionId: "INST-OTHER" })), /SACE_IDENTITY_CALLER_INVALID/);
assert.throws(() => contextFor().readDirectory(Object.assign({}, request, { studentIds: ["STU-1", "STU-1"] })), /SACE_IDENTITY_ROSTER_DUPLICATE/);
assert.throws(() => contextFor().readDirectory(Object.assign({}, request, { studentIds: ["STU-UNKNOWN"] })), /SACE_IDENTITY_STUDENT_ACCOUNT_INVALID/);
const inactivePeople = tables.Personas.map(row => row.slice());
inactivePeople[1][6] = "Inactiva";
assert.throws(() => contextFor(undefined, { Personas: inactivePeople }).readDirectory(request), /SACE_IDENTITY_PERSON_INVALID/);
const duplicateIdentity = tables.Personas.map(row => row.slice());
duplicateIdentity[2][3] = duplicateIdentity[1][3];
assert.throws(() => contextFor(undefined, { Personas: duplicateIdentity }).readDirectory(request), /SACE_IDENTITY_DUPLICATE_DOCUMENT/);
const nonCanonicalIdentity = tables.Personas.map(row => row.slice());
nonCanonicalIdentity[1][3] = " --- ";
assert.throws(() => contextFor(undefined, { Personas: nonCanonicalIdentity }).readDirectory(
  Object.assign({}, request, { studentIds: ["STU-1"] })
), /SACE_IDENTITY_DOCUMENT_INVALID/);

const handlerContext = contextFor();
vm.runInContext(extract("handleTrustedMigrationEnvelope_") + "\nthis.handleTrusted=handleTrustedMigrationEnvelope_;", handlerContext);
handlerContext.verifyInterServiceEnvelope = function(envelope, target, credentialType) {
  assert.equal(target, "USER");
  assert.equal(credentialType, "IMA_MIGRATION_HMAC_SECRET");
  return {
    sourceService: envelope.sourceService,
    action: envelope.action,
    payload: envelope.payload
  };
};
const routed = handlerContext.handleTrusted({
  sourceService: "ACADEMIC", targetService: "USER",
  action: "getSaceStudentIdentityDirectory", payload: request
});
assert.equal(routed.status, "success");
assert.throws(() => handlerContext.handleTrusted({
  sourceService: "USER", targetService: "USER",
  action: "getSaceStudentIdentityDirectory", payload: request
}), /MIGRATION_SOURCE_NOT_ALLOWED/);
assert.throws(() => handlerContext.handleTrusted({
  sourceService: "ACCOUNTING", targetService: "USER",
  action: "getSaceStudentIdentityDirectory", payload: request
}), /MIGRATION_ACTION_NOT_ALLOWED/);
console.log("user-sace-identity-directory: PASS (HMAC-routed academic source, verified teacher session, identity scope and minimal fields)");

const createPersonSource = "function createPerson(payload) {\n  const { nombres, apellidos, identificacion, tipoIdentificacion, emailContacto, telefonoContacto, observaciones } = payload || {};\n  if (!nombres || !apellidos) throw new Error(\"Nombres y apellidos son requeridos para crear una Persona.\");\n  if (tipoIdentificacion !== undefined && tipoIdentificacion !== null && typeof tipoIdentificacion !== \"string\") throw new Error(\"PERSON_DOCUMENT_TYPE_INVALID\");\n  const documentType = String(tipoIdentificacion || \"\").trim();\n  if (documentType.length > 40) throw new Error(\"PERSON_DOCUMENT_TYPE_INVALID\");\n\n  const lock = LockService.getScriptLock();\n  try {\n    lock.waitLock(10000);\n  } catch (lockError) {\n    throw new Error(\"PERSON_CREATE_LOCK_TIMEOUT\");\n  }\n  let personaId;\n  try {\n    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);\n    const sheet = getOrCreateSheet(ss, \"Personas\");\n    const lastColumn = Math.max(sheet.getLastColumn(), 1);\n    let headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(value) { return String(value || \"\").trim(); });\n    const documentTypeIndex = headers.indexOf(\"TipoIdentificacion\");\n    if (documentTypeIndex === -1) {\n      const nextColumn = lastColumn + 1;\n      sheet.getRange(1, nextColumn).setValue(\"TipoIdentificacion\");\n      headers.push(\"TipoIdentificacion\");\n    }\n    const requiredHeaders = [\"PersonaID\", \"Nombres\", \"Apellidos\", \"Identificacion\", \"EmailContacto\", \"TelefonoContacto\", \"EstadoPersona\", \"FechaCreacion\", \"FechaActualizacion\", \"Observaciones\", \"TipoIdentificacion\"];\n    const indexes = {};\n    headers.forEach(function(header, index) {\n      if (header) {\n        if (Object.prototype.hasOwnProperty.call(indexes, header)) throw new Error(\"PERSON_SCHEMA_DUPLICATE_HEADER\");\n        indexes[header] = index;\n      }\n    });\n    if (requiredHeaders.some(function(header) { return indexes[header] === undefined; })) throw new Error(\"PERSON_SCHEMA_INVALID\");\n    const row = Array.from({ length: headers.length }, function() { return \"\"; });\n    const now = new Date();\n    personaId = \"PER-\" + now.getTime();\n    row[indexes.PersonaID] = personaId;\n    row[indexes.Nombres] = String(nombres).trim();\n    row[indexes.Apellidos] = String(apellidos).trim();\n    row[indexes.Identificacion] = identificacion ? String(identificacion).trim() : \"\";\n    row[indexes.EmailContacto] = emailContacto ? String(emailContacto).trim().toLowerCase() : \"\";\n    row[indexes.TelefonoContacto] = telefonoContacto ? String(telefonoContacto).trim() : \"\";\n    row[indexes.EstadoPersona] = \"Activa\";\n    row[indexes.FechaCreacion] = now;\n    row[indexes.FechaActualizacion] = now;\n    row[indexes.Observaciones] = observaciones || \"\";\n    row[indexes.TipoIdentificacion] = documentType;\n    sheet.appendRow(row);\n  } finally {\n    lock.releaseLock();\n  }\n\n  logStructuredEvent(\"USER\", \"createPerson\", \"INFO\", \"PERSON_CREATED\", `Persona ${personaId} creada exitosamente`, { personaId, nombres, apellidos }, payload && payload.authRole);\n  return { status: \"success\", personaId: personaId, message: \"Registro central de Persona creado exitosamente.\" };\n}";
assert(createPersonSource.includes("LockService.getScriptLock()") &&
  createPersonSource.includes("lock.waitLock(10000)") &&
  createPersonSource.includes("lock.releaseLock()"),
  "createPerson must coordinate with the identity directory reader lock");
