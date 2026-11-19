"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

const headers = ["RunId","InstitutionID","NombreArchivo","HashSHA256","PreviewHash","SistemaOrigen",
  "TipoEntidad","DestinoModulo","ActorUserId","Fecha","Estado","RegistrosEscritos","CorrelationId"];
const rows = [
  headers,
  ["RUN-1","INST-1","same-name.pdf","a".repeat(64),"b".repeat(64),"LEGACY","curso","ACCOUNTING","AUD-1",
    new Date("2026-11-15T20:00:00Z"),"completed",3,"CORR-1"],
  ["RUN-2","INST-2","other.pdf","c".repeat(64),"d".repeat(64),"LEGACY","empleado","ACCOUNTING","AUD-2",
    new Date("2026-11-15T21:00:00Z"),"completed",1,"CORR-2"]
];
const sheet = { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
const state = {
  actor: { authorized: true, userId: "AUD-1", role: "Auditor", institutionId: "INST-1" },
  auth: { status: "success", authorized: true, auditReadPermissionVerified: true,
    userId: "AUD-1", role: "Auditor", institutionId: "INST-1" },
  calls: [], hasSheet: true
};
const runtime = {
  SPREADSHEET_ID: "SHEET-1", ROLE_PERMISSIONS: { Auditor: ["getAccountingMigrationFileAudit"] },
  Date, String, Number, Array, Object, isFinite,
  getVerifiedAccountingIdentity_: () => state.actor,
  requestAccountingUserAuthorization_(action, payload) { state.calls.push({ action, payload }); return state.auth; },
  SpreadsheetApp: { openById(id) { assert.equal(id, "SHEET-1"); return {
    getSheetByName(name) { assert.equal(name, "AuditoriaMigracionesArchivos"); return state.hasSheet ? sheet : null; }
  }; } }
};
vm.runInNewContext([
  extractFunction("accountingHasRolePermission_"),
  extractFunction("accountingHasInstitutionalAuditReadPermission_"),
  extractFunction("getAccountingMigrationFileAudit"),
  "this.canRead = accountingHasInstitutionalAuditReadPermission_; this.audit = getAccountingMigrationFileAudit;"
].join("\n"), runtime);

const result = runtime.audit({ sessionToken: "SIGNED", institutionId: "INST-1", limit: 1 });
assert.equal(result.status, "success");
assert.equal(result.institutionId, "INST-1");
assert.equal(result.total, 1);
assert.equal(result.data.length, 1);
assert.equal(result.data[0].runId, "RUN-1");
assert.equal(result.data[0].hashSHA256, "a".repeat(64));
assert.equal(result.data[0].previewHash, "b".repeat(64));
assert.equal(result.data[0].actorUserId, "AUD-1");
assert.equal("fileData" in result.data[0], false);
assert.equal("errores" in result.data[0], false);
assert.equal(state.calls[0].action, "authorizeAccountingAuditRead");
assert.equal(state.calls[0].payload.institutionId, "INST-1");

const beforeCrossTenantCalls = state.calls.length;
assert.equal(runtime.audit({ sessionToken: "SIGNED", institutionId: "INST-2" }).code, "AUDIT_READ_PERMISSION_DENIED");
assert.equal(state.calls.length, beforeCrossTenantCalls, "cross-tenant requests are rejected before the USER authorization call");

state.actor = { authorized: true, userId: "DIR-1", role: "Director", institutionId: "INST-1" };
assert.equal(runtime.audit({ sessionToken: "SIGNED" }).code, "AUDIT_READ_PERMISSION_DENIED",
  "this endpoint is reserved for the Auditor role");
state.actor = { authorized: true, userId: "AUD-1", role: "Auditor", institutionId: "INST-1" };
state.auth = { status: "error", code: "INSTITUTION_SCOPE_DENIED" };
assert.equal(runtime.audit({ sessionToken: "SIGNED" }).code, "AUDIT_READ_PERMISSION_DENIED",
  "missing institution-wide scope denies the audit view");
state.auth = { status: "success", authorized: true, auditReadPermissionVerified: true,
  userId: "AUD-1", role: "Auditor", institutionId: "INST-1" };
state.hasSheet = false;
assert.deepEqual(JSON.parse(JSON.stringify(runtime.audit({ sessionToken: "SIGNED" }).data)), []);
assert.equal(runtime.canRead({ role: "Director", sessionToken: "SIGNED" }), false);
assert.doesNotMatch(extractFunction("getAccountingMigrationFileAudit"), /appendRow|setValue|setValues|deleteRow/,
  "Accounting Auditor audit endpoint is read-only");
process.stdout.write("Accounting Auditor migration audit: institution scope, USER authorization, hash metadata, tenant isolation and read-only behavior PASS.\n");
