"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../../backend/exam-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/exam-service/Code.gs"});
function extract(name){
 const re=new RegExp("function "+name+"\\s*\\("),m=re.exec(source);assert.ok(m,"missing "+name);
 const start=source.indexOf("{",m.index);let depth=0,quote="",escaped=false,line=false,block=false;
 for(let i=start;i<source.length;i++){const c=source[i],n=source[i+1];
  if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}
  if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}
  if(c==="'"||c==='"'||c.charCodeAt(0)===96){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(m.index,i+1);
 }throw Error("unbalanced "+name);
}
const headers=["ID","Titulo","Asignatura","Estado","CriteriosJSON"];
function fixture(options={}){
 const state={permission:options.permission!==false,actor:options.actor||{authorized:true,userId:"USR-1",role:"Profesor"},
  scope:options.scope||{authorized:true,institutionId:"INST-1"},opens:0,locks:0,releases:0,held:false};
 const rows=options.rows===undefined?[headers,["RUB-1","Rúbrica general","Matemáticas","Activa",'[{"criterio":"Resolución","peso":100}]']]:options.rows;
 const sheet=rows===null?null:{getDataRange(){return {getValues:()=>rows.map(r=>r.slice())};}};
 const ss={getSheetByName(name){return name==="RubricasEvaluacion"?sheet:null;}};
 const sandbox={SPREADSHEET_ID:"SHEET-1",
  LockService:{getScriptLock(){return {tryLock(){state.locks++;if(options.timeout||state.held)return false;state.held=true;return true;},
   releaseLock(){state.releases++;state.held=false;}};}},
  validateRolePermission(){return {authorized:state.permission};},
  getVerifiedExamIdentity_(){return state.actor;},
  getVerifiedExamDepartmentScope_(){if(options.duringScope)options.duringScope();return state.scope;},
  SpreadsheetApp:{openById(){state.opens++;return ss;}},
  normalizeString(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
 };
 const names=["getRubrics","withAuthorizedExamMetadataRead_","getRubricsUnlocked_"];
 vm.runInNewContext(names.map(extract).join("\n"),sandbox);
 return {call:(payload={asignatura:""})=>sandbox.getRubrics(payload),state};
}
function denied(fn,pattern){assert.throws(fn,pattern||/RESOURCE_NOT_AVAILABLE/);}
const cases=[];
function test(name,fn){try{fn();cases.push({name,ok:true});}catch(e){cases.push({name,ok:false,error:e.message});}}
test("authorized reader preserves status/data and parses criteria JSON",()=>{const x=fixture();const r=x.call();assert.equal(r.status,"success");assert.equal(r.data.length,1);assert.equal(r.data[0].rubricaId,"RUB-1");assert.equal(r.data[0].criterios[0].criterio,"Resolución");});
test("missing sheet returns empty data without creating a sheet",()=>{const x=fixture({rows:null});assert.deepEqual(x.call().data,[]);assert.equal(x.state.opens,1);});
test("header-only sheet returns empty data",()=>{const x=fixture({rows:[headers]});assert.deepEqual(x.call().data,[]);});
test("permission denial fails closed before spreadsheet access",()=>{const x=fixture({permission:false});denied(()=>x.call());assert.equal(x.state.opens,0);});
test("missing verified identity is denied",()=>{const x=fixture({actor:{authorized:false}});denied(()=>x.call());assert.equal(x.state.opens,0);});
test("unknown role is denied",()=>{const x=fixture({actor:{authorized:true,userId:"USR-X",role:"Visitor"}});denied(()=>x.call());assert.equal(x.state.opens,0);});
test("missing scope is denied and lock released",()=>{const x=fixture({scope:{authorized:false}});denied(()=>x.call());assert.equal(x.state.releases,1);});
test("lock timeout fails closed",()=>{const x=fixture({timeout:true});denied(()=>x.call(),/EXAM_METADATA_READ_LOCK_TIMEOUT/);assert.equal(x.state.opens,0);});
test("nested concurrent read is excluded",()=>{let x,nested=false;x=fixture({duringScope(){denied(()=>x.call(),/EXAM_METADATA_READ_LOCK_TIMEOUT/);nested=true;}});x.call();assert.ok(nested);assert.equal(x.state.releases,1);});
test("subject filter is preserved",()=>{const rows=[headers,["R1","Mate","Matemáticas","Activa","[]"],["R2","Lengua","Español","Activa","[]"]];const x=fixture({rows});const r=x.call({asignatura:"espanol"});assert.equal(r.data.length,1);assert.equal(r.data[0].rubricaId,"R2");});
test("deleted rubrics are omitted",()=>{const x=fixture({rows:[headers,["R1","Borrada","General","Eliminada","[]"]]});assert.equal(x.call().data.length,0);});
test("duplicate rubric identifiers are excluded",()=>{const x=fixture({rows:[headers,["R1","A","General","Activa","[]"],["R1","B","General","Activa","[]"]]});assert.equal(x.call().data.length,0);});
test("invalid schema fails closed",()=>{const x=fixture({rows:[["wrong","Titulo","Asignatura","Estado","CriteriosJSON"],["R1","A","General","Activa","[]"]]});denied(()=>x.call(),/RUBRICS_SCHEMA_INVALID/);assert.equal(x.state.releases,1);});
test("invalid criteria JSON fails closed",()=>{const x=fixture({rows:[headers,["R1","A","General","Activa","{bad"]]});denied(()=>x.call(),/RUBRICS_CRITERIA_INVALID/);assert.equal(x.state.releases,1);});
test("public action allowlist does not contain getRubrics",()=>{const block=source.match(/const PUBLIC_ACTIONS = \[([\s\S]*?)\];/);assert.ok(block);assert.ok(!block[1].includes("getRubrics"));});
test("read handler has no sheet creation or row mutation",()=>{const start=source.indexOf("function getRubrics(payload)"),end=source.indexOf("function saveRubric(payload)",start);const handler=source.slice(start,end);assert.ok(!handler.includes("getOrCreateSheet"));assert.ok(!handler.includes("appendRow"));});
const failed=cases.filter(c=>!c.ok);if(failed.length){failed.forEach(c=>process.stdout.write("FAIL "+c.name+": "+c.error+"\n"));throw Error(failed.length+" test(s) failed");}
process.stdout.write("exam-service-rubrics-security: PASS ("+cases.length+" scenarios)\n");
