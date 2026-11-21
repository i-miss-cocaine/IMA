"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
new vm.Script(source);
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
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
function makeSheet(rows) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) { this.rows.push(row.slice()); },
    deleteRow(index) { this.rows.splice(index - 1, 1); },
    getRange(row, col) {
      const self = this;
      return {
        setValues(values) { values.forEach((value, offset) => { while (self.rows.length < row + offset) self.rows.push(new Array(self.rows[0].length).fill("")); self.rows[row + offset - 1] = value.slice(); }); },
        setValue(value) { while (self.rows.length < row) self.rows.push(new Array(self.rows[0].length).fill("")); self.rows[row - 1][col - 1] = value; }
      };
    }
  };
}
const assignmentHeaders = ["AsignacionTranspID","RutaID","EstudianteUserId","ParadaNombre","HorarioPlan","Estado","FechaAsignacion","Jornada","DiasSemanaJSON","Observaciones","FechaInicioServicio","FechaFinServicio","ModalidadServicio","FechaCancelacion","TarifaMensualAplicada","ConceptoTransporteID"];
const routeHeaders = ["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado","Notas","HoraInicio","HoraFin","Jornada"];
const vehicleHeaders = ["VehiculoID","CodigoUnidad","Marca","Modelo","Placa","Capacidad","Estado"];
const chargeHeaders = ["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento","Observaciones","ClaveUnicaDedupe"];
function harness(options) {
  const settings = Object.assign({ accessAllowed: true, ownershipAllowed: true, routeState: "Activo", duplicateRoute: false, duplicateVehicle: false, billingFails: false, lockAvailable: true, duplicateAssignment: false, assignmentState: "active" }, options || {});
  const calls = { access: [], ownership: [], billing: [], events: [] };
  const assignmentRows = [assignmentHeaders];
  if (settings.duplicateAssignment) assignmentRows.push(["TRN-OLD","ROUTE-1","STUDENT-1","Stop","06:30","active","2026-01-01","matutina","[]","","2026-01-01","","COMPLETA","","",""]);
  else if (settings.assignmentState !== "none") assignmentRows.push(["TRN-OLD","ROUTE-1","STUDENT-1","Stop","06:30",settings.assignmentState,"2026-01-01","matutina","[]","","2026-01-01","","COMPLETA","","",""]);
  const routeRow = ["ROUTE-1","Ruta 1","BUS-1","DRIVER-1",10,"Stops",settings.routeState,"","06:30","07:30","matutina"];
  const routeRows = [routeHeaders, routeRow];
  if (settings.duplicateRoute) routeRows.push(routeRow.slice());
  const vehicleRow = ["VEH-1","BUS-1","Marca","Modelo","ABC-123",10,"Activo"];
  const vehicleRows = [vehicleHeaders, vehicleRow];
  if (settings.duplicateVehicle) vehicleRows.push(vehicleRow.slice());
  const sheets = {
    TransporteAsignaciones: makeSheet(assignmentRows),
    TransporteRutas: makeSheet(routeRows),
    TransporteVehiculos: makeSheet(vehicleRows),
    CargosEstudiante: makeSheet([chargeHeaders, ["CH-1", new Date("2026-11-01"), "STUDENT-1", "Transporte", 100, 0, 100, "Pendiente", "2026-11-30", "", "TRN-2026-11-STUDENT-1"]])
  };
  const ss = { getSheetByName: name => sheets[name] || null };
  const lock = { held: false, tryLock() { if (!settings.lockAvailable || this.held) return false; this.held = true; return true; }, waitLock() { if (!settings.lockAvailable || this.held) throw new Error("LOCK_TIMEOUT"); this.held = true; }, releaseLock() { this.held = false; } };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss },
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => "12345678-ABCD" },
    assertMonthlyChargeAccess_: (payload, action) => {
      calls.access.push({ action, token: payload.sessionToken });
      if (!settings.accessAllowed) throw new Error("ROLE_PERMISSION_DENIED");
      return { actor: { userId: "ACCOUNTANT-1", role: "Contador" }, ss, scope: { valid: true, authorized: true, institutionId: "INST-1", institutionWide: true, departmentIds: [] } };
    },
    assertMonthlyChargeStudentOwnership_: (spreadsheet, scope, ids, operation) => {
      calls.ownership.push({ ids: ids.slice(), operation });
      if (!settings.ownershipAllowed) throw new Error("RESOURCE_SCOPE_DENIED");
      return true;
    },
    getOrCreateTransportVehiclesCatalog: () => sheets.TransporteVehiculos,
    getOrCreateSheet: (spreadsheet, name) => sheets[name],
    transportEnsureBillingSchema_: () => ({ assignments: sheets.TransporteAsignaciones, charges: sheets.CargosEstudiante }),
    transportParseDate_: value => value ? new Date(value) : null,
    transportNormalizeMode_: value => String(value || "COMPLETA").toUpperCase(),
    transportRecalculateStudentMonthlyChargeLocked_: (spreadsheet, studentId, year, month) => {
      calls.billing.push({ studentId, year, month });
      if (settings.billingFails) { sheets.CargosEstudiante.appendRow(["CH-ROLLBACK", new Date(), studentId, "Transporte", 20, 0, 20, "Pendiente", "", "", "ROLLBACK"]); throw new Error("BILLING_FAILURE"); }
      return { status: "success", missingTariff: 0 };
    },
    logStructuredEvent: (...args) => calls.events.push(args),
    Date, String, Number, Object, Array, JSON, Math
  };
  vm.createContext(runtime);
  vm.runInContext([extractFunction("assignStudentTransport"), extractFunction("cancelStudentTransportAssignment"), "this.assign = assignStudentTransport; this.cancel = cancelStudentTransportAssignment;"].join("\n"), runtime);
  return { assign: runtime.assign, cancel: runtime.cancel, calls, sheets, lock };
}
function payload(extra) { return Object.assign({ sessionToken: "verified-session", rutaId: "ROUTE-1", estudianteUserId: "STUDENT-1" }, extra || {}); }

