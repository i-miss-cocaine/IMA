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
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
const code = extractFunction(source, "assertStudentExpedienteScopeAccess_");
const primaryHeaders = ["RelacionID","PersonaEstudianteID","PersonaResponsableID","TipoParentesco","EstadoAutorizacion","FechaInicio","FechaFin","Observaciones"];
const validPrimary = ["REL-1","EXP-1","GUARD-1","Padre","Verificada","2026-01-01","2099-12-31","",JSON.stringify({ permisoAcademico: true })];
const legacyRelations = [
  ["RelacionID","ExpedienteID","TutorID","TipoParentesco","Parentesco","FechaInicio","FechaFin","Observaciones","Portal","Estado"],
  ["LEG-1","EXP-1","REL-G","Padre","Padre","","","","SI","Verificada"]
];
const legacyGuardians = [["ResponsableID","PersonaID"],["REL-G","PERSON-G"]];
function sheet(rows) {
  return { getLastRow: () => rows.length, getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
}
function runtime(primaryRows, options = {}) {
  const map = {
    RelacionesFamiliares: options.missingPrimary ? null : sheet(primaryRows || [primaryHeaders]),
    RelacionesEstudianteTutor: options.missingLegacy ? null : sheet(options.legacyRows || legacyRelations),
    ResponsablesTutores: options.missingLegacy ? null : sheet(legacyGuardians),
    ExpedientesEstudiantes: sheet([["ExpedienteID","PersonaID"],["EXP-1","PERSON-S"],["EXP-2","PERSON-OTHER"]])
  };
  const ss = { getSheetByName(name) { return map[name] || null; } };
  const context = {
    Date, String, Array, Object, Number, JSON, SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ss },
    getVerifiedAcademicIdentity_: () => ({ authorized: true, userId: "GUARD-1", role: "Padre" }),
    getStudentPersonIdForUser_: (_ss, userId) => userId === "GUARD-1" ? "PERSON-G" : (userId === "STU-1" ? "PERSON-S" : ""),
    getStudentIdentityForPerson_: (_ss, personId) => personId === "PERSON-S" ? ({ userId: "STU-1", role: "Estudiante" }) : null,
    getVerifiedAcademicGuardianDepartmentScope_: () => ({ authorized: true, departmentId: "DEP-1" }),
    getVerifiedAcademicDepartmentScope_: () => ({ authorized: true, departmentId: "DEP-1" }),
    assertResourceOwnershipForScope_: () => ({ authorized: true, accessType: "OWNER", departmentId: "DEP-1" }),
    ss
  };
  vm.createContext(context);
  vm.runInContext(code + "\nthis.check = assertStudentExpedienteScopeAccess_;", context);
  const contextualCode = extractFunction(source, "getAcademicGuardianPermissionKeyForAction_") + "\n" +
    extractFunction(source, "validateContextualAccess") + "\nthis.contextual = validateContextualAccess;";
  vm.runInContext(contextualCode, context);
  return context;
}
function check(ctx, permissionKey) {
  return ctx.check({ sessionToken: "verified-token" }, ctx.ss, {}, ["EXP-1","PERSON-S"], permissionKey);
}

let ctx = runtime([primaryHeaders, validPrimary]);
assert.equal(check(ctx).authorized, true,
  "active primary guardian relationship with academic permission must authorize");
assert.equal(check(ctx, "permisoDocumental").authorized, false,
  "academic permission alone must not grant access to student documents");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8)]);
assert.equal(check(ctx).authorized, false,
  "primary guardian relationships without an explicit academic permission fail closed");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat(["{}"])]);
assert.equal(check(ctx).authorized, false,
  "an empty permission document does not imply academic access");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: "true" })])]);
assert.equal(check(ctx).authorized, false,
  "non-boolean permission values do not grant academic access");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: false })])]);
assert.equal(check(ctx).authorized, false,
  "explicit academic permission denial must override an active relationship");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat(["{malformed"])]);
assert.equal(check(ctx).authorized, false,
  "malformed primary permission JSON must fail closed");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: true, permisoDocumental: true })])]);
assert.equal(check(ctx, "permisoDocumental").authorized, true,
  "document access requires its own explicit boolean permission");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: true, permisoDocumental: false })])]);
assert.equal(check(ctx, "permisoDocumental").authorized, false,
  "explicit document permission denial overrides academic permission");
ctx = runtime([primaryHeaders, validPrimary.slice(0,5).concat(["2020-01-01","2020-12-31","",JSON.stringify({ permisoAcademico: true })])]);
assert.equal(check(ctx).authorized, false,
  "expired primary relationship must deny");
ctx = runtime([primaryHeaders, validPrimary.slice(0,5).concat(["2099-01-01","2099-12-31","",JSON.stringify({ permisoAcademico: true })])]);
assert.equal(check(ctx).authorized, false,
  "future primary relationship must deny");
ctx = runtime([primaryHeaders, validPrimary, validPrimary]);
assert.equal(check(ctx).authorized, false,
  "duplicate active primary relationships must deny");
ctx = runtime([primaryHeaders, validPrimary,
  ["REL-1","EXP-OTHER","GUARD-1","Padre","Verificada","","","",JSON.stringify({ permisoAcademico: true })]]);
assert.equal(check(ctx).authorized, false,
  "duplicate primary relationship IDs across students must deny");
ctx = runtime([primaryHeaders, ["REL-1","EXP-OTHER","GUARD-1","Padre","Verificada","","","",JSON.stringify({ permisoAcademico: true })]]);
assert.equal(check(ctx).authorized, false,
  "a primary relationship to another student prevents legacy fallback");
