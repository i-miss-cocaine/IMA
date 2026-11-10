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
    ["EXM-D","Duplicado dos","Math","10","A","","30","Activo","PROF-1","P1"]
  ];
  const deliveryRows = [
    ["DEL-1","EXM-1","STU-1",null,"[]",90,"Calificado",""],
    ["DEL-2","EXM-2","STU-1",null,"[]",null,"Pendiente",""],
    ["DEL-D1","EXM-1","STU-1",null,"[]",88,"Calificado",""],
    ["DEL-D2","EXM-1","STU-1",null,"[]",89,"Calificado",""]
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
    PreguntasExamen: makeSheet([["PreguntaID"], ...questionRows])
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
        actor: options.actor || { userId: "STU-1", role: "Estudiante" },
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
  const names = ["withAuthorizedExamRead_", "getAuthorizedExamReadContext_", "getStudentExams", "getStudentExamsUnlocked_", "getExamQuestions", "getExamQuestionsUnlocked_"];
  vm.runInNewContext(names.map(extractFunction).join("\n") +
    "\nthis.getStudentExams=getStudentExams; this.getExamQuestions=getExamQuestions;", context);
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
process.stdout.write("exam-service-read-endpoints-security: PASS\\n");
