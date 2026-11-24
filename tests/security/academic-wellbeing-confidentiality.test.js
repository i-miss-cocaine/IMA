"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");

function extractFunction(source, name) {
  const match = new RegExp("function\\s+" + name + "\\s*\\(").exec(source);
  if (!match) throw new Error("Missing function: " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch.charCodeAt(0) === 96) { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("Unbalanced function: " + name);
}

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
const names = [
  "withWelfareCaseLock_", "createWelfareRecordId_", "normalizeWelfareRole_", "isWelfareStaffRole_", "isConfidentialWelfareCase_",
  "isConfidentialWelfarePayload_", "getWelfareStudentAccess_", "getWelfareCaseAccess_",
  "persistAttendanceFollowupCase_", "saveAutomatedAttendanceFollowupCase_", "saveAutomatedAttendanceFollowupCase_Unsafe_",
  "validateStudentWelfareAccess", "getAttendanceFollowupCases", "saveAttendanceFollowupCase", "saveAttendanceFollowupCaseUnsafe_",
  "addCaseFollowUpNote", "addCaseFollowUpNoteUnsafe_", "addCaseCommitment", "addCaseCommitmentUnsafe_", "updateCaseCommitmentStatus", "updateCaseCommitmentStatusUnsafe_",
  "getGuidanceAppointments", "updateGuidanceAppointmentStatus", "updateGuidanceAppointmentStatusUnsafe_", "scheduleGuidanceAppointment",
  "scheduleCounselingAppointment", "recordCounselingSessionAct", "recordCounselingSessionActUnsafe_", "referCounselingCase", "referCounselingCaseUnsafe_",
  "saveGuidanceFollowupPlan", "saveVocationalRecommendation",
  "generateConsolidatedAttendanceAndCoexistenceReport"
];
const program = names.map(name => extractFunction(source, name)).join("\n\n");

class FakeSheet {
  constructor(rows) { this.rows = (rows || []).map(row => row.slice()); this.readCount = 0; }
  getDataRange() { this.readCount++; return { getValues: () => this.rows.map(row => row.slice()) }; }
  getLastRow() { return this.rows.length; }
  appendRow(row) { this.rows.push(row.slice()); }
  getRange(row, column) {
    return { setValue: value => {
      while (this.rows.length < row) this.rows.push([]);
      while (this.rows[row - 1].length < column) this.rows[row - 1].push("");
      this.rows[row - 1][column - 1] = value;
    } };
  }
}
class FakeSpreadsheet {
  constructor() { this.sheets = new Map(); }
  add(name, rows) { const sheet = new FakeSheet(rows); this.sheets.set(name, sheet); return sheet; }
  getSheetByName(name) { return this.sheets.get(name) || null; }
}
const caseHeaders = ["CasoID", "UserId", "MotivoApertura", "ResumenAsistencia", "ResponsableID", "AccionesJSON", "Estado", "FechaApertura", "FechaCierre"];
const appointmentHeaders = ["CitaOrientacionID", "CasoID", "UserId", "TutorUserId", "OrientadorUserId", "FechaHora", "Modalidad", "Estado", "TipoCita", "NotasPublicas", "NotasConfidenciales", "DerivacionRef", "FechaCreacion"];
const caseRow = (id, student, summary, owner, actions = "[]") => [id, student, "Seguimiento", summary, owner, actions, "Abierto", "", ""];

function harness({ cases = [], appointments = [], identities = {}, extraSheets = {}, lockAvailable = true } = {}) {
  const db = new FakeSpreadsheet();
  db.add("CasosSeguimiento", [caseHeaders, ...cases]);
  db.add("CitasOrientacion", [appointmentHeaders, ...appointments]);
  for (const [name, rows] of Object.entries(extraSheets)) db.add(name, rows);
  const logs = [];
  const lockState = { available: lockAvailable, acquired: 0, released: 0 };
  let uuidCounter = 0;
  const context = {
    SPREADSHEET_ID: "test",
    SpreadsheetApp: { openById: () => db },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (!lockState.available) return false; lockState.acquired++; return true; }, releaseLock: () => { lockState.released++; } }) },
    Utilities: { getUuid: () => "uuid-" + (++uuidCounter) },
    getOrCreateSheet: (ss, name) => ss.getSheetByName(name) || ss.add(name, [[]]),
    getVerifiedAcademicIdentity_: payload => identities[payload && payload.sessionToken] || { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" },
    validateAcademicResponsibilityAndScopeAccess: payload => ({ authorized: payload && payload.scopeAllowed === true, code: "TEST_SCOPE_DENIED" }),
    logStructuredEvent: (...args) => logs.push(args),
    logDebug: () => {},
    console, Date, Math, JSON, Object, Array, String, RegExp, Error
  };
  vm.createContext(context);
  vm.runInNewContext(program, context, { timeout: 2000 });
  return { api: context, db, logs, lockState };
}

