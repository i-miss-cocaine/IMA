"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const backend = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
function extractFunction(name) {
 const start = backend.indexOf("function " + name + "(");
 assert.notEqual(start, -1, "Debe existir " + name);
 const end = backend.indexOf("\n}\n", start);
 assert.notEqual(end, -1, "Debe cerrar " + name);
 return backend.slice(start, end + 3);
}
const helperSource = [
 'const WORKFLOW_DECISION_AUDIT_GENESIS_HASH_ = "GENESIS_DECISION_HASH_0000000000000000000000000000000000000000";',
 'const WORKFLOW_DECISION_AUDIT_CHECKPOINT_KEY_ = "WORKFLOW_DECISION_AUDIT_CHECKPOINT_V2";',
 extractFunction("normalizeWorkflowDecisionAuditDate_"),
 extractFunction("computeWorkflowDecisionHashV2_"),
 extractFunction("verifyWorkflowDecisionAuditRows_"),
 extractFunction("compareWorkflowDecisionAuditCheckpoint_"),
 extractFunction("getWorkflowDecisionAuditCheckpoint_"),
 extractFunction("saveWorkflowDecisionAuditCheckpoint_"),
 extractFunction("appendWorkflowDecisionAuditEvent_"),
 '({ genesis: WORKFLOW_DECISION_AUDIT_GENESIS_HASH_, hashV2: computeWorkflowDecisionHashV2_, verify: verifyWorkflowDecisionAuditRows_, compare: compareWorkflowDecisionAuditCheckpoint_, append: appendWorkflowDecisionAuditEvent_, getCheckpoint: getWorkflowDecisionAuditCheckpoint_, saveCheckpoint: saveWorkflowDecisionAuditCheckpoint_ })'
].join("\n");
function makePropertiesStore(options = {}) {
 const values = new Map(); let setCount = 0;
 return { getScriptProperties: () => ({
  getProperty: key => values.has(key) ? values.get(key) : null,
  setProperty: (key, value) => { setCount++; if (options.failSetAt === setCount) throw new Error("PROPERTY_WRITE_FAILED"); values.set(key, value); }
 }), values, get setCount() { return setCount; } };
}
function createHelpers(properties = makePropertiesStore()) {
 return vm.runInNewContext(helperSource, {
  computeDocumentSHA256: value => crypto.createHash("sha256").update(String(value), "utf8").digest("hex"),
  PropertiesService: properties
 });
}
const helpers = createHelpers();
function makeRow(id, previousHash, overrides = {}) {
 const row = Array(17).fill("");
 row[0] = id; row[1] = "SOL-1"; row[2] = overrides.stage || "Revisión General";
 row[3] = overrides.actorId || "USER-1"; row[4] = overrides.action || "APROBADO";
 row[5] = overrides.internalNotes || "Nota interna"; row[6] = overrides.publicNotes || "Nota pública";
 row[7] = "2026-11-24T04:00:00.000Z"; row[8] = ""; row[9] = previousHash;
 row[11] = overrides.originalId || ""; row[12] = overrides.reason || ""; row[13] = "2";
 row[14] = overrides.actorRole || "Dirección"; row[15] = overrides.correlationId || ("CORR-" + id); row[16] = "APPS_SCRIPT";
 row[10] = helpers.hashV2(row);
 return row;
}
test("la cadena global SHA-256 valida dos eventos encadenados", () => {
 const first = makeRow("DEC-1", helpers.genesis);
 const second = makeRow("DEC-2", first[10]);
 const result = helpers.verify([first, second]);
 assert.equal(result.valid, true);
 assert.equal(result.totalEvents, 2);
 assert.equal(result.lastDecisionId, "DEC-2");
 assert.equal(result.lastHash, second[10]);
});
test("el hash v2 protege observaciones internas y públicas", () => {
 const original = makeRow("DEC-1", helpers.genesis);
 for (const index of [5, 6]) {
  const changed = original.slice(); changed[index] += " alterada";
  assert.equal(helpers.verify([changed]).valid, false);
 }
});
test("el hash v2 protege actor, rol y correlationId", () => {
 const original = makeRow("DEC-1", helpers.genesis);
 for (const index of [3, 14, 15, 16]) {
  const changed = original.slice(); changed[index] += "-alterado";
  assert.equal(helpers.verify([changed]).valid, false);
 }
});
test("la cadena rechaza enlaces rotos y hashActual ausente", () => {
 const first = makeRow("DEC-1", helpers.genesis);
 const second = makeRow("DEC-2", first[10]); second[9] = "f".repeat(64);
 assert.equal(helpers.verify([first, second]).valid, false);
 const missing = first.slice(); missing[10] = "";
 assert.equal(helpers.verify([missing]).valid, false);
});
test("el checkpoint confiable detecta eliminación de eventos al final", () => {
 const first = makeRow("DEC-1", helpers.genesis);
 const second = makeRow("DEC-2", first[10]);
 const trusted = { version: 2, totalEvents: 2, lastDecisionId: "DEC-2", lastHash: second[10] };
 const complete = helpers.verify([first, second]);
 const truncated = helpers.verify([first]);
 assert.equal(helpers.compare(complete, trusted).valid, true);
 assert.equal(helpers.compare(truncated, trusted).valid, false);
});
test("las decisiones heredadas mantienen verificación de su fórmula histórica", () => {
 const row = makeRow("DEC-LEGACY", helpers.genesis);
 row[13] = "";
 const timestamp = new Date(row[7]).toISOString();
 const legacyPayload = [row[0], row[1], row[2], row[3], row[4], timestamp, row[9]].map(v => String(v || "")).join("|");
 row[10] = crypto.createHash("sha256").update(legacyPayload, "utf8").digest("hex");
 assert.equal(helpers.verify([row]).valid, true);
});
test("las correcciones se vinculan al original y su motivo queda protegido", () => {
 const original = makeRow("DEC-ORIGINAL", helpers.genesis);
 const correction = makeRow("DEC-CORR-1", original[10], {
  stage: "Corrección-Revisión General", action: "RECHAZADO",
  originalId: "DEC-ORIGINAL", reason: "Se detectó un dato incorrecto"
 });
 assert.equal(helpers.verify([original, correction]).valid, true);
 const changed = correction.slice(); changed[12] = "motivo alterado";
 assert.equal(helpers.verify([original, changed]).valid, false);
});
test("los IDs duplicados y las versiones de esquema desconocidas se rechazan", () => {
 const first = makeRow("DEC-1", helpers.genesis);
 const duplicate = makeRow("DEC-1", first[10]);
 assert.equal(helpers.verify([first, duplicate]).valid, false);
 const unknown = first.slice(); unknown[13] = "99";
 assert.equal(helpers.verify([unknown]).valid, false);
});
test("la verificación es global aunque la consulta solicite una solicitud concreta", () => {
 assert.match(backend, /var audit = verifyWorkflowDecisionAuditRows_\(rows\)/);
 assert.match(backend, /var scopedCount = solicitudId \?/);
 assert.match(backend, /WORKFLOW_AUDIT_TRUSTED_CHECKPOINT_MISMATCH/);
});
test("el procesamiento y las correcciones usan el actor autenticado, no revisorId del cliente", () => {
 assert.match(backend, /var callerId = String\(payload\._verifiedUserId \|\| ""\)\.trim\(\)/);
 assert.doesNotMatch(backend, /revisorId \|\| "Auditor\/Dirección"/);
 assert.match(backend, /DECISION_ORIGINAL_REQUEST_MISMATCH/);
 assert.match(backend, /DECISION_ALREADY_CORRECTED/);
});
test("el historial expone el resultado de integridad y el esquema del hash", () => {
 assert.match(backend, /integridadAuditoria:/);
 assert.match(backend, /hashSchemaVersion: row\[13\]/);
 assert.match(backend, /ActorRole/);
 assert.match(backend, /CorrelationId/);
 assert.match(backend, /FuenteEjecucion/);
});
test("la verificación y las escrituras serializan el acceso con LockService", () => {
 assert.match(backend, /verifyWorkflowDecisionAuditChain\(payload, lockAlreadyHeld\)/);
 assert.match(backend, /lock\.tryLock\(10000\)/);
 assert.match(backend, /lock\.tryLock\(15000\)/);
 assert.match(backend, /WORKFLOW_DECISION_DUPLICATE_CORRELATION/);
});

