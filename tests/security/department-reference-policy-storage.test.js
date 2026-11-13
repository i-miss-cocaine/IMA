const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });

function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function makeSheet(rows) {
  const data = (rows || []).map(row => row.slice());
  return {
    getLastRow() { return data.length; },
    getDataRange() { return { getValues: () => data.map(row => row.slice()) }; },
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          const count = numRows || 1, width = numCols || 1;
          return data.slice(row - 1, row - 1 + count).map(line => line.slice(col - 1, col - 1 + width));
        },
        setValues(values) {
          values.forEach((line, i) => {
            const target = data[row - 1 + i] || (data[row - 1 + i] = []);
            line.forEach((value, j) => { target[col - 1 + j] = value; });
          });
        }
      };
    },
    appendRow(row) { data.push(row.slice()); },
    snapshot() { return data.map(row => row.slice()); }
  };
}
function makeRuntime(initialRows) {
  const sheets = {};
  if (initialRows !== undefined) sheets.ConfiguracionInstitucional = makeSheet(initialRows);
  const state = {
    sheets, context: { status: "success", institutionId: "I1", institutionWide: true },
    permissions: { getDepartmentReferencePolicy: true, manageDepartmentReferencePolicy: true },
    lockBusy: false, logs: []
  };
  const ss = {
    getSheetByName(name) { return state.sheets[name] || null; },
    insertSheet(name) { const sheet = makeSheet([]); state.sheets[name] = sheet; return sheet; }
  };
  const lock = { tryLock() { return !state.lockBusy; }, releaseLock() {} };
  const runtime = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById() { return ss; } },
    LockService: { getScriptLock() { return lock; } },
    getUserVerifiedRole(payload) { payload._verifiedUserId = payload.userId || "U1"; return payload.role || "Coordinador"; },
    getDynamicPermissionsForRole(role, action) { return state.permissions[action] === true; },
    getUserContextScope() { return state.context; },
    logStructuredEvent(...args) { state.logs.push(args); },
    Date, JSON, String, Array, Object, isNaN
  };
  const constantsStart = source.indexOf("const DEPARTMENT_REFERENCE_POLICY_KEY_");
  const constantsEnd = source.indexOf("function evaluateDepartmentReferenceAccess_(input)");
  assert.ok(constantsStart >= 0 && constantsEnd > constantsStart, "policy constants and storage helpers exist");
  const definitions = source.slice(constantsStart, constantsEnd) +
    extractFunction(source, "getDepartmentReferencePolicy") +
    "\n" + extractFunction(source, "setDepartmentReferencePolicy") +
    "\nthis.getPolicy = getDepartmentReferencePolicy_; this.getEndpoint = getDepartmentReferencePolicy; this.setEndpoint = setDepartmentReferencePolicy;";
  vm.runInNewContext(definitions, runtime);
  return { runtime, state };
}
const HEADERS = ["InstitutionID", "ConfigKey", "ConfigValue", "UpdatedBy", "UpdatedAt"];
const KEY = "POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL";
const STRICT = "BLOQUEO_TOTAL_CROSS_DEPARTAMENTO";
const READ_ONLY = "PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL";
function row(institution, value, actor, at) { return [institution, KEY, value, actor || "U0", at || "2026-11-01T00:00:00.000Z"]; }
function payload(value) { return { userId: "U1", role: "Coordinador", value: value }; }

