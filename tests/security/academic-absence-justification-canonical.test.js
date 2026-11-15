"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
const userSource = fs.readFileSync("backend/user-service/Code.gs", "utf8");

function extractFunction(name, fromSource = source) {
  const start = fromSource.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = fromSource.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < fromSource.length; i++) {
    const c = fromSource[i], n = fromSource[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return fromSource.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const store = Object.create(null);
let lockBusy = false;
let evidenceBytes = Buffer.from("%PDF-test");
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
  Utilities: {
    formatDate(date) { return date.toISOString().slice(0, 10); },
    getUuid() { return "UUID-ACADEMIC-00000001"; },
    computeDigest(_algorithm,value) {
      const bytes=Array.isArray(value)?Buffer.from(value.map(v=>v<0?v+256:v)):Buffer.from(String(value));
      return Array.from(crypto.createHash("sha256").update(bytes).digest()).map(v=>v>127?v-256:v);
    },
    DigestAlgorithm:{SHA_256:"SHA_256"}
  },
  DriveApp: {
    Access:{PRIVATE:"PRIVATE"},
    getFileById(id) {
      if(id!=="DRIVE-FILE-ATTACH-001") throw new Error("NOT_FOUND");
      return {isTrashed(){return false;},getSharingAccess(){return "PRIVATE";},getBlob(){return {getBytes(){return Array.from(evidenceBytes);},getContentType(){return "application/pdf";}};},getMimeType(){return "application/pdf";}};
    }
  },
  Session: { getScriptTimeZone() { return "UTC"; } },
  getOrCreateSheet(_ss, name) { return sheet(name); },
  logStructuredEvent() {},
  Date, Math, JSON, String, Number, Array, Object, Error
};
const names = [
  "ensureAbsenceHeaders_", "absenceDateKey_", "absenceResolvePeriod_", "absenceResolveSessions_",
  "absenceSheetMap_", "absenceInstitutionalPolicyValue_", "absenceJustificationPolicies_", "absenceTeacherConformityComplete_", "teacherJustificationActiveState_", "createCanonicalAbsenceJustification_", "createCanonicalAbsenceJustificationUnlocked_",
  "absenceUpdateRequestProjection_", "absenceAttendanceSync_", "reviewCanonicalAbsenceJustification_",
  "reconcilePendingAttendanceJustifications", "submitAttendanceJustification", "computeDocumentSHA256"
];
vm.createContext(context);
const constants = source.split("\n").filter(line => /^const ABSENCE_(JUSTIFICATION_HEADERS_|ATTENDANCE_HEADERS_|REQUEST_EXTRA_HEADERS_)/.test(line)).join("\n");
vm.runInContext(constants + "\n" + names.map(name => extractFunction(name)).join("\n"), context);

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
sessions.appendRow(["SES-ATTACH","2026-11-09","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-LEGACY","2026-11-08","","","10","A","MAT","DOC-1","Cerrada",""]);
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
attendance.appendRow(["REG-ATTACH","SES-ATTACH","STU-1","Ausente","","",false,"",new Date("2026-11-09T12:00:00Z")]);
attendance.appendRow(["REG-LEGACY","SES-LEGACY","STU-1","Ausente","","",false,"",new Date("2026-11-08T12:00:00Z")]);
const requests = sheet("SolicitudesTramites");
requests.appendRow(["SolicitudID","UserId","EstudianteID","TipoTramite","Descripcion","AdjuntoUrl","Estado","AsignadoA","ObservacionesAdmin","FechaSolicitud","FechaResolucion"]);
requests.appendRow(["JUST-TEST0001","ACT-1","STU-1","Justificación de Ausencia","Ausencia","", "SincronizacionPendiente","Secretaría","","",""]);

function create(id, date, studentId, motivo, period) {
  return context.createCanonicalAbsenceJustification_({
    justificacionId: id, solicitudId: id, studentId, fechaAfectada: date, periodo: period === undefined ? "I parcial" : period,
    motivoDeclarado: motivo || "Motivo médico", actorId: "ACT-1", actorRole: "Estudiante"
  });
}
const created = create("JUST-TEST0001", "2026-11-10", "STU-1");
assert.equal(created.status, "success");
assert.deepEqual(Array.from(created.data.sesionIds).sort(), ["SES-1","SES-DIARIA-2026-11-10-10-A"]);
assert.equal(create("JUST-TEST0001", "2026-11-10", "STU-1").idempotent, true);
requests.getRange(2, 16).setValue("PENDIENTE");
const projectionReconcile = context.reconcilePendingAttendanceJustifications({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría" });
assert.equal(projectionReconcile.status, "success");
assert.equal(projectionReconcile.processed, 1);
assert.equal(requests.getRange(2, 16).getValues()[0][0], "SINCRONIZADO");
assert.equal(create("JUST-TEST0001", "2026-11-10", "STU-1", "Otro motivo").code, "IDEMPOTENCY_CONFLICT");
const directOwnership = context.submitAttendanceJustification({
  _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", userId: "STU-2",
  fechaAfectada: "2026-11-10", periodo: "I parcial", motivoDeclarado: "No debe crear"
});
assert.equal(directOwnership.code, "STUDENT_OWNERSHIP_MISMATCH");
assert.equal(create("JUST-BADPERIOD1", "2026-11-10", "STU-1", "Motivo", "P2").code, "ACADEMIC_PERIOD_DATE_MISMATCH");
const overlappingPeriod = period.getLastRow() + 1;
period.appendRow(["P2","ANO-1","II parcial","Parcial","2026-11-10","2026-12-31",2,"Activo"]);
assert.throws(() => context.absenceResolvePeriod_(context.SpreadsheetApp.openById("TEST"), "2026-11-10", "P1"), /ACADEMIC_PERIOD_AMBIGUOUS/);
store.PeriodosAcademicos.splice(overlappingPeriod - 1, 1);
const badSchema = sheet("BadAbsenceSchema");
badSchema.appendRow(["Duplicado","Duplicado"]);
assert.throws(() => context.ensureAbsenceHeaders_(badSchema, ["Duplicado"]), /ABSENCE_SCHEMA_DUPLICATE_HEADER/);

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

const attachmentPayload = {
  justificacionId: "JUST-ATTACH001", solicitudId: "JUST-ATTACH001", studentId: "STU-1",
  fechaAfectada: "2026-11-09", periodo: "I parcial", motivoDeclarado: "Evidencia adjunta",
  adjuntoUrl: "DRIVE-FILE-ATTACH-001", adjuntoSHA256: crypto.createHash("sha256").update("%PDF-test").digest("hex"), adjuntoVersion: 1,
  adjuntoSizeBytes: 9, adjuntoMimeType: "application/pdf",
  adjuntoFechaRecepcion: "2026-11-15T10:00:00.000Z", actorId: "ACT-1", actorRole: "Estudiante"
};
const attachmentCreated = context.createCanonicalAbsenceJustification_(attachmentPayload);
assert.equal(attachmentCreated.status, "success");
const attachmentRows = sheet("JustificacionesAsistencia").getDataRange().getValues();
const attachmentMap = {};
attachmentRows[0].forEach((header,index)=>{attachmentMap[header]=index;});
const attachmentRow = attachmentRows.find((row,index)=>index>0 && row[attachmentMap.JustificacionID]==="JUST-ATTACH001");
assert.equal(attachmentRow[attachmentMap.AdjuntoSHA256], crypto.createHash("sha256").update("%PDF-test").digest("hex"));
assert.equal(attachmentRow[attachmentMap.AdjuntoVersion], 1);
assert.equal(attachmentRow[attachmentMap.AdjuntoSizeBytes], 9);
assert.equal(attachmentRow[attachmentMap.AdjuntoMimeType], "application/pdf");
assert.equal(attachmentRow[attachmentMap.AdjuntoIntegridadEstado], "VERIFICADO");
assert.equal(context.createCanonicalAbsenceJustification_(Object.assign({},attachmentPayload)).idempotent, true);
assert.equal(context.createCanonicalAbsenceJustification_(Object.assign({},attachmentPayload,{adjuntoFechaRecepcion:"2026-11-15T10:00:01.000Z"})).code, "IDEMPOTENCY_CONFLICT");
evidenceBytes=Buffer.from("%PDF-tampered");
assert.equal(context.createCanonicalAbsenceJustification_(Object.assign({},attachmentPayload,{justificacionId:"JUST-ATTACHBAD",solicitudId:"JUST-ATTACHBAD"})).code,"ATTACHMENT_INTEGRITY_MISMATCH");
evidenceBytes=Buffer.from("%PDF-test");
const legacyAttachment = context.createCanonicalAbsenceJustification_(Object.assign({},attachmentPayload,{
  justificacionId:"JUST-LEGACY001",solicitudId:"JUST-LEGACY001",fechaAfectada:"2026-11-08",adjuntoUrl:"DRIVE-FILE-LEGACY",adjuntoSHA256:"",
  adjuntoVersion:"",adjuntoSizeBytes:"",adjuntoMimeType:"",adjuntoFechaRecepcion:""
}));
assert.equal(legacyAttachment.status,"success");
const legacyRow=sheet("JustificacionesAsistencia").getDataRange().getValues().find((row,index)=>index>0 && row[attachmentMap.JustificacionID]==="JUST-LEGACY001");
assert.equal(legacyRow[attachmentMap.AdjuntoIntegridadEstado],"LEGACY_UNVERIFIED");
assert.equal(context.submitAttendanceJustification({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",adjuntoUrl:"DRIVE-FILE-SPOOF"}).code,"UNTRUSTED_ATTACHMENT_REFERENCE");

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

// Aprobación parcial: se conserva el conjunto solicitado y solo se marca como justificada la sesión expresamente aprobada.
sessions.appendRow(["SES-PARTIAL-A","2026-11-16","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-PARTIAL-B","2026-11-16","","","10","A","MAT","DOC-1","Cerrada",""]);
attendance.appendRow(["REG-PARTIAL-A","SES-PARTIAL-A","STU-1","Ausente","","",false,"",new Date("2026-11-16T12:00:00Z")]);
attendance.appendRow(["REG-PARTIAL-B","SES-PARTIAL-B","STU-1","Ausente","","",false,"",new Date("2026-11-16T12:00:00Z")]);
const partialMulti = create("JUST-PARTIAL-MULTI", "2026-11-16", "STU-1");
assert.equal(partialMulti.status, "success");
assert.deepEqual(Array.from(partialMulti.data.sesionIds).sort(), ["SES-PARTIAL-A","SES-PARTIAL-B"]);
const partialDisabled = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-PARTIAL-MULTI", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría",
  sesionIdsAprobadas: ["SES-PARTIAL-A"]
});
assert.equal(partialDisabled.code, "ABSENCE_PARTIAL_APPROVAL_DISABLED", "TODO_O_NADA must reject a partial decision by default");
const policySheet = sheet("ConfiguracionInstitucional");
policySheet.appendRow(["Clave","Valor","Estado"]);
policySheet.appendRow(["PERMITIR_JUSTIFICACION_PARCIAL_DIAS","HABILITADO","Activo"]);
const partialEnabled = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-PARTIAL-MULTI", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría",
  sesionIdsAprobadas: ["SES-PARTIAL-A"]
});
assert.equal(partialEnabled.status, "success");
assert.equal(partialEnabled.data.alcanceAprobacion, "PARCIAL");
regRows = attendance.getDataRange().getValues();
assert.equal(regRows.find(row => row[0] === "REG-PARTIAL-A")[6], true);
assert.equal(regRows.find(row => row[0] === "REG-PARTIAL-B")[6], false, "unapproved sessions must remain unchanged");
const partialRecordRows = sheet("JustificacionesAsistencia").getDataRange().getValues();
const partialHeaderMap = {};
partialRecordRows[0].forEach((header,index)=>{partialHeaderMap[header]=index;});
const partialRecord = partialRecordRows.find((row,index)=>index>0 && row[partialHeaderMap.JustificacionID]==="JUST-PARTIAL-MULTI");
assert.deepEqual(JSON.parse(partialRecord[partialHeaderMap.SesionIDsSolicitadasJSON]), ["SES-PARTIAL-A","SES-PARTIAL-B"]);
assert.deepEqual(JSON.parse(partialRecord[partialHeaderMap.SesionIDsJSON]), ["SES-PARTIAL-A"]);
assert.equal(partialRecord[partialHeaderMap.AlcanceAprobacion], "PARCIAL");

// La política de conformidad previa exige una constancia CONFORMIDAD activa por cada sesión seleccionada.
policySheet.appendRow(["JUSTIFICACION_IMPACTO_AUTOMATICO_ASISTENCIA","REQUIERE_CONFORMIDAD_PREVIA_DOCENTE","Activo"]);
sessions.appendRow(["SES-CONFORMITY","2026-11-17","","","10","A","MAT","DOC-1","Cerrada",""]);
attendance.appendRow(["REG-CONFORMITY","SES-CONFORMITY","STU-1","Ausente","","",false,"",new Date("2026-11-17T12:00:00Z")]);
const conformityJustification = create("JUST-CONFORMITY01", "2026-11-17", "STU-1");
assert.equal(conformityJustification.status, "success");
const conformityBlocked = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-CONFORMITY01", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(conformityBlocked.code, "TEACHER_CONFORMITY_REQUIRED");
const acknowledgements = sheet("ConstanciasConocimientoDocente");
acknowledgements.appendRow(["ConstanciaID","JustificacionID","DocenteUserId","SesionID","TipoConstancia","FechaConocimiento","HashRegistro","Estado","CorrelationID"]);
acknowledgements.appendRow(["ACK-1","JUST-CONFORMITY01","DOC-1","SES-CONFORMITY","CONFORMIDAD","2026-11-17T10:00:00.000Z","HASH","ACTIVA",""]);
const conformityApproved = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-CONFORMITY01", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(conformityApproved.status, "success");
assert.equal(attendance.getDataRange().getValues().find(row => row[0] === "REG-CONFORMITY")[6], true);
policySheet.getRange(3, 2).setValue("INMEDIATO_AL_APROBAR_SECRETARIA");

// Una solicitud que cubre varios días debe enlazar todas las sesiones exactas y sincronizarlas juntas.
sessions.appendRow(["SES-MULTI-A","2026-11-18","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-MULTI-B","2026-11-19","","","10","A","MAT","DOC-1","Cerrada",""]);
attendance.appendRow(["REG-MULTI-A","SES-MULTI-A","STU-1","Ausente","","",false,"",new Date("2026-11-18T12:00:00Z")]);
attendance.appendRow(["REG-MULTI-B","SES-MULTI-B","STU-1","Tardanza","","",false,"",new Date("2026-11-19T12:00:00Z")]);
const multiDate = context.createCanonicalAbsenceJustification_({
  justificacionId: "JUST-MULTIDATE01", solicitudId: "JUST-MULTIDATE01", studentId: "STU-1",
  fechaAfectada: "2026-11-18", fechasAfectadas: ["2026-11-18","2026-11-19"],
  periodo: "I parcial", motivoDeclarado: "Ausencia de varios días", actorId: "ACT-1", actorRole: "Estudiante"
});
assert.equal(multiDate.status, "success");
assert.deepEqual(Array.from(multiDate.data.sesionIds).sort(), ["SES-MULTI-A","SES-MULTI-B"]);
assert.equal(context.createCanonicalAbsenceJustification_({
  justificacionId: "JUST-MULTIDATE01", solicitudId: "JUST-MULTIDATE01", studentId: "STU-1",
  fechaAfectada: "2026-11-18", fechasAfectadas: ["2026-11-18"],
  periodo: "I parcial", motivoDeclarado: "Ausencia de varios días", actorId: "ACT-1", actorRole: "Estudiante"
}).code, "IDEMPOTENCY_CONFLICT", "idempotency must bind the complete date set");
const multiApproved = context.reviewCanonicalAbsenceJustification_({
  justificacionId: "JUST-MULTIDATE01", nuevoEstado: "Aprobada", actorId: "SEC-1", actorRole: "Secretaría"
});
assert.equal(multiApproved.status, "success");
regRows = attendance.getDataRange().getValues();
assert.equal(regRows.find(row => row[0] === "REG-MULTI-A")[6], true);
assert.equal(regRows.find(row => row[0] === "REG-MULTI-B")[6], true);
const multiRecordRows = sheet("JustificacionesAsistencia").getDataRange().getValues();
const multiRecord = multiRecordRows.find((row,index)=>index>0 && row[0]==="JUST-MULTIDATE01");
assert.deepEqual(JSON.parse(multiRecord[attachmentMap.FechasAfectadasJSON] || "[]"), ["2026-11-18","2026-11-19"]);

sessions.appendRow(["SES-USER","2026-11-14","","","10","A","MAT","DOC-1","Cerrada",""]);
attendance.appendRow(["REG-USER","SES-USER","STU-USER","Ausente","","",false,"",new Date("2026-11-14T12:00:00Z")]);
let userLockBusy = false;
let userUuid = 0;
const userContext = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById() { return { getSheetByName(name) { return store[name] ? sheet(name) : null; } }; } },
  LockService: { getScriptLock() { return { tryLock() { return !userLockBusy; }, waitLock() { if (userLockBusy) throw new Error("LOCK_BUSY"); }, releaseLock() {} }; } },
  Utilities: { getUuid() { userUuid++; return "USER-UUID-" + String(userUuid).padStart(8, "0"); } },
  getOrCreateSheet(_ss, name) { return sheet(name); },
  getUserVerifiedRole(payload) { payload._verifiedUserId = payload._userId; payload._verifiedRole = payload._role; return payload._role; },
  resolveVerifiedRequestSubmitter_(payload, requestedStudentId) {
    return { userId: payload._verifiedUserId || payload._userId, estudianteId: requestedStudentId || payload._verifiedUserId || payload._userId, role: payload._verifiedRole || payload._role };
  },
  createPrivateRequestAttachment_() { return null; },
  rollbackPrivateAttachment_() {},
  callAcademicAbsenceService_(action, payload) {
    const result = action === "createCanonicalAbsenceJustification"
      ? context.createCanonicalAbsenceJustification_(payload)
      : context.reviewCanonicalAbsenceJustification_(payload);
    return { status: result.status, data: result };
  },
  logStructuredEvent() {},
  Date, Math, JSON, String, Number, Array, Object, Error
};
const userNames = [
  "requestAttachmentHeaderMap_","ensureRequestAttachmentIntegritySchema_","setRequestAttachmentIntegrity_",
  "ensureUserAbsenceRequestSchema_","createPrivateRequestAttachment_","createPrivateRequestAttachmentWithIntegrity_",
  "submitStudentAbsenceJustification","reviewAbsenceJustification","updateRequestStatus","processWorkflowDecision"
];
vm.createContext(userContext);
const userConstants = userSource.split("\n").filter(line => /^const (REQUEST_ATTACHMENT_INTEGRITY_HEADERS_|USER_ABSENCE_REQUEST_EXTRA_HEADERS_)/.test(line)).join("\n");
vm.runInContext(userConstants + "\n" + userNames.map(name => extractFunction(name, userSource)).join("\n"), userContext);
const userPayload = {
  _userId: "STU-USER", _role: "Estudiante", estudianteId: "STU-USER",
  fechaAusencia: "2026-11-14", periodo: "I parcial", motivo: "Motivo USER"
};
const userSubmit = userContext.submitStudentAbsenceJustification(userPayload);
assert.equal(userSubmit.status, "success");
assert.equal(userSubmit.solicitudId, userSubmit.justificacionId);
const userRequestCount = store.SolicitudesTramites.length;
const userRetry = userContext.submitStudentAbsenceJustification(Object.assign({}, userPayload));
assert.equal(userRetry.status, "success");
assert.equal(userRetry.solicitudId, userSubmit.solicitudId);
assert.equal(store.SolicitudesTramites.length, userRequestCount, "USER retry must not append a duplicate request");
userLockBusy = true;
const lockedSubmit = userContext.submitStudentAbsenceJustification(Object.assign({}, userPayload, { fechaAusencia: "2026-11-15" }));
assert.equal(lockedSubmit.code, "ABSENCE_SUBMISSION_LOCK_TIMEOUT", "concurrent submission must fail safely when the serialization lock is unavailable");
assert.equal(store.SolicitudesTramites.length, userRequestCount, "lock timeout must not create a duplicate or partial request");
userLockBusy = false;
const userReview = userContext.reviewAbsenceJustification({
  _userId: "SEC-USER", _role: "Secretaría", solicitudId: userSubmit.solicitudId, nuevoEstado: "Aprobada"
});
assert.equal(userReview.status, "success");
regRows = attendance.getDataRange().getValues();
const userAttendanceRow = regRows.find(row => row[0] === "REG-USER");
assert.equal(userAttendanceRow[6], true);
assert.equal(userAttendanceRow[9], userSubmit.justificacionId);

