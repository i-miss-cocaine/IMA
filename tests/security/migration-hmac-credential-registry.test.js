"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/user-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

const headers = ["CredentialID","ServiceID","CredentialType","Version","Status","Fingerprint","CreatedAt","CreatedBy","RevokedAt","RevokedBy"];
const TYPE = "IMA_MIGRATION_HMAC_SECRET";
const oldSecret = "OLD_MIGRATION_SECRET_012345678901234567890123456789";
const newSecret = "NEW_MIGRATION_SECRET_012345678901234567890123456789";
const fingerprint = value => crypto.createHash("sha256").update(value, "utf8").digest("hex");
const row = (id, service, version, status, secret, revokedAt = "", revokedBy = "") =>
  [id, service, TYPE, version, status, fingerprint(secret), "2026-11-17T00:00:00Z", "operator-test", revokedAt, revokedBy];

function makeHarness(options = {}) {
  const properties = Object.assign({}, options.properties || {});
  let rows = options.rows || [headers, row("CRED-USER-v1", "USER", "v1", "ACTIVE", oldSecret)];
  let schema = options.schema || headers.slice();
  const cache = new Map();
  const state = { lockWaits: 0, lockReleases: 0, cacheWrites: 0, lockBusy: !!options.lockBusy };
  const sheet = { getDataRange: () => ({ getValues: () => [schema.slice(), ...rows.slice(1).map(item => item.slice())] }) };
  const runtime = {
    Date, String, JSON, Array, Object, Number, Math, RegExp, Error,
    SPREADSHEET_ID: "TEST-SPREADSHEET",
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] || "" }) },
    SpreadsheetApp: { openById: id => {
      assert.equal(id, "TEST-SPREADSHEET");
      if (options.catalogUnavailable) throw new Error("unavailable");
      return { getSheetByName: name => name === "CatalogoCredencialesServicios" && !options.catalogMissing ? sheet : null };
    } },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      Charset: { UTF_8: "UTF_8" },
      computeDigest: (_algorithm, value) => Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest()),
      MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
      computeHmacSignature: (_algorithm, message, key) => Array.from(crypto.createHmac("sha256", key).update(String(message)).digest())
    },
    CacheService: { getScriptCache: () => ({
      get: key => cache.get(key) || null,
      put: (key, value) => { state.cacheWrites++; cache.set(key, value); }
    }) },
    LockService: { getScriptLock: () => ({
      waitLock: ms => { assert.equal(ms, 5000); if (state.lockBusy) throw new Error("LOCK_TIMEOUT"); state.lockWaits++; },
      releaseLock: () => { state.lockReleases++; }
    }) }
  };
  const names = ["computeMigrationCredentialFingerprint_", "getMigrationHmacSecret_", "resolveInterServiceSecret_", "createInterServiceEnvelope", "verifyInterServiceEnvelope"];
  vm.createContext(runtime);
  const bootstrap = 'const IMA_LOCAL_SERVICE_ID_ = "USER"; const IMA_CREDENTIAL_CATALOG_HEADERS_ = ' + JSON.stringify(headers) + ';';
  vm.runInContext(bootstrap + "\n" + names.map(extract).join("\n") +
    "\nthis.api={fingerprint:computeMigrationCredentialFingerprint_,get:getMigrationHmacSecret_,resolve:resolveInterServiceSecret_,create:createInterServiceEnvelope,verify:verifyInterServiceEnvelope};", runtime);
  return { api: runtime.api, properties, state, cache, setRows(value) { rows = value; }, setSchema(value) { schema = value; } };
}
function expectCode(fn, code) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert.ok(error, "expected " + code);
  assert.ok(String(error.message || error).includes(code), "expected " + code + ", got " + String(error.message || error));
}