{
  const h = makeRuntime();
  const result = h.runtime.getPolicy("I1");
  assert.equal(result.status, "success");
  assert.equal(result.value, STRICT);
  assert.equal(result.source, "DEFAULT");
  assert.equal(h.state.sheets.ConfiguracionInstitucional, undefined, "read must not create a sheet");
}
{
  const h = makeRuntime([HEADERS, row("I2", READ_ONLY)]);
  const result = h.runtime.getPolicy("I1");
  assert.equal(result.status, "success");
  assert.equal(result.value, STRICT, "other tenant configuration is ignored");
  assert.equal(h.runtime.getPolicy("I2").value, READ_ONLY);
}
{
  const h = makeRuntime([HEADERS, row("I1", READ_ONLY)]);
  const result = h.runtime.getPolicy("I1");
  assert.equal(result.status, "success");
  assert.equal(result.source, "CONFIGURACION_INSTITUCIONAL");
}
{
  const h = makeRuntime([HEADERS, row("I1", READ_ONLY), row("I1", STRICT)]);
  assert.equal(h.runtime.getPolicy("I1").code, "DEPARTMENT_REFERENCE_POLICY_AMBIGUOUS");
}
{
  const h = makeRuntime([["InstitutionID", "WrongKey", "ConfigValue", "UpdatedBy", "UpdatedAt"]]);
  assert.equal(h.runtime.getPolicy("I1").code, "DEPARTMENT_REFERENCE_POLICY_SCHEMA_MISMATCH");
}
{
  const h = makeRuntime([HEADERS, row("I1", "ALLOW_ALL")]);
  assert.equal(h.runtime.getPolicy("I1").code, "DEPARTMENT_REFERENCE_POLICY_UNKNOWN");
}
{
  const h = makeRuntime();
  h.state.permissions.getDepartmentReferencePolicy = false;
  assert.equal(h.runtime.getEndpoint(payload()).code, "AUTH_PERMISSION_DENIED");
}
{
  const h = makeRuntime();
  const result = h.runtime.getEndpoint(payload());
  assert.equal(result.status, "success");
  assert.equal(result.value, STRICT);
}
{
  const h = makeRuntime();
  h.state.permissions.manageDepartmentReferencePolicy = false;
  assert.equal(h.runtime.setEndpoint(payload(READ_ONLY)).code, "AUTH_PERMISSION_DENIED");
  assert.equal(h.state.sheets.ConfiguracionInstitucional, undefined);
}
{
  const h = makeRuntime();
  h.state.context.institutionWide = false;
  assert.equal(h.runtime.setEndpoint(payload(READ_ONLY)).code, "INSTITUTION_WIDE_SCOPE_REQUIRED");
  assert.equal(h.state.sheets.ConfiguracionInstitucional, undefined);
}
{
  const h = makeRuntime();
  assert.equal(h.runtime.setEndpoint(payload("ALLOW_ALL")).code, "DEPARTMENT_REFERENCE_POLICY_VALUE_INVALID");
  assert.equal(h.state.sheets.ConfiguracionInstitucional, undefined);
}
{
  const h = makeRuntime();
  const result = h.runtime.setEndpoint(payload(READ_ONLY));
  assert.equal(result.status, "success");
  assert.equal(result.value, READ_ONLY);
  assert.deepEqual(h.state.sheets.ConfiguracionInstitucional.snapshot()[0], HEADERS);
  assert.equal(h.state.sheets.ConfiguracionInstitucional.snapshot()[1][0], "I1");
  assert.equal(h.state.sheets.ConfiguracionInstitucional.snapshot()[1][3], "U1");
}
{
  const h = makeRuntime([HEADERS, row("I2", STRICT)]);
  const result = h.runtime.setEndpoint(payload(READ_ONLY));
  assert.equal(result.status, "success");
  const rows = h.state.sheets.ConfiguracionInstitucional.snapshot();
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], "I2", "another tenant row is preserved");
  assert.equal(rows[2][0], "I1");
}
{
  const h = makeRuntime([HEADERS, row("I1", STRICT)]);
  const result = h.runtime.setEndpoint(payload(READ_ONLY));
  assert.equal(result.status, "success");
  assert.equal(h.state.sheets.ConfiguracionInstitucional.snapshot()[1][2], READ_ONLY);
  assert.equal(h.state.logs.length, 1);
}
{
  const h = makeRuntime([HEADERS, row("I1", READ_ONLY)]);
  const before = h.state.sheets.ConfiguracionInstitucional.snapshot()[1][4];
  const result = h.runtime.setEndpoint(payload(READ_ONLY));
  assert.equal(result.status, "success");
  assert.equal(result.unchanged, true);
  assert.equal(h.state.sheets.ConfiguracionInstitucional.snapshot()[1][4], before);
}
{
  const h = makeRuntime([HEADERS, row("I1", STRICT), row("I1", READ_ONLY)]);
  assert.equal(h.runtime.setEndpoint(payload(READ_ONLY)).code, "DEPARTMENT_REFERENCE_POLICY_AMBIGUOUS");
  assert.equal(h.state.sheets.ConfiguracionInstitucional.snapshot().length, 3);
}
{
  const h = makeRuntime();
  h.state.lockBusy = true;
  assert.equal(h.runtime.setEndpoint(payload(READ_ONLY)).code, "DEPARTMENT_REFERENCE_POLICY_LOCK_TIMEOUT");
  assert.equal(h.state.sheets.ConfiguracionInstitucional, undefined, "lock timeout must not create the sheet");
}
{
  const h = makeRuntime();
  const result = h.runtime.setEndpoint(payload(STRICT));
  assert.equal(result.status, "success");
  assert.equal(h.runtime.getPolicy("I1").value, STRICT);
}
process.stdout.write("Department reference policy storage contract: 18 scenarios PASS.\n");
