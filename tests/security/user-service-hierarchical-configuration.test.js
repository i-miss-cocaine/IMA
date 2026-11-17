const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/user-service/Code.gs"),"utf8");
const developerSource=fs.readFileSync(path.join(__dirname,"../../backend/developer-service/Code.gs"),"utf8");
new vm.Script(developerSource,{filename:"backend/developer-service/Code.gs"});
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
function extractDeveloperFunction(name){
 const start=developerSource.indexOf("function "+name+"(");assert.ok(start>=0,"developer function exists: "+name);
 const open=developerSource.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;
 for(let i=open;i<developerSource.length;i++){const ch=developerSource[i],next=developerSource[i+1];
  if(line){if(ch==="\n")line=false;continue;}
  if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
  if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}
  if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue;}
  if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return developerSource.slice(start,i+1);
 }throw new Error("Unbalanced developer function: "+name);
}
const developerValidationCode=extractDeveloperFunction("validateServiceConfigDependencies");
const developerCatalogCode=extractDeveloperFunction("getCentralConfigAndContractCatalog");
const cs=source.indexOf("const CONFIGURATION_SYSTEM_EXTRA_HEADERS_"),ce=source.indexOf("function configurationHeaderMap_",cs);
assert.ok(cs>=0&&ce>cs,"hierarchy constants exist");
const schemaCode=source.slice(cs,ce)+extractFunction("configurationHeaderMap_")+extractFunction("ensureConfigurationHierarchySchema_");
const code=source.slice(cs,ce)+["configurationHeaderMap_","configurationJsonArray_","configurationPolicyFromRow_","configurationStoredValue_","configurationDepartmentStoredValue_","configurationRows_","configurationFindUnique_","resolveHierarchicalConfiguration","saveSystemConfiguration","resetSystemConfigurationOverride","validateRolePermission"].map(extractFunction).join("\n");
const sh=["ConfigID","Clave","Valor","Tipo","Categoria","Descripcion","Ambito","EditablePor","Estado","Version","UpdatedAt","UpdatedBy","InstitutionID","UserID","PoliticaAlcance","AmbitosPermitidosJSON","PermiteHerencia","PermiteSobrescritura","RolesAutorizadosJSON","DependenciasJSON","EsSensible"];
const dh=["OverrideID","ConfigID","Clave","InstitutionID","DepartmentID","ValueJSON","ValueType","Version","Status","CreatedAt","CreatedBy","UpdatedAt","UpdatedBy","Reason"];
function assertThrowsCode(fn,code){let caught=null;try{fn();}catch(error){caught=error;}assert.ok(caught,"expected "+code);assert.equal(caught.message,code);}
function sheet(rows){return{rows:rows.map(r=>r.slice()),getLastRow(){return this.rows.length;},getDataRange(){const x=this;return{getValues:()=>x.rows.map(r=>r.slice())};}};}
function row(scope,value,opts={}){
 const r=new Array(sh.length).fill("");r[0]="CFG-1";r[1]="feature.flag";r[2]=value;r[3]="TEXTO";r[4]="TEST";r[5]="test";r[6]=scope;r[7]="Administrador,Director";r[8]="ACTIVO";r[9]="1.0";r[10]="2026-11-17";r[11]="U-ADMIN";r[12]=scope==="GLOBAL"?"":"INST-1";r[13]=scope==="PERSONAL"?"U-1":"";
 r[14]=opts.policy||"PERSONALIZABLE";r[15]=JSON.stringify(opts.allowedScopes||["GLOBAL","INSTITUCIONAL","DEPARTAMENTAL","PERSONAL"]);r[16]=opts.inheritance===undefined?true:opts.inheritance;r[17]=opts.override===undefined?true:opts.override;r[18]=JSON.stringify(["Administrador","Director"]);r[19]="[]";r[20]=opts.sensitive===true;return r;
}
function harness(opts={}){
 const sys=[sh,row("GLOBAL","global",opts.policy||{})];if(opts.institution!==false)sys.push(row("INSTITUCIONAL","institution"));if(opts.personal)sys.push(row("PERSONAL","personal"));
 const dep=[dh];if(opts.department!==false)dep.push(["OVR-1","CFG-1","feature.flag","INST-1","D-1",JSON.stringify("department"),"TEXTO","1.1","ACTIVO","created","U-DIR","updated","U-DIR","test"]);
 const sheets={ConfiguracionSistema:sheet(sys),ConfiguracionDepartamental:sheet(dep)},ss={getSheetByName:n=>sheets[n]||null},calls=[];
 const ctx={SPREADSHEET_ID:"TEST",Date,Math,JSON,Number,String,Object,Array,isFinite,SpreadsheetApp:{openById:()=>ss},
  getUserVerifiedRole:p=>(p._verifiedUserId=p._verifiedUserId||"U-1",opts.role||p.role||"Director"),getIdentityInstitutionId_:()=>"INST-1",
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
 const h=harness({departmentManager:true,role:"Coordinador"});
 const r=h.ctx.validateRolePermission("resetSystemConfigurationOverride",{_verifiedUserId:"U-DEPT",role:"Coordinador"});
 assert.equal(r.authorized,true,"departmental managers can reach reset through the departmental permission");
}
{
 const h=harness({role:"Coordinador"});
 const r=h.ctx.validateRolePermission("resetSystemConfigurationOverride",{_verifiedUserId:"U-DEPT",role:"Coordinador"});
 assert.equal(r.authorized,false,"departmental reset is denied without its server permission");
}
function writeSheet(rows){
 const x=sheet(rows);
 x.getRange=function(rowIndex,col,count,width){return{setValues(values){values.forEach((v,i)=>x.rows[rowIndex-1+i].splice(col-1,width,...v));}};};
 x.appendRow=function(row){x.rows.push(row.slice());};
 return x;
}
function writeHarness(options={}){
 const base=row("GLOBAL","global",{policy:"HEREDABLE",allowedScopes:["GLOBAL","INSTITUCIONAL","DEPARTAMENTAL"],inheritance:true,override:true});
 const system=writeSheet([sh,base]);
 const deptDefault=["OVR-1","CFG-1","feature.flag","INST-1","D-1",JSON.stringify("department"),"TEXTO","1.0","ACTIVO","created","U-OLD","updated","U-OLD","test"];
 const department=writeSheet([dh,...(options.deptRows||[deptDefault])]);
 const schema={system,department,headers:sh,index:Object.fromEntries(sh.map((v,i)=>[v,i]))};
 let acquired=false,releases=0;
 const lock={
  waitLock(){if(options.lockAvailable===false||acquired)throw Error("LOCK_TIMEOUT");acquired=true;},
  releaseLock(){if(acquired){acquired=false;releases++;}}
 };
 const ss={getSheetByName:n=>n==="ConfiguracionSistema"?system:n==="ConfiguracionDepartamental"?department:null};
 const ctx={SPREADSHEET_ID:"TEST",Date,Math,JSON,Number,String,Object,Array,isFinite,
  SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>lock},
  Utilities:{getUuid:()=>"UUID-TEST"},
  getUserVerifiedRole:p=>(p._verifiedUserId="U-1",options.role||"Director"),
  getIdentityInstitutionId_:()=>"INST-1",
  ensureConfigurationHierarchySchema_:()=>schema,
  configurationDepartmentContext_:(p,d)=>{if(d!=="D-1")throw Error("CONFIGURATION_DEPARTMENT_SCOPE_DENIED");return{status:"success",departmentIds:["D-1"]};},
  configurationRoleAllowed_:()=>true,
  configurationValidateValue_:v=>v,
  configurationValidateDependencies_:()=>{},
  logStructuredEvent:()=>{}
 };
 vm.runInNewContext(code,ctx);
 return{ctx,system,department,stats:()=>({releases,locked:acquired})};
}
{
 const h=writeHarness();
 const result=h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"TEXTO",valor:"department-updated"});
 assert.equal(result.status,"success");
 assert.equal(h.department.rows.length,2,"an existing active override is updated rather than duplicated");
 assert.equal(h.department.rows[1][5],JSON.stringify("department-updated"));
 assert.equal(h.department.rows[1][7],"1.1");
 assert.equal(h.department.rows[1][12],"U-1","audit actor comes from the signed session");
 h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"TEXTO",valor:"second-update"});
 assert.equal(h.department.rows[1][7],"1.2","each scope increments its own version");
 assert.equal(h.stats().releases,2,"script lock is released after every write");
}
{
 const h=writeHarness();
 const before=JSON.stringify(h.department.rows);
 assert.throws(()=>h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"NUMERO",valor:7}),/CONFIGURATION_TYPE_MISMATCH/);
 assert.equal(JSON.stringify(h.department.rows),before,"scope overrides cannot change the base configuration type");
}
{
 const h=writeHarness({role:"Coordinador"});
 const before=JSON.stringify({system:h.system.rows,department:h.department.rows});
 assert.throws(()=>h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"TEXTO",valor:"forged",politicaAlcance:"PERSONALIZABLE",actualizarPolitica:true}),/CONFIGURATION_POLICY_CHANGE_FORBIDDEN/);
 assert.equal(JSON.stringify({system:h.system.rows,department:h.department.rows}),before,"a departmental writer cannot alter the shared policy or persist an override");
 assert.equal(h.stats().releases,1);
}
{
 const duplicate=["OVR-2","CFG-1","feature.flag","INST-1","D-1",JSON.stringify("duplicate"),"TEXTO","1.0","ACTIVO","created","U-OLD","updated","U-OLD","test"];
 const h=writeHarness({deptRows:[["OVR-1","CFG-1","feature.flag","INST-1","D-1",JSON.stringify("department"),"TEXTO","1.0","ACTIVO","created","U-OLD","updated","U-OLD","test"],duplicate]});
 const before=JSON.stringify(h.department.rows);
 assert.throws(()=>h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"TEXTO",valor:"new"}),/CONFIGURATION_DEPARTMENT_CONFLICT/);
 assert.equal(JSON.stringify(h.department.rows),before,"duplicate active scope rows are rejected without mutation");
 assert.equal(h.stats().releases,1);
}
{
 const h=writeHarness({lockAvailable:false});
 const before=JSON.stringify(h.department.rows);
 assert.throws(()=>h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"TEXTO",valor:"new"}),/LOCK_TIMEOUT/);
 assert.equal(JSON.stringify(h.department.rows),before,"lock contention performs no partial write");
 assert.equal(h.stats().releases,0);
}
{
 const h=writeHarness();
 const result=h.ctx.resetSystemConfigurationOverride({clave:"feature.flag",departamentoId:"D-1"});
 assert.equal(result.status,"success");
 assert.equal(result.restablecida,true);
 assert.equal(h.department.rows[1][8],"INACTIVO","reset deactivates the override and restores inheritance");
 assert.equal(h.department.rows[1][7],"1.1","reset increments the override version");
 assert.equal(h.department.rows[1][12],"U-1");
 const saved=h.ctx.saveSystemConfiguration({clave:"feature.flag",ambito:"DEPARTAMENTAL",departamentoId:"D-1",tipo:"TEXTO",valor:"after-reset"});
 assert.equal(saved.status,"success");assert.equal(h.department.rows.length,2,"a reset override is reactivated rather than duplicated");
 assert.equal(h.department.rows[1][8],"ACTIVO");assert.equal(h.department.rows[1][7],"1.2");
 assert.equal(h.stats().releases,2);
}
{
 const h=harness({personal:true,role:"Estudiante"});
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",userId:"U-OTHER"});
 assert.equal(result.code,"CONFIGURATION_PERSONAL_SCOPE_DENIED","a non-privileged user cannot inspect another user's personal override");
}
{
 const h=harness({department:false,departments:["D-1"]});
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"});
 assert.equal(result.valor,"institution","without an explicit departmental override, the institutional value is inherited");
}
{
 const h=harness({departments:["D-1","D-2"]});
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-2"});
 assert.equal(result.valor,"institution","a D-1 override is never visible in D-2");
 assert.equal(result.origenEfectivo,"INSTITUCIONAL");
 assert.equal(result.valorDepartamental,null);
}
{
 const h=harness({policy:{policy:"GLOBAL_OBLIGATORIO",allowedScopes:["GLOBAL"],inheritance:false,override:false}});
 assert.equal(h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"}).valor,"global");
 assert.equal(h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"}).code,"CONFIGURATION_SCOPE_NOT_ALLOWED");
}
{
 const h=harness({institution:false,department:false});
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"});
 assert.equal(result.valor,"global","global is the safe fallback when no lower-scope value exists");
}
{
 const h=harness({departments:["D-1"]});
 h.sheets.ConfiguracionSistema.rows.push(h.sheets.ConfiguracionSistema.rows[1].slice());
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"});
 assert.equal(result.code,"CONFIGURATION_SCOPE_CONFLICT","duplicate global rows fail closed");
}
{
 const h=harness({departments:["D-1"]});
 h.sheets.ConfiguracionSistema.rows.push(h.sheets.ConfiguracionSistema.rows[2].slice());
 assertThrowsCode(()=>h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"}),"CONFIGURATION_INSTITUTION_CONFLICT");
}
{
 const h=harness({departments:["D-1"]});
 h.sheets.ConfiguracionDepartamental.rows.push(h.sheets.ConfiguracionDepartamental.rows[1].slice());
 assertThrowsCode(()=>h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"}),"CONFIGURATION_DEPARTMENT_CONFLICT");
}
{
 const h=harness({personal:true,departments:["D-1"]});
 h.sheets.ConfiguracionSistema.rows.push(h.sheets.ConfiguracionSistema.rows[3].slice());
 assertThrowsCode(()=>h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"}),"CONFIGURATION_PERSONAL_CONFLICT");
}
{
 const h=harness({departments:["D-1"],policy:{inheritance:false,allowedScopes:["GLOBAL","INSTITUCIONAL","DEPARTAMENTAL"]}});
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag"});
 assert.equal(result.valor,"global","disabled inheritance does not silently apply lower-scope values");
 assert.equal(h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",departamentoId:"D-1"}).code,"CONFIGURATION_INHERITANCE_DISABLED");
}
{
 const h=harness({departments:["D-1"]});
 const result=h.ctx.resolveHierarchicalConfiguration({clave:"feature.flag",requireDepartmentContext:true});
 assert.equal(result.code,"CONFIGURATION_DEPARTMENT_REQUIRED");
}

assert.match(source,/policyChange&&\(scope!=="GLOBAL"\|\|\["Administrador","Desarrollador"\]\.indexOf\(role\)===-1\)/);
assert.match(source,/if\(policyChange\)\{policy=\{policy:policyName/);
function runDeveloperValidation(payload,options={}){
 const properties=options.properties||{};
 const context={
  Date,PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||""})},
  SpreadsheetApp:{openById:id=>{if(options.spreadsheetAccess===false)throw Error("SPREADSHEET_ACCESS_DENIED");return{getId:()=>id};}},
  DriveApp:{getFolderById:id=>{if(options.driveAccess===false)throw Error("DRIVE_ACCESS_DENIED");return{getId:()=>id};}}
 };
 vm.runInNewContext(developerValidationCode,context);
 return context.validateServiceConfigDependencies(payload);
}
{
 const result=runDeveloperValidation({serviceKey:"USER",spreadsheetId:"SHEET_ID_1234567890"});
 assert.equal(result.status,"success");assert.equal(result.isReadyForActivation,true);assert.equal(result.validationReport.permissionsCheck,"PASS");
}
{
 const result=runDeveloperValidation({serviceKey:"USER",spreadsheetId:"SHEET_ID_1234567890"},{spreadsheetAccess:false});
 assert.equal(result.status,"error");assert.equal(result.isReadyForActivation,false);assert.ok(result.validationReport.missingDependencies.includes("SPREADSHEET_ACCESS"));
}
{
 const result=runDeveloperValidation({serviceKey:"ACADEMIC",spreadsheetId:"SHEET_ID_1234567890",driveFolderId:"DRIVE_FOLDER_1234567890"},{driveAccess:false});
 assert.equal(result.status,"error");assert.equal(result.isReadyForActivation,false);assert.ok(result.validationReport.missingDependencies.includes("DRIVE_FOLDER_ACCESS"));
}
{
 const result=runDeveloperValidation({serviceKey:"FRONTEND"});
 assert.equal(result.status,"success");assert.equal(result.isReadyForActivation,true);assert.equal(result.validationReport.permissionsCheck,"NOT_REQUIRED");
}
{
 const result=runDeveloperValidation({serviceKey:"USER",spreadsheetId:"SHEET_ID_1234567890",requireConfigurationHierarchy:true});
 assert.equal(result.status,"error");assert.ok(result.validationReport.missingDependencies.includes("CONFIGURATION_HIERARCHY_CONTRACT"));
}
{
 const hierarchy={precedence:["GLOBAL","INSTITUCIONAL","DEPARTAMENTAL","PERSONAL"],policies:["GLOBAL_OBLIGATORIO","INSTITUCIONAL","HEREDABLE","PERSONALIZABLE","RESTRINGIDO"]};
 const result=runDeveloperValidation({serviceKey:"USER",spreadsheetId:"SHEET_ID_1234567890",requireConfigurationHierarchy:true,configurationHierarchy:hierarchy,configurationDependencies:["ConfiguracionSistema","ConfiguracionDepartamental"]});
 assert.equal(result.status,"success");assert.equal(result.validationReport.configurationHierarchyValid,true);assert.equal(result.validationReport.configurationDependenciesValid,true);
}
{
 const result=runDeveloperValidation({serviceKey:"USER",spreadsheetId:"SHEET_ID_1234567890",configurationDependencies:["A","A"]});
 assert.equal(result.status,"error");assert.ok(result.validationReport.missingDependencies.includes("CONFIGURATION_DEPENDENCIES"));
}
{
 const result=runDeveloperValidation({serviceKey:"UNKNOWN"});
 assert.equal(result.code,"SERVICE_KEY_UNKNOWN");assert.equal(result.isReadyForActivation,false);
}
{
 const catalogContext={};
 vm.runInNewContext(developerCatalogCode,catalogContext);
 const result=catalogContext.getCentralConfigAndContractCatalog({});
 assert.equal(result.configurationHierarchy.precedence.join(","),"GLOBAL,INSTITUCIONAL,DEPARTAMENTAL,PERSONAL");
 assert.ok(result.contracts.USER.actions.includes("resolveHierarchicalConfiguration"));
 assert.ok(result.contracts.USER.actions.includes("resetSystemConfigurationOverride"));
}

function schemaSheet(initialRows=[]){
 const rows=initialRows.map(r=>r.slice());
 return {
  rows,
  getLastRow(){return rows.length;},
  getDataRange(){return{getValues:()=>rows.length?rows.map(r=>r.slice()):[[""]]};},
  getRange(rowIndex,col,count,width){
   return {
    getValues(){const out=[];for(let i=0;i<count;i++){const r=rows[rowIndex-1+i]||[];out.push(r.slice(col-1,col-1+width));}return out;},
    setValues(values){values.forEach((v,i)=>{while(rows.length<rowIndex+i)rows.push([]);const target=rows[rowIndex-1+i];for(let j=0;j<width;j++)target[col-1+j]=v[j];});}
   };
  },
  appendRow(row){rows.push(row.slice());}
 };
}
function runSchema(system,department){
 const sheets={ConfiguracionSistema:system};if(department)sheets.ConfiguracionDepartamental=department;
 const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>(sheets[n]=schemaSheet(),sheets[n])};
 const context={getOrCreateSheet:(book,name)=>book.getSheetByName(name)||book.insertSheet(name)};
 vm.runInNewContext(schemaCode,context);
 return{result:context.ensureConfigurationHierarchySchema_(ss),sheets};
}
{
 const legacy=["ConfigID","Clave","Valor","Tipo","Categoria","Descripcion","Ambito","EditablePor","Estado","Version","UpdatedAt","UpdatedBy"];
 const data=["CFG-LEGACY","old.key","keep-me","TEXTO","GENERAL","legacy","GLOBAL","Administrador","ACTIVO","1.0","2026-01-01","U-OLD"];
 const system=schemaSheet([legacy,data]);
 const run=runSchema(system,null);
 assert.deepEqual(run.result.headers,legacy.concat(["InstitutionID","UserID","PoliticaAlcance","AmbitosPermitidosJSON","PermiteHerencia","PermiteSobrescritura","RolesAutorizadosJSON","DependenciasJSON","EsSensible"]));
 assert.deepEqual(system.rows[1],data,"legacy data columns are preserved byte-for-byte");
 assert.equal(run.sheets.ConfiguracionDepartamental.rows.length,1);
 const after=JSON.stringify(system.rows);
 runSchema(system,run.sheets.ConfiguracionDepartamental);
 assert.equal(JSON.stringify(system.rows),after,"schema migration is idempotent");
}
{
 const system=schemaSheet([]);
 const run=runSchema(system,null);
 assert.equal(system.rows[0][0],"ConfigID","an empty installation receives the full system schema");
 assert.equal(system.rows[0].length,21);
 assert.equal(run.sheets.ConfiguracionDepartamental.rows[0][0],"OverrideID");
}
{
 const legacy=["ConfigID","Clave","Valor","Tipo","Categoria","Descripcion","Ambito","EditablePor","Estado","Version","UpdatedAt","UpdatedBy"];
 const invalid=legacy.slice().reverse();
 const system=schemaSheet([invalid]);
 const before=JSON.stringify(system.rows);
 assert.throws(()=>runSchema(system,null),/CONFIGURATION_SYSTEM_SCHEMA_MISMATCH/);
 assert.equal(JSON.stringify(system.rows),before,"an unknown schema is rejected without rewriting existing columns");
}
{
 const legacy=["ConfigID","Clave","Valor","Tipo","Categoria","Descripcion","Ambito","EditablePor","Estado","Version","UpdatedAt","UpdatedBy"];
 const system=schemaSheet([legacy.concat(["UnrelatedColumn"])]);
 const before=JSON.stringify(system.rows);
 assert.throws(()=>runSchema(system,null),/CONFIGURATION_SYSTEM_SCHEMA_MISMATCH/);
 assert.equal(JSON.stringify(system.rows),before,"unexpected columns are preserved and migration fails closed");
}
{
 const legacy=["ConfigID","Clave","Valor","Tipo","Categoria","Descripcion","Ambito","EditablePor","Estado","Version","UpdatedAt","UpdatedBy"];
 const system=schemaSheet([legacy.concat(["InstitutionID","UserID","PoliticaAlcance","AmbitosPermitidosJSON","PermiteHerencia","PermiteSobrescritura","RolesAutorizadosJSON","DependenciasJSON","EsSensible"])]);
 const badDepartment=schemaSheet([["WrongHeader"]]);
 const before=JSON.stringify(badDepartment.rows);
 assert.throws(()=>runSchema(system,badDepartment),/CONFIGURATION_DEPARTMENT_SCHEMA_MISMATCH/);
 assert.equal(JSON.stringify(badDepartment.rows),before);
}

console.log("USER hierarchical configuration security and precedence contract PASS.");
