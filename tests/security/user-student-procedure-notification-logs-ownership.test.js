"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
function extractFunction(name) {
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

function makeHarness(options) {
  const settings = Object.assign({
    ownershipAllowed: true,
    institutionWide: true,
    guardianAllowed: true,
    duplicateRequest: false,
    duplicateExpediente: false,
    duplicateStudentIdentity: false,
    notificationSheet: true
  }, options || {});
  const calls = { ownership: [], institutionScope: 0, contextual: [], notificationReads: 0 };
  const userRows = [
    ["UserID", "PersonaID", "Rol", "EstadoCuenta"],
    ["STU-1", "PERSON-1", "Estudiante", "Activo"],
    ["STU-2", "PERSON-2", "Estudiante", "Activo"]
  ];
  if (settings.duplicateStudentIdentity) userRows.push(["STU-ALT", "PERSON-1", "Estudiante", "Activo"]);
  const expedienteRows = [
    ["ExpedienteID", "PersonaID"],
    ["EXP-1", "PERSON-1"],
    ["EXP-10", "PERSON-2"]
  ];
  if (settings.duplicateExpediente) expedienteRows.push(["EXP-1", "PERSON-OTHER"]);
  const requestRows = [
    ["SolicitudID", "UserID", "EstudianteID", "TipoTramite"],
    ["SOL-1", "STAFF-1", "STU-1", "Justificación de Ausencia"],
    ["SOL-10", "STAFF-2", "STU-2", "Justificación de Ausencia"]
  ];
  if (settings.duplicateRequest) requestRows.push(["SOL-1", "STAFF-3", "STU-2", "Justificación de Ausencia"]);
  const notificationRows = [
    ["NotificacionID", "UserId", "Tipo", "Titulo", "Mensaje", "Fecha", "Leido", "Categoria", "EnlaceAccion", "DedupKey", "EstadoEntrega", "EmailDestino"],
    ["N-1", "EXP-1", "Procedimiento", "Expediente 1", "Aviso 1", "2026-11-20", false, "General", "", "WORKFLOW|EXP-1|SOL-1", "Entregado", ""],
    ["N-10", "EXP-10", "Procedimiento", "Expediente 10", "Aviso 10", "2026-11-20", false, "General", "", "WORKFLOW|EXP-10|SOL-10", "Entregado", ""],
    ["N-REQUEST", "SOL-1", "Procedimiento", "Solicitud 1", "Aviso solicitud", "2026-11-19", false, "General", "", "WORKFLOW|SOL-1", "Entregado", ""],
    ["N-SUBSTRING", "EXP-10", "Procedimiento", "No debe coincidir", "Aviso similar", "2026-11-18", false, "General", "", "WORKFLOW|EXP-10", "Entregado", ""]
  ];
  const sheets = {
    Usuarios: userRows,
    ExpedientesEstudiantes: expedienteRows,
    SolicitudesTramites: requestRows,
    BandejaNotificaciones: notificationRows
  };
  const sheet = name => ({
    getDataRange() {
      if (name === "BandejaNotificaciones") calls.notificationReads++;
      return { getValues: () => sheets[name].map(row => row.slice()) };
    }
  });
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
      if (name === "BandejaNotificaciones" && !settings.notificationSheet) return null;
      return sheets[name] ? sheet(name) : null;
    } }) },
    assertRecordOwnership: (payload, resourceType, resourceId, operation) => {
      calls.ownership.push({ userId: payload._verifiedUserId, resourceType, resourceId, operation });
      return { authorized: settings.ownershipAllowed, code: "RESOURCE_SCOPE_DENIED" };
    },
    getInstitutionalDepartmentScope_: () => {
      calls.institutionScope++;
      return { status: "success", institutionWide: settings.institutionWide };
    },
    validateContextualAccess: (action, payload, actorId, role) => {
      calls.contextual.push({ action, actorId, role, studentId: payload.studentId || "" });
      if (!settings.guardianAllowed || payload.studentId !== "STU-1") {
        return { authorized: false, reason: "GUARDIAN_DOMAIN_PERMISSION_DENIED" };
      }
      payload._verifiedGuardianStudent = { studentUserId: "STU-1", expedienteId: "EXP-1" };
      return { authorized: true };
    },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("resolveAbsenceReviewExpedienteId_") + "\n" +
    extractFunction("getStudentProcedureNotificationLogs") +
    "\nthis.run = getStudentProcedureNotificationLogs;",
    runtime
  );
  return { run: runtime.run, calls, sheets };
}

function request(role, userId, values) {
  return Object.assign({ _verifiedRole: role, _verifiedUserId: userId }, values || {});
}

