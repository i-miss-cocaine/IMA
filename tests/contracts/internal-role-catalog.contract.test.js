"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const backend = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
const dashboard = fs.readFileSync(path.join(__dirname, "../../dashboard-recursos-humanos.html"), "utf8");

function extractFunction(name) {
  const start = backend.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Falta " + name);
  const next = /\nfunction [A-Za-z0-9_$]+\s*\(/g;
  next.lastIndex = start + 10;
  const match = next.exec(backend);
  return backend.slice(start, match ? match.index : backend.length);
}
function sheet(initial) {
  const rows = initial.map(row => row.slice());
  return {
    rows,
    getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
    getLastRow() { return rows.length; },
    appendRow(row) { rows.push(row.slice()); },
    deleteRow(index) { rows.splice(index - 1, 1); },
    getRange(row, col, rowCount, colCount) {
      return {
        setValue(value) { if (!rows[row - 1]) rows[row - 1] = []; rows[row - 1][col - 1] = value; },
        setValues(values) {
          for (let r = 0; r < values.length; r++) {
            const target = row - 1 + r;
            if (!rows[target]) rows[target] = [];
            for (let c = 0; c < values[r].length; c++) rows[target][col - 1 + c] = values[r][c];
          }
        }
      };
    }
  };
}
const roleHeaders = ["RolInternoID","CodigoInterno","NombreResponsabilidad","Descripcion","Departamento","AreaAcademica","TipoResponsabilidad","VigenciaMeses","PermiteSuplencia","Estado","CreadoPor","FechaCreacion","FechaActualizacion","ResponsibilityID"];
const assignmentHeaders = ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID","InstitutionID","MembershipID","ResponsibilityID"];
const membershipHeaders = ["MembershipID","UserID","RoleID","InstitutionID","Estado"];

function makeContext(options = {}) {
  const sheets = options.sheets || {};
  let uuid = 0;
  const lock = { waitLock() {}, releaseLock() {} };
  const context = {
    SPREADSHEET_ID: "TEST",
    ROLE_PERMISSIONS: { Docente: [], Director: [], RecursosHumanos: [] },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) },
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => String(++uuid).padStart(16, "0") + "-0000-0000-0000" },
    normalizeString: value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
    getOrCreateSheet: (ss, name) => sheets[name],
    getIdentityInstitutionId_: () => "INST-1",
    getUserVerifiedRole: payload => payload && payload._verifiedRole || "NO_ACCESS",
    isConfiguredRbacRole_: () => true,
    getUserRoleMembershipState_: userId => {
      const suffix = String(userId).slice(-1);
      return { hasRecords: true, memberships: [{ membershipId: "MEM-" + suffix, userId, roleId: "Docente", institutionId: "INST-1", status: "ACTIVE" }] };
    },
    resolveUserRoleMembership_: userId => ({ membershipId: "MEM-" + String(userId).slice(-1), userId, roleId: "Docente", institutionId: "INST-1" }),
    getInstitutionalResponsibilityRecord_: () => null,
    recordEntityChangeLog: (...args) => { context.audit.push(args); },
    logStructuredEvent: (...args) => { context.events.push(args); },
    audit: [],
    events: []
  };
  for (const name of ["normalizeString","resolveActiveInternalResponsibility_","parseInternalRoleAssignmentDate_","formatInternalRoleAssignmentDate_","manageInternalRoleCatalog","getInternalRoleCatalog","assignRoleScope","getInternalRoleAssignments","getConfiguredRbacRoleIds_","getUserContextScope","getUserScopeConfig"]) {
    const source = extractFunction(name);
    vm.runInNewContext(source, context);
  }
  return context;
}
function roleRow(id, name, code, state = "Activo", allowSubstitute = "Sí") {
  return [id,code,name,"Descripción","DEP-1","MAT","Académica",12,allowSubstitute,state,"HR-1","2026-01-01","2026-01-01",""];
}
function userRow(id, role = "Docente") {
  return [id,"Empleado","","","","",role,"","","","Activa"];
}
function assignmentContext() {
  const roles = sheet([roleHeaders, roleRow("ROL-1","Coordinador de Matemáticas","COORD-MAT"), roleRow("ROL-2","Encargado de Laboratorio","LAB-01")]);
  const users = sheet([["UserID"], userRow("EMP-1"), userRow("EMP-2"), userRow("EMP-3")]);
  const assignments = sheet([assignmentHeaders]);
  const memberships = sheet([membershipHeaders,
    ["MEM-1","EMP-1","Docente","INST-1","ACTIVE"],
    ["MEM-2","EMP-2","Docente","INST-1","ACTIVE"],
    ["MEM-3","EMP-3","Docente","INST-1","ACTIVE"]
  ]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles, Usuarios: users, AsignacionesAmbitosRoles: assignments, MembresiasRolesRBAC: memberships } });
  return { context, roles, users, assignments, memberships };
}
function assign(context, userId, responsibilityId, extra = {}) {
  return context.assignRoleScope(Object.assign({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    userId, roleId: "Docente", responsibilityId,
    scopeType: "DEPARTAMENTO", scopeValues: ["DEP-1"],
    fechaInicio: "2026-01-01", fechaFin: "2026-12-31",
    estado: "Activo", motivo: "Asignación institucional autorizada."
  }, extra));
}

