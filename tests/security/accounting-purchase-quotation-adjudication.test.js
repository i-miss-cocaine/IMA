const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const ch=source[i],next=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(ch==="\\"){escape=true;continue;}if(ch===quote)quote="";continue;}if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source));
const names=["normalizePurchaseAwardRole_","purchaseQuotationItemKey_","purchaseQuotationRound_","purchaseQuotationJsonArray_","purchaseQuotationJsonObject_","purchaseQuotationSheetSchemaValid_","purchaseQuotationAccess_","purchaseQuotationRequest_","purchaseQuoteIsValid_","getPurchaseQuotationMatrix","submitPurchaseQuotation","adjudicatePurchaseQuotations"];
const code=names.map(n=>extract(source,n)).join("\n");
const headers={
 SolicitudesCompra:["SolicitudID","Fecha","Departamento","SolicitanteUserId","Justificacion","Categoria","DetalleItemsJSON","MontoEstimado","CentroCosto","EstadoAprobacion","Observaciones"],
 CotizacionesCompra:["CotizacionID","SolicitudID","ProveedorID","FechaRecepcion","VigenciaOferta","PrecioTotal","PlazoEntregaDias","CondicionesPago","DocumentoAdjuntoUrl","EstadoSelection","Observaciones"],
 DetalleCotizacionesCompra:["DetalleCotizacionID","CotizacionID","SolicitudID","ItemId","Descripcion","Unidad","CantidadSolicitada","CantidadCotizada","PrecioUnitario","Subtotal","Descuento","Impuestos","Flete","Total","Garantia","CumplimientoTecnico","EspecificacionesCumplidas","FechaRegistro"],
 ActasAdjudicacionCompra:["ActaID","SolicitudID","Fecha","ResponsablesEvaluacionJSON","Dictamen","Justificacion","MontoAdjudicado","DetalleAdjudicacionJSON","OfertasDescartadasJSON","SnapshotCotizacionesJSON","Estado","AdjudicadoPor","IdempotencyKey","OrdenesCompraJSON"],
 ProveedoresActivos:["ProveedorID","FechaRegistro","NombreProveedor","RTN","Telefono","Email","RubroServicio","Estado","Observaciones"],
 OrdenesCompra:["OrdenCompraID","SolicitudID","CotizacionID","ProveedorID","FechaEmision","FechaEntregaEstimada","DetalleItemsJSON","MontoTotal","CentroCosto","EstadoOrden","AprobadoPor","Observaciones","SolicitanteUserId","VersionDocumental","ArchivoPdfUrl"]
};
const rows={};Object.keys(headers).forEach(k=>rows[k]=[headers[k]]);
const requestItems=[{itemId:"ITEM-A",descripcion:"Papel bond",unidad:"Resma",cantidad:5,especificaciones:"75 g/m2"},{itemId:"ITEM-B",descripcion:"Tóner",unidad:"Unidad",cantidad:2,especificaciones:"Compatible"}];
rows.SolicitudesCompra.push(["REQ-1",new Date(),"D1","USR-REQ","Reposición de materiales","Suministros",JSON.stringify(requestItems),1000,"CC-1","Aprobada",""]);
["S1","S2","S3"].forEach((id,i)=>rows.ProveedoresActivos.push([id,new Date(),"Proveedor "+id,"","","","General","Activo",""]));
function sheet(name){return {getDataRange:()=>({getValues:()=>rows[name].map(r=>r.slice())}),getLastRow:()=>rows[name].length,appendRow:r=>{if(name==="DetalleCotizacionesCompra"){detailAppendCount++;if(failDetailAppendAt===detailAppendCount){failDetailAppendAt=0;throw new Error("SIMULATED_DETAIL_WRITE_FAILURE");}}rows[name].push(r.slice());},getRange:(row,col,nr=1,nc=1)=>({setValue:v=>{if(name==="SolicitudesCompra"&&col===10&&v==="Adjudicada"&&failRequestStatusWriteOnce){failRequestStatusWriteOnce=false;throw new Error("SIMULATED_REQUEST_STATUS_WRITE_FAILURE");}rows[name][row-1][col-1]=v;},clearContent:()=>{for(let y=0;y<nr;y++)for(let x=0;x<nc;x++)if(rows[name][row-1+y])rows[name][row-1+y][col-1+x]="";}})};}
const ss={getSheetByName:n=>rows[n]?sheet(n):null};
let uuid=0,failRequestStatusWriteOnce=false,failDetailAppendAt=0,detailAppendCount=0,actor={authorized:true,userId:"USR-REVIEWER",role:"Contador"};
const ctx={SpreadsheetApp:{openById:()=>ss},SPREADSHEET_ID:"TEST",Utilities:{getUuid:()=>"UUID-"+(++uuid)},LockService:{getScriptLock:()=>({tryLock:()=>true,waitLock:()=>{},releaseLock:()=>{}})},getVerifiedAccountingIdentity_:()=>actor,getVerifiedAccountingDepartmentScope_:()=>({authorized:true,institutionWide:false,departmentIds:["D1"]}),getOrCreateSheet:(spreadsheet,name)=>{if(!rows[name])rows[name]=[headers[name]];return sheet(name);}};
vm.createContext(ctx);vm.runInContext(code,ctx);
const payload={sessionToken:"verified",solicitudId:"REQ-1"};
const makeLines=(a,b)=>[
 {itemId:"ITEM-A",cantidadCotizada:5,precioUnitario:a,especificacionesCumplidas:true,cumplimientoTecnico:"Cumple",garantia:"12 meses"},
 {itemId:"ITEM-B",cantidadCotizada:2,precioUnitario:b,especificacionesCumplidas:true,cumplimientoTecnico:"Cumple",garantia:"6 meses"}
];
const q1=ctx.submitPurchaseQuotation({...payload,proveedorId:"S1",precioTotal:90,detalleItems:makeLines(10,20),plazoEntregaDias:5,condicionesPago:"30 días"});
assert.equal(q1.status,"success");assert.equal(q1.partidasRegistradas,2);
const q2=ctx.submitPurchaseQuotation({...payload,proveedorId:"S2",precioTotal:90,detalleItems:makeLines(12,15),plazoEntregaDias:3,condicionesPago:"Crédito 30 días"});
assert.equal(q2.status,"success");
const q3=ctx.submitPurchaseQuotation({...payload,proveedorId:"S3",precioTotal:30,detalleItems:[{itemId:"ITEM-A",cantidadCotizada:2,precioUnitario:15,especificacionesCumplidas:true,cumplimientoTecnico:"Cumple"}]});
assert.equal(q3.status,"success");
rows.CotizacionesCompra.find(r=>r[0]===q3.cotizacionId)[3]=new Date(Date.now()-10*86400000);rows.CotizacionesCompra.find(r=>r[0]===q3.cotizacionId)[4]="1 día";
const matrix=ctx.getPurchaseQuotationMatrix(payload);
assert.equal(matrix.status,"success");assert.equal(matrix.cotizaciones.length,3);assert.ok(matrix.cotizaciones.some(q=>q.proveedorNombre==="Proveedor S1"),"matrix includes the first supplier regardless of display order");assert.equal(matrix.partidas.length,2);
assert.equal(matrix.partidas[0].ofertas.find(x=>x.cotizacionId===q3.cotizacionId).estadoOferta,"PARCIAL");assert.equal(matrix.cotizaciones.find(x=>x.cotizacionId===q3.cotizacionId).vigente,false,"expired quotations are visible but not selectable");
assert.equal(matrix.partidas[0].ofertas.find(x=>x.cotizacionId===q1.cotizacionId).menorPrecio,true);
const award=ctx.adjudicatePurchaseQuotations({...payload,idempotencyKey:"AWARD-REQ-1-0001",dictamen:"Adjudicación por precio y cumplimiento técnico",justificacion:"Se eligen las ofertas de menor costo total que cumplen las especificaciones.",responsablesEvaluacion:["USR-COMPRAS-1"],adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q1.cotizacionId,cantidadAdjudicada:5},{itemId:"ITEM-B",cotizacionId:q2.cotizacionId,cantidadAdjudicada:2}],ofertasDescartadas:[{cotizacionId:q3.cotizacionId,motivo:"Oferta parcial y costo unitario superior."}]});
assert.equal(award.status,"success");assert.equal(award.ordenes.length,2);assert.equal(rows.OrdenesCompra.length,3);
assert.equal(rows.OrdenesCompra[1][9],"Borrador");assert.equal(rows.OrdenesCompra[1][7],50);assert.equal(rows.OrdenesCompra[2][7],30);const awardedOrderLine=JSON.parse(rows.OrdenesCompra[1][6])[0];assert.equal(awardedOrderLine.condicionesPago,"30 días");assert.equal(awardedOrderLine.plazoEntregaDias,5);
assert.equal(rows.SolicitudesCompra[1][9],"Adjudicada");assert.equal(rows.CotizacionesCompra.find(r=>r[0]===q1.cotizacionId)[9],"AdjudicadaParcial");assert.equal(rows.CotizacionesCompra.find(r=>r[0]===q2.cotizacionId)[9],"AdjudicadaParcial");
assert.ok(rows.ActasAdjudicacionCompra[1][9].includes(q1.cotizacionId),"acta stores immutable quotation snapshot");
const repeated=ctx.adjudicatePurchaseQuotations({...payload,idempotencyKey:"AWARD-REQ-1-0001",dictamen:"Reintento",justificacion:"Reintento de adjudicación con la misma clave.",adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q1.cotizacionId,cantidadAdjudicada:5}]});
assert.equal(repeated.status,"success");assert.equal(repeated.idempotente,true);assert.equal(rows.OrdenesCompra.length,3);
const snapshot=JSON.parse(rows.ActasAdjudicacionCompra[1][9]);assert.equal(snapshot.cotizaciones.find(r=>r[0]===q1.cotizacionId)[5],90);
rows.CotizacionesCompra.find(r=>r[0]===q1.cotizacionId)[5]=999;
assert.equal(JSON.parse(rows.ActasAdjudicacionCompra[1][9]).cotizaciones.find(r=>r[0]===q1.cotizacionId)[5],90,"post-award quote edits do not alter award snapshot");const frozenMatrix=ctx.getPurchaseQuotationMatrix(payload);assert.equal(frozenMatrix.cotizaciones.find(q=>q.cotizacionId===q1.cotizacionId).precioTotal,90,"matrix reads the award snapshot, not a later edited quotation");assert.equal(frozenMatrix.adjudicacion.montoAdjudicado,80);assert.ok(frozenMatrix.adjudicacion.responsablesEvaluacion.includes("USR-REVIEWER"));assert.equal(frozenMatrix.cotizaciones.find(q=>q.cotizacionId===q1.cotizacionId).estadoSelection,"AdjudicadaParcial");
const request2=["REQ-2",new Date(),"D1","USR-REQ","Segunda compra","Suministros",JSON.stringify(requestItems),1000,"CC-1","Aprobada",""];rows.SolicitudesCompra.push(request2);
const copyQuote=(id,supplier,unitA,unitB)=>{const sourceQ=rows.CotizacionesCompra.find(r=>r[0]===id);rows.CotizacionesCompra.push([id+"-R2","REQ-2",supplier,new Date(),"30 días",unitA*5+unitB*2,4,"Contado","","EnRevision",""]);rows.DetalleCotizacionesCompra.filter(r=>r[1]===id).forEach(r=>{const unit=r[3]==="ITEM-A"?unitA:unitB;rows.DetalleCotizacionesCompra.push(["D-"+id+"-R2",""+id+"-R2","REQ-2",r[3],r[4],r[5],r[6],r[7],unit,unit*r[7],0,0,0,unit*r[7],r[14],r[15],true,new Date()]);});};
copyQuote(q1.cotizacionId,"S1",10,20);copyQuote(q2.cotizacionId,"S2",12,15);
const nonLowest=ctx.adjudicatePurchaseQuotations({sessionToken:"verified",solicitudId:"REQ-2",idempotencyKey:"AWARD-REQ-2-0001",dictamen:"Adjudicación",justificacion:"corta",adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q2.cotizacionId+"-R2",cantidadAdjudicada:5},{itemId:"ITEM-B",cotizacionId:q2.cotizacionId+"-R2",cantidadAdjudicada:2}],ofertasDescartadas:[{cotizacionId:q1.cotizacionId+"-R2",motivo:"Oferta no seleccionada por precio."}]});
assert.equal(nonLowest.status,"error");assert.equal(nonLowest.code,"PURCHASE_AWARD_NON_LOWEST_JUSTIFICATION_REQUIRED");assert.equal(rows.OrdenesCompra.length,3);

