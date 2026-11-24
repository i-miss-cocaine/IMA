"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../..");
const legacyHeaders = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"];
const membershipHeaders = legacyHeaders.concat(["InstitutionID","MembershipID"]);
const currentHeaders = membershipHeaders.concat(["ResponsibilityID"]);
const specs = [
  { name: "TASK", file: "backend/task-service/Code.gs", functionName: "getVerifiedDepartmentScopeForSession_", invoke: (fn,payload,ss,actor) => fn(payload,ss,actor) },
  { name: "ACADEMIC", file: "backend/academic-service/Code.gs", functionName: "getVerifiedDepartmentScopeForSession_", invoke: (fn,payload,ss,actor) => fn(payload,ss,actor,actor,"") },
  { name: "EXAM", file: "backend/exam-service/Code.gs", functionName: "getVerifiedDepartmentScopeForSession_", invoke: (fn,payload,ss,actor) => fn(payload,ss,actor) },
  { name: "ACCOUNTING", file: "backend/accounting-service/Code.gs", functionName: "getVerifiedAccountingDepartmentScope_", invoke: (fn,payload,ss) => fn(payload,ss) }
];

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Falta " + name);
  const next = /\nfunction [A-Za-z0-9_$]+\s*\(/g;
  next.lastIndex = start + 10;
  const match = next.exec(source);
  return source.slice(start, match ? match.index : source.length);
}
function makeSheet(rows) {
  const copy = rows.map(row => row.slice());
  return { rows: copy, reads: 0, getDataRange() { this.reads++; return { getValues: () => copy.map(row => row.slice()) }; } };
}
function dateString(date) {
  return date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0");
}
function fixture(spec, options = {}) {
  const source = fs.readFileSync(path.join(root, spec.file), "utf8");
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "INST-1" }) },
    getVerifiedRequestSessionClaims_: payload => payload && payload._claims || null,
    getRequestSessionToken_: () => "test-session",
    getVerifiedDepartmentScopeForSession_: () => ({
      valid: true, userId: "EMP-1", role: "Docente", roleId: "Docente",
      membershipId: "MEM-1", institutionId: "INST-1"
    }),
    resolveInternalResponsibilityForRoleScope_: (ss, id) => id === "ROL-1"
      ? { responsibilityId: "ROL-1", state: "Activo" } : null
  };
  vm.runInNewContext(extractFunction(source, spec.functionName), context);
  const now = new Date();
  const start = options.start === undefined ? dateString(new Date(now.getFullYear(),now.getMonth(),now.getDate()-1)) : options.start;
  const end = options.end === undefined ? dateString(now) : options.end;
  const membershipId = options.membershipId === undefined ? "MEM-1" : options.membershipId;
  const responsibilityId = options.responsibilityId === undefined ? "ROL-1" : options.responsibilityId;
  const row = ["AMB-1","EMP-1","Docente","DEPARTAMENTO",'["DEP-1"]',"Activo","HR-1","2026-01-01",start,end,"No","",
    "INST-1",membershipId,responsibilityId];
  const headers = options.headers || currentHeaders;
  const rowForSchema = options.row || (headers.length === 12 ? row.slice(0,12) : (headers.length === 14 ? row.slice(0,14) : row));
  const assignments = makeSheet([headers,rowForSchema]);
  const users = makeSheet([["UserID","Nombre","","","","","Rol","","","","Estado"],["EMP-1","Empleado","","","","","Docente","","","","Activa"]]);
  const ss = { getSheetByName: name => name === "AsignacionesAmbitosRoles" ? assignments : (name === "Usuarios" ? users : null) };
  const actor = { authorized: true, valid: true, userId: "EMP-1", role: "Docente", roleId: "Docente", membershipId: membershipId, institutionId: "INST-1" };
  const claims = { userId: "EMP-1", role: "Docente", membershipId: membershipId, institutionId: membershipId ? "INST-1" : "" };
  const payload = { _claims: claims, sessionToken: "test-session" };
  const fn = context[spec.functionName];
  const result = spec.invoke(fn,payload,ss,actor);
  return { result, assignments, context, users, ss, actor, payload, fn };
}
function allowed(result) { return result && (result.authorized === true || (result.valid === true && result.authorized === true)); }

