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
    appointmentSheet: true
  }, options || {});
  const calls = { ownership: [], reads: 0 };
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
    ["CITA-3", "STU-2", "STU-2", "STAFF-B", "Consulta", "2026-11-20T12:00:00Z", "Presencial", "Solicitada", ""],
    ["CITA-4", "STAFF-A", "STU-2", "STAFF-B", "Seguimiento", "2026-11-20T13:00:00Z", "Virtual", "Solicitada", ""],
    ["CITA-5", "STAFF-C", "", "STAFF-A", "Reunión interna", "2026-11-20T14:00:00Z", "Virtual", "Solicitada", ""]
  ];
  const sheets = { Usuarios: users, ExpedientesEstudiantes: expedientes, CitasReuniones: appointments };
  const sheet = name => ({
    getDataRange: () => {
      if (name === "CitasReuniones") calls.reads++;
      return { getValues: () => sheets[name].map(row => row.slice()) };
    }
  });
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
      if (name === "CitasReuniones" && !settings.appointmentSheet) return null;
      return sheets[name] ? sheet(name) : null;
    } }) },
    getInstitutionalDepartmentScope_: () => {
      if (settings.scope === "none") throw new Error("DEPARTMENT_SCOPE_NOT_ASSIGNED");
      return { status: "success", institutionWide: settings.institutionWide, departmentIds: ["DEP-1"] };
    },
    assertRecordOwnership: (payload, type, resourceId, action) => {
      calls.ownership.push({ userId: payload._verifiedUserId, type, resourceId, action });
      return { authorized: settings.allowedExpedientes.includes(resourceId) };
    },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("resolveAbsenceReviewExpedienteId_") + "\n" +
    extractFunction("getAppointmentBookings") +
    "\nthis.run = getAppointmentBookings;",
    runtime
  );
  return { run: runtime.run, calls };
}

function request(role, userId, values) {
  return Object.assign({ _verifiedRole: role, _verifiedUserId: userId }, values || {});
}

const student = makeHarness();
const ownStudentAppointments = student.run(request("Estudiante", "STU-1"));
assert.deepEqual(Array.from(ownStudentAppointments.data, row => row.citaId), ["CITA-1", "CITA-2"]);
const spoofedStudentFilter = student.run(request("Estudiante", "STU-1", { solicitanteId: "STU-2" }));
assert.deepEqual(Array.from(spoofedStudentFilter.data), [], "student cannot use a filter to read another user's appointment");

const guardian = makeHarness();
assert.deepEqual(Array.from(guardian.run(request("Tutor", "GUARDIAN-1")).data, row => row.citaId), ["CITA-2"]);

const departmental = makeHarness({ scope: "assigned", institutionWide: false });
const departmentAppointments = departmental.run(request("Secretaría", "STAFF-A"));
assert.deepEqual(Array.from(departmentAppointments.data, row => row.citaId), ["CITA-1", "CITA-2"]);
assert.deepEqual(departmental.calls.ownership.map(x => x.resourceId).sort(), ["EXP-1", "EXP-1", "EXP-10", "EXP-10"]);

const deniedDepartment = makeHarness({ scope: "assigned", institutionWide: false, allowedExpedientes: [] });
assert.deepEqual(Array.from(deniedDepartment.run(request("Secretaría", "STAFF-A")).data), []);

const institutionWide = makeHarness({ scope: "assigned", institutionWide: true });
assert.equal(institutionWide.run(request("Administrador", "ADMIN-1")).data.length, 5);

const noIdentity = makeHarness();
assert.equal(noIdentity.run({}).code, "VERIFIED_IDENTITY_REQUIRED");
assert.equal(noIdentity.calls.reads, 0);

const missingSheet = makeHarness({ appointmentSheet: false });
assert.deepEqual(Array.from(missingSheet.run(request("Estudiante", "STU-1")).data), []);

console.log("user-appointment-bookings-scope: all assertions passed");
