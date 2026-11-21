const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const sourcePath = path.join(root, "backend/accounting-service/Code.gs");
const source = fs.readFileSync(sourcePath, "utf8");
new vm.Script(source, { filename: sourcePath });

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "extractable function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
const helperNames = [
  "getVerifiedAccountingIdentity_", "transportRows_", "transportDateBoundary_", "transportRelationshipIsCurrent_",
  "transportEmployeeIdsForUser_", "resolveTransportAccessScope_", "transportAuditDenied_",
  "getTransportRouteIdsForScope_", "getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"
];
const helperSource = helperNames.map(extractFunction).join("\n");

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
const issuedSessions = {
  "SESSION-PARENT-01": { userId: "PARENT-01", role: "Padre" },
  "SESSION-PARENT-99": { userId: "PARENT-99", role: "Padre" },
  "SESSION-PARENT-03": { userId: "PARENT-03", role: "Padre" },
  "SESSION-PARENT-04": { userId: "PARENT-04", role: "Padre" },
  "SESSION-STU-01": { userId: "STU-01", role: "Estudiante" },
  "SESSION-STU-02": { userId: "STU-02", role: "Estudiante" },
  "SESSION-DRIVER-1": { userId: "DRIVER-1", role: "Conductor" },
  "SESSION-DRIVER-2": { userId: "DRIVER-2", role: "Conductor" },
  "SESSION-MONITOR-1": { userId: "MONITOR-1", role: "Monitor" },
  "SESSION-MONITOR-2": { userId: "MONITOR-2", role: "Monitor" },
  "SESSION-DIRECTOR-1": { userId: "DIRECTOR-1", role: "Director" }
};
function makeAuthContext(data) {
  return {
    requestAccountingUserAuthorization_: function(action, payload) {
      if (action !== "verifyAccountingSession") return { status: "error", code: "AUTH_ACTION_NOT_ALLOWED" };
      const claim = issuedSessions[String(payload && payload.sessionToken || "")];
      if (!claim) return { status: "error", code: "VERIFIED_IDENTITY_REQUIRED" };
      const users = (data.Usuarios || []).slice(1).filter(row => String(row[0] || "").trim() === claim.userId);
      if (users.length !== 1 || String(users[0][10] || "").trim().toLowerCase() !== "activa" ||
          String(users[0][6] || "").trim() !== claim.role) {
        return { status: "error", code: "ROLE_CHANGED_OR_USER_NOT_FOUND" };
      }
      return { status: "success", authorized: true, userId: claim.userId, role: claim.role,
        institutionId: "I", membershipId: "M-" + claim.userId };
    },
    PropertiesService: { getScriptProperties: function() { return { getProperty: function(key) { return key === "IMA_INSTITUTION_ID" ? "I" : ""; } }; } }
  };
}
function sessionPayload(payload) {
  const token = payload.sessionToken || (payload._verifiedUserId ? "SESSION-" + payload._verifiedUserId : "");
  return Object.assign({}, payload, { sessionToken: token });
}
function runScope(payload, data) {
  const context = Object.assign({ SPREADSHEET_ID: "isolated", console }, makeAuthContext(data));
  vm.runInNewContext(
    helperSource + "\nthis.resolveScope = resolveTransportAccessScope_; this.routeIds = getTransportRouteIdsForScope_;",
    context
  );
  return context.resolveScope(sessionPayload(payload), makeSpreadsheet(data));
}

