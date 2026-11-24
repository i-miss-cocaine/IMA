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