test("el catálogo rechaza nombres duplicados por mayúsculas, acentos y espacios normalizados", () => {
  const roles = sheet([roleHeaders]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  const created = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    nombreResponsabilidad: "Coordinador  de Matemáticas", tipoResponsabilidad: "Académica", vigenciaMeses: 12, motivo: "Creación autorizada del puesto."
  });
  assert.equal(created.status, "success");
  const duplicate = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    nombreResponsabilidad: "coordinador de matematicas", tipoResponsabilidad: "Académica", vigenciaMeses: 12, motivo: "Intento de duplicación de puesto."
  });
  assert.equal(duplicate.code, "INTERNAL_ROLE_NAME_DUPLICATE");
  assert.equal(roles.rows.length, 2);
  assert.equal(context.audit.length, 1);
});

test("desactivar y reactivar una responsabilidad conserva la fila y registra cada cambio", () => {
  const roles = sheet([roleHeaders, roleRow("ROL-1","Coordinador","COORD-1")]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  const disabled = context.manageInternalRoleCatalog({ _verifiedUserId: "HR-1", _verifiedRole: "Director", accion: "desactivar", rolInternoId: "ROL-1", motivo: "Cierre autorizado de la responsabilidad." });
  assert.equal(disabled.status, "success");
  assert.equal(roles.rows.length, 2);
  assert.equal(roles.rows[1][9], "Inactivo");
  const enabled = context.manageInternalRoleCatalog({ _verifiedUserId: "HR-1", _verifiedRole: "Director", accion: "activar", rolInternoId: "ROL-1", motivo: "Reactivación autorizada de la responsabilidad." });
  assert.equal(enabled.status, "success");
  assert.equal(roles.rows.length, 2);
  assert.equal(roles.rows[1][9], "Activo");
  assert.equal(context.audit.length, 2);
});

test("un empleado puede tener varias responsabilidades y una responsabilidad varios empleados", () => {
  const { context, assignments } = assignmentContext();
  const first = assign(context, "EMP-1", "ROL-1");
  const second = assign(context, "EMP-1", "ROL-2");
  const third = assign(context, "EMP-2", "ROL-1");
  assert.equal(first.status, "success");
  assert.equal(second.status, "success");
  assert.equal(third.status, "success");
  assert.equal(assignments.rows.length, 4);
  assert.notEqual(first.assignmentId, second.assignmentId);
  assert.notEqual(first.assignmentId, third.assignmentId);
});

test("repetir la misma asignación actualiza el registro existente sin duplicarlo", () => {
  const { context, assignments } = assignmentContext();
  const first = assign(context, "EMP-1", "ROL-1");
  const repeated = assign(context, "EMP-1", "ROL-1", { scopeValues: ["DEP-1","DEP-2"] });
  assert.equal(first.assignmentId, repeated.assignmentId);
  assert.equal(assignments.rows.length, 2);
  assert.equal(JSON.parse(assignments.rows[1][4]).length, 2);
});

test("las fechas inválidas y suplencias sin destino o sin vigencia final se rechazan", () => {
  const { context, assignments } = assignmentContext();
  assert.equal(assign(context, "EMP-1", "ROL-1", { fechaInicio: "fecha-invalida" }).code, "ROLE_SCOPE_DATES_INVALID");
  assert.equal(assign(context, "EMP-2", "ROL-1", { esSuplente: true, suplenteDeUserId: "", fechaFin: "" }).code, "ROLE_SCOPE_SUBSTITUTE_DATES_REQUIRED");
  assert.equal(assignments.rows.length, 1);
});

test("una suplencia requiere titular vigente y no admite ventanas simultáneas", () => {
  const { context, assignments } = assignmentContext();
  const titular = assign(context, "EMP-1", "ROL-1");
  assert.equal(titular.status, "success");
  const substitute = assign(context, "EMP-2", "ROL-1", {
    esSuplente: true, suplenteDeUserId: "EMP-1", fechaInicio: "2026-05-01", fechaFin: "2026-06-01"
  });
  assert.equal(substitute.status, "success");
  const overlap = assign(context, "EMP-3", "ROL-1", {
    esSuplente: true, suplenteDeUserId: "EMP-1", fechaInicio: "2026-05-15", fechaFin: "2026-06-15"
  });
  assert.equal(overlap.code, "ROLE_SCOPE_SUBSTITUTE_OVERLAP");
  assert.equal(assignments.rows.length, 3);
});

test("la consulta histórica conserva asignaciones aunque la membresía RBAC se haya revocado", () => {
  const roles = sheet([roleHeaders, roleRow("ROL-1","Coordinador","COORD-1","Inactivo")]);
  const users = sheet([["UserID"], userRow("EMP-1")]);
  const assignments = sheet([assignmentHeaders, ["AMB-1","EMP-1","Docente","DEPARTAMENTO",'["DEP-1"]',"Activo","HR-1","2026-01-01","2026-01-01","2026-12-31","No","","INST-1","MEM-1","ROL-1"]]);
  const memberships = sheet([membershipHeaders, ["MEM-1","EMP-1","Docente","INST-1","REVOKED"]]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles, Usuarios: users, AsignacionesAmbitosRoles: assignments, MembresiasRolesRBAC: memberships } });
  const result = context.getInternalRoleAssignments({ soloVigentes: false });
  assert.equal(result.status, "success");
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].membershipStatus, "REVOKED");
  assert.equal(result.data[0].responsibility.estado, "Inactivo");
});

