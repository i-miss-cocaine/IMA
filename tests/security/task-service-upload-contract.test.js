"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("backend/task-service/Code.gs","utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extract(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const next=source.indexOf("\nfunction ",start+10);return source.slice(start,next<0?source.length:next);}
const upload=extract("uploadFile");
assert.doesNotMatch(upload,/validateTaskUploadFile_|assertTaskServiceStudentCanAccessTask|assertTaskServiceTeacherCanManageTask|validateRolePermission|verifySessionToken/);
assert.match(upload,/50 \* 1024 \* 1024/);
assert.match(upload,/mp4:"video\/mp4"/);
assert.match(upload,/png:"image\/png"/);
assert.match(upload,/application\/octet-stream/);
const taskRows=[["TaskID","","Title","","Partial","Subject","Grade","Section"],["TASK-1","","Lesson 1","","I","Math","6","A"]];
let metadata=null,folderCalls=0,file=null;
const folder={getId:()=>"FOLDER-1",createFile(blob){file={blob,getId:()=>"FILE-1",getUrl:()=>"drive-file-url",setTrashed(v){this.trashed=v;}};return file;}};
const context={
 DRIVE_FOLDER_ID:"ROOT",SPREADSHEET_ID:"LOCAL",
 SpreadsheetApp:{openById:()=>({})},
 getSheetOrThrow:(_ss,name)=>{assert.equal(name,"Tareas");return{getDataRange:()=>({getValues:()=>taskRows})};},
 getOrCreateFolder:(_parent,name)=>{folderCalls++;return folder;},
 DriveApp:{getFolderById:id=>{assert.equal(id,"ROOT");return folder;}},
 Utilities:{base64Decode:value=>Buffer.from(value,"base64"),newBlob:(bytes,mimeType,name)=>({bytes:Buffer.from(bytes),mimeType,name})},
 logFileMetadata:(_ss,value)=>{metadata=value;}
};
vm.createContext(context);vm.runInContext(upload+"\nthis.run=uploadFile;",context);
const video=context.run({_verifiedUserId:"STUDENT-1",_verifiedRole:"Estudiante",tareaId:"TASK-1",fileName:"lesson.mp4",fileData:"data:video/mp4;base64,"+Buffer.from("video").toString("base64")});
assert.equal(video.status,"success");assert.equal(video.data.mimeType,"video/mp4");assert.equal(video.data.fileId,"FILE-1");
assert.equal(metadata.ownerUserId,"STUDENT-1");assert.equal(metadata.tareaId,"TASK-1");assert.equal(metadata.sizeBytes,5);
assert.equal(folderCalls,6,"folder hierarchy is built without extra authorization calls");
const arbitrary=context.run({_verifiedUserId:"STUDENT-1",tareaId:"TASK-1",fileName:"archive.zip",fileData:"data:application/zip;base64,"+Buffer.from("zip").toString("base64")});
assert.equal(arbitrary.status,"success","non-allowlisted file types are accepted for storage");
assert.equal(arbitrary.data.mimeType,"application/zip");
assert.throws(()=>context.run({_verifiedUserId:"STUDENT-1",tareaId:"TASK-1",fileName:"bad.exe",fileData:"data:application/octet-stream;base64,"+Buffer.from("x").toString("base64")}),/DANGEROUS_FILE_EXTENSION/);
assert.throws(()=>context.run({_verifiedUserId:"STUDENT-1",tareaId:"TASK-1",fileName:"empty.mp4",fileData:"data:video/mp4;base64,"}),/Archivo vacío/);
assert.throws(()=>context.run({_verifiedUserId:"STUDENT-1",tareaId:"MISSING",fileName:"x.mp4",fileData:"data:video/mp4;base64,"+Buffer.from("x").toString("base64")}),/Tarea no encontrada/);
console.log("PASS task upload: role-at-entry, generic files, images/videos, minimal size/name checks");
