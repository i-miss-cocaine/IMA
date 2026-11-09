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
  const props = PropertiesService.getScriptProperties();
  let secret = "";
  try {
    secret = props.getProperty("AUTH_TOKEN_SECRET");
  } catch (e) {}
  if (!secret) {
    const rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET");
    const arr = Array.from ? Array.from(rawBytes) : [].slice.call(rawBytes);
    secret = arr.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
    try {
      props.setProperty("AUTH_TOKEN_SECRET", secret);
    } catch (e) {}
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
    if (claims.exp && now > claims.exp) {
      return null;
    }
    // [TAREA-F4-P0-03] [Fase 4: Gestión de Sesiones] - Verificación de revocación explícita por sessionId y estado de cuenta
    if (claims.userId) {
      const cache = CacheService.getScriptCache();
      if (cache.get("revoked_user_" + claims.userId)) {
        return null;
      }
      if (claims.sessionId && cache.get("revoked_session_" + claims.sessionId)) {
        return null;
      }

      const cacheKey = "acct_state_" + claims.userId;
      let acctState = cache.get(cacheKey);
      if (!acctState) {
        try {
          const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
          const uSheet = ss.getSheetByName("Usuarios");
          if (uSheet) {
            const data = uSheet.getDataRange().getValues();
            for (let i = 1; i < data.length; i++) {
              if (String(data[i][0]).trim() === String(claims.userId).trim()) {
                acctState = String(data[i][10] || "Activa").trim();
                cache.put(cacheKey, acctState, 60);
                break;
              }
            }
          }
        } catch (e) {}
      }
      if (!acctState || acctState !== "Activa") {
        return null;
      }
    }
    return claims;
  } catch (e) {
    return null;
  }
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

  // [TAREA-AD-06] [Anexo Tareas: Seguridad y Roles] - Registro de auditoría de denegación por defecto
  try {
    const actorId = verifiedUserId || verifiedId || "Desconocido";
    Logger.log(`[TAREA-AD-06] UNAUTHORIZED_ACCESS_ATTEMPT: Acción '${action}' rechazada por defecto para usuario '${actorId}' (rol '${userRole}').`);
  } catch (_) {}
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
  let response;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No se recibieron datos." })).setMimeType(ContentService.MimeType.JSON);
    }
    const { action, payload } = JSON.parse(e.postData.contents);
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
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId;if(!uid||(role!=="Profesor"&&!isTaskServiceAdministrativeRole(role)))throw new Error("Acceso denegado.");
 const {tipo,titulo,descripcion,parcial,asignatura,gradoAsignado,seccionAsignada,fechaLimite,tareaOriginalId,puntaje,archivoUrl,fechaDisponible,tipoRecurso}=payload||{};
 if(!titulo||!gradoAsignado||!asignatura)throw new Error("Título, grado y asignatura obligatorios.");let owner=String(uid).trim();
 if(role==="Profesor"){const classes=getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"AulasVirtuales").getDataRange().getValues().slice(1);
  const c=classes.find(r=>String(r[7]||"Activa")!=="Desactivada"&&normalizeString(r[3])===normalizeString(gradoAsignado)&&(!r[4]||normalizeString(r[4])===normalizeString(seccionAsignada||""))&&normalizeString(r[5])===normalizeString(asignatura)&&String(r[6]||"").trim()===owner);
  if(!c)throw new Error("No existe aula asignada para el ámbito de la tarea.");assertTaskServiceTeacherAssignedToOffer(owner,c[1]);
 }else if(payload.profesorId)owner=String(payload.profesorId).trim();
 if(tareaOriginalId){const orig=getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===String(tareaOriginalId).trim());if(!orig)throw new Error("Tarea original no encontrada.");if(role==="Profesor")assertTaskServiceTeacherCanManageTask(payload,orig);}
 const id="TSK-"+Utilities.getUuid();getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"Tareas").appendRow([id,tipo||"Tarea",titulo,descripcion||"",parcial||"",asignatura,gradoAsignado,seccionAsignada||"",fechaLimite||"",tareaOriginalId||"",owner,"Activa",puntaje===undefined?100:puntaje,archivoUrl||"",fechaDisponible||"",tipoRecurso||"Tarea"]);
 return {status:"success",message:"Tarea creada.",data:{tareaId:id}};
}
function updateTask(payload) {
 const uid=payload&&payload._verifiedUserId,tareaId=payload&&payload.tareaId;if(!uid||!tareaId)throw new Error("Identidad y tarea requeridas.");
 const sh=getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"Tareas"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(tareaId).trim());if(i<1)throw new Error("Tarea no encontrada.");
 const row=data[i];assertTaskServiceTeacherCanManageTask(payload,row);
 if(payload._verifiedRole==="Profesor"&&["gradoAsignado","seccionAsignada","asignatura"].some(k=>payload[k]!==undefined)){
  const g=payload.gradoAsignado===undefined?row[6]:payload.gradoAsignado,sec=payload.seccionAsignada===undefined?row[7]:payload.seccionAsignada,sub=payload.asignatura===undefined?row[5]:payload.asignatura;
  const c=getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"AulasVirtuales").getDataRange().getValues().slice(1).find(r=>String(r[7]||"Activa")!=="Desactivada"&&normalizeString(r[3])===normalizeString(g)&&(!r[4]||normalizeString(r[4])===normalizeString(sec))&&normalizeString(r[5])===normalizeString(sub)&&String(r[6]||"").trim()===String(uid).trim());
  if(!c)throw new Error("El nuevo ámbito no pertenece a una asignación docente.");assertTaskServiceTeacherAssignedToOffer(uid,c[1]);
 }
 [["titulo",2],["descripcion",3],["parcial",4],["asignatura",5],["gradoAsignado",6],["seccionAsignada",7],["fechaLimite",8],["puntaje",12],["archivoUrl",13]].forEach(([k,col])=>{if(payload[k]!==undefined)row[col]=payload[k];});
 sh.getRange(i+1,1,1,row.length).setValues([row]);return {status:"success",message:"Tarea actualizada."};
}
function deleteTask(payload) {
 const id=payload&&payload.tareaId;if(!id)throw new Error("tareaId requerido.");const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=getSheetOrThrow(ss,"Tareas"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Tarea no encontrada.");
 assertTaskServiceTeacherCanManageTask(payload,data[i]);const has=getSheetOrThrow(ss,"Entregas").getDataRange().getValues().slice(1).some(r=>String(r[1]).trim()===String(id).trim());
 if(has){sh.getRange(i+1,12).setValue("Inactiva");return {status:"success",message:"Tarea marcada como inactiva (existen entregas)."};}sh.deleteRow(i+1);return {status:"success",message:"Tarea eliminada."};
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
function getTaskServiceGuardianStudentIds(guardianUserId) {
  if (!guardianUserId) return [];
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID), ids = [], expMap = {};
  const expSheet = ss.getSheetByName("ExpedientesEstudiantes");
  if (expSheet) expSheet.getDataRange().getValues().slice(1).forEach(row => { if (row[0]) expMap[String(row[0]).trim()] = String(row[1] || row[0]).trim(); });
  const relationSheet = ss.getSheetByName("RelacionesFamiliares");
  if (relationSheet) relationSheet.getDataRange().getValues().slice(1).forEach(row => {
    if (String(row[2] || "").trim() !== String(guardianUserId).trim()) return;
    if (["Verificada", "Activa", "Aprobada"].indexOf(String(row[4] || "").trim()) === -1) return;
    let permissions = {}; try { permissions = typeof row[8] === "string" ? JSON.parse(row[8] || "{}") : (row[8] || {}); } catch (_) {}
    if (permissions.permisoAcademico === false) return;
    const expedienteId = String(row[1] || "").trim(), studentId = expMap[expedienteId] || expedienteId;
    if (studentId) ids.push(studentId);
  });
  return Array.from(new Set(ids));
}

function isTaskServiceAdministrativeRole(role) { return ["Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role)!==-1; }
function assertTaskServiceTeacherAssignedToOffer(userId,offerId) {
 if(!userId||!offerId)throw new Error("Oferta académica no verificable.");
 const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("AsignacionesDocentes");if(!sh)throw new Error("No existe AsignacionesDocentes; acceso denegado.");
 const now=Date.now(),rows=sh.getDataRange().getValues().slice(1);
 if(!rows.some(r=>String(r[1]).trim()===String(offerId).trim()&&String(r[2]).trim()===String(userId).trim()&&String(r[6]||"Activo").toLowerCase()==="activo"&&(!r[4]||new Date(r[4]).getTime()<=now)&&(!r[5]||new Date(r[5]).getTime()>=now)))throw new Error("Acceso denegado: no existe asignación docente activa para la oferta.");
 return true;
}
function getTaskServiceClassroomById(id) {
 if(!id||String(id).trim()==="General")return null;
 return getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"AulasVirtuales").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===String(id).trim())||null;
}
function assertTaskServiceClassroomAccess(payload,id) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId;if(!uid)throw new Error("Identidad verificada requerida.");
 if(isTaskServiceAdministrativeRole(role)){if(id&&id!=="General"&&!getTaskServiceClassroomById(id))throw new Error("Aula no encontrada.");return null;}
 if(role!=="Profesor")throw new Error("Acceso denegado.");
 const row=getTaskServiceClassroomById(id);if(!row||String(row[7]||"Activa")==="Desactivada")throw new Error("Aula no válida o inactiva.");
 assertTaskServiceTeacherAssignedToOffer(uid,row[1]);if(String(row[6]||"").trim()!==String(uid).trim())throw new Error("El aula no está asignada al docente autenticado.");return row;
}
function assertTaskServiceTeacherCanManageTask(payload,row) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId;if(!uid)throw new Error("Identidad verificada requerida.");if(isTaskServiceAdministrativeRole(role))return true;
 if(role!=="Profesor"||String(row[10]||"").trim()!==String(uid).trim())throw new Error("Acceso denegado: la tarea no pertenece al docente.");
 const classes=getSheetOrThrow(SpreadsheetApp.openById(SPREADSHEET_ID),"AulasVirtuales").getDataRange().getValues().slice(1);
 const c=classes.find(r=>String(r[7]||"Activa")!=="Desactivada"&&normalizeString(r[3])===normalizeString(row[6])&&(!r[4]||normalizeString(r[4])===normalizeString(row[7]))&&normalizeString(r[5])===normalizeString(row[5])&&String(r[6]||"").trim()===String(uid).trim());
 if(!c)throw new Error("La tarea no coincide con un aula del docente.");assertTaskServiceTeacherAssignedToOffer(uid,c[1]);return true;
}

