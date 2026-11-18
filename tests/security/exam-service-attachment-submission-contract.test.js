const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/exam-service/Code.gs", "utf8");
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const brace = text.indexOf("{", start); let depth = 0;
  for (let end = brace; end < text.length; end++) {
    if (text[end] === "{") depth++;
    else if (text[end] === "}" && --depth === 0) return text.slice(start, end + 1);
  }
  throw new Error("unterminated " + name);
}
const names = ["ensureExamAttachmentsSheet_","sanitizeExamAttachmentName_","persistExamQuestionAttachments_","rollbackExamQuestionAttachments_","getExamQuestionAttachmentsForResult_"];
const headers = ["AdjuntoID","EntregaExamenID","ExamenID","PreguntaID","UserID","FileID","Nombre","MimeType","TamanoBytes","FechaRegistro"];
const helpers = names.map(name => extractFunction(source,name)).join("\n") +
  "\nconst EXAM_ATTACHMENT_MAX_BYTES_ = 5 * 1024 * 1024;\nconst EXAM_ATTACHMENT_HEADERS_ = " + JSON.stringify(headers) + ";";
const sheet = { rows:[headers], getDataRange(){return {getValues:()=>this.rows.map(row=>row.slice())};},
  getLastRow(){return this.rows.length;}, appendRow(row){this.rows.push(row.slice());},
  deleteRows(start,count){this.rows.splice(start-1,count);} };
const stored = new Map(); let sequence=0;
const context = {
  Utilities:{base64Decode(value){return Array.from(Buffer.from(value,"base64"));},
    base64Encode(value){return Buffer.from(value).toString("base64");},
    newBlob(bytes,mime,name){return {bytes,mime,name,getBytes(){return bytes;},getContentType(){return mime;}};},
    getUuid(){return "U"+(++sequence);}},
  DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},createFile(blob){const id="F"+(++sequence),file={id,blob,trashed:false,getId(){return id;},getBlob(){return blob;},setTrashed(v){this.trashed=v;},setSharing(){}};stored.set(id,file);return file;},
    getFileById(id){if(!stored.has(id))throw Error("missing");return stored.get(id);}},
  Date,JSON,Object,Array,String,Number,Math,RegExp
};
vm.createContext(context);
vm.runInContext(helpers+"\nthis.persist=persistExamQuestionAttachments_;this.rollback=rollbackExamQuestionAttachments_;this.read=getExamQuestionAttachmentsForResult_;",context);
const ss={getSheetByName(name){return name==="AdjuntosExamen"?sheet:null;},insertSheet(){return sheet;}};
const encoded=Buffer.from("synthetic-pdf").toString("base64");
const questions=[["Q1","EX1","adjunto","Adjunte el archivo",'{"acceptedMimeTypes":["application/pdf"],"maxFiles":2}',"",5]];
const answer=[{preguntaId:"Q1",respuestaEstudiante:"",adjuntos:[{name:"../evidencia.pdf",mimeType:"application/pdf",dataUrl:"data:application/pdf;base64,"+encoded}]}];
const state=context.persist(ss,questions,answer,"DEL1","EX1","STU1");
assert.equal(state.rowCount,1);
assert.equal(sheet.rows.length,2);
assert.equal(state.respuestas[0].adjuntos[0].nombre,"_evidencia.pdf");
assert.equal(state.respuestas[0].adjuntos[0].fileId,undefined);
const read=context.read(ss,["DEL1","EX1","STU1"],"EX1","Q1");
assert.equal(read.length,1);
assert.equal(read[0].dataUrl,"data:application/pdf;base64,"+encoded);
assert.throws(()=>context.persist(ss,questions,[{preguntaId:"Q1",adjuntos:[{name:"bad.exe",mimeType:"application/x-msdownload",dataUrl:"data:application/x-msdownload;base64,"+encoded}]}],"DEL2","EX1","STU1"),/EXAM_ATTACHMENT_MIME_NOT_ALLOWED/);
assert.throws(()=>context.persist(ss,questions,[{preguntaId:"Q1",adjuntos:[{name:"wrong.pdf",mimeType:"image/png",dataUrl:"data:application/pdf;base64,"+encoded}]}],"DEL2","EX1","STU1"),/EXAM_ATTACHMENT_MIME_NOT_ALLOWED/);
assert.throws(()=>context.persist(ss,[["Q2","EX1","respuesta_extensa","Texto","{}","",5]],[{preguntaId:"Q2",adjuntos:[{name:"x.pdf",mimeType:"application/pdf",dataUrl:"data:application/pdf;base64,"+encoded}]}],"DEL3","EX1","STU1"),/EXAM_ATTACHMENT_NOT_ALLOWED/);
context.rollback(state);
assert.equal(sheet.rows.length,1);
assert.equal(state.createdFiles[0].trashed,true);
assert.ok(extractFunction(source,"submitExam").includes("LockService.getScriptLock()"));
assert.ok(extractFunction(source,"getExamResultUnlocked_").includes("getExamQuestionAttachmentsForResult_"));
assert.ok(extractFunction(source,"getAuthorizedExamResultReadContext_").includes("getExamReadContext_(payload, requestedStudentId)"));
console.log("exam-service-attachment-submission-contract: MIME validation, delivery association, authorized result read and rollback PASS");
