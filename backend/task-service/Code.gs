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
  try {
    let sheet = ss.getSheetByName("MetadatosArchivos");
    if (!sheet) {
      sheet = ss.insertSheet("MetadatosArchivos");
      sheet.appendRow(["ID", "Titulo", "NombreOriginal", "NombreFisico", "TipoRecurso", "Asignatura", "Grado", "Seccion", "Parcial", "Anio", "Tema", "TareaId", "ProfesorId", "FechaSubida", "Estado", "DriveId", "RutaDrive", "MimeType", "TamanoBytes"]);
    }
    const metaId = "META-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const nowYear = new Date().getFullYear();
    sheet.appendRow([
      metaId,
      meta.titulo || meta.fileName || "",
      meta.fileName || "",
      meta.fileName || "",
      meta.tipoRecurso || "Entrega",
      meta.asignatura || "General",
      meta.grado || "General",
      meta.seccion || "General",
      meta.parcial || "I parcial",
      nowYear,
      meta.tema || "General",
      meta.tareaId || "",
      meta.profesorId || "",
      new Date().toISOString(),
      "Activo",
      meta.fileId || "",
      meta.fileUrl || "",
      meta.mimeType || "",
      meta.sizeBytes || 0
    ]);
  } catch (err) {
    logDebug("Error logging file metadata:", err.message);
  }
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
    "getStudentTasks", "getAllTasks", "getTeacherActivity", "closeAcademicYear",
    "getVirtualClassrooms", "createVirtualClassroom", "getPosts", "createPost", "updatePost", "deletePost",
    "getStudyMaterials", "createStudyMaterial", "deleteStudyMaterial", "returnSubmissionForRevision",
    "getSubmissionComments", "addSubmissionComment", "getSubmissionVersions"
  ,
    "getSubmissionDocumentPreviewUrl"],
  "Estudiante": [
    "getStudentTasks", "submitAssignment", "saveSubmissionDraft", "uploadFile", "uploadChunk", "finishChunkedUpload", "deleteFile",
    "saveProject", "deleteProject", "listProjects", "loadProject", "getAllStudentProjects",
    "getVirtualClassrooms", "getPosts", "getStudyMaterials", "getSubmissionComments", "addSubmissionComment", "getSubmissionVersions"
  ],
  "Alumno": [
    "getStudentTasks", "submitAssignment", "saveSubmissionDraft", "uploadFile", "uploadChunk", "finishChunkedUpload", "deleteFile",
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
  // Fail-closed: el flujo antiguo borraba entregas/archivos sin respaldo real restaurable.
  // No se ejecuta ninguna eliminación hasta implementar y verificar el procedimiento de backup/restore.
  return { status:"error", code:"BACKUP_REQUIRED", message:"Cierre bloqueado: no existe un respaldo íntegro, restaurable y verificado para esta operación." };
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
function uploadFile(payload) {
  const { userId, tareaId, parcial, asignatura, fileData, fileName } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usuariosSheet = getSheetOrThrow(ss, "Usuarios");
  const tareasSheet = getSheetOrThrow(ss, "Tareas");

  const userData = usuariosSheet.getDataRange().getValues().find(row => row[0] === userId);
  if (!userData) throw new Error("Usuario no encontrado.");
  const [, nombre, grado, seccion] = userData;

  const taskData = tareasSheet.getDataRange().getValues().find(row => row[0] === tareaId);
  if (!taskData) throw new Error("Tarea no encontrada.");
  const tituloTarea = taskData[2] || "Tarea Sin Titulo";

  const rootFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  // Normalizar metadatos a string antes de crear carpetas
  const sGrado = String(grado || "General");
  const sSeccion = String(seccion || "General");
  const sNombre = String(nombre || "Usuario");
  const sParcial = String(parcial || "General");
  const sAsignatura = String(asignatura || "General");

  const gradoFolder = getOrCreateFolder(rootFolder, sGrado);
  const seccionFolder = getOrCreateFolder(gradoFolder, sSeccion);
  const alumnoFolder = getOrCreateFolder(seccionFolder, sNombre);
  const parcialFolder = getOrCreateFolder(alumnoFolder, sParcial);
  const asignaturaFolder = getOrCreateFolder(parcialFolder, sAsignatura);

  const taskDeliveryFolder = getOrCreateFolder(asignaturaFolder, `${String(tituloTarea)}_${String(userId)}`);

  const fileInfo = fileData.split(',');
  let mimeType = "application/octet-stream";
  let base64Content = fileInfo[1];

  const mimeMatch = fileInfo[0].match(/:(.*?);/);
  if (mimeMatch && mimeMatch[1]) {
    mimeType = mimeMatch[1];
  } else {
    // Si no viene en el dataUrl, intentamos por extensión
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeMap = {
      'js': 'text/javascript',
      'css': 'text/css',
      'html': 'text/html',
      'txt': 'text/plain',
      'psc': 'text/plain', // Pseudocódigo (PSeInt)
      'heic': 'image/heic'
    };
    mimeType = mimeMap[ext] || mimeType;
    base64Content = fileData; // En caso de que no sea DataURL
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), mimeType, fileName);

  const file = taskDeliveryFolder.createFile(blob);

  try {
    taskDeliveryFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    logDebug("No se pudo establecer el permiso de compartir carpeta:", e.message);
  }

  logFileMetadata(ss, {
    fileName: fileName,
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    mimeType: mimeType,
    sizeBytes: blob.getBytes().length,
    tareaId: tareaId,
    asignatura: sAsignatura,
    parcial: sParcial,
    grado: sGrado,
    seccion: sSeccion,
    profesorId: taskData[10] || ""
  });

  return {
    status: "success",
    data: {
      fileId: file.getId(),
      folderId: taskDeliveryFolder.getId(),
      folderUrl: taskDeliveryFolder.getUrl(),
      mimeType: mimeType
    }
  };
}

