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
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function makeSheet(rows) {
  return { rows, getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; } };
}

function runtime(options = {}) {
  const evaluations = [
    ["EV-1", "COMP-1", "IND-1", "STU-1", "Math", "P1", "Alto", "ok", "R-1", new Date("2026-11-10T10:00:00Z")],
    ["EV-2", "COMP-2", "IND-2", "STU-2", "Math", "P1", "Medio", "other", "R-1", new Date("2026-11-10T11:00:00Z")],
    ["EV-3", "COMP-3", "IND-3", "STU-1", "Science", "P1", "Bajo", "science", "", new Date("2026-11-10T12:00:00Z")],
    ["EV-DUP", "COMP-D", "IND-D", "STU-1", "Math", "P1", "Alto", "duplicate", "", null],
    ["EV-DUP", "COMP-D2", "IND-D2", "STU-1", "Math", "P1", "Bajo", "duplicate 2", "", null],
    ["", "COMP-X", "IND-X", "STU-1", "Math", "P1", "Alto", "blank ID", "", null],
    ["EV-BAD-DATE", "COMP-4", "IND-4", "STU-1", "Math", "P1", "Alto", "bad date", "", "not-a-date"]
  ];
  const configRows = [
    ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"],
    ["CFG-1", "", "P1", "10", "A", "Math", "", "", "PROF-1"]
  ];
  if (options.conflictingAssignment) configRows.push(["CFG-2", "", "P1", "10", "A", "Math", "", "", "PROF-2"]);
  const sheets = {
    Usuarios: makeSheet([
      ["UserID"], ["STU-1", "Student One", "10", "A", "", "", "Estudiante"],
      ["STU-2", "Student Two", "10", "A", "", "", "Estudiante"],
      ["DUP", "Duplicate One", "10", "A", "", "", "Estudiante"],
      ["DUP", "Duplicate Two", "10", "A", "", "", "Estudiante"]
    ]),
    ConfiguracionAcademica: makeSheet(configRows)
  };
  if (!options.missingEvaluationSheet) {
    sheets.EvaluacionesCompetencias = makeSheet([
      ["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID", "PeriodoID",
        "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro"],
      ...evaluations
    ]);
  }
  const ss = { getSheetByName: name => sheets[name] || null };
  const actor = options.actor || { userId: "STU-1", role: "Estudiante" };
  const scope = { authorized: options.authorized !== false, institutionWide: options.institutionWide !== false };
  let held = false, acquires = 0, releases = 0;
  const getSheetOrThrow = (spreadsheet, name) => {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("MISSING_SHEET");
    return sheet;
  };
  const normalizeString = value => String(value || "").toLowerCase().normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "").trim();
  const validateRolePermission = (action, payload) => {
    if (action !== "getCompetencyEvaluations" || options.deniedAction === action) return { authorized: false };
    if (["Estudiante", "Alumno"].includes(actor.role) && payload && payload.userId &&
        String(payload.userId).trim() !== actor.userId) return { authorized: false };
    return { authorized: true };
  };
  const getExamReadContext = (payload, requestedStudentId) => ({
    actor, ss, scope, studentActor: ["Estudiante", "Alumno"].includes(actor.role),
    guardianActor: false, profile: { userId: actor.userId, role: actor.role, grado: "10", seccion: "A" },
    requestedStudentId
  });
  const LockService = {
    getScriptLock() {
      return {
        tryLock() {
          acquires++;
          if (options.beforeAcquire) { const callback = options.beforeAcquire; options.beforeAcquire = null; callback(); }
          if (options.lockAvailable === false || held) return false;
          held = true;
          return true;
        },
        releaseLock() { releases++; held = false; }
      };
    }
  };
  const declarations = [
    "getCompetencyEvaluations", "getCompetencyEvaluationsUnlocked_", "withAuthorizedExamRead_",
    "getAuthorizedExamReadContext_", "getExamStudentProfile_"
  ].map(extractFunction).join("\n");
  const context = {
    LockService, validateRolePermission, getExamReadContext_: getExamReadContext,
    getSheetOrThrow, normalizeString, SpreadsheetApp: { openById() { return ss; } }
  };
  vm.runInNewContext(declarations + "\nthis.getCompetencyEvaluations = getCompetencyEvaluations;", context);
  return { call: payload => context.getCompetencyEvaluations(payload), sheets,
    stats: () => ({ acquires, releases, held }) };
}

