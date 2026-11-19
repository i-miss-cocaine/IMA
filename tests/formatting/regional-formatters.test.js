"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createFormatters() {
  const config = fs.readFileSync("js/config.js", "utf8");
  const marker = "/**\n * Formateo regional centralizado.";
  const start = config.indexOf(marker);
  assert.notEqual(start, -1, "regional formatter IIFE exists in js/config.js");
  const window = {
    dispatchEvent() { return true; },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; }
  };
  vm.runInNewContext(config.slice(start), { window }, { filename: "regional-formatters.js" });
  assert.ok(window.IMARegionalFormatters, "formatter API is exported");
  return window.IMARegionalFormatters;
}

async function testFormatters() {
  const f = createFormatters();
  const defaults = f.getSettings();
  assert.equal(defaults.locale, "es-HN");
  assert.equal(defaults.currency, "HNL");
  assert.equal(defaults.timeZone, "America/Tegucigalpa");

  assert.match(f.formatCurrency(1234.56), /L/);
  assert.match(f.formatCurrency(1234.56), /1,234\.56/);
  assert.match(f.formatCurrency(-1234.56), /-/);
  assert.match(f.formatCurrency(0), /0\.00/);
  assert.equal(f.formatCurrency(null), "—");
  assert.equal(f.formatNumber(null), "—");
  assert.match(f.formatNumber(1234.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), /1,234\.50/);
  assert.match(f.formatNumber(-12.5), /-/);
  assert.equal(f.parseNumber("1,234.56"), 1234.56);
  assert.equal(f.parseNumber("L 1,234.56"), 1234.56);
  assert.equal(f.parseNumber(""), null);
  assert.equal(f.parseNumber(null), null);
  assert.equal(f.parseNumber("no-es-numero"), null);

  const dateOnly = f.formatDate("2026-11-17");
  assert.match(dateOnly, /17/);
  assert.match(dateOnly, /2026/);
  assert.equal(f.formatDateTime("2026-11-17"), dateOnly, "date-only values do not shift or acquire a time");
  const zoned = f.formatDateTime("2026-11-17T02:00:00Z");
  assert.match(zoned, /16/, "timestamp is rendered in institutional timezone");
  assert.match(zoned, /2026/);
  assert.match(f.formatTime("2026-11-17T02:00:00Z"), /8|20/);
  assert.match(f.formatClock("14:30"), /30/, "time-only strings respect the selected locale clock cycle");
  assert.equal(f.formatClock("25:00"), "—");
  assert.equal(f.formatDate("invalid-date"), "—");
  assert.equal(f.formatDateTime(null), "—");

  f.setSettings({ locale: "es-ES", currency: "EUR", timeZone: "Europe/Madrid", decimalesMoneda: 2 });
  assert.equal(f.getSettings().locale, "es-ES");
  assert.equal(f.getSettings().currency, "EUR");
  assert.equal(f.getSettings().timeZone, "Europe/Madrid");
  assert.equal(f.parseNumber("1.234,56"), 1234.56);
  assert.match(f.formatNumber(1234.56, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), /1\.234,56/);
  assert.match(f.formatCurrency(1234.56), /€/);

  f.setSettings({ locale: "not_a_locale", currency: "INVALID", timeZone: "Mars/Nowhere" });
  assert.equal(f.getSettings().locale, "es-HN", "invalid locale fails back to safe default");
  assert.equal(f.getSettings().currency, "HNL", "invalid currency fails back to safe default");
  assert.equal(f.getSettings().timeZone, "America/Tegucigalpa", "invalid timezone fails back to safe default");
  f.setSettings({ currency: "LPS" });
  assert.equal(f.getSettings().currency, "HNL", "local lempira aliases normalize to ISO HNL");
}

