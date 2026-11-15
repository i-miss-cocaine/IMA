"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/ui-common.js", "utf8");
assert.doesNotThrow(() => new Function(source));

const start = source.indexOf("window.getUIMetadataField = function(fieldKey)");
const end = source.indexOf("\nif (!document.getElementById(\"ima-permanent-field-help-styles\"))", start);
assert.ok(start >= 0 && end > start, "permanent field help functions must exist");

function Node(tag) {
  this.tagName = tag;
  this.attributes = {};
  this.children = [];
  this.parentNode = null;
  this.textContent = "";
  this.className = "";
  this.id = "";
  this.required = false;
  this.type = "text";
  this.labels = [];
}
Node.prototype.getAttribute = function(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; };
Node.prototype.setAttribute = function(name, value) { this.attributes[name] = String(value); };
Node.prototype.removeAttribute = function(name) { delete this.attributes[name]; };
Node.prototype.appendChild = function(child) { child.parentNode = this; this.children.push(child); return child; };
Node.prototype.insertBefore = function(child, before) {
  child.parentNode = this;
  const index = before ? this.children.indexOf(before) : -1;
  if (index < 0) this.children.push(child); else this.children.splice(index, 0, child);
  return child;
};
Node.prototype.removeChild = function(child) { const index = this.children.indexOf(child); if (index >= 0) this.children.splice(index, 1); child.parentNode = null; };
Node.prototype.querySelector = function(selector) {
  return this.children.find(child => selector === "[data-ui-required-marker]" && child.getAttribute("data-ui-required-marker") === "true") || null;
};
Node.prototype.querySelectorAll = function() { return []; };
Object.defineProperty(Node.prototype, "nextSibling", { get() {
  if (!this.parentNode) return null;
  const siblings = this.parentNode.children, index = siblings.indexOf(this);
  return siblings[index + 1] || null;
}});

const body = new Node("body"), head = new Node("head");
const target = new Node("input");
target.id = "required-field";
target.required = true;
target.setAttribute("data-ui-help-key", "matricula.identidad");
target.setAttribute("aria-describedby", "existing-description");
const label = new Node("label");
label.htmlFor = target.id;
target.labels = [label];
const parent = new Node("div");
parent.appendChild(target);
body.appendChild(parent);
const document = {
  body, head,
  createElement(tag) { return new Node(tag); },
  getElementById(id) {
    function find(node) {
      if (!node) return null;
      if (node.id === id) return node;
      for (const child of node.children) { const result = find(child); if (result) return result; }
      return null;
    }
    return find(body) || find(head);
  },
  querySelectorAll(selector) { return selector === "[data-ui-help-key]" ? [target] : []; }
};
const window = {
  __imaUIMetadataCache: null,
  __imaUIMetadataFallback: { fields: { "matricula.identidad": { help: "DNI: 0801-1990-12345 o 13 dígitos continuos." } } },
  __imaUIMetadataCounter: 0,
  initAccessibleTooltips() { return 0; }
};
const context = { window, document, Array, String, Object };
vm.runInNewContext(source.slice(start, end), context);

assert.equal(window.applyPermanentFieldHelp({ querySelectorAll(selector) { return selector === "[data-ui-help-key]" ? [target] : []; } }), 1);
const helpId = target.getAttribute("data-ui-help-id");
const help = document.getElementById(helpId);
assert.ok(help, "permanent help node must be inserted");
assert.equal(help.textContent, "DNI: 0801-1990-12345 o 13 dígitos continuos.");
assert.equal(target.getAttribute("aria-describedby"), "existing-description " + helpId);
assert.equal(label.children.filter(child => child.getAttribute("data-ui-required-marker") === "true").length, 1);

window.applyPermanentFieldHelp({ querySelectorAll() { return [target]; } });
assert.equal(parent.children.filter(child => child.getAttribute("data-ui-field-help") === "true").length, 1, "reapplication must not duplicate help");
assert.equal(label.children.filter(child => child.getAttribute("data-ui-required-marker") === "true").length, 1, "reapplication must not duplicate required marker");

assert.equal(window.setFieldValidationError(target, "DNI inválido."), true);
const errorId = target.getAttribute("data-ui-validation-error-id");
assert.equal(document.getElementById(errorId).textContent, "DNI inválido.");
assert.equal(document.getElementById(errorId).getAttribute("role"), "alert");
assert.equal(target.getAttribute("aria-invalid"), "true");
assert.ok(target.getAttribute("aria-describedby").includes(helpId), "validation error must preserve permanent help association");
assert.ok(target.getAttribute("aria-describedby").includes(errorId), "validation error must be associated with the field");

assert.equal(window.clearFieldValidationError(target), true);
assert.equal(document.getElementById(errorId), null);
assert.equal(target.getAttribute("aria-invalid"), null);
assert.equal(target.getAttribute("aria-describedby"), "existing-description " + helpId, "clearing errors must preserve other descriptions");
const confirmStart = source.indexOf("window.confirmCriticalOperation = function(options)");
const confirmEnd = source.indexOf("\n};", confirmStart) + 3;
assert.ok(confirmStart >= 0 && confirmEnd > confirmStart, "critical confirmation guard must exist");
let confirmationMessage = "";
const confirmContext = { window: { confirm(message) { confirmationMessage = message; return false; } } };
vm.runInNewContext(source.slice(confirmStart, confirmEnd), confirmContext);
assert.equal(confirmContext.window.confirmCriticalOperation({
  title: "Anulación de pago",
  details: "Se anulará el pago PAY-1.",
  consequence: "El saldo y la conciliación pueden cambiar.",
  irreversible: true
}), false, "cancellation must be returned to the caller");
assert.match(confirmationMessage, /El saldo y la conciliación pueden cambiar/);
assert.match(confirmationMessage, /no puede deshacerse/);

const teacherSource = fs.readFileSync("js/teacher.js", "utf8");
const scheduleStart = teacherSource.indexOf("window.deleteScheduleBlock = async function(horarioId)");
const scheduleEnd = teacherSource.indexOf("\n    };", scheduleStart) + 7;
assert.ok(scheduleStart >= 0 && scheduleEnd > scheduleStart, "schedule deletion handler must exist");
const scheduleHandler = teacherSource.slice(scheduleStart, scheduleEnd);
assert.ok(scheduleHandler.includes("window.confirmCriticalOperation"));
assert.ok(scheduleHandler.indexOf("if (!confirmed) return;") < scheduleHandler.indexOf("fetchApi('ACADEMIC', 'deleteClassSchedule'"),
  "cancelled schedule deletion must return before backend mutation");

const accountingSource = fs.readFileSync("js/accounting.js", "utf8");
const voidStart = accountingSource.indexOf("window.voidCharge = async function(payload)");
const voidEnd = accountingSource.indexOf("\n};", voidStart) + 3;
assert.ok(voidStart >= 0 && voidEnd > voidStart, "payment void handler must exist");
const voidHandler = accountingSource.slice(voidStart, voidEnd);
assert.ok(voidHandler.indexOf("if (!confirmAccountingSensitiveOperation_") < voidHandler.indexOf("window.callApi"),
  "cancelled payment void must return before backend mutation");
assert.ok(accountingSource.includes("if (window.confirmCriticalOperation) return window.confirmCriticalOperation(config)"),
  "accounting confirmations must use the independent critical guard when available");

console.log("PASS permanent field help: fallback, required marker, idempotency, ARIA association, inline errors and independent destructive-operation confirmation");
