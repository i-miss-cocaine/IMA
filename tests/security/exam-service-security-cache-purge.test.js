"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
function fixture(options = {}) {
  const calls = { permission: 0, identity: 0, cache: 0, removed: [], put: [] };
  const runtime = {
    validateRolePermission(action, payload) {
      calls.permission++;
      calls.action = action;
      calls.payload = payload;
      return { authorized: options.denied !== true };
    },
    getVerifiedExamIdentity_(payload) {
      calls.identity++;
      return options.invalidIdentity ? { authorized: false } : { authorized: true, userId: "ADMIN-1", role: "Administrador" };
    },
    CacheService: { getScriptCache() {
      calls.cache++;
      return {
        remove(key) { calls.removed.push(key); if (options.cacheFailure) throw new Error("cache unavailable"); },
        put(key, value, ttl) { calls.put.push([key, value, ttl]); if (options.cacheFailure) throw new Error("cache unavailable"); }
      };
    }},
    Date,
    console: { error() {} }
  };
  vm.runInNewContext(extract("purgeSecurityCaches"), runtime);
  return { calls, call(payload) { return runtime.purgeSecurityCaches(payload); } };
}
let scenarios = 0;
function test(fn) { fn(); scenarios++; }
test(() => {
  const x = fixture();
  const result = x.call({ sessionToken: "signed", eventType: "SESSION_REVOKED", sessionId: "S-1",
    targetUserId: "U-1", targetRole: "Profesor", accountState: "Inactiva" });
  assert.equal(result.status, "success");
  assert.equal(x.calls.action, "purgeSecurityCaches");
  assert.equal(x.calls.permission, 1);
  assert.equal(x.calls.identity, 1);
  assert.equal(x.calls.cache, 1);
  assert.ok(x.calls.put.some(v => v[0] === "revoked_session_S-1" && v[1] === "REVOKED" && v[2] === 86400));
  assert.ok(x.calls.put.some(v => v[0] === "revoked_user_U-1"));
  assert.ok(!x.calls.removed.includes("revoked_session_S-1"));
  assert.ok(x.calls.removed.includes("user_role_U-1"));
  assert.ok(x.calls.removed.includes("perm_matrix_Profesor"));
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call({ sessionToken: "signed", sessionId: "S-2" }), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.calls.permission, 1);
  assert.equal(x.calls.identity, 0);
  assert.equal(x.calls.cache, 0);
});
test(() => {
  const x = fixture({ invalidIdentity: true });
  assert.throws(() => x.call({ sessionToken: "bad", sessionId: "S-3" }), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.calls.permission, 1);
  assert.equal(x.calls.identity, 1);
  assert.equal(x.calls.cache, 0);
});
test(() => {
  const x = fixture();
  const result = x.call({ sessionToken: "signed", eventType: "ACCOUNT_STATE_CHANGED",
    targetUserId: "U-2", accountState: "Activa" });
  assert.equal(result.status, "success");
  assert.ok(x.calls.removed.includes("revoked_user_U-2"));
  assert.ok(!x.calls.put.some(v => v[0] === "revoked_user_U-2"));
});
test(() => {
  const x = fixture();
  x.call({ sessionToken: "signed", eventType: "GENERIC_PURGE", sessionId: "S-4" });
  assert.ok(x.calls.removed.includes("revoked_session_S-4"));
  assert.ok(!x.calls.put.some(v => v[0] === "revoked_session_S-4"));
});
test(() => {
  const x = fixture({ denied: true });
  assert.throws(() => x.call([]), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.calls.cache, 0);
  assert.equal(Object.keys(x.calls.payload).length, 0);
});
test(() => {
  const x = fixture({ cacheFailure: true });
  const result = x.call({ sessionToken: "signed", targetRole: "Profesor" });
  assert.equal(result.status, "error");
});
console.log("exam-service-security-cache-purge: " + scenarios + "/" + scenarios + " PASS");