test("client-supplied authRole cannot grant confidential case access", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")],
    identities: { secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" } }
  });
  const result = h.api.getAttendanceFollowupCases({ sessionToken: "secretary", authRole: "Director", casoId: "CASE-1" });
  assert.equal(result.data.length, 0);
  assert.ok(h.logs.some(entry => entry[3] === "UNAUTHORIZED_ACCESS_ATTEMPT"));
});

test("assigned counselor can read; unassigned counselor needs verified scope", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1", '[{"tipo":"ActaConsejería","notasConfidenciales":"privado"}]')],
    identities: {
      assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" },
      unassigned: { authorized: true, userId: "counselor-2", role: "Consejeros" }
    }
  });
  assert.equal(h.api.getAttendanceFollowupCases({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1" }).data.length, 1);
  assert.equal(h.api.getAttendanceFollowupCases({ sessionToken: "unassigned", casoId: "CASE-1" }).data.length, 0);
  assert.equal(h.api.getAttendanceFollowupCases({ sessionToken: "unassigned", scopeAllowed: true, casoId: "CASE-1" }).data.length, 1);
});

test("malformed confidential case data fails closed", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Orientación", "counselor-1", "{broken")],
    identities: { assigned: { authorized: true, userId: "counselor-1", role: "Orientacion" } }
  });
  assert.equal(h.api.getAttendanceFollowupCases({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1" }).data.length, 0);
});


test("ResponsableID alone is not proof of case assignment or scope", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")],
    identities: { actor: { authorized: true, userId: "counselor-1", role: "Consejeros" } }
  });
  const result = h.api.getAttendanceFollowupCases({ sessionToken: "actor", casoId: "CASE-1" });
  assert.equal(result.data.length, 0);
  assert.equal(h.api.getWelfareCaseAccess_({ sessionToken: "actor" }, "CASE-1", h.db, true).authorized, false);
});

