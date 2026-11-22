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
const commitmentHeaders=["CompromisoID","PresupuestoID","OrdenCompraID","AnoID","CentroCosto","PartidaCodigo","Monto","Estado","IdempotencyKey","PayloadHash","FechaCreacion","CreadoPor","FechaLiberacion","MotivoLiberacion","ActualizadoPor","Version"];
function makeSheet(rows,options={}){
  const sheet={rows:rows.map(r=>r.slice()),failAppend:options.failAppend===true,
    getDataRange(){return{getValues:()=>sheet.rows.map(r=>r.slice())};},
    getLastRow(){return sheet.rows.length;},
    getRange(row,col){
      return{setValue(value){while(sheet.rows.length<row)sheet.rows.push([]);while(sheet.rows[row-1].length<col)sheet.rows[row-1].push("");sheet.rows[row-1][col-1]=value;},
        setValues(values){values.forEach((line,i)=>{while(sheet.rows.length<row+i)sheet.rows.push([]);while(sheet.rows[row-1+i].length<col-1+line.length)sheet.rows[row-1+i].push("");line.forEach((v,j)=>sheet.rows[row-1+i][col-1+j]=v);});}};
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
  const ss={getSheetByName:name=>sheets[name]||null};
  const context={
    SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById:()=>ss},
    LockService:{getScriptLock:()=>({tryLock:()=>{lockCalls++;return options.lockBusy!==true;},releaseLock:()=>{lockReleases++;}})},
    Utilities:{getUuid:()=>"UUID-"+(++uuid)},
    getOrCreateSheet:(_ss,name)=>{
      if(!sheets[name]){
        const headers=name==="PresupuestosInstitucionales"?budgetHeaders:name==="CompromisosPresupuestarios"?commitmentHeaders:[];
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
    migrationHash_:value=>crypto.createHash("sha256").update(String(value)).digest("hex"),
    Object,Array,String,Number,Date,Math,JSON,Error,RegExp,isFinite,parseInt
  };
  vm.createContext(context);
  const names=["budgetAccess_","budgetScopeAllows_","ensureBudgetSchema_","ensureBudgetCommitmentSchema_","budgetRecordFromRow_","getBudgetRowsCore_",
    "getBudgets","saveBudgetPlan","getBudgetExecutionReport","checkBudgetAvailabilityCore_","checkBudgetAvailability","reserveBudgetCommitmentLocked_"];
  vm.runInContext(names.map(extract).join("\n")+"\nthis.api={get:getBudgets,save:saveBudgetPlan,report:getBudgetExecutionReport,check:checkBudgetAvailability,checkCore:checkBudgetAvailabilityCore_,reserve:reserveBudgetCommitmentLocked_};",context);
  return{api:context.api,sheets,ss,stats:()=>({identityCalls,lockCalls,lockReleases})};
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
  const overrun=h.api.check({sessionToken:"S",anoId:"2026",centroCosto:"D1",partidaCodigo:"5101",montoSolicitado:1001});
  assert.equal(overrun.disponible,false);
  assert.equal(overrun.code,"BUDGET_OVERRUN_BLOCKED");
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
