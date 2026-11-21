"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
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
    permissionAllowed: true,
    identityAllowed: true,
    scopeAllowed: true,
    lockAvailable: true,
    duplicateExpediente: false
  }, options || {});
  const calls = { permission: 0, identity: 0, scope: [], lockAttempts: 0, releases: 0, writes: [], audit: [] };
  const rows = [
    ["ExpedienteID", "PersonaID", "CodigoInstitucional", "FechaNacimiento", "Nacionalidad", "DireccionResidencia", "FotografiaUrl", "EstadoExpediente", "FechaCreacion", "FechaActualizacion", "Observaciones"],
    ["EXP-1", "PERSON-1", "COD-1", "2000-01-01", "HN", "Address 1", "", "Activo", "2026-01-01", "", ""]
  ];
  if (settings.duplicateExpediente) rows.push(rows[1].slice());
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    getRange: (row, col) => ({ setValue: value => { rows[row - 1][col - 1] = value; calls.writes.push({ row, col, value }); } })
  };
  const lock = {
    tryLock: () => { calls.lockAttempts++; return settings.lockAvailable; },
    releaseLock: () => { calls.releases++; }
  };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => name === "ExpedientesEstudiantes" ? sheet : null }) },
    LockService: { getScriptLock: () => lock },
    validateRolePermission: (action, payload) => {
      calls.permission++;
      assert.equal(action, "updateStudentFile");
      return { authorized: settings.permissionAllowed };
    },
    getVerifiedAcademicIdentity_: () => {
      calls.identity++;
      return settings.identityAllowed ? { authorized: true, userId: "STAFF-1", role: "Secretaría" } : { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
    },
    assertStudentExpedienteScopeAccess_: (payload, ss, expSheet, expRow, guardianPermission, operation) => {
      calls.scope.push({ expedienteId: expRow[0], guardianPermission, operation });
      return { authorized: settings.scopeAllowed, code: "RESOURCE_SCOPE_DENIED" };
    },
    recordEntityChangeLog: (...args) => { calls.audit.push(args); },
    ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS: {
      Activo: ["Inactivo", "Retirado", "Trasladado", "Graduado", "Suspendido"],
      Inactivo: ["Activo", "Retirado", "Trasladado"],
      Retirado: ["Activo"],
      Trasladado: ["Activo"],
      Suspendido: ["Activo", "Retirado"],
      Graduado: []
    },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(extractFunction("updateStudentFile") + "\nthis.run = updateStudentFile;", runtime);
  return { run: runtime.run, calls, rows };
}

const deniedRole = makeHarness({ permissionAllowed: false });
assert.throws(() => deniedRole.run({ expedienteId: "EXP-1" }), /AUTH_PERMISSION_DENIED/);
assert.equal(deniedRole.calls.lockAttempts, 0);
assert.equal(deniedRole.calls.writes.length, 0);

const invalidIdentity = makeHarness({ identityAllowed: false });
assert.throws(() => invalidIdentity.run({ expedienteId: "EXP-1" }), /VERIFIED_IDENTITY_REQUIRED/);
assert.equal(invalidIdentity.calls.lockAttempts, 0);

const deniedScope = makeHarness({ scopeAllowed: false });
assert.throws(() => deniedScope.run({ expedienteId: "EXP-1", nacionalidad: "HN-2" }), /RESOURCE_SCOPE_DENIED/);
assert.equal(deniedScope.calls.writes.length, 0);
assert.equal(deniedScope.calls.releases, 1);

const missing = makeHarness();
assert.throws(() => missing.run({ expedienteId: "EXP-404", nacionalidad: "HN-2" }), /RESOURCE_NOT_FOUND/);
assert.equal(missing.calls.writes.length, 0);
assert.equal(missing.calls.releases, 1);

const ambiguous = makeHarness({ duplicateExpediente: true });
assert.throws(() => ambiguous.run({ expedienteId: "EXP-1", nacionalidad: "HN-2" }), /RESOURCE_AMBIGUOUS/);
assert.equal(ambiguous.calls.writes.length, 0);

const updated = makeHarness();
assert.equal(updated.run({ expedienteId: "EXP-1", fechaNacimiento: "2001-02-03", nacionalidad: "HN-2" }).status, "success");
assert.equal(updated.rows[1][3], "2001-02-03");
assert.equal(updated.rows[1][4], "HN-2");
assert.deepEqual(updated.calls.scope[0], { expedienteId: "EXP-1", guardianPermission: "permisoDocumental", operation: "UPDATE" });
assert.equal(updated.calls.releases, 1);

const invalidTransition = makeHarness();
assert.throws(() => invalidTransition.run({ expedienteId: "EXP-1", estadoExpediente: "Fusionado", motivo: "duplicate" }), /STUDENT_LIFECYCLE_TRANSITION_DENIED/);
assert.equal(invalidTransition.calls.writes.length, 0);

const missingReason = makeHarness();
assert.throws(() => missingReason.run({ expedienteId: "EXP-1", estadoExpediente: "Retirado" }), /STUDENT_LIFECYCLE_REASON_REQUIRED/);
assert.equal(missingReason.calls.writes.length, 0);

const validTransition = makeHarness();
assert.equal(validTransition.run({ expedienteId: "EXP-1", estadoExpediente: "Retirado", motivo: "Retiro autorizado" }).status, "success");
assert.equal(validTransition.rows[1][7], "Retirado");
assert.equal(validTransition.calls.audit.length, 1);
assert.equal(validTransition.calls.audit[0][5], "STAFF-1");

const lockBusy = makeHarness({ lockAvailable: false });
assert.throws(() => lockBusy.run({ expedienteId: "EXP-1", nacionalidad: "HN-2" }), /STUDENT_FILE_UPDATE_LOCK_BUSY/);
assert.equal(lockBusy.calls.writes.length, 0);
assert.equal(lockBusy.calls.releases, 0);

console.log("academic-update-student-file-ownership: all assertions passed");
