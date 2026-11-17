"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const services = ["USER", "ACADEMIC", "ACCOUNTING", "DEVELOPER"];
const paths = services.map(service => path.resolve(__dirname, "../../backend/" + service.toLowerCase() + "-service/Code.gs"));
const headers = ["CredentialID","ServiceID","CredentialType","Version","Status","Fingerprint","CreatedAt","CreatedBy","RevokedAt","RevokedBy"];
const type = "IMA_MIGRATION_HMAC_SECRET";
const secret1 = "v1_0123456789abcdef0123456789abcdef0123456789abcdef";
const secret2 = "v2_abcdef0123456789abcdef0123456789abcdef0123456789";
const fingerprint = value => crypto.createHash("sha256").update(value, "utf8").digest("hex");

function extract(source, name) {
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
    if (ch === "'" || ch === '"' || ch === "\`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function harness(source, localService, options = {}) {
  let rows = (options.rows || [headers]).map(row => row.slice());
  const properties = Object.assign({}, options.properties || {});
  const state = { held: false, waits: 0, releases: 0, failKeyOnce: "", failSetRowOnce: 0, onAppend: null };
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    getLastRow: () => rows.length,
    getRange: (row, col, count, width) => ({
      setValues(values) {
        if (state.failSetRowOnce === row) { state.failSetRowOnce = 0; throw new Error("injected catalog write failure"); }
        values.forEach((value, index) => {
          while (rows.length < row + index) rows.push([]);
          for (let j = 0; j < width; j++) rows[row - 1 + index][col - 1 + j] = value[j];
        });
      }
    }),
    appendRow(value) {
      rows.push(value.slice());
      if (state.onAppend) state.onAppend();
    }
  };
  const props = {
    getProperty(key) { return Object.prototype.hasOwnProperty.call(properties, key) ? properties[key] : null; },
    setProperty(key, value) {
      if (state.failKeyOnce === key) { state.failKeyOnce = ""; throw new Error("injected property write failure"); }
      properties[key] = String(value); return this;
    },
    deleteProperty(key) { delete properties[key]; return this; }
  };
  const runtime = {
    Date, String, JSON, Array, Object, Number, Math, RegExp, Error,
    SPREADSHEET_ID: "TEST-SPREADSHEET",
    Session: { getActiveUser: () => ({ getEmail: () => "operator@example.org" }) },
    LockService: { getScriptLock: () => ({
      waitLock(ms) { assert.equal(ms, 10000); if (state.held) throw new Error("LOCK_BUSY"); state.held = true; state.waits++; },
      releaseLock() { state.held = false; state.releases++; }
    }) },
    PropertiesService: { getScriptProperties: () => props },
    SpreadsheetApp: { openById(id) {
      assert.equal(id, "TEST-SPREADSHEET");
      return {
        getSheetByName(name) { return name === "CatalogoCredencialesServicios" && !options.catalogMissing ? sheet : null; },
        insertSheet(name) { assert.equal(name, "CatalogoCredencialesServicios"); options.catalogMissing = false; rows = [headers.slice()]; return sheet; }
      };
    } },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      Charset: { UTF_8: "UTF_8" },
      computeDigest(_algorithm, value) { return Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest()); }
    }
  };
  const names = [
    "computeMigrationCredentialFingerprint_", "getMigrationHmacSecret_", "getMigrationHmacSecrets_",
    "manageMigrationCredentialFromEditor_", "provisionMigrationCredentialFromEditor_",
    "revokeMigrationCredentialFromEditor_"
  ];
  vm.createContext(runtime);
  const bootstrap = "const IMA_LOCAL_SERVICE_ID_ = " + JSON.stringify(localService) +
    "; const IMA_CREDENTIAL_CATALOG_HEADERS_ = " + JSON.stringify(headers) + ";";
  vm.runInContext(bootstrap + "\n" + names.map(name => extract(source, name)).join("\n") +
    "\nthis.api={provision:provisionMigrationCredentialFromEditor_,revoke:revokeMigrationCredentialFromEditor_,get:getMigrationHmacSecret_,getAll:getMigrationHmacSecrets_};", runtime);
  return { api: runtime.api, properties, rows: () => rows.map(row => row.slice()), state, sheet };
}

