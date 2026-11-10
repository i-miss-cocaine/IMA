const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"backend/task-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});

const userSource = fs.readFileSync(path.join(root, "backend/user-service/Code.gs"), "utf8");
const academicSource = fs.readFileSync(path.join(root, "backend/academic-service/Code.gs"), "utf8");
const apiSource = fs.readFileSync(path.join(root, "js/api.js"), "utf8");
const authSource = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
new vm.Script(userSource, { filename: "backend/user-service/Code.gs" });
new vm.Script(academicSource, { filename: "backend/academic-service/Code.gs" });
assert(authSource.includes("sessionToken: result.data.sessionToken || result.sessionToken || null"), "login persists the signed session token");
assert(authSource.includes("storage.setItem('currentUser', JSON.stringify(userData))"), "signed token is stored with currentUser");
assert(apiSource.includes("enrichedPayload.sessionToken = currentUser.sessionToken"), "authenticated API requests propagate the signed token");

const publicStatusFunction = extractFunctionFrom(academicSource, "getPublicAdmissionStatus");
const saveDraftFunction = extractFunctionFrom(academicSource, "saveAdmissionDraft");
const getDraftFunction = extractFunctionFrom(academicSource, "getAdmissionDraft");
const createAdmissionFunction = extractFunctionFrom(academicSource, "createAdmissionRequest");
assert(publicStatusFunction.includes("isValidOpaqueAdmissionAccessToken(accessToken)"), "public admission status requires opaque capability");
assert(saveDraftFunction.includes("isValidOpaqueAdmissionAccessToken(suppliedToken)"), "draft updates validate opaque capability");
assert(getDraftFunction.includes("isValidOpaqueAdmissionAccessToken(accessToken)"), "draft retrieval requires opaque capability");
assert(createAdmissionFunction.includes("generateOpaqueAdmissionAccessToken()") && createAdmissionFunction.includes("hashOpaqueAdmissionAccessToken(publicAccessToken)"), "admission creation issues and stores only a hash of the opaque capability");
const automationFunction = extractFunctionFrom(userSource, "getAutomationRules");
const ticketAdminRoles = 'const TICKET_ADMIN_ROLES_ = ["Administrador", "Desarrollador", "Director"];';
assert(
  automationFunction.includes("getUserVerifiedRole(payload)") &&
  automationFunction.includes("TICKET_ADMIN_ROLES_.indexOf(verifiedRole)") &&
  userSource.includes(ticketAdminRoles),
  "automation rules require verified identity and the centralized admin-role allowlist"
);


function extractFunction(name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function exists: "+name);
 const open=source.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const ch=source[i],n=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&n==="/"){block=false;i++;}continue;}
 if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
 if(ch==="/"&&n==="/"){line=true;i++;continue;}if(ch==="/"&&n==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue;}
 if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}
 throw new Error("unbalanced "+name);
}
function extractFunctionFrom(sourceText,name){
 const start=sourceText.indexOf("function "+name+"(");assert.ok(start>=0,"function exists: "+name);
 const open=sourceText.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;
 for(let i=open;i<sourceText.length;i++){const ch=sourceText[i],n=sourceText[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&n==="/"){block=false;i++;}continue;}
 if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
 if(ch==="/"&&n==="/"){line=true;i++;continue;}if(ch==="/"&&n==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue;}
 if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return sourceText.slice(start,i+1);}
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


function makeDeleteFileFixture(fileId, versionRows, failMetadataWrite) {
  const rows = [metadataHeaders, metaRow("M-DELETE", fileId, "USR-DELETE")];
  const metadata = makeSheet(rows);
  if (failMetadataWrite) {
    const originalGetRange = metadata.getRange;
    metadata.getRange = function (row, col) {
      if (row === 2 && col === 15) return { setValue: () => { throw new Error("simulated metadata write failure"); } };
      return originalGetRange.apply(this, arguments);
    };
  }
  const deliveries = makeSheet([["EntregaID","TareaID","UserID","Fecha","fileUrl"]]);
  const versions = makeSheet(versionRows);
  const sheets = { Entregas: deliveries, EntregasVersiones: versions };
  const file = {
    trashed: false,
    isTrashed: function () { return this.trashed; },
    setTrashed: function (value) { this.trashed = value; }
  };
  const ss = { getSheetByName: name => sheets[name] || null };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ss },
    ensureTaskServiceFileMetadataSheet: () => metadata,
    getSheetOrThrow: (_ss, name) => { if (!sheets[name]) throw new Error("missing " + name); return sheets[name]; },
    DriveApp: { getFileById: () => file }
  };
  vm.runInNewContext(
    extractFunction("extractTaskServiceFileId") + String.fromCharCode(10) +
    extractFunction("deleteFile") + String.fromCharCode(10) +
    "this.run = deleteFile;",
    context
  );
  return { run: context.run, file, rows };
}
const versionHeaders = ["ID","EntregaID","TareaID","UserID","VersionNum","ArchivoUrl","FileID"];
const urlOnlyDelete = makeDeleteFileFixture("FILE-URL-ONLY", [
  versionHeaders,
  ["V1","E1","TASK-1","USR-DELETE",1,"https://drive.google.com/file/d/FILE-URL-ONLY/view",""]
]);
assert.throws(() => urlOnlyDelete.run({_verifiedRole:"Estudiante",_verifiedUserId:"USR-DELETE",fileId:"FILE-URL-ONLY"}), /vinculado a una entrega o versión/);
assert.equal(urlOnlyDelete.file.trashed, false, "Archivo citado solo por ArchivoUrl no debe enviarse a papelera");

