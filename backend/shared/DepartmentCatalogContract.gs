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
  return { valid: true, config: config };
}

function validateDepartmentCatalogSnapshot_(config, records, effectiveAt) {
  var configuration = validateDepartmentCatalogConfiguration_(config);
  if (!configuration.valid) return configuration;
  if (!Array.isArray(records)) return { valid: false, code: "DEPARTMENT_SOURCE_SNAPSHOT_INVALID" };
  var at = effectiveAt instanceof Date ? effectiveAt : new Date(effectiveAt || Date.now());
  if (isNaN(at.getTime())) return { valid: false, code: "DEPARTMENT_EFFECTIVE_DATE_INVALID" };
  var keyField = String(config.keyField).trim(), codeMap = {}, recordsById = {};
  for (var i = 0; i < records.length; i++) {
    var record = records[i] || {}, id = String(record[keyField] || "").trim();
    if (!id) return { valid: false, code: "DEPARTMENT_SOURCE_KEY_MISSING", rowIndex: i };
    if (recordsById[id]) return { valid: false, code: "DEPARTMENT_SOURCE_KEY_AMBIGUOUS", sourceId: id };
    recordsById[id] = record;
    if (config.codeField && config.codeNamespaceField) {
      var code = String(record[config.codeField] || "").trim(), namespace = String(record[config.codeNamespaceField] || "").trim();
      if (code && !namespace) return { valid: false, code: "DEPARTMENT_CODE_NAMESPACE_REQUIRED", sourceId: id };
      if (code) {
        var codeKey = namespace + "::" + code.toUpperCase();
        if (!codeMap[codeKey]) codeMap[codeKey] = [];
        codeMap[codeKey].push(id);
      }
    }
  }
  if (config.parentField) {
    var parentField = String(config.parentField).trim();
    for (var id in recordsById) {
      var parentId = String(recordsById[id][parentField] || "").trim();
      if (parentId && !recordsById[parentId]) return { valid: false, code: "DEPARTMENT_PARENT_NOT_FOUND", sourceId: id, parentId: parentId };
    }
    var visiting = {}, visited = {};
    var visit = function(id) {
      if (visiting[id]) return false;
      if (visited[id]) return true;
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
