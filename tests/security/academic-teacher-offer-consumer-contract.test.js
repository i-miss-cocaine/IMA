"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/teacher.js", "utf8");

function extractAsyncFunction(name) {
  const start = source.indexOf("async function " + name + "(");
  assert.notEqual(start, -1, "missing async function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "\"" || ch === "'" || ch === String.fromCharCode(96)) { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}

const helper = extractAsyncFunction("resolveActiveAcademicOfferId_");
function createContext(response, answer) {
  const calls = [], prompts = [];
  const context = {
    fetchApi: async (...args) => { calls.push(args); if (response instanceof Error) throw response; return response; },
    window: { prompt: (message, initial) => { prompts.push({ message, initial }); return answer === undefined ? "1" : answer; } },
    String, Number, Array, Object, Error, Promise
  };
  vm.runInNewContext(helper + "\nthis.resolve=resolveActiveAcademicOfferId_;", context);
  return { context, calls, prompts };
}

(async function run() {
  const one = createContext({ status: "success", data: [
    { ofertaId: "OFE-INACTIVE", estado: "Inactiva" },
    { ofertaId: "OFE-ACTIVE", estado: "Activa", asignaturaId: "ASIG-01", planId: "PLAN-01", anoId: "2026", periodoId: "P1" }
  ] });
  assert.equal(await one.context.resolve("Décimo", "A"), "OFE-ACTIVE");
  assert.deepEqual(JSON.parse(JSON.stringify(one.calls[0])), ["ACADEMIC", "getAcademicOffers", { grado: "Décimo", seccion: "A" }]);
  assert.equal(one.prompts.length, 0, "single active offer must not prompt");

  const multiple = createContext({ status: "success", data: [
    { ofertaId: "OFE-1", estado: "Activa", asignaturaId: "ASIG-01", planId: "PLAN-01" },
    { ofertaId: "OFE-2", estado: "Vigente", asignaturaId: "ASIG-02", planId: "PLAN-02" }
  ] }, "2");
  assert.equal(await multiple.context.resolve("Undécimo", "B"), "OFE-2");
  assert.equal(multiple.prompts.length, 1);
  assert.match(multiple.prompts[0].message, /ASIG-02/);

  const none = createContext({ status: "success", data: [{ ofertaId: "OFE-X", estado: "Inactiva" }] });
  await assert.rejects(none.context.resolve("Décimo", "A"), /No existe una oferta académica activa/);

  const invalid = createContext({ status: "error", data: [] });
  await assert.rejects(invalid.context.resolve("Décimo", "A"), /No se pudo consultar el catálogo/);

  const cancelled = createContext({ status: "success", data: [
    { ofertaId: "OFE-1", estado: "Activa" }, { ofertaId: "OFE-2", estado: "Activa" }
  ] }, null);
  await assert.rejects(cancelled.context.resolve("Décimo", "A"), /cancelada/);

  const badSelection = createContext({ status: "success", data: [
    { ofertaId: "OFE-1", estado: "Activa" }, { ofertaId: "OFE-2", estado: "Activa" }
  ] }, "9");
  await assert.rejects(badSelection.context.resolve("Décimo", "A"), /no es válida/);

  const unavailable = createContext(new Error("network down"));
  await assert.rejects(unavailable.context.resolve("Décimo", "A"), /network down/);

  assert.equal(source.includes("ASIG-GENERAL"), false, "placeholder subject IDs must not be used to fabricate offers");
  assert.equal(source.includes(["OFE-", "${cleanGrado"].join("")), false, "synthetic offer IDs must not be used when lookup fails");
  console.log("Academic teacher offer consumer contract: 7 scenarios passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
