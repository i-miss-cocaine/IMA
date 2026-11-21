// NOTA: Las URLs de los microservicios solo se deben actualizar en el frontend (js/config.js), no en este archivo.
// [REQ-EXP-004] [Requerimientos de Expansión y Desarrollo] - Consolidación del módulo de tareas, entregas, evaluaciones y penalización por entrega tardía.
// --- MICROSERVICIO DE TAREAS ---

const SPREADSHEET_ID = "1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww";
const DRIVE_FOLDER_ID = "1D-VlJ52-olcfcDUSSsVLDzkeT2SvkDcB";
const DEBUG_MODE = true;

function normalizeString(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function logDebug(message, optionalParam) {
  if (DEBUG_MODE) {
    let logMessage = `[TASK-SVC] ${new Date().toLocaleTimeString()} - ${message}`;
    if (optionalParam !== undefined) {
      try { logMessage += ` | ${JSON.stringify(optionalParam, null, 2)}`; } catch (e) { logMessage += ` | [Parámetro no serializable]`; }
    }
    console.log(logMessage);
  }
}

function logFileMetadata(ss, meta) {
  const sheet=ensureTaskServiceFileMetadataSheet(ss);
  sheet.appendRow(["META-"+Utilities.getUuid(),meta.titulo||meta.fileName||"",meta.fileName||"",meta.fileName||"",meta.tipoRecurso||"Entrega",
    meta.asignatura||"General",meta.grado||"General",meta.seccion||"General",meta.parcial||"General",new Date().getFullYear(),meta.tema||"General",
    meta.tareaId||"",meta.profesorId||"",new Date().toISOString(),"Activo",meta.fileId||"",meta.fileUrl||"",meta.mimeType||"",meta.sizeBytes||0,
    meta.ownerUserId||"",meta.folderId||""]);
}

function getSheetOrThrow(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    const errorMessage = `Hoja no encontrada: "${name}".`;
    logDebug(errorMessage);
    throw new Error(errorMessage);
  }
  return sheet;
}

// --- PUNTOS DE ENTRADA ---
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Microservicio de Tareas funcionando." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  // Apps Script no permite setHeaders directamente, se ignora para CORS básico
  return ContentService.createTextOutput("");
}

const PUBLIC_ACTIONS = [];

const ROLE_PERMISSIONS = {
  "Administrador": ["*",
    "getSubmissionDocumentPreviewUrl"],
  "Desarrollador": ["*"],
  "Padre": ["getStudentTasks", "getVirtualClassrooms", "getPosts", "getStudyMaterials", "getSubmissionComments"],
  "Tutor": ["getStudentTasks", "getVirtualClassrooms", "getPosts", "getStudyMaterials", "getSubmissionComments"],
  "Responsable": ["getStudentTasks", "getVirtualClassrooms", "getPosts", "getStudyMaterials", "getSubmissionComments"],
  "Dirección": ["*"],
  "Secretaría": ["*",
    "getSubmissionDocumentPreviewUrl"],
  "Profesor": [
    "createTask", "updateTask", "deleteTask", "uploadFile", "gradeSubmission", "gradeSubmissionWithRubric", "deleteSubmission",
    "getStudentTasks", "getAllTasks", "getTeacherActivity",
    "getVirtualClassrooms", "createVirtualClassroom", "getPosts", "createPost", "updatePost", "deletePost",
    "getStudyMaterials", "createStudyMaterial", "deleteStudyMaterial", "returnSubmissionForRevision",
    "getSubmissionComments", "addSubmissionComment", "getSubmissionVersions"
  ,
    "getSubmissionDocumentPreviewUrl"],
  "Estudiante": [
    "getStudentTasks", "submitAssignment", "saveSubmissionDraft", "uploadFile", "uploadChunk", "initiateResumableUpload", "getUploadProgress", "cancelUploadSession", "deleteFile",
    "saveProject", "deleteProject", "listProjects", "loadProject", "getAllStudentProjects",
    "getVirtualClassrooms", "getPosts", "getStudyMaterials", "getSubmissionComments", "addSubmissionComment", "getSubmissionVersions"
  ],
  "Alumno": [
    "getStudentTasks", "submitAssignment", "saveSubmissionDraft", "uploadFile", "uploadChunk", "initiateResumableUpload", "getUploadProgress", "cancelUploadSession", "deleteFile",
    "saveProject", "deleteProject", "listProjects", "loadProject", "getAllStudentProjects",
    "getVirtualClassrooms", "getPosts", "getStudyMaterials", "getSubmissionComments", "addSubmissionComment", "getSubmissionVersions"
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

function verifyUserRoleMembershipClaim_(claims) {
  try {
    if (!claims || !claims.userId || !claims.role) return false;
    var hasMembershipClaims = !!claims.membershipId || !!claims.institutionId;
    if (hasMembershipClaims && (!claims.membershipId || !claims.institutionId)) return false;
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("MembresiasRolesRBAC");
    if (!sheet) return hasMembershipClaims ? false : null;
    var values = sheet.getDataRange().getValues();
    var expectedHeaders = ["MembershipID","UserID","RoleID","InstitutionID","Status","StartAt","EndAt","CreatedBy","CreatedAt","UpdatedAt","RevokedBy","RevokedAt"];
    if (!values.length || values[0].length !== expectedHeaders.length || JSON.stringify(values[0].map(String)) !== JSON.stringify(expectedHeaders)) return false;
    var allRows = values.slice(1);
    var userRows = allRows.filter(function(row) { return String(row[1] || "").trim() === String(claims.userId).trim(); });
    if (!hasMembershipClaims && !userRows.length) return null;
    var configuredInstitution = String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID") || "").trim();
    if (!configuredInstitution) return false;
    if (hasMembershipClaims && configuredInstitution !== String(claims.institutionId).trim()) return false;
    userRows = userRows.filter(function(row) { return String(row[3] || "").trim() === configuredInstitution; });
    if (!hasMembershipClaims && !userRows.length) return null;
    var idCounts = {};
    allRows.forEach(function(row) {
      var id = String(row[0] || "").trim();
      if (id) idCounts[id] = (idCounts[id] || 0) + 1;
    });
    var now = new Date().getTime();
    var candidates = [];
    userRows.forEach(function(row) {
      var id = String(row[0] || "").trim();
      var role = String(row[2] || "").trim();
      var institution = String(row[3] || "").trim();
      var status = String(row[4] || "").trim().toUpperCase();
      if (!id || !role || institution !== configuredInstitution || idCounts[id] !== 1) return;
      var roleConfigured = typeof ROLE_PERMISSIONS !== "undefined" && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role);
      if (!roleConfigured) {
        var roleSheet = ss.getSheetByName("MatrizPermisosRoles");
        roleConfigured = !!roleSheet && roleSheet.getDataRange().getValues().slice(1).some(function(roleRow) { return String(roleRow[0] || "").trim() === role; });
      }
      if (!roleConfigured) return;
      if (["ACTIVE", "ACTIVA", "ACTIVO"].indexOf(status) === -1) return;
      var start = row[5] === "" || row[5] === null || row[5] === undefined ? null : (row[5] instanceof Date ? row[5] : new Date(row[5]));
      var end = row[6] === "" || row[6] === null || row[6] === undefined ? null : (row[6] instanceof Date ? row[6] : new Date(row[6]));
      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) return;
      if (start && start.getTime() > now) return;
      if (end && end.getTime() < now) return;
      candidates.push({ membershipId: id, roleId: role });
    });
    var sameRole = candidates.filter(function(item) { return item.roleId === String(claims.role).trim(); });
    if (sameRole.length !== 1) return false;
    return hasMembershipClaims ? sameRole[0].membershipId === String(claims.membershipId).trim() : true;
  } catch (error) {
    return false;
  }
}



const SESSION_REVOCATION_HEADERS_ = ["SessionID","UserID","RevokedAt","ExpiresAt"];
const SESSION_REVOCATION_STATE_HEADERS_ = ["Key","Value","UpdatedAt"];

function isSessionRevokedInSharedLedger_(claims, spreadsheet) {
  if (!claims) return true;
  var userId = String(claims.userId || "").trim();
  var sessionId = String(claims.sessionId || "").trim();
  if (!userId && !sessionId) return true;
  var stateSheet = spreadsheet.getSheetByName("EstadoRevocacionSesiones");
  var sharedInitialized = false;
  if (stateSheet) {
    var stateData = stateSheet.getDataRange().getValues();
    if (!stateData.length || JSON.stringify(stateData[0].map(String)) !== JSON.stringify(SESSION_REVOCATION_STATE_HEADERS_)) {
      throw new Error("SESSION_REVOCATION_STATE_SCHEMA_MISMATCH");
    }
    var legacyCutoffRevoked = false;
    stateData.slice(1).forEach(function(row) {
      var key = String(row[0] || "").trim();
      var value = String(row[1] || "").trim();
      if (key === "LEDGER_INITIALIZED" && value === "1") sharedInitialized = true;
      if (key === "LEGACY_SESSION_CUTOFF" && value !== "") {
        var cutoff = Number(value);
        if (!Number.isSafeInteger(cutoff) || cutoff < 0) throw new Error("SESSION_REVOCATION_CUTOFF_INVALID");
        if (Number(claims.iat) <= cutoff) legacyCutoffRevoked = true;
      }
    });
    if (legacyCutoffRevoked) return true;
  }
  var sheet = spreadsheet.getSheetByName("SesionesRevocadas");
  if (!sheet) {
    if (sharedInitialized) throw new Error("SESSION_REVOCATION_LEDGER_MISSING");
    return false;
  }
  var data = sheet.getDataRange().getValues();
  if (!data.length || JSON.stringify(data[0].map(String)) !== JSON.stringify(SESSION_REVOCATION_HEADERS_)) {
    throw new Error("SESSION_REVOCATION_SCHEMA_MISMATCH");
  }
  var now = new Date();
  function parseRevocationDate(value) {
    if (value === "" || value === null || value === undefined) return { valid: true, date: null };
    var date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? { valid: false, date: null } : { valid: true, date: date };
  }
  for (var i = 1; i < data.length; i++) {
    var row = data[i] || [];
    var rowSessionId = String(row[0] || "").trim();
    var rowUserId = String(row[1] || "").trim();
    var matchesSession = !!sessionId && !!rowSessionId && rowSessionId === sessionId;
    var matchesUser = !!userId && !!rowUserId && rowUserId === userId;
    if (!matchesSession && !matchesUser) continue;
    var expiry = parseRevocationDate(row[3]);
    if (expiry.valid && expiry.date && expiry.date.getTime() <= now.getTime()) continue;
    if (!expiry.valid) return true;
    if (matchesSession) return true;
    var revokedAt = parseRevocationDate(row[2]);
    if (!revokedAt.valid || !revokedAt.date) return true;
    if (Number(claims.iat) <= Math.floor(revokedAt.date.getTime() / 1000)) return true;
  }
  return false;
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
    const revocationSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (isSessionRevokedInSharedLedger_(claims, revocationSpreadsheet)) return null;

    var currentRoleVersion = getSecurityVersion_("USER_ROLE:" + String(claims.userId || "").trim());
    if (currentRoleVersion === false) return null;
    if (claims.roleVersion === undefined) {
      if (currentRoleVersion !== 0) return null;
    } else if (!Number.isSafeInteger(claims.roleVersion) || claims.roleVersion !== currentRoleVersion) return null;
    const versionedUserCacheSuffix = String(claims.userId).trim() + "_" + currentRoleVersion;
    const stateCacheKey = "acct_state_" + versionedUserCacheSuffix;
    const roleCacheKey = "acct_role_" + versionedUserCacheSuffix;
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
      } catch (error) { return null; }
    }
    if (acctState !== "Activa") return null;
    var membershipCheck = verifyUserRoleMembershipClaim_(claims);
    if (membershipCheck === false) return null;
    if (membershipCheck === null && (!currentRole || currentRole !== claims.role.trim())) return null;
    return claims;
  } catch (e) {
    return null;
  }
}

// [TAREA-01] [TAREA-F4-P0-01] [Fase 4 - Seguridad RBAC y Token Unificado] - Validar y reforzar la seguridad mediante verificación de credencial de sesión HMAC
// [TAREA-F4-P1-04] [Fase 4: Reglas Contextuales RBAC/ABAC] - Validación de atributos contextuales (Docentes, Tutores, Estudiantes)
function validateContextualAccess(action, payload, verifiedUserId, userRole) {
  const actorId = String(verifiedUserId || "").trim();
  const role = String(userRole || "").trim();
  if (!actorId || !role) return { authorized: false, reason: "VERIFIED_IDENTITY_REQUIRED" };
  if (role === "Administrador" || role === "Desarrollador") return { authorized: true };
  const guardianRole = ["Padre", "Madre", "Tutor", "Responsable", "ResponsableFamiliar"].indexOf(role) !== -1;
  let targetStudentId = String(payload && (
    payload.studentId || payload.estudianteId || payload.estudianteUserId || payload.studentUserId ||
    payload.targetStudentId || payload.targetStudentUserId || payload.targetUserId || payload.userId
  ) || "").trim();
  const targetExpedienteId = String(payload && (payload.expedienteId || payload.expedienteEstudianteId) || "").trim();
  if (guardianRole && targetStudentId === actorId) targetStudentId = "";
  if (role === "Estudiante" || role === "Alumno") {
    if (targetStudentId && targetStudentId !== actorId) {
      return { authorized: false, reason: "STUDENT_RESOURCE_SCOPE_DENIED" };
    }
    if (targetExpedienteId) {
      try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName("ExpedientesEstudiantes");
        if (!sheet) return { authorized: false, reason: "STUDENT_EXPEDIENTE_SOURCE_UNAVAILABLE" };
        const rows = sheet.getDataRange().getValues().slice(1);
        const matches = rows.filter(row => String(row[0] || "").trim() === targetExpedienteId);
        if (matches.length !== 1 || String(matches[0][1] || "").trim() !== actorId) {
          return { authorized: false, reason: "STUDENT_EXPEDIENTE_SCOPE_DENIED" };
        }
      } catch (_) {
        return { authorized: false, reason: "STUDENT_EXPEDIENTE_SCOPE_UNVERIFIED" };
      }
    }
  }
  if (guardianRole && (targetStudentId || targetExpedienteId)) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const linkedStudentIds = getTaskServiceGuardianStudentIds(actorId, ss);
      const normalizedIds = Array.isArray(linkedStudentIds)
        ? linkedStudentIds.map(value => String(value || "").trim()).filter(Boolean) : [];
      let expedienteStudentId = "";
      if (targetExpedienteId) {
        const sheet = ss.getSheetByName("ExpedientesEstudiantes");
        if (!sheet) return { authorized: false, reason: "GUARDIAN_EXPEDIENTE_SOURCE_UNAVAILABLE" };
        const rows = sheet.getDataRange().getValues().slice(1);
        const matches = rows.filter(row => String(row[0] || "").trim() === targetExpedienteId);
        if (matches.length !== 1) return { authorized: false, reason: "GUARDIAN_EXPEDIENTE_AMBIGUOUS_OR_MISSING" };
        expedienteStudentId = String(matches[0][1] || "").trim();
        if (!expedienteStudentId || (targetStudentId && targetStudentId !== expedienteStudentId)) {
          return { authorized: false, reason: "GUARDIAN_EXPEDIENTE_TARGET_MISMATCH" };
        }
      }
      const requestedStudentId = targetStudentId || expedienteStudentId;
      if (!requestedStudentId || normalizedIds.indexOf(requestedStudentId) === -1) {
        return { authorized: false, reason: "GUARDIAN_ACADEMIC_RELATIONSHIP_DENIED" };
      }
    } catch (_) {
      return { authorized: false, reason: "GUARDIAN_ACADEMIC_RELATIONSHIP_UNVERIFIED" };
    }
  }
  return { authorized: true };
}

function getRequestSessionToken_(payload) {
  return payload && (payload.sessionToken || payload.authToken || payload.token) || "";
}
function getVerifiedRequestSessionClaims_(payload) {
  const token=getRequestSessionToken_(payload);
  if(!token)return null;
  if(payload&&payload._imaVerifiedSessionToken===token&&payload._imaVerifiedSessionClaims)return payload._imaVerifiedSessionClaims;
  const claims=verifySessionToken(token);
  if(claims&&payload&&typeof payload==="object"){payload._imaVerifiedSessionToken=token;payload._imaVerifiedSessionClaims=claims;}
  return claims;
}
function getCachedRequestAuthorization_(action,payload) {
  const token=getRequestSessionToken_(payload),cache=payload&&payload._imaAuthorizationCache;
  if(!token||!cache||cache.token!==token||!cache.actions||!Object.prototype.hasOwnProperty.call(cache.actions,action))return null;
  return {authorized:true,role:cache.actions[action]};
}
function cacheRequestAuthorization_(action,payload,role) {
  const token=getRequestSessionToken_(payload);if(!token||!payload||typeof payload!=="object")return;
  let cache=payload._imaAuthorizationCache;if(!cache||cache.token!==token||!cache.actions)cache={token:token,actions:{}};
  cache.actions[action]=role||payload._verifiedRole||"";payload._imaAuthorizationCache=cache;
}
function clearRequestAuthorizationContext_(payload) {
  if(!payload||typeof payload!=="object")return;
  delete payload._imaVerifiedSessionToken;delete payload._imaVerifiedSessionClaims;delete payload._imaAuthorizationCache;
  delete payload._imaVerifiedTaskIdentity;delete payload._verifiedUserId;delete payload._verifiedRole;
  delete payload._delegatedFrom;delete payload._delegationId;
}
function validateRolePermission(action, payload) {
  const cachedAuthorization=getCachedRequestAuthorization_(action,payload);
  if(cachedAuthorization)return cachedAuthorization;
  if (PUBLIC_ACTIONS.indexOf(action) !== -1) return { authorized: true };
  let userRole = "Estudiante";
  let verifiedUserId = null;
  const token = payload && (payload.sessionToken || payload.authToken || payload.token);

  if (token) {
    const claims = getVerifiedRequestSessionClaims_(payload);
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
  if (dynamicCheck === true) { cacheRequestAuthorization_(action,payload,userRole); return { authorized: true, role: userRole }; }
  if (dynamicCheck === false) return { authorized: false, role: userRole };

  const verifiedId = payload && payload._verifiedUserId;
  if (verifiedId) {
    const activeDel = hasActiveDelegationForAction(verifiedId, action);
    if (activeDel) {
      if (payload) {
        payload._delegatedFrom = activeDel.delegante;
        payload._delegationId = activeDel.delId;
      }
      const delegatedRole=userRole+" (Delegado de "+activeDel.delegante+")";cacheRequestAuthorization_(action,payload,delegatedRole);return {authorized:true,role:delegatedRole};
    }
  }

  // [TAREA-AD-06] [Anexo Tareas: Seguridad y Roles] - Registro de auditoría de denegación por defecto
  try {
    const actorId = verifiedUserId || verifiedId || "Desconocido";
    Logger.log(`[TAREA-AD-06] UNAUTHORIZED_ACCESS_ATTEMPT: Acción '${action}' rechazada por defecto para usuario '${actorId}' (rol '${userRole}').`);
  } catch (_) {}
  return { authorized: false, role: userRole };
}

// [TAREA-F4-P1-03] [Fase 4: Matriz Dinámica de Permisos] - Consulta y caché de la matriz dinámica por rol y acción

function getPermissionMatrixInstitutionId_(){try{if(typeof getIdentityInstitutionId_==="function"){var v=String(getIdentityInstitutionId_()||"").trim();if(v)return v;}}catch(_){}try{if(typeof PropertiesService!=="undefined"){var p=PropertiesService.getScriptProperties();return String(p.getProperty("IMA_INSTITUTION_ID")||p.getProperty("INSTITUTION_ID")||"").trim();}}catch(_){}return "";}
var SECURITY_VERSION_HEADERS_ = ["Clave","Version","UpdatedAt","UpdatedBy"];
/**
 * Read the shared security ledger on every authorization decision. These Apps Script
 * services are separate projects, so process-local version caches cannot be invalidated
 * reliably across USER, ACADEMIC, ACCOUNTING, TASK and EXAM.
 */
function getSecurityVersion_(key) {
  var versionKey = String(key || "").trim();
  if (!versionKey || versionKey.length > 180) return false;
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("VersionesSeguridad");
    if (!sheet) return false;
    var values = sheet.getDataRange().getValues();
    if (!values.length || JSON.stringify((values[0] || []).map(String)) !== JSON.stringify(SECURITY_VERSION_HEADERS_)) return false;
    var matches = [];
    for (var i = 1; i < values.length; i++) if (String(values[i][0] || "").trim() === versionKey) matches.push(values[i]);
    if (matches.length > 1) return false;
    var version = matches.length ? Number(matches[0][1]) : 0;
    if (!Number.isSafeInteger(version) || version < 0) return false;
    return version;
  } catch (error) { return false; }
}
function getDynamicPermissionsForRole(role,moduleOrAction,actionArgument,institutionArgument){var service="TASK",module=actionArgument===undefined?service:String(moduleOrAction||"").trim().toUpperCase(),action=actionArgument===undefined?String(moduleOrAction||"").trim():String(actionArgument||"").trim(),institutionId=String(institutionArgument||"").trim();if(!institutionId){try{if(typeof getIdentityInstitutionId_==="function")institutionId=String(getIdentityInstitutionId_()||"").trim();}catch(_){}}if(!institutionId){try{if(typeof PropertiesService!=="undefined"){var props=PropertiesService.getScriptProperties();institutionId=String(props.getProperty("IMA_INSTITUTION_ID")||props.getProperty("INSTITUTION_ID")||"").trim();}}catch(_){}}var supportedModules=typeof PERMISSION_MATRIX_MODULES_!=="undefined"&&Array.isArray(PERMISSION_MATRIX_MODULES_)?PERMISSION_MATRIX_MODULES_:["USER","ACADEMIC","ACCOUNTING","TASK","EXAM"];if(!role||!module||!action||supportedModules.indexOf(module)===-1)return false;var permissionVersion=getSecurityVersion_("PERMISSION_MATRIX");if(permissionVersion===false)return false;var cache=null,snapshot=null,key="dynamic_permissions_matrix_v3:"+service+":"+(institutionId||"UNRESOLVED")+":"+permissionVersion;try{cache=CacheService.getScriptCache();var raw=cache.get(key);if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.schemaVersion===3&&parsed.version===permissionVersion&&Array.isArray(parsed.rows))snapshot=parsed;}}catch(_){}if(!snapshot){try{var ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=ss.getSheetByName("MatrizPermisosRoles");if(!sheet||sheet.getLastRow()===0)return false;var values=sheet.getDataRange().getValues(),h=(values[0]||[]).map(function(v){return String(v||"").trim().toLowerCase();}),ix={role:h.indexOf("rol"),module:h.indexOf("modulo"),action:h.indexOf("accion"),allowed:h.indexOf("permitido"),scope:h.indexOf("ambito")};if(Object.keys(ix).some(function(k){return ix[k]<0;}))return false;if(values.length<=1)return false;var rows=values.slice(1).map(function(r){var v=r[ix.allowed],allowed=v===true||String(v).trim().toLowerCase()==="true"?true:(v===false||String(v).trim().toLowerCase()==="false"?false:null);return{role:String(r[ix.role]||"").trim(),module:String(r[ix.module]||"").trim().toUpperCase(),action:String(r[ix.action]||"").trim(),allowed:allowed,scope:String(r[ix.scope]||"").trim()};});snapshot={schemaVersion:3,version:permissionVersion,rows:rows};try{if(cache)cache.put(key,JSON.stringify(snapshot),600);}catch(_){}}catch(_){return false;}}var relevant=snapshot.rows.filter(function(r){return r.role===String(role).trim()&&r.action===action&&r.module!=="__LEGACY_ARCHIVED__";});if(!relevant.length)return null;if(!institutionId||relevant.some(function(r){return (!r.module||r.module===module)&&(r.allowed===null||!r.scope);}))return false;var candidates=relevant.filter(function(r){return r.module===module&&(r.scope===institutionId||(r.scope==="Global"&&String(role||"").trim().toLowerCase()==="desarrollador"));});if(!candidates.length)return false;var seen={};for(var i=0;i<candidates.length;i++){var k=candidates[i].module+"|"+candidates[i].action+"|"+candidates[i].scope;seen[k]=(seen[k]||0)+1;if(seen[k]>1)return false;}return !candidates.some(function(r){return r.allowed!==true;});}


// [TAREA-F4-P1-01] [Fase 4: Motor de Delegaciones] - Verificación de delegaciones de seguridad activas
function hasActiveDelegationForAction(userId, action) {
  var targetUserId = String(userId || "").trim();
  var requestedAction = String(action || "").trim();
  if (!targetUserId || !requestedAction) return null;
  var delegationVersion = getSecurityVersion_("USER_DELEGATION:" + targetUserId);
  if (delegationVersion === false) return null;
  var cache = null, cacheKey = "active_delegations_" + targetUserId + "_" + delegationVersion;
  var cached = null, now = new Date().getTime();
  try {
    cache = CacheService.getScriptCache();
    var raw = cache.get(cacheKey);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(function(item) {
        return item && Number.isFinite(item.startsAt) && Number.isFinite(item.expiresAt) && Array.isArray(item.acciones);
      })) cached = parsed;
    }
  } catch (cacheReadError) { cached = null; }
  if (!cached) {
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("DelegacionesSeguridad");
      if (!sheet) return null;
      var data = sheet.getDataRange().getValues();
      cached = [];
      var nextTransition = now + 300000;
      for (var i = 1; i < data.length; i++) {
        var row = data[i] || [];
        if (String(row[2] || "").trim() !== targetUserId || String(row[7] || "").trim() !== "Activa") continue;
        var startsAt = new Date(row[5]).getTime();
        var expiresAt = new Date(row[6]).getTime();
        if (!Number.isFinite(startsAt) || !Number.isFinite(expiresAt) || expiresAt <= startsAt) continue;
        if (startsAt > now) nextTransition = Math.min(nextTransition, startsAt);
        if (expiresAt > now) nextTransition = Math.min(nextTransition, expiresAt);
        if (now >= startsAt && now <= expiresAt) {
          cached.push({ delId: String(row[0] || ""), delegante: String(row[1] || ""),
            acciones: String(row[3] || "").split(",").map(function(value) { return value.trim(); }),
            startsAt: startsAt, expiresAt: expiresAt });
        }
      }
      var ttlSeconds = Math.min(300, Math.floor((nextTransition - now) / 1000));
      if (cache && ttlSeconds >= 1) cache.put(cacheKey, JSON.stringify(cached), ttlSeconds);
    } catch (sourceReadError) { return null; }
  }
  for (var j = 0; j < cached.length; j++) {
    var item = cached[j];
    if (now < item.startsAt || now > item.expiresAt) continue;
    if (item.acciones.indexOf("*") !== -1 || item.acciones.indexOf(requestedAction) !== -1) {
      return { delId: item.delId, delegante: item.delegante, acciones: item.acciones };
    }
  }
  return null;
}

