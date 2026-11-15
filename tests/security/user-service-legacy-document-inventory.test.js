"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const constantsStart = source.indexOf("const LEGACY_DOCUMENT_INVENTORY_HEADERS_ = [");
const inventoryBlockEnd = source.indexOf("function getUIMetadataCatalog(payload)", constantsStart);
assert.ok(constantsStart >= 0 && inventoryBlockEnd > constantsStart, "inventory module block must be contiguous before UI metadata");
const inventoryBlock = source.slice(constantsStart, inventoryBlockEnd);
class FakeSheet {
  constructor(name, rows) { this.name = name; this.rows = rows || []; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows.length ? this.rows[0].length : 0; }
  appendRow(row) { this.rows.push(row.slice()); }
  deleteRow(rowNumber) { this.rows.splice(rowNumber - 1, 1); }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(row, column, rowCount = 1, columnCount = 1) {
    const self = this;
    return {
      getValues() {
        return Array.from({ length: rowCount }, (_, ri) =>
          Array.from({ length: columnCount }, (_, ci) =>
            (self.rows[row - 1 + ri] || [])[column - 1 + ci] === undefined ? "" : self.rows[row - 1 + ri][column - 1 + ci]));
      },
      setValues(values) {
        values.forEach((valuesRow, ri) => {
          const targetRow = row - 1 + ri;
          while (self.rows.length <= targetRow) self.rows.push([]);
          while (self.rows[targetRow].length < column - 1 + valuesRow.length) self.rows[targetRow].push("");
          valuesRow.forEach((value, ci) => { self.rows[targetRow][column - 1 + ci] = value; });
        });
      },
      setValue(value) {
        while (self.rows.length < row) self.rows.push([]);
        while (self.rows[row - 1].length < column) self.rows[row - 1].push("");
        self.rows[row - 1][column - 1] = value;
      }
    };
  }
}
const store = {
  CatalogoDepartamentos: new FakeSheet("CatalogoDepartamentos", [
    ["deptId", "nombre", "jefaturaUserId", "estado", "fechaCreacion"],
    ["DEP-A", "Secretaría", "SEC-A", "Activo", new Date("2025-01-01")],
    ["DEP-B", "Contabilidad", "SEC-B", "Activo", new Date("2025-01-01")]
  ])
};
const ss = {
  getSheetByName(name) { return store[name] || null; },
  insertSheet(name) { if (store[name]) throw new Error("SHEET_ALREADY_EXISTS"); store[name] = new FakeSheet(name, []); return store[name]; }
};
const claims = {
  "token-sec-a": { userId: "SEC-A", role: "Secretaría", institutionId: "INST-1", departmentIds: ["DEP-A"], institutionWide: false },
  "token-sec-b": { userId: "SEC-B", role: "Secretaría", institutionId: "INST-1", departmentIds: ["DEP-B"], institutionWide: false },
  "token-dir": { userId: "DIR-1", role: "Director", institutionId: "INST-1", departmentIds: [], institutionWide: true },
  "token-dir-2": { userId: "DIR-2", role: "Director", institutionId: "INST-2", departmentIds: ["DEP-A"], institutionWide: true },
  "token-student": { userId: "STU-1", role: "Estudiante", institutionId: "INST-1", departmentIds: ["DEP-A"], institutionWide: false }
};
let uuid = 0, lockBusy = false;
const events = [];
const context = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById(id) { assert.equal(id, "TEST"); return ss; } },
  LockService: { getScriptLock() { return { waitLock() { if (lockBusy) throw new Error("LOCK_BUSY"); }, releaseLock() {} }; } },
  Utilities: {
    DigestAlgorithm: { SHA_256: "SHA_256" },
    base64Decode(value) { return Buffer.from(value, "base64"); },
    computeDigest(_algorithm, bytes) { return Array.from({ length: 32 }, (_, index) => index); },
    getUuid() { uuid++; return "UUID-" + String(uuid).padStart(6, "0"); }
  },
  getUserVerifiedRole(payload) {
    const claim = claims[payload && payload.sessionToken];
    if (!claim) return "NO_ACCESS";
    payload._verifiedUserId = claim.userId; payload._verifiedRole = claim.role; return claim.role;
  },
  validateRolePermission(action, payload) {
    const role = getRole(payload);
    return { authorized: ["Secretaría", "Director", "Administrador"].includes(role), role };
  },
  getUserContextScope(payload) {
    const claim = claims[payload && payload.sessionToken];
    if (!claim) return { status: "error", code: "VERIFIED_IDENTITY_REQUIRED" };
    return { status: "success", authorized: true, userId: claim.userId, role: claim.role,
      institutionId: claim.institutionId, departmentIds: claim.departmentIds,
      institutionWide: claim.institutionWide, activeDepartmentId: null, scopes: [] };
  },
  getIdentityInstitutionId_() { return "INST-1"; },
  logStructuredEvent(...args) { events.push(args); },
  Date, Math, JSON, String, Number, Array, Object, RegExp, Error, isFinite
};
function getRole(payload) { const claim = claims[payload && payload.sessionToken]; return claim ? claim.role : "NO_ACCESS"; }
vm.createContext(context);
vm.runInContext(inventoryBlock +
  "\nthis.registerLegacyDocumentInventory=registerLegacyDocumentInventory;" +
  "\nthis.getLegacyDocumentInventory=getLegacyDocumentInventory;", context);