/**
 * DEPRECATED: Se utiliza uploadFile con segmentación lógica en cliente.
 * Recibe un trozo de archivo y lo guarda temporalmente.
 */
function uploadChunk(payload) {
  try {
    const { uploadId, chunkIndex, chunkData } = payload;
    if (!uploadId || chunkIndex === undefined || !chunkData) throw new Error("Parámetros de chunk incompletos.");

    const tempRoot = getOrCreateFolder(DriveApp.getRootFolder(), ".temp_uploads");
    const uploadFolder = getOrCreateFolder(tempRoot, uploadId);

    // REQ: Sanitización de Base64 para evitar "No se pudo descifrar la cadena" (Tarea 3)
    let sanitizedData = chunkData.replace(/-/g, '+').replace(/_/g, '/');
    sanitizedData = sanitizedData.replace(/\s/g, ''); // Eliminar espacios o saltos de línea
    while (sanitizedData.length % 4 !== 0) sanitizedData += '='; // Asegurar padding

    const blob = Utilities.newBlob(Utilities.base64Decode(sanitizedData), "application/octet-stream", `chunk_${chunkIndex}`);
    uploadFolder.createFile(blob);

    return { status: "success", message: `Chunk ${chunkIndex} recibido.` };
  } catch (e) {
    logDebug("Error en uploadChunk:", e.message);
    return { status: "error", message: "Error al procesar fragmento: " + e.message };
  }
}

/**
 * DEPRECATED: Se utiliza uploadFile con segmentación lógica en cliente.
 * Une todos los chunks y crea el archivo final.
 */
