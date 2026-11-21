"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const handler = extractFunction(source, "getStudentGuardianConsolidatedList");

const expHeaders = ["ExpedienteID", "PersonaID", "CodigoInstitucional"];
const relationHeaders = ["RelacionID", "ExpedienteID", "ResponsableID", "TipoParentesco", "Estado", "FechaInicio", "FechaFin", "VerificadaPor", "PermisosJSON"];
const userHeaders = ["UserID", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta"];
const custodyHeaders = ["RestriccionID", "ExpedienteID", "TutorUserId", "TipoRestriccion", "OrdenJudicialRef", "ProhibirContacto", "Observaciones", "FechaRegistro", "RegistradoPor", "Estado"];

function fixture(overrides) {
  const data = {
    ExpedientesEstudiantes: [expHeaders, ["EXP-1", "PERSON-1", "COD-1"], ["EXP-2", "PERSON-2", "COD-2"]],
    RelacionesFamiliares: [
      relationHeaders,
      ["REL-1", "EXP-1", "TUTOR-1", "Madre", "Verificada", "2020-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true, permisoFinanciero: true })],
      ["REL-FUTURE", "EXP-1", "TUTOR-2", "Padre", "Activa", "2099-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })],
      ["REL-OLD", "EXP-1", "TUTOR-3", "Padre", "Activo", "2020-01-01", "2020-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })],
      ["REL-REVOKED", "EXP-1", "TUTOR-4", "Padre", "Revocada", "2020-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })]
    ],
    Usuarios: [
      userHeaders,
      ["TUTOR-1", "Tutor Uno", "", "", "", "", "Tutor", "", "", "PERSON-T1", "Activo"],
      ["TUTOR-2", "Tutor Futuro", "", "", "", "", "Tutor", "", "", "PERSON-T2", "Activo"],
      ["TUTOR-3", "Tutor Anterior", "", "", "", "", "Tutor", "", "", "PERSON-T3", "Activo"],
      ["TUTOR-4", "Tutor Revocado", "", "", "", "", "Tutor", "", "", "PERSON-T4", "Activo"],
      ["STU-1", "Estudiante Uno", "", "", "", "", "Estudiante", "", "", "PERSON-1", "Activo"]
    ],
    RestriccionesCustodiaLegal: [
      custodyHeaders,
      ["CUST-1", "EXP-1", "TUTOR-1", "RestriccionParcial", "ORD-123", "SÍ", "No contacto", new Date("2026-01-01"), "STAFF-1", "Activa"],
      ["CUST-OLD", "EXP-1", "TUTOR-1", "RestriccionAnterior", "ORD-OLD", "NO", "", new Date("2020-01-01"), "STAFF-1", "Inactiva"]
    ]
  };
  const denyOwnership = !!(overrides && overrides.__denyOwnership === true);
  const cleanOverrides = Object.assign({}, overrides || {});
  delete cleanOverrides.__denyOwnership;
  Object.assign(data, cleanOverrides);
  const sheets = {};
  Object.keys(data).forEach(name => {
    const rows = data[name];
    sheets[name] = {
      getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
      getLastRow: () => rows.length,
      getRange: () => { throw new Error("read endpoint attempted a write"); },
      appendRow: () => { throw new Error("read endpoint attempted a write"); }
    };
  });
  const calls = { ownership: [], adminScope: 0 };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) },
    assertRecordOwnership: (...args) => {
      calls.ownership.push(args.slice(1));
      return { authorized: !denyOwnership, code: denyOwnership ? "RESOURCE_SCOPE_DENIED" : "RESOURCE_SCOPE_ALLOWED" };
    },
    getInstitutionalDepartmentScope_: () => {
      calls.adminScope++;
      return { status: "success", institutionWide: true };
    }
  };
  vm.runInNewContext(handler + "\nthis.run = getStudentGuardianConsolidatedList;", context);
  return { run: context.run, calls, data };
}

const staff = fixture();
const staffResult = staff.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" });
assert.equal(staffResult.status, "success");
assert.equal(staffResult.totalTutores, 1, "future, expired and revoked links are excluded");
assert.equal(staffResult.tutores[0].nombreTutor, "Tutor Uno");
assert.equal(staffResult.tutores[0].parentesco, "Madre", "relationship type comes from the canonical relation schema");
assert.equal(staffResult.tutores[0].estadoVinculo, "Verificada");
assert.equal(staffResult.tutores[0].restriccionJudicial.prohibirContacto, true);
assert.deepEqual(staff.calls.ownership, [["EXPEDIENTE_ESTUDIANTE", "EXP-1", "READ"]]);
assert.equal(staff.calls.adminScope, 0);

const denied = fixture({ __denyOwnership: true });
assert.equal(denied.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "RESOURCE_SCOPE_DENIED");

const admin = fixture();
assert.equal(admin.run({ _verifiedUserId: "ADMIN-1", _verifiedRole: "Administrador", expedienteId: "EXP-1" }).status, "success");
assert.equal(admin.calls.adminScope, 1);
assert.equal(admin.calls.ownership.length, 0);

const student = fixture();
assert.equal(student.run({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", expedienteId: "EXP-1" }).status, "success");
assert.equal(student.calls.ownership.length, 0);
assert.equal(student.run({ _verifiedUserId: "STU-1", _verifiedRole: "Estudiante", expedienteId: "EXP-2" }).code, "RESOURCE_NOT_FOUND");

const missingIdentity = fixture();
assert.equal(missingIdentity.run({ _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "VERIFIED_IDENTITY_REQUIRED");

const duplicateExpediente = fixture({
  ExpedientesEstudiantes: [expHeaders, ["EXP-1", "PERSON-1", "COD-1"], ["EXP-1", "PERSON-1", "COD-1"]]
});
assert.equal(duplicateExpediente.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "RESOURCE_NOT_FOUND");

const duplicateRelation = fixture({
  RelacionesFamiliares: [relationHeaders,
    ["REL-1", "EXP-1", "TUTOR-1", "Madre", "Verificada", "2020-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })],
    ["REL-1", "EXP-1", "TUTOR-2", "Padre", "Activa", "2020-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })]]
});
assert.equal(duplicateRelation.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "FAMILY_RELATION_AMBIGUOUS_OR_INVALID");

const duplicatePair = fixture({
  RelacionesFamiliares: [relationHeaders,
    ["REL-1", "EXP-1", "TUTOR-1", "Madre", "Verificada", "2020-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })],
    ["REL-2", "EXP-1", "TUTOR-1", "Madre", "Activa", "2020-01-01", "2099-12-31", "STAFF-1", JSON.stringify({ permisoAcademico: true })]]
});
assert.equal(duplicatePair.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "FAMILY_RELATION_AMBIGUOUS_OR_INVALID");

const malformedPermissions = fixture({
  RelacionesFamiliares: [relationHeaders, ["REL-1", "EXP-1", "TUTOR-1", "Madre", "Verificada", "2020-01-01", "2099-12-31", "STAFF-1", "{bad"]]
});
assert.equal(malformedPermissions.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "FAMILY_RELATION_PERMISSION_SCHEMA_INVALID");

const duplicateCustody = fixture({
  RestriccionesCustodiaLegal: [custodyHeaders,
    ["CUST-1", "EXP-1", "TUTOR-1", "RestriccionParcial", "ORD-123", "SÍ", "No contacto", new Date("2026-01-01"), "STAFF-1", "Activa"],
    ["CUST-1", "EXP-1", "TUTOR-1", "RestriccionTotal", "ORD-124", "SÍ", "Duplicada", new Date("2026-01-02"), "STAFF-1", "Activa"]]
});
assert.equal(duplicateCustody.run({ _verifiedUserId: "STAFF-1", _verifiedRole: "Secretaría", expedienteId: "EXP-1" }).code, "CUSTODY_RESTRICTION_AMBIGUOUS");

console.log("user-student-guardian-consolidated-list-abac: all assertions passed");