const director = makeHarness();
const missingTarget = director.run(request("Director", "DIR-1"));
assert.equal(missingTarget.code, "NOTIFICATION_TARGET_REQUIRED");
assert.equal(director.calls.notificationReads, 0, "unscoped request must not read notification records");

const directorAllowed = director.run(request("Director", "DIR-1", { expedienteId: "EXP-1" }));
assert.equal(directorAllowed.status, "success");
assert.deepEqual(Array.from(directorAllowed.logs, row => row.notificacionId), ["N-1"],
  "exact expediente matching must not include EXP-10 or substring collisions");
assert.deepEqual(director.calls.ownership[0], {
  userId: "DIR-1", resourceType: "EXPEDIENTE_ESTUDIANTE", resourceId: "EXP-1", operation: "READ"
});

const directorDenied = makeHarness({ ownershipAllowed: false });
const deniedResult = directorDenied.run(request("Director", "DIR-1", { expedienteId: "EXP-1" }));
assert.equal(deniedResult.code, "RESOURCE_SCOPE_DENIED");
assert.equal(directorDenied.calls.notificationReads, 0, "denied department scope must not read notification records");

const student = makeHarness();
const ownStudent = student.run(request("Estudiante", "STU-1", { expedienteId: "EXP-1" }));
assert.equal(ownStudent.status, "success");
assert.deepEqual(Array.from(ownStudent.logs, row => row.notificacionId), ["N-1"]);
const otherStudent = student.run(request("Estudiante", "STU-1", { expedienteId: "EXP-10" }));
assert.equal(otherStudent.code, "RESOURCE_SCOPE_DENIED", "student cannot read another student's expediente");

const requestLookup = makeHarness();
const requestResult = requestLookup.run(request("Director", "DIR-1", { solicitudId: "SOL-1" }));
assert.equal(requestResult.status, "success");
assert.deepEqual(Array.from(requestResult.logs, row => row.notificacionId).sort(), ["N-1", "N-REQUEST"]);
assert.equal(requestLookup.calls.ownership[0].resourceId, "EXP-1",
  "solicitudId must resolve to its unique student expediente before scope authorization");

const mismatchedRequest = makeHarness();
assert.equal(mismatchedRequest.run(request("Director", "DIR-1", {
  expedienteId: "EXP-10", solicitudId: "SOL-1"
})).code, "NOTIFICATION_TARGET_MISMATCH");

const duplicateRequest = makeHarness({ duplicateRequest: true });
assert.equal(duplicateRequest.run(request("Director", "DIR-1", { solicitudId: "SOL-1" })).code, "RESOURCE_AMBIGUOUS");
assert.equal(duplicateRequest.calls.ownership.length, 0);

const duplicateExpediente = makeHarness({ duplicateExpediente: true });
assert.equal(duplicateExpediente.run(request("Director", "DIR-1", { expedienteId: "EXP-1" })).code, "RESOURCE_OWNERSHIP_AMBIGUOUS");
assert.equal(duplicateExpediente.calls.ownership.length, 0);

const duplicateStudent = makeHarness({ duplicateStudentIdentity: true });
assert.equal(duplicateStudent.run(request("Estudiante", "STU-1", { expedienteId: "EXP-1" })).code, "RESOURCE_SCOPE_DENIED");

const adminWithoutWideScope = makeHarness({ institutionWide: false });
assert.equal(adminWithoutWideScope.run(request("Administrador", "ADMIN-1", { expedienteId: "EXP-1" })).code, "RESOURCE_SCOPE_DENIED");
assert.equal(adminWithoutWideScope.calls.institutionScope, 1);
const adminWithWideScope = makeHarness();
assert.equal(adminWithWideScope.run(request("Administrador", "ADMIN-1", { expedienteId: "EXP-1" })).status, "success");

const guardian = makeHarness();
const guardianResult = guardian.run(request("Tutor", "TUTOR-1", { solicitudId: "SOL-1" }));
assert.equal(guardianResult.status, "success");
assert.deepEqual(Array.from(guardianResult.logs, row => row.notificacionId).sort(), ["N-1", "N-REQUEST"]);
assert.equal(guardian.calls.contextual[0].action, "getStudentProcedureNotificationLogs");
const unlinkedGuardian = makeHarness({ guardianAllowed: false });
assert.equal(unlinkedGuardian.run(request("Tutor", "TUTOR-2", { solicitudId: "SOL-10" })).code, "GUARDIAN_DOMAIN_PERMISSION_DENIED");

const missingNotifications = makeHarness({ notificationSheet: false });
assert.deepEqual(missingNotifications.run(request("Director", "DIR-1", { expedienteId: "EXP-1" })).logs, []);

console.log("user-student-procedure-notification-logs-ownership: all assertions passed");
