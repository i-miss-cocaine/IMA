"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
function extractFunction(name) {
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

function makeScopeHarness(options) {
  const settings = Object.assign({
    scopeValid: true, institutionWide: true, deniedIds: []
  }, options || {});
  const calls = { ownership: [], scopes: 0 };
  const rows = [
    ["ExpedienteID", "UserId", "Estado"],
    ["EMP-1", "EMPUSER-1", "Activo"],
    ["EMP-2", "EMPUSER-2", "Activo"]
  ];
  const sheet = { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
  const ss = { getSheetByName: name => name === "ExpedientesLaborales" ? sheet : null };
  const runtime = {
    getVerifiedAccountingDepartmentScope_: () => {
      calls.scopes++;
      return settings.scopeValid
        ? { valid: true, authorized: true, institutionId: "INST-1", institutionWide: settings.institutionWide, departmentIds: [] }
        : { valid: false, authorized: false, code: "DEPARTMENT_SCOPE_UNVERIFIED" };
    },
    assertResourceOwnershipForScope_: (spreadsheet, scope, resourceType, resourceId, operation) => {
      calls.ownership.push({ resourceType, resourceId, operation });
      return { authorized: settings.deniedIds.indexOf(resourceId) === -1, code: "RESOURCE_SCOPE_DENIED" };
    },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(extractFunction("assertPayrollInstitutionWriteScope_") + "\nthis.run = assertPayrollInstitutionWriteScope_;", runtime);
  return { run: runtime.run, calls, ss, rows };
}

const valid = makeScopeHarness();
assert.equal(valid.run({ sessionToken: "token" }, valid.ss, { userId: "HR-1" }, valid.rows.slice(1)), true);
assert.deepEqual(valid.calls.ownership.map(x => [x.resourceType, x.resourceId, x.operation]), [
  ["EXPEDIENTE_LABORAL", "EMP-1", "WRITE"], ["EXPEDIENTE_LABORAL", "EMP-2", "WRITE"]
]);

const invalidScope = makeScopeHarness({ scopeValid: false });
assert.throws(() => invalidScope.run({}, invalidScope.ss, {}, invalidScope.rows.slice(1)), /DEPARTMENT_SCOPE_UNVERIFIED/);
assert.equal(invalidScope.calls.ownership.length, 0);

const departmentOnly = makeScopeHarness({ institutionWide: false });
assert.throws(() => departmentOnly.run({}, departmentOnly.ss, {}, departmentOnly.rows.slice(1)), /PAYROLL_INSTITUTION_SCOPE_REQUIRED/);
assert.equal(departmentOnly.calls.ownership.length, 0);

const deniedEmployee = makeScopeHarness({ deniedIds: ["EMP-2"] });
assert.throws(() => deniedEmployee.run({}, deniedEmployee.ss, {}, deniedEmployee.rows.slice(1)), /RESOURCE_SCOPE_DENIED/);
assert.equal(deniedEmployee.calls.ownership.length, 2);

function assertPayrollActionDenied(name, payload) {
  const runtime = {
    requirePayrollConceptManager_: () => ({ authorized: false, code: "ROLE_NOT_ALLOWED" }),
    LockService: { getScriptLock: () => ({ waitLock: () => { throw new Error("lock must not be acquired before role authorization"); } }) },
    Date, String, Number, Object, Array, JSON, Math
  };
  vm.createContext(runtime);
  vm.runInContext(extractFunction(name) + "\nthis.run = " + name + ";", runtime);
  assert.throws(() => runtime.run(payload), /ROLE_NOT_ALLOWED/);
}
assertPayrollActionDenied("calculatePayrollPeriod", { periodoMes: "2027-01" });
assertPayrollActionDenied("calculateExtraordinaryPayroll", { tipoBeneficio: "DecimoTercerMes", anoLectivo: "2027" });

console.log("accounting-payroll-generation-authorization: all assertions passed");
