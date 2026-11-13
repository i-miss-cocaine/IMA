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
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function makeSheet(rows) {
  return {
    rows,
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; }
  };
}

function runtime(options = {}) {
  const sheets = {
    Usuarios: makeSheet([
      ["UserID", "Nombre", "Grado", "Seccion", "Email", "RolLegacy", "Rol"],
      ["STU-1", "Estudiante Uno", "10", "A", "one@example.test", "", "Estudiante"],
      ["STU-2", "Estudiante Dos", "10", "B", "two@example.test", "", "Estudiante"],
      ["STU-3", "Sin sección", "10", "", "three@example.test", "", "Estudiante"],
      ["STU-D", "Duplicado A", "10", "A", "a@example.test", "", "Estudiante"],
      ["STU-D", "Duplicado B", "10", "A", "b@example.test", "", "Estudiante"]
    ]),
    ConfiguracionAcademica: makeSheet([
      ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"],
      ["CFG-1", new Date("2026-01-01"), "I parcial", "10", "A", "Matemáticas", "I unidad", "General", "PROF-1"],
      ["CFG-2", new Date("2026-01-02"), "I parcial", "10", "A", "Matemáticas", "I unidad", "Números", "PROF-1"],
      ["CFG-3", new Date("2026-01-03"), "I parcial", "10", "B", "Matemáticas", "I unidad", "General", "PROF-2"]
    ]),
    CalificacionesEstudiantes: makeSheet([
      ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado", "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"],
      ["CAL-1", "EV-1", "STU-1", 90, 90, false, true, "OK", new Date("2026-02-01")],
      ["CAL-2", "EV-2", "STU-2", 70, 70, false, true, "OTRA SECCIÓN", new Date("2026-02-01")],
      ["CAL-3", "EV-3", "STU-D", 60, 60, false, true, "ID ambiguo", new Date("2026-02-01")]
    ]),
    RecuperacionesEstudiante: makeSheet([
      ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada", "NotaFinal", "Metodo", "AutorizadoPor", "Fecha"],
      ["REC-1", "EV-1", "STU-1", 50, 80, 80, "Mayor", "PROF-1", new Date("2026-02-02")],
      ["REC-2", "EV-2", "STU-2", 40, 60, 60, "Mayor", "PROF-2", new Date("2026-02-02")]
    ]),
    CategoriasEvaluacion: makeSheet([["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"]]),
    CierresPeriodos: makeSheet([
      ["ID", "Fecha", "Parcial", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado"],
      ["CLOSE-1", new Date("2026-02-03"), "I parcial", "10", "A", "Matemáticas", "PROF-1", "Cerrado"]
    ])
  };
  if (options.missingSheet) delete sheets[options.missingSheet];
  const ss = { getSheetByName(name) { return sheets[name] || null; } };
  let held = false, acquires = 0, releases = 0;
  const actor = options.actor || { userId: "PROF-1", role: "Profesor" };
  const scope = options.scope || { authorized: true, institutionWide: false, departmentIds: ["DEP-1"] };
  const context = {
    LockService: { getScriptLock() { return {
      tryLock() {
        acquires++;
        if (options.beforeAcquire) { const callback = options.beforeAcquire; options.beforeAcquire = null; callback(); }
        if (options.lockAvailable === false || held) return false;
        held = true;
        return true;
      },
      releaseLock() { releases++; held = false; }
    }; } },
    validateRolePermission(action) {
      if (options.deniedAction === action) return { authorized: false };
      return { authorized: true };
    },
    getExamReadContext_() {
      if (options.contextError) throw new Error("RESOURCE_NOT_AVAILABLE");
      return { actor, ss, scope, studentActor: false, guardianActor: false, profile: null };
    },
    getSheetOrThrow(spreadsheet, name) {
      const sheet = spreadsheet.getSheetByName(name);
      if (!sheet) throw new Error("MISSING_SHEET");
      return sheet;
    },
    normalizeString(value) {
      return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }
  };
  const names = ["withAuthorizedExamRead_", "getAuthorizedExamReadContext_", "getGradebookData", "getGradebookDataUnlocked_"];
  vm.runInNewContext(names.map(extractFunction).join("\n") +
    "\nthis.getGradebookData = getGradebookData;", context);
  return { context, sheets, stats: () => ({ acquires, releases, held }) };
}

const teacher = runtime();
const teacherResult = teacher.context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
});
assert.deepEqual(Array.from(teacherResult.data.alumnos, row => row.userId), ["STU-1"],
  "teacher reads only the roster in their exact assigned grade/section");
