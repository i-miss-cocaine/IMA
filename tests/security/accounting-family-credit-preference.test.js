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
  CreditoFamiliarConfiguracion: ["ConfiguracionID","ResponsableUserID","ModalidadAprobacion","FechaActualizacion","ActualizadoPor"],
  CreditoFamiliarAutorizaciones: ["AutorizacionID","Fecha","ResponsableUserId","EstudianteUserId","LimiteDiario","LimiteMensual","SaldoUsado","Estado","FechaVencimiento","Observaciones"]
};
function makeSheet(name) {
  if (!rows[name]) rows[name] = headers[name] ? [headers[name].slice()] : [];
  return {
    getDataRange() { return { getValues() { return rows[name].map(r => r.slice()); } }; },
    getLastRow() { return rows[name].length; },
    appendRow(row) { rows[name].push(row.slice()); },
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
let lockBusy = false, uuid = 0, lockReleased = false;
const context = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById() { return ss; } },
  LockService: { getScriptLock() { return { waitLock() { if (lockBusy) throw new Error("LOCK_BUSY"); }, releaseLock() { lockReleased = true; } }; } },
  Utilities: { getUuid() { return "UUID-" + (++uuid); } },
  getOrCreateSheet(db, name) { return makeSheet(name); },
  transportParseDate_(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  },
  Date, String, Object, Array, JSON, Error, console
};
vm.createContext(context);
const names = ["familyCreditApprovalActor_", "familyCreditGuardianHasActiveStudentRelation_", "familyCreditGuardianCanAuthorizeStudent_", "familyCreditIsRequested_", "getFamilyCreditApprovalPreference", "configureFamilyCreditApprovalPreference", "configureFamilyCreditAuthorization", "getFamilyCreditAuthorizations", "processFamilyCreditPurchase", "createStoreOrder", "createCafeteriaOrder"];
vm.runInContext(names.map(extractFunction).join("\n"), context);

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

rows.CreditoFamiliarAutorizaciones = [
  headers.CreditoFamiliarAutorizaciones,
  ["AUT-1", new Date(), "GUARD-1", "STU-1", 50, 500, 10, "Activa", "", ""],
  ["AUT-2", new Date(), "OTHER-G", "STU-2", 60, 600, 20, "Activa", "", ""]
];
const guardianAuthorizations = context.getFamilyCreditAuthorizations({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(guardianAuthorizations.autorizaciones.length, 1);
assert.equal(guardianAuthorizations.autorizaciones[0].estudianteUserId, "STU-1");
const studentAuthorizations = context.getFamilyCreditAuthorizations({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" });
assert.equal(studentAuthorizations.autorizaciones.length, 1);
assert.equal(studentAuthorizations.autorizaciones[0].estudianteUserId, "STU-1");
assert.throws(() => context.getFamilyCreditAuthorizations({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", estudianteUserId: "STU-2" }), /FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED/);
assert.throws(() => context.getFamilyCreditAuthorizations({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre", estudianteUserId: "STU-2" }), /FAMILY_CREDIT_ACTIVE_STUDENT_RELATION_REQUIRED/);


const loaded = context.getFamilyCreditApprovalPreference({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(loaded.configured, false);
assert.equal(loaded.modalidadAprobacion, null);

const saved = context.configureFamilyCreditApprovalPreference({
  _verifiedUserId: "GUARD-1", _verifiedRole: "Padre",
  responsableUserId: "OTHER-G", modalidadAprobacion: "POR_CUPO"
});
assert.equal(saved.status, "success");
assert.equal(saved.modalidadAprobacion, "POR_CUPO");
assert.equal(rows.CreditoFamiliarConfiguracion[1][1], "GUARD-1", "actor must come from verified session, never caller payload");
assert.equal(rows.CreditoFamiliarConfiguracion[1][4], "GUARD-1");

const reloaded = context.getFamilyCreditApprovalPreference({ _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(reloaded.configured, true);
assert.equal(reloaded.modalidadAprobacion, "POR_CUPO");
assert.equal(lockReleased, true);
assert.equal(context.familyCreditGuardianCanAuthorizeStudent_(ss, "GUARD-1", "STU-1"), true);
assert.equal(context.familyCreditGuardianCanAuthorizeStudent_(ss, "GUARD-1", "STU-2"), false);
assert.equal(context.familyCreditIsRequested_("Crédito Familiar"), true, "accented payment method must still be recognized as family credit");
assert.equal(context.familyCreditIsRequested_("Credito Familiar"), true);
assert.throws(() => context.configureFamilyCreditAuthorization({ responsableUserId: "OTHER-G", estudianteUserId: "STU-1", _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" }), /FAMILY_CREDIT_GUARDIAN_ROLE_REQUIRED/);
assert.throws(() => context.configureFamilyCreditAuthorization({ responsableUserId: "GUARD-1", estudianteUserId: "STU-1", limiteDiario: 100, limiteMensual: 50, _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" }), /FAMILY_CREDIT_LIMITS_INVALID/);
const configuredCredit = context.configureFamilyCreditAuthorization({ responsableUserId: "GUARD-1", estudianteUserId: "STU-1", limiteDiario: 50, limiteMensual: 500, _verifiedUserId: "GUARD-1", _verifiedRole: "Padre" });
assert.equal(configuredCredit.status, "success");
assert.equal(rows.CreditoFamiliarAutorizaciones[1][2], "GUARD-1");

assert.throws(() => context.processFamilyCreditPurchase({ estudianteUserId: "STU-1", monto: 10 }), /FAMILY_CREDIT_PIN_APPROVAL_REQUIRED/);
assert.throws(() => context.createStoreOrder({ userId: "STU-1", metodoPago: "CreditoFamiliar", detalleItems: [] }), /FAMILY_CREDIT_PIN_APPROVAL_REQUIRED/);
assert.throws(() => context.createCafeteriaOrder({ estudianteUserId: "STU-1", detalleItems: [] }), /FAMILY_CREDIT_PIN_APPROVAL_REQUIRED/);

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
assert.match(uiSource, /fetchApi\('ACCOUNTING', 'configureFamilyCreditApprovalPreference'/);
assert.match(source, /case "getFamilyCreditApprovalPreference"/);
assert.match(source, /case "configureFamilyCreditApprovalPreference"/);
assert.match(source, /FAMILY_CREDIT_PIN_APPROVAL_REQUIRED/);
assert.match(source, /FAMILY_CREDIT_GUARDIAN_OWNERSHIP_REQUIRED/);
assert.match(source, /FAMILY_CREDIT_STUDENT_OWNERSHIP_REQUIRED/);
console.log("TASK-210 family credit approval preference contract: PASS");
