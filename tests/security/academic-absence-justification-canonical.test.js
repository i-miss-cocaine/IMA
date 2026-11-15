"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const store = Object.create(null);
let lockBusy = false;
let failNext = null;
function sheet(name) {
  if (!store[name]) store[name] = [];
  const rows = store[name];
  function width() { return rows.reduce((m, r) => Math.max(m, r.length), 0); }
  function padded(row) { return Array.from({ length: width() }, (_, i) => row[i] === undefined ? "" : row[i]); }
  return {
    getLastRow() { return rows.length; },
    getLastColumn() { return width(); },
    getDataRange() { return { getValues() { return rows.map(padded); } }; },
    appendRow(row) { rows.push(row.slice()); },
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          const h = numRows || 1, w = numCols || 1, out = [];
          for (let r = 0; r < h; r++) {
            const sourceRow = rows[row - 1 + r] || [];
            out.push(Array.from({ length: w }, (_, c) => sourceRow[col - 1 + c] === undefined ? "" : sourceRow[col - 1 + c]));
          }
          return out;
        },
        setValue(value) {
          if (failNext && failNext.sheet === name && failNext.col === col) { failNext = null; throw new Error("INJECTED_WRITE_FAILURE"); }
          while (rows.length < row) rows.push([]);
          while (rows[row - 1].length < col) rows[row - 1].push("");
          rows[row - 1][col - 1] = value;
        },
        setValues(values) {
          values.forEach((valuesRow, ri) => {
            while (rows.length < row + ri) rows.push([]);
            while (rows[row + ri - 1].length < col + valuesRow.length - 1) rows[row + ri - 1].push("");
            valuesRow.forEach((value, ci) => { rows[row + ri - 1][col + ci - 1] = value; });
          });
        }
      };
    }
  };
}
const context = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById() { return { getSheetByName(name) { return store[name] ? sheet(name) : null; } }; } },
  LockService: { getScriptLock() { return { waitLock() { if (lockBusy) throw new Error("LOCK_BUSY"); }, releaseLock() {} }; } },
  Utilities: { formatDate(date) { return date.toISOString().slice(0, 10); } },
  Session: { getScriptTimeZone() { return "UTC"; } },
  getOrCreateSheet(_ss, name) { return sheet(name); },
  logStructuredEvent() {},
  Date, Math, JSON, String, Number, Array, Object, Error
};
const names = [
  "ensureAbsenceHeaders_", "absenceDateKey_", "absenceResolvePeriod_", "absenceResolveSessions_",
  "absenceSheetMap_", "createCanonicalAbsenceJustification_", "createCanonicalAbsenceJustificationUnlocked_",
  "absenceUpdateRequestProjection_", "absenceAttendanceSync_", "reviewCanonicalAbsenceJustification_",
  "reconcilePendingAttendanceJustifications"
];
vm.createContext(context);
const constants = source.split("\n").filter(line => /^const ABSENCE_(JUSTIFICATION_HEADERS_|ATTENDANCE_HEADERS_|REQUEST_EXTRA_HEADERS_)/.test(line)).join("\n");
vm.runInContext(constants + "\n" + names.map(extractFunction).join("\n"), context);

const period = sheet("PeriodosAcademicos");
period.appendRow(["PeriodoID","AnoID","Nombre","Tipo","FechaInicio","FechaFin","Orden","Estado"]);
period.appendRow(["P1","ANO-1","I parcial","Parcial","2026-01-01","2026-12-31",1,"Activo"]);
const sessions = sheet("SesionesAsistencia");
sessions.appendRow(["SesionID","Fecha","HoraInicio","HoraFin","Grado","Seccion","AsignaturaID","DocenteUserId","Estado","Observaciones"]);
sessions.appendRow(["SES-1","2026-11-10","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-PRESENT","2026-11-10","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-REJECT","2026-11-11","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-PARTIAL","2026-11-12","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-AMB","2026-11-13","","","10","A","MAT","DOC-1","Cerrada",""]);
const attendance = sheet("RegistrosAsistencia");
attendance.appendRow(["RegistroID","SesionID","UserId","EstadoAsistencia","HoraLlegada","MinutosTardanza","Justificado","ObservacionDocente","FechaRegistro"]);
attendance.appendRow(["REG-1","SES-1","STU-1","Ausente","","",false,"",new Date("2026-11-10T12:00:00Z")]);
attendance.appendRow(["REG-2","SES-DIARIA-2026-11-10-10-A","STU-1","Tardanza","","",false,"",new Date("2026-11-10T12:00:00Z")]);
attendance.appendRow(["REG-3","SES-1","STU-2","Ausente","","",false,"",new Date("2026-11-10T12:00:00Z")]);
attendance.appendRow(["REG-4","SES-PRESENT","STU-1","Presente","","",false,"",new Date("2026-11-10T12:00:00Z")]);
attendance.appendRow(["REG-R","SES-REJECT","STU-1","Ausente","","",false,"",new Date("2026-11-11T12:00:00Z")]);
attendance.appendRow(["REG-P","SES-PARTIAL","STU-1","Ausente","","",false,"",new Date("2026-11-12T12:00:00Z")]);
attendance.appendRow(["REG-A1","SES-AMB","STU-1","Ausente","","",false,"",new Date("2026-11-13T12:00:00Z")]);
attendance.appendRow(["REG-A2","SES-AMB","STU-1","Ausente","","",false,"",new Date("2026-11-13T12:00:00Z")]);
const requests = sheet("SolicitudesTramites");
requests.appendRow(["SolicitudID","UserId","EstudianteID","TipoTramite","Descripcion","AdjuntoUrl","Estado","AsignadoA","ObservacionesAdmin","FechaSolicitud","FechaResolucion"]);
requests.appendRow(["JUST-TEST0001","ACT-1","STU-1","Justificación de Ausencia","Ausencia","", "SincronizacionPendiente","Secretaría","","",""]);

