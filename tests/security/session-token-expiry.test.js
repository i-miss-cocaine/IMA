const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const serviceFiles = [
  ["USER", "backend/user-service/Code.gs"],
  ["ACADEMIC", "backend/academic-service/Code.gs"],
  ["ACCOUNTING", "backend/accounting-service/Code.gs"],
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
function runVerifier(source, claims) {
  const fn = extractFunction(source, "verifySessionToken");
  const userRow = new Array(11).fill("");
  userRow[0] = "U1"; userRow[6] = "Estudiante"; userRow[10] = "Activa";
  const context = {
    getAuthTokenSecret: () => "secret",
    computeHmacSignature: () => "SIG",
    Utilities: {
      base64Decode: () => [],
      newBlob: () => ({ getDataAsString: () => JSON.stringify(claims) })
    },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: () => ({ getDataRange: () => ({ getValues: () => [[], userRow] }) }) })
    },
    SPREADSHEET_ID: "LOCAL"
  };
  vm.runInNewContext(fn + "\nthis.verify = verifySessionToken;", context);
  return context.verify("payload.SIG");
}
const now = Math.floor(Date.now() / 1000);
const cases = [
  ["valid", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now, exp: now + 3600 }, true],
  ["missing-exp", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now }, false],
  ["string-exp", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now, exp: String(now + 3600) }, false],
  ["expired", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now - 3600, exp: now - 1 }, false],
  ["equal-exp-iat", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now, exp: now }, false],
  ["long-lifetime", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now, exp: now + 86401 }, false],
  ["future-iat", { userId: "U1", role: "Estudiante", sessionId: "S1", iat: now + 61, exp: now + 3600 }, false],
  ["missing-user", { role: "Estudiante", sessionId: "S1", iat: now, exp: now + 3600 }, false],
  ["missing-role", { userId: "U1", sessionId: "S1", iat: now, exp: now + 3600 }, false],
  ["missing-session", { userId: "U1", role: "Estudiante", iat: now, exp: now + 3600 }, false]
];
for (const [name, file] of serviceFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  new vm.Script(source, { filename: file });
  for (const [label, claims, expected] of cases) {
    const actual = runVerifier(source, claims) !== null;
    assert.equal(actual, expected, name + "/" + label);
  }
}
const userSource = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
const generateFn = extractFunction(userSource, "generateSessionToken");
let encoded = "";
const generationContext = {
  getAuthTokenSecret: () => "secret",
  computeHmacSignature: () => "SIG",
  Utilities: {
    base64EncodeWebSafe(value) { encoded = value; return "payload"; },
    getUuid: () => "S1"
  }
};
vm.runInNewContext(generateFn + "\nthis.generate = generateSessionToken;", generationContext);
const token = generationContext.generate({ userId: "U1", email: "u@example.test", role: "Estudiante" });
const generatedClaims = JSON.parse(encoded);
assert.equal(token, "payload.SIG");
assert.ok(Number.isSafeInteger(generatedClaims.iat));
assert.ok(Number.isSafeInteger(generatedClaims.exp));
assert.equal(generatedClaims.exp - generatedClaims.iat, 86400);
process.stdout.write("session-token-expiry: 50 verifier cases + generation assertions passed\n");
