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
    permissionAllowed: true, identityAllowed: true, scopeDeniedIds: [],
    lockAvailable: true, duplicateSource: false, sourceState: "Activo"
  }, options || {});
  const calls = { permission: [], identity: 0, scope: [], lockAttempts: 0, releases: 0, writes: [], logs: [] };
  const sheets = {
    ExpedientesEstudiantes: [
      ["ExpedienteID", "PersonaID", "Codigo", "Nacimiento", "Nacionalidad", "Direccion", "Foto", "Estado", "Creacion", "Actualizacion", "Observaciones"],
      ["EXP-1", "PERSON-1", "COD-1", "", "", "", "", "Activo", "", "", ""],
      ["EXP-2", "PERSON-2", "COD-2", "", "", "", "", settings.sourceState, "", "", ""]
    ],
    DocumentosEstudiante: [
      ["DocumentoID", "ExpedienteID", "Tipo"],
      ["DOC-1", "EXP-2", "Identidad"]
    ],
    MovimientosEstudiante: [
      ["MovimientoID", "ExpedienteID", "Tipo"],
      ["MOV-1", "EXP-2", "Traslado"]
    ],
    FusionesExpedientes: [["MergeID", "Target", "Source", "Motivo", "Actor", "Fecha"]],
    HistorialCambiosEntidad: [["EventoID", "Entidad", "ID", "Accion", "Cambio", "Actor", "Fecha", "Motivo"]]
  };
  if (settings.duplicateSource) sheets.ExpedientesEstudiantes.push(sheets.ExpedientesEstudiantes[2].slice());
  function makeSheet(name) {
    return {
      getDataRange: () => ({ getValues: () => sheets[name].map(row => row.slice()) }),
      getLastRow: () => sheets[name].length,
      appendRow: row => { sheets[name].push(row.slice()); calls.writes.push({ sheet: name, append: row.slice() }); },
      getRange: (row, col) => ({ setValue: value => { sheets[name][row - 1][col - 1] = value; calls.writes.push({ sheet: name, row, col, value }); } })
    };
  }
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] ? makeSheet(name) : null }) },
    getOrCreateSheet: (ss, name) => { if (!sheets[name]) sheets[name] = [["ID"]]; return makeSheet(name); },
    LockService: { getScriptLock: () => ({
      tryLock: () => { calls.lockAttempts++; return settings.lockAvailable; },
      releaseLock: () => { calls.releases++; }
    }) },
    validateRolePermission: action => {
      calls.permission.push(action);
      return { authorized: settings.permissionAllowed };
    },
    getVerifiedAcademicIdentity_: () => {
      calls.identity++;
      return settings.identityAllowed ? { authorized: true, userId: "STAFF-1", role: "Director" } : { authorized: false };
    },
    assertStudentExpedienteScopeAccess_: (payload, ss, sheet, row, permission, operation) => {
      calls.scope.push({ id: row[0], permission, operation });
      return { authorized: settings.scopeDeniedIds.indexOf(row[0]) === -1, code: "RESOURCE_SCOPE_DENIED" };
    },
    logStructuredEvent: (...args) => calls.logs.push(args),
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("mergeStudentFiles") + "\n" +
    extractFunction("unmergeStudentFiles") +
    "\nthis.merge = mergeStudentFiles; this.unmerge = unmergeStudentFiles;",
    runtime
  );
  return { merge: runtime.merge, unmerge: runtime.unmerge, calls, sheets };
}

const roleDenied = makeHarness({ permissionAllowed: false });
assert.throws(() => roleDenied.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-2" }), /AUTH_PERMISSION_DENIED/);
assert.equal(roleDenied.calls.lockAttempts, 0);

const sameTarget = makeHarness();
assert.throws(() => sameTarget.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-1" }), /EXPEDIENTE_MERGE_TARGET_MUST_DIFFER/);

const missing = makeHarness();
assert.throws(() => missing.merge({ targetExpedienteId: "EXP-404", sourceExpedienteId: "EXP-2" }), /RESOURCE_NOT_FOUND/);
assert.equal(missing.calls.writes.length, 0);

const ambiguous = makeHarness({ duplicateSource: true });
assert.throws(() => ambiguous.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-2" }), /RESOURCE_AMBIGUOUS/);
assert.equal(ambiguous.calls.writes.length, 0);

const sourceDenied = makeHarness({ scopeDeniedIds: ["EXP-2"] });
assert.throws(() => sourceDenied.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-2" }), /RESOURCE_SCOPE_DENIED/);
assert.equal(sourceDenied.calls.writes.length, 0);

const merged = makeHarness();
assert.equal(merged.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-2", motivo: "Duplicado confirmado" }).status, "success");
assert.equal(merged.sheets.DocumentosEstudiante[1][1], "EXP-1");
assert.equal(merged.sheets.MovimientosEstudiante[1][1], "EXP-1");
assert.equal(merged.sheets.ExpedientesEstudiantes[2][7], "Fusionado");
assert.equal(merged.sheets.FusionesExpedientes[1][4], "STAFF-1");
assert.deepEqual(merged.calls.scope.map(x => [x.id, x.operation]), [["EXP-1", "UPDATE"], ["EXP-2", "UPDATE"]]);
assert.equal(merged.calls.releases, 1);

const alreadyMerged = makeHarness({ sourceState: "Fusionado" });
assert.throws(() => alreadyMerged.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-2" }), /EXPEDIENTE_ALREADY_MERGED/);

const lockBusy = makeHarness({ lockAvailable: false });
assert.throws(() => lockBusy.merge({ targetExpedienteId: "EXP-1", sourceExpedienteId: "EXP-2" }), /EXPEDIENTE_MERGE_LOCK_BUSY/);
assert.equal(lockBusy.calls.releases, 0);

const unmergeRoleDenied = makeHarness({ permissionAllowed: false });
assert.throws(() => unmergeRoleDenied.unmerge({ sourceExpedienteId: "EXP-2", motivoJustificado: "Reversión autorizada" }), /AUTH_PERMISSION_DENIED/);

const unmergeNotMerged = makeHarness();
assert.throws(() => unmergeNotMerged.unmerge({ sourceExpedienteId: "EXP-2", motivoJustificado: "Reversión autorizada" }), /EXPEDIENTE_NOT_MERGED/);
assert.equal(unmergeNotMerged.calls.writes.length, 0);

const unmergeScopeDenied = makeHarness({ sourceState: "Fusionado", scopeDeniedIds: ["EXP-2"] });
assert.throws(() => unmergeScopeDenied.unmerge({ sourceExpedienteId: "EXP-2", motivoJustificado: "Reversión autorizada" }), /RESOURCE_SCOPE_DENIED/);
assert.equal(unmergeScopeDenied.calls.writes.length, 0);

const unmerged = makeHarness({ sourceState: "Fusionado" });
assert.equal(unmerged.unmerge({ sourceExpedienteId: "EXP-2", motivoJustificado: "Reversión autorizada" }).status, "success");
assert.equal(unmerged.sheets.ExpedientesEstudiantes[2][7], "Activo");
assert.equal(unmerged.sheets.HistorialCambiosEntidad[1][5], "STAFF-1");
assert.deepEqual(unmerged.calls.scope[0], { id: "EXP-2", permission: "permisoDocumental", operation: "UPDATE" });
assert.equal(unmerged.calls.releases, 1);

console.log("academic-merge-student-files-ownership: all assertions passed");
