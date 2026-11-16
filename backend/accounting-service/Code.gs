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
  var input = payload || {};
  var actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  var sheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesLaborales") : null;
  if (!sheet) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var index = {};
  headers.forEach(function(name, position) { index[name] = position; });
  if (index.ExpedienteID === undefined || index.UserId === undefined || index.Departamento === undefined) {
    return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  }
  var targetId = String(expedienteId || "").trim();
  if (!targetId) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var matches = values.slice(1).filter(function(row) {
    return String(row[index.ExpedienteID] || "").trim() === targetId;
  });
  if (matches.length !== 1) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  var target = matches[0];
  var role = String(actor.role || "").trim().toLowerCase();
  if (role === "empleado") {
    return String(target[index.UserId] || "").trim() === String(actor.userId || "").trim()
      ? { authorized: true, accessType: "SELF" }
      : { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  }
  var scope = getVerifiedAccountingDepartmentScope_(input, ss);
  if (!scope || scope.valid !== true) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  if (scope.institutionWide === true) return { authorized: true, accessType: "INSTITUTION" };
  var targetDepartment = String(target[index.Departamento] || "").trim();
  var permittedDepartments = Array.isArray(scope.departmentIds) ? scope.departmentIds.map(function(value) {
    return String(value || "").trim();
  }) : [];
  if (targetDepartment && permittedDepartments.indexOf(targetDepartment) !== -1) {
    return { authorized: true, accessType: "DEPARTMENT", departmentId: targetDepartment };
  }
  return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
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
  var input = payload || {};
  var actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) {
    return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var documentSheet = ss.getSheetByName("DocumentosLaborales");
  var employeeSheet = ss.getSheetByName("ExpedientesLaborales");
  if (!documentSheet || !employeeSheet) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var employeeValues = employeeSheet.getDataRange().getValues();
  var documentValues = documentSheet.getDataRange().getValues();
  if (!employeeValues.length || !documentValues.length) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var employeeHeaders = employeeValues[0].map(function(value) { return String(value || "").trim(); });
  var documentHeaders = documentValues[0].map(function(value) { return String(value || "").trim(); });
  var employeeIndex = {}, documentIndex = {};
  employeeHeaders.forEach(function(name, index) { employeeIndex[name] = index; });
  documentHeaders.forEach(function(name, index) { documentIndex[name] = index; });
  var requiredEmployee = ["ExpedienteID", "UserId", "Departamento"];
  var requiredDocument = ["DocumentoID", "ExpedienteID", "CategoriaDoc", "TituloDocumento", "ArchivoUrl", "FechaCarga", "CargadoPor", "EstadoVisibilidad", "Observaciones"];
  if (requiredEmployee.some(function(name) { return employeeIndex[name] === undefined; }) ||
      requiredDocument.some(function(name) { return documentIndex[name] === undefined; })) {
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  var expedienteId = String(input.expedienteId || "").trim();
  if (!expedienteId && String(actor.role || "").toLowerCase() === "empleado") {
    var selfRows = employeeValues.slice(1).filter(function(row) {
      return String(row[employeeIndex.UserId] || "").trim() === String(actor.userId || "").trim();
    });
    if (selfRows.length === 1) expedienteId = String(selfRows[0][employeeIndex.ExpedienteID] || "").trim();
    else return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  if (!expedienteId) return { status: "success", documentos: [] };
  var matchingEmployees = employeeValues.slice(1).filter(function(row) {
    return String(row[employeeIndex.ExpedienteID] || "").trim() === expedienteId;
  });
  if (matchingEmployees.length !== 1) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var access = assertEmployeeExpedienteScopeAccess_(input, ss, expedienteId);
  var matchingDocuments = documentValues.slice(1).filter(function(row) {
    return String(row[documentIndex.ExpedienteID] || "").trim() === expedienteId;
  });
  var documentIds = {};
  for (var i = 0; i < matchingDocuments.length; i++) {
    var id = String(matchingDocuments[i][documentIndex.DocumentoID] || "").trim();
    if (!id || documentIds[id]) return { status: "error", code: "RESOURCE_NOT_FOUND" };
    documentIds[id] = true;
  }
  var privateFilesVerified = matchingDocuments.every(function(row) {
    return enforcePrivateEmployeeDocumentFile_(row[documentIndex.ArchivoUrl]);
  });
  if (!privateFilesVerified) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  if (access && access.authorized === true) {
    var fullDocuments = matchingDocuments.map(function(row) {
      return {
        documentoId: row[documentIndex.DocumentoID],
        expedienteId: row[documentIndex.ExpedienteID],
        categoriaDoc: row[documentIndex.CategoriaDoc],
        tituloDocumento: row[documentIndex.TituloDocumento],
        tieneArchivo: !!String(row[documentIndex.ArchivoUrl] || "").trim(),
        fechaCarga: row[documentIndex.FechaCarga],
        cargadoPor: row[documentIndex.CargadoPor],
        estadoVisibilidad: row[documentIndex.EstadoVisibilidad],
        observaciones: row[documentIndex.Observaciones]
      };
    });
    return { status: "success", documentos: fullDocuments };
  }
  if (!access || access.code !== "RESOURCE_SCOPE_DENIED" || String(actor.role || "").toLowerCase() === "empleado") {
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  var requestedFields = input.referenceRequestedFields;
  var requestedDocumentIds = input.referenceDocumentIds;
  if (!Array.isArray(requestedFields) || !requestedFields.length || !Array.isArray(requestedDocumentIds) ||
      !requestedDocumentIds.length || requestedDocumentIds.some(function(id) { return !documentIds[String(id || "")]; })) {
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  var authorization = authorizeAccountingDepartmentReferenceReadViaUser_(input, expedienteId, requestedFields, requestedDocumentIds);
  if (!authorization || authorization.status !== "success") return { status: "error", code: "RESOURCE_NOT_FOUND" };
  var referenceDocuments = [];
  requestedDocumentIds.forEach(function(requestedId) {
    var row = matchingDocuments.find(function(item) { return String(item[documentIndex.DocumentoID] || "") === String(requestedId); });
    if (!row) return;
    var document = { documentoId: row[documentIndex.DocumentoID] };
    authorization.approvedFields.forEach(function(field) {
      var map = { categoriaDoc: "CategoriaDoc", fechaCarga: "FechaCarga", estadoVisibilidad: "EstadoVisibilidad" };
      document[field] = row[documentIndex[map[field]]];
    });
    referenceDocuments.push(document);
  });
  if (referenceDocuments.length !== requestedDocumentIds.length) return { status: "error", code: "RESOURCE_NOT_FOUND" };
  return { status: "success", referenceOnly: true, grantId: authorization.grantId,
    auditEventId: authorization.auditEventId, documentos: referenceDocuments };
}


function normalizeVacationRole_(role) {
  return String(role || "").trim().toLowerCase().replace(/\s+/g, "");
}

function validateRolePermission(actorOrPayload, action) {
  var actor = actorOrPayload && actorOrPayload.authorized === true
    ? actorOrPayload : getVerifiedAccountingIdentity_(actorOrPayload || {});
  if (!actor || actor.authorized !== true) return { authorized: false, code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
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
    var spreadsheet = payload, scope = ss, resourceType = String(expedienteId || "").trim().toUpperCase();
    var targetId = String(resourceId || "").trim(), action = String(operation || "").trim().toUpperCase();
    if (!spreadsheet || !scope || (scope.valid !== true && scope.authorized !== true) ||
        resourceType !== "EXPEDIENTE_LABORAL" || action !== "WRITE" || !targetId) {
      return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    }
    var employeeSheet = spreadsheet.getSheetByName("ExpedientesLaborales");
    if (!employeeSheet) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    var values = employeeSheet.getDataRange().getValues();
    if (!values || !values.length) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    var headers = values[0].map(function(value) { return String(value || "").trim(); });
    var idIndex = headers.indexOf("ExpedienteID"), departmentIndex = headers.indexOf("Departamento");
    if (idIndex < 0 || departmentIndex < 0) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    var matches = values.slice(1).filter(function(row) { return String(row[idIndex] || "").trim() === targetId; });
    if (matches.length !== 1) return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    var departmentId = String(matches[0][departmentIndex] || "").trim();
    var departments = Array.isArray(scope.departmentIds) ? scope.departmentIds.map(function(value) { return String(value || "").trim(); }) : [];
    if (scope.institutionWide !== true && (!departmentId || departments.indexOf(departmentId) === -1)) {
      return { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
    }
    return { authorized: true, departmentId: departmentId, institutionId: String(scope.institutionId || "") };
  }
  return assertEmployeeExpedienteScopeAccess_(payload, ss, expedienteId);
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

function getEmployeeRecords(payload) {
  var input = payload || {};
  var actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) return { status: "error", code: actor && actor.code || "VERIFIED_IDENTITY_REQUIRED" };
  var permission = validateRolePermission(actor, "getEmployeeRecords");
  if (!permission.authorized) return { status: "error", code: permission.code };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("ExpedientesLaborales");
  if (!sheet) return { status: "success", data: [], expedientes: [] };
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { status: "success", data: [], expedientes: [] };
  var headers = values[0].map(function(value) { return String(value || "").trim(); });
  var idx = { id: headers.indexOf("ExpedienteID"), person: headers.indexOf("PersonaId"), user: headers.indexOf("UserId"), role: headers.indexOf("Puesto"), department: headers.indexOf("Departamento"), cost: headers.indexOf("CentroCosto"), hire: headers.indexOf("FechaIngreso"), exit: headers.indexOf("FechaSalida"), state: headers.indexOf("EstadoLaboral"), notes: headers.indexOf("Observaciones") };
  if (Object.keys(idx).some(function(key) { return idx[key] < 0; })) return { status: "error", code: "RESOURCE_SCHEMA_INVALID" };
  var names = getEmployeePersonNameIndex_(ss), role = normalizeVacationRole_(actor.role), rows = [];
  if (role === "empleado" && input.userId && String(input.userId).trim() !== actor.userId) {
    auditEmployeeSelfServiceDenied_(actor, "getEmployeeRecords");
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  values.slice(1).forEach(function(row) {
    var id = String(row[idx.id] || "").trim();
    if (!id) return;
    if (role === "empleado") {
      if (String(row[idx.user] || "").trim() !== actor.userId) return;
    } else {
      var access = resolveVacationEmployeeAccess_(input, ss, id, actor);
      if (!access.authorized) return;
    }
    var item = { expedienteId: id, personaId: row[idx.person], userId: role === "empleado" ? undefined : row[idx.user],
      puesto: row[idx.role], departamento: row[idx.department], centroCosto: row[idx.cost],
      fechaIngreso: row[idx.hire], fechaSalida: row[idx.exit], estadoLaboral: row[idx.state],
      empleadoNombre: names[String(row[idx.person] || "").trim()] || "" };
    item.observaciones = role === "empleado" ? "" : (row[idx.notes] || "");
    rows.push(item);
  });
  var requestedId = String(input.expedienteId || "").trim();
  if (requestedId && !rows.some(function(item) { return item.expedienteId === requestedId; })) {
    auditEmployeeSelfServiceDenied_(actor, "getEmployeeRecords");
    return { status: "error", code: "RESOURCE_NOT_FOUND" };
  }
  return { status: "success", data: rows, expedientes: rows };
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
  if (["director","administrador"].indexOf(normalizedRole) !== -1) {
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
  if(!actor||actor.authorized!==true)return {status:"error",code:actor&&actor.code||"VERIFIED_IDENTITY_REQUIRED"};
  var role=normalizeVacationRole_(actor.role);
  if(["empleado","recursoshumanos","administrador"].indexOf(role)===-1)return {status:"error",code:"ROLE_NOT_ALLOWED"};
  var targetUserId=role==="empleado"?actor.userId:String(input.targetUserId||input.empleadoId||"").trim();
  if(!targetUserId)return {status:"error",code:"RESOURCE_NOT_FOUND"};
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID),employeeSheet=ss.getSheetByName("ExpedientesLaborales");
  if(!employeeSheet)return {status:"error",code:"RESOURCE_NOT_FOUND"};
  var employeeValues=employeeSheet.getDataRange().getValues(),employeeHeaders=employeeValues[0].map(function(v){return String(v||"").trim();});
  var expedienteIndex=employeeHeaders.indexOf("ExpedienteID"),userIndex=employeeHeaders.indexOf("UserId");
  if(expedienteIndex<0||userIndex<0)return {status:"error",code:"RESOURCE_DATA_SCHEMA_INVALID"};
  var employees=employeeValues.slice(1).filter(function(row){return String(row[userIndex]||"").trim()===targetUserId;});
  if(employees.length!==1)return {status:"error",code:"RESOURCE_NOT_FOUND"};
  var expedienteId=String(employees[0][expedienteIndex]||"").trim();
  if(role==="recursoshumanos"){
    var scope=assertEmployeeExpedienteScopeAccess_(input,ss,expedienteId);
    if(!scope||scope.authorized!==true)return {status:"error",code:"RESOURCE_NOT_FOUND"};
  }
  function rowsFor(name,expectedHeaders,idColumn,filterColumn,filterValue,projector){
    var sheet=ss.getSheetByName(name);if(!sheet)return [];
    var values=sheet.getDataRange().getValues();
    if(!values||!values.length||JSON.stringify(values[0].map(function(v){return String(v||"").trim();}))!==JSON.stringify(expectedHeaders))throw Error("RESOURCE_DATA_SCHEMA_INVALID");
    var rows=values.slice(1),counts=Object.create(null);
    rows.forEach(function(row){var id=String(row[idColumn]||"").trim();counts[id]=(counts[id]||0)+1;});
    return rows.filter(function(row){return String(row[filterColumn]||"").trim()===String(filterValue)&&counts[String(row[idColumn]||"").trim()]===1;}).map(projector);
  }
  try{
    return {status:"success",data:{
      effectiveUserId:targetUserId,
      contratos:rowsFor("ContratosLaborales",["ContratoID","ExpedienteID","TipoContrato","FechaInicio","FechaFin","SalarioBase","Jornada","EstadoContrato","Observaciones"],0,1,expedienteId,function(r){return {contratoId:r[0],tipoContrato:r[2],fechaInicio:r[3],fechaFin:r[4],salarioBase:r[5],jornada:r[6],estadoContrato:r[7]};}),
      solicitudesVacaciones:rowsFor("SolicitudesVacaciones",["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"],0,1,expedienteId,function(r){return {solicitudId:r[0],tipo:r[2],fechaInicio:r[3],fechaFin:r[4],diasSolicitados:r[5],estado:r[6]};}),
      prestamos:rowsFor("AnticiposPrestamosEmpleado",["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],0,2,targetUserId,function(r){return {prestamoId:r[0],fecha:r[1],tipo:r[3],montoSolicitado:r[4],montoAprobado:r[5],plazoCuotas:r[6],cuotaMensual:r[7],saldoPendiente:r[8],estadoAprobacion:r[9]};}),
      turnos:rowsFor("AsignacionesTurnosLaborales",["AsignacionTurnoID","EmpleadoID","NombreTurno","FechaInicio","FechaFin","HoraEntrada","HoraSalida","DepartamentoArea","Estado","CreadoPor","FechaCreacion","UltimaModificacion"],0,1,targetUserId,function(r){return {asignacionTurnoId:r[0],nombreTurno:r[2],fechaInicio:r[3],fechaFin:r[4],horaEntrada:r[5],horaSalida:r[6],departamentoArea:r[7],estado:r[8]};}),
      capacitaciones:rowsFor("InscripcionesCapacitacion",["InscripcionID","CursoID","EmpleadoID","FechaInscripcion","EstadoInscripcion","AsistenciaPorcentaje","ResultadoNota","CertificadoDriveUrl","FechaEmisionCertificado","FechaVencimientoCertificado","Observaciones","CreadoPor","FechaCreacion","UltimaModificacion"],0,2,targetUserId,function(r){return {inscripcionId:r[0],cursoId:r[1],fechaInscripcion:r[3],estadoInscripcion:r[4],asistenciaPorcentaje:r[5],resultadoNota:r[6],certificadoDriveUrl:r[7],fechaEmisionCertificado:r[8],fechaVencimientoCertificado:r[9]};})
    }};
  }catch(error){return {status:"error",code:"RESOURCE_DATA_SCHEMA_INVALID"};}
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
  var verified = requestAccountingUserAuthorization_("verifyAccountingSession", {
    sessionToken: payload.sessionToken
  });
  if (!verified || verified.status !== "success" || verified.authorized !== true ||
      !verified.userId || !verified.role || !verified.institutionId) {
    return { authorized: false, code: verified && verified.code || "VERIFIED_IDENTITY_REQUIRED" };
  }
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
  "Padre": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"],
  "Estudiante": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"],
  "Conductor": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"],
  "Monitor": ["getTransportRoutes", "getTransportAssignments", "getTripPassengerManifest"],
  "RecursosHumanos": ["getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "submitLeaveVacationRequest", "submitVacationRequest", "reviewVacationRequest", "reviewLeaveVacationRequest", "calculateVacationBalances", "recordMedicalLeave", "manageLaborIncident", "manageDisciplinaryMeasure", "manageTrainingEnrollment", "manageTrainingCourse", "manageProfessionalDevelopmentPlan", "getTrainingAnalyticsReport", "recordStaffCheckIn", "recordStaffAttendance", "getStaffAttendanceLogs", "getEmployeeSelfServicePortal", "submitAttendanceCorrection", "reviewAttendanceCorrection", "requestEmployeeLoanAdvance", "getEmployeeLoansAdvances", "approveEmployeeLoanAdvance", "manageEmployeeLoanAdvance", "getLoanAmortizationSchedule", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "getStaffPayrollReceipt", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees"],
  "Director": ["submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "submitVacationRequest", "reviewVacationRequest", "calculateVacationBalances", "configurePaymentConcept", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "getAdvancedDashboardAnalytics", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees"],
  "Subdirector": ["submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "configurePaymentConcept", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees"],
  "Contador": ["submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "configurePaymentConcept", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "getStaffPayrollReceipt", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees"],
  "Administrador": ["submitPurchaseQuotation", "getPurchaseQuotations", "getPurchaseQuotationMatrix", "adjudicatePurchaseQuotations", "getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "reviewVacationRequest", "calculateVacationBalances", "submitAttendanceCorrection", "reviewAttendanceCorrection", "requestEmployeeLoanAdvance", "getEmployeeLoansAdvances", "approveEmployeeLoanAdvance", "manageEmployeeLoanAdvance", "getLoanAmortizationSchedule", "calculatePayrollPeriod", "calculateExtraordinaryPayroll", "updatePayrollPeriodStatus", "getPayrollPeriodSummary", "generatePayrollPeriod", "generatePayrollReceiptPDF", "getPayrollReceiptPDFFile", "getStaffPayrollReceipt", "previewPayrollReceiptDistribution", "processPayrollReceiptDistribution", "getPayrollConceptCatalog", "savePayrollConcept", "setPayrollConceptStatus", "assignPayrollConcept", "getPayrollConceptAssignments", "setPayrollConceptAssignmentStatus", "recordAccountingJournalEntry", "getAccountingJournalEntries", "getPaginatedJournalEntries", "recordPayrollJournalAdjustment", "getAdvancedDashboardAnalytics", "getPayrollBatchPreview", "getPayrollEmployeePayConfig", "savePayrollEmployeePayConfig", "recalculatePayrollEmployees"]
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
  var raw = String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["activofijo","activofijos","biencapitalizable","bienes capitalizables","capitalizable","patrimonial"].indexOf(raw) !== -1) return "ActivoFijo";
  if (["consumible","consumibles","suministro","suministros"].indexOf(raw) !== -1) return "Consumible";
  return raw ? String(value).trim() : "Inventariable";
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
    if (quoteRow && quoteSheet) try { quoteSheet.getRange(quoteRow, 1, 1, PURCHASE_QUOTATION_HEADERS_.length).clearContent(); } catch (ignored) {}
    if (detailStart && detailSheet) try {
      var count = detailSheet.getLastRow() - detailStart + 1;
      if (count > 0) detailSheet.getRange(detailStart, 1, count, PURCHASE_QUOTATION_DETAIL_HEADERS_.length).clearContent();
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
  var orderSheet, awardSheet, quoteSheet, request, createdOrders = [], createdAwardRow = 0, quoteUpdates = [];
  try {
    var actor = getVerifiedAccountingIdentity_(input);
    if (!actor || actor.authorized !== true || String(actor.userId) !== String(access.actor.userId) ||
        String(actor.role) !== String(access.actor.role)) return { status: "error", code: "VERIFIED_IDENTITY_CHANGED" };
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
      var prices = detailRows.filter(function(d) { return String(d[2]) === request.solicitudId && String(d[3]) === item.itemId && d[16] === true; })
        .map(function(d) {
          var quote = quoteRows.filter(function(row, index) { return index > 0 && String(row[0]) === String(d[1]); })[0];
          return { price: Number(d[8]), valid: !!quote && purchaseQuoteIsValid_(quote, new Date()) };
        }).filter(function(p) { return p.valid && isFinite(p.price); });
      if (prices.length) {
        var lowest = Math.min.apply(null, prices);
        var selected = awardLines.filter(function(a) { return a.itemId === item.itemId; });
        if (selected.some(function(a) { return a.precioUnitario > lowest + 0.000001; }) &&
            String(input.justificacion || "").trim().length < 40) throw new Error("PURCHASE_AWARD_NON_LOWEST_JUSTIFICATION_REQUIRED");
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
    var awardId = "ACTA-" + String(Utilities.getUuid()).replace(/-/g, "").slice(0, 24);
    var snapshot = { cotizaciones: snapshotQuotes, detalleCotizaciones: snapshotDetails };
    createdAwardRow = awardSheet.getLastRow() + 1;
    awardSheet.appendRow([awardId, request.solicitudId, now, JSON.stringify(responsible), String(input.dictamen).trim(),
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
    return { status: "success", actaId: awardId, ordenes: orderIds, montoAdjudicado: totalAward };
  } catch (error) {
    createdOrders.forEach(function(row) { try { orderSheet.getRange(row, 1, 1, PURCHASE_ORDER_HEADERS_.length).clearContent(); } catch (ignored) {} });
    if (createdAwardRow && awardSheet) try { awardSheet.getRange(createdAwardRow, 1, 1, PURCHASE_AWARD_HEADERS_.length).clearContent(); } catch (ignored2) {}
    quoteUpdates.forEach(function(item) { try { quoteSheet.getRange(item.row, 10).setValue(item.state); } catch (ignored3) {} });
    return { status: "error", code: String(error && error.message || "PURCHASE_AWARD_WRITE_FAILED") };
  } finally { lock.releaseLock(); }
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
    if (request.action === "getPurchaseQuotations") return respond(getPurchaseQuotations(actionPayload));
    if (request.action === "getPurchaseQuotationMatrix") return respond(getPurchaseQuotationMatrix(actionPayload));
    if (request.action === "adjudicatePurchaseQuotations") return respond(adjudicatePurchaseQuotations(actionPayload));
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
      ACTIVE_DEPARTMENT_REQUIRED: true, ACTIVE_SCOPE_NOT_ASSIGNED: true
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
