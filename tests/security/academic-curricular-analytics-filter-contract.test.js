"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("backend/academic-service/Code.gs","utf8");
function extract(name){const start=source.indexOf("function "+name+"(");assert.notEqual(start,-1,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw new Error("unterminated "+name);}
const headers=["ID","EvaluacionID","UserID","NotaObtenida","PuntajePonderado","EsBorrador","EsPublicada","Observaciones","FechaRegistro","AnoID","PeriodoID","Grado","Seccion","Asignatura","InstitutionID","ContextKey"];
const rows=[
 ["G1","E1","U1",95,95,false,true,"","2026-01-01","ANO-2026","PER-1","10","A","Matemáticas","INST-1","K1"],
 ["G2","E2","U2",85,85,false,true,"","2026-01-02","ANO-2026","PER-1","10","A","Inglés","INST-1","K2"],
 ["G3","E3","U3",65,65,false,true,"","2026-01-03","ANO-2026","PER-2","11","B","Matemáticas","INST-1","K3"],
 ["G4","E4","U4","",0,true,false,"","2026-01-04","ANO-2026","PER-1","10","A","Matemáticas","INST-1","K4"]
];
function context(data){
 const sheet={getDataRange:()=>({getValues:()=>data.map(row=>row.slice())})},ss={};
 const sandbox={SpreadsheetApp:{openById:()=>ss},SPREADSHEET_ID:"SHEET",getOrCreateSheet:()=>sheet,
  getInstitutionalAreaRecords_:()=>[{areaId:"AREA-MAT",name:"Matemáticas",code:"MAT",isActive:true},{areaId:"AREA-ING",name:"Idiomas",code:"IDI",isActive:true}],
  getInstitutionalSubjectRecords_:()=>[
   {asignaturaId:"ASIG-MAT",nombreOficial:"Matemáticas",codigo:"MAT-101",areaId:"AREA-MAT",areaAcademica:"Matemáticas",programaId:"PROG-COMUN"},
   {asignaturaId:"ASIG-ING",nombreOficial:"Inglés",codigo:"ENG-101",areaId:"AREA-ING",areaAcademica:"Idiomas",programaId:"PROG-BILINGUE"}],
  Object,Array,String,Number,Math,Error};
 vm.runInNewContext(extract("getCurricularAnalyticsReport")+"\nthis.run=getCurricularAnalyticsReport;",sandbox);
 return sandbox.run;
}
const run=context([headers,...rows]);
let result=run({});
assert.equal(result.data.metrics.totalEvaluaciones,4);
assert.equal(result.data.metrics.evaluadasCount,3);
assert.equal(result.data.metrics.notasPendientes,1);
assert.equal(result.data.metrics.promedioConsolidado,81.67);
result=run({grado:"10",periodo:"PER-1"});
assert.equal(result.data.metrics.totalEvaluaciones,3);
assert.equal(result.data.metrics.evaluadasCount,2);
result=run({asignatura:"ASIG-MAT"});
assert.equal(result.data.metrics.totalEvaluaciones,3);
assert.equal(result.data.metrics.evaluadasCount,2);
result=run({area:"AREA-ING"});
assert.equal(result.data.metrics.totalEvaluaciones,1);
assert.equal(result.data.metrics.promedioConsolidado,85);
result=run({programa:"PROG-BILINGUE"});
assert.equal(result.data.metrics.totalEvaluaciones,1);
assert.equal(result.data.metrics.promedioConsolidado,85);
result=run({area:"AREA-MAT",grado:"11",anoId:"ANO-2026",seccion:"B",periodo:"PER-2"});
assert.equal(result.data.metrics.totalEvaluaciones,1);
assert.equal(result.data.metrics.promedioConsolidado,65);
const legacyHeaders=headers.slice(0,9),legacyRow=["G5","E5","U5",90,90,false,true,"","2026-01-05"];
result=context([legacyHeaders,legacyRow])({area:"AREA-MAT"});
assert.equal(result.data.metrics.totalEvaluaciones,0);
assert.equal(result.data.legacyRowsExcluded,1);
assert.throws(()=>context([headers.slice(0,10).concat("WrongContextHeader"),...rows])({grado:"10"}),/CURRICULAR_ANALYTICS_CONTEXT_SCHEMA_INVALID/);
console.log("academic-curricular-analytics-filter-contract: PASS (19 assertions, legacy fail-closed, catalog joins).");