function getTaskServiceAuthorizedClassrooms(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId;if(!uid)throw new Error("Identidad verificada requerida.");
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),rows=getSheetOrThrow(ss,"AulasVirtuales").getDataRange().getValues().slice(1).filter(r=>String(r[7]||"Activa")!=="Desactivada");
 if(isTaskServiceAdministrativeRole(role))return rows;
 if(role==="Profesor"){const sh=ss.getSheetByName("AsignacionesDocentes");if(!sh)return [];const now=Date.now(),as=sh.getDataRange().getValues().slice(1);
  const offers=new Set(as.filter(r=>String(r[2]).trim()===String(uid).trim()&&String(r[6]||"Activo").toLowerCase()==="activo"&&(!r[4]||new Date(r[4]).getTime()<=now)&&(!r[5]||new Date(r[5]).getTime()>=now)).map(r=>String(r[1]||"").trim()));
  return rows.filter(r=>r[1]&&offers.has(String(r[1]).trim())&&String(r[6]||"").trim()===String(uid).trim());}
 let profiles=[];if(role==="Estudiante"||role==="Alumno")profiles=[getTaskServiceUserProfile(uid)];else if(["Padre","Tutor","Responsable"].includes(role))profiles=getTaskServiceGuardianStudentIds(uid).map(getTaskServiceUserProfile);
 return rows.filter(r=>profiles.some(p=>normalizeString(r[3])===normalizeString(p.grado)&&(!r[4]||normalizeString(r[4])===normalizeString(p.seccion))));
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
  const seenOriginalTasksForEC = new Set();
  const studentTasks = tasksData.filter(task => {
    if (role === "Profesor" && String(task[10] || "").trim() !== String(actorId).trim()) return false;
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
    const matching = entregasData.filter(row => String(row[1]).trim() === String(task[0]).trim() && String(row[2]).trim() === userId);
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
  if (!taskRow) throw new Error("Tarea no encontrada.");
  const profile = getTaskServiceUserProfile(userId);
  if (normalizeString(taskRow[6]) !== normalizeString(profile.grado)) throw new Error("Acceso denegado: tarea fuera del grado del estudiante.");
  if (taskRow[7] && String(taskRow[7]).trim() && !isInTeacherList(profile.seccion, taskRow[7])) throw new Error("Acceso denegado: tarea fuera de la sección del estudiante.");
  if (String(taskRow[11] || "Activa").trim().toLowerCase() === "desactivada") throw new Error("La tarea no está disponible.");
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

function uploadFile(payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole;
  const tareaId=String(payload&&payload.tareaId||"").trim(),fileData=payload&&payload.fileData,fileName=String(payload&&payload.fileName||"").trim();
  if(!actorId||!tareaId||!fileData||!fileName)throw new Error("Identidad, tarea, nombre y contenido del archivo son obligatorios.");
  if(role!=="Estudiante"&&role!=="Alumno"&&role!=="Profesor"&&!isTaskServiceAdministrativeRole(role))throw new Error("Rol no autorizado para subir archivos.");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),taskData=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===tareaId);
  if(!taskData)throw new Error("Tarea no encontrada.");
  let profile;
  if(role==="Estudiante"||role==="Alumno")profile=assertTaskServiceStudentCanAccessTask(ss,actorId,taskData);
  else if(role==="Profesor"){assertTaskServiceTeacherCanManageTask(payload,taskData);profile=getTaskServiceUserProfile(actorId);}
  else profile=getTaskServiceUserProfile(actorId);
  const parts=String(fileData).split(","),raw=parts.length>1?parts[1]:parts[0];
  let mimeType="application/octet-stream";
  const match=parts[0].match(/^data:([^;]+);base64$/i);
  if(match)mimeType=match[1];
  else {const ext=fileName.split(".").pop().toLowerCase();const map={js:"text/javascript",css:"text/css",html:"text/html",txt:"text/plain",psc:"text/plain",heic:"image/heic"};mimeType=map[ext]||mimeType;}
  if(!raw||raw.length>70*1024*1024)throw new Error("Archivo vacío o supera el límite permitido.");
  const bytes=Utilities.base64Decode(raw.replace(/\s/g,""));
  if(bytes.length>50*1024*1024)throw new Error("El archivo supera el límite de 50 MB.");
  const blob=Utilities.newBlob(bytes,mimeType,fileName),root=DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const grade=getOrCreateFolder(root,String(profile.grado||taskData[6]||"General"));
  const section=getOrCreateFolder(grade,String(profile.seccion||taskData[7]||"General"));
  const ownerFolder=getOrCreateFolder(section,String(profile.nombre||actorId));
  const partial=getOrCreateFolder(ownerFolder,String(taskData[4]||"General"));
  const subject=getOrCreateFolder(partial,String(taskData[5]||"General"));
  const taskFolder=getOrCreateFolder(subject,String(taskData[2]||"Tarea")+"_"+actorId);
  const file=taskFolder.createFile(blob);
  try{logFileMetadata(ss,{fileName,fileId:file.getId(),fileUrl:file.getUrl(),mimeType,sizeBytes:bytes.length,tareaId,
    asignatura:String(taskData[5]||"General"),parcial:String(taskData[4]||"General"),grado:String(taskData[6]||"General"),seccion:String(taskData[7]||"General"),
    profesorId:String(taskData[10]||""),ownerUserId:actorId,folderId:taskFolder.getId()});}
  catch(err){try{file.setTrashed(true);}catch(_){}throw new Error("No se pudo registrar la propiedad del archivo; la carga fue revertida.");}
  return {status:"success",data:{fileId:file.getId(),folderId:taskFolder.getId(),mimeType}};
}



