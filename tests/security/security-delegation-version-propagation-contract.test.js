"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function extract(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

const root = path.resolve(__dirname, "../..");
const services = ["user", "academic", "task", "exam"];
const sources = Object.fromEntries(services.map(service => [
  service,
  fs.readFileSync(path.join(root, "backend", service + "-service/Code.gs"), "utf8")
]));
const versionHeaders = ["Clave", "Version", "UpdatedAt", "UpdatedBy"];

function runDelegationLookup(service, versionRows, delegationRows, cacheStore, ttlStore, cacheReads) {
  const source = sources[service];
  const versionPrelude = source.slice(source.indexOf("var SECURITY_VERSION_HEADERS_"), source.indexOf("function getDynamicPermissionsForRole"));
  assert.ok(versionPrelude.includes("function getSecurityVersion_"), service + " exposes shared security version lookup");
  const lookup = extract(source, "hasActiveDelegationForAction");
  const cache = {
    get(key) { cacheReads.push(key); return Object.prototype.hasOwnProperty.call(cacheStore, key) ? cacheStore[key] : null; },
    put(key, value, ttl) { cacheStore[key] = value; ttlStore[key] = ttl; },
    remove(key) { delete cacheStore[key]; }
  };
  const versionSheet = { getDataRange: () => ({ getValues: () => versionRows.map(row => row.slice()) }) };
  const delegationSheet = { getDataRange: () => ({ getValues: () => delegationRows.map(row => row.slice()) }) };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    CacheService: { getScriptCache: () => cache },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name =>
      name === "VersionesSeguridad" ? versionSheet : (name === "DelegacionesSeguridad" ? delegationSheet : null)
    }) }
  };
  vm.runInNewContext(versionPrelude + "\n" + lookup + "\nthis.lookup = hasActiveDelegationForAction;", context);
  return context.lookup;
}

for (const service of services) {
  const now = Date.now();
  const versionRows = [versionHeaders, ["USER_DELEGATION:U-1", 0, new Date(), "ADMIN"]];
  const delegationRows = [
    ["delegacionId","deleganteUserId","delegadoUserId","accionesAutorizadas","ambito","fechaInicio","fechaFin","estado"],
    ["DEL-1","ADMIN","U-1","createTask","General",new Date(now - 60000),new Date(now + 60000),"Activa"]
  ];
  const cacheStore = Object.create(null), ttlStore = Object.create(null), cacheReads = [];
  let lookup = runDelegationLookup(service, versionRows, delegationRows, cacheStore, ttlStore, cacheReads);
  const initial = lookup("U-1", "createTask");
  assert.equal(initial && initial.delId, "DEL-1", service + " resolves active delegation");
  assert.ok(Object.prototype.hasOwnProperty.call(cacheStore, "active_delegations_U-1_0"), service + " caches by user and version");
  assert.ok(ttlStore["active_delegations_U-1_0"] <= 60, service + " limits TTL to the nearest expiry transition");

  versionRows[1][1] = 1;
  delegationRows[1][7] = "Revocada";
  lookup = runDelegationLookup(service, versionRows, delegationRows, cacheStore, ttlStore, cacheReads);
  assert.equal(lookup("U-1", "createTask"), null, service + " rejects revoked delegation after shared version changes");
  assert.ok(cacheReads.includes("active_delegations_U-1_1"), service + " reads the new versioned cache key");

  versionRows[1][1] = 2;
  delegationRows[1][7] = "Activa";
  delegationRows[1][6] = new Date(Date.now() + 60000);
  lookup = runDelegationLookup(service, versionRows, delegationRows, cacheStore, ttlStore, cacheReads);
  assert.equal(lookup("U-1", "createTask").delId, "DEL-1", service + " sees a newly granted delegation");

  cacheStore["active_delegations_U-1_2"] = JSON.stringify([{
    delId: "DEL-1", delegante: "ADMIN", acciones: ["createTask"],
    startsAt: Date.now() - 60000, expiresAt: Date.now() - 1
  }]);
  lookup = runDelegationLookup(service, versionRows, delegationRows, cacheStore, ttlStore, cacheReads);
  assert.equal(lookup("U-1", "createTask"), null, service + " revalidates expiry on a hot cache hit");

  versionRows[1][1] = 3;
  delegationRows[1][5] = new Date(Date.now() + 5000);
  delegationRows[1][6] = new Date(Date.now() + 60000);
  lookup = runDelegationLookup(service, versionRows, delegationRows, cacheStore, ttlStore, cacheReads);
  assert.equal(lookup("U-1", "createTask"), null, service + " does not activate a future delegation early");
  assert.ok(ttlStore["active_delegations_U-1_3"] <= 5, service + " bounds empty-cache TTL by the next start transition");
  assert.ok(extract(sources[service], "verifySessionToken").includes('const versionedUserCacheSuffix = String(claims.userId).trim() + "_" + currentRoleVersion'),
    service + " keys account-state and role caches by user and privilege version");
}

const user = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
const create = extract(user, "createSecurityDelegation");
const revoke = extract(user, "revokeSecurityDelegation");
const accountState = extract(user, "manageAccountState");
const memberships = extract(user, "manageUserRoleMemberships");
const matrix = extract(user, "savePermissionMatrix");
assert.ok(create.includes('incrementSecurityVersionLocked_("USER_DELEGATION:"'), "delegation creation advances the shared delegated-user version");
assert.ok(revoke.includes('incrementSecurityVersionLocked_("USER_DELEGATION:"'), "delegation revocation advances the shared delegated-user version");
assert.ok(revoke.includes("LockService.getScriptLock()") && revoke.includes("waitLock(10000)"), "delegation revocation is serialized");
assert.ok(accountState.includes('incrementSecurityVersionLocked_("USER_ROLE:"'), "account-state changes advance the user's role/state version");
assert.ok(accountState.includes("ACCOUNT_STATE_COMPENSATION_REQUIRED"), "account-state mutation reports failed compensation");
assert.ok(memberships.includes('incrementSecurityVersionLocked_("USER_ROLE:"'), "role membership changes advance the user's role version");
assert.ok(matrix.includes('incrementSecurityVersionLocked_("PERMISSION_MATRIX"'), "matrix changes advance the shared matrix version");


