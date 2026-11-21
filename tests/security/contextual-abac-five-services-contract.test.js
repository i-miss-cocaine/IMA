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
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const services = [
  ["USER", "backend/user-service/Code.gs"],
  ["ACADEMIC", "backend/academic-service/Code.gs"],
  ["TASK", "backend/task-service/Code.gs"],
  ["EXAM", "backend/exam-service/Code.gs"]
];

for (const [service, path] of services) {
  const source = fs.readFileSync(path, "utf8");
  new vm.Script(source, { filename: path });
  const fn = extractFunction(source, "validateContextualAccess");
  const runtime = {
    getGuardianStudents: () => ({ data: [] }),
    SpreadsheetApp: { openById: () => ({}) },
    getVerifiedAcademicDepartmentScope_: () => ({ authorized: true, institutionWide: false, scopes: [] }),
    getAcademicAreaCoordinationScope: () => ({ status: "success", scopes: [] }),
    Date, Number, String, Object, Array
  };
  vm.createContext(runtime);
  vm.runInContext(fn + "\nthis.check = validateContextualAccess;", runtime);
  const check = runtime.check;
  assert.equal(check("read", {}, "", "Administrador").authorized, false, service + ": privileged role without verified identity must deny");
  assert.equal(check("read", {}, "U-1", "").authorized, false, service + ": missing role must deny");
  assert.equal(check("read", { studentId: "U-2" }, "", "Estudiante").authorized, false, service + ": target with missing identity must deny");
  assert.equal(check("read", { studentId: "U-2" }, "U-1", "Estudiante").authorized, false, service + ": cross-student access must deny");
  assert.equal(check("read", { studentId: "U-1" }, "U-1", "Estudiante").authorized, true, service + ": own-student access remains compatible");
  assert.equal(check("read", {}, "ADMIN-1", "Administrador").authorized, true, service + ": verified administrator retains access");
  assert.equal(check("read", {}, "DEV-1", "Desarrollador").authorized, true, service + ": verified developer retains access");
}

const userSource = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const userFn = extractFunction(userSource, "validateContextualAccess");
let guardianRequest = null;
const guardianRuntime = {
  getGuardianStudents(payload) {
    guardianRequest = payload;
    return { data: [{ studentUserId: "STUDENT-1", permisos: {} }] };
  },
  Date, Number, String, Object, Array
};
vm.createContext(guardianRuntime);
vm.runInContext(userFn + "\nthis.check = validateContextualAccess;", guardianRuntime);
const guardianDecision = guardianRuntime.check("getStudentRecords",
  { studentId: "STUDENT-1", sessionToken: "signed-token" }, "GUARDIAN-1", "Padre");
assert.equal(guardianDecision.authorized, true, "verified guardian can access a linked student");
assert.equal(guardianRequest.sessionToken, "signed-token", "guardian relationship lookup must carry the verified session");
assert.equal(guardianRequest._verifiedUserId, "GUARDIAN-1");
guardianRuntime.getGuardianStudents = () => ({ data: [] });
const unlinkedDecision = guardianRuntime.check("getStudentRecords",
  { studentId: "STUDENT-2", sessionToken: "signed-token" }, "GUARDIAN-1", "Tutor");
assert.equal(unlinkedDecision.authorized, false, "unlinked guardian-student relationship must deny");

assert.match(userSource,
  /getGuardianStudents\(\{ userIdResponsable: uid, sessionToken: payload && \(payload\.sessionToken \|\| payload\.authToken \|\| payload\.token\) \}\)/,
  "family consolidated summary must propagate the authenticated session to its relationship lookup");

const accountingSource = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
new vm.Script(accountingSource, { filename: "backend/accounting-service/Code.gs" });
const accountingIdentityFn = extractFunction(accountingSource, "getVerifiedAccountingIdentity_");
const accountingRuntime = {
  requestAccountingUserAuthorization_: () => ({
    status: "success", authorized: true, userId: "U-1", role: "Director", institutionId: "INST-1"
  }),
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_INSTITUTION_ID" ? "INST-1" : "" }) },
  String
};
vm.createContext(accountingRuntime);
vm.runInContext(accountingIdentityFn + "\nthis.resolve = getVerifiedAccountingIdentity_;", accountingRuntime);
assert.equal(accountingRuntime.resolve({}).authorized, false, "ACCOUNTING rejects missing session token");
assert.equal(accountingRuntime.resolve({ sessionToken: "token" }).authorized, true, "ACCOUNTING accepts a verified institution-bound identity");
accountingRuntime.requestAccountingUserAuthorization_ = () => ({
  status: "success", authorized: true, userId: "U-1", role: "Director", institutionId: "OTHER"
});
assert.equal(accountingRuntime.resolve({ sessionToken: "token" }).authorized, false, "ACCOUNTING rejects another institution");

process.stdout.write("contextual-abac-five-services-contract: all assertions passed\n");
