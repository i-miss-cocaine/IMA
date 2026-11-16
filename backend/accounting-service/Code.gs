/**
 * Preflight semántico de migraciones documentales.
 * La identidad, el tenant y el destino se obtienen del contexto verificado;
 * los datos del navegador solo describen el archivo y el mapeo propuesto.
 */
function buildAccountingIdentityMapSnapshot_(payload, ss) {
  var institutionId = String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID") || PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") || "").trim();
  var sheet = ss.getSheetByName("CorrespondenciaIdentificadores");
  var rows = sheet ? sheet.getDataRange().getValues() : [];
  var headers = rows.length ? rows[0].map(function(value) { return String(value || "").trim(); }) : [];
  var index = {};
  headers.forEach(function(name, position) { index[name] = position; });
  var entries = [];
  var uniqueness = {};
  var violations = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var rowInstitution = String(row[index.institucionId] || "").trim();
    if (!rowInstitution || rowInstitution !== institutionId) continue;
    var entry = {
      sistemaOrigen: String(row[index.sistemaOrigen] || "").trim(),
      tipoEntidad: String(row[index.tipoEntidad] || "").trim().toLowerCase(),
      idOriginalLegado: String(row[index.idOriginalLegado] || "").trim(),
      idNuevoPlataforma: String(row[index.idNuevoPlataforma] || "").trim(),
      institucionId: rowInstitution,
      estadoCorrespondencia: String(row[index.estadoCorrespondencia] || "").trim().toUpperCase(),
      metodoCoincidencia: String(row[index.metodoCoincidencia] || "").trim(),
      nivelConfianza: String(row[index.nivelConfianza] || "").trim()
    };
    if (!entry.sistemaOrigen || !entry.tipoEntidad || !entry.idOriginalLegado) continue;
    var key = [entry.sistemaOrigen, entry.tipoEntidad, entry.idOriginalLegado].join("|");
    if (uniqueness[key]) violations.push({ key: key, count: uniqueness[key] + 1 });
    uniqueness[key] = (uniqueness[key] || 0) + 1;
    entries.push(entry);
  }
  return { institutionId: institutionId, entries: entries, uniquenessViolations: violations };
}

function resolveAccountingIdentityFromSnapshot_(snapshot, sourceName, entityType, legacyId, institutionId) {
  var key = String(sourceName || "").trim();
  var type = String(entityType || "").trim().toLowerCase();
  var legacy = String(legacyId || "").trim();
  var tenant = String(institutionId || snapshot && snapshot.institutionId || "").trim();
  var matches = (snapshot && snapshot.entries || []).filter(function(entry) {
    return entry.sistemaOrigen === key && entry.tipoEntidad === type &&
      entry.idOriginalLegado === legacy && entry.institucionId === tenant;
  });
  if (matches.length > 1) return { valid: false, code: "IDENTITY_UNIQUENESS_VIOLATION" };
  if (!matches.length) return { valid: false, code: "IDENTITY_MAPPING_NOT_FOUND" };
  var match = matches[0];
  if (match.estadoCorrespondencia !== "CONFIRMADA" || !match.idNuevoPlataforma) {
    return { valid: false, code: "IDENTITY_MAPPING_NOT_CONFIRMED" };
  }
  return { valid: true, idNuevoPlataforma: match.idNuevoPlataforma, mapping: match };
}

function resolveCrossReferenceIdentifier(input) {
  var request = input || {};
  var actor = getVerifiedAccountingIdentity_(request);
  if (!actor || actor.authorized !== true) {
    return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  }
  var sourceName = String(request.sistemaOrigen || "").trim();
  var entityType = String(request.tipoEntidad || "").trim().toLowerCase();
  var legacyId = String(request.idOriginalLegado || "").trim();
  if (!sourceName || !entityType || !legacyId) return { status: "error", code: "IDENTITY_MAPPING_INPUT_INVALID" };
  var snapshot = requestAccountingIdentityMapSnapshot_({
    sessionToken: request.sessionToken, institutionId: actor.institutionId,
    correlationId: request.correlationId,
    lookups: [{ sourceName: sourceName, entityType: entityType, legacyIds: [legacyId] }]
  });
  if (!snapshot || snapshot.status !== "success" || snapshot.verified !== true) {
    return { status: "error", code: snapshot && snapshot.code || "IDENTITY_MAPPING_SNAPSHOT_UNAVAILABLE" };
  }
  var resolved = resolveAccountingIdentityFromSnapshot_(snapshot, sourceName, entityType, legacyId, actor.institutionId);
  if (!resolved.valid) return { status: "error", code: resolved.code || "IDENTITY_MAPPING_NOT_FOUND" };
  return { status: "success", idNuevoPlataforma: resolved.idNuevoPlataforma,
    institutionId: actor.institutionId, estadoCorrespondencia: "CONFIRMADA" };
}

function requestAccountingTrustedOwnerSnapshot_(service, payload) {
  var target = String(service || "").toUpperCase();
  var propertyName = target === "USER" ? "IMA_USER_SERVICE_URL" : (target === "ACADEMIC" ? "IMA_ACADEMIC_SERVICE_URL" : "");
  if (!propertyName) return { status: "error", code: "MIGRATION_OWNER_SERVICE_NOT_ALLOWED" };
  var properties = PropertiesService.getScriptProperties();
  var endpoint = String(properties.getProperty(propertyName) || "").trim();
  var secret = String(properties.getProperty("IMA_MIGRATION_HMAC_SECRET") || "").trim();
  if (!isAccountingTrustedAppsScriptEndpoint_(endpoint) || secret.length < 32 || typeof UrlFetchApp === "undefined") {
    return { status: "error", code: "MIGRATION_OWNER_SERVICE_NOT_CONFIGURED" };
  }
  var now = Date.now();
  var requestId = "REQ-" + now + "-" + Utilities.getUuid().replace(/-/g, "").slice(0, 12);
  var correlationId = "CORR-" + Utilities.getUuid().replace(/-/g, "");
  var body = payload || {};
  var bodyToSign = [requestId, now, correlationId, "ACCOUNTING", target, "getMigrationTargetExistenceSnapshot", JSON.stringify(body)].join("|");
  var envelope = {
    sourceService: "ACCOUNTING", targetService: target, action: "getMigrationTargetExistenceSnapshot",
    requestId: requestId, timestamp: now, correlationId: correlationId, payload: body,
    hmacSignature: accountingComputeHmacSignature_(bodyToSign, secret)
  };
  try {
    var response = UrlFetchApp.fetch(endpoint, {
      method: "post", contentType: "application/json", payload: JSON.stringify(envelope), muteHttpExceptions: true
    });
    var httpStatus = response.getResponseCode();
    var parsed = {};
    try { parsed = JSON.parse(response.getContentText() || "{}"); } catch (ignored) {}
    if (httpStatus < 200 || httpStatus >= 300 || !parsed || parsed.status !== "success") {
      return { status: "error", code: parsed && parsed.code || "MIGRATION_OWNER_SNAPSHOT_UNAVAILABLE" };
    }
    var data = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
    return Object.assign({}, data, { status: parsed.status });
  } catch (error) {
    return { status: "error", code: "MIGRATION_OWNER_SNAPSHOT_UNAVAILABLE" };
  }
}

function buildMigrationTargetExistenceSnapshot_(schema, preparedRows, institutionId, ss, input) {
  var service = String(schema && schema.service || "").toUpperCase();
  var sheetName = String(schema && schema.sheet || "");
  var idField = schema && schema.headers && schema.headers[0] || "";
  if (service === "ACADEMIC") {
    var academicIds = (preparedRows || []).map(function(row) { return String(row && row[idField] || "").trim(); }).filter(Boolean);
    var academicResult = requestAccountingTrustedOwnerSnapshot_("ACADEMIC", {
      sessionToken: String(input && input.sessionToken || ""), institutionId: institutionId,
      entityType: "estudiante", targetIds: academicIds
    });
    if (!academicResult || academicResult.status !== "success" || academicResult.verified !== true ||
        academicResult.service !== "ACADEMIC" || academicResult.sheet !== "ExpedientesEstudiantes" ||
        academicResult.idField !== "ExpedienteID" || String(academicResult.institutionId || "") !== String(institutionId) ||
        !Array.isArray(academicResult.existingTargetIds)) {
      return { verified: false, service: service, sheet: sheetName, institutionId: institutionId, existingTargetIds: [], targetRows: [] };
    }
    return { verified: true, service: service, sheet: sheetName, institutionId: institutionId,
      idField: idField, existingTargetIds: academicResult.existingTargetIds.map(String).sort(),
      targetRows: Array.isArray(academicResult.targetRows) ? academicResult.targetRows : [] };
  }
  if (service !== "ACCOUNTING") {
    return { verified: false, service: service, sheet: sheetName, institutionId: institutionId, existingTargetIds: [], targetRows: [] };
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { verified: false, service: service, sheet: sheetName, institutionId: institutionId, existingTargetIds: [], targetRows: [] };
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(value) { return String(value || "").trim(); }) : [];
  var idIndex = headers.indexOf(idField);
  if (idIndex < 0) return { verified: false, service: service, sheet: sheetName, institutionId: institutionId, existingTargetIds: [], targetRows: [] };
  var requestedIds = {};
  (preparedRows || []).forEach(function(prepared) {
    var requestedId = String(prepared && prepared[idField] || "").trim();
    if (requestedId) requestedIds[requestedId] = true;
  });
  var ids = {};
  var targetRows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var id = String(row[idIndex] || "").trim();
    if (!id || !requestedIds[id]) continue;
    if (ids[id]) return { verified: false, service: service, sheet: sheetName,
      institutionId: institutionId, existingTargetIds: [], targetRows: [], code: "MIGRATION_SNAPSHOT_DUPLICATE_TARGET_ID" };
    ids[id] = true;
    var item = {};
    headers.forEach(function(header, column) { if (header) item[header] = row[column]; });
    targetRows.push(item);
  }
  return { verified: true, service: service, sheet: sheetName, institutionId: institutionId,
    idField: idField, existingTargetIds: Object.keys(ids).sort(), targetRows: targetRows };
}

function buildAccountingRelatedPersonExistenceSnapshot_(preparedRows, entityType, institutionId, input) {
  var type = String(entityType || "").toLowerCase();
  var field = type === "estudiante" ? "PersonaID" : (type === "empleado" ? "PersonaId" : "");
  if (!field) return { verified: true, service: "NOT_REQUIRED", sheet: "", institutionId: institutionId, idField: "", existingTargetIds: [], targetRows: [] };
  var ids = [];
  var seen = {};
  (preparedRows || []).forEach(function(row) {
    var id = String(row && row[field] || "").trim();
    if (id && !seen[id]) { seen[id] = true; ids.push(id); }
  });
  if (!ids.length) return { verified: true, service: "USER", sheet: "Personas", institutionId: institutionId, idField: "PersonaID", existingTargetIds: [], targetRows: [] };
  var result = requestAccountingTrustedOwnerSnapshot_("USER", {
    sessionToken: String(input && input.sessionToken || ""), institutionId: institutionId,
    entityType: "persona", targetIds: ids
  });
  if (!result || result.status !== "success" || result.verified !== true || result.service !== "USER" ||
      result.sheet !== "Personas" || result.idField !== "PersonaID" ||
      String(result.institutionId || "") !== String(institutionId) || !Array.isArray(result.existingTargetIds)) {
    return { verified: false, service: "USER", sheet: "Personas", institutionId: institutionId, idField: "PersonaID", existingTargetIds: [], targetRows: [] };
  }
  return { verified: true, service: "USER", sheet: "Personas", institutionId: institutionId,
    idField: "PersonaID", existingTargetIds: result.existingTargetIds.map(String).sort(), targetRows: [] };
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

function getVerifiedDepartmentScopeForSession_(payload) {
  var identity = getVerifiedAccountingIdentity_(payload || {});
  if (!identity || identity.authorized !== true) return { valid: false, code: identity && identity.code || "VERIFIED_IDENTITY_REQUIRED" };
  if (!identity.membershipId || !identity.userId || !identity.role || !identity.institutionId) {
    return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  }
  return {
    valid: true, userId: String(identity.userId), roleId: String(identity.role),
    membershipId: String(identity.membershipId), institutionId: String(identity.institutionId),
    sessionToken: String(payload.sessionToken)
  };
}

function getVerifiedAccountingDepartmentScope_(payload, ss, identityOverride) {
  var actor = getVerifiedDepartmentScopeForSession_(payload);
  if (!actor.valid || !ss) return actor.valid ? { valid: false, authorized: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" } : actor;
  if (identityOverride && (String(identityOverride.userId || "") !== actor.userId ||
      String(identityOverride.role || "") !== actor.roleId)) {
    return { valid: false, authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  }
  var sheet = ss.getSheetByName("AsignacionesAmbitosRoles");
  if (!sheet) return { valid: false, authorized: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  var values = sheet.getDataRange().getValues();
  var legacyHeaders = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"];
  var membershipHeaders = legacyHeaders.concat(["InstitutionID","MembershipID"]);
  var currentHeaders = membershipHeaders.concat(["ResponsibilityID"]);
  var actual = values.length ? values[0].map(String) : [];
  if (JSON.stringify(actual) !== JSON.stringify(currentHeaders)) {
    return { valid: false, authorized: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  }
  var counts = {};
  values.slice(1).forEach(function(row) {
    var id = String((row || [])[0] || "").trim();
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  function parseDate(value) {
    if (value === "" || value === null || value === undefined) return { valid: true, date: null };
    var date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? { valid: false, date: null } : { valid: true, date: date };
  }
  function parseValues(value) {
    if (Array.isArray(value)) return value.map(function(item) { return String(item).trim(); }).filter(Boolean);
    var raw = String(value || "").trim();
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(function(item) { return String(item).trim(); }).filter(Boolean);
      if (parsed !== null && parsed !== undefined) return [String(parsed).trim()].filter(Boolean);
    } catch (ignored) {}
    return raw.split(",").map(function(item) { return String(item).trim(); }).filter(Boolean);
  }
  var now = new Date(), scopes = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i] || [], assignmentId = String(row[0] || "").trim();
    if (!assignmentId || counts[assignmentId] !== 1 ||
        String(row[1] || "").trim() !== actor.userId ||
        String(row[2] || "").trim() !== actor.roleId ||
        String(row[12] || "").trim() !== actor.institutionId ||
        String(row[13] || "").trim() !== actor.membershipId ||
        ["ACTIVO","ACTIVA","ACTIVE"].indexOf(String(row[5] || "").trim().toUpperCase()) === -1) continue;
    var responsibilityId = String(row[14] || "").trim();
    var responsibility = resolveInternalResponsibilityForRoleScope_(ss, responsibilityId);
    if (!responsibility) continue;
    var start = parseDate(row[8]), end = parseDate(row[9]);
    if (!start.valid || !end.valid || (start.date && start.date.getTime() > now.getTime()) ||
        (end.date && end.date.getTime() < now.getTime())) continue;
    var scopeType = String(row[3] || "").trim().toUpperCase(), scopeValues = parseValues(row[4]);
    if (!scopeType || !scopeValues.length) continue;
    scopes.push({ assignmentId: assignmentId, roleId: actor.roleId, institutionId: actor.institutionId,
      membershipId: actor.membershipId, responsibilityId: responsibilityId, responsibility: responsibility,
      scopeType: scopeType, scopeValues: scopeValues });
  }
  if (!scopes.length) return { valid: false, authorized: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  var departments = [], institutionWide = false;
  scopes.forEach(function(scope) {
    if (scope.scopeType === "DEPARTAMENTO") scope.scopeValues.forEach(function(id) {
      if (departments.indexOf(id) === -1) departments.push(id);
    });
    if (scope.scopeType === "INSTITUCION" && scope.scopeValues.indexOf(actor.institutionId) !== -1) institutionWide = true;
  });
  var allDepartmentIds = departments.slice();
  var activeDepartmentId = String(payload && payload.activeDepartmentId || "").trim();
  if (activeDepartmentId) {
    if (departments.indexOf(activeDepartmentId) === -1) return { valid: false, authorized: false, code: "ACTIVE_SCOPE_NOT_ASSIGNED" };
    scopes = scopes.filter(function(scope) {
      if (scope.scopeType !== "DEPARTAMENTO") return false;
      scope.scopeValues = scope.scopeValues.filter(function(id) { return id === activeDepartmentId; });
      return scope.scopeValues.length > 0;
    });
    departments = [activeDepartmentId];
    institutionWide = false;
  }
  return { valid: true, authorized: true, userId: actor.userId, roleId: actor.roleId,
    membershipId: actor.membershipId, institutionId: actor.institutionId, scopes: scopes,
    departmentIds: departments, allDepartmentIds: allDepartmentIds,
    institutionWide: institutionWide, activeDepartmentId: activeDepartmentId || null };
}

function mapMigrationRowToTarget_(row, mapping, schema, sessionToken) {
  var source = row || {}, fields = mapping && mapping.campos || {}, output = {};
  Object.keys(fields).forEach(function(targetField) {
    var sourceField = fields[targetField];
    output[targetField] = source[sourceField] === undefined || source[sourceField] === null ? "" : source[sourceField];
  });
  var identifierField = String(mapping && mapping.identificador || "").trim();
  var legacyId = identifierField ? String(source[identifierField] || "").trim() : "";
  if (legacyId && typeof resolveCrossReferenceIdentifier === "function") {
    var resolved = resolveCrossReferenceIdentifier({
      sistemaOrigen: mapping && mapping.sistemaOrigen || "",
      tipoEntidad: mapping && mapping.tipoEntidad || "",
      idOriginalLegado: legacyId,
      sessionToken: String(sessionToken || "")
    });
    if (resolved && resolved.status === "success" && schema && schema.headers && schema.headers[0]) {
      output[schema.headers[0]] = resolved.idNuevoPlataforma;
    }
  }
  return output;
}

function accountingHasInstitutionalImportPermission_(actor) {
  if (!actor || !actor.sessionToken) return false;
  var verified = requestAccountingUserAuthorization_("authorizeAccountingImport", {
    sessionToken: String(actor.sessionToken)
  });
  return !!(verified && verified.status === "success" &&
    verified.authorized === true && verified.importPermissionVerified === true &&
    String(verified.userId || "") === String(actor.userId || "") &&
    String(verified.role || "") === String(actor.roleId || ""));
}

function accountingHasInstitutionalAuditReadPermission_(actor) {
  if (!actor || !actor.sessionToken || String(actor.role || actor.roleId || "") !== "Auditor") return false;
  var verified = requestAccountingUserAuthorization_("authorizeAccountingAuditRead", {
    sessionToken: String(actor.sessionToken), institutionId: String(actor.institutionId || "")
  });
  return !!(verified && verified.status === "success" && verified.authorized === true &&
    verified.auditReadPermissionVerified === true &&
    String(verified.userId || "") === String(actor.userId || "") &&
    String(verified.role || "") === "Auditor" &&
    String(verified.institutionId || "") === String(actor.institutionId || ""));
}

function getAccountingMigrationFileAudit(payload) {
  var input = payload || {};
  var actor = getVerifiedAccountingIdentity_({ sessionToken: input.sessionToken });
  if (!actor || actor.authorized !== true) {
    return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED",
      message: "No fue posible verificar el acceso al registro de auditoría." };
  }
  if (actor.role !== "Auditor" || !accountingHasRolePermission_(actor, "getAccountingMigrationFileAudit") ||
      (input.institutionId && String(input.institutionId) !== String(actor.institutionId)) ||
      !accountingHasInstitutionalAuditReadPermission_({
        sessionToken: input.sessionToken, userId: actor.userId, role: actor.role,
        institutionId: actor.institutionId
      })) {
    return { status: "error", code: "AUDIT_READ_PERMISSION_DENIED",
      message: "No tiene alcance institucional de solo lectura para consultar esta auditoría." };
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("AuditoriaMigracionesArchivos");
  if (!sheet) return { status: "success", institutionId: actor.institutionId, total: 0, data: [] };
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(value) { return String(value || "").trim(); }) : [];
  var expected = ["RunId","InstitutionID","NombreArchivo","HashSHA256","PreviewHash","SistemaOrigen",
    "TipoEntidad","DestinoModulo","ActorUserId","Fecha","Estado","RegistrosEscritos","CorrelationId"];
  if (JSON.stringify(headers.slice(0, expected.length)) !== JSON.stringify(expected)) {
    return { status: "error", code: "MIGRATION_FILE_HASH_AUDIT_SCHEMA_MISMATCH",
      message: "El registro de auditoría no tiene un esquema verificable." };
  }
  var entries = values.slice(1).filter(function(row) {
    return String(row[1] || "").trim() === String(actor.institutionId);
  }).map(function(row) {
    var createdAt = row[9] instanceof Date ? row[9].toISOString() : String(row[9] || "");
    return {
      runId: String(row[0] || ""), fileName: String(row[2] || ""),
      hashSHA256: String(row[3] || ""), previewHash: String(row[4] || ""),
      sourceSystem: String(row[5] || ""), entityType: String(row[6] || ""),
      destination: String(row[7] || ""), actorUserId: String(row[8] || ""),
      createdAt: createdAt, status: String(row[10] || ""),
      recordsWritten: row[11] === "" ? null : Number(row[11] || 0),
      correlationId: String(row[12] || "")
    };
  });
  entries.sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  var requestedLimit = Number(input.limit || 100);
  var limit = isFinite(requestedLimit) ? Math.max(1, Math.min(100, Math.floor(requestedLimit))) : 100;
  return { status: "success", institutionId: actor.institutionId,
    total: entries.length, limit: limit, data: entries.slice(0, limit) };
}

function resolveAccountingImportRowDepartmentSnapshot_(payload, ss, actor) {
  var batchId = String(payload && payload.importBatchId || "").trim();
  if (!batchId) return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_NOT_FOUND" };
  var sheet = ss.getSheetByName("AsignacionesImportacionDepartamental");
  if (!sheet) return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_NOT_FOUND" };
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(value) { return String(value || "").trim(); }) : [];
  var idx = {};
  headers.forEach(function(name, i) { idx[name] = i; });
  var rows = values.slice(1).filter(function(row) { return String(row[idx.ImportBatchID] || "") === batchId; });
  if (!rows.length) return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_NOT_FOUND" };
  var expectedTenant = actor.institutionId;
  if (rows.some(function(row) { return String(row[idx.InstitutionID] || "") !== expectedTenant; })) {
    return { valid: false, code: "DEPARTMENT_IMPORT_TENANT_MISMATCH" };
  }
  if (rows.some(function(row) { return String(row[idx.Domain] || "").toUpperCase() !== "ACCOUNTING"; })) {
    return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_UNVERIFIED" };
  }
  var expectedSourceRows = payload.filasData || [];
  var sourceIds = [];
  for (var i = 0; i < expectedSourceRows.length; i++) {
    var rowId = String(expectedSourceRows[i] && expectedSourceRows[i].RowID || "").trim();
    if (!rowId) return { valid: false, code: "DEPARTMENT_IMPORT_ROW_ID_REQUIRED" };
    if (sourceIds.indexOf(rowId) !== -1) return { valid: false, code: "DEPARTMENT_IMPORT_ROW_ID_DUPLICATE" };
    sourceIds.push(rowId);
  }
  var snapshotIds = rows.map(function(row) { return String(row[idx.RowID] || "").trim(); });
  if (snapshotIds.some(function(id, i) { return !id || snapshotIds.indexOf(id) !== i; })) {
    return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_INCOMPLETE" };
  }
  var snapshotId = String(rows[0][idx.SnapshotID] || "").trim();
  if (!snapshotId || rows.some(function(row) { return String(row[idx.SnapshotID] || "") !== snapshotId; })) {
    return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_INCOMPLETE" };
  }
  if (rows.length !== expectedSourceRows.length || sourceIds.some(function(id) { return snapshotIds.indexOf(id) === -1; })) {
    return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_INCOMPLETE" };
  }
  if (rows.some(function(row) { return String(row[idx.Status] || "").toUpperCase() !== "VERIFIED"; })) {
    return { valid: false, code: "DEPARTMENT_IMPORT_ROW_SNAPSHOT_UNVERIFIED" };
  }
  var assignments = [];
  var prepared = expectedSourceRows.map(function(sourceRow) {
    var rowId = String(sourceRow.RowID || "").trim();
    var snapshotRow = rows.find(function(row) { return String(row[idx.RowID] || "") === rowId; });
    var departmentId = String(snapshotRow[idx.DepartmentID] || "").trim();
    var explicit = String(sourceRow.Departamento || "").trim();
    if (!departmentId || (explicit && explicit !== departmentId)) return null;
    assignments.push({ rowId: rowId, departmentId: departmentId, institutionId: actor.institutionId, domain: "ACCOUNTING", snapshotId: snapshotId, verified: true });
    var output = Object.assign({}, sourceRow, { Departamento: departmentId });
    return output;
  });
  if (prepared.some(function(row) { return !row; })) return { valid: false, code: "DEPARTMENT_IMPORT_ROW_TARGET_MISMATCH" };
  return { valid: true, snapshotId: snapshotId, rows: prepared, assignments: assignments,
    departmentIds: Array.from(new Set(assignments.map(function(item) { return item.departmentId; }))).sort() };
}

function buildAccountingDepartmentalImportPreflight_(payload, ss, schema) {
  var input = payload || {};
  var type = String(input.tipoEntidad || "").toLowerCase();
  var departmentScoped = type === "empleado" || !!(schema && schema.departmentScoped === true);
  if (!departmentScoped) return { valid: true, applicable: false, rows: input.filasData || [] };
  var scope = getVerifiedAccountingDepartmentScope_(input, ss);
  if (!scope.valid) return { valid: false, code: scope.code };
  var hasImportPermission = accountingHasInstitutionalImportPermission_({ roleId: scope.roleId, userId: scope.userId, sessionToken: input.sessionToken });
  if (!hasImportPermission) {
    return { valid: false, code: scope.institutionWide ?
      "DEPARTMENT_IMPORT_INSTITUTION_WIDE_UNAUTHORIZED" : "DEPARTMENT_IMPORT_PERMISSION_DENIED" };
  }
  if (scope.institutionWide) {
    var snapshot = resolveAccountingImportRowDepartmentSnapshot_(input, ss, scope);
    if (!snapshot.valid) return snapshot;
    var contract = validateDepartmentalImportScope_({
      actorContext: { verified: true, userId: scope.userId, membershipId: scope.membershipId, roleId: scope.roleId,
        institutionId: scope.institutionId, institutionWide: true, institutionWideAuthorized: true },
      domain: "ACCOUNTING", targetDepartmentId: "", targetDepartmentVerified: true,
      targetInstitutionId: scope.institutionId, targetDomain: "ACCOUNTING",
      snapshotScopeVerified: true, snapshotInstitutionId: scope.institutionId, snapshotDomain: "ACCOUNTING",
      membershipsVerified: true, authorizedDepartmentIds: [],
      rows: snapshot.rows.map(function(row, i) { return { rowId: row.RowID, departmentId: row.Departamento, institutionId: scope.institutionId }; }),
      rowDepartmentSnapshotVerified: true, rowDepartmentSnapshotId: snapshot.snapshotId,
      rowDepartmentSnapshotInstitutionId: scope.institutionId, rowDepartmentSnapshotDomain: "ACCOUNTING",
      rowDepartmentAssignments: snapshot.assignments
    });
    if (!contract.valid) return { valid: false, code: contract.code };
    return { valid: true, applicable: true, institutionWide: true, rows: snapshot.rows,
      snapshotId: snapshot.snapshotId, departmentIds: snapshot.departmentIds };
  }
  var active = String(input.activeDepartmentId || "").trim();
  if (!active) return { valid: false, code: "ACTIVE_DEPARTMENT_REQUIRED" };
  if (scope.departmentIds.indexOf(active) === -1) return { valid: false, code: "ACTIVE_SCOPE_NOT_ASSIGNED" };
  var rows = (input.filasData || []).map(function(row) {
    var explicit = String(row && row.Departamento || "").trim();
    if (explicit && explicit !== active) {
      return { __departmentError: (scope.allDepartmentIds || scope.departmentIds).indexOf(explicit) !== -1 ?
        "DEPARTMENT_IMPORT_MIXED_DEPARTMENTS" : "DEPARTMENT_IMPORT_DEPARTMENT_UNKNOWN" };
    }
    return Object.assign({}, row || {}, { Departamento: active });
  });
  var failed = rows.find(function(row) { return row.__departmentError; });
  if (failed) return { valid: false, code: failed.__departmentError };
  var contract = validateDepartmentalImportScope_({
    actorContext: { verified: true, userId: scope.userId, membershipId: scope.membershipId, roleId: scope.roleId,
      institutionId: scope.institutionId, institutionWide: false, institutionWideAuthorized: false },
    domain: "ACCOUNTING", targetDepartmentId: active, targetDepartmentVerified: true,
    targetInstitutionId: scope.institutionId, targetDomain: "ACCOUNTING",
    snapshotScopeVerified: true, snapshotInstitutionId: scope.institutionId, snapshotDomain: "ACCOUNTING",
    membershipsVerified: true, authorizedDepartmentIds: scope.departmentIds,
    rows: rows.map(function(row) { return { departmentId: row.Departamento, institutionId: scope.institutionId }; })
  });
  if (!contract.valid) return { valid: false, code: contract.code };
  return { valid: true, applicable: true, departmentId: active, departmentIds: [active], rows: rows };
}

function requestAccountingIdentityMapSnapshot_(payload) {
  var input = payload || {};
  var properties = PropertiesService.getScriptProperties();
  var endpoint = String(properties.getProperty("IMA_USER_SERVICE_URL") || "").trim();
  var secret = String(properties.getProperty("IMA_MIGRATION_HMAC_SECRET") || "").trim();
  if (!isAccountingTrustedAppsScriptEndpoint_(endpoint) || secret.length < 32 ||
      typeof UrlFetchApp === "undefined" || typeof createInterServiceEnvelope !== "function") {
    return { status: "error", code: "IDENTITY_MAPPING_SNAPSHOT_UNAVAILABLE" };
  }
  var now = Date.now();
  var requestId = "REQ-" + now + "-" + Utilities.getUuid().replace(/-/g, "").slice(0, 12);
  var correlationId = String(input.correlationId || ("CORR-" + Utilities.getUuid().replace(/-/g, "")));
  var body = { sessionToken: String(input.sessionToken || ""), institutionId: String(input.institutionId || ""),
    lookups: Array.isArray(input.lookups) ? input.lookups : [] };
  var bodyToSign = [requestId, now, correlationId, "ACCOUNTING", "USER",
    "getMigrationIdentityMapSnapshot", JSON.stringify(body)].join("|");
  var envelope = {
    sourceService: "ACCOUNTING", targetService: "USER", action: "getMigrationIdentityMapSnapshot",
    requestId: requestId, timestamp: now, correlationId: correlationId, payload: body,
    hmacSignature: accountingComputeHmacSignature_(bodyToSign, secret)
  };
  try {
    var response = UrlFetchApp.fetch(endpoint, {
      method: "post", contentType: "application/json", payload: JSON.stringify(envelope), muteHttpExceptions: true
    });
    var httpStatus = response.getResponseCode(), parsed = {};
    try { parsed = JSON.parse(response.getContentText() || "{}"); } catch (ignored) {}
    if (httpStatus < 200 || httpStatus >= 300 || !parsed || parsed.status !== "success") {
      return { status: "error", code: parsed && parsed.code || "IDENTITY_MAPPING_SNAPSHOT_UNAVAILABLE" };
    }
    var data = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
    if (data.verified !== true || String(data.service || "") !== "USER" ||
        String(data.institutionId || "") !== String(input.institutionId || "") ||
        !Array.isArray(data.entries) || !Array.isArray(data.uniquenessViolations)) {
      return { status: "error", code: "IDENTITY_MAPPING_SNAPSHOT_UNVERIFIED" };
    }
    return Object.assign({}, data, { status: "success" });
  } catch (error) {
    return { status: "error", code: "IDENTITY_MAPPING_SNAPSHOT_UNAVAILABLE" };
  }
}

function buildImportPreview_(payload) {
  var input = payload || {};
  var auth = getVerifiedAccountingIdentity_(input);
  if (!auth || auth.authorized !== true) return { status: "error", code: "AUTH_PERMISSION_DENIED", validForImport: false, errores: [] };
  if (typeof accountingHasInstitutionalImportPermission_ === "function" &&
      !accountingHasInstitutionalImportPermission_({ roleId: auth.role || auth.roleId, userId: auth.userId, sessionToken: input.sessionToken })) {
    return { status: "error", code: "IMPORT_PERMISSION_DENIED", validForImport: false, errores: [] };
  }
  var institutionId = String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID") || PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") || "").trim();
  if (!institutionId) return { status: "error", code: "INSTITUTION_CONTEXT_REQUIRED", validForImport: false, errores: [] };
  var fileValidation = validateImportWorkbookBinary_(input);
  if (!fileValidation || fileValidation.valid !== true) {
    return { status: "error", code: fileValidation && fileValidation.code || "IMPORT_FILE_INVALID", validForImport: false, errores: [] };
  }
  var sourceName = String(input.sistemaOrigen || "").trim();
  var entityType = String(input.tipoEntidad || "").trim().toLowerCase();
  var schema = MIGRATION_OWNER_SCHEMAS_ && MIGRATION_OWNER_SCHEMAS_[entityType];
  if (!schema || !sourceName || !Array.isArray(input.filasData) || !input.filasData.length) {
    return { status: "error", code: "IMPORT_SCHEMA_OR_DATA_INVALID", validForImport: false, errores: [] };
  }
  if (String(input.destinoModulo || "").trim().toUpperCase() !== String(schema.service || "").trim().toUpperCase()) {
    return { status: "error", code: "MIGRATION_DESTINATION_MISMATCH", validForImport: false, errores: [] };
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var departmentPreflight = buildAccountingDepartmentalImportPreflight_(input, ss, schema);
  if (!departmentPreflight || departmentPreflight.valid !== true) {
    return { status: "error", code: departmentPreflight && departmentPreflight.code || "DEPARTMENT_IMPORT_SCOPE_DENIED", validForImport: false, errores: [] };
  }
  var mapping = input.columnaMapeo || {};
  var fields = mapping.campos || {};
  var legacyIdColumn = String(mapping.identificador || "").trim();
  var legacyIds = input.filasData.map(function(row) {
    return String(row && legacyIdColumn ? row[legacyIdColumn] || "" : "").trim();
  }).filter(Boolean);
  var identityLookups = [];
  if (legacyIds.length) identityLookups.push({ sourceName: sourceName, entityType: entityType, legacyIds: legacyIds });
  var relatedPersonField = entityType === "estudiante" ? "PersonaID" : (entityType === "empleado" ? "PersonaId" : "");
  var relatedPersonSourceField = relatedPersonField ? String(fields[relatedPersonField] || "") : "";
  if (relatedPersonSourceField) {
    var relatedPersonIds = input.filasData.map(function(row) {
      return String(row && row[relatedPersonSourceField] || "").trim();
    }).filter(Boolean);
    if (relatedPersonIds.length) identityLookups.push({ sourceName: sourceName, entityType: "persona", legacyIds: relatedPersonIds });
  }
  var identitySnapshot = identityLookups.length ? requestAccountingIdentityMapSnapshot_({
    sessionToken: input.sessionToken, institutionId: institutionId, correlationId: input.correlationId,
    lookups: identityLookups
  }) : { status: "success", verified: true, service: "USER", institutionId: institutionId,
    entries: [], uniquenessViolations: [] };
  if (!identitySnapshot || identitySnapshot.status !== "success" || identitySnapshot.verified !== true) {
    return { status: "error", code: identitySnapshot && identitySnapshot.code || "IDENTITY_MAPPING_SNAPSHOT_UNAVAILABLE",
      validForImport: false, errores: [] };
  }
  var structural = input.analisisEstructural || {};
  var errors = [];
  var warnings = [];
  var structuralBlockers = [];
  function addError(code, message, rowNumber) {
    var item = { codigo: code, mensaje: message };
    if (rowNumber !== undefined && rowNumber !== null) item.fila = rowNumber;
    errors.push(item);
    if (["DUPLICATE_HEADERS", "UNRESOLVED_FORMULAS", "REPEATED_HEADER_ROWS", "VISIBLE_SHEET_SELECTION_REQUIRED", "TARGET_EXISTENCE_UNVERIFIED", "RELATED_REFERENCE_EXISTENCE_UNVERIFIED"].indexOf(code) !== -1) structuralBlockers.push(item);
  }
  function addWarning(code, message) { warnings.push({ severity: "WARNING", codigo: code, mensaje: message }); }
  if (identitySnapshot.uniquenessViolations.length) {
    identitySnapshot.uniquenessViolations.forEach(function(item) {
      addError("IDENTITY_UNIQUENESS_VIOLATION", "Hay más de una correspondencia confirmada para el mismo identificador legado.");
    });
  }
  if (Array.isArray(structural.duplicateHeaders) && structural.duplicateHeaders.length) addError("DUPLICATE_HEADERS", "El archivo contiene encabezados duplicados.");
  if (Array.isArray(structural.unresolvedFormulas) && structural.unresolvedFormulas.length) addError("UNRESOLVED_FORMULAS", "El archivo contiene fórmulas sin valores calculados.");
  if (Array.isArray(structural.repeatedHeaderRows) && structural.repeatedHeaderRows.length) addError("REPEATED_HEADER_ROWS", "El archivo contiene filas de encabezado repetidas dentro de los datos.");
  var selectedSheet = String(input.hojaSeleccionada || structural.selectedSheet || "").trim();
  if (Number(structural.visibleSheetCount || 0) > 1 && !selectedSheet) addError("VISIBLE_SHEET_SELECTION_REQUIRED", "Debe seleccionar una hoja visible antes de importar.");
  if (Array.isArray(structural.hiddenSheets) && structural.hiddenSheets.length) addWarning("HIDDEN_SHEETS_PRESENT", "El libro contiene hojas ocultas; revise su contenido antes de continuar.");
  if (Array.isArray(structural.mergedCells) && structural.mergedCells.length) addWarning("MERGED_CELLS_PRESENT", "Se detectaron celdas combinadas; verifique la alineación de los datos.");
  if (Number(structural.headerRowIndex || 0) > 0) addWarning("HEADER_ROW_SHIFTED", "La fila de encabezados no es la primera del archivo.");
  if (Array.isArray(structural.blankRows) && structural.blankRows.length) addWarning("BLANK_ROWS_PRESENT", "Se detectaron filas vacías que se omitirán.");
  if (Array.isArray(structural.typeInconsistencies) && structural.typeInconsistencies.length) addWarning("COLUMN_TYPE_INCONSISTENCY", "Hay columnas con tipos de datos inconsistentes.");
  if (Array.isArray(structural.hiddenSheets) && structural.hiddenSheets.indexOf(selectedSheet) !== -1) addWarning("HIDDEN_SHEET_SELECTED", "La hoja elegida está marcada como oculta.");

  var targetIdField = schema.headers && schema.headers[0] || "";
  var validIndexes = [];
  var preparedRows = [];
  var identityResolutions = [];
  var seenLegacyIds = {};
  var rowErrors = [];
  input.filasData.forEach(function(sourceRow, rowIndex) {
    var source = sourceRow || {};
    var legacyId = legacyIdColumn ? String(source[legacyIdColumn] || "").trim() : "";
    var originalRowNumber = Array.isArray(structural.dataRowNumbers) && structural.dataRowNumbers[rowIndex] ?
      Number(structural.dataRowNumbers[rowIndex]) : rowIndex + 2;
    var localErrors = [];
    if (!legacyId) localErrors.push({ codigo: "IDENTIFIER_MISSING", error: "IDENTIFIER_MISSING", fila: originalRowNumber });
    if (legacyId && seenLegacyIds[legacyId]) localErrors.push({ codigo: "DUPLICATE_IDENTIFIER_IN_FILE", error: "DUPLICATE_IDENTIFIER_IN_FILE", fila: originalRowNumber });
    if (legacyId) seenLegacyIds[legacyId] = true;
    var identity = legacyId ? resolveAccountingIdentityFromSnapshot_(identitySnapshot, sourceName, entityType, legacyId, institutionId) : { valid: false };
    if (legacyId && !identity.valid) {
      var identityCode = identity.code || "IDENTITY_MAPPING_NOT_FOUND";
      localErrors.push({ codigo: identityCode, error: identityCode, fila: originalRowNumber });
    }
    var prepared = {};
    Object.keys(fields).forEach(function(targetField) {
      var sourceField = fields[targetField];
      prepared[targetField] = source[sourceField] === undefined || source[sourceField] === null ? "" : source[sourceField];
    });
    if (departmentPreflight.applicable && departmentPreflight.rows && departmentPreflight.rows[rowIndex]) {
      prepared = Object.assign(prepared, departmentPreflight.rows[rowIndex]);
    }
    if (identity.valid && targetIdField) prepared[targetIdField] = identity.idNuevoPlataforma;
    if (entityType === "estudiante") {
      var personLegacyId = String(prepared.PersonaID || "").trim();
      if (!personLegacyId) {
        localErrors.push({ codigo: "RELATED_REFERENCE_MISSING", error: "RELATED_REFERENCE_MISSING", fila: originalRowNumber });
      } else {
        var person = resolveAccountingIdentityFromSnapshot_(identitySnapshot, sourceName, "persona", personLegacyId, institutionId);
        if (!person.valid) {
          var personCode = person.code === "IDENTITY_MAPPING_NOT_FOUND" ? "ORPHANED_REFERENCE" : (person.code || "IDENTITY_MAPPING_NOT_CONFIRMED");
          localErrors.push({ codigo: personCode, error: personCode, fila: originalRowNumber });
        } else prepared.PersonaID = person.idNuevoPlataforma;
      }
    }
    if (entityType === "empleado") {
      var employeePersonLegacyId = String(prepared.PersonaId || "").trim();
      if (!employeePersonLegacyId) {
        localErrors.push({ codigo: "RELATED_REFERENCE_MISSING", error: "RELATED_REFERENCE_MISSING", fila: originalRowNumber });
      } else {
        var employeePerson = resolveAccountingIdentityFromSnapshot_(identitySnapshot, sourceName, "persona", employeePersonLegacyId, institutionId);
        if (!employeePerson.valid) {
          var employeePersonCode = employeePerson.code === "IDENTITY_MAPPING_NOT_FOUND" ? "ORPHANED_REFERENCE" : (employeePerson.code || "IDENTITY_MAPPING_NOT_CONFIRMED");
          localErrors.push({ codigo: employeePersonCode, error: employeePersonCode, fila: originalRowNumber });
        } else prepared.PersonaId = employeePerson.idNuevoPlataforma;
      }
    }
    Object.keys(prepared).forEach(function(field) {
      var value = prepared[field];
      if (value === "" || value === null || value === undefined) return;
      if (/^(nota|calificacion|puntaje)$/i.test(field) || /(nota|calificacion|puntaje)$/i.test(field)) {
        var score = Number(value);
        if (!isFinite(score) || score < 0 || score > 100) localErrors.push({ codigo: "GRADE_OUT_OF_RANGE", error: "GRADE_OUT_OF_RANGE", fila: originalRowNumber });
      }
      if (/^fecha|fecha$/i.test(field) || /fecha/i.test(field)) {
        var parsedDate = value instanceof Date ? value : new Date(value);
        if (isNaN(parsedDate.getTime())) localErrors.push({ codigo: "INVALID_DATE_VALUE", error: "INVALID_DATE_VALUE", fila: originalRowNumber });
      }
    });
    if (localErrors.length) rowErrors = rowErrors.concat(localErrors);
    else {
      validIndexes.push(rowIndex);
      preparedRows.push(prepared);
      identityResolutions.push({ idOriginalLegado: legacyId, idNuevoPlataforma: identity.idNuevoPlataforma });
    }
  });
  errors = errors.concat(rowErrors);
  var relatedReferenceSnapshot = buildAccountingRelatedPersonExistenceSnapshot_(preparedRows, entityType, institutionId, input);
  if (relatedReferenceSnapshot.verified !== true) {
    addError("RELATED_REFERENCE_EXISTENCE_UNVERIFIED", "No se pudo verificar la existencia de las personas relacionadas en USER; la incorporación queda bloqueada.");
  } else if (relatedReferenceSnapshot.service === "USER") {
    var existingPeople = {};
    (relatedReferenceSnapshot.existingTargetIds || []).forEach(function(id) { existingPeople[String(id)] = true; });
    var rowsWithVerifiedReferences = [];
    var indexesWithVerifiedReferences = [];
    var identitiesWithVerifiedReferences = [];
    preparedRows.forEach(function(row, index) {
      var relatedId = String(row && (entityType === "estudiante" ? row.PersonaID : row.PersonaId) || "").trim();
      if (!relatedId || !existingPeople[relatedId]) {
        var sourceIndex = validIndexes[index];
        var rowNumber = Array.isArray(structural.dataRowNumbers) && structural.dataRowNumbers[sourceIndex] ?
          Number(structural.dataRowNumbers[sourceIndex]) : sourceIndex + 2;
        addError("ORPHANED_REFERENCE", "La persona relacionada no existe en el servicio USER.", rowNumber);
        return;
      }
      rowsWithVerifiedReferences.push(row);
      indexesWithVerifiedReferences.push(validIndexes[index]);
      if (identityResolutions[index]) identitiesWithVerifiedReferences.push(identityResolutions[index]);
    });
    preparedRows = rowsWithVerifiedReferences;
    validIndexes = indexesWithVerifiedReferences;
    identityResolutions = identitiesWithVerifiedReferences;
  }
  var targetSnapshot = buildMigrationTargetExistenceSnapshot_(schema, preparedRows, institutionId, ss, input);
  if (targetSnapshot.verified !== true) addError("TARGET_EXISTENCE_UNVERIFIED", "No se pudo verificar el identificador de destino en el servicio propietario; la incorporación queda bloqueada.");
  var existing = targetSnapshot.existingTargetIds || [];
  var overwrites = preparedRows.filter(function(row) { return existing.indexOf(String(row[targetIdField] || "")) !== -1; });
  overwrites.forEach(function() { addWarning("TARGET_RECORD_OVERWRITE", "El identificador de destino ya existe; se requiere revisar la sobrescritura."); });
  var validForImport = errors.length === 0 && validIndexes.length === input.filasData.length && preparedRows.length > 0;
  var validForPartialImport = !structuralBlockers.length && validIndexes.length > 0 && errors.length > 0;
  var targetSnapshotForHash = {
    verified: targetSnapshot.verified,
    service: targetSnapshot.service,
    sheet: targetSnapshot.sheet,
    existingTargetIds: targetSnapshot.existingTargetIds,
    targetRows: targetSnapshot.targetRows
  };
  var hashInput = {
    institutionId: institutionId,
    userId: auth.userId || "",
    sourceName: sourceName,
    entityType: entityType,
    destination: input.destinoModulo || "",
    mapping: mapping,
    rows: input.filasData,
    preparedRows: preparedRows,
    errors: errors,
    warnings: warnings,
    target: targetSnapshotForHash,
    relatedReferenceSnapshot: relatedReferenceSnapshot,
    fileHash: fileValidation.fileHash,
    structure: structural
  };
  var previewHash = migrationHash_(migrationStableJson_(hashInput));
  return {
    status: "success",
    validForImport: validForImport,
    validForPartialImport: validForPartialImport,
    filasValidas: validIndexes.length,
    totalFilas: input.filasData.length,
    validRowIndexes: validIndexes,
    preparedRows: preparedRows,
    identityResolutions: identityResolutions,
    targetExistenceSnapshot: targetSnapshot,
    relatedReferenceSnapshot: relatedReferenceSnapshot,
    previewHash: previewHash,
    fileHash: fileValidation.fileHash,
    fileSizeBytes: fileValidation.sizeBytes,
    errores: errors,
    advertencias: warnings,
    resumenValidation: {
      erroresBloqueantes: errors.length,
      advertencias: warnings.length,
      sobrescriturasDetectadas: overwrites.length,
      existenciaDestinoVerificada: targetSnapshot.verified,
      referenciasRelacionadasVerificadas: relatedReferenceSnapshot.verified,
      requiereConfirmacion: errors.length > 0 || warnings.length > 0 || overwrites.length > 0
    },
    analisisEstructural: structural,
    departmentPreflight: departmentPreflight,
    departamentoDestino: departmentPreflight.departmentId || null,
    departamentosDestino: departmentPreflight.departmentIds || [],
    snapshotId: departmentPreflight.snapshotId || null
  };
}

function appendAccountingMigrationFileHashAudit_(ss, input, preview, actor, status, recordsWritten) {
  var fileHash = String(preview && preview.fileHash || "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(fileHash)) throw new Error("MIGRATION_FILE_HASH_REQUIRED");
  var headers = ["RunId","InstitutionID","NombreArchivo","HashSHA256","PreviewHash","SistemaOrigen",
    "TipoEntidad","DestinoModulo","ActorUserId","Fecha","Estado","RegistrosEscritos","CorrelationId"];
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getOrCreateSheet(ss, "AuditoriaMigracionesArchivos");
    var rows = sheet.getDataRange().getValues();
    var lastRow = typeof sheet.getLastRow === "function" ? sheet.getLastRow() : rows.length;
    if (!lastRow) {
      sheet.appendRow(headers);
    } else if (lastRow === 1 && (!rows[0] || !rows[0].some(function(value) { return String(value || "").trim(); }))) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else if (!rows[0] || JSON.stringify(rows[0].map(String).slice(0, headers.length)) !== JSON.stringify(headers)) {
      throw new Error("MIGRATION_FILE_HASH_AUDIT_SCHEMA_MISMATCH");
    }
    sheet.appendRow([
      String(preview.runId || ""), String(actor && actor.institutionId || ""),
      String(input && input.nombreArchivo || ""), fileHash, String(preview.previewHash || ""),
      String(input && input.sistemaOrigen || ""), String(input && input.tipoEntidad || ""),
      String(input && input.destinoModulo || ""), String(actor && actor.userId || ""),
      new Date(), String(status || ""), recordsWritten === null ? "" : Number(recordsWritten || 0),
      String(input && input.correlationId || "")
    ]);
  } finally {
    lock.releaseLock();
  }
}

function validateImportPreview(payload) {
  var preview = buildImportPreview_(payload);
  if (!preview || preview.status !== "success" || !preview.targetExistenceSnapshot) return preview;
  delete preview.fileHash;
  delete preview.fileSizeBytes;
  var snapshot = preview.targetExistenceSnapshot;
  var idField = String(snapshot.idField || "");
  var requested = {};
  (preview.preparedRows || []).forEach(function(row) {
    var id = String(row && row[idField] || "").trim();
    if (id) requested[id] = true;
  });
  preview.targetExistenceSnapshot = {
    verified: snapshot.verified === true,
    service: String(snapshot.service || ""),
    sheet: String(snapshot.sheet || ""),
    institutionId: String(snapshot.institutionId || ""),
    idField: idField,
    existingTargetIds: (snapshot.existingTargetIds || []).map(String).filter(function(id) { return !!requested[id]; }).sort(),
    targetRows: []
  };
  return preview;
}

const ACCOUNTING_IDENTITY_MAPPING_HEADERS_=["idMapeo", "sistemaOrigen", "tipoEntidad", "idOriginalLegado", "idNuevoPlataforma", "institucionId", "hashRegistroOrigen", "fechaMigracion", "versionMapeo", "estadoCorrespondencia", "metodoCoincidencia", "nivelConfianza", "migradoPor"];

function importDataWithColumnMapping(payload) {
  var input = payload || {};
  var preview = buildImportPreview_(input);
  if (!preview || preview.status !== "success") {
    throw new Error(String(preview && preview.code || "IMPORT_PREVIEW_INVALID_OR_STALE"));
  }
  if (input.previewConfirmed !== true || !input.previewHash ||
      String(input.previewHash) !== String(preview.previewHash)) {
    throw new Error("IMPORT_PREVIEW_INVALID_OR_STALE");
  }
  if (!/^[a-f0-9]{64}$/i.test(String(preview.fileHash || ""))) throw new Error("MIGRATION_FILE_HASH_REQUIRED");
  var partial = !preview.validForImport;
  if (partial && (!preview.validForPartialImport || input.allowPartialImport !== true)) {
    throw new Error("IMPORT_PREVIEW_INVALID_OR_STALE");
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) throw new Error("AUTH_PERMISSION_DENIED");
  var runId = Utilities.getUuid();
  preview.runId = runId;
  var applied = [];
  var errors = [];
  var warnings = (preview.advertencias || []).slice();
  var validIndexes = Array.isArray(preview.validRowIndexes) ? preview.validRowIndexes.slice() :
    (preview.preparedRows || []).map(function(row, index) { return index; });
  var rowsToWrite = validIndexes;
  var departmentPreflight = preview.departmentPreflight || null;
  try {
    rowsToWrite.forEach(function(index) {
      var rowPosition = Array.isArray(preview.validRowIndexes) ? preview.validRowIndexes.indexOf(index) : index;
      var row = preview.preparedRows[rowPosition];
      if (!row) throw new Error("MIGRATION_PREPARED_ROW_MISSING");
      var schema = MIGRATION_OWNER_SCHEMAS_[input.tipoEntidad];
      var service = String(schema.service || "").toUpperCase();
      var original = input.filasData[index] || {};
      var legacyId = String(original[(input.columnaMapeo || {}).identificador] || "").trim();
      var idempotencyKey = migrationHash_(migrationStableJson_({
        previewHash: preview.previewHash, entityType: input.tipoEntidad, legacyId: legacyId, entity: row
      }));
      var ownerData = {};
      (schema.headers || []).slice(1).forEach(function(field) {
        if (Object.prototype.hasOwnProperty.call(row, field)) ownerData[field] = row[field];
      });
      var targetSnapshot = preview.targetExistenceSnapshot || {};
      var targetSnapshotVerified = (service === "ACCOUNTING" || service === "ACADEMIC") && targetSnapshot.verified === true;
      var expectedTargetPresent = false;
      var expectedTargetRowHash = "";
      if (targetSnapshotVerified) {
        var targetIdField = String(targetSnapshot.idField || (schema.headers || [])[0] || "");
        var existingTargetRow = (targetSnapshot.targetRows || []).find(function(targetRow) {
          return String(targetRow && targetRow[targetIdField] || "").trim() === String(row[(schema.headers || [])[0]] || "").trim();
        });
        expectedTargetPresent = !!existingTargetRow;
        if (existingTargetRow) expectedTargetRowHash = String(existingTargetRow.__rowHash || migrationHash_(migrationStableJson_(existingTargetRow)));
      }
      var result = sendMigrationOwnerRequest_(service, "writeMigratedEntity", {
        sessionToken: input.sessionToken,
        institutionId: PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") ||
          PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID"),
        tipoEntidad: input.tipoEntidad,
        idNuevoPlataforma: String(row[(schema.headers || [])[0]] || "").trim(),
        targetSnapshotVerified: targetSnapshotVerified,
        expectedTargetPresent: expectedTargetPresent,
        expectedTargetRowHash: expectedTargetRowHash,
        entity: row,
        datos: ownerData,
        source: { fileName: input.nombreArchivo || "", sourceSystem: input.sistemaOrigen || "", legacyId: legacyId },
        idempotencyKey: idempotencyKey
      });
      if (!result || result.status !== "success") throw new Error("MIGRATION_OWNER_WRITE_FAILED");
      var employeeId = preview.identityResolutions && preview.identityResolutions[index] ?
        preview.identityResolutions[index].idNuevoPlataforma : row[(schema.headers || [])[0]];
      if (!(result.idempotent === true)) {
        applied.push({ tipoEntidad: input.tipoEntidad, service: service, idempotencyKey: idempotencyKey, payload: row });
      }
      if (departmentPreflight && departmentPreflight.applicable === true) {
        var departmentId = String(row.Departamento || departmentPreflight.departmentId || "").trim();
        var ownershipPayload = {
          sessionToken: input.sessionToken,
          institutionId: actor.institutionId,
          resourceType: "EXPEDIENTE_LABORAL",
          resourceId: String(employeeId || "").trim(),
          departmentId: departmentId,
          rowDepartmentSnapshotId: departmentPreflight.snapshotId || "",
          rowDepartmentSnapshotRowId: original.RowID || "",
          idempotencyKey: migrationHash_(migrationStableJson_({
            previewHash: preview.previewHash, resourceId: employeeId, departmentId: departmentId,
            snapshotId: departmentPreflight.snapshotId || "", rowId: original.RowID || ""
          }))
        };
        if (!ownershipPayload.resourceId || !ownershipPayload.departmentId) throw new Error("RESOURCE_OWNERSHIP_CONTEXT_INVALID");
        var ownershipIntent = { tipoEntidad: "empleadoOwnership", service: "USER", idempotencyKey: ownershipPayload.idempotencyKey, payload: ownershipPayload };
        applied.push(ownershipIntent);
        var ownershipResult;
        try {
          ownershipResult = sendMigrationOwnerRequest_("USER", "registerMigratedResourceOwnership", ownershipPayload);
        } catch (ownershipError) {
          throw new Error("RESOURCE_OWNERSHIP_REPAIR_REQUIRED");
        }
        if (!ownershipResult || ownershipResult.status !== "success") throw new Error("RESOURCE_OWNERSHIP_REPAIR_REQUIRED");
        ownershipIntent.ownershipId = ownershipResult.ownershipId || "";
      }
    });
    try {
      appendAccountingMigrationFileHashAudit_(ss, input, preview, actor, partial ? "partial" : "completed", rowsToWrite.length);
    } catch (hashAuditError) {
      warnings.push({ code: "MIGRATION_FILE_HASH_AUDIT_SECONDARY_FAILED" });
    }
    var audit = getOrCreateSheet(ss, "AuditoriaMigraciones");
    audit.appendRow([
      runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
      String(input.tipoEntidad || ""), String(input.destinoModulo || ""), rowsToWrite.length,
      new Date(), JSON.stringify(warnings), partial ? "partial" : "completed",
      JSON.stringify(errors), preview.previewHash, actor.userId || "", preview.fileHash
    ]);
    return {
      status: "success",
      estado: partial ? "partial" : "completed",
      registrosEscritos: rowsToWrite.length,
      filasOmitidasPorValidacion: Math.max(0, input.filasData.length - rowsToWrite.length),
      errores: (preview.errores || []).map(function(item) {
        return { error: item.error || item.codigo, fila: item.fila, mensaje: item.mensaje || item.codigo };
      }),
      advertencias: warnings,
      runId: runId
    };
  } catch (error) {
    var idempotentOwnershipFailure = String(error && error.message || error) === "RESOURCE_OWNERSHIP_REPAIR_REQUIRED" &&
      applied.some(function(item) { return item.tipoEntidad === "empleadoOwnership"; }) &&
      !applied.some(function(item) { return item.tipoEntidad === input.tipoEntidad; });
    var rollbackFailures = applied.length ? rollbackMigrationOwnerWrites_(applied) : [];
    if (rollbackFailures && rollbackFailures.length) {
      errors.push({ severity: "ERROR", codigo: "MIGRATION_COMPENSATION_REQUIRED",
        operacionesPendientesCompensacion: rollbackFailures.length });
      var compensationAudit = getOrCreateSheet(ss, "AuditoriaMigraciones");
      try { appendAccountingMigrationFileHashAudit_(ss, input, preview, actor, "compensation_required", null); } catch (hashAuditError) {}
      compensationAudit.appendRow([runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
        String(input.tipoEntidad || ""), String(input.destinoModulo || ""), applied.length, new Date(),
        JSON.stringify(warnings), "compensation_required", JSON.stringify(rollbackFailures), preview.previewHash, actor.userId || "", preview.fileHash]);
      return { status: "error", code: "MIGRATION_COMPENSATION_REQUIRED", estado: "compensation_required",
        registrosEscritos: null, operacionesPendientesCompensacion: rollbackFailures.length,
        errores: errors, runId: runId };
    }
    if (idempotentOwnershipFailure) {
      errors.push({ severity: "ERROR", codigo: "RESOURCE_OWNERSHIP_REPAIR_REQUIRED", error: "RESOURCE_OWNERSHIP_REPAIR_REQUIRED" });
      var repairAudit = getOrCreateSheet(ss, "AuditoriaMigraciones");
      try { appendAccountingMigrationFileHashAudit_(ss, input, preview, actor, "compensation_required", 0); } catch (hashAuditError) {}
      repairAudit.appendRow([runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
        String(input.tipoEntidad || ""), String(input.destinoModulo || ""), 0, new Date(),
        JSON.stringify(warnings), "compensation_required", JSON.stringify(errors), preview.previewHash, actor.userId || "", preview.fileHash]);
      return { status: "error", code: "MIGRATION_COMPENSATION_REQUIRED", estado: "compensation_required",
        registrosEscritos: 0, errores: errors, runId: runId };
    }
    errors.push({ severity: "ERROR", codigo: "MIGRATION_BATCH_ROLLED_BACK", error: "MIGRATION_BATCH_ROLLED_BACK",
      message: String(error && error.message || error) });
    var auditRollback = getOrCreateSheet(ss, "AuditoriaMigraciones");
    try { appendAccountingMigrationFileHashAudit_(ss, input, preview, actor, "rolled_back", 0); } catch (hashAuditError) {}
    auditRollback.appendRow([runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
      String(input.tipoEntidad || ""), String(input.destinoModulo || ""), 0, new Date(),
      JSON.stringify(warnings), "rolled_back", JSON.stringify(errors), preview.previewHash, actor.userId || "", preview.fileHash]);
    return { status: "error", code: "MIGRATION_BATCH_ROLLED_BACK", estado: "rolled_back",
      registrosEscritos: 0, errores: errors, runId: runId };
  }
}

function authorizeAccountingDepartmentReferenceReadViaUser_(payload, resourceId, requestedFields, requestedDocumentIds) {
  var input = payload || {};
  var endpoint = String(PropertiesService.getScriptProperties().getProperty("IMA_USER_SERVICE_URL") || "").trim();
  var secret = String(PropertiesService.getScriptProperties().getProperty("IMA_DEPARTMENT_REFERENCE_HMAC_SECRET") || "");
  var allowedFields = ["categoriaDoc", "fechaCarga", "estadoVisibilidad"];
  var fields = Array.isArray(requestedFields) ? requestedFields.slice() : [];
  var documents = Array.isArray(requestedDocumentIds) ? requestedDocumentIds.slice() : [];
  if (!isAccountingTrustedAppsScriptEndpoint_(endpoint) || secret.length < 32 ||
      !fields.length || !documents.length ||
      fields.some(function(field, index) { return allowedFields.indexOf(field) === -1 || fields.indexOf(field) !== index; }) ||
      documents.some(function(id, index) { return !String(id || "").trim() || documents.indexOf(id) !== index; })) {
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  var requestId = Utilities.getUuid();
  var correlationId = Utilities.getUuid();
  var timestamp = Date.now();
  var referencePayload = {
    resourceType: "EXPEDIENTE_LABORAL",
    resourceId: String(resourceId || "").trim(),
    sessionToken: String(input.sessionToken || ""),
    requestedFields: fields,
    requestedDocumentIds: documents
  };
  if (Object.prototype.hasOwnProperty.call(input, "activeDepartmentId") && input.activeDepartmentId !== undefined) {
    referencePayload.activeDepartmentId = input.activeDepartmentId;
  }
  if (!referencePayload.resourceId || !referencePayload.sessionToken) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var envelope = {
    requestId: requestId,
    timestamp: timestamp,
    correlationId: correlationId,
    sourceService: "ACCOUNTING",
    targetService: "USER",
    action: "authorizeDepartmentReferenceRead",
    payload: referencePayload
  };
  var signedBody = envelope.requestId + "|" + envelope.timestamp + "|" + envelope.correlationId + "|" +
    envelope.sourceService + "|" + envelope.targetService + "|" + envelope.action + "|" + JSON.stringify(envelope.payload);
  var signature = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, signedBody, secret);
  envelope.hmacSignature = signature.map(function(byte) {
    return ("0" + ((Number(byte) + 256) % 256).toString(16)).slice(-2);
  }).join("");
  try {
    var response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(envelope),
      muteHttpExceptions: true
    });
    if (!response || response.getResponseCode() !== 200) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var body = JSON.parse(response.getContentText() || "{}");
    var approvedFields = body.approvedFields;
    var approvedDocuments = body.approvedDocumentIds;
    if (body.status !== "success" || body.authorized !== true || body.requiresStandardAuthorization !== true ||
        !Array.isArray(approvedFields) || !Array.isArray(approvedDocuments) ||
        fields.some(function(field) { return approvedFields.indexOf(field) === -1; }) ||
        approvedFields.length !== fields.length ||
        documents.some(function(id) { return approvedDocuments.indexOf(id) === -1; }) ||
        approvedDocuments.length !== documents.length ||
        !String(body.grantId || "").trim() || !String(body.auditEventId || "").trim()) {
      return { status: "error", code: "RESOURCE_NOT_FOUND" };
    }
    return { status: "success", authorized: true, approvedFields: approvedFields,
      approvedDocumentIds: approvedDocuments, grantId: body.grantId, auditEventId: body.auditEventId };
  } catch (error) {
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
}

function assertEmployeeExpedienteScopeAccess_(payload, ss, expedienteId) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!sheet) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var expedienteIndex = headers.indexOf("ExpedienteID"), userIndex = headers.indexOf("UserId");
  if (expedienteIndex < 0 || userIndex < 0) return { authorized: false, code: "RESOURCE_SCHEMA_INVALID" };
  var targetId = String(expedienteId || "").trim();
  if (!targetId) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var matches = values.slice(1).filter(function(row) { return String(row[expedienteIndex] || "").trim() === targetId; });
  if (matches.length === 0) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  if (matches.length !== 1) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var target = matches[0], role = String(actor.role || "").trim().toLowerCase();
  if (role === "empleado") {
    return String(target[userIndex] || "").trim() === String(actor.userId || "").trim()
      ? { authorized: true, accessType: "SELF" }
      : { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  }
  var scope = getVerifiedAccountingDepartmentScope_(input, ss, actor);
  if (!scope || scope.valid !== true) {
    return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  }
  return assertResourceOwnershipForScope_(ss, scope, "EXPEDIENTE_LABORAL", targetId, "READ");
}


function enforcePrivateEmployeeDocumentFile_(fileUrl) {
  var url = String(fileUrl || "").trim();
  var match = url.match(/\/d\/([A-Za-z0-9_-]{10,})/i) || url.match(/[?&]id=([A-Za-z0-9_-]{10,})/i);
  if (!match || typeof DriveApp === "undefined" || !DriveApp.Access || !DriveApp.Permission) return false;
  try {
    var file = DriveApp.getFileById(match[1]);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    return file.getSharingAccess() === DriveApp.Access.PRIVATE;
  } catch (error) {
    return false;
  }
}

function getEmployeeDocuments(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var documentSheet = ss.getSheetByName("DocumentosLaborales"), employeeSheet = ss.getSheetByName("ExpedientesLaborales");
  if (!documentSheet || !employeeSheet) return { status: "success", documentos: [] };
  var employeeValues = employeeSheet.getDataRange().getValues(), documentValues = documentSheet.getDataRange().getValues();
  if (!employeeValues.length || !documentValues.length) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var employeeHeaders = employeeValues[0].map(function(value) { return String(value || "").trim(); });
  var documentHeaders = documentValues[0].map(function(value) { return String(value || "").trim(); });
  var employeeIndex = {}, documentIndex = {};
  employeeHeaders.forEach(function(name, index) { employeeIndex[name] = index; });
  documentHeaders.forEach(function(name, index) { documentIndex[name] = index; });
  var requiredEmployee = ["ExpedienteID", "UserId"], requiredDocument = ["DocumentoID", "ExpedienteID", "CategoriaDoc", "TituloDocumento", "ArchivoUrl", "FechaCarga", "CargadoPor", "EstadoVisibilidad", "Observaciones"];
  if (requiredEmployee.some(function(name) { return employeeIndex[name] === undefined; }) ||
      requiredDocument.some(function(name) { return documentIndex[name] === undefined; })) return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
  var role = String(actor.role || "").trim().toLowerCase(), requestedId = String(input.expedienteId || "").trim();
  var employeeRows = employeeValues.slice(1), allowedIds = [], referenceAccess = null;
  if (requestedId) {
    var matches = employeeRows.filter(function(row) { return String(row[employeeIndex.ExpedienteID] || "").trim() === requestedId; });
    if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var access = assertEmployeeExpedienteScopeAccess_(input, ss, requestedId);
    if (access && access.authorized === true) allowedIds = [requestedId];
    else {
      if (!access || access.code !== "RESOURCE_SCOPE_DENIED" || role === "empleado") return { status: "error", code: "RESOURCE_NOT_FOUND" };
      var allDocsForTarget = documentValues.slice(1).filter(function(row) {
        return String(row[documentIndex.ExpedienteID] || "").trim() === requestedId;
      });
      var allIds = {}, allIdCounts = {};
      allDocsForTarget.forEach(function(row) {
        var id = String(row[documentIndex.DocumentoID] || "").trim();
        if (id) { allIds[id] = true; allIdCounts[id] = (allIdCounts[id] || 0) + 1; }
      });
      var requestedFields = input.referenceRequestedFields, requestedDocumentIds = input.referenceDocumentIds;
      if (!Array.isArray(requestedFields) || !requestedFields.length || !Array.isArray(requestedDocumentIds) ||
          !requestedDocumentIds.length || requestedDocumentIds.some(function(id) {
            var key = String(id || ""); return !allIds[key] || allIdCounts[key] !== 1;
          })) {
        return { status: "error", code: "RESOURCE_NOT_FOUND" };
      }
      referenceAccess = authorizeAccountingDepartmentReferenceReadViaUser_(input, requestedId, requestedFields, requestedDocumentIds);
      if (!referenceAccess || referenceAccess.status !== "success") return { status: "error", code: "RESOURCE_NOT_FOUND" };
      var referenceDocuments = [];
      requestedDocumentIds.forEach(function(requestedDocumentId) {
        var row = allDocsForTarget.find(function(item) { return String(item[documentIndex.DocumentoID] || "") === String(requestedDocumentId); });
        if (!row) return;
        var document = { documentoId: row[documentIndex.DocumentoID] };
        referenceAccess.approvedFields.forEach(function(field) {
          var map = { categoriaDoc: "CategoriaDoc", fechaCarga: "FechaCarga", estadoVisibilidad: "EstadoVisibilidad" };
          document[field] = row[documentIndex[map[field]]];
        });
        referenceDocuments.push(document);
      });
      if (referenceDocuments.length !== requestedDocumentIds.length) return { status: "error", code: "RESOURCE_NOT_FOUND" };
      return { status: "success", referenceOnly: true, grantId: referenceAccess.grantId,
        auditEventId: referenceAccess.auditEventId, documentos: referenceDocuments };
    }
  } else if (role === "empleado") {
    var selfRows = employeeRows.filter(function(row) { return String(row[employeeIndex.UserId] || "").trim() === String(actor.userId || "").trim(); });
    if (selfRows.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var selfId = String(selfRows[0][employeeIndex.ExpedienteID] || "").trim();
    var selfAccess = assertEmployeeExpedienteScopeAccess_(input, ss, selfId);
    if (!selfAccess || selfAccess.authorized !== true) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    allowedIds = [selfId];
  } else {
    var seenExpedientes = {};
    employeeRows.forEach(function(row) {
      var id = String(row[employeeIndex.ExpedienteID] || "").trim();
      if (!id || seenExpedientes[id]) return;
      seenExpedientes[id] = true;
      var access = assertEmployeeExpedienteScopeAccess_(input, ss, id);
      if (access && access.authorized === true) allowedIds.push(id);
    });
  }
  if (!allowedIds.length) return { status: "success", documentos: [] };
  var allowedSet = {};
  allowedIds.forEach(function(id) { allowedSet[id] = true; });
  var matchingDocuments = documentValues.slice(1).filter(function(row) {
    if (!allowedSet[String(row[documentIndex.ExpedienteID] || "").trim()]) return false;
    var category = String(input.categoriaDoc || "").trim();
    return !category || String(row[documentIndex.CategoriaDoc] || "").trim().toLowerCase() === category.toLowerCase();
  });
  var idCounts = {};
  matchingDocuments.forEach(function(row) {
    var id = String(row[documentIndex.DocumentoID] || "").trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });
  matchingDocuments = matchingDocuments.filter(function(row) {
    var id = String(row[documentIndex.DocumentoID] || "").trim();
    return !!id && idCounts[id] === 1;
  });
  var privateFilesVerified = matchingDocuments.every(function(row) {
    return enforcePrivateEmployeeDocumentFile_(row[documentIndex.ArchivoUrl]);
  });
  if (!privateFilesVerified) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var fullDocuments = matchingDocuments.map(function(row) {
    return {
      documentoId: row[documentIndex.DocumentoID], expedienteId: row[documentIndex.ExpedienteID],
      categoriaDoc: row[documentIndex.CategoriaDoc], tituloDocumento: row[documentIndex.TituloDocumento],
      tieneArchivo: !!String(row[documentIndex.ArchivoUrl] || "").trim(), fechaCarga: row[documentIndex.FechaCarga],
      cargadoPor: row[documentIndex.CargadoPor], estadoVisibilidad: row[documentIndex.EstadoVisibilidad],
      observaciones: row[documentIndex.Observaciones]
    };
  });
  return { status: "success", documentos: fullDocuments };
}


function normalizeVacationRole_(role) {
  return String(role || "").trim().toLowerCase().replace(/\s+/g, "");
}

function validateRolePermission(actorOrPayload, action) {
  var actor = actorOrPayload && actorOrPayload.authorized === true
    ? actorOrPayload : getVerifiedAccountingIdentity_(actorOrPayload || {});
  if (!actor || actor.authorized !== true) return { authorized: false, code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var staffingActions = ["manageStaffingNeeds", "getStaffingNeedsPlanning", "manageWorkShiftAndSubstitution"];
  if (staffingActions.indexOf(String(action || "")) !== -1) {
    var staffingRole = normalizeVacationRole_(actor.role);
    var staffingAllowed = action === "manageStaffingNeeds" || action === "manageWorkShiftAndSubstitution"
      ? staffingRole === "recursoshumanos" : ["recursoshumanos","administrador"].indexOf(staffingRole) !== -1;
    return staffingAllowed ? { authorized: true, actor: actor } : { authorized: false, code: "ROLE_NOT_ALLOWED" };
  }
  var employeeScopeActions = ["getEmployeeDocuments", "getEmployeeContracts", "getEmployeeContractAlerts", "getEmployeeTrainingHistory", "getStaffAttendanceLogs", "getStaffPayrollReceipt", "getEmployeeLoansAdvances", "uploadEmployeeDocument", "getEmployeeSelfServicePortal", "recordStaffCheckIn", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "submitLeaveVacationRequest", "submitVacationRequest", "getLeaveVacationRequests", "getVacationRequests", "manageProfessionalDevelopmentPlan"];
  if (employeeScopeActions.indexOf(String(action || "")) !== -1) {
    var role = normalizeVacationRole_(actor.role), staffRoles = ["recursoshumanos","director","subdirector","administrador"];
    var selfRoles = ["empleado","profesor"], staffOnly = ["manageProfessionalDevelopmentPlan"];
    var allowed = staffRoles.indexOf(role) !== -1 || (selfRoles.indexOf(role) !== -1 && staffOnly.indexOf(String(action || "")) === -1);
    return allowed ? { authorized: true, actor: actor } : { authorized: false, code: "ROLE_NOT_ALLOWED" };
  }
  return accountingHasRolePermission_(actor, action)
    ? { authorized: true, actor: actor }
    : { authorized: false, code: "ROLE_NOT_ALLOWED" };
}

function resolveEmployeeDepartmentId_(ss, expedienteId) {
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!sheet) return "";
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return "";
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var idIndex = headers.indexOf("ExpedienteID"), departmentIndex = headers.indexOf("Departamento");
  if (idIndex < 0 || departmentIndex < 0) return "";
  var matches = values.slice(1).filter(function(row) { return String(row[idIndex] || "").trim() === String(expedienteId || "").trim(); });
  return matches.length === 1 ? String(matches[0][departmentIndex] || "").trim() : "";
}

function assertResourceOwnershipForScope_(payload, ss, expedienteId, resourceId, operation) {
  if (arguments.length >= 5) {
    var spreadsheet=payload,scope=ss,resourceType=String(expedienteId||"").trim().toUpperCase();
    var targetId=String(resourceId||"").trim(),action=String(operation||"").trim().toUpperCase();
    if(!spreadsheet||!scope||(scope.valid!==true&&scope.authorized!==true)||
      ["EXPEDIENTE_LABORAL","EXPEDIENTE_ESTUDIANTE"].indexOf(resourceType)===-1||
      ["READ","WRITE"].indexOf(action)===-1||!targetId)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var resourceSheet=spreadsheet.getSheetByName(resourceType==="EXPEDIENTE_LABORAL"?"ExpedientesLaborales":"ExpedientesEstudiantes");
    if(!resourceSheet)return{authorized:false,code:"RESOURCE_NOT_FOUND"};
    var resourceRows=resourceSheet.getDataRange().getValues();
    if(!resourceRows||!resourceRows.length)return{authorized:false,code:"RESOURCE_NOT_FOUND"};
    var resourceHeaders=resourceRows[0].map(function(v){return String(v||"").trim();}),resourceIdIndex=resourceHeaders.indexOf("ExpedienteID");
    if(resourceIdIndex<0)return{authorized:false,code:"RESOURCE_SCHEMA_INVALID"};
    var resourceMatches=resourceRows.slice(1).filter(function(row){return String(row[resourceIdIndex]||"").trim()===targetId;});
    if(resourceMatches.length!==1)return{authorized:false,code:"RESOURCE_NOT_FOUND"};
    var ownershipSheet=spreadsheet.getSheetByName("ResourceOwnership");
    if(!ownershipSheet)return{authorized:false,code:"RESOURCE_OWNERSHIP_UNVERIFIED"};
    var ownershipRows=ownershipSheet.getDataRange().getValues();
    var expected=["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
    if(!ownershipRows||!ownershipRows.length||JSON.stringify(ownershipRows[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(expected))
      return{authorized:false,code:"RESOURCE_OWNERSHIP_UNVERIFIED"};
    var institutionId=String(scope.institutionId||"").trim();
    var owners=ownershipRows.slice(1).filter(function(row){return String(row[1]||"").trim()===institutionId&&String(row[2]||"").trim().toUpperCase()===resourceType&&String(row[3]||"").trim()===targetId;});
    if(owners.length!==1||String(owners[0][5]||"").trim().toUpperCase()!=="ACTIVE")return{authorized:false,code:"RESOURCE_OWNERSHIP_UNVERIFIED"};
    var departmentId=String(owners[0][4]||"").trim();if(!departmentId)return{authorized:false,code:"RESOURCE_OWNERSHIP_UNVERIFIED"};
    var departments=Array.isArray(scope.departmentIds)?scope.departmentIds.map(function(v){return String(v||"").trim();}):[];
    if(scope.institutionWide!==true&&departments.indexOf(departmentId)===-1)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    return{authorized:true,accessType:scope.institutionWide===true?"INSTITUTION":"DEPARTMENT",departmentId:departmentId,institutionId:institutionId,operation:action};
  }
  return assertEmployeeExpedienteScopeAccess_(payload,ss,expedienteId);
}

function auditEmployeeSelfServiceDenied_(actor, action) {
  try {
    logStructuredEvent("ACCOUNTING", "employeeSelfService", "WARNING",
      "UNAUTHORIZED_EMPLOYEE_RESOURCE_ACCESS", "Acceso a recurso laboral denegado",
      { action: String(action || "read"), actorUserId: String(actor && actor.userId || "") },
      String(actor && actor.role || "Unknown"));
  } catch (ignored) {}
}

function getVacationSheetSnapshot_(ss, sheetName) {
  var name = sheetName || "SolicitudesVacaciones";
  var headers = name === "IncapacidadesMedicas"
    ? ["IncapacidadID","ExpedienteID","CentroMedico","DiagnosticoPrivadoUrl","FechaInicio","FechaFin","DiasOtorgados","EstadoIHSS","Observaciones"]
    : ["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"];
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName(name) : null;
  if (!sheet) return { valid: true, missing: true, headers: headers, rows: [], sheet: null };
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { valid: true, missing: false, headers: headers, rows: [], sheet: sheet };
  var actual = values[0].map(function(value) { return String(value || "").trim(); });
  if (JSON.stringify(actual) !== JSON.stringify(headers)) return { valid: false, code: "RESOURCE_SCHEMA_INVALID", rows: [], sheet: sheet };
  var rows = values.slice(1);
  if (rows.some(function(row) { return !String(row[0] || "").trim(); })) {
    return { valid: false, code: "RESOURCE_SCHEMA_INVALID", rows: [], sheet: sheet };
  }
  return { valid: true, missing: false, headers: headers, rows: rows, sheet: sheet };
}

function getEmployeePersonNameIndex_(ss) {
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("Personas") : null;
  var result = Object.create(null);
  if (!sheet) return result;
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return result;
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var idIndex = headers.indexOf("PersonaID"), firstIndex = headers.indexOf("Nombres"), lastIndex = headers.indexOf("Apellidos");
  if (idIndex < 0 || firstIndex < 0 || lastIndex < 0) return result;
  values.slice(1).forEach(function(row) {
    var id = String(row[idIndex] || "").trim();
    if (id && !Object.prototype.hasOwnProperty.call(result, id)) result[id] = [row[firstIndex], row[lastIndex]].map(function(value) { return String(value || "").trim(); }).filter(Boolean).join(" ");
  });
  return result;
}

function normalizeVacationRequestStatus_(status) {
  var value = String(status || "").trim().toLowerCase();
  if (value === "pendienteaprobacion" || value === "pending" || value === "pendiente") return "Pendiente";
  if (value === "aprobado" || value === "approved") return "Aprobado";
  if (value === "rechazado" || value === "rejected") return "Rechazado";
  if (value === "cancelado" || value === "cancelled") return "Cancelado";
  return String(status || "").trim();
}

function resolveVacationEmployeeAccess_(payload, ss, expedienteId, actor) {
  var identity = actor || getVerifiedAccountingIdentity_(payload || {});
  if (!identity || identity.authorized !== true) return { authorized: false, code: identity && identity.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = normalizeVacationRole_(identity.role);
  var employeeSheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!employeeSheet) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var values = employeeSheet.getDataRange().getValues();
  if (!values || !values.length) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var idx = { id: headers.indexOf("ExpedienteID"), person: headers.indexOf("PersonaId"), user: headers.indexOf("UserId"), department: headers.indexOf("Departamento"), hire: headers.indexOf("FechaIngreso"), notes: headers.indexOf("Observaciones") };
  if (idx.id < 0 || idx.user < 0 || idx.department < 0) return { authorized: false, code: "RESOURCE_SCHEMA_INVALID" };
  var targetId = String(expedienteId || "").trim();
  if ((role === "empleado" || role === "profesor") && !targetId) {
    var own = values.slice(1).filter(function(row) { return String(row[idx.user] || "").trim() === identity.userId; });
    if (own.length !== 1) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
    targetId = String(own[0][idx.id] || "").trim();
  }
  var matches = values.slice(1).filter(function(row) { return String(row[idx.id] || "").trim() === targetId; });
  if (!targetId || matches.length !== 1) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var row = matches[0];
  if (role === "empleado" || role === "profesor") {
    if (String(row[idx.user] || "").trim() !== identity.userId) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
    return { authorized: true, actor: identity, role: role, expedienteId: targetId, employee: row, employeeIndex: idx, accessType: "SELF" };
  }
  var scope = getVerifiedAccountingDepartmentScope_(payload || {}, ss, identity);
  if (!scope || scope.valid !== true) {
    if (scope && scope.institutionWide === true) return { authorized: true, actor: identity, role: role, expedienteId: targetId, employee: row, employeeIndex: idx, scope: scope, accessType: "INSTITUTION" };
    return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  }
  if (scope.institutionWide === true) return { authorized: true, actor: identity, role: role, expedienteId: targetId, employee: row, employeeIndex: idx, scope: scope, accessType: "INSTITUTION" };
  var department = String(row[idx.department] || "").trim();
  var permitted = (scope.departmentIds || []).map(function(value) { return String(value || "").trim(); });
  if (!department || permitted.indexOf(department) === -1) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  return { authorized: true, actor: identity, role: role, expedienteId: targetId, employee: row, employeeIndex: idx, scope: scope, accessType: "DEPARTMENT" };
}

function assertVacationWriteAccess_(payload, ss, expedienteId, actor, allowedRoles) {
  var access = resolveVacationEmployeeAccess_(payload, ss, expedienteId, actor);
  if (!access.authorized) return access;
  var allowed = allowedRoles || ["recursoshumanos","director","administrador"];
  if (allowed.indexOf(access.role) === -1) return { authorized: false, code: "ROLE_NOT_ALLOWED" };
  return access;
}

function getEmployeeResourceAccessIndex_(payload, ss, actor) {
  var identity = actor || getVerifiedAccountingIdentity_(payload || {});
  if (!identity || identity.authorized !== true) return { valid: false, code: identity && identity.code || "VERIFIED_IDENTITY_REQUIRED" };
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!sheet) return { valid: false, code: "RESOURCE_NOT_FOUND", byUserId: {}, byExpedienteId: {} };
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { valid: true, byUserId: {}, byExpedienteId: {} };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var idIndex = headers.indexOf("ExpedienteID"), userIndex = headers.indexOf("UserId");
  if (idIndex < 0 || userIndex < 0) return { valid: false, code: "RESOURCE_SCHEMA_INVALID", byUserId: {}, byExpedienteId: {} };
  var byUser = {}, countsByUser = {}, countsById = {};
  values.slice(1).forEach(function(row) {
    var id = String(row[idIndex] || "").trim(), userId = String(row[userIndex] || "").trim();
    if (!id || !userId) return;
    countsByUser[userId] = (countsByUser[userId] || 0) + 1;
    countsById[id] = (countsById[id] || 0) + 1;
    byUser[userId] = { expedienteId: id, row: row };
  });
  var resultUsers = {}, resultIds = {};
  Object.keys(byUser).forEach(function(userId) {
    var record = byUser[userId];
    if (countsByUser[userId] !== 1 || countsById[record.expedienteId] !== 1) return;
    var access = assertEmployeeExpedienteScopeAccess_(payload || {}, ss, record.expedienteId);
    if (!access || access.authorized !== true) return;
    resultUsers[userId] = { expedienteId: record.expedienteId, row: record.row, access: access };
    resultIds[record.expedienteId] = { userId: userId, row: record.row, access: access };
  });
  return { valid: true, byUserId: resultUsers, byExpedienteId: resultIds };
}

function getEmployeeRecords(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return{status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var permission=validateRolePermission(actor,"getEmployeeRecords");if(!permission.authorized)return{status:"error",code:permission.code};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=ss.getSheetByName("ExpedientesLaborales");if(!sheet)return{status:"success",data:[],expedientes:[]};
  var values=sheet.getDataRange().getValues();if(!values.length)return{status:"success",data:[],expedientes:[]};
  var headers=values[0].map(function(v){return String(v||"").trim();}),idx={id:headers.indexOf("ExpedienteID"),person:headers.indexOf("PersonaId"),user:headers.indexOf("UserId"),role:headers.indexOf("Puesto"),department:headers.indexOf("Departamento"),cost:headers.indexOf("CentroCosto"),hire:headers.indexOf("FechaIngreso"),exit:headers.indexOf("FechaSalida"),state:headers.indexOf("EstadoLaboral"),notes:headers.indexOf("Observaciones")};
  if(Object.keys(idx).some(function(k){return idx[k]<0;}))return{status:"error",code:"RESOURCE_SCHEMA_INVALID"};
  var role=String(actor.role||"").trim().toLowerCase(),requestedUser=String(input.userId||"").trim();if(role==="empleado"&&requestedUser&&requestedUser!==String(actor.userId))return{status:"error",code:"RESOURCE_NOT_FOUND"};
  var names=getEmployeePersonNameIndex_(ss),rows=[],seen={};values.slice(1).forEach(function(row){var id=String(row[idx.id]||"").trim();if(!id||seen[id]||(requestedUser&&String(row[idx.user]||"").trim()!==requestedUser))return;seen[id]=true;var access=assertEmployeeExpedienteScopeAccess_(input,ss,id);if(!access||!access.authorized)return;rows.push({expedienteId:id,personaId:row[idx.person],userId:role==="empleado"?undefined:row[idx.user],puesto:row[idx.role],departamento:row[idx.department],centroCosto:row[idx.cost],fechaIngreso:row[idx.hire],fechaSalida:row[idx.exit],estadoLaboral:row[idx.state],empleadoNombre:names[String(row[idx.person]||"").trim()]||"",observaciones:role==="empleado"?"":(row[idx.notes]||"")});});
  var requestedId=String(input.expedienteId||"").trim();if(requestedId&&!rows.some(function(x){return x.expedienteId===requestedId;}))return{status:"error",code:"RESOURCE_NOT_FOUND"};
  return{status:"success",data:rows,expedientes:rows};
}

function submitVacationRequestCore_(payload, allowedRoles) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = normalizeVacationRole_(actor.role);
  if (allowedRoles.indexOf(role) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = resolveVacationEmployeeAccess_(input, ss, input.expedienteId, actor);
  if (!access.authorized) {
    if (access.code === "RESOURCE_NOT_FOUND") auditEmployeeSelfServiceDenied_(actor, "submitLeaveVacationRequest");
    return { status: "error", code: access.code };
  }
  var start = new Date(input.fechaInicio), end = new Date(input.fechaFin);
  if (!input.fechaInicio || !input.fechaFin || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return { status: "error", code: "REQUEST_DATE_INVALID" };
  var requestedDays = Number(input.diasSolicitados === undefined ? 1 : input.diasSolicitados);
  if (!isFinite(requestedDays) || requestedDays <= 0 || requestedDays > 365) return { status: "error", code: "REQUEST_DURATION_INVALID" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    var snapshot = getVacationSheetSnapshot_(ss);
    if (!snapshot.valid) return { status: "error", code: snapshot.code };
    var sheet = snapshot.sheet;
    if (!sheet) {
      sheet = ss.insertSheet("SolicitudesVacaciones");
      sheet.appendRow(snapshot.headers);
    }
    var startTime = start.getTime(), endTime = end.getTime();
    var overlap = snapshot.rows.some(function(row) {
      var state = normalizeVacationRequestStatus_(row[6]);
      if (String(row[1] || "").trim() !== access.expedienteId || ["Rechazado","Cancelado"].indexOf(state) !== -1) return false;
      var oldStart = new Date(row[3]), oldEnd = new Date(row[4]);
      return !isNaN(oldStart.getTime()) && !isNaN(oldEnd.getTime()) && startTime <= oldEnd.getTime() && endTime >= oldStart.getTime();
    });
    if (overlap) return { status: "error", code: "VACATION_REQUEST_OVERLAP" };
    var requestId = "VAC-" + Utilities.getUuid().replace(/-/g, "").slice(0, 18);
    sheet.appendRow([requestId, access.expedienteId, String(input.tipo || "Vacaciones"), start, end, requestedDays,
      "PendienteAprobacion", "", String(input.motivo || input.observaciones || "").slice(0, 1000)]);
    return { status: "success", solicitudId: requestId, estado: "PendienteAprobacion", expedienteId: access.expedienteId };
  } catch (error) {
    return { status: "error", code: "VACATION_WRITE_FAILED" };
  } finally { lock.releaseLock(); }
}

function submitLeaveVacationRequest(payload) {
  return submitVacationRequestCore_(payload, ["empleado","recursoshumanos"]);
}

function submitVacationRequest(payload) {
  return submitVacationRequestCore_(payload, ["director","profesor","recursoshumanos"]);
}

function getLeaveVacationRequests(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED", data: [], solicitudes: [] };
  var role = normalizeVacationRole_(actor.role);
  if (["empleado","recursoshumanos","director","administrador"].indexOf(role) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED", data: [], solicitudes: [] };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), snapshot = getVacationSheetSnapshot_(ss);
  if (!snapshot.valid) return { status: "error", code: snapshot.code, data: [], solicitudes: [] };
  var names = getEmployeePersonNameIndex_(ss), result = [];
  snapshot.rows.forEach(function(row) {
    var access = resolveVacationEmployeeAccess_(input, ss, row[1], actor);
    if (!access.authorized) return;
    var employee = access.employee, personIndex = access.employeeIndex.person;
    var employeeName = names[String(employee[personIndex] || "").trim()] || "";
    var item = { solicitudId: row[0], expedienteId: row[1], tipo: row[2], tipoSolicitud: String(row[2] || "").toLowerCase().indexOf("vac") !== -1 ? "Vacaciones" : String(row[2] || ""),
      fechaInicio: row[3], fechaFin: row[4], diasSolicitados: Number(row[5] || 0), estado: normalizeVacationRequestStatus_(row[6]),
      estadoOriginal: row[6], empleadoNombre: employeeName };
    if (role !== "empleado") { item.observaciones = row[8] || ""; item.aprobadoPor = row[7] || ""; }
    result.push(item);
  });
  return { status: "success", total: result.length, data: result, solicitudes: result };
}

function getVacationRequests(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED", solicitudes: [], data: [] };
  var role = normalizeVacationRole_(actor.role);
  if (role === "empleado" && String(input.expedienteId || "").trim()) return { status: "error", code: "RESOURCE_NOT_FOUND", solicitudes: [], data: [] };
  if (["recursoshumanos","director","administrador"].indexOf(role) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED", solicitudes: [], data: [] };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), snapshot = getVacationSheetSnapshot_(ss);
  if (!snapshot.valid) return { status: "error", code: snapshot.code, solicitudes: [], data: [] };
  var names = getEmployeePersonNameIndex_(ss), requested = String(input.expedienteId || "").trim(), result = [], requestIdCounts = Object.create(null);
  snapshot.rows.forEach(function(row) {
    var requestId = String(row[0] || "").trim();
    requestIdCounts[requestId] = (requestIdCounts[requestId] || 0) + 1;
  });
  snapshot.rows.forEach(function(row) {
    var requestId = String(row[0] || "").trim();
    if (requestIdCounts[requestId] !== 1) return;
    if (requested && String(row[1] || "").trim() !== requested) return;
    var access = resolveVacationEmployeeAccess_(input, ss, row[1], actor);
    if (!access.authorized) return;
    var employee = access.employee;
    result.push({ solicitudId: row[0], expedienteId: row[1], tipo: row[2], tipoSolicitud: String(row[2] || "").toLowerCase().indexOf("vac") !== -1 ? "Vacaciones" : String(row[2] || ""),
      fechaInicio: row[3], fechaFin: row[4], diasSolicitados: Number(row[5] || 0), estado: normalizeVacationRequestStatus_(row[6]),
      estadoOriginal: row[6], aprobadoPor: row[7] || "", observaciones: row[8] || "",
      empleadoNombre: names[String(employee[access.employeeIndex.person] || "").trim()] || "" });
  });
  if (requested && !result.length) return { status: "error", code: "RESOURCE_NOT_FOUND", solicitudes: [], data: [] };
  return { status: "success", solicitudes: result, data: result, total: result.length };
}

function reviewVacationRequest(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  if (["recursoshumanos","director","administrador"].indexOf(normalizeVacationRole_(actor.role)) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID), snapshot = getVacationSheetSnapshot_(ss);
    if (!snapshot.valid) return { status: "error", code: snapshot.code };
    var matches = snapshot.rows.map(function(row, index) { return { row: row, index: index }; })
      .filter(function(item) { return String(item.row[0] || "").trim() === String(input.solicitudId || "").trim(); });
    if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var row = matches[0].row, access = resolveVacationEmployeeAccess_(input, ss, row[1], actor);
    if (!access.authorized) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var next = String(input.nuevoEstado || "").trim();
    if (["Aprobado","Rechazado"].indexOf(next) === -1) return { status: "error", code: "REQUEST_STATE_INVALID" };
    if (normalizeVacationRequestStatus_(row[6]) !== "Pendiente") return { status: "error", code: "REQUEST_ALREADY_REVIEWED" };
    var sheet = snapshot.sheet;
    if (!sheet) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var rowNumber = matches[0].index + 2;
    sheet.getRange(rowNumber, 7).setValue(next);
    sheet.getRange(rowNumber, 8).setValue(actor.role);
    if (input.observaciones !== undefined) sheet.getRange(rowNumber, 9).setValue(String(input.observaciones).slice(0, 1000));
    return { status: "success", solicitudId: input.solicitudId, estado: next, aprobadoPor: actor.role };
  } catch (error) { return { status: "error", code: "VACATION_WRITE_FAILED" }; }
  finally { lock.releaseLock(); }
}

function reviewLeaveVacationRequest(payload) {
  return reviewVacationRequest(payload);
}

function calculateVacationBalances(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  if (["recursoshumanos","director","administrador"].indexOf(normalizeVacationRole_(actor.role)) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), access = resolveVacationEmployeeAccess_(input, ss, input.expedienteId, actor);
  if (!access.authorized) return { status: "error", code: access.code || "RESOURCE_NOT_FOUND" };
  var hireDate = new Date(access.employee[access.employeeIndex.hire]);
  if (isNaN(hireDate.getTime())) return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
  var today = new Date(), years = today.getFullYear() - hireDate.getFullYear();
  if (today.getMonth() < hireDate.getMonth() || (today.getMonth() === hireDate.getMonth() && today.getDate() < hireDate.getDate())) years--;
  years = Math.max(0, years);
  var entitlement = years >= 4 ? 20 : years === 3 ? 15 : years === 2 ? 12 : years === 1 ? 10 : 0;
  var snapshot = getVacationSheetSnapshot_(ss);
  if (!snapshot.valid) return { status: "error", code: snapshot.code };
  var used = snapshot.rows.filter(function(row) { return String(row[1] || "").trim() === access.expedienteId && normalizeVacationRequestStatus_(row[6]) === "Aprobado"; })
    .reduce(function(total, row) { return total + Number(row[5] || 0); }, 0);
  return { status: "success", expedienteId: access.expedienteId, antiguedadAnos: years,
    diasDerechoAnual: entitlement, diasGozados: used, saldoDisponible: Math.max(0, entitlement - used) };
}

function recordMedicalLeave(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  if (normalizeVacationRole_(actor.role) !== "recursoshumanos") return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), access = resolveVacationEmployeeAccess_(input, ss, input.expedienteId, actor);
  if (!access.authorized) return { status: "error", code: access.code || "RESOURCE_NOT_FOUND" };
  if (!input.fechaInicio || !input.fechaFin || isNaN(new Date(input.fechaInicio).getTime()) ||
      isNaN(new Date(input.fechaFin).getTime()) || new Date(input.fechaInicio) > new Date(input.fechaFin)) {
    return { status: "error", code: "REQUEST_DATE_INVALID" };
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    var snapshot = getVacationSheetSnapshot_(ss, "IncapacidadesMedicas");
    if (!snapshot.valid) return { status: "error", code: snapshot.code };
    var sheet = snapshot.sheet;
    if (!sheet) { sheet = ss.insertSheet("IncapacidadesMedicas"); sheet.appendRow(snapshot.headers); }
    var id = "INC-" + Utilities.getUuid().replace(/-/g, "").slice(0, 18);
    sheet.appendRow([id, access.expedienteId, String(input.centroMedico || "IHSS").slice(0, 120),
      "PRIVADO_CONFIDENCIAL", new Date(input.fechaInicio), new Date(input.fechaFin),
      Math.max(1, Number(input.diasOtorgados || 1)), String(input.estadoIHSS || "PendienteValidacion").slice(0, 40),
      String(input.observaciones || "").slice(0, 500)]);
    return { status: "success", incapacidadId: id };
  } catch (error) { return { status: "error", code: "MEDICAL_LEAVE_WRITE_FAILED" }; }
  finally { lock.releaseLock(); }
}


function ensureLaborWriteSheet_(ss, sheetName, expectedHeaders) {
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName(sheetName) : null;
  if (!sheet) {
    if (!ss || typeof ss.insertSheet !== "function") return { valid: false, code: "RESOURCE_SCHEMA_INVALID" };
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(expectedHeaders);
    return { valid: true, sheet: sheet, rows: [] };
  }
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length || JSON.stringify(values[0].map(function(v){return String(v||"").trim();})) !== JSON.stringify(expectedHeaders)) {
    return { valid: false, code: "RESOURCE_SCHEMA_INVALID" };
  }
  return { valid: true, sheet: sheet, rows: values.slice(1) };
}

function parseLaborBoolean_(value) {
  if (value === true || value === false) return value;
  var normalized = String(value === undefined || value === null ? "" : value).trim().toLowerCase();
  if (["true","1","si","sí","yes"].indexOf(normalized) !== -1) return true;
  if (["false","0","no",""].indexOf(normalized) !== -1) return false;
  return null;
}

function resolveLaborIncidentWriteAccess_(payload, ss, employeeId, action) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { authorized: false, code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = normalizeVacationRole_(actor.role);
  if (role !== "recursoshumanos") return { authorized: false, code: role === "administrador" ? "RESOURCE_NOT_FOUND" : "ROLE_NOT_ALLOWED" };
  var employeeSheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!employeeSheet) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var values = employeeSheet.getDataRange().getValues();
  if (!values || values.length < 2) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var headers = values[0].map(function(v){return String(v||"").trim();});
  var idIndex = headers.indexOf("ExpedienteID"), userIndex = headers.indexOf("UserId");
  if (idIndex < 0 || userIndex < 0) return { authorized: false, code: "RESOURCE_SCHEMA_INVALID" };
  var target = String(employeeId || "").trim();
  var matches = values.slice(1).map(function(row){return {row:row,index:headers};}).filter(function(item){
    return String(item.row[userIndex]||"").trim() === target || String(item.row[idIndex]||"").trim() === target;
  });
  if (matches.length !== 1) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var expedienteId = String(matches[0].row[idIndex]||"").trim();
  var access = assertResourceOwnershipForScope_(input, ss, expedienteId);
  if (!access || access.authorized !== true) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  return { authorized: true, actor: actor, employeeId: target, expedienteId: expedienteId, access: access };
}

function manageLaborIncident(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = resolveLaborIncidentWriteAccess_(input, ss, input.empleadoId, "manageLaborIncident");
  if (!access.authorized) return { status: "error", code: access.code };
  var headers = ["IncidenciaID","EmpleadoID","Fecha","Categoria","DescripcionObjetiva","ResponsableRegistro","Estado","ResponsabilidadEstablecida","DocumentacionDriveUrl","ObservacionesAclaraciones","HistorialAclaracionesJSON","CreadoPor","FechaCreacion","UltimaModificacion"];
  var snapshot = ensureLaborWriteSheet_(ss, "IncidenciasLaborales", headers);
  if (!snapshot.valid) return { status: "error", code: snapshot.code };
  var description = String(input.descripcionObjetiva || "").trim();
  if (!description) return { status: "error", code: "LABOR_INCIDENT_DESCRIPTION_REQUIRED" };
  var responsibility = parseLaborBoolean_(input.responsabilidadEstablecida);
  if (responsibility === null) return { status: "error", code: "LABOR_INCIDENT_BOOLEAN_INVALID" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    var matches = snapshot.rows.map(function(row,index){return {row:row,index:index};}).filter(function(item){
      return input.incidenciaId && String(item.row[0]||"").trim() === String(input.incidenciaId).trim();
    });
    if (input.incidenciaId && matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var now = new Date(), userId = access.actor.userId, sheet = snapshot.sheet;
    if (!input.incidenciaId) {
      var generated = "INC-LAB-" + String(Utilities.getUuid()).replace(/-/g,"");
      if (snapshot.rows.some(function(row){return String(row[0]||"") === generated;})) return { status: "error", code: "LABOR_INCIDENT_ID_COLLISION" };
      sheet.appendRow([generated,access.employeeId,now,String(input.categoria||"General").slice(0,80),description,userId,"Registrada",responsibility,
        String(input.documentacionDriveUrl||""),String(input.observacionesAclaraciones||"").slice(0,1000),"[]",userId,now,""]);
      return { status: "success", incidenciaId: generated };
    }
    var item = matches[0], old = item.row.slice();
    if (String(old[1]||"").trim() !== access.employeeId) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var history;
    try { history = JSON.parse(String(old[10]||"[]")); } catch (ignored) { return { status: "error", code: "RESOURCE_SCHEMA_INVALID" }; }
    if (!Array.isArray(history)) return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
    history.push({modificadoPor:userId,fecha:now.toISOString(),aclaracionAnterior:String(old[9]||""),aclaracionNueva:String(input.observacionesAclaraciones||"")});
    var next = old.slice(); next[3] = String(input.categoria||old[3]||"General").slice(0,80);
    next[4] = description; next[7] = responsibility; next[9] = String(input.observacionesAclaraciones||"").slice(0,1000);
    next[10] = JSON.stringify(history); next[13] = now;
    try { sheet.getRange(item.index+2,1,1,headers.length).setValues([next]); }
    catch (writeError) { return { status: "error", code: "LABOR_INCIDENT_WRITE_FAILED" }; }
    return { status: "success", incidenciaId: input.incidenciaId };
  } finally { lock.releaseLock(); }
}

function manageDisciplinaryMeasure(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = resolveLaborIncidentWriteAccess_(input, ss, input.empleadoId, "manageDisciplinaryMeasure");
  if (!access.authorized) return { status: "error", code: access.code };
  var headers = ["MedidaID","IncidenciaID","EmpleadoID","TipoMedida","FundamentoDocumentado","FechaEfectiva","ResponsableAprobacion","EstadoMedida","DiasSuspension","ActaFirmadaDriveUrl","CreadoPor","FechaCreacion","UltimaModificacion"];
  var days = Number(input.diasSuspension || 0);
  if (!isFinite(days) || days < 0 || days > 365) return { status: "error", code: "DISCIPLINARY_DAYS_INVALID" };
  if (!String(input.tipoMedida||"").trim() || !String(input.fundamentoDocumentado||"").trim()) return { status: "error", code: "DISCIPLINARY_BASIS_REQUIRED" };
  var existingSheet = ss.getSheetByName("MedidasDisciplinarias");
  var existingValues = existingSheet ? existingSheet.getDataRange().getValues().slice(1) : [];
  var proposedId = input.medidaId ? String(input.medidaId).trim() : "MED-DISC-" + String(Utilities.getUuid()).replace(/-/g,"");
  if (!input.medidaId && existingValues.some(function(row){return String(row[0]||"")===proposedId;})) return { status: "error", code: "DISCIPLINARY_MEASURE_ID_COLLISION" };
  var incidentSheet = ss.getSheetByName("IncidenciasLaborales");
  if (!incidentSheet) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var incidentValues = incidentSheet.getDataRange().getValues();
  var incidentMatches = incidentValues.slice(1).filter(function(row){return String(row[0]||"")===String(input.incidenciaId||"") && String(row[1]||"")===access.employeeId;});
  if (incidentMatches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var snapshot = ensureLaborWriteSheet_(ss,"MedidasDisciplinarias",headers);
  if (!snapshot.valid) return { status: "error", code: snapshot.code };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    var now = new Date(), id = String(input.medidaId||"").trim(), matches = snapshot.rows.map(function(row,index){return {row:row,index:index};}).filter(function(item){return id && String(item.row[0]||"")===id;});
    if (id && matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    if (!id) {
      id = proposedId;
      if (snapshot.rows.some(function(row){return String(row[0]||"")===id;})) return { status: "error", code: "DISCIPLINARY_MEASURE_ID_COLLISION" };
      snapshot.sheet.appendRow([id,input.incidenciaId,access.employeeId,String(input.tipoMedida),String(input.fundamentoDocumentado),input.fechaEfectiva||now,
        access.actor.userId,"Pendiente",days,String(input.actaFirmadaDriveUrl||""),access.actor.userId,now,""]);
    } else {
      var old = matches[0].row.slice();
      if (String(old[2]||"") !== access.employeeId || String(old[1]||"") !== String(input.incidenciaId||"")) return { status: "error", code: "RESOURCE_NOT_FOUND" };
      old[3]=String(input.tipoMedida);old[4]=String(input.fundamentoDocumentado);old[5]=input.fechaEfectiva||old[5];old[8]=days;old[12]=now;
      snapshot.sheet.getRange(matches[0].index+2,1,1,headers.length).setValues([old]);
    }
    return { status: "success", medidaId: id };
  } catch (error) { return { status: "error", code: "DISCIPLINARY_WRITE_FAILED" }; }
  finally { lock.releaseLock(); }
}


function ensureTrainingEnrollmentWriteSheet_(ss, sheetName, headers) {
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName(sheetName) : null;
  if (!sheet) {
    if (!ss || typeof ss.insertSheet !== "function") return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
    sheet = ss.insertSheet(sheetName); sheet.appendRow(headers); return {valid:true,sheet:sheet,rows:[]};
  }
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length || JSON.stringify(values[0].map(function(v){return String(v||"").trim();})) !== JSON.stringify(headers)) return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
  return {valid:true,sheet:sheet,rows:values.slice(1)};
}

function resolveTrainingEnrollmentEmployeeWriteAccess_(payload, ss, employeeId) {
  var input=payload||{}, actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return {authorized:false,code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  if(normalizeVacationRole_(actor.role)!=="recursoshumanos")return {authorized:false,code:"ROLE_NOT_ALLOWED"};
  var sheet=ss&&ss.getSheetByName?ss.getSheetByName("ExpedientesLaborales"):null;
  if(!sheet)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var values=sheet.getDataRange().getValues(),headers=values[0].map(function(v){return String(v||"").trim();});
  var idIndex=headers.indexOf("ExpedienteID"),userIndex=headers.indexOf("UserId");
  if(idIndex<0||userIndex<0)return {authorized:false,code:"RESOURCE_SCHEMA_INVALID"};
  var target=String(employeeId||"").trim();
  var matches=values.slice(1).filter(function(row){return String(row[userIndex]||"").trim()===target||String(row[idIndex]||"").trim()===target;});
  if(matches.length!==1)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var expedienteId=String(matches[0][idIndex]||"").trim();
  var ownership=assertResourceOwnershipForScope_(input,ss,expedienteId);
  if(!ownership||ownership.authorized!==true)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  return {authorized:true,actor:actor,employeeId:target,expedienteId:expedienteId};
}

function resolveTrainingCourseForEnrollment_(ss, courseId) {
  var sheet=ss&&ss.getSheetByName?ss.getSheetByName("CatalogoCursosCapacitacion"):null;
  if(!sheet)return {valid:false,code:"RESOURCE_NOT_FOUND"};
  var values=sheet.getDataRange().getValues();
  var headers=["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"];
  if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(headers))return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
  var matches=values.slice(1).filter(function(row){return String(row[0]||"").trim()===String(courseId||"").trim()&&String(row[8]||"").toLowerCase()==="activo";});
  return matches.length===1?{valid:true,course:matches[0]}:{valid:false,code:"RESOURCE_NOT_FOUND"};
}

function manageTrainingEnrollment(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var access=resolveTrainingEnrollmentEmployeeWriteAccess_(input,ss,input.empleadoId);
  if(!access.authorized)return {status:"error",code:access.code};
  var course=resolveTrainingCourseForEnrollment_(ss,input.cursoId);
  if(!course.valid)return {status:"error",code:course.code};
  var headers=["InscripcionID","CursoID","EmpleadoID","FechaInscripcion","EstadoInscripcion","AsistenciaPorcentaje","ResultadoNota","CertificadoDriveUrl","FechaEmisionCertificado","FechaVencimientoCertificado","Observaciones","CreadoPor","FechaCreacion","UltimaModificacion"];
  var snapshot=ensureTrainingEnrollmentWriteSheet_(ss,"InscripcionesCapacitacion",headers);
  if(!snapshot.valid)return {status:"error",code:snapshot.code};
  if(input.asistenciaPorcentaje!==undefined&&input.asistenciaPorcentaje!==""&&(!isFinite(Number(input.asistenciaPorcentaje))||Number(input.asistenciaPorcentaje)<0||Number(input.asistenciaPorcentaje)>100))return {status:"error",code:"TRAINING_ATTENDANCE_INVALID"};
  if(input.resultadoNota!==undefined&&input.resultadoNota!==""&&(!isFinite(Number(input.resultadoNota))||Number(input.resultadoNota)<0||Number(input.resultadoNota)>100))return {status:"error",code:"TRAINING_GRADE_INVALID"};
  var enrollmentDate=input.fechaInscripcion?new Date(input.fechaInscripcion):new Date();
  if(isNaN(enrollmentDate.getTime()))return {status:"error",code:"TRAINING_ENROLLMENT_DATE_INVALID"};
  var issue=input.fechaEmisionCertificado?new Date(input.fechaEmisionCertificado):null;
  var expiry=input.fechaVencimientoCertificado?new Date(input.fechaVencimientoCertificado):null;
  if((issue&&isNaN(issue.getTime()))||(expiry&&isNaN(expiry.getTime()))||(issue&&expiry&&expiry<issue))return {status:"error",code:"TRAINING_CERTIFICATE_DATE_RANGE_INVALID"};
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY"};
  try {
    var id=String(input.inscripcionId||"").trim();
    var matches=snapshot.rows.map(function(row,index){return {row:row,index:index};}).filter(function(item){return id&&String(item.row[0]||"").trim()===id;});
    if(id&&matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND"};
    var now=new Date(),next;
    if(!id){
      id="CAP-"+String(Utilities.getUuid()).replace(/-/g,"");
      if(snapshot.rows.some(function(row){return String(row[0]||"")===id;}))return {status:"error",code:"TRAINING_ENROLLMENT_ID_COLLISION"};
      next=[id,String(input.cursoId),access.employeeId,enrollmentDate,String(input.estadoInscripcion||"Inscrito"),
        input.asistenciaPorcentaje===""||input.asistenciaPorcentaje===undefined?"":Number(input.asistenciaPorcentaje),
        input.resultadoNota===""||input.resultadoNota===undefined?"":Number(input.resultadoNota),
        String(input.certificadoDriveUrl||""),issue||"",expiry||"",String(input.observaciones||"").slice(0,1000),
        access.actor.userId,now,""];
      snapshot.sheet.appendRow(next);
    } else {
      var old=matches[0].row.slice();
      if(String(old[2]||"")!==access.employeeId||String(old[1]||"")!==String(input.cursoId||""))return {status:"error",code:"RESOURCE_NOT_FOUND"};
      next=old.slice();next[3]=enrollmentDate;next[4]=String(input.estadoInscripcion||old[4]||"Inscrito");
      if(input.asistenciaPorcentaje!==undefined)next[5]=Number(input.asistenciaPorcentaje);
      if(input.resultadoNota!==undefined)next[6]=Number(input.resultadoNota);
      if(input.certificadoDriveUrl!==undefined)next[7]=String(input.certificadoDriveUrl||"");
      if(input.fechaEmisionCertificado!==undefined)next[8]=issue||"";
      if(input.fechaVencimientoCertificado!==undefined)next[9]=expiry||"";
      if(input.observaciones!==undefined)next[10]=String(input.observaciones).slice(0,1000);
      next[13]=now;
      try{snapshot.sheet.getRange(matches[0].index+2,1,1,headers.length).setValues([next]);}
      catch(writeError){return {status:"error",code:"TRAINING_ENROLLMENT_WRITE_FAILED"};}
    }
    return {status:"success",inscripcionId:id};
  } catch(error){return {status:"error",code:"TRAINING_ENROLLMENT_WRITE_FAILED"};}
  finally{lock.releaseLock();}
}


function ensureTrainingCourseWriteSheet_(ss, headers) {
  var sheet=ss&&ss.getSheetByName?ss.getSheetByName("CatalogoCursosCapacitacion"):null;
  if(!sheet){
    if(!ss||typeof ss.insertSheet!=="function")return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
    sheet=ss.insertSheet("CatalogoCursosCapacitacion");sheet.appendRow(headers);return {valid:true,sheet:sheet,rows:[]};
  }
  var values=sheet.getDataRange().getValues();
  if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(headers))return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
  return {valid:true,sheet:sheet,rows:values.slice(1)};
}

function resolveTrainingCatalogWriteAccess_(payload, ss) {
  var actor=getVerifiedAccountingIdentity_(payload||{});
  if(!actor||actor.authorized!==true)return {authorized:false,code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  if(normalizeVacationRole_(actor.role)!=="recursoshumanos")return {authorized:false,code:"ROLE_NOT_ALLOWED"};
  var scope=getVerifiedAccountingDepartmentScope_(payload||{},ss,actor);
  if(!scope||scope.valid!==true||scope.institutionWide!==true)return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};
  return {authorized:true,actor:actor,scope:scope};
}

function manageTrainingCourse(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var access=resolveTrainingCatalogWriteAccess_(input,ss);
  if(!access.authorized)return {status:"error",code:access.code};
  var headers=["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"];
  var snapshot=ensureTrainingCourseWriteSheet_(ss,headers);
  if(!snapshot.valid)return {status:"error",code:snapshot.code};
  var name=String(input.nombreCurso||"").trim(),duration=input.duracionHoras===undefined?null:Number(input.duracionHoras);
  if(!name)return {status:"error",code:"TRAINING_COURSE_NAME_REQUIRED"};
  if(duration!==null&&(!isFinite(duration)||duration<=0||duration>10000))return {status:"error",code:"TRAINING_COURSE_DURATION_INVALID"};
  var requirements=input.requisitos===undefined?[]:input.requisitos;
  if(typeof requirements==="string"){try{requirements=JSON.parse(requirements);}catch(_){requirements=requirements.split(",").map(function(v){return v.trim();}).filter(Boolean);}}
  if(!Array.isArray(requirements)||requirements.length>100)return {status:"error",code:"TRAINING_COURSE_REQUIREMENTS_INVALID"};
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY"};
  try{
    var id=String(input.cursoId||"").trim(),matches=snapshot.rows.map(function(row,index){return {row:row,index:index};}).filter(function(item){return id&&String(item.row[0]||"").trim()===id;});
    if(id&&matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND"};
    var now=new Date();
    if(!id){
      id="CURS-CAP-"+String(Utilities.getUuid()).replace(/-/g,"");
      if(snapshot.rows.some(function(row){return String(row[0]||"")===id;}))return {status:"error",code:"TRAINING_COURSE_ID_COLLISION"};
      if(duration===null)return {status:"error",code:"TRAINING_COURSE_DURATION_INVALID"};
      snapshot.sheet.appendRow([id,name,String(input.categoria||"General").slice(0,100),String(input.proveedorResponsable||"").slice(0,200),
        String(input.modalidad||"Presencial").slice(0,60),duration,JSON.stringify(requirements),String(input.dirigidoA||"Todos").slice(0,200),
        String(input.estado||"Activo").slice(0,40),access.actor.userId,now,""]);
    }else{
      var old=matches[0].row.slice(),next=old.slice();
      next[1]=name;next[2]=String(input.categoria===undefined?old[2]:input.categoria).slice(0,100);
      next[3]=String(input.proveedorResponsable===undefined?old[3]:input.proveedorResponsable).slice(0,200);
      next[4]=String(input.modalidad===undefined?old[4]:input.modalidad).slice(0,60);
      next[5]=duration===null?old[5]:duration;next[6]=JSON.stringify(requirements);
      next[7]=String(input.dirigidoA===undefined?old[7]:input.dirigidoA).slice(0,200);
      next[8]=String(input.estado===undefined?old[8]:input.estado).slice(0,40);next[11]=now;
      try{snapshot.sheet.getRange(matches[0].index+2,1,1,headers.length).setValues([next]);}
      catch(writeError){return {status:"error",code:"TRAINING_COURSE_WRITE_FAILED"};}
    }
    return {status:"success",cursoId:id};
  }catch(error){return {status:"error",code:"TRAINING_COURSE_WRITE_FAILED"};}
  finally{lock.releaseLock();}
}


function ensureProfessionalDevelopmentPlanWriteSheet_(ss, headers) {
  var sheet=ss&&ss.getSheetByName?ss.getSheetByName("PlanesDesarrolloProfesional"):null;
  if(!sheet){
    if(!ss||typeof ss.insertSheet!=="function")return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
    sheet=ss.insertSheet("PlanesDesarrolloProfesional");sheet.appendRow(headers);return {valid:true,sheet:sheet,rows:[]};
  }
  var values=sheet.getDataRange().getValues();
  if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(headers))return {valid:false,code:"RESOURCE_SCHEMA_INVALID"};
  return {valid:true,sheet:sheet,rows:values.slice(1)};
}

function resolveProfessionalDevelopmentPlanWriteAccess_(payload, ss, employeeId) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return {authorized:false,code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var role=normalizeVacationRole_(actor.role),target=String(employeeId||actor.userId||"").trim();
  var sheet=ss&&ss.getSheetByName?ss.getSheetByName("ExpedientesLaborales"):null;
  if(!sheet)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var values=sheet.getDataRange().getValues(),headers=values[0].map(function(v){return String(v||"").trim();});
  var idIndex=headers.indexOf("ExpedienteID"),userIndex=headers.indexOf("UserId");
  if(idIndex<0||userIndex<0)return {authorized:false,code:"RESOURCE_SCHEMA_INVALID"};
  if(role==="empleado"&&input.empleadoId&&String(input.empleadoId).trim()!==actor.userId)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  if(role!=="empleado"&&role!=="recursoshumanos")return {authorized:false,code:"ROLE_NOT_ALLOWED"};
  var matches=values.slice(1).filter(function(row){return String(row[userIndex]||"").trim()===target||String(row[idIndex]||"").trim()===target;});
  if(matches.length!==1)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var expedienteId=String(matches[0][idIndex]||"").trim();
  if(role==="empleado"&&String(matches[0][userIndex]||"").trim()!==actor.userId)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  if(role==="recursoshumanos"){
    var scope=getVerifiedAccountingDepartmentScope_(input,ss,actor);
    if(!scope||scope.valid!==true||(!scope.institutionWide&&(scope.departmentIds||[]).indexOf(String(matches[0][headers.indexOf("Departamento")]||""))===-1))return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  }
  return {authorized:true,actor:actor,role:role,employeeId:String(matches[0][userIndex]||"").trim(),expedienteId:expedienteId};
}

function manageProfessionalDevelopmentPlan(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var access=resolveProfessionalDevelopmentPlanWriteAccess_(input,ss,input.empleadoId);
  if(!access.authorized)return {status:"error",code:access.code};
  var headers=["PlanID","EmpleadoID","TituloObjetivo","Descripcion","MetasAccionesJSON","FechaInicio","FechaMeta","EstadoObjetivo","EvaluacionSeguimiento","CreadoPor","FechaCreacion","UltimaModificacion"];
  var snapshot=ensureProfessionalDevelopmentPlanWriteSheet_(ss,headers);
  if(!snapshot.valid)return {status:"error",code:snapshot.code};
  var title=String(input.tituloObjetivo||"").trim();
  if(!title)return {status:"error",code:"DEVELOPMENT_PLAN_TITLE_REQUIRED"};
  var start=input.fechaInicio?new Date(input.fechaInicio):new Date(),target=input.fechaMeta?new Date(input.fechaMeta):null;
  if(isNaN(start.getTime())||(input.fechaMeta&&(!target||isNaN(target.getTime())))||(target&&target<start))return {status:"error",code:"DEVELOPMENT_PLAN_DATE_RANGE_INVALID"};
  var goals=input.metasAcciones===undefined?[]:input.metasAcciones;
  if(typeof goals==="string"){try{goals=JSON.parse(goals);}catch(_){return {status:"error",code:"DEVELOPMENT_PLAN_GOALS_INVALID"};}}
  if(!Array.isArray(goals)||goals.length>100)return {status:"error",code:"DEVELOPMENT_PLAN_GOALS_INVALID"};
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY"};
  try{
    var id=String(input.planId||"").trim(),matches=snapshot.rows.map(function(row,index){return {row:row,index:index};}).filter(function(item){return id&&String(item.row[0]||"").trim()===id;});
    if(id&&matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND"};
    var now=new Date();
    if(!id){
      id="PLAN-"+String(Utilities.getUuid()).replace(/-/g,"");
      snapshot.sheet.appendRow([id,access.employeeId,title,String(input.descripcion||"").slice(0,2000),JSON.stringify(goals),start,target||"",
        String(input.estadoObjetivo||"EnProgreso"),access.role==="empleado"?"":String(input.evaluacionSeguimiento||"").slice(0,2000),access.actor.userId,now,""]);
    }else{
      var old=matches[0].row.slice();
      if(String(old[1]||"")!==access.employeeId)return {status:"error",code:"RESOURCE_NOT_FOUND"};
      var next=old.slice();next[2]=title;
      if(input.descripcion!==undefined)next[3]=String(input.descripcion).slice(0,2000);
      if(input.metasAcciones!==undefined)next[4]=JSON.stringify(goals);
      if(input.fechaInicio!==undefined)next[5]=start;
      if(input.fechaMeta!==undefined)next[6]=target||"";
      if(input.estadoObjetivo!==undefined)next[7]=String(input.estadoObjetivo);
      if(access.role!=="empleado"&&input.evaluacionSeguimiento!==undefined)next[8]=String(input.evaluacionSeguimiento).slice(0,2000);
      next[11]=now;
      try{snapshot.sheet.getRange(matches[0].index+2,1,1,headers.length).setValues([next]);}
      catch(writeError){return {status:"error",code:"DEVELOPMENT_PLAN_WRITE_FAILED"};}
    }
    return {status:"success",planId:id};
  }catch(error){return {status:"error",code:"DEVELOPMENT_PLAN_WRITE_FAILED"};}
  finally{lock.releaseLock();}
}

function getTrainingAnalyticsReport(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return {status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var role=normalizeVacationRole_(actor.role);
  if(["recursoshumanos","administrador"].indexOf(role)===-1)return {status:"error",code:"ROLE_NOT_ALLOWED"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),courseSheet=ss.getSheetByName("CatalogoCursosCapacitacion"),enrollmentSheet=ss.getSheetByName("InscripcionesCapacitacion");
  var courseValues=courseSheet?courseSheet.getDataRange().getValues():[],enrollmentValues=enrollmentSheet?enrollmentSheet.getDataRange().getValues():[];
  if(courseValues.length&&courseValues[0][0]!=="CursoID")return {status:"error",code:"RESOURCE_SCHEMA_INVALID"};
  if(enrollmentValues.length&&enrollmentValues[0][0]!=="InscripcionID")return {status:"error",code:"RESOURCE_SCHEMA_INVALID"};
  var employees=ss.getSheetByName("ExpedientesLaborales"),employeeValues=employees?employees.getDataRange().getValues():[],departmentByUser=Object.create(null);
  if(employeeValues.length){var h=employeeValues[0].map(function(v){return String(v||"").trim();}),u=h.indexOf("UserId"),d=h.indexOf("Departamento");employeeValues.slice(1).forEach(function(row){if(u>=0&&d>=0)departmentByUser[String(row[u]||"").trim()]=String(row[d]||"").trim();});}
  var allowedDepartments=null;
  if(role==="recursoshumanos"){
    var scope=getVerifiedAccountingDepartmentScope_(input,ss,actor);
    if(!scope||scope.valid!==true)return {status:"error",code:"RESOURCE_SCOPE_DENIED"};
    allowedDepartments=scope.institutionWide?null:(scope.departmentIds||[]).map(String);
  }
  var enrollments=enrollmentValues.slice(1).filter(function(row){
    if(!allowedDepartments)return true;
    return allowedDepartments.indexOf(departmentByUser[String(row[2]||"").trim()]||"")!==-1;
  });
  var completed=enrollments.filter(function(row){return String(row[4]||"").toLowerCase()==="finalizado";}).length;
  return {status:"success",data:{totalCursos:courseValues.length?Math.max(0,courseValues.length-1):0,totalInscripciones:enrollments.length,completados:completed}};
}


function resolveStaffAttendanceEmployeeAccess_(payload, ss, employeeId, actor) {
  var input=payload||{},identity=actor||getVerifiedAccountingIdentity_(input);
  if(!identity||identity.authorized!==true)return {authorized:false,code:identity&&identity.code||"VERIFIED_IDENTITY_REQUIRED"};
  var role=normalizeVacationRole_(identity.role),sheet=ss&&ss.getSheetByName?ss.getSheetByName("ExpedientesLaborales"):null;
  if(!sheet)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var values=sheet.getDataRange().getValues(),headers=values[0].map(function(v){return String(v||"").trim();});
  var idIndex=headers.indexOf("ExpedienteID"),userIndex=headers.indexOf("UserId"),departmentIndex=headers.indexOf("Departamento"),stateIndex=headers.indexOf("EstadoLaboral");
  if(idIndex<0||userIndex<0||departmentIndex<0||stateIndex<0)return {authorized:false,code:"RESOURCE_SCHEMA_INVALID"};
  var target=String(employeeId||"").trim();
  if(role==="empleado"&&!target)target=identity.userId;
  var matches=values.slice(1).filter(function(row){return String(row[userIndex]||"").trim()===target||String(row[idIndex]||"").trim()===target;});
  if(matches.length!==1||String(matches[0][stateIndex]||"").toLowerCase()!=="activo")return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  if(role==="empleado"&&String(matches[0][userIndex]||"").trim()!==identity.userId)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  if(role!=="empleado"&&role!=="recursoshumanos"&&role!=="administrador")return {authorized:false,code:"ROLE_NOT_ALLOWED"};
  var expedienteId=String(matches[0][idIndex]||"").trim();
  if(role!=="empleado"){
    var ownership=assertResourceOwnershipForScope_(input,ss,expedienteId);
    if(!ownership||ownership.authorized!==true)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  }
  return {authorized:true,actor:identity,role:role,employeeId:String(matches[0][userIndex]||"").trim(),
    employeeName:String(input.empleadoNombre||matches[0][headers.indexOf("PersonaId")]||"").trim(),departmentId:String(matches[0][departmentIndex]||"")};
}

function recordStaffCheckIn(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return {status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var role=normalizeVacationRole_(actor.role),type=String(input.tipoRegistro||"Entrada").trim();
  if(["Entrada","Salida"].indexOf(type)===-1)return {status:"error",code:"INVALID_ATTENDANCE_TYPE"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=resolveStaffAttendanceEmployeeAccess_(input,ss,input.empleadoId,actor);
  if(!access.authorized)return {status:"error",code:access.code};
  if(role!=="recursoshumanos"&&role!=="administrador")return {status:"error",code:"ROLE_NOT_ALLOWED"};
  var headers=["AsistenciaID","Fecha","EmpleadoId","EmpleadoNombre","HoraEntrada","HoraSalida","MinutosTardanza","EstadoAsistencia","Observaciones"];
  var sheet=ss.getSheetByName("DeduccionesAsistencia");
  if(!sheet)return {status:"error",code:"RESOURCE_SCHEMA_INVALID"};
  var values=sheet.getDataRange().getValues();
  if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(headers))return {status:"error",code:"RESOURCE_SCHEMA_INVALID"};
  var now=new Date(),date=now.toISOString().slice(0,10),time=now.toTimeString().slice(0,5);
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY"};
  try{
    var rows=values.slice(1),today=rows.map(function(row,index){return {row:row,index:index};}).filter(function(item){
      return String(item.row[1]||"").slice(0,10)===date&&String(item.row[2]||"").trim()===access.employeeId;
    });
    if(today.length>1)return {status:"error",code:"RESOURCE_SCHEMA_INVALID"};
    if(type==="Entrada"){
      if(today.length)return {status:"error",code:"ATTENDANCE_ALREADY_RECORDED"};
      var id="AST-"+String(Utilities.getUuid());
      if(rows.some(function(row){return String(row[0]||"")===id;}))return {status:"error",code:"ATTENDANCE_ID_COLLISION"};
      sheet.appendRow([id,date,access.employeeId,String(input.empleadoNombre||access.employeeName||access.employeeId).slice(0,180),
        time,"",0,"EnJornada",String(input.observaciones||"").slice(0,500)]);
      return {status:"success",asistenciaId:id};
    }
    if(!today.length||!String(today[0].row[4]||"").trim())return {status:"error",code:"ATTENDANCE_ENTRY_REQUIRED"};
    if(String(today[0].row[5]||"").trim())return {status:"error",code:"ATTENDANCE_ALREADY_RECORDED"};
    var next=today[0].row.slice();next[5]=time;next[7]="JornadaCompleta";
    try{sheet.getRange(today[0].index+2,1,1,headers.length).setValues([next]);}
    catch(writeError){return {status:"error",code:"ATTENDANCE_WRITE_FAILED"};}
    return {status:"success",asistenciaId:next[0]};
  }finally{lock.releaseLock();}
}

function recordStaffAttendance(payload) {
  return recordStaffCheckIn(payload);
}

function getStaffAttendanceLogs(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return {status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED",asistencias:[]};
  var role=normalizeVacationRole_(actor.role);
  if(["recursoshumanos","administrador","empleado"].indexOf(role)===-1)return {status:"error",code:"ROLE_NOT_ALLOWED",asistencias:[]};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=ss.getSheetByName("DeduccionesAsistencia");
  if(!sheet)return {status:"success",asistencias:[]};
  var values=sheet.getDataRange().getValues(),headers=values[0].map(function(v){return String(v||"").trim();});
  var required=["AsistenciaID","Fecha","EmpleadoId","EmpleadoNombre","HoraEntrada","HoraSalida","MinutosTardanza","EstadoAsistencia","Observaciones"];
  if(JSON.stringify(headers)!==JSON.stringify(required))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",asistencias:[]};
  var start=input.fechaInicio?new Date(input.fechaInicio):null,end=input.fechaFin?new Date(input.fechaFin):null;
  if((start&&isNaN(start.getTime()))||(end&&isNaN(end.getTime()))||(start&&end&&end<start))return {status:"error",code:"INVALID_DATE_RANGE",asistencias:[]};
  var allowed=null;
  if(role==="recursoshumanos"){
    var scope=getVerifiedAccountingDepartmentScope_(input,ss,actor);
    if(!scope||scope.valid!==true)return {status:"error",code:scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED",asistencias:[]};
    allowed=scope.institutionWide?null:(scope.departmentIds||[]).map(String);
  }
  var employeeSheet=ss.getSheetByName("ExpedientesLaborales"),employeeValues=employeeSheet?employeeSheet.getDataRange().getValues():[];
  var eh=employeeValues.length?employeeValues[0].map(function(v){return String(v||"").trim();}):[],ui=eh.indexOf("UserId"),di=eh.indexOf("Departamento"),departments=Object.create(null);
  employeeValues.slice(1).forEach(function(row){if(ui>=0&&di>=0)departments[String(row[ui]||"").trim()]=String(row[di]||"").trim();});
  var requested=String(input.empleadoId||"").trim();
  if(role==="recursoshumanos"&&requested&&(!departments[requested]||(allowed&&allowed.indexOf(departments[requested])===-1)))return {status:"error",code:"RESOURCE_NOT_FOUND",asistencias:[]};
  if(role==="empleado"&&requested&&requested!==actor.userId)return {status:"error",code:"RESOURCE_NOT_FOUND",asistencias:[]};
  if(role==="empleado")requested=actor.userId;
  var result=values.slice(1).filter(function(row){
    var employee=String(row[2]||"").trim(),date=new Date(row[1]);
    if(requested&&employee!==requested)return false;
    if(role==="recursoshumanos"&&allowed&&allowed.indexOf(departments[employee]||"")===-1)return false;
    if(start&&date<start)return false;
    if(end&&date>end)return false;
    return true;
  }).map(function(row){return {asistenciaId:row[0],fecha:row[1],empleadoId:row[2],empleadoNombre:row[3],horaEntrada:row[4],horaSalida:row[5],minutosTardanza:row[6],estadoAsistencia:row[7],observaciones:row[8]};});
  if(role==="recursoshumanos"&&requested&&!result.length&&departments[requested]===undefined)return {status:"error",code:"RESOURCE_NOT_FOUND",asistencias:[]};
  return {status:"success",asistencias:result};
}


function resolveAttendanceCorrectionEmployeeAccess_(payload, ss, attendanceId, requestedEmployeeId, actor) {
  var input = payload || {}, identity = actor || getVerifiedAccountingIdentity_(input);
  if (!identity || identity.authorized !== true) return { authorized: false, code: identity && identity.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = String(identity.role || "").trim().toLowerCase().replace(/\s+/g, "");
  if (["empleado","recursoshumanos","administrador"].indexOf(role) === -1) return { authorized: false, code: "ROLE_NOT_ALLOWED" };
  var attendanceSheet = ss && ss.getSheetByName ? ss.getSheetByName("DeduccionesAsistencia") : null;
  if (!attendanceSheet) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var attendanceValues = attendanceSheet.getDataRange().getValues();
  var attendanceHeaders = ["AsistenciaID","Fecha","EmpleadoId","EmpleadoNombre","HoraEntrada","HoraSalida","MinutosTardanza","EstadoAsistencia","Observaciones"];
  if (!attendanceValues || !attendanceValues.length ||
      JSON.stringify(attendanceValues[0].map(function(value) { return String(value || "").trim(); })) !== JSON.stringify(attendanceHeaders)) {
    return { authorized: false, code: "RESOURCE_SCHEMA_INVALID" };
  }
  var attendanceIdValue = String(attendanceId || "").trim();
  var attendanceMatches = attendanceValues.slice(1).map(function(row, index) { return { row: row, index: index }; })
    .filter(function(item) { return String(item.row[0] || "").trim() === attendanceIdValue; });
  if (!attendanceIdValue || attendanceMatches.length !== 1) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var attendance = attendanceMatches[0], employeeUserId = String(attendance.row[2] || "").trim();
  if (!employeeUserId || (role === "empleado" && employeeUserId !== String(identity.userId || "").trim())) {
    return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  }
  if (role !== "empleado" && requestedEmployeeId && String(requestedEmployeeId).trim() !== employeeUserId) {
    return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  }
  var employeeSheet = ss.getSheetByName("ExpedientesLaborales");
  if (!employeeSheet) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  var employeeValues = employeeSheet.getDataRange().getValues();
  if (!employeeValues || !employeeValues.length) return { authorized: false, code: "RESOURCE_SCHEMA_INVALID" };
  var employeeHeaders = employeeValues[0].map(function(value) { return String(value || "").trim(); });
  var userIndex = employeeHeaders.indexOf("UserId"), expedienteIndex = employeeHeaders.indexOf("ExpedienteID");
  var departmentIndex = employeeHeaders.indexOf("Departamento"), stateIndex = employeeHeaders.indexOf("EstadoLaboral");
  if (userIndex < 0 || expedienteIndex < 0 || departmentIndex < 0 || stateIndex < 0) {
    return { authorized: false, code: "RESOURCE_SCHEMA_INVALID" };
  }
  var employees = employeeValues.slice(1).map(function(row, index) { return { row: row, index: index }; })
    .filter(function(item) { return String(item.row[userIndex] || "").trim() === employeeUserId; });
  if (employees.length !== 1 || String(employees[0].row[stateIndex] || "").trim().toLowerCase() !== "activo") {
    return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  }
  var employee = employees[0], expedienteId = String(employee.row[expedienteIndex] || "").trim();
  if (!expedienteId) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  if (role !== "empleado") {
    var scope = getVerifiedAccountingDepartmentScope_(input, ss, identity);
    if (!scope || (scope.valid !== true && scope.authorized !== true)) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
    var ownership = assertResourceOwnershipForScope_(ss, scope, "EXPEDIENTE_LABORAL", expedienteId, "WRITE");
    if (!ownership || ownership.authorized !== true) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
  }
  return { authorized: true, actor: identity, role: role, employeeId: employeeUserId, expedienteId: expedienteId,
    departmentId: String(employee.row[departmentIndex] || "").trim(), employeeRow: employee.row.slice(),
    attendanceSheet: attendanceSheet, attendanceRow: attendance.row.slice(), attendanceIndex: attendance.index };
}

function submitAttendanceCorrection(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), attendanceId = String(input.asistenciaId || "").trim();
  var access = resolveAttendanceCorrectionEmployeeAccess_(input, ss, attendanceId, input.empleadoId, actor);
  if (!access.authorized) return { status: "error", code: access.code };
  var reason = String(input.motivo || "").trim(), requestedTime = String(input.horaSolicitada || "").trim();
  var originalTime = String(input.horaOriginal || "").trim();
  var timeValid = function(value) { return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value); };
  if (!reason || reason.length > 500 || !timeValid(requestedTime) || !timeValid(originalTime) || requestedTime === originalTime) {
    return { status: "error", code: "ATTENDANCE_CORRECTION_DATA_INVALID" };
  }
  var evidenceUrl = String(input.evidenciaUrl || "").trim();
  var unsafeEvidenceCharacters = [" ", "\t", "\r", "\n", "<", ">"];
  if (evidenceUrl && (evidenceUrl.indexOf("https://") !== 0 || unsafeEvidenceCharacters.some(function(character) {
    return evidenceUrl.indexOf(character) !== -1;
  }))) {
    return { status: "error", code: "EVIDENCE_URL_INVALID" };
  }
  var incidentDate = String(input.fechaIncidencia || access.attendanceRow[1] || "").slice(0, 10);
  var dateParts = incidentDate.split("-");
  var incidentDateValid = dateParts.length === 3 && dateParts[0].length === 4 &&
    dateParts[1].length === 2 && dateParts[2].length === 2 &&
    dateParts.every(function(part) { return part.split("").every(function(character) {
      return character >= "0" && character <= "9";
    }); });
  if (!incidentDateValid || incidentDate !== String(access.attendanceRow[1] || "").slice(0, 10)) {
    return { status: "error", code: "ATTENDANCE_CORRECTION_DATA_INVALID" };
  }
  var entryMatches = String(access.attendanceRow[4] || "").trim() === originalTime;
  var exitMatches = String(access.attendanceRow[5] || "").trim() === originalTime;
  if (entryMatches === exitMatches) return { status: "error", code: "ATTENDANCE_CORRECTION_TIME_CONFLICT" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    access = resolveAttendanceCorrectionEmployeeAccess_(input, ss, attendanceId, input.empleadoId, actor);
    if (!access.authorized) return { status: "error", code: access.code };
    var headers = ["CorreccionID","AsistenciaID","EmpleadoId","FechaIncidencia","HoraOriginal","HoraSolicitada","Motivo","EvidenciaUrl","EstadoAprobacion","AprobadoPor","Observaciones"];
    var sheet = getOrCreateSheet(ss, "CorreccionesAsistencia");
    var values = sheet.getDataRange().getValues();
    if (!values || !values.length) { sheet.appendRow(headers); values = [headers]; }
    if (JSON.stringify(values[0].map(function(value) { return String(value || "").trim(); })) !== JSON.stringify(headers)) {
      return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
    }
    var pending = values.slice(1).filter(function(row) {
      return String(row[1] || "").trim() === attendanceId && String(row[4] || "").trim() === originalTime &&
        String(row[8] || "").trim().toLowerCase() === "pendiente";
    });
    if (pending.length) return { status: "error", code: "ATTENDANCE_CORRECTION_ALREADY_PENDING" };
    var correctionId = "CORR-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
    if (values.slice(1).some(function(row) { return String(row[0] || "").trim() === correctionId; })) {
      return { status: "error", code: "ATTENDANCE_CORRECTION_ID_COLLISION" };
    }
    sheet.appendRow([correctionId, attendanceId, access.employeeId, incidentDate, originalTime, requestedTime,
      reason, evidenceUrl, "Pendiente", "", ""]);
    return { status: "success", correccionId: correctionId, estadoAprobacion: "Pendiente" };
  } catch (error) {
    return { status: "error", code: "ATTENDANCE_CORRECTION_WRITE_FAILED" };
  } finally { lock.releaseLock(); }
}

function reviewAttendanceCorrection(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = String(actor.role || "").trim().toLowerCase().replace(/\s+/g, "");
  if (["recursoshumanos","administrador"].indexOf(role) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var newState = String(input.nuevoEstado || "").trim();
  if (["Aprobado","Rechazado"].indexOf(newState) === -1) return { status: "error", code: "ATTENDANCE_CORRECTION_STATE_INVALID" };
  var correctionId = String(input.correccionId || "").trim();
  if (!correctionId) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var headers = ["CorreccionID","AsistenciaID","EmpleadoId","FechaIncidencia","HoraOriginal","HoraSolicitada","Motivo","EvidenciaUrl","EstadoAprobacion","AprobadoPor","Observaciones"];
    var sheet = getOrCreateSheet(ss, "CorreccionesAsistencia"), values = sheet.getDataRange().getValues();
    if (!values || !values.length || JSON.stringify(values[0].map(function(value) { return String(value || "").trim(); })) !== JSON.stringify(headers)) {
      return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
    }
    var matches = values.slice(1).map(function(row, index) { return { row: row, index: index }; })
      .filter(function(item) { return String(item.row[0] || "").trim() === correctionId; });
    if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var correction = matches[0], row = correction.row.slice();
    if (String(row[8] || "").trim() !== "Pendiente") return { status: "error", code: "ATTENDANCE_CORRECTION_ALREADY_REVIEWED" };
    var access = resolveAttendanceCorrectionEmployeeAccess_(input, ss, row[1], row[2], actor);
    if (!access.authorized) return { status: "error", code: access.code };
    if (String(row[3] || "").slice(0, 10) !== String(access.attendanceRow[1] || "").slice(0, 10)) {
      return { status: "error", code: "ATTENDANCE_CORRECTION_DATA_INVALID" };
    }
    var attendanceBefore = access.attendanceRow.slice(), attendanceAfter = attendanceBefore.slice(), changedAttendance = false;
    if (newState === "Aprobado") {
      var original = String(row[4] || "").trim(), replacement = String(row[5] || "").trim();
      var isEntry = String(attendanceBefore[4] || "").trim() === original;
      var isExit = String(attendanceBefore[5] || "").trim() === original;
      if (isEntry === isExit || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(replacement)) {
        return { status: "error", code: "ATTENDANCE_CORRECTION_DATA_INVALID" };
      }
      attendanceAfter[isEntry ? 4 : 5] = replacement;
      try {
        access.attendanceSheet.getRange(access.attendanceIndex + 2, 1, 1, attendanceAfter.length).setValues([attendanceAfter]);
        changedAttendance = true;
      } catch (attendanceWriteError) {
        return { status: "error", code: "ATTENDANCE_CORRECTION_WRITE_FAILED" };
      }
    }
    row[8] = newState;
    row[9] = actor.userId;
    row[10] = String(input.observaciones || "").trim().slice(0, 500);
    try {
      sheet.getRange(correction.index + 2, 1, 1, headers.length).setValues([row]);
    } catch (correctionWriteError) {
      if (changedAttendance) {
        try {
          access.attendanceSheet.getRange(access.attendanceIndex + 2, 1, 1, attendanceBefore.length).setValues([attendanceBefore]);
        } catch (rollbackError) {
          return { status: "error", code: "ATTENDANCE_CORRECTION_ROLLBACK_FAILED" };
        }
      }
      return { status: "error", code: "ATTENDANCE_CORRECTION_WRITE_FAILED" };
    }
    return { status: "success", correccionId: correctionId, estadoAprobacion: newState };
  } catch (error) {
    return { status: "error", code: "ATTENDANCE_CORRECTION_WRITE_FAILED" };
  } finally { lock.releaseLock(); }
}

function resolveEmployeeLoanAdvanceAccess_(payload,ss,targetUserId,requireManager){
 const actor=getVerifiedAccountingIdentity_(payload);if(!actor.authorized)return actor;
 const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
 const self=["EMPLEADO","TRABAJADOR","PERSONAL"].includes(role),manager=["RECURSOSHUMANOS","ADMINISTRADOR"].includes(role);
 if(requireManager?!manager:(!self&&!manager))return {authorized:false,code:"ROLE_NOT_ALLOWED"};
 const userId=self?actor.userId:String(targetUserId||actor.userId||"").trim();
 if(!userId||(self&&targetUserId&&String(targetUserId).trim()!==actor.userId))return {authorized:false,code:"RESOURCE_NOT_FOUND"};
 const sh=ss.getSheetByName("ExpedientesLaborales");if(!sh)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
 const v=sh.getDataRange().getValues(),h=["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"];
 if(!v.length||!Array.isArray(v[0])||v[0].length!==h.length||h.some((x,i)=>String(v[0][i]||"").trim().toUpperCase()!==x.toUpperCase()))return {authorized:false,code:"RESOURCE_SCHEMA_INVALID"};
 const rows=v.slice(1),matches=rows.filter(r=>Array.isArray(r)&&String(r[2]||"").trim()===userId);
 if(matches.length!==1||matches[0].length!==h.length)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
 const expedienteId=String(matches[0][0]||"").trim();
 if(!expedienteId||rows.filter(r=>Array.isArray(r)&&String(r[0]||"").trim()===expedienteId).length!==1||!["ACTIVO","ACTIVE"].includes(String(matches[0][8]||"").trim().toUpperCase()))return {authorized:false,code:"RESOURCE_NOT_FOUND"};
 if(self)return {authorized:true,actor,userId,expedienteId,accessType:"SELF"};
 const scope=getVerifiedAccountingDepartmentScope_(payload,ss,actor);if(!scope.authorized)return {authorized:false,code:scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED"};
 const ownership=assertResourceOwnershipForScope_(ss,scope,"EXPEDIENTE_LABORAL",expedienteId,"WRITE",payload);
 return ownership.authorized?{authorized:true,actor,userId,expedienteId,departmentId:ownership.departmentId}:{authorized:false,code:"RESOURCE_NOT_FOUND"};
}
function requestEmployeeLoanAdvance(payload){
 const p=payload||{},actor=getVerifiedAccountingIdentity_(p);if(!actor.authorized)return {status:"error",code:actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
 const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,""),self=["EMPLEADO","TRABAJADOR","PERSONAL"].includes(role),target=self?actor.userId:String(p.empleadoId||actor.userId||"").trim();
 const amount=Number(p.montoSolicitado),terms=p.plazoCuotas==null||p.plazoCuotas===""?1:Number(p.plazoCuotas);
 if(!Number.isFinite(amount)||amount<=0||!Number.isInteger(terms)||terms<1||terms>120)return {status:"error",code:"LOAN_REQUEST_VALUES_INVALID",message:"El monto y el plazo de cuotas deben ser válidos."};
 const safe=(v,n)=>{let x=String(v||"").trim().slice(0,n);return /^[=+@-]/.test(x)?"'"+x:x;},type=safe(p.tipo||"AnticipoSalario",80),reason=safe(p.motivo||p.observaciones||"Solicitud formal de anticipo/préstamo",500);
 if(!type)return {status:"error",code:"LOAN_REQUEST_VALUES_INVALID",message:"El tipo de solicitud no es válido."};
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),pre=resolveEmployeeLoanAdvanceAccess_(p,ss,target,false);
 if(!pre.authorized)return {status:"error",code:pre.code||"RESOURCE_NOT_FOUND",message:"No existe un expediente laboral disponible."};
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La operación está ocupada. Intente nuevamente."};
 try{
  if(!resolveEmployeeLoanAdvanceAccess_(Object.assign({},p),ss,target,false).authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"No existe un expediente laboral disponible."};
  const h=["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],sh=ss.getSheetByName("AnticiposPrestamosEmpleado")||getOrCreateSheet(ss,"AnticiposPrestamosEmpleado");
  let v=sh.getDataRange().getValues();if(!v.length||!Array.isArray(v[0])||!v[0].length){sh.appendRow(h);v=[h];}
  if(v[0].length!==h.length||h.some((x,i)=>String(v[0][i]||"").trim().toUpperCase()!==x.toUpperCase()))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de anticipos y préstamos no es válida."};
  const id="ADV-"+Utilities.getUuid();if(v.slice(1).some(r=>String(r[0]||"").trim()===id))return {status:"error",code:"LOAN_ID_COLLISION",message:"No fue posible registrar la solicitud."};
  const rounded=Math.round(amount*100)/100,monthly=Math.round(rounded/terms*100)/100;
  sh.appendRow([id,new Date(),target,type,rounded,0,terms,monthly,rounded,"PendienteAprobacion","",reason]);
  return {status:"success",prestamoId:id,montoSolicitado:rounded,cuotaEstimada:monthly,estadoAprobacion:"PendienteAprobacion",message:"Solicitud de anticipo / préstamo registrada y enviada a revisión."};
 }catch(e){return {status:"error",code:"LOAN_REQUEST_WRITE_FAILED",message:"No fue posible registrar la solicitud."};}finally{lock.releaseLock();}
}
function approveEmployeeLoanAdvance(payload){
 const p=payload||{},actor=getVerifiedAccountingIdentity_(p);if(!actor.authorized)return {status:"error",code:actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
 const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
 if(!["RECURSOSHUMANOS","ADMINISTRADOR"].includes(role))return {status:"error",code:"ROLE_NOT_ALLOWED",message:"Acceso denegado."};
 const id=String(p.prestamoId||"").trim(),status=String(p.nuevoEstado||"").trim().toUpperCase();
 if(!id||!["APROBADO","RECHAZADO"].includes(status))return {status:"error",code:"LOAN_REVIEW_INVALID",message:"La solicitud y el estado de revisión son obligatorios."};
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName("AnticiposPrestamosEmpleado");if(!sh)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Solicitud de préstamo no disponible."};
 const h=["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],initial=sh.getDataRange().getValues();
 if(!initial.length||!Array.isArray(initial[0])||initial[0].length!==h.length||h.some((x,i)=>String(initial[0][i]||"").trim().toUpperCase()!==x.toUpperCase()))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de anticipos y préstamos no es válida."};
 const found=initial.slice(1).map((r,i)=>({r,i:i+1})).filter(x=>String(x.r[0]||"").trim()===id);
 if(found.length!==1||found[0].r.length!==h.length)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Solicitud de préstamo no disponible."};
 const target=String(found[0].r[2]||"").trim();if(!resolveEmployeeLoanAdvanceAccess_(p,ss,target,true).authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Solicitud de préstamo no disponible."};
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La operación está ocupada. Intente nuevamente."};
 try{
  if(!resolveEmployeeLoanAdvanceAccess_(Object.assign({},p),ss,target,true).authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Solicitud de préstamo no disponible."};
  const data=sh.getDataRange().getValues(),matches=data.slice(1).map((r,i)=>({r,i:i+1})).filter(x=>String(x.r[0]||"").trim()===id);
  if(matches.length!==1||matches[0].r.length!==h.length)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Solicitud de préstamo no disponible."};
  const row=matches[0].r.slice(),rowIndex=matches[0].i;if(String(row[9]||"").trim().toUpperCase()!=="PENDIENTEAPROBACION")return {status:"error",code:"LOAN_ALREADY_REVIEWED",message:"La solicitud ya fue revisada."};
  const requested=Number(row[4]),terms=Number(row[6]);if(!Number.isFinite(requested)||requested<=0||!Number.isInteger(terms)||terms<1||terms>120)return {status:"error",code:"LOAN_DATA_INVALID",message:"Los datos de la solicitud no son válidos."};
  let approved=0;if(status==="APROBADO"){approved=p.montoAprobado==null||p.montoAprobado===""?requested:Number(p.montoAprobado);if(!Number.isFinite(approved)||approved<=0||approved>requested)return {status:"error",code:"LOAN_APPROVED_AMOUNT_INVALID",message:"El monto aprobado debe ser positivo y no superar el solicitado."};approved=Math.round(approved*100)/100;}
  const safe=v=>{let x=String(v||"").trim().slice(0,500);return /^[=+@-]/.test(x)?"'"+x:x;},updated=row.slice();
  updated[5]=approved;updated[7]=status==="APROBADO"?Math.round(approved/terms*100)/100:0;updated[8]=approved;updated[9]=status==="APROBADO"?"Aprobado":"Rechazado";updated[10]=actor.userId;updated[11]=p.observaciones==null?String(row[11]||""):safe(p.observaciones);
  sh.getRange(rowIndex+1,1,1,updated.length).setValues([updated]);
  return {status:"success",prestamoId:id,montoAprobado:approved,estadoAprobacion:updated[9],message:"Solicitud de anticipo / préstamo "+updated[9].toLowerCase()+"."};
 }catch(e){return {status:"error",code:"LOAN_REVIEW_WRITE_FAILED",message:"No fue posible completar la revisión."};}finally{lock.releaseLock();}
}

function computeDocumentSHA256(contentOrBase64) {
  if (contentOrBase64 === null || contentOrBase64 === undefined || contentOrBase64 === "") return "";
  var rawBytes;
  if (Array.isArray(contentOrBase64)) rawBytes = contentOrBase64.slice();
  else if (typeof Uint8Array !== "undefined" && contentOrBase64 instanceof Uint8Array) {
    rawBytes = Array.from(contentOrBase64).map(function(value) { return value > 127 ? value - 256 : value; });
  } else if (typeof Utilities !== "undefined" && Utilities.computeDigest) {
    if (typeof contentOrBase64 === "string" && /^data:[^,]*;base64,/i.test(contentOrBase64)) {
      rawBytes = Utilities.base64Decode(contentOrBase64.slice(contentOrBase64.indexOf(",") + 1));
    } else if (typeof contentOrBase64 === "string") rawBytes = Utilities.newBlob(contentOrBase64).getBytes();
    else throw new Error("DOCUMENT_HASH_INPUT_UNSUPPORTED");
  } else throw new Error("DOCUMENT_HASH_PROVIDER_UNAVAILABLE");
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawBytes)
    .map(function(value) { return ("0" + (value & 255).toString(16)).slice(-2); }).join("");
}

function getOrCreatePrivateAttachmentFolder_(folderName) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error("ATTACHMENT_FOLDER_LOCK_TIMEOUT");
  try {
    var root = DriveApp.getRootFolder(), folders = root.getFoldersByName(folderName);
    var exists = folders.hasNext(), folder = exists ? folders.next() : root.createFolder(folderName);
    if (exists) {
      if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error("ATTACHMENT_FOLDER_NOT_PRIVATE");
    } else {
      try {
        folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
        if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error("ATTACHMENT_FOLDER_NOT_PRIVATE");
      } catch (error) {
        try { folder.setTrashed(true); } catch (_) {}
        throw new Error("ATTACHMENT_FOLDER_PRIVATE_SETUP_FAILED");
      }
    }
    return folder;
  } finally { lock.releaseLock(); }
}

function rollbackPrivatePaymentAttachment_(file) {
  if (!file) return;
  try { file.setTrashed(true); }
  catch (error) {
    try { logStructuredEvent("ACCOUNTING", "paymentVoucher", "ERROR", "PAYMENT_ATTACHMENT_ORPHAN_REQUIRES_RECOVERY",
      "No fue posible retirar un archivo de comprobante sin registro asociado.",
      { fileId: file.getId ? file.getId() : "", reason: String(error && error.message || error) }, "SYSTEM"); } catch (_) {}
  }
}

function createPrivatePaymentAttachment_(fileData, fileName) {
  var validation = validateFileBinaryIntegrity(fileData, fileName, { maxSizeBytes: 10 * 1024 * 1024, allowedExtensions: [".pdf"] });
  var base64 = fileData.indexOf(",") >= 0 ? fileData.slice(fileData.indexOf(",") + 1) : fileData;
  var bytes = Utilities.base64Decode(base64);
  if (!bytes || bytes.length !== validation.byteLength || bytes.length > 10 * 1024 * 1024) throw new Error("ATTACHMENT_SIZE_MISMATCH");
  var folder = getOrCreatePrivateAttachmentFolder_("IMA_ACCOUNTING_PAYMENT_VOUCHERS_PRIVATE");
  var file = folder.createFile(Utilities.newBlob(bytes, validation.mimeType, fileName.trim()));
  try {
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error("ATTACHMENT_FILE_NOT_PRIVATE");
    return file;
  } catch (error) {
    rollbackPrivatePaymentAttachment_(file);
    throw new Error("ATTACHMENT_STORAGE_PRIVATE_FAILED");
  }
}

function createPrivatePaymentAttachmentWithIntegrity_(fileData, fileName) {
  var file = createPrivatePaymentAttachment_(fileData, fileName);
  try {
    var base64 = fileData.indexOf(",") >= 0 ? fileData.slice(fileData.indexOf(",") + 1) : fileData;
    var sourceBytes = Utilities.base64Decode(base64), storedBlob = file.getBlob(), storedBytes = storedBlob.getBytes();
    var sourceHash = computeDocumentSHA256(sourceBytes).toLowerCase();
    var storedHash = computeDocumentSHA256(storedBytes).toLowerCase();
    var validation = validateFileBinaryIntegrity(fileData, fileName, { maxSizeBytes: 10 * 1024 * 1024, allowedExtensions: [".pdf"] });
    var storedMime = String(storedBlob.getContentType() || file.getMimeType() || "").toLowerCase();
    if (!storedBytes || storedBytes.length !== sourceBytes.length || storedHash !== sourceHash) {
      throw new Error("ATTACHMENT_STORAGE_INTEGRITY_MISMATCH");
    }
    if (storedBytes.length !== validation.byteLength || (storedMime && storedMime !== validation.mimeType)) {
      throw new Error("ATTACHMENT_STORAGE_METADATA_MISMATCH");
    }
    if (file.isTrashed() || file.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error("ATTACHMENT_FILE_NOT_PRIVATE");
    return { file: file, fileId: file.getId(), sha256: storedHash, version: 1,
      sizeBytes: storedBytes.length, mimeType: validation.mimeType, receivedAt: new Date().toISOString(),
      integrityStatus: "VERIFICADO" };
  } catch (error) {
    rollbackPrivatePaymentAttachment_(file);
    throw new Error(error.message || "ATTACHMENT_STORAGE_INTEGRITY_FAILED");
  }
}

function ensurePaymentVoucherEvidenceSchema_(ss) {
  var sheet = getOrCreateSheet(ss, "ComprobantesPago");
  var headers = ["ComprobanteID","Fecha","UserId","Alumno","CargoID","MontoReportado","MetodoPago","Referencia",
    "ComprobanteUrl","Estado","Observaciones","AprobadoPor","SolicitudID","EvidenciaID","DriveFileID","NombreOriginal",
    "EsVersionActual","EstadoIntegridad","SHA256","VersionNumero","SizeBytes","MimeType","FechaRecepcion",
    "DecisionIntegrityWarning","DecisionHash","DecisionState","ComprobanteGrupoID","DecisionActor","DecisionDate"];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers.slice());
  var current = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(function(value) { return String(value || "").trim(); });
  headers.forEach(function(header) {
    if (current.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      current.push(header);
    }
  });
  var map = {};
  current.forEach(function(header, index) {
    if (!header) return;
    if (Object.prototype.hasOwnProperty.call(map, header)) throw new Error("PAYMENT_VOUCHER_SCHEMA_DUPLICATE_HEADER");
    map[header] = index;
  });
  headers.forEach(function(header) { if (map[header] === undefined) throw new Error("PAYMENT_VOUCHER_SCHEMA_INVALID"); });
  return { sheet: sheet, map: map, headers: headers };
}

function getAccountingEvidenceIntegrityPolicy_(ss) {
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("ConfiguracionInstitucional") : null;
  if (!sheet || sheet.getLastRow() < 2) return "ESTRICTO_BLOQUEAR_ACCESO_Y_NOTIFICAR_AUDITORIA";
  var rows = sheet.getDataRange().getValues();
  var headers = (rows[0] || []).map(function(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); });
  var keyIndex = headers.indexOf("clave") >= 0 ? headers.indexOf("clave") : headers.indexOf("parametro");
  var valueIndex = headers.indexOf("valor"), stateIndex = headers.indexOf("estado");
  if (keyIndex < 0 || valueIndex < 0 || stateIndex < 0) return "ESTRICTO_BLOQUEAR_ACCESO_Y_NOTIFICAR_AUDITORIA";
  var matches = rows.slice(1).filter(function(row) { return String(row[keyIndex] || "").trim() === "BLOQUEO_AUTOMATICO_POR_DISCREPANCIA_HASH"; });
  if (matches.length > 1) throw new Error("EVIDENCE_POLICY_AMBIGUOUS");
  if (!matches.length || ["ACTIVO","ACTIVE","HABILITADO","SI","TRUE"].indexOf(String(matches[0][stateIndex] || "").trim().toUpperCase()) === -1) {
    return "ESTRICTO_BLOQUEAR_ACCESO_Y_NOTIFICAR_AUDITORIA";
  }
  var value = String(matches[0][valueIndex] || "").trim().toUpperCase();
  if (["ESTRICTO_BLOQUEAR_ACCESO_Y_NOTIFICAR_AUDITORIA","ADVERTENCIA_VISUAL_REVISOR"].indexOf(value) === -1) {
    throw new Error("EVIDENCE_POLICY_INVALID");
  }
  return value;
}

function extractDriveFileId(value) {
  var raw = String(value || "").trim();
  if (!raw) return "";
  var match = raw.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/);
  return match ? match[1] : (/^[A-Za-z0-9_-]{10,}$/.test(raw) ? raw : "");
}

function paymentVoucherRowObject_(row, map) {
  var record = {};
  Object.keys(map).forEach(function(key) { record[key] = row[map[key]]; });
  return record;
}

function verifyPaymentVoucherEvidence_(ss, record, operation, actor) {
  var expectedHash = String(record.SHA256 || "").trim().toLowerCase();
  var expectedSize = Number(record.SizeBytes || 0), version = Number(record.VersionNumero || 0);
  var fileId = extractDriveFileId(record.DriveFileID || record.ComprobanteUrl);
  if (!/^[a-f0-9]{64}$/.test(expectedHash) || expectedSize < 1 || version < 1 || !fileId) {
    return { status: "error", code: "EVIDENCE_INTEGRITY_METADATA_INVALID", integrityVerified: false };
  }
  try {
    var file = DriveApp.getFileById(fileId);
    if (!file || file.isTrashed() || file.getSharingAccess() !== DriveApp.Access.PRIVATE ||
        String(file.getName() || "") !== String(record.NombreOriginal || "")) {
      throw new Error("EVIDENCE_TAMPERING_DETECTED");
    }
    var blob = file.getBlob(), bytes = blob.getBytes();
    var actualMime = String(blob.getContentType() || file.getMimeType() || "").trim().toLowerCase();
    var expectedMime = String(record.MimeType || "").trim().toLowerCase();
    var actualHash = computeDocumentSHA256(bytes).toLowerCase();
    var validation = validateFileBinaryIntegrity(Utilities.base64Encode(bytes), String(record.NombreOriginal || "voucher.pdf"), {
      maxSizeBytes: 10 * 1024 * 1024, allowedExtensions: [".pdf"]
    });
    if (!bytes || bytes.length !== expectedSize || actualMime !== expectedMime ||
        validation.mimeType !== expectedMime || actualHash !== expectedHash) throw new Error("EVIDENCE_TAMPERING_DETECTED");
    return { status: "success", integrityVerified: true, integrityStatus: "VERIFICADO",
      sha256Actual: actualHash, sha256: actualHash, versionNumero: version, sizeBytes: bytes.length,
      mimeType: actualMime, file: file, bytes: bytes };
  } catch (error) {
    var actual = "";
    try {
      var currentFile = DriveApp.getFileById(fileId);
      actual = computeDocumentSHA256(currentFile.getBlob().getBytes()).toLowerCase();
    } catch (_) {}
    try { logStructuredEvent("ACCOUNTING", operation || "verifyPaymentVoucherEvidence", "ERROR", "EVIDENCE_TAMPERING_DETECTED",
      "La evidencia binaria del comprobante difiere del archivo recibido.",
      { comprobanteId: String(record.ComprobanteID || ""), expectedSHA256: expectedHash, actualSHA256: actual,
        versionNumero: version }, actor || "SYSTEM"); } catch (_) {}
    var policy = getAccountingEvidenceIntegrityPolicy_(ss);
    if (policy === "ADVERTENCIA_VISUAL_REVISOR") {
      return { status: "warning", code: "EVIDENCE_TAMPERING_DETECTED", integrityVerified: false,
        integrityWarning: true, integrityPolicy: policy, sha256Actual: actual };
    }
    return { status: "error", code: "EVIDENCE_TAMPERING_DETECTED", integrityVerified: false, integrityPolicy: policy };
  }
}

function assertPaymentVoucherOwnerAccess_(payload,targetUserId,options) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return{authorized:false,code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),role=normalizeVacationRole_(actor.role),target=String(targetUserId||"").trim();
  var staffRoles=["secretaria","administrador","director","subdirector","recursoshumanos"];
  var requireStaff=options&&options.requireStaff===true;
  if(requireStaff&&staffRoles.indexOf(role)===-1)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
  if(["estudiante","alumno"].indexOf(role)!==-1){
    if(requireStaff)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    return target&&target===String(actor.userId||"")?{authorized:true,actor:actor,accessType:"SELF"}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
  }
  if(["tutor","padre","madre","responsable"].indexOf(role)!==-1){
    if(requireStaff||!target)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var guardianPerson=getAccountingPersonIdForUser_(ss,actor.userId),studentPerson=getAccountingPersonIdForUser_(ss,target);
    if(!guardianPerson||!studentPerson)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var studentSheet=ss.getSheetByName("ExpedientesEstudiantes"),responsibleSheet=ss.getSheetByName("ResponsablesTutores"),relationSheet=ss.getSheetByName("RelacionesEstudianteTutor");
    if(!studentSheet||!responsibleSheet||!relationSheet)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var studentRows=studentSheet.getDataRange().getValues(),sh=(studentRows[0]||[]).map(function(v){return String(v||"").trim();});
    var personIndex=sh.indexOf("PersonaID"),expIndex=sh.indexOf("ExpedienteID");
    if(personIndex<0||expIndex<0)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var students=studentRows.slice(1).filter(function(row){return String(row[personIndex]||"").trim()===studentPerson;});
    if(students.length!==1)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var responsibleRows=responsibleSheet.getDataRange().getValues(),rh=(responsibleRows[0]||[]).map(function(v){return String(v||"").trim();});
    var responsibleIdIndex=rh.indexOf("ResponsableID"),responsiblePersonIndex=rh.indexOf("PersonaID");
    if(responsibleIdIndex<0||responsiblePersonIndex<0)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var responsible=responsibleRows.slice(1).filter(function(row){return String(row[responsiblePersonIndex]||"").trim()===guardianPerson;});
    if(responsible.length!==1)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var relations=relationSheet.getDataRange().getValues(),rr=(relations[0]||[]).map(function(v){return String(v||"").trim();});
    var relationExp=rr.indexOf("ExpedienteID"),relationResponsible=rr.indexOf("ResponsableID"),relationState=rr.indexOf("Estado"),portalIndex=rr.indexOf("AccesoPortal");
    if([relationExp,relationResponsible,relationState,portalIndex].some(function(i){return i<0;}))return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var linked=relations.slice(1).filter(function(row){return String(row[relationExp]||"").trim()===String(students[0][expIndex]||"").trim()&&String(row[relationResponsible]||"").trim()===String(responsible[0][responsibleIdIndex]||"").trim()&&String(row[relationState]||"").trim().toLowerCase()==="activo"&&["si","sí","true","1"].indexOf(String(row[portalIndex]||"").trim().toLowerCase())!==-1;});
    return linked.length===1?{authorized:true,actor:actor,accessType:"GUARDIAN"}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
  }
  if(staffRoles.indexOf(role)!==-1){
    if(!target)return requireStaff?{authorized:true,actor:actor,accessType:"STAFF"}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var personId=getAccountingPersonIdForUser_(ss,target);
    if(!personId)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var sheet=ss.getSheetByName("ExpedientesEstudiantes");if(!sheet)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var values=sheet.getDataRange().getValues(),headers=(values[0]||[]).map(function(v){return String(v||"").trim();});
    var pi=headers.indexOf("PersonaID"),ei=headers.indexOf("ExpedienteID");
    if(pi<0||ei<0)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var matches=values.slice(1).filter(function(row){return String(row[pi]||"").trim()===personId;});
    if(matches.length!==1)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    var scope=getVerifiedAccountingDepartmentScope_(input,ss,actor);
    if(!scope||scope.valid!==true)return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
    return assertResourceOwnershipForScope_(ss,scope,"EXPEDIENTE_ESTUDIANTE",String(matches[0][ei]||"").trim(),"READ");
  }
  return{authorized:false,code:"RESOURCE_SCOPE_DENIED"};
}

function uploadPaymentVoucher(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  if (String(actor.role || "") !== "Estudiante") return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var owner = assertPaymentVoucherOwnerAccess_(input, input.userId || actor.userId);
  if (!owner || owner.authorized !== true || String(input.userId || actor.userId) !== String(actor.userId)) {
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  var fileData = input.fileData, fileName = String(input.fileName || "").trim();
  if (typeof fileData !== "string" || !fileData.trim() || !fileName) return { status: "error", code: "PAYMENT_VOUCHER_FILE_REQUIRED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), sheet = getOrCreateSheet(ss, "ComprobantesPago");
  var existingValues = sheet.getDataRange().getValues(), existingHeaders = (existingValues[0] || []).map(function(value) { return String(value || "").trim(); });
  var groupId = String(input.comprobanteGrupoId || "").trim();
  if (groupId) {
    var groupIndex = existingHeaders.indexOf("ComprobanteGrupoID"), stateIndex = existingHeaders.indexOf("Estado");
    var prior = existingValues.slice(1).filter(function(row) { return String(row[groupIndex] || "") === groupId; });
    var latest = prior.filter(function(row) { return row[existingHeaders.indexOf("EsVersionActual")] === true; });
    if (latest.some(function(row) { return ["Aprobado","Pagado","Contabilizado"].indexOf(String(row[stateIndex] || "")) !== -1; })) {
      return { status: "error", code: "VOUCHER_VERSION_IMMUTABLE" };
    }
    if (latest.length && latest[0][stateIndex] !== "Observado") return { status: "error", code: "VOUCHER_VERSION_REQUIRES_OBSERVATION" };
  }
  var attachment = createPrivatePaymentAttachmentWithIntegrity_(fileData, fileName);
  var lock = LockService.getScriptLock(), acquired = false, committed = false;
  try {
    if (!lock.tryLock(10000)) throw new Error("LOCK_TIMEOUT");
    acquired = true;
    var verified = getVerifiedAccountingIdentity_(input);
    if (!verified || verified.authorized !== true || String(verified.userId) !== String(actor.userId) ||
        String(verified.role) !== String(actor.role)) throw new Error("VERIFIED_IDENTITY_CHANGED");
    var schema = ensurePaymentVoucherEvidenceSchema_(ss), rows = schema.sheet.getDataRange().getValues(), map = schema.map;
    var matches = groupId ? rows.slice(1).map(function(row,index) { return {row:row,index:index}; })
      .filter(function(item) { return String(item.row[map.ComprobanteGrupoID] || "") === groupId; }) : [];
    var latestMatch = matches.filter(function(item) { return item.row[map.EsVersionActual] === true; });
    if (latestMatch.length > 1) throw new Error("PAYMENT_VOUCHER_GROUP_AMBIGUOUS");
    if (latestMatch.length && ["Aprobado","Pagado","Contabilizado"].indexOf(String(latestMatch[0].row[map.Estado] || "")) !== -1) {
      rollbackPrivatePaymentAttachment_(attachment.file); attachment = null;
      return { status: "error", code: "VOUCHER_VERSION_IMMUTABLE" };
    }
    if (latestMatch.length && String(latestMatch[0].row[map.Estado] || "") !== "Observado") {
      rollbackPrivatePaymentAttachment_(attachment.file); attachment = null;
      return { status: "error", code: "VOUCHER_VERSION_REQUIRES_OBSERVATION" };
    }
    if (!groupId) groupId = "CMPG-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 20);
    var version = latestMatch.length ? Number(latestMatch[0].row[map.VersionNumero] || 1) + 1 : 1;
    matches.forEach(function(item) {
      if (item.row[map.EsVersionActual] === true) {
        var previous = item.row.slice();
        previous[map.EsVersionActual] = false;
        previous[map.Estado] = "SUPERADA";
        schema.sheet.getRange(item.index + 2, 1, 1, previous.length).setValues([previous]);
      }
    });
    var id = "CMP-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 22);
    var row = new Array(schema.sheet.getLastColumn()).fill("");
    row[map.ComprobanteID] = id;
    row[map.Fecha] = new Date();
    row[map.UserId] = actor.userId;
    row[map.Alumno] = String(input.alumno || "").trim().slice(0, 160);
    row[map.CargoID] = String(input.cargoId || "").trim();
    row[map.MontoReportado] = Number(input.montoReportado);
    row[map.MetodoPago] = String(input.metodoPago || "").trim();
    row[map.Referencia] = String(input.referencia || "").trim().slice(0, 120);
    row[map.ComprobanteUrl] = attachment.fileId;
    row[map.Estado] = "Pendiente";
    row[map.Observaciones] = "";
    row[map.SolicitudID] = groupId;
    row[map.EvidenciaID] = id;
    row[map.DriveFileID] = attachment.fileId;
    row[map.NombreOriginal] = fileName;
    row[map.EsVersionActual] = true;
    row[map.EstadoIntegridad] = "VERIFICADO";
    row[map.SHA256] = attachment.sha256;
    row[map.VersionNumero] = version;
    row[map.SizeBytes] = attachment.sizeBytes;
    row[map.MimeType] = attachment.mimeType;
    row[map.FechaRecepcion] = attachment.receivedAt;
    row[map.DecisionIntegrityWarning] = false;
    row[map.DecisionState] = "Pendiente";
    row[map.ComprobanteGrupoID] = groupId;
    schema.sheet.appendRow(row);
    committed = true;
    try { logStructuredEvent("ACCOUNTING", "uploadPaymentVoucher", "INFO", "PAYMENT_VOUCHER_RECEIVED",
      "Comprobante de pago recibido con evidencia privada e integridad SHA-256 verificada.",
      { comprobanteId: id, comprobanteGrupoId: groupId, versionNumero: version, sha256: attachment.sha256 }, actor.role); } catch (_) {}
    return { status: "success", comprobanteId: id, comprobanteGrupoId: groupId, versionNumero: version,
      sha256: attachment.sha256, estado: "Pendiente" };
  } catch (error) {
    if (attachment && !committed) rollbackPrivatePaymentAttachment_(attachment.file);
    throw error;
  } finally { if (acquired) lock.releaseLock(); }
}

function getPaymentVouchers(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return{status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),schema=ensurePaymentVoucherEvidenceSchema_(ss);
  var role=String(actor.role||"").trim().toLowerCase(),staffRoles=["secretaría","secretaria","administrador","director","subdirector","recursoshumanos"];
  var requestedUser=String(input.userId||"").trim();
  if(requestedUser&&staffRoles.indexOf(role)!==-1){
    var requestedAccess=assertPaymentVoucherOwnerAccess_(input,requestedUser);
    if(!requestedAccess||requestedAccess.authorized!==true)return{status:"error",code:"RESOURCE_SCOPE_DENIED"};
  }
  var rows=schema.sheet.getDataRange().getValues().slice(1).filter(function(row){
    var userId=String(row[schema.map.UserId]||"").trim();
    if(requestedUser&&staffRoles.indexOf(role)!==-1&&userId!==requestedUser)return false;
    var owner=assertPaymentVoucherOwnerAccess_(input,userId);
    return !!owner&&owner.authorized===true;
  });
  rows.sort(function(a,b){return new Date(b[schema.map.Fecha]||0).getTime()-new Date(a[schema.map.Fecha]||0).getTime();});
  return{status:"success",comprobantes:rows.map(function(row){var item=paymentVoucherRowObject_(row,schema.map);return{
    comprobanteId:String(item.ComprobanteID||""),comprobanteGrupoId:String(item.ComprobanteGrupoID||item.SolicitudID||""),
    alumno:String(item.Alumno||""),cargoId:String(item.CargoID||""),montoReportado:Number(item.MontoReportado||0),
    metodoPago:String(item.MetodoPago||""),referencia:String(item.Referencia||""),estado:String(item.Estado||""),
    comprobanteUrl:"",versionNumero:Number(item.VersionNumero||1),esVersionActual:item.EsVersionActual===true,estadoIntegridad:String(item.EstadoIntegridad||"")
  };})};
}

function getPaymentVoucherFile(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), schema = ensurePaymentVoucherEvidenceSchema_(ss);
  var rows = schema.sheet.getDataRange().getValues().slice(1), id = String(input.comprobanteId || "").trim();
  var matches = rows.filter(function(row) { return String(row[schema.map.ComprobanteID] || "") === id; });
  if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var record = paymentVoucherRowObject_(matches[0], schema.map);
  var owner = assertPaymentVoucherOwnerAccess_(input, record.UserId);
  if (!owner || owner.authorized !== true) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var verified = verifyPaymentVoucherEvidence_(ss, record, "getPaymentVoucherFile", actor.role);
  if (verified.status === "error") return verified;
  var result = { status: "success", comprobanteId: id, integrityVerified: verified.integrityVerified === true,
    sha256Actual: verified.sha256Actual || verified.sha256 || "", versionNumero: Number(record.VersionNumero || 1) };
  if (verified.integrityWarning) {
    result.integrityWarning = true;
    result.integrityPolicy = verified.integrityPolicy;
  } else {
    result.fileData = Utilities.base64Encode(verified.bytes);
    result.fileName = String(record.NombreOriginal || "");
    result.mimeType = verified.mimeType;
  }
  return result;
}

function reviewPaymentVoucher(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var staff = assertPaymentVoucherOwnerAccess_(input, "", { requireStaff: true });
  if (!staff || staff.authorized !== true) return { status: "error", code: "ROLE_NOT_ALLOWED" };
  var state = String(input.nuevoEstado || "").trim();
  if (["Aprobado","Observado","Rechazado"].indexOf(state) === -1) return { status: "error", code: "PAYMENT_VOUCHER_DECISION_INVALID" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { status: "error", code: "LOCK_TIMEOUT" };
  try {
    var verifiedActor = getVerifiedAccountingIdentity_(input);
    if (!verifiedActor || verifiedActor.authorized !== true || String(verifiedActor.userId) !== String(actor.userId) ||
        String(verifiedActor.role) !== String(actor.role)) return { status: "error", code: "VERIFIED_IDENTITY_CHANGED" };
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID), schema = ensurePaymentVoucherEvidenceSchema_(ss);
    var rows = schema.sheet.getDataRange().getValues();
    var matches = rows.slice(1).map(function(row,index) { return {row:row,index:index}; })
      .filter(function(item) { return String(item.row[schema.map.ComprobanteID] || "") === String(input.comprobanteId || "").trim(); });
    if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    var match = matches[0], record = paymentVoucherRowObject_(match.row, schema.map);
    var scopedOwner = assertPaymentVoucherOwnerAccess_(input, record.UserId, { requireStaff: true });
    if (!scopedOwner || scopedOwner.authorized !== true) return { status: "error", code: "RESOURCE_SCOPE_DENIED" };
    if (record.EsVersionActual !== true || ["Pendiente","Observado"].indexOf(String(record.Estado || "")) === -1) {
      return { status: "error", code: "PAYMENT_VOUCHER_ALREADY_REVIEWED" };
    }
    var evidence = verifyPaymentVoucherEvidence_(ss, record, "reviewPaymentVoucher", actor.role);
    if (evidence.status === "error") return evidence;
    var warning = evidence.integrityWarning === true;
    var decision = { comprobanteId: record.ComprobanteID, comprobanteGrupoId: record.ComprobanteGrupoID,
      versionNumero: Number(record.VersionNumero || 1), sha256Esperado: String(record.SHA256 || ""),
      sha256Actual: String(evidence.sha256Actual || evidence.sha256 || ""), nuevoEstado: state,
      observaciones: String(input.observaciones || "").trim().slice(0, 500), actorUserId: actor.userId,
      fechaDecision: new Date().toISOString(), integrityWarning: warning };
    var row = match.row.slice();
    row[schema.map.Estado] = state;
    row[schema.map.AprobadoPor] = actor.userId;
    row[schema.map.Observaciones] = decision.observaciones;
    row[schema.map.DecisionIntegrityWarning] = warning;
    row[schema.map.DecisionHash] = computeDocumentSHA256(JSON.stringify(decision));
    row[schema.map.DecisionState] = state;
    row[schema.map.DecisionActor] = actor.userId;
    row[schema.map.DecisionDate] = decision.fechaDecision;
    schema.sheet.getRange(match.index + 2, 1, 1, row.length).setValues([row]);
    return { status: "success", comprobanteId: record.ComprobanteID, estado: state, integrityWarning: warning,
      decisionHash: row[schema.map.DecisionHash] };
  } finally { lock.releaseLock(); }
}


function familyCreditApprovalActor_(p) {
  var input=p||{}, actor=typeof getVerifiedAccountingIdentity_==="function"?getVerifiedAccountingIdentity_(input):
    (input._verifiedRole?{authorized:true,userId:String(input._verifiedUserId||""),role:String(input._verifiedRole)}:null);
  if(!actor||actor.authorized!==true||!actor.role)throw new Error("VERIFIED_IDENTITY_REQUIRED");
  return {userId:String(actor.userId||""),role:String(actor.role||""),institutionId:String(actor.institutionId||"")};
}
function institutionalServiceRoleKey_(role){return String(role||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
function institutionalServiceIsActive_(ss,name){var sh=ss&&ss.getSheetByName?ss.getSheetByName("ServiciosInstitucionales"):null;if(!sh)return true;var r=sh.getDataRange().getValues().slice(1).filter(function(x){return String(x[0]||"").toLowerCase()===String(name||"").toLowerCase();});if(r.length>1)throw new Error("INSTITUTIONAL_SERVICE_CONFIGURATION_AMBIGUOUS");return !r.length||["activo","active","habilitado","si","true"].indexOf(String(r[0][1]||"").toLowerCase())!==-1;}
function familyCreditPinSecret_(){var v=PropertiesService.getScriptProperties().getProperty("FAMILY_CREDIT_PIN_SECRET");if(!v||String(v).length<16)throw new Error("FAMILY_CREDIT_PIN_SECRET_NOT_CONFIGURED");return String(v);}
function familyCreditPinDigest_(pin,salt){var message="FAMILY_CREDIT_PIN|"+String(salt||"")+"|"+String(pin||"");if(typeof computeHmacSignature==="function")return String(computeHmacSignature(message,familyCreditPinSecret_()));if(Utilities.computeHmacSha256Signature)return Utilities.computeHmacSha256Signature(message,familyCreditPinSecret_()).map(function(x){return("0"+(x&255).toString(16)).slice(-2);}).join("");throw new Error("FAMILY_CREDIT_PIN_HASH_PROVIDER_UNAVAILABLE");}
function familyCreditConstantTimeEquals_(a,b){a=String(a||"");b=String(b||"");var d=a.length^b.length,n=Math.max(a.length,b.length);for(var i=0;i<n;i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0;}
function familyCreditEnsureConfigSheet_(ss){var sh=getOrCreateSheet(ss,"CreditoFamiliarConfiguracion"),h=["ConfiguracionID","ResponsableUserID","ModalidadAprobacion","FechaActualizacion","ActualizadoPor","PinSalt","PinHash","PinUpdatedAt","FailedAttempts","LockedUntil"],r=sh.getDataRange().getValues();if(!r.length){sh.appendRow(h);r=[h];}var cur=(r[0]||[]).map(String);h.forEach(function(x){if(cur.indexOf(x)<0){sh.getRange(1,cur.length+1).setValue(x);cur.push(x);}});var m={};cur.forEach(function(x,i){if(x){if(m[x]!==undefined)throw new Error("FAMILY_CREDIT_CONFIGURATION_SCHEMA_INVALID");m[x]=i;}});return{sheet:sh,map:m};}
function familyCreditEnsureAuthorizationSheet_(ss){var sh=getOrCreateSheet(ss,"CreditoFamiliarAutorizaciones"),h=["AutorizacionID","Fecha","ResponsableUserId","EstudianteUserId","LimiteDiario","LimiteMensual","SaldoUsado","Estado","FechaVencimiento","Observaciones","ModalidadAprobacion","PinApprovedBy","PinApprovedAt"],r=sh.getDataRange().getValues();if(!r.length){sh.appendRow(h);r=[h];}var cur=(r[0]||[]).map(String);h.forEach(function(x){if(cur.indexOf(x)<0){sh.getRange(1,cur.length+1).setValue(x);cur.push(x);}});var m={};cur.forEach(function(x,i){if(x){if(m[x]!==undefined)throw new Error("FAMILY_CREDIT_AUTHORIZATION_SCHEMA_INVALID");m[x]=i;}});return{sheet:sh,map:m};}
function familyCreditGetActiveStudentUserIdsForGuardian_(ss,gid){var us=ss.getSheetByName("Usuarios"),rs=ss.getSheetByName("RelacionesFamiliares");if(!us||!rs)return[];var u=us.getDataRange().getValues(),r=rs.getDataRange().getValues(),uh=u[0].map(String),rh=r[0].map(String),ui=uh.indexOf("UserId"),pi=uh.indexOf("PersonaID"),ri=uh.indexOf("Rol"),si=uh.indexOf("Estado"),sp=rh.indexOf("PersonaEstudianteID"),gp=rh.indexOf("PersonaResponsableID"),st=rh.indexOf("EstadoAutorizacion"),fi=rh.indexOf("FechaInicio"),ti=rh.indexOf("FechaFin");if([ui,pi,ri,sp,gp,st].some(function(x){return x<0;}))return[];var g=u.slice(1).filter(function(x){return String(x[ui])===String(gid);});if(g.length!==1||!g[0][pi])return[];var person=String(g[0][pi]),now=new Date(),out=[];r.slice(1).forEach(function(rel){var state=String(rel[st]||"").toLowerCase(),from=fi>=0&&rel[fi]?new Date(rel[fi]):null,to=ti>=0&&rel[ti]?new Date(rel[ti]):null;if(String(rel[gp])!==person||["aprobado","autorizado","activo","active","verificada"].indexOf(state)<0||(from&&from>now)||(to&&to<now))return;var students=u.slice(1).filter(function(x){return String(x[pi])===String(rel[sp])&&["estudiante","alumno"].indexOf(institutionalServiceRoleKey_(x[ri]))>=0&&(!x[si]||["activo","active","habilitado"].indexOf(String(x[si]).toLowerCase())>=0);});if(students.length===1&&out.indexOf(String(students[0][ui]))<0)out.push(String(students[0][ui]));});return out;}
function familyCreditGuardianHasActiveStudentRelation_(ss,gid){return familyCreditGetActiveStudentUserIdsForGuardian_(ss,gid).length>0;}
function familyCreditGuardianCanAuthorizeStudent_(ss,gid,sid){return familyCreditGetActiveStudentUserIdsForGuardian_(ss,gid).indexOf(String(sid))>=0;}
function familyCreditVerifyPinInConfig_(ss,gid,pin){var s=familyCreditEnsureConfigSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,a=r.slice(1).map(function(row,i){return{row:row,i:i};}).filter(function(x){return String(x.row[m.ResponsableUserID])===String(gid);});if(a.length>1)throw new Error("FAMILY_CREDIT_CONFIGURATION_DUPLICATE");if(!a.length||!a[0].row[m.PinHash])throw new Error("FAMILY_CREDIT_PIN_NOT_CONFIGURED");var row=a[0].row,locked=row[m.LockedUntil];if(locked&&new Date(locked)>new Date())throw new Error("FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED");if(!familyCreditConstantTimeEquals_(familyCreditPinDigest_(pin,row[m.PinSalt]),row[m.PinHash])){var tries=Number(row[m.FailedAttempts]||0)+1;s.sheet.getRange(a[0].i+2,m.FailedAttempts+1).setValue(tries);if(tries>=5){s.sheet.getRange(a[0].i+2,m.LockedUntil+1).setValue(new Date(Date.now()+900000));throw new Error("FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED");}throw new Error("FAMILY_CREDIT_PIN_INVALID");}s.sheet.getRange(a[0].i+2,m.FailedAttempts+1).setValue(0);s.sheet.getRange(a[0].i+2,m.LockedUntil+1).setValue("");return true;}
function familyCreditApprovalPreferenceRow_(ss,gid){var s=familyCreditEnsureConfigSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,a=r.slice(1).map(function(row,i){return{row:row,i:i};}).filter(function(x){return String(x.row[m.ResponsableUserID]||"")===String(gid);});if(a.length>1)throw new Error("FAMILY_CREDIT_CONFIGURATION_DUPLICATE");return{schema:s,match:a[0]||null};}
function configureFamilyCreditApprovalPreference(p){var a=familyCreditApprovalActor_(p),role=institutionalServiceRoleKey_(a.role),ss=SpreadsheetApp.openById(SPREADSHEET_ID);if(role!=="padre"){if(role==="estudiante"||role==="alumno")throw new Error("FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED");if(!familyCreditGuardianHasActiveStudentRelation_(ss,a.userId))throw new Error("FAMILY_CREDIT_ACTIVE_GUARDIAN_RELATION_REQUIRED");throw new Error("FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED");}if(!familyCreditGuardianHasActiveStudentRelation_(ss,a.userId))throw new Error("FAMILY_CREDIT_ACTIVE_GUARDIAN_RELATION_REQUIRED");var mode=String(p.modalidadAprobacion||"").toUpperCase();if(["POR_CUPO","POR_COMPRA"].indexOf(mode)<0)throw new Error("FAMILY_CREDIT_APPROVAL_MODE_INVALID");var lock=LockService.getScriptLock();lock.waitLock(10000);try{var d=familyCreditApprovalPreferenceRow_(ss,a.userId),m=d.schema.map,now=new Date();if(d.match){d.schema.sheet.getRange(d.match.i+2,m.ModalidadAprobacion+1).setValue(mode);d.schema.sheet.getRange(d.match.i+2,m.FechaActualizacion+1).setValue(now);d.schema.sheet.getRange(d.match.i+2,m.ActualizadoPor+1).setValue(a.userId);}else{var row=new Array(d.schema.sheet.getDataRange().getValues()[0].length).fill("");row[m.ConfiguracionID]="CFG-"+Utilities.getUuid();row[m.ResponsableUserID]=a.userId;row[m.ModalidadAprobacion]=mode;row[m.FechaActualizacion]=now;row[m.ActualizadoPor]=a.userId;d.schema.sheet.appendRow(row);}return{status:"success",configured:true,modalidadAprobacion:mode};}finally{lock.releaseLock();}}
function getFamilyCreditApprovalPreference(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID);if(institutionalServiceRoleKey_(a.role)!=="padre")throw new Error("FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED");if(!familyCreditGuardianHasActiveStudentRelation_(ss,a.userId))throw new Error("FAMILY_CREDIT_ACTIVE_GUARDIAN_RELATION_REQUIRED");var lock=LockService.getScriptLock();lock.waitLock(10000);try{var d=familyCreditApprovalPreferenceRow_(ss,a.userId),row=d.match&&d.match.row,m=d.schema.map;return{status:"success",configured:!!(row&&row[m.ModalidadAprobacion]),modalidadAprobacion:row&&row[m.ModalidadAprobacion]||null,pinConfigured:!!(row&&row[m.PinHash])};}finally{lock.releaseLock();}}
function configureFamilyCreditPin(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID);if(institutionalServiceRoleKey_(a.role)!=="padre")throw new Error("FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED");if(!familyCreditGuardianHasActiveStudentRelation_(ss,a.userId))throw new Error("FAMILY_CREDIT_ACTIVE_GUARDIAN_RELATION_REQUIRED");var pin=String(p.newPin||"");if(!/^\d{6}$/.test(pin)||pin!==String(p.confirmPin||""))throw new Error("FAMILY_CREDIT_PIN_INPUT_INVALID");var lock=LockService.getScriptLock();lock.waitLock(10000);try{var d=familyCreditApprovalPreferenceRow_(ss,a.userId),m=d.schema.map;if(!d.match){var row=new Array(d.schema.sheet.getDataRange().getValues()[0].length).fill("");row[m.ConfiguracionID]="CFG-"+Utilities.getUuid();row[m.ResponsableUserID]=a.userId;row[m.FechaActualizacion]=new Date();row[m.ActualizadoPor]=a.userId;d.schema.sheet.appendRow(row);d=familyCreditApprovalPreferenceRow_(ss,a.userId);}if(d.match.row[m.PinHash]){if(!p.currentPin)throw new Error("FAMILY_CREDIT_CURRENT_PIN_REQUIRED");familyCreditVerifyPinInConfig_(ss,a.userId,p.currentPin);}var salt=String(Utilities.getUuid())+String(Date.now());d.schema.sheet.getRange(d.match.i+2,m.PinSalt+1).setValue(salt);d.schema.sheet.getRange(d.match.i+2,m.PinHash+1).setValue(familyCreditPinDigest_(pin,salt));d.schema.sheet.getRange(d.match.i+2,m.PinUpdatedAt+1).setValue(new Date());d.schema.sheet.getRange(d.match.i+2,m.FailedAttempts+1).setValue(0);d.schema.sheet.getRange(d.match.i+2,m.LockedUntil+1).setValue("");return{status:"success",pinConfigured:true};}finally{lock.releaseLock();}}
function familyCreditEnsurePurchaseAuthorization_(ss,gid,sid){if(!familyCreditGuardianCanAuthorizeStudent_(ss,gid,sid))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");var s=familyCreditEnsureAuthorizationSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,a=r.slice(1).map(function(row,i){return{row:row,i:i};}).filter(function(x){return String(x.row[m.ResponsableUserId])===String(gid)&&String(x.row[m.EstudianteUserId])===String(sid)&&["activa","active"].indexOf(String(x.row[m.Estado]).toLowerCase())>=0;});if(a.length!==1)throw new Error(a.length?"FAMILY_CREDIT_AUTHORIZATION_AMBIGUOUS":"FAMILY_CREDIT_AUTHORIZATION_NOT_FOUND");if(a[0].row[m.FechaVencimiento]&&new Date(a[0].row[m.FechaVencimiento])<new Date())throw new Error("FAMILY_CREDIT_AUTHORIZATION_EXPIRED");return{schema:s,row:a[0].row,rowIndex:a[0].i+2,map:m};}
function familyCreditRequirePurchaseAuthorizationForStudent_(ss,gid,sid){return familyCreditEnsurePurchaseAuthorization_(ss,gid,sid);}
function configureFamilyCreditAuthorization(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID);if(institutionalServiceRoleKey_(a.role)!=="padre")throw new Error("FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED");var sid=String(p.estudianteUserId||""),daily=Number(p.limiteDiario),monthly=Number(p.limiteMensual);if(!familyCreditGuardianCanAuthorizeStudent_(ss,a.userId,sid))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");if(!isFinite(daily)||!isFinite(monthly)||daily<=0||monthly<=0||daily>monthly)throw new Error("FAMILY_CREDIT_LIMITS_INVALID");var pref=familyCreditApprovalPreferenceRow_(ss,a.userId),mode=pref.match?String(pref.match.row[pref.schema.map.ModalidadAprobacion]||"POR_COMPRA"):"POR_COMPRA",pinApproved=false;if(p.familyPin){familyCreditVerifyPinInConfig_(ss,a.userId,p.familyPin);pinApproved=true;}else if(mode==="POR_CUPO"&&pref.match&&pref.match.row[pref.schema.map.PinHash])throw new Error("FAMILY_CREDIT_PIN_INVALID");var lock=LockService.getScriptLock();lock.waitLock(10000);try{var s=familyCreditEnsureAuthorizationSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,aRows=r.slice(1).map(function(row,i){return{row:row,i:i};}).filter(function(x){return String(x.row[m.ResponsableUserId])===a.userId&&String(x.row[m.EstudianteUserId])===sid;});if(aRows.length>1)throw new Error("FAMILY_CREDIT_AUTHORIZATION_AMBIGUOUS");var old=aRows[0],row=old?old.row.slice():new Array(r[0].length).fill("");row[m.AutorizacionID]=old?row[m.AutorizacionID]:"AUT-"+Utilities.getUuid();row[m.Fecha]=new Date();row[m.ResponsableUserId]=a.userId;row[m.EstudianteUserId]=sid;row[m.LimiteDiario]=daily;row[m.LimiteMensual]=monthly;row[m.SaldoUsado]=Number(row[m.SaldoUsado]||0);row[m.Estado]=p.estado||"Activa";row[m.FechaVencimiento]=p.fechaVencimiento||"";row[m.Observaciones]=String(p.observaciones||"").slice(0,500);row[m.ModalidadAprobacion]=mode;row[m.PinApprovedBy]=pinApproved?a.userId:"";row[m.PinApprovedAt]=pinApproved?new Date():"";if(old)s.sheet.getRange(old.i+2,1,1,row.length).setValues([row]);else s.sheet.appendRow(row);return{status:"success",autorizacionId:row[m.AutorizacionID],modalidadAprobacion:mode,pinAprobado:pinApproved};}finally{lock.releaseLock();}}
function getFamilyCreditAuthorizations(p){var a=familyCreditApprovalActor_(p),role=institutionalServiceRoleKey_(a.role),ss=SpreadsheetApp.openById(SPREADSHEET_ID),s=familyCreditEnsureAuthorizationSheet_(ss),sid=String(p.estudianteUserId||""),gid=String(p.responsableUserId||"");if(role==="estudiante"||role==="alumno"){if(sid&&sid!==a.userId)throw new Error("FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED");sid=a.userId;gid="";}else if(role==="padre"){if(gid&&gid!==a.userId)throw new Error("FAMILY_CREDIT_GUARDIAN_OWNERSHIP_REQUIRED");gid=a.userId;if(sid&&!familyCreditGuardianCanAuthorizeStudent_(ss,gid,sid))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");}else if(["administrador","director","contador","secretaria"].indexOf(role)<0)throw new Error("ROLE_NOT_ALLOWED");var rows=s.sheet.getDataRange().getValues().slice(1).filter(function(r){return(!sid||String(r[s.map.EstudianteUserId])===sid)&&(!gid||String(r[s.map.ResponsableUserId])===gid);});return{status:"success",autorizaciones:rows.map(function(r){return{autorizacionId:r[s.map.AutorizacionID],fecha:r[s.map.Fecha],responsableUserId:r[s.map.ResponsableUserId],estudianteUserId:r[s.map.EstudianteUserId],limiteDiario:Number(r[s.map.LimiteDiario]||0),limiteMensual:Number(r[s.map.LimiteMensual]||0),saldoUsado:Number(r[s.map.SaldoUsado]||0),estado:r[s.map.Estado],fechaVencimiento:r[s.map.FechaVencimiento],observaciones:r[s.map.Observaciones]};})};}
function familyCreditIsRequested_(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s/g,"")==="creditofamiliar";}
function familyCreditIsCancellationStatus_(v){return["cancelado","cancelada","devuelto","devuelta","anulado","anulada"].indexOf(String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase())>=0;}
function familyCreditGetStatementMovements_(ss,sid){var sh=ss.getSheetByName("CreditoFamiliarMovimientos");if(!sh)return[];return sh.getDataRange().getValues().slice(1).filter(function(r){return String(r[3])===String(sid)&&["aprobado","reversado"].indexOf(String(r[8]||"").toLowerCase())>=0;}).map(function(r){return{movimientoCreditoId:r[0],fecha:r[1],autorizacionId:r[2],estudianteUserId:r[3],responsableUserId:r[4],establecimiento:r[5],monto:Number(r[6]||0),origenRefId:r[7],estado:r[8]};});}
function familyCreditSpentInPeriod_(ss,aid,date){var sh=ss.getSheetByName("CreditoFamiliarMovimientos");if(!sh)return 0;var start=new Date(date.getFullYear(),date.getMonth(),date.getDate()),end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+1);return sh.getDataRange().getValues().slice(1).reduce(function(sum,r){var d=r[1]?new Date(r[1]):null;if(String(r[2])!==String(aid)||!d||d<start||d>=end)return sum;var st=String(r[8]||"").toLowerCase();return sum+(st==="aprobado"?Number(r[6]||0):st==="reversado"?-Number(r[6]||0):0);},0);}
function familyCreditRecordDebit_(ss,auth,sid,gid,place,amount,origin){var s=auth.schema||familyCreditEnsureAuthorizationSheet_(ss),m=s.map,row=auth.row||auth,sh=getOrCreateSheet(ss,"CreditoFamiliarMovimientos"),id="MOV-"+Utilities.getUuid();sh.appendRow([id,new Date(),row[m.AutorizacionID],sid,gid,place,amount,origin,"Aprobado",""]);var balance=Number(row[m.SaldoUsado]||0)+amount;s.sheet.getRange(auth.rowIndex||2,m.SaldoUsado+1).setValue(balance);return{movimientoCreditoId:id,saldoUsado:balance};}
function familyCreditApplyCupoPurchase_(ss,sid,place,origin,amount){var s=familyCreditEnsureAuthorizationSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,a=r.slice(1).map(function(row,i){return{row:row,i:i};}).filter(function(x){return String(x.row[m.EstudianteUserId])===String(sid)&&String(x.row[m.Estado]).toLowerCase()==="activa";});if(a.length!==1)throw new Error("FAMILY_CREDIT_AUTHORIZATION_NOT_FOUND");var auth={schema:s,row:a[0].row,rowIndex:a[0].i+2},aid=String(a[0].row[m.AutorizacionID]),used=familyCreditSpentInPeriod_(ss,aid,new Date());if(used+amount>=Number(a[0].row[m.LimiteDiario]))throw new Error("FAMILY_CREDIT_DAILY_LIMIT_EXCEEDED");if(Number(a[0].row[m.SaldoUsado]||0)+amount>Number(a[0].row[m.LimiteMensual]))throw new Error("FAMILY_CREDIT_MONTHLY_LIMIT_EXCEEDED");return familyCreditRecordDebit_(ss,auth,sid,String(a[0].row[m.ResponsableUserId]),place,amount,origin);}
function processFamilyCreditPurchase(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID);if(institutionalServiceRoleKey_(a.role)!=="padre")throw new Error("FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED");var sid=String(p.estudianteUserId||""),origin=String(p.origenRefId||""),place=String(p.establecimiento||"").toUpperCase();if(!familyCreditGuardianCanAuthorizeStudent_(ss,a.userId,sid))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");var lock=LockService.getScriptLock();lock.waitLock(10000);try{var auth=familyCreditRequirePurchaseAuthorizationForStudent_(ss,a.userId,sid),mov=getOrCreateSheet(ss,"CreditoFamiliarMovimientos"),rows=mov.getDataRange().getValues(),prior=rows.slice(1).filter(function(r){return String(r[7])===origin&&String(r[8]).toLowerCase()==="aprobado";});if(prior.length>1)throw new Error("FAMILY_CREDIT_MOVEMENT_AMBIGUOUS");if(prior.length)return{status:"success",approved:true,idempotent:true};var orderSh=getOrCreateSheet(ss,place==="TIENDA"?"TiendaOrdenes":"CafeteriaPedidos"),orders=orderSh.getDataRange().getValues(),idx=orders.findIndex(function(r){return String(r[0])===origin;});if(idx<1)throw new Error("FAMILY_CREDIT_ORDER_NOT_FOUND");var order=orders[idx];if(String(order[2])!==sid)throw new Error("FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED");var amount=Number(order[place==="TIENDA"?5:6]||0);familyCreditVerifyPinInConfig_(ss,a.userId,p.familyPin);var used=familyCreditSpentInPeriod_(ss,auth.row[auth.map.AutorizacionID],new Date());if(used+amount>=Number(auth.row[auth.map.LimiteDiario]))throw new Error("FAMILY_CREDIT_DAILY_LIMIT_EXCEEDED");if(Number(auth.row[auth.map.SaldoUsado]||0)+amount>Number(auth.row[auth.map.LimiteMensual]))throw new Error("FAMILY_CREDIT_MONTHLY_LIMIT_EXCEEDED");var debit=familyCreditRecordDebit_(ss,auth,sid,a.userId,place,amount,origin);orderSh.getRange(idx+1,place==="TIENDA"?8:9).setValue("AprobadoCreditoFamiliar");return{status:"success",approved:true,idempotent:false,movimientoCreditoId:debit.movimientoCreditoId};}finally{lock.releaseLock();}}
function familyCreditReverseApprovedOrder_(ss,place,origin){var sh=getOrCreateSheet(ss,"CreditoFamiliarMovimientos"),r=sh.getDataRange().getValues(),a=r.slice(1).filter(function(x){return String(x[7])===String(origin)&&institutionalServiceRoleKey_(x[5])===institutionalServiceRoleKey_(place)&&String(x[8]).toLowerCase()==="aprobado";});if(!a.length)return{status:"success",reversed:false};if(a.length!==1)throw new Error("FAMILY_CREDIT_MOVEMENT_AMBIGUOUS");var x=a[0],ref="REV:"+x[0];if(r.slice(1).some(function(y){return String(y[7])===ref&&String(y[8]).toLowerCase()==="reversado";}))return{status:"success",reversed:false,idempotent:true};try{sh.appendRow(["REV-"+Utilities.getUuid(),new Date(),x[2],x[3],x[4],x[5],Number(x[6]),ref,"Reversado","Reversión"]);}catch(e){throw new Error("FAMILY_CREDIT_REVERSAL_WRITE_FAILED");}var s=familyCreditEnsureAuthorizationSheet_(ss),rows=s.sheet.getDataRange().getValues(),m=s.map,idx=rows.findIndex(function(y){return String(y[m.AutorizacionID])===String(x[2]);});if(idx<1)throw new Error("FAMILY_CREDIT_AUTHORIZATION_NOT_FOUND");s.sheet.getRange(idx+1,m.SaldoUsado+1).setValue(Math.max(0,Number(rows[idx][m.SaldoUsado]||0)-Number(x[6])));return{status:"success",reversed:true};}
function familyCreditResolveStudent_(ss,a,requested){var role=institutionalServiceRoleKey_(a.role);if(role==="estudiante"||role==="alumno")return a.userId;if(role==="padre"){if(!requested||!familyCreditGuardianCanAuthorizeStudent_(ss,a.userId,requested))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");return String(requested);}return String(requested||"");}
function createStoreOrder(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),sid=familyCreditResolveStudent_(ss,a,p.userId),items=p.detalleItems||[];if(!sid||!items.length)throw new Error("ORDER_ITEMS_REQUIRED");var qty={};items.forEach(function(x){var id=String(x.productoId||""),n=Number(x.cantidad===undefined?1:x.cantidad);if(!id||!Number.isInteger(n)||n<=0)throw new Error("ORDER_QUANTITY_INVALID");qty[id]=(qty[id]||0)+n;});var lock=LockService.getScriptLock();lock.waitLock(10000);try{var ps=getOrCreateSheet(ss,"TiendaProductos"),os=getOrCreateSheet(ss,"TiendaOrdenes"),pr=ps.getDataRange().getValues(),out=[],total=0;Object.keys(qty).forEach(function(id){var m=pr.map(function(r,i){return{r:r,i:i};}).filter(function(x){return String(x.r[0])===id;});if(m.length!==1)throw new Error(m.length?"STORE_PRODUCT_AMBIGUOUS":"STORE_PRODUCT_NOT_FOUND");var x=m[0],price=Number(x.r[5]),stock=Number(x.r[6]);if(!isFinite(price)||price<0||!Number.isInteger(stock)||stock<qty[id])throw new Error("STORE_INSUFFICIENT_STOCK");out.push({productoId:id,nombre:x.r[4],precio:price,cantidad:qty[id],subtotal:price*qty[id],row:x.i+1,stock:stock});total+=price*qty[id];});total=Math.round(total*100)/100;var method=String(p.metodoPago||"Transferencia"),family=familyCreditIsRequested_(method),mode="POR_COMPRA",guardian="";if(family){var s=familyCreditEnsureAuthorizationSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,auth=r.slice(1).filter(function(x){return String(x[m.EstudianteUserId])===sid&&String(x[m.Estado]).toLowerCase()==="activa";});if(auth.length!==1)throw new Error("FAMILY_CREDIT_AUTHORIZATION_NOT_FOUND");mode=String(auth[0][m.ModalidadAprobacion]||"POR_COMPRA");guardian=auth[0][m.ResponsableUserId];}var id="ORD-"+Utilities.getUuid(),state=family?(mode==="POR_CUPO"?"AprobadoCreditoFamiliar":"PendienteAprobacionFamiliar"):"Pendiente";os.appendRow([id,new Date(),sid,String(p.compradorNombre||"Comprador"),JSON.stringify(out.map(function(x){return{productoId:x.productoId,nombre:x.nombre,precio:x.precio,cantidad:x.cantidad,subtotal:x.subtotal};})),total,method,state,"PendientePreparacion",p.metodoEntrega||"RecogidaEnTienda","",p.observaciones||""]);out.forEach(function(x){ps.getRange(x.row,7).setValue(x.stock-x.cantidad);});if(family&&mode==="POR_CUPO")familyCreditApplyCupoPurchase_(ss,sid,"TIENDA",id,total);return{status:"success",ordenId:id,totalCalculado:total,itemsProcesados:out.length};}finally{lock.releaseLock();}}
function getStoreOrders(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),role=institutionalServiceRoleKey_(a.role),sid="";if(role==="padre"){sid=String(p.userId||"");if(sid&&!familyCreditGuardianCanAuthorizeStudent_(ss,a.userId,sid))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");}else if(role==="estudiante"||role==="alumno")sid=a.userId;else if(["administrador","director","contador","secretaria","encargadotienda"].indexOf(role)<0)throw new Error("ROLE_NOT_ALLOWED");var allowed=role==="padre"?familyCreditGetActiveStudentUserIdsForGuardian_(ss,a.userId):[];var rows=getOrCreateSheet(ss,"TiendaOrdenes").getDataRange().getValues().slice(1).filter(function(r){return(!sid||String(r[2])===sid)&&(!p.ordenId||String(r[0])===String(p.ordenId))&&(role!=="padre"||sid||allowed.indexOf(String(r[2]))>=0);});return{status:"success",ordenes:rows.map(function(r){return{ordenId:r[0],fecha:r[1],userId:r[2],compradorNombre:r[3],detalleJSON:r[4],montoTotal:Number(r[5]||0),metodoPago:r[6],estadoPago:r[7],estadoEntrega:r[8],metodoEntrega:r[9],pdfComprobanteUrl:"",observaciones:r[11]};})};}
function createCafeteriaOrder(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),sid=familyCreditResolveStudent_(ss,a,p.estudianteUserId),items=p.detalleItems||{};if(!sid||!Array.isArray(items)||!items.length)throw new Error("CAFETERIA_ITEMS_REQUIRED");var qty={};items.forEach(function(x){var id=String(x.platoId||""),n=Number(x.cantidad===undefined?1:x.cantidad);if(!id||!Number.isInteger(n)||n<=0)throw new Error("ORDER_QUANTITY_INVALID");qty[id]=(qty[id]||0)+n;});var lock=LockService.getScriptLock();lock.waitLock(10000);try{var ms=getOrCreateSheet(ss,"CafeteriaMenu"),os=getOrCreateSheet(ss,"CafeteriaPedidos"),mr=ms.getDataRange().getValues(),out=[],total=0;Object.keys(qty).forEach(function(id){var m=mr.map(function(r,i){return{r:r,i:i};}).filter(function(x){return String(x.r[0])===id;});if(m.length!==1)throw new Error("CAFETERIA_PRODUCT_NOT_FOUND");var x=m[0],price=Number(x.r[3]),stock=Number(x.r[4]);if(!isFinite(price)||price<0||!Number.isInteger(stock)||stock<qty[id])throw new Error("CAFETERIA_INSUFFICIENT_STOCK");out.push({platoId:id,nombre:x.r[2],precio:price,cantidad:qty[id],subtotal:price*qty[id],row:x.i+1,stock:stock});total+=price*qty[id];});total=Math.round(total*100)/100;var method=String(p.metodoPago||"Efectivo"),family=familyCreditIsRequested_(method),mode="POR_COMPRA",guardian=a.userId;if(family){var s=familyCreditEnsureAuthorizationSheet_(ss),r=s.sheet.getDataRange().getValues(),m=s.map,auth=r.slice(1).filter(function(x){return String(x[m.EstudianteUserId])===sid&&String(x[m.Estado]).toLowerCase()==="activa";});if(auth.length!==1)throw new Error("FAMILY_CREDIT_AUTHORIZATION_NOT_FOUND");guardian=auth[0][m.ResponsableUserId];mode=String(auth[0][m.ModalidadAprobacion]||"POR_COMPRA");}var id="CAF-"+Utilities.getUuid(),state=family?(mode==="POR_CUPO"?"AprobadoCreditoFamiliar":"PendienteAprobacionFamiliar"):"Pendiente";os.appendRow([id,new Date(),sid,guardian,JSON.stringify(out.map(function(x){return{platoId:x.platoId,nombre:x.nombre,precio:x.precio,cantidad:x.cantidad,subtotal:x.subtotal};})),p.turnoEntrega||"Almuerzo",total,method,state,p.observaciones||""]);out.forEach(function(x){ms.getRange(x.row,5).setValue(x.stock-x.cantidad);});if(family&&mode==="POR_CUPO")familyCreditApplyCupoPurchase_(ss,sid,"CAFETERIA",id,total);return{status:"success",pedidoId:id,montoTotal:total,itemsProcesados:out.length};}finally{lock.releaseLock();}}
function getCafeteriaOrders(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),role=institutionalServiceRoleKey_(a.role),sid="";if(role==="padre"){sid=String(p.estudianteUserId||"");if(sid&&!familyCreditGuardianCanAuthorizeStudent_(ss,a.userId,sid))throw new Error("FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED");}else if(role==="estudiante"||role==="alumno")sid=a.userId;else if(["administrador","director","contador","secretaria","encargadocafeteria"].indexOf(role)<0)throw new Error("ROLE_NOT_ALLOWED");var allowed=role==="padre"?familyCreditGetActiveStudentUserIdsForGuardian_(ss,a.userId):[];var rows=getOrCreateSheet(ss,"CafeteriaPedidos").getDataRange().getValues().slice(1).filter(function(r){return(!sid||String(r[2])===sid)&&(!p.pedidoId||String(r[0])===String(p.pedidoId))&&(role!=="padre"||sid||allowed.indexOf(String(r[2]))>=0);});return{status:"success",pedidos:rows.map(function(r){return{pedidoId:r[0],fecha:r[1],estudianteUserId:r[2],responsableUserId:r[3],detalleJSON:r[4],turnoEntrega:r[5],montoTotal:Number(r[6]||0),metodoPago:r[7],estado:r[8],observaciones:r[9]};})};}
function updateStoreOrderStatus(p){var ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();lock.waitLock(10000);try{var sh=getOrCreateSheet(ss,"TiendaOrdenes"),r=sh.getDataRange().getValues(),i=r.findIndex(function(x){return String(x[0])===String(p.ordenId);});if(i<1)throw new Error("STORE_ORDER_NOT_FOUND");if(familyCreditIsRequested_(r[i][6])&&p.estadoPago==="Pagado")throw new Error("FAMILY_CREDIT_PAYMENT_STATE_SERVER_MANAGED");if(familyCreditIsRequested_(r[i][6])&&familyCreditIsCancellationStatus_(p.estadoPago))familyCreditReverseApprovedOrder_(ss,"TIENDA",p.ordenId);if(p.estadoPago)sh.getRange(i+1,8).setValue(p.estadoPago);if(p.estadoEntrega)sh.getRange(i+1,9).setValue(p.estadoEntrega);if(p.observaciones!==undefined)sh.getRange(i+1,12).setValue(p.observaciones);return{status:"success",ordenId:p.ordenId};}finally{lock.releaseLock();}}
function updateCafeteriaOrderStatus(p){var ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();lock.waitLock(10000);try{var sh=getOrCreateSheet(ss,"CafeteriaPedidos"),r=sh.getDataRange().getValues(),i=r.findIndex(function(x){return String(x[0])===String(p.pedidoId);});if(i<1)throw new Error("CAFETERIA_ORDER_NOT_FOUND");if(familyCreditIsRequested_(r[i][7])&&p.nuevoEstado==="Pagado")throw new Error("FAMILY_CREDIT_PAYMENT_STATE_SERVER_MANAGED");if(familyCreditIsRequested_(r[i][7])&&familyCreditIsCancellationStatus_(p.nuevoEstado))familyCreditReverseApprovedOrder_(ss,"CAFETERIA",p.pedidoId);sh.getRange(i+1,9).setValue(p.nuevoEstado);if(p.observaciones!==undefined)sh.getRange(i+1,10).setValue(p.observaciones);return{status:"success",pedidoId:p.pedidoId};}finally{lock.releaseLock();}}
function getStudentAccountStatement(p){var a=familyCreditApprovalActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),sid=familyCreditResolveStudent_(ss,a,p.userId),c=getOrCreateSheet(ss,"CargosEstudiante").getDataRange().getValues().slice(1).filter(function(r){return String(r[2])===sid&&String(r[7])!=="Anulado";}),pay=getOrCreateSheet(ss,"PagosAbonos").getDataRange().getValues().slice(1).filter(function(r){return String(r[2])===sid&&String(r[8])!=="Anulado";}),charges=c.reduce(function(s,r){return s+Number(r[6]||0);},0),paid=pay.reduce(function(s,r){return s+Number(r[5]||0);},0),mov=familyCreditGetStatementMovements_(ss,sid),credit=mov.reduce(function(s,r){return s+(String(r.estado).toLowerCase()==="reversado"?-r.monto:r.monto);},0);return{status:"success",data:{userId:sid,totalCargos:charges,totalPagado:paid,saldoPendiente:Math.max(0,charges-paid),cargos:c,pagos:pay,consumosCreditoFamiliar:mov,totalConsumoCreditoFamiliar:credit}};}
function getFamilyCreditSalesReconciliation(p){var a=familyCreditApprovalActor_(p),role=institutionalServiceRoleKey_(a.role);if(["contador","director","administrador"].indexOf(role)<0)throw new Error("FAMILY_CREDIT_SALES_REPORT_ROLE_NOT_ALLOWED");var lock=LockService.getScriptLock();lock.waitLock(10000);try{var ss=SpreadsheetApp.openById(SPREADSHEET_ID),mov=getOrCreateSheet(ss,"CreditoFamiliarMovimientos").getDataRange().getValues().slice(1),store=getOrCreateSheet(ss,"TiendaOrdenes").getDataRange().getValues().slice(1),cafe=getOrCreateSheet(ss,"CafeteriaPedidos").getDataRange().getValues().slice(1),d=[],summary={TIENDA:{ventasNetas:0,pedidosPendientes:0},CAFETERIA:{ventasNetas:0,pedidosPendientes:0}};store.forEach(function(r){if(familyCreditIsRequested_(r[6])){if(r[7]==="PendienteAprobacionFamiliar")summary.TIENDA.pedidosPendientes++;}});cafe.forEach(function(r){if(familyCreditIsRequested_(r[7])){if(r[8]==="PendienteAprobacionFamiliar")summary.CAFETERIA.pedidosPendientes++;}});mov.forEach(function(r){var key=institutionalServiceRoleKey_(r[5]),amt=Number(r[6]||0),state=String(r[8]||"").toLowerCase();if(!summary[key==="tienda"?"TIENDA":key==="cafeteria"?"CAFETERIA":""])return;var bucket=summary[key==="tienda"?"TIENDA":"CAFETERIA"];if(state==="aprobado")bucket.ventasNetas+=amt;if(state==="reversado"){bucket.ventasNetas-=amt;var id=String(r[7]||"").replace(/^REV:/,""),orig=mov.filter(function(x){return String(x[0])===id;});if(orig.length!==1||Number(orig[0][6])!==amt||String(orig[0][3])!==String(r[3])||String(orig[0][4])!==String(r[4]))d.push({codigo:"REVERSAL_AMOUNT_OR_OWNER_MISMATCH"});}});mov.filter(function(r){return String(r[8]).toLowerCase()==="aprobado";}).forEach(function(r){var list=institutionalServiceRoleKey_(r[5])==="tienda"?store:cafe;if(!list.some(function(x){return String(x[0])===String(r[7])&&String(x[2])===String(r[3]);}))d.push({codigo:"ORPHAN_APPROVED_MOVEMENT"});});var total={ventasNetas:summary.TIENDA.ventasNetas+summary.CAFETERIA.ventasNetas,pedidosPendientes:summary.TIENDA.pedidosPendientes+summary.CAFETERIA.pedidosPendientes};return{status:"success",coincide:d.length===0,resumen:summary,total:total,discrepancias:d};}finally{lock.releaseLock();}}


function resolveStaffingNeedsAccess_(payload, ss, writeRequired) {
  var actor;
  if (typeof requestAccountingUserAuthorization_ === "function") actor = getVerifiedAccountingIdentity_(payload || {});
  else if (typeof verifySessionToken === "function") {
    var claims = verifySessionToken(String(payload && payload.sessionToken || ""));
    actor = claims ? { authorized:true, userId:claims.userId, role:claims.role,
      institutionId:claims.institutionId || "", membershipId:claims.membershipId || "" } : null;
  }
  if (!actor || actor.authorized !== true) return { authorized:false, code:actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = normalizeVacationRole_(actor.role);
  if (writeRequired && role !== "recursoshumanos") return { authorized:false, code:"ROLE_NOT_ALLOWED" };
  if (!writeRequired && ["recursoshumanos","administrador"].indexOf(role) < 0) return { authorized:false, code:"ROLE_NOT_ALLOWED" };
  var scope;
  if (typeof getVerifiedDepartmentScopeForSession_ === "function" && getVerifiedDepartmentScopeForSession_.length >= 3) {
    scope = getVerifiedDepartmentScopeForSession_(payload || {}, ss, actor);
  } else {
    scope = getVerifiedAccountingDepartmentScope_(payload || {}, ss, actor);
  }
  var scopeRole = scope && (scope.roleId || scope.role) || "";
  if (!scope || (scope.valid !== true && scope.authorized !== true) ||
      String(scope.userId || "") !== String(actor.userId || "") ||
      String(scopeRole || "") !== String(actor.role || "") ||
      String(scope.institutionId || "") !== String(actor.institutionId || "I")) {
    return { authorized:false, code:"DEPARTMENT_SCOPE_NOT_ASSIGNED" };
  }
  if (writeRequired && (scope.institutionWide === true || !Array.isArray(scope.departmentIds) || !scope.departmentIds.length)) {
    return { authorized:false, code:"DEPARTMENT_SCOPE_NOT_ASSIGNED" };
  }
  return { authorized:true, actor:actor, role:role, scope:scope };
}

function ensureStaffingNeedsWriteSheet_(ss) {
  var headers = ["PlanificacionID","PeriodoAcademico","DepartamentoArea","PuestoOFamilia","CantidadRequerida",
    "EscenarioMatricula","MetricaBaseCalculo","ObservacionesJustificacion","VacanteRelacionadaID","CreadoPor",
    "FechaCreacion","UltimaModificacion"];
  var sheet = getOrCreateSheet(ss, "PlanificacionNecesidadesPersonal");
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length || !values[0] || !values[0].length) {
    sheet.appendRow(headers.slice());
    values = [headers.slice()];
  }
  var actual = values[0].map(function(value) { return String(value || "").trim(); });
  if (JSON.stringify(actual) !== JSON.stringify(headers)) return { valid:false, code:"RESOURCE_SCHEMA_INVALID", sheet:sheet, headers:headers };
  return { valid:true, sheet:sheet, headers:headers };
}

function manageStaffingNeeds(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = resolveStaffingNeedsAccess_(input, ss, true);
  if (!access.authorized) return { status:"error", code:access.code };
  var department = resolveStaffingDepartmentReference_(ss, input.departamentoArea);
  if (!department.resolved) return { status:"error", code:department.code };
  var assigned = (access.scope.departmentIds || []).map(function(value) { return String(value || "").trim(); });
  if (access.scope.institutionWide === true || assigned.indexOf(department.departmentId) < 0) return { status:"error", code:"RESOURCE_SCOPE_DENIED" };
  var vacancyId = String(input.vacanteRelacionadaId || "").trim();
  if (vacancyId) {
    var vacancies = ss.getSheetByName("VacantesLaborales");
    if (!vacancies) return { status:"error", code:"RESOURCE_NOT_FOUND" };
    var vacancyRows = vacancies.getDataRange().getValues(), vh = (vacancyRows[0] || []).map(function(v) { return String(v || "").trim(); });
    var vi = vh.indexOf("VacanteID"), vd = vh.indexOf("Departamento");
    if (vi < 0 || vd < 0) return { status:"error", code:"RESOURCE_SCHEMA_INVALID" };
    var vacancyMatches = vacancyRows.slice(1).filter(function(row) { return String(row[vi] || "").trim() === vacancyId; });
    if (vacancyMatches.length !== 1 || String(vacancyMatches[0][vd] || "").trim() !== department.departmentId) return { status:"error", code:"RESOURCE_NOT_FOUND" };
  }
  var planId = String(input.planificacionId || "").trim(), existingSnapshot = null, candidateId = "";
  var currentSheet = ss.getSheetByName("PlanificacionNecesidadesPersonal");
  var expectedHeaders = ["PlanificacionID","PeriodoAcademico","DepartamentoArea","PuestoOFamilia","CantidadRequerida",
    "EscenarioMatricula","MetricaBaseCalculo","ObservacionesJustificacion","VacanteRelacionadaID","CreadoPor","FechaCreacion","UltimaModificacion"];
  if (planId) {
    if (!currentSheet) return { status:"error", code:"RESOURCE_NOT_FOUND" };
    var currentRows = currentSheet.getDataRange().getValues();
    if (!currentRows.length || JSON.stringify(currentRows[0].map(function(v) { return String(v || "").trim(); })) !== JSON.stringify(expectedHeaders)) {
      return { status:"error", code:"RESOURCE_SCHEMA_INVALID" };
    }
    var preflight = currentRows.slice(1).filter(function(row) { return String(row[0] || "").trim() === planId; });
    if (preflight.length !== 1 || String(preflight[0][2] || "").trim() !== department.departmentId) return { status:"error", code:"RESOURCE_NOT_FOUND" };
    existingSnapshot = preflight[0];
  }
  if (!planId) {
    candidateId = "PLAN-NEC-" + String(Utilities.getUuid()).replace(/-/g,"").slice(0,24);
    var existingRows = currentSheet ? currentSheet.getDataRange().getValues().slice(1) : [];
    if (existingRows.some(function(row) { return String(row[0] || "").trim() === candidateId; })) return { status:"error", code:"STAFFING_PLAN_ID_COLLISION" };
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status:"error", code:"CONCURRENT_UPDATE_RETRY" };
  try {
    var schema = ensureStaffingNeedsWriteSheet_(ss);
    if (!schema.valid) return { status:"error", code:schema.code };
    var quantity = input.cantidadRequerida === undefined
      ? (existingSnapshot ? Number(existingSnapshot[4]) : 1) : Number(input.cantidadRequerida);
    if (!isFinite(quantity) || quantity <= 0 || Math.floor(quantity) !== quantity) return { status:"error", code:"STAFFING_QUANTITY_INVALID" };
    var period = String(input.periodoAcademico || existingSnapshot && existingSnapshot[1] || "").trim();
    var position = String(input.puestoOFamilia || existingSnapshot && existingSnapshot[3] || "").trim();
    if (!period || !position) return { status:"error", code:"STAFFING_FIELDS_REQUIRED" };
    var rows = schema.sheet.getDataRange().getValues(), row, now = new Date();
    if (planId) {
      var existing = rows.slice(1).map(function(value,index) { return {row:value,index:index}; })
        .filter(function(item) { return String(item.row[0] || "").trim() === planId; });
      if (existing.length !== 1 || String(existing[0].row[2] || "").trim() !== department.departmentId) return { status:"error", code:"RESOURCE_NOT_FOUND" };
      row = existing[0].row.slice();
      row[1] = period; row[2] = department.departmentId; row[3] = position; row[4] = quantity;
      row[5] = String(input.escenarioMatricula || row[5] || "Base");
      row[6] = String(input.metricaBaseCalculo || row[6] || "Manual");
      row[7] = input.observacionesJustificacion === undefined ? row[7] : String(input.observacionesJustificacion || "").slice(0,1000);
      row[8] = vacancyId || row[8] || ""; row[11] = now;
      try { schema.sheet.getRange(existing[0].index + 2,1,1,row.length).setValues([row]); }
      catch (_) { return { status:"error", code:"STAFFING_PLAN_WRITE_FAILED" }; }
      return { status:"success", planificacionId:planId, departamentoArea:department.departmentId };
    }
    if (rows.slice(1).some(function(value) { return String(value[0] || "").trim() === candidateId; })) return { status:"error", code:"STAFFING_PLAN_ID_COLLISION" };
    row = [candidateId,period,department.departmentId,position,quantity,String(input.escenarioMatricula || "Base"),
      String(input.metricaBaseCalculo || "Manual"),String(input.observacionesJustificacion || "").slice(0,1000),
      vacancyId,String(access.actor.userId),now,now];
    try { schema.sheet.appendRow(row); }
    catch (_) { return { status:"error", code:"STAFFING_PLAN_WRITE_FAILED" }; }
    return { status:"success", planificacionId:candidateId, departamentoArea:department.departmentId };
  } finally { lock.releaseLock(); }
}
function getStaffingNeedsPlanning(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = resolveStaffingNeedsAccess_(input, ss, false);
  if (!access.authorized) return { status:"error", code:access.code };
  var scope = access.scope, allowed = Array.isArray(scope.departmentIds) ? scope.departmentIds.map(String) : [];
  var departmentFilter = String(input.departamentoArea || "").trim();
  var filterId = "";
  if (departmentFilter) {
    var resolved = resolveStaffingDepartmentReference_(ss, departmentFilter);
    if (resolved.resolved) filterId = resolved.departmentId;
    else filterId = departmentFilter;
  }
  var inScope = function(id) { return scope.institutionWide === true || allowed.indexOf(String(id || "").trim()) >= 0; };
  var filterAllowed = !filterId || inScope(filterId);
  var planSheet = ss.getSheetByName("PlanificacionNecesidadesPersonal");
  var planRows = planSheet ? planSheet.getDataRange().getValues() : [];
  var expected = ["PlanificacionID","PeriodoAcademico","DepartamentoArea","PuestoOFamilia","CantidadRequerida",
    "EscenarioMatricula","MetricaBaseCalculo","ObservacionesJustificacion","VacanteRelacionadaID","CreadoPor",
    "FechaCreacion","UltimaModificacion"];
  if (planRows.length && JSON.stringify(planRows[0].map(function(v) { return String(v || "").trim(); })) !== JSON.stringify(expected)) {
    return { status:"error", code:"RESOURCE_SCHEMA_INVALID" };
  }
  var projections = planRows.slice(1).filter(function(row) {
    var dept = String(row[2] || "").trim();
    return inScope(dept) && filterAllowed && (!filterId || dept === filterId);
  }).map(function(row) {
    return { planificacionId:row[0], periodoAcademico:row[1], departamentoArea:row[2], puestoOFamilia:row[3],
      cantidadRequerida:Number(row[4] || 0), escenarioMatricula:row[5], metricaBaseCalculo:row[6],
      observacionesJustificacion:row[7], vacanteRelacionadaId:row[8], creadoPor:row[9],
      fechaCreacion:row[10], ultimaModificacion:row[11] };
  });
  var departmentsSheet = ss.getSheetByName("DepartamentosAcademicos"), departmentRows = departmentsSheet ? departmentsSheet.getDataRange().getValues() : [];
  var deptNames = {};
  if (departmentRows.length) {
    var dh = departmentRows[0].map(String), di = dh.indexOf("DepartamentoID"), dn = dh.indexOf("Nombre");
    departmentRows.slice(1).forEach(function(row) { if (di >= 0 && dn >= 0) deptNames[String(row[di])] = String(row[dn] || row[di]); });
  }
  var selectedDepartments = filterId ? (filterAllowed ? [filterId] : []) :
    (scope.institutionWide === true ? Object.keys(deptNames) : allowed);
  var employeesSheet = ss.getSheetByName("ExpedientesLaborales"), employees = employeesSheet ? employeesSheet.getDataRange().getValues() : [];
  var vacanciesSheet = ss.getSheetByName("VacantesLaborales"), vacancies = vacanciesSheet ? vacanciesSheet.getDataRange().getValues() : [];
  var activeEmployees = employees.slice(1).filter(function(row) {
    var employeeDepartment = String(row[4] || "").trim();
    var matchesDepartment = selectedDepartments.some(function(id) {
      return employeeDepartment === String(id) || employeeDepartment === String(deptNames[id] || "");
    });
    return matchesDepartment && String(row[8] || "").trim().toLowerCase() === "activo";
  });
  var activeVacancies = vacancies.slice(1).filter(function(row) {
    return selectedDepartments.indexOf(String(row[2] || "").trim()) >= 0 &&
      ["abierta","publicada","open","published"].indexOf(String(row[7] || "").trim().toLowerCase()) >= 0;
  });
  var comparativa = selectedDepartments.map(function(id) {
    var plans = projections.filter(function(row) { return String(row.departamentoArea) === String(id); });
    var staffCount = activeEmployees.filter(function(row) { return String(row[4]) === String(id); }).length;
    var vacancyCount = activeVacancies.filter(function(row) { return String(row[2]) === String(id); }).length;
    return { departamentoArea:deptNames[id] || id, departamentoId:id, totalProyecciones:plans.length,
      personalActivoCount:staffCount, vacantesActivasCount:vacancyCount,
      cantidadRequerida:plans.reduce(function(sum,row) { return sum + row.cantidadRequerida; },0) };
  });
  return { status:"success", data:{ proyecciones:projections, totalProyecciones:projections.length,
    personalActivoCount:activeEmployees.length, vacantesActivasCount:activeVacancies.length, comparativa:comparativa } };
}


function resolveWorkShiftEmployeeWriteAccess_(payload, ss, employeeUserId, identityOverride) {
  var actor = identityOverride;
  if (!actor) {
    if (typeof requestAccountingUserAuthorization_ === "function") actor = getVerifiedAccountingIdentity_(payload || {});
    else if (typeof verifySessionToken === "function") {
      var claims = verifySessionToken(String(payload && payload.sessionToken || ""));
      actor = claims ? { authorized:true,userId:claims.userId,role:claims.role,
        institutionId:claims.institutionId || "",membershipId:claims.membershipId || "" } : null;
    }
  }
  if (!actor || actor.authorized !== true) return { authorized:false,code:actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  if (normalizeVacationRole_(actor.role) !== "recursoshumanos") return { authorized:false,code:"ROLE_NOT_ALLOWED" };
  var scope;
  if (typeof getVerifiedDepartmentScopeForSession_ === "function" && getVerifiedDepartmentScopeForSession_.length >= 3) {
    scope = getVerifiedDepartmentScopeForSession_(payload || {}, ss, actor);
  } else {
    scope = getVerifiedAccountingDepartmentScope_(payload || {}, ss, actor);
  }
  var scopeRole = scope && (scope.roleId || scope.role) || "";
  if (!scope || (scope.valid !== true && scope.authorized !== true) ||
      String(scope.userId || "") !== String(actor.userId || "") ||
      String(scopeRole) !== String(actor.role || "") ||
      String(scope.institutionId || "") !== String(actor.institutionId || "I")) {
    return { authorized:false,code:"DEPARTMENT_SCOPE_NOT_ASSIGNED" };
  }
  var id = String(employeeUserId || "").trim();
  if (!id) return { authorized:false,code:"RESOURCE_NOT_FOUND" };
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!sheet) return { authorized:false,code:"RESOURCE_NOT_FOUND" };
  var values = sheet.getDataRange().getValues(), headers = (values[0] || []).map(function(v) { return String(v || "").trim(); });
  var expedienteIndex = headers.indexOf("ExpedienteID"), userIndex = headers.indexOf("UserId");
  var departmentIndex = headers.indexOf("Departamento"), stateIndex = headers.indexOf("EstadoLaboral");
  if ([expedienteIndex,userIndex,departmentIndex,stateIndex].some(function(i) { return i < 0; })) {
    return { authorized:false,code:"RESOURCE_SCHEMA_INVALID" };
  }
  var matches = values.slice(1).filter(function(row) { return String(row[userIndex] || "").trim() === id; });
  if (matches.length !== 1 || String(matches[0][stateIndex] || "").trim().toLowerCase() !== "activo") {
    return { authorized:false,code:"RESOURCE_NOT_FOUND" };
  }
  var expedienteId = String(matches[0][expedienteIndex] || "").trim();
  var departmentId = String(matches[0][departmentIndex] || "").trim();
  var departments = Array.isArray(scope.departmentIds) ? scope.departmentIds.map(String) : [];
  if (!expedienteId || (scope.institutionWide !== true && departments.indexOf(departmentId) < 0)) {
    return { authorized:false,code:"RESOURCE_NOT_FOUND" };
  }
  var ownership = assertResourceOwnershipForScope_(ss, scope, "EXPEDIENTE_LABORAL", expedienteId, "WRITE");
  if (!ownership || ownership.authorized !== true) return { authorized:false,code:"RESOURCE_NOT_FOUND" };
  return { authorized:true,actor:actor,scope:scope,employeeId:id,expedienteId:expedienteId,departmentId:departmentId };
}

function ensureWorkShiftWriteSheet_(ss, sheetName) {
  var name = sheetName === "SustitucionesPersonal" ? "SustitucionesPersonal" : "AsignacionesTurnosLaborales";
  var headers = name === "SustitucionesPersonal"
    ? ["SustitucionID","EmpleadoSustitutoID","EmpleadoSustituidoID","FechaInicio","FechaFin","HoraEntrada","HoraSalida","MotivoSustitucion","DepartamentoArea","Estado","CreadoPor","FechaCreacion","UltimaModificacion"]
    : ["AsignacionTurnoID","EmpleadoID","NombreTurno","FechaInicio","FechaFin","HoraEntrada","HoraSalida","DepartamentoArea","Estado","CreadoPor","FechaCreacion","UltimaModificacion"];
  var sheet = getOrCreateSheet(ss, name), values = sheet.getDataRange().getValues();
  if (!values || !values.length || !values[0] || !values[0].length) {
    sheet.appendRow(headers.slice());
    values = [headers.slice()];
  }
  var actual = values[0].map(function(value) { return String(value || "").trim(); });
  if (JSON.stringify(actual) !== JSON.stringify(headers)) return { valid:false,code:"RESOURCE_SCHEMA_INVALID",sheet:sheet,headers:headers };
  return { valid:true,sheet:sheet,headers:headers };
}

function manageWorkShiftAndSubstitution(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var operation = String(input.tipoOperacion || "").trim();
  if (["AsignarTurno","RegistrarSustitucion"].indexOf(operation) < 0) return { status:"error",code:"WORK_SHIFT_OPERATION_INVALID" };
  var primary = resolveWorkShiftEmployeeWriteAccess_(input, ss, input.empleadoId);
  if (!primary.authorized) return { status:"error",code:primary.code };
  var substitute = null;
  if (operation === "RegistrarSustitucion") {
    substitute = resolveWorkShiftEmployeeWriteAccess_(input, ss, input.empleadoSustituidoId, primary.actor);
    if (!substitute.authorized) return { status:"error",code:substitute.code === "RESOURCE_SCHEMA_INVALID" ? substitute.code : "RESOURCE_NOT_FOUND" };
    if (primary.employeeId === substitute.employeeId) return { status:"error",code:"WORK_SHIFT_SUBSTITUTE_INVALID" };
  }
  var startText = String(input.fechaInicio || "").trim(), endText = String(input.fechaFin || "").trim();
  var datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(startText) || !datePattern.test(endText)) return { status:"error",code:"WORK_SHIFT_DATE_INVALID" };
  var startDate = new Date(startText + "T00:00:00"), endDate = new Date(endText + "T00:00:00");
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startText > endText) return { status:"error",code:"WORK_SHIFT_DATE_RANGE_INVALID" };
  var entryTime = String(input.horaEntrada || "07:00").trim(), exitTime = String(input.horaSalida || "15:00").trim();
  var timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(entryTime) || !timePattern.test(exitTime)) return { status:"error",code:"WORK_SHIFT_TIME_INVALID" };
  var sheetName = operation === "RegistrarSustitucion" ? "SustitucionesPersonal" : "AsignacionesTurnosLaborales";
  var recordId = String(input.registroId || "").trim(), lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status:"error",code:"CONCURRENT_UPDATE_RETRY" };
  try {
    var schema = ensureWorkShiftWriteSheet_(ss, sheetName);
    if (!schema.valid) return { status:"error",code:schema.code };
    var rows = schema.sheet.getDataRange().getValues(), now = new Date(), row;
    if (recordId) {
      var matches = rows.slice(1).map(function(value,index) { return {row:value,index:index}; })
        .filter(function(item) { return String(item.row[0] || "").trim() === recordId; });
      if (matches.length !== 1) return { status:"error",code:"RESOURCE_NOT_FOUND" };
      row = matches[0].row.slice();
      var departmentColumn = operation === "RegistrarSustitucion" ? 8 : 7;
      if (String(row[1] || "") !== primary.employeeId ||
          String(row[departmentColumn] || "") !== primary.departmentId) return { status:"error",code:"RESOURCE_NOT_FOUND" };
      if (operation === "AsignarTurno") {
        row[2] = String(input.nombreTurno || row[2] || "Turno").slice(0,100);
        row[3] = startText; row[4] = endText; row[5] = entryTime; row[6] = exitTime;
        row[8] = String(input.estado || row[8] || "Asignado"); row[11] = now;
      } else {
        row[1] = primary.employeeId; row[2] = substitute.employeeId;
        row[3] = startText; row[4] = endText; row[5] = entryTime; row[6] = exitTime;
        row[7] = String(input.motivoSustitucion || row[7] || "").slice(0,500);
        row[8] = primary.departmentId; row[9] = String(input.estado || row[9] || "Pendiente"); row[12] = now;
      }
      try { schema.sheet.getRange(matches[0].index + 2,1,1,row.length).setValues([row]); }
      catch (_) { return { status:"error",code:"WORK_SHIFT_WRITE_FAILED" }; }
      return { status:"success",registroId:recordId,tipoOperacion:operation };
    }
    var id = (operation === "AsignarTurno" ? "TURN-" : "SUB-") + String(Utilities.getUuid()).replace(/-/g,"").slice(0,24);
    if (rows.slice(1).some(function(value) { return String(value[0] || "") === id; })) return { status:"error",code:"WORK_SHIFT_ID_COLLISION" };
    if (operation === "AsignarTurno") {
      row = [id,primary.employeeId,String(input.nombreTurno || "Turno").slice(0,100),startText,endText,entryTime,exitTime,
        primary.departmentId,String(input.estado || "Asignado"),primary.actor.userId,now,now];
    } else {
      row = [id,primary.employeeId,substitute.employeeId,startText,endText,entryTime,exitTime,
        String(input.motivoSustitucion || "").slice(0,500),primary.departmentId,String(input.estado || "Pendiente"),
        primary.actor.userId,now,now];
    }
    try { schema.sheet.appendRow(row); }
    catch (_) { return { status:"error",code:"WORK_SHIFT_WRITE_FAILED" }; }
    return { status:"success",registroId:id,tipoOperacion:operation };
  } finally { lock.releaseLock(); }
}

function parseJsonSafe(jsonStr, fallback) {
  if (!jsonStr) return fallback;
  try { return JSON.parse(jsonStr); } catch (e) { return fallback; }
}

// [TAREA RH-06] [Fase Recursos Humanos] - Catálogo de capacitaciones, inscripciones, certificados con vencimiento y planes de desarrollo profesional.

function getEmployeeContracts(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var permission = validateRolePermission(actor, "getEmployeeContracts");
  if (!permission.authorized) return { status: "error", code: permission.code };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), sheet = ss.getSheetByName("ContratosLaborales");
  if (!sheet) return { status: "success", contratos: [] };
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { status: "success", contratos: [] };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var required = ["ContratoID","ExpedienteID","TipoContrato","FechaInicio","FechaFin","SalarioBase","Jornada","EstadoContrato","Observaciones"], idx = {};
  headers.forEach(function(name, i) { idx[name] = i; });
  if (required.some(function(name) { return idx[name] === undefined; })) return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
  var requestedId = String(input.expedienteId || "").trim(), accessIndex = getEmployeeResourceAccessIndex_(input, ss, actor);
  if (!accessIndex.valid) return { status: "error", code: accessIndex.code };
  if (["empleado","profesor"].indexOf(normalizeVacationRole_(actor.role)) !== -1 && !accessIndex.byUserId[String(actor.userId || "")]) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  if (requestedId && !accessIndex.byExpedienteId[requestedId]) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var rows = values.slice(1), counts = {};
  rows.forEach(function(row) { var id = String(row[idx.ContratoID] || "").trim(); if (id) counts[id] = (counts[id] || 0) + 1; });
  var contratos = rows.filter(function(row) {
    var id = String(row[idx.ContratoID] || "").trim(), expedienteId = String(row[idx.ExpedienteID] || "").trim();
    return !!id && counts[id] === 1 && !!accessIndex.byExpedienteId[expedienteId] && (!requestedId || requestedId === expedienteId);
  }).map(function(row) { return { contratoId: row[idx.ContratoID], expedienteId: row[idx.ExpedienteID], tipoContrato: row[idx.TipoContrato],
    fechaInicio: row[idx.FechaInicio], fechaFin: row[idx.FechaFin], salarioBase: parseFloat(row[idx.SalarioBase] || 0),
    jornada: row[idx.Jornada], estadoContrato: row[idx.EstadoContrato], observaciones: row[idx.Observaciones] }; });
  return { status: "success", contratos: contratos };
}

// ---------------------------------------------------------------------------
// PERMISOS Y VACACIONES
// ---------------------------------------------------------------------------

function getEmployeeContractAlerts(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var permission = validateRolePermission(actor, "getEmployeeContractAlerts");
  if (!permission.authorized) return { status: "error", code: permission.code };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), sheet = ss.getSheetByName("ContratosLaborales");
  if (!sheet) return { status: "success", data: [], resumen: { vigentes: 0, proximosAVencer: 0, vencidos: 0, totalContratos: 0 } };
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { status: "success", data: [], resumen: { vigentes: 0, proximosAVencer: 0, vencidos: 0, totalContratos: 0 } };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var required = ["ContratoID","ExpedienteID","TipoContrato","FechaInicio","FechaFin","EstadoContrato","Observaciones"], idx = {};
  headers.forEach(function(name, i) { idx[name] = i; });
  if (required.some(function(name) { return idx[name] === undefined; })) return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
  var accessIndex = getEmployeeResourceAccessIndex_(input, ss, actor);
  if (!accessIndex.valid) return { status: "error", code: accessIndex.code };
  var requestedId = String(input.expedienteId || "").trim();
  if (requestedId && !accessIndex.byExpedienteId[requestedId]) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var rows = values.slice(1), counts = {};
  rows.forEach(function(row) { var id = String(row[idx.ContratoID] || "").trim(); if (id) counts[id] = (counts[id] || 0) + 1; });
  var today = new Date(); today.setHours(0,0,0,0), threshold = Math.max(0, Math.min(365, parseInt(input.diasAnticipacion || 30, 10) || 30));
  var data = rows.filter(function(row) { var id = String(row[idx.ContratoID] || "").trim(), exp = String(row[idx.ExpedienteID] || "").trim();
    return !!id && counts[id] === 1 && !!accessIndex.byExpedienteId[exp] && (!requestedId || requestedId === exp);
  }).map(function(row) {
    var end = row[idx.FechaFin] ? new Date(row[idx.FechaFin]) : null, days = null, state = "Vigente";
    if (end && !isNaN(end.getTime())) { end.setHours(0,0,0,0); days = Math.ceil((end.getTime()-today.getTime())/86400000); state = days<0?"Vencido":days<=threshold?"ProximoAVencer":"Vigente"; }
    return { contratoId:row[idx.ContratoID],expedienteId:row[idx.ExpedienteID],tipoContrato:row[idx.TipoContrato],fechaInicio:row[idx.FechaInicio],fechaFin:row[idx.FechaFin],estadoContrato:row[idx.EstadoContrato],estadoAlerta:state,diasParaVencer:days,observaciones:row[idx.Observaciones] };
  });
  return { status:"success",data:data,resumen:{vigentes:data.filter(function(x){return x.estadoAlerta==="Vigente";}).length,proximosAVencer:data.filter(function(x){return x.estadoAlerta==="ProximoAVencer";}).length,vencidos:data.filter(function(x){return x.estadoAlerta==="Vencido";}).length,totalContratos:data.length} };
}

// [TAREA RH-03] [Fase Reclutamiento y Selección] - Creación, consulta y actualización de vacantes laborales institucionales.

function getEmployeeTrainingHistory(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var permission = validateRolePermission(actor, "getEmployeeTrainingHistory");
  if (!permission.authorized) return { status: "error", code: permission.code };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), accessIndex = getEmployeeResourceAccessIndex_(input, ss, actor);
  if (!accessIndex.valid) return { status: "error", code: accessIndex.code };
  var requestedEmployee = String(input.empleadoId || "").trim(), role = normalizeVacationRole_(actor.role);
  if (["empleado","profesor"].indexOf(role) !== -1) {
    if (requestedEmployee && requestedEmployee !== String(actor.userId || "")) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    requestedEmployee = String(actor.userId || "");
  }
  if (requestedEmployee && !accessIndex.byUserId[requestedEmployee]) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var coursesSheet=ss.getSheetByName("CatalogoCursosCapacitacion"),enrollmentsSheet=ss.getSheetByName("InscripcionesCapacitacion"),plansSheet=ss.getSheetByName("PlanesDesarrolloProfesional");
  var cv=coursesSheet?coursesSheet.getDataRange().getValues():[[]],ev=enrollmentsSheet?enrollmentsSheet.getDataRange().getValues():[[]],pv=plansSheet?plansSheet.getDataRange().getValues():[[]];
  var cursos=[],inscripciones=[],planesDesarrollo=[];
  if(cv.length>1){var ch=cv[0].map(String),ci={id:ch.indexOf("CursoID"),name:ch.indexOf("NombreCurso"),category:ch.indexOf("Categoria"),provider:ch.indexOf("ProveedorResponsable"),mode:ch.indexOf("Modalidad"),duration:ch.indexOf("DuracionHoras"),requirements:ch.indexOf("Requisitos"),target:ch.indexOf("DirigidoA"),state:ch.indexOf("Estado")};if(Object.keys(ci).some(function(k){return ci[k]<0;}))return{status:"error",code:"RESOURCE_SCHEMA_INVALID"};var cc={};cv.slice(1).forEach(function(r){var id=String(r[ci.id]||"").trim();if(id)cc[id]=(cc[id]||0)+1;});cursos=cv.slice(1).filter(function(r){var id=String(r[ci.id]||"").trim();return !!id&&cc[id]===1;}).map(function(r){var req=[];try{req=JSON.parse(String(r[ci.requirements]||"[]"));}catch(e){}return{cursoId:r[ci.id],nombreCurso:r[ci.name],categoria:r[ci.category],proveedorResponsable:r[ci.provider],modalidad:r[ci.mode],duracionHoras:r[ci.duration],requisitos:Array.isArray(req)?req:[],dirigidoA:r[ci.target],estado:r[ci.state]};});}
  if(ev.length>1){var eh=ev[0].map(String),ei={id:eh.indexOf("InscripcionID"),course:eh.indexOf("CursoID"),employee:eh.indexOf("EmpleadoID"),date:eh.indexOf("FechaInscripcion"),state:eh.indexOf("EstadoInscripcion"),attendance:eh.indexOf("AsistenciaPorcentaje"),grade:eh.indexOf("ResultadoNota"),file:eh.indexOf("CertificadoDriveUrl"),issued:eh.indexOf("FechaEmisionCertificado"),expires:eh.indexOf("FechaVencimientoCertificado"),notes:eh.indexOf("Observaciones"),created:eh.indexOf("FechaCreacion")};if(Object.keys(ei).some(function(k){return ei[k]<0;}))return{status:"error",code:"RESOURCE_SCHEMA_INVALID"};var ec={};ev.slice(1).forEach(function(r){var id=String(r[ei.id]||"").trim();if(id)ec[id]=(ec[id]||0)+1;});var now=new Date(),limit=Math.max(0,Math.min(365,parseInt(input.diasAnticipacion||30,10)||30));inscripciones=ev.slice(1).filter(function(r){var id=String(r[ei.id]||"").trim(),user=String(r[ei.employee]||"").trim();if(!id||ec[id]!==1||!accessIndex.byUserId[user]||(requestedEmployee&&user!==requestedEmployee)||(input.cursoId&&String(r[ei.course])!==String(input.cursoId)))return false;if(input.soloProximosVencimientos){var d=r[ei.expires]?new Date(r[ei.expires]):null;if(!d||isNaN(d.getTime()))return false;var days=Math.ceil((d.getTime()-now.getTime())/86400000);if(days<0||days>limit)return false;}return true;}).map(function(r){return{inscripcionId:r[ei.id],cursoId:r[ei.course],nombreCurso:(cursos.find(function(c){return String(c.cursoId)===String(r[ei.course]);})||{}).nombreCurso||String(r[ei.course]),empleadoId:r[ei.employee],fechaInscripcion:r[ei.date],estadoInscripcion:r[ei.state],asistenciaPorcentaje:r[ei.attendance],resultadoNota:r[ei.grade],certificadoDriveUrl:r[ei.file],fechaEmisionCertificado:r[ei.issued],fechaVencimientoCertificado:r[ei.expires],observaciones:r[ei.notes],fechaCreacion:r[ei.created]};});}
  if(pv.length>1){var ph=pv[0].map(String),pi={id:ph.indexOf("PlanID"),employee:ph.indexOf("EmpleadoID"),title:ph.indexOf("TituloObjetivo"),description:ph.indexOf("Descripcion"),goals:ph.indexOf("MetasAccionesJSON"),start:ph.indexOf("FechaInicio"),target:ph.indexOf("FechaMeta"),state:ph.indexOf("EstadoObjetivo"),review:ph.indexOf("EvaluacionSeguimiento"),created:ph.indexOf("FechaCreacion")};if(Object.keys(pi).some(function(k){return pi[k]<0;}))return{status:"error",code:"RESOURCE_SCHEMA_INVALID"};var pc={};pv.slice(1).forEach(function(r){var id=String(r[pi.id]||"").trim();if(id)pc[id]=(pc[id]||0)+1;});planesDesarrollo=pv.slice(1).filter(function(r){var id=String(r[pi.id]||"").trim(),user=String(r[pi.employee]||"").trim();return !!id&&pc[id]===1&&!!accessIndex.byUserId[user]&&(!requestedEmployee||user===requestedEmployee);}).map(function(r){var goals=[];try{goals=JSON.parse(String(r[pi.goals]||"[]"));}catch(e){}return{planId:r[pi.id],empleadoId:r[pi.employee],tituloObjetivo:r[pi.title],descripcion:r[pi.description],metasAcciones:Array.isArray(goals)?goals:[],fechaInicio:r[pi.start],fechaMeta:r[pi.target],estadoObjetivo:r[pi.state],evaluacionSeguimiento:r[pi.review],fechaCreacion:r[pi.created]};});}
  return {status:"success",data:{cursos:cursos,inscripciones:inscripciones,planesDesarrollo:planesDesarrollo}};
}

function getLaborIncidentsHistory(payload) {
  const {
    empleadoId,
    incidenciaId,
    estado,
    categoria,
    userRole
  } = payload || {};

  // Restringir acceso solo a roles autorizados de RRHH / Dirección
  const allowedRoles = ["RecursosHumanos", "Director", "Administrador", "Subdirector"];
  if (userRole && !allowedRoles.includes(userRole)) {
    throw new Error("Acceso denegado. Los registros de incidencias laborales y medidas disciplinarias están restringidos a la Oficina de Recursos Humanos y Dirección.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Incidencias
  const incSheet = getOrCreateSheet(ss, "IncidenciasLaborales");
  const incData = incSheet.getDataRange().getValues();
  let incidencias = [];

  if (incData.length > 1) {
    incidencias = incData.slice(1).filter(r => {
      if (empleadoId && String(r[1]).trim() !== String(empleadoId).trim()) return false;
      if (incidenciaId && String(r[0]).trim() !== String(incidenciaId).trim()) return false;
      if (categoria && String(r[3]).toLowerCase() !== String(categoria).toLowerCase()) return false;
      if (estado && String(r[6]).toLowerCase() !== String(estado).toLowerCase()) return false;
      return true;
    }).map(r => ({
      incidenciaId: r[0],
      empleadoId: r[1],
      fecha: r[2],
      categoria: r[3],
      descripcionObjetiva: r[4],
      responsableRegistro: r[5],
      estado: r[6],
      responsabilidadEstablecida: Boolean(r[7]),
      documentacionDriveUrl: r[8],
      observacionesAclaraciones: r[9],
      historialAclaraciones: parseJsonSafe(r[10], []),
      creadoPor: r[11],
      fechaCreacion: r[12]
    }));
  }

  // Medidas Disciplinarias
  const medSheet = getOrCreateSheet(ss, "MedidasDisciplinarias");
  const medData = medSheet.getDataRange().getValues();
  let medidasDisciplinarias = [];

  if (medData.length > 1) {
    medidasDisciplinarias = medData.slice(1).filter(r => {
      if (empleadoId && String(r[2]).trim() !== String(empleadoId).trim()) return false;
      if (incidenciaId && String(r[1]).trim() !== String(incidenciaId).trim()) return false;
      return true;
    }).map(r => ({
      medidaId: r[0],
      incidenciaId: r[1],
      empleadoId: r[2],
      tipoMedida: r[3],
      fundamentoDocumentado: r[4],
      fechaEfectiva: r[5],
      responsableAprobacion: r[6],
      estadoMedida: r[7],
      diasSuspension: parseInt(r[8] || 0, 10),
      actaFirmadaDriveUrl: r[9],
      fechaCreacion: r[11]
    }));
  }

  return {
    status: "success",
    data: {
      incidencias,
      medidasDisciplinarias
    }
  };
}

function getWorkShiftsAndSubstitutionsHistory(payload) {
  const { empleadoId, departamentoArea } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. Asignaciones de Turnos
  const turnosSheet = getOrCreateSheet(ss, "AsignacionesTurnosLaborales");
  const turnosData = turnosSheet.getDataRange().getValues();
  let turnos = [];

  if (turnosData.length > 1) {
    turnos = turnosData.slice(1).filter(r => {
      if (empleadoId && String(r[1]).trim() !== String(empleadoId).trim()) return false;
      if (departamentoArea && String(r[7]).toLowerCase() !== String(departamentoArea).toLowerCase()) return false;
      return true;
    }).map(r => ({
      asignacionTurnoId: r[0],
      empleadoId: r[1],
      nombreTurno: r[2],
      fechaInicio: r[3],
      fechaFin: r[4],
      horaEntrada: r[5],
      horaSalida: r[6],
      departamentoArea: r[7],
      estado: r[8],
      creadoPor: r[9],
      fechaCreacion: r[10]
    }));
  }

  // 2. Sustituciones
  const sustSheet = getOrCreateSheet(ss, "SustitucionesPersonal");
  const sustData = sustSheet.getDataRange().getValues();
  let sustituciones = [];

  if (sustData.length > 1) {
    sustituciones = sustData.slice(1).filter(r => {
      if (empleadoId && String(r[1]).trim() !== String(empleadoId).trim() && String(r[2]).trim() !== String(empleadoId).trim()) return false;
      if (departamentoArea && String(r[8]).toLowerCase() !== String(departamentoArea).toLowerCase()) return false;
      return true;
    }).map(r => ({
      sustitucionId: r[0],
      empleadoSustitutoId: r[1],
      empleadoSustituidoId: r[2],
      fechaInicio: r[3],
      fechaFin: r[4],
      horaEntrada: r[5],
      horaSalida: r[6],
      motivoSustitucion: r[7],
      departamentoArea: r[8],
      estado: r[9],
      creadoPor: r[10],
      fechaCreacion: r[11]
    }));
  }

  // 3. Solicitudes Horas Extras
  const otSheet = getOrCreateSheet(ss, "SolicitudesHorasExtras");
  const otData = otSheet.getDataRange().getValues();
  let horasExtras = [];

  if (otData.length > 1) {
    horasExtras = otData.slice(1).filter(r => {
      if (empleadoId && String(r[1]).trim() !== String(empleadoId).trim()) return false;
      return true;
    }).map(r => ({
      solicitudId: r[0],
      empleadoId: r[1],
      fecha: r[2],
      horasSolicitadas: r[3],
      motivo: r[4],
      estado: r[5],
      aprobadoPor: r[6]
    }));
  }

  return {
    status: "success",
    data: {
      turnos,
      sustituciones,
      horasExtras,
      totalTurnos: turnos.length,
      totalSustituciones: sustituciones.length,
      totalHorasExtras: horasExtras.length
    }
  };
}

// TAREA RH-08: Implementar la planificación de necesidades de personal

function uploadEmployeeDocument(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return{status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var permission=validateRolePermission(actor,"uploadEmployeeDocument");
  if(!permission.authorized)return{status:"error",code:permission.code};
  var expedienteId=String(input.expedienteId||"").trim(),title=String(input.tituloDocumento||"").trim();
  if(!expedienteId||!title)return{status:"error",code:"EMPLOYEE_DOCUMENT_INPUT_INVALID"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=assertEmployeeExpedienteScopeAccess_(input,ss,expedienteId);
  if(!access||access.authorized!==true)return{status:"error",code:access&&access.code==="VERIFIED_IDENTITY_REQUIRED"?"VERIFIED_IDENTITY_REQUIRED":"RESOURCE_SCOPE_DENIED"};
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return{status:"error",code:"CONCURRENT_UPDATE_RETRY"};
  var createdFile=null;
  try{
    var headers=["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"];
    var sheet=ss.getSheetByName("DocumentosLaborales");
    if(!sheet){sheet=getOrCreateSheet(ss,"DocumentosLaborales");sheet.appendRow(headers);}
    var values=sheet.getDataRange().getValues();
    if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(headers))return{status:"error",code:"RESOURCE_SCHEMA_INVALID"};
    var fileUrl="";
    if(input.fileData||input.fileName){
      var data=String(input.fileData||""),fileName=String(input.fileName||"documento.pdf").trim();
      var match=data.match(/^data:(application\/pdf|image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/);
      if(!match||!fileName||fileName.length>180)return{status:"error",code:"EMPLOYEE_DOCUMENT_FILE_INVALID"};
      var bytes=Utilities.base64Decode(match[2]);
      if(!bytes||!bytes.length||bytes.length>10*1024*1024)return{status:"error",code:"EMPLOYEE_DOCUMENT_FILE_INVALID"};
      var folder=getOrCreateFolderNews(getParentDriveFolder(),"Documentos_Laborales");
      if(folder.setSharing)folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
      createdFile=folder.createFile(Utilities.newBlob(bytes,match[1],fileName));
      createdFile.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
      if(createdFile.getSharingAccess&&createdFile.getSharingAccess()!==DriveApp.Access.PRIVATE)throw new Error("EMPLOYEE_DOCUMENT_PRIVACY_ENFORCEMENT_FAILED");
      fileUrl="https://drive.google.com/file/d/"+createdFile.getId()+"/view";
    }
    var documentId="DOC-LAB-"+String(Utilities.getUuid()).replace(/[^A-Za-z0-9]/g,"").slice(0,24);
    if(!documentId||values.slice(1).some(function(row){return String(row[0]||"").trim()===documentId;}))throw new Error("EMPLOYEE_DOCUMENT_ID_COLLISION");
    sheet.appendRow([documentId,expedienteId,String(input.categoriaDoc||"Contrato").trim().slice(0,80),title.slice(0,180),
      fileUrl,new Date(),String(actor.userId||""),"PrivadoEmpleado",String(input.observaciones||"").slice(0,500)]);
    return{status:"success",documentoId:documentId,archivoUrl:fileUrl,message:"Documento laboral almacenado con acceso privado."};
  }catch(error){
    if(createdFile&&createdFile.setTrashed){try{createdFile.setTrashed(true);}catch(ignored){}}
    return{status:"error",code:String(error&&error.message||"EMPLOYEE_DOCUMENT_WRITE_FAILED")};
  }finally{lock.releaseLock();}
}

function getParentDriveFolder() {
  try {
    const folderId = PropertiesService.getScriptProperties().getProperty('PARENT_FOLDER_ID');
    if (folderId) return DriveApp.getFolderById(folderId);
  } catch (_) {}
  return DriveApp.getRootFolder();
}

function logDebug(message, optionalParam) {
  if (!DEBUG_MODE) return;
  try {
    console.log(`[ACCOUNTING-SVC] ${new Date().toLocaleTimeString()} - ${message}`, optionalParam || "");
  } catch (_) {}
}

// [FASE2-T03] [Fase 2 - Contratos API y Compatibilidad] - Formato estandarizado de respuestas de API, marca de tiempo y códigos de error normalizados.


function getAccountingPersonIdForUser_(ss,userId) {
  var users=ss&&ss.getSheetByName?ss.getSheetByName("Usuarios"):null;
  if(!users)return "";
  var rows=users.getDataRange().getValues(),h=(rows[0]||[]).map(function(v){return String(v||"").trim();});
  var ui=h.indexOf("UserId"),pi=h.indexOf("PersonaID");
  if(ui<0||pi<0)return "";
  var matches=rows.slice(1).filter(function(r){return String(r[ui]||"").trim()===String(userId||"").trim();});
  return matches.length===1?String(matches[0][pi]||"").trim():"";
}

function resolveStudentExpedienteForAccounting_(ss,userId) {
  var personId=getAccountingPersonIdForUser_(ss,userId);
  var sheet=ss&&ss.getSheetByName?ss.getSheetByName("ExpedientesLaborales"):null;
  if(!sheet)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var rows=sheet.getDataRange().getValues(),h=(rows[0]||[]).map(function(v){return String(v||"").trim();});
  var ui=h.indexOf("UserId"),pi=h.indexOf("PersonaId"),ei=h.indexOf("ExpedienteID"),si=h.indexOf("EstadoLaboral");
  if([ui,pi,ei,si].some(function(i){return i<0;}))return {authorized:false,code:"RESOURCE_SCHEMA_INVALID"};
  var matches=rows.slice(1).filter(function(r){return (String(r[ui]||"").trim()===String(userId||"").trim()||(personId&&String(r[pi]||"").trim()===personId))&&String(r[si]||"").trim().toLowerCase()==="activo";});
  if(matches.length!==1)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  return {authorized:true,expedienteId:String(matches[0][ei]||"").trim(),userId:String(userId||"").trim(),personId:personId};
}

function assertJointFamilyVoucherOwnerAccess_(payload, ss, targetUserId) {
  var actor=getVerifiedAccountingIdentity_(payload||{});
  if(!actor||actor.authorized!==true)return {authorized:false,code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  if(String(actor.userId||"")===String(targetUserId||""))return {authorized:true,actor:actor};
  var role=normalizeVacationRole_(actor.role);
  if(["padre","tutor","responsable"].indexOf(role)<0)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var guardianPerson=getAccountingPersonIdForUser_(ss,actor.userId);
  var studentPerson=getAccountingPersonIdForUser_(ss,targetUserId);
  if(!guardianPerson||!studentPerson)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var rel=ss.getSheetByName("RelacionesFamiliares");
  if(!rel)return {authorized:false,code:"RESOURCE_NOT_FOUND"};
  var rows=rel.getDataRange().getValues(),h=(rows[0]||[]).map(function(v){return String(v||"").trim();});
  var sp=h.indexOf("PersonaEstudianteID"),gp=h.indexOf("PersonaResponsableID"),st=h.indexOf("EstadoAutorizacion");
  var matches=rows.slice(1).filter(function(r){return String(r[sp]||"").trim()===studentPerson&&String(r[gp]||"").trim()===guardianPerson&&["aprobado","autorizado","activo"].indexOf(String(r[st]||"").trim().toLowerCase())>=0;});
  return matches.length===1?{authorized:true,actor:actor}:{authorized:false,code:"RESOURCE_NOT_FOUND"};
}

function transportRows_(ss, sheetName, expectedHeaders) {
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName(sheetName) : null;
  if (!sheet) return { valid: false, missing: true, code: "TRANSPORT_RESOURCE_NOT_FOUND", rows: [], headers: [] };
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { valid: false, missing: false, code: "TRANSPORT_SCHEMA_INVALID", rows: [], headers: [] };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  if (expectedHeaders && JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    return { valid: false, missing: false, code: "TRANSPORT_SCHEMA_INVALID", rows: [], headers: headers };
  }
  return { valid: true, missing: false, sheet: sheet, headers: headers, rows: values.slice(1) };
}

function transportDateBoundary_(value) {
  if (value === "" || value === null || value === undefined) return { valid: true, date: null };
  var date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? { valid: false, date: null } : { valid: true, date: date };
}

function transportRelationshipIsCurrent_(row, headers) {
  var statusIndex = headers.indexOf("Estado");
  var startIndex = headers.indexOf("FechaInicio"), endIndex = headers.indexOf("FechaFin");
  if (statusIndex < 0) return false;
  var status = String(row[statusIndex] || "").trim().toLowerCase();
  if (["verificada","activa","active","verified"].indexOf(status) === -1) return false;
  var start = startIndex < 0 ? { valid: true, date: null } : transportDateBoundary_(row[startIndex]);
  var end = endIndex < 0 ? { valid: true, date: null } : transportDateBoundary_(row[endIndex]);
  if (!start.valid || !end.valid) return false;
  var now = Date.now();
  if (start.date && start.date.getTime() > now) return false;
  if (end.date && end.date.getTime() < now) return false;
  return true;
}

function transportEmployeeIdsForUser_(ss, userId, expectedRole) {
  var snapshot = transportRows_(ss, "ExpedientesLaborales");
  if (!snapshot.valid) return [];
  var userIndex = snapshot.headers.indexOf("UserId"), idIndex = snapshot.headers.indexOf("ExpedienteID");
  var roleIndex = snapshot.headers.indexOf("Puesto");
  var stateIndex = snapshot.headers.indexOf("EstadoLaboral");
  if (stateIndex < 0) stateIndex = snapshot.headers.indexOf("Estado");
  if (userIndex < 0 || idIndex < 0 || roleIndex < 0 || stateIndex < 0) return [];
  var role = String(expectedRole || "").trim().toLowerCase();
  return snapshot.rows.filter(function(row) {
    var state = String(row[stateIndex] || "").trim().toLowerCase();
    return String(row[userIndex] || "").trim() === String(userId || "").trim() &&
      String(row[roleIndex] || "").trim().toLowerCase() === role &&
      ["active","activo","activa","vigente"].indexOf(state) !== -1;
  }).map(function(row) { return String(row[idIndex] || "").trim(); }).filter(Boolean);
}

function resolveTransportAccessScope_(payload, ss) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { authorized: false, reason: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = String(actor.role || "").trim(), normalizedRole = role.toLowerCase();
  var scope = { authorized: true, role: role, userId: actor.userId, studentIds: [], employeeIds: [], routeIds: [] };
  if (["director","subdirector","administrador"].indexOf(normalizedRole) !== -1) {
    scope.management = true;
    scope.studentIds = null;
    scope.employeeIds = null;
    scope.routeIds = null;
    return scope;
  }
  if (normalizedRole === "padre") {
    var studentSnapshot = transportRows_(ss, "ExpedientesEstudiantes");
    if (!studentSnapshot.valid) return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
    var studentExpIndex = studentSnapshot.headers.indexOf("ExpedienteID");
    var studentUserIndex = studentSnapshot.headers.indexOf("UserId");
    if (studentExpIndex < 0 || studentUserIndex < 0) return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
    var familySheet = ss.getSheetByName("RelacionesFamiliares");
    if (familySheet) {
      var family = transportRows_(ss, "RelacionesFamiliares");
      if (!family.valid) return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
      var relationExpIndex = family.headers.indexOf("ExpedienteID");
      var parentIndex = family.headers.indexOf("ResponsableUserId");
      if (relationExpIndex < 0 || parentIndex < 0 || family.headers.indexOf("Estado") < 0) {
        return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
      }
      family.rows.forEach(function(row) {
        if (String(row[parentIndex] || "").trim() !== actor.userId || !transportRelationshipIsCurrent_(row, family.headers)) return;
        var expedienteId = String(row[relationExpIndex] || "").trim();
        var linked = studentSnapshot.rows.filter(function(student) {
          return String(student[studentExpIndex] || "").trim() === expedienteId;
        });
        if (linked.length !== 1) return;
        var studentUserId = String(linked[0][studentUserIndex] || "").trim();
        if (expedienteId && scope.studentIds.indexOf(expedienteId) === -1) scope.studentIds.push(expedienteId);
        if (studentUserId && scope.studentIds.indexOf(studentUserId) === -1) scope.studentIds.push(studentUserId);
      });
    } else {
      var legacy = transportRows_(ss, "RelacionesEstudianteTutor");
      if (legacy.valid) {
        legacy.rows.forEach(function(row) {
          var state = String(row[9] || "").trim().toLowerCase();
          if (String(row[2] || "").trim() !== actor.userId ||
              ["activa","active","verificada"].indexOf(state) === -1) return;
          var linkedId = String(row[1] || "").trim();
          var linked = studentSnapshot.rows.filter(function(student) {
            return String(student[studentExpIndex] || "").trim() === linkedId ||
              String(student[studentUserIndex] || "").trim() === linkedId;
          });
          if (linked.length !== 1) return;
          var expedienteId = String(linked[0][studentExpIndex] || "").trim();
          var studentUserId = String(linked[0][studentUserIndex] || "").trim();
          if (expedienteId && scope.studentIds.indexOf(expedienteId) === -1) scope.studentIds.push(expedienteId);
          if (studentUserId && scope.studentIds.indexOf(studentUserId) === -1) scope.studentIds.push(studentUserId);
        });
      }
    }
    scope.routeIds = getTransportRouteIdsForScope_(ss, scope);
    return scope;
  }
  if (normalizedRole === "estudiante") {
    var students = transportRows_(ss, "ExpedientesEstudiantes");
    if (!students.valid) return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
    var expIndex = students.headers.indexOf("ExpedienteID"), userIndex = students.headers.indexOf("UserId");
    if (expIndex < 0 || userIndex < 0) return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
    var own = students.rows.filter(function(row) { return String(row[userIndex] || "").trim() === actor.userId; });
    if (own.length > 1) return { authorized: false, reason: "RESOURCE_SCHEMA_INVALID" };
    if (own.length === 1) {
      scope.studentIds.push(actor.userId);
      var expedienteId = String(own[0][expIndex] || "").trim();
      if (expedienteId) scope.studentIds.push(expedienteId);
    }
    scope.routeIds = getTransportRouteIdsForScope_(ss, scope);
    return scope;
  }
  if (normalizedRole === "conductor" || normalizedRole === "monitor") {
    scope.employeeIds = transportEmployeeIdsForUser_(ss, actor.userId, role);
    scope.routeIds = getTransportRouteIdsForScope_(ss, scope);
    return scope;
  }
  return { authorized: false, reason: "ROLE_NOT_ALLOWED" };
}

function transportAuditDenied_(actor, action, resourceId) {
  try {
    logStructuredEvent("ACCOUNTING", "transport", "WARNING", "UNAUTHORIZED_ACCESS_ATTEMPT",
      "Intento de acceso fuera del ámbito de transporte",
      { action: String(action || ""), resourceId: String(resourceId || ""), actorUserId: String(actor && actor.userId || "") },
      String(actor && actor.role || "Unknown"));
  } catch (ignored) {}
}

function getTransportRouteIdsForScope_(ss, scope) {
  if (!scope || scope.authorized !== true) return [];
  if (scope.management === true) return null;
  var routes = transportRows_(ss, "TransporteRutas", ["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado"]);
  if (!routes.valid) return [];
  var activeRoutes = routes.rows.filter(function(row) {
    return ["active","activo","activa","vigente"].indexOf(String(row[6] || "").trim().toLowerCase()) !== -1;
  }).map(function(row) { return String(row[0] || "").trim(); });
  var role = String(scope.role || "").trim().toLowerCase(), allowed = [];
  if (role === "padre" || role === "estudiante") {
    var assignments = transportRows_(ss, "TransporteAsignaciones", ["ID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada"]);
    if (!assignments.valid) return [];
    assignments.rows.forEach(function(row) {
      var state = String(row[5] || "").trim().toLowerCase(), routeId = String(row[1] || "").trim();
      if (["activa","active","activo"].indexOf(state) === -1 ||
          scope.studentIds.indexOf(String(row[2] || "").trim()) === -1 ||
          activeRoutes.indexOf(routeId) === -1) return;
      if (allowed.indexOf(routeId) === -1) allowed.push(routeId);
    });
    return allowed;
  }
  if (role === "conductor" || role === "monitor") {
    var trips = transportRows_(ss, "TransporteViajes", ["ViajeID","RutaID","Unidad","Conductor","Monitor","Fecha","Jornada","Inicio","Fin","Estado"]);
    if (!trips.valid) return [];
    trips.rows.forEach(function(row) {
      var tripState = String(row[9] || "").trim().toLowerCase();
      var employeeId = String(row[role === "conductor" ? 3 : 4] || "").trim();
      var routeId = String(row[1] || "").trim();
      if (["encurso","activo","active"].indexOf(tripState) === -1 ||
          scope.employeeIds.indexOf(employeeId) === -1 || activeRoutes.indexOf(routeId) === -1) return;
      if (allowed.indexOf(routeId) === -1) allowed.push(routeId);
    });
  }
  return allowed;
}

function getTransportRoutes(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED", rutas: [] };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), scope = resolveTransportAccessScope_(input, ss);
  if (!scope.authorized) return { status: "error", code: scope.reason || "RESOURCE_SCOPE_DENIED", rutas: [] };
  var snapshot = transportRows_(ss, "TransporteRutas", ["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado"]);
  if (!snapshot.valid) return { status: "error", code: "RESOURCE_SCHEMA_INVALID", rutas: [] };
  var allowed = scope.management ? null : getTransportRouteIdsForScope_(ss, scope);
  var requested = String(input.rutaId || "").trim();
  if (requested && !scope.management && (!allowed || allowed.indexOf(requested) === -1)) {
    transportAuditDenied_(actor, "getTransportRoutes", requested);
    return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", rutas: [] };
  }
  var routes = snapshot.rows.filter(function(row) {
    var routeId = String(row[0] || "").trim(), state = String(row[6] || "").trim().toLowerCase();
    return ["active","activo","activa","vigente"].indexOf(state) !== -1 &&
      (!requested || routeId === requested) && (scope.management || allowed.indexOf(routeId) !== -1);
  }).map(function(row) {
    return { rutaId: row[0], nombre: row[1], unidad: row[2],
      conductorEmpleadoId: scope.management ? row[3] : "", capacidad: row[4], paradas: row[5], estado: row[6] };
  });
  return { status: "success", rutas: routes };
}

function getTransportAssignments(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED", total: 0, asignaciones: [] };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), scope = resolveTransportAccessScope_(input, ss);
  if (!scope.authorized) return { status: "error", code: scope.reason || "RESOURCE_SCOPE_DENIED", total: 0, asignaciones: [] };
  var snapshot = transportRows_(ss, "TransporteAsignaciones", ["ID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada"]);
  if (!snapshot.valid) return { status: "error", code: "RESOURCE_SCHEMA_INVALID", total: 0, asignaciones: [] };
  var allowedRoutes = scope.management ? null : getTransportRouteIdsForScope_(ss, scope);
  var requestedRoute = String(input.rutaId || "").trim(), requestedStudent = String(input.estudianteUserId || "").trim();
  if (requestedRoute && !scope.management && (!allowedRoutes || allowedRoutes.indexOf(requestedRoute) === -1)) {
    transportAuditDenied_(actor, "getTransportAssignments", requestedRoute);
    return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", total: 0, asignaciones: [] };
  }
  var role = String(scope.role || "").trim().toLowerCase();
  if (requestedStudent && !scope.management && ["padre","estudiante"].indexOf(role) !== -1 &&
      scope.studentIds.indexOf(requestedStudent) === -1) {
    transportAuditDenied_(actor, "getTransportAssignments", requestedStudent);
    return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", total: 0, asignaciones: [] };
  }
  var assignments = snapshot.rows.filter(function(row) {
    var routeId = String(row[1] || "").trim(), studentId = String(row[2] || "").trim();
    var state = String(row[5] || "").trim().toLowerCase();
    if (["activa","active","activo"].indexOf(state) === -1) return false;
    if (requestedRoute && routeId !== requestedRoute) return false;
    if (requestedStudent && studentId !== requestedStudent) return false;
    if (scope.management) return true;
    if (!allowedRoutes || allowedRoutes.indexOf(routeId) === -1) return false;
    if (["padre","estudiante"].indexOf(role) !== -1) return scope.studentIds.indexOf(studentId) !== -1;
    return ["conductor","monitor"].indexOf(role) !== -1;
  }).map(function(row) {
    return { asignacionId: row[0], rutaId: row[1], estudianteUserId: row[2], parada: row[3],
      horario: row[4], estado: row[5], fecha: row[6], jornada: row[7] };
  });
  if (requestedStudent && !scope.management && ["conductor","monitor"].indexOf(role) !== -1 &&
      !assignments.some(function(item) { return item.estudianteUserId === requestedStudent; })) {
    transportAuditDenied_(actor, "getTransportAssignments", requestedStudent);
    return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", total: 0, asignaciones: [] };
  }
  return { status: "success", total: assignments.length, asignaciones: assignments };
}

function getTripPassengerManifest(payload) {
  var input = payload || {}, actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED", manifiestoPasajeros: [] };
  var tripId = String(input.viajeId || "").trim();
  if (!tripId) return { status: "error", code: "RESOURCE_NOT_FOUND", manifiestoPasajeros: [] };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), scope = resolveTransportAccessScope_(input, ss);
  if (!scope.authorized) return { status: "error", code: scope.reason || "RESOURCE_SCOPE_DENIED", manifiestoPasajeros: [] };
  var trips = transportRows_(ss, "TransporteViajes", ["ViajeID","RutaID","Unidad","Conductor","Monitor","Fecha","Jornada","Inicio","Fin","Estado"]);
  if (!trips.valid) return { status: "error", code: "RESOURCE_SCHEMA_INVALID", manifiestoPasajeros: [] };
  var matches = trips.rows.filter(function(row) { return String(row[0] || "").trim() === tripId; });
  if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND", manifiestoPasajeros: [] };
  var trip = matches[0], role = String(scope.role || "").trim().toLowerCase();
  var allowedRoutes = scope.management ? null : getTransportRouteIdsForScope_(ss, scope);
  var routeId = String(trip[1] || "").trim();
  var authorizedTrip = scope.management === true || (allowedRoutes && allowedRoutes.indexOf(routeId) !== -1);
  if (authorizedTrip && role === "conductor") authorizedTrip = scope.employeeIds.indexOf(String(trip[3] || "").trim()) !== -1;
  if (authorizedTrip && role === "monitor") authorizedTrip = scope.employeeIds.indexOf(String(trip[4] || "").trim()) !== -1;
  if (!authorizedTrip) {
    transportAuditDenied_(actor, "getTripPassengerManifest", tripId);
    return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", manifiestoPasajeros: [] };
  }
  var assignments = transportRows_(ss, "TransporteAsignaciones", ["ID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada"]);
  if (!assignments.valid) return { status: "error", code: "RESOURCE_SCHEMA_INVALID", manifiestoPasajeros: [] };
  var passengers = assignments.rows.filter(function(row) {
    var state = String(row[5] || "").trim().toLowerCase(), studentId = String(row[2] || "").trim();
    return String(row[1] || "").trim() === routeId &&
      ["activa","active","activo"].indexOf(state) !== -1 &&
      (scope.management || ["conductor","monitor"].indexOf(role) !== -1 || scope.studentIds.indexOf(studentId) !== -1);
  }).map(function(row) {
    return { asignacionId: row[0], rutaId: row[1], estudianteUserId: row[2], parada: row[3],
      horario: row[4], estado: row[5], fecha: row[6], jornada: row[7] };
  });
  return { status: "success", viajeId: tripId, rutaId: routeId, manifiestoPasajeros: passengers };
}

function getEmployeeSelfServicePortal(payload) {
  var input=payload||{},actor=getVerifiedAccountingIdentity_(input);
  if(!actor||actor.authorized!==true)return{status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var role=normalizeVacationRole_(actor.role),selfRoles=["empleado","profesor"],staffRoles=["recursoshumanos","director","subdirector","administrador"];
  var isSelf=selfRoles.indexOf(role)!==-1;
  if(!isSelf&&staffRoles.indexOf(role)===-1)return{status:"error",code:"ROLE_NOT_ALLOWED"};
  var targetUserId=isSelf?String(actor.userId||""):String(input.targetUserId||input.empleadoId||"").trim();
  if(!targetUserId)return{status:"error",code:"RESOURCE_NOT_FOUND"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),employeeSheet=ss.getSheetByName("ExpedientesLaborales");
  if(!employeeSheet)return{status:"error",code:"RESOURCE_NOT_FOUND"};
  var employeeValues=employeeSheet.getDataRange().getValues(),employeeHeaders=(employeeValues[0]||[]).map(function(v){return String(v||"").trim();});
  var employeeIndex={};employeeHeaders.forEach(function(name,index){employeeIndex[name]=index;});
  var requiredEmployee=["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral"];
  if(requiredEmployee.some(function(name){return employeeIndex[name]===undefined;}))return{status:"error",code:"RESOURCE_DATA_SCHEMA_INVALID"};
  var employees=employeeValues.slice(1).filter(function(row){return String(row[employeeIndex.UserId]||"").trim()===targetUserId;});
  if(employees.length!==1)return{status:"error",code:"RESOURCE_NOT_FOUND"};
  var employee=employees[0],expedienteId=String(employee[employeeIndex.ExpedienteID]||"").trim();
  if(!isSelf){var access=assertEmployeeExpedienteScopeAccess_(input,ss,expedienteId);if(!access||access.authorized!==true)return{status:"error",code:"RESOURCE_NOT_FOUND"};}
  var expediente={expedienteId:expedienteId,personaId:employee[employeeIndex.PersonaId],puesto:employee[employeeIndex.Puesto],
    departamento:employee[employeeIndex.Departamento],centroCosto:employee[employeeIndex.CentroCosto],
    fechaIngreso:employee[employeeIndex.FechaIngreso],fechaSalida:employee[employeeIndex.FechaSalida],estadoLaboral:employee[employeeIndex.EstadoLaboral]};
  function rowsFor(name,expectedHeaders,idColumn,filterColumn,filterValue,projector){
    var sheet=ss.getSheetByName(name);if(!sheet)return[];
    var values=sheet.getDataRange().getValues();
    if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(expectedHeaders))throw Error("RESOURCE_DATA_SCHEMA_INVALID");
    var rows=values.slice(1),counts=Object.create(null);
    rows.forEach(function(row){var id=String(row[idColumn]||"").trim();if(id)counts[id]=(counts[id]||0)+1;});
    return rows.filter(function(row){return String(row[filterColumn]||"").trim()===String(filterValue)&&counts[String(row[idColumn]||"").trim()]===1;}).map(projector);
  }
  try{
    return{status:"success",data:{effectiveUserId:targetUserId,expediente:expediente,
      contratos:rowsFor("ContratosLaborales",["ContratoID","ExpedienteID","TipoContrato","FechaInicio","FechaFin","SalarioBase","Jornada","EstadoContrato","Observaciones"],0,1,expedienteId,function(r){return{contratoId:r[0],tipoContrato:r[2],fechaInicio:r[3],fechaFin:r[4],salarioBase:r[5],jornada:r[6],estadoContrato:r[7]};}),
      solicitudesVacaciones:rowsFor("SolicitudesVacaciones",["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"],0,1,expedienteId,function(r){return{solicitudId:r[0],tipo:r[2],fechaInicio:r[3],fechaFin:r[4],diasSolicitados:r[5],estado:r[6]};}),
      prestamos:rowsFor("AnticiposPrestamosEmpleado",["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],0,2,targetUserId,function(r){return{prestamoId:r[0],fecha:r[1],tipo:r[3],montoSolicitado:r[4],montoAprobado:r[5],plazoCuotas:r[6],cuotaMensual:r[7],saldoPendiente:r[8],estadoAprobacion:r[9]};}),
      turnos:rowsFor("AsignacionesTurnosLaborales",["AsignacionTurnoID","EmpleadoID","NombreTurno","FechaInicio","FechaFin","HoraEntrada","HoraSalida","DepartamentoArea","Estado","CreadoPor","FechaCreacion","UltimaModificacion"],0,1,targetUserId,function(r){return{asignacionTurnoId:r[0],nombreTurno:r[2],fechaInicio:r[3],fechaFin:r[4],horaEntrada:r[5],horaSalida:r[6],departamentoArea:r[7],estado:r[8]};}),
      capacitaciones:rowsFor("InscripcionesCapacitacion",["InscripcionID","CursoID","EmpleadoID","FechaInscripcion","EstadoInscripcion","AsistenciaPorcentaje","ResultadoNota","CertificadoDriveUrl","FechaEmisionCertificado","FechaVencimientoCertificado","Observaciones","CreadoPor","FechaCreacion","UltimaModificacion"],0,2,targetUserId,function(r){return{inscripcionId:r[0],cursoId:r[1],fechaInscripcion:r[3],estadoInscripcion:r[4],asistenciaPorcentaje:r[5],resultadoNota:r[6],certificadoDriveUrl:r[7],fechaEmisionCertificado:r[8],fechaVencimientoCertificado:r[9]};})
    }};
  }catch(error){return{status:"error",code:"RESOURCE_DATA_SCHEMA_INVALID"};}
}

/* Runtime configuration and fail-closed service adapters. */
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "";
const MIGRATION_OWNER_SCHEMAS_={
  persona: { service: "USER", sheet: "Personas", headers: ["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto","TelefonoContacto","EstadoPersona","FechaCreacion","FechaActualizacion","Observaciones"] },
  curso: { service: "ACCOUNTING", sheet: "Cursos", headers: ["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"] },
  estudiante: { service: "ACADEMIC", sheet: "ExpedientesEstudiantes", headers: ["ExpedienteID", "PersonaID", "CodigoInstitucional", "FechaNacimiento", "Nacionalidad", "DireccionResidencia", "FotografiaUrl", "EstadoExpediente", "FechaCreacion", "FechaActualizacion", "Observaciones"] },
  empleado: { service: "ACCOUNTING", sheet: "ExpedientesLaborales", departmentScoped: true, headers: ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"] },
  empleadoOwnership: { service: "USER", sheet: "", headers: [] }
};
var MIGRATION_WRITER_SCHEMAS_ = {
  curso: { sheet: "Cursos", headers: MIGRATION_OWNER_SCHEMAS_.curso.headers.slice() },
  empleado: { sheet: "ExpedientesLaborales", headers: MIGRATION_OWNER_SCHEMAS_.empleado.headers.slice() }
};
const MIGRATION_WRITER_JOURNAL_HEADERS_ = ["IdempotencyKey","TipoEntidad","IdNuevoPlataforma","PayloadJSON","Estado","Accion","FilaAnteriorJSON","FilaNuevaJSON","Fecha","CorrelationId"];
const MIGRATION_WRITER_JOURNAL_SHEET_ = "MigracionEscrituras_ACCOUNTING";
const ACCOUNTING_IMPORT_ROW_DEPARTMENT_SNAPSHOT_HEADERS_ = ["ImportBatchID","SnapshotID","RowID","InstitutionID","Domain","DepartmentID","Status","VerifiedBy","VerifiedAt","SnapshotVersion"];

function isAccountingTrustedAppsScriptEndpoint_(value) {
  var endpoint = String(value || "").trim();
  var standardDeployment = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/i.test(endpoint);
  var domainDeployment = /^https:\/\/script\.google\.com\/a\/macros\/[A-Za-z0-9.-]+\/s\/[A-Za-z0-9_-]+\/exec$/i.test(endpoint);
  return standardDeployment || domainDeployment;
}

function accountingComputeHmacSignature_(message, secret) {
  var bytes = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, String(message), String(secret));
  return bytes.map(function(byte) { return ("0" + (byte & 255).toString(16)).slice(-2); }).join("");
}

function requestAccountingUserAuthorization_(action, payload) {
  var properties = PropertiesService.getScriptProperties();
  var endpoint = String(properties.getProperty("IMA_USER_SERVICE_URL") || "").trim();
  var secret = String(properties.getProperty("IMA_MIGRATION_HMAC_SECRET") || "").trim();
  if (!isAccountingTrustedAppsScriptEndpoint_(endpoint) || secret.length < 32 ||
      typeof UrlFetchApp === "undefined") return { status: "error", code: "ACCOUNTING_AUTH_SERVICE_NOT_CONFIGURED" };
  var now = Date.now();
  var requestId = "REQ-" + now + "-" + Utilities.getUuid().replace(/-/g, "").slice(0, 12);
  var correlationId = "CORR-" + Utilities.getUuid().replace(/-/g, "");
  var body = payload || {};
  var bodyToSign = [requestId, now, correlationId, "ACCOUNTING", "USER", String(action), JSON.stringify(body)].join("|");
  var envelope = {
    sourceService: "ACCOUNTING", targetService: "USER", action: String(action),
    requestId: requestId, timestamp: now, correlationId: correlationId,
    payload: body, hmacSignature: accountingComputeHmacSignature_(bodyToSign, secret)
  };
  try {
    var response = UrlFetchApp.fetch(endpoint, {
      method: "post", contentType: "application/json",
      payload: JSON.stringify(envelope), muteHttpExceptions: true
    });
    var status = response.getResponseCode();
    var result = {};
    try { result = JSON.parse(response.getContentText() || "{}"); } catch (ignored) {}
    if (status < 200 || status >= 300 || !result || typeof result !== "object") {
      return { status: "error", code: "ACCOUNTING_AUTH_SERVICE_UNAVAILABLE" };
    }
    return result;
  } catch (error) {
    return { status: "error", code: "ACCOUNTING_AUTH_SERVICE_UNAVAILABLE" };
  }
}

function getVerifiedAccountingIdentity_(payload) {
  if (!payload || typeof payload.sessionToken !== "string" || !payload.sessionToken) {
    return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  }
  var verified, delegated = typeof requestAccountingUserAuthorization_ === "function";
  if (delegated) {
    verified = requestAccountingUserAuthorization_("verifyAccountingSession", { sessionToken: payload.sessionToken });
  } else if (typeof verifySessionToken === "function") {
    var claims = verifySessionToken(payload.sessionToken);
    if (claims) verified = { status:"success", authorized:true, userId:claims.userId, role:claims.role,
      membershipId:claims.membershipId || "", institutionId:claims.institutionId || "" };
  }
  if (!verified || verified.status !== "success" || verified.authorized !== true ||
      !verified.userId || !verified.role || !verified.institutionId) {
    return { authorized: false, code: verified && verified.code || "VERIFIED_IDENTITY_REQUIRED" };
  }
  if (!delegated) return { authorized:true,userId:String(verified.userId),role:String(verified.role),
    membershipId:String(verified.membershipId || ""),institutionId:String(verified.institutionId) };
  var configuredInstitution = String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_ID") ||
    PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") || "").trim();
  if (!configuredInstitution || String(verified.institutionId) !== configuredInstitution) {
    return { authorized: false, code: "INSTITUTION_SCOPE_DENIED" };
  }
  return { authorized: true, userId: String(verified.userId), role: String(verified.role),
    membershipId: String(verified.membershipId || ""), institutionId: configuredInstitution };
}

function createInterServiceEnvelope(sourceService, targetService, action, payload, customSecret) {
  var now = Date.now();
  var requestId = "REQ-" + now + "-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 12);
  var correlationId = String(payload && payload.correlationId || ("CORR-" + String(Utilities.getUuid()).replace(/-/g, "")));
  var body = payload || {};
  var bodyToSign = [requestId, now, correlationId, sourceService, targetService, action, JSON.stringify(body)].join("|");
  return {
    sourceService: sourceService, targetService: targetService, action: action,
    requestId: requestId, timestamp: now, correlationId: correlationId,
    payload: body, hmacSignature: accountingComputeHmacSignature_(bodyToSign, customSecret)
  };
}

function sendMigrationOwnerRequest_(service, action, payload) {
  var target = String(service || "").toUpperCase();
  if (String(action || "").indexOf("MigratedResourceOwnership") !== -1 || target === "USER" ||
      String(action || "") === "compensateMigratedResourceOwnership") target = "USER";
  if (target === "ACCOUNTING") {
    if (action === "writeMigratedEntity") return applyTrustedAccountingMigrationWrite_(payload || {});
    if (action === "compensateMigratedEntity") return compensateTrustedAccountingMigrationWrite_(payload || {});
    throw new Error("MIGRATION_ACTION_NOT_ALLOWED");
  }
  if (target !== "USER" && target !== "ACADEMIC") throw new Error("MIGRATION_OWNER_SERVICE_NOT_CONFIGURED");
  var properties = PropertiesService.getScriptProperties();
  var endpointKey = target === "ACADEMIC" ? "IMA_ACADEMIC_SERVICE_URL" : "IMA_USER_SERVICE_URL";
  var endpoint = String(properties.getProperty(endpointKey) || "").trim();
  var signingSecret = String(properties.getProperty("IMA_MIGRATION_HMAC_SECRET") || "").trim();
  if (!isAccountingTrustedAppsScriptEndpoint_(endpoint) || signingSecret.length < 32 ||
      typeof createInterServiceEnvelope !== "function" || typeof UrlFetchApp === "undefined") {
    throw new Error("MIGRATION_OWNER_SERVICE_NOT_CONFIGURED");
  }
  var envelope = createInterServiceEnvelope("ACCOUNTING", target, action, payload || {}, signingSecret);
  var response = UrlFetchApp.fetch(endpoint, {
    method: "post", contentType: "application/json",
    payload: JSON.stringify(envelope), muteHttpExceptions: true
  });
  var status = response.getResponseCode(), body = {};
  try { body = JSON.parse(response.getContentText() || "{}"); } catch (ignored) {}
  if (status < 200 || status >= 300 || body.status !== "success") {
    throw new Error(String(body.code || "MIGRATION_OWNER_REQUEST_FAILED"));
  }
  return body;
}

function rollbackMigrationOwnerWrites_(applied) {
  var failures = [];
  (applied || []).slice().reverse().forEach(function(item) {
    try {
      var ownership = String(item && item.tipoEntidad || "") === "empleadoOwnership";
      var ownerService = ownership ? "USER" : String(item && item.service || "ACCOUNTING").toUpperCase();
      sendMigrationOwnerRequest_(ownerService,
        ownership ? "compensateMigratedResourceOwnership" : "compensateMigratedEntity",
        { idempotencyKey: item.idempotencyKey || "", entityType: item.tipoEntidad || "",
          payload: item.payload || {}, ownershipId: item.ownershipId || "" });
    } catch (error) {
      failures.push({ entityType: item && item.tipoEntidad || "", code: String(error && error.message || error) });
    }
  });
  return failures;
}

function getOrCreateSheet(ss, name) {
  var spreadsheet = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!spreadsheet) throw new Error("SPREADSHEET_NOT_CONFIGURED");
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  var defaultHeaders = {
    "SolicitudesCompra": ["SolicitudID","Fecha","Departamento","SolicitanteUserId","Justificacion","Categoria","DetalleItemsJSON","MontoEstimado","CentroCosto","EstadoAprobacion","Observaciones"],
    "CotizacionesCompra": ["CotizacionID","SolicitudID","ProveedorID","FechaRecepcion","VigenciaOferta","PrecioTotal","PlazoEntregaDias","CondicionesPago","DocumentoAdjuntoUrl","EstadoSelection","Observaciones"],
    "DetalleCotizacionesCompra": ["DetalleCotizacionID","CotizacionID","SolicitudID","ItemId","Descripcion","Unidad","CantidadSolicitada","CantidadCotizada","PrecioUnitario","Subtotal","Descuento","Impuestos","Flete","Total","Garantia","CumplimientoTecnico","EspecificacionesCumplidas","FechaRegistro"],
    "ActasAdjudicacionCompra": ["ActaID","SolicitudID","Fecha","ResponsablesEvaluacionJSON","Dictamen","Justificacion","MontoAdjudicado","DetalleAdjudicacionJSON","OfertasDescartadasJSON","SnapshotCotizacionesJSON","Estado","AdjudicadoPor","IdempotencyKey","OrdenesCompraJSON"],
    "OrdenesCompra": ["OrdenCompraID","SolicitudID","CotizacionID","ProveedorID","FechaEmision","FechaEntregaEstimada","DetalleItemsJSON","MontoTotal","CentroCosto","EstadoOrden","AprobadoPor","Observaciones","SolicitanteUserId","VersionDocumental","ArchivoPdfUrl"],
    "ProveedoresActivos": ["ProveedorID","FechaRegistro","NombreProveedor","RTN","Telefono","Email","RubroServicio","Estado","Observaciones"],
    "ExpedientesLaborales": ["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],
    "ContratosLaborales": ["ContratoID","ExpedienteID","TipoContrato","FechaInicio","FechaFin","SalarioBase","Jornada","EstadoContrato","Observaciones"],
    "AprobacionHorasExtras": ["OvertimeID","UserId","NombreEmpleado","FechaTrabajada","HorasRegistradas","HorasAprobadas","Motivo","EstadoAprobacion","AprobadoPor","PeriodoNominaId","EstadoPago","Timestamp"],
    "IncidenciasNomina": ["IncidenciaID","PlanillaID","PeriodoMes","EmpleadoId","EmpleadoNombre","TipoIncidencia","Descripcion","FechaRegistro","Estado"],
    "PlanillasNomenclatura": ["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"],
    "DeduccionesAsistencia": ["AsistenciaID","Fecha","EmpleadoId","EmpleadoNombre","HoraEntrada","HoraSalida","MinutosTardanza","EstadoAsistencia","Observaciones"],
    "SolicitudesVacaciones": ["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"],
    "IncapacidadesMedicas": ["IncapacidadID","ExpedienteID","CentroMedico","DiagnosticoPrivadoUrl","FechaInicio","FechaFin","DiasOtorgados","EstadoIHSS","Observaciones"],
    "AnticiposPrestamosEmpleado": ["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],
    "BoletasPago": ["BoletaID","PlanillaID","FechaEmision","EmpleadoId","EmpleadoNombre","PeriodoMes","TotalDevengado","TotalDeducciones","NetoAPagar","EstadoBoleta","DriveFileId"],
    "PlanCuentas": ["CuentaID","CodigoCuenta","NombreCuenta","TipoCuenta","Naturaleza","Estado","Observaciones"],
    "AsientosContables": ["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"],
    "HorariosLaborales": ["HorarioID","NombreHorario","JornadaTipo","HoraEntrada","HoraSalida","ToleranciaMinutos","DiasLaboralesJSON","Estado","Observaciones"],
    "CorreccionesAsistencia": ["CorreccionID","AsistenciaID","EmpleadoId","FechaIncidencia","HoraOriginal","HoraSolicitada","Motivo","EvidenciaUrl","EstadoAprobacion","AprobadoPor","Observaciones"],
    "DocumentosLaborales": ["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"],
    "RelacionesFamiliares": ["RelacionID","ExpedienteID","ResponsableUserId","TipoRelacion","Estado","FechaInicio","FechaFin","VerificadaPor","FechaVerificacion"],
    "TransporteRutas": ["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado"],
    "TransporteAsignaciones": ["ID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada"],
    "TransporteViajes": ["ViajeID","RutaID","Unidad","Conductor","Monitor","Fecha","Jornada","Inicio","Fin","Estado"]
  };
  var headers = defaultHeaders[name];
  if (headers && sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function migrationStableJson_(value) {
  function normalize(item) {
    if (item instanceof Date) return item.toISOString();
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === "object") {
      var out = {};
      Object.keys(item).sort().forEach(function(key) { out[key] = normalize(item[key]); });
      return out;
    }
    return item;
  }
  return JSON.stringify(normalize(value));
}

function migrationHash_(value) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return digest.map(function(byte) { return ("0" + ((byte + 256) % 256).toString(16)).slice(-2); }).join("");
}


/* Authenticated HTTP surface for the document-import preflight and preview-bound commit. */
const API_RESPONSE_VERSION = "1.0.0";

const ROLE_PERMISSIONS = {
  Auditor: ["getAccountingMigrationFileAudit"],
  "Empleado": ["getEmployeeRecords", "getLeaveVacationRequests", "submitLeaveVacationRequest", "submitAttendanceCorrection", "requestEmployeeLoanAdvance", "getEmployeeLoansAdvances", "getLoanAmortizationSchedule", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "manageProfessionalDevelopmentPlan"],
  "Profesor": ["getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "submitVacationRequest"],
  "Padre": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest", "getStoreOrders", "getCafeteriaOrders", "getFamilyCreditAuthorizations", "getFamilyCreditApprovalPreference", "configureFamilyCreditApprovalPreference", "configureFamilyCreditPin", "configureFamilyCreditAuthorization", "processFamilyCreditPurchase"],
  "Estudiante": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest", "uploadPaymentVoucher", "getPaymentVouchers", "getPaymentVoucherFile", "getStudentAccountStatement", "createStoreOrder", "getStoreOrders", "createCafeteriaOrder", "getCafeteriaOrders", "getFamilyCreditAuthorizations", "processFamilyCreditPurchase"],
  "Conductor": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"],
  "Monitor": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"],
  "RecursosHumanos": [ "getPurchaseReceiptAssetCandidates", "registerAssetsFromPurchaseReceipt", "getAssetItems", "manageAssetItem", "createPurchaseRequest", "createPurchaseOrder", "verifyThreeWayMatch",  "recordPurchaseReceipt", "getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "submitLeaveVacationRequest", "submitVacationRequest", "reviewVacationRequest", "reviewLeaveVacationRequest", "calculateVacationBalances", "recordMedicalLeave", "manageLaborIncident", "manageDisciplinaryMeasure", "manageTrainingEnrollment", "manageTrainingCourse", "manageProfessionalDevelopmentPlan", "getTrainingAnalyticsReport", "recordStaffCheckIn", "recordStaffAttendance", "getStaffAttendanceLogs", "getEmployeeSelfServicePortal", "submitAttendanceCorrection", "reviewAttendanceCorrection", "requestEmployeeLoanAdvance", "getEmployeeLoansAdvances", "approveEmployeeLoanAdvance", "manageEmployeeLoanAdvance", "getLoanAmortizationSchedule", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "getStaffPayrollReceipt", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees", "manageStaffingNeeds", "getStaffingNeedsPlanning", "manageWorkShiftAndSubstitution"],
  "Director": [ "getPurchaseDossier", "recordPurchaseOrderConfirmation",  "getSuppliers", "registerSupplier", "manageSupplierContact", "manageSupplierAddress", "manageSupplierCommercialTerms", "manageSupplierBankAccount", "getSupplierBankAccount",  "saveAssetDepreciationPolicy", "configureAssetDepreciationProfile", "registerCapitalizableAssetImprovement", "calculateAssetDepreciation", "getAssetDepreciationSchedule", "registerDepreciableAssetDisposal", "reverseAssetDepreciationEntry",  "getPurchaseReceiptAssetCandidates", "registerAssetsFromPurchaseReceipt", "getAssetItems", "manageAssetItem", "createPurchaseRequest", "createPurchaseOrder", "verifyThreeWayMatch",  "recordPurchaseReceipt", "submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "submitVacationRequest", "reviewVacationRequest", "calculateVacationBalances", "configurePaymentConcept", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "getAdvancedDashboardAnalytics", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees", "manageCatalogCategory", "getCatalogCategories", "manageCatalogUnit", "getCatalogUnits", "manageCatalogItem", "getCatalogItems", "importCatalogItems", "exportCatalogItems", "configureInventoryValuationPolicy", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "getInventoryKardex", "transferInventoryStock", "getInventoryTransfers", "createMaterialRequisition", "getMaterialRequisitions", "manageMaterialRequisition", "manageInventoryReplenishmentPolicy", "getInventoryReplenishmentSuggestions", "deliverMaterialRequisition", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder", "confirmTransferReceipt", "manageServiceTariff", "getServiceTariffs", "manageTransportTariff", "generateTransportMonthlyCharges", "cancelStudentTransportAssignment", "assignStudentTransport", "optimizeRouteStopsSequence", "getRouteOptimizationProposals", "approveRouteStopsOptimization", "rejectRouteStopsOptimization", "getTransportEfficiencyMetrics", "getPaymentVouchers", "getPaymentVoucherFile", "reviewPaymentVoucher", "getFamilyCreditSalesReconciliation"],
  "Subdirector": [ "getPurchaseDossier", "recordPurchaseOrderConfirmation",  "getSuppliers", "registerSupplier", "manageSupplierContact", "manageSupplierAddress", "manageSupplierCommercialTerms", "manageSupplierBankAccount", "getSupplierBankAccount",  "saveAssetDepreciationPolicy", "configureAssetDepreciationProfile", "registerCapitalizableAssetImprovement", "calculateAssetDepreciation", "getAssetDepreciationSchedule", "registerDepreciableAssetDisposal", "reverseAssetDepreciationEntry",  "getPurchaseReceiptAssetCandidates", "registerAssetsFromPurchaseReceipt", "getAssetItems", "manageAssetItem", "createPurchaseRequest", "createPurchaseOrder", "verifyThreeWayMatch",  "recordPurchaseReceipt", "submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "configurePaymentConcept", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees", "manageCatalogCategory", "getCatalogCategories", "manageCatalogUnit", "getCatalogUnits", "manageCatalogItem", "getCatalogItems", "importCatalogItems", "exportCatalogItems", "configureInventoryValuationPolicy", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "getInventoryKardex", "transferInventoryStock", "getInventoryTransfers", "createMaterialRequisition", "getMaterialRequisitions", "manageMaterialRequisition", "manageInventoryReplenishmentPolicy", "getInventoryReplenishmentSuggestions", "deliverMaterialRequisition", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder", "confirmTransferReceipt", "manageServiceTariff", "getServiceTariffs", "manageTransportTariff", "generateTransportMonthlyCharges", "cancelStudentTransportAssignment", "assignStudentTransport", "optimizeRouteStopsSequence", "getRouteOptimizationProposals", "approveRouteStopsOptimization", "rejectRouteStopsOptimization", "getTransportEfficiencyMetrics"],
  "Contador": [ "getPurchaseDossier", "recordPurchaseOrderConfirmation",  "getSuppliers", "registerSupplier", "manageSupplierContact", "manageSupplierAddress", "manageSupplierCommercialTerms", "manageSupplierBankAccount", "getSupplierBankAccount",  "saveAssetDepreciationPolicy", "configureAssetDepreciationProfile", "registerCapitalizableAssetImprovement", "calculateAssetDepreciation", "getAssetDepreciationSchedule", "registerDepreciableAssetDisposal", "reverseAssetDepreciationEntry",  "getPurchaseReceiptAssetCandidates", "registerAssetsFromPurchaseReceipt", "getAssetItems", "manageAssetItem", "createPurchaseRequest", "createPurchaseOrder", "verifyThreeWayMatch",  "recordPurchaseReceipt", "submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "configurePaymentConcept", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees", "manageCatalogCategory", "getCatalogCategories", "manageCatalogUnit", "getCatalogUnits", "manageCatalogItem", "getCatalogItems", "importCatalogItems", "exportCatalogItems", "configureInventoryValuationPolicy", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "getInventoryKardex", "transferInventoryStock", "getInventoryTransfers", "createMaterialRequisition", "getMaterialRequisitions", "manageMaterialRequisition", "manageInventoryReplenishmentPolicy", "getInventoryReplenishmentSuggestions", "deliverMaterialRequisition", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder", "confirmTransferReceipt", "manageServiceTariff", "getServiceTariffs", "manageTransportTariff", "generateTransportMonthlyCharges", "cancelStudentTransportAssignment", "assignStudentTransport", "getFamilyCreditSalesReconciliation"],
  "EncargadoTienda": ["getStoreOrders","updateStoreOrderStatus","getFamilyCreditSalesReconciliation"],
  "Secretaría": ["getPaymentVouchers", "getPaymentVoucherFile", "reviewPaymentVoucher"],
  "Administrador": [ "getPurchaseDossier", "recordPurchaseOrderConfirmation",  "getSuppliers", "registerSupplier", "manageSupplierContact", "manageSupplierAddress", "manageSupplierCommercialTerms", "manageSupplierBankAccount", "getSupplierBankAccount",  "saveAssetDepreciationPolicy", "configureAssetDepreciationProfile", "registerCapitalizableAssetImprovement", "calculateAssetDepreciation", "getAssetDepreciationSchedule", "registerDepreciableAssetDisposal", "reverseAssetDepreciationEntry",  "getPurchaseReceiptAssetCandidates", "registerAssetsFromPurchaseReceipt", "getAssetItems", "manageAssetItem", "createPurchaseRequest", "createPurchaseOrder", "verifyThreeWayMatch",  "recordPurchaseReceipt", "submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "reviewVacationRequest", "calculateVacationBalances", "submitAttendanceCorrection", "reviewAttendanceCorrection", "requestEmployeeLoanAdvance", "getEmployeeLoansAdvances", "approveEmployeeLoanAdvance", "manageEmployeeLoanAdvance", "getLoanAmortizationSchedule", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "getStaffPayrollReceipt", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "getAdvancedDashboardAnalytics", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees", "manageCatalogCategory", "getCatalogCategories", "manageCatalogUnit", "getCatalogUnits", "manageCatalogItem", "getCatalogItems", "importCatalogItems", "exportCatalogItems", "configureInventoryValuationPolicy", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "getInventoryKardex", "transferInventoryStock", "getInventoryTransfers", "createMaterialRequisition", "getMaterialRequisitions", "manageMaterialRequisition", "manageInventoryReplenishmentPolicy", "getInventoryReplenishmentSuggestions", "deliverMaterialRequisition", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder", "confirmTransferReceipt", "manageServiceTariff", "getServiceTariffs", "manageTransportTariff", "generateTransportMonthlyCharges", "cancelStudentTransportAssignment", "assignStudentTransport", "optimizeRouteStopsSequence", "getRouteOptimizationProposals", "approveRouteStopsOptimization", "rejectRouteStopsOptimization", "getTransportEfficiencyMetrics", "getPaymentVouchers", "getPaymentVoucherFile", "reviewPaymentVoucher", "getFamilyCreditSalesReconciliation", "getStaffingNeedsPlanning"],
  "Almacenista": ["getCatalogCategories", "getCatalogUnits", "getCatalogItems", "exportCatalogItems", "getInventoryKardex", "getInventoryTransfers", "getMaterialRequisitions", "getInventoryReplenishmentSuggestions", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "transferInventoryStock", "confirmTransferReceipt", "createMaterialRequisition", "manageMaterialRequisition", "deliverMaterialRequisition", "manageInventoryReplenishmentPolicy", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder"],
  "Bodeguero": ["getCatalogCategories", "getCatalogUnits", "getCatalogItems", "exportCatalogItems", "getInventoryKardex", "getInventoryTransfers", "getMaterialRequisitions", "getInventoryReplenishmentSuggestions", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "transferInventoryStock", "confirmTransferReceipt", "createMaterialRequisition", "manageMaterialRequisition", "deliverMaterialRequisition", "manageInventoryReplenishmentPolicy", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder"],
  "Encargado de Bodega": ["getCatalogCategories", "getCatalogUnits", "getCatalogItems", "exportCatalogItems", "getInventoryKardex", "getInventoryTransfers", "getMaterialRequisitions", "getInventoryReplenishmentSuggestions", "getValuatedInventoryReport", "exportValuatedInventoryReportCSV", "exportValuatedInventoryReportPDF", "recordInventoryMovement", "transferInventoryStock", "confirmTransferReceipt", "createMaterialRequisition", "manageMaterialRequisition", "deliverMaterialRequisition", "manageInventoryReplenishmentPolicy", "returnMaterialToInventory", "recognizeAssignedMaterialConsumption", "manageMaintenanceOrder"]
};

function accountingHasRolePermission_(actor, action) {
  var role = String(actor && actor.role || "");
  var permissions = ROLE_PERMISSIONS[role];
  return Array.isArray(permissions) && permissions.indexOf(String(action || "")) !== -1;
}

function apiResponseCorrelationId_(candidate) {
  var supplied = String(candidate || "").trim();
  if (supplied.length >= 8 && supplied.length <= 80 && /^[A-Za-z0-9._-]+$/.test(supplied)) return supplied;
  try {
    if (typeof Utilities !== "undefined" && Utilities.getUuid) return Utilities.getUuid();
  } catch (ignored) {}
  return "IMA-" + Date.now() + "-" + Math.floor(Math.random() * 1000000000);
}

function apiResponsePublicMessage_(code) {
  var messages = {
    AUTH_PERMISSION_DENIED: "No tiene permisos para realizar esta acción.",
    VERIFIED_IDENTITY_REQUIRED: "Debe iniciar sesión para continuar.",
    RESOURCE_NOT_FOUND: "El recurso solicitado no está disponible.",
    INVALID_PAYLOAD: "Los datos enviados no son válidos.",
    VALIDATION_ERROR: "Los datos enviados no son válidos.",
    CONFLICT: "La operación entra en conflicto con el estado actual.",
    LOCK_TIMEOUT: "El servicio está ocupado. Intente nuevamente.",
    SERVICE_UNAVAILABLE: "El servicio no está disponible temporalmente.",
    DEPENDENCY_UNAVAILABLE: "El servicio no está disponible temporalmente.",
    IMPORT_PERMISSION_DENIED: "No tiene permisos para importar estos registros.",
    IMPORT_PREVIEW_INVALID_OR_STALE: "La previsualización expiró o ya no coincide con los datos.",
    MIGRATION_FILE_HASH_REQUIRED: "No se pudo verificar la integridad del archivo de importación.",
    MIGRATION_DESTINATION_MISMATCH: "El destino no corresponde al servicio propietario del registro.",
    MIGRATION_OWNER_SERVICE_NOT_CONFIGURED: "El servicio propietario no está configurado.",
    MIGRATION_OWNER_WRITE_FAILED: "No fue posible guardar los registros en el servicio propietario.",
    MIGRATION_BATCH_ROLLED_BACK: "La importación fue revertida; no se completó el lote.",
    MIGRATION_COMPENSATION_REQUIRED: "La importación requiere revisión de compensación.",
    RESOURCE_OWNERSHIP_REPAIR_REQUIRED: "La importación requiere reparar la asignación de propiedad.",
    IMPORT_TARGET_CHANGED_AFTER_PREVIEW: "El registro de destino cambió después de la previsualización.",
    MIGRATION_IDEMPOTENCY_CONFLICT: "La clave de importación ya fue utilizada con otros datos.",
    MIGRATION_SCHEMA_MISMATCH: "La estructura del destino no coincide con el esquema esperado.",
    MIGRATION_CELL_TYPE_INVALID: "Un campo contiene un tipo de dato no permitido.",
    MIGRATION_FIELD_NOT_ALLOWED: "La importación contiene un campo no permitido.",
    MIGRATION_WRITE_CONTRACT_INVALID: "La solicitud de escritura no cumple el contrato de importación.",
    MIGRATION_WRITE_ALREADY_COMPENSATED: "La escritura ya fue compensada.",
    DEPARTMENT_IMPORT_PERMISSION_DENIED: "No tiene permisos para importar en este departamento.",
    DEPARTMENT_IMPORT_MIXED_DEPARTMENTS: "El lote contiene registros de departamentos diferentes.",
    DEPARTMENT_IMPORT_DEPARTMENT_UNKNOWN: "El lote contiene un departamento no reconocido.",
    ACTIVE_DEPARTMENT_REQUIRED: "Debe seleccionar un departamento activo.",
    ACTIVE_SCOPE_NOT_ASSIGNED: "El departamento activo no está asignado a su cuenta.",
    INTERNAL_ERROR: "No fue posible completar la solicitud.",
    UNHANDLED_EXCEPTION: "No fue posible completar la solicitud.",
    IMPORT_PREVIEW_INVALID_OR_STALE: "La previsualización cambió o venció. Vuelva a validar el archivo.",
    IMPORT_TARGET_CHANGED_AFTER_PREVIEW: "El destino cambió después de la validación. Vuelva a previsualizar.",
    IMPORT_TARGET_SNAPSHOT_UNVERIFIED: "No se pudo verificar el destino. No se sobrescribió ningún registro.",
    IMPORT_PERMISSION_DENIED: "No tiene permisos para importar datos.",
    MIGRATION_BATCH_ROLLED_BACK: "La importación fue revertida porque una operación falló.",
    MIGRATION_COMPENSATION_REQUIRED: "Se requiere revisión técnica: la compensación no pudo completarse.",
    MIGRATION_OWNER_SERVICE_NOT_CONFIGURED: "El servicio propietario no está disponible para completar la importación.",
    IMPORT_FILE_INVALID: "El archivo XLSX no es válido.",
    IMPORT_FILE_MIME_INVALID: "El tipo de archivo no corresponde a un libro XLSX.",
    IMPORT_FILE_SIGNATURE_INVALID: "La firma binaria del archivo no es válida.",
    IMPORT_FILE_PACKAGE_INVALID: "El paquete XLSX está dañado o incompleto.",
    IMPORT_FILE_MACROS_NOT_ALLOWED: "No se permiten libros Excel con macros.",
    IMPORT_FILE_BASE64_INVALID: "El contenido codificado del archivo está dañado.",
    IMPORT_FILE_UNCOMPRESSED_SIZE_LIMIT: "El contenido descomprimido supera el límite de seguridad.",
    MIGRATION_FILE_HASH_REQUIRED: "No se pudo registrar la huella SHA-256 del archivo.",
    MIGRATION_FILE_HASH_AUDIT_SCHEMA_MISMATCH: "El registro de huellas SHA-256 requiere revisión de esquema."
  };
  var key = String(code || "INTERNAL_ERROR");
  return Object.prototype.hasOwnProperty.call(messages, key) ? messages[key] : "No fue posible completar la solicitud.";
}

function buildApiResponseEnvelope_(obj, correlationId, serviceName) {
  var source = obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
  var status = source.status === "error" ? "error" : "success";
  var timestamp = new Date().toISOString();
  var requestId = apiResponseCorrelationId_(correlationId);
  var meta = { timestamp: timestamp, correlationId: requestId };
  if (serviceName) meta.service = String(serviceName);
  if (status === "error") {
    var sourceError = source.error && typeof source.error === "object" ? source.error : {};
    var rawCode = String(source.code || sourceError.code || "INTERNAL_ERROR").trim().toUpperCase();
    var code = /^[A-Z][A-Z0-9_]*$/.test(rawCode) ? rawCode : "INTERNAL_ERROR";
    var message = apiResponsePublicMessage_(code);
    return { apiVersion: API_RESPONSE_VERSION, status: "error",
      error: { code: code, message: message, details: null }, code: code,
      message: message, meta: meta, timestamp: timestamp, correlationId: requestId };
  }
  var data;
  if (Object.prototype.hasOwnProperty.call(source, "data")) data = source.data;
  else {
    data = {};
    var reserved = ["status","data","error","apiVersion","meta","timestamp","correlationId","code","message"];
    Object.keys(source).forEach(function(key) { if (reserved.indexOf(key) === -1) data[key] = source[key]; });
  }
  var envelope = { apiVersion: API_RESPONSE_VERSION, status: "success", data: data,
    meta: meta, timestamp: timestamp, correlationId: requestId };
  Object.keys(source).forEach(function(key) {
    if (["status","data","error","apiVersion","meta","timestamp","correlationId","code","message"].indexOf(key) === -1) {
      envelope[key] = source[key];
    }
  });
  return envelope;
}

function textResponse(value, correlationId, serviceName) {
  var envelope = buildApiResponseEnvelope_(value, correlationId, serviceName || "ACCOUNTING");
  return ContentService.createTextOutput(JSON.stringify(envelope)).setMimeType(ContentService.MimeType.TEXT);
}

function validateApiContractsTestSuite() {
  var success = buildApiResponseEnvelope_({ status: "success", data: [] }, "CONTRACT-SUCCESS-001", "ACCOUNTING");
  var failure = buildApiResponseEnvelope_({ status: "error", code: "INTERNAL_ERROR", message: "Sensitive stack path" }, "CONTRACT-ERROR-001", "ACCOUNTING");
  var migrationFailure = buildApiResponseEnvelope_({ status: "error", code: "MIGRATION_DESTINATION_MISMATCH",
    message: "Sensitive stack path" }, "CONTRACT-ERROR-002", "ACCOUNTING");
  var cases = [
    { action: "success envelope", pass: success.apiVersion === API_RESPONSE_VERSION && success.status === "success" && Array.isArray(success.data) && !!success.meta.correlationId },
    { action: "legitimate empty collection", pass: Array.isArray(success.data) && success.data.length === 0 },
    { action: "structured error envelope", pass: failure.status === "error" && failure.error && failure.error.code === "INTERNAL_ERROR" && !Object.prototype.hasOwnProperty.call(failure, "data") },
    { action: "safe public error message", pass: failure.error.message === "No fue posible completar la solicitud." && failure.error.message.indexOf("Sensitive") === -1 },
    { action: "error is not counted as success", pass: failure.status !== "success" },
    { action: "actionable migration error remains safe", pass: migrationFailure.status === "error" &&
      migrationFailure.error.code === "MIGRATION_DESTINATION_MISMATCH" &&
      migrationFailure.error.message === "El destino no corresponde al servicio propietario del registro." &&
      migrationFailure.error.message.indexOf("Sensitive") === -1 }
  ];
  var passed = cases.filter(function(item) { return item.pass; }).length;
  return { status: passed === cases.length ? "success" : "error", service: "ACCOUNTING",
    apiVersion: API_RESPONSE_VERSION, totalPruebas: cases.length, pruebasExitosas: passed,
    todasPruebasPasaron: passed === cases.length, resultadosContratos: cases };
}


var PURCHASE_QUOTATION_HEADERS_ = ["CotizacionID","SolicitudID","ProveedorID","FechaRecepcion","VigenciaOferta","PrecioTotal","PlazoEntregaDias","CondicionesPago","DocumentoAdjuntoUrl","EstadoSelection","Observaciones"];
var PURCHASE_QUOTATION_DETAIL_HEADERS_ = ["DetalleCotizacionID","CotizacionID","SolicitudID","ItemId","Descripcion","Unidad","CantidadSolicitada","CantidadCotizada","PrecioUnitario","Subtotal","Descuento","Impuestos","Flete","Total","Garantia","CumplimientoTecnico","EspecificacionesCumplidas","FechaRegistro"];
var PURCHASE_AWARD_HEADERS_ = ["ActaID","SolicitudID","Fecha","ResponsablesEvaluacionJSON","Dictamen","Justificacion","MontoAdjudicado","DetalleAdjudicacionJSON","OfertasDescartadasJSON","SnapshotCotizacionesJSON","Estado","AdjudicadoPor","IdempotencyKey","OrdenesCompraJSON"];
var PURCHASE_ORDER_HEADERS_ = ["OrdenCompraID","SolicitudID","CotizacionID","ProveedorID","FechaEmision","FechaEntregaEstimada","DetalleItemsJSON","MontoTotal","CentroCosto","EstadoOrden","AprobadoPor","Observaciones","SolicitanteUserId","VersionDocumental","ArchivoPdfUrl"];
var PURCHASE_REQUEST_HEADERS_ = ["SolicitudID","Fecha","Departamento","SolicitanteUserId","Justificacion","Categoria","DetalleItemsJSON","MontoEstimado","CentroCosto","EstadoAprobacion","Observaciones"];
var PURCHASE_SUPPLIER_HEADERS_ = ["ProveedorID","FechaRegistro","NombreProveedor","RTN","Telefono","Email","RubroServicio","Estado","Observaciones"];

function normalizePurchaseAwardRole_(role) {
  var value = String(role || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
  return ["contador","director","subdirector","administrador","recursoshumanos"].indexOf(value) !== -1 ? value : "";
}
function normalizePurchaseAssetClassification_(value) {
  var source = value && typeof value === "object" ? (value.clasificacionInventario || value.tipoBien ||
    value.clasificacion || value.categoriaInventario || value.tipoActivo || value.tipo || "") : value;
  var raw = String(source || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["activofijo","activofijos","biencapitalizable","bienes capitalizables / activos fijos","bienes capitalizables","capitalizable","patrimonial"].indexOf(raw) !== -1) return "ActivoFijo";
  if (["consumible","consumibles","suministro","suministros"].indexOf(raw) !== -1) return "Consumible";
  return raw ? String(source).trim() : "Inventariable";
}
function purchaseQuotationItemKey_(value) {
  return String(value || "").trim();
}
function purchaseQuotationRound_(value) {
  var number = Number(value);
  if (!isFinite(number)) return NaN;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}
function purchaseQuotationJsonArray_(value) {
  if (Array.isArray(value)) return value;
  if (value === "" || value === null || value === undefined) return [];
  try { var parsed = JSON.parse(String(value)); return Array.isArray(parsed) ? parsed : []; } catch (ignored) { return []; }
}
function purchaseQuotationJsonObject_(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (!value) return {};
  try { var parsed = JSON.parse(String(value)); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch (ignored) { return {}; }
}
function purchaseQuotationSheetSchemaValid_(sheet, expected) {
  if (!sheet) return false;
  var rows = sheet.getDataRange().getValues();
  if (!rows || !rows.length) return false;
  return JSON.stringify(rows[0].map(function(v) { return String(v || "").trim(); })) === JSON.stringify(expected);
}
function purchaseQuotationEnsureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  if (!purchaseQuotationSheetSchemaValid_(sheet, headers)) throw new Error("PURCHASE_QUOTATION_SCHEMA_INVALID");
  return sheet;
}
function purchaseQuotationAccess_(payload, ss, write) {
  var actor = getVerifiedAccountingIdentity_(payload || {});
  if (!actor || actor.authorized !== true) return { authorized: false, code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var role = normalizePurchaseAwardRole_(actor.role);
  if (!role) return { authorized: false, code: "ROLE_NOT_ALLOWED" };
  var scope = getVerifiedAccountingDepartmentScope_(payload || {}, ss, actor);
  if (!scope || (scope.valid !== true && scope.authorized !== true)) return { authorized: false, code: "PURCHASE_SCOPE_UNVERIFIED" };
  return { authorized: true, actor: actor, role: role, scope: scope, write: write === true };
}
function purchaseQuotationRequest_(payload, ss, access, allowAdjudicated) {
  var sheet = getOrCreateSheet(ss, "SolicitudesCompra");
  var rows = sheet.getDataRange().getValues();
  var id = String(payload && payload.solicitudId || "").trim();
  if (!id) throw new Error("PURCHASE_REQUEST_NOT_FOUND");
  var matches = rows.slice(1).map(function(row, index) { return { row: row, index: index + 2 }; })
    .filter(function(item) { return String(item.row[0] || "").trim() === id; });
  if (matches.length !== 1) throw new Error("PURCHASE_REQUEST_NOT_FOUND");
  var match = matches[0], row = match.row;
  var status = String(row[9] || "").trim().toLowerCase();
  if (status !== "aprobada" && !(allowAdjudicated && status === "adjudicada")) throw new Error("PURCHASE_REQUEST_NOT_APPROVED");
  var departmentId = String(row[2] || "").trim();
  var scope = access.scope;
  var departments = Array.isArray(scope.departmentIds) ? scope.departmentIds.map(String) : [];
  if (scope.institutionWide !== true && departments.indexOf(departmentId) === -1) throw new Error("RESOURCE_NOT_FOUND");
  var items = purchaseQuotationJsonArray_(row[6]);
  if (!items.length) throw new Error("PURCHASE_REQUEST_ITEMS_INVALID");
  var seen = {};
  items = items.map(function(item, index) {
    var itemId = purchaseQuotationItemKey_(item && (item.itemId || item.ItemId || item.id || item.codigo || ("ITEM-" + (index + 1))));
    if (!itemId || seen[itemId]) throw new Error("PURCHASE_REQUEST_ITEMS_INVALID");
    seen[itemId] = true;
    var quantity = Number(item.cantidad === undefined ? item.Cantidad : item.cantidad);
    if (!isFinite(quantity) || quantity <= 0) throw new Error("PURCHASE_REQUEST_ITEMS_INVALID");
    return { itemId: itemId, descripcion: String(item.descripcion || item.Descripcion || "").trim(),
      unidad: String(item.unidad || item.Unidad || "").trim(), cantidad: quantity,
      especificaciones: String(item.especificaciones || item.especificacionesTecnicas || item.Especificaciones || "").trim(),
      clasificacionInventario: normalizePurchaseAssetClassification_(item.clasificacionInventario || item.tipoActivo || item.categoriaInventario) };
  });
  return { sheet: sheet, row: row, rowIndex: match.index, solicitudId: id, departmentId: departmentId,
    centroCosto: String(row[8] || "").trim(), solicitanteUserId: String(row[3] || "").trim(), items: items };
}
function purchaseQuoteIsValid_(row, now) {
  var status = String(row[9] || "").trim().toLowerCase();
  if (["rechazada","anulada","vencida"].indexOf(status) !== -1) return false;
  var received = row[3] instanceof Date ? row[3] : new Date(row[3]);
  if (isNaN(received.getTime())) return false;
  var expiry = row[4];
  var match = String(expiry || "").match(/(\d+)\s*d[ií]a/i);
  if (match) return received.getTime() + Number(match[1]) * 86400000 >= (now || new Date()).getTime();
  var explicit = expiry instanceof Date ? expiry : new Date(expiry);
  if (!isNaN(explicit.getTime())) return explicit.getTime() >= (now || new Date()).getTime();
  return true;
}
function submitPurchaseQuotation(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = purchaseQuotationAccess_(input, ss, true);
  if (!access.authorized) return { status: "error", code: access.code };
  var request;
  try { request = purchaseQuotationRequest_(input, ss, access, false); } catch (error) { return { status: "error", code: String(error.message || "PURCHASE_REQUEST_INVALID") }; }
  var supplierId = String(input.proveedorId || "").trim();
  var supplierSheet = getOrCreateSheet(ss, "ProveedoresActivos");
  var suppliers = supplierSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return String(row[0] || "").trim() === supplierId && String(row[7] || "").trim().toLowerCase() === "activo";
  });
  if (!supplierId || suppliers.length !== 1) return { status: "error", code: "PURCHASE_SUPPLIER_NOT_ACTIVE" };
  var details = Array.isArray(input.detalleItems) ? input.detalleItems : [];
  if (!details.length) return { status: "error", code: "PURCHASE_QUOTATION_ITEMS_INVALID" };
  var requested = {};
  request.items.forEach(function(item) { requested[item.itemId] = item; });
  var seen = {}, prepared = [], total = 0;
  for (var i = 0; i < details.length; i++) {
    var line = details[i] || {}, itemId = purchaseQuotationItemKey_(line.itemId || line.ItemId);
    var base = requested[itemId], quantity = Number(line.cantidadCotizada), price = purchaseQuotationRound_(line.precioUnitario);
    if (!base || seen[itemId] || !isFinite(quantity) || quantity <= 0 || quantity > base.cantidad || !isFinite(price) || price < 0) {
      return { status: "error", code: "PURCHASE_QUOTATION_ITEMS_INVALID" };
    }
    seen[itemId] = true;
    var discount = purchaseQuotationRound_(line.descuento || 0), tax = purchaseQuotationRound_(line.impuestos || 0), freight = purchaseQuotationRound_(line.flete || 0);
    if ([discount,tax,freight].some(function(v) { return !isFinite(v) || v < 0; })) return { status: "error", code: "PURCHASE_QUOTATION_ITEMS_INVALID" };
    var subtotal = purchaseQuotationRound_(quantity * price), lineTotal = purchaseQuotationRound_(subtotal - discount + tax + freight);
    if (lineTotal < 0) return { status: "error", code: "PURCHASE_QUOTATION_ITEMS_INVALID" };
    total = purchaseQuotationRound_(total + lineTotal);
    prepared.push(["", "", request.solicitudId, itemId, base.descripcion, base.unidad, base.cantidad, quantity,
      price, subtotal, discount, tax, freight, lineTotal, String(line.garantia || ""), String(line.cumplimientoTecnico || ""),
      line.especificacionesCumplidas === true, new Date()]);
  }
  var declared = purchaseQuotationRound_(input.precioTotal);
  if (!isFinite(declared) || declared <= 0 || Math.abs(declared - total) > 0.01) return { status: "error", code: "PURCHASE_QUOTATION_TOTAL_MISMATCH" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  var quoteSheet, detailSheet, quoteRow = 0, detailStart = 0;
  try {
    var recheck = getVerifiedAccountingIdentity_(input);
    if (!recheck || recheck.authorized !== true || String(recheck.userId) !== String(access.actor.userId) ||
        String(recheck.role) !== String(access.actor.role)) return { status: "error", code: "VERIFIED_IDENTITY_CHANGED" };
    access = purchaseQuotationAccess_(input, ss, true);
    if (!access.authorized) return { status: "error", code: access.code };
    request = purchaseQuotationRequest_(input, ss, access, false);
    quoteSheet = getOrCreateSheet(ss, "CotizacionesCompra");
    detailSheet = getOrCreateSheet(ss, "DetalleCotizacionesCompra");
    var existing = quoteSheet.getDataRange().getValues().slice(1).filter(function(row) {
      return String(row[1] || "").trim() === request.solicitudId && String(row[2] || "").trim() === supplierId &&
        ["rechazada","anulada"].indexOf(String(row[9] || "").trim().toLowerCase()) === -1;
    });
    if (existing.length) return { status: "error", code: "PURCHASE_QUOTATION_DUPLICATE_SUPPLIER" };
    var quoteId = "COT-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
    quoteRow = quoteSheet.getLastRow() + 1;
    quoteSheet.appendRow([quoteId, request.solicitudId, supplierId, new Date(), String(input.vigenciaOferta || "30 días"),
      total, Math.max(0, Math.floor(Number(input.plazoEntregaDias || 0))), String(input.condicionesPago || "Contado"),
      String(input.documentoAdjuntoUrl || ""), "EnRevision", String(input.observaciones || "").slice(0, 500)]);
    detailStart = detailSheet.getLastRow() + 1;
    prepared.forEach(function(row, index) {
      row[0] = "DET-" + quoteId + "-" + (index + 1);
      row[1] = quoteId;
      detailSheet.appendRow(row);
    });
    return { status: "success", cotizacionId: quoteId, partidasRegistradas: prepared.length };
  } catch (error) {
    if (quoteRow && quoteSheet) try { quoteSheet.getRange(quoteRow, 1, 1, 11).clearContent(); } catch (ignored) {}
    if (detailStart && detailSheet) try {
      var count = detailSheet.getLastRow() - detailStart + 1;
      if (count > 0) detailSheet.getRange(detailStart, 1, count, 18).clearContent();
    } catch (ignored2) {}
    return { status: "error", code: String(error && error.message || "PURCHASE_QUOTATION_WRITE_FAILED") };
  } finally { lock.releaseLock(); }
}
function getPurchaseQuotations(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID), access = purchaseQuotationAccess_(input, ss, false);
  if (!access.authorized) return { status: "error", code: access.code };
  var request;
  try { request = purchaseQuotationRequest_(input, ss, access, true); } catch (error) { return { status: "error", code: String(error.message || "PURCHASE_REQUEST_INVALID") }; }
  var sheet = getOrCreateSheet(ss, "CotizacionesCompra");
  var rows = sheet.getDataRange().getValues().slice(1).filter(function(row) { return String(row[1] || "").trim() === request.solicitudId; });
  return { status: "success", cotizaciones: rows.map(function(row) { return { cotizacionId: row[0], solicitudId: row[1],
    proveedorId: row[2], fechaRecepcion: row[3], vigenciaOferta: row[4], precioTotal: Number(row[5] || 0),
    plazoEntregaDias: Number(row[6] || 0), condicionesPago: row[7], documentoAdjuntoUrl: row[8],
    estadoSelection: row[9], observaciones: row[10] }; }) };
}
function getPurchaseQuotationMatrix(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID), access = purchaseQuotationAccess_(input, ss, false);
  if (!access.authorized) return { status: "error", code: access.code };
  var request;
  try { request = purchaseQuotationRequest_(input, ss, access, true); } catch (error) { return { status: "error", code: String(error.message || "PURCHASE_REQUEST_INVALID") }; }
  var quoteSheet = getOrCreateSheet(ss, "CotizacionesCompra");
  var detailSheet = getOrCreateSheet(ss, "DetalleCotizacionesCompra");
  var supplierSheet = getOrCreateSheet(ss, "ProveedoresActivos");
  var quoteRows = quoteSheet.getDataRange().getValues().slice(1).filter(function(row) { return String(row[1] || "").trim() === request.solicitudId; }).slice(0,5);
  var details = detailSheet.getDataRange().getValues().slice(1), suppliers = supplierSheet.getDataRange().getValues().slice(1), now = new Date();
  var awardSheet = getOrCreateSheet(ss, "ActasAdjudicacionCompra");
  var awardRows = awardSheet.getDataRange().getValues().slice(1).filter(function(row) { return String(row[1] || "").trim() === request.solicitudId && String(row[10] || "").trim() === "Aprobada"; });
  var latestAward = awardRows.length ? awardRows[awardRows.length - 1] : null;
  var snapshot = latestAward ? purchaseQuotationJsonObject_(latestAward[9]) : {};
  if (latestAward && Array.isArray(snapshot.cotizaciones)) quoteRows = snapshot.cotizaciones;
  if (latestAward && Array.isArray(snapshot.detalleCotizaciones)) details = snapshot.detalleCotizaciones;
  if (latestAward) {
    var awardedQuoteIds = {};
    purchaseQuotationJsonArray_(latestAward[7]).forEach(function(line) { awardedQuoteIds[String(line.cotizacionId || "")] = true; });
    quoteRows = quoteRows.map(function(row) {
      if (!awardedQuoteIds[String(row[0] || "")]) return row;
      var copy = row.slice(); copy[9] = "AdjudicadaParcial"; return copy;
    });
  }
  var mappedQuotes = quoteRows.map(function(row) {
    var supplier = suppliers.filter(function(s) { return String(s[0] || "").trim() === String(row[2] || "").trim(); })[0];
    var valid = purchaseQuoteIsValid_(row, now);
    var quoteDetails = details.filter(function(d) { return String(d[1] || "").trim() === String(row[0] || "").trim(); });
    return { cotizacionId: row[0], solicitudId: row[1], proveedorId: row[2], proveedorNombre: supplier && supplier[2] || String(row[2] || ""),
      proveedorActivo: !!(supplier && String(supplier[7] || "").trim().toLowerCase() === "activo"),
      fechaRecepcion: row[3], vigenciaOferta: row[4], precioTotal: Number(row[5] || 0), plazoEntregaDias: Number(row[6] || 0),
      condicionesPago: row[7], documentoAdjuntoUrl: row[8], estadoSelection: row[9], vigente: valid,
      ofertas: quoteDetails };
  });
  var matrixItems = request.items.map(function(item) {
    var offers = mappedQuotes.map(function(quote) {
      var line = quote.ofertas.filter(function(d) { return String(d[3] || "") === item.itemId; })[0];
      return { cotizacionId: quote.cotizacionId, proveedorId: quote.proveedorId, proveedorNombre: quote.proveedorNombre,
        precioUnitario: line ? Number(line[8] || 0) : null, cantidadCotizada: line ? Number(line[7] || 0) : 0,
        subtotal: line ? Number(line[9] || 0) : 0, descuento: line ? Number(line[10] || 0) : 0,
        impuestos: line ? Number(line[11] || 0) : 0, flete: line ? Number(line[12] || 0) : 0,
        total: line ? Number(line[13] || 0) : 0, garantia: line ? line[14] : "",
        cumplimientoTecnico: line ? line[15] : "", especificacionesCumplidas: !!(line && line[16] === true),
        estadoOferta: !line ? "NO_COTIZADA" : Number(line[7] || 0) < item.cantidad ? "PARCIAL" : "COMPLETA",
        menorPrecio: false, vigente: quote.vigente };
    });
    var prices = offers.filter(function(o) { return o.vigente && o.precioUnitario !== null && o.especificacionesCumplidas; }).map(function(o) { return o.precioUnitario; });
    if (prices.length) {
      var min = Math.min.apply(null, prices);
      offers.forEach(function(o) { o.menorPrecio = o.vigente && o.precioUnitario !== null && o.precioUnitario === min; });
    }
    return { itemId: item.itemId, descripcion: item.descripcion, unidad: item.unidad, cantidadSolicitada: item.cantidad,
      especificaciones: item.especificaciones, ofertas: offers };
  });
  var award = null;
  if (latestAward) award = { actaId: latestAward[0], solicitudId: latestAward[1], fecha: latestAward[2],
    responsablesEvaluacion: purchaseQuotationJsonArray_(latestAward[3]), dictamen: latestAward[4], justificacion: latestAward[5],
    montoAdjudicado: Number(latestAward[6] || 0), adjudicaciones: purchaseQuotationJsonArray_(latestAward[7]),
    ofertasDescartadas: purchaseQuotationJsonArray_(latestAward[8]), estado: latestAward[10],
    ordenes: purchaseQuotationJsonArray_(latestAward[13]) };
  return { status: "success", solicitudId: request.solicitudId,
    solicitud: { solicitudId: request.solicitudId, departamento: request.departmentId, centroCosto: request.centroCosto },
    totalCotizaciones: mappedQuotes.length, adjudicada: !!latestAward, actaId: latestAward ? latestAward[0] : "",
    cotizaciones: mappedQuotes.map(function(q) {
    return { cotizacionId:q.cotizacionId, solicitudId:q.solicitudId, proveedorId:q.proveedorId, proveedorNombre:q.proveedorNombre,
      proveedorActivo:q.proveedorActivo, precioTotal:q.precioTotal, plazoEntregaDias:q.plazoEntregaDias, condicionesPago:q.condicionesPago,
      estadoSelection:q.estadoSelection, vigente:q.vigente };
  }), partidas: matrixItems, adjudicacion: award };
}
function adjudicatePurchaseQuotations(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID), access = purchaseQuotationAccess_(input, ss, true);
  if (!access.authorized) return { status: "error", code: access.code };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  var orderSheet, awardSheet, quoteSheet, request, createdOrders = [], createdAwardRow = 0, createdAwardId = "", quoteUpdates = [];
  try {
    var actor = access.actor;
    if (typeof getVerifiedAccountingIdentity_ === "function") {
      actor = getVerifiedAccountingIdentity_(input);
      if (!actor || actor.authorized !== true || String(actor.userId) !== String(access.actor.userId) ||
          String(actor.role) !== String(access.actor.role)) return { status: "error", code: "VERIFIED_IDENTITY_CHANGED" };
    }
    access = purchaseQuotationAccess_(input, ss, true);
    if (!access.authorized) return { status: "error", code: access.code };
    request = purchaseQuotationRequest_(input, ss, access, true);
    var key = String(input.idempotencyKey || "").trim();
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(key)) return { status: "error", code: "PURCHASE_AWARD_IDEMPOTENCY_KEY_REQUIRED" };
    awardSheet = getOrCreateSheet(ss, "ActasAdjudicacionCompra");
    var awards = awardSheet.getDataRange().getValues();
    var previous = awards.slice(1).filter(function(row) { return String(row[1] || "") === request.solicitudId && String(row[12] || "") === key; });
    if (previous.length) return { status: "success", actaId: previous[0][0], idempotente: true, ordenes: purchaseQuotationJsonArray_(previous[0][13]) };
    var assignments = Array.isArray(input.adjudicaciones) ? input.adjudicaciones : [];
    if (!assignments.length) return { status: "error", code: "PURCHASE_AWARD_ITEMS_REQUIRED" };
    if (String(input.dictamen || "").trim().length < 10 || !String(input.justificacion || "").trim()) {
      return { status: "error", code: "PURCHASE_AWARD_JUSTIFICATION_REQUIRED" };
    }
    var quoteSheetLocal = getOrCreateSheet(ss, "CotizacionesCompra");
    var detailSheet = getOrCreateSheet(ss, "DetalleCotizacionesCompra");
    var supplierSheet = getOrCreateSheet(ss, "ProveedoresActivos");
    var quoteRows = quoteSheetLocal.getDataRange().getValues(), detailRows = detailSheet.getDataRange().getValues().slice(1);
    var quoteById = {}, supplierRows = supplierSheet.getDataRange().getValues().slice(1);
    quoteRows.slice(1).forEach(function(row) { if (String(row[1] || "") === request.solicitudId) quoteById[String(row[0])] = row; });
    var itemById = {}; request.items.forEach(function(item) { itemById[item.itemId] = item; });
    var allocationTotals = {}, quoteQuantityTotals = {}, orderGroups = {}, awardLines = [], totalAward = 0;
    var activeQuoteIds = {};
    quoteRows.slice(1).forEach(function(row) {
      if (String(row[1] || "") === request.solicitudId && purchaseQuoteIsValid_(row, new Date())) activeQuoteIds[String(row[0])] = true;
    });
    assignments.forEach(function(line) {
      var itemId = purchaseQuotationItemKey_(line.itemId), quoteId = String(line.cotizacionId || "").trim();
      var item = itemById[itemId], quote = quoteById[quoteId];
      var qty = Number(line.cantidadAdjudicada);
      if (!item || !quote || !isFinite(qty) || qty <= 0) throw new Error("PURCHASE_AWARD_ALLOCATION_INVALID");
      if (!purchaseQuoteIsValid_(quote, new Date())) throw new Error("PURCHASE_AWARD_QUOTATION_EXPIRED");
      var quoteLine = detailRows.filter(function(d) { return String(d[1]) === quoteId && String(d[3]) === itemId; })[0];
      if (!quoteLine || !quoteLine[16] || qty > Number(quoteLine[7] || 0)) throw new Error("PURCHASE_AWARD_QUOTE_QUANTITY_EXCEEDED");
      var allocationKey = quoteId + "|" + itemId;
      quoteQuantityTotals[allocationKey] = (quoteQuantityTotals[allocationKey] || 0) + qty;
      if (quoteQuantityTotals[allocationKey] > Number(quoteLine[7] || 0)) throw new Error("PURCHASE_AWARD_QUOTE_QUANTITY_EXCEEDED");
      allocationTotals[itemId] = (allocationTotals[itemId] || 0) + qty;
      var unitPrice = Number(quoteLine[8] || 0), subtotal = purchaseQuotationRound_(unitPrice * qty);
      var ratio = qty / Number(quoteLine[7] || qty);
      var discount = purchaseQuotationRound_(Number(quoteLine[10] || 0) * ratio);
      var tax = purchaseQuotationRound_(Number(quoteLine[11] || 0) * ratio);
      var freight = purchaseQuotationRound_(Number(quoteLine[12] || 0) * ratio);
      var amount = purchaseQuotationRound_(subtotal - discount + tax + freight);
      var group = orderGroups[quoteId] || (orderGroups[quoteId] = { quote: quote, supplierId: String(quote[2]), lines: [], amount: 0 });
      group.lines.push({ itemId: itemId, descripcion: item.descripcion, unidad: item.unidad, cantidad: qty,
        cantidadCotizada: Number(quoteLine[7]), precioUnitario: unitPrice, subtotal: subtotal, descuento: discount,
        impuestos: tax, flete: freight, total: amount, garantia: quoteLine[14], cumplimientoTecnico: quoteLine[15],
        especificacionesCumplidas: quoteLine[16] === true, clasificacionInventario: item.clasificacionInventario,
        capitalizable: item.clasificacionInventario === "ActivoFijo", cotizacionId: quoteId });
      group.amount = purchaseQuotationRound_(group.amount + amount);
      totalAward = purchaseQuotationRound_(totalAward + amount);
      awardLines.push({ itemId: itemId, cotizacionId: quoteId, proveedorId: group.supplierId, cantidadAdjudicada: qty,
        precioUnitario: unitPrice, subtotal: subtotal, total: amount });
    });
    request.items.forEach(function(item) {
      if (Math.abs((allocationTotals[item.itemId] || 0) - item.cantidad) > 0.000001) throw new Error("PURCHASE_AWARD_ALLOCATION_INCOMPLETE");
      var prices = detailRows.filter(function(d) {
        return String(d[2]) === request.solicitudId && String(d[3]) === item.itemId &&
          d[16] === true && activeQuoteIds[String(d[1])] === true && isFinite(Number(d[8]));
      }).map(function(d) { return Number(d[8]); });
      if (prices.length) {
        var lowest = Math.min.apply(null, prices);
        var selected = awardLines.filter(function(a) { return a.itemId === item.itemId; });
        var selectedAboveLowest = selected.some(function(a) { return a.precioUnitario > lowest + 0.000001; });
        if (selectedAboveLowest && String(input.justificacion || "").trim().length < 40) {
          throw new Error("PURCHASE_AWARD_NON_LOWEST_JUSTIFICATION_REQUIRED");
        }
      }
    });
    var rejected = Array.isArray(input.ofertasDescartadas) ? input.ofertasDescartadas : [];
    rejected.forEach(function(item) {
      if (!quoteById[String(item.cotizacionId || "")] || String(item.motivo || "").trim().length < 10) throw new Error("PURCHASE_AWARD_REJECTION_REASON_REQUIRED");
    });
    var responsible = Array.isArray(input.responsablesEvaluacion) ? input.responsablesEvaluacion.map(String).filter(Boolean) : [];
    if (responsible.indexOf(String(actor.userId)) === -1) responsible.push(String(actor.userId));
    var suppliers = {};
    Object.keys(orderGroups).forEach(function(id) {
      var group = orderGroups[id], supplier = supplierRows.filter(function(s) { return String(s[0]) === group.supplierId; })[0];
      if (!supplier) throw new Error("PURCHASE_SUPPLIER_NOT_FOUND");
      suppliers[id] = supplier;
    });
    var snapshotQuotes = quoteRows.slice(1).filter(function(row) { return String(row[1]) === request.solicitudId; });
    var snapshotDetails = detailRows.filter(function(row) { return String(row[2]) === request.solicitudId; });
    var orderIds = [], now = new Date();
    orderSheet = getOrCreateSheet(ss, "OrdenesCompra");
    Object.keys(orderGroups).forEach(function(quoteId) {
      var group = orderGroups[quoteId], orderId = "OC-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
      var eta = new Date(now.getTime() + Number(group.quote[6] || 0) * 86400000);
      var orderLineItems = group.lines.map(function(line) { return Object.assign({}, line, {
        condicionesPago: String(group.quote[7] || ""), plazoEntregaDias: Number(group.quote[6] || 0),
        proveedorId: group.supplierId, proveedorNombre: String(suppliers[quoteId][2] || "") }); });
      orderSheet.appendRow([orderId, request.solicitudId, quoteId, group.supplierId, now, eta, JSON.stringify(orderLineItems),
        group.amount, request.centroCosto, "Borrador", "", "Adjudicación " + request.solicitudId,
        request.solicitanteUserId, "1", ""]);
      createdOrders.push(orderSheet.getLastRow());
      orderIds.push({ ordenCompraId: orderId, cotizacionId: quoteId, proveedorId: group.supplierId, montoTotal: group.amount });
    });
    createdAwardId = "ACTA-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
    var snapshot = { cotizaciones: snapshotQuotes, detalleCotizaciones: snapshotDetails };
    createdAwardRow = awardSheet.getLastRow() + 1;
    awardSheet.appendRow([createdAwardId, request.solicitudId, now, JSON.stringify(responsible), String(input.dictamen).trim(),
      String(input.justificacion).trim(), totalAward, JSON.stringify(awardLines), JSON.stringify(rejected),
      JSON.stringify(snapshot), "Aprobada", actor.userId, key, JSON.stringify(orderIds)]);
    quoteSheet = quoteSheetLocal;
    var quoteIds = {};
    awardLines.forEach(function(line) { quoteIds[line.cotizacionId] = true; });
    Object.keys(quoteIds).forEach(function(id) {
      var rowIndex = quoteRows.findIndex(function(row, index) { return index > 0 && String(row[0]) === id; });
      if (rowIndex < 1) throw new Error("PURCHASE_QUOTATION_NOT_FOUND");
      var oldState = quoteRows[rowIndex][9];
      quoteUpdates.push({ row: rowIndex + 1, state: oldState });
      quoteSheet.getRange(rowIndex + 1, 10).setValue("AdjudicadaParcial");
    });
    request.sheet.getRange(request.rowIndex, 10).setValue("Adjudicada");
    return { status: "success", actaId: createdAwardId, ordenes: orderIds, montoAdjudicado: totalAward };
  } catch (error) {
    createdOrders.forEach(function(row) { try { orderSheet.getRange(row, 1, 1, 15).clearContent(); } catch (ignored) {} });
    if (createdAwardRow && awardSheet) {
      try { awardSheet.getRange(createdAwardRow, 1, 1, 14).clearContent(); } catch (ignored2) {}
      try {
        var awardRowsAfterFailure = awardSheet.getDataRange().getValues();
        awardRowsAfterFailure.forEach(function(row, index) {
          if (String(row[0] || "") === createdAwardId) awardSheet.getRange(index + 1, 1, 1, 14).clearContent();
        });
      } catch (ignoredAwardScan) {}
    }
    quoteUpdates.forEach(function(item) { try { quoteSheet.getRange(item.row, 10).setValue(item.state); } catch (ignored3) {} });
    return { status: "error", code: String(error && error.message || "PURCHASE_AWARD_WRITE_FAILED") };
  } finally { lock.releaseLock(); }
}


function recordPurchaseReceipt(payload) {
  var input = payload || {};
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var orderSheet = getOrCreateSheet(ss, "OrdenesCompra");
    var receiptSheet = getOrCreateSheet(ss, "RecepcionesCompra");
    var orderRows = orderSheet.getDataRange().getValues();
    var receiptRows = receiptSheet.getDataRange().getValues();
    if (!orderRows || !orderRows.length || !receiptRows || !receiptRows.length) throw new Error("PURCHASE_RECEIPT_SCHEMA_INVALID");
    var orderHeaders = orderRows[0].map(function(v) { return String(v || "").trim(); });
    var receiptHeaders = receiptRows[0].map(function(v) { return String(v || "").trim(); });
    function indexOfHeader(headers, name, fallback) {
      var index = headers.indexOf(name);
      return index >= 0 ? index : fallback;
    }
    var orderIdIndex = indexOfHeader(orderHeaders, "OrdenCompraID", 0);
    var orderStateIndex = indexOfHeader(orderHeaders, "EstadoOrden", 9);
    var orderItemsIndex = indexOfHeader(orderHeaders, "DetalleItemsJSON", 6);
    var orderSupplierIndex = indexOfHeader(orderHeaders, "ProveedorID", 3);
    var orderCostCenterIndex = indexOfHeader(orderHeaders, "CentroCosto", 8);
    var orderRowsFound = orderRows.slice(1).map(function(row, index) { return { row: row, index: index + 2 }; })
      .filter(function(item) { return String(item.row[orderIdIndex] || "").trim() === String(input.ordenCompraId || "").trim(); });
    if (orderRowsFound.length !== 1) throw new Error("PURCHASE_ORDER_NOT_FOUND");
    var orderRecord = orderRowsFound[0], order = orderRecord.row;
    var orderState = String(order[orderStateIndex] || "").trim().toLowerCase();
    if (["aprobada","recibidaparcial"].indexOf(orderState) === -1) throw new Error("PURCHASE_ORDER_NOT_RECEIVABLE");
    var orderItems;
    try { orderItems = JSON.parse(String(order[orderItemsIndex] || "[]")); } catch (ignored) { throw new Error("PURCHASE_ORDER_ITEMS_INVALID"); }
    if (!Array.isArray(orderItems) || !orderItems.length) throw new Error("PURCHASE_ORDER_ITEMS_INVALID");
    var ordered = {}, summary = {};
    orderItems.forEach(function(item) {
      var code = String(item && (item.codigoItem || item.itemId || item.ItemId || item.codigo || item.itemCodigo) || "").trim();
      var quantity = Number(item && (item.cantidad === undefined ? item.Cantidad : item.cantidad));
      if (!code || !isFinite(quantity) || quantity <= 0 || ordered[code]) throw new Error("PURCHASE_ORDER_ITEMS_INVALID");
      ordered[code] = { codigoItem: code, nombreItem: String(item.nombreItem || item.descripcion || item.nombre || ""),
        cantidadSolicitada: quantity, unidadMedida: String(item.unidadMedida || item.unidad || "Unidad"),
        costoUnitario: Number(item.precioUnitario === undefined ? (item.costoUnitario || 0) : item.precioUnitario),
        recibidaConforme: 0, danadaRechazada: 0, pendiente: quantity };
    });
    function parseDetails(value) {
      if (Array.isArray(value)) return value;
      try { var parsed = JSON.parse(String(value || "[]")); return Array.isArray(parsed) ? parsed : []; } catch (ignored) { return []; }
    }
    receiptRows.slice(1).forEach(function(row) {
      if (String(row[indexOfHeader(receiptHeaders, "OrdenCompraID", 1)] || "").trim() !== String(input.ordenCompraId || "").trim()) return;
      var priorDetails = parseDetails(row[indexOfHeader(receiptHeaders, "DetalleJSON", 4)]);
      priorDetails.forEach(function(detail) {
        var code = String(detail.codigoItem || detail.itemId || detail.itemCodigo || "").trim();
        if (!ordered[code]) return;
        var quantity = Number(detail.cantidad || detail.cantidadRecibida || 0);
        if (!isFinite(quantity) || quantity <= 0) return;
        var conforming = detail.conforme === true || String(detail.estadoConformidad || "").toLowerCase() === "conforme";
        if (conforming) ordered[code].recibidaConforme += quantity;
        else ordered[code].danadaRechazada += quantity;
      });
    });
    var incoming = Array.isArray(input.detalleRecibido) ? input.detalleRecibido : [];
    if (!incoming.length) throw new Error("PURCHASE_RECEIPT_DETAILS_REQUIRED");
    var seen = {}, normalized = [], conformingLines = [], damagedLines = [];
    var overall = String(input.estadoConformidad || "Conforme").trim().toLowerCase();
    incoming.forEach(function(detail) {
      var code = String(detail && (detail.codigoItem || detail.itemId || detail.itemCodigo || detail.ItemId) || "").trim();
      var quantity = Number(detail && (detail.cantidad === undefined ? detail.cantidadRecibida : detail.cantidad));
      if (!code || !ordered[code]) throw new Error("PURCHASE_RECEIPT_ITEM_NOT_AUTHORIZED");
      if (seen[code] || !isFinite(quantity) || quantity <= 0) throw new Error("PURCHASE_RECEIPT_QUANTITY_INVALID");
      seen[code] = true;
      if (ordered[code].recibidaConforme + ordered[code].danadaRechazada + quantity > ordered[code].cantidadSolicitada + 0.000001) {
        throw new Error("PURCHASE_RECEIPT_QUANTITY_EXCEEDED");
      }
      var isDamaged = overall === "danado" || overall === "dañado" || detail.conforme === false ||
        String(detail.estadoConformidad || "").toLowerCase() === "danado" || String(detail.estadoConformidad || "").toLowerCase() === "dañado";
      var line = { codigoItem: code, itemId: code, nombreItem: String(detail.nombreItem || ordered[code].nombreItem || ""),
        cantidad: quantity, unidadMedida: String(detail.unidadMedida || detail.unidad || ordered[code].unidadMedida),
        conforme: !isDamaged, estadoConformidad: isDamaged ? "Danado" : "Conforme" };
      normalized.push(line);
      if (isDamaged) damagedLines.push(line); else conformingLines.push(line);
    });
    var registrarInventario = input.registrarEnInventario === true;
    if (registrarInventario && overall !== "danado" && overall !== "dañado") {
      conformingLines.forEach(function(line) {
        var catalogItem = catalogFindItem_(ss, line.codigoItem);
        if (!catalogItem) throw new Error("PURCHASE_RECEIPT_ITEM_NOT_AUTHORIZED");
        var unit = catalogFindUnit_(ss, line.unidadMedida);
        if (!unit) throw new Error("PURCHASE_RECEIPT_UNIT_INVALID");
      });
    }
    var receiptId = "REC-" + String(Date.now()) + "-" + String(input.ordenCompraId || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 16) + "-" + String(receiptRows.length);
    var now = new Date();
    var inventoryResults = [];
    if (registrarInventario && overall !== "danado" && overall !== "dañado") {
      conformingLines.forEach(function(line) {
        var catalogItem = catalogFindItem_(ss, line.codigoItem);
        var unit = catalogFindUnit_(ss, line.unidadMedida);
        var unitCost = Number(ordered[line.codigoItem].costoUnitario || 0);
        var move = {
          itemCodigo: line.codigoItem, itemNombre: line.nombreItem || catalogItem.name || catalogItem.nombre || line.codigoItem,
          tipoMovimiento: "EntradaCompra", cantidad: line.cantidad, unidadMedida: line.unidadMedida,
          costoUnitario: unitCost, ordenCompraId: String(input.ordenCompraId), exigirCostoDocumento: true,
          documentOrigen: "Recepción de orden de compra " + String(input.ordenCompraId),
          facturaId: String(input.facturaId || ""), proveedorId: String(order[orderSupplierIndex] || ""),
          centroCosto: String(order[orderCostCenterIndex] || ""), recepcionId: receiptId,
          unidadBase: unit.base || line.unidadMedida, factorConversion: Number(unit.factor || 1)
        };
        var result = recordInventoryMovementLocked_(ss, move);
        if (!result || result.status !== "success") throw new Error(result && result.code || "PURCHASE_RECEIPT_INVENTORY_WRITE_FAILED");
        inventoryResults.push(result);
      });
    }
    normalized.forEach(function(line) {
      if (line.conforme) ordered[line.codigoItem].recibidaConforme += line.cantidad;
      else ordered[line.codigoItem].danadaRechazada += line.cantidad;
    });
    var summary = Object.keys(ordered).map(function(code) {
      var item = ordered[code];
      item.pendiente = Math.max(0, item.cantidadSolicitada - item.recibidaConforme - item.danadaRechazada);
      return item;
    });
    var hasDamaged = summary.some(function(item) { return item.danadaRechazada > 0; });
    var allReceived = summary.every(function(item) { return item.recibidaConforme >= item.cantidadSolicitada - 0.000001; });
    var orderStatus = hasDamaged ? "EnDisputa" : (allReceived ? "RecibidaTotal" : "RecibidaParcial");
    var receiptState = hasDamaged ? "Danado" : "Conforme";
    var detailIndex = indexOfHeader(receiptHeaders, "DetalleJSON", 4);
    var receiptRow = [];
    receiptRow[indexOfHeader(receiptHeaders, "RecepcionID", 0)] = receiptId;
    receiptRow[indexOfHeader(receiptHeaders, "OrdenCompraID", 1)] = String(input.ordenCompraId);
    receiptRow[indexOfHeader(receiptHeaders, "Fecha", 2)] = now;
    receiptRow[indexOfHeader(receiptHeaders, "ReceptorUserId", 3)] = String(input.receptorUserId || input.userId || "");
    receiptRow[detailIndex] = JSON.stringify(normalized);
    receiptRow[indexOfHeader(receiptHeaders, "EstadoConformidad", 5)] = receiptState;
    receiptRow[indexOfHeader(receiptHeaders, "RegistrarInventario", 6)] = registrarInventario && inventoryResults.length > 0;
    receiptRow[indexOfHeader(receiptHeaders, "AsientoID", 7)] = "";
    receiptRow[indexOfHeader(receiptHeaders, "Observaciones", 8)] = String(input.observaciones || "").slice(0, 500);
    var receiptWidth = Math.max(receiptHeaders.length, receiptRow.length);
    for (var i = 0; i < receiptWidth; i++) if (receiptRow[i] === undefined) receiptRow[i] = "";
    receiptSheet.appendRow(receiptRow);
    orderSheet.getRange(orderRecord.index, orderStateIndex + 1).setValue(orderStatus);
    return { status: "success", recepcionId: receiptId, ordenCompraId: String(input.ordenCompraId),
      estadoOrden: orderStatus, resumenPartidas: summary, movimientosInventario: inventoryResults.length };
  } finally {
    lock.releaseLock();
  }
}


const ASSET_BASE_HEADERS_ = ["ActivoID","CodigoPatrimonial","Nombre","Categoria","SerieModel","UbicacionActual","CustodioUserId","Estado","Observaciones"];
const ASSET_ACQUISITION_HEADERS_ = ["FechaAdquisicion","OrdenCompraID","RecepcionID","NumeroFactura","ProveedorID","ItemId","Marca","NumeroSerie","Modelo","CostoAdquisicion","FechaRegistro","ClasificacionInventario"];
const ASSET_ASSIGNMENT_HEADERS_ = ["AsignacionID","ActivoID","CustodioUserId","FechaEntrega","FechaDevolucion","EstadoActa","Observaciones"];

function ensureAssetAcquisitionSchema_(ss) {
  var spreadsheet = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  var assets = getOrCreateSheet(spreadsheet, "ActivosPatrimoniales");
  var values = assets.getDataRange().getValues();
  if (!values || !values.length) throw new Error("ASSET_SCHEMA_INVALID");
  var headers = values[0].map(function(v) { return String(v || "").trim(); });
  if (JSON.stringify(headers.slice(0, ASSET_BASE_HEADERS_.length)) !== JSON.stringify(ASSET_BASE_HEADERS_)) {
    throw new Error("ASSET_SCHEMA_INVALID");
  }
  var current = headers.slice();
  ASSET_ACQUISITION_HEADERS_.forEach(function(header) {
    if (current.indexOf(header) === -1) {
      assets.getRange(1, current.length + 1).setValue(header);
      current.push(header);
    }
  });
  var assignments = getOrCreateSheet(spreadsheet, "AsignacionesActivos");
  var assignmentExpectedHeaders = ["AsignacionID","ActivoID","CustodioUserId","FechaEntrega","FechaDevolucion","EstadoActa","Observaciones"];
  var assignmentValues = assignments.getDataRange().getValues();
  if (!assignmentValues || !assignmentValues.length) throw new Error("ASSET_ASSIGNMENT_SCHEMA_INVALID");
  var assignmentHeaders = assignmentValues[0].map(function(v) { return String(v || "").trim(); });
  if (assignmentHeaders.length === 0) {
    assignments.appendRow(assignmentExpectedHeaders);
  } else if (JSON.stringify(assignmentHeaders.slice(0, assignmentExpectedHeaders.length)) !== JSON.stringify(assignmentExpectedHeaders)) {
    throw new Error("ASSET_ASSIGNMENT_SCHEMA_INVALID");
  }
  return { assets: assets, assignments: assignments, assetHeaders: current, assignmentHeaders: assignmentHeaders };
}

function purchaseAssetReceiptContext_(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = purchaseQuotationAccess_(input, ss, true);
  if (!access || access.authorized !== true) throw new Error(access && access.code || "ROLE_NOT_ALLOWED");
  var receiptSheet = ss.getSheetByName("RecepcionesCompra"), orderSheet = ss.getSheetByName("OrdenesCompra");
  var requestSheet = ss.getSheetByName("SolicitudesCompra"), payableSheet = ss.getSheetByName("CuentasPorPagarGastos");
  if (!receiptSheet || !orderSheet || !requestSheet || !payableSheet) throw new Error("RESOURCE_NOT_FOUND");
  var receipts = receiptSheet.getDataRange().getValues();
  var orders = orderSheet.getDataRange().getValues();
  var requests = requestSheet.getDataRange().getValues();
  var payables = payableSheet.getDataRange().getValues();
  function idx(headers, name, fallback) { var i = headers.indexOf(name); return i >= 0 ? i : fallback; }
  var rh = receipts[0].map(String), oh = orders[0].map(String), qh = requests[0].map(String), ph = payables[0].map(String);
  var receiptMatches = receipts.slice(1).map(function(row, index) { return { row: row, index: index + 2 }; })
    .filter(function(item) { return String(item.row[idx(rh,"RecepcionID",0)] || "") === String(input.recepcionId || ""); });
  if (receiptMatches.length !== 1) throw new Error("RESOURCE_NOT_FOUND");
  var receiptRecord = receiptMatches[0], receipt = receiptRecord.row;
  var receiptState = String(receipt[idx(rh,"EstadoConformidad",5)] || "").trim().toLowerCase();
  if (receiptState !== "conforme") return { status: "success", ss: ss, access: access, receipt: receipt,
    receiptRecord: receiptRecord, order: null, request: null, items: [], invoices: [], candidates: [], unavailable: true };
  var orderId = String(receipt[idx(rh,"OrdenCompraID",1)] || "").trim();
  var orderMatches = orders.slice(1).map(function(row, index) { return { row: row, index: index + 2 }; })
    .filter(function(item) { return String(item.row[idx(oh,"OrdenCompraID",0)] || "") === orderId; });
  if (orderMatches.length !== 1) throw new Error("RESOURCE_NOT_FOUND");
  var orderRecord = orderMatches[0], order = orderRecord.row;
  var requestId = String(order[idx(oh,"SolicitudID",1)] || "").trim();
  var requestMatches = requests.slice(1).filter(function(row) { return String(row[idx(qh,"SolicitudID",0)] || "") === requestId; });
  if (requestMatches.length !== 1) throw new Error("RESOURCE_NOT_FOUND");
  var request = requestMatches[0], requestItemsRaw = [];
  try { requestItemsRaw = JSON.parse(String(request[idx(qh,"DetalleItemsJSON",6)] || "[]")); } catch (ignored) {}
  var orderItems = [];
  try { orderItems = JSON.parse(String(order[idx(oh,"DetalleItemsJSON",6)] || "[]")); } catch (ignored2) {}
  var received = [];
  try { received = JSON.parse(String(receipt[idx(rh,"DetalleJSON",4)] || "[]")); } catch (ignored3) {}
  if (!Array.isArray(requestItemsRaw) || !Array.isArray(orderItems) || !Array.isArray(received)) throw new Error("PURCHASE_ASSET_SOURCE_INVALID");
  var requestById = {};
  requestItemsRaw.forEach(function(x) {
    var itemId = String(x.itemId || x.ItemId || x.codigoItem || "").trim();
    if (itemId) requestById[itemId] = x;
  });
  var requestDept = String(request[idx(qh,"Departamento",2)] || "").trim();
  var scope = access.scope || {};
  var departmentIds = Array.isArray(scope.departmentIds) ? scope.departmentIds.map(String) : [];
  if (scope.institutionWide !== true && departmentIds.indexOf(requestDept) === -1) throw new Error("RESOURCE_NOT_FOUND");
  var items = orderItems.map(function(x) {
    var itemId = String(x.itemId || x.ItemId || x.codigoItem || x.itemCodigo || "").trim();
    var source = requestById[itemId] || {};
    const classification=normalizePurchaseAssetClassification_(source);
    return { itemId: itemId, codigoItem: itemId, descripcion: String(x.descripcion || x.nombreItem || source.descripcion || ""),
      cantidadOrdenada: Number(x.cantidad === undefined ? x.Cantidad : x.cantidad),
      cantidadRecibidaConforme: 0, clasificacionInventario: classification,
      costoUnitario: Number(x.precioUnitario === undefined ? (x.costoUnitario || 0) : x.precioUnitario),
      marca: String(x.marca || ""), modelo: String(x.modelo || ""), unidadMedida: String(x.unidadMedida || x.unidad || "Unidad") };
  });
  received.forEach(function(x) {
    var itemId = String(x.itemId || x.ItemId || x.codigoItem || "").trim();
    var item = items.filter(function(candidate) { return candidate.itemId === itemId; })[0];
    if (item && (x.conforme === true || String(x.estadoConformidad || "").toLowerCase() === "conforme")) {
      item.cantidadRecibidaConforme += Number(x.cantidad || x.cantidadRecibida || 0);
    }
  });
  var invoiceIndex = idx(ph,"Observaciones",9), invoices = [];
  payables.slice(1).forEach(function(row) {
    var observations = String(row[invoiceIndex] || ""), state = String(row[idx(ph,"EstadoPago",7)] || "").toLowerCase();
    var approved = ["aprobado","aprobada","approved"].indexOf(String(row[idx(ph,"EstadoAprobacion",6)] || "").toLowerCase()) !== -1;
    if (observations.indexOf("[ORDEN_" + orderId + "]") === -1 || observations.indexOf("[MATCH:Conciliada]") === -1 ||
        state.indexOf("bloqueado") !== -1 || state.indexOf("bloqueada") !== -1 || !approved) return;
    var number = String(row[idx(ph,"NumeroFactura",2)] || "").trim();
    if (!number) return;
    invoices.push({ obligacionId: row[idx(ph,"ObligacionID",0)], numeroFactura: number,
      proveedorId: String(row[idx(ph,"ProveedorID",1)] || ""), importe: Number(row[idx(ph,"Importe",3)] || 0),
      estadoConciliacion: "Conciliada" });
  });
  var assetSheet = ss.getSheetByName("ActivosPatrimoniales");
  var assetRows = assetSheet ? assetSheet.getDataRange().getValues() : [];
  var existingAssets = assetRows.length ? assetRows.slice(1) : [];
  var candidates = items.filter(function(item) {
    var requested = requestById[item.itemId] || {};
    const classification=normalizePurchaseAssetClassification_(requested);
    item.clasificacionInventario = classification;
    var alreadyCapitalized = existingAssets.filter(function(asset) {
      return String(asset[10] || "") === orderId && String(asset[11] || "") === String(input.recepcionId) &&
        String(asset[14] || "") === item.itemId;
    }).length;
    item.unidadesDisponibles = Math.max(0, item.cantidadRecibidaConforme - alreadyCapitalized);
    return classification === "ActivoFijo" && item.unidadesDisponibles > 0;
  });
  return { status: "success", ss: ss, access: access, receipt: receipt, receiptRecord: receiptRecord,
    order: order, orderRecord: orderRecord, request: request, items: items, candidatos: candidates,
    facturas: invoices, facturasDisponibles: invoices, unavailable: false };
}

function getPurchaseReceiptAssetCandidates(payload) {
  var context = purchaseAssetReceiptContext_(payload || {});
  if (context.unavailable) return { status: "success", recepcionId: String(payload.recepcionId), candidatos: [], facturasDisponibles: [] };
  return { status: "success", recepcionId: String(payload.recepcionId),
    candidatos: context.candidatos.map(function(item) { return { itemId: item.itemId, codigoItem: item.codigoItem,
      descripcion: item.descripcion, unidadesDisponibles: item.unidadesDisponibles, cantidadRecibidaConforme: item.cantidadRecibidaConforme,
      clasificacionInventario: item.clasificacionInventario, costoUnitario: item.costoUnitario }; }),
    facturasDisponibles: context.facturasDisponibles };
}

function registerAssetsFromPurchaseReceipt(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = purchaseQuotationAccess_(input, ss, true);
  if (!access || access.authorized !== true) return { status: "error", code: access && access.code || "ROLE_NOT_ALLOWED" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { status: "error", code: "CONCURRENT_UPDATE_RETRY" };
  var createdAssets = [], createdAssignments = [];
  try {
    var context = purchaseAssetReceiptContext_(input);
    if (context.unavailable) return { status: "error", code: "PURCHASE_RECEIPT_NOT_CONFORMING" };
    var invoiceNumber = String(input.numeroFactura || "").trim();
    var invoice = context.facturasDisponibles.filter(function(item) { return item.numeroFactura === invoiceNumber; })[0];
    if (!invoice) return { status: "error", code: "PURCHASE_ASSET_INVOICE_NOT_LINKED" };
    var schema = ensureAssetAcquisitionSchema_(ss), assets = schema.assets, assignments = schema.assignments;
    var assetRows = assets.getDataRange().getValues(), assignmentRows = assignments.getDataRange().getValues();
    var headers = assetRows[0].map(String), assetsByReceipt = assetRows.slice(1);
    function idx(name) { return headers.indexOf(name); }
    var requestedAssets = Array.isArray(input.activos) ? input.activos : [];
    if (!requestedAssets.length) return { status: "error", code: "PURCHASE_ASSET_ITEMS_REQUIRED" };
    var candidateById = {};
    context.candidatos.forEach(function(item) { candidateById[item.itemId] = item; });
    var requestedCount = {};
    requestedAssets.forEach(function(asset) {
      var itemId = String(asset.itemId || asset.ItemId || asset.codigoItem || "").trim();
      var sourceItem = context.items.filter(function(item) { return item.itemId === itemId; })[0];
      if (!sourceItem || sourceItem.clasificacionInventario !== "ActivoFijo") throw new Error("PURCHASE_ASSET_ITEM_NOT_ELIGIBLE");
      requestedCount[itemId] = (requestedCount[itemId] || 0) + 1;
    });
    var idempotent = requestedAssets.every(function(asset) {
      var itemId = String(asset.itemId || asset.ItemId || asset.codigoItem || "").trim();
      var code = String(asset.codigoPatrimonial || "").trim(), serial = String(asset.numeroSerie || "").trim();
      return assetsByReceipt.some(function(row) {
        return String(row[idx("OrdenCompraID")] || "") === String(input.ordenCompraId || context.order[0] || "") &&
          String(row[idx("RecepcionID")] || "") === String(input.recepcionId) &&
          String(row[idx("NumeroFactura")] || "") === invoiceNumber &&
          String(row[idx("ItemId")] || "") === itemId && String(row[idx("CodigoPatrimonial")] || "") === code &&
          String(row[idx("NumeroSerie")] || "") === serial;
      });
    });
    if (idempotent) return { status: "success", idempotente: true,
      activos: requestedAssets.map(function(asset) { return { codigoPatrimonial: asset.codigoPatrimonial }; }) };
    for (var iDuplicate = 0; iDuplicate < requestedAssets.length; iDuplicate++) {
      var duplicateAsset = requestedAssets[iDuplicate];
      var duplicateCode = String(duplicateAsset.codigoPatrimonial || "").trim();
      var duplicateSerial = String(duplicateAsset.numeroSerie || "").trim();
      if (assetsByReceipt.some(function(row) {
        return String(row[idx("CodigoPatrimonial")] || "") === duplicateCode ||
          String(row[idx("NumeroSerie")] || row[4] || "") === duplicateSerial;
      })) return { status: "error", code: "ASSET_CODE_OR_SERIAL_ALREADY_EXISTS" };
    }
    for (var key in requestedCount) if (!candidateById[key] || requestedCount[key] > candidateById[key].unidadesDisponibles) {
      return { status: "error", code: "PURCHASE_ASSET_QUANTITY_EXCEEDED" };
    }
    for (var i = 0; i < requestedAssets.length; i++) {
      var asset = requestedAssets[i], itemId = String(asset.itemId || asset.ItemId || asset.codigoItem || "").trim();
      var code = String(asset.codigoPatrimonial || "").trim(), serial = String(asset.numeroSerie || "").trim();
      if (!code || !serial) return { status: "error", code: "PURCHASE_ASSET_IDENTIFIERS_REQUIRED" };
      var duplicate = assetsByReceipt.some(function(row) {
        return String(row[idx("CodigoPatrimonial")] || "") === code || String(row[idx("NumeroSerie")] || row[4] || "") === serial;
      });
      if (duplicate) return { status: "error", code: "ASSET_CODE_OR_SERIAL_ALREADY_EXISTS" };
    }
    var created = [];
    try {
      requestedAssets.forEach(function(asset, index) {
        var itemId = String(asset.itemId || asset.ItemId || asset.codigoItem || "").trim();
        var candidate = candidateById[itemId], custodian = String(asset.custodioUserId || asset.CustodioUserId || "").trim();
        var assetId = "ACT-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
        var row = [];
        row[idx("ActivoID")] = assetId;
        row[idx("CodigoPatrimonial")] = String(asset.codigoPatrimonial).trim();
        row[idx("Nombre")] = String(asset.nombre || candidate.descripcion || "");
        row[idx("Categoria")] = String(asset.categoriaPatrimonial || "");
        row[idx("SerieModel")] = [asset.marca || "", asset.modelo || ""].join(" ").trim();
        row[idx("UbicacionActual")] = String(asset.ubicacionActual || "");
        row[idx("CustodioUserId")] = custodian;
        row[idx("Estado")] = "Activo";
        row[idx("Observaciones")] = String(asset.observaciones || "");
        row[idx("FechaAdquisicion")] = new Date();
        row[idx("OrdenCompraID")] = String(context.order[0] || "");
        row[idx("RecepcionID")] = String(input.recepcionId);
        row[idx("NumeroFactura")] = invoiceNumber;
        row[idx("ProveedorID")] = String(context.order[3] || "");
        row[idx("ItemId")] = itemId;
        row[idx("Marca")] = String(asset.marca || "");
        row[idx("NumeroSerie")] = String(asset.numeroSerie || "");
        row[idx("Modelo")] = String(asset.modelo || "");
        row[idx("CostoAdquisicion")] = Number(candidate.costoUnitario || 0);
        row[idx("FechaRegistro")] = new Date();
        row[idx("ClasificacionInventario")] = "ActivoFijo";
        while (row.length < headers.length) row.push("");
        if (custodian) {
          var assignmentId = "ASG-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 20);
          assignments.appendRow([assignmentId, assetId, custodian, new Date(), "", "Entregada", "Recepción " + input.recepcionId]);
          createdAssignments.push(assignments.getLastRow());
        }
        assets.appendRow(row);
        createdAssets.push(assets.getLastRow());
        created.push({ activoId: assetId, codigoPatrimonial: code, numeroSerie: serial, itemId: itemId });
      });
    } catch (writeError) {
      createdAssets.forEach(function(row) { try { assets.getRange(row, 1, 1, headers.length).clearContent(); } catch (ignored) {} });
      createdAssignments.forEach(function(row) { try { assignments.getRange(row, 1, 1, 7).clearContent(); } catch (ignored2) {} });
      return { status: "error", code: String(writeError && writeError.message || "PURCHASE_ASSET_WRITE_FAILED") };
    }
    return { status: "success", activos: created, idempotente: false };
  } catch (error) {
    return { status: "error", code: String(error && error.message || "PURCHASE_ASSET_REGISTRATION_FAILED") };
  } finally { lock.releaseLock(); }
}

function getAssetItems(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), sheet = ss.getSheetByName("ActivosPatrimoniales");
  if (!sheet) return { status: "success", activos: [] };
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { status: "success", activos: [] };
  var headers = values[0].map(String);
  var activos = values.slice(1).filter(function(row) {
    return !!String(row[headers.indexOf("ActivoID")] || "").trim();
  }).map(function(row) {
    var result = {};
    headers.forEach(function(header, index) { result[header] = row[index]; });
    return result;
  });
  return { status: "success", activos: activos };
}

function manageAssetItem(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, "ActivosPatrimoniales"), rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(String), serial = String(input.numeroSerie || input.SerieModel || "").trim();
  var code = String(input.codigoPatrimonial || "").trim();
  var duplicate = rows.slice(1).some(function(row) {
    return (serial && (String(row[headers.indexOf("NumeroSerie")] || "") === serial || String(row[4] || "") === serial)) ||
      (code && String(row[headers.indexOf("CodigoPatrimonial")] || "") === code);
  });
  if (duplicate) throw new Error("ASSET_SERIAL_ALREADY_EXISTS");
  var newRow = [];
  newRow[headers.indexOf("ActivoID")] = "ACT-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
  newRow[headers.indexOf("CodigoPatrimonial")] = code;
  newRow[headers.indexOf("Nombre")] = String(input.nombre || "");
  newRow[headers.indexOf("Categoria")] = String(input.categoria || "");
  newRow[headers.indexOf("SerieModel")] = serial;
  newRow[headers.indexOf("Estado")] = "Activo";
  while (newRow.length < headers.length) newRow.push("");
  sheet.appendRow(newRow);
  return { status: "success" };
}

function createPurchaseRequest(payload) {
  var input = payload || {}, lock = LockService.getScriptLock();
  if (!Array.isArray(input.detalleItems) || !input.detalleItems.length) {
    return { status: "error", code: "PURCHASE_REQUEST_ITEMS_INVALID" };
  }
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var access = purchaseQuotationAccess_(input, ss, true);
    if (!access || access.authorized !== true) return { status: "error", code: access && access.code || "ROLE_NOT_ALLOWED" };
    var department = typeof resolveStaffingDepartmentReference_ === "function"
      ? resolveStaffingDepartmentReference_(ss, input.departamento)
      : (access.scope.institutionWide === true && String(input.departamento || "").trim()
        ? { resolved: true, departmentId: String(input.departamento).trim(), departmentName: String(input.departamento).trim() }
        : { resolved: false, code: "DEPARTMENT_REFERENCE_UNAVAILABLE" });
    if (!department || department.resolved !== true) return { status: "error", code: department && department.code || "DEPARTMENT_REFERENCE_INVALID" };
    var allowedDepartments = Array.isArray(access.scope.departmentIds) ? access.scope.departmentIds.map(String) : [];
    if (access.scope.institutionWide !== true && allowedDepartments.indexOf(String(department.departmentId)) === -1) {
      return { status: "error", code: "RESOURCE_NOT_FOUND" };
    }
    var actor = access.actor;
    var classifications = input.detalleItems.map(function(x) { return { clasificacionInventario:normalizePurchaseAssetClassification_(x) }; });
    var prepared = input.detalleItems.map(function(source, index) {
      source = source || {};
      const classification=normalizePurchaseAssetClassification_(source);
      var classificationFromPreflight = classifications[index].clasificacionInventario;
      if (classification !== classificationFromPreflight) throw new Error("PURCHASE_CLASSIFICATION_PREFLIGHT_CONFLICT");
      var lookup = source.catalogItemId || source.itemId || source.ItemId || source.codigoItem || source.itemCodigo;
      var item = catalogFindItem_(ss, lookup, true);
      var unit = catalogFindUnit_(ss, source.unidadMedida || source.unidad || item.baseUnit);
      if (catalogNormalizeText_(unit.base) !== catalogNormalizeText_(item.baseUnit)) throw new Error("CATALOG_UNIT_INCOMPATIBLE_WITH_ITEM");
      var quantity = Number(source.cantidad);
      if (!isFinite(quantity) || quantity <= 0) throw new Error("PURCHASE_REQUEST_ITEMS_INVALID");
      return { itemId: item.code, codigoItem: item.code, catalogItemId:item.id,
        descripcion: String(source.descripcion || item.name || ""), cantidad: quantity,
        unidadMedida: String(source.unidadMedida || source.unidad || item.baseUnit),
        clasificacionInventario: classification };
    });
    var seen = Object.create(null);
    prepared.forEach(function(item) {
      if (seen[item.codigoItem]) throw new Error("PURCHASE_REQUEST_DUPLICATE_ITEM");
      seen[item.codigoItem] = true;
    });
    var sheet = getOrCreateSheet(ss, "SolicitudesCompra");
    var id = "REQ-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
    sheet.appendRow([id, new Date(), String(department.departmentId), String(actor.userId || ""),
      String(input.justificacion || ""), String(input.categoria || ""), JSON.stringify(prepared),
      Number(input.montoEstimado || 0), String(input.centroCosto || ""), "Pendiente", ""]);
    return { status: "success", solicitudId: id };
  } finally {
    lock.releaseLock();
  }
}
function createPurchaseOrder(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var access = purchaseQuotationAccess_(input, ss, true);
  if (!access || access.authorized !== true) return { status: "error", code: access && access.code || "ROLE_NOT_ALLOWED" };
  if (!supplierEnsureActiveForOrder_(ss, input.proveedorId)) return { status: "error", code: "PURCHASE_SUPPLIER_NOT_ACTIVE" };
  var requests = getOrCreateSheet(ss, "SolicitudesCompra").getDataRange().getValues();
  var matches = requests.slice(1).filter(function(row) { return String(row[0]) === String(input.solicitudId || ""); });
  if (matches.length !== 1) return { status: "error", code: "PURCHASE_REQUEST_NOT_FOUND" };
  var request = matches[0], sourceItems = JSON.parse(String(request[6] || "[]")), orderItems = Array.isArray(input.detalleItems) ? input.detalleItems : [];
  var sourceById = {};
  sourceItems.forEach(function(x) { sourceById[String(x.itemId || x.ItemId || "")] = x; });
  var prepared = orderItems.map(function(x) {
    var itemId = String(x.itemId || x.ItemId || x.codigoItem || "");
    var a = sourceById[itemId];
    if (!a) throw new Error("PURCHASE_ORDER_ITEM_NOT_AUTHORIZED");
    return Object.assign({}, x, { itemId: itemId, catalogItemId: a.catalogItemId,
      clasificacionInventario:a.clasificacionInventario,
      capitalizable: normalizePurchaseAssetClassification_(a) === "ActivoFijo" });
  });
  var sheet = getOrCreateSheet(ss, "OrdenesCompra");
  var id = "OC-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
  var total = Number(input.montoTotal || prepared.reduce(function(sum, item) { return sum + Number(item.total || Number(item.cantidad || 0) * Number(item.precioUnitario || 0)); }, 0));
  sheet.appendRow([id, String(input.solicitudId), String(input.cotizacionId || ""), String(input.proveedorId),
    new Date(), "", JSON.stringify(prepared), total, String(request[8] || ""), "Borrador", "", "",
    String(request[3] || ""), "1", ""]);
  return { status: "success", ordenCompraId: id };
}

function verifyThreeWayMatch(payload) {
  var input = payload || {}, ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var orders = getOrCreateSheet(ss, "OrdenesCompra").getDataRange().getValues();
  var receipts = getOrCreateSheet(ss, "RecepcionesCompra").getDataRange().getValues();
  var order = orders.slice(1).filter(function(row) { return String(row[0]) === String(input.ordenCompraId || ""); })[0];
  if (!order) return { status: "error", code: "PURCHASE_ORDER_NOT_FOUND" };
  var orderItems = purchaseQuotationJsonArray_(order[6]), received = {};
  receipts.slice(1).filter(function(row) { return String(row[1]) === String(input.ordenCompraId); }).forEach(function(row) {
    purchaseQuotationJsonArray_(row[4]).forEach(function(item) {
      var id = String(item.itemId || item.ItemId || item.codigoItem || "");
      if (item.conforme === true || String(item.estadoConformidad || "").toLowerCase() === "conforme") received[id] = (received[id] || 0) + Number(item.cantidad || 0);
    });
  });
  var invoice = input.facturaProveedor || {}, invoiceItems = Array.isArray(invoice.partidasFacturadas) ? invoice.partidasFacturadas : [];
  var valid = invoice.proveedorId === String(order[3]) && orderItems.every(function(item) {
    var id = String(item.itemId || item.ItemId || item.codigoItem || "");
    var billed = invoiceItems.filter(function(x) { return String(x.itemId || x.ItemId || "") === id; })[0];
    return billed && Number(billed.cantidad) <= Number(received[id] || 0) &&
      Number(billed.cantidad) <= Number(item.cantidad || 0) &&
      Math.abs(Number(billed.precioUnitario || 0) - Number(item.precioUnitario || 0)) < 0.01;
  });
  return { status: "success", estadoConciliacion: valid ? "Conciliada" : "Discrepancia",
    ordenCompraId: String(input.ordenCompraId), partidasVerificadas: invoiceItems.length };
}


const ASSET_DEPR_POLICY_HEADERS_=["PolicyID","Categoria","Metodo","VidaUtilMeses","ValorResidualPorcentaje","TasaAnual","CuentaActivo","CuentaDepreciacionAcumulada","CuentaGastoDepreciacion","Estado","FechaActualizacion"];
const ASSET_DEPR_PROFILE_HEADERS_=["ProfileID","ActivoID","CategoriaContable","FechaPuestaFuncionamiento","FechaInicioDepreciacion","FechaCorteApertura","CostoCapitalizado","ValorResidual","VidaUtilMeses","Metodo","TasaAnual","UnidadesTotales","UnidadesAcumuladas","DepreciacionAcumuladaInicial","ValorNetoApertura","CuentaActivo","CuentaDepreciacionAcumulada","CuentaGastoDepreciacion","CuentaPerdidaBaja","CentroCosto","Moneda","RegistradoPor","FechaRegistro","Estado"];
const ASSET_DEPR_IMPROVEMENT_HEADERS_=["MejoraID","ActivoID","FechaCapitalizacion","Descripcion","Importe","ValorResidual","VidaUtilMeses","Metodo","TasaAnual","RegistradoPor","FechaRegistro","Estado","IdempotencyKey"];
const ASSET_DEPR_HEADERS_=["DepreciacionID","ActivoID","Periodo","FechaCalculo","Metodo","BaseCosto","DepreciacionPeriodo","DepreciacionAcumulada","ValorNetoLibros","UnidadesPeriodo","ComponentesJSON","AsientoID","Estado","IdempotencyKey","RegistradoPor"];

function assetDeprSheet_(ss,name,headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
  }
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) throw new Error("ASSET_DEPR_SCHEMA_INVALID");
  var actualHeaders = values[0].map(String);
  if (name === "MejorasCapitalizablesActivos" && JSON.stringify(actualHeaders) === JSON.stringify(headers.slice(0, -1))) {
    sheet.getRange(1, actualHeaders.length + 1).setValue(headers[headers.length - 1]);
    actualHeaders.push(headers[headers.length - 1]);
  }
  if (JSON.stringify(actualHeaders) !== JSON.stringify(headers)) throw new Error("ASSET_DEPR_SCHEMA_INVALID");
  return sheet;
}
function assetDeprActor_(payload) {
  var actor = getVerifiedAccountingIdentity_(payload || {});
  if (!actor || actor.authorized !== true) throw new Error(actor && actor.code || "VERIFIED_IDENTITY_REQUIRED");
  var role = String(actor.role || "").toLowerCase().replace(/\s+/g,"");
  if (["contador","administrador","director","subdirector"].indexOf(role) === -1) throw new Error("ROLE_NOT_ALLOWED");
  return actor;
}
function assetDeprAccount_(ss,code) {
  var sheet = ss.getSheetByName("PlanCuentas");
  if (!sheet) throw new Error("ASSET_DEPR_ACCOUNT_NOT_FOUND");
  var rows = sheet.getDataRange().getValues(), headers = rows[0].map(String);
  var codeIndex = headers.indexOf("CodigoCuenta"), stateIndex = headers.indexOf("Estado");
  var found = rows.slice(1).filter(function(row) {
    return String(row[codeIndex] || "").trim() === String(code || "").trim() &&
      (stateIndex < 0 || String(row[stateIndex] || "").toLowerCase() === "activo");
  });
  if (!code || found.length !== 1) throw new Error("ASSET_DEPR_ACCOUNT_NOT_FOUND");
  return { code: String(code), name: String(found[0][headers.indexOf("NombreCuenta")] || code), row: found[0] };
}
function assetDeprDate_(value) {
  var date = value instanceof Date ? new Date(value.getTime()) : new Date(String(value || ""));
  if (isNaN(date.getTime())) throw new Error("ASSET_DEPR_DATE_INVALID");
  return date;
}
function assetDeprMonth_(value) {
  var match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) throw new Error("ASSET_DEPR_PERIOD_INVALID");
  return new Date(Date.UTC(Number(match[1]),Number(match[2])-1,1));
}
function assetDeprMonthsBetween_(start,end) {
  var a = assetDeprDate_(start), b = assetDeprDate_(end);
  return Math.max(0,(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth());
}
function assetDeprMoney_(value) {
  var n = Number(value);
  if (!isFinite(n)) throw new Error("ASSET_DEPR_AMOUNT_INVALID");
  return Math.round((n+Number.EPSILON)*100)/100;
}
function assetDeprIsoDate_(value) {
  var d = assetDeprDate_(value);
  return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");
}
function assetDeprProfileMap_(ss) {
  var sheet = assetDeprSheet_(ss,"PerfilesDepreciacionActivos",ASSET_DEPR_PROFILE_HEADERS_);
  var rows = sheet.getDataRange().getValues(), map = {};
  rows.slice(1).forEach(function(row) { if (row[1]) map[String(row[1])] = row; });
  return map;
}
function assetDeprRequireAsset_(ss,assetId) {
  var sheet = ss.getSheetByName("ActivosPatrimoniales");
  if (!sheet) throw new Error("ASSET_NOT_FOUND");
  var rows = sheet.getDataRange().getValues(), matches = rows.slice(1).map(function(row,index){return {row:row,index:index+2};})
    .filter(function(item){return String(item.row[0]||"")===String(assetId||"");});
  if (matches.length !== 1) throw new Error("ASSET_NOT_FOUND");
  var state = String(matches[0].row[7] || "").toLowerCase();
  if (state === "disposed" || state === "baja" || state === "dado de baja") throw new Error("ASSET_ALREADY_DISPOSED");
  return {sheet:sheet,row:matches[0].row,rowIndex:matches[0].index};
}

function saveAssetDepreciationPolicy(payload) {
  var input=payload||{}, actor=assetDeprActor_(input), ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var method=String(input.metodo||"").trim(), life=Number(input.vidaUtilMeses), residual=Number(input.valorResidualPorcentaje||0), rate=Number(input.tasaAnual||0);
  if (["LineaRecta","SaldoDecreciente","UnidadesProduccion"].indexOf(method)<0 || !isFinite(life)||life<=0||Math.floor(life)!==life||
      !isFinite(residual)||residual<0||residual>=100||!isFinite(rate)||rate<0||rate>=1) throw new Error("POLICY_VALUES_INVALID");
  assetDeprAccount_(ss,input.cuentaActivo);assetDeprAccount_(ss,input.cuentaDepreciacionAcumulada);assetDeprAccount_(ss,input.cuentaGastoDepreciacion);
  var sheet=assetDeprSheet_(ss,"PoliticasDepreciacionActivos",ASSET_DEPR_POLICY_HEADERS_),rows=sheet.getDataRange().getValues();
  var category=String(input.categoria||"").trim();if(!category)throw new Error("POLICY_VALUES_INVALID");
  var index=rows.findIndex(function(row,i){return i>0&&String(row[1])===category;});
  var record=["POL-"+category,category,method,life,residual,rate,String(input.cuentaActivo),String(input.cuentaDepreciacionAcumulada),
    String(input.cuentaGastoDepreciacion),"Activo",new Date()];
  if(index>0)sheet.getRange(index+1,1,1,record.length).setValues([record]);else sheet.appendRow(record);
  return {status:"success",categoria:category,metodo:method};
}
function configureAssetDepreciationProfile(payload) {
  var input=payload||{},actor=assetDeprActor_(input),ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var asset=assetDeprRequireAsset_(ss,input.activoId);
    var policySheet=assetDeprSheet_(ss,"PoliticasDepreciacionActivos",ASSET_DEPR_POLICY_HEADERS_);
    var category=String(input.categoriaContable||asset.row[3]||"").trim();
    var policy=policySheet.getDataRange().getValues().slice(1).filter(function(row){return String(row[1])===category;})[0]||[];
    var cost=assetDeprMoney_(input.costoCapitalizado),residual=assetDeprMoney_(input.valorResidual===undefined?cost*Number(policy[4]||0)/100:input.valorResidual);
    var life=Number(input.vidaUtilMeses||policy[3]),method=String(input.metodo||policy[2]||"LineaRecta");
    var rate=Number(input.tasaAnual===undefined?(policy[5]||0):input.tasaAnual);
    if(cost<=0||residual<0||residual>cost||!isFinite(life)||life<=0||Math.floor(life)!==life||
      ["LineaRecta","SaldoDecreciente","UnidadesProduccion"].indexOf(method)<0||!isFinite(rate)||rate<0||rate>=1)throw new Error("PROFILE_INVALID");
    var accounts={asset:String(input.cuentaActivo||policy[6]||""),accum:String(input.cuentaDepreciacionAcumulada||policy[7]||""),
      expense:String(input.cuentaGastoDepreciacion||policy[8]||""),loss:String(input.cuentaPerdidaBaja||"")};
    assetDeprAccount_(ss,accounts.asset);assetDeprAccount_(ss,accounts.accum);assetDeprAccount_(ss,accounts.expense);
    if(accounts.loss)assetDeprAccount_(ss,accounts.loss);
    var sheet=assetDeprSheet_(ss,"PerfilesDepreciacionActivos",ASSET_DEPR_PROFILE_HEADERS_),rows=sheet.getDataRange().getValues();
    var id=String(input.activoId),idx=rows.findIndex(function(row,i){return i>0&&String(row[1])===id;});
    var record=["PROFILE-"+id,id,category,assetDeprIsoDate_(input.fechaPuestaFuncionamiento),
      assetDeprIsoDate_(input.fechaInicioDepreciacion||input.fechaPuestaFuncionamiento),
      input.fechaCorteApertura?assetDeprIsoDate_(input.fechaCorteApertura):"",
      cost,residual,life,method,rate,Number(input.unidadesTotales||0),Number(input.unidadesAcumuladas||0),
      assetDeprMoney_(input.depreciacionAcumuladaInicial||0),assetDeprMoney_(input.valorNetoApertura===undefined?cost-residual:Number(input.valorNetoApertura)),
      accounts.asset,accounts.accum,accounts.expense,accounts.loss,String(input.centroCosto||""),String(input.moneda||"HNL"),
      actor.userId,new Date(),"Activo"];
    if(idx>0)sheet.getRange(idx+1,1,1,record.length).setValues([record]);else sheet.appendRow(record);
    return {status:"success",activoId:id,metodo:method,vidaUtilMeses:life};
  } finally {lock.releaseLock();}
}
function assetDeprComponentAmount_(component,period,monthsRemaining,accumulated) {
  var cost=Number(component.cost||0),residual=Number(component.residual||0),life=Number(component.life||1);
  var depreciable=Math.max(0,cost-residual-Number(accumulated||0));
  if(depreciable<=0)return 0;
  if(component.method==="UnidadesProduccion")return assetDeprMoney_(Math.min(depreciable,Math.max(0,Number(component.unitsPeriod||0))*depreciable/Math.max(1,Number(component.unitsTotal||0))));
  if(component.method==="SaldoDecreciente") {
    var rate=Number(component.rate||0),monthly=cost*rate/12,cap=depreciable/Math.max(1,Number(monthsRemaining||life));
    return Math.min(depreciable,Math.round(Math.min(monthly,cap)));
  }
  return assetDeprMoney_(Math.min(depreciable,(cost-residual)/Math.max(1,life)));
}
function assetDeprPriorComponent_(rows,assetId,key,period) {
  var total=0;
  rows.slice(1).forEach(function(row){if(String(row[1])===String(assetId)&&String(row[2])<String(period)&&String(row[12])!=="Revertida"){
    var components=[];try{components=JSON.parse(String(row[10]||"[]"));}catch(ignored){}
    components.forEach(function(c){if(String(c.key)===String(key))total+=Number(c.depreciacion||0);});
  }});
  return assetDeprMoney_(total);
}
function calculateAssetDepreciation(payload) {
  var input=payload||{},actor=assetDeprActor_(input),ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var asset=assetDeprRequireAsset_(ss,input.activoId),period=String(input.periodo||"");
    var month=assetDeprMonth_(period),monthEnd=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0));
    var profiles=assetDeprProfileMap_(ss),profile=profiles[String(input.activoId)];
    if(!profile)throw new Error("ASSET_DEPR_PROFILE_REQUIRED");
    var sheet=assetDeprSheet_(ss,"DepreciacionesActivos",ASSET_DEPR_HEADERS_),rows=sheet.getDataRange().getValues();
    var prior=rows.slice(1).filter(function(row){return String(row[1])===String(input.activoId)&&String(row[2])===period;})[0];
    if(prior&&String(prior[12])==="Revertida")return {status:"success",resultados:[{status:"already_reversed",depreciacionPeriodo:Number(prior[6]),asientoId:prior[11]}]};
    if(prior&&String(prior[12])==="Contabilizada")return {status:"success",resultados:[{status:"already_posted",depreciacionPeriodo:Number(prior[6]),asientoId:prior[11]}]};
    var improvementSheet=assetDeprSheet_(ss,"MejorasCapitalizablesActivos",ASSET_DEPR_IMPROVEMENT_HEADERS_);
    var improvements=improvementSheet.getDataRange().getValues().slice(1).filter(function(row){return String(row[1])===String(input.activoId)&&String(row[11])==="Capitalizada"&&assetDeprDate_(row[2])<=monthEnd;});
    var depStart=assetDeprDate_(profile[4]),cost=Number(profile[6]),residual=Number(profile[7]),life=Number(profile[8]),method=String(profile[9]),rate=Number(profile[10]);
    var baseKey="BASE",elapsed=assetDeprMonthsBetween_(depStart,month),remaining=Math.max(1,life-elapsed);
    var baseAccum=Number(profile[13]||0),openingCutoff=profile[5]?assetDeprDate_(profile[5]):null;
    var baseComponent={key:baseKey,start:profile[4],cost:cost,residual:residual,life:life,method:method,rate:rate,
      unitsTotal:Number(profile[11]||0),unitsPeriod:Number(input.unidadesPeriodo||0)};
    var baseAmount;
    if(openingCutoff&&month>openingCutoff&&Number(profile[14])>0) {
      var remMonths=Math.max(1,life-(assetDeprMonthsBetween_(depStart,openingCutoff)+1));
      baseAmount=assetDeprMoney_(Math.min(Number(profile[14]),Number(profile[14])/remMonths));
    } else baseAmount=assetDeprComponentAmount_(baseComponent,month,remaining,0);
    if(method==="UnidadesProduccion"&&Number(input.unidadesPeriodo||0)>Number(profile[11]||0)-Number(profile[12]||0))throw new Error("UNITS_EXCEED_REMAINING");
    var components=[{key:baseKey,costo:cost,depreciacion:baseAmount}];
    var totalCost=cost,totalPeriod=baseAmount,totalAccum=baseAccum+baseAmount;
    improvements.forEach(function(row){
      var c={key:String(row[0]),start:row[2],cost:Number(row[4]),residual:Number(row[5]||0),life:Number(row[6]||life),
        method:String(row[7]||method),rate:Number(row[8]||rate),unitsTotal:0,unitsPeriod:0};
      var priorComponent=assetDeprPriorComponent_(rows,input.activoId,c.key,period);
      var amount=assetDeprComponentAmount_(c,month,Math.max(1,c.life),priorComponent);
      components.push({key:c.key,costo:c.cost,depreciacion:amount});
      totalCost+=c.cost;totalPeriod+=amount;totalAccum+=amount;
    });
    var previousRows=rows.slice(1).filter(function(row){return String(row[1])===String(input.activoId)&&String(row[2])<period&&String(row[12])==="Contabilizada";});
    previousRows.forEach(function(row){totalAccum+=Number(row[6]||0);});
    totalPeriod=assetDeprMoney_(totalPeriod);totalAccum=assetDeprMoney_(totalAccum);totalCost=assetDeprMoney_(totalCost);
    var net=assetDeprMoney_(Math.max(0,totalCost-totalAccum)),journal=null;
    if(input.post===true){
      var lines=[{codigoCuenta:String(profile[17]),nombreCuenta:assetDeprAccount_(ss,profile[17]).name,debe:totalPeriod,haber:0},
        {codigoCuenta:String(profile[16]),nombreCuenta:assetDeprAccount_(ss,profile[16]).name,debe:0,haber:totalPeriod}];
      journal=recordAccountingJournalEntry({descripcion:"Depreciación "+input.activoId+" "+period,origenModulo:"ActivosFijos",
        referenciaId:"DEPRECIACION:"+input.activoId+":"+period,lineas:lines,creadoPor:actor.userId});
      var id="DEP-"+String(input.activoId)+"-"+period;
      sheet.appendRow([id,String(input.activoId),period,new Date(),method,totalCost,totalPeriod,totalAccum,net,
        Number(input.unidadesPeriodo||0),JSON.stringify(components),journal.asientoId,"Contabilizada",
        String(input.activoId)+"|"+period,actor.userId]);
      logStructuredEvent("ACCOUNTING","calculateAssetDepreciation","INFO","ASSET_DEPRECIATION_POSTED","Depreciación contabilizada",{activoId:input.activoId,periodo:period},actor.userId);
    }
    return {status:"success",resultados:[{activoId:String(input.activoId),periodo:period,metodo:method,
      depreciacionPeriodo:totalPeriod,depreciacionAcumulada:totalAccum,valorNetoLibros:net,
      status:input.post===true?"posted":"preview",asientoId:journal&&journal.asientoId}]};
  } finally {lock.releaseLock();}
}
function registerCapitalizableAssetImprovement(payload) {
  var input=payload||{},actor=assetDeprActor_(input),ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    assetDeprRequireAsset_(ss,input.activoId);
    var sheet=assetDeprSheet_(ss,"MejorasCapitalizablesActivos",ASSET_DEPR_IMPROVEMENT_HEADERS_),rows=sheet.getDataRange().getValues();
    var date=assetDeprIsoDate_(input.fechaCapitalizacion),amount=assetDeprMoney_(input.importe),description=String(input.descripcion||"").trim();
    if(!description||amount<=0)throw new Error("IMPROVEMENT_VALUES_INVALID");
    var normalized=description.toLowerCase();
    var key=String(input.idempotencyKey||([input.activoId,date,amount,normalized].join("|")));
    var existing=rows.slice(1).filter(function(row){return String(row[12]||"")===key;});
    if(existing.length){
      var same=String(existing[0][1])===String(input.activoId)&&String(existing[0][2])===date&&
        Number(existing[0][4])===amount&&String(existing[0][3]).toLowerCase()===normalized;
      if(!same)throw new Error("IDEMPOTENCY_CONFLICT");
      return {status:"already_registered",mejoraId:existing[0][0]};
    }
    var id="MEJ-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20);
    sheet.appendRow([id,String(input.activoId),date,description,amount,Number(input.valorResidual||0),
      Number(input.vidaUtilMeses||0),String(input.metodo||""),Number(input.tasaAnual||0),actor.userId,new Date(),"Capitalizada",key]);
    return {status:"success",mejoraId:id,idempotencyKey:key};
  } finally {lock.releaseLock();}
}
function getAssetDepreciationSchedule(payload) {
  var input=payload||{},actor=assetDeprActor_(input),ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var profiles=assetDeprProfileMap_(ss),depreciations=assetDeprSheet_(ss,"DepreciacionesActivos",ASSET_DEPR_HEADERS_).getDataRange().getValues().slice(1);
    var improvements=assetDeprSheet_(ss,"MejorasCapitalizablesActivos",ASSET_DEPR_IMPROVEMENT_HEADERS_).getDataRange().getValues().slice(1);
    var assetsSheet=ss.getSheetByName("ActivosPatrimoniales"),assets=assetsSheet.getDataRange().getValues().slice(1);
    var cutoff=input.fechaCorte?assetDeprDate_(input.fechaCorte):new Date(8640000000000000);
    var filtered=depreciations.filter(function(row){return String(row[12])==="Contabilizada"&&(!input.activoId||String(row[1])===String(input.activoId))&&assetDeprMonth_(row[2])<=cutoff;});
    var calendar=filtered.map(function(row){return {activoId:row[1],periodo:row[2],depreciacionPeriodo:Number(row[6]),depreciacionAcumulada:Number(row[7]),valorNetoLibros:Number(row[8]),estado:String(row[12])};});
    var assetSummaries=assets.filter(function(row){return String(row[7]||"").toLowerCase()!=="disposed"&&(!input.activoId||String(row[0])===String(input.activoId));}).map(function(asset){
      var profile=profiles[String(asset[0])];if(!profile)return null;
      var rows=filtered.filter(function(row){return String(row[1])===String(asset[0])&&String(row[12])==="Contabilizada";});
      var opening=Number(profile[13]||0),accum=opening+rows.reduce(function(sum,row){return sum+Number(row[6]||0);},0);
      var cost=Number(profile[6]||0)+improvements.filter(function(row){return String(row[1])===String(asset[0])&&assetDeprDate_(row[2])<=cutoff;}).reduce(function(sum,row){return sum+Number(row[4]||0);},0);
      return {activoId:asset[0],codigoPatrimonial:asset[1],nombre:asset[2],categoria:asset[3],costoCapitalizado:assetDeprMoney_(cost),
        depreciacionAcumulada:assetDeprMoney_(accum),depreciacionRegistrada:assetDeprMoney_(rows.reduce(function(sum,row){return sum+Number(row[6]||0);},0)),
        valorNetoLibros:assetDeprMoney_(Math.max(0,cost-accum)),
        fechaFinEstimada:assetDeprIsoDate_(new Date(assetDeprDate_(profile[4]).getTime()+Number(profile[8])*30*86400000))};
    }).filter(Boolean);
    var annual={},categories={};
    calendar.forEach(function(item){var year=item.periodo.slice(0,4);annual[year]=annual[year]||{anio:year,periodos:0,depreciacion:0};annual[year].periodos++;annual[year].depreciacion+=item.depreciacionPeriodo;});
    assetSummaries.forEach(function(item){var key=String(item.categoria||"Sin categoría");categories[key]=categories[key]||{categoria:key,depreciacionAcumulada:0,activos:0};categories[key].depreciacionAcumulada+=item.depreciacionRegistrada;categories[key].activos++;});
    var activeAssetIds={};
    assets.forEach(function(asset){if(String(asset[7]||"").toLowerCase()!=="disposed")activeAssetIds[String(asset[0])]=true;});
    var allProfiles=Object.keys(profiles).filter(function(id){return activeAssetIds[id];}).map(function(id){return profiles[id];});
    var totalCost=allProfiles.reduce(function(sum,p){return sum+Number(p[6]||0);},0)+improvements.filter(function(r){return activeAssetIds[String(r[1])];}).reduce(function(sum,r){return sum+Number(r[4]||0);},0);
    var totalAccum=allProfiles.reduce(function(sum,p){return sum+Number(p[13]||0);},0)+depreciations.filter(function(r){return activeAssetIds[String(r[1])]&&String(r[12])==="Contabilizada";}).reduce(function(sum,r){return sum+Number(r[6]||0);},0);
    var journals=assetDeprSheet_(ss,"AsientosContables",["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"]).getDataRange().getValues().slice(1);
    var assetDebit=0,accumCredit=0,depLedger=0;
    journals.forEach(function(row){var lines=[];try{lines=JSON.parse(String(row[5]||"[]"));}catch(ignored){}
      lines.forEach(function(line){if(String(line.codigoCuenta)==="1501")assetDebit+=Number(line.debe||0)-Number(line.haber||0);
        if(String(line.codigoCuenta)==="1599")accumCredit+=Number(line.haber||0)-Number(line.debe||0);
        if(String(row[4]||"").indexOf("DEPRECIACION:")===0&&String(line.codigoCuenta)==="1599")depLedger+=Number(line.haber||0)-Number(line.debe||0);});
    });
    var registered=filtered.filter(function(row){return String(row[12])==="Contabilizada";}).reduce(function(sum,row){return sum+Number(row[6]||0);},0);
    var diff=assetDeprMoney_((totalCost-totalAccum)-(assetDebit-accumCredit));
    var depLedgerForSelection=filtered.filter(function(row){return String(row[12])==="Contabilizada";}).reduce(function(sum,row){return sum+Number(row[6]||0);},0);
    return {status:"success",calendario:calendar,activos:assetSummaries,resumenAnual:Object.keys(annual).sort().map(function(k){return annual[k];}),
      resumenCategoria:Object.keys(categories).map(function(k){categories[k].depreciacionAcumulada=assetDeprMoney_(categories[k].depreciacionAcumulada);return categories[k];}),
      conciliacion:{estado:Math.abs(registered-depLedgerForSelection)<0.01?"Conciliado":"Diferencia",
        depreciacionRegistrada:assetDeprMoney_(registered),depreciacionEnLibroMayor:assetDeprMoney_(depLedgerForSelection),
        balancePatrimonial:{estado:Math.abs(diff)<0.01?"Conciliado":"Diferencia",diferencia:diff,costoCapitalizado:assetDeprMoney_(totalCost),
          depreciacionAcumulada:assetDeprMoney_(totalAccum),activoNetoLibro:assetDeprMoney_(totalCost-totalAccum),activoNetoMayor:assetDeprMoney_(assetDebit-accumCredit)}}};
  } finally {lock.releaseLock();}
}
function reverseAssetDepreciationEntry(payload) {
  var input=payload||{},actor=assetDeprActor_(input),ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet=assetDeprSheet_(ss,"DepreciacionesActivos",ASSET_DEPR_HEADERS_),rows=sheet.getDataRange().getValues();
    var matches=rows.slice(1).map(function(row,index){return {row:row,index:index+2};}).filter(function(x){return String(x.row[1])===String(input.activoId)&&String(x.row[2])===String(input.periodo);});
    if(matches.length!==1)throw new Error("DEPRECIATION_ENTRY_NOT_FOUND");
    var match=matches[0],row=match.row;
    if(String(row[12])==="Revertida")return {status:"already_reversed",asientoId:row[11]};
    var later=rows.slice(1).filter(function(x){return String(x[1])===String(input.activoId)&&String(x[2])>String(input.periodo)&&String(x[12])==="Contabilizada";});
    if(later.length)throw new Error("LATEST_PERIOD_ONLY");
    var journals=assetDeprSheet_(ss,"AsientosContables",["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"]).getDataRange().getValues();
    var original=journals.slice(1).filter(function(x){return String(x[0])===String(row[11]);})[0];
    if(!original)throw new Error("DEPRECIATION_JOURNAL_NOT_FOUND");
    var originalLines=JSON.parse(String(original[5]||"[]"));
    var reversed=originalLines.map(function(line){return {codigoCuenta:line.codigoCuenta,nombreCuenta:line.nombreCuenta,debe:Number(line.haber||0),haber:Number(line.debe||0)};});
    var journal=recordAccountingJournalEntry({descripcion:"Reversión depreciación "+input.activoId+" "+input.periodo,
      origenModulo:"ActivosFijos",referenciaId:"REVERSA_DEPRECIACION:"+input.activoId+":"+input.periodo,
      lineas:reversed,creadoPor:actor.userId});
    row[12]="Revertida";row[10]=JSON.stringify({componentes:JSON.parse(String(row[10]||"[]")),asientoReversionId:journal.asientoId,motivo:String(input.motivo||"")});
    sheet.getRange(match.index,1,1,ASSET_DEPR_HEADERS_.length).setValues([row]);
    return {status:"success",asientoId:row[11],asientoReversionId:journal.asientoId};
  } finally {lock.releaseLock();}
}
function registerDepreciableAssetDisposal_(payload) {
  var input=payload||{},actor=assetDeprActor_(input),ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var asset=assetDeprRequireAsset_(ss,input.activoId),date=assetDeprDate_(input.fechaBaja);
    var monthEnd=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0));
    if(date.getUTCDate()!==monthEnd.getUTCDate())throw new Error("MONTH_END_CLOSE");
    var period=date.getUTCFullYear()+"-"+String(date.getUTCMonth()+1).padStart(2,"0");
    var profiles=assetDeprProfileMap_(ss),profile=profiles[String(input.activoId)];
    var depRows=assetDeprSheet_(ss,"DepreciacionesActivos",ASSET_DEPR_HEADERS_).getDataRange().getValues().slice(1);
    var start=String(profile[4]).slice(0,7),months=assetDeprMonthsBetween_(assetDeprDate_(profile[4]),monthEnd)+1;
    for(var m=0;m<months;m++){var dt=assetDeprMonth_(start);dt.setUTCMonth(dt.getUTCMonth()+m);var p=dt.getUTCFullYear()+"-"+String(dt.getUTCMonth()+1).padStart(2,"0");
      if(!depRows.some(function(r){return String(r[1])===String(input.activoId)&&String(r[2])===p&&String(r[12])==="Contabilizada";}))throw new Error("PERIODS_MISSING");}
    var improvements=assetDeprSheet_(ss,"MejorasCapitalizablesActivos",ASSET_DEPR_IMPROVEMENT_HEADERS_).getDataRange().getValues().slice(1).filter(function(r){return String(r[1])===String(input.activoId)&&String(r[11])==="Capitalizada"&&assetDeprDate_(r[2])<=date;});
    var cost=Number(profile[6])+improvements.reduce(function(sum,r){return sum+Number(r[4]||0);},0);
    var accum=Number(profile[13]||0)+depRows.filter(function(r){return String(r[1])===String(input.activoId)&&String(r[2])<=period&&String(r[12])==="Contabilizada";}).reduce(function(sum,r){return sum+Number(r[6]||0);},0);
    var book=assetDeprMoney_(Math.max(0,cost-accum)),sale=assetDeprMoney_(input.valorVenta||0),gain=Math.max(0,sale-book),loss=Math.max(0,book-sale);
    var assetAccount=assetDeprAccount_(ss,profile[15]),accumAccount=assetDeprAccount_(ss,profile[16]);
    var lines=[{codigoCuenta:profile[16],nombreCuenta:accumAccount.name,debe:accum,haber:0},
      {codigoCuenta:gain>0?profile[15]:profile[18]||profile[17],nombreCuenta:gain>0?assetAccount.name:"Pérdida por baja",debe:loss,haber:0},
      {codigoCuenta:profile[15],nombreCuenta:assetAccount.name,debe:0,haber:cost}];
    if(sale>0)lines.push({codigoCuenta:String(input.cuentaBancos||"1101"),nombreCuenta:"Bancos",debe:sale,haber:0});
    if(gain>0)lines.push({codigoCuenta:String(profile[15]),nombreCuenta:"Ganancia por baja",debe:0,haber:gain});
    var journal=recordAccountingJournalEntry({descripcion:"Baja de activo "+input.activoId,origenModulo:"ActivosFijos",
      referenciaId:"BAJA_ACTIVO:"+input.activoId,lineas:lines,creadoPor:actor.userId});
    var disposalSheet=assetDeprSheet_(ss,"BajasBienes",["BajaID","Fecha","TipoBien","BienIDCodigo","NombreBien","MotivoBaja","ValorLibros","AutorizadoPorUserId","DocumentoActaUrl","Estado","Observaciones"]);
    disposalSheet.appendRow(["BAJA-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20),date,String(input.tipoBien||"ActivoFijo"),
      String(input.activoId),String(asset.row[2]),String(input.motivoBaja||""),book,actor.userId,String(input.documentoActaUrl||""),"Aprobada","Asiento "+journal.asientoId]);
    asset.sheet.getRange(asset.rowIndex,8).setValue("Disposed");
    return {status:"success",valorLibros:book,asientoId:journal.asientoId};
  } finally {lock.releaseLock();}
}


const SUPPLIER_CONTACT_HEADERS_=["ContactoID","ProveedorID","Nombre","Cargo","Telefono","Email","Area","EsPrincipal","Estado","FechaRegistro","RegistradoPor"];
const SUPPLIER_ADDRESS_HEADERS_=["DireccionID","ProveedorID","TipoDireccion","Direccion","Ciudad","Departamento","Pais","Estado","FechaRegistro","RegistradoPor"];
const SUPPLIER_TERMS_HEADERS_=["CondicionID","ProveedorID","PlazoCreditoDias","Moneda","DescuentoProntoPago","TiempoEntregaDias","FechaRegistro","Estado","RegistradoPor"];
const SUPPLIER_BANK_HEADERS_=["CuentaID","ProveedorID","Banco","TipoCuenta","NumeroCuenta","Beneficiario","FechaRegistro","Estado","Ultimos4","RegistradoPor"];
const SUPPLIER_BANK_AUDIT_HEADERS_=["AuditoriaID","ProveedorID","UsuarioID","Fecha","Motivo","ReferenciaAutorizacion","NumeroCuentaEnmascarada","Accion","Resultado","Estado"];

function supplierProfileAccess_(payload,ss,write) {
  var access=purchaseQuotationAccess_(payload||{},ss,write===true);
  if(!access||access.authorized!==true)return {authorized:false,code:access&&access.code||"ROLE_NOT_ALLOWED"};
  var role=String(normalizePurchaseAwardRole_(access.actor&&access.actor.role)||"").toLowerCase();
  if(["contador","director","administrador","subdirector"].indexOf(role)<0)return {authorized:false,code:"SUPPLIER_ROLE_NOT_ALLOWED"};
  return {authorized:true,actor:access.actor,role:role,scope:access.scope};
}
function supplierAuxSheet_(ss,name,headers) {
  var sheet=ss.getSheetByName(name)||getOrCreateSheet(ss,name),values=sheet.getDataRange().getValues();
  if(!values||!values.length||!values[0].length)sheet.appendRow(headers);
  else if(JSON.stringify(values[0].map(String))!==JSON.stringify(headers))throw new Error("SUPPLIER_SCHEMA_INVALID");
  return sheet;
}
function supplierReadRows_(ss,name) {
  var sheet=ss.getSheetByName(name);
  return sheet?sheet.getDataRange().getValues():[];
}
function supplierBaseRows_(ss) {
  var rows=supplierReadRows_(ss,"ProveedoresActivos");
  return rows.length?rows.slice(1):[];
}
function supplierFindById_(ss,id) {
  var matches=supplierBaseRows_(ss).map(function(row,index){return {row:row,index:index+2};})
    .filter(function(item){return String(item.row[0]||"")===String(id||"");});
  if(matches.length!==1)throw new Error("SUPPLIER_NOT_FOUND");
  return matches[0];
}
function supplierMaskAccount_(value) {
  var digits=String(value||"").replace(/\D/g,"");
  if(!digits)return "";
  return "****-****-"+digits.slice(-4);
}
function supplierValidateRtn_(value) {
  var rtn=String(value||"").replace(/\D/g,"");
  if(!/^\d{14}$/.test(rtn))throw new Error("SUPPLIER_RTN_INVALID");
  return rtn;
}
function supplierEnsureActiveForOrder_(ss,supplierId) {
  var supplier=supplierFindById_(ss,supplierId).row,state=String(supplier[7]||"").trim().toLowerCase();
  if(["activo","active"].indexOf(state)<0)throw new Error("SUPPLIER_NOT_ELIGIBLE");
  return true;
}
function getSuppliers(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,false);
  if(!access.authorized)return {status:"error",code:access.code};
  var suppliers=supplierBaseRows_(ss),contacts=supplierReadRows_(ss,"ContactosProveedores"),
    addresses=supplierReadRows_(ss,"DireccionesProveedores"),terms=supplierReadRows_(ss,"CondicionesComercialesProveedores"),
    banks=supplierReadRows_(ss,"CuentasBancariasProveedores");
  var result=suppliers.map(function(row){
    var bank=banks.slice(1).filter(function(x){return String(x[1])===String(row[0])&&String(x[7])==="Activo";})[0];
    return {proveedorId:row[0],nombreProveedor:row[2],rtn:row[3],telefono:row[4],email:row[5],
      rubroServicio:row[6],estado:row[7],observaciones:row[8],
      contactos:contacts.slice(1).filter(function(x){return String(x[1])===String(row[0])&&String(x[8])!=="Reemplazado";}),
      direcciones:addresses.slice(1).filter(function(x){return String(x[1])===String(row[0]);}),
      condicionesComerciales:terms.slice(1).filter(function(x){return String(x[1])===String(row[0])&&String(x[7])!=="Reemplazada";}),
      cuentaBancariaEnmascarada:bank?supplierMaskAccount_(bank[4]):""};
  });
  if(input.proveedorId)result=result.filter(function(x){return String(x.proveedorId)===String(input.proveedorId);});
  return {status:"success",proveedores:result};
}
function manageSupplierContact(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,true);
  if(!access.authorized)return {status:"error",code:access.code};
  supplierFindById_(ss,input.proveedorId);
  var sheet=supplierAuxSheet_(ss,"ContactosProveedores",SUPPLIER_CONTACT_HEADERS_),rows=sheet.getDataRange().getValues();
  if(input.esPrincipal===true)rows.slice(1).forEach(function(row,index){
    if(String(row[1])===String(input.proveedorId)&&row[7]===true&&String(row[8])!=="Reemplazado"){
      sheet.getRange(index+2,8).setValue(false);sheet.getRange(index+2,9).setValue("Reemplazado");
    }
  });
  var id="CONTACT-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20);
  sheet.appendRow([id,String(input.proveedorId),String(input.nombre||""),String(input.cargo||""),
    String(input.telefono||""),String(input.email||""),String(input.area||""),input.esPrincipal===true,
    "Activo",new Date(),access.actor.userId]);
  return {status:"success",contactoId:id};
}
function manageSupplierAddress(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,true);
  if(!access.authorized)return {status:"error",code:access.code};
  supplierFindById_(ss,input.proveedorId);
  var sheet=supplierAuxSheet_(ss,"DireccionesProveedores",SUPPLIER_ADDRESS_HEADERS_);
  var id="ADDR-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20);
  sheet.appendRow([id,String(input.proveedorId),String(input.tipoDireccion||""),String(input.direccion||""),
    String(input.ciudad||""),String(input.departamento||""),String(input.pais||"Honduras"),"Activa",new Date(),access.actor.userId]);
  return {status:"success",direccionId:id};
}
function manageSupplierCommercialTerms(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,true);
  if(!access.authorized)return {status:"error",code:access.code};
  supplierFindById_(ss,input.proveedorId);
  var days=Number(input.plazoCreditoDias),delivery=Number(input.tiempoEntregaDias||0),discount=Number(input.descuentoProntoPago||0);
  if([0,15,30,60].indexOf(days)<0||delivery<0||discount<0||discount>100)throw new Error("SUPPLIER_TERMS_INVALID");
  var sheet=supplierAuxSheet_(ss,"CondicionesComercialesProveedores",SUPPLIER_TERMS_HEADERS_),rows=sheet.getDataRange().getValues();
  rows.slice(1).forEach(function(row,index){if(String(row[1])===String(input.proveedorId)&&String(row[7])==="Activa")sheet.getRange(index+2,8).setValue("Reemplazada");});
  var id="TERMS-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20);
  sheet.appendRow([id,String(input.proveedorId),days,String(input.moneda||"HNL"),discount,delivery,new Date(),"Activa",access.actor.userId]);
  return {status:"success",condicionId:id};
}
function manageSupplierBankAccount(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,true);
  if(!access.authorized)return {status:"error",code:access.code};
  if(["contador","director","administrador"].indexOf(access.role)<0)return {status:"error",code:"SUPPLIER_ROLE_NOT_ALLOWED"};
  supplierFindById_(ss,input.proveedorId);
  if(!String(input.motivoAutorizacion||"").trim()||!String(input.referenciaAutorizacion||"").trim())throw new Error("SUPPLIER_BANK_AUTHORIZATION_REQUIRED");
  var account=String(input.numeroCuenta||"").replace(/\D/g,"");
  if(!/^\d{8,30}$/.test(account))throw new Error("SUPPLIER_BANK_ACCOUNT_INVALID");
  var sheet=supplierAuxSheet_(ss,"CuentasBancariasProveedores",SUPPLIER_BANK_HEADERS_),rows=sheet.getDataRange().getValues();
  var previous=rows.slice(1).filter(function(row){return String(row[1])===String(input.proveedorId)&&String(row[7])==="Activo";});
  previous.forEach(function(row,index){var realIndex=rows.findIndex(function(r,i){return i>0&&r[0]===row[0];});if(realIndex>0)sheet.getRange(realIndex+1,8).setValue("Reemplazada");});
  var id="BANK-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20),masked=supplierMaskAccount_(account);
  sheet.appendRow([id,String(input.proveedorId),String(input.banco||""),String(input.tipoCuenta||""),account,
    String(input.beneficiario||""),new Date(),"Activo",account.replace(/\D/g,"").slice(-4),access.actor.userId]);
  var audit=supplierAuxSheet_(ss,"AuditoriaCuentasBancariasProveedores",SUPPLIER_BANK_AUDIT_HEADERS_);
  var auditId="BANK-AUD-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20);
  audit.appendRow([auditId,String(input.proveedorId),access.actor.userId,new Date(),String(input.motivoAutorizacion),
    String(input.referenciaAutorizacion),masked,"SUPPLIER_BANK_ACCOUNT_MODIFIED","success","COMPLETADA"]);
  logStructuredEvent("ACCOUNTING","manageSupplierBankAccount","INFO","SUPPLIER_BANK_ACCOUNT_MODIFIED",
    "Cuenta bancaria de proveedor modificada; número enmascarado "+masked,{proveedorId:String(input.proveedorId),referencia:String(input.referenciaAutorizacion)},access.actor.userId);
  return {status:"success",cuentaId:id,numeroCuentaEnmascarado:masked};
}
function getSupplierBankAccount(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,false);
  if(!access.authorized)return {status:"error",code:access.code};
  if(["contador","director","administrador"].indexOf(access.role)<0)return {status:"error",code:"SUPPLIER_ROLE_NOT_ALLOWED"};
  var rows=supplierReadRows_(ss,"CuentasBancariasProveedores");
  var match=rows.slice(1).filter(function(row){return String(row[1])===String(input.proveedorId)&&String(row[7])==="Activo";})[0];
  if(!match)return {status:"error",code:"SUPPLIER_BANK_ACCOUNT_NOT_FOUND"};
  return {status:"success",cuenta:{cuentaId:match[0],proveedorId:match[1],banco:match[2],tipoCuenta:match[3],
    numeroCuenta:match[4],beneficiario:match[5],numeroCuentaEnmascarado:supplierMaskAccount_(match[4])}};
}
function registerSupplier(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID),access=supplierProfileAccess_(input,ss,true);
  if(!access.authorized)return {status:"error",code:access.code};
  var rtn=supplierValidateRtn_(input.rtn),sheet=supplierAuxSheet_(ss,"ProveedoresActivos",["ProveedorID","FechaRegistro","NombreProveedor","RTN","Telefono","Email","RubroServicio","Estado","Observaciones"]);
  var rows=sheet.getDataRange().getValues(),matches=rows.slice(1).filter(function(row){return String(row[3]||"").replace(/\D/g,"")===rtn;});
  var id=String(input.proveedorId||"");
  if(matches.some(function(row){return String(row[0])!==id;}))throw new Error("SUPPLIER_RTN_DUPLICATE");
  var record=[id||"SUP-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20),new Date(),
    String(input.nombreProveedor||""),rtn,String(input.telefono||""),String(input.email||""),
    String(input.rubroServicio||""),String(input.estado||"Activo"),String(input.observaciones||"")];
  var existing=rows.findIndex(function(row,index){return index>0&&String(row[0])===id;});
  if(existing>0)sheet.getRange(existing+1,1,1,record.length).setValues([record]);else sheet.appendRow(record);
  return {status:"success",proveedorId:record[0]};
}


const PURCHASE_ORDER_CONFIRMATION_HEADERS_=["ConfirmacionID","OrdenCompraID","FechaConfirmacion","ContactoProveedor","Canal","EstadoConfirmacion","DocumentoUrl","Observaciones","RegistradoPor"];

function purchaseDossierRows_(ss,name) {
  var sheet=ss.getSheetByName(name);
  return sheet?sheet.getDataRange().getValues():[];
}
function purchaseDossierDate_(value) {
  if(!value)return "";
  var date=value instanceof Date?value:new Date(value);
  return isNaN(date.getTime())?String(value):date.toISOString();
}
function purchaseDossierSafeUrl_(value) {
  var url=String(value||"").trim();
  if(!/^https:\/\//i.test(url))return "";
  var match=url.match(/^https:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  if(!match)return "";
  var host=match[1].toLowerCase();
  if(["drive.google.com","docs.google.com"].indexOf(host)<0)return "";
  return url;
}
function recordPurchaseOrderConfirmation(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var access=purchaseQuotationAccess_(input,ss,true);
  if(!access||access.authorized!==true)return {status:"error",code:access&&access.code||"ROLE_NOT_ALLOWED"};
  var lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var orderRows=purchaseDossierRows_(ss,"OrdenesCompra"),orders=orderRows.slice(1);
    var order=orders.filter(function(row){return String(row[0])===String(input.ordenCompraId||"");})[0];
    if(!order)return {status:"error",code:"PURCHASE_ORDER_NOT_FOUND"};
    if(String(order[9]||"").toLowerCase()==="cancelada")return {status:"error",code:"PURCHASE_ORDER_CANCELLED"};
    orderRows=purchaseDossierRows_(ss,"OrdenesCompra");
    order=orderRows.slice(1).filter(function(row){return String(row[0])===String(input.ordenCompraId||"");})[0];
    if(!order||String(order[9]||"").toLowerCase()==="cancelada")return {status:"error",code:"PURCHASE_ORDER_CANCELLED"};
    var sheet=ss.getSheetByName("ConfirmacionesOrdenCompra");
    if(!sheet)sheet=ss.insertSheet("ConfirmacionesOrdenCompra");
    var values=sheet.getDataRange().getValues();
    if(!values||!values.length||!values[0].length)sheet.appendRow(PURCHASE_ORDER_CONFIRMATION_HEADERS_);
    else if(JSON.stringify(values[0].map(String))!==JSON.stringify(PURCHASE_ORDER_CONFIRMATION_HEADERS_))throw new Error("PURCHASE_CONFIRMATION_SCHEMA_INVALID");
    var id="CONF-"+String(Utilities.getUuid()).replace(/-/g,"").slice(0,20);
    sheet.appendRow([id,String(input.ordenCompraId),new Date(),String(input.contactoProveedor||""),
      String(input.canal||""),String(input.estadoConfirmacion||"Confirmada"),purchaseDossierSafeUrl_(input.documentoUrl),
      String(input.observaciones||""),access.actor.userId]);
    return {status:"success",confirmacionId:id};
  } finally {lock.releaseLock();}
}
function getPurchaseDossier(payload) {
  var input=payload||{},ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var access=purchaseQuotationAccess_(input,ss,false);
  if(!access||access.authorized!==true)return {status:"error",code:access&&access.code||"ROLE_NOT_ALLOWED"};
  var role=String(normalizePurchaseAwardRole_(access.actor&&access.actor.role)||"").toLowerCase();
  var restricted=role==="subdirector";
  var query=String(input.query||"").trim().toLowerCase();
  var requests=purchaseDossierRows_(ss,"SolicitudesCompra").slice(1);
  var quotes=purchaseDossierRows_(ss,"CotizacionesCompra").slice(1);
  var quoteDetails=purchaseDossierRows_(ss,"DetalleCotizacionesCompra").slice(1);
  var awards=purchaseDossierRows_(ss,"ActasAdjudicacionCompra").slice(1);
  var orders=purchaseDossierRows_(ss,"OrdenesCompra").slice(1);
  var receipts=purchaseDossierRows_(ss,"RecepcionesCompra").slice(1);
  var confirmations=purchaseDossierRows_(ss,"ConfirmacionesOrdenCompra").slice(1);
  var invoices=purchaseDossierRows_(ss,"CuentasPorPagarGastos").slice(1);
  var suppliers=purchaseDossierRows_(ss,"ProveedoresActivos").slice(1);
  var journals=purchaseDossierRows_(ss,"AsientosContables").slice(1);
  function parseArray(value){if(Array.isArray(value))return value;try{var parsed=JSON.parse(String(value||"[]"));return Array.isArray(parsed)?parsed:[];}catch(ignored){return [];}}
  var results=[];
  orders.forEach(function(order){
    var orderId=String(order[0]||""),requestId=String(order[1]||"");
    var request=requests.filter(function(row){return String(row[0])===requestId;})[0];
    if(!request)return;
    var scope=access.scope||{},departments=Array.isArray(scope.departmentIds)?scope.departmentIds.map(String):[];
    if(scope.institutionWide!==true&&departments.indexOf(String(request[2]||""))===-1)return;
    var supplier=suppliers.filter(function(row){return String(row[0])===String(order[3]);})[0];
    var quoteRows=quotes.filter(function(row){return String(row[1])===requestId;});
    var awardRows=awards.filter(function(row){return String(row[1])===requestId;});
    var receiptRows=receipts.filter(function(row){return String(row[1])===orderId;});
    var confirmationRows=confirmations.filter(function(row){return String(row[1])===orderId;});
    var invoiceRows=invoices.filter(function(row){return String(row[9]||"").indexOf("[ORDEN_"+orderId+"]")!==-1;});
    var orderItems=parseArray(order[6]),requestedItems=parseArray(request[6]);
    var receivedItems=[],billedItems=[],payments=[],documents=[],timeline=[];
    receiptRows.forEach(function(row){
      parseArray(row[4]).forEach(function(item){if(item.conforme===true||String(item.estadoConformidad||"").toLowerCase()==="conforme")receivedItems.push(item);});
      documents.push({tipo:"Recepción",fecha:purchaseDossierDate_(row[2]),url:purchaseDossierSafeUrl_(row[8]),id:row[0]});
      timeline.push({etapa:"Recepción",fecha:purchaseDossierDate_(row[2]),estado:row[5],responsable:row[3]});
    });
    quoteRows.forEach(function(row){
      var detail=quoteDetails.filter(function(d){return String(d[1])===String(row[0]);}).map(function(d){return {
        itemId:d[3],descripcion:d[4],unidad:d[5],cantidadSolicitada:Number(d[6]||0),cantidadCotizada:Number(d[7]||0),
        precioUnitario:Number(d[8]||0),subtotal:Number(d[9]||0),descuento:Number(d[10]||0),impuestos:Number(d[11]||0),
        flete:Number(d[12]||0),total:Number(d[13]||0),garantia:d[14],cumplimientoTecnico:d[15],especificacionesCumplidas:d[16]};});
      row.detalle=detail;
      if(row[8])documents.push({tipo:"Cotización",fecha:purchaseDossierDate_(row[3]),url:purchaseDossierSafeUrl_(row[8]),id:row[0]});
      timeline.push({etapa:"Cotización",fecha:purchaseDossierDate_(row[3]),estado:row[9],responsable:row[2]});
    });
    awardRows.forEach(function(row){timeline.push({etapa:"Adjudicación",fecha:purchaseDossierDate_(row[2]),estado:row[10],responsable:row[11]});});
    confirmationRows.forEach(function(row){
      documents.push({tipo:"Confirmación",fecha:purchaseDossierDate_(row[2]),url:purchaseDossierSafeUrl_(row[6]),id:row[0]});
      timeline.push({etapa:"Confirmación del proveedor",fecha:purchaseDossierDate_(row[2]),estado:row[5],responsable:row[8]});
    });
    invoiceRows.forEach(function(row){
      var observations=String(row[9]||""),invoiceUrl=(observations.match(/\[FACTURA_URL:([^\]]+)\]/)||[])[1]||"";
      documents.push({tipo:"Factura",fecha:purchaseDossierDate_(row[13]),url:purchaseDossierSafeUrl_(invoiceUrl),id:row[2]});
      timeline.push({etapa:"Factura",fecha:purchaseDossierDate_(row[13]),estado:row[6],responsable:row[1]});
      var itemMatch=observations.match(/\[ITEMS_JSON:(\[[\s\S]*?\])\]/);
      if(itemMatch)try{billedItems=billedItems.concat(JSON.parse(itemMatch[1]));}catch(ignored){}
      var payMatches=observations.match(/\[ABONO_PAG-[^\]]*?\sL\s*([\d,.]+)\s*-\s*([^-]+)-\s*Ref:\s*([^\]]+)\]/g)||[];
      payMatches.forEach(function(token){
        var m=token.match(/L\s*([\d,.]+)\s*-\s*([^-]+)-\s*Ref:\s*([^\]]+)/);
        if(m){var payment={monto:Number(m[1].replace(/,/g,"")),metodo:m[2].trim(),referencia:m[3].trim()};payments.push(payment);
          var paymentUrl=(observations.match(/\[COMPROBANTE_URL:([^\]]+)\]/)||[])[1]||"";
          documents.push({tipo:"Pago",fecha:purchaseDossierDate_(row[13]),url:purchaseDossierSafeUrl_(paymentUrl),id:payment.referencia});
          timeline.push({etapa:"Pago",fecha:purchaseDossierDate_(row[13]),estado:"Aplicado",responsable:row[1]});}
      });
    });
    var journalRows=journals.filter(function(row){return String(row[4]||"")===String(orderId)||String(row[4]||"")===String(invoiceRows[0]&&invoiceRows[0][0]||"");});
    journalRows.forEach(function(row){timeline.push({etapa:"Asiento contable",fecha:purchaseDossierDate_(row[1]),estado:row[6],responsable:row[7]});});
    if(order[14])documents.push({tipo:"Orden de compra",fecha:purchaseDossierDate_(order[4]),url:purchaseDossierSafeUrl_(order[14]),id:orderId});
    timeline.push({etapa:"Solicitud",fecha:purchaseDossierDate_(request[1]),estado:request[9],responsable:request[3]});
    timeline.push({etapa:"Orden de compra",fecha:purchaseDossierDate_(order[4]),estado:order[9],responsable:order[10]});
    var qtyRequested=orderItems.reduce(function(sum,item){return sum+Number(item.cantidad||item.Cantidad||0);},0);
    var qtyReceived=receivedItems.reduce(function(sum,item){return sum+Number(item.cantidad||item.cantidadRecibida||0);},0);
    var qtyBilled=billedItems.reduce(function(sum,item){return sum+Number(item.cantidad||0);},0);
    var invoiceAmount=invoiceRows.reduce(function(sum,row){return sum+Number(row[10]||row[3]||0);},0);
    var paid=payments.reduce(function(sum,item){return sum+Number(item.monto||0);},0);
    var balance=invoiceRows.reduce(function(sum,row){return sum+Number(row[11]===undefined?Math.max(0,Number(row[10]||row[3]||0)-Number(row[12]||0)):row[11]);},0);
    var dossier={solicitud:{solicitudId:requestId,fecha:purchaseDossierDate_(request[1]),departamento:request[2],solicitante:request[3]},
      orden:{ordenCompraId:orderId,estado:order[9],proveedorId:order[3],proveedorNombre:supplier&&supplier[2]||String(order[3]),fechaEmision:purchaseDossierDate_(order[4])},
      cotizaciones:quoteRows.map(function(row){return {cotizacionId:row[0],proveedorId:row[2],precioTotal:Number(row[5]||0),detalle:row.detalle||[]};}),
      adjudicacion:awardRows.map(function(row){return {actaId:row[0],fecha:purchaseDossierDate_(row[2]),dictamen:row[4],montoAdjudicado:Number(row[6]||0)}}),
      recepciones:receiptRows.map(function(row){return {recepcionId:row[0],fecha:purchaseDossierDate_(row[2]),estadoConformidad:row[5]}}),
      facturas:invoiceRows.map(function(row){return {obligacionId:row[0],numeroFactura:row[2],importe:Number(row[10]||row[3]||0),saldoPendiente:Number(row[11]||0)}}),
      pagos:payments,timeline:timeline.sort(function(a,b){return String(a.fecha).localeCompare(String(b.fecha));}),
      documentos:documents,documentosRestringidos:restricted,
      metricas:{cantidadPedida:qtyRequested,cantidadRecibida:qtyReceived,cantidadFacturada:qtyBilled,
        cantidadPendiente:Math.max(0,qtyRequested-qtyReceived),importeAutorizado:Number(order[7]||0),
        importeFacturado:invoiceAmount,importePagado:paid,saldoPendiente:balance}};
    if(restricted){dossier.documentos=[];dossier.documentosRestringidos=true;}
    var haystack=[requestId,orderId,order[3],supplier&&supplier[2],request[3]].concat(invoiceRows.map(function(row){return row[2];})).join(" ").toLowerCase();
    if(!query||haystack.indexOf(query)!==-1)results.push(dossier);
  });
  return {status:"success",total:results.length,expedientes:results};
}

function doGet() {
  return textResponse({ status: "success", service: "ACCOUNTING",
    configured: !!String(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "").trim()
  }, null, "ACCOUNTING");
}

function doPost(e) {
  let correlationId = apiResponseCorrelationId_();
  const respond = function(value) { return textResponse(value, correlationId, "ACCOUNTING"); };
  try {
    if (!e || !e.postData || typeof e.postData.contents !== "string" || !e.postData.contents) {
      return respond({ status: "error", code: "REQUEST_BODY_REQUIRED" });
    }
    var request = JSON.parse(e.postData.contents);
    correlationId = apiResponseCorrelationId_(request && request.correlationId);
    if (!request || typeof request !== "object" || Array.isArray(request) ||
        typeof request.action !== "string" || !request.action ||
        !request.payload || typeof request.payload !== "object" || Array.isArray(request.payload)) {
      return respond({ status: "error", code: "REQUEST_SCHEMA_INVALID" });
    }
    var actionPayload = Object.assign({}, request.payload, { correlationId: correlationId });
    var pinSensitiveActions = ["configureFamilyCreditPin","configureFamilyCreditAuthorization","processFamilyCreditPurchase"];
    var safePayloadMeta = typeof sanitizePayloadForLog === "function" ? sanitizePayloadForLog(actionPayload) : "[Payload metadata unavailable]";
    var safeRequestMeta = pinSensitiveActions.indexOf(request.action) !== -1
      ? { action: request.action, payload: safePayloadMeta }
      : safePayloadMeta;
    if (request.action === "configurePaymentConcept") return respond(configurePaymentConcept(actionPayload));
    if (request.action === "getPayrollConceptCatalog") return respond(getPayrollConceptCatalog(actionPayload));
    if (request.action === "savePayrollConcept") return respond(savePayrollConcept(actionPayload));
    if (request.action === "setPayrollConceptStatus") return respond(setPayrollConceptStatus(actionPayload));
    if (request.action === "assignPayrollConcept") return respond(assignPayrollConcept(actionPayload));
    if (request.action === "getPayrollConceptAssignments") return respond(getPayrollConceptAssignments(actionPayload));
    if (request.action === "setPayrollConceptAssignmentStatus") return respond(setPayrollConceptAssignmentStatus(actionPayload));
    if (request.action === "calculatePayrollPeriod") return respond(calculatePayrollPeriod(actionPayload));
    if (request.action === "getPayrollBatchPreview") return respond(getPayrollBatchPreview(actionPayload));
    if (request.action === "getPayrollEmployeePayConfig") return respond(getPayrollEmployeePayConfig(actionPayload));
    if (request.action === "savePayrollEmployeePayConfig") return respond(savePayrollEmployeePayConfig(actionPayload));
    if (request.action === "recalculatePayrollEmployees") return respond(recalculatePayrollEmployees(actionPayload));
    if (request.action === "getPayrollPeriodSummary") return respond(getPayrollPeriodSummary(actionPayload));
    if (request.action === "generatePayrollPeriod") return respond(generatePayrollPeriod(actionPayload));
    if (request.action === "calculateExtraordinaryPayroll") return respond(calculateExtraordinaryPayroll(actionPayload));
    if (request.action === "getEmployeeLoansAdvances") return respond(getEmployeeLoansAdvances(actionPayload));
    if (request.action === "manageEmployeeLoanAdvance") return respond(manageEmployeeLoanAdvance(actionPayload));
    if (request.action === "getLoanAmortizationSchedule") return respond(getLoanAmortizationSchedule(actionPayload));
    if (request.action === "generatePayrollReceiptPDF") return respond(generatePayrollReceiptPDF(actionPayload));
    if (request.action === "getPayrollReceiptPDFFile") return respond(getPayrollReceiptPDFFile(actionPayload));
    if (request.action === "getStaffPayrollReceipt") return respond(getStaffPayrollReceipt(actionPayload));
    if (request.action === "previewPayrollReceiptDistribution") return respond(previewPayrollReceiptDistribution(actionPayload));
    if (request.action === "processPayrollReceiptDistribution") return respond(processPayrollReceiptDistribution(actionPayload));
    if (request.action === "recordPayrollJournalAdjustment") return respond(recordPayrollJournalAdjustment(actionPayload));
    if (request.action === "recordAccountingJournalEntry") return respond(recordAccountingJournalEntry(actionPayload));
    if (request.action === "getAccountingJournalEntries") return respond(getAccountingJournalEntries(actionPayload));
    if (request.action === "getPaginatedJournalEntries") return respond(getPaginatedJournalEntries(actionPayload));
    if (request.action === "getAdvancedDashboardAnalytics") return respond(getAdvancedDashboardAnalytics(actionPayload));
    if (request.action === "submitPurchaseQuotation") return respond(submitPurchaseQuotation(actionPayload));
    if (request.action === "recordPurchaseReceipt") return respond(recordPurchaseReceipt(actionPayload));
    // case "getSuppliers": result = getSuppliers(payload); break;
    if (request.action === "getSuppliers") return respond(getSuppliers(actionPayload));
    if (request.action === "registerSupplier") return respond(registerSupplier(actionPayload));
    if (request.action === "manageSupplierContact") return respond(manageSupplierContact(actionPayload));
    if (request.action === "manageSupplierAddress") return respond(manageSupplierAddress(actionPayload));
    if (request.action === "manageSupplierCommercialTerms") return respond(manageSupplierCommercialTerms(actionPayload));
    if (request.action === "manageSupplierBankAccount") return respond(manageSupplierBankAccount(actionPayload));
    if (request.action === "getSupplierBankAccount") return respond(getSupplierBankAccount(actionPayload));
    // case "getPurchaseDossier": result = getPurchaseDossier(payload); break;
    if (request.action === "getPurchaseDossier") return respond(getPurchaseDossier(actionPayload));
    if (request.action === "recordPurchaseOrderConfirmation") return respond(recordPurchaseOrderConfirmation(actionPayload));


    if (request.action === "getPurchaseReceiptAssetCandidates") return respond(getPurchaseReceiptAssetCandidates(actionPayload));
    if (request.action === "registerAssetsFromPurchaseReceipt") return respond(registerAssetsFromPurchaseReceipt(actionPayload));
    if (request.action === "getAssetItems") return respond(getAssetItems(actionPayload));
    if (request.action === "manageAssetItem") return respond(manageAssetItem(actionPayload));
    if (request.action === "createPurchaseRequest") return respond(createPurchaseRequest(actionPayload));
    if (request.action === "createPurchaseOrder") return respond(createPurchaseOrder(actionPayload));
    if (request.action === "verifyThreeWayMatch") return respond(verifyThreeWayMatch(actionPayload));
    if (request.action === "saveAssetDepreciationPolicy") return respond(saveAssetDepreciationPolicy(actionPayload));
    if (request.action === "configureAssetDepreciationProfile") return respond(configureAssetDepreciationProfile(actionPayload));
    if (request.action === "registerCapitalizableAssetImprovement") return respond(registerCapitalizableAssetImprovement(actionPayload));
    if (request.action === "calculateAssetDepreciation") return respond(calculateAssetDepreciation(actionPayload));
    if (request.action === "getAssetDepreciationSchedule") return respond(getAssetDepreciationSchedule(actionPayload));
    if (request.action === "registerDepreciableAssetDisposal") return respond(registerDepreciableAssetDisposal_(actionPayload));
    if (request.action === "reverseAssetDepreciationEntry") return respond(reverseAssetDepreciationEntry(actionPayload));


    if (request.action === "getPurchaseQuotations") return respond(getPurchaseQuotations(actionPayload));
    if (request.action === "getPurchaseQuotationMatrix") return respond(getPurchaseQuotationMatrix(actionPayload));
    if (request.action === "adjudicatePurchaseQuotations") return respond(adjudicatePurchaseQuotations(actionPayload));
    if (request.action === "manageCatalogCategory") return respond(manageCatalogCategory(actionPayload));
    if (request.action === "getCatalogCategories") return respond(getCatalogCategories(actionPayload));
    if (request.action === "manageCatalogUnit") return respond(manageCatalogUnit(actionPayload));
    if (request.action === "getCatalogUnits") return respond(getCatalogUnits(actionPayload));
    if (request.action === "manageCatalogItem") return respond(manageCatalogItem(actionPayload));
    if (request.action === "getCatalogItems") return respond(getCatalogItems(actionPayload));
    if (request.action === "importCatalogItems") return respond(importCatalogItems(actionPayload));
    if (request.action === "exportCatalogItems") return respond(exportCatalogItems(actionPayload));
    if (request.action === "configureInventoryValuationPolicy") return respond(configureInventoryValuationPolicy(actionPayload));
    if (request.action === "getValuatedInventoryReport") return respond(getValuatedInventoryReport(actionPayload));
    if (request.action === "exportValuatedInventoryReportCSV") return respond(exportValuatedInventoryReportCSV(actionPayload));
    if (request.action === "exportValuatedInventoryReportPDF") return respond(exportValuatedInventoryReportPDF(actionPayload));
    if (request.action === "recordInventoryMovement") return respond(recordInventoryMovement(actionPayload));
    if (request.action === "getInventoryKardex") return respond(getInventoryKardex(actionPayload));
    if (request.action === "transferInventoryStock") return respond(transferInventoryStock(actionPayload));
    if (request.action === "confirmTransferReceipt") return respond(confirmTransferReceipt(actionPayload));
    if (request.action === "getInventoryTransfers") return respond(getInventoryTransfers(actionPayload));
    if (request.action === "createMaterialRequisition") return respond(createMaterialRequisition(actionPayload));
    if (request.action === "getMaterialRequisitions") return respond(getMaterialRequisitions(actionPayload));
    if (request.action === "manageMaterialRequisition") return respond(manageMaterialRequisition(actionPayload));
    if (request.action === "manageInventoryReplenishmentPolicy") return respond(manageInventoryReplenishmentPolicy(actionPayload));
    if (request.action === "getInventoryReplenishmentSuggestions") return respond(getInventoryReplenishmentSuggestions(actionPayload));
    if (request.action === "deliverMaterialRequisition") return respond(deliverMaterialRequisition(actionPayload));
    if (request.action === "returnMaterialToInventory") return respond(returnMaterialToInventory(actionPayload));
    if (request.action === "recognizeAssignedMaterialConsumption") return respond(recognizeAssignedMaterialConsumption(actionPayload));
    if (request.action === "manageMaintenanceOrder") return respond(manageMaintenanceOrder(actionPayload));
    if (request.action === "manageServiceTariff") return respond(manageServiceTariff(actionPayload));
    if (request.action === "getServiceTariffs") return respond(getServiceTariffs(actionPayload));
    if (request.action === "manageTransportTariff") return respond(manageTransportTariff(actionPayload));
    if (request.action === "generateTransportMonthlyCharges") return respond(generateTransportMonthlyCharges(actionPayload));
    if (request.action === "cancelStudentTransportAssignment") return respond(cancelStudentTransportAssignment(actionPayload));
    if (request.action === "assignStudentTransport") return respond(assignStudentTransport(actionPayload));
    if (request.action === "optimizeRouteStopsSequence") return respond(optimizeRouteStopsSequence(actionPayload));
    if (request.action === "getRouteOptimizationProposals") return respond(getRouteOptimizationProposals(actionPayload));
    if (request.action === "approveRouteStopsOptimization") return respond(approveRouteStopsOptimization(actionPayload));
    if (request.action === "rejectRouteStopsOptimization") return respond(rejectRouteStopsOptimization(actionPayload));
    if (request.action === "getTransportEfficiencyMetrics") return respond(getTransportEfficiencyMetrics(actionPayload));
    if (request.action === "uploadPaymentVoucher") return respond(uploadPaymentVoucher(actionPayload));
    if (request.action === "getPaymentVouchers") return respond(getPaymentVouchers(actionPayload));
    if (request.action === "getPaymentVoucherFile") return respond(getPaymentVoucherFile(actionPayload));
    if (request.action === "reviewPaymentVoucher") return respond(reviewPaymentVoucher(actionPayload));
    if (request.action === "getFamilyCreditApprovalPreference") return respond(getFamilyCreditApprovalPreference(actionPayload));
    if (request.action === "configureFamilyCreditApprovalPreference") return respond(configureFamilyCreditApprovalPreference(actionPayload));
    if (request.action === "configureFamilyCreditPin") return respond(configureFamilyCreditPin(actionPayload));
    if (request.action === "configureFamilyCreditAuthorization") return respond(configureFamilyCreditAuthorization(actionPayload));
    if (request.action === "getFamilyCreditAuthorizations") return respond(getFamilyCreditAuthorizations(actionPayload));
    if (request.action === "processFamilyCreditPurchase") return respond(processFamilyCreditPurchase(actionPayload));
    if (request.action === "getFamilyCreditSalesReconciliation") return respond(getFamilyCreditSalesReconciliation(actionPayload));
    if (request.action === "createStoreOrder") return respond(createStoreOrder(actionPayload));
    if (request.action === "getStoreOrders") return respond(getStoreOrders(actionPayload));
    if (request.action === "updateStoreOrderStatus") return respond(updateStoreOrderStatus(actionPayload));
    if (request.action === "createCafeteriaOrder") return respond(createCafeteriaOrder(actionPayload));
    if (request.action === "getCafeteriaOrders") return respond(getCafeteriaOrders(actionPayload));
    if (request.action === "updateCafeteriaOrderStatus") return respond(updateCafeteriaOrderStatus(actionPayload));
    if (request.action === "getStudentAccountStatement") return respond(getStudentAccountStatement(actionPayload));
    if (request.action === "manageWorkShiftAndSubstitution") return respond(manageWorkShiftAndSubstitution(actionPayload));
    if (request.action === "manageStaffingNeeds") return respond(manageStaffingNeeds(actionPayload));
    if (request.action === "getStaffingNeedsPlanning") return respond(getStaffingNeedsPlanning(actionPayload));
    if (request.action === "getTransportRoutes") return respond(getTransportRoutes(actionPayload));
    if (request.action === "getTransportAssignments") return respond(getTransportAssignments(actionPayload));
    if (request.action === "getTripPassengerManifest") return respond(getTripPassengerManifest(actionPayload));
    if (request.action === "requestEmployeeLoanAdvance") return respond(requestEmployeeLoanAdvance(actionPayload));
    if (request.action === "approveEmployeeLoanAdvance") return respond(approveEmployeeLoanAdvance(actionPayload));
    if (request.action === "submitAttendanceCorrection") return respond(submitAttendanceCorrection(actionPayload));
    if (request.action === "reviewAttendanceCorrection") return respond(reviewAttendanceCorrection(actionPayload));
    if (request.action === "getEmployeeSelfServicePortal") return respond(getEmployeeSelfServicePortal(actionPayload));
    if (request.action === "recordStaffCheckIn") return respond(recordStaffCheckIn(actionPayload));
    if (request.action === "recordStaffAttendance") return respond(recordStaffAttendance(actionPayload));
    if (request.action === "getStaffAttendanceLogs") return respond(getStaffAttendanceLogs(actionPayload));
    if (request.action === "manageProfessionalDevelopmentPlan") return respond(manageProfessionalDevelopmentPlan(actionPayload));
    if (request.action === "getTrainingAnalyticsReport") return respond(getTrainingAnalyticsReport(actionPayload));
    if (request.action === "manageTrainingCourse") return respond(manageTrainingCourse(actionPayload));
    if (request.action === "manageTrainingEnrollment") return respond(manageTrainingEnrollment(actionPayload));
    if (request.action === "manageLaborIncident") return respond(manageLaborIncident(actionPayload));
    if (request.action === "manageDisciplinaryMeasure") return respond(manageDisciplinaryMeasure(actionPayload));
    if (request.action === "getEmployeeRecords") return respond(getEmployeeRecords(actionPayload));
    if (request.action === "getLeaveVacationRequests") return respond(getLeaveVacationRequests(actionPayload));
    if (request.action === "getVacationRequests") return respond(getVacationRequests(actionPayload));
    if (request.action === "submitLeaveVacationRequest") return respond(submitLeaveVacationRequest(actionPayload));
    if (request.action === "submitVacationRequest") return respond(submitVacationRequest(actionPayload));
    if (request.action === "reviewVacationRequest") return respond(reviewVacationRequest(actionPayload));
    if (request.action === "reviewLeaveVacationRequest") return respond(reviewLeaveVacationRequest(actionPayload));
    if (request.action === "calculateVacationBalances") return respond(calculateVacationBalances(actionPayload));
    if (request.action === "recordMedicalLeave") return respond(recordMedicalLeave(actionPayload));
    if (request.action === "validateImportPreview") return respond(validateImportPreview(actionPayload));
    if (request.action === "getAccountingMigrationFileAudit") return respond(getAccountingMigrationFileAudit(actionPayload));
    if (request.action === "importDataWithColumnMapping") return respond(importDataWithColumnMapping(actionPayload));
    return respond({ status: "error", code: "ACTION_NOT_ALLOWED" });
  } catch (error) {
    var rawCode = String(error && error.message || "").split(":")[0].trim();
    var safeCodes = {
      WORK_SHIFT_OPERATION_INVALID: true, WORK_SHIFT_DATE_INVALID: true,
      WORK_SHIFT_DATE_RANGE_INVALID: true, WORK_SHIFT_TIME_INVALID: true,
      WORK_SHIFT_SUBSTITUTE_INVALID: true, WORK_SHIFT_WRITE_FAILED: true, WORK_SHIFT_ID_COLLISION: true,
            STAFFING_QUANTITY_INVALID: true, STAFFING_FIELDS_REQUIRED: true,
      STAFFING_PLAN_WRITE_FAILED: true, STAFFING_PLAN_ID_COLLISION: true,
      DEPARTMENT_REFERENCE_REQUIRED: true, DEPARTMENT_REFERENCE_NOT_FOUND: true,
            FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED: true, FAMILY_CREDIT_LIMITS_INVALID: true,
      FAMILY_CREDIT_PIN_INVALID: true, FAMILY_CREDIT_PIN_NOT_CONFIGURED: true, FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED: true,
      FAMILY_CREDIT_CURRENT_PIN_REQUIRED: true, FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED: true,
      FAMILY_CREDIT_ACTIVE_GUARDIAN_RELATION_REQUIRED: true, FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED: true,
      FAMILY_CREDIT_GUARDIAN_OWNERSHIP_REQUIRED: true, FAMILY_CREDIT_DAILY_LIMIT_EXCEEDED: true,
      FAMILY_CREDIT_MONTHLY_LIMIT_EXCEEDED: true, FAMILY_CREDIT_APPROVAL_MODE_INVALID: true,
      FAMILY_CREDIT_CONFIGURATION_DUPLICATE: true, FAMILY_CREDIT_REVERSAL_WRITE_FAILED: true,
      FAMILY_CREDIT_PAYMENT_STATE_SERVER_MANAGED: true, FAMILY_CREDIT_SALES_REPORT_ROLE_NOT_ALLOWED: true,
      FAMILY_CREDIT_PIN_INPUT_INVALID: true, FAMILY_CREDIT_AUTHORIZATION_NOT_FOUND: true,
      FAMILY_CREDIT_AUTHORIZATION_AMBIGUOUS: true, FAMILY_CREDIT_AUTHORIZATION_EXPIRED: true,
      FAMILY_CREDIT_ORDER_NOT_FOUND: true, FAMILY_CREDIT_PURCHASE_INVALID: true,
      FAMILY_CREDIT_PURCHASE_AMOUNT_INVALID: true, FAMILY_CREDIT_MOVEMENT_AMBIGUOUS: true,
      STORE_INSUFFICIENT_STOCK: true, STORE_PRODUCT_NOT_FOUND: true, STORE_PRODUCT_AMBIGUOUS: true,
      ORDER_QUANTITY_INVALID: true, CAFETERIA_INSUFFICIENT_STOCK: true, CAFETERIA_PRODUCT_NOT_FOUND: true,
      ORDER_ITEMS_REQUIRED: true, CAFETERIA_ITEMS_REQUIRED: true, STUDENT_ID_REQUIRED: true,
            PAYMENT_VOUCHER_FILE_REQUIRED: true, PAYMENT_VOUCHER_DECISION_INVALID: true,
      PAYMENT_VOUCHER_SCHEMA_INVALID: true, PAYMENT_VOUCHER_SCHEMA_DUPLICATE_HEADER: true,
      PAYMENT_VOUCHER_GROUP_AMBIGUOUS: true, PAYMENT_VOUCHER_ALREADY_REVIEWED: true,
      VOUCHER_VERSION_IMMUTABLE: true, VOUCHER_VERSION_REQUIRES_OBSERVATION: true,
      ATTACHMENT_STORAGE_INTEGRITY_MISMATCH: true, ATTACHMENT_STORAGE_METADATA_MISMATCH: true,
      ATTACHMENT_SIZE_MISMATCH: true, ATTACHMENT_STORAGE_PRIVATE_FAILED: true,
      ATTACHMENT_FOLDER_LOCK_TIMEOUT: true, ATTACHMENT_FOLDER_NOT_PRIVATE: true,
      ATTACHMENT_FOLDER_PRIVATE_SETUP_FAILED: true, ATTACHMENT_FILE_NOT_PRIVATE: true,
      EVIDENCE_INTEGRITY_METADATA_INVALID: true, EVIDENCE_TAMPERING_DETECTED: true,
      EVIDENCE_POLICY_AMBIGUOUS: true, EVIDENCE_POLICY_INVALID: true,
      PAYROLL_BATCH_PREVIEW_FAILED: true, PAYROLL_PAYMENT_CONFIG_READ_FAILED: true, PAYROLL_PAYMENT_CONFIG_INVALID: true, PAYROLL_PAYMENT_CONFIG_WRITE_FAILED: true, PAYROLL_RECALCULATION_EMPLOYEES_INVALID: true, PAYROLL_RECALCULATION_REQUIRES_DRAFT: true, PAYROLL_RECALCULATION_EMPLOYEE_NOT_FOUND: true, PAYROLL_RECALCULATION_LOAN_ALREADY_APPLIED: true, PAYROLL_RECALCULATION_FAILED: true, PAYROLL_VARIANCE_VALUE_INVALID: true, PAYROLL_EMPLOYEE_RECALCULATION_FAILED: true, PAYROLL_BATCH_RECALCULATION_FAILED: true,
      PAYROLL_LOAN_REVIEW_NOT_AUTHORIZED: true, PAYROLL_TERMINAL_STATE: true,
      PAYROLL_PERIOD_CONFLICT: true, PAYROLL_NOT_CLOSED: true,
      PAYROLL_JOURNAL_ENTRY_UNBALANCED: true, PAYROLL_JOURNAL_ENTRY_INVALID: true,
      PAYROLL_JOURNAL_LINK_REQUIRED: true, PAYROLL_JOURNAL_LINK_CONFLICT: true,
      PAYROLL_JOURNAL_LINK_AMBIGUOUS: true, PAYROLL_JOURNAL_LINK_ORPHANED: true,
      PAYROLL_JOURNAL_DUPLICATE_REQUIRES_RECONCILIATION: true,
      PAYROLL_JOURNAL_POST_FAILED: true, PAYROLL_JOURNAL_PLANILLA_CHANGED: true,
      PAYROLL_LOAN_ACTION_INVALID: true, PAYROLL_LOAN_REVIEW_NOT_AUTHORIZED: true,
      LOAN_MANAGEMENT_INVALID: true, LOAN_MANAGEMENT_REASON_REQUIRED: true,
      LOAN_MANAGEMENT_DUPLICATE: true, LOAN_MANAGEMENT_WRITE_FAILED: true,
      LOAN_STATE_INVALID: true, LOAN_RENEGOTIATION_INVALID: true,
      LOAN_SETTLEMENT_INVALID: true, LOAN_DATA_INVALID: true,
      LOAN_ALREADY_REVIEWED: true, LOAN_APPROVED_AMOUNT_INVALID: true,
      LOAN_REQUEST_VALUES_INVALID: true, LOAN_REVIEW_WRITE_FAILED: true,
      LOAN_REQUEST_WRITE_FAILED: true, CONCURRENT_UPDATE_RETRY: true,
      IMPORT_PREVIEW_INVALID_OR_STALE: true, IMPORT_TARGET_CHANGED_AFTER_PREVIEW: true,
      IMPORT_TARGET_SNAPSHOT_UNVERIFIED: true, IMPORT_PERMISSION_DENIED: true,
      AUTH_PERMISSION_DENIED: true, VERIFIED_IDENTITY_REQUIRED: true,
      MIGRATION_BATCH_ROLLED_BACK: true, MIGRATION_COMPENSATION_REQUIRED: true,
      RESOURCE_OWNERSHIP_REPAIR_REQUIRED: true, MIGRATION_OWNER_SERVICE_NOT_CONFIGURED: true,
      ACCOUNTING_AUTH_SERVICE_NOT_CONFIGURED: true, ACCOUNTING_AUTH_SERVICE_UNAVAILABLE: true,
      IMPORT_FILE_INVALID: true, IMPORT_FILE_MIME_INVALID: true, IMPORT_FILE_BASE64_INVALID: true,
      IMPORT_FILE_SIGNATURE_INVALID: true, IMPORT_FILE_PACKAGE_INVALID: true,
      IMPORT_FILE_MACROS_NOT_ALLOWED: true, IMPORT_FILE_UNCOMPRESSED_SIZE_LIMIT: true,
      MIGRATION_SCHEMA_MISMATCH: true, MIGRATION_FIELD_NOT_ALLOWED: true,
      MIGRATION_WRITE_CONTRACT_INVALID: true, MIGRATION_FILE_HASH_REQUIRED: true,
      MIGRATION_FILE_HASH_AUDIT_SCHEMA_MISMATCH: true, DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED: true,
      RESOURCE_NOT_FOUND: true, RESOURCE_SCHEMA_INVALID: true, ROLE_NOT_ALLOWED: true,
      INVALID_ATTENDANCE_TYPE: true, ATTENDANCE_ALREADY_RECORDED: true, ATTENDANCE_ID_COLLISION: true, ATTENDANCE_WRITE_FAILED: true, ATTENDANCE_ENTRY_REQUIRED: true, INVALID_DATE_RANGE: true,
      DEVELOPMENT_PLAN_TITLE_REQUIRED: true, DEVELOPMENT_PLAN_DATE_RANGE_INVALID: true, DEVELOPMENT_PLAN_GOALS_INVALID: true, DEVELOPMENT_PLAN_WRITE_FAILED: true,
      TRAINING_COURSE_DURATION_INVALID: true, TRAINING_COURSE_WRITE_FAILED: true, TRAINING_COURSE_ID_COLLISION: true,
      TRAINING_COURSE_NAME_REQUIRED: true, TRAINING_COURSE_REQUIREMENTS_INVALID: true,
      TRAINING_ATTENDANCE_INVALID: true, TRAINING_GRADE_INVALID: true, TRAINING_ENROLLMENT_DATE_INVALID: true,
      TRAINING_CERTIFICATE_DATE_RANGE_INVALID: true, TRAINING_ENROLLMENT_WRITE_FAILED: true, TRAINING_ENROLLMENT_ID_COLLISION: true,
      LABOR_INCIDENT_ID_COLLISION: true, LABOR_INCIDENT_WRITE_FAILED: true, LABOR_INCIDENT_DESCRIPTION_REQUIRED: true,
      LABOR_INCIDENT_BOOLEAN_INVALID: true, DISCIPLINARY_MEASURE_ID_COLLISION: true, DISCIPLINARY_DAYS_INVALID: true,
      DISCIPLINARY_BASIS_REQUIRED: true, DISCIPLINARY_WRITE_FAILED: true,
      REQUEST_DATE_INVALID: true, REQUEST_DURATION_INVALID: true, VACATION_REQUEST_OVERLAP: true,
      CONCURRENT_UPDATE_RETRY: true, REQUEST_STATE_INVALID: true, REQUEST_ALREADY_REVIEWED: true,
      VACATION_WRITE_FAILED: true, MEDICAL_LEAVE_WRITE_FAILED: true,
      MIGRATION_DESTINATION_MISMATCH: true, MIGRATION_OWNER_WRITE_FAILED: true,
      MIGRATION_IDEMPOTENCY_CONFLICT: true, MIGRATION_CELL_TYPE_INVALID: true,
      MIGRATION_WRITE_ALREADY_COMPENSATED: true, DEPARTMENT_IMPORT_PERMISSION_DENIED: true,
      DEPARTMENT_IMPORT_MIXED_DEPARTMENTS: true, DEPARTMENT_IMPORT_DEPARTMENT_UNKNOWN: true,
      ACTIVE_DEPARTMENT_REQUIRED: true, ACTIVE_SCOPE_NOT_ASSIGNED: true,
      CATALOG_SCHEMA_MIGRATION_REQUIRED: true,
      CATALOG_SCHEMA_MISMATCH: true,
      CATALOG_ROLE_NOT_ALLOWED: true,
      CATALOG_UNITS_NOT_CONFIGURED: true,
      CATALOG_UNIT_FACTOR_INVALID: true,
      CATALOG_NOT_CONFIGURED: true,
      CATALOG_ITEM_REQUIRED_FIELDS: true,
      CATALOG_ITEM_CODE_INVALID: true,
      CATALOG_CATEGORY_NOT_FOUND_OR_AMBIGUOUS: true,
      CATALOG_ITEM_CODE_IMMUTABLE_REQUIRES_MIGRATION: true,
      CATALOG_ITEM_CODE_DUPLICATE: true,
      CATALOG_ITEM_NAME_DUPLICATE: true,
      CATALOG_ITEM_NUMBER_INVALID: true,
      CATALOG_STOCK_MAX_BELOW_MIN: true,
      CATALOG_REORDER_ABOVE_MAX: true,
      CATALOG_ITEM_STATE_INVALID: true,
      CATALOG_CATEGORY_NAME_REQUIRED: true,
      CATALOG_CATEGORY_DUPLICATE: true,
      CATALOG_UNIT_VALUES_INVALID: true,
      CATALOG_BASE_UNIT_FACTOR_MUST_BE_ONE: true,
      CATALOG_UNIT_BASE_INCOMPATIBLE: true,
      CATALOG_UNIT_DUPLICATE: true,
      CATALOG_IMPORT_CONTENT_REQUIRED: true,
      CATALOG_IMPORT_EMPTY: true,
      CATALOG_IMPORT_DUPLICATE_ROW_: true,
      INVENTORY_KARDEX_SCHEMA_MISMATCH: true,
      INVENTORY_VALUATION_SCHEMA_MISMATCH: true,
      INVENTORY_VALUATION_POLICY_AMBIGUOUS: true,
      INVENTORY_VALUATION_METHOD_INVALID: true,
      INVENTORY_VALUATION_POLICY_FIELDS_INVALID: true,
      INVENTORY_VALUATION_METHOD_CHANGE_REQUIRES_MIGRATION: true,
      INVENTORY_VALUATION_MOVEMENT_AMBIGUOUS: true,
      INVENTORY_VALUATION_STOCK_MISMATCH: true,
      INVENTORY_ITEM_COST_REQUIRED: true,
      INVENTORY_VALUATION_LAYERS_INSUFFICIENT: true,
      INVENTORY_TRANSFER_VALUATION_INVALID: true,
      INVENTORY_TRANSFER_VALUATION_QUANTITY_MISMATCH: true,
      INVENTORY_VALUATION_MOVEMENT_TYPE_UNSUPPORTED: true,
      INVENTORY_VALUATION_MOVEMENT_MISSING: true,
      INVENTORY_RETURN_VALUATION_LAYERS_INSUFFICIENT: true,
      INVENTORY_VALUATION_CUTOFF_INVALID: true,
      CATALOG_UNIT_INCOMPATIBLE_WITH_ITEM: true,
      INVENTORY_BASE_QUANTITY_INVALID: true,
      INSUFFICIENT_LOCAL_STOCK: true,
      INVENTORY_MOVEMENT_TYPE_UNSUPPORTED: true,
      INVENTORY_VALUATION_MOVEMENT_ATOMIC_FAILURE: true,
      INVENTORY_TRANSFER_ATOMIC_FAILURE: true,
      MATERIAL_REQUISITION_ITEMS_INVALID: true,
      MATERIAL_REQUISITION_ITEMS_REQUIRED: true,
      MATERIAL_REQUISITION_QUANTITY_INVALID: true,
      INVENTORY_RECOGNITION_MODE_INVALID: true,
      MATERIAL_REQUISITION_SCHEMA_CONFLICT: true,
      MATERIAL_REQUISITION_DUPLICATE_ITEM: true,
      MATERIAL_RESERVATION_STATE_CONFLICT: true,
      INSUFFICIENT_AVAILABLE_STOCK: true,
      MATERIAL_REQUISITION_ACTION_INVALID: true,
      MATERIAL_REQUISITION_STATUS_INVALID: true,
      MATERIAL_REQUISITION_STATUS_TERMINAL: true,
      INVENTORY_REPLENISHMENT_POLICY_INVALID: true,
      INVENTORY_LEDGER_SCHEMA_MISMATCH: true,
      INVENTORY_ACCOUNT_NOT_CONFIGURED: true,
      INVENTORY_JOURNAL_ID_AMBIGUOUS: true,
      INVENTORY_LEDGER_ID_AMBIGUOUS: true,
      INVENTORY_LEDGER_JOURNAL_MISSING_OR_MISMATCHED: true,
      INVENTORY_JOURNAL_IDEMPOTENCY_CONFLICT: true,
      MATERIAL_REQUISITION_NOT_APPROVED: true,
      MATERIAL_RESERVATION_MISMATCH: true,
      INVENTORY_COST_CENTER_OR_MODE_REQUIRED: true,
      MATERIAL_REQUISITION_ITEM_INVALID: true,
      INVENTORY_CONSUMPTION_AMOUNT_INVALID: true,
      MATERIAL_RETURN_FIELDS_REQUIRED: true,
      MATERIAL_RETURN_REQUEST_NOT_DELIVERED: true,
      MATERIAL_RETURN_IDEMPOTENCY_CONFLICT: true,
      MATERIAL_RETURN_ITEM_INVALID: true,
      MATERIAL_RETURN_DUPLICATE_ITEM: true,
      MATERIAL_RETURN_EXCEEDS_AVAILABLE: true,
      MATERIAL_RETURN_COST_INVALID: true,
      ASSIGNED_CONSUMPTION_FIELDS_REQUIRED: true,
      ASSIGNED_CONSUMPTION_REQUEST_INVALID: true,
      ASSIGNED_CONSUMPTION_IDEMPOTENCY_CONFLICT: true,
      ASSIGNED_CONSUMPTION_ITEM_INVALID: true,
      ASSIGNED_CONSUMPTION_DUPLICATE_ITEM: true,
      ASSIGNED_CONSUMPTION_EXCEEDS_AVAILABLE: true,
      ASSIGNED_CONSUMPTION_COST_INVALID: true,
      MAINTENANCE_ORDER_ID_AMBIGUOUS: true,
      MAINTENANCE_PARTS_JSON_INVALID: true,
      MAINTENANCE_ORDER_ACCOUNTED_CANNOT_REOPEN: true,
      MAINTENANCE_MATERIAL_IDEMPOTENCY_CONFLICT: true,
      MAINTENANCE_PART_INVALID: true,
      MAINTENANCE_PART_DUPLICATE: true,
      MAINTENANCE_MOVEMENT_IDEMPOTENCY_CONFLICT: true,
      MAINTENANCE_PART_COST_INVALID: true,
      MONTHLY_CHARGE_SCHEMA_INVALID: true,
      MONTHLY_CHARGE_PERIOD_INVALID: true,
      TRANSPORT_ASSIGNMENT_SCHEMA_INVALID: true,
      TRANSPORT_ASSIGNMENT_SCHEMA_CONFLICT: true,
      TRANSPORT_TARIFF_SCHEMA_CONFLICT: true,
      TRANSPORT_BILLING_ROLE_NOT_ALLOWED: true,
      TRANSPORT_BILLING_MODE_INVALID: true,
      TRANSPORT_BILLING_YEAR_INVALID: true,
      TRANSPORT_BILLING_CONCEPT_AMBIGUOUS: true,
      TRANSPORT_BILLING_CONCEPT_INACTIVE: true,
      SERVICE_TARIFF_SCHEMA_CONFLICT: true,
      SERVICE_CONCEPT_AMBIGUOUS: true,
      SERVICE_CONCEPT_INACTIVE: true,
      SERVICE_TARIFF_PERIOD_INVALID: true,
      SERVICE_TARIFF_INPUT_INVALID: true,
      SERVICE_TARIFF_ROUTE_REQUIRED: true,
      SERVICE_TARIFF_START_DATE_INVALID: true,
      SERVICE_TARIFF_END_DATE_INVALID: true,
      SERVICE_TARIFF_DATE_RANGE_INVALID: true,
      SERVICE_TARIFF_CONCEPT_NOT_FOUND: true,
      SERVICE_TARIFF_AMBIGUOUS: true,
      TRANSPORT_TARIFF_AMBIGUOUS: true,
      TRANSPORT_TARIFF_AMOUNT_INVALID: true,
      TRANSPORT_TARIFF_DATE_INVALID: true,
      TRANSPORT_TARIFF_INPUT_INVALID: true,
      ROUTE_NOT_FOUND: true,
      TRANSPORT_CHARGE_DEDUPE_AMBIGUOUS: true,
      TRANSPORT_CHARGE_ADJUSTMENT_AMBIGUOUS: true,
      TRANSPORT_ASSIGNMENT_ID_REQUIRED: true,
      TRANSPORT_ASSIGNMENT_NOT_FOUND: true,
      TRANSPORT_ASSIGNMENT_NOT_ACTIVE: true,
      TRANSPORT_CANCELLATION_DATE_INVALID: true,
      TRANSPORT_CANCELLATION_BEFORE_START: true,
      TRANSPORT_SERVICE_START_INVALID: true,
      TRANSPORT_VEHICLE_SCHEMA_INVALID: true,
      ROUTE_OPTIMIZATION_ROLE_NOT_ALLOWED: true,
      ROUTE_OPTIMIZATION_TIME_INVALID: true,
      ROUTE_STOPS_JSON_INVALID: true,
      ROUTE_OPTIMIZATION_STOPS_REQUIRED: true,
      ROUTE_STOP_INVALID: true,
      ROUTE_STOP_COORDINATES_INVALID: true,
      ROUTE_STOP_ID_DUPLICATE: true,
      ROUTE_STOP_WINDOW_INVALID: true,
      ROUTE_STOP_DURATION_INVALID: true,
      ROUTE_OPTIMIZATION_MULTIPLE_DESTINATIONS: true,
      ROUTE_OPTIMIZATION_ORIGIN_DESTINATION_CONFLICT: true,
      ROUTE_OPTIMIZATION_TIME_WINDOW_CONFLICT: true,
      ROUTE_OPTIMIZATION_SCHEMA_CONFLICT: true,
      ROUTE_ID_REQUIRED: true,
      ROUTE_OPTIMIZATION_SPEED_INVALID: true,
      ROUTE_OPTIMIZATION_START_TIME_REQUIRED: true,
      ROUTE_OPTIMIZATION_PROPOSAL_ID_REQUIRED: true,
      ROUTE_OPTIMIZATION_PROPOSAL_NOT_PENDING: true,
      ROUTE_OPTIMIZATION_STALE_ROUTE: true,
      ROUTE_OPTIMIZATION_REJECTION_REASON_REQUIRED: true,
    };
    var safeCode = Object.prototype.hasOwnProperty.call(safeCodes, rawCode) ? rawCode : "INTERNAL_ERROR";
    return respond({ status: "error", code: safeCode,
      message: "No fue posible completar la solicitud." });
  }
}

// ---------------------------------------------------------------------------
// ENDPOINTS END


function ensureMigrationWriterSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); sheet.appendRow(headers); }
  var actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(String);
  if (JSON.stringify(actual) !== JSON.stringify(headers)) throw new Error("MIGRATION_SCHEMA_MISMATCH");
  return sheet;
}

function migrationSafeCell_(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value !== "string") throw new Error("MIGRATION_CELL_TYPE_INVALID");
  return /^[=+@-]/.test(value) ? "'" + value : value;
}

function migrationEncodeSnapshot_(value) {
  if (value instanceof Date) return { __migrationSnapshotType: "Date", value: value.toISOString() };
  if (Array.isArray(value)) return value.map(migrationEncodeSnapshot_);
  if (value && typeof value === "object") {
    var out = {};
    Object.keys(value).forEach(function(key) { out[key] = migrationEncodeSnapshot_(value[key]); });
    return out;
  }
  return value;
}

function migrationDecodeSnapshot_(value) {
  if (Array.isArray(value)) return value.map(migrationDecodeSnapshot_);
  if (value && typeof value === "object") {
    if (value.__migrationSnapshotType === "Date") return new Date(value.value);
    var out = {};
    Object.keys(value).forEach(function(key) { out[key] = migrationDecodeSnapshot_(value[key]); });
    return out;
  }
  return value;
}

function migrationNormalizeImportDate_(field, value) {
  var dateFields = {
    FechaInicio: true, FechaIngreso: true, FechaSalida: true, FechaNacimiento: true,
    FechaCreacion: true, FechaActualizacion: true, UltimaModificacion: true, FechaCarga: true
  };
  if (!dateFields[String(field || "")] || value === "" || value === null || value === undefined) return value;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) throw new Error("MIGRATION_DATE_INVALID");
    return value;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(value)) {
    throw new Error("MIGRATION_DATE_INVALID");
  }
  var date = new Date(value);
  if (isNaN(date.getTime())) throw new Error("MIGRATION_DATE_INVALID");
  return date;
}

function applyTrustedAccountingMigrationWrite_(payload) {
  var input = payload || {};
  var type = String(input.tipoEntidad || "").trim().toLowerCase();
  var id = String(input.idNuevoPlataforma || "").trim();
  var key = String(input.idempotencyKey || "").trim();
  var schema = MIGRATION_WRITER_SCHEMAS_[type];
  var data = input.datos;
  if (!schema || !id || !key || !data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("MIGRATION_WRITE_CONTRACT_INVALID");
  }
  var actor = getVerifiedAccountingIdentity_({ sessionToken: input.sessionToken });
  if (!actor || actor.authorized !== true || String(input.institutionId || "") !== actor.institutionId) {
    throw new Error("AUTH_PERMISSION_DENIED");
  }
  if (!accountingHasInstitutionalImportPermission_({
    roleId: actor.role, userId: actor.userId, sessionToken: input.sessionToken
  })) throw new Error("IMPORT_PERMISSION_DENIED");

  var allowed = schema.headers.slice(1);
  Object.keys(data).forEach(function(field) {
    if (allowed.indexOf(field) === -1) throw new Error("MIGRATION_FIELD_NOT_ALLOWED");
    if (data[field] && typeof data[field] === "object" && !(data[field] instanceof Date)) {
      throw new Error("MIGRATION_CELL_TYPE_INVALID");
    }
  });
  var canonical = {}, normalizedData = {};
  Object.keys(data).sort().forEach(function(field) {
    var normalizedValue = migrationNormalizeImportDate_(field, data[field]);
    normalizedData[field] = normalizedValue;
    canonical[field] = normalizedValue instanceof Date ? normalizedValue.toISOString() : normalizedValue;
  });
  var json = migrationStableJson_({ tipoEntidad: type, idNuevoPlataforma: id, datos: canonical });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var target = ensureMigrationWriterSheet_(ss, schema.sheet, schema.headers);
    var journal = ensureMigrationWriterSheet_(ss, MIGRATION_WRITER_JOURNAL_SHEET_, MIGRATION_WRITER_JOURNAL_HEADERS_);
    var journalRows = journal.getDataRange().getValues();
    for (var j = 1; j < journalRows.length; j++) {
      if (String(journalRows[j][0]) !== key) continue;
      if (String(journalRows[j][3]) !== json) throw new Error("MIGRATION_IDEMPOTENCY_CONFLICT");
      if (String(journalRows[j][4]) === "APPLIED") {
        return { status: "success", idempotent: true, idNuevoPlataforma: id, accion: journalRows[j][5] };
      }
      if (String(journalRows[j][4]) === "COMPENSATED") throw new Error("MIGRATION_WRITE_ALREADY_COMPENSATED");
    }
    var rows = target.getDataRange().getValues();
    var rowNumber = -1;
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0] || "").trim() === id) { rowNumber = r + 1; break; }
    }
    if (input.targetSnapshotVerified !== true) throw new Error("IMPORT_TARGET_SNAPSHOT_UNVERIFIED");
    var targetPresentNow = rowNumber > 0;
    if (targetPresentNow !== (input.expectedTargetPresent === true)) {
      throw new Error("IMPORT_TARGET_CHANGED_AFTER_PREVIEW");
    }
    if (targetPresentNow) {
      var currentTargetObject = {};
      schema.headers.forEach(function(header, index) { currentTargetObject[header] = rows[rowNumber - 1][index]; });
      var currentTargetHash = migrationHash_(migrationStableJson_(currentTargetObject));
      if (!input.expectedTargetRowHash || currentTargetHash !== String(input.expectedTargetRowHash)) {
        throw new Error("IMPORT_TARGET_CHANGED_AFTER_PREVIEW");
      }
    }
    var before = rowNumber > 0 ? rows[rowNumber - 1].slice() : null;
    var after = before ? before.slice() : schema.headers.map(function() { return ""; });
    after[0] = migrationSafeCell_(id);
    Object.keys(canonical).forEach(function(field) {
      after[schema.headers.indexOf(field)] = migrationSafeCell_(normalizedData[field]);
    });
    if (rowNumber > 0) target.getRange(rowNumber, 1, 1, schema.headers.length).setValues([after]);
    else target.appendRow(after);
    var operation = rowNumber > 0 ? "UPDATE" : "INSERT";
    try {
      journal.appendRow([key, type, id, json, "APPLIED", operation,
        JSON.stringify(migrationEncodeSnapshot_(before)), JSON.stringify(migrationEncodeSnapshot_(after)),
        new Date(), String(input.correlationId || "")]);
    } catch (writeError) {
      try {
        if (operation === "INSERT") {
          var currentRows = target.getDataRange().getValues();
          var inserted = currentRows.findIndex(function(row, index) { return index > 0 && String(row[0] || "").trim() === id; });
          if (inserted > 0) target.deleteRow(inserted + 1);
        } else {
          target.getRange(rowNumber, 1, 1, schema.headers.length).setValues([before]);
        }
      } catch (rollbackError) {
        throw new Error("MIGRATION_COMPENSATION_REQUIRED");
      }
      throw writeError;
    }
    return { status: "success", idempotent: false, idNuevoPlataforma: id, accion: operation };
  } finally {
    lock.releaseLock();
  }
}

function compensateTrustedAccountingMigrationWrite_(payload) {
  var input = payload || {};
  var key = String(input.idempotencyKey || "").trim();
  if (!key) throw new Error("MIGRATION_IDEMPOTENCY_KEY_REQUIRED");
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var journal = ensureMigrationWriterSheet_(ss, MIGRATION_WRITER_JOURNAL_SHEET_, MIGRATION_WRITER_JOURNAL_HEADERS_);
    var entries = journal.getDataRange().getValues();
    var journalRow = -1;
    for (var i = 1; i < entries.length; i++) if (String(entries[i][0]) === key) { journalRow = i + 1; break; }
    if (journalRow < 0) throw new Error("MIGRATION_JOURNAL_NOT_FOUND");
    var entry = entries[journalRow - 1];
    if (String(entry[4]) === "COMPENSATED") return { status: "success", compensated: true, idempotent: true };
    if (String(entry[4]) !== "APPLIED") throw new Error("MIGRATION_JOURNAL_STATE_INVALID");
    var schema = MIGRATION_WRITER_SCHEMAS_[String(entry[1])];
    if (!schema) throw new Error("MIGRATION_ENTITY_NOT_OWNED");
    var target = ensureMigrationWriterSheet_(ss, schema.sheet, schema.headers);
    var rows = target.getDataRange().getValues();
    var rowNumber = -1;
    for (var r = 1; r < rows.length; r++) if (String(rows[r][0] || "").trim() === String(entry[2])) { rowNumber = r + 1; break; }
    var expected = migrationDecodeSnapshot_(JSON.parse(String(entry[7])));
    if (rowNumber < 0 || migrationStableJson_(rows[rowNumber - 1]) !== migrationStableJson_(expected)) {
      throw new Error("MIGRATION_COMPENSATION_CONFLICT");
    }
    var before = entry[6] ? migrationDecodeSnapshot_(JSON.parse(String(entry[6]))) : null;
    if (String(entry[5]) === "INSERT") target.deleteRow(rowNumber);
    else if (before) target.getRange(rowNumber, 1, 1, schema.headers.length).setValues([before]);
    else throw new Error("MIGRATION_COMPENSATION_SNAPSHOT_MISSING");
    journal.getRange(journalRow, 5).setValue("COMPENSATED");
    return { status: "success", compensated: true, idempotent: false };
  } finally {
    lock.releaseLock();
  }
}


function validateOpenXmlPackageStructure_(rawBytes, format, entries, maxExpandedBytes) {
  const kind = String(format || "").toLowerCase();
  if (kind !== "docx" && kind !== "xlsx") return null;
  if (typeof Utilities === "undefined" || typeof Utilities.unzip !== "function" ||
      typeof Utilities.newBlob !== "function" || typeof XmlService === "undefined" ||
      typeof XmlService.parse !== "function") {
    return { verified: false, reason: "OPENXML_XML_VALIDATION_UNAVAILABLE" };
  }
  const expandedLimit = Number(maxExpandedBytes) > 0 ? Number(maxExpandedBytes) : 50 * 1024 * 1024;
  let blobs;
  try {
    blobs = Utilities.unzip(Utilities.newBlob(rawBytes));
  } catch (error) {
    throw new Error("OPENXML_DECOMPRESSION_FAILED: El paquete no pudo descomprimirse; puede estar cifrado o dañado.");
  }
  if (!Array.isArray(blobs) || !blobs.length) throw new Error("OPENXML_DECOMPRESSION_EMPTY: El paquete no contiene entradas legibles.");

  const byName = Object.create(null);
  let expandedBytes = 0;
  blobs.forEach(function(blob) {
    const name = String(blob && blob.getName ? blob.getName() : "");
    if (!name) throw new Error("OPENXML_ENTRY_NAME_INVALID");
    if (name.charAt(name.length - 1) === "/" && !entries[name]) return;
    if (!entries[name]) throw new Error("OPENXML_ENTRY_NOT_DECLARED: " + name);
    if (Object.prototype.hasOwnProperty.call(byName, name)) throw new Error("OPENXML_DUPLICATE_ENTRY: " + name);
    const bytes = blob.getBytes ? blob.getBytes() : [];
    const length = bytes && bytes.length ? bytes.length : 0;
    expandedBytes += length;
    if (expandedBytes > expandedLimit) throw new Error("OPENXML_EXPANDED_SIZE_EXCEEDED");
    if (length !== Number(entries[name].size)) throw new Error("OPENXML_ENTRY_SIZE_MISMATCH: " + name);
    byName[name] = blob;
  });
  Object.keys(entries).forEach(function(name) {
    if (name.charAt(name.length - 1) !== "/" && !Object.prototype.hasOwnProperty.call(byName, name)) {
      throw new Error("OPENXML_DECOMPRESSION_INCOMPLETE: " + name);
    }
  });

  function parsePart(name, expectedRoot) {
    const blob = byName[name];
    if (!blob) throw new Error("OPENXML_REQUIRED_PART_MISSING: " + name);
    const xml = String(blob.getDataAsString ? blob.getDataAsString("UTF-8") : "");
    if (!xml.trim()) throw new Error("OPENXML_XML_EMPTY: " + name);
    let document;
    try { document = XmlService.parse(xml); }
    catch (_) { throw new Error("OPENXML_XML_INVALID: " + name); }
    const root = document && document.getRootElement ? document.getRootElement() : null;
    if (!root || String(root.getName()).toLowerCase() !== String(expectedRoot).toLowerCase()) {
      throw new Error("OPENXML_XML_ROOT_INVALID: " + name);
    }
    return root;
  }
  function countElements(element, targetName) {
    if (!element) return 0;
    let count = String(element.getName()).toLowerCase() === String(targetName).toLowerCase() ? 1 : 0;
    const children = element.getChildren ? element.getChildren() : [];
    (children || []).forEach(function(child) { count += countElements(child, targetName); });
    return count;
  }

  function rejectExternalRelationships(root) {
    const pending = [root];
    while (pending.length) {
      const node = pending.pop();
      if (node && node.getAttribute) {
        const targetMode = node.getAttribute("TargetMode");
        if (targetMode && String(targetMode.getValue() || "").trim().toLowerCase() === "external") throw new Error("OPENXML_EXTERNAL_RELATIONSHIP_NOT_ALLOWED");
        const relationshipType = node.getAttribute("Type");
        if (relationshipType && /(?:oleObject|package|vbaProject|activeX|externalLink)/i.test(String(relationshipType.getValue() || ""))) throw new Error("OPENXML_ACTIVE_RELATIONSHIP_NOT_ALLOWED");
      }
      const children = node && node.getChildren ? node.getChildren() : [];
      (children || []).forEach(function(child) { pending.push(child); });
    }
  }

  parsePart("[Content_Types].xml", "Types");
  Object.keys(byName).filter(function(name) { return String(name).toLowerCase().indexOf("_rels/") !== -1 && String(name).toLowerCase().endsWith(".rels"); })
    .forEach(function(name) { rejectExternalRelationships(parsePart(name, "Relationships")); });
  if (kind === "docx") {
    const documentRoot = parsePart("word/document.xml", "document");
    const relationships = byName["word/_rels/document.xml.rels"] ? parsePart("word/_rels/document.xml.rels", "Relationships") : null;
    return {
      verified: true, format: "docx", entryCount: Object.keys(byName).length, expandedBytes: expandedBytes,
      paragraphs: countElements(documentRoot, "p"),
      tables: countElements(documentRoot, "tbl"),
      contentControls: countElements(documentRoot, "sdt"),
      formFields: countElements(documentRoot, "ffData") + countElements(documentRoot, "fldChar"),
      relationshipsVerified: !!relationships
    };
  }

  const workbookRoot = parsePart("xl/workbook.xml", "workbook");
  const sheetCount = countElements(workbookRoot, "sheet");
  const worksheetNames = Object.keys(byName).filter(function(name) { return /^xl\/worksheets\/sheet\d+\.xml$/i.test(name); });
  if (!sheetCount || !worksheetNames.length) throw new Error("XLSX_STRUCTURE_INVALID: No hay hojas de cálculo legibles.");
  worksheetNames.forEach(function(name) { parsePart(name, "worksheet"); });
  if (byName["xl/sharedStrings.xml"]) parsePart("xl/sharedStrings.xml", "sst");
  return {
    verified: true, format: "xlsx", entryCount: Object.keys(byName).length, expandedBytes: expandedBytes,
    sheetCount: sheetCount, worksheetCount: worksheetNames.length
  };
}

function validateFileBinaryIntegrity(fileData, fileName, options) {
  const opts = options || {};
  const maxSizeBytes = Number(opts.maxSizeBytes) > 0 ? Number(opts.maxSizeBytes) : 10 * 1024 * 1024;
  const allowedExtensions = opts.allowedExtensions || null;
  if (typeof fileData !== "string" || !fileData.trim()) throw new Error("FILE_MISSING: Datos de archivo ausentes.");
  if (typeof fileName !== "string" || !fileName.trim()) throw new Error("FILE_INVALID_NAME: Nombre de archivo inválido o ausente.");
  const normalizedName = fileName.trim();
  if (/[\/\\\u0000-\u001F]/.test(normalizedName)) throw new Error("FILE_INVALID_NAME: No se permiten rutas ni caracteres de control.");
  const lowerName = normalizedName.toLowerCase();
  const dangerousExtensions = [".exe",".bat",".cmd",".sh",".msi",".dll",".com",".scr",".vbs",".js",".jar",".ps1",".apk"];
  const nameParts = lowerName.split(".");
  const hasExecutableDoubleExtension = nameParts.slice(1, -1).some(part => dangerousExtensions.indexOf("." + part) !== -1);
  if (dangerousExtensions.some(ext => lowerName.endsWith(ext)) || hasExecutableDoubleExtension) throw new Error("DANGEROUS_FILE_EXTENSION: Extensión prohibida o doble extensión ejecutable.");
  const dot = lowerName.lastIndexOf(".");
  const extension = dot >= 0 ? lowerName.slice(dot) : "";
  const policies = {
    ".pdf": { format: "pdf", mime: "application/pdf" },
    ".jpg": { format: "jpeg", mime: "image/jpeg" },
    ".jpeg": { format: "jpeg", mime: "image/jpeg" },
    ".png": { format: "png", mime: "image/png" },
    ".webp": { format: "webp", mime: "image/webp" },
    ".docx": { format: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    ".xlsx": { format: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  };
  const policy = policies[extension];
  if (!policy) throw new Error("UNSUPPORTED_FILE_FORMAT: Extensión no admitida.");
  if (Array.isArray(allowedExtensions) && allowedExtensions.length > 0 &&
      !allowedExtensions.some(value => String(value || "").trim().toLowerCase() === extension)) {
    throw new Error("INVALID_FILE_EXTENSION: Extensión no permitida.");
  }
  let base64Content = fileData.trim();
  let declaredMime = "";
  if (base64Content.indexOf(",") !== -1) {
    const comma = base64Content.indexOf(",");
    const header = base64Content.slice(0, comma);
    if (!/^data:[^;,\s]+(?:;[^,]*)?;base64$/i.test(header)) throw new Error("FILE_DATA_URI_INVALID: URI Base64 inválida.");
    declaredMime = header.slice(5).split(";")[0].toLowerCase();
    base64Content = base64Content.slice(comma + 1);
  }
  base64Content = base64Content.replace(/\s/g, "");
  if (!base64Content) throw new Error("EMPTY_FILE_REJECTED: El archivo está vacío (0 bytes).");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Content) || base64Content.length % 4 === 1) {
    throw new Error("FILE_BASE64_INVALID: Contenido Base64 inválido.");
  }
  const unpadded = base64Content.replace(/=+$/, "");
  if (unpadded.length % 4 === 1 || (base64Content.indexOf("=") >= 0 && base64Content.length % 4 !== 0)) {
    throw new Error("FILE_BASE64_INVALID: Padding Base64 inválido.");
  }
  base64Content = unpadded + (base64Content.indexOf("=") >= 0 ? "=".repeat(base64Content.length - unpadded.length) : "=".repeat((4 - unpadded.length % 4) % 4));
  if (declaredMime && declaredMime !== "application/octet-stream" && declaredMime !== policy.mime) {
    throw new Error("FILE_MIME_MISMATCH: El MIME declarado no coincide con la extensión.");
  }
  let rawBytes;
  try {
    if (typeof Utilities !== "undefined" && Utilities.base64Decode) rawBytes = Utilities.base64Decode(base64Content);
    else if (typeof Buffer !== "undefined") rawBytes = Buffer.from(base64Content, "base64");
    else throw new Error("UNSUPPORTED_RUNTIME");
  } catch (_) { throw new Error("FILE_BASE64_INVALID: No fue posible decodificar el archivo."); }
  const byteLength = rawBytes && rawBytes.length ? rawBytes.length : 0;
  if (!byteLength) throw new Error("EMPTY_FILE_REJECTED: El archivo está vacío (0 bytes).");
  if (byteLength > maxSizeBytes) throw new Error("FILE_SIZE_EXCEEDED: El archivo supera el tamaño máximo permitido.");
  const byteAt = index => Number(rawBytes[index]) & 0xFF;
  const ascii = (offset,length) => { let value=""; for(let i=offset;i<Math.min(byteLength,offset+length);i++) value+=String.fromCharCode(byteAt(i)); return value; };
  const u16 = offset => offset<0||offset+2>byteLength ? -1 : byteAt(offset)|(byteAt(offset+1)<<8);
  const u32 = offset => offset<0||offset+4>byteLength ? -1 : (byteAt(offset)|(byteAt(offset+1)<<8)|(byteAt(offset+2)<<16)|(byteAt(offset+3)<<24))>>>0;
  const be32 = offset => offset<0||offset+4>byteLength ? -1 : (byteAt(offset)*0x1000000)+(byteAt(offset+1)*0x10000)+(byteAt(offset+2)*0x100)+byteAt(offset+3);
  let openXmlStructure = null;
  if (policy.format === "pdf") {
    const pdfContent = ascii(0, byteLength);
    const activePdfTokens = ["/JavaScript","/JS","/Launch","/OpenAction","/AA","/EmbeddedFile","/RichMedia","/SubmitForm","/ImportData","/GoToR","/XFA"];
    if (activePdfTokens.some(token => pdfContent.indexOf(token) !== -1)) throw new Error("PDF_ACTIVE_CONTENT_NOT_ALLOWED: Acciones ejecutables o contenido activo no permitido.");
    const head=ascii(0,Math.min(16,byteLength)),tail=ascii(Math.max(0,byteLength-2048),Math.min(2048,byteLength));
    if(!/^%PDF-[12]\.\d/.test(head)||tail.indexOf("%%EOF")<0)throw new Error("PDF_STRUCTURE_INVALID: Cabecera o EOF ausente.");
    const startXref=tail.lastIndexOf("startxref"),match=startXref>=0?tail.slice(startXref+9).match(/^\s*(\d+)/):null;
    if(!match||Number(match[1])<=0||Number(match[1])>=byteLength)throw new Error("PDF_STRUCTURE_INVALID: startxref inválido.");
  } else if (policy.format === "jpeg") {
    if(byteLength<4||byteAt(0)!==255||byteAt(1)!==216||byteAt(2)!==255||byteAt(byteLength-2)!==255||byteAt(byteLength-1)!==217)throw new Error("JPEG_STRUCTURE_INVALID: SOI/EOI ausente o truncado.");
  } else if (policy.format === "png") {
    const sig=[137,80,78,71,13,10,26,10],valid=byteLength>=45&&sig.every((v,i)=>byteAt(i)===v);
    const ihdr=valid&&be32(8)===13&&ascii(12,4)==="IHDR";
    const iend=valid&&be32(byteLength-12)===0&&ascii(byteLength-8,4)==="IEND"&&byteAt(byteLength-4)===174&&byteAt(byteLength-3)===66&&byteAt(byteLength-2)===96&&byteAt(byteLength-1)===130;
    if(!ihdr||!iend||ascii(8,byteLength-8).indexOf("IDAT")<0)throw new Error("PNG_STRUCTURE_INVALID: IHDR/IDAT/IEND ausente o truncado.");
  } else if (policy.format === "webp") {
    if(byteLength<20||ascii(0,4)!=="RIFF"||ascii(8,4)!=="WEBP"||u32(4)!==byteLength-8)throw new Error("WEBP_STRUCTURE_INVALID: RIFF/WEBP inválido.");
    let offset=12,found=false;
    while(offset+8<=byteLength){const type=ascii(offset,4),size=u32(offset+4);if(size<1||offset+8+size+(size%2)>byteLength)throw new Error("WEBP_STRUCTURE_INVALID: Chunk truncado.");if(type==="VP8 "||type==="VP8L"||type==="VP8X")found=true;offset+=8+size+(size%2);}
    if(!found||offset!==byteLength)throw new Error("WEBP_STRUCTURE_INVALID: Chunk de imagen ausente.");
  } else if (policy.format === "docx" || policy.format === "xlsx") {
    let eocd=-1;for(let i=byteLength-22;i>=Math.max(0,byteLength-65557);i--){if(u32(i)===0x06054B50){eocd=i;break;}}
    if(eocd<0)throw new Error("OPENXML_ZIP_INVALID: EOCD ausente.");
    const disk=u16(eocd+4),centralDisk=u16(eocd+6),onDisk=u16(eocd+8),total=u16(eocd+10),centralSize=u32(eocd+12),centralOffset=u32(eocd+16),comment=u16(eocd+20);
    const maxArchiveEntries=Number(opts.maxArchiveEntries)>0?Number(opts.maxArchiveEntries):512;
    const maxExpandedBytes=Number(opts.maxExpandedSizeBytes)>0?Number(opts.maxExpandedSizeBytes):50*1024*1024;
    const maxCompressionRatio=Number(opts.maxCompressionRatio)>0?Number(opts.maxCompressionRatio):200;
    if(disk!==0||centralDisk!==0||onDisk!==total||total<1||total===0xFFFF||centralSize===0xFFFFFFFF||centralOffset===0xFFFFFFFF||
       total>maxArchiveEntries||centralSize>4*1024*1024||eocd+22+comment!==byteLength||centralOffset+centralSize>eocd)throw new Error("OPENXML_ZIP_INVALID: Directorio central inconsistente o excede límites.");
    const entries=Object.create(null),normalizedNames=Object.create(null);let cursor=centralOffset,totalExpandedBytes=0;
    for(let n=0;n<total;n++){
      if(cursor+46>eocd||u32(cursor)!==0x02014B50)throw new Error("OPENXML_ZIP_INVALID: Entrada central inválida.");
      const flags=u16(cursor+8),method=u16(cursor+10),crc=u32(cursor+16),compressed=u32(cursor+20),uncompressed=u32(cursor+24),nameLen=u16(cursor+28),extraLen=u16(cursor+30),commentLen=u16(cursor+32),local=u32(cursor+42),end=cursor+46+nameLen+extraLen+commentLen;
      if(end>centralOffset+centralSize||nameLen<1||compressed===0xFFFFFFFF||uncompressed===0xFFFFFFFF||local===0xFFFFFFFF||
         (flags&0x2041)!==0||(method!==0&&method!==8))throw new Error("OPENXML_ZIP_INVALID: Metadatos no permitidos o archivo cifrado.");
      const name=ascii(cursor+46,nameLen),parts=name.split("/");
      if(!name||name.charAt(0)==="/"||/^[A-Za-z]:/.test(name)||/[\u0000-\u001F]/.test(name)||name.indexOf("\\")>=0||
         parts.some(function(part,index){return part===".."||part==="."||(!part&&index!==parts.length-1);}))throw new Error("OPENXML_ZIP_INVALID: Ruta interna inválida.");
      const lowerName=name.toLowerCase();
      if(Object.prototype.hasOwnProperty.call(normalizedNames,lowerName))throw new Error("OPENXML_ZIP_INVALID: Entrada duplicada.");
      normalizedNames[lowerName]=true;
      if((compressed===0&&uncompressed>0)||(compressed>0&&uncompressed/compressed>maxCompressionRatio))throw new Error("OPENXML_ZIP_COMPRESSION_RATIO_EXCEEDED");
      totalExpandedBytes+=uncompressed;
      if(totalExpandedBytes>maxExpandedBytes)throw new Error("OPENXML_EXPANDED_SIZE_EXCEEDED");
      if(local+30>centralOffset||u32(local)!==0x04034B50)throw new Error("OPENXML_ZIP_INVALID: Cabecera local ausente.");
      const localFlags=u16(local+6),localMethod=u16(local+8),localCrc=u32(local+14),localCompressed=u32(local+18),localUncompressed=u32(local+22);
      const localNameLen=u16(local+26),localExtraLen=u16(local+28),localName=ascii(local+30,localNameLen),dataOffset=local+30+localNameLen+localExtraLen;
      if(localName!==name||localFlags!==flags||localMethod!==method||dataOffset+compressed>centralOffset)throw new Error("OPENXML_ZIP_INVALID: Entrada local inconsistente.");
      const hasDescriptor=(flags&8)!==0;
      if((!hasDescriptor&&(localCrc!==crc||localCompressed!==compressed||localUncompressed!==uncompressed))||
         (hasDescriptor&&((localCrc&&localCrc!==crc)||(localCompressed&&localCompressed!==compressed)||(localUncompressed&&localUncompressed!==uncompressed))))throw new Error("OPENXML_ZIP_INVALID: CRC o tamaños locales inconsistentes.");
      entries[name]={size:uncompressed,compressedSize:compressed,method:method,crc:crc,flags:flags};cursor=end;
    }
    if(cursor!==centralOffset+centralSize||!entries["[Content_Types].xml"]||entries["[Content_Types].xml"].size<1)throw new Error("OPENXML_STRUCTURE_INVALID: [Content_Types].xml ausente.");
    if(policy.format==="docx"&&(!entries["word/document.xml"]||entries["word/document.xml"].size<1))throw new Error("DOCX_STRUCTURE_INVALID: word/document.xml ausente.");
    if(policy.format==="xlsx"&&(!entries["xl/workbook.xml"]||entries["xl/workbook.xml"].size<1))throw new Error("XLSX_STRUCTURE_INVALID: xl/workbook.xml ausente.");
    const activeContentEntry = Object.keys(entries).find(function(name) {
      const lowerEntry = String(name).toLowerCase();
      return lowerEntry.indexOf("vbaproject.bin") !== -1 || lowerEntry.indexOf("/activex/") !== -1 ||
        lowerEntry.indexOf("/embeddings/") !== -1 || lowerEntry.indexOf("/macrosheets/") !== -1 ||
        lowerEntry.indexOf("/externallinks/") !== -1 || lowerEntry.endsWith("/connections.xml") ||
        lowerEntry.indexOf("/customui/") !== -1;
    });
    if (activeContentEntry) throw new Error("OPENXML_ACTIVE_CONTENT_NOT_ALLOWED: Macros, ActiveX, objetos embebidos o vínculos externos no permitidos.");
    openXmlStructure=validateOpenXmlPackageStructure_(rawBytes,policy.format,entries,maxExpandedBytes);
  }
  return {valid:true,fileName:normalizedName,detectedFormat:policy.format,byteLength:byteLength,mimeType:policy.mime,openXmlStructure:openXmlStructure};
}
function validateImportWorkbookBinary_(payload) {
  var input = payload || {};
  var fileName = String(input.nombreArchivo || "").trim();
  var mimeType = String(input.mimeTypeArchivo || "").trim().toLowerCase();
  var encoded = String(input.fileDataBase64 || "");
  if (!/\.xlsx$/i.test(fileName) || !encoded || encoded.length > 14000000) {
    return { valid: false, code: "IMPORT_FILE_INVALID" };
  }
  if (mimeType && mimeType !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      mimeType !== "application/octet-stream") return { valid: false, code: "IMPORT_FILE_MIME_INVALID" };
  try {
    var validation = validateFileBinaryIntegrity(encoded, fileName, {
      maxSizeBytes: 10 * 1024 * 1024,
      maxExpandedSizeBytes: 40 * 1024 * 1024,
      maxArchiveEntries: 1000,
      allowedExtensions: [".xlsx"]
    });
    if (!validation || validation.valid !== true || !validation.openXmlStructure ||
        validation.openXmlStructure.verified !== true || validation.openXmlStructure.format !== "xlsx") {
      return { valid: false, code: "IMPORT_FILE_PACKAGE_INVALID" };
    }
    var bytes = Utilities.base64Decode(encoded);
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    var fileHash = digest.map(function(byte) { return ("0" + (byte & 255).toString(16)).slice(-2); }).join("");
    return { valid: true, fileHash: fileHash, sizeBytes: validation.byteLength,
      uncompressedBytes: validation.openXmlStructure.expandedBytes };
  } catch (error) {
    var code = String(error && error.message || "").split(":")[0].trim();
    if (code === "XLSX_MACROS_NOT_ALLOWED") return { valid: false, code: "IMPORT_FILE_MACROS_NOT_ALLOWED" };
    if (code === "FILE_BASE64_INVALID") return { valid: false, code: "IMPORT_FILE_BASE64_INVALID" };
    if (code === "FILE_SIZE_EXCEEDED") return { valid: false, code: "IMPORT_FILE_INVALID" };
    if (code === "OPENXML_EXPANDED_SIZE_EXCEEDED") return { valid: false, code: "IMPORT_FILE_UNCOMPRESSED_SIZE_LIMIT" };
    return { valid: false, code: "IMPORT_FILE_PACKAGE_INVALID" };
  }
}

// Restored payroll, loan, journal, and receipt workflows from the last verified implementation.
function configurePaymentConcept(payload) {
  const {
    conceptoId,
    nombreConcepto,
    montoBase,
    aplicaAGrado,
    periodoVigencia,
    estado,
    observaciones,
    tipoTributario = "Exento", // Exento, Gravado, No Sujeto
    tasaISV = 0,               // 0.15, 0.18, 0
    codigoTributario = "EDUC-01",
    fechaVigenciaTributaria = "",
    requiereValidacionFiscal = false
  } = payload || {};

  if (!nombreConcepto || montoBase === undefined) throw new Error("Nombre y monto base son requeridos.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "ConceptosCobro");
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  // Asegurar cabeceras de columnas tributarias si la hoja tiene esquema antiguo
  if (data.length > 0 && data[0].length < 13) {
    sheet.getRange(1, 9, 1, 5).setValues([["TipoTributario", "TasaISV", "CodigoTributario", "FechaVigenciaTributaria", "RequiereValidacionFiscal"]]);
  }

  let cId = conceptoId;
  let existingIndex = -1;
  if (cId) {
    existingIndex = data.findIndex(r => String(r[0]).trim() === String(cId).trim());
  } else {
    existingIndex = data.findIndex(r => String(r[2]).toLowerCase().trim() === String(nombreConcepto).toLowerCase().trim() && String(r[4]).trim() === String(aplicaAGrado || "Todos").trim());
  }

  const rowValues = [
    cId || ("CPT-" + now.getTime()),
    now,
    nombreConcepto,
    parseFloat(montoBase || 0),
    aplicaAGrado || "Todos",
    periodoVigencia || "Anual",
    estado || "Activo",
    observaciones || "",
    tipoTributario,
    parseFloat(tasaISV || 0),
    codigoTributario,
    fechaVigenciaTributaria || now.toISOString().split("T")[0],
    requiereValidacionFiscal ? "TRUE" : "FALSE"
  ];

  if (existingIndex !== -1) {
    cId = data[existingIndex][0];
    rowValues[0] = cId;
    sheet.getRange(existingIndex + 1, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    cId = rowValues[0];
    sheet.appendRow(rowValues);
  }

  return {
    status: "success",
    conceptoId: cId,
    tipoTributario: tipoTributario,
    tasaISV: parseFloat(tasaISV || 0),
    codigoTributario: codigoTributario,
    message: "Concepto de cobro configurado correctamente con clasificación tributaria SAR."
  };
}

function ensurePayrollConceptSheet_(ss,name,headers) {
  const sheet=ss.getSheetByName(name)||getOrCreateSheet(ss,name);
  let values=sheet.getDataRange().getValues();
  if(!values.length||!values[0]||!values[0].length){sheet.getRange(1,1,1,headers.length).setValues([headers]);values=[headers];}
  if(values[0].length!==headers.length||headers.some((h,i)=>String(values[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))throw new Error("RESOURCE_SCHEMA_INVALID: "+name);
  return {sheet,headers,rows:values.slice(1)};
}

function normalizePayrollRole_(role) {
  return String(role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
}

function requirePayrollConceptManager_(payload) {
  const actor=getVerifiedAccountingIdentity_(payload||{});
  if(!actor.authorized)return {authorized:false,code:actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  if(!["RECURSOSHUMANOS","ADMINISTRADOR","CONTADOR","CONTABILIDAD"].includes(normalizePayrollRole_(actor.role)))return {authorized:false,code:"ROLE_NOT_ALLOWED"};
  return {authorized:true,actor};
}

function getPayrollConceptHeaders_() {
  return ["ConceptoID","Codigo","Nombre","Descripcion","Categoria","Naturaleza","TipoCalculo","Valor","BaseCalculo","Formula","Frecuencia","VigenciaInicio","VigenciaFin","TratamientoISR","TratamientoIHSS","CuentaContable","VisibleBoleta","Prioridad","Estado","Recurrente","Version","FechaCreacion","CreadoPor","FechaActualizacion","ActualizadoPor"];
}

function getPayrollAssignmentHeaders_() {
  return ["AsignacionID","CodigoConcepto","TipoAsignacion","ValorAsignacion","DepartamentoScope","ValorOverride","FechaInicio","FechaFin","Frecuencia","PeriodoUnico","Estado","Observaciones","CreadoPor","FechaCreacion"];
}

function getPayrollConceptHistoryHeaders_() {
  return ["HistorialID","ConceptoID","Codigo","Version","SnapshotJSON","Fecha","ActorId","Accion"];
}

function getPayrollConceptDetailHeaders_() {
  return ["DetalleID","PlanillaID","Periodo","EmpleadoId","Codigo","Nombre","Categoria","Naturaleza","TipoCalculo","Valor","Monto","CuentaContable","VisibleBoleta","TratamientoISR","TratamientoIHSS","Version","AsignacionID","Formula","BaseCalculo","Estado"];
}

function payrollConceptCategories_() {
  return ["INGRESOS_ORDINARIOS","HORAS_EXTRAS","BONIFICACIONES_FIJAS","BONIFICACIONES_VARIABLES","COMISIONES","INCENTIVOS","DEDUCCIONES_LEGALES","DEDUCCIONES_VOLUNTARIAS","APORTACIONES_PATRONALES","BENEFICIOS","AJUSTES_EXTRAORDINARIOS"];
}

function payrollConceptPhase_(category) {
  if(["INGRESOS_ORDINARIOS","HORAS_EXTRAS","BONIFICACIONES_FIJAS","BONIFICACIONES_VARIABLES","COMISIONES","INCENTIVOS","BENEFICIOS","AJUSTES_EXTRAORDINARIOS"].includes(String(category||"").toUpperCase()))return 1;
  if(["DEDUCCIONES_LEGALES","DEDUCCIONES_VOLUNTARIAS"].includes(String(category||"").toUpperCase()))return 2;
  if(String(category||"").toUpperCase()==="APORTACIONES_PATRONALES")return 3;
  return 0;
}

function tokenizePayrollFormula_(formula) {
  const source=String(formula||"").trim(),tokens=[],re=/\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/])\s*/y;
  if(!source)return [];
  let pos=0;
  while(pos<source.length){re.lastIndex=pos;const m=re.exec(source);if(!m)throw new Error("PAYROLL_FORMULA_SYNTAX_INVALID");tokens.push(m[1]);pos=re.lastIndex;}
  return tokens;
}

function evaluatePayrollFormula_(formula,variables) {
  const tokens=tokenizePayrollFormula_(formula);let i=0;
  if(!tokens.length)throw new Error("PAYROLL_FORMULA_REQUIRED");
  function factor(){
    const t=tokens[i++];
    if(t==="+")return factor();
    if(t==="-")return -factor();
    if(t==="("){const v=expression();if(tokens[i++]!==")")throw new Error("PAYROLL_FORMULA_SYNTAX_INVALID");return v;}
    if(t===undefined)throw new Error("PAYROLL_FORMULA_SYNTAX_INVALID");
    if(/^\d+(?:\.\d+)?$/.test(t))return Number(t);
    if(/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)){if(!Object.prototype.hasOwnProperty.call(variables,t))throw new Error("PAYROLL_FORMULA_REFERENCE_INVALID:"+t);const v=Number(variables[t]);if(!Number.isFinite(v))throw new Error("PAYROLL_FORMULA_VALUE_INVALID:"+t);return v;}
    throw new Error("PAYROLL_FORMULA_SYNTAX_INVALID");
  }
  function term(){let v=factor();while(tokens[i]==="*"||tokens[i]==="/"){const op=tokens[i++],right=factor();if(op==="/"&&right===0)throw new Error("PAYROLL_FORMULA_DIVISION_BY_ZERO");v=op==="*"?v*right:v/right;}return v;}
  function expression(){let v=term();while(tokens[i]==="+"||tokens[i]==="-"){const op=tokens[i++],right=term();v=op==="+"?v+right:v-right;}return v;}
  const result=expression();if(i!==tokens.length||!Number.isFinite(result))throw new Error("PAYROLL_FORMULA_SYNTAX_INVALID");return result;
}

function getPayrollConceptEngine_(ss) {
  const catalog=ensurePayrollConceptSheet_(ss,"CatalogoConceptosPlanilla",getPayrollConceptHeaders_());
  const assignments=ensurePayrollConceptSheet_(ss,"AsignacionesConceptosPlanilla",getPayrollAssignmentHeaders_());
  const active=catalog.rows.filter(r=>String(r[18]||"").trim().toUpperCase()==="ACTIVO").map(r=>({
    conceptoId:String(r[0]||"").trim(),codigo:String(r[1]||"").trim().toUpperCase(),nombre:String(r[2]||"").trim(),descripcion:String(r[3]||""),categoria:String(r[4]||"").toUpperCase(),naturaleza:String(r[5]||"").toUpperCase(),tipoCalculo:String(r[6]||"").toUpperCase(),valor:Number(r[7]||0),baseCalculo:String(r[8]||"").trim().toUpperCase(),formula:String(r[9]||"").trim(),frecuencia:String(r[10]||"MENSUAL").toUpperCase(),vigenciaInicio:r[11],vigenciaFin:r[12],tratamientoISR:String(r[13]||"EXENTO").toUpperCase(),tratamientoIHSS:String(r[14]||"NO_COTIZABLE").toUpperCase(),cuentaContable:String(r[15]||"").trim(),visibleBoleta:r[16]===true||String(r[16]).toUpperCase()==="TRUE",prioridad:Number(r[17]||0),estado:String(r[18]||""),recurrente:r[19]===true||String(r[19]).toUpperCase()==="TRUE",version:String(r[20]||"1")
  }));
  const byCode=Object.create(null);
  active.forEach(c=>{if(!/^[A-Z][A-Z0-9_]{1,39}$/.test(c.codigo)||byCode[c.codigo])throw new Error("PAYROLL_CONCEPT_CODE_DUPLICATE_OR_INVALID");if(!payrollConceptPhase_(c.categoria)||!["DEBE","HABER"].includes(c.naturaleza)||!["FIJO","PORCENTAJE","PROPORCIONAL","FORMULA"].includes(c.tipoCalculo)||!Number.isFinite(c.valor)||c.valor<0||!c.cuentaContable)throw new Error("PAYROLL_CONCEPT_CONFIGURATION_INVALID:"+c.codigo);const expectedNature=payrollConceptPhase_(c.categoria)===1?"DEBE":"HABER";if(c.naturaleza!==expectedNature)throw new Error("PAYROLL_CONCEPT_NATURE_MISMATCH:"+c.codigo);if(!["GRAVADO","EXENTO"].includes(c.tratamientoISR)||!["COTIZABLE","NO_COTIZABLE"].includes(c.tratamientoIHSS))throw new Error("PAYROLL_CONCEPT_TAX_TREATMENT_INVALID:"+c.codigo);byCode[c.codigo]=c;});
  const reserved=["BASE","SALARIO_BASE","DEVENGADO","HORAS_EXTRAS","BASE_COTIZABLE","BASE_ISR","DIAS_TRABAJADOS","DIAS_PERIODO","IHSS","RAP","ISR","SALARIO_NETO"];
  const allowedBases=reserved.filter(x=>x!=="BASE");
  active.forEach(c=>{
    if(!allowedBases.includes(c.baseCalculo)&&!/^CONCEPTO:[A-Z][A-Z0-9_]{1,39}$/.test(c.baseCalculo))throw new Error("PAYROLL_BASE_REFERENCE_INVALID:"+c.codigo);
    const refs=tokenizePayrollFormula_(c.formula).filter(t=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)&&!reserved.includes(t));
    if(c.tipoCalculo==="FORMULA"&&!c.formula)throw new Error("PAYROLL_FORMULA_REQUIRED:"+c.codigo);
    if(c.tipoCalculo==="FORMULA"){const vars={BASE:1,SALARIO_BASE:1,DEVENGADO:1,HORAS_EXTRAS:1,BASE_COTIZABLE:1,BASE_ISR:1,DIAS_TRABAJADOS:1,DIAS_PERIODO:1,IHSS:1,RAP:1,ISR:1,SALARIO_NETO:1};refs.forEach(ref=>{if(!byCode[ref])throw new Error("PAYROLL_FORMULA_REFERENCE_INVALID:"+c.codigo+":"+ref);if(payrollConceptPhase_(byCode[ref].categoria)>payrollConceptPhase_(c.categoria))throw new Error("PAYROLL_FORMULA_PHASE_INVALID:"+c.codigo+":"+ref);vars[ref]=1;});evaluatePayrollFormula_(c.formula,vars);}
    else refs.forEach(ref=>{if(!byCode[ref])throw new Error("PAYROLL_FORMULA_REFERENCE_INVALID:"+c.codigo+":"+ref);if(payrollConceptPhase_(byCode[ref].categoria)>payrollConceptPhase_(c.categoria))throw new Error("PAYROLL_FORMULA_PHASE_INVALID:"+c.codigo+":"+ref);});
    if(c.baseCalculo.startsWith("CONCEPTO:")){const ref=c.baseCalculo.slice(9);if(!byCode[ref])throw new Error("PAYROLL_BASE_REFERENCE_INVALID:"+c.codigo+":"+ref);if(payrollConceptPhase_(byCode[ref].categoria)>payrollConceptPhase_(c.categoria))throw new Error("PAYROLL_FORMULA_PHASE_INVALID:"+c.codigo+":"+ref);}
  });
  const state=Object.create(null),ordered=[];
  function visit(code){if(state[code]===1)throw new Error("PAYROLL_FORMULA_CYCLE:"+code);if(state[code]===2)return;state[code]=1;const c=byCode[code],refs=tokenizePayrollFormula_(c.formula).filter(t=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)&&!reserved.includes(t));if(c.baseCalculo.startsWith("CONCEPTO:"))refs.push(c.baseCalculo.slice(9));refs.forEach(visit);state[code]=2;ordered.push(c);}
  active.slice().sort((a,b)=>a.prioridad-b.prioridad||a.codigo.localeCompare(b.codigo)).forEach(c=>visit(c.codigo));
  const allCodes=Object.create(null);catalog.rows.forEach(r=>{const k=String(r[1]||"").trim().toUpperCase();if(k)allCodes[k]=true;});
  const assignmentRows=assignments.rows.filter(r=>String(r[10]||"").trim().toUpperCase()==="ACTIVO").map(r=>({asignacionId:String(r[0]||""),codigo:String(r[1]||"").trim().toUpperCase(),tipo:String(r[2]||"").toUpperCase(),valor:String(r[3]||"").trim(),departamentoScope:String(r[4]||"").trim(),valorOverride:r[5]===""||r[5]==null?null:Number(r[5]),fechaInicio:r[6],fechaFin:r[7],frecuencia:String(r[8]||"MENSUAL").toUpperCase(),periodoUnico:String(r[9]||"").trim(),estado:String(r[10]||"")}));
  assignmentRows.forEach(a=>{if(!allCodes[a.codigo]||!["GLOBAL","EMPLEADO","DEPARTAMENTO","CARGO","ESTRUCTURA_SALARIAL"].includes(a.tipo)||!a.valor)throw new Error("PAYROLL_CONCEPT_ASSIGNMENT_INVALID:"+a.asignacionId);});
  return {concepts:ordered,byCode,assignments:assignmentRows.filter(a=>!!byCode[a.codigo])};
}

function resolvePayrollConceptBase_(baseCode,context,values) {
  const key=String(baseCode||"SALARIO_BASE").trim().toUpperCase();
  if(key.startsWith("CONCEPTO:"))return Number(values[key.slice(9)]||0);
  const variables={SALARIO_BASE:context.salarioBase,DEVENGADO:context.devengado,HORAS_EXTRAS:context.horasExtras,BASE_COTIZABLE:context.baseCotizable,BASE_ISR:context.baseISR,DIAS_TRABAJADOS:context.diasTrabajados,DIAS_PERIODO:context.diasPeriodo,IHSS:context.ihss,RAP:context.rap,ISR:context.isr,SALARIO_NETO:context.salarioNeto};
  if(!Object.prototype.hasOwnProperty.call(variables,key))throw new Error("PAYROLL_BASE_REFERENCE_INVALID:"+key);
  const value=Number(variables[key]||0);if(!Number.isFinite(value))throw new Error("PAYROLL_BASE_VALUE_INVALID:"+key);return value;
}

function calculatePayrollConceptPhase_(engine,employee,employeeUserId,period,planillaId,context,phase,netAvailable) {
  const dept=String(employee[4]||"").trim(),position=String(employee[3]||"").trim(),structure=String(employee[5]||"").trim(),user=String(employeeUserId||employee[2]||"").trim(),periodKey=String(period||"").slice(0,7),now=new Date(periodKey+"-01T00:00:00");
  const activeAssignments=engine.assignments.filter(a=>{
    if(!engine.byCode[a.codigo]||payrollConceptPhase_(engine.byCode[a.codigo].categoria)!==phase)return false;
    const start=a.fechaInicio?new Date(a.fechaInicio):null,end=a.fechaFin?new Date(a.fechaFin):null;
    if(start&&!isNaN(start.getTime())&&start>now)return false;if(end&&!isNaN(end.getTime())&&end<now)return false;
    const concept=engine.byCode[a.codigo],cs=concept.vigenciaInicio?new Date(concept.vigenciaInicio):null,ce=concept.vigenciaFin?new Date(concept.vigenciaFin):null;
    if(cs&&!isNaN(cs.getTime())&&cs>now)return false;if(ce&&!isNaN(ce.getTime())&&ce<now)return false;
    const frequencies=[a.frecuencia||"MENSUAL",concept.frecuencia||"MENSUAL"];
    if(frequencies.some(f=>!["MENSUAL","POR_PERIODO","UNICA"].includes(f)))return false;
    if(frequencies.includes("UNICA")&&a.periodoUnico!==period)return false;
    if(!concept.recurrente&&a.periodoUnico!==period)return false;
    if(a.tipo==="GLOBAL")return true;
    if(a.tipo==="EMPLEADO")return a.valor===user;
    if(a.tipo==="DEPARTAMENTO")return a.valor===dept;
    if(a.tipo==="CARGO")return a.valor===position&&a.departamentoScope===dept;
    if(a.tipo==="ESTRUCTURA_SALARIAL")return a.valor===structure&&a.departamentoScope===dept;
    return false;
  });
  const byConcept=Object.create(null);
  activeAssignments.forEach(a=>{const rank={GLOBAL:1,ESTRUCTURA_SALARIAL:2,CARGO:3,DEPARTAMENTO:4,EMPLEADO:5}[a.tipo]||0;const old=byConcept[a.codigo];if(!old||rank>old.rank)byConcept[a.codigo]={assignment:a,rank};else if(rank===old.rank)throw new Error("PAYROLL_CONCEPT_ASSIGNMENT_DUPLICATE:"+a.codigo);});
  const values=context.conceptValues||Object.create(null),details=[],reserved={BASE:context.salarioBase,SALARIO_BASE:context.salarioBase,DEVENGADO:context.devengado,HORAS_EXTRAS:context.horasExtras,BASE_COTIZABLE:context.baseCotizable,BASE_ISR:context.baseISR,DIAS_TRABAJADOS:context.diasTrabajados,DIAS_PERIODO:context.diasPeriodo,IHSS:context.ihss,RAP:context.rap,ISR:context.isr,SALARIO_NETO:context.salarioNeto};
  let total=0,taxable=0,cotizable=0,taxableRecurring=0,taxableOneTime=0;
  engine.concepts.filter(c=>payrollConceptPhase_(c.categoria)===phase).forEach(c=>{
    const chosen=byConcept[c.codigo];if(!chosen)return;
    const a=chosen.assignment,base=resolvePayrollConceptBase_(c.baseCalculo||"SALARIO_BASE",context,values),override=a.valorOverride;
    let amount=0;
    if(c.tipoCalculo==="FIJO")amount=override==null?c.valor:override;
    else if(c.tipoCalculo==="PORCENTAJE")amount=base*((override==null?c.valor:override)/100);
    else if(c.tipoCalculo==="PROPORCIONAL")amount=base*((override==null?c.valor:override)/100)*(Number(context.diasTrabajados||0)/Math.max(1,Number(context.diasPeriodo||1)));
    else {const vars=Object.assign({},reserved,values,{BASE:base});amount=evaluatePayrollFormula_(c.formula,vars);}
    if(!Number.isFinite(amount)||amount<0)throw new Error("PAYROLL_CONCEPT_AMOUNT_INVALID:"+c.codigo);
    amount=Math.round(amount*100)/100;
    if(phase===2){const cap=Math.max(0,Number(netAvailable)||0);amount=Math.min(amount,Math.round(cap*100)/100);netAvailable=cap-amount;}
    if(amount<=0)return;
    values[c.codigo]=amount;total=Math.round((total+amount)*100)/100;
    if(phase===1){
      if(c.tratamientoISR==="GRAVADO"){taxable+=amount;if(c.recurrente&&!((a.frecuencia||"MENSUAL")==="UNICA"||c.frecuencia==="UNICA"))taxableRecurring+=amount;else taxableOneTime+=amount;}
      if(c.tratamientoIHSS==="COTIZABLE")cotizable+=amount;
    }
    details.push(["CPTD-"+Utilities.getUuid(),planillaId,period,user,c.codigo,c.nombre,c.categoria,c.naturaleza,c.tipoCalculo,c.valor,amount,c.cuentaContable,c.visibleBoleta,c.tratamientoISR,c.tratamientoIHSS,c.version,a.asignacionId,c.formula,c.baseCalculo,"Calculada"]);
  });
  context.conceptValues=values;
  return {total,taxableIncome:Math.round(taxable*100)/100,taxableAnnualized:Math.round((taxableRecurring*12+taxableOneTime)*100)/100,cotizableIncome:Math.round(cotizable*100)/100,details,conceptValues:values};
}

function getPayrollConceptCatalog(payload) {
  const access=requirePayrollConceptManager_(payload);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  try{const ss=SpreadsheetApp.openById(SPREADSHEET_ID),catalog=ensurePayrollConceptSheet_(ss,"CatalogoConceptosPlanilla",getPayrollConceptHeaders_());return {status:"success",conceptos:catalog.rows.map(r=>({conceptoId:r[0],codigo:r[1],nombre:r[2],descripcion:r[3],categoria:r[4],naturaleza:r[5],tipoCalculo:r[6],valor:Number(r[7]||0),baseCalculo:r[8],formula:r[9],frecuencia:r[10],vigenciaInicio:r[11],vigenciaFin:r[12],tratamientoISR:r[13],tratamientoIHSS:r[14],cuentaContable:r[15],visibleBoleta:r[16]===true||String(r[16]).toUpperCase()==="TRUE",prioridad:Number(r[17]||0),estado:r[18],recurrente:r[19]===true||String(r[19]).toUpperCase()==="TRUE",version:r[20]}))};}catch(e){return {status:"error",code:"PAYROLL_CONCEPT_CATALOG_INVALID",message:"No fue posible leer el catálogo de conceptos."};}
}

function savePayrollConcept(payload) {
  const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  const code=String(p.codigo||"").trim().toUpperCase(),name=String(p.nombre||"").trim().slice(0,120),category=String(p.categoria||"").trim().toUpperCase(),nature=String(p.naturaleza||"").trim().toUpperCase(),type=String(p.tipoCalculo||"").trim().toUpperCase(),base=String(p.baseCalculo||"SALARIO_BASE").trim().toUpperCase(),formula=String(p.formula||"").trim().slice(0,500),account=String(p.cuentaContable||"").trim();
  const value=Number(p.valor),priority=Number(p.prioridad||0),frequency=String(p.frecuencia||"MENSUAL").toUpperCase(),isr=String(p.tratamientoISR||"EXENTO").toUpperCase(),ihss=String(p.tratamientoIHSS||"NO_COTIZABLE").toUpperCase(),status=String(p.estado||"ACTIVO").toUpperCase();
  const bases=["SALARIO_BASE","DEVENGADO","HORAS_EXTRAS","BASE_COTIZABLE","BASE_ISR","DIAS_TRABAJADOS","DIAS_PERIODO","IHSS","RAP","ISR","SALARIO_NETO"];
  if(!/^[A-Z][A-Z0-9_]{1,39}$/.test(code)||!name||!payrollConceptCategories_().includes(category)||!["DEBE","HABER"].includes(nature)||!["FIJO","PORCENTAJE","PROPORCIONAL","FORMULA"].includes(type)||!Number.isFinite(value)||value<0||!["MENSUAL","POR_PERIODO","UNICA"].includes(frequency)||!["GRAVADO","EXENTO"].includes(isr)||!["COTIZABLE","NO_COTIZABLE"].includes(ihss)||!account||!Number.isInteger(priority)||priority<0||priority>9999||!["ACTIVO","INACTIVO"].includes(status)||(!bases.includes(base)&&!/^CONCEPTO:[A-Z][A-Z0-9_]{1,39}$/.test(base)))return {status:"error",code:"PAYROLL_CONCEPT_INVALID",message:"Revise código, nombre, categoría, naturaleza, cálculo, frecuencia, tratamientos, base y cuenta contable."};
  if(nature!==(payrollConceptPhase_(category)===1?"DEBE":"HABER"))return {status:"error",code:"PAYROLL_CONCEPT_NATURE_MISMATCH",message:"La naturaleza contable no corresponde a la categoría del concepto."};
  if(type==="FORMULA"){try{const vars={BASE:1,SALARIO_BASE:1,DEVENGADO:1,HORAS_EXTRAS:1,BASE_COTIZABLE:1,BASE_ISR:1,DIAS_TRABAJADOS:1,DIAS_PERIODO:1,IHSS:1,RAP:1,ISR:1,SALARIO_NETO:1};tokenizePayrollFormula_(formula).filter(t=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)).forEach(t=>{vars[t]=1;});evaluatePayrollFormula_(formula,vars);}catch(e){return {status:"error",code:"PAYROLL_FORMULA_INVALID",message:"La fórmula no es válida o contiene operaciones no permitidas."};}}
  const start=p.vigenciaInicio?new Date(p.vigenciaInicio):null,end=p.vigenciaFin?new Date(p.vigenciaFin):null;
  if(start&&isNaN(start.getTime())||end&&isNaN(end.getTime())||start&&end&&start>end)return {status:"error",code:"PAYROLL_CONCEPT_VALIDITY_INVALID",message:"El rango de vigencia no es válido."};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"El catálogo está ocupado."};
  let cat=null,found=null,oldRow=null,writeRow=null;
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID);cat=ensurePayrollConceptSheet_(ss,"CatalogoConceptosPlanilla",getPayrollConceptHeaders_());
    const id=String(p.conceptoId||"").trim(),matches=cat.rows.map((r,i)=>({r,index:i+2})).filter(x=>(id&&String(x.r[0]||"").trim()===id)||String(x.r[1]||"").trim().toUpperCase()===code);
    if(matches.length>1)return {status:"error",code:"PAYROLL_CONCEPT_DUPLICATE",message:"El código o concepto está duplicado."};
    found=matches[0]||null;
    if(found&&String(found.r[1]||"").trim().toUpperCase()!==code&&cat.rows.some(r=>String(r[1]||"").trim().toUpperCase()===code))return {status:"error",code:"PAYROLL_CONCEPT_CODE_DUPLICATE",message:"El código ya está asignado."};
    const conceptId=found?String(found.r[0]):"CPT-"+Utilities.getUuid(),version=found?Number(found.r[20]||1)+1:1,now=new Date();
    writeRow=[conceptId,code,name,String(p.descripcion||"").trim().slice(0,500),category,nature,type,value,base,formula,frequency,p.vigenciaInicio||"",p.vigenciaFin||"",isr,ihss,account,!!p.visibleBoleta,priority,status,p.recurrente!==false,version,found?found.r[21]:now,found?found.r[22]:access.actor.userId,now,access.actor.userId];
    if(found){oldRow=found.r.slice();cat.sheet.getRange(found.index,1,1,writeRow.length).setValues([writeRow]);}
    else {cat.sheet.appendRow(writeRow);found={index:cat.sheet.getLastRow(),r:writeRow};}
    try{getPayrollConceptEngine_(ss);}catch(validationError){if(oldRow)cat.sheet.getRange(found.index,1,1,oldRow.length).setValues([oldRow]);else cat.sheet.getRange(found.index,1,1,writeRow.length).clearContent();return {status:"error",code:"PAYROLL_CONCEPT_DEPENDENCY_INVALID",message:"No se guardó el concepto: revise referencias, fórmulas y dependencias circulares."};}
    if(oldRow){const history=ensurePayrollConceptSheet_(ss,"HistorialConceptosPlanilla",getPayrollConceptHistoryHeaders_());history.sheet.appendRow(["HCP-"+Utilities.getUuid(),conceptId,oldRow[1],oldRow[20],JSON.stringify(oldRow),now,access.actor.userId,"ACTUALIZADO"]);}
    return {status:"success",conceptoId:conceptId,codigo:code,version:version,message:"Concepto salarial guardado y versión histórica conservada."};
  }catch(e){if(cat&&found){try{if(oldRow)cat.sheet.getRange(found.index,1,1,oldRow.length).setValues([oldRow]);else cat.sheet.getRange(found.index,1,1,writeRow.length).clearContent();}catch(_){}}return {status:"error",code:"PAYROLL_CONCEPT_SAVE_FAILED",message:"No fue posible guardar el concepto. Revise referencias y dependencias."};}finally{lock.releaseLock();}
}

function setPayrollConceptStatus(payload) {
  const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  const id=String(p.conceptoId||"").trim(),state=String(p.estado||"").trim().toUpperCase();if(!id||!["ACTIVO","INACTIVO"].includes(state))return {status:"error",code:"PAYROLL_CONCEPT_STATUS_INVALID",message:"Estado no válido."};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"El catálogo está ocupado."};
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),cat=ensurePayrollConceptSheet_(ss,"CatalogoConceptosPlanilla",getPayrollConceptHeaders_()),history=ensurePayrollConceptSheet_(ss,"HistorialConceptosPlanilla",getPayrollConceptHistoryHeaders_()),matches=cat.rows.map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[0]||"").trim()===id);
    if(matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Concepto no disponible."};
    const found=matches[0],old=found.r.slice(),updated=old.slice();updated[18]=state;updated[20]=Number(updated[20]||1)+1;updated[23]=new Date();updated[24]=access.actor.userId;
    cat.sheet.getRange(found.index,1,1,updated.length).setValues([updated]);
    try{getPayrollConceptEngine_(ss);}catch(e){cat.sheet.getRange(found.index,1,1,old.length).setValues([old]);return {status:"error",code:"PAYROLL_CONCEPT_DEPENDENCY_INVALID",message:"No se puede desactivar: existen reglas activas que dependen de este concepto."};}
    try{history.sheet.appendRow(["HCP-"+Utilities.getUuid(),id,old[1],old[20],JSON.stringify(old),new Date(),access.actor.userId,state]);}
    catch(historyError){cat.sheet.getRange(found.index,1,1,old.length).setValues([old]);return {status:"error",code:"PAYROLL_CONCEPT_HISTORY_WRITE_FAILED",message:"No se pudo conservar el historial; el cambio fue revertido."};}
    return {status:"success",conceptoId:id,estado:state,version:updated[20]};
  }catch(e){return {status:"error",code:"PAYROLL_CONCEPT_STATUS_FAILED",message:"No fue posible cambiar el estado del concepto."};}finally{lock.releaseLock();}
}

function assignPayrollConcept(payload) {
  const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  const code=String(p.codigoConcepto||"").trim().toUpperCase(),type=String(p.tipoAsignacion||"").trim().toUpperCase(),target=String(p.valorAsignacion||"").trim(),frequency=String(p.frecuencia||"MENSUAL").toUpperCase(),period=String(p.periodoUnico||"").trim();
  const startDate=p.fechaInicio?new Date(p.fechaInicio):null,endDate=p.fechaFin?new Date(p.fechaFin):null;
  if(!code||!["GLOBAL","EMPLEADO","DEPARTAMENTO","CARGO","ESTRUCTURA_SALARIAL"].includes(type)||!target||!["MENSUAL","POR_PERIODO","UNICA"].includes(frequency)||(frequency==="UNICA"&&!/^\d{4}-\d{2}$/.test(period))||startDate&&isNaN(startDate.getTime())||endDate&&isNaN(endDate.getTime())||startDate&&endDate&&startDate>endDate)return {status:"error",code:"PAYROLL_CONCEPT_ASSIGNMENT_INVALID",message:"La asignación, vigencia o frecuencia no es válida."};
  const override=p.valorOverride==null||p.valorOverride===""?null:Number(p.valorOverride);
  if(override!==null&&(!Number.isFinite(override)||override<0))return {status:"error",code:"PAYROLL_CONCEPT_OVERRIDE_INVALID",message:"El valor de ajuste no es válido."};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"Las asignaciones están ocupadas."};
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,access.actor);
    if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"No existe un ámbito autorizado para la asignación."};
    const catalog=ensurePayrollConceptSheet_(ss,"CatalogoConceptosPlanilla",getPayrollConceptHeaders_());
    const conceptMatches=catalog.rows.filter(r=>String(r[1]||"").trim().toUpperCase()===code&&String(r[18]||"").toUpperCase()==="ACTIVO");
    if(conceptMatches.length!==1)return {status:"error",code:"PAYROLL_CONCEPT_NOT_ACTIVE",message:"El concepto no existe o está inactivo."};
    if((String(conceptMatches[0][10]||"").toUpperCase()==="UNICA"||conceptMatches[0][19]===false||String(conceptMatches[0][19]).toUpperCase()==="FALSE")&&!/^\d{4}-\d{2}$/.test(period))return {status:"error",code:"PAYROLL_CONCEPT_PERIOD_REQUIRED",message:"El concepto único requiere un período YYYY-MM."};
    let departmentScope=String(p.departamentoScope||"").trim();
    if(type==="GLOBAL"&&!scope.institutionWide)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"La asignación global requiere ámbito institucional."};
    if(type==="EMPLEADO"){
      const own=resolveEmployeeLoanAdvanceAccess_(p,ss,target,true);if(!own.authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Empleado no disponible."};
      const exp=ss.getSheetByName("ExpedientesLaborales");if(!exp)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Empleado no disponible."};
      const matches=exp.getDataRange().getValues().slice(1).filter(r=>String(r[2]||"").trim()===target);if(matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Empleado no disponible."};
      departmentScope=String(matches[0][4]||"").trim();
    }
    if(type==="DEPARTAMENTO")departmentScope=target;
    if(["DEPARTAMENTO","CARGO","ESTRUCTURA_SALARIAL"].includes(type)&&(!departmentScope||(!scope.institutionWide&&!scope.departmentIds.map(String).includes(departmentScope))))return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"El departamento no está dentro del ámbito autorizado."};
    if(type==="GLOBAL")departmentScope="";
    const sheet=ensurePayrollConceptSheet_(ss,"AsignacionesConceptosPlanilla",getPayrollAssignmentHeaders_());
    const duplicate=sheet.rows.some(r=>String(r[1]||"").trim().toUpperCase()===code&&String(r[2]||"").trim().toUpperCase()===type&&String(r[3]||"").trim()===target&&String(r[4]||"").trim()===departmentScope&&String(r[10]||"").trim().toUpperCase()==="ACTIVO");
    if(duplicate)return {status:"error",code:"PAYROLL_CONCEPT_ASSIGNMENT_DUPLICATE",message:"Ya existe una asignación activa equivalente."};
    const row=["ASN-"+Utilities.getUuid(),code,type,target,departmentScope,override==null?"":override,p.fechaInicio||"",p.fechaFin||"",frequency,period,"Activo",String(p.observaciones||"").trim().slice(0,500),access.actor.userId,new Date()];
    sheet.sheet.appendRow(row);return {status:"success",asignacionId:row[0],message:"Asignación de concepto creada."};
  }catch(e){return {status:"error",code:"PAYROLL_CONCEPT_ASSIGNMENT_SAVE_FAILED",message:"No fue posible guardar la asignación."};}finally{lock.releaseLock();}
}

function getPayrollConceptAssignments(payload) {
  const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,access.actor);
    if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"No existe un ámbito autorizado para consultar asignaciones."};
    const allowed=Array.isArray(scope.departmentIds)?scope.departmentIds.map(String):[],data=ensurePayrollConceptSheet_(ss,"AsignacionesConceptosPlanilla",getPayrollAssignmentHeaders_());
    const rows=data.rows.filter(r=>scope.institutionWide||allowed.includes(String(r[4]||"")));
    return {status:"success",asignaciones:rows.map(r=>({asignacionId:r[0],codigoConcepto:r[1],tipoAsignacion:r[2],valorAsignacion:r[3],departamentoScope:r[4],valorOverride:r[5],fechaInicio:r[6],fechaFin:r[7],frecuencia:r[8],periodoUnico:r[9],estado:r[10],observaciones:r[11]}))};
  }catch(e){return {status:"error",code:"PAYROLL_CONCEPT_ASSIGNMENTS_INVALID",message:"No fue posible leer las asignaciones."};}
}

function setPayrollConceptAssignmentStatus(payload) {
  const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  const id=String(p.asignacionId||"").trim(),state=String(p.estado||"").trim().toUpperCase();if(!id||!["ACTIVO","INACTIVO"].includes(state))return {status:"error",code:"PAYROLL_CONCEPT_ASSIGNMENT_STATUS_INVALID",message:"Estado de asignación no válido."};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"Las asignaciones están ocupadas."};
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,access.actor);
    if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"No existe un ámbito autorizado."};
    const data=ensurePayrollConceptSheet_(ss,"AsignacionesConceptosPlanilla",getPayrollAssignmentHeaders_()),matches=data.rows.map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[0]||"").trim()===id);
    if(matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Asignación no disponible."};
    const found=matches[0],dept=String(found.r[4]||"").trim();
    if(!scope.institutionWide&&!Array.isArray(scope.departmentIds)||!scope.institutionWide&&!scope.departmentIds.map(String).includes(dept))return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Asignación no disponible."};
    const updated=found.r.slice();updated[10]=state;data.sheet.getRange(found.index,1,1,updated.length).setValues([updated]);
    return {status:"success",asignacionId:id,estado:state};
  }catch(e){return {status:"error",code:"PAYROLL_CONCEPT_ASSIGNMENT_STATUS_FAILED",message:"No fue posible cambiar el estado de la asignación."};}finally{lock.releaseLock();}
}

function appendPayrollConceptDetailRows_(ss,rows) {
  if(!rows||!rows.length)return 0;
  const detail=ensurePayrollConceptSheet_(ss,"DetalleConceptosPlanilla",getPayrollConceptDetailHeaders_());
  const start=detail.sheet.getLastRow()+1;
  detail.sheet.getRange(start,1,rows.length,detail.headers.length).setValues(rows);
  return rows.length;
}

function calculatePayrollPeriod(payload) {
  const { periodoMes, idempotencyToken } = payload || {};
  if (!periodoMes) throw new Error("periodoMes requerido.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const payrollConceptEngine = getPayrollConceptEngine_(ss);
    const planSheet = getOrCreateSheet(ss, "PlanillasNomenclatura");
    const expsRows = getOrCreateSheet(ss, "ExpedientesLaborales").getDataRange().getValues().slice(1);
    const ctrsSheet = getOrCreateSheet(ss, "ContratosLaborales");
    const ctrsRows = ctrsSheet.getDataRange().getValues().slice(1);
    const incidenciasSheet = getOrCreateSheet(ss, "IncidenciasNomina");
    const planData = planSheet.getDataRange().getValues();

    // Control Anti-Duplicados por Periodo Mes e Idempotencia
    const existingPlan = planData.find(r => String(r[2]).trim() === String(periodoMes).trim() && r[15] !== "Anulada");
    if (existingPlan) {
      return {
        status: "success",
        planillaId: existingPlan[0],
        periodoMes: periodoMes,
        estadoCiclo: existingPlan[15],
        message: `La planilla para el periodo '${periodoMes}' ya existe con estado '${existingPlan[15]}'.`
      };
    }

    const activeEmployees = expsRows.filter(r => r[8] === "active" || r[8] === "Activo" || r[8] === "EnPeriodoPrueba");
    if (activeEmployees.length === 0) {
      throw new Error("No hay empleados activos en estado de nómina elegible.");
    }

    // Determinar rango de fechas del período (ej: '2026-03' o '2026-03-31')
    let year = 2026;
    let month = 1; // 1..12
    const mMatch = String(periodoMes).trim().match(/^(\d{4})[-/](\d{1,2})/);
    if (mMatch) {
      year = parseInt(mMatch[1], 10);
      month = parseInt(mMatch[2], 10);
    } else {
      const nowD = new Date();
      year = nowD.getFullYear();
      month = nowD.getMonth() + 1;
    }

    const periodStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInPeriod = new Date(year, month, 0).getDate(); // 28, 29, 30 o 31

    const now = new Date();
    const planillaId = "PLN-" + now.getTime();

    // Consultar hojas de novedades
    const ovtSheet = getOrCreateSheet(ss, "AprobacionHorasExtras");
    const ovtData = ovtSheet.getDataRange().getValues();
    const ovtRows = ovtData.slice(1);

    const attSheet = getOrCreateSheet(ss, "DeduccionesAsistencia");
    const attData = attSheet.getDataRange().getValues();
    const attRows = attData.slice(1);

    const vacSheet = getOrCreateSheet(ss, "SolicitudesVacaciones");
    const vacData = vacSheet.getDataRange().getValues();
    const vacRows = vacData.slice(1);

    const incSheet = getOrCreateSheet(ss, "IncapacidadesMedicas");
    const incData = incSheet.getDataRange().getValues();
    const incRows = incData.slice(1);

    const processedRows = [];
    const incidenciasNuevas = [];
    const ovtUpdates = []; // { rowIdx, planillaId }
    const attUpdates = []; // { rowIdx, planillaId }
    const vacUpdates = [];
    const incUpdates = [];
    const payrollLoanLedgerEvents = [];
    const payrollConceptDetailRows = [];

    // Función auxiliar para parsear fechas de forma segura
    function parseSafeDate(val) {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    activeEmployees.forEach(e => {
      const empExpId = String(e[0]).trim();
      const empUserId = String(e[2] || "").trim();
      const puesto = e[3] || "Personal";
      const empNombre = e[9] || e[3] || "Empleado";
      const fechaIngresoExp = parseSafeDate(e[6]);
      const fechaSalidaExp = parseSafeDate(e[7]);

      // 1. Vinculación y validación de contratos laborales en ContratosLaborales
      // Esquema: ContratoID (0), ExpedienteID (1), TipoContrato (2), FechaInicio (3), FechaFin (4), SalarioBase (5), Jornada (6), EstadoContrato (7), Observaciones (8)
      const empContracts = ctrsRows.filter(c => {
        const cExp = String(c[1]).trim();
        return (cExp === empExpId || (empUserId && cExp === empUserId)) && String(c[7]).toLowerCase() !== "anulado" && String(c[7]).toLowerCase() !== "inactivo";
      });

      // Filtrar contratos cuya vigencia cubra el período procesado
      const validContracts = empContracts.filter(c => {
        const fIni = parseSafeDate(c[3]);
        const fFin = parseSafeDate(c[4]);
        const startsBeforeOrDuring = !fIni || fIni <= periodEnd;
        const endsAfterOrDuring = !fFin || fFin >= periodStart;
        return startsBeforeOrDuring && endsAfterOrDuring;
      });

      // Detección de incidencias contractuales [TASK-007]
      if (validContracts.length === 0) {
        const descIncidencia = `Empleado ${empNombre} (${empExpId}) no tiene contrato laboral vigente para el período ${periodoMes}.`;
        incidenciasNuevas.push([
          "INC-" + Math.floor(100000 + Math.random() * 900000),
          planillaId,
          periodoMes,
          empExpId,
          empNombre,
          "SIN_CONTRATO_VIGENTE",
          descIncidencia,
          now.toISOString(),
          "PendienteResolucion"
        ]);
        return; // Excluir de nómina procesada para prevenir asignación de salarios arbitrarios
      }

      if (validContracts.length > 1) {
        // Contratos superpuestos
        const descIncidencia = `Empleado ${empNombre} (${empExpId}) presenta múltiples contratos vigentes superpuestos (${validContracts.length}) en el período ${periodoMes}.`;
        incidenciasNuevas.push([
          "INC-" + Math.floor(100000 + Math.random() * 900000),
          planillaId,
          periodoMes,
          empExpId,
          empNombre,
          "CONTRATOS_SUPERPUESTOS",
          descIncidencia,
          now.toISOString(),
          "PendienteResolucion"
        ]);
        return;
      }

      const activeContract = validContracts[0];
      const contractualSalary = parseFloat(activeContract[5] || 0);
      if (contractualSalary <= 0) {
        incidenciasNuevas.push([
          "INC-" + Math.floor(100000 + Math.random() * 900000),
          planillaId,
          periodoMes,
          empExpId,
          empNombre,
          "SALARIO_INVALIDO",
          `Empleado ${empNombre} posee salario contractual cero o negativo (L ${contractualSalary}).`,
          now.toISOString(),
          "PendienteResolucion"
        ]);
        return;
      }

      // 2. Cálculo de días laborados y proporcionalidad
      let effectiveStart = periodStart;
      let effectiveEnd = periodEnd;

      const contractStart = parseSafeDate(activeContract[3]);
      const contractEnd = parseSafeDate(activeContract[4]);

      if (fechaIngresoExp && fechaIngresoExp > effectiveStart) effectiveStart = fechaIngresoExp;
      if (contractStart && contractStart > effectiveStart) effectiveStart = contractStart;

      if (fechaSalidaExp && fechaSalidaExp < effectiveEnd) effectiveEnd = fechaSalidaExp;
      if (contractEnd && contractEnd < effectiveEnd) effectiveEnd = contractEnd;

      let workedDays = daysInPeriod;
      if (effectiveStart > periodStart || effectiveEnd < periodEnd) {
        const startDay = effectiveStart > periodStart ? effectiveStart.getDate() : 1;
        const endDay = effectiveEnd < periodEnd ? effectiveEnd.getDate() : daysInPeriod;
        workedDays = Math.max(0, endDay - startDay + 1);
        if (workedDays > daysInPeriod) workedDays = daysInPeriod;
      }

      // Salario base devengado proporcional
      const salarioBase = parseFloat(((contractualSalary / daysInPeriod) * workedDays).toFixed(2));
      const hourlyRate = (contractualSalary / 30 / 8); // Tarifa hora estándar ordinaria

      // 3. Integración de novedades aprobadas [TASK-008]
      // A. Horas Extras Aprobadas (AprobacionHorasExtras)
      // Esquema: OvertimeID(0), UserId(1), Nombre(2), Fecha(3), HorasReg(4), HorasAprob(5), Motivo(6), EstadoAprob(7), AprobadoPor(8), PeriodoNominaId(9), EstadoPago(10)
      let empHorasExtras = 0;
      let montoHorasExtras = 0;
      ovtRows.forEach((r, idx) => {
        const oUser = String(r[1]).trim();
        const oState = String(r[7]).trim();
        const oPayment = String(r[10]).trim();
        const oPeriodId = String(r[9] || "").trim();
        const oDate = parseSafeDate(r[3]);

        const matchesEmp = (oUser === empExpId || (empUserId && oUser === empUserId));
        const isApproved = (oState === "Aprobada" || oState === "Aprobado");
        const notPaid = (oPayment !== "Pagado" && oPayment !== "ProcesadaEnNomina" && !oPeriodId);
        const inPeriod = oDate ? (oDate >= periodStart && oDate <= periodEnd) : true;

        if (matchesEmp && isApproved && notPaid && inPeriod) {
          const hApproved = parseFloat(r[5] || r[4] || 0);
          empHorasExtras += hApproved;
          // Recargo estándar legal horas extras (25% diurno, promedio 1.25)
          montoHorasExtras += (hApproved * hourlyRate * 1.25);
          ovtUpdates.push({ rowIdx: idx + 2, planillaId: planillaId });
        }
      });
      montoHorasExtras = parseFloat(montoHorasExtras.toFixed(2));

      // B. Tardanzas y Ausencias Injustificadas (DeduccionesAsistencia)
      // Esquema: AsistenciaID(0), Fecha(1), EmpleadoId(2), Nombre(3), HoraEntrada(4), HoraSalida(5), MinutosTardanza(6), EstadoAsistencia(7), Obs(8)
      let deduccionTardanzas = 0;
      let deduccionAusencias = 0;
      attRows.forEach((r, idx) => {
        const aEmp = String(r[2]).trim();
        const aDate = parseSafeDate(r[1]);
        const aStatus = String(r[7]).trim().toLowerCase();
        const aObs = String(r[8] || "");
        const inPeriod = aDate ? (aDate >= periodStart && aDate <= periodEnd) : true;
        const matchesEmp = (aEmp === empExpId || (empUserId && aEmp === empUserId));
        const notProcessed = !aObs.includes("PROCESADA_NOMINA_");

        if (matchesEmp && inPeriod && notProcessed) {
          if (aStatus === "ausente" || aStatus === "injustificada" || aStatus === "ausencia injustificada") {
            // Descuento de un día de salario ordinario
            deduccionAusencias += (contractualSalary / 30);
            attUpdates.push({ rowIdx: idx + 2, planillaId: planillaId });
          } else if (aStatus === "tardanza" || parseInt(r[6] || 0) > 0) {
            const mins = parseInt(r[6] || 0);
            if (mins > 15) { // Tolerancia legal superada
              deduccionTardanzas += (mins / 60) * hourlyRate;
              attUpdates.push({ rowIdx: idx + 2, planillaId: planillaId });
            }
          }
        }
      });

      // C. Permisos sin goce de sueldo (SolicitudesVacaciones)
      // Esquema: SolicitudID(0), ExpedienteID(1), Tipo(2), FechaInicio(3), FechaFin(4), DiasSolicitados(5), Estado(6), AprobadoPor(7), Obs(8)
      let deduccionPermisosSinSueldo = 0;
      vacRows.forEach((r, idx) => {
        const vExp = String(r[1]).trim();
        const vTipo = String(r[2]).trim().toLowerCase();
        const vState = String(r[6]).trim().toLowerCase();
        const vObs = String(r[8] || "");
        const matchesEmp = (vExp === empExpId || (empUserId && vExp === empUserId));
        const notProcessed = !vObs.includes("PROCESADA_NOMINA_");

        if (matchesEmp && (vState === "aprobada" || vState === "aprobado") && notProcessed) {
          if (vTipo.includes("sin goce") || vTipo.includes("no remunerado")) {
            const dias = parseFloat(r[5] || 1);
            deduccionPermisosSinSueldo += (dias * (contractualSalary / 30));
            vacUpdates.push({ rowIdx: idx + 2, planillaId: planillaId });
          }
        }
      });

      // D. Incapacidades Médicas (IncapacidadesMedicas)
      // Esquema: IncapacidadID(0), ExpedienteID(1), CentroMedico(2), Diagnostico(3), FechaInicio(4), FechaFin(5), DiasOtorgados(6), EstadoIHSS(7), Obs(8)
      incRows.forEach((r, idx) => {
        const iExp = String(r[1]).trim();
        const iState = String(r[7]).trim().toLowerCase();
        const iObs = String(r[8] || "");
        const matchesEmp = (iExp === empExpId || (empUserId && iExp === empUserId));
        const notProcessed = !iObs.includes("PROCESADA_NOMINA_");

        if (matchesEmp && (iState === "aprobado" || iState === "aceptado" || iState === "cubierto") && notProcessed) {
          incUpdates.push({ rowIdx: idx + 2, planillaId: planillaId });
        }
      });

      const conceptContext = {
        salarioBase: salarioBase,
        devengado: salarioBase + montoHorasExtras,
        horasExtras: montoHorasExtras,
        baseCotizable: salarioBase + montoHorasExtras,
        baseISR: salarioBase + montoHorasExtras,
        diasTrabajados: workedDays,
        diasPeriodo: daysInPeriod,
        ihss: 0, rap: 0, isr: 0, salarioNeto: 0,
        conceptValues: Object.create(null)
      };
      const incomeConcepts = calculatePayrollConceptPhase_(payrollConceptEngine,e,empUserId,periodoMes,planillaId,conceptContext,1,Infinity);
      const bonificaciones = incomeConcepts.total;
      const conceptDetails = incomeConcepts.details.slice();
      const otrasDedExisting = parseFloat((deduccionTardanzas + deduccionAusencias + deduccionPermisosSinSueldo).toFixed(2));

      // Deducciones de Ley Honduras (IHSS, RAP), incluyendo conceptos dinámicos cotizables.
      const baseCotizable = parseFloat((salarioBase + montoHorasExtras + incomeConcepts.cotizableIncome).toFixed(2));
      const dedIHSS = parseFloat((Math.min(baseCotizable, 10317.38) * 0.035).toFixed(2));
      const dedRAP = parseFloat((Math.max(0, baseCotizable - 10317.38) * 0.015).toFixed(2));

      // [TASK-010] [F17-Task04] - Motor de retención progresiva anualizada del Impuesto Sobre la Renta (SAR Art. 22)
      // 1. Proyección de ingresos anuales gravables (12 meses de salario ordinario contractual más horas extras proyectadas)
      const annualGross = (contractualSalary * 12) + (montoHorasExtras * 12) + incomeConcepts.taxableAnnualized;

      // 2. Deducciones de ley autorizadas:
      // - Deducción fija por gastos médicos de ley conforme al Código Tributario / Art. 22: L 40,000.00 anuales
      // - Cotizaciones anuales del empleado a seguridad social (IHSS y RAP)
      const annualMedicalDeduction = 40000.00;
      const annualIHSS = dedIHSS * 12;
      const annualRAP = dedRAP * 12;
      const totalAnnualExemptions = annualMedicalDeduction + annualIHSS + annualRAP;

      // 3. Base imponible neta anual proyectada
      const netTaxableIncome = Math.max(0, annualGross - totalAnnualExemptions);

      // 4. Escala progresiva oficial del SAR Honduras (Art. 22):
      // Tramo 1: De L 0.01 a L 199,539.96 -> Exento (0%)
      // Tramo 2: De L 199,539.97 a L 304,324.78 -> 15%
      // Tramo 3: De L 304,324.79 a L 707,729.04 -> 20%
      // Tramo 4: De L 707,729.05 en adelante -> 25%
      let annualTax = 0;
      const t1Limit = 199539.96;
      const t2Limit = 304324.78;
      const t3Limit = 707729.04;

      if (netTaxableIncome > t1Limit) {
        if (netTaxableIncome <= t2Limit) {
          annualTax += (netTaxableIncome - t1Limit) * 0.15;
        } else {
          annualTax += (t2Limit - t1Limit) * 0.15;
          if (netTaxableIncome <= t3Limit) {
            annualTax += (netTaxableIncome - t2Limit) * 0.20;
          } else {
            annualTax += (t3Limit - t2Limit) * 0.20;
            annualTax += (netTaxableIncome - t3Limit) * 0.25;
          }
        }
      }

      // 5. Retención mensual en la fuente del período (impuesto anual proyectado dividido entre 12 meses)
      const dedISR = parseFloat((annualTax > 0 ? (annualTax / 12) : 0).toFixed(2));

      const totalDevengado = parseFloat((salarioBase + montoHorasExtras + bonificaciones).toFixed(2));
      conceptContext.devengado = totalDevengado;
      conceptContext.baseCotizable = baseCotizable;
      conceptContext.baseISR = parseFloat((salarioBase + montoHorasExtras + incomeConcepts.taxableIncome).toFixed(2));
      conceptContext.ihss = dedIHSS;conceptContext.rap = dedRAP;conceptContext.isr = dedISR;
      conceptContext.salarioNeto = Math.max(0,totalDevengado-dedIHSS-dedRAP-dedISR-otrasDedExisting);
      const deductionConcepts = calculatePayrollConceptPhase_(payrollConceptEngine,e,empUserId,periodoMes,planillaId,conceptContext,2,Math.max(0,conceptContext.salarioNeto));
      conceptDetails.push.apply(conceptDetails,deductionConcepts.details);
      const otrasDedBase = parseFloat((otrasDedExisting + deductionConcepts.total).toFixed(2));
      const loanAllocation = calculatePayrollLoanDeductions_(ss, empUserId || empExpId, periodoMes, planillaId, Math.max(0, totalDevengado - dedIHSS - dedRAP - dedISR - otrasDedBase));
      const otrasDed = parseFloat((otrasDedBase + loanAllocation.total).toFixed(2));
      if (loanAllocation.events.length) payrollLoanLedgerEvents.push.apply(payrollLoanLedgerEvents, loanAllocation.events);
      const salarioNeto = parseFloat(Math.max(0, totalDevengado - dedIHSS - dedRAP - dedISR - otrasDed).toFixed(2));
      conceptContext.salarioNeto = salarioNeto;
      const employerConcepts = calculatePayrollConceptPhase_(payrollConceptEngine,e,empUserId,periodoMes,planillaId,conceptContext,3,Infinity);
      conceptDetails.push.apply(conceptDetails,employerConcepts.details);
      if(conceptDetails.length)payrollConceptDetailRows.push.apply(payrollConceptDetailRows,conceptDetails);

      // [TASK-009] [F17-Task03] - Aportaciones patronales independientes y costo laboral institucional total
      // Legislación de Honduras:
      // IHSS Patronal: 7.2% sobre techo de L 10,317.38 (Salud, Maternidad, IVM y Riesgos)
      // RAP Patronal: 1.5% sobre excedente del techo de L 10,317.38
      // INFOP Patronal: 1.0% sobre salario devengado
      const patronalIHSS = parseFloat((Math.min(salarioBase, 10317.38) * 0.072).toFixed(2));
      const patronalRAP = parseFloat((Math.max(0, salarioBase - 10317.38) * 0.015).toFixed(2));
      const patronalINFOP = parseFloat((salarioBase * 0.01).toFixed(2));
      const costoLaboralTotal = parseFloat((totalDevengado + patronalIHSS + patronalRAP + patronalINFOP + employerConcepts.total).toFixed(2));

      processedRows.push([
        planillaId,
        now,
        periodoMes,
        empExpId,
        empNombre,
        puesto,
        salarioBase,
        empHorasExtras,
        montoHorasExtras,
        bonificaciones,
        dedIHSS,
        dedRAP,
        dedISR,
        otrasDed,
        salarioNeto,
        "Calculada",
        patronalIHSS,
        patronalRAP,
        patronalINFOP,
        costoLaboralTotal
      ]);
    });

    if (incidenciasNuevas.length > 0) {
      incidenciasSheet.getRange(incidenciasSheet.getLastRow() + 1, 1, incidenciasNuevas.length, 9).setValues(incidenciasNuevas);
    }

    if (processedRows.length > 0) {
      if (payrollLoanLedgerEvents.length) appendPayrollLoanLedgerEvents_(ss, payrollLoanLedgerEvents);
      const planStartRow = planSheet.getLastRow() + 1;
      let detailStartRow = 0, detailSheet = null;
      try {
        planSheet.getRange(planStartRow, 1, processedRows.length, 20).setValues(processedRows);
        if (payrollConceptDetailRows.length) {
          const detail = ensurePayrollConceptSheet_(ss,"DetalleConceptosPlanilla",getPayrollConceptDetailHeaders_());
          detailSheet = detail.sheet;detailStartRow = detail.sheet.getLastRow() + 1;
          detail.sheet.getRange(detailStartRow,1,payrollConceptDetailRows.length,detail.headers.length).setValues(payrollConceptDetailRows);
        }
      } catch (writeError) {
        try { planSheet.getRange(planStartRow,1,processedRows.length,20).clearContent(); } catch (_) {}
        if(detailSheet&&detailStartRow){try{detailSheet.getRange(detailStartRow,1,payrollConceptDetailRows.length,getPayrollConceptDetailHeaders_().length).clearContent();}catch(_){}}
        if (payrollLoanLedgerEvents.length) {
          const cancellations = payrollLoanLedgerEvents.map(r => ["PLM-"+Utilities.getUuid(),r[1],r[2],r[3],r[4],r[5],r[6],r[6],r[8],"CANCELADO",new Date(),"SYSTEM_ROLLBACK",r[0],"Planilla write rollback"]);
          appendPayrollLoanLedgerEvents_(ss,cancellations);
        }
        throw writeError;
      }

      // 4. Marcar novedades como procesadas garantizando trazabilidad e idempotencia
      ovtUpdates.forEach(u => {
        ovtSheet.getRange(u.rowIdx, 10).setValue(u.planillaId);
        ovtSheet.getRange(u.rowIdx, 11).setValue("ProcesadaEnNomina");
      });

      attUpdates.forEach(u => {
        const curObs = String(attSheet.getRange(u.rowIdx, 9).getValue() || "");
        attSheet.getRange(u.rowIdx, 9).setValue(curObs + ` [PROCESADA_NOMINA_${u.planillaId}]`);
      });

      vacUpdates.forEach(u => {
        const curObs = String(vacSheet.getRange(u.rowIdx, 9).getValue() || "");
        vacSheet.getRange(u.rowIdx, 9).setValue(curObs + ` [PROCESADA_NOMINA_${u.planillaId}]`);
      });

      incUpdates.forEach(u => {
        const curObs = String(incSheet.getRange(u.rowIdx, 9).getValue() || "");
        incSheet.getRange(u.rowIdx, 9).setValue(curObs + ` [PROCESADA_NOMINA_${u.planillaId}]`);
      });
    }

    return {
      status: "success",
      planillaId: planillaId,
      periodoMes: periodoMes,
      empleadosProcesados: processedRows.length,
      incidenciasRegistradas: incidenciasNuevas.length,
      incidencias: incidenciasNuevas.map(inc => ({ id: inc[0], empleado: inc[4], tipo: inc[5], descripcion: inc[6] })),
      estadoCiclo: "Calculada",
      message: `Cálculo preliminar de planilla '${periodoMes}' completado con éxito. Empleados procesados: ${processedRows.length}, Incidencias: ${incidenciasNuevas.length}.`
    };
  } finally {
    lock.releaseLock();
  }
}

function summarizePayrollConceptDetails_(ss,planillaId) {
  const sheet=ss.getSheetByName("DetalleConceptosPlanilla");
  if(!sheet)return {incomeTotal:0,deductionTotal:0,employerTotal:0,journalLines:[]};
  const headers=getPayrollConceptDetailHeaders_(),data=sheet.getDataRange().getValues();
  if(!data.length||!data[0]||data[0].length!==headers.length||headers.some((h,i)=>String(data[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))throw new Error("RESOURCE_SCHEMA_INVALID: DetalleConceptosPlanilla");
  const rows=data.slice(1).filter(r=>String(r[1]||"").trim()===String(planillaId).trim()&&String(r[19]||"").trim().toUpperCase()!=="CANCELADO");
  let incomeTotal=0,deductionTotal=0,employerTotal=0;const grouped=Object.create(null);
  rows.forEach(r=>{
    const amount=Number(r[10]||0),phase=payrollConceptPhase_(r[6]),account=String(r[11]||"").trim(),nature=String(r[7]||"").trim().toUpperCase();
    if(!Number.isFinite(amount)||amount<0||!account||!["DEBE","HABER"].includes(nature))throw new Error("PAYROLL_CONCEPT_DETAIL_INVALID");
    if(phase===1)incomeTotal+=amount;else if(phase===2)deductionTotal+=amount;else if(phase===3)employerTotal+=amount;else throw new Error("PAYROLL_CONCEPT_CATEGORY_INVALID");
    const key=account+"|"+nature;
    if(!grouped[key])grouped[key]={cuenta:account,nombre:"Conceptos de nómina "+account,naturaleza:nature,monto:0};
    grouped[key].monto=Math.round((grouped[key].monto+amount)*100)/100;
  });
  const journalLines=Object.keys(grouped).sort().map(k=>{const x=grouped[k];return {cuenta:x.cuenta,nombre:x.nombre,debe:x.naturaleza==="DEBE"?x.monto:0,haber:x.naturaleza==="HABER"?x.monto:0};});
  return {incomeTotal:Math.round(incomeTotal*100)/100,deductionTotal:Math.round(deductionTotal*100)/100,employerTotal:Math.round(employerTotal*100)/100,journalLines};
}

function getPayrollPlanHeaders_(){return ["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"];}

function isValidPayrollPlanHeaders_(headers){const h=getPayrollPlanHeaders_();return Array.isArray(headers)&&(headers.length===h.length||headers.length===h.length+1)&&h.every((x,i)=>String(headers[i]||"").trim().toUpperCase()===x.toUpperCase())&&(headers.length===h.length||String(headers[h.length]||"").trim().toUpperCase()==="ASIENTOCONTABLEID");}

function ensurePayrollJournalLinkColumn_(sheet){const data=sheet.getDataRange().getValues(),h=getPayrollPlanHeaders_();if(!data.length||!isValidPayrollPlanHeaders_(data[0]))throw new Error("RESOURCE_SCHEMA_INVALID: PlanillasNomenclatura");if(data[0].length===h.length)sheet.getRange(1,h.length+1).setValue("AsientoContableID");return h.length+1;}

function payrollMoney_(value,code){const n=Number(value==null||value===""?0:value);if(!Number.isFinite(n)||n<0)throw new Error(code||"PAYROLL_JOURNAL_AMOUNT_INVALID");return Math.round((n+Number.EPSILON)*100)/100;}

function buildPayrollJournalLines_(planRows,conceptSummary,loanDeductionTotal){
 if(!Array.isArray(planRows)||!planRows.length)throw new Error("PAYROLL_JOURNAL_ROWS_REQUIRED");
 const s=conceptSummary||{},sum=i=>planRows.reduce((t,r)=>t+payrollMoney_(r[i],"PAYROLL_JOURNAL_AMOUNT_INVALID"),0);
 const salary=sum(6),overtime=sum(8),income=payrollMoney_(s.incomeTotal,"PAYROLL_JOURNAL_CONCEPT_INVALID"),ihss=sum(10),rap=sum(11),isr=sum(12),other=sum(13),net=sum(14),pIHSS=sum(16),pRAP=sum(17),pINFOP=sum(18),loans=payrollMoney_(loanDeductionTotal,"PAYROLL_JOURNAL_LOAN_INVALID"),deductionConcepts=payrollMoney_(s.deductionTotal,"PAYROLL_JOURNAL_CONCEPT_INVALID");
 payrollMoney_(s.employerTotal,"PAYROLL_JOURNAL_CONCEPT_INVALID");
 const gross=Math.round((salary+overtime+income)*100)/100,deductions=Math.round((ihss+rap+isr+other)*100)/100;
 if(Math.abs(gross-(deductions+net))>0.01)throw new Error("PAYROLL_JOURNAL_NET_RECONCILIATION_REQUIRED");
 const nonLoanOther=Math.round((other-deductionConcepts-loans)*100)/100;
 if(nonLoanOther < -0.01||nonLoanOther>salary+overtime+0.01)throw new Error("PAYROLL_JOURNAL_DEDUCTIONS_RECONCILIATION_REQUIRED");
 const lines=[],add=(account,name,debit,credit)=>{const d=payrollMoney_(debit),h=payrollMoney_(credit);if(d>0||h>0)lines.push({cuenta:account,nombre:name,debe:d,haber:h});};
 const salaryOffset=Math.min(salary,Math.max(0,nonLoanOther)),overtimeOffset=Math.max(0,nonLoanOther-salary);
 add("5101","Gasto de salarios ordinarios",salary,salaryOffset);
 add("5102","Gasto de horas extras y recargos",overtime,overtimeOffset);
 add("5103","Gasto de aportaciones patronales IHSS",pIHSS,0);
 add("5104","Gasto de aportaciones patronales RAP",pRAP,0);
 add("5105","Gasto de aporte patronal INFOP",pINFOP,0);
 add("2101","Retenciones obreras IHSS por pagar",0,ihss);
 add("2102","Retenciones obreras RAP por pagar",0,rap);
 add("2103","Retenciones ISR por pagar",0,isr);
 add("2104","Obligaciones patronales IHSS por pagar",0,pIHSS);
 add("2105","Obligaciones patronales RAP por pagar",0,pRAP);
 add("2106","INFOP por pagar",0,pINFOP);
 add("1105","Préstamos y anticipos por cobrar - amortización de saldo",0,loans);
 add("1101","Sueldos netos por pagar / Bancos",0,net);
 (Array.isArray(s.journalLines)?s.journalLines:[]).forEach(x=>{const account=String(x&&x.cuenta||"").trim(),name=String(x&&x.nombre||"Concepto salarial").trim().slice(0,120),d=payrollMoney_(x.debe,"PAYROLL_JOURNAL_CONCEPT_INVALID"),h=payrollMoney_(x.haber,"PAYROLL_JOURNAL_CONCEPT_INVALID");if(!/^[A-Za-z0-9._-]{1,20}$/.test(account)||(d>0&&h>0))throw new Error("PAYROLL_JOURNAL_CONCEPT_INVALID");if(d>0||h>0)lines.push({cuenta:account,nombre:name,debe:d,haber:h});});
 let debit=0,credit=0;lines.forEach(x=>{debit+=x.debe;credit+=x.haber;});debit=Math.round(debit*100)/100;credit=Math.round(credit*100)/100;
 if(!lines.length||Math.abs(debit-credit)>0.01)throw new Error("PAYROLL_JOURNAL_UNBALANCED");
 return {lineas:lines,totalDebe:debit,totalHaber:credit};
}

function getPayrollLoanAppliedAmountForPlanilla_(ss,planillaId){if(!ss.getSheetByName("AmortizacionPrestamosNomina"))return 0;const rows=getPayrollLoanLedger_(ss).rows||[],target=String(planillaId||"").trim(),reversed=new Set(rows.filter(r=>String(r[9]||"").trim()==="REVERSADO").map(r=>String(r[12]||"").trim())),cancelled=new Set(rows.filter(r=>String(r[9]||"").trim()==="CANCELADO").map(r=>String(r[12]||"").trim()));const activeApplied=rows.filter(r=>String(r[2]||"").trim()===target&&String(r[9]||"").trim()==="APLICADO"&&!reversed.has(String(r[0]||"").trim()));const source=activeApplied.length?activeApplied:rows.filter(r=>String(r[2]||"").trim()===target&&String(r[9]||"").trim()==="CALCULADO"&&!cancelled.has(String(r[0]||"").trim()));return Math.round(source.reduce((t,r)=>t+payrollMoney_(r[5],"PAYROLL_JOURNAL_LOAN_INVALID"),0)*100)/100;}

function getPayrollJournalEntryById_(ss,id){const sh=ss.getSheetByName("AsientosContables");if(!sh)return null;const rows=sh.getDataRange().getValues().slice(1).filter(r=>String(r[0]||"").trim()===String(id||"").trim());return rows.length===1?rows[0]:null;}

function validatePayrollJournalEntry_(row,referenceId,origin){if(!row||String(row[3]||"").trim()!==origin||String(row[4]||"").trim()!==String(referenceId||"").trim())throw new Error("PAYROLL_JOURNAL_LINK_INVALID");let lines=[];try{lines=JSON.parse(row[5]||"[]");}catch(e){throw new Error("PAYROLL_JOURNAL_ENTRY_INVALID");}if(!Array.isArray(lines)||!lines.length)throw new Error("PAYROLL_JOURNAL_ENTRY_INVALID");let d=0,h=0;lines.forEach(x=>{d+=payrollMoney_(x.debe,"PAYROLL_JOURNAL_ENTRY_INVALID");h+=payrollMoney_(x.haber,"PAYROLL_JOURNAL_ENTRY_INVALID");});d=Math.round(d*100)/100;h=Math.round(h*100)/100;if(Math.abs(d-h)>0.01)throw new Error("PAYROLL_JOURNAL_ENTRY_UNBALANCED");return {status:"success",asientoId:String(row[0]),totalDebe:d,totalHaber:h,estado:row[6]||"Asentado",idempotent:true};}

function validatePayrollJournalAccountMap_(ss) {
 const sheet=ss&&ss.getSheetByName("PlanCuentas");if(!sheet)return true;
 const data=sheet.getDataRange().getValues();if(!data||data.length<=1)return true;
 const rows=data.slice(1),byCode=code=>rows.filter(r=>String(r[1]||"").trim()===code);
 const ihss=byCode("2101"),suppliers=byCode("2107");
 if(ihss.length>1|| (ihss.length===1&&!String(ihss[0][2]||"").toUpperCase().includes("IHSS")))throw new Error("PAYROLL_ACCOUNT_CODE_CONFLICT:2101");
 if(suppliers.length>1|| (suppliers.length===1&&!/(PROVEEDOR|CUENTAS POR PAGAR)/.test(String(suppliers[0][2]||"").toUpperCase())))throw new Error("PAYROLL_ACCOUNT_CODE_CONFLICT:2107");
 return true;
}

function recordPayrollJournalEntry_(ss,planillaId,planRows,conceptSummary,actorId){
 validatePayrollJournalAccountMap_(ss);
 const sheet=ss.getSheetByName("PlanillasNomenclatura");if(!sheet)throw new Error("RESOURCE_NOT_FOUND: PlanillasNomenclatura");
 const col=ensurePayrollJournalLinkColumn_(sheet),data=sheet.getDataRange().getValues(),matches=data.slice(1).map((r,i)=>({row:r,index:i+2})).filter(x=>String(x.row[0]||"").trim()===String(planillaId).trim()&&String(x.row[15]||"").trim().toUpperCase()!=="REEMPLAZADA");
 if(!matches.length||matches.length!==planRows.length)throw new Error("PAYROLL_JOURNAL_PLANILLA_CHANGED");
 const ids=[...new Set(matches.map(x=>String(x.row[col-1]||"").trim()).filter(Boolean))];if(ids.length>1)throw new Error("PAYROLL_JOURNAL_LINK_AMBIGUOUS");
 const journal=getOrCreateSheet(ss,"AsientosContables"),existing=journal.getDataRange().getValues().slice(1).filter(r=>String(r[3]||"").trim()==="Planillas"&&String(r[4]||"").trim()===String(planillaId).trim());
 if(existing.length>1)throw new Error("PAYROLL_JOURNAL_DUPLICATE_REQUIRES_RECONCILIATION");
 if(ids.length){const entry=getPayrollJournalEntryById_(ss,ids[0]);if(!entry)throw new Error("PAYROLL_JOURNAL_LINK_ORPHANED");const valid=validatePayrollJournalEntry_(entry,planillaId,"Planillas");if(existing.length!==1||String(existing[0][0])!==ids[0])throw new Error("PAYROLL_JOURNAL_LINK_CONFLICT");return valid;}
 if(existing.length===1){const valid=validatePayrollJournalEntry_(existing[0],planillaId,"Planillas");matches.forEach(x=>sheet.getRange(x.index,col).setValue(valid.asientoId));return valid;}
 const built=buildPayrollJournalLines_(planRows,conceptSummary,getPayrollLoanAppliedAmountForPlanilla_(ss,planillaId)),result=recordAccountingJournalEntry({descripcion:"Contabilización integral de planilla "+planillaId+" - salarios, retenciones y obligaciones patronales",origenModulo:"Planillas",referenciaId:planillaId,creadoPor:actorId||"SYSTEM_PAYROLL",lineas:built.lineas});
 if(!result||result.status!=="success"||!result.asientoId)throw new Error("PAYROLL_JOURNAL_POST_FAILED");matches.forEach(x=>sheet.getRange(x.index,col).setValue(result.asientoId));return {status:"success",asientoId:result.asientoId,totalDebe:built.totalDebe,totalHaber:built.totalHaber,estado:result.estado,idempotent:false};
}
function recordPayrollJournalAdjustment(payload){
 const p=payload||{},actor=getVerifiedAccountingIdentity_(p);if(!actor.authorized)return {status:"error",code:actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
 const role=String(actor.role||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]/g,"");if(!["CONTADOR","ADMINISTRADOR"].includes(role))return {status:"error",code:"ROLE_NOT_ALLOWED",message:"Acceso denegado."};
 const id=String(p.planillaId||"").trim(),ref=String(p.referenciaAjuste||"").trim(),reason=String(p.motivo||"").trim().slice(0,500);
 if(!id||!/^[A-Za-z0-9_-]{6,80}$/.test(ref)||reason.length<12||!Array.isArray(p.lineas)||p.lineas.length<2||p.lineas.length>30)return {status:"error",code:"PAYROLL_ADJUSTMENT_INVALID",message:"Planilla, referencia única, motivo y líneas de ajuste son obligatorios."};
 const lines=[];let debit=0,credit=0;for(const x of p.lineas){const account=String(x&&x.cuenta||"").trim(),name=String(x&&x.nombre||"").trim().slice(0,120),d=Number(x&&x.debe||0),h=Number(x&&x.haber||0);if(!/^[A-Za-z0-9._-]{1,20}$/.test(account)||!name||!Number.isFinite(d)||!Number.isFinite(h)||d<0||h<0||(d>0&&h>0)||(d===0&&h===0))return {status:"error",code:"PAYROLL_ADJUSTMENT_LINES_INVALID",message:"Las líneas deben tener cuentas válidas y un solo importe positivo por línea."};const rd=Math.round(d*100)/100,rh=Math.round(h*100)/100;debit+=rd;credit+=rh;lines.push({cuenta:account,nombre:name,debe:rd,haber:rh});}
 debit=Math.round(debit*100)/100;credit=Math.round(credit*100)/100;if(Math.abs(debit-credit)>0.01)return {status:"error",code:"PAYROLL_ADJUSTMENT_UNBALANCED",message:"El asiento de ajuste debe cuadrar por partida doble."};
 const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La operación está ocupada. Intente nuevamente."};
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);validatePayrollJournalAccountMap_(ss);const sh=ss.getSheetByName("PlanillasNomenclatura");if(!sh)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Planilla no disponible."};
  const col=ensurePayrollJournalLinkColumn_(sh),data=sh.getDataRange().getValues();if(!data.length||!isValidPayrollPlanHeaders_(data[0]))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"Estructura de planillas no válida."};
  const rows=data.slice(1).filter(r=>String(r[0]||"").trim()===id);if(!rows.length||rows.some(r=>String(r[15]||"").trim().toUpperCase()!=="CERRADA"))return {status:"error",code:"PAYROLL_ADJUSTMENT_REQUIRES_CLOSED_PLANILLA",message:"Solo se puede ajustar una planilla cerrada."};
  let originalId=String(rows[0][col-1]||"").trim();
  if(!originalId){const j=ss.getSheetByName("AsientosContables"),old=j?j.getDataRange().getValues().slice(1).filter(r=>String(r[3]||"").trim()==="Planillas"&&String(r[4]||"").trim()===id):[];if(old.length!==1)return {status:"error",code:"PAYROLL_JOURNAL_LINK_REQUIRED",message:"La planilla no tiene un asiento original único vinculado."};const valid=validatePayrollJournalEntry_(old[0],id,"Planillas");originalId=valid.asientoId;rows.forEach(r=>{const ix=data.findIndex(x=>x===r);sh.getRange(ix+1,col).setValue(originalId);});}
  if(rows.some(r=>String(r[col-1]||"").trim()&&String(r[col-1]||"").trim()!==originalId))return {status:"error",code:"PAYROLL_JOURNAL_LINK_CONFLICT",message:"La planilla tiene vínculos contables contradictorios."};
  const original=getPayrollJournalEntryById_(ss,originalId);if(!original)return {status:"error",code:"PAYROLL_JOURNAL_LINK_ORPHANED",message:"No se encontró el asiento original."};validatePayrollJournalEntry_(original,id,"Planillas");
  const scope=getVerifiedAccountingDepartmentScope_(p,ss,actor);if(!scope||!scope.authorized)return {status:"error",code:scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"Acceso al ámbito de la planilla denegado."};
  const employees=[...new Set(rows.map(r=>String(r[3]||"").trim()).filter(Boolean))];if(!employees.length)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Planilla no disponible."};
  for(const employeeId of employees){const access=assertResourceOwnershipForScope_(ss,scope,"EXPEDIENTE_LABORAL",employeeId,"WRITE",p);if(!access||!access.authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Planilla no disponible."};}
  const adj=ss.getSheetByName("AjustesAsientosPlanilla")||getOrCreateSheet(ss,"AjustesAsientosPlanilla"),headers=["AjusteID","PlanillaID","AsientoOriginalID","AsientoAjusteID","ReferenciaAjuste","Motivo","LineasJSON","CreadoPor","Fecha","Estado"];
  let ad=adj.getDataRange().getValues();if(!ad.length||!ad[0]||!ad[0].length||ad[0].every(x=>String(x||"").trim()==="")){adj.getRange(1,1,1,headers.length).setValues([headers]);ad=[headers];}
  if(ad[0].length!==headers.length||headers.some((h,i)=>String(ad[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"Estructura de ajustes de planilla no válida."};
  const prior=ad.slice(1).map((r,i)=>({row:r,index:i+2})).filter(x=>String(x.row[1]||"").trim()===id&&String(x.row[4]||"").trim()===ref);if(prior.length>1)return {status:"error",code:"PAYROLL_ADJUSTMENT_DUPLICATE",message:"Referencia de ajuste ambigua."};
  const journalRef=id+":"+ref,journal=getOrCreateSheet(ss,"AsientosContables"),found=journal.getDataRange().getValues().slice(1).filter(r=>String(r[3]||"").trim()==="PlanillasAjuste"&&String(r[4]||"").trim()===journalRef);if(found.length>1)return {status:"error",code:"PAYROLL_ADJUSTMENT_DUPLICATE",message:"Hay varios asientos para esta referencia."};
  if(prior.length===1&&(String(prior[0].row[2]||"").trim()!==originalId||String(prior[0].row[5]||"")!==reason||String(prior[0].row[6]||"")!==JSON.stringify(lines)))return {status:"error",code:"PAYROLL_ADJUSTMENT_REFERENCE_CONFLICT",message:"La referencia de ajuste ya existe con otros datos."};
  if(prior.length===1&&String(prior[0].row[3]||"").trim()&&!found.length)return {status:"error",code:"PAYROLL_ADJUSTMENT_LINK_ORPHANED",message:"El asiento de ajuste vinculado no existe."};
  if(found.length===1){let stored=[];try{stored=JSON.parse(found[0][5]||"[]");}catch(e){}if(JSON.stringify(stored)!==JSON.stringify(lines))return {status:"error",code:"PAYROLL_ADJUSTMENT_REFERENCE_CONFLICT",message:"El asiento de ajuste ya existe con otras líneas."};}
  let posted;if(found.length===1)posted=validatePayrollJournalEntry_(found[0],journalRef,"PlanillasAjuste");else posted=recordAccountingJournalEntry({descripcion:"Ajuste compensatorio de planilla "+id+"; asiento original "+originalId+"; motivo: "+reason,origenModulo:"PlanillasAjuste",referenciaId:journalRef,creadoPor:actor.userId,lineas:lines});
  if(!posted||posted.status!=="success"||!posted.asientoId)return {status:"error",code:"PAYROLL_ADJUSTMENT_POST_FAILED",message:"No se pudo registrar el asiento de ajuste."};
  if(prior.length===1){if(String(prior[0].row[3]||"").trim()&&String(prior[0].row[3]||"").trim()!==posted.asientoId)return {status:"error",code:"PAYROLL_ADJUSTMENT_LINK_CONFLICT",message:"Referencia de ajuste vinculada a otro asiento."};if(!String(prior[0].row[3]||"").trim())adj.getRange(prior[0].index,4).setValue(posted.asientoId);return {status:"success",ajusteId:prior[0].row[0],asientoId:posted.asientoId,asientoOriginalId:originalId,idempotent:true,message:"Ajuste compensatorio recuperado sin duplicar el asiento."};}
  const ajusteId="PAJ-"+Utilities.getUuid();adj.appendRow([ajusteId,id,originalId,posted.asientoId,ref,reason,JSON.stringify(lines),actor.userId,new Date(),"Registrado"]);
  return {status:"success",ajusteId,asientoId:posted.asientoId,asientoOriginalId:originalId,totalDebe:debit,totalHaber:credit,idempotent:false,message:"Ajuste compensatorio registrado; el asiento original permanece intacto."};
 }catch(e){return {status:"error",code:String(e&&e.message||"PAYROLL_ADJUSTMENT_FAILED").slice(0,100),message:"No fue posible registrar el ajuste contable."};}finally{lock.releaseLock();}
}

function updatePayrollPeriodStatus(payload) {
  const { planillaId, nuevoEstado, observaciones, authRole } = payload || {};
  if (!planillaId || !nuevoEstado) throw new Error("planillaId y nuevoEstado son requeridos.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "PlanillasNomenclatura");
  const data = sheet.getDataRange().getValues();
  const payrollMatches = data.slice(1).filter(r => String(r[0]||"").trim() === String(planillaId).trim() && String(r[15]||"").trim().toUpperCase() !== "REEMPLAZADA");
  if (!payrollMatches.length || new Set(payrollMatches.map(r=>String(r[2]||"").trim())).size!==1 || new Set(payrollMatches.map(r=>String(r[3]||"").trim())).size!==payrollMatches.length) throw new Error("Planilla no encontrada, duplicada o inconsistente.");
  if (new Set(payrollMatches.map(r=>String(r[15]||"").trim().toUpperCase())).size!==1) throw new Error("PAYROLL_BATCH_STATE_INCONSISTENT");
  const requestedState = String(nuevoEstado).trim().toUpperCase();
  const previousState = String(payrollMatches[0][15] || "").trim().toUpperCase();
  const terminalStates = ["ANULADA","ANULADO","REVERTIDA","REVERTIDO","CANCELADA","CANCELADO"];
  if (terminalStates.includes(previousState) && !terminalStates.includes(requestedState)) throw new Error("PAYROLL_TERMINAL_STATE");
  const actor = getVerifiedAccountingIdentity_(payload || {});
  const loanLedgerSheet = ss.getSheetByName("AmortizacionPrestamosNomina");
  const hasLoanMovements = !!(loanLedgerSheet && loanLedgerSheet.getDataRange().getValues().slice(1).some(r => String(r[2]||"").trim() === String(planillaId).trim() && ["CALCULADO","APLICADO"].includes(String(r[9]||"").trim())));
  const actorRole = String(actor && actor.role || "").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
  if (hasLoanMovements && (!actor || !actor.authorized || !["RECURSOSHUMANOS","ADMINISTRADOR"].includes(actorRole))) throw new Error("PAYROLL_LOAN_REVIEW_NOT_AUTHORIZED");
  const actorId = actor && actor.authorized ? actor.userId : "SYSTEM_PAYROLL";
  const shouldApplyPayrollLoans = ["APROBADA","CERRADA","CONTABILIZADA"].includes(requestedState);
  const shouldReversePayrollLoans = ["ANULADA","ANULADO","REVERTIDA","REVERTIDO","CANCELADA","CANCELADO"].includes(requestedState);

  let count = 0;
  let totalSalarioNeto = 0;
  let totalDeducciones = 0;
  let totalBruto = 0;
  let totalPatronalIHSS = 0;
  let totalPatronalRAP = 0;
  let totalPatronalINFOP = 0;
  let totalPatronal = 0;
  const conceptSummary = summarizePayrollConceptDetails_(ss,planillaId);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(planillaId).trim() && String(data[i][15]||"").trim().toUpperCase() !== "REEMPLAZADA") {
      const sBase = parseFloat(data[i][6] || 0);
      const mHE = parseFloat(data[i][8] || 0);
      const bonif = parseFloat(data[i][9] || 0);
      const dev = sBase + mHE + bonif;

      const ihss = parseFloat(data[i][10] || 0);
      const rap = parseFloat(data[i][11] || 0);
      const isr = parseFloat(data[i][12] || 0);
      const otras = parseFloat(data[i][13] || 0);
      const ded = ihss + rap + isr + otras;

      const neto = parseFloat(data[i][14] || (dev - ded));

      // Aportaciones patronales independientes [TASK-009]
      const pIHSS = parseFloat(data[i][16] || (Math.min(sBase, 10317.38) * 0.072));
      const pRAP = parseFloat(data[i][17] || (Math.max(0, sBase - 10317.38) * 0.015));
      const pINFOP = parseFloat(data[i][18] || (sBase * 0.01));
      const pTot = pIHSS + pRAP + pINFOP;

      totalBruto += dev;
      totalDeducciones += ded;
      totalSalarioNeto += neto;
      totalPatronalIHSS += pIHSS;
      totalPatronalRAP += pRAP;
      totalPatronalINFOP += pINFOP;
      totalPatronal += pTot;
      count++;
    }
  }

  if (count === 0) throw new Error("Planilla no encontrada.");

  totalBruto = parseFloat(totalBruto.toFixed(2));
  totalDeducciones = parseFloat(totalDeducciones.toFixed(2));
  totalSalarioNeto = parseFloat(totalSalarioNeto.toFixed(2));
  totalPatronal = parseFloat((totalPatronal + conceptSummary.employerTotal).toFixed(2));
  const totalGastoPatronal = totalPatronal;
  const totalPasivoPatronal = totalPatronal;
  const fixedGross = Math.max(0,Math.round((totalBruto-conceptSummary.incomeTotal)*100)/100);
  const fixedDeductions = Math.max(0,Math.round((totalDeducciones-conceptSummary.deductionTotal)*100)/100);
  const fixedEmployerLiability = Math.max(0,Math.round((totalPatronal-conceptSummary.employerTotal)*100)/100);

  // Validar cuadratura antes de mutar saldos de préstamos; los previews CALCULADO también se concilian.
  if (shouldApplyPayrollLoans) {
    buildPayrollJournalLines_(payrollMatches,conceptSummary,getPayrollLoanAppliedAmountForPlanilla_(ss,planillaId));
    const loanResult = applyPayrollLoanLedgerForPlanilla_(ss, planillaId, "APLICAR", actorId);
    if (!loanResult || loanResult.status !== "success") throw new Error("No fue posible aplicar la amortización de préstamos.");
  } else if (shouldReversePayrollLoans) {
    applyPayrollLoanLedgerForPlanilla_(ss,planillaId,"REVERSAR",actorId);
  }
  // Publicar/recuperar el asiento antes de confirmar el estado; permite reintentos seguros.
  let asientoRes = null;
  if (["APROBADA","CERRADA","CONTABILIZADA"].includes(requestedState)) {
    asientoRes = recordPayrollJournalEntry_(ss,planillaId,payrollMatches,conceptSummary,actor && actor.authorized ? actor.userId : "SYSTEM_PAYROLL");
  }
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]||"").trim() === String(planillaId).trim() && String(data[i][15]||"").trim().toUpperCase() !== "REEMPLAZADA") sheet.getRange(i + 1, 16).setValue(nuevoEstado);
  }

  logStructuredEvent("ACCOUNTING", "updatePayrollPeriodStatus", "INFO", "PAYROLL_STATUS_UPDATED", `Planilla ${planillaId} actualizada a estado ${nuevoEstado}`, payload, authRole);

  return {
    status: "success",
    planillaId: planillaId,
    nuevoEstado: nuevoEstado,
    registrosActualizados: count,
    asientoContable: asientoRes,
    message: `Ciclo de planilla actualizado a '${nuevoEstado}' e integrado con Contabilidad.`
  };
  } finally {
    lock.releaseLock();
  }
}
function getPayrollPeriodSummary(payload) {
  const { periodoMes, planillaId, employeeId, compararConPeriodo, umbralVariacion } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getOrCreateSheet(ss, "PlanillasNomenclatura").getDataRange().getValues().slice(1);

  let filtered = rows.filter(r=>!["REEMPLAZADA","ANULADA","ANULADO","REVERTIDA","REVERTIDO","CANCELADA","CANCELADO"].includes(normalizePayrollBatchValue_(r[15])));
  if (planillaId) filtered = filtered.filter(r => String(r[0]).trim() === String(planillaId).trim());
  if (employeeId) filtered = filtered.filter(r => String(r[3]||"").trim() === String(employeeId).trim());
  if (periodoMes) filtered = filtered.filter(r => String(r[2]).trim() === String(periodoMes).trim());

  let totalBruto = 0;
  let totalDeducciones = 0;
  let totalNeto = 0;
  let totalPatronalIHSS = 0;
  let totalPatronalRAP = 0;
  let totalPatronalINFOP = 0;
  let totalPatronal = 0;
  let totalCostoLaboralInstitucional = 0;
  const employerConceptTotals=getPayrollEmployerConceptTotalsByEmployee_(ss,[...new Set(filtered.map(r=>String(r[0]||"").trim()))]);

  const mapped = filtered.map(r => {
    const sBase = parseFloat(r[6] || 0);
    const mHE = parseFloat(r[8] || 0);
    const bonif = parseFloat(r[9] || 0);
    const dev = sBase + mHE + bonif;

    const ihss = parseFloat(r[10] || 0);
    const rap = parseFloat(r[11] || 0);
    const isr = parseFloat(r[12] || 0);
    const otras = parseFloat(r[13] || 0);
    const ded = ihss + rap + isr + otras;

    const neto = parseFloat(r[14] || (dev - ded));

    // Aportaciones patronales independientes y costo laboral institucional total [TASK-009]
    const pIHSS = parseFloat(r[16] || (Math.min(sBase, 10317.38) * 0.072));
    const pRAP = parseFloat(r[17] || (Math.max(0, sBase - 10317.38) * 0.015));
    const pINFOP = parseFloat(r[18] || (sBase * 0.01));
    const pTot = Math.round((pIHSS + pRAP + pINFOP + Number(employerConceptTotals[String(r[3]||"").trim()]||0))*100)/100;
    const cLaboral = parseFloat(r[19] || (dev + pTot));

    totalBruto += dev;
    totalDeducciones += ded;
    totalNeto += neto;
    totalPatronalIHSS += pIHSS;
    totalPatronalRAP += pRAP;
    totalPatronalINFOP += pINFOP;
    totalPatronal += pTot;
    totalCostoLaboralInstitucional += cLaboral;

    return {
      planillaId: r[0],
      fecha: r[1],
      periodoMes: r[2],
      empleadoId: r[3],
      empleadoNombre: r[4],
      puesto: r[5],
      salarioBase: sBase,
      totalDevengado: dev,
      totalDeducciones: ded,
      salarioNeto: neto,
      estadoCiclo: r[15],
      patronalIHSS: pIHSS,
      patronalRAP: pRAP,
      patronalINFOP: pINFOP,
      totalAportacionesPatronales: pTot,
      costoLaboralTotal: cLaboral
    };
  });

  let comparacion = null;
  if (compararConPeriodo) {
    const currentPeriod=String(periodoMes||mapped[0]&&mapped[0].periodoMes||"").trim(),priorPeriod=String(compararConPeriodo).trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(currentPeriod)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(priorPeriod)||currentPeriod===priorPeriod) return {status:"error",code:"PAYROLL_COMPARISON_PERIOD_INVALID",message:"Seleccione dos períodos distintos con formato AAAA-MM."};
    const priorRows=rows.filter(r=>String(r[2]||"").trim()===priorPeriod&&!["REEMPLAZADA","ANULADA","ANULADO","REVERTIDA","REVERTIDO","CANCELADA","CANCELADO"].includes(normalizePayrollBatchValue_(r[15])));
    const priorEmployerTotals=getPayrollEmployerConceptTotalsByEmployee_(ss,[...new Set(priorRows.map(r=>String(r[0]||"").trim()))]);
    const priorByEmployee=Object.create(null);priorRows.forEach(r=>{const id=String(r[3]||"").trim();if(id){if(priorByEmployee[id])priorByEmployee[id].duplicate=true;else priorByEmployee[id]=r;}});
    const threshold=Number.isFinite(Number(umbralVariacion))?Number(umbralVariacion):10,employeeVariances=[];
    mapped.forEach(employee=>{
      const prior=priorByEmployee[String(employee.empleadoId||"").trim()];
      if(!prior||prior.duplicate){employeeVariances.push({empleadoId:employee.empleadoId,empleadoNombre:employee.empleadoNombre,comparacionDisponible:false,motivo:prior?"REGISTRO_ANTERIOR_AMBIGUO":"SIN_REGISTRO_ANTERIOR"});return;}
      const priorGross=Number(prior[6]||0)+Number(prior[8]||0)+Number(prior[9]||0),priorDeductions=Number(prior[10]||0)+Number(prior[11]||0)+Number(prior[12]||0)+Number(prior[13]||0);
      const current={salarioBase:employee.salarioBase,horasExtras:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[7]||0),montoHorasExtras:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[8]||0),bonificaciones:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[9]||0),totalDevengado:employee.totalDevengado,deduccionIHSS:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[10]||0),deduccionRAP:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[11]||0),deduccionISR:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[12]||0),otrasDeducciones:Number(filtered.find(r=>String(r[3]||"")===String(employee.empleadoId))?.[13]||0),totalDeducciones:employee.totalDeducciones,salarioNeto:employee.salarioNeto,patronalIHSS:employee.patronalIHSS,patronalRAP:employee.patronalRAP,patronalINFOP:employee.patronalINFOP,totalAportacionesPatronales:employee.totalAportacionesPatronales,costoLaboralTotal:employee.costoLaboralTotal};
      const previous={salarioBase:Number(prior[6]||0),horasExtras:Number(prior[7]||0),montoHorasExtras:Number(prior[8]||0),bonificaciones:Number(prior[9]||0),totalDevengado:priorGross,deduccionIHSS:Number(prior[10]||0),deduccionRAP:Number(prior[11]||0),deduccionISR:Number(prior[12]||0),otrasDeducciones:Number(prior[13]||0),totalDeducciones:priorDeductions,salarioNeto:Number(prior[14]||0),patronalIHSS:Number(prior[16]||0),patronalRAP:Number(prior[17]||0),patronalINFOP:Number(prior[18]||0),totalAportacionesPatronales:Math.round((Number(prior[16]||0)+Number(prior[17]||0)+Number(prior[18]||0)+Number(priorEmployerTotals[String(employee.empleadoId||"").trim()]||0))*100)/100,costoLaboralTotal:Number(prior[19]||0)};
      const variance=buildPayrollVarianceReport_(current,previous,threshold),causas=getPayrollVarianceCauses_(ss,employee.empleadoId,currentPeriod,priorPeriod,filtered.find(r=>String(r[3]||"")===String(employee.empleadoId)),prior);
      employee.variacion=variance;employee.causasVariacion=causas;employee.alertaVariacion=variance.alerta;
      employeeVariances.push({empleadoId:employee.empleadoId,empleadoNombre:employee.empleadoNombre,comparacionDisponible:true,variacion:variance,causas});
    });
    const priorSummary={salarioBase:0,horasExtras:0,montoHorasExtras:0,bonificaciones:0,totalDevengado:0,deduccionIHSS:0,deduccionRAP:0,deduccionISR:0,otrasDeducciones:0,totalDeducciones:0,salarioNeto:0,patronalIHSS:0,patronalRAP:0,patronalINFOP:0,totalAportacionesPatronales:0,costoLaboralTotal:0};
    priorRows.forEach(r=>{priorSummary.salarioBase+=Number(r[6]||0);priorSummary.horasExtras+=Number(r[7]||0);priorSummary.montoHorasExtras+=Number(r[8]||0);priorSummary.bonificaciones+=Number(r[9]||0);priorSummary.totalDevengado+=Number(r[6]||0)+Number(r[8]||0)+Number(r[9]||0);priorSummary.deduccionIHSS+=Number(r[10]||0);priorSummary.deduccionRAP+=Number(r[11]||0);priorSummary.deduccionISR+=Number(r[12]||0);priorSummary.otrasDeducciones+=Number(r[13]||0);priorSummary.totalDeducciones+=Number(r[10]||0)+Number(r[11]||0)+Number(r[12]||0)+Number(r[13]||0);priorSummary.salarioNeto+=Number(r[14]||0);priorSummary.patronalIHSS+=Number(r[16]||0);priorSummary.patronalRAP+=Number(r[17]||0);priorSummary.patronalINFOP+=Number(r[18]||0);priorSummary.totalAportacionesPatronales+=Number(r[16]||0)+Number(r[17]||0)+Number(r[18]||0)+Number(priorEmployerTotals[String(r[3]||"").trim()]||0);priorSummary.costoLaboralTotal+=Number(r[19]||0);});
    const currentSummary={salarioBase:totalBruto-totalBruto+mapped.reduce((t,e)=>t+e.salarioBase,0),horasExtras:filtered.reduce((t,r)=>t+Number(r[7]||0),0),montoHorasExtras:filtered.reduce((t,r)=>t+Number(r[8]||0),0),bonificaciones:filtered.reduce((t,r)=>t+Number(r[9]||0),0),totalDevengado:totalBruto,deduccionIHSS:filtered.reduce((t,r)=>t+Number(r[10]||0),0),deduccionRAP:filtered.reduce((t,r)=>t+Number(r[11]||0),0),deduccionISR:filtered.reduce((t,r)=>t+Number(r[12]||0),0),otrasDeducciones:filtered.reduce((t,r)=>t+Number(r[13]||0),0),totalDeducciones:totalDeducciones,salarioNeto:totalNeto,patronalIHSS:totalPatronalIHSS,patronalRAP:totalPatronalRAP,patronalINFOP:totalPatronalINFOP,totalAportacionesPatronales:totalPatronal,costoLaboralTotal:totalCostoLaboralInstitucional};
    comparacion={periodoActual:currentPeriod,periodoAnterior:priorPeriod,umbralVariacion:threshold,resumen:buildPayrollVarianceReport_(currentSummary,priorSummary,threshold),empleados:employeeVariances,empleadosConAlerta:employeeVariances.filter(x=>x.variacion&&x.variacion.alerta).length};
  }

  return {
    status: "success",
    comparacion: comparacion,
    resumen: {
      totalEmpleados: mapped.length,
      totalBruto: parseFloat(totalBruto.toFixed(2)),
      totalDeducciones: parseFloat(totalDeducciones.toFixed(2)),
      totalNeto: parseFloat(totalNeto.toFixed(2)),
      totalPatronalIHSS: parseFloat(totalPatronalIHSS.toFixed(2)),
      totalPatronalRAP: parseFloat(totalPatronalRAP.toFixed(2)),
      totalPatronalINFOP: parseFloat(totalPatronalINFOP.toFixed(2)),
      totalAportacionesPatronales: parseFloat(totalPatronal.toFixed(2)),
      totalCostoLaboralInstitucional: parseFloat(totalCostoLaboralInstitucional.toFixed(2))
    },
    empleados: mapped
  };
}
function generatePayrollPeriod(payload) {
  return calculatePayrollPeriod(payload);
}

function calculateExtraordinaryPayroll(payload) {
  const { tipoBeneficio, anoLectivo, idempotencyToken, authRole } = payload || {};
  // tipoBeneficio: "DecimoTercerMes" (Aguinaldo) o "DecimoCuartoMes" (Compensación Social)
  if (!tipoBeneficio || !anoLectivo) {
    throw new Error("tipoBeneficio ('DecimoTercerMes' o 'DecimoCuartoMes') y anoLectivo son requeridos.");
  }

  const validTypes = ["DecimoTercerMes", "DecimoCuartoMes", "Aguinaldo", "Catorceavo"];
  if (validTypes.indexOf(tipoBeneficio) === -1) {
    throw new Error("tipoBeneficio no válido. Debe ser 'DecimoTercerMes' o 'DecimoCuartoMes'.");
  }

  const is13th = (tipoBeneficio === "DecimoTercerMes" || tipoBeneficio === "Aguinaldo");
  const normalizedBeneficio = is13th ? "DecimoTercerMes" : "DecimoCuartoMes";
  const periodoClave = `${normalizedBeneficio}-${anoLectivo}`;

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const planSheet = getOrCreateSheet(ss, "PlanillasNomenclatura");
    const expsRows = getOrCreateSheet(ss, "ExpedientesLaborales").getDataRange().getValues().slice(1);
    const ctrsRows = getOrCreateSheet(ss, "ContratosLaborales").getDataRange().getValues().slice(1);
    const advSheet = getOrCreateSheet(ss, "AnticiposPrestamosEmpleado");
    const advRows = advSheet.getDataRange().getValues().slice(1);
    const planData = planSheet.getDataRange().getValues();

    // Prevención de pagos duplicados para el mismo beneficio social extraordinario y año lectivo
    const existingPlan = planData.find(r => String(r[2]).trim() === periodoClave && r[15] !== "Anulada");
    if (existingPlan) {
      return {
        status: "success",
        planillaId: existingPlan[0],
        periodoBeneficio: periodoClave,
        tipoBeneficio: normalizedBeneficio,
        estadoCiclo: existingPlan[15],
        message: `La planilla extraordinaria '${periodoClave}' ya existe con estado '${existingPlan[15]}'.`
      };
    }

    const activeEmployees = expsRows.filter(r => r[8] === "active" || r[8] === "Activo" || r[8] === "EnPeriodoPrueba" || r[8] === "Desvinculado");
    if (activeEmployees.length === 0) {
      throw new Error("No hay empleados elegibles para el cálculo del beneficio extraordinario.");
    }

    const y = parseInt(anoLectivo, 10);
    // Definición legal de períodos de acumulación en Honduras:
    // 13º mes (Aguinaldo): 1 de diciembre del año anterior al 30 de noviembre del año actual (365 días)
    // 14º mes: 1 de julio del año anterior al 30 de junio del año actual (Decreto 135-94)
    let periodStart, periodEnd;
    if (is13th) {
      periodStart = new Date(y - 1, 11, 1, 0, 0, 0, 0); // 1 Dic (y-1)
      periodEnd = new Date(y, 10, 30, 23, 59, 59, 999); // 30 Nov (y)
    } else {
      periodStart = new Date(y - 1, 6, 1, 0, 0, 0, 0); // 1 Jul (y-1)
      periodEnd = new Date(y, 5, 30, 23, 59, 59, 999);  // 30 Jun (y)
    }
    const totalPeriodDays = Math.round((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1; // 365 días

    const now = new Date();
    const planillaId = `PLN-EXTRA-${is13th ? '13M' : '14M'}-${now.getTime()}`;
    const processedRows = [];
    const advUpdates = []; // { rowIdx, montoDeducido }

    function parseSafeDate(val) {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    activeEmployees.forEach(e => {
      const empExpId = String(e[0]).trim();
      const empUserId = String(e[2] || "").trim();
      const puesto = e[3] || "Personal";
      const empNombre = e[9] || e[3] || "Empleado";
      const fechaIngresoExp = parseSafeDate(e[6]);
      const fechaSalidaExp = parseSafeDate(e[7]);
      const estadoLaboral = String(e[8]).trim();

      // Consultar contrato laboral vigente o más reciente
      const empContracts = ctrsRows.filter(c => {
        const cExp = String(c[1]).trim();
        return (cExp === empExpId || (empUserId && cExp === empUserId)) && String(c[7]).toLowerCase() !== "anulado";
      });

      if (empContracts.length === 0) return; // Omitir empleados sin contrato registrado

      // Seleccionar el contrato más representativo del período
      const activeContract = empContracts[empContracts.length - 1];
      const contractualSalary = parseFloat(activeContract[5] || 0);
      if (contractualSalary <= 0) return;

      // Calcular intervalo efectivo laborado dentro del período de acumulación
      let effStart = periodStart;
      let effEnd = periodEnd;

      if (fechaIngresoExp && fechaIngresoExp > effStart) effStart = fechaIngresoExp;
      if (fechaSalidaExp && fechaSalidaExp < effEnd) effEnd = fechaSalidaExp;

      // Si el empleado ingresó después del fin del período o salió antes del inicio, no acumula
      if (effStart > periodEnd || (fechaSalidaExp && fechaSalidaExp < periodStart)) {
        return;
      }

      let daysWorkedInPeriod = Math.max(0, Math.round((effEnd - effStart) / (1000 * 60 * 60 * 24)) + 1);
      if (daysWorkedInPeriod > totalPeriodDays) daysWorkedInPeriod = totalPeriodDays;
      if (daysWorkedInPeriod <= 0) return;

      // Cálculo del monto bruto del beneficio social (Aguinaldo o Décimo Cuarto Mes):
      // Si laboró el período completo de 12 meses -> salario ordinario mensual completo
      // Si laboró fraccionado -> proporcional a los días laborados
      const montoBrutoBeneficio = parseFloat(((contractualSalary / totalPeriodDays) * daysWorkedInPeriod).toFixed(2));

      // 2. Consulta y deducción de anticipos otorgados previamente sobre este beneficio
      let anticiposAplicables = 0;
      advRows.forEach((r, idx) => {
        const aEmp = String(r[2]).trim();
        const aTipo = String(r[3]).trim().toLowerCase();
        const aSaldo = parseFloat(r[8] || 0);
        const aState = String(r[9]).trim();
        const matchesEmp = (aEmp === empExpId || (empUserId && aEmp === empUserId));

        const isAdvanceForBenefit = (is13th && (aTipo.includes("aguinaldo") || aTipo.includes("13"))) ||
                                   (!is13th && (aTipo.includes("decimocuarto") || aTipo.includes("14") || aTipo.includes("catorce")));

        if (matchesEmp && isAdvanceForBenefit && aSaldo > 0 && (aState === "Aprobado" || aState === "Aprobada")) {
          const deduction = Math.min(aSaldo, montoBrutoBeneficio - anticiposAplicables);
          if (deduction > 0) {
            anticiposAplicables += deduction;
            advUpdates.push({ rowIdx: idx + 2, montoDeducido: deduction, saldoRestante: aSaldo - deduction, planillaId: planillaId });
          }
        }
      });
      anticiposAplicables = parseFloat(anticiposAplicables.toFixed(2));

      // 3. Exenciones de Ley en Honduras:
      // El 13º y 14º Mes están totalmente exentos de deducciones de IHSS y RAP, y de ISR hasta los límites legales.
      const dedIHSS = 0;
      const dedRAP = 0;
      const dedISR = 0;
      const otrasDed = anticiposAplicables; // Descuento exclusivo de anticipos del beneficio

      const totalDevengado = montoBrutoBeneficio;
      const totalDeducciones = otrasDed;
      const salarioNeto = parseFloat(Math.max(0, totalDevengado - totalDeducciones).toFixed(2));

      // Las aportaciones patronales ordinarias (IHSS, RAP, INFOP) tampoco aplican sobre el 13º y 14º mes en Honduras
      const patronalIHSS = 0;
      const patronalRAP = 0;
      const patronalINFOP = 0;
      const costoLaboralTotal = totalDevengado;

      processedRows.push([
        planillaId,
        now,
        periodoClave,
        empExpId,
        empNombre,
        `${puesto} (${normalizedBeneficio})`,
        montoBrutoBeneficio,
        0, // Horas extras
        0, // Monto horas extras
        0, // Bonificaciones
        dedIHSS,
        dedRAP,
        dedISR,
        otrasDed, // Anticipos descontados
        salarioNeto,
        "Calculada",
        patronalIHSS,
        patronalRAP,
        patronalINFOP,
        costoLaboralTotal
      ]);
    });

    if (processedRows.length > 0) {
      planSheet.getRange(planSheet.getLastRow() + 1, 1, processedRows.length, 20).setValues(processedRows);

      // Marcar y descontar saldo de anticipos procesados
      advUpdates.forEach(u => {
        advSheet.getRange(u.rowIdx, 9).setValue(u.saldoRestante); // SaldoPendiente
        const curObs = String(advSheet.getRange(u.rowIdx, 12).getValue() || "");
        advSheet.getRange(u.rowIdx, 12).setValue(curObs + ` [LIQUIDADO_EXTRAORDINARIO_${u.planillaId}: L ${u.montoDeducido}]`);
      });
    }

    return {
      status: "success",
      planillaId: planillaId,
      periodoBeneficio: periodoClave,
      tipoBeneficio: normalizedBeneficio,
      anoLectivo: y,
      empleadosProcesados: processedRows.length,
      totalMontoBruto: processedRows.reduce((acc, r) => acc + r[6], 0),
      totalAnticiposDeducidos: processedRows.reduce((acc, r) => acc + r[13], 0),
      totalNetoAPagar: processedRows.reduce((acc, r) => acc + r[14], 0),
      estadoCiclo: "Calculada",
      message: `Planilla extraordinaria de ${normalizedBeneficio} para el año ${anoLectivo} procesada con éxito.`
    };
  } finally {
    lock.releaseLock();
  }
}

function getEmployeeLoansAdvances(payload) {
  const p = payload || {}, actor = getVerifiedAccountingIdentity_(p);
  if (!actor.authorized) return { status: "error", code: actor.code || "VERIFIED_IDENTITY_REQUIRED", message: "Acceso denegado." };
  const role = String(actor.role || "").toUpperCase().replace(/[ÁÀÄ]/g, "A").replace(/[ÉÈË]/g, "E").replace(/[ÍÌÏ]/g, "I").replace(/[ÓÒÖ]/g, "O").replace(/[ÚÙÜ]/g, "U").replace(/Ñ/g, "N").replace(/[^A-Z0-9]/g, "");
  const self = ["EMPLEADO", "TRABAJADOR", "PERSONAL"].indexOf(role) !== -1;
  if (!self && ["RECURSOSHUMANOS", "ADMINISTRADOR"].indexOf(role) === -1) return { status: "error", code: "ROLE_NOT_ALLOWED", message: "Acceso denegado." };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID), empty = () => ({ status: "success", solicitudes: [] });
  const sheet = ss.getSheetByName("AnticiposPrestamosEmpleado");
  if (!sheet) return empty();
  const data = sheet.getDataRange().getValues();
  const headers = ["PrestamoID", "Fecha", "EmpleadoId", "Tipo", "MontoSolicitado", "MontoAprobado", "PlazoCuotas", "CuotaMensual", "SaldoPendiente", "EstadoAprobacion", "AprobadoPor", "Observaciones"];
  if (!data.length || !Array.isArray(data[0]) || data[0].length !== headers.length || headers.some((h, i) => String(data[0][i] || "").trim().toUpperCase() !== h.toUpperCase())) {
    return { status: "error", code: "RESOURCE_SCHEMA_INVALID", message: "La estructura de anticipos y préstamos no es válida." };
  }

  const employeeSheet = ss.getSheetByName("ExpedientesLaborales");
  if (!employeeSheet) return empty();
  const employeeData = employeeSheet.getDataRange().getValues();
  const employeeHeaders = ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"];
  if (!employeeData.length || !Array.isArray(employeeData[0]) || employeeData[0].length !== employeeHeaders.length || employeeHeaders.some((h, i) => String(employeeData[0][i] || "").trim().toUpperCase() !== h.toUpperCase())) {
    return { status: "error", code: "RESOURCE_SCHEMA_INVALID", message: "La estructura de expedientes laborales no es válida." };
  }

  const employeeRows = employeeData.slice(1), userCounts = Object.create(null), expedienteCounts = Object.create(null), expedienteByUser = Object.create(null);
  employeeRows.forEach(r => {
    const expedienteId = String(r[0] || "").trim(), userId = String(r[2] || "").trim();
    if (expedienteId) expedienteCounts[expedienteId] = (expedienteCounts[expedienteId] || 0) + 1;
    if (userId) userCounts[userId] = (userCounts[userId] || 0) + 1;
  });
  employeeRows.forEach(r => {
    const expedienteId = String(r[0] || "").trim(), userId = String(r[2] || "").trim();
    if (expedienteId && userId && expedienteCounts[expedienteId] === 1 && userCounts[userId] === 1) expedienteByUser[userId] = expedienteId;
  });

  const requestedUser = String(p.empleadoId || "").trim(), requestedLoan = String(p.prestamoId || "").trim();
  const targetUser = self ? actor.userId : requestedUser;
  if (self && requestedUser && requestedUser !== actor.userId) return { status: "error", code: "RESOURCE_NOT_FOUND", message: "No existen solicitudes disponibles." };
  if (targetUser && !expedienteByUser[targetUser]) return { status: "error", code: "RESOURCE_NOT_FOUND", message: "No existen solicitudes disponibles." };

  const accessCache = Object.create(null);
  const allowedUser = userId => {
    userId = String(userId || "").trim();
    if (!userId || !expedienteByUser[userId]) return false;
    if (!Object.prototype.hasOwnProperty.call(accessCache, userId)) accessCache[userId] = assertEmployeeExpedienteScopeAccess_(p, ss, expedienteByUser[userId]);
    return !!accessCache[userId].authorized;
  };
  if (targetUser && !allowedUser(targetUser)) return { status: "error", code: "RESOURCE_NOT_FOUND", message: "No existen solicitudes disponibles." };

  const rows = data.slice(1), loanCounts = Object.create(null);
  rows.forEach(r => { const id = String(r && r[0] || "").trim(); if (id) loanCounts[id] = (loanCounts[id] || 0) + 1; });
  let filtered = rows.filter(r => {
    if (!Array.isArray(r) || r.length < headers.length) return false;
    const id = String(r[0] || "").trim(), userId = String(r[2] || "").trim();
    if (!id || loanCounts[id] !== 1 || !userId || (targetUser && userId !== targetUser)) return false;
    if (requestedLoan && id !== requestedLoan) return false;
    if (p.estadoAprobacion && String(r[9] || "").trim() !== String(p.estadoAprobacion).trim()) return false;
    return allowedUser(userId);
  });
  if (requestedLoan && !filtered.length) return { status: "error", code: "RESOURCE_NOT_FOUND", message: "No existen solicitudes disponibles." };

  const mapped = filtered.map(r => ({
    prestamoId: r[0], fecha: r[1], empleadoId: r[2], tipo: r[3],
    montoSolicitado: parseFloat(r[4] || 0), montoAprobado: parseFloat(r[5] || 0),
    plazoCuotas: parseInt(r[6] || 1), cuotaMensual: parseFloat(r[7] || 0),
    saldoPendiente: parseFloat(r[8] || 0), estadoAprobacion: r[9],
    aprobadoPor: r[10], observaciones: r[11]
  }));
  return { status: "success", solicitudes: mapped };
}

function getPayrollLoanLedger_(ss) {
  const headers = ["MovimientoID","PrestamoID","PlanillaID","Periodo","EmpleadoId","Monto","SaldoAntes","SaldoDespues","CuotaNumero","Evento","Fecha","ActorId","ReversaDe","Detalle"];
  const sheet = ss.getSheetByName("AmortizacionPrestamosNomina") || getOrCreateSheet(ss, "AmortizacionPrestamosNomina");
  let data = sheet.getDataRange().getValues();
  if (!data.length || !data[0] || !data[0].length) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    data = [headers];
  }
  if (data[0].length !== headers.length || headers.some((h,i)=>String(data[0][i]||"").trim().toUpperCase()!==h.toUpperCase())) throw new Error("RESOURCE_SCHEMA_INVALID: AmortizacionPrestamosNomina");
  return {sheet,headers,rows:data.slice(1)};
}

function appendPayrollLoanLedgerEvents_(ss, events) {
  if (!events || !events.length) return 0;
  const ledger = getPayrollLoanLedger_(ss);
  const start = ledger.sheet.getLastRow()+1;
  ledger.sheet.getRange(start,1,events.length,ledger.headers.length).setValues(events);
  return events.length;
}

function calculatePayrollLoanDeductions_(ss, employeeId, period, planillaId, netAvailable) {
  const loanSheet=ss.getSheetByName("AnticiposPrestamosEmpleado");
  if(!loanSheet)return {total:0,events:[]};
  const data=loanSheet.getDataRange().getValues(),h=["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"];
  if(!data.length||!data[0]||data[0].length!==h.length||h.some((x,i)=>String(data[0][i]||"").trim().toUpperCase()!==x.toUpperCase()))throw new Error("RESOURCE_SCHEMA_INVALID: AnticiposPrestamosEmpleado");
  const ledger=getPayrollLoanLedger_(ss),counts=Object.create(null);
  data.slice(1).forEach(r=>{const id=String(r&&r[0]||"").trim();if(id)counts[id]=(counts[id]||0)+1;});
  const rows=ledger.rows,events=[],target=String(employeeId||"").trim(),available=Math.max(0,Number(netAvailable)||0);
  let remaining=available,total=0;
  if(!target||!remaining)return {total:0,events:[]};
  data.slice(1).forEach(r=>{
    const id=String(r[0]||"").trim(),owner=String(r[2]||"").trim(),state=String(r[9]||"").trim().toUpperCase();
    if(!id||counts[id]!==1||owner!==target||!["APROBADO","APROBADA","ACTIVE","ACTIVO"].includes(state))return;
    const balance=Number(r[8]),approved=Number(r[5]),terms=Number(r[6]),monthly=Number(r[7]);
    if(!Number.isFinite(balance)||balance<=0||!Number.isFinite(approved)||approved<=0||!Number.isInteger(terms)||terms<1||!Number.isFinite(monthly)||monthly<=0)return;
    const samePeriod=rows.filter(x=>String(x[1]||"").trim()===id&&String(x[3]||"").trim()===String(period).trim());
    const cancelled=new Set(samePeriod.filter(x=>String(x[9]||"")==="CANCELADO").map(x=>String(x[12]||"")));
    const activePreview=samePeriod.some(x=>String(x[9]||"")==="CALCULADO"&&!cancelled.has(String(x[0]||"")));
    const applied=samePeriod.filter(x=>String(x[9]||"")==="APLICADO");
    const reversed=new Set(samePeriod.filter(x=>String(x[9]||"")==="REVERSADO").map(x=>String(x[12]||"")));
    const activeApplied=applied.some(x=>!reversed.has(String(x[0]||"")));
    if(activePreview||activeApplied)return;
    const paidEvents=rows.filter(x=>String(x[1]||"").trim()===id&&String(x[9]||"")==="APLICADO");
    const reversedAll=new Set(rows.filter(x=>String(x[9]||"")==="REVERSADO").map(x=>String(x[12]||"")));
    const paid=paidEvents.filter(x=>!reversedAll.has(String(x[0]||""))).length;
    const isAdvance=String(r[3]||"").toLowerCase().includes("anticipo");
    const installment=isAdvance?balance:Math.min(balance,monthly);
    if(remaining+0.005<installment)return;
    const amount=Math.round(installment*100)/100;
    if(amount<=0)return;
    const after=Math.round((balance-amount)*100)/100;
    const movementId="PLM-"+Utilities.getUuid();
    events.push([movementId,id,planillaId,String(period),owner,amount,balance,after,paid+1,"CALCULADO",new Date(),"", "", ""]);
    total=Math.round((total+amount)*100)/100;remaining=Math.max(0,Math.round((remaining-amount)*100)/100);
  });
  return {total,events};
}

function applyPayrollLoanLedgerForPlanilla_(ss,planillaId,action,actorId) {
  const ledgerSheet=ss.getSheetByName("AmortizacionPrestamosNomina");
  if(!ledgerSheet)return {status:"success",applied:0,reversed:0,cancelled:0};
  const ledger=getPayrollLoanLedger_(ss),loanSheet=ss.getSheetByName("AnticiposPrestamosEmpleado");
  if(!loanSheet&&ledger.rows.some(r=>String(r[2]||"")===String(planillaId)))throw new Error("RESOURCE_NOT_FOUND: AnticiposPrestamosEmpleado");
  const loans=loanSheet?loanSheet.getDataRange().getValues():[];
  const h=["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"];
  if(loans.length&&(!loans[0]||loans[0].length!==h.length||h.some((x,i)=>String(loans[0][i]||"").trim().toUpperCase()!==x.toUpperCase())))throw new Error("RESOURCE_SCHEMA_INVALID: AnticiposPrestamosEmpleado");
  const rows=ledger.rows.filter(r=>String(r[2]||"").trim()===String(planillaId).trim()),events=ledger.rows;
  let applied=0,reversed=0,cancelled=0;
  const findLoan=id=>{const matches=loans.slice(1).map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[0]||"").trim()===id);return matches.length===1?matches[0]:null;};
  const append=(preview,event,before,after,reverseOf,detail)=>appendPayrollLoanLedgerEvents_(ss,[[ "PLM-"+Utilities.getUuid(),preview[1],preview[2],preview[3],preview[4],preview[5],before,after,preview[8],event,new Date(),String(actorId||"SYSTEM_PAYROLL"),String(reverseOf||""),String(detail||"") ]]);
  if(action==="APLICAR"){
    rows.filter(r=>String(r[9]||"")==="CALCULADO").forEach(preview=>{
      const cancelledEvent=events.find(x=>String(x[9]||"")==="CANCELADO"&&String(x[12]||"")===String(preview[0]));
      if(cancelledEvent)return;
      const appliedEvent=events.find(x=>String(x[9]||"")==="APLICADO"&&String(x[12]||"")===String(preview[0]));
      if(appliedEvent){
        const reversedEvent=events.find(x=>String(x[9]||"")==="REVERSADO"&&String(x[12]||"")===String(appliedEvent[0]));
        if(reversedEvent)return;
        const match=findLoan(String(preview[1]||"").trim());if(!match)throw new Error("LOAN_RESOURCE_NOT_FOUND");
        const current=Number(match.r[8]),before=Number(appliedEvent[6]),after=Number(appliedEvent[7]);
        if(Math.abs(current-before)<0.005){const updated=match.r.slice();updated[8]=after;updated[9]=after===0?"Liquidado":"Aprobado";loanSheet.getRange(match.index,1,1,updated.length).setValues([updated]);}
        else if(Math.abs(current-after)>=0.005&&current>after)throw new Error("LOAN_BALANCE_RECONCILIATION_REQUIRED");
        return;
      }
      const match=findLoan(String(preview[1]||"").trim());if(!match)throw new Error("LOAN_RESOURCE_NOT_FOUND");
      const amount=Number(preview[5]),current=Number(match.r[8]),loanState=String(match.r[9]||"").trim().toUpperCase();
      if(!["APROBADO","APROBADA","ACTIVE","ACTIVO"].includes(loanState))throw new Error("LOAN_NOT_ACTIVE_RECALCULATE");
      const isAdvance=String(match.r[3]||"").toLowerCase().includes("anticipo"),monthly=Number(match.r[7]),expectedInstallment=isAdvance?current:Math.min(current,monthly);
      if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(current)||current+0.005<amount)throw new Error("LOAN_BALANCE_CHANGED_RECALCULATE");
      if(!Number.isFinite(expectedInstallment)||expectedInstallment<=0||Math.abs(amount-expectedInstallment)>0.005)throw new Error("LOAN_TERMS_CHANGED_RECALCULATE");
      const after=Math.round((current-amount)*100)/100;
      append(preview,"APLICADO",current,after,preview[0]);
      const updated=match.r.slice();updated[8]=after;updated[9]=after===0?"Liquidado":"Aprobado";
      loanSheet.getRange(match.index,1,1,updated.length).setValues([updated]);applied++;
    });
  }else if(action==="REVERSAR"){
    const appliedEvents=rows.filter(r=>String(r[9]||"")==="APLICADO"),reversedAppliedIds=new Set(events.filter(x=>String(x[9]||"")==="REVERSADO").map(x=>String(x[12]||"")));
    appliedEvents.forEach(event=>{
      if(reversedAppliedIds.has(String(event[0])))return;
      const match=findLoan(String(event[1]||"").trim());if(!match)throw new Error("LOAN_RESOURCE_NOT_FOUND");
      const amount=Number(event[5]),current=Number(match.r[8]);if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(current))throw new Error("LOAN_DATA_INVALID");
      const after=Math.round((current+amount)*100)/100;
      append(event,"REVERSADO",current,after,event[0]);reversedAppliedIds.add(String(event[0]));
      const updated=match.r.slice();updated[8]=after;updated[9]=after>0?"Aprobado":"Liquidado";
      loanSheet.getRange(match.index,1,1,updated.length).setValues([updated]);reversed++;
    });
    rows.filter(r=>String(r[9]||"")==="CALCULADO").forEach(preview=>{
      if(events.some(x=>String(x[9]||"")==="CANCELADO"&&String(x[12]||"")===String(preview[0])))return;
      const appliedEvent=events.find(x=>String(x[9]||"")==="APLICADO"&&String(x[12]||"")===String(preview[0]));
      if(appliedEvent&&!reversedAppliedIds.has(String(appliedEvent[0])))return;
      append(preview,"CANCELADO",Number(preview[6]),Number(preview[6]),preview[0]);cancelled++;
    });
  }else throw new Error("PAYROLL_LOAN_ACTION_INVALID");
  return {status:"success",applied,reversed,cancelled};
}

function manageEmployeeLoanAdvance(payload) {
  const p=payload||{},actor=getVerifiedAccountingIdentity_(p);
  if(!actor||!actor.authorized)return {status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
  const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
  if(!["RECURSOSHUMANOS","ADMINISTRADOR"].includes(role))return {status:"error",code:"ROLE_NOT_ALLOWED",message:"Acceso denegado."};
  const id=String(p.prestamoId||"").trim(),action=String(p.accion||"").trim().toUpperCase(),reason=String(p.motivo||p.observaciones||"").trim().slice(0,500);
  if(!id||!["SUSPENDER","REANUDAR","RENEGOCIAR","LIQUIDAR_ANTICIPADAMENTE"].includes(action))return {status:"error",code:"LOAN_MANAGEMENT_INVALID",message:"La operación solicitada no es válida."};
  if(reason.length<10)return {status:"error",code:"LOAN_MANAGEMENT_REASON_REQUIRED",message:"Se requiere una justificación documentada de al menos 10 caracteres."};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=ss.getSheetByName("AnticiposPrestamosEmpleado");
  if(!sheet)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Préstamo no disponible."};
  const headers=["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],initial=sheet.getDataRange().getValues();
  if(!initial.length||!initial[0]||initial[0].length!==headers.length||headers.some((h,i)=>String(initial[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de anticipos y préstamos no es válida."};
  const found=initial.slice(1).map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[0]||"").trim()===id);
  if(found.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Préstamo no disponible."};
  const access=resolveEmployeeLoanAdvanceAccess_(p,ss,String(found[0].r[2]||"").trim(),true);
  if(!access.authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Préstamo no disponible."};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La operación está ocupada. Intente nuevamente."};
  try{
    const data=sheet.getDataRange().getValues(),matches=data.slice(1).map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[0]||"").trim()===id);
    if(matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Préstamo no disponible."};
    const current=matches[0],row=current.r.slice(),balance=Number(row[8]),state=String(row[9]||"").trim().toUpperCase();
    const lockedAccess=resolveEmployeeLoanAdvanceAccess_(p,ss,String(row[2]||"").trim(),true);
    if(!lockedAccess.authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Préstamo no disponible."};
    if(!Number.isFinite(balance)||balance<0)return {status:"error",code:"LOAN_DATA_INVALID",message:"El saldo del préstamo no es válido."};
    const updated=row.slice();let event=action,detail=reason;
    if(action==="SUSPENDER"){
      if(!["APROBADO","APROBADA","ACTIVE","ACTIVO"].includes(state))return {status:"error",code:"LOAN_STATE_INVALID",message:"Solo se pueden suspender obligaciones activas."};
      updated[9]="Suspendido";
    }else if(action==="REANUDAR"){
      if(state!=="SUSPENDIDO")return {status:"error",code:"LOAN_STATE_INVALID",message:"La obligación no está suspendida."};
      updated[9]="Aprobado";
    }else if(action==="RENEGOCIAR"){
      if(!["APROBADO","APROBADA","ACTIVE","ACTIVO","SUSPENDIDO"].includes(state))return {status:"error",code:"LOAN_STATE_INVALID",message:"La obligación no admite renegociación en su estado actual."};
      const terms=Number(p.nuevoPlazoCuotas);
      if(!Number.isInteger(terms)||terms<1||terms>120||balance<=0)return {status:"error",code:"LOAN_RENEGOTIATION_INVALID",message:"El nuevo plazo debe ser entero entre 1 y 120 y el saldo debe ser positivo."};
      updated[6]=terms;updated[7]=Math.round(balance/terms*100)/100;
      detail="Nuevo plazo: "+terms+" cuotas; cuota recalculada: "+updated[7]+". Motivo: "+reason;
    }else{
      const paid=Number(p.montoPago),reference=String(p.referenciaPago||"").trim().slice(0,120);
      if(!["APROBADO","APROBADA","ACTIVE","ACTIVO","SUSPENDIDO"].includes(state)||balance<=0)return {status:"error",code:"LOAN_STATE_INVALID",message:"La obligación no admite liquidación anticipada."};
      if(!Number.isFinite(paid)||Math.abs(paid-balance)>0.005||!reference)return {status:"error",code:"LOAN_SETTLEMENT_INVALID",message:"La liquidación debe cubrir exactamente el saldo y aportar una referencia de pago."};
      updated[8]=0;updated[9]="Liquidado";
      detail="Referencia de pago: "+reference+"; monto: "+balance+". Motivo: "+reason;
    }
    const note=("["+new Date().toISOString()+"] "+action+" por "+String(actor.userId||"")+": "+detail).slice(-450);
    updated[11]=(String(row[11]||"")+"\n"+note).trim().slice(-500);
    const ledger=getPayrollLoanLedger_(ss),duplicateToken=String(p.idempotencyToken||"").trim();
    if(duplicateToken&&ledger.rows.some(r=>String(r[13]||"").includes("IDEMPOTENCY:"+duplicateToken)))return {status:"error",code:"LOAN_MANAGEMENT_DUPLICATE",message:"La operación ya fue registrada."};
    const movement=["PLM-"+Utilities.getUuid(),id,"","",String(row[2]||""),Math.round((balance-Number(updated[8]))*100)/100,balance,Number(updated[8]),0,event,new Date(),String(actor.userId||""),"",detail+(duplicateToken?" | IDEMPOTENCY:"+duplicateToken:"")];
    appendPayrollLoanLedgerEvents_(ss,[movement]);
    sheet.getRange(current.index,1,1,updated.length).setValues([updated]);
    return {status:"success",prestamoId:id,accion:action,saldoPendiente:Number(updated[8]),estadoAprobacion:updated[9],plazoCuotas:updated[6],cuotaMensual:updated[7],message:"La obligación fue actualizada con justificación y movimiento de auditoría."};
  }catch(e){return {status:"error",code:"LOAN_MANAGEMENT_WRITE_FAILED",message:"No fue posible completar la administración de la obligación."};}finally{lock.releaseLock();}
}

function getLoanAmortizationSchedule(payload) {
  const p = payload || {}, prestamoId = String(p.prestamoId || "").trim();
  if (!prestamoId) return { status: "error", code: "RESOURCE_NOT_FOUND", message: "Préstamo no disponible." };
  const res = getEmployeeLoansAdvances(Object.assign({}, p, { prestamoId: prestamoId }));
  if (!res || res.status !== "success") return res || { status: "error", code: "RESOURCE_NOT_FOUND", message: "Préstamo no disponible." };
  const matches = (res.solicitudes || []).filter(item => String(item.prestamoId || "").trim() === prestamoId);
  if (matches.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND", message: "Préstamo no disponible." };
  const item = matches[0], schedule = [], monthly = Number(item.cuotaMensual || 0), balance = Number(item.saldoPendiente || 0);
  if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(balance) || balance < 0) return { status: "error", code: "LOAN_DATA_INVALID", message: "Los datos de amortización no son válidos." };
  let paid = 0;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID), ledgerSheet = ss.getSheetByName("AmortizacionPrestamosNomina");
  if (ledgerSheet) {
    const ledger = getPayrollLoanLedger_(ss);
    const applied = ledger.rows.filter(r => String(r[1]||"").trim() === prestamoId && String(r[9]||"") === "APLICADO");
    const reversed = new Set(ledger.rows.filter(r => String(r[9]||"") === "REVERSADO").map(r => String(r[12]||"")));
    paid = applied.filter(r => !reversed.has(String(r[0]||""))).length;
  }
  let remaining = Math.ceil((balance - 0.000001) / monthly);
  for (let i = 1; i <= remaining; i++) {
    const amount = Math.round(Math.min(monthly, balance - schedule.reduce((sum, x) => sum + x.montoCuota, 0)) * 100) / 100;
    if (amount <= 0) break;
    const rest = Math.max(0, Math.round((balance - schedule.reduce((sum, x) => sum + x.montoCuota, 0) - amount) * 100) / 100);
    schedule.push({ numeroCuota: paid + i, montoCuota: amount, saldoRestante: rest });
  }
  return { status: "success", prestamoId: prestamoId, montoAprobado: item.montoAprobado, saldoPendiente: balance, plazoCuotas: item.plazoCuotas, cuotasPagadas: paid, cuotasRestantes: schedule.length, tablaAmortizacion: schedule };
}

function generatePayrollReceiptPDF(payload) {
  const p=payload||{},actor=getVerifiedAccountingIdentity_(p);
  if(!actor.authorized)return {status:"error",code:actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
  const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
  const selfRole=["EMPLEADO","TRABAJADOR","PERSONAL","PROFESOR"].indexOf(role)!==-1;
  if(!selfRole&&["RECURSOSHUMANOS","ADMINISTRADOR"].indexOf(role)===-1)return {status:"error",code:"ROLE_NOT_ALLOWED",message:"Acceso denegado."};
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La generación está ocupada; intente nuevamente."};
  let temporaryDocumentFile=null,generatedPdfFile=null;
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),expSheet=ss.getSheetByName("ExpedientesLaborales"),planSheet=ss.getSheetByName("PlanillasNomenclatura");
    if(!expSheet||!planSheet)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    const expData=expSheet.getDataRange().getValues(),expHeaders=["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"];
    if(!expData.length||JSON.stringify(expData[0].map(String))!==JSON.stringify(expHeaders))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de expedientes laborales no es válida."};
    const expRows=expData.slice(1),userCounts=Object.create(null),expCounts=Object.create(null);
    expRows.forEach(r=>{const e=String(r[0]||"").trim(),u=String(r[2]||"").trim();if(e)expCounts[e]=(expCounts[e]||0)+1;if(u)userCounts[u]=(userCounts[u]||0)+1;});
    let targetExpedienteId="";
    if(selfRole){
      const own=expRows.filter(r=>String(r[2]||"").trim()===actor.userId&&expCounts[String(r[0]||"").trim()]===1);
      if(own.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
      targetExpedienteId=String(own[0][0]).trim();
      const supplied=String(p.empleadoId||p.expedienteId||"").trim();
      if(supplied&&supplied!==actor.userId&&supplied!==targetExpedienteId)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    }else{
      const supplied=String(p.empleadoId||p.expedienteId||"").trim();
      if(!supplied)return {status:"error",code:"EMPLOYEE_ID_REQUIRED",message:"Seleccione un expediente laboral."};
      const matches=expRows.filter(r=>String(r[0]||"").trim()===supplied||String(r[2]||"").trim()===supplied);
      if(matches.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
      targetExpedienteId=String(matches[0][0]).trim();
    }
    const targetRows=expRows.filter(r=>String(r[0]||"").trim()===targetExpedienteId);
    if(targetRows.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    const targetUserId=String(targetRows[0][2]||"").trim();
    if(!targetUserId||userCounts[targetUserId]!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    const access=assertEmployeeExpedienteScopeAccess_(p,ss,targetExpedienteId);
    if(!access.authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};

    const planData=planSheet.getDataRange().getValues(),planHeaders=["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"];
    if(!planData.length||!isValidPayrollPlanHeaders_(planData[0]))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de planillas no es válida."};
    const planRows=planData.slice(1),requestedPlanilla=String(p.planillaId||"").trim(),requestedPeriod=String(p.periodoMes||"").trim();
    if(!requestedPlanilla&&!requestedPeriod)return {status:"error",code:"PLANILLA_SELECTION_REQUIRED",message:"Indique el periodo o la planilla."};
    const matchingPlans=planRows.filter(r=>String(r[3]||"").trim()===targetExpedienteId&&(!requestedPlanilla||String(r[0]||"").trim()===requestedPlanilla)&&(!requestedPeriod||String(r[2]||"").trim()===requestedPeriod));
    if(matchingPlans.length!==1)return {status:"error",code:matchingPlans.length?"PLANILLA_SELECTION_REQUIRED":"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible o requiere seleccionar una planilla."};
    const plan=matchingPlans[0],planillaId=String(plan[0]||"").trim();
    if(!planillaId||planRows.filter(r=>String(r[0]||"").trim()===planillaId&&String(r[3]||"").trim()===targetExpedienteId&&String(r[2]||"").trim()===String(plan[2]||"").trim()).length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    if(p._requireClosedForDistribution===true&&String(plan[15]||"").trim().toUpperCase()!=="CERRADA")return {status:"error",code:"PAYROLL_NOT_CLOSED",message:"La distribución requiere una planilla cerrada."};
    const visiblePayrollConcepts=[];
    const conceptDetailSheet=ss.getSheetByName("DetalleConceptosPlanilla");
    if(conceptDetailSheet){
      const conceptDetails=conceptDetailSheet.getDataRange().getValues(),conceptHeaders=getPayrollConceptDetailHeaders_();
      if(!conceptDetails.length||!conceptDetails[0]||conceptDetails[0].length!==conceptHeaders.length||conceptHeaders.some((h,i)=>String(conceptDetails[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"El detalle de conceptos de planilla no es válido."};
      conceptDetails.slice(1).filter(r=>String(r[1]||"").trim()===planillaId&&String(r[3]||"").trim()===targetExpedienteId&&(r[12]===true||String(r[12]).toUpperCase()==="TRUE")&&String(r[19]||"").trim().toUpperCase()!=="CANCELADO").forEach(r=>visiblePayrollConcepts.push({nombre:String(r[5]||r[4]||""),monto:Number(r[10]||0),categoria:String(r[6]||"")}));
    }

    const boletaSheet=getOrCreateSheet(ss,"BoletasPago");
    let boletaData=boletaSheet.getDataRange().getValues();
    const boletaHeaders=["BoletaID","PlanillaID","FechaEmision","EmpleadoId","EmpleadoNombre","PeriodoMes","TotalDevengado","TotalDeducciones","NetoAPagar","EstadoBoleta"],fileHeaders=boletaHeaders.concat(["DriveFileId"]);
    const actualHeaders=boletaData.length?boletaData[0].map(String):[];
    if(JSON.stringify(actualHeaders)===JSON.stringify(boletaHeaders)){boletaSheet.getRange(1,11).setValue("DriveFileId");boletaData=boletaSheet.getDataRange().getValues();}
    else if(JSON.stringify(actualHeaders)!==JSON.stringify(fileHeaders))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de boletas de pago no es válida."};
    const boletaRows=boletaData.slice(1),matchingBoletas=boletaRows.map((r,i)=>({row:r,rowIndex:i+2})).filter(x=>String(x.row[1]||"").trim()===planillaId&&String(x.row[3]||"").trim()===targetExpedienteId&&String(x.row[5]||"").trim()===String(plan[2]||"").trim());
    if(matchingBoletas.length>1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    const boletaRecord=matchingBoletas.length?matchingBoletas[0]:null;
    let boletaId=boletaRecord?String(boletaRecord.row[0]||"").trim():"";
    if(boletaRecord&&(!boletaId||boletaRows.filter(r=>String(r[0]||"").trim()===boletaId).length!==1))return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
    if(!boletaId)boletaId="BOL-PAY-"+Date.now()+"-"+Math.floor(Math.random()*1000000);
    const existingFileId=boletaRecord?String(boletaRecord.row[10]||"").trim():"";
    if(existingFileId){
      let existing=null;try{existing=DriveApp.getFileById(existingFileId);}catch(_){}
      if(existing&&!existing.isTrashed()){
        try{existing.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);if(existing.getSharingAccess()!==DriveApp.Access.PRIVATE)return {status:"error",code:"PAYROLL_PDF_PRIVACY_ENFORCEMENT_FAILED",message:"No fue posible garantizar la privacidad del documento."};}
        catch(_){return {status:"error",code:"PAYROLL_PDF_PRIVACY_ENFORCEMENT_FAILED",message:"No fue posible garantizar la privacidad del documento."};}
        const reused=getPayrollReceiptPDFFile({sessionToken:p.sessionToken||p.authToken||p.token,boletaId:boletaId});
        if(reused.status==="success"){reused.recibo={planillaId:planillaId,periodoMes:plan[2],empleadoId:targetExpedienteId,empleadoNombre:plan[4],puesto:plan[5],salarioBase:Number(plan[6]||0),montoHorasExtras:Number(plan[8]||0),bonificaciones:Number(plan[9]||0),deducciones:Number(plan[10]||0)+Number(plan[11]||0)+Number(plan[12]||0)+Number(plan[13]||0),salarioNeto:Number(plan[14]||0)};return reused;}
      }
    }

    const safe=v=>String(v||"").replace(/[^A-Za-z0-9_-]/g,"-").slice(0,48);
    const fileName="Boleta-"+safe(targetExpedienteId)+"-"+safe(plan[2])+".pdf";
    const gross=Number(plan[6]||0)+Number(plan[8]||0)+Number(plan[9]||0);
    const deductions=Number(plan[10]||0)+Number(plan[11]||0)+Number(plan[12]||0)+Number(plan[13]||0);
    const document=DocumentApp.create("TEMP-"+fileName);
    temporaryDocumentFile=DriveApp.getFileById(document.getId());
    temporaryDocumentFile.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
    const body=document.getBody();
    [
      "BOLETA DE PAGO — DOCUMENTO CONFIDENCIAL",
      "Institución: "+String(PropertiesService.getScriptProperties().getProperty("IMA_INSTITUTION_NAME")||"Institución"),
      "Empleado: "+String(plan[4]||""),"Expediente: "+targetExpedienteId,"Puesto: "+String(plan[5]||""),"Periodo: "+String(plan[2]||""),
      "Salario base: L. "+Number(plan[6]||0).toFixed(2),"Horas extras: "+Number(plan[7]||0)+" | Importe: L. "+Number(plan[8]||0).toFixed(2),
      "Bonificaciones: L. "+Number(plan[9]||0).toFixed(2),"Deducción IHSS: L. "+Number(plan[10]||0).toFixed(2),
      "Deducción RAP: L. "+Number(plan[11]||0).toFixed(2),"Deducción ISR: L. "+Number(plan[12]||0).toFixed(2),
      "Otras deducciones: L. "+Number(plan[13]||0).toFixed(2),"Total devengado: L. "+gross.toFixed(2),
      "Total deducciones: L. "+deductions.toFixed(2),"Salario neto: L. "+Number(plan[14]||0).toFixed(2),
      "Estado de planilla: "+String(plan[15]||""),"Boleta: "+boletaId,"Este documento contiene información salarial confidencial."
    ].forEach(line=>body.appendParagraph(line));
    if(visiblePayrollConcepts.length){
      body.appendParagraph("CONCEPTOS SALARIALES ADICIONALES");
      visiblePayrollConcepts.forEach(item=>body.appendParagraph(item.nombre+" ("+item.categoria+"): L. "+item.monto.toFixed(2)));
    }
    document.saveAndClose();
    const pdfBlob=temporaryDocumentFile.getAs(MimeType.PDF);pdfBlob.setName(fileName);
    const privateFolder=getOrCreateFolderNews(DriveApp.getRootFolder(),"Boletas_Pago_Privadas");
    privateFolder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
    if(privateFolder.getSharingAccess()!==DriveApp.Access.PRIVATE)throw new Error("PAYROLL_PDF_FOLDER_NOT_PRIVATE");
    generatedPdfFile=privateFolder.createFile(pdfBlob);
    generatedPdfFile.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
    if(generatedPdfFile.getSharingAccess()!==DriveApp.Access.PRIVATE)throw new Error("PAYROLL_PDF_NOT_PRIVATE");
    const issuedAt=new Date();
    if(boletaRecord)boletaSheet.getRange(boletaRecord.rowIndex,11).setValue(generatedPdfFile.getId());
    else boletaSheet.appendRow([boletaId,planillaId,issuedAt,targetExpedienteId,plan[4],plan[2],gross,deductions,Number(plan[14]||0),"Emitida",generatedPdfFile.getId()]);
    const result=getPayrollReceiptPDFFile({sessionToken:p.sessionToken||p.authToken||p.token,boletaId:boletaId});
    if(result.status!=="success")return {status:"error",code:"PAYROLL_PDF_DELIVERY_FAILED",message:"El PDF fue generado pero no pudo recuperarse de forma autorizada."};
    result.recibo={planillaId:planillaId,periodoMes:plan[2],empleadoId:targetExpedienteId,empleadoNombre:plan[4],puesto:plan[5],salarioBase:Number(plan[6]||0),montoHorasExtras:Number(plan[8]||0),bonificaciones:Number(plan[9]||0),deducciones:deductions,salarioNeto:Number(plan[14]||0)};
    result.message="Boleta PDF generada y entregada de forma privada.";
    return result;
  }catch(error){
    if(generatedPdfFile){try{generatedPdfFile.setTrashed(true);}catch(_){}}
    logStructuredEvent("ACCOUNTING","generatePayrollReceiptPDF","ERROR","PAYROLL_PDF_GENERATION_FAILED","No fue posible generar la boleta privada.",{},actor.role);
    return {status:"error",code:"PAYROLL_PDF_GENERATION_FAILED",message:"No fue posible generar la boleta de pago."};
  }finally{
    if(temporaryDocumentFile){try{temporaryDocumentFile.setTrashed(true);}catch(_){}}
    lock.releaseLock();
  }
}

function getPayrollReceiptPDFFile(payload){
  const p=payload||{},boletaId=String(p.boletaId||"").trim();
  if(!boletaId)return {status:"error",code:"BOLETA_ID_REQUIRED",message:"Archivo no disponible."};
  const actor=getVerifiedAccountingIdentity_(p);
  if(!actor.authorized)return {status:"error",code:actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
  const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
  if(["EMPLEADO","TRABAJADOR","PERSONAL","PROFESOR","RECURSOSHUMANOS","ADMINISTRADOR"].indexOf(role)===-1)return {status:"error",code:"ROLE_NOT_ALLOWED",message:"Acceso denegado."};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),boletaSheet=ss.getSheetByName("BoletasPago"),planSheet=ss.getSheetByName("PlanillasNomenclatura"),expSheet=ss.getSheetByName("ExpedientesLaborales");
  if(!boletaSheet||!planSheet||!expSheet)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Archivo no disponible."};
  const boletaData=boletaSheet.getDataRange().getValues(),boletaHeaders=["BoletaID","PlanillaID","FechaEmision","EmpleadoId","EmpleadoNombre","PeriodoMes","TotalDevengado","TotalDeducciones","NetoAPagar","EstadoBoleta","DriveFileId"];
  if(!boletaData.length||JSON.stringify(boletaData[0].map(String))!==JSON.stringify(boletaHeaders))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de boletas de pago no es válida."};
  const boletaRows=boletaData.slice(1),selected=boletaRows.filter(r=>String(r[0]||"").trim()===boletaId);
  if(selected.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Archivo no disponible."};
  const boleta=selected[0],planillaId=String(boleta[1]||"").trim(),expedienteId=String(boleta[3]||"").trim(),period=String(boleta[5]||"").trim(),fileId=String(boleta[10]||"").trim();
  if(!planillaId||!expedienteId||!period||!/^[A-Za-z0-9_-]{10,}$/.test(fileId))return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Archivo no disponible."};
  const planData=planSheet.getDataRange().getValues(),planHeaders=["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"];
  if(!planData.length||!isValidPayrollPlanHeaders_(planData[0]))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de planillas no es válida."};
  const planRows=planData.slice(1),matches=planRows.filter(r=>String(r[0]||"").trim()===planillaId&&String(r[3]||"").trim()===expedienteId&&String(r[2]||"").trim()===period);
  if(matches.length!==1||planRows.filter(r=>String(r[0]||"").trim()===planillaId&&String(r[3]||"").trim()===expedienteId&&String(r[2]||"").trim()===period).length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Archivo no disponible."};
  const expData=expSheet.getDataRange().getValues(),expHeaders=["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"];
  if(!expData.length||JSON.stringify(expData[0].map(String))!==JSON.stringify(expHeaders))return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de expedientes laborales no es válida."};
  const employeeRows=expData.slice(1).filter(r=>String(r[0]||"").trim()===expedienteId),userId=employeeRows.length===1?String(employeeRows[0][2]||"").trim():"";
  if(!userId||expData.slice(1).filter(r=>String(r[2]||"").trim()===userId).length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Archivo no disponible."};
  const access=assertEmployeeExpedienteScopeAccess_(p,ss,expedienteId);
  if(!access.authorized)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Archivo no disponible."};
  try{
    const file=DriveApp.getFileById(fileId);
    if(!file||file.isTrashed()||file.getSharingAccess()!==DriveApp.Access.PRIVATE)return {status:"error",code:"PAYROLL_PDF_NOT_PRIVATE",message:"Archivo no disponible."};
    const blob=file.getBlob(),bytes=blob.getBytes();
    if(!bytes||!bytes.length||bytes.length>10*1024*1024)return {status:"error",code:"PAYROLL_PDF_FILE_INVALID",message:"Archivo no disponible."};
    const mime=String(blob.getContentType()||file.getMimeType()||"").toLowerCase(),name=String(file.getName()||"");
    const signature=bytes.slice(0,5).map(v=>String.fromCharCode((Number(v)+256)%256)).join("");
    if(mime!=="application/pdf"||!/\.pdf$/i.test(name)||signature!=="%PDF-")return {status:"error",code:"PAYROLL_PDF_FILE_INVALID",message:"Archivo no disponible."};
    return {status:"success",boletaId:boletaId,fileName:name,mimeType:mime,encoding:"base64",fileData:Utilities.base64Encode(bytes),fileSizeBytes:bytes.length};
  }catch(_){
    logStructuredEvent("ACCOUNTING","getPayrollReceiptPDFFile","WARN","PAYROLL_PDF_UNAVAILABLE","No fue posible recuperar la boleta privada.",{boletaId:boletaId},actor.role);
    return {status:"error",code:"PAYROLL_PDF_UNAVAILABLE",message:"Archivo no disponible."};
  }
}

function getStaffPayrollReceipt(payload) {
 const p=payload||{},actor=getVerifiedAccountingIdentity_(p);
 if(!actor.authorized)return {status:"error",code:actor.code||"VERIFIED_IDENTITY_REQUIRED",message:"Acceso denegado."};
 const role=String(actor.role||"").toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N").replace(/[^A-Z0-9]/g,"");
 const self=["EMPLEADO","TRABAJADOR","PERSONAL","PROFESOR"].includes(role);
 if(!self&&!["RECURSOSHUMANOS","DIRECTOR","ADMINISTRADOR","SUBDIRECTOR","CONTADOR"].includes(role))return {status:"error",code:"ROLE_NOT_ALLOWED",message:"Acceso denegado."};
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),empty=()=>({status:"success",boletas:[]});
 const read=(n,h,opt,alternateHeaders)=>{const sh=ss.getSheetByName(n);if(!sh)return opt?{rows:[]}:null;const v=sh.getDataRange().getValues();if(!v.length)return {rows:[]};const valid=[h].concat(alternateHeaders||[]).some(expected=>v[0].length===expected.length&&expected.every((x,i)=>String(v[0][i]||"").trim().toUpperCase()===x.toUpperCase()));if(!valid)return {error:true,rows:[]};return {rows:v.slice(1).filter(r=>Array.isArray(r)&&r.length>=h.length)};};
 const eh=["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"];
 const ph=["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"];
 const bh=["BoletaID","PlanillaID","FechaEmision","EmpleadoId","EmpleadoNombre","PeriodoMes","TotalDevengado","TotalDeducciones","NetoAPagar","EstadoBoleta"];
 const em=read("ExpedientesLaborales",eh,false),pl=read("PlanillasNomenclatura",ph,true,[ph.concat(["AsientoContableID"])]),bo=read("BoletasPago",bh,true,[bh.concat(["DriveFileId"])]);
 if(!em||em.error||pl.error||bo.error)return {status:"error",code:"RESOURCE_SCHEMA_INVALID",message:"La estructura de las boletas de pago no es válida."};
 const expCounts=Object.create(null),userCounts=Object.create(null);
 em.rows.forEach(r=>{const e=String(r[0]||"").trim(),u=String(r[2]||"").trim();if(e)expCounts[e]=(expCounts[e]||0)+1;if(u)userCounts[u]=(userCounts[u]||0)+1;});
 const userExp=Object.create(null);em.rows.forEach(r=>{const e=String(r[0]||"").trim(),u=String(r[2]||"").trim();if(e&&u&&expCounts[e]===1&&userCounts[u]===1)userExp[u]=e;});
 const expUser=Object.create(null);Object.keys(userExp).forEach(u=>{expUser[userExp[u]]=u;});
 const requested=String(p.empleadoId||"").trim(),period=String(p.periodoMes||"").trim(),bid=String(p.boletaId||"").trim(),own=self?userExp[actor.userId]||"": "";
 if(self&&(!own||(requested&&requested!==own)))return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
 const target=self?own:requested;
 if(target&&expCounts[target]!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
 const cache=Object.create(null),allowed=id=>{id=String(id||"").trim();if(!id||expCounts[id]!==1||!expUser[id])return false;if(!Object.prototype.hasOwnProperty.call(cache,id))cache[id]=assertEmployeeExpedienteScopeAccess_(p,ss,id);return !!cache[id].authorized;};
 if(target&&!allowed(target))return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};
 const ids=Object.create(null);pl.rows.forEach(r=>{const key=[String(r[0]||"").trim(),String(r[3]||"").trim(),String(r[2]||"").trim()].join("|");if(key!=="||")ids[key]=(ids[key]||0)+1;});
 let selected=pl.rows.filter(r=>{const id=String(r[0]||"").trim(),e=String(r[3]||"").trim(),key=[id,e,String(r[2]||"").trim()].join("|");return !!id&&!!e&&ids[key]===1&&(!target||e===target)&&(!period||String(r[2]||"").trim()===period)&&allowed(e);});
 if(bid){const found=bo.rows.filter(r=>String(r[0]||"").trim()===bid);if(found.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};const b=found[0];selected=selected.filter(r=>String(r[0]||"").trim()===String(b[1]||"").trim()&&String(r[3]||"").trim()===String(b[3]||"").trim()&&String(r[2]||"").trim()===String(b[5]||"").trim());if(!selected.length)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Boleta de pago no disponible."};}
 return {status:"success",boletas:selected.map(r=>{
  const matches=bo.rows.filter(b=>String(b[1]||"").trim()===String(r[0]||"").trim()&&String(b[3]||"").trim()===String(r[3]||"").trim()&&String(b[5]||"").trim()===String(r[2]||"").trim());
  const storedFileId=matches.length===1?String(matches[0][10]||"").trim():"";
  const boletaId=storedFileId?String(matches[0][0]||"").trim():"";
  return {planillaId:r[0],fechaGeneracion:r[1],periodoMes:r[2],empleadoId:r[3],empleadoNombre:r[4],puesto:r[5],salarioBase:parseFloat(r[6]||0),horasExtras:parseFloat(r[7]||0),montoHorasExtras:parseFloat(r[8]||0),bonificaciones:parseFloat(r[9]||0),deduccionIHSS:parseFloat(r[10]||0),deduccionRAP:parseFloat(r[11]||0),deduccionISR:parseFloat(r[12]||0),otrasDeducciones:parseFloat(r[13]||0),salarioNeto:parseFloat(r[14]||0),estado:r[15],boletaId:boletaId};
 })};
}

function getPayrollReceiptDistributionHeaders_() {
  return ["DistribucionID","PlanillaID","BoletaID","ExpedienteID","UserId","Estado","Intentos","UltimoIntento","EnviadoEn","EnviadoPor","ErrorCode","DriveFileId"];
}

function ensurePayrollReceiptDistributionSheet_(ss) {
  const sheet=ss.getSheetByName("DistribucionBoletasPago")||getOrCreateSheet(ss,"DistribucionBoletasPago");
  let data=sheet.getDataRange().getValues(),headers=getPayrollReceiptDistributionHeaders_();
  if(!data.length||!data[0]||!data[0].length||data[0].every(v=>String(v||"").trim()==="")){sheet.getRange(1,1,1,headers.length).setValues([headers]);data=[headers];}
  if(data[0].length!==headers.length||headers.some((h,i)=>String(data[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))throw new Error("RESOURCE_SCHEMA_INVALID: DistribucionBoletasPago");
  return {sheet,headers,rows:data.slice(1)};
}

function requirePayrollReceiptDistributionManager_(payload) {
  const actor=getVerifiedAccountingIdentity_(payload||{});
  if(!actor.authorized)return {authorized:false,code:actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  if(!["RECURSOSHUMANOS","ADMINISTRADOR"].includes(normalizePayrollRole_(actor.role)))return {authorized:false,code:"ROLE_NOT_ALLOWED"};
  return {authorized:true,actor};
}

function getPayrollReceiptDistributionContext_(payload,ss,planillaId) {
  const planSheet=ss.getSheetByName("PlanillasNomenclatura"),expSheet=ss.getSheetByName("ExpedientesLaborales"),userSheet=ss.getSheetByName("Usuarios");
  if(!planSheet||!expSheet||!userSheet)return {error:"RESOURCE_NOT_FOUND",message:"No hay datos suficientes para distribuir las boletas."};
  const planHeaders=["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"];
  const expHeaders=["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"];
  const planData=planSheet.getDataRange().getValues(),expData=expSheet.getDataRange().getValues(),userData=userSheet.getDataRange().getValues();
  if(!planData.length||!isValidPayrollPlanHeaders_(planData[0])||!expData.length||expData[0].length!==expHeaders.length||expHeaders.some((h,i)=>String(expData[0][i]||"").trim().toUpperCase()!==h.toUpperCase())||!userData.length||!userData[0]||userData[0].length<11)return {error:"RESOURCE_SCHEMA_INVALID",message:"La estructura de planillas, expedientes o usuarios no es válida."};
  const plans=planData.slice(1).filter(r=>String(r[0]||"").trim()===planillaId);
  if(!plans.length)return {error:"RESOURCE_NOT_FOUND",message:"La planilla seleccionada no está disponible."};
  if(plans.some(r=>!Array.isArray(r)||(r.length!==planHeaders.length&&r.length!==planHeaders.length+1)))return {error:"RESOURCE_SCHEMA_INVALID",message:"La estructura de la planilla no es válida."};
  if(plans.some(r=>String(r[15]||"").trim().toUpperCase()!=="CERRADA"))return {error:"PAYROLL_NOT_CLOSED",message:"La distribución solo está permitida cuando toda la planilla está cerrada."};
  const periods=Array.from(new Set(plans.map(r=>String(r[2]||"").trim())));
  if(periods.length!==1||!periods[0])return {error:"PAYROLL_PERIOD_CONFLICT",message:"La planilla contiene períodos inconsistentes."};
  const expRows=expData.slice(1),users=userData.slice(1),expCounts=Object.create(null),userCounts=Object.create(null),emailCounts=Object.create(null),planKeyCounts=Object.create(null);
  expRows.forEach(r=>{const id=String(r[0]||"").trim(),u=String(r[2]||"").trim();if(id)expCounts[id]=(expCounts[id]||0)+1;if(u)userCounts[u]=(userCounts[u]||0)+1;});
  users.forEach(r=>{const id=String(r[0]||"").trim(),email=String(r[4]||"").trim().toLowerCase();if(id)userCounts["USER:"+id]=(userCounts["USER:"+id]||0)+1;if(email)emailCounts[email]=(emailCounts[email]||0)+1;});
  plans.forEach(r=>{const key=[String(r[0]||"").trim(),String(r[3]||"").trim(),String(r[2]||"").trim()].join("|");planKeyCounts[key]=(planKeyCounts[key]||0)+1;});
  const records=[],incidents=[];let scopeBlocked=0;
  plans.forEach(r=>{
    const expedienteId=String(r[3]||"").trim(),employeeName=String(r[4]||"").trim(),key=[planillaId,expedienteId,String(r[2]||"").trim()].join("|");
    if(!expedienteId||planKeyCounts[key]!==1){incidents.push({empleadoId:expedienteId,empleadoNombre:employeeName,motivo:"PLANILLA_ROW_AMBIGUOUS"});return;}
    const matches=expRows.filter(x=>String(x[0]||"").trim()===expedienteId);
    if(matches.length!==1||expCounts[expedienteId]!==1){incidents.push({empleadoId:expedienteId,empleadoNombre:employeeName,motivo:"EXPEDIENTE_AMBIGUOUS"});return;}
    const access=assertEmployeeExpedienteScopeAccess_(payload,ss,expedienteId);
    if(!access.authorized){scopeBlocked++;incidents.push({empleadoId:expedienteId,empleadoNombre:"",motivo:"OUT_OF_SCOPE"});return;}
    const userId=String(matches[0][2]||"").trim();
    if(!userId||userCounts[userId]!==1){
      records.push({planillaId,periodoMes:periods[0],expedienteId,userId,empleadoNombre:employeeName,email:"",emailValid:false,emailReason:"USER_AMBIGUOUS"});
      incidents.push({empleadoId:expedienteId,empleadoNombre:employeeName,motivo:"USER_AMBIGUOUS"});return;
    }
    const userMatches=users.filter(x=>String(x[0]||"").trim()===userId);
    if(userMatches.length!==1){
      const reason=userMatches.length?"USER_AMBIGUOUS":"USER_NOT_FOUND";
      records.push({planillaId,periodoMes:periods[0],expedienteId,userId,empleadoNombre:employeeName,email:"",emailValid:false,emailReason:reason});
      incidents.push({empleadoId:expedienteId,empleadoNombre:employeeName,motivo:reason});return;
    }
    const user=userMatches[0],email=String(user[4]||"").trim(),accountState=String(user[10]||"Activa").trim().toUpperCase();
    let emailReason="";
    if(accountState!=="ACTIVA")emailReason="USER_INACTIVE";
    else if(!email)emailReason="EMAIL_MISSING";
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))emailReason="EMAIL_INVALID";
    else if(emailCounts[email.toLowerCase()]!==1)emailReason="EMAIL_DUPLICATE";
    records.push({planillaId,periodoMes:periods[0],expedienteId,userId,empleadoNombre:employeeName,email,emailValid:!emailReason,emailReason});
    if(emailReason)incidents.push({empleadoId:expedienteId,empleadoNombre:employeeName,motivo:emailReason});
  });
  return {planillaId,periodoMes:periods[0],total:plans.length,records,incidents,scopeBlocked};
}

function preparePayrollReceiptDistributionRows_(ss,context,actor) {
  const dist=ensurePayrollReceiptDistributionSheet_(ss),rows=dist.rows;
  context.records.forEach(record=>{
    const matches=rows.map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[1]||"").trim()===record.planillaId&&String(x.r[3]||"").trim()===record.expedienteId);
    if(matches.length>1)throw new Error("PAYROLL_DISTRIBUTION_DUPLICATE");
    if(!matches.length){
      const state=record.emailValid?"PENDIENTE":"FALLIDO";
      dist.sheet.appendRow(["DIST-"+Utilities.getUuid(),record.planillaId,"",record.expedienteId,record.userId,state,0,"","",actor.userId,record.emailReason||"",""]);
      return;
    }
    const found=matches[0],old=found.r.slice(),state=String(old[5]||"").trim().toUpperCase(),error=String(old[10]||"").trim();
    if(state==="ENVIADO"||state==="PROCESANDO")return;
    if(!record.emailValid){old[5]="FALLIDO";old[10]=record.emailReason;old[4]=record.userId;}
    else if(state==="FALLIDO"){old[5]="PENDIENTE";old[10]="";old[4]=record.userId;}
    else if(state==="PENDIENTE"||state==="REINTENTABLE"){old[4]=record.userId;}
    dist.sheet.getRange(found.index,1,1,dist.headers.length).setValues([old]);
  });
  return ensurePayrollReceiptDistributionSheet_(ss);
}

function getPayrollReceiptDistributionSummary_(ss,context) {
  const dist=ensurePayrollReceiptDistributionSheet_(ss),allowed=Object.create(null);
  context.records.forEach(r=>{allowed[r.expedienteId]=true;});
  const rows=dist.rows.filter(r=>String(r[1]||"").trim()===context.planillaId&&allowed[String(r[3]||"").trim()]);
  const count=state=>rows.filter(r=>String(r[5]||"").trim().toUpperCase()===state).length;
  return {status:"success",planillaId:context.planillaId,periodoMes:context.periodoMes,totalEmpleados:context.total,empleadosEnAmbito:context.records.length,correosValidos:context.records.filter(r=>r.emailValid).length,correosFaltantes:context.records.filter(r=>r.emailReason==="EMAIL_MISSING").length,correosInvalidos:context.records.filter(r=>r.emailReason&&r.emailReason!=="EMAIL_MISSING").length,fueraDeAmbito:context.scopeBlocked,yaEnviados:count("ENVIADO"),pendientes:count("PENDIENTE"),reintentables:count("REINTENTABLE"),fallidos:count("FALLIDO"),enProceso:count("PROCESANDO"),incidencias:context.incidents.slice(0,100)};
}

function previewPayrollReceiptDistribution(payload) {
  const p=payload||{},access=requirePayrollReceiptDistributionManager_(p);
  if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  const planillaId=String(p.planillaId||"").trim();if(!planillaId)return {status:"error",code:"PLANILLA_SELECTION_REQUIRED",message:"Seleccione una planilla."};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La distribución está ocupada."};
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),context=getPayrollReceiptDistributionContext_(p,ss,planillaId);
    if(context.error)return {status:"error",code:context.error,message:context.message};
    preparePayrollReceiptDistributionRows_(ss,context,access.actor);
    return getPayrollReceiptDistributionSummary_(ss,context);
  }catch(e){return {status:"error",code:e.message==="PAYROLL_DISTRIBUTION_DUPLICATE"?e.message:"PAYROLL_DISTRIBUTION_PREVIEW_FAILED",message:"No fue posible preparar la vista previa de distribución."};}
  finally{lock.releaseLock();}
}

function getPayrollPortalLoginUrl_() {
  let configured="";
  try{const props=PropertiesService.getScriptProperties();configured=String(props.getProperty("IMA_FRONTEND_URL")||props.getProperty("FRONTEND_URL")||"").trim();}catch(_){}
  if(!/^https:\/\/[^/]+/.test(configured))configured="https://informatica0101.github.io";
  return /\/login\.html$/i.test(configured)?configured:configured.replace(/\/+$/,"")+"/login.html";
}

function updatePayrollReceiptDistributionRow_(ss,distributionId,changes) {
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return false;
  try{
    const dist=ensurePayrollReceiptDistributionSheet_(ss),matches=dist.rows.map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[0]||"").trim()===distributionId);
    if(matches.length!==1||String(matches[0].r[5]||"").trim().toUpperCase()!=="PROCESANDO")return false;
    const updated=matches[0].r.slice();
    if(changes.boletaId!==undefined)updated[2]=changes.boletaId;
    if(changes.estado!==undefined)updated[5]=changes.estado;
    if(changes.ultimoIntento!==undefined)updated[7]=changes.ultimoIntento;
    if(changes.enviadoEn!==undefined)updated[8]=changes.enviadoEn;
    if(changes.enviadoPor!==undefined)updated[9]=changes.enviadoPor;
    if(changes.errorCode!==undefined)updated[10]=changes.errorCode;
    if(changes.driveFileId!==undefined)updated[11]=changes.driveFileId;
    dist.sheet.getRange(matches[0].index,1,1,dist.headers.length).setValues([updated]);
    return true;
  }catch(_){return false;}finally{lock.releaseLock();}
}

function processPayrollReceiptDistribution(payload) {
  const p=payload||{},access=requirePayrollReceiptDistributionManager_(p);
  if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
  const planillaId=String(p.planillaId||"").trim(),mode=String(p.modo||"ENVIAR").trim().toUpperCase();
  if(!planillaId||!["ENVIAR","REINTENTAR"].includes(mode))return {status:"error",code:"PAYROLL_DISTRIBUTION_REQUEST_INVALID",message:"Planilla o modo de distribución no válido."};
  const preview=previewPayrollReceiptDistribution(p);if(preview.status!=="success")return preview;
  if(typeof MailApp==="undefined"||typeof MailApp.sendEmail!=="function")return {status:"error",code:"MAIL_SERVICE_UNAVAILABLE",message:"El servicio de correo no está disponible."};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La distribución está ocupada."};
  let claimed=[];
  try{
    const context=getPayrollReceiptDistributionContext_(p,ss,planillaId);if(context.error)return {status:"error",code:context.error,message:context.message};
    const dist=ensurePayrollReceiptDistributionSheet_(ss),byEmployee=Object.create(null);
    context.records.forEach(r=>{byEmployee[r.expedienteId]=r;});
    const candidates=dist.rows.map((r,i)=>({r,index:i+2})).filter(x=>String(x.r[1]||"").trim()===planillaId&&String(x.r[5]||"").trim().toUpperCase()===(mode==="ENVIAR"?"PENDIENTE":"REINTENTABLE")&&byEmployee[String(x.r[3]||"").trim()]&&byEmployee[String(x.r[3]||"").trim()].emailValid);
    let limit=Math.max(1,Math.min(20,Number(p.limite)||10));
    if(typeof MailApp.getRemainingDailyQuota==="function"){
      const quota=Number(MailApp.getRemainingDailyQuota());
      if(!Number.isFinite(quota)||quota<=0)return {status:"error",code:"MAIL_QUOTA_EXCEEDED",message:"No hay cuota diaria de correo disponible."};
      limit=Math.min(limit,quota);
    }
    candidates.slice(0,limit).forEach(item=>{
      const updated=item.r.slice();updated[5]="PROCESANDO";updated[6]=Number(updated[6]||0)+1;updated[7]=new Date();updated[9]=access.actor.userId;updated[10]="";
      dist.sheet.getRange(item.index,1,1,dist.headers.length).setValues([updated]);
      const record=byEmployee[String(updated[3]||"").trim()];
      claimed.push({distributionId:String(updated[0]),expedienteId:record.expedienteId,email:record.email,record});
    });
  }catch(e){return {status:"error",code:"PAYROLL_DISTRIBUTION_CLAIM_FAILED",message:"No fue posible reservar los envíos."};}
  finally{lock.releaseLock();}
  let sent=0,retryable=0,failed=0,updateFailures=0;
  claimed.forEach(item=>{
    let generated;
    try{
      generated=generatePayrollReceiptPDF(Object.assign({},p,{planillaId:planillaId,empleadoId:item.expedienteId,_requireClosedForDistribution:true}));
      if(!generated||generated.status!=="success"){
        const code=String(generated&&generated.code||"PAYROLL_PDF_GENERATION_FAILED");
        const retry=["CONCURRENT_UPDATE_RETRY","PAYROLL_PDF_GENERATION_FAILED","PAYROLL_PDF_DELIVERY_FAILED","PAYROLL_PDF_UNAVAILABLE"].includes(code);
        const recorded=updatePayrollReceiptDistributionRow_(ss,item.distributionId,{estado:retry?"REINTENTABLE":"FALLIDO",errorCode:retry?"PDF_GENERATION_RETRYABLE":code});
        if(!recorded)updateFailures++;else if(retry)retryable++;else failed++;
        return;
      }
      if(!String(generated.boletaId||"").trim()){
        if(updatePayrollReceiptDistributionRow_(ss,item.distributionId,{estado:"REINTENTABLE",errorCode:"PDF_REFERENCE_MISSING"}))retryable++;else updateFailures++;return;
      }
      const latestContext=getPayrollReceiptDistributionContext_(p,ss,planillaId);
      const latestRecord=!latestContext.error&&latestContext.records.find(r=>r.expedienteId===item.expedienteId);
      if(!latestRecord||!latestRecord.emailValid){
        if(updatePayrollReceiptDistributionRow_(ss,item.distributionId,{estado:"FALLIDO",errorCode:latestContext.error||latestRecord&&latestRecord.emailReason||"DISTRIBUTION_CONTEXT_CHANGED"}))failed++;else updateFailures++;return;
      }
      item.email=latestRecord.email;
      let driveFileId="";
      const receiptSheet=ss.getSheetByName("BoletasPago");
      if(receiptSheet){
        const receiptRows=receiptSheet.getDataRange().getValues().slice(1);
        const receiptMatches=receiptRows.filter(r=>String(r[0]||"").trim()===String(generated.boletaId||"").trim()&&String(r[1]||"").trim()===planillaId&&String(r[3]||"").trim()===item.expedienteId);
        if(receiptMatches.length===1)driveFileId=String(receiptMatches[0][10]||"").trim();
      }
      const portalUrl=getPayrollPortalLoginUrl_();
      const body="Tiene un nuevo comprobante de nómina disponible en su cuenta institucional. Inicie sesión en el Portal Institucional y abra Nómina > Mis boletas:\n"+portalUrl+"\n\nPor seguridad, el comprobante no se adjunta a este correo. El portal requiere autenticación y solo muestra sus propios documentos.";
      const htmlBody='<p>Tiene un nuevo comprobante de nómina disponible en su cuenta institucional.</p><p>Inicie sesión en el <a href="'+portalUrl+'">Portal Institucional</a> y abra <strong>Nómina &gt; Mis boletas</strong>.</p><p>Por seguridad, el comprobante no se adjunta a este correo. El portal requiere autenticación y solo muestra sus propios documentos.</p>';
      MailApp.sendEmail({to:item.email,subject:"Comprobante de nómina disponible",body:body,htmlBody:htmlBody});
      if(updatePayrollReceiptDistributionRow_(ss,item.distributionId,{boletaId:String(generated.boletaId||""),estado:"ENVIADO",enviadoEn:new Date(),errorCode:"",driveFileId:driveFileId}))sent++;else updateFailures++;
    }catch(e){
      if(updatePayrollReceiptDistributionRow_(ss,item.distributionId,{boletaId:String(generated&&generated.boletaId||""),estado:"REINTENTABLE",errorCode:"MAIL_SEND_FAILED"}))retryable++;else updateFailures++;
    }
    if(generated&&generated.fileData)generated.fileData="";
  });
  const finalSheet=ensurePayrollReceiptDistributionSheet_(ss),rows=finalSheet.rows.filter(r=>String(r[1]||"").trim()===planillaId);
  const count=state=>rows.filter(r=>String(r[5]||"").trim().toUpperCase()===state).length;
  return {status:"success",planillaId:planillaId,modo:mode,procesados:claimed.length,enviados:sent,reintentables:retryable,fallidos:failed,actualizacionesFallidas:updateFailures,pendientesRestantes:count("PENDIENTE"),reintentosRestantes:count("REINTENTABLE"),enProceso:count("PROCESANDO"),message:"Lote de distribución procesado. Los envíos exitosos no se vuelven a enviar."};
}

function recordAccountingJournalEntry(payload) {
  const { descripcion, origenModulo, referenciaId, lineas, creadoPor } = payload || {};
  if (!descripcion || !Array.isArray(lineas) || lineas.length === 0) {
    throw new Error("Descripción y líneas contables son requeridas.");
  }

  let totalDebe = 0;
  let totalHaber = 0;

  lineas.forEach(l => {
    totalDebe += parseFloat(l.debe || 0);
    totalHaber += parseFloat(l.haber || 0);
  });

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    logStructuredEvent("ACCOUNTING", "recordAccountingJournalEntry", "WARN", "UNBALANCED_JOURNAL_ENTRY_REJECTED", `Asiento desequilibrado rechazado. Debe: ${totalDebe}, Haber: ${totalHaber}`, { descripcion, totalDebe, totalHaber }, creadoPor || "SISTEMA");
    throw new Error(`Asiento contable desequilibrado. Debe: ${totalDebe}, Haber: ${totalHaber}. La partida doble exige igualdad.`);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "AsientosContables");
  const now = new Date();
  const asientoId = "AST-" + now.getTime();

  sheet.appendRow([
    asientoId,
    now,
    descripcion,
    origenModulo || "General",
    referenciaId || "N/A",
    JSON.stringify(lineas),
    "Asentado",
    creadoPor || "SISTEMA"
  ]);

  return {
    status: "success",
    asientoId: asientoId,
    totalDebe: totalDebe,
    totalHaber: totalHaber,
    estado: "Asentado",
    message: "Asiento contable equilibrado por partida doble registrado exitosamente."
  };
}

function getAdvancedDashboardAnalytics(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const expsRows = getOrCreateSheet(ss, "ExpedientesLaborales").getDataRange().getValues().slice(1);
  const vacsRows = getOrCreateSheet(ss, "SolicitudesVacaciones").getDataRange().getValues().slice(1);
  const attsRows = getOrCreateSheet(ss, "DeduccionesAsistencia").getDataRange().getValues().slice(1);
  const ctrsRows = getOrCreateSheet(ss, "ContratosLaborales").getDataRange().getValues().slice(1);

  const totalActivos = expsRows.filter(r => r[8] === "active" || r[8] === "Activo" || r[8] === "EnPeriodoPrueba").length;
  const pendientesPermisos = vacsRows.filter(r => r[6] === "PendienteAprobacion" || r[6] === "submitted").length;
  const hoyStr = new Date().toISOString().split('T')[0];
  // REVISIÓN DATE PARSING: Guarda de seguridad para evitar RangeError: Invalid time value en registros de fecha vacíos o corruptos
  const asistenciasHoy = attsRows.filter(r => r[1] && !isNaN(new Date(r[1]).getTime()) && new Date(r[1]).toISOString().split('T')[0] === hoyStr).length;
  const pctAsistencia = totalActivos > 0 ? Math.min(100, Math.round((asistenciasHoy / totalActivos) * 100)) : 100;

  return {
    status: "success",
    metrics: {
      personalActivoCount: totalActivos,
      solicitudesPendientesCount: pendientesPermisos,
      asistenciaHoyPorcentaje: pctAsistencia,
      contratosAVencerCount: ctrsRows.length
    }
  };
}

function getPaginatedJournalEntries(payload) {
  const { page, pageSize, searchQuery, sortBy, sortOrder } = payload || {};
  const pageNum = parseInt(page) || 1;
  const size = parseInt(pageSize) || 15;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, "AsientosContables");
  const rows = sheet.getDataRange().getValues().slice(1);

  const cleanQuery = searchQuery ? String(searchQuery).trim().toLowerCase() : "";

  let filtered = rows.filter(r => {
    if (!cleanQuery) return true;
    const id = String(r[0] || "").toLowerCase();
    const concepto = String(r[2] || "").toLowerCase();
    return id.includes(cleanQuery) || concepto.includes(cleanQuery);
  }).map(r => ({
    asientoId: r[0],
    fecha: r[1],
    concepto: r[2],
    origenModulo: r[3] || "General",
    montoDebe: r[4],
    montoHaber: r[5],
    estado: r[6] || "Registrado"
  }));

  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / size) || 1;

  if (sortBy) {
    const isAsc = sortOrder === "ASC";
    filtered.sort((a, b) => {
      const valA = String(a[sortBy] || "").toLowerCase();
      const valB = String(b[sortBy] || "").toLowerCase();
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });
  }

  const startIndex = (pageNum - 1) * size;
  const pageData = filtered.slice(startIndex, startIndex + size);

  return {
    status: "success",
    data: pageData,
    pagination: {
      page: pageNum,
      pageSize: size,
      totalRecords: totalRecords,
      totalPages: totalPages
    }
  };
}

function getAccountingJournalEntries(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getOrCreateSheet(ss, "AsientosContables").getDataRange().getValues().slice(1);

  const entries = rows.map(r => ({
    asientoId: r[0],
    fecha: r[1] ? new Date(r[1]).toISOString() : null,
    descripcion: r[2],
    origenModulo: r[3] || "General",
    referenciaId: r[4],
    lineas: r[5] ? (typeof r[5] === 'string' ? JSON.parse(r[5]) : r[5]) : [],
    estado: r[6] || "Contabilizado",
    creadoPor: r[7]
  }));

  return { status: "success", data: entries };
}

function getPayrollEmployeePayConfigHeaders_(){return ["EmpleadoId","ModalidadPago","FrecuenciaPago","VigenciaInicio","VigenciaFin","Estado","ActualizadoPor","ActualizadoEn"];}

function ensurePayrollEmployeePayConfigSheet_(ss){
 const headers=getPayrollEmployeePayConfigHeaders_(),sheet=ss.getSheetByName("ConfiguracionPagoEmpleado")||getOrCreateSheet(ss,"ConfiguracionPagoEmpleado");
 let data=sheet.getDataRange().getValues();
 if(!data.length||!data[0]||!data[0].length){sheet.getRange(1,1,1,headers.length).setValues([headers]);data=[headers];}
 if(data[0].length!==headers.length||headers.some((h,i)=>String(data[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))throw new Error("RESOURCE_SCHEMA_INVALID: ConfiguracionPagoEmpleado");
 return {sheet,headers,rows:data.slice(1)};
}

function normalizePayrollBatchValue_(value){return String(value==null?"":value).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}

function payrollVarianceMetric_(current,previous){
 const c=Number(current||0),p=Number(previous||0);
 if(!Number.isFinite(c)||!Number.isFinite(p))throw new Error("PAYROLL_VARIANCE_VALUE_INVALID");
 const difference=Math.round((c-p)*100)/100;
 return {actual:Math.round(c*100)/100,anterior:Math.round(p*100)/100,diferencia:difference,porcentaje:p===0?(c===0?0:null):Math.round((difference/p)*10000)/100,baseCero:p===0&&c!==0};
}

function buildPayrollVarianceReport_(current,previous,threshold){
 const fields=["salarioBase","horasExtras","montoHorasExtras","bonificaciones","totalDevengado","deduccionIHSS","deduccionRAP","deduccionISR","otrasDeducciones","totalDeducciones","salarioNeto","patronalIHSS","patronalRAP","patronalINFOP","totalAportacionesPatronales","costoLaboralTotal"];
 const rubros={};fields.forEach(k=>rubros[k]=payrollVarianceMetric_(current[k],previous[k]));
 const limit=Number.isFinite(Number(threshold))?Math.max(0,Math.min(1000,Number(threshold))):10;
 const incomePct=rubros.totalDevengado.porcentaje,deductionPct=rubros.totalDeducciones.porcentaje;
 const alertas=[];
 if((incomePct!==null&&Math.abs(incomePct)>limit)||rubros.totalDevengado.baseCero)alertas.push({tipo:"INGRESOS",porcentaje:incomePct,umbral:limit,nuevoImporte:rubros.totalDevengado.baseCero});
 if((deductionPct!==null&&Math.abs(deductionPct)>limit)||rubros.totalDeducciones.baseCero)alertas.push({tipo:"DEDUCCIONES",porcentaje:deductionPct,umbral:limit,nuevoImporte:rubros.totalDeducciones.baseCero});
 return {rubros,umbralPorcentaje:limit,alerta:alertas.length>0,alertas};
}

function getPayrollEmployeePayConfig(payload){
 const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,access.actor);
  if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"No existe un ámbito autorizado."};
  const config=ensurePayrollEmployeePayConfigSheet_(ss),exps=getOrCreateSheet(ss,"ExpedientesLaborales").getDataRange().getValues().slice(1);
  const allowed=scope.institutionWide?null:(scope.departmentIds||[]).map(String);
  const employeeId=String(p.empleadoId||"").trim();
  const employees=exps.filter(e=>(!employeeId||String(e[0]||"").trim()===employeeId)&&(!allowed||allowed.includes(String(e[4]||"").trim())));
  return {status:"success",configuraciones:config.rows.filter(r=>employees.some(e=>String(e[0]||"").trim()===String(r[0]||"").trim())).map(r=>({empleadoId:r[0],modalidadPago:r[1],frecuenciaPago:r[2],vigenciaInicio:r[3],vigenciaFin:r[4],estado:r[5]}))};
 }catch(e){return {status:"error",code:"PAYROLL_PAYMENT_CONFIG_READ_FAILED",message:"No fue posible consultar la configuración de pago."};}
}

function savePayrollEmployeePayConfig(payload){
 const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
 const employeeId=String(p.empleadoId||"").trim(),modality=normalizePayrollBatchValue_(p.modalidadPago),frequency=normalizePayrollBatchValue_(p.frecuenciaPago);
 const modalities=["SALARIO_FIJO","POR_HORA","COMISION","MIXTO"],frequencies=["SEMANAL","CATORCENAL","QUINCENAL","MENSUAL"];
 const start=p.vigenciaInicio?new Date(p.vigenciaInicio):null,end=p.vigenciaFin?new Date(p.vigenciaFin):null;
 if(!employeeId||!modalities.includes(modality)||!frequencies.includes(frequency)||start&&isNaN(start.getTime())||end&&isNaN(end.getTime())||start&&end&&start>end)return {status:"error",code:"PAYROLL_PAYMENT_CONFIG_INVALID",message:"Empleado, modalidad, frecuencia y vigencia deben ser válidos."};
 const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return {status:"error",code:"CONCURRENT_UPDATE_RETRY",message:"La configuración está ocupada."};
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,access.actor);
  if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"No existe un ámbito autorizado."};
  const exps=getOrCreateSheet(ss,"ExpedientesLaborales").getDataRange().getValues().slice(1),employees=exps.filter(e=>String(e[0]||"").trim()===employeeId);
  if(employees.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Empleado no disponible."};
  const dept=String(employees[0][4]||"").trim(),allowed=(scope.departmentIds||[]).map(String);
  if(scope.institutionWide!==true&&!allowed.includes(dept))return {status:"error",code:"RESOURCE_NOT_FOUND",message:"Empleado no disponible."};
  const data=ensurePayrollEmployeePayConfigSheet_(ss),matches=data.rows.map((r,i)=>({row:r,index:i+2})).filter(x=>String(x.row[0]||"").trim()===employeeId);
  if(matches.length>1)return {status:"error",code:"PAYROLL_PAYMENT_CONFIG_AMBIGUOUS",message:"Hay configuraciones duplicadas para el empleado."};
  const row=[employeeId,modality,frequency,start||"",end||"","ACTIVO",access.actor.userId,new Date()];
  if(matches.length){data.sheet.getRange(matches[0].index,1,1,row.length).setValues([row]);}
  else data.sheet.appendRow(row);
  return {status:"success",empleadoId:employeeId,modalidadPago:modality,frecuenciaPago:frequency,message:"Configuración de pago guardada."};
 }catch(e){return {status:"error",code:"PAYROLL_PAYMENT_CONFIG_SAVE_FAILED",message:"No fue posible guardar la configuración de pago."};}finally{lock.releaseLock();}
}

function getPayrollBatchPreview(payload){
 const p=payload||{},access=requirePayrollConceptManager_(p);if(!access.authorized)return {status:"error",code:access.code,message:"Acceso denegado."};
 const period=String(p.periodoMes||"").trim();if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))return {status:"error",code:"PAYROLL_PERIOD_INVALID",message:"Use un período con formato AAAA-MM."};
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,access.actor);
  if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED",message:"No existe un ámbito autorizado."};
  const allowed=scope.institutionWide?null:(scope.departmentIds||[]).map(String),exps=getOrCreateSheet(ss,"ExpedientesLaborales").getDataRange().getValues().slice(1),contracts=getOrCreateSheet(ss,"ContratosLaborales").getDataRange().getValues().slice(1),config=ensurePayrollEmployeePayConfigSheet_(ss).rows,planRows=getOrCreateSheet(ss,"PlanillasNomenclatura").getDataRange().getValues().slice(1);
  const start=new Date(period+"-01T00:00:00"),end=new Date(Number(period.slice(0,4)),Number(period.slice(5,7)),0,23,59,59,999),parseDate=v=>{if(!v)return null;const d=v instanceof Date?v:new Date(v);return isNaN(d.getTime())?null:d;};
  const active=exps.filter(e=>["ACTIVE","ACTIVO","ENPERIODOPRUEBA"].includes(normalizePayrollBatchValue_(e[8]))&&(!allowed||allowed.includes(String(e[4]||"").trim())));
  const configByEmployee=Object.create(null);config.forEach(r=>{const id=String(r[0]||"").trim();if(id){if(configByEmployee[id])configByEmployee[id].duplicate=true;else configByEmployee[id]=r;}});
  const groups=Object.create(null),excluded=[],included=[];const filters={departamento:String(p.departamento||"").trim(),cargo:String(p.cargo||"").trim(),tipoContrato:String(p.tipoContrato||"").trim(),modalidadPago:String(p.modalidadPago||"").trim(),frecuenciaPago:String(p.frecuenciaPago||"").trim(),search:normalizePayrollBatchValue_(p.search)};
  active.forEach(e=>{
   const id=String(e[0]||"").trim(),name=String(e[9]||e[3]||"Empleado"),position=String(e[3]||"Personal"),department=String(e[4]||"").trim();
   const contractsForEmployee=contracts.filter(c=>(String(c[1]||"").trim()===id||String(c[1]||"").trim()===String(e[2]||"").trim())&&!["ANULADO","INACTIVO"].includes(normalizePayrollBatchValue_(c[7]))&&(!c[3]||parseDate(c[3])&&parseDate(c[3])<=end)&&(!c[4]||parseDate(c[4])&&parseDate(c[4])>=start));
   if(contractsForEmployee.length!==1){excluded.push({empleadoId:id,empleadoNombre:name,motivo:contractsForEmployee.length?"CONTRATOS_SUPERPUESTOS":"SIN_CONTRATO_VIGENTE"});return;}
   const contract=contractsForEmployee[0];if(!Number.isFinite(Number(contract[5]))||Number(contract[5])<=0){excluded.push({empleadoId:id,empleadoNombre:name,motivo:"SALARIO_INVALIDO"});return;}const cfg=configByEmployee[id],cfgValid=!!(cfg&&!cfg.duplicate&&normalizePayrollBatchValue_(cfg[5])==="ACTIVO"&&(!cfg[3]||parseDate(cfg[3])&&parseDate(cfg[3])<=end)&&(!cfg[4]||parseDate(cfg[4])&&parseDate(cfg[4])>=start));
   const modality=cfgValid?String(cfg[1]):"NO_CONFIGURADA",frequency=cfgValid?String(cfg[2]):"MENSUAL",contractType=String(contract[2]||"NO_DEFINIDO");
   const candidate={empleadoId:id,empleadoNombre:name,puesto:position,departamento:department,tipoContrato:contractType,modalidadPago:modality,frecuenciaPago:frequency,pendienteValidacion:!cfgValid};
   if(filters.departamento&&department!==filters.departamento||filters.cargo&&position!==filters.cargo||filters.tipoContrato&&contractType!==filters.tipoContrato||filters.modalidadPago&&modality!==filters.modalidadPago||filters.frecuenciaPago&&frequency!==filters.frecuenciaPago||filters.search&&!normalizePayrollBatchValue_(name+" "+position+" "+id).includes(filters.search))return;
   included.push(candidate);
   const key=[department,position,contractType,modality,frequency].join("|");
   if(!groups[key])groups[key]={departamento:department,cargo:position,tipoContrato:contractType,modalidadPago:modality,frecuenciaPago:frequency,empleados:[],empleadoIds:[],pendientesValidacion:0};
   groups[key].empleados.push(candidate);groups[key].empleadoIds.push(id);if(!cfgValid)groups[key].pendientesValidacion++;
  });
  const periodRows=planRows.filter(r=>String(r[2]||"").trim()===period&&!["REEMPLAZADA","ANULADA","ANULADO","REVERTIDA","REVERTIDO","CANCELADA","CANCELADO"].includes(normalizePayrollBatchValue_(r[15])));
  const planIds=[...new Set(periodRows.map(r=>String(r[0]||"").trim()).filter(Boolean))];
  const processed=new Set(periodRows.map(r=>String(r[3]||"").trim()));included.forEach(e=>e.procesado=processed.has(e.empleadoId));
  const groupList=Object.keys(groups).sort().map(k=>{const g=groups[k];g.procesados=g.empleadoIds.filter(id=>processed.has(id)).length;g.pendientes=g.empleadoIds.length-g.procesados;g.employeeIdsPendientes=g.empleadoIds.filter(id=>!processed.has(id));return g;});
  return {status:"success",periodoMes:period,planillaId:planIds.length===1?planIds[0]:null,planillaAmbigua:planIds.length>1,contadores:{incluidos:included.length,procesadosCorrectamente:included.filter(e=>processed.has(e.empleadoId)).length,excluidosPorIncidencias:excluded.length,pendientesValidacion:included.filter(e=>e.pendienteValidacion&&!processed.has(e.empleadoId)).length,pendientesCalculo:included.filter(e=>!processed.has(e.empleadoId)).length},incidencias:excluded,grupos:groupList,empleados:included,umbralVariacion:10};
 }catch(e){return {status:"error",code:"PAYROLL_BATCH_PREVIEW_FAILED",message:"No fue posible preparar la segmentación de planilla."};}
}

function preparePayrollEmployeeRecalculation_(ss,planillaId,period,employeeIds,payload){
 const ids=[...new Set((employeeIds||[]).map(x=>String(x||"").trim()).filter(Boolean))];
 if(!ids.length||ids.length!==(employeeIds||[]).length)return {status:"error",code:"PAYROLL_RECALCULATION_EMPLOYEES_INVALID"};
 const actor=getVerifiedAccountingIdentity_(payload||{});if(!actor||!actor.authorized)return {status:"error",code:"VERIFIED_IDENTITY_REQUIRED"};
 const role=normalizePayrollRole_(actor.role);if(!["RECURSOSHUMANOS","ADMINISTRADOR","CONTADOR","CONTABILIDAD"].includes(role))return {status:"error",code:"ROLE_NOT_ALLOWED"};
 const scope=getVerifiedAccountingDepartmentScope_(payload||{},ss,actor);if(!scope||!scope.authorized)return {status:"error",code:"DEPARTMENT_SCOPE_NOT_ASSIGNED"};
 const plan=getOrCreateSheet(ss,"PlanillasNomenclatura"),data=plan.getDataRange().getValues();
 if(!data.length||!isValidPayrollPlanHeaders_(data[0]))return {status:"error",code:"RESOURCE_SCHEMA_INVALID"};
 const rows=data.slice(1).map((r,i)=>({row:r,index:i+2})).filter(x=>String(x.row[0]||"").trim()===String(planillaId).trim()&&String(x.row[2]||"").trim()===String(period).trim()&&String(x.row[15]||"").trim().toUpperCase()!=="REEMPLAZADA");
 if(!rows.length||rows.some(x=>normalizePayrollBatchValue_(x.row[15])!=="CALCULADA"))return {status:"error",code:"PAYROLL_RECALCULATION_REQUIRES_DRAFT",message:"Solo se pueden recalcular colaboradores de una planilla aún no aprobada."};
 const exps=getOrCreateSheet(ss,"ExpedientesLaborales").getDataRange().getValues().slice(1);
 const selected=rows.filter(x=>ids.includes(String(x.row[3]||"").trim()));
 if(selected.length!==ids.length||ids.some(id=>selected.filter(x=>String(x.row[3]||"").trim()===id).length!==1))return {status:"error",code:"PAYROLL_RECALCULATION_EMPLOYEE_NOT_FOUND"};
 const employees=ids.map(id=>{const matches=exps.filter(e=>String(e[0]||"").trim()===id);if(matches.length!==1)throw new Error("PAYROLL_RECALCULATION_EMPLOYEE_NOT_FOUND");const dept=String(matches[0][4]||"").trim();if(scope.institutionWide!==true&&!(scope.departmentIds||[]).map(String).includes(dept))throw new Error("RESOURCE_NOT_FOUND");return matches[0];});
 const ledger=getPayrollLoanLedger_(ss),loanOwnerIds=new Set(ids.concat(employees.map(e=>String(e[2]||"").trim()).filter(Boolean))),loanRows=ledger.rows.filter(r=>String(r[2]||"").trim()===String(planillaId).trim()&&loanOwnerIds.has(String(r[4]||"").trim()));
 const applied=loanRows.filter(r=>String(r[9]||"")==="APLICADO"),reversed=new Set(ledger.rows.filter(r=>String(r[9]||"")==="REVERSADO").map(r=>String(r[12]||"")));
 if(applied.some(r=>!reversed.has(String(r[0]||""))))return {status:"error",code:"PAYROLL_RECALCULATION_LOAN_ALREADY_APPLIED",message:"La amortización ya fue aplicada; use un ajuste compensatorio en lugar de recalcular."};
 const cancelEvents=loanRows.filter(r=>String(r[9]||"")==="CALCULADO"&&!ledger.rows.some(x=>String(x[9]||"")==="CANCELADO"&&String(x[12]||"")===String(r[0]||""))).map(r=>["PLM-"+Utilities.getUuid(),r[1],r[2],r[3],r[4],r[5],r[6],r[6],r[8],"CANCELADO",new Date(),actor.userId,r[0],"Recalculo controlado del colaborador"]);
 const expIds=new Set(ids),userIds=new Set(employees.map(e=>String(e[2]||"").trim()).filter(Boolean)),ownerIds=new Set(ids.concat([...userIds]));
 const capture=(name,predicate)=>{const sh=ss.getSheetByName(name);if(!sh)return [];const values=sh.getDataRange().getValues();return values.slice(1).map((row,i)=>({row,index:i+2})).filter(x=>predicate(x.row)).map(x=>({row:x.row.slice(),index:x.index}));};
 const snapshot={planillaId:String(planillaId),ownerIds,loanRows:loanRows.filter(r=>String(r[9]||"")==="CALCULADO"&&!ledger.rows.some(x=>String(x[9]||"")==="CANCELADO"&&String(x[12]||"")===String(r[0]||""))).map(r=>r.slice()),planRows:selected.map(x=>({row:x.row.slice(),index:x.index})),detailRows:capture("DetalleConceptosPlanilla",r=>String(r[1]||"").trim()===String(planillaId).trim()&&ids.includes(String(r[3]||"").trim())),overtimeRows:capture("AprobacionHorasExtras",r=>(expIds.has(String(r[1]||"").trim())||userIds.has(String(r[1]||"").trim()))&&String(r[9]||"").trim()===String(planillaId).trim()),attendanceRows:capture("DeduccionesAsistencia",r=>(expIds.has(String(r[2]||"").trim())||userIds.has(String(r[2]||"").trim()))&&String(r[8]||"").includes("[PROCESADA_NOMINA_"+planillaId+"]")),vacationRows:capture("SolicitudesVacaciones",r=>(expIds.has(String(r[1]||"").trim())||userIds.has(String(r[1]||"").trim()))&&String(r[8]||"").includes("[PROCESADA_NOMINA_"+planillaId+"]")),incapacityRows:capture("IncapacidadesMedicas",r=>(expIds.has(String(r[1]||"").trim())||userIds.has(String(r[1]||"").trim()))&&String(r[8]||"").includes("[PROCESADA_NOMINA_"+planillaId+"]"))};
 try {
 const resetMarkers=(sheetName,idColumn,obsColumn)=>{const sh=ss.getSheetByName(sheetName);if(!sh)return;const values=sh.getDataRange().getValues();for(let i=1;i<values.length;i++){const row=values[i],owner=String(row[idColumn]||"").trim(),obs=String(row[obsColumn]||"");if(!expIds.has(owner)&&!userIds.has(owner))continue;const marker="[PROCESADA_NOMINA_"+planillaId+"]";if(obs.includes(marker))sh.getRange(i+1,obsColumn+1).setValue(obs.replace(marker,"").trim());}};
 const overtime=ss.getSheetByName("AprobacionHorasExtras");if(overtime){const values=overtime.getDataRange().getValues();for(let i=1;i<values.length;i++){const r=values[i],owner=String(r[1]||"").trim();if((expIds.has(owner)||userIds.has(owner))&&String(r[9]||"").trim()===String(planillaId).trim()){overtime.getRange(i+1,10).setValue("");overtime.getRange(i+1,11).setValue("");}}}
 resetMarkers("DeduccionesAsistencia",2,8);resetMarkers("SolicitudesVacaciones",1,8);resetMarkers("IncapacidadesMedicas",1,8);
 selected.forEach(x=>plan.getRange(x.index,16).setValue("REEMPLAZADA"));
 const details=ss.getSheetByName("DetalleConceptosPlanilla");if(details){const values=details.getDataRange().getValues();for(let i=1;i<values.length;i++)if(String(values[i][1]||"").trim()===String(planillaId).trim()&&ids.includes(String(values[i][3]||"").trim()))details.getRange(i+1,20).setValue("CANCELADO");}
 if(cancelEvents.length)appendPayrollLoanLedgerEvents_(ss,cancelEvents);
 return {status:"success",reemplazados:ids.length,snapshot:snapshot,actorId:actor.userId};
 } catch(error) { try{rollbackPayrollEmployeeRecalculation_(ss,snapshot,actor.userId);}catch(rollbackError){return {status:"error",code:"PAYROLL_RECALCULATION_ROLLBACK_FAILED",message:"No fue posible restaurar la planilla tras el error."};}return {status:"error",code:"PAYROLL_RECALCULATION_PREPARE_FAILED",message:"No fue posible preparar el recálculo; los datos anteriores fueron restaurados."}; }
}

function rollbackPayrollEmployeeRecalculation_(ss,snapshot,actorId){
 if(!snapshot)return;
 const restore=(name,items)=>{const sh=ss.getSheetByName(name);if(!sh)return;(items||[]).forEach(x=>sh.getRange(x.index,1,1,x.row.length).setValues([x.row]));};
 restore("PlanillasNomenclatura",snapshot.planRows);restore("DetalleConceptosPlanilla",snapshot.detailRows);restore("AprobacionHorasExtras",snapshot.overtimeRows);restore("DeduccionesAsistencia",snapshot.attendanceRows);restore("SolicitudesVacaciones",snapshot.vacationRows);restore("IncapacidadesMedicas",snapshot.incapacityRows);
 const ledger=getPayrollLoanLedger_(ss),originalIds=new Set(snapshot.loanRows.map(r=>String(r[0]||""))),cancelled=new Set(ledger.rows.filter(r=>String(r[9]||"")==="CANCELADO").map(r=>String(r[12]||"")));
 const fresh=ledger.rows.filter(r=>String(r[2]||"").trim()===snapshot.planillaId&&snapshot.ownerIds.has(String(r[4]||"").trim())&&String(r[9]||"")==="CALCULADO"&&!originalIds.has(String(r[0]||"")));
 const cancelFresh=fresh.filter(r=>!cancelled.has(String(r[0]||""))).map(r=>["PLM-"+Utilities.getUuid(),r[1],r[2],r[3],r[4],r[5],r[6],r[6],r[8],"CANCELADO",new Date(),String(actorId||"SYSTEM_PAYROLL"),r[0],"Rollback de recálculo fallido"]);
 const reissue=snapshot.loanRows.filter(r=>cancelled.has(String(r[0]||""))).map(r=>["PLM-"+Utilities.getUuid(),r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],"CALCULADO",new Date(),String(actorId||"SYSTEM_PAYROLL"),"","Restauración de amortización por rollback"]);
 if(cancelFresh.length)appendPayrollLoanLedgerEvents_(ss,cancelFresh);if(reissue.length)appendPayrollLoanLedgerEvents_(ss,reissue);
}

function recalculatePayrollEmployees(payload){
 const p=payload||{},ids=Array.isArray(p.employeeIds)?p.employeeIds:[p.empleadoId].filter(Boolean);
 if(!String(p.planillaId||"").trim()||!String(p.periodoMes||"").trim()||!ids.length)return {status:"error",code:"PAYROLL_RECALCULATION_INVALID",message:"Planilla, período y colaboradores son obligatorios."};
 return calculatePayrollPeriod({periodoMes:p.periodoMes,planillaId:p.planillaId,recalculateEmployeeIds:ids,employeeIds:ids,sessionToken:p.sessionToken,authToken:p.authToken,token:p.token,identity:p.identity});
}

function getPayrollEmployerConceptTotalsByEmployee_(ss,planillaIds){
 const sheet=ss.getSheetByName("DetalleConceptosPlanilla"),totals=Object.create(null);if(!sheet)return totals;
 const headers=getPayrollConceptDetailHeaders_(),data=sheet.getDataRange().getValues();
 if(!data.length||!data[0]||data[0].length!==headers.length||headers.some((h,i)=>String(data[0][i]||"").trim().toUpperCase()!==h.toUpperCase()))throw new Error("RESOURCE_SCHEMA_INVALID: DetalleConceptosPlanilla");
 const ids=new Set((Array.isArray(planillaIds)?planillaIds:[planillaIds]).map(x=>String(x||"").trim()).filter(Boolean));
 data.slice(1).forEach(r=>{if(!ids.has(String(r[1]||"").trim())||String(r[19]||"").trim().toUpperCase()==="CANCELADO"||payrollConceptPhase_(r[6])!==3)return;const employee=String(r[3]||"").trim(),amount=Number(r[10]||0);if(!employee||!Number.isFinite(amount)||amount<0)throw new Error("PAYROLL_EMPLOYER_CONCEPT_INVALID");totals[employee]=Math.round(((totals[employee]||0)+amount)*100)/100;});
 return totals;
}

function getPayrollVarianceCauses_(ss,employeeId,currentPeriod,previousPeriod,currentRow,previousRow){
 const causes=[],id=String(employeeId||"").trim(),period=String(currentPeriod||"").trim(),prior=String(previousPeriod||"").trim();
 if(Number(currentRow[8]||0)>Number(previousRow[8]||0))causes.push({codigo:"HORAS_EXTRAS",descripcion:"Aumento de horas extras",monto:Number(currentRow[8]||0)-Number(previousRow[8]||0)});
 const ledgerSheet=ss.getSheetByName("AmortizacionPrestamosNomina");if(ledgerSheet){const employeeRows=ss.getSheetByName("ExpedientesLaborales"),employee=employeeRows?employeeRows.getDataRange().getValues().slice(1).find(x=>String(x[0]||"").trim()===id):null,owners=new Set([id,String(employee&&employee[2]||"").trim()].filter(Boolean)),rows=ledgerSheet.getDataRange().getValues().slice(1),current=rows.filter(r=>String(r[3]||"").trim()===period&&owners.has(String(r[4]||"").trim())&&["CALCULADO","APLICADO"].includes(String(r[9]||""))),previous=rows.filter(r=>String(r[3]||"").trim()===prior&&owners.has(String(r[4]||"").trim())&&["CALCULADO","APLICADO"].includes(String(r[9]||"")));const a=Math.round(current.reduce((t,r)=>t+Number(r[5]||0),0)*100)/100,b=Math.round(previous.reduce((t,r)=>t+Number(r[5]||0),0)*100)/100;if(a!==b)causes.push({codigo:"AMORTIZACION_PRESTAMO",descripcion:"Cambio en amortización de préstamos",monto:a-b});}
 const contracts=ss.getSheetByName("ContratosLaborales");
 if(contracts){
  const rows=contracts.getDataRange().getValues().slice(1),salaryFor=month=>{const start=new Date(month+"-01T00:00:00"),end=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0,23,59,59,999),matches=rows.filter(r=>(String(r[1]||"").trim()===id||String(r[1]||"").trim()===String(currentRow[3]||""))&&!["ANULADO","INACTIVO"].includes(normalizePayrollBatchValue_(r[7]))&&(!r[3]||new Date(r[3])<=end)&&(!r[4]||new Date(r[4])>=start));return matches.length===1?Number(matches[0][5]||0):null;};
  const currentSalary=salaryFor(period),priorSalary=salaryFor(prior);
  if(currentSalary!==null&&priorSalary!==null&&currentSalary!==priorSalary)causes.push({codigo:"CAMBIO_SALARIO_CONTRACTUAL",descripcion:"Cambio del salario base contractual vigente",monto:Math.round((currentSalary-priorSalary)*100)/100});
 }
 const attendance=ss.getSheetByName("DeduccionesAsistencia");if(attendance){const rows=attendance.getDataRange().getValues().slice(1),count=rows.filter(r=>(String(r[2]||"").trim()===id||String(r[2]||"").trim()===String(currentRow[3]||""))&&r[1]&&String((r[1] instanceof Date||Object.prototype.toString.call(r[1])==="[object Date]"?r[1].getFullYear()+"-"+String(r[1].getMonth()+1).padStart(2,"0"):r[1])).slice(0,7)===period&&["AUSENTE","INJUSTIFICADA","AUSENCIA INJUSTIFICADA"].includes(normalizePayrollBatchValue_(r[7]))).length;if(count)causes.push({codigo:"AUSENCIAS",descripcion:"Se registraron ausencias en el período",cantidad:count});}
 return causes;
}

// Restored catalog and inventory service; source reconciled with the last complete module snapshot.
const CATALOG_ITEM_HEADERS_=["ItemID","ItemCodigo","ItemNombre","NombreNormalizado","Descripcion","Categoria","Subcategoria","UnidadMedida","UnidadBase","FactorConversionBase","Marca","ModeloReferencia","ImagenUrl","CodigoBarras","CodigoQR","EspecificacionesTecnicas","ProveedorHabitualId","CostoReferencial","CostoUltimaAdquisicion","CostoPromedio","StockMinimo","StockMaximo","PuntoReposicion","Estado","Observaciones","CreadoPor","FechaCreacion","ActualizadoPor","FechaActualizacion","ActivoFijoRelacionadoId"];
const CATALOG_CATEGORY_HEADERS_=["CategoriaID","Nombre","NombreNormalizado","Estado","CreadoPor","FechaCreacion","ActualizadoPor","FechaActualizacion"];
const CATALOG_UNIT_HEADERS_=["UnidadID","Nombre","NombreNormalizado","UnidadBase","FactorConversionBase","Tipo","Estado","CreadoPor","FechaCreacion","ActualizadoPor","FechaActualizacion"];
const CATALOG_DEFAULT_CATEGORIES_=["Material didáctico","Útiles escolares","Papelería y oficina","Equipos tecnológicos","Mobiliario","Material de laboratorio","Insumos de enfermería","Productos de limpieza","Cafetería y tienda","Herramientas","Repuestos","Otros"];
const CATALOG_DEFAULT_UNITS_=[["Unidad","Cantidad"],["Litro","Volumen"],["Kilogramo","Masa"],["Metro","Longitud"]];
function catalogSheet_(ss,name,headers,create){let sh=ss.getSheetByName(name);if(!sh&&!create)return null;if(!sh)sh=ss.insertSheet(name);const v=sh.getDataRange().getValues();if(!v.length||!v[0].some(x=>String(x||"").trim()))sh.getRange(1,1,1,headers.length).setValues([headers.slice()]);else{const a=v[0].map(x=>String(x||"").trim()),prefix=a.length<=headers.length&&a.every((x,i)=>x===headers[i]);if(prefix&&a.length<headers.length){if(!create)throw new Error("CATALOG_SCHEMA_MIGRATION_REQUIRED:"+name);sh.getRange(1,a.length+1,1,headers.length-a.length).setValues([headers.slice(a.length)]);}else if(headers.some((h,i)=>String(v[0][i]||"").trim()!==h))throw new Error("CATALOG_SCHEMA_MISMATCH:"+name);}return sh;}
function catalogActor_(p,write){const a=getVerifiedAccountingIdentity_(p||{});if(!a.authorized)throw new Error(a.code||"VERIFIED_IDENTITY_REQUIRED");if(write){const r=String(a.role||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(["ADMINISTRADOR","DIRECTOR","SUBDIRECTOR","CONTADOR","ALMACENISTA","BODEGUERO","ENCARGADODEBODEGA"].indexOf(r)===-1)throw new Error("CATALOG_ROLE_NOT_ALLOWED");}return a;}
function catalogNormalizeText_(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," ");}
function catalogNormalizeCode_(v){return catalogNormalizeText_(v).toUpperCase().replace(/\s+/g,"-");}
function catalogEnsureDefaults_(ss,a){const c=catalogSheet_(ss,"CatalogoCategoriasArticulos",CATALOG_CATEGORY_HEADERS_,true);if(c.getDataRange().getValues().length<=1)CATALOG_DEFAULT_CATEGORIES_.forEach(n=>c.appendRow(["CAT-"+Utilities.getUuid(),n,catalogNormalizeText_(n),"Activo",a.userId,new Date(),"",""]));const u=catalogSheet_(ss,"CatalogoUnidadesMedida",CATALOG_UNIT_HEADERS_,true);if(u.getDataRange().getValues().length<=1)CATALOG_DEFAULT_UNITS_.forEach(x=>u.appendRow(["UND-"+Utilities.getUuid(),x[0],catalogNormalizeText_(x[0]),x[0],1,x[1],"Activo",a.userId,new Date(),"",""]));return {categories:c,units:u};}
function catalogFindUnit_(ss,n){const sh=catalogSheet_(ss,"CatalogoUnidadesMedida",CATALOG_UNIT_HEADERS_,false);if(!sh)throw new Error("CATALOG_UNITS_NOT_CONFIGURED");const k=catalogNormalizeText_(n),m=sh.getDataRange().getValues().slice(1).filter(r=>catalogNormalizeText_(r[1])===k&&String(r[6]||"Activo")==="Activo");if(m.length!==1)throw new Error(m.length?"CATALOG_UNIT_AMBIGUOUS":"CATALOG_UNIT_NOT_FOUND:"+n);const f=Number(m[0][4]);if(!Number.isFinite(f)||f<=0)throw new Error("CATALOG_UNIT_FACTOR_INVALID");return {id:m[0][0],name:m[0][1],base:m[0][3],factor:f,tipo:m[0][5]};}
function catalogFindItem_(ss,k,active){const sh=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,false);if(!sh)throw new Error("CATALOG_NOT_CONFIGURED");const key=String(k||"").trim(),norm=catalogNormalizeCode_(key),m=sh.getDataRange().getValues().slice(1).filter(r=>String(r[0]||"")===key||catalogNormalizeCode_(r[1])===norm);if(m.length!==1)throw new Error(m.length?"CATALOG_ITEM_AMBIGUOUS":"CATALOG_ITEM_NOT_FOUND:"+key);const r=m[0],state=String(r[23]||"");if(active&&state!=="Activo")throw new Error(state==="PendienteReconciliacion"?"CATALOG_ITEM_RECONCILIATION_REQUIRED":"CATALOG_ITEM_INACTIVE");return {id:r[0],code:r[1],name:r[2],category:r[5],unit:r[7],baseUnit:r[8],factor:Number(r[9]||1),state,row:r};}
function catalogSimilarItems_(rows,name,code){const n=catalogNormalizeText_(name),c=catalogNormalizeCode_(code),tokens=n.split(" ").filter(x=>x.length>2);return rows.filter(r=>{const rc=catalogNormalizeCode_(r[1]),rn=catalogNormalizeText_(r[2]);if(c&&rc===c)return false;if(n&&rn===n)return false;return (n&&((rn.includes(n)||n.includes(rn))||tokens.filter(t=>rn.includes(t)).length>=Math.max(1,Math.ceil(tokens.length*0.6))));}).slice(0,6).map(r=>({itemId:r[0],itemCodigo:r[1],itemNombre:r[2],categoria:r[5],estado:r[23]}));}
function catalogBuildItemValues_(ss,p,a,rows){const code=catalogNormalizeCode_(String(p.itemCodigo||p.codigo||"").trim()),name=String(p.itemNombre||p.nombre||"").trim(),ck=catalogNormalizeCode_(code),nk=catalogNormalizeText_(name),cat=String(p.categoria||"").trim(),un=String(p.unidadMedida||"").trim();if(!ck||!nk||!cat||!un)throw new Error("CATALOG_ITEM_REQUIRED_FIELDS");if(!/^[A-Z0-9][A-Z0-9._/-]{1,63}$/.test(ck))throw new Error("CATALOG_ITEM_CODE_INVALID");const cs=catalogSheet_(ss,"CatalogoCategoriasArticulos",CATALOG_CATEGORY_HEADERS_,false);if(!cs||cs.getDataRange().getValues().slice(1).filter(r=>catalogNormalizeText_(r[1])===catalogNormalizeText_(cat)&&String(r[3]||"Activo")==="Activo").length!==1)throw new Error("CATALOG_CATEGORY_NOT_FOUND_OR_AMBIGUOUS");const unit=catalogFindUnit_(ss,un),list=rows||catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,true).getDataRange().getValues().slice(1),requested=String(p.itemId||p.ItemID||""),existing=list.find(r=>requested&&String(r[0])===requested)||list.find(r=>catalogNormalizeCode_(r[1])===ck);if(existing&&catalogNormalizeCode_(existing[1])!==ck)throw new Error("CATALOG_ITEM_CODE_IMMUTABLE_REQUIRES_MIGRATION");if(list.some(r=>catalogNormalizeCode_(r[1])===ck&&(!existing||String(r[0])!==String(existing[0]))))throw new Error("CATALOG_ITEM_CODE_DUPLICATE");if(list.some(r=>catalogNormalizeText_(r[2])===nk&&catalogNormalizeText_(r[5])===catalogNormalizeText_(cat)&&(!existing||String(r[0])!==String(existing[0]))))throw new Error("CATALOG_ITEM_NAME_DUPLICATE");const num=(v,k)=>{if(v===undefined||v===null||v==="")return 0;const x=Number(v);if(!Number.isFinite(x)||x<0)throw new Error("CATALOG_ITEM_NUMBER_INVALID:"+k);return x;};const now=new Date(),min=num(p.stockMinimo,"stockMinimo"),max=num(p.stockMaximo,"stockMaximo"),reorder=num(p.puntoReposicion,"puntoReposicion"),state=String(p.estado||(existing?existing[23]:"Activo"));if(max>0&&max<min)throw new Error("CATALOG_STOCK_MAX_BELOW_MIN");if(max>0&&reorder>max)throw new Error("CATALOG_REORDER_ABOVE_MAX");if(["Activo","Inactivo","PendienteReconciliacion"].indexOf(state)===-1)throw new Error("CATALOG_ITEM_STATE_INVALID");return [existing?existing[0]:"ITM-"+Utilities.getUuid(),ck,name,nk,String(p.descripcion||""),cat,String(p.subcategoria||""),unit.name,unit.base,unit.factor,String(p.marca||""),String(p.modeloReferencia||p.modelo||""),String(p.imagenUrl||""),String(p.codigoBarras||""),String(p.codigoQR||""),String(p.especificacionesTecnicas||""),String(p.proveedorHabitualId||""),(existing&&(p.costoReferencial===undefined||p.costoReferencial==="")?Number(existing[17]||0):num(p.costoReferencial,"costoReferencial")),(existing&&(p.costoUltimaAdquisicion===undefined||p.costoUltimaAdquisicion==="")?Number(existing[18]||0):num(p.costoUltimaAdquisicion,"costoUltimaAdquisicion")),(existing&&(p.costoPromedio===undefined||p.costoPromedio==="")?Number(existing[19]||0):num(p.costoPromedio,"costoPromedio")),min,max,reorder,state,String(p.observaciones||""),existing?existing[25]:a.userId,existing?existing[26]:now,a.userId,now,String(p.activoFijoRelacionadoId||"")];}
function manageCatalogCategory(p){p=p||{};const a=catalogActor_(p,true),ss=SpreadsheetApp.openById(SPREADSHEET_ID),l=LockService.getScriptLock();l.waitLock(15000);try{catalogEnsureDefaults_(ss,a);const sh=catalogSheet_(ss,"CatalogoCategoriasArticulos",CATALOG_CATEGORY_HEADERS_,true),rows=sh.getDataRange().getValues(),name=String(p.nombre||"").trim(),norm=catalogNormalizeText_(name),id=String(p.categoriaId||"");if(!name)throw new Error("CATALOG_CATEGORY_NAME_REQUIRED");const f=rows.slice(1).map((r,i)=>({r,i})).find(x=>id&&String(x.r[0])===id),dup=rows.slice(1).find(r=>catalogNormalizeText_(r[1])===norm&&(!f||String(r[0])!==String(f.r[0])));if(dup)throw new Error("CATALOG_CATEGORY_DUPLICATE");const v=[f?f.r[0]:"CAT-"+Utilities.getUuid(),name,norm,String(p.estado||"Activo"),f?f.r[4]:a.userId,f?f.r[5]:new Date(),a.userId,new Date()];if(f)sh.getRange(f.i+2,1,1,v.length).setValues([v]);else sh.appendRow(v);return {status:"success",categoriaId:v[0],nombre:name};}finally{l.releaseLock();}}
function getCatalogCategories(p){catalogActor_(p,false);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=catalogSheet_(ss,"CatalogoCategoriasArticulos",CATALOG_CATEGORY_HEADERS_,false),rows=sh?sh.getDataRange().getValues().slice(1).filter(r=>String(r[3]||"Activo")==="Activo"):[];const categorias=rows.length?rows.map(r=>({categoriaId:r[0],nombre:r[1],estado:r[3]})):CATALOG_DEFAULT_CATEGORIES_.map((nombre,i)=>({categoriaId:"DEFAULT-CAT-"+(i+1),nombre,estado:"Activo"}));return {status:"success",categorias};}
function manageCatalogUnit(p){p=p||{};const a=catalogActor_(p,true),ss=SpreadsheetApp.openById(SPREADSHEET_ID),l=LockService.getScriptLock();l.waitLock(15000);try{catalogEnsureDefaults_(ss,a);const sh=catalogSheet_(ss,"CatalogoUnidadesMedida",CATALOG_UNIT_HEADERS_,true),rows=sh.getDataRange().getValues(),name=String(p.nombre||"").trim(),norm=catalogNormalizeText_(name),base=String(p.unidadBase||name).trim(),factor=Number(p.factorConversionBase===undefined?1:p.factorConversionBase),tipo=String(p.tipo||"Cantidad").trim(),id=String(p.unidadId||"");if(!name||!base||!Number.isFinite(factor)||factor<=0)throw new Error("CATALOG_UNIT_VALUES_INVALID");if(catalogNormalizeText_(base)===norm&&Math.abs(factor-1)>0.0000001)throw new Error("CATALOG_BASE_UNIT_FACTOR_MUST_BE_ONE");if(catalogNormalizeText_(base)!==norm){const bu=catalogFindUnit_(ss,base);if(catalogNormalizeText_(bu.base)!==catalogNormalizeText_(base)||catalogNormalizeText_(bu.tipo)!==catalogNormalizeText_(tipo))throw new Error("CATALOG_UNIT_BASE_INCOMPATIBLE");}const f=rows.slice(1).map((r,i)=>({r,i})).find(x=>id&&String(x.r[0])===id),dup=rows.slice(1).find(r=>catalogNormalizeText_(r[1])===norm&&(!f||String(r[0])!==String(f.r[0])));if(dup)throw new Error("CATALOG_UNIT_DUPLICATE");const v=[f?f.r[0]:"UND-"+Utilities.getUuid(),name,norm,base,factor,tipo,String(p.estado||"Activo"),f?f.r[7]:a.userId,f?f.r[8]:new Date(),a.userId,new Date()];if(f)sh.getRange(f.i+2,1,1,v.length).setValues([v]);else sh.appendRow(v);return {status:"success",unidadId:v[0],nombre:name,unidadBase:base,factorConversionBase:factor};}finally{l.releaseLock();}}
function getCatalogUnits(p){catalogActor_(p,false);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=catalogSheet_(ss,"CatalogoUnidadesMedida",CATALOG_UNIT_HEADERS_,false),rows=sh?sh.getDataRange().getValues().slice(1).filter(r=>String(r[6]||"Activo")==="Activo"&&Number(r[4])>0):[];const unidades=rows.length?rows.map(r=>({unidadId:r[0],nombre:r[1],unidadBase:r[3],factorConversionBase:Number(r[4]),tipo:r[5]})):CATALOG_DEFAULT_UNITS_.map((x,i)=>({unidadId:"DEFAULT-UND-"+(i+1),nombre:x[0],unidadBase:x[0],factorConversionBase:1,tipo:x[1]}));return {status:"success",unidades};}
function manageCatalogItem(p){p=p||{};const a=catalogActor_(p,true),ss=SpreadsheetApp.openById(SPREADSHEET_ID),l=LockService.getScriptLock();l.waitLock(15000);try{catalogEnsureDefaults_(ss,a);const sh=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,true),rows=sh.getDataRange().getValues(),all=rows.slice(1),action=String(p.accion||"guardar").toLowerCase(),key=String(p.itemId||p.ItemID||p.itemCodigo||p.codigo||"").trim();if(action==="desactivar"||action==="activar"){const item=catalogFindItem_(ss,key,false),i=all.findIndex(r=>String(r[0])===String(item.id)),r=all[i];r[23]=action==="activar"?"Activo":"Inactivo";r[27]=a.userId;r[28]=new Date();sh.getRange(i+2,1,1,CATALOG_ITEM_HEADERS_.length).setValues([r.slice(0,CATALOG_ITEM_HEADERS_.length)]);return {status:"success",itemId:item.id,estado:r[23]};}const v=catalogBuildItemValues_(ss,p,a,all),i=all.findIndex(r=>String(r[0])===String(v[0]));const similar=catalogSimilarItems_(all,p.itemNombre||p.nombre,p.itemCodigo||p.codigo).filter(x=>String(x.itemId)!==String(v[0]));if(similar.length&&p.confirmarDuplicado!==true)return {status:"warning",code:"CATALOG_POSSIBLE_DUPLICATES",suggestions:similar};if(i>=0)sh.getRange(i+2,1,1,v.length).setValues([v]);else sh.appendRow(v);return {status:"success",itemId:v[0],itemCodigo:v[1],estado:v[23]};}finally{l.releaseLock();}}
function getCatalogItems(p){
 catalogActor_(p,false);p=p||{};const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,false),rows=sh?sh.getDataRange().getValues().slice(1):[],inactive=p.incluirInactivos===true,q=catalogNormalizeText_(p.query||"");
 const items=rows.filter(r=>(inactive||String(r[23])==="Activo")&&(!q||catalogNormalizeText_(r[1]).includes(q)||catalogNormalizeText_(r[2]).includes(q)||catalogNormalizeText_(r[5]).includes(q))).map(r=>({itemId:r[0],itemCodigo:r[1],itemNombre:r[2],descripcion:r[4],categoria:r[5],subcategoria:r[6],unidadMedida:r[7],unidadBase:r[8],factorConversionBase:Number(r[9]||1),marca:r[10],modeloReferencia:r[11],imagenUrl:r[12],codigoBarras:r[13],codigoQR:r[14],especificacionesTecnicas:r[15],proveedorHabitualId:r[16],costoReferencial:Number(r[17]||0),costoUltimaAdquisicion:Number(r[18]||0),costoPromedio:Number(r[19]||0),stockMinimo:Number(r[20]||0),stockMaximo:Number(r[21]||0),puntoReposicion:Number(r[22]||0),estado:r[23],observaciones:r[24],activoFijoRelacionadoId:r[29]}));
 const known=new Set(rows.map(r=>catalogNormalizeCode_(r[1]))),legacyMap={};
 const addLegacy=(code,name,category)=>{const c=String(code||"").trim(),k=catalogNormalizeCode_(c);if(c&&!known.has(k)&&!legacyMap[k])legacyMap[k]={itemCodigo:c,itemNombre:String(name||c),categoria:String(category||"Otros"),estado:"PendienteReconciliacion"};};
 const kardex=ss.getSheetByName("InventariosKardex");(kardex?kardex.getDataRange().getValues().slice(1):[]).forEach(r=>addLegacy(r[2],r[3],r[4]));
 ["SolicitudesCompra","OrdenesCompra","MaterialesSolicitudes"].forEach(name=>{const sheet=ss.getSheetByName(name);if(!sheet)return;sheet.getDataRange().getValues().slice(1).forEach(r=>{let list=[];try{list=typeof r[6]==="string"?JSON.parse(r[6]||"[]"):(r[6]||[]);}catch(_){}if(name==="MaterialesSolicitudes"){try{list=typeof r[4]==="string"?JSON.parse(r[4]||"[]"):(r[4]||[]);}catch(_){list=[];}}if(Array.isArray(list))list.forEach(x=>addLegacy(x.codigoItem||x.itemCodigo||x.itemId||x.ItemId,x.itemNombre||x.nombreItem||x.descripcion,"Otros"));});});
 return {status:"success",items,pendientesReconciliacion:Object.values(legacyMap),sugerencias:q?catalogSimilarItems_(rows,p.query,p.query):[]};
}
function importCatalogItems(p){p=p||{};const a=catalogActor_(p,true),ss=SpreadsheetApp.openById(SPREADSHEET_ID),l=LockService.getScriptLock();l.waitLock(15000);try{catalogEnsureDefaults_(ss,a);let items=Array.isArray(p.items)?p.items:null;if(!items){const csv=String(p.csv||"");if(!csv)throw new Error("CATALOG_IMPORT_CONTENT_REQUIRED");const parsed=Utilities.parseCsv(csv);if(parsed.length<2)throw new Error("CATALOG_IMPORT_EMPTY");const h=parsed.shift().map(catalogNormalizeText_);items=parsed.filter(r=>r.some(v=>String(v||"").trim())).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]||"");return {itemCodigo:o.itemcodigo||o.codigo,itemNombre:o.itemnombre||o.nombre,descripcion:o.descripcion,categoria:o.categoria,subcategoria:o.subcategoria,unidadMedida:o.unidadmedida||o.unidad,marca:o.marca,modeloReferencia:o.modeloreferencia||o.modelo,imagenUrl:o.imagenurl,codigoBarras:o.codigobarras,codigoQR:o.codigoqr,especificacionesTecnicas:o.especificacionestecnicas,proveedorHabitualId:o.proveedorhabitualid,costoReferencial:o.costoreferencial,costoUltimaAdquisicion:o.costoultimaadquisicion,costoPromedio:o.costopromedio,stockMinimo:o.stockminimo,stockMaximo:o.stockmaximo,puntoReposicion:o.puntoreposicion,activoFijoRelacionadoId:o.activofijorelacionadoid,observaciones:o.observaciones};});}const sh=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,true),rows=sh.getDataRange().getValues().slice(1),prepared=[],codes=new Set(rows.map(r=>catalogNormalizeCode_(r[1]))),names=new Set(rows.map(r=>catalogNormalizeText_(r[2])+"|"+catalogNormalizeText_(r[5])));for(let i=0;i<items.length;i++){const v=catalogBuildItemValues_(ss,items[i],a,rows.concat(prepared)),c=catalogNormalizeCode_(v[1]),n=catalogNormalizeText_(v[2])+"|"+catalogNormalizeText_(v[5]);if(codes.has(c)||names.has(n))throw new Error("CATALOG_IMPORT_DUPLICATE_ROW_"+(i+2));codes.add(c);names.add(n);prepared.push(v);}if(prepared.length)sh.getRange(sh.getLastRow()+1,1,prepared.length,CATALOG_ITEM_HEADERS_.length).setValues(prepared);return {status:"success",importados:prepared.length};}finally{l.releaseLock();}}
function exportCatalogItems(p){catalogActor_(p,false);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,false),rows=sh?sh.getDataRange().getValues():[CATALOG_ITEM_HEADERS_],csv=rows.map(r=>r.map(v=>'"'+String(v===undefined||v===null?"":v).replace(/"/g,'""')+'"').join(",")).join("\r\n");return {status:"success",filename:"catalogo-articulos.csv",csv:"\uFEFF"+csv};}
function catalogEnsureKardexSchema_(ss){const h=["KardexID","Fecha","ItemCodigo","ItemNombre","CategoriaTipo","TipoMovimiento","Cantidad","StockAnterior","StockNuevo","StockMinimo","UbicacionResponsable","Observaciones","CatalogoItemID","CantidadBase","UnidadMedidaOriginal","FactorConversion"],sh=getOrCreateSheet(ss,"InventariosKardex"),v=sh.getDataRange().getValues();if(!v.length||!v[0].some(x=>String(x||"").trim()))sh.getRange(1,1,1,h.length).setValues([h]);else{const a=v[0].map(x=>String(x||"").trim()),prefix=a.length<=h.length&&a.every((x,i)=>x===h[i]);if(prefix&&a.length<h.length)sh.getRange(1,a.length+1,1,h.length-a.length).setValues([h.slice(a.length)]);else if(h.slice(0,12).some((x,i)=>a[i]!==x))throw new Error("INVENTORY_KARDEX_SCHEMA_MISMATCH");}return sh;}


const INVENTORY_VALUATION_LAYER_HEADERS_=["CapaID","FechaAdquisicion","ItemID","ItemCodigo","Ubicacion","KardexOrigenID","DocumentoOrigen","Metodo","CantidadInicial","CantidadDisponible","CostoUnitario","ValorInicial","EstadoCosto","FechaRegistro","Referencia"];
const INVENTORY_VALUATION_MOVEMENT_HEADERS_=["ValoracionMovimientoID","KardexID","Fecha","ItemID","ItemCodigo","Ubicacion","TipoMovimiento","Cantidad","CostoUnitario","CostoTotal","Metodo","AsignacionesJSON","CapasAgregadasJSON","DocumentoOrigen","EstadoCosto","CreadoPor"];
const INVENTORY_VALUATION_POLICY_HEADERS_=["Categoria","Metodo","ActualizadoPor","FechaActualizacion"];
function inventoryValuationSnapshot_(ss){
 const snapshot={};["InventoryValuationLayers","InventoryValuationMovements"].forEach(name=>{const sh=ss.getSheetByName(name);snapshot[name]=sh?sh.getDataRange().getValues().map(r=>r.slice()):null;});return snapshot;
}
function inventoryValuationRestore_(ss,snapshot){
 if(!snapshot)return;Object.keys(snapshot).forEach(name=>{const saved=snapshot[name];let sh=ss.getSheetByName(name);if(!sh)return;
  while(sh.getLastRow()>(saved?saved.length:0))sh.deleteRow(sh.getLastRow());
  if(saved&&saved.length){const width=Math.max(...saved.map(r=>r.length));const values=saved.map(r=>{const row=r.slice();while(row.length<width)row.push("");return row;});sh.getRange(1,1,values.length,width).setValues(values);}
 });
}
function inventoryValuationMoney_(n){return Math.round((Number(n)||0)*100)/100;}
function inventoryValuationSheet_(ss,name,headers,create){
 let sh=ss.getSheetByName(name);if(!sh&&!create)return null;if(!sh)sh=ss.insertSheet(name);
 const v=sh.getDataRange().getValues();if(!v.length||!v[0].some(x=>String(x||"").trim()))sh.getRange(1,1,1,headers.length).setValues([headers.slice()]);
 else{const a=v[0].map(x=>String(x||"").trim()),prefix=a.length<=headers.length&&a.every((x,i)=>x===headers[i]);if(prefix&&a.length<headers.length)sh.getRange(1,a.length+1,1,headers.length-a.length).setValues([headers.slice(a.length)]);else if(headers.some((h,i)=>a[i]!==h))throw new Error("INVENTORY_VALUATION_SCHEMA_MISMATCH:"+name);}
 return sh;
}
function inventoryValuationMethod_(ss,category){
 const sh=inventoryValuationSheet_(ss,"InventoryValuationPolicies",INVENTORY_VALUATION_POLICY_HEADERS_,true),key=catalogNormalizeText_(category),rows=sh.getDataRange().getValues().slice(1),matches=rows.filter(r=>catalogNormalizeText_(r[0])===key);
 if(matches.length>1)throw new Error("INVENTORY_VALUATION_POLICY_AMBIGUOUS:"+category);
 const method=matches.length?String(matches[0][1]||""):"PEPS";
 if(["PEPS","PROMEDIO_PONDERADO"].indexOf(method)===-1)throw new Error("INVENTORY_VALUATION_METHOD_INVALID:"+method);
 return method;
}
function configureInventoryValuationPolicy(p){
 p=p||{};const actor=catalogActor_(p,true),category=String(p.categoria||"").trim(),method=String(p.metodo||"").trim().toUpperCase();
 if(!category||["PEPS","PROMEDIO_PONDERADO"].indexOf(method)===-1)throw new Error("INVENTORY_VALUATION_POLICY_FIELDS_INVALID");
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),lock=LockService.getScriptLock();lock.waitLock(15000);
 try{const sh=inventoryValuationSheet_(ss,"InventoryValuationPolicies",INVENTORY_VALUATION_POLICY_HEADERS_,true),rows=sh.getDataRange().getValues(),matches=rows.map((r,i)=>({r,i})).filter(x=>x.i>0&&catalogNormalizeText_(x.r[0])===catalogNormalizeText_(category));if(matches.length>1)throw new Error("INVENTORY_VALUATION_POLICY_AMBIGUOUS");
  const currentMethod=matches.length?String(matches[0].r[1]||"PEPS"):"PEPS";
  if(currentMethod!==method){
   const layerSheet=inventoryValuationSheet_(ss,"InventoryValuationLayers",INVENTORY_VALUATION_LAYER_HEADERS_,false),catalog=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,false),categoryCodes=Object.create(null);
   if(catalog)catalog.getDataRange().getValues().slice(1).forEach(r=>{if(catalogNormalizeText_(r[5])===catalogNormalizeText_(category))categoryCodes[catalogNormalizeCode_(r[1])]=true;});
   const hasValuedStock=layerSheet&&layerSheet.getDataRange().getValues().slice(1).some(r=>Number(r[9]||0)>.0001&&(!catalog||categoryCodes[catalogNormalizeCode_(r[3])]===true));
   if(hasValuedStock)throw new Error("INVENTORY_VALUATION_METHOD_CHANGE_REQUIRES_MIGRATION:"+category);
  }
  const row=[category,method,actor.userId,new Date()];if(matches.length)sh.getRange(matches[0].i+1,1,1,row.length).setValues([row]);else sh.appendRow(row);return {status:"success",categoria:category,metodo:method};}finally{lock.releaseLock();}
}
function inventoryValuationFindMovement_(ss,kardexId){
 const sh=inventoryValuationSheet_(ss,"InventoryValuationMovements",INVENTORY_VALUATION_MOVEMENT_HEADERS_,false);if(!sh)return null;
 const rows=sh.getDataRange().getValues().slice(1),matches=rows.filter(r=>String(r[1])===String(kardexId));
 if(matches.length>1)throw new Error("INVENTORY_VALUATION_MOVEMENT_AMBIGUOUS:"+kardexId);
 return matches[0]||null;
}
function inventoryValuationEnsureCoverage_(ss,item,location,currentStock,method,layerSheet){
 const rows=layerSheet.getDataRange().getValues().slice(1),code=catalogNormalizeCode_(item.code),loc=String(location||"Bodega General").trim().toLowerCase();
 let layers=rows.filter(r=>catalogNormalizeCode_(r[3])===code&&String(r[4]||"").trim().toLowerCase()===loc&&Number(r[9]||0)>0);
 const knownQty=layers.reduce((n,r)=>n+Number(r[9]||0),0),delta=inventoryValuationMoney_(Number(currentStock||0)-knownQty);
 if(delta<-.01)throw new Error("INVENTORY_VALUATION_STOCK_MISMATCH:"+code+":"+location+":"+knownQty+":"+currentStock);
 if(delta>.01){
  const avg=Number(item.row&&item.row[19]||0),last=Number(item.row&&item.row[18]||0),cost=avg>0?avg:last>0?last:0,status=cost>0?"ConciliacionInicial":"PendienteCosto",now=new Date(),id=method==="PROMEDIO_PONDERADO"?"AVG:"+code+":"+loc:"IVL-LEGACY-"+Utilities.getUuid();
  const row=[id,now,item.id,code,String(location||"Bodega General"),"LEGACY:"+code,"APERTURA_LEGACY",method,delta,delta,cost,inventoryValuationMoney_(delta*cost),status,now,"Saldo previo a valoración; requiere conciliación de costo"];
  layerSheet.appendRow(row);layers.push(row);
 }
 return layers;
}
function inventoryValuationApplyMovement_(ss,item,p,kardexId,qty,type,location,currentStock){
 const layerSheet=inventoryValuationSheet_(ss,"InventoryValuationLayers",INVENTORY_VALUATION_LAYER_HEADERS_,true),movementSheet=inventoryValuationSheet_(ss,"InventoryValuationMovements",INVENTORY_VALUATION_MOVEMENT_HEADERS_,true);
 const prior=inventoryValuationFindMovement_(ss,kardexId);
 if(prior)return {costoUnitario:Number(prior[8]||0),costoTotal:Number(prior[9]||0),metodo:prior[10],asignaciones:JSON.parse(String(prior[11]||"[]")),capasAgregadas:JSON.parse(String(prior[12]||"[]")),estadoCosto:prior[14]||"Valorado",idempotent:true};
 const method=inventoryValuationMethod_(ss,item.category),code=catalogNormalizeCode_(item.code),loc=String(location||"Bodega General").trim(),outgoing=["Salida","Prestamo","Baja","TransferenciaSalida","Consumo","AjusteNegativo"].indexOf(type)!==-1,incoming=["Entrada","Devolucion","AjustePositivo"].indexOf(type)!==-1;
 let assignments=[],adds=[],total=0,status="Valorado",unitCost=0;
 let layers=inventoryValuationEnsureCoverage_(ss,item,loc,currentStock,method,layerSheet);
 if(outgoing){
  if(method==="PEPS"){
   layers=layers.slice().sort((a,b)=>new Date(a[1]).getTime()-new Date(b[1]).getTime()||String(a[0]).localeCompare(String(b[0])));
   let remaining=qty;
   for(const layer of layers){if(remaining<=0.000001)break;if(String(layer[12])==="PendienteCosto"||Number(layer[10]||0)<=0)throw new Error("INVENTORY_ITEM_COST_REQUIRED:"+code);const take=Math.min(remaining,Number(layer[9]||0));if(take<=0)continue;const amount=inventoryValuationMoney_(take*Number(layer[10]));assignments.push({capaId:layer[0],cantidad:take,costoUnitario:Number(layer[10]),fechaAdquisicion:layer[1],documentoOrigen:layer[6]});total+=amount;const idx=layerSheet.getDataRange().getValues().findIndex((r,i)=>i>0&&String(r[0])===String(layer[0]));layerSheet.getRange(idx+1,10).setValue(inventoryValuationMoney_(Number(layer[9])-take));remaining=inventoryValuationMoney_(remaining-take);}
   if(remaining>.000001)throw new Error("INVENTORY_VALUATION_LAYERS_INSUFFICIENT:"+code+":"+remaining);
  }else{
   const layer=layers.find(x=>String(x[8])==="PROMEDIO"||String(x[7])==="PROMEDIO_PONDERADO")||layers[0];
   if(!layer||String(layer[12])==="PendienteCosto"||Number(layer[10]||0)<=0)throw new Error("INVENTORY_ITEM_COST_REQUIRED:"+code);
   unitCost=Number(layer[10]);total=inventoryValuationMoney_(qty*unitCost);assignments=[{capaId:layer[0],cantidad:qty,costoUnitario:unitCost,fechaAdquisicion:layer[1],documentoOrigen:layer[6]}];
   const idx=layerSheet.getDataRange().getValues().findIndex((r,i)=>i>0&&String(r[0])===String(layer[0]));layerSheet.getRange(idx+1,10).setValue(inventoryValuationMoney_(Number(layer[9])-qty));
  }
  unitCost=qty?inventoryValuationMoney_(total/qty):0;
 }else if(incoming){
  const transferred=Array.isArray(p.capasTransferencia)?p.capasTransferencia:null;
  if(transferred&&transferred.length){
   let transferredQty=0;
   transferred.forEach((x,i)=>{const q=Number(x.cantidad),c=Number(x.costoUnitario);if(!Number.isFinite(q)||q<=0||!Number.isFinite(c)||c<=0)throw new Error("INVENTORY_TRANSFER_VALUATION_INVALID");transferredQty+=q;const add={capaId:"IVL-"+Utilities.getUuid(),fechaAdquisicion:x.fechaAdquisicion||new Date(),cantidad:q,costoUnitario:c,documentoOrigen:x.documentoOrigen||p.documentOrigen||"",metodo:method};adds.push(add);});
   if(Math.abs(transferredQty-qty)>.01)throw new Error("INVENTORY_TRANSFER_VALUATION_QUANTITY_MISMATCH");
   total=inventoryValuationMoney_(adds.reduce((n,x)=>n+x.cantidad*x.costoUnitario,0));unitCost=inventoryValuationMoney_(total/qty);
  }else{
   const explicit=Number(p.costoUnitario!==undefined?p.costoUnitario:(p.precioUnitario!==undefined?p.precioUnitario:(p.costoTotal!==undefined?Number(p.costoTotal)/qty:0)));
   const catalogAverage=Number(item.row&&item.row[19]||0),catalogLast=Number(item.row&&item.row[18]||0),catalogCost=p.exigirCostoDocumento?0:(catalogAverage>0?catalogAverage:catalogLast);
   unitCost=Number.isFinite(explicit)&&explicit>0?explicit:catalogCost>0?catalogCost:0;
   if(unitCost>0){total=inventoryValuationMoney_(qty*unitCost);adds=[{capaId:"IVL-"+Utilities.getUuid(),fechaAdquisicion:p.fechaAdquisicion||new Date(),cantidad:qty,costoUnitario:unitCost,documentoOrigen:p.ordenCompraId||p.facturaId||p.documentOrigen||"",metodo:method}];}
   else{status="PendienteCosto";total=0;unitCost=0;adds=[{capaId:"IVL-"+Utilities.getUuid(),fechaAdquisicion:p.fechaAdquisicion||new Date(),cantidad:qty,costoUnitario:0,documentoOrigen:p.ordenCompraId||p.facturaId||p.documentOrigen||"",metodo:method,estadoCosto:"PendienteCosto"}];}
  }
  if(method==="PROMEDIO_PONDERADO"&&adds.length){
   const pool=layers.find(x=>String(x[0]).indexOf("AVG:")===0),validQty=pool?Number(pool[9]||0):0,validValue=pool?validQty*Number(pool[10]||0):0,addedValue=inventoryValuationMoney_(adds.reduce((n,x)=>n+x.cantidad*x.costoUnitario,0)),newQty=validQty+qty;
   // El movimiento conserva el costo real de la entrada; el promedio solo actualiza el costo de las existencias restantes.
   assignments=adds.map(x=>({capaId:x.capaId,cantidad:x.cantidad,costoUnitario:x.costoUnitario,fechaAdquisicion:x.fechaAdquisicion,documentoOrigen:x.documentoOrigen}));
   total=addedValue;unitCost=qty?inventoryValuationMoney_(addedValue/qty):0;
   if(adds.some(x=>x.costoUnitario<=0)||(pool&&String(pool[12])==="PendienteCosto")){
    status="PendienteCosto";
    if(pool){const idx=layerSheet.getDataRange().getValues().findIndex((r,i)=>i>0&&String(r[0])===String(pool[0]));layerSheet.getRange(idx+1,9).setValue(newQty);layerSheet.getRange(idx+1,10).setValue(newQty);layerSheet.getRange(idx+1,13).setValue("PendienteCosto");}
    else{const id="AVG:"+code+":"+loc.toLowerCase();layerSheet.appendRow([id,new Date(),item.id,code,loc,kardexId,p.documentOrigen||"","PROMEDIO_PONDERADO",newQty,newQty,0,0,"PendienteCosto",new Date(),"Costo pendiente de conciliación"]);}
    adds=[];
   }else{
    const newAvg=inventoryValuationMoney_((validValue+addedValue)/newQty);
    if(pool){const idx=layerSheet.getDataRange().getValues().findIndex((r,i)=>i>0&&String(r[0])===String(pool[0]));layerSheet.getRange(idx+1,9).setValue(newQty);layerSheet.getRange(idx+1,10).setValue(newQty);layerSheet.getRange(idx+1,11).setValue(newAvg);layerSheet.getRange(idx+1,12).setValue(inventoryValuationMoney_(newQty*newAvg));}
    else{const id="AVG:"+code+":"+loc.toLowerCase();layerSheet.appendRow([id,new Date(),item.id,code,loc,kardexId,p.documentOrigen||"","PROMEDIO_PONDERADO",newQty,newQty,newAvg,inventoryValuationMoney_(newQty*newAvg),"Valorado",new Date(),""]);adds=[];}
   }
  }
 }else throw new Error("INVENTORY_VALUATION_MOVEMENT_TYPE_UNSUPPORTED:"+type);
 if(method==="PEPS"&&incoming||method==="PROMEDIO_PONDERADO"&&incoming&&status==="PendienteCosto"){
  adds.forEach(x=>{const row=[x.capaId,x.fechaAdquisicion,item.id,code,loc,kardexId,x.documentoOrigen||p.documentOrigen||"",method,x.cantidad,x.cantidad,x.costoUnitario,inventoryValuationMoney_(x.cantidad*x.costoUnitario),x.estadoCosto||status,new Date(),p.referenciaMovimiento||""];layerSheet.appendRow(row);});
 }
 if(method==="PROMEDIO_PONDERADO"&&incoming&&status==="Valorado"&&!adds.length){
  // The weighted-average pool was updated above; no acquisition layer is retained.
 }
 const movementId="IVM-"+Utilities.getUuid(),savedAssignments=assignments.map(x=>({capaId:x.capaId,cantidad:x.cantidad,costoUnitario:x.costoUnitario,fechaAdquisicion:x.fechaAdquisicion,documentoOrigen:x.documentoOrigen}));
 movementSheet.appendRow([movementId,kardexId,new Date(),item.id,code,loc,type,qty,unitCost,total,method,JSON.stringify(savedAssignments),JSON.stringify(adds),p.ordenCompraId||p.facturaId||p.documentOrigen||"",status,p.creadoPor||p.authenticatedUserId||p.userId||""]);
 return {costoUnitario:unitCost,costoTotal:total,metodo:method,asignaciones:savedAssignments,capasAgregadas:adds,estadoCosto:status,idempotent:false};
}
function inventoryValuationMovementResult_(ss,kardexId){
 const r=inventoryValuationFindMovement_(ss,kardexId);if(!r)throw new Error("INVENTORY_VALUATION_MOVEMENT_MISSING:"+kardexId);
 return {kardexId:kardexId,costoUnitarioValoracion:Number(r[8]||0),costoTotalValoracion:Number(r[9]||0),metodoValoracion:r[10],capasTransferencia:JSON.parse(String(r[11]||"[]")),estadoCosto:r[14]||"Valorado"};
}
function inventoryValuationSliceLayers_(layers,quantity){
 let left=Number(quantity),out=[];for(const x of (layers||[])){if(left<=.000001)break;const take=Math.min(left,Number(x.cantidad||0));if(take>0){out.push({cantidad:take,costoUnitario:Number(x.costoUnitario),fechaAdquisicion:x.fechaAdquisicion,documentoOrigen:x.documentoOrigen});left=inventoryValuationMoney_(left-take);}}
 if(left>.01)throw new Error("INVENTORY_RETURN_VALUATION_LAYERS_INSUFFICIENT");return out;
}
function inventoryValuationTransferLayers_(ss,documentId){
 const sh=inventoryValuationSheet_(ss,"InventoryValuationMovements",INVENTORY_VALUATION_MOVEMENT_HEADERS_,false);if(!sh)return [];
 const rows=sh.getDataRange().getValues().slice(1),matches=rows.filter(r=>String(r[13]||"")===String(documentId)&&String(r[6])==="TransferenciaSalida");
 if(matches.length!==1)throw new Error(matches.length?"INVENTORY_TRANSFER_VALUATION_AMBIGUOUS":"INVENTORY_TRANSFER_VALUATION_MISSING");
 return JSON.parse(String(matches[0][11]||"[]")).map(x=>({cantidad:Number(x.cantidad),costoUnitario:Number(x.costoUnitario),fechaAdquisicion:x.fechaAdquisicion,documentoOrigen:x.documentoOrigen}));
}
function inventoryValuationReportRows_(ss,p){
 const k=ss.getSheetByName("InventariosKardex"),v=inventoryValuationSheet_(ss,"InventoryValuationMovements",INVENTORY_VALUATION_MOVEMENT_HEADERS_,false);if(!k||!v)return [];
 const catalog=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,false),catalogRows=catalog?catalog.getDataRange().getValues().slice(1):[],catalogMap={};catalogRows.forEach(r=>catalogMap[catalogNormalizeCode_(r[1])]={name:r[2],category:r[5]});
 const kardexRows=k.getDataRange().getValues().slice(1),info={};kardexRows.forEach(r=>{const code=catalogNormalizeCode_(r[2]);info[code]={name:r[3],category:r[4]};});
 const cutoff=p.fechaCorte?new Date(String(p.fechaCorte)+"T23:59:59.999"):null;if(cutoff&&isNaN(cutoff.getTime()))throw new Error("INVENTORY_VALUATION_CUTOFF_INVALID");
 const movementRows=v.getDataRange().getValues().slice(1),eligible=movementRows.filter(r=>!cutoff||new Date(r[2])<=cutoff),map={};
 function ensureRow(code,loc,method){
  const key=code+"|"+loc.toLowerCase();if(!map[key])map[key]={itemCodigo:code,itemNombre:(catalogMap[code]&&catalogMap[code].name)||info[code]?.name||code,categoria:(catalogMap[code]&&catalogMap[code].category)||info[code]?.category||"Otros",ubicacion:loc,cantidad:0,valor:0,valorIncompleto:false,metodo:method||"PEPS",movimientos:0};return map[key];
 }
 eligible.forEach(r=>{
  const code=catalogNormalizeCode_(r[4]),loc=String(r[5]||"Bodega General"),type=String(r[6]||""),qty=Number(r[7]||0),cost=Number(r[9]||0),incoming=["Entrada","Devolucion","AjustePositivo"].indexOf(type)!==-1,outgoing=["Salida","Prestamo","Baja","TransferenciaSalida","Consumo","AjusteNegativo"].indexOf(type)!==-1;
  const x=ensureRow(code,loc,r[10]);if(incoming)x.cantidad+=qty;else if(outgoing)x.cantidad-=qty;if(incoming)x.valor+=cost;else if(outgoing)x.valor-=cost;if(String(r[14])==="PendienteCosto")x.valorIncompleto=true;x.movimientos++;
 });
 // Una transferencia despachada pero aún no recibida sigue siendo un activo institucional en tránsito.
 const transferSheet=ss.getSheetByName("TransferenciasInventario");
 if(transferSheet){
  transferSheet.getDataRange().getValues().slice(1).forEach(t=>{
   const id=String(t[0]||"").trim(),sentAt=new Date(t[1]),code=catalogNormalizeCode_(t[2]),sentQty=Number(t[4]||0),destination=String(t[6]||"Destino no especificado").trim();
   if(!id||!Number.isFinite(sentQty)||sentQty<=0||isNaN(sentAt.getTime())||(cutoff&&sentAt>cutoff))return;
   const outs=eligible.filter(r=>String(r[13]||"")===id&&String(r[6])==="TransferenciaSalida");
   if(outs.length!==1)throw new Error(outs.length?"INVENTORY_TRANSFER_VALUATION_AMBIGUOUS:"+id:"INVENTORY_TRANSFER_VALUATION_MISSING:"+id);
   const receipts=eligible.filter(r=>String(r[13]||"")===id&&String(r[6])==="Entrada"),receivedQty=receipts.reduce((n,r)=>n+Number(r[7]||0),0),receivedValue=inventoryValuationMoney_(receipts.reduce((n,r)=>n+Number(r[9]||0),0)),pendingQty=inventoryValuationMoney_(Math.max(0,sentQty-receivedQty));
   if(pendingQty<=.0001)return;
   const sentValue=Number(outs[0][9]||0),pendingValue=inventoryValuationMoney_(sentValue-receivedValue),loc="En tránsito → "+destination,x=ensureRow(code,loc,outs[0][10]);
   x.cantidad+=pendingQty;x.valor+=pendingValue;x.movimientos++;if(String(outs[0][14])==="PendienteCosto"||receipts.some(r=>String(r[14])==="PendienteCosto")||pendingValue<-.01)x.valorIncompleto=true;
  });
 }
 return Object.values(map).filter(x=>(!p.ubicacion||x.ubicacion.toLowerCase()===String(p.ubicacion).toLowerCase())&&(!p.categoria||catalogNormalizeText_(x.categoria)===catalogNormalizeText_(p.categoria))).map(x=>({...x,cantidad:inventoryValuationMoney_(x.cantidad),valor:inventoryValuationMoney_(x.valor),costoUnitario:x.cantidad>0?inventoryValuationMoney_(x.valor/x.cantidad):0})).filter(x=>Math.abs(x.cantidad)>.0001||Math.abs(x.valor)>.009);
}
function inventoryValuationLedgerBalance_(ss,cutoff){
 const sh=ss.getSheetByName("AsientosContables");if(!sh)return {cuentas:{},saldoTotal:null};const rows=sh.getDataRange().getValues().slice(1),accounts={"1301":0,"1302":0};
 rows.forEach(r=>{if(String(r[6]||"")!=="Asentado")return;if(cutoff&&new Date(r[1])>cutoff)return;let lines=[];try{lines=JSON.parse(String(r[5]||"[]"));}catch(_){return;}if(!Array.isArray(lines))return;lines.forEach(x=>{const code=String(x.cuenta||x.codigoCuenta||x.cuentaCodigo||x.accountCode||"").trim();if(Object.prototype.hasOwnProperty.call(accounts,code))accounts[code]+=Number(x.debe||0)-Number(x.haber||0);});});
 return {cuentas:accounts,saldoTotal:inventoryValuationMoney_(accounts["1301"]+accounts["1302"])};
}
function getValuatedInventoryReport(p){
 p=p||{};catalogActor_(p,false);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),rows=inventoryValuationReportRows_(ss,p),totalCantidad=inventoryValuationMoney_(rows.reduce((n,x)=>n+x.cantidad,0)),totalValor=inventoryValuationMoney_(rows.reduce((n,x)=>n+x.valor,0)),incompleto=rows.some(x=>x.valorIncompleto),ledger=inventoryValuationLedgerBalance_(ss,p.fechaCorte?new Date(String(p.fechaCorte)+"T23:59:59.999"):null);
 return {status:"success",fechaCorte:p.fechaCorte||p.fechaFin||new Date().toISOString().slice(0,10),metodoPorCategoria:"Configurado por política institucional",detalle:rows,resumen:{articulos:rows.length,cantidad:totalCantidad,valor:totalValor,valorIncompleto:incompleto},conciliacion:{cuentasInventario:ledger.cuentas,saldoContable:ledger.saldoTotal,diferencia:ledger.saldoTotal===null?null:inventoryValuationMoney_(totalValor-ledger.saldoTotal),conciliado:ledger.saldoTotal===null?false:Math.abs(totalValor-ledger.saldoTotal)<=0.01&& !incompleto}};
}
function exportValuatedInventoryReportCSV(p){
 const r=getValuatedInventoryReport(p||{}),head=["Código","Artículo","Categoría","Ubicación","Cantidad","Costo unitario","Valor total","Método","Costo pendiente"],rows=r.detalle.map(x=>[x.itemCodigo,x.itemNombre,x.categoria,x.ubicacion,x.cantidad,x.costoUnitario,x.valor,x.metodo,x.valorIncompleto?"Sí":"No"]),csv=[head,...rows].map(row=>row.map(v=>'"'+String(v===undefined||v===null?"":v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
 return {status:"success",filename:"inventario-valorizado-"+r.fechaCorte+".csv",csv:"\uFEFF"+csv,resumen:r.resumen,conciliacion:r.conciliacion};
}
function exportValuatedInventoryReportPDF(p){
 const r=getValuatedInventoryReport(p||{}),esc=v=>String(v===undefined||v===null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const rows=r.detalle.map(x=>"<tr><td>"+esc(x.itemCodigo)+"</td><td>"+esc(x.itemNombre)+"</td><td>"+esc(x.ubicacion)+"</td><td>"+esc(x.cantidad)+"</td><td>"+esc(x.costoUnitario)+"</td><td>"+esc(x.valor)+"</td></tr>").join("");
 const html="<html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;font-size:9px}h1{font-size:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:5px;text-align:left}th{background:#eee}.total{font-weight:bold}</style></head><body><h1>Inventario valorizado</h1><p>Fecha de corte: "+esc(r.fechaCorte)+"</p><table><thead><tr><th>Código</th><th>Artículo</th><th>Ubicación</th><th>Cantidad</th><th>Costo unitario</th><th>Valor</th></tr></thead><tbody>"+rows+"</tbody></table><p class='total'>Cantidad: "+esc(r.resumen.cantidad)+" | Valor: "+esc(r.resumen.valor)+"</p><p>Conciliación: "+esc(r.conciliacion.conciliado?"Conciliado":"Pendiente / diferencia")+"</p></body></html>";
 if (typeof getParentDriveFolder !== "function") return {status:"error",code:"INVENTORY_PDF_STORAGE_NOT_CONFIGURED"};
 const blob=HtmlService.createHtmlOutput(html).getAs(MimeType.PDF).setName("inventario-valorizado-"+r.fechaCorte+".pdf"),file=getParentDriveFolder().createFile(blob);
 return {status:"success",fileId:file.getId(),url:file.getUrl(),filename:file.getName(),resumen:r.resumen,conciliacion:r.conciliacion};
}

function recordInventoryMovementLocked_(ss,payload) {
 const p=payload||{},itemCodigo=p.itemCodigo,cantidad=p.cantidad,tipoNorm=String(p.tipoMovimiento||"Entrada").trim(),target=String(p.ubicacionId||p.ubicacionResponsable||p.almacenId||"Bodega General").trim();
 if(!itemCodigo||cantidad===undefined||!Number.isFinite(Number(cantidad))||Number(cantidad)<=0)throw new Error("itemCodigo y cantidad válida requeridos.");
 const code=catalogNormalizeCode_(String(itemCodigo).trim()),inputQty=Number(cantidad),item=catalogFindItem_(ss,code,true),unit=catalogFindUnit_(ss,p.cantidadBase===true?item.baseUnit:(p.unidadMedida||item.unit));
 if(catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit))throw new Error("CATALOG_UNIT_INCOMPATIBLE_WITH_ITEM");
 const factor=unit.factor,qty=assetDeprMoney_(inputQty*factor),name=item.name,category=item.category;if(qty<=0)throw new Error("INVENTORY_BASE_QUANTITY_INVALID");
 const sheet=catalogEnsureKardexSchema_(ss),data=sheet.getDataRange().getValues().slice(1);let current=0;const locations={};
 data.forEach(r=>{if(catalogNormalizeCode_(r[2])===code){const loc=String(r[10]||"Bodega General").trim();locations[loc.toLowerCase()]=Number(r[8]||0);if(loc.toLowerCase()===target.toLowerCase())current=Number(r[8]||0);}});
 let next=current;const incoming=["Entrada","Devolucion","AjustePositivo"].indexOf(tipoNorm)!==-1,outgoing=["Salida","Prestamo","Baja","TransferenciaSalida","Consumo","AjusteNegativo"].indexOf(tipoNorm)!==-1;
 if(incoming)next=assetDeprMoney_(current+qty);else if(outgoing){if(current<qty)throw new Error("INSUFFICIENT_LOCAL_STOCK:"+code+":"+target+":"+current+":"+qty);}else throw new Error("INVENTORY_MOVEMENT_TYPE_UNSUPPORTED:"+tipoNorm);
 const storedMin=item.row[20],min=Number(p.stockMinimo===undefined||p.stockMinimo===""?(storedMin===undefined||storedMin===""?5:storedMin):p.stockMinimo),now=new Date(),id="KDX-"+Utilities.getUuid();let obs=String(p.observaciones||"");if(p.numeroLote)obs+=" | [LOTE:"+p.numeroLote+"]";if(p.numeroSerie)obs+=" | [SERIE:"+p.numeroSerie+"]";if(p.documentOrigen)obs+=" | [DOC:"+p.documentOrigen+"]";if(p.referenciaMovimiento)obs+=" | [REF:"+p.referenciaMovimiento+"]";if(p.cantidadBase!==true&&factor!==1)obs+=" | [CONVERSION:"+inputQty+" "+unit.name+" x "+factor+" = "+qty+" "+unit.base+"]";
 const valuationSnapshot=inventoryValuationSnapshot_(ss);let valuation;
 try{
  valuation=inventoryValuationApplyMovement_(ss,item,p,id,qty,tipoNorm,target,current);
  if(outgoing)next=assetDeprMoney_(current-qty);
  locations[target.toLowerCase()]=next;let total=0;Object.keys(locations).forEach(k=>total+=Number(locations[k]||0));total=assetDeprMoney_(total);
  sheet.appendRow([id,now,code,name,category,tipoNorm,qty,current,next,min,target,obs.trim(),item.id,qty,unit.name,factor,valuation.costoUnitario,valuation.costoTotal,valuation.metodo,valuation.estadoCosto]);
 }catch(e){inventoryValuationRestore_(ss,valuationSnapshot);throw new Error("INVENTORY_VALUATION_MOVEMENT_ATOMIC_FAILURE:"+e.message);}
 let total=0;Object.keys(locations).forEach(k=>total+=Number(locations[k]||0));total=assetDeprMoney_(total);
 const low=next<=min;return {status:"success",kardexId:id,itemCodigo:code,itemNombre:name,ubicacion:target,cantidadRegistrada:inputQty,cantidadBase:qty,unidadBase:item.baseUnit,stockAnteriorUbicacion:current,stockNuevoUbicacion:next,stockConsolidadoInstitucional:total,stockMinimo:min,alertaStockMinimo:low,costoUnitarioValoracion:valuation.costoUnitario,costoTotalValoracion:valuation.costoTotal,metodoValoracion:valuation.metodo,estadoCosto:valuation.estadoCosto,capasTransferencia:valuation.asignaciones,message:low?"Movimiento registrado; stock bajo en "+target+".":"Movimiento de inventario registrado correctamente."};
}
function recordInventoryMovement(payload) {
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{return recordInventoryMovementLocked_(SpreadsheetApp.openById(SPREADSHEET_ID),payload||{});}
 finally{lock.releaseLock();}
}
function getInventoryKardex(payload) {
  const { itemCodigo, categoriaTipo, ubicacionId, ubicacionResponsable, almacenId, fechaInicio, fechaFin } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getOrCreateSheet(ss, "InventariosKardex").getDataRange().getValues().slice(1);

  const filtroUbicacion = String(ubicacionId || ubicacionResponsable || almacenId || "").trim().toLowerCase();

  let filtered = rows;
  if (itemCodigo) {
    filtered = filtered.filter(r => String(r[2]).trim() === String(itemCodigo).trim());
  }
  if (categoriaTipo) {
    filtered = filtered.filter(r => String(r[4]).toLowerCase().trim() === String(categoriaTipo).toLowerCase().trim());
  }
  if (filtroUbicacion) {
    filtered = filtered.filter(r => String(r[10] || "Bodega General").toLowerCase().trim() === filtroUbicacion);
  }
  if (fechaInicio) {
    const fIni = new Date(fechaInicio);
    filtered = filtered.filter(r => new Date(r[1]) >= fIni);
  }
  if (fechaFin) {
    const fFin = new Date(fechaFin);
    filtered = filtered.filter(r => new Date(r[1]) <= fFin);
  }

  // Estructura multidimensional de existencias
  const existenciasPorUbicacionMap = {};
  const consolidadoMap = {};

  rows.forEach(r => {
    const code = String(r[2]).trim();
    const nombre = r[3];
    const cat = r[4];
    const ubic = String(r[10] || "Bodega General").trim();
    const stockFila = parseFloat(r[8] || 0);
    const minStk = parseFloat(r[9] || 0);

    if (!existenciasPorUbicacionMap[code]) {
      existenciasPorUbicacionMap[code] = {};
    }
    existenciasPorUbicacionMap[code][ubic] = stockFila;

    if (!consolidadoMap[code]) {
      consolidadoMap[code] = {
        itemCodigo: code,
        itemNombre: nombre,
        categoriaTipo: cat,
        stockMinimo: minStk,
        totalInstitucional: 0,
        ubicaciones: {}
      };
    }
    consolidadoMap[code].ubicaciones[ubic] = stockFila;
  });

  // Calcular consolidado institucional exacto sumando existencias por ubicación
  Object.keys(consolidadoMap).forEach(code => {
    const itemData = consolidadoMap[code];
    let total = 0;
    Object.keys(itemData.ubicaciones).forEach(ub => {
      total += itemData.ubicaciones[ub];
    });
    itemData.totalInstitucional = parseFloat(total.toFixed(2));
    itemData.alertaStockMinimo = itemData.totalInstitucional <= itemData.stockMinimo;
  });

  // Resumen por ubicación física
  const resumenPorUbicacion = [];
  Object.keys(existenciasPorUbicacionMap).forEach(code => {
    const ubMap = existenciasPorUbicacionMap[code];
    Object.keys(ubMap).forEach(ub => {
      const stockUb = ubMap[ub];
      const itemInfo = consolidadoMap[code] || {};
      resumenPorUbicacion.push({
        itemCodigo: code,
        itemNombre: itemInfo.itemNombre || code,
        categoriaTipo: itemInfo.categoriaTipo || "Consumible",
        ubicacion: ub,
        stockUbicacion: stockUb,
        stockMinimo: itemInfo.stockMinimo === undefined ? 5 : itemInfo.stockMinimo,
        alertaStockMinimo: stockUb <= (itemInfo.stockMinimo === undefined ? 5 : itemInfo.stockMinimo),
        totalConsolidadoInstitucional: itemInfo.totalInstitucional === undefined ? stockUb : itemInfo.totalInstitucional
      });
    });
  });

  const catalogRows=catalogSheet_(ss,"CatalogoArticulos",CATALOG_ITEM_HEADERS_,false),catalogByCode=Object.create(null);if(catalogRows)catalogRows.getDataRange().getValues().slice(1).forEach(r=>catalogByCode[catalogNormalizeCode_(r[1])]=r[0]);
  const mapped = filtered.map(r => ({
    catalogItemId: r[12] || catalogByCode[catalogNormalizeCode_(r[2])] || "",
    cantidadBase: Number(r[13] || r[6] || 0),
    unidadMedidaOriginal: r[14] || "",
    factorConversion: Number(r[15] || 1),
    kardexId: r[0],
    fecha: r[1],
    itemCodigo: r[2],
    itemNombre: r[3],
    categoriaTipo: r[4],
    tipoMovimiento: r[5],
    cantidad: parseFloat(r[6] || 0),
    stockAnterior: parseFloat(r[7] || 0),
    stockNuevo: parseFloat(r[8] || 0),
    stockMinimo: parseFloat(r[9] || 0),
    ubicacionResponsable: r[10] || "Bodega General",
    observaciones: r[11] || ""
  }));

  return {
    status: "success",
    data: mapped,
    kardex: mapped,
    resumenExistencias: Object.values(consolidadoMap),
    resumenPorUbicacion: resumenPorUbicacion,
    existenciasMultialmacen: consolidadoMap
  };
}

// [TAREA 3] [Fase Proveedores y Compromisos] - Registro y actualización de contratos de proveedores con fecha de inicio, vencimiento y días de aviso.

function transferInventoryStock(payload) {
  const {
    itemCodigo,
    itemNombre,
    cantidad,
    ubicacionOrigen,
    ubicacionDestino,
    responsableUserId,
    requiereConfirmacionFisica,
    observaciones,
    authRole
  } = payload || {};

  if (!itemCodigo || !cantidad || !ubicacionOrigen || !ubicacionDestino) {
    throw new Error("itemCodigo, cantidad, ubicacionOrigen y ubicacionDestino son requeridos.");
  }

  const uOrigen = String(ubicacionOrigen).trim();
  const uDestino = String(ubicacionDestino).trim();

  if (uOrigen.toLowerCase() === uDestino.toLowerCase()) {
    throw new Error("La ubicación de origen y destino no pueden ser iguales en una transferencia.");
  }

  const qty = parseFloat(cantidad);
  if (isNaN(qty) || qty <= 0) {
    throw new Error("La cantidad a transferir debe ser estrictamente mayor a cero.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const catalogItem = catalogFindItem_(ss, itemCodigo, true);
    const canonicalCode = catalogItem.code;
    const kardexSheet = catalogEnsureKardexSchema_(ss);
    const kData = kardexSheet.getDataRange().getValues().slice(1);
    const movementStart = kardexSheet.getLastRow() + 1;
    const valuationSnapshot = inventoryValuationSnapshot_(ss);
    const transferSheetBefore = ss.getSheetByName("TransferenciasInventario");
    const transferRowsBefore = transferSheetBefore ? transferSheetBefore.getDataRange().getValues().map(r => r.slice()) : null;
    try {

    // 1. Validar existencia y stock disponible local en el almacén de origen
    let stockDisponibleOrigen = 0;
    let sNombre = itemNombre || "";

    kData.forEach(r => {
      const rowItem = String(r[2]).trim();
      const rowUbicacion = String(r[10] || "Bodega General").trim();
      if (rowItem === canonicalCode) {
        if (!sNombre) sNombre = String(r[3] || itemCodigo).trim();
        if (rowUbicacion.toLowerCase() === uOrigen.toLowerCase()) {
          stockDisponibleOrigen = parseFloat(r[8] || 0);
        }
      }
    });

    if (stockDisponibleOrigen < qty) {
      return {
        status: "error",
        code: "INSUFFICIENT_SOURCE_STOCK",
        message: `Transferencia rechazada: Stock insuficiente para '${sNombre || itemCodigo}' en '${uOrigen}'. Disponible: ${stockDisponibleOrigen}, Solicitado: ${qty}.`
      };
    }

    const now = new Date();
    const transferBatchId = "TRF-" + now.getFullYear() + "-" + String(now.getTime()).slice(-6);
    const solicitanteId = responsableUserId || (payload && (payload.authenticatedUserId || payload.userId)) || "Administración";

    // Determinar si pasa a EnTransito o recepción automática directa
    const esperaConfirmacion = requiereConfirmacionFisica !== false; // por defecto requiere recepción física en destino
    const estadoTransferencia = esperaConfirmacion ? "EnTransito" : "RecibidaTotal";

    // 2. Registrar Salida en almacén de origen
    const salidaRes = recordInventoryMovementLocked_(ss,{
      itemCodigo: canonicalCode,
      itemNombre: sNombre || itemCodigo,
      tipoMovimiento: "TransferenciaSalida",
      cantidad: qty,
      cantidadBase: true,
      ubicacionResponsable: uOrigen,
      documentOrigen: transferBatchId,
      referenciaMovimiento: `Hacia ${uDestino} [Estado: ${estadoTransferencia}]`,
      observaciones: `Transferencia TRF hacia '${uDestino}'. ${observaciones || ""}`
    });

    let entradaRes = null;
    if (!esperaConfirmacion) {
      // Si no espera confirmación física, entra inmediatamente a destino
      entradaRes = recordInventoryMovementLocked_(ss,{
      itemCodigo: canonicalCode,
        itemNombre: sNombre || itemCodigo,
        tipoMovimiento: "Entrada",
        cantidad: qty,
        cantidadBase: true,
        capasTransferencia: salidaRes.capasTransferencia,
        ubicacionResponsable: uDestino,
        documentOrigen: transferBatchId,
        referenciaMovimiento: `Desde ${uOrigen}`,
        observaciones: `Transferencia automática recibida desde '${uOrigen}'. ${observaciones || ""}`
      });
    }

    // 3. Persistir en TransferenciasInventario para trazabilidad completa
    const trfSheet = getOrCreateSheet(ss, "TransferenciasInventario");
    trfSheet.appendRow([
      transferBatchId,
      now,
      canonicalCode,
      sNombre || canonicalCode,
      qty,
      uOrigen,
      uDestino,
      solicitanteId,
      estadoTransferencia, // Borrador, PendienteAprobacion, EnTransito, RecibidaTotal, RecibidaParcial, Rechazada, Cancelada
      esperaConfirmacion ? "" : solicitanteId, // Receptor
      esperaConfirmacion ? "" : now,           // FechaRecepcion
      esperaConfirmacion ? 0 : qty,            // CantidadRecibida
      0,                                       // Discrepancia
      observaciones || ""
    ]);

    logStructuredEvent(
      "ACCOUNTING",
      "transferInventoryStock",
      "INFO",
      "STOCK_TRANSFERRED",
      `Transferencia ${transferBatchId}: ${qty} unidades de ${itemCodigo} de ${uOrigen} a ${uDestino}. Estado: ${estadoTransferencia}`,
      { transferBatchId, itemCodigo: canonicalCode, qty, uOrigen, uDestino, estadoTransferencia },
      solicitanteId
    );

    return {
      status: "success",
      transferBatchId: transferBatchId,
      itemCodigo: canonicalCode,
      itemNombre: sNombre,
      cantidadTransferida: qty,
      ubicacionOrigen: uOrigen,
      ubicacionDestino: uDestino,
      estadoTransferencia: estadoTransferencia,
      stockNuevoOrigen: salidaRes.stockNuevoUbicacion,
      stockNuevoDestino: entradaRes ? entradaRes.stockNuevoUbicacion : null,
      stockConsolidadoInstitucional: salidaRes.stockConsolidadoInstitucional,
      message: esperaConfirmacion
        ? `Transferencia ${transferBatchId} despachada. ${qty} unidades en tránsito desde '${uOrigen}' hacia '${uDestino}' pendientes de recepción.`
        : `Transferencia ${transferBatchId} completada. ${qty} unidades transferidas de '${uOrigen}' a '${uDestino}'.`
    };
    } catch (e) {
      while (kardexSheet.getLastRow() >= movementStart) kardexSheet.deleteRow(kardexSheet.getLastRow());
      inventoryValuationRestore_(ss, valuationSnapshot);
      const transferSheet = ss.getSheetByName("TransferenciasInventario");
      if (transferSheet) {
        while (transferSheet.getLastRow() > (transferRowsBefore ? transferRowsBefore.length : 0)) transferSheet.deleteRow(transferSheet.getLastRow());
        if (transferRowsBefore && transferRowsBefore.length) {
          const width = Math.max(...transferRowsBefore.map(r => r.length));
          transferSheet.getRange(1, 1, transferRowsBefore.length, width).setValues(transferRowsBefore.map(r => { const row = r.slice(); while (row.length < width) row.push(""); return row; }));
        }
      }
      throw new Error("INVENTORY_TRANSFER_ATOMIC_FAILURE:" + e.message);
    }
  } finally {
    lock.releaseLock();
  }
}

// [TASK-021] [F19-Task03] - Confirmación de recepción física de transferencias con gestión de discrepancias

function getInventoryTransfers(payload) {
  const { estado, ubicacion } = payload || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getOrCreateSheet(ss, "TransferenciasInventario").getDataRange().getValues().slice(1);

  let filtered = rows;
  if (estado) {
    filtered = filtered.filter(r => String(r[8]).trim() === String(estado).trim());
  }
  if (ubicacion) {
    const uStr = String(ubicacion).toLowerCase().trim();
    filtered = filtered.filter(r => String(r[5]).toLowerCase().trim() === uStr || String(r[6]).toLowerCase().trim() === uStr);
  }

  const mapped = filtered.map(r => ({
    transferBatchId: r[0],
    fechaCreacion: r[1],
    itemCodigo: r[2],
    itemNombre: r[3],
    cantidadDespachada: r[4],
    ubicacionOrigen: r[5],
    ubicacionDestino: r[6],
    solicitanteUserId: r[7],
    estadoTransferencia: r[8],
    receptorUserId: r[9],
    fechaRecepcion: r[10],
    cantidadRecibida: r[11],
    discrepancia: r[12],
    observaciones: r[13]
  }));

  return {
    status: "success",
    transferencias: mapped
  };
}

function createMaterialRequisition(payload) {
 const p=payload||{},actor=catalogActor_(p,false),ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 if(!p.departamento||!p.articulosJSON)throw new Error("departamento y articulosJSON son requeridos.");
 let input;try{input=Array.isArray(p.articulosJSON)?p.articulosJSON:JSON.parse(p.articulosJSON);}catch(e){throw new Error("MATERIAL_REQUISITION_ITEMS_INVALID");}
 if(!Array.isArray(input)||!input.length)throw new Error("MATERIAL_REQUISITION_ITEMS_REQUIRED");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const scoped=inventoryAssertDepartmentScope_(p,ss,actor,p.departamento),department=scoped.department;
  const normalized=input.map(x=>{const item=catalogFindItem_(ss,x.catalogItemId||x.itemCodigo||x.itemId,true),unit=catalogFindUnit_(ss,x.unidadMedida||item.unit),qty=Number(x.cantidad);if(catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit))throw new Error("CATALOG_UNIT_INCOMPATIBLE_WITH_ITEM");if(!Number.isFinite(qty)||qty<=0)throw new Error("MATERIAL_REQUISITION_QUANTITY_INVALID");return {catalogItemId:item.id,itemCodigo:item.code,itemNombre:item.name,unidadMedida:unit.name,unidadBase:item.baseUnit,factorConversionBase:unit.factor,cantidad:qty};});
  const sh=getOrCreateSheet(ss,"MaterialesSolicitudes");inventoryEnsureRequisitionSchema_(sh);
  const now=new Date(),id="REQ-MAT-"+Utilities.getUuid(),centroCosto=String(p.centroCosto||department.departmentName||department.departmentId).trim(),modo=String(p.modoReconocimiento||"GASTO_INMEDIATO").trim().toUpperCase(),source=String(p.ubicacionOrigen||"Bodega General").trim();
  if(!centroCosto||["GASTO_INMEDIATO","ASIGNADO"].indexOf(modo)===-1||!source)throw new Error("INVENTORY_RECOGNITION_MODE_INVALID");
  sh.appendRow([id,now,department.departmentId,actor.userId,JSON.stringify(normalized),p.motivo||"Consumo Operativo","PendienteAprobacion","","",p.observaciones||"",centroCosto,modo,"","",source]);
  return {status:"success",solicitudMatId:id,departamento:department.departmentName||department.departmentId,centroCosto:centroCosto,modoReconocimiento:modo,ubicacionOrigen:source,message:"Solicitud interna de materiales registrada en estado PendienteAprobacion."};
 }finally{lock.releaseLock();}
}

function getMaterialRequisitions(payload) {
  const p=payload||{},actor=getVerifiedAccountingIdentity_(p);
  if(!actor||actor.authorized!==true)throw new Error(actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED");
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),scope=getVerifiedAccountingDepartmentScope_(p,ss,actor);
  if(!scope||scope.authorized!==true)throw new Error(scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED");
  const sheet=ss.getSheetByName("MaterialesSolicitudes"),rows=sheet?sheet.getDataRange().getValues().slice(1):[];
  const allowed=(scope.departmentIds||[]).map(String);
  let requested=null;
  if(p.departamento){requested=resolveStaffingDepartmentReference_(ss,p.departamento);if(!requested||!requested.resolved)throw new Error(requested&&requested.code||"DEPARTMENT_REFERENCE_INVALID");if(scope.institutionWide!==true&&!allowed.includes(String(requested.departmentId)))throw new Error("RESOURCE_NOT_FOUND");}
  const filtered=rows.filter(r=>{
    const department=resolveStaffingDepartmentReference_(ss,r[2]);
    if(!department||!department.resolved)return false;
    if(scope.institutionWide!==true&&!allowed.includes(String(department.departmentId)))return false;
    if(requested&&String(department.departmentId)!==String(requested.departmentId))return false;
    return !p.estadoAprobacion||String(r[6]||"").trim()===String(p.estadoAprobacion).trim();
  });
  const reservationRows=inventoryReservationRows_(ss);return {status:"success",solicitudes:filtered.map(r=>{
    const department=resolveStaffingDepartmentReference_(ss,r[2]);
    return {solicitudMatId:r[0],fecha:r[1],departamento:department.departmentName||department.departmentId,departamentoId:department.departmentId,solicitanteUserId:r[3],articulosJSON:r[4],motivo:r[5],estadoAprobacion:r[6],aprobadoPor:r[7],entregadoPor:r[8],observaciones:r[9],centroCosto:r[10]||department.departmentName||department.departmentId,modoReconocimiento:r[11]||"GASTO_INMEDIATO",asientoContableId:r[12]||"",detalleEntregaJSON:r[13]||"",ubicacionOrigen:r[14]||"Bodega General",reservaActiva:reservationRows.some(x=>String(x[1])===String(r[0])&&String(x[6])==="Activa"),cantidadReservadaBase:reservationRows.filter(x=>String(x[1])===String(r[0])&&String(x[6])==="Activa").reduce((n,x)=>n+Number(x[5]||0),0)};
  })};
}

function inventoryEnsureRequisitionSchema_(sheet) {
 const headers=["CentroCosto","ModoReconocimiento","AsientoContableID","DetalleEntregaJSON","UbicacionOrigen"];
 const row=sheet.getDataRange().getValues()[0]||[];
 headers.forEach((h,i)=>{const existing=String(row[10+i]||"").trim();if(existing&&existing!==h)throw new Error("MATERIAL_REQUISITION_SCHEMA_CONFLICT:"+existing);});
 headers.forEach((h,i)=>{if(!String(row[10+i]||"").trim())sheet.getRange(1,11+i).setValue(h);});
}

function inventoryEnsureReservations_(ss){return inventoryEnsureLedgerSheet_(ss,"InventoryReservations",["ReservaID","SolicitudMatID","ItemID","ItemCodigo","Ubicacion","CantidadBase","Estado","CreadoEn","ActualizadoEn","ActorUserId"]);}

function inventoryEnsureReplenishmentPolicies_(ss){return inventoryEnsureLedgerSheet_(ss,"InventoryReplenishmentPolicies",["PoliticaID","ItemID","ItemCodigo","Ubicacion","StockMinimo","StockMaximo","StockObjetivo","PlazoEntregaDias","Estado","ActualizadoPor","FechaActualizacion"]);}

function inventoryPhysicalStock_(ss,itemCode,location){
 const sh=ss.getSheetByName("InventariosKardex");if(!sh)return 0;
 const rows=sh.getDataRange().getValues().slice(1),key=catalogNormalizeCode_(itemCode),loc=catalogNormalizeText_(location);let stock=0;
 rows.forEach(r=>{if(catalogNormalizeCode_(r[2])===key&&catalogNormalizeText_(r[10]||"Bodega General")===loc)stock=Number(r[8]||0);});
 return assetDeprMoney_(stock);
}

function inventoryReservationRows_(ss){const sh=ss.getSheetByName("InventoryReservations");return sh?sh.getDataRange().getValues().slice(1):[];}

function inventoryActiveReserved_(ss,itemCode,location,excludeRequestId){
 const key=catalogNormalizeCode_(itemCode),loc=catalogNormalizeText_(location);
 return assetDeprMoney_(inventoryReservationRows_(ss).reduce((sum,r)=>sum+(String(r[1])===String(excludeRequestId||"")?0:(catalogNormalizeCode_(r[3])===key&&catalogNormalizeText_(r[4])===loc&&String(r[6])==="Activa"?Number(r[5]||0):0)),0));
}

function inventoryNormalizeRequisitionItems_(ss,rawItems){
 let items;try{items=Array.isArray(rawItems)?rawItems:JSON.parse(rawItems||"[]");}catch(_){throw new Error("MATERIAL_REQUISITION_ITEMS_INVALID");}
 if(!Array.isArray(items)||!items.length)throw new Error("MATERIAL_REQUISITION_ITEMS_REQUIRED");
 const seen=Object.create(null);
 return items.map(raw=>{
  const x=raw||{},item=catalogFindItem_(ss,x.catalogItemId||x.itemCodigo||x.itemId,true),unit=catalogFindUnit_(ss,x.unidadMedida||x.unidad||item.unit),qty=Number(x.cantidad);
  if(catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit))throw new Error("CATALOG_UNIT_INCOMPATIBLE_WITH_ITEM");
  if(!Number.isFinite(qty)||qty<=0)throw new Error("MATERIAL_REQUISITION_QUANTITY_INVALID");
  if(seen[item.id])throw new Error("MATERIAL_REQUISITION_DUPLICATE_ITEM:"+item.code);seen[item.id]=true;
  return {catalogItemId:item.id,itemCodigo:item.code,itemNombre:item.name,unidadMedida:unit.name,unidadBase:item.baseUnit,factorConversionBase:unit.factor,cantidad:qty};
 });
}

function inventorySetReservationState_(ss,requestId,state,actorId,fromStates){
 const sh=ss.getSheetByName("InventoryReservations");if(!sh)return 0;
 const rows=sh.getDataRange().getValues(),allowed=Array.isArray(fromStates)?fromStates:["Activa"],now=new Date(),matches=[];
 rows.slice(1).forEach((r,i)=>{if(String(r[1])===String(requestId)&&allowed.indexOf(String(r[6]))!==-1)matches.push({row:i+2,created:r[7],actor:r[9]});});
 if(!matches.length)return 0;
 const values=matches.map(x=>[state,x.created,now,actorId||x.actor||""]),first=matches[0].row,contiguous=matches.every((x,i)=>x.row===first+i);
 if(contiguous)sh.getRange(first,7,values.length,4).setValues(values);
 else matches.forEach((x,i)=>sh.getRange(x.row,7,1,4).setValues([values[i]]));
 return matches.length;
}

function inventoryReserveRequisition_(ss,requestId,items,location,actorId){
 const sh=inventoryEnsureReservations_(ss),rows=sh.getDataRange().getValues().slice(1);
 const active=rows.filter(r=>String(r[1])===String(requestId)&&String(r[6])==="Activa");
 if(active.length){
  const same=active.length===items.length&&items.every(x=>active.some(r=>String(r[2])===String(x.catalogItemId)&&catalogNormalizeText_(r[4])===catalogNormalizeText_(location)&&Math.abs(Number(r[5])-Number(x.cantidad)*Number(x.factorConversionBase))<0.000001));
  if(!same)throw new Error("MATERIAL_RESERVATION_STATE_CONFLICT");
  return {idempotent:true,reservadas:active.reduce((n,r)=>n+Number(r[5]||0),0)};
 }
 const plan=items.map(x=>{
  const qty=assetDeprMoney_(Number(x.cantidad)*Number(x.factorConversionBase));
  const physical=inventoryPhysicalStock_(ss,x.itemCodigo,location),reserved=inventoryActiveReserved_(ss,x.itemCodigo,location,requestId),available=assetDeprMoney_(physical-reserved);
  if(qty>available+0.000001)throw new Error("INSUFFICIENT_AVAILABLE_STOCK:"+x.itemCodigo+":available="+available+":requested="+qty);
  return {item:x,qty};
 });
 const now=new Date(),startRow=sh.getLastRow()+1;try{plan.forEach(x=>sh.appendRow(["RSV-"+Utilities.getUuid(),requestId,x.item.catalogItemId,x.item.itemCodigo,location,x.qty,"Activa",now,now,actorId]));}catch(e){inventoryDeleteAppendedRows_(sh,startRow);throw e;}
 return {idempotent:false,reservadas:plan.reduce((n,x)=>n+x.qty,0)};
}

function manageMaterialRequisition(payload){
 const p=payload||{},actor=catalogActor_(p,true),requestId=String(p.solicitudMatId||"").trim(),operation=String(p.operacion||"").trim().toLowerCase();
 if(!requestId||["aprobar","rechazar","cancelar","modificar"].indexOf(operation)===-1)throw new Error("MATERIAL_REQUISITION_ACTION_INVALID");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=ss.getSheetByName("MaterialesSolicitudes");if(!sheet)throw new Error("RESOURCE_NOT_FOUND");
  inventoryEnsureRequisitionSchema_(sheet);const data=sheet.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&String(r[0])===requestId);
  if(idx<0)throw new Error("RESOURCE_NOT_FOUND");const row=data[idx];inventoryAssertDepartmentScope_(p,ss,actor,row[2]);
  const status=String(row[6]||"").trim();
  if(operation==="aprobar"){
   if(status==="Aprobada"){const existing=inventoryReservationRows_(ss).filter(r=>String(r[1])===requestId&&String(r[6])==="Activa");if(existing.length)return {status:"success",idempotent:true,solicitudMatId:requestId,reservadas:existing.reduce((n,r)=>n+Number(r[5]||0),0)};}
   if(status!=="PendienteAprobacion")throw new Error("MATERIAL_REQUISITION_STATUS_INVALID:"+status);
   const items=inventoryNormalizeRequisitionItems_(ss,row[4]),location=String(row[14]||"Bodega General").trim();
   const reservation=inventoryReserveRequisition_(ss,requestId,items,location,actor.userId);
   sheet.getRange(idx+1,7).setValue("Aprobada");sheet.getRange(idx+1,8).setValue(actor.userId);
   return {status:"success",solicitudMatId:requestId,estadoAprobacion:"Aprobada",reservadas:reservation.reservadas,message:"Solicitud aprobada y existencias reservadas sin modificar el Kardex."};
  }
  if(status==="Entregado"||status==="Rechazada"||status==="Cancelada")throw new Error("MATERIAL_REQUISITION_STATUS_TERMINAL:"+status);
  if(operation==="rechazar"||operation==="cancelar"){
   inventorySetReservationState_(ss,requestId,"Liberada",actor.userId);
   const next=operation==="rechazar"?"Rechazada":"Cancelada";sheet.getRange(idx+1,7).setValue(next);sheet.getRange(idx+1,8).setValue(actor.userId);
   if(p.observaciones!==undefined)sheet.getRange(idx+1,10).setValue(String(p.observaciones));
   return {status:"success",solicitudMatId:requestId,estadoAprobacion:next,message:"La solicitud fue cerrada y sus reservas liberadas."};
  }
  if(status!=="PendienteAprobacion"&&status!=="Aprobada")throw new Error("MATERIAL_REQUISITION_STATUS_INVALID:"+status);
  const items=inventoryNormalizeRequisitionItems_(ss,p.articulosJSON);
  if(status==="Aprobada")inventorySetReservationState_(ss,requestId,"Liberada",actor.userId);
  sheet.getRange(idx+1,5).setValue(JSON.stringify(items));sheet.getRange(idx+1,7).setValue("PendienteAprobacion");sheet.getRange(idx+1,8).setValue("");
  if(p.observaciones!==undefined)sheet.getRange(idx+1,10).setValue(String(p.observaciones));
  return {status:"success",solicitudMatId:requestId,estadoAprobacion:"PendienteAprobacion",message:"Solicitud modificada; cualquier reserva anterior fue liberada y requiere nueva aprobación."};
 }finally{lock.releaseLock();}
}

function manageInventoryReplenishmentPolicy(payload){
 const p=payload||{},actor=catalogActor_(p,true),ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 const item=catalogFindItem_(ss,p.catalogItemId||p.itemCodigo||p.itemId,true);inventoryAssertDepartmentScope_(p,ss,actor,p.departamento);const location=String(p.ubicacion||p.ubicacionResponsable||"").trim();
 const min=Number(p.stockMinimo),max=Number(p.stockMaximo),target=Number(p.stockObjetivo),lead=Number(p.plazoEntregaDias);
 if(!location||![min,max,target,lead].every(Number.isFinite)||min<0||max<min||target<min||target>max||lead<0||lead>365||!Number.isInteger(lead))throw new Error("INVENTORY_REPLENISHMENT_POLICY_INVALID");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const sh=inventoryEnsureReplenishmentPolicies_(ss),rows=sh.getDataRange().getValues(),idx=rows.findIndex((r,i)=>i>0&&String(r[1])===String(item.id)&&catalogNormalizeText_(r[3])===catalogNormalizeText_(location));
  const values=[idx>0?rows[idx][0]:"RPL-"+Utilities.getUuid(),item.id,item.code,location,min,max,target,lead,"Activa",actor.userId,new Date()];
  if(idx>0)sh.getRange(idx+1,1,1,values.length).setValues([values]);else sh.appendRow(values);
  return {status:"success",politicaId:values[0],itemCodigo:item.code,ubicacion:location};
 }finally{lock.releaseLock();}
}

function getInventoryReplenishmentSuggestions(payload){const lock=LockService.getScriptLock();lock.waitLock(10000);try{return getInventoryReplenishmentSuggestionsLocked_(payload);}finally{lock.releaseLock();}}

function getInventoryReplenishmentSuggestionsLocked_(payload){
 const p=payload||{},actor=getVerifiedAccountingIdentity_(p);if(!actor||actor.authorized!==true)throw new Error(actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED");
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);inventoryAssertDepartmentScope_(p,ss,actor,p.departamento);
 const policySheet=ss.getSheetByName("InventoryReplenishmentPolicies");if(!policySheet)return {status:"success",sugerencias:[]};
 const policies=policySheet.getDataRange().getValues().slice(1).filter(r=>String(r[8])==="Activa"&&(!p.ubicacion||catalogNormalizeText_(r[3])===catalogNormalizeText_(p.ubicacion)));
 const kardex=ss.getSheetByName("InventariosKardex"),kRows=kardex?kardex.getDataRange().getValues().slice(1):[],reservations=inventoryReservationRows_(ss),transfers=ss.getSheetByName("TransferenciasInventario"),transferRows=transfers?transfers.getDataRange().getValues().slice(1):[],orders=ss.getSheetByName("OrdenesCompra"),orderRows=orders?orders.getDataRange().getValues().slice(1):[],receipts=ss.getSheetByName("RecepcionesCompra"),receiptRows=receipts?receipts.getDataRange().getValues().slice(1):[];
 const now=Date.now(),periodDays=90,since=now-periodDays*86400000,sugerencias=[];
 policies.forEach(policy=>{
  const item=catalogFindItem_(ss,policy[1],true),code=catalogNormalizeCode_(item.code),location=String(policy[3]),physical=inventoryPhysicalStock_(ss,item.code,location);
  const reserved=reservations.reduce((n,r)=>n+(catalogNormalizeCode_(r[3])===code&&catalogNormalizeText_(r[4])===catalogNormalizeText_(location)&&String(r[6])==="Activa"?Number(r[5]||0):0),0);
  let consumed=0;kRows.forEach(r=>{const date=new Date(r[1]).getTime(),type=String(r[5]||"");if(catalogNormalizeCode_(r[2])===code&&catalogNormalizeText_(r[10]||"Bodega General")===catalogNormalizeText_(location)&&date>=since&&["Salida","Consumo","Prestamo","Baja","AjusteNegativo"].indexOf(type)!==-1)consumed+=Number(r[13]||r[6]||0);});
  const receivedByOrder=Object.create(null);
  receiptRows.forEach(r=>{let detail=[];try{detail=typeof r[4]==="string"?JSON.parse(r[4]):r[4]||[];}catch(_){}
   detail.forEach(x=>{const k=String(x.codigoItem||x.codigo||x.itemId||"");if(k&&(!x.danado&&!x.rechazado&&x.conforme!==false&&String(r[5]||"Conforme")==="Conforme"))receivedByOrder[String(r[1])+"|"+catalogNormalizeCode_(k)]=(receivedByOrder[String(r[1])+"|"+catalogNormalizeCode_(k)]||0)+Number(x.cantidad||0);});
  });
  let inboundOrders=0;orderRows.forEach(r=>{const status=String(r[9]||"");if(["Aprobada","Emitida","EnviadaProveedor","AceptadaProveedor","PendienteRecepcion","RecibidaParcial"].indexOf(status)===-1)return;const destination=String(r[15]||"Bodega General");if(catalogNormalizeText_(destination)!==catalogNormalizeText_(location))return;let lines=[];try{lines=typeof r[6]==="string"?JSON.parse(r[6]):r[6]||[];}catch(_){}lines.forEach(x=>{const k=catalogNormalizeCode_(x.codigoItem||x.codigo||x.itemId||x.id||"");if(k!==code)return;const requested=Number(x.cantidad||x.quantity||0),received=Number(receivedByOrder[String(r[0])+"|"+code]||0);inboundOrders+=Math.max(0,requested-received);});});
  let inboundTransfers=0;transferRows.forEach(r=>{if(catalogNormalizeCode_(r[2])===code&&catalogNormalizeText_(r[6])===catalogNormalizeText_(location)&&["EnTransito","RecibidaParcial"].indexOf(String(r[8]))!==-1)inboundTransfers+=Math.max(0,Number(r[4]||0)-Number(r[11]||0));});
  const available=assetDeprMoney_(physical-reserved),inbound=assetDeprMoney_(inboundOrders+inboundTransfers),projected=assetDeprMoney_(available+inbound),daily=consumed/periodDays,lead=Number(policy[7]||0),coverage=daily>0?projected/daily:null,min=Number(policy[4]||0),max=Number(policy[5]||0),target=Number(policy[6]||0);
  const trigger=(min>0&&projected<=min)||(daily>0&&coverage!==null&&coverage<=lead);
  const suggested=trigger?assetDeprMoney_(Math.max(0,Math.min(target,max||target)-projected)):0;
  const cost=Number(item.row[19]||item.row[18]||0);
  sugerencias.push({catalogItemId:item.id,itemCodigo:item.code,itemNombre:item.name,unidadMedida:item.unit,ubicacion:location,existenciaFisica:physical,reservada:assetDeprMoney_(reserved),disponible:available,pendienteRecepcion:assetDeprMoney_(inboundOrders),enTransito:assetDeprMoney_(inboundTransfers),consumoPeriodo:assetDeprMoney_(consumed),consumoPromedioDiario:assetDeprMoney_(daily),plazoEntregaDias:lead,diasCobertura:coverage===null?null:Math.round(coverage*100)/100,rotacionPeriodo:Math.round((consumed/Math.max(physical+consumed/2,1))*10000)/10000,cantidadSugerida:suggested,costoUnitarioEstimado:cost,estado:trigger&&suggested>0?"Reponer":projected>max&&max>0?"Exceso":"Suficiente"});
 });
 return {status:"success",sugerencias};
}

function inventoryEnsureLedgerSheet_(ss,name,headers) {
 let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);
 const rows=sh.getDataRange().getValues();
 if(!rows.length||!rows[0].some(x=>String(x||"").trim()))sh.getRange(1,1,1,headers.length).setValues([headers]);
 else if(JSON.stringify(rows[0].map(x=>String(x||"").trim()))!==JSON.stringify(headers))throw new Error("INVENTORY_LEDGER_SCHEMA_MISMATCH:"+name);
 return sh;
}


// Department IDs are accepted only as exact stable keys. Authorization is enforced
// separately against the authenticated department scope; display-name guessing is forbidden.
function resolveStaffingDepartmentReference_(ss, value) {
  var requested = String(value || "").trim();
  if (!requested) return { resolved: false, code: "DEPARTMENT_REFERENCE_REQUIRED" };
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("DepartamentosAcademicos") : null;
  if (!sheet) return { resolved: false, code: "DEPARTMENT_REFERENCE_NOT_FOUND" };
  var rows = sheet.getDataRange().getValues(), headers = (rows[0] || []).map(function(v) { return String(v || "").trim(); });
  var idIndex = headers.indexOf("DepartamentoID"), nameIndex = headers.indexOf("Nombre");
  if (idIndex < 0 || nameIndex < 0) return { resolved: false, code: "RESOURCE_SCHEMA_INVALID" };
  var matches = rows.slice(1).filter(function(row) {
    return String(row[idIndex] || "").trim() === requested || String(row[nameIndex] || "").trim().toLowerCase() === requested.toLowerCase();
  });
  if (matches.length !== 1) return { resolved: false, code: "DEPARTMENT_REFERENCE_NOT_FOUND" };
  return { resolved: true, departmentId: String(matches[0][idIndex]).trim(), departmentName: String(matches[0][nameIndex]).trim() };
}

function inventoryAssertDepartmentScope_(payload,ss,actor,departmentValue) {
 const scope=getVerifiedAccountingDepartmentScope_(payload,ss,actor);
 if(!scope||scope.authorized!==true)throw new Error(scope&&scope.code||"DEPARTMENT_SCOPE_NOT_ASSIGNED");
 const department=resolveStaffingDepartmentReference_(ss,departmentValue);
 if(!department||department.resolved!==true)throw new Error(department&&department.code||"DEPARTMENT_REFERENCE_INVALID");
 const allowed=(scope.departmentIds||[]).map(String);
 if(scope.institutionWide!==true&&!allowed.includes(String(department.departmentId)))throw new Error("RESOURCE_NOT_FOUND");
 return {scope:scope,department:department};
}

function inventoryAccount_(ss,code,expectedType) {
 const sh=getOrCreateSheet(ss,"PlanCuentas"),rows=sh.getDataRange().getValues().slice(1),matches=rows.filter(r=>String(r[1]||"").trim()===String(code));
 if(matches.length!==1||String(matches[0][5]||"Activa")!=="Activa"||String(matches[0][3]||"").toLowerCase()!==String(expectedType).toLowerCase())throw new Error("INVENTORY_ACCOUNT_NOT_CONFIGURED:"+code);
 return {code:String(matches[0][1]),name:String(matches[0][2])};
}

function inventoryCostPerBaseUnit_(item) {
 const row=item.row||[],average=Number(row[19]),lastPurchase=Number(row[18]),cost=Number.isFinite(average)&&average>0?average:(Number.isFinite(lastPurchase)&&lastPurchase>0?lastPurchase:0);
 if(!Number.isFinite(cost)||cost<=0)throw new Error("INVENTORY_ITEM_COST_REQUIRED:"+item.code);
 return assetDeprMoney_(cost);
}

function inventoryFindMovementByRef_(ss,ref) {const sh=ss.getSheetByName("InventariosKardex");if(!sh)return null;return sh.getDataRange().getValues().slice(1).find(r=>String(r[11]||"").indexOf("[REF:"+ref+"]")!==-1)||null;}

function inventoryJournalRows_(ss) {
 return getOrCreateSheet(ss,"AsientosContables").getDataRange().getValues();
}

function inventoryJournalExists_(ss,id) {
 return inventoryJournalRows_(ss).some((r,i)=>i>0&&String(r[0])===String(id));
}

function inventoryFindJournalById_(ss,id) {
 const matches=inventoryJournalRows_(ss).slice(1).filter(r=>String(r[0]||"")===String(id||""));
 if(matches.length>1)throw new Error("INVENTORY_JOURNAL_ID_AMBIGUOUS:"+id);
 return matches[0]||null;
}

function inventoryFindLedgerById_(sheet,id) {
 const matches=sheet.getDataRange().getValues().slice(1).filter(r=>String(r[0]||"")===String(id||""));
 if(matches.length>1)throw new Error("INVENTORY_LEDGER_ID_AMBIGUOUS:"+id);
 return matches[0]||null;
}

function inventoryAssertExistingJournal_(ss,id,expectedOrigin,expectedRef) {
 const row=inventoryFindJournalById_(ss,id);
 if(!row||String(row[6]||"")!=="Asentado"||(expectedOrigin&&String(row[3]||"")!==String(expectedOrigin))||(expectedRef&&String(row[4]||"")!==String(expectedRef)))throw new Error("INVENTORY_LEDGER_JOURNAL_MISSING_OR_MISMATCHED:"+id);
 return row;
}

function inventoryPostJournal_(ss,payload) {
 var input=payload||{},id=String(input.asientoId||"").trim(),description=String(input.descripcion||"").trim();
 var lines=Array.isArray(input.lineas)?input.lineas:[];
 if(!id||!description||!lines.length)throw new Error("INVENTORY_JOURNAL_ENTRY_INVALID");
 var existing=inventoryFindJournalById_(ss,id);
 if(existing){
  if(String(existing[2]||"")!==description||String(existing[3]||"")!==String(input.origenModulo||"")||
     String(existing[4]||"")!==String(input.referenciaId||"")||String(existing[5]||"")!==JSON.stringify(lines)) {
    throw new Error("INVENTORY_JOURNAL_IDEMPOTENCY_CONFLICT:"+id);
  }
  return {status:"success",asientoId:id,idempotent:true};
 }
 var debit=0,credit=0;
 lines.forEach(function(line){
  var d=Number(line&&line.debe||0),h=Number(line&&line.haber||0);
  if(!line||!String(line.cuenta||"").trim()||!Number.isFinite(d)||!Number.isFinite(h)||d<0||h<0||(d>0&&h>0)) {
    throw new Error("INVENTORY_JOURNAL_ENTRY_INVALID");
  }
  debit+=d;credit+=h;
 });
 if(Math.abs(debit-credit)>0.01)throw new Error("INVENTORY_JOURNAL_ENTRY_UNBALANCED");
 var sheet=getOrCreateSheet(ss,"AsientosContables"),data=sheet.getDataRange().getValues();
 var headers=["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"];
 if(!data.length||JSON.stringify(data[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(headers)) {
  throw new Error("INVENTORY_JOURNAL_SCHEMA_MISMATCH");
 }
 sheet.appendRow([id,new Date(),description,String(input.origenModulo||"INVENTARIO"),
  String(input.referenciaId||""),JSON.stringify(lines),"Asentado",String(input.creadoPor||"SISTEMA")]);
 return {status:"success",asientoId:id,totalDebe:debit,totalHaber:credit,estado:"Asentado"};
}
function inventoryDeleteAppendedRows_(sheet,firstRow) {
 if(!sheet||typeof sheet.deleteRow!=="function")return;
 while(sheet.getLastRow()>=firstRow)sheet.deleteRow(sheet.getLastRow());
}

function inventoryLedgerPayloadMatches_(ss,delivery,items,savedJson) {
 let saved;try{saved=typeof savedJson==="string"?JSON.parse(savedJson):savedJson;}catch(_){return false;}
 if(!Array.isArray(items)||!Array.isArray(saved)||items.length!==saved.length)return false;
 const seen=Object.create(null);
 for(let i=0;i<items.length;i++){
  const raw=items[i]||{},item=catalogFindItem_(ss,raw.catalogItemId||raw.itemCodigo||raw.itemId,false),line=saved[i];
  if(!line||String(line.itemCodigo||"")!==String(item.code)||seen[item.code])return false;seen[item.code]=true;
  const unitName=String(raw.unidadMedida||raw.unidad||item.unit),qty=Number(raw.cantidad);
  if(!Number.isFinite(qty)||qty<=0)return false;
  if(line.unidadOriginal!==undefined){
   if(catalogNormalizeText_(line.unidadOriginal)!==catalogNormalizeText_(unitName)||Math.abs(Number(line.cantidadOriginal)-qty)>0.000001)return false;
  }else{
   const unit=catalogFindUnit_(ss,unitName);
   if(catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit)||Math.abs(Number(line.cantidadBase)-assetDeprMoney_(qty*unit.factor))>0.000001)return false;
  }
 }
 return true;
}

function deliverMaterialRequisition(payload) {
 const p=payload||{},actor=catalogActor_(p,true),requestId=String(p.solicitudMatId||"").trim();if(!requestId)throw new Error("solicitudMatId es requerido.");
 const lock=LockService.getScriptLock();lock.waitLock(15000);let movementStart=0,journalStart=0,valuationSnapshot=null,reservationConsumed=false,requestSheetRef=null,requestRowNumber=0,requestSnapshot=null;
 try {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);valuationSnapshot=inventoryValuationSnapshot_(ss);const requestSheet=getOrCreateSheet(ss,"MaterialesSolicitudes");inventoryEnsureRequisitionSchema_(requestSheet);
  const data=requestSheet.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&String(r[0]).trim()===requestId);if(idx<0)throw new Error("Solicitud de material no encontrada.");
  const row=data[idx];requestSheetRef=requestSheet;requestRowNumber=idx+1;requestSnapshot=row.slice();inventoryAssertDepartmentScope_(p,ss,actor,row[2]);if(String(row[6]||"").trim()==="Entregado")throw new Error("La solicitud ya ha sido entregada previamente.");if(String(row[6]||"").trim()!=="Aprobada")throw new Error("MATERIAL_REQUISITION_NOT_APPROVED");const reservationSheet=inventoryEnsureReservations_(ss);let activeReservations=reservationSheet.getDataRange().getValues().slice(1).filter(r=>String(r[1])===requestId&&String(r[6])==="Activa");if(!activeReservations.length){const legacyItems=inventoryNormalizeRequisitionItems_(ss,row[4]);inventoryReserveRequisition_(ss,requestId,legacyItems,String(row[14]||"Bodega General"),actor.userId);activeReservations=reservationSheet.getDataRange().getValues().slice(1).filter(r=>String(r[1])===requestId&&String(r[6])==="Activa");}
  let items;try{items=typeof row[4]==="string"?JSON.parse(row[4]):row[4];}catch(e){throw new Error("MATERIAL_REQUISITION_ITEMS_INVALID");}
  if(!Array.isArray(items)||!items.length)throw new Error("MATERIAL_REQUISITION_ITEMS_REQUIRED");
  const expectedReservationItems=inventoryNormalizeRequisitionItems_(ss,items),reservationLocation=String(row[14]||"Bodega General");
  if(activeReservations.length!==expectedReservationItems.length||expectedReservationItems.some(x=>!activeReservations.some(r=>String(r[2])===String(x.catalogItemId)&&catalogNormalizeText_(r[4])===catalogNormalizeText_(reservationLocation)&&Math.abs(Number(r[5])-Number(x.cantidad)*Number(x.factorConversionBase))<0.000001)))throw new Error("MATERIAL_RESERVATION_MISMATCH");
  const department=String(row[2]||"").trim(),costCenter=String(row[10]||department).trim(),mode=String(row[11]||"GASTO_INMEDIATO").toUpperCase(),source=String(row[14]||"Bodega General").trim();
  if(!department||!costCenter||!source||["GASTO_INMEDIATO","ASIGNADO"].indexOf(mode)===-1)throw new Error("INVENTORY_COST_CENTER_OR_MODE_REQUIRED");
  getChartOfAccounts({});const inventory=inventoryAccount_(ss,"1301","Activo"),debit=mode==="ASIGNADO"?inventoryAccount_(ss,"1302","Activo"):inventoryAccount_(ss,"5201","Gasto");
  const kardex=getOrCreateSheet(ss,"InventariosKardex"),journal=getOrCreateSheet(ss,"AsientosContables");movementStart=kardex.getLastRow()+1;journalStart=journal.getLastRow()+1;
  const lines=[],details=[],seen=Object.create(null);
  items.forEach((raw,i)=>{
   const item=catalogFindItem_(ss,raw.catalogItemId||raw.itemCodigo||raw.itemId,true),unit=catalogFindUnit_(ss,raw.unidadMedida||raw.unidad||item.unit),qty=Number(raw.cantidad);
   if(catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit)||!Number.isFinite(qty)||qty<=0)throw new Error("MATERIAL_REQUISITION_ITEM_INVALID");
   if(seen[item.id])throw new Error("MATERIAL_REQUISITION_DUPLICATE_ITEM:"+item.code);seen[item.id]=true;
   const ref="REQMAT:"+requestId+":"+i,rows=kardex.getDataRange().getValues().slice(1),findRef=suffix=>rows.find(r=>String(r[11]||"").indexOf("[REF:"+ref+suffix+"]")!==-1);
   const out=findRef(":OUT")||findRef(""),outMove=out?Object.assign({cantidadBase:Number(out[13]||out[6]||0)},inventoryValuationMovementResult_(ss,out[0])):recordInventoryMovementLocked_(ss,{itemCodigo:item.code,tipoMovimiento:mode==="ASIGNADO"?"TransferenciaSalida":"Salida",cantidad:qty,unidadMedida:unit.name,ubicacionResponsable:source,documentOrigen:requestId,observaciones:"Entrega por solicitud "+requestId+" [REF:"+ref+":OUT]"});
   let inMove=null;if(mode==="ASIGNADO"){const incoming=findRef(":IN");inMove=incoming?{kardexId:incoming[0],cantidadBase:Number(incoming[13]||incoming[6]||0)}:recordInventoryMovementLocked_(ss,{itemCodigo:item.code,tipoMovimiento:"Entrada",cantidad:outMove.cantidadBase,cantidadBase:true,capasTransferencia:outMove.capasTransferencia,documentOrigen:requestId,ubicacionResponsable:department,observaciones:"Asignación por solicitud "+requestId+" [REF:"+ref+":IN]"});}
   const baseQty=Number(outMove.cantidadBase||0),amount=inventoryValuationMoney_(outMove.costoTotalValoracion),cost=baseQty>0?inventoryValuationMoney_(amount/baseQty):0;if(baseQty<=0||amount<=0)throw new Error("INVENTORY_CONSUMPTION_AMOUNT_INVALID");
   lines.push({cuenta:debit.code,nombre:debit.name,debe:amount,haber:0,centroCosto:costCenter,departamento:department,itemCodigo:item.code,referenciaId:requestId});
   lines.push({cuenta:inventory.code,nombre:inventory.name,debe:0,haber:amount,centroCosto:costCenter,departamento:department,itemCodigo:item.code,referenciaId:requestId});
   details.push({itemId:item.id,itemCodigo:item.code,cantidadBase:baseQty,costoUnitarioBase:cost,importe:amount,capasTransferencia:outMove.capasTransferencia||[],kardexId:outMove.kardexId,kardexDestinoId:inMove&&inMove.kardexId,ubicacionOrigen:source,ubicacionDestino:department});
  });
  const asientoId="AST-INV-REQ-"+requestId;inventoryPostJournal_(ss,{descripcion:"Entrega de materiales "+requestId,origenModulo:"INVENTARIO",referenciaId:requestId,asientoId,lineas:lines,creadoPor:actor.userId});
  inventorySetReservationState_(ss,requestId,"Consumida",actor.userId);reservationConsumed=true;
  requestSheet.getRange(idx+1,9).setValue(actor.userId);if(p.observaciones)requestSheet.getRange(idx+1,10).setValue(p.observaciones);requestSheet.getRange(idx+1,13).setValue(asientoId);requestSheet.getRange(idx+1,14).setValue(JSON.stringify(details));requestSheet.getRange(idx+1,7).setValue("Entregado");
  return {status:"success",solicitudMatId:requestId,asientoId,centroCosto:costCenter,modoReconocimiento:mode,detalle:details,message:"Materiales entregados, descontados/asignados y contabilizados por partida doble."};
 } catch(e) {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);if(reservationConsumed){try{inventorySetReservationState_(ss,requestId,"Activa",actor.userId,["Consumida"]);}catch(restoreReservationError){e.message+="; RESERVATION_RESTORE_FAILED:"+restoreReservationError.message;}}if(requestSheetRef&&requestSnapshot){try{requestSheetRef.getRange(requestRowNumber,7,1,8).setValues([requestSnapshot.slice(6,14)]);}catch(restoreRequestError){e.message+="; REQUEST_RESTORE_FAILED:"+restoreRequestError.message;}}inventoryValuationRestore_(ss,valuationSnapshot);if(movementStart){const sh=ss.getSheetByName("InventariosKardex");if(sh)inventoryDeleteAppendedRows_(sh,movementStart);}if(journalStart){const sh=ss.getSheetByName("AsientosContables");if(sh)inventoryDeleteAppendedRows_(sh,journalStart);}throw e;
 } finally {lock.releaseLock();}
}

function returnMaterialToInventory(payload) {
 const p=payload||{},actor=catalogActor_(p,true),requestId=String(p.solicitudMatId||"").trim(),returnId=String(p.devolucionId||"").trim(),items=Array.isArray(p.items)?p.items:[];
 if(!requestId||!returnId||!items.length)throw new Error("MATERIAL_RETURN_FIELDS_REQUIRED");
 const lock=LockService.getScriptLock();lock.waitLock(15000);let movementStart=0,journalStart=0,ledgerStart=0,valuationSnapshot=null;
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);valuationSnapshot=inventoryValuationSnapshot_(ss);const req=getOrCreateSheet(ss,"MaterialesSolicitudes"),data=req.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&String(r[0])===requestId);if(idx<0)throw new Error("RESOURCE_NOT_FOUND");
  const department=String(data[idx][2]||"");inventoryAssertDepartmentScope_(p,ss,actor,department);
  if(String(data[idx][6])!=="Entregado")throw new Error("MATERIAL_RETURN_REQUEST_NOT_DELIVERED");
  const ledger=inventoryEnsureLedgerSheet_(ss,"DevolucionesMateriales",["DevolucionID","SolicitudMatID","Fecha","ItemsJSON","AsientoID","ActorUserId","Observaciones"]);
  const delivery=JSON.parse(String(data[idx][13]||"[]")),center=String(data[idx][10]||department),mode=String(data[idx][11]||"GASTO_INMEDIATO").toUpperCase(),source=String(data[idx][14]||"Bodega General");
  const existing=inventoryFindLedgerById_(ledger,returnId);
  if(existing){if(String(existing[1])!==requestId||!inventoryLedgerPayloadMatches_(ss,delivery,items,existing[3]))throw new Error("MATERIAL_RETURN_IDEMPOTENCY_CONFLICT");inventoryAssertExistingJournal_(ss,existing[4],"INVENTARIO",returnId);return {status:"success",devolucionId:returnId,asientoId:existing[4],idempotent:true};}
  const previous=ledger.getDataRange().getValues().slice(1).filter(r=>String(r[1])===requestId),consumedSheet=ss.getSheetByName("ConsumosMateriales"),consumed=consumedSheet?consumedSheet.getDataRange().getValues().slice(1).filter(r=>String(r[1])===requestId):[];
  const returnedByCode={},consumedByCode={};previous.forEach(r=>{try{JSON.parse(r[3]).forEach(x=>returnedByCode[x.itemCodigo]=(returnedByCode[x.itemCodigo]||0)+Number(x.cantidadBase||0));}catch(_){}});consumed.forEach(r=>{try{JSON.parse(r[3]).forEach(x=>consumedByCode[x.itemCodigo]=(consumedByCode[x.itemCodigo]||0)+Number(x.cantidadBase||0));}catch(_){}});
  getChartOfAccounts({});const inventory=inventoryAccount_(ss,"1301","Activo"),credit=mode==="ASIGNADO"?inventoryAccount_(ss,"1302","Activo"):inventoryAccount_(ss,"5201","Gasto"),kardex=getOrCreateSheet(ss,"InventariosKardex"),journal=getOrCreateSheet(ss,"AsientosContables");movementStart=kardex.getLastRow()+1;journalStart=journal.getLastRow()+1;ledgerStart=ledger.getLastRow()+1;
  const lines=[],saved=[],seen={};
  items.forEach((raw,i)=>{const item=catalogFindItem_(ss,raw.catalogItemId||raw.itemCodigo,true),unit=catalogFindUnit_(ss,raw.unidadMedida||item.unit),qty=Number(raw.cantidad),d=delivery.find(x=>x.itemCodigo===item.code);if(!d||!Number.isFinite(qty)||qty<=0||catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit))throw new Error("MATERIAL_RETURN_ITEM_INVALID");if(seen[item.code])throw new Error("MATERIAL_RETURN_DUPLICATE_ITEM");seen[item.code]=true;const base=assetDeprMoney_(qty*unit.factor),available=Number(d.cantidadBase||0)-Number(returnedByCode[item.code]||0)-Number(consumedByCode[item.code]||0);if(base>available+0.000001)throw new Error("MATERIAL_RETURN_EXCEEDS_AVAILABLE:"+item.code);const ref="MATRET:"+returnId+":"+i,outRow=mode==="ASIGNADO"?inventoryFindMovementByRef_(ss,ref+":OUT"):null,inRow=inventoryFindMovementByRef_(ss,ref+":IN"),out=mode==="ASIGNADO"?(outRow?{kardexId:outRow[0]}:recordInventoryMovementLocked_(ss,{itemCodigo:item.code,tipoMovimiento:"TransferenciaSalida",cantidad:base,cantidadBase:true,ubicacionResponsable:department,observaciones:"Devolución de solicitud "+requestId+" [REF:"+ref+":OUT]"})):null,incoming=inRow?{kardexId:inRow[0]}:recordInventoryMovementLocked_(ss,{itemCodigo:item.code,tipoMovimiento:"Entrada",cantidad:base,cantidadBase:true,costoUnitario:Number(d.costoUnitarioBase||0),capasTransferencia:inventoryValuationSliceLayers_(d.capasTransferencia||[{cantidad:Number(d.cantidadBase||0),costoUnitario:Number(d.costoUnitarioBase||0)}],base),documentOrigen:returnId,ubicacionResponsable:source,observaciones:"Devolución de solicitud "+requestId+" [REF:"+ref+":IN]"}),amount=assetDeprMoney_(base*Number(d.costoUnitarioBase||0));if(amount<=0)throw new Error("MATERIAL_RETURN_COST_INVALID");lines.push({cuenta:inventory.code,nombre:inventory.name,debe:amount,haber:0,centroCosto:center,departamento:department,itemCodigo:item.code,referenciaId:returnId},{cuenta:credit.code,nombre:credit.name,debe:0,haber:amount,centroCosto:center,departamento:department,itemCodigo:item.code,referenciaId:returnId});saved.push({itemCodigo:item.code,cantidadBase:base,importe:amount,kardexSalidaId:out&&out.kardexId,kardexEntradaId:incoming.kardexId,unidadOriginal:unit.name,cantidadOriginal:qty,factorConversionBase:unit.factor});});
  const asientoId="AST-INV-RET-"+returnId;inventoryPostJournal_(ss,{descripcion:"Devolución de materiales "+returnId,origenModulo:"INVENTARIO",referenciaId:returnId,asientoId,lineas:lines,creadoPor:actor.userId});ledger.appendRow([returnId,requestId,new Date(),JSON.stringify(saved),asientoId,actor.userId,p.observaciones||""]);return {status:"success",devolucionId:returnId,asientoId,detalle:saved};
 }catch(e){const ss=SpreadsheetApp.openById(SPREADSHEET_ID);inventoryValuationRestore_(ss,valuationSnapshot);if(movementStart)inventoryDeleteAppendedRows_(ss.getSheetByName("InventariosKardex"),movementStart);if(journalStart)inventoryDeleteAppendedRows_(ss.getSheetByName("AsientosContables"),journalStart);if(ledgerStart)inventoryDeleteAppendedRows_(ss.getSheetByName("DevolucionesMateriales"),ledgerStart);throw e;}finally{lock.releaseLock();}
}

function recognizeAssignedMaterialConsumption(payload) {
 const p=payload||{},actor=catalogActor_(p,true),requestId=String(p.solicitudMatId||"").trim(),consumptionId=String(p.consumoId||"").trim(),items=Array.isArray(p.items)?p.items:[];
 if(!requestId||!consumptionId||!items.length)throw new Error("ASSIGNED_CONSUMPTION_FIELDS_REQUIRED");
 const lock=LockService.getScriptLock();lock.waitLock(15000);let movementStart=0,journalStart=0,ledgerStart=0,valuationSnapshot=null;
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);valuationSnapshot=inventoryValuationSnapshot_(ss);const req=getOrCreateSheet(ss,"MaterialesSolicitudes"),data=req.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&String(r[0])===requestId);if(idx<0)throw new Error("RESOURCE_NOT_FOUND");
  const department=String(data[idx][2]||"");inventoryAssertDepartmentScope_(p,ss,actor,department);
  if(String(data[idx][6])!=="Entregado"||String(data[idx][11])!=="ASIGNADO")throw new Error("ASSIGNED_CONSUMPTION_REQUEST_INVALID");
  const ledger=inventoryEnsureLedgerSheet_(ss,"ConsumosMateriales",["ConsumoID","SolicitudMatID","Fecha","ItemsJSON","AsientoID","ActorUserId","Observaciones"]);
  const delivery=JSON.parse(String(data[idx][13]||"[]")),center=String(data[idx][10]||department);
  const existing=inventoryFindLedgerById_(ledger,consumptionId);
  if(existing){if(String(existing[1])!==requestId||!inventoryLedgerPayloadMatches_(ss,delivery,items,existing[3]))throw new Error("ASSIGNED_CONSUMPTION_IDEMPOTENCY_CONFLICT");inventoryAssertExistingJournal_(ss,existing[4],"INVENTARIO",consumptionId);return {status:"success",consumoId:consumptionId,asientoId:existing[4],idempotent:true};}
  const returns=ss.getSheetByName("DevolucionesMateriales"),returnRows=returns?returns.getDataRange().getValues().slice(1).filter(r=>String(r[1])===requestId):[],prior=ledger.getDataRange().getValues().slice(1).filter(r=>String(r[1])===requestId),returnedByCode={},consumedByCode={};
  returnRows.forEach(r=>{try{JSON.parse(r[3]).forEach(x=>returnedByCode[x.itemCodigo]=(returnedByCode[x.itemCodigo]||0)+Number(x.cantidadBase||0));}catch(_){}});prior.forEach(r=>{try{JSON.parse(r[3]).forEach(x=>consumedByCode[x.itemCodigo]=(consumedByCode[x.itemCodigo]||0)+Number(x.cantidadBase||0));}catch(_){}});
  getChartOfAccounts({});const expense=inventoryAccount_(ss,"5201","Gasto"),assigned=inventoryAccount_(ss,"1302","Activo"),kardex=getOrCreateSheet(ss,"InventariosKardex"),journal=getOrCreateSheet(ss,"AsientosContables");movementStart=kardex.getLastRow()+1;journalStart=journal.getLastRow()+1;ledgerStart=ledger.getLastRow()+1;
  const lines=[],saved=[],seen={};
  items.forEach((raw,i)=>{const item=catalogFindItem_(ss,raw.catalogItemId||raw.itemCodigo,true),unit=catalogFindUnit_(ss,raw.unidadMedida||item.unit),qty=Number(raw.cantidad),d=delivery.find(x=>x.itemCodigo===item.code);if(!d||!Number.isFinite(qty)||qty<=0||catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit))throw new Error("ASSIGNED_CONSUMPTION_ITEM_INVALID");if(seen[item.code])throw new Error("ASSIGNED_CONSUMPTION_DUPLICATE_ITEM");seen[item.code]=true;const base=assetDeprMoney_(qty*unit.factor),available=Number(d.cantidadBase||0)-Number(returnedByCode[item.code]||0)-Number(consumedByCode[item.code]||0);if(base>available+0.000001)throw new Error("ASSIGNED_CONSUMPTION_EXCEEDS_AVAILABLE:"+item.code);const ref="MATCON:"+consumptionId+":"+i,existingMove=inventoryFindMovementByRef_(ss,ref),movement=existingMove?inventoryValuationMovementResult_(ss,existingMove[0]):recordInventoryMovementLocked_(ss,{itemCodigo:item.code,tipoMovimiento:"Consumo",cantidad:base,cantidadBase:true,ubicacionResponsable:department,documentOrigen:consumptionId,observaciones:"Consumo efectivo de solicitud "+requestId+" [REF:"+ref+"]"}),amount=inventoryValuationMoney_(movement.costoTotalValoracion);if(amount<=0)throw new Error("ASSIGNED_CONSUMPTION_COST_INVALID");lines.push({cuenta:expense.code,nombre:expense.name,debe:amount,haber:0,centroCosto:center,departamento:department,itemCodigo:item.code,referenciaId:consumptionId},{cuenta:assigned.code,nombre:assigned.name,debe:0,haber:amount,centroCosto:center,departamento:department,itemCodigo:item.code,referenciaId:consumptionId});saved.push({itemCodigo:item.code,cantidadBase:base,importe:amount,kardexId:movement.kardexId,unidadOriginal:unit.name,cantidadOriginal:qty,factorConversionBase:unit.factor});});
  const asientoId="AST-INV-CONS-"+consumptionId;inventoryPostJournal_(ss,{descripcion:"Consumo efectivo de materiales "+consumptionId,origenModulo:"INVENTARIO",referenciaId:consumptionId,asientoId,lineas:lines,creadoPor:actor.userId});ledger.appendRow([consumptionId,requestId,new Date(),JSON.stringify(saved),asientoId,actor.userId,p.observaciones||""]);return {status:"success",consumoId:consumptionId,asientoId,detalle:saved};
 }catch(e){const ss=SpreadsheetApp.openById(SPREADSHEET_ID);inventoryValuationRestore_(ss,valuationSnapshot);if(movementStart)inventoryDeleteAppendedRows_(ss.getSheetByName("InventariosKardex"),movementStart);if(journalStart)inventoryDeleteAppendedRows_(ss.getSheetByName("AsientosContables"),journalStart);if(ledgerStart)inventoryDeleteAppendedRows_(ss.getSheetByName("ConsumosMateriales"),ledgerStart);throw e;}finally{lock.releaseLock();}
}

function manageMaintenanceOrder(payload) {
 const p=payload||{},actor=catalogActor_(p,false),assetRef=String(p.activoIdUbicacion||"").trim(),description=String(p.descripcionFalla||"").trim();
 if(!assetRef||!description)throw new Error("activoIdUbicacion y descripcionFalla son requeridos.");
 const lock=LockService.getScriptLock();lock.waitLock(15000);let movementStart=0,journalStart=0,valuationSnapshot=null;
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);valuationSnapshot=inventoryValuationSnapshot_(ss);const sheet=getOrCreateSheet(ss,"MantenimientoOrdenes");inventoryEnsureMaintenanceSchema_(sheet);
  const data=sheet.getDataRange().getValues(),oId=String(p.ordenMaintId||("MNT-"+Utilities.getUuid())).trim(),matches=data.map((r,i)=>({row:r,index:i})).filter(x=>x.index>0&&String(x.row[0]||"").trim()===oId);
  if(matches.length>1)throw new Error("MAINTENANCE_ORDER_ID_AMBIGUOUS");
  const found=matches[0]||null,existing=found?found.row:null,idx=found?found.index:-1,now=new Date(),state=String(p.estadoOrden||(existing&&existing[11])||"Reportado").trim(),complete=["RESUELTO","COMPLETADO"].includes(state.toUpperCase());
  const repuestValue=p.repuestosConsumidosJSON!==undefined?p.repuestosConsumidosJSON:(existing?existing[8]:"[]");
  let repArr;try{repArr=typeof repuestValue==="string"?JSON.parse(repuestValue||"[]"):(repuestValue||[]);}catch(_){throw new Error("MAINTENANCE_PARTS_JSON_INVALID");}
  if(!Array.isArray(repArr))throw new Error("MAINTENANCE_PARTS_JSON_INVALID");
  const repuestStr=JSON.stringify(repArr);
  if(existing&&existing[16]&&!complete)throw new Error("MAINTENANCE_ORDER_ACCOUNTED_CANNOT_REOPEN");
  let departmentInfo=null,asientoId=existing&&existing[16]?String(existing[16]):"",details=existing&&existing[17]?existing[17]:"[]",idempotent=false;
  if((complete&&repArr.length)||p.departamento||(existing&&existing[14]))departmentInfo=inventoryResolveMaintenanceDepartment_(ss,p,assetRef,actor,existing);
  if(existing&&existing[16]){
   if(!complete||!repArr.length||!departmentInfo||String(existing[14]||"")!==departmentInfo.departmentId||String(existing[15]||"")!==departmentInfo.centroCosto||!inventoryLedgerPayloadMatches_(ss,[],repArr,existing[17]))throw new Error("MAINTENANCE_MATERIAL_IDEMPOTENCY_CONFLICT");
   inventoryAssertExistingJournal_(ss,existing[16],"INVENTARIO",oId);idempotent=true;
  }
  if(complete&&repArr.length&&!(existing&&existing[16])){
   if (typeof getChartOfAccounts === "function") getChartOfAccounts({});const expense=inventoryAccount_(ss,"5201","Gasto"),inventory=inventoryAccount_(ss,"1301","Activo"),kardex=getOrCreateSheet(ss,"InventariosKardex"),journal=getOrCreateSheet(ss,"AsientosContables");
   movementStart=kardex.getLastRow()+1;journalStart=journal.getLastRow()+1;
   const lines=[],saved=[],seen=Object.create(null);
   repArr.forEach((raw,i)=>{
    const item=catalogFindItem_(ss,raw.catalogItemId||raw.itemCodigo||raw.itemId,true),unit=catalogFindUnit_(ss,raw.unidadMedida||raw.unidad||item.unit),qty=Number(raw.cantidad);
    if(catalogNormalizeText_(unit.base)!==catalogNormalizeText_(item.baseUnit)||!Number.isFinite(qty)||qty<=0)throw new Error("MAINTENANCE_PART_INVALID");
    if(seen[item.code])throw new Error("MAINTENANCE_PART_DUPLICATE:"+item.code);seen[item.code]=true;
    const base=assetDeprMoney_(qty*unit.factor),ref="MNTMAT:"+oId+":"+i,prior=inventoryFindMovementByRef_(ss,ref);
    let movement;
    if(prior){if(String(prior[2]||"")!==String(item.code)||Math.abs(Number(prior[13]||prior[6]||0)-base)>0.000001||String(prior[10]||"")!==departmentInfo.ubicacionOrigen)throw new Error("MAINTENANCE_MOVEMENT_IDEMPOTENCY_CONFLICT");movement=Object.assign({cantidadBase:base},inventoryValuationMovementResult_(ss,prior[0]));}
    else movement=recordInventoryMovementLocked_(ss,{itemCodigo:item.code,tipoMovimiento:"Salida",cantidad:qty,unidadMedida:unit.name,ubicacionResponsable:departmentInfo.ubicacionOrigen,observaciones:"Consumo de repuesto por Orden Mantenimiento "+oId+" [REF:"+ref+"]"});
    const amount=inventoryValuationMoney_(movement.costoTotalValoracion),cost=base>0?inventoryValuationMoney_(amount/base):0;if(base<=0||amount<=0)throw new Error("MAINTENANCE_PART_COST_INVALID");
    lines.push({cuenta:expense.code,nombre:expense.name,debe:amount,haber:0,centroCosto:departmentInfo.centroCosto,departamento:departmentInfo.departmentId,itemCodigo:item.code,referenciaId:oId},{cuenta:inventory.code,nombre:inventory.name,debe:0,haber:amount,centroCosto:departmentInfo.centroCosto,departamento:departmentInfo.departmentId,itemCodigo:item.code,referenciaId:oId});
    saved.push({itemCodigo:item.code,cantidadBase:base,costoUnitarioBase:cost,importe:amount,kardexId:movement.kardexId,unidadOriginal:unit.name,cantidadOriginal:qty,factorConversionBase:unit.factor});
   });
   asientoId="AST-INV-MNT-"+oId;inventoryPostJournal_(ss,{descripcion:"Consumo de repuestos de mantenimiento "+oId,origenModulo:"INVENTARIO",referenciaId:oId,asientoId:asientoId,lineas:lines,creadoPor:actor.userId});details=JSON.stringify(saved);
  }
  const row=existing?existing.slice():new Array(19).fill("");while(row.length<19)row.push("");
  row[0]=oId;row[1]=existing?existing[1]:now;row[2]=assetRef;row[3]=p.tipoMantenimiento||(existing&&existing[3])||"Correctivo";row[4]=description;row[5]=p.prioridad||(existing&&existing[5])||"Media";row[6]=existing?existing[6]:actor.userId;row[7]=p.asignadoAEmpleadoId!==undefined?p.asignadoAEmpleadoId:(existing&&existing[7]||"");row[8]=repuestStr;row[9]=p.costoEstimado!==undefined?p.costoEstimado:(existing&&existing[9]||0);
  const partsTotal=(()=>{try{return JSON.parse(details||"[]").reduce((sum,x)=>sum+Number(x.importe||0),0);}catch(_){return 0;}})();row[10]=p.costoReal!==undefined?p.costoReal:(Number(existing&&existing[10]||0)>0?existing[10]:partsTotal);
  row[11]=state;row[12]=p.fechaResolucion||(complete?((existing&&existing[12])||now):(existing&&existing[12]||""));row[13]=p.observaciones!==undefined?p.observaciones:(existing&&existing[13]||"");row[14]=departmentInfo?departmentInfo.departmentId:(existing&&existing[14]||"");row[15]=departmentInfo?departmentInfo.centroCosto:(existing&&existing[15]||"");row[16]=asientoId;row[17]=details;row[18]=departmentInfo?departmentInfo.ubicacionOrigen:(existing&&existing[18]||p.ubicacionOrigen||"Bodega General");
  if(idx!==-1)sheet.getRange(idx+1,1,1,row.length).setValues([row]);else sheet.appendRow(row);
  try{
   const vehSheet=getOrCreateSheet(ss,"TransporteVehiculos"),vehData=vehSheet.getDataRange().getValues(),vIdx=vehData.findIndex(r=>String(r[0]||"").trim()===assetRef||String(r[1]||"").trim()===assetRef||String(r[2]||"").trim()===assetRef);
   if(vIdx!==-1){if(complete)vehSheet.getRange(vIdx+1,8).setValue("Disponible");else if(["ENTALLER","ENPROCESO","REPORTADO"].includes(state.toUpperCase()))vehSheet.getRange(vIdx+1,8).setValue("EnMantenimiento");}
  }catch(_){}
  return {status:"success",ordenMaintId:oId,asientoId:asientoId||null,idempotent:idempotent,detalleRepuestos:repArr.length?JSON.parse(details):[],message:idempotent?"Orden de mantenimiento y consumo contable ya registrados.":"Orden de mantenimiento registrada/actualizada correctamente."};
 }catch(e){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);inventoryValuationRestore_(ss,valuationSnapshot);
  if(movementStart){const sh=ss.getSheetByName("InventariosKardex");if(sh)inventoryDeleteAppendedRows_(sh,movementStart);}
  if(journalStart){const sh=ss.getSheetByName("AsientosContables");if(sh)inventoryDeleteAppendedRows_(sh,journalStart);}
  throw e;
 }finally{lock.releaseLock();}
}

function confirmTransferReceipt(payload) {
  catalogActor_(payload || {}, false);
  const {
    transferBatchId,
    cantidadRecibida,
    receptorUserId,
    justificacionDiscrepancia,
    observaciones
  } = payload || {};

  if (!transferBatchId) throw new Error("transferBatchId es requerido.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const trfSheet = getOrCreateSheet(ss, "TransferenciasInventario");
    const trfData = trfSheet.getDataRange().getValues();

    let foundIdx = -1;
    for (let i = 1; i < trfData.length; i++) {
      if (String(trfData[i][0]).trim() === String(transferBatchId).trim()) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx === -1) {
      return { status: "error", code: "NOT_FOUND", message: `Transferencia '${transferBatchId}' no encontrada.` };
    }

    const trfRow = trfData[foundIdx];
    const estadoActual = String(trfRow[8] || "").trim();

    if (estadoActual === "RecibidaTotal" || estadoActual === "RecibidaParcial") {
      return {
        status: "error",
        code: "TRANSFER_ALREADY_RECEIVED",
        message: `La transferencia '${transferBatchId}' ya fue recibida previamente con estado '${estadoActual}'.`
      };
    }
    if (estadoActual === "Cancelada" || estadoActual === "Rechazada") {
      return {
        status: "error",
        code: "TRANSFER_INACTIVE",
        message: `No se puede recibir la transferencia '${transferBatchId}' porque se encuentra '${estadoActual}'.`
      };
    }

    const itemCodigo = String(trfRow[2]).trim();
    const itemNombre = String(trfRow[3] || itemCodigo).trim();
    const cantDespachada = parseFloat(trfRow[4] || 0);
    const uOrigen = String(trfRow[5]).trim();
    const uDestino = String(trfRow[6]).trim();

    const cantRec = cantidadRecibida !== undefined ? parseFloat(cantidadRecibida) : cantDespachada;
    if (isNaN(cantRec) || cantRec < 0) {
      throw new Error("La cantidad recibida no puede ser negativa.");
    }
    if (cantRec > cantDespachada + 0.000001) {
      throw new Error("TRANSFER_RECEIPT_EXCEEDS_DISPATCHED_QUANTITY");
    }

    const discrepancia = parseFloat((cantDespachada - cantRec).toFixed(2));
    const nuevoEstado = discrepancia === 0 ? "RecibidaTotal" : (cantRec > 0 ? "RecibidaParcial" : "Rechazada");
    const now = new Date();
    const receptor = receptorUserId || (payload && (payload.authenticatedUserId || payload.userId)) || "ReceptorBodega";

    // 1. Ingresar en Kardex únicamente las unidades físicas efectivamente recibidas en destino
    let entradaRes = null;
    if (cantRec > 0) {
      entradaRes = recordInventoryMovementLocked_(ss,{
        itemCodigo,
        itemNombre,
        tipoMovimiento: "Entrada",
        cantidad: cantRec,
        cantidadBase: true,
        capasTransferencia: inventoryValuationSliceLayers_(inventoryValuationTransferLayers_(ss,transferBatchId),cantRec),
        ubicacionResponsable: uDestino,
        documentOrigen: transferBatchId,
        referenciaMovimiento: `Recepción desde ${uOrigen} [Discrepancia: ${discrepancia}]`,
        observaciones: `Recepción física de transferencia '${transferBatchId}'. ${observaciones || ""}`
      });
    }

    // 2. Actualizar registro en TransferenciasInventario
    trfSheet.getRange(foundIdx + 1, 9).setValue(nuevoEstado);
    trfSheet.getRange(foundIdx + 1, 10).setValue(receptor);
    trfSheet.getRange(foundIdx + 1, 11).setValue(now);
    trfSheet.getRange(foundIdx + 1, 12).setValue(cantRec);
    trfSheet.getRange(foundIdx + 1, 13).setValue(discrepancia);
    let obsFin = String(trfRow[13] || "");
    if (discrepancia !== 0) {
      obsFin += ` | [DISCREPANCIA:${discrepancia}] [MOTIVO:${justificacionDiscrepancia || 'No especificado'}]`;
    }
    trfSheet.getRange(foundIdx + 1, 14).setValue(obsFin.trim());

    logStructuredEvent(
      "ACCOUNTING",
      "confirmTransferReceipt",
      "INFO",
      "TRANSFER_RECEIVED",
      `Transferencia ${transferBatchId} recibida en ${uDestino}. Despachadas: ${cantDespachada}, Recibidas: ${cantRec}, Discrepancia: ${discrepancia}`,
      { transferBatchId, itemCodigo, cantDespachada, cantRec, discrepancia, nuevoEstado },
      receptor
    );

    return {
      status: "success",
      transferBatchId: transferBatchId,
      estadoTransferencia: nuevoEstado,
      cantidadDespachada: cantDespachada,
      cantidadRecibida: cantRec,
      discrepancia: discrepancia,
      ubicacionDestino: uDestino,
      stockNuevoDestino: entradaRes ? entradaRes.stockNuevoUbicacion : null,
      message: `Transferencia ${transferBatchId} recibida con estado '${nuevoEstado}'. Unidades recibidas: ${cantRec}.`
    };
  } finally {
    lock.releaseLock();
  }
}

// [TASK-021] [F19-Task03] - Consulta de transferencias entre almacenes

function inventoryEnsureMaintenanceSchema_(sheet) {
 const base=["OrdenMaintID","FechaReporte","ActivoIdUbicacion","TipoMantenimiento","DescripcionFalla","Prioridad","ReportadoPorUserId","AsignadoAEmpleadoId","RepuestosConsumidosJSON","CostoEstimado","CostoReal","EstadoOrden","FechaResolucion","Observaciones"];
 const extra=["DepartamentoID","CentroCosto","AsientoContableID","DetalleRepuestosContabilizadosJSON","UbicacionOrigen"],row=sheet.getDataRange().getValues()[0]||[];
 if(base.some((h,i)=>String(row[i]||"").trim()!==h))throw new Error("MAINTENANCE_ORDER_SCHEMA_MISMATCH");
 extra.forEach((h,i)=>{const v=String(row[14+i]||"").trim();if(v&&v!==h)throw new Error("MAINTENANCE_ORDER_SCHEMA_CONFLICT:"+v);});
 extra.forEach((h,i)=>{if(!String(row[14+i]||"").trim())sheet.getRange(1,15+i).setValue(h);});
}

function inventoryResolveMaintenanceDepartment_(ss,p,assetRef,actor,existingRow) {
 let departmentValue=String(p.departamento||(existingRow&&existingRow[14])||"").trim(),center=String(p.centroCosto||(existingRow&&existingRow[15])||"").trim(),asset=null;
 const assetSheet=ss.getSheetByName("ActivosPatrimoniales");
 if(assetSheet){
  const data=assetSheet.getDataRange().getValues();
  if(data.length>1){
   const h=data[0].map(v=>String(v||"").trim()),id=h.indexOf("ActivoID"),code=h.indexOf("CodigoPatrimonial"),name=h.indexOf("Nombre"),custodian=h.indexOf("CustodioUserId");
   if(id<0||code<0||name<0||custodian<0)throw new Error("MAINTENANCE_ASSET_SCHEMA_INVALID");
   const raw=String(assetRef||"").trim(),tokens=[raw,raw.split("/")[0].trim()].filter(Boolean),matches=data.slice(1).filter(r=>tokens.some(t=>[r[id],r[code],r[name]].some(v=>String(v||"").trim().toLowerCase()===t.toLowerCase())));
   if(matches.length>1)throw new Error("MAINTENANCE_ASSET_REFERENCE_AMBIGUOUS");
   if(matches.length===1)asset={row:matches[0],custodianIndex:custodian};
  }
 }
 if(asset){
  const custodianId=String(asset.row[asset.custodianIndex]||"").trim();
  if(custodianId){
   const employeeSheet=ss.getSheetByName("ExpedientesLaborales");
   if(employeeSheet){
    const data=employeeSheet.getDataRange().getValues(),h=data.length?data[0].map(v=>String(v||"").trim()):[],user=h.indexOf("UserId"),dept=h.indexOf("Departamento"),cost=h.indexOf("CentroCosto");
    if(user<0||dept<0)throw new Error("MAINTENANCE_EMPLOYEE_SCHEMA_INVALID");
    const matches=data.slice(1).filter(r=>String(r[user]||"").trim()===custodianId);
    if(matches.length>1)throw new Error("MAINTENANCE_ASSET_CUSTODIAN_AMBIGUOUS");
    if(matches.length===1){if(!departmentValue)departmentValue=String(matches[0][dept]||"").trim();if(!center&&cost>=0)center=String(matches[0][cost]||"").trim();}
    else if(!departmentValue)throw new Error("MAINTENANCE_DEPARTMENT_UNRESOLVED");
   }else if(!departmentValue)throw new Error("MAINTENANCE_DEPARTMENT_UNRESOLVED");
  }
 }
 if(!departmentValue)throw new Error("MAINTENANCE_DEPARTMENT_REQUIRED");
 const scoped=inventoryAssertDepartmentScope_(p,ss,actor,departmentValue);
 center=center||scoped.department.departmentName||scoped.department.departmentId;
 if(!center)throw new Error("MAINTENANCE_COST_CENTER_REQUIRED");
 return {departmentId:scoped.department.departmentId,departmentName:scoped.department.departmentName||scoped.department.departmentId,centroCosto:center,ubicacionOrigen:String(p.ubicacionOrigen||(existingRow&&existingRow[18])||"Bodega General").trim()};
}

// Restored monthly transport billing and service tariff engine.
function monthlyChargeHeaderMap_(headers, required) {
  const map = {};
  (headers || []).forEach((value, index) => { map[String(value || "").trim().toLowerCase()] = index; });
  required.forEach(name => { if (map[name.toLowerCase()] === undefined) throw new Error("MONTHLY_CHARGE_SCHEMA_INVALID:" + name); });
  return map;
}

function normalizeMonthlyChargeMonth_(value) {
  const raw = String(value == null ? "" : value).trim();
  const parts = raw.split(/[-/]/), numeric = parts[parts.length - 1];
  if (/^\d+$/.test(numeric) && (parts.length === 1 || (parts.length === 2 && parts[0].length === 4))) { const month = Number(numeric); if (month >= 1 && month <= 12) return String(month).padStart(2, "0"); }
  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\./g, "").trim();
  const months = { enero:1, ene:1, febrero:2, feb:2, marzo:3, mar:3, abril:4, abr:4, mayo:5, may:5, junio:6, jun:6, julio:7, jul:7, agosto:8, ago:8, septiembre:9, setiembre:9, sep:9, sept:9, octubre:10, oct:10, noviembre:11, nov:11, diciembre:12, dic:12 };
  if (!months[normalized]) throw new Error("MONTHLY_CHARGE_PERIOD_INVALID");
  return String(months[normalized]).padStart(2, "0");
}

function transportEnsureBillingSchema_(ss){
 const assignments=getOrCreateSheet(ss,"TransporteAsignaciones"),headers=["AsignacionTranspID","RutaID","EstudianteUserId","ParadaNombre","HorarioPlan","Estado","FechaAsignacion","Jornada","DiasSemanaJSON","Observaciones","FechaInicioServicio","FechaFinServicio","ModalidadServicio","FechaCancelacion","TarifaMensualAplicada","ConceptoTransporteID"],a=assignments.getDataRange().getValues();
 if(!a.length)throw new Error("TRANSPORT_ASSIGNMENT_SCHEMA_INVALID");
 headers.forEach((h,i)=>{const v=String(a[0][i]||"").trim();if(v&&v!==h)throw new Error("TRANSPORT_ASSIGNMENT_SCHEMA_CONFLICT:"+v);if(!v)assignments.getRange(1,i+1).setValue(h);});
 const tariffs=getOrCreateSheet(ss,"TransporteTarifas"),th=["TarifaID","RutaID","Modalidad","ConceptoID","MontoMensual","FechaVigenciaInicio","FechaVigenciaFin","Estado","ActualizadoPor","FechaActualizacion"],t=tariffs.getDataRange().getValues();
 if(!t.length||!t[0].some(v=>String(v||"").trim()))tariffs.getRange(1,1,1,th.length).setValues([th]);else if(th.some((h,i)=>String(t[0][i]||"").trim()!==h))throw new Error("TRANSPORT_TARIFF_SCHEMA_CONFLICT");
 const concepts=getOrCreateSheet(ss,"ConceptosCobro"),charges=getOrCreateSheet(ss,"CargosEstudiante"),serviceTariffs=serviceEnsureTariffsSheet_(ss),ch=charges.getDataRange().getValues()[0]||[];
 monthlyChargeHeaderMap_(ch,["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento","Observaciones","ClaveUnicaDedupe"]);
 return {assignments:assignments,tariffs:tariffs,concepts:concepts,serviceTariffs:serviceTariffs,charges:charges};
}

function transportBillingActor_(p){const actor=getVerifiedAccountingIdentity_(p||{});if(!actor||actor.authorized!==true)throw new Error(actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED");const role=String(actor.role||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(["ADMINISTRADOR","DIRECTOR","SUBDIRECTOR","CONTADOR"].indexOf(role)===-1)throw new Error("TRANSPORT_BILLING_ROLE_NOT_ALLOWED");return actor;}

function transportNormalizeMode_(v){const s=String(v||"COMPLETA").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z]/g,"");if(["COMPLETA","IDAIVUELTA","FULL","FULLROUNDTRIP"].indexOf(s)!==-1)return "COMPLETA";if(["MEDIA","MEDIATARIFA","HALF","IDA","VUELTA"].indexOf(s)!==-1)return "MEDIA";throw new Error("TRANSPORT_BILLING_MODE_INVALID");}

function transportParseDate_(v){if(v===undefined||v===null||v==="")return null;let d;if(v instanceof Date){if(!Number.isFinite(v.getTime()))return null;d=v;}else{const s=String(v).trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);d=m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):new Date(s);}return Number.isFinite(d.getTime())?new Date(d.getFullYear(),d.getMonth(),d.getDate()):null;}

function transportMonthWindow_(y,m){const year=Number(y),month=Number(normalizeMonthlyChargeMonth_(m));if(!Number.isInteger(year)||year<2000||year>2200)throw new Error("TRANSPORT_BILLING_YEAR_INVALID");const start=new Date(year,month-1,1),end=new Date(year,month,0);return {year:String(year),month:String(month).padStart(2,"0"),start:start,end:end,days:end.getDate(),dueDate:year+"-"+String(month).padStart(2,"0")+"-"+String(end.getDate()).padStart(2,"0")};}

function transportActiveDays_(start,end,w){const a=transportParseDate_(start),b=transportParseDate_(end)||w.end;if(!a||!b)return 0;const from=Math.max(Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()),Date.UTC(w.start.getFullYear(),w.start.getMonth(),w.start.getDate())),to=Math.min(Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()),Date.UTC(w.end.getFullYear(),w.end.getMonth(),w.end.getDate()));return to<from?0:Math.floor((to-from)/86400000)+1;}

function transportEnsureConcept_(ss){const sh=getOrCreateSheet(ss,"ConceptosCobro"),data=sh.getDataRange().getValues(),matches=data.slice(1).filter(r=>String(r[2]||"").trim().toLowerCase()==="transporte escolar");if(matches.length>1)throw new Error("TRANSPORT_BILLING_CONCEPT_AMBIGUOUS");if(matches.length){if(String(matches[0][6]||"Activo").toLowerCase()!=="activo")throw new Error("TRANSPORT_BILLING_CONCEPT_INACTIVE");return {id:String(matches[0][0]),name:String(matches[0][2])};}const row=new Array(Math.max(8,(data[0]||[]).length)).fill("");row[0]="CPT-TRN-SCHOOL";row[1]=new Date();row[2]="Transporte escolar";row[3]=0;row[4]="Todos";row[5]="Mensual";row[6]="Activo";row[7]="Concepto base; importe definido por ruta y modalidad.";if(row.length>=13){row[8]="Exento";row[9]=0;row[10]="EDUC-01";row[11]=new Date().toISOString().slice(0,10);row[12]="FALSE";}sh.appendRow(row);return {id:row[0],name:row[2]};}

function serviceEnsureTariffsSheet_(ss){
 const sh=getOrCreateSheet(ss,"ServiciosTarifas"),headers=["TarifaServicioID","Servicio","Modalidad","RutaID","Periodo","Monto","FechaVigenciaInicio","FechaVigenciaFin","DescuentoHermanosPct","DescuentoMaximoPct","ProrrateoAlta","ProrrateoBaja","ConceptoID","Estado","ActualizadoPor","FechaActualizacion"],data=sh.getDataRange().getValues();
 if(!data.length||!data[0].some(v=>String(v||"").trim()))sh.getRange(1,1,1,headers.length).setValues([headers]);else if(headers.some((h,i)=>String(data[0][i]||"").trim()!==h))throw new Error("SERVICE_TARIFF_SCHEMA_CONFLICT");
 return sh;
}

function serviceEnsureConcept_(ss,service){
 if(String(service).toUpperCase()==="TRANSPORTE")return transportEnsureConcept_(ss);
 const sh=getOrCreateSheet(ss,"ConceptosCobro"),rows=sh.getDataRange().getValues(),name="Servicio: "+String(service).trim(),matches=rows.slice(1).filter(r=>String(r[2]||"").trim().toLowerCase()===name.toLowerCase());
 if(matches.length>1)throw new Error("SERVICE_CONCEPT_AMBIGUOUS:"+service);
 if(matches.length){if(String(matches[0][6]||"Activo").toLowerCase()!=="activo")throw new Error("SERVICE_CONCEPT_INACTIVE:"+service);return {id:String(matches[0][0]),name:String(matches[0][2])};}
 const row=new Array(Math.max(8,(rows[0]||[]).length)).fill("");row[0]="CPT-SVC-"+Utilities.getUuid();row[1]=new Date();row[2]=name;row[3]=0;row[4]="Todos";row[5]="Mensual";row[6]="Activo";row[7]="Concepto base para tarifas del catálogo de servicios.";sh.appendRow(row);return {id:row[0],name:name};
}

function serviceNormalizePeriod_(value){const p=String(value||"MENSUAL").trim().toUpperCase();if(["MENSUAL","DIARIO","ANUAL","EVENTO","POR_PERIODO"].indexOf(p)===-1)throw new Error("SERVICE_TARIFF_PERIOD_INVALID");return p;}

function manageServiceTariffLocked_(ss,p,actor){
 const service=String(p.servicio||"").trim().toUpperCase(),mode=service==="TRANSPORTE"?transportNormalizeMode_(p.modalidadServicio||p.modalidad):String(p.modalidad||"GENERAL").trim().toUpperCase(),routeId=String(p.rutaId||"").trim(),period=serviceNormalizePeriod_(p.periodo),amount=Number(p.monto),start=transportParseDate_(p.fechaVigenciaInicio)||transportParseDate_(new Date()),end=transportParseDate_(p.fechaVigenciaFin),siblingPct=Number(p.descuentoHermanosPct||0),maxPct=Number(p.descuentoMaximoPct===undefined?100:p.descuentoMaximoPct),prorateStart=p.prorrateoAlta!==false&&String(p.prorrateoAlta).toLowerCase()!=="false",prorateEnd=p.prorrateoBaja!==false&&String(p.prorrateoBaja).toLowerCase()!=="false";
 if(!service||service.length>80||!Number.isFinite(amount)||amount<=0||!Number.isFinite(siblingPct)||siblingPct<0||siblingPct>100||!Number.isFinite(maxPct)||maxPct<0||maxPct>100)throw new Error("SERVICE_TARIFF_INPUT_INVALID");
 if(service==="TRANSPORTE"&&!routeId)throw new Error("SERVICE_TARIFF_ROUTE_REQUIRED");
 if(p.fechaVigenciaInicio&&!transportParseDate_(p.fechaVigenciaInicio))throw new Error("SERVICE_TARIFF_START_DATE_INVALID");
 if(p.fechaVigenciaFin&&!end)throw new Error("SERVICE_TARIFF_END_DATE_INVALID");
 if(end&&end.getTime()<start.getTime())throw new Error("SERVICE_TARIFF_DATE_RANGE_INVALID");
 if(p.conceptoId){const concepts=getOrCreateSheet(ss,"ConceptosCobro").getDataRange().getValues().slice(1);if(!concepts.some(r=>String(r[0])===String(p.conceptoId)&&String(r[6]||"Activo").toLowerCase()==="activo"))throw new Error("SERVICE_TARIFF_CONCEPT_NOT_FOUND");}
 const concept=p.conceptoId?{id:String(p.conceptoId)}:serviceEnsureConcept_(ss,service),sh=serviceEnsureTariffsSheet_(ss),rows=sh.getDataRange().getValues(),all=rows.slice(1).map((r,i)=>({r:r,n:i+2,from:transportParseDate_(r[6]),to:transportParseDate_(r[7])})).filter(x=>String(x.r[1]).toUpperCase()===service&&String(x.r[2]).toUpperCase()===mode&&String(x.r[3]||"")===routeId&&String(x.r[4]).toUpperCase()===period&&String(x.r[13]).toLowerCase()==="activo");
 const same=all.filter(x=>x.from&&x.from.getTime()===start.getTime());if(same.length>1)throw new Error("SERVICE_TARIFF_AMBIGUOUS");
 const values=[same.length?same[0].r[0]:"SVT-"+Utilities.getUuid(),service,mode,routeId,period,Math.round(amount*100)/100,start,end||"",siblingPct,maxPct,prorateStart,prorateEnd,concept.id,"Activo",actor.userId,new Date()];
 if(same.length){
  const futureVersions=all.filter(x=>x.from&&x.from>start).sort((a,b)=>a.from-b.from);
  if(futureVersions.length){
   const nextStart=futureVersions[0].from;
   const latestAllowedEnd=new Date(nextStart.getFullYear(),nextStart.getMonth(),nextStart.getDate()-1);
   const requestedEnd=transportParseDate_(values[7]);
   if(!requestedEnd||requestedEnd>latestAllowedEnd)values[7]=latestAllowedEnd;
  }else if(!end)values[7]=same[0].r[7]||"";
  if(values[7]&&transportParseDate_(values[7])<start)throw new Error("SERVICE_TARIFF_DATE_RANGE_INVALID");
  sh.getRange(same[0].n,1,1,values.length).setValues([values]);
  return {status:"success",tarifaServicioId:values[0],servicio:service,modalidad:mode,rutaId:routeId,periodo:period,monto:values[5],conceptoId:concept.id,message:"Tarifa de servicio actualizada."};
 }
 const future=all.filter(x=>x.from&&x.from>start&&(!x.to||x.to>=start)).sort((a,b)=>a.from-b.from),previous=all.filter(x=>x.from&&x.from<start&&(!x.to||x.to>=start));
 previous.forEach(x=>sh.getRange(x.n,8).setValue(new Date(start.getFullYear(),start.getMonth(),start.getDate()-1)));
 if(future.length){const next=future[0].from,dayBefore=new Date(next.getFullYear(),next.getMonth(),next.getDate()-1);if(!values[7]||dayBefore<values[7])values[7]=dayBefore;}
 if(values[7]&&transportParseDate_(values[7])<start)throw new Error("SERVICE_TARIFF_DATE_RANGE_INVALID");
 sh.appendRow(values);return {status:"success",tarifaServicioId:values[0],servicio:service,modalidad:mode,rutaId:routeId,periodo:period,monto:values[5],conceptoId:concept.id,message:"Tarifa de servicio registrada con vigencia."};
}

function manageServiceTariff(payload){
 const p=payload||{},lock=LockService.getScriptLock();lock.waitLock(15000);try{const actor=transportBillingActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=serviceEnsureTariffsSheet_(ss),snapshot=sh.getDataRange().getValues().map(r=>r.slice());try{return manageServiceTariffLocked_(ss,p,actor);}catch(e){if(snapshot.length)sh.getRange(1,1,snapshot.length,snapshot[0].length).setValues(snapshot);while(sh.getLastRow()>snapshot.length)sh.deleteRow(sh.getLastRow());throw e;}}finally{lock.releaseLock();}
}

function getServiceTariffs(payload){
 const p=payload||{},lock=LockService.getScriptLock();lock.waitLock(15000);try{transportBillingActor_(p);const sh=serviceEnsureTariffsSheet_(SpreadsheetApp.openById(SPREADSHEET_ID)),rows=sh.getDataRange().getValues().slice(1).filter(r=>(!p.servicio||String(r[1]).toUpperCase()===String(p.servicio).toUpperCase())&&(!p.rutaId||String(r[3])===String(p.rutaId))&&(!p.estado||String(r[13]).toLowerCase()===String(p.estado).toLowerCase()));return {status:"success",tarifas:rows.map(r=>({tarifaServicioId:r[0],servicio:r[1],modalidad:r[2],rutaId:r[3],periodo:r[4],monto:Number(r[5]||0),fechaVigenciaInicio:r[6],fechaVigenciaFin:r[7],descuentoHermanosPct:Number(r[8]||0),descuentoMaximoPct:Number(r[9]===undefined?100:r[9]),prorrateoAlta:r[10]!==false&&String(r[10]).toLowerCase()!=="false",prorrateoBaja:r[11]!==false&&String(r[11]).toLowerCase()!=="false",conceptoId:r[12],estado:r[13]}))};}finally{lock.releaseLock();}
}

function serviceStudentGuardianIds_(ss,userId){
 const users=ss.getSheetByName("Usuarios"),relations=ss.getSheetByName("RelacionesFamiliares");if(!users||!relations)return [];
 const u=users.getDataRange().getValues().slice(1).find(r=>String(r[0]||"").trim()===String(userId).trim()),person=u?String(u[9]||"").trim():"";if(!person)return [];
 const rows=relations.getDataRange().getValues().slice(1),now=new Date(),active=r=>{const state=String(r[4]||"").trim().toLowerCase(),from=transportParseDate_(r[5]),to=transportParseDate_(r[6]);return ["aprobado","autorizado","activo","active"].indexOf(state)!==-1&&(!from||from<=now)&&(!to||to>=now);};
 return [...new Set(rows.filter(r=>String(r[1]||"").trim()===person&&active(r)).map(r=>String(r[2]||"").trim()).filter(Boolean))];
}

function serviceSiblingCount_(ss,userId){
 const users=ss.getSheetByName("Usuarios"),relations=ss.getSheetByName("RelacionesFamiliares");if(!users||!relations)return 0;
 const userRows=users.getDataRange().getValues().slice(1),own=userRows.find(r=>String(r[0]||"").trim()===String(userId).trim()),person=own?String(own[9]||"").trim():"";if(!person)return 0;
 const guardians=new Set(serviceStudentGuardianIds_(ss,userId));if(!guardians.size)return 0;
 const rows=relations.getDataRange().getValues().slice(1),now=new Date(),active=r=>{const state=String(r[4]||"").trim().toLowerCase(),from=transportParseDate_(r[5]),to=transportParseDate_(r[6]);return ["aprobado","autorizado","activo","active"].indexOf(state)!==-1&&(!from||from<=now)&&(!to||to>=now);};
 const persons=new Set(rows.filter(r=>guardians.has(String(r[2]||"").trim())&&active(r)).map(r=>String(r[1]||"").trim()).filter(x=>x&&x!==person));
 return new Set(userRows.filter(r=>persons.has(String(r[9]||"").trim())&&["estudiante","student","alumno"].indexOf(String(r[6]||"").trim().toLowerCase())!==-1&&String(r[10]||"Activo").toLowerCase()!=="inactivo").map(r=>String(r[9]||"").trim())).size;
}

function serviceApprovedScholarshipDiscount_(ss,userId,concept,base){
 const requests=getOrCreateSheet(ss,"SolicitudesDescuentoBeca").getDataRange().getValues().slice(1),rules=getOrCreateSheet(ss,"DescuentosBecas").getDataRange().getValues().slice(1),map=Object.create(null);rules.forEach(r=>map[String(r[0]||"").trim()]=r);
 const guardians=new Set(serviceStudentGuardianIds_(ss,userId)),eligible=requests.filter(r=>{if(String(r[8]||"").toLowerCase()!=="aprobado")return false;const target=String(r[4]||"").trim(),type=String(r[3]||"").toLowerCase();return (["estudiante","student","alumno"].indexOf(type)!==-1&&target===String(userId))||(["familia","family","responsable","tutor"].indexOf(type)!==-1&&guardians.has(target));});
 let total=0,applied=[];
 for(let i=0;i<eligible.length;i++){const sol=eligible[i],rule=map[String(sol[2]||"").trim()];if(!rule)continue;const state=String(rule[12]||"Aprobado").toLowerCase();if(["aprobado","activo"].indexOf(state)===-1)continue;let applies=String(sol[5]||"").trim().toLowerCase()===String(concept||"").trim().toLowerCase();if(!applies&&rule[8]){try{const list=JSON.parse(rule[8]);applies=Array.isArray(list)&&list.some(x=>String(x).trim().toLowerCase()===String(concept||"").trim().toLowerCase());}catch(_){}}if(!applies)continue;const kind=String(rule[5]||"Porcentaje"),value=Number(rule[6]||0),max=Number(rule[7]||0);let amount=kind==="Porcentaje"?base*value/100:value;if(!Number.isFinite(amount)||amount<=0)continue;if(max>0)amount=Math.min(amount,max);amount=Math.min(base-total,amount);total+=amount;applied.push(String(rule[2]||rule[0]));if(rule[10]!==true&&String(rule[10]).toLowerCase()!=="true")break;}
 return {amount:Math.round(total*100)/100,rules:applied};
}

function serviceCalculateDiscounts_(ss,userId,concept,base,tariff){
 const amount=Math.max(0,Number(base)||0),siblings=serviceSiblingCount_(ss,userId),siblingPct=Math.max(0,Math.min(100,Number(tariff&&tariff.descuentoHermanosPct)||0)),siblingDiscount=siblings>0?Math.round(amount*siblingPct)/100:0,scholarship=serviceApprovedScholarshipDiscount_(ss,userId,concept,amount),maxValue=!tariff||tariff.descuentoMaximoPct===undefined?100:tariff.descuentoMaximoPct,maxPct=Math.max(0,Math.min(100,Number(maxValue)||0)),cap=Math.round(amount*maxPct)/100,total=Math.min(amount,cap,Math.round((siblingDiscount+scholarship.amount)*100)/100);
 return {hermanos:siblings,descuentoHermanos:Math.min(siblingDiscount,total),descuentoBeca:Math.max(0,total-Math.min(siblingDiscount,total)),descuentoTotal:total,montoFinal:Math.max(0,Math.round((amount-total)*100)/100),reglasBeca:scholarship.rules};
}

function transportFindTariff_(ss,routeId,mode,date){
 const s=transportEnsureBillingSchema_(ss),d=transportParseDate_(date)||new Date(),m=transportNormalizeMode_(mode),rows=s.serviceTariffs.getDataRange().getValues().slice(1),central=rows.filter(r=>String(r[1]).toUpperCase()==="TRANSPORTE"&&String(r[2]).toUpperCase()===m&&String(r[3]||"")===String(routeId)&&String(r[4]).toUpperCase()==="MENSUAL"&&String(r[13]).toLowerCase()==="activo"&&(!transportParseDate_(r[6])||transportParseDate_(r[6])<=d)&&(!transportParseDate_(r[7])||transportParseDate_(r[7])>=d));
 if(central.length>1)throw new Error("TRANSPORT_TARIFF_AMBIGUOUS:"+routeId+":"+m);
 if(central.length){const r=central[0],amount=Number(r[5]);if(!Number.isFinite(amount)||amount<=0)throw new Error("TRANSPORT_TARIFF_AMOUNT_INVALID");return {id:String(r[0]),conceptId:String(r[12]),amount:Math.round(amount*100)/100,mode:m,validFrom:transportParseDate_(r[6]),validTo:transportParseDate_(r[7]),descuentoHermanosPct:Number(r[8]||0),descuentoMaximoPct:Number(r[9]===undefined?100:r[9]),prorrateoAlta:r[10]!==false&&String(r[10]).toLowerCase()!=="false",prorrateoBaja:r[11]!==false&&String(r[11]).toLowerCase()!=="false"};}
 const rowsLegacy=s.tariffs.getDataRange().getValues().slice(1),legacy=rowsLegacy.filter(r=>String(r[1]||"").trim()===String(routeId).trim()&&String(r[2]||"")===m&&String(r[7]||"").toLowerCase()==="activo"&&(!transportParseDate_(r[5])||transportParseDate_(r[5])<=d)&&(!transportParseDate_(r[6])||transportParseDate_(r[6])>=d));
 if(legacy.length>1)throw new Error("TRANSPORT_TARIFF_AMBIGUOUS:"+routeId+":"+m);if(!legacy.length)return null;const r=legacy[0],amount=Number(r[4]);if(!Number.isFinite(amount)||amount<=0)throw new Error("TRANSPORT_TARIFF_AMOUNT_INVALID");return {id:String(r[0]),conceptId:String(r[3]),amount:Math.round(amount*100)/100,mode:m,validFrom:transportParseDate_(r[5]),validTo:transportParseDate_(r[6]),descuentoHermanosPct:0,descuentoMaximoPct:100,prorrateoAlta:true,prorrateoBaja:true};
}

function manageTransportTariff(payload){
 const p=payload||{},routeId=String(p.rutaId||"").trim(),mode=transportNormalizeMode_(p.modalidadServicio||p.modalidad),amount=Number(p.montoMensual),effective=transportParseDate_(p.fechaVigenciaInicio)||transportParseDate_(new Date());
 if(p.fechaVigenciaInicio&&!transportParseDate_(p.fechaVigenciaInicio))throw new Error("TRANSPORT_TARIFF_DATE_INVALID");
 if(!routeId||!Number.isFinite(amount)||amount<=0)throw new Error("TRANSPORT_TARIFF_INPUT_INVALID");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{const actor=transportBillingActor_(p),ss=SpreadsheetApp.openById(SPREADSHEET_ID),route=getOrCreateSheet(ss,"TransporteRutas").getDataRange().getValues().slice(1).find(r=>String(r[0]||"").trim()===routeId);if(!route)throw new Error("ROUTE_NOT_FOUND");
  const result=manageServiceTariffLocked_(ss,{servicio:"TRANSPORTE",modalidadServicio:mode,rutaId:routeId,periodo:"MENSUAL",monto:amount,fechaVigenciaInicio:effective,descuentoHermanosPct:p.descuentoHermanosPct||0,descuentoMaximoPct:p.descuentoMaximoPct===undefined?100:p.descuentoMaximoPct,prorrateoAlta:p.prorrateoAlta!==false,prorrateoBaja:p.prorrateoBaja!==false},actor);
  const schema=transportEnsureBillingSchema_(ss),rows=schema.tariffs.getDataRange().getValues(),same=rows.slice(1).map((r,i)=>({r:r,n:i+2})).filter(x=>String(x.r[1])===routeId&&String(x.r[2])===mode&&transportParseDate_(x.r[5])&&transportParseDate_(x.r[5]).getTime()===effective.getTime());
  if(!same.length)schema.tariffs.appendRow(["TRN-TAR-"+Utilities.getUuid(),routeId,mode,result.conceptoId||"CPT-TRN-SCHOOL",Math.round(amount*100)/100,effective,"","Activo",actor.userId,new Date()]);
  return {status:"success",tarifaId:result.tarifaServicioId,rutaId:routeId,modalidad:mode,montoMensual:amount,conceptoId:result.conceptoId};
 }finally{lock.releaseLock();}
}

function transportRecalculateStudentMonthlyChargeLocked_(ss,studentId,year,month){
 const s=transportEnsureBillingSchema_(ss),w=transportMonthWindow_(year,month),assignments=s.assignments.getDataRange().getValues().slice(1),student=String(studentId||"").trim(),applicable=assignments.filter(r=>String(r[2]||"").trim()===student&&["active","activa","cancelled","cancelada"].indexOf(String(r[5]||"").toLowerCase())!==-1),details=[];let target=0,missing=0,siblingPct=0,maxDiscountPct=100;
 applicable.forEach(r=>{const start=transportParseDate_(r[10]||r[6]),end=transportParseDate_(r[11]||r[13])||w.end;if(!start)return;const from=start>w.start?start:w.start,to=end<w.end?end:w.end;if(to<from)return;const route=String(r[1]||"").trim(),mode=transportNormalizeMode_(r[12]||"COMPLETA");let cursor=from,assignmentAmount=0,guard=0,firstTariff=null,lastTariff=null,firstSegmentAmount=0,lastSegmentAmount=0,segments=0;while(cursor<=to&&guard++<12){const tariff=transportFindTariff_(ss,route,mode,cursor);if(!tariff){missing++;return;}if(!firstTariff)firstTariff=tariff;lastTariff=tariff;siblingPct=Math.max(siblingPct,Number(tariff.descuentoHermanosPct||0));maxDiscountPct=Math.min(maxDiscountPct,Number(tariff.descuentoMaximoPct===undefined?100:tariff.descuentoMaximoPct));const segmentEnd=tariff.validTo&&tariff.validTo<to?tariff.validTo:to,days=transportActiveDays_(cursor,segmentEnd,w);if(days<=0){missing++;return;}const segmentAmount=Math.round(tariff.amount*days/w.days*100)/100;if(segments===0)firstSegmentAmount=segmentAmount;lastSegmentAmount=segmentAmount;segments++;assignmentAmount+=segmentAmount;details.push(route+"/"+mode+" "+days+"/"+w.days+" días @ "+tariff.amount);cursor=new Date(segmentEnd.getFullYear(),segmentEnd.getMonth(),segmentEnd.getDate()+1);}if(cursor<=to){missing++;return;}if(start>w.start&&firstTariff&&!firstTariff.prorrateoAlta)assignmentAmount+=firstTariff.amount-firstSegmentAmount;if(end<w.end&&lastTariff&&!lastTariff.prorrateoBaja&&!(segments===1&&start>w.start&&firstTariff&&!firstTariff.prorrateoAlta))assignmentAmount+=lastTariff.amount-lastSegmentAmount;target+=assignmentAmount;});
 if(missing)return {status:"warning",missingTariff:missing,importeObjetivo:Math.round(target*100)/100};
 const base=Math.round(target*100)/100,discount=serviceCalculateDiscounts_(ss,student,"Transporte escolar",base,{descuentoHermanosPct:siblingPct,descuentoMaximoPct:maxDiscountPct});target=discount.montoFinal;const discountAmount=discount.descuentoTotal;const data=s.charges.getDataRange().getValues(),h=monthlyChargeHeaderMap_(data[0],["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento","Observaciones","ClaveUnicaDedupe"]),key="TRN-"+w.month+"-"+w.year+"-"+student,adjKey=key+"-AJUSTE",main=data.slice(1).map((r,i)=>({r:r,n:i+2})).filter(x=>String(x.r[h.claveunicadedupe]||"")===key),adj=data.slice(1).map((r,i)=>({r:r,n:i+2})).filter(x=>{const k=String(x.r[h.claveunicadedupe]||"");return k===adjKey||k.indexOf(adjKey+"-")===0;});if(main.length>1)throw new Error("TRANSPORT_CHARGE_DEDUPE_AMBIGUOUS:"+key);
 const mainAmount=main.length?Number(main[0].r[h.montofinal]||0):0,adjAmount=adj.reduce((sum,x)=>{const state=String(x.r[h.estado]||"").toLowerCase();return ["anulado","cancelado","voided"].indexOf(state)!==-1?sum:sum+Number(x.r[h.montofinal]||0);},0),pendingAdj=adj.filter(x=>["pagado","paid","anulado","cancelado","voided"].indexOf(String(x.r[h.estado]||"").toLowerCase())===-1);if(pendingAdj.length>1)throw new Error("TRANSPORT_CHARGE_ADJUSTMENT_AMBIGUOUS:"+key);
 if(!main.length&&target>0){const row=new Array(data[0].length).fill("");row[h.cargoid]="TRN-CARGO-"+w.year+w.month+"-"+Utilities.getUuid();row[h.fecha]=new Date();row[h.userid]=student;row[h.concepto]="Transporte escolar";row[h.montobase]=base;row[h.descuento]=discountAmount;row[h.montofinal]=target;row[h.estado]="Pendiente";row[h.fechavencimiento]=w.dueDate;row[h.observaciones]="Cargo mensual de transporte; "+details.join("; ")+"; hermanos="+discount.hermanos+"; descuento="+discountAmount.toFixed(2);row[h.claveunicadedupe]=key;const bi=data[0].findIndex(v=>String(v||"").toLowerCase()==="batchid");if(bi>=0)row[bi]="TRN-"+w.year+w.month;s.charges.appendRow(row);return {status:"success",created:true,importe:target,clave:key};}
 if(!main.length)return {status:"success",created:false,importe:0,clave:key};
 const delta=Math.round((target-mainAmount-adjAmount)*100)/100;if(Math.abs(delta)<0.01)return {status:"success",created:false,adjusted:false,importe:target,clave:key};
 const width=data[0].length;if(pendingAdj.length){const r=pendingAdj[0].r.slice();r[h.montobase]=0;r[h.descuento]=0;r[h.montofinal]=delta;r[h.estado]="Pendiente";r[h.observaciones]="Ajuste de prorrateo de transporte; importe objetivo "+target.toFixed(2)+". "+details.join("; ");s.charges.getRange(pendingAdj[0].n,1,1,width).setValues([r]);return {status:"success",adjusted:true,diferencia:delta,importe:target,clave:key};}
 const row=new Array(width).fill("");row[h.cargoid]="TRN-AJUSTE-"+w.year+w.month+"-"+Utilities.getUuid();row[h.fecha]=new Date();row[h.userid]=student;row[h.concepto]="Ajuste prorrateo transporte escolar";row[h.montobase]=0;row[h.descuento]=0;row[h.montofinal]=delta;row[h.estado]="Pendiente";row[h.fechavencimiento]=w.dueDate;row[h.observaciones]="Ajuste de prorrateo; importe objetivo "+target.toFixed(2)+". "+details.join("; ");row[h.claveunicadedupe]=adj.length?adjKey+"-"+Utilities.getUuid():adjKey;s.charges.appendRow(row);return {status:"success",adjusted:true,diferencia:delta,importe:target,clave:key};
}

function generateTransportMonthlyCharges(payload){
 const p=payload||{},year=p.ano||p.anoLectivo,month=normalizeMonthlyChargeMonth_(p.mesPeriodo||p.mes),lock=LockService.getScriptLock();if(!lock.tryLock(30000))return {status:"error",code:"LOCK_TIMEOUT"};try{transportBillingActor_(p);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),s=transportEnsureBillingSchema_(ss),rows=s.assignments.getDataRange().getValues().slice(1),students=[...new Set(rows.map(r=>String(r[2]||"").trim()).filter(Boolean))],snapshot=s.charges.getDataRange().getValues().map(r=>r.slice());let created=0,adjusted=0,missing=0,total=0;try{students.forEach(id=>{const r=transportRecalculateStudentMonthlyChargeLocked_(ss,id,year,month);if(r.missingTariff){missing+=r.missingTariff;return;}if(r.created)created++;if(r.adjusted)adjusted++;total+=Number(r.importe||0);});}catch(e){if(snapshot.length)s.charges.getRange(1,1,snapshot.length,snapshot[0].length).setValues(snapshot);while(s.charges.getLastRow()>snapshot.length)s.charges.deleteRow(s.charges.getLastRow());throw e;}return {status:missing?"warning":"success",ano:String(year),mesPeriodo:month,estudiantes:students.length,cargosCreados:created,ajustesCreados:adjusted,sinTarifa:missing,totalImporte:Math.round(total*100)/100};}finally{lock.releaseLock();}
}

function cancelStudentTransportAssignment(payload){
 const p=payload||{},id=String(p.asignacionTranspId||p.assignmentId||"").trim();if(!id)throw new Error("TRANSPORT_ASSIGNMENT_ID_REQUIRED");const lock=LockService.getScriptLock();lock.waitLock(15000);try{transportBillingActor_(p);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),s=transportEnsureBillingSchema_(ss),data=s.assignments.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&String(r[0]||"").trim()===id);if(idx<0)throw new Error("TRANSPORT_ASSIGNMENT_NOT_FOUND");const original=data[idx].slice(),state=String(original[5]||"").toLowerCase();if(["cancelled","cancelada"].indexOf(state)!==-1)return {status:"success",idempotent:true,asignacionTranspId:id};if(state!=="active"&&state!=="activa")throw new Error("TRANSPORT_ASSIGNMENT_NOT_ACTIVE");const date=transportParseDate_(p.fechaCancelacion)||new Date(),start=transportParseDate_(original[10]||original[6]);if(p.fechaCancelacion&&!transportParseDate_(p.fechaCancelacion))throw new Error("TRANSPORT_CANCELLATION_DATE_INVALID");if(start&&date<start)throw new Error("TRANSPORT_CANCELLATION_BEFORE_START");const chargeSnapshot=s.charges.getDataRange().getValues().map(r=>r.slice());try{const updated=original.slice();updated[5]="cancelled";updated[11]=date;updated[13]=date;s.assignments.getRange(idx+1,1,1,updated.length).setValues([updated]);const billing=transportRecalculateStudentMonthlyChargeLocked_(ss,String(original[2]),date.getFullYear(),date.getMonth()+1);return {status:billing.missingTariff?"warning":"success",asignacionTranspId:id,fechaCancelacion:date.toISOString(),facturacion:billing};}catch(e){s.assignments.getRange(idx+1,1,1,original.length).setValues([original]);if(chargeSnapshot.length)s.charges.getRange(1,1,chargeSnapshot.length,chargeSnapshot[0].length).setValues(chargeSnapshot);while(s.charges.getLastRow()>chargeSnapshot.length)s.charges.deleteRow(s.charges.getLastRow());throw e;}}finally{lock.releaseLock();}
}

function assignStudentTransport(payload) {
  const { rutaId, estudianteUserId, paradaNombre, horarioPlan, jornada, diasSemanaJSON, observaciones, modalidadServicio, fechaInicioServicio } = payload || {};
  if (!rutaId || !estudianteUserId) throw new Error("rutaId y estudianteUserId son requeridos.");

  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(15000);
  if (!hasLock) {
    return {
      status: "error",
      code: "LOCK_TIMEOUT",
      message: "Operación de asignación de transporte bloqueada por concurrencia. Por favor reintente."
    };
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    getOrCreateTransportVehiclesCatalog(ss);
    const billingSchema=transportEnsureBillingSchema_(ss);

    const rutaSheet = getOrCreateSheet(ss, "TransporteRutas");
    const asgnSheet = getOrCreateSheet(ss, "TransporteAsignaciones");
    const vehSheet = getOrCreateSheet(ss, "TransporteVehiculos");

    const rutasData = rutaSheet.getDataRange().getValues().slice(1);
    const targetRuta = rutasData.find(r => String(r[0]).trim() === String(rutaId).trim());
    if (!targetRuta) {
      return { status: "error", code: "ROUTE_NOT_FOUND", message: `Ruta de transporte '${rutaId}' no encontrada.` };
    }

    const unidadCod = String(targetRuta[2]).trim();
    const vehRows = vehSheet.getDataRange().getValues().slice(1);
    const targetVeh = vehRows.find(v => String(v[1]).trim() === unidadCod);
    const capAutorizada = targetVeh ? parseInt(targetVeh[5] || 0, 10) : parseInt(targetRuta[4] || 25, 10);

    const asgnData = asgnSheet.getDataRange().getValues().slice(1);

    // 1. Validar duplicidad de asignación para la misma ruta, estudiante y jornada [TASK-029]
    const targetJornada = String(jornada || targetRuta[10] || "Matutina").toLowerCase().trim();
    const isDuplicate = asgnData.some(r =>
      String(r[2]).trim() === String(estudianteUserId).trim() &&
      String(r[1]).trim() === String(rutaId).trim() &&
      String(r[5] || "").toLowerCase().trim() === "active" &&
      String(r[7] || targetJornada).toLowerCase().trim() === targetJornada
    );

    if (isDuplicate) {
      return {
        status: "error",
        code: "DUPLICATE_TRANSPORT_ASSIGNMENT",
        message: `El estudiante '${estudianteUserId}' ya cuenta con una asignación activa en la ruta '${rutaId}' para la jornada '${targetJornada}'.`
      };
    }

    // 2. Validar colisión de horarios entre rutas distintas [TASK-029]
    const horaIniTarget = String(targetRuta[8] || "06:30").trim();
    const hasTimeConflict = asgnData.some(a => {
      if (String(a[2]).trim() !== String(estudianteUserId).trim() || String(a[5] || "").toLowerCase().trim() !== "active") {
        return false;
      }
      const otherRuta = rutasData.find(r => String(r[0]).trim() === String(a[1]).trim());
      if (!otherRuta) return false;
      const otherHoraIni = String(otherRuta[8] || "06:30").trim();
      const otherJornada = String(otherRuta[10] || "Matutina").toLowerCase().trim();
      return otherHoraIni === horaIniTarget && otherJornada === targetJornada;
    });

    if (hasTimeConflict) {
      return {
        status: "error",
        code: "TRANSPORT_SCHEDULE_CONFLICT",
        message: `Conflicto de horario: El estudiante '${estudianteUserId}' ya está asignado a otra ruta activa en el mismo horario (${horaIniTarget}, jornada: ${targetJornada}).`
      };
    }

    // 3. Control estricto de cupos y aforo vehicular [TASK-029]
    const cuposOcupados = asgnData.filter(r =>
      String(r[1]).trim() === String(rutaId).trim() && String(r[5] || "").toLowerCase().trim() === "active"
    ).length;

    if (cuposOcupados >= capAutorizada) {
      return {
        status: "error",
        code: "TRANSPORT_CAPACITY_EXCEEDED",
        capacidadMaxima: capAutorizada,
        cuposOcupados: cuposOcupados,
        message: `Capacidad vehicular agotada en la ruta '${rutaId}'. Cupos autorizados: ${capAutorizada}, Cupos ocupados: ${cuposOcupados}. No es posible admitir sobrecupo.`
      };
    }

    const now = new Date(),serviceStart=transportParseDate_(fechaInicioServicio)||now,serviceMode=transportNormalizeMode_(modalidadServicio||"COMPLETA");
    if(fechaInicioServicio&&!transportParseDate_(fechaInicioServicio))throw new Error("TRANSPORT_SERVICE_START_INVALID");
    const asgnId = "TRN-" + now.getTime() + "-" + Utilities.getUuid().slice(0,8);
    const chargeSnapshot=billingSchema.charges.getDataRange().getValues().map(r=>r.slice()),assignmentStartRow=asgnSheet.getLastRow()+1;

    asgnSheet.appendRow([
      asgnId,
      String(rutaId).trim(),
      String(estudianteUserId).trim(),
      paradaNombre || "Parada Principal",
      horarioPlan || targetRuta[8] || "06:30 AM",
      "active",
      now.toISOString(),
      targetJornada,
      diasSemanaJSON ? (Array.isArray(diasSemanaJSON) ? JSON.stringify(diasSemanaJSON) : diasSemanaJSON) : "[\"Lun\",\"Mar\",\"Mie\",\"Jue\",\"Vie\"]",
      observaciones || "",
      serviceStart,
      "",
      serviceMode,
      "",
      "",
      ""
    ]);
    let billing={status:"success",created:false,missingTariff:0};
    try{billing=transportRecalculateStudentMonthlyChargeLocked_(ss,String(estudianteUserId).trim(),now.getFullYear(),now.getMonth()+1);}
    catch(billingError){asgnSheet.deleteRow(assignmentStartRow);const sh=billingSchema.charges;if(chargeSnapshot.length)sh.getRange(1,1,chargeSnapshot.length,chargeSnapshot[0].length).setValues(chargeSnapshot);while(sh.getLastRow()>chargeSnapshot.length)sh.deleteRow(sh.getLastRow());throw billingError;}

    logStructuredEvent(
      "TRANSPORT",
      "assignStudentTransport",
      "INFO",
      "TRANSPORT_ASSIGNMENT_CREATED",
      `Asignación de transporte creada para estudiante ${estudianteUserId} en ruta ${rutaId}`,
      { asignacionTranspId: asgnId, rutaId, estudianteUserId, capAutorizada, cuposOcupadosDespues: cuposOcupados + 1 },
      (payload && payload.authUserId) || "System"
    );

    return {
      status: "success",
      asignacionTranspId: asgnId,
      rutaId: rutaId,
      cuposRestantes: capAutorizada - (cuposOcupados + 1),
      facturacion:billing,
      billingStatus:billing.missingTariff?"PENDIENTE_TARIFA":"PROCESADA",
      message: billing.missingTariff?"Estudiante asignado; configure la tarifa para generar el cargo.":"Estudiante asignado y cargo mensual sincronizado."
    };
  } finally {
    lock.releaseLock();
  }
}

// [TASK-030] [F21-Task02] Protección de datos de transporte y aislamiento de consultas RBAC/ABAC

function getOrCreateTransportVehiclesCatalog() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, "TransporteVehiculos");
  var headers = ["VehiculoID","CodigoUnidad","Marca","Modelo","Placa","Capacidad","Estado"];
  var data = sheet.getDataRange().getValues();
  if (!data.length) sheet.appendRow(headers);
  else if (JSON.stringify(data[0].map(function(v){return String(v||"").trim();})) !== JSON.stringify(headers)) {
    throw new Error("TRANSPORT_VEHICLE_SCHEMA_INVALID");
  }
  return sheet;
}

// Approval-gated route optimization proposals.
function transportOptimizationActor_(payload){
 const actor=getVerifiedAccountingIdentity_(payload||{});if(!actor||actor.authorized!==true)throw new Error(actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED");
 const role=String(actor.role||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
 if(["ADMINISTRADOR","DIRECTOR","SUBDIRECTOR"].indexOf(role)===-1)throw new Error("ROUTE_OPTIMIZATION_ROLE_NOT_ALLOWED");
 return actor;
}

function transportOptimizationTime_(value){
 if(value===undefined||value===null||String(value).trim()==="")return null;
 const s=String(value).trim(),m=s.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);if(!m)throw new Error("ROUTE_OPTIMIZATION_TIME_INVALID");
 let h=Number(m[1]),min=Number(m[2]);if(min>59||h>23||h<0)throw new Error("ROUTE_OPTIMIZATION_TIME_INVALID");
 if(m[3]){const ap=m[3].toUpperCase();if(h<1||h>12)throw new Error("ROUTE_OPTIMIZATION_TIME_INVALID");h=h%12+(ap==="PM"?12:0);}
 return h*60+min;
}

function transportOptimizationDistanceKm_(a,b){
 const rad=v=>v*Math.PI/180,lat1=rad(a.lat),lat2=rad(b.lat),dLat=lat2-lat1,dLon=rad(b.lng-a.lng),x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}

function transportOptimizationNormalizeStops_(raw){
 let stops=raw;if(typeof raw==="string"){try{stops=JSON.parse(raw);}catch(e){throw new Error("ROUTE_STOPS_JSON_INVALID");}}
 if(!Array.isArray(stops)||stops.length<2)throw new Error("ROUTE_OPTIMIZATION_STOPS_REQUIRED");
 const seen={};
 return stops.map((s,i)=>{
  if(!s||typeof s!=="object"||Array.isArray(s))throw new Error("ROUTE_STOP_INVALID:"+i);
  const rawLat=s.lat!==undefined?s.lat:s.latitud!==undefined?s.latitud:s.latitude,rawLng=s.lng!==undefined?s.lng:s.longitud!==undefined?s.longitud:s.lon!==undefined?s.lon:s.longitude;
  if(rawLat===null||rawLat===undefined||String(rawLat).trim()===""||rawLng===null||rawLng===undefined||String(rawLng).trim()==="")throw new Error("ROUTE_STOP_COORDINATES_INVALID:"+i);
  const lat=Number(rawLat),lng=Number(rawLng);if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat< -90||lat>90||lng< -180||lng>180)throw new Error("ROUTE_STOP_COORDINATES_INVALID:"+i);
  const id=String(s.id||s.paradaId||s.orden||("STOP-"+(i+1)));if(seen[id])throw new Error("ROUTE_STOP_ID_DUPLICATE:"+id);seen[id]=true;
  const start=transportOptimizationTime_(s.ventanaInicio),end=transportOptimizationTime_(s.ventanaFin);
  if(start!==null&&end!==null&&end<start)throw new Error("ROUTE_STOP_WINDOW_INVALID:"+id);
  const duration=Number(s.duracionParadaMinutos||0);if(!Number.isFinite(duration)||duration<0||duration>180)throw new Error("ROUTE_STOP_DURATION_INVALID:"+id);
  return {source:s,id:id,lat:lat,lng:lng,windowStart:start,windowEnd:end,duration:duration,destination:s.esDestino===true||String(s.tipoParada||"").toUpperCase()==="DESTINO"};
 });
}

function transportOptimizationEvaluate_(stops,speed,startTime){
 let distance=0,travel=0,waiting=0,service=0,current=startTime,conflict=null;
 for(let i=0;i<stops.length;i++){
  if(i>0){const leg=transportOptimizationDistanceKm_(stops[i-1],stops[i]);distance+=leg;const minutes=leg/speed*60;travel+=minutes;current+=minutes;}
  const s=stops[i];if(s.windowStart!==null&&current<s.windowStart){waiting+=s.windowStart-current;current=s.windowStart;}
  if(s.windowEnd!==null&&current>s.windowEnd+0.0001&&!conflict)conflict={stopId:s.id,arrivalMinutes:current,windowEnd:s.windowEnd};
  service+=s.duration;current+=s.duration;
 }
 return {valid:!conflict,conflict:conflict,distanceKm:Math.round(distance*100)/100,travelMinutes:travel,waitingMinutes:waiting,serviceMinutes:service,totalMinutes:Math.round((travel+waiting+service)*10)/10};
}

function transportOptimizationOrder_(stops,speed,startTime){
 const destination=stops.filter(s=>s.destination);if(destination.length>1)throw new Error("ROUTE_OPTIMIZATION_MULTIPLE_DESTINATIONS");
 const fixedEnd=destination.length?destination[0]:stops[stops.length-1],start=stops[0];
 if(fixedEnd.id===start.id)throw new Error("ROUTE_OPTIMIZATION_ORIGIN_DESTINATION_CONFLICT");
 const middle=stops.filter(s=>s.id!==start.id&&s.id!==fixedEnd.id),ordered=[start],remaining=middle.slice();let currentTime=startTime;
 while(remaining.length){
  const candidates=remaining.map(s=>{const leg=transportOptimizationDistanceKm_(ordered[ordered.length-1],s),arrival=currentTime+leg/speed*60,wait=s.windowStart!==null?Math.max(0,s.windowStart-arrival):0,after=arrival+wait;return {stop:s,leg:leg,arrival:after,valid:s.windowEnd===null||after<=s.windowEnd+0.0001};}).filter(x=>x.valid).sort((a,b)=>a.leg-b.leg||a.stop.id.localeCompare(b.stop.id));
  if(!candidates.length)throw new Error("ROUTE_OPTIMIZATION_TIME_WINDOW_CONFLICT");
  const chosen=candidates[0];ordered.push(chosen.stop);currentTime=chosen.arrival+chosen.stop.duration;remaining.splice(remaining.findIndex(x=>x.id===chosen.stop.id),1);
 }
 ordered.push(fixedEnd);
 let evaluated=transportOptimizationEvaluate_(ordered,speed,startTime);if(!evaluated.valid)throw new Error("ROUTE_OPTIMIZATION_TIME_WINDOW_CONFLICT");
 let improved=true,passes=0;
 while(improved&&passes++<4){improved=false;let best=ordered,bestEval=evaluated;
  for(let i=1;i<ordered.length-2;i++)for(let j=i+1;j<ordered.length-1;j++){const candidate=ordered.slice();candidate.splice(i,j-i+1,...candidate.slice(i,j+1).reverse());const e=transportOptimizationEvaluate_(candidate,speed,startTime);if(e.valid&&e.distanceKm<bestEval.distanceKm-0.001){best=candidate;bestEval=e;improved=true;}}
  if(improved){ordered.splice(0,ordered.length,...best);evaluated=bestEval;}
 }
 return {stops:ordered,evaluation:evaluated};
}

function transportOptimizationSheet_(ss){
 const sh=getOrCreateSheet(ss,"TransporteOptimizaciones"),headers=["PropuestaID","RutaID","FechaCreacion","CreadoPor","VelocidadPromedioKmh","HoraInicio","DistanciaActualKm","DistanciaPropuestaKm","TiempoEstimadoMinutos","ParadasOriginalesJSON","ParadasPropuestasJSON","Estado","ResueltoPor","FechaResolucion","Observaciones"],data=sh.getDataRange().getValues();
 if(!data.length||!data[0].some(v=>String(v||"").trim()))sh.getRange(1,1,1,headers.length).setValues([headers]);
 else if(headers.some((h,i)=>String(data[0][i]||"").trim()!==h))throw new Error("ROUTE_OPTIMIZATION_SCHEMA_CONFLICT");
 return sh;
}

function optimizeRouteStopsSequence(payload){
 const p=payload||{},actor=transportOptimizationActor_(p),routeId=String(p.rutaId||"").trim(),speed=Number(p.velocidadPromedioKmh),lock=LockService.getScriptLock();
 if(!routeId)throw new Error("ROUTE_ID_REQUIRED");if(!Number.isFinite(speed)||speed<1||speed>120)throw new Error("ROUTE_OPTIMIZATION_SPEED_INVALID");
 lock.waitLock(15000);
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),routes=getOrCreateSheet(ss,"TransporteRutas"),rows=routes.getDataRange().getValues(),matches=rows.map((r,i)=>({r:r,n:i+1})).filter(x=>x.n>1&&String(x.r[0]||"").trim()===routeId);
  if(matches.length!==1)throw new Error(matches.length?"ROUTE_ID_AMBIGUOUS":"ROUTE_NOT_FOUND");
  const route=matches[0].r,original=String(route[5]||""),stops=transportOptimizationNormalizeStops_(original),startTime=transportOptimizationTime_(p.horaInicio||route[8]);
  if(startTime===null)throw new Error("ROUTE_OPTIMIZATION_START_TIME_REQUIRED");
  const currentEval=transportOptimizationEvaluate_(stops,speed,startTime),optimized=transportOptimizationOrder_(stops,speed,startTime),proposed=optimized.stops.map((s,i)=>Object.assign({},s.source,{orden:i+1}));
  const proposalSheet=transportOptimizationSheet_(ss),proposalId="RTO-"+Utilities.getUuid(),proposal=[proposalId,routeId,new Date(),actor.userId,speed,String(p.horaInicio||route[8]),currentEval.distanceKm,optimized.evaluation.distanceKm,optimized.evaluation.totalMinutes,original,JSON.stringify(proposed),"PENDIENTE","","",String(p.observaciones||"")];
  proposalSheet.appendRow(proposal);
  return {status:"success",propuestaId:proposalId,rutaId:routeId,estado:"PENDIENTE",distanciaActualKm:currentEval.distanceKm,ventanasActualesValidas:currentEval.valid,distanciaPropuestaKm:optimized.evaluation.distanceKm,tiempoEstimadoMinutos:optimized.evaluation.totalMinutes,paradasPropuestas:proposed,message:"Propuesta creada; la ruta activa no fue modificada."};
 }finally{lock.releaseLock();}
}

function getRouteOptimizationProposals(payload){
 const p=payload||{};transportOptimizationActor_(p);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=transportOptimizationSheet_(ss),rows=sh.getDataRange().getValues().slice(1),routeId=String(p.rutaId||"").trim(),state=String(p.estado||"").trim().toUpperCase();
 const data=rows.filter(r=>(!routeId||String(r[1])===routeId)&&(!state||String(r[11]||"").toUpperCase()===state)).map(r=>({propuestaId:r[0],rutaId:r[1],fechaCreacion:r[2],creadoPor:r[3],velocidadPromedioKmh:r[4],horaInicio:r[5],distanciaActualKm:r[6],distanciaPropuestaKm:r[7],tiempoEstimadoMinutos:r[8],paradasOriginalesJSON:r[9],paradasPropuestasJSON:r[10],estado:r[11],resueltoPor:r[12],fechaResolucion:r[13],observaciones:r[14]}));
 return {status:"success",propuestas:data,total:data.length};
}

function approveRouteStopsOptimization(payload){
 const p=payload||{},actor=transportOptimizationActor_(p),id=String(p.propuestaId||"").trim();if(!id)throw new Error("ROUTE_OPTIMIZATION_PROPOSAL_ID_REQUIRED");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),proposalSheet=transportOptimizationSheet_(ss),proposals=proposalSheet.getDataRange().getValues(),found=proposals.map((r,i)=>({r:r,n:i+1})).filter(x=>x.n>1&&String(x.r[0])===id);
  if(found.length!==1)throw new Error(found.length?"ROUTE_OPTIMIZATION_PROPOSAL_AMBIGUOUS":"ROUTE_OPTIMIZATION_PROPOSAL_NOT_FOUND");
  const item=found[0],proposal=item.r;if(String(proposal[11]||"").toUpperCase()==="APROBADA")return {status:"success",idempotent:true,propuestaId:id,rutaId:proposal[1]};
  if(String(proposal[11]||"").toUpperCase()!=="PENDIENTE")throw new Error("ROUTE_OPTIMIZATION_PROPOSAL_NOT_PENDING");
  const routes=getOrCreateSheet(ss,"TransporteRutas"),routeRows=routes.getDataRange().getValues(),routeMatches=routeRows.map((r,i)=>({r:r,n:i+1})).filter(x=>x.n>1&&String(x.r[0])===String(proposal[1]));
  if(routeMatches.length!==1)throw new Error(routeMatches.length?"ROUTE_ID_AMBIGUOUS":"ROUTE_NOT_FOUND");
  const route=routeMatches[0],current=String(route.r[5]||"");if(current!==String(proposal[9]||""))throw new Error("ROUTE_OPTIMIZATION_STALE_ROUTE");
  const proposed=JSON.parse(String(proposal[10]||""));transportOptimizationNormalizeStops_(proposed);
  const oldRoute=route.r.slice(),oldProposal=proposal.slice();
  try{routes.getRange(route.n,6).setValue(JSON.stringify(proposed));proposalSheet.getRange(item.n,12).setValue("APROBADA");proposalSheet.getRange(item.n,13).setValue(actor.userId);proposalSheet.getRange(item.n,14).setValue(new Date());return {status:"success",propuestaId:id,rutaId:proposal[1],estado:"APROBADA",aprobadoPor:actor.userId};}
  catch(e){routes.getRange(route.n,1,1,oldRoute.length).setValues([oldRoute]);proposalSheet.getRange(item.n,1,1,oldProposal.length).setValues([oldProposal]);throw e;}
 }finally{lock.releaseLock();}
}

function rejectRouteStopsOptimization(payload){
 const p=payload||{},actor=transportOptimizationActor_(p),id=String(p.propuestaId||"").trim(),reason=String(p.motivo||p.observaciones||"").trim();if(!id)throw new Error("ROUTE_OPTIMIZATION_PROPOSAL_ID_REQUIRED");if(reason.length<5)throw new Error("ROUTE_OPTIMIZATION_REJECTION_REASON_REQUIRED");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=transportOptimizationSheet_(ss),rows=sh.getDataRange().getValues(),matches=rows.map((r,i)=>({r:r,n:i+1})).filter(x=>x.n>1&&String(x.r[0])===id);
  if(matches.length!==1)throw new Error(matches.length?"ROUTE_OPTIMIZATION_PROPOSAL_AMBIGUOUS":"ROUTE_OPTIMIZATION_PROPOSAL_NOT_FOUND");
  const item=matches[0],state=String(item.r[11]||"").toUpperCase();if(state==="RECHAZADA")return {status:"success",idempotent:true,propuestaId:id,estado:state};if(state!=="PENDIENTE")throw new Error("ROUTE_OPTIMIZATION_PROPOSAL_NOT_PENDING");
  const old=item.r.slice();try{sh.getRange(item.n,12).setValue("RECHAZADA");sh.getRange(item.n,13).setValue(actor.userId);sh.getRange(item.n,14).setValue(new Date());sh.getRange(item.n,15).setValue(reason);return {status:"success",propuestaId:id,estado:"RECHAZADA",resueltoPor:actor.userId};}
  catch(e){sh.getRange(item.n,1,1,old.length).setValues([old]);throw e;}
 }finally{lock.releaseLock();}
}

// Authorized, aggregate transport operations metrics.
function transportMetricsDateKey_(value) {
  if (!value) return "";
  if (value instanceof Date && isFinite(value.getTime())) {
    return String(value.getFullYear()) + "-" +
      String(value.getMonth() + 1).padStart(2, "0") + "-" +
      String(value.getDate()).padStart(2, "0");
  }
  const raw = String(value).trim();
  const candidate = raw.slice(0, 10);
  if (candidate.length === 10 && candidate[4] === "-" && candidate[7] === "-" &&
      candidate.replace(/[0-9-]/g, "") === "") return candidate;
  const parsed = new Date(raw);
  if (!isFinite(parsed.getTime())) return "";
  return String(parsed.getFullYear()) + "-" +
    String(parsed.getMonth() + 1).padStart(2, "0") + "-" +
    String(parsed.getDate()).padStart(2, "0");
}

function transportMetricsTimeMinutes_(value) {
  if (value instanceof Date && isFinite(value.getTime())) {
    return value.getHours() * 60 + value.getMinutes() + value.getSeconds() / 60;
  }
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.toUpperCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const tokens = normalized.split(" ");
  const timeParts = tokens.shift().split(":");
  if (timeParts.length < 2 || timeParts.length > 3 ||
      !timeParts.every(function(part) { return /^\d+$/.test(part); })) return null;
  let hour = Number(timeParts[0]);
  const minute = Number(timeParts[1]);
  const second = Number(timeParts[2] || 0);
  const suffix = tokens.join("").replace(/\s/g, "");
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second) ||
      minute < 0 || minute > 59 || second < 0 || second > 59) return null;
  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === "AM" || suffix === "A") hour = hour === 12 ? 0 : hour;
    else if (suffix === "PM" || suffix === "P") hour = hour === 12 ? 12 : hour + 12;
    else return null;
  } else if (hour < 0 || hour > 23) return null;
  return hour * 60 + minute + second / 60;
}

function getTransportEfficiencyMetrics(payload) {
  const data = payload || {};
  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    // Rechazar identidades no autorizadas antes de tomar el lock global.
    const initialScope = resolveTransportAccessScope_(data, ss);
    if (!initialScope.authorized) {
      transportAuditDenied_(initialScope, "getTransportEfficiencyMetrics", null);
      return { status: "error", code: "VERIFIED_IDENTITY_REQUIRED", message: "Se requiere una identidad verificada." };
    }
    if (!initialScope.management || ["Administrador", "Director", "Subdirector"].indexOf(initialScope.role) === -1) {
      transportAuditDenied_("getTransportEfficiencyMetrics", data, initialScope, null);
      return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", message: "La analítica agregada está reservada a Dirección." };
    }
  } catch (error) {
    return { status: "error", code: "TRANSPORT_METRICS_READ_FAILED", message: String(error && error.message || error) };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { status: "error", code: "LOCK_TIMEOUT", message: "No fue posible obtener una lectura consistente. Reintente." };
  }

  try {
    // Revalidar identidad/rol dentro del lock para evitar TOCTOU durante la espera.
    const scope = resolveTransportAccessScope_(data, ss);
    if (!scope.authorized) {
      transportAuditDenied_(scope, "getTransportEfficiencyMetrics", null);
      return { status: "error", code: "VERIFIED_IDENTITY_REQUIRED", message: "La identidad dejó de ser válida." };
    }
    if (!scope.management || ["Administrador", "Director", "Subdirector"].indexOf(scope.role) === -1) {
      transportAuditDenied_(scope, "getTransportEfficiencyMetrics", null);
      return { status: "error", code: "UNAUTHORIZED_ACCESS_ATTEMPT", message: "La analítica agregada está reservada a Dirección." };
    }

    const from = data.fechaDesde ? transportMetricsDateKey_(data.fechaDesde) : "";
    const to = data.fechaHasta ? transportMetricsDateKey_(data.fechaHasta) : "";
    if ((data.fechaDesde && !from) || (data.fechaHasta && !to) || (from && to && from > to)) {
      return { status: "error", code: "INVALID_DATE_RANGE", message: "El rango de fechas no es válido." };
    }
    const requestedRoute = String(data.rutaId || "").trim();
    const requestedJourney = String(data.jornada || "").trim().toLowerCase();

    const routeSnapshot = transportRows_(ss, "TransporteRutas",
      ["RutaID","NombreRuta","UnidadCodigo","ConductorEmpleadoId","Capacidad","ParadasJSON","Estado","Observaciones","HoraInicio","HoraFin","Jornada"]);
    const vehicleSnapshot = transportRows_(ss, "TransporteVehiculos",
      ["VehiculoID","CodigoUnidad","Placa","Marca","Ano","CapacidadPasajeros"]);
    const assignmentSnapshot = transportRows_(ss, "TransporteAsignaciones",
      ["AsignacionID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada"]);
    const tripSnapshot = transportRows_(ss, "TransporteViajes",
      ["ViajeID","RutaID","Unidad","Conductor","Monitor","Fecha","Jornada","HoraInicio","HoraFin","Estado"]);
    const attendanceSnapshot = transportRows_(ss, "TransporteAsistenciaViajes",
      ["EventoID","ViajeID","EstudianteUserId","Parada","HoraAbordaje","HoraDescenso","Estado"]);
    const snapshots = [routeSnapshot, vehicleSnapshot, assignmentSnapshot, tripSnapshot, attendanceSnapshot];
    const invalidSnapshot = snapshots.find(function(snapshot) { return !snapshot.valid; });
    if (invalidSnapshot) {
      return { status: "error", code: invalidSnapshot.missing ? "TRANSPORT_RESOURCE_NOT_FOUND" : "TRANSPORT_SCHEMA_INVALID",
        message: "No fue posible validar el esquema de los registros de transporte." };
    }
    const routeRows = routeSnapshot.rows;
    const vehicleRows = vehicleSnapshot.rows;
    const assignmentRows = assignmentSnapshot.rows;
    const tripRows = tripSnapshot.rows;
    const attendanceRows = attendanceSnapshot.rows;

    const routes = Object.create(null);
    routeRows.forEach(function(row) {
      const id = String(row[0] || "").trim();
      if (id) routes[id] = row;
    });
    const capacityByUnit = Object.create(null);
    vehicleRows.forEach(function(row) {
      const unit = String(row[1] || "").trim();
      const capacity = Number(row[5]);
      if (unit && isFinite(capacity) && capacity > 0) capacityByUnit[unit] = capacity;
    });

    const activeAssignmentStates = ["active", "activa"];
    const assignedByGroup = Object.create(null);
    assignmentRows.forEach(function(row) {
      const routeId = String(row[1] || "").trim();
      const studentId = String(row[2] || "").trim();
      const state = String(row[5] || "").trim().toLowerCase();
      const route = routes[routeId] || [];
      const journey = String(row[7] || route[10] || "SIN_JORNADA").trim().toLowerCase();
      if (!routeId || !studentId || activeAssignmentStates.indexOf(state) === -1) return;
      const key = routeId + "|" + journey;
      if (!assignedByGroup[key]) assignedByGroup[key] = [];
      if (assignedByGroup[key].indexOf(studentId) === -1) assignedByGroup[key].push(studentId);
    });

    const boardedByTrip = Object.create(null);
    attendanceRows.forEach(function(row) {
      const tripId = String(row[1] || "").trim();
      const studentId = String(row[2] || "").trim();
      const boardingTime = row[4];
      const state = String(row[6] || "").trim().toUpperCase();
      if (!tripId || !studentId || !boardingTime || ["A_BORDO", "DESCENDIDO"].indexOf(state) === -1) return;
      if (!boardedByTrip[tripId]) boardedByTrip[tripId] = [];
      if (boardedByTrip[tripId].indexOf(studentId) === -1) boardedByTrip[tripId].push(studentId);
    });

    const groups = Object.create(null);
    let totalTrips = 0;
    let punctualTrips = 0;
    let onTimeTrips = 0;
    let durationTotal = 0;
    let durationTrips = 0;
    let occupancyTotal = 0;
    let occupancyTrips = 0;

    tripRows.forEach(function(trip) {
      const tripId = String(trip[0] || "").trim();
      const routeId = String(trip[1] || "").trim();
      const route = routes[routeId] || [];
      const dateKey = transportMetricsDateKey_(trip[5]);
      const journey = String(trip[6] || route[10] || "SIN_JORNADA").trim();
      const journeyKey = journey.toLowerCase();
      const status = String(trip[9] || "").trim().toLowerCase();
      if (!tripId || !routeId || !dateKey ||
          (from && dateKey < from) || (to && dateKey > to) ||
          ["cancelado", "cancelada", "anulado", "anulada", "cancelled"].indexOf(status) !== -1 ||
          (requestedRoute && routeId !== requestedRoute) ||
          (requestedJourney && journeyKey !== requestedJourney)) return;

      const key = routeId + "|" + journeyKey;
      if (!groups[key]) {
        const unitCode = String(route[2] || trip[2] || "").trim();
        const routeCapacity = Number(route[4]);
        const capacity = capacityByUnit[unitCode] ||
          (isFinite(routeCapacity) && routeCapacity > 0 ? routeCapacity : 0);
        groups[key] = {
          rutaId: routeId,
          nombreRuta: String(route[1] || routeId),
          unidadCodigo: unitCode,
          jornada: journey,
          capacidadPasajeros: capacity,
          viajes: 0,
          ocupacionTotalPct: 0,
          ocupacionViajes: 0,
          abordajesReales: 0,
          ocupacionesEstimadas: 0,
          sobrecapacidadDetectada: false,
          puntualidadEvaluados: 0,
          puntualidadATiempo: 0,
          duracionTotalMinutos: 0,
          duracionEvaluados: 0
        };
      }
      const group = groups[key];
      group.viajes++;
      totalTrips++;

      if (group.capacidadPasajeros > 0) {
        const actualBoardings = boardedByTrip[tripId];
        const hasBoardingEvidence = !!(actualBoardings && actualBoardings.length);
        const occupiedSeats = hasBoardingEvidence
          ? actualBoardings.length
          : ((assignedByGroup[key] || []).length);
        const tripOccupancyPct = occupiedSeats / group.capacidadPasajeros * 100;
        group.ocupacionTotalPct += tripOccupancyPct;
        if (tripOccupancyPct > 100) group.sobrecapacidadDetectada = true;
        group.ocupacionViajes++;
        occupancyTotal += occupiedSeats / group.capacidadPasajeros * 100;
        occupancyTrips++;
        if (hasBoardingEvidence) group.abordajesReales++;
        else group.ocupacionesEstimadas++;
      }

      const plannedStart = transportMetricsTimeMinutes_(route[8]);
      const actualStart = transportMetricsTimeMinutes_(trip[7]);
      if (plannedStart !== null && actualStart !== null) {
        group.puntualidadEvaluados++;
        punctualTrips++;
        if (actualStart <= plannedStart) {
          group.puntualidadATiempo++;
          onTimeTrips++;
        }
      }

      const endTime = transportMetricsTimeMinutes_(trip[8]);
      if (actualStart !== null && endTime !== null) {
        let duration = endTime - actualStart;
        if (duration < 0) duration += 24 * 60;
        if (duration > 0 && duration <= 24 * 60) {
          group.duracionTotalMinutos += duration;
          group.duracionEvaluados++;
          durationTotal += duration;
          durationTrips++;
        }
      }
    });

    const routeMetrics = Object.keys(groups).map(function(key) {
      const group = groups[key];
      const occupancyEvaluated = group.ocupacionViajes > 0;
      const punctualityEvaluated = group.puntualidadEvaluados > 0;
      const durationEvaluated = group.duracionEvaluados > 0;
      return {
        rutaId: group.rutaId,
        nombreRuta: group.nombreRuta,
        unidadCodigo: group.unidadCodigo,
        jornada: group.jornada,
        capacidadPasajeros: group.capacidadPasajeros || null,
        viajes: group.viajes,
        ocupacionPromedioPct: occupancyEvaluated ? Math.round(group.ocupacionTotalPct / group.ocupacionViajes * 100) / 100 : null,
        abordajesReales: group.abordajesReales,
        ocupacionesEstimadas: group.ocupacionesEstimadas,
        sobrecapacidadDetectada: occupancyEvaluated && group.sobrecapacidadDetectada,
        puntualidadPct: punctualityEvaluated ? Math.round(group.puntualidadATiempo / group.puntualidadEvaluados * 10000) / 100 : null,
        viajesPuntualidadEvaluados: group.puntualidadEvaluados,
        duracionPromedioMinutos: durationEvaluated ? Math.round(group.duracionTotalMinutos / group.duracionEvaluados * 100) / 100 : null,
        viajesDuracionEvaluados: group.duracionEvaluados
      };
    }).sort(function(a, b) {
      return a.nombreRuta.localeCompare(b.nombreRuta) || a.jornada.localeCompare(b.jornada);
    });

    return {
      status: "success",
      filtros: { fechaDesde: from, fechaHasta: to, rutaId: requestedRoute, jornada: data.jornada || "" },
      resumen: {
        viajesAnalizados: totalTrips,
        ocupacionPromedioPct: occupancyTrips ? Math.round(occupancyTotal / occupancyTrips * 100) / 100 : null,
        viajesConOcupacion: occupancyTrips,
        puntualidadPct: punctualTrips ? Math.round(onTimeTrips / punctualTrips * 10000) / 100 : null,
        viajesPuntualidadEvaluados: punctualTrips,
        duracionPromedioMinutos: durationTrips ? Math.round(durationTotal / durationTrips * 100) / 100 : null,
        viajesDuracionEvaluados: durationTrips
      },
      rutas: routeMetrics,
      indicadoresNoDisponibles: {
        costoOperativoPorEstudiante: {
          estado: "SIN_DATOS",
          motivo: "No existe una bitácora de combustible ni un registro de costos operativos vinculado a viajes o vehículos."
        },
        demandaGeograficaSinCobertura: {
          estado: "SIN_DATOS",
          motivo: "No existe un registro de solicitudes de transporte georreferenciadas ni una regla institucional de cobertura configurada."
        }
      },
      definiciones: {
        ocupacion: "Promedio de pasajeros abordados por capacidad vehicular; cuando falta bitácora de abordaje del viaje se usa la asignación activa como estimación y se informa por separado.",
        puntualidad: "Un viaje es puntual si su hora real de inicio no supera la hora de inicio programada; no se aplica tolerancia no configurada.",
        duracion: "Promedio de minutos entre HoraInicio y HoraFin de viajes con ambas horas válidas."
      }
    };
  } catch (error) {
    return { status: "error", code: "TRANSPORT_METRICS_READ_FAILED", message: String(error && error.message || error) };
  } finally {
    lock.releaseLock();
  }
}

function sanitizePayloadForLog(payload) {
  if (!payload || typeof payload !== "object") return String(payload || "");
  try {
    const clean = JSON.parse(JSON.stringify(payload));
    const sensitiveKeys = ["password", "clave", "token", "secret", "credencial", "authorization", "pin", "otp", "passcode"];
    function maskObj(obj) {
      if (!obj || typeof obj !== "object") return;
      for (const k in obj) {
        if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
          obj[k] = "***MASKED***";
        } else if (typeof obj[k] === "object") {
          maskObj(obj[k]);
        }
      }
    }
    maskObj(clean);
    return JSON.stringify(clean);
  } catch (_) {
    return "[Unserializable Payload]";
  }
}

// ---------------------------------------------------------------------------
// FASE 4: CAFETERÍA, MENÚ DIARIO Y PEDIDOS DE ALIMENTOS
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FASE 4: CRÉDITO FAMILIAR Y AUTORIZACIONES
// ---------------------------------------------------------------------------

// [TAREA 1] [Fase Contabilidad y Finanzas] - Reestructuración de convenios y planes de pago familiares con cuotas personalizadas y trazabilidad.

// ---------------------------------------------------------------------------
// CONCEPTOS, MENSUALIDADES Y OBLIGACIONES DE PAGO
// ---------------------------------------------------------------------------

// [REQ-EXP-010] [Requerimientos de Expansión y Desarrollo] - Configuración de conceptos de cobro, mensualidades, recargos y estado de cuenta.
// [TASK-001] [F15-Task01] - Configuración de conceptos de cobro con clasificación tributaria SAR completa