// One quotation line cannot be allocated above the supplier's quoted quantity, even when split into duplicate allocation rows.
rows.SolicitudesCompra.push(["REQ-3",new Date(),"D1","USR-REQ","Tercera compra","Suministros",JSON.stringify([{...requestItems[0],cantidad:6},requestItems[1]]),1000,"CC-1","Aprobada",""]);
const q4=ctx.submitPurchaseQuotation({sessionToken:"verified",solicitudId:"REQ-3",proveedorId:"S1",precioTotal:90,detalleItems:makeLines(10,20)}),q5=ctx.submitPurchaseQuotation({sessionToken:"verified",solicitudId:"REQ-3",proveedorId:"S2",precioTotal:90,detalleItems:makeLines(12,15)});
assert.equal(q4.status,"success");assert.equal(q5.status,"success");
const overAllocated=ctx.adjudicatePurchaseQuotations({sessionToken:"verified",solicitudId:"REQ-3",idempotencyKey:"AWARD-REQ-3-0001",dictamen:"Dictamen de prueba",justificacion:"Se seleccionan las mejores ofertas disponibles.",adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q4.cotizacionId,cantidadAdjudicada:3},{itemId:"ITEM-A",cotizacionId:q4.cotizacionId,cantidadAdjudicada:3},{itemId:"ITEM-B",cotizacionId:q5.cotizacionId,cantidadAdjudicada:2}]});
assert.equal(overAllocated.status,"error");assert.equal(overAllocated.code,"PURCHASE_AWARD_QUOTE_QUANTITY_EXCEEDED");
// Simulate a late write failure after orders, acta and quotation states have been prepared; the whole award must roll back.
rows.SolicitudesCompra.push(["REQ-4",new Date(),"D1","USR-REQ","Cuarta compra","Suministros",JSON.stringify(requestItems),1000,"CC-1","Aprobada",""]);
const q6=ctx.submitPurchaseQuotation({sessionToken:"verified",solicitudId:"REQ-4",proveedorId:"S1",precioTotal:90,detalleItems:makeLines(10,20)}),q7=ctx.submitPurchaseQuotation({sessionToken:"verified",solicitudId:"REQ-4",proveedorId:"S2",precioTotal:90,detalleItems:makeLines(12,15)});
assert.equal(q6.status,"success");assert.equal(q7.status,"success");
failRequestStatusWriteOnce=true;
const rollback=ctx.adjudicatePurchaseQuotations({sessionToken:"verified",solicitudId:"REQ-4",idempotencyKey:"AWARD-REQ-4-0001",dictamen:"Dictamen de adjudicación",justificacion:"Se seleccionan ofertas conformes y competitivas.",adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q6.cotizacionId,cantidadAdjudicada:5},{itemId:"ITEM-B",cotizacionId:q7.cotizacionId,cantidadAdjudicada:2}]});
assert.equal(rollback.status,"error");assert.equal(rows.SolicitudesCompra.find(r=>r[0]==="REQ-4")[9],"Aprobada");
assert.equal(rows.CotizacionesCompra.find(r=>r[0]===q6.cotizacionId)[9],"EnRevision");assert.equal(rows.CotizacionesCompra.find(r=>r[0]===q7.cotizacionId)[9],"EnRevision");
assert.equal(rows.ActasAdjudicacionCompra.some(r=>r[1]==="REQ-4"),false);assert.ok(rows.OrdenesCompra.slice(3).every(r=>r.every(v=>v==="")),"failed award clears partially written purchase orders");


