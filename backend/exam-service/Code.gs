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
  // Solo metadatos no sensibles pueden consultarse sin sesión.
  "getEvaluationCategories", "getRubrics"
];

const ROLE_PERMISSIONS = {
  "Administrador": ["*"],
  "Desarrollador": ["*"],
  "Padre": ["getStudentExams", "getExamQuestions", "getExamResult", "getEvaluationCategories", "getRubrics", "getStudentRecoveries", "getStudentAcademicReport"],
  "Tutor": ["getStudentExams", "getExamQuestions", "getExamResult", "getEvaluationCategories", "getRubrics", "getStudentRecoveries", "getStudentAcademicReport"],
  "Responsable": ["getStudentExams", "getExamQuestions", "getExamResult", "getEvaluationCategories", "getRubrics", "getStudentRecoveries", "getStudentAcademicReport"],
  "Dirección": ["*"],
  "Secretaría": ["*"],
  "Profesor": [
    "createExam", "updateExam", "updateExamStatus", "deleteExam", "gradeExamSubmission", "deleteExamSubmission",
    "getAllExams", "getTeacherExamActivity", "getExamQuestions", "getStudentExams", "getExamResult",
    "getGradebookData", "saveGradebookGrades", "bulkApplyGradebookGrades", "copyEvaluationSetupBetweenGroups", "getEvaluationCategories", "saveEvaluationCategory",
    "getRubrics", "saveRubric", "saveCompetencyEvaluation", "getCompetencyEvaluations", "saveStudentRecovery", "getStudentRecoveries", "closePeriodGradebook", "reopenPeriodGradebook", "submitGradebookForReview", "reviewPeriodGradebook", "rectifyStudentGrade", "getGradeRectificationHistory", "getStudentAcademicReport",
    "manageQuestionBank", "getQuestionBank", "checkExamSchedulingConflict", "simulateExamReschedule",
    "getExamGradeDistributionAnalytics", "getGradingPerformanceAndPersistenceMetrics"
  ],
  "Estudiante": [
    "getStudentExams", "getExamQuestions", "submitExam", "getExamResult", "getEvaluationCategories", "getRubrics", "getCompetencyEvaluations", "getStudentRecoveries", "getStudentAcademicReport"
  ],
  "Alumno": [
    "getStudentExams", "getExamQuestions", "submitExam", "getExamResult", "getEvaluationCategories", "getRubrics", "getCompetencyEvaluations", "getStudentRecoveries", "getStudentAcademicReport"
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
  const { bancoPreguntaId, areaCurricular, asignatura, grado, tema, dificultad, tipo, textoPregunta, opcionesJSON, respuestaCorrecta, etiquetas, puntosPredeterminados, accion } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "BancoPreguntas");

  if (accion === "eliminar" && bancoPreguntaId) {
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => String(r[0]).trim() === String(bancoPreguntaId).trim());
    if (idx !== -1) {
      sheet.getRange(idx + 1, 13).setValue("Inactivo");
      return { status: "success", message: "Pregunta desactivada en el banco de preguntas." };
    }
    throw new Error("Pregunta no encontrada en el banco.");
  }

  const qId = bancoPreguntaId || ("BNK-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
  const opcStr = typeof opcionesJSON === "object" ? JSON.stringify(opcionesJSON) : (opcionesJSON || "{}");
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]).trim() === String(qId).trim());

  if (idx !== -1) {
    sheet.getRange(idx + 1, 2, 1, 12).setValues([[
      areaCurricular || "General",
      asignatura || "",
      grado || "",
      tema || "",
      dificultad || "Media",
      tipo || "opcion_multiple",
      textoPregunta || "",
      opcStr,
      respuestaCorrecta || "",
      etiquetas || "",
      puntosPredeterminados || 1,
      "Activo"
    ]]);
    return { status: "success", bancoPreguntaId: qId, message: "Pregunta del banco actualizada correctamente." };
  }

  sheet.appendRow([
    qId,
    areaCurricular || "General",
    asignatura || "",
    grado || "",
    tema || "",
    dificultad || "Media",
    tipo || "opcion_multiple",
    textoPregunta || "",
    opcStr,
    respuestaCorrecta || "",
    etiquetas || "",
    puntosPredeterminados || 1,
    "Activo"
  ]);

  return { status: "success", bancoPreguntaId: qId, message: "Pregunta añadida exitosamente al banco." };
}

function getQuestionBank(payload) {
  const { areaCurricular, asignatura, grado, tema, dificultad } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "BancoPreguntas");
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return { status: "success", preguntas: [] };

  const normArea = areaCurricular ? normalizeString(areaCurricular) : "";
  const normAsig = asignatura ? normalizeString(asignatura) : "";
  const normGrado = grado ? normalizeString(grado) : "";

  const preguntas = data.slice(1).filter(r => {
    if (r[12] === "Inactivo") return false;
    if (normArea && normalizeString(r[1]) !== normArea) return false;
    if (normAsig && normalizeString(r[2]) !== normAsig) return false;
    if (normGrado && normalizeString(r[3]) !== normGrado) return false;
    if (tema && normalizeString(r[4]) !== normalizeString(tema)) return false;
    if (dificultad && normalizeString(r[5]) !== normalizeString(dificultad)) return false;
    return true;
  }).map(r => ({
    bancoPreguntaId: r[0],
    areaCurricular: r[1],
    asignatura: r[2],
    grado: r[3],
    tema: r[4],
    dificultad: r[5],
    tipo: r[6],
    textoPregunta: r[7],
    opciones: JSON.parse(r[8] || "{}"),
    respuestaCorrecta: r[9],
    etiquetas: r[10],
    puntosPredeterminados: parseFloat(r[11]) || 1
  }));

  return { status: "success", preguntas: preguntas };
}

function createExam(p) {
  p = p && typeof p === "object" && !Array.isArray(p) ? p : {};
  const actor = getVerifiedExamIdentity_(p);
  if (!actor.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");

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

function updateExamStatus({ examenId, estado }) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSheetOrThrow(ss, "Examenes");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === examenId) {
      sheet.getRange(i + 1, 8).setValue(estado);
      return { status: "success" };
    }
  }
  throw new Error("Examen no encontrado");
}

function updateExam(payload) {
  const { examenId, titulo, asignatura, gradoAsignado, seccionAsignada, fechaLimite, tiempoLimite, parcial } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSheetOrThrow(ss, "Examenes");
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] === examenId);

  if (rowIndex === -1) throw new Error("Examen no encontrado.");

  const examRow = data[rowIndex];
  if (titulo !== undefined) examRow[1] = titulo;
  if (asignatura !== undefined) examRow[2] = asignatura;
  if (gradoAsignado !== undefined) examRow[3] = gradoAsignado;
  if (seccionAsignada !== undefined) examRow[4] = seccionAsignada;
  if (fechaLimite !== undefined) examRow[5] = fechaLimite;
  if (tiempoLimite !== undefined) examRow[6] = tiempoLimite;
  if (parcial !== undefined) examRow[9] = parcial;

  sheet.getRange(rowIndex + 1, 1, 1, examRow.length).setValues([examRow]);

  return { status: "success", message: "Examen actualizado." };
}

