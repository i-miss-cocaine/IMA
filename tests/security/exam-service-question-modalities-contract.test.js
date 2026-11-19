const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const context = { JSON, Set, Number, String, Array, Object, Error, Math };
vm.runInNewContext(["normalizeString", "parseExamQuestionJsonField_", "normalizeExamQuestionDefinition_"]
  .map(name => extractFunction(source, name)).join("\n") +
  "\nthis.normalize = normalizeExamQuestionDefinition_;", context);
const base = { textoPregunta: "Pregunta", areaCurricular: "Matemáticas", asignatura: "Álgebra",
  grado: "10", tema: "Funciones", puntos: 2, dificultad: "Media" };
const cases = [
  ["opcion_multiple", { A: "Uno", B: "Dos" }, "A"],
  ["verdadero_falso", { A: "Verdadero", B: "Falso" }, "Verdadero"],
  ["completacion", {}, "Lima"],
  ["termino_pareado", { concepts: ["A", "B"], definitions: ["1", "2"] }, { "0": 1, "1": 0 }],
  ["seleccion_multiple", { A: "Uno", B: "Dos" }, ["A", "B"]],
  ["respuesta_extensa", {}, ""],
  ["numerica", { tolerance: 0.5 }, 10],
  ["ordenamiento", { items: ["A", "B", "C"] }, ["B", "A", "C"]],
  ["adjunto", { acceptedMimeTypes: ["application/pdf", "image/png"], maxFiles: 2 }, ""]
];
for (const [type, opciones, respuestaCorrecta] of cases) {
  const normalized = context.normalize({ ...base, tipo: type, opciones, respuestaCorrecta });
  assert.equal(normalized.tipo, type, type + " type is preserved");
  assert.equal(normalized.puntosPredeterminados, 2, type + " points are retained");
  assert.equal(normalized.areaCurricular, "Matemáticas");
  assert.ok(normalized.opcionesJSON, type + " options are serialized");
}
assert.throws(() => context.normalize({ ...base, tipo: "tipo_desconocido", opciones: {}, respuestaCorrecta: "" }), /QUESTION_TYPE_INVALID/);
assert.throws(() => context.normalize({ ...base, tipo: "adjunto", opciones: {}, respuestaCorrecta: "" }), /QUESTION_ATTACHMENT_SCHEMA_INVALID/);
console.log("exam-service-question-modalities-contract: 9 modalities and schema failures PASS");
