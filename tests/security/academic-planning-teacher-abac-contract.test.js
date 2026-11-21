"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
const helperCode = [
  extractFunction(source, "resolveAcademicSubjectIdForAuthorization_"),
  extractFunction(source, "hasActiveTeacherPlanningAssignment_")
].join("\n");

const subjectRows = [
  ["AsignaturaID","NombreOficial","Codigo","AreaAcademica","CargaHorariaRef","Estado","AreaID"],
  ["SUB-1","Matemáticas","MAT","Ciencias","","Activo","AREA-1"]
];
const offerRows = [
  ["OfertaID","AnoID","Grado","Seccion","AsignaturaID","PlanID","Estado"],
  ["OFF-1","2026","7","A","SUB-1","PLAN-1","Activa"]
];
const assignmentRows = [
  ["AsignacionID","OfertaID","DocenteUserId","FechaInicio","FechaFin","Estado"],
  ["ASG-1","OFF-1","TEACHER-1","2026-01-01","2099-12-31","Activo"]
];
function makeSheet(rows) {
  return { getLastRow: () => rows.length, getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
}
function runtime(options = {}) {
  const rows = {
    CatalogoAsignaturas: options.subjectRows || subjectRows,
    OfertaAcademica: options.offerRows || offerRows,
    AsignacionesDocentes: options.assignmentRows || assignmentRows
  };
  const ss = { getSheetByName(name) { return options.missing === name ? null : (rows[name] ? makeSheet(rows[name]) : null); } };
  const context = {
    Date, String, Number, Object, Array,
    getInstitutionalSubjectColumnMap_: () => ({ asignaturaId: 0, nombreOficial: 1, codigo: 2, areaAcademica: 3, estado: 5, areaId: 6 }),
    getAcademicOfferColumnMap: () => ({ ofertaId: 0, anoId: 1, grado: 2, seccion: 3, asignaturaId: 4, estado: 6, periodoId: -1 }),
    getAcademicOfferValue(row, map, key, fallback) {
      const i = map[key];
      return i === undefined || i < 0 || row[i] === "" || row[i] === null || row[i] === undefined ? fallback : row[i];
    },
    ss
  };
  vm.createContext(context);
  vm.runInContext(helperCode + "\nthis.check = hasActiveTeacherPlanningAssignment_;", context);
  return context;
}

let ctx = runtime();
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A", "1"), true,
  "active teacher assignment for the exact subject, grade and section must authorize");
assert.equal(ctx.check(ctx.ss, "TEACHER-2", "SUB-1", "7", "A"), false,
  "another teacher cannot inherit the assignment");
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-2", "7", "A"), false,
  "another subject is outside the assignment");
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "8", "A"), false,
  "another grade is outside the assignment");
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "B"), false,
  "another section is outside the assignment");
assert.equal(ctx.check(ctx.ss, "", "SUB-1", "7", "A"), false,
  "missing verified teacher identity must deny");
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "unknown", "7", "A"), false,
  "unresolved subject must deny");

ctx = runtime({ assignmentRows: [assignmentRows[0], assignmentRows[1], ["ASG-2","OFF-1","TEACHER-1","2026-01-01","2099-12-31","Activo"]] });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "duplicate active assignment must deny as ambiguous");
ctx = runtime({ assignmentRows: [assignmentRows[0], ["ASG-1","OFF-1","TEACHER-1","2099-01-01","2099-12-31","Activo"]] });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "future assignment must not authorize");
ctx = runtime({ assignmentRows: [assignmentRows[0], ["ASG-1","OFF-1","TEACHER-1","2020-01-01","2020-12-31","Activo"]] });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "expired assignment must not authorize");
ctx = runtime({ assignmentRows: [assignmentRows[0], ["ASG-1","OFF-1","TEACHER-1","not-a-date","2099-12-31","Activo"]] });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "malformed assignment dates must deny");
ctx = runtime({ assignmentRows: [assignmentRows[0], assignmentRows[1], ["ASG-2","OFF-1","TEACHER-1","2026-01-01","2099-12-31","Activo"]] });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "ambiguous assignment records must deny");
ctx = runtime({ missing: "AsignacionesDocentes" });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "unavailable assignment source must deny");
ctx = runtime({ missing: "OfertaAcademica" });
assert.equal(ctx.check(ctx.ss, "TEACHER-1", "SUB-1", "7", "A"), false,
  "unavailable offer source must deny");

for (const name of ["savePedagogicalPlanning", "getPedagogicalPlannings", "submitPlanningForReview", "getPlanningReviewHistory"]) {
  const body = extractFunction(source, name);
  assert.match(body, /hasActiveTeacherPlanningAssignment_/,
    name + " must enforce active teacher assignment");
}
assert.match(extractFunction(source, "savePedagogicalPlanning"), /verifiedRole === "Profesor" \? callerId/,
  "teacher identity must come from verified claims, not docenteUserId in payload");
assert.match(extractFunction(source, "getPlanningReviewHistory"), /matchingPlans\[0\]\[1\].*callerId/s,
  "teacher cannot read another owner's planning review history");

process.stdout.write("academic-planning-teacher-abac-contract: all assertions passed\n");
