"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const codePath = path.join(root, "backend/accounting-service/Code.gs");
const source = fs.readFileSync(codePath, "utf8");
const dashboard = fs.readFileSync(path.join(root, "dashboard-direccion.html"), "utf8");
const client = fs.readFileSync(path.join(root, "js/transport-analytics.js"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/department-scope-contract.yml"), "utf8");
new vm.Script(source, { filename: codePath });
new vm.Script(client, { filename: "js/transport-analytics.js" });

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const names = [
  "transportRows_", "transportRowsPrefix_", "transportManagementReadScope_", "transportMetricsDateKey_", "transportMetricsTimeMinutes_", "getTransportEfficiencyMetrics"
];
const extracted = names.map(extractFunction).join("\n");
const rows = {
  Usuarios: [
    ["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol"],
    ["DIR-1", "Director", "", "", "", "", "Director"],
    ["PARENT-1", "Tutor", "", "", "", "", "Padre"]
  ],
  TransporteRutas: [
    ["RutaID", "NombreRuta", "UnidadCodigo", "ConductorEmpleadoId", "Capacidad", "ParadasJSON", "Estado", "Observaciones", "HoraInicio", "HoraFin", "Jornada"],
    ["R1", "Ruta Norte", "BUS-1", "DRV-1", 10, "[]", "active", "", "06:30", "07:30", "Matutina"],
    ["R2", "Ruta Sur", "BUS-2", "DRV-2", 8, "[]", "active", "", "06:30", "07:30", "Vespertina"]
  ],
  TransporteVehiculos: [
    ["VehiculoID", "CodigoUnidad", "Placa", "Marca", "Ano", "CapacidadPasajeros"],
    ["V1", "BUS-1", "AAA-001", "Bus 1", 2024, 10],
    ["V2", "BUS-2", "AAA-002", "Bus 2", 2024, 8]
  ],
  TransporteAsignaciones: [
    ["AsignacionID", "RutaID", "EstudianteUserId", "Parada", "Horario", "Estado", "Fecha", "Jornada"],
    ["A1", "R1", "S1", "P1", "06:00", "Activa", "2026-01-01", "Matutina"],
    ["A1-DUP", "R1", "S1", "P1", "06:00", "Activa", "2026-01-01", "Matutina"],
    ["A2", "R1", "S2", "P2", "06:05", "active", "2026-01-01", "Matutina"],
    ["A3", "R1", "S3", "P3", "06:10", "Activa", "2026-01-01", "Matutina"],
    ["A4", "R1", "S4", "P4", "06:15", "Inactiva", "2026-01-01", "Matutina"],
    ...Array.from({length:10}, (_,i)=>["B"+i,"R2","T"+i,"P","06:00","Activa","2026-01-01","Vespertina"])
  ],
  TransporteViajes: [
    ["ViajeID", "RutaID", "Unidad", "Conductor", "Monitor", "Fecha", "Jornada", "HoraInicio", "HoraFin", "Estado"],
    ["T1", "R1", "BUS-1", "DRV-1", "MON-1", "2026-11-13", "Matutina", "06:25", "07:10", "Finalizado"],
    ["T2", "R2", "BUS-2", "DRV-2", "MON-2", "2026-11-14", "Vespertina", "06:45", "07:30", "Finalizado"],
    ["T3", "R1", "BUS-1", "DRV-1", "MON-1", "2026-11-14", "Matutina", "06:40", "07:20", "Finalizado"],
    ["TC", "R1", "BUS-1", "DRV-1", "MON-1", "2026-11-14", "Matutina", "", "", "Cancelado"]
  ],
  TransporteAsistenciaViajes: [
    ["EventoID", "ViajeID", "EstudianteUserId", "Parada", "HoraAbordaje", "HoraDescenso", "Estado"],
    ["E1", "T1", "S1", "P1", "06:26", "07:00", "DESCENDIDO"],
    ["E2", "T1", "S2", "P2", "06:30", "", "A_BORDO"],
    ["E3", "T1", "S2", "P2", "06:31", "", "A_BORDO"]
  ]
};
let lockAvailable = true;
let missingSheet = "";
let invalidHeaderSheet = "";
let lockCalls = 0;
let releaseCount = 0;
let scopeCalls = 0;
let managementScopeCalls = 0;
let managementScopeValid = true;
let invalidateManagementAfterFirst = false;
let invalidateAfterFirstScope = false;
const deniedEvents = [];
const ss = {
  getSheetByName(name) {
    if (name === missingSheet || !Object.prototype.hasOwnProperty.call(rows, name)) return null;
    return { getDataRange: () => ({ getValues: () => {
      const snapshot = rows[name].map(r => r.slice());
      if (name === invalidHeaderSheet) snapshot[0][0] = "UnexpectedHeader";
      return snapshot;
    } }) };
  }
};
const context = {
  SPREADSHEET_ID: "TEST",
  getVerifiedAccountingIdentity_(payload) { return { authorized: true, userId: payload._verifiedUserId, role: payload._verifiedRole, institutionId: "INST-1" }; },
  validateRolePermission(actor, action) { return { authorized: true, actor, action }; },
  SpreadsheetApp: { openById: () => ss },
  LockService: { getScriptLock: () => ({
    tryLock: () => { lockCalls++; return lockAvailable; },
    releaseLock: () => { releaseCount++; }
  }) },
  resolveTransportAccessScope_(payload, spreadsheet) {
    scopeCalls++;
    const role = String(payload && payload._verifiedRole || "");
    const userId = String(payload && payload._verifiedUserId || "");
    const user = spreadsheet.getSheetByName("Usuarios").getDataRange().getValues().slice(1)
      .find(row => String(row[0] || "") === userId);
    if (!role || !userId || !user || String(user[6] || "") !== role ||
        (invalidateAfterFirstScope && scopeCalls % 2 === 0)) {
      return { authorized: false, management: false, role, userId };
    }
    return { authorized: true, management: ["Administrador", "Director", "Subdirector"].includes(role), role, userId };
  },
  getVerifiedAccountingDepartmentScope_(payload, spreadsheet, actor) {
    managementScopeCalls++;
    if (!managementScopeValid || (invalidateManagementAfterFirst && managementScopeCalls === 2)) {
      return { valid: false, authorized: false, code: "INSTITUTION_WIDE_SCOPE_REQUIRED" };
    }
    return { valid: true, authorized: true, institutionId: actor.institutionId || "INST-1", institutionWide: true, departmentIds: [] };
  },
  transportManagementReadScope_(payload, spreadsheet, actor, scope) {
    managementScopeCalls++;
    if (!managementScopeValid || (invalidateManagementAfterFirst && managementScopeCalls === 2)) {
      return { authorized: false, code: "INSTITUTION_WIDE_SCOPE_REQUIRED" };
    }
    return { authorized: true, scope: scope };
  },
  transportAuditDenied_(...args) { deniedEvents.push(args); },
  Date, Math, Number, String, Object, Array, JSON, Error, isFinite, console
};
vm.createContext(context);
vm.runInContext(extracted + "\nfunction getVerifiedAccountingDepartmentScope_(payload, spreadsheet, actor) { return { valid: true, authorized: true, institutionWide: true, institutionId: actor && actor.institutionId || \"INST-1\" }; }\nthis.metrics = getTransportEfficiencyMetrics; this.parseTime = transportMetricsTimeMinutes_;", context);

function run(payload) { return context.metrics(payload); }

const before = JSON.stringify(rows);
assert.equal(context.parseTime("6:30:00 a. m."), 390, "Spanish locale AM times must parse");
assert.equal(context.parseTime("6:45:00 p. m."), 1125, "Spanish locale PM times must parse");
const result = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(result.status, "success", JSON.stringify(result));
assert.equal(result.resumen.viajesAnalizados, 3, "cancelled trips must be excluded");
assert.equal(result.resumen.ocupacionPromedioPct, 58.33);
assert.equal(result.resumen.puntualidadPct, 33.33);
assert.equal(result.resumen.duracionPromedioMinutos, 43.33);
const north = result.rutas.find(r => r.rutaId === "R1");
const south = result.rutas.find(r => r.rutaId === "R2");
assert.equal(north.ocupacionPromedioPct, 25, "actual boarding is used when available; active assignments are fallback");
assert.equal(north.abordajesReales, 1);
assert.equal(north.ocupacionesEstimadas, 1);
assert.equal(south.ocupacionPromedioPct, 125, "over-capacity utilization must not be clamped");
assert.equal(south.sobrecapacidadDetectada, true);
assert.equal(result.indicadoresNoDisponibles.costoOperativoPorEstudiante.estado, "SIN_DATOS");
assert.equal(result.indicadoresNoDisponibles.demandaGeograficaSinCobertura.estado, "SIN_DATOS");
assert.equal(JSON.stringify(rows), before, "analytics must not mutate source sheets");

// Legacy route and trip headers remain readable; unavailable planned start is reported as no metric.
const savedRoutes = rows.TransporteRutas;
const savedTrips = rows.TransporteViajes;
rows.TransporteRutas = savedRoutes.map(row => row.slice(0, 7));
rows.TransporteRutas[0] = ["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado"];
rows.TransporteViajes = savedTrips.map(row => row.slice());
rows.TransporteViajes[0] = ["ViajeID","RutaID","Unidad","Conductor","Monitor","Fecha","Jornada","Inicio","Fin","Estado"];
const legacySchema = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(legacySchema.status, "success", "legacy 7-column route schema must remain supported");
assert.equal(legacySchema.resumen.viajesAnalizados, 3);
assert.equal(legacySchema.resumen.puntualidadPct, null, "legacy route schema has no planned start column");
assert.equal(legacySchema.resumen.duracionPromedioMinutos, 43.33);
rows.TransporteRutas = savedRoutes;
rows.TransporteViajes = savedTrips;

const duplicateRouteRows = rows.TransporteRutas.slice();
rows.TransporteRutas.push(rows.TransporteRutas[1].slice());
assert.equal(run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" }).code, "RESOURCE_AMBIGUOUS",
  "duplicate route IDs must fail closed in analytics");
rows.TransporteRutas = duplicateRouteRows;

const duplicateTripRows = rows.TransporteViajes.slice();
rows.TransporteViajes.push(rows.TransporteViajes[1].slice());
assert.equal(run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" }).code, "RESOURCE_AMBIGUOUS",
  "duplicate trip IDs must fail closed in analytics");
rows.TransporteViajes = duplicateTripRows;

const duplicateAssignmentRows = rows.TransporteAsignaciones.slice();
rows.TransporteAsignaciones.push(rows.TransporteAsignaciones[1].slice());
assert.equal(run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" }).code, "RESOURCE_AMBIGUOUS",
  "duplicate assignment IDs must fail closed in analytics");
rows.TransporteAsignaciones = duplicateAssignmentRows;

const duplicateVehicleRows = rows.TransporteVehiculos.slice();
rows.TransporteVehiculos.push(rows.TransporteVehiculos[1].slice());
assert.equal(run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" }).code, "RESOURCE_AMBIGUOUS",
  "duplicate vehicle codes must fail closed in analytics");
rows.TransporteVehiculos = duplicateVehicleRows;

invalidHeaderSheet = "TransporteViajes";
const invalidSchema = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(invalidSchema.code, "TRANSPORT_SCHEMA_INVALID", "malformed source headers must fail closed");
invalidHeaderSheet = "";
missingSheet = "TransporteAsistenciaViajes";
const missingResource = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(missingResource.code, "TRANSPORT_RESOURCE_NOT_FOUND", "missing source sheets must fail closed");
missingSheet = "";

const filtered = run({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1",
  fechaDesde: "2026-11-14", fechaHasta: "2026-11-14", rutaId: "R1"
});
assert.equal(filtered.resumen.viajesAnalizados, 1);
assert.equal(filtered.rutas.length, 1);
assert.equal(filtered.rutas[0].rutaId, "R1");

const invalidRange = run({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1",
  fechaDesde: "2026-11-15", fechaHasta: "2026-11-01"
});
assert.equal(invalidRange.code, "INVALID_DATE_RANGE");

const lockCallsBeforeDenied = lockCalls;
const noIdentity = run({});
assert.equal(noIdentity.code, "VERIFIED_IDENTITY_REQUIRED");
const nonManagement = run({ _verifiedRole: "Padre", _verifiedUserId: "PARENT-1" });
assert.equal(nonManagement.code, "UNAUTHORIZED_ACCESS_ATTEMPT");
assert.equal(lockCalls, lockCallsBeforeDenied, "unauthorized requests must not acquire the global lock");
assert.ok(deniedEvents.length >= 1);

managementScopeValid = false;
const lockCallsBeforeScopeDenied = lockCalls;
const noInstitutionScope = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(noInstitutionScope.code, "INSTITUTION_WIDE_SCOPE_REQUIRED");
assert.equal(lockCalls, lockCallsBeforeScopeDenied, "institution scope denial must occur before acquiring the global lock");
managementScopeValid = true;

managementScopeCalls = 0;
invalidateManagementAfterFirst = true;
const scopeChanged = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(scopeChanged.code, "INSTITUTION_WIDE_SCOPE_REQUIRED", "institution scope must be revalidated after lock acquisition");
assert.equal(managementScopeCalls, 2);
invalidateManagementAfterFirst = false;

invalidateAfterFirstScope = true;
const roleChanged = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(roleChanged.code, "VERIFIED_IDENTITY_REQUIRED", "identity must be revalidated after lock acquisition");
invalidateAfterFirstScope = false;

lockAvailable = false;
const locked = run({ _verifiedRole: "Director", _verifiedUserId: "DIR-1" });
assert.equal(locked.code, "LOCK_TIMEOUT");
lockAvailable = true;
assert.equal(releaseCount, lockCalls - 1, "every acquired lock is released exactly once; the final timed-out acquisition is not released");

assert.match(dashboard, /btn-transport-efficiency-analytics/);
assert.match(dashboard, /modal-transport-efficiency-analytics/);
assert.match(dashboard, /js\/transport-analytics\.js/);
assert.match(client, /getTransportEfficiencyMetrics/);
assert.doesNotMatch(client, /\.innerHTML\s*=/, "untrusted metric values must not be interpolated as HTML");
const permissionStart = source.indexOf("const ROLE_PERMISSIONS = {");
const permissionEnd = source.indexOf("\n};", permissionStart);
const permissionSource = source.slice(permissionStart, permissionEnd);
const directorStart = permissionSource.indexOf('"Director": [');
const subdirectorStart = permissionSource.indexOf('"Subdirector": [');
const nextRoleStart = permissionSource.indexOf('\n  "', subdirectorStart + 1);
assert.ok(permissionSource.slice(directorStart, subdirectorStart).includes('"getTransportEfficiencyMetrics"'));
assert.ok(permissionSource.slice(subdirectorStart, nextRoleStart).includes('"getTransportEfficiencyMetrics"'));
assert.match(source, /if \(request\.action === "getTransportEfficiencyMetrics"\) return respond\(getTransportEfficiencyMetrics\(actionPayload\)\);/);
assert.match(workflow, /accounting-transport-efficiency-metrics\.test\.js/);
assert.match(workflow, /node --check js\/transport-analytics\.js/);
console.log("PASS: transport metrics authorization, aggregation, date filtering, over-capacity, no-data handling, read-only behavior, lock release and dashboard wiring");
