"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
function makeSheet(initialRows) {
  const rows = initialRows.map(row => row.slice());
  return {
    rows,
    getLastRow() { return rows.length; },
    getLastColumn() { return rows.length ? rows[0].length : 0; },
    getDataRange() { return { getValues() { return rows.map(row => row.slice()); } }; },
    getRange(row, column, numRows, numColumns) {
      return {
        getValues() { return rows.slice(row - 1, row - 1 + (numRows || 1)).map(item => item.slice(column - 1, column - 1 + (numColumns || 1))); },
        setValue(value) {
          while (rows.length < row) rows.push([]);
          while (rows[row - 1].length < column) rows[row - 1].push("");
          rows[row - 1][column - 1] = value;
        },
        setValues(values) {
          values.forEach((valuesRow, offset) => {
            while (rows.length < row + offset) rows.push([]);
            rows[row + offset - 1] = valuesRow.slice();
          });
        }
      };
    },
    appendRow(row) { rows.push(row.slice()); }
  };
}
const headers = ["SesionID", "Fecha", "HoraInicio", "HoraFin", "Grado", "Seccion", "AsignaturaID", "DocenteUserId", "Estado", "Observaciones"];
const sheet = makeSheet([]);
const spreadsheet = { getSheetByName(name) { return name === "SesionesAsistencia" ? sheet : null; } };
const context = {
  actor: { authorized: true, userId: "TEACHER-1", role: "Profesor" },
  SPREADSHEET_ID: "TEST-SPREADSHEET",
  getVerifiedAcademicIdentity_() { return context.actor; },
  getOrCreateSheet(ss, name) {
    assert.equal(name, "SesionesAsistencia");
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
    return sheet;
  },
  SpreadsheetApp: { openById(id) { assert.equal(id, "TEST-SPREADSHEET"); return spreadsheet; } },
  LockService: { getScriptLock() { return { waitLock() {}, releaseLock() {} }; } },
  String, Number, Array, Object, Math, Date, Error, Set
};
vm.createContext(context);
const sourceFunctions = [
  extract("ensureAttendanceSessionClosureHeader_"),
  extract("getAttendanceSessionForTeacher_"),
  extract("openAttendanceSession"),
  extract("closeAttendanceSession"),
  extract("saveClassAttendance"),
  extract("bulkApplyAttendanceStatus")
].join("\n") + "\nthis.openSession=openAttendanceSession;\nthis.closeSession=closeAttendanceSession;\nthis.saveAttendance=saveClassAttendance;\nthis.bulkAttendance=bulkApplyAttendanceStatus;";
vm.runInContext(sourceFunctions, context);
assert.throws(() => context.openSession({ grado: "11", asignaturaId: "SUB-1", docenteUserId: "ATTACKER" }), /ATTENDANCE_SESSION_TEACHER_MISMATCH/);
const opened = context.openSession({ fecha: "2026-02-03", grado: "11", seccion: "A", asignaturaId: "SUB-1", docenteUserId: "TEACHER-1" });
assert.equal(opened.status, "success");
const sessionRow = sheet.rows[1];
const sessionIndex = Object.fromEntries(sheet.rows[0].map((key, i) => [key, i]));
assert.equal(sessionRow[sessionIndex.DocenteUserId], "TEACHER-1");
assert.equal(sessionRow[sessionIndex.Estado], "Abierta");
assert.equal(sessionRow[sessionIndex.FechaCierre], "");
const closed = context.closeSession({ sesionId: opened.data.sesionId });
assert.equal(closed.status, "success");
assert.equal(closed.data.estado, "Cerrada");
assert.equal(sheet.rows[1][sessionIndex.Estado], "Cerrada");
assert.ok(sheet.rows[1][sessionIndex.FechaCierre] instanceof Date);
const repeated = context.closeSession({ sesionId: opened.data.sesionId });
assert.equal(repeated.idempotent, true);
assert.ok(repeated.data.fechaCierre);
context.actor = { authorized: true, userId: "OTHER-TEACHER", role: "Profesor" };
assert.throws(() => context.closeSession({ sesionId: opened.data.sesionId }), /ATTENDANCE_SESSION_TEACHER_MISMATCH/);
context.actor = { authorized: true, userId: "TEACHER-1", role: "Profesor" };
assert.throws(() => context.saveAttendance({ sesionId: opened.data.sesionId, registros: [{ userId: "STU-1", estadoAsistencia: "Presente" }] }), /ATTENDANCE_SESSION_NOT_OPEN/);
const bulkResult = context.bulkAttendance({ sesionId: opened.data.sesionId, estudiantes: ["STU-1"], estadoAsistencia: "Presente" });
assert.equal(bulkResult.code, "ATTENDANCE_SESSION_NOT_OPEN");
assert.throws(() => context.saveAttendance({ sesionId: opened.data.sesionId, registros: [{ userId: "STU-1", justificado: true }] }), /ATTENDANCE_JUSTIFICATION_REQUIRES_CANONICAL_REVIEW/);
const openSessionSource = extract("openAttendanceSession");
const closeSessionSource = extract("closeAttendanceSession");
const saveSource = extract("saveClassAttendance");
const bulkSource = extract("bulkApplyAttendanceStatus");
const snapshotSource = extract("getSaceAttendanceSnapshot");
assert(openSessionSource.includes("actor.userId"));
assert(closeSessionSource.includes("getAttendanceSessionForTeacher_"));
assert(closeSessionSource.includes('session.state !== "ABIERTA"'));
assert(saveSource.includes("getAttendanceSessionForTeacher_"));
assert(saveSource.includes('session.state !== "ABIERTA"'));
assert(!saveSource.includes("row[regIndex.Justificado] = record.justificado"));
assert(bulkSource.includes("getAttendanceSessionForTeacher_"));
assert(bulkSource.includes('session.state !== "ABIERTA"'));
assert(snapshotSource.includes('"Estado", "FechaCierre"'));
assert(snapshotSource.includes("SACE_ATTENDANCE_SESSION_CLOSE_TIMESTAMP_REQUIRED"));
const roleBlock = source.slice(source.indexOf("const ROLE_PERMISSIONS"), source.indexOf("// [TAREA-F4-P0-01]"));
assert(roleBlock.includes('"closeAttendanceSession"'));
assert(extract("doPost").includes('case "closeAttendanceSession": result = closeAttendanceSession(payload); break;'));
console.log("academic-attendance-session-closure-contract: PASS (verified teacher owner, closure timestamp, idempotency, immutable closed sessions and canonical justification path)");
