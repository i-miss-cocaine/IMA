const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
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
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const claims = {
  "teacher-token": { userId: "TEACHER-1", role: "Profesor" },
  "director-token": { userId: "DIRECTOR-1", role: "Dirección" },
  "other-token": { userId: "TEACHER-2", role: "Profesor" },
  "student-token": { userId: "STUDENT-1", role: "Estudiante" },
  "student3-token": { userId: "STUDENT-3", role: "Estudiante" },
  "tutor-token": { userId: "TUTOR-1", role: "Tutor" }
};
const examRows = [
  ["ExamenID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "TiempoLimite", "Estado", "ProfesorID", "Parcial"],
  ["EXM-1", "Propio y mismo departamento", "Matemáticas", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-2", "Propio pero otro departamento", "Ciencias", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-3", "Docente ajeno", "Historia", "11", "A", "", "", "Activo", "TEACHER-2", "P1"],
  ["EXM-4", "Sin propiedad", "Inglés", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-5", "Propiedad duplicada", "Arte", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-6", "Examen nuevo para entrega", "Historia", "11", "A", "", "", "Activo", "TEACHER-1", "P1"]
];
const scopeRows = [
  ["AssignmentID", "UserID", "RoleID", "ScopeType", "ScopeValues", "Status", "", "", "StartAt", "EndAt"],
  ["ASG-1", "TEACHER-1", "Profesor", "DEPARTAMENTO", "D1", "ACTIVO", "", "", "", ""],
  ["ASG-2", "TEACHER-2", "Profesor", "DEPARTAMENTO", "D2", "ACTIVO", "", "", "", ""],
  ["ASG-3", "DIRECTOR-1", "Dirección", "INSTITUCION", "I1", "ACTIVO", "", "", "", ""],
  ["ASG-4", "STUDENT-1", "Estudiante", "DEPARTAMENTO", "D1", "ACTIVO", "", "", "", ""],
  ["ASG-5", "STUDENT-3", "Estudiante", "DEPARTAMENTO", "D1", "ACTIVO", "", "", "", ""]
];
const ownershipRows = [
  ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
  ["OWN-1", "I1", "EXAMEN", "EXM-1", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-2", "I1", "EXAMEN", "EXM-2", "D2", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-3", "I1", "EXAMEN", "EXM-3", "D1", "ACTIVE", "TEACHER-2", "", ""],
  ["OWN-4", "I1", "EXAMEN", "EXM-5", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-5", "I1", "EXAMEN", "EXM-5", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-6", "I2", "EXAMEN", "EXM-1", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-7", "I1", "EXAMEN", "EXM-6", "D1", "ACTIVE", "TEACHER-1", "", ""]
];
const deliveryRows = [
  ["EntregaID", "ExamenID", "UserID", "Fecha", "Respuestas", "Nota", "Estado", "Comentario"],
  ["DEL-1", "EXM-1", "STUDENT-1", new Date("2026-11-01T10:00:00Z"), "[]", 90, "Entregado", ""],
  ["DEL-2", "EXM-2", "STUDENT-2", new Date("2026-11-02T10:00:00Z"), "[]", 80, "Entregado", ""],
  ["DEL-3", "EXM-3", "STUDENT-3", new Date("2026-11-03T10:00:00Z"), "[]", 70, "Entregado", ""]
];
const userRows = [
  ["UserID", "Nombre", "Grado", "Seccion", "Email"],
  ["STUDENT-1", "Estudiante Uno", "10", "A", "student1@example.invalid"],
  ["STUDENT-2", "Estudiante Dos", "10", "A", "student2@example.invalid"],
  ["STUDENT-3", "Estudiante Tres", "11", "A", "student3@example.invalid"],
  ["TUTOR-1", "Tutor Uno", "", "", "tutor1@example.invalid", "", "Tutor"]
];
const questionRows = [["PreguntaID", "ExamenID", "Tipo", "Texto", "OpcionesJSON", "RespuestaCorrecta"], ["Q-1", "EXM-1", "opcion_multiple", "Pregunta propia", "{}", "A"], ["Q-2", "EXM-2", "opcion_multiple", "Pregunta otro departamento", "{}", "B"], ["Q-6", "EXM-6", "opcion_multiple", "Pregunta de entrega", "{}", "A"]];
const familyRows = [["RelacionID", "PersonaEstudianteID", "PersonaResponsableID", "TipoParentesco", "EstadoAutorizacion"], ["REL-1", "EXP-1", "TUTOR-1", "Madre/Padre", "Verificada"], ["REL-2", "EXP-2", "TUTOR-1", "Madre/Padre", "Revocada"]];
const studentExpRows = [["ExpedienteID", "UserID"], ["EXP-1", "STUDENT-1"], ["EXP-2", "STUDENT-2"]];
const legacyGuardianRows = [["RelacionID", "EstudianteID", "TutorID", "", "", "", "", "", "", "Estado"], ["LEG-2", "STUDENT-2", "TUTOR-1", "", "", "", "", "", "", "Activa"]];
const sheets = { Examenes: examRows, AsignacionesAmbitosRoles: scopeRows, ResourceOwnership: ownershipRows, EntregasExamen: deliveryRows, Usuarios: userRows, PreguntasExamen: questionRows, RelacionesFamiliares: familyRows, ExpedientesEstudiantes: studentExpRows, RelacionesEstudianteTutor: legacyGuardianRows };
const sheetObjects = Object.fromEntries(Object.entries(sheets).map(([name, rows]) => [name, {
  getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
  getLastRow() { return rows.length; },
  appendRow(row) { rows.push(row.slice()); if (examSubmissionDuringAppend) { const cb = examSubmissionDuringAppend; examSubmissionDuringAppend = null; cb(); } },
  deleteRow(rowNumber) { rows.splice(rowNumber - 1, 1); },
  getRange(rowNumber, columnNumber) { return {
    setValue(value) { rows[rowNumber - 1][columnNumber - 1] = value; },
    setValues(values) { values.forEach((value, index) => { rows[rowNumber - 1 + index] = value.slice(); }); }
  }; }
}]));
const ss = { getSheetByName(name) { return sheetObjects[name] || null; } };
let examMutationLockAvailable = true, examMutationLockHeld = false, examMutationLockAcquires = 0, examMutationLockReleases = 0, examMutationBeforeAcquire = null, examSubmissionDuringAppend = null;
const runtime = {
  SPREADSHEET_ID: "LOCAL", EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new WeakMap(),
  PUBLIC_ACTIONS: [], ROLE_PERMISSIONS: { Profesor: ["getAllExams","getTeacherExamActivity","getStudentExams","getExamQuestions","updateExam","updateExamStatus","deleteExam","gradeExamSubmission","deleteExamSubmission"], Estudiante: ["getStudentExams","getExamQuestions","getExamResult","submitExam"], Tutor: ["getStudentExams","getExamQuestions","getExamResult"] },
  getDynamicPermissionsForRole() { return null; }, hasActiveDelegationForAction() { return false; },
  validateContextualAccess() { return { authorized: true }; },
  verifySessionToken(token) { return claims[token] || null; },
  PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "I1" : null; } }; } },
  SpreadsheetApp: { openById() { return ss; } },
  getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("Missing sheet " + name); return sheet; },
  isInTeacherList(value, filter) { return String(value).trim() === String(filter).trim(); },
  normalizeString(value) { return String(value || "").trim().toLowerCase(); },
  LockService: { getScriptLock() { return {
    tryLock() { examMutationLockAcquires++; if (examMutationBeforeAcquire) { const cb = examMutationBeforeAcquire; examMutationBeforeAcquire = null; cb(); } if (!examMutationLockAvailable || examMutationLockHeld) return false; examMutationLockHeld = true; return true; },
    releaseLock() { examMutationLockReleases++; examMutationLockHeld = false; }
  }; } }
};
const helpers = ["getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "assertExamResourceOwnershipForScope_", "validateRolePermission", "getAllExams", "getTeacherExamActivity"].map(name => extractFunction(source, name)).join("\n");
vm.runInNewContext(helpers + "\nthis.getAllExams = getAllExams; this.getTeacherExamActivity = getTeacherExamActivity; this.validateRolePermission = validateRolePermission; this.getVerifiedExamDepartmentScope_ = getVerifiedExamDepartmentScope_; this.assertExamResourceOwnershipForScope_ = assertExamResourceOwnershipForScope_;", runtime);
const payload = { sessionToken: "teacher-token", profesorId: "TEACHER-2" };
const list = runtime.getAllExams(payload);
assert.deepEqual(Array.from(list.data, row => row.examenId), ["EXM-1", "EXM-6"], "teacher list uses signed identity and department ownership; client profesorId is ignored");
assert.equal(payload._verifiedUserId, "TEACHER-1");
const activity = runtime.getTeacherExamActivity({ sessionToken: "teacher-token", profesorId: "TEACHER-2" });
assert.deepEqual(Array.from(activity.data, row => row.entregaId), ["DEL-1"], "teacher activity is limited to owned exams");
const directorList = runtime.getAllExams({ sessionToken: "director-token" });
assert.deepEqual(Array.from(directorList.data, row => row.examenId), ["EXM-1", "EXM-2", "EXM-3", "EXM-6"], "institution-wide role sees unique owned resources in its institution");
const scope = runtime.getVerifiedExamDepartmentScope_({ sessionToken: "teacher-token" }, ss);
const cross = runtime.assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", "EXM-2", "READ", {});
assert.equal(cross.authorized, false); assert.equal(cross.code, "RESOURCE_SCOPE_DENIED");
const missing = runtime.assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", "UNKNOWN", "READ", {});
assert.equal(missing.authorized, false); assert.equal(missing.code, "RESOURCE_OWNERSHIP_UNVERIFIED");
const duplicate = runtime.assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", "EXM-5", "READ", {});
assert.equal(duplicate.authorized, false); assert.equal(duplicate.code, "RESOURCE_OWNERSHIP_AMBIGUOUS");
assert.deepEqual(Array.from(runtime.getAllExams({ sessionToken: "other-token" }).data), [], "no accessible ownership returns an empty list");
const readFunctions = ["getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "assertExamResourceOwnershipForScope_",
  "getExamStudentProfile_", "isExamAssignedToStudent_", "getVerifiedGuardianStudentIds_", "getExamReadContext_", "withAuthorizedExamRead_", "getAuthorizedExamReadContext_", "getStudentExams", "getStudentExamsUnlocked_", "getExamQuestions", "getExamQuestionsUnlocked_", "getExamResult", "withAuthorizedExamResultRead_", "getAuthorizedExamResultReadContext_", "getExamResultUnlocked_", "submitExam", "submitExamUnlocked_",
  "validateRolePermission", "getAuthorizedExamMutationContext_", "withAuthorizedExamMutation_", "getAuthorizedExamSubmissionMutationContext_", "withAuthorizedExamSubmissionMutation_", "updateExam", "updateExamUnlocked_", "updateExamStatus", "updateExamStatusUnlocked_", "deleteExam", "deleteExamUnlocked_", "gradeExamSubmission", "deleteExamSubmission"]
  .map(name => extractFunction(source, name)).join("\n");
vm.runInNewContext(readFunctions + "\nthis.getStudentExams = getStudentExams; this.getExamQuestions = getExamQuestions; this.getExamResult = getExamResult; this.submitExam = submitExam; " +
  "this.updateExam = updateExam; this.updateExamStatus = updateExamStatus; this.deleteExam = deleteExam; " +
  "this.gradeExamSubmission = gradeExamSubmission; this.deleteExamSubmission = deleteExamSubmission;", runtime);
const studentListPayload = { sessionToken: "student-token", userId: "STUDENT-2", grado: "99", seccion: "Z" };
const studentList = runtime.getStudentExams(studentListPayload);
assert.deepEqual(Array.from(studentList.data, row => row.examenId), ["EXM-1"],
  "student listing derives user, grade and section from verified account data and filters department ownership");
assert.equal(studentListPayload._verifiedUserId, "STUDENT-1");
assert.throws(() => runtime.getExamQuestions({ sessionToken: "student-token", examenId: "EXM-2" }),
  /RESOURCE_NOT_AVAILABLE/, "student cannot read questions from another department");
assert.equal(runtime.getExamQuestions({ sessionToken: "student-token", examenId: "EXM-1" }).data.preguntas.length, 1);
assert.throws(() => runtime.getExamResult({ sessionToken: "student-token", entregaExamenId: "DEL-2" }),
  /RESOURCE_NOT_AVAILABLE/, "student cannot read another student's result");
assert.equal(runtime.getExamResult({ sessionToken: "student-token", entregaExamenId: "DEL-1" }).data.calificacionTotal, 90);
const guardianList = runtime.getStudentExams({ sessionToken: "tutor-token", studentId: "STUDENT-1" });
assert.deepEqual(Array.from(guardianList.data, row => row.examenId), ["EXM-1"],
  "guardian reads are limited to a student with an active verified family link");
assert.throws(() => runtime.getStudentExams({ sessionToken: "tutor-token", studentId: "STUDENT-2" }),
  /RESOURCE_NOT_AVAILABLE/, "guardian cannot substitute an unrelated student ID");
assert.equal(runtime.getExamQuestions({ sessionToken: "tutor-token", studentId: "STUDENT-1", examenId: "EXM-1" }).data.preguntas.length, 1);
assert.equal(runtime.getExamResult({ sessionToken: "tutor-token", entregaExamenId: "DEL-1" }).data.calificacionTotal, 90);
assert.throws(() => runtime.getExamResult({ sessionToken: "tutor-token", entregaExamenId: "DEL-2" }),
  /RESOURCE_NOT_AVAILABLE/, "guardian cannot read a result for an unrelated student");
const submitLockAcquiresBeforeDeniedRole = examMutationLockAcquires;
assert.throws(() => runtime.submitExam({ sessionToken: "tutor-token", examenId: "EXM-6",
  respuestas: [{ preguntaId: "Q-6", respuestaEstudiante: "A" }] }), /RESOURCE_NOT_AVAILABLE/,
  "submitExam rejects a role without effective permission when invoked directly");
assert.equal(examMutationLockAcquires, submitLockAcquiresBeforeDeniedRole,
  "submitExam checks RBAC before acquiring the mutation lock");
const crossExamSubmission = { sessionToken: "student3-token", examenId: "EXM-2", userId: "STUDENT-1", respuestas: [{ preguntaId: "Q-2", respuestaEstudiante: "B" }] };
assert.throws(() => runtime.submitExam(crossExamSubmission), /RESOURCE_NOT_AVAILABLE/,
  "student cannot submit an exam outside their department scope");
assert.throws(() => runtime.submitExam({ sessionToken: "student3-token", examenId: "EXM-6", userId: "STUDENT-1",
  respuestas: [{ preguntaId: "Q-2", respuestaEstudiante: "B" }] }), /SUBMISSION_INVALID/,
  "submission cannot include a question from another exam");
const newSubmission = runtime.submitExam({ sessionToken: "student3-token", examenId: "EXM-6", userId: "STUDENT-1",
  respuestas: [{ preguntaId: "Q-6", respuestaEstudiante: "A" }] });
assert.equal(newSubmission.status, "success");
const savedDelivery = deliveryRows.find(row => row[0] === newSubmission.data.entregaExamenId);
assert.equal(savedDelivery[2], "STUDENT-3", "submission owner is derived from signed identity, not payload userId");
assert.equal(newSubmission.data.calificacion, "100.00");
assert.throws(() => runtime.submitExam({ sessionToken: "student3-token", examenId: "EXM-6",
  respuestas: [{ preguntaId: "Q-6", respuestaEstudiante: "A" }] }), /EXAM_ATTEMPTS_EXHAUSTED/,
  "default one-attempt policy prevents duplicate submissions");

examRows.push(["EXM-8", "Concurrent submission", "Historia", "11", "A", "", "", "Activo", "TEACHER-1", "P1", "", "", "1"]);
ownershipRows.push(["OWN-8", "I1", "EXAMEN", "EXM-8", "D1", "ACTIVE", "TEACHER-1", "", ""]);
questionRows.push(["Q-8", "EXM-8", "opcion_multiple", "Pregunta concurrente", "{}", "A"]);
const beforeConcurrentAttempts = deliveryRows.filter(row => row[1] === "EXM-8" && row[2] === "STUDENT-3").length;
let nestedSubmissionError = "";
examSubmissionDuringAppend = () => {
  try {
    runtime.submitExam({ sessionToken: "student3-token", examenId: "EXM-8",
      respuestas: [{ preguntaId: "Q-8", respuestaEstudiante: "A" }] });
  } catch (error) { nestedSubmissionError = error.message; }
};
const serializedSubmission = runtime.submitExam({ sessionToken: "student3-token", examenId: "EXM-8",
  respuestas: [{ preguntaId: "Q-8", respuestaEstudiante: "A" }] });
assert.equal(serializedSubmission.status, "success");
assert.equal(nestedSubmissionError, "EXAM_SUBMISSION_LOCK_TIMEOUT",
  "a concurrent submit cannot pass the attempt-count check while another submission is appending");
assert.equal(deliveryRows.filter(row => row[1] === "EXM-8" && row[2] === "STUDENT-3").length,
  beforeConcurrentAttempts + 1, "only one concurrent submission is persisted");
assert.equal(examMutationLockHeld, false, "submission lock is released after successful append");


const beforeTitle = examRows.find(row => row[0] === "EXM-1")[1];
runtime.updateExam({ sessionToken: "teacher-token", examenId: "EXM-1", titulo: "Título actualizado", profesorId: "TEACHER-2" });
assert.equal(examRows.find(row => row[0] === "EXM-1")[1], "Título actualizado", "teacher can update own exam in assigned department");
assert.throws(() => runtime.updateExam({ sessionToken: "teacher-token", examenId: "EXM-2", titulo: "Cross department" }),
  /RESOURCE_NOT_AVAILABLE/, "teacher cannot update an exam in another department");
assert.throws(() => runtime.updateExam({ sessionToken: "teacher-token", examenId: "EXM-3", titulo: "Other teacher" }),
  /RESOURCE_NOT_AVAILABLE/, "teacher cannot update another teacher's exam");
runtime.updateExamStatus({ sessionToken: "teacher-token", examenId: "EXM-1", estado: "Inactivo" });
assert.equal(examRows.find(row => row[0] === "EXM-1")[7], "Inactivo");
assert.throws(() => runtime.updateExamStatus({ sessionToken: "teacher-token", examenId: "EXM-1", estado: "Publicado" }),
  /EXAM_STATUS_INVALID/, "exam status only accepts supported active/inactive values");
runtime.gradeExamSubmission({ sessionToken: "teacher-token", entregaId: "DEL-1", calificacion: 95, estado: "Calificado", comentario: "Revisado" });
assert.equal(deliveryRows.find(row => row[0] === "DEL-1")[5], 95, "teacher can grade a submission for own exam");
assert.throws(() => runtime.gradeExamSubmission({ sessionToken: "teacher-token", entregaId: "DEL-2", calificacion: 0 }),
  /RESOURCE_NOT_AVAILABLE/, "teacher cannot grade a submission belonging to another department");
assert.throws(() => runtime.gradeExamSubmission({ sessionToken: "teacher-token", entregaId: "DEL-1", examenId: "EXM-2", calificacion: 0 }),
  /RESOURCE_NOT_AVAILABLE/, "delivery/exam ID mismatch is rejected");
runtime.deleteExam({ sessionToken: "teacher-token", examenId: "EXM-1" });
assert.equal(examRows.find(row => row[0] === "EXM-1")[7], "Inactivo", "exam with submissions is deactivated, not removed");
assert.equal(ownershipRows.find(row => row[3] === "EXM-1")[5], "ACTIVE", "ownership remains active while prior submissions exist");
runtime.deleteExamSubmission({ sessionToken: "teacher-token", entregaId: "DEL-1" });
assert.equal(deliveryRows.some(row => row[0] === "DEL-1"), false, "teacher can delete submission for own exam");
assert.throws(() => runtime.deleteExamSubmission({ sessionToken: "teacher-token", entregaId: "DEL-2" }),
  /RESOURCE_NOT_AVAILABLE/, "teacher cannot delete a submission from another department");
examRows.push(["EXM-7", "Sin entregas", "Matemáticas", "10", "A", "", "", "Activo", "TEACHER-1", "P1"]);
ownershipRows.push(["OWN-8", "I1", "EXAMEN", "EXM-7", "D1", "ACTIVE", "TEACHER-1", "", ""]);
runtime.deleteExam({ sessionToken: "teacher-token", examenId: "EXM-7" });
assert.equal(examRows.find(row => row[0] === "EXM-7")[7], "Eliminado", "exam without submissions uses logical deletion");
assert.equal(ownershipRows.find(row => row[3] === "EXM-7")[5], "INACTIVE", "logical deletion deactivates resource ownership");
assert.throws(() => runtime.deleteExam({ sessionToken: "teacher-token", examenId: "EXM-2" }),
  /RESOURCE_NOT_AVAILABLE/, "teacher cannot delete an exam outside assigned scope");

examRows.push(["EXM-9", "Stale row target", "Historia", "11", "A", "", "", "Activo", "TEACHER-1", "P1"]);
examRows.push(["EXM-10", "Following row", "Historia", "11", "A", "", "", "Activo", "TEACHER-1", "P1"]);
ownershipRows.push(["OWN-9", "I1", "EXAMEN", "EXM-9", "D1", "ACTIVE", "TEACHER-1", "", ""]);
ownershipRows.push(["OWN-10", "I1", "EXAMEN", "EXM-10", "D1", "ACTIVE", "TEACHER-1", "", ""]);
examMutationBeforeAcquire = () => {
  const staleIndex = examRows.findIndex(row => row[0] === "EXM-9");
  if (staleIndex >= 0) examRows.splice(staleIndex, 1);
};
assert.throws(() => runtime.updateExamStatus({ sessionToken: "teacher-token", examenId: "EXM-9", estado: "Inactivo" }),
  /RESOURCE_NOT_AVAILABLE/, "exam context is re-read under lock after a concurrent deletion");
assert.equal(examRows.find(row => row[0] === "EXM-10")[7], "Activo",
  "a stale row index cannot mutate the following exam after concurrent deletion");
const statusBeforeTimeout = examRows.find(row => row[0] === "EXM-10")[7];
examMutationLockAvailable = false;
assert.throws(() => runtime.updateExamStatus({ sessionToken: "teacher-token", examenId: "EXM-10", estado: "Inactivo" }),
  /EXAM_MUTATION_LOCK_TIMEOUT/, "exam mutations fail closed when lock acquisition times out");
assert.equal(examRows.find(row => row[0] === "EXM-10")[7], statusBeforeTimeout);
examMutationLockAvailable = true;



assert.ok(examMutationLockAcquires >= 4, "submission mutations acquire lock");
assert.equal(examMutationLockAcquires, examMutationLockReleases + 2, "only the nested submit and contended exam mutation fail before acquiring a lock");
deliveryRows.push(["DEL-RACE","EXM-1","STUDENT-1",new Date(),"[]",50,"Entregado",""]);
examMutationBeforeAcquire = () => { const i=deliveryRows.findIndex(row=>row[0]==="DEL-RACE"); if(i>=0)deliveryRows.splice(i,1); };
assert.throws(()=>runtime.gradeExamSubmission({sessionToken:"teacher-token",entregaId:"DEL-RACE",calificacion:100}),/RESOURCE_NOT_AVAILABLE/);
assert.equal(deliveryRows.some(row=>row[0]==="DEL-RACE"),false);
const beforeContendedGrade=deliveryRows.find(row=>row[0]==="DEL-2")[5];
examMutationLockAvailable=false;
assert.throws(()=>runtime.gradeExamSubmission({sessionToken:"teacher-token",entregaId:"DEL-2",calificacion:0}),/EXAM_SUBMISSION_LOCK_TIMEOUT/);
assert.equal(deliveryRows.find(row=>row[0]==="DEL-2")[5],beforeContendedGrade);
examMutationLockAvailable=true;

process.stdout.write("exam-service-departmental-access: signed identity, department scope, tenant isolation and ownership assertions passed\n");