// A partial detail write must clear both the quotation header and already-appended line rows.
rows.SolicitudesCompra.push(["REQ-5",new Date(),"D1","USR-REQ","Quinta compra","Suministros",JSON.stringify(requestItems),1000,"CC-1","Aprobada",""]);
const detailRowsBefore=rows.DetalleCotizacionesCompra.length,quoteRowsBefore=rows.CotizacionesCompra.length;
failDetailAppendAt=detailAppendCount+2;
const partialSave=ctx.submitPurchaseQuotation({sessionToken:"verified",solicitudId:"REQ-5",proveedorId:"S3",precioTotal:90,detalleItems:makeLines(10,20)});
assert.equal(partialSave.status,"error");assert.equal(partialSave.code,"SIMULATED_DETAIL_WRITE_FAILURE");
assert.equal(rows.CotizacionesCompra.length,quoteRowsBefore+1);assert.equal(rows.CotizacionesCompra.at(-1)[0],"");
assert.equal(rows.DetalleCotizacionesCompra.length,detailRowsBefore+1);assert.equal(rows.DetalleCotizacionesCompra.at(-1)[1],"","partial quotation detail row was cleared");

actor={authorized:true,userId:"USR-REVIEWER",role:"Empleado"};const denied=ctx.getPurchaseQuotationMatrix(payload);assert.equal(denied.code,"ROLE_NOT_ALLOWED");
console.log("TASK-181 quotation matrix/adjudication contract PASS: line comparison, partial offers, split awards, lowest-price rationale, rejection reasons, immutable snapshot, idempotency and RBAC.");
