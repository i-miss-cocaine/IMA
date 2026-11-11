"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });

function extractFunction(name) {
  const match = new RegExp("function " + name + "\\s*\\(").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function makeSheet(rows) {
  return {
    rows,
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) { this.rows.push(row.slice()); }
  };
}

function fixture(options = {}) {
  const closureHeaders = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  const assignmentRows = [
    ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"],
    ["A1", new Date(), "P1", "10", "A", "Math", "", "", "T1"]
  ];
  if (options.otherTeacher) assignmentRows.push(["A2", new Date(), "P1", "10", "A", "Math", "", "", "T2"]);
  if (options.noAssignment) assignmentRows.pop();
  if (options.badAssignmentSchema) assignmentRows[0] = ["wrong"];
  const closureRows = [closureHeaders];
  if (options.existing) closureRows.push([
    "REV-OLD", options.existingYear || "ANO-CURRENT", "P1", "10", "A", "Math", "T1",
    options.existingState || "PendienteRevision", new Date()
  ]);
  if (options.duplicateId) closureRows.push(["REV-U1", "ANO-CURRENT", "P2", "9", "B", "Science", "T1", "Observado", new Date()]);
  if (options.badSchema) closureRows[0] = ["wrong"];
  const sheets = { ConfiguracionAcademica: makeSheet(assignmentRows) };
  if (!options.missingClosure) sheets.CierresPeriodos = makeSheet(options.emptyClosure ? [] : closureRows);
  const stats = { acquired: 0, released: 0, held: false, opens: 0, events: [] };
  const actor = options.actor || { authorized: true, userId: "T1", role: "Profesor" };
  const scope = options.scope || { authorized: true, institutionId: "I1", departmentIds: ["D1"], institutionWide: false };
  const ss = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) { return sheets[name] = makeSheet([]); }
  };
  const runtime = {
    LockService: { getScriptLock() { stats.events.push("lock"); return {
      tryLock() { stats.acquired++; if (options.timeout || stats.held) return false; stats.held = true; return true; },
      releaseLock() { stats.released++; stats.held = false; }
    }; } },
    validateRolePermission() { stats.events.push("rbac"); return { authorized: options.denied !== true }; },
    getVerifiedExamIdentity_() { stats.events.push("identity"); return options.invalidIdentity ? { authorized: false } : actor; },
    getVerifiedExamDepartmentScope_() { return scope; },
    SpreadsheetApp: { openById() {
      stats.events.push("sheets");
      stats.opens++;
      if (stats.onOpen) { const callback = stats.onOpen; stats.onOpen = null; callback(); }
      return ss;
    } },
    getSheetOrThrow(spreadsheet, name) {
      const value = spreadsheet.getSheetByName(name);
      if (!value) throw new Error("MISSING_" + name);
      return value;
    },
    getOrCreateSheet(spreadsheet, name) { return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name); },
    normalizeString(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); },
    SPREADSHEET_ID: "TEST",
    Utilities: { getUuid() { return options.uuid || "U1"; } }
  };
  const names = [
    "submitGradebookForReview",
    "withAuthorizedPeriodGradebookSubmission_",
    "getAuthorizedPeriodGradebookSubmissionContext_",
    "submitGradebookForReviewUnlocked_"
  ];
  vm.runInNewContext(names.map(extractFunction).join("\n") +
    "\nthis.submitGradebookForReview = submitGradebookForReview;", runtime);
  return {
    runtime, sheets, stats,
    call(payload = {}) {
      return runtime.submitGradebookForReview(Object.assign({
        sessionToken: "signed", anoId: "SPOOF-YEAR", periodoId: "P1",
        grado: "10", seccion: "A", asignatura: "Math",
        profesorId: "SPOOF-TEACHER", notasPendientesCount: 999
      }, payload));
    }
  };
}

let count = 0;
function test(fn) { fn(); count++; }

