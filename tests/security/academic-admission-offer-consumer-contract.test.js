"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("admision.html", "utf8");
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
const fn = extractAsyncFunction("fetchAcademicOffers");
function makeContext(fetchApi) {
  const year = { value: "2027", addEventListener() {} };
  const grade = { value: "", options: [], _html: "", set innerHTML(value) { this._html = value; if (value === "") this.options = []; }, get innerHTML() { return this._html; }, appendChild(option) { this.options.push(option); } };
  const context = { academicOffersRequestId: 0, document: { getElementById: id => id === "anolectivo" ? year : (id === "gradoSolicitado" ? grade : null), createElement: () => ({ value: "", textContent: "" }) }, window: { fetchApi }, console: { warn() {} }, String, Array, Set, Number, Error, Promise };
  vm.runInNewContext(fn + "\nthis.fetchOffers=fetchAcademicOffers;", context);
  return { context, year, grade };
}
(async function run() {
  const active = makeContext(async (service, action, payload) => ({ status: "success", data: [
    { ofertaId: "OFE-1", grado: "Décimo", estado: "Activa" },
    { ofertaId: "OFE-2", grado: "Décimo", estado: "Inactiva" },
    { ofertaId: "OFE-3", grado: "<script>alert(1)</script>", estado: "Activo" }
  ] }));
  active.grade.value = "Décimo";
  await active.context.fetchOffers();
  assert.deepEqual(JSON.parse(JSON.stringify(active.grade.options.map(o => o.value))), ["", "Décimo", "<script>alert(1)</script>"]);
  assert.equal(active.grade.value, "Décimo", "existing selection should survive when still active");
  assert.equal(source.includes("anoId: " + String.fromCharCode(39) + "2026" + String.fromCharCode(39)), false, "admission query must not hardcode a year");
  assert.ok(source.includes("addEventListener('change', fetchAcademicOffers)"));

  const empty = makeContext(async () => ({ status: "success", data: [{ ofertaId: "OFE-X", grado: "Décimo", estado: "Cerrada" }] }));
  await empty.context.fetchOffers();
  assert.equal(empty.grade.options.length, 1);
  assert.match(empty.grade.options[0].textContent, /No hay grados con oferta activa/);
  assert.equal(empty.grade.value, "");

  const invalid = makeContext(async () => ({ status: "error", data: [] }));
  await invalid.context.fetchOffers();
  assert.match(invalid.grade.options[0].textContent, /No se pudo cargar/);
  assert.equal(invalid.grade.value, "");

  const resolvers = [];
  const race = makeContext(() => new Promise(resolve => resolvers.push(resolve)));
  race.year.value = "2026";
  const first = race.context.fetchOffers();
  race.year.value = "2027";
  const second = race.context.fetchOffers();
  resolvers[1]({ status: "success", data: [{ ofertaId: "OFE-27", grado: "Undécimo", estado: "Activa" }] });
  await second;
  resolvers[0]({ status: "success", data: [{ ofertaId: "OFE-26", grado: "Décimo", estado: "Activa" }] });
  await first;
  assert.deepEqual(JSON.parse(JSON.stringify(race.grade.options.map(o => o.value))), ["", "Undécimo"], "late response must not overwrite newer year");
  console.log("Academic admission offer consumer contract: 4 scenarios passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
