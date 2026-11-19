"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const provider = require("../../js/sace-data-provider.js");
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

const tables = {
  AnosLectivos: [
    ["AnoID", "Nombre"], ["YEAR-2026", "2026"]
  ],
  PeriodosAcademicos: [
    ["PeriodoID", "AnoID", "Nombre", "TipoPeriodo", "FechaInicio", "FechaFin", "Orden", "Estado"],
    ["P1", "YEAR-2026", "I Parcial", "Parcial", "2026-01-01", "2026-03-31", 1, "Cerrado"],
    ["P2", "YEAR-2026", "II Parcial", "Parcial", "2026-04-01", "2026-06-30", 2, "Cerrado"]
  ],
  CatalogoAsignaturas: [
    ["AsignaturaID", "NombreOficial"], ["SUB-1", "Informática"]
  ],
  Matriculas: [
    ["MatriculaID", "Fecha", "UserId", "Alumno", "Grado", "Seccion", "Periodo", "Tipo", "Estado", "BecaDescuento", "Observaciones"],
    ["MAT-1", "2026-01-01", "STU-1", "Ana Pérez", "11", "A", "2026", "Regular", "Activa", "", ""],
    ["MAT-2", "2026-01-01", "STU-2", "Luis Gómez", "11", "A", "YEAR-2026", "Regular", "Activa", "", ""]
  ],
  SesionesAsistencia: [
    ["SesionID", "Fecha", "HoraInicio", "HoraFin", "Grado", "Seccion", "AsignaturaID", "DocenteUserId", "Estado", "Observaciones", "FechaCierre"],
    ["S-1", "2026-02-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Cerrada", "", "2026-02-03T08:00:00Z"],
    ["S-2", "2026-05-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Finalizada", "", "2026-05-03T08:00:00Z"],
    ["S-WRONG-TEACHER", "2026-02-03", "", "", "11", "A", "SUB-1", "TEACHER-2", "Cerrada", "", "2026-02-03T08:00:00Z"],
    ["S-WRONG-SUBJECT", "2026-02-03", "", "", "11", "A", "SUB-2", "TEACHER-1", "Cerrada", "", "2026-02-03T08:00:00Z"],
    ["S-CANCELLED", "2026-02-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Cancelada", "", ""],
    ["S-OUTSIDE", "2026-07-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Cerrada", "", "2026-07-03T08:00:00Z"]
  ],
  RegistrosAsistencia: [
    ["RegistroID", "SesionID", "UserId", "EstadoAsistencia", "HoraLlegada", "MinutosTardanza", "Justificado", "ObservacionDocente", "FechaRegistro", "JustificacionID"],
    ["R-1", "S-1", "STU-1", "Ausente", "", "", false, "", "2026-02-03", ""],
    ["R-2", "S-1", "STU-2", "Presente", "", "", false, "", "2026-02-03", ""],
    ["R-3", "S-2", "STU-1", "Tardanza", "", 5, false, "", "2026-05-03", ""],
    ["R-4", "S-2", "STU-2", "Ausente", "", "", true, "", "2026-05-03", "JUST-1"],
    ["R-OTHER", "S-WRONG-TEACHER", "STU-1", "Ausente", "", "", false, "", "2026-02-03", ""]
  ],
  JustificacionesAsistencia: [
    ["JustificacionID", "UserId", "Periodo", "EstadoRevision", "SyncEstado", "SesionIDsJSON", "FechasAfectadasJSON"],
    ["JUST-1", "STU-2", "P2", "Aprobada", "SINCRONIZADO", "[\"S-2\"]", "[\"2026-05-03\"]"]
  ]
};

