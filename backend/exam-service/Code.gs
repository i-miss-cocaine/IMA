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
    if (name === "PreguntasExamen") sheet.appendRow(["PreguntaID", "ExamenID", "Tipo", "Texto", "OpcionesJSON", "RespuestaCorrecta", "Puntos", "AreaCurricular", "Dificultad", "BancoPreguntaID", "Etiquetas", "ObjetivosJSON", "CriteriosJSON", "BancoPreguntaVersion", "Asignatura", "Grado", "Tema"]);
    if (name === "BancoPreguntasExamen") sheet.appendRow(["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo", "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado", "ObjetivosJSON", "CriteriosJSON", "Version"]);
    if (name === "EntregasExamen") sheet.appendRow(["EntregaExamenID", "ExamenID", "UserID", "FechaEntrega", "RespuestasJSON", "NotaTotal", "Estado", "ComentarioDocente", "TemaAsociado", "AsignaturaAsociada"]);
    if (name === "AdjuntosExamen") sheet.appendRow(["AdjuntoID", "EntregaExamenID", "ExamenID", "PreguntaID", "UserID", "FileID", "Nombre", "MimeType", "TamanoBytes", "FechaRegistro"]);
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
  "Director": ["reviewPeriodGradebook", "reopenPeriodGradebook", "rectifyStudentGrade", "saveGradebookGrades", "getGradebookWeightConfiguration", "saveGradebookWeightConfiguration", "getCompetencyCatalog", "saveCompetencyCatalogItem"],
  "Secretaría": ["*"],
  "Profesor": [
    "createExam", "updateExam", "updateExamStatus", "deleteExam", "gradeExamSubmission", "deleteExamSubmission",
    "getAllExams", "getTeacherExamActivity", "getExamQuestions", "getStudentExams", "getExamResult",
    "getGradebookData", "getSaceGradebookSnapshot", "getSaceGradebookSnapshots", "saveGradebookGrades", "bulkApplyGradebookGrades", "getGradebookWeightConfiguration", "saveGradebookWeightConfiguration", "copyEvaluationSetupBetweenGroups", "getEvaluationCategories", "saveEvaluationCategory",
    "getRubrics", "saveRubric", "getCompetencyCatalog", "saveCompetencyCatalogItem", "saveCompetencyEvaluation", "getCompetencyEvaluations", "saveStudentRecovery", "closePeriodGradebook", "submitGradebookForReview",
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
    if (acctState !== "Activa") return null;
    var membershipCheck = verifyUserRoleMembershipClaim_(claims);
    if (membershipCheck === false) return null;
    if (membershipCheck === null && (!currentRole || currentRole !== claims.role.trim())) return null;
    return claims;
  } catch (e) {
    return null;
  }
}