function makeDelegationSheet(rows) {
  return {
    getLastRow() { return rows.length; },
    getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
    appendRow(row) { rows.push(row.slice()); },
    deleteRow(index) { rows.splice(index - 1, 1); },
    getRange(row, column, rowCount, columnCount) {
      return {
        setValue(value) { rows[row - 1][column - 1] = value; },
        setValues(values) {
          for (let r = 0; r < values.length; r++) {
            for (let c = 0; c < values[r].length; c++) rows[row - 1 + r][column - 1 + c] = values[r][c];
          }
        }
      };
    }
  };
}
function makeMutationContext(rows, failVersionBump) {
  const sheet = makeDelegationSheet(rows), bumps = [], versions = Object.create(null);
  let releases = 0;
  const ss = { getSheetByName: name => name === "DelegacionesSeguridad" ? sheet : null };
  const context = {
    getUserVerifiedRole: () => "Administrador",
    generateInstitutionalId: () => ({ generatedId: "DEL-NEW" }),
    getOrCreateSheet: () => sheet,
    SpreadsheetApp: { openById: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() { releases++; } }) },
    CacheService: { getScriptCache: () => ({ remove() {} }) },
    incrementSecurityVersionLocked_(key, actor) {
      bumps.push({ key, actor });
      if (failVersionBump) return false;
      versions[key] = (versions[key] || 0) + 1;
      return versions[key];
    },
    logStructuredEvent() {}
  };
  vm.runInNewContext([
    extract(user, "createSecurityDelegation"),
    extract(user, "revokeSecurityDelegation"),
    "this.create = createSecurityDelegation; this.revoke = revokeSecurityDelegation;"
  ].join(String.fromCharCode(10)), context);
  return { context, rows, bumps, versions, releases: () => releases };
}
const delegationHeaders = ["delegacionId","deleganteUserId","delegadoUserId","accionesAutorizadas","ambito","fechaInicio","fechaFin","estado","motivo","creadoPor","fechaCreacion"];
const createRows = [delegationHeaders];
const createHarness = makeMutationContext(createRows, false);
const createdDelegation = createHarness.context.create({
  _verifiedUserId: "ADMIN", delegadoUserId: "U-CREATE", accionesAutorizadas: ["createTask"],
  fechaInicio: new Date(Date.now() - 1000), fechaFin: new Date(Date.now() + 60000)
});
assert.equal(createdDelegation.status, "success");
assert.equal(createHarness.bumps[0].key, "USER_DELEGATION:U-CREATE");
assert.equal(createRows.length, 2, "successful grant persists one row");
assert.equal(createHarness.releases(), 1, "grant releases its ScriptLock");

const failedCreateRows = [delegationHeaders];
const failedCreate = makeMutationContext(failedCreateRows, true);
assert.throws(() => failedCreate.context.create({
  _verifiedUserId: "ADMIN", delegadoUserId: "U-ROLLBACK", accionesAutorizadas: ["createTask"],
  fechaInicio: new Date(Date.now() - 1000), fechaFin: new Date(Date.now() + 60000)
}), /DELEGATION_VERSION_INVALIDATION_FAILED/);
assert.equal(failedCreateRows.length, 1, "failed grant versioning compensates the inserted row");

const revokeRows = [delegationHeaders, ["DEL-REVOKE","ADMIN","U-REVOKE","createTask","General",
  new Date(Date.now() - 1000), new Date(Date.now() + 60000),"Activa","","ADMIN",new Date()]];
const revokeHarness = makeMutationContext(revokeRows, false);
const revoked = revokeHarness.context.revoke({ _verifiedUserId: "ADMIN", delegacionId: "DEL-REVOKE" });
assert.equal(revoked.status, "success");
assert.equal(revokeRows[1][7], "Revocada");
assert.equal(revokeHarness.bumps[0].key, "USER_DELEGATION:U-REVOKE");
const bumpCountAfterRevoke = revokeHarness.bumps.length;
assert.equal(revokeHarness.context.revoke({ _verifiedUserId: "ADMIN", delegacionId: "DEL-REVOKE" }).idempotent, true);
assert.equal(revokeHarness.bumps.length, bumpCountAfterRevoke, "idempotent revocation does not bump twice");

const failedRevokeRows = [delegationHeaders, ["DEL-ROLLBACK","ADMIN","U-ROLLBACK","createTask","General",
  new Date(Date.now() - 1000), new Date(Date.now() + 60000),"Activa","","ADMIN",new Date()]];
const failedRevoke = makeMutationContext(failedRevokeRows, true);
assert.throws(() => failedRevoke.context.revoke({ _verifiedUserId: "ADMIN", delegacionId: "DEL-ROLLBACK" }),
  /DELEGATION_VERSION_INVALIDATION_FAILED/);
assert.equal(failedRevokeRows[1][7], "Activa", "failed revocation versioning restores the prior delegation state");

process.stdout.write("security-delegation-version-propagation: four-service revocation, grant, expiry, future-start, versioned state caches and mutation hooks PASS\n");
