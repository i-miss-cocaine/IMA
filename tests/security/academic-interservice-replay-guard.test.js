"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "backend/academic-service/Code.gs"), "utf8");
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, name + " must exist");
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escape = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

const secret = "ACADEMIC-MIGRATION-SECRET-01234567890123456789";
const cacheValues = new Map();
let lockBusy = false, lockWaits = 0, lockReleases = 0;
const runtime = {
  Date, String, JSON, Array, Math, Error,
  Utilities: {
    MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
    computeHmacSignature: (_algorithm, message, key) =>
      Array.from(crypto.createHmac("sha256", key).update(String(message)).digest())
        .map(byte => byte > 127 ? byte - 256 : byte)
  },
  CacheService: {
    getScriptCache: () => ({
      get: key => cacheValues.get(key) || null,
      put: (key, value) => cacheValues.set(key, value)
    })
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => { lockWaits++; if (lockBusy) throw new Error("lock busy"); },
      releaseLock: () => { lockReleases++; }
    })
  }
};
vm.createContext(runtime);
const verifier = extractFunction(source, "computeHmacSignature") + "\n" +
  extractFunction(source, "verifyInterServiceEnvelope") +
  "\nthis.verify = verifyInterServiceEnvelope;";
vm.runInContext(verifier, runtime);

function makeEnvelope(requestId, key = secret) {
  const envelope = {
    sourceService: "ACCOUNTING",
    targetService: "ACADEMIC",
    action: "getMigrationTargetExistenceSnapshot",
    requestId,
    timestamp: Date.now(),
    correlationId: "CORR-" + requestId,
    payload: { institutionId: "INST-1" }
  };
  const body = [envelope.requestId, envelope.timestamp, envelope.correlationId,
    envelope.sourceService, envelope.targetService, envelope.action,
    JSON.stringify(envelope.payload)].join("|");
  envelope.hmacSignature = crypto.createHmac("sha256", key).update(body).digest("hex");
  return envelope;
}

// A forged signature must fail before it can reserve or poison a requestId.
const forged = makeEnvelope("REQ-FORGED");
forged.hmacSignature = "0".repeat(64);
assert.throws(() => runtime.verify(forged, "ACADEMIC", secret), /INVALID_INTERSERVICE_SIGNATURE/);
assert.equal(cacheValues.has("REPLAY_REQ_REQ-FORGED"), false);
assert.equal(lockWaits, 0);

// The legitimate request with that same ID must still be accepted.
const legitimate = makeEnvelope("REQ-FORGED");
assert.equal(runtime.verify(legitimate, "ACADEMIC", secret).valid, true);
assert.equal(cacheValues.get("REPLAY_REQ_REQ-FORGED"), "SEEN");
assert.equal(lockReleases, 1);

// A second valid delivery is rejected as a replay, and the lock is released.
assert.throws(() => runtime.verify(legitimate, "ACADEMIC", secret), /INTERSERVICE_REPLAY_DETECTED/);
assert.equal(lockReleases, 2);

// Lock contention fails closed without consuming the requestId; a retry can then succeed.
const busyEnvelope = makeEnvelope("REQ-BUSY");
lockBusy = true;
assert.throws(() => runtime.verify(busyEnvelope, "ACADEMIC", secret), /INTERSERVICE_REPLAY_CHECK_BUSY/);
assert.equal(cacheValues.has("REPLAY_REQ_REQ-BUSY"), false);
lockBusy = false;
assert.equal(runtime.verify(busyEnvelope, "ACADEMIC", secret).valid, true);
assert.equal(lockReleases, 3);

console.log("Academic interservice HMAC verification order, replay atomicity, and lock-contention contract: PASS");