const fileIdOnlyDelete = makeDeleteFileFixture("FILE-ID-ONLY", [
  versionHeaders,
  ["V2","E2","TASK-2","USR-DELETE",1,"","FILE-ID-ONLY"]
]);
assert.throws(() => fileIdOnlyDelete.run({_verifiedRole:"Estudiante",_verifiedUserId:"USR-DELETE",fileId:"FILE-ID-ONLY"}), /vinculado a una entrega o versión/);
assert.equal(fileIdOnlyDelete.file.trashed, false, "Archivo citado por FileID no debe enviarse a papelera");

const rollbackDelete = makeDeleteFileFixture("FILE-OWNED", [versionHeaders], true);
assert.throws(() => rollbackDelete.run({_verifiedRole:"Estudiante",_verifiedUserId:"USR-DELETE",fileId:"FILE-OWNED"}), /DELETE_FILE_METADATA_UPDATE_FAILED/);
assert.equal(rollbackDelete.file.trashed, false, "Fallos al actualizar metadatos deben compensar el borrado Drive");

const successfulDelete = makeDeleteFileFixture("FILE-OWNED", [versionHeaders], false);
assert.equal(successfulDelete.run({_verifiedRole:"Estudiante",_verifiedUserId:"USR-DELETE",fileId:"FILE-OWNED"}).status, "success");
assert.equal(successfulDelete.file.trashed, true);
assert.equal(successfulDelete.rows[1][14], "Eliminado");

console.log("TASK-636 deleteFile local contract: FileID/ArchivoUrl reference guards and metadata rollback passed.");

// PUBLIC USER NEWS CONTRACT: anonymous responses are general-only; authenticated audience comes from claims.