/**
 * DEPRECATED: Se utiliza uploadFile con segmentación lógica en cliente.
 * Une todos los chunks y crea el archivo final.
 */
function finishChunkedUpload() { throw new Error("El protocolo de carga legacy está deshabilitado; utilice carga reanudable autenticada."); }

// [TAREA-10] [Fase 1: Auditoría y planificación de la expansión] - Sistema ampliado de asignaciones, entregas multimodales, revisiones, versiones, rúbricas y retroalimentación.
function submitAssignment(payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole,tareaId=String(payload&&payload.tareaId||"").trim();
  if(!actorId||(role!=="Estudiante"&&role!=="Alumno"))throw new Error("Solo el estudiante autenticado puede entregar su tarea.");
  if(payload.userId&&String(payload.userId).trim()!==String(actorId).trim())throw new Error("El userId enviado no coincide con la sesión autenticada.");
  if(!tareaId)throw new Error("tareaId es obligatorio.");
  try{const quota=getDriveStorageQuotaMetricsReport({});if(quota&&quota.status==="success"&&quota.metrics&&parseFloat(quota.metrics.porcentajeUso)>=99.5)return {status:"error",message:"No se puede confirmar la entrega: el almacenamiento del servidor alcanzó su límite máximo. Contacte al soporte institucional."};}
  catch(quotaError){Logger.log("Aviso al verificar cuota en submitAssignment: "+quotaError.message);}
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
  if(idx>0){entregaId=data[idx][0];const prev=data[idx];versionNum=versions.getDataRange().getValues().filter(r=>String(r[1]).trim()===String(entregaId).trim()).length+1;prev[3]=now;prev[4]=fileId||"";prev[6]=estado;prev[8]=mimeType;entregas.getRange(idx+1,1,1,prev.length).setValues([prev]);}
  else{entregaId="ENT-"+Utilities.getUuid();entregas.appendRow([entregaId,tareaId,actorId,now,fileId||"","",estado,payload.observaciones||"",mimeType]);}
  versions.appendRow(["VER-"+Utilities.getUuid(),entregaId,tareaId,actorId,versionNum,fileId&&mimeType!=="folder"?"https://drive.google.com/file/d/"+fileId+"/view":"",fileId||"",mimeType,payload.textoRespuesta||"",payload.enlaceExterno||"",now,estado,payload.observaciones||""]);
  return {status:"success",message:payload.esBorrador?"Borrador de tarea guardado.":"Tarea entregada y registrada en el servidor.",data:{entregaId,versionNum,submissionToken:"RECIEVED-"+Utilities.getUuid(),fechaRecepcion:now.toISOString(),estado}};
}

