const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const constantsStart = source.indexOf("const DOCUMENT_DELIVERY_HEADERS_ = [");
const constantsEnd = source.indexOf("];", constantsStart) + 2;
assert.ok(constantsStart >= 0 && constantsEnd > constantsStart, "document delivery schema must exist");
const constants = source.slice(constantsStart, constantsEnd);

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", lineComment = false, blockComment = false, escape = false, template = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === quote) quote = "";
      continue;
    }
    if (template) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === "\`") template = false;
      continue;
    }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === "\`") { template = true; continue; }
    if (c === "{") depth++;
    if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}

class FakeSheet {
  constructor(name, rows) { this.name = name; this.rows = rows || []; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows.reduce((max, row) => Math.max(max, row.length), 0); }
  appendRow(row) { this.rows.push(row.slice()); }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(row, col, numRows = 1, numCols = 1) {
    const self = this;
    return {
      getValues() {
        const out = [];
        for (let r = row - 1; r < row - 1 + numRows; r++) {
          const current = self.rows[r] || [];
          out.push(Array.from({ length: numCols }, (_, c) => current[col - 1 + c] === undefined ? "" : current[col - 1 + c]));
        }
        return out;
      },
      setValue(value) {
        while (self.rows.length < row) self.rows.push([]);
        while (self.rows[row - 1].length < col) self.rows[row - 1].push("");
        self.rows[row - 1][col - 1] = value;
      },
      setValues(values) {
        values.forEach((valuesRow, index) => {
          const targetRow = row - 1 + index;
          while (self.rows.length <= targetRow) self.rows.push([]);
          while (self.rows[targetRow].length < col - 1 + valuesRow.length) self.rows[targetRow].push("");
          valuesRow.forEach((value, offset) => { self.rows[targetRow][col - 1 + offset] = value; });
        });
      }
    };
  }
}
const store = {};
function sheet(name) {
  if (!store[name]) store[name] = new FakeSheet(name, []);
  return store[name];
}
const ss = {
  getSheetByName(name) { return store[name] ? sheet(name) : null; },
  insertSheet(name) { if (store[name]) throw new Error("SHEET_ALREADY_EXISTS"); return sheet(name); }
};

const hash = "a".repeat(64);
let actualHash = hash;
let uuidCounter = 0;
let notificationCalls = 0;
const notificationPayloads = [];
let failNextNotification = false;
let fileAccess = "PRIVATE";
let contextScope = {
  status: "success", institutionId: "INST-1", departmentIds: ["DEP-1"],
  activeDepartmentId: "DEP-1", institutionWide: false, userId: "SEC-1", role: "Secretaría"
};

const users = sheet("Usuarios");
users.appendRow(["UserID","Nombre","Apellido","Telefono","Email","Rol","InstitucionID","DepartamentoID","PersonaID","Codigo","Estado","ConsentimientoCorreo"]);
users.appendRow(["STU-1","Estudiante Uno","","","stu1@example.test","Estudiante","INST-1","DEP-1","PER-1","S-1","Activo","FALSE"]);
users.appendRow(["STU-2","Estudiante Dos","","","stu2@example.test","Estudiante","INST-1","DEP-1","PER-2","S-2","Activo","TRUE"]);
const issued = sheet("DocumentosEscolaresEmitidos");
function issuedRow(id, recipient, solicitud) {
  const row = new Array(17).fill("");
  row[0] = id; row[2] = recipient; row[5] = "issued"; row[7] = "FILE-" + id;
  row[14] = hash; row[15] = "v1"; row[16] = solicitud;
  return row;
}
issued.appendRow(["DocumentoID","Tipo","DestinatarioUserId","Titulo","FechaEmision","Estado","EmitidoPor","DriveFileID","MimeType","Bytes","HashFirma","FirmaID","CUV","Metodo","SHA256","VersionDocumento","SolicitudID"]);
issued.appendRow(issuedRow("DOC-1","STU-1","SOL-1"));
issued.appendRow(issuedRow("DOC-2","STU-1","SOL-2"));
issued.appendRow(issuedRow("DOC-3","STU-1","SOL-3"));
issued.appendRow(issuedRow("DOC-4","STU-1","SOL-4"));
issued.appendRow(issuedRow("DOC-5","STU-1","SOL-5"));
issued.appendRow(issuedRow("DOC-6","STU-2","SOL-6"));
issued.appendRow(issuedRow("DOC-7","STU-1","SOL-7"));