const data = {
  Usuarios: [
    ["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta"],
    ["PARENT-01", "Parent One", "", "", "", "", "Padre", "", "", "", "Activa"],
    ["PARENT-99", "Parent Missing Link", "", "", "", "", "Padre", "", "", "", "Activa"],
    ["PARENT-03", "Parent Future Link", "", "", "", "", "Padre", "", "", "", "Activa"],
    ["PARENT-04", "Parent Expired Link", "", "", "", "", "Padre", "", "", "", "Activa"],
    ["STU-01", "Student One", "", "", "", "", "Estudiante", "", "", "", "Activa"],
    ["STU-02", "Student Two", "", "", "", "", "Estudiante", "", "", "", "Activa"],
    ["DRIVER-1", "Driver One", "", "", "", "", "Conductor", "", "", "", "Activa"],
    ["DRIVER-2", "Driver Two", "", "", "", "", "Conductor", "", "", "", "Activa"],
    ["MONITOR-1", "Monitor One", "", "", "", "", "Monitor", "", "", "", "Activa"],
    ["MONITOR-2", "Monitor Two", "", "", "", "", "Monitor", "", "", "", "Activa"],
    ["DIRECTOR-1", "Director One", "", "", "", "", "Director", "", "", "", "Activa"]
  ],
  ExpedientesEstudiantes: [
    ["ExpedienteID", "UserId"],
    ["EXP-01", "STU-01"],
    ["EXP-02", "STU-02"]
  ],
  ExpedientesLaborales: [
    ["ExpedienteID", "PersonaID", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "Estado", "Observaciones"],
    ["EMP-DRIVER-1", "PERS-D1", "DRIVER-1", "Conductor", "Transporte", "General", "2024-01-01", "", "active", ""],
    ["EMP-DRIVER-2", "PERS-D2", "DRIVER-2", "Conductor", "Transporte", "General", "2024-01-01", "", "active", ""],
    ["EMP-MONITOR-1", "PERS-M1", "MONITOR-1", "Monitor", "Transporte", "General", "2024-01-01", "", "active", ""],
    ["EMP-MONITOR-2", "PERS-M2", "MONITOR-2", "Monitor", "Transporte", "General", "2024-01-01", "", "active", ""]
  ],
  RelacionesFamiliares: [
    ["RelacionID", "ExpedienteID", "ResponsableUserId", "Parentesco", "Estado", "FechaInicio", "FechaFin", "Observaciones", "PermisosJSON"],
    ["REL-1", "EXP-01", "PARENT-01", "Madre", "Verificada", "2020-01-01", "2099-12-31", "", "{}"],
    ["REL-2", "EXP-02", "PARENT-02", "Padre", "Activa", "2026-11-08", "2026-11-10", "", "{}"],
    ["REL-3", "EXP-02", "PARENT-01", "Padre", "Rechazada", "2026-11-08", "2026-11-10", "", "{}"],
    ["REL-4", "EXP-02", "PARENT-03", "Madre", "Activa", "2099-01-01", "", "", "{}"],
    ["REL-5", "EXP-02", "PARENT-04", "Padre", "Activa", "2020-01-01", "2020-12-31", "", "{}"]
  ],
  TransporteAsignaciones: [
    ["ID", "RutaID", "EstudianteUserId", "Parada", "Horario", "Estado", "Fecha", "Jornada"],
    ["AS-1", "RUT-01", "STU-01", "Parada A", "06:30", "Activa", "2026-11-09", "Matutina"],
    ["AS-2", "RUT-02", "STU-02", "Parada B", "06:40", "Activa", "2026-11-09", "Matutina"],
    ["AS-3", "RUT-03", "STU-01", "Parada C", "06:50", "Inactiva", "2026-11-09", "Matutina"],
    ["AS-4", "RUT-01", "STU-02", "Parada D", "06:55", "Inactiva", "2026-11-09", "Matutina"]
  ],
  TransporteRutas: [
    ["RutaID", "Nombre", "Unidad", "Conductor", "Capacidad", "Paradas", "Estado"],
    ["RUT-01", "Ruta uno", "BUS-1", "EMP-DRIVER-1", 20, "[]", "active"],
    ["RUT-02", "Ruta dos", "BUS-2", "EMP-DRIVER-2", 20, "[]", "active"],
    ["RUT-03", "Ruta tres", "BUS-3", "EMP-DRIVER-1", 20, "[]", "inactive"]
  ],
  TransporteViajes: [
    ["ViajeID", "RutaID", "Unidad", "Conductor", "Monitor", "Fecha", "Jornada", "Inicio", "Fin", "Estado"],
    ["TRIP-1", "RUT-01", "BUS-1", "EMP-DRIVER-1", "EMP-MONITOR-1", "2026-11-09", "Matutina", "06:00", "", "EnCurso"],
    ["TRIP-2", "RUT-02", "BUS-2", "EMP-DRIVER-2", "EMP-MONITOR-2", "2026-11-09", "Matutina", "06:00", "", "CerradoNormal"],
    ["TRIP-3", "RUT-03", "BUS-3", "EMP-DRIVER-1", "EMP-MONITOR-1", "2026-11-09", "Matutina", "06:00", "", "EnCurso"]
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

const futureFamilyLink = runScope({
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-03"
}, data);
assert.deepEqual(Array.from(futureFamilyLink.studentIds), []);

const expiredFamilyLink = runScope({
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-04"
}, data);
assert.deepEqual(Array.from(expiredFamilyLink.studentIds), []);
const roleChangedData = Object.assign({}, data, {
  Usuarios: data.Usuarios.map(row => row[0] === "PARENT-01" ? row.map((value, index) => index === 6 ? "Estudiante" : value) : row)
});
const staleRole = runScope({
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, roleChangedData);
assert.equal(staleRole.authorized, false);
assert.equal(staleRole.reason, "ROLE_CHANGED_OR_USER_NOT_FOUND");

const revokedRelationshipData = Object.assign({}, data, {
  RelacionesFamiliares: [
    data.RelacionesFamiliares[0],
    data.RelacionesFamiliares[1].map((value, index) => index === 4 ? "Revocada" : value)
  ],
  RelacionesEstudianteTutor: [
    ["RelacionID", "EstudianteID", "TutorUserId", "Parentesco", "", "", "", "", "", "Estado"],
    ["LEGACY-REL", "EXP-02", "PARENT-01", "Madre", "", "", "", "", "", "Activa"]
  ]
});
const revokedRelationship = runScope({
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, revokedRelationshipData);
assert.deepEqual(Array.from(revokedRelationship.studentIds), []);

const legacyOnlyData = Object.assign({}, data, {
  RelacionesEstudianteTutor: [
    ["RelacionID", "EstudianteID", "TutorUserId", "Parentesco", "", "", "", "", "", "Estado"],
    ["LEGACY-REL", "EXP-02", "PARENT-01", "Madre", "", "", "", "", "", "Activa"]
  ]
});
delete legacyOnlyData.RelacionesFamiliares;
const legacyFallback = runScope({
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, legacyOnlyData);
assert.ok(Array.from(legacyFallback.studentIds).includes("STU-02"));



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
assert.deepEqual(Array.from(driver.employeeIds), ["EMP-DRIVER-1"]);

const monitor = runScope({
  _verifiedRole: "Monitor",
  _verifiedUserId: "MONITOR-1"
}, data);
assert.deepEqual(Array.from(monitor.routeIds), ["RUT-01"]);
assert.deepEqual(Array.from(monitor.employeeIds), ["EMP-MONITOR-1"]);

const inactiveEmploymentData = Object.assign({}, data, {
  ExpedientesLaborales: data.ExpedientesLaborales.map(row =>
    row[2] === "DRIVER-1" ? row.map((value, index) => index === 8 ? "terminated" : value) : row
  )
});
const inactiveDriver = runScope({
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1"
}, inactiveEmploymentData);
assert.deepEqual(Array.from(inactiveDriver.routeIds), []);

const revokedDriverAssignmentData = Object.assign({}, data, {
  TransporteViajes: [
    data.TransporteViajes[0],
    data.TransporteViajes[1].map((value, index) => index === 9 ? "CerradoNormal" : value),
    data.TransporteViajes[2],
    data.TransporteViajes[3]
  ]
});
const revokedDriverScope = runScope({
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1"
}, revokedDriverAssignmentData);
assert.deepEqual(Array.from(revokedDriverScope.routeIds), []);


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


function runEndpoint(name, payload, spreadsheetData) {
  const events = [];
  const context = Object.assign({
    SPREADSHEET_ID: "isolated",
    SpreadsheetApp: { openById: () => makeSpreadsheet(spreadsheetData) },
    logStructuredEvent: (...args) => events.push(args),
    getOrCreateTransportVehiclesCatalog: () => {}
  }, makeAuthContext(spreadsheetData));
  vm.runInNewContext(
    helperSource +
      "\nthis.getTransportRoutes = getTransportRoutes; this.getTransportAssignments = getTransportAssignments; this.getTripPassengerManifest = getTripPassengerManifest;",
    context
  );
  return { result: context[name](sessionPayload(payload)), events };
}

const parentAssignments = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  authRole: "Administrador",
  authUserId: "ROOT"
}, data);
assert.equal(parentAssignments.result.total, 1);
assert.ok(parentAssignments.result.asignaciones.every(x => x.estudianteUserId === "STU-01"));

const studentAssignments = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Estudiante",
  _verifiedUserId: "STU-01"
}, data);
assert.equal(studentAssignments.result.total, 1);
assert.ok(studentAssignments.result.asignaciones.every(x => x.estudianteUserId === "STU-01"));

const parentIdorAttempt = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  estudianteUserId: "STU-02"
}, data);
assert.equal(parentIdorAttempt.result.code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.ok(parentIdorAttempt.events.some(x => x[3] === "UNAUTHORIZED_ACCESS_ATTEMPT"));

const parentForeignRouteAttempt = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  rutaId: "RUT-02"
}, data);
assert.equal(parentForeignRouteAttempt.result.code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.ok(parentForeignRouteAttempt.events.some(x => x[3] === "UNAUTHORIZED_ACCESS_ATTEMPT"));


const studentIdorAttempt = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Estudiante",
  _verifiedUserId: "STU-01",
  estudianteUserId: "STU-02"
}, data);
assert.equal(studentIdorAttempt.result.code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.ok(studentIdorAttempt.events.some(x => x[3] === "UNAUTHORIZED_ACCESS_ATTEMPT"));

const driverAssignments = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1"
}, data);
assert.equal(driverAssignments.result.total, 1);
assert.equal(driverAssignments.result.asignaciones[0].rutaId, "RUT-01");
assert.deepEqual(Array.from(driverAssignments.result.asignaciones.map(x => x.estudianteUserId)), ["STU-01"]);

