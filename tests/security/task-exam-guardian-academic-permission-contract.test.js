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

const expedienteRows = [["ExpedienteID","UserID"],["EXP-1","STUDENT-1"]];
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

process.stdout.write("task-exam-guardian-academic-permission-contract: 16 assertions passed\n");
