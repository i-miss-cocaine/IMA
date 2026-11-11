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

const examMutationLockWrapperContract = extractFunction(source, "withAuthorizedExamMutation_");
assert.ok(examMutationLockWrapperContract.indexOf("validateRolePermission(action, payload)") < examMutationLockWrapperContract.indexOf("LockService.getScriptLock()"),
  "exam metadata mutation wrapper must validate RBAC before requesting the shared lock");
assert.ok(examMutationLockWrapperContract.indexOf("getVerifiedExamIdentity_(payload)") < examMutationLockWrapperContract.indexOf("LockService.getScriptLock()"),
  "exam metadata mutation wrapper must validate signed identity before requesting the shared lock");
const examMutationContextContract = extractFunction(source, "getAuthorizedExamMutationContext_");
assert.ok(examMutationContextContract.includes("!String(actor.userId || \"\").trim()") &&
  examMutationContextContract.indexOf("getVerifiedExamIdentity_(payload)") < examMutationContextContract.indexOf("SpreadsheetApp.openById(SPREADSHEET_ID)"),
  "exam mutation context must reject an incomplete signed identity before opening Sheets");

function runExamMutationLockWrapper(options = {}, mutation = () => "ok") {
  const events = [];
  let permissionCalls = 0, identityCalls = 0;
  const sandbox = {
    validateRolePermission(action, payload) {
      events.push("permission:" + action);
      permissionCalls++;
      return { authorized: !(options.preflightPermissionDenied || (options.contextPermissionDenied && permissionCalls > 1)) };
    },
    getVerifiedExamIdentity_(payload) {
      events.push("identity");
      identityCalls++;
      return { authorized: !(options.preflightIdentityDenied || (options.contextIdentityDenied && identityCalls > 1)), userId: options.contextIdentityMissingUserId && identityCalls > 1 ? "   " : "actor-1" };
    },
    LockService: { getScriptLock() {
      events.push("lock-request");
      return {
        tryLock(timeout) { events.push("lock-acquire:" + timeout); return options.lockAvailable !== false; },
        releaseLock() { events.push("lock-release"); }
      };
    } },
    getAuthorizedExamMutationContext_(payload, action) {
      events.push("context:" + action);
      const permission = sandbox.validateRolePermission(action, payload);
      if (!permission.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
      const actor = sandbox.getVerifiedExamIdentity_(payload);
      if (!actor.authorized || !String(actor.userId || "").trim()) throw new Error("RESOURCE_NOT_AVAILABLE");
      return { actor, action };
    },
    runMutation(events, context) { events.push("mutation"); return mutation(events, context); }
  };
  vm.runInNewContext(examMutationLockWrapperContract + "\nthis.invokeExamMutationLockWrapper = withAuthorizedExamMutation_;", sandbox);
  try {
    return { result: sandbox.invokeExamMutationLockWrapper({ sessionToken: "synthetic" }, "updateExam", context => sandbox.runMutation(events, context)), events };
  } catch (error) {
    return { error: error.message, events };
  }
}

let lockWrapperResult = runExamMutationLockWrapper({ preflightPermissionDenied: true });
assert.equal(lockWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(lockWrapperResult.events, ["permission:updateExam"], "RBAC denial must precede lock acquisition");
lockWrapperResult = runExamMutationLockWrapper({ preflightIdentityDenied: true });
assert.equal(lockWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(lockWrapperResult.events, ["permission:updateExam", "identity"], "invalid identity must precede lock acquisition");
lockWrapperResult = runExamMutationLockWrapper({}, events => { events.push("write"); return "saved"; });
assert.equal(lockWrapperResult.result, "saved");
assert.deepEqual(lockWrapperResult.events, [
  "permission:updateExam", "identity", "lock-request", "lock-acquire:5000",
  "context:updateExam", "permission:updateExam", "identity", "mutation", "write", "lock-release"
], "authorized mutation must revalidate context under lock and release it");
lockWrapperResult = runExamMutationLockWrapper({ contextPermissionDenied: true });
assert.equal(lockWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(lockWrapperResult.events, [
  "permission:updateExam", "identity", "lock-request", "lock-acquire:5000",
  "context:updateExam", "permission:updateExam", "lock-release"
], "context RBAC must be rechecked under lock");
lockWrapperResult = runExamMutationLockWrapper({ contextIdentityMissingUserId: true });
assert.equal(lockWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(lockWrapperResult.events, [
  "permission:updateExam", "identity", "lock-request", "lock-acquire:5000",
  "context:updateExam", "permission:updateExam", "identity", "lock-release"
], "a signed identity that loses userId under the lock must be rejected before mutation and release the lock");
lockWrapperResult = runExamMutationLockWrapper({}, () => { throw new Error("synthetic write failure"); });
assert.equal(lockWrapperResult.error, "synthetic write failure");
assert.equal(lockWrapperResult.events.at(-1), "lock-release", "lock must release after mutation failure");
lockWrapperResult = runExamMutationLockWrapper({ lockAvailable: false });
assert.equal(lockWrapperResult.error, "EXAM_MUTATION_LOCK_TIMEOUT");
assert.deepEqual(lockWrapperResult.events, ["permission:updateExam", "identity", "lock-request", "lock-acquire:5000"],
  "lock timeout must occur only after preflight authorization");

const evaluationCategoryMutationWrapperContract = extractFunction(source, "withAuthorizedEvaluationCategoryMutation_");
assert.ok(evaluationCategoryMutationWrapperContract.indexOf('validateRolePermission("saveEvaluationCategory", payload)') < evaluationCategoryMutationWrapperContract.indexOf("LockService.getScriptLock()"),
  "evaluation category mutation wrapper must validate RBAC before requesting the shared lock");
assert.ok(evaluationCategoryMutationWrapperContract.indexOf("getVerifiedExamIdentity_(payload)") < evaluationCategoryMutationWrapperContract.indexOf("LockService.getScriptLock()"),
  "evaluation category mutation wrapper must validate signed identity before requesting the shared lock");
const evaluationCategoryMutationContextContract = extractFunction(source, "getAuthorizedEvaluationCategoryMutationContext_");
assert.ok(evaluationCategoryMutationContextContract.includes('validateRolePermission("saveEvaluationCategory", p)') &&
  evaluationCategoryMutationContextContract.includes("getVerifiedExamIdentity_(p)"),
  "category mutation context must revalidate action RBAC and signed identity");
assert.ok(evaluationCategoryMutationContextContract.includes("getVerifiedExamDepartmentScope_(p, ss, actor)") &&
  evaluationCategoryMutationContextContract.includes('assertExamResourceOwnershipForScope_(ss, scope, "CATEGORIA_EVALUACION"') &&
  evaluationCategoryMutationContextContract.includes("RESOURCE_OWNERSHIP_SCHEMA_INVALID"),
  "category mutation context must retain verified scope, ownership and ownership schema validation");

function runEvaluationCategoryMutationWrapper(options = {}, mutation = () => "ok") {
  const events = [];
  let permissionCalls = 0, identityCalls = 0;
  const sandbox = {
    validateRolePermission(action, payload) {
      events.push("permission:" + action);
      permissionCalls++;
      return { authorized: !(options.preflightPermissionDenied || (options.contextPermissionDenied && permissionCalls > 1)) };
    },
    getVerifiedExamIdentity_(payload) {
      events.push("identity");
      identityCalls++;
      return { authorized: !(options.preflightIdentityDenied || (options.contextIdentityDenied && identityCalls > 1)), userId: "actor-1" };
    },
    LockService: { getScriptLock() {
      events.push("lock-request");
      return {
        tryLock(timeout) { events.push("lock-acquire:" + timeout); return options.lockAvailable !== false; },
        releaseLock() { events.push("lock-release"); }
      };
    } },
    getAuthorizedEvaluationCategoryMutationContext_(payload) {
      events.push("context:saveEvaluationCategory");
      const permission = sandbox.validateRolePermission("saveEvaluationCategory", payload);
      if (!permission.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
      const actor = sandbox.getVerifiedExamIdentity_(payload);
      if (!actor.authorized || !String(actor.userId || "").trim()) throw new Error("RESOURCE_NOT_AVAILABLE");
      events.push("scope-ownership-schema-validation");
      return { actor };
    },
    runMutation(events, context) { events.push("mutation"); return mutation(events, context); }
  };
  vm.runInNewContext(evaluationCategoryMutationWrapperContract +
    "\nthis.invokeEvaluationCategoryMutation = withAuthorizedEvaluationCategoryMutation_;", sandbox);
  try {
    return { result: sandbox.invokeEvaluationCategoryMutation({ sessionToken: "synthetic" }, context => sandbox.runMutation(events, context)), events };
  } catch (error) {
    return { error: error.message, events };
  }
}

let categoryWrapperResult = runEvaluationCategoryMutationWrapper({ preflightPermissionDenied: true });
assert.equal(categoryWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(categoryWrapperResult.events, ["permission:saveEvaluationCategory"], "category RBAC denial must precede lock acquisition");
categoryWrapperResult = runEvaluationCategoryMutationWrapper({ preflightIdentityDenied: true });
assert.equal(categoryWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(categoryWrapperResult.events, ["permission:saveEvaluationCategory", "identity"], "invalid category actor must precede lock acquisition");
categoryWrapperResult = runEvaluationCategoryMutationWrapper({}, events => { events.push("write"); return "saved"; });
assert.equal(categoryWrapperResult.result, "saved");
assert.deepEqual(categoryWrapperResult.events, [
  "permission:saveEvaluationCategory", "identity", "lock-request", "lock-acquire:5000",
  "context:saveEvaluationCategory", "permission:saveEvaluationCategory", "identity",
  "scope-ownership-schema-validation", "mutation", "write", "lock-release"
], "authorized category mutation must revalidate scope and ownership under lock");
categoryWrapperResult = runEvaluationCategoryMutationWrapper({ contextPermissionDenied: true });
assert.equal(categoryWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(categoryWrapperResult.events, [
  "permission:saveEvaluationCategory", "identity", "lock-request", "lock-acquire:5000",
  "context:saveEvaluationCategory", "permission:saveEvaluationCategory", "lock-release"
], "category RBAC must be rechecked under lock");
categoryWrapperResult = runEvaluationCategoryMutationWrapper({}, () => { throw new Error("synthetic category write failure"); });
assert.equal(categoryWrapperResult.error, "synthetic category write failure");
assert.equal(categoryWrapperResult.events.at(-1), "lock-release", "category lock must release after mutation failure");
categoryWrapperResult = runEvaluationCategoryMutationWrapper({ lockAvailable: false });
assert.equal(categoryWrapperResult.error, "EVALUATION_CATEGORY_MUTATION_LOCK_TIMEOUT");
assert.deepEqual(categoryWrapperResult.events, [
  "permission:saveEvaluationCategory", "identity", "lock-request", "lock-acquire:5000"
], "category lock timeout must occur only after preflight authorization");


const rubricMutationWrapperContract = extractFunction(source, "withAuthorizedRubricMutation_");
assert.ok(rubricMutationWrapperContract.indexOf('validateRolePermission("saveRubric", payload)') < rubricMutationWrapperContract.indexOf("LockService.getScriptLock()"),
  "rubric mutation wrapper must validate RBAC before requesting the shared lock");
assert.ok(rubricMutationWrapperContract.indexOf("getVerifiedExamIdentity_(payload)") < rubricMutationWrapperContract.indexOf("LockService.getScriptLock()"),
  "rubric mutation wrapper must validate signed identity before requesting the shared lock");
const rubricMutationContextContract = extractFunction(source, "getAuthorizedRubricMutationContext_");
assert.ok(rubricMutationContextContract.includes('validateRolePermission("saveRubric", p)') &&
  rubricMutationContextContract.includes("getVerifiedExamIdentity_(p)") &&
  rubricMutationContextContract.includes("getVerifiedExamDepartmentScope_(p, ss, actor)") &&
  rubricMutationContextContract.includes('assertExamResourceOwnershipForScope_(ss, scope, "RUBRICA_EVALUACION"'),
  "rubric mutation context must revalidate RBAC, signed identity, department scope and resource ownership under lock");
assert.ok(extractFunction(source, "saveRubric").includes("withAuthorizedRubricMutation_"),
  "saveRubric must delegate to its serialized authorization wrapper");

function runRubricMutationWrapper(options = {}, mutation = () => "ok") {
  const events = [];
  let permissionCalls = 0, identityCalls = 0;
  const sandbox = {
    validateRolePermission(action, payload) {
      events.push("permission:" + action);
      permissionCalls++;
      return { authorized: !(options.preflightPermissionDenied || (options.contextPermissionDenied && permissionCalls > 1)) };
    },
    getVerifiedExamIdentity_(payload) {
      events.push("identity");
      identityCalls++;
      return { authorized: !(options.preflightIdentityDenied || (options.contextIdentityDenied && identityCalls > 1)), userId: "actor-1" };
    },
    LockService: { getScriptLock() {
      events.push("lock-request");
      return {
        tryLock(timeout) { events.push("lock-acquire:" + timeout); return options.lockAvailable !== false; },
        releaseLock() { events.push("lock-release"); }
      };
    } },
    getAuthorizedRubricMutationContext_(payload) {
      events.push("context:saveRubric");
      const permission = sandbox.validateRolePermission("saveRubric", payload);
      if (!permission.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
      const actor = sandbox.getVerifiedExamIdentity_(payload);
      if (!actor.authorized || !String(actor.userId || "").trim()) throw new Error("RESOURCE_NOT_AVAILABLE");
      events.push("scope-ownership-schema-validation");
      return { actor };
    },
    runMutation(events, context) { events.push("mutation"); return mutation(events, context); }
  };
  vm.runInNewContext(rubricMutationWrapperContract +
    "\nthis.invokeRubricMutation = withAuthorizedRubricMutation_;", sandbox);
  try {
    return { result: sandbox.invokeRubricMutation({ sessionToken: "synthetic" }, context => sandbox.runMutation(events, context)), events };
  } catch (error) {
    return { error: error.message, events };
  }
}

let rubricWrapperResult = runRubricMutationWrapper({ preflightPermissionDenied: true });
assert.equal(rubricWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(rubricWrapperResult.events, ["permission:saveRubric"], "rubric RBAC denial must precede lock acquisition");
rubricWrapperResult = runRubricMutationWrapper({ preflightIdentityDenied: true });
assert.equal(rubricWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(rubricWrapperResult.events, ["permission:saveRubric", "identity"], "invalid rubric actor must precede lock acquisition");
rubricWrapperResult = runRubricMutationWrapper();
assert.equal(rubricWrapperResult.result, "ok");
assert.deepEqual(rubricWrapperResult.events, [
  "permission:saveRubric", "identity", "lock-request", "lock-acquire:5000",
  "context:saveRubric", "permission:saveRubric", "identity", "scope-ownership-schema-validation",
  "mutation", "lock-release"
], "authorized rubric mutation must revalidate context under the acquired lock");
rubricWrapperResult = runRubricMutationWrapper({ contextPermissionDenied: true });
assert.equal(rubricWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(rubricWrapperResult.events, [
  "permission:saveRubric", "identity", "lock-request", "lock-acquire:5000",
  "context:saveRubric", "permission:saveRubric", "lock-release"
], "rubric RBAC must be rechecked under lock");
rubricWrapperResult = runRubricMutationWrapper({ contextIdentityDenied: true });
assert.equal(rubricWrapperResult.error, "RESOURCE_NOT_AVAILABLE");
assert.deepEqual(rubricWrapperResult.events, [
  "permission:saveRubric", "identity", "lock-request", "lock-acquire:5000",
  "context:saveRubric", "permission:saveRubric", "identity", "lock-release"
], "rubric identity must be rechecked under lock");
rubricWrapperResult = runRubricMutationWrapper({}, () => { throw new Error("synthetic rubric write failure"); });
assert.equal(rubricWrapperResult.error, "synthetic rubric write failure");
assert.equal(rubricWrapperResult.events.at(-1), "lock-release", "rubric lock must release after mutation failure");
rubricWrapperResult = runRubricMutationWrapper({ lockAvailable: false });
assert.equal(rubricWrapperResult.error, "RUBRIC_MUTATION_LOCK_TIMEOUT");
assert.deepEqual(rubricWrapperResult.events, [
  "permission:saveRubric", "identity", "lock-request", "lock-acquire:5000"
], "rubric lock timeout must occur only after preflight authorization");

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
  LockService: { getScriptLock() { return { tryLock() { return true; }, releaseLock() {} }; } },
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
  getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("Missing sheet " + name); return sheet; },
  withAuthorizedExamRead_(action, payload, reader) {
    const actor = runtime.getVerifiedExamIdentity_(payload);
    if (!actor || actor.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    const scope = runtime.getVerifiedExamDepartmentScope_(payload, ss, actor);
    if (!scope || scope.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    return reader({ actor, ss, scope });
  }
};
const contextual = extractFunction(source, "validateContextualAccess");
const permission = extractFunction(source, "validateRolePermission");
vm.runInNewContext(contextual + "\n" + permission +
  "\nthis.validate = validateRolePermission; this.validateRolePermission = validateRolePermission;", runtime);

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

const helpers = ["getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "assertExamResourceOwnershipForScope_", "getAllExams", "getAllExamsUnlocked_"]
  .map(name => extractFunction(source, name)).join("\n");
vm.runInNewContext(helpers + "\nthis.getVerifiedExamIdentity_ = getVerifiedExamIdentity_; this.getVerifiedExamDepartmentScope_ = getVerifiedExamDepartmentScope_; this.getAllExams = getAllExams;", runtime);
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
  "admin-session": { userId: "ADMIN-1", role: "Administrador" },
  "tutor-session": { userId: "TUTOR-1", role: "Tutor" } };
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
  let spreadsheetOpenCount = 0;
  let lockAcquireCount = 0;
  const context = {
    SPREADSHEET_ID: "LOCAL",
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new WeakMap(),
    PUBLIC_ACTIONS: [],
    ROLE_PERMISSIONS: { Profesor: ["createExam"], Administrador: ["*"], Tutor: [] },
    verifySessionToken(token) { return creationClaims[token] || null; },
    getDynamicPermissionsForRole() { return null; },
    hasActiveDelegationForAction() { return null; },
    PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "I1" : null; } }; } },
    SpreadsheetApp: { openById() { spreadsheetOpenCount++; return { getSheetByName(name) { return creationSheets[name] || null; } }; } },
    getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("Missing sheet " + name); return sheet; },
    LockService: { getScriptLock() { lockAcquireCount++; return { tryLock() { return true; }, releaseLock() {} }; } },
    Utilities: { getUuid() { uuid++; return "UUID-" + uuid; } }
  };
  const functions = ["validateContextualAccess", "validateRolePermission", "getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "createExam"]
    .map(name => extractFunction(source, name)).join("\n");
  vm.runInNewContext(functions + "\nthis.createExam = createExam;", context);
  return { context, sheets: creationSheets, getSpreadsheetOpenCount: () => spreadsheetOpenCount,
    getLockAcquireCount: () => lockAcquireCount };
}
const deniedCreation = makeCreationRuntime();
assert.throws(() => deniedCreation.context.createExam({ sessionToken: "tutor-session", titulo: "No autorizado" }),
  /RESOURCE_NOT_AVAILABLE/, "createExam enforces action RBAC on direct invocation");
assert.equal(deniedCreation.getSpreadsheetOpenCount(), 0, "RBAC denial occurs before spreadsheet access");
assert.equal(deniedCreation.getLockAcquireCount(), 0, "RBAC denial occurs before lock acquisition");
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


for (const name of ["getStudentExams", "getExamQuestions"]) {
  const handler = extractFunction(source, name);
  assert.ok(handler.includes("withAuthorizedExamRead_"), name + " delegates to the serialized reader");
}
const examReadWrapper = extractFunction(source, "withAuthorizedExamRead_");
assert.ok(examReadWrapper.includes("LockService.getScriptLock()") && examReadWrapper.includes("tryLock(5000)") &&
  examReadWrapper.includes("getAuthorizedExamReadContext_(action, payload)") &&
  examReadWrapper.includes("finally") && examReadWrapper.includes("releaseLock()"),
  "student exam and question reads share the bounded mutation lock");
const examReadContext = extractFunction(source, "getAuthorizedExamReadContext_");
assert.ok(examReadContext.includes("validateRolePermission(action, payload)") &&
  examReadContext.includes("getExamReadContext_(payload, requestedStudentId)"),
  "each exam read requires its own action permission and signed identity/scope context");
const studentExamWorker = extractFunction(source, "getStudentExamsUnlocked_");
assert.ok(studentExamWorker.includes("examIdCounts[examId] !== 1") &&
  studentExamWorker.includes("matchingDeliveries.length > 1"),
  "student exam list excludes duplicate exam IDs and ambiguous deliveries");
const examQuestionsWorker = extractFunction(source, "getExamQuestionsUnlocked_");
assert.ok(examQuestionsWorker.includes("matches.length !== 1") &&
  examQuestionsWorker.includes("ownDeliveries.length > 1") &&
  examQuestionsWorker.includes("questionIdCounts[String(row[0]).trim()] === 1"),
  "question reads require a unique exam/delivery and exclude duplicate question IDs");


for (const name of ["getAllExams", "getTeacherExamActivity"]) {
  const handler = extractFunction(source, name);
  assert.ok(handler.includes("withAuthorizedExamRead_"), name + " delegates to the shared serialized RBAC reader");
}
const allExamsWorker = extractFunction(source, "getAllExamsUnlocked_");
assert.ok(allExamsWorker.includes("examIdCounts[examId] !== 1") &&
  allExamsWorker.includes("assertExamResourceOwnershipForScope_") &&
  allExamsWorker.includes('actor.role === "Profesor"'),
  "getAllExams excludes ambiguous IDs and enforces signed teacher ownership plus ResourceOwnership");
const teacherActivityWorker = extractFunction(source, "getTeacherExamActivityUnlocked_");
assert.ok(teacherActivityWorker.includes("deliveryIdCounts[deliveryId] !== 1") &&
  teacherActivityWorker.includes("examIdCounts[examId] !== 1") &&
  teacherActivityWorker.includes("userIdCounts[studentId] === 1") &&
  teacherActivityWorker.includes("assertExamResourceOwnershipForScope_"),
  "teacher activity rejects ambiguous deliveries/exams/profiles and enforces ResourceOwnership");


const analyticsHandler = extractFunction(source, "getExamGradeDistributionAnalytics");
assert.ok(analyticsHandler.includes('withAuthorizedExamRead_("getExamGradeDistributionAnalytics"'),
  "grade distribution analytics delegates to the shared serialized RBAC reader");
const analyticsWorker = extractFunction(source, "getExamGradeDistributionAnalyticsUnlocked_");
assert.ok(analyticsWorker.includes("examIdCounts[examenId] !== 1") &&
  analyticsWorker.includes("deliveryIdCounts[deliveryId] !== 1") &&
  analyticsWorker.includes("assertExamResourceOwnershipForScope_") &&
  analyticsWorker.includes('actor.role === "Profesor"') &&
  analyticsWorker.includes("Number.isFinite(notaNum)"),
  "grade analytics requires a unique owned exam, unique deliveries and finite scores");

const schedulingHandler = extractFunction(source, "checkExamSchedulingConflict");
const schedulingWorker = extractFunction(source, "checkExamSchedulingConflictUnlocked_");
assert.ok(schedulingHandler.includes('withAuthorizedExamRead_("checkExamSchedulingConflict"'),
  "scheduling conflict check delegates to the shared serialized RBAC reader");
assert.ok(schedulingWorker.includes("idCounts[id] !== 1") &&
  schedulingWorker.includes("assertExamResourceOwnershipForScope_") &&
  schedulingWorker.includes('actor.role === "Profesor"') &&
  schedulingWorker.includes("EXAM_SCHEDULE_DATE_INVALID") &&
  schedulingWorker.includes("EXAM_SCHEDULE_LIMIT_INVALID"),
  "scheduling conflict counts only unique, owned, teacher-visible exams and validates date/limit inputs");


const rescheduleHandler = extractFunction(source, "simulateExamReschedule");
const rescheduleWorker = extractFunction(source, "simulateExamRescheduleUnlocked_");
assert.ok(rescheduleHandler.includes('withAuthorizedExamRead_("simulateExamReschedule"'),
  "reschedule simulation delegates to the shared serialized RBAC reader");
assert.ok(rescheduleWorker.includes("matches.length !== 1") &&
  rescheduleWorker.includes("assertExamResourceOwnershipForScope_") &&
  rescheduleWorker.includes('actor.role === "Profesor"') &&
  rescheduleWorker.includes("checkExamSchedulingConflictUnlocked_") &&
  !rescheduleWorker.includes("checkExamSchedulingConflict(") &&
  rescheduleWorker.includes("actor.role);"),
  "simulation requires a unique owned teacher-visible exam and reuses the conflict worker under the same lock");

const metricsHandler = extractFunction(source, "getGradingPerformanceAndPersistenceMetrics");
const metricsWorker = extractFunction(source, "getGradingPerformanceAndPersistenceMetricsUnlocked_");
assert.ok(metricsHandler.includes('withAuthorizedExamRead_("getGradingPerformanceAndPersistenceMetrics"'),
  "global persistence metrics delegate to the shared serialized RBAC reader");
assert.ok(metricsWorker.includes('["Administrador", "Desarrollador"]') &&
  metricsWorker.includes("scope.institutionWide !== true") &&
  metricsWorker.includes("getLastRow()") &&
  !metricsWorker.includes("getDataRange()") &&
  !metricsWorker.includes("SpreadsheetApp.openById"),
  "global metrics require an institution-wide administrator/developer and read only row counts");
const permissionsBlock = source.slice(source.indexOf("const ROLE_PERMISSIONS"), source.indexOf("// [TAREA-F4-P0-01]"));
const professorPermissions = /"Profesor": \[([\s\S]*?)\n  \],/.exec(permissionsBlock);
assert.ok(professorPermissions && !professorPermissions[1].includes("getGradingPerformanceAndPersistenceMetrics"),
  "professors no longer receive institution-wide persistence metrics permission");

const gradebookHandler = extractFunction(source, "getGradebookData");
const gradebookWorker = extractFunction(source, "getGradebookDataUnlocked_");
assert.ok(gradebookHandler.includes('withAuthorizedExamRead_("getGradebookData"'),
  "gradebook reads delegate to the shared RBAC reader and lock");
assert.ok(gradebookWorker.includes('role === "Profesor"') &&
  gradebookWorker.includes('professorId !== String(actor.userId).trim()') &&
  gradebookWorker.includes('"ConfiguracionAcademica"') &&
  gradebookWorker.includes("matchingAssignments.some(row") && gradebookWorker.includes('String(row[8] || "").trim() !== String(actor.userId).trim()'),
  "teacher gradebook access is bound to the verified teacher identity and assigned class context");
assert.ok(gradebookWorker.includes('scope.institutionWide !== true') &&
  gradebookWorker.includes('institutionRoles.indexOf(role) !== -1') &&
  gradebookWorker.includes('userIdCounts[id] !== 1') &&
  !gradebookWorker.includes("getOrCreateSheet("),
  "administrative gradebook reads require institution scope, ambiguous student IDs are excluded and reads do not create sheets");

process.stdout.write("exam-service-security-contract: authentication, identity, teacher ownership and serialized exam mutations assertions passed\\n");
