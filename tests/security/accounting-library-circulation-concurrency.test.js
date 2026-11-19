"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function makeSheet(rows) {
  const sheet = {
    rows: rows.map(row => row.slice()),
    getLastRow() { return this.rows.length; },
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getRange(row, col, count, width) {
      return {
        setValue: value => { this.rows[row - 1][col - 1] = value; },
        setValues: values => values.forEach((value, i) => {
          while (this.rows.length < row + i) this.rows.push([]);
          for (let j = 0; j < width; j++) this.rows[row - 1 + i][col - 1 + j] = value[j];
        })
      };
    },
    appendRow(row) { this.rows.push(row.slice()); },
    deleteRow(row) { this.rows.splice(row - 1, 1); }
  };
  return sheet;
}

function harness(options) {
  const opts = options || {}, sheets = {};
  if (opts.exemplars !== false) sheets.BibliotecaEjemplares = makeSheet(opts.exemplarRows || [
    ["EjemplarID", "IsbnCodigo", "Titulo", "Autor", "Categoria", "UbicacionFisica", "Estado", "Observaciones"],
    ["EJ-1", "ISBN-1", "Libro uno", "Autor", "General", "A-1", "available", ""],
    ["EJ-2", "ISBN-2", "Libro dos", "Autor", "General", "A-2", "on_loan", ""]
  ]);
  const ss = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) { sheets[name] = makeSheet([]); return sheets[name]; }
  };
  let held = false, releases = 0, uuid = 0;
  const lock = {
    onAcquired: null,
    waitLock() {
      if (opts.lockFail || held) throw new Error("LOCK_TIMEOUT");
      held = true;
      const callback = this.onAcquired;
      this.onAcquired = null;
      if (callback) callback();
    },
    releaseLock() { held = false; releases++; }
  };
  const rolePermissions = {
    Bibliotecario: ["processLibraryLoan", "reserveLibraryBook"],
    Director: ["processLibraryLoan", "reserveLibraryBook"],
    Administrador: ["processLibraryLoan", "reserveLibraryBook"]
  };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss, flush: () => {} },
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => "UUID-" + (++uuid), formatDate: date => date.toISOString().slice(0, 10) },
    Session: { getScriptTimeZone: () => "UTC" },
    Date, String, Number, Array, Object, JSON, Math, Error, isNaN, isFinite,
    ROLE_PERMISSIONS: rolePermissions,
    getVerifiedAccountingIdentity_: payload => {
      if (!payload || payload.sessionToken !== "valid-token") return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
      return opts.identity || { authorized: true, userId: "STAFF-1", role: "Bibliotecario", institutionId: "INST-1" };
    },
    accountingHasRolePermission_: (actor, action) => Array.isArray(rolePermissions[actor.role]) && rolePermissions[actor.role].indexOf(action) !== -1,
    validateRolePermission: (actor, action) => actor && actor.authorized === true && context.accountingHasRolePermission_(actor, action)
      ? { authorized: true, actor: actor } : { authorized: false, code: actor && actor.authorized ? "ROLE_NOT_ALLOWED" : "VERIFIED_IDENTITY_REQUIRED" }
  };
  const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
  const names = ["libraryCirculationActor_", "libraryEnsureSheet_", "libraryOperationKey_", "libraryIdempotencyLookup_", "libraryAppendIdempotency_", "libraryRollbackRow_", "processLibraryLoan", "reserveLibraryBook"];
  const body = names.map(name => extractFunction(source, name)).join("\n");
  const exposed = new Function("context", "with(context){" + body + ";return { processLibraryLoan: processLibraryLoan, reserveLibraryBook: reserveLibraryBook };}")(context);
  Object.assign(context, exposed);
  return { context, sheets, lock, stats: () => ({ held, releases }) };
}

function call(h, name, payload) { return h.context[name](Object.assign({ sessionToken: "valid-token" }, payload || {})); }

let h = harness();
let result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1", accion: "Prestamo" });
assert.equal(result.status, "success");
assert.equal(h.sheets.BibliotecaPrestamos.rows.length, 2);
assert.equal(h.sheets.BibliotecaEjemplares.rows[1][6], "on_loan");
assert.equal(h.sheets.BibliotecaIdempotencia.rows.length, 2);
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1", accion: "Prestamo" });
assert.equal(result.status, "success"); assert.equal(result.duplicate, true);
assert.equal(h.sheets.BibliotecaPrestamos.rows.length, 2, "retry must not append a second loan");
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-2", accion: "Prestamo" });
assert.equal(result.code, "LIBRARY_EXEMPLAR_NOT_AVAILABLE");
assert.equal(h.sheets.BibliotecaPrestamos.rows.length, 2);

