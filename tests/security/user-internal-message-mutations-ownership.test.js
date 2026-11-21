"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
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

function makeHarness(options) {
  const settings = Object.assign({ lockAvailable: true, notificationThrows: false }, options || {});
  const calls = { lockAttempts: 0, releases: 0, notifications: 0, appends: 0, writes: [] };
  const rows = [
    ["MensajeID", "ConversacionID", "RemitenteID", "DestinatarioID", "EstudianteID", "MensajeTexto", "AdjuntoURL", "FechaEnvio", "EstadoLectura"],
    ["MSG-1", "CONV-A", "USER-A", "USER-B", "STU-A", "Mensaje A1", "", "2026-11-20T10:00:00Z", "Enviado"],
    ["MSG-2", "CONV-A", "USER-B", "USER-A", "STU-A", "Respuesta A2", "", "2026-11-20T11:00:00Z", "Enviado"],
    ["MSG-3", "CONV-C", "USER-C", "USER-D", "STU-C", "Hilo cerrado", "", "2026-11-20T12:00:00Z", "Cerrado"]
  ];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    appendRow: row => { rows.push(row.slice()); calls.appends++; },
    getRange: (row, col) => ({ setValue: value => { rows[row - 1][col - 1] = value; calls.writes.push({ row, col, value }); } })
  };
  const lock = {
    tryLock: () => { calls.lockAttempts++; return settings.lockAvailable; },
    releaseLock: () => { calls.releases++; }
  };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => name === "ConversacionesMensajes" ? sheet : null }) },
    getOrCreateSheet: () => sheet,
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => "UUID-TEST" },
    createUserNotification: () => {
      calls.notifications++;
      if (settings.notificationThrows) throw new Error("notification unavailable");
    },
    logDebug: () => {},
    Date, String, Number, Object, Array, JSON, Set
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("sendInternalMessage") + "\n" +
    extractFunction("closeConversationThread") +
    "\nthis.send = sendInternalMessage; this.close = closeConversationThread;",
    runtime
  );
  return { send: runtime.send, close: runtime.close, calls, rows };
}

function request(userId, values) {
  return Object.assign({ _verifiedRole: "Estudiante", _verifiedUserId: userId }, values || {});
}

const senderMismatch = makeHarness();
assert.equal(senderMismatch.send(request("USER-A", {
  remitenteId: "USER-C", destinatarioId: "USER-B", mensajeTexto: "Spoof"
})).code, "MESSAGE_SENDER_MISMATCH");
assert.equal(senderMismatch.calls.lockAttempts, 0);
assert.equal(senderMismatch.calls.appends, 0);

const validReply = makeHarness();
const sent = validReply.send(request("USER-A", {
  remitenteId: "USER-A", destinatarioId: "USER-B", conversacionId: "CONV-A", mensajeTexto: "Respuesta válida"
}));
assert.equal(sent.status, "success");
assert.equal(sent.data.conversacionId, "CONV-A");
assert.equal(validReply.rows.at(-1)[4], "STU-A", "existing student context is preserved");
assert.equal(validReply.calls.appends, 1);
assert.equal(validReply.calls.notifications, 1);
assert.equal(validReply.calls.releases, 1);

const wrongRecipient = makeHarness();
assert.equal(wrongRecipient.send(request("USER-A", {
  remitenteId: "USER-A", destinatarioId: "USER-C", conversacionId: "CONV-A", mensajeTexto: "Intrusión"
})).code, "CONVERSATION_PARTICIPANT_MISMATCH");
assert.equal(wrongRecipient.calls.appends, 0);
assert.equal(wrongRecipient.calls.releases, 1);

const closedThread = makeHarness();
assert.equal(closedThread.send(request("USER-C", {
  remitenteId: "USER-C", destinatarioId: "USER-D", conversacionId: "CONV-C", mensajeTexto: "Después del cierre"
})).code, "CONVERSATION_CLOSED");
assert.equal(closedThread.calls.appends, 0);

const lockBusy = makeHarness({ lockAvailable: false });
assert.equal(lockBusy.send(request("USER-A", {
  remitenteId: "USER-A", destinatarioId: "USER-B", mensajeTexto: "No entra"
})).code, "CONVERSATION_LOCK_BUSY");
assert.equal(lockBusy.calls.appends, 0);
assert.equal(lockBusy.calls.releases, 0);

const closeDenied = makeHarness();
assert.equal(closeDenied.close(request("USER-C", { conversacionId: "CONV-A" })).code, "CONVERSATION_PARTICIPANT_REQUIRED");
assert.equal(closeDenied.calls.writes.length, 0);
assert.equal(closeDenied.calls.releases, 1);

const closeAllowed = makeHarness();
const closed = closeAllowed.close(request("USER-A", { conversacionId: "CONV-A" }));
assert.equal(closed.status, "success");
assert.equal(closed.mensajesAfectados, 2);
assert.deepEqual(closeAllowed.rows.slice(1, 3).map(row => row[8]), ["Cerrado", "Cerrado"]);
assert.equal(closeAllowed.calls.releases, 1);
assert.equal(closeAllowed.send(request("USER-A", {
  remitenteId: "USER-A", destinatarioId: "USER-B", conversacionId: "CONV-A", mensajeTexto: "Race after close"
})).code, "CONVERSATION_CLOSED", "closed thread cannot accept a later message");

const missingThread = makeHarness();
assert.equal(missingThread.close(request("USER-A", { conversacionId: "CONV-MISSING" })).code, "CONVERSATION_NOT_FOUND");

const notificationFailure = makeHarness({ notificationThrows: true });
assert.equal(notificationFailure.send(request("USER-A", {
  remitenteId: "USER-A", destinatarioId: "USER-B", mensajeTexto: "Persisted message"
})).status, "success", "notification failure does not roll back a persisted message");
assert.equal(notificationFailure.calls.releases, 1);

console.log("user-internal-message-mutations-ownership: all assertions passed");
