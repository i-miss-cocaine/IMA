const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const sourcePath = path.join(root, "backend/accounting-service/Code.gs");
const source = fs.readFileSync(sourcePath, "utf8");
new vm.Script(source, { filename: sourcePath });

function extractFunction(name, nextName) {
  const start = source.indexOf("function " + name + "(");
  const end = source.indexOf("function " + nextName + "(", start + 1);
  assert.ok(start >= 0 && end > start, "extractable function " + name);
  return source.slice(start, end);
}

const helperSource =
  extractFunction("transportRows_", "resolveTransportAccessScope_") +
  extractFunction("resolveTransportAccessScope_", "transportAuditDenied_") +
  extractFunction("getTransportRouteIdsForScope_", "getTransportRoutes");

function makeSheet(rows) {
  return { getDataRange: () => ({ getValues: () => rows }) };
}
function makeSpreadsheet(data) {
  return {
    getSheetByName(name) {
      return data[name] ? makeSheet(data[name]) : null;
    }
  };
}
function runScope(payload, data) {
  const context = { SPREADSHEET_ID: "isolated", console };
  vm.runInNewContext(
    helperSource + "\nthis.resolveScope = resolveTransportAccessScope_; this.routeIds = getTransportRouteIdsForScope_;",
    context
  );
  return context.resolveScope(payload, makeSpreadsheet(data));
}

const data = {
  ExpedientesEstudiantes: [
    ["ExpedienteID", "UserId"],
    ["EXP-01", "STU-01"],
    ["EXP-02", "STU-02"]
  ],
  RelacionesFamiliares: [
    ["RelacionID", "ExpedienteID", "ResponsableUserId", "Parentesco", "Estado"],
    ["REL-1", "EXP-01", "PARENT-01", "Madre", "Verificada"],
    ["REL-2", "EXP-02", "PARENT-02", "Padre", "Activa"],
    ["REL-3", "EXP-02", "PARENT-01", "Padre", "Rechazada"]
  ],
  TransporteAsignaciones: [
    ["ID", "RutaID", "EstudianteUserId", "Parada", "Horario", "Estado"],
    ["AS-1", "RUT-01", "STU-01", "Parada A", "06:30", "Activa"],
    ["AS-2", "RUT-02", "STU-02", "Parada B", "06:40", "Activa"],
    ["AS-3", "RUT-03", "STU-01", "Parada C", "06:50", "Inactiva"]
  ],
  TransporteRutas: [
    ["RutaID", "Nombre", "Unidad", "Conductor", "Capacidad", "Paradas", "Estado"],
    ["RUT-01", "Ruta uno", "BUS-1", "DRIVER-1", 20, "[]", "active"],
    ["RUT-02", "Ruta dos", "BUS-2", "DRIVER-2", 20, "[]", "active"],
    ["RUT-03", "Ruta tres", "BUS-3", "DRIVER-1", 20, "[]", "inactive"]
  ],
  TransporteViajes: [
    ["ViajeID", "RutaID", "Unidad", "Conductor", "Monitor", "Fecha", "Jornada", "Inicio", "Fin", "Estado"],
    ["TRIP-1", "RUT-01", "BUS-1", "DRIVER-1", "MONITOR-1", "2026-11-09", "Matutina", "06:00", "", "EnCurso"],
    ["TRIP-2", "RUT-02", "BUS-2", "DRIVER-2", "MONITOR-2", "2026-11-09", "Matutina", "06:00", "", "CerradoNormal"],
    ["TRIP-3", "RUT-03", "BUS-3", "DRIVER-1", "MONITOR-1", "2026-11-09", "Matutina", "06:00", "", "EnCurso"]
  ]
};

// Raw client-supplied role and identity must never override verified claims.
const parent = runScope({
  authRole: "Administrador",
  authUserId: "ROOT",
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, data);
assert.equal(parent.role, "Padre");
assert.deepEqual(Array.from(parent.studentIds), ["EXP-01", "STU-01"]);

const noFamilyLink = runScope({
  authRole: "Padre",
  authUserId: "PARENT-99",
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-99"
}, data);
assert.deepEqual(Array.from(noFamilyLink.studentIds), []);

const student = runScope({
  authRole: "Administrador",
  _verifiedRole: "Estudiante",
  _verifiedUserId: "STU-01"
}, data);
assert.deepEqual(Array.from(student.studentIds), ["STU-01", "EXP-01"]);

const driver = runScope({
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1"
}, data);
assert.deepEqual(Array.from(driver.routeIds), ["RUT-01"]);

const monitor = runScope({
  _verifiedRole: "Monitor",
  _verifiedUserId: "MONITOR-1"
}, data);
assert.deepEqual(Array.from(monitor.routeIds), ["RUT-01"]);

const missingVerifiedClaims = runScope({
  authRole: "Administrador",
  authUserId: "ROOT"
}, data);
assert.equal(missingVerifiedClaims.authorized, false);
assert.equal(missingVerifiedClaims.reason, "VERIFIED_IDENTITY_REQUIRED");

const director = runScope({
  _verifiedRole: "Director",
  _verifiedUserId: "DIRECTOR-1"
}, data);
assert.equal(director.management, true);
assert.equal(director.studentIds, null);
assert.equal(director.routeIds, null);

const context = {};
vm.runInNewContext(
  helperSource + "\nthis.resolveScope = resolveTransportAccessScope_; this.routeIds = getTransportRouteIdsForScope_;",
  context
);
const parentRouteIds = context.routeIds(makeSpreadsheet(data), parent);
assert.deepEqual(Array.from(parentRouteIds), ["RUT-01"]);

assert.ok(source.includes('case "getTransportAssignments": result = getTransportAssignments(payload);'));
assert.ok(source.includes('case "getTransportRoutes": result = getTransportRoutes(payload);'));
assert.ok(source.includes('"UNAUTHORIZED_ACCESS_ATTEMPT"'));
assert.ok(!source.includes('case "getTransportTripLiveLocation"'), "No live-GPS action is registered in this service; do not imply a protected endpoint exists.");

console.log("TASK-030 transport access scope tests: PASS");
