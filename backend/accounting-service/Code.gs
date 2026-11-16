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

function assertResourceOwnershipForScope_(payload, ss, expedienteId) {
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
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
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
  "Empleado": ["getEmployeeRecords", "getLeaveVacationRequests", "submitLeaveVacationRequest"],
  "Profesor": ["submitVacationRequest"],
  "RecursosHumanos": ["getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "submitLeaveVacationRequest", "submitVacationRequest", "reviewVacationRequest", "reviewLeaveVacationRequest", "calculateVacationBalances", "recordMedicalLeave"],
  "Director": ["getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "submitVacationRequest", "reviewVacationRequest", "calculateVacationBalances"],
  "Administrador": ["getEmployeeRecords", "getLeaveVacationRequests", "getVacationRequests", "reviewVacationRequest", "calculateVacationBalances"]
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
