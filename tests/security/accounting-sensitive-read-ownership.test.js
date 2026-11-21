"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
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

function makeSheets(rows) {
  return {
    getSheetByName(name) {
      if (!Object.prototype.hasOwnProperty.call(rows, name)) return null;
      return { getDataRange: () => ({ getValues: () => rows[name].map(row => row.slice()) }) };
    }
  };
}
function runAsset(payload, config) {
  const cfg = Object.assign({
    actor: { authorized: true, userId: "HR-1", role: "RecursosHumanos", institutionId: "INST-1" },
    permission: true,
    scope: { valid: true, authorized: true, institutionWide: false, departmentIds: ["D1"] },
    assetAccess: { "A-1": ["D1"] }
  }, config || {});
  const rows = cfg.rows || { ActivosPatrimoniales: [
    ["ActivoID", "CodigoPatrimonial", "Nombre", "DepartamentoID", "CustodioUserId", "Estado"],
    ["A-1", "PAT-1", "Laptop D1", "D1", "", "Activo"],
    ["A-2", "PAT-2", "Laptop D2", "D2", "", "Activo"],
    ["A-3", "PAT-3", "Sin asignación", "", "", "Activo"],
    ["A-4", "PAT-4", "Duplicado uno", "D1", "", "Activo"],
    ["A-4", "PAT-4B", "Duplicado dos", "D1", "", "Activo"]
  ] };
  const ss = makeSheets(rows), events = { permissions: [], assetChecks: [] };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss },
    getVerifiedAccountingIdentity_: () => cfg.actor,
    validateRolePermission: (actor, action) => { events.permissions.push(action); return cfg.permission ? { authorized: true, actor } : { authorized: false, code: "ROLE_PERMISSION_DENIED" }; },
    getVerifiedAccountingDepartmentScope_: () => cfg.scope,
    maintenancePlanAssertAssetScope_: (db, input, actor, assetId, departmentId) => {
      events.assetChecks.push({ assetId, departmentId });
      if (!(cfg.assetAccess[assetId] || []).includes(departmentId)) throw new Error("RESOURCE_NOT_FOUND");
      return true;
    }
  };
  vm.createContext(context);
  vm.runInContext(extractFunction("getAssetItems") + "\nthis.run = getAssetItems;", context);
  return { result: context.run(payload || {}), events };
}

