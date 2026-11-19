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
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c.charCodeAt(0) === 96) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const headers = ["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID", "PeriodoID",
  "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro", "AnoID", "Grado",
  "Seccion", "InstitutionID", "DepartmentID", "CatalogItemID", "ContextKey"];
function norm(value) { return String(value == null ? "" : value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }
const sandbox = {
  COMPETENCY_EVALUATION_HEADERS_: headers,
  normalizeString: norm,
  getExamStudentProfile_: (ss, id) => id === "STU-1"
    ? { userId: id, role: "Estudiante", grado: "10", seccion: "A" } : null,
  getSheetOrThrow: (ss, name) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error("MISSING_" + name);
    return sheet;
  }
};
vm.runInNewContext(extract("competencyEvaluationContextKey_") + "\n" +
  extract("getCompetencyEvaluationsUnlocked_") + ";this.read=getCompetencyEvaluationsUnlocked_;", sandbox);
function row(id, patch = {}) {
  const item = Object.assign({ institutionId: "INST-A", departmentId: "DEPT-A", anoId: "2026",
    periodoId: "P1", grado: "10", seccion: "A", asignaturaId: "Math", userId: "STU-1",
    competenciaId: "COMP-1", indicadorId: "IND-1", catalogItemId: "CAT-1" }, patch);
  return [id, item.competenciaId, item.indicadorId, item.userId, item.asignaturaId, item.periodoId,
    "Alto", "", "", new Date("2026-01-01"), item.anoId, item.grado, item.seccion,
    item.institutionId, item.departmentId, item.catalogItemId,
    sandbox.competencyEvaluationContextKey_(item)];
}
function sheet(rows) { return { getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }) }; }
function fixture(options = {}) {
  const records = options.rows || [row("E-1"), row("E-OLD", { anoId: "2025" }),
    row("E-FOREIGN", { institutionId: "INST-B" }), row("E-OTHER-DEPT", { departmentId: "DEPT-B" }),
    row("E-OTHER-SECTION", { seccion: "B" }), row("E-OTHER-STUDENT", { userId: "STU-2" })];
  const sheets = {
    EvaluacionesCompetencias: sheet([headers, ...records]),
    ConfiguracionAcademica: sheet([
      ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"],
      ["CFG-1", "", "P1", "10", "A", "Math", "", "", "PROF-1"]
    ])
  };
  const ss = { getSheetByName: name => sheets[name] || null };
  return { sheets, ss, run: (actor, payload = {}, scope = {}) => sandbox.read(payload, {
    actor, ss, scope: Object.assign({ authorized: true, institutionId: "INST-A",
      departmentIds: [], institutionWide: false }, scope)
  }) };
}
const student = { userId: "STU-1", role: "Estudiante" };
let x = fixture();
let result = x.run(student, { anoId: "2026", periodoId: "P1", asignaturaId: "Math" });
assert.equal(result.total, 1);
assert.equal(result.data[0].evaluacionCompetenciaId, "E-1");
assert.equal(result.data[0].catalogItemId, "CAT-1");
assert.equal(result.data[0].anoId, "2026");
const corrupt = row("E-BAD");
corrupt[16] = "forged";
x = fixture({ rows: [corrupt] });
assert.equal(x.run(student, {}).total, 0, "invalid contextual keys are ignored");
const duplicate = row("E-DUP");
x = fixture({ rows: [duplicate, duplicate.slice()] });
assert.equal(x.run(student, {}).total, 0, "duplicate evaluation IDs are ignored");
x = fixture();
const teacher = { userId: "PROF-1", role: "Profesor" };
result = x.run(teacher, { userId: "STU-1", anoId: "2026", periodoId: "P1",
  asignaturaId: "Math", departmentId: "DEPT-A" }, { departmentIds: ["DEPT-A"] });
assert.equal(result.total, 1);
assert.throws(() => x.run(teacher, { userId: "STU-1", anoId: "2026", periodoId: "P1",
  asignaturaId: "Math", departmentId: "DEPT-B" }, { departmentIds: ["DEPT-A", "DEPT-B"] }),
  /RESOURCE_NOT_AVAILABLE/);
x = fixture();
const legacy = headers.slice(0, 10);
x.sheets.EvaluacionesCompetencias = sheet([legacy, ["OLD", "COMP", "IND", "STU-1", "Math", "P1", "Alto", "", "", new Date()]]);
assert.equal(x.run(student, {}).total, 0, "unscoped historical evaluations are not presented as contextual");
const malformed = fixture();
malformed.sheets.EvaluacionesCompetencias = sheet([["wrong"]]);
assert.throws(() => malformed.run(student, {}), /COMPETENCY_EVALUATION_SCHEMA_INVALID/);
process.stdout.write("exam-service-competency-evaluation-context: PASS (9 scenarios)\n");