async function testRegionalSettingsLoader() {
  const api = fs.readFileSync("js/api.js", "utf8");
  const marker = "window.loadRegionalFormattingSettings = function() {";
  const start = api.indexOf(marker);
  assert.notEqual(start, -1, "regional settings loader exists in js/api.js");
  const end = api.indexOf("\n};", start);
  assert.notEqual(end, -1, "regional settings loader has a complete boundary");
  const loaderSource = api.slice(start, end + 3);

  const f = createFormatters();
  const window = { IMARegionalFormatters: f };
  let calls = 0;
  const sandbox = {
    window,
    localStorage: { getItem: key => key === "currentUser" ? JSON.stringify({ userId: "U-1", sessionToken: "SESSION-1" }) : null },
    sessionStorage: { getItem: () => null },
    fetchApi: (service, action, payload) => {
      calls++;
      assert.equal(service, "USER");
      assert.equal(action, "resolveHierarchicalConfiguration");
      assert.equal(payload.clave, "REGIONAL_SETTINGS");
      return Promise.resolve({ status: "success", valor: { locale: "en-US", currency: "USD", timeZone: "America/New_York" }, origenEfectivo: "INSTITUCIONAL", version: "2.0" });
    },
    Promise,
    JSON,
    Date
  };
  vm.runInNewContext(loaderSource, sandbox, { filename: "regional-settings-loader.js" });
  const loaded = await window.loadRegionalFormattingSettings();
  assert.equal(loaded.status, "success");
  assert.equal(loaded.settings.currency, "USD");
  assert.equal(loaded.source, "INSTITUCIONAL");
  assert.equal(calls, 1);
  assert.equal((await window.loadRegionalFormattingSettings()).status, "cached");
  assert.equal(calls, 1, "regional settings load once per page");

  const fallbackWindow = { IMARegionalFormatters: createFormatters() };
  const fallbackSandbox = {
    window: fallbackWindow,
    localStorage: { getItem: key => key === "currentUser" ? JSON.stringify({ userId: "U-2", sessionToken: "SESSION-2" }) : null },
    sessionStorage: { getItem: () => null },
    fetchApi: () => Promise.resolve({ status: "error", code: "CONFIGURATION_NOT_FOUND" }),
    Promise, JSON, Date
  };
  vm.runInNewContext(loaderSource, fallbackSandbox, { filename: "regional-settings-fallback.js" });
  const fallback = await fallbackWindow.loadRegionalFormattingSettings();
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.settings.currency, "HNL");

  const unauthWindow = { IMARegionalFormatters: createFormatters() };
  let unauthCalls = 0;
  const unauthSandbox = {
    window: unauthWindow,
    localStorage: { getItem: () => null },
    sessionStorage: { getItem: () => null },
    fetchApi: () => { unauthCalls++; return Promise.resolve({}); },
    Promise, JSON, Date
  };
  vm.runInNewContext(loaderSource, unauthSandbox, { filename: "regional-settings-unauthenticated.js" });
  assert.equal((await unauthWindow.loadRegionalFormattingSettings()).status, "unauthenticated");
  assert.equal(unauthCalls, 0);
  assert.match(api, /action !== "resolveHierarchicalConfiguration"[\s\S]*window\.loadRegionalFormattingSettings/);
}

function testConsumersAndInlineSyntax() {
  const consumerPaths = [
    "js/ui-common.js", "js/accounting.js", "js/secretary.js", "js/teacher.js",
    "js/student.js", "js/developer.js", "js/index-ui.js", "js/department-reference-admin.js",
    "js/destreza_teclado.js", "js/perifericos_juego.js", "js/quizpro.js", "js/webmaster_quiz_juego.js"
  ];
  for (const path of consumerPaths) {
    const source = fs.readFileSync(path, "utf8");
    assert.doesNotMatch(source, /toLocale(?:String|DateString|TimeString)\s*\(/, path + " must use the shared regional formatter");
  }
  const accounting = fs.readFileSync("js/accounting.js", "utf8");
  const student = fs.readFileSync("js/student.js", "utf8");
  const hr = fs.readFileSync("dashboard-recursos-humanos.html", "utf8");
  assert.match(accounting, /IMARegionalFormatters\.formatCurrency/);
  assert.match(student, /IMARegionalFormatters\.formatCurrency/);
  assert.match(hr, /IMARegionalFormatters\.formatCurrency/);
  assert.doesNotMatch(accounting, /toFixed\(2\)/);
  assert.doesNotMatch(student, /toFixed\(2\)/);
  assert.doesNotMatch(hr, /toLocale(?:String|DateString|TimeString)\s*\(/);
  assert.doesNotMatch(hr, /toFixed\(2\)/);

  const inlineScripts = [...hr.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(inlineScripts.length > 0, "HR dashboard has inline scripts to validate");
  inlineScripts.forEach((source, index) => new vm.Script(source, { filename: "dashboard-recursos-humanos.inline." + index + ".js" }));
}

(async function main() {
  await testFormatters();
  await testRegionalSettingsLoader();
  testConsumersAndInlineSyntax();
  console.log("REGIONAL FORMATTING CONTRACT PASS");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
