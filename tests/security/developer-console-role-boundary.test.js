"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/developer.js", "utf8");
const html = fs.readFileSync("developer-dashboard.html", "utf8");
function runConsoleGate(user) {
  let ready = null;
  const alerts = [];
  const localStorage = { getItem(key) { return key === "currentUser" && user ? JSON.stringify(user) : null; }, removeItem() {}, clear() {} };
  const sessionStorage = { getItem() { return null; }, removeItem() {}, clear() {} };
  const document = { addEventListener(event, callback) { if (event === "DOMContentLoaded") ready = callback; }, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  const window = { location: { href: "" } };
  vm.runInNewContext(source, { document, window, localStorage, sessionStorage, alert: message => alerts.push(String(message)), console: { error() {}, warn() {}, log() {} }, Promise, Array, Object, String, Number, Boolean, JSON, Date, Math, RegExp, Error, setTimeout, clearTimeout }, { timeout: 1000 });
  assert.equal(typeof ready, "function");
  ready();
  return { redirect: window.location.href, alerts };
}
for (const role of ["Administrador", "Director", "Coordinador", "Docente", "Estudiante", "Padre"]) {
  const result = runConsoleGate({ userId: "synthetic-user", rol: role, sessionToken: "synthetic-signed-session" });
  assert.equal(result.redirect, "index.html", role + " must not enter the developer console");
  assert.equal(result.alerts.length, 1);
}
assert.equal(runConsoleGate(null).redirect, "index.html", "anonymous browser must not enter the console");
assert.equal(runConsoleGate({ userId: "synthetic-user", rol: "Desarrollador" }).redirect, "index.html", "developer role without login session must be denied");
assert.match(source, /const isAllowed = !!currentUser && !!currentUser\.sessionToken && userRole === 'Desarrollador';/);
assert.doesNotMatch(source, /userRole === 'Administrador'|userRole === 'Director'/);
assert.match(html, /Plano técnico/);
assert.doesNotMatch(html, /Root Access|SuperAdmin/);
const backend = fs.readFileSync("backend/developer-service/Code.gs", "utf8");
assert.match(backend, /"Administrador": \[\]/);
assert.match(backend, /"Desarrollador": \[[^\]]*"registerServiceInstance"/);
console.log("Developer console role boundary contract: PASS.");