const userNewsHeaders = ["NoticiaID","Fecha","Hora","Titulo","Contenido","ImagenUrl","Categoria","GradoAudiencia","SeccionAudiencia","FechaInicio","FechaFin","Estado"];
const userNewsRows = [
  userNewsHeaders,
  ["N-GEN","2026-11-08","08:00","General","general","","General","Todos","Todas","","","Activa"],
  ["N-G6","2026-11-08","09:00","Grade 6","grade6","","Académico","6","A","","","Activa"],
  ["N-G9","2026-11-08","10:00","Grade 9","grade9","","Académico","9","Z","","","Activa"],
  ["N-INACTIVE","2026-11-08","11:00","Inactive","inactive","","General","Todos","Todas","","","Inactiva"],
  ["N-FUTURE","2026-11-08","12:00","Future","future","","General","Todos","Todas","2099-01-01","","Activa"]
];
const userRows = [["UserId","Nombre","Grado","Seccion"],["STU-1","Student","6","A"]];
const announcementHeaders = ["ID","Titulo","Contenido","Categoria","AutorID","Audiencia","RequiereFirma","FechaPublicacion","Estado"];
const announcementRows = [
  announcementHeaders,
  ["COM-GEN","General","public general","General","AUTHOR-1","TodaLaComunidad",false,new Date("2026-11-08T12:00:00Z"),"Publicado"],
  ["COM-STU","Student","student only","General","AUTHOR-2",'["Estudiante"]',false,new Date("2026-11-08T12:00:00Z"),"Publicado"],
  ["COM-SEC","Secretaría","secretary only","General","AUTHOR-3",'["Secretaría"]',false,new Date("2026-11-08T12:00:00Z"),"Publicado"],
  ["COM-DRAFT","Draft","draft content","General","AUTHOR-4",'["Estudiante"]',false,new Date("2026-11-08T12:00:00Z"),"Borrador"],
  ["COM-FUTURE","Future","future content","General","AUTHOR-5","TodaLaComunidad",false,new Date("2099-01-01T12:00:00Z"),"Publicado"],
  ["COM-RETIRED","Retired","retired content","General","AUTHOR-6","TodaLaComunidad",false,new Date("2026-11-08T12:00:00Z"),"Retirado"]
];
const userSheets = {
  NoticiasPortal: { getDataRange: () => ({ getValues: () => userNewsRows }) },
  Usuarios: { getDataRange: () => ({ getValues: () => userRows }) },
  ComunicadosInstitucionales: { getDataRange: () => ({ getValues: () => announcementRows }) }
};
const userSS = { getSheetByName: name => userSheets[name] || null };
const userContext = {
  SPREADSHEET_ID: "LOCAL",
  SpreadsheetApp: { openById: () => userSS },
  getOrCreateSheet: (_ss, name) => userSheets[name],
  getSheetOrThrow: (_ss, name) => { if (!userSheets[name]) throw new Error("missing " + name); return userSheets[name]; },
  getUserVerifiedRole: payload => {
    if (payload && payload.sessionToken === "student-valid") {
      payload._verifiedUserId = "STU-1"; payload._verifiedRole = "Estudiante"; return "Estudiante";
    }
    if (payload && payload.sessionToken === "admin-valid") {
      payload._verifiedUserId = "ADMIN-1"; payload._verifiedRole = "Administrador"; return "Administrador";
    }
    return "NO_ACCESS";
  }
};
vm.runInNewContext(
  extractFunctionFrom(userSource, "normalizeString") + String.fromCharCode(10) +
  extractFunctionFrom(userSource, "getNews") + String.fromCharCode(10) +
  extractFunctionFrom(userSource, "getInstitutionalAnnouncements") + String.fromCharCode(10) +
  "this.getNews = getNews; this.getAnnouncements = getInstitutionalAnnouncements;",
  userContext
);
const publicNews = userContext.getNews({ grado: "9", seccion: "Z", includeInactive: true });
assert.deepEqual(publicNews.data.map(item => item.noticiaId), ["N-GEN"], "anonymous clients cannot choose grade/section or request inactive news");
const studentNews = userContext.getNews({ sessionToken: "student-valid", grado: "9", seccion: "Z", includeInactive: true });
assert.deepEqual(studentNews.data.map(item => item.noticiaId).sort(), ["N-G6","N-GEN"], "authenticated news audience derives from the stored user profile");
const publicAnnouncements = userContext.getAnnouncements({ rol: "Secretaría", audiencia: "Secretaría" });
assert.deepEqual(publicAnnouncements.data.map(item => item.comunicadoId), ["COM-GEN"], "anonymous clients receive only current general published announcements");
assert.equal(Object.prototype.hasOwnProperty.call(publicAnnouncements.data[0], "autorId"), false, "public announcement response omits internal author ID");
assert.equal(Object.prototype.hasOwnProperty.call(publicAnnouncements.data[0], "audiencia"), false, "public announcement response omits internal audience metadata");
const studentAnnouncements = userContext.getAnnouncements({ sessionToken: "student-valid", rol: "Administrador", audiencia: "Secretaría" });
assert.deepEqual(studentAnnouncements.data.map(item => item.comunicadoId).sort(), ["COM-GEN","COM-STU"], "announcement audience derives from signed claims, not client role/audience");

console.log("USER public news/announcement local contract: anonymous scope, signed role, publication state and date guards passed.");


const adminNews = userContext.getNews({ sessionToken: "admin-valid", includeInactive: true });
assert.deepEqual(adminNews.data.map(item => item.noticiaId).sort(), ["N-FUTURE","N-G6","N-G9","N-GEN","N-INACTIVE"], "only verified administrators may request inactive and all-audience news");
const adminAnnouncements = userContext.getAnnouncements({ sessionToken: "admin-valid", rol: "Estudiante", audiencia: "Estudiante" });
assert.deepEqual(adminAnnouncements.data.map(item => item.comunicadoId).sort(), ["COM-GEN","COM-SEC","COM-STU"], "verified administrators can inspect all published announcements but not drafts or future releases");

// TASK-636: draft visibility must normalize boolean values and use verified role.

