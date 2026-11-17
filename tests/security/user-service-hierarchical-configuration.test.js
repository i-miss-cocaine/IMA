const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/user-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/user-service/Code.gs"});
function extractFunction(name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function exists: "+name);
 const open=source.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const ch=source[i],next=source[i+1];
  if(line){if(ch==="\n")line=false;continue;}
  if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
  if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}
  if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue;}
  if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);
 }throw new Error("Unbalanced function: "+name);
}
const cs=source.indexOf("const CONFIGURATION_SYSTEM_EXTRA_HEADERS_"),ce=source.indexOf("function configurationHeaderMap_",cs);
assert.ok(cs>=0&&ce>cs,"hierarchy constants exist");
const code=source.slice(cs,ce)+["configurationHeaderMap_","configurationJsonArray_","configurationPolicyFromRow_","configurationStoredValue_","configurationRows_","configurationFindUnique_","resolveHierarchicalConfiguration","validateRolePermission"].map(extractFunction).join("\n");
const sh=["ConfigID","Clave","Valor","Tipo","Categoria","Descripcion","Ambito","EditablePor","Estado","Version","UpdatedAt","UpdatedBy","InstitutionID","UserID","PoliticaAlcance","AmbitosPermitidosJSON","PermiteHerencia","PermiteSobrescritura","RolesAutorizadosJSON","DependenciasJSON","EsSensible"];
const dh=["OverrideID","ConfigID","Clave","InstitutionID","DepartmentID","ValueJSON","ValueType","Version","Status","CreatedAt","CreatedBy","UpdatedAt","UpdatedBy","Reason"];
function sheet(rows){return{rows:rows.map(r=>r.slice()),getLastRow(){return this.rows.length;},getDataRange(){const x=this;return{getValues:()=>x.rows.map(r=>r.slice())};}};}
function row(scope,value,opts={}){
 const r=new Array(sh.length).fill("");r[0]="CFG-1";r[1]="feature.flag";r[2]=value;r[3]="TEXTO";r[4]="TEST";r[5]="test";r[6]=scope;r[7]="Administrador,Director";r[8]="ACTIVO";r[9]="1.0";r[10]="2026-11-17";r[11]="U-ADMIN";r[12]=scope==="GLOBAL"?"":"INST-1";r[13]=scope==="PERSONAL"?"U-1":"";
 r[14]=opts.policy||"PERSONALIZABLE";r[15]=JSON.stringify(opts.allowedScopes||["GLOBAL","INSTITUCIONAL","DEPARTAMENTAL","PERSONAL"]);r[16]=opts.inheritance===undefined?true:opts.inheritance;r[17]=opts.override===undefined?true:opts.override;r[18]=JSON.stringify(["Administrador","Director"]);r[19]="[]";r[20]=opts.sensitive===true;return r;
}
function harness(opts={}){
 const sys=[sh,row("GLOBAL","global",opts.policy||{})];if(opts.institution!==false)sys.push(row("INSTITUCIONAL","institution"));if(opts.personal)sys.push(row("PERSONAL","personal"));
 const dep=[dh];if(opts.department!==false)dep.push(["OVR-1","CFG-1","feature.flag","INST-1","D-1",JSON.stringify("department"),"TEXTO","1.1","ACTIVO","created","U-DIR","updated","U-DIR","test"]);
 const sheets={ConfiguracionSistema:sheet(sys),ConfiguracionDepartamental:sheet(dep)},ss={getSheetByName:n=>sheets[n]||null},calls=[];
 const ctx={Date,Math,JSON,Number,String,Object,Array,isFinite,SpreadsheetApp:{openById:()=>ss},
  getUserVerifiedRole:p=>(p._verifiedUserId=p._verifiedUserId||"U-1",opts.role||"Director"),getIdentityInstitutionId_:()=>"INST-1",
  configurationDepartmentContext_:(p,d)=>{if(!opts.departments||!opts.departments.includes(d))throw Error("CONFIGURATION_DEPARTMENT_SCOPE_DENIED");return{status:"success",departmentIds:opts.departments};},
  configurationRoleAllowed_:(s,r,k,a,sc)=>{calls.push(sc);return opts.readAllowed?opts.readAllowed(sc,r):true;},
  PUBLIC_ACTIONS:[],getDynamicPermissionsForRole:(r,p)=>p==="manageDepartmentalConfiguration"&&opts.departmentManager===true,logStructuredEvent:()=>{}};
 vm.runInNewContext(code,ctx);return{ctx,sheets,calls};
}
{
 const h=harness({personal:true,departments:["D-1"]}),r=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"});
 assert.equal(r.valor,"personal");assert.equal(r.origenEfectivo,"PERSONAL");assert.equal(r.valorGlobal,"global");assert.equal(r.valorInstitucional,"institution");assert.equal(r.valorDepartamental,"department");
}
{
 const h=harness({departments:["D-1"]}),r=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"});
 assert.equal(r.valor,"department");assert.equal(r.origenEfectivo,"DEPARTAMENTAL");
}
{
 const h=harness({departments:["D-1"]}),r=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"});
 assert.equal(r.valor,"institution");
}
{
 const h=harness({departments:[]});
 assert.throws(()=>h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-OTHER"}),/CONFIGURATION_DEPARTMENT_SCOPE_DENIED/);
}
{
 const h=harness({departments:["D-1"],policy:{allowedScopes:["GLOBAL","INSTITUCIONAL"]}});
 const r=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"});assert.equal(r.code,"CONFIGURATION_SCOPE_NOT_ALLOWED");
}
{
 const h=harness({departments:["D-1"],policy:{sensitive:true},readAllowed:sc=>sc==="GLOBAL"});
 const r=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"});assert.equal(r.code,"CONFIGURATION_READ_FORBIDDEN");
}
{
 const h=harness({departments:["D-1"],personal:true,policy:{sensitive:true},readAllowed:sc=>sc==="PERSONAL"});
 const r=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"});
 assert.equal(r.status,"success");assert.equal(r.origenEfectivo,"PERSONAL");assert.equal(r.valorGlobal,null);assert.equal(r.valorInstitucional,null);assert.equal(r.valorDepartamental,null);
}
{
 const h=harness({departmentManager:true});
 const r=h.ctx.validateRolePermission("resetSystemConfigurationOverride",{_verifiedUserId:"U-DEPT",role:"Coordinador"});
 assert.equal(r.authorized,true);
}
assert.match(source,/policyChange&&\(scope!=="GLOBAL"\|\|\["Administrador","Desarrollador"\]\.indexOf\(role\)===-1\)/);
assert.match(source,/if\(policyChange\)\{policy=\{policy:policyName/);
console.log("USER hierarchical configuration security and precedence contract PASS.");