const unauthenticated = harness({ accessAllowed: false });
assert.throws(() => unauthenticated.assign(payload()), /ROLE_PERMISSION_DENIED/);
assert.equal(unauthenticated.sheets.TransporteAsignaciones.rows.length, 2);
assert.equal(unauthenticated.calls.ownership.length, 0);
const deniedOwner = harness({ ownershipAllowed: false });
assert.throws(() => deniedOwner.assign(payload()), /RESOURCE_SCOPE_DENIED/);
assert.equal(deniedOwner.sheets.TransporteAsignaciones.rows.length, 2);
assert.equal(deniedOwner.calls.billing.length, 0);
const inactiveRoute = harness({ routeState: "Inactiva" });
assert.equal(inactiveRoute.assign(payload()).code, "ROUTE_NOT_ACTIVE");
assert.equal(inactiveRoute.calls.billing.length, 0);
const ambiguousRoute = harness({ duplicateRoute: true });
assert.equal(ambiguousRoute.assign(payload()).code, "ROUTE_AMBIGUOUS");
const duplicate = harness({ duplicateAssignment: true });
assert.equal(duplicate.assign(payload()).code, "DUPLICATE_TRANSPORT_ASSIGNMENT");
assert.equal(duplicate.sheets.TransporteAsignaciones.rows.length, 2);
const duplicateVehicle = harness({ duplicateVehicle: true });
assert.equal(duplicateVehicle.assign(payload()).code, "TRANSPORT_VEHICLE_AMBIGUOUS");
const successful = harness({ assignmentState: "none" });
const assigned = successful.assign(payload());
assert.equal(assigned.status, "success");
assert.equal(successful.calls.access[0].action, "assignStudentTransport");
assert.deepEqual(successful.calls.ownership[0], { ids: ["STUDENT-1"], operation: "WRITE" });
assert.equal(successful.sheets.TransporteAsignaciones.rows.length, 2);
assert.equal(successful.calls.events[0][6], "ACCOUNTANT-1");
const billingRollback = harness({ assignmentState: "none", billingFails: true });
assert.throws(() => billingRollback.assign(payload()), /BILLING_FAILURE/);
assert.equal(billingRollback.sheets.TransporteAsignaciones.rows.length, 1, "assignment row must roll back");
assert.equal(billingRollback.sheets.CargosEstudiante.rows.length, 2, "charge snapshot must roll back");
const lockTimeout = harness({ assignmentState: "none", lockAvailable: false });
assert.equal(lockTimeout.assign(payload()).code, "LOCK_TIMEOUT");
assert.equal(lockTimeout.calls.access.length, 0);
const cancelDenied = harness({ accessAllowed: false });
assert.throws(() => cancelDenied.cancel({ sessionToken: "verified-session", assignmentId: "TRN-OLD" }), /ROLE_PERMISSION_DENIED/);
assert.equal(cancelDenied.calls.ownership.length, 0);
const cancelOwnerDenied = harness({ ownershipAllowed: false });
assert.throws(() => cancelOwnerDenied.cancel({ sessionToken: "verified-session", assignmentId: "TRN-OLD" }), /RESOURCE_SCOPE_DENIED/);
assert.equal(cancelOwnerDenied.sheets.TransporteAsignaciones.rows[1][5], "active");
const cancelSuccess = harness();
const cancelled = cancelSuccess.cancel({ sessionToken: "verified-session", assignmentId: "TRN-OLD", fechaCancelacion: "2026-11-21" });
assert.equal(cancelled.status, "success");
assert.equal(cancelSuccess.calls.access[0].action, "cancelStudentTransportAssignment");
assert.deepEqual(cancelSuccess.calls.ownership[0], { ids: ["STUDENT-1"], operation: "WRITE" });
assert.equal(cancelSuccess.sheets.TransporteAsignaciones.rows[1][5], "cancelled");
const cancelIdempotent = harness({ assignmentState: "cancelled" });
assert.equal(cancelIdempotent.cancel({ sessionToken: "verified-session", assignmentId: "TRN-OLD" }).idempotent, true);
assert.equal(cancelIdempotent.calls.ownership.length, 1);
const cancelRollback = harness({ billingFails: true });
assert.throws(() => cancelRollback.cancel({ sessionToken: "verified-session", assignmentId: "TRN-OLD" }), /BILLING_FAILURE/);
assert.equal(cancelRollback.sheets.TransporteAsignaciones.rows[1][5], "active", "assignment state must roll back");
assert.equal(cancelRollback.sheets.CargosEstudiante.rows.length, 2, "charge snapshot must roll back");
console.log("accounting-student-transport-assignment-ownership: all assertions passed");
