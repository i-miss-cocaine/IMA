const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const start = source.indexOf("function handleSignatureProviderCallback_(");
assert.notEqual(start, -1, "missing handleSignatureProviderCallback_");
const next = source.indexOf("\nfunction ", start + 10);
const callbackSource = source.slice(start, next < 0 ? source.length : next);

function makeHarness(options = {}) {
  const state = { held: false, lockAttempts: 0, releases: 0, cacheGets: 0, cachePuts: 0,
    events: [], propertiesReads: [], signedBodies: [], nestedError: "" };
  const cache = new Map();
  const secret = options.secret === undefined ? "S".repeat(48) : options.secret;
  const context = {
    Date,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => {
      state.propertiesReads.push(key);
      if (options.propertiesThrows) throw new Error("unavailable");
      return secret;
    }})},
    computeHmacSignature: (body, key) => {
      state.signedBodies.push({ body, key });
      return options.computedSignature || "a".repeat(64);
    },
    LockService: { getScriptLock: () => ({
      tryLock: () => { state.lockAttempts++; if (options.lockBusy || state.held) return false; state.held = true; return true; },
      releaseLock: () => { assert.equal(state.held, true); state.held = false; state.releases++; }
    })},
    CacheService: { getScriptCache: () => ({
      get: key => { state.cacheGets++; return cache.get(key) || null; },
      put: (key, value, ttl) => {
        state.cachePuts++;
        assert.equal(ttl, 600);
        cache.set(key, value);
        if (options.onCachePut) options.onCachePut();
      }
    })},
    logStructuredEvent: (...args) => state.events.push(args)
  };
  vm.runInNewContext(callbackSource, context);
  const makeEnvelope = (overrides = {}) => ({
    sourceService: "SIGNATURE_PROVIDER:PSC_TEST",
    targetService: "USER",
    action: "signatureStatusCallback",
    requestId: "request-0001",
    timestamp: Date.now(),
    correlationId: "corr-0001",
    hmacSignature: "a".repeat(64),
    payload: { transaccionId: "TX-001", estadoProveedor: "SIGNED", referenciaEvento: "event-001" },
    ...overrides
  });
  return { invoke: envelope => context.handleSignatureProviderCallback_(envelope), makeEnvelope, state, cache };
}

{
  const h = makeHarness();
  const envelope = h.makeEnvelope();
  const result = h.invoke(envelope);
  assert.equal(result.status, "accepted");
  assert.equal(result.code, "SIGNATURE_CALLBACK_AUTHENTICATED_PENDING_VALIDATION");
  assert.equal(result.callbackAuthenticated, true);
  assert.equal(result.proveedorId, "PSC_TEST");
  assert.equal(result.transaccionId, "TX-001");
  assert.equal(result.estadoProveedorRecibido, "SIGNED");
  assert.equal(result.estadoTransaccionActualizado, false);
  assert.equal(result.verificacionCriptografica, "NO_VERIFICADA");
  assert.equal(result.requiereValidacionEspecificaProveedor, true);
  assert.equal(h.state.signedBodies[0].key, "S".repeat(48));
  assert.equal(h.state.signedBodies[0].body,
    envelope.requestId + "|" + envelope.timestamp + "|" + envelope.correlationId + "|" +
    envelope.sourceService + "|USER|signatureStatusCallback|" + JSON.stringify(envelope.payload));
  assert.deepEqual(h.state.propertiesReads, ["IMA_SIGNATURE_PROVIDER_PSC_TEST_HMAC_SECRET"]);
  assert.equal(h.cache.get("SIGNATURE_PROVIDER_CALLBACK_PSC_TEST_request-0001"), "SEEN");
  assert.equal(h.state.cachePuts, 1);
  assert.equal(h.state.events.length, 1);
  assert.equal(h.state.events[0][3], "SIGNATURE_PROVIDER_CALLBACK_AUTHENTICATED");
  assert.equal(h.state.releases, 1);
  assert.equal(h.state.held, false);
}

