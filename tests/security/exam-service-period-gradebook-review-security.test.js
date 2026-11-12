"use strict";
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("backend/exam-service/Code.gs", "utf8");
function extract(name) {
  const start = source.indexOf("function " + name);
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}
const HEADERS = ["CierreID","AnoID","PeriodoID","Grado","Seccion","Asignatura","ProfesorID","Estado","FechaCierre"];
function sheet(rows) {
  return {
    rows: rows.map(row => row.slice()),
    writes: 0,
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getRange(row, col, rowCount, colCount) {
      return { setValues: values => {
        this.writes++;
        if (this.onSetValues) this.onSetValues(values);
        for (let r = 0; r < rowCount; r++) {
          for (let c = 0; c < colCount; c++) this.rows[row - 1 + r][col - 1 + c] = values[r][c];
        }
      }};
    }
  };
}
function fixture(options = {}) {
  const rows = [HEADERS.slice(), ["REV-1","2026","P1","10","A","Matemáticas","T1","PendienteRevision",new Date("2026-11-10T00:00:00Z")]];
  if (options.missing) rows.splice(1, 1);
  if (options.duplicate) rows.push(rows[1].slice());
  if (options.badSchema) rows[0][0] = "Wrong";
  if (options.badRecord) rows[1][5] = "";
  if (options.badState) rows[1][7] = "Cerrado";
  const closure = options.noSheet ? null : sheet(rows);
  const configRows = [["ID","Fecha","Parcial","Grado","Sección","Asignatura","Unidad","Tema","profesorId"],
    ["A1","","P1","10","A","Matemáticas","","","T1"]];
  if (options.noAssignment) configRows.splice(1, 1);
  if (options.otherTeacher) configRows.push(["A2","","P1","10","A","Matemáticas","","","T2"]);
  if (options.badAssignmentSchema) configRows[0][0] = "Wrong";
  const configSheet = sheet(configRows);
  const stats = { acquired: 0, released: 0, held: false, opens: 0, writes: 0, permissionChecks: 0, identityChecks: 0, events: [] };
  const actors = options.actors || [options.actor || { authorized: true, userId: "SEC-1", role: "Secretaría" }];
  let actorIndex = 0;
  const permissionResults = options.permissionResults || [options.denied !== true];
  let permissionIndex = 0;
  const scope = options.scope || { authorized: true, institutionId: "INST-1", institutionWide: true };
  const ss = { getSheetByName(name) {
    if (name === "CierresPeriodos") return closure;
    if (name === "ConfiguracionAcademica") return configSheet;
    return null;
  }};
  const runtime = {
    LockService: { getScriptLock() { return {
      tryLock() { stats.events.push("lock"); stats.acquired++; if (options.timeout || stats.held) return false; stats.held = true; return true; },
      releaseLock() { stats.released++; stats.held = false; }
    }; }},
    validateRolePermission() { stats.events.push("rbac"); stats.permissionChecks++; return { authorized: permissionResults[Math.min(permissionIndex++, permissionResults.length - 1)] === true }; },
    getVerifiedExamIdentity_() { stats.events.push("identity"); stats.identityChecks++; return options.invalidIdentity ? { authorized: false } : actors[Math.min(actorIndex++, actors.length - 1)]; },
    getVerifiedExamDepartmentScope_() { return scope; },
    getSheetOrThrow(spreadsheet, name) {
      const value = spreadsheet.getSheetByName(name);
      if (!value) throw Error("MISSING_" + name);
      return value;
    },
    normalizeString(value) { return String(value || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim(); },
    SpreadsheetApp: { openById() {
      stats.events.push("sheets"); stats.opens++;
      if (stats.onOpen) { const callback = stats.onOpen; stats.onOpen = null; callback(); }
      return ss;
    }},
    SPREADSHEET_ID: "TEST"
  };
  const names = ["reviewPeriodGradebook","withAuthorizedPeriodGradebookReview_","getAuthorizedPeriodGradebookReviewContext_","reviewPeriodGradebookUnlocked_"];
  vm.runInNewContext(names.map(extract).join("\n") + "\nthis.reviewPeriodGradebook=reviewPeriodGradebook;", runtime);
  return {
    runtime, closure, stats,
    call(payload = {}) { return runtime.reviewPeriodGradebook(Object.assign({
      sessionToken: "signed", cierreId: "REV-1", decision: "Aprobado",
      revisadoPor: "SPOOFED-USER", observaciones: "Revisión validada"
    }, payload)); }
  };
}
let count = 0;
function test(fn) { fn(); count++; }

test(() => {
  const x = fixture(), result = x.call();
  assert.equal(result.status, "success");
  assert.equal(result.estadoActual, "Aprobado");
  assert.equal(result.revisadoPor, "SEC-1");
  assert.equal(x.closure.rows[1][7], "Aprobado");
  assert(Number.isFinite(x.closure.rows[1][8].getTime()));
  assert.equal(x.stats.released, 1);
});
test(() => {
  const x = fixture(), result = x.call({ decision: "Observado" });
  assert.equal(result.estadoActual, "Observado");
  assert.equal(x.closure.rows[1][7], "Observado");
});
test(() => {
  const x = fixture();
  assert.throws(() => x.call({ decision: "Publicado" }), /PUBLICATION_UNSUPPORTED/);
  assert.equal(x.closure.rows[1][7], "PendienteRevision");
  assert.equal(x.stats.opens, 0);
});
test(() => {
  const x = fixture({ actor: { authorized: true, userId: "T1", role: "Profesor" } });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.closure.rows[1][7], "PendienteRevision");
  assert.equal(x.stats.opens, 0);
});
test(() => {
  for (const role of ["Estudiante","Alumno","Tutor","Padre","Responsable","Unknown"]) {
    const x = fixture({ actor: { authorized: true, userId: "U1", role } });
    assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
    assert.equal(x.stats.opens, 0);
  }
});
test(() => {
  for (const role of ["Administrador","Desarrollador","Dirección","Director","Secretaría"]) {
    assert.equal(fixture({ actor: { authorized: true, userId: "R1", role } }).call().status, "success");
  }
});
test(() => {
  const x = fixture({ scope: { authorized: true, institutionId: "INST-1", institutionWide: false } });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.closure.rows[1][7], "PendienteRevision");
});
test(() => {
  const x = fixture({ scope: { authorized: false, institutionId: "INST-1", institutionWide: true } });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
});
test(() => {
  const x = fixture({ scope: { authorized: true, institutionId: "", institutionWide: true } });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
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
  const x = fixture({ noSheet: true });
  assert.throws(() => x.call(), /RECORD_NOT_FOUND/);
  assert.equal(x.closure, null);
});
test(() => {
  const x = fixture({ badSchema: true });
  assert.throws(() => x.call(), /SCHEMA_INVALID/);
  assert.equal(x.closure.rows.length, 2);
});
test(() => {
  const x = fixture({ missing: true });
  assert.throws(() => x.call(), /RECORD_NOT_FOUND/);
});
test(() => {
  const x = fixture({ duplicate: true });
  assert.throws(() => x.call(), /RECORD_AMBIGUOUS/);
  assert.equal(x.closure.rows[1][7], "PendienteRevision");
});
test(() => {
  const x = fixture({ badRecord: true });
  assert.throws(() => x.call(), /RECORD_INVALID/);
});
test(() => {
  const x = fixture({ badState: true });
  assert.throws(() => x.call(), /STATE_INVALID/);
});
test(() => {
  assert.throws(() => fixture({ noAssignment: true }).call(), /ASSIGNMENT_UNVERIFIED/);
  assert.throws(() => fixture({ otherTeacher: true }).call(), /ASSIGNMENT_UNVERIFIED/);
  assert.throws(() => fixture({ badAssignmentSchema: true }).call(), /ASSIGNMENT_SCHEMA_INVALID/);
});
test(() => {
  const x = fixture();
  assert.throws(() => x.call({ decision: "anything" }), /REQUIRED_FIELDS_INVALID/);
  assert.throws(() => x.call({ cierreId: "" }), /REQUIRED_FIELDS_INVALID/);
  assert.equal(x.closure.rows[1][7], "PendienteRevision");
});
test(() => {
  const x = fixture({ timeout: true });
  assert.throws(() => x.call(), /LOCK_TIMEOUT/);
  assert.equal(x.stats.opens, 0);
  assert.equal(x.stats.released, 0);
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call());
  assert.equal(x.stats.acquired, 0);
  assert.equal(x.stats.released, 0);
  assert.deepEqual(x.stats.events, ["rbac"]);
});
test(() => {
  const x = fixture();
  x.stats.onOpen = () => assert.throws(() => x.call(), /LOCK_TIMEOUT/);
  assert.equal(x.call().status, "success");
  assert.equal(x.stats.acquired, 2);
  assert.equal(x.stats.released, 1);
});
test(() => {
  const x = fixture();
  assert.equal(x.call().status, "success");
  assert.throws(() => x.call(), /STATE_INVALID/);
  assert.equal(x.closure.rows[1][7], "Aprobado");
});

