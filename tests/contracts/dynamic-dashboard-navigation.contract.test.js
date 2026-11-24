"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const backend = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
const uiCommon = fs.readFileSync(path.join(root, "js/ui-common.js"), "utf8");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Falta la función " + name);
  const next = /\nfunction [A-Za-z0-9_$]+\s*\(/g;
  next.lastIndex = start + 10;
  const match = next.exec(source);
  const assignmentBoundary = name === "getDynamicDashboardModuleRoute" ?
    source.indexOf("\nwindow.loadDynamicDashboard", start) : -1;
  const end = assignmentBoundary >= 0 && (!match || assignmentBoundary < match.index) ?
    assignmentBoundary : (match ? match.index : source.length);
  return source.slice(start, end);
}

function makeNode(tagName) {
  const node = {
    tagName: String(tagName).toLowerCase(),
    children: [],
    attributes: {},
    className: "",
    textContent: "",
    href: "",
    setAttribute(name, value) { this.attributes[name] = String(value); },
    appendChild(child) { this.children.push(child); return child; },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index !== -1) this.children.splice(index, 1);
      return child;
    }
  };
  Object.defineProperty(node, "firstChild", { get() { return this.children[0] || null; } });
  return node;
}

test("getUserDynamicDashboardConfig lee el rol de la columna real de Usuarios", () => {
  const users = {
    getDataRange() {
      return { getValues: () => [
        ["UserID", "Nombre", "Correo", "CampoAuxiliar", "Telefono", "Estado", "Rol"],
        ["EMP-1", "Empleado", "empleado@example.test", "Administrador", "", "Activa", "Docente"]
      ] };
    }
  };
  const spreadsheet = { getSheetByName: name => name === "Usuarios" ? users : null };
  const context = {
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => spreadsheet },
    getOrCreateSheet: (ss, name) => ss.getSheetByName(name),
    Logger: { log() {} }
  };
  vm.runInNewContext(extractFunction(backend, "getUserDynamicDashboardConfig"), context);
  const result = context.getUserDynamicDashboardConfig({ userId: "EMP-1" });
  assert.equal(result.status, "success");
  assert.equal(result.rolPrincipal, "Docente");
  assert.deepEqual(Array.from(result.modulosAutorizados), [
    "mod_mis_clases", "mod_aula_virtual_tareas", "mod_mis_horarios", "mod_libro_calificaciones"
  ]);
});

test("los roles Docente y Secretaría normalizan al catálogo de módulos correspondiente", () => {
  const makeContext = role => {
    const users = { getDataRange: () => ({ getValues: () => [["UserID"], ["EMP-1", "", "", "", "", "", role]] }) };
    const spreadsheet = { getSheetByName: () => users };
    const context = {
      SPREADSHEET_ID: "TEST",
      SpreadsheetApp: { openById: () => spreadsheet },
      getOrCreateSheet: (ss, name) => users,
      Logger: { log() {} }
    };
    vm.runInNewContext(extractFunction(backend, "getUserDynamicDashboardConfig"), context);
    return context.getUserDynamicDashboardConfig({ userId: "EMP-1" });
  };
  assert.ok(makeContext("Docente").modulosAutorizados.includes("mod_aula_virtual_tareas"));
  assert.ok(makeContext("Secretaria").modulosAutorizados.includes("mod_matriculas"));
});

test("cada módulo devuelto por el catálogo tiene una ruta a un dashboard existente", () => {
  const context = {};
  vm.runInNewContext(extractFunction(uiCommon, "getDynamicDashboardModuleRoute"), context);
  const modules = [
    "mod_gestion_usuarios", "mod_planificacion_horarios", "mod_finanzas", "mod_auditoria_sistema",
    "mod_resumen_institucional", "mod_supervision_docente", "mod_reportes",
    "mod_expedientes_estudiantiles", "mod_matriculas", "mod_comunicaciones",
    "mod_coordinacion_academica", "mod_supervision_silabos", "mod_horarios_area",
    "mod_asistencia_docente", "mod_mis_clases", "mod_aula_virtual_tareas", "mod_mis_horarios",
    "mod_libro_calificaciones", "mod_mi_horario_estudiante", "mod_mis_tareas_entregas",
    "mod_mis_calificaciones", "mod_mi_asistencia"
  ];
  for (const moduleId of modules) {
    const route = context.getDynamicDashboardModuleRoute(moduleId, "Docente");
    assert.ok(route, "Falta ruta para " + moduleId);
    const target = path.resolve(root, "app/html/dashboards", route);
    assert.ok(target.startsWith(root + path.sep), "La ruta debe permanecer dentro del repositorio");
    assert.ok(fs.existsSync(target), "El destino no existe para " + moduleId + ": " + route);
  }
  assert.equal(context.getDynamicDashboardModuleRoute("mod_aula_virtual_tareas", "Estudiante"), "../../../student-dashboard.html");
  assert.equal(context.getDynamicDashboardModuleRoute("mod_aula_virtual_tareas", "Docente"), "../../../teacher-dashboard.html");
  assert.equal(context.getDynamicDashboardModuleRoute("mod_no_registrado", "Docente"), "");
});

test("el dashboard dinámico renderiza enlaces navegables en las tarjetas", async () => {
  const start = uiCommon.indexOf("window.loadDynamicDashboard = async function()");
  assert.notEqual(start, -1);
  const end = uiCommon.indexOf("\n};", start);
  assert.ok(end > start);
  const loader = uiCommon.slice(start, end + 3);
  const grid = makeNode("div");
  const title = makeNode("h1");
  const badge = makeNode("span");
  const elements = {
    "dynamic-dashboard-modules-grid": grid,
    "dynamic-dashboard-title": title,
    "dynamic-user-role-badge": badge
  };
  const context = {
    document: {
      getElementById: id => elements[id] || null,
      createElement: tag => makeNode(tag)
    },
    localStorage: { getItem: () => JSON.stringify({ userId: "EMP-1", authRole: "Docente" }) },
    sessionStorage: { getItem: () => null },
    fetchApi: async () => ({
      status: "success",
      rolPrincipal: "Docente",
      modulosAutorizados: ["mod_mis_clases"],
      configuracionVisual: { tituloDashboard: "Dashboard - Docente" }
    }),
    window: {},
    console,
    setTimeout
  };
  vm.runInNewContext(extractFunction(uiCommon, "getDynamicDashboardModuleRoute") + "\n" + loader, context);
  await context.window.loadDynamicDashboard();
  assert.equal(grid.children.length, 1);
  const footer = grid.children[0].children[1];
  const link = footer.children.find(child => child.tagName === "a");
  assert.ok(link, "La tarjeta debe contener un enlace real");
  assert.equal(link.href, "../../../teacher-dashboard.html");
  assert.equal(link.textContent, "Acceder");
  assert.equal(link.attributes["aria-label"], "Acceder a mis clases");
});