const postFixtureRows = [
  ["ID","AulaID","Titulo","Contenido","Categoria","AutorID","EsFijado","EsBorrador","FechaProgramada","FechaPublicacion","AdjuntosJSON","Audiencia","Estado"],
  ["P1","AULA-1","Published","body","Anuncio","PROF-1",false,false,"",new Date("2026-11-08T12:00:00Z"),"[]","Todos","Publicado"],
  ["P2","AULA-1","String draft","body","Anuncio","PROF-1",false,"true","",new Date("2026-11-08T12:00:00Z"),"[]","Todos","Publicado"],
  ["P3","AULA-1","Boolean draft","body","Anuncio","PROF-1",false,true,"",new Date("2026-11-08T12:00:00Z"),"[]","Todos","Publicado"],
  ["P4","AULA-2","Other classroom","body","Anuncio","PROF-2",false,false,"",new Date("2026-11-08T12:00:00Z"),"[]","Todos","Publicado"],
  ["P5","AULA-1","Future","body","Anuncio","PROF-1",false,false,new Date("2099-01-01T12:00:00Z"),new Date("2026-11-08T12:00:00Z"),"[]","Todos","Publicado"],
  ["P6","AULA-1","Deleted","body","Anuncio","PROF-1",false,false,"",new Date("2026-11-08T12:00:00Z"),"[]","Todos","eliminado"]
];
const postSheet = { getDataRange: () => ({ getValues: () => postFixtureRows }) };
const postSS = { getSheetByName: () => postSheet };
const postContext = {
  SPREADSHEET_ID: "LOCAL",
  SpreadsheetApp: { openById: () => postSS },
  getOrCreateSheet: () => postSheet,
  getTaskServiceAuthorizedClassrooms: () => [["AULA-1"]],
  isTaskServiceAudienceAllowed: (audience, role) => audience === "Todos" && role === "Estudiante"
};
const getPostsFunction = extractFunction("getPosts");
assert.equal(getPostsFunction.includes("authRole"), false, "getPosts must not trust authRole from payload");
vm.runInNewContext(extractFunction("normalizeString") + String.fromCharCode(10) + getPostsFunction + String.fromCharCode(10) + "this.run = getPosts;", postContext);
const studentPosts = postContext.run({
  _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  authRole: "Administrador", includeDrafts: true, aulaId: "AULA-1"
});
assert.deepEqual(studentPosts.data.map(row => row.postId), ["P1"], "student cannot expose boolean or string drafts by spoofing authRole/includeDrafts");
const teacherWithoutDrafts = postContext.run({
  _verifiedUserId: "PROF-1", _verifiedRole: "Profesor",
  includeDrafts: false, aulaId: "AULA-1"
});
assert.deepEqual(teacherWithoutDrafts.data.map(row => row.postId).sort(), ["P1","P5"], "teacher sees no drafts unless requested but may inspect scheduled posts");
const teacherWithDrafts = postContext.run({
  _verifiedUserId: "PROF-1", _verifiedRole: "Profesor",
  includeDrafts: true, aulaId: "AULA-1"
});
assert.deepEqual(teacherWithDrafts.data.map(row => row.postId).sort(), ["P1","P2","P3","P5"], "teacher may see drafts only in authorized classroom when requested and scheduled posts");

console.log("TASK-636 getPosts local contract: verified role, string/boolean draft guards and classroom scope passed.");

// TASK-636: project deletion must match owner + supplied identifiers and compensate cross-service failures.