function createContext(actorRole = "Profesor", institutionId = "INST-1", lockFails = false, readFails = false) {
  const sheets = {};
  let snapshotLockHeld = false, snapshotLockWaits = 0, snapshotLockReleases = 0;
  Object.keys(tables).forEach(name => {
    const rows = tables[name];
    sheets[name] = { getDataRange() {
      if (["AnosLectivos", "PeriodosAcademicos", "CatalogoAsignaturas", "Matriculas", "SesionesAsistencia", "RegistrosAsistencia", "JustificacionesAsistencia"].includes(name)) {
        assert.equal(snapshotLockHeld, true, name + " must be read under the shared attendance lock");
        if (readFails && name === "JustificacionesAsistencia") throw new Error("fixture read failure");
      }
      return { getValues() { return rows.map(row => row.slice()); } };
    } };
  });
  const context = {
    SPREADSHEET_ID: "TEST",
    PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "INST-1" : ""; } }; } },
    SpreadsheetApp: { openById(id) { assert.equal(id, "TEST"); return { getSheetByName(name) { return sheets[name] || null; } }; } },
    LockService: { getScriptLock() { return {
      waitLock(timeout) { assert.equal(timeout, 10000); snapshotLockWaits++; if (lockFails) throw new Error("lock timeout"); snapshotLockHeld = true; },
      releaseLock() { assert.equal(snapshotLockHeld, true); snapshotLockHeld = false; snapshotLockReleases++; }
    }; } },
    Utilities: { formatDate(value) { return value.toISOString().slice(0, 10); } },
    Session: { getScriptTimeZone() { return "UTC"; } },
    getVerifiedAcademicIdentity_(payload) {
      return { authorized: true, userId: "TEACHER-1", role: actorRole };
    },
    getVerifiedRequestSessionClaims_() { return { userId: "TEACHER-1", role: actorRole, institutionId }; },
    requestSaceStudentIdentityDirectoryFromUser_(request, studentIds, requestedInstitution, teacherUserId) {
      assert.equal(snapshotLockHeld, false, "remote USER-Service call must run after releasing the local snapshot lock");
      assert.equal(snapshotLockReleases, 1, "USER-Service must not be called before all local snapshot reads release the lock");
      assert.equal(request.sessionToken, "SESSION-TEST");
      assert.equal(requestedInstitution, institutionId);
      assert.equal(teacherUserId, "TEACHER-1");
      assert.deepEqual(Array.from(studentIds), ["STU-1", "STU-2"]);
      return studentIds.map((userId, index) => ({
        userId, identity: index === 0 ? "0801-2000-00001" : "0801-2000-00002",
        documentType: "DNI", documentMarker: "", name: index === 0 ? "Ana Pérez" : "Luis Gómez"
      }));
    },
    requestSaceGradebookSnapshotsFromExam_(request, studentIds, teacherUserId, expected, periods) {
      assert.equal(snapshotLockHeld, false, "remote Exam-Service batch call must run after releasing the attendance lock");
      assert.equal(snapshotLockReleases, 1);
      assert.equal(request.sessionToken, "SESSION-TEST");
      assert.equal(teacherUserId, "TEACHER-1");
      assert.deepEqual(Array.from(studentIds), ["STU-1", "STU-2"]);
      assert.equal(expected.institutionId, institutionId);
      assert.deepEqual(Array.from(periods, period => [period.periodoId, period.parcial]), [
        ["P1", "I Parcial"], ["P2", "II Parcial"]
      ]);
      const makeSnapshot = period => ({ status: "success", data: {
        alumnos: [{ userId: "STU-1", nombreCompleto: "Ana Pérez" }, { userId: "STU-2", nombreCompleto: "Luis Gómez" }],
        resumenes: {
          "STU-1": { userId: "STU-1", status: "calculated", notaFinal: 91.25 },
          "STU-2": { userId: "STU-2", status: "calculated", notaFinal: 84 }
        },
        recuperaciones: [], estadoPeriodo: "Cerrado",
        contexto: { anoId: expected.anoId, periodoId: period.periodoId, parcial: period.parcial,
          grado: expected.grado, seccion: expected.seccion, asignatura: expected.asignatura,
          institutionId: expected.institutionId }
      } });
      return periods.map(period => ({
        periodoId: period.periodoId, parcial: period.parcial, snapshot: makeSnapshot(period)
      }));
    },
    Date, String, Number, Array, Object, Set, Error, Math, JSON,
    getSnapshotLockStats() { return { held: snapshotLockHeld, waits: snapshotLockWaits, releases: snapshotLockReleases }; }
  };
  vm.createContext(context);
  vm.runInContext(extract("resolveSaceAttendanceJustification_") + "\n" + extract("getSaceAttendanceSnapshot") + "\nthis.runSnapshot=getSaceAttendanceSnapshot;", context);
  return context;
}

