"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const userSource = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
const accountingSource = fs.readFileSync(path.join(root, "backend/accounting-service/Code.gs"), "utf8");
new vm.Script(userSource, { filename: "backend/user-service/Code.gs" });
new vm.Script(accountingSource, { filename: "backend/accounting-service/Code.gs" });

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function: " + name);
}

const userHandler = extractFunction(userSource, "handleTrustedMigrationEnvelope_");
const secret = "accounting-import-hmac-secret-with-more-than-32-characters";
function makeUserRuntime(options = {}) {
  const runtime = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_MIGRATION_HMAC_SECRET" ? secret : "" }) },
    verifyInterServiceEnvelope(envelope, target, suppliedSecret) {
      assert.equal(target, "USER");
      assert.equal(suppliedSecret, "IMA_MIGRATION_HMAC_SECRET");
      return { sourceService: envelope.sourceService, action: envelope.action, payload: envelope.payload };
    },
    verifySessionToken(token) {
      if (token !== "SIGNED-LIVE-SESSION") return null;
      return { userId: "U-1", role: "Director", membershipId: "MEM-1", institutionId: "INST-1" };
    },
    getDynamicPermissionsForRole: () => options.permission === undefined ? true : options.permission,
    applyTrustedMigrationWrite_: () => ({ status: "success" }),
    compensateTrustedMigrationWrite_: () => ({ status: "success" }),
    registerMigratedResourceOwnership_: () => ({ status: "success" }),
    compensateMigratedResourceOwnership_: () => ({ status: "success" })
  };
  vm.runInNewContext(userHandler + "\nthis.handle = handleTrustedMigrationEnvelope_;", runtime);
  return runtime;
}

{
  const handle = makeUserRuntime().handle;
  const session = handle({ sourceService: "ACCOUNTING", action: "verifyAccountingSession", payload: { sessionToken: "SIGNED-LIVE-SESSION" } });
  assert.equal(session.status, "success");
  assert.equal(session.userId, "U-1");
  assert.equal(session.institutionId, "INST-1");
  assert.equal(session.sessionToken, undefined, "the signed session token is never returned");
  const permission = handle({ sourceService: "ACCOUNTING", action: "authorizeAccountingImport", payload: { sessionToken: "SIGNED-LIVE-SESSION" } });
  assert.equal(permission.status, "success");
  assert.equal(permission.importPermissionVerified, true);
  assert.equal(makeUserRuntime({ permission: false }).handle({
    sourceService: "ACCOUNTING", action: "authorizeAccountingImport", payload: { sessionToken: "SIGNED-LIVE-SESSION" }
  }).code, "IMPORT_PERMISSION_DENIED");
  assert.equal(handle({ sourceService: "ACCOUNTING", action: "verifyAccountingSession", payload: { sessionToken: "FORGED" } }).code,
    "VERIFIED_IDENTITY_REQUIRED");
  assert.throws(() => handle({ sourceService: "ACADEMIC", action: "verifyAccountingSession", payload: { sessionToken: "SIGNED-LIVE-SESSION" } }),
    /MIGRATION_SOURCE_NOT_ALLOWED/);
  assert.throws(() => handle({ sourceService: "ACCOUNTING", action: "arbitraryAction", payload: {} }),
    /MIGRATION_ACTION_NOT_ALLOWED/);
}

const accountingFns = [
  "computeMigrationCredentialFingerprint_", "getMigrationHmacSecret_", "resolveInterServiceSecret_",
  "isAccountingTrustedAppsScriptEndpoint_", "accountingComputeHmacSignature_", "requestAccountingUserAuthorization_",
  "getVerifiedAccountingIdentity_", "accountingHasInstitutionalImportPermission_",
  "getVerifiedDepartmentScopeForSession_", "apiResponseCorrelationId_", "apiResponsePublicMessage_",
  "buildApiResponseEnvelope_", "textResponse", "validateApiContractsTestSuite", "doGet", "doPost"
].map(name => extractFunction(accountingSource, name));

let remoteResponse = { status: "success", authorized: true, userId: "U-1", role: "Director",
  membershipId: "MEM-1", institutionId: "INST-1", importPermissionVerified: true };
