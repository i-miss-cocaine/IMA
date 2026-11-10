const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const permissionFn = extractFunction(source, "validateRolePermission");
const submitFn = extractFunction(source, "submitProblemTicket");
const listFn = extractFunction(source, "getProblemTickets");
const replyFn = extractFunction(source, "replyProblemTicket");
const updateFn = extractFunction(source, "updateTicketStatus");
const configureFn = extractFunction(source, "configureAutomationRules");
const getRulesFn = extractFunction(source, "getAutomationRules");
const tokens = {
  "student-token": { userId: "U-STUDENT", role: "Estudiante" },
  "teacher-token": { userId: "U-TEACHER", role: "Profesor" },
  "director-token": { userId: "U-DIRECTOR", role: "Director" },
  "inactive-token": { userId: "U-INACTIVE", role: "NO_ACCESS" }
};
const context = {
  PUBLIC_ACTIONS: [], IDENTITY_MANAGER_ACTIONS_: [],
  TICKET_ADMIN_ROLES_: ["Administrador", "Desarrollador", "Director"], ROLE_PERMISSIONS: {},
  getUserVerifiedRole(payload) {
    const claim = tokens[payload && payload.sessionToken];
    if (!claim || claim.role === "NO_ACCESS") return "NO_ACCESS";
    payload._verifiedUserId = claim.userId;
    return claim.role;
  },
  validateContextualAccess: () => ({ authorized: false, reason: "no contextual grant in unit test" }),
  getDynamicPermissionsForRole: () => null, hasActiveDelegationForAction: () => false, logStructuredEvent: () => {}
};
vm.runInNewContext(permissionFn + "\nthis.checkPermission = validateRolePermission;", context);
for (const action of ["submitProblemTicket", "getProblemTickets", "replyProblemTicket"]) {
  const student = { sessionToken: "student-token", userId: "U-OTHER", authRole: "Administrador" };
  const allowed = context.checkPermission(action, student);
  assert.equal(allowed.authorized, true, action + " allows authenticated self-service");
  assert.equal(allowed.userId, "U-STUDENT", action + " uses verified identity");
  assert.equal(context.checkPermission(action, { userId: "U-STUDENT", authRole: "Administrador" }).authorized, false, action + " rejects missing session");
  assert.equal(context.checkPermission(action, { sessionToken: "inactive-token" }).authorized, false, action + " rejects inactive account");
}
for (const action of ["configureAutomationRules", "getAutomationRules"]) {
  assert.equal(context.checkPermission(action, { sessionToken: "student-token" }).authorized, false, action + " denied to student");
  assert.equal(context.checkPermission(action, { sessionToken: "teacher-token" }).authorized, false, action + " denied to teacher");
  assert.equal(context.checkPermission(action, { sessionToken: "director-token" }).authorized, true, action + " allowed to admin");
}
assert.match(submitFn, /const userId = payload && payload\._verifiedUserId/);
assert.doesNotMatch(submitFn, /payload\.userId/);
assert.match(listFn, /const currentUserId = payload && payload\._verifiedUserId/);
assert.match(listFn, /if \(!isAdmin && tUserId !== String\(currentUserId\)\.trim\(\)\)/);
assert.match(replyFn, /const currentUserId = payload && payload\._verifiedUserId/);
assert.match(replyFn, /if \(!isAdmin && ticketUserId !== String\(currentUserId\)\.trim\(\)\)/);
for (const fn of [updateFn, configureFn, getRulesFn]) assert.match(fn, /TICKET_ADMIN_ROLES_\.indexOf\(verifiedRole\)/);
assert.doesNotMatch(permissionFn, /\["submitProblemTicket", "getProblemTickets", "replyProblemTicket", "searchGlobalOmnibox", "configureAutomationRules"/);
process.stdout.write("problem-ticket-authorization: all assertions passed\n");