const payload = {
  anoId: "YEAR-2026", grado: "11", seccion: "A", asignaturaId: "SUB-1",
  periodoIds: ["P1", "P2"], examPeriodMappings: [
    { periodoId: "P1", parcial: "I Parcial" }, { periodoId: "P2", parcial: "II Parcial" }
  ], studentIds: ["STU-1", "STU-2"],
  docenteUserId: "ATTACKER-SPOOF", sessionToken: "SESSION-TEST"
};
["createStudentEnrollment", "registerStudentEnrollment", "convertAdmissionToStudent", "changeStudentSection", "recordStudentTransfer", "recordStudentWithdrawal", "processStudentGraduation", "reconcileStudentLifecycleState"].forEach(name => {
  assert.ok(extract(name).includes("LockService.getScriptLock"), name + " must coordinate enrollment writes with the SACE snapshot lock");
});
const snapshotContext = createContext();
const result = snapshotContext.runSnapshot(payload);
assert.deepEqual(snapshotContext.getSnapshotLockStats(), { held: false, waits: 1, releases: 1 }, "snapshot must release its lock exactly once before remote gradebook reads");
assert.equal(result.status, "success", result.code || "snapshot did not succeed");
assert.equal(result.data.expectedContext.teacherUserId, "TEACHER-1", "teacher identity must come from the verified session");
assert.equal(result.data.expectedContext.institutionId, "INST-1", "institution must come from verified claims and service configuration");
assert.equal(result.data.expectedContext.asignatura, "Informática");
assert.deepEqual(Array.from(result.data.periods, period => period.periodoId), ["P1", "P2"]);
assert.deepEqual(Array.from(result.data.gradebookSnapshots, item => [item.periodoId, item.parcial, item.snapshot.data.contexto.periodoId]), [
  ["P1", "I Parcial", "P1"], ["P2", "II Parcial", "P2"]
]);
assert.deepEqual(Array.from(result.data.identityRecords, row => [row.userId, row.identity, row.documentType, row.documentMarker]), [
  ["STU-1", "0801-2000-00001", "DNI", ""], ["STU-2", "0801-2000-00002", "DNI", ""]
], "identity and document type are fetched from USER service; no local Personas sheet is required");
assert.equal(result.data.attendanceSessions.length, 2);
assert.equal(result.data.attendanceSessions.every(session => typeof session.fechaCierre === "string" && session.fechaCierre.length > 0), true);
assert.deepEqual(Array.from(result.data.attendanceSessions, row => row.sesionId), ["S-1", "S-2"]);
assert.equal(result.data.attendanceRecords.length, 4);
assert.equal(result.data.attendanceRecords.find(row => row.registroId === "R-4").justificado, true);
assert.equal(result.data.attendanceRecords.find(row => row.registroId === "R-4").justificacionId, "JUST-1");
assert.equal(result.data.attendanceRecords.every(row => row.justificacionVerificada === true), true,
  "every attendance justification state must be verified against the canonical workflow");
assert(result.limitations.some(item => item.includes("documentMarker remains empty")));
assert.equal(result.data.attendanceRecords.some(row => row.registroId === "R-OTHER"), false);

const candidateFromAcademicSnapshot = provider.buildCandidateStudentsFromSnapshot({
  attendanceSnapshot: result,
  partial1PeriodId: "P1",
  partial2PeriodId: "P2",
  partial1Gradebook: result.data.gradebookSnapshots.find(item => item.periodoId === "P1").snapshot,
  partial2Gradebook: result.data.gradebookSnapshots.find(item => item.periodoId === "P2").snapshot,
  documentTypeMappings: [{ documentType: "DNI", documentMarker: "HND" }],
  absencePolicy: { justifiedAbsenceMode: "COUNT" }
});
assert.equal(candidateFromAcademicSnapshot.status, "candidate");
assert.deepEqual(candidateFromAcademicSnapshot.sourceStudents.map(row => [
  row.userId, row.partial1Absences, row.partial2Absences, row.documentMarker
]), [
  ["STU-1", 1, 0, "HND"], ["STU-2", 0, 1, "HND"]
], "the real Academic-Service snapshot must feed the provider with closed-session counts and explicit document mapping");