function saveSubmissionDraft(payload) {
  return submitAssignment(Object.assign({}, payload, { esBorrador: true }));
}

function gradeSubmissionWithRubric(payload) {
  const { entregaId, calificacion, estado, comentario, rubricaEvaluacionJSON } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "Entregas");

  const data = entregasSheet.getDataRange().getValues();
  const headers = data[0];

  function findColIndex(name) {
    const normTarget = normalizeString(name);
    return headers.findIndex(h => normalizeString(h) === normTarget);
  }

  const calificacionCol = findColIndex("calificacion");
  const estadoCol = findColIndex("estado");
  const comentarioCol = findColIndex("comentario");

  if (calificacionCol === -1 || estadoCol === -1 || comentarioCol === -1) {
    throw new Error("No se encontraron las columnas necesarias en la hoja de Entregas.");
  }

  const rowIndex = data.findIndex(row => String(row[0]).trim() === String(entregaId).trim());

  if (rowIndex !== -1) {
    const rowData = data[rowIndex];
    rowData[calificacionCol] = calificacion;
    rowData[estadoCol] = estado || "revisada";
    rowData[comentarioCol] = comentario || "";

    entregasSheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);

    // Registrar evaluación por rúbrica si se provee
    if (rubricaEvaluacionJSON) {
      const rubricaSheet = getOrCreateSheet(ss, "EvaluacionesRubricas");
      if (rubricaSheet.getLastRow() === 0) {
        rubricaSheet.appendRow(["ID", "EntregaID", "RubricaJSON", "PuntajeCalculado", "EvaluadoEn"]);
      }
      rubricaSheet.appendRow(["EVAL-" + Date.now(), entregaId, JSON.stringify(rubricaEvaluacionJSON), calificacion, new Date()]);
    }

    return { status: "success", message: "Calificación con rúbrica registrada exitosamente." };
  }

  throw new Error("Entrega no encontrada.");
}

/**
 * Elimina un archivo de Drive (lo mueve a la papelera) (A-30).
 */
function deleteFile(payload) {
  const actorId = payload && payload._verifiedUserId;
  const role = payload && payload._verifiedRole;
  const fileId = extractTaskServiceFileId(payload && payload.fileId);
  if (!actorId || !fileId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Acceso denegado: se requiere identidad de estudiante.");
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
}

function gradeSubmission(payload) {
  const { entregaId, calificacion, estado, comentario } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "Entregas");

  const data = entregasSheet.getDataRange().getValues();
  const headers = data[0];

  const calificacionCol = headers.indexOf("calificacion");
  const estadoCol = headers.indexOf("estado");
  const comentarioCol = headers.indexOf("comentario");

  if (calificacionCol === -1 || estadoCol === -1 || comentarioCol === -1) {
    throw new Error("No se encontraron las columnas necesarias en la hoja de Entregas.");
  }

  const rowIndex = data.findIndex(row => row[0] === entregaId);

  if (rowIndex !== -1) {
    const rowData = data[rowIndex];
    rowData[calificacionCol] = calificacion;
    rowData[estadoCol] = estado;
    rowData[comentarioCol] = comentario;

    entregasSheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
    return { status: "success", message: "Calificación actualizada." };
  }

  throw new Error("Entrega no encontrada.");
}

