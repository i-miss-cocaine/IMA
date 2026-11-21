"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
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
  throw new Error("unclosed " + name);
}

const taskSource = fs.readFileSync("backend/task-service/Code.gs", "utf8");
const examSource = fs.readFileSync("backend/exam-service/Code.gs", "utf8");
new vm.Script(taskSource, { filename: "backend/task-service/Code.gs" });
new vm.Script(examSource, { filename: "backend/exam-service/Code.gs" });

const expedienteRows = [["ExpedienteID","UserID"],["EXP-1","STUDENT-1"],["EXP-2","STUDENT-2"]];
const relation = permission => ["REL-1","EXP-1","GUARD-1","Madre","ACTIVA","2020-01-01","2099-12-31","",permission];

function taskLookup(relationRows) {
  const sheets = {
    ExpedientesEstudiantes: { getDataRange: () => ({ getValues: () => expedienteRows.map(row => row.slice()) }) },
    RelacionesFamiliares: { getDataRange: () => ({ getValues: () => [["RelacionID","ExpedienteID","ResponsableID","Tipo","Estado","Inicio","Fin","Notas","PermisosJSON"], ...relationRows].map(row => row.slice()) }) }
  };
  const context = { SPREADSHEET_ID: "TEST", SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) }, Date, String, Number, Object, Array };
  vm.createContext(context);
  vm.runInContext(extractFunction(taskSource, "getTaskServiceGuardianStudentIds") + "\nthis.lookup=getTaskServiceGuardianStudentIds;", context);
  return Array.from(context.lookup("GUARD-1"));
}

function examLookup(relationRows) {
  const sheets = {
    ExpedientesEstudiantes: { getDataRange: () => ({ getValues: () => expedienteRows.map(row => row.slice()) }) },
    RelacionesFamiliares: { getDataRange: () => ({ getValues: () => [["RelacionID","ExpedienteID","ResponsableID","Tipo","Estado","Inicio","Fin","Notas","PermisosJSON"], ...relationRows].map(row => row.slice()) }) }
  };
  const context = { Date, String, Number, Object, Array, JSON };
  vm.createContext(context);
  vm.runInContext(extractFunction(examSource, "getVerifiedGuardianStudentIds_") + "\nthis.lookup=getVerifiedGuardianStudentIds_;", context);
  return Array.from(context.lookup({ getSheetByName: name => sheets[name] || null }, "GUARD-1"));
}

for (const [label, permission, expected] of [
  ["explicit true", '{"permisoAcademico":true}', ["STUDENT-1"]],
  ["false", '{"permisoAcademico":false}', []],
  ["missing property", '{}', []],
  ["missing JSON", '', []],
  ["string true", '{"permisoAcademico":"true"}', []],
  ["numeric true", '{"permisoAcademico":1}', []],
  ["malformed JSON", '{bad-json', []]
]) {
  assert.deepEqual(taskLookup([relation(permission)]), expected, "TASK " + label);
  assert.deepEqual(examLookup([relation(permission)]), expected, "EXAM " + label);
}
assert.deepEqual(taskLookup([relation('{"permisoAcademico":true}'), relation('{"permisoAcademico":true}')]), [], "TASK duplicate relation/student mapping denies");
assert.deepEqual(examLookup([relation('{"permisoAcademico":true}'), relation('{"permisoAcademico":true}')]), [], "EXAM duplicate relation/student mapping denies");


function contextualDecision(source, helperName, service) {
  const helper = extractFunction(source, helperName);
  const contextual = extractFunction(source, "validateContextualAccess");
  const spreadsheet = {
    getSheetByName: name => name === "ExpedientesEstudiantes"
      ? { getDataRange: () => ({ getValues: () => expedienteRows.map(row => row.slice()) }) }
      : (name === "RelacionesFamiliares"
        ? { getDataRange: () => ({ getValues: () => [["RelacionID","ExpedienteID","ResponsableID","Tipo","Estado","Inicio","Fin","Notas","PermisosJSON"], relation('{"permisoAcademico":true}')].map(row => row.slice()) }) }
        : null)
  };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => spreadsheet },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(context);
  vm.runInContext(helper + "\n" + contextual + "\nthis.check=validateContextualAccess;", context);
  return context.check;
}
const taskContext = contextualDecision(taskSource, "getTaskServiceGuardianStudentIds", "TASK");
const examContext = contextualDecision(examSource, "getVerifiedGuardianStudentIds_", "EXAM");
for (const [name, check] of [["TASK", taskContext], ["EXAM", examContext]]) {
  assert.equal(check("getStudentResource", { estudianteUserId: "STUDENT-1" }, "GUARD-1", "Tutor").authorized, true,
    name + " contextual guard accepts explicit guardian academic permission");
  assert.equal(check("getStudentResource", { targetStudentUserId: "STUDENT-2" }, "GUARD-1", "Tutor").authorized, false,
    name + " contextual guard rejects unlinked target");
  assert.equal(check("getStudentResource", { studentUserId: "STUDENT-2" }, "STUDENT-1", "Estudiante").authorized, false,
    name + " contextual guard rejects alternate-selector IDOR");
  assert.equal(check("getStudentResource", { targetStudentId: "STUDENT-1" }, "STUDENT-1", "Estudiante").authorized, true,
    name + " contextual guard preserves self access");
  assert.equal(check("getStudentResource", { expedienteId: "EXP-1", userId: "GUARD-1" }, "GUARD-1", "Tutor").authorized, true,
    name + " contextual guard resolves an expediente to its linked student");
  assert.equal(check("getStudentResource", { expedienteId: "EXP-2" }, "GUARD-1", "Tutor").authorized, false,
    name + " contextual guard rejects an expediente belonging to an unlinked student");

}


function examLegacyLookup() {
  const legacyRows = [
    ["RelacionID","ExpedienteID","ResponsableID","","","","","","Portal","Estado"],
    ["LEG-1","STUDENT-1","GUARD-1","","","","","","SI","ACTIVA"]
  ];
  const sheets = {
    ExpedientesEstudiantes: { getDataRange: () => ({ getValues: () => [["ExpedienteID","UserID"]] }) },
    RelacionesFamiliares: { getDataRange: () => ({ getValues: () => [["RelacionID","ExpedienteID","ResponsableID","Tipo","Estado","Inicio","Fin","Notas","PermisosJSON"]] }) },
    RelacionesEstudianteTutor: { getDataRange: () => ({ getValues: () => legacyRows.map(row => row.slice()) }) }
  };
  const context = { Date, String, Number, Object, Array, JSON };
  vm.createContext(context);
  vm.runInContext(extractFunction(examSource, "getVerifiedGuardianStudentIds_") + "\nthis.lookup=getVerifiedGuardianStudentIds_;", context);
  return Array.from(context.lookup({ getSheetByName: name => sheets[name] || null }, "GUARD-1"));
}
assert.deepEqual(examLegacyLookup(), [], "EXAM legacy relationship without explicit academic-domain permission denies");
assert.deepEqual(taskLookup([relation('{"permisoAcademico":true}')]), ["STUDENT-1"], "TASK reads the current academic grant");
assert.deepEqual(taskLookup([relation('{"permisoAcademico":false}')]), [], "TASK re-evaluates a revoked grant on the next request");
assert.deepEqual(examLookup([relation('{"permisoAcademico":true}')]), ["STUDENT-1"], "EXAM reads the current academic grant");
assert.deepEqual(examLookup([relation('{"permisoAcademico":false}')]), [], "EXAM re-evaluates a revoked grant on the next request");

process.stdout.write("task-exam-guardian-academic-permission-contract: all assertions passed\\n");
