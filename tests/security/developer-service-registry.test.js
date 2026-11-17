"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}

const registryHeaders = ["ServiceID","Name","Department","OwnerAccount","EndpointURL","SpreadsheetID","DataDomain","State","Version","PermissionsJSON","RegisteredAt"];
const historyHeaders = ["HistoryID","ServiceID","PreviousState","NewState","Reason","UpdatedBy","UpdatedAt"];
function sheet(rows) {
  return {
    rows: (rows || []).map(row => row.slice()),
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getRange(row, col, count, width) {
      return {
        setValue: value => { if (!this.rows[row - 1]) this.rows[row - 1] = []; this.rows[row - 1][col - 1] = value; },
        setValues: values => values.forEach((valuesRow, i) => {
          while (this.rows.length < row + i) this.rows.push([]);
          for (let j = 0; j < width; j++) this.rows[row - 1 + i][col - 1 + j] = valuesRow[j];
        })
      };
    },
    appendRow(row) { this.rows.push(row.slice()); },
    insertRowBefore(row) { this.rows.splice(row - 1, 0, []); },
    deleteRow(row) { this.rows.splice(row - 1, 1); }
  };
}
function harness(initial, options) {
  const opts = options || {}, sheets = Object.assign({}, initial || {}), logs = [];
  const lockState = { held: false, attempts: 0, releases: 0 };
  let uuidCounter = 0;
  const ss = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) { sheets[name] = sheet([]); return sheets[name]; }
  };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: {
      openById() { if (opts.openFail) throw new Error("permission denied"); return ss; },
      flush() {
        if (opts.flushFail) throw new Error("flush failed");
        if (typeof opts.flushHook === "function") opts.flushHook();
      }
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock() {
            lockState.attempts++;
            if (opts.lockFail || lockState.held) return false;
            lockState.held = true;
            return true;
          },
          releaseLock() { lockState.held = false; lockState.releases++; }
        };
      }
    },
    Utilities: { getUuid() { uuidCounter++; return "UUID-" + uuidCounter; } },
    ROLE_PERMISSIONS: { Desarrollador: ["registerServiceInstance", "updateServiceStatus"] },
    verifySessionToken(token) { return token === "valid" ? { userId: "verified-user", role: "Desarrollador" } : null; },
    textResponse(value) { return value; },
    Logger: { log: value => logs.push(String(value)) },
    console: { error: value => logs.push(String(value)) },
    Date, String, Number, Array, Object, JSON, Error,
    sheets, logs, lockState
  };
  const source = fs.readFileSync("backend/developer-service/Code.gs", "utf8");
  const start = source.indexOf("const DEVELOPER_SERVICE_REGISTRY_HEADERS_ =");
  const end = source.indexOf("\nfunction developerLogServiceRegistryIncident_", start);
  assert.notEqual(start, -1); assert.notEqual(end, -1);
  const names = [
    "developerLogServiceRegistryIncident_", "developerEnsureServiceTable_",
    "developerParseServiceRegistryRows_", "developerMapServiceRegistryRow_",
    "getCentralServiceRegistry", "registerServiceInstance", "updateServiceStatus", "doPost"
  ];
  const code = source.slice(start, end) + names.map(name => extractFunction(source, name)).join("\n");
  const api = new Function("context", "with(context){" + code + ";return {getCentralServiceRegistry,registerServiceInstance,updateServiceStatus,doPost};}")(context);
  return { ...api, sheets, logs, context, lockState };
}
function registerService(h, payload) {
  return h.registerServiceInstance(Object.assign({ _verifiedUserId: "actor-1" }, payload));
}
function row(id, name, permissions) {
  return [id,name,"Academic","owner@example.invalid","https://example.invalid/exec","SHEET-1","ACADEMIC","Activo","1.0.0",permissions === undefined ? "[]" : permissions,"2026-11-17T00:00:00.000Z"];
}

let h = harness();
let result = h.getCentralServiceRegistry({});
assert.equal(result.status, "success");
assert.equal(result.registryState, "UNINITIALIZED");
assert.deepEqual(result.registry, []);
assert.equal(Object.keys(h.sheets).length, 0, "read must not create an empty registry sheet");