function expectCode(fn, code) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert.ok(error, "expected " + code);
  assert.ok(String(error.message || error).includes(code), "expected " + code + ", got " + String(error.message || error));
}

for (let index = 0; index < paths.length; index++) {
  const source = fs.readFileSync(paths[index], "utf8");
  new vm.Script(source, { filename: paths[index] });
  const localService = services[index];
  assert.ok(source.includes("function provisionMigrationCredentialFromEditor_("), localService + " provisioning entrypoint");
  assert.ok(!source.includes('case "provisionMigrationCredentialFromEditor_"'), "provisioning must not be exposed through doPost");
  const h = harness(source, localService);
  const installed = h.api.provision({ sourceService: localService, version: "v1", secret: secret1 });
  assert.equal(installed.status, "success");
  assert.equal(installed.credentialStatus, "ACTIVE");
  assert.ok(!JSON.stringify(installed).includes(secret1), "provisioning response must not expose the secret");
  assert.equal(h.properties["IMA_MIGRATION_HMAC_SECRET_" + localService], secret1);
  assert.equal(h.properties["IMA_MIGRATION_HMAC_SECRET_VERSION_" + localService], "v1");
  assert.equal(h.properties["IMA_MIGRATION_HMAC_SECRET_" + localService + "_V_v1"], secret1);
  assert.equal(h.api.getAll(localService)[0], secret1);
  assert.equal(h.api.get(localService, "VERIFY"), secret1);
  if (localService === "USER" || localService === "ACADEMIC" || localService === "ACCOUNTING" || localService === "DEVELOPER") {
    assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET, secret1);
    assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_VERSION, "v1");
    assert.equal(h.api.get(localService, "SIGN"), secret1);
  }
  const rowCount = h.rows().length;
  h.api.provision({ sourceService: localService, version: "v1", secret: secret1 });
  assert.equal(h.rows().length, rowCount, "same version and secret is idempotent");
  expectCode(() => h.api.provision({ sourceService: localService, version: "v1", secret: secret2 }), "CREDENTIAL_PROVISIONING_VERSION_CONFLICT");
  expectCode(() => h.api.provision({ sourceService: localService, version: "v1", secret: secret1, status: "VERIFY_ONLY" }), "CREDENTIAL_PROVISIONING_ACTIVE_DEMOTION_REQUIRES_ROTATION");

  h.api.provision({ sourceService: localService, version: "v2", secret: secret2 });
  assert.equal(h.properties["IMA_MIGRATION_HMAC_SECRET_" + localService], secret2);
  assert.equal(h.properties["IMA_MIGRATION_HMAC_SECRET_" + localService + "_V_v1"], secret1);
  assert.equal(h.api.getAll(localService).length, 2, "ACTIVE and VERIFY_ONLY overlap are both accepted");
  const v1 = h.rows().find(row => row[3] === "v1");
  const v2 = h.rows().find(row => row[3] === "v2");
  assert.equal(v1[4], "VERIFY_ONLY");
  assert.equal(v2[4], "ACTIVE");

  h.api.revoke({ sourceService: localService, version: "v1" });
  assert.equal(h.properties["IMA_MIGRATION_HMAC_SECRET_" + localService + "_V_v1"], undefined);
  assert.equal(h.api.getAll(localService).length, 1, "revoking old version preserves active version");
  h.api.revoke({ sourceService: localService, version: "v2" });
  expectCode(() => h.api.getAll(localService), "MIGRATION_SECRET_NOT_CONFIGURED");
  assert.equal(h.rows().find(row => row[3] === "v2")[4], "REVOKED");
  assert.equal(h.state.held, false, "lock is released on every path");
}

