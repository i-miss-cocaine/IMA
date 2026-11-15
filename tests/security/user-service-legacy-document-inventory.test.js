"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, lineComment = false, blockComment = false, template = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (template) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === String.fromCharCode(96)) template = false; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === String.fromCharCode(96)) { template = true; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const constantsStart = source.indexOf("const LEGACY_DOCUMENT_INVENTORY_HEADERS_ = [");
const statesStart = source.indexOf("const LEGACY_DOCUMENT_INVENTORY_STATES_ = [", constantsStart);
const constantsEnd = source.indexOf("];", statesStart) + 2;
assert.ok(constantsStart >= 0 && constantsEnd > constantsStart);
const constants = source.slice(constantsStart, constantsEnd);
const names = [
  "getLegacyDocumentInventoryAccessContext_", "getLegacyDocumentDepartmentInfo_",
  "validateLegacyDocumentInventorySheet_", "ensureLegacyDocumentInventorySheet_",
  "getLegacyDocumentInventorySheet_", "ensureLegacyDocumentInventoryHistorySheet_",
  "appendLegacyDocumentInventoryHistory_", "legacyDocumentInventorySafeCell_",
  "legacyDocumentInventoryRowToObject_", "normalizeLegacyDocumentInventoryRecord_",
  "getLegacyDocumentInventory", "legacyDocumentInventoryCsvCell_", "registerLegacyDocumentInventory"
];
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
  Utilities: { getUuid() { uuid++; return "UUID-" + String(uuid).padStart(6, "0"); } },
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
vm.runInContext(constants + "\n" + names.map(extractFunction).join("\n") +
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
assert.equal(store.InventarioDocumentalLegado.rows[1].length, 22);

const duplicate = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-a", departmentId: "DEP-A",
  record: Object.assign({}, record, { nombreArchivoOriginal: "Actas_2020_renombradas.pdf" })
});
assert.equal(duplicate.code, "LEGACY_DOCUMENT_ORIGIN_DUPLICATE");
assert.equal(store.InventarioDocumentalLegado.rows.length, 2);
const crossDepartmentDuplicate = context.registerLegacyDocumentInventory({
  sessionToken: "token-sec-b", departmentId: "DEP-B", record
});
assert.equal(crossDepartmentDuplicate.code, "LEGACY_DOCUMENT_ORIGIN_DUPLICATE",
  "the same source document cannot be inventoried twice under another department in the same institution");

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

console.log("PASS legacy document inventory: tenant and department isolation, stable IDs, source deduplication, history, filters, CSV safety, validation, lock and schema checks");