const file = {
  isTrashed() { return false; },
  getSharingAccess() { return fileAccess; },
  getBlob() { return { getBytes() { return [1,2,3]; } }; },
  getName() { return "constancia.pdf"; },
  getMimeType() { return "application/pdf"; }
};

const context = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById() { return ss; } },
  DriveApp: { Access: { PRIVATE: "PRIVATE" }, getFileById() { return file; } },
  PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "PORTAL_BASE_URL" ? "https://portal.example.test/app" : ""; } }; } },
  LockService: { getScriptLock() { return { waitLock() {}, tryLock() { return true; }, releaseLock() {} }; } },
  Utilities: { getUuid() { uuidCounter++; return "UUID-" + String(uuidCounter).padStart(8,"0"); } },
  getUserVerifiedRole(payload) {
    payload._verifiedUserId = payload._verifiedUserId || payload._userId;
    return payload._verifiedRole || payload._role || "Secretaría";
  },
  getUserContextScope() { return contextScope; },
  getIdentityInstitutionId_() { return "INST-1"; },
  assertAdvancedSignatureDocumentScope_(_payload, _ss, documentId, solicitudId) {
    const row = issued.rows.find(item => String(item[0]) === String(documentId));
    if (!row) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
    return {
      authorized: true, documentId: String(row[0]), documentSource: "DOCUMENTO_ESCOLAR_EMITIDO",
      solicitudId: String(row[16]), storedDocumentHash: String(row[14]), documentVersion: String(row[15]),
      departmentId: "DEP-1", institutionId: "INST-1"
    };
  },
  computeDocumentSHA256() { return actualHash; },
  sendMultiChannelNotification(payload) {
    notificationCalls++;
    notificationPayloads.push(payload || {});
    if (failNextNotification) { failNextNotification = false; throw new Error("SIMULATED_NOTIFICATION_FAILURE"); }
    return { status: "success", notificacionId: "NTF-" + notificationCalls, emailSent: !!(payload && payload.emailRecipient) };
  },
  logStructuredEvent() {},
  Date, Math, JSON, String, Number, Array, Object, Error, isFinite, encodeURIComponent
};
vm.createContext(context);
const names = [
  "ensureDocumentDeliverySheet_", "getDocumentDeliverySheetForRead_",
  "getDocumentDeliveryAllowedDepartmentIds_", "isDocumentDeliveryDepartmentAllowed_",
  "getDocumentDeliverySenderContext_", "getIssuedDocumentSnapshot_", "getDocumentDeliveryRecipient_",
  "appendDocumentDeliveryEvent_", "findDocumentDeliveryRow_", "writeDocumentDeliveryRow_",
  "getDocumentDeliveryPortalLink_", "dispatchDocumentDelivery_", "registerDepartmentalDocumentDelivery",
  "retryDepartmentalDocumentDelivery", "getDepartmentalOutbox", "getMyDepartmentalOutbox",
  "sendInstitutionalDispatch", "createDepartmentalBatchIdempotencyKey_", "sendInstitutionalDispatchBatch", "getDocumentDeliveryReceiptMode_",
  "getMyDocumentDeliveries", "openDepartmentalDocumentDelivery", "confirmDepartmentalDocumentReceipt",
  "revokeDepartmentalDocumentDeliveryLink"
];
vm.runInContext(constants + "\n" + names.map(name => extractFunction(name)).join("\n"), context);

