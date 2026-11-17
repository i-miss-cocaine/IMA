"use strict";
const assert=require("node:assert/strict"),crypto=require("node:crypto"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.resolve(__dirname,"../../backend/user-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/user-service/Code.gs"});
function extract(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,name+" exists");const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape)escape=false;else if(c==="\\")escape=true;else if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw new Error("unbalanced "+name);}
class Sheet{constructor(rows=[]){this.rows=rows.map(r=>r.slice());}getDataRange(){return{getValues:()=>this.rows.map(r=>r.slice())};}getRange(row,col,rowCount=1,colCount=1){return{getValues:()=>this.rows.slice(row-1,row-1+rowCount).map(r=>r.slice(col-1,col-1+colCount)),setValues:values=>values.forEach((r,i)=>{this.rows[row-1+i]=r.slice();}),setValue:value=>{this.rows[row-1][col-1]=value;}};}appendRow(row){this.rows.push(row.slice());}deleteRow(row){this.rows.splice(row-1,1);}}
const headers=["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto","TelefonoContacto","EstadoPersona","FechaCreacion","FechaActualizacion","Observaciones"];
const sheets=new Map(),spreadsheet={getSheetByName:n=>sheets.get(n)||null,insertSheet:n=>{const sh=new Sheet();sheets.set(n,sh);return sh;}};
let lockCount=0,releaseCount=0,uuid=0;
const constants=source.slice(source.indexOf("const MIGRATION_WRITER_SCHEMAS_="),source.indexOf(";const MIGRATION_WRITER_JOURNAL_HEADERS_=")+1)+"\n"+source.slice(source.indexOf("const MIGRATION_WRITER_JOURNAL_HEADERS_="),source.indexOf(";\n",source.indexOf("const MIGRATION_WRITER_JOURNAL_HEADERS_="))+1);
const runtime={SPREADSHEET_ID:"USER-SHEET",Date,String,JSON,Array,Object,Number,Math,RegExp,Error,
 SpreadsheetApp:{openById:id=>{assert.equal(id,"USER-SHEET");return spreadsheet;}},
 LockService:{getScriptLock:()=>({waitLock:ms=>{assert.equal(ms,10000);lockCount++;},releaseLock:()=>releaseCount++;})},
 Utilities:{getUuid:()=> "UUID-"+(++uuid)}};
const names=["migrationStableJson_","migrationEncodeSnapshot_","migrationDecodeSnapshot_","migrationSafeCell_","ensureMigrationWriterSheet_","applyTrustedMigrationWrite_","compensateTrustedMigrationWrite_"];
vm.createContext(runtime);vm.runInContext(constants+"\n"+names.map(extract).join("\n")+"\nthis.api={write:applyTrustedMigrationWrite_,compensate:compensateTrustedMigrationWrite_};",runtime);
const target=new Sheet([headers,["PER-OLD","Ana","López","0801199900011","ana@example.test","","ACTIVO","","",""]]);sheets.set("Personas",target);
assert.throws(()=>runtime.api.write({tipoEntidad:"persona",idNuevoPlataforma:"PER-NEW",idempotencyKey:"KEY-DNI",datos:{Nombres:"Otra",Apellidos:"Persona",Identificacion:"0801-1999-00011"}}),/MIGRATION_NATURAL_KEY_DUPLICATE/);
assert.throws(()=>runtime.api.write({tipoEntidad:"persona",idNuevoPlataforma:"PER-NEW",idempotencyKey:"KEY-EMAIL",datos:{Nombres:"Otra",Apellidos:"Persona",EmailContacto:" ANA@EXAMPLE.TEST "}}),/MIGRATION_NATURAL_KEY_DUPLICATE/);
assert.equal(target.rows.length,2,"duplicate DNI/email writes are rejected without modifying existing people");
const update=runtime.api.write({tipoEntidad:"persona",idNuevoPlataforma:"PER-OLD",idempotencyKey:"KEY-UPDATE",datos:{Nombres:"Ana María",Apellidos:"López",Identificacion:"0801-1999-00011",EmailContacto:"ana@example.test"}});
assert.equal(update.accion,"UPDATE","the canonical record can be updated without self-matching");
assert.equal(target.rows[1][1],"Ana María");
assert.equal(lockCount,releaseCount,"all USER writer paths release the script lock");
process.stdout.write("USER migration writer: duplicate DNI/email prevention under lock and canonical self-update PASS.\n");
