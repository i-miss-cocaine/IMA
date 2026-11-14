"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
const uiSource = fs.readFileSync("js/ui-common.js", "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed " + name);
}

const rows = Object.create(null);
const headers = {
  Usuarios: ["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","Estado"],
  RelacionesFamiliares: ["RelacionID","PersonaEstudianteID","PersonaResponsableID","TipoParentesco","EstadoAutorizacion","FechaInicio","FechaFin","Observaciones"],
  CreditoFamiliarConfiguracion: ["ConfiguracionID","ResponsableUserID","ModalidadAprobacion","FechaActualizacion","ActualizadoPor","PinSalt","PinHash","PinUpdatedAt","FailedAttempts","LockedUntil"],
  CreditoFamiliarAutorizaciones: ["AutorizacionID","Fecha","ResponsableUserId","EstudianteUserId","LimiteDiario","LimiteMensual","SaldoUsado","Estado","FechaVencimiento","Observaciones","ModalidadAprobacion","PinApprovedBy","PinApprovedAt"]
};
function makeSheet(name) {
  if (!rows[name]) rows[name] = headers[name] ? [headers[name].slice()] : [];
  return {
    getDataRange() { return { getValues() { return rows[name].map(r => r.slice()); } }; },
    getLastRow() { return rows[name].length; },
    appendRow(row) { if (failNextAppend) { failNextAppend = false; throw new Error('APPEND_FAIL'); } rows[name].push(row.slice()); },
    getRange(row, col) {
      return {
        setValue(value) {
          while (rows[name].length < row) rows[name].push([]);
          while (rows[name][row - 1].length < col) rows[name][row - 1].push("");
          rows[name][row - 1][col - 1] = value;
        },
        setValues(values) {
          values.forEach((valuesRow, rowOffset) => {
            while (rows[name].length < row + rowOffset) rows[name].push([]);
            valuesRow.forEach((value, colOffset) => {
              rows[name][row + rowOffset - 1][col + colOffset - 1] = value;
            });
          });
        }
      };
    }
  };
}
const ss = { getSheetByName(name) { return rows[name] ? makeSheet(name) : null; } };
let lockBusy = false, uuid = 0, lockReleased = false, failNextAppend = false;
const context = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById() { return ss; } },
  LockService: { getScriptLock() { return { waitLock() { if (lockBusy) throw new Error("LOCK_BUSY"); }, releaseLock() { lockReleased = true; } }; } },
  Utilities: { getUuid() { return "UUID-" + (++uuid); } },
  getOrCreateSheet(db, name) { return makeSheet(name); },
  computeHmacSignature(message, secret) { return "HMAC:" + secret + ":" + message; },
  getAuthTokenSecret() { return "test-auth-secret-012345678901234567890123456789"; },
  PropertiesService: { getScriptProperties() { return {
    getProperty(key) { return key === "FAMILY_CREDIT_PIN_SECRET" ? "test-family-credit-pin-secret-0123456789" : ""; },
    setProperty(key, value) { this[key] = value; }
  }; } },
  applyApprovedScholarshipsToCharges() { return { status: "success" }; },
  transportParseDate_(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  },
  Date, String, Object, Array, JSON, Error, console
};
vm.createContext(context);
const names = ["sanitizePayloadForLog", "familyCreditPinSecret_", "familyCreditGetStatementMovements_", "familyCreditGetActiveStudentUserIdsForGuardian_", "getStoreOrders", "getCafeteriaOrders", "getStudentAccountStatement", "familyCreditEnsureConfigSheet_", "familyCreditEnsureAuthorizationSheet_", "familyCreditPinDigest_", "familyCreditConstantTimeEquals_", "familyCreditVerifyPinInConfig_", "familyCreditApprovalActor_", "familyCreditEnsurePurchaseAuthorization_", "familyCreditRequirePurchaseAuthorizationForStudent_", "familyCreditGuardianHasActiveStudentRelation_", "familyCreditGuardianCanAuthorizeStudent_", "familyCreditIsRequested_", "getFamilyCreditApprovalPreference", "configureFamilyCreditApprovalPreference", "configureFamilyCreditPin", "configureFamilyCreditAuthorization", "getFamilyCreditAuthorizations", "processFamilyCreditPurchase", "createStoreOrder", "createCafeteriaOrder"];
vm.runInContext(names.map(extractFunction).join("\n"), context);
const sanitizedPinPayload = context.sanitizePayloadForLog({ familyPin: "123456", currentPin: "654321", newPin: "111111", nested: { pinHash: "HASH-ONLY", authToken: "SESSION-TOKEN" } });
assert.equal(sanitizedPinPayload.includes("123456"), false);
assert.equal(sanitizedPinPayload.includes("654321"), false);
assert.equal(sanitizedPinPayload.includes("111111"), false);
assert.match(sanitizedPinPayload, /MASKED/);
assert.equal(context.familyCreditPinSecret_(), "test-family-credit-pin-secret-0123456789", "family PIN pepper must be independent from AUTH_TOKEN_SECRET");

