const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next < 0 ? source.length : next);
}

const phase22Functions = [
  "configureSchoolDocumentTemplate",
  "generateSchoolDocument",
  "verifySchoolDocumentByCUV",
  "validateFileBinaryIntegrity",
  "computeDocumentSHA256",
  "verifySACETemplateCompatibility",
  "generateSACEReportFile",
  "validateSACETemplateFile",
  "runPhase22DocumentManagementAndSACERegressionSuite"
];

function makeMemorySheet(header) {
  const rows = [header.slice()];
  return {
    rows,
    getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    appendRow: row => rows.push(row.slice()),
    getRange(row, column, rowCount, columnCount) {
      return { setValues(values) {
        for (let r = 0; r < rowCount; r++) {
          rows[row - 1 + r].splice(column - 1, columnCount, ...values[r]);
        }
      }};
    }
  };
}

function makeIsolatedHarness(options = {}) {
  const state = { openedIds: [], createdSheets: [], lockHeld: false, lockReleases: 0 };
  const sheets = new Map();
  const headers = {
    PlantillasEscolares: ["PlantillaID", "CodigoDocumento", "Categoria", "Titulo", "CamposJSON", "FlujoAprobacion", "Estado", "Version", "ContenidoHTML", "ConfigFormatoJSON", "Descripcion", "Departamento", "TipoSalida", "CreadoPor", "DriveFolderID"],
    DocumentosEscolaresEmitidos: ["DocumentoID", "PlantillaID", "TargetEntityID", "SolicitanteUserID", "DatosJSON", "EstadoDoc", "CUV", "DriveFileID", "DriveURL", "FechaEmision", "Observaciones", "VersionPlantilla", "Correlativo", "NumeroCorrelativo", "SHA256"],
    PlantillasSACEVerificadas: ["PlantillaSaceID", "NombreFormato", "Version", "Columnas", "Estado", "Observaciones"]
  };
  const spreadsheet = {
    getSheetByName(name) { return sheets.get(name) || null; }
  };
  const context = {
    Date,
    Math,
    Buffer,
    require,
    console: { warn() {}, log() {} },
    SPREADSHEET_ID: "IN_MEMORY_TEST_ONLY",
    SpreadsheetApp: { openById(id) {
      state.openedIds.push(id);
      assert.equal(id, "IN_MEMORY_TEST_ONLY", "tests must never open a production spreadsheet");
      return spreadsheet;
    }},
    getOrCreateSheet(_ss, name) {
      let sheet = sheets.get(name);
      if (!sheet) {
        sheet = makeMemorySheet(headers[name] || ["TestID"]);
        sheets.set(name, sheet);
        state.createdSheets.push(name);
      }
      return sheet;
    },
    LockService: { getScriptLock: () => ({
      tryLock: () => { if (state.lockHeld) return false; state.lockHeld = true; return true; },
      releaseLock: () => { assert.equal(state.lockHeld, true); state.lockHeld = false; state.lockReleases++; }
    })},
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      base64Encode: value => Buffer.from(value).toString("base64"),
      base64Decode: value => Buffer.from(value, "base64"),
      newBlob: value => ({ getBytes: () => Buffer.from(String(value), "utf8") }),
      computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest())
    }
  };
  const functions = phase22Functions.map(extractFunction).join("\n\n");
  vm.runInNewContext(functions, context);
  if (options.badSace) {
    context.generateSACEReportFile = () => ({ datosReporteSACE: [{}, { calificacionOrdinaria: "0" }, { calificacionOrdinaria: "0" }] });
  }
  return { run: () => context.runPhase22DocumentManagementAndSACERegressionSuite({}), state, sheets, context };
}

{
  const h = makeIsolatedHarness();
  const result = h.run();
  if (result.status !== "success") {
    console.error("Phase 22 failed scenarios:", JSON.stringify(Array.from(result.resultadosSuiteRegresion || []).filter(item => item.status === "FAIL"), null, 2));
  }
  assert.equal(result.status, "success");
  assert.equal(result.todasPruebasPasaron, true);
  assert.equal(result.totalPruebasFase22, 12);
  assert.equal(result.pruebasExitosas, 12);
  assert.equal(h.state.openedIds.length > 0, true);
  assert.equal(h.state.openedIds.every(id => id === "IN_MEMORY_TEST_ONLY"), true);
  assert.deepEqual(h.state.createdSheets.sort(), ["DocumentosEscolaresEmitidos", "PlantillasEscolares", "PlantillasSACEVerificadas"].sort());
  assert.equal(h.sheets.get("PlantillasEscolares").rows.length, 2, "one template fixture must be created");
  assert.equal(h.sheets.get("DocumentosEscolaresEmitidos").rows.length, 2, "one document fixture must be created");
  assert.equal(h.sheets.get("PlantillasSACEVerificadas").rows.length, 2, "one SACE fixture must be created");
  assert.equal(h.sheets.has("FirmasConformidades"), false, "read-only CUV lookup must not create the signatures sheet");
  assert.equal(h.state.lockHeld, false);
  assert.equal(h.state.lockReleases, 1);
}

{
  const h = makeIsolatedHarness({ badSace: true });
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