let lastEnvelope = null, auditEvents = [];
const credentialHeaders = ["CredentialID","ServiceID","CredentialType","Version","Status","Fingerprint","CreatedAt","CreatedBy","RevokedAt","RevokedBy"];
const credentialFingerprint = crypto.createHash("sha256").update(secret, "utf8").digest("hex");
const credentialRows = [credentialHeaders, ["CRED-ACCOUNTING-v1","ACCOUNTING","IMA_MIGRATION_HMAC_SECRET","v1","ACTIVE",credentialFingerprint,"2026-11-17T00:00:00Z","fixture","",""]];
const accountingRuntime = {
  API_RESPONSE_VERSION: "1.0.0", Date, String, JSON, Array, Object, Number, Math, RegExp, Error,
  SPREADSHEET_ID: "SHEET-1",
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({
    IMA_USER_SERVICE_URL: "https://script.google.com/macros/s/AKfycbUSER123/exec",
    IMA_MIGRATION_HMAC_SECRET: secret,
    IMA_MIGRATION_HMAC_SECRET_VERSION: "v1",
    IMA_INSTITUTION_ID: "INST-1",
    SPREADSHEET_ID: "SHEET-1"
  })[key] || "" }) },
  SpreadsheetApp: { flush: () => {}, openById: id => { assert.equal(id, "SHEET-1"); return { getSheetByName: name => name === "CatalogoCredencialesServicios" ? { getDataRange: () => ({ getValues: () => credentialRows.map(row => row.slice()) }) } : null }; } },
  recordInterServiceCredentialUsage_: event => { auditEvents.push(event); return { recorded: true }; },
  Utilities: {
    MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
    DigestAlgorithm: { SHA_256: "SHA_256" },
    Charset: { UTF_8: "UTF_8" },
    computeDigest(_algorithm, value) { return Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest()).map(byte => byte > 127 ? byte - 256 : byte); },
    computeHmacSignature(algorithm, message, key) {
      assert.equal(algorithm, "HMAC_SHA_256");
      return Array.from(crypto.createHmac("sha256", key).update(String(message)).digest());
    },
    getUuid: () => "12345678-1234-1234-1234-123456789012"
  },
  UrlFetchApp: { fetch(url, options) {
    assert.equal(url, "https://script.google.com/macros/s/AKfycbUSER123/exec");
    assert.equal(options.method, "post");
    lastEnvelope = JSON.parse(options.payload);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify(remoteResponse) };
  } },
  ContentService: { MimeType: { TEXT: "text/plain" }, createTextOutput(value) {
    return { value, setMimeType() { return this; } };
  } },
  validateImportPreview(payload) {
    if (payload.sessionToken === "THROW") throw new Error("INTERNAL_SECRET_PATH");
    return { status: "success", validForImport: true, filasValidas: 1 };
  },
  getImportMappingProfiles: () => ({ status: "success", profiles: [{ profileId: "PROFILE-1" }] }),
  saveImportMappingProfile: () => ({ status: "success", profileId: "PROFILE-1", version: 1 }),
  importDataWithColumnMapping(payload) {
    if (payload.previewConfirmed !== true || !payload.previewHash) throw new Error("IMPORT_PREVIEW_INVALID_OR_STALE");
    if (payload.previewHash === "constructor") throw new Error("constructor");
    return { status: "success", registrosImportados: 1 };
  }
};
const registryBootstrap = 'const IMA_LOCAL_SERVICE_ID_ = "ACCOUNTING"; const IMA_CREDENTIAL_CATALOG_HEADERS_ = ' + JSON.stringify(credentialHeaders) + ';';
vm.runInNewContext(registryBootstrap + "\n" + accountingFns.join("\n") + "\nthis.api = { auth: getVerifiedAccountingIdentity_, permission: accountingHasInstitutionalImportPermission_, department: getVerifiedDepartmentScopeForSession_, post: doPost, get: doGet, publicMessage: apiResponsePublicMessage_ };", accountingRuntime);