const record = {
  areaResponsable: "Archivo central", nombreArchivoOriginal: "Actas_2020.pdf",
  descripcionProposito: "Actas de cierre del periodo lectivo 2020", formatoSoporte: "DIGITAL",
  ubicacionOrigen: "Drive/Archivo/2020", responsableDocumento: "Secretaría",
  cantidadRegistrosPaginas: 12, frecuenciaUso: "Histórica", fechaCreacionPeriodo: "2020",
  nivelConfidencialidad: "INTERNO", estadoConservacion: "Bueno",
  categoriaDocumental: "DOCUMENTOS_HISTORICOS", estadoDigitalizacion: "Inventariado",
  expedienteRelacionadoId: "", observacionesHistoricas: "Legajo cerrado",
  subcategoriaDocumental: "Actas", claveOrigen: "DRIVE-FILE-2020-001"
};
const denied = context.registerLegacyDocumentInventory({ sessionToken: "token-student", departmentId: "DEP-A", record });
assert.equal(denied.code, "AUTH_PERMISSION_DENIED");
assert.equal(store.InventarioDocumentalLegado, undefined, "unauthorized attempts must not create the inventory sheet");

const created = context.registerLegacyDocumentInventory({ sessionToken: "token-sec-a", departmentId: "DEP-A", record });
assert.equal(created.status, "success"); assert.equal(created.created, true);
const documentId = created.documentId;
assert.ok(documentId.startsWith("LEG-"));
assert.equal(store.InventarioDocumentalLegado.rows.length, 2);
assert.equal(store.HistorialInventarioDocumentalLegado.rows.length, 2);
assert.equal(store.InventarioDocumentalLegado.rows[1].length, 23);
assert.equal(store.InventarioDocumentalLegado.rows[0][22], "HashSHA256");

const duplicate = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A",
  record: Object.assign({}, record, { nombreArchivoOriginal: "Actas_2020_renombradas.pdf" })
});
assert.equal(duplicate.code, "LEGACY_DOCUMENT_ORIGIN_DUPLICATE");
assert.equal(duplicate.existingDocumentId, created.documentId, "same-department duplicate can reference its existing record");
assert.equal(store.InventarioDocumentalLegado.rows.length, 2);
const crossDepartmentDuplicate = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-b", departmentId: "DEP-B", record
});
assert.equal(crossDepartmentDuplicate.code, "LEGACY_DOCUMENT_ORIGIN_DUPLICATE",
  "the same source document cannot be inventoried twice under another department in the same institution");
assert.equal(crossDepartmentDuplicate.existingDocumentId, undefined, "duplicate detection must not disclose another department's document ID");

const updated = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A", documentId,
  record: { nombreArchivoOriginal: "Actas_2020_renombradas.pdf", categoriaDocumental: "PLANTILLAS",
    estadoDigitalizacion: "Pendiente_Revision", subcategoriaDocumental: "Plantillas institucionales" }
});
assert.equal(updated.status, "success"); assert.equal(updated.documentId, documentId);
assert.equal(store.InventarioDocumentalLegado.rows.length, 2);
const history = store.HistorialInventarioDocumentalLegado.rows.slice(2);
assert.ok(history.some(row => row[5] === "NombreArchivoOriginal"));
assert.ok(history.some(row => row[5] === "CategoriaDocumental" && row[6] === "DOCUMENTOS_HISTORICOS" && row[7] === "PLANTILLAS"));
assert.ok(history.some(row => row[5] === "EstadoDigitalizacion" && row[6] === "Inventariado" && row[7] === "Pendiente_Revision"));
assert.ok(history.some(row => row[5] === "SubcategoriaDocumental"));
assert.ok(history.every(row => row[8] === "SEC-A" && row[9] === "Secretaría"));

