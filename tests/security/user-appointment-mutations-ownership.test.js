"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
function extractFunction(name) {
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
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

function makeHarness(options) {
  const settings = Object.assign({
    scope: "none",
    institutionWide: false,
    allowedExpedientes: ["EXP-1"],
    lockAvailable: true,
    duplicateAppointment: false,
    appointmentSheet: true
  }, options || {});
  const calls = { lockAttempts: 0, releases: 0, appends: 0, writes: [], ownership: [] };
  const users = [
    ["UserID", "PersonaID", "Rol", "EstadoCuenta"],
    ["STU-1", "PERSON-1", "Estudiante", "Activo"],
    ["STU-2", "PERSON-2", "Estudiante", "Activo"]
  ];
  const expedientes = [
    ["ExpedienteID", "PersonaID"],
    ["EXP-1", "PERSON-1"],
    ["EXP-10", "PERSON-2"]
  ];
  const appointments = [
    ["CitaID", "SolicitanteID", "EstudianteID", "SolicitadoA", "Motivo", "FechaHora", "Modalidad", "Estado", "Comentarios"],
    ["CITA-1", "STU-1", "STU-1", "STAFF-A", "Consulta", "2026-11-20T10:00:00Z", "Presencial", "Solicitada", ""],
    ["CITA-2", "GUARDIAN-1", "STU-1", "STAFF-A", "Reunión", "2026-11-20T11:00:00Z", "Virtual", "Solicitada", ""],
    ["CITA-3", "STU-2", "STU-2", "STAFF-B", "Consulta", "2026-11-20T12:00:00Z", "Presencial", "Solicitada", ""]
  ];
  if (settings.duplicateAppointment) appointments.push(appointments[1].slice());
  const sheets = { Usuarios: users, ExpedientesEstudiantes: expedientes, CitasReuniones: appointments };
  const appointmentSheet = {
    getDataRange: () => ({ getValues: () => sheets.CitasReuniones.map(row => row.slice()) }),
    appendRow: row => { sheets.CitasReuniones.push(row.slice()); calls.appends++; },
    getRange: (row, col) => ({ setValue: value => { sheets.CitasReuniones[row - 1][col - 1] = value; calls.writes.push({ row, col, value }); } })
  };
  const lock = {
    tryLock: () => { calls.lockAttempts++; return settings.lockAvailable; },
    releaseLock: () => { calls.releases++; }
  };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
      if (name === "CitasReuniones") return settings.appointmentSheet ? appointmentSheet : null;
      return sheets[name] ? { getDataRange: () => ({ getValues: () => sheets[name].map(row => row.slice()) }) } : null;
    } }) },
    getOrCreateSheet: () => appointmentSheet,
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => "UUID-NEW" },
    getInstitutionalDepartmentScope_: () => {
      if (settings.scope === "none") throw new Error("DEPARTMENT_SCOPE_NOT_ASSIGNED");
      return { status: "success", institutionWide: settings.institutionWide, departmentIds: ["DEP-1"] };
    },
    assertRecordOwnership: (payload, type, resourceId, operation) => {
      calls.ownership.push({ userId: payload._verifiedUserId, type, resourceId, operation });
      return { authorized: settings.allowedExpedientes.includes(resourceId) };
    },
    Date, String, Number, Object, Array, JSON, Set
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("resolveAbsenceReviewExpedienteId_") + "\n" +
    extractFunction("getGuardianPermissionKeyForAction_") + "\n" +
    extractFunction("bookAppointment") + "\n" +
    extractFunction("updateAppointmentStatus") +
    "\nthis.permissionKey = getGuardianPermissionKeyForAction_; this.book = bookAppointment; this.update = updateAppointmentStatus;",
    runtime
  );
  return { book: runtime.book, update: runtime.update, permissionKey: runtime.permissionKey, calls, rows: sheets.CitasReuniones };
}

function request(role, userId, values) {
  return Object.assign({ _verifiedRole: role, _verifiedUserId: userId }, values || {});
}

const studentBooking = makeHarness();
const studentResult = studentBooking.book(request("Estudiante", "STU-1", {
  solicitanteId: "STU-1", estudianteId: "STU-1", solicitadoA: "STAFF-A", motivo: "Consulta", fechaHora: "2026-11-22T10:00:00Z"
}));
assert.equal(studentResult.status, "success");
assert.equal(studentResult.data.citaId, "CITA-UUID-NEW");
assert.equal(studentBooking.rows.at(-1)[1], "STU-1");
assert.equal(studentBooking.calls.releases, 1);

