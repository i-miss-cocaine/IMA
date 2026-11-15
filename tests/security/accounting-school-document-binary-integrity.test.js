const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("backend/accounting-service/Code.gs","utf8");
new vm.Script(source,{filename:"backend/accounting-service/Code.gs"});
function extractFunction(name) {
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,"missing "+name);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(start,next<0?source.length:next);
}
const funcs=[
  "validateFileBinaryIntegrity","computeDocumentSHA256","ensureSchoolDocumentIssuedSchema_","getOrCreatePrivateSchoolDocumentFolder_",
  "rollbackPrivateSchoolDocumentFile_","renderFinalSchoolDocumentHtml_","generateSchoolDocument","verifySchoolDocumentByCUV"
];
const pdfFor=html=>Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%"+html+"\nstartxref\n9\n%%EOF\n","utf8");

function makeHarness(options={}) {
  const state={lockHeld:false,releases:0,files:new Map(),trashed:0,folderSharing:"PRIVATE",appendFailure:false};
  const issuedRows=[["DocumentoID","PlantillaID","EstudianteUserId","SolicitanteUserId","DatosJSON","EstadoDoc",
    "CodigoVerificacion","DriveFileID","DriveURL","FechaEmision","Observaciones","VersionPlantilla",
    "Correlativo","NumeroCorrelativo","SHA256","VersionDocumento"]];
  const templateRows=[["PlantillaID","CodigoDocumento","Categoria","Titulo","CamposJSON","FlujoAprobacion","Estado","Version","ContenidoHTML"],
    ["TPL-1","CONST","Constancia","Constancia", "{}", "[]","Activa","2.0","<h1>{{student.name}}</h1><p>{{student.grade}}</p>"]];
  function makeSheet(rows) {
    return {
      rows,
      getLastRow:()=>rows.length,
      getLastColumn:()=>Math.max(1,...rows.map(row=>row.length)),
      getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),
      getRange(row,column,rowCount,columnCount) {
        const countR=rowCount||1,countC=columnCount||1;
        return {
          getValues:()=>Array.from({length:countR},(_,ri)=>Array.from({length:countC},(_,ci)=>(rows[row-1+ri]||[])[column-1+ci]||"")),
          setValue(value) {
            while(rows.length<row)rows.push([]);
            while(rows[row-1].length<column)rows[row-1].push("");
            rows[row-1][column-1]=value;
          }
        };
      },
      appendRow(row) {
        if(state.appendFailure)throw new Error("SHEET_APPEND_FAILED");
        rows.push(row.slice());
      }
    };
  }
  const issued=makeSheet(issuedRows),templates=makeSheet(templateRows);
  const ss={getSheetByName:name=>name==="DocumentosEscolaresEmitidos"?issued:(name==="PlantillasEscolares"?templates:null)};
  const folder={
    getSharingAccess:()=>state.folderSharing,
    setSharing:access=>{state.folderSharing=access;},
    setTrashed:()=>{state.folderSharing="TRASHED";},
    createFile(blob) {
      const id="FILE-"+(state.files.size+1);
      let bytes=Buffer.from(blob.getBytes()),sharing="PRIVATE",trashed=false,name=blob.name||"document.pdf";
      const file={
        getId:()=>id,getName:()=>name,getUrl:()=>"https://drive.google.com/file/d/"+id,
        isTrashed:()=>trashed,setTrashed:()=>{trashed=true;state.trashed++;},
        setSharing:access=>{sharing=access;},getSharingAccess:()=>sharing,
        getBlob:()=>({getBytes:()=>Array.from(bytes),getContentType:()=>"application/pdf"}),
        _setBytes:value=>{bytes=Buffer.from(value);}
      };
      state.files.set(id,file);
      return file;
    }
  };
  const root={
    getFoldersByName:()=>({hasNext:()=>state.folderExists===true,next:()=>folder}),
    createFolder:()=>{state.folderExists=true;return folder;}
  };
  const context={
    Buffer,require,Date,Math,SPREADSHEET_ID:"TEST-ACCOUNTING",
    SpreadsheetApp:{openById:id=>{assert.equal(id,"TEST-ACCOUNTING");return ss;}},
    getOrCreateSheet:(_ss,name)=>name==="PlantillasEscolares"?templates:issued,
    LockService:{getScriptLock:()=>({
      tryLock:()=>{if(state.lockHeld)return false;state.lockHeld=true;return true;},
      releaseLock:()=>{assert.equal(state.lockHeld,true);state.lockHeld=false;state.releases++;}
    })},
    DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},getRootFolder:()=>root,
      getFileById:id=>{if(!state.files.has(id))throw new Error("FILE_NOT_FOUND");return state.files.get(id);}},
    HtmlService:{createHtmlOutput:html=>({getAs:()=>({name:"",getBytes:()=>Array.from(pdfFor(html)),setName(name){this.name=name;return this;}})})},
    MimeType:{PDF:"application/pdf"},
    Utilities:{DigestAlgorithm:{SHA_256:"SHA_256"},base64Encode:value=>Buffer.from(value).toString("base64"),
      base64Decode:value=>Array.from(Buffer.from(value,"base64")),
      newBlob:value=>({getBytes:()=>Array.from(Buffer.from(String(value),"utf8"))}),
      computeDigest:(_algorithm,bytes)=>Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest()),
      getUuid:(()=>{let i=0;return ()=>"uuid-"+(++i);})()},
    enqueueDriveRecovery_:()=>{},logStructuredEvent:()=>{},console:{warn(){}}
  };
  vm.runInNewContext(funcs.map(extractFunction).join("\n\n"),context);
  return {context,state,issuedRows,files:state.files,issued,setAppendFailure:value=>{state.appendFailure=value;}};
}

