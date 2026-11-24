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

const registryHeaders = ["ServiceID","Name","Department","OwnerAccount","EndpointURL","SpreadsheetID","DataDomain","State","Version","PermissionsJSON","RegisteredAt","RolesJSON","PositionID","ServiceMode","ScriptProjectID","DriveFolderID","AccessMode"];
const legacyHeaders = ["ServiceID","Name","Department","OwnerAccount","EndpointURL","SpreadsheetID","DataDomain","State","Version","PermissionsJSON","RegisteredAt"];
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
    ROLE_PERMISSIONS: {
      Administrador: [],
      Desarrollador: ["registerServiceInstance", "updateServiceStatus", "auditInterServiceCalls"],
      Director: []
    },
    verifySessionToken(token) {
      if (token === "valid") return { userId: "verified-user", role: "Desarrollador" };
      if (token === "director") return { userId: "director-user", role: "Director" };
      if (token === "administrator") return { userId: "admin-user", role: "Administrador" };
      if (token === "missing-claims") return { role: "Desarrollador" };
      return null;
    },
    textResponse(value) { return value; },
    doGet() { return { status: "success", service: "DEVELOPER" }; },
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
    "developerDeleteRowByKey_", "developerCreateServiceHistoryId_",
    "developerParseServiceRegistryRows_", "developerMapServiceRegistryRow_",
    "getCentralServiceRegistry", "registerServiceInstance_", "updateServiceStatus_",
    "registerServiceInstance", "updateServiceStatus", "auditInterServiceCalls", "doPost"
  ];
  const code = source.slice(start, end) + names.map(name => extractFunction(source, name)).join("\n");
  const api = new Function("context", "with(context){" + code + ";return {getCentralServiceRegistry,registerServiceInstance_,updateServiceStatus_,registerServiceInstance,updateServiceStatus,auditInterServiceCalls,doPost};}")(context);
  return { ...api, sheets, logs, context, lockState };
}
function validServicePayload(overrides) {
  const supplied = overrides || {}, serviceId = supplied.serviceId || "SVC-TEST";
  return Object.assign({ serviceId, name: "Test service", cuentaPropietaria: "owner@example.invalid",
    endpointUrl: "https://script.google.com/macros/s/DEPLOYMENT/exec", spreadsheetAsociado: "SHEET-" + serviceId,
    dominioDatos: "ACADEMIC", version: "1.0.0", permisosConcedidos: [], roles: ["Docente"],
    positionId: "POS-" + serviceId, serviceMode: "INDIVIDUAL", scriptProjectId: "SCRIPT-" + serviceId,
    driveFolderId: "DRIVE-" + serviceId, accessMode: "INSTITUTIONAL_DOMAIN" }, supplied);
}
function registerService(h, payload) { return h.registerServiceInstance_(validServicePayload(payload), "actor-1"); }
function row(id, name, permissions) {
  return [id,name,"Academic","owner@example.invalid","https://script.google.com/macros/s/DEPLOYMENT/exec","SHEET-1","ACADEMIC","Activo","1.0.0",
    permissions === undefined ? "[]" : permissions,"2026-11-17T00:00:00.000Z",JSON.stringify(["Docente"]),"POS-"+id,"INDIVIDUAL","SCRIPT-"+id,"DRIVE-"+id,"INSTITUTIONAL_DOMAIN"];
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

h = harness({ CatalogoServicios: sheet([legacyHeaders, row("SVC-V1","Legacy v1").slice(0,11)]) });
result = h.getCentralServiceRegistry({});
assert.equal(result.status, "success");
assert.equal(result.registry[0].metadataState, "LEGACY_METADATA_PENDING");
assert.deepEqual(h.sheets.CatalogoServicios.rows[0], legacyHeaders, "read must not mutate v1");
result = registerService(h, { serviceId: "SVC-MIGRATED", name: "Migrated service" });
assert.equal(result.status, "success");
assert.deepEqual(h.sheets.CatalogoServicios.rows[0], registryHeaders);
assert.deepEqual(h.sheets.CatalogoServicios.rows[1].slice(0,11), row("SVC-V1","Legacy v1").slice(0,11));
assert.equal(h.sheets.CatalogoServicios.rows[2][12], "POS-SVC-MIGRATED");

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
assert.throws(() => registerService(h,{ serviceId: "SVC-NO-OWNER", name: "No owner", cuentaPropietaria: "", spreadsheetAsociado: "" }), /SERVICE_OWNER_AND_SPREADSHEET_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0, "missing owner/spreadsheet must not create a fictitious registry entry");
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-FAKE", name: "Fake", cuentaPropietaria: "sistema@institucional.edu", spreadsheetAsociado: "TEST" }), /SERVICE_OWNER_AND_SPREADSHEET_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0);
h = harness();
assert.throws(() => registerService(h,{ serviceId: "SVC-DEMO", name: "Demo", cuentaPropietaria: "primary@domain.edu", spreadsheetAsociado: "SHEET-DEMO" }), /SERVICE_OWNER_AND_SPREADSHEET_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
result = h.updateServiceStatus_({ serviceId: "SVC-1", newState: "degradado", reason: "test", updatedBy: "spoofed" }, "verified-actor");
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
assert.throws(() => h.registerServiceInstance({ serviceId: "SVC-FORGED-ACTOR", name: "Forged actor", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-FORGED", _verifiedUserId: "forged-user" }), /SERVICE_ACTOR_NOT_VERIFIED/);
assert.equal(Object.keys(h.sheets).length, 0);

h = harness({}, { lockFail: true });
assert.throws(() => registerService(h, { serviceId: "SVC-LOCKED", name: "Locked registration", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-LOCKED" }), /SERVICE_REGISTRY_LOCK_TIMEOUT/);
assert.equal(Object.keys(h.sheets).length, 0, "lock timeout must not create registry sheets or records");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
assert.throws(() => h.updateServiceStatus({ serviceId: "SVC-1", newState: "degradado", updatedBy: "spoofed", _verifiedUserId: "forged-user" }), /SERVICE_ACTOR_NOT_VERIFIED/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo");
assert.equal(h.lockState.attempts, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) }, { lockFail: true });
assert.throws(() => h.updateServiceStatus_({ serviceId: "SVC-1", newState: "degradado" }, "verified-actor"), /SERVICE_REGISTRY_LOCK_TIMEOUT/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo");
assert.equal(h.lockState.releases, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
let reentrantError = "";
const reentrantHarness = h;
const originalFlush = h.context.SpreadsheetApp.flush;
h.context.SpreadsheetApp.flush = function() {
  try { reentrantHarness.updateServiceStatus_({ serviceId: "SVC-1", newState: "suspendido" }, "second-actor"); }
  catch (error) { reentrantError = error.message; }
  originalFlush();
};
const outerResult = h.updateServiceStatus_({ serviceId: "SVC-1", newState: "degradado" }, "first-actor");
assert.equal(outerResult.status, "success");
assert.equal(reentrantError, "SERVICE_REGISTRY_LOCK_TIMEOUT");
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "degradado");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows.length, 2, "reentrant update must not append a second history row");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
const brokenHistory = sheet([historyHeaders]);
brokenHistory.appendRow = () => { throw new Error("history unavailable"); };
h.sheets.HistorialServiciosDistribuidos = brokenHistory;
assert.throws(() => h.updateServiceStatus_({ serviceId: "SVC-1", newState: "degradado" }, "verified-actor"), /SERVICE_STATUS_WRITE_FAILED/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo", "status must roll back if history append fails");
assert.equal(brokenHistory.rows.length, 1, "failed history append must not create a phantom history row");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
const registrationHistory = sheet([historyHeaders]);
registrationHistory.appendRow = () => { throw new Error("history unavailable"); };
h.sheets.HistorialServiciosDistribuidos = registrationHistory;
assert.throws(() => registerService(h, { serviceId: "SVC-NEW", name: "New service", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NEW" }), /SERVICE_REGISTRY_WRITE_FAILED/);
assert.equal(h.sheets.CatalogoServicios.rows.length, 2, "registration must roll back if its history cannot be persisted");
assert.equal(h.sheets.CatalogoServicios.rows[1][0], "SVC-1", "rollback must preserve the pre-existing service");
assert.ok(!h.sheets.CatalogoServicios.rows.some(row => row[0] === "SVC-NEW"), "failed registration must not leave the new service row");
assert.equal(registrationHistory.rows.length, 1);

h = harness({
  CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]),
  HistorialServiciosDistribuidos: sheet([["wrong","schema"]])
});
assert.throws(() => h.updateServiceStatus_({ serviceId: "SVC-1", newState: "degradado" }, "verified-actor"), /SERVICE_REGISTRY_SCHEMA_MISMATCH/);
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo", "invalid history schema must be detected before status mutation");

h = harness();
result = h.doPost({ postData: { contents: "null" } });
assert.equal(result.status, "success", "non-object control-plane payload must normalize to the ping response");

h = harness();
result = h.doPost({ postData: { contents: JSON.stringify(Object.assign(validServicePayload({ serviceId: "SVC-POST", name: "Posted service", spreadsheetAsociado: "SHEET-POST" }), { action: "registerServiceInstance", sessionToken: "valid", _verifiedUserId: "forged-user" })) } });
assert.equal(result.status, "success");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][5], "verified-user", "initial registration must attribute the verified session actor");

h = harness();
result = h.doPost({ postData: { contents: JSON.stringify({ action: "registerServiceInstance", authRole: "Administrador", serviceId: "SVC-NO-TOKEN", name: "No token", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-NO-TOKEN" }) } });
assert.equal(result.code, "AUTHENTICATION_REQUIRED", "client-declared Administrator role must not replace a signed session");
assert.equal(Object.keys(h.sheets).length, 0);

h = harness();
result = h.doPost({ postData: { contents: JSON.stringify({ action: "registerServiceInstance", sessionToken: "invalid", authRole: "Administrador", serviceId: "SVC-BAD-TOKEN", name: "Bad token", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-BAD-TOKEN" }) } });
assert.equal(result.code, "INVALID_SESSION_TOKEN");
assert.equal(Object.keys(h.sheets).length, 0);

h = harness();
result = h.doPost({ postData: { contents: JSON.stringify({ action: "registerServiceInstance", sessionToken: "director", authRole: "Administrador", serviceId: "SVC-ROLE-ESCALATION", name: "Role escalation", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-ROLE-ESCALATION" }) } });
assert.equal(result.code, "PERMISSION_DENIED", "verified Director claims must not be elevated by authRole");
assert.equal(Object.keys(h.sheets).length, 0);

h = harness();
result = h.doPost({ postData: { contents: JSON.stringify({ action: "registerServiceInstance", sessionToken: "missing-claims", serviceId: "SVC-MISSING-CLAIMS", name: "Missing claims", cuentaPropietaria: "owner@example.invalid", spreadsheetAsociado: "SHEET-MISSING-CLAIMS" }) } });
assert.equal(result.code, "INVALID_SESSION_CLAIMS");
assert.equal(Object.keys(h.sheets).length, 0);

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
result = h.doPost({ postData: { contents: JSON.stringify({ action: "updateServiceStatus", serviceId: "SVC-1", newState: "degradado", sessionToken: "valid", authRole: "Administrador", updatedBy: "spoofed" }) } });
assert.equal(result.status, "success");
assert.equal(h.sheets.HistorialServiciosDistribuidos.rows[1][5], "verified-user");

h = harness({ CatalogoServicios: sheet([registryHeaders, row("SVC-1","Service")]) });
result = h.doPost({ postData: { contents: JSON.stringify({ action: "updateServiceStatus", serviceId: "SVC-1", newState: "degradado", sessionToken: "invalid", authRole: "Desarrollador", _verifiedUserId: "forged-user" }) } });
assert.equal(result.code, "INVALID_SESSION_TOKEN");
assert.equal(h.sheets.CatalogoServicios.rows[1][7], "Activo", "invalid session must not mutate the service state");
assert.equal(h.sheets.HistorialServiciosDistribuidos, undefined);


const usageHeaders = ["EventID","Direction","SourceService","TargetService","Action","RequestID","CorrelationID","CredentialType","CredentialID","CredentialVersion","OccurredAt"];
const usageRows = [
  usageHeaders,
  ["REQ-2:OUTBOUND","OUTBOUND","ACCOUNTING","ACADEMIC","getMigrationTargetExistenceSnapshot","REQ-2","CORR-2","IMA_MIGRATION_HMAC_SECRET","CRED-ACCOUNTING-v2","v2","2026-11-17T14:02:00.000Z"],
  ["REQ-1:INBOUND","INBOUND","ACCOUNTING","USER","writeMigratedEntity","REQ-1","CORR-1","IMA_MIGRATION_HMAC_SECRET","CRED-ACCOUNTING-v1","v1","2026-11-17T14:01:00.000Z"]
];
h = harness({ AuditoriaUsoCredenciales: sheet(usageRows) });
result = h.auditInterServiceCalls({ correlationId: "CORR-1", direction: "INBOUND", limit: 10 });
assert.equal(result.status, "success");
assert.equal(result.total, 1);
assert.equal(result.auditLogs[0].credentialVersion, "v1");
assert.equal(result.auditLogs[0].requestId, "REQ-1");
assert.ok(!JSON.stringify(result).includes("SECRET-VALUE"), "usage audit must never expose raw credential material");
result = h.auditInterServiceCalls({ sourceService: "accounting", targetService: "academic", limit: 1 });
assert.equal(result.total, 1);
assert.equal(result.auditLogs[0].credentialId, "CRED-ACCOUNTING-v2");
assert.equal(result.truncated, false);
assert.throws(() => h.auditInterServiceCalls({ direction: "SIDEWAYS" }), /CREDENTIAL_USAGE_AUDIT_QUERY_INVALID/);
assert.throws(() => h.auditInterServiceCalls({ limit: 201 }), /CREDENTIAL_USAGE_AUDIT_QUERY_INVALID/);
h = harness({ AuditoriaUsoCredenciales: sheet([["WrongHeader"]]) });
assert.throws(() => h.auditInterServiceCalls({}), /CREDENTIAL_USAGE_AUDIT_SCHEMA_MISMATCH/);
h = harness();
result = h.auditInterServiceCalls({});
assert.deepEqual(result.auditLogs, []);
assert.equal(result.total, 0);

h = harness({ AuditoriaUsoCredenciales: sheet(usageRows) });
result = h.doPost({ postData: { contents: JSON.stringify({ action: "auditInterServiceCalls", sessionToken: "valid", correlationId: "CORR-1" }) } });
assert.equal(result.status, "success");
assert.equal(result.auditLogs.length, 1, "authenticated developer action exposes the filtered usage record");
assert.equal(result.auditLogs[0].correlationId, "CORR-1");

h = harness();
result = registerService(h, { serviceId: "SVC-FAMILY", roles: ["Padre", "Estudiante"], serviceMode: "SHARED_PARENT_STUDENT" });
assert.equal(result.status, "success");
assert.deepEqual(h.getCentralServiceRegistry({}).registry[0].roles, ["Padre", "Estudiante"]);
h = harness();
result = registerService(h, { serviceId: "SVC-UTILITY", roles: ["Encargado de tienda", "Encargado de cafetería", "Transportista"], serviceMode: "SHARED_UTILITY" });
assert.equal(result.status, "success");
assert.equal(h.getCentralServiceRegistry({}).registry[0].serviceMode, "SHARED_UTILITY");
h = harness();
assert.throws(() => registerService(h, { serviceId: "SVC-BAD-ROLE-MODE", roles: ["Padre"], serviceMode: "SHARED_PARENT_STUDENT" }), /SERVICE_ROLE_MODE_MISMATCH/);
assert.equal(Object.keys(h.sheets).length, 0);
h = harness();
assert.throws(() => registerService(h, { serviceId: "SVC-PUBLIC", accessMode: "PUBLIC" }), /SERVICE_DEPLOYMENT_METADATA_REQUIRED/);
assert.equal(Object.keys(h.sheets).length, 0);
h = harness();
assert.throws(() => registerService(h, { serviceId: "SVC-BAD-URL", endpointUrl: "https://example.invalid/exec" }), /SERVICE_ENDPOINT_URL_INVALID/);
assert.equal(Object.keys(h.sheets).length, 0);
h = harness();
registerService(h, { serviceId: "SVC-POS-1" });
assert.throws(() => registerService(h, { serviceId: "SVC-POS-2", positionId: "POS-SVC-POS-1" }), /DUPLICATE_POSITION_REGISTRATION/);
assert.equal(h.sheets.CatalogoServicios.rows.length, 2);
h = harness();
result = h.doPost({ postData: { contents: JSON.stringify(Object.assign(validServicePayload({ serviceId: "SVC-ADMIN" }), { action: "registerServiceInstance", sessionToken: "administrator" })) } });
h = harness();
result = h.doPost({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", sessionToken: "director" }) } });
assert.notEqual(result.status, "success", "Director must not inherit Developer service registry access");
assert.equal(result.code, "PERMISSION_DENIED");
assert.equal(Object.keys(h.sheets).length, 0);
const developerDashboard = fs.readFileSync("developer-dashboard.html", "utf8");
const developerScript = fs.readFileSync("js/developer.js", "utf8");
const developerSource = fs.readFileSync("backend/developer-service/Code.gs", "utf8");
assert.match(developerDashboard, /id="service-registry-form"/);
assert.match(developerDashboard, /id="service-registry-roles"/);
assert.doesNotMatch(developerDashboard, /Root Access|SuperAdmin/);
assert.match(developerScript, /userRole === 'Desarrollador'/);
assert.doesNotMatch(developerScript, /userRole === 'Administrador' \|\| userRole === 'Desarrollador'/);
assert.match(developerScript, /fetchApi\('DEVELOPER', 'registerServiceInstance'/);
assert.match(developerSource, /"Administrador": \[\]/);

console.log("Developer service registry contract PASS.");
