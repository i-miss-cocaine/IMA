// NOTA: Las URLs de los microservicios solo se deben actualizar en el frontend (js/config.js), no en este archivo.
// ============================================================================
// MICROSERVICIO DE EXÁMENES (VERSIÓN GAS CORRECTA)
// ============================================================================

const SPREADSHEET_ID = "1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww";
const DEBUG_MODE = true;

// ---------------------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------------------

function logDebug(msg, data) {
  if (!DEBUG_MODE) return;
  try {
    console.log(`[EXAM-SVC] ${msg}`, data || "");
  } catch (_) {}
}

function getSheetOrThrow(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Hoja no encontrada: ${name}`);
  return sheet;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Examenes") sheet.appendRow(["ExamenID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "TiempoLimite", "Estado", "ProfesorID", "Parcial", "AreaCurricular", "DuracionMinutos", "IntentosPermitidos", "EsAleatorio"]);
    if (name === "PreguntasExamen") sheet.appendRow(["PreguntaID", "ExamenID", "Tipo", "Texto", "OpcionesJSON", "RespuestaCorrecta", "Puntos", "AreaCurricular", "Dificultad", "BancoPreguntaID"]);
    if (name === "BancoPreguntas") sheet.appendRow(["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo", "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado"]);
    if (name === "EntregasExamen") sheet.appendRow(["EntregaExamenID", "ExamenID", "UserID", "FechaEntrega", "RespuestasJSON", "NotaTotal", "Estado", "ComentarioDocente", "TemaAsociado", "AsignaturaAsociada"]);
    if (name === "CategoriasEvaluacion") sheet.appendRow(["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"]);
    if (name === "RubricasEvaluacion") sheet.appendRow(["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"]);
    if (name === "CalificacionesEstudiantes") sheet.appendRow(["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado", "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"]);
    if (name === "RecuperacionesEstudiante") sheet.appendRow(["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada", "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"]);
    if (name === "CierresPeriodos") sheet.appendRow(["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"]);
  }
  return sheet;
}

function textResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.TEXT);
}

// [TAREA-11] [Fase 1 - Motor de Exámenes] - Función auxiliar de normalización de cadenas para comparaciones diacríticas e insensibles a mayúsculas/minúsculas.
function normalizeString(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// ENDPOINTS
// ---------------------------------------------------------------------------

function doGet() {
  return textResponse({
    status: "success",
    message: "Microservicio de Exámenes operativo"
  });
}

function doOptions() {
  return textResponse({ status: "ok" });
}

const PUBLIC_ACTIONS = [
  // Las acciones públicas se limitan a endpoints sin datos académicos o institucionales.
];

const ROLE_PERMISSIONS = {
  "Administrador": ["*"],
  "Desarrollador": ["*"],
  "Padre": ["getStudentExams", "getExamQuestions", "getExamResult", "getEvaluationCategories", "getRubrics", "getStudentRecoveries", "getStudentAcademicReport", "getGradeRectificationHistory"],
  "Tutor": ["getStudentExams", "getExamQuestions", "getExamResult", "getEvaluationCategories", "getRubrics", "getStudentRecoveries", "getStudentAcademicReport", "getGradeRectificationHistory"],
  "Responsable": ["getStudentExams", "getExamQuestions", "getExamResult", "getEvaluationCategories", "getRubrics", "getStudentRecoveries", "getStudentAcademicReport", "getGradeRectificationHistory"],
  "Dirección": ["*"],
  "Director": ["reviewPeriodGradebook", "reopenPeriodGradebook", "rectifyStudentGrade", "saveGradebookGrades"],
  "Secretaría": ["*"],
  "Profesor": [
    "createExam", "updateExam", "updateExamStatus", "deleteExam", "gradeExamSubmission", "deleteExamSubmission",
    "getAllExams", "getTeacherExamActivity", "getExamQuestions", "getStudentExams", "getExamResult",
    "getGradebookData", "saveGradebookGrades", "bulkApplyGradebookGrades", "copyEvaluationSetupBetweenGroups", "getEvaluationCategories", "saveEvaluationCategory",
    "getRubrics", "saveRubric", "saveCompetencyEvaluation", "getCompetencyEvaluations", "saveStudentRecovery", "closePeriodGradebook", "submitGradebookForReview",
    "manageQuestionBank", "getQuestionBank", "checkExamSchedulingConflict", "simulateExamReschedule",
    "getExamGradeDistributionAnalytics"
  ],
  "Estudiante": [
    "getStudentExams", "getExamQuestions", "submitExam", "getExamResult", "getEvaluationCategories", "getRubrics", "getCompetencyEvaluations", "getStudentRecoveries", "getStudentAcademicReport", "getGradeRectificationHistory"
  ],
  "Alumno": [
    "getStudentExams", "getExamQuestions", "submitExam", "getExamResult", "getEvaluationCategories", "getRubrics", "getCompetencyEvaluations", "getStudentRecoveries", "getStudentAcademicReport", "getGradeRectificationHistory"
  ]
};

// [TAREA-F4-P0-01] [Fase 4: Identidad y Permisos] - Funciones de verificación de firma HMAC-SHA256 e integración con token de sesión
function computeHmacSignature(message, secret) {
  const bytes = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, message, secret);
  const arr = Array.from ? Array.from(bytes) : [].slice.call(bytes);
  return arr.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function getAuthTokenSecret() {
  let secret = "";
  try {
    secret = String(PropertiesService.getScriptProperties().getProperty("AUTH_TOKEN_SECRET") || "").trim();
  } catch (error) {
    throw new Error("AUTH_TOKEN_SECRET_UNAVAILABLE");
  }
  if (secret.length < 32) {
    throw new Error("AUTH_TOKEN_SECRET_NOT_CONFIGURED");
  }
  return secret;
}

function verifySessionToken(tokenString) {
  if (!tokenString || typeof tokenString !== "string" || tokenString.indexOf(".") === -1) {
    return null;
  }
  const parts = tokenString.split(".");
  if (parts.length !== 2) return null;
  const payloadB64 = parts[0];
  const providedSignature = parts[1];
  const secret = getAuthTokenSecret();
  const expectedSignature = computeHmacSignature(payloadB64, secret);
  if (providedSignature !== expectedSignature) {
    return null;
  }
  try {
    let normalizedB64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (normalizedB64.length % 4 !== 0) {
      normalizedB64 += '=';
    }
    const jsonStr = Utilities.newBlob(Utilities.base64Decode(normalizedB64)).getDataAsString();
    const claims = JSON.parse(jsonStr);
    const now = Math.floor(Date.now() / 1000);
    if (!claims || typeof claims !== "object" || Array.isArray(claims)) return null;
    if (typeof claims.userId !== "string" || !claims.userId.trim()) return null;
    if (typeof claims.role !== "string" || !claims.role.trim()) return null;
    if (typeof claims.sessionId !== "string" || !claims.sessionId.trim()) return null;
    if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)) return null;
    if (claims.iat > now + 60 || claims.exp <= now || claims.exp <= claims.iat || claims.exp - claims.iat > 86400) return null;
    const cache = CacheService.getScriptCache();
    if (cache.get("revoked_user_" + claims.userId)) return null;
    if (cache.get("revoked_session_" + claims.sessionId)) return null;

    const stateCacheKey = "acct_state_" + claims.userId;
    const roleCacheKey = "acct_role_" + claims.userId;
    let acctState = cache.get(stateCacheKey);
    let currentRole = cache.get(roleCacheKey);
    if (!acctState || !currentRole) {
      try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const uSheet = ss.getSheetByName("Usuarios");
        if (!uSheet) return null;
        const data = uSheet.getDataRange().getValues();
        const currentUser = data.find((row, index) => index > 0 && String(row[0] || "").trim() === claims.userId.trim());
        if (!currentUser) return null;
        acctState = String(currentUser[10] || "Activa").trim();
        currentRole = String(currentUser[6] || "").trim();
        cache.put(stateCacheKey, acctState, 60);
        cache.put(roleCacheKey, currentRole, 60);
      } catch (error) {
        return null;
      }
    }
    if (acctState !== "Activa" || !currentRole || currentRole !== claims.role.trim()) return null;
    return claims;
  } catch (e) {
    return null;
  }
}

// [TASK-153 / T153-S05-S06] Identidad, ámbito y propiedad departamental del recurso EXAM.
var EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();
function getVerifiedExamIdentity_(payload) {
  const token = payload && (payload.sessionToken || payload.authToken || payload.token);
  const claims = token ? verifySessionToken(token) : null;
  if (!claims || !claims.userId || !claims.role) return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  if (payload && typeof payload === "object") {
    payload._verifiedUserId = String(claims.userId).trim();
    payload._verifiedRole = String(claims.role).trim();
  }
  return { authorized: true, userId: String(claims.userId).trim(), role: String(claims.role).trim() };
}
function getVerifiedExamDepartmentScope_(payload, ss, identity) {
  const actor = identity || getVerifiedExamIdentity_(payload);
  if (!actor || !actor.authorized) return actor || { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  let institutionId = "";
  try { institutionId = String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID") || "").trim(); } catch (_) {}
  if (!institutionId) return { authorized: false, code: "IDENTITY_CONFIGURATION_REQUIRED" };
  const sheet = ss && ss.getSheetByName("AsignacionesAmbitosRoles");
  if (!sheet) return { authorized: false, code: "ROLE_SCOPE_NOT_INITIALIZED" };
  const data = sheet.getDataRange().getValues();
  const norm = value => String(value || "").trim().toUpperCase()
    .replace(/[ÁÀÄ]/g, "A").replace(/[ÉÈË]/g, "E").replace(/[ÍÌÏ]/g, "I")
    .replace(/[ÓÒÖ]/g, "O").replace(/[ÚÙÜ]/g, "U").replace(/Ñ/g, "N")
    .replace(/^ROLE[_-]?/, "").replace(/[^A-Z0-9]/g, "");
  const parseValues = value => {
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    const raw = String(value || "").trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
      if (parsed !== null && parsed !== undefined) return [String(parsed).trim()].filter(Boolean);
    } catch (_) {}
    return raw.split(",").map(v => String(v).trim()).filter(Boolean);
  };
  const now = new Date(), scopes = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i] || [];
    if (String(row[1] || "").trim() !== actor.userId || norm(row[2]) !== norm(actor.role)) continue;
    if (["ACTIVO", "ACTIVA", "ACTIVE"].indexOf(String(row[5] || "").trim().toUpperCase()) === -1) continue;
    const start = row[8] ? new Date(row[8]) : null, end = row[9] ? new Date(row[9]) : null;
    if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) continue;
    if (start && start.getTime() > now.getTime()) continue;
    if (end && end.getTime() < now.getTime()) continue;
    const scopeType = String(row[3] || "").trim().toUpperCase(), scopeValues = parseValues(row[4]);
    if (scopeType && scopeValues.length) scopes.push({ assignmentId: String(row[0] || ""), roleId: String(row[2] || ""), scopeType, scopeValues });
  }
  if (!scopes.length) return { authorized: false, code: "DEPARTMENT_SCOPE_NOT_ASSIGNED", userId: actor.userId, role: actor.role, institutionId, scopes: [], departmentIds: [], institutionWide: false };
  const departmentIds = [];
  let institutionWide = false;
  scopes.forEach(scope => {
    if (scope.scopeType === "DEPARTAMENTO") scope.scopeValues.forEach(value => { if (departmentIds.indexOf(value) === -1) departmentIds.push(value); });
    if (scope.scopeType === "INSTITUCION" && scope.scopeValues.indexOf(institutionId) !== -1) institutionWide = true;
  });
  return { authorized: true, userId: actor.userId, role: actor.role, institutionId, scopes, departmentIds, institutionWide };
}
function assertExamResourceOwnershipForScope_(ss, scope, resourceType, resourceId, operation, payload) {
  try {
    if (!scope || !scope.authorized) return scope || { authorized: false, code: "DEPARTMENT_SCOPE_NOT_ASSIGNED" };
    const institutionId = String(scope.institutionId || "").trim();
    const type = String(resourceType || "").trim().toUpperCase(), id = String(resourceId || "").trim();
    if (!institutionId) return { authorized: false, code: "IDENTITY_CONFIGURATION_REQUIRED" };
    if (!type || !id) return { authorized: false, code: "RESOURCE_REFERENCE_INVALID" };
    const sheet = ss && ss.getSheetByName("ResourceOwnership");
    if (!sheet) return { authorized: false, code: "RESOURCE_OWNERSHIP_NOT_CONFIGURED" };
    let data = null;
    if (payload && typeof payload === "object") {
      try { data = EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_.get(payload) || null; } catch (_) {}
    }
    if (!data) {
      data = sheet.getDataRange().getValues();
      if (payload && typeof payload === "object") {
        try { EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_.set(payload, data); } catch (_) {}
      }
    }
    if (!data || data.length <= 1) return { authorized: false, code: "RESOURCE_OWNERSHIP_NOT_CONFIGURED" };
    const matches = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] || [];
      if (String(row[1] || "").trim() !== institutionId) continue;
      if (String(row[2] || "").trim().toUpperCase() !== type || String(row[3] || "").trim() !== id) continue;
      if (String(row[5] || "").trim().toUpperCase() !== "ACTIVE") continue;
      matches.push(row);
    }
    if (!matches.length) return { authorized: false, code: "RESOURCE_OWNERSHIP_UNVERIFIED" };
    if (matches.length !== 1) return { authorized: false, code: "RESOURCE_OWNERSHIP_AMBIGUOUS" };
    const departmentId = String(matches[0][4] || "").trim();
    if (!departmentId) return { authorized: false, code: "RESOURCE_DEPARTMENT_UNRESOLVED" };
    const inDepartment = (scope.departmentIds || []).some(value => String(value || "").trim() === departmentId);
    if (!(scope.institutionWide === true || inDepartment)) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    return { authorized: true, code: "RESOURCE_SCOPE_ALLOWED", userId: scope.userId, role: scope.role, institutionId,
      departmentId, resourceType: type, resourceId: id, operation: String(operation || "").trim().toUpperCase(),
      accessType: scope.institutionWide === true ? "INSTITUTION" : "DEPARTMENT" };
  } catch (_) { return { authorized: false, code: "RESOURCE_OWNERSHIP_CHECK_FAILED" }; }
}

// [TAREA-01] [TAREA-F4-P0-01] [Fase 4 - Seguridad RBAC y Token Unificado] - Validar y reforzar la seguridad mediante verificación de credencial de sesión HMAC
// [TAREA-F4-P1-04] [Fase 4: Reglas Contextuales RBAC/ABAC] - Validación de atributos contextuales (Docentes, Tutores, Estudiantes)
function validateContextualAccess(action, payload, verifiedUserId, userRole) {
  if (!userRole || userRole === "Administrador" || userRole === "Desarrollador") {
    return { authorized: true };
  }

  const targetStudentId = payload && (payload.studentId || payload.estudianteId || payload.targetUserId || payload.userId);

  if (userRole === "Estudiante" || userRole === "Alumno") {
    if (targetStudentId && verifiedUserId && String(targetStudentId).trim() !== String(verifiedUserId).trim()) {
      return { authorized: false, reason: "Aislamiento estricto de estudiante: intento de acceso a ID ajeno." };
    }
  }

  return { authorized: true };
}

function validateRolePermission(action, payload) {
  if (PUBLIC_ACTIONS.indexOf(action) !== -1) return { authorized: true };

  let userRole = "Estudiante";
  let verifiedUserId = null;
  const token = payload && (payload.sessionToken || payload.authToken || payload.token);

  if (token) {
    const claims = verifySessionToken(token);
    if (!claims) {
      return { authorized: false, role: "Token Inválido/Expirado" };
    }
    userRole = claims.role || "Estudiante";
    verifiedUserId = claims.userId;
    if (payload) {
      payload._verifiedUserId = verifiedUserId;
      payload._verifiedRole = userRole;
    }
  } else {
    return { authorized: false, role: "Sin Credenciales de Sesión" };
  }

  const ctxCheck = validateContextualAccess(action, payload, verifiedUserId, userRole);
  if (!ctxCheck.authorized) {
    return { authorized: false, role: userRole + " (" + ctxCheck.reason + ")" };
  }

  const dynamicCheck = getDynamicPermissionsForRole(userRole, action);
  if (dynamicCheck !== null) {
    if (dynamicCheck === true) return { authorized: true, role: userRole };
  } else {
    const permitted = ROLE_PERMISSIONS[userRole] || [];
    if (permitted.indexOf("*") !== -1 || permitted.indexOf(action) !== -1) {
      return { authorized: true, role: userRole };
    }
  }

  const verifiedId = payload && payload._verifiedUserId;
  if (verifiedId) {
    const activeDel = hasActiveDelegationForAction(verifiedId, action);
    if (activeDel) {
      if (payload) {
        payload._delegatedFrom = activeDel.delegante;
        payload._delegationId = activeDel.delId;
      }
      return { authorized: true, role: userRole + " (Delegado de " + activeDel.delegante + ")" };
    }
  }

  return { authorized: false, role: userRole };
}

// [TAREA-F4-P1-03] [Fase 4: Matriz Dinámica de Permisos] - Consulta y caché de la matriz dinámica por rol y acción
function getDynamicPermissionsForRole(role, action) {
  if (!role || !action) return null;
  const cache = CacheService.getScriptCache();
  const cacheKey = "dynamic_permissions_matrix";
  let matrix = null;
  try {
    const raw = cache.get(cacheKey);
    if (raw) matrix = JSON.parse(raw);
  } catch (e) {}

  if (!matrix) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName("MatrizPermisosRoles");
      if (!sheet || sheet.getLastRow() <= 1) return null;
      const data = sheet.getDataRange().getValues();
      matrix = {};
      for (let i = 1; i < data.length; i++) {
        const rRole = String(data[i][0] || "").trim();
        const rAction = String(data[i][2] || "").trim();
        const rPermitted = data[i][3] === true || String(data[i][3]).toLowerCase() === "true";
        if (!matrix[rRole]) matrix[rRole] = {};
        matrix[rRole][rAction] = rPermitted;
      }
      cache.put(cacheKey, JSON.stringify(matrix), 600);
    } catch (e) {
      return null;
    }
  }

  if (matrix && matrix[role]) {
    if (matrix[role]["*"] !== undefined) return matrix[role]["*"];
    if (matrix[role][action] !== undefined) return matrix[role][action];
  }
  return null;
}

// [TAREA-F4-P1-01] [Fase 4: Motor de Delegaciones] - Verificación de delegaciones de seguridad activas
function hasActiveDelegationForAction(userId, action) {
  if (!userId || !action) return null;
  const cache = CacheService.getScriptCache();
  const cacheKey = "active_delegations_" + userId;
  let cached = null;
  try {
    const raw = cache.get(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!cached) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName("DelegacionesSeguridad");
      if (!sheet) return null;
      const data = sheet.getDataRange().getValues();
      const now = new Date().getTime();
      cached = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const delId = String(row[0] || "");
        const delegante = String(row[1] || "");
        const delegado = String(row[2] || "");
        const acciones = String(row[3] || "").split(",").map(s => s.trim());
        const fInicio = new Date(row[5]).getTime();
        const fFin = new Date(row[6]).getTime();
        const estado = String(row[7] || "");

        if (String(delegado).trim() === String(userId).trim() && estado === "Activa" && now >= fInicio && now <= fFin) {
          cached.push({ delId, delegante, acciones });
        }
      }
      cache.put(cacheKey, JSON.stringify(cached), 300);
    } catch (err) {
      return null;
    }
  }

  for (let j = 0; j < cached.length; j++) {
    const item = cached[j];
    if (item.acciones.indexOf("*") !== -1 || item.acciones.indexOf(action) !== -1) {
      return item;
    }
  }
  return null;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return textResponse({ status: "error", message: "No se recibieron datos." });
    const { action, payload } = JSON.parse(e.postData.contents);
    const authCheck = validateRolePermission(action, payload);
    if (!authCheck.authorized) {
      return textResponse({
        status: "error",
        code: "AUTH_PERMISSION_DENIED",
        message: "Acceso denegado: El rol " + authCheck.role + " no tiene permiso para la acción " + action + "."
      });
    }
    let result;

    switch (action) {
      case "purgeSecurityCaches": result = purgeSecurityCaches(payload); break;
      case "createExam": result = createExam(payload); break;
      case "getExamQuestions": result = getExamQuestions(payload); break;
      case "submitExam": result = submitExam(payload); break;
      case "updateExamStatus": result = updateExamStatus(payload); break;
      case "getAllExams": result = getAllExams(payload); break;
      case "getTeacherExamActivity": result = getTeacherExamActivity(payload); break;
      case "gradeExamSubmission": result = gradeExamSubmission(payload); break;
      case "getStudentExams": result = getStudentExams(payload); break;
      case "getExamResult": result = getExamResult(payload); break;
      case "updateExam": result = updateExam(payload); break;
      case "deleteExam": result = deleteExam(payload); break;
      case "deleteExamSubmission": result = deleteExamSubmission(payload); break;
      case "getGradebookData": result = getGradebookData(payload); break;
      case "saveGradebookGrades": result = saveGradebookGrades(payload); break;
      case "bulkApplyGradebookGrades": result = bulkApplyGradebookGrades(payload); break;
      case "copyEvaluationSetupBetweenGroups": result = copyEvaluationSetupBetweenGroups(payload); break;
      case "getEvaluationCategories": result = getEvaluationCategories(payload); break;
      case "saveEvaluationCategory": result = saveEvaluationCategory(payload); break;
      case "getRubrics": result = getRubrics(payload); break;
      case "saveRubric": result = saveRubric(payload); break;
      case "saveCompetencyEvaluation": result = saveCompetencyEvaluation(payload); break;
      case "getCompetencyEvaluations": result = getCompetencyEvaluations(payload); break;
      case "saveStudentRecovery": result = saveStudentRecovery(payload); break;
      case "getStudentRecoveries": result = getStudentRecoveries(payload); break;
      case "closePeriodGradebook": result = closePeriodGradebook(payload); break;
      case "reopenPeriodGradebook": result = reopenPeriodGradebook(payload); break;
      case "submitGradebookForReview": result = submitGradebookForReview(payload); break;
      case "reviewPeriodGradebook": result = reviewPeriodGradebook(payload); break;
      case "rectifyStudentGrade": result = rectifyStudentGrade(payload); break;
      case "getGradeRectificationHistory": result = getGradeRectificationHistory(payload); break;
      case "getStudentAcademicReport": result = getStudentAcademicReport(payload); break;
      case "manageQuestionBank": result = manageQuestionBank(payload); break;
      case "getQuestionBank": result = getQuestionBank(payload); break;
      case "checkExamSchedulingConflict": result = checkExamSchedulingConflict(payload); break;
      case "simulateExamReschedule": result = simulateExamReschedule(payload); break;
      case "getExamGradeDistributionAnalytics": result = getExamGradeDistributionAnalytics(payload); break;
      case "getGradingPerformanceAndPersistenceMetrics": result = getGradingPerformanceAndPersistenceMetrics(payload); break;
      default:
        result = { status: "error", message: `Acción no válida: ${action}` };
    }

    return textResponse(result);

  } catch (err) {
    logDebug("ERROR", err.message);
    return textResponse({ status: "error", message: err.message || "Error interno del servidor." });
  }
}

// [TAREA-11] [Fase 1 - Motor de Exámenes] - Motor ampliado de evaluaciones, bancos de preguntas polimórficos por área, aleatoriedad y analítica psicométrica.
function manageQuestionBank(payload) {
  return withAuthorizedQuestionBankMutation_(payload, context => manageQuestionBankUnlocked_(payload, context));
}

function getAuthorizedQuestionBankMutationContext_(payload) {
  const permission = validateRolePermission("manageQuestionBank", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(payload, ss, actor);
  if (!scope.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  const bankSheet = getOrCreateSheet(ss, "BancoPreguntas");
  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const bankHeaders = ["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo", "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado"];
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  const bankRows = bankSheet.getDataRange().getValues();
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  if (!bankRows.length || bankHeaders.some((header, index) => String(bankRows[0][index] || "").trim() !== header)) throw new Error("QUESTION_BANK_SCHEMA_INVALID");
  if (!ownershipRows.length || ownershipHeaders.some((header, index) => String(ownershipRows[0][index] || "").trim() !== header)) throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  const requestedId = String((payload && payload.bancoPreguntaId) || "").trim();
  const action = String((payload && payload.accion) || "").trim().toLowerCase();
  if (action === "eliminar" && !requestedId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const matches = requestedId ? bankRows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
    .filter(item => String(item.row[0] || "").trim() === requestedId) : [];
  if (requestedId && matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  let ownership = null;
  if (requestedId) {
    const check = assertExamResourceOwnershipForScope_(ss, scope, "BANCO_PREGUNTA", requestedId, action === "eliminar" ? "DELETE" : "UPDATE", payload);
    if (!check.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
    const owned = ownershipRows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
      .filter(item => String(item.row[1] || "").trim() === String(scope.institutionId || "").trim() &&
        String(item.row[2] || "").trim().toUpperCase() === "BANCO_PREGUNTA" &&
        String(item.row[3] || "").trim() === requestedId && String(item.row[5] || "").trim().toUpperCase() === "ACTIVE");
    if (owned.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
    ownership = owned[0];
  } else {
    if (action === "eliminar") throw new Error("RESOURCE_NOT_AVAILABLE");
    const requestedDepartmentId = String((payload && (payload.departmentId || payload.departamentoId)) || "").trim();
    const departmentId = requestedDepartmentId || ((scope.departmentIds || []).length === 1 ? String(scope.departmentIds[0] || "").trim() : "");
    const departmentAllowed = !!departmentId && (scope.departmentIds || []).some(value => String(value || "").trim() === departmentId);
    if (!departmentAllowed) throw new Error("RESOURCE_SCOPE_DENIED");
    return { ss, actor, scope, bankSheet, ownershipSheet, bankRows, ownershipRows, departmentId, bankRow: null, ownership: null };
  }
  return { ss, actor, scope, bankSheet, ownershipSheet, bankRows, ownershipRows, departmentId: ownership.row[4],
    bankRow: matches[0], ownership };
}

function withAuthorizedQuestionBankMutation_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const permission = validateRolePermission("manageQuestionBank", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("QUESTION_BANK_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedQuestionBankMutationContext_(payload);
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function manageQuestionBankUnlocked_(payload, context) {
  const p = payload || {};
  const action = String(p.accion || "").trim().toLowerCase();
  const bankSheet = context.bankSheet;
  if (context.bankRow) {
    const rowNumber = context.bankRow.rowIndex + 1;
    if (action === "eliminar") {
      const oldBankStatus = context.bankRow.row[12];
      const oldOwnershipStatus = context.ownership.row[5];
      try {
        context.ownershipSheet.getRange(context.ownership.rowIndex + 1, 6).setValue("INACTIVE");
        bankSheet.getRange(rowNumber, 13).setValue("Inactivo");
      } catch (error) {
        let rollbackFailed = false;
        try { context.ownershipSheet.getRange(context.ownership.rowIndex + 1, 6).setValue(oldOwnershipStatus); } catch (_) { rollbackFailed = true; }
        try { bankSheet.getRange(rowNumber, 13).setValue(oldBankStatus); } catch (_) { rollbackFailed = true; }
        if (rollbackFailed) throw new Error("QUESTION_BANK_DELETE_ROLLBACK_FAILED");
        throw error;
      }
      return { status: "success", message: "Pregunta desactivada en el banco de preguntas." };
    }
    const opcStr = typeof p.opcionesJSON === "object" ? JSON.stringify(p.opcionesJSON) : (p.opcionesJSON || "{}");
    bankSheet.getRange(rowNumber, 2, 1, 12).setValues([[
      p.areaCurricular || "General", p.asignatura || "", p.grado || "", p.tema || "",
      p.dificultad || "Media", p.tipo || "opcion_multiple", p.textoPregunta || "", opcStr,
      p.respuestaCorrecta || "", p.etiquetas || "", p.puntosPredeterminados || 1, "Activo"
    ]]);
    return { status: "success", bancoPreguntaId: String(context.bankRow.row[0]), message: "Pregunta del banco actualizada correctamente." };
  }
  const qId = "BNK-" + Utilities.getUuid();
  if (context.bankRows.slice(1).some(row => String(row[0] || "").trim() === qId) ||
      context.ownershipRows.slice(1).some(row => String(row[1] || "").trim() === context.scope.institutionId &&
        String(row[2] || "").trim().toUpperCase() === "BANCO_PREGUNTA" && String(row[3] || "").trim() === qId)) {
    throw new Error("QUESTION_BANK_ID_COLLISION");
  }
  const opcStr = typeof p.opcionesJSON === "object" ? JSON.stringify(p.opcionesJSON) : (p.opcionesJSON || "{}");
  const now = new Date().toISOString();
  const ownershipId = "OWN-" + Utilities.getUuid();
  const bankRow = [qId, p.areaCurricular || "General", p.asignatura || "", p.grado || "", p.tema || "",
    p.dificultad || "Media", p.tipo || "opcion_multiple", p.textoPregunta || "", opcStr,
    p.respuestaCorrecta || "", p.etiquetas || "", p.puntosPredeterminados || 1, "Activo"];
  try {
    context.ownershipSheet.appendRow([ownershipId, context.scope.institutionId, "BANCO_PREGUNTA", qId,
      context.departmentId, "ACTIVE", context.actor.userId, now, now]);
    bankSheet.appendRow(bankRow);
  } catch (error) {
    let rollbackFailed = false;
    // Re-scan both sheets even when appendRow threw: a provider may persist the
    // row and still report an error, so local flags cannot prove no write occurred.
    try {
      const rows = bankSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0] || "").trim() === qId) bankSheet.deleteRow(i + 1);
    } catch (_) { rollbackFailed = true; }
    try {
      const rows = context.ownershipSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0] || "").trim() === ownershipId) context.ownershipSheet.deleteRow(i + 1);
    } catch (_) { rollbackFailed = true; }
    if (rollbackFailed) throw new Error("QUESTION_BANK_CREATE_ROLLBACK_FAILED");
    throw error;
  }
  return { status: "success", bancoPreguntaId: qId, message: "Pregunta añadida exitosamente al banco." };
}
function getQuestionBank(payload) {
  return withAuthorizedQuestionBankRead_(payload, context => getQuestionBankUnlocked_(payload, context));
}

function withAuthorizedQuestionBankRead_(payload, reader) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("QUESTION_BANK_READ_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedQuestionBankReadContext_(payload);
    return reader(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedQuestionBankReadContext_(payload) {
  const p = payload || {};
  const permission = validateRolePermission("getQuestionBank", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  const sheet = getSheetOrThrow(ss, "BancoPreguntas");
  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const data = sheet.getDataRange().getValues();
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  const bankHeaders = ["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo", "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado"];
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  if (!data.length || bankHeaders.some((header, index) => String(data[0][index] || "").trim() !== header)) throw new Error("QUESTION_BANK_SCHEMA_INVALID");
  if (!ownershipRows.length || ownershipHeaders.some((header, index) => String(ownershipRows[0][index] || "").trim() !== header)) throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  if (p && typeof p === "object") {
    try { EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_.set(p, ownershipRows); } catch (_) {}
  }
  return { ss, scope, data, canReadAnswerKey: validateRolePermission("manageQuestionBank", p).authorized === true };
}

function getQuestionBankUnlocked_(payload, context) {
  const p = payload || {};
  const data = context.data;
  const bankIdCounts = Object.create(null);
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) bankIdCounts[id] = (bankIdCounts[id] || 0) + 1;
  });
  const normArea = p.areaCurricular ? normalizeString(p.areaCurricular) : "";
  const normAsig = p.asignatura ? normalizeString(p.asignatura) : "";
  const normGrado = p.grado ? normalizeString(p.grado) : "";
  const preguntas = data.slice(1).filter(row => {
    const resourceId = String(row[0] || "").trim();
    if (!resourceId || bankIdCounts[resourceId] !== 1) return false;
    if (String(row[12] || "").trim().toLowerCase() === "inactivo") return false;
    if (normArea && normalizeString(row[1]) !== normArea) return false;
    if (normAsig && normalizeString(row[2]) !== normAsig) return false;
    if (normGrado && normalizeString(row[3]) !== normGrado) return false;
    if (p.tema && normalizeString(row[4]) !== normalizeString(p.tema)) return false;
    if (p.dificultad && normalizeString(row[5]) !== normalizeString(p.dificultad)) return false;
    return assertExamResourceOwnershipForScope_(context.ss, context.scope, "BANCO_PREGUNTA", resourceId, "READ", p).authorized === true;
  }).map(row => {
    const question = {
      bancoPreguntaId: row[0], areaCurricular: row[1], asignatura: row[2], grado: row[3],
      tema: row[4], dificultad: row[5], tipo: row[6], textoPregunta: row[7],
      opciones: JSON.parse(row[8] || "{}"), etiquetas: row[10],
      puntosPredeterminados: parseFloat(row[11]) || 1
    };
    if (context.canReadAnswerKey) question.respuestaCorrecta = row[9];
    return question;
  });
  return { status: "success", preguntas };
}
function createExam(p) {
  p = p && typeof p === "object" && !Array.isArray(p) ? p : {};
  const permission = validateRolePermission("createExam", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");

  const requestedDepartmentId = String(p.departmentId || p.departamentoId || "").trim();
  const departmentId = requestedDepartmentId || ((scope.departmentIds || []).length === 1
    ? String(scope.departmentIds[0] || "").trim() : "");
  const departmentAllowed = !!departmentId && (scope.departmentIds || []).some(value =>
    String(value || "").trim() === departmentId);
  // Incluso los ámbitos institucionales deben seleccionar un departamento que
  // figure explícitamente entre los departamentos autorizados del actor.
  if (!departmentAllowed) throw new Error("RESOURCE_SCOPE_DENIED");

  const examenes = getSheetOrThrow(ss, "Examenes");
  const preguntas = getSheetOrThrow(ss, "PreguntasExamen");
  const ownership = getSheetOrThrow(ss, "ResourceOwnership");
  const ownershipHeaders = ownership.getDataRange().getValues()[0] || [];
  const expectedHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  if (expectedHeaders.some((header, index) => String(ownershipHeaders[index] || "").trim() !== header)) {
    throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  }

  const preguntasData = (Array.isArray(p.preguntas) ? p.preguntas : []).map((q, i) => [
    `PRE-${Date.now()}-${i}`, "", q && q.preguntaTipo, q && q.textoPregunta,
    JSON.stringify((q && q.opciones) || {}), q && q.respuestaCorrecta
  ]);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_CREATE_LOCK_TIMEOUT");

  let examenId = "";
  let ownershipId = "";
  try {
    const now = new Date().toISOString();
    const uniqueSuffix = Utilities.getUuid();
    examenId = "EXM-" + Date.now() + "-" + uniqueSuffix;
    ownershipId = "OWN-" + Utilities.getUuid();

    const ownershipRows = ownership.getDataRange().getValues();
    const duplicate = ownershipRows.slice(1).some(row =>
      String(row[1] || "").trim() === String(scope.institutionId || "").trim() &&
      String(row[2] || "").trim().toUpperCase() === "EXAMEN" &&
      String(row[3] || "").trim() === examenId);
    if (duplicate || examenes.getDataRange().getValues().slice(1).some(row => String(row[0] || "").trim() === examenId)) {
      throw new Error("EXAM_CREATE_ID_COLLISION");
    }

    // Primero se registra la propiedad; nunca se publica un examen sin ownership.
    ownership.appendRow([ownershipId, scope.institutionId, "EXAMEN", examenId,
      departmentId, "ACTIVE", actor.userId, now, now]);
    examenes.appendRow([
      examenId, p.titulo, p.asignatura, p.gradoAsignado, p.seccionAsignada,
      p.fechaLimite, p.tiempoLimite || "", "Inactivo", actor.userId,
      p.parcial || "Primer Parcial"
    ]);

    if (preguntasData.length > 0) {
      const rows = preguntasData.map(row => {
        row[0] = `PRE-${examenId}-${row[0].split("-").pop()}`;
        row[1] = examenId;
        return row;
      });
      preguntas.getRange(preguntas.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
    }
    return { status: "success", examenId, departmentId };
  } catch (error) {
    let rollbackFailed = false;
    const removeMatchingRows = (sheet, column, value) => {
      try {
        const rows = sheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][column] || "").trim() === String(value)) sheet.deleteRow(i + 1);
        }
      } catch (_) { rollbackFailed = true; }
    };
    if (examenId) {
      removeMatchingRows(preguntas, 1, examenId);
      removeMatchingRows(examenes, 0, examenId);
      removeMatchingRows(ownership, 3, examenId);
    }
    if (rollbackFailed) throw new Error("EXAM_CREATE_ROLLBACK_FAILED");
    throw error;
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedExamMutationContext_(payload, action, requestedExamId) {
  const permission = validateRolePermission(action, payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(payload, ss, actor);
  if (!scope.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  const examId = String(requestedExamId || (payload && payload.examenId) || "").trim();
  if (!examId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const examSheet = getSheetOrThrow(ss, "Examenes");
  const examRows = examSheet.getDataRange().getValues();
  const matches = [];
  for (let i = 1; i < examRows.length; i++) {
    if (String(examRows[i][0] || "").trim() === examId) matches.push({ row: examRows[i], rowIndex: i });
  }
  if (matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exam = matches[0];
  if (actor.role === "Profesor" && String(exam.row[8] || "").trim() !== actor.userId) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ownership = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examId, action, payload);
  if (!ownership.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  return { ss, actor, scope, examSheet, exam, examId, ownership };
}

function withAuthorizedExamMutation_(payload, action, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida dentro del lock para evitar TOCTOU.
  const permission = validateRolePermission(action, payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_MUTATION_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedExamMutationContext_(payload, action);
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedExamSubmissionMutationContext_(payload, action) {
  const entregaId = String((payload && (payload.entregaId || payload.entregaExamenId)) || "").trim();
  if (!entregaId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const permission = validateRolePermission(action, payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const deliverySheet = getSheetOrThrow(ss, "EntregasExamen");
  const deliveryRows = deliverySheet.getDataRange().getValues();
  const matches = [];
  for (let i = 1; i < deliveryRows.length; i++) {
    if (String(deliveryRows[i][0] || "").trim() === entregaId) matches.push({ row: deliveryRows[i], rowIndex: i });
  }
  if (matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const delivery = matches[0];
  const examId = String(delivery.row[1] || "").trim();
  if (!examId || (payload && payload.examenId && String(payload.examenId).trim() !== examId)) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const examContext = getAuthorizedExamMutationContext_(payload, action, examId);
  return { ...examContext, deliverySheet, delivery, entregaId };
}

function updateExamStatus(payload) {
  return withAuthorizedExamMutation_(payload, "updateExamStatus", context => updateExamStatusUnlocked_(payload, context));
}

function updateExamStatusUnlocked_(payload, context) {
  const estado = String((payload && payload.estado) || "").trim();
  if (["Activo", "Inactivo"].indexOf(estado) === -1) throw new Error("EXAM_STATUS_INVALID");
  context.examSheet.getRange(context.exam.rowIndex + 1, 8).setValue(estado);
  return { status: "success" };
}

function updateExam(payload) {
  return withAuthorizedExamMutation_(payload, "updateExam", context => updateExamUnlocked_(payload, context));
}

function updateExamUnlocked_(payload, context) {
  const { titulo, asignatura, gradoAsignado, seccionAsignada, fechaLimite, tiempoLimite, parcial } = payload || {};
  const examRow = context.exam.row.slice();
  if (titulo !== undefined) examRow[1] = titulo;
  if (asignatura !== undefined) examRow[2] = asignatura;
  if (gradoAsignado !== undefined) examRow[3] = gradoAsignado;
  if (seccionAsignada !== undefined) examRow[4] = seccionAsignada;
  if (fechaLimite !== undefined) examRow[5] = fechaLimite;
  if (tiempoLimite !== undefined) examRow[6] = tiempoLimite;
  if (parcial !== undefined) examRow[9] = parcial;
  context.examSheet.getRange(context.exam.rowIndex + 1, 1, 1, examRow.length).setValues([examRow]);
  return { status: "success", message: "Examen actualizado." };
}

function deleteExam(payload) {
  return withAuthorizedExamMutation_(payload, "deleteExam", context => deleteExamUnlocked_(payload, context));
}

function deleteExamUnlocked_(payload, context) {
  const entregasSheet = getSheetOrThrow(context.ss, "EntregasExamen");
  const deliveries = entregasSheet.getDataRange().getValues().slice(1);
  const hasSubmissions = deliveries.some(row => String(row[1] || "").trim() === context.examId);
  if (hasSubmissions) {
    context.examSheet.getRange(context.exam.rowIndex + 1, 8).setValue("Inactivo");
    return { status: "success", message: "Examen desactivado (existen entregas)." };
  }

  // Baja lógica: conserva evidencia histórica y desactiva el ownership para
  // que el recurso no vuelva a aparecer en listados ni lecturas.
  const ownershipSheet = getSheetOrThrow(context.ss, "ResourceOwnership");
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  const ownershipMatches = [];
  for (let i = 1; i < ownershipRows.length; i++) {
    const row = ownershipRows[i] || [];
    if (String(row[1] || "").trim() === String(context.scope.institutionId || "").trim() &&
        String(row[2] || "").trim().toUpperCase() === "EXAMEN" &&
        String(row[3] || "").trim() === context.examId &&
        String(row[5] || "").trim().toUpperCase() === "ACTIVE") ownershipMatches.push(i + 1);
  }
  if (ownershipMatches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  // Desactivar primero el ownership: ante un fallo posterior el recurso queda
  // oculto; si la actualización del examen falla, se intenta restaurar ACTIVE.
  ownershipSheet.getRange(ownershipMatches[0], 6).setValue("INACTIVE");
  try {
    context.examSheet.getRange(context.exam.rowIndex + 1, 8).setValue("Eliminado");
  } catch (error) {
    try {
      ownershipSheet.getRange(ownershipMatches[0], 6).setValue("ACTIVE");
    } catch (_) {
      throw new Error("RESOURCE_OWNERSHIP_ROLLBACK_FAILED");
    }
    throw error;
  }
  return { status: "success", message: "Examen eliminado." };
}

function withAuthorizedExamSubmissionMutation_(payload, action, mutation) {
  // Rechazar RBAC e identidad incompleta antes de competir por el lock compartido.
  // El contexto completo se vuelve a validar dentro del lock para evitar TOCTOU.
  const permission = validateRolePermission(action, payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_SUBMISSION_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedExamSubmissionMutationContext_(payload, action);
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function gradeExamSubmission(payload) {
  return withAuthorizedExamSubmissionMutation_(payload, "gradeExamSubmission", context => {
    const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const rawScore = p.calificacion;
    const score = typeof rawScore === "number" ? rawScore :
      (typeof rawScore === "string" && rawScore.trim() ? Number(rawScore) : NaN);
    if (!Number.isFinite(score) || score < 0 || score > 100 ||
        Math.abs(score * 100 - Math.round(score * 100)) > 1e-8) {
      throw new Error("EXAM_GRADE_INVALID");
    }
    const estado = typeof p.estado === "string" ? p.estado.trim() : "";
    const comentario = p.comentario == null ? "" : p.comentario;
    const temaAsociado = p.temaAsociado == null ? "" : p.temaAsociado;
    const asignaturaAsociada = p.asignaturaAsociada == null ? "" : p.asignaturaAsociada;
    if (!estado || estado.length > 50 || typeof comentario !== "string" || comentario.length > 2000 ||
        typeof temaAsociado !== "string" || temaAsociado.length > 120 ||
        typeof asignaturaAsociada !== "string" || asignaturaAsociada.length > 120) {
      throw new Error("EXAM_GRADE_METADATA_INVALID");
    }
    const rowData = context.delivery.row.slice();
    while (rowData.length < 10) rowData.push("");
    rowData[5] = score.toFixed(2);
    rowData[6] = estado;
    rowData[7] = comentario;
    rowData[8] = temaAsociado;
    rowData[9] = asignaturaAsociada;
    context.deliverySheet.getRange(context.delivery.rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
    return { status: "success", message: "Examen calificado." };
  });
}

function getOrCreateExamSubmissionDeletionAuditSheet_(ss) {
  const headers = ["EventoID", "EntregaExamenID", "ExamenID", "EstudianteID", "ActorID",
    "RolActor", "Motivo", "FechaSolicitud", "Estado"];
  let sheet = ss.getSheetByName("HistorialEliminacionesEntregasExamen");
  if (!sheet) {
    sheet = ss.insertSheet("HistorialEliminacionesEntregasExamen");
    sheet.appendRow(headers);
    return sheet;
  }
  const rows = sheet.getDataRange().getValues();
  if (!rows.length || headers.some((header, index) => String(rows[0][index] || "").trim() !== header) ||
      rows[0].length !== headers.length) {
    throw new Error("EXAM_SUBMISSION_DELETION_AUDIT_SCHEMA_INVALID");
  }
  return sheet;
}

function deleteExamSubmission(payload) {
  return withAuthorizedExamSubmissionMutation_(payload, "deleteExamSubmission", context => {
    const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const reason = typeof p.motivo === "string" ? p.motivo.trim() : "";
    if (reason.length < 10 || reason.length > 2000) {
      throw new Error("EXAM_SUBMISSION_DELETION_REASON_INVALID");
    }
    const row = context.delivery.row;
    const deliveryId = String(row[0] || "").trim();
    const examId = String(row[1] || "").trim();
    const studentId = String(row[2] || "").trim();
    if (row.length < 7 || deliveryId !== context.entregaId || examId !== context.examId || !studentId) {
      throw new Error("EXAM_SUBMISSION_SCHEMA_INVALID");
    }

    const auditSheet = getOrCreateExamSubmissionDeletionAuditSheet_(context.ss);
    const eventId = Utilities.getUuid();
    const auditRow = auditSheet.getLastRow() + 1;
    auditSheet.appendRow([eventId, deliveryId, examId, studentId, context.actor.userId,
      context.actor.role, reason, new Date(), "DELETE_REQUESTED"]);
    try {
      context.deliverySheet.deleteRow(context.delivery.rowIndex + 1);
    } catch (error) {
      try {
        auditSheet.getRange(auditRow, 9).setValue("DELETE_FAILED");
      } catch (_) {
        throw new Error("EXAM_SUBMISSION_DELETION_AUDIT_UPDATE_FAILED");
      }
      throw error;
    }
    try {
      auditSheet.getRange(auditRow, 9).setValue("DELETED");
    } catch (_) {
      throw new Error("EXAM_SUBMISSION_DELETION_AUDIT_FINALIZATION_FAILED");
    }
    return { status: "success", message: "Entrega de examen eliminada correctamente.", eventoId: eventId };
  });
}

function getAllExams(payload) {
  return withAuthorizedExamRead_("getAllExams", payload, context => getAllExamsUnlocked_(payload, context));
}
function getAllExamsUnlocked_(payload, context) {
  const { actor, ss, scope } = context;
  const data = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const examIdCounts = Object.create(null);
  data.forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) examIdCounts[id] = (examIdCounts[id] || 0) + 1;
  });
  const filtered = data.filter(row => {
    const examId = String(row[0] || "").trim();
    if (!examId || examIdCounts[examId] !== 1) return false;
    if (actor.role === "Profesor" && String(row[8] || "").trim() !== actor.userId) return false;
    const access = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examId, "LIST", payload);
    return access && access.authorized === true;
  });
  return { status: "success", data: filtered.map(row => {
    const deadline = row[5] ? new Date(row[5]) : null;
    return { examenId: row[0], titulo: row[1], asignatura: row[2], grado: row[3], seccion: row[4],
      fechaLimite: deadline && !isNaN(deadline.getTime()) ? deadline.toISOString() : null,
      estado: row[7], parcial: row[9] || "Primer Parcial" };
  }) };
}

function withAuthorizedExamRead_(action, payload, reader) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_READ_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedExamReadContext_(action, payload);
    return reader(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedExamReadContext_(action, payload) {
  const permission = validateRolePermission(action, payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const requestedStudentId = payload && (payload.studentId || payload.estudianteId || payload.userId);
  const context = getExamReadContext_(payload, requestedStudentId);
  return { ...context, requestedStudentId: String(requestedStudentId || "").trim() };
}

function getStudentExamsUnlocked_(payload, context) {
  const { actor, ss, studentActor, guardianActor, profile, scope } = context;
  const targetId = studentActor || guardianActor ? profile.userId : context.requestedStudentId;
  const targetProfile = studentActor || guardianActor ? profile : getExamStudentProfile_(ss, targetId);
  if (!targetProfile) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exams = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues().slice(1);
  const examIdCounts = {};
  exams.forEach(row => { const id = String(row[0] || "").trim(); if (id) examIdCounts[id] = (examIdCounts[id] || 0) + 1; });
  const data = exams.filter(exam => {
    const examId = String(exam[0] || "").trim();
    if (!examId || examIdCounts[examId] !== 1 || !isExamAssignedToStudent_(exam, targetProfile) ||
        !assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examId, "READ_STUDENT_EXAMS", payload).authorized) return false;
    if (!studentActor && !guardianActor && actor.role === "Profesor" && String(exam[8] || "").trim() !== actor.userId) return false;
    const matchingDeliveries = deliveries.filter(row => String(row[1] || "").trim() === examId && String(row[2] || "").trim() === targetId);
    if (matchingDeliveries.length > 1) return false;
    return String(exam[7] || "") === "Activo" || matchingDeliveries.length === 1;
  }).map(exam => {
    const examId = String(exam[0] || "").trim();
    const deliveryMatches = deliveries.filter(row => String(row[1] || "").trim() === examId && String(row[2] || "").trim() === targetId);
    const delivery = deliveryMatches.length === 1 ? deliveryMatches[0] : null;
    const state = delivery ? delivery[6] : exam[7];
    return { examenId: exam[0], titulo: exam[1], asignatura: exam[2], parcial: exam[9] || "Primer Parcial",
      grado: exam[3], seccion: exam[4], fechaLimite: exam[5] ? new Date(exam[5]).toISOString() : null,
      estado: state, profesorId: exam[8],
      entrega: delivery ? { estado: state, calificacion: state === "Pendiente" ? null : delivery[5], comentario: delivery[7] || "" } : null };
  });
  return { status: "success", data };
}

function getExamQuestionsUnlocked_(payload, context) {
  const examenId = String((payload && payload.examenId) || "").trim();
  if (!examenId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const { actor, ss, studentActor, guardianActor, profile, scope } = context;
  const exams = getSheetOrThrow(ss, "Examenes").getDataRange().getValues();
  const matches = exams.slice(1).filter(row => String(row[0] || "").trim() === examenId);
  if (matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exam = matches[0];
  if (studentActor || guardianActor) {
    if (!isExamAssignedToStudent_(exam, profile) || !assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId, "READ_QUESTIONS", payload).authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
    const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues().slice(1);
    const ownDeliveries = deliveries.filter(row => String(row[1] || "").trim() === examenId && String(row[2] || "").trim() === profile.userId);
    if (ownDeliveries.length > 1 || (String(exam[7] || "") !== "Activo" && ownDeliveries.length !== 1)) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    if (actor.role === "Profesor" && String(exam[8] || "").trim() !== actor.userId) throw new Error("RESOURCE_NOT_AVAILABLE");
    if (!assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId, "READ_QUESTIONS", payload).authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const questionRows = getSheetOrThrow(ss, "PreguntasExamen").getDataRange().getValues().slice(1)
    .filter(row => String(row[1] || "").trim() === examenId);
  const questionIdCounts = {};
  questionRows.forEach(row => { const id = String(row[0] || "").trim(); if (id) questionIdCounts[id] = (questionIdCounts[id] || 0) + 1; });
  const questions = questionRows.filter(row => String(row[0] || "").trim() && questionIdCounts[String(row[0]).trim()] === 1)
    .map(row => ({ preguntaId: row[0], tipo: row[2], texto: row[3], opciones: JSON.parse(row[4] || "{}") }));
  return { status: "success", data: { titulo: exam[1], tiempoLimite: exam[6], preguntas: questions } };
}

function getExamQuestions(payload) {
  return withAuthorizedExamRead_("getExamQuestions", payload, context => getExamQuestionsUnlocked_(payload, context));
}

// [F9-Task14] [P1] - Mejorar el rendimiento, la persistencia y la recuperación de operaciones de calificación
function getGradingPerformanceAndPersistenceMetrics(payload) {
  return withAuthorizedExamRead_("getGradingPerformanceAndPersistenceMetrics", payload,
    context => getGradingPerformanceAndPersistenceMetricsUnlocked_(payload, context));
}

function getGradingPerformanceAndPersistenceMetricsUnlocked_(payload, context) {
  const actor = context && context.actor;
  const scope = context && context.scope;
  if (!actor || ["Administrador", "Desarrollador"].indexOf(String(actor.role || "").trim()) === -1 ||
      !scope || scope.institutionWide !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const startTime = Date.now();
  const ss = context.ss;
  const sheetsToMonitor = [
    "CalificacionesEstudiantes",
    "CategoriasEvaluacion",
    "HistorialRectificacionesNotas",
    "CierresPeriodos",
    "RecuperacionesEstudiante",
    "EvaluacionesCompetencias"
  ];

  const metrics = [];
  let totalRowsAcrossAllSheets = 0;

  sheetsToMonitor.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    const rowCount = sheet ? sheet.getLastRow() : 0;
    totalRowsAcrossAllSheets += rowCount;
    metrics.push({
      sheetName,
      exists: !!sheet,
      rowCount,
      status: rowCount > 10000 ? "RIESGO_ELEVADO" : (rowCount > 3000 ? "ADVERTENCIA" : "NORMAL")
    });
  });

  const queryLatencyMs = Date.now() - startTime;
  let nivelAlertaGrading = "NORMAL";
  let recomendacion = "El volumen de datos y rendimiento de persistencia se encuentran dentro de los parámetros óptimos para Google Sheets.";

  if (totalRowsAcrossAllSheets > 15000 || queryLatencyMs > 2500) {
    nivelAlertaGrading = "CRITICO";
    recomendacion = "El volumen de calificaciones supera las 15,000 filas o la latencia es alta. Se recomienda migrar el almacenamiento de notas a una base de datos relacional (PostgreSQL/Cloud SQL).";
  } else if (totalRowsAcrossAllSheets > 5000 || queryLatencyMs > 1000) {
    nivelAlertaGrading = "ADVERTENCIA";
    recomendacion = "El volumen de calificaciones se aproxima a los límites recomendados para operaciones en tiempo real. Utilizar procesamiento en lotes e índices de memoria.";
  }

  return {
    status: "success",
    servicio: "EXAM_SERVICE",
    nivelAlertaGrading,
    latenciaLecturaMs: queryLatencyMs,
    totalFilasCalificaciones: totalRowsAcrossAllSheets,
    metricasHojas: metrics,
    mecanismosResiliencia: {
      lotesPermitidos: true,
      idempotenciaCaches: true,
      deteccionDuplicados: true
    },
    recomendacion
  };
}

// [F8-Task25] [TAREA-F8-OPT-02] - Estadísticas descriptivas y distribución de calificaciones de exámenes
function getExamGradeDistributionAnalytics(payload) {
  return withAuthorizedExamRead_("getExamGradeDistributionAnalytics", payload,
    context => getExamGradeDistributionAnalyticsUnlocked_(payload, context));
}
function getExamGradeDistributionAnalyticsUnlocked_(payload, context) {
  const examenId = String(payload && payload.examenId || "").trim();
  if (!examenId) throw new Error("examenId es requerido para generar la analítica de distribución de calificaciones.");
  const { actor, ss, scope } = context;
  const examRows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const examIdCounts = Object.create(null);
  examRows.forEach(row => { const id = String(row[0] || "").trim(); if (id) examIdCounts[id] = (examIdCounts[id] || 0) + 1; });
  if (examIdCounts[examenId] !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const examRow = examRows.find(row => String(row[0] || "").trim() === examenId);
  if (!examRow || (actor.role === "Profesor" && String(examRow[8] || "").trim() !== actor.userId)) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ownership = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId, "READ_ANALYTICS", payload);
  if (!ownership || ownership.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const deliveryRows = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues().slice(1);
  const deliveryIdCounts = Object.create(null);
  deliveryRows.forEach(row => { const id = String(row[0] || "").trim(); if (id) deliveryIdCounts[id] = (deliveryIdCounts[id] || 0) + 1; });
  const evaluados = [];
  let pendientesCount = 0;
  deliveryRows.forEach(row => {
    const deliveryId = String(row[0] || "").trim();
    if (!deliveryId || deliveryIdCounts[deliveryId] !== 1 || String(row[1] || "").trim() !== examenId) return;
    const estado = String(row[6] || "").trim(), notaRaw = row[5];
    if (estado === "Pendiente" && (notaRaw === "" || notaRaw === null || notaRaw === undefined)) { pendientesCount++; return; }
    const notaNum = parseFloat(notaRaw);
    if (Number.isFinite(notaNum)) evaluados.push(notaNum);
    else if (estado === "Pendiente") pendientesCount++;
  });
  const totalEvaluados = evaluados.length;
  if (totalEvaluados === 0) return {
    status: "success", sinDatos: true, mensaje: "No hay calificaciones registradas aún para este examen.",
    data: { examenId, titulo: examRow[1], asignatura: examRow[2], grado: examRow[3], seccion: examRow[4],
      parcial: examRow[9] || "Primer Parcial", totalEvaluados: 0, totalPendientes: pendientesCount,
      promedio: 0, mediana: 0, minimo: 0, maximo: 0, desviacionEstandar: 0, porcentajeAprobacion: 0,
      intervalos: [
        { rango: "0 - 59", etiqueta: "Insuficiente", cantidad: 0, porcentaje: 0 },
        { rango: "60 - 69", etiqueta: "Suficiente", cantidad: 0, porcentaje: 0 },
        { rango: "70 - 79", etiqueta: "Bueno", cantidad: 0, porcentaje: 0 },
        { rango: "80 - 89", etiqueta: "Muy Bueno", cantidad: 0, porcentaje: 0 },
        { rango: "90 - 100", etiqueta: "Sobresaliente", cantidad: 0, porcentaje: 0 }
      ], curvaNormal: [] }
  };
  evaluados.sort((x, y) => x - y);
  const suma = evaluados.reduce((acc, val) => acc + val, 0);
  const promedio = parseFloat((suma / totalEvaluados).toFixed(2));
  const mid = Math.floor(totalEvaluados / 2);
  const mediana = totalEvaluados % 2 === 0
    ? parseFloat(((evaluados[mid - 1] + evaluados[mid]) / 2).toFixed(2))
    : parseFloat(evaluados[mid].toFixed(2));
  const minimo = parseFloat(evaluados[0].toFixed(2)), maximo = parseFloat(evaluados[totalEvaluados - 1].toFixed(2));
  const varianza = evaluados.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / totalEvaluados;
  const desviacionEstandar = parseFloat(Math.sqrt(varianza).toFixed(2));
  const aprobadosCount = evaluados.filter(n => n >= 60).length;
  const porcentajeAprobacion = parseFloat(((aprobadosCount / totalEvaluados) * 100).toFixed(2));
  let c0_59 = 0, c60_69 = 0, c70_79 = 0, c80_89 = 0, c90_100 = 0;
  evaluados.forEach(n => { if (n < 60) c0_59++; else if (n < 70) c60_69++; else if (n < 80) c70_79++; else if (n < 90) c80_89++; else c90_100++; });
  const intervalos = [
    { rango: "0 - 59", etiqueta: "Insuficiente", cantidad: c0_59, porcentaje: parseFloat(((c0_59 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "60 - 69", etiqueta: "Suficiente", cantidad: c60_69, porcentaje: parseFloat(((c60_69 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "70 - 79", etiqueta: "Bueno", cantidad: c70_79, porcentaje: parseFloat(((c70_79 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "80 - 89", etiqueta: "Muy Bueno", cantidad: c80_89, porcentaje: parseFloat(((c80_89 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "90 - 100", etiqueta: "Sobresaliente", cantidad: c90_100, porcentaje: parseFloat(((c90_100 / totalEvaluados) * 100).toFixed(1)) }
  ];
  const curvaNormal = [];
  if (desviacionEstandar > 0) for (let x = 0; x <= 100; x += 10) {
    const exponente = -0.5 * Math.pow((x - promedio) / desviacionEstandar, 2);
    const densidad = (1 / (desviacionEstandar * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
    curvaNormal.push({ x, y: parseFloat((densidad * totalEvaluados * 10).toFixed(2)) });
  }
  return { status: "success", sinDatos: false, data: {
    examenId, titulo: examRow[1], asignatura: examRow[2], grado: examRow[3], seccion: examRow[4],
    parcial: examRow[9] || "Primer Parcial", totalEvaluados, totalPendientes: pendientesCount,
    promedio, mediana, minimo, maximo, desviacionEstandar, porcentajeAprobacion, intervalos, curvaNormal
  }};
}
// [TAREA-F7-IMP-07] [Fase 7: Planificación Académica, Horarios y Recursos] - Validación de sobrecarga de evaluaciones por sección y conflictos de agenda.
function checkExamSchedulingConflict(payload) {
  return withAuthorizedExamRead_("checkExamSchedulingConflict", payload,
    context => checkExamSchedulingConflictUnlocked_(payload, context));
}

function checkExamSchedulingConflictUnlocked_(payload, context) {
  const { seccionAsignada, fechaLimite, examenId, maxExamenesPorDia } = payload || {};
  if (!String(seccionAsignada || "").trim() || !fechaLimite) {
    return { status: "success", hasConflict: false };
  }
  const dateKey = value => {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return "";
      const y = value.getFullYear(), m = value.getMonth() + 1, d = value.getDate();
      return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    }
    const raw = String(value || "").trim();
    const match = /^(\d{4}-\d{2}-\d{2})(?:$|[T ])/.exec(raw);
    if (!match) return "";
    const parts = match[1].split("-").map(Number);
    const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (check.getUTCFullYear() !== parts[0] || check.getUTCMonth() + 1 !== parts[1] ||
        check.getUTCDate() !== parts[2]) return "";
    return match[1];
  };
  const dateTarget = dateKey(fechaLimite);
  if (!dateTarget) throw new Error("EXAM_SCHEDULE_DATE_INVALID");
  const limitMax = maxExamenesPorDia === undefined || maxExamenesPorDia === null || maxExamenesPorDia === ""
    ? 2 : Number(maxExamenesPorDia);
  if (!Number.isSafeInteger(limitMax) || limitMax < 1 || limitMax > 100) {
    throw new Error("EXAM_SCHEDULE_LIMIT_INVALID");
  }
  const { ss, actor, scope } = context;
  const rows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const idCounts = {};
  rows.forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const section = normalizeString(seccionAsignada);
  const excludedId = String(examenId || "").trim();
  let examenesCount = 0;
  rows.forEach(row => {
    const id = String(row[0] || "").trim();
    if (!id || idCounts[id] !== 1 || id === excludedId) return;
    const status = String(row[7] || "").trim().toUpperCase();
    if (status === "INACTIVO" || status === "CANCELADO") return;
    if (actor.role === "Profesor" && String(row[8] || "").trim() !== actor.userId) return;
    const sameSection = normalizeString(row[4]) === section || normalizeString(row[3]) === section;
    if (!sameSection || dateKey(row[5]) !== dateTarget) return;
    const ownership = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", id,
      "CHECK_SCHEDULING_CONFLICT", payload);
    if (!ownership || ownership.authorized !== true) return;
    examenesCount++;
  });
  if (examenesCount >= limitMax) {
    return { status: "success", hasConflict: true,
      reason: `Sobrecarga evaluativa: La sección ${seccionAsignada} ya tiene ${examenesCount} evaluacion(es) programada(s) para el ${dateTarget} (Límite máximo: ${limitMax}/día).`,
      examenesCount, limitMax };
  }
  return { status: "success", hasConflict: false, examenesCount, limitMax };
}

// [TAREA-F7-IMP-07] [Fase 7: Planificación Académica, Horarios y Recursos] - Simulación de reprogramación de evaluaciones previa confirmación oficial.
function simulateExamReschedule(payload) {
  return withAuthorizedExamRead_("simulateExamReschedule", payload,
    context => simulateExamRescheduleUnlocked_(payload, context));
}

function simulateExamRescheduleUnlocked_(payload, context) {
  const input = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const examenId = String(input.examenId || "").trim();
  const nuevaFecha = input.nuevaFecha;
  if (!examenId || !nuevaFecha) throw new Error("EXAM_RESCHEDULE_INPUT_INVALID");

  const { actor, ss, scope } = context;
  const rows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const matches = rows.filter(row => String(row[0] || "").trim() === examenId);
  if (matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const examRow = matches[0];

  if (actor.role === "Profesor" && String(examRow[8] || "").trim() !== actor.userId) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ownership = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId,
    "SIMULATE_EXAM_RESCHEDULE", input);
  if (!ownership || ownership.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");

  const seccionTarget = String(input.nuevaSeccion || examRow[4] || "").trim();
  if (!seccionTarget) throw new Error("EXAM_RESCHEDULE_SECTION_INVALID");
  const conflictCheck = checkExamSchedulingConflictUnlocked_({
    seccionAsignada: seccionTarget,
    fechaLimite: nuevaFecha,
    examenId,
    maxExamenesPorDia: 2
  }, context);

  logStructuredEvent("EXAM", "simulateExamReschedule", "INFO", "EXAM_RESCHEDULE_SIMULATED",
    `Simulación de reprogramación para examen ${examenId}`,
    { examenId, nuevaFecha, tieneConflicto: conflictCheck.hasConflict }, actor.role);

  return {
    status: "success",
    simulacion: {
      examenId,
      titulo: examRow[1],
      asignatura: examRow[2],
      seccionOriginal: examRow[4],
      seccionDestino: seccionTarget,
      fechaOriginal: examRow[5],
      fechaPropuesta: nuevaFecha,
      tieneConflicto: conflictCheck.hasConflict,
      motivoConflicto: conflictCheck.reason || null
    }
  };
}

// [TAREA-F4-P1-08] [Fase 4: Propagación y Recuperación de Cambios de Seguridad] - Purga de cachés de seguridad local
function purgeSecurityCaches(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const permission = validateRolePermission("purgeSecurityCaches", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const eventType = String(p.eventType || "GENERIC_PURGE").trim();
  const targetUserId = p.targetUserId;
  const targetRole = p.targetRole;
  const sessionId = p.sessionId;

  try {
    const cache = CacheService.getScriptCache();
    if (targetUserId) {
      cache.remove("user_role_" + targetUserId);
      cache.remove("acct_state_" + targetUserId);
      cache.remove("delegations_" + targetUserId);
    }
    if (targetRole) {
      cache.remove("perm_matrix_" + targetRole);
      cache.remove("dynamic_perms_" + targetRole);
    }
    if (sessionId) {
      if (eventType === "SESSION_REVOKED") {
        cache.put("revoked_session_" + sessionId, "REVOKED", 86400);
      } else {
        cache.remove("revoked_session_" + sessionId);
      }
    }
    if (eventType === "SESSION_REVOKED" || eventType === "ACCOUNT_STATE_CHANGED") {
      if (targetUserId && p.accountState && p.accountState !== "Activa") {
        cache.put("revoked_user_" + targetUserId, "REVOKED", 86400);
      } else if (targetUserId && p.accountState === "Activa") {
        cache.remove("revoked_user_" + targetUserId);
      }
    }

    return {
      status: "success",
      service: "EXAM",
      eventType: eventType,
      targetUserId: targetUserId || null,
      targetRole: targetRole || null,
      message: "Cachés de seguridad purgadas en el microservicio EXAM.",
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    console.error("Error al purgar cachés de seguridad en EXAM: ", e);
    return {
      status: "error",
      service: "EXAM",
      message: "Error al purgar cachés: " + e.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

function submitExam(payload) {
  const permission = validateRolePermission("submitExam", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  const role = String(actor && actor.role || "").trim();
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      (role !== "Estudiante" && role !== "Alumno")) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_SUBMISSION_LOCK_TIMEOUT");
  try {
    return submitExamUnlocked_(payload);
  } finally {
    lock.releaseLock();
  }
}

function submitExamUnlocked_(payload) {
  const examenId = String((payload && payload.examenId) || "").trim();
  const respuestas = payload && payload.respuestas;
  if (!examenId || !Array.isArray(respuestas)) throw new Error("SUBMISSION_INVALID");
  const context = getExamReadContext_(payload);
  const { actor, ss, studentActor, profile, scope } = context;
  if (!studentActor || actor.role !== "Estudiante" && actor.role !== "Alumno") throw new Error("RESOURCE_NOT_AVAILABLE");
  const examRows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues();
  const examMatches = examRows.slice(1).filter(row => String(row[0]) === examenId);
  if (examMatches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exam = examMatches[0];
  if (String(exam[7] || "") !== "Activo" || !isExamAssignedToStudent_(exam, profile) ||
      !assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId, "SUBMIT", payload).authorized) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const questionRows = getSheetOrThrow(ss, "PreguntasExamen").getDataRange().getValues().slice(1)
    .filter(row => String(row[1]) === examenId);
  const questionIds = new Set(questionRows.map(row => String(row[0])));
  const submittedIds = new Set();
  respuestas.forEach(answer => {
    const questionId = String(answer && answer.preguntaId || "").trim();
    if (!questionId || !questionIds.has(questionId) || submittedIds.has(questionId)) {
      throw new Error("SUBMISSION_INVALID");
    }
    submittedIds.add(questionId);
  });
  const deliveriesSheet = getSheetOrThrow(ss, "EntregasExamen");
  const deliveries = deliveriesSheet.getDataRange().getValues().slice(1);
  const previousAttempts = deliveries.filter(row => String(row[1]) === examenId && String(row[2]) === actor.userId).length;
  const configuredAttempts = parseInt(exam[12], 10);
  const allowedAttempts = Number.isSafeInteger(configuredAttempts) && configuredAttempts > 0 ? configuredAttempts : 1;
  if (previousAttempts >= allowedAttempts) throw new Error("EXAM_ATTEMPTS_EXHAUSTED");
  let correctas = 0;
  respuestas.forEach(answer => {
    const question = questionRows.find(row => String(row[0]) === String(answer.preguntaId));
    let points = 0;
    if (question[2] === "termino_pareado") {
      try {
        const studentMap = JSON.parse(answer.respuestaEstudiante || "{}");
        const correctMap = JSON.parse(question[5] || "{}");
        const total = Object.keys(correctMap).length;
        let hits = 0;
        for (const key in correctMap) if (studentMap[key] === correctMap[key]) hits++;
        points = total > 0 ? hits / total : 0;
      } catch (_) { points = 0; }
    } else {
      const isText = question[2] === "completacion" || question[2] === "verdadero_falso";
      const matches = isText
        ? normalizeString(answer.respuestaEstudiante) === normalizeString(question[5])
        : answer.respuestaEstudiante === question[5];
      points = matches ? 1 : 0;
    }
    correctas += points;
  });
  const nota = questionRows.length ? ((correctas / questionRows.length) * 100).toFixed(2) : "0";
  const entregaExamenId = "EEX-" + Date.now();
  deliveriesSheet.appendRow([entregaExamenId, examenId, actor.userId, new Date(), JSON.stringify(respuestas), nota, "Pendiente"]);
  return { status: "success", data: { entregaExamenId, calificacion: nota } };
}

function getExamStudentProfile_(ss, studentId) {
  const id = String(studentId || "").trim(); if (!id) return null;
  const rows = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues();
  const matches = rows.slice(1).filter(row => String(row[0] || "").trim() === id);
  if (matches.length !== 1) return null;
  return { userId: id, grado: String(matches[0][2] || "").trim(), seccion: String(matches[0][3] || "").trim(),
    role: String(matches[0][6] || "Estudiante").trim() };
}
function isExamAssignedToStudent_(examRow, studentProfile) {
  if (!examRow || !studentProfile || !studentProfile.grado || !studentProfile.seccion) return false;
  const grade = String(examRow[3] || "").trim().toLowerCase();
  const section = String(examRow[4] || "").trim();
  return grade === studentProfile.grado.toLowerCase() &&
    (!section || section.toLowerCase() === "todas" || isInTeacherList(studentProfile.seccion, section));
}
function getVerifiedGuardianStudentIds_(ss, tutorUserId) {
  const tutorId = String(tutorUserId || "").trim();
  if (!tutorId) return [];
  const statusAllowed = value => ["VERIFICADA", "ACTIVA", "APROBADA"].indexOf(String(value || "").trim().toUpperCase()) !== -1;
  const expSheet = ss && ss.getSheetByName("ExpedientesEstudiantes");
  const expRows = expSheet ? expSheet.getDataRange().getValues().slice(1) : [];
  const expToUser = {};
  expRows.forEach(row => { if (row[0]) expToUser[String(row[0]).trim()] = String(row[1] || row[0]).trim(); });
  const familySheet = ss && ss.getSheetByName("RelacionesFamiliares");
  const familyRows = familySheet ? familySheet.getDataRange().getValues().slice(1) : [];
  const primaryTutorRows = familyRows.filter(row => String(row[2] || "").trim() === tutorId);
  let studentIds = primaryTutorRows.filter(row => statusAllowed(row[4]))
    .map(row => expToUser[String(row[1] || "").trim()] || String(row[1] || "").trim()).filter(Boolean);
  // El esquema legado solo se consulta si el tutor no tiene ninguna fila en la fuente primaria.
  // Una relación revocada/pendiente en RelacionesFamiliares nunca se reactiva por fallback.
  if (!primaryTutorRows.length) {
    const legacySheet = ss && ss.getSheetByName("RelacionesEstudianteTutor");
    const legacyRows = legacySheet ? legacySheet.getDataRange().getValues().slice(1) : [];
    studentIds = legacyRows.filter(row => String(row[2] || "").trim() === tutorId && statusAllowed(row[9]))
      .map(row => String(row[1] || "").trim()).filter(Boolean);
  }
  return Array.from(new Set(studentIds));
}
function getExamReadContext_(payload, requestedStudentId) {
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID), role = String(actor.role || "").trim();
  const studentActor = role === "Estudiante" || role === "Alumno";
  const guardianActor = ["Tutor", "Padre", "Responsable"].indexOf(role) !== -1;
  const targetStudentId = studentActor ? actor.userId : (guardianActor ? String(requestedStudentId || "").trim() : "");
  const profile = studentActor || guardianActor ? getExamStudentProfile_(ss, targetStudentId) : null;
  if ((studentActor || guardianActor) && !profile) throw new Error("RESOURCE_NOT_AVAILABLE");
  if (guardianActor && getVerifiedGuardianStudentIds_(ss, actor.userId).indexOf(targetStudentId) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const scopeIdentity = studentActor || guardianActor
    ? { authorized: true, userId: profile.userId, role: profile.role || "Estudiante" }
    : actor;
  const scope = getVerifiedExamDepartmentScope_(payload, ss, scopeIdentity);
  if (!scope.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  return { actor, ss, role, studentActor, guardianActor, profile, scope };
}

// [TAREA-F4-P0-02] [Fase 4: Protección IDOR y ABAC] - Aislamiento estricto de evaluaciones por estudiante
function getStudentExams(payload) {
  return withAuthorizedExamRead_("getStudentExams", payload, context => getStudentExamsUnlocked_(payload, context));
}

function getExamResult(payload) {
  return withAuthorizedExamResultRead_(payload, context => getExamResultUnlocked_(payload, context));
}

function withAuthorizedExamResultRead_(payload, reader) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_RESULT_READ_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedExamResultReadContext_(payload);
    return reader(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedExamResultReadContext_(payload) {
  const permission = validateRolePermission("getExamResult", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const deliveryId = String((payload && payload.entregaExamenId) || "").trim();
  if (!deliveryId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues();
  const matches = deliveries.slice(1).filter(row => String(row[0] || "").trim() === deliveryId);
  if (matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const requestedStudentId = String(matches[0][2] || "").trim();
  const context = getExamReadContext_(payload, requestedStudentId);
  return { ...context, ss, deliveryId };
}

function getExamResultUnlocked_(payload, context) {
  const { actor, ss, studentActor, guardianActor, profile, scope, deliveryId } = context;
  const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues();
  const deliveryMatches = deliveries.slice(1).filter(row => String(row[0] || "").trim() === deliveryId);
  if (deliveryMatches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const delivery = deliveryMatches[0], examId = String(delivery[1] || "").trim();
  if (!examId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const examRows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues();
  const examMatches = examRows.slice(1).filter(row => String(row[0] || "").trim() === examId);
  if (examMatches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exam = examMatches[0];
  if (studentActor || guardianActor) {
    if (String(delivery[2] || "").trim() !== profile.userId || String(delivery[6] || "") === "Pendiente" ||
        !assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examId, "READ_RESULT", payload).authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    if (actor.role === "Profesor" && String(exam[8] || "").trim() !== actor.userId) throw new Error("RESOURCE_NOT_AVAILABLE");
    if (!assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examId, "READ_RESULT", payload).authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const answers = JSON.parse(delivery[4] || "[]");
  const questions = getSheetOrThrow(ss, "PreguntasExamen").getDataRange().getValues().slice(1).filter(row => String(row[1]) === examId);
  const detailed = questions.map(question => {
    const answer = answers.find(item => item.preguntaId === question[0]), studentAnswer = answer ? answer.respuestaEstudiante : "";
    let correct = false, score = 0;
    if (question[2] === "termino_pareado") {
      try { const studentMap = JSON.parse(studentAnswer || "{}"), correctMap = JSON.parse(question[5] || "{}");
        const total = Object.keys(correctMap).length; let hits = 0;
        for (const key in correctMap) if (studentMap[key] === correctMap[key]) hits++;
        correct = hits === total; score = total > 0 ? hits / total : 0;
      } catch (_) {}
    } else if (question[2] === "completacion" || question[2] === "verdadero_falso") {
      correct = normalizeString(studentAnswer) === normalizeString(question[5]); score = correct ? 1 : 0;
    } else { correct = studentAnswer === question[5]; score = correct ? 1 : 0; }
    return { texto: question[3], tipo: question[2], respuestaEstudiante: studentAnswer, respuestaCorrecta: question[5],
      esCorrecta: correct, score: (score * 100).toFixed(0) + "%" };
  });
  return { status: "success", data: { examenTitulo: exam[1], calificacionTotal: delivery[5], resultadosDetallados: detailed } };
}
function getTeacherExamActivity(payload) {
  return withAuthorizedExamRead_("getTeacherExamActivity", payload, context => getTeacherExamActivityUnlocked_(payload, context));
}
function getTeacherExamActivityUnlocked_(payload, context) {
  const { actor, ss, scope } = context;
  const userRows = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues().slice(1);
  const examRows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const deliveryRows = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues().slice(1);
  const examIdCounts = Object.create(null), examById = Object.create(null);
  examRows.forEach(row => {
    const id = String(row[0] || "").trim();
    if (!id) return;
    examIdCounts[id] = (examIdCounts[id] || 0) + 1;
    examById[id] = row;
  });
  const userIdCounts = Object.create(null), userById = Object.create(null);
  userRows.forEach(row => {
    const id = String(row[0] || "").trim();
    if (!id) return;
    userIdCounts[id] = (userIdCounts[id] || 0) + 1;
    userById[id] = row;
  });
  const deliveryIdCounts = Object.create(null);
  deliveryRows.forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) deliveryIdCounts[id] = (deliveryIdCounts[id] || 0) + 1;
  });
  const submissions = [];
  deliveryRows.forEach(delivery => {
    const deliveryId = String(delivery[0] || "").trim();
    const examId = String(delivery[1] || "").trim();
    const studentId = String(delivery[2] || "").trim();
    if (!deliveryId || deliveryIdCounts[deliveryId] !== 1 || !examId || examIdCounts[examId] !== 1) return;
    const exam = examById[examId];
    if (!exam) return;
    if (actor.role === "Profesor" && String(exam[8] || "").trim() !== actor.userId) return;
    const ownership = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examId, "READ_SUBMISSIONS", payload);
    if (!ownership || ownership.authorized !== true) return;
    const usuario = userIdCounts[studentId] === 1 ? userById[studentId] : null;
    if (usuario) {
      if (payload && payload.grado && !isInTeacherList(usuario[2], payload.grado)) return;
      if (payload && payload.seccion && !isInTeacherList(usuario[3], payload.seccion)) return;
    }
    const fecha = new Date(delivery[3]);
    if (isNaN(fecha.getTime())) return;
    submissions.push({ tipo: "Examen", entregaId: delivery[0], examenId: delivery[1], titulo: exam[1],
      alumnoId: delivery[2], alumnoNombre: usuario ? usuario[1] : "Usuario Desconocido",
      email: usuario ? usuario[4] : "N/A", grado: usuario ? usuario[2] : "N/A",
      seccion: usuario ? usuario[3] : "N/A", asignatura: exam[2] || "N/A",
      parcial: exam[9] || "Primer Parcial", fecha, calificacion: delivery[5],
      estado: delivery[6], comentario: delivery[7] || "" });
  });
  submissions.sort((a, b) => b.fecha - a.fecha);
  return { status: "success", data: submissions.map(item => ({ ...item, fecha: item.fecha.toISOString() })) };
}

function isInTeacherList(value, listString) {
  if (!listString || String(listString).trim() === "") return true;
  if (!value) return false;
  const sValue = normalizeString(value);
  const sList = normalizeString(listString);
  const list = sList.split(',').map(s => s.trim());
  return list.includes(sValue);
}

// --- FUNCIONES EVALUACIÓN ACADÉMICA Y LIBRO DE CALIFICACIONES (FASE 6) ---

function getEvaluationCategories(payload) {
  return withAuthorizedExamMetadataRead_("getEvaluationCategories", payload,
    context => getEvaluationCategoriesUnlocked_(context));
}

function withAuthorizedExamMetadataRead_(action, payload, reader) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_METADATA_READ_LOCK_TIMEOUT");
  try {
    const permission = validateRolePermission(action, payload);
    if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    const actor = getVerifiedExamIdentity_(payload);
    const allowedRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría",
      "Profesor", "Estudiante", "Alumno", "Tutor", "Padre", "Responsable"];
    if (!actor || actor.authorized !== true || !actor.userId ||
        allowedRoles.indexOf(String(actor.role || "").trim()) === -1) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const scope = getVerifiedExamDepartmentScope_(payload, ss, actor);
    if (!scope || scope.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    return reader({ actor, ss, scope });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getEvaluationCategoriesUnlocked_(context) {
  const ss = context && context.ss;
  if (!ss) throw new Error("RESOURCE_NOT_AVAILABLE");
  const sheet = ss.getSheetByName("CategoriasEvaluacion");
  const data = sheet ? sheet.getDataRange().getValues() : [];
  const defaultCats = [
    ["CAT-1", "Tareas y Trabajos", "Global", 35, "100", "Activo"],
    ["CAT-2", "Exámenes y Pruebas", "Global", 40, "100", "Activo"],
    ["CAT-3", "Proyectos e Investigaciones", "Global", 15, "100", "Activo"],
    ["CAT-4", "Practicas y Participacion", "Global", 10, "100", "Activo"]
  ];
  if (data.length <= 1) {
    return {
      status: "success",
      data: defaultCats.map(c => ({
        categoriaId: c[0], nombre: c[1], ambito: c[2], porcentajePonderacion: c[3], escalaId: c[4], estado: c[5]
      }))
    };
  }
  const expectedHeaders = ["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"];
  if (expectedHeaders.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("EVALUATION_CATEGORIES_SCHEMA_INVALID");
  }

  const ownershipSheet = ss.getSheetByName("ResourceOwnership");
  const ownershipRows = ownershipSheet ? ownershipSheet.getDataRange().getValues() : [];
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  if (ownershipRows.length && ownershipHeaders.some((header, index) =>
      String(ownershipRows[0][index] || "").trim() !== header)) {
    throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  }
  const scope = context.scope || {};
  const ownedCategories = Object.create(null);
  ownershipRows.slice(1).forEach(row => {
    if (String(row[2] || "").trim().toUpperCase() !== "CATEGORIA_EVALUACION") return;
    const id = String(row[3] || "").trim();
    if (!id) return;
    if (!ownedCategories[id]) ownedCategories[id] = [];
    ownedCategories[id].push(row);
  });
  const idCounts = Object.create(null);
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const categories = [];
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (!id || idCounts[id] !== 1) return;
    const owners = ownedCategories[id];
    if (owners && owners.length) {
      if (owners.length !== 1) return;
      const owner = owners[0];
      const departmentId = String(owner[4] || "").trim();
      const visible = String(owner[5] || "").trim().toUpperCase() === "ACTIVE" &&
        String(owner[1] || "").trim() === String(scope.institutionId || "").trim() &&
        !!departmentId && (scope.institutionWide === true ||
          (scope.departmentIds || []).some(value => String(value || "").trim() === departmentId));
      if (!visible) return;
    }
    categories.push({
      categoriaId: row[0],
      nombre: row[1],
      ambito: row[2] || "Global",
      porcentajePonderacion: parseFloat(row[3]) || 0,
      escalaId: row[4] || "100",
      estado: row[5] || "Activo"
    });
  });
  return { status: "success", data: categories };
}

// [F9-Task03] [P0] - Consolidar la administración de escalas, ponderaciones y métodos de cálculo académico
function saveEvaluationCategory(payload) {
  return withAuthorizedEvaluationCategoryMutation_(payload, context =>
    saveEvaluationCategoryUnlocked_(payload, context));
}

function withAuthorizedEvaluationCategoryMutation_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto de categoría, scope y ownership se revalida dentro del lock.
  const permission = validateRolePermission("saveEvaluationCategory", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EVALUATION_CATEGORY_MUTATION_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedEvaluationCategoryMutationContext_(payload);
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedEvaluationCategoryMutationContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const permission = validateRolePermission("saveEvaluationCategory", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  if (!ownershipRows.length || ownershipHeaders.some((header, index) =>
      String(ownershipRows[0][index] || "").trim() !== header)) {
    throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  }

  const categoryHeaders = ["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"];
  const existingSheet = ss.getSheetByName("CategoriasEvaluacion");
  const requestedId = String(p.categoriaId || "").trim();
  if (requestedId && !existingSheet) throw new Error("RESOURCE_NOT_AVAILABLE");
  let categoryRows = existingSheet ? existingSheet.getDataRange().getValues() : [];
  if (categoryRows.length && categoryHeaders.some((header, index) =>
      String(categoryRows[0][index] || "").trim() !== header)) {
    throw new Error("EVALUATION_CATEGORIES_SCHEMA_INVALID");
  }
  const matches = requestedId ? categoryRows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
    .filter(item => String(item.row[0] || "").trim() === requestedId) : [];
  if (requestedId && matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");

  let ownership = null, departmentId = "";
  if (requestedId) {
    const check = assertExamResourceOwnershipForScope_(ss, scope, "CATEGORIA_EVALUACION", requestedId, "UPDATE", p);
    if (!check || check.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    const owned = ownershipRows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
      .filter(item => String(item.row[1] || "").trim() === String(scope.institutionId).trim() &&
        String(item.row[2] || "").trim().toUpperCase() === "CATEGORIA_EVALUACION" &&
        String(item.row[3] || "").trim() === requestedId &&
        String(item.row[5] || "").trim().toUpperCase() === "ACTIVE");
    if (owned.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
    ownership = owned[0];
    departmentId = String(ownership.row[4] || "").trim();
    if (!departmentId) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    const requestedDepartmentId = String(p.departmentId || p.departamentoId || "").trim();
    departmentId = requestedDepartmentId ||
      ((scope.departmentIds || []).length === 1 ? String(scope.departmentIds[0] || "").trim() : "");
    if (!departmentId || !(scope.departmentIds || []).some(value => String(value || "").trim() === departmentId)) {
      throw new Error("RESOURCE_SCOPE_DENIED");
    }
  }

  let sheet = existingSheet;
  if (!sheet) {
    sheet = getOrCreateSheet(ss, "CategoriasEvaluacion");
  } else if (!categoryRows.length) {
    sheet.appendRow(categoryHeaders);
    categoryRows = [categoryHeaders];
  }
  if (!categoryRows.length && sheet.getLastRow() === 0) {
    sheet.appendRow(categoryHeaders);
    categoryRows = [categoryHeaders];
  }
  if (categoryRows.length && categoryHeaders.some((header, index) =>
      String(categoryRows[0][index] || "").trim() !== header)) {
    throw new Error("EVALUATION_CATEGORIES_SCHEMA_INVALID");
  }
  return { ss, actor, scope, sheet, categoryRows, ownershipSheet, ownershipRows, ownership, departmentId,
    categoryRow: matches.length === 1 ? matches[0] : null };
}

function saveEvaluationCategoryUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const nombre = String(p.nombre || "").trim();
  if (!nombre) throw new Error("Nombre de la categoría es requerido.");
  const rawPercentage = p.porcentajePonderacion;
  const percentage = rawPercentage === undefined || rawPercentage === null || rawPercentage === ""
    ? 0 : Number(rawPercentage);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("EVALUATION_CATEGORY_PERCENTAGE_INVALID");
  }

  if (context.categoryRow) {
    const row = context.categoryRow.row;
    context.sheet.getRange(context.categoryRow.rowIndex + 1, 2).setValue(nombre);
    context.sheet.getRange(context.categoryRow.rowIndex + 1, 4).setValue(percentage);
    return { status: "success", message: "Categoría de evaluación actualizada.", data: { categoriaId: String(row[0]).trim() } };
  }

  const cid = "CAT-" + Utilities.getUuid();
  if (context.categoryRows.slice(1).some(row => String(row[0] || "").trim() === cid) ||
      context.ownershipRows.slice(1).some(row => String(row[1] || "").trim() === String(context.scope.institutionId || "").trim() &&
        String(row[2] || "").trim().toUpperCase() === "CATEGORIA_EVALUACION" && String(row[3] || "").trim() === cid)) {
    throw new Error("EVALUATION_CATEGORY_ID_COLLISION");
  }
  const ownershipId = "OWN-" + Utilities.getUuid();
  const now = new Date().toISOString();
  try {
    context.ownershipSheet.appendRow([ownershipId, context.scope.institutionId, "CATEGORIA_EVALUACION", cid,
      context.departmentId, "ACTIVE", context.actor.userId, now, now]);
    context.sheet.appendRow([cid, nombre, p.ambito || "Global", percentage, p.escalaId || "100", "Activo"]);
  } catch (error) {
    let rollbackFailed = false;
    try {
      const rows = context.sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0] || "").trim() === cid) context.sheet.deleteRow(i + 1);
    } catch (_) { rollbackFailed = true; }
    try {
      const rows = context.ownershipSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0] || "").trim() === ownershipId) context.ownershipSheet.deleteRow(i + 1);
    } catch (_) { rollbackFailed = true; }
    if (rollbackFailed) throw new Error("EVALUATION_CATEGORY_CREATE_ROLLBACK_FAILED");
    throw error;
  }
  return { status: "success", message: "Categoría de evaluación registrada.", data: { categoriaId: cid } };
}

function getRubrics(payload) {
  return withAuthorizedExamMetadataRead_("getRubrics", payload,
    context => getRubricsUnlocked_(payload, context));
}

function getRubricsUnlocked_(payload, context) {
  const ss = context && context.ss;
  if (!ss) throw new Error("RESOURCE_NOT_AVAILABLE");
  const sheet = ss.getSheetByName("RubricasEvaluacion");
  if (!sheet) return { status: "success", data: [] };
  const data = sheet.getDataRange().getValues();
  if (!data || data.length <= 1) return { status: "success", data: [] };

  const expectedHeaders = ["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"];
  if (expectedHeaders.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("RUBRICS_SCHEMA_INVALID");
  }

  const ownershipSheet = ss.getSheetByName("ResourceOwnership");
  const ownershipRows = ownershipSheet ? ownershipSheet.getDataRange().getValues() : [];
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  if (ownershipRows.length && ownershipHeaders.some((header, index) =>
      String(ownershipRows[0][index] || "").trim() !== header)) {
    throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  }
  const scope = context.scope || {};
  const ownedRubrics = Object.create(null);
  ownershipRows.slice(1).forEach(row => {
    if (String(row[2] || "").trim().toUpperCase() !== "RUBRICA_EVALUACION") return;
    const id = String(row[3] || "").trim();
    if (!id) return;
    if (!ownedRubrics[id]) ownedRubrics[id] = [];
    ownedRubrics[id].push(row);
  });
  const idCounts = {};
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const asignatura = String((payload && payload.asignatura) || "").trim();
  const rubrics = [];
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (!id || idCounts[id] !== 1 || String(row[3] || "").trim() === "Eliminada") return;
    const ownershipRecords = ownedRubrics[id];
    if (ownershipRecords && ownershipRecords.length) {
      if (ownershipRecords.length !== 1) return;
      const owner = ownershipRecords[0];
      const departmentId = String(owner[4] || "").trim();
      const inScope = String(owner[5] || "").trim().toUpperCase() === "ACTIVE" &&
        String(owner[1] || "").trim() === String(scope.institutionId || "").trim() &&
        !!departmentId && (scope.institutionWide === true ||
          (scope.departmentIds || []).some(value => String(value || "").trim() === departmentId));
      if (!inScope) return;
    }
    if (asignatura && normalizeString(row[2]) !== normalizeString(asignatura)) return;
    let criterios = [];
    if (row[4] !== "" && row[4] !== null && row[4] !== undefined) {
      try {
        criterios = typeof row[4] === "string" ? JSON.parse(row[4]) : row[4];
      } catch (_) {
        throw new Error("RUBRICS_CRITERIA_INVALID");
      }
    }
    rubrics.push({
      rubricaId: row[0],
      titulo: row[1],
      asignatura: row[2],
      estado: row[3] || "Activa",
      criterios
    });
  });
  return { status: "success", data: rubrics };
}

function saveRubric(payload) {
  return withAuthorizedRubricMutation_(payload, context => saveRubricUnlocked_(payload, context));
}

function withAuthorizedRubricMutation_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida dentro del lock para preservar el control TOCTOU.
  const permission = validateRolePermission("saveRubric", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("RUBRIC_MUTATION_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedRubricMutationContext_(payload);
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedRubricMutationContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const permission = validateRolePermission("saveRubric", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  if (!ownershipRows.length || ownershipHeaders.some((header, index) =>
      String(ownershipRows[0][index] || "").trim() !== header)) {
    throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  }

  const requestedId = String(p.rubricaId || "").trim();
  const existingSheet = ss.getSheetByName("RubricasEvaluacion");
  if (requestedId && !existingSheet) throw new Error("RESOURCE_NOT_AVAILABLE");
  let rubricRows = existingSheet ? existingSheet.getDataRange().getValues() : [];
  const rubricHeaders = ["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"];
  if (rubricRows.length && rubricHeaders.some((header, index) =>
      String(rubricRows[0][index] || "").trim() !== header)) {
    throw new Error("RUBRICS_SCHEMA_INVALID");
  }
  const rubricMatches = requestedId ? rubricRows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
    .filter(item => String(item.row[0] || "").trim() === requestedId) : [];
  if (requestedId && rubricMatches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");

  let ownership = null, departmentId = "";
  if (requestedId) {
    const check = assertExamResourceOwnershipForScope_(ss, scope, "RUBRICA_EVALUACION", requestedId, "UPDATE", p);
    if (!check || check.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    const owned = ownershipRows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
      .filter(item => String(item.row[1] || "").trim() === String(scope.institutionId).trim() &&
        String(item.row[2] || "").trim().toUpperCase() === "RUBRICA_EVALUACION" &&
        String(item.row[3] || "").trim() === requestedId &&
        String(item.row[5] || "").trim().toUpperCase() === "ACTIVE");
    if (owned.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
    ownership = owned[0];
    departmentId = String(ownership.row[4] || "").trim();
    if (!departmentId) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    const requestedDepartmentId = String(p.departmentId || p.departamentoId || "").trim();
    departmentId = requestedDepartmentId ||
      ((scope.departmentIds || []).length === 1 ? String(scope.departmentIds[0] || "").trim() : "");
    if (!departmentId || !(scope.departmentIds || []).some(value => String(value || "").trim() === departmentId)) {
      throw new Error("RESOURCE_SCOPE_DENIED");
    }
  }

  let sheet = existingSheet;
  if (!sheet) {
    sheet = getOrCreateSheet(ss, "RubricasEvaluacion");
    rubricRows = sheet.getDataRange().getValues();
  } else if (!rubricRows.length && !requestedId) {
    sheet.appendRow(rubricHeaders);
    rubricRows = [rubricHeaders];
  }
  if (!rubricRows.length || rubricHeaders.some((header, index) =>
      String(rubricRows[0][index] || "").trim() !== header)) {
    throw new Error("RUBRICS_SCHEMA_INVALID");
  }
  return { ss, actor, scope, sheet, rubricRows, ownershipSheet, ownershipRows, ownership, departmentId,
    rubricRow: rubricMatches.length === 1 ? rubricMatches[0] : null };
}

function saveRubricUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const titulo = String(p.titulo || "").trim();
  if (!titulo) throw new Error("RUBRIC_TITLE_REQUIRED");
  let critJSON;
  try { critJSON = JSON.stringify(p.criterios || []); }
  catch (_) { throw new Error("RUBRIC_CRITERIA_INVALID"); }
  if (typeof critJSON !== "string") throw new Error("RUBRIC_CRITERIA_INVALID");

  if (context.rubricRow) {
    const row = context.rubricRow.row;
    const updated = [titulo, p.asignatura || "General", row[3] || "Activa", critJSON];
    context.sheet.getRange(context.rubricRow.rowIndex + 1, 2, 1, 4).setValues([updated]);
    return { status: "success", message: "Rúbrica guardada correctamente.", data: { rubricaId: String(row[0]).trim() } };
  }

  const rid = "RUB-" + Utilities.getUuid();
  if (context.rubricRows.slice(1).some(row => String(row[0] || "").trim() === rid) ||
      context.ownershipRows.slice(1).some(row => String(row[1] || "").trim() === String(context.scope.institutionId || "").trim() &&
        String(row[2] || "").trim().toUpperCase() === "RUBRICA_EVALUACION" && String(row[3] || "").trim() === rid)) {
    throw new Error("RUBRIC_ID_COLLISION");
  }
  const ownershipId = "OWN-" + Utilities.getUuid();
  const now = new Date().toISOString();
  try {
    context.ownershipSheet.appendRow([ownershipId, context.scope.institutionId, "RUBRICA_EVALUACION", rid,
      context.departmentId, "ACTIVE", context.actor.userId, now, now]);
    context.sheet.appendRow([rid, titulo, p.asignatura || "General", "Activa", critJSON]);
  } catch (error) {
    let rollbackFailed = false;
    try {
      const rows = context.sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0] || "").trim() === rid) context.sheet.deleteRow(i + 1);
    } catch (_) { rollbackFailed = true; }
    try {
      const rows = context.ownershipSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0] || "").trim() === ownershipId) context.ownershipSheet.deleteRow(i + 1);
    } catch (_) { rollbackFailed = true; }
    if (rollbackFailed) throw new Error("RUBRIC_CREATE_ROLLBACK_FAILED");
    throw error;
  }
  return { status: "success", message: "Rúbrica guardada correctamente.", data: { rubricaId: rid } };
}

// [F9-Task12] [P1] - Ampliar la evaluación por competencias, rúbricas e indicadores de logro
function saveCompetencyEvaluation(payload) {
  return withAuthorizedCompetencyEvaluationMutation_(payload,
    context => saveCompetencyEvaluationUnlocked_(payload, context));
}

function withAuthorizedCompetencyEvaluationMutation_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida dentro del lock para preservar el control TOCTOU.
  const permission = validateRolePermission("saveCompetencyEvaluation", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("COMPETENCY_EVALUATION_MUTATION_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedCompetencyEvaluationMutationContext_(payload);
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedCompetencyEvaluationMutationContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const competenciaId = String(p.competenciaId || "").trim();
  const userId = String(p.userId || "").trim();
  const nivelDesempeno = String(p.nivelDesempeno || "").trim();
  if (!competenciaId || !userId || !nivelDesempeno) throw new Error("COMPETENCY_EVALUATION_REQUIRED_FIELDS");

  const permission = validateRolePermission("saveCompetencyEvaluation", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const role = String(actor.role || "").trim();
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (role !== "Profesor" && institutionRoles.indexOf(role) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const profile = getExamStudentProfile_(ss, userId);
  if (!profile || ["Estudiante", "Alumno"].indexOf(String(profile.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const asignaturaId = String(p.asignaturaId || "").trim();
  const periodoId = String(p.periodoId || "").trim();
  if (role === "Profesor") {
    if (!asignaturaId || !periodoId || !String(profile.grado || "").trim() || !String(profile.seccion || "").trim()) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const configSheet = getSheetOrThrow(ss, "ConfiguracionAcademica");
    const configData = configSheet.getDataRange().getValues();
    const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
    if (!configData.length || configHeaders.some((header, index) =>
        String(configData[0][index] || "").trim() !== header)) {
      throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
    }
    const assignments = configData.slice(1).filter(row =>
      normalizeString(row[2]) === normalizeString(periodoId) &&
      normalizeString(row[3]) === normalizeString(profile.grado) &&
      normalizeString(row[4]) === normalizeString(profile.seccion) &&
      normalizeString(row[5]) === normalizeString(asignaturaId));
    if (!assignments.length || assignments.some(row =>
        String(row[8] || "").trim() !== String(actor.userId).trim())) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else if (scope.institutionWide !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const rubricId = String(p.rubricaId || "").trim();
  if (rubricId) {
    const rubricSheet = ss.getSheetByName("RubricasEvaluacion");
    if (!rubricSheet) throw new Error("RESOURCE_NOT_AVAILABLE");
    const rubricRows = rubricSheet.getDataRange().getValues();
    const rubricHeaders = ["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"];
    if (!rubricRows.length || rubricHeaders.some((header, index) =>
        String(rubricRows[0][index] || "").trim() !== header)) {
      throw new Error("RUBRICS_SCHEMA_INVALID");
    }
    const rubricMatches = rubricRows.slice(1).filter(row => String(row[0] || "").trim() === rubricId);
    if (rubricMatches.length !== 1 || String(rubricMatches[0][3] || "").trim().toLowerCase() === "eliminada") {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const rubricSubject = String(rubricMatches[0][2] || "").trim();
    if (rubricSubject && normalizeString(rubricSubject) !== "general" &&
        normalizeString(rubricSubject) !== normalizeString(asignaturaId)) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const ownershipSheet = ss.getSheetByName("ResourceOwnership");
    if (ownershipSheet) {
      const ownershipRows = ownershipSheet.getDataRange().getValues();
      const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
      if (!ownershipRows.length || ownershipHeaders.some((header, index) =>
          String(ownershipRows[0][index] || "").trim() !== header)) {
        throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
      }
      const rubricOwnership = ownershipRows.slice(1).filter(row =>
        String(row[2] || "").trim().toUpperCase() === "RUBRICA_EVALUACION" &&
        String(row[3] || "").trim() === rubricId);
      if (rubricOwnership.length) {
        const owned = rubricOwnership.filter(row =>
          String(row[1] || "").trim() === String(scope.institutionId).trim() &&
          String(row[5] || "").trim().toUpperCase() === "ACTIVE" &&
          (scope.institutionWide === true || (scope.departmentIds || []).some(department =>
            String(department || "").trim() === String(row[4] || "").trim())));
        if (rubricOwnership.length !== 1 || owned.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
      }
    }
  }

  const sheet = ss.getSheetByName("EvaluacionesCompetencias") || getOrCreateSheet(ss, "EvaluacionesCompetencias");
  const headers = ["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID",
    "PeriodoID", "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro"];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const rows = sheet.getDataRange().getValues();
    if (!rows.length || headers.some((header, index) => String(rows[0][index] || "").trim() !== header)) {
      throw new Error("COMPETENCY_EVALUATION_SCHEMA_INVALID");
    }
  }
  return { actor, scope, ss, sheet, userId, competenciaId, asignaturaId, periodoId, nivelDesempeno, rubricId };
}

function saveCompetencyEvaluationUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const rows = context.sheet.getDataRange().getValues();
  const id = "COMP-EVAL-" + Utilities.getUuid();
  if (rows.slice(1).some(row => String(row[0] || "").trim() === id)) {
    throw new Error("COMPETENCY_EVALUATION_ID_COLLISION");
  }
  const now = new Date();
  const indicadorId = String(p.indicadorId || "").trim() || "IND-GENERIC";
  const observaciones = p.observaciones == null ? "" : String(p.observaciones);
  context.sheet.appendRow([
    id, context.competenciaId, indicadorId, context.userId,
    context.asignaturaId || "ASIG-GENERIC", context.periodoId || "P1",
    context.nivelDesempeno, observaciones, context.rubricId, now
  ]);
  return {
    status: "success",
    evaluacionCompetenciaId: id,
    competenciaId: context.competenciaId,
    userId: context.userId,
    nivelDesempeno: context.nivelDesempeno,
    message: "Evaluación cualitativa por competencias e indicadores de logro registrada exitosamente."
  };
}

function getCompetencyEvaluations(payload) {
  return withAuthorizedExamRead_("getCompetencyEvaluations", payload,
    context => getCompetencyEvaluationsUnlocked_(payload, context));
}

function getCompetencyEvaluationsUnlocked_(payload, context) {
  const p = payload || {};
  const actor = context && context.actor;
  const ss = context && context.ss;
  const scope = context && context.scope;
  if (!actor || !String(actor.userId || "").trim() || !ss || !scope || scope.authorized !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const role = String(actor.role || "").trim();
  const studentRoles = ["Estudiante", "Alumno"];
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  let targetUserId = "";

  if (studentRoles.indexOf(role) !== -1) {
    targetUserId = String(actor.userId).trim();
    if (p.userId && String(p.userId).trim() !== targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (role === "Profesor") {
    targetUserId = String(p.userId || "").trim();
    const asignaturaId = String(p.asignaturaId || "").trim();
    const periodoId = String(p.periodoId || "").trim();
    if (!targetUserId || !asignaturaId || !periodoId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1 ||
        !String(profile.grado || "").trim() || !String(profile.seccion || "").trim()) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const configSheet = getSheetOrThrow(ss, "ConfiguracionAcademica");
    const configData = configSheet.getDataRange().getValues();
    const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
    if (!configData.length || configHeaders.some((header, index) => String(configData[0][index] || "").trim() !== header)) {
      throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
    }
    const matchingAssignments = configData.slice(1).filter(row =>
      normalizeString(row[2]) === normalizeString(periodoId) &&
      normalizeString(row[3]) === normalizeString(profile.grado) &&
      normalizeString(row[4]) === normalizeString(profile.seccion) &&
      normalizeString(row[5]) === normalizeString(asignaturaId));
    if (!matchingAssignments.length || matchingAssignments.some(row =>
      String(row[8] || "").trim() !== String(actor.userId).trim())) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (institutionRoles.indexOf(role) !== -1) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetUserId = String(p.userId || "").trim();
    if (targetUserId) {
      const profile = getExamStudentProfile_(ss, targetUserId);
      if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const sheet = ss.getSheetByName("EvaluacionesCompetencias");
  if (!sheet) return { status: "success", total: 0, data: [] };
  const data = sheet.getDataRange().getValues();
  if (!data.length) return { status: "success", total: 0, data: [] };
  const expectedHeaders = ["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID",
    "PeriodoID", "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro"];
  if (expectedHeaders.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("COMPETENCY_EVALUATION_SCHEMA_INVALID");
  }
  if (data.length <= 1) return { status: "success", total: 0, data: [] };

  const idCounts = Object.create(null);
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const filtered = data.slice(1).filter(row => {
    const evaluationId = String(row[0] || "").trim();
    if (!evaluationId || idCounts[evaluationId] !== 1) return false;
    if (targetUserId && String(row[3] || "").trim() !== targetUserId) return false;
    if (p.asignaturaId && normalizeString(row[4]) !== normalizeString(p.asignaturaId)) return false;
    if (p.periodoId && normalizeString(row[5]) !== normalizeString(p.periodoId)) return false;
    if (p.competenciaId && String(row[1] || "").trim() !== String(p.competenciaId).trim()) return false;
    return true;
  }).map(row => {
    const registeredAt = row[9] ? new Date(row[9]) : null;
    return {
      evaluacionCompetenciaId: row[0], competenciaId: row[1], indicadorId: row[2], userId: row[3],
      asignaturaId: row[4], periodoId: row[5], nivelDesempeno: row[6], observaciones: row[7],
      rubricaId: row[8], fechaRegistro: registeredAt && !isNaN(registeredAt.getTime()) ? registeredAt.toISOString() : null
    };
  });
  return { status: "success", total: filtered.length, data: filtered };
}
function getGradebookData(payload) {
  return withAuthorizedExamRead_("getGradebookData", payload,
    context => getGradebookDataUnlocked_(payload, context));
}

function getGradebookDataUnlocked_(payload, context) {
  const p = payload || {};
  const { actor, ss, scope } = context || {};
  if (!actor || !actor.userId || !scope || scope.authorized !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const role = String(actor.role || "").trim();
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (role === "Profesor") {
    const professorId = String(p.profesorId || "").trim();
    const grado = String(p.grado || "").trim();
    const seccion = String(p.seccion || "").trim();
    const asignatura = String(p.asignatura || "").trim();
    const parcial = String(p.parcial || "").trim();
    if (!professorId || professorId !== String(actor.userId).trim() ||
        !grado || !seccion || !asignatura || !parcial) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }

    const configSheet = getSheetOrThrow(ss, "ConfiguracionAcademica");
    const configData = configSheet.getDataRange().getValues();
    const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
    if (!configData.length || configHeaders.some((header, index) =>
      String(configData[0][index] || "").trim() !== header)) {
      throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
    }
    const normalize = value => normalizeString(value);
    const matchingAssignments = configData.slice(1).filter(row =>
      normalize(row[2]) === normalize(parcial) &&
      normalize(row[3]) === normalize(grado) &&
      normalize(row[4]) === normalize(seccion) &&
      normalize(row[5]) === normalize(asignatura));
    if (!matchingAssignments.length || matchingAssignments.some(row =>
      String(row[8] || "").trim() !== String(actor.userId).trim())) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else if (institutionRoles.indexOf(role) !== -1) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const { grado, seccion, asignatura, parcial } = p;
  const usuariosSheet = getSheetOrThrow(ss, "Usuarios");
  const usuariosData = usuariosSheet.getDataRange().getValues().slice(1);
  const userIdCounts = Object.create(null);
  usuariosData.forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) userIdCounts[id] = (userIdCounts[id] || 0) + 1;
  });
  const alumnos = usuariosData.filter(row => {
    const id = String(row[0] || "").trim();
    const rolAlumno = normalizeString(row[6] || row[5]);
    if (!id || userIdCounts[id] !== 1 ||
        (rolAlumno !== "estudiante" && rolAlumno !== "alumno")) return false;
    if (grado && normalizeString(row[2]) !== normalizeString(grado)) return false;
    if (seccion && normalizeString(row[3]) !== normalizeString(seccion)) return false;
    return true;
  }).map(row => ({
    userId: row[0],
    nombreCompleto: row[1],
    grado: row[2],
    seccion: row[3],
    email: row[4]
  }));

  const studentIds = new Set(alumnos.map(student => String(student.userId).trim()));
  const califSheet = getSheetOrThrow(ss, "CalificacionesEstudiantes");
  const califData = califSheet.getDataRange().getValues();
  const calificaciones = califData.length > 1 ? califData.slice(1)
    .filter(row => studentIds.has(String(row[2] || "").trim()))
    .map(row => ({
      calificacionId: row[0],
      evaluacionId: row[1],
      userId: row[2],
      notaObtenida: parseFloat(row[3]) || 0,
      puntajePonderado: parseFloat(row[4]) || 0,
      esBorrador: row[5] === true || String(row[5]).toLowerCase() === "true",
      esPublicada: row[6] === true || String(row[6]).toLowerCase() === "true",
      observaciones: row[7] || "",
      fechaRegistro: row[8] ? new Date(row[8]).toISOString() : null
    })) : [];

  const recSheet = getSheetOrThrow(ss, "RecuperacionesEstudiante");
  const recData = recSheet.getDataRange().getValues();
  const recuperaciones = recData.length > 1 ? recData.slice(1)
    .filter(row => studentIds.has(String(row[2] || "").trim()))
    .map(row => ({
      recuperacionId: row[0],
      evaluacionId: row[1],
      userId: row[2],
      notaOriginal: parseFloat(row[3]),
      notaRecuperada: parseFloat(row[4]),
      notaFinalCalculada: parseFloat(row[5]),
      metodoAplicado: row[6],
      autorizadoPor: row[7],
      fecha: row[8] ? new Date(row[8]).toISOString() : null
    })) : [];

  const defaultCategories = [
    ["CAT-1", "Tareas y Trabajos", "Global", 35, "100", "Activo"],
    ["CAT-2", "Exámenes y Pruebas", "Global", 40, "100", "Activo"],
    ["CAT-3", "Proyectos e Investigaciones", "Global", 15, "100", "Activo"],
    ["CAT-4", "Practicas y Participacion", "Global", 10, "100", "Activo"]
  ];
  const categoriesSheet = ss.getSheetByName("CategoriasEvaluacion");
  const categoriesData = categoriesSheet ? categoriesSheet.getDataRange().getValues() : [];
  const categories = categoriesData.length <= 1 ? defaultCategories.map(row => ({
    categoriaId: row[0], nombre: row[1], ambito: row[2],
    porcentajePonderacion: row[3], escalaId: row[4], estado: row[5]
  })) : categoriesData.slice(1).map(row => ({
    categoriaId: row[0],
    nombre: row[1],
    ambito: row[2] || "Global",
    porcentajePonderacion: parseFloat(row[3]) || 0,
    escalaId: row[4] || "100",
    estado: row[5] || "Activo"
  }));

  const cierresSheet = ss.getSheetByName("CierresPeriodos");
  const cierresData = cierresSheet ? cierresSheet.getDataRange().getValues() : [];
  const cierreRow = cierresData.slice(1).find(row =>
    normalizeString(row[3]) === normalizeString(grado) &&
    normalizeString(row[4]) === normalizeString(seccion) &&
    normalizeString(row[5]) === normalizeString(asignatura) &&
    normalizeString(row[2]) === normalizeString(parcial));
  const estadoPeriodo = cierreRow ? cierreRow[7] : "Abierto";

  return {
    status: "success",
    data: { alumnos, calificaciones, recuperaciones, categories, estadoPeriodo }
  };
}
function saveGradebookGrades(payload) {
  return withAuthorizedGradebookSave_(payload, context =>
    saveGradebookGradesUnlocked_(payload, context));
}

function withAuthorizedGradebookSave_(payload, mutation, permissionAction) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const action = permissionAction || "saveGradebookGrades";
  const permission = validateRolePermission(action, payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("GRADEBOOK_SAVE_LOCK_TIMEOUT");
  try {
    return mutation(getAuthorizedGradebookSaveContext_(payload, permissionAction));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedGradebookSaveContext_(payload, permissionAction) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const permission = validateRolePermission(permissionAction || "saveGradebookGrades", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const roles = ["Profesor", "Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (roles.indexOf(String(actor.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  if (actor.role === "Profesor" && scope.institutionWide !== true &&
      (!Array.isArray(scope.departmentIds) || !scope.departmentIds.length)) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const grado = String(p.grado || "").trim(), seccion = String(p.seccion || "").trim();
  const asignatura = String(p.asignatura || "").trim(), parcial = String(p.parcial || p.periodoId || "").trim();
  if (!grado || !seccion || !asignatura || !parcial) throw new Error("GRADEBOOK_CONTEXT_REQUIRED");
  const institutional = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"].indexOf(actor.role) !== -1;
  if (institutional) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    if (String(p.profesorId || "").trim() !== String(actor.userId).trim()) throw new Error("RESOURCE_NOT_AVAILABLE");
    const config = getSheetOrThrow(ss, "ConfiguracionAcademica").getDataRange().getValues();
    const headers = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
    if (!config.length || headers.some((h, i) => String(config[0][i] || "").trim() !== h)) {
      throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
    }
    const norm = v => normalizeString(v);
    const assignments = config.slice(1).filter(r => norm(r[2]) === norm(parcial) &&
      norm(r[3]) === norm(grado) && norm(r[4]) === norm(seccion) && norm(r[5]) === norm(asignatura));
    if (!assignments.length || assignments.some(r => String(r[8] || "").trim() !== String(actor.userId).trim())) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  }

  const closeSheet = ss.getSheetByName("CierresPeriodos");
  if (closeSheet) {
    const rows = closeSheet.getDataRange().getValues();
    const headers = ["ID", "Fecha", "Parcial", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado"];
    if (rows.length && headers.some((h, i) => String(rows[0][i] || "").trim() !== h)) {
      throw new Error("GRADEBOOK_CLOSURE_SCHEMA_INVALID");
    }
    const closed = rows.slice(1).filter(r => normalizeString(r[2]) === normalizeString(parcial) &&
      normalizeString(r[3]) === normalizeString(grado) && normalizeString(r[4]) === normalizeString(seccion) &&
      normalizeString(r[5]) === normalizeString(asignatura) && String(r[7] || "").trim() === "Cerrado");
    if (closed.length) throw new Error("GRADEBOOK_PERIOD_CLOSED");
  }

  const students = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues().slice(1);
  const roster = Object.create(null), counts = Object.create(null);
  students.forEach(r => { const id = String(r[0] || "").trim(); if (id) counts[id] = (counts[id] || 0) + 1; });
  students.forEach(r => {
    const id = String(r[0] || "").trim();
    if (id && counts[id] === 1 && ["estudiante", "alumno"].indexOf(normalizeString(r[6] || r[5])) !== -1 &&
        normalizeString(r[2]) === normalizeString(grado) && normalizeString(r[3]) === normalizeString(seccion)) {
      roster[id] = true;
    }
  });

  const gradeSheet = getSheetOrThrow(ss, "CalificacionesEstudiantes");
  const gradeData = gradeSheet.getDataRange().getValues();
  const gradeHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado", "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  if (!gradeData.length || gradeHeaders.some((h, i) => String(gradeData[0][i] || "").trim() !== h)) {
    throw new Error("GRADEBOOK_SCHEMA_INVALID");
  }
  const categoriesSheet = ss.getSheetByName("CategoriasEvaluacion");
  const categoryData = categoriesSheet ? categoriesSheet.getDataRange().getValues() : [];
  const categoryIds = Object.create(null);
  ["CAT-1", "CAT-2", "CAT-3", "CAT-4"].forEach(id => { categoryIds[id] = true; });
  if (categoryData.length) {
    const categoryHeaders = ["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"];
    if (categoryHeaders.some((h, i) => String(categoryData[0][i] || "").trim() !== h)) {
      throw new Error("EVALUATION_CATEGORIES_SCHEMA_INVALID");
    }
    categoryData.slice(1).forEach(r => {
      const id = String(r[0] || "").trim();
      if (id && String(r[5] || "").trim() === "Activo") categoryIds[id] = true;
    });
  }
  const ownership = ss.getSheetByName("ResourceOwnership");
  const ownershipRows = ownership ? ownership.getDataRange().getValues() : [];
  const ownedCategories = Object.create(null);
  ownershipRows.slice(1).forEach(r => {
    if (String(r[1] || "").trim() === String(scope.institutionId).trim() &&
        String(r[2] || "").trim().toUpperCase() === "CATEGORIA_EVALUACION" &&
        String(r[5] || "").trim().toUpperCase() === "ACTIVE") {
      const id = String(r[3] || "").trim();
      if (!ownedCategories[id]) ownedCategories[id] = [];
      ownedCategories[id].push(String(r[4] || "").trim());
    }
  });
  return { ss, actor, scope, institutional, grado, seccion, asignatura, parcial, roster,
    gradeSheet, gradeData, categoryIds, ownedCategories };
}

function saveGradebookGradesUnlocked_(payload, context, options) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const opts = options && typeof options === "object" ? options : {};
  const calificaciones = p.calificaciones;
  if (p.esAnoHistoricoAnterior === true || p.anoLectivo && p.esAnoHistoricoAnterior) {
    throw new Error("GRADEBOOK_HISTORICAL_YEAR_IMMUTABLE");
  }
  if (p.esPadreDeEstudiante === true) throw new Error("GRADEBOOK_SELF_CHILD_FORBIDDEN");
  if (!Array.isArray(calificaciones) || !calificaciones.length || calificaciones.length > 500) {
    throw new Error("GRADEBOOK_BATCH_INVALID");
  }
  const seen = Object.create(null), pairRows = Object.create(null);
  for (let i = 1; i < context.gradeData.length; i++) {
    const row = context.gradeData[i] || [];
    const key = String(row[1] || "").trim() + "\u0000" + String(row[2] || "").trim();
    if (!pairRows[key]) pairRows[key] = [];
    pairRows[key].push(i);
  }
  const normalized = calificaciones.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("GRADEBOOK_ENTRY_INVALID");
    const evaluacionId = String(item.evaluacionId || "").trim(), userId = String(item.userId || "").trim();
    const raw = item.notaObtenida;
    if (!evaluacionId || !userId || !context.roster[userId] || !context.categoryIds[evaluacionId]) {
      throw new Error("GRADEBOOK_ENTRY_OUT_OF_SCOPE");
    }
    if (!["CAT-1", "CAT-2", "CAT-3", "CAT-4"].includes(evaluacionId)) {
      const categoryOwners = context.ownedCategories[evaluacionId] || [];
      if (categoryOwners.length !== 1 || !categoryOwners[0] ||
          !(context.scope.institutionWide === true ||
            (context.scope.departmentIds || []).some(id => String(id).trim() === categoryOwners[0]))) {
        throw new Error("GRADEBOOK_CATEGORY_OWNERSHIP_UNVERIFIED");
      }
    }
    if (typeof raw !== "number" && typeof raw !== "string") throw new Error("GRADEBOOK_GRADE_INVALID");
    const text = String(raw).trim();
    if (!/^(?:0|[1-9]\d?)(?:\.\d{1,2})?$|^100(?:\.0{1,2})?$/.test(text)) {
      throw new Error("GRADEBOOK_GRADE_INVALID");
    }
    const grade = Number(text);
    const key = evaluacionId + "\u0000" + userId;
    if (seen[key]) throw new Error("GRADEBOOK_ENTRY_DUPLICATE");
    seen[key] = true;
    const existing = pairRows[key] || [];
    if (existing.length > 1) throw new Error("GRADEBOOK_RECORD_AMBIGUOUS");
    if (existing.length === 1 && !String(context.gradeData[existing[0]][0] || "").trim()) {
      throw new Error("GRADEBOOK_RECORD_INVALID");
    }
    return { evaluacionId, userId, grade, existing: existing.length ? existing[0] : -1,
      observaciones: String(item.observaciones || "").slice(0, 1000) };
  });
  const data = context.gradeData.map(r => r.slice()), now = new Date();
  let appliedCount = 0, omittedCount = 0;
  normalized.forEach(entry => {
    if (opts.preserveExistingPositive === true && entry.existing >= 1) {
      const previous = parseFloat(context.gradeData[entry.existing][3]);
      if (!isNaN(previous) && previous > 0) { omittedCount++; return; }
    }
    const row = entry.existing >= 1 ? data[entry.existing] :
      ["CALIF-" + Utilities.getUuid(), entry.evaluacionId, entry.userId, 0, 0, true, false, "", now];
    row[3] = entry.grade; row[4] = entry.grade;
    row[5] = p.esBorrador !== false; row[6] = p.esPublicada === true;
    row[7] = entry.observaciones; row[8] = now;
    if (entry.existing < 1) data.push(row); else data[entry.existing] = row;
    appliedCount++;
  });
  if (appliedCount > 0) context.gradeSheet.getRange(1, 1, data.length, 9).setValues(data);
  const result = { status: "success", message: "Se guardaron " + appliedCount + " calificaciones exitosamente.", savedCount: normalized.length };
  if (opts.returnCounts === true) { result.appliedCount = appliedCount; result.omittedCount = omittedCount; }
  return result;
}
// [F9-Task10] [P1] - Aplicación masiva protegida por el mismo contrato de guardado del libro.
function bulkApplyGradebookGrades(payload) {
  return withAuthorizedGradebookSave_(payload, context => {
    const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const evaluacionId = String(p.evaluacionId || "").trim(), estudiantes = p.estudiantes;
    if (!evaluacionId || !Array.isArray(estudiantes) || !estudiantes.length || estudiantes.length > 500) throw new Error("GRADEBOOK_BATCH_INVALID");
    if (typeof p.observaciones !== "undefined" && typeof p.observaciones !== "string") throw new Error("GRADEBOOK_OBSERVATIONS_INVALID");
    const observations = String(p.observaciones || "").slice(0, 1000), seen = Object.create(null);
    const calificaciones = estudiantes.map(rawId => {
      const userId = String(rawId || "").trim();
      if (!userId) throw new Error("GRADEBOOK_ENTRY_INVALID");
      if (seen[userId]) throw new Error("GRADEBOOK_ENTRY_DUPLICATE");
      seen[userId] = true;
      const existing = context.gradeData.slice(1).filter(row => String(row[1] || "").trim() === evaluacionId && String(row[2] || "").trim() === userId);
      if (existing.length > 1) throw new Error("GRADEBOOK_RECORD_AMBIGUOUS");
      return { evaluacionId, userId, notaObtenida: p.nota,
        observaciones: observations || (existing.length ? String(existing[0][7] || "") : "") || "Aplicado masivamente" };
    });
    const result = saveGradebookGradesUnlocked_({ ...p, calificaciones, esBorrador: true, esPublicada: false }, context,
      { preserveExistingPositive: p.sobrescribirExistentes !== true, returnCounts: true });
    return { status: "success", evaluacionId, totalProcesados: estudiantes.length,
      aplicados: result.appliedCount, omitidos: result.omittedCount,
      message: "Calificación masiva (" + String(p.nota) + ") aplicada a " + result.appliedCount +
        " estudiante(s). " + result.omittedCount + " omitido(s) por conservar nota previa." };
  }, "bulkApplyGradebookGrades");
}
function copyEvaluationSetupBetweenGroups(payload) {
  return withAuthorizedEvaluationSetupCopy_(payload,
    context => copyEvaluationSetupBetweenGroupsUnlocked_(payload, context));
}

function withAuthorizedEvaluationSetupCopy_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const permission = validateRolePermission("copyEvaluationSetupBetweenGroups", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      String(actor.role || "").trim() !== "Profesor") throw new Error("RESOURCE_NOT_AVAILABLE");
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EVALUATION_SETUP_COPY_LOCK_TIMEOUT");
  try {
    return mutation(getAuthorizedEvaluationSetupCopyContext_(payload));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedEvaluationSetupCopyContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const source = p.grupoOrigen, destination = p.grupoDestino;
  const groupFields = ["asignatura", "grado", "seccion", "periodo"];
  if (!source || typeof source !== "object" || Array.isArray(source) ||
      !destination || typeof destination !== "object" || Array.isArray(destination)) {
    throw new Error("EVALUATION_COPY_GROUP_REQUIRED");
  }
  const normalizeGroup = group => {
    const result = {};
    groupFields.forEach(field => { result[field] = String(group[field] || "").trim(); });
    if (groupFields.some(field => !result[field])) throw new Error("EVALUATION_COPY_GROUP_CONTEXT_REQUIRED");
    return result;
  };
  const sourceGroup = normalizeGroup(source), destinationGroup = normalizeGroup(destination);
  const norm = value => normalizeString(value);
  if (groupFields.every(field => norm(sourceGroup[field]) === norm(destinationGroup[field]))) {
    throw new Error("EVALUATION_COPY_SOURCE_EQUALS_DESTINATION");
  }

  const permission = validateRolePermission("copyEvaluationSetupBetweenGroups", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      String(actor.role || "").trim() !== "Profesor") throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim() ||
      (!scope.institutionWide && !(scope.departmentIds || []).length)) throw new Error("RESOURCE_NOT_AVAILABLE");

  const assignments = getSheetOrThrow(ss, "ConfiguracionAcademica").getDataRange().getValues();
  const assignmentHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
  if (!assignments.length || assignmentHeaders.some((header, index) =>
      String(assignments[0][index] || "").trim() !== header)) throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
  [sourceGroup, destinationGroup].forEach(group => {
    const matches = assignments.slice(1).filter(row =>
      norm(row[2]) === norm(group.periodo) && norm(row[3]) === norm(group.grado) &&
      norm(row[4]) === norm(group.seccion) && norm(row[5]) === norm(group.asignatura));
    if (matches.length !== 1 || String(matches[0][8] || "").trim() !== String(actor.userId).trim()) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  });

  const categorySheet = getSheetOrThrow(ss, "CategoriasEvaluacion");
  const categoryRows = categorySheet.getDataRange().getValues();
  const legacyHeaders = ["ID", "Asignatura", "NombreCategoria", "Ponderacion", "Grado", "Seccion", "Periodo", "FechaRegistro"];
  if (!categoryRows.length || legacyHeaders.some((header, index) =>
      String(categoryRows[0][index] || "").trim() !== header)) {
    throw new Error("EVALUATION_CATEGORY_COPY_SCHEMA_UNSUPPORTED");
  }
  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  if (!ownershipRows.length || ownershipHeaders.some((header, index) =>
      String(ownershipRows[0][index] || "").trim() !== header)) throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");

  const categoryIdCounts = Object.create(null), ownershipIdCounts = Object.create(null), activeOwners = Object.create(null);
  categoryRows.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) categoryIdCounts[id] = (categoryIdCounts[id] || 0) + 1;
  });
  ownershipRows.slice(1).forEach(row => {
    const ownershipId = String(row[0] || "").trim();
    if (ownershipId) ownershipIdCounts[ownershipId] = (ownershipIdCounts[ownershipId] || 0) + 1;
    if (String(row[1] || "").trim() !== String(scope.institutionId).trim() ||
        String(row[2] || "").trim().toUpperCase() !== "CATEGORIA_EVALUACION" ||
        String(row[5] || "").trim().toUpperCase() !== "ACTIVE") return;
    const resourceId = String(row[3] || "").trim();
    if (!resourceId) return;
    if (!activeOwners[resourceId]) activeOwners[resourceId] = [];
    activeOwners[resourceId].push(row);
  });

  const sourceCategories = categoryRows.slice(1).filter(row =>
    norm(row[1]) === norm(sourceGroup.asignatura) && norm(row[4]) === norm(sourceGroup.grado) &&
    norm(row[5]) === norm(sourceGroup.seccion) && norm(row[6]) === norm(sourceGroup.periodo));
  const selected = sourceCategories.map(row => {
    const id = String(row[0] || "").trim();
    if (!id || categoryIdCounts[id] !== 1) throw new Error("EVALUATION_CATEGORY_RECORD_AMBIGUOUS");
    const owners = activeOwners[id] || [];
    if (owners.length !== 1) throw new Error("RESOURCE_OWNERSHIP_UNVERIFIED");
    const ownershipId = String(owners[0][0] || "").trim();
    if (!ownershipId || ownershipIdCounts[ownershipId] !== 1) throw new Error("RESOURCE_OWNERSHIP_RECORD_AMBIGUOUS");
    const departmentId = String(owners[0][4] || "").trim();
    const inScope = (scope.departmentIds || []).some(value => String(value || "").trim() === departmentId);
    if (!departmentId || !(scope.institutionWide === true || inScope)) throw new Error("RESOURCE_SCOPE_DENIED");
    const categoryName = String(row[2] || "").trim();
    const percentage = row[3] === "" || row[3] === null || row[3] === undefined ? NaN : Number(row[3]);
    if (!categoryName || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new Error("EVALUATION_CATEGORY_RECORD_INVALID");
    }
    return { row, departmentId };
  });
  return { actor, scope, categorySheet, categoryRows, ownershipSheet, ownershipRows,
    categoryIdCounts, ownershipIdCounts, selected, destinationGroup };
}

function copyEvaluationSetupBetweenGroupsUnlocked_(payload, context) {
  const now = new Date(), categoryWrites = [], ownershipWrites = [];
  const usedCategoryIds = Object.assign(Object.create(null), context.categoryIdCounts);
  const usedOwnershipIds = Object.assign(Object.create(null), context.ownershipIdCounts);
  context.selected.forEach(entry => {
    const categoryId = "CAT-COPY-" + String(Utilities.getUuid() || "").trim();
    const ownershipId = "OWN-" + String(Utilities.getUuid() || "").trim();
    if (categoryId === "CAT-COPY-" || usedCategoryIds[categoryId] ||
        ownershipId === "OWN-" || usedOwnershipIds[ownershipId]) throw new Error("EVALUATION_COPY_ID_COLLISION");
    usedCategoryIds[categoryId] = 1;
    usedOwnershipIds[ownershipId] = 1;
    const row = entry.row;
    categoryWrites.push([categoryId, context.destinationGroup.asignatura, row[2], row[3],
      context.destinationGroup.grado, context.destinationGroup.seccion, context.destinationGroup.periodo, now]);
    ownershipWrites.push([ownershipId, context.scope.institutionId, "CATEGORIA_EVALUACION", categoryId,
      entry.departmentId, "ACTIVE", context.actor.userId, now.toISOString(), now.toISOString()]);
  });
  if (!categoryWrites.length) return { status: "success", categoriasCopias: 0,
    message: "No se encontraron categorías de origen para el grupo indicado." };

  const insertedCategoryIds = categoryWrites.map(row => row[0]);
  const insertedOwnershipIds = ownershipWrites.map(row => row[0]);
  try {
    context.ownershipSheet.getRange(context.ownershipSheet.getLastRow() + 1, 1, ownershipWrites.length, 9).setValues(ownershipWrites);
    context.categorySheet.getRange(context.categorySheet.getLastRow() + 1, 1, categoryWrites.length, 8).setValues(categoryWrites);
  } catch (error) {
    let rollbackFailed = false;
    const removeByIds = (sheet, ids) => {
      try {
        const rows = sheet.getDataRange().getValues(), idSet = Object.create(null);
        ids.forEach(id => { idSet[id] = true; });
        for (let index = rows.length - 1; index >= 1; index--) {
          if (idSet[String(rows[index][0] || "").trim()]) sheet.deleteRow(index + 1);
        }
      } catch (_) { rollbackFailed = true; }
    };
    removeByIds(context.categorySheet, insertedCategoryIds);
    removeByIds(context.ownershipSheet, insertedOwnershipIds);
    if (rollbackFailed) throw new Error("EVALUATION_COPY_ROLLBACK_FAILED");
    throw error;
  }
  return { status: "success", categoriasCopias: categoryWrites.length,
    message: "Configuración de evaluación copiada exitosamente (" + categoryWrites.length +
      " categoría(s) duplicadas para el grupo destino sin copiar datos de estudiantes)." };
}
// [F9-Task11] [P1] - Ampliar las recuperaciones académicas y su integración con los resultados oficiales
function saveStudentRecovery(payload) {
 return withAuthorizedStudentRecoveryMutation_(payload, context => saveStudentRecoveryUnlocked_(payload, context));
}
function withAuthorizedStudentRecoveryMutation_(payload, mutation) {
  // Rechazar RBAC, identidad incompleta y roles no admitidos antes de competir por el lock.
  // El contexto completo se revalida dentro del lock para evitar TOCTOU.
  const permission = validateRolePermission("saveStudentRecovery", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      (String(actor.role || "").trim() !== "Profesor" &&
       institutionRoles.indexOf(String(actor.role || "").trim()) === -1)) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("STUDENT_RECOVERY_MUTATION_LOCK_TIMEOUT");
  try {
    return mutation(getAuthorizedStudentRecoveryMutationContext_(payload));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
function getAuthorizedStudentRecoveryMutationContext_(payload) {
 const p=payload&&typeof payload==="object"&&!Array.isArray(payload)?payload:{},evaluationId=String(p.evaluacionId||"").trim(),userId=String(p.userId||"").trim();
 const grade=String(p.grado||"").trim(),section=String(p.seccion||"").trim(),subject=String(p.asignatura||"").trim(),periodId=String(p.periodoId||"").trim();
 const recoveredNumber=p.notaRecuperada===""||p.notaRecuperada==null?NaN:Number(p.notaRecuperada),method=String(p.metodoAplicado||"Sustitucion").trim();
 if(evaluationId!=="CAT-GLOBAL"||!userId||!grade||!section||!subject||!periodId||!Number.isFinite(recoveredNumber)||recoveredNumber<0||recoveredNumber>100||["Sustitucion","Promedio","Mayor"].indexOf(method)===-1)throw new Error("STUDENT_RECOVERY_REQUIRED_FIELDS_INVALID");
 const permission=validateRolePermission("saveStudentRecovery",p);if(!permission||permission.authorized!==true)throw new Error("RESOURCE_NOT_AVAILABLE");
 const actor=getVerifiedExamIdentity_(p);if(!actor||actor.authorized!==true||!String(actor.userId||"").trim())throw new Error("RESOURCE_NOT_AVAILABLE");
 const role=String(actor.role||"").trim(),institutionRoles=["Administrador","Desarrollador","Dirección","Director","Secretaría"];if(role!=="Profesor"&&institutionRoles.indexOf(role)===-1)throw new Error("RESOURCE_NOT_AVAILABLE");
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedExamDepartmentScope_(p,ss,actor);if(!scope||scope.authorized!==true||!String(scope.institutionId||"").trim())throw new Error("RESOURCE_NOT_AVAILABLE");
 const profile=getExamStudentProfile_(ss,userId);if(!profile||["Estudiante","Alumno"].indexOf(String(profile.role||"").trim())===-1||normalizeString(profile.grado)!==normalizeString(grade)||normalizeString(profile.seccion)!==normalizeString(section))throw new Error("RESOURCE_NOT_AVAILABLE");
 if(role==="Profesor"){
  const config=getSheetOrThrow(ss,"ConfiguracionAcademica").getDataRange().getValues(),headers=["ID","Fecha","Parcial","Grado","Sección","Asignatura","Unidad","Tema","profesorId"];
  if(!config.length||headers.some((h,i)=>String(config[0][i]||"").trim()!==h))throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
  const matches=config.slice(1).filter(r=>normalizeString(r[2])===normalizeString(periodId)&&normalizeString(r[3])===normalizeString(grade)&&normalizeString(r[4])===normalizeString(section)&&normalizeString(r[5])===normalizeString(subject));
  if(!matches.length||matches.some(r=>String(r[8]||"").trim()!==String(actor.userId).trim()))throw new Error("RESOURCE_NOT_AVAILABLE");
 }else if(scope.institutionWide!==true)throw new Error("RESOURCE_NOT_AVAILABLE");
 const closure=ss.getSheetByName("CierresPeriodos");if(closure){const rows=closure.getDataRange().getValues();if(rows.length){
  const headers=["CierreID","AnoID","PeriodoID","Grado","Seccion","Asignatura","ProfesorID","Estado","FechaCierre"];if(headers.some((h,i)=>String(rows[0][i]||"").trim()!==h))throw new Error("PERIOD_CLOSURE_SCHEMA_INVALID");
  const matches=rows.slice(1).filter(r=>normalizeString(r[2])===normalizeString(periodId)&&normalizeString(r[3])===normalizeString(grade)&&normalizeString(r[4])===normalizeString(section)&&normalizeString(r[5])===normalizeString(subject));
  if(matches.length>1||matches.some(r=>String(r[7]||"").trim()==="Cerrado"))throw new Error("STUDENT_RECOVERY_PERIOD_CLOSED_OR_AMBIGUOUS");
 }}
 const grades=getSheetOrThrow(ss,"CalificacionesEstudiantes").getDataRange().getValues(),gh=["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro"];
 if(!grades.length||gh.some((h,i)=>String(grades[0][i]||"").trim()!==h))throw new Error("STUDENT_RECOVERY_GRADEBOOK_SCHEMA_INVALID");
 const weights={"CAT-1":.35,"CAT-2":.40,"CAT-3":.15,"CAT-4":.10},scores={};
 grades.slice(1).filter(r=>String(r[2]||"").trim()===userId&&Object.prototype.hasOwnProperty.call(weights,String(r[1]||"").trim())).forEach(r=>{
  const id=String(r[1]).trim();if(Object.prototype.hasOwnProperty.call(scores,id))throw new Error("STUDENT_RECOVERY_GRADEBOOK_AMBIGUOUS");
  const score=Number(r[3]);if(!Number.isFinite(score)||score<0||score>100)throw new Error("STUDENT_RECOVERY_GRADEBOOK_INVALID");scores[id]=score;
 });
 let originalGrade=Object.keys(weights).reduce((sum,id)=>sum+(scores[id]||0)*weights[id],0);
 const sheet=ss.getSheetByName("RecuperacionesEstudiante"),recoveryHeaders=["ID","EvaluacionID","UserID","NotaOriginal","NotaRecuperada","NotaFinalCalculada","MetodoAplicado","AutorizadoPor","Fecha"];
 if(sheet){
  const rows=sheet.getDataRange().getValues();
  if(rows.length&&recoveryHeaders.some((h,i)=>String(rows[0][i]||"").trim()!==h))throw new Error("STUDENT_RECOVERY_SCHEMA_INVALID");
  const idCounts=Object.create(null);rows.slice(1).forEach(row=>{const id=String(row[0]||"").trim();if(id)idCounts[id]=(idCounts[id]||0)+1;});
  const previous=rows.slice(1).filter(row=>String(row[1]||"").trim()===evaluationId&&String(row[2]||"").trim()===userId);
  if(previous.some(row=>!String(row[0]||"").trim()||idCounts[String(row[0]).trim()]!==1))throw new Error("STUDENT_RECOVERY_HISTORY_AMBIGUOUS");
  if(previous.length){const prior=Number(previous[previous.length-1][5]);if(!Number.isFinite(prior)||prior<0||prior>100)throw new Error("STUDENT_RECOVERY_HISTORY_INVALID");originalGrade=Math.max(originalGrade,prior);}
 }
 return {actor,ss,sheet,recoveryHeaders,userId,evaluationId,originalGrade,recoveredNumber,method};
}
function saveStudentRecoveryUnlocked_(payload,context) {
 const sheet=context.sheet||getOrCreateSheet(context.ss,"RecuperacionesEstudiante");if(!context.sheet||sheet.getLastRow()===0)sheet.appendRow(context.recoveryHeaders);
 const rows=sheet.getDataRange().getValues(),id="REC-"+Utilities.getUuid();if(rows.slice(1).some(r=>String(r[0]||"").trim()===id))throw new Error("STUDENT_RECOVERY_ID_COLLISION");
 const original=context.originalGrade,recovered=context.recoveredNumber;let finalGrade=recovered;if(context.method==="Promedio")finalGrade=(original+recovered)/2;else if(context.method==="Mayor")finalGrade=Math.max(original,recovered);
 sheet.appendRow([id,context.evaluationId,context.userId,original,recovered,finalGrade,context.method,String(context.actor.userId).trim(),new Date()]);
 return {status:"success",message:"Recuperación de nota registrada e integrada exitosamente.",data:{recuperacionId:id,notaOriginal:original,notaRecuperada:recovered,notaFinalCalculada:finalGrade,metodoAplicado:context.method}};
}

function getStudentRecoveries(payload) {
  return withAuthorizedExamRead_("getStudentRecoveries", payload,
    context => getStudentRecoveriesUnlocked_(payload, context));
}

function getStudentRecoveriesUnlocked_(payload, context) {
  const p = payload || {};
  const actor = context && context.actor;
  const ss = context && context.ss;
  const scope = context && context.scope;
  if (!actor || !String(actor.userId || "").trim() || !ss || !scope || scope.authorized !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const role = String(actor.role || "").trim();
  const studentRoles = ["Estudiante", "Alumno"];
  const guardianRoles = ["Tutor", "Padre", "Responsable"];
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  let targetUserId = "";

  if (studentRoles.indexOf(role) !== -1) {
    targetUserId = String(actor.userId).trim();
    if (p.userId && String(p.userId).trim() !== targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (guardianRoles.indexOf(role) !== -1) {
    targetUserId = String(context.profile && context.profile.userId || "").trim();
    if (!context.guardianActor || !targetUserId ||
        (p.userId && String(p.userId).trim() !== targetUserId)) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (institutionRoles.indexOf(role) !== -1) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetUserId = String(p.userId || "").trim();
    if (!targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    // El acceso docente se realiza mediante getGradebookData, que valida la asignación y el roster.
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const sheet = ss.getSheetByName("RecuperacionesEstudiante");
  if (!sheet) return { status: "success", data: [] };
  const data = sheet.getDataRange().getValues();
  if (!data.length) return { status: "success", data: [] };
  const expectedHeaders = ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada",
    "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"];
  if (expectedHeaders.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("STUDENT_RECOVERY_SCHEMA_INVALID");
  }
  if (data.length <= 1) return { status: "success", data: [] };

  const idCounts = Object.create(null);
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const recoveries = data.slice(1).filter(row => {
    const recoveryId = String(row[0] || "").trim();
    if (!recoveryId || idCounts[recoveryId] !== 1 ||
        String(row[2] || "").trim() !== targetUserId ||
        !String(row[1] || "").trim()) return false;
    if (p.evaluacionId && String(row[1]).trim() !== String(p.evaluacionId).trim()) return false;
    return true;
  }).map(row => {
    const toFiniteNumber = value => value === null || value === undefined || String(value).trim() === ""
      ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
    const original = toFiniteNumber(row[3]), recovered = toFiniteNumber(row[4]), finalGrade = toFiniteNumber(row[5]);
    const registeredAt = row[8] ? new Date(row[8]) : null;
    return {
      recuperacionId: row[0], evaluacionId: row[1], userId: row[2],
      notaOriginal: original,
      notaRecuperada: recovered,
      notaFinalCalculada: finalGrade,
      metodoAplicado: row[6], autorizadoPor: row[7],
      fecha: registeredAt && !isNaN(registeredAt.getTime()) ? registeredAt.toISOString() : null
    };
  });

  return { status: "success", data: recoveries };
}
function publishGradebookForContext(ss, targetGrado, targetSeccion, targetAsignatura) {
  try {
    const usuariosSheet = ss.getSheetByName("Usuarios");
    const targetStudentIds = new Set();
    if (usuariosSheet) {
      const uData = usuariosSheet.getDataRange().getValues().slice(1);
      uData.forEach(u => {
        const rol = normalizeString(u[6] || u[5]);
        if (rol === "estudiante" || rol === "alumno") {
          const matchGrado = !targetGrado || normalizeString(u[2]) === normalizeString(targetGrado);
          const matchSec = !targetSeccion || normalizeString(u[3]) === normalizeString(targetSeccion);
          if (matchGrado && matchSec) {
            targetStudentIds.add(String(u[0]).trim());
          }
        }
      });
    }

    const califSheet = getOrCreateSheet(ss, "CalificacionesEstudiantes");
    const califData = califSheet.getDataRange().getValues();
    if (califData.length > 1) {
      for (let i = 1; i < califData.length; i++) {
        const uId = String(califData[i][2]).trim();
        const matchesStudent = targetStudentIds.size === 0 || targetStudentIds.has(uId);
        if (matchesStudent && (califData[i][5] === true || String(califData[i][5]).toLowerCase() === "true")) {
          califData[i][5] = false; // esBorrador = false
          califData[i][6] = true;  // esPublicada = true
        }
      }
      califSheet.getRange(1, 1, califData.length, califData[0].length).setValues(califData);
    }
  } catch (err) {
    logDebug("Error actualizando estados de publicación contextuales", err.message);
  }
}

// [F9-Task05] [P0] - Completar el ciclo de revisión, aprobación, cierre y publicación de calificaciones
function closePeriodGradebook(payload) {
  return withAuthorizedPeriodGradebookClosure_(payload, context => closePeriodGradebookUnlocked_(context));
}
function withAuthorizedPeriodGradebookClosure_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const permission = validateRolePermission("closePeriodGradebook", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  const allowedRoles = ["Profesor", "Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      allowedRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("GRADEBOOK_CLOSURE_LOCK_TIMEOUT");
  try { return mutation(getAuthorizedPeriodGradebookClosureContext_(payload)); }
  finally { try { lock.releaseLock(); } catch (_) {} }
}
function getAuthorizedPeriodGradebookClosureContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const anoId=String(p.anoId||"").trim(), periodoId=String(p.periodoId||"").trim();
  const grado=String(p.grado||"").trim(), seccion=String(p.seccion||"").trim(), asignatura=String(p.asignatura||"").trim();
  if (!anoId||!periodoId||!grado||!seccion||!asignatura) throw new Error("GRADEBOOK_CLOSURE_REQUIRED_CONTEXT");
  const permission=validateRolePermission("closePeriodGradebook",p);
  if (!permission||permission.authorized!==true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor=getVerifiedExamIdentity_(p);
  if (!actor||actor.authorized!==true||!actor.userId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const roles=["Profesor","Administrador","Desarrollador","Dirección","Director","Secretaría"];
  if (roles.indexOf(String(actor.role||"").trim())===-1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedExamDepartmentScope_(p,ss,actor);
  if (!scope||scope.authorized!==true||!String(scope.institutionId||"").trim()) throw new Error("RESOURCE_NOT_AVAILABLE");
  if (actor.role!=="Profesor" && scope.institutionWide!==true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const cfg=getSheetOrThrow(ss,"ConfiguracionAcademica").getDataRange().getValues();
  const headers=["ID","Fecha","Parcial","Grado","Sección","Asignatura","Unidad","Tema","profesorId"];
  if (!cfg.length||headers.some((h,i)=>String(cfg[0][i]||"").trim()!==h)) throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
  const rows=cfg.slice(1).filter(r=>normalizeString(r[3])===normalizeString(grado)&&normalizeString(r[4])===normalizeString(seccion));
  const exact=rows.filter(r=>normalizeString(r[2])===normalizeString(periodoId)&&normalizeString(r[5])===normalizeString(asignatura));
  if(!exact.length) throw new Error("RESOURCE_NOT_AVAILABLE");
  if(actor.role==="Profesor" && (String(p.profesorId||"").trim()!==String(actor.userId).trim() ||
      exact.some(r=>String(r[8]||"").trim()!==String(actor.userId).trim()))) throw new Error("RESOURCE_NOT_AVAILABLE");
  const subjects=Array.from(new Set(rows.map(r=>normalizeString(r[5])).filter(Boolean)));
  const periods=Array.from(new Set(rows.map(r=>normalizeString(r[2])).filter(Boolean)));
  if(subjects.length!==1||periods.length!==1||subjects[0]!==normalizeString(asignatura)||periods[0]!==normalizeString(periodoId)) throw new Error("GRADEBOOK_PERIOD_SUBJECT_CONTEXT_AMBIGUOUS");
  const users=getSheetOrThrow(ss,"Usuarios").getDataRange().getValues(),counts=Object.create(null);
  users.slice(1).forEach(r=>{const id=String(r[0]||"").trim();if(id)counts[id]=(counts[id]||0)+1;});
  const ids=users.slice(1).filter(r=>{const id=String(r[0]||"").trim(),role=normalizeString(r[6]||r[5]);return id&&counts[id]===1&&(role==="estudiante"||role==="alumno")&&normalizeString(r[2])===normalizeString(grado)&&normalizeString(r[3])===normalizeString(seccion);}).map(r=>String(r[0]).trim());
  if(!ids.length) throw new Error("GRADEBOOK_CLOSURE_ROSTER_EMPTY");
  const grades=getSheetOrThrow(ss,"CalificacionesEstudiantes").getDataRange().getValues();
  const gh=["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro"];
  if(!grades.length||gh.some((h,i)=>String(grades[0][i]||"").trim()!==h)) throw new Error("GRADEBOOK_CLOSURE_GRADE_SCHEMA_INVALID");
  const required=["CAT-1","CAT-2","CAT-3","CAT-4"],roster=new Set(ids),byStudent=Object.create(null);
  grades.slice(1).filter(r=>roster.has(String(r[2]||"").trim())).forEach(r=>{
    const id=String(r[2]).trim(),cat=String(r[1]||"").trim();if(!byStudent[id])byStudent[id]=Object.create(null);
    if(required.indexOf(cat)===-1||byStudent[id][cat]) throw new Error("GRADEBOOK_CLOSURE_CATEGORY_AMBIGUOUS");
    const score=Number(r[3]),draft=r[5]===true||String(r[5]).toLowerCase()==="true",published=r[6]===true||String(r[6]).toLowerCase()==="true";
    if(!Number.isFinite(score)||score<0||score>100||draft||!published) throw new Error("GRADEBOOK_CLOSURE_UNPUBLISHED_GRADES");
    byStudent[id][cat]=true;
  });
  ids.forEach(id=>{const r=byStudent[id]||{};if(required.some(cat=>r[cat]!==true))throw new Error("GRADEBOOK_CLOSURE_INCOMPLETE_GRADES");});
  const closureSheet=ss.getSheetByName("CierresPeriodos"),closureHeaders=["CierreID","AnoID","PeriodoID","Grado","Seccion","Asignatura","ProfesorID","Estado","FechaCierre"];
  if(closureSheet){const rows=closureSheet.getDataRange().getValues();if(rows.length&&closureHeaders.some((h,i)=>String(rows[0][i]||"").trim()!==h))throw new Error("GRADEBOOK_CLOSURE_SCHEMA_INVALID");
    if(rows.slice(1).some(r=>normalizeString(r[1])===normalizeString(anoId)&&normalizeString(r[2])===normalizeString(periodoId)&&normalizeString(r[3])===normalizeString(grado)&&normalizeString(r[4])===normalizeString(seccion)&&normalizeString(r[5])===normalizeString(asignatura)))throw new Error("GRADEBOOK_CLOSURE_ALREADY_EXISTS");}
  return {ss,closureSheet,closureHeaders,actor,anoId,periodoId,grado,seccion,asignatura};
}
function closePeriodGradebookUnlocked_(c) {
  const sheet=c.closureSheet||getOrCreateSheet(c.ss,"CierresPeriodos");
  if(!c.closureSheet||sheet.getLastRow()===0)sheet.appendRow(c.closureHeaders);
  const id="CIERRE-"+Utilities.getUuid();
  if(sheet.getDataRange().getValues().slice(1).some(r=>String(r[0]||"").trim()===id))throw new Error("GRADEBOOK_CLOSURE_ID_COLLISION");
  sheet.appendRow([id,c.anoId,c.periodoId,c.grado,c.seccion,c.asignatura,String(c.actor.userId).trim(),"Cerrado",new Date()]);
  return {status:"success",cierreId:id,message:"Período cerrado. Las cuatro categorías ya estaban publicadas; no se ejecutó una publicación masiva adicional."};
}

function submitGradebookForReview(payload) {
  return withAuthorizedPeriodGradebookSubmission_(payload, context =>
    submitGradebookForReviewUnlocked_(context));
}

function withAuthorizedPeriodGradebookSubmission_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const permission = validateRolePermission("submitGradebookForReview", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      String(actor.role || "").trim() !== "Profesor") {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("GRADEBOOK_SUBMISSION_LOCK_TIMEOUT");
  try {
    return mutation(getAuthorizedPeriodGradebookSubmissionContext_(payload));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedPeriodGradebookSubmissionContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  // El esquema académico no ofrece una fuente canónica de año; se conserva el
  // identificador legado fijo y no se acepta uno suministrado por el cliente.
  const anoId = "ANO-CURRENT";
  const periodoId = String(p.periodoId || "").trim();
  const grado = String(p.grado || "").trim();
  const seccion = String(p.seccion || "").trim();
  const asignatura = String(p.asignatura || "").trim();
  if (!periodoId || periodoId.length > 120 || !grado || grado.length > 120 ||
      !seccion || seccion.length > 80 || !asignatura || asignatura.length > 160) {
    throw new Error("GRADEBOOK_SUBMISSION_REQUIRED_CONTEXT_INVALID");
  }

  const permission = validateRolePermission("submitGradebookForReview", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      String(actor.role || "").trim() !== "Profesor") {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim() ||
      !Array.isArray(scope.departmentIds) ||
      !scope.departmentIds.some(id => String(id || "").trim())) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const config = getSheetOrThrow(ss, "ConfiguracionAcademica").getDataRange().getValues();
  const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
  if (!config.length || configHeaders.some((header, index) =>
    String(config[0][index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_SUBMISSION_ASSIGNMENT_SCHEMA_INVALID");
  }
  const assignedTeacherId = String(actor.userId).trim();
  const assignmentRows = config.slice(1).filter(row =>
    normalizeString(row[2]) === normalizeString(periodoId) &&
    normalizeString(row[3]) === normalizeString(grado) &&
    normalizeString(row[4]) === normalizeString(seccion) &&
    normalizeString(row[5]) === normalizeString(asignatura));
  if (!assignmentRows.length || assignmentRows.some(row =>
    String(row[8] || "").trim() !== assignedTeacherId)) {
    throw new Error("GRADEBOOK_SUBMISSION_ASSIGNMENT_UNVERIFIED");
  }

  const sheet = ss.getSheetByName("CierresPeriodos");
  const closureHeaders = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  if (sheet) {
    const data = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [];
    if (data.length && closureHeaders.some((header, index) =>
      String(data[0][index] || "").trim() !== header)) {
      throw new Error("GRADEBOOK_SUBMISSION_SCHEMA_INVALID");
    }
    const sameContext = data.slice(1).filter(row =>
      normalizeString(row[2]) === normalizeString(periodoId) &&
      normalizeString(row[3]) === normalizeString(grado) &&
      normalizeString(row[4]) === normalizeString(seccion) &&
      normalizeString(row[5]) === normalizeString(asignatura));
    if (sameContext.some(row =>
      ["PendienteRevision", "Aprobado", "Cerrado"].indexOf(String(row[7] || "").trim()) !== -1)) {
      throw new Error("GRADEBOOK_SUBMISSION_ALREADY_EXISTS");
    }
  }

  return { ss, sheet, closureHeaders, anoId, periodoId, grado, seccion, asignatura, actor };
}

function submitGradebookForReviewUnlocked_(context) {
  const sheet = context.sheet || getOrCreateSheet(context.ss, "CierresPeriodos");
  if (!context.sheet || sheet.getLastRow() === 0) sheet.appendRow(context.closureHeaders);
  const existing = sheet.getDataRange().getValues();
  const cierreId = "REV-" + String(Utilities.getUuid() || "").trim();
  if (cierreId === "REV-" || existing.slice(1).some(row =>
    String(row[0] || "").trim() === cierreId)) {
    throw new Error("GRADEBOOK_SUBMISSION_ID_COLLISION");
  }

  sheet.appendRow([
    cierreId, context.anoId, context.periodoId, context.grado, context.seccion,
    context.asignatura, String(context.actor.userId).trim(), "PendienteRevision", new Date()
  ]);
  return {
    status: "success",
    cierreId,
    estado: "PendienteRevision",
    message: "Libro de notas de " + context.asignatura + " (" + context.grado + " " +
      context.seccion + ") enviado a revisión de Secretaría/Dirección."
  };
}
function reviewPeriodGradebook(payload) {
  return withAuthorizedPeriodGradebookReview_(payload, context =>
    reviewPeriodGradebookUnlocked_(payload, context));
}

function withAuthorizedPeriodGradebookReview_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const permission = validateRolePermission("reviewPeriodGradebook", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  const reviewerRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      reviewerRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("GRADEBOOK_REVIEW_LOCK_TIMEOUT");
  try {
    return mutation(getAuthorizedPeriodGradebookReviewContext_(payload));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedPeriodGradebookReviewContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const cierreId = String(p.cierreId || "").trim();
  const decision = String(p.decision || "").trim();
  if (!cierreId || ["Aprobado", "Observado", "Publicado"].indexOf(decision) === -1) {
    throw new Error("GRADEBOOK_REVIEW_REQUIRED_FIELDS_INVALID");
  }
  if (decision === "Publicado") {
    throw new Error("GRADEBOOK_REVIEW_PUBLICATION_UNSUPPORTED");
  }

  const permission = validateRolePermission("reviewPeriodGradebook", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const reviewerRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (reviewerRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim() ||
      scope.institutionWide !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const sheet = ss.getSheetByName("CierresPeriodos");
  if (!sheet) throw new Error("GRADEBOOK_REVIEW_RECORD_NOT_FOUND");
  const data = sheet.getDataRange().getValues();
  const headers = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  if (!data.length || headers.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_REVIEW_SCHEMA_INVALID");
  }

  const matches = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === cierreId) matches.push({ row: data[i], rowIndex: i + 1 });
  }
  if (!matches.length) throw new Error("GRADEBOOK_REVIEW_RECORD_NOT_FOUND");
  if (matches.length !== 1) throw new Error("GRADEBOOK_REVIEW_RECORD_AMBIGUOUS");

  const target = matches[0];
  if (!String(target.row[1] || "").trim() || !String(target.row[2] || "").trim() ||
      !String(target.row[3] || "").trim() || !String(target.row[4] || "").trim() ||
      !String(target.row[5] || "").trim() || !String(target.row[6] || "").trim()) {
    throw new Error("GRADEBOOK_REVIEW_RECORD_INVALID");
  }
  if (String(target.row[7] || "").trim() !== "PendienteRevision") {
    throw new Error("GRADEBOOK_REVIEW_STATE_INVALID");
  }

  const config = getSheetOrThrow(ss, "ConfiguracionAcademica").getDataRange().getValues();
  const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
  if (!config.length || configHeaders.some((header, index) =>
    String(config[0][index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_REVIEW_ASSIGNMENT_SCHEMA_INVALID");
  }
  const assignmentRows = config.slice(1).filter(row =>
    normalizeString(row[2]) === normalizeString(target.row[2]) &&
    normalizeString(row[3]) === normalizeString(target.row[3]) &&
    normalizeString(row[4]) === normalizeString(target.row[4]) &&
    normalizeString(row[5]) === normalizeString(target.row[5]));
  const assignedTeacherId = String(target.row[6] || "").trim();
  if (!assignmentRows.length || assignmentRows.some(row =>
    String(row[8] || "").trim() !== assignedTeacherId)) {
    throw new Error("GRADEBOOK_REVIEW_ASSIGNMENT_UNVERIFIED");
  }

  return {
    sheet,
    rowIndex: target.rowIndex,
    cierreId,
    decision,
    estadoTarget: decision === "Observado" ? "Observado" : "Aprobado",
    actor
  };
}

function reviewPeriodGradebookUnlocked_(payload, context) {
  const observaciones = String(payload && payload.observaciones || "").trim();
  context.sheet.getRange(context.rowIndex, 8, 1, 2)
    .setValues([[context.estadoTarget, new Date()]]);
  return {
    status: "success",
    cierreId: context.cierreId,
    estadoActual: context.estadoTarget,
    revisadoPor: String(context.actor.userId).trim(),
    observaciones,
    message: `Revisión completada: Período marcado como '${context.estadoTarget}'.`
  };
}

// [F9-Task06] [P0] - Fortalecer las rectificaciones de notas y la trazabilidad de los cambios
function reopenPeriodGradebook(payload) {
  return withAuthorizedPeriodGradebookReopen_(payload, context =>
    reopenPeriodGradebookUnlocked_(context));
}

function withAuthorizedPeriodGradebookReopen_(payload, mutation) {
  // Rechazar RBAC e identidad inválidos antes de competir por el lock compartido.
  // El contexto completo se revalida bajo el lock para evitar TOCTOU.
  const permission = validateRolePermission("reopenPeriodGradebook", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  const allowedRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      allowedRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("GRADEBOOK_REOPEN_LOCK_TIMEOUT");
  try {
    return mutation(getAuthorizedPeriodGradebookReopenContext_(payload));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedPeriodGradebookReopenContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const cierreId = String(p.cierreId || "").trim();
  const motivo = String(p.motivo || "").trim();
  if (!cierreId || cierreId.length > 160 || motivo.length < 10 || motivo.length > 2000) {
    throw new Error("GRADEBOOK_REOPEN_REQUIRED_FIELDS_INVALID");
  }

  const permission = validateRolePermission("reopenPeriodGradebook", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  const allowedRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      allowedRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim() ||
      scope.institutionWide !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const sheet = ss.getSheetByName("CierresPeriodos");
  if (!sheet) throw new Error("GRADEBOOK_REOPEN_RECORD_NOT_FOUND");
  const data = sheet.getDataRange().getValues();
  const headers = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  if (!data.length || headers.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_REOPEN_SCHEMA_INVALID");
  }

  const matches = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === cierreId) matches.push({ row: data[i], rowIndex: i + 1 });
  }
  if (!matches.length) throw new Error("GRADEBOOK_REOPEN_RECORD_NOT_FOUND");
  if (matches.length !== 1) throw new Error("GRADEBOOK_REOPEN_RECORD_AMBIGUOUS");

  const target = matches[0];
  if (headers.slice(0, 7).some((header, index) => !String(target.row[index] || "").trim())) {
    throw new Error("GRADEBOOK_REOPEN_RECORD_INVALID");
  }
  if (String(target.row[7] || "").trim() !== "Cerrado") {
    throw new Error("GRADEBOOK_REOPEN_STATE_INVALID");
  }

  const auditHeaders = ["RectificacionID", "EvaluacionID", "UserID", "Accion", "NotaAnterior", "NotaNueva", "Motivo", "AutorizadoPor", "Fecha"];
  const auditSheet = ss.getSheetByName("HistorialRectificacionesNotas");
  let auditRows = [];
  if (auditSheet && auditSheet.getLastRow() > 0) {
    auditRows = auditSheet.getDataRange().getValues();
    if (auditHeaders.some((header, index) => String(auditRows[0][index] || "").trim() !== header)) {
      throw new Error("GRADEBOOK_REOPEN_AUDIT_SCHEMA_INVALID");
    }
  }
  return {
    ss, sheet, rowIndex: target.rowIndex, cierreId, motivo, actor,
    auditSheet, auditHeaders, auditRows
  };
}

function reopenPeriodGradebookUnlocked_(context) {
  const auditSheet = context.auditSheet || getOrCreateSheet(context.ss, "HistorialRectificacionesNotas");
  if (!context.auditSheet || auditSheet.getLastRow() === 0) auditSheet.appendRow(context.auditHeaders);

  const auditId = "REAP-" + String(Utilities.getUuid() || "").trim();
  const existingAuditRows = auditSheet.getDataRange().getValues();
  if (auditId === "REAP-" || existingAuditRows.slice(1).some(row =>
      String(row[0] || "").trim() === auditId)) {
    throw new Error("GRADEBOOK_REOPEN_AUDIT_ID_COLLISION");
  }

  const now = new Date();
  const auditRowCount = auditSheet.getLastRow();
  context.sheet.getRange(context.rowIndex, 8).setValue("Reabierto");
  try {
    auditSheet.appendRow([
      auditId, context.cierreId, String(context.actor.userId).trim(),
      "REAPERTURA_PERIODO", "Cerrado", "Reabierto", context.motivo,
      String(context.actor.userId).trim(), now
    ]);
  } catch (error) {
    try { context.sheet.getRange(context.rowIndex, 8).setValue("Cerrado"); } catch (rollbackError) {
      logDebug("GRADEBOOK_REOPEN_ROLLBACK_FAILED", rollbackError.message);
    }
    try {
      if (auditSheet.getLastRow() > auditRowCount && auditSheet.deleteRow) {
        auditSheet.deleteRow(auditSheet.getLastRow());
      }
    } catch (cleanupError) {
      logDebug("GRADEBOOK_REOPEN_AUDIT_CLEANUP_FAILED", cleanupError.message);
    }
    throw new Error("GRADEBOOK_REOPEN_AUDIT_WRITE_FAILED");
  }

  return {
    status: "success",
    cierreId: context.cierreId,
    estado: "Reabierto",
    autorizadoPor: String(context.actor.userId).trim(),
    message: "Período reabierto oficialmente para rectificaciones autorizadas."
  };
}
function rectifyStudentGrade(payload) {
  return withAuthorizedStudentGradeRectification_(payload, context =>
    rectifyStudentGradeUnlocked_(context));
}

function withAuthorizedStudentGradeRectification_(payload, mutation) {
  // Rechazar actores sin permiso antes de competir por el lock global.
  const permission = validateRolePermission("rectifyStudentGrade", payload);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(payload);
  const allowedRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      allowedRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("GRADE_RECTIFICATION_LOCK_TIMEOUT");
  try {
    // El contexto vuelve a validar permiso, identidad, rol, scope y registros bajo lock.
    return mutation(getAuthorizedStudentGradeRectificationContext_(payload));
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedStudentGradeRectificationContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const calificacionId = String(p.calificacionId || "").trim();
  const evaluacionId = String(p.evaluacionId || "").trim();
  const requestedUserId = String(p.userId || "").trim();
  const motivo = String(p.motivo || "").trim();
  const rawGrade = p.notaNueva;
  if ((!calificacionId && (!evaluacionId || !requestedUserId)) ||
      rawGrade === undefined || rawGrade === null ||
      !motivo || motivo.length < 10 || motivo.length > 2000) {
    throw new Error("GRADE_RECTIFICATION_REQUIRED_FIELDS_INVALID");
  }
  if (typeof rawGrade !== "number" && typeof rawGrade !== "string") {
    throw new Error("GRADE_RECTIFICATION_GRADE_INVALID");
  }
  const gradeText = String(rawGrade).trim();
  if (!/^(?:0|[1-9]\d?)(?:\.\d{1,2})?$|^100(?:\.0{1,2})?$/.test(gradeText)) {
    throw new Error("GRADE_RECTIFICATION_GRADE_INVALID");
  }
  const notaNum = Number(gradeText);
  if (!Number.isFinite(notaNum) || notaNum < 0 || notaNum > 100) {
    throw new Error("GRADE_RECTIFICATION_GRADE_INVALID");
  }

  const permission = validateRolePermission("rectifyStudentGrade", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  const allowedRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      allowedRoles.indexOf(String(actor.role || "").trim()) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim() ||
      scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");

  const gradeSheet = getSheetOrThrow(ss, "CalificacionesEstudiantes");
  const gradeHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado", "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  const gradeRows = gradeSheet.getDataRange().getValues();
  if (!gradeRows.length || gradeHeaders.some((h, i) => String(gradeRows[0][i] || "").trim() !== h)) {
    throw new Error("GRADE_RECTIFICATION_SCHEMA_INVALID");
  }
  const matches = [];
  for (let i = 1; i < gradeRows.length; i++) {
    const row = gradeRows[i] || [];
    const matchesId = calificacionId && String(row[0] || "").trim() === calificacionId;
    const matchesPair = !calificacionId &&
      String(row[1] || "").trim() === evaluacionId &&
      String(row[2] || "").trim() === requestedUserId;
    if (matchesId || matchesPair) matches.push({ row, rowIndex: i + 1 });
  }
  if (!matches.length) throw new Error("GRADE_RECTIFICATION_RECORD_NOT_FOUND");
  if (matches.length !== 1) throw new Error("GRADE_RECTIFICATION_RECORD_AMBIGUOUS");
  const target = matches[0], row = target.row;
  const canonicalEvaluationId = String(row[1] || "").trim();
  const canonicalUserId = String(row[2] || "").trim();
  if (!String(row[0] || "").trim() || !canonicalEvaluationId || !canonicalUserId ||
      (calificacionId && (evaluacionId && evaluacionId !== canonicalEvaluationId ||
        requestedUserId && requestedUserId !== canonicalUserId)) ||
      !Number.isFinite(Number(row[3])) || Number(row[3]) < 0 || Number(row[3]) > 100) {
    throw new Error("GRADE_RECTIFICATION_RECORD_INVALID");
  }
  const profileRows = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues().slice(1)
    .filter(r => String(r[0] || "").trim() === canonicalUserId);
  if (profileRows.length !== 1 ||
      ["estudiante", "alumno"].indexOf(normalizeString(profileRows[0][6] || profileRows[0][5])) === -1) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const auditHeaders = ["RectificacionID", "EvaluacionID", "UserID", "Accion", "NotaAnterior", "NotaNueva", "Motivo", "AutorizadoPor", "Fecha"];
  const auditSheet = ss.getSheetByName("HistorialRectificacionesNotas");
  let auditRows = [];
  if (auditSheet && auditSheet.getLastRow() > 0) {
    auditRows = auditSheet.getDataRange().getValues();
    if (auditHeaders.some((h, i) => String(auditRows[0][i] || "").trim() !== h)) {
      throw new Error("GRADE_RECTIFICATION_AUDIT_SCHEMA_INVALID");
    }
  }
  return { ss, gradeSheet, rowIndex: target.rowIndex, row, canonicalEvaluationId,
    canonicalUserId, notaAnterior: Number(row[3]), notaNum, motivo, actor,
    auditSheet, auditHeaders, auditRows };
}

function rectifyStudentGradeUnlocked_(context) {
  const auditSheet = context.auditSheet || getOrCreateSheet(context.ss, "HistorialRectificacionesNotas");
  if (!context.auditSheet || auditSheet.getLastRow() === 0) auditSheet.appendRow(context.auditHeaders);
  const rectId = "RECT-" + String(Utilities.getUuid() || "").trim();
  const priorAuditRows = auditSheet.getDataRange().getValues();
  if (rectId === "RECT-" || priorAuditRows.slice(1).some(r => String(r[0] || "").trim() === rectId)) {
    throw new Error("GRADE_RECTIFICATION_AUDIT_ID_COLLISION");
  }
  const now = new Date(), auditRowCount = auditSheet.getLastRow();
  const oldValues = context.row.slice(3, 9);
  try {
    auditSheet.appendRow([
      rectId, context.canonicalEvaluationId, context.canonicalUserId,
      "RECTIFICACION_NOTA", context.notaAnterior, context.notaNum,
      context.motivo, String(context.actor.userId).trim(), now
    ]);
    context.gradeSheet.getRange(context.rowIndex, 4, 1, 6).setValues([[
      context.notaNum, oldValues[1], false, true,
      "RECTIFICADO: " + context.motivo, now
    ]]);
  } catch (error) {
    let rollbackFailed = false;
    try { context.gradeSheet.getRange(context.rowIndex, 4, 1, 6).setValues([oldValues]); }
    catch (rollbackError) { rollbackFailed = true; logDebug("GRADE_RECTIFICATION_ROLLBACK_FAILED", rollbackError.message); }
    try {
      if (auditSheet.getLastRow() > auditRowCount && auditSheet.deleteRow) auditSheet.deleteRow(auditSheet.getLastRow());
    } catch (cleanupError) { rollbackFailed = true; logDebug("GRADE_RECTIFICATION_AUDIT_CLEANUP_FAILED", cleanupError.message); }
    throw new Error(rollbackFailed ? "GRADE_RECTIFICATION_ROLLBACK_FAILED" : "GRADE_RECTIFICATION_WRITE_FAILED");
  }
  return {
    status: "success", rectificacionId: rectId,
    notaAnterior: context.notaAnterior, notaNueva: context.notaNum,
    autorizadoPor: String(context.actor.userId).trim(),
    message: "Calificación rectificada oficialmente con trazabilidad y auditoría de cambios registrada."
  };
}
function getGradeRectificationHistory(payload) {
  return withAuthorizedExamRead_("getGradeRectificationHistory", payload,
    context => getGradeRectificationHistoryUnlocked_(payload, context));
}

function getGradeRectificationHistoryUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const actor = context && context.actor;
  const ss = context && context.ss;
  const scope = context && context.scope;
  if (!actor || !String(actor.userId || "").trim() || !ss || !scope || scope.authorized !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const role = String(actor.role || "").trim();
  const studentRoles = ["Estudiante", "Alumno"];
  const guardianRoles = ["Tutor", "Padre", "Responsable"];
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  let targetUserId = "";

  if (studentRoles.indexOf(role) !== -1) {
    targetUserId = String(actor.userId).trim();
    if (p.userId && String(p.userId).trim() !== targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else if (guardianRoles.indexOf(role) !== -1) {
    targetUserId = String(context.profile && context.profile.userId || "").trim();
    if (!context.guardianActor || !targetUserId ||
        (p.userId && String(p.userId).trim() !== targetUserId)) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (institutionRoles.indexOf(role) !== -1) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetUserId = String(p.userId || "").trim();
    if (!targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else {
    // La consulta docente de información académica debe pasar por getGradebookData,
    // que valida asignación y roster; esta ruta no admite consultas directas.
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const sheet = ss.getSheetByName("HistorialRectificacionesNotas");
  if (!sheet) return { status: "success", data: [] };
  const data = sheet.getDataRange().getValues();
  if (!data.length) return { status: "success", data: [] };
  const expectedHeaders = ["RectificacionID", "EvaluacionID", "UserID", "Accion",
    "NotaAnterior", "NotaNueva", "Motivo", "AutorizadoPor", "Fecha"];
  if (expectedHeaders.some((header, index) => String(data[0][index] || "").trim() !== header)) {
    throw new Error("GRADE_RECTIFICATION_HISTORY_SCHEMA_INVALID");
  }
  if (data.length <= 1) return { status: "success", data: [] };

  const idCounts = Object.create(null);
  data.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const toFiniteNumber = value => value === null || value === undefined || String(value).trim() === ""
    ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
  const history = data.slice(1).filter(row => {
    const id = String(row[0] || "").trim();
    const evaluationId = String(row[1] || "").trim();
    return !!id && idCounts[id] === 1 && !!evaluationId &&
      String(row[2] || "").trim() === targetUserId &&
      (!p.evaluacionId || evaluationId === String(p.evaluacionId).trim());
  }).map(row => {
    const date = row[8] ? new Date(row[8]) : null;
    return {
      rectificacionId: String(row[0]).trim(),
      evaluacionId: String(row[1]).trim(),
      userId: targetUserId,
      accion: row[3] || "",
      notaAnterior: toFiniteNumber(row[4]),
      notaNueva: toFiniteNumber(row[5]),
      motivo: row[6] || "",
      autorizadoPor: row[7] || "",
      fecha: date && !isNaN(date.getTime()) ? date.toISOString() : null
    };
  });
  return { status: "success", data: history };
}

function getStudentAcademicReport(payload) {
  return withAuthorizedExamRead_("getStudentAcademicReport", payload,
    context => getStudentAcademicReportUnlocked_(payload, context));
}

function getStudentAcademicReportUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const actor = context && context.actor;
  const ss = context && context.ss;
  const scope = context && context.scope;
  if (!actor || !String(actor.userId || "").trim() || !ss || !scope || scope.authorized !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const role = String(actor.role || "").trim();
  const studentRoles = ["Estudiante", "Alumno"];
  const guardianRoles = ["Tutor", "Padre", "Responsable"];
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  let targetUserId = "";
  if (studentRoles.indexOf(role) !== -1) {
    targetUserId = String(actor.userId).trim();
    if (p.userId && String(p.userId).trim() !== targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (guardianRoles.indexOf(role) !== -1) {
    targetUserId = String(context.profile && context.profile.userId || "").trim();
    if (!context.guardianActor || !targetUserId ||
        (p.userId && String(p.userId).trim() !== targetUserId)) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (institutionRoles.indexOf(role) !== -1) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetUserId = String(p.userId || "").trim();
    if (!targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    const profile = getExamStudentProfile_(ss, targetUserId);
    if (!profile || studentRoles.indexOf(String(profile.role || "").trim()) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    // Los docentes consultan calificaciones mediante getGradebookData, con asignación y roster validados.
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const readOptionalSheet = (name, headers) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (!values.length) return [];
    if (headers && headers.some((header, index) => String(values[0][index] || "").trim() !== header)) {
      throw new Error("STUDENT_ACADEMIC_REPORT_SCHEMA_INVALID");
    }
    return values.slice(1);
  };
  const countIds = (rows, index) => {
    const counts = Object.create(null);
    rows.forEach(row => { const id = String(row[index] || "").trim(); if (id) counts[id] = (counts[id] || 0) + 1; });
    return counts;
  };
  const safeDate = value => {
    if (!value) return null;
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date.toISOString() : null;
  };
  const safeNumber = value => {
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : 0;
  };

  const matriculas = readOptionalSheet("Matriculas");
  const matriculaCounts = countIds(matriculas, 0);
  const userMatriculas = matriculas.filter(row =>
    row.length >= 9 && String(row[2] || "").trim() === targetUserId &&
    String(row[0] || "").trim() && matriculaCounts[String(row[0]).trim()] === 1);

  const gradeHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado",
    "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  const calificaciones = readOptionalSheet("CalificacionesEstudiantes", gradeHeaders);
  const gradeCounts = countIds(calificaciones, 0);
  const userCalificaciones = calificaciones.filter(row => {
    const id = String(row[0] || "").trim();
    if (!id || gradeCounts[id] !== 1 || String(row[2] || "").trim() !== targetUserId) return false;
    const draft = row[5] === true || String(row[5]).toLowerCase() === "true";
    const published = row[6] === true || String(row[6]).toLowerCase() === "true";
    return published || !draft;
  }).map(row => ({
    calificacionId: row[0],
    evaluacionId: row[1],
    notaObtenida: safeNumber(row[3]),
    puntajePonderado: safeNumber(row[4]),
    esPublicada: row[6] === true || String(row[6]).toLowerCase() === "true",
    observaciones: row[7] || "",
    fechaRegistro: safeDate(row[8])
  }));

  const recoveryHeaders = ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada",
    "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"];
  const recuperaciones = readOptionalSheet("RecuperacionesEstudiante", recoveryHeaders);
  const recoveryCounts = countIds(recuperaciones, 0);
  const userRecuperaciones = recuperaciones.filter(row => {
    const id = String(row[0] || "").trim();
    return !!id && recoveryCounts[id] === 1 && String(row[2] || "").trim() === targetUserId &&
      !!String(row[1] || "").trim();
  }).map(row => ({
    recuperacionId: row[0],
    evaluacionId: row[1],
    notaOriginal: safeNumber(row[3]),
    notaRecuperada: safeNumber(row[4]),
    notaFinalCalculada: safeNumber(row[5]),
    metodoAplicado: row[6],
    autorizadoPor: row[7],
    fecha: safeDate(row[8])
  }));

  const categoryHeaders = ["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"];
  const categories = readOptionalSheet("CategoriasEvaluacion", categoryHeaders).map(row => ({
    categoriaId: row[0],
    nombre: row[1],
    ambito: row[2] || "Global",
    porcentajePonderacion: safeNumber(row[3]),
    escalaId: row[4] || "100",
    estado: row[5] || "Activo"
  }));

  return { status: "success", data: {
    userId: targetUserId,
    matriculas: userMatriculas.map(row => ({
      matriculaId: row[0], fecha: row[1], grado: row[4], seccion: row[5], periodo: row[6], estado: row[8]
    })),
    calificaciones: userCalificaciones,
    recuperaciones: userRecuperaciones,
    categories
  }};
}
