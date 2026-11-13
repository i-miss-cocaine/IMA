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
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
function makeSheet(rows) {
  return { rows, getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; }, getLastRow() { return this.rows.length; } };
}
function runtime(options = {}) {
  const examRows = [
    ["EXM-1","Activo propio","Math","10","A","","30","Activo","PROF-1","P1"],
    ["EXM-2","Inactivo con entrega","Math","10","A","","30","Inactivo","PROF-1","P1"],
    ["EXM-3","Activo sin entrega","Math","10","A","","30","Activo","PROF-1","P1"],
    ["EXM-D","Duplicado","Math","10","A","","30","Activo","PROF-1","P1"],
    ["EXM-D","Duplicado dos","Math","10","A","","30","Activo","PROF-1","P1"],
    ["EXM-4","Otro profesor","Math","11","B","","30","Activo","PROF-2","P1"]
  ];
  const deliveryRows = [
    ["DEL-1","EXM-1","STU-1",new Date("2026-11-10T10:00:00Z"),"[]",90,"Calificado",""],
    ["DEL-2","EXM-2","STU-1",new Date("2026-11-10T11:00:00Z"),"[]",null,"Pendiente",""],
    ["DEL-D1","EXM-1","STU-1",new Date("2026-11-10T12:00:00Z"),"[]",88,"Calificado",""],
    ["DEL-D2","EXM-1","STU-1",new Date("2026-11-10T13:00:00Z"),"[]",89,"Calificado",""],
    ["DEL-DUP","EXM-3","STU-1",new Date("2026-11-10T14:00:00Z"),"[]",70,"Calificado",""],
    ["DEL-DUP","EXM-3","STU-D",new Date("2026-11-10T15:00:00Z"),"[]",71,"Calificado",""],
    ["DEL-AMB","EXM-3","STU-D",new Date("2026-11-10T16:00:00Z"),"[]",80,"Calificado",""],
    ["DEL-FOREIGN","EXM-4","STU-1",new Date("2026-11-10T17:00:00Z"),"[]",60,"Calificado",""],
    ["DEL-DUP-EXM","EXM-D","STU-1",new Date("2026-11-10T18:00:00Z"),"[]",60,"Calificado",""]
  ];
  const questionRows = [
    ["Q-1","EXM-3","opcion_multiple","Pregunta única",'{"A":"1"}',"A"],
    ["Q-D","EXM-3","opcion_multiple","Duplicada",'{}',"B"],
    ["Q-D","EXM-3","opcion_multiple","Duplicada segunda",'{}',"B"],
    ["Q-2","EXM-2","opcion_multiple","Pregunta inactiva",'{}',"C"]
  ];
  const sheets = {
    Examenes: makeSheet([["ExamenID"], ...examRows]),
    EntregasExamen: makeSheet([["EntregaID"], ...deliveryRows]),
    PreguntasExamen: makeSheet([["PreguntaID"], ...questionRows]),
    Usuarios: makeSheet([["UserID"], ["STU-1","Estudiante Uno","10","A","one@example.test"],
      ["STU-D","Duplicado A","10","A","a@example.test"], ["STU-D","Duplicado B","10","A","b@example.test"]])
  };
  ["CalificacionesEstudiantes", "CategoriasEvaluacion", "HistorialRectificacionesNotas", "CierresPeriodos",
    "RecuperacionesEstudiante", "EvaluacionesCompetencias"].forEach(name => {
    if (options.missingMetricSheet === name) return;
    const count = Number(options.metricRows && options.metricRows[name] || 0);
    sheets[name] = makeSheet([["Header"], ...Array.from({ length: count }, (_, index) => ["ROW-" + index])]);
  });
  const ss = { getSheetByName(name) { return sheets[name] || null; } };
  let held = false, acquires = 0, releases = 0;
  const events = [];
  const context = {
    LockService: { getScriptLock() { return {
      tryLock() {
        acquires++;
        if (options.beforeAcquire) { const cb = options.beforeAcquire; options.beforeAcquire = null; cb(); }
        if (options.lockAvailable === false || held) return false;
        held = true; return true;
      },
      releaseLock() { releases++; held = false; }
    }; } },
    getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("MISSING_SHEET"); return sheet; },
    normalizeString(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); },
    validateRolePermission(action) {
      if (options.deniedAction === action) return { authorized: false };
      return { authorized: true };
    },
    getExamReadContext_(payload, requestedId) {
      if (options.expectedActionContext) assert.equal(requestedId, options.expectedActionContext);
      if (options.contextError) throw new Error("RESOURCE_NOT_AVAILABLE");
      const studentActor = options.studentActor !== false;
      return {
        actor: options.actor || (studentActor ? { userId: "STU-1", role: "Estudiante" } : { userId: "PROF-1", role: "Profesor" }),
        ss, studentActor, guardianActor: !!options.guardianActor,
        profile: { userId: options.profileUserId || "STU-1", grado: "10", seccion: "A", role: "Estudiante" },
        scope: { authorized: true, institutionWide: options.institutionWide !== false }, requestedStudentId: requestedId
      };
    },
    getExamStudentProfile_(spreadsheet, id) {
      return id === "STU-1" ? { userId: id, grado: "10", seccion: "A", role: "Estudiante" } : null;
    },
    isExamAssignedToStudent_(exam, profile) { return String(exam[3]) === profile.grado && String(exam[4]) === profile.seccion; },
    assertExamResourceOwnershipForScope_() { return { authorized: options.ownership !== false }; },
    logStructuredEvent(...args) { events.push(args); }
  };
  const names = ["withAuthorizedExamRead_", "getAuthorizedExamReadContext_", "getStudentExams", "getStudentExamsUnlocked_",
    "getExamQuestions", "getExamQuestionsUnlocked_", "getAllExams", "getAllExamsUnlocked_",
    "getTeacherExamActivity", "getTeacherExamActivityUnlocked_", "getExamGradeDistributionAnalytics",
    "getExamGradeDistributionAnalyticsUnlocked_", "checkExamSchedulingConflict", "checkExamSchedulingConflictUnlocked_", "simulateExamReschedule", "simulateExamRescheduleUnlocked_", "getGradingPerformanceAndPersistenceMetrics", "getGradingPerformanceAndPersistenceMetricsUnlocked_"];
  vm.runInNewContext(names.map(extractFunction).join("\n") +
    "\nthis.getStudentExams=getStudentExams; this.getExamQuestions=getExamQuestions; " +
    "this.getAllExams=getAllExams; this.getTeacherExamActivity=getTeacherExamActivity; " +
    "this.getExamGradeDistributionAnalytics=getExamGradeDistributionAnalytics; this.checkExamSchedulingConflict=checkExamSchedulingConflict; this.simulateExamReschedule=simulateExamReschedule; " +
    "this.getGradingPerformanceAndPersistenceMetrics=getGradingPerformanceAndPersistenceMetrics;", context);
  return { context, sheets, events, stats: () => ({ acquires, releases, held }) };
}
const valid = runtime();
const list = valid.context.getStudentExams({ sessionToken: "student", studentId: "ATTACKER" });
assert.deepEqual(Array.from(list.data, row => row.examenId), ["EXM-2", "EXM-3"],
  "the student sees only their own unique delivery; inactive exams require one own delivery");