test("la interfaz de RRHH separa rol RBAC, responsabilidad, asignación y suplencia", () => {
  for (const id of ["rrhh-internal-role-form","rrhh-internal-assignment-form","rrhh-internal-assignment-history","rrhh-internal-assignment-substitute","rrhh-internal-assignment-role","rrhh-internal-assignment-responsibility"]) {
    assert.ok(dashboard.includes('id="' + id + '"'), "Falta control UI " + id);
  }
  assert.match(dashboard, /fetchApi\('USER','manageInternalRoleCatalog'/);
  assert.match(dashboard, /fetchApi\('USER','assignRoleScope'/);
  const panelStart = dashboard.indexOf("const panel=document.getElementById('rrhh-internal-roles-panel')");
  const panelEnd = dashboard.indexOf("</script>", panelStart);
  assert.ok(panelStart >= 0 && panelEnd > panelStart, "El controlador del panel debe existir");
  assert.doesNotMatch(dashboard.slice(panelStart, panelEnd), /innerHTML\s*=/);
  assert.match(backend, /"assignRoleScope"/);
});

test("el código interno también es único y se compara sin diferencias de mayúsculas", () => {
  const roles = sheet([roleHeaders]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  const first = context.manageInternalRoleCatalog({ _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos", codigoInterno: "COORD-01", nombreResponsabilidad: "Coordinador de Área", tipoResponsabilidad: "Académica", motivo: "Creación autorizada del puesto." });
  assert.equal(first.status, "success");
  const duplicate = context.manageInternalRoleCatalog({ _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos", codigoInterno: "coord-01", nombreResponsabilidad: "Otro puesto", tipoResponsabilidad: "Académica", motivo: "Validación de código duplicado." });
  assert.equal(duplicate.code, "INTERNAL_ROLE_CODE_DUPLICATE");
  assert.equal(roles.rows.length, 2);
});
test("la vigencia predeterminada del catálogo se aplica cuando no se indica fecha final", () => {
  const { context, assignments } = assignmentContext();
  const result = assign(context, "EMP-1", "ROL-1", { fechaFin: "" });
  assert.equal(result.status, "success");
  assert.match(String(assignments.rows[1][9]), /^2027-01-01/);
});
test("revocar una asignación conserva el evento y la fila histórica", () => {
  const { context, assignments } = assignmentContext();
  const created = assign(context, "EMP-1", "ROL-1");
  const revoked = assign(context, "EMP-1", "ROL-1", { assignmentId: created.assignmentId, estado: "Revocado" });
  assert.equal(revoked.status, "success");
  assert.equal(assignments.rows.length, 2);
  assert.equal(assignments.rows[1][5], "Revocado");
  assert.equal(context.audit.length, 2);
});
test("el controlador nuevo de RRHH tiene sintaxis JavaScript válida", () => {
  const panelStart = dashboard.indexOf("const panel=document.getElementById('rrhh-internal-roles-panel')");
  const start = dashboard.lastIndexOf("document.addEventListener('DOMContentLoaded', function () {", panelStart);
  const end = dashboard.indexOf("</script>", panelStart);
  assert.ok(start >= 0 && panelStart > start && end > panelStart);
  assert.doesNotThrow(() => new vm.Script(dashboard.slice(start, end)));
});

test("las asignaciones nuevas mantienen compatibilidad con usuarios de rol heredado sin membresías RBAC", () => {
  const { context, assignments } = assignmentContext();
  context.getUserRoleMembershipState_ = () => ({ hasRecords: false, memberships: [] });
  const result = assign(context, "EMP-1", "ROL-1");
  assert.equal(result.status, "success");
  assert.equal(assignments.rows[1][13], "");
  const history = context.getInternalRoleAssignments({ soloVigentes: true });
  assert.equal(history.status, "success");
  assert.equal(history.data.length, 1);
  assert.equal(history.data[0].membershipStatus, "LEGACY_ROLE");
});

test("assignRoleScope no escribe si LockService está ocupado", () => {
  const { context, assignments } = assignmentContext();
  let releases = 0;
  context.LockService = { getScriptLock: () => ({
    waitLock() { throw new Error("LOCK_BUSY"); },
    releaseLock() { releases++; }
  }) };
  const result = assign(context, "EMP-1", "ROL-1");
  assert.equal(result.status, "error");
  assert.equal(result.code, "LOCK_BUSY");
  assert.equal(assignments.rows.length, 1);
  assert.equal(releases, 0);
});

test("assignRoleScope libera LockService después de una asignación correcta", () => {
  const { context, assignments } = assignmentContext();
  let waits = 0, releases = 0;
  context.LockService = { getScriptLock: () => ({
    waitLock() { waits++; },
    releaseLock() { releases++; }
  }) };
  const result = assign(context, "EMP-1", "ROL-1");
  assert.equal(result.status, "success");
  assert.equal(assignments.rows.length, 2);
  assert.equal(waits, 1);
  assert.equal(releases, 1);
});

test("una asignación interna no modifica la matriz de permisos RBAC", () => {
  const { context } = assignmentContext();
  const before = JSON.stringify(context.ROLE_PERMISSIONS);
  const result = assign(context, "EMP-1", "ROL-1");
  assert.equal(result.status, "success");
  assert.equal(JSON.stringify(context.ROLE_PERMISSIONS), before);
});

test("un fallo de auditoría compensa la escritura de la asignación", () => {
  const { context, assignments } = assignmentContext();
  context.recordEntityChangeLog = () => { throw new Error("AUDIT_WRITE_FAILED"); };
  const result = assign(context, "EMP-1", "ROL-1");
  assert.equal(result.status, "error");
  assert.equal(result.code, "AUDIT_WRITE_FAILED");
  assert.equal(assignments.rows.length, 1);
  assert.equal(context.events.length, 1);
});

test("manageInternalRoleCatalog no modifica el catálogo si LockService está ocupado", () => {
  const roles = sheet([roleHeaders]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  let releases = 0;
  context.LockService = { getScriptLock: () => ({
    waitLock() { throw new Error("LOCK_BUSY"); },
    releaseLock() { releases++; }
  }) };
  const result = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    nombreResponsabilidad: "Coordinador de Matemáticas", tipoResponsabilidad: "Académica",
    vigenciaMeses: 12, motivo: "Creación autorizada del puesto."
  });
  assert.equal(result.status, "error");
  assert.equal(result.code, "LOCK_BUSY");
  assert.equal(roles.rows.length, 1);
  assert.equal(releases, 0);
});

test("la vigencia predeterminada limita el día al último día del mes destino", () => {
  const { context, assignments, roles } = assignmentContext();
  roles.rows[1][7] = 1;
  const result = assign(context, "EMP-1", "ROL-1", { fechaInicio: "2028-01-31", fechaFin: "" });
  assert.equal(result.status, "success");
  assert.match(String(assignments.rows[1][9]), /^2028-02-29/);
});

test("manageInternalRoleCatalog libera LockService después de crear una responsabilidad", () => {
  const roles = sheet([roleHeaders]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  let waits = 0, releases = 0;
  context.LockService = { getScriptLock: () => ({
    waitLock() { waits++; },
    releaseLock() { releases++; }
  }) };
  const result = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    nombreResponsabilidad: "Jefe de Nivel", tipoResponsabilidad: "Administrativa",
    vigenciaMeses: 12, motivo: "Alta autorizada para prueba."
  });
  assert.equal(result.status, "success");
  assert.equal(roles.rows.length, 2);
  assert.equal(waits, 1);
  assert.equal(releases, 1);
});

test("manageInternalRoleCatalog revierte el alta si falla auditoría y libera LockService", () => {
  const roles = sheet([roleHeaders]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  let waits = 0, releases = 0;
  context.LockService = { getScriptLock: () => ({
    waitLock() { waits++; },
    releaseLock() { releases++; }
  }) };
  context.recordEntityChangeLog = () => { throw new Error("AUDIT_WRITE_FAILED"); };
  const result = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    nombreResponsabilidad: "Orientador", tipoResponsabilidad: "Administrativa",
    vigenciaMeses: 12, motivo: "Alta autorizada para prueba."
  });
  assert.equal(result.status, "error");
  assert.equal(result.code, "AUDIT_WRITE_FAILED");
  assert.equal(roles.rows.length, 1);
  assert.equal(waits, 1);
  assert.equal(releases, 1);
  assert.equal(context.events.length, 1);
});

test("actualizar una asignación por ID conserva los atributos omitidos", () => {
  const { context, assignments } = assignmentContext();
  const created = assign(context, "EMP-1", "ROL-1", {
    fechaInicio: "2026-02-10", fechaFin: "2026-11-30", scopeValues: ["DEP-1", "DEP-2"]
  });
  assert.equal(created.status, "success");
  const before = assignments.rows[1].slice();
  const updated = context.assignRoleScope({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    assignmentId: created.assignmentId, estado: "Revocado",
    motivo: "Revocación autorizada por cambio de funciones."
  });
  assert.equal(updated.status, "success");
  const after = assignments.rows[1];
  for (const index of [0,1,2,3,4,6,7,8,9,10,11,12,13,14]) {
    assert.equal(after[index], before[index], "Debe conservar la columna " + index);
  }
  assert.equal(after[5], "Revocado");
});

test("getUserScopeConfig excluye asignaciones futuras y vencidas", () => {
  const { context, assignments } = assignmentContext();
  const created = assign(context, "EMP-1", "ROL-1", { fechaInicio: "2026-01-01", fechaFin: "2026-12-31" });
  assert.equal(created.status, "success");
  const expired = assignments.rows[1].slice();
  expired[0] = "AMB-EXPIRED";
  expired[8] = "2025-01-01";
  expired[9] = "2025-12-31";
  const future = assignments.rows[1].slice();
  future[0] = "AMB-FUTURE";
  future[8] = "2027-01-01";
  future[9] = "2027-12-31";
  assignments.rows.push(expired, future);
  const result = context.getUserScopeConfig({
    _verifiedUserId: "EMP-1", _verifiedRole: "Docente", userId: "EMP-1",
    _verifiedClaims: { userId: "EMP-1", role: "Docente", membershipId: "MEM-1", institutionId: "INST-1" }
  });
  assert.equal(result.status, "success");
  assert.deepEqual(Array.from(result.ambitos, item => item.assignmentId), [created.assignmentId]);
});

test("getInternalRoleAssignments aplica vigencia temporal a la consulta de asignaciones", () => {
  const { context, assignments } = assignmentContext();
  const created = assign(context, "EMP-1", "ROL-1", { fechaInicio: "2026-01-01", fechaFin: "2026-12-31" });
  const expired = assignments.rows[1].slice();
  expired[0] = "AMB-EXPIRED";
  expired[8] = "2025-01-01";
  expired[9] = "2025-12-31";
  const future = assignments.rows[1].slice();
  future[0] = "AMB-FUTURE";
  future[8] = "2027-01-01";
  future[9] = "2027-12-31";
  assignments.rows.push(expired, future);
  const result = context.getInternalRoleAssignments({ userId: "EMP-1", soloVigentes: true });
  assert.equal(result.status, "success");
  assert.deepEqual(Array.from(result.data, item => item.asignacionId), [created.assignmentId]);
});

test("actualizar parcialmente una responsabilidad conserva todos los campos omitidos", () => {
  const roles = sheet([roleHeaders, roleRow("ROL-1", "Coordinador de Matemáticas", "COORD-MAT")]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  const before = roles.rows[1].slice();
  const result = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    rolInternoId: "ROL-1", nombreResponsabilidad: "Coordinador Académico",
    motivo: "Actualización parcial autorizada."
  });
  assert.equal(result.status, "success");
  assert.equal(roles.rows[1][2], "Coordinador Académico");
  for (const index of [1,3,4,5,6,7,8,9,10,11,13]) {
    assert.equal(roles.rows[1][index], before[index], "Debe conservar la columna " + index);
  }
});

test("los identificadores de catálogo colisionados se rechazan sin duplicar filas", () => {
  const collisionId = "ROL-INT-" + "A".repeat(20);
  const roles = sheet([roleHeaders, roleRow(collisionId, "Responsabilidad existente", "EXISTENTE")]);
  const context = makeContext({ sheets: { CatalogoRolesInternos: roles } });
  context.Utilities.getUuid = () => "A".repeat(32) + "-0000-0000-0000";
  const result = context.manageInternalRoleCatalog({
    _verifiedUserId: "HR-1", _verifiedRole: "RecursosHumanos",
    nombreResponsabilidad: "Responsabilidad nueva", tipoResponsabilidad: "Académica",
    vigenciaMeses: 12, motivo: "Alta autorizada para probar colisión."
  });
  assert.equal(result.status, "error");
  assert.equal(result.code, "INTERNAL_ROLE_ID_CONFLICT");
  assert.equal(roles.rows.length, 2);
});

test("parseInternalRoleAssignmentDate_ valida ISO calendárico y fin inclusivo de celdas Date", () => {
  const context = makeContext();
  const invalidIso = context.parseInternalRoleAssignmentDate_("2026-02-30T00:00:00Z", false);
  assert.equal(invalidIso.valid, false);
  const ambiguous = context.parseInternalRoleAssignmentDate_("02/03/2026", false);
  assert.equal(ambiguous.valid, false);
  const dateObject = vm.runInNewContext("new Date(2026, 0, 31)", context);
  const inclusive = context.parseInternalRoleAssignmentDate_(dateObject, true);
  assert.equal(inclusive.valid, true);
  assert.equal(inclusive.date.getFullYear(), 2026);
  assert.equal(inclusive.date.getMonth(), 0);
  assert.equal(inclusive.date.getDate(), 31);
  assert.equal(inclusive.date.getHours(), 23);
  assert.equal(inclusive.date.getMinutes(), 59);
  assert.equal(inclusive.date.getMilliseconds(), 999);
});

test("getUserContextScope aplica FK activa y compatibilidad legacy sin membresía RBAC", () => {
  const { context, assignments, roles } = assignmentContext();
  const created = assign(context, "EMP-1", "ROL-1");
  assert.equal(created.status, "success");
  assignments.rows[1][13] = "";
  const payload = {
    _verifiedUserId: "EMP-1", _verifiedRole: "Docente",
    _verifiedClaims: { userId: "EMP-1", role: "Docente", membershipId: "", institutionId: "" }
  };
  const result = context.getUserContextScope(payload);
  assert.equal(result.status, "success");
  assert.equal(result.scopes.length, 1);
  assert.equal(result.scopes[0].responsibilityId, "ROL-1");
  roles.rows[1][9] = "Inactivo";
  const inactive = context.getUserContextScope(payload);
  assert.equal(inactive.status, "error");
  assert.equal(inactive.code, "DEPARTMENT_SCOPE_NOT_ASSIGNED");
});

test("getUserContextScope trata FechaFin Date de medianoche como día inclusivo", () => {
  const { context, assignments } = assignmentContext();
  const yesterday = new Date(Date.now() - 86400000);
  const start = yesterday.getFullYear() + "-" + String(yesterday.getMonth()+1).padStart(2,"0") + "-" + String(yesterday.getDate()).padStart(2,"0");
  const created = assign(context, "EMP-1", "ROL-1", { fechaInicio: start, fechaFin: "2026-12-31" });
  assert.equal(created.status, "success");
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  assignments.rows[1][9] = vm.runInNewContext("new Date(" + midnight + ")", context);
  const result = context.getUserContextScope({
    _verifiedUserId: "EMP-1", _verifiedRole: "Docente",
    _verifiedClaims: { userId: "EMP-1", role: "Docente", membershipId: "MEM-1", institutionId: "INST-1" }
  });
  assert.equal(result.status, "success");
  assert.equal(result.scopes.length, 1);
});

test("la consola HR ignora respuestas antiguas cuando hay cargas concurrentes", () => {
  assert.match(dashboard, /loadGeneration=0/);
  assert.match(dashboard, /if\(generation!==loadGeneration\)return/);
});
test("parseInternalRoleAssignmentDate_ acepta timestamps ISO con milisegundos", () => {
  const context = makeContext();
  const parsed = context.parseInternalRoleAssignmentDate_("2026-02-28T10:15:30.123Z", false);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.date.toISOString(), "2026-02-28T10:15:30.123Z");
});
test("las asignaciones sin FK explícita solo aparecen en historial y nunca otorgan ámbitos", () => {
  const legacyHeaders = assignmentHeaders.slice(0, 12);
  const assignments = sheet([legacyHeaders,
    ["AMB-LEGACY","EMP-1","Docente","DEPARTAMENTO",'["DEP-1"]',"Activo","HR-1","2026-01-01","2026-01-01","2026-12-31","No",""]
  ]);
  const users = sheet([["UserID"], userRow("EMP-1")]);
  const roles = sheet([roleHeaders, roleRow("ROL-1","Coordinador","COORD-1")]);
  const context = makeContext({ sheets: { AsignacionesAmbitosRoles: assignments, Usuarios: users, CatalogoRolesInternos: roles } });
  const active = context.getInternalRoleAssignments({ soloVigentes: true });
  assert.equal(active.status, "success");
  assert.equal(active.data.length, 0);
  const history = context.getInternalRoleAssignments({ soloVigentes: false });
  assert.equal(history.status, "success");
  assert.equal(history.data.length, 1);
  assert.equal(history.data[0].responsibilityId, null);
  assert.equal(history.data[0].responsibilityStatus, "LEGACY_UNLINKED");
  const scope = context.getUserContextScope({
    _verifiedUserId: "EMP-1", _verifiedRole: "Docente",
    _verifiedClaims: { userId: "EMP-1", role: "Docente", membershipId: "", institutionId: "" }
  });
  assert.equal(scope.status, "error");
  assert.equal(scope.code, "ROLE_SCOPE_RESPONSIBILITY_LINK_REQUIRED");
});

test("una asignación con responsabilidad inexistente o inactiva se rechaza", () => {
  const { context, assignments, roles } = assignmentContext();
  assert.equal(assign(context, "EMP-1", "ROL-NO-EXISTE").code, "ROLE_RESPONSIBILITY_NOT_ACTIVE");
  roles.rows[1][9] = "Inactivo";
  assert.equal(assign(context, "EMP-1", "ROL-1").code, "ROLE_RESPONSIBILITY_NOT_ACTIVE");
  assert.equal(assignments.rows.length, 1);
});

test("assignRoleScope no duplica IDs de asignación ante una colisión de UUID", () => {
  const { context, assignments } = assignmentContext();
  const collisionId = "AMB-" + "A".repeat(32);
  assignments.rows.push([collisionId,"EMP-3","Docente","OTRO",'["DEP-3"]',"Activo","HR-1","2026-01-01","2026-01-01","2026-12-31","No","","INST-1","MEM-3","ROL-2"]);
  context.Utilities.getUuid = () => "A".repeat(32) + "-0000-0000-0000";
  const result = assign(context, "EMP-1", "ROL-1");
  assert.equal(result.status, "error");
  assert.equal(result.code, "ROLE_SCOPE_ASSIGNMENT_ID_CONFLICT");
  assert.equal(assignments.rows.length, 2);
  assert.equal(assignments.rows[1][0], collisionId);
});