test(() => {
  const x = fixture(), result = x.call();
  assert.equal(result.status, "success");
  assert.equal(x.sheets.CierresPeriodos.rows.length, 2);
  assert.equal(x.sheets.CierresPeriodos.rows[1][0], "REV-U1");
  assert.equal(x.sheets.CierresPeriodos.rows[1][1], "ANO-CURRENT");
  assert.equal(x.sheets.CierresPeriodos.rows[1][6], "T1");
  assert.equal(result.estado, "PendienteRevision");
  assert.equal("notasPendientesCount" in result, false);
  assert.deepEqual(x.stats.events, ["rbac", "identity", "lock", "rbac", "identity", "sheets"]);
  assert.equal(x.stats.events.filter(event => event === "rbac").length, 2);
  assert.equal(x.stats.events.filter(event => event === "identity").length, 2);
  assert.equal(x.stats.acquired, 1);
  assert.equal(x.stats.released, 1);
  assert.equal(x.stats.held, false);
});
test(() => {
  const x = fixture({ actor: { authorized: true, userId: "A1", role: "Administrador" } });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.stats.opens, 0);
});
test(() => {
  for (const role of ["Estudiante", "Alumno", "Tutor", "Secretaría", "Director", "Unknown"]) {
    assert.throws(() => fixture({ actor: { authorized: true, userId: "X", role } }).call(), /RESOURCE_NOT_AVAILABLE/);
  }
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.stats.opens, 0);
});
test(() => {
  const x = fixture({ invalidIdentity: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.stats.opens, 0);
});
test(() => {
  for (const scope of [
    { authorized: false, institutionId: "I1", departmentIds: ["D1"] },
    { authorized: true, institutionId: "", departmentIds: ["D1"] },
    { authorized: true, institutionId: "I1", departmentIds: [] }
  ]) assert.throws(() => fixture({ scope }).call(), /RESOURCE_NOT_AVAILABLE/);
});
test(() => {
  for (const payload of [
    { periodoId: "" }, { grado: "" }, { seccion: "" }, { asignatura: "" }, { seccion: null }
  ]) assert.throws(() => fixture().call(payload), /REQUIRED_CONTEXT_INVALID/);
});
test(() => {
  assert.throws(() => fixture({ noAssignment: true }).call(), /ASSIGNMENT_UNVERIFIED/);
  assert.throws(() => fixture({ otherTeacher: true }).call(), /ASSIGNMENT_UNVERIFIED/);
});
test(() => {
  assert.throws(() => fixture({ badAssignmentSchema: true }).call(), /ASSIGNMENT_SCHEMA_INVALID/);
});
test(() => {
  const x = fixture({ existing: true });
  assert.throws(() => x.call(), /ALREADY_EXISTS/);
  assert.equal(x.sheets.CierresPeriodos.rows.length, 2);
});
test(() => {
  const x = fixture({ existing: true, existingYear: "2026" });
  assert.throws(() => x.call(), /ALREADY_EXISTS/);
});
test(() => {
  const x = fixture({ emptyClosure: true });
  assert.equal(x.call().status, "success");
  assert.equal(x.sheets.CierresPeriodos.rows.length, 2);
});
test(() => {
  for (const state of ["Aprobado", "Cerrado"]) {
    assert.throws(() => fixture({ existing: true, existingState: state }).call(), /ALREADY_EXISTS/);
  }
});
test(() => {
  const x = fixture({ existing: true, existingState: "Observado" });
  assert.equal(x.call().status, "success");
  assert.equal(x.sheets.CierresPeriodos.rows.length, 3);
});
test(() => {
  assert.throws(() => fixture({ badSchema: true }).call(), /SCHEMA_INVALID/);
});
test(() => {
  const x = fixture({ missingClosure: true, denied: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.sheets.CierresPeriodos, undefined);
});
test(() => {
  const x = fixture({ missingClosure: true });
  assert.equal(x.call().status, "success");
  assert.equal(x.sheets.CierresPeriodos.rows.length, 2);
});
test(() => {
  const x = fixture({ timeout: true });
  assert.throws(() => x.call(), /LOCK_TIMEOUT/);
  assert.equal(x.stats.opens, 0);
  assert.equal(x.stats.released, 0);
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.stats.events, ["rbac"]);
  assert.equal(x.stats.acquired, 0);
  assert.equal(x.stats.released, 0);
  assert.equal(x.stats.opens, 0);
});
test(() => {
  const x = fixture();
  x.stats.onOpen = () => assert.throws(() => x.call(), /LOCK_TIMEOUT/);
  assert.equal(x.call().status, "success");
  assert.equal(x.stats.acquired, 2);
  assert.equal(x.stats.released, 1);
});
test(() => {
  const x = fixture({ duplicateId: true });
  assert.throws(() => x.call(), /ID_COLLISION/);
  assert.equal(x.sheets.CierresPeriodos.rows.length, 2);
});
test(() => {
  const x = fixture();
  assert.equal(x.call({ profesorId: "T2" }).status, "success");
  assert.equal(x.sheets.CierresPeriodos.rows[1][6], "T1");
});
test(() => {
  const x = fixture();
  const result = x.call({ anoId: "2027", notasPendientesCount: -1000 });
  assert.equal(result.status, "success");
  assert.equal("notasPendientesCount" in result, false);
  assert.equal(x.sheets.CierresPeriodos.rows[1][1], "ANO-CURRENT");
});


test(() => {
  for (const actor of [
    { authorized: false, userId: "T1", role: "Profesor" },
    { authorized: true, userId: "", role: "Profesor" },
    { authorized: true, userId: "  ", role: "Profesor" },
    { authorized: true, userId: "T1", role: "Estudiante" },
    { authorized: true, userId: "T1", role: "Tutor" }
  ]) {
    const x = fixture({ actor });
    assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
    assert.deepEqual(x.stats.events, ["rbac", "identity"]);
    assert.equal(x.stats.acquired, 0);
    assert.equal(x.stats.opens, 0);
  }
});
test(() => {
  const x = fixture();
  assert.equal(x.call().status, "success");
  assert.deepEqual(x.stats.events.slice(0, 6), ["rbac", "identity", "lock", "rbac", "identity", "sheets"]);
  assert.equal(x.stats.events.filter(event => event === "rbac").length, 2);
  assert.equal(x.stats.events.filter(event => event === "identity").length, 2);
  assert.deepEqual([x.stats.acquired, x.stats.released, x.stats.held], [1, 1, false]);
});

console.log("exam-service-period-gradebook-submission-security: PASS (" + count + "/25)");