h = harness({ CatalogoServicios: sheet([]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "success");
assert.equal(result.registryState, "EMPTY");
assert.equal(result.totalServicios, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.registryState, "EMPTY");
assert.deepEqual(result.registry, []);

h = harness({ CatalogoServicios: sheet([row("SVC-LEGACY","Legacy service")]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "success");
assert.equal(result.totalServicios, 1);
assert.equal(result.registry[0].serviceId, "SVC-LEGACY");
assert.deepEqual(result.registry[0].permisosConcedidos, []);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Real service",'["read","health"]')]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "success");
assert.equal(result.registryState, "READY");
assert.equal(result.registry[0].name, "Real service");
assert.deepEqual(result.registry[0].permisosConcedidos, ["read","health"]);
assert.equal(result.registry[0].cuentaPropietaria, "owner@example.invalid");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Bad permissions","{broken")]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_PERMISSIONS_INVALID");
assert.equal(result.totalServicios, 0);
assert.ok(h.logs.some(value => value.includes("SERVICE_REGISTRY_PERMISSIONS_INVALID")));

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-WILDCARD","Wildcard stored permissions",'["read","*"]')]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_PERMISSIONS_INVALID");
assert.equal(result.totalServicios, 0);

h = harness({ CatalogoServicios: sheet([["ServiceID","WrongHeader","Department","OwnerAccount","EndpointURL","SpreadsheetID","DataDomain","State","Version","PermissionsJSON","RegisteredAt"], row("SVC-1","Service")]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_SCHEMA_MISMATCH");

h = harness({ CatalogoServicios: sheet([["ServiceID","WrongHeader","Department","OwnerAccount","EndpointURL","SpreadsheetID","DataDomain","State","Version","PermissionsJSON","RegisteredAt"]]) });
const malformedHeaderBefore = h.sheets.CatalogoServicios.rows.map(row => row.slice());
assert.throws(() => registerService(h,{ serviceId: "SVC-NEW", name: "New", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NEW" }), /SERVICE_REGISTRY_SCHEMA_MISMATCH/);
assert.deepEqual(h.sheets.CatalogoServicios.rows, malformedHeaderBefore, "malformed header must not be migrated or rewritten");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-FAKE","Placeholder")]) });
h.sheets.CatalogoServicios.rows[1][3] = "sistema@institucional.edu";
h.sheets.CatalogoServicios.rows[1][5] = "TEST";
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_PLACEHOLDER_METADATA");
h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-DEMO","Demo")]) });
h.sheets.CatalogoServicios.rows[1][3] = "primary@domain.edu";
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_PLACEHOLDER_METADATA");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","One"), row("svc-1","Duplicate")]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_DUPLICATE_ID");

h = harness({}, { openFail: true });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "error");
assert.equal(result.code, "SERVICE_REGISTRY_READ_FAILED");
assert.deepEqual(result.registry, []);
assert.ok(!JSON.stringify(result).includes("primary@domain.edu"), "no demo service accounts may leak");

h = harness();
result = registerService(h,{ serviceId: "SVC-NEW", name: "New service", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NEW", permisosConcedidos: ["read"] });
assert.equal(result.status, "success");
assert.deepEqual(h.sheets.CatalogoServicios.rows[0], registryHeaders);
assert.equal(h.sheets.CatalogoServicios.rows.length, 2);
assert.deepEqual(JSON.parse(h.sheets.CatalogoServicios.rows[1][9]), ["read"]);
assert.equal(h.getCentralServiceRegistry({}).totalServicios, 1);
assert.deepEqual(h.sheets.HistorialServiciosDistribuidos.rows[0], historyHeaders);
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][1], "SVC-NEW");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][3], "Activo");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][4], "Registro inicial");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][5], "actor-1");

h = harness({ CatalogoServicios: sheet([row("SVC-OLD","Existing legacy")]) });
result = registerService(h,{ serviceId: "SVC-NEW", name: "New service", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NEW" });
assert.equal(result.status, "success");
assert.deepEqual(h.sheets.CatalogoServicios.rows[0], registryHeaders);
assert.equal(h.sheets.CatalogoServicios.rows[1][0], "SVC-OLD", "legacy row must be preserved");
assert.equal(h.sheets.CatalogoServicios.rows[2][0], "SVC-NEW");

h = harness({ CatalogoServicios: sheet([row("SVC-OLD","Existing legacy"), ["broken"]]) });
assert.throws(() => registerService(h,{ serviceId: "SVC-NEW", name: "New service", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NEW" }), /SERVICE_REGISTRY_SCHEMA_MISMATCH/);
assert.deepEqual(h.sheets.CatalogoServicios.rows, [row("SVC-OLD","Existing legacy"), ["broken"]], "invalid legacy rows must not be shifted or rewritten");

h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-BAD", name: "Bad", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-BAD", permisosConcedidos: "read" }), /INVALID_SERVICE_PERMISSIONS/);
assert.equal(Object.keys(h.sheets).length, 0, "invalid registration must not create or mutate the registry");
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-DUP-PERM", name: "Duplicate permissions", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-DUP", permisosConcedidos: ["read", " read "] }), /INVALID_SERVICE_PERMISSIONS/);
assert.equal(Object.keys(h.sheets).length, 0, "duplicate normalized permissions must not create or mutate the registry");
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-WILDCARD", name: "Wildcard permissions", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-WILDCARD", permisosConcedidos: ["read", "*"] }), /INVALID_SERVICE_PERMISSIONS/);
assert.equal(Object.keys(h.sheets).length, 0, "wildcard permissions must not create or mutate the registry");
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-NO-OWNER", name: "No owner" }), /SERVICE_OWNER_AND_SPREADSHEET_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0, "missing owner/spreadsheet must not create a fictitious registry entry");
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-FAKE", name: "Fake", cuentaPropietaria: "sistema@institucional.edu", spreadsheetAsociado: "TEST" }), /SERVICE_OWNER_AND_SPREADSHEET_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0);
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-DEMO", name: "Demo", cuentaPropietaria: "primary@domain.edu", spreadsheetAsociado: "SHEET-DEMO" }), /SERVICE_OWNER_AND_SPREADSHEET_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
result = h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", reason: "test", updatedBy: "spoofed", _verifiedUserId: "verified-actor" });
assert.equal(result.status, "success");
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "degradado");
assert.deepEqual(h.sheets.HistorialServiciosDistribuidos.rows[0], historyHeaders);
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows.length, 2);
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][2], "Activo");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][5], "verified-actor", "history actor must come from verified context, not updatedBy payload");
assert.equal(h.lockState.held, false);
assert.equal(h.lockState.releases, 1);

