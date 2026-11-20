"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const backend = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
const source = fs.readFileSync("js/secretary.js", "utf8");

function extractAsyncAssignment(name) {
  const marker = "window." + name + " = async function(filters) {";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "missing " + marker);
  const fnStart = source.indexOf("async function", start);
  const open = source.indexOf("{", fnStart);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === String.fromCharCode(96)) { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(fnStart, i + 1);
  }
  throw new Error("unterminated " + name);
}

function element() {
  return {
    children: [], className: "", _html: "", _text: "",
    set innerHTML(value) { this._html = value; if (value === "") this.children = []; },
    get innerHTML() { return this._html; },
    set textContent(value) { this._text = String(value); this.children = []; },
    get textContent() { return this._text; },
    appendChild(child) { this.children.push(child); }
  };
}
(async function run() {
  const container = element();
  const calls = [];
  const document = { getElementById: id => id === "academic-analytics-content" ? container : null, createElement: () => element() };
  const window = { fetchApi: async (...args) => {
    calls.push(args);
    return { status:"success", data:{ metrics:{
      promedioConsolidado:88.5,totalEvaluaciones:20,evaluadasCount:17,notasPendientes:3,alertasAcompanamiento:2,
      distribucion:{ excelente:5,bueno:7,satisfactorio:3,necesitaMejora:2 }
    } } };
  } };
  const fn = extractAsyncAssignment("loadAcademicAnalyticsData");
  vm.runInNewContext("window.loadAcademicAnalyticsData = " + fn + ";", { window, document, console:{error(){}}, String, Number, Array, Promise, Error });
  await window.loadAcademicAnalyticsData();
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), ["ACADEMIC","getCurricularAnalyticsReport",{}]);
  await window.loadAcademicAnalyticsData({ area:"AREA-MAT", asignatura:"ASIG-MAT", grado:"10", periodo:"PER-1", programa:"PROG-COMUN", anoId:"ANO-2026", seccion:"A" });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1])), ["ACADEMIC","getCurricularAnalyticsReport",{
    area:"AREA-MAT",asignatura:"ASIG-MAT",grado:"10",periodo:"PER-1",programa:"PROG-COMUN",anoId:"ANO-2026",seccion:"A"
  }]);
  const rendered = JSON.stringify(container.children);
  for (const expected of ["88.50%","17","3","2","Excelente (90–100)","5","Necesita mejora (<70)","2"]) assert.ok(rendered.includes(expected), "missing rendered metric " + expected);
  const pending = [];
  window.fetchApi = (...args) => { calls.push(args); return new Promise(resolve => pending.push(resolve)); };
  const olderRequest = window.loadAcademicAnalyticsData({ grado:"10" });
  const newerRequest = window.loadAcademicAnalyticsData({ grado:"11" });
  const metricResponse = average => ({ status:"success", data:{ metrics:{
    promedioConsolidado:average,totalEvaluaciones:1,evaluadasCount:1,notasPendientes:0,alertasAcompanamiento:0,
    distribucion:{ excelente:1,bueno:0,satisfactorio:0,necesitaMejora:0 }
  } } });
  pending[1](metricResponse(77.25));
  await newerRequest;
  const newestRendered = JSON.stringify(container.children);
  pending[0](metricResponse(12));
  await olderRequest;
  assert.equal(JSON.stringify(container.children), newestRendered, "late older analytics response must not replace the latest filter result");
  assert.ok(newestRendered.includes("77.25%"));
  assert.equal(newestRendered.includes("12.00%"), false);

  const roleStart = backend.indexOf('"Secretaría": [');
  const roleEnd = backend.indexOf('"Secretaria": [', roleStart);
  const secretariaStart = roleEnd;
  const secretariaEnd = backend.indexOf('"Coordinador":', secretariaStart);
  assert.ok(backend.slice(roleStart, roleEnd).includes('"getCurricularAnalyticsReport"'), "Secretaría must have read permission");
  assert.ok(backend.slice(secretariaStart, secretariaEnd).includes('"getCurricularAnalyticsReport"'), "Secretaria must have read permission");
  assert.match(source, /metrics\.promedioConsolidado/);
  assert.match(source, /metrics\.evaluadasCount/);
  assert.match(source, /metrics\.notasPendientes/);
  assert.match(source, /metrics\.alertasAcompanamiento/);
  assert.equal(source.includes("d.promedioGeneral"), false, "legacy report shape must not be consumed");
  console.log("Academic curricular analytics report consumer contract: metrics and Secretary RBAC PASS.");
})().catch(error => { console.error(error); process.exitCode = 1; });