function makeMemorySheet() {
 const rows = [Array(17).fill("")];
 return {
  rows,
  getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
  getLastRow: () => rows.length,
  appendRow: row => rows.push(row.slice()),
  deleteRow: number => rows.splice(number - 1, 1)
 };
}
function newAuditEvent(id) {
 const row = Array(17).fill("");
 row[0] = id; row[1] = "SOL-1"; row[2] = "Etapa"; row[3] = "USER-1"; row[4] = "APROBADO";
 row[5] = "Nota interna"; row[6] = "Nota pública"; row[7] = "2026-11-24T04:00:00.000Z";
 row[8] = ""; row[11] = ""; row[12] = ""; row[13] = "2"; row[14] = "Dirección";
 row[15] = "CORR-" + id; row[16] = "APPS_SCRIPT";
 return row;
}
test("el append serializado crea hash, enlaza el evento y actualiza el checkpoint", () => {
 const properties = makePropertiesStore(), h = createHelpers(properties), sheet = makeMemorySheet();
 const result = h.append(sheet, newAuditEvent("DEC-1"), "USER-1");
 const rows = sheet.getDataRange().getValues().slice(1);
 const checkpoint = h.getCheckpoint();
 assert.equal(result.rowNumber, 2); assert.equal(rows.length, 1);
 assert.equal(rows[0][9], h.genesis); assert.match(rows[0][10], /^[a-f0-9]{64}$/);
 assert.equal(checkpoint.totalEvents, 1); assert.equal(checkpoint.lastDecisionId, "DEC-1");
});
test("el append bloquea una cadena alterada antes de aceptar un nuevo evento", () => {
 const h = createHelpers(), sheet = makeMemorySheet();
 h.append(sheet, newAuditEvent("DEC-1"), "USER-1");
 sheet.rows[1][5] = "Observación manipulada";
 assert.throws(() => h.append(sheet, newAuditEvent("DEC-2"), "USER-1"), /WORKFLOW_AUDIT_CHAIN_BROKEN_BEFORE_APPEND/);
 assert.equal(sheet.getLastRow(), 2);
});
test("el append detecta truncamiento de cola contra el checkpoint persistido", () => {
 const h = createHelpers(), sheet = makeMemorySheet();
 h.append(sheet, newAuditEvent("DEC-1"), "USER-1");
 h.append(sheet, newAuditEvent("DEC-2"), "USER-1");
 sheet.deleteRow(3);
 assert.throws(() => h.append(sheet, newAuditEvent("DEC-3"), "USER-1"), /WORKFLOW_AUDIT_TRUSTED_CHECKPOINT_MISMATCH/);
 assert.equal(sheet.getLastRow(), 2);
});
test("el append compensa la fila si falla la escritura del checkpoint", () => {
 const properties = makePropertiesStore({ failSetAt: 2 }), h = createHelpers(properties), sheet = makeMemorySheet();
 assert.throws(() => h.append(sheet, newAuditEvent("DEC-1"), "USER-1"), /PROPERTY_WRITE_FAILED/);
 assert.equal(sheet.getLastRow(), 1);
 const checkpoint = h.getCheckpoint();
 assert.equal(checkpoint.totalEvents, 0);
});

