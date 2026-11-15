"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const userSource = fs.readFileSync(path.resolve(__dirname, "../../backend/user-service/Code.gs"), "utf8");
const accountingSource = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
function extract(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start), depthState = { depth: 0, quote: "", escaped: false, line: false, block: false };
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (depthState.line) { if (ch === "\n") depthState.line = false; continue; }
    if (depthState.block) { if (ch === "*" && next === "/") { depthState.block = false; i++; } continue; }
    if (depthState.quote) {
      if (depthState.escaped) depthState.escaped = false;
      else if (ch === "\\") depthState.escaped = true;
      else if (ch === depthState.quote) depthState.quote = "";
      continue;
    }
    if (ch === "/" && next === "/") { depthState.line = true; i++; continue; }
    if (ch === "/" && next === "*") { depthState.block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { depthState.quote = ch; continue; }
    if (ch === "{") depthState.depth++;
    else if (ch === "}" && --depthState.depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function: " + name);
}

const headers = ["idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataforma","institucionId","hashRegistroOrigen","fechaMigracion","versionMapeo","estadoCorrespondencia","metodoCoincidencia","nivelConfianza","migradoPor"];
const rows = [
  headers,
  ["M-1","LEGACY","curso","C-1","COURSE-1","INST-1","H1","2026-11-15","1","CONFIRMADA","EXACTA","ALTA","U-1"],
  ["M-2","LEGACY","curso","C-2","","INST-1","H2","2026-11-15","1","PENDIENTE_REVISION","EXACTA","MEDIA","U-1"],
  ["M-3","LEGACY","curso","C-OTHER","COURSE-X","INST-2","H3","2026-11-15","1","CONFIRMADA","EXACTA","ALTA","U-2"],
  ["M-4","LEGACY","persona","P-1","PERSON-1","INST-1","H4","2026-11-15","1","CONFIRMADA","EXACTA","ALTA","U-1"]
];
let permission = true, sheetAvailable = true;
const userContext = {
  String, Array, Object, JSON, RegExp, Error,
  verifySessionToken: token => token === "SIGNED" ? { userId: "U-1", role: "Administrador", institutionId: "INST-1" } : null,
  getIdentityInstitutionId_: () => "INST-1",
  getDynamicPermissionsForRole: () => permission,
  getIdentityMappingSheet_: () => {
    if (!sheetAvailable) throw new Error("IDENTITY_MAPPING_NOT_INITIALIZED");
    return { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
  }
};
vm.runInNewContext(extract(userSource, "identityCompositeKey_") + "\n" +
  extract(userSource, "getTrustedMigrationIdentityMapSnapshot_") +
  "\nthis.read=getTrustedMigrationIdentityMapSnapshot_;", userContext);

const request = { sessionToken: "SIGNED", institutionId: "INST-1",
  lookups: [{ sourceName: "LEGACY", entityType: "curso", legacyIds: ["C-1","C-2","MISSING"] },
    { sourceName: "LEGACY", entityType: "persona", legacyIds: ["P-1"] }] };
const snapshot = userContext.read(request);
assert.equal(snapshot.status, "success");
assert.equal(snapshot.verified, true);
assert.equal(snapshot.service, "USER");
assert.equal(snapshot.institutionId, "INST-1");
assert.equal(snapshot.entries.length, 3, "only requested identifiers from the current institution are returned");
assert.ok(snapshot.entries.every(entry => entry.institucionId === "INST-1"));
assert.ok(!snapshot.entries.some(entry => entry.idOriginalLegado === "C-OTHER"), "cross-tenant mappings are not disclosed");
assert.equal(snapshot.entries.find(entry => entry.idOriginalLegado === "C-2").estadoCorrespondencia, "PENDIENTE_REVISION");
assert.equal(snapshot.entries[0].hashRegistroOrigen, "H1");
assert.equal(snapshot.entries[0].versionMapeo, "1");
assert.ok(!Object.prototype.hasOwnProperty.call(snapshot.entries[0], "idMapeo"));
assert.ok(!Object.prototype.hasOwnProperty.call(snapshot.entries[0], "migradoPor"));

rows.push(rows[1].slice());
const duplicate = userContext.read(request);
assert.equal(duplicate.uniquenessViolations.length, 1);
assert.equal(duplicate.uniquenessViolations[0].count, 2);
rows.pop();

assert.equal(userContext.read({ ...request, sessionToken: "BAD" }).code, "VERIFIED_IDENTITY_REQUIRED");
assert.equal(userContext.read({ ...request, institutionId: "INST-2" }).code, "VERIFIED_IDENTITY_REQUIRED");
permission = false;
assert.equal(userContext.read(request).code, "IMPORT_PERMISSION_DENIED");
permission = true;
assert.equal(userContext.read({ ...request, lookups: [{ sourceName: "LEGACY", entityType: "curso!", legacyIds: ["C-1"] }] }).code,
  "IDENTITY_MAPPING_SNAPSHOT_INPUT_INVALID");
assert.equal(userContext.read({ ...request, lookups: [] }).code, "IDENTITY_MAPPING_SNAPSHOT_CONTRACT_INVALID");
sheetAvailable = false;
assert.equal(userContext.read(request).code, "IDENTITY_MAPPING_SNAPSHOT_UNAVAILABLE");

const secret = "migration-transport-secret-with-more-than-32-characters";
let captured = null, responseData = { verified: true, service: "USER", institutionId: "INST-1", entries: [], uniquenessViolations: [] };
const accountingContext = {
  String, Array, Object, JSON, RegExp, Error, Date, Math,
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({
    IMA_USER_SERVICE_URL: "https://user.example.test/exec", IMA_MIGRATION_HMAC_SECRET: secret
  })[key] || "" }) },
  isAccountingTrustedAppsScriptEndpoint_: url => url === "https://user.example.test/exec",
  createInterServiceEnvelope: () => ({}),
  Utilities: { getUuid: () => "12345678-1234-1234-1234-123456789012" },
  accountingComputeHmacSignature_: (message, key) => crypto.createHmac("sha256", key).update(String(message)).digest("hex"),
  UrlFetchApp: { fetch: (url, options) => {
    assert.equal(url, "https://user.example.test/exec");
    captured = JSON.parse(options.payload);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ status: "success", data: responseData }) };
  } }
};
vm.runInNewContext(extract(accountingSource, "requestAccountingIdentityMapSnapshot_") +
  "\nthis.read=requestAccountingIdentityMapSnapshot_;", accountingContext);