test("duplicate case identifiers fail closed", () => {
  const row = caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1");
  const h = harness({ cases: [row, row], identities: { assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" } } });
  const result = h.api.getWelfareCaseAccess_({ sessionToken: "assigned" }, "CASE-1", h.db, true);
  assert.equal(result.authorized, false);
  assert.equal(result.code, "WELFARE_CASE_AMBIGUOUS");
});

test("confidential case creation requires verified staff and student scope", () => {
  const h = harness({
    identities: {
      secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" },
      counselor: { authorized: true, userId: "counselor-1", role: "Consejeros" }
    }
  });
  const denied = h.api.saveAttendanceFollowupCase({
    sessionToken: "secretary", authRole: "Director", userId: "STU-1",
    motivoApertura: "Consejería", resumenAsistencia: "Categoría: Consejería", categoriaCaso: "Consejería"
  });
  assert.equal(denied.status, "error");
  assert.equal(h.db.getSheetByName("CasosSeguimiento").rows.length, 1);
  const allowed = h.api.saveAttendanceFollowupCase({
    sessionToken: "counselor", scopeAllowed: true, userId: "STU-1",
    motivoApertura: "Consejería", resumenAsistencia: "Categoría: Consejería", categoriaCaso: "Consejería"
  });
  assert.equal(allowed.status, "success");
  assert.equal(h.db.getSheetByName("CasosSeguimiento").rows[1][4], "counselor-1");
  assert.match(h.db.getSheetByName("CasosSeguimiento").rows[1][3], /Categoría: Consejería/);
});

test("notes and session acts require assignment or verified scope", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")],
    identities: {
      assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" },
      other: { authorized: true, userId: "counselor-2", role: "Consejeros" }
    }
  });
  const denied = h.api.addCaseFollowUpNote({ sessionToken: "other", casoId: "CASE-1", nota: "intrusión" });
  assert.equal(denied.status, "error");
  assert.equal(h.db.getSheetByName("CasosSeguimiento").rows[1][5], "[]");
  const note = h.api.addCaseFollowUpNote({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", nota: "seguimiento" });
  assert.equal(note.status, "success");
  const actions = JSON.parse(h.db.getSheetByName("CasosSeguimiento").rows[1][5]);
  assert.equal(actions[0].autor, "counselor-1");
  const act = h.api.recordCounselingSessionAct({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", resumenSesion: "Sesión" });
  assert.equal(act.status, "success");
  const afterAct = JSON.parse(h.db.getSheetByName("CasosSeguimiento").rows[1][5]);
  assert.equal(afterAct[1].consejeroUserId, "counselor-1");
});

test("counseling derivation and commitment updates deny unassigned actors", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1", '[{"compromisoId":"COM-1","tipo":"Compromiso","estadoCumplimiento":"Pendiente"}]')],
    identities: {
      assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" },
      other: { authorized: true, userId: "counselor-2", role: "Consejeros" }
    }
  });
  assert.equal(h.api.referCounselingCase({ sessionToken: "other", casoId: "CASE-1", destinoDerivacion: "Externo", motivoDerivacion: "Motivo" }).status, "error");
  assert.equal(h.api.updateCaseCommitmentStatus({ sessionToken: "other", casoId: "CASE-1", compromisoId: "COM-1", nuevoEstado: "Cumplido" }).status, "error");
  const updated = h.api.updateCaseCommitmentStatus({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", compromisoId: "COM-1", nuevoEstado: "Cumplido" });
  assert.equal(updated.status, "success");
});

test("appointment notes are visible only to the assigned counselor", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Orientación", "counselor-1")],
    appointments: [["CITA-1", "CASE-1", "STU-1", "", "counselor-1", "2026-11-20", "Presencial", "Programada", "Entrevista", "Pública", "Nota privada", "", "2026-11-20"]],
    identities: {
      assigned: { authorized: true, userId: "counselor-1", role: "Orientacion" },
      other: { authorized: true, userId: "counselor-2", role: "Orientacion" },
      secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" }
    }
  });
  assert.equal(h.api.getGuidanceAppointments({ sessionToken: "secretary", authRole: "Director" }).citas.length, 0);
  assert.equal(h.api.getGuidanceAppointments({ sessionToken: "other", authRole: "Director" }).citas.length, 0);
  const visible = h.api.getGuidanceAppointments({ sessionToken: "assigned", scopeAllowed: true }).citas;
  assert.equal(visible.length, 1);
  assert.equal(visible[0].notasConfidenciales, "Nota privada");
});

