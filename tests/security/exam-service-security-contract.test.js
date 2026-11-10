const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });

function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

const publicActionsSource = source.match(/const PUBLIC_ACTIONS = \[[\s\S]*?\];/);
assert.ok(publicActionsSource, "PUBLIC_ACTIONS declaration exists");
const publicActions = vm.runInNewContext(publicActionsSource[0] + "\nPUBLIC_ACTIONS");
assert.equal(publicActions.includes("getAllExams"), false, "exam listings must not bypass authentication");
assert.equal(publicActions.includes("getStudentExams"), false, "student exam listings must not bypass authentication");

const claims = {
  "teacher-session": { userId: "TEACHER-1", role: "Profesor" },
  "student-session": { userId: "STUDENT-1", role: "Estudiante" }
};
const runtime = {
  PUBLIC_ACTIONS: publicActions,
  ROLE_PERMISSIONS: {
    Profesor: ["getAllExams"],
    Estudiante: ["getStudentExams"]
  },
  verifySessionToken(token) { return claims[token] || null; },
  getDynamicPermissionsForRole() { return null; },
  hasActiveDelegationForAction() { return false; },
  Logger: { log() {} }
};
const contextual = extractFunction(source, "validateContextualAccess");
const permission = extractFunction(source, "validateRolePermission");
vm.runInNewContext(contextual + "\n" + permission +
  "\nthis.validate = validateRolePermission;", runtime);

for (const action of ["getAllExams", "getStudentExams"]) {
  assert.equal(runtime.validate(action, {}).authorized, false, action + " rejects missing session");
  assert.equal(runtime.validate(action, { sessionToken: "invalid" }).authorized, false, action + " rejects invalid session");
}
const teacherPayload = { sessionToken: "teacher-session", userId: "ATTACKER" };
assert.equal(runtime.validate("getAllExams", teacherPayload).authorized, true);
assert.equal(teacherPayload._verifiedUserId, "TEACHER-1", "identity is derived from signed claims");
assert.equal(teacherPayload.userId, "ATTACKER", "client value remains untrusted and is not promoted");
const ownStudent = { sessionToken: "student-session", userId: "STUDENT-1" };
assert.equal(runtime.validate("getStudentExams", ownStudent).authorized, true);
const otherStudent = { sessionToken: "student-session", userId: "STUDENT-2" };
assert.equal(runtime.validate("getStudentExams", otherStudent).authorized, false, "student cannot request another student's exams");
process.stdout.write("exam-service-security-contract: authentication and student identity assertions passed\n");