assert.equal(list.data[0].entrega.calificacion, null, "pending student delivery never exposes a score");
assert.deepEqual(valid.stats(), { acquires: 1, releases: 1, held: false }, "student listing is serialized and releases lock");
const questions = valid.context.getExamQuestions({ sessionToken: "student", examenId: "EXM-3" });
assert.deepEqual(Array.from(questions.data.preguntas, row => row.preguntaId), ["Q-1"],
  "question endpoint excludes duplicate question IDs");
assert.equal(Object.prototype.hasOwnProperty.call(questions.data.preguntas[0], "respuestaCorrecta"), false,
  "question endpoint never exposes the answer key");
assert.throws(() => valid.context.getExamQuestions({ sessionToken: "student", examenId: "EXM-D" }),
  /RESOURCE_NOT_AVAILABLE/, "duplicate exam IDs are denied");
assert.throws(() => runtime({ deniedAction: "getStudentExams" }).context.getStudentExams({ sessionToken: "student" }),
  /RESOURCE_NOT_AVAILABLE/, "student listing requires its own action permission");
assert.throws(() => runtime({ deniedAction: "getExamQuestions" }).context.getExamQuestions({ sessionToken: "student", examenId: "EXM-1" }),
  /RESOURCE_NOT_AVAILABLE/, "question read requires its own action permission");
assert.throws(() => runtime({ lockAvailable: false }).context.getStudentExams({ sessionToken: "student" }),
  /EXAM_READ_LOCK_TIMEOUT/, "lock timeout fails closed");
