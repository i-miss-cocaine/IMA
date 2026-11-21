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
    institutionWide: false,
    ownershipAllowed: true,
    duplicateRequest: false,
    admissionSheet: true,
    notificationSheet: true
  }, options || {});
  const calls = { ownership: [], scope: [], notificationReads: 0 };
  const admissions = [
    ["SolicitudID", "FechaSolicitud", "AnoLectivo", "Grado", "Nombres", "Apellidos"],
    ["SOL-1", "2026-11-01", "2026", "7", "Ana", "Uno"],
    ["SOL-10", "2026-11-02", "2026", "8", "Beto", "Dos"]
  ];
  if (settings.duplicateRequest) admissions.push(["SOL-1", "2026-11-03", "2026", "9", "Celia", "Tres"]);
  const notifications = [
    ["NotificacionID", "UserId", "Tipo", "Titulo", "Mensaje", "Fecha", "Leido", "Categoria", "EnlaceAccion", "DedupKey", "EstadoEntrega", "EmailDestino"],
    ["N-1", "USR-1", "Admisión", "Solicitud 1", "Solicitud SOL-1 recibida", "2026-11-20", false, "Admisión", "", "ADMISSION|SOL-1|CREATED", "Entregado", ""],
    ["N-10", "USR-10", "Admisión", "Solicitud 10", "Solicitud SOL-10 recibida", "2026-11-19", false, "Admisión", "", "ADMISSION|SOL-10|CREATED", "Entregado", ""],
    ["N-OTHER", "USR-X", "General", "Otro", "Sin relación", "2026-11-18", false, "General", "", "OTHER|SOL-100", "Entregado", ""]
  ];
  const sheets = {
    SolicitudesAdmision: admissions,
    BandejaNotificaciones: notifications
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
      if (name === "SolicitudesAdmision" && !settings.admissionSheet) return null;
      if (name === "BandejaNotificaciones" && !settings.notificationSheet) return null;
      return sheets[name] ? sheet(name) : null;
    } }) },
    getInstitutionalDepartmentScope_: (payload, role) => {
      calls.scope.push({ userId: payload._verifiedUserId, role });
      return { status: "success", institutionWide: settings.institutionWide };
    },
    assertRecordOwnership: (payload, resourceType, resourceId, operation) => {
      calls.ownership.push({ userId: payload._verifiedUserId, resourceType, resourceId, operation });
      return { authorized: settings.ownershipAllowed, code: "RESOURCE_SCOPE_DENIED" };
    },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(extractFunction("getAdmissionNotificationLogs") + "\nthis.run = getAdmissionNotificationLogs;", runtime);
  return { run: runtime.run, calls };
}

function request(role, userId, values) {
  return Object.assign({ _verifiedRole: role, _verifiedUserId: userId }, values || {});
}

const directorNoTarget = makeHarness();
assert.equal(directorNoTarget.run(request("Director", "DIR-1")).code, "NOTIFICATION_TARGET_REQUIRED");
assert.equal(directorNoTarget.calls.notificationReads, 0, "departmental actor cannot list all admissions notifications");

const director = makeHarness();
const scoped = director.run(request("Director", "DIR-1", { solicitudId: "SOL-1" }));
assert.equal(scoped.status, "success");
assert.deepEqual(Array.from(scoped.notificaciones, row => row.notificacionId), ["N-1"],
  "SOL-1 must not match SOL-10 or SOL-100");
assert.deepEqual(director.calls.ownership[0], {
  userId: "DIR-1", resourceType: "SOLICITUD_ADMISION", resourceId: "SOL-1", operation: "READ"
});

const denied = makeHarness({ ownershipAllowed: false });
assert.equal(denied.run(request("Director", "DIR-1", { solicitudId: "SOL-1" })).code, "RESOURCE_SCOPE_DENIED");
assert.equal(denied.calls.notificationReads, 0, "ownership denial must happen before notification reads");

const duplicate = makeHarness({ duplicateRequest: true });
assert.equal(duplicate.run(request("Director", "DIR-1", { solicitudId: "SOL-1" })).code, "RESOURCE_AMBIGUOUS");
assert.equal(duplicate.calls.ownership.length, 0);

const missingAdmission = makeHarness({ admissionSheet: false });
assert.equal(missingAdmission.run(request("Director", "DIR-1", { solicitudId: "SOL-1" })).code, "RESOURCE_NOT_FOUND");

const institutionWideDirector = makeHarness({ institutionWide: true });
const globalDirector = institutionWideDirector.run(request("Director", "DIR-WIDE"));
assert.equal(globalDirector.status, "success");
assert.equal(globalDirector.totalNotificaciones, 3);
assert.equal(institutionWideDirector.calls.ownership.length, 0);

const adminNoScope = makeHarness({ institutionWide: false });
assert.equal(adminNoScope.run(request("Administrador", "ADMIN-1")).code, "NOTIFICATION_TARGET_REQUIRED");
const adminGlobal = makeHarness({ institutionWide: true });
assert.equal(adminGlobal.run(request("Administrador", "ADMIN-1")).totalNotificaciones, 3);

const globalMissingSheet = makeHarness({ institutionWide: true, notificationSheet: false });
assert.equal(globalMissingSheet.run(request("Director", "DIR-WIDE")).status, "success");
assert.deepEqual(Array.from(globalMissingSheet.run(request("Director", "DIR-WIDE")).notificaciones), []);

console.log("user-admission-notification-logs-ownership: all assertions passed");
