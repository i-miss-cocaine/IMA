const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const apiSource = fs.readFileSync(path.join(root, "js/api.js"), "utf8");
const authSource = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const userSource = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
new vm.Script(userSource, { filename: "backend/user-service/Code.gs" });
new vm.Script(apiSource, { filename: "js/api.js" });
assert.ok(authSource.includes("sessionToken: result.data.sessionToken || result.sessionToken || null"),
  "login stores the signed session token");
assert.ok(authSource.includes("storage.setItem('currentUser', JSON.stringify(userData))"),
  "login persists currentUser with the signed token");

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
  throw new Error("unbalanced function " + name);
}
const fetchApiFn = extractFunction(apiSource, "fetchApi");
assert.ok(fetchApiFn.includes("enrichedPayload.sessionToken = currentUser.sessionToken"));
assert.ok(fetchApiFn.includes("delete enrichedPayload.authToken") && fetchApiFn.includes("delete enrichedPayload.token"));
assert.ok(!fetchApiFn.includes("!enrichedPayload.sessionToken"), "payload credentials must not block session-token injection");

async function invoke(currentUser, action, payload) {
  let sent = null;
  const storage = {
    getItem(key) { return key === "currentUser" && currentUser ? JSON.stringify(currentUser) : null; }
  };
  const context = {
    window: { SERVICE_URLS: { USER: "https://unit.test/user" } },
    localStorage: storage,
    sessionStorage: { getItem() { return null; } },
    AbortController: undefined,
    document: { body: null },
    console: { error() {}, warn() {}, log() {} },
    fetch(_url, options) {
      sent = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        headers: { get() { return "application/json"; } },
        text() { return Promise.resolve('{"status":"success","data":[]}'); }
      });
    }
  };
  vm.runInNewContext(fetchApiFn + "\nthis.callFetchApi = fetchApi;", context);
  await context.callFetchApi("USER", action, payload);
  return { sent, original: payload };
}

(async function main() {
  const spoofed = {
    sessionToken: "ATTACKER_SESSION", authToken: "ATTACKER_AUTH", token: "ATTACKER_TOKEN",
    requesterUserId: "U-ATTACKER", requesterRole: "Administrador", userId: "U-ATTACKER"
  };
  const authenticated = await invoke(
    { sessionToken: "SIGNED_SESSION", userId: "U-REAL", rol: "Docente" },
    "getUserInfo", spoofed
  );
  assert.equal(authenticated.sent.payload.sessionToken, "SIGNED_SESSION");
  assert.equal(authenticated.sent.payload.authToken, undefined);
  assert.equal(authenticated.sent.payload.token, undefined);
  assert.equal(authenticated.sent.payload.requesterUserId, "U-REAL");
  assert.equal(authenticated.sent.payload.requesterRole, "Docente");
  assert.equal(authenticated.original.sessionToken, "ATTACKER_SESSION", "input payload is not mutated");

  const noSession = await invoke(null, "getUserInfo", {
    sessionToken: "FORGED", authToken: "FORGED_AUTH", token: "FORGED_TOKEN",
    requesterUserId: "U-FORGED", requesterRole: "Administrador"
  });
  for (const key of ["sessionToken","authToken","token","requesterUserId","requesterRole"]) {
    assert.equal(noSession.sent.payload[key], undefined, "no local session: remove " + key);
  }

  const recovery = await invoke(
    { sessionToken: "SIGNED_SESSION", userId: "U-REAL", rol: "Docente" },
    "resetPassword", { token: "PASSWORD_RECOVERY_CAPABILITY", email: "user@example.test" }
  );
  assert.equal(recovery.sent.payload.token, "PASSWORD_RECOVERY_CAPABILITY",
    "password recovery capability is preserved for resetPassword");
  assert.equal(recovery.sent.payload.sessionToken, undefined,
    "auth bootstrap action does not receive the previous session token");


  const getVerifiedFn = extractFunction(userSource, "getUserVerifiedRole");
  const permissionFn = extractFunction(userSource, "validateRolePermission");
  const doPostFn = extractFunction(userSource, "doPost");
  const backendContext = {
    PUBLIC_ACTIONS: [],
    IDENTITY_MANAGER_ACTIONS_: [],
    IDENTITY_MANAGER_ROLES_: [],
    TICKET_ADMIN_ROLES_: ["Administrador","Desarrollador","Director"],
    ROLE_PERMISSIONS: { Estudiante: ["getUserInfo"] },
    verifySessionToken(token) {
      return token === "SIGNED_SESSION" ? { userId: "U-REAL", role: "Estudiante" } : null;
    },
    validateContextualAccess: () => ({ authorized: true }),
    getDynamicPermissionsForRole: () => null,
    hasActiveDelegationForAction: () => false,
    logStructuredEvent() {},
    checkAndRegisterIdempotencyKey: () => null,
    getUserInfo(payload) { return { status: "success", userId: payload._verifiedUserId }; },
    textResponse(value) { return JSON.stringify(value); }
  };
  vm.runInNewContext(getVerifiedFn + "\n" + permissionFn + "\n" + doPostFn +
    "\nthis.callUserPost = doPost;", backendContext);
  const validProtected = JSON.parse(backendContext.callUserPost({
    postData: { contents: JSON.stringify({
      action: "getUserInfo",
      payload: { sessionToken: "SIGNED_SESSION", userId: "U-SPOOFED", authRole: "Administrador" }
    }) }
  }));
  assert.equal(validProtected.status, "success");
  assert.equal(validProtected.userId, "U-REAL", "backend derives identity from verified claims");
  const missingToken = JSON.parse(backendContext.callUserPost({
    postData: { contents: JSON.stringify({ action: "getUserInfo", payload: { userId: "U-REAL", authRole: "Administrador" } }) }
  }));
  assert.equal(missingToken.code, "AUTH_PERMISSION_DENIED", "protected operation rejects missing session");
  const invalidToken = JSON.parse(backendContext.callUserPost({
    postData: { contents: JSON.stringify({ action: "getUserInfo", payload: { sessionToken: "FORGED", userId: "U-REAL" } }) }
  }));
  assert.equal(invalidToken.code, "AUTH_PERMISSION_DENIED", "protected operation rejects invalid session");

  process.stdout.write("session-token-transport: all assertions passed\n");
})().catch(error => { console.error(error); process.exitCode = 1; });