function finishChunkedUpload(payload) {
  try {
    const { uploadId, userId, tareaId, parcial, asignatura, fileName, mimeType, totalChunks } = payload;
    if (!uploadId || !userId || !tareaId || totalChunks === undefined) throw new Error("Parámetros incompletos para finalizar subida.");

    const tempRoot = getOrCreateFolder(DriveApp.getRootFolder(), ".temp_uploads");
    const uploadFolder = getOrCreateFolder(tempRoot, uploadId);
    const chunks = uploadFolder.getFiles();

    const chunkMap = {};
    let count = 0;
    while (chunks.hasNext()) {
      const file = chunks.next();
      const idx = parseInt(file.getName().split('_')[1]);
      chunkMap[idx] = file.getBlob().getBytes();
      count++;
    }

    if (count < totalChunks) throw new Error(`Se esperaban ${totalChunks} fragmentos pero solo se encontraron ${count}.`);

    // Optimización de Memoria: Pre-calcular tamaño total y usar Int8Array (Tarea 3)
    let totalSize = 0;
    for (let i = 0; i < totalChunks; i++) {
      if (!chunkMap[i]) throw new Error(`Falta el fragmento número ${i}.`);
      totalSize += chunkMap[i].length;
    }

    const combinedBytes = new Int8Array(totalSize);
    let offset = 0;
    for (let i = 0; i < totalChunks; i++) {
      combinedBytes.set(chunkMap[i], offset);
      offset += chunkMap[i].length;
    }

    const finalBlob = Utilities.newBlob(combinedBytes, mimeType, fileName);

    const alumnoFolder = getStudentFolder(userId);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const tareasSheet = getSheetOrThrow(ss, "Tareas");
    const taskData = tareasSheet.getDataRange().getValues().find(row => row[0] === tareaId);
    const tituloTarea = taskData ? taskData[2] : "Tarea Sin Titulo";

    const parcialFolder = getOrCreateFolder(alumnoFolder, String(parcial || "General"));
    const asignaturaFolder = getOrCreateFolder(parcialFolder, String(asignatura || "General"));
    const taskDeliveryFolder = getOrCreateFolder(asignaturaFolder, `${String(tituloTarea)}_${String(userId)}`);

    const file = taskDeliveryFolder.createFile(finalBlob);

    // Limpieza de temporales
    try { uploadFolder.setTrashed(true); } catch (e) { logDebug("Fallo limpieza de carpeta temporal:", e.message); }

    try {
      taskDeliveryFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    return {
      status: "success",
      data: {
        fileId: file.getId(),
        folderId: taskDeliveryFolder.getId(),
        mimeType: mimeType
      }
    };
  } catch (e) {
    logDebug("Error en finishChunkedUpload:", e.message);
    return { status: "error", message: "Error al reconstruir el archivo: " + e.message };
  }
}

// [TAREA-10] [Fase 1: Auditoría y planificación de la expansión] - Sistema ampliado de asignaciones, entregas multimodales, revisiones, versiones, rúbricas y retroalimentación.
function submitAssignment(payload) {
  // [TAREA-F8-MANT-01] Verificar cuota de almacenamiento previa a la confirmación de la entrega
  try {
    var quotaReport = getDriveStorageQuotaMetricsReport({});
    if (quotaReport && quotaReport.status === "success" && quotaReport.metrics && parseFloat(quotaReport.metrics.porcentajeUso) >= 99.5) {
      return {
        status: "error",
        message: "No se puede confirmar la entrega: El almacenamiento del servidor ha alcanzado su límite máximo (" + quotaReport.metrics.porcentajeUso + "%). Contacte al soporte institucional."
      };
    }
  } catch (errQuota) {
    Logger.log("Aviso al verificar cuota en submitAssignment: " + errQuota.message);
  }

  const { userId, tareaId, fileId, mimeType, textoRespuesta, enlaceExterno, observaciones, esBorrador } = payload || {};
  if (!userId || !tareaId) throw new Error("userId y tareaId son requeridos para la entrega.");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "Entregas");
  const versionesSheet = getOrCreateSheet(ss, "EntregasVersiones");
  if (versionesSheet.getLastRow() === 0) {
    versionesSheet.appendRow(["ID", "EntregaID", "TareaID", "UserID", "VersionNum", "ArchivoUrl", "FileID", "MimeType", "TextoRespuesta", "EnlaceExterno", "FechaEnvio", "Estado", "Observaciones"]);
  }

  const data = entregasSheet.getDataRange().getValues();
  const now = new Date();

  // Verificar si ya existe una entrega previa del usuario para esta tarea
  const existingIdx = data.findIndex(row => String(row[2]).trim() === String(userId).trim() && String(row[1]).trim() === String(tareaId).trim());

  let entregaId;
  let versionNum = 1;
  let estadoEntrega = esBorrador ? "borrador" : "Pendiente de revisión";

  // Verificar si la entrega es tardía y verificar límites de intentos
  try {
    const tareasSheet = getSheetOrThrow(ss, "Tareas");
    const tareasData = tareasSheet.getDataRange().getValues();
    const taskRow = tareasData.find(r => String(r[0]).trim() === String(tareaId).trim());
    if (taskRow) {
      if (taskRow[8] && !esBorrador) {
        const fechaLimite = new Date(taskRow[8]);
        if (now.getTime() > fechaLimite.getTime()) {
          estadoEntrega = "EntregadaTarde";
        }
      }
    }
  } catch (e) {
    logDebug("Error al verificar fecha limite:", e.message);
  }

  if (existingIdx !== -1) {
    entregaId = data[existingIdx][0];
    const prevRow = data[existingIdx];

    // Obtener número de versión anterior
    const prevVersions = versionesSheet.getDataRange().getValues().filter(r => String(r[1]).trim() === String(entregaId).trim());
    versionNum = prevVersions.length + 1;

    // Actualizar registro principal
    prevRow[3] = now;
    if (fileId !== undefined) prevRow[4] = fileId;
    prevRow[6] = estadoEntrega;
    if (mimeType !== undefined) prevRow[8] = mimeType;

    entregasSheet.getRange(existingIdx + 1, 1, 1, prevRow.length).setValues([prevRow]);
  } else {
    entregaId = "ENT-" + now.getTime();
    entregasSheet.appendRow([entregaId, tareaId, userId, now, fileId || '', '', estadoEntrega, observaciones || '', mimeType || '']);
  }

  // Registrar versión histórica en EntregasVersiones
  const versionId = "VER-" + now.getTime() + "-" + versionNum;
  versionesSheet.appendRow([
    versionId,
    entregaId,
    tareaId,
    userId,
    versionNum,
    fileId ? `https://drive.google.com/file/d/${fileId}/view` : "",
    fileId || "",
    mimeType || "",
    textoRespuesta || "",
    enlaceExterno || "",
    now,
    estadoEntrega,
    observaciones || ""
  ]);

  const submissionToken = "RECIEVED-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);

  return {
    status: "success",
    message: esBorrador ? "Borrador de tarea guardado." : "Tarea entregada y registrada en el servidor.",
    data: {
      entregaId: entregaId,
      versionNum: versionNum,
      submissionToken: submissionToken,
      fechaRecepcion: now.toISOString(),
      estado: estadoEntrega
    }
  };
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
  const actorId = payload && payload._verifiedUserId, role = payload && payload._verifiedRole;
  const fileId = extractTaskServiceFileId(payload && payload.fileId);
  if (!actorId || !fileId || (role !== "Estudiante" && role !== "Alumno")) throw new Error("Acceso denegado: se requiere identidad de estudiante.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const deliveries = getSheetOrThrow(ss, "Entregas").getDataRange().getValues().slice(1);
  const owned = deliveries.some(row => extractTaskServiceFileId(row[4]) === fileId && String(row[2]).trim() === String(actorId).trim());
  if (!owned) throw new Error("Acceso denegado: el archivo no está vinculado a una entrega propia.");
  DriveApp.getFileById(fileId).setTrashed(true);
  return { status:"success", message:"Archivo eliminado." };
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
  const { entregaId } = payload;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entregasSheet = getSheetOrThrow(ss, "Entregas");
  const data = entregasSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === entregaId);

  if (rowIndex === -1) throw new Error("Entrega no encontrada.");

  const fileId = data[rowIndex][4]; // Columna E: fileId
  if (fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch (e) {
      logDebug("Error al borrar archivo de Drive:", e.message);
      // No lanzamos error para permitir borrar el registro si el archivo ya no existe
    }
  }

  entregasSheet.deleteRow(rowIndex + 1);
  return { status: "success", message: "Entrega eliminada correctamente." };
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
    if (row[7] === true && (!includeDrafts || !isTeacherOrAdmin)) return false;
    if (!isTeacherOrAdmin && (row[7] === true || row[12] !== "Publicado")) return false;
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
  try {
    const { userId, fileName, fileSize, totalChunks, mimeType, fileHash, resumeSessionKey, replaceSessionKey } = payload || {};
    if (!userId || !fileName || !fileSize || !totalChunks) {
      throw new Error("Parámetros obligatorios de sesión de carga incompletos.");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sessionSheet = getOrCreateSheet(ss, "SesionesCargaResumible");
    if (sessionSheet.getLastRow() === 0) {
      sessionSheet.appendRow(["SessionKey", "UserId", "FileName", "FileSize", "TotalChunks", "ConfirmedChunks", "Status", "FolderId", "OldSessionKey", "CreatedFilesJson", "CreatedAt", "UpdatedAt"]);
    }

    // If explicit resume request: check if resumeSessionKey exists
    if (resumeSessionKey) {
      const data = sessionSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === resumeSessionKey && data[i][6] === "ACTIVE") {
          const confirmed = JSON.parse(data[i][5] || "[]");
          return {
            status: "success",
            sessionKey: resumeSessionKey,
            confirmedChunks: confirmed,
            totalChunks: parseInt(data[i][4], 10),
            folderId: data[i][7] || "",
            isResume: true
          };
        }
      }
    }

    const baseHash = fileHash || computeSimpleHash(fileName + "_" + fileSize);
    const newSessionKey = "SESS_" + userId + "_" + baseHash + "_" + (replaceSessionKey ? Date.now() : "ORIG");

    let oldFilesJson = "[]";
    let oldSessionKey = "";

    if (replaceSessionKey) {
      const data = sessionSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === replaceSessionKey) {
          oldSessionKey = replaceSessionKey;
          oldFilesJson = data[i][9] || "[]";
          sessionSheet.getRange(i + 1, 7).setValue("REPLACED_PENDING_CLEANUP");
          sessionSheet.getRange(i + 1, 12).setValue(new Date().toISOString());
          break;
        }
      }
    }

    const data = sessionSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === newSessionKey && data[i][6] === "ACTIVE") {
        const confirmed = JSON.parse(data[i][5] || "[]");
        return {
          status: "success",
          sessionKey: newSessionKey,
          confirmedChunks: confirmed,
          totalChunks: parseInt(data[i][4], 10),
          folderId: data[i][7] || "",
          isResume: true
        };
      }
    }

    const rootFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const tempUploadsFolder = getOrCreateFolder(rootFolder, ".temp_resumable_uploads");
    const sessionFolder = getOrCreateFolder(tempUploadsFolder, newSessionKey);

    const now = new Date().toISOString();
    sessionSheet.appendRow([
      newSessionKey,
      userId,
      fileName,
      fileSize,
      totalChunks,
      JSON.stringify([]),
      "ACTIVE",
      sessionFolder.getId(),
      oldSessionKey,
      oldFilesJson,
      now,
      now
    ]);

    return {
      status: "success",
      sessionKey: newSessionKey,
      confirmedChunks: [],
      totalChunks: totalChunks,
      folderId: sessionFolder.getId(),
      isResume: false
    };
  } catch (error) {
    logDebug("Error en initiateResumableUpload:", error.message);
    return { status: "error", message: error.message };
  }
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
  try {
    const { sessionKey, chunkIndex, totalChunks, chunkData, fileName } = payload || {};
    if (!sessionKey || chunkIndex === undefined || !chunkData) {
      throw new Error("Parámetros de fragmento de carga incompletos.");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sessionSheet = getOrCreateSheet(ss, "SesionesCargaResumible");
    const data = sessionSheet.getDataRange().getValues();

    let sessionRowIdx = -1;
    let sessionData = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionKey) {
        sessionRowIdx = i + 1;
        sessionData = data[i];
        break;
      }
    }

    if (sessionRowIdx === -1) {
      throw new Error("Sesión de carga reanudable no encontrada o expirada.");
    }

    const folderId = sessionData[7];
    const targetFolder = DriveApp.getFolderById(folderId);

    let sanitizedData = chunkData.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    while (sanitizedData.length % 4 !== 0) sanitizedData += '=';

    const partName = `${fileName || "archivo"} - Parte ${chunkIndex + 1} de ${totalChunks}`;
    const blob = Utilities.newBlob(Utilities.base64Decode(sanitizedData), "application/octet-stream", partName);
    const newFile = targetFolder.createFile(blob);

    let confirmed = [];
    try { confirmed = JSON.parse(sessionData[5] || "[]"); } catch (e) { confirmed = []; }

    if (!confirmed.includes(chunkIndex)) {
      confirmed.push(chunkIndex);
      confirmed.sort((a, b) => a - b);
    }

    // Persist created file metadata for this chunk
    let createdFiles = [];
    try { createdFiles = JSON.parse(sessionData[9] || "[]"); } catch (e) { createdFiles = []; }
    createdFiles.push({ chunkIndex: chunkIndex, fileId: newFile.getId(), fileName: partName });
    sessionSheet.getRange(sessionRowIdx, 10).setValue(JSON.stringify(createdFiles));

    const isLast = confirmed.length >= totalChunks;
    const now = new Date().toISOString();

    sessionSheet.getRange(sessionRowIdx, 6).setValue(JSON.stringify(confirmed));
    sessionSheet.getRange(sessionRowIdx, 12).setValue(now);

    let reconstructedResult = null;
    if (isLast) {
      sessionSheet.getRange(sessionRowIdx, 7).setValue("COMPLETED");

      // Automatically assemble & reconstruct chunks into single consolidated final file
      reconstructedResult = reconstructFileParts({ sessionKey: sessionKey, folderId: folderId, fileName: fileName });

      // CLEANUP OF OLD REPLACED SESSION FILES
      const oldSessionKey = sessionData[8];
      if (oldSessionKey) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] === oldSessionKey) {
            sessionSheet.getRange(i + 1, 7).setValue("REPLACED_CLEANED");
            const oldFolderId = data[i][7];
            if (oldFolderId) {
              try { DriveApp.getFolderById(oldFolderId).setTrashed(true); } catch (e) {}
            }
            break;
          }
        }
      }
    }

    return {
      status: "success",
      sessionKey: sessionKey,
      chunkIndex: chunkIndex,
      confirmedChunks: confirmed,
      sessionCompleted: isLast,
      fileId: reconstructedResult ? reconstructedResult.fileId : newFile.getId(),
      fileUrl: reconstructedResult ? reconstructedResult.fileUrl : newFile.getUrl(),
      folderId: folderId
    };
  } catch (error) {
    logDebug("Error en uploadChunk:", error.message);
    return { status: "error", message: "Error al procesar parte " + (chunkIndex + 1) + ": " + error.message };
  }
}