{
  const identity = accountingRuntime.api.auth({ sessionToken: "SIGNED-LIVE-SESSION" });
  assert.equal(identity.authorized, true);
  assert.equal(identity.userId, "U-1");
  assert.equal(lastEnvelope.action, "verifyAccountingSession");
  assert.equal(auditEvents.length, 1, "ACCOUNTING outbound authorization request is audited");
  assert.equal(auditEvents[0].direction, "OUTBOUND");
  assert.equal(auditEvents[0].sourceService, "ACCOUNTING");
  assert.equal(auditEvents[0].targetService, "USER");
  const body = [lastEnvelope.requestId, lastEnvelope.timestamp, lastEnvelope.correlationId,
    lastEnvelope.sourceService, lastEnvelope.targetService, lastEnvelope.action, JSON.stringify(lastEnvelope.payload)].join("|");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(lastEnvelope.hmacSignature, expected, "ACCOUNTING signs the exact USER envelope contract");
  assert.equal(accountingRuntime.api.permission({ roleId: "Director", userId: "U-1", sessionToken: "SIGNED-LIVE-SESSION" }), true);
  remoteResponse = { status: "error", code: "IMPORT_PERMISSION_DENIED" };
  assert.equal(accountingRuntime.api.permission({ roleId: "Director", userId: "U-1", sessionToken: "SIGNED-LIVE-SESSION" }), false);
  remoteResponse = { status: "success", authorized: true, userId: "U-1", role: "Director", membershipId: "MEM-1", institutionId: "INST-1" };
  const department = accountingRuntime.api.department({ sessionToken: "SIGNED-LIVE-SESSION" });
  assert.equal(department.valid, true);
  assert.equal(department.membershipId, "MEM-1");
  assert.equal(accountingRuntime.api.get().value.includes('"service":"ACCOUNTING"'), true);
  assert.equal(accountingRuntime.validateApiContractsTestSuite().todasPruebasPasaron, true);
  const ok = accountingRuntime.api.post({ postData: { contents: JSON.stringify({ action: "validateImportPreview", payload: { sessionToken: "SIGNED-LIVE-SESSION" } }) } });
  assert.equal(JSON.parse(ok.value).validForImport, true);
  const profiles = accountingRuntime.api.post({ postData: { contents: JSON.stringify({ action: "getImportMappingProfiles", payload: { sessionToken: "SIGNED-LIVE-SESSION" } }) } });
  assert.equal(JSON.parse(profiles.value).profiles[0].profileId, "PROFILE-1");
  const savedProfile = accountingRuntime.api.post({ postData: { contents: JSON.stringify({ action: "saveImportMappingProfile", payload: { sessionToken: "SIGNED-LIVE-SESSION" } }) } });
  assert.equal(JSON.parse(savedProfile.value).version, 1);
  const deniedAction = accountingRuntime.api.post({ postData: { contents: JSON.stringify({ action: "deleteAll", payload: {} }) } });
  assert.equal(JSON.parse(deniedAction.value).code, "ACTION_NOT_ALLOWED");
  const missingConfirmation = accountingRuntime.api.post({ postData: { contents: JSON.stringify({ action: "importDataWithColumnMapping", payload: {} }) } });
  assert.equal(JSON.parse(missingConfirmation.value).code, "IMPORT_PREVIEW_INVALID_OR_STALE");
  const committed = accountingRuntime.api.post({ postData: { contents: JSON.stringify({
    action: "importDataWithColumnMapping", correlationId: "IMPORT-CORRELATION-001",
    payload: { previewConfirmed: true, previewHash: "HASH-1" }
  }) } });
  assert.equal(JSON.parse(committed.value).registrosImportados, 1);
  const prototypeCode = accountingRuntime.api.post({ postData: { contents: JSON.stringify({
    action: "importDataWithColumnMapping", payload: { previewConfirmed: true, previewHash: "constructor" }
  }) } });
  assert.equal(JSON.parse(prototypeCode.value).code, "INTERNAL_ERROR", "prototype keys never pass the public error allowlist");
  assert.equal(accountingRuntime.api.publicMessage("constructor"), "No fue posible completar la solicitud.");
  const malformed = accountingRuntime.api.post({ postData: { contents: "{bad" } });
  assert.equal(JSON.parse(malformed.value).code, "INTERNAL_ERROR");
  const safeError = accountingRuntime.api.post({ postData: { contents: JSON.stringify({ action: "validateImportPreview", payload: { sessionToken: "THROW" } }) } });
  assert.equal(JSON.parse(safeError.value).code, "INTERNAL_ERROR");
  assert.equal(JSON.parse(safeError.value).message, "No fue posible completar la solicitud.");
}

process.stdout.write("Accounting import authentication and HTTP router contract: all assertions passed.\n");
