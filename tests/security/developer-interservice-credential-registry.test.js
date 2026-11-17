"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/developer-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/developer-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

const headers = ["CredentialID","ServiceID","CredentialType","Version","Status","Fingerprint","CreatedAt","CreatedBy","RevokedAt","RevokedBy"];
const type = "IMA_MIGRATION_HMAC_SECRET";
const oldSecret = "DEVELOPER-OLD-MIGRATION-SECRET-01234567890123456789";
const newSecret = "DEVELOPER-NEW-MIGRATION-SECRET-01234567890123456789";
const fingerprint = value => crypto.createHash("sha256").update(value, "utf8").digest("hex");
const row = (id, version, status, secret, revokedAt = "", revokedBy = "") =>
  [id, "DEVELOPER", type, version, status, fingerprint(secret), "2026-11-17T00:00:00Z", "operator-test", revokedAt, revokedBy];

let rows = [headers, row("CRED-DEV-v1", "v1", "ACTIVE", oldSecret)];
const properties = { AUTH_TOKEN_SECRET: "SESSION-ONLY-SECRET-012345678901234567890123456789" };
const cache = new Map();
const auditHeaders = ["EventID","Direction","SourceService","TargetService","Action","RequestID","CorrelationID","CredentialType","CredentialID","CredentialVersion","OccurredAt"];
const auditRows = [auditHeaders.slice()];
const auditSheet = { getDataRange: () => ({ getValues: () => auditRows.map(row => row.slice()) }), getRange: (r,c,n,w) => ({ setValues: values => values.forEach((row,i) => { while(auditRows.length<r+i)auditRows.push([]); for(let j=0;j<w;j++)auditRows[r-1+i][c-1+j]=row[j]; }) }), appendRow: row => auditRows.push(row.slice()) };
let lockBusy = false, lockWaits = 0, lockReleases = 0, cacheWrites = 0;
const runtime = {
  Date, Math, JSON, String, Array, Object, Number, Error, RegExp,
  SPREADSHEET_ID: "TEST-SPREADSHEET",
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] || "" }) },
  SpreadsheetApp: { flush: () => {}, openById: id => {
    assert.equal(id, "TEST-SPREADSHEET");
    return { getSheetByName: name => name === "CatalogoCredencialesServicios" ? { getDataRange: () => ({ getValues: () => rows.map(item => item.slice()) }) } : (name === "AuditoriaUsoCredenciales" ? auditSheet : null), insertSheet: name => name === "AuditoriaUsoCredenciales" ? auditSheet : null };
  } },
  Utilities: {
    DigestAlgorithm: { SHA_256: "SHA_256" }, Charset: { UTF_8: "UTF_8" },
    MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
    computeDigest: (_algorithm, value) => Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest()),
    computeHmacSignature: (_algorithm, message, key) => Array.from(crypto.createHmac("sha256", key).update(String(message)).digest())
  },
  CacheService: { getScriptCache: () => ({
    get: key => cache.get(key) || null,
    put: (key, value) => { cacheWrites++; cache.set(key, value); }
  }) },
  LockService: { getScriptLock: () => ({
    waitLock: ms => { assert.equal(ms, 5000); lockWaits++; if (lockBusy) throw new Error("LOCK_TIMEOUT"); },
    releaseLock: () => { lockReleases++; }
  }) }
};
vm.createContext(runtime);
const names = ["computeHmacSignature","computeMigrationCredentialFingerprint_","getMigrationHmacSecret_",
  "getMigrationHmacSecrets_","resolveInterServiceSecret_","recordInterServiceCredentialUsage_","createInterServiceEnvelope","verifyInterServiceEnvelope"];
const bootstrap = 'const IMA_LOCAL_SERVICE_ID_ = "DEVELOPER"; const IMA_CREDENTIAL_CATALOG_HEADERS_ = ' + JSON.stringify(headers) + '; const IMA_CREDENTIAL_USAGE_AUDIT_HEADERS_ = ' + JSON.stringify(auditHeaders) + ';';
vm.runInContext(bootstrap + "\n" + names.map(extract).join("\n") +
  "\nthis.api={create:createInterServiceEnvelope,verify:verifyInterServiceEnvelope};", runtime);

function expectCode(fn, code) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert.ok(error, "expected " + code);
  assert.ok(String(error.message || error).includes(code), "expected " + code + ", got " + String(error.message || error));
}

