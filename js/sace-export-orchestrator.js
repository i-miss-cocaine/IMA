(function (root, factory) {
  const provider = typeof module === "object" && module.exports
    ? require("./sace-data-provider.js") : root && root.SACEDataProvider;
  const templates = typeof module === "object" && module.exports
    ? require("./sace-template.js") : root && root.SACETemplateTools;
  const api = factory(provider, templates);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SACEExportOrchestrator = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this),
function (provider, templates) {
  "use strict";
  function required(value, code) {
    if (value === null || value === undefined || value === "") throw new Error(code);
    return value;
  }
  function sameValue(actual, expected) {
    if (actual === null || actual === undefined || actual === "") return expected === null || expected === undefined || expected === "";
    if (typeof actual === "number" && typeof expected === "number") return actual === expected;
    return String(actual) === String(expected);
  }
  function normalizeContextText(value) {
    return String(value == null ? "" : value).normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  }
  function normalizeGradeSection(value) {
    return normalizeContextText(value).replace(/[.°º]/g, " ").replace(/\\s+/g, " ").trim();
  }
  function assertTemplateMatchesAcademicSnapshot(snapshot, templateContext) {
    const context = snapshot && snapshot.data && snapshot.data.expectedContext;
    if (!context) throw new Error("SACE_ATTENDANCE_CONTEXT_REQUIRED");
    const gradeSection = [context.grado, context.seccion].map(value => String(value == null ? "" : value).trim()).filter(Boolean).join(" ");
    if (!normalizeGradeSection(gradeSection) || normalizeGradeSection(gradeSection) !== normalizeGradeSection(templateContext.gradeSection)) {
      throw new Error("SACE_TEMPLATE_SNAPSHOT_CONTEXT_MISMATCH:gradeSection");
    }
    if (!normalizeContextText(context.asignatura) || normalizeContextText(context.asignatura) !== normalizeContextText(templateContext.subject)) {
      throw new Error("SACE_TEMPLATE_SNAPSHOT_CONTEXT_MISMATCH:subject");
    }
    if (templateContext.institutionId && normalizeContextText(templateContext.institutionId) !== normalizeContextText(context.institutionId)) {
      throw new Error("SACE_TEMPLATE_SNAPSHOT_CONTEXT_MISMATCH:institutionId");
    }
  }
  function prepareCandidateExportFromSnapshot(input) {
    const value = input || {};
    if (!provider || typeof provider.buildCandidateStudentsFromSnapshot !== "function" ||
        !templates || typeof templates.prepareCandidateExport !== "function" ||
        typeof templates.inspect !== "function" || typeof templates.inspectTemplate !== "function" ||
        typeof templates.mapRowsToTemplate !== "function") {
      throw new Error("SACE_EXPORT_DEPENDENCIES_UNAVAILABLE");
    }
    const templateBytes = required(value.templateBytes, "SACE_TEMPLATE_BYTES_REQUIRED");
    const expectedTemplateContext = required(value.expectedTemplateContext, "SACE_TEMPLATE_CONTEXT_REQUIRED");
    assertTemplateMatchesAcademicSnapshot(value.attendanceSnapshot, expectedTemplateContext);
    const options = required(value.options, "SACE_SCALE_CONFIGURATION_REQUIRED");
    const templateBefore = templates.inspect(templateBytes);
    const templateInfo = templates.inspectTemplate(templateBytes);
    const candidate = provider.buildCandidateStudentsFromSnapshot(value);
    const mappedRows = templates.mapRowsToTemplate(templateInfo, candidate.sourceStudents, expectedTemplateContext);
    const outputBytes = templates.prepareCandidateExport(
      templateBytes, candidate.sourceStudents, expectedTemplateContext, options
    );
    if (!(outputBytes instanceof Uint8Array) || outputBytes.length !== templateBytes.length) {
      throw new Error("SACE_OUTPUT_BINARY_INVALID");
    }
    const verified = templates.inspect(outputBytes);
    for (let index = 0; index < mappedRows.length; index++) {
      const row = (templates.studentFirstRow || 8) + index;
      const expected = mappedRows[index];
      const actual = {
        partial1Absences: verified.get("D" + row),
        partial1: verified.get("E" + row),
        partial2Absences: verified.get("F" + row),
        partial2: verified.get("G" + row),
        recovery: verified.get("H" + row)
      };
      Object.keys(expected).forEach(field => {
        if (!sameValue(actual[field], expected[field])) {
          throw new Error("SACE_OUTPUT_FIELD_VERIFICATION_FAILED:" + field + ":" + row);
        }
      });
    }
    if (verified.workbookSize <= 0 || verified.workbookSize > verified.workbookCapacity ||
        verified.formulaCount !== templateBefore.formulaCount ||
        verified.validationCount !== templateBefore.validationCount ||
        JSON.stringify(verified.merges.slice().sort()) !== JSON.stringify(templateBefore.merges.slice().sort())) {
      throw new Error("SACE_OUTPUT_PACKAGE_VERIFICATION_FAILED");
    }
    return {
      status: "candidate",
      outputBytes,
      sourceStudentCount: candidate.sourceStudents.length,
      verifiedRowCount: mappedRows.length,
      limitations: candidate.limitations.slice(),
      verification: {
        workbookSize: verified.workbookSize,
        workbookCapacity: verified.workbookCapacity,
        formulaCount: verified.formulaCount,
        validationCount: verified.validationCount
      }
    };
  }
  function prepareCandidateExportFromAcademicSnapshot(input) {
    const value = input || {};
    const attendanceSnapshot = required(value.attendanceSnapshot, "SACE_ATTENDANCE_SNAPSHOT_REQUIRED");
    if (attendanceSnapshot.status !== "success" || !attendanceSnapshot.data) {
      throw new Error("SACE_ATTENDANCE_SNAPSHOT_INVALID");
    }
    const snapshots = attendanceSnapshot.data.gradebookSnapshots;
    if (!Array.isArray(snapshots) || snapshots.length !== 2) {
      throw new Error("SACE_GRADEBOOK_SNAPSHOTS_REQUIRED");
    }
    const partial1PeriodId = String(required(value.partial1PeriodId, "SACE_PARTIAL1_PERIOD_MAPPING_REQUIRED")).trim();
    const partial2PeriodId = String(required(value.partial2PeriodId, "SACE_PARTIAL2_PERIOD_MAPPING_REQUIRED")).trim();
    if (partial1PeriodId === partial2PeriodId) throw new Error("SACE_PERIODS_MUST_BE_DISTINCT");
    const byPeriod = new Map();
    snapshots.forEach(item => {
      const periodId = String(required(item && item.periodoId, "SACE_GRADEBOOK_SNAPSHOT_PERIOD_REQUIRED")).trim();
      if (byPeriod.has(periodId)) throw new Error("SACE_GRADEBOOK_SNAPSHOT_PERIOD_DUPLICATE");
      if (!item.snapshot || item.snapshot.status !== "success" || !item.snapshot.data) {
        throw new Error("SACE_GRADEBOOK_SNAPSHOT_INVALID");
      }
      const contextPeriodId = String(item.snapshot.data.contexto && item.snapshot.data.contexto.periodoId || "").trim();
      if (contextPeriodId !== periodId) throw new Error("SACE_GRADEBOOK_SNAPSHOT_PERIOD_MISMATCH");
      byPeriod.set(periodId, item.snapshot);
    });
    const partial1Gradebook = byPeriod.get(partial1PeriodId);
    const partial2Gradebook = byPeriod.get(partial2PeriodId);
    if (!partial1Gradebook || !partial2Gradebook) throw new Error("SACE_PARTIAL_PERIOD_NOT_IN_SNAPSHOT");
    return prepareCandidateExportFromSnapshot({
      templateBytes: value.templateBytes,
      attendanceSnapshot,
      partial1PeriodId,
      partial2PeriodId,
      partial1Gradebook,
      partial2Gradebook,
      documentTypeMappings: value.documentTypeMappings,
      absencePolicy: value.absencePolicy,
      expectedTemplateContext: value.expectedTemplateContext,
      options: value.options
    });
  }
  return { prepareCandidateExportFromSnapshot, prepareCandidateExportFromAcademicSnapshot };
});