// USER must preserve a multi-day date set through the trusted ACADEMIC bridge.
sessions.appendRow(["SES-USER-MULTI-A","2026-11-20","","","10","A","MAT","DOC-1","Cerrada",""]);
sessions.appendRow(["SES-USER-MULTI-B","2026-11-21","","","10","A","MAT","DOC-1","Cerrada",""]);
attendance.appendRow(["REG-USER-MULTI-A","SES-USER-MULTI-A","STU-USER","Ausente","","",false,"",new Date("2026-11-20T12:00:00Z")]);
attendance.appendRow(["REG-USER-MULTI-B","SES-USER-MULTI-B","STU-USER","Ausente","","",false,"",new Date("2026-11-21T12:00:00Z")]);
const userMultiSubmit = userContext.submitStudentAbsenceJustification({
  _userId:"STU-USER",_role:"Estudiante",estudianteId:"STU-USER",
  fechasAusencia:["2026-11-20","2026-11-21"],periodo:"I parcial",motivo:"Motivo multi-día"
});
assert.equal(userMultiSubmit.status,"success");
const userMultiRow = store.SolicitudesTramites.find(row=>row[0]===userMultiSubmit.solicitudId);
const userHeaders = store.SolicitudesTramites[0];
const userDateIndex = userHeaders.indexOf("FechasAfectadasJSON");
assert.deepEqual(JSON.parse(userMultiRow[userDateIndex]),["2026-11-20","2026-11-21"]);
const userMultiReview = userContext.reviewAbsenceJustification({
  _userId:"SEC-USER",_role:"Secretaría",solicitudId:userMultiSubmit.solicitudId,nuevoEstado:"Aprobada"
});
assert.equal(userMultiReview.status,"success");
regRows = attendance.getDataRange().getValues();
assert.equal(regRows.find(row=>row[0]==="REG-USER-MULTI-A")[6],true);
assert.equal(regRows.find(row=>row[0]==="REG-USER-MULTI-B")[6],true);
assert.throws(() => userContext.updateRequestStatus({ solicitudId: userSubmit.solicitudId, nuevoEstado: "Rechazada" }), /ABSENCE_REVIEW_REQUIRES_CANONICAL_WORKFLOW/);
assert.throws(() => userContext.processWorkflowDecision({
  solicitudId: userSubmit.solicitudId, accionDecision: "RECHAZADO",
  _verifiedUserId: "SEC-USER", _verifiedRole: "Secretaría"
}), /ABSENCE_REVIEW_REQUIRES_CANONICAL_WORKFLOW/);


assert.match(userSource, /createInterServiceEnvelope\("USER", "ACADEMIC", action/);
assert.match(userSource, /ACADEMIC_SERVICE_URL/);
assert.match(userSource, /ABSENCE_REVIEW_REQUIRES_CANONICAL_WORKFLOW/);
assert.match(userSource, /const solRow = solData\[idx\];\s*if \(String\(solRow\[3\] \|\| ""\) === "Justificación de Ausencia"\)/);
assert.match(source, /request\.sourceService === "USER"/);
assert.match(source, /verifyInterServiceEnvelope\(envelope, "ACADEMIC", secret\)/);
console.log("PASS: canonical absence justification, exact session ownership, idempotency, approval/rejection/revocation, partial-write recovery and trusted interservice contract");