function deleteExam(payload) {
  const { examenId } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const examenesSheet = getSheetOrThrow(ss, "Examenes");
  const entregasSheet = getSheetOrThrow(ss, "EntregasExamen");
  const preguntasSheet = getSheetOrThrow(ss, "PreguntasExamen");

  const examenesData = examenesSheet.getDataRange().getValues();
  const rowIndex = examenesData.findIndex(r => r[0] === examenId);
  if (rowIndex === -1) throw new Error("Examen no encontrado.");

  const entregasData = entregasSheet.getDataRange().getValues();
  const hasSubmissions = entregasData.some(r => r[1] === examenId);

  if (hasSubmissions) {
    examenesSheet.getRange(rowIndex + 1, 8).setValue("Inactivo");
    return { status: "success", message: "Examen desactivado (existen entregas)." };
  } else {
    // Eliminar preguntas
    const preguntasData = preguntasSheet.getDataRange().getValues();
    for (let i = preguntasData.length - 1; i >= 1; i--) {
      if (preguntasData[i][1] === examenId) {
        preguntasSheet.deleteRow(i + 1);
      }
    }
    // Eliminar examen
    examenesSheet.deleteRow(rowIndex + 1);
    return { status: "success", message: "Examen eliminado." };
  }
}

function getAllExams(payload) {
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(payload, ss, actor);
  if (!scope.authorized) return { status: "success", data: [] };
  const data = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const filtered = data.filter(row => {
    if (actor.role === "Profesor" && String(row[8] || "").trim() !== actor.userId) return false;
    const access = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", row[0], "LIST", payload);
    return access.authorized === true;
  });
  return { status: "success", data: filtered.map(r => ({
    examenId: r[0], titulo: r[1], asignatura: r[2], grado: r[3], seccion: r[4],
    fechaLimite: r[5] ? new Date(r[5]).toISOString() : null, estado: r[7], parcial: r[9] || "Primer Parcial"
  })) };
}