assert.equal(createContext("Estudiante").runSnapshot(payload).code, "SACE_TEACHER_CONTEXT_REQUIRED");
const lockTimeoutContext = createContext("Profesor", "INST-1", true);
assert.equal(lockTimeoutContext.runSnapshot(payload).code, "SACE_ATTENDANCE_SNAPSHOT_LOCK_TIMEOUT", "snapshot must fail closed when the shared lock cannot be acquired");
assert.deepEqual(lockTimeoutContext.getSnapshotLockStats(), { held: false, waits: 1, releases: 0 }, "failed lock acquisition must not release an unowned lock");
const readFailureContext = createContext("Profesor", "INST-1", false, true);
assert.equal(readFailureContext.runSnapshot(payload).code, "fixture read failure");
assert.deepEqual(readFailureContext.getSnapshotLockStats(), { held: false, waits: 1, releases: 1 }, "a source-read failure must release the acquired lock");
assert.equal(createContext("Profesor", "INST-OTHER").runSnapshot(payload).code, "SACE_INSTITUTION_CONTEXT_REQUIRED");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { studentIds: ["STU-1", "STU-1"] })).code, "SACE_STUDENT_ROSTER_DUPLICATE");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { periodoIds: ["P1", "P1"] })).code, "SACE_PERIODS_MUST_BE_DISTINCT");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { examPeriodMappings: undefined })).code, "SACE_EXAM_PERIOD_MAPPING_REQUIRED");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { examPeriodMappings: [
  { periodoId: "P1", parcial: "I Parcial" }, { periodoId: "P2", parcial: "I Parcial" }
] })).code, "SACE_EXAM_PERIOD_MAPPING_DUPLICATE");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { studentIds: ["STU-UNKNOWN"] })).code, "SACE_STUDENT_ENROLLMENT_CONTEXT_MISMATCH");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { periodoIds: ["P1", "P-UNKNOWN"] })).code, "SACE_PERIOD_CONTEXT_MISMATCH");

const professorStart = source.indexOf('"Profesor": [', source.indexOf("const ROLE_PERMISSIONS"));
const assistantStart = source.indexOf('"Asistente": [', professorStart);
const professorPermissions = source.slice(professorStart, assistantStart);
assert(professorPermissions.includes('"getSaceAttendanceSnapshot"'), "only teacher role should be explicitly granted the endpoint");
assert(!source.slice(source.indexOf('"Estudiante": [', assistantStart), source.indexOf('"Alumno": [', assistantStart)).includes('"getSaceAttendanceSnapshot"'));
assert(extract("doPost").includes('case "getSaceAttendanceSnapshot": result = getSaceAttendanceSnapshot(payload); break;'));

