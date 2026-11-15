/**
 * Preflight semántico de migraciones documentales.
 * La identidad, el tenant y el destino se obtienen del contexto verificado;
 * los datos del navegador solo describen el archivo y el mapeo propuesto.
 */
function buildAccountingIdentityMapSnapshot_(payload, ss) {
  var institutionId = String(PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") || "").trim();
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

function buildMigrationTargetExistenceSnapshot_(schema, preparedRows, institutionId, ss) {
  var service = String(schema && schema.service || "").toUpperCase();
  var sheetName = String(schema && schema.sheet || "");
  var idField = schema && schema.headers && schema.headers[0] || "";
  if (service !== "ACCOUNTING") {
    return { verified: false, service: service, sheet: sheetName, institutionId: institutionId, existingTargetIds: [], targetRows: [] };
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return { verified: false, service: service, sheet: sheetName, institutionId: institutionId, existingTargetIds: [], targetRows: [] };
  }
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
  return {
    verified: true,
    service: service,
    sheet: sheetName,
    institutionId: institutionId,
    idField: idField,
    existingTargetIds: Object.keys(ids).sort(),
    targetRows: targetRows
  };
}

function getVerifiedDepartmentScopeForSession_(payload) {
  var identity = getVerifiedAccountingIdentity_(payload || {});
  if (!identity || identity.authorized !== true) return { valid: false, code: identity && identity.code || "VERIFIED_IDENTITY_REQUIRED" };
  var claims = typeof verifySessionToken === "function" ? verifySessionToken(payload.sessionToken) : null;
  if (!claims || !claims.membershipId || !claims.userId || !claims.role || !claims.institutionId) {
    return { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
  }
  return {
    valid: true, userId: String(claims.userId), roleId: String(claims.role),
    membershipId: String(claims.membershipId), institutionId: String(claims.institutionId)
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
  if (!actor || !actor.roleId || typeof getDynamicPermissionsForRole !== "function") return false;
  var permission = getDynamicPermissionsForRole(actor.roleId, "importDataWithColumnMapping");
  return permission === true || !!(permission && permission.authorized === true);
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
  if (scope.institutionWide) {
    if (!accountingHasInstitutionalImportPermission_({ roleId: scope.roleId, userId: scope.userId })) {
      return { valid: false, code: "DEPARTMENT_IMPORT_INSTITUTION_WIDE_UNAUTHORIZED" };
    }
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
  var institutionId = String(PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") || "").trim();
  if (!institutionId) return { status: "error", code: "INSTITUTION_CONTEXT_REQUIRED", validForImport: false, errores: [] };
  var sourceName = String(input.sistemaOrigen || "").trim();
  var entityType = String(input.tipoEntidad || "").trim().toLowerCase();
  var schema = MIGRATION_OWNER_SCHEMAS_ && MIGRATION_OWNER_SCHEMAS_[entityType];
  if (!schema || !sourceName || !Array.isArray(input.filasData) || !input.filasData.length) {
    return { status: "error", code: "IMPORT_SCHEMA_OR_DATA_INVALID", validForImport: false, errores: [] };
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var identitySnapshot = buildAccountingIdentityMapSnapshot_(input, ss);
  var structural = input.analisisEstructural || {};
  var errors = [];
  var warnings = [];
  var structuralBlockers = [];
  function addError(code, message, rowNumber) {
    var item = { codigo: code, mensaje: message };
    if (rowNumber !== undefined && rowNumber !== null) item.fila = rowNumber;
    errors.push(item);
    if (["DUPLICATE_HEADERS", "UNRESOLVED_FORMULAS", "REPEATED_HEADER_ROWS", "VISIBLE_SHEET_SELECTION_REQUIRED"].indexOf(code) !== -1) structuralBlockers.push(item);
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
  var targetSnapshot = buildMigrationTargetExistenceSnapshot_(schema, preparedRows, institutionId, ss);
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
    previewHash: previewHash,
    errores: errors,
    advertencias: warnings,
    resumenValidation: {
      erroresBloqueantes: errors.length,
      advertencias: warnings.length,
      sobrescriturasDetectadas: overwrites.length,
      existenciaDestinoVerificada: targetSnapshot.verified,
      requiereConfirmacion: errors.length > 0 || warnings.length > 0 || overwrites.length > 0
    },
    analisisEstructural: structural
  };
}

function validateImportPreview(payload) {
  return buildImportPreview_(payload);
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
  var rowsToWrite = partial ? preview.validRowIndexes : preview.validRowIndexes;
  try {
    rowsToWrite.forEach(function(index) {
      var row = preview.preparedRows[preview.validRowIndexes.indexOf(index)];
      var schema = MIGRATION_OWNER_SCHEMAS_[input.tipoEntidad];
      var service = String(schema.service || "").toUpperCase();
      var original = input.filasData[index] || {};
      var legacyId = String(original[(input.columnaMapeo || {}).identificador] || "").trim();
      var idempotencyKey = migrationHash_(migrationStableJson_({
        previewHash: preview.previewHash, entityType: input.tipoEntidad, legacyId: legacyId, entity: row
      }));
      var result = sendMigrationOwnerRequest_(service, "writeMigratedEntity", {
        sessionToken: input.sessionToken,
        institutionId: PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID"),
        entity: row,
        source: { fileName: input.nombreArchivo || "", sourceSystem: input.sistemaOrigen || "", legacyId: legacyId },
        idempotencyKey: idempotencyKey
      });
      if (!result || result.status !== "success") throw new Error("MIGRATION_OWNER_WRITE_FAILED");
      applied.push({ service: service, entityType: input.tipoEntidad, payload: row });
    });
    var audit = getOrCreateSheet("AuditoriaMigraciones");
    audit.appendRow([
      runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
      String(input.tipoEntidad || ""), String(input.destinoModulo || ""), applied.length,
      new Date(), JSON.stringify(warnings), JSON.stringify(errors),
      preview.previewHash, partial ? "PARTIAL" : "COMPLETED", actor.userId || ""
    ]);
    return {
      status: "success",
      estado: partial ? "partial" : "completed",
      registrosEscritos: applied.length,
      filasOmitidasPorValidacion: Math.max(0, input.filasData.length - applied.length),
      errores: (preview.errores || []).map(function(item) {
        return { error: item.error || item.codigo, fila: item.fila, mensaje: item.mensaje || item.codigo };
      }),
      advertencias: warnings,
      runId: runId
    };
  } catch (error) {
    if (applied.length) rollbackMigrationOwnerWrites_(applied);
    errors.push({ severity: "ERROR", codigo: "MIGRATION_BATCH_ROLLED_BACK", message: String(error && error.message || error) });
    var auditRollback = getOrCreateSheet("AuditoriaMigraciones");
    auditRollback.appendRow([
      runId, String(input.nombreArchivo || ""), String(input.sistemaOrigen || ""),
      String(input.tipoEntidad || ""), String(input.destinoModulo || ""), 0,
      new Date(), JSON.stringify(warnings), JSON.stringify(errors),
      preview.previewHash, "ROLLED_BACK", (actor.userId || "")
    ]);
    return { status: "error", estado: "rolled_back", registrosEscritos: 0, errores: errors, runId: runId };
  }
}


/* Runtime configuration and fail-closed service adapters. */
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "";
var MIGRATION_OWNER_SCHEMAS_ = {
  curso: { service: "ACCOUNTING", sheet: "Cursos", headers: ["CursoID", "Nombre", "Nota", "FechaInicio"] },
  estudiante: { service: "ACADEMIC", sheet: "Estudiantes", headers: ["EstudianteID", "PersonaID"] }
};

function getVerifiedAccountingIdentity_(payload) {
  if (!payload || !payload.sessionToken || typeof getUserVerifiedRole !== "function" || typeof getUserContextScope !== "function") {
    return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
  }
  var role = getUserVerifiedRole(payload);
  if (!role || role === "NO_ACCESS" || role === "SIN_ACCESO") return { authorized: false, code: "AUTH_PERMISSION_DENIED" };
  if (typeof validateRolePermission !== "function") return { authorized: false, code: "ROLE_PERMISSION_CHECK_UNAVAILABLE" };
  var permission = validateRolePermission("importDataWithColumnMapping", payload);
  if (!permission || permission.authorized !== true) return { authorized: false, code: "AUTH_PERMISSION_DENIED" };
  var scope = getUserContextScope(payload);
  var configuredInstitution = String(PropertiesService.getScriptProperties().getProperty("INSTITUTION_ID") || "").trim();
  if (!scope || scope.status !== "success" || scope.authorized !== true ||
      !scope.userId || !scope.institutionId || String(scope.institutionId) !== configuredInstitution) {
    return { authorized: false, code: "INSTITUTION_SCOPE_DENIED" };
  }
  return { authorized: true, userId: String(scope.userId), role: String(scope.role || role), institutionId: configuredInstitution };
}

function sendMigrationOwnerRequest_(service, action, payload) {
  var properties = PropertiesService.getScriptProperties();
  var endpoint = String(properties.getProperty("MIGRATION_OWNER_API_URL") || "").trim();
  var secret = String(properties.getProperty("MIGRATION_OWNER_API_SECRET") || "").trim();
  if (!endpoint || !secret || typeof UrlFetchApp === "undefined") throw new Error("MIGRATION_OWNER_SERVICE_NOT_CONFIGURED");
  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secret },
    payload: JSON.stringify({ service: service, action: action, payload: payload }),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  var body = {};
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
      sendMigrationOwnerRequest_(item.service, "rollbackMigratedEntity", {
        entityType: item.entityType,
        entity: item.payload,
        idempotencyKey: migrationHash_(migrationStableJson_({ action: "rollback", entityType: item.entityType, entity: item.payload }))
      });
    } catch (error) {
      failures.push({ entityType: item.entityType, code: String(error && error.message || error) });
    }
  });
  return failures;
}

function getOrCreateSheet(name) {
  if (!SPREADSHEET_ID) throw new Error("SPREADSHEET_NOT_CONFIGURED");
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
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
