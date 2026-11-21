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
    ["SOL-1", "STU-1", "STU-1", "Justificación", "Solicitud estudiante uno", "", "Pendiente", "Secretaría", "", "2026-11-20", ""],
    ["SOL-10", "STU-2", "STU-2", "Justificación", "Solicitud estudiante diez", "", "Pendiente", "Dirección", "", "2026-11-20", ""],
    ["SOL-G", "GUARDIAN-1", "STU-1", "Constancia", "Solicitud tutor", "", "Pendiente", "Secretaría", "", "2026-11-21", ""],
    ["SOL-NA", "USER-X", "", "General", "Solicitud sin estudiante", "", "Pendiente", "Secretaría", "", "2026-11-21", ""]
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
    getOrCreateSheet: () => { throw new Error("read path must not create sheets"); },
    getInstitutionalDepartmentScope_: () => {
      if (settings.scope === "none") throw new Error("DEPARTMENT_SCOPE_NOT_ASSIGNED");
      return { status: "success", institutionWide: settings.institutionWide, departmentIds: ["DEP-1"] };
    },
    assertRecordOwnership: (payload, type, resourceId, action) => {
      calls.ownership.push({ userId: payload._verifiedUserId, type, resourceId, action });
      return { authorized: settings.allowedExpedientes.includes(resourceId) };
    },
    requestAttachmentHeaderMap_: () => ({}),
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("resolveAbsenceReviewExpedienteId_") + "\n" +
    extractFunction("getAdministrativeRequests") +
    "\nthis.run = getAdministrativeRequests;",
    runtime
  );
  return { run: runtime.run, calls };
}

function request(role, userId, values) {
  return Object.assign({ _verifiedRole: role, _verifiedUserId: userId }, values || {});
}

const student = makeHarness();
const studentRequests = student.run(request("Estudiante", "STU-1", {
  userId: "STU-2", estudianteId: "STU-2"
}));
assert.deepEqual(Array.from(studentRequests.data, row => row.solicitudId), ["SOL-1"],
  "student payload filters cannot select another user's requests");

const guardian = makeHarness();
const guardianRequests = guardian.run(request("Tutor", "GUARDIAN-1", {
  userId: "STU-2", estudianteId: "STU-2"
}));
assert.deepEqual(Array.from(guardianRequests.data, row => row.solicitudId), ["SOL-G"],
  "guardian sees only requests submitted by the verified guardian");

const departmental = makeHarness({ scope: "assigned", institutionWide: false });
const scopedRequests = departmental.run(request("Director", "DIR-1"));
assert.deepEqual(Array.from(scopedRequests.data, row => row.solicitudId), ["SOL-1", "SOL-G"],
  "departmental staff see only requests whose student expediente is owned");

const filteredDepartment = makeHarness({ scope: "assigned", institutionWide: false });
assert.deepEqual(Array.from(filteredDepartment.run(request("Director", "DIR-1", { userId: "GUARDIAN-1" })).data,
  row => row.solicitudId), ["SOL-G"], "client filters only narrow the authorized set");

const deniedDepartment = makeHarness({ scope: "assigned", institutionWide: false, allowedExpedientes: [] });
assert.deepEqual(Array.from(deniedDepartment.run(request("Director", "DIR-1")).data), []);

const institutionWide = makeHarness({ scope: "assigned", institutionWide: true });
assert.equal(institutionWide.run(request("Administrador", "ADMIN-1")).data.length, 4);

const noScope = makeHarness({ scope: "none" });
assert.deepEqual(Array.from(noScope.run(request("Director", "DIR-1", { userId: "STU-2" })).data), [],
  "staff without verified scope cannot spoof userId and is reduced to their own submitted requests");

const noIdentity = makeHarness();
assert.equal(noIdentity.run({ userId: "STU-2" }).code, "VERIFIED_IDENTITY_REQUIRED");
assert.equal(noIdentity.calls.reads, 0);

const missingSheet = makeHarness({ requestSheet: false });
assert.deepEqual(Array.from(missingSheet.run(request("Estudiante", "STU-1")).data), []);

console.log("user-administrative-requests-scope: all assertions passed");
