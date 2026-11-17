"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
function harness(service, options) {
  const opts = options || {}, path = service === "ACADEMIC" ? "backend/academic-service/Code.gs" : "backend/accounting-service/Code.gs";
  const source = fs.readFileSync(path, "utf8"), calls = [];
  const properties = { getProperty: key => key === "IMA_USER_SERVICE_URL" ? (opts.endpoint === undefined ? "https://script.google.com/macros/s/USER_DEPLOYMENT/exec" : opts.endpoint) : null };
  const context = {
    PropertiesService: { getScriptProperties: () => properties },
    UrlFetchApp: { fetch: (url, request) => { calls.push({ url, request }); if (opts.fetchThrows) throw new Error("transport down");
      return { getResponseCode: () => opts.httpStatus || 200, getContentText: () => opts.responseText === undefined ? JSON.stringify(opts.response || { status: "success", data: [{ clave: "feature.flag" }] }) : opts.responseText }; } },
    getVerifiedAcademicIdentity_: () => opts.identity || { authorized: true, userId: "U-1", role: "Director" },
    getVerifiedAccountingIdentity_: () => opts.identity || { authorized: true, userId: "U-1", role: "Director", institutionId: "INST-1" },
    isAccountingTrustedAppsScriptEndpoint_: url => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url),
    JSON, String, Array, Object, Number, Boolean, Error
  };
  vm.runInNewContext(["requestHierarchicalConfigurationFromUser_", "getHierarchicalConfigurationCatalog", "resolveHierarchicalConfiguration"].map(n => extractFunction(source, n)).join("\n"), context);
  return { context, calls };
}
for (const service of ["ACADEMIC", "ACCOUNTING"]) {
  let h = harness(service);
  let result = h.context.getHierarchicalConfigurationCatalog({ sessionToken: "signed-token", authRole: "Forged", institutionId: "FORGED" });
  assert.equal(result.status, "success"); assert.equal(result.data.length, 1); assert.equal(h.calls.length, 1);
  let sent = JSON.parse(h.calls[0].request.payload);
  assert.equal(sent.action, "getHierarchicalConfigurationCatalog");
  assert.deepEqual(Object.keys(sent.payload), ["sessionToken"], "only signed session token crosses the service boundary");
  h = harness(service, { response: { status: "success", clave: "feature.flag", valor: "department", origenEfectivo: "DEPARTAMENTAL" } });
  result = h.context.resolveHierarchicalConfiguration({ sessionToken: "signed-token", clave: "feature.flag", activeDepartmentId: "D-1", userId: "U-OTHER", role: "Administrador" });
  assert.equal(result.status, "success"); assert.equal(result.clave, "feature.flag");
  sent = JSON.parse(h.calls[0].request.payload);
  assert.deepEqual(sent.payload, { sessionToken: "signed-token", clave: "feature.flag", activeDepartmentId: "D-1" });
  h = harness(service); result = h.context.resolveHierarchicalConfiguration({ sessionToken: "signed-token", clave: "feature.flag" });
  assert.equal(result.code, "HIERARCHICAL_CONFIG_RESPONSE_MISMATCH");
  h = harness(service, { identity: { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" } });
  result = h.context.getHierarchicalConfigurationCatalog({ sessionToken: "" }); assert.equal(result.code, "VERIFIED_IDENTITY_REQUIRED"); assert.equal(h.calls.length, 0);
  h = harness(service, { endpoint: "http://untrusted.invalid" });
  result = h.context.getHierarchicalConfigurationCatalog({ sessionToken: "signed-token" }); assert.equal(result.code, "HIERARCHICAL_CONFIG_TRANSPORT_NOT_CONFIGURED"); assert.equal(h.calls.length, 0);
  h = harness(service, { httpStatus: 503, response: { status: "error", code: "USER_UNAVAILABLE" } });
  result = h.context.getHierarchicalConfigurationCatalog({ sessionToken: "signed-token" }); assert.equal(result.code, "USER_UNAVAILABLE");
  h = harness(service, { responseText: "<html>bad gateway</html>" });
  result = h.context.getHierarchicalConfigurationCatalog({ sessionToken: "signed-token" }); assert.equal(result.code, "HIERARCHICAL_CONFIG_RESPONSE_INVALID");
  h = harness(service, { fetchThrows: true });
  result = h.context.getHierarchicalConfigurationCatalog({ sessionToken: "signed-token" }); assert.equal(result.code, "HIERARCHICAL_CONFIG_AUTHORITY_UNAVAILABLE");
  h = harness(service);
  result = h.context.requestHierarchicalConfigurationFromUser_("saveSystemConfiguration", { sessionToken: "signed-token" });
  assert.equal(result.code, "HIERARCHICAL_CONFIG_ACTION_NOT_ALLOWED"); assert.equal(h.calls.length, 0);
}
console.log("ACADEMIC/ACCOUNTING hierarchical configuration consumer integration contract PASS (18 checks).");
