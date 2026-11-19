"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const academic=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8");
function extract(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,name+" exists");const open=source.indexOf("{",start);
 let depth=0,quote="",escape=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="\`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}
 throw new Error("Unbalanced "+name);
}
function compile(scope){
 const keys=Object.keys(scope);
 return new Function(...keys,extract(academic,"extractPdfTextWithOcr_")+"\nreturn extractPdfTextWithOcr_;")(...keys.map(k=>scope[k]));
}
function pdfFile(text){return{getMimeType:()=>"application/pdf",getBlob:()=>({getBytes:()=>[37,80,68,70],text:text||""})};}
let insertOptions=null,removedId="";
const successScope={
 Drive:{Files:{insert:(resource,blob,options)=>{insertOptions={resource,options};return{id:"TMP-OCR-1"};},remove:id=>{removedId=id;}}},
 DriveApp:{getFileById:()=>({setTrashed(){},isTrashed(){return true;}})},
 DocumentApp:{openById:id=>({getBody:()=>({getText:()=>"Texto OCR de prueba"})})},
 Utilities:{getUuid:()=>"uuid-test"}
};
const success=compile(successScope)(pdfFile(),{language:"es",includeText:true,maxTextChars:8});
assert.equal(success.status,"success");
assert.equal(success.text,"Texto OC");
assert.equal(success.textLength,19);
assert.equal(success.truncated,true);
assert.equal(success.language,"es");
assert.equal(removedId,"TMP-OCR-1");
assert.equal(insertOptions.options.convert,true);
assert.equal(insertOptions.options.ocr,true);
assert.equal(insertOptions.options.ocrLanguage,"es");
assert.equal(insertOptions.resource.mimeType,"application/vnd.google-apps.document");
const metadataOnly=compile(successScope)(pdfFile(),{language:"en",includeText:false});
assert.equal(metadataOnly.status,"success");
assert.equal(metadataOnly.text,undefined);
assert.equal(metadataOnly.language,"en");
assert.equal(removedId,"TMP-OCR-1");
const unavailable=compile({Drive:undefined})(pdfFile(),{});
assert.equal(unavailable.code,"OCR_ADVANCED_SERVICE_UNAVAILABLE");
const wrongType=compile(successScope)({getMimeType:()=>"image/png",getBlob:()=>({getBytes:()=>[1]})},{});
assert.equal(wrongType.code,"OCR_UNSUPPORTED_FILE_TYPE");
const noText=compile({...successScope,DocumentApp:{openById:()=>({getBody:()=>({getText:()=>""})})}})(pdfFile(),{});
assert.equal(noText.code,"OCR_NO_TEXT_EXTRACTED");
let cleaned=false;
const cleanupFallback=compile({
 Drive:{Files:{insert:()=>({id:"TMP-FALLBACK"}),remove:()=>{throw new Error("remove unavailable");}}},
 DriveApp:{getFileById:()=>({setTrashed:()=>{cleaned=true;},isTrashed:()=>cleaned})},
 DocumentApp:{openById:()=>({getBody:()=>({getText:()=>"texto"})})},Utilities:{getUuid:()=>"uuid"}
})(pdfFile(),{includeText:true});
assert.equal(cleanupFallback.status,"success");
assert.equal(cleaned,true);
const cleanupFailure=compile({
 Drive:{Files:{insert:()=>({id:"TMP-LEAK"}),remove:()=>{throw new Error("remove failed");}}},
 DriveApp:{getFileById:()=>({setTrashed:()=>{},isTrashed:()=>false})},
 DocumentApp:{openById:()=>({getBody:()=>({getText:()=>"texto"})})},Utilities:{getUuid:()=>"uuid"}
})(pdfFile(),{includeText:true});
assert.equal(cleanupFailure.code,"OCR_TEMP_FILE_CLEANUP_FAILED");
const conversionFailure=compile({
 Drive:{Files:{insert:()=>{throw new Error("Drive conversion failed");},remove:()=>{throw new Error("must not be called");}}},
 DocumentApp:{openById:()=>{throw new Error("must not be called");}},Utilities:{getUuid:()=>"uuid"}
})(pdfFile(),{});
assert.equal(conversionFailure.code,"OCR_CONVERSION_FAILED");
assert.match(academic,/requestedDocumentId/);
assert.match(academic,/request\.ocrRequested === true/);
assert.match(academic,/extractPdfTextWithOcr_\(file/);

function compileEvidenceValidator(scope){
 const keys=Object.keys(scope);
 return new Function(...keys,extract(academic,"validateEvidenceFileAndPermissions")+";return validateEvidenceFileAndPermissions;")(...keys.map(k=>scope[k]));
}
let scopedPayload=null,driveReads=0;
const documentRow=["DOC-1","EXP-1","SOL-1","PDF","evidencia.pdf","FILE-1"];
function evidenceScope(){
 return {
  getVerifiedAcademicIdentity_:()=>({authorized:true,role:"Orientacion",userId:"U-1"}),
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="DocumentosEstudiante"?{getDataRange:()=>({getValues:()=>[["DocumentoID","ExpedienteID","SolicitudID","Tipo","NombreArchivo","DriveFileID"],documentRow]})}:{}})},
  assertStudentDocumentScopeAccess_:(payload)=>{scopedPayload=payload;return{authorized:true};},
  SPREADSHEET_ID:"TEST",
  DriveApp:{getFileById:id=>{driveReads++;assert.equal(id,"FILE-1");return{getMimeType:()=>"application/pdf",getSize:()=>4,getName:()=>"evidencia.pdf",getBlob:()=>({getBytes:()=>[37,80,68,70]})};}},
  Utilities:{base64Encode:()=>"JVBERi0xLjQ="},
  validateFileBinaryIntegrity:()=>({byteLength:4,mimeType:"application/pdf",detectedFormat:"pdf"}),
  classifyPdfDocumentPages_:()=>({verified:true,pageCount:1,pages:[{pageNumber:1,classification:"ESCANEADA"}],summary:{vectorial:0,escaneada:1,mixta:0,vacia:0,noAnalizada:0},requiresOcr:true}),
  extractPdfTextWithOcr_:()=>({status:"success",language:"es",textLength:12,text:"texto extraído"}),
  logStructuredEvent:()=>{}
 };
}
const validator=compileEvidenceValidator(evidenceScope());
const validated=validator({documentoId:"DOC-1",studentId:"STU-1",ocrRequested:true,includeOcrText:true});
assert.equal(validated.status,"success");
assert.equal(validated.documentoId,"DOC-1");
assert.equal(validated.fileId,undefined,"resolved Drive IDs are not exposed to callers that supplied only documentoId");
assert.equal(validated.previewUrl,"");
assert.equal(validated.pdfPageAnalysis.summary.escaneada,1);
assert.equal(validated.ocr.text,"texto extraído");
assert.equal(validated.validationComplete,true);
assert.equal(scopedPayload.fileId,"FILE-1","scope validation receives the server-resolved Drive ID");
assert.equal(driveReads,1);
const noOcr=compileEvidenceValidator(evidenceScope())({documentoId:"DOC-1",studentId:"STU-1"});
assert.equal(noOcr.ocrStatus,"REQUIRED_NOT_REQUESTED");
assert.equal(noOcr.validationComplete,false);
const compressedScope=evidenceScope();
compressedScope.classifyPdfDocumentPages_=()=>({verified:false,pageCount:1,pages:[{pageNumber:1,classification:"NO_ANALIZADA"}],summary:{vectorial:0,escaneada:0,mixta:0,vacia:0,noAnalizada:1},requiresOcr:true});
const compressedReview=compileEvidenceValidator(compressedScope)({documentoId:"DOC-1",studentId:"STU-1",ocrRequested:true,includeOcrText:true});
assert.equal(compressedReview.ocrStatus,"success");
assert.equal(compressedReview.validationComplete,false,"OCR text cannot falsely mark an unclassified PDF as fully verified");

process.stdout.write("Academic PDF OCR contract: conversion options, text minimization, MIME guard, fail-closed errors and temporary-file cleanup PASS.\n");
