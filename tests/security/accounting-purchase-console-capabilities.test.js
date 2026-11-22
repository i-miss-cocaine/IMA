const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const uiSource=fs.readFileSync(path.join(root,"js/accounting.js"),"utf8");
const backendSource=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");

function extractFunction(source,name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const open=source.indexOf("{",start);
  let depth=0,quote="",escaped=false;
  for(let i=open;i<source.length;i++){
    const ch=source[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(ch==="\\"){escaped=true;continue;}
      if(ch===quote)quote="";
      continue;
    }
    if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}
    if(ch==="{")depth++;
    else if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("unbalanced "+name);
}
function makeControl(action){
  return {hidden:true,disabled:true,attributes:{},
    getAttribute(name){return name==="data-purchase-action"?action:this.attributes[name];},
    setAttribute(name,value){this.attributes[name]=value;}};
}
function makeUiContext(fetcher){
  const root={controls:[],querySelectorAll(selector){assert.equal(selector,"[data-purchase-action]");return this.controls;}};
  const document={getElementById:id=>id==="compras-subtab-container"?root:null,
    querySelectorAll:root.querySelectorAll.bind(root)};
  const window={};
  const context={window,document,fetchBackendAccounting:fetcher,Promise,Object,Array,String};
  const start=uiSource.indexOf("let purchaseActionCapabilitiesRequestId = 0;");
  const end=uiSource.indexOf("function renderComprasModule",start);
  assert.ok(start>=0&&end>start,"purchase capability client module is present");
  vm.runInNewContext(uiSource.slice(start,end),context);
  return {window,document,root};
}
async function test(){
  assert.doesNotThrow(()=>new vm.Script(uiSource),"accounting UI syntax");
  assert.doesNotThrow(()=>new vm.Script(backendSource),"accounting backend syntax");
  assert.ok(uiSource.includes("window.openPurchaseInvoiceModal = async function"));
  assert.ok(uiSource.includes('fetchBackendAccounting("recordAccountsPayableExpense"'));
  const controls=[makeControl("createPurchaseRequest"),makeControl("registerSupplier"),makeControl("manageSupplierBankAccount")];
  const ui=makeUiContext(async action=>{
    assert.equal(action,"getPurchaseActionCapabilities");
    return {status:"success",actions:{createPurchaseRequest:true,registerSupplier:false,manageSupplierBankAccount:true}};
  });
  ui.root.controls.push(...controls);
  const result=await ui.window.loadPurchaseActionCapabilities();
  assert.equal(result.status,"success");
  assert.equal(controls[0].hidden,false);
  assert.equal(controls[0].disabled,false);
  assert.equal(controls[1].hidden,true);
  assert.equal(controls[1].disabled,true);
  assert.equal(controls[2].hidden,false);
  assert.equal(controls[2].attributes["aria-hidden"],"false");
  const lateControl=makeControl("registerAssetsFromPurchaseReceipt");
  ui.root.controls.push(lateControl);
  ui.window.applyPurchaseActionVisibility(ui.root);
  assert.equal(lateControl.hidden,true);

  const pending=[];
  const race=makeUiContext(()=>new Promise(resolve=>pending.push(resolve)));
  const first=race.window.loadPurchaseActionCapabilities();
  const second=race.window.loadPurchaseActionCapabilities();
  pending[1]({status:"success",actions:{createPurchaseRequest:false,registerSupplier:true}});
  await second;
  pending[0]({status:"success",actions:{createPurchaseRequest:true,registerSupplier:false}});
  await first;
  assert.equal(race.window.hasPurchaseActionCapability("registerSupplier"),true);
  assert.equal(race.window.hasPurchaseActionCapability("createPurchaseRequest"),false);

  const failed=makeUiContext(()=>Promise.reject(new Error("offline")));
  const failControl=makeControl("createPurchaseRequest");failed.root.controls.push(failControl);
  const failure=await failed.window.loadPurchaseActionCapabilities();
  assert.equal(failure.status,"error");
  assert.equal(failControl.hidden,true);
  assert.equal(failControl.disabled,true);

  const capabilityFunction=extractFunction(backendSource,"getPurchaseActionCapabilities");
  const calls=[],allowed=new Set(["registerSupplier","manageSupplierContact","getSupplierBankAccount","createPurchaseOrder","getPurchaseOrders"]);
  const backendContext={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>({})},
    purchaseQuotationAccess_:()=>({authorized:true,actor:{userId:"DIRECTOR-1",role:"Director"}}),
    validateRolePermission:(_actor,action)=>{calls.push(action);return {authorized:allowed.has(action)};},Object};
  vm.runInNewContext(capabilityFunction+String.fromCharCode(10)+"this.run=getPurchaseActionCapabilities;",backendContext);
  const response=backendContext.run({});
  assert.equal(response.status,"success");
  for(const action of ["registerSupplier","manageSupplierContact","manageSupplierAddress","manageSupplierCommercialTerms","manageSupplierBankAccount","getSupplierBankAccount"])
    assert.ok(Object.prototype.hasOwnProperty.call(response.actions,action),"capability missing "+action);
  assert.equal(response.actions.registerSupplier,true);
  assert.equal(response.actions.manageSupplierContact,true);
  assert.equal(response.actions.getSupplierBankAccount,true);
  assert.equal(response.actions.manageSupplierAddress,false);
  assert.ok(calls.includes("getPurchaseRequests"));
  assert.equal(response.actions.approvePurchaseOrder,true);
  assert.equal(response.actions.generatePurchaseOrderPDF,true);
  assert.equal(response.actions.getPurchaseOrderPDFFile,true);
  console.log("Purchase console capability loading, fail-closed visibility, stale-response race and supplier action contracts passed.");
}
test().catch(error=>{console.error(error);process.exitCode=1;});