function makeProjectDeleteFixture(ownerId, fileId, options) {
  options = options || {};
  const rows = [
    ["UserId","NombreArchivo","ArchivoUrl","Codigo"],
    [ownerId,"project.psc",fileId ? "https://drive.google.com/file/d/" + fileId + "/view" : "","print('test')"]
  ];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    deleteRow: rowNumber => {
      if (options.failDelete) throw new Error("simulated sheet delete failure");
      rows.splice(rowNumber - 1, 1);
    }
  };
  const file = {
    trashed: !!options.alreadyTrashed,
    isTrashed: function () { return this.trashed; },
    setTrashed: function (value) {
      if (value && options.failTrash) throw new Error("simulated Drive trash failure");
      this.trashed = value;
    }
  };
  const ss = { getSheetByName: name => name === "pseudocode" ? sheet : null };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ss },
    getSheetOrThrow: (_ss, name) => { if (name !== "pseudocode") throw new Error("missing " + name); return sheet; },
    DriveApp: { getFileById: id => { assert.equal(id, fileId); return file; } }
  };
  vm.runInNewContext(
    extractFunction("extractTaskServiceFileId") + String.fromCharCode(10) +
    extractFunction("deleteProject") + String.fromCharCode(10) +
    "this.run = deleteProject;",
    context
  );
  return { run: context.run, rows, file };
}
const wrongNameFixture = makeProjectDeleteFixture("STU-1", "FILE-OWN");
assert.throws(() => wrongNameFixture.run({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",fileName:"wrong.psc"}), /no coincide con los identificadores/);
assert.equal(wrongNameFixture.rows.length, 2, "empty fileId plus wrong fileName must not match every URL");
assert.equal(wrongNameFixture.file.trashed, false);

const foreignProjectFixture = makeProjectDeleteFixture("STU-2", "FILE-FOREIGN");
assert.throws(() => foreignProjectFixture.run({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",fileId:"FILE-FOREIGN"}), /no coincide con los identificadores/);
assert.equal(foreignProjectFixture.rows.length, 2, "another user's project remains untouched");

const mismatchedIdentifiersFixture = makeProjectDeleteFixture("STU-1", "FILE-OWN");
assert.throws(() => mismatchedIdentifiersFixture.run({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",fileId:"FILE-OTHER",fileName:"project.psc"}), /no coincide con los identificadores/);
assert.equal(mismatchedIdentifiersFixture.file.trashed, false, "when both identifiers are supplied, both must match");

const successProjectFixture = makeProjectDeleteFixture("STU-1", "FILE-OWN");
assert.equal(successProjectFixture.run({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",fileId:"FILE-OWN",fileName:"project.psc"}).status, "success");
assert.equal(successProjectFixture.rows.length, 1, "verified project row is deleted");
assert.equal(successProjectFixture.file.trashed, true, "verified project file is moved to trash");

const driveFailureFixture = makeProjectDeleteFixture("STU-1", "FILE-OWN", { failTrash: true });
assert.throws(() => driveFailureFixture.run({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",fileId:"FILE-OWN"}), /simulated Drive trash failure/);
assert.equal(driveFailureFixture.rows.length, 2, "Drive failure must not delete the metadata row");

const sheetFailureFixture = makeProjectDeleteFixture("STU-1", "FILE-OWN", { failDelete: true });
assert.throws(() => sheetFailureFixture.run({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",fileId:"FILE-OWN"}), /DELETE_PROJECT_METADATA_FAILED/);
assert.equal(sheetFailureFixture.rows.length, 2, "metadata row remains after failed deletion");
assert.equal(sheetFailureFixture.file.trashed, false, "Drive trash is compensated if metadata deletion fails");

console.log("TASK-636 deleteProject local contract: strict ownership/identifier matching and Drive/Sheets compensation passed.");

// TASK-636: teacher reads/previews require active offer assignment, not merely task creator ID.

const teacherReadFunctions = [
  ["getStudentTasks", extractFunction("getStudentTasks")],
  ["getAllTasks", extractFunction("getAllTasks")],
  ["getTeacherActivity", extractFunction("getTeacherActivity")]
];
for (const [name, fn] of teacherReadFunctions) {
  assert(fn.includes("isTaskServiceTeacherTaskAuthorized_"), name + " must enforce active assigned classroom scope");
}
assert(extractFunction("getSubmissionDocumentPreviewUrl").includes("assertTaskServiceTeacherCanManageTask"), "teacher preview must validate active assignment");
assert(extractFunction("assertTaskServiceTeacherCanManageTask").includes("getTaskServiceAuthorizedClassrooms(payload)"), "teacher mutation/preview guard must use active offer assignments");

const assignmentRows = [
  ["ID","OfertaID","ProfesorID","Asignatura","Inicio","Fin","Estado"],
  ["AS-1","OFFER-1","PROF-1","","2026-01-01","2099-01-01","Activo"],
  ["AS-2","OFFER-2","PROF-1","","2020-01-01","2020-12-31","Activo"],
  ["AS-3","OFFER-3","PROF-1","","2026-01-01","2099-01-01","Inactivo"],
  ["AS-4","OFFER-4","PROF-1","","2026-01-01","2099-01-01","Activo"]
];
const classroomRows = [
  ["AulaID","OfertaID","Nombre","Grado","Seccion","Asignatura","ProfesorID","Estado"],
  ["CLASS-1","OFFER-1","Aula A","6","A","Matemáticas","PROF-1","Activa"],
  ["CLASS-2","OFFER-2","Aula B","6","B","Matemáticas","PROF-1","Activa"],
  ["CLASS-3","OFFER-3","Aula C","6","C","Matemáticas","PROF-1","Activa"],
  ["CLASS-4","OFFER-1","Aula D","6","D","Matemáticas","PROF-1","Desactivada"],
  ["CLASS-5","OFFER-4","Aula E","6","E","Matemáticas","PROF-1","desactivada"]
];
const assignmentSheets = {
  AulasVirtuales: { getDataRange: () => ({ getValues: () => classroomRows }) },
  AsignacionesDocentes: { getDataRange: () => ({ getValues: () => assignmentRows }) }
};
const assignmentSS = { getSheetByName: name => assignmentSheets[name] || null };
const assignmentContext = {
  SPREADSHEET_ID: "LOCAL",
  SpreadsheetApp: { openById: () => assignmentSS },
  getSheetOrThrow: (_ss, name) => { if (!assignmentSheets[name]) throw new Error("missing " + name); return assignmentSheets[name]; },
  isTaskServiceAdministrativeRole: role => ["Administrador","Desarrollador","Dirección","Secretaría"].includes(role)
};
vm.runInNewContext(
  extractFunction("normalizeString") + String.fromCharCode(10) +
  extractFunction("isInTeacherList") + String.fromCharCode(10) +
  extractFunction("getTaskServiceAuthorizedClassrooms") + String.fromCharCode(10) +
  extractFunction("isTaskServiceTeacherTaskAuthorized_") + String.fromCharCode(10) +
  "this.getClassrooms = getTaskServiceAuthorizedClassrooms; this.isAuthorized = isTaskServiceTeacherTaskAuthorized_;",
  assignmentContext
);
const authorizedClassrooms = assignmentContext.getClassrooms({_verifiedRole:"Profesor",_verifiedUserId:"PROF-1"});
assert.deepEqual(authorizedClassrooms.map(row => row[0]), ["CLASS-1"], "expired/inactive offers and deactivated classrooms are excluded");
const assignedTask = ["T-1","Tarea","Math","desc","P1","Matemáticas","6","A","", "", "PROF-1"];
const expiredTask = ["T-2","Tarea","Math","desc","P1","Matemáticas","6","B","", "", "PROF-1"];
const foreignOwnerTask = ["T-3","Tarea","Math","desc","P1","Matemáticas","6","A","", "", "PROF-2"];
const sectionListTask = ["T-4","Tarea","Math","desc","P1","Matemáticas","6","A,B","", "", "PROF-1"];
assert.equal(assignmentContext.isAuthorized(assignedTask, authorizedClassrooms, "PROF-1"), true);
assert.equal(assignmentContext.isAuthorized(expiredTask, authorizedClassrooms, "PROF-1"), false);
assert.equal(assignmentContext.isAuthorized(foreignOwnerTask, authorizedClassrooms, "PROF-1"), false);
assert.equal(assignmentContext.isAuthorized(sectionListTask, authorizedClassrooms, "PROF-1"), true, "task section lists may include the assigned classroom section");

console.log("TASK-636 teacher scope local contract: active assignments, classroom scope and read/preview guards passed.");

// TASK-636: study materials must be explicitly active/published and not future for non-staff.

const studyMaterialRows = [
  ["ID","AulaID","Titulo","Descripcion","TipoRecurso","Parcial","Unidad","Tema","ArchivoUrl","DriveId","AutorID","FechaPublicacion","Estado"],
  ["M-GEN","General","General current","","Documento","I","U1","T1","","","ADMIN-1",new Date("2026-11-08T12:00:00Z"),"Activo"],
  ["M-CLASS","CLASS-1","Class current","","Documento","I","U1","T1","","","PROF-1",new Date("2026-11-08T12:00:00Z"),"Publicado"],
  ["M-FUTURE","CLASS-1","Future","","Documento","I","U1","T1","","","PROF-1",new Date("2099-01-01T12:00:00Z"),"Activo"],
  ["M-DRAFT","CLASS-1","Draft","","Documento","I","U1","T1","","","PROF-1",new Date("2026-11-08T12:00:00Z"),"Borrador"],
  ["M-DELETED","CLASS-1","Deleted","","Documento","I","U1","T1","","","PROF-1",new Date("2026-11-08T12:00:00Z"),"eliminado"],
  ["M-OTHER","CLASS-2","Other class","","Documento","I","U1","T1","","","PROF-2",new Date("2026-11-08T12:00:00Z"),"Activo"],
  ["M-EMPTY","CLASS-1","Missing state","","Documento","I","U1","T1","","","PROF-1",new Date("2026-11-08T12:00:00Z"),""]
];
const materialSheet = { getDataRange: () => ({ getValues: () => studyMaterialRows }) };
const materialContext = {
  SPREADSHEET_ID: "LOCAL",
  SpreadsheetApp: { openById: () => ({}) },
  getTaskServiceAuthorizedClassrooms: () => [["CLASS-1"]],
  getOrCreateSheet: () => materialSheet
};
vm.runInNewContext(
  extractFunction("normalizeString") + String.fromCharCode(10) +
  extractFunction("getStudyMaterials") + String.fromCharCode(10) +
  "this.getMaterials = getStudyMaterials;",
  materialContext
);
const studentMaterials = materialContext.getMaterials({_verifiedRole:"Estudiante"});
assert.deepEqual(studentMaterials.data.map(item => item.materialId).sort(), ["M-CLASS","M-GEN"], "students receive only current active/published materials in authorized classrooms");
const teacherMaterials = materialContext.getMaterials({_verifiedRole:"Profesor"});
assert.deepEqual(teacherMaterials.data.map(item => item.materialId).sort(), ["M-CLASS","M-DRAFT","M-EMPTY","M-FUTURE","M-GEN"], "staff can inspect legacy/draft/scheduled materials but never deleted records or other classrooms");

console.log("TASK-636 getStudyMaterials local contract: audience, explicit publication state, future-date and deleted-record guards passed.");

// TASK-636 AUD-NG-001/002: fail-closed session claim contract across USER, ACADEMIC and TASK.

function verifyTokenWithClaims(sourceText, claims) {
  const payloadB64 = Buffer.from(JSON.stringify(claims)).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const context = {
    SPREADSHEET_ID: "LOCAL",
    getAuthTokenSecret: () => "test-secret",
    computeHmacSignature: () => "signed",
    Utilities: {
      base64Decode: value => Buffer.from(value, "base64"),
      MacAlgorithm: { HMAC_SHA_256: "HMAC_SHA_256" },
      computeHmacSignature: () => [115,105,103,110,101,100],
      newBlob: bytes => ({ getDataAsString: () => Buffer.from(bytes).toString("utf8") })
    },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => name === "Usuarios" ? {
      getDataRange: () => ({ getValues: () => [["UserId","","","","","","","","","","Estado"], ["USER-1","","","","","","Estudiante","","","","Activa"]] })
    } : null }) }
  };
  vm.runInNewContext(extractFunctionFrom(sourceText, "verifySessionToken") + String.fromCharCode(10) + "this.verify = verifySessionToken;", context);
  const signature = sourceText.includes("const rawSig = Utilities.computeHmacSignature") ? "7369676e6564" : "signed";
  return context.verify(payloadB64 + "." + signature);
}
const tokenNow = Math.floor(Date.now() / 1000);
const validSessionClaims = { userId:"USER-1", role:"Estudiante", sessionId:"SES-1", iat:tokenNow, exp:tokenNow+3600 };
for (const [serviceName, sourceText] of [["USER", userSource], ["ACADEMIC", academicSource], ["TASK", source], ["ACCOUNTING", fs.readFileSync(path.join(root, "backend/accounting-service/Code.gs"), "utf8")], ["EXAM", fs.readFileSync(path.join(root, "backend/exam-service/Code.gs"), "utf8")], ["DEVELOPER", fs.readFileSync(path.join(root, "backend/developer-service/Code.gs"), "utf8")]]) {
  assert(verifyTokenWithClaims(sourceText, validSessionClaims), serviceName + " accepts complete unexpired session claims");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, exp: undefined }), null, serviceName + " rejects sessions without expiration");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, iat: undefined }), null, serviceName + " rejects sessions without issued-at time");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, userId: "" }), null, serviceName + " rejects sessions without identity");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, role: "" }), null, serviceName + " rejects sessions without role");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, sessionId: "" }), null, serviceName + " rejects sessions without session ID");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, exp: tokenNow }), null, serviceName + " rejects expired sessions");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, iat: tokenNow+120 }), null, serviceName + " rejects future-issued sessions");
  assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, exp: tokenNow+90000 }), null, serviceName + " rejects excessive token lifetime");
  if (serviceName !== "DEVELOPER") {
    assert.equal(verifyTokenWithClaims(sourceText, { ...validSessionClaims, role: "Profesor" }), null, serviceName + " rejects stale role claims after role change");
  }
}
console.log("TASK-636 strict session claims local contract: all six services reject incomplete, expired, future-issued and overlong sessions; five shared-data services also reject stale role claims.");