function doPost(e) {
  let response;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No se recibieron datos." })).setMimeType(ContentService.MimeType.JSON);
    }
    const request = JSON.parse(e.postData.contents);
    const { action, payload } = request;
    clearRequestAuthorizationContext_(payload);
    const authCheck = validateRolePermission(action, payload);
    if (!authCheck.authorized) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        code: "AUTH_PERMISSION_DENIED",
        message: "Acceso denegado: El rol " + authCheck.role + " no tiene permiso para la acción " + action + "."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    switch (action) {
      case "purgeSecurityCaches": response = purgeSecurityCaches(payload); break;
      case "createTask": response = createTask(payload); break;
      case "getSubmissionDocumentPreviewUrl":
        response = getSubmissionDocumentPreviewUrl(payload);
        break;
      case "reconcileLegacyTaskFileMetadata": response = reconcileLegacyTaskFileMetadata(payload); break;
      case "getDriveStorageQuotaMetricsReport":
        response = getDriveStorageQuotaMetricsReport(payload);
        break;
      case "getStudentTasks": response = getStudentTasks(payload); break;
      case "uploadFile": response = uploadFile(payload); break;
      case "uploadChunk": response = uploadChunk(payload); break;
      case "finishChunkedUpload": response = finishChunkedUpload(payload); break;
      case "deleteFile": response = deleteFile(payload); break;
      case "submitAssignment": response = submitAssignment(payload); break;
      case "saveSubmissionDraft": response = saveSubmissionDraft(payload); break;
      case "gradeSubmission": response = gradeSubmission(payload); break;
      case "gradeSubmissionWithRubric": response = gradeSubmissionWithRubric(payload); break;
      case "getTeacherActivity": response = getTeacherActivity(payload); break;
      case "getAllTasks": response = getAllTasks(payload); break;
      case "updateTask": response = updateTask(payload); break;
      case "deleteTask": response = deleteTask(payload); break;
      case "deleteSubmission": response = deleteSubmission(payload); break;
      case "saveProject": response = saveProject(payload); break;
      case "deleteProject": response = deleteProject(payload); break;
      case "listProjects": response = listProjects(payload); break;
      case "loadProject": response = loadProject(payload); break;
      case "getAllStudentProjects": response = getAllStudentProjects(payload); break;
      case "generateAcademicArchiveZip": response = generateAcademicArchiveZip(payload); break;
      case "closeAcademicYear": response = closeAcademicYear(payload); break;
      case "createTaskServiceAcademicYearBackup": response = createTaskServiceAcademicYearBackup(payload); break;
      case "verifyTaskServiceAcademicYearBackup": response = verifyTaskServiceAcademicYearBackup(payload); break;
      case "restoreTaskServiceAcademicYearBackup": response = restoreTaskServiceAcademicYearBackup(payload); break;
      case "recoverTaskServiceAcademicYearRestore": response = recoverTaskServiceAcademicYearRestore(payload); break;
      case "getVirtualClassrooms": response = getVirtualClassrooms(payload); break;
      case "createVirtualClassroom": response = createVirtualClassroom(payload); break;
      case "getPosts": response = getPosts(payload); break;
      case "createPost": response = createPost(payload); break;
      case "updatePost": response = updatePost(payload); break;
      case "deletePost": response = deletePost(payload); break;
      case "getStudyMaterials": response = getStudyMaterials(payload); break;
      case "createStudyMaterial": response = createStudyMaterial(payload); break;
      case "deleteStudyMaterial": response = deleteStudyMaterial(payload); break;
      case "returnSubmissionForRevision": response = returnSubmissionForRevision(payload); break;
      case "getSubmissionComments": response = getSubmissionComments(payload); break;
      case "addSubmissionComment": response = addSubmissionComment(payload); break;
      case "getSubmissionVersions": response = getSubmissionVersions(payload); break;

      // Endpoints Fase 30 - Cargas Reanudables, Reemplazo Progresivo y Lectura
      case "initiateResumableUpload": response = initiateResumableUpload(payload); break;
      case "getUploadProgress": response = getUploadProgress(payload); break;
      case "cancelUploadSession": response = cancelUploadSession(payload); break;
      case "reconstructFileParts": response = reconstructFileParts(payload); break;
      case "readLegacyDocument": response = readLegacyDocument(payload); break;
      case "getMultiPartFolderFiles": response = getMultiPartFolderFiles(payload); break;
      default:
        response = { status: "error", message: `Acción no reconocida en Task-Service: ${action}` };
    }
  } catch (error) {
    logDebug("Error en doPost:", { message: error.message });
    response = { status: "error", message: error.message || "Error interno del servidor." };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// [TAREA-10] [Fase 1 - Sistema de Tareas y Entregas] - Sistema ampliado de asignaciones, entregas multimodales, revisiones, versiones y retroalimentación.
function createTask(payload) {
 const identity=getVerifiedTaskIdentity_(payload),role=identity.role,uid=identity.userId;if(!identity.authorized||!uid||(role!=="Profesor"&&!isTaskServiceAdministrativeRole(role)))throw new Error("Acceso denegado.");
 const {tipo,titulo,descripcion,parcial,asignatura,gradoAsignado,seccionAsignada,fechaLimite,tareaOriginalId,puntaje,archivoUrl,fechaDisponible,tipoRecurso}=payload||{};
 if(!titulo||!gradoAsignado||!asignatura)throw new Error("Título, grado y asignatura obligatorios.");
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),taskSheet=getSheetOrThrow(ss,"Tareas");let owner=String(uid).trim();
 let assignedClassroom=null;
 if(role==="Profesor"){const classes=getSheetOrThrow(ss,"AulasVirtuales").getDataRange().getValues().slice(1);
  assignedClassroom=classes.find(r=>normalizeString(r[7]||"Activa")!=="desactivada"&&normalizeString(r[3])===normalizeString(gradoAsignado)&&(!r[4]||normalizeString(r[4])===normalizeString(seccionAsignada||""))&&normalizeString(r[5])===normalizeString(asignatura)&&String(r[6]||"").trim()===owner);
  if(!assignedClassroom)throw new Error("No existe aula asignada para el ámbito de la tarea.");assertTaskServiceTeacherAssignedToOffer(owner,assignedClassroom[1],assignedClassroom);
 }else if(payload.profesorId)owner=String(payload.profesorId).trim();
 if(tareaOriginalId){const orig=taskSheet.getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===String(tareaOriginalId).trim());if(!orig)throw new Error("Tarea original no encontrada.");assertTaskServiceTeacherCanManageTask(payload,orig,"CREATE_DERIVED");}
 const scope=getVerifiedTaskDepartmentScope_(payload,ss,identity);if(!scope.authorized)throw new Error(scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED");
 let classroomOwnership=null;
 if(assignedClassroom){classroomOwnership=assertTaskServiceResourceOwnership_(payload,"AULA_VIRTUAL",assignedClassroom[0],"CREATE_TASK",ss,identity,scope);if(!classroomOwnership.authorized)throw new Error(classroomOwnership.code||"RESOURCE_SCOPE_DENIED");}
 const department=resolveTaskServiceOwnershipDepartment_(payload,scope);if(!department.authorized)throw new Error(department.code);
 if(classroomOwnership&&String(classroomOwnership.departmentId||"").trim()!==String(department.departmentId||"").trim())throw new Error("RESOURCE_DEPARTMENT_MISMATCH");
 const id="TSK-"+Utilities.getUuid();taskSheet.appendRow([id,tipo||"Tarea",titulo,descripcion||"",parcial||"",asignatura,gradoAsignado,seccionAsignada||"",fechaLimite||"",tareaOriginalId||"",owner,"Activa",puntaje===undefined?100:puntaje,archivoUrl||"",fechaDisponible||"",tipoRecurso||"Tarea"]);
 const registered=registerTaskServiceResourceOwnership_(scope,"TAREA",id,department.departmentId,ss);
 if(!registered.authorized){try{const rows=taskSheet.getDataRange().getValues(),idx=rows.findIndex((r,n)=>n>0&&String(r[0]||"").trim()===id);if(idx>0)taskSheet.deleteRow(idx+1);}catch(_){throw new Error("RESOURCE_OWNERSHIP_ROLLBACK_FAILED");}throw new Error(registered.code||"RESOURCE_OWNERSHIP_WRITE_FAILED");}
 return {status:"success",message:"Tarea creada.",data:{tareaId:id}};
}
const TASK_DEADLINE_HISTORY_HEADERS_ = ["HistoryID","TaskID","PreviousDeadline","NewDeadline","ChangedByUserID","ChangedByRole","ChangedAt","Reason","CorrelationID"];

function normalizeTaskDeadlineForHistory_(value) {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) throw new Error("TASK_DEADLINE_INVALID");
  return date.toISOString();
}

function ensureTaskDeadlineHistorySheet_(ss) {
  const name = "HistorialFechasLimiteTareas";
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    if (!ss.insertSheet) throw new Error("TASK_DEADLINE_HISTORY_SHEET_UNAVAILABLE");
    sheet = ss.insertSheet(name);
  }
  const data = sheet.getDataRange().getValues();
  if (!data.length || !data[0] || !data[0].length || data[0].every(value => String(value || "").trim() === "")) {
    sheet.appendRow(TASK_DEADLINE_HISTORY_HEADERS_.slice());
    return sheet;
  }
  const actualHeaders = data[0].map(value => String(value || "").trim());
  if (JSON.stringify(actualHeaders) !== JSON.stringify(TASK_DEADLINE_HISTORY_HEADERS_)) {
    throw new Error("TASK_DEADLINE_HISTORY_SCHEMA_MISMATCH");
  }
  return sheet;
}