const student = runtime();
const own = student.call({ sessionToken: "student" });
assert.deepEqual(Array.from(own.data, row => row.userId), ["STU-1", "STU-1", "STU-1"]);
assert.equal(own.total, 3, "student sees own rows only; duplicate IDs are excluded");
assert.deepEqual(student.stats(), { acquires: 1, releases: 1, held: false });
assert.throws(() => runtime().call({ userId: "STU-2" }), /RESOURCE_NOT_AVAILABLE/);

const teacher = runtime({ actor: { userId: "PROF-1", role: "Profesor" } });
const teacherData = teacher.call({ userId: "STU-1", asignaturaId: "Math", periodoId: "P1" });
assert.equal(teacherData.total, 2, "teacher is restricted to the exact assigned subject and period");
assert.ok(teacherData.data.every(row => row.asignaturaId === "Math"));
assert.throws(() => runtime({ actor: { userId: "PROF-1", role: "Profesor" } })
  .call({ userId: "STU-1", asignaturaId: "Math" }), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ actor: { userId: "PROF-1", role: "Profesor" }, conflictingAssignment: true })
  .call({ userId: "STU-1", asignaturaId: "Math", periodoId: "P1" }), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ actor: { userId: "PROF-1", role: "Profesor" } })
  .call({ userId: "STU-1", asignaturaId: "Science", periodoId: "P1" }), /RESOURCE_NOT_AVAILABLE/);

const admin = runtime({ actor: { userId: "ADMIN-1", role: "Administrador" } });
assert.equal(admin.call({ userId: "STU-1" }).total, 3);
assert.throws(() => runtime({ actor: { userId: "ADMIN-1", role: "Administrador" }, institutionWide: false })
  .call({}), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ actor: { userId: "OTHER-1", role: "Coordinador" } }).call({}), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ deniedAction: "getCompetencyEvaluations" }).call({}), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ authorized: false }).call({}), /RESOURCE_NOT_AVAILABLE/);

const timeout = runtime({ lockAvailable: false });
assert.throws(() => timeout.call({}), /EXAM_READ_LOCK_TIMEOUT/);
assert.deepEqual(timeout.stats(), { acquires: 1, releases: 0, held: false });

let racing;
racing = runtime({ beforeAcquire() {
  racing.sheets.EvaluacionesCompetencias.rows.push(["EV-AFTER", "COMP-A", "IND-A", "STU-1", "Math", "P1", "Alto", "", "", null]);
} });
assert.equal(racing.call({}).total, 4, "read uses the post-lock snapshot");

const missing = runtime({ missingEvaluationSheet: true });
assert.deepEqual(missing.call({}), { status: "success", total: 0, data: [] });
assert.equal(missing.sheets.EvaluacionesCompetencias, undefined, "read does not create a missing sheet");
assert.throws(() => runtime({ actor: { userId: "DUP", role: "Estudiante" } }).call({}), /RESOURCE_NOT_AVAILABLE/);
const badDate = runtime().call({}).data.find(row => row.evaluacionCompetenciaId === "EV-BAD-DATE");
assert.equal(badDate.fechaRegistro, null, "invalid legacy dates do not crash the endpoint");
const badSchema = runtime();
badSchema.sheets.EvaluacionesCompetencias.rows[0][0] = "Unexpected";
assert.throws(() => badSchema.call({}), /COMPETENCY_EVALUATION_SCHEMA_INVALID/);

process.stdout.write("exam-service-competency-evaluations-security: PASS (17 scenarios)\n");