{
  const h = makeHarness();
  const envelope = h.makeEnvelope();
  h.invoke(envelope);
  assert.throws(() => h.invoke(envelope), /SIGNATURE_CALLBACK_REPLAY_DETECTED/);
  assert.equal(h.state.cachePuts, 1, "replay must not reserve the nonce again");
  assert.equal(h.state.events.length, 1, "replay must not emit a second authenticated event");
  assert.equal(h.state.releases, 2);
}

{
  const h = makeHarness({ computedSignature: "b".repeat(64) });
  assert.throws(() => h.invoke(h.makeEnvelope()), /SIGNATURE_CALLBACK_AUTHENTICATION_FAILED/);
  assert.equal(h.state.lockAttempts, 0, "invalid HMAC must fail before replay lock/cache");
  assert.equal(h.state.cachePuts, 0);
  assert.equal(h.state.events.length, 0);
}

for (const [label, options, envelope, expected] of [
  ["missing secret", { secret: "short" }, {}, /SIGNATURE_CALLBACK_SECRET_NOT_CONFIGURED/],
  ["secret store unavailable", { propertiesThrows: true }, {}, /SIGNATURE_CALLBACK_SECRET_UNAVAILABLE/],
  ["busy lock", { lockBusy: true }, {}, /SIGNATURE_CALLBACK_SERVICE_BUSY/],
  ["expired timestamp", {}, { timestamp: Date.now() - 300001 }, /SIGNATURE_CALLBACK_ENVELOPE_INVALID/],
  ["wrong source", {}, { sourceService: "SIGNATURE_PROVIDER:bad provider" }, /SIGNATURE_CALLBACK_ENVELOPE_INVALID/],
  ["wrong target", {}, { targetService: "ACCOUNTING" }, /SIGNATURE_CALLBACK_ENVELOPE_INVALID/],
  ["wrong action", {}, { action: "updateSignatureStatus" }, /SIGNATURE_CALLBACK_ENVELOPE_INVALID/],
  ["extra payload key", {}, { payload: { transaccionId: "TX-001", estadoProveedor: "SIGNED", estadoTransaccion: "Completada" } }, /SIGNATURE_CALLBACK_PAYLOAD_INVALID/],
  ["invalid event reference", {}, { payload: { transaccionId: "TX-001", estadoProveedor: "SIGNED", referenciaEvento: "bad value" } }, /SIGNATURE_CALLBACK_PAYLOAD_INVALID/],
  ["invalid transaction", {}, { payload: { transaccionId: "../TX", estadoProveedor: "SIGNED" } }, /SIGNATURE_CALLBACK_PAYLOAD_INVALID/]
]) {
  const h = makeHarness(options);
  assert.throws(() => h.invoke(h.makeEnvelope(envelope)), expected, label);
  assert.equal(h.state.cachePuts, 0, label + " must not reserve a replay key");
  assert.equal(h.state.events.length, 0, label + " must not log an authenticated callback");
}

{
  let h;
  let nestedInvoked = false;
  h = makeHarness({ onCachePut: () => {
    if (nestedInvoked) return;
    nestedInvoked = true;
    try { h.invoke(h.makeEnvelope({ requestId: "request-0002" })); }
    catch (error) { h.state.nestedError = error.message; }
  }});
  const result = h.invoke(h.makeEnvelope());
  assert.equal(result.status, "accepted");
  assert.equal(h.state.nestedError, "SIGNATURE_CALLBACK_SERVICE_BUSY");
  assert.equal(h.state.lockAttempts, 2);
  assert.equal(h.state.cacheGets, 1, "nested callback must fail before cache read");
  assert.equal(h.state.cachePuts, 1, "nested callback must not reserve a nonce");
  assert.equal(h.state.events.length, 1);
  assert.equal(h.state.releases, 1);
  assert.equal(h.state.held, false);
}

console.log("user-service-signature-provider-callback: PASS");