result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1", accion: "Devolucion" });
assert.equal(result.status, "success"); assert.equal(h.sheets.BibliotecaEjemplares.rows[1][6], "available");
assert.equal(h.sheets.BibliotecaPrestamos.rows[1][6], "returned");
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1", accion: "Devolucion" });
assert.equal(result.status, "success"); assert.equal(result.duplicate, true);
assert.equal(h.sheets.BibliotecaPrestamos.rows.length, 2);

result = call(h, "reserveLibraryBook", { ejemplarId: "EJ-2", userId: "STUDENT-2" });
assert.equal(result.status, "success");
assert.equal(h.sheets.BibliotecaReservas.rows.length, 2);
result = call(h, "reserveLibraryBook", { ejemplarId: "EJ-2", userId: "STUDENT-2" });
assert.equal(result.status, "success"); assert.equal(result.duplicate, true);
assert.equal(h.sheets.BibliotecaReservas.rows.length, 2);
result = call(h, "reserveLibraryBook", { ejemplarId: "EJ-1", userId: "STUDENT-3" });
assert.equal(result.code, "LIBRARY_RESERVATION_NOT_REQUIRED");

h = harness({ lockFail: true });
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1" });
assert.equal(result.code, "LOCK_TIMEOUT");
assert.equal(h.sheets.BibliotecaPrestamos, undefined);
assert.equal(h.sheets.BibliotecaEjemplares.rows[1][6], "available");
assert.equal(h.stats().held, false);

h = harness({ identity: { authorized: true, userId: "STAFF-1", role: "Estudiante", institutionId: "INST-1" } });
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1" });
assert.equal(result.code, "ROLE_NOT_ALLOWED");
h = harness();
result = h.context.processLibraryLoan({ ejemplarId: "EJ-1", userId: "STUDENT-1", accion: "Prestamo" });
assert.equal(result.code, "VERIFIED_IDENTITY_REQUIRED");

h = harness({ exemplarRows: [["Codigo", "Situacion"], ["EJ-1", "available"]] });
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1" });
assert.equal(result.code, "LIBRARY_SCHEMA_MISMATCH");

h = harness();
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1", idempotencyKey: "SHARED-KEY-001" });
assert.equal(result.status, "success");
result = call(h, "processLibraryLoan", { ejemplarId: "EJ-2", userId: "STUDENT-1", idempotencyKey: "SHARED-KEY-001" });
assert.equal(result.code, "LIBRARY_IDEMPOTENCY_CONFLICT");

async function verifyLockContentionAndScheduledRaces() {
  const h = harness();
  let contender = null;
  h.lock.onAcquired = () => {
    contender = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-2" });
  };
  const winner = call(h, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1" });
  assert.equal(winner.status, "success");
  assert.equal(contender.code, "LOCK_TIMEOUT", "a competing request cannot enter the critical section");
  assert.equal(h.sheets.BibliotecaPrestamos.rows.length, 2, "lock contention must not create a second loan");
  assert.equal(h.sheets.BibliotecaEjemplares.rows[1][6], "on_loan");
  assert.equal(h.stats().held, false, "the winning request must release the lock");

  const scheduled = harness();
  const outcomes = await Promise.all([
    Promise.resolve().then(() => call(scheduled, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-1" })),
    Promise.resolve().then(() => call(scheduled, "processLibraryLoan", { ejemplarId: "EJ-1", userId: "STUDENT-2" }))
  ]);
  assert.equal(outcomes.filter(item => item.status === "success").length, 1);
  assert.equal(outcomes.filter(item => item.code === "LIBRARY_EXEMPLAR_NOT_AVAILABLE").length, 1);
  assert.equal(scheduled.sheets.BibliotecaPrestamos.rows.length, 2);

  const reservation = harness();
  reservation.lock.onAcquired = () => {
    contender = call(reservation, "reserveLibraryBook", { ejemplarId: "EJ-2", userId: "STUDENT-2" });
  };
  const reserved = call(reservation, "reserveLibraryBook", { ejemplarId: "EJ-2", userId: "STUDENT-1" });
  assert.equal(reserved.status, "success");
  assert.equal(contender.code, "LOCK_TIMEOUT");
  assert.equal(reservation.sheets.BibliotecaReservas.rows.length, 2);
  assert.equal(reservation.stats().held, false);

  const reservationLockFailure = harness({ lockFail: true });
  const failedReservation = call(reservationLockFailure, "reserveLibraryBook", { ejemplarId: "EJ-2", userId: "STUDENT-1" });
  assert.equal(failedReservation.code, "LOCK_TIMEOUT");
  assert.equal(reservationLockFailure.sheets.BibliotecaReservas, undefined);
  assert.equal(reservationLockFailure.sheets.BibliotecaIdempotencia, undefined);
  assert.equal(reservationLockFailure.stats().held, false);
}

verifyLockContentionAndScheduledRaces().then(() => {
  console.log("Library circulation concurrency/idempotency contract PASS (39 assertions).");
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
