"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const expectedActions = [
  ["getTransportRoutes", "getTransportRoutes", { rutaId: "R-1" }, "rutas"],
  ["getTransportAssignments", "getTransportAssignments", { rutaId: "R-1" }, "asignaciones"],
  ["getTripPassengerManifest", "getTripPassengerManifest", { viajeId: "V-1" }, "manifiestoPasajeros"],
  ["getTransportEfficiencyMetrics", "getTransportEfficiencyMetrics", {}, "rutas"]
];
const calls = { permissions: [], audits: [], opens: 0, scope: 0, locks: 0 };
const context = {
  getVerifiedAccountingIdentity_: () => ({ authorized: true, userId: "DIRECTOR-1", role: "Director", institutionId: "INST-1" }),
  validateRolePermission: (actor, action) => {
    calls.permissions.push(action);
    return { authorized: false, code: "ROLE_PERMISSION_DENIED" };
  },
  transportAuditDenied_: (actor, action, resourceId) => calls.audits.push({ action, resourceId }),
  SpreadsheetApp: { openById: () => { calls.opens++; throw new Error("Spreadsheet read occurred before permission check"); } },
  resolveTransportAccessScope_: () => { calls.scope++; throw new Error("scope resolution occurred before permission check"); },
  LockService: { getScriptLock: () => { calls.locks++; throw new Error("lock acquired before permission check"); } },
  Date, String, Number, Object, Array, JSON, Math
};
vm.createContext(context);
const names = expectedActions.map(item => item[0]);
vm.runInContext(names.map(extractFunction).join("\n") +
  "\nthis.handlers = {" + names.map(name => name + ":" + name).join(",") + "};", context);

for (const [name, action, payload, responseKey] of expectedActions) {
  const result = context.handlers[name](payload);
  assert.equal(result.status, "error", name + " must deny a revoked action permission");
  assert.equal(result.code, "ROLE_PERMISSION_DENIED", name + " must return the permission denial");
  if (responseKey === "asignaciones") assert.deepEqual(Array.from(result.asignaciones || []), []);
  if (responseKey === "manifiestoPasajeros") assert.deepEqual(Array.from(result.manifiestoPasajeros || []), []);
  if (responseKey === "rutas") assert.deepEqual(Array.from(result.rutas || []), []);
}
assert.deepEqual(calls.permissions, expectedActions.map(item => item[1]));
assert.equal(calls.audits.length, expectedActions.length, "each denied read must be audited");
assert.equal(calls.opens, 0, "denied reads must not open the institutional spreadsheet");
assert.equal(calls.scope, 0, "denied reads must not resolve or enumerate resource scope");
assert.equal(calls.locks, 0, "denied analytics reads must not acquire the global lock");

console.log("accounting-transport-read-permissions: all assertions passed");
