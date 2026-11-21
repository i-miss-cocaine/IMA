"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/task-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/task-service/Code.gs" });
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
const assignmentHeaders = ["AsignacionID","OfertaID","DocenteUserId","RolDocente","FechaInicio","FechaFin","Estado","AutorizadoPor","Motivo"];
const offerHeaders = ["OfertaID","AnoID","SedeID","Grado","Seccion","AsignaturaID","PlanID","Modalidad","CapacidadMax","Estado","CodigoClase"];
const subjectHeaders = ["AsignaturaID","NombreOficial","Codigo","Estado"];
const assignment = (id="ASG-1", offer="OFF-1", teacher="TEACHER-1", start="2020-01-01", end="2099-12-31", state="Activo") =>
  [id,offer,teacher,"Titular",start,end,state,"ADMIN-1",""];
const offer = (id="OFF-1", grade="6", section="A", subject="SUB-1", state="Activo") =>
  [id,"2026","",""+grade,""+section,subject,"PLAN-1","","",state,""];
function fixture(options={}) {
  const assignments = options.assignments || [assignment()];
  const offers = options.offers || [offer()];
  const subjects = options.subjects || [["SUB-1","Matemáticas","MATH","Activo"]];
  const sheets = {
    AsignacionesDocentes: options.missingAssignments ? null : { getDataRange: () => ({ getValues: () => [assignmentHeaders,...assignments].map(row=>row.slice()) }) },
    OfertaAcademica: options.missingOffers ? null : { getDataRange: () => ({ getValues: () => [offerHeaders,...offers].map(row=>row.slice()) }) },
    CatalogoAsignaturas: options.missingSubjects ? null : { getDataRange: () => ({ getValues: () => [subjectHeaders,...subjects].map(row=>row.slice()) }) }
  };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) },
    Date, String, Number, Object, Array, Error
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(source,"assertTaskServiceTeacherAssignedToOffer")+"\nthis.check=assertTaskServiceTeacherAssignedToOffer;",context);
  return { check: (classroom) => context.check("TEACHER-1","OFF-1",classroom) };
}
assert.equal(fixture().check({grade:"6",section:"A",subject:"Matemáticas"}),true,"active unique teacher assignment and offer allow matching classroom");
assert.throws(()=>fixture({offers:[offer("OFF-1"),offer("OFF-1")]}).check(),/ACADEMIC_OFFER_NOT_UNIQUE/);
assert.throws(()=>fixture({offers:[offer("OFF-1","6","B","SUB-1")]}).check({grade:"6",section:"A",subject:"Matemáticas"}),/TEACHER_ASSIGNMENT_OFFER_SCOPE_MISMATCH/);
assert.throws(()=>fixture({offers:[offer("OFF-1","6","A","SUB-1","Inactivo")]}).check(),/ACADEMIC_OFFER_NOT_ACTIVE_OR_INCOMPLETE/);
assert.throws(()=>fixture({assignments:[assignment("ASG-1"),assignment("ASG-2")]}).check(),/TEACHER_ASSIGNMENT_NOT_UNIQUE/);
assert.throws(()=>fixture({assignments:[assignment("ASG-1"),assignment("ASG-1","OFF-OTHER")]}).check(),/TEACHER_ASSIGNMENT_ID_AMBIGUOUS/);
assert.throws(()=>fixture({assignments:[assignment("ASG-1","OFF-1","TEACHER-1","2020-01-01","2020-12-31")]}).check(),/TEACHER_ASSIGNMENT_OUTSIDE_EFFECTIVE_WINDOW/);
assert.throws(()=>fixture({assignments:[assignment("ASG-1","OFF-1","TEACHER-1","2099-01-01","2099-12-31")]}).check(),/TEACHER_ASSIGNMENT_OUTSIDE_EFFECTIVE_WINDOW/);
assert.throws(()=>fixture({assignments:[assignment("ASG-1","OFF-1","TEACHER-1","bad-date","2099-12-31")]}).check(),/TEACHER_ASSIGNMENT_OUTSIDE_EFFECTIVE_WINDOW/);
assert.throws(()=>fixture({assignments:[assignment("ASG-1","OFF-1","TEACHER-1","2099-12-31","2020-01-01")]}).check(),/TEACHER_ASSIGNMENT_OUTSIDE_EFFECTIVE_WINDOW/);
assert.throws(()=>fixture({subjects:[["SUB-1","Matemáticas","MATH","Inactivo"]]}).check({grade:"6",section:"A",subject:"Matemáticas"}),/TEACHER_ASSIGNMENT_OFFER_SCOPE_MISMATCH/);
assert.throws(()=>fixture({subjects:[["SUB-1","Matemáticas","MATH","Activo"],["SUB-2","Matemáticas","MATH2","Activo"]]}).check({grade:"6",section:"A",subject:"Matemáticas"}),/TEACHER_ASSIGNMENT_OFFER_SCOPE_MISMATCH/);
assert.throws(()=>fixture({missingOffers:true}).check(),/TEACHER_ASSIGNMENT_SOURCE_UNAVAILABLE/);
assert.throws(()=>fixture({missingSubjects:true}).check({grade:"6",section:"A",subject:"Matemáticas"}),/ACADEMIC_SUBJECT_SOURCE_UNAVAILABLE/);
process.stdout.write("task-service-teacher-offer-abac-contract: all assertions passed\n");