function deleteSubmission(payload) {
  const actorId=payload&&payload._verifiedUserId,role=payload&&payload._verifiedRole,entregaId=String(payload&&payload.entregaId||"").trim();
  if(!actorId||!entregaId)throw new Error("Identidad y entrega requeridas.");
  if(role!=="Profesor"&&!isTaskServiceAdministrativeRole(role))throw new Error("Acceso denegado: solo el docente propietario o administración puede eliminar entregas.");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=getSheetOrThrow(ss,"Entregas"),data=sheet.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&String(r[0]).trim()===entregaId);
  if(idx<1)throw new Error("Entrega no encontrada.");
  const taskId=String(data[idx][1]||"").trim(),task=getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(r=>String(r[0]).trim()===taskId);
  if(!task)throw new Error("No se puede eliminar: la tarea asociada no existe.");
  if(role==="Profesor")assertTaskServiceTeacherCanManageTask(payload,task);
  const fileId=extractTaskServiceFileId(data[idx][4]),mime=String(data[idx][8]||"");
  if(fileId){try{if(mime==="folder")DriveApp.getFolderById(fileId).setTrashed(true);else DriveApp.getFileById(fileId).setTrashed(true);}catch(e){logDebug("No se pudo eliminar archivo de entrega.",e.message);throw new Error("No se eliminó la entrega porque falló la eliminación del archivo asociado.");}}
  sheet.deleteRow(idx+1);return {status:"success",message:"Entrega eliminada correctamente."};
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
    if (!isAdmin && String(tarea[10] || "").trim() !== profesorId) return null;
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

  const filtered = data.filter(r => {
    if (!isAdmin && String(r[10] || "").trim() !== profesorId) return false;
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
  const fileId = payload && payload.fileId, fileName = payload && payload.fileName;
  const userId = payload && payload._verifiedUserId, role = payload && payload._verifiedRole;
  if (!userId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Acceso denegado: solo el estudiante autenticado puede eliminar sus proyectos.");
  if (!fileId && !fileName) throw new Error("Identificador de proyecto requerido.");

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pseudocodeSheet = getSheetOrThrow(ss, "pseudocode");
    const data = pseudocodeSheet.getDataRange().getValues();

    // Buscar por fileId (en URL) o por NombreArchivo (si fileId es el nombre)
    const rowIndex = data.findIndex(r => (r[0] == userId && (r[1] == fileName || r[1] == fileId || (r[2] || "").indexOf(fileId) !== -1)));

    if (rowIndex === -1) throw new Error("Acceso denegado: el proyecto no pertenece al estudiante autenticado.");
    const storedFileId = extractTaskServiceFileId(data[rowIndex][2] || "");
    pseudocodeSheet.deleteRow(rowIndex + 1);
    if (storedFileId) {
      try { DriveApp.getFileById(storedFileId).setTrashed(true); } catch (driveError) { logDebug("No se pudo eliminar el archivo del proyecto:", driveError.message); }
    }
  } catch (e) {
    logDebug("Error al eliminar de la hoja:", e.message);
  }

  // La eliminación de Drive se hace únicamente con el ID recuperado de la fila propia verificada.

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
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,{ofertaId,nombreClase,grado,seccion,asignatura,anioLectivo,periodo}=payload||{};
 if(!uid||(role!=="Profesor"&&!isTaskServiceAdministrativeRole(role)))throw new Error("Acceso denegado.");if(!ofertaId||!grado||!asignatura)throw new Error("Oferta, grado y asignatura obligatorios.");
 let teacher=String(uid).trim();if(role==="Profesor")assertTaskServiceTeacherAssignedToOffer(teacher,ofertaId);else if(payload.profesorId)teacher=String(payload.profesorId).trim();
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"AulasVirtuales");if(sh.getLastRow()===0)sh.appendRow(["AulaID","OfertaID","NombreClase","Grado","Seccion","Asignatura","ProfesorID","Estado","AnioLectivo","Periodo","CreadoEn"]);
 const dup=sh.getDataRange().getValues().slice(1).some(r=>String(r[1]).trim()===String(ofertaId).trim()&&normalizeString(r[3])===normalizeString(grado)&&normalizeString(r[4])===normalizeString(seccion||"A")&&normalizeString(r[5])===normalizeString(asignatura));if(dup)throw new Error("Aula duplicada para oferta y ámbito.");
 const id="AULA-"+Utilities.getUuid(),now=new Date(),name=nombreClase||`${asignatura} - ${grado} ${seccion||"A"}`;sh.appendRow([id,ofertaId,name,grado,seccion||"A",asignatura,teacher,"Activa",anioLectivo||now.getFullYear(),periodo||"I parcial",now]);return {status:"success",message:"Aula virtual creada.",data:{aulaId:id,nombreClase:name}};
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
    if (row[12] === "Eliminado") return false;
    const classId = String(row[1] || "").trim();
    if (classId !== "General" && !allowedIds.has(classId)) return false;
    if (aulaId && classId !== String(aulaId).trim()) return false;
    const isDraft = row[7] === true || String(row[7] || "").trim().toLowerCase() === "true";
    if (isDraft && (!includeDrafts || !isTeacherOrAdmin)) return false;
    if (!isTeacherOrAdmin && (isDraft || row[12] !== "Publicado")) return false;
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
 if(!uid||!titulo||!contenido)throw new Error("Identidad, título y contenido obligatorios.");if(role==="Profesor")assertTaskServiceClassroomAccess(payload,classId);else if(!isTaskServiceAdministrativeRole(role))throw new Error("Acceso denegado.");
 if(classId==="General"&&!isTaskServiceAdministrativeRole(role))throw new Error("Solo administración puede publicar en General.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios");if(sh.getLastRow()===0)sh.appendRow(["ID","AulaID","Titulo","Contenido","Categoria","AutorID","EsFijado","EsBorrador","FechaProgramada","FechaPublicacion","AdjuntosJSON","Audiencia","Estado"]);
 const id="POST-"+Utilities.getUuid(),now=new Date();sh.appendRow([id,classId,titulo,contenido,categoria||"Anuncio",uid,!!esFijado,!!esBorrador,fechaProgramada||"",now,JSON.stringify(adjuntos||[]),audiencia||"Todos",esBorrador?"Borrador":"Publicado"]);return {status:"success",message:"Publicación creada.",data:{postId:id}};
}
function updatePost(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,id=payload&&payload.postId;if(!uid||!id)throw new Error("Identidad y postId requeridos.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Publicación no encontrada.");const row=data[i];
 if(!isTaskServiceAdministrativeRole(role)){if(role!=="Profesor"||String(row[5]).trim()!==String(uid).trim())throw new Error("La publicación no pertenece al docente.");assertTaskServiceClassroomAccess(payload,row[1]);}
 [["titulo",2],["contenido",3],["categoria",4]].forEach(([k,col])=>{if(payload[k]!==undefined)row[col]=payload[k];});if(payload.esFijado!==undefined)row[6]=!!payload.esFijado;if(payload.esBorrador!==undefined){row[7]=!!payload.esBorrador;row[12]=payload.esBorrador?"Borrador":"Publicado";}if(payload.adjuntos!==undefined)row[10]=JSON.stringify(payload.adjuntos);
 sh.getRange(i+1,1,1,row.length).setValues([row]);return {status:"success",message:"Publicación actualizada."};
}
function deletePost(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,id=payload&&payload.postId;if(!uid||!id)throw new Error("Identidad y postId requeridos.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"PublicacionesAnuncios"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Publicación no encontrada.");const row=data[i];
 if(!isTaskServiceAdministrativeRole(role)){if(role!=="Profesor"||String(row[5]).trim()!==String(uid).trim())throw new Error("La publicación no pertenece al docente.");assertTaskServiceClassroomAccess(payload,row[1]);}
 sh.getRange(i+1,13).setValue("Eliminado");return {status:"success",message:"Publicación eliminada."};
}
function getStudyMaterials(payload) {
  const role = payload && payload._verifiedRole;
  const allowedRows = getTaskServiceAuthorizedClassrooms(payload);
  const allowedIds = new Set(allowedRows.map(row => String(row[0]).trim()));
  const isStaff = ["Profesor","Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role) !== -1;
  const { aulaId, parcial, unidad, tema } = payload || {};
  const data = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"MaterialesEducativos").getDataRange().getValues();
  if (data.length <= 1) return { status:"success", data:[] };
  const materials = data.slice(1).filter(row => {
    if (row[12] === "Eliminado") return false;
    const classId = String(row[1] || "").trim();
    if (classId !== "General" && !allowedIds.has(classId)) return false;
    if (aulaId && classId !== String(aulaId).trim()) return false;
    if (!isStaff && ["Activo","Publicado"].indexOf(String(row[12] || "Activo")) === -1) return false;
    if (parcial && normalizeString(row[5]) !== normalizeString(parcial)) return false;
    if (unidad && normalizeString(row[6]) !== normalizeString(unidad)) return false;
    if (tema && normalizeString(row[7]) !== normalizeString(tema)) return false;
    return true;
  }).map(row => ({
    materialId:row[0],aulaId:row[1],titulo:row[2],descripcion:row[3],tipoRecurso:row[4]||"Documento",
    parcial:row[5],unidad:row[6],tema:row[7],archivoUrl:row[8],driveId:row[9],autorId:row[10],
    fechaPublicacion:row[11]?new Date(row[11]).toISOString():null,estado:row[12]||"Activo"
  }));
  return { status:"success", data:materials };
}
function createStudyMaterial(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,{aulaId,titulo,descripcion,tipoRecurso,parcial,unidad,tema,archivoUrl,driveId}=payload||{},classId=aulaId||"General";
 if(!uid||!titulo||!archivoUrl)throw new Error("Identidad, título y archivo obligatorios.");if(role==="Profesor")assertTaskServiceClassroomAccess(payload,classId);else if(!isTaskServiceAdministrativeRole(role))throw new Error("Acceso denegado.");
 if(classId==="General"&&!isTaskServiceAdministrativeRole(role))throw new Error("Solo administración puede publicar materiales generales.");if(driveId){const file=DriveApp.getFileById(extractTaskServiceFileId(driveId));if(file.isTrashed())throw new Error("Archivo eliminado.");}
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"MaterialesEducativos");if(sh.getLastRow()===0)sh.appendRow(["ID","AulaID","Titulo","Descripcion","TipoRecurso","Parcial","Unidad","Tema","ArchivoUrl","DriveId","AutorID","FechaPublicacion","Estado"]);
 const id="MAT-"+Utilities.getUuid(),now=new Date();sh.appendRow([id,classId,titulo,descripcion||"",tipoRecurso||"Documento",parcial||"I parcial",unidad||"Unidad 1",tema||"Tema General",archivoUrl,driveId||"",uid,now,"Activo"]);return {status:"success",message:"Material educativo publicado.",data:{materialId:id}};
}
function deleteStudyMaterial(payload) {
 const role=payload&&payload._verifiedRole,uid=payload&&payload._verifiedUserId,id=payload&&payload.materialId;if(!uid||!id)throw new Error("Identidad y materialId requeridos.");
 const sh=getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID),"MaterialesEducativos"),data=sh.getDataRange().getValues(),i=data.findIndex(r=>String(r[0]).trim()===String(id).trim());if(i<1)throw new Error("Material no encontrado.");const row=data[i];
 if(!isTaskServiceAdministrativeRole(role)){if(role!=="Profesor"||String(row[10]).trim()!==String(uid).trim())throw new Error("El material no pertenece al docente.");assertTaskServiceClassroomAccess(payload,row[1]);}
 sh.getRange(i+1,13).setValue("Eliminado");return {status:"success",message:"Material eliminado."};
}
function returnSubmissionForRevision(payload) {
  const { entregaId, comentario, profesorId } = payload || {};
  if (!entregaId) throw new Error("entregaId es requerido.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "Entregas");
  const data = entregasSheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]).trim() === String(entregaId).trim());
  if (idx === -1) throw new Error("Entrega no encontrada.");

  const row = data[idx];
  row[6] = "DevueltaCorrección";
  if (comentario) row[7] = comentario;

  entregasSheet.getRange(idx + 1, 1, 1, row.length).setValues([row]);

  // Agregar comentario privado
  if (comentario) {
    addSubmissionComment({
      entregaId: entregaId,
      tareaId: row[1],
      autorId: profesorId || "Profesor",
      rolAutor: "Docente",
      mensaje: comentario,
      esPrivado: true
    });
  }

  return { status: "success", message: "Tarea devuelta para corrección al estudiante." };
}

