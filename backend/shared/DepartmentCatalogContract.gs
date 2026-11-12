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
      if (String(item.canonicalCatalog || "").trim() !== String(config.canonicalCatalog).trim()) return false;
      if (String(item.sourceId || "").trim() !== sourceId) return false;
      var status = String(item.status || "").trim().toUpperCase();
      var approvedAtValue = item.approvedAt;
      var approvedAt = approvedAtValue === "" || approvedAtValue === null || approvedAtValue === undefined ? null : (approvedAtValue instanceof Date ? approvedAtValue : new Date(approvedAtValue));
      if (item.approved !== true || !String(item.approvalReference || "").trim() || !String(item.approvedBy || "").trim() || !approvedAt || isNaN(approvedAt.getTime()) || approvedAt.getTime() > snapshot.effectiveAt.getTime() || String(item.revokedAt || "").trim() || ["ACTIVE", "ACTIVO", "ACTIVA"].indexOf(status) === -1) return false;
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
      requestedFields: Array.isArray(cfg.requestedFields) ? cfg.requestedFields.map(function(x) { return String(x || "").trim(); }).filter(Boolean) : [],
      requestedDocumentIds: Array.isArray(cfg.requestedDocumentIds) ? cfg.requestedDocumentIds.map(function(x) { return String(x || "").trim(); }).filter(Boolean) : [],
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
  if (!grantId || !authorizedBy || !allowedFields.length || allowedFields.indexOf("*") !== -1 || allowedDocuments.indexOf("*") !== -1) return result(false, "DEPARTMENT_REFERENCE_GRANT_INVALID", "DENY", grant, [], []);
  if (requestedFields.some(function(field) { return allowedFields.indexOf(field) < 0; })) return result(false, "DEPARTMENT_REFERENCE_FIELD_DENIED", "DENY", grant, [], []);
  if (requestedDocuments.some(function(documentId) { return allowedDocuments.indexOf(documentId) < 0; })) return result(false, "DEPARTMENT_REFERENCE_DOCUMENT_DENIED", "DENY", grant, [], []);
  return result(true, "READ_ONLY_REFERENCE_AUTHORIZED", "READ_ONLY_REFERENCE", grant, requestedFields, requestedDocuments);
}


/**
 * Validates a department identity/lifecycle event against an approved, tenant-scoped
 * state machine. Pure contract: no writes, ID changes, resource transfer or activation.
 */

/**
 * Filters server-loaded list/search rows by verified department ownership.
 * The caller must persist auditEvents internally and still apply operation-level RBAC.
 */