function runPayroll(payload, config) {
  const cfg = Object.assign({
    actor: { authorized: true, userId: "HR-1", role: "RecursosHumanos", institutionId: "INST-1" },
    permission: true,
    scope: { valid: true, authorized: true, institutionWide: false, departmentIds: ["D1"] },
    ownershipDenied: false
  }, config || {});
  const rows = cfg.rows || {
    ExpedientesLaborales: [
      ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"],
      ["E-1", "P-1", "U-1", "Docente", "D1", "CC-1", "2020-01-01", "", "ACTIVO", ""],
      ["E-2", "P-2", "U-2", "Docente", "D2", "CC-2", "2020-01-01", "", "ACTIVO", ""]
    ],
    PlanillasNomenclatura: [
      ["PlanillaID", "Fecha", "PeriodoMes", "EmpleadoID", "EmpleadoNombre", "Puesto", "SalarioBase", "HorasExtras", "MontoHorasExtras", "Bonificaciones", "DeduccionIHSS", "DeduccionRAP", "DeduccionISR", "OtrasDeducciones", "SalarioNeto", "EstadoCiclo", "PatronalIHSS", "PatronalRAP", "PatronalINFOP", "CostoLaboralTotal"],
      ["PAY-1", "2026-11-20", "2026-11", "E-1", "Ana", "Docente", 1000, 0, 0, 0, 50, 10, 0, 0, 940, "PROCESADA", 72, 15, 10, 1097],
      ["PAY-2", "2026-11-20", "2026-11", "E-2", "Beto", "Docente", 2000, 0, 0, 0, 100, 20, 0, 0, 1880, "PROCESADA", 144, 30, 20, 2194],
      ["PAY-3", "2026-10-20", "2026-10", "E-1", "Ana", "Docente", 900, 0, 0, 0, 45, 9, 0, 0, 846, "PROCESADA", 64.8, 13.5, 9, 987.3],
      ["PAY-4", "2026-10-20", "2026-10", "E-2", "Beto", "Docente", 1900, 0, 0, 0, 95, 19, 0, 0, 1786, "PROCESADA", 136.8, 28.5, 19, 2084.3]
    ]
  };
  const ss = makeSheets(rows), events = { permissions: [], ownership: [], planillaIds: [] };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss },
    getVerifiedAccountingIdentity_: () => cfg.actor,
    validateRolePermission: (actor, action) => { events.permissions.push(action); return cfg.permission ? { authorized: true, actor } : { authorized: false, code: "ROLE_PERMISSION_DENIED" }; },
    getVerifiedAccountingDepartmentScope_: () => cfg.scope,
    assertPayrollEmployeeResourceScope_: (db, scope, employeeRows, operation) => {
      events.ownership.push({ employeeIds: employeeRows.map(row => String(row[0])), operation });
      if (cfg.ownershipDenied) throw new Error("RESOURCE_SCOPE_DENIED");
      return true;
    },
    normalizePayrollBatchValue_: value => String(value || "").trim().toUpperCase(),
    getPayrollEmployerConceptTotalsByEmployee_: (db, planillaIds) => { events.planillaIds.push(planillaIds.slice()); return {}; },
    buildPayrollVarianceReport_: () => ({ alerta: false, variacion: 0 }),
    getPayrollVarianceCauses_: () => []
  };
  vm.createContext(context);
  vm.runInContext(extractFunction("getPayrollPeriodSummary") + "\nthis.run = getPayrollPeriodSummary;", context);
  return { result: context.run(payload || {}), events };
}

function runStatement(payload, config) {
  const cfg = Object.assign({
    actor: { authorized: true, userId: "STU-1", role: "Estudiante", institutionId: "INST-1" },
    permission: true
  }, config || {});
  const rows = cfg.rows || {
    CargosEstudiante: [
      ["CargoID", "Fecha", "UserId", "Concepto", "Referencia", "Observaciones", "Monto", "Estado"],
      ["C-1", "2026-11-01", "STU-1", "Mensualidad", "", "", 100, "Pendiente"],
      ["C-2", "2026-11-01", "STU-2", "Mensualidad", "", "", 500, "Pendiente"]
    ],
    PagosAbonos: [
      ["PagoID", "Fecha", "UserId", "Concepto", "Referencia", "Monto", "Metodo", "Observaciones", "Estado"],
      ["P-1", "2026-11-02", "STU-1", "Pago", "", 20, "Efectivo", "", "Aplicado"],
      ["P-2", "2026-11-02", "STU-2", "Pago", "", 300, "Efectivo", "", "Aplicado"]
    ]
  };
  const ss = makeSheets(rows), events = { permissions: [] };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss },
    familyCreditApprovalActor_: () => {
      if (!cfg.actor || cfg.actor.authorized !== true) throw new Error("VERIFIED_IDENTITY_REQUIRED");
      return cfg.actor;
    },
    validateRolePermission: (actor, action) => { events.permissions.push(action); return cfg.permission ? { authorized: true, actor } : { authorized: false, code: "ROLE_PERMISSION_DENIED" }; },
    familyCreditGetStatementMovements_: () => []
  };
  vm.createContext(context);
  vm.runInContext(extractFunction("getStudentAccountStatement") + "\nthis.run = getStudentAccountStatement;", context);
  return { result: context.run(payload || {}), events };
}

