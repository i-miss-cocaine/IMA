"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });

function extractFunction(name) {
  const match = new RegExp("function " + name + "\\s*\\(").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

function sheet(rows) {
  return { rows, getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; } };
}
function fixture(options = {}) {
  const rows = [
    ["REC-1", "E-1", "STU-1", 60, 80, 80, "Sustitucion", "PROF-1", new Date("2026-11-10T10:00:00Z")],
    ["REC-2", "E-2", "STU-2", 50, 70, 70, "Mayor", "PROF-2", new Date("2026-11-10T11:00:00Z")],
    ["REC-3", "E-3", "STU-1", "bad", 75, 75, "Promedio", "PROF-1", "invalid-date"],
    ["REC-DUP", "E-4", "STU-1", 20, 40, 40, "Mayor", "PROF-1", null],
    ["REC-DUP", "E-5", "STU-1", 30, 50, 50, "Mayor", "PROF-1", null],
    ["", "E-6", "STU-1", 20, 40, 40, "Mayor", "PROF-1", null],
    ["REC-EMPTY-EVAL", "", "STU-1", 20, 40, 40, "Mayor", "PROF-1", null],
    ["REC-BLANK", "E-7", "STU-1", "", " ", null, "Mayor", "PROF-1", null]
  ];
  const sheets = {
    Usuarios: sheet([["UserID"], ["STU-1", "Student", "10", "A", "", "", "Estudiante"],
      ["STU-2", "Other", "10", "A", "", "", "Estudiante"], ["DUP", "A", "10", "A", "", "", "Estudiante"],
      ["DUP", "B", "10", "A", "", "", "Estudiante"]])
  };
  if (!options.missingSheet) sheets.RecuperacionesEstudiante = sheet([
    ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada", "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"],
    ...rows
  ]);
  const ss = { getSheetByName: name => sheets[name] || null };
  const actor = options.actor || { userId: "STU-1", role: "Estudiante" };
  const context = {
    actor, ss, scope: { authorized: options.authorized !== false, institutionWide: options.institutionWide !== false },
    studentActor: actor.role === "Estudiante" || actor.role === "Alumno",
    guardianActor: options.guardian === true,
    profile: options.profile || (options.guardian ? { userId: "STU-1", role: "Estudiante" } : null)
  };
  let held = false, acquires = 0, releases = 0;
  const LockService = { getScriptLock() { return {
    tryLock() { acquires++; if (options.beforeAcquire) { const callback = options.beforeAcquire; options.beforeAcquire = null; callback(); } if (options.lockAvailable === false || held) return false; held = true; return true; },
    releaseLock() { releases++; held = false; }
  }; } };
  const helpers = [
    "getStudentRecoveries", "getStudentRecoveriesUnlocked_", "withAuthorizedExamRead_"
  ].map(extractFunction).join("\n");
  const vmContext = {
    LockService,
    getAuthorizedExamReadContext_(action, payload) {
      if (action !== "getStudentRecoveries" || options.permissionDenied || context.scope.authorized !== true) {
        throw new Error("RESOURCE_NOT_AVAILABLE");
      }
      return context;
    },
    getExamStudentProfile_(spreadsheet, id) {
      const data = spreadsheet.getSheetByName("Usuarios").getDataRange().getValues();
      const matches = data.slice(1).filter(row => String(row[0] || "").trim() === id);
      if (matches.length !== 1) return null;
      return { userId: id, role: String(matches[0][6] || "").trim(), grado: "10", seccion: "A" };
    },
    getSheetOrThrow(spreadsheet, name) {
      const result = spreadsheet.getSheetByName(name);
      if (!result) throw new Error("MISSING_SHEET");
      return result;
    }
  };
  vm.runInNewContext(helpers + "\nthis.getStudentRecoveries = getStudentRecoveries;", vmContext);
  return { call: payload => vmContext.getStudentRecoveries(payload), sheets,
    stats: () => ({ acquires, releases, held }) };
}

const cases = [];
function test(name, fn) { fn(); cases.push(name); }
function denied(fn, pattern = /RESOURCE_NOT_AVAILABLE/) { assert.throws(fn, pattern); }

