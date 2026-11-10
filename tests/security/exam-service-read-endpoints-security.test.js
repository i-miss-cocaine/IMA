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
  return { rows, getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; } };
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
    ["DEL-DUP","EXM-3","STU-1",new Date("2026-11-10T15:00:00Z"),"[]",71,"Calificado",""],
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
  const ss = { getSheetByName(name) { return sheets[name] || null; } };
  let held = false, acquires = 0, releases = 0;
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
        scope: { authorized: true }, requestedStudentId: requestedId
      };
    },
    getExamStudentProfile_(spreadsheet, id) {
      return id === "STU-1" ? { userId: id, grado: "10", seccion: "A", role: "Estudiante" } : null;
    },
    isExamAssignedToStudent_(exam, profile) { return String(exam[3]) === profile.grado && String(exam[4]) === profile.seccion; },
    assertExamResourceOwnershipForScope_() { return { authorized: options.ownership !== false }; }
  };
  const names = ["withAuthorizedExamRead_", "getAuthorizedExamReadContext_", "getStudentExams", "getStudentExamsUnlocked_",
    "getExamQuestions", "getExamQuestionsUnlocked_", "getAllExams", "getAllExamsUnlocked_",
    "getTeacherExamActivity", "getTeacherExamActivityUnlocked_"];
  vm.runInNewContext(names.map(extractFunction).join("\n") +
    "\nthis.getStudentExams=getStudentExams; this.getExamQuestions=getExamQuestions; " +
    "this.getAllExams=getAllExams; this.getTeacherExamActivity=getTeacherExamActivity;", context);
  return { context, sheets, stats: () => ({ acquires, releases, held }) };
}
const valid = runtime();
const list = valid.context.getStudentExams({ sessionToken: "student", studentId: "ATTACKER" });
assert.deepEqual(Array.from(list.data, row => row.examenId), ["EXM-2", "EXM-3"],
  "ambiguous duplicate deliveries exclude their exam; inactive exam is visible only with one own delivery");
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

process.stdout.write("exam-service-read-endpoints-security: PASS\\n");
