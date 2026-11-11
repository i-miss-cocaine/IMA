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
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced " + name);
}

const evaluationHeaders = ["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID",
  "PeriodoID", "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro"];
const rubricHeaders = ["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"];
const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];

function makeSheet(rows, options, kind) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) {
      if (kind === "evaluation" && options.failAppend) throw new Error("synthetic append failure");
      this.rows.push(row.slice());
    }
  };
}

function fixture(options = {}) {
  const state = { opens: 0, locks: 0, releases: 0, held: false, uuid: 0, action: "" };
  const actor = options.actor || { authorized: true, userId: "PROF-1", role: "Profesor" };
  const scope = options.scope || { authorized: true, institutionId: "INST-1", departmentIds: ["DEPT-1"], institutionWide: false };
  const userRows = [["UserID", "Nombre", "Grado", "Seccion", "X", "Y", "Role"],
    ["STU-1", "Student One", "10", "A", "", "", "Estudiante"],
    ["STU-2", "Student Two", "10", "A", "", "", "Alumno"]];
  if (options.duplicateStudent) userRows.push(["STU-1", "Duplicate", "10", "A", "", "", "Estudiante"]);
  if (options.nonStudent) userRows.push(["TEACHER-STUDENT", "Teacher", "10", "A", "", "", "Profesor"]);
  const configRows = [configHeaders,
    ["CFG-1", "", "P1", "10", "A", "Math", "", "", "PROF-1"]];
  if (options.conflictingAssignment) configRows.push(["CFG-2", "", "P1", "10", "A", "Math", "", "", "PROF-2"]);
  if (options.noAssignment) configRows.splice(1, 1);
  if (options.otherAssignment) configRows.push(["CFG-2", "", "P1", "10", "A", "Science", "", "", "PROF-1"]);
  const sheets = {
    Usuarios: makeSheet(userRows, options, "users"),
    ConfiguracionAcademica: makeSheet(configRows, options, "config"),
    RubricasEvaluacion: makeSheet(options.rubricRows || [rubricHeaders,
      ["RUB-1", "Rúbrica", "Math", "Activa", "[]"]], options, "rubric")
  };
  if (options.ownershipRows) sheets.ResourceOwnership = makeSheet(options.ownershipRows, options, "ownership");
  if (!options.missingEvaluationSheet) {
    sheets.EvaluacionesCompetencias = makeSheet(options.evaluationRows || [evaluationHeaders], options, "evaluation");
  }
  const ss = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) {
      sheets[name] = makeSheet([], options, "evaluation");
      return sheets[name];
    }
  };
  const scriptLock = {
    tryLock() { state.locks++; if (options.timeout || state.held) return false; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const runtime = {
    SPREADSHEET_ID: "LOCAL",
    LockService: { getScriptLock() { return scriptLock; } },
    validateRolePermission(action) { state.action = action; return { authorized: options.permission !== false }; },
    getVerifiedExamIdentity_() { return actor; },
    getVerifiedExamDepartmentScope_() { if (options.duringScope) options.duringScope(); return scope; },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    getSheetOrThrow(spreadsheet, name) {
      const sheet = spreadsheet.getSheetByName(name);
      if (!sheet) throw new Error("MISSING_" + name);
      return sheet;
    },
    getOrCreateSheet(spreadsheet, name) { return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name); },
    normalizeString(value) {
      return String(value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();
    },
    Utilities: { getUuid() { state.uuid++; return "UUID-" + state.uuid; } }
  };
  const names = ["saveCompetencyEvaluation", "withAuthorizedCompetencyEvaluationMutation_",
    "getAuthorizedCompetencyEvaluationMutationContext_", "saveCompetencyEvaluationUnlocked_", "getExamStudentProfile_"];
  vm.runInNewContext(names.map(extract).join("\n") + "\nthis.saveCompetencyEvaluation = saveCompetencyEvaluation;", runtime);
  const payload = Object.assign({ sessionToken: "synthetic", userId: "STU-1", competenciaId: "COMP-1",
    indicadorId: "IND-1", asignaturaId: "Math", periodoId: "P1", nivelDesempeno: "Alto", observaciones: "Observación", rubricaId: "RUB-1" },
    options.payload || {});
  return { call: p => runtime.saveCompetencyEvaluation(p || payload), state, sheets, payload };
}

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
}
function denied(fn, pattern = /RESOURCE_NOT_AVAILABLE/) { assert.throws(fn, pattern); }