const userProps = { IMA_MIGRATION_HMAC_SECRET: oldSecret, IMA_MIGRATION_HMAC_SECRET_VERSION: "v1" };
{
  const h = makeHarness({ properties: userProps });
  assert.equal(h.api.get("USER", "SIGN"), oldSecret);
  assert.equal(h.api.resolve("USER", TYPE, "SIGN"), oldSecret);
  expectCode(() => h.api.resolve("USER", "", "SIGN"), "INTERSERVICE_CREDENTIAL_TYPE_REQUIRED");
  expectCode(() => h.api.resolve("USER", "AUTH_TOKEN_SECRET", "SIGN"), "INTERSERVICE_CREDENTIAL_TYPE_INVALID");
}
{
  const h = makeHarness({ properties: userProps });
  expectCode(() => h.api.get("ACCOUNTING", "SIGN"), "MIGRATION_SECRET_SOURCE_MISMATCH");
  expectCode(() => h.api.get("EXAM", "VERIFY"), "MIGRATION_SOURCE_SERVICE_INVALID");
  expectCode(() => h.api.get("USER", "DELETE"), "MIGRATION_SECRET_PURPOSE_INVALID");
  expectCode(() => h.api.get("USER", "VERIFY"), "MIGRATION_SECRET_REVOKED_OR_UNREGISTERED");
}
{
  const h = makeHarness({ properties: { IMA_MIGRATION_HMAC_SECRET: "short", IMA_MIGRATION_HMAC_SECRET_VERSION: "v1" } });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_NOT_CONFIGURED");
}
{
  const h = makeHarness({ properties: { IMA_MIGRATION_HMAC_SECRET: oldSecret } });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_VERSION_NOT_CONFIGURED");
}
{
  const h = makeHarness({ properties: userProps, catalogMissing: true });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_UNAVAILABLE");
}
{
  const h = makeHarness({ properties: userProps, catalogUnavailable: true });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_UNAVAILABLE");
}
{
  const h = makeHarness({ properties: userProps, schema: headers.slice(0, 9) });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_SCHEMA_MISMATCH");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, row("CRED-1", "USER", "v1", "ACTIVE", oldSecret), row("CRED-1", "ACADEMIC", "v2", "REVOKED", oldSecret)] });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_DUPLICATE_ID");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, row("CRED-1", "USER", "v1", "ACTIVE", oldSecret), row("CRED-2", "USER", "v2", "ACTIVE", newSecret)] });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_REVOKED_OR_UNREGISTERED");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, row("CRED-1", "USER", "v1", "REVOKED", oldSecret)] });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_REVOKED_OR_UNREGISTERED");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, row("CRED-1", "USER", "v1", "ACTIVE", oldSecret, "2026-11-17T01:00:00Z", "operator")] });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_REVOKED_OR_UNREGISTERED");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, row("CRED-1", "USER", "v2", "ACTIVE", oldSecret)] });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_VERSION_MISMATCH");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, ["CRED-1","USER",TYPE,"v1","ACTIVE","bad-fingerprint","2026-11-17","operator","",""]] });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_FINGERPRINT_INVALID");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, ["CRED-1","USER",TYPE,"v1","ACTIVE",fingerprint(newSecret),"2026-11-17","operator","",""]] });
  expectCode(() => h.api.get("USER", "SIGN"), "MIGRATION_SECRET_FINGERPRINT_MISMATCH");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, ["","USER",TYPE,"v1","ACTIVE",fingerprint(oldSecret),"2026-11-17","operator","",""]] });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_ROW_INVALID");
}
{
  const h = makeHarness({ properties: userProps, rows: [headers, ["CRED-1","USER",TYPE,"v1","ACTIVE",fingerprint(oldSecret),"","operator","",""]] });
  expectCode(() => h.api.get("USER", "SIGN"), "CREDENTIAL_CATALOG_METADATA_INVALID");
}
{
  const h = makeHarness({ properties: { IMA_MIGRATION_HMAC_SECRET_ACCOUNTING: oldSecret, IMA_MIGRATION_HMAC_SECRET_VERSION_ACCOUNTING: "v3" },
    rows: [headers, row("CRED-OLD", "ACCOUNTING", "v2", "REVOKED", oldSecret), row("CRED-ACTIVE", "ACCOUNTING", "v3", "ACTIVE", oldSecret)] });
  assert.equal(h.api.get("ACCOUNTING", "VERIFY"), oldSecret, "source-specific verification key and active version resolve");
}
{
  const h = makeHarness({ properties: userProps });
  const envelope = h.api.create("USER", "ACADEMIC", "sampleAction", { value: 1 }, TYPE);
  assert.equal(h.api.verify(envelope, "ACADEMIC", TYPE).valid, true);
  expectCode(() => h.api.verify(envelope, "ACADEMIC", TYPE), "INTERSERVICE_REPLAY_DETECTED");
  assert.equal(h.state.lockWaits, 2);
  assert.equal(h.state.lockReleases, 2);
}
{
  const h = makeHarness({ properties: userProps });
  const envelope = h.api.create("USER", "ACADEMIC", "sampleAction", { value: 2 }, TYPE);
  envelope.hmacSignature = "0".repeat(64);
  expectCode(() => h.api.verify(envelope, "ACADEMIC", TYPE), "INVALID_INTERSERVICE_SIGNATURE");
  assert.equal(h.state.cacheWrites, 0, "invalid signatures must not consume a request ID");
  envelope.hmacSignature = crypto.createHmac("sha256", oldSecret)
    .update([envelope.requestId, envelope.timestamp, envelope.correlationId, envelope.sourceService,
      envelope.targetService, envelope.action, JSON.stringify(envelope.payload || {})].join("|")).digest("hex");
  assert.equal(h.api.verify(envelope, "ACADEMIC", TYPE).valid, true, "the valid retry can use the same request ID");
}
{
  const h = makeHarness({ properties: userProps, lockBusy: true });
  const envelope = h.api.create("USER", "ACADEMIC", "sampleAction", {}, TYPE);
  expectCode(() => h.api.verify(envelope, "ACADEMIC", TYPE), "INTERSERVICE_REPLAY_CHECK_BUSY");
  assert.equal(h.state.cacheWrites, 0);
  assert.equal(h.state.lockReleases, 0);
}
{
  const h = makeHarness({ properties: userProps });
  const envelope = h.api.create("USER", "ACADEMIC", "sampleAction", {}, TYPE);
  h.properties.IMA_MIGRATION_HMAC_SECRET = newSecret;
  h.properties.IMA_MIGRATION_HMAC_SECRET_VERSION = "v2";
  h.setRows([headers, row("CRED-OLD", "USER", "v1", "REVOKED", oldSecret), row("CRED-NEW", "USER", "v2", "ACTIVE", newSecret)]);
  expectCode(() => h.api.verify(envelope, "ACADEMIC", TYPE), "INVALID_INTERSERVICE_SIGNATURE");
  const newEnvelope = h.api.create("USER", "ACADEMIC", "sampleAction", {}, TYPE);
  assert.equal(h.api.verify(newEnvelope, "ACADEMIC", TYPE).valid, true);
}
{
  const h = makeHarness({ properties: userProps });
  h.setRows([headers, row("CRED-USER-v1", "USER", "v1", "REVOKED", oldSecret)]);
  expectCode(() => h.api.create("USER", "ACADEMIC", "sampleAction", {}, TYPE), "MIGRATION_SECRET_REVOKED_OR_UNREGISTERED");
}
process.stdout.write("Migration HMAC credential registry: catalog validation, version rotation, revocation, dedicated-key enforcement, HMAC verification and replay protection PASS.\n");