test("appointment status mutation requires the assigned counselor", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Orientación", "counselor-1")],
    appointments: [["CITA-1", "CASE-1", "STU-1", "", "counselor-1", "2026-11-20", "Presencial", "Programada", "Entrevista", "Pública", "Nota privada", "", "2026-11-20"]],
    identities: {
      assigned: { authorized: true, userId: "counselor-1", role: "Orientacion" },
      other: { authorized: true, userId: "counselor-2", role: "Orientacion" }
    }
  });
  const denied = h.api.updateGuidanceAppointmentStatus({ sessionToken: "other", authRole: "Director", citaOrientacionId: "CITA-1", nuevoEstado: "Realizada" });
  assert.equal(denied.status, "error");
  assert.equal(h.db.getSheetByName("CitasOrientacion").rows[1][7], "Programada");
  const allowed = h.api.updateGuidanceAppointmentStatus({ sessionToken: "assigned", scopeAllowed: true, citaOrientacionId: "CITA-1", nuevoEstado: "Realizada" });
  assert.equal(allowed.status, "success");
  assert.equal(h.db.getSheetByName("CitasOrientacion").rows[1][7], "Realizada");
});

test("appointment cannot be attached to a different student's case", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Orientación", "counselor-1")],
    identities: { assigned: { authorized: true, userId: "counselor-1", role: "Orientacion" } }
  });
  const result = h.api.scheduleGuidanceAppointment({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", userId: "STU-2", fechaHora: "2026-11-25T10:00:00" });
  assert.equal(result.status, "error");
  assert.equal(h.db.getSheetByName("CitasOrientacion").rows.length, 1);
});

test("consolidated report ignores client role and does not expose excluded confidential counts", () => {
  const h = harness({
    cases: [
      caseRow("WELFARE-1", "STU-1", "Categoría: Consejería", "counselor-1"),
      caseRow("GENERAL-1", "STU-2", "Seguimiento ordinario", "secretary-1", '[{"tipo":"Compromiso"}]')
    ],
    identities: { secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" } },
    extraSheets: { RegistrosAsistencia: [["ID"]], IncidenciasAsistencia: [["ID"]] }
  });
  const result = h.api.generateConsolidatedAttendanceAndCoexistenceReport({ sessionToken: "secretary", rolSolicitante: "Director" });
  assert.equal(result.reporte.seguimiento.totalCasosVisibles, 1);
  assert.equal(result.reporte.seguimiento.totalCompromisos, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(result.reporte.seguimiento, "casosExcluidosPorConfidencialidad"), false);
});


test("write lock contention fails closed and does not mutate the case", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")],
    identities: { assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" } },
    lockAvailable: false
  });
  const result = h.api.addCaseFollowUpNote({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", nota: "concurrent write" });
  assert.equal(result.code, "WELFARE_WRITE_BUSY");
  assert.equal(h.db.getSheetByName("CasosSeguimiento").rows[1][5], "[]");
  assert.equal(h.lockState.acquired, 0);
});

test("write lock is released after a successful mutation", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")],
    identities: { assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" } }
  });
  const result = h.api.addCaseFollowUpNote({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", nota: "ok" });
  assert.equal(result.status, "success");
  assert.equal(h.lockState.acquired, 1);
  assert.equal(h.lockState.released, 1);
});

test("generated welfare record identifiers remain unique within the same timestamp", () => {
  const h = harness();
  const first = h.api.createWelfareRecordId_("CASE-");
  const second = h.api.createWelfareRecordId_("CASE-");
  assert.notEqual(first, second);
});

test("confidential classification marker cannot be removed by a generic update", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería | inicial", "counselor-1")],
    identities: { assigned: { authorized: true, userId: "counselor-1", role: "Consejeros" } }
  });
  const result = h.api.saveAttendanceFollowupCase({
    sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1", userId: "STU-1",
    motivoApertura: "Actualización", resumenAsistencia: "Resumen general", estado: "Abierto"
  });
  assert.equal(result.status, "success");
  assert.match(h.db.getSheetByName("CasosSeguimiento").rows[1][3], /Categoría: Bienestar/);
  assert.equal(h.api.getAttendanceFollowupCases({ sessionToken: "assigned", scopeAllowed: true, casoId: "CASE-1" }).data.length, 1);
});