function create(id, date, studentId, motivo) {
  return context.createCanonicalAbsenceJustification_({
    justificacionId: id, solicitudId: id, studentId, fechaAfectada: date, periodo: "I parcial",
    motivoDeclarado: motivo || "Motivo médico", actorId: "ACT-1", actorRole: "Estudiante"
  });
}
const created = create("JUST-TEST0001", "2026-11-10", "STU-1");
assert.equal(created.status, "success");
assert.deepEqual(Array.from(created.data.sesionIds).sort(), ["SES-1","SES-DIARIA-2026-11-10-10-A"]);
assert.equal(create("JUST-TEST0001", "2026-11-10", "STU-1").idempotent, true);
assert.equal(create("JUST-TEST0001", "2026-11-10", "STU-1", "Otro motivo").code, "IDEMPOTENCY_CONFLICT");

const approved = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-TEST0001", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(approved.status, "success");
let regRows = attendance.getDataRange().getValues();
assert.equal(regRows[1][6], true);
assert.equal(regRows[1][9], "JUST-TEST0001");
assert.equal(regRows[2][6], true);
assert.equal(regRows[2][9], "JUST-TEST0001");
assert.equal(regRows[3][6], false, "another student's attendance must not be changed");
assert.equal(regRows[4][6], false, "present records must not be marked justified");
assert.equal(regRows[1][3], "Ausente", "the historical attendance state must be preserved");
assert.equal(context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-TEST0001", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
}).idempotent, true);

const revoked = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-TEST0001", nuevoEstado: "Cancelada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(revoked.status, "success");
regRows = attendance.getDataRange().getValues();
assert.equal(regRows[1][6], false);
assert.equal(regRows[1][9], "");
assert.equal(regRows[2][6], false);
assert.equal(regRows[2][9], "");

const rejectedCreate = create("JUST-REJECT001", "2026-11-11", "STU-1");
assert.equal(rejectedCreate.status, "success");
const rejected = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-REJECT001", nuevoEstado: "Rechazada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(rejected.status, "success");
assert.equal(rejected.data.syncEstado, "NO_REQUERIDA");
regRows = attendance.getDataRange().getValues();
assert.equal(regRows[5][6], false, "rejection must not mutate attendance");

const partialCreate = create("JUST-PARTIAL01", "2026-11-12", "STU-1");
assert.equal(partialCreate.status, "success");
failNext = { sheet: "RegistrosAsistencia", col: 7 };
const partial = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-PARTIAL01", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(partial.code, "ATTENDANCE_SYNC_PENDING");
const reconciled = context.reconcilePendingAttendanceJustifications({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría" });
assert.equal(reconciled.status, "success");
assert.equal(reconciled.processed, 1);
regRows = attendance.getDataRange().getValues();
assert.equal(regRows[6][6], true);
assert.equal(regRows[6][9], "JUST-PARTIAL01");

const ambiguous = create("JUST-AMBIGUOUS", "2026-11-13", "STU-1");
assert.equal(ambiguous.code, "ATTENDANCE_RECORD_AMBIGUOUS");
lockBusy = true;
const lockResult = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-TEST0001", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(lockResult.code, "LOCK_TIMEOUT");
lockBusy = false;

const userSource = fs.readFileSync("backend/user-service/Code.gs", "utf8");
assert.match(userSource, /createInterServiceEnvelope\("USER", "ACADEMIC", action/);
assert.match(userSource, /ACADEMIC_SERVICE_URL/);
assert.match(userSource, /ABSENCE_REVIEW_REQUIRES_CANONICAL_WORKFLOW/);
assert.match(userSource, /const solRow = solData\[idx\];\s*if \(String\(solRow\[3\] \|\| ""\) === "Justificación de Ausencia"\)/);
assert.match(source, /request\.sourceService === "USER"/);
assert.match(source, /verifyInterServiceEnvelope\(envelope, "ACADEMIC", secret\)/);
console.log("PASS: canonical absence justification, exact session ownership, idempotency, approval/rejection/revocation, partial-write recovery and trusted interservice contract");
