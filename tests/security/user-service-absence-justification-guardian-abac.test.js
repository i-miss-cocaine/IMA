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

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const contextual = extractFunction(source, "validateContextualAccess");
const handler = extractFunction(source, "getStudentAbsenceJustifications");

function createHarness(options) {
  const settings = Object.assign({ permission: true, matches: 1, role: "Tutor", target: "STU-1" }, options || {});
  const calls = { guardianLookups: 0, requestQueries: [] };
  const guardianStudent = {
    studentUserId: "STU-1",
    userId: "STU-1",
    expedienteEstudianteId: "EXP-1",
    permisos: { permisoAsistencia: settings.permission === true }
  };
  const context = {
    getGuardianStudents: () => {
      calls.guardianLookups++;
      return { status: "success", data: Array.from({ length: settings.matches }, () => guardianStudent) };
    },
    getGuardianPermissionKeyForAction_: action => action === "getStudentAbsenceJustifications" ? "permisoAsistencia" : "",
    getUserVerifiedRole: payload => {
      payload._verifiedUserId = settings.actorId || (settings.role === "Estudiante" ? "STU-1" : "TUTOR-1");
      return settings.role;
    },
    getAdministrativeRequests: query => {
      calls.requestQueries.push(query);
      const rows = [
        { tipoTramite: "Justificación de Ausencia", solicitudId: "JUST-1", estudianteId: "STU-1" },
        { tipoTramite: "Constancia", solicitudId: "REQ-2", estudianteId: "STU-1" },
        { tipoTramite: "Justificación de Ausencia", solicitudId: "JUST-OTHER", estudianteId: "STU-2" }
      ];
      return { status: "success", data: rows.filter(row => !query.estudianteId || row.estudianteId === query.estudianteId) };
    }
  };
  vm.runInNewContext(contextual + "\n" + handler +
    "\nthis.validate = validateContextualAccess; this.read = getStudentAbsenceJustifications;", context);
  return { context, calls, validate: context.validate, read: context.read };
}

const allowed = createHarness();
const payload = { estudianteId: "STU-1", sessionToken: "signed", _verifiedGuardianStudent: { studentUserId: "ATTACKER" } };
const access = allowed.validate("getStudentAbsenceJustifications", payload, "TUTOR-1", "Tutor");
assert.equal(access.authorized, true);
assert.deepEqual(JSON.parse(JSON.stringify(payload._verifiedGuardianStudent)), { studentUserId: "STU-1", expedienteId: "EXP-1" });
const result = allowed.read(payload);
assert.equal(result.status, "success");
assert.deepEqual(Array.from(result.justificantes, row => row.solicitudId), ["JUST-1"]);
assert.equal(allowed.calls.guardianLookups, 1, "the verified guardian/student binding is reused by the handler");
assert.equal(allowed.calls.requestQueries[0].userId, "TUTOR-1");
assert.equal(allowed.calls.requestQueries[0].estudianteId, "STU-1");

const missingTarget = createHarness();
const missingPayload = { sessionToken: "signed", _verifiedGuardianStudent: { studentUserId: "STU-1" } };
assert.equal(missingTarget.validate("getStudentAbsenceJustifications", missingPayload, "TUTOR-1", "Tutor").authorized, true);
assert.equal(missingTarget.read(missingPayload).code, "GUARDIAN_ATTENDANCE_PERMISSION_REQUIRED");
assert.equal(missingTarget.calls.requestQueries.length, 0, "a guardian cannot enumerate all absence justifications");

const deniedPermission = createHarness({ permission: false });
const deniedPayload = { estudianteId: "STU-1", sessionToken: "signed" };
assert.equal(deniedPermission.validate("getStudentAbsenceJustifications", deniedPayload, "TUTOR-1", "Tutor").authorized, false);
assert.equal(deniedPermission.read(deniedPayload).code, "GUARDIAN_ATTENDANCE_PERMISSION_REQUIRED");
assert.equal(deniedPermission.calls.requestQueries.length, 0);

const ambiguous = createHarness({ matches: 2 });
const ambiguousPayload = { expedienteId: "EXP-1", sessionToken: "signed" };
assert.equal(ambiguous.validate("getStudentAbsenceJustifications", ambiguousPayload, "TUTOR-1", "Tutor").authorized, false);

const byExpediente = createHarness();
const expedientePayload = { expedienteEstudianteId: "EXP-1", sessionToken: "signed" };
assert.equal(byExpediente.validate("getStudentAbsenceJustifications", expedientePayload, "TUTOR-1", "Tutor").authorized, true);
assert.equal(byExpediente.read(expedientePayload).status, "success");
assert.equal(byExpediente.calls.requestQueries[0].estudianteId, "STU-1");

const student = createHarness({ role: "Estudiante" });
const studentPayload = { sessionToken: "signed", userId: "STU-2" };
assert.equal(student.read(studentPayload).status, "success");
assert.equal(student.calls.requestQueries[0].userId, "STU-1");
assert.equal(student.calls.requestQueries[0].estudianteId, "STU-1");

console.log("user-service-absence-justification-guardian-abac: all assertions passed");
