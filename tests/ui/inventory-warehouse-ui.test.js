const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"js/accounting.js"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source),"accounting UI syntax");
for(const token of ['id="loc-sede"',"sedeCod: document.getElementById('loc-sede').value",'getWarehouseLocations','id="trf-origen"','ubicacionIdOrigen','sedeCodDestino','numeroLote','numeroSerie','["EnTransito","RecibidaParcial"].includes','Cantidad acumulada recibida','Justificación obligatoria de la diferencia'])
 assert.ok(source.includes(token),"missing warehouse UI contract: "+token);
assert.ok(!source.includes('|| "Diferencia de conteo en destino"'),"UI must not invent a discrepancy justification");
console.log("Inventory warehouse UI contract PASS: explicit warehouse/location registration, location-ID transfer selection, lot/serial fields and cumulative partial receipt with mandatory justification.");
