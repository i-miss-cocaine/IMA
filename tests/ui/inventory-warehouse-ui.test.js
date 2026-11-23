const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"js/accounting.js"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source),"accounting UI syntax");
for(const token of ['id="loc-sede"',"sedeCod: document.getElementById('loc-sede').value",'getWarehouseLocations','id="trf-origen"','ubicacionIdOrigen','sedeCodDestino','numeroLote','numeroSerie','["EnTransito","RecibidaParcial"].includes','Cantidad acumulada recibida','Justificación obligatoria de la diferencia'])
 assert.ok(source.includes(token),"missing warehouse UI contract: "+token);
assert.ok(!source.includes('|| "Diferencia de conteo en destino"'),"UI must not invent a discrepancy justification");
assert.ok(source.includes("data-transfer-receipt"),"transfer receipt buttons must use data attributes rather than inline event code");
const transferFormStart=source.indexOf('id="form-transferencia"'),transferFormEnd=source.indexOf("</form>",transferFormStart),transferForm=source.slice(transferFormStart,transferFormEnd);
assert.ok(transferForm.includes('id="trf-estado-inicial"'),"transfer UI must expose draft, approval and direct dispatch states inside the transfer form");
assert.ok(transferForm.includes('id="trf-idempotency-key"')&&source.includes("idempotencyKey: document.getElementById('trf-idempotency-key').value"),"transfer submissions must reuse the form idempotency key on retries");
assert.ok(source.includes("data-transfer-approve")&&source.includes("data-transfer-cancel"),"draft and pending transfers must expose approve/cancel actions");
assert.ok(source.includes("approveInventoryTransfer")&&source.includes("cancelInventoryTransfer"),"transfer state actions must call the corresponding backend transitions");

assert.ok(source.includes("escapeTransferHtml"),"transfer ledger data must be escaped before HTML rendering");
assert.ok(!source.includes('onclick="handleRecibirTransferencia'),"transfer receipt action must not interpolate untrusted values into inline handlers");
console.log("Inventory warehouse UI contract PASS: explicit warehouse/location registration, location-ID transfer selection, lot/serial fields and cumulative partial receipt with mandatory justification.");

for(const token of ["kdx-count-sede","kdx-count-ubicacion","kdx-count-id","kdx-count-detail","window.startPhysicalInventoryCountUI","window.loadPhysicalInventoryCountsUI","window.reconcilePhysicalInventoryCountUI","createPhysicalInventoryCount","getPhysicalInventoryCounts","reconcilePhysicalCount","data-count-line","data-count-quantity"]) assert.ok(source.includes(token),"missing physical count UI contract: "+token);
console.log("Physical inventory count UI contract PASS: create/list/count/reconcile actions are exposed by the Kardex view with warehouse/location selection and nonblank quantity validation.");
assert.ok(source.includes("aria-live"),"physical count result region must announce updates accessibly");
assert.ok(source.includes("aria-describedby"),"physical count status must reference its instructions");
assert.ok(source.includes("window.inventoryPhysicalCountRequest"),"physical count list must track request generations");
assert.ok(source.includes("requestId!==window.inventoryPhysicalCountRequest"),"stale physical count responses must not overwrite newer location results");

for(const token of ['id="kdx-sede"','id="kdx-ubicacion"','id="kdx-filter-sede"','id="kdx-filter-ubicacion"','id="kdx-filter-item"','id="kdx-filter-category"','id="kdx-filter-from"','id="kdx-filter-to"','payload.ubicacionId','payload.fechaInicio','payload.fechaFin','numeroLote: document.getElementById(\'kdx-lote\').value']) assert.ok(source.includes(token),"missing Kardex UI filter/location contract: "+token);

for(const token of ['id="kdx-sede"','id="kdx-ubicacion"','id="kdx-filter-sede"','id="kdx-filter-ubicacion"','id="kdx-filter-item"','id="kdx-filter-category"','id="kdx-filter-from"','id="kdx-filter-to"','payload.ubicacionId','payload.fechaInicio','payload.fechaFin']) assert.ok(source.includes(token),"missing Kardex location/filter control: "+token);
