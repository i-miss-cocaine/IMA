"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extract(name) {
  const match = new RegExp("function " + name + "\\s*\\(").exec(source);
  assert.ok(match, "missing " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const rubricHeaders = ["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"];
const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
function makeSheet(rows, kind, options, state) {
  return {
    rows,
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) {
      this.rows.push(row.slice());
      if (kind === "rubrics" && options.failRubricAppend) throw new Error("synthetic append failure");
    },
    deleteRow(n) { this.rows.splice(n - 1, 1); },
    getRange(row, col, numRows, numCols) {
      return { setValues: values => values.forEach((line, ri) => {
        for (let ci = 0; ci < line.length; ci++) this.rows[row - 1 + ri][col - 1 + ci] = line[ci];
      }) };
    }
  };
}
function fixture(options = {}) {
  const state = { opens: 0, locks: 0, releases: 0, held: false, uuid: 0, rubricWrites: 0 };
  const rubricRows = options.rubricRows || [rubricHeaders,
    ["RUB-OWNED", "Propia", "Matemáticas", "Activa", "[]"],
    ["RUB-LEGACY", "Legada", "General", "Activa", "[]"]];
  const ownershipRows = options.ownershipRows || [ownershipHeaders,
    ["OWN-1", "INST-A", "RUBRICA_EVALUACION", "RUB-OWNED", "DEPT-A", "ACTIVE", "TEACHER-A", "", ""]];
  const rubricSheet = makeSheet(rubricRows.map(r => r.slice()), "rubrics", options, state);
  const ownershipSheet = options.missingOwnership ? null : makeSheet(ownershipRows.map(r => r.slice()), "ownership", options, state);
  const sheets = { RubricasEvaluacion: rubricSheet, ResourceOwnership: ownershipSheet };
  const ss = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) {
      const headers = name === "RubricasEvaluacion" ? rubricHeaders : [];
      sheets[name] = makeSheet(headers.map(r => Array.isArray(r) ? r.slice() : r), name === "RubricasEvaluacion" ? "rubrics" : "other", options, state);
      return sheets[name];
    }
  };
  const scope = options.scope || { authorized: true, institutionId: "INST-A", departmentIds: ["DEPT-A"], institutionWide: false };
  const actor = options.actor || { authorized: true, userId: "TEACHER-A", role: "Profesor" };
  const scriptLock = {
    tryLock() { state.locks++; if (options.timeout || state.held) return false; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const runtime = {
    SPREADSHEET_ID: "LOCAL",
    LockService: { getScriptLock() { return scriptLock; } },
    validateRolePermission(action) { state.action = action; return { authorized: options.permission !== false }; },
    getVerifiedExamIdentity_() { return actor; },
    getVerifiedExamDepartmentScope_() { return scope; },
    assertExamResourceOwnershipForScope_(spreadsheet, currentScope, type, id) {
      const rows = sheets.ResourceOwnership ? sheets.ResourceOwnership.rows.slice(1) : [];
      const matches = rows.filter(row => String(row[1]) === String(currentScope.institutionId) &&
        String(row[2]).toUpperCase() === type && String(row[3]) === id && String(row[5]).toUpperCase() === "ACTIVE");
      return { authorized: matches.length === 1 && (currentScope.institutionWide === true ||
        (currentScope.departmentIds || []).includes(matches[0][4])) };
    },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("MISSING_" + name); return sheet; },
    getOrCreateSheet(spreadsheet, name) { return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name); },
    Utilities: { getUuid() { state.uuid++; return "UUID-" + state.uuid; } },
    normalizeString(value) { return String(value || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim(); }
  };
  const names = ["saveRubric", "withAuthorizedRubricMutation_", "getAuthorizedRubricMutationContext_",
    "saveRubricUnlocked_", "getRubricsUnlocked_"];
  vm.runInNewContext(names.map(extract).join("\\n"), runtime);
  return { runtime, state, sheets, call: payload => runtime.saveRubric(payload),
    read: () => runtime.getRubricsUnlocked_({}, { ss, scope }) };
}
const results = [];
function test(name, fn) { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } }
function denied(fn, pattern = /RESOURCE_NOT_AVAILABLE/) { assert.throws(fn, pattern); }
test("authorized create writes rubric and unique department ownership", () => {
  const x = fixture(); const result = x.call({ titulo: "Nueva", asignatura: "Ciencias", criterios: [{ criterio: "Análisis" }], departmentId: "DEPT-A" });
  const id = result.data.rubricaId;
  assert.ok(id.startsWith("RUB-UUID-"));
  assert.equal(x.sheets.RubricasEvaluacion.rows.filter(row => row[0] === id).length, 1);
  const owner = x.sheets.ResourceOwnership.rows.find(row => row[3] === id);
  assert.equal(owner[1], "INST-A"); assert.equal(owner[2], "RUBRICA_EVALUACION"); assert.equal(owner[4], "DEPT-A");
  assert.equal(owner[5], "ACTIVE"); assert.equal(owner[6], "TEACHER-A");
});
test("authorized owner can update existing rubric without changing ownership", () => {
  const x = fixture(); const before = x.sheets.ResourceOwnership.rows[1].slice();
  const result = x.call({ rubricaId: "RUB-OWNED", titulo: "Actualizada", asignatura: "Biología", criterios: [] });
  assert.equal(result.data.rubricaId, "RUB-OWNED");
  assert.deepEqual(x.sheets.RubricasEvaluacion.rows[1].slice(1), ["Actualizada", "Biología", "Activa", "[]"]);
  assert.deepEqual(x.sheets.ResourceOwnership.rows[1], before);
});
test("legacy rubric without ownership cannot be modified", () => {
  const x = fixture(); denied(() => x.call({ rubricaId: "RUB-LEGACY", titulo: "Ataque" }));
  assert.equal(x.sheets.RubricasEvaluacion.rows[2][1], "Legada");
});
test("cross-department and cross-institution update denied", () => {
  const x = fixture({ scope: { authorized: true, institutionId: "INST-B", departmentIds: ["DEPT-B"] } });
  denied(() => x.call({ rubricaId: "RUB-OWNED", titulo: "Ajena" }));
  assert.equal(x.sheets.RubricasEvaluacion.rows[1][1], "Propia");
});
test("missing permission denied before spreadsheet access", () => {
  const x = fixture({ permission: false }); denied(() => x.call({ titulo: "No" })); assert.equal(x.state.opens, 0);
});
test("missing verified identity denied before spreadsheet access", () => {
  const x = fixture({ actor: { authorized: false } }); denied(() => x.call({ titulo: "No" })); assert.equal(x.state.opens, 0);
});
test("missing scope denied without rubric creation", () => {
  const x = fixture({ scope: { authorized: false, institutionId: "INST-A", departmentIds: [] } });
  denied(() => x.call({ titulo: "No" })); assert.equal(x.sheets.RubricasEvaluacion.rows.length, 3);
});
test("department must be explicitly selected when scope has multiple departments", () => {
  const x = fixture({ scope: { authorized: true, institutionId: "INST-A", departmentIds: ["DEPT-A", "DEPT-B"] } });
  assert.throws(() => x.call({ titulo: "No" }), /RESOURCE_SCOPE_DENIED/);
});
test("department outside verified scope denied", () => {
  const x = fixture(); assert.throws(() => x.call({ titulo: "No", departmentId: "DEPT-X" }), /RESOURCE_SCOPE_DENIED/);
});
test("missing ownership sheet fails closed", () => {
  const x = fixture({ missingOwnership: true }); assert.throws(() => x.call({ titulo: "No" }), /MISSING_ResourceOwnership/);
});
test("duplicate rubric ID is rejected", () => {
  const x = fixture({ rubricRows: [rubricHeaders, ["RUB-X","A","G","Activa","[]"], ["RUB-X","B","G","Activa","[]"]] });
  denied(() => x.call({ rubricaId: "RUB-X", titulo: "Dup" }));
});
test("lock timeout fails closed and does not access spreadsheet", () => {
  const x = fixture({ timeout: true }); assert.throws(() => x.call({ titulo: "No" }), /RUBRIC_MUTATION_LOCK_TIMEOUT/); assert.equal(x.state.opens, 0);
});
test("nested mutation is excluded by the shared script lock", () => {
  const x = fixture(); const inner = () => x.call({ titulo: "Nested", departmentId: "DEPT-A" });
  let nestedDenied = false;
  const lock = x.runtime.LockService.getScriptLock();
  lock.tryLock = function() { x.state.locks++; if (x.state.held) return false; x.state.held = true; return true; };
  // Re-enter through the callback while the outer lock is held.
  const originalGetContext = x.runtime.getAuthorizedRubricMutationContext_;
  x.runtime.getAuthorizedRubricMutationContext_ = function(payload) { try { inner(); } catch (e) { nestedDenied = /RUBRIC_MUTATION_LOCK_TIMEOUT/.test(e.message); } return originalGetContext(payload); };
  x.call({ titulo: "Outer", departmentId: "DEPT-A" });
  assert.ok(nestedDenied);
});
test("append failure rolls back both rubric and ownership records", () => {
  const x = fixture({ failRubricAppend: true }); assert.throws(() => x.call({ titulo: "Fallida", departmentId: "DEPT-A" }), /synthetic append failure/);
  assert.equal(x.sheets.RubricasEvaluacion.rows.length, 3);
  assert.equal(x.sheets.ResourceOwnership.rows.length, 2);
});
test("invalid title and unserializable criteria fail without writes", () => {
  const x = fixture(); assert.throws(() => x.call({ titulo: " " }), /RUBRIC_TITLE_REQUIRED/);
  const circular = {}; circular.self = circular;
  assert.throws(() => x.call({ titulo: "Circular", criterios: circular }), /RUBRIC_CRITERIA_INVALID/);
  assert.equal(x.sheets.RubricasEvaluacion.rows.length, 3);
});
test("owned rubric is visible only in matching institution and department scope", () => {
  const x = fixture(); const own = x.read().data.map(row => row.rubricaId);
  assert.ok(own.includes("RUB-OWNED")); assert.ok(own.includes("RUB-LEGACY"));
  const foreign = x.runtime.getRubricsUnlocked_({}, { ss: x.sheets && { getSheetByName: name => x.sheets[name] || null },
    scope: { institutionId: "INST-B", departmentIds: ["DEPT-B"], institutionWide: false } }).data.map(row => row.rubricaId);
  assert.ok(!foreign.includes("RUB-OWNED")); assert.ok(foreign.includes("RUB-LEGACY"));
});
test("RBAC action is exactly saveRubric", () => { const x = fixture(); x.call({ titulo: "Action", departmentId: "DEPT-A" }); assert.equal(x.state.action, "saveRubric"); });
const failed = results.filter(item => !item.ok);
process.stdout.write(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed, results }, null, 2));
if (failed.length) process.exitCode = 1;