function updateTask(payload) {
  const request = payload || {};
  const initialIdentity = getVerifiedTaskIdentity_(request);
  if (!initialIdentity || initialIdentity.authorized !== true || !initialIdentity.userId || !initialIdentity.role) {
    throw new Error("VERIFIED_IDENTITY_REQUIRED");
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error("TASK_UPDATE_LOCK_UNAVAILABLE");
  try {
    // Reuse the actor verified at the request entry point; the lock protects the write, not a second session check.
    const identity = initialIdentity;
    const taskId = String(request.tareaId || "").trim();
    if (!taskId) throw new Error("Identidad y tarea requeridas.");
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getSheetOrThrow(ss, "Tareas");
    const data = sheet.getDataRange().getValues();
    const index = data.findIndex(row => String(row[0] || "").trim() === taskId);
    if (index < 1) throw new Error("Tarea no encontrada.");
    const originalRow = data[index].slice();
    assertTaskServiceTeacherCanManageTask(request, originalRow);

    if (identity.role === "Profesor" &&
        ["gradoAsignado", "seccionAsignada", "asignatura"].some(key => request[key] !== undefined)) {
      const grade = request.gradoAsignado === undefined ? originalRow[6] : request.gradoAsignado;
      const section = request.seccionAsignada === undefined ? originalRow[7] : request.seccionAsignada;
      const subject = request.asignatura === undefined ? originalRow[5] : request.asignatura;
      const classroom = getSheetOrThrow(ss, "AulasVirtuales").getDataRange().getValues().slice(1).find(row =>
        String(row[7] || "Activa") !== "Desactivada" &&
        normalizeString(row[3]) === normalizeString(grade) &&
        (!row[4] || normalizeString(row[4]) === normalizeString(section)) &&
        normalizeString(row[5]) === normalizeString(subject) &&
        String(row[6] || "").trim() === String(identity.userId).trim()
      );
      if (!classroom) throw new Error("El nuevo ámbito no pertenece a una asignación docente.");
      assertTaskServiceTeacherAssignedToOffer(identity.userId, classroom[1], classroom);
    }

    const updatedRow = originalRow.slice();
    [["titulo",2],["descripcion",3],["parcial",4],["asignatura",5],["gradoAsignado",6],
      ["seccionAsignada",7],["fechaLimite",8],["puntaje",12],["archivoUrl",13]].forEach(([key,column]) => {
        if (request[key] !== undefined) updatedRow[column] = request[key];
      });

    const deadlineChanged = request.fechaLimite !== undefined &&
      normalizeTaskDeadlineForHistory_(request.fechaLimite) !== normalizeTaskDeadlineForHistory_(originalRow[8]);
    let historySheet = null;
    let reason = "";
    let previousDeadline = "";
    let nextDeadline = "";
    if (deadlineChanged) {
      reason = String(request.motivoCambioFechaLimite || "").trim();
      if (!reason) throw new Error("TASK_DEADLINE_CHANGE_REASON_REQUIRED");
      if (reason.length > 500) throw new Error("TASK_DEADLINE_CHANGE_REASON_TOO_LONG");
      previousDeadline = normalizeTaskDeadlineForHistory_(originalRow[8]);
      nextDeadline = normalizeTaskDeadlineForHistory_(request.fechaLimite);
      historySheet = ensureTaskDeadlineHistorySheet_(ss);
    }

    sheet.getRange(index + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
    if (deadlineChanged) {
      try {
        historySheet.appendRow([
          "DLH-" + Utilities.getUuid(), taskId, previousDeadline, nextDeadline,
          String(identity.userId), String(identity.role), new Date(), reason,
          String(request.correlationId || "")
        ]);
      } catch (historyError) {
        try {
          sheet.getRange(index + 1, 1, 1, originalRow.length).setValues([originalRow]);
        } catch (rollbackError) {
          throw new Error("TASK_UPDATE_HISTORY_ROLLBACK_FAILED");
        }
        throw new Error("TASK_DEADLINE_HISTORY_WRITE_FAILED");
      }
    }
    return { status: "success", message: "Tarea actualizada.", deadlineHistoryRecorded: deadlineChanged };
  } finally {
    lock.releaseLock();
  }
}
function deleteTask(payload) {
 const id=payload&&payload.tareaId;if(!id)throw new Error("tareaId requerido.");const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=getSheetOrThrow(ss,"Tareas"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Tarea no encontrada.");
 assertTaskServiceTeacherCanManageTask(payload,data[i]);const has=getSheetOrThrow(ss,"Entregas").getDataRange().getValues().slice(1).some(r=>String(r[1]).trim()===String(id).trim());
 if(has){sh.getRange(i+1,12).setValue("Inactiva");return {status:"success",message:"Tarea marcada como inactiva (existen entregas)."};}
 const revoked=deactivateTaskServiceResourceOwnership_(payload,"TAREA",id,ss);if(!revoked.authorized)throw new Error("RESOURCE_NOT_FOUND");
 sh.deleteRow(i+1);return {status:"success",message:"Tarea eliminada."};
}
function closeAcademicYear(payload) {
  const role = payload && payload._verifiedRole;
  const actorId = payload && payload._verifiedUserId;
  if (!actorId || ["Administrador", "Desarrollador"].indexOf(role) === -1) {
    return { status:"error", code:"AUTH_PERMISSION_DENIED", message:"El cierre global requiere identidad administrativa verificada." };
  }
  // Fail-closed deliberado: la rutina dedicada existe, pero no se habilita el borrado
  // hasta certificar backup/restore/rollback en un entorno Apps Script/Sheets/Drive aislado.
  return { status:"error", code:"BACKUP_REQUIRED", message:"Cierre bloqueado: el protocolo dedicado requiere certificación de restauración y rollback en entorno aislado." };
}

const TASK_SERVICE_BACKUP_SCHEMA_VERSION = 1;
const TASK_SERVICE_RESTORE_JOURNAL_KEY = "TASK_SERVICE_ACADEMIC_YEAR_RESTORE_JOURNAL";
const TASK_SERVICE_RESTORE_STATE_PREFIX = "IMA_TASK_SERVICE_RESTORE_STATE_";
const TASK_SERVICE_RESTORE_MARKER_PREFIX = "__IMA_RESTORE__";
const TASK_SERVICE_BACKUP_PREFIX = "IMA_TASK_SERVICE_ACADEMIC_BACKUP_";
const TASK_SERVICE_BACKUP_SHEETS = ["Tareas", "Entregas", "ConfiguracionAcademica", "Log_Cierres", "EntregasVersiones", "MetadatosArchivos"];

function assertTaskServiceBackupAdministrator_(payload) {
  const role = payload && payload._verifiedRole;
  const actorId = String(payload && payload._verifiedUserId || "").trim();
  if (!actorId || ["Administrador", "Desarrollador"].indexOf(role) === -1) {
    throw new Error("AUTH_PERMISSION_DENIED: operación de backup/restore exclusiva de Administrador o Desarrollador.");
  }
  return { actorId: actorId, role: role };
}

function taskServiceBackupSha256_(value, isBytes) {
  const bytes = isBytes ? value : String(value);
  const digest = isBytes
    ? Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    : Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes, Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ("0" + ((b + 256) % 256).toString(16)).slice(-2); }).join("");
}

function taskServiceBackupEncodeValue_(value) {
  if (value instanceof Date) return { __taskServiceBackupType: "Date", value: value.toISOString() };
  return value;
}

function taskServiceBackupDecodeValue_(value) {
  if (value && typeof value === "object" && value.__taskServiceBackupType === "Date") return new Date(value.value);
  return value;
}

function taskServiceBackupSnapshotSheet_(sheet) {
  const rowCount = sheet.getLastRow(), columnCount = sheet.getLastColumn();
  if (!rowCount || !columnCount) return { name: sheet.getName(), rows: 0, columns: 0, values: [], formulas: [] };
  const range = sheet.getRange(1, 1, rowCount, columnCount);
  const values = range.getValues().map(function (row) { return row.map(taskServiceBackupEncodeValue_); });
  return { name: sheet.getName(), rows: rowCount, columns: columnCount, values: values, formulas: range.getFormulas() };
}

function taskServiceBackupParentId_(item) {
  const parents = item.getParents();
  return parents.hasNext() ? parents.next().getId() : DriveApp.getRootFolder().getId();
}

function taskServiceBackupCaptureSharing_(item) {
  const access = String(item.getSharingAccess() || DriveApp.Access.PRIVATE);
  const permission = String(item.getSharingPermission() || DriveApp.Permission.VIEW);
  if (access === String(DriveApp.Access.ANYONE) || access === String(DriveApp.Access.ANYONE_WITH_LINK)) throw new Error("Activo Drive con acceso público no puede incorporarse al respaldo: " + item.getId());
  const editors = item.getEditors().map(function (user) { return user.getEmail(); }).filter(Boolean).sort();
  const viewers = item.getViewers().map(function (user) { return user.getEmail(); }).filter(Boolean).sort();
  return { access: access, permission: permission, editors: editors, viewers: viewers };
}
function taskServiceBackupVerifySharing_(item, expected) {
  const actual = taskServiceBackupCaptureSharing_(item);
  return actual.access === expected.access && actual.permission === expected.permission &&
    JSON.stringify(actual.editors) === JSON.stringify((expected.editors || []).slice().sort()) &&
    JSON.stringify(actual.viewers) === JSON.stringify((expected.viewers || []).slice().sort());
}
function taskServiceBackupApplySharing_(item, sharing) {
  if (!sharing) throw new Error("Manifiesto sin permisos de Drive.");
  const access = DriveApp.Access[sharing.access], permission = DriveApp.Permission[sharing.permission];
  if (!access || !permission) throw new Error("Permisos Drive no reconocidos en el manifiesto.");
  item.setSharing(access, permission);
  (sharing.editors || []).forEach(function (email) { item.addEditor(email); });
  (sharing.viewers || []).forEach(function (email) { item.addViewer(email); });
  if (!taskServiceBackupVerifySharing_(item, sharing)) throw new Error("Los permisos del activo restaurado no coinciden con el manifiesto.");
}
function taskServiceBackupCaptureAsset_(originalId, backupParent, visited) {
  const id = String(originalId || "").trim();
  if (!id) throw new Error("Referencia Drive vacía durante el respaldo.");
  if (visited[id]) return visited[id];

  let file = null;
  try { file = DriveApp.getFileById(id); } catch (_) {}
  if (file) {
    if (file.isTrashed()) throw new Error("Activo Drive referenciado ya está en papelera: " + id);
    const copy = file.makeCopy(file.getName(), backupParent);
    const originalHash = taskServiceBackupSha256_(file.getBlob().getBytes(), true);
    const copyHash = taskServiceBackupSha256_(copy.getBlob().getBytes(), true);
    if (originalHash !== copyHash || Number(file.getSize()) !== Number(copy.getSize())) {
      try { copy.setTrashed(true); } catch (_) {}
      throw new Error("La copia del activo Drive no coincide con el original: " + id);
    }
    const node = { kind: "file", originalId: id, backupId: copy.getId(), name: file.getName(), mimeType: file.getMimeType(),
      sizeBytes: file.getSize(), sha256: originalHash, parentId: taskServiceBackupParentId_(file), sharing: taskServiceBackupCaptureSharing_(file) };
    visited[id] = node;
    return node;
  }

  let folder = null;
  try { folder = DriveApp.getFolderById(id); } catch (_) {}
  if (!folder || folder.isTrashed()) throw new Error("Activo Drive inexistente o en papelera: " + id);
  const backupFolder = backupParent.createFolder(folder.getName());
  const folderNode = { kind: "folder", originalId: id, backupId: backupFolder.getId(), name: folder.getName(),
    parentId: taskServiceBackupParentId_(folder), sharing: taskServiceBackupCaptureSharing_(folder), children: [] };
  visited[id] = folderNode;
  const files = folder.getFiles();
  while (files.hasNext()) folderNode.children.push(taskServiceBackupCaptureAsset_(files.next().getId(), backupFolder, visited));
  const folders = folder.getFolders();
  while (folders.hasNext()) folderNode.children.push(taskServiceBackupCaptureAsset_(folders.next().getId(), backupFolder, visited));
  return folderNode;
}

function taskServiceBackupCollectReferencedAssets_(ss, backupAssetsFolder) {
  const references = [], seen = {};
  const deliveries = getSheetOrThrow(ss, "Entregas").getDataRange().getValues();
  if (deliveries.length > 1) {
    const headers = deliveries[0].map(function (v) { return String(v || "").trim(); });
    const fileIndex = headers.indexOf("fileUrl") >= 0 ? headers.indexOf("fileUrl") : 4;
    for (let i = 1; i < deliveries.length; i++) {
      const id = extractTaskServiceFileId(deliveries[i][fileIndex]);
      if (id && !seen[id]) { seen[id] = true; references.push(id); }
    }
  }
  const versionsSheet = ss.getSheetByName("EntregasVersiones");
  if (versionsSheet) {
    const versions = versionsSheet.getDataRange().getValues();
    if (versions.length > 1) {
      const headers = versions[0].map(function (v) { return String(v || "").trim(); });
      const fileIndex = headers.indexOf("FileID") >= 0 ? headers.indexOf("FileID") : 6;
      const urlIndex = headers.indexOf("ArchivoUrl") >= 0 ? headers.indexOf("ArchivoUrl") : 5;
      for (let i = 1; i < versions.length; i++) {
        [versions[i][fileIndex], versions[i][urlIndex]].forEach(function (value) {
          const id = extractTaskServiceFileId(value);
          if (id && !seen[id]) { seen[id] = true; references.push(id); }
        });
      }
    }
  }
  const visited = {}, assets = [];
  references.forEach(function (id) {
    const node = taskServiceBackupCaptureAsset_(id, backupAssetsFolder, visited);
    if (assets.indexOf(node) === -1) assets.push(node);
  });
  return assets;
}

function taskServiceCreateAcademicYearBackup_(actor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ["Tareas", "Entregas", "ConfiguracionAcademica"].forEach(function (name) { getSheetOrThrow(ss, name); });
  const backupId = Utilities.getUuid();
  const root = DriveApp.getRootFolder().createFolder(TASK_SERVICE_BACKUP_PREFIX + backupId);
  try {
    const assetsFolder = root.createFolder("assets");
    const sheets = [];
    TASK_SERVICE_BACKUP_SHEETS.forEach(function (name) {
      const sheet = ss.getSheetByName(name);
      if (sheet) sheets.push(taskServiceBackupSnapshotSheet_(sheet));
    });
    const assets = taskServiceBackupCollectReferencedAssets_(ss, assetsFolder);
    const manifest = {
      schemaVersion: TASK_SERVICE_BACKUP_SCHEMA_VERSION,
      backupId: backupId,
      createdAt: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      actor: { userId: actor.actorId, role: actor.role },
      scope: ["Tareas", "Entregas", "ConfiguracionAcademica", "Log_Cierres", "EntregasVersiones", "MetadatosArchivos", "DriveAssetsReferencedByEntregas"],
      sheets: sheets,
      assets: assets,
      assetsFolderId: assetsFolder.getId()
    };
    manifest.checksumSha256 = taskServiceBackupSha256_(JSON.stringify(manifest), false);
    const manifestFile = root.createFile(TASK_SERVICE_BACKUP_PREFIX + backupId + ".json", JSON.stringify(manifest), MimeType.PLAIN_TEXT);
    return { status: "success", backupId: backupId, manifestFileId: manifestFile.getId(), folderId: root.getId(),
      checksumSha256: manifest.checksumSha256, sheetCount: sheets.length, assetCount: Object.keys(assets.reduce(function (out, node) {
        function count(n) { out[n.originalId] = true; (n.children || []).forEach(count); }
        count(node); return out;
      }, {})).length };
  } catch (error) {
    try { root.setTrashed(true); } catch (_) {}
    throw new Error("TASK_SERVICE_BACKUP_FAILED: " + error.message);
  }
}

function taskServiceReadAcademicYearBackup_(manifestFileId) {
  if (!manifestFileId) throw new Error("manifestFileId es requerido.");
  const file = DriveApp.getFileById(String(manifestFileId));
  if (file.isTrashed() || file.getName().indexOf(TASK_SERVICE_BACKUP_PREFIX) !== 0) throw new Error("Archivo de respaldo no válido.");
  const manifest = JSON.parse(file.getBlob().getDataAsString());
  if (!manifest || manifest.schemaVersion !== TASK_SERVICE_BACKUP_SCHEMA_VERSION || manifest.spreadsheetId !== SPREADSHEET_ID ||
      !manifest.sheets || !manifest.assets || !manifest.checksumSha256) throw new Error("Manifiesto de respaldo incompleto o incompatible.");
  const checksum = manifest.checksumSha256;
  delete manifest.checksumSha256;
  const computed = taskServiceBackupSha256_(JSON.stringify(manifest), false);
  manifest.checksumSha256 = checksum;
  if (checksum !== computed) throw new Error("SHA-256 del manifiesto no coincide.");
  const required = ["Tareas", "Entregas", "ConfiguracionAcademica"];
  required.forEach(function (name) {
    if (!manifest.sheets.some(function (sheet) { return sheet.name === name; })) throw new Error("Falta hoja obligatoria en respaldo: " + name);
  });
  return manifest;
}

function taskServiceVerifyBackupAsset_(node) {
  if (node.kind === "file") {
    const file = DriveApp.getFileById(node.backupId);
    if (file.isTrashed() || Number(file.getSize()) !== Number(node.sizeBytes)) throw new Error("Copia de activo ausente, en papelera o con tamaño distinto: " + node.originalId);
    const actual = taskServiceBackupSha256_(file.getBlob().getBytes(), true);
    if (actual !== node.sha256) throw new Error("SHA-256 de activo no coincide: " + node.originalId);
    return 1;
  }
  if (node.kind !== "folder") throw new Error("Tipo de activo no reconocido.");
  const folder = DriveApp.getFolderById(node.backupId);
  if (folder.isTrashed()) throw new Error("Carpeta de respaldo en papelera: " + node.originalId);
  return (node.children || []).reduce(function (sum, child) { return sum + taskServiceVerifyBackupAsset_(child); }, 1);
}

function taskServiceVerifyAcademicYearBackup_(manifestFileId) {
  const manifest = taskServiceReadAcademicYearBackup_(manifestFileId);
  const assetCount = manifest.assets.reduce(function (sum, node) { return sum + taskServiceVerifyBackupAsset_(node); }, 0);
  return { status: "success", isValid: true, backupId: manifest.backupId, checksumSha256: manifest.checksumSha256,
    sheetCount: manifest.sheets.length, assetCount: assetCount, verifiedAt: new Date().toISOString() };
}

function taskServiceCreateRestoreState_(backupFolderId) {
  const restoreId = Utilities.getUuid();
  const state = { version: 1, restoreId: restoreId, idMap: {} };
  const file = DriveApp.getFolderById(backupFolderId).createFile(
    TASK_SERVICE_RESTORE_STATE_PREFIX + restoreId + ".json", JSON.stringify(state), MimeType.PLAIN_TEXT);
  return { restoreId: restoreId, fileId: file.getId() };
}

function taskServiceReadRestoreState_(fileId, restoreId) {
  if (!fileId || !restoreId) throw new Error("RESTORE_STATE_MISSING: falta el estado durable de restauración.");
  const file = DriveApp.getFileById(fileId);
  if (file.isTrashed() || file.getName().indexOf(TASK_SERVICE_RESTORE_STATE_PREFIX) !== 0) {
    throw new Error("RESTORE_STATE_INVALID: archivo de estado no válido.");
  }
  const state = JSON.parse(file.getBlob().getDataAsString());
  if (!state || state.version !== 1 || state.restoreId !== restoreId || !state.idMap) {
    throw new Error("RESTORE_STATE_INVALID: esquema o identificador no coincidente.");
  }
  return state;
}

function taskServicePersistRestoreState_(fileId, state) {
  DriveApp.getFileById(fileId).setContent(JSON.stringify(state));
}

function taskServiceFindRestoreMarker_(parentFolder, kind, markerName) {
  const iterator = kind === "folder" ? parentFolder.getFoldersByName(markerName) : parentFolder.getFilesByName(markerName);
  if (!iterator.hasNext()) return null;
  const item = iterator.next();
  if (iterator.hasNext()) throw new Error("RESTORE_MARKER_AMBIGUOUS: existen copias duplicadas para " + markerName);
  return item;
}

function taskServiceRestoreMarkerName_(restoreState, originalId) {
  return TASK_SERVICE_RESTORE_MARKER_PREFIX + restoreState.restoreId + "_" + originalId;
}

function taskServiceRestoreAsset_(node, parentFolder, idMap, journal, restoreState, restoreStateFileId) {
  const mappedId = restoreState.idMap[node.originalId];
  if (node.kind === "folder") {
    let folder = null;
    if (mappedId) {
      folder = DriveApp.getFolderById(mappedId);
      if (folder.isTrashed()) {
        folder.setTrashed(false);
        journal.push({ kind: "untrashedFolder", id: folder.getId() });
      }
      const folderParents = folder.getParents();
      if (!folderParents.hasNext() || folderParents.next().getId() !== parentFolder.getId()) {
        throw new Error("RESTORE_STATE_PARENT_MISMATCH: carpeta restaurada fuera de su padre esperado: " + node.originalId);
      }
      const markerName = taskServiceRestoreMarkerName_(restoreState, node.originalId);
      if (folder.getName() !== node.name && folder.getName() !== markerName) {
        throw new Error("RESTORE_STATE_NAME_MISMATCH: carpeta restaurada no coincide con su marcador: " + node.originalId);
      }
      folder.setName(node.name);
      taskServiceBackupApplySharing_(folder, node.sharing);
    } else {
      try { folder = DriveApp.getFolderById(node.originalId); } catch (_) {}
      if (!folder) {
        const markerName = taskServiceRestoreMarkerName_(restoreState, node.originalId);
        folder = taskServiceFindRestoreMarker_(parentFolder, "folder", markerName);
        if (!folder) {
          folder = parentFolder.createFolder(markerName);
          journal.push({ kind: "createdFolder", id: folder.getId() });
        }
        restoreState.idMap[node.originalId] = folder.getId();
        taskServicePersistRestoreState_(restoreStateFileId, restoreState);
        folder.setName(node.name);
        taskServiceBackupApplySharing_(folder, node.sharing);
      } else if (folder.isTrashed()) {
        folder.setTrashed(false);
        journal.push({ kind: "untrashedFolder", id: folder.getId() });
      }
    }
    if (!taskServiceBackupVerifySharing_(folder, node.sharing)) throw new Error("Permisos de carpeta cambiaron desde el respaldo: " + node.originalId);
    idMap[node.originalId] = folder.getId();
    (node.children || []).forEach(function (child) {
      taskServiceRestoreAsset_(child, folder, idMap, journal, restoreState, restoreStateFileId);
    });
    return;
  }
  if (node.kind !== "file") throw new Error("Tipo de activo no reconocido durante restauración.");
  const backupFile = DriveApp.getFileById(node.backupId);
  let original = null;
  if (mappedId) {
    original = DriveApp.getFileById(mappedId);
    if (original.isTrashed()) {
      original.setTrashed(false);
      journal.push({ kind: "untrashedFile", id: original.getId() });
    }
    const mappedHash = taskServiceBackupSha256_(original.getBlob().getBytes(), true);
    if (mappedHash !== node.sha256 || Number(original.getSize()) !== Number(node.sizeBytes)) {
      throw new Error("Copia previamente restaurada no coincide con el manifiesto: " + node.originalId);
    }
    const fileParents = original.getParents();
    if (!fileParents.hasNext() || fileParents.next().getId() !== parentFolder.getId()) {
      throw new Error("RESTORE_STATE_PARENT_MISMATCH: archivo restaurado fuera de su padre esperado: " + node.originalId);
    }
    const markerName = taskServiceRestoreMarkerName_(restoreState, node.originalId);
    if (original.getName() !== node.name && original.getName() !== markerName) {
      throw new Error("RESTORE_STATE_NAME_MISMATCH: archivo restaurado no coincide con su marcador: " + node.originalId);
    }
    original.setName(node.name);
    taskServiceBackupApplySharing_(original, node.sharing);
    idMap[node.originalId] = original.getId();
    return;
  }
  try { original = DriveApp.getFileById(node.originalId); } catch (_) {}
  if (original && original.isTrashed()) {
    original.setTrashed(false);
    journal.push({ kind: "untrashedFile", id: original.getId() });
  }
  if (original) {
    const originalHash = taskServiceBackupSha256_(original.getBlob().getBytes(), true);
    if (originalHash === node.sha256 && Number(original.getSize()) === Number(node.sizeBytes)) {
      if (!taskServiceBackupVerifySharing_(original, node.sharing)) throw new Error("Permisos del archivo cambiaron desde el respaldo: " + node.originalId);
      idMap[node.originalId] = original.getId();
      return;
    }
  }
  const markerName = taskServiceRestoreMarkerName_(restoreState, node.originalId);
  let restored = taskServiceFindRestoreMarker_(parentFolder, "file", markerName);
  if (!restored) {
    restored = backupFile.makeCopy(markerName, parentFolder);
    journal.push({ kind: "createdFile", id: restored.getId() });
  }
  restoreState.idMap[node.originalId] = restored.getId();
  taskServicePersistRestoreState_(restoreStateFileId, restoreState);
  restored.setName(node.name);
  taskServiceBackupApplySharing_(restored, node.sharing);
  const restoredHash = taskServiceBackupSha256_(restored.getBlob().getBytes(), true);
  if (restoredHash !== node.sha256 || Number(restored.getSize()) !== Number(node.sizeBytes)) {
    throw new Error("La copia restaurada no coincide con el manifiesto: " + node.originalId);
  }
  idMap[node.originalId] = restored.getId();
}

function taskServiceRewriteBackupReferences_(snapshot, idMap) {
  const values = snapshot.values || [];
  const headers = values.length ? values[0].map(function (v) { return String(v || "").trim(); }) : [];
  function rewriteCell(value) {
    if (typeof value !== "string") return value;
    Object.keys(idMap).forEach(function (oldId) { if (value.indexOf(oldId) !== -1) value = value.split(oldId).join(idMap[oldId]); });
    return value;
  }
  if (snapshot.name === "Entregas") {
    const index = headers.indexOf("fileUrl") >= 0 ? headers.indexOf("fileUrl") : 4;
    for (let i = 1; i < values.length; i++) values[i][index] = rewriteCell(values[i][index]);
  } else if (snapshot.name === "EntregasVersiones") {
    const fileIndex = headers.indexOf("FileID") >= 0 ? headers.indexOf("FileID") : 6;
    const urlIndex = headers.indexOf("ArchivoUrl") >= 0 ? headers.indexOf("ArchivoUrl") : 5;
    for (let i = 1; i < values.length; i++) {
      values[i][fileIndex] = rewriteCell(values[i][fileIndex]);
      values[i][urlIndex] = rewriteCell(values[i][urlIndex]);
    }
  } else if (snapshot.name === "MetadatosArchivos") {
    const idIndex = headers.indexOf("DriveId") >= 0 ? headers.indexOf("DriveId") : 15;
    const urlIndex = headers.indexOf("RutaDrive") >= 0 ? headers.indexOf("RutaDrive") : 16;
    for (let i = 1; i < values.length; i++) {
      values[i][idIndex] = rewriteCell(values[i][idIndex]);
      values[i][urlIndex] = rewriteCell(values[i][urlIndex]);
    }
  }
}

function taskServiceRestoreSheetSnapshot_(ss, snapshot) {
  let sheet = ss.getSheetByName(snapshot.name);
  if (!sheet) sheet = ss.insertSheet(snapshot.name);
  sheet.clearContents();
  if (!snapshot.rows || !snapshot.columns) return sheet;
  if (sheet.getMaxRows() < snapshot.rows) sheet.insertRowsAfter(sheet.getMaxRows(), snapshot.rows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < snapshot.columns) sheet.insertColumnsAfter(sheet.getMaxColumns(), snapshot.columns - sheet.getMaxColumns());
  const values = snapshot.values.map(function (row) { return row.map(taskServiceBackupDecodeValue_); });
  const range = sheet.getRange(1, 1, snapshot.rows, snapshot.columns);
  range.setValues(values);
  if (snapshot.formulas && snapshot.formulas.length) range.setFormulas(snapshot.formulas);
  return sheet;
}

function taskServiceVerifyRestoredSheet_(sheet, expected) {
  const actual = taskServiceBackupSnapshotSheet_(sheet);
  if (actual.rows !== expected.rows || actual.columns !== expected.columns) return false;
  for (let r = 0; r < expected.rows; r++) {
    for (let c = 0; c < expected.columns; c++) {
      const formula = expected.formulas && expected.formulas[r] ? expected.formulas[r][c] : "";
      const actualFormula = actual.formulas && actual.formulas[r] ? actual.formulas[r][c] : "";
      if (String(formula || "") !== String(actualFormula || "")) return false;
      if (!formula && JSON.stringify(actual.values[r][c]) !== JSON.stringify(expected.values[r][c])) return false;
    }
  }
  return true;
}

function taskServiceVerifyAppendOnlyBackupLog_(ss, snapshot) {
  const sheet = ss.getSheetByName(snapshot.name);
  if (!sheet) return snapshot.rows === 0;
  const actual = taskServiceBackupSnapshotSheet_(sheet);
  if (actual.rows < snapshot.rows || actual.columns < snapshot.columns) return false;
  for (let r = 0; r < snapshot.rows; r++) for (let c = 0; c < snapshot.columns; c++) {
    const formula = snapshot.formulas && snapshot.formulas[r] ? snapshot.formulas[r][c] : "";
    const actualFormula = actual.formulas && actual.formulas[r] ? actual.formulas[r][c] : "";
    if (String(formula || "") !== String(actualFormula || "")) return false;
    if (!formula && JSON.stringify(actual.values[r][c]) !== JSON.stringify(snapshot.values[r][c])) return false;
  }
  return true;
}
function taskServiceGetRestoreProgress_(journal, isRecovery) {
  if (!journal || typeof journal !== "object") {
    throw new Error("RESTORE_PROGRESS_MISSING: falta el journal de restauración.");
  }
  const fileId = isRecovery ? journal.recoveryRestoreStateFileId : journal.restoreStateFileId;
  const restoreId = isRecovery ? journal.recoveryRestoreId : journal.restoreId;
  if (!fileId || !restoreId) {
    throw new Error("RESTORE_PROGRESS_MISSING: falta el estado durable independiente de restauración.");
  }
  return { fileId: String(fileId), restoreId: String(restoreId) };
}

function taskServiceRestoreAcademicYearBackup_(manifestFileId, actor, skipDurableJournal, lockAlreadyHeld, recoveryJournal) {
  const manifest = taskServiceReadAcademicYearBackup_(manifestFileId);
  taskServiceVerifyAcademicYearBackup_(manifestFileId);
  const lock = LockService.getScriptLock();
  if (!lockAlreadyHeld) lock.waitLock(30000);
  let ss = null, properties = null, durableJournal = recoveryJournal || null, rollbackManifestFileId = "", restoreStateFileId = "", restoreState = null;
  const before = {}, journal = [], idMap = {};
  try {
    properties = PropertiesService.getScriptProperties();
    if (!skipDurableJournal) {
      const existingJournal = properties.getProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY);
      if (existingJournal) throw new Error("RECOVERY_REQUIRED: existe una restauración interrumpida; ejecute recoverTaskServiceAcademicYearRestore antes de otra restauración.");
      const safetyBackup = taskServiceCreateAcademicYearBackup_(actor);
      if (!safetyBackup || safetyBackup.status !== "success" || !safetyBackup.manifestFileId) throw new Error("No se pudo crear el respaldo compensatorio durable.");
      rollbackManifestFileId = safetyBackup.manifestFileId;
      const stateRecord = taskServiceCreateRestoreState_(safetyBackup.folderId);
      restoreStateFileId = stateRecord.fileId;
      durableJournal = { version: 1, state: "APPLYING", targetManifestFileId: manifestFileId,
        rollbackManifestFileId: rollbackManifestFileId, restoreId: stateRecord.restoreId,
        restoreStateFileId: restoreStateFileId, actorId: actor.actorId, startedAt: new Date().toISOString() };
      properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
    }
    const restoreProgress = taskServiceGetRestoreProgress_(durableJournal, !!skipDurableJournal);
    restoreStateFileId = restoreProgress.fileId;
    restoreState = taskServiceReadRestoreState_(restoreProgress.fileId, restoreProgress.restoreId);
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    manifest.sheets.filter(function (s) { return s.name !== "Log_Cierres"; }).forEach(function (snapshot) {
      const existing = ss.getSheetByName(snapshot.name);
      before[snapshot.name] = existing ? taskServiceBackupSnapshotSheet_(existing) : null;
    });
    const allAssets = {};
    function indexAsset(node) { allAssets[node.originalId] = node; (node.children || []).forEach(indexAsset); }
    manifest.assets.forEach(indexAsset);
    function assetDepth(node, seen) {
      seen = seen || {};
      if (seen[node.originalId] || !allAssets[node.parentId]) return 0;
      seen[node.originalId] = true;
      return 1 + assetDepth(allAssets[node.parentId], seen);
    }
    manifest.assets.slice().sort(function (a, b) { return assetDepth(a) - assetDepth(b); }).forEach(function (node) {
      let parent = idMap[node.parentId] ? DriveApp.getFolderById(idMap[node.parentId]) : null;
      if (!parent) { try { parent = DriveApp.getFolderById(node.parentId); } catch (_) {} }
      if (!parent || parent.isTrashed()) throw new Error("Carpeta padre original no disponible para restaurar activo: " + node.originalId);
      taskServiceRestoreAsset_(node, parent, idMap, journal, restoreState, restoreStateFileId);
    });
    const expected = manifest.sheets.filter(function (s) { return s.name !== "Log_Cierres"; }).map(function (snapshot) {
      const copy = JSON.parse(JSON.stringify(snapshot));
      taskServiceRewriteBackupReferences_(copy, idMap);
      taskServiceRestoreSheetSnapshot_(ss, copy);
      return copy;
    });
    expected.forEach(function (snapshot) {
      const restored = ss.getSheetByName(snapshot.name);
      if (!restored || !taskServiceVerifyRestoredSheet_(restored, snapshot)) throw new Error("Verificación post-restauración fallida en hoja " + snapshot.name);
    });
    const auditSnapshot = manifest.sheets.find(function (s) { return s.name === "Log_Cierres"; });
    if (auditSnapshot && !taskServiceVerifyAppendOnlyBackupLog_(ss, auditSnapshot)) throw new Error("El registro Log_Cierres no conserva su historial previo.");

    manifest.assets.forEach(function (node) {
      function verifyRestored(n) {
        const id = idMap[n.originalId] || n.originalId;
        if (n.kind === "file") {
          const file = DriveApp.getFileById(id);
          if (file.isTrashed() || taskServiceBackupSha256_(file.getBlob().getBytes(), true) !== n.sha256) throw new Error("Activo restaurado no verificable: " + n.originalId);
        } else {
          const folder = DriveApp.getFolderById(id);
          if (folder.isTrashed()) throw new Error("Carpeta restaurada no verificable: " + n.originalId);
          (n.children || []).forEach(verifyRestored);
        }
      }
      verifyRestored(node);
    });
    if (durableJournal) {
      durableJournal.state = "COMPLETED";
      durableJournal.completedAt = new Date().toISOString();
      properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
      properties.deleteProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY);
    }
    return { status: "success", backupId: manifest.backupId, restoredSheets: expected.length,
      restoredAssets: journal.length, idMap: idMap, rollbackManifestFileId: rollbackManifestFileId,
      actorId: actor.actorId, restoredAt: new Date().toISOString() };
  } catch (error) {
    let rollbackErrors = [];
    Object.keys(before).reverse().forEach(function (name) {
      try {
        if (before[name]) taskServiceRestoreSheetSnapshot_(ss, before[name]);
        else {
          const sheet = ss.getSheetByName(name);
          if (sheet) ss.deleteSheet(sheet);
        }
      } catch (rollbackError) { rollbackErrors.push("sheet " + name + ": " + rollbackError.message); }
    });
    journal.slice().reverse().forEach(function (entry) {
      try {
        if (entry.kind === "createdFile") DriveApp.getFileById(entry.id).setTrashed(true);
        else if (entry.kind === "createdFolder") DriveApp.getFolderById(entry.id).setTrashed(true);
        else if (entry.kind === "untrashedFile") DriveApp.getFileById(entry.id).setTrashed(true);
        else if (entry.kind === "untrashedFolder") DriveApp.getFolderById(entry.id).setTrashed(true);
      } catch (rollbackError) { rollbackErrors.push(entry.kind + " " + entry.id + ": " + rollbackError.message); }
    });
    if (rollbackErrors.length) {
      if (durableJournal && properties) {
        durableJournal.state = "RECOVERY_REQUIRED";
        durableJournal.lastError = String(error.message || error).slice(0, 1200);
        durableJournal.rollbackErrorCount = rollbackErrors.length;
        durableJournal.rollbackErrors = rollbackErrors.slice(0, 10).map(function (item) { return String(item).slice(0, 400); });
        properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
      }
      throw new Error("RESTORE_FAILED_ROLLBACK_INCOMPLETE: " + error.message + " | " + rollbackErrors.join("; "));
    }
    if (durableJournal && properties) {
      if (skipDurableJournal) {
        durableJournal.state = "RECOVERY_REQUIRED";
        durableJournal.lastRecoveryError = String(error.message || error).slice(0, 1200);
        properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
      } else {
        properties.deleteProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY);
      }
    }
    throw new Error("RESTORE_FAILED_ROLLED_BACK: " + error.message);
  } finally {
    if (!lockAlreadyHeld) lock.releaseLock();
  }
}

function recoverTaskServiceAcademicYearRestore(payload) {
  const actor = assertTaskServiceBackupAdministrator_(payload);
  if (!payload || payload.confirmed !== true || payload.confirmCode !== "RECOVER-TASK-SERVICE-RESTORE") {
    throw new Error("RECOVERY_CONFIRMATION_REQUIRED: se requiere confirmed=true y confirmCode RECOVER-TASK-SERVICE-RESTORE.");
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const raw = properties.getProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY);
    if (!raw) return { status: "success", recovered: false, message: "No existe una restauración interrumpida pendiente." };
    const durableJournal = JSON.parse(raw);
    if (durableJournal.version !== 1 || !durableJournal.rollbackManifestFileId || !durableJournal.restoreStateFileId || !durableJournal.restoreId) {
      throw new Error("RECOVERY_JOURNAL_INVALID: no se puede determinar el respaldo compensatorio o su estado de progreso.");
    }
    if (!!durableJournal.recoveryRestoreStateFileId !== !!durableJournal.recoveryRestoreId) {
      throw new Error("RECOVERY_JOURNAL_INVALID: el estado de progreso de recuperación está incompleto.");
    }
    if (!durableJournal.recoveryRestoreStateFileId) {
      const rollbackManifest = DriveApp.getFileById(durableJournal.rollbackManifestFileId);
      if (rollbackManifest.isTrashed()) throw new Error("RECOVERY_JOURNAL_INVALID: el manifiesto compensatorio está en papelera.");
      const parents = rollbackManifest.getParents();
      if (!parents.hasNext()) throw new Error("RECOVERY_JOURNAL_INVALID: el manifiesto compensatorio no tiene carpeta contenedora.");
      const rollbackFolder = parents.next();
      if (rollbackFolder.isTrashed() || rollbackFolder.getName().indexOf(TASK_SERVICE_BACKUP_PREFIX) !== 0) {
        throw new Error("RECOVERY_JOURNAL_INVALID: la carpeta compensatoria no pertenece al protocolo de respaldo.");
      }
      const recoveryState = taskServiceCreateRestoreState_(rollbackFolder.getId());
      durableJournal.recoveryRestoreStateFileId = recoveryState.fileId;
      durableJournal.recoveryRestoreId = recoveryState.restoreId;
      durableJournal.recoveryStateCreatedAt = new Date().toISOString();
      properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
    }
    if (durableJournal.state === "COMPLETED") {
      properties.deleteProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY);
      return { status: "success", recovered: false, clearedCompletedJournal: true };
    }
    if (["APPLYING", "RECOVERY_REQUIRED", "RECOVERING"].indexOf(durableJournal.state) === -1) {
      throw new Error("RECOVERY_JOURNAL_INVALID: estado de recuperación no reconocido.");
    }
    durableJournal.state = "RECOVERING";
    durableJournal.recoveryActorId = actor.actorId;
    durableJournal.recoveryStartedAt = new Date().toISOString();
    properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
    try {
      const result = taskServiceRestoreAcademicYearBackup_(durableJournal.rollbackManifestFileId, actor, true, true, durableJournal);
      durableJournal.state = "COMPLETED";
      durableJournal.completedAt = new Date().toISOString();
      properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
      properties.deleteProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY);
      return { status: "success", recovered: true, originalTargetManifestFileId: durableJournal.targetManifestFileId,
        rollbackManifestFileId: durableJournal.rollbackManifestFileId, recoveryResult: result };
    } catch (recoveryError) {
      durableJournal.state = "RECOVERY_REQUIRED";
      durableJournal.lastRecoveryError = String(recoveryError.message || recoveryError).slice(0, 1200);
      durableJournal.recoveryFailedAt = new Date().toISOString();
      properties.setProperty(TASK_SERVICE_RESTORE_JOURNAL_KEY, JSON.stringify(durableJournal));
      throw recoveryError;
    }
  } finally {
    lock.releaseLock();
  }
}

function createTaskServiceAcademicYearBackup(payload) {
  const actor = assertTaskServiceBackupAdministrator_(payload);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return taskServiceCreateAcademicYearBackup_(actor); }
  finally { lock.releaseLock(); }
}

function verifyTaskServiceAcademicYearBackup(payload) {
  assertTaskServiceBackupAdministrator_(payload);
  return taskServiceVerifyAcademicYearBackup_(payload && payload.manifestFileId);
}

