const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
function extract(name){
  const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);
  let depth=0,quote="",escaped=false,line=false,block=false;
  const open=source.indexOf("{",start);
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
function makeSheet(rows,options={}){
  const sheet={rows:rows.map(row=>row.slice()),failAppend:options.failAppend===true,
    getDataRange(){return{getValues:()=>sheet.rows.map(row=>row.slice())};},
    getLastRow(){return sheet.rows.length;},
    getRange(row,col){
      return{setValue(value){while(sheet.rows.length<row)sheet.rows.push([]);while(sheet.rows[row-1].length<col)sheet.rows[row-1].push("");sheet.rows[row-1][col-1]=value;}};
    },
    appendRow(row){sheet.rows.push(row.slice());if(sheet.failAppend){sheet.failAppend=false;throw new Error("SHEET_WRITE_FAILED");}},
    deleteRow(row){if(row===sheet.rows.length)sheet.rows.pop();else sheet.rows.splice(row-1,1);}
  };
  return sheet;
}
function makeHarness(options={}){
  let uuid=0,identityCalls=0,lockCalls=0,lockReleases=0;
  const journal=makeSheet([["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"]],{failAppend:options.failAppend});
  const chart=makeSheet([
    ["CuentaID","CodigoCuenta","NombreCuenta","TipoCuenta","Naturaleza","Estado","Observaciones"],
    ["CTA-1","1101","Caja y bancos","Activo","Deudora","Activo",""],
    ["CTA-2","2101","Cuentas por pagar","Pasivo","Acreedora","Activa",""],
    ["CTA-3","5101","Gastos de personal","Gasto","Deudora","Vigente",""],
    ["CTA-4","9999","Cuenta inactiva","Activo","Deudora","Inactiva",""]
  ]);
  const sheets={AsientosContables:journal,PlanCuentas:chart};
  const ss={getSheetByName:name=>sheets[name]||null};
  const context={
    SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById:()=>ss},
    LockService:{getScriptLock:()=>({tryLock:()=>{lockCalls++;return options.lockBusy!==true;},releaseLock:()=>{lockReleases++;}})},
    Utilities:{getUuid:()=>"UUID-"+(++uuid)},
    getOrCreateSheet:(_ss,name)=>sheets[name]||null,
    getVerifiedAccountingIdentity_:()=>{
      identityCalls++;
      if(options.identityDenied)return{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};
      return{authorized:true,userId:options.changeActorAfterLock&&identityCalls>1?"U-2":"U-1",role:"Contador"};
    },
    validateRolePermission:(_actor,action)=>options.permissionDenied?{authorized:false,code:"ROLE_PERMISSION_DENIED"}:{authorized:true,action},
    migrationStableJson_:value=>JSON.stringify(value),
    migrationHash_:value=>crypto.createHash("sha256").update(String(value)).digest("hex"),
    Object,Array,String,Number,Date,Math,JSON,Error,RegExp,isFinite,parseInt
  };
  vm.createContext(context);
  const names=["ensureAccountingJournalSheet_","recordAccountingJournalEntryCore_","recordAccountingJournalEntry","accountingJournalLines_","getAccountingJournalEntries","getPaginatedJournalEntries"];
  vm.runInContext(names.map(extract).join("\n")+"\nthis.api={record:recordAccountingJournalEntry,core:recordAccountingJournalEntryCore_,read:getAccountingJournalEntries,page:getPaginatedJournalEntries};",context);
  return{api:context.api,sheets,stats:()=>({identityCalls,lockCalls,lockReleases})};
}
const payload={
  sessionToken:"SESSION",
  descripcion:"Registro de prueba de partida doble",
  origenModulo:"Manual",
  referenciaId:"REF-001",
  creadoPor:"USUARIO-FALSIFICADO",
  lineas:[
    {cuenta:"1101",nombre:"Nombre manipulado",debe:100,haber:0},
    {cuenta:"2101",nombre:"Otro nombre manipulado",debe:0,haber:100}
  ]
};
function main(){
  assert.doesNotThrow(()=>new vm.Script(source),"ACCOUNTING backend syntax");
  assert.ok(source.includes('request.action === "recordAccountingJournalEntry"'),"journal posting route remains connected");
  const h=makeHarness();
  const created=h.api.record(payload);
  assert.equal(created.status,"success",JSON.stringify(created));
  assert.equal(created.totalDebe,100);
  assert.equal(created.totalHaber,100);
  const rows=h.sheets.AsientosContables.rows;
  assert.equal(rows.length,2);
  assert.equal(rows[0][8],"IdempotencyKey");
  assert.equal(rows[0][9],"PayloadHash");
  assert.equal(rows[1][7],"U-1","verified actor replaces caller-supplied creator");
  assert.equal(rows[1][8],"Manual:REF-001");
  assert.match(rows[1][9],/^[a-f0-9]{64}$/);
  const lines=JSON.parse(rows[1][5]);
  assert.equal(lines[0].nombreCuenta,"Caja y bancos","account name is canonicalized from the chart");
  assert.equal(lines[1].nombreCuenta,"Cuentas por pagar");
  const replay=h.api.record(payload);
  assert.equal(replay.status,"success");
  assert.equal(replay.idempotente,true);
  assert.equal(replay.asientoId,created.asientoId);
  assert.equal(h.sheets.AsientosContables.rows.length,2,"idempotent retry does not append a second journal entry");
  const conflict=h.api.record({...payload,lineas:[{cuenta:"1101",debe:101,haber:0},{cuenta:"2101",debe:0,haber:101}]});
  assert.equal(conflict.code,"ACCOUNTING_JOURNAL_IDEMPOTENCY_CONFLICT");
  assert.equal(h.sheets.AsientosContables.rows.length,2);

  const unbalanced=makeHarness().api.record({...payload,lineas:[{cuenta:"1101",debe:100,haber:0},{cuenta:"2101",debe:0,haber:99}]});
  assert.equal(unbalanced.code,"ACCOUNTING_JOURNAL_UNBALANCED");
  const negative=makeHarness().api.record({...payload,lineas:[{cuenta:"1101",debe:-1,haber:0},{cuenta:"2101",debe:0,haber:-1}]});
  assert.equal(negative.code,"ACCOUNTING_JOURNAL_LINE_AMOUNT_INVALID");
  const bothSides=makeHarness().api.record({...payload,lineas:[{cuenta:"1101",debe:100,haber:100},{cuenta:"2101",debe:0,haber:0}]});
  assert.equal(bothSides.code,"ACCOUNTING_JOURNAL_LINE_AMOUNT_INVALID");
  const zeroLine=makeHarness().api.record({...payload,lineas:[{cuenta:"1101",debe:0,haber:0},{cuenta:"2101",debe:100,haber:100}]});
  assert.equal(zeroLine.code,"ACCOUNTING_JOURNAL_LINE_AMOUNT_INVALID");
  const unknown=makeHarness().api.record({...payload,lineas:[{cuenta:"4040",debe:100,haber:0},{cuenta:"2101",debe:0,haber:100}]});
  assert.equal(unknown.code,"ACCOUNTING_ACCOUNT_NOT_FOUND");
  const inactive=makeHarness().api.record({...payload,lineas:[{cuenta:"9999",debe:100,haber:0},{cuenta:"2101",debe:0,haber:100}]});
  assert.equal(inactive.code,"ACCOUNTING_ACCOUNT_INACTIVE");
  const tooFew=makeHarness().api.record({...payload,lineas:[{cuenta:"1101",debe:100,haber:0}]});
  assert.equal(tooFew.code,"ACCOUNTING_JOURNAL_INPUT_INVALID");
  const noIdempotency=makeHarness().api.record({...payload,referenciaId:"N/A"});
  assert.equal(noIdempotency.code,"ACCOUNTING_JOURNAL_IDEMPOTENCY_KEY_REQUIRED");

  const denied=makeHarness({permissionDenied:true});
  assert.equal(denied.api.record(payload).code,"ROLE_PERMISSION_DENIED");
  assert.equal(denied.stats().lockCalls,0,"permission is checked before acquiring the lock");
  const noIdentity=makeHarness({identityDenied:true});
  assert.equal(noIdentity.api.record(payload).code,"VERIFIED_IDENTITY_REQUIRED");
  const busy=makeHarness({lockBusy:true});
  assert.equal(busy.api.record(payload).code,"CONCURRENT_UPDATE_RETRY");
  assert.equal(busy.stats().lockReleases,0);
  const changed=makeHarness({changeActorAfterLock:true});
  assert.equal(changed.api.record(payload).code,"VERIFIED_IDENTITY_CHANGED");
  assert.equal(changed.sheets.AsientosContables.rows.length,1);
  assert.equal(changed.stats().lockReleases,1);
  const rollback=makeHarness({failAppend:true});
  assert.equal(rollback.api.record(payload).code,"ACCOUNTING_JOURNAL_WRITE_FAILED");
  assert.equal(rollback.sheets.AsientosContables.rows.length,1,"failed append is rolled back");
  assert.equal(rollback.stats().lockReleases,1);

  const read=h.api.read({sessionToken:"SESSION"});
  assert.equal(read.status,"success");
  assert.equal(read.data.length,1);
  assert.equal(read.data[0].totalDebe,100);
  assert.equal(read.data[0].totalHaber,100);
  const page=h.api.page({sessionToken:"SESSION",page:1,pageSize:10});
  assert.equal(page.status,"success");
  assert.equal(page.data[0].referenciaId,"REF-001");
  assert.equal(page.data[0].montoDebe,100,"paginated debit total is computed from journal lines, not the reference column");
  assert.equal(page.data[0].montoHaber,100,"paginated credit total is computed from journal lines, not the JSON column");
  const readDenied=makeHarness({permissionDenied:true});
  assert.equal(readDenied.api.read({sessionToken:"SESSION"}).code,"ROLE_PERMISSION_DENIED");
  assert.equal(readDenied.api.page({sessionToken:"SESSION"}).code,"ROLE_PERMISSION_DENIED");
  console.log("Accounting journal balance, chart validation, actor authorization, idempotency, atomicity and read permissions contracts passed.");
}
main();