const driverRoutes = runEndpoint("getTransportRoutes", {
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1"
}, data);
assert.equal(driverRoutes.result.rutas.length, 1);
assert.equal(driverRoutes.result.rutas[0].rutaId, "RUT-01");
assert.equal(driverRoutes.result.rutas[0].conductorEmpleadoId, "");

const parentRoutes = runEndpoint("getTransportRoutes", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, data);
assert.equal(parentRoutes.result.rutas.length, 1);
assert.equal(parentRoutes.result.rutas[0].rutaId, "RUT-01");

const foreignRouteAttempt = runEndpoint("getTransportRoutes", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  rutaId: "RUT-02"
}, data);
assert.equal(foreignRouteAttempt.result.code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.ok(foreignRouteAttempt.events.some(x => x[3] === "UNAUTHORIZED_ACCESS_ATTEMPT"));

const noClaimsAssignments = runEndpoint("getTransportAssignments", {
  authRole: "Administrador",
  authUserId: "ROOT"
}, data);
assert.equal(noClaimsAssignments.result.code, "VERIFIED_IDENTITY_REQUIRED");

const parentManifest = runEndpoint("getTripPassengerManifest", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  viajeId: "TRIP-1"
}, data);
assert.equal(parentManifest.result.status, "success");
assert.equal(parentManifest.result.manifiestoPasajeros.length, 1);
assert.equal(parentManifest.result.manifiestoPasajeros[0].estudianteUserId, "STU-01");

