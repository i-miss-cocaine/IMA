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
    JSON.stringify([{itemId:"ITEM-1",descripcion:"Silla escolar",unidad:"Unidad",cantidad:2,precioUnitario:50,total:100}]),100,"CC-1",options.state||"Aprobada","U-APPROVER","Adjudicación","U-REQUESTER","1",""];
  const requestHeaders=["SolicitudID","Fecha","Departamento","SolicitanteUserId","Justificacion","Categoria","DetalleItemsJSON","MontoEstimado","CentroCosto","EstadoAprobacion","Observaciones"];
  const request=["REQ-1",new Date(),"DEP-1","U-REQUESTER","Necesidad institucional","Mobiliario","[]",100,"CC-1","Adjudicada",""];
  const supplierHeaders=["ProveedorID","FechaRegistro","NombreProveedor","RTN","Telefono","Email","RubroServicio","Estado","Observaciones"];
  const supplier=["SUP-1",new Date(),"Proveedor Escolar S.A.","08011999123456","2222-0000","ventas@example.test","Mobiliario","Activo",""];
  function makeSheet(rows){
    return {rows,failNextWrite:false,getDataRange(){return{getValues:()=>this.rows.map(row=>row.slice())};},
      getRange(row,col,numRows,numCols){return{
        setValue:value=>{if(this.failNextWrite){this.failNextWrite=false;throw new Error("SHEET_WRITE_FAILED");}while(this.rows.length<row)this.rows.push([]);while(this.rows[row-1].length<col)this.rows[row-1].push("");this.rows[row-1][col-1]=value;},
        setValues:values=>{for(let i=0;i<values.length;i++){while(this.rows.length<row+i)this.rows.push([]);for(let j=0;j<values[i].length;j++)this.rows[row-1+i][col-1+j]=values[i][j];}}
      };},getLastRow(){return this.rows.length;}};
  }
  const sheets={
    OrdenesCompra:makeSheet([headers,order]),
    SolicitudesCompra:makeSheet([requestHeaders,request]),
    ProveedoresActivos:makeSheet([supplierHeaders,supplier])
  };
  const files=Object.create(null);let nextFile=0,created=0,trashed=0;
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
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    DriveApp,HtmlService,MimeType:{PDF:"application/pdf"},
    Utilities:{base64Encode:()=> "UEZERg=="},
    computeDocumentSHA256:()=> "a".repeat(64),
    validateFileBinaryIntegrity:()=>({valid:true,detectedFormat:"pdf"}),
    purchaseQuotationAccess_:()=>({authorized:options.authorized!==false,code:"ROLE_NOT_ALLOWED",actor:{authorized:true,userId:"U-1",role:"Director"},scope:{institutionWide:options.scopeDenied!==true,departmentIds:options.scopeDenied?["OTHER"]:[]}}),
    validateRolePermission:(_actor,action)=>options.permissionDenied?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:
      (["createPurchaseOrder","getPurchaseOrders"].includes(action)?{authorized:true}:{authorized:false}),
    purchaseOrderScopeAccess_:()=>options.scopeDenied?{authorized:false,code:"RESOURCE_NOT_FOUND"}:{authorized:true},
    purchaseQuotationJsonArray_:value=>{try{const parsed=Array.isArray(value)?value:JSON.parse(String(value||"[]"));return Array.isArray(parsed)?parsed:[];}catch(_){return[];}},
    getOrCreateSheet:(ss,name)=>ss.getSheetByName(name),
    Object,Array,String,Number,Date,Math,JSON,Intl,Error,RegExp,isFinite
  };
  vm.createContext(context);
  vm.runInContext('const PURCHASE_ORDER_PDF_COLUMNS_=["CorrelativoPDF","DriveFileIdPDF","SHA256PDF","FechaGeneracionPDF","GeneradoPorPDF"];',context);
  ["ensurePurchaseOrderPdfSchema_","getOrCreatePrivatePurchaseOrderFolder_","rollbackPrivatePurchaseOrderFile_","purchaseOrderPdfEscape_","generatePurchaseOrderPDF","getPurchaseOrderPDFFile"].forEach(name=>vm.runInContext(extract(name),context));
  return {context,sheets,files,folder,stats:()=>({created,trashed})};
}
async function main(){
  assert.doesNotThrow(()=>new vm.Script(source),"ACCOUNTING backend syntax");
  const h=makeHarness();
  const generated=h.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"});
  assert.equal(generated.status,"success");
  assert.equal(generated.estadoOrden,"Emitida");
  assert.match(generated.numeroCorrelativo,/^OC-\d{4}-000001$/);
  const order=h.sheets.OrdenesCompra.rows[1];
  assert.equal(order[9],"Emitida");
  assert.equal(order[15],generated.numeroCorrelativo);
  assert.equal(order[16],"FILE-1");
  assert.equal(h.folder.access,"PRIVATE");
  assert.equal(h.stats().created,1);
  const repeated=h.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"});
  assert.equal(repeated.status,"success");
  assert.equal(repeated.idempotente,true);
  assert.equal(h.stats().created,1);
  const download=h.context.getPurchaseOrderPDFFile({ordenCompraId:"OC-1"});
  assert.equal(download.status,"success");
  assert.equal(download.encoding,"base64");
  assert.equal(download.sha256Hash,"a".repeat(64));

  assert.equal(makeHarness({state:"Borrador"}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"PURCHASE_ORDER_NOT_APPROVED");
  assert.equal(makeHarness({permissionDenied:true}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"ROLE_PERMISSION_DENIED");
  assert.equal(makeHarness({scopeDenied:true}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"RESOURCE_NOT_FOUND");
  assert.equal(makeHarness({folderPublic:true,existingFolder:true}).context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"PURCHASE_ORDER_FOLDER_NOT_PRIVATE");
  const duplicate=makeHarness();duplicate.sheets.OrdenesCompra.rows.push(duplicate.sheets.OrdenesCompra.rows[1].slice());
  assert.equal(duplicate.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"}).code,"RESOURCE_AMBIGUOUS");
  const rollback=makeHarness();rollback.sheets.OrdenesCompra.failNextWrite=true;
  const failed=rollback.context.generatePurchaseOrderPDF({ordenCompraId:"OC-1"});
  assert.equal(failed.status,"error");
  assert.equal(rollback.stats().created,1);
  assert.equal(rollback.stats().trashed,1);
  console.log("Purchase order PDF authorization, approval, private Drive storage, unique correlativo, idempotency, download integrity and rollback contracts passed.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