test(() => {
  const x = fixture({ invalidIdentity: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.stats.acquired, 0);
  assert.equal(x.stats.opens, 0);
  assert.deepEqual(x.stats.events, ["rbac", "identity"]);
});
test(() => {
  const x = fixture({ actor: { authorized: true, userId: "  ", role: "Secretaría" } });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.stats.acquired, 0);
  assert.equal(x.stats.opens, 0);
});
test(() => {
  for (const role of ["Administrador","Desarrollador","Dirección","Director","Secretaría"]) {
    const x = fixture({ actor: { authorized: true, userId: "R1", role } });
    assert.equal(x.call().status, "success");
    assert.deepEqual(x.stats.events.slice(0, 3), ["rbac", "identity", "lock"]);
    assert.equal(x.stats.permissionChecks, 2);
    assert.equal(x.stats.identityChecks, 2);
  }
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.stats.acquired, 0);
  assert.equal(x.stats.released, 0);
  assert.equal(x.stats.opens, 0);
  assert.deepEqual(x.stats.events, ["rbac"]);
});



test(() => {
  const x = fixture({ permissionResults: [true, false] });
  const before = x.closure.rows[1].slice();
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.stats.events, ["rbac", "identity", "lock", "rbac"]);
  assert.equal(x.stats.permissionChecks, 2);
  assert.equal(x.stats.identityChecks, 1);
  assert.equal(x.stats.acquired, 1);
  assert.equal(x.stats.released, 1);
  assert.equal(x.stats.opens, 0);
  assert.equal(x.stats.held, false);
  assert.deepEqual(x.closure.rows[1], before);
});

