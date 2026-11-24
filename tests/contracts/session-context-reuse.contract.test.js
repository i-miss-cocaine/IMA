"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const backend = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
function extractFunction(name) {
 const start = backend.indexOf("function " + name + "(");
 assert.notEqual(start, -1, "Debe existir " + name);
 const end = backend.indexOf("\n}\n", start);
 assert.notEqual(end, -1, "Debe cerrar " + name);
 return backend.slice(start, end + 3);
}
test("el límite de doPost limpia cualquier identidad interna enviada por el cliente antes de autorizar", () => {
 const clear = backend.indexOf('["__identityVerified", "_verifiedUserId", "_verifiedRole"');
 const auth = backend.indexOf("const authCheck = validateRolePermission(action, payload)");
 assert.ok(clear >= 0 && auth > clear);
});
test("getUserVerifiedRole valida el token una sola vez y reutiliza claims dentro del request", () => {
 let calls = 0;
 const fn = vm.runInNewContext("(" + extractFunction("getUserVerifiedRole") + ")", {
  verifySessionToken: token => { calls++; return token === "valid" ? {
   userId: "USER-1", role: "Docente", email: "docente@school.edu", membershipId: "MEM-1",
   institutionId: "INST-1", sessionId: "SES-1", accountState: "Activa", roleVersion: "3"
  } : null; }
 });
 const payload = { sessionToken: "valid" };
 assert.equal(fn(payload), "Docente");
 assert.equal(fn(payload), "Docente");
 assert.equal(calls, 1);
 assert.equal(payload._verifiedUserId, "USER-1");
 assert.equal(payload._verifiedMembershipId, "MEM-1");
 assert.equal(payload._verifiedInstitutionId, "INST-1");
 assert.equal(payload._verifiedSessionId, "SES-1");
 assert.equal(payload._verifiedClaims.role, "Docente");
});
test("el contexto de ámbitos reutiliza claims verificados y no verifica el token de nuevo", () => {
 const scope = extractFunction("getUserContextScope");
 assert.doesNotMatch(scope, /verifySessionToken\s*\(/);
 assert.match(scope, /payload\._verifiedClaims/);
});
test("cambio de rol, cierre de sesión y preferencias reutilizan el contexto verificado", () => {
 for (const name of ["switchActiveRole", "logoutUser", "getUserHelpPreferenceActor_"]) {
  assert.doesNotMatch(extractFunction(name), /verifySessionToken\s*\(/, name + " no debe volver a verificar la sesión");
 }
});
test("el contexto interno contiene identidad, rol, membresía, institución y sesión", () => {
 for (const field of ["_verifiedUserId", "_verifiedRole", "_verifiedMembershipId", "_verifiedInstitutionId", "_verifiedSessionId", "_verifiedClaims"]) {
  assert.match(backend, new RegExp(field));
 }
});
