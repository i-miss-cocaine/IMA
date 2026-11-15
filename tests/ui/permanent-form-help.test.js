"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = path => fs.readFileSync(path, "utf8");
const teacher = read("teacher-dashboard.html");
const student = read("student-dashboard.html");
const secretaryDashboard = read("dashboard-secretaria.html");
const accounting = read("js/accounting.js");
const academic = read("js/teacher.js");
const secretary = read("js/secretary.js");
const studentJs = read("js/student.js");

for (const [source, id, key] of [
  [teacher, "cashier-user-id", "identity.userId"],
  [teacher, "cashier-cargo-id", "cobros.cargoId"],
  [teacher, "cashier-monto", "cobros.monto"],
  [teacher, "cashier-ref", "cobros.referencia"],
  [teacher, "calificacion", "calificaciones.nota"],
  [teacher, "edit-puntaje", "calificaciones.nota"],
  [student, "voucher-monto", "cobros.monto"],
  [student, "voucher-referencia", "cobros.referencia"],
  [student, "voucher-file", "cobros.comprobante"],
  [student, "file-input", "tramites.adjunto"],
  [accounting, "enrollment-billing-year", "matricula.anoLectivo"],
  [accounting, "enrollment-billing-grade", "matricula.grado"],
  [accounting, "service-tariff-amount", "cobros.monto"],
  [academic, "grade-score-input", "calificaciones.nota"]
]) {
  const index = source.indexOf('id="' + id + '"');
  assert.ok(index >= 0, "field must exist: " + id);
  const tagStart = source.lastIndexOf("<input", index);
  const tagEnd = source.indexOf(">", index);
  const tag = source.slice(tagStart, tagEnd + 1);
  assert.ok(tag.includes('data-ui-help-key="' + key + '"'), "field metadata key mismatch: " + id);
}

for (const id of ["calificacion", "edit-puntaje"]) {
  const index = teacher.indexOf('id="' + id + '"');
  const tag = teacher.slice(teacher.lastIndexOf("<input", index), teacher.indexOf(">", index) + 1);
  assert.ok(tag.includes('min="0"') && tag.includes('max="100"') && tag.includes('step="0.01"'), "grade input range must match backend: " + id);
}
assert.ok(academic.includes("setAttribute('data-ui-help-key', 'matricula.identidad')"));
assert.ok(academic.includes("setAttribute('data-ui-help-key', 'matricula.fechaNacimiento')"));
const excelInputIndex = teacher.indexOf('id="excel-file-input"');
const excelInputTag = teacher.slice(teacher.lastIndexOf("<input", excelInputIndex), teacher.indexOf(">", excelInputIndex) + 1);
assert.ok(excelInputTag.includes('data-ui-help-key="importacion.xlsx"'), "XLSX import must expose permanent file constraints");
for (const id of ["evm-fecha-inicio", "evm-fecha-fin", "identity-search-fecha"]) {
  const index = secretaryDashboard.indexOf('id="' + id + '"');
  assert.ok(index >= 0, "secretary date field must exist: " + id);
  const tag = secretaryDashboard.slice(secretaryDashboard.lastIndexOf("<input", index), secretaryDashboard.indexOf(">", index) + 1);
  assert.ok(tag.includes('data-ui-help-key="fechas.calendario"'), "secretary date field must include calendar guidance: " + id);
  if (id === "evm-fecha-inicio") assert.ok(tag.includes(" required "), "event start date remains mandatory");
  if (id === "evm-fecha-fin") assert.ok(!tag.includes(" required "), "event end date remains optional");
}
assert.ok(secretaryDashboard.includes('id="identity-search-fecha" type="date" data-ui-help-key="fechas.calendario"'), "identity search date keeps its accessible calendar guidance");
assert.ok(secretary.includes('setAttribute("data-ui-help-key","identidad.busqueda")'));
assert.ok(!secretary.includes('setAttribute("data-ui-help-key","matricula.identidad")'), "identity search must not reuse DNI-only enrollment guidance");
assert.ok(secretary.includes('setAttribute("data-ui-help-key","matricula.fechaNacimiento")'));
assert.ok(studentJs.includes('input[name="identificacion"]'));
assert.ok(studentJs.includes('setAttribute("data-ui-help-key", "matricula.identidad")'));
assert.ok(teacher.includes('data-tooltip="Registra el abono del cargo seleccionado.'));
assert.ok(student.includes('data-tooltip="Cierra el formulario sin enviar el comprobante.'));
for (const source of [teacher, accounting, academic]) {
  const dateInputs = [...source.matchAll(/<input\b(?=[^>]*\btype=["']date["'])[^>]*>/g)].map(match => match[0]);
  assert.ok(dateInputs.length > 0);
  assert.ok(dateInputs.every(tag => tag.includes('data-ui-help-key="fechas.calendario"')), "every date input must include calendar guidance");
}
console.log("PASS permanent form help: enrollment, identity, billing, dates, attachments and grades");
