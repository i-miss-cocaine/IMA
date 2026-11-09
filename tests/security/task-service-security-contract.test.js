const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"backend/task-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extractFunction(name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function exists: "+name);
 const open=source.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const ch=source[i],n=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&n==="/"){block=false;i++;}continue;}
 if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
 if(ch==="/"&&n==="/"){line=true;i++;continue;}if(ch==="/"&&n==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue;}
 if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}
 throw new Error("unbalanced "+name);
}
function makeSheet(rows){return{rows,getLastRow:()=>rows.length,appendRow:r=>rows.push(r.slice()),getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),getRange:(row,col,numRows,numCols)=>({setValue:value=>{rows[row-1][col-1]=value;},setValues:values=>{values.forEach((r,i)=>r.forEach((v,j)=>{rows[row-1+i][col-1+j]=v;}));}})};}
const metadataHeaders=["ID","Titulo","NombreOriginal","NombreFisico","TipoRecurso","Asignatura","Grado","Seccion","Parcial","Anio","Tema","TareaId","ProfesorId","FechaSubida","Estado","DriveId","RutaDrive","MimeType","TamanoBytes","PropietarioUserId","DriveFolderId"];
function metaRow(id,file,owner=""){const r=new Array(21).fill("");r[0]=id;r[1]=file;r[11]="";r[14]="Activo";r[15]=file;r[19]=owner;return r;}
const metadataRows=[metadataHeaders,metaRow("M1","FILE-UNIQUE"),metaRow("M2","FILE-AMBIG"),metaRow("M3","FILE-ORPHAN"),metaRow("M4","FILE-OWNED","USR-4")];
const deliveryRows=[["EntregaID","TareaID","UserID","Fecha","FileId"],["E1","TASK-1","USR-1",new Date(),"FILE-UNIQUE"],["E2","TASK-2","USR-2",new Date(),"FILE-AMBIG"],["E3","TASK-3","USR-3",new Date(),"FILE-AMBIG"]];
const taskRows=[["TareaID","x1","x2","x3","x4","x5","x6","x7","x8","x9","ProfesorID"],["TASK-1","","","","","","","","","","PROF-1"]];
const sheets={MetadatosArchivos:makeSheet(metadataRows),Entregas:makeSheet(deliveryRows),Tareas:makeSheet(taskRows)};
const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>sheets[n]=makeSheet([])};
const context={SPREADSHEET_ID:"LOCAL",SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},
getOrCreateSheet:(_ss,n)=>sheets[n]||(sheets[n]=makeSheet([])),getSheetOrThrow:(_ss,n)=>{if(!sheets[n])throw Error("missing "+n);return sheets[n];},
ensureTaskServiceFileMetadataSheet:()=>sheets.MetadatosArchivos,extractTaskServiceFileId:x=>String(x||"").match(/FILE-[A-Z]+/)?.[0]||String(x||""),
};
vm.runInNewContext(extractFunction("reconcileLegacyTaskFileMetadata")+"this.run=reconcileLegacyTaskFileMetadata;",context);
assert.throws(()=>context.run({_verifiedRole:"Estudiante",_verifiedUserId:"USR-1"}),/administrador verificado/);
const dry=context.run({_verifiedRole:"Administrador",_verifiedUserId:"ADMIN-1"});
assert.equal(dry.dryRun,true);assert.equal(dry.wouldMigrate,1);assert.equal(dry.conflicts.length,1);assert.equal(dry.unresolved.length,1);assert.equal(metadataRows[1][19],"");
const applied=context.run({_verifiedRole:"Administrador",_verifiedUserId:"ADMIN-1",apply:true});
assert.equal(applied.migrated,1);assert.equal(metadataRows[1][19],"USR-1");assert.equal(metadataRows[1][11],"TASK-1");assert.equal(metadataRows[1][12],"PROF-1");
assert.equal(metadataRows[2][19],"","ambiguous ownership is never inferred");assert.equal(metadataRows[3][19],"","unlinked historical file remains fail-closed");
assert.equal(sheets.AuditoriaMigracionMetadatosArchivos.rows.length,2);
assert.equal(metadataRows[4][19],"USR-4");
assert.ok(source.includes('case "reconcileLegacyTaskFileMetadata"'));
console.log("TASK-636 legacy file metadata reconciliation local contract passed.");

// Reconciliation must roll back the current row if audit persistence fails.
const rollbackRows=[metadataHeaders,metaRow("M5","FILE-UNIQUE")];
const rollbackMeta=makeSheet(rollbackRows),rollbackAudit=makeSheet([]);
let auditAppendCount=0;const originalAppend=rollbackAudit.appendRow;
rollbackAudit.appendRow=function(row){auditAppendCount++;if(auditAppendCount===2)throw new Error("simulated audit failure");return originalAppend.call(this,row);};
const rollbackSheets={MetadatosArchivos:rollbackMeta,Entregas:makeSheet(deliveryRows),Tareas:makeSheet(taskRows),AuditoriaMigracionMetadatosArchivos:rollbackAudit};
const rollbackSS={getSheetByName:n=>rollbackSheets[n]||null,insertSheet:n=>rollbackSheets[n]=makeSheet([])};
const rollbackContext={SPREADSHEET_ID:"LOCAL",SpreadsheetApp:{openById:()=>rollbackSS},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},getOrCreateSheet:(_ss,n)=>rollbackSheets[n]||(rollbackSheets[n]=makeSheet([])),getSheetOrThrow:(_ss,n)=>rollbackSheets[n],ensureTaskServiceFileMetadataSheet:()=>rollbackMeta,extractTaskServiceFileId:x=>String(x||"").match(/FILE-[A-Z]+/)?.[0]||String(x||"")};
vm.runInNewContext(extractFunction("reconcileLegacyTaskFileMetadata")+"this.run=reconcileLegacyTaskFileMetadata;",rollbackContext);
assert.throws(()=>rollbackContext.run({_verifiedRole:"Administrador",_verifiedUserId:"ADMIN-1",apply:true}),/simulated audit failure/);
assert.equal(rollbackRows[1][19],"","failed audit write rolls metadata ownership back");
assert.equal(rollbackRows[1][11],"","failed audit write rolls task link back");
