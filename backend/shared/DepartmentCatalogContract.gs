/**
 * Neutral, source-agnostic department catalog contract.
 * This module does not select an institutional authority or read/write production data.
 * A tenant/domain must supply an approved configuration and, when needed, an approved crosswalk.
 */
function validateDepartmentCatalogConfiguration_(config) {
  if (!config || typeof config !== "object") return { valid: false, code: "DEPARTMENT_AUTHORITY_UNCONFIGURED" };
  var required = ["institutionId", "domain", "sourceCatalog", "keyField", "statusField", "authorityMode", "version", "approvalReference"];
  for (var i = 0; i < required.length; i++) {
    if (!String(config[required[i]] || "").trim()) return { valid: false, code: "DEPARTMENT_AUTHORITY_UNCONFIGURED", field: required[i] };
  }
  if (config.authorityApproved !== true) return { valid: false, code: "DEPARTMENT_AUTHORITY_NOT_APPROVED" };
  if (["SOURCE", "CROSSWALK"].indexOf(String(config.authorityMode).trim().toUpperCase()) === -1) return { valid: false, code: "DEPARTMENT_AUTHORITY_MODE_INVALID" };
  var keyField = String(config.keyField).trim();
  if (keyField === String(config.nameField || "").trim() || (config.codeField && keyField === String(config.codeField).trim())) {
    return { valid: false, code: "DEPARTMENT_STABLE_KEY_REQUIRED" };
  }
  if (config.activeStates !== undefined && (!Array.isArray(config.activeStates) || !config.activeStates.length)) {
    return { valid: false, code: "DEPARTMENT_ACTIVE_STATES_INVALID" };
  }
  if (String(config.authorityMode).trim().toUpperCase() === "CROSSWALK" &&
      (!String(config.canonicalCatalog || "").trim() || !String(config.canonicalKeyField || "").trim() ||
       !String(config.canonicalStatusField || "").trim() || config.canonicalAuthorityApproved !== true ||
       !String(config.canonicalApprovalReference || "").trim())) {
    return { valid: false, code: "DEPARTMENT_CANONICAL_AUTHORITY_UNCONFIGURED" };
  }
  return { valid: true, config: config };
}

function validateDepartmentCatalogSnapshot_(config, records, effectiveAt) {
  var configuration = validateDepartmentCatalogConfiguration_(config);
  if (!configuration.valid) return configuration;
  if (!Array.isArray(records)) return { valid: false, code: "DEPARTMENT_SOURCE_SNAPSHOT_INVALID" };
  var at = effectiveAt instanceof Date ? effectiveAt : new Date(effectiveAt === undefined || effectiveAt === null || effectiveAt === "" ? Date.now() : effectiveAt);
  if (isNaN(at.getTime())) return { valid: false, code: "DEPARTMENT_EFFECTIVE_DATE_INVALID" };
  var keyField = String(config.keyField).trim(), codeMap = Object.create(null), recordsById = Object.create(null);
  for (var i = 0; i < records.length; i++) {
    var record = records[i] || {}, id = String(record[keyField] || "").trim();
    if (!id) return { valid: false, code: "DEPARTMENT_SOURCE_KEY_MISSING", rowIndex: i };
    if (Object.prototype.hasOwnProperty.call(recordsById, id)) return { valid: false, code: "DEPARTMENT_SOURCE_KEY_AMBIGUOUS", sourceId: id };
    recordsById[id] = record;
    if (config.codeField && config.codeNamespaceField) {
      var code = String(record[config.codeField] || "").trim(), namespace = String(record[config.codeNamespaceField] || "").trim();
      if (code && !namespace) return { valid: false, code: "DEPARTMENT_CODE_NAMESPACE_REQUIRED", sourceId: id };
      var activeStates = (config.activeStates || ["ACTIVE", "ACTIVO", "ACTIVA", "TRUE"]).map(function(v) { return String(v).trim().toUpperCase(); });
      var state = record[config.statusField] === true ? "TRUE" : String(record[config.statusField] || "").trim().toUpperCase();
      var fromValue = config.validFromField ? record[config.validFromField] : "", toValue = config.validToField ? record[config.validToField] : "";
      var fromDate = fromValue === "" || fromValue === null || fromValue === undefined ? null : new Date(fromValue);
      var toDate = toValue === "" || toValue === null || toValue === undefined ? null : new Date(toValue);
      var effective = activeStates.indexOf(state) !== -1 && (!fromDate || (!isNaN(fromDate.getTime()) && fromDate.getTime() <= at.getTime())) &&
        (!toDate || (!isNaN(toDate.getTime()) && toDate.getTime() >= at.getTime()));
      if (code && effective) {
        var codeKey = namespace + "::" + code.toUpperCase();
        if (!Object.prototype.hasOwnProperty.call(codeMap, codeKey)) codeMap[codeKey] = [];
        codeMap[codeKey].push(id);
      }
    }
  }
  if (config.parentField) {
    var parentField = String(config.parentField).trim();
    for (var id in recordsById) {
      var parentId = String(recordsById[id][parentField] || "").trim();
      if (parentId && !Object.prototype.hasOwnProperty.call(recordsById, parentId)) return { valid: false, code: "DEPARTMENT_PARENT_NOT_FOUND", sourceId: id, parentId: parentId };
    }
    var visiting = Object.create(null), visited = Object.create(null);
    var visit = function(id) {
      if (Object.prototype.hasOwnProperty.call(visiting, id)) return false;
      if (Object.prototype.hasOwnProperty.call(visited, id)) return true;
      visiting[id] = true;
      var parentId = String(recordsById[id][parentField] || "").trim();
      if (parentId && !visit(parentId)) return false;
      delete visiting[id]; visited[id] = true; return true;
    };
    for (var id in recordsById) if (!visit(id)) return { valid: false, code: "DEPARTMENT_HIERARCHY_CYCLE", sourceId: id };
  }
  return { valid: true, recordsById: recordsById, codeMap: codeMap, effectiveAt: at };
}

