"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
const match = /function calculateUnifiedAcademicGrade\s*\(/.exec(source);
assert.ok(match, "missing calculateUnifiedAcademicGrade");
const open = source.indexOf("{", match.index);
let depth = 0, quote = "", escaped = false, line = false, block = false, end = -1;
for (let i = open; i < source.length; i++) {
  const c = source[i], n = source[i + 1];
  if (line) { if (c === "\n") line = false; continue; }
  if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
  if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
  if (c === "/" && n === "/") { line = true; i++; continue; }
  if (c === "/" && n === "*") { block = true; i++; continue; }
  if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
  if (c === "{") depth++;
  else if (c === "}" && --depth === 0) { end = i + 1; break; }
}
assert.ok(end > open, "unbalanced calculateUnifiedAcademicGrade");
const sandbox = {};
vm.runInNewContext(source.slice(match.index, end) + "\nthis.calculate = calculateUnifiedAcademicGrade;", sandbox);
const calculate = input => sandbox.calculate(input);
const base = { userId: "S1", asignaturaId: "MAT", periodoId: "P1" };
assert.equal(calculate({ ...base, actividades: [] }).status, "no_grade");
assert.equal(calculate({ ...base, actividades: [] }).notaFinal, null,
  "absence of activities must not be represented as a zero grade");
const zero = calculate({ ...base, actividades: [{ evaluacionId: "E1", notaObtenida: 0, porcentajePonderacion: 100 }] });
assert.equal(zero.status, "success");
assert.equal(zero.notaFinal, 0, "an explicit zero is a real evaluated grade");
const weighted = calculate({ ...base, actividades: [
  { evaluacionId: "E1", notaObtenida: 80, porcentajePonderacion: 60, categoria: "Tareas" },
  { evaluacionId: "E2", notaObtenida: 100, porcentajePonderacion: 40, categoria: "Exámenes" }
] });
assert.equal(weighted.notaFinal, 88);
const pending = calculate({ ...base, actividades: [
  { evaluacionId: "E1", notaObtenida: 80, porcentajePonderacion: 60 },
  { evaluacionId: "E2", estado: "PENDIENTE", notaObtenida: null, porcentajePonderacion: 40 }
] });
assert.equal(pending.status, "provisional");
assert.equal(pending.notaFinal, null);
assert.equal(pending.ponderacionPendiente, 40);
const exempt = calculate({ ...base, actividades: [
  { evaluacionId: "E1", estado: "EXENTO", notaObtenida: null, porcentajePonderacion: 50 },
  { evaluacionId: "E2", notaObtenida: 80, porcentajePonderacion: 50 }
] });
assert.equal(exempt.notaFinal, 80, "exempt activities are excluded rather than treated as zero");
assert.equal(exempt.ponderacionExenta, 50);
assert.equal(calculate({ ...base, actividades: [
  { evaluacionId: "E1", estado: "AUSENTE_JUSTIFICADO", porcentajePonderacion: 100 }
] }).status, "exempt");
const points = calculate({ ...base, metodoEvaluacion: "PuntosObtenidos", actividades: [
  { evaluacionId: "E1", notaObtenida: 90, puntosObtenidos: 45, puntosPosibles: 50, porcentajePonderacion: 100 }
] });
assert.equal(points.notaFinal, 90, "points calculation uses points obtained over possible points");
assert.throws(() => calculate({ ...base, actividades: [{ evaluacionId: "E1", notaObtenida: 50, porcentajePonderacion: -1 }] }), /ACADEMIC_GRADE_WEIGHT_INVALID/);
assert.throws(() => calculate({ ...base, actividades: [{ evaluacionId: "E1", notaObtenida: 50, porcentajePonderacion: 80 }] }), /ACADEMIC_GRADE_WEIGHTS_INVALID/);
assert.throws(() => calculate({ ...base, actividades: [{ evaluacionId: "E1", notaObtenida: "55x", porcentajePonderacion: 100 }] }), /ACADEMIC_GRADE_VALUE_INVALID/);
assert.throws(() => calculate({ ...base, metodoEvaluacion: "Other", actividades: [] }), /ACADEMIC_GRADE_METHOD_INVALID/);
assert.throws(() => calculate({ ...base, metodoEvaluacion: "PuntosObtenidos", actividades: [
  { evaluacionId: "E1", notaObtenida: 90, puntosObtenidos: 51, puntosPosibles: 50, porcentajePonderacion: 100 }
] }), /ACADEMIC_GRADE_POINTS_INVALID/);
process.stdout.write("academic-unified-grade-calculation: PASS (13/13)\n");