assert.deepEqual(Array.from(teacherResult.data.calificaciones, row => row.calificacionId), ["CAL-1"],
  "grade rows are restricted to the authorized student roster");
assert.deepEqual(Array.from(teacherResult.data.recuperaciones, row => row.recuperacionId), ["REC-1"],
  "recovery rows are restricted to the authorized student roster");
assert.equal(teacherResult.data.estadoPeriodo, "Cerrado");
assert.equal(teacherResult.data.categories.length, 4, "default categories remain available without writing them");
assert.deepEqual(teacher.stats(), { acquires: 1, releases: 1, held: false });

assert.throws(() => runtime().context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-2", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /RESOURCE_NOT_AVAILABLE/, "client cannot impersonate a different professor");
assert.throws(() => runtime().context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "B",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /RESOURCE_NOT_AVAILABLE/, "teacher cannot read a class not assigned to them");
const conflictingAssignment = runtime();
conflictingAssignment.sheets.ConfiguracionAcademica.rows.push([
  "CFG-CONFLICT", new Date("2026-01-04"), "I parcial", "10", "A", "Matemáticas",
  "I unidad", "General", "PROF-2"
]);
assert.throws(() => conflictingAssignment.context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /RESOURCE_NOT_AVAILABLE/, "ambiguous class ownership fails closed when another teacher is assigned");
assert.throws(() => runtime().context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas"
}), /RESOURCE_NOT_AVAILABLE/, "teacher queries require a complete assignment context");

const admin = runtime({
  actor: { userId: "ADMIN-1", role: "Administrador" },
  scope: { authorized: true, institutionWide: true, departmentIds: [] }
});
const adminResult = admin.context.getGradebookData({ sessionToken: "admin" });
assert.equal(adminResult.data.alumnos.length, 3, "institution administrator can inspect the institutional roster excluding ambiguous IDs");
assert.equal(adminResult.data.calificaciones.length, 2, "institution view includes grade rows only for unique students");

assert.throws(() => runtime({
  actor: { userId: "ADMIN-1", role: "Administrador" },
  scope: { authorized: true, institutionWide: false, departmentIds: ["DEP-1"] }
}).context.getGradebookData({ sessionToken: "admin" }), /RESOURCE_NOT_AVAILABLE/,
"department-only administrator cannot read institution-wide gradebook data");

assert.throws(() => runtime({
  actor: { userId: "STU-1", role: "Estudiante" }
}).context.getGradebookData({ sessionToken: "student", userId: "STU-1" }), /RESOURCE_NOT_AVAILABLE/,
"students cannot use the teacher gradebook endpoint even if generic permission stubs allow it");

const denied = runtime({ deniedAction: "getGradebookData" });
assert.throws(() => denied.context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /RESOURCE_NOT_AVAILABLE/, "explicit RBAC denial is enforced");
assert.deepEqual(denied.stats(), { acquires: 1, releases: 1, held: false });

const timedOut = runtime({ lockAvailable: false });
assert.throws(() => timedOut.context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /EXAM_READ_LOCK_TIMEOUT/);
assert.deepEqual(timedOut.stats(), { acquires: 1, releases: 0, held: false });

const missingSchema = runtime({ actor: { userId: "PROF-1", role: "Profesor" } });
missingSchema.sheets.ConfiguracionAcademica = makeSheet([["wrong", "schema"]]);
assert.throws(() => missingSchema.context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /ACADEMIC_ASSIGNMENT_SCHEMA_INVALID/);

const afterLock = runtime({
  beforeAcquire() {
    afterLock.sheets.CalificacionesEstudiantes.rows[1][3] = 97;
  }
});
const afterLockResult = afterLock.context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
});
assert.equal(afterLockResult.data.calificaciones[0].notaObtenida, 97,
  "gradebook snapshot is collected after the shared read lock is acquired");
assert.deepEqual(afterLock.stats(), { acquires: 1, releases: 1, held: false });

assert.throws(() => runtime({ missingSheet: "CalificacionesEstudiantes" }).context.getGradebookData({
  sessionToken: "signed", profesorId: "PROF-1", grado: "10", seccion: "A",
  asignatura: "Matemáticas", parcial: "I parcial"
}), /MISSING_SHEET/, "missing grade storage fails closed rather than creating a sheet");

process.stdout.write("exam-service-gradebook-read-security: PASS\n");