function restoreTaskServiceAcademicYearBackup(payload) {
  const actor = assertTaskServiceBackupAdministrator_(payload);
  if (!payload || payload.confirmed !== true || payload.confirmCode !== "RESTORE-TASK-SERVICE-BACKUP") {
    throw new Error("RESTORE_CONFIRMATION_REQUIRED: se requiere confirmed=true y confirmCode RESTORE-TASK-SERVICE-BACKUP.");
  }
  return taskServiceRestoreAcademicYearBackup_(payload.manifestFileId, actor);
}
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// [TAREA-F4-P0-02] [Fase 4: Protección IDOR y ABAC] - Aislamiento estricto de tareas por estudiante
function extractTaskServiceFileId(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/[?&]id=([^&]+)/) || raw.match(/\/d\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : raw;
}
function getTaskServiceUserProfile(userId) {
  if (!userId) throw new Error("Identidad de usuario requerida.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const row = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues().slice(1)
    .find(item => String(item[0]).trim() === String(userId).trim());
  if (!row) throw new Error("No se encontró el perfil del usuario autenticado.");
  return { userId: row[0], nombre: row[1] || "", grado: row[2] || "", seccion: row[3] || "" };
}
function getTaskServiceGuardianStudentIds(guardianUserId, spreadsheet) {
  if (!guardianUserId) return [];
  const ss = spreadsheet || SpreadsheetApp.openById(SPREADSHEET_ID), expMap = Object.create(null);
  const expSheet = ss.getSheetByName("ExpedientesEstudiantes");
  const relationSheet = ss.getSheetByName("RelacionesFamiliares");
  if (!expSheet || !relationSheet) return [];
  expSheet.getDataRange().getValues().slice(1).forEach(row => {
    const expedienteId = String(row[0] || "").trim();
    if (!expedienteId) return;
    if (Object.prototype.hasOwnProperty.call(expMap, expedienteId)) expMap[expedienteId] = null;
    else expMap[expedienteId] = String(row[1] || "").trim() || null;
  });
  const now = Date.now(), candidates = [];
  relationSheet.getDataRange().getValues().slice(1).forEach(row => {
    if (String(row[2] || "").trim() !== String(guardianUserId).trim()) return;
    if (["VERIFICADA", "ACTIVA", "APROBADA"].indexOf(String(row[4] || "").trim().toUpperCase()) === -1) return;
    const startValue = row[5], endValue = row[6];
    const start = startValue === "" || startValue === null || startValue === undefined ? null : new Date(startValue).getTime();
    const end = endValue === "" || endValue === null || endValue === undefined ? null : new Date(endValue).getTime();
    if ((startValue !== "" && startValue !== null && startValue !== undefined && !Number.isFinite(start)) ||
        (endValue !== "" && endValue !== null && endValue !== undefined && !Number.isFinite(end)) ||
        (start !== null && start > now) || (end !== null && end < now) ||
        (start !== null && end !== null && start > end)) return;
    let permissions = {};
    if (row[8] !== "" && row[8] !== null && row[8] !== undefined) {
      try {
        permissions = typeof row[8] === "string" ? JSON.parse(row[8]) : row[8];
        if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) return;
      } catch (_) { return; }
    }
    if (permissions.permisoAcademico !== true) return;
    const relationId = String(row[0] || "").trim(), expedienteId = String(row[1] || "").trim();
    const studentId = expMap[expedienteId];
    if (relationId && studentId) candidates.push({ relationId, studentId });
  });
  const relationCounts = Object.create(null), studentCounts = Object.create(null);
  candidates.forEach(item => {
    relationCounts[item.relationId] = (relationCounts[item.relationId] || 0) + 1;
    studentCounts[item.studentId] = (studentCounts[item.studentId] || 0) + 1;
  });
  return candidates.filter(item => relationCounts[item.relationId] === 1 && studentCounts[item.studentId] === 1)
    .map(item => item.studentId);
}

