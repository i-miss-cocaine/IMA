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
const oldSecret = "ACADEMIC-OLD-MIGRATION-SECRET-01234567890123456789";
const credentialType = "IMA_MIGRATION_HMAC_SECRET";
const catalogHeaders = ["CredentialID","ServiceID","CredentialType","Version","Status","Fingerprint","CreatedAt","CreatedBy","RevokedAt","RevokedBy"];
const fingerprint = crypto.createHash("sha256").update(secret, "utf8").digest("hex");
let catalogRows = [catalogHeaders, ["CRED-ACCOUNTING-v1","ACCOUNTING",credentialType,"v1","ACTIVE",fingerprint,"2026-11-17T00:00:00Z","operator-test","",""]];
const scriptProperties = {
  IMA_MIGRATION_HMAC_SECRET_ACCOUNTING: secret,
  IMA_MIGRATION_HMAC_SECRET_VERSION_ACCOUNTING: "v1",
  AUTH_TOKEN_SECRET: "SESSION-SECRET-MUST-NOT-BE-USED-FOR-MIGRATION-0123456789"
};
const cacheValues = new Map();
let lockBusy = false, lockWaits = 0, lockReleases = 0;
const runtime = {
  Date, String, JSON, Array, Math, Error,
  SPREADSHEET_ID: "TEST-SPREADSHEET",
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => scriptProperties[key] || "" }) },
  SpreadsheetApp: { openById: id => {
    assert.equal(id, "TEST-SPREADSHEET");
    return { getSheetByName: name => name === "CatalogoCredencialesServicios" ? {
      getDataRange: () => ({ getValues: () => catalogRows.map(row => row.slice()) })
    } : null };
  } },
  Utilities: {
    MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
    DigestAlgorithm: { SHA_256: "SHA_256" },
    Charset: { UTF_8: "UTF_8" },
    computeDigest: (_algorithm, value) => Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest())
      .map(byte => byte > 127 ? byte - 256 : byte),
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
const verifier = 'const IMA_LOCAL_SERVICE_ID_ = "ACADEMIC"; const IMA_CREDENTIAL_CATALOG_HEADERS_ = ' +
  JSON.stringify(catalogHeaders) + ";\n" +
  extractFunction(source, "computeMigrationCredentialFingerprint_") + "\n" +
  extractFunction(source, "getMigrationHmacSecret_") + "\n" +
  extractFunction(source, "getMigrationHmacSecrets_") + "\n" +
  extractFunction(source, "resolveInterServiceSecret_") + "\n" +
  extractFunction(source, "computeHmacSignature") + "\n" +
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
assert.throws(() => runtime.verify(forged, "ACADEMIC", credentialType), /INVALID_INTERSERVICE_SIGNATURE/);
assert.equal(cacheValues.has("REPLAY_REQ_REQ-FORGED"), false);
assert.equal(lockWaits, 0);

// The legitimate request with that same ID must still be accepted.
const legitimate = makeEnvelope("REQ-FORGED");
assert.equal(runtime.verify(legitimate, "ACADEMIC", credentialType).valid, true);
assert.equal(cacheValues.get("REPLAY_REQ_REQ-FORGED"), "SEEN");
assert.equal(lockReleases, 1);

// A second valid delivery is rejected as a replay, and the lock is released.
assert.throws(() => runtime.verify(legitimate, "ACADEMIC", credentialType), /INTERSERVICE_REPLAY_DETECTED/);
assert.equal(lockReleases, 2);

// Lock contention fails closed without consuming the requestId; a retry can then succeed.
const busyEnvelope = makeEnvelope("REQ-BUSY");
lockBusy = true;
assert.throws(() => runtime.verify(busyEnvelope, "ACADEMIC", credentialType), /INTERSERVICE_REPLAY_CHECK_BUSY/);
assert.equal(cacheValues.has("REPLAY_REQ_REQ-BUSY"), false);
lockBusy = false;
assert.equal(runtime.verify(busyEnvelope, "ACADEMIC", credentialType).valid, true);
assert.equal(lockReleases, 3);

// Overlapping rotation: the new key signs while the previous VERIFY_ONLY key remains accepted.
const newSecret = "ACADEMIC-NEW-MIGRATION-SECRET-01234567890123456789";
scriptProperties.IMA_MIGRATION_HMAC_SECRET_ACCOUNTING = newSecret;
scriptProperties.IMA_MIGRATION_HMAC_SECRET_VERSION_ACCOUNTING = "v2";
scriptProperties.IMA_MIGRATION_HMAC_SECRET_ACCOUNTING_V_v1 = oldSecret;
const oldFingerprint = crypto.createHash("sha256").update(oldSecret, "utf8").digest("hex");
const newFingerprint = crypto.createHash("sha256").update(newSecret, "utf8").digest("hex");
catalogRows = [catalogHeaders,
  ["CRED-ACCOUNTING-v1","ACCOUNTING",credentialType,"v1","VERIFY_ONLY",oldFingerprint,"2026-11-17T00:00:00Z","operator-test","",""],
  ["CRED-ACCOUNTING-v2","ACCOUNTING",credentialType,"v2","ACTIVE",newFingerprint,"2026-11-17T00:01:00Z","operator-test","",""]];
const oldRotationEnvelope = makeEnvelope("REQ-ROTATION-OLD", oldSecret);
assert.equal(runtime.verify(oldRotationEnvelope, "ACADEMIC", credentialType).valid, true);
const newRotationEnvelope = makeEnvelope("REQ-ROTATION-NEW", newSecret);
assert.equal(runtime.verify(newRotationEnvelope, "ACADEMIC", credentialType).valid, true);

// Revocation is selective: the old signature stops working, but the active key remains valid.
catalogRows = [catalogHeaders,
  ["CRED-ACCOUNTING-v1","ACCOUNTING",credentialType,"v1","REVOKED",oldFingerprint,"2026-11-17T00:00:00Z","operator-test","2026-11-17T13:00:00Z","operator-test"],
  ["CRED-ACCOUNTING-v2","ACCOUNTING",credentialType,"v2","ACTIVE",newFingerprint,"2026-11-17T00:01:00Z","operator-test","",""]];
const rejectedOldEnvelope = makeEnvelope("REQ-ROTATION-REVOKED", oldSecret);
assert.throws(() => runtime.verify(rejectedOldEnvelope, "ACADEMIC", credentialType), /INVALID_INTERSERVICE_SIGNATURE/);
assert.equal(runtime.verify(newRotationEnvelope, "ACADEMIC", credentialType).valid, true);
assert.ok(source.includes('const IMA_LOCAL_ACADEMIC_ = "ACADEMIC";'),
  "ACADEMIC signer identity is bound to the ACADEMIC service name");

console.log("Academic interservice HMAC verification order, replay atomicity, and lock-contention contract: PASS");
