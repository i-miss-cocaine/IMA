const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
const userSource=fs.readFileSync(path.join(root,"backend/user-service/Code.gs"),"utf8");
function extract(name){
  const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);
  const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;
  for(let i=open;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==="\n")line=false;continue;}
    if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
    if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote="";continue;}
    if(ch==="/"&&next==="/"){line=true;i++;continue;}
    if(ch==="/"&&next==="*"){block=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}
    if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("unbalanced "+name);
}
const budgetHeaders=["PresupuestoID","AnoID","CentroCosto","PartidaCodigo","MontoAprobado","MontoComprometido","MontoEjecutado","Estado","UmbralAlertaPct","FechaActualizacion","ActualizadoPor","Version"];
const commitmentHeaders=["CompromisoID","PresupuestoID","OrdenCompraID","AnoID","CentroCosto","PartidaCodigo","Monto","Estado","IdempotencyKey","PayloadHash","FechaCreacion","CreadoPor","FechaLiberacion","MotivoLiberacion","ActualizadoPor","Version","SobregiroAutorizadoPor","FechaAutorizacionSobregiro","JustificacionSobregiro"];
const executionHeaders=["EjecucionID","PresupuestoID","OrdenCompraID","ObligacionID","FacturaHash","PartidaCodigo","Monto","DetalleItemsJSON","IdempotencyKey","PayloadHash","FechaRegistro","RegistradoPor"];
function makeSheet(rows,options={}){
  const sheet={rows:rows.map(r=>r.slice()),failAppend:options.failAppend===true,failSetValues:options.failSetValues===true,
    getDataRange(){return{getValues:()=>sheet.rows.map(r=>r.slice())};},
    getLastRow(){return sheet.rows.length;},
    getRange(row,col){
      return{setValue(value){while(sheet.rows.length<row)sheet.rows.push([]);while(sheet.rows[row-1].length<col)sheet.rows[row-1].push("");sheet.rows[row-1][col-1]=value;},
        setValues(values){if(sheet.failSetValues){sheet.failSetValues=false;throw new Error("SIMULATED_SET_VALUES_FAILURE");}values.forEach((line,i)=>{while(sheet.rows.length<row+i)sheet.rows.push([]);while(sheet.rows[row-1+i].length<col-1+line.length)sheet.rows[row-1+i].push("");line.forEach((v,j)=>sheet.rows[row-1+i][col-1+j]=v);});}};
    },
    appendRow(row){sheet.rows.push(row.slice());if(sheet.failAppend){sheet.failAppend=false;throw new Error("SIMULATED_APPEND_FAILURE");}},
    deleteRow(row){if(row===sheet.rows.length)sheet.rows.pop();else sheet.rows.splice(row-1,1);}
  };
  return sheet;
}
function makeHarness(options={}){
  let uuid=0,identityCalls=0,lockCalls=0,lockReleases=0;
  const legacyBudgetHeaders=budgetHeaders.slice(0,8);
  const budgets=makeSheet([legacyBudgetHeaders],{});
  const sheets={PresupuestosInstitucionales:budgets};
  const ss={getSheetByName:name=>sheets[name]||null,insertSheet:name=>{if(sheets[name])throw new Error("SHEET_ALREADY_EXISTS");sheets[name]=makeSheet([[]],{failAppend:options.failExecutionAppend===true});return sheets[name];}};
  const context={
    SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById:()=>ss},
    LockService:{getScriptLock:()=>({tryLock:()=>{lockCalls++;return options.lockBusy!==true;},releaseLock:()=>{lockReleases++;}})},
    Utilities:{getUuid:()=>"UUID-"+(++uuid)},
    getOrCreateSheet:(_ss,name)=>{
      if(!sheets[name]){
        const headers=name==="PresupuestosInstitucionales"?budgetHeaders:name==="CompromisosPresupuestarios"?commitmentHeaders:name==="EjecucionesPresupuestarias"?executionHeaders:[];
        sheets[name]=makeSheet([headers],{failAppend:options.failLedgerAppend===true&&name==="CompromisosPresupuestarios"});
      }
      return sheets[name];
    },
    getVerifiedAccountingIdentity_:()=>{
      identityCalls++;
      if(options.identityDenied)return{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
      return{authorized:true,userId:options.changeActorAfterLock&&identityCalls>1?"U-2":"U-1",role:"Director"};
    },
    validateRolePermission:(_actor,action)=>options.permissionDenied?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:{authorized:true,action},
    getVerifiedAccountingDepartmentScope_:()=>options.scopeDenied?{valid:false,code:"DEPARTMENT_SCOPE_UNVERIFIED"}:
      {valid:true,institutionWide:options.institutionWide===true,departmentIds:options.departmentIds||["D1"]},
    migrationStableJson_:value=>JSON.stringify(value),
    logs:[],
    logStructuredEvent:(service,fn,severity,code,message,payload,role)=>context.logs.push({service,fn,severity,code,message,payload,role}),
    migrationHash_:value=>crypto.createHash("sha256").update(String(value)).digest("hex"),
    Object,Array,String,Number,Date,Math,JSON,Error,RegExp,isFinite,parseInt
  };
  vm.createContext(context);
  const names=["budgetLogEvent_","budgetAccess_","budgetScopeAllows_","ensureBudgetSchema_","ensureBudgetCommitmentSchema_","budgetRecordFromRow_","getBudgetRowsCore_",
    "getBudgets","saveBudgetPlan","getBudgetExecutionReport","checkBudgetAvailabilityCore_","checkBudgetAvailability","reserveBudgetCommitmentLocked_","restoreReleasedBudgetCommitmentsLocked_","releaseBudgetCommitmentLocked_","reservePurchaseOrderBudgetCommitmentsLocked_","ensureBudgetExecutionSchema_","restoreBudgetExecutionLocked_","recordBudgetExecutionLocked_","purchaseQuotationJsonArray_","purchaseInvoiceStoredItems_"];
  vm.runInContext(names.map(extract).join("\n")+"\nthis.api={get:getBudgets,save:saveBudgetPlan,report:getBudgetExecutionReport,check:checkBudgetAvailability,checkCore:checkBudgetAvailabilityCore_,reserve:reserveBudgetCommitmentLocked_,release:releaseBudgetCommitmentLocked_,reserveOrder:reservePurchaseOrderBudgetCommitmentsLocked_,recordExecution:recordBudgetExecutionLocked_};",context);
  return{api:context.api,sheets,ss,logs:context.logs,stats:()=>({identityCalls,lockCalls,lockReleases})};
}
function main(){
  assert.doesNotThrow(()=>new vm.Script(source),"ACCOUNTING backend syntax");
  const actions=["getBudgets","saveBudgetPlan","getBudgetExecutionReport","checkBudgetAvailability"];
  const catalogStart=userSource.indexOf("const PERMISSION_MATRIX_ACTION_CATALOG_=");
  const catalogEnd=userSource.indexOf(";\n",catalogStart);
  assert.ok(catalogStart>=0&&catalogEnd>catalogStart,"permission matrix catalog is present");
  const catalog=JSON.parse(userSource.slice(catalogStart+"const PERMISSION_MATRIX_ACTION_CATALOG_=".length,catalogEnd));
  actions.forEach(action=>assert.ok(catalog.ACCOUNTING.includes(action),"missing matrix action "+action));
  actions.forEach(action=>assert.ok(source.includes('"'+action+'"'),"missing static role action "+action));

  const h=makeHarness();
  const created=h.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:1000,umbralAlertaPct:80});
  assert.equal(created.status,"success",JSON.stringify(created));
  assert.equal(created.version,1);
  assert.ok(h.logs.some(entry=>entry.code==="BUDGET_PLAN_CREATED"),"budget plan creation must be auditable");
  const schemaHeader=h.sheets.PresupuestosInstitucionales.rows[0];
  assert.deepEqual(schemaHeader,budgetHeaders,"legacy eight-column budget sheet is migrated append-only");
  const budgetId=created.presupuestoId;
  const list=h.api.get({sessionToken:"S",anoId:"2026"});
  assert.equal(list.status,"success");
  assert.equal(list.data.length,1);
  assert.equal(list.data[0].presupuestoId,budgetId);
  assert.equal(list.data[0].montoAprobado,1000);
  const available=h.api.check({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:700});
  assert.equal(available.status,"success");
  assert.equal(available.disponible,true);
  const threshold=h.api.check({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:850});
  assert.equal(threshold.status,"warning");
  assert.equal(threshold.code,"BUDGET_THRESHOLD_ALERT");
  assert.equal(threshold.alertaUmbral,true);
  assert.ok(h.logs.some(entry=>entry.code==="BUDGET_THRESHOLD_ALERT"),"threshold alerts must be logged");
  assert.ok(h.stats().lockReleases>=1);
  const overrun=h.api.check({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:1001});
  assert.equal(overrun.disponible,false);
  assert.equal(overrun.code,"BUDGET_OVERRUN_BLOCKED");
  assert.ok(h.logs.some(entry=>entry.code==="BUDGET_OVERRUN_BLOCKED"),"budget blocks must be logged");
  const report=h.api.report({sessionToken:"S",anoId:"2026"});
  assert.equal(report.status,"success");
  assert.equal(report.report.totals.montoAprobado,1000);
  assert.equal(report.report.totals.montoComprometido,0);
  assert.equal(report.report.totals.montoEjecutado,0);
  assert.equal(report.report.totals.montoDisponible,1000);
  const updated=h.api.save({sessionToken:"S",presupuestoId:budgetId,anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:900,umbralAlertaPct:90});
  assert.equal(updated.status,"success");
  assert.equal(updated.version,2);
  assert.equal(h.sheets.PresupuestosInstitucionales.rows[1][5],0,"budget plan update must preserve committed amount");
  assert.equal(h.sheets.PresupuestosInstitucionales.rows[1][6],0,"budget plan update must preserve executed amount");

  const reserveInput={presupuestoId:budgetId,ordenCompraId:"OC-1",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:600,idempotencyKey:"OC-1:PRE-1"};
  const reserved=h.api.reserve(h.ss,reserveInput,"U-1");
  assert.equal(reserved.status,"success",JSON.stringify(reserved));
  assert.ok(h.logs.some(entry=>entry.code==="BUDGET_COMMITMENT_RESERVED"),"commitment reservations must be logged");
  assert.equal(h.sheets.PresupuestosInstitucionales.rows[1][5],600);
  assert.equal(h.sheets.CompromisosPresupuestarios.rows.length,2);
  const replay=h.api.reserve(h.ss,reserveInput,"U-1");
  assert.equal(replay.idempotente,true);
  assert.equal(h.sheets.PresupuestosInstitucionales.rows[1][5],600);
  assert.equal(h.sheets.CompromisosPresupuestarios.rows.length,2,"idempotent reservation does not duplicate ledger row");
  const conflict=h.api.reserve(h.ss,{...reserveInput,monto:550},"U-1");
  assert.equal(conflict.code,"BUDGET_COMMITMENT_IDEMPOTENCY_CONFLICT");
  const secondOrder=h.api.reserve(h.ss,{...reserveInput,ordenCompraId:"OC-2",idempotencyKey:"OC-2:PRE-1",monto:350},"U-1");
  assert.equal(secondOrder.code,"BUDGET_OVERRUN_BLOCKED","concurrent reservations cannot exceed remaining availability");
  assert.equal(h.sheets.PresupuestosInstitucionales.rows[1][5],600);
  const afterReserve=h.api.report({sessionToken:"S",anoId:"2026"});
  assert.equal(afterReserve.report.totals.montoComprometido,600);
  assert.equal(afterReserve.report.totals.montoDisponible,300);
  const lowerPlan=h.api.save({sessionToken:"S",presupuestoId:budgetId,anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:500});
  assert.equal(lowerPlan.code,"BUDGET_AMOUNT_BELOW_COMMITTED_EXECUTED");

  const releaseHarness=makeHarness();
  const releaseBudget=releaseHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:1000});
  const releaseReservation=releaseHarness.api.reserve(releaseHarness.ss,{presupuestoId:releaseBudget.presupuestoId,ordenCompraId:"OC-REL",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:300,idempotencyKey:"PO:OC-REL:PRE"},"U-1");
  assert.equal(releaseReservation.status,"success");
  const released=releaseHarness.api.release(releaseHarness.ss,"OC-REL","Cancelación autorizada de orden","U-1");
  assert.equal(released.status,"success");
  assert.equal(released.released.length,1);
  assert.equal(releaseHarness.sheets.PresupuestosInstitucionales.rows[1][5],0);
  assert.equal(releaseHarness.sheets.CompromisosPresupuestarios.rows[1][7],"Liberado");
  const releaseReplay=releaseHarness.api.release(releaseHarness.ss,"OC-REL","Cancelación autorizada de orden","U-1");
  assert.equal(releaseReplay.idempotente,true);
  assert.equal(releaseHarness.sheets.PresupuestosInstitucionales.rows[1][5],0);
  const invalidRelease=releaseHarness.api.release(releaseHarness.ss,"OC-REL","no","U-1");
  assert.equal(invalidRelease.code,"BUDGET_COMMITMENT_RELEASE_INPUT_INVALID");

  const reserveOrderHarness=makeHarness();
  const orderBudget=reserveOrderHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:1000});
  const orderCheck=reserveOrderHarness.api.checkCore(reserveOrderHarness.ss,{anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:1},{institutionWide:true});
  const orderReserve=reserveOrderHarness.api.reserveOrder(reserveOrderHarness.ss,"OC-BATCH","2026","D1",{"5101":60000},{"5101":orderCheck},"U-1");
  assert.equal(orderReserve.status,"success",JSON.stringify(orderReserve));
  assert.equal(reserveOrderHarness.sheets.PresupuestosInstitucionales.rows[1][5],600);
  const orderOverrun=reserveOrderHarness.api.reserveOrder(reserveOrderHarness.ss,"OC-BATCH-2","2026","D1",{"5101":50000},{"5101":orderCheck},"U-1");
  assert.equal(orderOverrun.code,"BUDGET_OVERRUN_BLOCKED");
  assert.equal(reserveOrderHarness.sheets.PresupuestosInstitucionales.rows[1][5],600);

  const multiPartHarness=makeHarness();
  const partOne=multiPartHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:1000});
  const partTwo=multiPartHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5102",montoAprobado:500});
  const partOneCheck=multiPartHarness.api.checkCore(multiPartHarness.ss,{anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:1},{institutionWide:true});
  const partTwoCheck=multiPartHarness.api.checkCore(multiPartHarness.ss,{anoId:"2026",centroCosto:"D1",partidaCodigo:"5102",montoSolicitado:1},{institutionWide:true});
  const multiPartReserve=multiPartHarness.api.reserveOrder(multiPartHarness.ss,"OC-MULTI","2026","D1",{"5101":25000,"5102":12500},{"5101":partOneCheck,"5102":partTwoCheck},"U-1");
  assert.equal(multiPartReserve.status,"success",JSON.stringify(multiPartReserve));
  assert.equal(multiPartHarness.sheets.PresupuestosInstitucionales.rows[1][5],250);
  assert.equal(multiPartHarness.sheets.PresupuestosInstitucionales.rows[2][5],125);
  const multiPartRelease=multiPartHarness.api.release(multiPartHarness.ss,"OC-MULTI","Cancelación de orden multi-partida","U-1");
  assert.equal(multiPartRelease.status,"success");
  assert.equal(multiPartHarness.sheets.PresupuestosInstitucionales.rows[1][5],0);
  assert.equal(multiPartHarness.sheets.PresupuestosInstitucionales.rows[2][5],0);
  const partialRollbackHarness=makeHarness();
  const partialBudget=partialRollbackHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:100});
  const partialCheck=partialRollbackHarness.api.checkCore(partialRollbackHarness.ss,{anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:1},{institutionWide:true});
  const partialRollback=partialRollbackHarness.api.reserveOrder(partialRollbackHarness.ss,"OC-PARTIAL","2026","D1",{"5101":5000,"5102":1000},{"5101":partialCheck,"5102":{disponible:true}},"U-1");
  assert.equal(partialRollback.code,"BUDGET_COMMITMENT_INPUT_INVALID");
  assert.equal(partialRollbackHarness.sheets.PresupuestosInstitucionales.rows[1][5],0,"a later invalid part rolls back earlier reservations");
  assert.equal(partialRollbackHarness.sheets.CompromisosPresupuestarios.rows[1][7],"Liberado","partial reservation is compensated in the ledger");
  assert.ok(partOne.presupuestoId&&partTwo.presupuestoId);

  const executionHarness=makeHarness();
  const executionBudgetA=executionHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:1000});
  const executionBudgetB=executionHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5102",montoAprobado:500});
  assert.equal(executionHarness.api.reserve(executionHarness.ss,{presupuestoId:executionBudgetA.presupuestoId,ordenCompraId:"OC-EXEC",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:500,idempotencyKey:"OC-EXEC:PRE-A"},"U-1").status,"success");
  assert.equal(executionHarness.api.reserve(executionHarness.ss,{presupuestoId:executionBudgetB.presupuestoId,ordenCompraId:"OC-EXEC",anoId:"2026",centroCosto:"D1",partidaCodigo:"5102",monto:100,idempotencyKey:"OC-EXEC:PRE-B"},"U-1").status,"success");
  const executionOrderHeaders=["OrdenCompraID","DetalleItemsJSON","EstadoCompromisoPresupuestario"];
  const executionOrder=["OC-EXEC",JSON.stringify([{itemId:"I-1",partidaCodigo:"5101",cantidad:5,precioUnitario:100,total:500},{itemId:"I-2",partidaCodigo:"5102",cantidad:2,precioUnitario:50,total:100}]),"Comprometido"];
  const executionInvoiceHeaders=["ObligacionID","Importe","Impuestos","TotalMonto","Observaciones","FacturaHash"];
  const executionInvoice=["CXP-EXEC-1",250,25,275,'[ITEMS_JSON:[{"itemId":"I-1","cantidad":2,"precioUnitario":100},{"itemId":"I-2","cantidad":1,"precioUnitario":50}]]',"HASH-EXEC-1"];
  const execution=executionHarness.api.recordExecution(executionHarness.ss,executionOrder,executionOrderHeaders,executionInvoice,executionInvoiceHeaders,"CXP-EXEC-1","U-1");
  assert.equal(execution.status,"success",JSON.stringify(execution));
  assert.equal(execution.executions.length,2);
  assert.equal(executionHarness.sheets.PresupuestosInstitucionales.rows[1][5],280);
  assert.equal(executionHarness.sheets.PresupuestosInstitucionales.rows[1][6],220);
  assert.equal(executionHarness.sheets.PresupuestosInstitucionales.rows[2][5],45);
  assert.equal(executionHarness.sheets.PresupuestosInstitucionales.rows[2][6],55);
  assert.equal(executionHarness.sheets.CompromisosPresupuestarios.rows[1][6],280);
  assert.equal(executionHarness.sheets.CompromisosPresupuestarios.rows[2][6],45);
  assert.equal(executionHarness.sheets.EjecucionesPresupuestarias.rows.length,3);
  const executionReplay=executionHarness.api.recordExecution(executionHarness.ss,executionOrder,executionOrderHeaders,executionInvoice,executionInvoiceHeaders,"CXP-EXEC-1","U-1");
  assert.equal(executionReplay.idempotente,true);
  assert.equal(executionHarness.sheets.PresupuestosInstitucionales.rows[1][6],220);
  const duplicateQuantityInvoice=["CXP-EXEC-2",450,45,495,'[ITEMS_JSON:[{"itemId":"I-1","cantidad":4,"precioUnitario":100},{"itemId":"I-2","cantidad":1,"precioUnitario":50}]]',"HASH-EXEC-2"];
  assert.equal(executionHarness.api.recordExecution(executionHarness.ss,executionOrder,executionOrderHeaders,duplicateQuantityInvoice,executionInvoiceHeaders,"CXP-EXEC-2","U-1").code,"BUDGET_EXECUTION_QUANTITY_EXCEEDS_ORDER");
  const executionOverrunInvoice=["CXP-EXEC-3",300,30,330,'[ITEMS_JSON:[{"itemId":"I-1","cantidad":3,"precioUnitario":100}]]',"HASH-EXEC-3"];
  assert.equal(executionHarness.api.recordExecution(executionHarness.ss,executionOrder,executionOrderHeaders,executionOverrunInvoice,executionInvoiceHeaders,"CXP-EXEC-3","U-1").code,"BUDGET_EXECUTION_EXCEEDS_COMMITMENT");

  const executionRollbackHarness=makeHarness({failExecutionAppend:true});
  const executionRollbackBudget=executionRollbackHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:1000});
  executionRollbackHarness.api.reserve(executionRollbackHarness.ss,{presupuestoId:executionRollbackBudget.presupuestoId,ordenCompraId:"OC-EXEC-RB",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:500,idempotencyKey:"OC-EXEC-RB:PRE"},"U-1");
  const rollbackOrder=["OC-EXEC-RB",JSON.stringify([{itemId:"I-1",partidaCodigo:"5101",cantidad:5,precioUnitario:100,total:500}]),"Comprometido"];
  const rollbackInvoice=["CXP-EXEC-RB",200,20,220,'[ITEMS_JSON:[{"itemId":"I-1","cantidad":2,"precioUnitario":100}]]',"HASH-EXEC-RB"];
  const executionWriteFailure=executionRollbackHarness.api.recordExecution(executionRollbackHarness.ss,rollbackOrder,executionOrderHeaders,rollbackInvoice,executionInvoiceHeaders,"CXP-EXEC-RB","U-1");
  assert.equal(executionWriteFailure.code,"SIMULATED_APPEND_FAILURE");
  assert.equal(executionRollbackHarness.sheets.PresupuestosInstitucionales.rows[1][5],500);
  assert.equal(executionRollbackHarness.sheets.PresupuestosInstitucionales.rows[1][6],0);
  assert.equal(executionRollbackHarness.sheets.CompromisosPresupuestarios.rows[1][6],500);
  assert.equal(executionRollbackHarness.sheets.EjecucionesPresupuestarias.rows.length,1);

  const overrunHarness=makeHarness();
  const overrunBudget=overrunHarness.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:100});
  const blockedOverrun=overrunHarness.api.reserve(overrunHarness.ss,{presupuestoId:overrunBudget.presupuestoId,ordenCompraId:"OC-OVR-1",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:150,idempotencyKey:"OC-OVR-1:PRE"},"U-1");
  assert.equal(blockedOverrun.code,"BUDGET_OVERRUN_BLOCKED");
  const wrongRoleOverrun=overrunHarness.api.reserve(overrunHarness.ss,{presupuestoId:overrunBudget.presupuestoId,ordenCompraId:"OC-OVR-2",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:150,idempotencyKey:"OC-OVR-2:PRE",autorizarSobregiroPresupuestaria:true,actorRole:"Contador",justificacionSobregiro:"Excepción documentada"},"U-1");
  assert.equal(wrongRoleOverrun.code,"BUDGET_OVERRUN_ROLE_REQUIRED");
  const missingReasonOverrun=overrunHarness.api.reserve(overrunHarness.ss,{presupuestoId:overrunBudget.presupuestoId,ordenCompraId:"OC-OVR-3",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:150,idempotencyKey:"OC-OVR-3:PRE",autorizarSobregiroPresupuestaria:true,actorRole:"Director",justificacionSobregiro:""},"U-1");
  assert.equal(missingReasonOverrun.code,"BUDGET_OVERRUN_REASON_REQUIRED");
  const authorizedOverrun=overrunHarness.api.reserve(overrunHarness.ss,{presupuestoId:overrunBudget.presupuestoId,ordenCompraId:"OC-OVR-4",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:150,idempotencyKey:"OC-OVR-4:PRE",autorizarSobregiroPresupuestaria:true,actorRole:"Director",justificacionSobregiro:"Excepción extraordinaria autorizada"},"U-1");
  assert.equal(authorizedOverrun.status,"success",JSON.stringify(authorizedOverrun));
  assert.equal(overrunHarness.sheets.PresupuestosInstitucionales.rows[1][5],150);
  assert.equal(overrunHarness.sheets.CompromisosPresupuestarios.rows[1][16],"U-1");
  assert.ok(overrunHarness.sheets.CompromisosPresupuestarios.rows[1][17] instanceof Date);
  assert.equal(overrunHarness.sheets.CompromisosPresupuestarios.rows[1][18],"Excepción extraordinaria autorizada");
  assert.ok(overrunHarness.logs.some(entry=>entry.code==="BUDGET_OVERRUN_ALERT"));

  const releaseRollback=makeHarness();
  const releaseRollbackBudget=releaseRollback.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:100});
  releaseRollback.api.reserve(releaseRollback.ss,{presupuestoId:releaseRollbackBudget.presupuestoId,ordenCompraId:"OC-RB",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:50,idempotencyKey:"PO:OC-RB:PRE"},"U-1");
  releaseRollback.sheets.CompromisosPresupuestarios.failSetValues=true;
  const releaseFailure=releaseRollback.api.release(releaseRollback.ss,"OC-RB","Cancelación autorizada de orden","U-1");
  assert.equal(releaseFailure.code,"BUDGET_COMMITMENT_RELEASE_FAILED");
  assert.equal(releaseRollback.sheets.PresupuestosInstitucionales.rows[1][5],50,"failed release rolls budget total back");
  assert.equal(releaseRollback.sheets.CompromisosPresupuestarios.rows[1][7],"Comprometido","failed release restores ledger state");
  const scopeDenied=makeHarness({departmentIds:["D2"]});
  const outOfScope=scopeDenied.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:100});
  assert.equal(outOfScope.code,"RESOURCE_NOT_FOUND");
  const missingBudget=makeHarness().api.check({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:10});
  assert.equal(missingBudget.code,"BUDGET_NOT_FOUND");
  const badThreshold=makeHarness().api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:100,umbralAlertaPct:101});
  assert.equal(badThreshold.code,"BUDGET_THRESHOLD_INVALID");
  const noPermission=makeHarness({permissionDenied:true});
  assert.equal(noPermission.api.get({sessionToken:"S"}).code,"ROLE_PERMISSION_DENIED");
  assert.equal(noPermission.stats().lockCalls,0);
  const noScope=makeHarness({scopeDenied:true});
  assert.equal(noScope.api.get({sessionToken:"S"}).code,"DEPARTMENT_SCOPE_UNVERIFIED");
  const busy=makeHarness({lockBusy:true});
  assert.equal(busy.api.check({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:1}).code,"CONCURRENT_UPDATE_RETRY");

  const rollback=makeHarness({failLedgerAppend:true});
  const rollbackBudget=rollback.api.save({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoAprobado:100});
  assert.equal(rollbackBudget.status,"success");
  const rollbackResult=rollback.api.reserve(rollback.ss,{presupuestoId:rollbackBudget.presupuestoId,ordenCompraId:"OC-R",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",monto:50,idempotencyKey:"OC-R:PRE-R"},"U-1");
  assert.equal(rollbackResult.code,"BUDGET_COMMITMENT_WRITE_FAILED");
  assert.equal(rollback.sheets.PresupuestosInstitucionales.rows[1][5],0,"failed ledger append rolls back budget commitment total");
  assert.equal(rollback.sheets.CompromisosPresupuestarios.rows.length,1,"failed ledger append is removed");
  console.log("Budget plans, execution totals, threshold alerts, department scope, idempotent reservations, overspend protection and rollback contracts passed.");
}
main();
