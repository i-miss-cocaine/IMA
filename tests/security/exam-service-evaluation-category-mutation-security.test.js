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
const categoryHeaders = ["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"];
const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
function makeSheet(rows, kind, options, state) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) { this.rows.push(row.slice()); if (kind === "categories" && options.failCategoryAppend) throw new Error("synthetic category append failure"); },
    deleteRow(n) { this.rows.splice(n - 1, 1); },
    getRange(row, col) { return { setValue: value => { this.rows[row - 1][col - 1] = value; } }; }
  };
}
function fixture(options = {}) {
  const state = { opens: 0, locks: 0, releases: 0, held: false, uuid: 0, action: "" };
  const categoryRows = options.categoryRows || [categoryHeaders,
    ["CAT-OWNED", "Propia", "Global", 20, "100", "Activo"],
    ["CAT-LEGACY", "Legada", "Global", 10, "100", "Activo"]];
  const ownershipRows = options.ownershipRows || [ownershipHeaders,
    ["OWN-1", "INST-A", "CATEGORIA_EVALUACION", "CAT-OWNED", "DEPT-A", "ACTIVE", "TEACHER-A", "", ""]];
  const categorySheet = options.missingCategory ? null : makeSheet(categoryRows, "categories", options, state);
  const ownershipSheet = options.missingOwnership ? null : makeSheet(ownershipRows, "ownership", options, state);
  const sheets = { CategoriasEvaluacion: categorySheet, ResourceOwnership: ownershipSheet };
  const ss = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) {
      sheets[name] = makeSheet([], name === "CategoriasEvaluacion" ? "categories" : "other", options, state);
      return sheets[name];
    }
  };
  const scope = options.scope || { authorized: true, institutionId: "INST-A", departmentIds: ["DEPT-A"], institutionWide: false };
  const actor = options.actor || { authorized: true, userId: "TEACHER-A", role: "Profesor" };
  const runtime = {
    SPREADSHEET_ID: "LOCAL",
    LockService: { getScriptLock() { return {
      tryLock() { state.locks++; if (options.timeout || state.held) return false; state.held = true; return true; },
      releaseLock() { state.releases++; state.held = false; }
    }; } },
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
    Utilities: { getUuid() { state.uuid++; return "UUID-" + state.uuid; } }
  };
  const names = ["saveEvaluationCategory", "withAuthorizedEvaluationCategoryMutation_",
    "getAuthorizedEvaluationCategoryMutationContext_", "saveEvaluationCategoryUnlocked_"];
  vm.runInNewContext(names.map(extract).join("\n"), runtime);
  return { runtime, state, sheets, call: payload => runtime.saveEvaluationCategory(payload) };
}
const results = [];
function test(name, fn) { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } }
function denied(fn, pattern = /RESOURCE_NOT_AVAILABLE/) { assert.throws(fn, pattern); }
test("authorized create writes category and unique department ownership", () => {
  const x = fixture(); const result = x.call({ nombre: "Proyectos", ambito: "Global", porcentajePonderacion: 25, departmentId: "DEPT-A" });
  const id = result.data.categoriaId; assert.ok(id.startsWith("CAT-UUID-"));
  assert.equal(x.sheets.CategoriasEvaluacion.rows.filter(row => row[0] === id).length, 1);
  const owner = x.sheets.ResourceOwnership.rows.find(row => row[3] === id);
  assert.equal(owner[1], "INST-A"); assert.equal(owner[2], "CATEGORIA_EVALUACION"); assert.equal(owner[4], "DEPT-A");
  assert.equal(owner[5], "ACTIVE"); assert.equal(owner[6], "TEACHER-A");
});
test("authorized owner updates category without changing ownership", () => {
  const x = fixture(); const before = x.sheets.ResourceOwnership.rows[1].slice();
  const result = x.call({ categoriaId: "CAT-OWNED", nombre: "Actualizada", porcentajePonderacion: 35 });
  assert.equal(result.data.categoriaId, "CAT-OWNED");
  assert.equal(x.sheets.CategoriasEvaluacion.rows[1][1], "Actualizada");
  assert.equal(x.sheets.CategoriasEvaluacion.rows[1][3], 35);
  assert.deepEqual(x.sheets.ResourceOwnership.rows[1], before);
});
test("legacy category without ownership cannot be modified", () => {
  const x = fixture(); denied(() => x.call({ categoriaId: "CAT-LEGACY", nombre: "Ataque" }));
  assert.equal(x.sheets.CategoriasEvaluacion.rows[2][1], "Legada");
});
test("cross-institution and cross-department updates denied", () => {
  const x = fixture({ scope: { authorized: true, institutionId: "INST-B", departmentIds: ["DEPT-B"] } });
  denied(() => x.call({ categoriaId: "CAT-OWNED", nombre: "Ajena" }));
  assert.equal(x.sheets.CategoriasEvaluacion.rows[1][1], "Propia");
});
test("missing RBAC permission denied before spreadsheet access", () => {
  const x = fixture({ permission: false }); denied(() => x.call({ nombre: "No" })); assert.equal(x.state.opens, 0);
});
test("missing verified identity denied before spreadsheet access", () => {
  const x = fixture({ actor: { authorized: false } }); denied(() => x.call({ nombre: "No" })); assert.equal(x.state.opens, 0);
});
test("missing verified scope denied without writes", () => {
  const x = fixture({ scope: { authorized: false, institutionId: "INST-A", departmentIds: [] } });
  denied(() => x.call({ nombre: "No" })); assert.equal(x.sheets.CategoriasEvaluacion.rows.length, 3);
});
test("department must be explicit when multiple departments are assigned", () => {
  const x = fixture({ scope: { authorized: true, institutionId: "INST-A", departmentIds: ["DEPT-A", "DEPT-B"] } });
  assert.throws(() => x.call({ nombre: "No" }), /RESOURCE_SCOPE_DENIED/);
});
test("department outside verified scope denied", () => {
  const x = fixture(); assert.throws(() => x.call({ nombre: "No", departmentId: "DEPT-X" }), /RESOURCE_SCOPE_DENIED/);
});
test("missing ownership registry fails closed", () => {
  const x = fixture({ missingOwnership: true }); assert.throws(() => x.call({ nombre: "No" }), /MISSING_ResourceOwnership/);
});
test("duplicate category ID rejected on update", () => {
  const x = fixture({ categoryRows: [categoryHeaders, ["CAT-X","A","Global",10,"100","Activo"], ["CAT-X","B","Global",20,"100","Activo"]] });
  denied(() => x.call({ categoriaId: "CAT-X", nombre: "Duplicada" }));
});
test("lock timeout fails closed before spreadsheet access", () => {
  const x = fixture({ timeout: true }); assert.throws(() => x.call({ nombre: "No" }), /EVALUATION_CATEGORY_MUTATION_LOCK_TIMEOUT/); assert.equal(x.state.opens, 0);
});
test("append failure rolls back both category and ownership records", () => {
  const x = fixture({ failCategoryAppend: true }); assert.throws(() => x.call({ nombre: "Fallida", departmentId: "DEPT-A" }), /synthetic category append failure/);
  assert.equal(x.sheets.CategoriasEvaluacion.rows.length, 3);
  assert.equal(x.sheets.ResourceOwnership.rows.length, 2);
});
test("invalid name and percentage fail without writes", () => {
  const x = fixture(); assert.throws(() => x.call({ nombre: " " }), /Nombre de la categoría/);
  assert.throws(() => x.call({ nombre: "Fuera de rango", porcentajePonderacion: 101 }), /EVALUATION_CATEGORY_PERCENTAGE_INVALID/);
  assert.equal(x.sheets.CategoriasEvaluacion.rows.length, 3);
});
test("new category initializes missing category sheet only after authorization", () => {
  const x = fixture({ missingCategory: true }); const result = x.call({ nombre: "Nueva", departmentId: "DEPT-A" });
  assert.ok(result.data.categoriaId); assert.equal(x.sheets.CategoriasEvaluacion.rows[0][0], "ID");
});
test("RBAC action is exactly saveEvaluationCategory and lock is released", () => {
  const x = fixture(); x.call({ nombre: "Action", departmentId: "DEPT-A" });
  assert.equal(x.state.action, "saveEvaluationCategory"); assert.equal(x.state.locks, 1); assert.equal(x.state.releases, 1);
});
const failed = results.filter(item => !item.ok);
process.stdout.write(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed, results }, null, 2));
if (failed.length) process.exitCode = 1;