test("students and guardians retain own appointment summaries with confidential notes redacted", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Orientación", "counselor-1")],
    appointments: [
      ["CITA-1", "CASE-1", "STU-1", "TUTOR-1", "counselor-1", "2026-11-20", "Presencial", "Programada", "Entrevista", "Pública", "Nota privada", "", "2026-11-20"],
      ["CITA-2", "CASE-2", "STU-2", "TUTOR-2", "counselor-2", "2026-11-20", "Presencial", "Programada", "Entrevista", "Pública", "Otra nota", "", "2026-11-20"]
    ],
    identities: {
      student: { authorized: true, userId: "STU-1", role: "Estudiante" },
      guardian: { authorized: true, userId: "TUTOR-1", role: "Tutor" }
    }
  });
  const studentAppointments = h.api.getGuidanceAppointments({ sessionToken: "student" }).citas;
  assert.equal(studentAppointments.length, 1);
  assert.equal(studentAppointments[0].notasConfidenciales, "***CONFIDENCIAL***");
  const guardianAppointments = h.api.getGuidanceAppointments({ sessionToken: "guardian" }).citas;
  assert.equal(guardianAppointments.length, 1);
  assert.equal(guardianAppointments[0].notasConfidenciales, "***CONFIDENCIAL***");
});

test("COMPARTIDO_DOCENTE configuration does not bypass confidential case authorization", () => {
  const h = harness({
    cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")],
    identities: { teacher: { authorized: true, userId: "teacher-1", role: "Docente" } },
    extraSheets: { ConfiguracionAcademica: [["Parametro", "Valor"], ["NIVEL_VISIBILIDAD_CONSEJERIA", "COMPARTIDO_DOCENTE"]] }
  });
  const result = h.api.getAttendanceFollowupCases({ sessionToken: "teacher", authRole: "Director", casoId: "CASE-1" });
  assert.equal(result.data.length, 0);
  assert.equal(result.nivelVisibilidad, "COMPARTIDO_DOCENTE");
});


test("authorized guidance scheduling creates a scoped case and assigns the appointment to the verified actor", () => {
  const h = harness({
    identities: { counselor: { authorized: true, userId: "counselor-1", role: "Orientacion" } }
  });
  const result = h.api.scheduleGuidanceAppointment({
    sessionToken: "counselor", scopeAllowed: true, userId: "STU-1",
    fechaHora: "2026-11-25T10:00:00", notasConfidenciales: "nota privada"
  });
  assert.equal(result.status, "success");
  const caseRowSaved = h.db.getSheetByName("CasosSeguimiento").rows[1];
  const appointment = h.db.getSheetByName("CitasOrientacion").rows[1];
  assert.equal(caseRowSaved[4], "counselor-1");
  assert.match(caseRowSaved[3], /Categoría: Orientación/);
  assert.equal(appointment[1], result.casoId);
  assert.equal(appointment[2], "STU-1");
  assert.equal(appointment[4], "counselor-1");
  assert.equal(appointment[10], "nota privada");
  assert.equal(h.lockState.acquired, 2);
  assert.equal(h.lockState.released, 2);
});

test("counseling and guidance plan writers preserve actor ownership and confidentiality markers", () => {
  const h = harness({
    identities: { counselor: { authorized: true, userId: "counselor-1", role: "Consejeros" } }
  });
  const appointment = h.api.scheduleCounselingAppointment({
    sessionToken: "counselor", scopeAllowed: true, userId: "STU-1",
    fechaHora: "2026-11-25T10:00:00", motivo: "Acompañamiento"
  });
  const plan = h.api.saveGuidanceFollowupPlan({
    sessionToken: "counselor", scopeAllowed: true, userId: "STU-2", metasAprendizaje: "Meta"
  });
  const recommendation = h.api.saveVocationalRecommendation({
    sessionToken: "counselor", scopeAllowed: true, userId: "STU-3", perfilVocacional: "Perfil"
  });
  assert.equal(appointment.status, "success");
  assert.equal(plan.status, "success");
  assert.equal(recommendation.status, "success");
  const rows = h.db.getSheetByName("CasosSeguimiento").rows.slice(1);
  assert.equal(rows.length, 3);
  assert.ok(rows.every(row => row[4] === "counselor-1"));
  assert.ok(rows.every(row => /consejer[ií]a|orientaci[oó]n|bienestar/i.test(row[3])));
});


