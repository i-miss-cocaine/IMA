const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(s,n){const a=s.indexOf("function "+n+"(");assert.ok(a>=0,n);const o=s.indexOf("{",a);let d=0,q="",e=false,l=false,b=false;for(let i=o;i<s.length;i++){const c=s[i],x=s[i+1];if(l){if(c==="\n")l=false;continue;}if(b){if(c==="*"&&x==="/"){b=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==="\\"){e=true;continue;}if(c===q)q="";continue;}if(c==="/"&&x==="/"){l=true;i++;continue;}if(c==="/"&&x==="*"){b=true;i++;continue;}if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue;}if(c==="{")d++;else if(c==="}"&&--d===0)return s.slice(a,i+1);}throw Error(n+" unbalanced");}
const root=path.resolve(__dirname,"../.."),src=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8"),hr=fs.readFileSync(path.join(root,"dashboard-recursos-humanos.html"),"utf8"),acct=fs.readFileSync(path.join(root,"dashboard-contabilidad.html"),"utf8");
const names=["ensurePayrollConceptSheet_","normalizePayrollRole_","requirePayrollConceptManager_","getPayrollConceptHeaders_","getPayrollAssignmentHeaders_","getPayrollConceptHistoryHeaders_","getPayrollConceptDetailHeaders_","payrollConceptCategories_","payrollConceptPhase_","tokenizePayrollFormula_","evaluatePayrollFormula_","getPayrollConceptEngine_","resolvePayrollConceptBase_","calculatePayrollConceptPhase_","getPayrollConceptCatalog","savePayrollConcept","setPayrollConceptStatus","assignPayrollConcept","getPayrollConceptAssignments","appendPayrollConceptDetailRows_","summarizePayrollConceptDetails_"];
const code=names.map(n=>extract(src,n)).join("\n");assert.doesNotThrow(()=>new vm.Script(src));
const headers={
 catalog:["ConceptoID","Codigo","Nombre","Descripcion","Categoria","Naturaleza","TipoCalculo","Valor","BaseCalculo","Formula","Frecuencia","VigenciaInicio","VigenciaFin","TratamientoISR","TratamientoIHSS","CuentaContable","VisibleBoleta","Prioridad","Estado","Recurrente","Version","FechaCreacion","CreadoPor","FechaActualizacion","ActualizadoPor"],
 assignments:["AsignacionID","CodigoConcepto","TipoAsignacion","ValorAsignacion","DepartamentoScope","ValorOverride","FechaInicio","FechaFin","Frecuencia","PeriodoUnico","Estado","Observaciones","CreadoPor","FechaCreacion"],
 history:["HistorialID","ConceptoID","Codigo","Version","SnapshotJSON","Fecha","ActorId","Accion"],
 detail:["DetalleID","PlanillaID","Periodo","EmpleadoId","Codigo","Nombre","Categoria","Naturaleza","TipoCalculo","Valor","Monto","CuentaContable","VisibleBoleta","TratamientoISR","TratamientoIHSS","Version","AsignacionID","Formula","BaseCalculo","Estado"]
};
const rows={ExpedientesLaborales:[["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],["E1","P1","U1","Docente","D1","CC1","2020-01-01","","Activo",""]]};
function sheet(name){return {getDataRange:()=>({getValues:()=>(rows[name]||[]).map(r=>r.slice())}),getLastRow:()=>rows[name].length,getRange:(row,col,nr,nc)=>({setValues:v=>{for(let i=0;i<v.length;i++)rows[name][row-1+i]=v[i].slice();},setValue:v=>{if(!rows[name][row-1])rows[name][row-1]=[];rows[name][row-1][col-1]=v;},clearContent:()=>{for(let i=0;i<nr;i++)if(rows[name][row-1+i])rows[name][row-1+i]=[];}}),appendRow:r=>rows[name].push(r.slice())};}
const ss={getSheetByName:n=>Object.prototype.hasOwnProperty.call(rows,n)?sheet(n):null};
let seq=0;const ctx={SpreadsheetApp:{openById:()=>ss},SPREADSHEET_ID:"TEST",Utilities:{getUuid:()=>"UUID-"+(++seq)},getOrCreateSheet:(s,n)=>{if(!rows[n])rows[n]=[];return sheet(n);},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},getVerifiedAccountingIdentity_:p=>p&&p.sessionToken==="hr"?{authorized:true,userId:"HR-1",role:"RecursosHumanos"}:p&&p.sessionToken==="admin"?{authorized:true,userId:"ADMIN",role:"Administrador"}:{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"},getVerifiedAccountingDepartmentScope_:()=>({authorized:true,departmentIds:["D1"],institutionWide:false}),resolveEmployeeLoanAdvanceAccess_:()=>({authorized:true})};
vm.createContext(ctx);vm.runInContext(code,ctx);
assert.equal(ctx.evaluatePayrollFormula_("BASE + SALARIO_BASE * 0.05",{BASE:100,SALARIO_BASE:1000}),150);
assert.equal(ctx.evaluatePayrollFormula_("-5 + 2 * (3 + 1)",{}),3);
assert.throws(()=>ctx.evaluatePayrollFormula_("1 / 0",{}),/PAYROLL_FORMULA_DIVISION_BY_ZERO/);
assert.throws(()=>ctx.evaluatePayrollFormula_("1 + (2 *",{}),/PAYROLL_FORMULA_SYNTAX_INVALID/);
function concept(id,code,name,category,nature,type,value,base,formula,frequency="MENSUAL",isr="EXENTO",ihss="NO_COTIZABLE",account="5105",visible=true,priority=1,recurrent=true,status="ACTIVO"){
 return [id,code,name,"",category,nature,type,value,base,formula,frequency,"","",isr,ihss,account,visible,priority,status,recurrent,1,new Date(),"HR-1",new Date(),"HR-1"];
}
function assignment(id,code,type="EMPLEADO",target="U1",dept="D1",frequency="MENSUAL",period=""){
 return [id,code,type,target,dept,"","","",frequency,period,"ACTIVO","","HR-1",new Date()];
}
rows.CatalogoConceptosPlanilla=[headers.catalog,
 concept("C1","BONO_FIJO","Bono fijo","BONIFICACIONES_FIJAS","DEBE","FIJO",100,"SALARIO_BASE","", "MENSUAL","EXENTO","NO_COTIZABLE","5105",true,1),
 concept("C2","BONO_FORMULA","Bono variable","BONIFICACIONES_VARIABLES","DEBE","FORMULA",0,"SALARIO_BASE","BONO_FIJO * 0.2","MENSUAL","GRAVADO","COTIZABLE","5106",true,2),
 concept("C3","DEDUCCION_VOL","Deducción voluntaria","DEDUCCIONES_VOLUNTARIAS","HABER","PORCENTAJE",5,"SALARIO_BASE","","MENSUAL","EXENTO","NO_COTIZABLE","2105",false,3),
 concept("C4","APORTE_EXTRA","Aporte patronal extra","APORTACIONES_PATRONALES","HABER","FIJO",25,"SALARIO_BASE","","MENSUAL","EXENTO","NO_COTIZABLE","2106",false,4)
];
rows.AsignacionesConceptosPlanilla=[headers.assignments,assignment("A1","BONO_FIJO"),assignment("A2","BONO_FORMULA"),assignment("A3","DEDUCCION_VOL"),assignment("A4","APORTE_EXTRA")];
const engine=ctx.getPayrollConceptEngine_(ss);assert.equal(engine.concepts.length,4);
const employee=["E1","P1","U1","Docente","D1","CC1"];
const context={salarioBase:1000,devengado:1000,horasExtras:0,baseCotizable:1000,baseISR:1000,diasTrabajados:30,diasPeriodo:30,ihss:0,rap:0,isr:0,salarioNeto:0,conceptValues:Object.create(null)};
const income=ctx.calculatePayrollConceptPhase_(engine,employee,"U1","2026-11","PLN-1",context,1,Infinity);assert.equal(income.total,120);assert.equal(income.taxableIncome,20);assert.equal(income.cotizableIncome,20);assert.equal(context.conceptValues.BONO_FORMULA,20);
context.devengado=1120;context.baseCotizable=1020;context.baseISR=1020;context.ihss=35;context.rap=0;context.isr=0;
const deduction=ctx.calculatePayrollConceptPhase_(engine,employee,"U1","2026-11","PLN-1",context,2,30);assert.equal(deduction.total,30,"voluntary deductions are capped to available net");
const employer=ctx.calculatePayrollConceptPhase_(engine,employee,"U1","2026-11","PLN-1",context,3,Infinity);assert.equal(employer.total,25);
const detailRows=[...income.details,...deduction.details,...employer.details];ctx.appendPayrollConceptDetailRows_(ss,detailRows);
const summary=ctx.summarizePayrollConceptDetails_(ss,"PLN-1");assert.equal(summary.incomeTotal,120);assert.equal(summary.deductionTotal,30);assert.equal(summary.employerTotal,25);assert.equal(summary.journalLines.length,4);
const debit=summary.journalLines.reduce((n,x)=>n+x.debe,0)+1000+25,credit=summary.journalLines.reduce((n,x)=>n+x.haber,0)+1090;assert.equal(debit,credit,"dynamic concept journal lines balance with fixed payroll accounts");
assert.equal(summary.journalLines.find(x=>x.cuenta==="2106").haber,25,"employer concept posts to its liability account");
assert.equal(rows.DetalleConceptosPlanilla.filter(r=>r[12]===false).length,2,"hidden concepts remain in accounting detail");
const catalog=ctx.getPayrollConceptCatalog({sessionToken:"hr"});assert.equal(catalog.status,"success");assert.equal(catalog.conceptos.length,4);
const created=ctx.savePayrollConcept({sessionToken:"hr",codigo:"NUEVO_CONCEPTO",nombre:"Nuevo concepto",categoria:"BONIFICACIONES_FIJAS",naturaleza:"DEBE",tipoCalculo:"FIJO",valor:10,baseCalculo:"SALARIO_BASE",frecuencia:"MENSUAL",tratamientoISR:"EXENTO",tratamientoIHSS:"NO_COTIZABLE",cuentaContable:"5110",prioridad:10,visibleBoleta:true,recurrente:true});assert.equal(created.status,"success");
const updated=ctx.savePayrollConcept({sessionToken:"hr",conceptoId:created.conceptoId,codigo:"NUEVO_CONCEPTO",nombre:"Nuevo concepto actualizado",categoria:"BONIFICACIONES_FIJAS",naturaleza:"DEBE",tipoCalculo:"FIJO",valor:15,baseCalculo:"SALARIO_BASE",frecuencia:"MENSUAL",tratamientoISR:"EXENTO",tratamientoIHSS:"NO_COTIZABLE",cuentaContable:"5110",prioridad:10,visibleBoleta:true,recurrente:true});assert.equal(updated.version,2);assert.equal(rows.HistorialConceptosPlanilla.length,2,"edits preserve previous version");
const invalid=ctx.savePayrollConcept({sessionToken:"hr",codigo:"FORMULA_INVALIDA",nombre:"Formula inválida",categoria:"BONIFICACIONES_FIJAS",naturaleza:"DEBE",tipoCalculo:"FORMULA",valor:0,baseCalculo:"SALARIO_BASE",formula:"CODIGO_INEXISTENTE + 1",frecuencia:"MENSUAL",tratamientoISR:"EXENTO",tratamientoIHSS:"NO_COTIZABLE",cuentaContable:"5111",prioridad:11});assert.equal(invalid.code,"PAYROLL_CONCEPT_DEPENDENCY_INVALID");assert.ok(!rows.CatalogoConceptosPlanilla.some(r=>r[1]==="FORMULA_INVALIDA"),"invalid concept write rolls back");
const assignmentResult=ctx.assignPayrollConcept({sessionToken:"hr",codigoConcepto:"NUEVO_CONCEPTO",tipoAsignacion:"EMPLEADO",valorAsignacion:"U1",frecuencia:"MENSUAL"});assert.equal(assignmentResult.status,"success");
assert.equal(ctx.assignPayrollConcept({sessionToken:"hr",codigoConcepto:"NUEVO_CONCEPTO",tipoAsignacion:"EMPLEADO",valorAsignacion:"U1",frecuencia:"MENSUAL"}).code,"PAYROLL_CONCEPT_ASSIGNMENT_DUPLICATE");
assert.equal(ctx.getPayrollConceptAssignments({sessionToken:"hr"}).asignaciones.length,5);
assert.equal(ctx.assignPayrollConcept({sessionToken:"hr",codigoConcepto:"NUEVO_CONCEPTO",tipoAsignacion:"GLOBAL",valorAsignacion:"ALL"}).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED");
const inactive=ctx.setPayrollConceptStatus({sessionToken:"hr",conceptoId:created.conceptoId,estado:"INACTIVO"});assert.equal(inactive.status,"success");
rows.AsignacionesConceptosPlanilla=[headers.assignments];
const cycleRows=rows.CatalogoConceptosPlanilla.slice(0,1).concat([
 concept("X1","CYCLE_A","A","BONIFICACIONES_FIJAS","DEBE","FORMULA",0,"SALARIO_BASE","CYCLE_B + 1"),
 concept("X2","CYCLE_B","B","BONIFICACIONES_FIJAS","DEBE","FORMULA",0,"SALARIO_BASE","CYCLE_A + 1")
]);
rows.CatalogoConceptosPlanilla=cycleRows;assert.throws(()=>ctx.getPayrollConceptEngine_(ss),/PAYROLL_FORMULA_CYCLE/);
const unknownRows=rows.CatalogoConceptosPlanilla.slice(0,1).concat([concept("X3","UNKNOWN_REF","Unknown","BONIFICACIONES_FIJAS","DEBE","FORMULA",0,"SALARIO_BASE","MISSING_CODE + 1")]);
rows.CatalogoConceptosPlanilla=unknownRows;assert.throws(()=>ctx.getPayrollConceptEngine_(ss),/PAYROLL_FORMULA_REFERENCE_INVALID/);
assert.ok(src.includes("calculatePayrollConceptPhase_(payrollConceptEngine,e,empUserId,periodoMes,planillaId,conceptContext,1"),"monthly payroll runs dynamic income rules");
assert.ok(src.includes("summarizePayrollConceptDetails_(ss,planillaId)"),"journal consumes concept detail snapshots");
assert.ok(src.includes("visiblePayrollConcepts.forEach"),"receipt renders visible concepts only");
assert.ok(hr.includes("payroll-concepts-panel")&&hr.includes("savePayrollConcept")&&hr.includes("assignPayrollConcept"),"HR dashboard exposes catalog and assignments");
assert.ok(acct.includes("dashboard-recursos-humanos.html#payroll-concepts-panel"),"accounting dashboard links to concept manager");
const scripts=[...hr.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());scripts.forEach(s=>assert.doesNotThrow(()=>new vm.Script(s)));
console.log("ACCOUNTING dynamic payroll concept catalog contract passed: safe formulas, dependency graph, scoped assignments, phase calculation, tax flags, immutable detail, accounting balance, version history, rollback and UI syntax");