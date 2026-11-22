const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
function extract(name){
  const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);
  let depth=0,quote="",escaped=false;
  for(let i=source.indexOf("{",start);i<source.length;i++){
    const ch=source[i];
    if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote="";continue;}
    if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}
    if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("unbalanced "+name);
}
function makeHarness(options={}){
  const headers=["OrdenCompraID","SolicitudID","CotizacionID","ProveedorID","FechaEmision","FechaEntregaEstimada","DetalleItemsJSON","MontoTotal","CentroCosto","EstadoOrden","AprobadoPor","Observaciones","SolicitanteUserId","VersionDocumental","ArchivoPdfUrl"];
  const order=["OC-1","REQ-1","COT-1","SUP-1",new Date("2026-11-20"),new Date("2026-11-30"),
    JSON.stringify([{itemId:"ITEM-1",descripcion:"Silla escolar",unidad:"Unidad",cantidad:2,precioUnitario:50,total:100,partidaCodigo:"5101"}]),100,"CC-1",options.state||"Aprobada","U-APPROVER","Adjudicación","U-REQUESTER","1",""];
  const requestHeaders=["SolicitudID","Fecha","Departamento","SolicitanteUserId","Justificacion","Categoria","DetalleItemsJSON","MontoEstimado","CentroCosto","EstadoAprobacion","Observaciones"];
  const request=["REQ-1",new Date(),"DEP-1","U-REQUESTER","Necesidad institucional","Mobiliario","[]",100,"CC-1",options.requestState||"Adjudicada",""];
  const supplierHeaders=["ProveedorID","FechaRegistro","NombreProveedor","RTN","Telefono","Email","RubroServicio","Estado","Observaciones"];
  const supplier=["SUP-1",new Date(),"Proveedor Escolar S.A.","08011999123456","2222-0000","ventas@example.test","Mobiliario","Activo",""];
  function makeSheet(rows){
    const sheet={rows,failCell:"",getDataRange(){return{getValues:()=>sheet.rows.map(row=>row.slice())};},
      getRange(row,col,numRows,numCols){return{
        setValue:value=>{if(sheet.failCell===row+":"+col){sheet.failCell="";throw new Error("SHEET_WRITE_FAILED");}while(sheet.rows.length<row)sheet.rows.push([]);while(sheet.rows[row-1].length<col)sheet.rows[row-1].push("");sheet.rows[row-1][col-1]=value;},
        setValues:values=>{for(let i=0;i<values.length;i++){while(sheet.rows.length<row+i)sheet.rows.push([]);while(sheet.rows[row-1+i].length<col-1+values[i].length)sheet.rows[row-1+i].push("");for(let j=0;j<values[i].length;j++)sheet.rows[row-1+i][col-1+j]=values[i][j];}}
      };},getLastRow(){return sheet.rows.length;}};
    return sheet;
  }
  const sheets={
    OrdenesCompra:makeSheet([headers,order]),
    SolicitudesCompra:makeSheet([requestHeaders,request]),
    ProveedoresActivos:makeSheet([supplierHeaders,supplier])
  };
  const files=Object.create(null);let nextFile=0,created=0,trashed=0,lockCalls=0,lockReleases=0;
  let permissionActive=options.permissionDenied!==true,scopeActive=options.scopeDenied!==true,actorUserId="U-1",actorRole=options.actorRole||"Director";
  const budgetChecks=[];
  const folder={access:options.folderPublic? "ANYONE":"PRIVATE",files,
    getSharingAccess(){return this.access;},setSharing(access){this.access=access;},
    createFile(blob){created++;const id="FILE-"+(++nextFile);const file={id,name:blob.name,access:"PRIVATE",trashed:false,
      getId(){return this.id;},getName(){return this.name;},getSharingAccess(){return this.access;},
      setSharing(access){this.access=access;},isTrashed(){return this.trashed;},setTrashed(value){this.trashed=value;if(value)trashed++;},
      getMimeType(){return "application/pdf";},getBlob(){return blob;}};files[id]=file;return file;}};
  const rootFolder={getFoldersByName:()=>({hasNext:()=>!!options.existingFolder,next:()=>folder}),
    createFolder:()=>folder};
  const DriveApp={Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},getRootFolder:()=>rootFolder,
    getFileById:id=>files[id]||null};
  const bytes=[37,80,68,70,45,49,46,52,10,37,80,68,70];
  const HtmlService={createHtmlOutput:html=>({getAs:()=>({name:"",setName(name){this.name=name;},getBytes:()=>bytes.slice(),getContentType:()=>"application/pdf"})})};
  const context={
    SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets[name]||null})},
    LockService:{getScriptLock:()=>({tryLock:()=>{lockCalls++;if(lockCalls>1&&options.revokeDownloadPermission)permissionActive=false;if(lockCalls>1&&options.changeActorOnDownload)actorUserId="U-2";if(lockCalls>1&&options.revokeDownloadScope)scopeActive=false;return true;},releaseLock:()=>{lockReleases++;}})},
    DriveApp,HtmlService,MimeType:{PDF:"application/pdf"},
    Utilities:{base64Encode:()=> "JVBERi0xLjQKJVBERg=="},
    computeDocumentSHA256:()=> "a".repeat(64),
    validateFileBinaryIntegrity:(base64)=>({valid:typeof base64==="string"&&!base64.startsWith("data:")&&base64.length>0,detectedFormat:"pdf"}),
    purchaseQuotationAccess_:()=>({authorized:options.authorized!==false,code:"ROLE_NOT_ALLOWED",actor:{authorized:true,userId:actorUserId,role:actorRole},scope:{institutionWide:scopeActive,departmentIds:scopeActive?[]:["OTHER"]}}),
    validateRolePermission:(_actor,action)=>!permissionActive?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:
      (["createPurchaseOrder","getPurchaseOrders"].includes(action)?{authorized:true}:{authorized:false}),
    purchaseOrderScopeAccess_:()=>!scopeActive?{authorized:false,code:"RESOURCE_NOT_FOUND"}:{authorized:true,access:{actor:{authorized:true,userId:actorUserId,role:actorRole}}},
    purchaseQuotationJsonArray_:value=>{try{const parsed=Array.isArray(value)?value:JSON.parse(String(value||"[]"));return Array.isArray(parsed)?parsed:[];}catch(_){return[];}},
    getOrCreateSheet:(ss,name)=>ss.getSheetByName(name),
    supplierEnsureActiveForOrder_:()=>true,
    checkBudgetAvailabilityCore_:(ss,input,scope)=>{budgetChecks.push({input,scope});return options.budgetCheck||{status:"success",disponible:true,alertaUmbral:false,centroCosto:input.centroCosto,partidaCodigo:input.partidaCodigo};},
    Object,Array,String,Number,Date,Math,JSON,Intl,Error,RegExp,isFinite
  };
  vm.createContext(context);
  vm.runInContext('const PURCHASE_ORDER_PDF_COLUMNS_=["CorrelativoPDF","DriveFileIdPDF","SHA256PDF","FechaGeneracionPDF","GeneradoPorPDF","FechaAprobacion","JustificacionAprobacion","AprobadorRol","AlertaPresupuestariaJSON","FechaValidacionPresupuestaria"];',context);
  ["normalizePurchaseAwardRole_","ensurePurchaseOrderPdfSchema_","getOrCreatePrivatePurchaseOrderFolder_","rollbackPrivatePurchaseOrderFile_","purchaseOrderPdfEscape_","approvePurchaseOrder","generatePurchaseOrderPDF","getPurchaseOrderPDFFile"].forEach(name=>vm.runInContext(extract(name),context));
  return {context,sheets,files,folder,budgetChecks,stats:()=>({created,trashed,lockCalls,lockReleases})};
}
async function main(){
  assert.doesNotThrow(()=>new vm.Script(source),"ACCOUNTING backend syntax");
  assert.ok(source.includes('request.action === "approvePurchaseOrder"'),"purchase order approval route is exposed");
  const draft=makeHarness({state:"Borrador"});
  const approved=draft.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"});
  assert.equal(approved.status,"success");
  assert.equal(draft.sheets.OrdenesCompra.rows[1][9],"Aprobada");
  assert.equal(draft.sheets.OrdenesCompra.rows[1][10],"U-1");
  assert.ok(draft.sheets.OrdenesCompra.rows[1][20] instanceof Date);
  assert.equal(draft.sheets.OrdenesCompra.rows[1][21],"Validación de aprobación de compra");
  assert.equal(draft.sheets.OrdenesCompra.rows[1][22],"Director");
  const approvalRetry=draft.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"});
  assert.equal(approvalRetry.idempotente,true);
  assert.equal(makeHarness({state:"Borrador",requestState:"Pendiente"}).context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"}).code,"PURCHASE_REQUEST_NOT_APPROVED");
  const selfApproval=makeHarness({state:"Borrador"});
  selfApproval.sheets.OrdenesCompra.rows[1][12]="U-1";
  assert.equal(selfApproval.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"}).code,"AUTO_APPROVAL_BLOCKED");
  assert.equal(selfApproval.sheets.OrdenesCompra.rows[1][9],"Borrador","self-approval must not change order state");
  const lowValueContador=makeHarness({state:"Borrador",actorRole:"Contador"});
  assert.equal(lowValueContador.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"}).code,"PURCHASE_ORDER_APPROVER_ROLE_REQUIRED");
  const highValueContador=makeHarness({state:"Borrador",actorRole:"Contador"});
  highValueContador.sheets.OrdenesCompra.rows[1][6]=JSON.stringify([{itemId:"ITEM-1",descripcion:"Silla",unidad:"Unidad",cantidad:1,precioUnitario:50000.01,total:50000.01,partidaCodigo:"5101"}]);
  highValueContador.sheets.OrdenesCompra.rows[1][7]=50000.01;
  assert.equal(highValueContador.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"}).code,"HIGH_VALUE_APPROVAL_REQUIRED");
  assert.equal(highValueContador.sheets.OrdenesCompra.rows[1][9],"Borrador","low-level role must not approve a high-value order");
  const highValueDirector=makeHarness({state:"Borrador",actorRole:"Administrador"});
  highValueDirector.sheets.OrdenesCompra.rows[1][6]=JSON.stringify([{itemId:"ITEM-1",descripcion:"Silla",unidad:"Unidad",cantidad:1,precioUnitario:50000.01,total:50000.01,partidaCodigo:"5101"}]);
  highValueDirector.sheets.OrdenesCompra.rows[1][7]=50000.01;
  const highValueDirectorResult=highValueDirector.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"});assert.equal(highValueDirectorResult.status,"success",JSON.stringify(highValueDirectorResult));
  const thresholdCheck={status:"warning",disponible:true,alertaUmbral:true,centroCosto:"CC-1",partidaCodigo:"5101",porcentajeProyectado:85};
  const threshold=makeHarness({state:"Borrador",budgetCheck:thresholdCheck});
  const thresholdWarning=threshold.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"});
  assert.equal(thresholdWarning.status,"warning");
  assert.equal(thresholdWarning.code,"BUDGET_THRESHOLD_CONFIRMATION_REQUIRED");
  assert.equal(threshold.sheets.OrdenesCompra.rows[1][9],"Borrador","threshold alert must be confirmed before approval");
  const thresholdConfirmed=threshold.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra",confirmarAlertaPresupuestaria:true});
  assert.equal(thresholdConfirmed.status,"success");
  assert.equal(JSON.parse(threshold.sheets.OrdenesCompra.rows[1][23]).length,1);
  assert.ok(threshold.sheets.OrdenesCompra.rows[1][24] instanceof Date);
  assert.equal(threshold.budgetChecks[0].input.partidaCodigo,"5101");
  assert.equal(threshold.budgetChecks[0].input.montoSolicitado,100);
  const overrun=makeHarness({state:"Borrador",budgetCheck:{status:"warning",disponible:false,alertaUmbral:false,code:"BUDGET_OVERRUN_BLOCKED"}});
  assert.equal(overrun.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"}).code,"BUDGET_OVERRUN_BLOCKED");
  const missingPart=makeHarness({state:"Borrador"});
  const missingPartItems=JSON.parse(missingPart.sheets.OrdenesCompra.rows[1][6]);delete missingPartItems[0].partidaCodigo;missingPart.sheets.OrdenesCompra.rows[1][6]=JSON.stringify(missingPartItems);
  assert.equal(missingPart.context.approvePurchaseOrder({ordenCompraId:"OC-1",justificacion:"Validación de aprobación de compra"}).code,"PURCHASE_REQUEST_PARTIDA_REQUIRED");
  const missingPdf=makeHarness();
  const originalHeaderWidth=missingPdf.sheets.OrdenesCompra.rows[0].length;
  assert.equal(missingPdf.context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"}).code,"PURCHASE_ORDER_PDF_NOT_FOUND");
  assert.equal(missingPdf.sheets.OrdenesCompra.rows[0].length,originalHeaderWidth,"read-only PDF lookup must not mutate sheet schema");
  const h=makeHarness();
  const generated=h.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"});
  assert.equal(generated.status,"success",JSON.stringify(generated));
  assert.equal(generated.estadoOrden,"Emitida");
  assert.match(generated.numeroCorrelativo,/^OC-\d{4}-000001$/);
  const order=h.sheets.OrdenesCompra.rows[1];
  assert.equal(order[9],"Emitida");
  assert.equal(order[15],generated.numeroCorrelativo);
  assert.equal(order[16],"FILE-1");
  assert.equal(order[17],"a".repeat(64),"stored PDF hash");
  assert.equal(h.folder.access,"PRIVATE");
  assert.equal(h.stats().created,1);
  const repeated=h.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"});
  assert.equal(repeated.status,"success",JSON.stringify(repeated));
  assert.equal(repeated.idempotente,true);
  assert.equal(h.stats().created,1);
  const download=h.context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"});
  assert.equal(download.status,"success",JSON.stringify(download));
  assert.equal(download.encoding,"base64");
  assert.equal(download.sha256Hash,"a".repeat(64));
  assert.equal(h.stats().lockReleases,3,"initial generation, idempotent replay and private download release their script locks");
  const revokedDownload=makeHarness({revokeDownloadPermission:true});
  assert.equal(revokedDownload.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).status,"success");
  assert.equal(revokedDownload.context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"}).code,"ROLE_PERMISSION_DENIED");
  assert.equal(revokedDownload.stats().lockReleases,2);
  const changedActor=makeHarness({changeActorOnDownload:true});
  assert.equal(changedActor.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).status,"success");
  assert.equal(changedActor.context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"}).code,"VERIFIED_IDENTITY_CHANGED");
  const revokedScope=makeHarness({revokeDownloadScope:true});
  assert.equal(revokedScope.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).status,"success");
  assert.equal(revokedScope.context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"}).code,"RESOURCE_NOT_FOUND");
  assert.equal(makeHarness({scopeDenied:true}).context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"}).code,"RESOURCE_NOT_FOUND");

  assert.equal(makeHarness({state:"Borrador"}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"PURCHASE_ORDER_NOT_APPROVED");
  assert.equal(makeHarness({permissionDenied:true}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"ROLE_PERMISSION_DENIED");
  assert.equal(makeHarness({scopeDenied:true}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"RESOURCE_NOT_FOUND");
  assert.equal(makeHarness({folderPublic:true,existingFolder:true}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"PURCHASE_ORDER_FOLDER_NOT_PRIVATE");
  const duplicate=makeHarness();duplicate.sheets.OrdenesCompra.rows.push(duplicate.sheets.OrdenesCompra.rows[1].slice());
  assert.equal(duplicate.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"RESOURCE_AMBIGUOUS");
  const rollback=makeHarness();rollback.sheets.OrdenesCompra.failCell="2:10";
  const failed=rollback.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"});
  assert.equal(failed.status,"error");
  assert.equal(rollback.stats().created,1);
  assert.equal(rollback.stats().trashed,1);
  console.log("Purchase order PDF authorization, approval, private Drive storage, unique correlativo, idempotency, download integrity and rollback contracts passed.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