const idempotent = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A", documentId,
  record: { nombreArchivoOriginal: "Actas_2020_renombradas.pdf" }
});
assert.equal(idempotent.status, "success"); assert.equal(idempotent.idempotent, true);

const crossDepartmentRead = context.getLegacyDocumentInventory({ sessionToken: "token-sec-a", filters: { departmentId: "DEP-B" } });
assert.equal(crossDepartmentRead.code, "DEPARTMENT_SCOPE_ACCESS_DENIED");
const ownRead = context.getLegacyDocumentInventory({
  sessionToken: "token-sec-a",
  filters: { departmentId: "DEP-A", category: "PLANTILLAS", state: "PENDIENTE_REVISION", responsible: "secretaría", period: "2020" }
});
assert.equal(ownRead.status, "success"); assert.equal(ownRead.total, 1);
assert.equal(ownRead.data[0].DocumentoId, documentId);
assert.deepEqual(Array.from(ownRead.subcategories), ["Plantillas institucionales"]);

const otherDepartment = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-b", departmentId: "DEP-B",
  record: Object.assign({}, record, { nombreArchivoOriginal: "Libro_diario_2020.xlsx", claveOrigen: "ORIGEN-CONT-001", categoriaDocumental: "REGISTROS_DE_DATOS" })
});
assert.equal(otherDepartment.status, "success");
assert.equal(context.getLegacyDocumentInventory({ sessionToken: "token-sec-a" }).total, 1);
assert.equal(context.getLegacyDocumentInventory({ sessionToken: "token-dir" }).total, 2);

const tenantTwo = context.registerLegacyDocumentInventory({
  sessionToken: "token-dir-2", departmentId: "DEP-A",
  record: Object.assign({}, record, { nombreArchivoOriginal: "Actas_2020_inst2.pdf" })
});
assert.equal(tenantTwo.status, "success");
assert.equal(context.getLegacyDocumentInventory({ sessionToken: "token-dir" }).total, 2);
assert.equal(context.getLegacyDocumentInventory({ sessionToken: "token-dir-2" }).total, 1);

const formula = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A",
  record: Object.assign({}, record, { nombreArchivoOriginal: "=HYPERLINK(test)", claveOrigen: "DRIVE-FILE-2020-002" })
});
assert.equal(formula.status, "success");
const exportResult = context.getLegacyDocumentInventory({ sessionToken: "token-dir", export: true });
assert.equal(exportResult.exportFormat, "CSV");
assert.ok(exportResult.csv.includes("'=HYPERLINK"), "CSV export must neutralize formulas");

for (const invalidRecord of [
  Object.assign({}, record, { claveOrigen: "BAD-CAT", categoriaDocumental: "CATEGORIA_INVENTADA" }),
  Object.assign({}, record, { claveOrigen: "BAD-STATE", estadoDigitalizacion: "COMPLETADO" }),
  Object.assign({}, record, { claveOrigen: "BAD-COUNT", cantidadRegistrosPaginas: -1 })
]) {
  assert.equal(context.registerLegacyDocumentInventory({ sessionToken: "token-sec-a", departmentId: "DEP-A", record: invalidRecord }).code, "VALIDATION_ERROR");
}
assert.equal(context.registerLegacyDocumentInventory({ sessionToken: "token-sec-a", departmentId: "DEP-B", record: Object.assign({}, record, { claveOrigen: "BAD-DEPT" }) }).code, "DEPARTMENT_SCOPE_ACCESS_DENIED");

const historySheet = store.HistorialInventarioDocumentalLegado;
const originalAppendRow = historySheet.appendRow.bind(historySheet);
const inventoryCountBeforeRollback = store.InventarioDocumentalLegado.rows.length;
historySheet.appendRow = function() { throw new Error("HISTORY_WRITE_FAILED"); };
const failedCreate = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A",
  record: Object.assign({}, record, { claveOrigen: "ROLLBACK-CREATE" })
});
assert.equal(failedCreate.code, "HISTORY_WRITE_FAILED");
assert.equal(store.InventarioDocumentalLegado.rows.length, inventoryCountBeforeRollback,
  "a failed history append must roll back the new inventory row");