const helperContext = {
  getRequestSessionToken_(request) { return request.sessionToken; },
  PropertiesService: { getScriptProperties() { return { getProperty(name) {
    return name === "IMA_USER_SERVICE_URL" ? "https://script.google.com/macros/s/USER_DEPLOYMENT/exec" : "";
  } }; } },
  createInterServiceEnvelope(source, target, action, payload, credentialType) {
    assert.equal(source, "ACADEMIC");
    assert.equal(target, "USER");
    assert.equal(action, "getSaceStudentIdentityDirectory");
    assert.equal(credentialType, "IMA_MIGRATION_HMAC_SECRET");
    return { sourceService: source, targetService: target, action, payload };
  },
  UrlFetchApp: { fetch(url, options) {
    assert.equal(url, "https://script.google.com/macros/s/USER_DEPLOYMENT/exec");
    const sent = JSON.parse(options.payload);
    assert.equal(sent.sourceService, "ACADEMIC");
    assert.equal(sent.targetService, "USER");
    assert.equal(sent.payload.teacherUserId, "TEACHER-1");
    return { getResponseCode() { return 200; }, getContentText() {
      return JSON.stringify({ status: "success", data: [
        { userId: "STU-1", identity: "0801-2000-00001", documentType: "DNI", name: "Ana Pérez" },
        { userId: "STU-2", identity: "0801-2000-00002", documentType: "DNI", name: "Luis Gómez" }
      ] });
    } };
  } },
  JSON, String, Set, Error, Array
};
vm.createContext(helperContext);
vm.runInContext(extract("requestSaceStudentIdentityDirectoryFromUser_") + "\nthis.requestDirectory=requestSaceStudentIdentityDirectoryFromUser_;", helperContext);
const directory = helperContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1", "STU-2"], "INST-1", "TEACHER-1"
);
assert.equal(directory.length, 2);
assert.equal(directory[0].documentMarker, "");
assert.throws(() => helperContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1"], "INST-1", "TEACHER-1"
), /SACE_IDENTITY_RESPONSE_SCOPE_INVALID/);
assert.throws(() => helperContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1", "STU-1"], "INST-1", "TEACHER-1"
), /SACE_IDENTITY_ROSTER_DUPLICATE/);
assert.throws(() => helperContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1", "  "], "INST-1", "TEACHER-1"
), /SACE_IDENTITY_STUDENT_ID_REQUIRED/);
const incompleteIdentityContext = Object.assign({}, helperContext, {
  UrlFetchApp: { fetch() { return { getResponseCode() { return 200; }, getContentText() {
    return JSON.stringify({ status: "success", data: [
      { userId: "STU-1", identity: "0801-2000-00001", documentType: "DNI", name: "Ana Pérez" }
    ] });
  } }; } }
});
vm.createContext(incompleteIdentityContext);
vm.runInContext(extract("requestSaceStudentIdentityDirectoryFromUser_") +
  "\nthis.requestDirectory=requestSaceStudentIdentityDirectoryFromUser_;", incompleteIdentityContext);
assert.throws(() => incompleteIdentityContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1", "STU-2"], "INST-1", "TEACHER-1"
), /SACE_IDENTITY_RESPONSE_INCOMPLETE/);
const invalidDocumentContext = Object.assign({}, helperContext, {
  UrlFetchApp: { fetch() { return { getResponseCode() { return 200; }, getContentText() {
    return JSON.stringify({ status: "success", data: [
      { userId: "STU-1", identity: "---", documentType: "DNI", name: "Ana Pérez" }
    ] });
  } }; } }
});
vm.createContext(invalidDocumentContext);
vm.runInContext(extract("requestSaceStudentIdentityDirectoryFromUser_") +
  "\nthis.requestDirectory=requestSaceStudentIdentityDirectoryFromUser_;", invalidDocumentContext);
assert.throws(() => invalidDocumentContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1"], "INST-1", "TEACHER-1"
), /SACE_IDENTITY_RESPONSE_SCOPE_INVALID/);
const duplicateDocumentContext = Object.assign({}, helperContext, {
  UrlFetchApp: { fetch() { return { getResponseCode() { return 200; }, getContentText() {
    return JSON.stringify({ status: "success", data: [
      { userId: "STU-1", identity: "0801-2000-00001", name: "Ana Pérez" },
      { userId: "STU-2", identity: "0801 2000 00001", name: "Luis Gómez" }
    ] });
  } }; } }
});
vm.createContext(duplicateDocumentContext);
vm.runInContext(extract("requestSaceStudentIdentityDirectoryFromUser_") +
  "\nthis.requestDirectory=requestSaceStudentIdentityDirectoryFromUser_;", duplicateDocumentContext);
assert.throws(() => duplicateDocumentContext.requestDirectory(
  { sessionToken: "SESSION-TEST" }, ["STU-1", "STU-2"], "INST-1", "TEACHER-1"
), /SACE_IDENTITY_DUPLICATE_DOCUMENT/);