h = harness();
assert.throws(() => h.registerServiceInstance({ serviceId: "SVC-NO-ACTOR", name: "No actor", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NO-ACTOR" }), /SERVICE_ACTOR_NOT_VERIFIED/);
assert.equal(Object.keys(h.sheets).length, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
assert.throws(() => h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", updatedBy: "spoofed" }), /SERVICE_ACTOR_NOT_VERIFIED/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo");
assert.equal(h.lockState.attempts, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) }, { lockFail: true });
assert.throws(() => h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", _verifiedUserId: "verified-actor" }), /SERVICE_REGISTRY_LOCK_TIMEOUT/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo");
assert.equal(h.lockState.releases, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
let reentrantError = "";
const reentrantHarness = h;
const originalFlush = h.context.SpreadsheetApp.flush;
h.context.SpreadsheetApp.flush = function() {
  try { reentrantHarness.updateServiceStatus({ serviceId: "SVC-1", newState: "suspendido", _verifiedUserId: "second-actor" }); }
  catch (error) { reentrantError = error.message; }
  originalFlush();
};
const outerResult = h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", _verifiedUserId: "first-actor" });
assert.equal(outerResult.status, "success");
assert.equal(reentrantError, "SERVICE_REGISTRY_LOCK_TIMEOUT");
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "degradado");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows.length, 2, "reentrant update must not append a second history row");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
const brokenHistory = sheet([historyHeaders]);
brokenHistory.appendRow = () => { throw new Error("history unavailable"); };
h.sheets.HistorialServiciosDistribuidos = brokenHistory;
assert.throws(() => h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", _verifiedUserId: "verified-actor" }), /SERVICE_STATUS_WRITE_FAILED/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo", "status must roll back if history append fails");
assert.equal(brokenHistory.rows.length, 1, "failed history append must not create a phantom history row");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
const registrationHistory = sheet([historyHeaders]);
registrationHistory.appendRow = () => { throw new Error("history unavailable"); };
h.sheets.HistorialServiciosDistribuidos = registrationHistory;
assert.throws(() => registerService(h, { serviceId: "SVC-NEW", name: "New service", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NEW" }), /SERVICE_REGISTRY_WRITE_FAILED/);
assert.equal(h.sheets.CatalogoServicios.rows.length, 1, "registration must roll back if its history cannot be persisted");
assert.equal(registrationHistory.rows.length, 1);

h = harness({
  CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]),
  HistorialServiciosDistribuidos: sheet([["wrong","schema"]])
});
assert.throws(() => h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", _verifiedUserId: "verified-actor" }), /SERVICE_REGISTRY_SCHEMA_MISMATCH/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo", "invalid history schema must be detected before status mutation");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
result = h.doPost({ postData: { contents: JSON.stringify({ action: "updateServiceStatus", serviceId: "SVC-1", newState: "degradado", sessionToken: "valid", updatedBy: "spoofed" }) } });
assert.equal(result.status, "success");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][5], "verified-user");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
result = h.doPost({ postData: { contents: JSON.stringify({ action: "updateServiceStatus", serviceId: "SVC-1", newState: "degradado", sessionToken: "invalid", authRole: "Desarrollador", _verifiedUserId: "forged-user" }) } });
assert.equal(result.status, "error");
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo", "client-supplied _verifiedUserId must be discarded");
assert.equal(h.sheets.HistorialServiciosDistribuidos, undefined);

console.log("Developer service registry contract PASS.");