function isTaskServiceAdministrativeRole(role) { return ["Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role)!==-1; }
function assertTaskServiceTeacherAssignedToOffer(userId, offerId, classroomContext, spreadsheet) {
  const teacherId = String(userId || "").trim(), requestedOfferId = String(offerId || "").trim();
  if (!teacherId || !requestedOfferId) throw new Error("TEACHER_ASSIGNMENT_CONTEXT_REQUIRED");
  const ss = spreadsheet || SpreadsheetApp.openById(SPREADSHEET_ID);
  const assignmentSheet = ss && ss.getSheetByName("AsignacionesDocentes");
  const offerSheet = ss && ss.getSheetByName("OfertaAcademica");
  if (!assignmentSheet || !offerSheet) throw new Error("TEACHER_ASSIGNMENT_SOURCE_UNAVAILABLE");
  const assignmentData = assignmentSheet.getDataRange().getValues();
  const offerData = offerSheet.getDataRange().getValues();
  if (!assignmentData || assignmentData.length < 2 || !offerData || offerData.length < 2) {
    throw new Error("TEACHER_ASSIGNMENT_NOT_FOUND");
  }
  const normalizeHeader = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const assignmentHeaders = assignmentData[0].map(normalizeHeader);
  const assignmentIndex = aliases => {
    for (let i = 0; i < aliases.length; i++) {
      const index = assignmentHeaders.indexOf(aliases[i]);
      if (index >= 0) return index;
    }
    return -1;
  };
  const ai = {
    id: assignmentIndex(["asignacionid", "assignmentid", "id"]),
    offer: assignmentIndex(["ofertaid", "offerid"]),
    teacher: assignmentIndex(["docenteuserid", "docenteid", "profesorid", "userid", "teacheruserid"]),
    start: assignmentIndex(["fechainicio", "inicio", "startdate"]),
    end: assignmentIndex(["fechafin", "fin", "enddate"]),
    state: assignmentIndex(["estado", "status"])
  };
  if (Object.keys(ai).some(key => ai[key] < 0)) throw new Error("TEACHER_ASSIGNMENT_SCHEMA_INVALID");
  const offerHeaders = offerData[0].map(normalizeHeader);
  const offerIndex = aliases => {
    for (let i = 0; i < aliases.length; i++) {
      const index = offerHeaders.indexOf(aliases[i]);
      if (index >= 0) return index;
    }
    return -1;
  };
  const oi = {
    id: offerIndex(["ofertaid", "offerid"]),
    year: offerIndex(["anoid", "anolectivo", "ano"]),
    grade: offerIndex(["grado"]),
    section: offerIndex(["seccion"]),
    subject: offerIndex(["asignaturaid", "asignatura"]),
    plan: offerIndex(["planid"]),
    state: offerIndex(["estado", "estadooferta"])
  };
  if (Object.keys(oi).some(key => oi[key] < 0)) throw new Error("ACADEMIC_OFFER_SCHEMA_INVALID");
  const offerIdCounts = Object.create(null), offerById = Object.create(null);
  offerData.slice(1).forEach(row => {
    const id = String(row[oi.id] || "").trim();
    if (!id) return;
    offerIdCounts[id] = (offerIdCounts[id] || 0) + 1;
    offerById[id] = row;
  });
  if (offerIdCounts[requestedOfferId] !== 1) throw new Error("ACADEMIC_OFFER_NOT_UNIQUE");
  const offer = offerById[requestedOfferId];
  const activeState = value => ["activo", "activa", "active"].indexOf(String(value || "").trim().toLowerCase()) !== -1;
  if (!offer || !activeState(offer[oi.state]) || !String(offer[oi.year] || "").trim() ||
      !String(offer[oi.grade] || "").trim() || !String(offer[oi.section] || "").trim() ||
      !String(offer[oi.subject] || "").trim() || !String(offer[oi.plan] || "").trim()) {
    throw new Error("ACADEMIC_OFFER_NOT_ACTIVE_OR_INCOMPLETE");
  }
  const assignmentIdCounts = Object.create(null);
  assignmentData.slice(1).forEach(row => {
    const id = String(row[ai.id] || "").trim();
    if (id) assignmentIdCounts[id] = (assignmentIdCounts[id] || 0) + 1;
  });
  const activeAssignments = assignmentData.slice(1).filter(row =>
    String(row[ai.offer] || "").trim() === requestedOfferId &&
    String(row[ai.teacher] || "").trim() === teacherId && activeState(row[ai.state]));
  if (activeAssignments.length !== 1) throw new Error("TEACHER_ASSIGNMENT_NOT_UNIQUE");
  const assignment = activeAssignments[0], assignmentId = String(assignment[ai.id] || "").trim();
  if (!assignmentId || assignmentIdCounts[assignmentId] !== 1) throw new Error("TEACHER_ASSIGNMENT_ID_AMBIGUOUS");
  const parseBound = value => {
    if (value === "" || value === null || value === undefined) return { valid: true, time: null };
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? { valid: true, time: date.getTime() } : { valid: false, time: null };
  };
  const start = parseBound(assignment[ai.start]), end = parseBound(assignment[ai.end]), now = Date.now();
  if (!start.valid || !end.valid || (start.time !== null && start.time > now) ||
      (end.time !== null && end.time < now) ||
      (start.time !== null && end.time !== null && start.time > end.time)) {
    throw new Error("TEACHER_ASSIGNMENT_OUTSIDE_EFFECTIVE_WINDOW");
  }
  if (classroomContext) {
    const classroom = Array.isArray(classroomContext)
      ? { grade: classroomContext[3], section: classroomContext[4], subject: classroomContext[5] }
      : classroomContext;
    const same = (left, right) => String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
    if (!same(classroom.grade, offer[oi.grade]) || !same(classroom.section, offer[oi.section])) {
      throw new Error("TEACHER_ASSIGNMENT_OFFER_SCOPE_MISMATCH");
    }
    const subjectReference = String(classroom.subject || "").trim();
    const subjectSheet = ss.getSheetByName("CatalogoAsignaturas");
    if (!subjectReference || !subjectSheet) throw new Error("ACADEMIC_SUBJECT_SOURCE_UNAVAILABLE");
    const subjectData = subjectSheet.getDataRange().getValues();
    if (!subjectData || subjectData.length < 2) throw new Error("ACADEMIC_SUBJECT_NOT_FOUND");
    const subjectHeaders = subjectData[0].map(normalizeHeader);
    const subjectIndex = aliases => {
      for (let i = 0; i < aliases.length; i++) {
        const index = subjectHeaders.indexOf(aliases[i]);
        if (index >= 0) return index;
      }
      return -1;
    };
    const si = {
      id: subjectIndex(["asignaturaid"]),
      name: subjectIndex(["nombreoficial", "nombre"]),
      code: subjectIndex(["codigo"]),
      state: subjectIndex(["estado"])
    };
    if (si.id < 0 || si.state < 0 || (si.name < 0 && si.code < 0)) {
      throw new Error("ACADEMIC_SUBJECT_SCHEMA_INVALID");
    }
    const reference = subjectReference.toUpperCase();
    const subjectMatches = subjectData.slice(1).filter(row =>
      [row[si.id], si.name >= 0 ? row[si.name] : "", si.code >= 0 ? row[si.code] : ""]
        .some(value => String(value || "").trim().toUpperCase() === reference));
    if (subjectMatches.length !== 1 || !activeState(subjectMatches[0][si.state]) ||
        String(subjectMatches[0][si.id] || "").trim() !== String(offer[oi.subject] || "").trim()) {
      throw new Error("TEACHER_ASSIGNMENT_OFFER_SCOPE_MISMATCH");
    }
  }
  return true;
}
function getTaskServiceClassroomById(id) {
 if(!id||String(id).trim()==="General")return null;
 return getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"AulasVirtuales").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===String(id).trim())||null;
}
function assertTaskServiceClassroomAccess(payload,id,verifiedIdentity) {
 const actor=verifiedIdentity||getVerifiedTaskIdentity_(payload);
 if(!actor||!actor.authorized)throw new Error("Identidad verificada requerida.");
 const role=actor.role,ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 const scope=getVerifiedTaskDepartmentScope_(payload,ss,actor);
 if(!scope||!scope.authorized)throw new Error(scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED.");

 if(String(id||"").trim()==="General"){
  if(!isTaskServiceAdministrativeRole(role)||scope.institutionWide!==true)throw new Error("AUTH_PERMISSION_DENIED");
  return null;
 }
 const rows=getSheetOrThrow(ss,"AulasVirtuales").getDataRange().getValues().slice(1);
 const row=rows.find(r=>String(r[0]||"").trim()===String(id||"").trim());
 if(!row||normalizeString(row[7]||"Activa")==="desactivada")throw new Error("Aula no válida o inactiva.");
 const ownership=assertTaskServiceResourceOwnership_(payload,"AULA_VIRTUAL",id,"WRITE",ss,actor,scope);
 if(!ownership||!ownership.authorized)throw new Error(ownership&&ownership.code||"RESOURCE_SCOPE_DENIED");
 if(role==="Profesor"){
  assertTaskServiceTeacherAssignedToOffer(actor.userId,row[1],row);
  if(String(row[6]||"").trim()!==String(actor.userId).trim())throw new Error("El aula no está asignada al docente autenticado.");
  return row;
 }
 if(!isTaskServiceAdministrativeRole(role))throw new Error("Acceso denegado.");
 return row;
}
function assertTaskServiceTeacherCanManageTask(payload,row,operation) {
 const identity=getVerifiedTaskIdentity_(payload),uid=identity.userId,role=identity.role;if(!identity.authorized||!uid||!row||!String(row[0]||"").trim())throw new Error("RESOURCE_NOT_FOUND");
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedTaskDepartmentScope_(payload,ss,identity);
 const ownership=assertTaskServiceResourceOwnership_(payload,"TAREA",row[0],operation||"MANAGE",ss,identity,scope);if(!ownership.authorized)throw new Error("RESOURCE_NOT_FOUND");
 if(isTaskServiceAdministrativeRole(role))return true;if(role!=="Profesor")throw new Error("Acceso denegado: solo el docente asignado puede gestionar la tarea.");
 const classrooms=getTaskServiceAuthorizedClassrooms(payload,{identity:identity,ss:ss,scope:scope,departmentId:ownership.departmentId});
 if(!isTaskServiceTeacherTaskAuthorized_(row,classrooms,uid))throw new Error("RESOURCE_NOT_FOUND");return true;
}

function getTaskServiceAuthorizedClassrooms(payload,verifiedContext) {
 const context=verifiedContext||{};
 const actor=context.identity||getVerifiedTaskIdentity_(payload);
 if(!actor||!actor.authorized)throw new Error("Identidad verificada requerida.");
 const role=actor.role,uid=String(actor.userId||"").trim();
 const ss=context.ss||SpreadsheetApp.openById(SPREADSHEET_ID);
 const rows=getSheetOrThrow(ss,"AulasVirtuales").getDataRange().getValues().slice(1)
  .filter(r=>normalizeString(r[7]||"Activa")!=="desactivada");
 const isAdmin=isTaskServiceAdministrativeRole(role);

 if(isAdmin||role==="Profesor"){
  const scope=context.scope||getVerifiedTaskDepartmentScope_(payload,ss,actor);
  if(!scope||!scope.authorized)throw new Error(scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED");
  let candidates=rows;
  if(role==="Profesor"){
   candidates=rows.filter(row=>{
    if(!row[1]||String(row[6]||"").trim()!==uid)return false;
    try{return assertTaskServiceTeacherAssignedToOffer(uid,row[1],row,ss)===true;}
    catch(_){return false;}
   });
  }
  return candidates.filter(row=>{
   const ownership=assertTaskServiceResourceOwnership_(payload,"AULA_VIRTUAL",row[0],"READ",ss,actor,scope);
   if(!ownership||!ownership.authorized)return false;
   return !context.departmentId||String(ownership.departmentId||"").trim()===String(context.departmentId).trim();
  });
 }

 let studentIds=[];
 if(role==="Estudiante"||role==="Alumno")studentIds=[uid];
 else if(["Padre","Tutor","Responsable"].includes(role))studentIds=getTaskServiceGuardianStudentIds(uid);
 else throw new Error("Rol no autorizado.");

 const studentContexts=studentIds.map(studentId=>{
  const profile=getTaskServiceUserProfile(studentId);
  const identity={authorized:true,userId:String(studentId).trim(),role:"Estudiante"};
  const scope=getVerifiedTaskDepartmentScope_(payload,ss,identity);
  return scope&&scope.authorized?{profile,identity,scope}:null;
 }).filter(Boolean);
 if(!studentContexts.length)
  throw new Error("Acceso denegado: ámbito departamental del estudiante no verificado.");

 return rows.filter(row=>studentContexts.some(studentContext=>{
  if(normalizeString(row[3])!==normalizeString(studentContext.profile.grado))return false;
  if(row[4]&&normalizeString(row[4])!==normalizeString(studentContext.profile.seccion))return false;
  const ownership=assertTaskServiceResourceOwnership_(payload,"AULA_VIRTUAL",row[0],"READ",ss,studentContext.identity,studentContext.scope);
  return !!(ownership&&ownership.authorized);
 }));
}
function isTaskServiceTeacherTaskAuthorized_(task, authorizedClassrooms, teacherId) {
  if (!task || !teacherId || String(task[10] || "").trim() !== String(teacherId).trim()) return false;
  return (authorizedClassrooms || []).some(classroom =>
    normalizeString(classroom[7] || "Activa") !== "desactivada" &&
    normalizeString(classroom[3]) === normalizeString(task[6]) &&
    (!classroom[4] || isInTeacherList(classroom[4], task[7])) &&
    normalizeString(classroom[5]) === normalizeString(task[5]) &&
    String(classroom[6] || "").trim() === String(teacherId).trim()
  );
}


var TASK_RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();
var TASK_RESOURCE_OWNERSHIP_HEADERS_ = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
function getVerifiedTaskIdentity_(payload) {
 const token=getRequestSessionToken_(payload),cached=payload&&payload._imaVerifiedTaskIdentity;
 if(cached&&cached.token===token&&cached.actor)return Object.assign({},cached.actor);
 const claims=getVerifiedRequestSessionClaims_(payload);
 if(!claims||!claims.userId||!claims.role)return {authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
 const actor={authorized:true,userId:String(claims.userId).trim(),role:String(claims.role).trim()};
 if(payload&&typeof payload==="object"){payload._imaVerifiedTaskIdentity={token:token,actor:actor};payload._verifiedUserId=actor.userId;payload._verifiedRole=actor.role;}
 return Object.assign({},actor);
}

function getInstitutionalResponsibilityForRoleScope_(ss, responsibilityId) {
  var id=String(responsibilityId||"").trim(); if(!id||!ss)return null;
  var sheet=ss.getSheetByName("ResponsabilidadesInstitucionales"); if(!sheet)return null;
  var data=sheet.getDataRange().getValues();
  var headers=["ResponsibilityID","Nombre","Descripcion","ModulosJSON","CapacidadesJSON","Estado","CreadoPor","FechaActualizacion"];
  if(!data.length||JSON.stringify(data[0].map(String))!==JSON.stringify(headers))return null;
  var rows=data.slice(1).filter(function(r){return String(r[0]||"").trim()===id;});
  if(rows.length!==1)return null;
  var r=rows[0],state=String(r[5]||"").trim().toUpperCase();
  if(!(r[5]===true||state==="TRUE"||state==="ACTIVA"||state==="ACTIVO"))return null;
  var modules,capabilities; try{modules=JSON.parse(r[3]||"[]");capabilities=JSON.parse(r[4]||"[]");}catch(e){return null;}
  var normalizeIds=function(values){if(!Array.isArray(values))return null;var seen={},out=[];for(var i=0;i<values.length;i++){if(typeof values[i]!=="string")return null;var value=values[i].trim(),key="$"+value;if(!value||seen[key])return null;seen[key]=true;out.push(value);}return out;};
  modules=normalizeIds(modules);capabilities=normalizeIds(capabilities);if(!modules||!capabilities)return null;
  return {responsibilityId:id,name:String(r[1]||""),description:String(r[2]||""),modules:modules,capabilities:capabilities};
}
function resolveInternalResponsibilityForRoleScope_(ss, responsibilityId) {
  var id=String(responsibilityId||"").trim();if(!id||!ss)return null;
  var sheet=ss.getSheetByName("CatalogoRolesInternos");if(!sheet)return null;
  var data=sheet.getDataRange().getValues();
  var base=["RolInternoID","CodigoInterno","NombreResponsabilidad","Descripcion","Departamento","AreaAcademica","TipoResponsabilidad","VigenciaMeses","PermiteSuplencia","Estado","CreadoPor","FechaCreacion","FechaActualizacion"];
  if(!data.length)return null;
  var headers=data[0].map(String),legacy=JSON.stringify(headers)===JSON.stringify(base),linked=JSON.stringify(headers)===JSON.stringify(base.concat(["ResponsibilityID"]));
  if(!legacy&&!linked)return null;
  var rows=data.slice(1).filter(function(r){return String(r[0]||"").trim()===id;});
  if(rows.length!==1||String(rows[0][9]||"").trim().toUpperCase()!=="ACTIVO")return null;
  var r=rows[0],institutionalId=linked?String(r[13]||"").trim():"";
  var institutional=institutionalId?getInstitutionalResponsibilityForRoleScope_(ss,institutionalId):null;
  if(institutionalId&&!institutional)return null;
  return {responsibilityId:id,name:String(r[2]||""),department:String(r[4]||""),academicArea:String(r[5]||""),responsibilityType:String(r[6]||""),institutionalResponsibilityId:institutionalId||null,institutionalResponsibility:institutional};
}
function getVerifiedDepartmentScopeForSession_(payload, ss, actor) {
  if(!actor||actor.authorized!==true||!actor.userId||!actor.role)return {authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
  var claims=getVerifiedRequestSessionClaims_(payload);
  if(!claims||String(claims.userId||"").trim()!==String(actor.userId).trim()||String(claims.role||"").trim()!==String(actor.role).trim())return {authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
  var institutionId="";try{institutionId=String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID")||"").trim();}catch(_){}
  if(!institutionId)return {authorized:false,code:"IDENTITY_CONFIGURATION_REQUIRED"};
  var membershipId=String(claims.membershipId||"").trim(),claimsInstitutionId=String(claims.institutionId||"").trim();
  if(membershipId&&(!claimsInstitutionId||claimsInstitutionId!==institutionId))return {authorized:false,code:"ROLE_MEMBERSHIP_INSTITUTION_MISMATCH"};
  var sheet=ss&&ss.getSheetByName("AsignacionesAmbitosRoles");if(!sheet)return {authorized:false,code:"ROLE_SCOPE_NOT_INITIALIZED"};
  var data=sheet.getDataRange().getValues();
  var legacyHeaders=["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"];
  var membershipHeaders=legacyHeaders.concat(["InstitutionID","MembershipID"]),currentHeaders=membershipHeaders.concat(["ResponsibilityID"]);
  var actual=data.length?data[0].map(String):[];
  var schema=JSON.stringify(actual)===JSON.stringify(currentHeaders)?"current":(JSON.stringify(actual)===JSON.stringify(membershipHeaders)?"membership":(JSON.stringify(actual)===JSON.stringify(legacyHeaders)?"legacy":"invalid"));
  if(schema==="invalid"||(membershipId&&schema!=="current"))return {authorized:false,code:"ROLE_SCOPE_SCHEMA_MISMATCH"};
  var norm=function(v){return String(v||"").trim().toUpperCase().replace(/^ROLE[_-]?/,"").replace(/[^A-Z0-9]/g,"");};
  var parseValues=function(v){if(Array.isArray(v))return v.map(function(x){return String(x).trim();}).filter(Boolean);var raw=String(v||"").trim();if(!raw)return [];try{var p=JSON.parse(raw);if(Array.isArray(p))return p.map(function(x){return String(x).trim();}).filter(Boolean);if(p!==null&&p!==undefined)return [String(p).trim()].filter(Boolean);}catch(_){}return raw.split(",").map(function(x){return String(x).trim();}).filter(Boolean);};
  var parseDate=function(v){if(v===""||v===null||v===undefined)return {valid:true,date:null};var d=v instanceof Date?v:new Date(v);return isNaN(d.getTime())?{valid:false,date:null}:{valid:true,date:d};};
  var assignmentCounts={};data.slice(1).forEach(function(r){var id=String((r||[])[0]||"").trim();if(id)assignmentCounts[id]=(assignmentCounts[id]||0)+1;});
  var now=new Date(),scopes=[];
  for(var i=1;i<data.length;i++){
    var row=data[i]||[],assignmentId=String(row[0]||"").trim();
    if(!assignmentId||assignmentCounts[assignmentId]!==1||String(row[1]||"").trim()!==String(actor.userId).trim())continue;
    var rowRole=String(row[2]||"").trim();
    if(!rowRole||(membershipId?rowRole!==String(claims.role).trim():norm(rowRole)!==norm(claims.role)))continue;
    var rowInstitution=schema==="legacy"?"":String(row[12]||"").trim(),rowMembership=schema==="legacy"?"":String(row[13]||"").trim();
    var rowResponsibility=schema==="current"?String(row[14]||"").trim():"",responsibility=null;
    if(membershipId){if(rowInstitution!==institutionId||rowMembership!==membershipId||!rowResponsibility)continue;responsibility=resolveInternalResponsibilityForRoleScope_(ss,rowResponsibility);if(!responsibility)continue;}
    else if(rowInstitution||rowMembership)continue;
    if(["ACTIVO","ACTIVA","ACTIVE"].indexOf(String(row[5]||"").trim().toUpperCase())===-1)continue;
    var start=parseDate(row[8]),end=parseDate(row[9]);if(!start.valid||!end.valid)continue;
    if(start.date&&start.date.getTime()>now.getTime())continue;if(end.date&&end.date.getTime()<now.getTime())continue;
    var scopeType=String(row[3]||"").trim().toUpperCase(),scopeValues=parseValues(row[4]);if(!scopeType||!scopeValues.length)continue;
    scopes.push({assignmentId:assignmentId,roleId:rowRole,institutionId:rowInstitution||null,membershipId:rowMembership||null,responsibilityId:rowResponsibility||null,responsibility:responsibility,scopeType:scopeType,scopeValues:scopeValues});
  }
  if(!scopes.length)return {authorized:false,code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",userId:actor.userId,role:actor.role,institutionId:institutionId,membershipId:membershipId||null,scopes:[],departmentIds:[],institutionWide:false};
  var departmentIds=[],institutionWide=false;
  scopes.forEach(function(scope){if(scope.scopeType==="DEPARTAMENTO")scope.scopeValues.forEach(function(v){if(departmentIds.indexOf(v)===-1)departmentIds.push(v);});if(scope.scopeType==="INSTITUCION"&&scope.scopeValues.indexOf(institutionId)!==-1)institutionWide=true;});
  var activeDepartmentId=String((payload&&payload.activeDepartmentId)||"").trim();
  if(activeDepartmentId){
    if(departmentIds.indexOf(activeDepartmentId)===-1)return {authorized:false,code:"ACTIVE_SCOPE_NOT_ASSIGNED",userId:actor.userId,role:actor.role,institutionId:institutionId,membershipId:membershipId||null,scopes:[],departmentIds:[],institutionWide:false};
    scopes=scopes.filter(function(scope){if(scope.scopeType!=="DEPARTAMENTO")return false;var selected=scope.scopeValues.filter(function(v){return v===activeDepartmentId;});if(!selected.length)return false;scope.scopeValues=selected;return true;});
    departmentIds=[activeDepartmentId];institutionWide=false;
  }
  return {authorized:true,userId:String(actor.userId),role:String(actor.role),institutionId:institutionId,membershipId:membershipId||null,scopes:scopes,departmentIds:departmentIds,institutionWide:institutionWide,activeDepartmentId:activeDepartmentId||null};
}

function getVerifiedTaskDepartmentScope_(payload, ss, identity) {
  const actor=identity||getVerifiedTaskIdentity_(payload);
  return getVerifiedDepartmentScopeForSession_(payload,ss,actor);
}
function getTaskServiceResourceOwnershipSnapshot_(ss,payload) {
 try{if(payload&&typeof payload==="object"){const c=TASK_RESOURCE_OWNERSHIP_REQUEST_CACHE_.get(payload);if(c)return c;}}catch(_){}
 const sheet=ss&&ss.getSheetByName("ResourceOwnership");if(!sheet||sheet.getLastRow()<=1)return {authorized:false,code:"RESOURCE_OWNERSHIP_NOT_CONFIGURED"};
 const data=sheet.getDataRange().getValues(),headers=(data[0]||[]).slice(0,TASK_RESOURCE_OWNERSHIP_HEADERS_.length).map(v=>String(v||"").trim());
 if(JSON.stringify(headers)!==JSON.stringify(TASK_RESOURCE_OWNERSHIP_HEADERS_))return {authorized:false,code:"RESOURCE_OWNERSHIP_SCHEMA_MISMATCH"};
 const result={authorized:true,sheet,data};try{if(payload&&typeof payload==="object")TASK_RESOURCE_OWNERSHIP_REQUEST_CACHE_.set(payload,result);}catch(_){}return result;
}
function assertTaskServiceResourceOwnership_(payload,typeValue,idValue,operation,ss,identity,scope) {
 try{
  const actor=identity||getVerifiedTaskIdentity_(payload);if(!actor||!actor.authorized)return actor||{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
  const context=scope||getVerifiedTaskDepartmentScope_(payload,ss||SpreadsheetApp.openById(SPREADSHEET_ID),actor);if(!context||!context.authorized)return context||{authorized:false,code:"DEPARTMENT_SCOPE_NOT_ASSIGNED"};
  const type=String(typeValue||"").trim().toUpperCase(),id=String(idValue||"").trim();if(!type||!id)return {authorized:false,code:"RESOURCE_REFERENCE_INVALID"};
  const snapshot=getTaskServiceResourceOwnershipSnapshot_(ss||SpreadsheetApp.openById(SPREADSHEET_ID),payload);if(!snapshot.authorized)return snapshot;
  const matches=snapshot.data.slice(1).filter(r=>String(r[1]||"").trim()===context.institutionId&&String(r[2]||"").trim().toUpperCase()===type&&String(r[3]||"").trim()===id&&String(r[5]||"").trim().toUpperCase()==="ACTIVE");
  if(!matches.length)return {authorized:false,code:"RESOURCE_OWNERSHIP_UNVERIFIED"};if(matches.length!==1)return {authorized:false,code:"RESOURCE_OWNERSHIP_AMBIGUOUS"};
  const departmentId=String(matches[0][4]||"").trim();if(!departmentId)return {authorized:false,code:"RESOURCE_DEPARTMENT_UNRESOLVED"};
  const inDepartment=(context.departmentIds||[]).some(v=>String(v||"").trim()===departmentId);if(context.institutionWide!==true&&!inDepartment)return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};
  return {authorized:true,code:"RESOURCE_SCOPE_ALLOWED",userId:actor.userId,role:actor.role,institutionId:context.institutionId,departmentId,resourceType:type,resourceId:id,operation:String(operation||"").trim().toUpperCase(),accessType:context.institutionWide===true?"INSTITUTION":"DEPARTMENT"};
 }catch(_){return {authorized:false,code:"RESOURCE_OWNERSHIP_CHECK_FAILED"};}
}
function resolveTaskServiceOwnershipDepartment_(payload,scope) {
 if(!scope||!scope.authorized)return {authorized:false,code:scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED"};
 const allowed=(scope.departmentIds||[]).map(v=>String(v||"").trim()).filter(Boolean),requested=String(payload&&payload.departmentId||"").trim();
 if(requested){if(allowed.indexOf(requested)===-1&&scope.institutionWide!==true)return {authorized:false,code:"RESOURCE_DEPARTMENT_SELECTION_DENIED"};return {authorized:true,departmentId:requested};}
 if(allowed.length===1)return {authorized:true,departmentId:allowed[0]};if(allowed.length>1)return {authorized:false,code:"RESOURCE_DEPARTMENT_SELECTION_REQUIRED"};return {authorized:false,code:"RESOURCE_DEPARTMENT_UNRESOLVED"};
}

function ensureTaskServiceResourceOwnershipSheet_(ss) {
  let sheet=ss&&ss.getSheetByName("ResourceOwnership");
  if(!sheet)sheet=ss.insertSheet("ResourceOwnership");
  if(sheet.getLastRow()===0)sheet.appendRow(TASK_RESOURCE_OWNERSHIP_HEADERS_);
  const headers=sheet.getRange(1,1,1,TASK_RESOURCE_OWNERSHIP_HEADERS_.length).getValues()[0].map(v=>String(v||"").trim());
  if(JSON.stringify(headers)!==JSON.stringify(TASK_RESOURCE_OWNERSHIP_HEADERS_))throw new Error("RESOURCE_OWNERSHIP_SCHEMA_MISMATCH");
  return sheet;
}

function registerTaskServiceResourceOwnership_(scope,typeValue,idValue,departmentValue,ss) {
 let lock=null;try{
  if(!scope||!scope.authorized||!scope.userId||!scope.institutionId)return {authorized:false,code:"DEPARTMENT_SCOPE_NOT_ASSIGNED"};
  const type=String(typeValue||"").trim().toUpperCase(),id=String(idValue||"").trim(),dept=String(departmentValue||"").trim();
  if(!type||!id||!dept||((scope.departmentIds||[]).map(String).indexOf(dept)===-1&&scope.institutionWide!==true))return {authorized:false,code:"RESOURCE_OWNERSHIP_FIELDS_INVALID"};
  lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {authorized:false,code:"RESOURCE_OWNERSHIP_LOCK_TIMEOUT"};
  let sheet;try{sheet=ensureTaskServiceResourceOwnershipSheet_(ss||SpreadsheetApp.openById(SPREADSHEET_ID));}catch(error){return {authorized:false,code:error&&error.message==="RESOURCE_OWNERSHIP_SCHEMA_MISMATCH"?"RESOURCE_OWNERSHIP_SCHEMA_MISMATCH":"RESOURCE_OWNERSHIP_NOT_CONFIGURED"};}
  const data=sheet.getDataRange().getValues(),matches=[];
  for(let i=1;i<data.length;i++){const r=data[i]||[];if(String(r[1]||"").trim()===scope.institutionId&&String(r[2]||"").trim().toUpperCase()===type&&String(r[3]||"").trim()===id)matches.push(r);}
  if(matches.length>1)return {authorized:false,code:"RESOURCE_OWNERSHIP_AMBIGUOUS"};
  if(matches.length===1){const r=matches[0];if(String(r[5]||"").trim().toUpperCase()==="ACTIVE"&&String(r[4]||"").trim()===dept)return {authorized:true,ownershipId:String(r[0]||"").trim(),idempotent:true};return {authorized:false,code:"RESOURCE_OWNERSHIP_CONFLICT"};}
  const now=new Date().toISOString(),ownershipId="OWN-"+Utilities.getUuid();sheet.appendRow([ownershipId,scope.institutionId,type,id,dept,"ACTIVE",scope.userId,now,now]);return {authorized:true,ownershipId,idempotent:false};
 }catch(_){return {authorized:false,code:"RESOURCE_OWNERSHIP_WRITE_FAILED"};}finally{if(lock){try{lock.releaseLock();}catch(_){}}}
}
function assertTaskServiceSubmissionTaskOwnership_(payload,deliveryId,operation) {
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),deliveries=getSheetOrThrow(ss,"Entregas").getDataRange().getValues().slice(1);
 const delivery=deliveries.find(r=>String(r[0]||"").trim()===String(deliveryId||"").trim());if(!delivery)throw new Error("RESOURCE_NOT_FOUND");
 const task=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]||"").trim()===String(delivery[1]||"").trim());
 if(!task)throw new Error("RESOURCE_NOT_FOUND");assertTaskServiceTeacherCanManageTask(payload,task,operation||"MANAGE");return {delivery,task};
}

function getTaskServiceSubmissionAccess_(payload, operation, verifiedIdentity) {
  const identity = verifiedIdentity || getVerifiedTaskIdentity_(payload);
  const role = identity && identity.role;
  function deny(reason) {
    try {
      Logger.log("[TASK-SVC] SUBMISSION_ACCESS_DENIED operation=" + String(operation || "READ") +
        " role=" + String(role || "UNKNOWN") + " reason=" + String(reason || "RESOURCE_NOT_FOUND"));
    } catch (_) {}
    throw new Error("RESOURCE_NOT_FOUND");
  }
  if (!identity || !identity.authorized) deny("identity_unverified");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const deliveryValues = getSheetOrThrow(ss, "Entregas").getDataRange().getValues();
  const deliveries = deliveryValues.slice(1);
  const requestedDeliveryId = String(payload && payload.entregaId || "").trim();
  const requestedTaskId = String(payload && payload.tareaId || "").trim();
  let delivery = null;
  if (requestedDeliveryId) {
    delivery = deliveries.find(row => String(row[0] || "").trim() === requestedDeliveryId) || null;
    if (!delivery) deny("delivery_missing");
  }
  if (delivery && requestedTaskId && String(delivery[1] || "").trim() !== requestedTaskId) {
    deny("delivery_task_mismatch");
  }
  const taskId = String(delivery && delivery[1] || requestedTaskId).trim();
  if (!taskId) deny("task_id_missing");
  const task = getSheetOrThrow(ss, "Tareas").getDataRange().getValues().slice(1)
    .find(row => String(row[0] || "").trim() === taskId) || null;
  if (!task) deny("task_missing");

  const isStaff = role === "Profesor" || isTaskServiceAdministrativeRole(role);
  let studentId = delivery ? String(delivery[2] || "").trim() : "";
  if (isStaff) {
    try {
      assertTaskServiceTeacherCanManageTask(payload, task, operation || "READ");
    } catch (error) {
      if (error && error.message === "RESOURCE_NOT_FOUND") deny("staff_task_scope");
      throw error;
    }
  } else {
    let allowedStudentIds = [];
    if (role === "Estudiante" || role === "Alumno") {
      allowedStudentIds = [identity.userId];
    } else if (["Padre", "Tutor", "Responsable"].indexOf(role) !== -1) {
      allowedStudentIds = getTaskServiceGuardianStudentIds(identity.userId).map(value => String(value || "").trim());
    } else {
      deny("role_not_allowed");
    }
    if (!delivery) {
      const candidates = deliveries.filter(row =>
        String(row[1] || "").trim() === taskId &&
        allowedStudentIds.indexOf(String(row[2] || "").trim()) !== -1 &&
        normalizeString(row[6]) !== "eliminada"
      );
      if (candidates.length !== 1) deny("student_delivery_missing_or_ambiguous");
      delivery = candidates[0];
      studentId = String(delivery[2] || "").trim();
    }
    if (!studentId || allowedStudentIds.indexOf(studentId) === -1) deny("student_delivery_owner");
    if (normalizeString(delivery[6]) === "eliminada") deny("student_delivery_deleted");
    try {
      assertTaskServiceStudentCanAccessTask(ss, studentId, task);
    } catch (error) {
      if (error && error.message === "RESOURCE_NOT_FOUND") deny("student_task_scope");
      throw error;
    }
  }
  return { ss, identity, role, isStaff, task, taskId, delivery, deliveries, studentId };
}
function deactivateTaskServiceResourceOwnership_(payload,typeValue,idValue,ss) {
 const identity=getVerifiedTaskIdentity_(payload);if(!identity.authorized)return {authorized:false,code:identity.code};
 const scope=getVerifiedTaskDepartmentScope_(payload,ss,identity);if(!scope.authorized)return {authorized:false,code:scope.code};
 const sheet=ss.getSheetByName("ResourceOwnership");if(!sheet||sheet.getLastRow()<=1)return {authorized:false,code:"RESOURCE_OWNERSHIP_NOT_CONFIGURED"};
 const data=sheet.getDataRange().getValues(),matches=[];
 for(let i=1;i<data.length;i++){const r=data[i]||[];if(String(r[1]||"").trim()===scope.institutionId&&String(r[2]||"").trim().toUpperCase()===String(typeValue||"").trim().toUpperCase()&&String(r[3]||"").trim()===String(idValue||"").trim()&&String(r[5]||"").trim().toUpperCase()==="ACTIVE")matches.push({row:r,rowNumber:i+1});}
 if(matches.length!==1)return {authorized:false,code:matches.length?"RESOURCE_OWNERSHIP_AMBIGUOUS":"RESOURCE_OWNERSHIP_UNVERIFIED"};
 const owner=String(matches[0].row[4]||"").trim();if((scope.departmentIds||[]).map(String).indexOf(owner)===-1&&scope.institutionWide!==true)return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};
 sheet.getRange(matches[0].rowNumber,6).setValue("INACTIVE");sheet.getRange(matches[0].rowNumber,7).setValue(identity.userId);sheet.getRange(matches[0].rowNumber,9).setValue(new Date().toISOString());return {authorized:true};
}


function getStudentTasks(payload) {
  const role = payload && payload._verifiedRole, actorId = payload && payload._verifiedUserId;
  if (!actorId) throw new Error("Acceso denegado: se requiere identidad verificada.");
  let targetUserId = String(actorId).trim(), profile = getTaskServiceUserProfile(actorId);
  if (["Padre", "Tutor", "Responsable"].indexOf(role) !== -1) {
    targetUserId = String((payload.studentId || payload.estudianteId || payload.userId || "")).trim();
    if (!targetUserId || getTaskServiceGuardianStudentIds(actorId).indexOf(targetUserId) === -1) throw new Error("Acceso denegado: estudiante no vinculado o sin permiso académico.");
    profile = getTaskServiceUserProfile(targetUserId);
  } else if (role === "Profesor" || ["Administrador", "Desarrollador", "Dirección", "Secretaría"].indexOf(role) !== -1) {
    targetUserId = String((payload.studentId || payload.estudianteId || payload.userId || "")).trim();
    if (!targetUserId) throw new Error("Se requiere estudiante objetivo.");
    profile = getTaskServiceUserProfile(targetUserId);
  } else if (role !== "Estudiante" && role !== "Alumno") throw new Error("Rol no autorizado.");
  const grado = profile.grado, seccion = profile.seccion, userId = targetUserId;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tasksData = getSheetOrThrow(ss, "Tareas").getDataRange().getValues().slice(1);
  const entregasData = getSheetOrThrow(ss, "Entregas").getDataRange().getValues().slice(1);
  const teacherClassrooms = role === "Profesor" ? getTaskServiceAuthorizedClassrooms(payload) : null;
  const staffScope = role === "Profesor" || isTaskServiceAdministrativeRole(role) ? getVerifiedTaskDepartmentScope_(payload, ss) : null;
  const resourceIdentity = { authorized: true, userId: targetUserId, role: "Estudiante" };
  const resourceScope = getVerifiedTaskDepartmentScope_(payload, ss, resourceIdentity);
  if (!resourceScope || !resourceScope.authorized) throw new Error("Acceso denegado: ámbito departamental del estudiante no verificado.");
  if (staffScope && !staffScope.authorized) throw new Error("Acceso denegado: ámbito del personal no verificado.");
  const seenOriginalTasksForEC = new Set();
  const studentTasks = tasksData.filter(task => {
    if (role === "Profesor" && !isTaskServiceTeacherTaskAuthorized_(task, teacherClassrooms, actorId)) return false;
    if (!assertTaskServiceResourceOwnership_(payload, "TAREA", task[0], "READ", ss, resourceIdentity, resourceScope).authorized) return false;
    if (staffScope && !assertTaskServiceResourceOwnership_(payload, "TAREA", task[0], "READ", ss, null, staffScope).authorized) return false;
    if (normalizeString(task[6]) !== normalizeString(grado)) return false;
    if (task[7] && String(task[7]).trim() && !isInTeacherList(seccion, task[7])) return false;
    if (task[1] === "Credito Extra") {
      const originalId = String(task[9] || "").trim();
      if (!originalId || seenOriginalTasksForEC.has(originalId)) return false;
      const original = entregasData.find(row => String(row[1]).trim() === originalId && String(row[2]).trim() === userId);
      const state = String(original && original[6] || "").trim().toLowerCase();
      const rejected = ["rechazada", "revisada_rechazada", "tarea incompleta"].indexOf(state) !== -1;
      if (rejected) seenOriginalTasksForEC.add(originalId);
      return rejected;
    }
    return true;
  }).map(task => {
    const canSeeDeletedSubmissions = role === "Profesor" || isTaskServiceAdministrativeRole(role);
    const matching = entregasData.filter(row => String(row[1]).trim() === String(task[0]).trim() && String(row[2]).trim() === userId && (canSeeDeletedSubmissions || normalizeString(row[6]) !== "eliminada"));
    const entrega = matching.length ? matching[matching.length - 1] : null;
    let fechaLimite = task[8] ? new Date(task[8]).toISOString() : null;
    if (task[1] === "Credito Extra") {
      const original = tasksData.find(row => String(row[0]).trim() === String(task[9] || "").trim());
      if (original && original[8]) fechaLimite = new Date(original[8]).toISOString();
    }
    return { tareaId:task[0],tipo:task[1],titulo:task[2],descripcion:task[3],parcial:task[4],grado:task[6],seccion:task[7],
      asignatura:task[5],fechaLimite:fechaLimite,fechaDisponible:task[14]?new Date(task[14]).toISOString():null,
      tipoRecurso:task[15]||task[1]||"Tarea",profesorId:task[10],
      entrega:entrega?{entregaId:entrega[0],calificacion:entrega[5],estado:entrega[6],comentario:entrega[7],fileId:entrega[4],mimeType:entrega[8]}:null };
  });
  return { status:"success", data:studentTasks.reverse() };
}

/**
 * Sube un archivo individualmente a Drive sin registrar la entrega aún.
 * Crea una carpeta específica para la entrega del alumno en esa tarea.
 */

function assertTaskServiceStudentCanAccessTask(ss, userId, taskRow) {
  if (!taskRow) throw new Error("RESOURCE_NOT_FOUND");
  const profile = getTaskServiceUserProfile(userId);
  if (normalizeString(taskRow[6]) !== normalizeString(profile.grado)) throw new Error("RESOURCE_NOT_FOUND");
  if (taskRow[7] && String(taskRow[7]).trim() && !isInTeacherList(profile.seccion, taskRow[7])) throw new Error("RESOURCE_NOT_FOUND");
  if (String(taskRow[11] || "Activa").trim().toLowerCase() === "desactivada") throw new Error("RESOURCE_NOT_FOUND");
  const studentIdentity = { authorized: true, userId: String(userId || "").trim(), role: "Estudiante" };
  const studentScope = getVerifiedTaskDepartmentScope_({}, ss, studentIdentity);
  const ownership = assertTaskServiceResourceOwnership_({}, "TAREA", taskRow[0], "READ", ss, studentIdentity, studentScope);
  if (!ownership.authorized) throw new Error("RESOURCE_NOT_FOUND");
  if (String(taskRow[1] || "").trim() === "Credito Extra") {
    const originalId = String(taskRow[9] || "").trim();
    const deliveries = getSheetOrThrow(ss, "Entregas").getDataRange().getValues().slice(1);
    const original = deliveries.find(r => String(r[1]).trim() === originalId && String(r[2]).trim() === String(userId).trim());
    const state = String(original && original[6] || "").trim().toLowerCase();
    if (!original || ["rechazada", "revisada_rechazada", "tarea incompleta"].indexOf(state) === -1) throw new Error("Acceso denegado: crédito extra sin entrega original rechazada.");
  }
  return profile;
}

function ensureTaskServiceFileMetadataSheet(ss) {
  const sheet = getOrCreateSheet(ss, "MetadatosArchivos");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID","Titulo","NombreOriginal","NombreFisico","TipoRecurso","Asignatura","Grado","Seccion","Parcial","Anio","Tema","TareaId","ProfesorId","FechaSubida","Estado","DriveId","RutaDrive","MimeType","TamanoBytes","PropietarioUserId","DriveFolderId"]);
  } else {
    if (!sheet.getRange(1,20).getValue()) sheet.getRange(1,20).setValue("PropietarioUserId");
    if (!sheet.getRange(1,21).getValue()) sheet.getRange(1,21).setValue("DriveFolderId");
  }
  return sheet;
}

function findTaskServiceUploadSession(sessionSheet, sessionKey) {
  const data=sessionSheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++)if(String(data[i][0])===String(sessionKey))return {rowIndex:i+1,row:data[i]};
  return null;
}

function assertTaskServiceUploadSessionOwner(session,payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole;
  if(!session||!actorId||String(session.row[1]).trim()!==String(actorId).trim())throw new Error("Acceso denegado: sesión de carga ajena.");
  if(role!=="Estudiante"&&role!=="Alumno"&&!isTaskServiceAdministrativeRole(role))throw new Error("Rol no autorizado para esta sesión de carga.");
  return actorId;
}



// RBAC is validated by doPost; this handler keeps the task-to-actor relationship check before any Drive write.
function uploadFile(payload) {
  const request = payload || {};
  const actorId = String(request._verifiedUserId || "").trim();
  const role = String(request._verifiedRole || "");
  const taskId = String(request.tareaId || "").trim();
  const fileData = String(request.fileData || "");
  const fileName = String(request.fileName || "").trim();
  if (!actorId || !taskId || !fileData || !fileName) throw new Error("Identidad, tarea, nombre y contenido del archivo son obligatorios.");
  if (/[\/\\\u0000-\u001F]/.test(fileName)) throw new Error("FILE_INVALID_NAME");
  const blockedExtensions = [".exe",".bat",".cmd",".sh",".msi",".dll",".com",".scr",".vbs",".js",".jar",".ps1",".apk"];
  const lowerFileName = fileName.toLowerCase();
  const nameParts = lowerFileName.split(".");
  if (blockedExtensions.some(ext => lowerFileName.endsWith(ext)) ||
      nameParts.slice(1,-1).some(part => blockedExtensions.indexOf("." + part) !== -1)) {
    throw new Error("DANGEROUS_FILE_EXTENSION");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const taskData = getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1)
    .find(row => String(row[0] || "").trim() === taskId);
  if (!taskData) throw new Error("Tarea no encontrada.");
  let profile = {grado:String(taskData[6] || "General"),seccion:String(taskData[7] || "General")};
  if (role === "Estudiante" || role === "Alumno") {
    const studentProfile = assertTaskServiceStudentCanAccessTask(ss,actorId,taskData);
    if (studentProfile) profile = studentProfile;
  } else if (role === "Profesor") {
    assertTaskServiceTeacherCanManageTask(request,taskData,"UPLOAD_FILE");
  } else if (!isTaskServiceAdministrativeRole(role)) {
    throw new Error("Rol no autorizado para subir archivos.");
  }
  const parts = fileData.split(",");
  const raw = parts.length > 1 ? parts[1] : parts[0];
  const dataUri = parts[0].match(/^data:([^;]+);base64$/i);
  const extension = lowerFileName.split(".").pop();
  const mimeByExtension = {
    pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",
    heic:"image/heic",mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime",m4v:"video/x-m4v",
    avi:"video/x-msvideo",mkv:"video/x-matroska","3gp":"video/3gpp",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt:"text/plain",csv:"text/csv"
  };
  const mimeType = dataUri ? String(dataUri[1] || "").toLowerCase() : (mimeByExtension[extension] || "application/octet-stream");
  if (!raw) throw new Error("Archivo vacío.");
  const bytes = Utilities.base64Decode(raw.replace(/\s/g,""));
  if (!bytes || !bytes.length) throw new Error("Archivo vacío.");
  if (bytes.length > 50 * 1024 * 1024) throw new Error("UPLOAD_SIZE_LIMIT: maximum file size is 50 MB.");
  const blob = Utilities.newBlob(bytes,mimeType,fileName);
  const root = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const grade = getOrCreateFolder(root,String(profile.grado || taskData[6] || "General"));
  const section = getOrCreateFolder(grade,String(profile.seccion || taskData[7] || "General"));
  const ownerFolder = getOrCreateFolder(section,actorId);
  const partial = getOrCreateFolder(ownerFolder,String(taskData[4] || "General"));
  const subject = getOrCreateFolder(partial,String(taskData[5] || "General"));
  const taskFolder = getOrCreateFolder(subject,String(taskData[2] || "Tarea") + "_" + actorId);
  const file = taskFolder.createFile(blob);
  try {
    logFileMetadata(ss,{fileName:fileName,fileId:file.getId(),fileUrl:file.getUrl(),mimeType:mimeType,sizeBytes:bytes.length,
      tareaId:taskId,asignatura:String(taskData[5] || "General"),parcial:String(taskData[4] || "General"),
      grado:String(taskData[6] || "General"),seccion:String(taskData[7] || "General"),
      profesorId:String(taskData[10] || ""),ownerUserId:actorId,folderId:taskFolder.getId()});
  } catch (error) {
    try { file.setTrashed(true); } catch (_) {}
    throw new Error("No se pudo registrar el archivo; la carga fue revertida.");
  }
  return {status:"success",data:{fileId:file.getId(),folderId:taskFolder.getId(),mimeType:mimeType}};
}
function finishChunkedUpload() { throw new Error("El protocolo de carga legacy está deshabilitado; utilice carga reanudable autenticada."); }

// [TAREA-10] [Fase 1: Auditoría y planificación de la expansión] - Sistema ampliado de asignaciones, entregas multimodales, revisiones, versiones, rúbricas y retroalimentación.
function submitAssignment(payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole,tareaId=String(payload&&payload.tareaId||"").trim();
  if(!actorId||(role!=="Estudiante"&&role!=="Alumno"))throw new Error("Solo el estudiante autenticado puede entregar su tarea.");
  if(payload.userId&&String(payload.userId).trim()!==String(actorId).trim())throw new Error("El userId enviado no coincide con la sesión autenticada.");
  if(!tareaId)throw new Error("tareaId es obligatorio.");
  try{const quota=getDriveStorageQuotaMetricsReport({});if(quota&&quota.status==="success"&&quota.metrics&&parseFloat(quota.metrics.porcentajeUso)>=99.5)return {status:"error",message:"No se puede confirmar la entrega: el almacenamiento del servidor alcanzó su límite máximo. Contacte al soporte institucional."};}
  catch(quotaError){Logger.log("Aviso al verificar cuota en submitAssignment: "+quotaError.message);}
  const lock=LockService.getScriptLock();let lockHeld=false;
  try{
    lockHeld=lock.tryLock(10000);if(!lockHeld)throw new Error("TASK_SUBMISSION_LOCK_TIMEOUT");
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),taskRow=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===tareaId);
    assertTaskServiceStudentCanAccessTask(ss,actorId,taskRow);
    const fileId=extractTaskServiceFileId(payload.fileId),mimeType=payload.mimeType||"";
    if(payload.fileId){const meta=ensureTaskServiceFileMetadataSheet(ss).getDataRange().getValues().slice(1);
      const owned=meta.some(r=>(String(r[15]||"").trim()===fileId||String(r[20]||"").trim()===fileId)&&String(r[11]||"").trim()===tareaId&&String(r[19]||"").trim()===String(actorId).trim()&&String(r[14]||"").trim().toLowerCase()==="activo");
      if(!owned)throw new Error("Acceso denegado: el archivo no pertenece al estudiante ni a la tarea indicada.");}
    const entregas=getSheetOrThrow(ss,"Entregas"),versions=getOrCreateSheet(ss,"EntregasVersiones");
    if(versions.getLastRow()===0)versions.appendRow(["ID","EntregaID","TareaID","UserID","VersionNum","ArchivoUrl","FileID","MimeType","TextoRespuesta","EnlaceExterno","FechaEnvio","Estado","Observaciones"]);
    const data=entregas.getDataRange().getValues(),now=new Date(),idx=data.findIndex((r,i)=>i>0&&String(r[2]).trim()===String(actorId).trim()&&String(r[1]).trim()===tareaId);
    let entregaId,versionNum=1,estado=payload.esBorrador?"borrador":"Pendiente de revisión";
    if(taskRow[8]&&!payload.esBorrador&&now.getTime()>new Date(taskRow[8]).getTime())estado="EntregadaTarde";
    if(idx>0){entregaId=data[idx][0];const prev=data[idx],wasDeleted=String(prev[6]||"").trim().toLowerCase()==="eliminada";versionNum=versions.getDataRange().getValues().filter(r=>String(r[1]).trim()===String(entregaId).trim()).length+1;prev[3]=now;prev[4]=fileId||"";prev[6]=estado;prev[8]=mimeType;if(wasDeleted){prev[5]="";prev[7]="";const headerNames=(data[0]||[]).map(value=>String(value||"").trim().toLowerCase());["eliminadapor","eliminadarol","eliminadaen","motivoeliminacion"].forEach(name=>{const column=headerNames.indexOf(name);if(column>=0)prev[column]="";});}entregas.getRange(idx+1,1,1,prev.length).setValues([prev]);}
    else{entregaId="ENT-"+Utilities.getUuid();entregas.appendRow([entregaId,tareaId,actorId,now,fileId||"","",estado,payload.observaciones||"",mimeType]);}
    versions.appendRow(["VER-"+Utilities.getUuid(),entregaId,tareaId,actorId,versionNum,fileId&&mimeType!=="folder"?"https://drive.google.com/file/d/"+fileId+"/view":"",fileId||"",mimeType,payload.textoRespuesta||"",payload.enlaceExterno||"",now,estado,payload.observaciones||""]);
    return {status:"success",message:payload.esBorrador?"Borrador de tarea guardado.":"Tarea entregada y registrada en el servidor.",data:{entregaId,versionNum,submissionToken:"RECIEVED-"+Utilities.getUuid(),fechaRecepcion:now.toISOString(),estado}};
  }finally{if(lockHeld){try{lock.releaseLock();}catch(releaseError){Logger.log("No se pudo liberar ScriptLock en submitAssignment: "+releaseError.message);}}}
}
function saveSubmissionDraft(payload) {
  return submitAssignment(Object.assign({}, payload, { esBorrador: true }));
}

