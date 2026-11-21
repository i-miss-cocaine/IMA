const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const serviceFiles = [
  ["USER", "backend/user-service/Code.gs"],
  ["DEVELOPER", "backend/developer-service/Code.gs"],
  ["ACADEMIC", "backend/academic-service/Code.gs"],
  ["TASK", "backend/task-service/Code.gs"],
  ["EXAM", "backend/exam-service/Code.gs"]
];
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, name + " exists");
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
  throw new Error("unbalanced function " + name);
}
function expectCode(fn, code) {
  let thrown = "";
  try { fn(); } catch (error) { thrown = String(error && error.message || error); }
  assert.ok(thrown.includes(code), "expected " + code + ", got " + thrown);
}
function createContext(source, initialSecret, claims) {
  let secretValue = initialSecret, propertyFailure = false;
  const userRow = new Array(11).fill("");
  userRow[0] = "U1"; userRow[6] = "Estudiante"; userRow[10] = "Activa";
  const versionRows = [["Clave","Version","UpdatedAt","UpdatedBy"],["USER_ROLE:U1",0,new Date(),""]];
  const versionSheet = { getDataRange: () => ({ getValues: () => versionRows.map(r => r.slice()) }) };
  const userSheet = { getDataRange: () => ({ getValues: () => [[], userRow] }) };
  const context = {
    PropertiesService: {
      getScriptProperties() {
        if (propertyFailure) throw new Error("properties unavailable");
        return { getProperty(name) { assert.equal(name, "AUTH_TOKEN_SECRET"); return secretValue; } };
      }
    },
    computeHmacSignature: (_payload, secret) => "SIG-" + secret,
    Utilities: {
      MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
      computeHmacSignature: (_algorithm, payload, secret) => Array.from(crypto.createHmac("sha256", secret).update(String(payload)).digest()),
      base64Decode: () => [],
      newBlob: () => ({ getDataAsString: () => JSON.stringify(claims) }),
      base64EncodeWebSafe: () => "payload",
      getUuid: () => "S1"
    },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    isSessionRevoked_: () => false,
    isSessionRevokedInSharedLedger_: () => false,
    verifyUserRoleMembershipClaim_: () => null,
    getUserRoleMembershipState_: () => ({ hasRecords: false }),
    resolveUserRoleMembership_: () => null,
    getIdentityInstitutionId_: () => "INST-1",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => name === "VersionesSeguridad" ? versionSheet : (name === "Usuarios" ? userSheet : null) }) },
    SPREADSHEET_ID: "LOCAL"
  };
  const secretFn = extractFunction(source, "getAuthTokenSecret");
  const verifyFn = extractFunction(source, "verifySessionToken");
  const versionPrelude = source.includes("var SECURITY_VERSION_HEADERS_") ? source.slice(source.indexOf("var SECURITY_VERSION_HEADERS_"), source.indexOf("function getDynamicPermissionsForRole")) : "";
  vm.runInNewContext(versionPrelude + "\n" + secretFn + "\n" + verifyFn + "\nthis.getSecret = getAuthTokenSecret; this.verify = verifySessionToken;", context);
  return {
    context,
    setSecret(value) { secretValue = value; },
    failProperties(value) { propertyFailure = value; }
  };
}
const now = Math.floor(Date.now() / 1000);
const claims = { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now, exp: now + 3600 };
for (const [name, file] of serviceFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  new vm.Script(source, { filename: file });
  const secretFn = extractFunction(source, "getAuthTokenSecret");
  assert.match(secretFn, /PropertiesService\.getScriptProperties\(\)\.getProperty\("AUTH_TOKEN_SECRET"\)/);
  assert.match(secretFn, /secret\.length < 32/);
  assert.doesNotMatch(secretFn, /SPREADSHEET_ID/);
  const state = createContext(source, "OLD_SECRET_012345678901234567890123456789", claims);
  assert.equal(state.context.getSecret(), "OLD_SECRET_012345678901234567890123456789");
  expectCode(() => { state.setSecret(""); state.context.getSecret(); }, "AUTH_TOKEN_SECRET_NOT_CONFIGURED");
  expectCode(() => { state.setSecret("short"); state.context.getSecret(); }, "AUTH_TOKEN_SECRET_NOT_CONFIGURED");
  state.setSecret("OLD_SECRET_012345678901234567890123456789");
  state.failProperties(true);
  expectCode(() => state.context.getSecret(), "AUTH_TOKEN_SECRET_UNAVAILABLE");
  state.failProperties(false);
  state.setSecret("OLD_SECRET_012345678901234567890123456789");
  const oldSignature = name === "DEVELOPER" ? crypto.createHmac("sha256", "OLD_SECRET_012345678901234567890123456789").update("payload").digest("hex") : "SIG-OLD_SECRET_012345678901234567890123456789";
  assert.ok(state.context.verify("payload." + oldSignature), name + " session token verifies with active secret");
  state.setSecret("NEW_SECRET_012345678901234567890123456789");
  assert.equal(state.context.verify("payload.SIG-OLD_SECRET_012345678901234567890123456789"), null);
  const newSignature = name === "DEVELOPER" ? crypto.createHmac("sha256", "NEW_SECRET_012345678901234567890123456789").update("payload").digest("hex") : "SIG-NEW_SECRET_012345678901234567890123456789";
  assert.ok(state.context.verify("payload." + newSignature), name + " session token verifies after secret rotation");
}
const userSource = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
const genFn = extractFunction(userSource, "generateSessionToken");
let currentSecret = "OLD_SECRET_012345678901234567890123456789";
const genContext = {
  SPREADSHEET_ID: "LOCAL",
  versionRows: [["Clave","Version","UpdatedAt","UpdatedBy"]],
  properties: {},
  versionSheet: null,
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => genContext.properties[key] || null, setProperty: (key,value) => genContext.properties[key] = value }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: name => name === "VersionesSeguridad" ? genContext.versionSheet : null, insertSheet: () => genContext.versionSheet }) },
  getAuthTokenSecret: () => currentSecret,
  computeHmacSignature: (_payload, secret) => "SIG-" + secret,
  Utilities: { base64EncodeWebSafe: () => "payload", getUuid: () => "S1" }
};
genContext.versionSheet = {
  getLastRow: () => genContext.versionRows.length,
  getDataRange: () => ({ getValues: () => genContext.versionRows.map(row => row.slice()) }),
  appendRow: row => genContext.versionRows.push(row.slice())
};
const versionPrelude = userSource.slice(userSource.indexOf("var SECURITY_VERSION_HEADERS_"), userSource.indexOf("function getDynamicPermissionsForRole"));
vm.runInNewContext(versionPrelude + "\n" + genFn + "\nthis.generate = generateSessionToken;", genContext);
const oldToken = genContext.generate({ userId: "U1", email: "u@example.test", role: "Estudiante" });
currentSecret = "NEW_SECRET_012345678901234567890123456789";
const newToken = genContext.generate({ userId: "U1", email: "u@example.test", role: "Estudiante" });
assert.notEqual(oldToken, newToken);
process.stdout.write("hmac-secret-config: 25 service assertions + rotation/generation passed\n");
