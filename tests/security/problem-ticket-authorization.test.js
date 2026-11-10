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

const doPostFn = extractFunction(source, "doPost");
assert.match(doPostFn, /if \(!authCheck\.authorized\)/);
assert.match(doPostFn, /code: "AUTH_PERMISSION_DENIED"/);

function makeSheet(rows) {
  return {
    rows,
    getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
    appendRow(row) { rows.push(row.slice()); },
    getRange(row, col) { return { setValue(value) { rows[row - 1][col - 1] = value; } }; }
  };
}
const ticketRows = makeSheet([
  ["TicketID","UserID","Name","Role","Area","Page","Version","App","Description","Expected","Status","Created","Updated"],
  ["T1","U1","Ana","Estudiante","General","","1.0","Web","Descripción","Esperado","Enviado","2026-11-10","2026-11-10"],
  ["T2","U2","Bob","Estudiante","General","","1.0","Web","Descripción","Esperado","Enviado","2026-11-10","2026-11-10"]
]);
const messageRows = makeSheet([
  ["MessageID","TicketID","UserID","Name","Role","Internal","Message","Date"],
  ["M1","T1","U1","Ana","Estudiante",false,"Público","2026-11-10"],
  ["M2","T1","U2","Bob","Director",true,"Nota interna","2026-11-10"],
  ["M3","T2","U2","Bob","Estudiante",false,"Otro ticket","2026-11-10"]
]);
const userRows = makeSheet([["UserID","Name"],["U1","Ana"],["U2","Bob"],["U3","Director"]]);
const sheets = { TicketsReporteProblemas: ticketRows, HistorialMensajesTickets: messageRows, Usuarios: userRows };
const runtime = {
  SPREADSHEET_ID: "LOCAL",
  TICKET_ADMIN_ROLES_: ["Administrador","Desarrollador","Director"],
  getUserVerifiedRole(payload) {
    const claims = {
      "student-token": { id: "U1", role: "Estudiante" },
      "director-token": { id: "U3", role: "Director" }
    };
    const claim = claims[payload && payload.sessionToken];
    if (!claim) return "NO_ACCESS";
    payload._verifiedUserId = claim.id;
    return claim.role;
  },
  SpreadsheetApp: { openById(id) { assert.equal(id, "LOCAL"); return {}; } },
  getOrCreateSheet(_ss, name) { return sheets[name]; },
  logStructuredEvent() {}
};
vm.runInNewContext(submitFn + "\n" + listFn + "\n" + replyFn +
  "\nthis.submitTicket = submitProblemTicket; this.listTickets = getProblemTickets; this.replyTicket = replyProblemTicket;", runtime);

const ownList = runtime.listTickets({ sessionToken: "student-token", userId: "U2", authRole: "Director" });
assert.equal(ownList.status, "success");
assert.deepEqual(Array.from(ownList.tickets, ticket => ticket.ticketId), ["T1"]);
assert.equal(ownList.tickets[0].mensajes.some(message => message.esNotaInterna), false,
  "non-admin users do not see internal notes");
const adminList = runtime.listTickets({ sessionToken: "director-token" });
assert.deepEqual(Array.from(adminList.tickets, ticket => ticket.ticketId), ["T1","T2"]);
assert.equal(adminList.tickets[0].mensajes.some(message => message.esNotaInterna), true,
  "authorized administrators can see internal notes");

const beforeDeniedReply = messageRows.rows.length;
const deniedReply = runtime.replyTicket({ sessionToken: "student-token", ticketId: "T2", mensaje: "Intento de acceso cruzado" });
assert.equal(deniedReply.code, "AUTH_PERMISSION_DENIED");
assert.equal(messageRows.rows.length, beforeDeniedReply, "cross-user reply does not persist");
assert.equal(runtime.replyTicket({ sessionToken: "student-token", ticketId: "T1", mensaje: "Respuesta del titular" }).status, "success");
assert.equal(runtime.replyTicket({ sessionToken: "director-token", ticketId: "T2", mensaje: "Respuesta administrativa" }).status, "success");

const submitted = runtime.submitTicket({
  sessionToken: "student-token", userId: "U2",
  descripcion: "Descripción suficientemente larga para registrar el ticket",
  resultadoEsperado: "Resultado esperado suficientemente largo para esta prueba"
});
assert.equal(submitted.status, "success");
assert.equal(ticketRows.rows[ticketRows.rows.length - 1][1], "U1",
  "ticket owner comes from verified claims, not spoofed payload userId");

process.stdout.write("problem-ticket-authorization: all assertions passed\n");