const gradebookHelperContext = {
  getRequestSessionToken_(request) { return request.sessionToken; },
  PropertiesService: { getScriptProperties() { return { getProperty(name) {
    return name === "IMA_EXAM_SERVICE_URL" ? "https://script.google.com/macros/s/EXAM_DEPLOYMENT/exec" : "";
  } }; } },
  UrlFetchApp: { fetch(url, options) {
    assert.equal(url, "https://script.google.com/macros/s/EXAM_DEPLOYMENT/exec");
    const sent = JSON.parse(options.payload);
    assert.equal(sent.action, "getSaceGradebookSnapshot");
    assert.equal(sent.payload.sessionToken, "SESSION-TEST");
    assert.equal(sent.payload.profesorId, "TEACHER-1");
    assert.equal(sent.payload.periodoId, "P1");
    assert.equal(sent.payload.parcial, "I Parcial");
    assert.deepEqual(sent.payload.studentIds, ["STU-1"]);
    return {
      getResponseCode() { return 200; },
      getContentText() { return JSON.stringify({ status: "success", data: {
        alumnos: [{ userId: "STU-1", nombreCompleto: "Ana Pérez" }],
        resumenes: { "STU-1": { userId: "STU-1", status: "calculated", notaFinal: 90 } },
        estadoPeriodo: "Cerrado",
        contexto: { anoId: "YEAR-2026", periodoId: "P1", parcial: "I Parcial",
          grado: "11", seccion: "A", asignatura: "Informática", institutionId: "INST-1" }
      } }); }
    };
  } },
  String, Array, Set, Object, JSON, Error
};
vm.createContext(gradebookHelperContext);
vm.runInContext(extract("requestSaceGradebookSnapshotFromExam_") +
  "\nthis.requestSnapshot=requestSaceGradebookSnapshotFromExam_;", gradebookHelperContext);
const examSnapshot = gradebookHelperContext.requestSnapshot(
  { sessionToken: "SESSION-TEST" }, ["STU-1"], "TEACHER-1",
  { anoId: "YEAR-2026", grado: "11", seccion: "A", asignatura: "Informática", institutionId: "INST-1" },
  { periodoId: "P1" }, "I Parcial"
);
assert.equal(examSnapshot.status, "success");
assert.equal(examSnapshot.data.contexto.periodoId, "P1");
const misScopedExamContext = Object.assign({}, gradebookHelperContext, {
  UrlFetchApp: { fetch() { return { getResponseCode() { return 200; }, getContentText() {
    return JSON.stringify({ status: "success", data: { alumnos: [{ userId: "STU-1" }], resumenes: {},
      estadoPeriodo: "Cerrado", contexto: { anoId: "YEAR-2026", periodoId: "P1", parcial: "I Parcial",
        grado: "11", seccion: "A", asignatura: "Informática", institutionId: "INST-OTHER" } } });
  } }; } }
});
vm.createContext(misScopedExamContext);
vm.runInContext(extract("requestSaceGradebookSnapshotFromExam_") +
  "\nthis.requestSnapshot=requestSaceGradebookSnapshotFromExam_;", misScopedExamContext);
assert.throws(() => misScopedExamContext.requestSnapshot(
  { sessionToken: "SESSION-TEST" }, ["STU-1"], "TEACHER-1",
  { anoId: "YEAR-2026", grado: "11", seccion: "A", asignatura: "Informática", institutionId: "INST-1" },
  { periodoId: "P1" }, "I Parcial"
), /SACE_GRADEBOOK_RESPONSE_CONTEXT_INVALID:institutionId/);


const justificationHelperContext = { String, Array, JSON, Set, Error };
vm.createContext(justificationHelperContext);
vm.runInContext(extract("resolveSaceAttendanceJustification_") +
  "\nthis.resolveJustification=resolveSaceAttendanceJustification_;", justificationHelperContext);