const deletedBeforeRead = runtime({ beforeAcquire() { deletedBeforeRead.sheets.EntregasExamen.rows.splice(2, 1); } });
assert.throws(() => deletedBeforeRead.context.getExamQuestions({ sessionToken: "student", examenId: "EXM-2" }),
  /RESOURCE_NOT_AVAILABLE/, "inactive exam access is re-evaluated after acquiring lock when delivery disappears");
assert.deepEqual(deletedBeforeRead.stats(), { acquires: 1, releases: 1, held: false },
  "lock is released when the locked read denies access");

const staff = runtime({ studentActor: false });
const allExams = staff.context.getAllExams({ sessionToken: "teacher" });
assert.deepEqual(Array.from(allExams.data, row => row.examenId), ["EXM-1", "EXM-2", "EXM-3"],
  "staff exam list excludes duplicate IDs and exams owned by another teacher");
assert.deepEqual(staff.stats(), { acquires: 1, releases: 1, held: false },
  "getAllExams acquires and releases the shared exam read lock");
const activity = staff.context.getTeacherExamActivity({ sessionToken: "teacher" });
assert.deepEqual(Array.from(activity.data, row => row.entregaId), ["DEL-AMB", "DEL-D2", "DEL-D1", "DEL-2", "DEL-1"],
  "teacher activity excludes duplicate delivery IDs, duplicate exam IDs and foreign-owned exams");
const ambiguousProfile = activity.data.find(row => row.entregaId === "DEL-AMB");
assert.equal(ambiguousProfile.alumnoNombre, "Usuario Desconocido",
  "duplicate student IDs do not select an arbitrary student profile");
assert.equal(ambiguousProfile.email, "N/A", "duplicate student IDs do not expose arbitrary email data");
assert.deepEqual(staff.stats(), { acquires: 2, releases: 2, held: false },
  "getTeacherExamActivity acquires and releases the shared exam read lock");
assert.throws(() => runtime({ studentActor: false, deniedAction: "getAllExams" }).context.getAllExams({}),
  /RESOURCE_NOT_AVAILABLE/, "getAllExams revalidates its explicit RBAC action");
assert.throws(() => runtime({ studentActor: false, deniedAction: "getTeacherExamActivity" }).context.getTeacherExamActivity({}),
  /RESOURCE_NOT_AVAILABLE/, "getTeacherExamActivity revalidates its explicit RBAC action");
assert.throws(() => runtime({ studentActor: false, lockAvailable: false }).context.getAllExams({}),
  /EXAM_READ_LOCK_TIMEOUT/, "getAllExams fails closed on lock timeout");
assert.throws(() => runtime({ studentActor: false, lockAvailable: false }).context.getTeacherExamActivity({}),
  /EXAM_READ_LOCK_TIMEOUT/, "getTeacherExamActivity fails closed on lock timeout");
const race = runtime({ studentActor: false, beforeAcquire() { race.sheets.Examenes.rows.splice(3, 1); } });
const afterRace = race.context.getAllExams({});
assert.deepEqual(Array.from(afterRace.data, row => row.examenId), ["EXM-1", "EXM-2"],
  "getAllExams observes the state after acquiring the lock, not a stale pre-lock snapshot");
assert.deepEqual(race.stats(), { acquires: 1, releases: 1, held: false });