{
  const source = fs.readFileSync(paths[0], "utf8");
  const h = harness(source, "USER");
  h.api.provision({ sourceService: "ACCOUNTING", version: "v4", secret: secret1, status: "VERIFY_ONLY" });
  assert.equal(h.rows()[1][4], "VERIFY_ONLY");
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_ACCOUNTING_V_v4, secret1);
  h.api.provision({ sourceService: "ACCOUNTING", version: "v4", secret: secret1, status: "ACTIVE" });
  assert.equal(h.rows()[1][4], "ACTIVE", "a staged VERIFY_ONLY key can be promoted");
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_ACCOUNTING, secret1);
  assert.equal(h.api.getAll("ACCOUNTING")[0], secret1);
}

{
  const source = fs.readFileSync(paths[0], "utf8");
  const h = harness(source, "USER");
  h.state.failKeyOnce = "IMA_MIGRATION_HMAC_SECRET_USER";
  expectCode(() => h.api.provision({ sourceService: "USER", version: "v1", secret: secret1 }), "CREDENTIAL_PROVISIONING_ACTIVATION_FAILED");
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_USER, undefined, "partial property update is rolled back");
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_USER_V_v1, undefined, "staged secret is rolled back");
  assert.equal(h.rows()[1][4], "PENDING", "failed activation remains safely staged");
  h.api.provision({ sourceService: "USER", version: "v1", secret: secret1 });
  assert.equal(h.rows()[1][4], "ACTIVE", "a staged operation can be retried safely");
}

{
  const source = fs.readFileSync(paths[0], "utf8");
  const h = harness(source, "USER");
  h.api.provision({ sourceService: "USER", version: "v1", secret: secret1 });
  h.state.failKeyOnce = "IMA_MIGRATION_HMAC_SECRET_USER";
  expectCode(() => h.api.provision({ sourceService: "USER", version: "v2", secret: secret2 }), "CREDENTIAL_PROVISIONING_ACTIVATION_FAILED");
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_USER, secret1);
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_USER_V_v1, secret1, "previous active versioned key survives rollback");
  assert.equal(h.properties.IMA_MIGRATION_HMAC_SECRET_USER_V_v2, undefined);
  assert.equal(h.rows().find(row => row[3] === "v1")[4], "ACTIVE");
  h.api.provision({ sourceService: "USER", version: "v2", secret: secret2 });
  assert.equal(h.rows().find(row => row[3] === "v1")[4], "VERIFY_ONLY");
}

{
  const source = fs.readFileSync(paths[0], "utf8");
  const h = harness(source, "USER");
  let nestedError = "";
  h.state.onAppend = () => {
    try { h.api.provision({ sourceService: "USER", version: "v1", secret: secret1 }); }
    catch (error) { nestedError = String(error.message || error); }
  };
  h.api.provision({ sourceService: "USER", version: "v1", secret: secret1 });
  assert.ok(nestedError.includes("CREDENTIAL_PROVISIONING_BUSY"), "reentrant concurrent provisioning is rejected under lock");
  assert.equal(h.state.held, false);
}

{
  const source = fs.readFileSync(paths[0], "utf8");
  const h = harness(source, "USER", { catalogMissing: true });
  h.api.provision({ sourceService: "USER", version: "v1", secret: secret1 });
  assert.deepEqual(h.rows()[0], headers, "missing catalog is initialized with the canonical header");
}

{
  const source = fs.readFileSync(paths[0], "utf8");
  const h = harness(source, "USER");
  expectCode(() => h.api.provision({ sourceService: "USER", version: "bad version", secret: secret1 }), "CREDENTIAL_PROVISIONING_VERSION_INVALID");
  expectCode(() => h.api.provision({ sourceService: "UNKNOWN", version: "v1", secret: secret1 }), "CREDENTIAL_PROVISIONING_SERVICE_INVALID");
  expectCode(() => h.api.provision({ sourceService: "USER", version: "v1", secret: "too short" }), "CREDENTIAL_PROVISIONING_SECRET_INVALID");
  expectCode(() => h.api.provision({ sourceService: "USER", version: "v1", secret: secret1, status: "REVOKED" }), "CREDENTIAL_PROVISIONING_STATUS_INVALID");
}

process.stdout.write("Interservice credential provisioning: four-service editor-only install, version overlap, idempotency, rollback, revocation and lock contracts PASS.\n");
