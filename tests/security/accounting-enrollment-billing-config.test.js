const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === String.fromCharCode(96)) { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function: " + name);
}
const headers = ["ConfiguracionID","InstitutionID","AnoLectivo","NivelGrado","ModoGeneracion","ConceptoMatriculaID","Estado","ActualizadoPor","ActualizadoEn"];
const tariffHeaders = ["TarifaID","AnoLectivo","NivelGrado","ConceptoID","MontoTotal","CuotasNum","VencimientoJSON","Estado","Observaciones"];
const conceptHeaders = ["ConceptoID","Fecha","NombreConcepto","MontoBase","AplicaAGrado","PeriodoVigencia","Estado","Observaciones"];
function makeSheet(rows) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() { const self = this; return { getValues: () => self.rows.map(row => row.slice()) }; },
    appendRow(row) { this.rows.push(row.slice()); },
    getRange(row, col, numRows, numCols) {
      const self = this;
      return { setValues(values) { values.forEach((value, index) => self.rows[row - 1 + index].splice(col - 1, numCols, ...value)); } };
    }
  };
}
function harness(options = {}) {
  const sheets = {};
  if (options.configRows) sheets.ConfiguracionCargosMatricula = makeSheet(options.configRows);
  if (options.tariffRows) sheets.TarifasPlanPago = makeSheet(options.tariffRows);
  if (options.conceptRows) sheets.ConceptosCobro = makeSheet(options.conceptRows);
  const ss = { getSheetByName: name => sheets[name] || null, insertSheet(name) { sheets[name] = makeSheet([]); return sheets[name]; } };
  let lockAvailable = options.lockAvailable !== false, releases = 0, attempts = 0;
  const actor = options.actor || { authorized:true, userId:"U-DIRECTOR", role:"Director" };
  const context = {
    SPREADSHEET_ID:"TEST", Date, Math, JSON, Number, String, isFinite,
    ENROLLMENT_BILLING_CONFIG_HEADERS_:headers,
    getVerifiedAccountingIdentity_:() => actor,
    PropertiesService:{getScriptProperties:() => ({getProperty:key => key === "IMA_INSTITUTION_ID" ? (options.institutionId === undefined ? "INST-1" : options.institutionId) : ""})},
    SpreadsheetApp:{openById:id => {assert.equal(id,"TEST");return ss;}},
    LockService:{getScriptLock:() => ({tryLock:() => {attempts++;return lockAvailable;},releaseLock:() => {releases++;}})}
  };
  const funcs = ["ensureEnrollmentBillingConfigSheet_","getEnrollmentBillingConfiguration","saveEnrollmentBillingConfiguration"].map(extractFunction);
  vm.runInNewContext(funcs.join("\n") + "\nthis.getConfig=getEnrollmentBillingConfiguration;this.saveConfig=saveEnrollmentBillingConfiguration;", context);
  return {context,sheets,stats:() => ({releases,attempts})};
}
const tariffs = [tariffHeaders,
  ["TR-1","2027","Séptimo","CPT-MAT",3000,1,'["2027-01-10"]',"Activa",""],
  ["TR-2","2027","Séptimo","CPT-TUI",12000,10,"[]","Activa",""],
  ["TR-3","2027","Octavo","CPT-MAT",3100,1,"[]","Activa",""],
  ["TR-4","2027","Séptimo","CPT-OLD",1000,1,"[]","Inactiva",""]];
const concepts = [conceptHeaders,["CPT-MAT","","Matrícula",3000,"Séptimo","Anual","Activo",""],["CPT-TUI","","Colegiatura",12000,"Séptimo","Anual","Activo",""]];

