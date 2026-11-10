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
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

for (const name of ["updateExamStatus", "updateExam", "deleteExam", "gradeExamSubmission", "deleteExamSubmission"]) {
  const declarations = source.match(new RegExp("function\\s+" + name + "\\s*\\(", "g")) || [];
  assert.equal(declarations.length, 1, name + " must have exactly one active function declaration");
  const handler = extractFunction(source, name);
  const isSubmissionMutation = name === "gradeExamSubmission" || name === "deleteExamSubmission";
  const isExamMetadataMutation = name === "updateExamStatus" || name === "updateExam" || name === "deleteExam";
  const guard = isSubmissionMutation ? "withAuthorizedExamSubmissionMutation_" : (isExamMetadataMutation ? "withAuthorizedExamMutation_" : "getAuthorizedExamMutationContext_");
  assert.ok(handler.includes(guard), name + " must enforce identity, action permission, resource ownership and scope");
  if (isSubmissionMutation) {
    assert.ok(extractFunction(source, "withAuthorizedExamSubmissionMutation_").includes("getAuthorizedExamSubmissionMutationContext_"),
      name + " wrapper must revalidate identity, action permission, resource ownership and scope under lock");
  }
  if (isExamMetadataMutation) {
    assert.ok(extractFunction(source, "withAuthorizedExamMutation_").includes("getAuthorizedExamMutationContext_"),
      name + " wrapper must revalidate identity, action permission, resource ownership and scope under lock");
  }
}

const publicActionsSource = source.match(/const PUBLIC_ACTIONS = \[[\s\S]*?\];/);
assert.ok(publicActionsSource, "PUBLIC_ACTIONS declaration exists");
const publicActions = vm.runInNewContext(publicActionsSource[0] + "\nPUBLIC_ACTIONS");
assert.equal(publicActions.includes("getAllExams"), false, "exam listings must not bypass authentication");
assert.equal(publicActions.includes("getStudentExams"), false, "student exam listings must not bypass authentication");

const claims = {
  "teacher-session": { userId: "TEACHER-1", role: "Profesor" },
  "student-session": { userId: "STUDENT-1", role: "Estudiante" },
  "admin-session": { userId: "ADMIN-1", role: "Administrador" }
};
const examRows = [
  ["EXM-1", "Examen propio", "Matemáticas", "10", "A", "", "", "Activo", "TEACHER-1", "Primer Parcial"],
  ["EXM-2", "Examen ajeno", "Ciencias", "10", "B", "", "", "Activo", "TEACHER-2", "Primer Parcial"]
];
const scopeRows = [
  ["AssignmentID", "UserID", "RoleID", "ScopeType", "ScopeValues", "Status", "", "", "StartAt", "EndAt"],
  ["ASG-1", "TEACHER-1", "Profesor", "DEPARTAMENTO", "D1", "ACTIVO", "", "", "", ""],
  ["ASG-2", "ADMIN-1", "Administrador", "INSTITUCION", "I1", "ACTIVO", "", "", "", ""]
];
const ownershipRows = [
  ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
  ["OWN-1", "I1", "EXAMEN", "EXM-1", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-2", "I1", "EXAMEN", "EXM-2", "D2", "ACTIVE", "TEACHER-2", "", ""]
];
const sheets = {
  Examenes: { getDataRange() { return { getValues: () => [["ID"], ...examRows].map(row => row.slice()) }; } },
  AsignacionesAmbitosRoles: { getDataRange() { return { getValues: () => scopeRows.map(row => row.slice()) }; } },
  ResourceOwnership: { getDataRange() { return { getValues: () => ownershipRows.map(row => row.slice()) }; } }
};
const ss = { getSheetByName(name) { return sheets[name] || null; } };
const runtime = {
  SPREADSHEET_ID: "LOCAL",
  PUBLIC_ACTIONS: publicActions,
  ROLE_PERMISSIONS: {
    Profesor: ["getAllExams"],
    Estudiante: ["getStudentExams"]
  },
  EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new WeakMap(),
  verifySessionToken(token) { return claims[token] || null; },
  getDynamicPermissionsForRole() { return null; },
  hasActiveDelegationForAction() { return false; },
  Logger: { log() {} },
  PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "I1" : null; } }; } },
  SpreadsheetApp: { openById() { return ss; } },
  getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("Missing sheet " + name); return sheet; }
};
const contextual = extractFunction(source, "validateContextualAccess");
const permission = extractFunction(source, "validateRolePermission");
vm.runInNewContext(contextual + "\n" + permission +
  "\nthis.validate = validateRolePermission;", runtime);