function normalizeTaskGradeScore_(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error("TASK_GRADE_REQUIRED");
  }
  const score = Number(value);
  if (!isFinite(score) || score < 0 || score > 100) throw new Error("TASK_GRADE_OUT_OF_RANGE");
  if (Math.abs(score * 100 - Math.round(score * 100)) > 0.0000001) throw new Error("TASK_GRADE_PRECISION_INVALID");
  return Math.round(score * 100) / 100;
}

function gradeSubmissionWithRubric(payload) {
  return withAuthorizedTaskSubmissionMutation_(payload, "GRADE", context => {
    const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const headers = context.deliverySheet.getDataRange().getValues()[0] || [];
    function findColIndex(name) { const target=normalizeString(name); const matches=[]; headers.forEach((h,i)=>{if(normalizeString(h)===target)matches.push(i);}); return matches.length===1?matches[0]:-1; }
    const calificacionCol=findColIndex("calificacion"), estadoCol=findColIndex("estado"), comentarioCol=findColIndex("comentario");
    if (calificacionCol===-1||estadoCol===-1||comentarioCol===-1) throw new Error("TASK_GRADE_SCHEMA_INVALID");
    const rowData=context.delivery.slice(); while(rowData.length<headers.length)rowData.push("");
    const oldRow=rowData.slice();
    const normalizedGrade=normalizeTaskGradeScore_(p.calificacion);
    const event=prepareTaskGradeRectificationEvent_(context,rowData[calificacionCol],normalizedGrade,p.motivoRectificacion);
    rowData[calificacionCol]=normalizedGrade; rowData[estadoCol]=p.estado||"revisada"; rowData[comentarioCol]=p.comentario||"";
    context.deliverySheet.getRange(context.deliveryRowIndex,1,1,rowData.length).setValues([rowData]);
    if(event){try{appendTaskGradeRectificationEvent_(event);}catch(error){try{context.deliverySheet.getRange(context.deliveryRowIndex,1,1,oldRow.length).setValues([oldRow]);}catch(rollbackError){throw new Error("GRADE_RECTIFICATION_AUDIT_ROLLBACK_FAILED");}throw error;}}
    if(p.rubricaEvaluacionJSON){const rubricaSheet=getOrCreateSheet(context.ss,"EvaluacionesRubricas");if(rubricaSheet.getLastRow()===0)rubricaSheet.appendRow(["ID","EntregaID","RubricaJSON","PuntajeCalculado","EvaluadoEn"]);rubricaSheet.appendRow(["EVAL-"+Date.now(),context.deliveryId,JSON.stringify(p.rubricaEvaluacionJSON),normalizedGrade,new Date()]);}
    return {status:"success",message:"Calificación con rúbrica registrada exitosamente.",rectificacionRegistrada:!!event};
  });
}

/**
 * Elimina un archivo de Drive (lo mueve a la papelera) (A-30).
 */
function deleteFile(payload) {
  const actorId = payload && payload._verifiedUserId;
  const role = payload && payload._verifiedRole;
  const fileId = extractTaskServiceFileId(payload && payload.fileId);
  if (!actorId || !fileId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Acceso denegado: se requiere identidad de estudiante.");

  // Serialize against submitAssignment so the file cannot be trashed after the
  // submission check but before the delivery/version record is persisted.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error("TASK_FILE_DELETE_LOCK_TIMEOUT");
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureTaskServiceFileMetadataSheet(ss);
    const rows = sheet.getDataRange().getValues();
    const idx = rows.findIndex((row, index) => index > 0 &&
      String(row[15] || "").trim() === fileId &&
      String(row[19] || "").trim() === String(actorId).trim() &&
      String(row[14] || "").trim().toLowerCase() === "activo");
    if (idx < 1) throw new Error("Acceso denegado: archivo sin metadatos de propiedad verificables.");
    const deliveries = getSheetOrThrow(ss, "Entregas").getDataRange().getValues().slice(1);
    const linkedToSubmission = deliveries.some(row => extractTaskServiceFileId(row[4]) === fileId);
    const versionsSheet = ss.getSheetByName("EntregasVersiones");
    let linkedToVersion = false;
    if (versionsSheet) {
      const versionData = versionsSheet.getDataRange().getValues();
      if (versionData.length > 1) {
        const versionHeaders = versionData[0].map(value => String(value || "").trim());
        const fileIndex = versionHeaders.indexOf("FileID") >= 0 ? versionHeaders.indexOf("FileID") : 6;
        const urlIndex = versionHeaders.indexOf("ArchivoUrl") >= 0 ? versionHeaders.indexOf("ArchivoUrl") : 5;
        linkedToVersion = versionData.slice(1).some(row =>
          [row[fileIndex], row[urlIndex]].some(value => extractTaskServiceFileId(value) === fileId)
        );
      }
    }
    if (linkedToSubmission || linkedToVersion) throw new Error("No se puede eliminar: el archivo está vinculado a una entrega o versión académica.");

    const file = DriveApp.getFileById(fileId);
    if (file.isTrashed()) throw new Error("No se puede eliminar: el archivo ya está en papelera.");
    file.setTrashed(true);
    try {
      sheet.getRange(idx + 1, 15).setValue("Eliminado");
    } catch (metadataError) {
      try {
        file.setTrashed(false);
      } catch (rollbackError) {
        throw new Error("DELETE_FILE_ROLLBACK_FAILED: " + metadataError.message + " | " + rollbackError.message);
      }
      throw new Error("DELETE_FILE_METADATA_UPDATE_FAILED: " + metadataError.message);
    }
    return { status: "success", message: "Archivo propio no entregado eliminado." };
  } finally {
    lock.releaseLock();
  }
}


var TASK_GRADE_RECTIFICATION_HEADERS_ = ["RectificacionID","TipoEntrega","EntregaID","RecursoID","EstudianteID","NotaAnterior","NotaNueva","Motivo","ActorID","RolActor","Fecha"];
function normalizeTaskGradeHistoryValue_(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : String(value).trim();
}
function getOrCreateTaskGradeRectificationHistorySheet_(ss) {
  const name = "HistorialRectificacionesEntregas";
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    try { sheet = ss.insertSheet(name); }
    catch (error) { sheet = ss.getSheetByName(name); if (!sheet) throw new Error("TASK_GRADE_RECTIFICATION_HISTORY_CREATE_FAILED"); }
  }
  if (sheet.getLastRow() === 0) sheet.appendRow(TASK_GRADE_RECTIFICATION_HEADERS_);
  const values = sheet.getDataRange().getValues();
  if (!values.length || !Array.isArray(values[0]) || values[0].length !== TASK_GRADE_RECTIFICATION_HEADERS_.length ||
      TASK_GRADE_RECTIFICATION_HEADERS_.some((header, index) => String(values[0][index] || "").trim() !== header)) {
    throw new Error("TASK_GRADE_RECTIFICATION_HISTORY_SCHEMA_INVALID");
  }
  return sheet;
}
function prepareTaskGradeRectificationEvent_(context, previousGrade, nextGrade, reason) {
  const previous = normalizeTaskGradeHistoryValue_(previousGrade);
  const next = normalizeTaskGradeHistoryValue_(nextGrade);
  if (previous === null || previous === next) return null;
  const reasonValue = typeof reason === "string" ? reason.trim() : "";
  if (!reasonValue) throw new Error("GRADE_RECTIFICATION_REASON_REQUIRED");
  if (reasonValue.length > 1000) throw new Error("GRADE_RECTIFICATION_REASON_INVALID");
  const actorId = String(context && context.actor && context.actor.userId || "").trim();
  const actorRole = String(context && context.actor && context.actor.role || "").trim();
  const deliveryId = String(context && context.deliveryId || "").trim();
  const taskId = String(context && context.taskId || "").trim();
  const studentId = String(context && context.studentId || "").trim();
  if (!actorId || !actorRole || !deliveryId || !taskId || !studentId || !context.ss) throw new Error("GRADE_RECTIFICATION_CONTEXT_INVALID");
  const sheet = getOrCreateTaskGradeRectificationHistorySheet_(context.ss);
  const rows = sheet.getDataRange().getValues();
  const rectificationId = "RECT-TASK-" + String(Utilities.getUuid() || "").trim();
  if (rectificationId === "RECT-TASK-" || rows.slice(1).some(row => String(row[0] || "").trim() === rectificationId)) throw new Error("TASK_GRADE_RECTIFICATION_ID_COLLISION");
  return {sheet:sheet,id:rectificationId,row:[rectificationId,"TAREA",deliveryId,taskId,studentId,
    previousGrade === null || previousGrade === undefined ? "" : String(previousGrade),
    nextGrade === null || nextGrade === undefined ? "" : String(nextGrade),reasonValue,actorId,actorRole,new Date()]};
}
function appendTaskGradeRectificationEvent_(event) {
  if (!event || !event.sheet || !Array.isArray(event.row)) throw new Error("TASK_GRADE_RECTIFICATION_EVENT_INVALID");
  try { event.sheet.appendRow(event.row); }
  catch (error) {
    const rows = event.sheet.getDataRange().getValues();
    const matches = rows.slice(1).filter(row => String(row[0] || "").trim() === event.id);
    if (matches.length === 1) return;
    throw new Error("TASK_GRADE_RECTIFICATION_AUDIT_WRITE_FAILED");
  }
  const rows = event.sheet.getDataRange().getValues();
  const matches = rows.slice(1).filter(row => String(row[0] || "").trim() === event.id);
  if (matches.length !== 1) throw new Error("TASK_GRADE_RECTIFICATION_AUDIT_WRITE_FAILED");
}
function withAuthorizedTaskSubmissionMutation_(payload, operation, mutation) {
  // doPost has already checked the action's role/session permission exactly once.
  const identity = getVerifiedTaskIdentity_(payload);
  if (!identity || identity.authorized !== true || !String(identity.userId || "").trim()) throw new Error("RESOURCE_NOT_FOUND");
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("TASK_SUBMISSION_MUTATION_LOCK_TIMEOUT");
  try {
    const access = getTaskServiceSubmissionAccess_(payload, operation || "GRADE", identity);
    if (!access || access.isStaff !== true || !access.ss || !Array.isArray(access.deliveries) ||
        !access.identity || String(access.identity.userId || "").trim() !== String(identity.userId).trim()) throw new Error("RESOURCE_NOT_FOUND");
    const deliveryId = String(payload && payload.entregaId || "").trim();
    const deliveryMatches = access.deliveries.map((row,index)=>({row:row,index:index})).filter(item=>String(item.row[0]||"").trim()===deliveryId);
    if (!deliveryId || deliveryMatches.length !== 1) throw new Error("RESOURCE_NOT_FOUND");
    const delivery = deliveryMatches[0].row;
    const taskId = String(delivery[1] || "").trim();
    const studentId = String(delivery[2] || "").trim();
    if (!taskId || !studentId || String(access.taskId || "").trim() !== taskId) throw new Error("RESOURCE_NOT_FOUND");
    const deliverySheet = getSheetOrThrow(access.ss,"Entregas");
    const headers = deliverySheet.getDataRange().getValues()[0] || [];
    const statusIndex = headers.findIndex(value => normalizeString(value) === "estado");
    const stateIndex = statusIndex >= 0 ? statusIndex : 6;
    if (normalizeString(delivery[stateIndex]) === "eliminada" && operation !== "DELETE_SUBMISSION") throw new Error("RESOURCE_NOT_FOUND");
    const taskRows = getSheetOrThrow(access.ss,"Tareas").getDataRange().getValues().slice(1);
    const taskMatches = taskRows.filter(row=>String(row[0]||"").trim()===taskId);
    if (taskMatches.length !== 1) throw new Error("RESOURCE_NOT_FOUND");
    return mutation({ss:access.ss,actor:access.identity,role:access.role,task:taskMatches[0],taskId:taskId,
      deliveryId:deliveryId,studentId:studentId,delivery:delivery,deliveryRowIndex:deliveryMatches[0].index+2,
      deliverySheet:deliverySheet});
  } finally { try { lock.releaseLock(); } catch (_) {} }
}
function gradeSubmission(payload) {
  return withAuthorizedTaskSubmissionMutation_(payload, "GRADE", context => {
    const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const headers = context.deliverySheet.getDataRange().getValues()[0] || [];
    const calificacionCol = headers.indexOf("calificacion");
    const estadoCol = headers.indexOf("estado");
    const comentarioCol = headers.indexOf("comentario");
    if (calificacionCol === -1 || estadoCol === -1 || comentarioCol === -1 ||
        headers.lastIndexOf("calificacion") !== calificacionCol || headers.lastIndexOf("estado") !== estadoCol ||
        headers.lastIndexOf("comentario") !== comentarioCol) throw new Error("TASK_GRADE_SCHEMA_INVALID");
    const rowData = context.delivery.slice();
    while (rowData.length < headers.length) rowData.push("");
    const oldRow = rowData.slice();
    const normalizedGrade = normalizeTaskGradeScore_(p.calificacion);
    const event = prepareTaskGradeRectificationEvent_(context,rowData[calificacionCol],normalizedGrade,p.motivoRectificacion);
    rowData[calificacionCol]=normalizedGrade; rowData[estadoCol]=p.estado; rowData[comentarioCol]=p.comentario;
    context.deliverySheet.getRange(context.deliveryRowIndex,1,1,rowData.length).setValues([rowData]);
    if (event) {
      try { appendTaskGradeRectificationEvent_(event); }
      catch (error) {
        try { context.deliverySheet.getRange(context.deliveryRowIndex,1,1,oldRow.length).setValues([oldRow]); }
        catch (rollbackError) { throw new Error("GRADE_RECTIFICATION_AUDIT_ROLLBACK_FAILED"); }
        throw error;
      }
    }
    return {status:"success",message:"Calificación actualizada.",rectificacionRegistrada:!!event};
  });
}

function deleteSubmission(payload) {
  return withAuthorizedTaskSubmissionMutation_(payload,"DELETE_SUBMISSION",context => {
    const sheet = context.deliverySheet;
    const data = sheet.getDataRange().getValues();
    const headers = (data[0] || []).slice();
    function findUniqueColumn(name) {
      const target = normalizeString(name), matches = [];
      headers.forEach((value,index)=>{if(normalizeString(value)===target)matches.push(index);});
      if (matches.length > 1) throw new Error("TASK_SUBMISSION_SCHEMA_INVALID");
      return matches.length ? matches[0] : -1;
    }
    const statusIndex = findUniqueColumn("Estado");
    if (statusIndex < 0) throw new Error("TASK_SUBMISSION_SCHEMA_INVALID");
    const rowData = context.delivery.slice();
    while (rowData.length < headers.length) rowData.push("");
    if (normalizeString(rowData[statusIndex]) === "eliminada") {
      return {status:"success",alreadyDeleted:true,message:"La entrega ya estaba eliminada; se conserva su historial."};
    }
    function ensureColumn(name) {
      let index = findUniqueColumn(name);
      if (index >= 0) return index;
      headers.push(name);
      return headers.length - 1;
    }
    const deletedByIndex = ensureColumn("EliminadaPor");
    const deletedRoleIndex = ensureColumn("EliminadaRol");
    const deletedAtIndex = ensureColumn("EliminadaEn");
    const reasonIndex = ensureColumn("MotivoEliminacion");
    if (headers.length !== data[0].length) sheet.getRange(1,1,1,headers.length).setValues([headers]);
    while (rowData.length < headers.length) rowData.push("");
    const deletedAt = new Date();
    rowData[statusIndex] = "Eliminada";
    rowData[deletedByIndex] = context.actor.userId;
    rowData[deletedRoleIndex] = context.actor.role;
    rowData[deletedAtIndex] = deletedAt;
    rowData[reasonIndex] = String(payload && payload.motivo || "").trim();
    sheet.getRange(context.deliveryRowIndex,1,1,headers.length).setValues([rowData]);
    return {status:"success",alreadyDeleted:false,message:"Entrega eliminada lógicamente; se conservaron archivo, versiones y comentarios.",
      data:{entregaId:context.deliveryId,estado:"Eliminada",eliminadaPor:context.actor.userId,eliminadaRol:context.actor.role,eliminadaEn:deletedAt.toISOString()}};
  });
}
function getTeacherActivity(payload) {
  const role = payload && payload._verifiedRole, actorId = payload && payload._verifiedUserId;
  const isAdmin = ["Administrador", "Desarrollador", "Dirección", "Secretaría"].indexOf(role) !== -1;
  if (!actorId || (!isAdmin && role !== "Profesor")) throw new Error("Identidad docente/administrativa verificada requerida.");
  const profesorId = isAdmin ? String((payload && payload.profesorId) || "").trim() : String(actorId).trim();
  const grado = isAdmin ? payload.grado : "", seccion = isAdmin ? payload.seccion : "";
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usuariosSheet = getSheetOrThrow(ss, "Usuarios");
  const tareasSheet = getSheetOrThrow(ss, "Tareas");
  const entregasSheet = getSheetOrThrow(ss, "Entregas");

  const usuariosData = usuariosSheet.getDataRange().getValues();
  const tareasData = tareasSheet.getDataRange().getValues();
  const entregasValues = entregasSheet.getDataRange().getValues();
  const teacherClassrooms = !isAdmin ? getTaskServiceAuthorizedClassrooms(payload) : null;
  const staffScope = getVerifiedTaskDepartmentScope_(payload, ss);
  if (!staffScope.authorized) throw new Error("Acceso denegado.");
  const entregasHeaders = entregasValues.shift();
  let fileIdIndex = entregasHeaders.indexOf("fileUrl");
  if (fileIdIndex === -1) {
      fileIdIndex = 4;
  }
  const mimeTypeIndex = entregasHeaders.indexOf("mimeType");

  const submissions = entregasValues.map(entrega => {
    // Uso de == para ser resiliente a tipos (string vs number)
    const tarea = tareasData.find(t => t[0] == entrega[1]);

    // SI LA TAREA NO EXISTE O NO PERTENECE AL PROFESOR -> DESCARTAR
    if (!tarea) return null;
    if (!isAdmin && !isTaskServiceTeacherTaskAuthorized_(tarea, teacherClassrooms, actorId)) return null;
    if (!assertTaskServiceResourceOwnership_(payload, "TAREA", tarea[0], "READ", ss, null, staffScope).authorized) return null;
    if (isAdmin && profesorId && String(tarea[10] || "").trim() !== profesorId) return null;

    const usuario = usuariosData.find(u => u[0] == entrega[2]);

    // Filtro por Grado y Sección del Profesor (si se especifican en el payload)
    if (usuario) {
      if (grado && !isInTeacherList(usuario[2], grado)) return null;
      if (seccion && !isInTeacherList(usuario[3], seccion)) return null;
    }

    return {
      tipo: 'Tarea',
      entregaId: entrega[0],
      titulo: tarea[2], // Tarea ya verificada arriba
      alumnoId: entrega[2], // Columna C: userId
      alumnoNombre: usuario ? usuario[1] : "Usuario Desconocido",
      email: usuario ? usuario[4] : "N/A",
      grado: usuario ? usuario[2] : "N/A",
      seccion: usuario ? usuario[3] : "N/A",
      asignatura: tarea[5] || "N/A",
      parcial: tarea[4] || "N/A",
      fecha: new Date(entrega[3]),
      fileId: entrega[fileIdIndex],
      mimeType: mimeTypeIndex > -1 ? entrega[mimeTypeIndex] : null,
      calificacion: entrega[5],
      estado: entrega[6],
      comentario: entrega[7]
    };
  }).filter(item => item !== null);

  submissions.sort((a, b) => b.fecha - a.fecha);
  const formattedActivity = submissions.map(item => ({ ...item, fecha: item.fecha.toISOString() }));
  return { status: "success", data: formattedActivity };
}

function getAllTasks(payload) {
  const role = payload && payload._verifiedRole, actorId = payload && payload._verifiedUserId;
  const isAdmin = ["Administrador", "Desarrollador", "Dirección", "Secretaría"].indexOf(role) !== -1;
  if (!actorId || (!isAdmin && role !== "Profesor")) throw new Error("Identidad docente/administrativa verificada requerida.");
  const profesorId = isAdmin ? String((payload && payload.profesorId) || "").trim() : String(actorId).trim();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tareasSheet = getSheetOrThrow(ss, "Tareas");
  const data = tareasSheet.getDataRange().getValues().slice(1);
  const teacherClassrooms = !isAdmin ? getTaskServiceAuthorizedClassrooms(payload) : null;
  const staffScope = getVerifiedTaskDepartmentScope_(payload, ss);
  if (!staffScope.authorized) throw new Error("Acceso denegado.");

  const filtered = data.filter(r => {
    if (!isAdmin && !isTaskServiceTeacherTaskAuthorized_(r, teacherClassrooms, actorId)) return false;
    if (!assertTaskServiceResourceOwnership_(payload, "TAREA", r[0], "READ", ss, null, staffScope).authorized) return false;
    if (isAdmin && profesorId && String(r[10] || "").trim() !== profesorId) return false;
    return true;
  });

  return {
    status: "success",
    data: filtered.map(r => ({
      tareaId: r[0],
      tipo: r[1],
      titulo: r[2],
      descripcion: r[3],
      parcial: r[4],
      asignatura: r[5],
      grado: r[6],
      seccion: r[7],
      fechaLimite: r[8] ? new Date(r[8]).toISOString() : null,
      tareaOriginalId: r[9],
      profesorId: r[10],
      estado: r[11] || 'Activa',
      puntaje: r[12] || 100,
      archivoUrl: r[13] || ''
    }))
  };
}

function normalizeString(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isInTeacherList(value, listString) {
  if (!listString || String(listString).trim() === "") return true;
  if (!value) return false;
  const sValue = normalizeString(value);
  const sList = normalizeString(listString);
  const list = sList.split(',').map(s => s.trim());
  return list.includes(sValue);
}

/**
 * Obtiene la carpeta raíz de un estudiante.
 */
function getStudentFolder(userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usuariosSheet = getSheetOrThrow(ss, "Usuarios");
  const userData = usuariosSheet.getDataRange().getValues().find(row => row[0] === userId);
  if (!userData) throw new Error("Usuario no encontrado.");
  const [, nombre, grado, seccion] = userData;

  const rootFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const sGrado = String(grado || "General");
  const sSeccion = String(seccion || "General");
  const sNombre = String(nombre || "Usuario");

  const gradoFolder = getOrCreateFolder(rootFolder, sGrado);
  const seccionFolder = getOrCreateFolder(gradoFolder, sSeccion);
  const alumnoFolder = getOrCreateFolder(seccionFolder, sNombre);
  return alumnoFolder;
}

function saveProject(payload) {
  const userId = payload && payload._verifiedUserId;
  const role = payload && payload._verifiedRole;
  const fileName = payload && payload.fileName, code = payload && payload.code, editor = payload && payload.editor;
  if (!userId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Acceso denegado: se requiere el estudiante autenticado.");
  if (!userId || !fileName) throw new Error("ID de usuario y nombre de archivo requeridos.");

  const alumnoFolder = getStudentFolder(userId);
  const projectsFolder = getOrCreateFolder(alumnoFolder, "Proyectos_PSeInt");

  let finalFileName = fileName;
  if (!finalFileName.toLowerCase().endsWith(".psc")) {
    finalFileName += ".psc";
  }

  const files = projectsFolder.getFilesByName(finalFileName);
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(code);
  } else {
    file = projectsFolder.createFile(finalFileName, code, "text/plain");
  }

  const fileId = file.getId();
  const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

  // Registrar en la hoja "pseudocode" (userId, NombreArchivo, archivoUrl, codigo, editor)
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pseudocodeSheet = getOrCreateSheet(ss, "pseudocode");
    const data = pseudocodeSheet.getDataRange().getValues();
    const rowIndex = data.findIndex(r => r[0] == userId && r[1] == finalFileName);

    if (rowIndex !== -1) {
      // Actualizar: A:userId, B:NombreArchivo, C:archivoUrl, D:codigo, E:editor
      pseudocodeSheet.getRange(rowIndex + 1, 3).setValue(fileUrl);
      pseudocodeSheet.getRange(rowIndex + 1, 4).setValue(code);
      pseudocodeSheet.getRange(rowIndex + 1, 5).setValue(editor || 'PseudocodeEditor');
    } else {
      // Insertar: A:userId, B:NombreArchivo, C:archivoUrl, D:codigo, E:editor
      pseudocodeSheet.appendRow([userId, finalFileName, fileUrl, code, editor || 'PseudocodeEditor']);
    }
  } catch (e) {
    logDebug("Error al registrar en hoja pseudocode:", e.message);
  }

  return { status: "success", message: "Proyecto guardado.", data: { fileId: fileId } };
}

