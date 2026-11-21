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
    institutionWide: true,
    dynamicAuditPermission: true,
    notificationSheet: true,
    scopeStatus: "success"
  }, options || {});
  const calls = { scope: [], dynamic: [], reads: 0 };
  const rows = [
    ["NotificacionID", "UserId", "Tipo", "Titulo", "Mensaje", "Fecha", "Leido", "Categoria", "Enlace", "DedupKey", "EstadoEntrega", "EmailDestino"],
    ["N-SCHED-1", "USR-1", "CambioHorarioAcademico", "Horario 1", "Se modificó el horario (HOR-1).", "2026-11-20", false, "Académico", "", "NOTIF_SCHED_HOR-1_Lunes_08:00", "Entregado", ""],
    ["N-SCHED-10", "USR-10", "CambioHorarioAcademico", "Horario 10", "Se modificó el horario (HOR-10).", "2026-11-19", false, "Académico", "", "NOTIF_SCHED_HOR-10_Martes_09:00", "Entregado", ""],
    ["N-OTHER", "USR-X", "General", "Otro", "Aviso general", "2026-11-18", false, "General", "", "OTHER", "Entregado", ""]
  ];
  const runtime = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
      if (name !== "BandejaNotificaciones" || !settings.notificationSheet) return null;
      return { getDataRange: () => { calls.reads++; return { getValues: () => rows.map(row => row.slice()) }; } };
    } }) },
    getInstitutionalDepartmentScope_: (payload, role) => {
      calls.scope.push({ userId: payload._verifiedUserId, role });
      return { status: settings.scopeStatus, institutionWide: settings.institutionWide };
    },
    getDynamicPermissionsForRole: (role, action) => {
      calls.dynamic.push({ role, action });
      return settings.dynamicAuditPermission;
    },
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(
    extractFunction("getScheduleChangeNotificationLogs") + "\n" +
    extractFunction("getNotificationAuditLogs") +
    "\nthis.schedule = getScheduleChangeNotificationLogs; this.audit = getNotificationAuditLogs;",
    runtime
  );
  return { schedule: runtime.schedule, audit: runtime.audit, calls };
}

function request(role, userId) {
  return { _verifiedRole: role, _verifiedUserId: userId };
}

const departmental = makeHarness({ institutionWide: false });
assert.equal(departmental.schedule(request("Director", "DIR-1"), "HOR-1").code, undefined);
