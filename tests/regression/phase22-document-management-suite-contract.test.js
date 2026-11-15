const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next < 0 ? source.length : next);
}

function makeSuiteHarness(options = {}) {
  const state = { templatePayload: null, documentPayload: null, cuvLookups: [], sacePayload: null, providerConfigCalls: 0 };
  const context = {
    Date,
    Math,
    configureSchoolDocumentTemplate(payload) {
      state.templatePayload = payload;
      return options.templateResult || { status: "success", plantillaId: "TMP-GENERATED-001" };
    },
    generateSchoolDocument(payload) {
      state.documentPayload = payload;
      return { status: "success", documentoId: "DOC-001", codigoVerificacion: "CUV-001", sha256Hash: "a".repeat(64) };
    },
    verifySchoolDocumentByCUV(payload) {
      state.cuvLookups.push(payload.codigoVerificacion);
      if (payload.codigoVerificacion === "CUV-001") return { status: "success", documento: { codigoVerificacion: "CUV-001" } };
      return { status: "not_found" };
    },
    validateFileBinaryIntegrity(data, filename) {
      if (filename.endsWith(".exe")) throw new Error("DANGEROUS_FILE_EXTENSION");
      if (data.endsWith("base64,")) throw new Error("EMPTY_FILE_REJECTED");
      return { valid: true, detectedFormat: "pdf" };
    },
    Utilities: { base64Encode: value => Buffer.from(value).toString("base64") },
    computeDocumentSHA256(value) {
      return value === "Documento_Oficial_Matricula_2026" ? "a".repeat(64) : "b".repeat(64);
    },
    verifySACETemplateCompatibility(payload) { state.sacePayload = payload; return { status: "success", esCompatible: true }; },
    generateSACEReportFile: () => options.badSace
      ? { datosReporteSACE: [{}, { calificacionOrdinaria: "0" }, { calificacionOrdinaria: "0" }] }
      : { datosReporteSACE: [{}, { calificacionOrdinaria: "AUSENTE" }, { calificacionOrdinaria: "EXENTO" }] },
    validateSACETemplateFile: () => ({ status: "error", esValido: false })
  };
  vm.runInNewContext(extractFunction("runPhase22DocumentManagementAndSACERegressionSuite"), context);
  return { run: () => context.runPhase22DocumentManagementAndSACERegressionSuite({}), state };
}

{
  const h = makeSuiteHarness();
  const result = h.run();
  assert.equal(result.status, "success");
  assert.equal(result.todasPruebasPasaron, true);
  assert.equal(result.totalPruebasFase22, 12);
  assert.equal(result.pruebasExitosas, 12);
  assert.equal(h.state.templatePayload.codigoDocumento, "CONST-ESTUDIO-STD");
  assert.equal(h.state.templatePayload.titulo, "Constancia de Estudio Oficial");
  assert.deepEqual(Array.from(h.state.templatePayload.camposJSON), ["estudiante.nombreCompleto", "estudiante.identidad"]);
  assert.equal(h.state.documentPayload.plantillaId, "TMP-GENERATED-001", "PT22-02 must reuse the exact ID returned by PT22-01");
  assert.equal(h.state.cuvLookups[0], "CUV-001");
  assert.match(h.state.cuvLookups[1], /^CUV-NO-EXISTE-/);
  assert.equal(h.state.sacePayload.nombreFormato, "SACE-OFICIAL-SECUNDARIA");
  assert.deepEqual(Array.from(h.state.sacePayload.columnasDetectadas), ["identidad", "nombreAlumno", "calificacionOrdinaria", "recuperacion", "resultadoFinal"]);
  assert.equal(h.state.providerConfigCalls, 0, "Accounting suite must not call a User-service function directly");
}

{
  const h = makeSuiteHarness({ badSace: true });
  const result = h.run();
  assert.equal(result.todasPruebasPasaron, false);
  assert.equal(result.status, "error", "a failed scenario must fail the suite envelope");
  assert.equal(result.code, "PHASE22_REGRESSION_FAILED");
  const failed = result.resultadosSuiteRegresion.filter(test => test.status === "FAIL");
  assert.deepEqual(Array.from(failed, test => test.id), ["PT22-09"]);
}

function makeReadOnlyCuvHarness(rows) {
  const state = { createAttempts: 0, reads: [] };
  const issuedSheet = rows ? {
    getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) })
  } : null;
  const ss = { getSheetByName(name) { state.reads.push(name); return name === "DocumentosEscolaresEmitidos" ? issuedSheet : null; } };
  const context = {
    SPREADSHEET_ID: "TEST-SPREADSHEET",
    SpreadsheetApp: { openById: id => { assert.equal(id, "TEST-SPREADSHEET"); return ss; } },
    getOrCreateSheet() { state.createAttempts++; throw new Error("read-only lookup must not create sheets"); },
    console: { warn() {} },
    Date
  };
  vm.runInNewContext(extractFunction("verifySchoolDocumentByCUV"), context);
  return { lookup: code => context.verifySchoolDocumentByCUV({ codigoVerificacion: code }), state };
}

{
  const h = makeReadOnlyCuvHarness(null);
  assert.equal(h.lookup("CUV-MISSING").status, "not_found");
  assert.equal(h.state.createAttempts, 0, "missing read-only lookup must not create an operational sheet");
}

{
  const row = ["DOC-001", "TMP-001", "STU-001", "USR-001", "{}", "issued", "CUV-001", "DRV-001", "", "2026-11-15T00:00:00.000Z", "", "1.0", 1, "2026-000001", "a".repeat(64)];
  const h = makeReadOnlyCuvHarness([["DocumentoID"], row]);
  const result = h.lookup("CUV-001");
  assert.equal(result.status, "success");
  assert.equal(result.documento.codigoVerificacion, "CUV-001");
  assert.equal(result.certificadoAuditoria, null);
  assert.equal(h.state.createAttempts, 0, "signature lookup must also remain read-only when the signature sheet is absent");
}

console.log("phase22-document-management-suite-contract: PASS");