function listProjects(payload) {
  const userId = payload && payload._verifiedUserId;
  const role = payload && payload._verifiedRole;
  if (!userId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Acceso denegado: solo el estudiante autenticado puede listar sus proyectos.");

  const result = [];
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pseudocodeSheet = getSheetOrThrow(ss, "pseudocode");
    const data = pseudocodeSheet.getDataRange().getValues().slice(1);

    data.forEach(r => {
      if (r[0] == userId) {
        // En este nuevo flujo, el id puede ser el NombreArchivo para búsqueda en hoja o el fileId real
        const fileIdMatch = (r[2] || "").match(/id=([^&]+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : r[1]; // Fallback al nombre si no hay URL
        result.push({
          name: r[1],
          id: fileId,
          lastUpdated: new Date().toISOString()
        });
      }
    });
  } catch (e) {
    logDebug("Error al listar proyectos desde hoja; se deniega sin fallback de Drive:", e.message);
    throw new Error("No se pudo verificar la propiedad de los proyectos. La consulta fue bloqueada.");
  }

  result.sort((a, b) => a.name.localeCompare(b.name));
  return { status: "success", data: result };
}

function deleteProject(payload) {
  const fileIdInput = String(payload && payload.fileId || "").trim();
  const requestedFileId = fileIdInput ? extractTaskServiceFileId(fileIdInput) : "";
  const requestedName = String(payload && payload.fileName || "").trim();
  const userId = String(payload && payload._verifiedUserId || "").trim();
  const role = payload && payload._verifiedRole;
  if (!userId || (role !== "Estudiante" && role !== "Alumno")) {
    throw new Error("Acceso denegado: solo el estudiante autenticado puede eliminar sus proyectos.");
  }
  if (!requestedFileId && !requestedName) throw new Error("Identificador de proyecto requerido.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const pseudocodeSheet = getSheetOrThrow(ss, "pseudocode");
  const data = pseudocodeSheet.getDataRange().getValues();
  const projectIndex = data.slice(1).findIndex(row => {
    if (String(row[0] || "").trim() !== userId) return false;
    const storedName = String(row[1] || "").trim();
    const storedFileId = extractTaskServiceFileId(row[2] || "");
    const matchesId = !!requestedFileId && (storedFileId === requestedFileId || storedName === requestedFileId);
    const matchesName = !!requestedName && storedName === requestedName;
    if (requestedFileId && requestedName) return matchesId && matchesName;
    return matchesId || matchesName;
  });
  if (projectIndex < 0) throw new Error("Acceso denegado: el proyecto no pertenece al estudiante autenticado o no coincide con los identificadores.");

  const row = data[projectIndex + 1];
  const storedFileId = extractTaskServiceFileId(row[2] || "");
  let file = null, fileWasTrashed = false;
  if (storedFileId) {
    file = DriveApp.getFileById(storedFileId);
    fileWasTrashed = file.isTrashed();
    if (!fileWasTrashed) file.setTrashed(true);
  }

  try {
    pseudocodeSheet.deleteRow(projectIndex + 2);
  } catch (sheetError) {
    if (file && !fileWasTrashed) {
      try {
        file.setTrashed(false);
      } catch (rollbackError) {
        throw new Error("DELETE_PROJECT_ROLLBACK_FAILED: " + sheetError.message + " | " + rollbackError.message);
      }
    }
    throw new Error("DELETE_PROJECT_METADATA_FAILED: " + sheetError.message);
  }

  return { status: "success", message: "Proyecto eliminado." };
}
function loadProject(payload) {
  const userId = payload && payload._verifiedUserId;
  const role = payload && payload._verifiedRole;
  const fileId = payload && payload.fileId;
  if (!userId || (role !== "Estudiante" && role !== "Alumno") || !fileId) throw new Error("Acceso denegado: se requiere identidad del propietario y proyecto.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = getSheetOrThrow(ss, "pseudocode").getDataRange().getValues();
  const row = data.slice(1).find(item => String(item[0]).trim() === String(userId).trim() &&
    (String(item[1]) === String(fileId) || extractTaskServiceFileId(item[2]) === extractTaskServiceFileId(fileId)));
  if (!row) throw new Error("Acceso denegado: el proyecto no pertenece al estudiante autenticado.");
  return { status:"success", data:{ name:row[1], code:row[3] } };
}
function getAllStudentProjects(payload) {
  const role = payload && payload._verifiedRole, userId = payload && payload._verifiedUserId;
  if (!userId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Solo el estudiante autenticado puede consultar sus proyectos.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getSheetOrThrow(ss, "pseudocode").getDataRange().getValues().slice(1);
  const projects = rows.filter(row => String(row[0]).trim() === String(userId).trim()).map(row => {
    const fileId = extractTaskServiceFileId(row[2] || "");
    let lastUpdated = null;
    try { if (fileId) lastUpdated = DriveApp.getFileById(fileId).getLastUpdated().toISOString(); } catch (_) {}
    return { alumnoNombre:getTaskServiceUserProfile(userId).nombre, projectName:row[1], fileId:fileId, lastUpdated:lastUpdated };
  });
  projects.sort((a,b)=>new Date(b.lastUpdated||0)-new Date(a.lastUpdated||0));
  return { status:"success", data:projects };
}

// [TAREA-06] [Fase 1 - Gestión Documental] - Módulo institucional de gestión de carpetas, identificadores estables y permisos documentales.
function getOrCreateFolder(parentFolder, folderName) {
  const name = String(folderName || "").trim() || "Sin Nombre";
  const lock = LockService.getScriptLock();
  try {
    lock.tryLock(15000);
    const folders = parentFolder.getFoldersByName(name);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parentFolder.createFolder(name);
  } catch (e) {
    const errorMsg = `Error de DriveApp en carpeta "${name}": ${e.message}`;
    logDebug(errorMsg);
    throw new Error(errorMsg);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// --- FUNCIONES AULA VIRTUAL Y CONTENIDOS (FASE 5) ---

function getVirtualClassrooms(payload) {
  const role = payload && payload._verifiedRole;
  const rows = getTaskServiceAuthorizedClassrooms(payload);
  const isAdmin = ["Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role) !== -1;
  const filtered = rows.filter(row => {
    if (isAdmin && payload.grado && normalizeString(row[3]) !== normalizeString(payload.grado)) return false;
    if (isAdmin && payload.seccion && row[4] && normalizeString(row[4]) !== normalizeString(payload.seccion)) return false;
    return true;
  }).map(row => ({
    aulaId:row[0],ofertaId:row[1],nombreClase:row[2],grado:row[3],seccion:row[4],asignatura:row[5],
    profesorId:row[6],estado:row[7]||"Activa",anioLectivo:row[8],periodo:row[9],creadoEn:row[10]?new Date(row[10]).toISOString():null
  }));
  return { status:"success", data:filtered };
}
function createVirtualClassroom(payload) {
 const actor=getVerifiedTaskIdentity_(payload);
 if(!actor||!actor.authorized)throw new Error("Acceso denegado.");
 const role=actor.role,uid=String(actor.userId||"").trim();
 const {ofertaId,nombreClase,grado,seccion,asignatura,anioLectivo,periodo}=payload||{};
 if(!uid||(role!=="Profesor"&&!isTaskServiceAdministrativeRole(role)))throw new Error("Acceso denegado.");
 if(!ofertaId||!grado||!asignatura)throw new Error("Oferta, grado y asignatura obligatorios.");

 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 const scope=getVerifiedTaskDepartmentScope_(payload,ss,actor);
 if(!scope||!scope.authorized)throw new Error(scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED");
 const department=resolveTaskServiceOwnershipDepartment_(payload,scope);
 if(!department||!department.authorized)throw new Error(department&&department.code||"RESOURCE_DEPARTMENT_UNRESOLVED");

 let teacher=uid;
 if(role!=="Profesor"){
  teacher=String(payload.profesorId||"").trim();
  if(!teacher)throw new Error("Profesor requerido.");
  const teacherScope=getVerifiedTaskDepartmentScope_(payload,ss,{authorized:true,userId:teacher,role:"Profesor"});
  if(!teacherScope||!teacherScope.authorized||
    (teacherScope.institutionWide!==true&&(teacherScope.departmentIds||[]).map(String).indexOf(department.departmentId)===-1))
   throw new Error("El profesor no tiene asignación activa en el departamento seleccionado.");
 }
 assertTaskServiceTeacherAssignedToOffer(teacher,ofertaId,{grade:grado,section:seccion,subject:asignatura});

 const sh=getOrCreateSheet(ss,"AulasVirtuales");
 if(sh.getLastRow()===0)sh.appendRow(["AulaID","OfertaID","NombreClase","Grado","Seccion","Asignatura","ProfesorID","Estado","AnioLectivo","Periodo","CreadoEn"]);
 const dup=sh.getDataRange().getValues().slice(1).some(r=>
  String(r[1]).trim()===String(ofertaId).trim()&&normalizeString(r[3])===normalizeString(grado)&&
  normalizeString(r[4])===normalizeString(seccion||"A")&&normalizeString(r[5])===normalizeString(asignatura));
 if(dup)throw new Error("Aula duplicada para oferta y ámbito.");

 const id="AULA-"+Utilities.getUuid(),now=new Date(),name=nombreClase||`${asignatura} - ${grado} ${seccion||"A"}`;
 const rowIndex=sh.getLastRow()+1;
 sh.appendRow([id,ofertaId,name,grado,seccion||"A",asignatura,teacher,"Activa",anioLectivo||now.getFullYear(),periodo||"I parcial",now]);
 const registered=registerTaskServiceResourceOwnership_(scope,"AULA_VIRTUAL",id,department.departmentId,ss);
 if(!registered||!registered.authorized){
  try{sh.deleteRow(rowIndex);}catch(_){throw new Error("RESOURCE_OWNERSHIP_ROLLBACK_FAILED");}
  throw new Error(registered&&registered.code||"RESOURCE_OWNERSHIP_WRITE_FAILED");
 }
 return {status:"success",message:"Aula virtual creada.",data:{aulaId:id,nombreClase:name}};
}
function getPosts(payload) {
  const role = payload && payload._verifiedRole;
  const isTeacherOrAdmin = ["Profesor","Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role) !== -1;
  const allowedRows = getTaskServiceAuthorizedClassrooms(payload);
  const allowedIds = new Set(allowedRows.map(row => String(row[0]).trim()));
  const { aulaId, asignatura, includeDrafts } = payload || {};
  const data = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios").getDataRange().getValues();
  if (data.length <= 1) return { status:"success", data:[] };
  const now = Date.now();
  const posts = data.slice(1).filter(row => {
    const postState = normalizeString(row[12] || "");
    if (postState === "eliminado") return false;
    const classId = String(row[1] || "").trim();
    if (classId !== "General" && !allowedIds.has(classId)) return false;
    if (aulaId && classId !== String(aulaId).trim()) return false;
    const isDraft = row[7] === true || String(row[7] || "").trim().toLowerCase() === "true";
    if (isDraft && (!includeDrafts || !isTeacherOrAdmin)) return false;
    if (!isTeacherOrAdmin && (isDraft || postState !== "publicado")) return false;
    if (row[8] && new Date(row[8]).getTime() > now && !isTeacherOrAdmin) return false;
    if (!isTeacherOrAdmin && !isTaskServiceAudienceAllowed(row[11],role)) return false;
    if (asignatura && String(row[4] || "") !== String(asignatura)) return false;
    return true;
  }).map(row => ({
    postId:row[0],aulaId:row[1],titulo:row[2],contenido:row[3],categoria:row[4]||"Anuncio",autorId:row[5],
    esFijado:row[6]===true||String(row[6]).toLowerCase()==="true",esBorrador:row[7]===true||String(row[7]).toLowerCase()==="true",
    fechaProgramada:row[8]?new Date(row[8]).toISOString():null,fechaPublicacion:row[9]?new Date(row[9]).toISOString():null,
    adjuntos:row[10]?(typeof row[10]==="string"?JSON.parse(row[10]):row[10]):[],audiencia:row[11]||"Todos",estado:row[12]||"Publicado"
  })).sort((a,b)=>a.esFijado!==b.esFijado?(a.esFijado?-1:1):new Date(b.fechaPublicacion||0)-new Date(a.fechaPublicacion||0));
  return { status:"success", data:posts };
}
function createPost(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,{aulaId,titulo,contenido,categoria,esFijado,esBorrador,fechaProgramada,adjuntos,audiencia}=payload||{},classId=aulaId||"General";
 if(!uid||!titulo||!contenido)throw new Error("Identidad, título y contenido obligatorios.");if(role==="Profesor"||isTaskServiceAdministrativeRole(role))assertTaskServiceClassroomAccess(payload,classId);else throw new Error("Acceso denegado.");
 if(classId==="General"&&!isTaskServiceAdministrativeRole(role))throw new Error("Solo administración puede publicar en General.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios");if(sh.getLastRow()===0)sh.appendRow(["ID","AulaID","Titulo","Contenido","Categoria","AutorID","EsFijado","EsBorrador","FechaProgramada","FechaPublicacion","AdjuntosJSON","Audiencia","Estado"]);
 const id="POST-"+Utilities.getUuid(),now=new Date();sh.appendRow([id,classId,titulo,contenido,categoria||"Anuncio",uid,!!esFijado,!!esBorrador,fechaProgramada||"",now,JSON.stringify(adjuntos||[]),audiencia||"Todos",esBorrador?"Borrador":"Publicado"]);return {status:"success",message:"Publicación creada.",data:{postId:id}};
}
function updatePost(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,id=payload&&payload.postId;if(!uid||!id)throw new Error("Identidad y postId requeridos.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Publicación no encontrada.");const row=data[i];
 if(!isTaskServiceAdministrativeRole(role)&&(role!=="Profesor"||String(row[5]).trim()!==String(uid).trim()))throw new Error("La publicación no pertenece al docente.");assertTaskServiceClassroomAccess(payload,row[1]);
 [["titulo",2],["contenido",3],["categoria",4]].forEach(([k,col])=>{if(payload[k]!==undefined)row[col]=payload[k];});if(payload.esFijado!==undefined)row[6]=!!payload.esFijado;if(payload.esBorrador!==undefined){row[7]=!!payload.esBorrador;row[12]=payload.esBorrador?"Borrador":"Publicado";}if(payload.adjuntos!==undefined)row[10]=JSON.stringify(payload.adjuntos);
 sh.getRange(i+1,1,1,row.length).setValues([row]);return {status:"success",message:"Publicación actualizada."};
}
function deletePost(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,id=payload&&payload.postId;if(!uid||!id)throw new Error("Identidad y postId requeridos.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Publicación no encontrada.");const row=data[i];
 if(!isTaskServiceAdministrativeRole(role)&&(role!=="Profesor"||String(row[5]).trim()!==String(uid).trim()))throw new Error("La publicación no pertenece al docente.");
 assertTaskServiceClassroomAccess(payload,row[1]);
 sh.getRange(i+1,13).setValue("Eliminado");return {status:"success",message:"Publicación eliminada."};
}
function getStudyMaterials(payload) {
  const role = payload && payload._verifiedRole;
  const allowedRows = getTaskServiceAuthorizedClassrooms(payload);
  const allowedIds = new Set(allowedRows.map(row => String(row[0] || "").trim()));
  const isStaff = ["Profesor","Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role) !== -1;
  const { aulaId,parcial,unidad,tema } = payload || {};
  const data = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"MaterialesEducativos").getDataRange().getValues();
  if (data.length <= 1) return {status:"success",data:[]};
  const materials = data.slice(1).filter(row => {
    const state = normalizeString(row[12] || "");
    if (state === "eliminado") return false;
    const classId = String(row[1] || "").trim();
    if (classId !== "General" && !allowedIds.has(classId)) return false;
    if (aulaId && classId !== String(aulaId).trim()) return false;
    if (!isStaff && ["activo","publicado"].indexOf(state) === -1) return false;
    if (!isStaff && row[11]) {
      const publicationTime = new Date(row[11]).getTime();
      if (!Number.isFinite(publicationTime) || publicationTime > Date.now()) return false;
    }
    if (parcial && normalizeString(row[5]) !== normalizeString(parcial)) return false;
    if (unidad && normalizeString(row[6]) !== normalizeString(unidad)) return false;
    if (tema && normalizeString(row[7]) !== normalizeString(tema)) return false;
    return true;
  }).map(row => ({
    materialId:row[0],aulaId:row[1],titulo:row[2],descripcion:row[3],tipoRecurso:row[4] || "Documento",
    parcial:row[5],unidad:row[6],tema:row[7],archivoUrl:row[8],driveId:row[9],autorId:row[10],
    fechaPublicacion:row[11] ? new Date(row[11]).toISOString() : null,estado:row[12] || "Activo"
  }));
  return {status:"success",data:materials};
}
// RBAC is validated by doPost; only the teacher's active classroom assignment or an administrative role may publish.
function createStudyMaterial(payload) {
  const request = payload || {};
  const identity = getVerifiedTaskIdentity_(request);
  const userId = String(identity && identity.userId || "").trim();
  const role = String(identity && identity.role || "");
  const { aulaId,titulo,descripcion,tipoRecurso,parcial,unidad,tema,archivoUrl,driveId } = request;
  if (!identity || identity.authorized !== true || !userId || !titulo || !archivoUrl) {
    throw new Error("Identidad, título y archivo obligatorios.");
  }
  if (role !== "Profesor" && !isTaskServiceAdministrativeRole(role)) throw new Error("Acceso denegado.");
  const classId = String(aulaId || "General").trim();
  assertTaskServiceClassroomAccess(request,classId,identity);
  const sheet = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"MaterialesEducativos");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID","AulaID","Titulo","Descripcion","TipoRecurso","Parcial","Unidad","Tema","ArchivoUrl","DriveId","AutorID","FechaPublicacion","Estado"]);
  }
  const id = "MAT-" + Utilities.getUuid();
  const now = new Date();
  sheet.appendRow([id,classId,titulo,descripcion || "",tipoRecurso || "Documento",parcial || "I parcial",
    unidad || "Unidad 1",tema || "Tema General",archivoUrl,driveId || "",userId,now,"Activo"]);
  return {status:"success",message:"Material educativo publicado.",data:{materialId:id}};
}
function deleteStudyMaterial(payload) {
  const request = payload || {};
  const identity = getVerifiedTaskIdentity_(request);
  const userId = String(identity && identity.userId || "").trim();
  const role = String(identity && identity.role || "");
  const materialId = String(request.materialId || "").trim();
  if (!identity || identity.authorized !== true || !userId || !materialId) {
    throw new Error("Identidad y materialId requeridos.");
  }
  const sheet = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"MaterialesEducativos");
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex(row => String(row[0] || "").trim() === materialId);
  if (index < 1) throw new Error("Material no encontrado.");
  const row = rows[index];
  if (!isTaskServiceAdministrativeRole(role) &&
      (role !== "Profesor" || String(row[10] || "").trim() !== userId)) {
    throw new Error("El material no pertenece al docente.");
  }
  assertTaskServiceClassroomAccess(request,String(row[1] || "").trim(),identity);
  sheet.getRange(index + 1,13).setValue("Eliminado");
  return {status:"success",message:"Material eliminado."};
}
function returnSubmissionForRevision(payload) {
  const request = payload || {};
  const message = String(request.comentario || "").trim();
  return withAuthorizedTaskSubmissionMutation_(request, "RETURN_FOR_REVISION", context => {
    const headers = context.deliverySheet.getDataRange().getValues()[0] || [];
    const statusColumns = [], commentColumns = [];
    headers.forEach((value,index) => {
      const name = normalizeString(value);
      if (name === "estado") statusColumns.push(index);
      if (name === "comentario") commentColumns.push(index);
    });
    if (statusColumns.length !== 1 || commentColumns.length !== 1) throw new Error("TASK_SUBMISSION_SCHEMA_INVALID");
    const rowData = context.delivery.slice();
    while (rowData.length < headers.length) rowData.push("");
    const oldRow = rowData.slice();
    rowData[statusColumns[0]] = "DevueltaCorrección";
    if (message) rowData[commentColumns[0]] = message;
    context.deliverySheet.getRange(context.deliveryRowIndex,1,1,rowData.length).setValues([rowData]);
    if (message) {
      try {
        const commentsSheet = getOrCreateSheet(context.ss,"ComentariosEntregas");
        if (commentsSheet.getLastRow() === 0) {
          commentsSheet.appendRow(["ID","EntregaID","TareaID","AutorID","RolAutor","Mensaje","EsPrivado","FechaCreacion"]);
        }
        commentsSheet.appendRow(["COM-" + Utilities.getUuid(),context.deliveryId,context.taskId,
          context.actor.userId,context.actor.role,message,true,new Date()]);
      } catch (error) {
        try { context.deliverySheet.getRange(context.deliveryRowIndex,1,1,oldRow.length).setValues([oldRow]); }
        catch (rollbackError) { throw new Error("TASK_SUBMISSION_RETURN_ROLLBACK_FAILED"); }
        throw error;
      }
    }
    return {status:"success",message:"Tarea devuelta para corrección al estudiante.",comentarioRegistrado:!!message};
  });
}
function getSubmissionComments(payload) {
  const context = getTaskServiceSubmissionAccess_(payload, "READ_HISTORY");
  const sheet = getOrCreateSheet(context.ss, "ComentariosEntregas");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };
  const deliveryId = context.delivery ? String(context.delivery[0] || "").trim() : "";
  const comments = data.slice(1).filter(row => {
    if (deliveryId) {
      if (String(row[1] || "").trim() !== deliveryId) return false;
    } else if (String(row[2] || "").trim() !== context.taskId) {
      return false;
    }
    const isPrivate = row[6] === true || String(row[6]).toLowerCase() === "true";
    return context.isStaff || !isPrivate;
  }).map(row => ({
    comentarioId: row[0],
    entregaId: row[1],
    tareaId: row[2],
    autorId: row[3],
    rolAutor: row[4] || "Usuario",
    mensaje: row[5],
    esPrivado: row[6] === true || String(row[6]).toLowerCase() === "true",
    fechaCreacion: row[7] ? new Date(row[7]).toISOString() : null
  }));
  return { status: "success", data: comments };
}

function addSubmissionComment(payload) {
  const mensaje = String(payload && payload.mensaje || "").trim();
  if (!mensaje) throw new Error("Mensaje de comentario es requerido.");
  const context = getTaskServiceSubmissionAccess_(payload, "COMMENT");
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("TASK_SUBMISSION_COMMENT_LOCK_TIMEOUT");
  try {
    const sheet = getOrCreateSheet(context.ss, "ComentariosEntregas");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "EntregaID", "TareaID", "AutorID", "RolAutor", "Mensaje", "EsPrivado", "FechaCreacion"]);
    }
    const comId = "COM-" + Utilities.getUuid();
    const now = new Date();
    // La identidad y el rol del autor siempre proceden de la sesión firmada.
    // Los comentarios de estudiantes son visibles para el personal; solo el personal puede crear notas privadas.
    const esPrivado = context.isStaff && payload.esPrivado !== false;
    sheet.appendRow([
      comId,
      context.delivery ? String(context.delivery[0] || "").trim() : "",
      context.taskId,
      context.identity.userId,
      context.identity.role,
      mensaje,
      esPrivado,
      now
    ]);
    return { status: "success", message: "Comentario publicado.", data: { comentarioId: comId } };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getSubmissionVersions(payload) {
  const context = getTaskServiceSubmissionAccess_(payload, "READ_HISTORY");
  const requestedUserId = String(payload && payload.userId || "").trim();
  if (!context.isStaff && requestedUserId && requestedUserId !== context.studentId) {
    throw new Error("RESOURCE_NOT_FOUND");
  }
  if (context.isStaff && requestedUserId) {
    const targetExists = context.deliveries.some(row =>
      String(row[1] || "").trim() === context.taskId &&
      String(row[2] || "").trim() === requestedUserId
    );
    if (!targetExists) throw new Error("RESOURCE_NOT_FOUND");
  }
  const sheet = getOrCreateSheet(context.ss, "EntregasVersiones");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };
  const deliveryId = context.delivery ? String(context.delivery[0] || "").trim() : "";
  const versions = data.slice(1).filter(row => {
    if (deliveryId) return String(row[1] || "").trim() === deliveryId;
    return String(row[2] || "").trim() === context.taskId &&
      (!requestedUserId || String(row[3] || "").trim() === requestedUserId);
  }).map(row => ({
    versionId: row[0], entregaId: row[1], tareaId: row[2], userId: row[3], versionNum: row[4],
    fileId: row[6], mimeType: row[7], textoRespuesta: row[8], enlaceExterno: row[9],
    fechaEnvio: row[10] ? new Date(row[10]).toISOString() : null, estado: row[11], observaciones: row[12]
  }));
  return { status: "success", data: versions };
}
function initiateResumableUpload(payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole,tareaId=String(payload&&payload.tareaId||"").trim();
  const fileName=String(payload&&payload.fileName||"").trim(),fileSize=Number(payload&&payload.fileSize),totalChunks=Number(payload&&payload.totalChunks);
  if(!actorId||(role!=="Estudiante"&&role!=="Alumno")||!tareaId||!fileName||!Number.isFinite(fileSize)||fileSize<=0||fileSize>50*1024*1024||!Number.isInteger(totalChunks)||totalChunks<1||totalChunks>100)throw new Error("Parámetros o identidad de carga no válidos.");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),task=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===tareaId);
  assertTaskServiceStudentCanAccessTask(ss,actorId,task);
  const sheet=getOrCreateSheet(ss,"SesionesCargaResumible");
  if(sheet.getLastRow()===0)sheet.appendRow(["SessionKey","UserId","FileName","FileSize","TotalChunks","ConfirmedChunks","Status","FolderId","OldSessionKey","CreatedFilesJson","CreatedAt","UpdatedAt","TareaID","FinalFileID","OwnerRole","FileHash","MimeType"]);
  else{if(!sheet.getRange(1,13).getValue())sheet.getRange(1,13).setValue("TareaID");if(!sheet.getRange(1,14).getValue())sheet.getRange(1,14).setValue("FinalFileID");if(!sheet.getRange(1,15).getValue())sheet.getRange(1,15).setValue("OwnerRole");if(!sheet.getRange(1,16).getValue())sheet.getRange(1,16).setValue("FileHash");if(!sheet.getRange(1,17).getValue())sheet.getRange(1,17).setValue("MimeType");}
  const rows=sheet.getDataRange().getValues(),hash=String(payload.fileHash||"");
  const valid=row=>String(row[1]).trim()===String(actorId).trim()&&String(row[12]||"").trim()===tareaId&&String(row[2])===fileName&&Number(row[3])===fileSize&&Number(row[4])===totalChunks&&(!hash||String(row[15]||"")===hash);
  if(payload.resumeSessionKey){const found=findTaskServiceUploadSession(sheet,payload.resumeSessionKey);if(!found)throw new Error("Sesión anterior no encontrada; inicie una nueva carga.");if(String(found.row[1]).trim()!==String(actorId).trim())throw new Error("Acceso denegado: sesión de carga ajena.");if(!valid(found.row)){if(!found.row[12]){sheet.getRange(found.rowIndex,7).setValue("LEGACY_UNBOUND");if(found.row[7]){try{DriveApp.getFolderById(found.row[7]).setTrashed(true);}catch(_){}}}throw new Error("La sesión anterior no está vinculada a esta tarea; inicie una nueva carga.");}
    if(found.row[6]==="COMPLETED")return {status:"success",sessionKey:found.row[0],confirmedChunks:JSON.parse(found.row[5]||"[]"),totalChunks:Number(found.row[4]),folderId:found.row[7],fileId:found.row[13],isCompleted:true,isResume:true};
    if(found.row[6]!=="ACTIVE")throw new Error("La sesión no está activa.");
    const resumeConfirmed=JSON.parse(found.row[5]||"[]");
    if(resumeConfirmed.length===Number(found.row[4])){const result=reconstructFileParts({_verifiedUserId:actorId,_verifiedRole:role,sessionKey:found.row[0]});if(result.status!=="success")throw new Error(result.message||"No se pudo completar la carga.");return {status:"success",sessionKey:found.row[0],confirmedChunks:resumeConfirmed,totalChunks:Number(found.row[4]),folderId:found.row[7],fileId:result.fileId,isCompleted:true,isResume:true};}
    return {status:"success",sessionKey:found.row[0],confirmedChunks:resumeConfirmed,totalChunks:Number(found.row[4]),folderId:found.row[7],isResume:true};}
  let oldSessionKey="";
  if(payload.replaceSessionKey){const old=findTaskServiceUploadSession(sheet,payload.replaceSessionKey);if(!old||!valid(old.row)||old.row[6]!=="ACTIVE")throw new Error("No se puede reemplazar una sesión ajena o inactiva.");oldSessionKey=String(old.row[0]);sheet.getRange(old.rowIndex,7).setValue("REPLACED_PENDING_CLEANUP");sheet.getRange(old.rowIndex,12).setValue(new Date().toISOString());}
  const active=rows.slice(1).find(r=>r[6]==="ACTIVE"&&valid(r));if(active){const confirmed=JSON.parse(active[5]||"[]");if(confirmed.length===Number(active[4])){const result=reconstructFileParts({_verifiedUserId:actorId,_verifiedRole:role,sessionKey:active[0]});if(result.status!=="success")throw new Error(result.message||"No se pudo completar la carga.");return {status:"success",sessionKey:active[0],confirmedChunks:confirmed,totalChunks:Number(active[4]),folderId:active[7],fileId:result.fileId,isCompleted:true,isResume:true};}return {status:"success",sessionKey:active[0],confirmedChunks:confirmed,totalChunks:Number(active[4]),folderId:active[7],isResume:true};}
  const sessionKey="SESS_"+Utilities.getUuid(),root=getOrCreateFolder(DriveApp.getFolderById(DRIVE_FOLDER_ID),".temp_resumable_uploads"),folder=getOrCreateFolder(root,sessionKey),now=new Date().toISOString();
  sheet.appendRow([sessionKey,actorId,fileName,fileSize,totalChunks,"[]","ACTIVE",folder.getId(),oldSessionKey,"[]",now,now,tareaId,"",role,hash,String(payload.mimeType||"application/octet-stream")]);
  return {status:"success",sessionKey,confirmedChunks:[],totalChunks,folderId:folder.getId(),isResume:false};
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
      service: "TASK",
      eventType: eventType,
      targetUserId: targetUserId || null,
      targetRole: targetRole || null,
      message: "Cachés de seguridad purgadas en el microservicio TASK.",
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    console.error("Error al purgar cachés de seguridad en TASK: ", e);
    return {
      status: "error",
      service: "TASK",
      message: "Error al purgar cachés: " + e.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

function uploadChunk(payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole,sessionKey=payload&&payload.sessionKey;
  const chunkIndex=Number(payload&&payload.chunkIndex),chunkData=payload&&payload.chunkData;
  if(!sessionKey||!Number.isInteger(chunkIndex)||!chunkData)throw new Error("Fragmento de carga incompleto.");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=getOrCreateSheet(ss,"SesionesCargaResumible"),session=findTaskServiceUploadSession(sheet,sessionKey);
  assertTaskServiceUploadSessionOwner(session,payload);
  if(session.row[6]==="COMPLETED"&&session.row[13])return {status:"success",sessionKey,chunkIndex,confirmedChunks:JSON.parse(session.row[5]||"[]"),sessionCompleted:true,fileId:session.row[13],folderId:session.row[7]};
  if(session.row[6]!=="ACTIVE")throw new Error("La sesión no está activa.");
  const total=Number(session.row[4]);if(Number(payload.totalChunks)!==total||chunkIndex<0||chunkIndex>=total)throw new Error("Índice o cantidad de fragmentos no coincide con la sesión.");
  if(String(chunkData).length>8*1024*1024)throw new Error("Fragmento supera el tamaño permitido.");
  let created=[];try{created=JSON.parse(session.row[9]||"[]");}catch(_){}
  const prior=created.find(x=>Number(x.chunkIndex)===chunkIndex);
  if(!prior){const clean=String(chunkData).replace(/-/g,"+").replace(/_/g,"/").replace(/\s/g,""),bytes=Utilities.base64Decode(clean);
    const folder=DriveApp.getFolderById(session.row[7]),file=folder.createFile(Utilities.newBlob(bytes,"application/octet-stream","chunk_"+chunkIndex));
    created.push({chunkIndex,fileId:file.getId()});created.sort((a,b)=>a.chunkIndex-b.chunkIndex);
    sheet.getRange(session.rowIndex,10).setValue(JSON.stringify(created));sheet.getRange(session.rowIndex,6).setValue(JSON.stringify(created.map(x=>Number(x.chunkIndex))));sheet.getRange(session.rowIndex,12).setValue(new Date().toISOString());}
  const confirmed=created.map(x=>Number(x.chunkIndex));
  if(confirmed.length===total){const result=reconstructFileParts({_verifiedUserId:actorId,_verifiedRole:role,sessionKey});if(result.status!=="success")throw new Error(result.message||"No se pudo ensamblar la carga.");
    return {status:"success",sessionKey,chunkIndex,confirmedChunks:confirmed,sessionCompleted:true,fileId:result.fileId,fileUrl:result.fileUrl,folderId:session.row[7]};}
  return {status:"success",sessionKey,chunkIndex,confirmedChunks:confirmed,sessionCompleted:false};
}

function getUploadProgress(payload) {
  const sheet=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"SesionesCargaResumible"),session=findTaskServiceUploadSession(sheet,payload&&payload.sessionKey);
  if(!session)throw new Error("Sesión no encontrada.");assertTaskServiceUploadSessionOwner(session,payload);
  return {status:"success",sessionKey:session.row[0],confirmedChunks:JSON.parse(session.row[5]||"[]"),totalChunks:Number(session.row[4]),isCompleted:session.row[6]==="COMPLETED",folderId:session.row[7],fileId:session.row[13]||""};
}

function cancelUploadSession(payload) {
  const sheet=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"SesionesCargaResumible"),session=findTaskServiceUploadSession(sheet,payload&&payload.sessionKey);
  if(!session)throw new Error("Sesión no encontrada.");assertTaskServiceUploadSessionOwner(session,payload);
  if(session.row[6]==="COMPLETED")throw new Error("No se puede cancelar una sesión completada.");
  if(session.row[6]==="CANCELLED")return {status:"success",message:"La sesión ya estaba cancelada."};
  sheet.getRange(session.rowIndex,7).setValue("CANCELLED");sheet.getRange(session.rowIndex,12).setValue(new Date().toISOString());
  if(session.row[7])DriveApp.getFolderById(session.row[7]).setTrashed(true);
  return {status:"success",message:"Sesión de carga cancelada."};
}

function reconstructFileParts(payload) {
  const actorId=payload&&payload._verifiedUserId,sessionKey=payload&&payload.sessionKey;
  if(!actorId||!sessionKey)throw new Error("Sesión e identidad verificada son obligatorias.");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=getOrCreateSheet(ss,"SesionesCargaResumible"),session=findTaskServiceUploadSession(sheet,sessionKey);
  assertTaskServiceUploadSessionOwner(session,payload);
  if(session.row[6]==="COMPLETED"&&session.row[13]){const existing=DriveApp.getFileById(session.row[13]);return {status:"success",fileId:existing.getId(),fileUrl:existing.getUrl(),fileName:existing.getName(),sizeBytes:existing.getSize()};}
  if(session.row[6]!=="ACTIVE")throw new Error("La sesión no está activa.");
  const total=Number(session.row[4]),parts=JSON.parse(session.row[9]||"[]").sort((a,b)=>Number(a.chunkIndex)-Number(b.chunkIndex));
  if(parts.length!==total||parts.some((p,i)=>Number(p.chunkIndex)!==i))throw new Error("La carga está incompleta o contiene fragmentos inconsistentes.");
  const files=parts.map(p=>DriveApp.getFileById(p.fileId)),arrays=files.map(f=>f.getBlob().getBytes()),size=arrays.reduce((n,b)=>n+b.length,0),bytes=new Int8Array(size);let offset=0;
  arrays.forEach(b=>{bytes.set(b,offset);offset+=b.length;});
  const taskId=String(session.row[12]||""),task=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===taskId);
  assertTaskServiceStudentCanAccessTask(ss,actorId,task);
  const mime=String(session.row[16]||"application/octet-stream");
  const folder=DriveApp.getFolderById(session.row[7]),file=folder.createFile(Utilities.newBlob(bytes,mime,String(session.row[2]||"archivo")));
  try{logFileMetadata(ss,{fileName:file.getName(),fileId:file.getId(),fileUrl:file.getUrl(),mimeType:mime,sizeBytes:size,tareaId:taskId,
    asignatura:String(task[5]||"General"),parcial:String(task[4]||"General"),grado:String(task[6]||"General"),seccion:String(task[7]||"General"),
    profesorId:String(task[10]||""),ownerUserId:actorId,folderId:folder.getId()});}catch(metaError){try{file.setTrashed(true);}catch(_){}throw new Error("No se pudo registrar la propiedad del archivo ensamblado.");}
  sheet.getRange(session.rowIndex,7).setValue("COMPLETED");sheet.getRange(session.rowIndex,12).setValue(new Date().toISOString());sheet.getRange(session.rowIndex,14).setValue(file.getId());
  files.forEach(f=>{try{f.setTrashed(true);}catch(_){}});
  const oldKey=String(session.row[8]||"");if(oldKey){const old=findTaskServiceUploadSession(sheet,oldKey);if(old&&old.row[7]){try{DriveApp.getFolderById(old.row[7]).setTrashed(true);sheet.getRange(old.rowIndex,7).setValue("REPLACED_CLEANED");}catch(_){}}}
  return {status:"success",fileId:file.getId(),fileUrl:file.getUrl(),fileName:file.getName(),mimeType:mime,sizeBytes:size};
}

function readLegacyDocument(payload) {
  try {
    const identity=getVerifiedTaskIdentity_(payload);
    if(!identity||!identity.authorized)throw new Error("RESOURCE_NOT_FOUND");
    const requestedFileId=extractTaskServiceFileId(payload&&(payload.fileId||payload.fileUrl));
    if(!requestedFileId)throw new Error("RESOURCE_NOT_FOUND");
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
    const metadataSheet=ss.getSheetByName("MetadatosArchivos");
    if(!metadataSheet)throw new Error("RESOURCE_NOT_FOUND");
    const metadataRows=metadataSheet.getDataRange().getValues().slice(1);
    const matches=metadataRows.filter(row=>extractTaskServiceFileId(row[15])===requestedFileId&&
      String(row[14]||"").trim().toLowerCase()==="activo");
    if(matches.length!==1)throw new Error("RESOURCE_NOT_FOUND");
    const metadata=matches[0],taskId=String(metadata[11]||"").trim(),ownerId=String(metadata[19]||"").trim();
    if(!taskId||!ownerId)throw new Error("RESOURCE_NOT_FOUND");
    const taskMatches=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1)
      .filter(row=>String(row[0]||"").trim()===taskId);
    if(taskMatches.length!==1)throw new Error("RESOURCE_NOT_FOUND");
    const task=taskMatches[0];
    if(identity.role==="Profesor"||isTaskServiceAdministrativeRole(identity.role)){
      assertTaskServiceTeacherCanManageTask(payload,task,"READ_CONTENT");
    }else if(identity.role==="Estudiante"||identity.role==="Alumno"){
      if(ownerId!==identity.userId)throw new Error("RESOURCE_NOT_FOUND");
      assertTaskServiceStudentCanAccessTask(ss,identity.userId,task);
    }else if(["Padre","Tutor","Responsable"].includes(identity.role)){
      const linkedIds=getTaskServiceGuardianStudentIds(identity.userId).map(value=>String(value||"").trim());
      if(linkedIds.indexOf(ownerId)===-1)throw new Error("RESOURCE_NOT_FOUND");
      assertTaskServiceStudentCanAccessTask(ss,ownerId,task);
    }else throw new Error("RESOURCE_NOT_FOUND");

    const targetFile=DriveApp.getFileById(requestedFileId);
    if(targetFile.isTrashed())throw new Error("RESOURCE_NOT_FOUND");
    const fileName=targetFile.getName(),mimeType=targetFile.getMimeType(),ext=fileName.split(".").pop().toLowerCase();
    let contentText="";
    if(["txt","psc","html","js","css"].includes(ext)){
      try{contentText=targetFile.getBlob().getDataAsString("UTF-8");}catch(_){contentText="";}
    }else{
      try{
        const raw=targetFile.getBlob().getDataAsString();
        const textMatches=raw.match(/[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()\-]{3,}/g)||[];
        const filtered=textMatches.filter(value=>value.trim().length>3&&!value.includes("<?xml")&&!value.includes("xmlns"));
        if(filtered.length)contentText=filtered.join(" ");
      }catch(_){contentText="";}
    }
    if(!contentText||contentText.trim().length<10){
      contentText="DOCUMENTO: "+fileName+"\n\nContenido textual no disponible para previsualización; utiliza la descarga autorizada del archivo original.";
    }
    return {status:"success",fileName,format:ext,mimeType,fileUrl:targetFile.getUrl(),content:contentText.substring(0,50000)};
  }catch(error){
    return {status:"error",errorCode:"RESOURCE_NOT_FOUND",message:"No se pudo recuperar el documento solicitado."};
  }
}

