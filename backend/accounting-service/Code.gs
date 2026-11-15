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

function requestAccountingTrustedOwnerSnapshot_(service, payload) {
  var target = String(service || "").toUpperCase();
  var propertyName = target === "USER" ? "IMA_USER_SERVICE_URL" : (target === "ACADEMIC" ? "IMA_ACADEMIC_SERVICE_URL" : "");
  if (!propertyName) return { status: "error", code: "MIGRATION_OWNER_SERVICE_NOT_ALLOWED" };
  var properties = PropertiesService.getScriptProperties();
  var endpoint = String(properties.getProperty(propertyName) || "").trim();
  var secret = String(properties.getProperty("IMA_MIGRATION_HMAC_SECRET") || "").trim();
  if (!/^https:\/\/[^/]+\/exec$/i.test(endpoint) || secret.length < 32 || typeof UrlFetchApp === "undefined") {
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
      idField: idField, existingTargetIds: academicResult.existingTargetIds.map(String).sort(), targetRows: [] };
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
  var ids = {};
  var targetRows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var id = String(row[idIndex] || "").trim();
    if (!id) continue;
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

function getVerifiedAccountingDepartmentScope_(payload, ss) {
  var actor = getVerifiedDepartmentScopeForSession_(payload);
  if (!actor.valid) return actor;
  var sheet = ss.getSheetByName("AsignacionesAmbitosRoles");
  if (!sheet) return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(value) { return String(value || "").trim(); }) : [];
  var idx = {};
  headers.forEach(function(name, i) { idx[name] = i; });
  var match = null;
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (String(row[idx.UserID] || "") !== actor.userId ||
        String(row[idx.RoleID] || "") !== actor.roleId ||
        String(row[idx.InstitutionID] || "") !== actor.institutionId ||
        String(row[idx.MembershipID] || "") !== actor.membershipId ||
        String(row[idx.Estado] || "").toLowerCase() !== "activo") continue;
    match = row; break;
  }
  if (!match) return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  var responsibilityId = String(match[idx.ResponsibilityID] || "");
  if (!responsibilityId || typeof resolveInternalResponsibilityForRoleScope_ !== "function") {
    return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  }
  var responsibility = resolveInternalResponsibilityForRoleScope_(actor.roleId, String(match[idx.ScopeType] || ""), String(match[idx.ScopeValues] || ""), actor.institutionId);
  if (!responsibility || String(responsibility.responsibilityId || "") !== responsibilityId) {
    return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  }
  var scopeType = String(match[idx.ScopeType] || "").toUpperCase();
  var scopeValues = [];
  try { scopeValues = JSON.parse(String(match[idx.ScopeValues] || "[]")); } catch (ignored) {}
  if (!Array.isArray(scopeValues)) return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  var departments = scopeType === "DEPARTAMENTO" ? scopeValues.map(function(value) { return String(value || "").trim(); }).filter(Boolean) : [];
  return {
    valid: true, userId: actor.userId, roleId: actor.roleId, membershipId: actor.membershipId,
    institutionId: actor.institutionId, responsibilityId: responsibilityId,
    institutionWide: scopeType === "INSTITUCION", departmentIds: departments,
    scopeType: scopeType
  };
}