function getExamQuestions(payload) {
  const examenId = String((payload && payload.examenId) || "").trim();
  if (!examenId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const requestedStudentId = payload && (payload.studentId || payload.estudianteId || payload.userId);
  const context = getExamReadContext_(payload, requestedStudentId);
  const { actor, ss, studentActor, guardianActor, profile, scope } = context;
  const exams = getSheetOrThrow(ss, "Examenes").getDataRange().getValues();
  const matches = exams.slice(1).filter(row => String(row[0]) === examenId);
  if (matches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exam = matches[0];
  if (studentActor || guardianActor) {
    if (!isExamAssignedToStudent_(exam, profile) || !assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId, "READ_QUESTIONS", payload).authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
    const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues().slice(1);
    const hasOwnDelivery = deliveries.some(row => String(row[1]) === examenId && String(row[2]) === profile.userId);
    if (String(exam[7] || "") !== "Activo" && !hasOwnDelivery) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else {
    if (actor.role === "Profesor" && String(exam[8] || "").trim() !== actor.userId) throw new Error("RESOURCE_NOT_AVAILABLE");
    if (!assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examenId, "READ_QUESTIONS", payload).authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const questions = getSheetOrThrow(ss, "PreguntasExamen").getDataRange().getValues().slice(1)
    .filter(row => String(row[1]) === examenId)
    .map(row => ({ preguntaId: row[0], tipo: row[2], texto: row[3], opciones: JSON.parse(row[4] || "{}") }));
  return { status: "success", data: { titulo: exam[1], tiempoLimite: exam[6], preguntas: questions } };
}

// [F9-Task14] [P1] - Mejorar el rendimiento, la persistencia y la recuperación de operaciones de calificación
function getGradingPerformanceAndPersistenceMetrics(payload) {
  const startTime = Date.now();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

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
  const { examenId } = payload || {};
  if (!examenId) throw new Error("examenId es requerido para generar la analítica de distribución de calificaciones.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const examenesSheet = getSheetOrThrow(ss, "Examenes");
  const examenesData = examenesSheet.getDataRange().getValues();
  const examRow = examenesData.slice(1).find(r => String(r[0]).trim() === String(examenId).trim());

  if (!examRow) throw new Error("Examen no encontrado.");

  const entregasSheet = getSheetOrThrow(ss, "EntregasExamen");
  const entregasData = entregasSheet.getDataRange().getValues();

  const entregasExamen = entregasData.slice(1).filter(r => String(r[1]).trim() === String(examenId).trim());

  const evaluados = [];
  let pendientesCount = 0;

  entregasExamen.forEach(r => {
    const estado = String(r[6] || "").trim();
    const notaRaw = r[5];
    if (estado === "Pendiente" && (notaRaw === "" || notaRaw === null || notaRaw === undefined)) {
      pendientesCount++;
    } else {
      const notaNum = parseFloat(notaRaw);
      if (!isNaN(notaNum)) {
        evaluados.push(notaNum);
      } else if (estado === "Pendiente") {
        pendientesCount++;
      }
    }
  });

  const totalEvaluados = evaluados.length;

  if (totalEvaluados === 0) {
    return {
      status: "success",
      sinDatos: true,
      mensaje: "No hay calificaciones registradas aún para este examen.",
      data: {
        examenId,
        titulo: examRow[1],
        asignatura: examRow[2],
        grado: examRow[3],
        seccion: examRow[4],
        parcial: examRow[9] || "Primer Parcial",
        totalEvaluados: 0,
        totalPendientes: pendientesCount,
        promedio: 0,
        mediana: 0,
        minimo: 0,
        maximo: 0,
        desviacionEstandar: 0,
        porcentajeAprobacion: 0,
        intervalos: [
          { rango: "0 - 59", etiqueta: "Insuficiente", cantidad: 0, porcentaje: 0 },
          { rango: "60 - 69", etiqueta: "Suficiente", cantidad: 0, porcentaje: 0 },
          { rango: "70 - 79", etiqueta: "Bueno", cantidad: 0, porcentaje: 0 },
          { rango: "80 - 89", etiqueta: "Muy Bueno", cantidad: 0, porcentaje: 0 },
          { rango: "90 - 100", etiqueta: "Sobresaliente", cantidad: 0, porcentaje: 0 }
        ],
        curvaNormal: []
      }
    };
  }

  evaluados.sort((a, b) => a - b);

  const suma = evaluados.reduce((acc, val) => acc + val, 0);
  const promedio = parseFloat((suma / totalEvaluados).toFixed(2));

  let mediana = 0;
  const mid = Math.floor(totalEvaluados / 2);
  if (totalEvaluados % 2 === 0) {
    mediana = parseFloat(((evaluados[mid - 1] + evaluados[mid]) / 2).toFixed(2));
  } else {
    mediana = parseFloat(evaluados[mid].toFixed(2));
  }

  const minimo = parseFloat(evaluados[0].toFixed(2));
  const maximo = parseFloat(evaluados[totalEvaluados - 1].toFixed(2));

  const varianza = evaluados.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / totalEvaluados;
  const desviacionEstandar = parseFloat(Math.sqrt(varianza).toFixed(2));

  const aprobadosCount = evaluados.filter(n => n >= 60).length;
  const porcentajeAprobacion = parseFloat(((aprobadosCount / totalEvaluados) * 100).toFixed(2));

  let c0_59 = 0, c60_69 = 0, c70_79 = 0, c80_89 = 0, c90_100 = 0;
  evaluados.forEach(n => {
    if (n < 60) c0_59++;
    else if (n < 70) c60_69++;
    else if (n < 80) c70_79++;
    else if (n < 90) c80_89++;
    else c90_100++;
  });

  const intervalos = [
    { rango: "0 - 59", etiqueta: "Insuficiente", cantidad: c0_59, porcentaje: parseFloat(((c0_59 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "60 - 69", etiqueta: "Suficiente", cantidad: c60_69, porcentaje: parseFloat(((c60_69 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "70 - 79", etiqueta: "Bueno", cantidad: c70_79, porcentaje: parseFloat(((c70_79 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "80 - 89", etiqueta: "Muy Bueno", cantidad: c80_89, porcentaje: parseFloat(((c80_89 / totalEvaluados) * 100).toFixed(1)) },
    { rango: "90 - 100", etiqueta: "Sobresaliente", cantidad: c90_100, porcentaje: parseFloat(((c90_100 / totalEvaluados) * 100).toFixed(1)) }
  ];

  const curvaNormal = [];
  if (desviacionEstandar > 0) {
    for (let x = 0; x <= 100; x += 10) {
      const exponente = -0.5 * Math.pow((x - promedio) / desviacionEstandar, 2);
      const densidad = (1 / (desviacionEstandar * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
      const valorEstimated = parseFloat((densidad * totalEvaluados * 10).toFixed(2));
      curvaNormal.push({ x: x, y: valorEstimated });
    }
  }

  return {
    status: "success",
    sinDatos: false,
    data: {
      examenId,
      titulo: examRow[1],
      asignatura: examRow[2],
      grado: examRow[3],
      seccion: examRow[4],
      parcial: examRow[9] || "Primer Parcial",
      totalEvaluados,
      totalPendientes: pendientesCount,
      promedio,
      mediana,
      minimo,
      maximo,
      desviacionEstandar,
      porcentajeAprobacion,
      intervalos,
      curvaNormal
    }
  };
}

// [TAREA-F7-IMP-07] [Fase 7: Planificación Académica, Horarios y Recursos] - Validación de sobrecarga de evaluaciones por sección y conflictos de agenda.
function checkExamSchedulingConflict(payload) {
  const { seccionAsignada, fechaLimite, examenId, maxExamenesPorDia } = payload || {};
  if (!seccionAsignada || !fechaLimite) {
    return { status: "success", hasConflict: false };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const examenesSheet = getSheetOrThrow(ss, "Examenes");
  const examenesData = examenesSheet.getDataRange().getValues().slice(1);

  const limitMax = Number(maxExamenesPorDia) || 2;
  const dateTarget = String(fechaLimite).split("T")[0].split(" ")[0];

  const sameDayExams = examenesData.filter(r => {
    if (examenId && String(r[0]).trim() === String(examenId).trim()) return false;
    if (r[7] === "Inactivo" || r[7] === "Cancelado") return false;
    const sameSec = normalizeString(r[4]) === normalizeString(seccionAsignada) || normalizeString(r[3]) === normalizeString(seccionAsignada);
    const rDate = String(r[5]).split("T")[0].split(" ")[0];
    return sameSec && rDate === dateTarget;
  });

  if (sameDayExams.length >= limitMax) {
    return {
      status: "success",
      hasConflict: true,
      reason: `Sobrecarga evaluativa: La sección ${seccionAsignada} ya tiene ${sameDayExams.length} evaluacion(es) programada(s) para el ${dateTarget} (Límite máximo: ${limitMax}/día).`,
      examenesCount: sameDayExams.length,
      limitMax
    };
  }

  return { status: "success", hasConflict: false, examenesCount: sameDayExams.length, limitMax };
}

// [TAREA-F7-IMP-07] [Fase 7: Planificación Académica, Horarios y Recursos] - Simulación de reprogramación de evaluaciones previa confirmación oficial.
function simulateExamReschedule(payload) {
  const { examenId, nuevaFecha, nuevaSeccion } = payload || {};
  if (!examenId || !nuevaFecha) throw new Error("examenId y nuevaFecha son requeridos para simular la reprogramación.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSheetOrThrow(ss, "Examenes");
  const data = sheet.getDataRange().getValues();
  const examRow = data.slice(1).find(r => String(r[0]).trim() === String(examenId).trim());

  if (!examRow) throw new Error("Examen no encontrado.");

  const seccionTarget = nuevaSeccion || examRow[4];
  const conflictCheck = checkExamSchedulingConflict({
    seccionAsignada: seccionTarget,
    fechaLimite: nuevaFecha,
    examenId,
    maxExamenesPorDia: 2
  });

  logStructuredEvent("EXAM", "simulateExamReschedule", "INFO", "EXAM_RESCHEDULE_SIMULATED", `Simulación de reprogramación para examen ${examenId}`, { examenId, nuevaFecha, tieneConflicto: conflictCheck.hasConflict }, payload && payload.authRole);

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
  const eventType = (payload && payload.eventType) || "GENERIC_PURGE";
  const targetUserId = payload && payload.targetUserId;
  const targetRole = payload && payload.targetRole;
  const sessionId = payload && payload.sessionId;

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
      cache.remove("revoked_session_" + sessionId);
    }
    if (eventType === "SESSION_REVOKED" || eventType === "ACCOUNT_STATE_CHANGED") {
      if (targetUserId && payload.accountState && payload.accountState !== "Activa") {
        cache.put("revoked_user_" + targetUserId, "REVOKED", 86400);
      } else if (targetUserId && payload.accountState === "Activa") {
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
  if (!actor.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
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
  const requestedId = payload && (payload.studentId || payload.estudianteId || payload.userId);
  const context = getExamReadContext_(payload, requestedId);
  const { actor, ss, studentActor, guardianActor, profile, scope } = context;
  const targetId = studentActor || guardianActor ? profile.userId : String(requestedId || "").trim();
  const targetProfile = studentActor || guardianActor ? profile : getExamStudentProfile_(ss, targetId);
  if (!targetProfile) throw new Error("RESOURCE_NOT_AVAILABLE");
  const exams = getSheetOrThrow(ss, "Examenes").getDataRange().getValues().slice(1);
  const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues().slice(1);
  const data = exams.filter(exam => {
    if (!isExamAssignedToStudent_(exam, targetProfile) ||
        !assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", exam[0], "READ_STUDENT_EXAMS", payload).authorized) return false;
    if (!studentActor && !guardianActor && actor.role === "Profesor" && String(exam[8] || "").trim() !== actor.userId) return false;
    const delivery = deliveries.find(row => String(row[1]) === String(exam[0]) && String(row[2]) === targetId);
    return String(exam[7] || "") === "Activo" || !!delivery;
  }).map(exam => {
    const delivery = deliveries.find(row => String(row[1]) === String(exam[0]) && String(row[2]) === targetId);
    const state = delivery ? delivery[6] : exam[7];
    return { examenId: exam[0], titulo: exam[1], asignatura: exam[2], parcial: exam[9] || "Primer Parcial",
      grado: exam[3], seccion: exam[4], fechaLimite: exam[5] ? new Date(exam[5]).toISOString() : null,
      estado: state, profesorId: exam[8],
      entrega: delivery ? { estado: state, calificacion: state === "Pendiente" ? null : delivery[5], comentario: delivery[7] || "" } : null };
  });
  return { status: "success", data };
}

function getExamResult(payload) {
  const deliveryId = String((payload && payload.entregaExamenId) || "").trim();
  if (!deliveryId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ssPreAuth = SpreadsheetApp.openById(SPREADSHEET_ID);
  const deliveryPreAuth = getSheetOrThrow(ssPreAuth, "EntregasExamen").getDataRange().getValues().slice(1)
    .filter(row => String(row[0]) === deliveryId);
  if (deliveryPreAuth.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const requestedStudentId = String(deliveryPreAuth[0][2] || "").trim();
  const context = getExamReadContext_(payload, requestedStudentId);
  const { actor, ss, studentActor, guardianActor, profile, scope } = context;
  const deliveries = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues();
  const deliveryMatches = deliveries.slice(1).filter(row => String(row[0]) === deliveryId);
  if (deliveryMatches.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
  const delivery = deliveryMatches[0], examId = String(delivery[1] || "");
  const examRows = getSheetOrThrow(ss, "Examenes").getDataRange().getValues();
  const examMatches = examRows.slice(1).filter(row => String(row[0]) === examId);
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
  const actor = getVerifiedExamIdentity_(payload);
  if (!actor.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(payload, ss, actor);
  if (!scope.authorized) return { status: "success", data: [] };
  const usuariosData = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues();
  const examenesData = getSheetOrThrow(ss, "Examenes").getDataRange().getValues();
  const entregasValues = getSheetOrThrow(ss, "EntregasExamen").getDataRange().getValues();
  const submissions = entregasValues.slice(1).map(entrega => {
    const examen = examenesData.find(row => String(row[0]) === String(entrega[1]));
    if (!examen) return null;
    if (actor.role === "Profesor" && String(examen[8] || "").trim() !== actor.userId) return null;
    const ownership = assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", examen[0], "READ_SUBMISSIONS", payload);
    if (!ownership.authorized) return null;
    const usuario = usuariosData.find(row => String(row[0]) === String(entrega[2]));
    if (usuario) {
      if (payload && payload.grado && !isInTeacherList(usuario[2], payload.grado)) return null;
      if (payload && payload.seccion && !isInTeacherList(usuario[3], payload.seccion)) return null;
    }
    return {
      tipo: "Examen", entregaId: entrega[0], examenId: entrega[1], titulo: examen[1],
      alumnoId: entrega[2], alumnoNombre: usuario ? usuario[1] : "Usuario Desconocido",
      email: usuario ? usuario[4] : "N/A", grado: usuario ? usuario[2] : "N/A",
      seccion: usuario ? usuario[3] : "N/A", asignatura: examen[2] || "N/A",
      parcial: examen[9] || "Primer Parcial", fecha: new Date(entrega[3]),
      calificacion: entrega[5], estado: entrega[6], comentario: entrega[7] || ""
    };
  }).filter(Boolean);
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

function gradeExamSubmission(payload) {
  const { entregaId, calificacion, estado, comentario, temaAsociado, asignaturaAsociada } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "EntregasExamen");

  const data = entregasSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === entregaId);

  if (rowIndex !== -1) {
    const rowData = data[rowIndex];

    // Asegurar que la fila tenga al menos 10 columnas para soportar metadatos (v7.7.5)
    // 0:entregaId, 1:examenId, 2:userId, 3:fecha, 4:respuestas, 5:nota, 6:estado, 7:comentario, 8:tema, 9:asignatura
    while(rowData.length < 10) { rowData.push(""); }

    rowData[5] = calificacion; // Columna F: Nota
    rowData[6] = estado;       // Columna G: Estado
    rowData[7] = comentario;   // Columna H: Comentario
    rowData[8] = temaAsociado || "";
    rowData[9] = asignaturaAsociada || "";

    entregasSheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
    return { status: "success", message: "Examen calificado." };
  }
  throw new Error("Entrega de examen no encontrada.");
}

function deleteExamSubmission(payload) {
  const { entregaId } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "EntregasExamen");
  const data = entregasSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === entregaId);

  if (rowIndex === -1) throw new Error("Entrega no encontrada.");

  entregasSheet.deleteRow(rowIndex + 1);
  return { status: "success", message: "Entrega de examen eliminada correctamente." };
}

// --- FUNCIONES EVALUACIÓN ACADÉMICA Y LIBRO DE CALIFICACIONES (FASE 6) ---

function getEvaluationCategories(payload) {
  const { ambito } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CategoriasEvaluacion");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    const defaultCats = [
      ["CAT-1", "Tareas y Trabajos", "Global", 35, "100", "Activo"],
      ["CAT-2", "Exámenes y Pruebas", "Global", 40, "100", "Activo"],
      ["CAT-3", "Proyectos e Investigaciones", "Global", 15, "100", "Activo"],
      ["CAT-4", "Practicas y Participacion", "Global", 10, "100", "Activo"]
    ];
    sheet.appendRow(["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"]);
    defaultCats.forEach(c => sheet.appendRow(c));
    return {
      status: "success",
      data: defaultCats.map(c => ({
        categoriaId: c[0], nombre: c[1], ambito: c[2], porcentajePonderacion: c[3], escalaId: c[4], estado: c[5]
      }))
    };
  }

  const categories = data.slice(1).map(r => ({
    categoriaId: r[0],
    nombre: r[1],
    ambito: r[2] || "Global",
    porcentajePonderacion: parseFloat(r[3]) || 0,
    escalaId: r[4] || "100",
    estado: r[5] || "Activo"
  }));

  return { status: "success", data: categories };
}

// [F9-Task03] [P0] - Consolidar la administración de escalas, ponderaciones y métodos de cálculo académico
function saveEvaluationCategory(payload) {
  const { categoriaId, nombre, porcentajePonderacion, ambito, escalaId } = payload || {};
  if (!nombre) throw new Error("Nombre de la categoría es requerido.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CategoriasEvaluacion");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Nombre", "Ambito", "PorcentajePonderacion", "EscalaID", "Estado"]);
  }

  const data = sheet.getDataRange().getValues();
  let cid = categoriaId;

  if (cid) {
    const idx = data.findIndex(r => String(r[0]).trim() === String(cid).trim());
    if (idx !== -1) {
      sheet.getRange(idx + 1, 2).setValue(nombre);
      sheet.getRange(idx + 1, 4).setValue(porcentajePonderacion || 0);
      return { status: "success", message: "Categoría de evaluación actualizada." };
    }
  }

  cid = "CAT-" + Date.now();
  sheet.appendRow([cid, nombre, ambito || "Global", porcentajePonderacion || 0, escalaId || "100", "Activo"]);
  return { status: "success", message: "Categoría de evaluación registrada.", data: { categoriaId: cid } };
}

function getRubrics(payload) {
  const { asignatura } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "RubricasEvaluacion");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };

  const rubrics = data.slice(1).filter(r => {
    if (r[3] === "Eliminada") return false;
    if (asignatura && normalizeString(r[2]) !== normalizeString(asignatura)) return false;
    return true;
  }).map(r => ({
    rubricaId: r[0],
    titulo: r[1],
    asignatura: r[2],
    estado: r[3] || "Activa",
    criterios: r[4] ? (typeof r[4] === 'string' ? JSON.parse(r[4]) : r[4]) : []
  }));

  return { status: "success", data: rubrics };
}

function saveRubric(payload) {
  const { rubricaId, titulo, asignatura, criterios } = payload || {};
  if (!titulo) throw new Error("Título de la rúbrica es requerido.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "RubricasEvaluacion");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Titulo", "Asignatura", "Estado", "CriteriosJSON"]);
  }

  const rid = rubricaId || ("RUB-" + Date.now());
  const critJSON = JSON.stringify(criterios || []);

  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]).trim() === String(rid).trim());

  if (idx !== -1) {
    sheet.getRange(idx + 1, 2).setValue(titulo);
    sheet.getRange(idx + 1, 3).setValue(asignatura || "General");
    sheet.getRange(idx + 1, 5).setValue(critJSON);
  } else {
    sheet.appendRow([rid, titulo, asignatura || "General", "Activa", critJSON]);
  }

  return { status: "success", message: "Rúbrica guardada correctamente.", data: { rubricaId: rid } };
}

// [F9-Task12] [P1] - Ampliar la evaluación por competencias, rúbricas e indicadores de logro
function saveCompetencyEvaluation(payload) {
  const { competenciaId, indicadorId, userId, asignaturaId, periodoId, nivelDesempeno, observaciones, rubricaId } = payload || {};
  if (!competenciaId || !userId || !nivelDesempeno) {
    return { status: "error", message: "competenciaId, userId y nivelDesempeno son requeridos para evaluar competencias." };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "EvaluacionesCompetencias");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID", "PeriodoID", "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro"]);
  }

  const cid = "COMP-EVAL-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const now = new Date();

  sheet.appendRow([
    cid,
    competenciaId,
    indicadorId || "IND-GENERIC",
    userId,
    asignaturaId || "ASIG-GENERIC",
    periodoId || "P1",
    String(nivelDesempeno).trim(),
    observaciones || "",
    rubricaId || "",
    now
  ]);

  return {
    status: "success",
    evaluacionCompetenciaId: cid,
    competenciaId,
    userId,
    nivelDesempeno,
    message: "Evaluación cualitativa por competencias e indicadores registrada exitosamente."
  };
}

function getCompetencyEvaluations(payload) {
  const { userId, asignaturaId, periodoId, competenciaId } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "EvaluacionesCompetencias");
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return { status: "success", data: [] };

  const filtered = data.slice(1).filter(r => {
    if (userId && String(r[3]).trim() !== String(userId).trim()) return false;
    if (asignaturaId && String(r[4]).trim() !== String(asignaturaId).trim()) return false;
    if (periodoId && String(r[5]).trim() !== String(periodoId).trim()) return false;
    if (competenciaId && String(r[1]).trim() !== String(competenciaId).trim()) return false;
    return true;
  }).map(r => ({
    evaluacionCompetenciaId: r[0],
    competenciaId: r[1],
    indicadorId: r[2],
    userId: r[3],
    asignaturaId: r[4],
    periodoId: r[5],
    nivelDesempeno: r[6],
    observaciones: r[7],
    rubricaId: r[8],
    fechaRegistro: r[9] ? new Date(r[9]).toISOString() : null
  }));

  return { status: "success", total: filtered.length, data: filtered };
}

function getGradebookData(payload) {
  const { grado, seccion, asignatura, parcial, profesorId } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const usuariosSheet = getSheetOrThrow(ss, "Usuarios");
  const usuariosData = usuariosSheet.getDataRange().getValues().slice(1);
  const alumnos = usuariosData.filter(u => {
    const rol = normalizeString(u[6] || u[5]);
    if (rol !== "estudiante" && rol !== "alumno") return false;
    if (grado && normalizeString(u[2]) !== normalizeString(grado)) return false;
    if (seccion && u[3] && normalizeString(u[3]) !== normalizeString(seccion)) return false;
    return true;
  }).map(u => ({
    userId: u[0],
    nombreCompleto: u[1],
    grado: u[2],
    seccion: u[3],
    email: u[4]
  }));

  const califSheet = getOrCreateSheet(ss, "CalificacionesEstudiantes");
  const califData = califSheet.getDataRange().getValues();
  const studentIds = new Set(alumnos.map(a => String(a.userId).trim()));
  const calificaciones = califData.length > 1 ? califData.slice(1).filter(r => studentIds.has(String(r[2]).trim())).map(r => ({
    calificacionId: r[0],
    evaluacionId: r[1],
    userId: r[2],
    notaObtenida: parseFloat(r[3]) || 0,
    puntajePonderado: parseFloat(r[4]) || 0,
    esBorrador: r[5] === true || String(r[5]).toLowerCase() === "true",
    esPublicada: r[6] === true || String(r[6]).toLowerCase() === "true",
    observaciones: r[7] || "",
    fechaRegistro: r[8] ? new Date(r[8]).toISOString() : null
  })) : [];

  const recSheet = getOrCreateSheet(ss, "RecuperacionesEstudiante");
  const recData = recSheet.getDataRange().getValues();
  const recuperaciones = recData.length > 1 ? recData.slice(1).filter(r => studentIds.has(String(r[2]).trim())).map(r => ({
    recuperacionId: r[0],
    evaluacionId: r[1],
    userId: r[2],
    notaOriginal: parseFloat(r[3]) || 0,
    notaRecuperada: parseFloat(r[4]) || 0,
    notaFinalCalculada: parseFloat(r[5]) || 0,
    metodoAplicado: r[6],
    autorizadoPor: r[7],
    fecha: r[8] ? new Date(r[8]).toISOString() : null
  })) : [];

  const catRes = getEvaluationCategories({});
  const categories = catRes && catRes.data ? catRes.data : [];

  const cierresSheet = getOrCreateSheet(ss, "CierresPeriodos");
  const cierresData = cierresSheet.getDataRange().getValues();
  const cierreRow = cierresData.slice(1).find(r =>
    normalizeString(r[3]) === normalizeString(grado) &&
    normalizeString(r[4]) === normalizeString(seccion) &&
    normalizeString(r[5]) === normalizeString(asignatura) &&
    normalizeString(r[2]) === normalizeString(parcial)
  );

  const estadoPeriodo = cierreRow ? cierreRow[7] : "Abierto";

  return {
    status: "success",
    data: {
      alumnos,
      calificaciones,
      recuperaciones,
      categories,
      estadoPeriodo
    }
  };
}

function saveGradebookGrades(payload) {
  const { calificaciones, esBorrador, esPublicada, profesorId, anoLectivo, esAnoHistoricoAnterior, esPadreDeEstudiante, authRole, periodoId, asignatura, grado, seccion } = payload || {};

  if (esAnoHistoricoAnterior === true) {
    throw new Error("Las calificaciones de años escolares anteriores son inalterables y no pueden modificarse por ningún rol dentro de la plataforma.");
  }

  if (esPadreDeEstudiante === true) {
    throw new Error("Un docente no puede modificar las calificaciones de su propio hijo fuera de las reglas ordinarias de cierre de periodo.");
  }

  if (periodoId) {
    const ssCheck = SpreadsheetApp.openById(SPREADSHEET_ID);
    const cierresSheet = getOrCreateSheet(ssCheck, "CierresPeriodos");
    const cierresData = cierresSheet.getDataRange().getValues();
    const isClosed = cierresData.slice(1).some(r =>
      String(r[2]).trim() === String(periodoId).trim() &&
      String(r[7]).trim() === "Cerrado" &&
      (!asignatura || String(r[5]).trim() === String(asignatura).trim())
    );
    if (isClosed && authRole !== "Secretaría" && authRole !== "Administrador" && authRole !== "Director") {
      throw new Error("El periodo de evaluación se encuentra cerrado. Para modificar notas registradas se requiere autorización explícita de Secretaría.");
    }
  }

  if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
    throw new Error("Se requiere una lista de calificaciones para guardar.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CalificacionesEstudiantes");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado", "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"]);
  }

  const now = new Date();
  const data = sheet.getDataRange().getValues();

  const indexMap = {};
  for (let i = 1; i < data.length; i++) {
    const key = `${String(data[i][1]).trim()}_${String(data[i][2]).trim()}`;
    indexMap[key] = i;
  }

  let savedCount = 0;
  calificaciones.forEach(c => {
    const { evaluacionId, userId, notaObtenida, puntajePonderado, observaciones } = c;
    if (!evaluacionId || !userId) return;

    const key = `${String(evaluacionId).trim()}_${String(userId).trim()}`;
    if (key in indexMap) {
      const idx = indexMap[key];
      data[idx][3] = notaObtenida || 0;
      data[idx][4] = puntajePonderado || 0;
      data[idx][5] = esBorrador !== false;
      data[idx][6] = esPublicada === true;
      data[idx][7] = observaciones || "";
      data[idx][8] = now;
    } else {
      const cid = "CALIF-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      const newRow = [cid, evaluacionId, userId, notaObtenida || 0, puntajePonderado || 0, esBorrador !== false, esPublicada === true, observaciones || "", now];
      data.push(newRow);
      indexMap[key] = data.length - 1;
    }
    savedCount++;
  });

  if (data.length > 1) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }

  return { status: "success", message: `Se guardaron ${savedCount} calificaciones exitosamente.` };
}

// [F9-Task10] [P1] - Ampliar el libro de calificaciones para mejorar el registro individual y masivo
function bulkApplyGradebookGrades(payload) {
  const { evaluacionId, estudiantes, nota, observaciones, sobrescribirExistentes } = payload || {};
  if (!evaluacionId || !Array.isArray(estudiantes) || estudiantes.length === 0) {
    return { status: "error", message: "Se requiere evaluacionId y una lista de IDs de estudiantes para aplicación masiva." };
  }

  const notaNum = parseFloat(nota);
  if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
    return { status: "error", message: "La calificación a aplicar masivamente debe estar entre 0 y 100." };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CalificacionesEstudiantes");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado", "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"]);
  }

  const data = sheet.getDataRange().getValues();
  const now = new Date();
  let aplicados = 0;
  let omitidos = 0;

  const indexMap = {};
  for (let i = 1; i < data.length; i++) {
    const key = `${String(data[i][1]).trim()}_${String(data[i][2]).trim()}`;
    indexMap[key] = i;
  }

  estudiantes.forEach(uId => {
    const studentIdStr = String(uId).trim();
    if (!studentIdStr) return;

    const key = `${String(evaluacionId).trim()}_${studentIdStr}`;
    if (key in indexMap) {
      const idx = indexMap[key];
      const notaActual = parseFloat(data[idx][3]);
      if (!sobrescribirExistentes && !isNaN(notaActual) && notaActual > 0) {
        omitidos++;
        return;
      }
      data[idx][3] = notaNum;
      data[idx][5] = true; // EsBorrador
      data[idx][7] = observaciones || data[idx][7] || "Aplicado masivamente";
      data[idx][8] = now;
      aplicados++;
    } else {
      const cid = "CALIF-BULK-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      const newRow = [cid, evaluacionId, studentIdStr, notaNum, notaNum, true, false, observaciones || "Aplicado masivamente", now];
      data.push(newRow);
      indexMap[key] = data.length - 1;
      aplicados++;
    }
  });

  if (data.length > 1) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }

  return {
    status: "success",
    evaluacionId,
    totalProcesados: estudiantes.length,
    aplicados,
    omitidos,
    message: `Calificación masiva (${notaNum}) aplicada a ${aplicados} estudiante(s). ${omitidos} omitido(s) por conservar nota previa.`
  };
}

function copyEvaluationSetupBetweenGroups(payload) {
  const { grupoOrigen, grupoDestino } = payload || {};
  if (!grupoOrigen || !grupoDestino) {
    return { status: "error", message: "Se requieren parámetros grupoOrigen y grupoDestino para copiar la configuración de evaluación." };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetCat = getOrCreateSheet(ss, "CategoriasEvaluacion");
  const dataCat = sheetCat.getDataRange().getValues();

  let copiados = 0;
  if (dataCat.length > 1) {
    const origAsig = String(grupoOrigen.asignatura || "").trim();
    const destAsig = String(grupoDestino.asignatura || "").trim();
    const destGrado = String(grupoDestino.grado || "").trim();
    const destSec = String(grupoDestino.seccion || "").trim();
    const destPer = String(grupoDestino.periodo || "").trim();

    for (let i = 1; i < dataCat.length; i++) {
      const rowAsig = String(dataCat[i][1] || "").trim();
      if (!origAsig || rowAsig === origAsig) {
        const newCatId = "CAT-COPY-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        const newRow = [
          newCatId,
          destAsig || rowAsig,
          dataCat[i][2], // Nombre Categoria
          dataCat[i][3], // Ponderacion
          destGrado || dataCat[i][4],
          destSec || dataCat[i][5],
          destPer || dataCat[i][6],
          new Date()
        ];
        sheetCat.appendRow(newRow);
        copiados++;
      }
    }
  }

  return {
    status: "success",
    categoriasCopias: copiados,
    message: `Configuración de evaluación copiada exitosamente (${copiados} categoría(s) duplicadas para el grupo destino sin copiar datos de estudiantes).`
  };
}

// [F9-Task11] [P1] - Ampliar las recuperaciones académicas y su integración con los resultados oficiales
function saveStudentRecovery(payload) {
  const { evaluacionId, userId, notaOriginal, notaRecuperada, metodoAplicado, autorizadoPor, periodoId, asignatura } = payload || {};
  if (!evaluacionId || !userId) throw new Error("evaluacionId y userId son requeridos.");

  if (periodoId) {
    const ssCheck = SpreadsheetApp.openById(SPREADSHEET_ID);
    const cierresSheet = getOrCreateSheet(ssCheck, "CierresPeriodos");
    const cierresData = cierresSheet.getDataRange().getValues();
    const isClosed = cierresData.slice(1).some(r =>
      String(r[2]).trim() === String(periodoId).trim() &&
      String(r[7]).trim() === "Cerrado" &&
      (!asignatura || String(r[5]).trim() === String(asignatura).trim())
    );
    if (isClosed) {
      throw new Error("El período académico se encuentra cerrado. Las recuperaciones en períodos cerrados requieren autorización explícita de reapertura o rectificación.");
    }
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "RecuperacionesEstudiante");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada", "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"]);
  }

  const orig = parseFloat(notaOriginal) || 0;
  const rec = parseFloat(notaRecuperada) || 0;
  if (isNaN(orig) || orig < 0 || orig > 100 || isNaN(rec) || rec < 0 || rec > 100) {
    throw new Error("Las calificaciones originales y recuperadas deben ser valores numéricos válidos entre 0 y 100.");
  }

  let finalCalc = rec;
  const metodo = metodoAplicado || "Sustitucion";
  if (metodo === "Promedio") finalCalc = (orig + rec) / 2;
  else if (metodo === "Mayor") finalCalc = Math.max(orig, rec);

  const recId = "REC-" + Date.now();
  const now = new Date();

  sheet.appendRow([recId, evaluacionId, userId, orig, rec, finalCalc, metodo, autorizadoPor || "Docente", now]);

  return {
    status: "success",
    message: "Recuperación de nota registrada e integrada exitosamente.",
    data: { recuperacionId: recId, notaOriginal: orig, notaRecuperada: rec, notaFinalCalculada: finalCalc, metodoAplicado: metodo }
  };
}

function getStudentRecoveries(payload) {
  const { userId, evaluacionId } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "RecuperacionesEstudiante");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };

  const recoveries = data.slice(1).filter(r => {
    if (userId && String(r[2]).trim() !== String(userId).trim()) return false;
    if (evaluacionId && String(r[1]).trim() !== String(evaluacionId).trim()) return false;
    return true;
  }).map(r => ({
    recuperacionId: r[0],
    evaluacionId: r[1],
    userId: r[2],
    notaOriginal: parseFloat(r[3]),
    notaRecuperada: parseFloat(r[4]),
    notaFinalCalculada: parseFloat(r[5]),
    metodoAplicado: r[6],
    autorizadoPor: r[7],
    fecha: r[8] ? new Date(r[8]).toISOString() : null
  }));

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
  const { anoId, periodoId, grado, seccion, asignatura, profesorId } = payload || {};
  if (!grado || !asignatura || !periodoId) throw new Error("Grado, Asignatura y Período son requeridos.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CierresPeriodos");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"]);
  }

  const cierreId = "CIERRE-" + Date.now();
  const now = new Date();

  sheet.appendRow([cierreId, anoId || "ANO-CURRENT", periodoId, grado, seccion || "A", asignatura, profesorId || "Docente", "Cerrado", now]);

  publishGradebookForContext(ss, grado, seccion, asignatura);

  return { status: "success", message: `Período ${periodoId} cerrado oficialmente para ${asignatura} (${grado} ${seccion || 'A'}).` };
}

