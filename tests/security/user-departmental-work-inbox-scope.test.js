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

function normalizeString(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function makeHarness(options) {
  const settings = Object.assign({
    scope: "assigned",
    institutionWide: false,
    allowedExpedientes: ["EXP-1"],
    requestSheet: true
  }, options || {});
  const calls = { reads: 0, ownership: [] };
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
  const requests = [
    ["SolicitudID", "UserID", "EstudianteID", "TipoTramite", "Descripcion", "AdjuntoURL", "Estado", "AsignadoA", "ObservacionesAdmin", "FechaSolicitud", "FechaResolucion"],
    ["SOL-1", "STU-1", "STU-1", "Justificación", "Solicitud uno", "", "Pendiente", "Secretaria", "", "2026-11-20", ""],
    ["SOL-10", "STU-2", "STU-2", "Justificación", "Solicitud diez", "", "Pendiente", "Direccion", "", "2026-11-20", ""],
    ["SOL-2", "STU-1", "STU-1", "Constancia", "Solicitud dos", "", "Pendiente", "Profesor", "", "2026-11-21", ""],
    ["SOL-NA", "USER-X", "", "General", "Sin estudiante", "", "Pendiente", "Secretaria", "", "2026-11-21", ""]
  ];
  const sheets = { Usuarios: users, ExpedientesEstudiantes: expedientes, SolicitudesTramites: requests };
  const sheet = name => ({
    getDataRange: () => {
      if (name === "SolicitudesTramites") calls.reads++;
      return { getValues: () => sheets[name].map(row => row.slice()) };
    }
  });
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
      if (name === "SolicitudesTramites" && !settings.requestSheet) return null;
      return sheets[name] ? sheet(name) : null;
    } }) },
    getInstitutionalDepartmentScope_: () => {
      if (settings.scope === "none") throw new Error("DEPARTMENT_SCOPE_NOT_ASSIGNED");
      return { status: "success", institutionWide: settings.institutionWide, departmentIds: ["DEP-1"] };
    },
    assertRecordOwnership: (payload, type, resourceId, operation) => {
      calls.ownership.push({ userId: payload._verifiedUserId, type, resourceId, operation });
      return { authorized: settings.allowedExpedientes.includes(resourceId) };
    },
    normalizeString,
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("resolveAbsenceReviewExpedienteId_") + "\n" +
    extractFunction("getDepartmentalWorkInbox") +
    "\nthis.run = getDepartmentalWorkInbox;",
    runtime
  );
  return { run: runtime.run, calls };
}

function request(role, userId, values) {
  return Object.assign({ _verifiedRole: role, _verifiedUserId: userId }, values || {});
}

const departmental = makeHarness();
const result = departmental.run(request("Director", "DIR-1", {
  departamento: "Direccion", authRole: "Direccion"
}));
assert.equal(result.status, "success");
assert.equal(result.departamento, "Director", "response metadata uses verified role, not client authRole");
assert.deepEqual(Array.from(result.solicitudes, row => row.solicitudId), ["SOL-1", "SOL-2"],
  "client-supplied department cannot expand the actor's expediente scope");
assert.deepEqual(departmental.calls.ownership.map(x => x.resourceId).sort(), ["EXP-1", "EXP-1", "EXP-10"]);

const deniedDepartment = makeHarness({ allowedExpedientes: [] });
assert.deepEqual(Array.from(deniedDepartment.run(request("Director", "DIR-1")).solicitudes), []);

const institutionWide = makeHarness({ institutionWide: true });
const filteredWide = institutionWide.run(request("Administrador", "ADMIN-1", { departamento: "Secretaría" }));
assert.deepEqual(Array.from(filteredWide.solicitudes, row => row.solicitudId), ["SOL-1", "SOL-NA"]);
const allWide = institutionWide.run(request("Administrador", "ADMIN-1"));
assert.equal(allWide.solicitudes.length, 4);

const noIdentity = makeHarness();
assert.equal(noIdentity.run({ departamento: "Direccion" }).code, "VERIFIED_IDENTITY_REQUIRED");
assert.equal(noIdentity.calls.reads, 0);

const noScope = makeHarness({ scope: "none" });
assert.equal(noScope.run(request("Director", "DIR-1")).code, "INSTITUTIONAL_SCOPE_UNVERIFIED");

const missingSheet = makeHarness({ requestSheet: false });
assert.deepEqual(Array.from(missingSheet.run(request("Director", "DIR-1")).solicitudes), []);

console.log("user-departmental-work-inbox-scope: all assertions passed");
