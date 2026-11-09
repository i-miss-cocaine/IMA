const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),up=path.join(root,"backend/user-service/Code.gs"),ap=path.join(root,"backend/accounting-service/Code.gs");
const user=fs.readFileSync(up,"utf8"),accounting=fs.readFileSync(ap,"utf8"),academic=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8"),method=fs.readFileSync(path.join(root,"METODOLOGIA_DESARROLLO.md"),"utf8"),persistence=fs.readFileSync(path.join(root,"js/persistence.js"),"utf8"),api=fs.readFileSync(path.join(root,"js/api.js"),"utf8");
new vm.Script(user,{filename:up}); new vm.Script(accounting,{filename:ap}); new vm.Script(academic,{filename:"backend/academic-service/Code.gs"}); new vm.Script(persistence,{filename:"js/persistence.js"}); new vm.Script(api,{filename:"js/api.js"});
const headers=["idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataforma","institucionId","hashRegistroOrigen","fechaMigracion","versionMapeo","estadoCorrespondencia","metodoCoincidencia","nivelConfianza","migradoPor"];
for(const h of headers) assert.ok(user.includes('"'+h+'"'),"header "+h);
for(const fn of ["registerLegacyIdentifierMapping","resolveInternalIdFromLegacy","resolveLegacyIdFromInternal","resolveUserByLegacyId","reviewLegacyIdentifierMapping","getIdentityDecisionHistory"]) {assert.ok(user.includes("function "+fn+"("));assert.ok(user.includes('case "'+fn+'"'));}
assert.ok(user.includes('const IDENTITY_MANAGER_ROLES_ = ["Administrador", "Secretaría"]'));
assert.ok(user.includes('getProperty("IMA_INSTITUTION_ID")'));assert.ok(user.includes("LockService.getScriptLock()"));
assert.ok(user.includes("function ensureIdentityMappingSheet_()"));
assert.ok(user.includes("IDENTITY_MAPPING_NOT_INITIALIZED"));
assert.ok(user.includes("function identityTargetExists_"));
assert.ok(user.includes("const IDENTITY_TARGET_SCHEMAS_ = {"));
assert.ok(user.includes("JSON.stringify(headers) !== JSON.stringify(target.headers)"),"complete target schema must be validated");
const canonicalSchemas=[
  ['["PersonaID", "Nombres", "Apellidos", "Identificacion", "EmailContacto", "TelefonoContacto", "EstadoPersona", "FechaCreacion", "FechaActualizacion", "Observaciones"]',user],
  ['["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta", "FechaCreacion", "UltimoAcceso"]',user],
  ['["ExpedienteID", "PersonaID", "CodigoInstitucional", "FechaNacimiento", "Nacionalidad", "DireccionResidencia", "FotografiaUrl", "EstadoExpediente", "FechaCreacion", "FechaActualizacion", "Observaciones"]',academic],
  ['["ResponsableID", "PersonaID", "Nombres", "Apellidos", "Identificacion", "Telefono", "Email", "Direccion", "Ocupacion", "Estado"]',academic],
  ['["AsignaturaID", "NombreOficial", "Codigo", "AreaAcademica", "CargaHorariaRef", "Estado"]',academic],
  ['["MatriculaID", "Fecha", "UserId", "Alumno", "Grado", "Seccion", "Periodo", "Tipo", "Estado", "BecaDescuento", "Observaciones"]',academic],
  ['["DocumentoID", "ExpedienteID", "SolicitudID", "TipoDocumento", "NombreArchivo", "DriveFileId", "DriveUrl", "FechaRecepcion", "FechaVencimiento", "EstadoRevision", "SubidoPor", "ValidadoPor", "Observaciones"]',academic]
];
canonicalSchemas.forEach(([schema,source])=>assert.ok(source.includes(schema),"canonical destination schema "+schema));
const targetStart=user.indexOf("const IDENTITY_TARGET_SCHEMAS_ = {");
const targetFunctionStart=user.indexOf("function identityTargetExists_(",targetStart);
const targetEnd=user.indexOf(String.fromCharCode(10)+"}",targetFunctionStart);
assert.ok(targetStart>=0&&targetFunctionStart>targetStart&&targetEnd>targetFunctionStart,"destination schema registry and validator are extractable");
const targetSource=user.slice(targetStart,targetEnd+2);
let sheetByName={};
const targetContext={
  SPREADSHEET_ID:"isolated-test",
  SpreadsheetApp:{openById:function(){return {getSheetByName:function(name){return sheetByName[name]||null;}};}}
};
vm.runInNewContext(targetSource+String.fromCharCode(10)+"this.schemas=IDENTITY_TARGET_SCHEMAS_;this.exists=identityTargetExists_;",targetContext);
function mockSheet(headers,id){
  const row=headers.map(()=> "");
  row[0]=id;
  return {
    getRange:function(r,c,n,m){return {getValues:function(){return [headers.slice(0,m)];}};},
    getDataRange:function(){return {getValues:function(){return [headers,row];}};}
  };
}
Object.keys(targetContext.schemas).forEach(function(type){
  const schema=targetContext.schemas[type];
  sheetByName[schema.sheet]=mockSheet(schema.headers,"TARGET-1");
  assert.equal(targetContext.exists(type,"TARGET-1"),true,"valid full schema: "+type);
  const bad=schema.headers.slice();bad[bad.length-1]="WRONG_HEADER";
  sheetByName[schema.sheet]=mockSheet(bad,"TARGET-1");
  assert.equal(targetContext.exists(type,"TARGET-1"),false,"reject mismatched full schema: "+type);
});
assert.equal(targetContext.exists("persona",""),false,"empty destination ID rejected");
assert.equal(targetContext.exists("unknown","TARGET-1"),false,"unsupported entity rejected");
sheetByName={};
assert.equal(targetContext.exists("persona","TARGET-1"),false,"missing destination sheet rejected");
assert.ok(user.includes("IDENTITY_TARGET_NOT_FOUND_OR_UNSUPPORTED"));
assert.ok(user.includes("identityTextCell_(String(e.motivo || \"\").slice(0, 2000))"));
assert.ok(user.includes("identityHash_(sourceRecord)"));
assert.ok(user.includes("IDENTITY_MAPPING_CONFLICT"));assert.ok(user.includes('String(found[0][9])!=="CONFIRMADA"'));
assert.ok(user.includes("fusionAutomaticaPermitida: false"));assert.ok(accounting.includes("function resolveCrossReferenceIdentifier("));
assert.ok(accounting.includes("DESTINATION_WRITER_NOT_CONFIGURED"));assert.ok(method.includes("3.14.1 Respaldo alternativo verificable mediante el historial Git"));
const pure=user.match(/function identityCompositeKey_\([\s\S]*?\n\}/);assert.ok(pure);
const box={};vm.runInNewContext(pure[0]+"\nthis.key=identityCompositeKey_;",box);
assert.notEqual(box.key("SACE","estudiante","X","I1"),box.key("LEGACY","estudiante","X","I1"));
assert.notEqual(box.key("SACE","estudiante","X","I1"),box.key("SACE","usuario","X","I1"));
assert.notEqual(box.key("SACE","estudiante","X","I1"),box.key("SACE","estudiante","X","I2"));

assert.ok(persistence.includes("DB_VERSION: 5"));
assert.ok(persistence.includes("'identity_mapping_cache'"));
assert.ok(persistence.includes("IDENTITY_CACHE_ONLY_CONFIRMED_MAPPINGS"));
assert.ok(persistence.includes("clearIdentityMappingCache"));
assert.ok(api.includes("window.registerLegacyIdentifierMapping"));
assert.ok(api.includes("window.resolveInternalIdFromLegacy"));
assert.ok(api.includes("window.resolveLegacyIdFromInternal"));
assert.ok(api.includes("window.resolveUserByLegacyId"));
assert.ok(api.includes("window.reviewLegacyIdentifierMapping"));
assert.ok(api.includes("window.getIdentityDecisionHistory"));

console.log("TASK-068 identity mapping contract: syntax, canonical schemas, and isolated destination-validation cases passed.");
