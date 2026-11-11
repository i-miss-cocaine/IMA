"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/exam-service/Code.gs"});
function extract(name){
 const re=new RegExp("function "+name+"\\s*\\("),m=re.exec(source);assert.ok(m,"missing "+name);
 const start=source.indexOf("{",m.index);let depth=0,quote="",escaped=false,line=false,block=false;
 for(let i=start;i<source.length;i++){const c=source[i],n=source[i+1];
  if(line){if(c==="\\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(c==="\\\\"){escaped=true;continue;}if(c===quote)quote="";continue;}
  if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}
  if(c==="'"||c==='"'||c==="\`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(m.index,i+1);
 }throw Error("unbalanced "+name);
}
function fixture(options={}){
 const state={permission:options.permission!==false,actor:options.actor||{authorized:true,userId:"USR-1",role:"Profesor"},
  scope:options.scope||{authorized:true,institutionId:"INST-1"},opens:0,locks:0,releases:0,held:false};
 const rows=options.rows===undefined?[["ID","Nombre","Ambito","PorcentajePonderacion","EscalaID","Estado"],
  ["CAT-X","Evaluación continua","Global",25,"100","Activo"]]:options.rows;
 const sheet=rows===null?null:{getDataRange(){return {getValues:()=>rows.map(r=>r.slice())};}};
 const ss={getSheetByName(name){return name==="CategoriasEvaluacion"?sheet:null;}};
 const sandbox={SPREADSHEET_ID:"SHEET-1",
  LockService:{getScriptLock(){return {tryLock(){state.locks++;if(options.timeout)return false;if(state.held)return false;state.held=true;return true;},
   releaseLock(){state.releases++;state.held=false;}};}},
  validateRolePermission(){return {authorized:state.permission};},
  getVerifiedExamIdentity_(){return state.actor;},
  getVerifiedExamDepartmentScope_(){return state.scope;},
  SpreadsheetApp:{openById(){state.opens++;return ss;}}
 };
 vm.runInNewContext([extract("getEvaluationCategories"),extract("withAuthorizedExamMetadataRead_"),extract("getEvaluationCategoriesUnlocked_")].join("\n"),sandbox);
 return {call:()=>sandbox.getEvaluationCategories({sessionToken:"synthetic"}),state};
}
const cases=[];
function test(name,fn){try{fn();cases.push({name,ok:true});}catch(e){cases.push({name,ok:false,error:e.message});}}
function denied(fn,pattern){assert.throws(fn,pattern||/RESOURCE_NOT_AVAILABLE/);}
test("authorized reader returns categories with legacy response contract",()=>{const x=fixture();const r=x.call();assert.equal(r.status,"success");assert.equal(r.data.length,1);assert.equal(r.data[0].categoriaId,"CAT-X");});
test("missing category sheet returns defaults without creating a sheet",()=>{const x=fixture({rows:null});const r=x.call();assert.equal(r.data.length,4);assert.equal(r.data[0].categoriaId,"CAT-1");assert.equal(x.state.opens,1);});
test("header-only sheet returns defaults without writing",()=>{const x=fixture({rows:[["ID","Nombre","Ambito","PorcentajePonderacion","EscalaID","Estado"]]});assert.equal(x.call().data.length,4);});
test("permission denial fails closed before opening spreadsheet",()=>{const x=fixture({permission:false});denied(()=>x.call());assert.equal(x.state.opens,0);});
test("missing verified identity is denied",()=>{const x=fixture({actor:{authorized:false}});denied(()=>x.call());assert.equal(x.state.opens,0);});
test("unknown role is denied even when permission helper allows",()=>{const x=fixture({actor:{authorized:true,userId:"USR-X",role:"Visitor"}});denied(()=>x.call());assert.equal(x.state.opens,0);});
test("missing department scope is denied",()=>{const x=fixture({scope:{authorized:false}});denied(()=>x.call());assert.equal(x.state.releases,1);});
test("lock timeout fails closed without opening spreadsheet",()=>{const x=fixture({timeout:true});denied(()=>x.call(),/EXAM_METADATA_READ_LOCK_TIMEOUT/);assert.equal(x.state.opens,0);assert.equal(x.state.releases,0);});
test("schema mismatch fails closed and releases lock",()=>{const x=fixture({rows:[["wrong","Nombre","Ambito","PorcentajePonderacion","EscalaID","Estado"]]});denied(()=>x.call(),/EVALUATION_CATEGORIES_SCHEMA_INVALID/);assert.equal(x.state.releases,1);});
test("read path does not expose any sheet mutation API",()=>{const x=fixture();x.call();assert.equal(x.state.held,false);assert.equal(x.state.releases,1);});
test("public action allowlist no longer contains getEvaluationCategories",()=>{const block=source.match(/const PUBLIC_ACTIONS = \[([\s\S]*?)\];/);assert.ok(block);assert.ok(!block[1].includes("getEvaluationCategories"));});
const failed=cases.filter(x=>!x.ok);if(failed.length){for(const c of failed)process.stdout.write("FAIL "+c.name+": "+c.error+"\n");throw Error(failed.length+" test(s) failed");}
process.stdout.write("exam-service-evaluation-categories-security: PASS ("+cases.length+" scenarios)\n");