test("student sees own recoveries only", () => {
  const x = fixture(), result = x.call({});
  assert.deepEqual(Array.from(result.data, row => row.userId), ["STU-1", "STU-1", "STU-1"]);
  assert.equal(result.data.length, 3);
});
test("student cannot request another user", () => denied(() => fixture().call({ userId: "STU-2" })));
test("student can filter by evaluation", () => {
  const result = fixture().call({ evaluacionId: "E-1" });
  assert.deepEqual(Array.from(result.data, row => row.recuperacionId), ["REC-1"]);
});
test("guardian reads verified linked student only", () => {
  const x = fixture({ actor: { userId: "GUARD-1", role: "Tutor" }, guardian: true });
  assert.equal(x.call({ userId: "STU-1" }).data.length, 3);
});
test("guardian cannot change target", () => denied(() => fixture({
  actor: { userId: "GUARD-1", role: "Tutor" }, guardian: true
}).call({ userId: "STU-2" })));
test("guardian context must be verified", () => denied(() => fixture({
  actor: { userId: "GUARD-1", role: "Tutor" }, guardian: false
}).call({ userId: "STU-1" })));
test("institution role requires institution-wide scope", () => denied(() => fixture({
  actor: { userId: "ADMIN", role: "Administrador" }, institutionWide: false
}).call({ userId: "STU-1" })));
test("institution role requires explicit target", () => denied(() => fixture({
  actor: { userId: "ADMIN", role: "Administrador" }
}).call({})));
test("institution role reads one validated student", () => {
  assert.equal(fixture({ actor: { userId: "ADMIN", role: "Administrador" } })
    .call({ userId: "STU-1" }).data.length, 3);
});
test("teacher cannot bypass gradebook assignment and roster controls", () => denied(() => fixture({
  actor: { userId: "PROF-1", role: "Profesor" }
}).call({ userId: "STU-1" })));
test("unknown role denied", () => denied(() => fixture({
  actor: { userId: "OTHER", role: "Coordinador" }
}).call({ userId: "STU-1" })));
test("RBAC permission denial", () => denied(() => fixture({ permissionDenied: true }).call({})));
test("unauthorized scope denied", () => denied(() => fixture({ authorized: false }).call({})));
test("lock timeout fails closed", () => {
  const x = fixture({ lockAvailable: false });
  denied(() => x.call({}), /EXAM_READ_LOCK_TIMEOUT/);
  assert.deepEqual(x.stats(), { acquires: 1, releases: 0, held: false });
});
test("lock released after read", () => {
  const x = fixture(); x.call({});
  assert.deepEqual(x.stats(), { acquires: 1, releases: 1, held: false });
});
test("missing sheet returns empty without creating it", () => {
  const x = fixture({ missingSheet: true });
  assert.deepEqual(x.call({}), { status: "success", data: [] });
  assert.equal(x.sheets.RecuperacionesEstudiante, undefined);
});
test("duplicate and empty recovery IDs excluded", () => {
  const result = fixture().call({});
  assert.ok(!result.data.some(row => row.recuperacionId === "REC-DUP" || !row.recuperacionId));
});
test("empty evaluation IDs excluded", () => {
  const result = fixture().call({});
  assert.ok(!result.data.some(row => row.recuperacionId === "REC-EMPTY-EVAL"));
});
test("invalid numeric values and dates are normalized", () => {
  const row = fixture().call({}).data.find(item => item.recuperacionId === "REC-3");
  assert.equal(row.notaOriginal, null);
  assert.equal(row.fecha, null);
});
test("blank grade cells remain null instead of becoming zero", () => {
  const row = fixture().call({}).data.find(item => item.recuperacionId === "REC-BLANK");
  assert.equal(row.notaOriginal, null);
  assert.equal(row.notaRecuperada, null);
  assert.equal(row.notaFinalCalculada, null);
});
test("post-lock snapshot includes a recovery inserted before lock acquisition", () => {
  let x;
  x = fixture({ beforeAcquire() { x.sheets.RecuperacionesEstudiante.rows.push(["REC-AFTER", "E-8", "STU-1", 10, 20, 20, "Mayor", "PROF-1", null]); } });
  assert.ok(x.call({}).data.some(item => item.recuperacionId === "REC-AFTER"));
});
test("duplicate student identity denied", () => denied(() => fixture({
  actor: { userId: "DUP", role: "Estudiante" }
}).call({})));
test("schema mismatch fails closed", () => {
  const x = fixture(); x.sheets.RecuperacionesEstudiante.rows[0][0] = "Wrong";
  denied(() => x.call({}), /STUDENT_RECOVERY_SCHEMA_INVALID/);
});

process.stdout.write("exam-service-student-recoveries-security: PASS (" + cases.length + " scenarios)\n");