function filterDepartmentScopedRecords_(input) {
  var cfg=input||{},actor=cfg.actorContext||{},records=cfg.records,ownershipRows=cfg.ownershipRows;
  var fail=function(code){return {allowed:false,code:code,records:[],auditEvents:[],requiresStandardAuthorization:true};};
  var institutionId=String(actor.institutionId||"").trim(),domain=String(cfg.domain||"").trim();
  if(actor.verified!==true||!String(actor.userId||"").trim()||!String(actor.membershipId||"").trim()||!String(actor.roleId||"").trim()||!institutionId||!domain)return fail("DEPARTMENT_QUERY_VERIFIED_ACTOR_REQUIRED");
  if(cfg.snapshotScopeVerified!==true||String(cfg.snapshotInstitutionId||"").trim()!==institutionId||String(cfg.snapshotDomain||"").trim()!==domain)return fail("DEPARTMENT_QUERY_SNAPSHOT_SCOPE_UNVERIFIED");
  if(cfg.ownershipScopeVerified!==true||String(cfg.ownershipInstitutionId||"").trim()!==institutionId||String(cfg.ownershipDomain||"").trim()!==domain)return fail("DEPARTMENT_QUERY_OWNERSHIP_SCOPE_UNVERIFIED");
  if(!Array.isArray(records)||!Array.isArray(ownershipRows))return fail("DEPARTMENT_QUERY_INPUT_INVALID");
  var ownership=Object.create(null),i;
  for(i=0;i<ownershipRows.length;i++){
    var row=ownershipRows[i]||{},type=String(row.resourceType||"").trim().toUpperCase(),id=String(row.resourceId||"").trim(),key=type+"|"+id;
    if(row.verified!==true||String(row.institutionId||"").trim()!==institutionId||!String(row.departmentId||"").trim()||!type||!id)return fail("DEPARTMENT_QUERY_OWNERSHIP_INVALID");
    if(Object.prototype.hasOwnProperty.call(ownership,key))return fail("DEPARTMENT_QUERY_OWNERSHIP_AMBIGUOUS");
    ownership[key]=row;
  }
  var visible=[],auditEvents=[];
  for(i=0;i<records.length;i++){
    var record=records[i]||{},recordType=String(record.resourceType||"").trim().toUpperCase(),recordId=String(record.resourceId||"").trim(),recordKey=recordType+"|"+recordId;
    if(!recordType||!recordId||!Object.prototype.hasOwnProperty.call(ownership,recordKey))return fail("DEPARTMENT_QUERY_OWNERSHIP_MISSING");
    var owner=ownership[recordKey];
    var decisionActor=actor;
    if(actor.institutionWide!==true&&Array.isArray(actor.authorizedDepartmentIds)){
      var allowedDepartment=actor.authorizedDepartmentIds.some(function(value){return String(value||"").trim()===String(owner.departmentId||"").trim();});
      decisionActor={};Object.keys(actor).forEach(function(key){decisionActor[key]=actor[key];});
      decisionActor.activeDepartmentId=String(actor.activeDepartmentId||"").trim()||(allowedDepartment?String(owner.departmentId).trim():"");
    }
    var decision=evaluateDepartmentReferenceAccess_({actorContext:decisionActor,resourceOwnership:{verified:true,institutionId:institutionId,departmentId:owner.departmentId,resourceType:recordType,resourceId:recordId},institutionalConfig:cfg.institutionalConfig||{},operation:"READ_METADATA",now:cfg.now});
    auditEvents.push(decision.auditEvent);
    if(decision.allowed)visible.push(record);
  }
  return {allowed:true,code:"DEPARTMENT_QUERY_FILTERED",records:visible,auditEvents:auditEvents,requiresStandardAuthorization:true,excludedRecordsNotDisclosed:true};
}
/**
 * Validates a whole import batch before writes. Server-verified membership and target
 * department snapshots are mandatory; mixed-department batches fail closed.
 */
function validateDepartmentalImportScope_(input) {
  var cfg=input||{},actor=cfg.actorContext||{},rows=cfg.rows;
  var fail=function(code){return {valid:false,code:code,departmentId:null,rowCount:0,writesPerformed:false};};
  var institutionId=String(actor.institutionId||"").trim(),domain=String(cfg.domain||"").trim(),target=String(cfg.targetDepartmentId||"").trim();
  if(actor.verified!==true||!String(actor.userId||"").trim()||!String(actor.membershipId||"").trim()||!String(actor.roleId||"").trim()||!institutionId||!domain)return fail("DEPARTMENT_IMPORT_VERIFIED_ACTOR_REQUIRED");
  if(cfg.snapshotScopeVerified!==true||String(cfg.snapshotInstitutionId||"").trim()!==institutionId||String(cfg.snapshotDomain||"").trim()!==domain)return fail("DEPARTMENT_IMPORT_SNAPSHOT_SCOPE_UNVERIFIED");
  if(cfg.targetDepartmentVerified!==true||String(cfg.targetInstitutionId||"").trim()!==institutionId||String(cfg.targetDomain||"").trim()!==domain||!target)return fail("DEPARTMENT_IMPORT_TARGET_UNVERIFIED");
  if(cfg.membershipsVerified!==true||!Array.isArray(cfg.authorizedDepartmentIds))return fail("DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED");
  var allowed=Object.create(null);
  for(var i=0;i<cfg.authorizedDepartmentIds.length;i++){var dep=String(cfg.authorizedDepartmentIds[i]||"").trim();if(!dep||Object.prototype.hasOwnProperty.call(allowed,dep))return fail("DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_INVALID");allowed[dep]=true;}
  if(actor.institutionWide===true){if(actor.institutionWideAuthorized!==true)return fail("DEPARTMENT_IMPORT_INSTITUTION_WIDE_UNAUTHORIZED");}
  else if(!Object.prototype.hasOwnProperty.call(allowed,target))return fail("DEPARTMENT_IMPORT_TARGET_NOT_AUTHORIZED");
  if(!Array.isArray(rows)||!rows.length)return fail("DEPARTMENT_IMPORT_ROWS_REQUIRED");
  for(i=0;i<rows.length;i++){
    var row=rows[i]||{},rowDepartment=String(row.departmentId||"").trim(),rowInstitution=String(row.institutionId||"").trim();
    if(rowDepartment&&rowDepartment!==target){
      if(actor.institutionWide!==true||actor.institutionWideAuthorized!==true)return fail("DEPARTMENT_IMPORT_MIXED_DEPARTMENTS");
      if(cfg.rowDepartmentSnapshotVerified!==true||String(cfg.rowDepartmentSnapshotInstitutionId||"").trim()!==institutionId||String(cfg.rowDepartmentSnapshotDomain||"").trim()!==domain||!Array.isArray(cfg.rowDepartmentAssignments))return fail("DEPARTMENT_IMPORT_ROW_TARGETS_UNVERIFIED");
      var rowId=String(row.rowId||row.id||"").trim(),matches=cfg.rowDepartmentAssignments.filter(function(assignment){return assignment&&String(assignment.rowId||"").trim()===rowId;});
      if(!rowId||matches.length!==1||matches[0].verified!==true||String(matches[0].institutionId||"").trim()!==institutionId||String(matches[0].domain||"").trim()!==domain||String(matches[0].departmentId||"").trim()!==rowDepartment)return fail("DEPARTMENT_IMPORT_ROW_TARGET_MISMATCH");
    }
    if(rowInstitution&&rowInstitution!==institutionId)return fail("DEPARTMENT_IMPORT_TENANT_MISMATCH");
  }
  return {valid:true,code:"DEPARTMENT_IMPORT_SCOPE_VALID",institutionId:institutionId,departmentId:target,rowCount:rows.length,writesPerformed:false,requiresAtomicImportValidation:true};
}