// A session token secret must never be accepted as a migration HMAC fallback.
expectCode(() => runtime.api.create("DEVELOPER", "USER", "probe", {}, type), "MIGRATION_SECRET_NOT_CONFIGURED");
expectCode(() => runtime.api.create("DEVELOPER", "USER", "probe", {}, properties.AUTH_TOKEN_SECRET), "INTERSERVICE_CREDENTIAL_TYPE_INVALID");

// Provisioned dedicated key signs; receiver resolves its source-specific registry key.
properties.IMA_MIGRATION_HMAC_SECRET = oldSecret;
properties.IMA_MIGRATION_HMAC_SECRET_VERSION = "v1";
properties.IMA_MIGRATION_HMAC_SECRET_DEVELOPER = oldSecret;
properties.IMA_MIGRATION_HMAC_SECRET_VERSION_DEVELOPER = "v1";
const valid = runtime.api.create("DEVELOPER", "USER", "probe", { value: 1 }, type);
assert.equal(runtime.api.verify(valid, "USER", type).valid, true);
assert.throws(() => runtime.api.verify(valid, "USER", type), /INTERSERVICE_REPLAY_DETECTED/);
const forged = runtime.api.create("DEVELOPER", "USER", "probe", { value: 2 }, type);
forged.hmacSignature = "0".repeat(64);
const writesBeforeForged = cacheWrites;
expectCode(() => runtime.api.verify(forged, "USER", type), "INVALID_INTERSERVICE_SIGNATURE");
assert.equal(cacheWrites, writesBeforeForged, "forged signature cannot consume replay ID");

// Overlap: active v2 signs while v1 remains verification-only.
properties.IMA_MIGRATION_HMAC_SECRET = newSecret;
properties.IMA_MIGRATION_HMAC_SECRET_VERSION = "v2";
properties.IMA_MIGRATION_HMAC_SECRET_DEVELOPER = newSecret;
properties.IMA_MIGRATION_HMAC_SECRET_VERSION_DEVELOPER = "v2";
properties.IMA_MIGRATION_HMAC_SECRET_DEVELOPER_V_v1 = oldSecret;
rows = [headers, row("CRED-DEV-v1", "v1", "VERIFY_ONLY", oldSecret), row("CRED-DEV-v2", "v2", "ACTIVE", newSecret)];
const oldEnvelope = runtime.api.create("DEVELOPER", "USER", "probe", { rotation: "old" }, type);
const oldBody = [oldEnvelope.requestId, oldEnvelope.timestamp, oldEnvelope.correlationId, oldEnvelope.sourceService,
  oldEnvelope.targetService, oldEnvelope.action, JSON.stringify(oldEnvelope.payload || {})].join("|");
oldEnvelope.hmacSignature = crypto.createHmac("sha256", oldSecret).update(oldBody).digest("hex");
assert.equal(runtime.api.verify(oldEnvelope, "USER", type).valid, true);
const currentEnvelope = runtime.api.create("DEVELOPER", "USER", "probe", { rotation: "new" }, type);
assert.equal(runtime.api.verify(currentEnvelope, "USER", type).valid, true);

// Selective revocation rejects v1 without affecting v2.
rows = [headers, row("CRED-DEV-v1", "v1", "REVOKED", oldSecret, "2026-11-17T13:00:00Z", "operator-test"),
  row("CRED-DEV-v2", "v2", "ACTIVE", newSecret)];
const revoked = runtime.api.create("DEVELOPER", "USER", "probe", { rotation: "revoked" }, type);
const revokedBody = [revoked.requestId, revoked.timestamp, revoked.correlationId, revoked.sourceService,
  revoked.targetService, revoked.action, JSON.stringify(revoked.payload || {})].join("|");
revoked.hmacSignature = crypto.createHmac("sha256", oldSecret).update(revokedBody).digest("hex");
expectCode(() => runtime.api.verify(revoked, "USER", type), "INVALID_INTERSERVICE_SIGNATURE");
const activeAfterRevocation = runtime.api.create("DEVELOPER", "USER", "probe", { rotation: "active-after-revoke" }, type);
assert.equal(runtime.api.verify(activeAfterRevocation, "USER", type).valid, true);
assert.ok(source.includes('const IMA_LOCAL_SERVICE_ID_ = "DEVELOPER";'));
console.log("DEVELOPER migration credential registry: dedicated secret, no session-secret fallback, overlap rotation, selective revocation and anti-replay PASS.");