function mapMigrationRowToTarget_(row, mapping, schema) {
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
      idOriginalLegado: legacyId
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
      return { __departmentError: scope.departmentIds.indexOf(explicit) !== -1 ?
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
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var departmentPreflight = buildAccountingDepartmentalImportPreflight_(input, ss, schema);
  if (!departmentPreflight || departmentPreflight.valid !== true) {
    return { status: "error", code: departmentPreflight && departmentPreflight.code || "DEPARTMENT_IMPORT_SCOPE_DENIED", validForImport: false, errores: [] };
  }
  var identitySnapshot = buildAccountingIdentityMapSnapshot_(input, ss);
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

  var mapping = input.columnaMapeo || {};
  var fields = mapping.campos || {};
  var legacyIdColumn = String(mapping.identificador || "").trim();
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
        if (!person.valid) localErrors.push({ codigo: "ORPHANED_REFERENCE", error: "ORPHANED_REFERENCE", fila: originalRowNumber });
        else prepared.PersonaID = person.idNuevoPlataforma;
      }
    }
    if (entityType === "empleado" && !String(prepared.PersonaId || "").trim()) {
      localErrors.push({ codigo: "RELATED_REFERENCE_MISSING", error: "RELATED_REFERENCE_MISSING", fila: originalRowNumber });
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

function validateImportPreview(payload) {
  var preview = buildImportPreview_(payload);
  if (!preview || preview.status !== "success" || !preview.targetExistenceSnapshot) return preview;
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
  if (preview.status !== "success" || !input.previewConfirmed || !input.previewHash ||
      String(input.previewHash) !== String(preview.previewHash)) {
    throw new Error("IMPORT_PREVIEW_INVALID_OR_STALE");
  }
  var partial = !preview.validForImport;
  if (partial && (!preview.validForPartialImport || input.allowPartialImport !== true)) {
    throw new Error("IMPORT_PREVIEW_INVALID_OR_STALE");
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var actor = getVerifiedAccountingIdentity_(input);
  if (!actor || actor.authorized !== true) throw new Error("AUTH_PERMISSION_DENIED");
  var runId = Utilities.getUuid();
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
      var targetSnapshotVerified = service === "ACCOUNTING" && targetSnapshot.verified === true;
      var expectedTargetPresent = false;
      var expectedTargetRowHash = "";
      if (targetSnapshotVerified) {
        var targetIdField = String(targetSnapshot.idField || (schema.headers || [])[0] || "");
        var existingTargetRow = (targetSnapshot.targetRows || []).find(function(targetRow) {
          return String(targetRow && targetRow[targetIdField] || "").trim() === String(row[(schema.headers || [])[0]] || "").trim();
        });
        expectedTargetPresent = !!existingTargetRow;
        if (existingTargetRow) expectedTargetRowHash = migrationHash_(migrationStableJson_(existingTargetRow));
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
    var audit = getOrCreateSheet(ss, "AuditoriaMigraciones");
    audit.appendRow([
      runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
      String(input.tipoEntidad || ""), String(input.destinoModulo || ""), rowsToWrite.length,
      new Date(), JSON.stringify(warnings), partial ? "partial" : "completed",
      JSON.stringify(errors), preview.previewHash, actor.userId || ""
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
    if (applied.length) rollbackMigrationOwnerWrites_(applied);
    if (idempotentOwnershipFailure) {
      errors.push({ severity: "ERROR", codigo: "RESOURCE_OWNERSHIP_REPAIR_REQUIRED", error: "RESOURCE_OWNERSHIP_REPAIR_REQUIRED" });
      var repairAudit = getOrCreateSheet(ss, "AuditoriaMigraciones");
      repairAudit.appendRow([runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
        String(input.tipoEntidad || ""), String(input.destinoModulo || ""), 0, new Date(),
        JSON.stringify(warnings), "compensation_required", JSON.stringify(errors), preview.previewHash, actor.userId || ""]);
      return { status: "error", code: "MIGRATION_COMPENSATION_REQUIRED", estado: "compensation_required",
        registrosEscritos: 0, errores: errors, runId: runId };
    }
    errors.push({ severity: "ERROR", codigo: "MIGRATION_BATCH_ROLLED_BACK", error: "MIGRATION_BATCH_ROLLED_BACK",
      message: String(error && error.message || error) });
    var auditRollback = getOrCreateSheet(ss, "AuditoriaMigraciones");
    auditRollback.appendRow([runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
      String(input.tipoEntidad || ""), String(input.destinoModulo || ""), 0, new Date(),
      JSON.stringify(warnings), "rolled_back", JSON.stringify(errors), preview.previewHash, actor.userId || ""]);
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
  if (!/^https:\/\/[^/]+\/exec$/i.test(endpoint) || secret.length < 32 ||
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
    var selfRow = employeeValues.slice(1).find(function(row) { return String(row[employeeIndex.UserId] || "") === String(actor.userId || ""); });
    expedienteId = selfRow ? String(selfRow[employeeIndex.ExpedienteID] || "").trim() : "";
    if (!expedienteId && employeeValues.length > 1) expedienteId = String(employeeValues[1][employeeIndex.ExpedienteID] || "").trim();
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
  if (access && access.authorized === true) {
    var fullDocuments = matchingDocuments.map(function(row) {
      return {
        documentoId: row[documentIndex.DocumentoID],
        expedienteId: row[documentIndex.ExpedienteID],
        categoriaDoc: row[documentIndex.CategoriaDoc],
        tituloDocumento: row[documentIndex.TituloDocumento],
        archivoUrl: row[documentIndex.ArchivoUrl],
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

/* Runtime configuration and fail-closed service adapters. */
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "";
const MIGRATION_OWNER_SCHEMAS_={
  curso: { service: "ACCOUNTING", sheet: "Cursos", headers: ["CursoID", "Nombre", "Nota", "FechaInicio"] },
  estudiante: { service: "ACADEMIC", sheet: "ExpedientesEstudiantes", headers: ["ExpedienteID", "PersonaID"] },
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

function accountingComputeHmacSignature_(message, secret) {
  var bytes = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, String(message), String(secret));
  return bytes.map(function(byte) { return ("0" + (byte & 255).toString(16)).slice(-2); }).join("");
}

function requestAccountingUserAuthorization_(action, payload) {
  var properties = PropertiesService.getScriptProperties();
  var endpoint = String(properties.getProperty("IMA_USER_SERVICE_URL") || "").trim();
  var secret = String(properties.getProperty("IMA_MIGRATION_HMAC_SECRET") || "").trim();
  if (!/^https:\/\/[^/]+\/exec$/i.test(endpoint) || secret.length < 32 ||
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
  if (!/^https:\/\/[^/]+\/exec$/i.test(endpoint) || signingSecret.length < 32 ||
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


/* Authenticated HTTP surface for the document-import preflight.
 * Import writes remain deliberately unavailable until the ACCOUNTING owner-write
 * and compensation path is implemented and covered by contract tests.
 */
const API_RESPONSE_VERSION = "1.0.0";

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
    INTERNAL_ERROR: "No fue posible completar la solicitud.",
    UNHANDLED_EXCEPTION: "No fue posible completar la solicitud."
  };
  return messages[String(code || "INTERNAL_ERROR")] || "No fue posible completar la solicitud.";
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
  var cases = [
    { action: "success envelope", pass: success.apiVersion === API_RESPONSE_VERSION && success.status === "success" && Array.isArray(success.data) && !!success.meta.correlationId },
    { action: "legitimate empty collection", pass: Array.isArray(success.data) && success.data.length === 0 },
    { action: "structured error envelope", pass: failure.status === "error" && failure.error && failure.error.code === "INTERNAL_ERROR" && !Object.prototype.hasOwnProperty.call(failure, "data") },
    { action: "safe public error message", pass: failure.error.message === "No fue posible completar la solicitud." && failure.error.message.indexOf("Sensitive") === -1 },
    { action: "error is not counted as success", pass: failure.status !== "success" }
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
    if (request.action === "validateImportPreview") return respond(validateImportPreview(actionPayload));
    if (request.action === "importDataWithColumnMapping") return respond(importDataWithColumnMapping(actionPayload));
    return respond({ status: "error", code: "ACTION_NOT_ALLOWED" });
  } catch (error) {
    return respond({ status: "error", code: "INTERNAL_ERROR",
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
  var canonical = {};
  Object.keys(data).sort().forEach(function(field) {
    canonical[field] = data[field] instanceof Date ? data[field].toISOString() : data[field];
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
      after[schema.headers.indexOf(field)] = migrationSafeCell_(data[field]);
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
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    return { valid: false, code: "IMPORT_FILE_BASE64_INVALID" };
  }
  try {
    var bytes = Utilities.base64Decode(encoded);
    if (!bytes || bytes.length < 4 || bytes.length > 10 * 1024 * 1024 ||
        (bytes[0] & 255) !== 0x50 || (bytes[1] & 255) !== 0x4b ||
        (bytes[2] & 255) !== 0x03 || (bytes[3] & 255) !== 0x04) {
      return { valid: false, code: "IMPORT_FILE_SIGNATURE_INVALID" };
    }
    var blob = Utilities.newBlob(bytes, mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    var entries = Utilities.unzip(blob);
    if (!Array.isArray(entries) || !entries.length || entries.length > 1000) {
      return { valid: false, code: "IMPORT_FILE_PACKAGE_INVALID" };
    }
    var names = {}, totalBytes = 0, hasContentTypes = false, hasWorkbook = false, hasWorksheet = false;
    entries.forEach(function(entry) {
      var name = String(entry && entry.getName ? entry.getName() : "");
      if (!name || name.indexOf("../") !== -1 || name.charAt(0) === "/" || names[name]) {
        throw new Error("IMPORT_FILE_PACKAGE_INVALID");
      }
      names[name] = true;
      if (name === "[Content_Types].xml") hasContentTypes = true;
      if (name === "xl/workbook.xml") hasWorkbook = true;
      if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) hasWorksheet = true;
      if (/vbaProject\.bin$/i.test(name)) throw new Error("IMPORT_FILE_MACROS_NOT_ALLOWED");
      var entryBytes = entry.getBytes ? entry.getBytes() : [];
      totalBytes += entryBytes.length;
      if (entryBytes.length > 15 * 1024 * 1024 || totalBytes > 40 * 1024 * 1024) {
        throw new Error("IMPORT_FILE_UNCOMPRESSED_SIZE_LIMIT");
      }
    });
    if (!hasContentTypes || !hasWorkbook || !hasWorksheet) return { valid: false, code: "IMPORT_FILE_PACKAGE_INVALID" };
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    var fileHash = digest.map(function(byte) { return ("0" + (byte & 255).toString(16)).slice(-2); }).join("");
    return { valid: true, fileHash: fileHash, sizeBytes: bytes.length, uncompressedBytes: totalBytes };
  } catch (error) {
    var code = String(error && error.message || "");
    if (code === "IMPORT_FILE_MACROS_NOT_ALLOWED" || code === "IMPORT_FILE_UNCOMPRESSED_SIZE_LIMIT") {
      return { valid: false, code: code };
    }
    return { valid: false, code: "IMPORT_FILE_PACKAGE_INVALID" };
  }
}