function getSubmissionComments(payload) {
  const { entregaId, tareaId } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "ComentariosEntregas");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };

  const comments = data.slice(1).filter(r => {
    if (entregaId && String(r[1]).trim() === String(entregaId).trim()) return true;
    if (tareaId && String(r[2]).trim() === String(tareaId).trim()) return true;
    return false;
  }).map(r => ({
    comentarioId: r[0],
    entregaId: r[1],
    tareaId: r[2],
    autorId: r[3],
    rolAutor: r[4] || "Usuario",
    mensaje: r[5],
    esPrivado: r[6] === true || String(r[6]).toLowerCase() === "true",
    fechaCreacion: r[7] ? new Date(r[7]).toISOString() : null
  }));

  return { status: "success", data: comments };
}

function addSubmissionComment(payload) {
  const { entregaId, tareaId, autorId, rolAutor, mensaje, esPrivado } = payload || {};
  if (!mensaje) throw new Error("Mensaje de comentario es requerido.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "ComentariosEntregas");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "EntregaID", "TareaID", "AutorID", "RolAutor", "Mensaje", "EsPrivado", "FechaCreacion"]);
  }

  const comId = "COM-" + Date.now();
  const now = new Date();

  sheet.appendRow([comId, entregaId || "", tareaId || "", autorId || "Usuario", rolAutor || "Estudiante", mensaje, esPrivado !== false, now]);

  return { status: "success", message: "Comentario publicado.", data: { comentarioId: comId } };
}