// [TASK-153 / T153-S05-S06] Identidad, ámbito y propiedad departamental del recurso EXAM.
var EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();
function getVerifiedExamIdentity_(payload) {
  const token=getRequestSessionToken_(payload),cached=payload&&payload._imaVerifiedExamIdentity;
  if(cached&&cached.token===token&&cached.actor)return Object.assign({},cached.actor);
  const claims=getVerifiedRequestSessionClaims_(payload);
  if(!claims||!claims.userId||!claims.role)return {authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
  const actor={authorized:true,userId:String(claims.userId).trim(),role:String(claims.role).trim()};
  if(payload&&typeof payload==="object"){payload._verifiedUserId=actor.userId;payload._verifiedRole=actor.role;payload._imaVerifiedExamIdentity={token:token,actor:actor};}
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

function getVerifiedExamDepartmentScope_(payload, ss, identity) {
  const actor=identity||getVerifiedExamIdentity_(payload);
  return getVerifiedDepartmentScopeForSession_(payload,ss,actor);
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

function getRequestSessionToken_(payload) {
  return payload && (payload.sessionToken || payload.authToken || payload.token) || "";
}
function getVerifiedRequestSessionClaims_(payload) {
  const token = getRequestSessionToken_(payload);
  if (!token) return null;
  if (payload && payload._imaVerifiedSessionToken === token && payload._imaVerifiedSessionClaims) return payload._imaVerifiedSessionClaims;
  const claims = verifySessionToken(token);
  if (claims && payload && typeof payload === "object") { payload._imaVerifiedSessionToken = token; payload._imaVerifiedSessionClaims = claims; }
  return claims;
}
function getCachedRequestAuthorization_(action, payload) {
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
  delete payload._imaVerifiedExamIdentity;delete payload._verifiedUserId;delete payload._verifiedRole;
}
function validateRolePermission(action, payload) {
  const cachedAuthorization=getCachedRequestAuthorization_(action,payload);if(cachedAuthorization)return cachedAuthorization;
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
  if (dynamicCheck !== null) {
    if (dynamicCheck === true) { cacheRequestAuthorization_(action,payload,userRole); return { authorized: true, role: userRole }; }
  } else {
    const permitted = ROLE_PERMISSIONS[userRole] || [];
    if (permitted.indexOf("*") !== -1 || permitted.indexOf(action) !== -1) {
      cacheRequestAuthorization_(action,payload,userRole);
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
      const delegatedRole=userRole+" (Delegado de "+activeDel.delegante+")";cacheRequestAuthorization_(action,payload,delegatedRole);return {authorized:true,role:delegatedRole};
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

function getSaceSafeErrorCode_(error) {
  const candidate = String(error && error.message || "").trim();
  return /^[A-Z][A-Z0-9_]{1,95}$/.test(candidate) ? candidate : "INTERNAL_ERROR";
}

function doPost(e) {
  let saceGradebookRequest = false;
  try {
    if (!e || !e.postData || !e.postData.contents) return textResponse({ status: "error", message: "No se recibieron datos." });
    const request = JSON.parse(e.postData.contents);
    saceGradebookRequest = !!(request && (
      request.action === "getSaceGradebookSnapshot" || request.action === "getSaceGradebookSnapshots"
    ));
    const { action, payload } = request;
    clearRequestAuthorizationContext_(payload);
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
      case "getSaceGradebookSnapshot": result = getSaceGradebookSnapshot(payload); break;
      case "getSaceGradebookSnapshots": result = getSaceGradebookSnapshots(payload); break;
      case "saveGradebookGrades": result = saveGradebookGrades(payload); break;
      case "bulkApplyGradebookGrades": result = bulkApplyGradebookGrades(payload); break;
      case "copyEvaluationSetupBetweenGroups": result = copyEvaluationSetupBetweenGroups(payload); break;
      case "getEvaluationCategories": result = getEvaluationCategories(payload); break;
      case "saveEvaluationCategory": result = saveEvaluationCategory(payload); break;
      case "getRubrics": result = getRubrics(payload); break;
      case "saveRubric": result = saveRubric(payload); break;
      case "saveCompetencyEvaluation": result = saveCompetencyEvaluation(payload); break;
      case "getCompetencyCatalog": result = getCompetencyCatalog(payload); break;
      case "saveCompetencyCatalogItem": result = saveCompetencyCatalogItem(payload); break;
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
    if (saceGradebookRequest) {
      return textResponse({
        status: "error",
        code: getSaceSafeErrorCode_(err),
        message: "No fue posible completar la solicitud."
      });
    }
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
  const bankSheet = getOrCreateSheet(ss, "BancoPreguntasExamen");
  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const bankHeaders = ["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo", "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado"];
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  let bankRows = ensureExamQuestionBankSchema_(bankSheet);
  const ownershipRows = ownershipSheet.getDataRange().getValues();
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

function parseExamQuestionJsonField_(value, fallback, strict) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") {
    if (strict) throw new Error("QUESTION_OPTIONS_JSON_INVALID");
    return fallback;
  }
  try { return JSON.parse(value); }
  catch (_) {
    if (strict) throw new Error("QUESTION_OPTIONS_JSON_INVALID");
    return fallback;
  }
}
function parseExamQuestionListField_(value) {
  const parsed = parseExamQuestionJsonField_(value, null, false);
  if (Array.isArray(parsed)) return parsed.map(item => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map(item => item.trim()).filter(Boolean);
  return [];
}
function normalizeExamQuestionDefinition_(input, defaults) {
  const q = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const fallback = defaults && typeof defaults === "object" ? defaults : {};
  let type = normalizeString(q.tipo || q.preguntaTipo || fallback.tipo || "opcion_multiple").replace(/\s+/g, "_");
  if (type === "respuesta_breve" || type === "respuesta_corta") type = "completacion";
  const allowedTypes = ["opcion_multiple", "verdadero_falso", "completacion", "termino_pareado",
    "seleccion_multiple", "respuesta_extensa", "numerica", "ordenamiento", "adjunto"];
  if (allowedTypes.indexOf(type) === -1) throw new Error("QUESTION_TYPE_INVALID");
  const text = String(q.textoPregunta !== undefined ? q.textoPregunta : (q.texto !== undefined ? q.texto : fallback.textoPregunta || "")).trim();
  if (!text) throw new Error("QUESTION_TEXT_REQUIRED");
  let options = parseExamQuestionJsonField_(
    q.opcionesJSON !== undefined ? q.opcionesJSON : (q.opciones !== undefined ? q.opciones : fallback.opcionesJSON || {}),
    {}, true
  );
  if (!options || typeof options !== "object" || Array.isArray(options)) throw new Error("QUESTION_OPTIONS_INVALID");
  let answer = q.respuestaCorrecta !== undefined ? q.respuestaCorrecta : fallback.respuestaCorrecta;
  const optionKeys = Object.keys(options).filter(key => String(options[key] || "").trim() !== "");
  if (type === "opcion_multiple") {
    if (optionKeys.length < 2) throw new Error("QUESTION_OPTIONS_REQUIRED");
    answer = String(answer === undefined || answer === null ? "" : answer).trim();
    if (!answer || !Object.prototype.hasOwnProperty.call(options, answer)) throw new Error("QUESTION_CORRECT_ANSWER_INVALID");
  } else if (type === "verdadero_falso") {
    if (!optionKeys.length) options = { A: "Verdadero", B: "Falso" };
    const choices = Object.keys(options).map(key => ({ key, value: String(options[key]) }));
    const normalized = normalizeString(answer);
    const match = choices.find(choice => normalizeString(choice.key) === normalized || normalizeString(choice.value) === normalized);
    if (!match || !["verdadero", "falso"].includes(normalizeString(match.value))) throw new Error("QUESTION_CORRECT_ANSWER_INVALID");
    answer = match.value;
  } else if (type === "completacion") {
    answer = String(answer === undefined || answer === null ? "" : answer).trim();
    if (!answer) throw new Error("QUESTION_CORRECT_ANSWER_REQUIRED");
  } else if (type === "termino_pareado") {
    const concepts = Array.isArray(options.concepts) ? options.concepts : [];
    const definitions = Array.isArray(options.definitions) ? options.definitions : [];
    const mapping = parseExamQuestionJsonField_(answer, null, true);
    if (concepts.length < 2 || definitions.length < 2 || concepts.length !== definitions.length ||
        !mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new Error("QUESTION_MATCHING_SCHEMA_INVALID");
    const keys = Object.keys(mapping);
    if (keys.length !== concepts.length || keys.some(key => !/^\d+$/.test(key) ||
        Number(key) >= concepts.length || !/^\d+$/.test(String(mapping[key])) ||
        Number(mapping[key]) >= definitions.length)) throw new Error("QUESTION_MATCHING_ANSWER_INVALID");
    answer = JSON.stringify(mapping);
  } else if (type === "seleccion_multiple") {
    if (optionKeys.length < 2) throw new Error("QUESTION_OPTIONS_REQUIRED");
    answer = parseExamQuestionJsonField_(answer, null, true);
    if (!Array.isArray(answer) || !answer.length || new Set(answer.map(String)).size !== answer.length ||
        answer.some(key => !Object.prototype.hasOwnProperty.call(options, String(key)))) throw new Error("QUESTION_CORRECT_ANSWER_INVALID");
    answer = JSON.stringify(answer.map(String));
  } else if (type === "respuesta_extensa") {
    answer = "";
  } else if (type === "numerica") {
    const numericAnswer = Number(answer);
    const tolerance = Number(options.tolerance === undefined ? 0 : options.tolerance);
    if (answer === "" || answer === null || answer === undefined || !Number.isFinite(numericAnswer) ||
        !Number.isFinite(tolerance) || tolerance < 0) throw new Error("QUESTION_NUMERIC_ANSWER_INVALID");
    answer = String(numericAnswer);
    options.tolerance = tolerance;
  } else if (type === "ordenamiento") {
    const items = Array.isArray(options.items) ? options.items.map(String) : [];
    answer = parseExamQuestionJsonField_(answer, null, true);
    if (items.length < 2 || !Array.isArray(answer) || answer.length !== items.length ||
        new Set(items).size !== items.length || new Set(answer.map(String)).size !== items.length ||
        answer.some(item => items.indexOf(String(item)) === -1)) throw new Error("QUESTION_ORDER_SCHEMA_INVALID");
    answer = JSON.stringify(answer.map(String));
  } else if (type === "adjunto") {
    const accepted = Array.isArray(options.acceptedMimeTypes) ? options.acceptedMimeTypes.map(v => String(v).trim()).filter(Boolean) : [];
    const maxFiles = Number(options.maxFiles === undefined ? 1 : options.maxFiles);
    if (!accepted.length || accepted.some(value => !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(value)) ||
        !Number.isSafeInteger(maxFiles) || maxFiles < 1 || maxFiles > 5) throw new Error("QUESTION_ATTACHMENT_SCHEMA_INVALID");
    options.acceptedMimeTypes = accepted;
    options.maxFiles = maxFiles;
    answer = "";
  }
  const pointsRaw = q.puntosPredeterminados !== undefined ? q.puntosPredeterminados :
    (q.puntos !== undefined ? q.puntos : (fallback.puntosPredeterminados !== undefined ? fallback.puntosPredeterminados : 1));
  const points = Number(pointsRaw);
  if (!Number.isFinite(points) || points <= 0) throw new Error("QUESTION_POINTS_INVALID");
  const difficulty = String(q.dificultad !== undefined ? q.dificultad : (fallback.dificultad || "Media")).trim();
  if (!difficulty) throw new Error("QUESTION_DIFFICULTY_REQUIRED");
  const toList = (value, name) => {
    if (Array.isArray(value)) return value.map(item => String(item || "").trim()).filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      const parsed = parseExamQuestionJsonField_(value, null, false);
      if (Array.isArray(parsed)) return parsed.map(item => String(item || "").trim()).filter(Boolean);
      return value.split(",").map(item => item.trim()).filter(Boolean);
    }
    if (value === undefined || value === null || value === "") return [];
    throw new Error(name + "_INVALID");
  };
  const etiquetas = toList(q.etiquetas !== undefined ? q.etiquetas : fallback.etiquetas, "QUESTION_TAGS");
  const objetivos = toList(q.objetivos !== undefined ? q.objetivos : (q.objetivosJSON !== undefined ? q.objetivosJSON : fallback.objetivos), "QUESTION_OBJECTIVES");
  const criterios = toList(q.criterios !== undefined ? q.criterios : (q.criteriosJSON !== undefined ? q.criteriosJSON : fallback.criterios), "QUESTION_CRITERIA");
  const areaCurricular = String(q.areaCurricular !== undefined ? q.areaCurricular : fallback.areaCurricular || "").trim();
  const asignatura = String(q.asignatura !== undefined ? q.asignatura : fallback.asignatura || "").trim();
  const grado = String(q.grado !== undefined ? q.grado : fallback.grado || "").trim();
  const tema = String(q.tema !== undefined ? q.tema : fallback.tema || "").trim();
  return {
    tipo: type, textoPregunta: text, opciones: options, opcionesJSON: JSON.stringify(options),
    respuestaCorrecta: answer && typeof answer === "object" ? JSON.stringify(answer) : String(answer === undefined || answer === null ? "" : answer),
    puntosPredeterminados: points, areaCurricular, asignatura, grado, tema, dificultad: difficulty,
    etiquetas, objetivos, criterios
  };
}
function ensureExamQuestionBankSchema_(bankSheet) {
  const legacyHeaders = ["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo",
    "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado"];
  const currentHeaders = legacyHeaders.concat(["ObjetivosJSON", "CriteriosJSON", "Version"]);
  const rows = bankSheet.getDataRange().getValues();
  const headers = rows.length ? (rows[0] || []).map(value => String(value || "").trim()) : [];
  if (JSON.stringify(headers) === JSON.stringify(currentHeaders)) return rows;
  if (JSON.stringify(headers) === JSON.stringify(legacyHeaders)) {
    bankSheet.getRange(1, 14, 1, 3).setValues([currentHeaders.slice(13)]);
    return bankSheet.getDataRange().getValues();
  }
  throw new Error("QUESTION_BANK_SCHEMA_INVALID");
}

function manageQuestionBankUnlocked_(payload, context) {
  const p = payload || {};
  const action = String(p.accion || "").trim().toLowerCase();
  const bankSheet = context.bankSheet;
  if (context.bankRow) {
    const rowNumber = context.bankRow.rowIndex + 1;
    const existing = context.bankRow.row;
    if (action === "eliminar") {
      const oldBankStatus = existing[12];
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
      return { status: "success", message: "Pregunta desactivada en el banco de exámenes." };
    }
    const existingDefinition = {
      areaCurricular: existing[1], asignatura: existing[2], grado: existing[3], tema: existing[4],
      dificultad: existing[5], tipo: existing[6], textoPregunta: existing[7], opcionesJSON: existing[8],
      respuestaCorrecta: existing[9], etiquetas: existing[10], puntosPredeterminados: existing[11],
      objetivos: existing[13] || "[]", criterios: existing[14] || "[]"
    };
    const merged = {};
    Object.keys(existingDefinition).forEach(key => { merged[key] = Object.prototype.hasOwnProperty.call(p, key) ? p[key] : existingDefinition[key]; });
    if (Object.prototype.hasOwnProperty.call(p, "opciones")) merged.opcionesJSON = p.opciones;
    if (Object.prototype.hasOwnProperty.call(p, "objetivosJSON")) merged.objetivos = p.objetivosJSON;
    if (Object.prototype.hasOwnProperty.call(p, "criteriosJSON")) merged.criterios = p.criteriosJSON;
    const normalized = normalizeExamQuestionDefinition_(merged, existingDefinition);
    if (!normalized.areaCurricular || !normalized.asignatura || !normalized.grado || !normalized.tema) {
      throw new Error("QUESTION_BANK_CURRICULAR_REFERENCE_REQUIRED");
    }
    const currentVersion = Number(existing[15] || 1);
    if (!Number.isSafeInteger(currentVersion) || currentVersion < 1) throw new Error("QUESTION_BANK_VERSION_INVALID");
    const nextVersion = currentVersion + 1;
    bankSheet.getRange(rowNumber, 2, 1, 15).setValues([[
      normalized.areaCurricular, normalized.asignatura, normalized.grado, normalized.tema,
      normalized.dificultad, normalized.tipo, normalized.textoPregunta, normalized.opcionesJSON,
      normalized.respuestaCorrecta, JSON.stringify(normalized.etiquetas), normalized.puntosPredeterminados,
      "Activo", JSON.stringify(normalized.objetivos), JSON.stringify(normalized.criterios), nextVersion
    ]]);
    return { status: "success", bancoPreguntaId: String(existing[0]), version: nextVersion,
      message: "Pregunta del banco actualizada correctamente." };
  }
  if (action !== "crear") throw new Error("QUESTION_BANK_ACTION_INVALID");
  const normalized = normalizeExamQuestionDefinition_(p);
  if (!normalized.areaCurricular || !normalized.asignatura || !normalized.grado || !normalized.tema) {
    throw new Error("QUESTION_BANK_CURRICULAR_REFERENCE_REQUIRED");
  }
  const qId = "BNK-" + Utilities.getUuid();
  if (context.bankRows.slice(1).some(row => String(row[0] || "").trim() === qId) ||
      context.ownershipRows.slice(1).some(row => String(row[1] || "").trim() === context.scope.institutionId &&
        String(row[2] || "").trim().toUpperCase() === "BANCO_PREGUNTA" && String(row[3] || "").trim() === qId)) {
    throw new Error("QUESTION_BANK_ID_COLLISION");
  }
  const now = new Date().toISOString();
  const ownershipId = "OWN-" + Utilities.getUuid();
  const bankRow = [qId, normalized.areaCurricular, normalized.asignatura, normalized.grado, normalized.tema,
    normalized.dificultad, normalized.tipo, normalized.textoPregunta, normalized.opcionesJSON,
    normalized.respuestaCorrecta, JSON.stringify(normalized.etiquetas), normalized.puntosPredeterminados,
    "Activo", JSON.stringify(normalized.objetivos), JSON.stringify(normalized.criterios), 1];
  try {
    context.ownershipSheet.appendRow([ownershipId, context.scope.institutionId, "BANCO_PREGUNTA", qId,
      context.departmentId, "ACTIVE", context.actor.userId, now, now]);
    bankSheet.appendRow(bankRow);
  } catch (error) {
    let rollbackFailed = false;
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
  return { status: "success", bancoPreguntaId: qId, version: 1, message: "Pregunta añadida al banco de exámenes." };
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
  const sheet = getSheetOrThrow(ss, "BancoPreguntasExamen");
  const ownershipSheet = getSheetOrThrow(ss, "ResourceOwnership");
  const data = sheet.getDataRange().getValues();
  const ownershipRows = ownershipSheet.getDataRange().getValues();
  const bankHeaders = ["BancoPreguntaID", "AreaCurricular", "Asignatura", "Grado", "Tema", "Dificultad", "Tipo", "TextoPregunta", "OpcionesJSON", "RespuestaCorrecta", "Etiquetas", "PuntosPredeterminados", "Estado"];
  const ownershipHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  const legacyBankHeaders = bankHeaders;
  const extendedBankHeaders = bankHeaders.concat(["ObjetivosJSON", "CriteriosJSON", "Version"]);
  const actualBankHeaders = data.length ? (data[0] || []).map(value => String(value || "").trim()) : [];
  if (JSON.stringify(actualBankHeaders) !== JSON.stringify(legacyBankHeaders) &&
      JSON.stringify(actualBankHeaders) !== JSON.stringify(extendedBankHeaders)) throw new Error("QUESTION_BANK_SCHEMA_INVALID");
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
    let opciones = {};
    try { opciones = parseExamQuestionJsonField_(row[8] || "{}", {}, true); }
    catch (_) { Logger.log("[EXAM] QUESTION_BANK_ROW_SKIPPED reason=OPTIONS_JSON_INVALID"); return null; }
    if (!opciones || typeof opciones !== "object" || Array.isArray(opciones)) return null;
    const question = {
      bancoPreguntaId: row[0], areaCurricular: row[1], asignatura: row[2], grado: row[3],
      tema: row[4], dificultad: row[5], tipo: row[6], textoPregunta: row[7],
      opciones, etiquetas: parseExamQuestionListField_(row[10]),
      objetivos: parseExamQuestionListField_(row[13]), criterios: parseExamQuestionListField_(row[14]),
      version: Number(row[15] || 1), puntosPredeterminados: parseFloat(row[11]) || 1
    };
    if (context.canReadAnswerKey) question.respuestaCorrecta = row[9];
    return question;
  }).filter(Boolean);
  return { status: "success", preguntas };
}
function createExam(p) {
  p = p && typeof p === "object" && !Array.isArray(p) ? p : {};
  return withAuthorizedExamCreation_(p, context => createExamUnlocked_(p, context));
}
function withAuthorizedExamCreation_(p, mutation) {
  // Autorizar una sola vez en el límite de la acción y reutilizar el contexto
  // durante la escritura; el lock protege la integridad de datos, no reautoriza.
  const permission = validateRolePermission("createExam", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) throw new Error("RESOURCE_NOT_AVAILABLE");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const requestedDepartmentId = String(p.departmentId || p.departamentoId || "").trim();
  const departmentId = requestedDepartmentId || ((scope.departmentIds || []).length === 1 ? String(scope.departmentIds[0] || "").trim() : "");
  const departmentAllowed = !!departmentId && (scope.departmentIds || []).some(value => String(value || "").trim() === departmentId);
  if (!departmentAllowed) throw new Error("RESOURCE_SCOPE_DENIED");
  const context = { ss, scope, actor, departmentId };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_CREATE_LOCK_TIMEOUT");
  try {
    return mutation(context);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
function ensureExamQuestionsSchema_(questionSheet) {
  const legacyHeaders = ["PreguntaID", "ExamenID", "Tipo", "Texto", "OpcionesJSON", "RespuestaCorrecta",
    "Puntos", "AreaCurricular", "Dificultad", "BancoPreguntaID"];
  const previousHeaders = legacyHeaders.concat(["Etiquetas", "ObjetivosJSON", "CriteriosJSON", "BancoPreguntaVersion"]);
  const currentHeaders = previousHeaders.concat(["Asignatura", "Grado", "Tema"]);
  const rows = questionSheet.getDataRange().getValues();
  const headers = rows.length ? (rows[0] || []).map(value => String(value || "").trim()) : [];
  if (JSON.stringify(headers) === JSON.stringify(currentHeaders)) return rows;
  if (JSON.stringify(headers) === JSON.stringify(previousHeaders)) {
    questionSheet.getRange(1, 15, 1, 3).setValues([currentHeaders.slice(14)]);
    return questionSheet.getDataRange().getValues();
  }
  if (JSON.stringify(headers) === JSON.stringify(legacyHeaders)) {
    questionSheet.getRange(1, 11, 1, 7).setValues([currentHeaders.slice(10)]);
    return questionSheet.getDataRange().getValues();
  }
  throw new Error("EXAM_QUESTIONS_SCHEMA_INVALID");
}

function createExamUnlocked_(p, context) {
  const { ss, scope, actor, departmentId } = context;
  const examenes = getSheetOrThrow(ss, "Examenes");
  const preguntas = getSheetOrThrow(ss, "PreguntasExamen");
  const ownership = getSheetOrThrow(ss, "ResourceOwnership");
  const ownershipHeaders = ownership.getDataRange().getValues()[0] || [];
  const expectedHeaders = ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"];
  if (expectedHeaders.some((header, index) => String(ownershipHeaders[index] || "").trim() !== header)) {
    throw new Error("RESOURCE_OWNERSHIP_SCHEMA_INVALID");
  }
  const ownershipRows = ownership.getDataRange().getValues();
  const questionHeaders = ensureExamQuestionsSchema_(preguntas);
  const requestedQuestions = Array.isArray(p.preguntas) ? p.preguntas : [];
  const bankIds = requestedQuestions.map(q => String(q && (q.bancoPreguntaId || q.BancoPreguntaID) || "").trim()).filter(Boolean);
  let bankRows = [];
  if (bankIds.length) {
    const bankSheet = getSheetOrThrow(ss, "BancoPreguntasExamen");
    bankRows = ensureExamQuestionBankSchema_(bankSheet);
  }
  const preguntasData = requestedQuestions.map((q, i) => {
    const bankId = String(q && (q.bancoPreguntaId || q.BancoPreguntaID) || "").trim();
    let definition = q || {};
    let bankVersion = "";
    if (bankId) {
      const matches = bankRows.slice(1).filter(row => String(row[0] || "").trim() === bankId &&
        String(row[12] || "").trim().toUpperCase() === "ACTIVO");
      const owners = ownershipRows.slice(1).filter(row =>
        String(row[1] || "").trim() === String(scope.institutionId || "").trim() &&
        String(row[2] || "").trim().toUpperCase() === "BANCO_PREGUNTA" &&
        String(row[3] || "").trim() === bankId &&
        String(row[4] || "").trim() === departmentId &&
        String(row[5] || "").trim().toUpperCase() === "ACTIVE");
      if (matches.length !== 1 || owners.length !== 1) throw new Error("EXAM_QUESTION_BANK_REFERENCE_INVALID");
      const bank = matches[0];
      bankVersion = Number(bank[15] || 1);
      if (!Number.isSafeInteger(bankVersion) || bankVersion < 1) throw new Error("EXAM_QUESTION_BANK_VERSION_INVALID");
      definition = {
        areaCurricular: bank[1], asignatura: bank[2], grado: bank[3], tema: bank[4],
        dificultad: bank[5], tipo: bank[6], textoPregunta: bank[7], opcionesJSON: bank[8],
        respuestaCorrecta: bank[9], etiquetas: bank[10], puntosPredeterminados:
          q && q.puntosPredeterminados !== undefined ? q.puntosPredeterminados : bank[11],
        objetivos: bank[13] || "[]", criterios: bank[14] || "[]"
      };
    }
    const normalized = normalizeExamQuestionDefinition_(definition, {
      areaCurricular: p.areaCurricular, asignatura: p.asignatura, grado: p.gradoAsignado
    });
    if (!normalized.areaCurricular || !normalized.asignatura || !normalized.grado || !normalized.tema) {
      throw new Error("EXAM_QUESTION_CURRICULUM_REQUIRED");
    }
    if (p.asignatura && normalizeString(normalized.asignatura) !== normalizeString(p.asignatura)) {
      throw new Error("EXAM_QUESTION_SUBJECT_MISMATCH");
    }
    if (p.gradoAsignado && normalizeString(normalized.grado) !== normalizeString(p.gradoAsignado)) {
      throw new Error("EXAM_QUESTION_GRADE_MISMATCH");
    }
    if (p.areaCurricular && normalizeString(normalized.areaCurricular) !== normalizeString(p.areaCurricular)) {
      throw new Error("EXAM_QUESTION_AREA_MISMATCH");
    }
    return [
      "PRE-" + Utilities.getUuid(), "", normalized.tipo, normalized.textoPregunta,
      normalized.opcionesJSON, normalized.respuestaCorrecta, normalized.puntosPredeterminados,
      normalized.areaCurricular, normalized.dificultad, bankId,
      JSON.stringify(normalized.etiquetas), JSON.stringify(normalized.objetivos),
      JSON.stringify(normalized.criterios), bankVersion, normalized.asignatura, normalized.grado, normalized.tema
    ];
  });
  let examenId = "";
  let ownershipId = "";
  try {
    const now = new Date().toISOString();
    const uniqueSuffix = Utilities.getUuid();
    examenId = "EXM-" + Date.now() + "-" + uniqueSuffix;
    ownershipId = "OWN-" + Utilities.getUuid();
    const duplicate = ownershipRows.slice(1).some(row =>
      String(row[1] || "").trim() === String(scope.institutionId || "").trim() &&
      String(row[2] || "").trim().toUpperCase() === "EXAMEN" &&
      String(row[3] || "").trim() === examenId);
    if (duplicate || examenes.getDataRange().getValues().slice(1).some(row => String(row[0] || "").trim() === examenId)) {
      throw new Error("EXAM_CREATE_ID_COLLISION");
    }
    ownership.appendRow([ownershipId, scope.institutionId, "EXAMEN", examenId,
      departmentId, "ACTIVE", actor.userId, now, now]);
    examenes.appendRow([
      examenId, p.titulo, p.asignatura, p.gradoAsignado, p.seccionAsignada,
      p.fechaLimite, p.tiempoLimite || "", "Inactivo", actor.userId,
      p.parcial || "Primer Parcial", p.areaCurricular || "",
      p.duracionMinutos || p.tiempoLimite || "", p.intentosPermitidos || 1,
      p.esAleatorio === true || String(p.esAleatorio || "").toLowerCase() === "true"
    ]);
    if (preguntasData.length > 0) {
      const rows = preguntasData.map(row => { row[1] = examenId; return row; });
      preguntas.getRange(preguntas.getLastRow() + 1, 1, rows.length, 17).setValues(rows);
    }
    return { status: "success", examenId, departmentId, preguntasRegistradas: preguntasData.length };
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


var EXAM_GRADE_RECTIFICATION_HEADERS_ = ["RectificacionID","TipoEntrega","EntregaID","RecursoID","EstudianteID","NotaAnterior","NotaNueva","Motivo","ActorID","RolActor","Fecha"];
function normalizeExamGradeHistoryValue_(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : String(value).trim();
}
function getOrCreateExamGradeRectificationHistorySheet_(ss) {
  const name="HistorialRectificacionesEntregasExamen";
  let sheet=ss.getSheetByName(name);
  if(!sheet){try{sheet=ss.insertSheet(name);}catch(error){sheet=ss.getSheetByName(name);if(!sheet)throw new Error("EXAM_GRADE_RECTIFICATION_HISTORY_CREATE_FAILED");}}
  if(sheet.getLastRow()===0)sheet.appendRow(EXAM_GRADE_RECTIFICATION_HEADERS_);
  const values=sheet.getDataRange().getValues();
  if(!values.length||!Array.isArray(values[0])||values[0].length!==EXAM_GRADE_RECTIFICATION_HEADERS_.length||
    EXAM_GRADE_RECTIFICATION_HEADERS_.some((header,index)=>String(values[0][index]||"").trim()!==header))throw new Error("EXAM_GRADE_RECTIFICATION_HISTORY_SCHEMA_INVALID");
  return sheet;
}
function prepareExamGradeRectificationEvent_(context,previousGrade,nextGrade,reason) {
  const previous=normalizeExamGradeHistoryValue_(previousGrade), next=normalizeExamGradeHistoryValue_(nextGrade);
  if(previous===null||previous===next)return null;
  const reasonValue=typeof reason==="string"?reason.trim():"";
  if(!reasonValue)throw new Error("GRADE_RECTIFICATION_REASON_REQUIRED");
  if(reasonValue.length>1000)throw new Error("GRADE_RECTIFICATION_REASON_INVALID");
  const actorId=String(context&&context.actor&&context.actor.userId||"").trim();
  const actorRole=String(context&&context.actor&&context.actor.role||"").trim();
  const deliveryId=String(context&&context.entregaId||"").trim();
  const examId=String(context&&context.examId||"").trim();
  const studentId=String(context&&context.delivery&&context.delivery.row&&context.delivery.row[2]||"").trim();
  if(!actorId||!actorRole||!deliveryId||!examId||!studentId||!context.ss)throw new Error("GRADE_RECTIFICATION_CONTEXT_INVALID");
  const sheet=getOrCreateExamGradeRectificationHistorySheet_(context.ss);
  const rows=sheet.getDataRange().getValues();
  const rectificationId="RECT-EXAM-"+String(Utilities.getUuid()||"").trim();
  if(rectificationId==="RECT-EXAM-"||rows.slice(1).some(row=>String(row[0]||"").trim()===rectificationId))throw new Error("EXAM_GRADE_RECTIFICATION_ID_COLLISION");
  return {sheet:sheet,id:rectificationId,row:[rectificationId,"EXAMEN",deliveryId,examId,studentId,
    previousGrade===null||previousGrade===undefined?"":String(previousGrade),nextGrade===null||nextGrade===undefined?"":String(nextGrade),
    reasonValue,actorId,actorRole,new Date()]};
}
function appendExamGradeRectificationEvent_(event) {
  if(!event||!event.sheet||!Array.isArray(event.row))throw new Error("EXAM_GRADE_RECTIFICATION_EVENT_INVALID");
  try{event.sheet.appendRow(event.row);}catch(error){const rows=event.sheet.getDataRange().getValues();const matches=rows.slice(1).filter(row=>String(row[0]||"").trim()===event.id);if(matches.length===1)return;throw new Error("EXAM_GRADE_RECTIFICATION_AUDIT_WRITE_FAILED");}
  const rows=event.sheet.getDataRange().getValues();const matches=rows.slice(1).filter(row=>String(row[0]||"").trim()===event.id);
  if(matches.length!==1)throw new Error("EXAM_GRADE_RECTIFICATION_AUDIT_WRITE_FAILED");
}

function gradeExamSubmission(payload) {
  return withAuthorizedExamSubmissionMutation_(payload,"gradeExamSubmission",context=>{
    const p=payload&&typeof payload==="object"&&!Array.isArray(payload)?payload:{};
    const rawScore=p.calificacion;
    const score=typeof rawScore==="number"?rawScore:(typeof rawScore==="string"&&rawScore.trim()?Number(rawScore):NaN);
    if(!Number.isFinite(score)||score<0||score>100||Math.abs(score*100-Math.round(score*100))>1e-8)throw new Error("EXAM_GRADE_INVALID");
    const estado=typeof p.estado==="string"?p.estado.trim():"";
    const comentario=p.comentario==null?"":p.comentario;
    const temaAsociado=p.temaAsociado==null?"":p.temaAsociado;
    const asignaturaAsociada=p.asignaturaAsociada==null?"":p.asignaturaAsociada;
    if(!estado||estado.length>50||typeof comentario!=="string"||comentario.length>2000||
      typeof temaAsociado!=="string"||temaAsociado.length>120||typeof asignaturaAsociada!=="string"||asignaturaAsociada.length>120)throw new Error("EXAM_GRADE_METADATA_INVALID");
    const deliveryHeaders=context.deliverySheet.getDataRange().getValues()[0]||[];
    const expectedDeliveryHeaders=["EntregaExamenID","ExamenID","UserID","FechaEntrega","RespuestasJSON","NotaTotal","Estado","ComentarioDocente","TemaAsociado","AsignaturaAsociada"];
    if(deliveryHeaders.length<expectedDeliveryHeaders.length||
      expectedDeliveryHeaders.some((header,index)=>String(deliveryHeaders[index]||"").trim()!==header))throw new Error("EXAM_GRADE_DELIVERY_SCHEMA_INVALID");
    const oldRow=context.delivery.row.slice(), rowData=oldRow.slice();
    while(rowData.length<10)rowData.push("");
    const event=prepareExamGradeRectificationEvent_(context,rowData[5],score.toFixed(2),p.motivoRectificacion);
    rowData[5]=score.toFixed(2);rowData[6]=estado;rowData[7]=comentario;rowData[8]=temaAsociado;rowData[9]=asignaturaAsociada;
    context.deliverySheet.getRange(context.delivery.rowIndex+1,1,1,rowData.length).setValues([rowData]);
    if(event){try{appendExamGradeRectificationEvent_(event);}catch(error){const rollbackRow=oldRow.slice();while(rollbackRow.length<rowData.length)rollbackRow.push("");try{context.deliverySheet.getRange(context.delivery.rowIndex+1,1,1,rollbackRow.length).setValues([rollbackRow]);}catch(rollbackError){throw new Error("GRADE_RECTIFICATION_AUDIT_ROLLBACK_FAILED");}throw error;}}
    return {status:"success",message:"Examen calificado.",rectificacionRegistrada:!!event};
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

function getSaceExamSourceRevisionLocked_() {
  const p=PropertiesService.getScriptProperties(), k="IMA_SACE_EXAM_SOURCE_REVISION";
  let t=p.getProperty(k);
  if(!t){t=String(Utilities.getUuid()||"").trim()+":0";if(!/^[A-Za-z0-9-]{8,80}:0$/.test(t))throw Error("SACE_SOURCE_REVISION_EPOCH_INVALID");p.setProperty(k,t);}
  const m=/^([A-Za-z0-9-]{8,80}):([0-9]+)$/.exec(String(t));
  if(!m||!Number.isSafeInteger(Number(m[2]))||Number(m[2])<0)throw Error("SACE_SOURCE_REVISION_INVALID");
  return t;
}
function advanceSaceExamSourceRevisionLocked_() {
  const p=PropertiesService.getScriptProperties(),k="IMA_SACE_EXAM_SOURCE_REVISION",v=getSaceExamSourceRevisionLocked_().split(":"),n=Number(v[1]);
  if(n>=Number.MAX_SAFE_INTEGER)throw Error("SACE_SOURCE_REVISION_EXHAUSTED");
  const next=v[0]+":"+(n+1);p.setProperty(k,next);
  if(p.getProperty(k)!==next)throw Error("SACE_SOURCE_REVISION_WRITE_FAILED");return next;
}
function withAuthorizedExamRead_(action, payload, reader) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_READ_LOCK_TIMEOUT");
  try {
    const context = getAuthorizedExamReadContext_(action, payload);context.sourceRevision=getSaceExamSourceRevisionLocked_();return reader(context);
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
  const parseQuestionJson = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback;
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };
  const parseQuestionList = value => {
    const parsed = parseQuestionJson(value, []);
    return Array.isArray(parsed) ? parsed.map(item => String(item || "").trim()).filter(Boolean) : [];
  };
  const questions = questionRows.filter(row => String(row[0] || "").trim() && questionIdCounts[String(row[0]).trim()] === 1)
    .map(row => {
      const points = Number(row[6]);
      const version = Number(row[13]);
      return {
        preguntaId: row[0], tipo: row[2], texto: row[3],
        opciones: parseQuestionJson(row[4], {}) || {},
        puntos: Number.isFinite(points) && points > 0 ? points : 1,
        areaCurricular: String(row[7] || ""), dificultad: String(row[8] || ""),
        bancoPreguntaId: String(row[9] || ""),
        etiquetas: parseQuestionList(row[10]), objetivos: parseQuestionList(row[11]),
        criterios: parseQuestionList(row[12]),
        versionBanco: Number.isSafeInteger(version) && version > 0 ? version : null,
        asignatura: String(row[14] || ""), grado: String(row[15] || ""), tema: String(row[16] || "")
      };
    });
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
function calculateExamPsychometricAnalytics_(deliveryRows, questionRows, examId, examRow, userRows) {
  const idCounts = Object.create(null);
  (deliveryRows || []).forEach(row => { const id = String(row[0] || "").trim(); if (id) idCounts[id] = (idCounts[id] || 0) + 1; });
  const users = Object.create(null);
  (userRows || []).slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id && !users[id]) users[id] = { grade: String(row[2] || "").trim(), section: String(row[3] || "").trim() };
  });
  const itemStats = new Map(), byTopic = new Map(), bySubject = new Map(), byGroup = new Map();
  const analyzed = [], skipped = { malformed: 0, duplicate: 0, legacySnapshot: 0 };
  let manualCount = 0;
  const aggregate = (map, key, ratio) => {
    const label = String(key || "Sin clasificar");
    const current = map.get(label) || { categoria: label, respuestas: 0, suma: 0 };
    current.respuestas++; current.suma += ratio; map.set(label, current);
  };
  (deliveryRows || []).forEach(delivery => {
    const deliveryId = String(delivery[0] || "").trim();
    if (!deliveryId || String(delivery[1] || "").trim() !== examId) return;
    if (idCounts[deliveryId] !== 1) { skipped.duplicate++; return; }
    let answers;
    try { answers = JSON.parse(delivery[4] || "[]"); } catch (_) { skipped.malformed++; return; }
    if (!Array.isArray(answers)) { skipped.malformed++; return; }
    let snapshotQuestions;
    if (delivery[10] !== undefined && delivery[10] !== null && String(delivery[10]).trim() !== "") {
      try { snapshotQuestions = JSON.parse(delivery[10]); } catch (_) { skipped.malformed++; return; }
      if (!Array.isArray(snapshotQuestions) || snapshotQuestions.some(row => !Array.isArray(row) || String(row[1] || "").trim() !== examId)) {
        skipped.malformed++; return;
      }
    } else {
      skipped.legacySnapshot++;
      snapshotQuestions = (questionRows || []).filter(row => String(row[1] || "").trim() === examId);
    }
    const studentId = String(delivery[2] || "").trim();
    const student = users[studentId] || {};
    const group = [student.grade || String(examRow && examRow[3] || "").trim(),
      student.section || String(examRow && examRow[4] || "").trim()].filter(Boolean).join(" / ") || "Sin grupo";
    const itemRatios = Object.create(null);
    snapshotQuestions.forEach(question => {
      const questionId = String(question[0] || "").trim();
      if (!questionId) return;
      const answer = answers.find(item => String(item && item.preguntaId || "").trim() === questionId);
      const result = scoreExamQuestionAnswer_(question, answer ? answer.respuestaEstudiante : "");
      if (result.requiresManualReview) { manualCount++; return; }
      const ratio = result.maxPoints > 0 ? Math.max(0, Math.min(1, result.awardedPoints / result.maxPoints)) : 0;
      itemRatios[questionId] = ratio;
      let stat = itemStats.get(questionId);
      if (!stat) {
        stat = { preguntaId: questionId, tema: String(question[16] || "Sin tema"),
          asignatura: String(question[14] || (examRow && examRow[2]) || "Sin asignatura"),
          grado: String(question[15] || (examRow && examRow[3]) || ""),
          dificultad: String(question[8] || ""), attempts: 0, sum: 0, ratios: [] };
        itemStats.set(questionId, stat);
      }
      stat.attempts++; stat.sum += ratio; stat.ratios.push({ deliveryId, ratio });
      aggregate(byTopic, stat.tema, ratio);
      aggregate(bySubject, stat.asignatura, ratio);
      aggregate(byGroup, group, ratio);
    });
    const ratios = Object.keys(itemRatios).map(id => itemRatios[id]);
    if (ratios.length) analyzed.push({ deliveryId, studentId, group,
      totalRatio: ratios.reduce((sum, value) => sum + value, 0) / ratios.length, itemRatios });
  });
  analyzed.sort((a, b) => a.totalRatio - b.totalRatio);
  const groupSize = analyzed.length > 1 ? Math.max(1, Math.ceil(analyzed.length * 0.27)) : 0;
  const low = analyzed.slice(0, groupSize), high = groupSize ? analyzed.slice(-groupSize) : [];
  const porPregunta = Array.from(itemStats.values()).map(stat => {
    const mean = stat.attempts ? stat.sum / stat.attempts : 0;
    const meanFor = rows => rows.length ? rows.reduce((sum, row) => sum + (row.itemRatios[stat.preguntaId] || 0), 0) / rows.length : null;
    const highMean = meanFor(high), lowMean = meanFor(low);
    return { preguntaId: stat.preguntaId, tema: stat.tema, asignatura: stat.asignatura, grado: stat.grado,
      dificultadDeclarada: stat.dificultad, intentos: stat.attempts,
      indiceFacilidad: Number(mean.toFixed(4)), porcentajeAcierto: Number((mean * 100).toFixed(2)),
      indiceDiscriminacion: highMean === null || lowMean === null ? null : Number((highMean - lowMean).toFixed(4)) };
  });
  const toGroups = map => Array.from(map.values()).map(item => ({
    categoria: item.categoria, respuestas: item.respuestas,
    indiceFacilidad: Number((item.suma / item.respuestas).toFixed(4)),
    porcentajeAcierto: Number((item.suma / item.respuestas * 100).toFixed(2))
  })).sort((a, b) => a.categoria.localeCompare(b.categoria));
  const objectiveIds = Array.from(itemStats.keys());
  let fiabilidad = null;
  if (analyzed.length > 1 && objectiveIds.length > 1) {
    const variance = values => {
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    };
    const itemVariances = objectiveIds.map(id => variance(analyzed.map(row => row.itemRatios[id] || 0)));
    const totalScores = analyzed.map(row => objectiveIds.reduce((sum, id) => sum + (row.itemRatios[id] || 0), 0));
    const totalVariance = variance(totalScores);
    if (totalVariance > 0) fiabilidad = Number((objectiveIds.length / (objectiveIds.length - 1) *
      (1 - itemVariances.reduce((sum, value) => sum + value, 0) / totalVariance)).toFixed(4));
  }
  return {
    totalEntregasAnalizadas: analyzed.length, totalReactivosAnalizados: itemStats.size,
    reactivosPendientesRevision: manualCount, entregasOmitidas: skipped.malformed + skipped.duplicate,
    entregasSinSnapshot: skipped.legacySnapshot, alfaCronbach: fiabilidad,
    porPregunta, porTema: toGroups(byTopic), porAsignatura: toGroups(bySubject), porGrupo: toGroups(byGroup)
  };
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
  const psychometricQuestions = getSheetOrThrow(ss, "PreguntasExamen").getDataRange().getValues().slice(1)
    .filter(row => String(row[1] || "").trim() === examenId);
  const usersSheet = ss.getSheetByName("Usuarios");
  const psychometric = calculateExamPsychometricAnalytics_(deliveryRows, psychometricQuestions, examenId, examRow,
    usersSheet ? usersSheet.getDataRange().getValues() : []);
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
      analisisPsicometrico: psychometric,
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
    promedio, mediana, minimo, maximo, desviacionEstandar, porcentajeAprobacion, intervalos, curvaNormal,
    analisisPsicometrico: psychometric
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

function ensureExamSubmissionSnapshotSchema_(deliverySheet) {
  const legacyHeaders = ["EntregaExamenID", "ExamenID", "UserID", "FechaEntrega", "RespuestasJSON",
    "NotaTotal", "Estado", "ComentarioDocente", "TemaAsociado", "AsignaturaAsociada"];
  const currentHeaders = legacyHeaders.concat(["PreguntasSnapshotJSON"]);
  const rows = deliverySheet.getDataRange().getValues();
  const headers = rows.length ? (rows[0] || []).map(value => String(value || "").trim()) : [];
  if (JSON.stringify(headers) === JSON.stringify(currentHeaders)) return rows;
  if (JSON.stringify(headers) === JSON.stringify(legacyHeaders)) {
    deliverySheet.getRange(1, 11, 1, 1).setValues([["PreguntasSnapshotJSON"]]);
    return deliverySheet.getDataRange().getValues();
  }
  throw new Error("EXAM_DELIVERY_SNAPSHOT_SCHEMA_INVALID");
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
  // Construir una sola vez el contexto autorizado; el lock serializa intentos y escritura.
  const context = getExamReadContext_(payload, undefined, actor);
  if (!context || !context.studentActor || !context.actor ||
      String(context.actor.userId || "").trim() !== String(actor.userId).trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("EXAM_SUBMISSION_LOCK_TIMEOUT");
  try {
    return submitExamUnlocked_(payload, context);
  } finally {
    lock.releaseLock();
  }
}

function scoreExamQuestionAnswer_(question, studentAnswer) {
  const type = String(question && question[2] || "").trim();
  const rawPoints = Number(question && question[6]);
  const maxPoints = Number.isFinite(rawPoints) && rawPoints > 0 ? rawPoints : 1;
  const parse = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value !== "string") return value;
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };
  const options = parse(question && question[4], {}) || {};
  const correct = parse(question && question[5], question && question[5]);
  const manual = type === "respuesta_extensa" || type === "adjunto";
  if (manual) return { requiresManualReview: true, awardedPoints: 0, maxPoints };
  let ratio = 0;
  if (type === "opcion_multiple" || type === "verdadero_falso" || type === "completacion") {
    ratio = normalizeString(studentAnswer) === normalizeString(correct) ? 1 : 0;
  } else if (type === "numerica") {
    const studentNumber = Number(studentAnswer), correctNumber = Number(correct);
    const tolerance = Number(options.tolerance === undefined ? 0 : options.tolerance);
    ratio = Number.isFinite(studentNumber) && Number.isFinite(correctNumber) &&
      Number.isFinite(tolerance) && tolerance >= 0 && Math.abs(studentNumber - correctNumber) <= tolerance ? 1 : 0;
  } else if (type === "termino_pareado") {
    const studentMap = parse(studentAnswer, {}), correctMap = correct;
    if (!studentMap || typeof studentMap !== "object" || Array.isArray(studentMap) ||
        !correctMap || typeof correctMap !== "object" || Array.isArray(correctMap)) {
      ratio = 0;
    } else {
      const keys = Object.keys(correctMap);
      const hits = keys.filter(key => String(studentMap[key]) === String(correctMap[key])).length;
      ratio = keys.length ? hits / keys.length : 0;
    }
  } else if (type === "seleccion_multiple") {
    const studentValues = parse(studentAnswer, Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]);
    const correctValues = Array.isArray(correct) ? correct : [];
    const selected = new Set((Array.isArray(studentValues) ? studentValues : []).map(String));
    const expected = new Set(correctValues.map(String));
    const hits = Array.from(expected).filter(value => selected.has(value)).length;
    const incorrect = Array.from(selected).filter(value => !expected.has(value)).length;
    ratio = expected.size ? Math.max(0, hits - incorrect) / expected.size : 0;
  } else if (type === "ordenamiento") {
    const studentValues = parse(studentAnswer, Array.isArray(studentAnswer) ? studentAnswer : []);
    const expected = Array.isArray(correct) ? correct.map(String) : [];
    const actual = Array.isArray(studentValues) ? studentValues.map(String) : [];
    const hits = expected.filter((value, index) => actual[index] === value).length;
    ratio = expected.length ? hits / expected.length : 0;
  } else {
    throw new Error("QUESTION_TYPE_UNSUPPORTED");
  }
  ratio = Math.max(0, Math.min(1, ratio));
  return { requiresManualReview: false, awardedPoints: Number((maxPoints * ratio).toFixed(4)), maxPoints };
}


const EXAM_ATTACHMENT_MAX_BYTES_ = 5 * 1024 * 1024;
const EXAM_ATTACHMENT_HEADERS_ = ["AdjuntoID","EntregaExamenID","ExamenID","PreguntaID","UserID","FileID","Nombre","MimeType","TamanoBytes","FechaRegistro"];
function ensureExamAttachmentsSheet_(ss) {
  let sheet=ss.getSheetByName("AdjuntosExamen");
  if(!sheet){sheet=ss.insertSheet("AdjuntosExamen");sheet.appendRow(EXAM_ATTACHMENT_HEADERS_.slice());return sheet;}
  const rows=sheet.getDataRange().getValues(),headers=rows.length?rows[0].map(v=>String(v||"").trim()):[];
  if(JSON.stringify(headers)!==JSON.stringify(EXAM_ATTACHMENT_HEADERS_))throw new Error("EXAM_ATTACHMENT_SCHEMA_INVALID");
  return sheet;
}
function sanitizeExamAttachmentName_(value) {
  let name=String(value||"adjunto").replace(/[\\/\u0000-\u001f\u007f]/g,"_").replace(/\.\./g,"_").replace(/^\.+/,"").trim();
  return (name||"adjunto").slice(0,120);
}
function persistExamQuestionAttachments_(ss,questionRows,answers,deliveryId,examId,userId) {
  const questions=Object.create(null),answerByQuestion=Object.create(null);
  (questionRows||[]).forEach(row=>{questions[String(row[0]||"").trim()]=row;});
  (answers||[]).forEach(answer=>{const id=String(answer&&answer.preguntaId||"").trim();if(!id||answerByQuestion[id])throw new Error("SUBMISSION_INVALID");answerByQuestion[id]=answer;});
  const sheet=ensureExamAttachmentsSheet_(ss),createdFiles=[],records=[];
  let firstRow=0, appendedRows=0;
  const safeAnswers=(answers||[]).map(answer=>({preguntaId:String(answer.preguntaId),respuestaEstudiante:answer.respuestaEstudiante===undefined?"":answer.respuestaEstudiante}));
  try {
    Object.keys(answerByQuestion).forEach(questionId=>{
      const question=questions[questionId],answer=answerByQuestion[questionId],supplied=Array.isArray(answer.adjuntos)?answer.adjuntos:[];
      if(!question)throw new Error("SUBMISSION_INVALID");
      if(String(question[2]||"").trim()!=="adjunto"){if(supplied.length)throw new Error("EXAM_ATTACHMENT_NOT_ALLOWED");return;}
      let options={};try{options=JSON.parse(question[4]||"{}");}catch(_){throw new Error("EXAM_ATTACHMENT_QUESTION_INVALID");}
      const allowed=Array.isArray(options.acceptedMimeTypes)?options.acceptedMimeTypes.map(v=>String(v).trim().toLowerCase()):[];
      const maxFiles=Number(options.maxFiles||1);
      if(!allowed.length||supplied.length>maxFiles||supplied.length>5)throw new Error("EXAM_ATTACHMENT_COUNT_INVALID");
      supplied.forEach(item=>{
        const dataUrl=String(item&&item.dataUrl||""),match=/^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})$/i.exec(dataUrl);
        const mime=String(item&&item.mimeType||"").trim().toLowerCase();
        if(!match||match[1].toLowerCase()!==mime||allowed.indexOf(mime)===-1)throw new Error("EXAM_ATTACHMENT_MIME_NOT_ALLOWED");
        if(/^(application\/(x-msdownload|x-executable|x-sh|javascript)|text\/html)$/i.test(mime))throw new Error("EXAM_ATTACHMENT_MIME_NOT_ALLOWED");
        if(match[2].length>Math.ceil(EXAM_ATTACHMENT_MAX_BYTES_/3)*4+4)throw new Error("EXAM_ATTACHMENT_TOO_LARGE");
        const bytes=Utilities.base64Decode(match[2]);if(!bytes||!bytes.length||bytes.length>EXAM_ATTACHMENT_MAX_BYTES_)throw new Error("EXAM_ATTACHMENT_TOO_LARGE");
        const name=sanitizeExamAttachmentName_(item.name),file=DriveApp.createFile(Utilities.newBlob(bytes,mime,name));createdFiles.push(file);
        file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
        const id="EAT-"+Utilities.getUuid();records.push([id,deliveryId,examId,questionId,userId,file.getId(),name,mime,bytes.length,new Date()]);
        const target=safeAnswers.find(value=>value.preguntaId===questionId);
        if(target){if(!Array.isArray(target.adjuntos))target.adjuntos=[];target.adjuntos.push({adjuntoId:id,nombre:name,mimeType:mime,tamanoBytes:bytes.length});}
      });
    });
    firstRow=sheet.getLastRow()+1;
    records.forEach(record=>{sheet.appendRow(record);appendedRows++;});
    return {respuestas:safeAnswers,sheet,firstRow,rowCount:records.length,createdFiles};
  }catch(error){
    let rollbackFailed=false;
    if(appendedRows){try{sheet.deleteRows(firstRow,appendedRows);}catch(_){rollbackFailed=true;}}
    createdFiles.forEach(file=>{try{file.setTrashed(true);}catch(_){rollbackFailed=true;}});
    if(rollbackFailed)throw new Error("EXAM_ATTACHMENT_ROLLBACK_FAILED");
    throw error;
  }
}
function rollbackExamQuestionAttachments_(state) {
  if(!state)return;let failed=false;
  if(state.rowCount&&state.sheet){try{state.sheet.deleteRows(state.firstRow,state.rowCount);}catch(_){failed=true;}}
  (state.createdFiles||[]).forEach(file=>{try{file.setTrashed(true);}catch(_){failed=true;}});
  if(failed)throw new Error("EXAM_ATTACHMENT_ROLLBACK_FAILED");
}
function getExamQuestionAttachmentsForResult_(ss,delivery,examId,questionId) {
  const sheet=ss.getSheetByName("AdjuntosExamen");if(!sheet)return [];
  const rows=sheet.getDataRange().getValues().slice(1);
  const matches=rows.filter(row=>String(row[1]||"").trim()===String(delivery[0]||"").trim()&&String(row[2]||"").trim()===examId&&String(row[3]||"").trim()===questionId&&String(row[4]||"").trim()===String(delivery[2]||"").trim());
  const idCounts=Object.create(null),fileCounts=Object.create(null);
  rows.forEach(row=>{const id=String(row[0]||"").trim(),fid=String(row[5]||"").trim();if(id)idCounts[id]=(idCounts[id]||0)+1;if(fid)fileCounts[fid]=(fileCounts[fid]||0)+1;});
  return matches.map(row=>{
    const id=String(row[0]||"").trim(),fid=String(row[5]||"").trim();if(!id||idCounts[id]!==1||!fid||fileCounts[fid]!==1)return null;
    try{const blob=DriveApp.getFileById(fid).getBlob(),bytes=blob.getBytes(),mime=String(row[7]||"").trim().toLowerCase();
      if(!bytes||bytes.length>EXAM_ATTACHMENT_MAX_BYTES_||String(blob.getContentType()||"").toLowerCase()!==mime)return null;
      return {nombre:sanitizeExamAttachmentName_(row[6]),mimeType:mime,tamanoBytes:bytes.length,dataUrl:"data:"+mime+";base64,"+Utilities.base64Encode(bytes)};
    }catch(_){return null;}
  }).filter(Boolean);
}
function submitExamUnlocked_(payload, context) {
  const examenId = String((payload && payload.examenId) || "").trim();
  const respuestas = payload && payload.respuestas;
  if (!examenId || !Array.isArray(respuestas)) throw new Error("SUBMISSION_INVALID");
  const { actor, ss, studentActor, profile, scope } = context || getExamReadContext_(payload);
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
  const deliveryRowsWithHeaders = ensureExamSubmissionSnapshotSchema_(deliveriesSheet);
  const deliveries = deliveryRowsWithHeaders.slice(1);
  const previousAttempts = deliveries.filter(row => String(row[1]) === examenId && String(row[2]) === actor.userId).length;
  const configuredAttempts = parseInt(exam[12], 10);
  const allowedAttempts = Number.isSafeInteger(configuredAttempts) && configuredAttempts > 0 ? configuredAttempts : 1;
  if (previousAttempts >= allowedAttempts) throw new Error("EXAM_ATTEMPTS_EXHAUSTED");
  let earnedPoints = 0, totalPoints = 0, requiresManualReview = false;
  questionRows.forEach(question => {
    const answer = respuestas.find(item => String(item && item.preguntaId || "") === String(question[0] || ""));
    const result = scoreExamQuestionAnswer_(question, answer ? answer.respuestaEstudiante : "");
    earnedPoints += result.awardedPoints;
    totalPoints += result.maxPoints;
    requiresManualReview = requiresManualReview || result.requiresManualReview;
  });
  const nota = requiresManualReview ? "" : (totalPoints > 0 ? ((earnedPoints / totalPoints) * 100).toFixed(2) : "0");
  const safeActorId = String(actor.userId).replace(/[^A-Za-z0-9_-]/g, "_");
  const entregaExamenId = "EEX-" + Date.now() + "-" + safeActorId + "-" + (previousAttempts + 1);
  const questionSnapshot = questionRows.map(row => row.slice(0, 17));
  const hasAttachments = respuestas.some(answer => Array.isArray(answer && answer.adjuntos) && answer.adjuntos.length > 0);
  const attachmentState = hasAttachments ?
    persistExamQuestionAttachments_(ss, questionRows, respuestas, entregaExamenId, examenId, actor.userId) :
    { respuestas: respuestas.map(answer => ({ preguntaId: String(answer.preguntaId),
      respuestaEstudiante: answer.respuestaEstudiante === undefined ? "" : answer.respuestaEstudiante })) };
  try {
    deliveriesSheet.appendRow([entregaExamenId, examenId, actor.userId, new Date(),
      JSON.stringify(attachmentState.respuestas), nota, "Pendiente", "", "", "", JSON.stringify(questionSnapshot)]);
  } catch (error) {
    rollbackExamQuestionAttachments_(attachmentState);
    throw error;
  }
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
function getExamReadContext_(payload, requestedStudentId, verifiedActor) {
  const actor = verifiedActor || getVerifiedExamIdentity_(payload);
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
  let questions = getSheetOrThrow(ss, "PreguntasExamen").getDataRange().getValues().slice(1).filter(row => String(row[1]) === examId);
  if (delivery[10] !== undefined && delivery[10] !== null && String(delivery[10]).trim() !== "") {
    let snapshot;
    try { snapshot = JSON.parse(delivery[10]); } catch (_) { throw new Error("EXAM_QUESTION_SNAPSHOT_INVALID"); }
    if (!Array.isArray(snapshot) || snapshot.some(row => !Array.isArray(row) || String(row[1] || "").trim() !== examId)) {
      throw new Error("EXAM_QUESTION_SNAPSHOT_INVALID");
    }
    questions = snapshot;
  }
  const detailed = questions.map(question => {
    const answer = answers.find(item => item.preguntaId === question[0]), studentAnswer = answer ? answer.respuestaEstudiante : "";
    const scoreResult = scoreExamQuestionAnswer_(question, studentAnswer);
    const correct = scoreResult.requiresManualReview ? null :
      scoreResult.awardedPoints >= scoreResult.maxPoints;
    return { texto: question[3], tipo: question[2], respuestaEstudiante: studentAnswer, respuestaCorrecta: question[5],
      adjuntos: String(question[2] || "").trim() === "adjunto" ? getExamQuestionAttachmentsForResult_(ss, delivery, examId, String(question[0] || "").trim()) : [],
      esCorrecta: correct, puntosObtenidos: scoreResult.awardedPoints, puntosMaximos: scoreResult.maxPoints,
      score: scoreResult.requiresManualReview ? "Pendiente de revisión" :
        ((scoreResult.awardedPoints / scoreResult.maxPoints) * 100).toFixed(0) + "%" };
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
  const requestedDepartmentId = String((payload && payload.departmentId) || "").trim();
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
      if (!inScope || (requestedDepartmentId && departmentId !== requestedDepartmentId)) return;
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

function validateAnalyticalRubricCriteria_(criteria) {
  if (!Array.isArray(criteria) || criteria.length < 1 || criteria.length > 30) {
    throw new Error("RUBRIC_CRITERIA_INVALID");
  }
  const criterionNames = Object.create(null);
  criteria.forEach(criterion => {
    if (!criterion || typeof criterion !== "object" || Array.isArray(criterion)) {
      throw new Error("RUBRIC_CRITERIA_INVALID");
    }
    const name = String(criterion.criterio || "").trim();
    const levels = criterion.niveles;
    if (!name || name.length > 160 || !Array.isArray(levels) || levels.length < 2 || levels.length > 5) {
      throw new Error("RUBRIC_CRITERIA_INVALID");
    }
    const normalizedName = normalizeString(name);
    if (criterionNames[normalizedName]) throw new Error("RUBRIC_CRITERIA_DUPLICATE");
    criterionNames[normalizedName] = true;
    const levelNames = Object.create(null);
    levels.forEach(level => {
      if (!level || typeof level !== "object" || Array.isArray(level)) {
        throw new Error("RUBRIC_LEVEL_DESCRIPTOR_REQUIRED");
      }
      const levelName = String(level.nombre || "").trim();
      const description = String(level.descripcion || "").trim();
      if (!levelName || levelName.length > 80 || !description || description.length > 500) {
        throw new Error("RUBRIC_LEVEL_DESCRIPTOR_REQUIRED");
      }
      const normalizedLevel = normalizeString(levelName);
      if (levelNames[normalizedLevel]) throw new Error("RUBRIC_LEVEL_DUPLICATE");
      levelNames[normalizedLevel] = true;
      if (level.puntaje !== undefined && level.puntaje !== null && level.puntaje !== "") {
        const score = Number(level.puntaje);
        if (!Number.isFinite(score) || score < 0 || score > 100) {
          throw new Error("RUBRIC_LEVEL_SCORE_INVALID");
        }
      }
    });
  });
  return criteria;
}

function saveRubricUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const titulo = String(p.titulo || "").trim();
  if (!titulo) throw new Error("RUBRIC_TITLE_REQUIRED");
  const criterios = validateAnalyticalRubricCriteria_(p.criterios || []);
  let critJSON;
  try { critJSON = JSON.stringify(criterios); }
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

// Catálogo institucional de competencias e indicadores. No presupone equivalencia SACE.
const COMPETENCY_CATALOG_HEADERS_ = ["ID", "InstitutionID", "DepartmentID", "AnoID", "Grado", "Seccion",
  "AsignaturaID", "CompetenciaID", "Competencia", "IndicadorID", "Indicador", "ProgramaCurricular",
  "Estado", "RegisteredBy", "CreatedAt", "UpdatedAt", "ContextKey"];

function competencyCatalogContextKey_(item) {
  return JSON.stringify([item.institutionId, item.departmentId, item.anoId, item.grado, item.seccion,
    item.asignaturaId, item.programaCurricular, item.competenciaId, item.indicadorId].map(value => normalizeString(value)));
}

function getCompetencyCatalog(payload) {
  return withAuthorizedExamMetadataRead_("getCompetencyCatalog", payload,
    context => getCompetencyCatalogUnlocked_(payload, context));
}

function getCompetencyCatalogUnlocked_(payload, context) {
  const ss = context && context.ss, scope = context && context.scope;
  if (!ss || !scope || !scope.institutionId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const sheet = ss.getSheetByName("CatalogoCompetencias");
  if (!sheet) return { status: "success", total: 0, data: [], departmentIds: scope.departmentIds || [], institutionWide: scope.institutionWide === true };
  const rows = sheet.getDataRange().getValues();
  if (!rows.length) return { status: "success", total: 0, data: [] };
  if (COMPETENCY_CATALOG_HEADERS_.length !== rows[0].length ||
      COMPETENCY_CATALOG_HEADERS_.some((header, index) => String(rows[0][index] || "").trim() !== header)) {
    throw new Error("COMPETENCY_CATALOG_SCHEMA_INVALID");
  }
  const p = payload && typeof payload === "object" ? payload : {};
  const result = rows.slice(1).filter(row =>
    String(row[1] || "").trim() === String(scope.institutionId).trim() &&
    (!String(row[2] || "").trim() || scope.institutionWide === true || (scope.departmentIds || []).some(id => String(id || "").trim() === String(row[2]).trim())) &&
    String(row[12] || "").trim().toUpperCase() === "ACTIVE" &&
    (!p.anoId || String(row[3] || "").trim() === String(p.anoId).trim()) &&
    (!p.grado || normalizeString(row[4]) === normalizeString(p.grado)) &&
    (!p.seccion || normalizeString(row[5]) === normalizeString(p.seccion)) &&
    (!p.asignaturaId || normalizeString(row[6]) === normalizeString(p.asignaturaId)) &&
    (!p.programaCurricular || normalizeString(row[11]) === normalizeString(p.programaCurricular))
  ).map(row => {
    const item = { catalogItemId: row[0], departmentId: row[2], anoId: row[3], grado: row[4], seccion: row[5],
      asignaturaId: row[6], competenciaId: row[7], competencia: row[8], indicadorId: row[9],
      indicador: row[10], programaCurricular: row[11], estado: row[12] };
    const expectedKey = competencyCatalogContextKey_({ institutionId: scope.institutionId, ...item });
    if (String(row[16] || "") !== expectedKey) throw new Error("COMPETENCY_CATALOG_CONTEXT_KEY_INVALID");
    return item;
  });
  const pairs = Object.create(null);
  result.forEach(item => {
    const key = competencyCatalogContextKey_({ institutionId: scope.institutionId, ...item });
    pairs[key] = (pairs[key] || 0) + 1;
  });
  if (Object.keys(pairs).some(key => pairs[key] !== 1)) throw new Error("COMPETENCY_CATALOG_DUPLICATE_ENTRY");
  return { status: "success", total: result.length, data: result, departmentIds: scope.departmentIds || [], institutionWide: scope.institutionWide === true };
}

function saveCompetencyCatalogItem(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const permission = validateRolePermission("saveCompetencyCatalogItem", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const initialActor = getVerifiedExamIdentity_(p);
  if (!initialActor || initialActor.authorized !== true || !initialActor.userId) throw new Error("RESOURCE_NOT_AVAILABLE");
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("COMPETENCY_CATALOG_LOCK_TIMEOUT");
  try {
    const currentPermission = validateRolePermission("saveCompetencyCatalogItem", p);
    const actor = getVerifiedExamIdentity_(p);
    if (!currentPermission || currentPermission.authorized !== true || !actor ||
        actor.authorized !== true || actor.userId !== initialActor.userId || actor.role !== initialActor.role) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
    if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const role = String(actor.role || "").trim();
    const anoId = String(p.anoId || "").trim(), grado = String(p.grado || "").trim();
    const seccion = String(p.seccion || "").trim();
    const asignaturaId = String(p.asignaturaId || "").trim();
    const competenciaId = String(p.competenciaId || "").trim();
    const competencia = String(p.competencia || "").trim();
    const indicadorId = String(p.indicadorId || "").trim();
    const indicador = String(p.indicador || "").trim();
    const programaCurricular = String(p.programaCurricular || "").trim();
    if (!anoId || !/^20\d{2}$/.test(anoId) || !grado || !seccion || !asignaturaId ||
        !competenciaId || !competencia || !indicadorId || !indicador || !programaCurricular) {
      throw new Error("COMPETENCY_CATALOG_REQUIRED_FIELDS");
    }
    if ([anoId, grado, asignaturaId, competenciaId, competencia, indicadorId, indicador, programaCurricular]
        .some(value => value.length > 160)) throw new Error("COMPETENCY_CATALOG_FIELD_TOO_LONG");
    let departmentId = String(p.departmentId || "").trim();
    if (role === "Profesor") {
      const allowedDepartments = (scope.departmentIds || []).map(value => String(value || "").trim()).filter(Boolean);
      if (!departmentId && allowedDepartments.length === 1) departmentId = allowedDepartments[0];
      if (!departmentId || !allowedDepartments.includes(departmentId)) throw new Error("RESOURCE_NOT_AVAILABLE");
      const periodoId = String(p.periodoId || "").trim();
      if (!periodoId) throw new Error("RESOURCE_NOT_AVAILABLE");
      const configSheet = getSheetOrThrow(ss, "ConfiguracionAcademica");
      const configData = configSheet.getDataRange().getValues();
      const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
      if (!configData.length || configHeaders.some((header, index) => String(configData[0][index] || "").trim() !== header)) {
        throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
      }
      const assignments = configData.slice(1).filter(row =>
        normalizeString(row[2]) === normalizeString(periodoId) &&
        normalizeString(row[3]) === normalizeString(grado) &&
        normalizeString(row[4]) === normalizeString(p.seccion) &&
        normalizeString(row[5]) === normalizeString(asignaturaId));
      if (!assignments.length || assignments.some(row => String(row[8] || "").trim() !== actor.userId)) {
        throw new Error("RESOURCE_NOT_AVAILABLE");
      }
    } else if (scope.institutionWide !== true || (departmentId && !(scope.departmentIds || []).some(value => String(value || "").trim() === departmentId))) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    const sheet = ss.getSheetByName("CatalogoCompetencias") || getOrCreateSheet(ss, "CatalogoCompetencias");
    let rows = sheet.getDataRange().getValues();
    if (!rows.length) {
      sheet.appendRow(COMPETENCY_CATALOG_HEADERS_);
      rows = [COMPETENCY_CATALOG_HEADERS_];
    }
    if (COMPETENCY_CATALOG_HEADERS_.length !== rows[0].length ||
        COMPETENCY_CATALOG_HEADERS_.some((header, index) => String(rows[0][index] || "").trim() !== header)) {
      throw new Error("COMPETENCY_CATALOG_SCHEMA_INVALID");
    }
    const item = { institutionId: scope.institutionId, departmentId, anoId, grado, seccion, asignaturaId,
      competenciaId, indicadorId, programaCurricular };
    const contextKey = competencyCatalogContextKey_(item);
    const matches = rows.slice(1).map((row, index) => ({ row, rowIndex: index + 1 }))
      .filter(entry => String(entry.row[1] || "").trim() === String(scope.institutionId).trim() &&
        String(entry.row[2] || "").trim() === departmentId &&
        String(entry.row[3] || "").trim() === anoId &&
        normalizeString(entry.row[4]) === normalizeString(grado) &&
        normalizeString(entry.row[5]) === normalizeString(seccion) &&
        normalizeString(entry.row[6]) === normalizeString(asignaturaId) &&
        String(entry.row[7] || "").trim() === competenciaId &&
        String(entry.row[9] || "").trim() === indicadorId &&
        normalizeString(entry.row[11]) === normalizeString(programaCurricular));
    if (matches.length > 1) throw new Error("COMPETENCY_CATALOG_DUPLICATE_ENTRY");
    const now = new Date().toISOString();
    if (matches.length === 1) {
      const existing = matches[0].row;
      if (String(existing[16] || "") !== contextKey) throw new Error("COMPETENCY_CATALOG_CONTEXT_KEY_INVALID");
      if (String(existing[12] || "").trim().toUpperCase() === "INACTIVE") throw new Error("COMPETENCY_CATALOG_ENTRY_INACTIVE");
      sheet.getRange(matches[0].rowIndex + 1, 9, 1, 3).setValues([[competencia, indicadorId, indicador]]);
      sheet.getRange(matches[0].rowIndex + 1, 16).setValue(now);
      return { status: "success", catalogItemId: existing[0], actualizado: true };
    }
    const id = "COMP-CAT-" + Utilities.getUuid();
    sheet.appendRow([id, scope.institutionId, departmentId, anoId, grado, seccion, asignaturaId, competenciaId,
      competencia, indicadorId, indicador, programaCurricular, "ACTIVE", actor.userId, now, now, contextKey]);
    return { status: "success", catalogItemId: id, actualizado: false };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
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

const COMPETENCY_EVALUATION_HEADERS_ = ["ID", "CompetenciaID", "IndicadorID", "UserID", "AsignaturaID",
  "PeriodoID", "NivelDesempeno", "Observaciones", "RubricaID", "FechaRegistro", "AnoID",
  "Grado", "Seccion", "InstitutionID", "DepartmentID", "CatalogItemID", "ContextKey"];

function competencyEvaluationContextKey_(context) {
  const value = context && typeof context === "object" ? context : {};
  const fields = [value.institutionId, value.departmentId || "", value.anoId, value.periodoId,
    value.grado, value.seccion, value.asignaturaId, value.userId, value.competenciaId,
    value.indicadorId, value.catalogItemId];
  if (fields.some((field, index) => index !== 1 && !String(field == null ? "" : field).trim())) {
    throw new Error("COMPETENCY_EVALUATION_CONTEXT_REQUIRED");
  }
  return JSON.stringify(fields.map(field => normalizeString(field)));
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
  const anoId = String(p.anoId || "").trim();
  const indicadorId = String(p.indicadorId || "").trim();
  let departmentId = String(p.departmentId || "").trim();
  if (!anoId || !/^20\d{2}$/.test(anoId) || !indicadorId) {
    throw new Error("COMPETENCY_CATALOG_CONTEXT_REQUIRED");
  }
  if (role === "Profesor") {
    const allowedDepartments = (scope.departmentIds || []).map(value => String(value || "").trim()).filter(Boolean);
    if (!departmentId && allowedDepartments.length === 1) departmentId = allowedDepartments[0];
    if (!departmentId || !allowedDepartments.includes(departmentId) ||
        !asignaturaId || !periodoId || !String(profile.grado || "").trim() || !String(profile.seccion || "").trim()) {
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

  if (role !== "Profesor" && departmentId && scope.institutionWide !== true &&
      !(scope.departmentIds || []).some(id => String(id || "").trim() === departmentId)) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const catalogSheet = ss.getSheetByName("CatalogoCompetencias");
  if (!catalogSheet) throw new Error("COMPETENCY_CATALOG_ITEM_NOT_FOUND");
  const catalogRows = catalogSheet.getDataRange().getValues();
  if (!catalogRows.length || COMPETENCY_CATALOG_HEADERS_.length !== catalogRows[0].length ||
      COMPETENCY_CATALOG_HEADERS_.some((header, index) => String(catalogRows[0][index] || "").trim() !== header)) {
    throw new Error("COMPETENCY_CATALOG_SCHEMA_INVALID");
  }
  const program = String(p.programaCurricular || "").trim();
  if (!program) throw new Error("COMPETENCY_CATALOG_CONTEXT_REQUIRED");
  const catalogMatches = catalogRows.slice(1).filter(row =>
    (!String(row[2] || "").trim() || String(row[2] || "").trim() === departmentId) &&
    String(row[1] || "").trim() === String(scope.institutionId || "").trim() &&
    (!String(row[2] || "").trim() || scope.institutionWide === true || (scope.departmentIds || []).some(id => String(id || "").trim() === String(row[2]).trim())) &&
    String(row[3] || "").trim() === anoId &&
    normalizeString(row[4]) === normalizeString(profile.grado) &&
    normalizeString(row[5]) === normalizeString(profile.seccion) &&
    normalizeString(row[6]) === normalizeString(asignaturaId) &&
    String(row[7] || "").trim() === competenciaId &&
    String(row[9] || "").trim() === indicadorId &&
    String(row[12] || "").trim().toUpperCase() === "ACTIVE" &&
    String(row[16] || "") === competencyCatalogContextKey_({ institutionId: scope.institutionId,
      departmentId: row[2], anoId: row[3], grado: row[4], seccion: row[5], asignaturaId: row[6],
      competenciaId: row[7], programaCurricular: row[11], indicadorId: row[9] }) &&
    (!program || normalizeString(row[11]) === normalizeString(program)));
  if (catalogMatches.length !== 1) {
    throw new Error(catalogMatches.length ? "COMPETENCY_CATALOG_ENTRY_AMBIGUOUS" : "COMPETENCY_CATALOG_ITEM_NOT_FOUND");
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
        if (role === "Profesor" && !departmentId) throw new Error("RESOURCE_NOT_AVAILABLE");
        const owned = rubricOwnership.filter(row =>
          String(row[1] || "").trim() === String(scope.institutionId).trim() &&
          String(row[5] || "").trim().toUpperCase() === "ACTIVE" &&
          (scope.institutionWide === true || (scope.departmentIds || []).some(department =>
            String(department || "").trim() === String(row[4] || "").trim())) &&
          (!departmentId || String(row[4] || "").trim() === departmentId));
        if (rubricOwnership.length !== 1 || owned.length !== 1) throw new Error("RESOURCE_NOT_AVAILABLE");
      }
    }
  }

  const sheet = ss.getSheetByName("EvaluacionesCompetencias") || getOrCreateSheet(ss, "EvaluacionesCompetencias");
  const legacyHeaders = COMPETENCY_EVALUATION_HEADERS_.slice(0, 10);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COMPETENCY_EVALUATION_HEADERS_);
  } else {
    const rows = sheet.getDataRange().getValues();
    if (!rows.length) throw new Error("COMPETENCY_EVALUATION_SCHEMA_INVALID");
    if (rows[0].length === legacyHeaders.length &&
        legacyHeaders.every((header, index) => String(rows[0][index] || "").trim() === header)) {
      sheet.getRange(1, 11, 1, COMPETENCY_EVALUATION_HEADERS_.length - 10)
        .setValues([COMPETENCY_EVALUATION_HEADERS_.slice(10)]);
      if (rows.length > 1) sheet.getRange(2, 11, rows.length - 1, COMPETENCY_EVALUATION_HEADERS_.length - 10)
        .setValues(rows.slice(1).map(() => Array(COMPETENCY_EVALUATION_HEADERS_.length - 10).fill("")));
    } else if (rows[0].length !== COMPETENCY_EVALUATION_HEADERS_.length ||
        COMPETENCY_EVALUATION_HEADERS_.some((header, index) => String(rows[0][index] || "").trim() !== header)) {
      throw new Error("COMPETENCY_EVALUATION_SCHEMA_INVALID");
    }
  }
  const contextData = { institutionId: scope.institutionId, departmentId, anoId,
    periodoId, grado: profile.grado, seccion: profile.seccion, asignaturaId,
    userId, competenciaId, indicadorId, catalogItemId: String(catalogMatches[0][0] || "").trim() };
  const contextKey = competencyEvaluationContextKey_(contextData);
  return { actor, scope, ss, sheet, userId, competenciaId, indicadorId, asignaturaId,
    periodoId, anoId, grado: profile.grado, seccion: profile.seccion, departmentId,
    institutionId: scope.institutionId, catalogItemId: contextData.catalogItemId,
    contextKey, nivelDesempeno, rubricId };
}

function saveCompetencyEvaluationUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const rows = context.sheet.getDataRange().getValues();
  const id = "COMP-EVAL-" + Utilities.getUuid();
  if (rows.slice(1).some(row => String(row[0] || "").trim() === id)) {
    throw new Error("COMPETENCY_EVALUATION_ID_COLLISION");
  }
  const now = new Date();
  const observaciones = p.observaciones == null ? "" : String(p.observaciones);
  context.sheet.appendRow([
    id, context.competenciaId, context.indicadorId, context.userId,
    context.asignaturaId, context.periodoId, context.nivelDesempeno,
    observaciones, context.rubricId, now, context.anoId, context.grado, context.seccion,
    context.institutionId, context.departmentId, context.catalogItemId, context.contextKey
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
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const actor = context && context.actor;
  const ss = context && context.ss;
  const scope = context && context.scope;
  if (!actor || !String(actor.userId || "").trim() || !ss || !scope || scope.authorized !== true ||
      !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const role = String(actor.role || "").trim();
  const studentRoles = ["Estudiante", "Alumno"];
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  let targetUserId = "";
  let targetProfile = null;
  let departmentId = String(p.departmentId || "").trim();

  if (studentRoles.indexOf(role) !== -1) {
    targetUserId = String(actor.userId).trim();
    if (p.userId && String(p.userId).trim() !== targetUserId) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetProfile = getExamStudentProfile_(ss, targetUserId);
    if (!targetProfile || studentRoles.indexOf(String(targetProfile.role || "").trim()) === -1) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else if (role === "Profesor") {
    targetUserId = String(p.userId || "").trim();
    const asignaturaId = String(p.asignaturaId || "").trim();
    const periodoId = String(p.periodoId || "").trim();
    const anoId = String(p.anoId || "").trim();
    const allowedDepartments = (scope.departmentIds || []).map(value => String(value || "").trim()).filter(Boolean);
    if (!targetUserId || !asignaturaId || !periodoId || !/^20\d{2}$/.test(anoId)) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
    if (!departmentId && allowedDepartments.length === 1) departmentId = allowedDepartments[0];
    if (!departmentId || !allowedDepartments.includes(departmentId)) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetProfile = getExamStudentProfile_(ss, targetUserId);
    if (!targetProfile || studentRoles.indexOf(String(targetProfile.role || "").trim()) === -1 ||
        !String(targetProfile.grado || "").trim() || !String(targetProfile.seccion || "").trim()) {
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
      normalizeString(row[3]) === normalizeString(targetProfile.grado) &&
      normalizeString(row[4]) === normalizeString(targetProfile.seccion) &&
      normalizeString(row[5]) === normalizeString(asignaturaId));
    if (!matchingAssignments.length || matchingAssignments.some(row =>
      String(row[8] || "").trim() !== String(actor.userId).trim())) throw new Error("RESOURCE_NOT_AVAILABLE");
  } else if (institutionRoles.indexOf(role) !== -1) {
    if (scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
    targetUserId = String(p.userId || "").trim();
    if (targetUserId) {
      targetProfile = getExamStudentProfile_(ss, targetUserId);
      if (!targetProfile || studentRoles.indexOf(String(targetProfile.role || "").trim()) === -1) {
        throw new Error("RESOURCE_NOT_AVAILABLE");
      }
    }
  } else {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const sheet = ss.getSheetByName("EvaluacionesCompetencias");
  if (!sheet) return { status: "success", total: 0, data: [] };
  const data = sheet.getDataRange().getValues();
  if (!data.length) return { status: "success", total: 0, data: [] };
  const legacyHeaders = COMPETENCY_EVALUATION_HEADERS_.slice(0, 10);
  if (data[0].length === legacyHeaders.length &&
      legacyHeaders.every((header, index) => String(data[0][index] || "").trim() === header)) {
    return { status: "success", total: 0, data: [] };
  }
  if (data[0].length !== COMPETENCY_EVALUATION_HEADERS_.length ||
      COMPETENCY_EVALUATION_HEADERS_.some((header, index) => String(data[0][index] || "").trim() !== header)) {
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
    if (String(row[13] || "").trim() !== String(scope.institutionId).trim()) return false;
    if (role === "Profesor" && String(row[14] || "").trim() !== departmentId) return false;
    if (p.departmentId && String(row[14] || "").trim() !== String(p.departmentId).trim()) return false;
    if (p.anoId && String(row[10] || "").trim() !== String(p.anoId).trim()) return false;
    if (p.grado && normalizeString(row[11]) !== normalizeString(p.grado)) return false;
    if (p.seccion && normalizeString(row[12]) !== normalizeString(p.seccion)) return false;
    if (targetProfile && role === "Profesor" &&
        (normalizeString(row[11]) !== normalizeString(targetProfile.grado) ||
         normalizeString(row[12]) !== normalizeString(targetProfile.seccion))) return false;
    if (p.asignaturaId && normalizeString(row[4]) !== normalizeString(p.asignaturaId)) return false;
    if (p.periodoId && normalizeString(row[5]) !== normalizeString(p.periodoId)) return false;
    if (p.competenciaId && String(row[1] || "").trim() !== String(p.competenciaId).trim()) return false;
    const expectedKey = competencyEvaluationContextKey_({
      institutionId: row[13], departmentId: row[14], anoId: row[10], periodoId: row[5],
      grado: row[11], seccion: row[12], asignaturaId: row[4], userId: row[3],
      competenciaId: row[1], indicadorId: row[2], catalogItemId: row[15]
    });
    if (String(row[16] || "").trim() !== expectedKey) return false;
    return true;
  }).map(row => {
    const registeredAt = row[9] ? new Date(row[9]) : null;
    return {
      evaluacionCompetenciaId: row[0], competenciaId: row[1], indicadorId: row[2], userId: row[3],
      asignaturaId: row[4], periodoId: row[5], nivelDesempeno: row[6], observaciones: row[7],
      rubricaId: row[8], fechaRegistro: registeredAt && !isNaN(registeredAt.getTime()) ? registeredAt.toISOString() : null,
      anoId: row[10], grado: row[11], seccion: row[12], institutionId: row[13],
      departmentId: row[14], catalogItemId: row[15]
    };
  });
  return { status: "success", total: filtered.length, data: filtered };
}
const GRADEBOOK_WEIGHT_HEADERS_ = ["ID", "InstitutionID", "AnoID", "PeriodoID", "Grado", "Seccion",
  "Asignatura", "CategoriaID", "Nombre", "PorcentajePonderacion", "EscalaMaxima", "Estado",
  "RegisteredBy", "CreatedAt", "UpdatedAt", "ContextKey"];

function buildGradebookWeightContextKey_(context, categoryId) {
  const value = context && typeof context === "object" ? context : {};
  const fields = [value.institutionId, value.anoId, value.parcial || value.periodoId,
    value.grado, value.seccion, value.asignatura, categoryId];
  if (fields.some(field => !String(field == null ? "" : field).trim())) {
    throw new Error("GRADEBOOK_CONTEXT_REQUIRED");
  }
  return JSON.stringify(fields.map(field => normalizeString(field)));
}

function getGradebookWeightConfigurationFromSheet_(ss, context) {
  const sheet = ss && ss.getSheetByName("PonderacionesEvaluacion");
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (!rows.length) return [];
  if (GRADEBOOK_WEIGHT_HEADERS_.some((header, index) => String(rows[0][index] || "").trim() !== header) ||
      rows[0].length !== GRADEBOOK_WEIGHT_HEADERS_.length) {
    throw new Error("GRADEBOOK_WEIGHT_SCHEMA_INVALID");
  }
  const scope = context.scope || {};
  const matches = rows.slice(1).filter(row =>
    String(row[1] || "").trim() === String(scope.institutionId || "").trim() &&
    String(row[2] || "").trim() === String(context.anoId || "").trim() &&
    normalizeString(row[3]) === normalizeString(context.parcial) &&
    normalizeString(row[4]) === normalizeString(context.grado) &&
    normalizeString(row[5]) === normalizeString(context.seccion) &&
    normalizeString(row[6]) === normalizeString(context.asignatura) &&
    String(row[11] || "").trim().toUpperCase() === "ACTIVE");
  const seen = Object.create(null);
  const result = matches.map(row => {
    const categoryId = String(row[7] || "").trim();
    const id = String(row[0] || "").trim();
    const percentage = row[9] === "" || row[9] == null ? NaN : Number(row[9]);
    const scale = row[10] === "" || row[10] == null ? NaN : Number(row[10]);
    const key = buildGradebookWeightContextKey_({ institutionId: scope.institutionId,
      anoId: context.anoId, parcial: context.parcial, grado: context.grado,
      seccion: context.seccion, asignatura: context.asignatura }, categoryId);
    if (!id || !categoryId || seen[categoryId] || String(row[15] || "").trim() !== key ||
        !Number.isFinite(percentage) || percentage < 0 || percentage > 100 ||
        !Number.isFinite(scale) || scale <= 0) {
      throw new Error("GRADEBOOK_WEIGHT_RECORD_INVALID");
    }
    seen[categoryId] = true;
    return { id, categoriaId: categoryId, nombre: String(row[8] || "").trim(),
      porcentajePonderacion: percentage, escalaMaxima: scale, estado: "Activo" };
  });
  if (result.length && Math.abs(result.reduce((sum, item) => sum + item.porcentajePonderacion, 0) - 100) > 0.01) {
    throw new Error("GRADEBOOK_WEIGHTS_INVALID");
  }
  return result;
}

function getGradebookWeightConfiguration(payload) {
  return withAuthorizedGradebookSave_(payload, context => {
    const categories = context.weightConfiguration || [];
    return { status: categories.length ? "success" : "not_configured",
      configured: categories.length > 0, totalWeight: categories.reduce((sum, item) => sum + item.porcentajePonderacion, 0),
      data: categories, contexto: { anoId: context.anoId, periodoId: context.parcial,
        grado: context.grado, seccion: context.seccion, asignatura: context.asignatura,
        institutionId: context.scope.institutionId } };
  }, "getGradebookWeightConfiguration");
}

function saveGradebookWeightConfiguration(payload) {
  return withAuthorizedGradebookSave_(payload, context =>
    saveGradebookWeightConfigurationUnlocked_(payload, context), "saveGradebookWeightConfiguration");
}

function saveGradebookWeightConfigurationUnlocked_(payload, context) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const raw = p.categorias;
  if (!Array.isArray(raw) || !raw.length || raw.length > 20) throw new Error("GRADEBOOK_WEIGHT_BATCH_INVALID");
  const seen = Object.create(null), categories = [];
  raw.forEach(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("GRADEBOOK_WEIGHT_RECORD_INVALID");
    const categoriaId = String(item.categoriaId || item.evaluacionId || "").trim();
    const nombre = String(item.nombre || "").trim();
    const percentage = item.porcentajePonderacion === "" || item.porcentajePonderacion == null
      ? NaN : Number(item.porcentajePonderacion);
    const scale = item.escalaMaxima == null || item.escalaMaxima === "" ? 100 : Number(item.escalaMaxima);
    if (!categoriaId || !nombre || seen[categoriaId] || !context.categoryIds[categoriaId] ||
        !Number.isFinite(percentage) || percentage < 0 || percentage > 100 ||
        !Number.isFinite(scale) || scale <= 0 || scale > 10000) {
      throw new Error("GRADEBOOK_WEIGHT_RECORD_INVALID");
    }
    if (!["CAT-1", "CAT-2", "CAT-3", "CAT-4"].includes(categoriaId)) {
      const owners = context.ownedCategories[categoriaId] || [];
      if (owners.length !== 1 || !owners[0] ||
          !(context.scope.institutionWide === true ||
            (context.scope.departmentIds || []).some(id => String(id).trim() === owners[0]))) {
        throw new Error("GRADEBOOK_CATEGORY_OWNERSHIP_UNVERIFIED");
      }
    }
    seen[categoriaId] = true;
    categories.push({ categoriaId, nombre, porcentajePonderacion: percentage, escalaMaxima: scale });
  });
  if (Math.abs(categories.reduce((sum, item) => sum + item.porcentajePonderacion, 0) - 100) > 0.01) {
    throw new Error("GRADEBOOK_WEIGHTS_INVALID");
  }

  const ss = context.ss;
  const sheet = ss.getSheetByName("PonderacionesEvaluacion") || getOrCreateSheet(ss, "PonderacionesEvaluacion");
  let rows = sheet.getDataRange().getValues();
  if (!rows.length || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, GRADEBOOK_WEIGHT_HEADERS_.length).setValues([GRADEBOOK_WEIGHT_HEADERS_]);
    rows = [GRADEBOOK_WEIGHT_HEADERS_.slice()];
  }
  if (rows[0].length !== GRADEBOOK_WEIGHT_HEADERS_.length ||
      GRADEBOOK_WEIGHT_HEADERS_.some((header, index) => String(rows[0][index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_WEIGHT_SCHEMA_INVALID");
  }
  const data = rows.map(row => {
    const copy = row.slice();
    while (copy.length < GRADEBOOK_WEIGHT_HEADERS_.length) copy.push("");
    return copy;
  });
  const institutionId = String(context.scope.institutionId || "").trim();
  const isContextRow = row => String(row[1] || "").trim() === institutionId &&
    String(row[2] || "").trim() === context.anoId &&
    normalizeString(row[3]) === normalizeString(context.parcial) &&
    normalizeString(row[4]) === normalizeString(context.grado) &&
    normalizeString(row[5]) === normalizeString(context.seccion) &&
    normalizeString(row[6]) === normalizeString(context.asignatura);
  const currentRows = Object.create(null);
  for (let i = 1; i < data.length; i++) {
    if (!isContextRow(data[i])) continue;
    const categoryId = String(data[i][7] || "").trim();
    if (categoryId && currentRows[categoryId]) throw new Error("GRADEBOOK_WEIGHT_RECORD_AMBIGUOUS");
    if (categoryId) currentRows[categoryId] = i;
    data[i][11] = "INACTIVE";
    data[i][14] = new Date().toISOString();
  }
  const now = new Date().toISOString();
  categories.forEach(item => {
    const contextKey = buildGradebookWeightContextKey_({ institutionId, anoId: context.anoId,
      parcial: context.parcial, grado: context.grado, seccion: context.seccion, asignatura: context.asignatura },
      item.categoriaId);
    const existingIndex = currentRows[item.categoriaId];
    const row = existingIndex ? data[existingIndex] :
      ["WEIGHT-" + Utilities.getUuid(), institutionId, context.anoId, context.parcial,
        context.grado, context.seccion, context.asignatura, item.categoriaId, item.nombre,
        item.porcentajePonderacion, item.escalaMaxima, "ACTIVE", context.actor.userId,
        now, now, contextKey];
    row[8] = item.nombre; row[9] = item.porcentajePonderacion; row[10] = item.escalaMaxima;
    row[11] = "ACTIVE"; row[14] = now; row[15] = contextKey;
    if (!existingIndex) data.push(row);
  });
  sheet.getRange(1, 1, data.length, GRADEBOOK_WEIGHT_HEADERS_.length).setValues(data);
  return { status: "success", total: categories.length,
    totalWeight: categories.reduce((sum, item) => sum + item.porcentajePonderacion, 0),
    message: "Ponderaciones guardadas para el contexto académico seleccionado." };
}

function buildSaceGradebookSnapshotUnlocked_(request, context, periodoId, parcial, requested) {
  const required = (value, code) => {
    const result = String(value == null ? "" : value).trim();
    if (!result) throw new Error(code);
    return result;
  };
  const snapshotRequest = Object.assign({}, request, { parcial });
  const snapshot = getGradebookDataUnlocked_(snapshotRequest, context);
  if (!snapshot || snapshot.status !== "success" || !snapshot.data) {
    throw new Error("SACE_GRADEBOOK_SOURCE_UNAVAILABLE");
  }
  const data = snapshot.data, sourceContext = data.contexto || {};
  const expected = {
    anoId: required(request.anoId || request.anoLectivo, "GRADEBOOK_CONTEXT_REQUIRED"),
    grado: required(request.grado, "GRADEBOOK_CONTEXT_REQUIRED"),
    seccion: required(request.seccion, "GRADEBOOK_CONTEXT_REQUIRED"),
    asignatura: required(request.asignatura, "GRADEBOOK_CONTEXT_REQUIRED"),
    institutionId: required(context && context.scope && context.scope.institutionId, "SACE_GRADEBOOK_INSTITUTION_REQUIRED")
  };
  Object.keys(expected).forEach(key => {
    if (String(sourceContext[key] || "").trim() !== expected[key]) {
      throw new Error("SACE_GRADEBOOK_CONTEXT_MISMATCH:" + key);
    }
  });
  if (String(sourceContext.periodoId || "").trim() !== parcial) {
    throw new Error("SACE_GRADEBOOK_PERIOD_MAPPING_MISMATCH");
  }
  const closureSheet = context && context.ss && context.ss.getSheetByName("CierresPeriodos");
  if (!closureSheet) throw new Error("SACE_GRADEBOOK_CLOSURE_SOURCE_MISSING");
  const closureRows = closureSheet.getDataRange().getValues();
  const closureHeaders = closureRows.length ? closureRows[0].map(value => String(value || "").trim()) : [];
  const closureFields = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "Estado"];
  if (closureFields.some(header => closureHeaders.indexOf(header) === -1)) {
    throw new Error("SACE_GRADEBOOK_CLOSURE_CONTEXT_UNVERIFIABLE");
  }
  const closureIndex = {};
  closureHeaders.forEach((header, index) => { closureIndex[header] = index; });
  const matchingClosures = closureRows.slice(1).filter(row =>
    String(row[closureIndex.AnoID] || "").trim() === expected.anoId &&
    String(row[closureIndex.PeriodoID] || "").trim() === parcial &&
    String(row[closureIndex.Grado] || "").trim() === expected.grado &&
    String(row[closureIndex.Seccion] || "").trim() === expected.seccion &&
    String(row[closureIndex.Asignatura] || "").trim() === expected.asignatura);
  if (matchingClosures.length !== 1 ||
      String(matchingClosures[0][closureIndex.Estado] || "").trim().toUpperCase() !== "CERRADO" ||
      !String(matchingClosures[0][closureIndex.CierreID] || "").trim()) {
    throw new Error(matchingClosures.length > 1 ?
      "SACE_GRADEBOOK_CLOSURE_AMBIGUOUS" : "SACE_GRADEBOOK_PERIOD_NOT_CLOSED");
  }
  if (String(data.estadoPeriodo || "").trim().toUpperCase() !== "CERRADO") {
    throw new Error("SACE_GRADEBOOK_PERIOD_NOT_CLOSED");
  }
  if (!Array.isArray(data.alumnos) || !data.resumenes || typeof data.resumenes !== "object") {
    throw new Error("SACE_GRADEBOOK_DATA_INCOMPLETE");
  }
  const roster = new Map();
  data.alumnos.forEach(student => {
    const userId = required(student && student.userId, "SACE_GRADEBOOK_STUDENT_ID_REQUIRED");
    if (roster.has(userId)) throw new Error("SACE_GRADEBOOK_ROSTER_AMBIGUOUS");
    roster.set(userId, student);
  });
  const alumnos = requested.map(userId => {
    const student = roster.get(userId);
    if (!student) throw new Error("SACE_GRADEBOOK_STUDENT_OUTSIDE_CLASS");
    const nombreCompleto = required(student.nombreCompleto, "SACE_GRADEBOOK_STUDENT_NAME_REQUIRED");
    return { userId, nombreCompleto, grado: expected.grado, seccion: expected.seccion };
  });
  const resumenes = Object.create(null);
  requested.forEach(userId => {
    if (!Object.prototype.hasOwnProperty.call(data.resumenes, userId)) {
      throw new Error("SACE_GRADEBOOK_SUMMARY_MISSING");
    }
    const summary = data.resumenes[userId];
    if (!summary || String(summary.userId || "").trim() !== userId) {
      throw new Error("SACE_GRADEBOOK_SUMMARY_MISSING");
    }
    const status = String(summary.status || "").trim();
    if (["calculated", "provisional", "pending", "no_grade", "not_configured"].indexOf(status) === -1) {
      throw new Error("SACE_GRADEBOOK_SUMMARY_STATUS_INVALID");
    }
    const numeric = (value, code) => {
      if (value == null) return null;
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100) throw new Error(code);
      return number;
    };
    const notaFinal = numeric(summary.notaFinal, "SACE_GRADEBOOK_SUMMARY_GRADE_INVALID");
    const avancePonderado = numeric(summary.avancePonderado, "SACE_GRADEBOOK_SUMMARY_PROGRESS_INVALID");
    const ponderacionPendiente = numeric(summary.ponderacionPendiente, "SACE_GRADEBOOK_SUMMARY_PENDING_INVALID");
    if (ponderacionPendiente === null) throw new Error("SACE_GRADEBOOK_SUMMARY_PENDING_INVALID");
    if ((status === "calculated" && notaFinal === null) ||
        (status !== "calculated" && notaFinal !== null)) {
      throw new Error("SACE_GRADEBOOK_SUMMARY_STATUS_INVALID");
    }
    resumenes[userId] = { userId, status, notaFinal, avancePonderado, ponderacionPendiente };
  });
  if (!Array.isArray(data.recuperaciones)) throw new Error("SACE_GRADEBOOK_RECOVERY_DATA_INCOMPLETE");
  const recoveryIds = new Set();
  const recoveries = data.recuperaciones.reduce((result, row) => {
    const userId = required(row && row.userId, "SACE_GRADEBOOK_RECOVERY_USER_REQUIRED");
    if (requested.indexOf(userId) === -1) return result;
    const recoveryId = required(row.recuperacionId, "SACE_GRADEBOOK_RECOVERY_ID_REQUIRED");
    const evaluacionId = required(row.evaluacionId, "SACE_GRADEBOOK_RECOVERY_EVALUATION_REQUIRED");
    if (recoveryIds.has(recoveryId)) throw new Error("SACE_GRADEBOOK_RECOVERY_DUPLICATE");
    recoveryIds.add(recoveryId);
    let notaFinalCalculada = null;
    if (row.notaFinalCalculada != null) {
      notaFinalCalculada = Number(row.notaFinalCalculada);
      if (!Number.isFinite(notaFinalCalculada) || notaFinalCalculada < 0 || notaFinalCalculada > 100) {
        throw new Error("SACE_GRADEBOOK_RECOVERY_GRADE_INVALID");
      }
    }
    result.push({ recuperacionId: recoveryId, userId, evaluacionId, notaFinalCalculada });
    return result;
  }, []);
  return {
    status: "success",
    data: {
      alumnos,
      resumenes,
      recuperaciones: recoveries,
      estadoPeriodo: "Cerrado",
      contexto: {
        anoId: expected.anoId, periodoId, parcial,
        grado: expected.grado, seccion: expected.seccion,
        asignatura: expected.asignatura, institutionId: expected.institutionId
      }
    }
  };
}

function getSaceGradebookSnapshot(payload) {
  return withAuthorizedExamRead_("getSaceGradebookSnapshot", payload, context => {
    const request = payload || {};
    const required = (value, code) => {
      const result = String(value == null ? "" : value).trim();
      if (!result) throw new Error(code);
      return result;
    };
    const periodoId = required(request.periodoId, "SACE_GRADEBOOK_PERIOD_ID_REQUIRED");
    const parcial = required(request.parcial, "SACE_GRADEBOOK_PARTIAL_MAPPING_REQUIRED");
    if (!Array.isArray(request.studentIds) || !request.studentIds.length || request.studentIds.length > 500) {
      throw new Error("SACE_GRADEBOOK_ROSTER_REQUIRED");
    }
    const requested = request.studentIds.map(id => required(id, "SACE_GRADEBOOK_STUDENT_ID_REQUIRED"));
    if (new Set(requested).size !== requested.length) throw new Error("SACE_GRADEBOOK_ROSTER_DUPLICATE");
    return buildSaceGradebookSnapshotUnlocked_(request, context, periodoId, parcial, requested);
  });
}

function getSaceGradebookSnapshots(payload) {
  return withAuthorizedExamRead_("getSaceGradebookSnapshots", payload, context => {
    const request = payload || {};
    if(request.revisionOnly===true)return {status:'success',sourceRevision:context.sourceRevision};
    const required = (value, code) => {
      const result = String(value == null ? "" : value).trim();
      if (!result) throw new Error(code);
      return result;
    };
    if (!Array.isArray(request.periods) || request.periods.length !== 2) {
      throw new Error("SACE_GRADEBOOK_TWO_PERIODS_REQUIRED");
    }
    if (!Array.isArray(request.studentIds) || !request.studentIds.length || request.studentIds.length > 500) {
      throw new Error("SACE_GRADEBOOK_ROSTER_REQUIRED");
    }
    const requested = request.studentIds.map(id => required(id, "SACE_GRADEBOOK_STUDENT_ID_REQUIRED"));
    if (new Set(requested).size !== requested.length) throw new Error("SACE_GRADEBOOK_ROSTER_DUPLICATE");
    const seenPeriodIds = new Set(), seenPartials = new Set();
    const periods = request.periods.map(period => {
      const periodoId = required(period && period.periodoId, "SACE_GRADEBOOK_PERIOD_ID_REQUIRED");
      const parcial = required(period && period.parcial, "SACE_GRADEBOOK_PARTIAL_MAPPING_REQUIRED");
      if (seenPeriodIds.has(periodoId) || seenPartials.has(parcial)) {
        throw new Error("SACE_GRADEBOOK_PERIOD_MAPPING_DUPLICATE");
      }
      seenPeriodIds.add(periodoId);
      seenPartials.add(parcial);
      return { periodoId, parcial };
    });
    const snapshots = periods.map(period => ({
      periodoId: period.periodoId,
      parcial: period.parcial,
      snapshot: buildSaceGradebookSnapshotUnlocked_(
        request, context, period.periodoId, period.parcial, requested
      )
    }));
    return { status: "success", sourceRevision:context.sourceRevision, data: { snapshots } };
  });
}

function getGradebookData(payload) {
  return withAuthorizedExamRead_("getGradebookData", payload,
    context => getGradebookDataUnlocked_(payload, context));
}

function buildGradebookContextKey_(context) {
  const value = context && typeof context === "object" ? context : {};
  const fields = [value.institutionId, value.anoId, value.periodoId, value.grado,
    value.seccion, value.asignatura, value.evaluacionId, value.userId];
  if (fields.some(field => !String(field == null ? "" : field).trim())) {
    throw new Error("GRADEBOOK_CONTEXT_REQUIRED");
  }
  return JSON.stringify(fields.map(field => normalizeString(field)));
}

function calculateGradebookStudentSummary_(userId, grades, categories, recoveries) {
  const studentId = String(userId || "").trim();
  const gradeRows = Array.isArray(grades) ? grades : [];
  const configured = Array.isArray(categories) ? categories : [];
  if (!studentId) throw new Error("GRADEBOOK_STUDENT_REQUIRED");
  if (!configured.length) return { userId: studentId, status: "not_configured",
    notaFinal: null, avancePonderado: null, ponderacionPendiente: 0 };
  const totalWeight = configured.reduce((sum, category) => sum + Number(category.porcentajePonderacion), 0);
  if (configured.some(category => !Number.isFinite(Number(category.porcentajePonderacion)) ||
      Number(category.porcentajePonderacion) < 0 || Number(category.porcentajePonderacion) > 100) ||
      Math.abs(totalWeight - 100) > 0.01) {
    throw new Error("GRADEBOOK_WEIGHTS_INVALID");
  }
  let weightedContribution = 0, pendingWeight = 0, evaluatedWeight = 0;
  const byCategory = Object.create(null);
  configured.forEach(category => {
    const categoryId = String(category.categoriaId || "").trim();
    if (!categoryId || byCategory[categoryId]) throw new Error("GRADEBOOK_WEIGHT_RECORD_AMBIGUOUS");
    byCategory[categoryId] = true;
    const matches = gradeRows.filter(row => String(row.userId || "").trim() === studentId &&
      String(row.evaluacionId || "").trim() === categoryId);
    if (matches.length > 1) throw new Error("GRADEBOOK_RECORD_AMBIGUOUS");
    const weight = Number(category.porcentajePonderacion);
    const grade = matches[0];
    if (!grade || grade.notaObtenida === null || grade.notaObtenida === undefined ||
        grade.notaObtenida === "" || grade.esBorrador === true || grade.esPublicada !== true) {
      pendingWeight += weight;
      return;
    }
    const recoveryHistory = (Array.isArray(recoveries) ? recoveries : []).filter(item =>
      String(item.userId || "").trim() === studentId &&
      String(item.evaluacionId || "").trim() === categoryId);
    recoveryHistory.sort((a, b) => {
      const at = a.fecha ? new Date(a.fecha).getTime() : 0;
      const bt = b.fecha ? new Date(b.fecha).getTime() : 0;
      return at - bt;
    });
    const latestRecovery = recoveryHistory.length ? recoveryHistory[recoveryHistory.length - 1] : null;
    const recoveryGrade = latestRecovery ? latestRecovery.notaFinalCalculada : null;
    const hasValidRecoveryGrade = recoveryGrade !== null && recoveryGrade !== undefined &&
      recoveryGrade !== "" && Number.isFinite(Number(recoveryGrade));
    const effectiveGrade = hasValidRecoveryGrade ? Number(recoveryGrade) : grade.notaObtenida;
    const value = Number(effectiveGrade);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error("GRADEBOOK_GRADE_INVALID");
    weightedContribution += value * weight / 100;
    evaluatedWeight += weight;
  });
  if (pendingWeight > 0) return {
    userId: studentId, status: evaluatedWeight ? "provisional" : "pending",
    notaFinal: null, avancePonderado: Math.round(weightedContribution * 100) / 100,
    ponderacionPendiente: pendingWeight
  };
  if (evaluatedWeight <= 0) return {
    userId: studentId, status: "no_grade", notaFinal: null,
    avancePonderado: null, ponderacionPendiente: 0
  };
  return { userId: studentId, status: "calculated",
    notaFinal: Math.round(weightedContribution * 100) / 100,
    avancePonderado: Math.round(weightedContribution * 100) / 100,
    ponderacionPendiente: 0 };
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

  const anoId = String(p.anoId || p.anoLectivo || "").trim();
  if (!anoId) throw new Error("GRADEBOOK_CONTEXT_REQUIRED");
  const { grado, seccion, asignatura, parcial } = p;
  if (!String(grado || "").trim() || !String(seccion || "").trim() ||
      !String(asignatura || "").trim() || !String(parcial || "").trim()) {
    throw new Error("GRADEBOOK_CONTEXT_REQUIRED");
  }
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
  const gradeBaseHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado",
    "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  const gradeContextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  const gradeHasContext = califData.length > 0 &&
    gradeContextHeaders.every((header, index) => String(califData[0][9 + index] || "").trim() === header);
  if (califData.length && gradeBaseHeaders.some((header, index) =>
      String(califData[0][index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_SCHEMA_INVALID");
  }
  if (califData.length && califData[0].length > 9 && !gradeHasContext) {
    throw new Error("GRADEBOOK_CONTEXT_SCHEMA_INVALID");
  }
  const readContext = { institutionId: scope.institutionId, anoId, periodoId: parcial,
    grado, seccion, asignatura };
  const calificaciones = gradeHasContext && califData.length > 1 ? califData.slice(1)
    .filter(row => {
      if (!studentIds.has(String(row[2] || "").trim())) return false;
      const key = buildGradebookContextKey_({ ...readContext, evaluacionId: row[1], userId: row[2] });
      return String(row[9] || "").trim() === anoId &&
        normalizeString(row[10]) === normalizeString(parcial) &&
        normalizeString(row[11]) === normalizeString(grado) &&
        normalizeString(row[12]) === normalizeString(seccion) &&
        normalizeString(row[13]) === normalizeString(asignatura) &&
        String(row[14] || "").trim() === String(scope.institutionId || "").trim() &&
        String(row[15] || "").trim() === key;
    })
    .map(row => ({
      calificacionId: row[0], evaluacionId: row[1], userId: row[2],
      notaObtenida: row[3] === "" || row[3] == null ? null : Number(row[3]),
      puntajePonderado: row[4] === "" || row[4] == null ? null : Number(row[4]),
      esBorrador: row[5] === true || String(row[5]).toLowerCase() === "true",
      esPublicada: row[6] === true || String(row[6]).toLowerCase() === "true",
      observaciones: row[7] || "",
      fechaRegistro: row[8] ? new Date(row[8]).toISOString() : null,
      anoId: row[9], periodoId: row[10], grado: row[11], seccion: row[12],
      asignatura: row[13], institutionId: row[14], contextKey: row[15]
    })) : [];

  const recSheet = ss.getSheetByName("RecuperacionesEstudiante");
  const recData = recSheet ? recSheet.getDataRange().getValues() : [];
  const recoveryBaseHeaders = ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada",
    "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"];
  const recoveryContextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  if (recData.length && recoveryBaseHeaders.some((header, index) =>
      String(recData[0][index] || "").trim() !== header)) throw new Error("STUDENT_RECOVERY_SCHEMA_INVALID");
  const recoveryHasContext = recData.length > 0 && recoveryContextHeaders.every((header, index) =>
    String(recData[0][9 + index] || "").trim() === header);
  if (recData.length && recData[0].length > 9 && !recoveryHasContext) {
    throw new Error("STUDENT_RECOVERY_CONTEXT_SCHEMA_INVALID");
  }
  const recoveryContext = { institutionId: scope.institutionId, anoId, periodoId: parcial,
    grado, seccion, asignatura };
  const recoveryIdCounts = Object.create(null);
  recData.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) recoveryIdCounts[id] = (recoveryIdCounts[id] || 0) + 1;
  });
  const recoveries = recoveryHasContext ? recData.slice(1)
    .filter(row => {
      const userId = String(row[2] || "").trim();
      if (!studentIds.has(userId)) return false;
      const evaluationId = String(row[1] || "").trim();
      const key = buildGradebookContextKey_({ ...recoveryContext, evaluacionId: evaluationId, userId });
      return String(row[0] || "").trim() && recoveryIdCounts[String(row[0]).trim()] === 1 &&
        String(row[9] || "").trim() === anoId &&
        normalizeString(row[10]) === normalizeString(parcial) &&
        normalizeString(row[11]) === normalizeString(grado) &&
        normalizeString(row[12]) === normalizeString(seccion) &&
        normalizeString(row[13]) === normalizeString(asignatura) &&
        String(row[14] || "").trim() === String(scope.institutionId || "").trim() &&
        String(row[15] || "").trim() === key;
    })
    .map(row => ({
      recuperacionId: row[0], evaluacionId: row[1], userId: row[2],
      notaOriginal: row[3] === "" || row[3] == null ? null : Number(row[3]),
      notaRecuperada: row[4] === "" || row[4] == null ? null : Number(row[4]),
      notaFinalCalculada: row[5] === "" || row[5] == null ? null : Number(row[5]),
      metodoAplicado: row[6], autorizadoPor: row[7],
      fecha: row[8] ? new Date(row[8]).toISOString() : null,
      anoId: row[9], periodoId: row[10], grado: row[11], seccion: row[12],
      asignatura: row[13], institutionId: row[14], contextKey: row[15]
    })) : [];

  const weightConfiguration = getGradebookWeightConfigurationFromSheet_(ss, {
    scope, anoId, parcial, grado, seccion, asignatura
  });
  const categories = weightConfiguration.map(item => ({
    categoriaId: item.categoriaId, nombre: item.nombre, ambito: "Contextual",
    porcentajePonderacion: item.porcentajePonderacion, escalaId: String(item.escalaMaxima), estado: item.estado
  }));

  const cierresSheet = ss.getSheetByName("CierresPeriodos");
  const cierresData = cierresSheet ? cierresSheet.getDataRange().getValues() : [];
  const cierreRow = cierresData.slice(1).find(row =>
    normalizeString(row[3]) === normalizeString(grado) &&
    normalizeString(row[4]) === normalizeString(seccion) &&
    normalizeString(row[5]) === normalizeString(asignatura) &&
    normalizeString(row[2]) === normalizeString(parcial));
  const estadoPeriodo = cierreRow ? cierreRow[7] : "Abierto";

  const resumenes = Object.create(null);
  alumnos.forEach(student => {
    resumenes[String(student.userId)] = calculateGradebookStudentSummary_(student.userId, calificaciones, categories, recoveries);
  });
  return {
    status: "success",
    data: { alumnos, calificaciones, recuperaciones: recoveries, categories, resumenes, estadoPeriodo,
      contexto: { anoId, periodoId: parcial, grado, seccion, asignatura, institutionId: scope.institutionId },
      configuracionPonderaciones: categories.length ? "Configurada" : "No configurada" }
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
    const context=getAuthorizedGradebookSaveContext_(payload,permissionAction);const result=mutation(context);if(action!=='getGradebookWeightConfiguration')advanceSaceExamSourceRevisionLocked_();return result;
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
  const anoId = String(p.anoId || p.anoLectivo || "").trim();
  if (!grado || !seccion || !asignatura || !parcial || !anoId) throw new Error("GRADEBOOK_CONTEXT_REQUIRED");
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
  const gradeContextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  if (gradeData[0].length > 16) throw new Error("GRADEBOOK_SCHEMA_INVALID");
  if (gradeData[0].length > 9 && gradeContextHeaders.some((header, index) =>
      String(gradeData[0][9 + index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_CONTEXT_SCHEMA_INVALID");
  }
  const weightConfiguration = getGradebookWeightConfigurationFromSheet_(ss, {
    scope, anoId, parcial, grado, seccion, asignatura
  });
  const weightCategoryIds = Object.create(null);
  weightConfiguration.forEach(item => { weightCategoryIds[item.categoriaId] = true; });
  return { ss, actor, scope, institutional, anoId, grado, seccion, asignatura, parcial, roster,
    gradeSheet, gradeData, categoryIds, ownedCategories, weightConfiguration, weightCategoryIds };
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
  const contextFields = { institutionId: context.scope.institutionId, anoId: context.anoId,
    periodoId: context.parcial, grado: context.grado, seccion: context.seccion, asignatura: context.asignatura };
  for (let i = 1; i < context.gradeData.length; i++) {
    const row = context.gradeData[i] || [];
    const key = String(row[15] || "").trim();
    if (!key) continue; // Las filas históricas sin contexto no se reutilizan en otro período.
    if (!pairRows[key]) pairRows[key] = [];
    pairRows[key].push(i);
  }
  const normalized = calificaciones.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("GRADEBOOK_ENTRY_INVALID");
    const evaluacionId = String(item.evaluacionId || "").trim(), userId = String(item.userId || "").trim();
    const raw = item.notaObtenida;
    if (!evaluacionId || !userId) throw new Error("GRADEBOOK_ENTRY_INVALID");
    if (!context.roster[userId]) throw new Error("GRADEBOOK_ENTRY_OUT_OF_SCOPE");
    if (!context.weightCategoryIds || !context.weightCategoryIds[evaluacionId]) {
      throw new Error("GRADEBOOK_WEIGHTS_NOT_CONFIGURED_OR_CATEGORY_INACTIVE");
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
    const key = buildGradebookContextKey_({ ...contextFields, evaluacionId, userId });
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
  const gradeContextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  const data = context.gradeData.map(r => {
    const copy = r.slice();
    while (copy.length < 16) copy.push("");
    return copy;
  });
  data[0] = data[0].slice(0, 9).concat(gradeContextHeaders);
  const now = new Date();
  let appliedCount = 0, omittedCount = 0;
  normalized.forEach(entry => {
    if (opts.preserveExistingPositive === true && entry.existing >= 1) {
      const previous = parseFloat(context.gradeData[entry.existing][3]);
      if (!isNaN(previous) && previous > 0) { omittedCount++; return; }
    }
    const row = entry.existing >= 1 ? data[entry.existing] :
      ["CALIF-" + Utilities.getUuid(), entry.evaluacionId, entry.userId, 0, 0, true, false, "", now,
        "", "", "", "", "", "", ""];
    row[3] = entry.grade; row[4] = entry.grade;
    row[5] = p.esBorrador !== false; row[6] = p.esPublicada === true;
    row[7] = entry.observaciones; row[8] = now;
    row[9] = context.anoId; row[10] = context.parcial; row[11] = context.grado;
    row[12] = context.seccion; row[13] = context.asignatura;
    row[14] = context.scope.institutionId;
    row[15] = buildGradebookContextKey_({ ...contextFields, evaluacionId: entry.evaluacionId, userId: entry.userId });
    if (entry.existing < 1) data.push(row); else data[entry.existing] = row;
    appliedCount++;
  });
  if (appliedCount > 0) context.gradeSheet.getRange(1, 1, data.length, 16).setValues(data);
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
      const expectedKey = buildGradebookContextKey_({ institutionId: context.scope.institutionId,
        anoId: context.anoId, periodoId: context.parcial, grado: context.grado, seccion: context.seccion,
        asignatura: context.asignatura, evaluacionId, userId });
      const existing = context.gradeData.slice(1).filter(row => String(row[15] || "").trim() === expectedKey);
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
    const context=getAuthorizedStudentRecoveryMutationContext_(payload);const result=mutation(context);advanceSaceExamSourceRevisionLocked_();return result;
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
function getAuthorizedStudentRecoveryMutationContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const evaluationId = String(p.evaluacionId || "").trim();
  const userId = String(p.userId || "").trim();
  const grade = String(p.grado || "").trim();
  const section = String(p.seccion || "").trim();
  const subject = String(p.asignatura || "").trim();
  const periodId = String(p.periodoId || p.parcial || "").trim();
  const anoId = String(p.anoId || p.anoLectivo || "").trim();
  const recoveredNumber = p.notaRecuperada === "" || p.notaRecuperada == null ? NaN : Number(p.notaRecuperada);
  const method = String(p.metodoAplicado || "Sustitucion").trim();
  if (!evaluationId || evaluationId === "CAT-GLOBAL" || !userId || !grade || !section ||
      !subject || !periodId || !anoId || !Number.isFinite(recoveredNumber) ||
      recoveredNumber < 0 || recoveredNumber > 100 ||
      ["Sustitucion", "Promedio", "Mayor"].indexOf(method) === -1) {
    throw new Error("STUDENT_RECOVERY_REQUIRED_FIELDS_INVALID");
  }
  const permission = validateRolePermission("saveStudentRecovery", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  const institutionRoles = ["Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      (String(actor.role || "").trim() !== "Profesor" &&
       institutionRoles.indexOf(String(actor.role || "").trim()) === -1)) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  const role = String(actor.role || "").trim();
  const profile = getExamStudentProfile_(ss, userId);
  if (!profile || ["Estudiante", "Alumno"].indexOf(String(profile.role || "").trim()) === -1 ||
      normalizeString(profile.grado) !== normalizeString(grade) ||
      normalizeString(profile.seccion) !== normalizeString(section)) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  if (role === "Profesor") {
    const config = getSheetOrThrow(ss, "ConfiguracionAcademica").getDataRange().getValues();
    const headers = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
    if (!config.length || headers.some((header, index) => String(config[0][index] || "").trim() !== header)) {
      throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
    }
    const matches = config.slice(1).filter(row =>
      normalizeString(row[2]) === normalizeString(periodId) &&
      normalizeString(row[3]) === normalizeString(grade) &&
      normalizeString(row[4]) === normalizeString(section) &&
      normalizeString(row[5]) === normalizeString(subject));
    if (!matches.length || matches.some(row => String(row[8] || "").trim() !== String(actor.userId).trim())) {
      throw new Error("RESOURCE_NOT_AVAILABLE");
    }
  } else if (scope.institutionWide !== true) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const closureSheet = ss.getSheetByName("CierresPeriodos");
  if (closureSheet) {
    const closureRows = closureSheet.getDataRange().getValues();
    if (closureRows.length) {
      const headers = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
      if (headers.some((header, index) => String(closureRows[0][index] || "").trim() !== header)) {
        throw new Error("PERIOD_CLOSURE_SCHEMA_INVALID");
      }
      const matches = closureRows.slice(1).filter(row =>
        normalizeString(row[2]) === normalizeString(periodId) &&
        normalizeString(row[3]) === normalizeString(grade) &&
        normalizeString(row[4]) === normalizeString(section) &&
        normalizeString(row[5]) === normalizeString(subject) &&
        (!String(row[1] || "").trim() || String(row[1]).trim() === anoId));
      if (matches.length > 1 || matches.some(row => String(row[7] || "").trim() === "Cerrado")) {
        throw new Error("STUDENT_RECOVERY_PERIOD_CLOSED_OR_AMBIGUOUS");
      }
    }
  }

  const weightConfiguration = getGradebookWeightConfigurationFromSheet_(ss, {
    scope, anoId, parcial: periodId, grado: grade, seccion: section, asignatura: subject
  });
  if (!weightConfiguration.some(item => item.categoriaId === evaluationId)) {
    throw new Error("STUDENT_RECOVERY_CATEGORY_NOT_CONFIGURED");
  }
  const grades = getSheetOrThrow(ss, "CalificacionesEstudiantes").getDataRange().getValues();
  const gradeBaseHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado",
    "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  const gradeContextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  if (!grades.length || gradeBaseHeaders.some((header, index) => String(grades[0][index] || "").trim() !== header) ||
      gradeContextHeaders.some((header, index) => String(grades[0][9 + index] || "").trim() !== header)) {
    throw new Error("STUDENT_RECOVERY_GRADEBOOK_SCHEMA_INVALID");
  }
  const contextFields = { institutionId: scope.institutionId, anoId, periodoId: periodId,
    grado: grade, seccion: section, asignatura: subject };
  const contextKey = buildGradebookContextKey_({ ...contextFields, evaluacionId: evaluationId, userId });
  const gradeMatches = grades.slice(1).filter(row =>
    String(row[1] || "").trim() === evaluationId &&
    String(row[2] || "").trim() === userId &&
    String(row[9] || "").trim() === anoId &&
    normalizeString(row[10]) === normalizeString(periodId) &&
    normalizeString(row[11]) === normalizeString(grade) &&
    normalizeString(row[12]) === normalizeString(section) &&
    normalizeString(row[13]) === normalizeString(subject) &&
    String(row[14] || "").trim() === String(scope.institutionId).trim() &&
    String(row[15] || "").trim() === contextKey);
  if (gradeMatches.length !== 1) throw new Error("STUDENT_RECOVERY_GRADEBOOK_NOT_FOUND_OR_AMBIGUOUS");
  const gradeRow = gradeMatches[0];
  const originalGrade = gradeRow[3] === "" || gradeRow[3] == null ? NaN : Number(gradeRow[3]);
  const isDraft = gradeRow[5] === true || String(gradeRow[5]).toLowerCase() === "true";
  const isPublished = gradeRow[6] === true || String(gradeRow[6]).toLowerCase() === "true";
  if (!Number.isFinite(originalGrade) || originalGrade < 0 || originalGrade > 100 || isDraft || !isPublished) {
    throw new Error("STUDENT_RECOVERY_GRADEBOOK_NOT_FINAL");
  }

  const recoveryHeaders = ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada",
    "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha", "AnoID",
    "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  const recoverySheet = ss.getSheetByName("RecuperacionesEstudiante");
  const recoveryData = recoverySheet ? recoverySheet.getDataRange().getValues() : [];
  if (recoveryData.length && recoveryHeaders.slice(0, 9).some((header, index) =>
      String(recoveryData[0][index] || "").trim() !== header)) {
    throw new Error("STUDENT_RECOVERY_SCHEMA_INVALID");
  }
  if (recoveryData.length && recoveryData[0].length > 9 &&
      recoveryHeaders.slice(9).some((header, index) => String(recoveryData[0][9 + index] || "").trim() !== header)) {
    throw new Error("STUDENT_RECOVERY_CONTEXT_SCHEMA_INVALID");
  }
  const normalizedRecoveryData = recoveryData.map(row => {
    const copy = row.slice();
    while (copy.length < recoveryHeaders.length) copy.push("");
    return copy;
  });
  if (normalizedRecoveryData.length) normalizedRecoveryData[0] = recoveryHeaders.slice();
  const idCounts = Object.create(null);
  normalizedRecoveryData.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  if (Object.keys(idCounts).some(id => idCounts[id] !== 1)) throw new Error("STUDENT_RECOVERY_HISTORY_AMBIGUOUS");
  const previous = normalizedRecoveryData.slice(1).filter(row => String(row[15] || "").trim() === contextKey);
  let effectiveOriginal = originalGrade;
  if (previous.length) {
    previous.sort((a, b) => {
      const at = a[8] ? new Date(a[8]).getTime() : 0;
      const bt = b[8] ? new Date(b[8]).getTime() : 0;
      return at - bt;
    });
    const prior = Number(previous[previous.length - 1][5]);
    if (!Number.isFinite(prior) || prior < 0 || prior > 100) throw new Error("STUDENT_RECOVERY_HISTORY_INVALID");
    effectiveOriginal = prior;
  }
  return { ss, sheet: recoverySheet || getOrCreateSheet(ss, "RecuperacionesEstudiante"),
    recoveryData: normalizedRecoveryData, recoveryHeaders, actor, scope, evaluationId, userId,
    grade, section, subject, periodId, anoId, contextFields, contextKey,
    recoveredNumber, method, originalGrade: effectiveOriginal };
}

function saveStudentRecoveryUnlocked_(payload, context) {
  const sheet = context.sheet || getOrCreateSheet(context.ss, "RecuperacionesEstudiante");
  const now = new Date();
  const id = "REC-" + Utilities.getUuid();
  const data = context.recoveryData && context.recoveryData.length
    ? context.recoveryData.map(row => row.slice())
    : [context.recoveryHeaders.slice()];
  data[0] = context.recoveryHeaders.slice();
  const original = context.originalGrade, recovered = context.recoveredNumber;
  let finalGrade = recovered;
  if (context.method === "Promedio") finalGrade = (original + recovered) / 2;
  else if (context.method === "Mayor") finalGrade = Math.max(original, recovered);
  data.push([id, context.evaluationId, context.userId, original, recovered, finalGrade,
    context.method, String(context.actor.userId).trim(), now, context.anoId,
    context.periodId, context.grade, context.section, context.subject,
    context.scope.institutionId, context.contextKey]);
  sheet.getRange(1, 1, data.length, context.recoveryHeaders.length).setValues(data);
  return { status: "success", message: "Recuperación vinculada a la calificación contextual registrada.",
    data: { recuperacionId: id, notaOriginal: original, notaRecuperada: recovered,
      notaFinalCalculada: finalGrade, metodoAplicado: context.method,
      evaluacionId: context.evaluationId, anoId: context.anoId, periodoId: context.periodId } };
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
  try {const context=getAuthorizedPeriodGradebookClosureContext_(payload);const result=mutation(context);advanceSaceExamSourceRevisionLocked_();return result;}
  finally { try { lock.releaseLock(); } catch (_) {} }
}
function getAuthorizedPeriodGradebookClosureContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const anoId = String(p.anoId || "").trim();
  const periodoId = String(p.periodoId || "").trim();
  const grado = String(p.grado || "").trim();
  const seccion = String(p.seccion || "").trim();
  const asignatura = String(p.asignatura || "").trim();
  if (!anoId || !periodoId || !grado || !seccion || !asignatura) {
    throw new Error("GRADEBOOK_CLOSURE_REQUIRED_CONTEXT");
  }

  const permission = validateRolePermission("closePeriodGradebook", p);
  if (!permission || permission.authorized !== true) throw new Error("RESOURCE_NOT_AVAILABLE");
  const actor = getVerifiedExamIdentity_(p);
  const role = String(actor && actor.role || "").trim();
  const roles = ["Profesor", "Administrador", "Desarrollador", "Dirección", "Director", "Secretaría"];
  if (!actor || actor.authorized !== true || !String(actor.userId || "").trim() ||
      roles.indexOf(role) === -1) throw new Error("RESOURCE_NOT_AVAILABLE");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scope = getVerifiedExamDepartmentScope_(p, ss, actor);
  if (!scope || scope.authorized !== true || !String(scope.institutionId || "").trim()) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }
  if (role !== "Profesor" && scope.institutionWide !== true) throw new Error("RESOURCE_NOT_AVAILABLE");

  const config = getSheetOrThrow(ss, "ConfiguracionAcademica").getDataRange().getValues();
  const configHeaders = ["ID", "Fecha", "Parcial", "Grado", "Sección", "Asignatura", "Unidad", "Tema", "profesorId"];
  if (!config.length || configHeaders.some((header, index) =>
      String(config[0][index] || "").trim() !== header)) {
    throw new Error("ACADEMIC_ASSIGNMENT_SCHEMA_INVALID");
  }
  const assignments = config.slice(1).filter(row =>
    normalizeString(row[2]) === normalizeString(periodoId) &&
    normalizeString(row[3]) === normalizeString(grado) &&
    normalizeString(row[4]) === normalizeString(seccion) &&
    normalizeString(row[5]) === normalizeString(asignatura));
  if (!assignments.length) throw new Error("RESOURCE_NOT_AVAILABLE");
  if (role === "Profesor" && (String(p.profesorId || "").trim() !== String(actor.userId).trim() ||
      assignments.some(row => String(row[8] || "").trim() !== String(actor.userId).trim()))) {
    throw new Error("RESOURCE_NOT_AVAILABLE");
  }

  const groupAssignments = config.slice(1).filter(row =>
    normalizeString(row[3]) === normalizeString(grado) &&
    normalizeString(row[4]) === normalizeString(seccion));
  const subjects = Array.from(new Set(groupAssignments.map(row => normalizeString(row[5])).filter(Boolean)));
  const periods = Array.from(new Set(groupAssignments.map(row => normalizeString(row[2])).filter(Boolean)));
  if (subjects.length !== 1 || periods.length !== 1 ||
      subjects[0] !== normalizeString(asignatura) || periods[0] !== normalizeString(periodoId)) {
    throw new Error("GRADEBOOK_PERIOD_SUBJECT_CONTEXT_AMBIGUOUS");
  }

  const users = getSheetOrThrow(ss, "Usuarios").getDataRange().getValues();
  const counts = Object.create(null);
  users.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  const studentIds = users.slice(1).filter(row => {
    const id = String(row[0] || "").trim();
    const studentRole = normalizeString(row[6] || row[5]);
    return id && counts[id] === 1 && (studentRole === "estudiante" || studentRole === "alumno") &&
      normalizeString(row[2]) === normalizeString(grado) &&
      normalizeString(row[3]) === normalizeString(seccion);
  }).map(row => String(row[0]).trim());
  if (!studentIds.length) throw new Error("GRADEBOOK_CLOSURE_ROSTER_EMPTY");

  const weightConfiguration = getGradebookWeightConfigurationFromSheet_(ss, {
    scope, anoId, parcial: periodoId, grado, seccion, asignatura
  });
  if (!weightConfiguration.length) throw new Error("GRADEBOOK_CLOSURE_WEIGHTS_NOT_CONFIGURED");
  const configuredCategories = Object.create(null);
  weightConfiguration.forEach(item => { configuredCategories[item.categoriaId] = true; });

  const grades = getSheetOrThrow(ss, "CalificacionesEstudiantes").getDataRange().getValues();
  const gradeBaseHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado",
    "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  const gradeContextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  if (!grades.length || grades[0].length !== 16 ||
      gradeBaseHeaders.some((header, index) => String(grades[0][index] || "").trim() !== header) ||
      gradeContextHeaders.some((header, index) => String(grades[0][9 + index] || "").trim() !== header)) {
    throw new Error("GRADEBOOK_CLOSURE_GRADE_SCHEMA_INVALID");
  }

  const roster = new Set(studentIds);
  const byStudent = Object.create(null);
  const contextFields = { institutionId: scope.institutionId, anoId, periodoId,
    grado, seccion, asignatura };
  grades.slice(1).forEach(row => {
    const userId = String(row[2] || "").trim();
    if (!roster.has(userId)) return;
    if (String(row[9] || "").trim() !== anoId ||
        normalizeString(row[10]) !== normalizeString(periodoId) ||
        normalizeString(row[11]) !== normalizeString(grado) ||
        normalizeString(row[12]) !== normalizeString(seccion) ||
        normalizeString(row[13]) !== normalizeString(asignatura) ||
        String(row[14] || "").trim() !== String(scope.institutionId).trim()) return;

    const categoryId = String(row[1] || "").trim();
    if (!configuredCategories[categoryId]) {
      throw new Error("GRADEBOOK_CLOSURE_CATEGORY_NOT_CONFIGURED");
    }
    const expectedKey = buildGradebookContextKey_({
      ...contextFields, evaluacionId: categoryId, userId
    });
    if (!String(row[0] || "").trim() || String(row[15] || "").trim() !== expectedKey) {
      throw new Error("GRADEBOOK_CLOSURE_CONTEXT_KEY_INVALID");
    }
    if (!byStudent[userId]) byStudent[userId] = Object.create(null);
    if (byStudent[userId][categoryId]) throw new Error("GRADEBOOK_CLOSURE_CATEGORY_AMBIGUOUS");

    const rawScore = row[3];
    const score = rawScore === "" || rawScore == null ? NaN : Number(rawScore);
    const draft = row[5] === true || String(row[5]).toLowerCase() === "true";
    const published = row[6] === true || String(row[6]).toLowerCase() === "true";
    if (!Number.isFinite(score) || score < 0 || score > 100 || draft || !published) {
      throw new Error("GRADEBOOK_CLOSURE_UNPUBLISHED_GRADES");
    }
    byStudent[userId][categoryId] = true;
  });

  studentIds.forEach(userId => {
    const studentGrades = byStudent[userId] || {};
    if (weightConfiguration.some(category => studentGrades[category.categoriaId] !== true)) {
      throw new Error("GRADEBOOK_CLOSURE_INCOMPLETE_GRADES");
    }
  });

  const closureSheet = ss.getSheetByName("CierresPeriodos");
  const closureHeaders = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion",
    "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  let latestClosure = null;
  if (closureSheet) {
    const closureRows = closureSheet.getDataRange().getValues();
    if (closureRows.length && closureHeaders.some((header, index) =>
        String(closureRows[0][index] || "").trim() !== header)) {
      throw new Error("GRADEBOOK_CLOSURE_SCHEMA_INVALID");
    }
    const sameContextRows = [];
    for (let index = 1; index < closureRows.length; index++) {
      const row = closureRows[index] || [];
      if (normalizeString(row[1]) === normalizeString(anoId) &&
          normalizeString(row[2]) === normalizeString(periodoId) &&
          normalizeString(row[3]) === normalizeString(grado) &&
          normalizeString(row[4]) === normalizeString(seccion) &&
          normalizeString(row[5]) === normalizeString(asignatura)) {
        sameContextRows.push({ row, rowIndex: index + 1 });
      }
    }
    latestClosure = sameContextRows.length ? sameContextRows[sameContextRows.length - 1] : null;
    if (latestClosure) {
      const state = String(latestClosure.row[7] || "").trim();
      if (state === "Cerrado") throw new Error("GRADEBOOK_CLOSURE_ALREADY_EXISTS");
      if (["PendienteRevision", "Observado"].indexOf(state) !== -1) {
        throw new Error("GRADEBOOK_CLOSURE_REVIEW_NOT_APPROVED");
      }
      if (["Aprobado", "Publicado", "Reabierto"].indexOf(state) === -1) {
        throw new Error("GRADEBOOK_CLOSURE_STATE_INVALID");
      }
    }
  }
  return {
    ss, closureSheet, closureHeaders, actor, anoId, periodoId, grado, seccion, asignatura,
    existingClosureRow: latestClosure ? latestClosure.rowIndex : 0,
    existingClosureId: latestClosure ? String(latestClosure.row[0] || "").trim() : ""
  };
}

function closePeriodGradebookUnlocked_(c) {
  const sheet = c.closureSheet || getOrCreateSheet(c.ss, "CierresPeriodos");
  if (!c.closureSheet || sheet.getLastRow() === 0) sheet.appendRow(c.closureHeaders);
  const now = new Date();
  if (c.existingClosureRow) {
    sheet.getRange(c.existingClosureRow, 8, 1, 2).setValues([["Cerrado", now]]);
    return {
      status: "success", cierreId: c.existingClosureId,
      message: "La revisión aprobada del período se cerró correctamente."
    };
  }
  const id = "CIERRE-" + Utilities.getUuid();
  if (sheet.getDataRange().getValues().slice(1).some(row => String(row[0] || "").trim() === id)) {
    throw new Error("GRADEBOOK_CLOSURE_ID_COLLISION");
  }
  sheet.appendRow([id, c.anoId, c.periodoId, c.grado, c.seccion, c.asignatura,
    String(c.actor.userId).trim(), "Cerrado", now]);
  return {
    status: "success", cierreId: id,
    message: "Período cerrado. Todas las categorías configuradas para el contexto ya estaban publicadas."
  };
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
    const context=getAuthorizedPeriodGradebookSubmissionContext_(payload);const result=mutation(context);advanceSaceExamSourceRevisionLocked_();return result;
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getAuthorizedPeriodGradebookSubmissionContext_(payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const anoId = String(p.anoId || "").trim();
  const periodoId = String(p.periodoId || "").trim();
  const grado = String(p.grado || "").trim();
  const seccion = String(p.seccion || "").trim();
  const asignatura = String(p.asignatura || "").trim();
  if (!anoId || anoId.length > 120 || !periodoId || periodoId.length > 120 ||
      !grado || grado.length > 120 || !seccion || seccion.length > 80 ||
      !asignatura || asignatura.length > 160) {
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

  const weightConfiguration = getGradebookWeightConfigurationFromSheet_(ss, {
    scope, anoId, parcial: periodoId, grado, seccion, asignatura
  });
  if (!weightConfiguration.length) throw new Error("GRADEBOOK_SUBMISSION_WEIGHTS_NOT_CONFIGURED");

  const sheet = ss.getSheetByName("CierresPeriodos");
  const closureHeaders = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  if (sheet) {
    const data = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [];
    if (data.length && closureHeaders.some((header, index) =>
      String(data[0][index] || "").trim() !== header)) {
      throw new Error("GRADEBOOK_SUBMISSION_SCHEMA_INVALID");
    }
    const sameContext = data.slice(1).filter(row =>
      normalizeString(row[1]) === normalizeString(anoId) &&
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
  const currentState = String(target.row[7] || "").trim();
  const expectedSourceState = decision === "Publicado" ? "Aprobado" : "PendienteRevision";
  if (currentState !== expectedSourceState) throw new Error("GRADEBOOK_REVIEW_STATE_INVALID");

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
    estadoTarget: decision === "Observado" ? "Observado" : decision === "Publicado" ? "Publicado" : "Aprobado",
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
    const context=getAuthorizedPeriodGradebookReopenContext_(payload);const result=mutation(context);advanceSaceExamSourceRevisionLocked_();return result;
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
    const context=getAuthorizedStudentGradeRectificationContext_(payload);const result=mutation(context);advanceSaceExamSourceRevisionLocked_();return result;
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


function buildStudentAcademicReportGradebook_(ss, scope, targetUserId, payload) {
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const sheet = ss.getSheetByName("CalificacionesEstudiantes");
  if (!sheet) return { contextos: [], detalleAsignaturas: [], resumenGeneral: {
    totalAsignaturas: 0, promedioGeneral: null, asignaturasAprobadas: 0, asignaturasReprobadas: 0
  }, esDocumentoOficial: false };
  const rows = sheet.getDataRange().getValues();
  const baseHeaders = ["ID", "EvaluacionID", "UserID", "NotaObtenida", "PuntajePonderado",
    "EsBorrador", "EsPublicada", "Observaciones", "FechaRegistro"];
  const contextHeaders = ["AnoID", "PeriodoID", "Grado", "Seccion", "Asignatura", "InstitutionID", "ContextKey"];
  if (!rows.length || baseHeaders.some((header, index) => String(rows[0][index] || "").trim() !== header)) {
    throw new Error("STUDENT_ACADEMIC_REPORT_SCHEMA_INVALID");
  }
  if (rows[0].length === 9) return { contextos: [], detalleAsignaturas: [], resumenGeneral: {
    totalAsignaturas: 0, promedioGeneral: null, asignaturasAprobadas: 0, asignaturasReprobadas: 0
  }, esDocumentoOficial: false };
  if (rows[0].length !== 16 || contextHeaders.some((header, index) =>
      String(rows[0][9 + index] || "").trim() !== header)) {
    throw new Error("STUDENT_ACADEMIC_REPORT_CONTEXT_SCHEMA_INVALID");
  }
  const idCounts = Object.create(null);
  rows.slice(1).forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  const yearFilter = String(p.anoId || "").trim();
  const periodFilter = String(p.periodoId || p.parcial || "").trim();
  const contexts = Object.create(null);
  const grades = rows.slice(1).filter(row => {
    const id = String(row[0] || "").trim();
    if (!id || idCounts[id] !== 1 || String(row[2] || "").trim() !== targetUserId) return false;
    const draft = row[5] === true || String(row[5]).toLowerCase() === "true";
    const published = row[6] === true || String(row[6]).toLowerCase() === "true";
    if (draft || !published) return false;
    const year = String(row[9] || "").trim(), period = String(row[10] || "").trim();
    const grade = String(row[11] || "").trim(), section = String(row[12] || "").trim();
    const subject = String(row[13] || "").trim(), institutionId = String(row[14] || "").trim();
    if (!year || !period || !grade || !section || !subject ||
        institutionId !== String(scope.institutionId || "").trim() ||
        (yearFilter && year !== yearFilter) ||
        (periodFilter && normalizeString(period) !== normalizeString(periodFilter))) return false;
    const expectedKey = buildGradebookContextKey_({ institutionId, anoId: year, periodoId: period,
      grado: grade, seccion: section, asignatura: subject, evaluacionId: row[1], userId: row[2] });
    if (String(row[15] || "").trim() !== expectedKey) return false;
    return true;
  });
  grades.forEach(row => {
    const key = JSON.stringify([row[9], row[10], row[11], row[12], row[13]]);
    if (!contexts[key]) contexts[key] = { anoId: String(row[9]), periodoId: String(row[10]),
      grado: String(row[11]), seccion: String(row[12]), asignatura: String(row[13]), grades: [] };
    contexts[key].grades.push({ userId: String(row[2]), evaluacionId: String(row[1]),
      notaObtenida: row[3] === "" || row[3] == null ? null : Number(row[3]),
      esBorrador: false, esPublicada: true });
  });
  const recoverySheet = ss.getSheetByName("RecuperacionesEstudiante");
  const recoveryRows = recoverySheet ? recoverySheet.getDataRange().getValues() : [];
  const recoveryBaseHeaders = ["ID", "EvaluacionID", "UserID", "NotaOriginal", "NotaRecuperada",
    "NotaFinalCalculada", "MetodoAplicado", "AutorizadoPor", "Fecha"];
  if (recoveryRows.length && recoveryBaseHeaders.some((header, index) =>
      String(recoveryRows[0][index] || "").trim() !== header)) {
    throw new Error("STUDENT_ACADEMIC_REPORT_SCHEMA_INVALID");
  }
  const recoveryHasContext = recoveryRows.length > 0 && recoveryRows[0].length === 16 &&
    contextHeaders.every((header, index) => String(recoveryRows[0][9 + index] || "").trim() === header);
  if (recoveryRows.length && recoveryRows[0].length !== 9 && !recoveryHasContext) {
    throw new Error("STUDENT_ACADEMIC_REPORT_CONTEXT_SCHEMA_INVALID");
  }
  const contextualRecoveryRows = recoveryHasContext ? recoveryRows.slice(1) : [];
  const recoveryCounts = Object.create(null);
  contextualRecoveryRows.forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) recoveryCounts[id] = (recoveryCounts[id] || 0) + 1;
  });
  const detalleAsignaturas = Object.keys(contexts).sort().map(key => {
    const context = contexts[key];
    const recoveryContextKey = item => buildGradebookContextKey_({
      institutionId: scope.institutionId, anoId: context.anoId, periodoId: context.periodoId,
      grado: context.grado, seccion: context.seccion, asignatura: context.asignatura,
      evaluacionId: item[1], userId: item[2]
    });
    const recoveries = contextualRecoveryRows.filter(row => {
      const id = String(row[0] || "").trim();
      return !!id && recoveryCounts[id] === 1 && String(row[2] || "").trim() === targetUserId &&
        String(row[9] || "").trim() === context.anoId &&
        normalizeString(row[10]) === normalizeString(context.periodoId) &&
        normalizeString(row[11]) === normalizeString(context.grado) &&
        normalizeString(row[12]) === normalizeString(context.seccion) &&
        normalizeString(row[13]) === normalizeString(context.asignatura) &&
        String(row[14] || "").trim() === String(scope.institutionId || "").trim() &&
        String(row[15] || "").trim() === recoveryContextKey(row);
    }).map(row => ({ userId: String(row[2]), evaluacionId: String(row[1]),
      notaFinalCalculada: row[5] === "" || row[5] == null ? null : Number(row[5]),
      fecha: row[8] ? new Date(row[8]).toISOString() : null }));
    const weights = getGradebookWeightConfigurationFromSheet_(ss, { scope,
      anoId: context.anoId, parcial: context.periodoId, grado: context.grado,
      seccion: context.seccion, asignatura: context.asignatura });
    const summary = calculateGradebookStudentSummary_(targetUserId, context.grades, weights, recoveries);
    const categorias = context.grades.map(item => {
      const history = recoveries.filter(recovery => recovery.evaluacionId === item.evaluacionId);
      history.sort((a, b) => {
        const at = a.fecha ? new Date(a.fecha).getTime() : 0;
        const bt = b.fecha ? new Date(b.fecha).getTime() : 0;
        return at - bt;
      });
      const latest = history.length ? history[history.length - 1] : null;
      const recoveryGrade = latest ? latest.notaFinalCalculada : null;
      const hasValidRecoveryGrade = recoveryGrade !== null && recoveryGrade !== undefined &&
        recoveryGrade !== "" && Number.isFinite(Number(recoveryGrade));
      const weight = weights.find(category => category.categoriaId === item.evaluacionId);
      return { categoriaId: item.evaluacionId, nombre: weight ? weight.nombre : item.evaluacionId,
        porcentajePonderacion: weight ? weight.porcentajePonderacion : null,
        notaObtenida: item.notaObtenida,
        notaFinalAplicada: hasValidRecoveryGrade ? Number(recoveryGrade) : item.notaObtenida,
        recuperacionAplicada: hasValidRecoveryGrade };
    });
    return { anoId: context.anoId, periodo: context.periodoId, grado: context.grado,
      seccion: context.seccion, asignatura: context.asignatura, estado: summary.status,
      notaFinal: summary.notaFinal, avancePonderado: summary.avancePonderado,
      ponderacionPendiente: summary.ponderacionPendiente, categorias };
  });
  const calculated = detalleAsignaturas.filter(item => item.estado === "calculated");
  const average = calculated.length
    ? Math.round(calculated.reduce((sum, item) => sum + Number(item.notaFinal), 0) / calculated.length * 100) / 100
    : null;
  const closureSheet = ss.getSheetByName("CierresPeriodos");
  const closureRows = closureSheet ? closureSheet.getDataRange().getValues() : [];
  const closureHeaders = ["CierreID", "AnoID", "PeriodoID", "Grado", "Seccion",
    "Asignatura", "ProfesorID", "Estado", "FechaCierre"];
  const legacyClosureHeaders = ["ID", "Fecha", "Parcial", "Grado", "Seccion",
    "Asignatura", "ProfesorID", "Estado"];
  const contextualClosureSchema = closureRows.length > 0 && closureRows[0].length === 9 &&
    closureHeaders.every((header, index) => String(closureRows[0][index] || "").trim() === header);
  const legacyClosureSchema = closureRows.length > 0 && closureRows[0].length === 8 &&
    legacyClosureHeaders.every((header, index) => String(closureRows[0][index] || "").trim() === header);
  if (closureRows.length && !contextualClosureSchema && !legacyClosureSchema) {
    throw new Error("STUDENT_ACADEMIC_REPORT_CLOSURE_SCHEMA_INVALID");
  }
  const matchingClosures = contextualClosureSchema && yearFilter && periodFilter ? closureRows.slice(1).filter(row =>
    String(row[1] || "").trim() === yearFilter &&
    normalizeString(row[2]) === normalizeString(periodFilter) &&
    detalleAsignaturas.some(item => item.anoId === yearFilter &&
      normalizeString(item.periodo) === normalizeString(periodFilter) &&
      normalizeString(item.grado) === normalizeString(row[3]) &&
      normalizeString(item.seccion) === normalizeString(row[4]) &&
      normalizeString(item.asignatura) === normalizeString(row[5]))) : [];
  // Una única fila de cierre por contexto; un duplicado o estado contradictorio nunca es oficial.
  const allContextsClosed = !!yearFilter && !!periodFilter && detalleAsignaturas.length > 0 &&
    detalleAsignaturas.every(item => {
      if (item.anoId !== yearFilter || normalizeString(item.periodo) !== normalizeString(periodFilter)) return false;
      const matches = matchingClosures.filter(row => normalizeString(row[3]) === normalizeString(item.grado) &&
        normalizeString(row[4]) === normalizeString(item.seccion) &&
        normalizeString(row[5]) === normalizeString(item.asignatura));
      return matches.length === 1 && String(matches[0][7] || "").trim().toLowerCase() === "cerrado";
    });
  const esDocumentoOficial = allContextsClosed &&
    detalleAsignaturas.every(item => item.estado === "calculated");
  return { contextos: detalleAsignaturas.map(item => ({
      anoId: item.anoId, periodo: item.periodo, grado: item.grado, seccion: item.seccion, asignatura: item.asignatura
    })), detalleAsignaturas, resumenGeneral: {
      totalAsignaturas: detalleAsignaturas.length, promedioGeneral: average,
      asignaturasAprobadas: calculated.filter(item => item.notaFinal >= 70).length,
      asignaturasReprobadas: calculated.filter(item => item.notaFinal < 70).length
    }, estadoPeriodo: esDocumentoOficial ? "Cerrado" : (legacyClosureSchema ? "No verificable (esquema histórico)" : "Abierto"), esDocumentoOficial };
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

  const libroConsolidado = buildStudentAcademicReportGradebook_(ss, scope, targetUserId, p);
  return { status: "success", data: {
    userId: targetUserId,
    matriculas: userMatriculas.map(row => ({
      matriculaId: row[0], fecha: row[1], grado: row[4], seccion: row[5], periodo: row[6], estado: row[8]
    })),
    calificaciones: userCalificaciones,
    recuperaciones: userRecuperaciones,
    categories,
    libroConsolidado
  }};
}