// TASK-636 AUD-NG-001/002: HMAC signing keys must never be derived from public spreadsheet IDs.

const hmacSecretServices = [
  ["USER", userSource],
  ["ACADEMIC", academicSource],
  ["TASK", source],
  ["ACCOUNTING", fs.readFileSync(path.join(root, "backend/accounting-service/Code.gs"), "utf8")],
  ["EXAM", fs.readFileSync(path.join(root, "backend/exam-service/Code.gs"), "utf8")],
  ["DEVELOPER", fs.readFileSync(path.join(root, "backend/developer-service/Code.gs"), "utf8")]
];
for (const [serviceName, serviceSource] of hmacSecretServices) {
  const getSecret = extractFunctionFrom(serviceSource, "getAuthTokenSecret");
  const configuredContext = { PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "AUTH_TOKEN_SECRET" ? "a".repeat(64) : null }) } };
  vm.runInNewContext(getSecret + String.fromCharCode(10) + "this.getSecret = getAuthTokenSecret;", configuredContext);
  assert.equal(configuredContext.getSecret(), "a".repeat(64), serviceName + " returns the provisioned shared secret");
  const missingContext = { PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) } };
  vm.runInNewContext(getSecret + String.fromCharCode(10) + "this.getSecret = getAuthTokenSecret;", missingContext);
  assert.throws(() => missingContext.getSecret(), /AUTH_TOKEN_SECRET_NOT_CONFIGURED/, serviceName + " fails closed when secret is missing");
  const shortContext = { PropertiesService: { getScriptProperties: () => ({ getProperty: () => "short" }) } };
  vm.runInNewContext(getSecret + String.fromCharCode(10) + "this.getSecret = getAuthTokenSecret;", shortContext);
  assert.throws(() => shortContext.getSecret(), /AUTH_TOKEN_SECRET_NOT_CONFIGURED/, serviceName + " rejects weak secrets");
}
console.log("TASK-636 private HMAC secret contract: all six services require a provisioned shared secret of at least 32 characters; deterministic public fallback removed.");