const remote = accountingContext.read({ sessionToken: "SIGNED", institutionId: "INST-1",
  lookups: [{ sourceName: "LEGACY", entityType: "curso", legacyIds: ["C-1"] }] });
assert.equal(remote.status, "success");
assert.equal(captured.sourceService, "ACCOUNTING");
assert.equal(captured.targetService, "USER");
assert.equal(captured.action, "getMigrationIdentityMapSnapshot");
const signedBody = [captured.requestId, captured.timestamp, captured.correlationId, captured.sourceService,
  captured.targetService, captured.action, JSON.stringify(captured.payload)].join("|");
assert.equal(captured.hmacSignature, crypto.createHmac("sha256", secret).update(signedBody).digest("hex"),
  "identity snapshot requests are HMAC-bound to the complete request");
responseData = { verified: false, service: "USER", institutionId: "INST-1", entries: [], uniquenessViolations: [] };
assert.equal(accountingContext.read({ sessionToken: "SIGNED", institutionId: "INST-1",
  lookups: [{ sourceName: "LEGACY", entityType: "curso", legacyIds: ["C-1"] }] }).code,
  "IDENTITY_MAPPING_SNAPSHOT_UNVERIFIED");
assert.ok(userSource.includes('verified.action==="getMigrationIdentityMapSnapshot"'), "USER trusted dispatcher exposes the signed identity snapshot action");
process.stdout.write("Migration identity snapshot: tenant isolation, pending mappings, duplicates, permission gates and HMAC transport PASS.\n");
