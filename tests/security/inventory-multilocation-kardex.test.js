// Expanded inventory contract: serial isolation, over-receipt rejection and transfer rollback.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
function extract(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);let depth=0,quote="",escaped=false;for(let i=source.indexOf("{",start);i<source.length;i++){const ch=source[i];if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote="";continue;}if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw new Error("unbalanced "+name);}
function sheet(rows,onSetValues){const s={rows:rows.map(r=>r.slice()),getDataRange(){return{getValues:()=>s.rows.map(r=>r.slice())};},getRange(row,col){return{setValue(value){while(s.rows.length<row)s.rows.push([]);while(s.rows[row-1].length<col)s.rows[row-1].push("");s.rows[row-1][col-1]=value;},setValues(values){if(onSetValues)onSetValues();for(let i=0;i<values.length;i++){while(s.rows.length<row+i)s.rows.push([]);while(s.rows[row+i-1].length<col-1+values[i].length)s.rows[row+i-1].push("");for(let j=0;j<values[i].length;j++)s.rows[row+i-1][col-1+j]=values[i][j];}}};},appendRow(row){s.rows.push(row.slice());},getLastRow(){return s.rows.length;},deleteRow(row){s.rows.splice(row-1,1);},insertRowBefore(row){s.rows.splice(row-1,0,[]);}};return s;}
function makeHarness(){
 const sheets={};
 let uuid=0,actorRole="Director",permissionDenied=false,lockBusy=false,logs=[],failCountUpdate=false;
 const makeSheet=(name,rows)=>sheet(rows,()=>{if(name==="InventariosConteosFisicos"&&failCountUpdate){failCountUpdate=false;throw new Error("SIMULATED_COUNT_ROW_WRITE_FAILURE");}});
 const ss={getSheetByName:name=>sheets[name]||null,insertSheet:name=>{sheets[name]=makeSheet(name,[[]]);return sheets[name];}};
 const context={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({waitLock:()=>{if(lockBusy)throw new Error("LOCK_BUSY");},releaseLock:()=>{}})},
  getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||spreadsheet.insertSheet(name),
  catalogActor_:(_p,write)=>({authorized:true,userId:"USR-1",role:actorRole}),
  validateRolePermission:(_actor,action)=>permissionDenied?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:{authorized:true,action},
  catalogNormalizeText_:v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," "),
  catalogNormalizeCode_:v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim().replace(/\s+/g,"-"),
  catalogFindItem_:(_ss,code)=>({id:"ITM-1",code:code,name:"Equipo de prueba",category:"Equipo",unit:"Unidad",baseUnit:"Unidad",row:Array(21).fill(5)}),
  catalogFindUnit_:(_ss,name)=>({id:"UND-1",name:name||"Unidad",base:"Unidad",factor:1}),
  assetDeprMoney_:v=>Math.round(Number(v||0)*100)/100,
  inventoryValuationSnapshot_:()=>({}),inventoryValuationRestore_:()=>{},
  inventoryValuationApplyMovement_:(_ss,_item,_p,_id,qty,_type,_location)=>({costoUnitario:1,costoTotal:qty,metodo:"PROMEDIO_PONDERADO",estadoCosto:"OK",asignaciones:[]}),
  inventoryValuationTransferLayers_:()=>[],inventoryValuationSliceLayers_:(_layers,qty)=>[{cantidad:qty}],migrationStableJson_:value=>JSON.stringify(value),migrationHash_:value=>require("node:crypto").createHash("sha256").update(String(value)).digest("hex"),
  inventoryDeleteAppendedRows_:(sh,start)=>{while(sh.getLastRow()>=start)sh.deleteRow(sh.getLastRow());},
  logStructuredEvent:(...args)=>logs.push(args),Utilities:{getUuid:()=>String(++uuid).padStart(8,"0")},
  Object,Array,String,Number,Date,Math,JSON,RegExp,Error,isFinite,parseFloat
 };
 vm.createContext(context);
 const functions=["inventoryLegacyLocationId_","inventoryEnsureWarehouseLocations_","inventoryResolveLocation_","manageWarehouseLocation","getWarehouseLocations","inventoryEnsurePhysicalCountSheet_","inventoryCountBuckets_","createPhysicalInventoryCount","getPhysicalInventoryCounts","reconcilePhysicalCount","catalogEnsureKardexSchema_","recordInventoryMovementLocked_","recordInventoryMovement","getInventoryKardex","inventoryEnsureLedgerSheet_","inventoryEnsureReservations_","inventoryReservationRows_","inventoryPhysicalStock_","inventoryActiveReserved_","inventoryReserveRequisition_","transferInventoryStock","confirmTransferReceipt","getInventoryTransfers"];
 for(const name of functions)vm.runInContext(extract(name),context);
 return{context,sheets,ss,logs,setRole:r=>actorRole=r,setPermissionDenied:v=>permissionDenied=v,setLockBusy:v=>lockBusy=v,setFailCountUpdate:v=>failCountUpdate=v};
}
function main(){
 assert.doesNotThrow(()=>new vm.Script(source),"Apps Script syntax");
 const h=makeHarness(),ctx=h.context;
 const loc1=ctx.manageWarehouseLocation({sedeCod:"SPS-01",nombreUbicacion:"Bodega Norte",tipoArea:"Bodega"}),loc2=ctx.manageWarehouseLocation({sedeCod:"SPS-02",nombreUbicacion:"Bodega Norte",tipoArea:"Bodega"});
 assert.equal(loc1.status,"success");assert.equal(loc2.status,"success");assert.notEqual(loc1.ubicacionId,loc2.ubicacionId);
 assert.equal(ctx.getWarehouseLocations({sedeCod:"SPS-01"}).ubicaciones.length,1);
 assert.throws(()=>ctx.inventoryResolveLocation_(h.ss,{ubicacionResponsable:"Bodega Norte"}),/INVENTORY_LOCATION_AMBIGUOUS/);
 const move=(sede,location,qty,type="Entrada",lot="L-1",serial="")=>ctx.recordInventoryMovementLocked_(h.ss,{itemCodigo:"ITM-1",cantidad:qty,cantidadBase:true,tipoMovimiento:type,sedeCod:sede,ubicacionId:location,numeroLote:lot,numeroSerie:serial,actorUserId:"USR-1"});
 assert.equal(move("SPS-01",loc1.ubicacionId,10).stockNuevoUbicacion,10);
 assert.equal(move("SPS-02",loc2.ubicacionId,20).stockNuevoUbicacion,20);
 assert.equal(move("SPS-01",loc1.ubicacionId,5,"Entrada","L-2").stockNuevoUbicacion,5);
 assert.equal(move("SPS-01",loc1.ubicacionId,4,"Salida","L-1").stockNuevoUbicacion,6);
 const countBefore=h.sheets.InventariosKardex.rows.length;
 h.setLockBusy(true);assert.throws(()=>ctx.recordInventoryMovement({itemCodigo:"ITM-1",cantidad:1,cantidadBase:true,tipoMovimiento:"Entrada",sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId}),/LOCK_BUSY/);h.setLockBusy(false);assert.equal(h.sheets.InventariosKardex.rows.length,countBefore);
 assert.throws(()=>move("SPS-01",loc1.ubicacionId,7,"Salida","L-1"),/INSUFFICIENT_LOCAL_STOCK/);
 assert.throws(()=>move("SPS-01",loc1.ubicacionId,1,"MODO_DESCONOCIDO","L-1"),/INVENTORY_MOVEMENT_TYPE_UNSUPPORTED/);
 assert.equal(h.sheets.InventariosKardex.rows.length,countBefore);
 const reserved=ctx.inventoryReserveRequisition_(h.ss,"REQ-1",[{catalogItemId:"ITM-1",itemCodigo:"ITM-1",cantidad:2,factorConversionBase:1}],"Bodega Norte","USR-1","SPS-01",loc1.ubicacionId);
 assert.equal(reserved.idempotent,false);
 let kardex=ctx.getInventoryKardex({sedeCod:"SPS-01"});
 const filtered=ctx.getInventoryKardex({sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,itemCodigo:"ITM-1",numeroLote:"L-1"});
 assert.ok(filtered.kardex.length>0);assert.ok(filtered.kardex.every(x=>x.sedeCod==="SPS-01"&&x.ubicacionId===loc1.ubicacionId&&x.numeroLote==="L-1"));
 const today=new Date(),todayKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
 assert.ok(ctx.getInventoryKardex({fechaInicio:todayKey,fechaFin:todayKey}).kardex.length>0);

 assert.throws(()=>ctx.getInventoryKardex({fechaFin:"invalid-date"}),/INVENTORY_DATE_FILTER_INVALID/);
 const sps1=kardex.resumenPorUbicacion.find(x=>x.sedeCod==="SPS-01");
 assert.equal(sps1.stockFisico,11);assert.equal(sps1.stockReservado,2);assert.equal(sps1.stockDisponible,9);
 assert.equal(kardex.resumenExistencias[0].totalInstitucional,31);
 assert.equal(kardex.kardex.filter(x=>x.sedeCod==="SPS-01").length,3);
 const blockedTransfer=ctx.transferInventoryStock({itemCodigo:"ITM-1",cantidad:5,ubicacionOrigen:"Bodega Norte",ubicacionDestino:"Bodega Norte",sedeCodOrigen:"SPS-01",sedeCodDestino:"SPS-02",ubicacionIdOrigen:loc1.ubicacionId,ubicacionIdDestino:loc2.ubicacionId,numeroLote:"L-1",requiereConfirmacionFisica:true});assert.equal(blockedTransfer.code,"INSUFFICIENT_AVAILABLE_STOCK");
 const transfer=ctx.transferInventoryStock({itemCodigo:"ITM-1",cantidad:3,ubicacionOrigen:"Bodega Norte",ubicacionDestino:"Bodega Norte",sedeCodOrigen:"SPS-01",sedeCodDestino:"SPS-02",ubicacionIdOrigen:loc1.ubicacionId,ubicacionIdDestino:loc2.ubicacionId,numeroLote:"L-1",requiereConfirmacionFisica:true});
 assert.equal(transfer.status,"success",JSON.stringify(transfer));
 kardex=ctx.getInventoryKardex({});
 const destination=kardex.resumenPorUbicacion.find(x=>x.sedeCod==="SPS-02");
 assert.equal(destination.stockEnTransito,3);
 const partial=ctx.confirmTransferReceipt({transferBatchId:transfer.transferBatchId,cantidadRecibida:2,justificacionDiscrepancia:"Recepción parcial verificada"});
 assert.equal(partial.estadoTransferencia,"RecibidaParcial");assert.equal(partial.cantidadRecibidaEnEstaConfirmacion,2);
 kardex=ctx.getInventoryKardex({});assert.equal(kardex.resumenPorUbicacion.find(x=>x.sedeCod==="SPS-02").stockEnTransito,1);
 const full=ctx.confirmTransferReceipt({transferBatchId:transfer.transferBatchId,cantidadRecibida:3});
 assert.equal(full.estadoTransferencia,"RecibidaTotal");assert.equal(full.cantidadRecibidaEnEstaConfirmacion,1);
 assert.equal(ctx.confirmTransferReceipt({transferBatchId:transfer.transferBatchId,cantidadRecibida:3}).idempotente,true);
 assert.equal(ctx.getInventoryKardex({}).resumenPorUbicacion.find(x=>x.sedeCod==="SPS-02").stockEnTransito,0);
 const transfer2=ctx.transferInventoryStock({itemCodigo:"ITM-1",cantidad:1,ubicacionOrigen:"Bodega Norte",ubicacionDestino:"Bodega Norte",sedeCodOrigen:"SPS-01",sedeCodDestino:"SPS-02",ubicacionIdOrigen:loc1.ubicacionId,ubicacionIdDestino:loc2.ubicacionId,numeroLote:"L-2",requiereConfirmacionFisica:true});
 const rejected=ctx.confirmTransferReceipt({transferBatchId:transfer2.transferBatchId,cantidadRecibida:0,justificacionDiscrepancia:"Destino rechazó la entrega"});
 assert.equal(rejected.estadoTransferencia,"Rechazada");
 const serialOne=move("SPS-01",loc1.ubicacionId,2,"Entrada","LOT-SERIAL","SER-001");
 const serialTwo=move("SPS-01",loc1.ubicacionId,3,"Entrada","LOT-SERIAL","SER-002");
 assert.equal(serialOne.stockNuevoUbicacion,2);
 assert.equal(serialTwo.stockNuevoUbicacion,3);
 const serialOneRows=ctx.getInventoryKardex({sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,numeroSerie:"SER-001"});
 assert.equal(serialOneRows.kardex.length,1);
 assert.equal(serialOneRows.kardex[0].stockNuevo,2);
 const serialTwoRows=ctx.getInventoryKardex({sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,numeroSerie:"SER-002"});
 assert.equal(serialTwoRows.kardex.length,1);
 assert.equal(serialTwoRows.kardex[0].stockNuevo,3);
 assert.equal(serialOneRows.resumenPorUbicacion.find(x=>x.sedeCod==="SPS-01").stockFisico,13);

 const beforeOverReceiptRows=h.sheets.InventariosKardex.rows.length;
 assert.throws(()=>ctx.confirmTransferReceipt({transferBatchId:transfer2.transferBatchId,cantidadRecibida:2}),/TRANSFER_RECEIPT_EXCEEDS_DISPATCHED_QUANTITY/);
 assert.equal(h.sheets.InventariosKardex.rows.length,beforeOverReceiptRows,"over-receipt must not append Kardex movements");

 const transferRows=h.sheets.TransferenciasInventario.rows.length;
 const originLotBeforeFailure=ctx.inventoryPhysicalStock_(h.ss,"ITM-1","Bodega Norte","SPS-01",loc1.ubicacionId,"L-2");
 const originalValuationApply=ctx.inventoryValuationApplyMovement_;
 let valuationCalls=0;
 ctx.inventoryValuationApplyMovement_=(...args)=>{valuationCalls++;if(valuationCalls===2)throw new Error("INJECTED_DESTINATION_VALUATION_FAILURE");return originalValuationApply(...args);};
 assert.throws(()=>ctx.transferInventoryStock({itemCodigo:"ITM-1",cantidad:1,ubicacionOrigen:"Bodega Norte",ubicacionDestino:"Bodega Norte",sedeCodOrigen:"SPS-01",sedeCodDestino:"SPS-02",ubicacionIdOrigen:loc1.ubicacionId,ubicacionIdDestino:loc2.ubicacionId,numeroLote:"L-2",requiereConfirmacionFisica:false}),/INVENTORY_TRANSFER_ATOMIC_FAILURE/);
 ctx.inventoryValuationApplyMovement_=originalValuationApply;
 assert.equal(h.sheets.InventariosKardex.rows.length,beforeOverReceiptRows,"failed two-leg transfer must roll back both Kardex writes");
 assert.equal(h.sheets.TransferenciasInventario.rows.length,transferRows,"failed transfer must not leave a transfer ledger row");
 assert.equal(ctx.inventoryPhysicalStock_(h.ss,"ITM-1","Bodega Norte","SPS-01",loc1.ubicacionId,"L-2"),originLotBeforeFailure,"failed transfer must restore the origin lot balance");
 assert.equal(ctx.inventoryPhysicalStock_(h.ss,"ITM-1","Bodega Norte","SPS-02",loc2.ubicacionId,"L-2"),0,"failed transfer must not leave destination stock");

 const legacyRows=[["KardexID","Fecha","ItemCodigo","ItemNombre","CategoriaTipo","TipoMovimiento","Cantidad","StockAnterior","StockNuevo","StockMinimo","UbicacionResponsable","Observaciones","CatalogoItemID","CantidadBase","UnidadMedidaOriginal","FactorConversion"],["KDX-OLD",new Date(),"ITM-1","Equipo de prueba","Equipo","Entrada",4,0,4,5,"","[LOTE:LOT-OLD] [SERIE:SER-OLD]", "ITM-1",4,"Unidad",1]];
 const legacyHarness=makeHarness();legacyHarness.sheets.InventariosKardex=sheet(legacyRows);legacyHarness.context.catalogEnsureKardexSchema_(legacyHarness.ss);assert.equal(legacyHarness.sheets.InventariosKardex.rows[1][20],"LEGACY");assert.match(legacyHarness.sheets.InventariosKardex.rows[1][21],/UBI-LEGACY-BODEGA-GENERAL/);assert.equal(legacyHarness.sheets.InventariosKardex.rows[1][22],"LOT-OLD");assert.equal(legacyHarness.sheets.InventariosKardex.rows[1][23],"SER-OLD");
 const legacy=move("", "",4,"Entrada","","");
 assert.equal(legacy.sedeCod,"LEGACY");assert.match(legacy.ubicacionId,/UBI-LEGACY-BODEGA-GENERAL/);
 const tamper=h.sheets.InventariosKardex.rows[1];tamper[8]=999;
 kardex=ctx.getInventoryKardex({});assert.ok(kardex.totalInconsistencias>0);
 h.setRole("Bodeguero");assert.throws(()=>ctx.manageWarehouseLocation({sedeCod:"SPS-03",nombreUbicacion:"Bodega Sur"}),/WAREHOUSE_LOCATION_ROLE_NOT_ALLOWED/);
h.setRole("Director");h.setPermissionDenied(true);assert.throws(()=>ctx.manageWarehouseLocation({sedeCod:"SPS-03",nombreUbicacion:"Bodega Sur"}),/ROLE_PERMISSION_DENIED/);

 h.setPermissionDenied(false);h.setRole("Director");
 const countSeed=ctx.recordInventoryMovementLocked_(h.ss,{itemCodigo:"ITM-COUNT",cantidad:10,cantidadBase:true,tipoMovimiento:"Entrada",sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,numeroLote:"LOT-COUNT",actorUserId:"USR-1"});
 assert.equal(countSeed.stockNuevoUbicacion,10);
 const physicalCount=ctx.createPhysicalInventoryCount({sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,observaciones:"Conteo mensual"});
 assert.equal(physicalCount.status,"success");
 assert.equal(ctx.getPhysicalInventoryCounts({sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId}).conteos.length,1);
 const countPayload={conteoId:physicalCount.conteoId,articulosDetalleJSON:[{itemCodigo:"ITM-COUNT",cantidadContada:8}],idempotencyKey:"COUNT-RECON-01"};
 const countRowsBefore=h.sheets.InventariosKardex.rows.length;
 h.setFailCountUpdate(true);
 assert.throws(()=>ctx.reconcilePhysicalCount(countPayload),/INVENTORY_COUNT_RECONCILIATION_ATOMIC_FAILURE/);
 assert.equal(h.sheets.InventariosKardex.rows.length,countRowsBefore,"count update failure must roll back Kardex adjustments");
 assert.equal(ctx.getPhysicalInventoryCounts({conteoId:physicalCount.conteoId}).conteos[0].estadoConteo,"EnConteo");
 h.setLockBusy(true);assert.throws(()=>ctx.reconcilePhysicalCount(countPayload),/LOCK_BUSY/);h.setLockBusy(false);
 assert.equal(h.sheets.InventariosKardex.rows.length,countRowsBefore,"lock contention must not apply a count adjustment");
 const reconciled=ctx.reconcilePhysicalCount(countPayload);
 assert.equal(reconciled.status,"success");assert.equal(reconciled.estadoConteo,"ConciliadoAprobado");assert.equal(reconciled.totalDiferencias,1);
 assert.equal(ctx.inventoryPhysicalStock_(h.ss,"ITM-COUNT","Bodega Norte","SPS-01",loc1.ubicacionId),8);
 const rowsAfterReconcile=h.sheets.InventariosKardex.rows.length;
 assert.equal(ctx.reconcilePhysicalCount(countPayload).idempotente,true);
 assert.equal(h.sheets.InventariosKardex.rows.length,rowsAfterReconcile,"reconciliation replay must not duplicate movements");
 assert.equal(ctx.getPhysicalInventoryCounts({estadoConteo:"ConciliadoAprobado"}).conteos[0].reconciliacionId,reconciled.reconciliacionId);
 ctx.recordInventoryMovementLocked_(h.ss,{itemCodigo:"ITM-COUNT",cantidad:4,cantidadBase:true,tipoMovimiento:"Entrada",sedeCod:"SPS-02",ubicacionId:loc2.ubicacionId,numeroLote:"LOT-COUNT",actorUserId:"USR-1"});
 const secondPhysicalCount=ctx.createPhysicalInventoryCount({sedeCod:"SPS-02",ubicacionId:loc2.ubicacionId});
 assert.equal(ctx.getPhysicalInventoryCounts({conteoId:physicalCount.conteoId}).total,1,"count identifier filter must isolate one physical count");
 assert.equal(ctx.getPhysicalInventoryCounts({conteoId:secondPhysicalCount.conteoId}).conteos[0].sedeCod,"SPS-02");
 const secondReconciliation=ctx.reconcilePhysicalCount({conteoId:secondPhysicalCount.conteoId,articulosDetalleJSON:[{itemCodigo:"ITM-COUNT",cantidadContada:5,numeroLote:"LOT-COUNT"}],idempotencyKey:"COUNT-RECON-02"});
 assert.equal(secondReconciliation.status,"success");
 assert.equal(ctx.inventoryPhysicalStock_(h.ss,"ITM-COUNT","Bodega Norte","SPS-01",loc1.ubicacionId),8,"reconciling a second warehouse must preserve the first warehouse balance");
 assert.equal(ctx.inventoryPhysicalStock_(h.ss,"ITM-COUNT","Bodega Norte","SPS-02",loc2.ubicacionId),5,"physical count adjustment must apply only to its warehouse");
 assert.throws(()=>ctx.reconcilePhysicalCount({...countPayload,articulosDetalleJSON:[{itemCodigo:"ITM-COUNT",cantidadContada:7}]}),/INVENTORY_COUNT_IDEMPOTENCY_CONFLICT|INVENTORY_COUNT_ALREADY_RECONCILED/);
 ctx.recordInventoryMovementLocked_(h.ss,{itemCodigo:"ITM-MULTI",cantidad:5,cantidadBase:true,tipoMovimiento:"Entrada",sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,numeroLote:"LOT-A",actorUserId:"USR-1"});
 ctx.recordInventoryMovementLocked_(h.ss,{itemCodigo:"ITM-MULTI",cantidad:3,cantidadBase:true,tipoMovimiento:"Entrada",sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId,numeroLote:"LOT-B",actorUserId:"USR-1"});
 const multiCount=ctx.createPhysicalInventoryCount({sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId});
 assert.throws(()=>ctx.reconcilePhysicalCount({conteoId:multiCount.conteoId,articulosDetalleJSON:[{itemCodigo:"ITM-MULTI",cantidadContada:7}]}),/INVENTORY_COUNT_LOT_BREAKDOWN_REQUIRED/);
 const multiResult=ctx.reconcilePhysicalCount({conteoId:multiCount.conteoId,articulosDetalleJSON:[{itemCodigo:"ITM-MULTI",cantidadContada:4,numeroLote:"LOT-A"},{itemCodigo:"ITM-MULTI",cantidadContada:2,numeroLote:"LOT-B"}]});
 assert.equal(multiResult.status,"success");
 const multiBuckets=ctx.inventoryCountBuckets_(h.ss,"ITM-MULTI",{sedeCod:"SPS-01",ubicacionId:loc1.ubicacionId});
 assert.equal(multiBuckets.find(x=>x.numeroLote==="LOT-A").stock,4);assert.equal(multiBuckets.find(x=>x.numeroLote==="LOT-B").stock,2);
 h.setPermissionDenied(true);assert.throws(()=>ctx.reconcilePhysicalCount({conteoId:multiCount.conteoId,articulosDetalleJSON:[{itemCodigo:"ITM-MULTI",cantidadContada:4,numeroLote:"LOT-A"},{itemCodigo:"ITM-MULTI",cantidadContada:2,numeroLote:"LOT-B"}]}),/ROLE_PERMISSION_DENIED/);h.setPermissionDenied(false);
 console.log("Inventory multi-warehouse and physical-count contract PASS: location isolation, reservations, transit, lot/serial balances, atomic/idempotent physical reconciliation, multi-lot breakdown, lock contention and rollback.");
}
main();