rows.Usuarios = [
  headers.Usuarios,
  ["GUARD-1","Tutor Uno","","","","","Padre","","","PERSON-G","Activo"],
  ["STU-1","Alumno Uno","","","","","Estudiante","","","PERSON-S","Activo"],
  ["STU-2","Alumno Dos","","","","","Estudiante","","","PERSON-S2","Activo"],
  ["OTHER-G","Tutor Dos","","","","","Padre","","","PERSON-OTHER","Activo"]
];
rows.RelacionesFamiliares = [
  headers.RelacionesFamiliares,
  ["REL-1","PERSON-S","PERSON-G","Madre","Aprobado","","",""],
  ["REL-2","PERSON-S2","PERSON-OTHER","Madre","Aprobado","","",""]
];
rows.CreditoFamiliarConfiguracion = [
  headers.CreditoFamiliarConfiguracion.slice(0, 5),
  ["CFG-LEGACY", "GUARD-1", "", new Date(), "GUARD-1"]
];

rows.CreditoFamiliarAutorizaciones = [
  headers.CreditoFamiliarAutorizaciones.slice(0, 10),
  ["AUT-1", new Date(), "GUARD-1", "STU-1", 50, 500, 10, "Activa", "", ""],
  ["AUT-2", new Date(), "OTHER-G", "STU-2", 60, 600, 20, "Activa", "", ""]
];
const guardianAuthorizations = context.getFamilyCreditAuthorizations({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(rows.CreditoFamiliarAutorizaciones[0].length, 13, "legacy ten-column authorization sheet must be migrated");
assert.equal(guardianAuthorizations.autorizaciones.length, 1);
assert.equal(guardianAuthorizations.autorizaciones[0].estudianteUserId, "STU-1");
const studentAuthorizations = context.getFamilyCreditAuthorizations({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" });
assert.equal(studentAuthorizations.autorizaciones.length, 1);
assert.equal(studentAuthorizations.autorizaciones[0].estudianteUserId, "STU-1");
assert.throws(() => context.getFamilyCreditAuthorizations({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", estudianteUserId: "STU-2" }), /FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED/);
assert.throws(() => context.getFamilyCreditAuthorizations({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-2" }), /FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED/);


const loaded = context.getFamilyCreditApprovalPreference({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(rows.CreditoFamiliarConfiguracion[0].length, 10, "legacy five-column config sheet must be migrated");
assert.equal(rows.CreditoFamiliarConfiguracion[0][5], "PinSalt");
assert.equal(loaded.configured, false);
assert.equal(loaded.modalidadAprobacion, null);
assert.equal(loaded.pinConfigured, false);

const saved = context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre",
  responsableUserId: "OTHER-G", modalidadAprobacion: "POR_CUPO"
});
assert.equal(saved.status, "success");
assert.equal(saved.modalidadAprobacion, "POR_CUPO");
assert.equal(rows.CreditoFamiliarConfiguracion[1][1], "GUARD-1", "actor must come from verified session, never caller payload");
assert.equal(rows.CreditoFamiliarConfiguracion[1][4], "GUARD-1");
const pinSaved = context.configureFamilyCreditPin({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", newPin: "123456", confirmPin: "123456"
});
assert.equal(pinSaved.pinConfigured, true);
assert.notEqual(rows.CreditoFamiliarConfiguracion[1][6], "123456", "PIN must never be stored in plaintext");
assert.equal(rows.CreditoFamiliarConfiguracion[1][5].length > 0, true, "PIN salt must be stored");
assert.equal(context.getFamilyCreditApprovalPreference({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }).pinConfigured, true);
assert.throws(() => context.configureFamilyCreditPin({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", newPin: "654321", confirmPin: "654321"
}), /FAMILY_CREDIT_CURRENT_PIN_REQUIRED/);
assert.throws(() => context.configureFamilyCreditPin({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", currentPin: "000000", newPin: "654321", confirmPin: "654321"
}), /FAMILY_CREDIT_PIN_INVALID/);
const pinChanged = context.configureFamilyCreditPin({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", currentPin: "123456", newPin: "654321", confirmPin: "654321"
});
assert.equal(pinChanged.pinConfigured, true);

const reloaded = context.getFamilyCreditApprovalPreference({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(reloaded.configured, true);
assert.equal(reloaded.modalidadAprobacion, "POR_CUPO");
assert.equal(lockReleased, true);
assert.equal(context.familyCreditGuardianCanAuthorizeStudent_(ss, "GUARD-1", "STU-1"), true);
assert.equal(context.familyCreditGuardianCanAuthorizeStudent_(ss, "GUARD-1", "STU-2"), false);

rows.CargosEstudiante = [
  ["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento","Observaciones","ClaveUnicaDedupe","BatchId"],
  ["CH-1",new Date(),"STU-1","Colegiatura",100,0,100,"Pendiente","","","",""]
];
rows.PagosAbonos = [
  ["PagoID","Fecha","UserId","CargoID","Concepto","MontoAbono","MetodoPago","Referencia","Estado","ReciboID","Observaciones"],
  ["PAY-1",new Date(),"STU-1","CH-1","Colegiatura",40,"Transferencia","REF-1","Confirmado","",""]
];
rows.CreditoFamiliarMovimientos = [
  ["MovimientoCreditoID","Fecha","AutorizacionID","EstudianteUserId","ResponsableUserId","Establecimiento","Monto","OrigenRefId","Estado","Observaciones"],
  ["MOV-1",new Date(),"AUT-1","STU-1","GUARD-1","Tienda",25,"ORD-1","Aprobado",""],
  ["MOV-2",new Date(),"AUT-1","STU-1","GUARD-1","Tienda",12,"ORD-2","Pendiente",""],
  ["MOV-3",new Date(),"AUT-1","STU-1","GUARD-1","Tienda",5,"ORD-1-REV","Reversado",""],
  ["MOV-4",new Date(),"AUT-2","STU-2","OTHER-G","Cafetería",20,"CAF-1","Aprobado",""]
];
rows.TiendaOrdenes = [
  ["OrdenID","Fecha","UserId","CompradorNombre","DetalleJSON","MontoTotal","MetodoPago","EstadoPago","EstadoEntrega","MetodoEntrega","PDFComprobanteUrl","Observaciones"],
  ["ORD-1",new Date(),"STU-1","Alumno Uno","[]",25,"CreditoFamiliar","PendienteAprobacionFamiliar","Pendiente","","",""],
  ["ORD-2",new Date(),"STU-2","Alumno Dos","[]",20,"CreditoFamiliar","PendienteAprobacionFamiliar","Pendiente","","",""]
];
rows.CafeteriaPedidos = [
  ["PedidoID","Fecha","EstudianteUserId","ResponsableUserId","DetalleJSON","TurnoEntrega","MontoTotal","MetodoPago","Estado","Observaciones"],
  ["CAF-1",new Date(),"STU-1","STU-1","[]","Almuerzo",25,"CreditoFamiliar","PendienteAprobacionFamiliar",""],
  ["CAF-2",new Date(),"STU-2","OTHER-G","[]","Almuerzo",20,"CreditoFamiliar","PendienteAprobacionFamiliar",""]
];
assert.equal(context.getStoreOrders({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }).ordenes.length, 1);
assert.throws(() => context.getStoreOrders({ userId: "STU-2", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }), /FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED/);
assert.equal(context.getStoreOrders({ userId: "STU-2", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" }).ordenes[0].userId, "STU-1");
assert.equal(context.getCafeteriaOrders({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }).pedidos.length, 1);
assert.throws(() => context.getCafeteriaOrders({ estudianteUserId: "STU-2", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }), /FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED/);
assert.equal(context.getCafeteriaOrders({ estudianteUserId: "STU-2", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" }).pedidos[0].estudianteUserId, "STU-1");

const guardianStatement = context.getStudentAccountStatement({ userId: "STU-1", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(guardianStatement.data.consumosCreditoFamiliar.length, 2);
assert.equal(guardianStatement.data.totalConsumoCreditoFamiliar, 20, "approved consumption and reversals must net without creating a second school charge");
assert.equal(guardianStatement.data.saldoPendiente, 60, "family credit consumption remains separate from tuition balance");
assert.throws(() => context.getStudentAccountStatement({ userId: "STU-2", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }), /FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED/);
const studentStatement = context.getStudentAccountStatement({ userId: "STU-2", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" });
assert.equal(studentStatement.data.userId, "STU-1", "students cannot request another student's statement");
assert.equal(studentStatement.data.totalConsumoCreditoFamiliar, 20);
assert.equal(context.familyCreditIsRequested_("Crédito Familiar"), true, "accented payment method must still be recognized as family credit");
assert.equal(context.familyCreditIsRequested_("Credito Familiar"), true);
assert.throws(() => context.configureFamilyCreditAuthorization({ responsableUserId: "OTHER-G", estudianteUserId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" }), /FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED/);
assert.throws(() => context.configureFamilyCreditAuthorization({ responsableUserId: "GUARD-1", estudianteUserId: "STU-1", limiteDiario: 100, limiteMensual: 50, _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }), /FAMILY_CREDIT_LIMITS_INVALID/);
assert.throws(() => context.configureFamilyCreditAuthorization({ responsableUserId: "GUARD-1", estudianteUserId: "STU-1", limiteDiario: 50, limiteMensual: 500, familyPin: "000000", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }), /FAMILY_CREDIT_PIN_INVALID/);
const configuredCredit = context.configureFamilyCreditAuthorization({ responsableUserId: "GUARD-1", estudianteUserId: "STU-1", limiteDiario: 50, limiteMensual: 500, familyPin: "654321", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(configuredCredit.status, "success");
assert.equal(rows.CreditoFamiliarAutorizaciones[1][2], "GUARD-1");
assert.equal(rows.CreditoFamiliarAutorizaciones[1][10], "POR_CUPO");
assert.equal(rows.CreditoFamiliarAutorizaciones[1][11], "GUARD-1");
assert.ok(rows.CreditoFamiliarAutorizaciones[1][12]);
const switchedToPerPurchase = context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", modalidadAprobacion: "POR_COMPRA"
});
assert.equal(switchedToPerPurchase.modalidadAprobacion, "POR_COMPRA");
const perPurchaseAuthorization = context.configureFamilyCreditAuthorization({
  responsableUserId: "GUARD-1", estudianteUserId: "STU-1", limiteDiario: 50, limiteMensual: 500,
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre"
});
assert.equal(perPurchaseAuthorization.modalidadAprobacion, "POR_COMPRA");
assert.equal(perPurchaseAuthorization.pinAprobado, false);
assert.equal(rows.CreditoFamiliarAutorizaciones[1][11], "");
rows.TiendaOrdenes.push(["ORD-3", new Date(), "STU-1", "Alumno Uno", "[]", 10, "CreditoFamiliar", "PendienteAprobacionFamiliar", "Pendiente", "", "", ""]);
rows.CafeteriaPedidos.push(["CAF-3", new Date(), "STU-1", "GUARD-1", "[]", "Almuerzo", 10, "CreditoFamiliar", "PendienteAprobacionFamiliar", ""]);
const approvedStore = context.processFamilyCreditPurchase({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-1",
  establecimiento: "TIENDA", origenRefId: "ORD-3", familyPin: "654321"
});
assert.equal(approvedStore.approved, true);
assert.equal(rows.TiendaOrdenes.find(row => row[0] === "ORD-3")[7], "AprobadoCreditoFamiliar");
assert.equal(rows.CreditoFamiliarMovimientos.find(row => row[7] === "ORD-3")[8], "Aprobado");
const storeRetry = context.processFamilyCreditPurchase({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-1",
  establecimiento: "TIENDA", origenRefId: "ORD-3", familyPin: "654321"
});
assert.equal(storeRetry.idempotent, true);
assert.equal(rows.CreditoFamiliarMovimientos.filter(row => row[7] === "ORD-3").length, 1, "retry must not duplicate a debit");
const approvedCafe = context.processFamilyCreditPurchase({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-1",
  establecimiento: "CAFETERIA", origenRefId: "CAF-3", familyPin: "654321"
});
assert.equal(approvedCafe.approved, true);
assert.equal(rows.CafeteriaPedidos.find(row => row[0] === "CAF-3")[8], "AprobadoCreditoFamiliar");
assert.equal(rows.CreditoFamiliarAutorizaciones[1][6], 30, "approved purchases add to the existing used balance");
rows.TiendaOrdenes.push(["ORD-4", new Date(), "STU-1", "Alumno Uno", "[]", 10, "CreditoFamiliar", "PendienteAprobacionFamiliar", "Pendiente", "", "", ""]);
assert.throws(() => context.processFamilyCreditPurchase({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-1",
  establecimiento: "TIENDA", origenRefId: "ORD-4", familyPin: "654321"
}), /FAMILY_CREDIT_DAILY_LIMIT_EXCEEDED/);
assert.equal(rows.TiendaOrdenes.find(row => row[0] === "ORD-4")[7], "PendienteAprobacionFamiliar");


for (let attempt = 0; attempt < 5; attempt++) {
  const expected = attempt === 4 ? /FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED/ : /FAMILY_CREDIT_PIN_INVALID/;
  assert.throws(() => context.configureFamilyCreditPin({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", currentPin: "000000", newPin: "111111", confirmPin: "111111" }), expected);
}
assert.ok(rows.CreditoFamiliarConfiguracion[1][9] instanceof Date, "five failed PIN attempts must set a temporary lock");
assert.throws(() => context.configureFamilyCreditPin({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", currentPin: "654321", newPin: "111111", confirmPin: "111111" }), /FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED/);

assert.throws(() => context.processFamilyCreditPurchase({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-1", establecimiento: "TIENDA", origenRefId: "ORD-4", familyPin: "654321" }), /FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED/);

assert.throws(() => context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", modalidadAprobacion: "CUALQUIERA"
}), /FAMILY_CREDIT_APPROVAL_MODE_INVALID/);
assert.throws(() => context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", modalidadAprobacion: "POR_COMPRA"
}), /FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED/);
assert.throws(() => context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "NO-REL", _verifiedRole: "Tutor", modalidadAprobacion: "POR_COMPRA"
}), /FAMILY_CREDIT_ACTIVE_GUARDIAN_RELATION_REQUIRED/);

rows.CreditoFamiliarConfiguracion.push(["CFG-DUP","GUARD-1","POR_COMPRA",new Date(),"GUARD-1"]);
assert.throws(() => context.getFamilyCreditApprovalPreference({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre"
}), /FAMILY_CREDIT_CONFIGURATION_DUPLICATE/);
rows.CreditoFamiliarConfiguracion.pop();

lockBusy = true;
assert.throws(() => context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", modalidadAprobacion: "POR_COMPRA"
}), /LOCK_BUSY/);
lockBusy = false;

assert.match(uiSource, /role-cfg-family-credit-mode/);
assert.match(uiSource, /role-cfg-family-credit-approval-pin/);
assert.match(uiSource, /loadFamilyCreditPendingOrders/);
assert.match(uiSource, /approveFamilyCreditOrder/);
assert.match(uiSource, /configureFamilyCreditPin/);
assert.match(uiSource, /role-cfg-family-credit-new-pin/);
assert.match(uiSource, /fetchApi\('ACCOUNTING', 'configureFamilyCreditApprovalPreference'/);
assert.match(source, /case "getFamilyCreditApprovalPreference"/);
assert.match(source, /case "configureFamilyCreditApprovalPreference"/);
assert.match(source, /FAMILY_CREDIT_PIN_APPROVAL_REQUIRED/);
assert.match(source, /FAMILY_CREDIT_DAILY_LIMIT_EXCEEDED/);
assert.match(source, /PendienteAprobacionFamiliar/);
assert.match(source, /FAMILY_CREDIT_GUARDIAN_OWNERSHIP_REQUIRED/);
assert.match(source, /FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED/);
assert.match(source, /case "configureFamilyCreditPin"/);
assert.match(source, /FAMILY_CREDIT_PIN_TEMPORARILY_LOCKED/);
assert.match(source, /safeRequestMeta/);
assert.match(source, /pinSensitiveActions/);
assert.doesNotMatch(source, /e \? e\.postData : null/);

rows.TiendaProductos = [
  ["ProductoID","Categoria","Codigo","Unidad","Nombre","Precio","Stock","Estado","Disponibilidad"],
  ["PROD-1","","","","Cuaderno",10,5,"","Disponible"],
  ["PROD-2","","","","Lápiz",2,2,"","Disponible"]
];
rows.TiendaOrdenes = [["OrdenID","Fecha","UserId","CompradorNombre","DetalleJSON","MontoTotal","MetodoPago","EstadoPago","EstadoEntrega","MetodoEntrega","PDF","Observaciones"]];
const storeCreated = context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-1", cantidad: 2 }, { productoId: "PROD-1", cantidad: 1 }],
  metodoPago: "Transferencia"
});
assert.equal(storeCreated.status, "success");
assert.equal(rows.TiendaProductos[1][6], 2, "duplicate line items must be aggregated before stock deduction");
assert.equal(rows.TiendaOrdenes.length, 2);
assert.equal(rows.TiendaOrdenes[1][7], "Pendiente");
const storeCreditCreated = context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-1", cantidad: 1 }], metodoPago: "CreditoFamiliar"
});
assert.equal(storeCreditCreated.status, "success");
assert.equal(rows.TiendaOrdenes[2][7], "PendienteAprobacionFamiliar", "family credit orders must await guardian PIN approval");
assert.throws(() => context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-1", cantidad: 3 }], metodoPago: "Transferencia"
}), /STORE_INSUFFICIENT_STOCK/);
assert.equal(rows.TiendaProductos[1][6], 2, "insufficient stock must not change inventory");
assert.throws(() => context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "MISSING", cantidad: 1 }], metodoPago: "Transferencia"
}), /STORE_PRODUCT_NOT_FOUND/);
assert.throws(() => context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-1", cantidad: -1 }], metodoPago: "Transferencia"
}), /ORDER_QUANTITY_INVALID/);

const storeOverride = context.createStoreOrder({
  userId: "STU-2", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-2", cantidad: 1 }], metodoPago: "Transferencia"
});
assert.equal(rows.TiendaOrdenes[2][2], "STU-1", "student order creation must use verified student identity");
assert.equal(storeOverride.status, "success");
assert.throws(() => context.createStoreOrder({
  userId: "STU-2", _verifiedUserId: "GUARD-1", _verifiedRole: "Padre",
  detalleItems: [{ productoId: "PROD-2", cantidad: 1 }], metodoPago: "Transferencia"
}), /FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED/);
const stockBeforeAppendFailure = rows.TiendaProductos[2][6];
failNextAppend = true;
assert.throws(() => context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-2", cantidad: 1 }], metodoPago: "Transferencia"
}), /APPEND_FAIL/);
assert.equal(rows.TiendaProductos[2][6], stockBeforeAppendFailure, "failed order persistence must roll back stock");

const storeStockBeforeLock = rows.TiendaProductos[1][6];
lockBusy = true;
assert.throws(() => context.createStoreOrder({
  userId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ productoId: "PROD-1", cantidad: 1 }], metodoPago: "Transferencia"
}), /LOCK_BUSY/);
lockBusy = false;
assert.equal(rows.TiendaProductos[1][6], storeStockBeforeLock, "lock contention must not change stock");

rows.CafeteriaMenu = [
  ["PlatoID","Categoria","Nombre","Precio","Stock","","","","","Estado"],
  ["FOOD-1","","Almuerzo",25,4,"","","","","Disponible"]
];
rows.CafeteriaPedidos = [["PedidoID","Fecha","EstudianteUserId","ResponsableUserId","DetalleJSON","Turno","Monto","MetodoPago","Estado","Observaciones"]];
const cafeCreated = context.createCafeteriaOrder({
  estudianteUserId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ platoId: "FOOD-1", cantidad: 2 }], metodoPago: "Efectivo"
});
assert.equal(cafeCreated.status, "success");
assert.equal(rows.CafeteriaMenu[1][4], 2);
assert.equal(rows.CafeteriaPedidos.length, 2);
const cafeCreditCreated = context.createCafeteriaOrder({
  estudianteUserId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ platoId: "FOOD-1", cantidad: 1 }], metodoPago: "CreditoFamiliar"
});
assert.equal(cafeCreditCreated.status, "success");
assert.equal(rows.CafeteriaPedidos[2][8], "PendienteAprobacionFamiliar", "family credit cafeteria orders must await guardian PIN approval");
assert.throws(() => context.createCafeteriaOrder({
  estudianteUserId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  detalleItems: [{ platoId: "FOOD-1", cantidad: 3 }], metodoPago: "Efectivo"
}), /CAFETERIA_INSUFFICIENT_STOCK/);
assert.equal(rows.CafeteriaMenu[1][4], 1, "cafeteria stock must remain unchanged after rejection");

console.log("TASK-210 family credit approval preference contract: PASS");
