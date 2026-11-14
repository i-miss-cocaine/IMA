const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
const uiSource = fs.readFileSync(path.join(__dirname, "../../js/ui-common.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(__dirname, "../../app/html/dashboards/dynamic-dashboard.html"), "utf8");
new vm.Script(source);

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = null; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c.charCodeAt(0) === 96) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}

function makeSheet(rows) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() { const sheet = this; return { getValues: () => sheet.rows.map(row => row.slice()) }; },
    appendRow(row) { this.rows.push(row.slice()); },
    getLastRow() { return this.rows.length; },
    getRange(row, column, numRows, numColumns) {
      const sheet = this;
      return {
        getValues() {
          const result = [];
          for (let r = 0; r < (numRows || 1); r++) {
            const line = [];
            for (let c = 0; c < (numColumns || 1); c++) line.push((sheet.rows[row - 1 + r] || [])[column - 1 + c] || "");
            result.push(line);
          }
          return result;
        },
        setValue(value) {
          while (sheet.rows.length < row) sheet.rows.push([]);
          sheet.rows[row - 1][column - 1] = value;
        },
        setValues(values) {
          values.forEach((line, r) => {
            while (sheet.rows.length < row + r) sheet.rows.push([]);
            sheet.rows[row - 1 + r] = line.slice();
          });
        }
      };
    }
  };
}

const sheets = {
  CafeteriaMenu: makeSheet([["PlatoID","Fecha","Nombre","Precio","Stock"], ["CAF-1", new Date(), "Almuerzo", 50, 20]]),
  TiendaProductos: makeSheet([["ProductoID","Fecha","Categoria","SKU","Nombre","Precio","Stock","Unidad","Estado"], ["TIE-1", new Date(), "Útiles", "SKU-1", "Cuaderno", 25, 10, "Unidad", "Activo"]]),
  ActividadesExtracurriculares: makeSheet([["ExtracurricularID","AnoID","Nombre","Categoria"], ["EXT-1","2027","Robótica","Tecnología"]])
};
const ss = {
  getSheetByName(name) { return sheets[name] || null; },
  insertSheet(name) { sheets[name] = makeSheet([]); return sheets[name]; }
};
let uuid = 0, lockBusy = false, released = true;
const context = {
  SpreadsheetApp: { openById: () => ss },
  LockService: { getScriptLock: () => ({
    waitLock() { if (lockBusy) throw new Error("LOCK_BUSY"); released = false; },
    releaseLock() { released = true; }
  }) },
  Utilities: { getUuid: () => "UUID-" + (++uuid) },
  SPREADSHEET_ID: "TEST",
  Date, Math, JSON, Number, String, Object, Array, Set, isFinite
};
const names = [
  "ensureInstitutionalComplementaryServiceCatalog_", "institutionalServiceRoleKey_",
  "institutionalServiceIsActive_", "getInstitutionalComplementaryServices",
  "saveInstitutionalComplementaryService", "setInstitutionalComplementaryServiceStatus"
];
vm.runInNewContext(names.map(extract).join("\n"), context);

assert.equal(context.institutionalServiceIsActive_(ss, "TIENDA", "2027"), true,
  "legacy services remain enabled when no catalog override exists");
const saved = context.saveInstitutionalComplementaryService({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1",
  servicioClave: "TUTORIAS", nombre: "Tutorías académicas", categoria: "ACADEMICO",
  modalidad: "RECURRENTE", cupoMaximo: 20, tarifa: 350, anoLectivo: "2027",
  responsablesJSON: ["DOC-1", "DOC-2"],
  reglasAutorizacionFamiliarJSON: { requiereAutorizacionTutor: true, requierePIN: false },
  fechaInicio: "2027-01-15", fechaFin: "2027-11-30", estado: "ACTIVO"
});
assert.equal(saved.status, "success");
assert.equal(context.institutionalServiceIsActive_(ss, "TUTORIAS", "2027"), true);
const current = context.getInstitutionalComplementaryServices({ _verifiedRole: "Director", anoLectivo: "2027" });
assert.equal(current.services.length, 1);
assert.equal(current.services[0].servicioClave, "TUTORIAS");
assert.equal(current.legacyServices.length, 3);
assert.equal(current.legacyServices.find(item => item.servicioClave === "CAFETERIA").totalElementos, 1);
assert.equal(current.legacyServices.find(item => item.servicioClave === "TIENDA").totalElementos, 1);
assert.equal(current.legacyServices.find(item => item.servicioClave === "ACTIVIDADES_EXTRACURRICULARES").totalElementos, 1);

