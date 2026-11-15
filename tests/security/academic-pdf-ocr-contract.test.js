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
process.stdout.write("Academic PDF OCR contract: conversion options, text minimization, MIME guard, fail-closed errors and temporary-file cleanup PASS.\n");