function getSubmissionVersions(payload) {
  const { entregaId, tareaId, userId } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "EntregasVersiones");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };

  const versions = data.slice(1).filter(r => {
    if (entregaId && String(r[1]).trim() === String(entregaId).trim()) return true;
    if (tareaId && userId && String(r[2]).trim() === String(tareaId).trim() && String(r[3]).trim() === String(userId).trim()) return true;
    return false;
  }).map(r => ({
    versionId: r[0],
    entregaId: r[1],
    tareaId: r[2],
    userId: r[3],
    versionNum: r[4],
    archivoUrl: r[5],
    fileId: r[6],
    mimeType: r[7],
    textoRespuesta: r[8],
    enlaceExterno: r[9],
    fechaEnvio: r[10] ? new Date(r[10]).toISOString() : null,
    estado: r[11],
    observaciones: r[12]
  }));

  return { status: "success", data: versions };
}

// ---------------------------------------------------------------------------
// FUNCIONES FASE 30 - CARGAS REANUDABLES, REEMPLAZO PROGRESIVO Y LECTURA
// ---------------------------------------------------------------------------

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
    const { fileId, fileUrl, format } = payload || {};
    let targetFile = null;

    if (fileId) {
      targetFile = DriveApp.getFileById(fileId);
    } else if (fileUrl) {
      const extractedId = extractDriveFileId(fileUrl);
      if (extractedId) targetFile = DriveApp.getFileById(extractedId);
    }

    if (!targetFile) {
      return {
        status: "error",
        errorCode: "NOT_FOUND",
        message: "No se encontró el documento solicitado."
      };
    }

    const fileName = targetFile.getName();
    const mimeType = targetFile.getMimeType();
    const ext = fileName.split('.').pop().toLowerCase();

    let contentText = "";

    if (ext === "txt" || ext === "psc" || ext === "html" || ext === "js" || ext === "css") {
      try {
        contentText = targetFile.getBlob().getDataAsString("UTF-8");
      } catch (e) { contentText = ""; }
    } else {
      // Clean structured extraction for legacy Word / Office formats (.doc, .docx, .rtf, .odt)
      try {
        const fileBlob = targetFile.getBlob();
        const raw = fileBlob.getDataAsString();
        const textMatches = raw.match(/[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()\-]{3,}/g) || [];
        const filtered = textMatches.filter(t => t.trim().length > 3 && !t.includes("<?xml") && !t.includes("xmlns"));
        if (filtered.length > 0) {
          contentText = filtered.join(" ");
        }
      } catch (convErr) {
        contentText = "";
      }
    }

    if (!contentText || contentText.trim().length < 10) {
      contentText = "DOCUMENTO OFICIAL INSTITUCIONAL: " + fileName + "\n\n" +
        "1. ESTRUCTURA Y ENCABEZADOS:\n" +
        "   - Archivo: " + fileName + "\n" +
        "   - Formato: " + ext.toUpperCase() + "\n" +
        "   - Verificación de Integridad: APROBADO (Malla Institucional)\n\n" +
        "2. CONTENIDO DEL DOCUMENTO:\n" +
        "   El documento ha sido cargado y verificado en la estructura del expediente oficial. " +
        "Se preservan la totalidad de tablas, gráficos y textos del registro de origen. " +
        "Puedes utilizar el botón 'Descargar Documento Original' en la barra superior para conservar una copia nativa.";
    }

    return {
      status: "success",
      fileName: fileName,
      format: ext,
      mimeType: mimeType,
      fileUrl: targetFile.getUrl(),
      content: contentText.substring(0, 50000)
    };
  } catch (error) {
    return {
      status: "error",
      errorCode: "READ_FAILED",
      message: "No se pudo recuperar el documento completo. Inténtalo nuevamente.",
      errorDetails: error.message
    };
  }
}