const spoofedRequester = makeHarness();
assert.equal(spoofedRequester.book(request("Estudiante", "STU-1", {
  solicitanteId: "STU-2", solicitadoA: "STAFF-A", motivo: "Consulta", fechaHora: "2026-11-22T10:00:00Z"
})).code, "APPOINTMENT_REQUESTER_MISMATCH");
assert.equal(spoofedRequester.calls.appends, 0);

const guardianBooking = makeHarness();
const guardianResult = guardianBooking.book(request("Tutor", "GUARDIAN-1", {
  solicitanteId: "GUARDIAN-1", estudianteId: "STU-1", _verifiedGuardianStudent: { studentUserId: "STU-1", expedienteId: "EXP-1" },
  solicitadoA: "STAFF-A", motivo: "Reunión", fechaHora: "2026-11-22T11:00:00Z"
}));
assert.equal(guardianResult.status, "success");
assert.equal(guardianBooking.permissionKey("bookAppointment"), "permisoAcademico");

const unverifiedGuardian = makeHarness();
assert.equal(unverifiedGuardian.book(request("Tutor", "GUARDIAN-1", {
  solicitanteId: "GUARDIAN-1", estudianteId: "STU-1", solicitadoA: "STAFF-A", motivo: "Reunión", fechaHora: "2026-11-22T11:00:00Z"
})).code, "GUARDIAN_STUDENT_SCOPE_DENIED");

const scopedStaffBooking = makeHarness({ scope: "assigned", institutionWide: false });
assert.equal(scopedStaffBooking.book(request("Secretaría", "STAFF-A", {
  solicitanteId: "STAFF-A", estudianteId: "STU-1", solicitadoA: "STAFF-B", motivo: "Seguimiento", fechaHora: "2026-11-22T12:00:00Z"
})).status, "success");
assert.equal(scopedStaffBooking.calls.ownership[0].resourceId, "EXP-1");

const deniedStaffBooking = makeHarness({ scope: "assigned", institutionWide: false, allowedExpedientes: [] });
assert.equal(deniedStaffBooking.book(request("Secretaría", "STAFF-A", {
  solicitanteId: "STAFF-A", estudianteId: "STU-2", solicitadoA: "STAFF-B", motivo: "Seguimiento", fechaHora: "2026-11-22T12:00:00Z"
})).code, "RESOURCE_SCOPE_DENIED");

const busyBooking = makeHarness({ lockAvailable: false });
assert.equal(busyBooking.book(request("Estudiante", "STU-1", {
  solicitanteId: "STU-1", estudianteId: "STU-1", solicitadoA: "STAFF-A", motivo: "Consulta", fechaHora: "2026-11-22T10:00:00Z"
})).code, "APPOINTMENT_LOCK_BUSY");

const recipientUpdate = makeHarness();
assert.equal(recipientUpdate.update(request("Secretaría", "STAFF-A", {
  citaId: "CITA-1", nuevoEstado: "Confirmada"
})).status, "success");
assert.equal(recipientUpdate.rows[1][7], "Confirmada");

const requesterDenied = makeHarness();
assert.equal(requesterDenied.update(request("Estudiante", "STU-1", {
  citaId: "CITA-1", nuevoEstado: "Confirmada"
})).code, "APPOINTMENT_SCOPE_DENIED");
assert.equal(requesterDenied.calls.writes.length, 0);

const scopedUpdate = makeHarness({ scope: "assigned", institutionWide: false });
assert.equal(scopedUpdate.update(request("Secretaría", "STAFF-B", {
  citaId: "CITA-1", nuevoEstado: "Confirmada"
})).status, "success");
assert.equal(scopedUpdate.calls.ownership[0].operation, "UPDATE");

const globalUpdate = makeHarness({ scope: "assigned", institutionWide: true });
assert.equal(globalUpdate.update(request("Administrador", "ADMIN-1", {
  citaId: "CITA-1", nuevoEstado: "Confirmada"
})).status, "success");

const duplicateAppointment = makeHarness({ duplicateAppointment: true });
assert.equal(duplicateAppointment.update(request("Secretaría", "STAFF-A", {
  citaId: "CITA-1", nuevoEstado: "Confirmada"
})).code, "APPOINTMENT_AMBIGUOUS");

const noIdentity = makeHarness();
assert.equal(noIdentity.book({ solicitanteId: "STU-1" }).code, "VERIFIED_IDENTITY_REQUIRED");
assert.equal(noIdentity.update({ citaId: "CITA-1", nuevoEstado: "Confirmada" }).code, "VERIFIED_IDENTITY_REQUIRED");

console.log("user-appointment-mutations-ownership: all assertions passed");