for (const action of ["getAllExams", "getStudentExams"]) {
  assert.equal(runtime.validate(action, {}).authorized, false, action + " rejects missing session");
  assert.equal(runtime.validate(action, { sessionToken: "invalid" }).authorized, false, action + " rejects invalid session");
}
const teacherPayload = { sessionToken: "teacher-session", userId: "ATTACKER" };
assert.equal(runtime.validate("getAllExams", teacherPayload).authorized, true);
assert.equal(teacherPayload._verifiedUserId, "TEACHER-1", "identity is derived from signed claims");
assert.equal(teacherPayload.userId, "ATTACKER", "client value remains untrusted and is not promoted");
const ownStudent = { sessionToken: "student-session", userId: "STUDENT-1" };
assert.equal(runtime.validate("getStudentExams", ownStudent).authorized, true);
const otherStudent = { sessionToken: "student-session", userId: "STUDENT-2" };
assert.equal(runtime.validate("getStudentExams", otherStudent).authorized, false, "student cannot request another student's exams");

const helpers = ["getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "assertExamResourceOwnershipForScope_", "getAllExams"]
  .map(name => extractFunction(source, name)).join("\n");
vm.runInNewContext(helpers + "\nthis.getAllExams = getAllExams;", runtime);
const teacherExamList = runtime.getAllExams({
  sessionToken: "teacher-session",
  _verifiedUserId: "ATTACKER",
  _verifiedRole: "Profesor",
  profesorId: "TEACHER-2"
});
assert.deepEqual(Array.from(teacherExamList.data, row => row.examenId), ["EXM-1"],
  "teacher listing uses signed identity and department ownership, ignoring payload identity");
assert.throws(() => runtime.getAllExams({ profesorId: "TEACHER-1" }),
  /RESOURCE_NOT_AVAILABLE/, "exam listing requires verified identity context");
const adminExamList = runtime.getAllExams({ sessionToken: "admin-session" });
assert.deepEqual(Array.from(adminExamList.data, row => row.examenId), ["EXM-1", "EXM-2"],
  "institution-wide administrative scope retains access to owned resources");

const creationClaims = { "teacher-session": { userId: "TEACHER-1", role: "Profesor" },
  "admin-session": { userId: "ADMIN-1", role: "Administrador" } };
function makeSheet(rows, failSetValues) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) { this.rows.push(row.slice()); },
    deleteRow(rowNumber) { this.rows.splice(rowNumber - 1, 1); },
    getRange(row, col, numRows, numCols) {
      return { setValues: values => {
        if (failSetValues) throw new Error("synthetic question write failure");
        values.forEach((value, index) => { this.rows[row - 1 + index] = value.slice(); });
      } };
    }
  };
}
function makeCreationRuntime(options) {
  const creationSheets = {
    Examenes: makeSheet([["ExamenID","Titulo","Asignatura","Grado","Seccion","FechaLimite","TiempoLimite","Estado","ProfesorID","Parcial"]]),
    PreguntasExamen: makeSheet([["PreguntaID","ExamenID","Tipo","Texto","OpcionesJSON","RespuestaCorrecta"]], options && options.failQuestions),
    ResourceOwnership: makeSheet([["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"]]),
    AsignacionesAmbitosRoles: makeSheet([
      ["AssignmentID","UserID","RoleID","ScopeType","ScopeValues","Status","","","StartAt","EndAt"],
      ["ASG-TEACHER","TEACHER-1","Profesor","DEPARTAMENTO","D1","ACTIVO","","","",""],
      ["ASG-ADMIN","ADMIN-1","Administrador","INSTITUCION","I1","ACTIVO","","","",""]
    ])
  };
  if (options && options.badOwnershipSchema) creationSheets.ResourceOwnership.rows[0][4] = "WrongHeader";
  let uuid = 0;
  const context = {
    SPREADSHEET_ID: "LOCAL",
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new WeakMap(),
    verifySessionToken(token) { return creationClaims[token] || null; },
    PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "I1" : null; } }; } },
    SpreadsheetApp: { openById() { return { getSheetByName(name) { return creationSheets[name] || null; } }; } },
    getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("Missing sheet " + name); return sheet; },
    LockService: { getScriptLock() { return { tryLock() { return true; }, releaseLock() {} }; } },
    Utilities: { getUuid() { uuid++; return "UUID-" + uuid; } }
  };
  const functions = ["getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "createExam"]
    .map(name => extractFunction(source, name)).join("\n");
  vm.runInNewContext(functions + "\nthis.createExam = createExam;", context);
  return { context, sheets: creationSheets };
}
const creation = makeCreationRuntime();
const created = creation.context.createExam({ sessionToken: "teacher-session", titulo: "Prueba", asignatura: "Matemáticas",
  gradoAsignado: "10", seccionAsignada: "A", profesorId: "ATTACKER",
  preguntas: [{ preguntaTipo: "opcion_multiple", textoPregunta: "¿2+2?", opciones: { A: "4" }, respuestaCorrecta: "A" }] });
