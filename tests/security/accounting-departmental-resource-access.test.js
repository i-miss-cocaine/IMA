const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
function extractFunction(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function "+name+" exists");
 const open=source.indexOf("{",start);let depth=0,quote="",escape=false,lineComment=false,blockComment=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];
  if(lineComment){if(c==="\n")lineComment=false;continue;}
  if(blockComment){if(c==="*"&&n==="/"){blockComment=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}
  if(c==="/"&&n==="/"){lineComment=true;i++;continue;}if(c==="/"&&n==="*"){blockComment=true;i++;continue;}
  if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue;}
  if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error("Unbalanced "+name);
}
function makeSheet(rows){return{getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),getLastRow:()=>rows.length};}
const accounting=fs.readFileSync(path.resolve(__dirname,"../../backend/accounting-service/Code.gs"),"utf8");
const names=["getVerifiedAccountingIdentity_","getVerifiedAccountingDepartmentScope_","resolveEmployeeDepartmentId_","assertEmployeeExpedienteScopeAccess_","getEmployeeDocuments","uploadEmployeeDocument","validateRolePermission"];
const code=names.map(n=>extractFunction(accounting,n)).join("\n");
const claims={staffA:{userId:"U-A",role:"Director"},staffB:{userId:"U-B",role:"Director"},employee:{userId:"U-EMP",role:"Empleado"},admin:{userId:"U-ADMIN",role:"Administrador"},invalid:null};
const rows={
 AsignacionesAmbitosRoles:[
  ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"],
  ["S-A","U-A","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
  ["S-B","U-B","Director","DEPARTAMENTO",'["DEP-B"]',"Activo","","","","","",""],
  ["S-ADMIN","U-ADMIN","Administrador","INSTITUCION",'["INST-1"]',"Activo","","","","","",""]
 ],
 ExpedientesLaborales:[
  ["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],
  ["EXP-A","P-A","U-EMP","Docente","DEP-A","","","","Activo",""],
  ["EXP-B","P-B","U-B","Docente","DEP-B","","","","Activo",""],
  ["EXP-NO-DEPT","P-X","U-X","Docente","","","","","Activo",""]
 ],
 DepartamentosAcademicos:[["DepartamentoID","Nombre"],["DEP-A","Departamento A"],["DEP-B","Departamento B"]],
 DocumentosLaborales:[
  ["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"],
  ["DOC-A","EXP-A","Contrato","A","url","","U-A","Privado",""],
  ["DOC-B","EXP-B","Contrato","B","url","","U-B","Privado",""]
 ]
};
const ss={getSheetByName:name=>rows[name]?makeSheet(rows[name]):null};
const context={
 SPREADSHEET_ID:"TEST",
 PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==="IMA_INSTITUTION_ID"?"INST-1":null})},
 SpreadsheetApp:{openById:()=>ss},
 verifySessionToken:token=>claims[token]||null,
 getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||makeSheet([[]]),
 DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"}}
};
vm.runInNewContext(code+"\nthis.assertEmployeeExpedienteScopeAccess_=assertEmployeeExpedienteScopeAccess_;this.getEmployeeDocuments=getEmployeeDocuments;this.uploadEmployeeDocument=uploadEmployeeDocument;",context);
const actor=token=>({sessionToken:token});
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-A").authorized,true);
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-B").code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("admin"),ss,"EXP-B").accessType,"INSTITUTION");
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-NO-DEPT").code,"RESOURCE_OWNER_UNRESOLVED");
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("employee"),ss,"EXP-A").accessType,"SELF");
assert.equal(context.assertEmployeeExpedienteScopeAccess_({sessionToken:"invalid"},ss,"EXP-A").code,"VERIFIED_IDENTITY_REQUIRED");
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("staffA")).documentos,d=>d.documentoId),["DOC-A"]);
assert.equal(context.getEmployeeDocuments({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("admin")).documentos,d=>d.documentoId),["DOC-A","DOC-B"]);
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("employee")).documentos,d=>d.documentoId),["DOC-A"]);
assert.equal(context.uploadEmployeeDocument({sessionToken:"staffA",expedienteId:"EXP-B",tituloDocumento:"No autorizado"}).code,"RESOURCE_SCOPE_DENIED");
assert.ok(extractFunction(accounting,"validateRolePermission").includes("getVerifiedAccountingDepartmentScope_"));
assert.ok(extractFunction(accounting,"uploadEmployeeDocument").includes("DriveApp.Access.PRIVATE"));
assert.ok(!extractFunction(accounting,"uploadEmployeeDocument").includes("ANYONE_WITH_LINK"));
console.log("Accounting departmental resource access contracts passed.");
