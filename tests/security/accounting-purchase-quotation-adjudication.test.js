const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const ch=source[i],next=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(ch==="\\"){escape=true;continue;}if(ch===quote)quote="";continue;}if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source));
const names=["normalizePurchaseAwardRole_","purchaseQuotationItemKey_","purchaseQuotationRound_","purchaseQuotationJsonArray_","purchaseQuotationAccess_","purchaseQuotationRequest_","purchaseQuoteIsValid_","getPurchaseQuotationMatrix","submitPurchaseQuotation","adjudicatePurchaseQuotations"];
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
function sheet(name){return {getDataRange:()=>({getValues:()=>rows[name].map(r=>r.slice())}),getLastRow:()=>rows[name].length,appendRow:r=>rows[name].push(r.slice()),getRange:(row,col,nr=1,nc=1)=>({setValue:v=>{rows[name][row-1][col-1]=v;},clearContent:()=>{for(let y=0;y<nr;y++)for(let x=0;x<nc;x++)if(rows[name][row-1+y])rows[name][row-1+y][col-1+x]="";}})};}
const ss={getSheetByName:n=>rows[n]?sheet(n):null};
let uuid=0,actor={authorized:true,userId:"USR-REVIEWER",role:"Contador"};
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
const matrix=ctx.getPurchaseQuotationMatrix(payload);
assert.equal(matrix.status,"success");assert.equal(matrix.cotizaciones.length,3);assert.equal(matrix.partidas.length,2);
assert.equal(matrix.partidas[0].ofertas.find(x=>x.cotizacionId===q3.cotizacionId).estadoOferta,"PARCIAL");
assert.equal(matrix.partidas[0].ofertas.find(x=>x.cotizacionId===q1.cotizacionId).menorPrecio,true);
const award=ctx.adjudicatePurchaseQuotations({...payload,idempotencyKey:"AWARD-REQ-1-0001",dictamen:"Adjudicación por precio y cumplimiento técnico",justificacion:"Se eligen las ofertas de menor costo total que cumplen las especificaciones.",responsablesEvaluacion:["USR-COMPRAS-1"],adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q1.cotizacionId,cantidadAdjudicada:5},{itemId:"ITEM-B",cotizacionId:q2.cotizacionId,cantidadAdjudicada:2}],ofertasDescartadas:[{cotizacionId:q3.cotizacionId,motivo:"Oferta parcial y costo unitario superior."}]});
assert.equal(award.status,"success");assert.equal(award.ordenes.length,2);assert.equal(rows.OrdenesCompra.length,3);
assert.equal(rows.OrdenesCompra[1][9],"Borrador");assert.equal(rows.OrdenesCompra[1][7],50);assert.equal(rows.OrdenesCompra[2][7],30);
assert.equal(rows.SolicitudesCompra[1][9],"Adjudicada");
assert.ok(rows.ActasAdjudicacionCompra[1][9].includes(q1.cotizacionId),"acta stores immutable quotation snapshot");
const repeated=ctx.adjudicatePurchaseQuotations({...payload,idempotencyKey:"AWARD-REQ-1-0001",dictamen:"Reintento",justificacion:"Reintento de adjudicación con la misma clave.",adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q1.cotizacionId,cantidadAdjudicada:5}]});
assert.equal(repeated.status,"success");assert.equal(repeated.idempotente,true);assert.equal(rows.OrdenesCompra.length,3);
const snapshot=JSON.parse(rows.ActasAdjudicacionCompra[1][9]);assert.equal(snapshot.cotizaciones.find(r=>r[0]===q1.cotizacionId)[5],90);
rows.CotizacionesCompra.find(r=>r[0]===q1.cotizacionId)[5]=999;
assert.equal(JSON.parse(rows.ActasAdjudicacionCompra[1][9]).cotizaciones.find(r=>r[0]===q1.cotizacionId)[5],90,"post-award quote edits do not alter award snapshot");
const request2=["REQ-2",new Date(),"D1","USR-REQ","Segunda compra","Suministros",JSON.stringify(requestItems),1000,"CC-1","Aprobada",""];rows.SolicitudesCompra.push(request2);
const copyQuote=(id,supplier,unitA,unitB)=>{const sourceQ=rows.CotizacionesCompra.find(r=>r[0]===id);rows.CotizacionesCompra.push([id+"-R2","REQ-2",supplier,new Date(),"30 días",unitA*5+unitB*2,4,"Contado","","EnRevision",""]);rows.DetalleCotizacionesCompra.filter(r=>r[1]===id).forEach(r=>{const unit=r[3]==="ITEM-A"?unitA:unitB;rows.DetalleCotizacionesCompra.push(["D-"+id+"-R2",""+id+"-R2","REQ-2",r[3],r[4],r[5],r[6],r[7],unit,unit*r[7],0,0,0,unit*r[7],r[14],r[15],true,new Date()]);});};
copyQuote(q1.cotizacionId,"S1",10,20);copyQuote(q2.cotizacionId,"S2",12,15);
const nonLowest=ctx.adjudicatePurchaseQuotations({sessionToken:"verified",solicitudId:"REQ-2",idempotencyKey:"AWARD-REQ-2-0001",dictamen:"Adjudicación",justificacion:"corta",adjudicaciones:[{itemId:"ITEM-A",cotizacionId:q2.cotizacionId+"-R2",cantidadAdjudicada:5},{itemId:"ITEM-B",cotizacionId:q2.cotizacionId+"-R2",cantidadAdjudicada:2}],ofertasDescartadas:[{cotizacionId:q1.cotizacionId+"-R2",motivo:"Oferta no seleccionada por precio."}]});
assert.equal(nonLowest.status,"error");assert.equal(nonLowest.code,"PURCHASE_AWARD_NON_LOWEST_JUSTIFICATION_REQUIRED");assert.equal(rows.OrdenesCompra.length,3);
actor={authorized:true,userId:"USR-REVIEWER",role:"Empleado"};const denied=ctx.getPurchaseQuotationMatrix(payload);assert.equal(denied.code,"ROLE_NOT_ALLOWED");
console.log("TASK-181 quotation matrix/adjudication contract PASS: line comparison, partial offers, split awards, lowest-price rationale, rejection reasons, immutable snapshot, idempotency and RBAC.");