function submitGradebookForReview(payload) {
  const { anoId, periodoId, grado, seccion, asignatura, profesorId, notasPendientesCount } = payload || {};
  if (!grado || !asignatura || !periodoId) throw new Error("Grado, Asignatura y Período son requeridos.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CierresPeriodos");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"]);
  }

  const cierreId = "REV-" + Date.now();
  const now = new Date();

  sheet.appendRow([cierreId, anoId || "ANO-CURRENT", periodoId, grado, seccion || "A", asignatura, profesorId || "Docente", "PendienteRevision", now]);

  return {
    status: "success",
    cierreId,
    estado: "PendienteRevision",
    notasPendientesCount: notasPendientesCount || 0,
    message: `Libro de notas de ${asignatura} (${grado} ${seccion || 'A'}) enviado a revisión de Secretaría/Dirección.`
  };
}

function reviewPeriodGradebook(payload) {
  const { cierreId, decision, observaciones, revisadoPor } = payload || {};
  if (!cierreId || !decision) throw new Error("cierreId y decision ('Aprobado', 'Observado', 'Publicado') son requeridos.");

  const estadoTarget = decision === "Observado" ? "Observado" : (decision === "Aprobado" ? "Aprobado" : "Cerrado");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CierresPeriodos");
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]).trim() === String(cierreId).trim());

  if (idx === -1) throw new Error("Registro de período no encontrado.");

  sheet.getRange(idx + 1, 8).setValue(estadoTarget);
  sheet.getRange(idx + 1, 9).setValue(new Date());

  if (estadoTarget === "Cerrado" || decision === "Publicado") {
    const targetRow = data[idx];
    const targetGrado = targetRow ? targetRow[3] : null;
    const targetSeccion = targetRow ? targetRow[4] : null;
    const targetAsignatura = targetRow ? targetRow[5] : null;

    publishGradebookForContext(ss, targetGrado, targetSeccion, targetAsignatura);
  }

  return {
    status: "success",
    cierreId,
    estadoActual: estadoTarget,
    revisadoPor: revisadoPor || "Secretaría",
    observaciones: observaciones || "",
    message: `Revisión completada: Período marcado como '${estadoTarget}'.`
  };
}