function createWorkflowMockContext(options = {}) {
 const original = makeRow("DEC-ORIGINAL", helpers.genesis);
 original[1] = "SOL-1";
 const decisionRows = options.decisionRows || [original];
 const decisionSheet = {
  rows: [Array(17).fill(""), ...decisionRows.map(row => row.slice())],
  getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
  getLastRow() { return this.rows.length; },
  appendRow(row) { this.rows.push(row.slice()); },
  deleteRow(number) { this.rows.splice(number - 1, 1); }
 };
 const requestRow = Array(11).fill("");
 requestRow[0] = "SOL-1"; requestRow[1] = "REQUESTER-1"; requestRow[3] = "Solicitud"; requestRow[6] = "En Revisión"; requestRow[7] = "Dirección";
 const requestSheet = {
  rows: [Array(11).fill(""), requestRow],
  getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
  getRange(row, column, numRows, numColumns) {
   const self = this;
   return {
    setValue(value) { if (options.failStateAt === column) throw new Error("STATE_WRITE_FAILED"); self.rows[row - 1][column - 1] = value; },
    setValues(values) { self.rows.splice(row - 1, values.length, ...values.map(v => v.slice())); }
   };
  }
 };
 const lock = { tryLock: () => options.locked !== false, releaseLock() {} };
 const context = {
  SPREADSHEET_ID: "USER-DB",
  LockService: { getScriptLock: () => lock },
  SpreadsheetApp: { openById: () => ({}), flush() {} },
  getOrCreateSheet: (ss, name) => name === "SolicitudesTramites" ? requestSheet : decisionSheet,
  ensureWorkflowDecisionAuditSchema_: sheet => sheet,
  verifyWorkflowDecisionAuditChain: () => ({ status: "success", cadenaValida: true }),
  appendWorkflowDecisionAuditEvent_: (sheet, row, actorId) => {
   row[9] = helpers.genesis; row[13] = "2"; row[10] = "a".repeat(64);
   sheet.appendRow(row);
   return { rowNumber: sheet.getLastRow(), hashActual: row[10], checkpointBefore: { updatedBy: actorId } };
  },
  verifyWorkflowDecisionAuditRows_: () => ({ totalEvents: 0, lastDecisionId: "", lastHash: helpers.genesis }),
  saveWorkflowDecisionAuditCheckpoint_: () => ({}),
  Utilities: { getUuid: () => "UUID-TEST" },
  dispatchWorkflowStatusNotification_: () => ({ status: "success" }),
  logStructuredEvent() {}
 };
 return { context, decisionSheet, requestSheet, original };
}
test("una corrección autorizada se agrega como evento nuevo y conserva intacto el original", () => {
 const mock = createWorkflowMockContext();
 const correctionFn = vm.runInNewContext("(" + extractFunction("recordWorkflowDecisionCorrection") + ")", mock.context);
 const result = correctionFn({ decisionIdOriginal: "DEC-ORIGINAL", solicitudId: "SOL-1", motivoCorreccion: "Motivo verificable",
  nuevaAccionDecision: "RECHAZADO", observaciones: "Corrección", _verifiedUserId: "USER-DIRECTOR", _verifiedRole: "Dirección", revisorId: "SPOOFED" });
 assert.equal(result.status, "success");
 const appended = mock.decisionSheet.rows[2];
 assert.equal(appended[3], "USER-DIRECTOR");
 assert.equal(appended[11], "DEC-ORIGINAL");
 assert.equal(appended[12], "Motivo verificable");
 assert.equal(mock.decisionSheet.rows[1][4], "APROBADO");
});
test("una corrección rechaza actor ausente, solicitud distinta y duplicado", () => {
 const mock = createWorkflowMockContext();
 const correctionFn = vm.runInNewContext("(" + extractFunction("recordWorkflowDecisionCorrection") + ")", mock.context);
 const base = { decisionIdOriginal: "DEC-ORIGINAL", solicitudId: "SOL-1", motivoCorreccion: "Motivo", nuevaAccionDecision: "RECHAZADO", _verifiedRole: "Dirección" };
 assert.throws(() => correctionFn(base), /WORKFLOW_VERIFIED_ACTOR_REQUIRED/);
 assert.throws(() => correctionFn({ ...base, _verifiedUserId: "USER-1", solicitudId: "SOL-OTHER" }), /DECISION_ORIGINAL_REQUEST_MISMATCH/);
 const duplicate = makeRow("DEC-CORR-OLD", mock.original[10], { stage: "Corrección-Revisión", originalId: "DEC-ORIGINAL", reason: "Ya corregida" });
 const duplicateMock = createWorkflowMockContext({ decisionRows: [mock.original, duplicate] });
 const duplicateFn = vm.runInNewContext("(" + extractFunction("recordWorkflowDecisionCorrection") + ")", duplicateMock.context);
 assert.throws(() => duplicateFn({ ...base, _verifiedUserId: "USER-1" }), /DECISION_ALREADY_CORRECTED/);
});
test("la corrección respeta el bloqueo de concurrencia", () => {
 const mock = createWorkflowMockContext({ locked: false });
 const correctionFn = vm.runInNewContext("(" + extractFunction("recordWorkflowDecisionCorrection") + ")", mock.context);
 assert.throws(() => correctionFn({ decisionIdOriginal: "DEC-ORIGINAL", solicitudId: "SOL-1", motivoCorreccion: "Motivo",
  nuevaAccionDecision: "RECHAZADO", _verifiedUserId: "USER-1", _verifiedRole: "Dirección" }), /WORKFLOW_CONCURRENCY_LOCKED/);
});
test("la decisión usa el actor verificado y rechaza correlationId duplicado", () => {
 const mock = createWorkflowMockContext();
 const processFn = vm.runInNewContext("(" + extractFunction("processWorkflowDecision") + ")", mock.context);
 const result = processFn({ solicitudId: "SOL-1", accionDecision: "APROBADO", revisorId: "SPOOFED",
  correlationId: "CORR-UNIQUE", _verifiedUserId: "USER-VERIFIED", _verifiedRole: "Dirección" });
 assert.equal(result.status, "success");
 assert.equal(mock.decisionSheet.rows[1][3], "USER-VERIFIED");
 assert.equal(mock.decisionSheet.rows[1][14], "Dirección");
 const duplicateRow = makeRow("DEC-OLD", helpers.genesis, { correlationId: "CORR-DUP" });
 const duplicateMock = createWorkflowMockContext({ decisionRows: [duplicateRow] });
 const duplicateProcess = vm.runInNewContext("(" + extractFunction("processWorkflowDecision") + ")", duplicateMock.context);
 assert.throws(() => duplicateProcess({ solicitudId: "SOL-1", accionDecision: "APROBADO", correlationId: "CORR-DUP",
  _verifiedUserId: "USER-VERIFIED", _verifiedRole: "Dirección" }), /WORKFLOW_DECISION_DUPLICATE_CORRELATION/);
});
