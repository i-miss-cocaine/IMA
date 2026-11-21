"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
new vm.Script(source);

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
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

const headers = {
  TransporteRutas: ["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado"],
  TransporteAsignaciones: ["ID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada"],
  TransporteViajes: ["ViajeID","RutaID","Unidad","Conductor","Monitor","Fecha","Jornada","Inicio","Fin","Estado"],
  ExpedientesEstudiantes: ["ExpedienteID","UserId"],
  ExpedientesLaborales: ["ExpedienteID","UserId","Puesto","EstadoLaboral"]
};

function makeHarness(options) {
  const cfg = Object.assign({
    actor: { authorized: true, userId: "DIR-1", role: "Director", institutionId: "INST-1", membershipId: "MEM-1" },
    permission: true,
    institutionWide: true,
    duplicateTrip: false
  }, options || {});
  const calls = { permissions: [], scopes: 0, opens: 0, reads: Object.create(null), denied: [] };
  const data = {
    TransporteRutas: [headers.TransporteRutas,
      ["R-1","Ruta 1","BUS-1","EMP-1",10,"[]","active"],
      ["R-2","Ruta 2","BUS-2","EMP-2",8,"[]","active"],
      ["R-3","Ruta inactiva","BUS-3","EMP-3",8,"[]","inactive"]],
    TransporteAsignaciones: [headers.TransporteAsignaciones,
      ["A-1","R-1","STU-1","Parada A","06:30","active","2026-11-21","Matutina"],
      ["A-2","R-1","STU-2","Parada B","06:40","active","2026-11-21","Matutina"],
      ["A-3","R-2","STU-2","Parada C","07:00","active","2026-11-21","Matutina"],
      ["A-4","R-1","STU-1","Parada A","06:30","cancelled","2026-11-20","Matutina"]],
    TransporteViajes: [headers.TransporteViajes,
      ["T-1","R-1","BUS-1","EMP-1","EMP-2","2026-11-21","Matutina","06:30","07:30","active"],
      ["T-2","R-2","BUS-2","EMP-3","EMP-4","2026-11-21","Matutina","07:00","08:00","active"]],
    ExpedientesEstudiantes: [headers.ExpedientesEstudiantes, ["EXP-1","STU-1"], ["EXP-2","STU-2"]],
    ExpedientesLaborales: [headers.ExpedientesLaborales,
      ["LAB-1","DRIVER-1","conductor","active"], ["LAB-2","MONITOR-1","monitor","active"]]
  };
  const ss = {
    getSheetByName(name) {
      if (!data[name]) return null;
      return {
        getDataRange() {
          calls.reads[name] = (calls.reads[name] || 0) + 1;
          return { getValues: () => data[name].map(row => row.slice()) };
        }
      };
    }
  };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById() { calls.opens++; return ss; } },
    getVerifiedAccountingIdentity_() { return cfg.actor; },
    validateRolePermission(actor, action) {
      calls.permissions.push(action);
      return { authorized: cfg.permission, actor, code: "ROLE_PERMISSION_DENIED" };
    },
    getVerifiedAccountingDepartmentScope_() {
      calls.scopes++;
      return cfg.institutionWide
        ? { valid: true, authorized: true, institutionWide: true, institutionId: "INST-1" }
        : { valid: true, authorized: true, institutionWide: false, institutionId: "INST-1" };
    },
    transportAuditDenied_(actor, action, target) { calls.denied.push({ action, target }); },
    Date, String, Number, Object, Array, JSON, Math
  };
  vm.createContext(runtime);
  const names = [
    "transportRows_",
    "transportEmployeeIdsForUser_",
    "getTransportRouteIdsForScope_",
    "resolveTransportAccessScope_",
    "transportReadAccess_",
    "getTransportRoutes",
    "getTransportAssignments",
    "getTripPassengerManifest"
  ];
  vm.runInContext(names.map(extractFunction).join("\n") +
    "\nthis.getRoutes=getTransportRoutes;this.getAssignments=getTransportAssignments;this.getManifest=getTripPassengerManifest;", runtime);
  return { runtime, calls, data, getRoutes: runtime.getRoutes, getAssignments: runtime.getAssignments, getManifest: runtime.getManifest };
}

const management = makeHarness();
const routes = management.getRoutes({ sessionToken: "verified" });
assert.equal(routes.status, "success");
assert.deepEqual(Array.from(routes.rutas, row => row.rutaId), ["R-1","R-2"]);
const assignments = management.getAssignments({ sessionToken: "verified" });
assert.equal(assignments.total, 3);
const manifest = management.getManifest({ sessionToken: "verified", viajeId: "T-1" });
assert.equal(manifest.status, "success");
assert.equal(manifest.manifiestoPasajeros.length, 2);
assert.deepEqual(management.calls.permissions, ["getTransportRoutes","getTransportAssignments","getTripPassengerManifest"]);
assert.equal(management.calls.scopes, 3, "management reads require institution-wide scope");

const deniedPermission = makeHarness({ permission: false });
const deniedRoutes = deniedPermission.getRoutes({ sessionToken: "verified" });
assert.equal(deniedRoutes.code, "ROLE_PERMISSION_DENIED");
assert.equal(deniedPermission.calls.opens, 0, "permission denial must happen before spreadsheet reads");

const departmentOnly = makeHarness({ institutionWide: false });
assert.equal(departmentOnly.getAssignments({ sessionToken: "verified" }).code, "INSTITUTION_WIDE_SCOPE_REQUIRED");
assert.equal(departmentOnly.calls.reads.TransporteAsignaciones || 0, 0, "department-only management scope must not enumerate all assignments");

const student = makeHarness({ actor: { authorized: true, userId: "STU-1", role: "Estudiante", institutionId: "INST-1", membershipId: "MEM-STU" } });
const studentRoutes = student.getRoutes({ sessionToken: "verified" });
assert.deepEqual(Array.from(studentRoutes.rutas, row => row.rutaId), ["R-1"]);
const studentAssignments = student.getAssignments({ sessionToken: "verified" });
assert.deepEqual(Array.from(studentAssignments.asignaciones, row => row.asignacionId), ["A-1"]);
assert.equal(student.getRoutes({ sessionToken: "verified", rutaId: "R-2" }).code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.equal(student.getAssignments({ sessionToken: "verified", estudianteUserId: "STU-2" }).code, "UNAUTHORIZED_ACCESS_ATTEMPT");
const studentManifest = student.getManifest({ sessionToken: "verified", viajeId: "T-1" });
assert.deepEqual(Array.from(studentManifest.manifiestoPasajeros, row => row.asignacionId), ["A-1"]);

const driver = makeHarness({ actor: { authorized: true, userId: "DRIVER-1", role: "Conductor", institutionId: "INST-1", membershipId: "MEM-DRIVER" } });
assert.deepEqual(Array.from(driver.getRoutes({ sessionToken: "verified" }).rutas, row => row.rutaId), ["R-1"]);
assert.equal(driver.getManifest({ sessionToken: "verified", viajeId: "T-1" }).status, "success");
assert.equal(driver.getManifest({ sessionToken: "verified", viajeId: "T-2" }).code, "UNAUTHORIZED_ACCESS_ATTEMPT");

const duplicateTrip = makeHarness({ duplicateTrip: true });
duplicateTrip.data.TransporteViajes.push(duplicateTrip.data.TransporteViajes[1].slice());
assert.equal(duplicateTrip.getManifest({ sessionToken: "verified", viajeId: "T-1" }).code, "RESOURCE_NOT_FOUND");

console.log("accounting-transport-read-scope-ownership: all assertions passed");