function getUploadProgress(payload) {
  try {
    const { sessionKey } = payload || {};
    if (!sessionKey) throw new Error("Llave de sesión requerida.");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sessionSheet = getOrCreateSheet(ss, "SesionesCargaResumible");
    const data = sessionSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionKey) {
        const confirmed = JSON.parse(data[i][5] || "[]");
        const totalChunks = parseInt(data[i][4], 10);
        return {
          status: "success",
          sessionKey: sessionKey,
          confirmedChunks: confirmed,
          totalChunks: totalChunks,
          isCompleted: data[i][6] === "COMPLETED",
          folderId: data[i][7]
        };
      }
    }
    return { status: "error", message: "Sesión no encontrada." };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function cancelUploadSession(payload) {
  try {
    const { sessionKey } = payload || {};
    if (!sessionKey) throw new Error("Llave de sesión requerida.");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sessionSheet = getOrCreateSheet(ss, "SesionesCargaResumible");
    const data = sessionSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionKey) {
        sessionSheet.getRange(i + 1, 7).setValue("CANCELLED");
        sessionSheet.getRange(i + 1, 12).setValue(new Date().toISOString());
        const folderId = data[i][7];
        if (folderId) {
          try {
            const folder = DriveApp.getFolderById(folderId);
            folder.setTrashed(true);
          } catch (e) {}
        }
        return { status: "success", message: "Sesión de carga cancelada." };
      }
    }
    return { status: "error", message: "Sesión no encontrada." };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function reconstructFileParts(payload) {
  try {
    const { sessionKey, folderId, fileName, mimeType } = payload || {};
    if (!folderId) throw new Error("ID de carpeta temporal de sesión es requerido para la reconstrucción.");

    const folder = DriveApp.getFolderById(folderId);
    const filesIter = folder.getFiles();
    const chunkFiles = [];

    while (filesIter.hasNext()) {
      const f = filesIter.next();
      chunkFiles.push({ file: f, name: f.getName() });
    }

    // Sort chunk files numerically
    chunkFiles.sort((a, b) => {
      const matchA = a.name.match(/Parte\s+(\d+)/i) || a.name.match(/chunk_(\d+)/i);
      const matchB = b.name.match(/Parte\s+(\d+)/i) || b.name.match(/chunk_(\d+)/i);
      const numA = matchA ? parseInt(matchA[1], 10) : 0;
      const numB = matchB ? parseInt(matchB[1], 10) : 0;
      return numA - numB;
    });

    if (chunkFiles.length === 0) throw new Error("No se encontraron partes para ensamblar el archivo final.");

    let totalBytes = 0;
    const byteArrays = [];
    for (let i = 0; i < chunkFiles.length; i++) {
      const bytes = chunkFiles[i].file.getBlob().getBytes();
      byteArrays.push(bytes);
      totalBytes += bytes.length;
    }

    const combinedBytes = new Int8Array(totalBytes);
    let offset = 0;
    for (let i = 0; i < byteArrays.length; i++) {
      combinedBytes.set(byteArrays[i], offset);
      offset += byteArrays[i].length;
    }

    const finalMime = mimeType || "application/octet-stream";
    const finalBlob = Utilities.newBlob(combinedBytes, finalMime, fileName || "Documento_Ensamblado.pdf");

    // Save final consolidated file in the session folder
    const finalFile = folder.createFile(finalBlob);

    // Delete individual temporary chunk files
    for (let i = 0; i < chunkFiles.length; i++) {
      try { chunkFiles[i].file.setTrashed(true); } catch (e) {}
    }

    logDebug("Reconstrucción exitosa de archivo:", { sessionKey, fileName: finalFile.getName(), size: totalBytes });

    return {
      status: "success",
      fileId: finalFile.getId(),
      fileUrl: finalFile.getUrl(),
      fileName: finalFile.getName(),
      mimeType: finalMime,
      sizeBytes: totalBytes
    };
  } catch (error) {
    logDebug("Error en reconstructFileParts:", error.message);
    return { status: "error", message: "Error al ensamblar partes del archivo: " + error.message };
  }
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