// [F9-Task06] [P0] - Fortalecer las rectificaciones de notas y la trazabilidad de los cambios
function reopenPeriodGradebook(payload) {
  const { cierreId, motivo, autorizadoPor } = payload || {};
  if (!cierreId) throw new Error("cierreId es requerido.");
  if (!motivo || String(motivo).trim().length < 10) {
    throw new Error("Se requiere una justificación detallada (mínimo 10 caracteres) para reabrir un período cerrado.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CierresPeriodos");
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]).trim() === String(cierreId).trim());
  if (idx === -1) throw new Error("Registro de cierre no encontrado.");

  sheet.getRange(idx + 1, 8).setValue("Reabierto");

  try {
    const rectSheet = getOrCreateSheet(ss, "HistorialRectificacionesNotas");
    if (rectSheet.getLastRow() === 0) {
      rectSheet.appendRow(["RectificacionID", "EvaluacionID", "UserID", "Accion", "NotaAnterior", "NotaNueva", "Motivo", "AutorizadoPor", "Fecha"]);
    }
    rectSheet.appendRow([
      "REAP-" + Date.now(),
      cierreId,
      payload && payload._verifiedUserId ? payload._verifiedUserId : (autorizadoPor || "Secretaría"),
      "REAPERTURA_PERIODO",
      "Cerrado",
      "Reabierto",
      String(motivo).trim(),
      autorizadoPor || "Secretaría",
      new Date()
    ]);
  } catch (e) {
    logDebug("Error registrando auditoría de reapertura", e.message);
  }

  return { status: "success", cierreId, estado: "Reabierto", message: "Período reabierto oficialmente para rectificaciones autorizadas." };
}