const analyticsRuntime = runtime({ studentActor: false });
const analyticsRows = analyticsRuntime.sheets.EntregasExamen.rows;
analyticsRows.push(
  ["DEL-PENDING-AN","EXM-1","STU-1",new Date("2026-11-10T19:00:00Z"),"[]",null,"Pendiente",""],
  ["DEL-AN-DUP","EXM-1","STU-1",new Date("2026-11-10T20:00:00Z"),"[]",100,"Calificado",""],
  ["DEL-AN-DUP","EXM-1","STU-1",new Date("2026-11-10T21:00:00Z"),"[]",0,"Calificado",""],
  ["DEL-AN-INF","EXM-1","STU-1",new Date("2026-11-10T22:00:00Z"),"[]",Infinity,"Calificado",""],
  ["DEL-AN-NAN","EXM-1","STU-1",new Date("2026-11-10T23:00:00Z"),"[]","no-grade","Calificado",""],
  ["","EXM-1","STU-1",new Date("2026-11-10T23:30:00Z"),"[]",99,"Calificado",""]
);
const analytics = analyticsRuntime.context.getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-1" });
assert.equal(analytics.data.totalEvaluados, 3, "analytics excludes duplicate IDs, blank IDs and non-finite scores");
assert.equal(analytics.data.totalPendientes, 1, "analytics preserves pending deliveries without grades");
assert.equal(analytics.data.promedio, 89, "analytics calculates only unique finite graded deliveries");
assert.deepEqual(analyticsRuntime.stats(), { acquires: 1, releases: 1, held: false });
assert.throws(() => runtime({ studentActor: false, deniedAction: "getExamGradeDistributionAnalytics" }).context
  .getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-1" }), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ studentActor: false, ownership: false }).context
  .getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-1" }), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ studentActor: false }).context
  .getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-D" }), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ studentActor: false }).context
  .getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-4" }), /RESOURCE_NOT_AVAILABLE/);
assert.throws(() => runtime({ studentActor: false, lockAvailable: false }).context
  .getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-1" }), /EXAM_READ_LOCK_TIMEOUT/);
const analyticsRace = runtime({ studentActor: false, beforeAcquire() {
  const row = analyticsRace.sheets.EntregasExamen.rows.find(item => item[0] === "DEL-1"); row[5] = 30;
} });
const postLockAnalytics = analyticsRace.context.getExamGradeDistributionAnalytics({ sessionToken: "teacher", examenId: "EXM-1" });
assert.equal(postLockAnalytics.data.promedio, 69, "analytics reads post-lock grades");
assert.deepEqual(analyticsRace.stats(), { acquires: 1, releases: 1, held: false });


const scheduling = runtime({ studentActor: false });
const scheduleRows = scheduling.sheets.Examenes.rows;
scheduleRows.push(
  ["SCH-1","A","Math","10","A","2026-11-12","30","Activo","PROF-1"],
  ["SCH-2","B","Math","10","A","2026-11-12T09:00:00","30","Activo","PROF-1"],
  ["SCH-3","Cancelado","Math","10","A","2026-11-12","30","Cancelado","PROF-1"],
  ["SCH-4","Inactivo","Math","10","A","2026-11-12","30","Inactivo","PROF-1"],
  ["SCH-DUP","Duplicado","Math","10","A","2026-11-12","30","Activo","PROF-1"],
  ["SCH-DUP","Duplicado 2","Math","10","A","2026-11-12","30","Activo","PROF-1"],
  ["SCH-FOREIGN","Ajeno","Math","10","A","2026-11-12","30","Activo","PROF-2"]
);
const conflict = scheduling.context.checkExamSchedulingConflict({ sessionToken: "teacher", seccionAsignada: "A",
  fechaLimite: "2026-11-12", examenId: "SCH-1", maxExamenesPorDia: 2 });
assert.equal(conflict.hasConflict, false, "counts only one other active, unique, teacher-owned exam");
assert.equal(conflict.examenesCount, 1);
const conflictAtLimit = scheduling.context.checkExamSchedulingConflict({ sessionToken: "teacher",
  seccionAsignada: "A", fechaLimite: "2026-11-12", maxExamenesPorDia: 1 });
assert.equal(conflictAtLimit.hasConflict, true, "conflict is reported at configured threshold");
assert.equal(conflictAtLimit.examenesCount, 2);
assert.deepEqual(scheduling.stats(), { acquires: 2, releases: 2, held: false },
  "scheduling reads share the bounded lock and release it");
assert.throws(() => runtime({ deniedAction: "checkExamSchedulingConflict", studentActor: false }).context
  .checkExamSchedulingConflict({ seccionAsignada: "A", fechaLimite: "2026-11-12" }),
  /RESOURCE_NOT_AVAILABLE/, "scheduling requires its explicit RBAC action");
assert.throws(() => runtime({ lockAvailable: false, studentActor: false }).context
  .checkExamSchedulingConflict({ seccionAsignada: "A", fechaLimite: "2026-11-12" }),
  /EXAM_READ_LOCK_TIMEOUT/, "scheduling fails closed on lock timeout");
assert.throws(() => scheduling.context.checkExamSchedulingConflict({ seccionAsignada: "A", fechaLimite: "2026-02-31" }),
  /EXAM_SCHEDULE_DATE_INVALID/, "impossible calendar dates are rejected");
assert.throws(() => scheduling.context.checkExamSchedulingConflict({ seccionAsignada: "A", fechaLimite: "2026-11-12", maxExamenesPorDia: 0 }),
  /EXAM_SCHEDULE_LIMIT_INVALID/, "zero limit is rejected");
const deniedOwnership = runtime({ ownership: false, studentActor: false });
const deniedCount = deniedOwnership.context.checkExamSchedulingConflict({ seccionAsignada: "A", fechaLimite: "2026-11-12" });
assert.equal(deniedCount.hasConflict, false, "ownership-denied exams are excluded from the conflict count");
assert.equal(deniedCount.examenesCount, 0, "ownership denial never leaks the number of inaccessible exams");
assert.deepEqual(deniedOwnership.stats(), { acquires: 1, releases: 1, held: false });


const reschedule = runtime({ studentActor: false });
reschedule.sheets.Examenes.rows[1][5] = "2026-11-10";
reschedule.sheets.Examenes.rows[3][5] = "2026-11-12";
reschedule.sheets.Examenes.rows.push(["SCH-EXTRA","Otro examen propio","Math","10","A","2026-11-12","30","Activo","PROF-1","P1"]);
const rowsBeforeSimulation = JSON.stringify(reschedule.sheets.Examenes.rows);
const simulated = reschedule.context.simulateExamReschedule({
  sessionToken: "teacher", examenId: "EXM-1", nuevaFecha: "2026-11-12", authRole: "Administrador"
});
assert.equal(simulated.status, "success");
assert.equal(simulated.simulacion.examenId, "EXM-1");
assert.equal(simulated.simulacion.titulo, "Activo propio");
assert.equal(simulated.simulacion.tieneConflicto, true, "simulation reuses the scheduling conflict calculation");
assert.equal(JSON.stringify(reschedule.sheets.Examenes.rows), rowsBeforeSimulation, "simulation performs no sheet writes");
assert.deepEqual(reschedule.stats(), { acquires: 1, releases: 1, held: false },
  "simulation and conflict check share one lock without nested acquisition");
assert.equal(reschedule.events.length, 1);
assert.equal(reschedule.events[0][6], "Profesor", "audit event role comes from verified identity, not payload");
assert.throws(() => runtime({ deniedAction: "simulateExamReschedule", studentActor: false }).context
  .simulateExamReschedule({ examenId: "EXM-1", nuevaFecha: "2026-11-12" }),
  /RESOURCE_NOT_AVAILABLE/, "simulation requires its own explicit RBAC permission");
assert.throws(() => runtime({ ownership: false, studentActor: false }).context
  .simulateExamReschedule({ examenId: "EXM-1", nuevaFecha: "2026-11-12" }),
  /RESOURCE_NOT_AVAILABLE/, "simulation fails closed without resource ownership");
assert.throws(() => runtime({ studentActor: false, actor: { userId: "PROF-2", role: "Profesor" } }).context
  .simulateExamReschedule({ examenId: "EXM-1", nuevaFecha: "2026-11-12" }),
  /RESOURCE_NOT_AVAILABLE/, "teacher cannot simulate another teacher's exam");
assert.throws(() => reschedule.context.simulateExamReschedule({ examenId: "EXM-D", nuevaFecha: "2026-11-12" }),
  /RESOURCE_NOT_AVAILABLE/, "ambiguous duplicate exam IDs are denied");
assert.throws(() => reschedule.context.simulateExamReschedule({ examenId: "EXM-1", nuevaFecha: "2026-02-31" }),
  /EXAM_SCHEDULE_DATE_INVALID/, "simulation validates impossible calendar dates");
assert.deepEqual(reschedule.stats(), { acquires: 3, releases: 3, held: false },
  "simulation releases the lock after duplicate-ID and invalid-date denials");


assert.throws(() => runtime({ lockAvailable: false, studentActor: false }).context
  .simulateExamReschedule({ examenId: "EXM-1", nuevaFecha: "2026-11-12" }),
  /EXAM_READ_LOCK_TIMEOUT/, "simulation fails closed when the shared lock is unavailable");
const rescheduleRace = runtime({ studentActor: false, beforeAcquire() {
  rescheduleRace.sheets.Examenes.rows[1][8] = "PROF-2";
} });
assert.throws(() => rescheduleRace.context.simulateExamReschedule({ examenId: "EXM-1", nuevaFecha: "2026-11-12" }),
  /RESOURCE_NOT_AVAILABLE/, "simulation rechecks target ownership after acquiring the shared lock");
assert.deepEqual(rescheduleRace.stats(), { acquires: 1, releases: 1, held: false },
  "post-lock ownership denial releases the lock");

const metricCounts = {
  CalificacionesEstudiantes: 10001,
  CategoriasEvaluacion: 3001,
  HistorialRectificacionesNotas: 2000
};
const adminMetricsRuntime = runtime({
  studentActor: false,
  actor: { userId: "ADMIN-1", role: "Administrador" },
  metricRows: metricCounts
});
const adminMetrics = adminMetricsRuntime.context.getGradingPerformanceAndPersistenceMetrics({ sessionToken: "admin" });
assert.equal(adminMetrics.status, "success");
assert.equal(adminMetrics.servicio, "EXAM_SERVICE");
assert.equal(adminMetrics.nivelAlertaGrading, "CRITICO");
assert.equal(adminMetrics.metricasHojas.length, 6);
assert.equal(adminMetrics.metricasHojas[0].rowCount, 10002);
assert.equal(adminMetrics.metricasHojas[0].status, "RIESGO_ELEVADO");
assert.equal(adminMetrics.metricasHojas[1].rowCount, 3002);
assert.equal(adminMetrics.metricasHojas[1].status, "ADVERTENCIA");
assert.equal(adminMetrics.totalFilasCalificaciones, 15008);
assert.equal(JSON.stringify(adminMetrics).includes("ROW-"), false, "metrics never return sheet cell contents");
assert.deepEqual(adminMetricsRuntime.stats(), { acquires: 1, releases: 1, held: false },
  "global metrics use the shared lock exactly once");

const developerMetrics = runtime({
  studentActor: false, actor: { userId: "DEV-1", role: "Desarrollador" }
});
assert.equal(developerMetrics.context.getGradingPerformanceAndPersistenceMetrics({ sessionToken: "dev" }).status, "success",
  "developer with institution-wide scope can read system metrics");
for (const role of ["Profesor", "Dirección", "Secretaría", "Estudiante"]) {
  const deniedMetrics = runtime({ studentActor: false, actor: { userId: "USER-1", role } });
  assert.throws(() => deniedMetrics.context.getGradingPerformanceAndPersistenceMetrics({ sessionToken: "user" }),
    /RESOURCE_NOT_AVAILABLE/, role + " cannot read institution-wide persistence metrics");
  assert.deepEqual(deniedMetrics.stats(), { acquires: 1, releases: 1, held: false },
    "unauthorized " + role + " read releases the shared lock");
}
const deniedMetricAction = runtime({
  studentActor: false, actor: { userId: "ADMIN-1", role: "Administrador" },
  deniedAction: "getGradingPerformanceAndPersistenceMetrics"
});
assert.throws(() => deniedMetricAction.context.getGradingPerformanceAndPersistenceMetrics({}),
  /RESOURCE_NOT_AVAILABLE/, "metrics require their explicit RBAC action");
const scopedMetrics = runtime({
  studentActor: false, actor: { userId: "ADMIN-1", role: "Administrador" }, institutionWide: false
});
assert.throws(() => scopedMetrics.context.getGradingPerformanceAndPersistenceMetrics({}),
  /RESOURCE_NOT_AVAILABLE/, "department-only scope cannot read institution-wide metrics");
const timedOutMetrics = runtime({
  studentActor: false, actor: { userId: "ADMIN-1", role: "Administrador" }, lockAvailable: false
});
assert.throws(() => timedOutMetrics.context.getGradingPerformanceAndPersistenceMetrics({}),
  /EXAM_READ_LOCK_TIMEOUT/, "metrics fail closed when the shared lock is unavailable");
assert.deepEqual(timedOutMetrics.stats(), { acquires: 1, releases: 0, held: false });

const metricsRace = runtime({
  studentActor: false, actor: { userId: "ADMIN-1", role: "Administrador" },
  beforeAcquire() { metricsRace.sheets.CalificacionesEstudiantes.rows.push(["ROW-AFTER-LOCK"]); }
});
const postLockMetrics = metricsRace.context.getGradingPerformanceAndPersistenceMetrics({});
assert.equal(postLockMetrics.metricasHojas[0].rowCount, 2,
  "metrics are sampled after acquiring the shared lock");
assert.deepEqual(metricsRace.stats(), { acquires: 1, releases: 1, held: false });

const missingMetricSheet = runtime({
  studentActor: false, actor: { userId: "ADMIN-1", role: "Administrador" },
  missingMetricSheet: "EvaluacionesCompetencias"
});
const partialMetrics = missingMetricSheet.context.getGradingPerformanceAndPersistenceMetrics({});
assert.equal(partialMetrics.metricasHojas[5].exists, false);
assert.equal(partialMetrics.metricasHojas[5].rowCount, 0);
assert.equal(partialMetrics.nivelAlertaGrading, "NORMAL");

process.stdout.write("exam-service-read-endpoints-security: PASS\\n");
