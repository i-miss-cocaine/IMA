"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
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
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
function makeRuntime(overrides = {}) {
  return Object.assign({
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById() { return {}; } },
    getVerifiedAcademicDepartmentScope_() {
      return { authorized: true, institutionWide: false, scopes: [{ scopeType: "DEPARTAMENTO", scopeValues: ["D-1"] }] };
    },
    getAcademicAreaCoordinationScope() {
      return { status: "success", scopes: [{
        userId: "COORD-1", areaId: "AREA-1",
        ambitoSupervision: { areaId: "AREA-1", tipoCoordinacion: "Titular", fechaInicio: "2026-01-01", fechaFin: "2026-12-31" }
      }] };
    },
    Date, Number, String, Object, Array
  }, overrides);
}
const code = extractFunction(source, "validateContextualAccess");
function run(payload, userId, role, overrides) {
  const runtime = makeRuntime(overrides);
  vm.createContext(runtime);
  vm.runInContext(code + "\nthis.check = validateContextualAccess;", runtime);
  return runtime.check("testAction", payload || {}, userId, role);
}
assert.equal(run({ studentId: "STUDENT-2" }, "STUDENT-1", "Estudiante").authorized, false,
  "students cannot address another student's resource");
assert.equal(run({ scopeType: "DEPARTAMENTO" }, "U-1", "Profesor").authorized, false,
  "partial scope context must fail closed");
assert.equal(run({ requestedValue: "D-1" }, "U-1", "Profesor").authorized, false,
  "missing scope type must fail closed");
assert.equal(run({ scopeType: "DEPARTAMENTO", requestedValue: "D-1" }, "U-1", "Profesor").authorized, true);
assert.equal(run({ scopeType: "DEPARTAMENTO", requestedValue: "D-2" }, "U-1", "Profesor").authorized, false,
  "out-of-scope department must be denied");
assert.equal(run({ scopeType: "DEPARTAMENTO", requestedValue: "D-1" }, "U-1", "Profesor", {
  getVerifiedAcademicDepartmentScope_() { throw new Error("sheet unavailable"); }
}).authorized, false, "scope lookup exceptions must fail closed");
assert.equal(run({ areaId: "AREA-1" }, "COORD-1", "Coordinador").authorized, true);
assert.equal(run({ areaId: "AREA-2" }, "COORD-1", "Coordinador").authorized, false,
  "coordinator cannot use a different area");
assert.equal(run({ areaId: "AREA-1" }, "COORD-1", "Coordinador", {
  getAcademicAreaCoordinationScope() { return { status: "success", scopes: [] }; }
}).authorized, false, "missing coordination assignment must deny");
assert.equal(run({ areaId: "AREA-1" }, "COORD-1", "Coordinador", {
  getAcademicAreaCoordinationScope() { return { status: "success", scopes: [{ userId: "COORD-1", areaId: "AREA-1", ambitoSupervision: {} }] }; }
}).authorized, false, "malformed supervision attributes must deny");
assert.equal(run({ areaId: "AREA-1" }, "COORD-1", "Coordinador", {
  getAcademicAreaCoordinationScope() { return { status: "success", scopes: [{ userId: "COORD-1", areaId: "AREA-1", ambitoSupervision: { areaId: "AREA-1", tipoCoordinacion: "Titular", fechaInicio: "bad-date" } }] }; }
}).authorized, false, "invalid assignment dates must deny");
assert.equal(run({ areaId: "AREA-1" }, "COORD-1", "Coordinador", {
  getAcademicAreaCoordinationScope() { throw new Error("coordination sheet unavailable"); }
}).authorized, false, "coordination lookup exceptions must fail closed");
process.stdout.write("contextual-abac-policy-contract: all isolated assertions passed\\n");