function resolveDepartmentCatalogReference_(input) {
  input = input || {};
  var config = input.config || {}, sourceId = String(input.sourceId || "").trim();
  if (!sourceId) return { resolved: false, code: "DEPARTMENT_SOURCE_KEY_REQUIRED" };
  var snapshot = validateDepartmentCatalogSnapshot_(config, input.records, input.effectiveAt);
  if (!snapshot.valid) return { resolved: false, code: snapshot.code, detail: snapshot };
  var sourceRecord = snapshot.recordsById[sourceId];
  if (!sourceRecord) return { resolved: false, code: "DEPARTMENT_SOURCE_KEY_NOT_FOUND", sourceId: sourceId };
  var activeStates = (config.activeStates || ["ACTIVE", "ACTIVO", "ACTIVA", "TRUE"]).map(function(v) { return String(v).trim().toUpperCase(); });
  var sourceState = sourceRecord[config.statusField] === true ? "TRUE" : String(sourceRecord[config.statusField] || "").trim().toUpperCase();
  if (activeStates.indexOf(sourceState) === -1) return { resolved: false, code: "DEPARTMENT_SOURCE_INACTIVE", sourceId: sourceId };
  var startValue = config.validFromField ? sourceRecord[config.validFromField] : "";
  var endValue = config.validToField ? sourceRecord[config.validToField] : "";
  var startDate = startValue === "" || startValue === null || startValue === undefined ? null : (startValue instanceof Date ? startValue : new Date(startValue));
  var endDate = endValue === "" || endValue === null || endValue === undefined ? null : (endValue instanceof Date ? endValue : new Date(endValue));
  if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) return { resolved: false, code: "DEPARTMENT_SOURCE_DATE_INVALID", sourceId: sourceId };
  if (startDate && startDate.getTime() > snapshot.effectiveAt.getTime()) return { resolved: false, code: "DEPARTMENT_SOURCE_NOT_YET_VALID", sourceId: sourceId };
  if (endDate && endDate.getTime() < snapshot.effectiveAt.getTime()) return { resolved: false, code: "DEPARTMENT_SOURCE_EXPIRED", sourceId: sourceId };
  if (config.codeField && config.codeNamespaceField) {
    var sourceCode = String(sourceRecord[config.codeField] || "").trim(), sourceNamespace = String(sourceRecord[config.codeNamespaceField] || "").trim();
    var duplicateCodes = sourceCode ? snapshot.codeMap[sourceNamespace + "::" + sourceCode.toUpperCase()] || [] : [];
    if (duplicateCodes.length > 1) return { resolved: false, code: "DEPARTMENT_CODE_AMBIGUOUS", sourceId: sourceId, namespace: sourceNamespace, codeValue: sourceCode };
  }
  var canonicalId = sourceId, mapping = null;
  if (String(config.authorityMode).trim().toUpperCase() === "CROSSWALK") {
    var mappings = (Array.isArray(input.crosswalk) ? input.crosswalk : []).filter(function(item) {
      if (!item) return false;
      if (String(item.institutionId || "").trim() !== String(config.institutionId).trim()) return false;
      if (String(item.domain || "").trim() !== String(config.domain).trim()) return false;
      if (String(item.sourceCatalog || "").trim() !== String(config.sourceCatalog).trim()) return false;
      if (String(item.sourceId || "").trim() !== sourceId) return false;
      var status = String(item.status || "").trim().toUpperCase();
      if (item.approved !== true || !String(item.approvalReference || "").trim() || ["ACTIVE", "ACTIVO", "ACTIVA"].indexOf(status) === -1) return false;
      var start = item.validFrom === "" || item.validFrom === null || item.validFrom === undefined ? null : new Date(item.validFrom);
      var end = item.validTo === "" || item.validTo === null || item.validTo === undefined ? null : new Date(item.validTo);
      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) return false;
      if (start && start.getTime() > snapshot.effectiveAt.getTime()) return false;
      if (end && end.getTime() < snapshot.effectiveAt.getTime()) return false;
      return !!String(item.canonicalId || "").trim();
    });
    var requestedCanonicalId = String(input.requestedCanonicalId || "").trim();
    if (requestedCanonicalId) mappings = mappings.filter(function(item) { return String(item.canonicalId).trim() === requestedCanonicalId; });
    if (!mappings.length) return { resolved: false, code: "DEPARTMENT_CROSSWALK_NOT_FOUND", sourceId: sourceId };
    if (mappings.length !== 1) return { resolved: false, code: "DEPARTMENT_CROSSWALK_AMBIGUOUS", sourceId: sourceId, candidates: mappings.map(function(item) { return String(item.canonicalId).trim(); }) };
    mapping = mappings[0]; canonicalId = String(mapping.canonicalId).trim();
    var canonicalRecords = Array.isArray(input.canonicalRecords) ? input.canonicalRecords : [];
    var canonicalMatches = canonicalRecords.filter(function(record) { return String(record && record[config.canonicalKeyField] || "").trim() === canonicalId; });
    if (!canonicalMatches.length) return { resolved: false, code: "DEPARTMENT_CANONICAL_KEY_NOT_FOUND", canonicalId: canonicalId };
    if (canonicalMatches.length !== 1) return { resolved: false, code: "DEPARTMENT_CANONICAL_KEY_AMBIGUOUS", canonicalId: canonicalId };
    var canonicalRecord = canonicalMatches[0], canonicalState = canonicalRecord[config.canonicalStatusField] === true ? "TRUE" : String(canonicalRecord[config.canonicalStatusField] || "").trim().toUpperCase();
    var canonicalActiveStates = (config.canonicalActiveStates || ["ACTIVE", "ACTIVO", "ACTIVA", "TRUE"]).map(function(v) { return String(v).trim().toUpperCase(); });
    if (canonicalActiveStates.indexOf(canonicalState) === -1) return { resolved: false, code: "DEPARTMENT_CANONICAL_INACTIVE", canonicalId: canonicalId };
    var canonicalFrom = config.canonicalValidFromField ? canonicalRecord[config.canonicalValidFromField] : "";
    var canonicalTo = config.canonicalValidToField ? canonicalRecord[config.canonicalValidToField] : "";
    var canonicalStart = canonicalFrom === "" || canonicalFrom === null || canonicalFrom === undefined ? null : new Date(canonicalFrom);
    var canonicalEnd = canonicalTo === "" || canonicalTo === null || canonicalTo === undefined ? null : new Date(canonicalTo);
    if ((canonicalStart && isNaN(canonicalStart.getTime())) || (canonicalEnd && isNaN(canonicalEnd.getTime()))) return { resolved: false, code: "DEPARTMENT_CANONICAL_DATE_INVALID", canonicalId: canonicalId };
    if (canonicalStart && canonicalStart.getTime() > snapshot.effectiveAt.getTime()) return { resolved: false, code: "DEPARTMENT_CANONICAL_NOT_YET_VALID", canonicalId: canonicalId };
    if (canonicalEnd && canonicalEnd.getTime() < snapshot.effectiveAt.getTime()) return { resolved: false, code: "DEPARTMENT_CANONICAL_EXPIRED", canonicalId: canonicalId };
  }
  var name = config.nameField ? String(sourceRecord[config.nameField] || "").trim() : "";
  var parentId = config.parentField ? String(sourceRecord[config.parentField] || "").trim() : "";
  return {
    resolved: true,
    institutionId: String(config.institutionId).trim(),
    domain: String(config.domain).trim(),
    sourceCatalog: String(config.sourceCatalog).trim(),
    sourceId: sourceId,
    canonicalId: canonicalId,
    name: name,
    parentId: parentId || null,
    sourceVersion: String(config.version).trim(),
    mappingApprovalReference: mapping ? String(mapping.approvalReference).trim() : String(config.approvalReference).trim(),
    effectiveAt: snapshot.effectiveAt.toISOString()
  };
}


