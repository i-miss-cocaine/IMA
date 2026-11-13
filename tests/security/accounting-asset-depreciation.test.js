const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape)escape=false;else if(c==="\\")escape=true;else if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c.charCodeAt(0)===96){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8"),client=fs.readFileSync(path.join(root,"js/accounting.js"),"utf8");
assert.doesNotThrow(()=>new vm.Script(source));assert.doesNotThrow(()=>new vm.Script(client));
const constants=["ASSET_DEPR_POLICY_HEADERS_","ASSET_DEPR_PROFILE_HEADERS_","ASSET_DEPR_IMPROVEMENT_HEADERS_","ASSET_DEPR_HEADERS_"].map(name=>{const m=source.match(new RegExp("const "+name+"=[^;]+;"));assert.ok(m,name);return m[0];});
const base=["ActivoID","CodigoPatrimonial","Nombre","Categoria","SerieModel","UbicacionActual","CustodioUserId","Estado","Observaciones"],acq=["ProveedorID","OrdenCompraID","RecepcionID","FacturaNumero","ObligacionID","FechaAdquisicion","CostoAdquisicion","NumeroSerie","Marca","Modelo","PurchaseItemId","ClasificacionCompra"];
const rows={
 ActivosPatrimoniales:[base.concat(acq),["A-1","PAT-001","Laptop","Equipo Computacional","L-1","","","available","", "","","","","","",new Date("2026-01-01"),1200,"","","","",""]],
 PlanCuentas:[["CuentaID","CodigoCuenta","NombreCuenta","TipoCuenta","Naturaleza","Estado","Observaciones"],["C1","1501","Activo fijo","Activo","Debito","Activo",""],["C2","1599","Depreciación acumulada","Activo","Credito","Activo",""],["C3","6101","Gasto depreciación","Gasto","Debito","Activo",""]],
 AsientosContables:[["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"]]
};
function sheet(name){return {getDataRange:()=>({getValues:()=>rows[name].map(r=>r.slice())}),getLastRow:()=>rows[name].length,appendRow:r=>rows[name].push(r.slice()),getRange:(row,col,nr=1,nc=1)=>({setValue:v=>{while(rows[name].length<row)rows[name].push([]);rows[name][row-1][col-1]=v;},setValues:vals=>{for(let i=0;i<vals.length;i++){while(rows[name].length<row+i)rows[name].push([]);for(let j=0;j<nc;j++)rows[name][row-1+i][col-1+j]=vals[i][j];}}})};}
let uid=0,logs=[];
const ss={getSheetByName:n=>rows[n]?sheet(n):null,insertSheet:n=>{rows[n]=[[""]];return sheet(n);}};
const ctx={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},Utilities:{getUuid:()=>"U"+(++uid)},getVerifiedAccountingIdentity_:()=>({authorized:true,userId:"U-1",role:"CONTADOR"}),logStructuredEvent:(...a)=>logs.push(a),getOrCreateSheet:(s,n)=>{if(!rows[n])rows[n]=[["AsientoID","Fecha","Descripcion","OrigenModulo","ReferenciaID","LineasJSON","Estado","CreadoPor"]];return sheet(n);}};
vm.createContext(ctx);constants.forEach(c=>vm.runInContext(c,ctx));
["assetDeprSheet_","assetDeprActor_","assetDeprAccount_","assetDeprDate_","assetDeprMonth_","assetDeprMonthsBetween_","assetDeprMoney_","assetDeprProfileMap_","assetDeprRequireAsset_","saveAssetDepreciationPolicy","configureAssetDepreciationProfile","registerCapitalizableAssetImprovement","assetDeprComponentAmount_","assetDeprPriorComponent_","calculateAssetDepreciation","getAssetDepreciationSchedule"].forEach(n=>vm.runInContext(extract(source,n),ctx));
const profile=ctx.configureAssetDepreciationProfile({activoId:"A-1",fechaPuestaFuncionamiento:"2026-01-01",fechaInicioDepreciacion:"2026-01-01",costoCapitalizado:1200,valorResidual:0,vidaUtilMeses:12,metodo:"LineaRecta",cuentaActivo:"1501",cuentaDepreciacionAcumulada:"1599",cuentaGastoDepreciacion:"6101",centroCosto:"CC-1",moneda:"HNL"});
assert.equal(profile.status,"success");
const preview=ctx.calculateAssetDepreciation({activoId:"A-1",periodo:"2026-01",post:false});
assert.equal(preview.resultados[0].depreciacionPeriodo,100);
const posted=ctx.calculateAssetDepreciation({activoId:"A-1",periodo:"2026-01",post:true});
assert.equal(posted.resultados[0].status,"posted");assert.equal(posted.resultados[0].depreciacionPeriodo,100);
const journal=rows.AsientosContables[1],lines=JSON.parse(journal[5]);assert.equal(lines.reduce((s,x)=>s+x.debe,0),100);assert.equal(lines.reduce((s,x)=>s+x.haber,0),100);assert.equal(journal[4],"DEPRECIACION:A-1:2026-01");
const repeated=ctx.calculateAssetDepreciation({activoId:"A-1",periodo:"2026-01",post:true});assert.equal(repeated.resultados[0].status,"already_posted");assert.equal(rows.AsientosContables.length,2);
ctx.registerCapitalizableAssetImprovement({activoId:"A-1",fechaCapitalizacion:"2026-02-01",descripcion:"Ampliación de memoria",importe:120,vidaUtilMeses:12,metodo:"LineaRecta"});
const feb=ctx.calculateAssetDepreciation({activoId:"A-1",periodo:"2026-02",post:false});assert.equal(feb.resultados[0].depreciacionPeriodo,110);
const schedule=ctx.getAssetDepreciationSchedule({activoId:"A-1"});assert.equal(schedule.calendario.length,1);assert.equal(schedule.calendario[0].estado,"Contabilizada");assert.equal(schedule.activos[0].costoCapitalizado,1200);
assert.throws(()=>ctx.configureAssetDepreciationProfile({activoId:"A-1",fechaPuestaFuncionamiento:"2026-01-01",costoCapitalizado:1200,valorResidual:1300,vidaUtilMeses:12,metodo:"LineaRecta",cuentaActivo:"1501",cuentaDepreciacionAcumulada:"1599",cuentaGastoDepreciacion:"6101"}),/PROFILE_INVALID/);
assert.throws(()=>ctx.saveAssetDepreciationPolicy({categoria:"Mobiliario",metodo:"SaldoDecreciente",vidaUtilMeses:60,tasaAnual:1,cuentaActivo:"1501",cuentaDepreciacionAcumulada:"1599",cuentaGastoDepreciacion:"6101"}),/POLICY_VALUES_INVALID/);
assert.ok(logs.some(x=>x[3]==="ASSET_DEPRECIATION_POSTED"));
assert.ok(client.includes("saveAssetDeprProfileUI")&&client.includes("loadAssetDeprScheduleUI")&&client.includes("Contabilizar período"));
console.log("TASK-185 depreciation contract PASS: profile validation, straight-line preview/posting, balanced journal, period idempotency, capitalizable improvement component, consolidated schedule, and invalid policy/profile rejection.");
