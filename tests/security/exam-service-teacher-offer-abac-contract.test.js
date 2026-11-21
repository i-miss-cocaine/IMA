"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/exam-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
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
const subjectHeaders=["AsignaturaID","NombreOficial","Codigo","Estado"];
const offerHeaders=["OfertaID","AnoID","SedeID","Grado","Seccion","AsignaturaID","PlanID","Modalidad","CapacidadMax","Estado","CodigoClase"];
const assignmentHeaders=["AsignacionID","OfertaID","DocenteUserId","RolDocente","FechaInicio","FechaFin","Estado","AutorizadoPor","Motivo"];
const subject=["SUB-1","Matemáticas","MATH","Activo"];
const offer=["OFF-1","2026","","6","A","SUB-1","PLAN-1","","","Activo",""];
const assignment=(id="ASG-1",start="2020-01-01",end="2099-12-31",state="Activo")=>[id,"OFF-1","TEACHER-1","Titular",start,end,state,"ADMIN-1",""];
function makeSheet(rows){return {getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())})};}
function fixture(options={}){
 const sheets={
  CatalogoAsignaturas:options.missingSubjects?null:makeSheet([subjectHeaders,...(options.subjects||[subject])]),
  OfertaAcademica:options.missingOffers?null:makeSheet([offerHeaders,...(options.offers||[offer])]),
  AsignacionesDocentes:options.missingAssignments?null:makeSheet([assignmentHeaders,...(options.assignments||[assignment()])])
 };
 const context={Date,String,Number,Object,Array,JSON};
 vm.createContext(context);
 vm.runInContext(extractFunction(source,"hasExamTeacherActiveOfferAssignment_")+"\nthis.check=hasExamTeacherActiveOfferAssignment_;",context);
 return exam=>context.check({getSheetByName:name=>sheets[name]||null},"TEACHER-1",exam||["EX-1","","Matemáticas","6","A"]);
}
assert.equal(fixture()(),true,"unique active teacher assignment and offer authorize matching exam context");
assert.equal(fixture({offers:[offer,offer]})(),false,"duplicate matching offers deny");
assert.equal(fixture({offers:[["OFF-1","2026","","6","A","SUB-1","PLAN-1","","","Inactivo",""]]})(),false,"inactive offer denies");
assert.equal(fixture({assignments:[assignment(),assignment("ASG-2")]})(),false,"multiple active assignments deny");
assert.equal(fixture({assignments:[assignment(),assignment("ASG-1","2020-01-01","2099-12-31","Inactivo")]})(),false,"duplicate assignment ID denies");
assert.equal(fixture({assignments:[assignment("ASG-1","2020-01-01","2020-12-31")]})(),false,"expired assignment denies");
assert.equal(fixture({assignments:[assignment("ASG-1","2099-01-01","2099-12-31")]})(),false,"future assignment denies");
assert.equal(fixture({assignments:[assignment("ASG-1","bad-date","2099-12-31")]})(),false,"invalid assignment date denies");
assert.equal(fixture({assignments:[assignment("ASG-1","2099-12-31","2020-01-01")]})(),false,"inverted assignment window denies");
assert.equal(fixture({subjects:[["SUB-1","Matemáticas","MATH","Inactivo"]]})(),false,"inactive subject denies");
assert.equal(fixture({subjects:[subject,["SUB-2","Matemáticas","MATH2","Activo"]]})(),false,"ambiguous subject reference denies");
assert.equal(fixture({missingOffers:true})(),false,"missing offer source denies");
assert.equal(fixture({missingAssignments:true})(),false,"missing assignment source denies");
assert.equal(fixture({missingSubjects:true})(),false,"missing subject source denies");
const activity=extractFunction(source,"getTeacherExamActivityUnlocked_");
assert.match(activity,/hasExamTeacherActiveOfferAssignment_\(ss, actor\.userId, exam\)/,"teacher activity endpoint enforces active offer assignment");
for (const [name, binding] of [
  ["getAuthorizedExamMutationContext_", "hasExamTeacherActiveOfferAssignment_(ss, actor.userId, exam.row)"],
  ["getStudentExamsUnlocked_", "hasExamTeacherActiveOfferAssignment_(ss, actor.userId, exam)"],
  ["getExamQuestionsUnlocked_", "hasExamTeacherActiveOfferAssignment_(ss, actor.userId, exam)"],
  ["getExamResultUnlocked_", "hasExamTeacherActiveOfferAssignment_(ss, actor.userId, exam)"],
  ["getAllExamsUnlocked_", "hasExamTeacherActiveOfferAssignment_(ss, actor.userId, row)"]
]) assert.ok(extractFunction(source, name).includes(binding), name + " enforces active teacher offer binding");
process.stdout.write("exam-service-teacher-offer-abac-contract: all assertions passed\n");
