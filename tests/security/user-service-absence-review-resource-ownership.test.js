"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
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
  throw new Error("unclosed function " + name);
}

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const resolver = extractFunction(source, "resolveAbsenceReviewExpedienteId_");
const handler = extractFunction(source, "reviewAbsenceJustification");
const map = {
  SolicitudID: 0, UserId: 1, EstudianteID: 2, TipoTramite: 3, Descripcion: 4, AdjuntoUrl: 5,
  Estado: 6, AsignadoA: 7, ObservacionesAdmin: 8, FechaSolicitud: 9, FechaResolucion: 10,
  JustificacionID: 11, EvidenciaIDsJSON: 12, SyncEstado: 13, FechasAfectadasJSON: 14,
  FechaAfectada: 15, MotivoJustificacion: 16, Periodo: 17, SesionIDsJSON: 18,
  SesionIDsSolicitadasJSON: 19, AlcanceAprobacion: 20, RevisadoPor: 21,
  ObservacionesPublicas: 22, DecisionHistoryJSON: 23, ActualizadoEn: 24, UltimoError: 25,
  AdjuntoSHA256: 26, AdjuntoVersion: 27, AdjuntoSizeBytes: 28, AdjuntoMimeType: 29,
  AdjuntoFechaRecepcion: 30
};
const userHeaders = ["UserID","Email","Nombre","x3","x4","x5","Rol","x7","x8","PersonaID","EstadoCuenta"];
const expHeaders = ["ExpedienteID","PersonaID","CodigoInstitucional"];

function makeHarness(options) {
  const settings = Object.assign({ allowed: true, role: "Secretaría", duplicateRequest: false, studentState: "Activo", duplicateStudentIdentity: false, adminScope: true }, options || {});
  const calls = { ownership: [], academic: [], adminScope: 0, lockReleased: 0 };
  const requestRow = new Array(31).fill("");
  requestRow[map.SolicitudID] = "JUST-1";
  requestRow[map.UserId] = "TUTOR-1";
  requestRow[map.EstudianteID] = "STU-1";
  requestRow[map.TipoTramite] = "Justificación de Ausencia";
  requestRow[map.Estado] = "Pendiente";
  requestRow[map.JustificacionID] = "JUST-1";
  requestRow[map.EvidenciaIDsJSON] = "[]";
  requestRow[map.SyncEstado] = "SINCRONIZADO";
  requestRow[map.DecisionHistoryJSON] = "[]";
  const requestRows = [["SolicitudID","UserID","EstudianteID","TipoTramite","Descripcion","AdjuntoUrl","Estado","AsignadoA","ObservacionesAdmin","FechaSolicitud","FechaResolucion"], requestRow];
  if (settings.duplicateRequest) requestRows.push(requestRow.slice());

  const userRow = ["STU-1","","Estudiante Uno","","","","Estudiante","","","PERSON-1",settings.studentState];
  const users = [userHeaders, userRow];
  if (settings.duplicateStudentIdentity) users.push(userRow.slice());
  const expedientes = [expHeaders, ["EXP-1","PERSON-1","COD-1"]];
  const mkSheet = rows => ({
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    getLastRow: () => rows.length,
    getRange: () => ({ setValues: () => {} })
  });
  const requestSheet = mkSheet(requestRows);
  const sheets = {
    Usuarios: mkSheet(users),
    ExpedientesEstudiantes: mkSheet(expedientes),
    SolicitudesTramites: requestSheet
  };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) },
    getOrCreateSheet: (_ss, name) => sheets[name] || null,
    ensureUserAbsenceRequestSchema_: () => map,
    getUserVerifiedRole: payload => { payload._verifiedUserId = "STAFF-1"; return settings.role; },
    assertRecordOwnership: (...args) => {
      calls.ownership.push(args.slice(1));
      return { authorized: settings.allowed, code: "RESOURCE_SCOPE_DENIED" };
    },
    getInstitutionalDepartmentScope_: () => {
      calls.adminScope++;
      return { status: "success", institutionWide: settings.adminScope };
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => { calls.lockReleased++; } }) },
    getEvidenceRecordsForRequest_: () => [],
    callAcademicAbsenceService_: (action, payload) => {
      calls.academic.push({ action, payload });
      return { status: "success", data: { estado: "Rechazada" } };
    },
    absenceUpdateRequestProjection_: () => {},
    logStructuredEvent: () => {}
  };
  vm.runInNewContext(resolver + "\n" + handler + "\nthis.run = reviewAbsenceJustification;", context);
  return { run: context.run, calls };
}

const allowed = makeHarness();
const result = allowed.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", solicitudId: "JUST-1", nuevoEstado: "Rechazada" });
assert.equal(result.status, "success");
assert.deepEqual(allowed.calls.ownership, [["EXPEDIENTE_ESTUDIANTE", "EXP-1", "UPDATE"]]);
assert.equal(allowed.calls.academic.length, 1);
assert.equal(allowed.calls.academic[0].action, "reviewCanonicalAbsenceJustification");
assert.equal(allowed.calls.lockReleased, 1);

const denied = makeHarness({ allowed: false });
assert.equal(denied.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", solicitudId: "JUST-1", nuevoEstado: "Rechazada" }).code, "RESOURCE_SCOPE_DENIED");
assert.equal(denied.calls.academic.length, 0, "out-of-department reviewer cannot change the canonical decision");

const admin = makeHarness({ role: "Administrador" });
assert.equal(admin.run({ _verifiedUserId: "ADMIN-1", _verifiedRole: "Administrador", solicitudId: "JUST-1", nuevoEstado: "Rechazada" }).status, "success");
assert.equal(admin.calls.adminScope, 1);
assert.equal(admin.calls.ownership.length, 0);

const adminWithoutInstitutionScope = makeHarness({ role: "Administrador", adminScope: false });
assert.equal(adminWithoutInstitutionScope.run({ _verifiedUserId: "ADMIN-1", _verifiedRole: "Administrador", solicitudId: "JUST-1", nuevoEstado: "Rechazada" }).code, "RESOURCE_SCOPE_DENIED");
assert.equal(adminWithoutInstitutionScope.calls.academic.length, 0);

const duplicateRequest = makeHarness({ duplicateRequest: true });
assert.equal(duplicateRequest.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", solicitudId: "JUST-1", nuevoEstado: "Rechazada" }).code, "RESOURCE_AMBIGUOUS");
assert.equal(duplicateRequest.calls.academic.length, 0);

const inactiveStudent = makeHarness({ studentState: "Inactivo" });
assert.equal(inactiveStudent.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", solicitudId: "JUST-1", nuevoEstado: "Rechazada" }).code, "STUDENT_IDENTITY_UNVERIFIED");
assert.equal(inactiveStudent.calls.academic.length, 0);

const duplicateStudent = makeHarness({ duplicateStudentIdentity: true });
assert.equal(duplicateStudent.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", solicitudId: "JUST-1", nuevoEstado: "Rechazada" }).code, "STUDENT_IDENTITY_AMBIGUOUS");
assert.equal(duplicateStudent.calls.academic.length, 0);

console.log("user-service-absence-review-resource-ownership: all assertions passed");