assert.equal(created.status, "success");
assert.equal(creation.sheets.Examenes.rows.length, 2);
assert.equal(creation.sheets.Examenes.rows[1][8], "TEACHER-1", "exam creator comes from signed identity, not payload profesorId");
assert.equal(creation.sheets.ResourceOwnership.rows.length, 2);
assert.equal(creation.sheets.ResourceOwnership.rows[1][1], "I1");
assert.equal(creation.sheets.ResourceOwnership.rows[1][2], "EXAMEN");
assert.equal(creation.sheets.ResourceOwnership.rows[1][3], created.examenId);
assert.equal(creation.sheets.ResourceOwnership.rows[1][4], "D1", "single authorized department is assigned explicitly");
assert.equal(creation.sheets.ResourceOwnership.rows[1][6], "TEACHER-1");
assert.equal(creation.sheets.PreguntasExamen.rows[1][1], created.examenId);
assert.throws(() => creation.context.createExam({ sessionToken: "teacher-session", departmentId: "D2", titulo: "Spoof" }),
  /RESOURCE_SCOPE_DENIED/, "client cannot assign an exam to a department outside the signed scope");
assert.equal(creation.sheets.Examenes.rows.length, 2, "rejected department does not persist an exam");
const rollback = makeCreationRuntime({ failQuestions: true });
assert.throws(() => rollback.context.createExam({ sessionToken: "teacher-session", titulo: "Rollback",
  preguntas: [{ preguntaTipo: "opcion_multiple", textoPregunta: "Q", opciones: {}, respuestaCorrecta: "A" }] }),
  /synthetic question write failure/);
assert.equal(rollback.sheets.Examenes.rows.length, 1, "failed creation compensates the exam row");
assert.equal(rollback.sheets.ResourceOwnership.rows.length, 1, "failed creation compensates its ownership row");
assert.equal(rollback.sheets.PreguntasExamen.rows.length, 1, "failed creation leaves no question rows");
const badSchema = makeCreationRuntime({ badOwnershipSchema: true });
assert.throws(() => badSchema.context.createExam({ sessionToken: "teacher-session", titulo: "No ownership" }),
  /RESOURCE_OWNERSHIP_SCHEMA_INVALID/);
assert.equal(badSchema.sheets.Examenes.rows.length, 1, "invalid ownership schema fails before exam persistence");
const institutionOnly = makeCreationRuntime();
assert.throws(() => institutionOnly.context.createExam({ sessionToken: "admin-session", departmentId: "D1", titulo: "No department grant" }),
  /RESOURCE_SCOPE_DENIED/, "institution-wide access alone does not authorize choosing an unassigned department");

const submitHandler = extractFunction(source, "submitExam");
const submitWorker = extractFunction(source, "submitExamUnlocked_");
assert.ok(submitHandler.includes("LockService.getScriptLock()"), "submitExam serializes attempt validation and persistence");
assert.ok(submitHandler.includes("tryLock(5000)"), "submitExam uses bounded lock acquisition");
assert.ok(submitHandler.includes("submitExamUnlocked_(payload)"), "submitExam executes validation and append under lock");
assert.ok(submitHandler.includes("finally") && submitHandler.includes("releaseLock()"), "submitExam releases lock on success and failure");
assert.ok(submitWorker.includes("previousAttempts >= allowedAttempts"), "attempt limit is checked inside the locked worker");
assert.ok(submitWorker.includes("deliveriesSheet.appendRow"), "delivery persistence is inside the locked worker");
const questionBankHandler = extractFunction(source, "manageQuestionBank");
assert.ok(questionBankHandler.includes("withAuthorizedQuestionBankMutation_"), "manageQuestionBank delegates to the serialized authorization wrapper");
const questionBankWrapper = extractFunction(source, "withAuthorizedQuestionBankMutation_");
assert.ok(questionBankWrapper.includes("LockService.getScriptLock()") && questionBankWrapper.includes("tryLock(5000)"),
  "question bank writes use a bounded script lock");
assert.ok(questionBankWrapper.includes("getAuthorizedQuestionBankMutationContext_(payload)"),
  "question bank identity, permission and ownership are resolved after lock acquisition");
const questionBankContext = extractFunction(source, "getAuthorizedQuestionBankMutationContext_");
assert.ok(questionBankContext.includes('validateRolePermission("manageQuestionBank", payload)'),
  "question bank mutation revalidates its RBAC action");
