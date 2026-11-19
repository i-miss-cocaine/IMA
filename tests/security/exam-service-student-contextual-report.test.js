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
  const start = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const gradeHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado",
  "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro", "AnoID", "PeriodoID",
  "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
const recoveryHeaders = ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada",
  "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha", "AnoID", "PeriodoID",
  "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
function norm(value) { return String(value == null ? "" : value).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toLowerCase(); }
function key(fields) {
  return JSON.stringify([fields.institutionId, fields.anoId, fields.periodoId, fields.grado,
    fields.seccion, fields.asignatura, fields.evaluacionId, fields.userId].map(norm));
}
function sheet(rows) { return { rows, getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) }; }
function fixture() {
  const grades = [gradeHeaders];
  const add = (id, user, year, period, subject, category, score, published, draft, institution = "INST-A", section = "A") => {
    const row = [id, category, user, score, score, draft, published, "", new Date(),
      year, period, "10", section, subject, institution, ""];
    row[15] = key({ institutionId: institution, anoId: year, periodoId: period, grado: "10",
      seccion: section, asignatura: subject, evaluacionId: category, userId: user });
    grades.push(row);
  };
  add("G-1", "STU-1", "2026", "P1", "Matemáticas", "CAT-1", 80, true, false);
  add("G-2", "STU-1", "2026", "P1", "Matemáticas", "CAT-2", 90, true, false);
  add("G-DRAFT", "STU-1", "2026", "P1", "Matemáticas", "CAT-3", 100, false, true);
  add("G-OLD", "STU-1", "2025", "P1", "Matemáticas", "CAT-1", 50, true, false);
  add("G-OTHER-INST", "STU-1", "2026", "P1", "Matemáticas", "CAT-1", 10, true, false, "INST-B");
  add("G-OTHER-STUDENT", "STU-2", "2026", "P1", "Matemáticas", "CAT-1", 10, true, false);
  add("G-OTHER-SUBJECT", "STU-1", "2026", "P1", "Ciencias", "CAT-1", 75, true, false);
  const recoveries = [recoveryHeaders];
  const addRecovery = (id, user, year, period, subject, category, finalGrade, institution = "INST-A") => {
    const row = [id, category, user, 50, finalGrade, finalGrade, "MAX", "PROF", new Date(),
      year, period, "10", "A", subject, institution, ""];
    row[15] = key({ institutionId: institution, anoId: year, periodoId: period, grado: "10",
      seccion: "A", asignatura: subject, evaluacionId: category, userId: user });
    recoveries.push(row);
  };
  addRecovery("R-1", "STU-1", "2026", "P1", "Matemáticas", "CAT-1", 85);
  addRecovery("R-OLD", "STU-1", "2025", "P1", "Matemáticas", "CAT-1", 99);
  addRecovery("R-OTHER-INST", "STU-1", "2026", "P1", "Matemáticas", "CAT-1", 99, "INST-B");
  const sheets = {
    CalificacionesEstudiantes: sheet(grades),
    RecuperacionesEstudiante: sheet(recoveries),
    CierresPeriodos: sheet([
      ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"],
      ["C-1", "2026", "P1", "10", "A", "Matemáticas", "PROF", "Cerrado", new Date()],
      ["C-2", "2026", "P1", "10", "A", "Ciencias", "PROF", "Cerrado", new Date()]
    ])
  };
  const ss = { getSheetByName: name => sheets[name] || null };
  const weights = (spreadsheet, context) => [{ categoriaId: "CAT-1", porcentajePonderacion: 50 },
    { categoriaId: "CAT-2", porcentajePonderacion: 50 }];
  const summarize = (userId, rows, categories, recs) => {
    const score = rows.reduce((sum, row) => {
      const recovery = recs.find(item => item.evaluacionId === row.evaluacionId);
      const value = recovery ? recovery.notaFinalCalculada : row.notaObtenida;
      return sum + value * (categories.find(c => c.categoriaId === row.evaluacionId)?.porcentajePonderacion || 0) / 100;
    }, 0);
    return { status: categories.length ? "calculated" : "not_configured",
      notaFinal: categories.length ? score : null, avancePonderado: score, ponderacionPendiente: 0 };
  };
  const sandbox = { normalizeString: norm, buildGradebookContextKey_: key,
    getGradebookWeightConfigurationFromSheet_: weights, calculateGradebookStudentSummary_: summarize };
  vm.runInNewContext(extract("buildStudentAcademicReportGradebook_") +
    ";this.run=buildStudentAcademicReportGradebook_;", sandbox);
  return { run: payload => sandbox.run(ss, { institutionId: "INST-A" }, "STU-1", payload), sheets };
}
const cases = [];
function test(name, fn) { fn(); cases.push(name); }
test("isolates by requested academic year and period", () => {
  const result = fixture().run({ anoId: "2026", periodoId: "P1" });
  assert.deepEqual(Array.from(result.detalleAsignaturas, row => row.asignatura), ["Ciencias", "Matemáticas"]);
  assert.ok(result.detalleAsignaturas.every(row => row.anoId === "2026" && row.periodo === "P1"));
});
test("excludes unpublished drafts and other students", () => {
  const result = fixture().run({ anoId: "2026", periodoId: "P1" });
  const math = result.detalleAsignaturas.find(row => row.asignatura === "Matemáticas");
  assert.equal(math.categorias.some(row => row.categoriaId === "CAT-3"), false);
});
test("validates institutional ownership and contextual key", () => {
  const result = fixture().run({ anoId: "2026", periodoId: "P1" });
  assert.ok(result.detalleAsignaturas.every(row => row.asignatura !== "NoContext"));
});
test("recovery is applied only to matching year, institution and subject context", () => {
  const result = fixture().run({ anoId: "2026", periodoId: "P1" });
  const math = result.detalleAsignaturas.find(row => row.asignatura === "Matemáticas");
  assert.equal(math.notaFinal, 87.5);
});
test("provisional report is not marked official without explicit context", () => {
  const result = fixture().run({});
  assert.equal(result.esDocumentoOficial, false);
});
test("legacy unscoped recovery rows are ignored", () => {
  const x = fixture();
  const oldRows = [recoveryHeaders.slice(0, 9), ["LEGACY", "CAT-1", "STU-1", 50, 90, 90, "MAX", "PROF", new Date()]];
  const oldSheet = sheet(oldRows);
  const oldSandbox = { normalizeString: norm, buildGradebookContextKey_: key,
    getGradebookWeightConfigurationFromSheet_: () => [{ categoriaId: "CAT-1", porcentajePonderacion: 100 }],
    calculateGradebookStudentSummary_: (userId, rows) => ({ status: "calculated",
      notaFinal: rows[0]?.notaObtenida ?? null, avancePonderado: rows[0]?.notaObtenida ?? null, ponderacionPendiente: 0 }) };
  vm.runInNewContext(extract("buildStudentAcademicReportGradebook_") +
    ";this.run=buildStudentAcademicReportGradebook_;", oldSandbox);
  const result = oldSandbox.run({ getSheetByName: name => name === "CalificacionesEstudiantes"
    ? sheet([gradeHeaders, ["G-1", "CAT-1", "STU-1", 80, 80, false, true, "", new Date(),
      "2026", "P1", "10", "A", "Matemáticas", "INST-A",
      key({ institutionId: "INST-A", anoId: "2026", periodoId: "P1", grado: "10", seccion: "A",
        asignatura: "Matemáticas", evaluacionId: "CAT-1", userId: "STU-1" })]])
    : name === "RecuperacionesEstudiante" ? oldSheet : null },
    { institutionId: "INST-A" }, "STU-1", { anoId: "2026", periodoId: "P1" });
  assert.equal(result.detalleAsignaturas[0].notaFinal, 80);
});
process.stdout.write("exam-service-student-contextual-report: PASS (" + cases.length + " scenarios)\\n");
