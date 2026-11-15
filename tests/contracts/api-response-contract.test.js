"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const http = require("node:http");

const root = path.resolve(__dirname, "../..");
const apiSource = fs.readFileSync(path.join(root, "js/api.js"), "utf8");
const academicSource = fs.readFileSync(path.join(root, "backend/academic-service/Code.gs"), "utf8");
const accountingSource = fs.readFileSync(path.join(root, "backend/accounting-service/Code.gs"), "utf8");
new vm.Script(apiSource, { filename: "js/api.js" });
new vm.Script(academicSource, { filename: "backend/academic-service/Code.gs" });
new vm.Script(accountingSource, { filename: "backend/accounting-service/Code.gs" });

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { lineComment = true; i++; continue; }
    if (c === "/" && next === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

function makeServiceContext(source, service) {
  const names = ["apiResponseCorrelationId_", "apiResponsePublicMessage_", "buildApiResponseEnvelope_", "textResponse", "validateApiContractsTestSuite"];
  const functions = names.map(name => extractFunction(source, name)).join("\n");
  const context = {
    API_RESPONSE_VERSION: "1.0.0",
    ContentService: {
      MimeType: { TEXT: "text/plain" },
      createTextOutput(content) {
        return {
          content,
          mimeType: null,
          getContent() { return this.content; },
          setMimeType(value) { this.mimeType = value; return this; }
        };
      }
    },
    Utilities: { getUuid: () => service + "-CORRELATION-12345678" },
    Date, Math, Number, String, Object, Array, JSON, isFinite
  };
  vm.createContext(context);
  vm.runInContext(functions + "\nthis.build = buildApiResponseEnvelope_; this.respond = textResponse; this.suite = validateApiContractsTestSuite;", context);
  return context;
}

for (const [name, source] of [["ACADEMIC", academicSource], ["ACCOUNTING", accountingSource]]) {
  const service = makeServiceContext(source, name);
  const suite = service.suite();
  assert.equal(suite.status, "success", name + " API contract suite must pass");
  assert.equal(suite.todasPruebasPasaron, true);
  const successOutput = service.respond({ status: "success", data: [], sample: "ok" }, "TEST-CORRELATION-0001", name);
  const success = JSON.parse(successOutput.getContent());
  assert.equal(successOutput.mimeType, "text/plain", "GAS text transport is retained and JSON is validated by contract");
  assert.equal(success.apiVersion, "1.0.0");
  assert.equal(success.status, "success", JSON.stringify(success));
  assert.deepEqual(success.data, []);
  assert.equal(success.sample, "ok");
  assert.equal(success.meta.correlationId, "TEST-CORRELATION-0001");
  const failureOutput = service.respond({ status: "error", code: "INTERNAL_ERROR", message: "private stack /secret/path" }, "TEST-CORRELATION-0002", name);
  const failure = JSON.parse(failureOutput.getContent());
  assert.equal(failure.status, "error");
  assert.equal(failure.error.code, "INTERNAL_ERROR");
  assert.equal(failure.error.message, "No fue posible completar la solicitud.");
  assert.equal(Object.prototype.hasOwnProperty.call(failure, "data"), false);
  assert.doesNotMatch(JSON.stringify(failure), /private stack|secret\/path/);
}

const clientNames = ["createApiClientCorrelationId", "apiClientPublicMessage", "createApiClientError", "normalizeApiClientResponse", "showApiToast", "fetchApi"];
const clientFunctions = 'var API_RESPONSE_VERSION = "1.0.0";\n' + clientNames.map(name => extractFunction(apiSource, name)).join("\n");
const silentConsole = { log() {}, warn() {}, error() {} };
function makeClient(url) {
  const context = {
    SERVICE_URLS: { ACADEMIC: url, ACCOUNTING: url, USER: url },
    fetch,
    AbortController,
    setTimeout(fn, ms) { return setTimeout(fn, ms === 60000 ? 25 : ms); },
    clearTimeout,
    localStorage: { getItem: () => null },
    sessionStorage: { getItem: () => null },
    document: { body: null },
    console: silentConsole,
    Date, Math, Number, String, Object, Array, JSON, Promise
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(clientFunctions, context);
  return context;
}

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    req.resume();
    const send = (status, type, body) => { res.writeHead(status, { "content-type": type }); res.end(body); };
    if (pathname === "/timeout") {
      setTimeout(() => {
        if (!res.destroyed && !res.writableEnded) {
          const delayedMeta = { timestamp: new Date().toISOString(), correlationId: "DELAYED-CORRELATION-123456" };
          send(200, "text/plain", JSON.stringify({ apiVersion: "1.0.0", status: "success", data: [], meta: delayedMeta }));
        }
      }, 250);
      return;
    }
    const meta = { timestamp: new Date().toISOString(), correlationId: "SERVER-CORRELATION-123456" };
    if (pathname === "/success") return send(200, "text/plain", JSON.stringify({ apiVersion: "1.0.0", status: "success", data: [{ id: 1 }], meta }));
    if (pathname === "/empty") return send(200, "text/plain", JSON.stringify({ apiVersion: "1.0.0", status: "success", data: [], meta }));
    if (pathname === "/error") return send(200, "text/plain", JSON.stringify({ apiVersion: "1.0.0", status: "error", error: { code: "RESOURCE_NOT_FOUND", message: "El recurso solicitado no está disponible.", details: null }, meta }));
    if (pathname === "/invalid-json") return send(200, "text/plain", "{invalid json");
    if (pathname === "/html") return send(200, "text/html", "<html><body>Gateway error</body></html>");
    if (pathname === "/http-error") return send(503, "text/plain", JSON.stringify({ apiVersion: "1.0.0", status: "error", error: { code: "DEPENDENCY_UNAVAILABLE", message: "El servicio no está disponible temporalmente.", details: null }, meta }));
    if (pathname === "/missing-version") return send(200, "text/plain", JSON.stringify({ status: "success", data: [] }));
    if (pathname === "/missing-data") return send(200, "text/plain", JSON.stringify({ apiVersion: "1.0.0", status: "success", meta }));
    if (pathname === "/legacy") return send(200, "text/plain", JSON.stringify({ status: "success", data: [] }));
    return send(404, "text/plain", JSON.stringify({ status: "error", code: "RESOURCE_NOT_FOUND", message: "not found" }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
  const client = makeClient(base + "/success");
  async function call(pathname, service) {
    client.SERVICE_URLS[service || "ACADEMIC"] = base + pathname;
    return client.fetchApi(service || "ACADEMIC", "getContractFixture", {}, 2);
  }

  const success = await call("/success");
  assert.equal(success.status, "success");
  assert.equal(success.apiVersion, "1.0.0");
  assert.equal(success.data[0].id, 1);
  assert.equal(success.isFallback, false);

  const empty = await call("/empty");
  assert.equal(empty.status, "success");
  assert.deepEqual(empty.data, [], "a legitimate empty collection remains success");

  const backendError = await call("/error");
  assert.equal(backendError.status, "error");
  assert.equal(backendError.error.code, "RESOURCE_NOT_FOUND");
  assert.equal(Object.prototype.hasOwnProperty.call(backendError, "data"), false);

  const invalidJson = await call("/invalid-json");
  assert.equal(invalidJson.status, "error");
  assert.equal(invalidJson.code, "INVALID_JSON_RESPONSE");
  assert.equal(invalidJson.isFallback, true);
  assert.equal(Object.prototype.hasOwnProperty.call(invalidJson, "data"), false);

  const html = await call("/html");
  assert.equal(html.status, "error");
  assert.equal(html.code, "HTML_RESPONSE");
  assert.equal(html.isFallback, true);

  const httpError = await call("/http-error");
  assert.equal(httpError.status, "error");
  assert.equal(httpError.error.code, "DEPENDENCY_UNAVAILABLE");
  assert.equal(httpError.meta.httpStatus, 503);
  assert.equal(Object.prototype.hasOwnProperty.call(httpError, "data"), false);

  const missingVersion = await call("/missing-version");
  assert.equal(missingVersion.code, "API_VERSION_REQUIRED");
  const missingData = await call("/missing-data");
  assert.equal(missingData.code, "INVALID_API_ENVELOPE");
  const legacy = await call("/legacy", "USER");
  assert.equal(legacy.status, "success");
  assert.equal(legacy.legacyAdapter, true);
  assert.deepEqual(legacy.data, []);

  const missingUrl = client.fetchApi("UNKNOWN", "getItems", {}, 2);
  const missingService = await missingUrl;
  assert.equal(missingService.status, "error");
  assert.equal(missingService.code, "SERVICE_URL_MISSING");
  assert.equal(Object.prototype.hasOwnProperty.call(missingService, "data"), false);

  const timeout = await call("/timeout");
  assert.equal(timeout.status, "error");
  assert.equal(timeout.code, "REQUEST_TIMEOUT");
  assert.equal(timeout.isFallback, true);
  assert.equal(Object.prototype.hasOwnProperty.call(timeout, "data"), false);

  client.SERVICE_URLS.ACADEMIC = "http://127.0.0.1:1/unreachable";
  const networkFailure = await client.fetchApi("ACADEMIC", "getItems", {}, 2);
  assert.equal(networkFailure.status, "error");
  assert.equal(networkFailure.code, "NETWORK_ERROR");
  assert.equal(Object.prototype.hasOwnProperty.call(networkFailure, "data"), false);

  assert.doesNotMatch(clientSourceForStaticCheck(apiSource), /innerHTML\s*=/, "API error messages must be rendered as text");
  console.log("PASS: versioned response envelope, both backend services, strict client validation and local HTTP success/error/empty/invalid JSON/HTML/HTTP 503/timeout/network failure");
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
function clientSourceForStaticCheck(source) { return source.slice(source.indexOf("function fetchApi("), source.indexOf("/**\n * REQ-EXP-017")); }
main().catch(error => { console.error(error); process.exitCode = 1; });