test("authorized teacher creates a competency evaluation for an assigned student", () => {
  const x = fixture(); const result = x.call();
  assert.equal(result.status, "success"); assert.equal(result.userId, "STU-1");
  assert.equal(result.competenciaId, "COMP-1"); assert.equal(result.nivelDesempeno, "Alto");
  const rows = x.sheets.EvaluacionesCompetencias.rows;
  assert.equal(rows.length, 2); assert.equal(rows[1][3], "STU-1");
  assert.equal(rows[1][4], "Math"); assert.equal(rows[1][5], "P1");
  assert.equal(rows[1][8], "RUB-1"); assert.ok(rows[1][0].startsWith("COMP-EVAL-UUID-"));
  assert.equal(x.state.action, "saveCompetencyEvaluation");
});
test("teacher may evaluate another student only within their verified assignment", () => {
  const x = fixture(); const result = x.call(Object.assign({}, x.payload, { userId: "STU-2" }));
  assert.equal(result.userId, "STU-2");
});
test("unassigned subject or period is denied without writing", () => {
  const x = fixture();
  denied(() => x.call(Object.assign({}, x.payload, { asignaturaId: "Science" })));
  assert.equal(x.sheets.EvaluacionesCompetencias.rows.length, 1);
  denied(() => fixture({ noAssignment: true }).call());
});
test("teacher cannot submit missing subject, period, grade or section", () => {
  for (const patch of [{ asignaturaId: "" }, { periodoId: "" }]) {
    const x = fixture(); denied(() => x.call(Object.assign({}, x.payload, patch)));
  }
  const x = fixture(); x.sheets.Usuarios.rows[1][2] = "";
  denied(() => x.call());
});
test("conflicting teacher assignment for the same class and subject is denied", () => {
  const x = fixture({ conflictingAssignment: true }); denied(() => x.call());
});
test("unknown, duplicate or non-student target identities are denied", () => {
  denied(() => fixture().call(Object.assign({}, fixture().payload, { userId: "UNKNOWN" })));
  denied(() => fixture({ duplicateStudent: true }).call());
  denied(() => fixture({ nonStudent: true }).call(Object.assign({}, fixture().payload, { userId: "TEACHER-STUDENT" })));
});
test("student and unrelated roles cannot write competency evaluations", () => {
  for (const role of ["Estudiante", "Alumno", "Tutor", "Padre", "Responsable", "Visitor"]) {
    denied(() => fixture({ actor: { authorized: true, userId: "ACTOR", role } }).call());
  }
});
test("institutional administrator requires institution-wide verified scope", () => {
  const x = fixture({ actor: { authorized: true, userId: "ADMIN-1", role: "Administrador" },
    scope: { authorized: true, institutionId: "INST-1", departmentIds: [], institutionWide: true } });
  assert.equal(x.call().status, "success");
  const narrow = fixture({ actor: { authorized: true, userId: "ADMIN-1", role: "Administrador" },
    scope: { authorized: true, institutionId: "INST-1", departmentIds: ["DEPT-1"], institutionWide: false } });
  denied(() => narrow.call());
});
test("RBAC denial occurs before spreadsheet access", () => {
  const x = fixture({ permission: false }); denied(() => x.call()); assert.equal(x.state.opens, 0);
});
test("missing signed identity is denied before spreadsheet access", () => {
  const x = fixture({ actor: { authorized: false } }); denied(() => x.call()); assert.equal(x.state.opens, 0);
});
test("missing institution scope is denied and lock is released", () => {
  const x = fixture({ scope: { authorized: false } }); denied(() => x.call());
  assert.equal(x.state.releases, 1); assert.equal(x.state.held, false);
});
test("lock timeout fails closed before spreadsheet access", () => {
  const x = fixture({ timeout: true });
  assert.throws(() => x.call(), /COMPETENCY_EVALUATION_MUTATION_LOCK_TIMEOUT/);
  assert.equal(x.state.opens, 0); assert.equal(x.state.releases, 0);
});
test("nested mutation is rejected while the shared ScriptLock is held", () => {
  let x, nestedDenied = false;
  x = fixture({ duringScope() {
    try { x.call(); } catch (error) { nestedDenied = /COMPETENCY_EVALUATION_MUTATION_LOCK_TIMEOUT/.test(error.message); }
  }});
  x.call(); assert.ok(nestedDenied); assert.equal(x.state.locks, 2);
  assert.equal(x.state.releases, 1); assert.equal(x.state.held, false);
});
test("missing rubric and duplicate rubric IDs are denied", () => {
  const missing = fixture(); denied(() => missing.call(Object.assign({}, missing.payload, { rubricaId: "RUB-MISSING" })));
  const duplicate = fixture({ rubricRows: [rubricHeaders, ["RUB-1", "A", "Math", "Activa", "[]"], ["RUB-1", "B", "Math", "Activa", "[]"]] });
  denied(() => duplicate.call());
});
test("rubric subject compatibility and active ownership are enforced", () => {
  const wrongSubject = fixture({ rubricRows: [rubricHeaders, ["RUB-1", "Rúbrica", "Science", "Activa", "[]"]] });
  denied(() => wrongSubject.call());
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  const foreign = fixture({ ownershipRows: [ownershipHeaders,
    ["OWN-1", "INST-OTHER", "RUBRICA_EVALUACION", "RUB-1", "DEPT-X", "ACTIVE", "OTHER", "", ""]] });
  denied(() => foreign.call());
  const outOfDepartment = fixture({ ownershipRows: [ownershipHeaders,
    ["OWN-1", "INST-1", "RUBRICA_EVALUACION", "RUB-1", "DEPT-2", "ACTIVE", "OTHER", "", ""]] });
  denied(() => outOfDepartment.call());
  const valid = fixture({ ownershipRows: [ownershipHeaders,
    ["OWN-1", "INST-1", "RUBRICA_EVALUACION", "RUB-1", "DEPT-1", "ACTIVE", "PROF-1", "", ""]] });
  assert.equal(valid.call().status, "success");
});
test("invalid rubric or evaluation schema fails closed", () => {
  const badRubric = fixture({ rubricRows: [["wrong"], ["RUB-1"]] });
  assert.throws(() => badRubric.call(), /RUBRICS_SCHEMA_INVALID/);
  const badEvaluation = fixture({ evaluationRows: [["wrong"]] });
  assert.throws(() => badEvaluation.call(), /COMPETENCY_EVALUATION_SCHEMA_INVALID/);
});
test("missing evaluation sheet is initialized only after authorization", () => {
  const x = fixture({ missingEvaluationSheet: true }); assert.equal(x.call().status, "success");
  assert.deepEqual(x.sheets.EvaluacionesCompetencias.rows[0], evaluationHeaders);
});
test("required fields are validated before RBAC and persistence", () => {
  const x = fixture(); assert.throws(() => x.call(Object.assign({}, x.payload, { competenciaId: " ", nivelDesempeno: "" })), /COMPETENCY_EVALUATION_REQUIRED_FIELDS/);
  assert.equal(x.sheets.EvaluacionesCompetencias.rows.length, 1);
});
test("duplicate generated evaluation ID is rejected", () => {
  const rows = [evaluationHeaders, ["COMP-EVAL-UUID-1", "OLD", "IND", "STU-1", "Math", "P1", "Bajo", "", "", null]];
  const x = fixture({ evaluationRows: rows });
  assert.throws(() => x.call(), /COMPETENCY_EVALUATION_ID_COLLISION/);
  assert.equal(x.sheets.EvaluacionesCompetencias.rows.length, 2);
});
test("append failure propagates and lock is always released", () => {
  const x = fixture({ failAppend: true }); assert.throws(() => x.call(), /synthetic append failure/);
  assert.equal(x.state.releases, 1); assert.equal(x.state.held, false);
});
test("legacy optional indicator and rubric fields retain their defaults", () => {
  const x = fixture(); const result = x.call(Object.assign({}, x.payload, { indicadorId: "", rubricaId: "" }));
  assert.equal(result.status, "success");
  const row = x.sheets.EvaluacionesCompetencias.rows[1];
  assert.equal(row[2], "IND-GENERIC"); assert.equal(row[8], "");
});

const failed = results.filter(item => !item.ok);
process.stdout.write(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed, results }, null, 2));
if (failed.length) process.exitCode = 1;
