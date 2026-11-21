"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
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
  throw new Error("unclosed " + name);
}
function makeHarness(options) {
  const settings = Object.assign({
    permissionAllowed: true, identityAllowed: true, scopeAllowed: true,
    institutionWide: true, ownershipAllowed: true, resourceAllowed: true,
    duplicateExpediente: false, lockAvailable: true
  }, options || {});
  const calls = { permissions: [], identity: 0, scope: 0, access: [], ownership: [], lockAttempts: 0, releases: 0, revisions: 0, audit: [], writes: [] };
  const expRows = [
    ["ExpedienteID", "PersonaID", "Codigo", "Nac", "Nac", "Dir", "Foto", "Estado", "Creado", "Actualizado", "Obs"],
    ["EXP-1", "PERSON-1", "COD-1", "", "", "", "", "Retirado", "", "", ""]
  ];
  if (settings.duplicateExpediente) expRows.push(expRows[1].slice());
  const matRows = [
    ["MatriculaID", "Fecha", "UserId", "Nombre", "Grado", "Seccion", "Ano", "Tipo", "Estado"],
    ["MAT-1", "2026-01-01", "STU-1", "Ana", "Séptimo", "A", "2026", "Regular", "Activa"]
  ];
  const expSheet = {
    getDataRange: () => ({ getValues: () => expRows.map(row => row.slice()) }),
    getRange: (row, col) => ({ setValue: value => { expRows[row - 1][col - 1] = value; calls.writes.push({ sheet: "ExpedientesEstudiantes", row, col, value }); } })
  };
  const matSheet = {
    getDataRange: () => ({ getValues: () => matRows.map(row => row.slice()) }),
    getRange: (row, col) => ({ setValue: value => { matRows[row - 1][col - 1] = value; calls.writes.push({ sheet: "Matriculas", row, col, value }); } })
  };
  const lock = {
    tryLock: () => { calls.lockAttempts++; return settings.lockAvailable; },
    waitLock: () => { calls.lockAttempts++; if (!settings.lockAvailable) throw new Error("LOCK_TIMEOUT"); },
    releaseLock: () => { calls.releases++; }
  };
  const usersSheet = { getLastRow: () => 2, getDataRange: () => ({ getValues: () => [["UserId","PersonaID","Rol","EstadoCuenta"],["STU-1","PERSON-1","Estudiante","Activa"]] }) };
  const ss = { getSheetByName: name => name === "ExpedientesEstudiantes" ? expSheet : name === "Matriculas" ? matSheet : name === "Usuarios" ? usersSheet : null };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss },
    LockService: { getScriptLock: () => lock },
    validateRolePermission: action => { calls.permissions.push(action); return { authorized: settings.permissionAllowed }; },
    getVerifiedAcademicIdentity_: () => { calls.identity++; return settings.identityAllowed ? { authorized: true, userId: "DIR-1", role: "Director" } : { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" }; },
    assertStudentExpedienteScopeAccess_: (payload, spreadsheet, sheet, row, domain, operation) => {
      calls.access.push({ expedienteId: row[0], domain, operation });
      return { authorized: settings.resourceAllowed, code: "RESOURCE_SCOPE_DENIED" };
    },
    getVerifiedAcademicDepartmentScope_: () => { calls.scope++; return settings.scopeAllowed ? { authorized: true, institutionWide: settings.institutionWide } : { authorized: false, code: "DEPARTMENT_SCOPE_DENIED" }; },
    assertResourceOwnershipForScope_: (spreadsheet, scope, type, id, operation) => {
      calls.ownership.push({ type, id, operation });
      return { authorized: settings.ownershipAllowed, code: "RESOURCE_SCOPE_DENIED" };
    },
    getStudentPersonIdForUser_: (spreadsheet, userId) => userId === "STU-1" ? "PERSON-1" : "",
    getStudentIdentityForPerson_: (spreadsheet, personId) => personId === "PERSON-1" ? { userId: "STU-1", role: "Estudiante" } : null,
    recordEntityChangeLog: (...args) => calls.audit.push(args),
    logStructuredEvent: () => {},
    advanceSaceAcademicSourceRevisionLocked_: () => { calls.revisions++; },
    ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS: { Retirado: ["Activo"], Activo: ["Retirado", "Graduado", "Trasladado"] },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(extractFunction("assertAcademicStudentMutationAccess_") + "\n" +
    extractFunction("updateStudentLifecycleStatus") + "\n" +
    extractFunction("reconcileStudentLifecycleState") +
    "\nthis.resolve=assertAcademicStudentMutationAccess_;this.update=updateStudentLifecycleStatus;this.reconcile=reconcileStudentLifecycleState;", runtime);
  return { runtime, calls, expRows, matRows };
}

const scopedTarget = makeHarness();
const resolvedTarget = scopedTarget.runtime.resolve("changeStudentSection", { sessionToken: "verified", expedienteId: "EXP-1", userId: "STU-1" },
  { getSheetByName: name => name === "ExpedientesEstudiantes" ? { getDataRange: () => ({ getValues: () => scopedTarget.expRows.map(row => row.slice()) }) } :
    name === "Usuarios" ? { getLastRow: () => 2, getDataRange: () => ({ getValues: () => [["UserId","PersonaID","Rol","EstadoCuenta"],["STU-1","PERSON-1","Estudiante","Activa"]] }) } : null },
  "EXP-1", "STU-1");
assert.equal(resolvedTarget.expedienteId, "EXP-1");
assert.equal(resolvedTarget.userId, "STU-1");
assert.equal(scopedTarget.calls.access.length, 1);
for (const action of ["changeStudentSection","recordStudentTransfer","recordStudentWithdrawal","processStudentReentry","processStudentPromotion","processStudentGraduation"]) {
  const start = source.indexOf("function " + action + "(");
  const end = source.indexOf("\nfunction ", start + 10);
  assert.ok(start >= 0 && source.slice(start, end > 0 ? end : source.length).includes("assertAcademicStudentMutationAccess_"),
    action + " must enforce verified student ownership");
}

const noPermission = makeHarness({ permissionAllowed: false });
assert.throws(() => noPermission.runtime.update({ expedienteId: "EXP-1", nuevoEstado: "Activo", motivo: "Reingreso autorizado" }), /AUTH_PERMISSION_DENIED/);
assert.equal(noPermission.calls.lockAttempts, 0);

const deniedResource = makeHarness({ resourceAllowed: false });
assert.throws(() => deniedResource.runtime.update({ expedienteId: "EXP-1", nuevoEstado: "Activo", motivo: "Reingreso autorizado" }), /RESOURCE_SCOPE_DENIED/);
assert.equal(deniedResource.calls.writes.length, 0);
assert.equal(deniedResource.calls.releases, 1);

const duplicate = makeHarness({ duplicateExpediente: true });
assert.throws(() => duplicate.runtime.update({ expedienteId: "EXP-1", nuevoEstado: "Activo", motivo: "Reingreso autorizado" }), /RESOURCE_AMBIGUOUS/);
assert.equal(duplicate.calls.writes.length, 0);

const updated = makeHarness();
assert.equal(updated.runtime.update({ expedienteId: "EXP-1", nuevoEstado: "Activo", motivo: "Reingreso autorizado" }).status, "success");
assert.equal(updated.expRows[1][7], "Activo");
assert.deepEqual(JSON.parse(JSON.stringify(updated.calls.access[0])), { expedienteId: "EXP-1", domain: "permisoAcademico", operation: "UPDATE" });
assert.equal(updated.calls.audit[0][5], "DIR-1");
assert.equal(updated.calls.releases, 1);

const reconcilePermissionDenied = makeHarness({ permissionAllowed: false });
assert.throws(() => reconcilePermissionDenied.runtime.reconcile({ autoFix: true }), /AUTH_PERMISSION_DENIED/);
assert.equal(reconcilePermissionDenied.calls.lockAttempts, 0);

const departmentOnly = makeHarness({ institutionWide: false });
assert.throws(() => departmentOnly.runtime.reconcile({ autoFix: true }), /INSTITUTION_WIDE_SCOPE_REQUIRED/);
assert.equal(departmentOnly.calls.writes.length, 0);

const ownershipDenied = makeHarness({ ownershipAllowed: false });
assert.throws(() => ownershipDenied.runtime.reconcile({ autoFix: true }), /RESOURCE_SCOPE_DENIED/);
assert.equal(ownershipDenied.calls.writes.length, 0);

const readOnly = makeHarness();
const readResult = readOnly.runtime.reconcile({ autoFix: false });
assert.equal(readResult.inconsistenciasDetectadas, 1);
assert.equal(readOnly.matRows[1][8], "Activa");
assert.equal(readOnly.calls.ownership[0].operation, "READ");
assert.equal(readOnly.calls.revisions, 0);

const repaired = makeHarness();
const repairResult = repaired.runtime.reconcile({ autoFix: true });
assert.equal(repairResult.inconsistenciasCorregidas, 1);
assert.equal(repaired.matRows[1][8], "Retirada");
assert.equal(repaired.calls.ownership[0].operation, "WRITE");
assert.equal(repaired.calls.revisions, 1);
assert.equal(repaired.calls.audit[0][5], "DIR-1");

console.log("academic-student-lifecycle-mutations-ownership: all assertions passed");