const noIdentityAsset = runAsset({}, { actor: { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" } });
assert.equal(noIdentityAsset.result.code, "VERIFIED_IDENTITY_REQUIRED");
assert.deepEqual(noIdentityAsset.events.permissions, []);

const deniedAsset = runAsset({}, { permission: false });
assert.equal(deniedAsset.result.code, "ROLE_PERMISSION_DENIED");
assert.deepEqual(deniedAsset.events.assetChecks, []);

const unscopedAsset = runAsset({}, { scope: { valid: false, authorized: false, code: "DEPARTMENT_SCOPE_NOT_ASSIGNED" } });
assert.equal(unscopedAsset.result.code, "DEPARTMENT_SCOPE_NOT_ASSIGNED");

const scopedAssets = runAsset({});
assert.deepEqual(Array.from(scopedAssets.result.activos, row => row.ActivoID), ["A-1"],
  "department users must see only uniquely identified assets assigned to their department");
assert.ok(scopedAssets.events.assetChecks.every(call => call.departmentId === "D1"));

const institutionAssets = runAsset({}, { scope: { valid: true, authorized: true, institutionWide: true, departmentIds: [] } });
assert.deepEqual(Array.from(institutionAssets.result.activos, row => row.ActivoID), ["A-1", "A-2", "A-3"],
  "institution-wide scope may read all unique assets but not duplicate identifiers");

const noIdentityPayroll = runPayroll({ periodoMes: "2026-11" }, { actor: { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" } });
assert.equal(noIdentityPayroll.result.code, "VERIFIED_IDENTITY_REQUIRED");
const deniedPayroll = runPayroll({ periodoMes: "2026-11" }, { permission: false });
assert.equal(deniedPayroll.result.code, "ROLE_PERMISSION_DENIED");
const noScopePayroll = runPayroll({ periodoMes: "2026-11" }, { scope: { valid: false, authorized: false, code: "DEPARTMENT_SCOPE_NOT_ASSIGNED" } });
assert.equal(noScopePayroll.result.code, "DEPARTMENT_SCOPE_NOT_ASSIGNED");

const scopedPayroll = runPayroll({ periodoMes: "2026-11", compararConPeriodo: "2026-10" });
assert.equal(scopedPayroll.result.status, "success");
assert.deepEqual(Array.from(scopedPayroll.result.empleados, row => row.empleadoId), ["E-1"]);
assert.equal(scopedPayroll.result.resumen.totalBruto, 1000);
assert.deepEqual(scopedPayroll.events.ownership[0], { employeeIds: ["E-1"], operation: "READ" });
assert.deepEqual(JSON.parse(JSON.stringify(scopedPayroll.events.planillaIds)), [["PAY-1"], ["PAY-3"]],
  "comparison reads must not include another department's payroll batch");
const crossDepartmentPayroll = runPayroll({ periodoMes: "2026-11", employeeId: "E-2" });
assert.equal(crossDepartmentPayroll.result.code, "RESOURCE_NOT_FOUND");
const deniedOwnershipPayroll = runPayroll({ periodoMes: "2026-11" }, { ownershipDenied: true });
assert.equal(deniedOwnershipPayroll.result.code, "RESOURCE_SCOPE_DENIED");

const selfStatement = runStatement({ userId: "STU-2" });
assert.equal(selfStatement.result.status, "success");
assert.equal(selfStatement.result.data.userId, "STU-1",
  "student statement target must come from verified identity, not client-supplied userId");
assert.equal(selfStatement.result.data.totalCargos, 100);
assert.equal(selfStatement.result.data.totalPagado, 20);
const parentStatement = runStatement({ userId: "STU-2" }, { actor: { authorized: true, userId: "PARENT-1", role: "Padre" } });
assert.equal(parentStatement.result.code, "ROLE_NOT_ALLOWED");
const deniedStatement = runStatement({}, { permission: false });
assert.equal(deniedStatement.result.code, "ROLE_PERMISSION_DENIED");
const missingIdentityStatement = runStatement({}, { actor: { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" } });
assert.equal(missingIdentityStatement.result.code, "VERIFIED_IDENTITY_REQUIRED");

console.log("accounting-sensitive-read-ownership: all assertions passed");