const priorName = store.InventarioDocumentalLegado.rows.find(row => row[0] === documentId)[3];
const failedUpdate = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A", documentId,
  record: { nombreArchivoOriginal: "No debe persistir.pdf" }
});
assert.equal(failedUpdate.code, "HISTORY_WRITE_FAILED");
assert.equal(store.InventarioDocumentalLegado.rows.find(row => row[0] === documentId)[3], priorName,
  "a failed history append must restore the previous inventory row");
historySheet.appendRow = originalAppendRow;

lockBusy = true;
const lockRejected = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A",
  record: Object.assign({}, record, { claveOrigen: "LOCK-TEST" })
});
assert.equal(lockRejected.status, "error"); assert.equal(lockRejected.code, "LOCK_BUSY");
lockBusy = false;

const originalHeader = store.InventarioDocumentalLegado.rows[0][0];
store.InventarioDocumentalLegado.rows[0][0] = "UnexpectedHeader";
assert.equal(context.getLegacyDocumentInventory({ sessionToken: "token-sec-a" }).code, "LEGACY_INVENTORY_SCHEMA_MISMATCH");
store.InventarioDocumentalLegado.rows[0][0] = originalHeader;


const digitalRecord = Object.assign({}, record, {
  nombreArchivoOriginal: "Acta_digital_con_hash.pdf",
  claveOrigen: "HASH-SOURCE-001",
  fileData: "data:application/pdf;base64," + Buffer.from("legacy-file-bytes").toString("base64")
});
const hashedLegacy = context.registerLegacyDocumentInventory({ sessionToken: "token-sec-a", departmentId: "DEP-A", record: digitalRecord });
assert.equal(hashedLegacy.status, "success");
assert.equal(hashedLegacy.data.HashSHA256, "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
assert.equal(store.InventarioDocumentalLegado.rows.at(-1)[22], hashedLegacy.data.HashSHA256);
const duplicateHashLegacy = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A",
  record: Object.assign({}, digitalRecord, { nombreArchivoOriginal: "Acta_renombrada.pdf", claveOrigen: "HASH-SOURCE-002" })
});
assert.equal(duplicateHashLegacy.code, "LEGACY_DOCUMENT_HASH_DUPLICATE",
  "exact binary duplicates must be detected even when origin keys differ");

const legacyHeader = store.InventarioDocumentalLegado.rows[0].slice(0, 22);
const legacyRows = store.InventarioDocumentalLegado.rows.map(row => row.slice(0, 22));
store.InventarioDocumentalLegado = new FakeSheet("InventarioDocumentalLegado", legacyRows);
const migratedInventory = context.getLegacyDocumentInventory({ sessionToken: "token-dir" });
assert.equal(migratedInventory.status, "success");
assert.equal(store.InventarioDocumentalLegado.rows[0][22], "HashSHA256",
  "the additive schema migration must preserve existing inventory rows");

const permissionStart = source.indexOf("const ROLE_PERMISSIONS = {");
const permissionEnd = source.indexOf("\n};", permissionStart);
assert.ok(permissionStart >= 0 && permissionEnd > permissionStart);
const permissionSource = source.slice(permissionStart, permissionEnd);
for (const role of ["Director", "Subdirector", "Secretaría", "Contador", "RecursosHumanos", "Coordinador", "Consejeros", "Profesor", "Asistente"]) {
  const roleStart = permissionSource.indexOf('"' + role + '":');
  assert.ok(roleStart >= 0);
  const nextRole = permissionSource.indexOf('\n  "', roleStart + 1);
  const roleBlock = permissionSource.slice(roleStart, nextRole >= 0 ? nextRole : permissionSource.length);
  assert.ok(roleBlock.includes("registerLegacyDocumentInventory"), "write permission missing for " + role);
  assert.ok(roleBlock.includes("getLegacyDocumentInventory"), "read permission missing for " + role);
}
const dispatcherStart = source.indexOf("function doPost(e)");
const dispatcherEnd = source.indexOf("\nfunction ", dispatcherStart + 10);
const dispatcher = source.slice(dispatcherStart, dispatcherEnd > dispatcherStart ? dispatcherEnd : source.length);
assert.ok(dispatcher.includes('case "registerLegacyDocumentInventory"'));
assert.ok(dispatcher.includes('case "getLegacyDocumentInventory"'));

console.log("PASS legacy document inventory: tenant and department isolation, stable IDs, source deduplication, history, filters, CSV safety, validation, locking, schema, RBAC and routing");
