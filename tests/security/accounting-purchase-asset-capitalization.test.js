const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const ch=source[i],next=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(ch==="\\"){escape=true;continue;}if(ch===quote)quote="";continue;}if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8"),client=fs.readFileSync(path.join(root,"js/accounting.js"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source));assert.doesNotThrow(()=>new vm.Script(client));
const constants=source.match(/const ASSET_BASE_HEADERS_ = \[[^\n]+\];\s*const ASSET_ACQUISITION_HEADERS_ = \[[^\n]+\];/);
assert.ok(constants,"asset acquisition schema constants missing");
const rows={
  SolicitudesCompra:[["SolicitudID","Fecha","Departamento","SolicitanteUserId","Justificacion","Categoria","DetalleItemsJSON","MontoEstimado","CentroCosto","EstadoAprobacion","Observaciones"],["REQ-1",new Date(),"Finanzas","U-1","Compra de equipo","Bienes",JSON.stringify([{itemId:"IT-1",descripcion:"Laptop",cantidad:2,clasificacionInventario:"ActivoFijo"}]),1000,"CC-1","Adjudicada",""]],
  OrdenesCompra:[["OrdenCompraID","SolicitudID","CotizacionID","ProveedorID","FechaEmision","FechaEntregaEstimada","DetalleItemsJSON","MontoTotal","CentroCosto","EstadoOrden"],["ORD-1","REQ-1","Q-1","SUP-1",new Date(),"",JSON.stringify([{itemId:"IT-1",descripcion:"Laptop",cantidad:2,precioUnitario:500,total:1000,clasificacionInventario:"ActivoFijo",capitalizable:true}]),1000,"CC-1","RecibidaTotal"]],
  RecepcionesCompra:[["RecepcionID","OrdenCompraID","Fecha","ReceptorUserId","DetalleJSON","EstadoConformidad","RegistrarInventario","AsientoID","Observaciones"],["REC-1","ORD-1",new Date(),"U-1",JSON.stringify([{itemId:"IT-1",cantidad:2,conforme:true}]),"Conforme",false,"",""]],
  CuentasPorPagarGastos:[["ObligacionID","ProveedorID","NumeroFactura","Importe","Impuestos","FechaVencimiento","EstadoAprobacion","EstadoPago","AsientoID","Observaciones"],["CXP-1","SUP-1","INV-001",1000,0,"","Aprobado","Pendiente Pago","AST-1","[ORDEN_ORD-1] [ITEMS_JSON:[{\"itemId\":\"IT-1\",\"cantidad\":2}]] [MATCH:Conciliada]"]],
  ActivosPatrimoniales:[["ActivoID","CodigoPatrimonial","Nombre","Categoria","SerieModel","UbicacionActual","CustodioUserId","Estado","Observaciones"]],
  AsignacionesActivos:[["AsignacionID","ActivoID","CustodioUserId","FechaEntrega","FechaDevolucion","EstadoActa","Observaciones"]]
};
function makeSheet(name){
  return {
    getDataRange:()=>({getValues:()=>rows[name].map(r=>r.slice())}),
    getLastRow:()=>rows[name].length,
    appendRow:r=>{if(name==="AsignacionesActivos"&&ctx.failAssignmentWrite)throw Error("ASSIGNMENT_WRITE_FAILED");rows[name].push(r.slice());},
    getRange:(row,col,numRows=1,numCols=1)=>({
      setValue:v=>{rows[name][row-1][col-1]=v;},
      setValues:values=>{for(let i=0;i<values.length;i++)rows[name][row-1+i].splice(col-1,numCols,...values[i]);},
      clearContent:()=>{for(let i=0;i<numRows;i++)for(let j=0;j<numCols;j++)rows[name][row-1+i][col-1+j]="";}
    })
  };
}
let lockBusy=false,uuid=0;
const spreadsheet={getSheetByName:name=>rows[name]?makeSheet(name):null,insertSheet:name=>{rows[name]=[];return makeSheet(name);}};
const ctx={SPREADSHEET_ID:"TEST",failAssignmentWrite:false,
 SpreadsheetApp:{openById:()=>spreadsheet},
 LockService:{getScriptLock:()=>({tryLock:()=>!lockBusy,waitLock:()=>{if(lockBusy)throw Error("LOCK_BUSY");},releaseLock:()=>{}})},
 Utilities:{getUuid:()=>"UUID-"+(++uuid)},
 getOrCreateSheet:(ss,name)=>{if(!rows[name]){const headers={ActivosPatrimoniales:["ActivoID","CodigoPatrimonial","Nombre","Categoria","SerieModel","UbicacionActual","CustodioUserId","Estado","Observaciones"],AsignacionesActivos:["AsignacionID","ActivoID","CustodioUserId","FechaEntrega","FechaDevolucion","EstadoActa","Observaciones"]}[name]||[];rows[name]=[headers];}return makeSheet(name);},
 purchaseQuotationAccess_:()=>({authorized:true,actor:{userId:"U-1",role:"Contador"},scope:{institutionWide:true,departmentIds:[]}})
};
vm.createContext(ctx);
vm.runInContext(constants[0],ctx);
["normalizePurchaseAwardRole_","purchaseQuotationItemKey_","purchaseQuotationJsonArray_","normalizePurchaseAssetClassification_","ensureAssetAcquisitionSchema_","purchaseAssetReceiptContext_","getPurchaseReceiptAssetCandidates","registerAssetsFromPurchaseReceipt","getAssetItems","manageAssetItem","createPurchaseRequest","createPurchaseOrder"].forEach(name=>vm.runInContext(extract(source,name),ctx));
assert.equal(ctx.normalizePurchaseAssetClassification_({tipoBien:"Bienes Capitalizables / Activos Fijos"}),"ActivoFijo");
assert.equal(ctx.normalizePurchaseAssetClassification_({clasificacionInventario:"Consumible"}),"Consumible");
const sourceClassBefore=rows.SolicitudesCompra[1][6];
rows.SolicitudesCompra[1][6]=JSON.stringify([{itemId:"IT-1",descripcion:"Laptop",cantidad:2,clasificacionInventario:"Consumible"}]);
assert.equal(ctx.getPurchaseReceiptAssetCandidates({recepcionId:"REC-1"}).candidatos.length,0,"request classification overrides an altered order classification");
rows.SolicitudesCompra[1][6]=sourceClassBefore;
const createdRequest=ctx.createPurchaseRequest({departamento:"Finanzas",justificacion:"Material de oficina",detalleItems:[{itemId:"ITEM-C",descripcion:"Papel",cantidad:2,clasificacionInventario:"Consumible"}]});
assert.equal(JSON.parse(rows.SolicitudesCompra.at(-1)[6])[0].clasificacionInventario,"Consumible");
const directOrder=ctx.createPurchaseOrder({solicitudId:createdRequest.solicitudId,proveedorId:"SUP-1",montoTotal:100,detalleItems:[{itemId:"ITEM-C",descripcion:"Papel",cantidad:2,clasificacionInventario:"ActivoFijo"}]});
const directOrderRow=rows.OrdenesCompra.at(-1),directOrderLine=JSON.parse(directOrderRow[6])[0];
assert.equal(directOrderLine.clasificacionInventario,"Consumible","direct order must inherit the request classification, not a client override");
assert.equal(directOrderLine.capitalizable,false);
const preview=ctx.getPurchaseReceiptAssetCandidates({recepcionId:"REC-1"});
assert.equal(preview.candidatos.length,1);assert.equal(preview.candidatos[0].unidadesDisponibles,2);assert.equal(preview.facturasDisponibles[0].numeroFactura,"INV-001");
const first={recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-001",numeroSerie:"SN-001",categoriaPatrimonial:"Equipo computacional",marca:"Marca A",modelo:"Modelo A",ubicacionActual:"Bodega"}]};
const allowedAccess=ctx.purchaseQuotationAccess_,headerLengthBefore=rows.ActivosPatrimoniales[0].length;
ctx.purchaseQuotationAccess_=()=>({authorized:true,scope:{institutionWide:false,departmentIds:["D-OTHER"]}});
assert.throws(()=>ctx.getPurchaseReceiptAssetCandidates({recepcionId:"REC-1"}),/RESOURCE_NOT_FOUND/);
ctx.purchaseQuotationAccess_=()=>({authorized:false,code:"ROLE_NOT_ALLOWED"});
const denied=ctx.registerAssetsFromPurchaseReceipt(first);
ctx.purchaseQuotationAccess_=allowedAccess;
assert.equal(denied.code,"ROLE_NOT_ALLOWED");assert.equal(rows.ActivosPatrimoniales[0].length,headerLengthBefore,"unauthorized calls must not mutate the asset schema");

const registered=ctx.registerAssetsFromPurchaseReceipt(first);
assert.equal(registered.status,"success");assert.equal(registered.activos.length,1);
assert.equal(rows.ActivosPatrimoniales.length,2);assert.equal(rows.ActivosPatrimoniales[1][10],"ORD-1");assert.equal(rows.ActivosPatrimoniales[1][11],"REC-1");assert.equal(rows.ActivosPatrimoniales[1][12],"INV-001");assert.equal(rows.ActivosPatrimoniales[1][16],"SN-001");assert.equal(rows.ActivosPatrimoniales[1][20],"ActivoFijo");
const retry=ctx.registerAssetsFromPurchaseReceipt(first);assert.equal(retry.status,"success");assert.equal(retry.idempotente,true);assert.equal(rows.ActivosPatrimoniales.length,2);
const second=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-002",numeroSerie:"SN-002",categoriaPatrimonial:"Equipo computacional",marca:"Marca A",modelo:"Modelo A",ubicacionActual:"Bodega",custodioUserId:"U-2"}]});
assert.equal(second.status,"success");assert.equal(rows.ActivosPatrimoniales.length,3);assert.equal(rows.AsignacionesActivos.length,2);assert.equal(rows.ActivosPatrimoniales[2][6],"U-2");
const duplicate=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-003",numeroSerie:"SN-001",categoriaPatrimonial:"Equipo",marca:"Marca",modelo:"Modelo",ubicacionActual:"Bodega"}]});
assert.equal(duplicate.status,"error");assert.match(duplicate.code,/ALREADY_EXISTS/);
const tooMany=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-003",numeroSerie:"SN-003",categoriaPatrimonial:"Equipo",marca:"Marca",modelo:"Modelo",ubicacionActual:"Bodega"}]});
assert.equal(tooMany.status,"error");assert.match(tooMany.code,/QUANTITY_EXCEEDED/);
const noInvoice=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-NO",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-004",numeroSerie:"SN-004",categoriaPatrimonial:"Equipo",marca:"Marca",modelo:"Modelo",ubicacionActual:"Bodega"}]});
assert.equal(noInvoice.status,"error");assert.match(noInvoice.code,/INVOICE_NOT_LINKED/);
const beforeLock=rows.ActivosPatrimoniales.length;lockBusy=true;
const lockResult=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-LOCK",numeroSerie:"SN-LOCK",categoriaPatrimonial:"Equipo",marca:"Marca",modelo:"Modelo",ubicacionActual:"Bodega"}]});
lockBusy=false;assert.equal(lockResult.code,"CONCURRENT_UPDATE_RETRY");assert.equal(rows.ActivosPatrimoniales.length,beforeLock);
const duplicateCode=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-002",numeroSerie:"SN-UNIQUE",categoriaPatrimonial:"Equipo",marca:"Marca",modelo:"Modelo",ubicacionActual:"Bodega"}]});
assert.equal(duplicateCode.status,"error");assert.match(duplicateCode.code,/ALREADY_EXISTS/);
const beforeRollback=rows.ActivosPatrimoniales.length;ctx.failAssignmentWrite=true;
const rollback=ctx.registerAssetsFromPurchaseReceipt({recepcionId:"REC-1",numeroFactura:"INV-001",activos:[{itemId:"IT-1",codigoPatrimonial:"PAT-005",numeroSerie:"SN-005",categoriaPatrimonial:"Equipo",marca:"Marca",modelo:"Modelo",ubicacionActual:"Bodega",custodioUserId:"U-3"}]});
ctx.failAssignmentWrite=false;assert.equal(rollback.status,"error");assert.equal(rows.ActivosPatrimoniales.length,beforeRollback);
const duplicateManual=()=>ctx.manageAssetItem({codigoPatrimonial:"PAT-NEW",nombre:"Equipo",numeroSerie:"SN-001"});
assert.throws(duplicateManual,/ASSET_SERIAL_ALREADY_EXISTS/);
rows.ActivosPatrimoniales.push(["ACT-LEGACY","PAT-LEGACY","Equipo antiguo","Equipo","SN-LEGACY","","","available",""]);
assert.throws(()=>ctx.manageAssetItem({codigoPatrimonial:"PAT-NEW-LEGACY",nombre:"Equipo",numeroSerie:"SN-LEGACY"}),/ASSET_SERIAL_ALREADY_EXISTS/);
const countBefore=rows.ActivosPatrimoniales.length,listed=ctx.getAssetItems({});
assert.equal(listed.activos.length,3);assert.equal(rows.ActivosPatrimoniales.length,countBefore);
const absentCtx={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>({getSheetByName:()=>null})}};vm.createContext(absentCtx);vm.runInContext(extract(source,"getAssetItems"),absentCtx);
assert.deepEqual(JSON.parse(JSON.stringify(absentCtx.getAssetItems({}))),{status:"success",activos:[]});
const damagedRows=JSON.parse(JSON.stringify(rows));damagedRows.RecepcionesCompra[1][5]="EnDisputa";
const damagedSheet={getSheetByName:name=>damagedRows[name]?{getDataRange:()=>({getValues:()=>damagedRows[name]})}:null};
const damagedCtx={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>damagedSheet},purchaseQuotationAccess_:ctx.purchaseQuotationAccess_,purchaseQuotationJsonArray_:ctx.purchaseQuotationJsonArray_,purchaseQuotationItemKey_:ctx.purchaseQuotationItemKey_,normalizePurchaseAwardRole_:ctx.normalizePurchaseAwardRole_,normalizePurchaseAssetClassification_:ctx.normalizePurchaseAssetClassification_};
vm.createContext(damagedCtx);["purchaseAssetReceiptContext_","getPurchaseReceiptAssetCandidates"].forEach(name=>vm.runInContext(extract(source,name),damagedCtx));
assert.equal(damagedCtx.getPurchaseReceiptAssetCandidates({recepcionId:"REC-1"}).candidatos.length,0);
assert.ok(source.includes("clasificacionInventario:a.clasificacionInventario"));assert.ok(source.includes("clasificacionInventario: normalizePurchaseAssetClassification_(item)"));assert.ok(source.includes("const classification=normalizePurchaseAssetClassification_(source)"));
assert.ok(source.includes("item.itemId || item.ItemId"));
assert.ok(client.includes("registerAssetsFromPurchaseReceipt")&&client.includes("submitNewPurchaseRequest")&&client.includes("purchaseAssetJsArg"));
console.log("TASK-182 purchase-to-fixed-assets contract PASS: classification propagation, receipt eligibility, invoice linkage, per-unit serial/code uniqueness, idempotent retries, quantity bounds, custody history, rollback, read-only empty inventory and client flow.");