test(() => {
  const x = fixture({ actors: [
    { authorized: true, userId: "SEC-1", role: "Secretaría" },
    { authorized: true, userId: "   ", role: "Secretaría" }
  ] });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.stats.events, ["rbac", "identity", "lock", "rbac", "identity"]);
  assert.equal(x.stats.acquired, 1);
  assert.equal(x.stats.released, 1);
  assert.equal(x.stats.opens, 0);
  assert.equal(x.stats.held, false);
  assert.equal(x.closure.rows[1][7], "PendienteRevision");
});
test(() => {
  const x = fixture();
  let nestedAttempts = 0;
  x.closure.onSetValues = () => {
    nestedAttempts++;
    assert.throws(() => x.call(), /GRADEBOOK_REVIEW_LOCK_TIMEOUT/,
      "a reentrant review must time out while the outer review owns ScriptLock");
  };
  const result = x.call();
  assert.equal(result.status, "success");
  assert.equal(result.estadoActual, "Aprobado");
  assert.equal(nestedAttempts, 1);
  assert.equal(x.closure.writes, 1, "the outer review must write exactly once");
  assert.equal(x.closure.rows[1][7], "Aprobado", "the outer decision must persist");
  assert(Number.isFinite(x.closure.rows[1][8].getTime()));
  assert.equal(x.stats.opens, 1, "the nested request must not open Sheets");
  assert.equal(x.stats.acquired, 2, "the nested request must reach lock contention");
  assert.equal(x.stats.released, 1, "the outer request must release ScriptLock");
  assert.equal(x.stats.held, false, "ScriptLock must not remain held");
});
console.log("exam-service-period-gradebook-review-security: PASS (" + count + "/30)");