const updated = context.saveInstitutionalComplementaryService({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1",
  servicioClave: "TUTORIAS", nombre: "Tutorías académicas", categoria: "ACADEMICO",
  modalidad: "RECURRENTE", cupoMaximo: 25, tarifa: 400, anoLectivo: "2027",
  responsablesJSON: ["DOC-1"], reglasAutorizacionFamiliarJSON: { requiereAutorizacionTutor: true },
  estado: "ACTIVO"
});
assert.equal(updated.actualizado, true);
assert.equal(sheets.ServiciosCatalogoInstitucional.rows.length, 2, "same service and school year must upsert");
context.saveInstitutionalComplementaryService({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1",
  servicioClave: "TUTORIAS", nombre: "Tutorías académicas", categoria: "ACADEMICO",
  modalidad: "RECURRENTE", cupoMaximo: 25, tarifa: 400, anoLectivo: "2028",
  responsablesJSON: [], reglasAutorizacionFamiliarJSON: {}, estado: "ACTIVO"
});
assert.equal(sheets.ServiciosCatalogoInstitucional.rows.length, 3, "new school year must preserve prior history");
assert.equal(context.getInstitutionalComplementaryServices({
  _verifiedRole: "Director", anoLectivo: "2027", incluirHistorico: true
}).services.length, 2);

context.setInstitutionalComplementaryServiceStatus({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1", servicioClave: "TIENDA", anoLectivo: "2027", estado: "PAUSADO"
});
assert.equal(context.institutionalServiceIsActive_(ss, "TIENDA", "2027"), false);
assert.equal(context.institutionalServiceIsActive_(ss, "TIENDA", "2028"), true,
  "pausing a service in one school year must not affect another year");
assert.equal(context.getInstitutionalComplementaryServices({
  _verifiedRole: "Director", anoLectivo: "2027"
}).legacyServices.find(item => item.servicioClave === "TIENDA").estado, "PAUSADO");
context.setInstitutionalComplementaryServiceStatus({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1", servicioClave: "TIENDA", anoLectivo: "2027", estado: "ACTIVO"
});
assert.equal(context.institutionalServiceIsActive_(ss, "TIENDA", "2027"), true);

assert.throws(() => context.saveInstitutionalComplementaryService({
  _verifiedRole: "Padre", _verifiedUserId: "G1", servicioClave: "NO", nombre: "No", categoria: "OTROS", modalidad: "POR_EVENTO"
}), /INSTITUTIONAL_SERVICE_CONFIG_ROLE_NOT_ALLOWED/);
assert.throws(() => context.saveInstitutionalComplementaryService({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1", servicioClave: "BAD", nombre: "Bad", categoria: "OTROS", modalidad: "INVALIDA"
}), /INSTITUTIONAL_SERVICE_MODALITY_INVALID/);
assert.throws(() => context.saveInstitutionalComplementaryService({
  _verifiedRole: "Director", _verifiedUserId: "DIR-1", servicioClave: "BAD", nombre: "Bad", categoria: "OTROS", modalidad: "POR_EVENTO", cupoMaximo: -1
}), /INSTITUTIONAL_SERVICE_CAPACITY_INVALID/);
assert.throws(() => context.getInstitutionalComplementaryServices({
  _verifiedRole: "Padre", incluirHistorico: true
}), /INSTITUTIONAL_SERVICE_HISTORY_ROLE_NOT_ALLOWED/);
assert.match(source, /case "getInstitutionalComplementaryServices"/);
assert.match(source, /case "saveInstitutionalComplementaryService"/);
assert.match(source, /institutionalServiceIsActive_\(ss, "TIENDA"/);
assert.match(source, /institutionalServiceIsActive_\(ss, "CAFETERIA"/);
assert.match(uiSource, /loadInstitutionalComplementaryServicesAdmin/);
assert.match(dashboardSource, /service-catalog-admin-panel/);
assert.ok(released);
console.log("ACCOUNTING institutional complementary services catalog contract PASS.");
