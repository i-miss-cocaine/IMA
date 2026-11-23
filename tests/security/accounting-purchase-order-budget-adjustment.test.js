const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
function extract(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);let depth=0,quote="",escaped=false;for(let i=source.indexOf("{",start);i<source.length;i++){const ch=source[i];if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote="";continue;}if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw new Error("unbalanced "+name);}
function makeSheet(rows,options={}){const sheet={rows:rows.map(r=>r.slice()),failValues:options.failValues===true,failAppendAfterWrite:options.failAppendAfterWrite===true,getDataRange(){return{getValues:()=>sheet.rows.map(r=>r.slice())};},getRange(row,col){return{setValue(value){while(sheet.rows.length<row)sheet.rows.push([]);while(sheet.rows[row-1].length<col)sheet.rows[row-1].push("");sheet.rows[row-1][col-1]=value;},setValues(values){if(sheet.failValues){sheet.failValues=false;throw new Error("SIMULATED_SET_FAILURE");}for(let i=0;i<values.length;i++){while(sheet.rows.length<row+i)sheet.rows.push([]);while(sheet.rows[row+i-1].length<col-1+values[i].length)sheet.rows[row+i-1].push("");for(let j=0;j<values[i].length;j++)sheet.rows[row+i-1][col-1+j]=values[i][j];}}};},getLastRow(){return sheet.rows.length;},appendRow(row){sheet.rows.push(row.slice());if(sheet.failAppendAfterWrite){sheet.failAppendAfterWrite=false;throw new Error("SIMULATED_APPEND_FAILURE");}},deleteRow(row){sheet.rows.splice(row-1,1);}};return sheet;}
function makeHarness(options={}){
 const budgetHeaders=["PresupuestoID","AnoID","CentroCosto","PartidaCodigo","MontoAprobado","MontoComprometido","MontoEjecutado","Estado","UmbralAlertaPct","FechaActualizacion","ActualizadoPor","Version"];
 const commitmentHeaders=["CompromisoID","PresupuestoID","OrdenCompraID","AnoID","CentroCosto","PartidaCodigo","Monto","Estado","IdempotencyKey","PayloadHash","FechaCreacion","CreadoPor","FechaLiberacion","MotivoLiberacion","ActualizadoPor","Version","SobregiroAutorizadoPor","FechaAutorizacionSobregiro","JustificacionSobregiro"];
 const orderHeaders=["OrdenCompraID","SolicitudID","ProveedorID","DetalleItemsJSON","MontoTotal","EstadoOrden","AprobadoPor","SolicitanteUserId","CentroCosto","FechaEmision","VersionDocumental"];
 const items=[{itemId:"I-1",descripcion:"Silla",unidad:"Unidad",cantidad:2,precioUnitario:50,total:100,partidaCodigo:"5101"},{itemId:"I-2",descripcion:"Mesa",unidad:"Unidad",cantidad:1,precioUnitario:20,total:20,partidaCodigo:"5201"}];
 const order=["OC-1","REQ-1","SUP-1",JSON.stringify(items),120,options.state||"Aprobada","U-APP","U-REQ","CC-1",new Date("2026-11-20"),"1"];
 const sheets={
  OrdenesCompra:makeSheet([orderHeaders,order],{failValues:options.failOrderWrite}),
  PresupuestosInstitucionales:makeSheet([budgetHeaders,
   ["PRE-1","2026","CC-1","5101",1000,100,0,"Aprobado",0,new Date(),"U-1",1],
   ["PRE-2","2026","CC-1","5201",1000,20,0,"Aprobado",0,new Date(),"U-1",1]]),
  CompromisosPresupuestarios:makeSheet([commitmentHeaders,
   ["CMP-1","PRE-1","OC-1","2026","CC-1","5101",100,"Comprometido","PO:OC-1:PRE-1","H1",new Date(),"U-1","","","U-1",1,"","",""],
   ["CMP-2","PRE-2","OC-1","2026","CC-1","5201",20,"Comprometido","PO:OC-1:PRE-2","H2",new Date(),"U-1","","","U-1",1,"","",""]])
 };
 const ss={getSheetByName:name=>sheets[name]||null,insertSheet:name=>{sheets[name]=makeSheet([[]],{failAppendAfterWrite:options.failAuditAppendAfterWrite});return sheets[name];}};
 let uuid=0,lockCalls=0,lockReleases=0,logs=[];
 const context={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({tryLock:()=>{lockCalls++;return !options.lockBusy;},releaseLock:()=>{lockReleases++;}})},
  getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||spreadsheet.insertSheet(name),
  purchaseQuotationAccess_:()=>({authorized:options.authorized!==false,code:"ROLE_NOT_ALLOWED",actor:{userId:"U-DIR",role:options.role||"Director"},scope:{institutionWide:true,departmentIds:[]}}),
  validateRolePermission:(_actor,action)=>options.permissionDenied?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:(action==="adjustPurchaseOrderCommitment"?{authorized:true}:{authorized:false,code:"ROLE_PERMISSION_DENIED"}),
  purchaseOrderScopeAccess_:()=>options.scopeDenied?{authorized:false,code:"RESOURCE_NOT_FOUND"}:{authorized:true},
  purchaseQuotationJsonArray_:value=>{try{const x=Array.isArray(value)?value:JSON.parse(String(value||"[]"));return Array.isArray(x)?x:[];}catch(_){return[];}},
  migrationStableJson_:value=>JSON.stringify(value),migrationHash_:value=>{let h=5381;for(let i=0;i<String(value).length;i++)h=((h<<5)+h)^String(value).charCodeAt(i);return String(h>>>0);},
  budgetLogEvent_:(...args)=>logs.push(args),Utilities:{getUuid:()=>String(++uuid).padStart(8,"0")},
  Object,Array,String,Number,Date,Math,JSON,RegExp,Error,isFinite
 };
 vm.createContext(context);
 vm.runInContext('const PURCHASE_ORDER_PDF_COLUMNS_=["CorrelativoPDF","DriveFileIdPDF","SHA256PDF","FechaGeneracionPDF","GeneradoPorPDF","FechaAprobacion","JustificacionAprobacion","AprobadorRol","AlertaPresupuestariaJSON","FechaValidacionPresupuestaria","CompromisosPresupuestariosJSON","FechaCompromisoPresupuestario","EstadoCompromisoPresupuestario","CanceladaPor","FechaCancelacion","JustificacionCancelacion"];',context);
 ["normalizePurchaseAwardRole_","ensurePurchaseOrderPdfSchema_","ensureBudgetSchema_","ensureBudgetCommitmentSchema_","ensureBudgetCommitmentAdjustmentSchema_","adjustPurchaseOrderCommitment"].forEach(name=>vm.runInContext(extract(name),context));
 return{context,sheets,logs,stats:()=>({lockCalls,lockReleases})};
}
function request(){return{ordenCompraId:"OC-1",detalleItems:[{itemId:"I-1",cantidad:1},{itemId:"I-2",cantidad:1}],justificacion:"Reducción autorizada por ajuste de necesidad",idempotencyKey:"ADJ-OC-1-0001"};}
function main(){
 assert.doesNotThrow(()=>new vm.Script(source),"ACCOUNTING backend syntax");
 assert.ok(source.includes('request.action === "adjustPurchaseOrderCommitment"'),"adjustment route exposed");
 const h=makeHarness(),payload=request(),result=h.context.adjustPurchaseOrderCommitment(payload);
 assert.equal(result.status,"success",JSON.stringify(result));assert.equal(result.montoAnterior,120);assert.equal(result.montoNuevo,70);assert.equal(result.montoLiberado,50);
 assert.equal(h.sheets.OrdenesCompra.rows[1][4],70);assert.equal(JSON.parse(h.sheets.OrdenesCompra.rows[1][3])[0].cantidad,1);
 assert.equal(h.sheets.PresupuestosInstitucionales.rows[1][5],50);assert.equal(h.sheets.PresupuestosInstitucionales.rows[2][5],20);
 assert.equal(h.sheets.CompromisosPresupuestarios.rows[1][6],50);assert.equal(h.sheets.CompromisosPresupuestarios.rows[1][7],"Comprometido");
 const audit=h.sheets.AjustesCompromisosPresupuestarios;assert.equal(audit.rows.length,2);assert.equal(audit.rows[1][6],50);assert.equal(JSON.parse(audit.rows[1][16])[0].partidaCodigo,"5101");
 const replay=h.context.adjustPurchaseOrderCommitment(payload);assert.equal(replay.status,"success");assert.equal(replay.idempotente,true);assert.equal(audit.rows.length,2);
 const conflict=h.context.adjustPurchaseOrderCommitment({...payload,justificacion:"Otra justificación válida"});assert.equal(conflict.code,"BUDGET_COMMITMENT_ADJUSTMENT_IDEMPOTENCY_CONFLICT");
 assert.equal(makeHarness({role:"Contador"}).context.adjustPurchaseOrderCommitment(payload).code,"PURCHASE_ORDER_ADJUSTMENT_ROLE_REQUIRED");
 assert.equal(makeHarness({permissionDenied:true}).context.adjustPurchaseOrderCommitment(payload).code,"ROLE_PERMISSION_DENIED");
 assert.equal(makeHarness({scopeDenied:true}).context.adjustPurchaseOrderCommitment(payload).code,"RESOURCE_NOT_FOUND");
 assert.equal(makeHarness({state:"Emitida"}).context.adjustPurchaseOrderCommitment(payload).code,"PURCHASE_ORDER_ADJUSTMENT_STATE_BLOCKED");
 assert.equal(makeHarness({lockBusy:true}).context.adjustPurchaseOrderCommitment(payload).code,"CONCURRENT_UPDATE_RETRY");
 const increase=makeHarness().context.adjustPurchaseOrderCommitment({...payload,detalleItems:[{itemId:"I-1",cantidad:3},{itemId:"I-2",cantidad:1}],idempotencyKey:"ADJ-OC-1-0002"});
 assert.equal(increase.code,"PURCHASE_ORDER_ADJUSTMENT_MUST_ONLY_REDUCE_QUANTITY");
 const receipt=makeHarness();receipt.sheets.RecepcionesCompra=makeSheet([["OrdenCompraID"],["OC-1"]]);
 assert.equal(receipt.context.adjustPurchaseOrderCommitment({...payload,idempotencyKey:"ADJ-OC-1-0003"}).code,"PURCHASE_ORDER_ADJUSTMENT_HAS_RECEIPT_OR_INVOICE");
 const invoice=makeHarness();invoice.sheets.CuentasPorPagarGastos=makeSheet([["OrdenCompraID"],["OC-1"]]);
 assert.equal(invoice.context.adjustPurchaseOrderCommitment({...payload,idempotencyKey:"ADJ-OC-1-0004"}).code,"PURCHASE_ORDER_ADJUSTMENT_HAS_RECEIPT_OR_INVOICE");
 const writeFailure=makeHarness({failOrderWrite:true}),failed=writeFailure.context.adjustPurchaseOrderCommitment(payload);
 assert.equal(failed.status,"error");assert.equal(writeFailure.sheets.OrdenesCompra.rows[1][4],120);assert.equal(writeFailure.sheets.PresupuestosInstitucionales.rows[1][5],100);assert.equal(writeFailure.sheets.CompromisosPresupuestarios.rows[1][6],100);
 const appendFailure=makeHarness({failAuditAppendAfterWrite:true}),appendFailed=appendFailure.context.adjustPurchaseOrderCommitment(payload);
 assert.equal(appendFailed.status,"error");assert.equal(appendFailure.sheets.OrdenesCompra.rows[1][4],120);assert.equal(appendFailure.sheets.PresupuestosInstitucionales.rows[1][5],100);assert.equal(appendFailure.sheets.CompromisosPresupuestarios.rows[1][6],100);assert.equal(appendFailure.sheets.AjustesCompromisosPresupuestarios.rows.length,1);
 assert.ok(h.logs.some(x=>x[2]==="BUDGET_COMMITMENT_ADJUSTED"));
 console.log("Purchase order budget reduction contract PASS: Director/Admin gate, item-level reductions only, unexecuted commitment release, audit/idempotency, scope, receipt/invoice boundary, concurrency and rollback.");
}
main();