function rectifyStudentGrade(payload) {
  const { evaluacionId, userId, calificacionId, notaNueva, motivo, autorizadoPor, authRole } = payload || {};
  if ((!calificacionId && (!evaluacionId || !userId)) || notaNueva === undefined || notaNueva === null) {
    throw new Error("evaluacionId, userId o calificacionId, y notaNueva son requeridos.");
  }

  if (!motivo || String(motivo).trim().length < 10) {
    throw new Error("Se requiere un motivo o justificación de al menos 10 caracteres para rectificar una nota oficial.");
  }

  const notaNum = parseFloat(notaNueva);
  if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
    throw new Error("La nueva calificación debe ser un número válido dentro del rango 0 a 100.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "CalificacionesEstudiantes");
  const data = sheet.getDataRange().getValues();

  let targetIdx = -1;
  if (calificacionId) {
    targetIdx = data.findIndex(r => String(r[0]).trim() === String(calificacionId).trim());
  } else {
    targetIdx = data.findIndex(r => String(r[1]).trim() === String(evaluacionId).trim() && String(r[2]).trim() === String(userId).trim());
  }

  if (targetIdx === -1) throw new Error("Registro de calificación no encontrado para rectificar.");

  const rowData = data[targetIdx];
  const notaAnterior = parseFloat(rowData[3]) || 0;
  const now = new Date();

  sheet.getRange(targetIdx + 1, 4).setValue(notaNum); // NotaObtenida
  sheet.getRange(targetIdx + 1, 6).setValue(false);   // esBorrador = false
  sheet.getRange(targetIdx + 1, 7).setValue(true);    // esPublicada = true
  sheet.getRange(targetIdx + 1, 8).setValue(`RECTIFICADO: ${String(motivo).trim()}`);
  sheet.getRange(targetIdx + 1, 9).setValue(now);

  const rectSheet = getOrCreateSheet(ss, "HistorialRectificacionesNotas");
  if (rectSheet.getLastRow() === 0) {
    rectSheet.appendRow(["RectificacionID", "EvaluacionID", "UserID", "Accion", "NotaAnterior", "NotaNueva", "Motivo", "AutorizadoPor", "Fecha"]);
  }

  const rectId = "RECT-" + Date.now();
  rectSheet.appendRow([
    rectId,
    evaluacionId || rowData[1],
    userId || rowData[2],
    "RECTIFICACION_NOTA",
    notaAnterior,
    notaNum,
    String(motivo).trim(),
    autorizadoPor || (payload && payload._verifiedUserId) || "Secretaría",
    now
  ]);

  return {
    status: "success",
    rectificacionId: rectId,
    notaAnterior: notaAnterior,
    notaNueva: notaNum,
    autorizadoPor: autorizadoPor || "Secretaría",
    message: "Calificación rectificada oficialmente con trazabilidad y auditoría de cambios registrada."
  };
}

function getGradeRectificationHistory(payload) {
  const { userId, evaluacionId } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "HistorialRectificacionesNotas");
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return { status: "success", data: [] };

  const history = data.slice(1).filter(r => {
    if (userId && String(r[2]).trim() !== String(userId).trim()) return false;
    if (evaluacionId && String(r[1]).trim() !== String(evaluacionId).trim()) return false;
    return true;
  }).map(r => ({
    rectificacionId: r[0],
    evaluacionId: r[1],
    userId: r[2],
    accion: r[3],
    notaAnterior: parseFloat(r[4]) || 0,
    notaNueva: parseFloat(r[5]) || 0,
    motivo: r[6],
    autorizadoPor: r[7],
    fecha: r[8] ? new Date(r[8]).toISOString() : null
  }));

  return { status: "success", data: history };
}

