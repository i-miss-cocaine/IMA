"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });

function extractFunction(name) {
  const match = new RegExp("function\\s+" + name + "\\s*\\(").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
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
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const userHeaders = ["UserId","Rol","PersonaID","Estado"];
const relationHeaders = ["RelacionID","PersonaEstudianteID","PersonaResponsableID","TipoRelacion","EstadoAutorizacion","FechaInicio","FechaFin","PermisoFinanciero","PermisosJSON"];
const student = ["STU-1","Estudiante","PERSON-STU-1","Activo"];
const sibling = ["STU-2","Estudiante","PERSON-STU-2","Activo"];
const guardian = ["GUARD-1","Tutor","PERSON-GUARD-1","Activo"];
const guardian2 = ["GUARD-2","Madre","PERSON-GUARD-2","Activo"];
const relation = (id, studentPerson, guardianPerson, state="Activo", start="2020-01-01", end="2099-12-31", direct=true, permissions='{"permisoFinanciero":true}') =>
  [id,studentPerson,guardianPerson,"Tutor",state,start,end,direct,permissions];
function sheet(rows) { return { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) }; }
function runtime(options={}) {
  const users = options.users || [student,sibling,guardian,guardian2];
  const relations = options.relations || [relation("REL-1","PERSON-STU-1","PERSON-GUARD-1"),relation("REL-2","PERSON-STU-2","PERSON-GUARD-1")];
  const sheets = {
    Usuarios: options.missingUsers ? null : sheet([userHeaders,...users]),
    RelacionesFamiliares: options.missingRelations ? null : sheet([relationHeaders,...relations])
  };
  const context = { Date,String,Number,Object,Array,Set,JSON };
  vm.createContext(context);
  const functions = ["institutionalServiceRoleKey_","serviceFamilyHeaderIndex_","serviceFamilyRelationIsActive_",
    "serviceStudentGuardianIds_","serviceSiblingCount_"].map(extractFunction).join("\n");
  vm.runInContext(functions + "\nthis.guardians=serviceStudentGuardianIds_;this.siblings=serviceSiblingCount_;",context);
  const ss = { getSheetByName: name => sheets[name] || null };
  return { guardians: id => context.guardians(ss,id), siblings: id => context.siblings(ss,id) };
}

assert.deepEqual(runtime().guardians("STU-1"),["PERSON-GUARD-1"],"unique active financial relation resolves one guardian person");
assert.equal(runtime().siblings("STU-1"),1,"sibling count includes a unique active financial relationship");
assert.deepEqual(runtime({missingRelations:true}).guardians("STU-1"),[],"missing relation source denies");
assert.deepEqual(runtime({missingUsers:true}).guardians("STU-1"),[],"missing user source denies");
assert.deepEqual(runtime({users:[student,student,guardian]}).guardians("STU-1"),[],"duplicate student account identity denies");
assert.deepEqual(runtime({users:[student,["STU-X","Estudiante","PERSON-STU-1","Activo"],guardian]}).guardians("STU-1"),[],"ambiguous student person mapping denies");
assert.deepEqual(runtime({users:[student,guardian,["GUARD-X","Tutor","PERSON-GUARD-1","Activo"]]}).guardians("STU-1"),[],"ambiguous guardian person mapping denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1"),relation("REL-1","PERSON-STU-1","PERSON-GUARD-1")]}).guardians("STU-1"),[],"duplicate relation ID denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1"),relation("REL-3","PERSON-STU-1","PERSON-GUARD-1")]}).guardians("STU-1"),[],"duplicate active student/guardian pair denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","2020-01-01","2020-12-31")]}).guardians("STU-1"),[],"expired relationship denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","2099-01-01","2099-12-31")]}).guardians("STU-1"),[],"future relationship denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","invalid","2099-12-31")]}).guardians("STU-1"),[],"malformed relationship date denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","2099-12-31","2020-01-01")]}).guardians("STU-1"),[],"inverted relationship window denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","2020-01-01","2099-12-31",false)]}).guardians("STU-1"),[],"direct financial permission false denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","2020-01-01","2099-12-31",true,'{"permisoFinanciero":false}')]}).guardians("STU-1"),[],"JSON financial permission false denies");
assert.deepEqual(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1","Activo","2020-01-01","2099-12-31",true,"{bad")]}).guardians("STU-1"),[],"malformed permissions JSON denies");
assert.equal(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1"),relation("REL-2","PERSON-STU-2","PERSON-GUARD-1","Activo","2020-01-01","2099-12-31",false)]}).siblings("STU-1"),0,"sibling without financial permission is not counted");
assert.equal(runtime({relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1"),relation("REL-1","PERSON-STU-2","PERSON-GUARD-1")]}).siblings("STU-1"),0,"duplicate sibling relation ID is not counted");
assert.equal(runtime({users:[student,["STU-X","Estudiante","PERSON-STU-2","Activo"],guardian],relations:[relation("REL-1","PERSON-STU-1","PERSON-GUARD-1"),relation("REL-2","PERSON-STU-2","PERSON-GUARD-1")]}).siblings("STU-1"),0,"ambiguous sibling person mapping is not counted");

process.stdout.write("accounting-family-service-guardian-abac-contract: 18 assertions passed\n");