function senderPayload(extra = {}) {
  return Object.assign({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", documentoId: "DOC-1", solicitudId: "SOL-1", canal: "PLATAFORMA" }, extra);
}
const registered = context.registerDepartmentalDocumentDelivery(senderPayload({ idempotencyKey: "IDEM-DELIVERY-001" }));
assert.equal(registered.status, "success");
assert.equal(registered.estadoDespacho, "ACEPTADO_POR_PLATAFORMA");
assert.equal(registered.estadoAcuse, "PENDIENTE");
assert.ok(registered.deliveryId.startsWith("ENT-"));
assert.equal(notificationCalls, 1);

const duplicate = context.registerDepartmentalDocumentDelivery(senderPayload({ idempotencyKey: "IDEM-DELIVERY-001" }));
assert.equal(duplicate.status, "success");
assert.equal(duplicate.idempotent, true);
assert.equal(duplicate.deliveryId, registered.deliveryId);
assert.equal(notificationCalls, 1, "idempotent retry must not duplicate platform notification");

const outbox = context.getDepartmentalOutbox({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", documentoId: "DOC-1" });
assert.equal(outbox.status, "success");
assert.equal(outbox.total, 1);
assert.equal(outbox.data[0].sha256Documento, hash);
assert.equal(outbox.data[0].estadoDespacho, "ACEPTADO_POR_PLATAFORMA");

const recipientInbox = context.getMyDocumentDeliveries({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" });
assert.equal(recipientInbox.status, "success");
assert.equal(recipientInbox.data.length, 1);
assert.equal(recipientInbox.data[0].entregaId, registered.deliveryId);

const wrongRecipientOpen = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-2", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId });
assert.equal(wrongRecipientOpen.code, "DOCUMENT_DELIVERY_RECIPIENT_MISMATCH");

const opened = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId });
assert.equal(opened.status, "success");
assert.equal(opened.sha256, hash);
const openedAgain = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId });
assert.equal(openedAgain.idempotent, true);

const noExplicitReceipt = context.confirmDepartmentalDocumentReceipt({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId, confirmacionExplicita: false });
assert.equal(noExplicitReceipt.code, "EXPLICIT_RECEIPT_REQUIRED");
const receipt = context.confirmDepartmentalDocumentReceipt({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId, confirmacionExplicita: true, observacionRecepcion: "Recibido" });
assert.equal(receipt.status, "success");
assert.equal(receipt.estadoAcuse, "RECIBIDO_CONFIRMADO");
const receiptAgain = context.confirmDepartmentalDocumentReceipt({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId, confirmacionExplicita: true });
assert.equal(receiptAgain.idempotent, true);

const revoked = context.revokeDepartmentalDocumentDeliveryLink({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", deliveryId: registered.deliveryId, motivo: "Enlace sustituido" });
assert.equal(revoked.status, "success");
assert.equal(revoked.estadoEnlace, "REVOCADO");
const openRevoked = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: registered.deliveryId });
assert.equal(openRevoked.code, "DELIVERY_LINK_REVOKED");

const wrongRecipientDispatch = context.registerDepartmentalDocumentDelivery(senderPayload({ destinatarioUserId: "STU-2", idempotencyKey: "IDEM-WRONG-RECIPIENT" }));
assert.equal(wrongRecipientDispatch.code, "DOCUMENT_RECIPIENT_MISMATCH");

context.getUserContextScope = () => Object.assign({}, contextScope, { activeDepartmentId: "DEP-2", departmentIds: ["DEP-1","DEP-2"] });
const outOfScope = context.getDepartmentalOutbox({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", departamentoId: "DEP-1" });
assert.equal(outOfScope.code, "ACTIVE_SCOPE_NOT_ASSIGNED");
const wrongDepartmentRegister = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-2", solicitudId: "SOL-2", idempotencyKey: "IDEM-DEP-2" }));
assert.equal(wrongDepartmentRegister.code, "DEPARTMENT_SCOPE_NOT_ASSIGNED");
context.getUserContextScope = () => contextScope;

failNextNotification = true;
const failedDispatch = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-2", solicitudId: "SOL-2", idempotencyKey: "IDEM-DELIVERY-002" }));
assert.equal(failedDispatch.status, "error");
assert.equal(failedDispatch.code, "DOCUMENT_DELIVERY_DISPATCH_PENDING");
const retried = context.retryDepartmentalDocumentDelivery({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", deliveryId: failedDispatch.deliveryId });
assert.equal(retried.status, "success");
assert.equal(retried.estadoDespacho, "ACEPTADO_POR_PLATAFORMA");
const retriedAgain = context.retryDepartmentalDocumentDelivery({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", deliveryId: failedDispatch.deliveryId });
assert.equal(retriedAgain.idempotent, true);

const expired = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-3", solicitudId: "SOL-3", idempotencyKey: "IDEM-DELIVERY-003", expirationDays: 1 }));
assert.equal(expired.status, "success");
const deliverySheet = store.EntregasDocumentales;
const headers = deliverySheet.rows[0];
const expiryIndex = headers.indexOf("FechaExpiracionEnlace");
const idIndex = headers.indexOf("EntregaID");
const expiredRow = deliverySheet.rows.find(row => row[idIndex] === expired.deliveryId);
expiredRow[expiryIndex] = new Date(Date.now() - 1000);
const expiredOpen = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: expired.deliveryId });
assert.equal(expiredOpen.code, "DELIVERY_LINK_EXPIRED");
assert.equal(expiredRow[headers.indexOf("EstadoEnlace")], "EXPIRADO");

actualHash = "b".repeat(64);
const tamperedOpen = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: retried.deliveryId });
assert.equal(tamperedOpen.code, "DOCUMENT_HASH_MISMATCH");
actualHash = hash;

fileAccess = "ANYONE_WITH_LINK";
const publicFile = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-4", solicitudId: "SOL-4", idempotencyKey: "IDEM-PUBLIC-FILE" }));
assert.equal(publicFile.code, "DOCUMENT_FILE_NOT_PRIVATE");
fileAccess = "PRIVATE";


const personalOutbox = context.getMyDepartmentalOutbox({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría" });
assert.equal(personalOutbox.status, "success");
assert.ok(personalOutbox.data.every(item => item.remitenteUserId === "SEC-1"));
const forgedPersonalOutbox = context.getDepartmentalOutbox({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", remitenteUserId: "SEC-OTHER" });
assert.equal(forgedPersonalOutbox.code, "OUTBOX_SENDER_MISMATCH");

const noConsentEmail = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-5", solicitudId: "SOL-5", canal: "CORREO", idempotencyKey: "IDEM-EMAIL-NO-CONSENT" }));
assert.equal(noConsentEmail.code, "EMAIL_CONSENT_REQUIRED");
const emailDispatch = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-6", solicitudId: "SOL-6", canal: "PLATAFORMA_Y_CORREO", idempotencyKey: "IDEM-EMAIL-CONSENT" }));
assert.equal(emailDispatch.status, "success");
assert.equal(emailDispatch.estadoDespacho, "ACEPTADO_POR_PLATAFORMA");
const emailOutbox = context.getDepartmentalOutbox({ _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", documentoId: "DOC-6" });
const emailOutboxEntry = emailOutbox.data.find(item => item.canal === "PLATAFORMA_Y_CORREO");
assert.ok(emailOutboxEntry);
assert.equal(emailOutboxEntry.estadoCorreo, "ENVIADO");
assert.equal(notificationPayloads[notificationPayloads.length - 1].emailRecipient, "stu2@example.test");

assert.notEqual(
  context.createDepartmentalBatchIdempotencyKey_("BATCH-1", "DOC-5"),
  context.createDepartmentalBatchIdempotencyKey_("BATCH-1", "DOC-6"),
  "each recipient document in a batch needs an independent idempotency key"
);
const batch = context.sendInstitutionalDispatchBatch({
  _verifiedUserId: "SEC-1", _verifiedRole: "Secretaría", idempotencyKey: "BATCH-OUTBOX-001",
  items: [
    { documentoId: "DOC-5", solicitudId: "SOL-5" },
    { documentoId: "DOC-6", solicitudId: "SOL-6" }
  ]
});
assert.equal(batch.status, "success");
assert.equal(batch.succeeded, 2);
assert.equal(batch.failed, 0);
const studentTwoInbox = context.getMyDocumentDeliveries({ _verifiedUserId: "STU-2", _verifiedRole: "Estudiante" });
assert.ok(studentTwoInbox.data.some(item => item.documentoId === "DOC-6"));

const config = sheet("ConfiguracionInstitucional");
config.appendRow(["Clave", "Valor", "Estado", "InstitutionID"]);
config.appendRow(["MODALIDAD_ACUSE_RECIBO_NOTIFICACIONES", "AUTOMATICO_POR_LECTURA", "ACTIVO", "INST-1"]);
const autoDelivery = context.registerDepartmentalDocumentDelivery(senderPayload({ documentoId: "DOC-7", solicitudId: "SOL-7", idempotencyKey: "IDEM-AUTO-RECEIPT" }));
assert.equal(autoDelivery.status, "success");
const autoOpen = context.openDepartmentalDocumentDelivery({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", deliveryId: autoDelivery.deliveryId });
assert.equal(autoOpen.status, "success");
assert.equal(autoOpen.modalidadAcuse, "AUTOMATICO_POR_LECTURA");
assert.equal(autoOpen.estadoAcuse, "RECIBIDO_AUTOMATICO_POR_LECTURA");
assert.match(autoOpen.advertencia, /no equivale a firma electrónica avanzada/);
assert.equal(context.getDocumentDeliveryReceiptMode_(ss, "INST-2"), "EXPLICITO_CLIC_CONFIRMACION");

console.log("PASS: departmental document outbox, scoped delivery, verified opening, explicit receipt, expiry, revocation, idempotency and integrity.");
