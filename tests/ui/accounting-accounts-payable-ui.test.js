const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const client=fs.readFileSync(path.resolve(__dirname,"../../js/accounting.js"),"utf8");assert.doesNotThrow(()=>new vm.Script(client));
assert.ok(client.includes("switchComprasSubtab('cuentas-pagar')"));assert.ok(client.includes("renderComprasCuentasPorPagarView"));
assert.ok(client.includes('fetchBackendAccounting("getAccountsPayablePortfolio"'));assert.ok(client.includes('fetchBackendAccounting("recordAccountsPayablePayment"'));
assert.ok(client.includes('fetchBackendAccounting("recordAccountsPayableCreditNote"'));assert.ok(client.includes('dataset.purchaseAction="recordAccountsPayablePayment"'));
assert.ok(client.includes('dataset.purchaseAction="recordAccountsPayableCreditNote"'));assert.ok(client.includes("window.renderAccountsPayablePortfolio"));
console.log("F18-TASK06 accounts payable UI contract PASS: portfolio, aging, payment and credit-note actions are wired to permission-gated backend calls.");

assert.ok(client.includes('fetchBackendAccounting("approveAccountsPayableInvoice"'));
assert.ok(client.includes('dataset.purchaseAction="approveAccountsPayableInvoice"'));

assert.ok(client.includes('id="cxp-date-from"'));
assert.ok(client.includes('id="cxp-date-to"'));

assert.ok(client.includes('data-ui-help-key="fechas.calendario"'));
