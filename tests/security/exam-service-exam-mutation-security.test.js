"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });

function extractFunction(name) {
  const match = new RegExp("function\\s+" + name + "\\s*\\([^)]*\\)\\s*\\{").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && next === "/") { lineComment = true; i++; continue; }
    if (c === "/" && next === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
function fixture(options = {}) {
  const state = { opens: 0, lockAttempts: 0, releases: 0, identityCalls: 0, mutations: 0, held: false };
  const actor = { authorized: true, userId: "TEACHER-1", role: "Profesor" };
  const actors = options.actors || [actor, actor];
  const identity = () => actors[Math.min(state.identityCalls++, actors.length - 1)];
  const permission = () => ({ authorized: options.permission !== false });
  const scope = () => ({ authorized: options.scope !== false, institutionId: "I1", departmentIds: ["D1"] });
  const examSheet = { getDataRange: () => ({ getValues: () => [
    ["ID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "Tiempo", "Estado", "ProfesorID"],
    ["EXAM-1", "Examen", "Matemáticas", "10", "A", "", "", "Inactivo", "TEACHER-1"]
  ] }) };
  const context = new Function(
    "validateRolePermission", "getVerifiedExamIdentity_", "SpreadsheetApp", "SPREADSHEET_ID",
    "getVerifiedExamDepartmentScope_", "getSheetOrThrow", "assertExamResourceOwnershipForScope_",
    extractFunction("getAuthorizedExamMutationContext_") + "; return getAuthorizedExamMutationContext_;"
  )(permission, identity, { openById() { state.opens++; return {}; } }, "TEST", scope, () => examSheet, () => ({ authorized: true }));
  const lock = {
    tryLock() { state.lockAttempts++; if (options.timeout || state.held) return false; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const wrapper = new Function(
    "validateRolePermission", "getVerifiedExamIdentity_", "LockService", "getAuthorizedExamMutationContext_",
    extractFunction("withAuthorizedExamMutation_") + "; return withAuthorizedExamMutation_;"
  )(permission, identity, { getScriptLock: () => lock }, context);
  return {
    state,
    run() { return wrapper({ examenId: "EXAM-1" }, "updateExam", () => { state.mutations++; return { status: "success" }; }); },
    readContext() { return context({ examenId: "EXAM-1" }, "updateExam"); }
  };
}
let passed = 0;
function test(fn) { fn(); passed++; }
test(() => {
  const x = fixture({ permission: false });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.lockAttempts, 0);
  assert.equal(x.state.opens, 0);
});
for (const actor of [
  null, { authorized: false, userId: "T1", role: "Profesor" },
  { authorized: true, role: "Profesor" }, { authorized: true, userId: "", role: "Profesor" },
  { authorized: true, userId: "  ", role: "Profesor" }, { authorized: 1, userId: "T1", role: "Profesor" }
]) test(() => {
  const x = fixture({ actors: [actor] });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.lockAttempts, 0);
  assert.equal(x.state.opens, 0);
});
test(() => {
  const x = fixture({ actors: [{ authorized: true, userId: " ", role: "Profesor" }] });
  assert.throws(() => x.readContext(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.opens, 0);
});
test(() => {
  const x = fixture({ actors: [{ authorized: true, userId: "TEACHER-1", role: "Profesor" }, { authorized: true, role: "Profesor" }] });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.identityCalls, 2);
  assert.equal(x.state.lockAttempts, 1);
  assert.equal(x.state.opens, 0);
  assert.equal(x.state.releases, 1);
  assert.equal(x.state.held, false);
});
test(() => {
  const x = fixture();
  assert.deepEqual(x.run(), { status: "success" });
  assert.equal(x.state.opens, 1);
  assert.equal(x.state.mutations, 1);
  assert.equal(x.state.releases, 1);
  assert.equal(x.state.held, false);
});
test(() => {
  const x = fixture({ scope: false });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.releases, 1);
  assert.equal(x.state.held, false);
});
test(() => {
  const x = fixture({ timeout: true });
  assert.throws(() => x.run(), /EXAM_MUTATION_LOCK_TIMEOUT/);
  assert.equal(x.state.opens, 0);
  assert.equal(x.state.mutations, 0);
  assert.equal(x.state.releases, 0);
});
process.stdout.write("exam-service-exam-mutation-security: " + passed + "/11 PASS\\n");