const justificationIndex = {
  RegistroID: 0, SesionID: 1, UserId: 2, EstadoAsistencia: 3,
  Justificado: 6, JustificacionID: 9
};
const justificationSourceIndex = {
  JustificacionID: 0, UserId: 1, Periodo: 2, EstadoRevision: 3,
  SyncEstado: 4, SesionIDsJSON: 5, FechasAfectadasJSON: 6
};
const approvedJustification = ["JUST-1", "STU-2", "P2", "Aprobada", "SINCRONIZADO", '["S-2"]', '["2026-05-03"]'];
const justificationSource = { rows: [approvedJustification], index: justificationSourceIndex };
const attendanceRecord = ["R-4", "S-2", "STU-2", "Ausente", "", "", true, "", "", "JUST-1"];
const attendanceSession = { sesionId: "S-2", fecha: "2026-05-03" };
const attendancePeriod = { periodoId: "P2" };
assert.deepEqual(JSON.parse(JSON.stringify(justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod, justificationSource
))), { justificado: true, justificacionId: "JUST-1", justificacionVerificada: true });
assert.deepEqual(JSON.parse(JSON.stringify(justificationHelperContext.resolveJustification(
  ["R-1", "S-1", "STU-1", "Ausente", "", "", false, "", "", ""],
  justificationIndex, { sesionId: "S-1", fecha: "2026-02-03" }, { periodoId: "P1" },
  { rows: [], index: justificationSourceIndex }
))), { justificado: false, justificacionId: "", justificacionVerificada: true });
assert.throws(() => justificationHelperContext.resolveJustification(
  ["R-1", "S-1", "STU-1", "Ausente", "", "", false, "", "", ""],
  justificationIndex, { sesionId: "S-1", fecha: "2026-02-03" }, { periodoId: "P1" }, null
), /SACE_JUSTIFICATION_SOURCE_UNAVAILABLE/);
assert.throws(() => justificationHelperContext.resolveJustification(
  ["R-X", "S-2", "STU-2", "Ausente", "", "", true, "", "", ""],
  justificationIndex, attendanceSession, attendancePeriod, justificationSource
), /SACE_ATTENDANCE_JUSTIFICATION_LINK_REQUIRED/);
const pendingJustification = approvedJustification.slice(); pendingJustification[3] = "Pendiente";
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [pendingJustification], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_NOT_APPROVED_AND_SYNCED/);
const wrongStudent = approvedJustification.slice(); wrongStudent[1] = "STU-1";
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [wrongStudent], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_STUDENT_MISMATCH/);
const wrongPeriod = approvedJustification.slice(); wrongPeriod[2] = "P1";
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [wrongPeriod], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_PERIOD_MISMATCH/);
const wrongSession = approvedJustification.slice(); wrongSession[5] = '["S-OTHER"]';
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [wrongSession], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_SESSION_SCOPE_MISMATCH/);
const wrongDate = approvedJustification.slice(); wrongDate[6] = '["2026-05-04"]';
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [wrongDate], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_SESSION_SCOPE_MISMATCH/);
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [approvedJustification, approvedJustification], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_RECORD_AMBIGUOUS/);
assert.throws(() => justificationHelperContext.resolveJustification(
  attendanceRecord, justificationIndex, attendanceSession, attendancePeriod, null
), /SACE_JUSTIFICATION_SOURCE_UNAVAILABLE/);
assert.throws(() => justificationHelperContext.resolveJustification(
  ["R-4", "S-2", "STU-2", "Ausente", "", "", false, "", "", "JUST-1"],
  justificationIndex, attendanceSession, attendancePeriod, justificationSource
), /SACE_ATTENDANCE_JUSTIFICATION_FLAG_MISMATCH/);
const noLinkAttendance = ["R-4", "S-2", "STU-2", "Ausente", "", "", false, "", "", ""];
const pendingSync = approvedJustification.slice(); pendingSync[3] = "PendienteSincronizacion"; pendingSync[4] = "PENDIENTE";
assert.throws(() => justificationHelperContext.resolveJustification(
  noLinkAttendance, justificationIndex, attendanceSession, attendancePeriod,
  { rows: [pendingSync], index: justificationSourceIndex }
), /SACE_JUSTIFICATION_SYNC_PENDING/);
assert.throws(() => justificationHelperContext.resolveJustification(
  noLinkAttendance, justificationIndex, attendanceSession, attendancePeriod, justificationSource
), /SACE_ATTENDANCE_JUSTIFICATION_LINK_MISMATCH/);

console.log("sace-attendance-snapshot-contract: PASS (verified teacher scope, institution, periods, enrollment, identity join and session attendance)");
