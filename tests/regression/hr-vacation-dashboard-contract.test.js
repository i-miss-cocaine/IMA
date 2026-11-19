"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "dashboard-recursos-humanos.html"), "utf8");
function extractFunction(source, name) {
  const start = source.indexOf("async function " + name + "(");
  assert.ok(start >= 0, name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") { line = true; i++; continue; }
    if (c === "/" && next === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const loader = extractFunction(html, "loadHRDashboardData");
assert.doesNotMatch(loader, /\.innerHTML\s*=/, "HR employee and leave data must be rendered through textContent/DOM nodes");

class FakeElement {
  constructor(id) { this.id = id || ""; this.children = []; this._text = ""; this.className = ""; this.colSpan = 0; this.listeners = {}; }
  set textContent(value) { this._text = String(value == null ? "" : value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
  replaceChildren(...nodes) { this._text = ""; this.children = nodes; }
  appendChild(node) { this.children.push(node); return node; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
function makeRun(leaveResponse, throwOnLeaves) {
  const elements = Object.create(null);
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = new FakeElement(id)); },
    createElement(tag) { return new FakeElement(tag); }
  };
  const employees = [{ expedienteId: "EXP-A", empleadoNombre: "Ana Lopez", nombreCompleto: "Ana Lopez", puesto: "Docente", departamento: "A", centroCosto: "A", estadoLaboral: "Activo", observaciones: "NOTA INTERNA NO MOSTRAR" }];
  const responses = {
    getEmployeeRecords: { status: "success", data: employees, expedientes: employees },
    getEmployeeContractAlerts: { status: "success", resumen: { proximosAVencer: 1, vencidos: 0 } },
    getLeaveVacationRequests: leaveResponse
  };
  const context = {
    document,
    console: { error() {}, log() {}, warn() {} },
    alert() {},
    fetchApi: async function(service, action) {
      if (action === "getLeaveVacationRequests" && throwOnLeaves) throw new Error("simulated service outage");
      return responses[action];
    },
    Array, Object, String, Number, Math, Date, Promise
  };
  vm.createContext(context);
  vm.runInContext(loader, context);
  return { run: () => context.loadHRDashboardData(), elements };
}

async function main() {
  const success = makeRun({ status: "success", data: [
    { solicitudId: "VA", expedienteId: "EXP-A", empleadoNombre: "Ana Lopez", tipo: "Vacaciones", tipoSolicitud: "Vacaciones", fechaInicio: "2026-12-01", fechaFin: "2026-12-05", diasSolicitados: 5, estado: "Pendiente", estadoOriginal: "PendienteAprobacion" },
    { solicitudId: "VB", expedienteId: "EXP-B", empleadoNombre: "Luis Perez", tipo: "Permiso", tipoSolicitud: "Permiso", fechaInicio: "2026-12-02", fechaFin: "2026-12-03", diasSolicitados: 2, estado: "Aprobado", estadoOriginal: "Aprobado" },
    { solicitudId: "VC", expedienteId: "EXP-C", empleadoNombre: "", tipo: "Permiso", tipoSolicitud: "Permiso", fechaInicio: "", fechaFin: "", diasSolicitados: 0, estado: "Rechazado", estadoOriginal: "Rechazado" }
  ] });
  await success.run();
  assert.equal(success.elements["rrhh-pending-leaves"].textContent, "1");
  assert.ok(success.elements["rrhh-requests-list"].textContent.includes("Ana Lopez"));
  assert.ok(success.elements["rrhh-requests-list"].textContent.includes("Luis Perez"));
  assert.ok(success.elements["rrhh-requests-list"].textContent.includes("Nombre no disponible"));
  assert.ok(success.elements["rrhh-requests-list"].textContent.includes("Pendiente"));
  assert.ok(success.elements["rrhh-requests-list"].textContent.includes("Aprobado"));
  assert.ok(success.elements["rrhh-requests-list"].textContent.includes("Rechazado"));
  const firstTitle = success.elements["rrhh-requests-list"].children[0].children[0].children[0].textContent;
  const unnamedTitle = success.elements["rrhh-requests-list"].children[2].children[0].children[0].textContent;
  assert.equal(firstTitle, "Vacaciones — Ana Lopez");
  assert.equal(unnamedTitle, "Permiso — Nombre no disponible");
  assert.ok(!firstTitle.includes("EXP-A"), "an expediente ID is metadata, never a displayed employee name");
  assert.ok(!success.elements["rrhh-employees-tbody"].textContent.includes("NOTA INTERNA"));
  assert.ok(!success.elements["rrhh-employees-tbody"].textContent.includes("EXP-A"));
  assert.equal(success.elements["rrhh-total-count"].textContent, "1 Registros");

  const empty = makeRun({ status: "success", data: [] });
  await empty.run();
  assert.equal(empty.elements["rrhh-pending-leaves"].textContent, "0");
  assert.ok(empty.elements["rrhh-requests-list"].textContent.includes("No hay solicitudes registradas"));

  const error = makeRun({ status: "error", code: "NETWORK_ERROR", message: "service down" });
  await error.run();
  assert.equal(error.elements["rrhh-pending-leaves"].textContent, "—");
  assert.ok(error.elements["rrhh-requests-list"].textContent.includes("No fue posible cargar las solicitudes"));

  const incomplete = makeRun({ status: "success", data: { solicitudes: [] } });
  await incomplete.run();
  assert.equal(incomplete.elements["rrhh-pending-leaves"].textContent, "—");
  assert.ok(incomplete.elements["rrhh-requests-list"].textContent.includes("respuesta incompleta"));

  const outage = makeRun({ status: "success", data: [] }, true);
  await outage.run();
  assert.equal(outage.elements["rrhh-pending-leaves"].textContent, "—");
  assert.ok(outage.elements["rrhh-requests-list"].textContent.includes("No fue posible cargar las solicitudes"));
  console.log("PASS: HR dashboard DTO names, pending-state mapping, valid-empty/error/incomplete/outage states and safe DOM rendering");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