// TASK-636 AUD-NG-002/306/369: audit public Academic exceptions, global metrics and destructive close boundary.

const publicActionsMatch = academicSource.match(/const PUBLIC_ACTIONS = (\[[^\]]*\]);/);
assert(publicActionsMatch, "Academic public action allowlist exists");
const academicPublicActions = JSON.parse(publicActionsMatch[1]);
assert.deepEqual(academicPublicActions.sort(), ["createAdmissionRequest","getAdmissionDraft","getPublicAdmissionStatus","ping","saveAdmissionDraft"].sort(), "only documented public admission capabilities and ping bypass session RBAC");
for (const sensitiveAction of ["getAdmissionRequests","updateAdmissionStatus","getStudentFile","getStudentEnrollments","saveQuestion","getAcademicHistory","closeAcademicYear"]) {
  assert(!academicPublicActions.includes(sensitiveAction), "sensitive Academic action is not public: " + sensitiveAction);
}
const publicAdmissionStatus = extractFunctionFrom(academicSource, "getPublicAdmissionStatus");
assert(publicAdmissionStatus.includes("isValidOpaqueAdmissionAccessToken(accessToken)") && publicAdmissionStatus.includes("hashOpaqueAdmissionAccessToken(accessToken)"), "public status uses a hashed opaque capability");
assert(publicAdmissionStatus.includes("solicitudId: match[0]") && publicAdmissionStatus.includes("estadoSolicitud: match[11]"), "public status exposes only the minimal request status projection");
for (const privateField of ["identificacion:","nombreResponsable:","telefonoContacto:","emailContacto:","observaciones:"]) {
  assert(!publicAdmissionStatus.includes(privateField), "public status must not expose PII field " + privateField);
}
const savePublicDraft = extractFunctionFrom(academicSource, "saveAdmissionDraft");
assert(savePublicDraft.includes('ensureAdmissionTokenColumn(sheet, "AccessTokenHash")') && savePublicDraft.includes("newRow[tokenColumn - 1] = accessTokenHash"), "draft sheet persists only the capability hash");
const readPublicDraft = extractFunctionFrom(academicSource, "getAdmissionDraft");
assert(readPublicDraft.includes("isValidOpaqueAdmissionAccessToken(accessToken)") && readPublicDraft.includes("hashOpaqueAdmissionAccessToken(accessToken)"), "draft retrieval requires the opaque capability");
const globalDriveMetrics = extractFunction("getDriveStorageQuotaMetricsReport");
assert(globalDriveMetrics.includes('["Administrador", "Desarrollador"].indexOf(role)') && globalDriveMetrics.indexOf("const role") < globalDriveMetrics.indexOf("DriveApp"), "global Drive metrics require verified admin role before Drive access");
assert(!globalDriveMetrics.includes("payload.authRole"), "global Drive metrics never trust client role");
const closeYear = extractFunction("closeAcademicYear");
assert(closeYear.includes('code:"BACKUP_REQUIRED"') && !closeYear.includes("deleteRow") && !closeYear.includes("setTrashed"), "academic year close remains fail-closed without destructive side effects");
console.log("TASK-636 public boundary local contract: Academic opaque admission capabilities, minimal public status, admin-only global Drive metrics and fail-closed year close passed.");

// TASK-636 AUD-NG-001/002: invalidate the newly introduced current-role cache on identity mutations.

const invalidateRoleCache = extractFunctionFrom(userSource, "invalidateUserRoleCache");
const removedCacheKeys = [];
const cacheInvalidationContext = { CacheService: { getScriptCache: () => ({ remove: key => removedCacheKeys.push(key) }) } };
vm.runInNewContext(invalidateRoleCache + String.fromCharCode(10) + "this.invalidate = invalidateUserRoleCache;", cacheInvalidationContext);
assert.equal(cacheInvalidationContext.invalidate("USER-1"), true);
assert.deepEqual(removedCacheKeys.sort(), ["acct_role_USER-1","acct_state_USER-1","user_role_USER-1"].sort(), "role and account state cache entries are all invalidated");
assert(extractFunctionFrom(userSource, "manageAccountState").includes("invalidateUserRoleCache(userId)"), "account state changes invalidate session claim caches immediately");
assert(extractFunctionFrom(userSource, "registerUser").includes("invalidateUserRoleCache(userId)"), "forced account role reset invalidates session claim caches immediately");
console.log("TASK-636 role cache invalidation local contract: role/state cache keys are cleared after account and role changes.");