{
  const h=makeHarness();
  const result=h.context.generateSchoolDocument({plantillaId:"TPL-1",targetEntityId:"STU-1",
    solicitanteUserId:"USER-1",datosFormulario:{"student.name":"Ana & Luis","student.grade":"9no"}});
  assert.equal(result.status,"success");
  assert.equal(result.integridadVerificada,true);
  assert.match(result.sha256Hash,/^[a-f0-9]{64}$/);
  assert.ok(result.versionDocumento);
  assert.equal(h.issuedRows.length,2);
  const row=h.issuedRows[1],file=h.files.get(row[7]);
  assert.ok(file);
  assert.equal(file.getSharingAccess(),"PRIVATE");
  assert.equal(row[14],result.sha256Hash);
  assert.equal(row[15],result.versionDocumento);
  const verified=h.context.verifySchoolDocumentByCUV({codigoVerificacion:result.codigoVerificacion});
  assert.equal(verified.status,"success");
  assert.equal(verified.documento.integridadVerificada,true);
  assert.equal(verified.documento.sha256Hash,result.sha256Hash);
  assert.equal(verified.documento.versionDocumento,result.versionDocumento);
  file._setBytes("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Name (tampered) >>\nendobj\nstartxref\n9\n%%EOF\n");
  const tampered=h.context.verifySchoolDocumentByCUV({codigoVerificacion:result.codigoVerificacion});
  assert.equal(tampered.status,"error");
  assert.equal(tampered.code,"DOCUMENT_INTEGRITY_MISMATCH");
  assert.equal(tampered.documento.integridadVerificada,false);
  assert.equal(h.state.releases,1);
  assert.equal(h.state.lockHeld,false);
}
{
  const h=makeHarness();
  h.state.folderExists=true;
  h.state.folderSharing="ANYONE_WITH_LINK";
  assert.throws(()=>h.context.generateSchoolDocument({plantillaId:"TPL-1",datosFormulario:{"student.name":"A","student.grade":"B"}}),/SCHOOL_DOCUMENT_FOLDER_NOT_PRIVATE/);
  assert.equal(h.issuedRows.length,1);
}
{
  const h=makeHarness();
  h.setAppendFailure(true);
  assert.throws(()=>h.context.generateSchoolDocument({plantillaId:"TPL-1",datosFormulario:{"student.name":"A","student.grade":"B"}}),/SHEET_APPEND_FAILED/);
  assert.equal(h.issuedRows.length,1);
  assert.equal(h.state.trashed,1,"failed persistence must trash the newly created private PDF");
  assert.equal(h.state.lockHeld,false);
}
{
  const h=makeHarness();
  const result=h.context.generateSchoolDocument({plantillaId:"TPL-1",datosFormulario:{"student.name":"<script>","student.grade":"B"}});
  assert.equal(result.status,"success");
  const stored=h.files.get(h.issuedRows[1][7]).getBlob().getBytes();
  assert.ok(Buffer.from(stored).toString("utf8").includes("&lt;script&gt;"),"template values must be HTML-escaped before PDF rendering");
}
{
  const h=makeHarness();
  h.state.lockHeld=true;
  assert.throws(()=>h.context.generateSchoolDocument({plantillaId:"TPL-1",datosFormulario:{"student.name":"A","student.grade":"B"}}),/bloqueo de concurrencia/);
  assert.equal(h.issuedRows.length,1);
  h.state.lockHeld=false;
}
console.log("accounting-school-document-binary-integrity: PASS");