{
  const h=harness({tariffRows:tariffs,conceptRows:concepts});
  const result=h.context.getConfig({anoLectivo:"2027",nivelGrado:"Séptimo"});
  assert.equal(result.status,"success");
  assert.equal(result.config,null,"unconfigured configuration must not imply automatic billing");
  assert.equal(result.tarifas.length,2,"only active tariffs for exact year and grade are returned");
  assert.equal(result.tarifas[0].conceptoNombre,"Matrícula");
}
{
  const h=harness({tariffRows:tariffs,conceptRows:concepts});
  const saved=h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MATRICULA_ONLY",conceptoMatriculaId:"CPT-MAT",actualizadoPor:"FORGED"});
  assert.equal(saved.status,"success");
  const row=h.sheets.ConfiguracionCargosMatricula.rows[1];
  assert.equal(row[1],"INST-1");
  assert.equal(row[7],"U-DIRECTOR","audit actor is derived from verified identity");
  assert.equal(row[5],"CPT-MAT");
  const updated=h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MANUAL"});
  assert.equal(updated.configuracionId,saved.configuracionId,"same grade/year updates one row");
  assert.equal(h.sheets.ConfiguracionCargosMatricula.rows.length,2);
  assert.equal(h.sheets.ConfiguracionCargosMatricula.rows[1][5],"");
  assert.equal(h.stats().releases,2);
}
{
  const h=harness({tariffRows:tariffs,conceptRows:concepts});
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MATRICULA_ONLY",conceptoMatriculaId:"MISSING"}).code,"ENROLLMENT_TARIFF_NOT_CONFIGURED");
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"ALL_ACTIVE_TARIFFS"}).status,"success");
  assert.equal(h.context.saveConfig({anoLectivo:"2028",nivelGrado:"Séptimo",modoGeneracion:"ALL_ACTIVE_TARIFFS"}).code,"ACTIVE_PAYMENT_TARIFFS_REQUIRED");
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"UNKNOWN"}).code,"ENROLLMENT_BILLING_MODE_INVALID");
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MATRICULA_ONLY"}).code,"ENROLLMENT_CONCEPT_REQUIRED");
}
{
  const duplicate=[headers,["C1","INST-1","2027","Séptimo","MANUAL","","ACTIVE","U1",new Date()],["C2","INST-1","2027","Séptimo","MANUAL","","ACTIVE","U2",new Date()]];
  const h=harness({configRows:duplicate,tariffRows:tariffs});
  assert.equal(h.context.getConfig({anoLectivo:"2027",nivelGrado:"Séptimo"}).code,"ENROLLMENT_BILLING_CONFIG_AMBIGUOUS");
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MANUAL"}).code,"ENROLLMENT_BILLING_CONFIG_AMBIGUOUS");
}
{
  const h=harness({tariffRows:tariffs,lockAvailable:false});
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MANUAL"}).code,"LOCK_TIMEOUT");
  assert.equal(h.sheets.ConfiguracionCargosMatricula,undefined,"lock contention performs no write");
  assert.equal(h.stats().releases,0);
}
{
  const h=harness({tariffRows:tariffs,institutionId:""});
  assert.equal(h.context.getConfig({anoLectivo:"2027",nivelGrado:"Séptimo"}).code,"IDENTITY_CONFIGURATION_REQUIRED");
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MANUAL"}).code,"IDENTITY_CONFIGURATION_REQUIRED");
  const unauth=harness({actor:{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"}});
  assert.equal(unauth.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MANUAL"}).code,"VERIFIED_IDENTITY_REQUIRED");
}
{
  const h=harness({configRows:[["invalid","schema"]],tariffRows:tariffs});
  assert.equal(h.context.getConfig({anoLectivo:"2027",nivelGrado:"Séptimo"}).code,"ENROLLMENT_BILLING_CONFIG_SCHEMA_MISMATCH");
  assert.equal(h.context.saveConfig({anoLectivo:"2027",nivelGrado:"Séptimo",modoGeneracion:"MANUAL"}).code,"ENROLLMENT_BILLING_CONFIG_SCHEMA_MISMATCH");
}
const dashboard=fs.readFileSync(path.join(__dirname,"../../dashboard-contabilidad.html"),"utf8");
const client=fs.readFileSync(path.join(__dirname,"../../js/accounting.js"),"utf8");
assert.ok(dashboard.includes("switchTab('matricula')"));
assert.ok(client.includes("getEnrollmentBillingConfiguration")&&client.includes("saveEnrollmentBillingConfiguration"));
assert.ok(client.includes("ALL_ACTIVE_TARIFFS")&&client.includes("MATRICULA_ONLY")&&client.includes("MANUAL"));
console.log("ACCOUNTING enrollment billing configuration contract PASS.");