/**
 * Evaluates the configurable interdepartmental reference policy.
 * All actor, ownership, institutional-config and grant snapshots must be
 * server-derived and current. The caller persists auditEvent before disclosure
 * and still enforces the ordinary RBAC operation permission.
 */
function evaluateDepartmentReferenceAccess_(input) {
  var cfg = input || {};
  var actor = cfg.actorContext || {};
  var owner = cfg.resourceOwnership || {};
  var config = cfg.institutionalConfig || {};
  var nowValue = cfg.now;
  var now = nowValue instanceof Date ? nowValue.getTime() : (typeof nowValue === "number" ? nowValue : Date.parse(String(nowValue || "")));
  var institutionId = String(actor.institutionId || "").trim();
  var requesterDepartmentId = String(actor.activeDepartmentId || "").trim();
  var ownerDepartmentId = String(owner.departmentId || "").trim();
  var resourceType = String(owner.resourceType || "").trim().toUpperCase();
  var resourceId = String(owner.resourceId || "").trim();
  var operation = String(cfg.operation || "").trim().toUpperCase();
  var policy = String(config.POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL || "").trim().toUpperCase() || "BLOQUEO_TOTAL_CROSS_DEPARTAMENTO";
  var allowedPolicies = ["BLOQUEO_TOTAL_CROSS_DEPARTAMENTO", "PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL"];
  var operations = ["READ_METADATA", "READ_CONTENT", "DOWNLOAD", "CREATE", "EDIT", "DELETE", "APPROVE", "SIGN", "SHARE", "REVOKE", "EXPORT", "READ_HISTORY", "READ_REFERENCE"];
  var checkedAt = isFinite(now) ? new Date(now).toISOString() : null;
  var audit = function(allowed, code, grant) {
    return {
      actorUserId: String(actor.userId || "").trim() || null,
      membershipId: String(actor.membershipId || "").trim() || null,
      roleId: String(actor.roleId || "").trim() || null,
      institutionId: institutionId || null,
      requestingDepartmentId: requesterDepartmentId || null,
      ownerDepartmentId: ownerDepartmentId || null,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      operation: operation || null,
      decision: allowed ? "ALLOW" : "DENY",
      reasonCode: code,
      grantId: grant ? String(grant.grantId || "").trim() || null : null,
      authorizedBy: grant ? String(grant.authorizedBy || "").trim() || null : null,
      checkedAt: checkedAt
    };
  };
  var result = function(allowed, code, mode, grant, fields, documents) {
    return {
      allowed: allowed,
      mode: mode,
      reasonCode: code,
      grantId: grant ? String(grant.grantId || "").trim() || null : null,
      authorizedBy: grant ? String(grant.authorizedBy || "").trim() || null : null,
      allowedFields: fields || [],
      allowedDocumentIds: documents || [],
      requiresStandardAuthorization: true,
      auditEvent: audit(allowed, code, grant)
    };
  };
  var deny = function(code) { return result(false, code, "DENY", null, [], []); };

  if (!isFinite(now)) return deny("DEPARTMENT_POLICY_CLOCK_INVALID");
  if (!institutionId || actor.verified !== true || !String(actor.userId || "").trim() ||
      !String(actor.membershipId || "").trim() || !String(actor.roleId || "").trim()) return deny("VERIFIED_ACTOR_CONTEXT_REQUIRED");
  if (Object.keys(config).length && !String(config.institutionId || "").trim()) return deny("DEPARTMENT_POLICY_CONFIG_UNSCOPED");
  if (config.institutionId && String(config.institutionId).trim() !== institutionId) return deny("DEPARTMENT_POLICY_TENANT_MISMATCH");
  if (allowedPolicies.indexOf(policy) < 0) return deny("DEPARTMENT_ISOLATION_POLICY_INVALID");
  if (owner.verified !== true) return deny("RESOURCE_OWNERSHIP_UNVERIFIED");
  if (String(owner.institutionId || "").trim() !== institutionId) return deny("DEPARTMENT_POLICY_TENANT_MISMATCH");
  if (!ownerDepartmentId || !resourceType || !resourceId) return deny("RESOURCE_OWNER_REFERENCE_INVALID");
  if (operations.indexOf(operation) < 0) return deny("DEPARTMENT_OPERATION_INVALID");

  if (actor.institutionWide === true) {
    if (actor.institutionWideAuthorized === true) return result(true, "INSTITUTION_WIDE_AUTHORIZED", "INSTITUTION_WIDE", null, [], []);
    return deny("INSTITUTION_WIDE_SCOPE_UNAUTHORIZED");
  }
  if (!requesterDepartmentId) return deny("DEPARTMENT_SCOPE_REQUIRED");
  if (requesterDepartmentId === ownerDepartmentId) return result(true, "SAME_DEPARTMENT", "SAME_DEPARTMENT", null, [], []);
  if (policy === "BLOQUEO_TOTAL_CROSS_DEPARTAMENTO") return deny("CROSS_DEPARTMENT_REFERENCE_BLOCKED");
  if (operation !== "READ_REFERENCE") return deny("CROSS_DEPARTMENT_OPERATION_DENIED");

  var requestedFields = Array.isArray(cfg.requestedFields) ? cfg.requestedFields.map(function(x) { return String(x || "").trim(); }).filter(Boolean) : [];
  var requestedDocuments = Array.isArray(cfg.requestedDocumentIds) ? cfg.requestedDocumentIds.map(function(x) { return String(x || "").trim(); }).filter(Boolean) : [];
  if (!requestedFields.length) return deny("DEPARTMENT_REFERENCE_FIELDS_REQUIRED");
  var grants = (Array.isArray(cfg.referenceGrants) ? cfg.referenceGrants : []).filter(function(grant) {
    return grant && String(grant.institutionId || "").trim() === institutionId &&
      String(grant.resourceType || "").trim().toUpperCase() === resourceType &&
      String(grant.resourceId || "").trim() === resourceId &&
      String(grant.ownerDepartmentId || "").trim() === ownerDepartmentId &&
      String(grant.targetDepartmentId || "").trim() === requesterDepartmentId &&
      String(grant.status || "").trim().toUpperCase() === "ACTIVE" &&
      !String(grant.revokedAt || "").trim();
  }).filter(function(grant) {
    var start = String(grant.validFrom || "").trim(), expiry = String(grant.expiresAt || "").trim();
    var authorizedAt = String(grant.authorizedAt || "").trim();
    var startTime = start ? Date.parse(start) : NaN;
    var expiryTime = expiry ? Date.parse(expiry) : NaN;
    var authorizedTime = authorizedAt ? Date.parse(authorizedAt) : NaN;
    return !!start && !!expiry && !!authorizedAt && isFinite(startTime) && isFinite(expiryTime) &&
      isFinite(authorizedTime) && authorizedTime <= now && startTime <= now && expiryTime > now;
  });
  if (grants.length !== 1) return deny(grants.length > 1 ? "DEPARTMENT_REFERENCE_GRANT_AMBIGUOUS" : "DEPARTMENT_REFERENCE_GRANT_NOT_FOUND");
  var grant = grants[0];
  var grantId = String(grant.grantId || "").trim();
  var authorizedBy = String(grant.authorizedBy || "").trim();
  var allowedFields = Array.isArray(grant.allowedFields) ? grant.allowedFields.map(function(x) { return String(x || "").trim(); }).filter(Boolean) : [];
  var allowedDocuments = Array.isArray(grant.allowedDocumentIds) ? grant.allowedDocumentIds.map(function(x) { return String(x || "").trim(); }).filter(Boolean) : [];
  if (!grantId || !authorizedBy || !allowedFields.length || allowedFields.indexOf("*") !== -1 || allowedDocuments.indexOf("*") !== -1) return result(false, "DEPARTMENT_REFERENCE_GRANT_INVALID", "DENY", grant, allowedFields, allowedDocuments);
  if (requestedFields.some(function(field) { return allowedFields.indexOf(field) < 0; })) return result(false, "DEPARTMENT_REFERENCE_FIELD_DENIED", "DENY", grant, allowedFields, allowedDocuments);
  if (requestedDocuments.some(function(documentId) { return allowedDocuments.indexOf(documentId) < 0; })) return result(false, "DEPARTMENT_REFERENCE_DOCUMENT_DENIED", "DENY", grant, allowedFields, allowedDocuments);
  return result(true, "READ_ONLY_REFERENCE_AUTHORIZED", "READ_ONLY_REFERENCE", grant, requestedFields, requestedDocuments);
}