const driverManifest = runEndpoint("getTripPassengerManifest", {
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1",
  viajeId: "TRIP-1"
}, data);
assert.equal(driverManifest.result.status, "success");
assert.equal(driverManifest.result.manifiestoPasajeros.length, 1);

const foreignDriverTrip = runEndpoint("getTripPassengerManifest", {
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1",
  viajeId: "TRIP-2"
}, data);
assert.equal(foreignDriverTrip.result.code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.ok(foreignDriverTrip.events.some(x => x[3] === "UNAUTHORIZED_ACCESS_ATTEMPT"));


assert.ok(source.includes('if (request.action === "getTransportAssignments") return respond(getTransportAssignments(actionPayload));'));
assert.ok(source.includes('if (request.action === "getTransportRoutes") return respond(getTransportRoutes(actionPayload));'));

assert.ok(source.includes('"Conductor": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"]'));
assert.ok(source.includes('"Monitor": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"]'));

assert.ok(source.includes('"UNAUTHORIZED_ACCESS_ATTEMPT"'));
assert.ok(!source.includes('request.action === "getTransportTripLiveLocation"'), "No live-GPS action is registered in this service; do not imply a protected endpoint exists.");


const duplicateRouteData = Object.assign({}, data, {
  TransporteRutas: data.TransporteRutas.concat([
    ["RUT-01", "Duplicated route identifier", "BUS-X", "EMP-DRIVER-2", 20, "[]", "active"]
  ])
});
const duplicateParentScope = runScope({
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, duplicateRouteData);
assert.deepEqual(Array.from(duplicateParentScope.routeIds), [],
  "a duplicated route identifier must not grant parent route scope");
const duplicateDriverScope = runScope({
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1"
}, duplicateRouteData);
assert.deepEqual(Array.from(duplicateDriverScope.routeIds), [],
  "a duplicated route identifier must not grant driver route scope");
const duplicateRouteRead = runEndpoint("getTransportRoutes", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  rutaId: "RUT-01"
}, duplicateRouteData);
assert.equal(duplicateRouteRead.result.code, "RESOURCE_AMBIGUOUS");
const duplicateManagementRouteList = runEndpoint("getTransportRoutes", {
  _verifiedRole: "Director",
  _verifiedUserId: "DIRECTOR-1"
}, duplicateRouteData);
assert.ok(duplicateManagementRouteList.result.rutas.every(route => route.rutaId !== "RUT-01"),
  "ambiguous route IDs must be excluded even from management list projection");
const duplicateParentAssignments = runEndpoint("getTransportAssignments", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01"
}, duplicateRouteData);
assert.equal(duplicateParentAssignments.result.total, 0,
  "ambiguous route identifiers must not expose assignment rows");
const duplicateParentManifest = runEndpoint("getTripPassengerManifest", {
  _verifiedRole: "Padre",
  _verifiedUserId: "PARENT-01",
  viajeId: "TRIP-1"
}, duplicateRouteData);
assert.equal(duplicateParentManifest.result.code, "UNAUTHORIZED_ACCESS_ATTEMPT",
  "manifest access must fail closed when the route identifier is ambiguous");

const duplicateTripData = Object.assign({}, data, {
  TransporteViajes: data.TransporteViajes.concat([data.TransporteViajes[1].slice()])
});
const duplicateTripManifest = runEndpoint("getTripPassengerManifest", {
  _verifiedRole: "Conductor",
  _verifiedUserId: "DRIVER-1",
  viajeId: "TRIP-1"
}, duplicateTripData);
assert.equal(duplicateTripManifest.result.code, "RESOURCE_NOT_FOUND",
  "duplicate trip identifiers must not resolve to an arbitrary trip");

console.log("TASK-030 transport access scope tests: PASS");