function getMultiPartFolderFiles(payload) {
  // Legacy folderId enumeration is disabled. Resumable uploads are bound to an
  // authenticated sessionKey and are assembled server-side by reconstructFileParts.
  return {status:"error",code:"LEGACY_FOLDER_ENUMERATION_DISABLED",message:"La enumeración directa de carpetas de Drive está deshabilitada; utilice el flujo de carga reanudable autenticada."};
}


// [TAREA-F8-MANT-01] [Fase 8: Aula Virtual y Gestión Avanzada del Aprendizaje] - Monitoreo preventivo de cuotas y disponibilidad de almacenamiento en Google Drive
// Backfill histórico seguro: solo deriva propietario desde una entrega/version exacta; nunca desde carpetas o nombres.
function reconcileLegacyTaskFileMetadata(payload) {
  const role = payload && payload._verifiedRole, actorId = payload && payload._verifiedUserId;
  if (!actorId || ["Administrador","Desarrollador"].indexOf(role) === -1) throw new Error("Solo un administrador verificado puede reconciliar metadatos históricos.");
  const apply = payload && payload.apply === true, lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID), metadata = ensureTaskServiceFileMetadataSheet(ss);
    const deliveries = getSheetOrThrow(ss,"Entregas").getDataRange().getValues().slice(1);
    const versionsSheet = ss.getSheetByName("EntregasVersiones");
    const versions = versionsSheet ? versionsSheet.getDataRange().getValues().slice(1) : [];
    const tasks = getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1);
    const rows = metadata.getDataRange().getValues(), candidates = [], unresolved = [], conflicts = [];
    let alreadyOwned = 0;
    for (let i=1;i<rows.length;i++) {
      const row=rows[i], fileId=extractTaskServiceFileId(row[15]), owner=String(row[19]||"").trim();
      if (!fileId) continue;
      if (owner) { alreadyOwned++; continue; }
      const pairs=[];
      deliveries.forEach(d=>{if(extractTaskServiceFileId(d[4])===fileId)pairs.push({ownerUserId:String(d[2]||"").trim(),taskId:String(d[1]||"").trim(),source:"Entregas"});});
      versions.forEach(d=>{if(extractTaskServiceFileId(d[6])===fileId)pairs.push({ownerUserId:String(d[3]||"").trim(),taskId:String(d[2]||"").trim(),source:"EntregasVersiones"});});
      const unique={};pairs.forEach(p=>{if(p.ownerUserId&&p.taskId)unique[p.ownerUserId+"|"+p.taskId]=p;});
      const matches=Object.keys(unique).map(k=>unique[k]);
      if(matches.length===1){
        const match=matches[0], task=tasks.find(t=>String(t[0]).trim()===match.taskId);
        if(!task){unresolved.push({row:i+1,fileId:fileId,reason:"TAREA_NO_ENCONTRADA"});continue;}
        candidates.push({row:i+1,fileId:fileId,ownerUserId:match.ownerUserId,taskId:match.taskId,profesorId:String(task[10]||"")});
      } else if(matches.length>1) conflicts.push({row:i+1,fileId:fileId,reason:"PROPIEDAD_AMBIGUA",matches:matches.length});
      else unresolved.push({row:i+1,fileId:fileId,reason:"SIN_ENTREGA_O_VERSION_VERIFICABLE"});
    }
    let migrated=0;
    if(apply && candidates.length){
      const audit=getOrCreateSheet(ss,"AuditoriaMigracionMetadatosArchivos");
      const auditHeaders=["Fecha","FileId","TareaId","PropietarioUserId","ProfesorId","ActorUserId","Fuente"];
      if(audit.getLastRow()===0)audit.appendRow(auditHeaders);
      else {
        const actual=audit.getRange(1,1,1,auditHeaders.length).getValues()[0].map(String);
        if(JSON.stringify(actual)!==JSON.stringify(auditHeaders))throw new Error("TASK_FILE_METADATA_AUDIT_SCHEMA_MISMATCH");
      }
      candidates.forEach(c=>{
        const before=rows[c.row-1];
        try {
          metadata.getRange(c.row,12,1,2).setValues([[before[11],before[12]]]);
          metadata.getRange(c.row,12,1,2).setValues([[c.taskId,c.profesorId]]);
          metadata.getRange(c.row,20).setValue(c.ownerUserId);
          audit.appendRow([new Date(),c.fileId,c.taskId,c.ownerUserId,c.profesorId,actorId,"Entregas/EntregasVersiones"]);
          migrated++;
        } catch(writeError) {
          try {
            metadata.getRange(c.row,12,1,2).setValues([[before[11],before[12]]]);
            metadata.getRange(c.row,20).setValue(before[19]);
          } catch(rollbackError) {
            throw new Error("TASK_FILE_METADATA_RECONCILIATION_ROLLBACK_FAILED: "+rollbackError.message);
          }
          throw writeError;
        }
      });
    }
    return {status:"success",dryRun:!apply,scanned:Math.max(0,rows.length-1),alreadyOwned:alreadyOwned,wouldMigrate:candidates.length,migrated:migrated,unresolved:unresolved,conflicts:conflicts};
  } finally { lock.releaseLock(); }
}

function getDriveStorageQuotaMetricsReport(payload) {
  try {
    const role = payload && payload._verifiedRole;
    if (["Administrador", "Desarrollador"].indexOf(role) === -1) {
      return { status:"error", code:"AUTH_PERMISSION_DENIED", message:"Solo administradores pueden consultar métricas globales de Drive." };
    }
    var bytesUsed = 0;
    var bytesTotal = 15 * 1024 * 1024 * 1024;
    try {
      // Intentar consultar cuota mediante Drive Advanced Service si está habilitado
      if (typeof Drive !== "undefined" && Drive.About && Drive.About.get) {
        var about = Drive.About.get();
        if (about && about.quotaBytesUsed) {
          bytesUsed = parseInt(about.quotaBytesUsed, 10) || 0;
          bytesTotal = parseInt(about.quotaBytesTotal, 10) || bytesTotal;
        }
      } else {
        // Estimación por carpetas del sistema
        var files = DriveApp.getFiles();
        var fileCount = 0;
        while (files.hasNext() && fileCount < 100) {
          var f = files.next();
          bytesUsed += f.getSize();
          fileCount++;
        }
      }
    } catch (eDrive) {
      Logger.log("Aviso al consultar métricas de cuotas en DriveApp: " + eDrive.message);
    }

    var bytesFree = Math.max(0, bytesTotal - bytesUsed);
    var percentUsed = bytesTotal > 0 ? (bytesUsed / bytesTotal) * 100 : 0;

    var nivelAlerta = "NORMAL";
    var mensajeAlerta = "Almacenamiento dentro de parámetros operativos normales.";

    if (percentUsed >= 95) {
      nivelAlerta = "CRITICO";
      mensajeAlerta = "Alerta Crítica: El almacenamiento en Google Drive ha superado el 95% de su capacidad. Riesgo de rechazo de entregas.";
    } else if (percentUsed >= 90) {
      nivelAlerta = "RIESGO_ELEVADO";
      mensajeAlerta = "Riesgo Elevado: El almacenamiento ha alcanzado el 90% de capacidad. Se recomienda la purga de archivos temporales o ampliación de espacio.";
    } else if (percentUsed >= 80) {
      nivelAlerta = "ADVERTENCIA";
      mensajeAlerta = "Advertencia de Capacidad: El uso de almacenamiento en Google Drive ha superado el 80%.";
    }

    return {
      status: "success",
      metrics: {
        bytesUtilizados: bytesUsed,
        bytesTotales: bytesTotal,
        bytesDisponibles: bytesFree,
        megabytesUtilizados: (bytesUsed / (1024 * 1024)).toFixed(2),
        megabytesTotales: (bytesTotal / (1024 * 1024)).toFixed(2),
        porcentajeUso: percentUsed.toFixed(2),
        nivelAlerta: nivelAlerta,
        mensajeAlerta: mensajeAlerta,
        fechaConsulta: new Date().toISOString()
      }
    };
  } catch (error) {
    Logger.log("Error en getDriveStorageQuotaMetricsReport: " + error.message);
    return {
      status: "error",
      message: "Error al generar reporte de cuota de almacenamiento: " + error.message
    };
  }
}


// [F8-Task24] [F10-Task13] [TAREA-F8-OPT-01] [Fase 8: Aula Virtual y Gestión Avanzada del Aprendizaje] - Obtener URL segura de previsualización de documentos PDF adjuntos en entregas con verificación RBAC
function getSubmissionDocumentPreviewUrl(payload) {
  try {
    if (!payload || !payload.fileId) return { status:"error",message:"fileId es requerido." };
    const identity = getVerifiedTaskIdentity_(payload);
    if (!identity || !identity.authorized || !identity.userId || !identity.role) {
      return { status:"error",code:"AUTH_PERMISSION_DENIED",message:"Sesión no válida o expirada." };
    }
    const fileId = extractTaskServiceFileId(payload.fileId);
    if (!fileId) return { status:"error",code:"AUTH_PERMISSION_DENIED",message:"Archivo no vinculado a una entrega institucional." };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const deliveries = getSheetOrThrow(ss,"Entregas").getDataRange().getValues().slice(1);
    const versionsSheet = ss.getSheetByName("EntregasVersiones");
    const versions = versionsSheet ? versionsSheet.getDataRange().getValues().slice(1) : [];
    const candidateDeliveryIds = new Set();
    deliveries.forEach(row => {
      if (extractTaskServiceFileId(row[4]) === fileId) candidateDeliveryIds.add(String(row[0] || "").trim());
    });
    versions.forEach(row => {
      if (extractTaskServiceFileId(row[6]) === fileId) candidateDeliveryIds.add(String(row[1] || "").trim());
    });
    if (candidateDeliveryIds.size !== 1 || !Array.from(candidateDeliveryIds)[0]) {
      return { status:"error",code:"AUTH_PERMISSION_DENIED",message:"Archivo no vinculado a una entrega única." };
    }
    const deliveryId = Array.from(candidateDeliveryIds)[0];
    const matchingDeliveries = deliveries.filter(row => String(row[0] || "").trim() === deliveryId);
    if (matchingDeliveries.length !== 1) {
      return { status:"error",code:"AUTH_PERMISSION_DENIED",message:"La entrega del documento es ambigua." };
    }
    const delivery = matchingDeliveries[0];
    const isCurrentFile = extractTaskServiceFileId(delivery[4]) === fileId;
    const isRecordedVersion = versions.some(row =>
      String(row[1] || "").trim() === deliveryId &&
      String(row[2] || "").trim() === String(delivery[1] || "").trim() &&
      String(row[3] || "").trim() === String(delivery[2] || "").trim() &&
      extractTaskServiceFileId(row[6]) === fileId
    );
    if (!isCurrentFile && !isRecordedVersion) {
      return { status:"error",code:"AUTH_PERMISSION_DENIED",message:"El documento no pertenece al historial de la entrega." };
    }
    const accessPayload = Object.assign({},payload,{entregaId:deliveryId});
    const access = getTaskServiceSubmissionAccess_(accessPayload,"READ_CONTENT",identity);
    if (!access.delivery || String(access.delivery[0] || "").trim() !== deliveryId ||
        (!isCurrentFile && !isRecordedVersion)) {
      return { status:"error",code:"AUTH_PERMISSION_DENIED",message:"No tiene autorización sobre el documento solicitado." };
    }
    const file = DriveApp.getFileById(fileId), mimeType = file.getMimeType(), fileName = file.getName(), fileSize = file.getSize();
    return {status:"success",fileId:fileId,fileName:fileName,fileSizeMb:(fileSize/(1024*1024)).toFixed(2),mimeType:mimeType,
      isPdf:mimeType==="application/pdf"||fileName.toLowerCase().endsWith(".pdf"),
      previewUrl:"https://drive.google.com/file/d/"+fileId+"/preview",downloadUrl:"https://drive.google.com/uc?export=download&id="+fileId};
  } catch (error) {
    Logger.log("Error en getSubmissionDocumentPreviewUrl: "+error.message);
    return {status:"error",message:"Error al generar URL de previsualización: "+error.message};
  }
}