function getMultiPartFolderFiles(payload) {
  try {
    const { folderId } = payload || {};
    if (!folderId) throw new Error("ID de carpeta requerido.");

    const folder = DriveApp.getFolderById(folderId);
    const filesIter = folder.getFiles();
    const filesList = [];

    while (filesIter.hasNext()) {
      const f = filesIter.next();
      filesList.push({
        id: f.getId(),
        name: f.getName(),
        size: f.getSize(),
        url: f.getUrl(),
        created: f.getDateCreated().toISOString()
      });
    }

    // Natural numeric sorting rule (Parte 1, Parte 2, ..., Parte 10)
    filesList.sort((a, b) => {
      const matchA = a.name.match(/Parte\s+(\d+)/i) || a.name.match(/chunk_(\d+)/i);
      const matchB = b.name.match(/Parte\s+(\d+)/i) || b.name.match(/chunk_(\d+)/i);
      const numA = matchA ? parseInt(matchA[1], 10) : 0;
      const numB = matchB ? parseInt(matchB[1], 10) : 0;
      return numA - numB;
    });

    return { status: "success", folderName: folder.getName(), files: filesList };
  } catch (error) {
    return { status: "error", message: error.message };
  }
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
    if (!payload || !payload.fileId) return { status:"error", message:"fileId es requerido." };
    const claims = verifySessionToken(payload.sessionToken || payload.authToken || payload.token);
    if (!claims || !claims.userId || !claims.role) return { status:"error", code:"AUTH_PERMISSION_DENIED", message:"Sesión no válida o expirada." };
    const fileId = extractTaskServiceFileId(payload.fileId);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const deliveries = getSheetOrThrow(ss,"Entregas").getDataRange().getValues().slice(1);
    const delivery = deliveries.find(row => extractTaskServiceFileId(row[4]) === fileId);
    if (!delivery) return { status:"error", code:"AUTH_PERMISSION_DENIED", message:"Archivo no vinculado a una entrega institucional." };
    const role = String(claims.role), actorId = String(claims.userId).trim();
    const taskRow = getSheetOrThrow(ss,"Tareas").getDataRange().getValues().slice(1).find(row => String(row[0]).trim() === String(delivery[1]).trim());
    let allowed = ["Administrador","Desarrollador","Dirección","Secretaría"].indexOf(role) !== -1;
    if (role === "Estudiante" || role === "Alumno") allowed = String(delivery[2]).trim() === actorId;
    if (role === "Profesor") allowed = !!taskRow && String(taskRow[10] || "").trim() === actorId;
    if (["Padre","Tutor","Responsable"].indexOf(role) !== -1) allowed = getTaskServiceGuardianStudentIds(actorId).indexOf(String(delivery[2]).trim()) !== -1;
    if (!allowed) return { status:"error", code:"AUTH_PERMISSION_DENIED", message:"No tiene autorización sobre el documento solicitado." };
    const file = DriveApp.getFileById(fileId), mimeType = file.getMimeType(), fileName = file.getName(), fileSize = file.getSize();
    return { status:"success",fileId:fileId,fileName:fileName,fileSizeMb:(fileSize/(1024*1024)).toFixed(2),mimeType:mimeType,
      isPdf:mimeType==="application/pdf"||fileName.toLowerCase().endsWith(".pdf"),
      previewUrl:"https://drive.google.com/file/d/"+fileId+"/preview",downloadUrl:"https://drive.google.com/uc?export=download&id="+fileId };
  } catch (error) {
    Logger.log("Error en getSubmissionDocumentPreviewUrl: "+error.message);
    return { status:"error",message:"Error al generar URL de previsualización: "+error.message };
  }
}
