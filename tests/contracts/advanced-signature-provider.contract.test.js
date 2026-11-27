"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Falta " + name);
  const next = /\nfunction [A-Za-z0-9_$]+\s*\(/g;
  next.lastIndex = start + 10;
  const match = next.exec(source);
  return source.slice(start, match ? match.index : source.length);
}
function load(names, context) {
  vm.runInNewContext(names.map(extractFunction).join("\n"), context);
  return context;
}
function providerSheet(rows) {
  return {
    getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) })
  };
}
const headers = ["ProveedorID","NombreProveedor","EndpointURL","ApiKeyLegacy","TipoMecanismo",
  "PoliticaSelladoTiempo","FormatoCertificado","Estado","ConfiguracionJSON","FechaActualizacion","ActualizadoPor"];
const row = (overrides = {}) => {
  const values = ["PSC-HN-01","Proveedor de firma","https://firma.example.hn/api","","FirmaAvanzadaCualificada",
    "Habilitado","X.509_v3","Activo","{}","2026-11-27T00:00:00Z","ADMIN-1"];
  for (const [key, value] of Object.entries(overrides)) values[key] = value;
  return values;
}
test("el proveedor de firma exige ID, configuración única, endpoint HTTPS y estado activo", () => {
  const context = load(["assertAdvancedSignatureProviderActive_"], {});
  const sheet = providerSheet([headers, row()]);
  const ss = { getSheetByName: () => sheet };
  assert.equal(context.assertAdvancedSignatureProviderActive_(ss, "PSC-HN-01"), "PSC-HN-01");
  assert.throws(() => context.assertAdvancedSignatureProviderActive_(ss, ""), /SIGNATURE_PROVIDER_ID_REQUIRED/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_(ss, "../PSC"), /SIGNATURE_PROVIDER_ID_INVALID/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => null }, "PSC-HN-01"), /SIGNATURE_PROVIDER_NOT_CONFIGURED/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row(), row()]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_CONFIGURATION_AMBIGUOUS/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row({1:""})]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_NOT_CONFIGURED/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row({2:""})]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row({2:"http://firma.example.hn/api"})]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row({2:"https://user:pass@firma.example.hn/api"})]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row({2:"https://firma.example.hn/api?api_key=secret"})]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.throws(() => context.assertAdvancedSignatureProviderActive_({ getSheetByName: () => providerSheet([headers, row({7:"Inactivo"})]) }, "PSC-HN-01"), /SIGNATURE_PROVIDER_INACTIVE/);
});

test("createAdvancedSignatureRequest no crea transacción con proveedor activo pero sin endpoint configurado", () => {
  const rows = [headers, row({2:""})];
  let transactionSheetCreated = false, released = 0;
  const context = {
    SPREADSHEET_ID: "SS-1",
    validateRolePermission: () => ({ authorized: true }),
    getUserVerifiedRole: payload => { payload._verifiedUserId = "ACTOR-1"; return "Administrador"; },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => { released++; } }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => providerSheet(rows) }) },
    assertAdvancedSignatureDocumentScope_: () => ({ authorized: true, documentId: "DOC-1", solicitudId: "SOL-1",
      driveFileId: "FILE-1", documentVersion: "1.0", storedDocumentHash: "a".repeat(64), fileName: "doc.pdf",
      departmentId: "DEP-1" }),
    assertAdvancedSignatureSignerScope_: () => ({ authorized: true, userId: "SIGNER-1", nombre: "Firmante", email: "firmante@example.hn" }),
    getOrCreateSheet: () => { transactionSheetCreated = true; throw new Error("No debe crear transacción"); }
  };
  load(["assertAdvancedSignatureProviderActive_", "createAdvancedSignatureRequest"], context);
  assert.throws(() => context.createAdvancedSignatureRequest({
    documentoId: "DOC-1", solicitudId: "SOL-1", firmanteId: "SIGNER-1", proveedorId: "PSC-HN-01"
  }), /SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.equal(transactionSheetCreated, false);
  assert.equal(released, 1);
});

test("la creación de firma no usa un proveedor predeterminado ni omite la validación activa", () => {
  const fn = extractFunction("createAdvancedSignatureRequest");
  assert.match(fn, /assertAdvancedSignatureProviderActive_\(ss, proveedorId\)/);
  assert.doesNotMatch(fn, /PSC-HN-DEFAULT|proveedorId\s*\|\|\s*["'][^"']+["']/);
  const helper = extractFunction("assertAdvancedSignatureProviderActive_");
  assert.match(helper, /SIGNATURE_PROVIDER_ENDPOINT_INVALID/);
  assert.match(helper, /SIGNATURE_PROVIDER_INACTIVE/);
});