function getStudentAcademicReport(payload) {
  const { userId, anoId } = payload || {};
  if (!userId) throw new Error("userId es requerido.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const matSheet = getOrCreateSheet(ss, "Matriculas");
  const matData = matSheet.getDataRange().getValues();
  const userMatriculas = matData.length > 1 ? matData.slice(1).filter(r => String(r[2]).trim() === String(userId).trim()) : [];

  const califSheet = getOrCreateSheet(ss, "CalificacionesEstudiantes");
  const califData = califSheet.getDataRange().getValues();
  const userCalificaciones = califData.length > 1 ? califData.slice(1).filter(r => {
    if (String(r[2]).trim() !== String(userId).trim()) return false;
    const esBorrador = r[5] === true || String(r[5]).toLowerCase() === "true";
    const esPublicada = r[6] === true || String(r[6]).toLowerCase() === "true";
    return esPublicada || !esBorrador;
  }).map(r => ({
    calificacionId: r[0],
    evaluacionId: r[1],
    notaObtenida: parseFloat(r[3]) || 0,
    puntajePonderado: parseFloat(r[4]) || 0,
    esPublicada: r[6] === true || String(r[6]).toLowerCase() === "true",
    observaciones: r[7] || "",
    fechaRegistro: r[8] ? new Date(r[8]).toISOString() : null
  })) : [];

  const recSheet = getOrCreateSheet(ss, "RecuperacionesEstudiante");
  const recData = recSheet.getDataRange().getValues();
  const userRecuperaciones = recData.length > 1 ? recData.slice(1).filter(r => String(r[2]).trim() === String(userId).trim()).map(r => ({
    recuperacionId: r[0],
    evaluacionId: r[1],
    notaOriginal: parseFloat(r[3]) || 0,
    notaRecuperada: parseFloat(r[4]) || 0,
    notaFinalCalculada: parseFloat(r[5]) || 0,
    metodoAplicado: r[6],
    autorizadoPor: r[7],
    fecha: r[8] ? new Date(r[8]).toISOString() : null
  })) : [];

  const catRes = getEvaluationCategories({});
  const categories = catRes && catRes.data ? catRes.data : [];

  return {
    status: "success",
    data: {
      userId: userId,
      matriculas: userMatriculas.map(r => ({ matriculaId: r[0], fecha: r[1], grado: r[4], seccion: r[5], periodo: r[6], estado: r[8] })),
      calificaciones: userCalificaciones,
      recuperaciones: userRecuperaciones,
      categories: categories
    }
  };
}