assert.ok(questionBankContext.includes('assertExamResourceOwnershipForScope_(ss, scope, "BANCO_PREGUNTA"'),
  "question bank update/delete require institution and department ownership");
assert.ok(questionBankContext.includes("departmentAllowed"),
  "question bank creation is restricted to a department in the verified scope");
const questionBankWorker = extractFunction(source, "manageQuestionBankUnlocked_");
assert.ok(questionBankWorker.includes("ownershipSheet.appendRow") && questionBankWorker.includes('"BANCO_PREGUNTA"'),
  "question bank creation persists ownership together with the question");
const questionBankRead = extractFunction(source, "getQuestionBank");
assert.ok(questionBankRead.includes("withAuthorizedQuestionBankRead_"),
  "question bank reads delegate to the serialized reader");
const questionBankReadWrapper = extractFunction(source, "withAuthorizedQuestionBankRead_");
assert.ok(questionBankReadWrapper.includes("LockService.getScriptLock()") &&
  questionBankReadWrapper.includes("tryLock(5000)") &&
  questionBankReadWrapper.includes("getAuthorizedQuestionBankReadContext_(payload)"),
  "question bank reads share the mutation lock and load their context after acquisition");
const questionBankReadContext = extractFunction(source, "getAuthorizedQuestionBankReadContext_");
assert.ok(questionBankReadContext.includes('validateRolePermission("getQuestionBank", p)'),
  "question bank reads require the explicit RBAC action permission");
assert.ok(questionBankReadContext.includes("getVerifiedExamIdentity_(p)") &&
  questionBankReadContext.includes("getVerifiedExamDepartmentScope_(p, ss, actor)"),
  "question bank reads derive identity and department scope from signed claims");
assert.ok(questionBankReadContext.includes('validateRolePermission("manageQuestionBank", p)') &&
  questionBankReadContext.includes("canReadAnswerKey"),
  "answer-key visibility is derived from the separate manage permission");
const questionBankReadWorker = extractFunction(source, "getQuestionBankUnlocked_");
assert.ok(questionBankReadWorker.includes('assertExamResourceOwnershipForScope_(context.ss, context.scope, "BANCO_PREGUNTA"') &&
  questionBankReadWorker.includes("bankIdCounts[resourceId] !== 1"),
  "question bank reads exclude resources without unique institution/department ownership and ambiguous IDs");
const examMutationNames = ["updateExam", "updateExamStatus", "deleteExam"];
examMutationNames.forEach(name => {
  const handler = extractFunction(source, name);
  assert.ok(handler.includes("withAuthorizedExamMutation_"), name + " delegates to the locked authorization wrapper");
});
const examMutationWrapper = extractFunction(source, "withAuthorizedExamMutation_");
assert.ok(examMutationWrapper.includes("LockService.getScriptLock()"), "exam metadata mutations share the script lock");
assert.ok(examMutationWrapper.includes("tryLock(5000)"), "exam metadata lock acquisition is bounded");
assert.ok(examMutationWrapper.includes("getAuthorizedExamMutationContext_(payload, action)"), "exam authorization/context is revalidated after lock acquisition");
assert.ok(examMutationWrapper.includes("finally") && examMutationWrapper.includes("releaseLock()"), "exam metadata lock is always released");

const examResultHandler = extractFunction(source, "getExamResult");
const examResultWrapper = extractFunction(source, "withAuthorizedExamResultRead_");
const examResultContext = extractFunction(source, "getAuthorizedExamResultReadContext_");
const examResultWorker = extractFunction(source, "getExamResultUnlocked_");
assert.ok(examResultHandler.includes("withAuthorizedExamResultRead_"), "getExamResult delegates to the serialized reader");
assert.ok(examResultWrapper.includes("LockService.getScriptLock()") && examResultWrapper.includes("tryLock(5000)") &&
  examResultWrapper.includes("getAuthorizedExamResultReadContext_(payload)") && examResultWrapper.includes("finally") &&
  examResultWrapper.includes("releaseLock()"), "exam result reads share the script lock and release it on every acquired path");
assert.ok(examResultContext.includes('validateRolePermission("getExamResult", payload)') &&
  examResultContext.includes("getExamReadContext_(payload, requestedStudentId)"),
  "exam result read requires explicit action permission and derives student scope from the locked delivery");
assert.ok(examResultWorker.includes('String(delivery[6] || "") === "Pendiente"') &&
  examResultWorker.includes('assertExamResourceOwnershipForScope_') &&
  examResultWorker.includes('String(exam[8] || "").trim() !== actor.userId'),
  "exam result enforces grading state, exam ownership and teacher ownership before exposing answer keys");

process.stdout.write("exam-service-security-contract: authentication, identity, teacher ownership and serialized exam mutations assertions passed\\n");