function validateDepartmentLifecycleEvent_(input) {
  var cfg = input || {}, config = cfg.config || {}, current = cfg.currentRecord || {}, event = cfg.event || {};
  var fail = function(code) { return { valid: false, idempotent: false, code: code }; };
  var parseTime = function(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    if (value === undefined || value === null || value === "") return NaN;
    return Date.parse(String(value));
  };
  try {
    var institutionId = String(config.institutionId || "").trim();
    var domain = String(config.domain || "").trim();
    var approvalReference = String(config.approvalReference || "").trim();
    if (!institutionId || !domain || config.authorityApproved !== true || !approvalReference || !String(config.version || "").trim()) return fail("DEPARTMENT_LIFECYCLE_CONFIG_UNAPPROVED");
    if (cfg.snapshotScopeVerified !== true || String(cfg.snapshotInstitutionId || "").trim() !== institutionId || String(cfg.snapshotDomain || "").trim() !== domain) return fail("DEPARTMENT_LIFECYCLE_SNAPSHOT_SCOPE_UNVERIFIED");
    var states = Array.isArray(config.states) ? config.states.map(function(x) { return String(x || "").trim().toUpperCase(); }).filter(Boolean) : [];
    var activeStates = Array.isArray(config.activeStates) ? config.activeStates.map(function(x) { return String(x || "").trim().toUpperCase(); }).filter(Boolean) : ["ACTIVE"];
    var eventRules = Array.isArray(config.events) ? config.events : [];
    if (!states.length || !eventRules.length || activeStates.some(function(x) { return states.indexOf(x) < 0; })) return fail("DEPARTMENT_LIFECYCLE_CONFIG_INVALID");

    var departmentId = String(current.departmentId || "").trim();
    var currentState = String(current.status || "").trim().toUpperCase();
    var eventId = String(event.eventId || "").trim();
    var eventDepartmentId = String(event.departmentId || "").trim();
    var eventType = String(event.eventType || "").trim().toUpperCase();
    var changedBy = String(event.changedBy || "").trim();
    var reason = String(event.reason || "").trim();
    var effectiveTime = parseTime(event.effectiveAt), now = parseTime(cfg.now);
    if (!departmentId || !currentState || !eventId || eventDepartmentId !== departmentId || !eventType || !changedBy || !reason) return fail("DEPARTMENT_LIFECYCLE_EVENT_INVALID");
    if (states.indexOf(currentState) < 0) return fail("DEPARTMENT_LIFECYCLE_CURRENT_STATE_INVALID");
    if (!isFinite(effectiveTime) || !isFinite(now)) return fail("DEPARTMENT_LIFECYCLE_DATE_INVALID");
    if (effectiveTime > now) return fail("DEPARTMENT_LIFECYCLE_FUTURE_EVENT_NOT_APPLICABLE");
    var hasCurrentStart = current.validFrom !== undefined && current.validFrom !== null && current.validFrom !== "";
    var hasCurrentEnd = current.validTo !== undefined && current.validTo !== null && current.validTo !== "";
    var currentStart = hasCurrentStart ? parseTime(current.validFrom) : NaN;
    var currentEnd = hasCurrentEnd ? parseTime(current.validTo) : NaN;
    if ((hasCurrentStart && !isFinite(currentStart)) || (hasCurrentEnd && !isFinite(currentEnd))) return fail("DEPARTMENT_LIFECYCLE_CURRENT_DATE_INVALID");
    if (hasCurrentStart && effectiveTime < currentStart) return fail("DEPARTMENT_LIFECYCLE_EVENT_BEFORE_VALIDITY");
    if (hasCurrentEnd && effectiveTime > currentEnd) return fail("DEPARTMENT_LIFECYCLE_EVENT_AFTER_VALIDITY");
    if (cfg.proposedRecord && String(cfg.proposedRecord.departmentId || "").trim() !== departmentId) return fail("DEPARTMENT_STABLE_ID_IMMUTABLE");

    var matchingRules = eventRules.filter(function(rule) { return rule && String(rule.type || "").trim().toUpperCase() === eventType; });
    if (matchingRules.length !== 1) return fail(matchingRules.length > 1 ? "DEPARTMENT_LIFECYCLE_EVENT_RULE_AMBIGUOUS" : "DEPARTMENT_LIFECYCLE_EVENT_NOT_ALLOWED");
    var rule = matchingRules[0], fromState = String(rule.from || "").trim().toUpperCase(), toState = String(rule.to || "").trim().toUpperCase();
    var stateTransition = !!(fromState || toState);
    if (stateTransition && (!fromState || !toState || states.indexOf(fromState) < 0 || states.indexOf(toState) < 0 || fromState === toState)) return fail("DEPARTMENT_LIFECYCLE_TRANSITION_CONFIG_INVALID");
    if (stateTransition && currentState !== fromState) return fail("DEPARTMENT_LIFECYCLE_TRANSITION_NOT_ALLOWED");
    if (rule.requiresApproval !== false && (!String(event.approvedBy || "").trim() || !String(event.approvalReference || "").trim())) return fail("DEPARTMENT_LIFECYCLE_APPROVAL_REQUIRED");

    var eventSignature = JSON.stringify({
      departmentId: departmentId, eventType: eventType, effectiveAt: new Date(effectiveTime).toISOString(),
      changedBy: changedBy, approvedBy: String(event.approvedBy || "").trim(), approvalReference: String(event.approvalReference || "").trim(),
      reason: reason, newName: String(event.newName || "").trim(), newCode: String(event.newCode || "").trim(),
      newNamespace: String(event.newNamespace || "").trim(), newParentId: String(event.newParentId || "").trim(),
      targetDepartmentId: String(event.targetDepartmentId || "").trim(),
      newDepartments: Array.isArray(event.newDepartments) ? event.newDepartments.map(function(x) { return { departmentId: String(x && x.departmentId || "").trim(), name: String(x && x.name || "").trim() }; }) : []
    });
    var history = Array.isArray(cfg.historyRows) ? cfg.historyRows : [];
    for (var h = 0; h < history.length; h++) {
      if (!history[h] || String(history[h].institutionId || "").trim() !== institutionId || String(history[h].domain || "").trim() !== domain) return fail("DEPARTMENT_LIFECYCLE_HISTORY_SCOPE_MISMATCH");
    }
    var sameEventId = history.filter(function(row) { return row && String(row.eventId || "").trim() === eventId; });
    if (sameEventId.length > 1) return fail("DEPARTMENT_LIFECYCLE_EVENT_ID_AMBIGUOUS");
    if (sameEventId.length === 1) {
      if (String(sameEventId[0].eventSignature || "") === eventSignature) return { valid: true, idempotent: true, code: "DEPARTMENT_LIFECYCLE_EVENT_ALREADY_APPLIED", historyRow: sameEventId[0], nextRecord: current };
      return fail("DEPARTMENT_LIFECYCLE_EVENT_ID_COLLISION");
    }
    var previous = history.filter(function(row) { return row && String(row.departmentId || "").trim() === departmentId; });
    var latest = -Infinity;
    for (var i = 0; i < previous.length; i++) {
      var historicalTime = parseTime(previous[i].effectiveAt);
      if (!isFinite(historicalTime)) return fail("DEPARTMENT_LIFECYCLE_HISTORY_DATE_INVALID");
      if (historicalTime > latest) latest = historicalTime;
    }
    if (effectiveTime <= latest) return fail("DEPARTMENT_LIFECYCLE_EVENT_OUT_OF_ORDER");

    var catalog = Array.isArray(cfg.catalogRecords) ? cfg.catalogRecords : [], byId = Object.create(null);
    for (var j = 0; j < catalog.length; j++) {
      var row = catalog[j] || {}, id = String(row.departmentId || "").trim();
      if (!id) return fail("DEPARTMENT_LIFECYCLE_CATALOG_ID_MISSING");
      if (Object.prototype.hasOwnProperty.call(byId, id)) return fail("DEPARTMENT_LIFECYCLE_CATALOG_ID_AMBIGUOUS");
      byId[id] = row;
    }
    if (!Object.prototype.hasOwnProperty.call(byId, departmentId)) return fail("DEPARTMENT_LIFECYCLE_CURRENT_RECORD_NOT_IN_SNAPSHOT");
    var snapshotCurrent = byId[departmentId];
    if (String(snapshotCurrent.status || "").trim().toUpperCase() !== currentState ||
        String(snapshotCurrent.name || "").trim() !== String(current.name || "").trim() ||
        String(snapshotCurrent.code || "").trim() !== String(current.code || "").trim() ||
        String(snapshotCurrent.namespace || "").trim() !== String(current.namespace || "").trim() ||
        String(snapshotCurrent.parentId || "").trim() !== String(current.parentId || "").trim()) return fail("DEPARTMENT_LIFECYCLE_SNAPSHOT_MISMATCH");

    var nextRecord = {};
    Object.keys(current).forEach(function(key) { nextRecord[key] = current[key]; });
    var relatedDepartmentIds = [], newDepartmentProposals = [];
    if (eventType === "RENAME") {
      var newName = String(event.newName || "").trim();
      if (!newName || newName === String(current.name || "").trim()) return fail("DEPARTMENT_LIFECYCLE_RENAME_INVALID");
      nextRecord.name = newName;
    } else if (eventType === "CHANGE_CODE") {
      var newCode = String(event.newCode || "").trim(), newNamespace = String(event.newNamespace || "").trim();
      if (!newCode || !newNamespace || (newCode === String(current.code || "").trim() && newNamespace === String(current.namespace || "").trim())) return fail("DEPARTMENT_LIFECYCLE_CODE_CHANGE_INVALID");
      var codeConflict = catalog.some(function(row) {
        if (!row || String(row.departmentId || "").trim() === departmentId) return false;
        var state = String(row.status || "").trim().toUpperCase();
        return activeStates.indexOf(state) >= 0 && String(row.code || "").trim().toUpperCase() === newCode.toUpperCase() && String(row.namespace || "").trim() === newNamespace;
      });
      if (codeConflict) return fail("DEPARTMENT_LIFECYCLE_CODE_COLLISION");
      nextRecord.code = newCode; nextRecord.namespace = newNamespace;
    } else if (eventType === "CHANGE_PARENT") {
      var newParentId = String(event.newParentId || "").trim();
      if (newParentId === departmentId) return fail("DEPARTMENT_LIFECYCLE_PARENT_CYCLE");
      if (newParentId) {
        if (!Object.prototype.hasOwnProperty.call(byId, newParentId)) return fail("DEPARTMENT_LIFECYCLE_PARENT_NOT_FOUND");
        if (activeStates.indexOf(String(byId[newParentId].status || "").trim().toUpperCase()) < 0) return fail("DEPARTMENT_LIFECYCLE_PARENT_INACTIVE");
        var cursor = newParentId, seen = Object.create(null);
        while (cursor) {
          if (cursor === departmentId || Object.prototype.hasOwnProperty.call(seen, cursor)) return fail("DEPARTMENT_LIFECYCLE_PARENT_CYCLE");
          if (!Object.prototype.hasOwnProperty.call(byId, cursor)) return fail("DEPARTMENT_LIFECYCLE_PARENT_NOT_FOUND");
          if (activeStates.indexOf(String(byId[cursor].status || "").trim().toUpperCase()) < 0) return fail("DEPARTMENT_LIFECYCLE_PARENT_INACTIVE");
          seen[cursor] = true; cursor = String(byId[cursor].parentId || "").trim();
        }
      }
      nextRecord.parentId = newParentId || null;
    }
    if (stateTransition) nextRecord.status = toState;
    if (eventType === "MERGE") {
      var targetId = String(event.targetDepartmentId || "").trim();
      if (!targetId || targetId === departmentId || !Object.prototype.hasOwnProperty.call(byId, targetId)) return fail("DEPARTMENT_LIFECYCLE_MERGE_TARGET_INVALID");
      if (activeStates.indexOf(String(byId[targetId].status || "").trim().toUpperCase()) < 0) return fail("DEPARTMENT_LIFECYCLE_MERGE_TARGET_INACTIVE");
      nextRecord.mergedIntoDepartmentId = targetId; relatedDepartmentIds = [targetId];
    }
    if (eventType === "SPLIT") {
      var children = Array.isArray(event.newDepartments) ? event.newDepartments : [];
      if (children.length < 2) return fail("DEPARTMENT_LIFECYCLE_SPLIT_TARGETS_REQUIRED");
      var childIds = Object.create(null);
      for (var k = 0; k < children.length; k++) {
        var childId = String(children[k] && children[k].departmentId || "").trim(), childName = String(children[k] && children[k].name || "").trim();
        if (!childId || !childName || childId === departmentId || Object.prototype.hasOwnProperty.call(childIds, childId) || Object.prototype.hasOwnProperty.call(byId, childId)) return fail("DEPARTMENT_LIFECYCLE_SPLIT_TARGET_INVALID");
        childIds[childId] = true; relatedDepartmentIds.push(childId); newDepartmentProposals.push({ departmentId: childId, name: childName });
      }
      nextRecord.splitIntoDepartmentIds = relatedDepartmentIds.slice();
    }
    var snapshot = function(record) {
      return { departmentId: String(record.departmentId || "").trim(), name: String(record.name || "").trim(), code: String(record.code || "").trim(), namespace: String(record.namespace || "").trim(), status: String(record.status || "").trim().toUpperCase(), parentId: String(record.parentId || "").trim() || null, validFrom: record.validFrom === undefined ? null : record.validFrom, validTo: record.validTo === undefined ? null : record.validTo, mergedIntoDepartmentId: String(record.mergedIntoDepartmentId || "").trim() || null, splitIntoDepartmentIds: Array.isArray(record.splitIntoDepartmentIds) ? record.splitIntoDepartmentIds.slice() : [] };
    };
    var historyRow = {
      eventId: eventId, eventSignature: eventSignature, institutionId: institutionId, domain: domain,
      configurationVersion: String(config.version).trim(), configurationApprovalReference: approvalReference,
      departmentId: departmentId, eventType: eventType, effectiveAt: new Date(effectiveTime).toISOString(),
      changedBy: changedBy, approvedBy: String(event.approvedBy || "").trim() || null,
      approvalReference: String(event.approvalReference || "").trim() || null, reason: reason,
      before: snapshot(current), after: snapshot(nextRecord), relatedDepartmentIds: relatedDepartmentIds,
      ownershipMigrationRequired: eventType === "MERGE" || eventType === "SPLIT"
    };
    return {
      valid: true, idempotent: false, code: "DEPARTMENT_LIFECYCLE_EVENT_VALID",
      nextRecord: nextRecord, historyRow: historyRow, newDepartmentProposals: newDepartmentProposals,
      newAssignmentsAllowed: activeStates.indexOf(String(nextRecord.status || "").trim().toUpperCase()) >= 0,
      historicalIdentityPreserved: true, ownershipMigrationRequired: eventType === "MERGE" || eventType === "SPLIT"
    };
  } catch (error) { return fail("DEPARTMENT_LIFECYCLE_VALIDATION_FAILED"); }
}