test("JSON-string actions containing confidential notes require welfare scope", () => {
  const h = harness({
    identities: { secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" } }
  });
  const result = h.api.saveAttendanceFollowupCase({
    sessionToken: "secretary", userId: "STU-1", motivoApertura: "Seguimiento",
    resumenAsistencia: "Resumen general", categoriaCaso: "General",
    responsableId: "secretary-1",
    acciones: '[{"tipo":"Seguimiento","notasConfidenciales":"privado"}]'
  });
  assert.equal(result.status, "error");
  assert.equal(h.db.getSheetByName("CasosSeguimiento").rows.length, 1);
});

test("malformed JSON-string actions are rejected without persistence", () => {
  const h = harness({
    identities: { secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" } }
  });
  const result = h.api.saveAttendanceFollowupCase({
    sessionToken: "secretary", userId: "STU-1", motivoApertura: "Seguimiento",
    resumenAsistencia: "Resumen general", responsableId: "secretary-1", acciones: "{broken"
  });
  assert.equal(result.code, "WELFARE_ACTIONS_INVALID");
  assert.equal(h.db.getSheetByName("CasosSeguimiento").rows.length, 1);
});

test("general follow-up accepts valid JSON-string actions without treating them as confidential", () => {
  const h = harness({
    identities: { secretary: { authorized: true, userId: "secretary-1", role: "Secretaría" } }
  });
  const result = h.api.saveAttendanceFollowupCase({
    sessionToken: "secretary", userId: "STU-1", motivoApertura: "Seguimiento ordinario",
    resumenAsistencia: "Seguimiento general", categoriaCaso: "General", responsableId: "secretary-1",
    acciones: '[{"tipo":"Seguimiento","nota":"pública"}]'
  });
  assert.equal(result.status, "success");
  assert.deepEqual(JSON.parse(h.db.getSheetByName("CasosSeguimiento").rows[1][5]), [{ tipo: "Seguimiento", nota: "pública" }]);
});


test("bulk welfare readers reuse one case snapshot instead of rereading the sheet per record", () => {
  const cases = Array.from({ length: 12 }, (_, index) =>
    caseRow("CASE-" + index, "STU-" + index, "Categoría: Consejería", "not-an-auth-proof")
  );
  const appointments = cases.map((row, index) => [
    "CITA-" + index, row[0], row[1], "", "counselor-1", "2026-11-20",
    "Presencial", "Programada", "Entrevista", "Pública", "Privada-" + index, "", "2026-11-20"
  ]);
  const h = harness({
    cases, appointments,
    identities: { counselor: { authorized: true, userId: "counselor-1", role: "Orientacion" } }
  });
  const caseSheet = h.db.getSheetByName("CasosSeguimiento");
  const caseList = h.api.getAttendanceFollowupCases({ sessionToken: "counselor", scopeAllowed: true });
  assert.equal(caseList.data.length, 12);
  assert.equal(caseSheet.readCount, 1);

  caseSheet.readCount = 0;
  const citaList = h.api.getGuidanceAppointments({ sessionToken: "counselor", scopeAllowed: true });
  assert.equal(citaList.citas.length, 12);
  assert.equal(caseSheet.readCount, 1);
});

test("missing signed identity is denied even when the payload claims a privileged role", () => {
  const h = harness({ cases: [caseRow("CASE-1", "STU-1", "Categoría: Consejería", "counselor-1")] });
  const result = h.api.validateStudentWelfareAccess({ authRole: "Director", casoId: "CASE-1" });
  assert.equal(result.authorized, false);
});
