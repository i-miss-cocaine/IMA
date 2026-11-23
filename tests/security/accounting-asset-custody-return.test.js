"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape)escape=false;else if(c==="\\")escape=true;else if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c.charCodeAt(0)===96){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8"),client=fs.readFileSync(path.join(root,"js/accounting.js"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source));assert.doesNotThrow(()=>new vm.Script(client));
for(const action of ["assignAssetCustody","getAssetAssignments","returnAssetCustody","getAssetCustodyActPDF"])assert.ok(source.includes('request.action === "'+action+'"'),"missing router action "+action);
for(const role of ["RecursosHumanos","Director","Subdirector","Contador","Administrador"])assert.ok(source.includes('"'+role+'"'),"missing asset custody role "+role);
const constantNames=["ASSET_BASE_HEADERS_","ASSET_ACQUISITION_HEADERS_","ASSET_ASSIGNMENT_HEADERS_","ASSET_RETURN_HEADERS_","ASSET_CUSTODY_EVENT_HEADERS_"];
const constants=constantNames.map(name=>{const start=source.indexOf("const "+name+" = [");assert.ok(start>=0,"missing schema "+name);const end=source.indexOf("];",start);assert.ok(end>=0,"unterminated schema "+name);return source.slice(start,end+2);});
const rows={
 ActivosPatrimoniales:[["ActivoID","CodigoPatrimonial","Nombre","Categoria","SerieModel","UbicacionActual","CustodioUserId","Estado","Observaciones"],["A-1","PAT-001","Laptop institucional","Equipo computacional","SN-001","Bodega","", "Activo",""]],
 AsignacionesActivos:[["AsignacionID","ActivoID","CustodioUserId","FechaEntrega","FechaDevolucion","EstadoActa","Observaciones"]],
 ExpedientesLaborales:[["ExpedienteID","UserId","Departamento","Nombre"],["EXP-1","EMP-1","DEP-A","Empleado Uno"]],
 MantenimientoOrdenes:[]
};
let lastPdfHtml="",uuid=0,lockBusy=false,onWaitLock=null,actor={authorized:true,userId:"DIR-1",role:"Director",institutionId:"INST-1"},denyActions=new Set(),failHistoryWrite=false,files=Object.create(null),folderExists=false;
function makeBlob(bytes,mime,name){return{getBytes:()=>Array.from(bytes),getContentType:()=>mime,setName(v){this.name=v;return this;},getName:()=>name||"acta.pdf"};}
function makeFile(id,name,mime,bytes,initialSharing="PRIVATE"){let trashed=false,sharing=initialSharing,sharingChanges=0;const blob=makeBlob(bytes,mime,name);return{id,getId:()=>id,getName:()=>name,getMimeType:()=>mime,getSize:()=>bytes.length,getBlob:()=>blob,isTrashed:()=>trashed,setTrashed:()=>{trashed=true;},setSharing:(_a,_p)=>{sharingChanges++;sharing="PRIVATE";},getSharingAccess:()=>sharing,getSharingChanges:()=>sharingChanges};}
files["EVIDENCE123456789"]=makeFile("EVIDENCE123456789","foto-recepcion.jpg","image/jpeg",Buffer.from("JPEG-TEST"));
files["SHARED-EVIDENCE-12345"]=makeFile("SHARED-EVIDENCE-12345","shared.jpg","image/jpeg",Buffer.from("JPEG-SHARED"),"ANYONE");
const folder={getSharingAccess:()=>"PRIVATE",setSharing:()=>{},createFile(blob){const id="PDF-"+(++uuid);const file=makeFile(id,blob.name||"acta.pdf","application/pdf",Buffer.from(blob.getBytes()));files[id]=file;return file;}};
const rootFolder={getFoldersByName:()=>({hasNext:()=>folderExists,next:()=>folder}),createFolder:()=>{folderExists=true;return folder;}};
function makeSheet(name){return{
 getDataRange:()=>({getValues:()=>rows[name].map(r=>r.slice())}),
 getLastRow:()=>rows[name].length,
 appendRow:r=>{if(name==="HistorialCustodiaActivos"&&failHistoryWrite)throw Error("INJECTED_HISTORY_FAILURE");rows[name].push(r.slice());},
 deleteRow:r=>rows[name].splice(r-1,1),
 getRange:(row,col,nr=1,nc=1)=>({
  setValue:v=>{while(rows[name].length<row)rows[name].push([]);while(rows[name][row-1].length<col)rows[name][row-1].push("");rows[name][row-1][col-1]=v;},
  setValues:values=>{for(let i=0;i<values.length;i++){while(rows[name].length<row+i)rows[name].push([]);for(let j=0;j<values[i].length;j++)rows[name][row-1+i][col-1+j]=values[i][j];}},
  clearContent:()=>{for(let i=0;i<nr;i++)for(let j=0;j<nc;j++)if(rows[name][row-1+i])rows[name][row-1+i][col-1+j]="";}
 })
};}
const ss={getSheetByName:name=>Object.prototype.hasOwnProperty.call(rows,name)?makeSheet(name):null,insertSheet:name=>{rows[name]=[];return makeSheet(name);}};
const ctx={
 SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>ss},
 LockService:{getScriptLock:()=>({waitLock:()=>{if(onWaitLock){const cb=onWaitLock;onWaitLock=null;cb();}if(lockBusy)throw Error("LOCK_BUSY");},tryLock:()=>!lockBusy,releaseLock:()=>{}})},
 Utilities:{getUuid:()=> "UUID-"+(++uuid),newBlob:(value,mime)=>({getBytes:()=>Array.from(Buffer.from(String(value))),getContentType:()=>mime}),base64Encode:bytes=>Buffer.from(bytes).toString("base64")},
 DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},getRootFolder:()=>rootFolder,getFileById:id=>files[id]||null},
 HtmlService:{createHtmlOutput:html=>{lastPdfHtml=String(html);return{getAs:()=>makeBlob(Buffer.from("%PDF-"+html.slice(0,24)),"application/pdf","acta.pdf")};}},
 MimeType:{PDF:"application/pdf"},
 getVerifiedAccountingIdentity_:()=>Object.assign({},actor),
 validateRolePermission:(_actor,action)=>denyActions.has(action)?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:{authorized:true},
 getVerifiedAccountingDepartmentScope_:()=>({valid:true,authorized:true,institutionWide:false,departmentIds:["DEP-A"]}),
 maintenancePlanAssertAssetScope_:(spreadsheet,_p,_actor,assetId,department)=>{const h=rows.ActivosPatrimoniales[0],id=h.indexOf("ActivoID"),di=h.indexOf("DepartamentoID"),r=rows.ActivosPatrimoniales.slice(1).find(x=>String(x[id])===String(assetId));if(!r||String(r[di]||"")!==String(department))throw Error("RESOURCE_SCOPE_DENIED");return{authorized:true};},
 getOrCreateSheet:(_ss,name)=>{if(!rows[name])rows[name]=[];return makeSheet(name);},
 inventoryEnsureMaintenanceSchema_:sheet=>{const base=["OrdenMaintID","FechaReporte","ActivoIdUbicacion","TipoMantenimiento","DescripcionFalla","Prioridad","ReportadoPorUserId","AsignadoAEmpleadoId","RepuestosConsumidosJSON","CostoEstimado","CostoReal","EstadoOrden","FechaResolucion","Observaciones"];const extra=["DepartamentoID","CentroCosto","AsientoContableID","DetalleRepuestosContabilizadosJSON","UbicacionOrigen","PlanMantenimientoID","CicloMantenimientoID","ChecklistJSON","FechaProgramada","LecturaUsoAlCompletar"];extra.forEach((h,i)=>sheet.getRange(1,base.length+i+1).setValue(h));},
 computeDocumentSHA256:bytes=>crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
 logStructuredEvent:()=>{}
};
vm.createContext(ctx);
const names=["ensureAssetAcquisitionSchema_","assetCustodyNormalizeCondition_","assetCustodyParseList_","assetCustodyResolveEmployee_","assetCustodyAssertDepartment_","assetCustodyFindAsset_","assetCustodyStableKey_","assetCustodyHtmlEscape_","getOrCreatePrivateAssetCustodyFolder_","assetCustodyValidateEvidence_","assetCustodyCreateActPdf_","assetCustodyCreateMaintenanceOrderLocked_","assetCustodyDeleteAppendedRows_","assignAssetCustody","getAssetAssignments","returnAssetCustody","getAssetCustodyActPDF","getAssetItems","assetCustodyReleaseAfterMaintenance_"];
vm.runInContext(constants.join("\n")+"\n"+names.map(n=>extract(source,n)).join("\n"),ctx);
function payload(extra={}){return Object.assign({activoId:"A-1",custodioUserId:"EMP-1",ubicacionEntrega:"Bodega A",estadoFisicoEntrega:"Bueno",accesoriosEntregados:["Cargador"],firmaEntrega:"Empleado Uno",receptorUserId:"DIR-1",estadoFisico:"Bueno",condicionRecepcion:"Bueno",ubicacionRecepcion:"Bodega General",accesoriosRecibidos:["Cargador"],observaciones:"Recepción verificada",firmaRecepcion:"Director Uno",evidenciasJSON:["EVIDENCE123456789"]},extra);}
const assigned=ctx.assignAssetCustody(payload());
assert.equal(assigned.status,"success");assert.ok(assigned.asignacionId);
let assetHeaders=rows.ActivosPatrimoniales[0],assetRow=rows.ActivosPatrimoniales[1];
assert.equal(assetRow[assetHeaders.indexOf("CustodioUserId")],"EMP-1");assert.equal(assetRow[assetHeaders.indexOf("Estado")],"assigned");assert.equal(assetRow[assetHeaders.indexOf("DepartamentoID")],"DEP-A");
assert.equal(rows.AsignacionesActivos.length,2);assert.equal(rows.HistorialCustodiaActivos.length,2);
const assetList=ctx.getAssetItems({});assert.equal(assetList.status,"success");assert.equal(assetList.activos[0].activoId,"A-1");assert.equal(assetList.activos[0].custodioUserId,"EMP-1");assert.equal(assetList.activos[0].asignacionActivaId,assigned.asignacionId);
const assignments=ctx.getAssetAssignments({activoId:"A-1"});assert.equal(assignments.total,1);assert.equal(assignments.asignaciones[0].asignacionId,assigned.asignacionId);
const firstReturnPayload=payload({asignacionId:assigned.asignacionId});
const returned=ctx.returnAssetCustody(firstReturnPayload);
assert.equal(returned.status,"success");assert.equal(returned.estadoActivo,"available");assert.ok(returned.actaFileId);assert.ok(returned.sha256Hash);
assetRow=rows.ActivosPatrimoniales[1];assert.equal(assetRow[assetHeaders.indexOf("CustodioUserId")],"");assert.equal(assetRow[assetHeaders.indexOf("Estado")],"available");assert.equal(assetRow[assetHeaders.indexOf("UbicacionActual")],"Bodega General");
const assignmentRow=rows.AsignacionesActivos[1],assignmentHeaders=rows.AsignacionesActivos[0];assert.equal(assignmentRow[assignmentHeaders.indexOf("EstadoAsignacion")],"Devuelta");assert.ok(assignmentRow[assignmentHeaders.indexOf("FechaDevolucion")]);
assert.equal(rows.DevolucionesActivos.length,2);assert.equal(rows.HistorialCustodiaActivos.length,3);
assert.ok(lastPdfHtml.includes("Responsable DIR-1"),"formal act must identify the authenticated receiver");
assert.throws(()=>ctx.assetCustodyValidateEvidence_(["SHARED-EVIDENCE-12345"]),/ASSET_CUSTODY_EVIDENCE_NOT_PRIVATE/,"shared evidence must be rejected without changing its permissions");
assert.equal(files["SHARED-EVIDENCE-12345"].getSharingAccess(),"ANYONE");assert.equal(files["SHARED-EVIDENCE-12345"].getSharingChanges(),0,"evidence validation must not mutate a caller-owned Drive file");
const duplicate=ctx.returnAssetCustody(firstReturnPayload);assert.equal(duplicate.idempotente,true);assert.equal(rows.DevolucionesActivos.length,2,"identical return retry must not append a second return");
assert.throws(()=>ctx.returnAssetCustody(payload({asignacionId:assigned.asignacionId,ubicacionRecepcion:"Otra bodega"})),/ASSET_CUSTODY_ACTIVE_ASSIGNMENT_REQUIRED/,"a changed duplicate return must be rejected");
const pdf=ctx.getAssetCustodyActPDF({devolucionId:returned.devolucionId});assert.equal(pdf.status,"success");assert.equal(pdf.mimeType,"application/pdf");assert.equal(pdf.encoding,"base64");assert.ok(pdf.fileData.length>0);assert.equal(files[returned.actaFileId].getSharingAccess(),"PRIVATE");
assert.equal(ctx.getAssetAssignments({activoId:"A-1"}).asignaciones[0].devolucion.estado,"Aceptada");
assert.throws(()=>ctx.returnAssetCustody(payload({asignacionId:"UNKNOWN",receptorUserId:"EMP-1"})),/ASSET_CUSTODY_RECEIVER_MUST_BE_VERIFIED_USER/);
assert.throws(()=>ctx.returnAssetCustody(payload({asignacionId:"UNKNOWN",evidenciasJSON:[]})),/ASSET_CUSTODY_EVIDENCE_REQUIRED/);
const secondAssign=ctx.assignAssetCustody(payload({ubicacionEntrega:"Bodega B",accesoriosEntregados:["Cable"]}));
assert.equal(secondAssign.status,"success");
const damagedPayload=payload({asignacionId:secondAssign.asignacionId,estadoFisico:"Dañado",condicionRecepcion:"Dañado",accesoriosRecibidos:[]});
const returnsBeforeFailedWrite=rows.DevolucionesActivos.length,historyBeforeFailedWrite=rows.HistorialCustodiaActivos.length,assignmentsBeforeFailedWrite=rows.AsignacionesActivos.length,maintenanceBeforeFailedWrite=rows.MantenimientoOrdenes.length;
failHistoryWrite=true;assert.throws(()=>ctx.returnAssetCustody(damagedPayload),/ASSET_CUSTODY_RETURN_ATOMIC_FAILURE/);failHistoryWrite=false;
assert.equal(rows.DevolucionesActivos.length,returnsBeforeFailedWrite,"failed return must not persist a return ledger row");assert.equal(rows.HistorialCustodiaActivos.length,historyBeforeFailedWrite,"failed return must not persist a custody event");assert.equal(rows.AsignacionesActivos.length,assignmentsBeforeFailedWrite,"failed return must preserve active assignment");assert.equal(rows.MantenimientoOrdenes.length,maintenanceBeforeFailedWrite+1,"only the maintenance header may be initialized after failed write");
assetRow=rows.ActivosPatrimoniales[1];assert.equal(assetRow[assetHeaders.indexOf("Estado")],"assigned","failed return must restore asset status");
const damaged=ctx.returnAssetCustody(damagedPayload);
assert.equal(damaged.estadoActivo,"maintenance");assert.ok(damaged.ordenMantenimientoId);assert.equal(rows.MantenimientoOrdenes.length,maintenanceBeforeFailedWrite+2);
assetRow=rows.ActivosPatrimoniales[1];assert.equal(assetRow[assetHeaders.indexOf("Estado")],"maintenance");assert.equal(rows.DevolucionesActivos.length,3);assert.equal(rows.HistorialCustodiaActivos.length,5);
assert.throws(()=>ctx.assignAssetCustody(payload()),/ASSET_NOT_AVAILABLE_FOR_ASSIGNMENT/,"assets under maintenance cannot be reassigned");
const maintenancePdf=ctx.getAssetCustodyActPDF({devolucionId:damaged.devolucionId});assert.equal(maintenancePdf.status,"success");
const historyBeforeRelease=rows.HistorialCustodiaActivos.length;
failHistoryWrite=true;assert.throws(()=>ctx.assetCustodyReleaseAfterMaintenance_(ss,"A-1",damaged.ordenMantenimientoId,actor,{departmentId:"DEP-A"}),/ASSET_CUSTODY_MAINTENANCE_RELEASE_ATOMIC_FAILURE/);failHistoryWrite=false;
assert.equal(rows.ActivosPatrimoniales[1][assetHeaders.indexOf("Estado")],"maintenance","failed maintenance release must restore maintenance state");assert.equal(rows.HistorialCustodiaActivos.length,historyBeforeRelease,"failed maintenance release must not append history");
assert.throws(()=>ctx.assetCustodyReleaseAfterMaintenance_(ss,"A-1",damaged.ordenMantenimientoId,actor,{departmentId:"DEP-B"}),/RESOURCE_SCOPE_DENIED/,"maintenance completion cannot release an asset from another department");
const released=ctx.assetCustodyReleaseAfterMaintenance_(ss,"A-1",damaged.ordenMantenimientoId,actor,{departmentId:"DEP-A"});assert.equal(released.status,"success");assert.equal(rows.ActivosPatrimoniales[1][assetHeaders.indexOf("Estado")],"available");assert.equal(rows.HistorialCustodiaActivos.length,historyBeforeRelease+1);
const postMaintenanceAssignment=ctx.assignAssetCustody(payload({ubicacionEntrega:"Bodega C",accesoriosEntregados:["Cable"]}));assert.equal(postMaintenanceAssignment.status,"success","asset becomes assignable only after maintenance is completed");
const postMaintenanceReturn=ctx.returnAssetCustody(payload({asignacionId:postMaintenanceAssignment.asignacionId,ubicacionRecepcion:"Bodega General",accesoriosRecibidos:["Cable"]}));assert.equal(postMaintenanceReturn.estadoActivo,"available");
const beforeAssignment=rows.AsignacionesActivos.length,beforeHistory=rows.HistorialCustodiaActivos.length,assetBefore=rows.ActivosPatrimoniales[1].slice();
assetRow[assetHeaders.indexOf("Estado")]="available";assetRow[assetHeaders.indexOf("CustodioUserId")]="";rows.ActivosPatrimoniales[1]=assetRow;
failHistoryWrite=true;assert.throws(()=>ctx.assignAssetCustody(payload({custodioUserId:"EMP-1"})),/ASSET_CUSTODY_ASSIGNMENT_ATOMIC_FAILURE/);failHistoryWrite=false;
assert.equal(rows.AsignacionesActivos.length,beforeAssignment);assert.equal(rows.HistorialCustodiaActivos.length,beforeHistory);assert.equal(rows.ActivosPatrimoniales[1][assetHeaders.indexOf("CustodioUserId")],"","assignment failure must restore asset custody");
const lockRows=rows.AsignacionesActivos.length;lockBusy=true;assert.throws(()=>ctx.assignAssetCustody(payload()),/LOCK_BUSY/);lockBusy=false;assert.equal(rows.AsignacionesActivos.length,lockRows);
const identityRows=rows.AsignacionesActivos.length;onWaitLock=()=>{actor={authorized:true,userId:"EVIL",role:"Director",institutionId:"INST-1"};};assert.throws(()=>ctx.assignAssetCustody(payload()),/VERIFIED_IDENTITY_CHANGED/);actor={authorized:true,userId:"DIR-1",role:"Director",institutionId:"INST-1"};assert.equal(rows.AsignacionesActivos.length,identityRows);
const returnStateBeforeLock=rows.DevolucionesActivos.length;lockBusy=true;assert.throws(()=>ctx.returnAssetCustody(payload({asignacionId:secondAssign.asignacionId})),/LOCK_BUSY/);lockBusy=false;assert.equal(rows.DevolucionesActivos.length,returnStateBeforeLock,"return lock contention must not write");
onWaitLock=()=>{actor={authorized:true,userId:"EVIL",role:"Director",institutionId:"INST-1"};};assert.throws(()=>ctx.returnAssetCustody(payload({asignacionId:secondAssign.asignacionId})),/VERIFIED_IDENTITY_CHANGED/);actor={authorized:true,userId:"DIR-1",role:"Director",institutionId:"INST-1"};assert.equal(rows.DevolucionesActivos.length,returnStateBeforeLock,"return must revalidate identity after acquiring lock");
denyActions.add("returnAssetCustody");const deniedReturn=ctx.returnAssetCustody(payload());assert.equal(deniedReturn.code,"ROLE_PERMISSION_DENIED");denyActions.clear();
actor={authorized:true,userId:"DIR-1",role:"Director",institutionId:"INST-1"};
process.stdout.write("Accounting asset custody: authorized assignment, append-only history, private return acta, idempotent duplicate rejection, maintenance escalation, department scope, lock/identity revalidation and atomic rollback PASS.\n");
