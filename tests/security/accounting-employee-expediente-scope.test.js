"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });
const start = source.indexOf("function assertEmployeeExpedienteScopeAccess_(");
assert.ok(start >= 0);
const end = source.indexOf("\nfunction ", start + 10);
const fn = source.slice(start, end < 0 ? source.length : end);
const rows = [
  ["ExpedienteID","UserId","Departamento"],
  ["EXP-1","EMP-1","DEP-A"],
  ["EXP-2","EMP-2","DEP-B"]
];
const sheet = { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
let actor = { authorized: true, userId: "EMP-1", role: "Empleado", institutionId: "INST-1" };
let scope = { valid: true, institutionWide: false, departmentIds: ["DEP-A"] };
const context = {
  getVerifiedAccountingIdentity_: () => actor,
  getVerifiedAccountingDepartmentScope_: () => scope
};
vm.runInNewContext(fn + "\nthis.check=assertEmployeeExpedienteScopeAccess_;", context);
const ss = { getSheetByName: name => name === "ExpedientesLaborales" ? sheet : null };
assert.deepEqual(JSON.parse(JSON.stringify(context.check({ sessionToken: "SELF" }, ss, "EXP-1"))),
  { authorized: true, accessType: "SELF" });
assert.equal(context.check({ sessionToken: "SELF" }, ss, "EXP-2").code, "RESOURCE_SCOPE_DENIED");
actor = { authorized: true, userId: "DIR-1", role: "Director", institutionId: "INST-1" };
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-1").accessType, "DEPARTMENT");
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-2").code, "RESOURCE_SCOPE_DENIED");
scope = { valid: true, institutionWide: true, departmentIds: [] };
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-2").accessType, "INSTITUTION");
scope = { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-1").code, "RESOURCE_SCOPE_DENIED");
actor = { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
assert.equal(context.check({ sessionToken: "FORGED" }, ss, "EXP-1").code, "VERIFIED_IDENTITY_REQUIRED");
actor = { authorized: true, userId: "DIR-1", role: "Director", institutionId: "INST-1" };
rows.push(["EXP-1","EMP-3","DEP-A"]);
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-1").code, "RESOURCE_SCOPE_DENIED",
  "duplicate expediente identifiers fail closed");
assert.equal(context.check({ sessionToken: "DIR" }, { getSheetByName: () => null }, "EXP-1").code, "RESOURCE_SCOPE_DENIED");
process.stdout.write("Accounting employee expediente scope: self, department, institution, invalid identity and duplicate-ID fail-closed checks PASS.\n");
