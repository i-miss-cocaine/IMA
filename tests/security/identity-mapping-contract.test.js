const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),up=path.join(root,"backend/user-service/Code.gs"),ap=path.join(root,"backend/accounting-service/Code.gs");
const user=fs.readFileSync(up,"utf8"),accounting=fs.readFileSync(ap,"utf8"),method=fs.readFileSync(path.join(root,"METODOLOGIA_DESARROLLO.md"),"utf8"),persistence=fs.readFileSync(path.join(root,"js/persistence.js"),"utf8"),api=fs.readFileSync(path.join(root,"js/api.js"),"utf8");
new vm.Script(user,{filename:up}); new vm.Script(accounting,{filename:ap}); new vm.Script(persistence,{filename:"js/persistence.js"}); new vm.Script(api,{filename:"js/api.js"});
const headers=["idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataforma","institucionId","hashRegistroOrigen","fechaMigracion","versionMapeo","estadoCorrespondencia","metodoCoincidencia","nivelConfianza","migradoPor"];
for(const h of headers) assert.ok(user.includes('"'+h+'"'),"header "+h);
for(const fn of ["registerLegacyIdentifierMapping","resolveInternalIdFromLegacy","resolveLegacyIdFromInternal","resolveUserByLegacyId","reviewLegacyIdentifierMapping","getIdentityDecisionHistory"]) {assert.ok(user.includes("function "+fn+"("));assert.ok(user.includes('case "'+fn+'"'));}
assert.ok(user.includes('const IDENTITY_MANAGER_ROLES_ = ["Administrador", "Secretaría"]'));
assert.ok(user.includes('getProperty("IMA_INSTITUTION_ID")'));assert.ok(user.includes("LockService.getScriptLock()"));
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

console.log("TASK-068 identity mapping contract: syntax and static assertions passed.");
