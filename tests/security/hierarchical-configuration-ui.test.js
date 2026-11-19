"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/ui-common.js", "utf8");
for (const token of [
  'id="tab-btn-hierarchical-settings"',
  'id="tab-panel-hierarchical-settings"',
  'window.loadHierarchicalConfigurationSettings_',
  'getHierarchicalConfigurationCatalog',
  'resolveHierarchicalConfiguration',
  'saveSystemConfiguration',
  'resetSystemConfigurationOverride',
  'hierarchical-config-department',
  'requestId !== window.__hierarchicalConfigurationLoadId',
  "hierarchyBtn.classList.remove('hidden')"
]) assert.ok(source.includes(token), "Missing hierarchical UI contract: " + token);
assert.match(source, /scopeSelect\.appendChild\(option\)/);
assert.match(source, /selectedScope === 'DEPARTAMENTAL' && !departmentId/);
assert.match(source, /resolved\.origenEfectivo === 'DEPARTAMENTAL'/);
assert.match(source, /effective\.textContent = JSON\.stringify/);
const start = source.indexOf("window.parseHierarchicalConfigurationInput_ = function");
const end = source.indexOf("\n};", start) + 3;
assert.ok(start >= 0 && end > start, "Value parser must be extractable");
const sandbox = { window: {}, Number, String, JSON };
vm.runInNewContext(source.slice(start, end).replace("window.parseHierarchicalConfigurationInput_", "window.parseValue"), sandbox);
const parse = sandbox.window.parseValue;
assert.equal(parse("true", "BOOLEANO"), true);
assert.equal(parse("false", "BOOL"), false);
assert.equal(parse("12.5", "NUMERO"), 12.5);
assert.equal(parse("7", "ENTERO"), 7);
assert.deepEqual(JSON.parse(JSON.stringify(parse('{"a":1}', "JSON"))), { a: 1 });
assert.deepEqual(JSON.parse(JSON.stringify(parse('[1,2]', "ARREGLO"))), [1, 2]);
assert.equal(parse("texto", "TEXTO"), "texto");
assert.throws(() => parse("maybe", "BOOLEANO"));
assert.throws(() => parse("1.5", "ENTERO"));
assert.throws(() => parse("{invalid", "JSON"));
console.log("Hierarchical configuration UI contract: PASS (static integration + 10 parser assertions)");