ctx = runtime([primaryHeaders]);
assert.equal(check(ctx).authorized, false,
  "legacy relationship without an explicit domain grant cannot authorize academic access");
assert.equal(check(ctx, "permisoDocumental").authorized, false,
  "legacy portal links cannot imply document-domain permission");
assert.equal(contextual(ctx, "getStudentEnrollmentHistory", { userId: "STU-1" }).authorized, false,
  "ACADEMIC contextual guard does not grant legacy-only guardian access");
ctx = runtime([primaryHeaders], { legacyRows: [
  legacyRelations[0], legacyRelations[1],
  ["LEG-1","EXP-OTHER","REL-G","Padre","","","","","SI","Verificada"]
] });
assert.equal(check(ctx).authorized, false,
  "duplicate legacy relationship IDs must deny");
ctx = runtime(null, { missingPrimary: true });
assert.equal(check(ctx).authorized, false,
  "missing primary relationship source fails closed rather than falling back to legacy data");
ctx = runtime([primaryHeaders, ["REL-1","EXP-1","GUARD-1","Padre","Revocada","","","",JSON.stringify({ permisoAcademico: true })]]);
assert.equal(check(ctx).authorized, false,
  "revoked primary relationship must not be bypassed by an active legacy row");


const enrollmentHistoryFn = extractFunction(source, "getStudentEnrollmentHistory");
assert(enrollmentHistoryFn.includes('assertStudentExpedienteScopeAccess_(\n      request, ss, expedienteSheet, expediente, "permisoFinanciero"\n    )'),
  "guardian enrollment history must separately authorize financial charges with the primary financial-domain grant");
assert(!enrollmentHistoryFn.includes("RelacionesEstudianteTutor"),
  "legacy portal/financial flags cannot bypass the primary financial-domain grant for charges");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: true, permisoFinanciero: true })])]);
assert.equal(check(ctx, "permisoFinanciero").authorized, true,
  "explicit primary financial permission authorizes financial-domain reads");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: true, permisoFinanciero: false })])]);
assert.equal(check(ctx, "permisoFinanciero").authorized, false,
  "academic permission cannot substitute for an explicit financial grant");

const documentScopeFn = extractFunction(source, "assertStudentDocumentScopeAccess_");
assert(documentScopeFn.includes('assertStudentExpedienteScopeAccess_(payload, ss, expSheet, exp, "permisoDocumental")'),
  "all student-document reads and writes require the explicit document-domain permission");
const identityFn = extractFunction(source, "getStudentPersonIdForUser_");
const identityRuntime = { ss: { getSheetByName: () => sheet([
  ["UserId","PersonaID"],["GUARD-1","PERSON-G"]
]) }, String };
vm.createContext(identityRuntime);
vm.runInContext(identityFn + "\nthis.resolve = getStudentPersonIdForUser_;", identityRuntime);
assert.equal(identityRuntime.resolve(identityRuntime.ss, "GUARD-1"), "PERSON-G",
  "unique verified user-to-person mapping resolves");
const duplicateIdentityRuntime = { ss: { getSheetByName: () => sheet([
  ["UserId","PersonaID"],["GUARD-1","PERSON-G"],["GUARD-1","PERSON-OTHER"]
]) }, String };
vm.createContext(duplicateIdentityRuntime);
vm.runInContext(identityFn + "\nthis.resolve = getStudentPersonIdForUser_;", duplicateIdentityRuntime);
assert.equal(duplicateIdentityRuntime.resolve(duplicateIdentityRuntime.ss, "GUARD-1"), "",
  "duplicate user-to-person mappings fail closed");

function contextual(ctx, action, payload) {
  return ctx.contextual(action, payload || {}, "GUARD-1", "Padre");
}
ctx = runtime([primaryHeaders, validPrimary]);
assert.equal(contextual(ctx, "getStudentAttendanceSummary", { userId: "STU-1" }).authorized, false,
  "academic grant alone cannot authorize attendance summaries");
assert.equal(contextual(ctx, "getStudentEnrollmentHistory", { userId: "STU-1" }).authorized, true,
  "academic domain permission authorizes enrollment history");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: true, permisoAsistencia: true })])]);
assert.equal(contextual(ctx, "getStudentAttendanceSummary", { userId: "STU-1" }).authorized, true,
  "attendance endpoints require and accept an explicit attendance-domain grant");
ctx = runtime([primaryHeaders, validPrimary.slice(0,8).concat([JSON.stringify({ permisoAcademico: true, permisoDocumental: true })])]);
assert.equal(contextual(ctx, "getStudentDocumentFile", { expedienteId: "EXP-1" }).authorized, true,
  "document endpoint requires an explicit document-domain grant");
assert.equal(contextual(ctx, "getStudentDocumentFile", { studentId: "STU-1", expedienteId: "EXP-2" }).authorized, false,
  "document endpoint rejects mismatched student and expediente selectors");
assert.equal(contextual(ctx, "unclassifiedGuardianAction", { userId: "STU-1" }).authorized, false,
  "unclassified guardian resource actions fail closed");
const studentFileFunction = extractFunction(source, "getStudentFile");
assert(studentFileFunction.includes('assertStudentExpedienteScopeAccess_(payload, ss, expSheet, exp, "permisoDocumental")'),
  "the complete student-file endpoint requires document-domain permission");

process.stdout.write("academic-guardian-primary-relation-abac-contract: all assertions passed\n");
