"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("backend/academic-service/Code.gs","utf8");
function extract(name){
  const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);
  const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;
  for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];
    if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
    if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}
    if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}
    if(c==="'"||c==='"'||c==="`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);
  }throw new Error("unterminated "+name);
}
function sheet(headers,rows){
 const h=headers.slice(),r=rows.map(x=>x.slice());
 return {getLastColumn:()=>h.length,getLastRow:()=>r.length+1,
 getRange(row,col,nr,nc){return {getValues(){if(row===1)return [h.slice(col-1,col-1+(nc||1))];return r.slice(row-2,row-2+(nr||1)).map(x=>x.slice(col-1,col-1+(nc||1)));},
 setValue(v){if(row===1)h[col-1]=v;else r[row-2][col-1]=v;},
 setValues(vs){vs.forEach((line,i)=>line.forEach((v,j)=>{if(row+i===1)h[col-1+j]=v;else (r[row+i-2]||(r[row+i-2]=[]))[col-1+j]=v;}));}};},
 getDataRange:()=>({getValues:()=>[h.slice(),...r.map(x=>x.slice())]}),appendRow:x=>r.push(x.slice()),_h:h,_r:r};
}
const plans=[{planId:"P1",grado:"10",estado:"Vigente"}];
const subjects=[{asignaturaId:"S1",grado:"10",isActive:true},{asignaturaId:"S2",grado:"10",isActive:false}];
const rels=sheet(["RelID","PlanID","AsignaturaID","Grado","Caracter","HorasSemanales","Orden"],[]);
let locked=false,acquires=0,releases=0;
const ctx={SPREADSHEET_ID:"TEST",SpreadsheetApp:{openById:()=>({})},getOrCreateSheet:()=>rels,
 getStudyPlans:()=>({data:plans}),getInstitutionalAreaRecords_:()=>[],getInstitutionalSubjectRecords_:()=>subjects,
 LockService:{getScriptLock:()=>({tryLock:()=>{assert.equal(locked,false,"lock must serialize mutations");locked=true;acquires++;return true;},releaseLock:()=>{assert.equal(locked,true);locked=false;releases++;}})},
 Utilities:{getUuid:()=> "00000000-0000-4000-8000-000000000001"},normalizeStudyPlanValidity_:v=>String(v),Date,Number,String,Error,Array,Object,JSON,Math};
vm.runInNewContext(["getStudyPlanSubjectColumnMap_","getStudyPlanSubjects","createStudyPlanSubject","setStudyPlanSubjectStatus"].map(extract).join("\n")+"\nthis.api={getStudyPlanSubjects,createStudyPlanSubject,setStudyPlanSubjectStatus};",ctx);
const created=ctx.api.createStudyPlanSubject({planId:"P1",asignaturaId:"S1",caracter:"Obligatoria",horasSemanales:5,orden:1});
assert.equal(created.data.estado,"Activo");assert.equal(rels._r.length,1);
assert.throws(()=>ctx.api.createStudyPlanSubject({planId:"P1",asignaturaId:"S1",caracter:"Obligatoria",horasSemanales:5}),/PLAN_SUBJECT_ALREADY_ACTIVE/);
assert.throws(()=>ctx.api.createStudyPlanSubject({planId:"P1",asignaturaId:"S2",caracter:"Optativa",horasSemanales:3}),/SUBJECT_NOT_ACTIVE/);
assert.throws(()=>ctx.api.createStudyPlanSubject({planId:"P1",asignaturaId:"S1",caracter:"Optativa",horasSemanales:0}),/PLAN_SUBJECT_HOURS_INVALID/);
const inactive=ctx.api.setStudyPlanSubjectStatus({relId:created.data.relId,estado:"Inactivo"});
assert.equal(inactive.data.estado,"Inactivo");assert.equal(rels._r[0][7],"Inactivo");
const history=ctx.api.getStudyPlanSubjects({planId:"P1",includeInactive:true});
assert.equal(history.data.length,1);assert.equal(history.data[0].estado,"Inactivo");
const active=ctx.api.createStudyPlanSubject({planId:"P1",asignaturaId:"S1",caracter:"Obligatoria",horasSemanales:5});
assert.equal(active.data.estado,"Activo");assert.equal(rels._r.length,2,"deactivation preserves history and permits a new active relation");
assert.equal(acquires,releases);assert.equal(locked,false);
console.log("academic-study-plan-subjects-contract: PASS (references, uniqueness, lifecycle, history, locking)");
