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
  const settings = Object.assign({ messageSheet: true }, options || {});
  const calls = { reads: 0 };
  const rows = [
    ["MensajeID", "ConversacionID", "RemitenteID", "DestinatarioID", "EstudianteID", "MensajeTexto", "AdjuntoURL", "FechaEnvio", "EstadoLectura"],
    ["MSG-1", "CONV-A", "USER-A", "USER-B", "STU-A", "Mensaje A1", "", "2026-11-20T10:00:00Z", "Enviado"],
    ["MSG-2", "CONV-A", "USER-B", "USER-A", "STU-A", "Respuesta A2", "", "2026-11-20T11:00:00Z", "Leído"],
    ["MSG-3", "CONV-B", "USER-C", "USER-D", "STU-C", "Mensaje privado", "", "2026-11-20T12:00:00Z", "Enviado"],
    ["MSG-4", "CONV-C", "USER-A", "USER-C", "STU-A", "Otro mensaje propio", "", "2026-11-20T13:00:00Z", "Enviado"]
  ];
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
      if (name !== "ConversacionesMensajes" || !settings.messageSheet) return null;
      return { getDataRange: () => { calls.reads++; return { getValues: () => rows.map(row => row.slice()) }; } };
    } }) },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("getInternalMessages") + "\n" +
    extractFunction("getInternalConversations") +
    "\nthis.readMessages = getInternalMessages; this.readConversations = getInternalConversations;",
    runtime
  );
  return { readMessages: runtime.readMessages, readConversations: runtime.readConversations, calls };
}

function request(userId, values) {
  return Object.assign({ _verifiedRole: "Estudiante", _verifiedUserId: userId }, values || {});
}

const actor = makeHarness();
const ownConversation = actor.readMessages(request("USER-A", {
  conversacionId: "CONV-A", userId: "USER-C"
}));
assert.equal(ownConversation.status, "success");
assert.deepEqual(Array.from(ownConversation.data, row => row.mensajeId), ["MSG-1", "MSG-2"],
  "conversationId cannot bypass sender/recipient participation");

const allOwnMessages = actor.readMessages(request("USER-A", { userId: "USER-C" }));
assert.deepEqual(Array.from(allOwnMessages.data, row => row.mensajeId), ["MSG-1", "MSG-2", "MSG-4"],
  "payload userId is ignored; only the verified actor's messages are returned");

const foreignConversation = actor.readMessages(request("USER-A", { conversacionId: "CONV-B" }));
assert.deepEqual(Array.from(foreignConversation.data), [], "non-participant cannot read another conversation");

const foreignActor = actor.readConversations(request("USER-C", { conversacionId: "CONV-A" }));
assert.deepEqual(Array.from(foreignActor.data), [], "getInternalConversations delegates the same participant check");

const missingIdentity = actor.readMessages({ conversacionId: "CONV-A", userId: "USER-A" });
assert.equal(missingIdentity.code, "VERIFIED_IDENTITY_REQUIRED");
assert.equal(actor.calls.reads, 4, "missing identity must be denied before reading the message sheet");

const missingSheet = makeHarness({ messageSheet: false });
assert.deepEqual(Array.from(missingSheet.readMessages(request("USER-A")).data), []);

console.log("user-internal-messages-participant-ownership: all assertions passed");
