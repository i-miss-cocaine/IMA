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
  return { prepareCandidateExportFromSnapshot };
});