test("los consumidores de ámbito exigen esquema actual y FK activa antes de autorizar", () => {
  for (const spec of specs) {
    const valid = fixture(spec);
    assert.equal(allowed(valid.result), true, spec.name + " debe aceptar la asignación vigente vinculada");
    const legacy = fixture(spec, { headers: legacyHeaders });
    assert.equal(allowed(legacy.result), false, spec.name + " no debe usar el esquema legacy sin FK");
    const membershipOnly = fixture(spec, { headers: membershipHeaders });
    assert.equal(allowed(membershipOnly.result), false, spec.name + " no debe usar el esquema intermedio sin FK");
    const emptyFk = fixture(spec, { responsibilityId: "" });
    assert.equal(allowed(emptyFk.result), false, spec.name + " debe rechazar FK vacía");
    const missingFk = fixture(spec, { responsibilityId: "ROL-NO-EXISTE" });
    assert.equal(allowed(missingFk.result), false, spec.name + " debe rechazar FK inexistente/inactiva");
  }
});

test("TASK/ACADEMIC/EXAM conservan compatibilidad legacy solo con usuario activo y FK actual", () => {
  for (const spec of specs.filter(item => item.name !== "ACCOUNTING")) {
    const valid = fixture(spec, { membershipId: "" });
    assert.equal(allowed(valid.result), true, spec.name + " debe aceptar usuario legacy activo con FK actual");
    const inactiveUser = fixture(spec, { membershipId: "" });
    const usersSheet = { getDataRange: () => ({ getValues: () => [["UserID","Nombre","","","","","Rol","","","","Estado"],["EMP-1","Empleado","","","","","Docente","","","","Inactivo"]] }) };
    const context = inactiveUser.context;
    const fn = context[spec.functionName];
    const claims = {userId:"EMP-1",role:"Docente",membershipId:"",institutionId:""};
    const ss = {getSheetByName:name=>name==="AsignacionesAmbitosRoles"?inactiveUser.assignments: name==="Usuarios"?usersSheet:null};
    const actor={authorized:true,userId:"EMP-1",role:"Docente",roleId:"Docente"};
    const result=spec.invoke(fn,{_claims:claims,sessionToken:"test-session"},ss,actor);
    assert.equal(allowed(result),false,spec.name+" debe rechazar usuario legacy inactivo");
  }
});

test("TASK/ACADEMIC/EXAM leen Usuarios una sola vez aunque existan varias asignaciones", () => {
  for (const spec of specs.filter(item => item.name !== "ACCOUNTING")) {
    const base = fixture(spec, { membershipId: "" });
    const first = base.assignments.rows[1].slice();
    const second = first.slice();
    second[0] = "AMB-2";
    second[4] = '["DEP-2"]';
    const assignments = makeSheet([currentHeaders, first, second]);
    const users = makeSheet([["UserID","Nombre","","","","","Rol","","","","Estado"],["EMP-1","Empleado","","","","","Docente","","","","Activa"]]);
    const ss = { getSheetByName: name => name === "AsignacionesAmbitosRoles" ? assignments : (name === "Usuarios" ? users : null) };
    const payload = { _claims: { userId: "EMP-1", role: "Docente", membershipId: "", institutionId: "" }, sessionToken: "test-session" };
    const actor = { authorized: true, userId: "EMP-1", role: "Docente", roleId: "Docente" };
    const result = spec.invoke(base.fn,payload,ss,actor);
    assert.equal(allowed(result), true, spec.name + " debe autorizar ambas asignaciones válidas");
    assert.equal(result.scopes.length, 2);
    assert.equal(users.reads, 1, spec.name + " debe leer Usuarios una sola vez por consulta");
  }
});

test("las fechas de fin son inclusivas en todos los consumidores y las fechas ISO imposibles se rechazan", () => {
  const now = new Date();
  const today = dateString(now);
  for (const spec of specs) {
    const inclusive = fixture(spec, { end: today });
    assert.equal(allowed(inclusive.result), true, spec.name + " debe incluir el día final completo");
    const impossible = fixture(spec, { start: "2026-02-30", end: "2026-12-31" });
    assert.equal(allowed(impossible.result), false, spec.name + " debe rechazar una fecha calendárica imposible");
  }
});
