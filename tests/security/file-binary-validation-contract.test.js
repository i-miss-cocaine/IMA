const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const servicePaths = ["backend/accounting-service/Code.gs","backend/user-service/Code.gs","backend/academic-service/Code.gs"];
function extractValidator(source,path) {
  const helperStart=source.indexOf("function validateOpenXmlPackageStructure_(");
  assert.notEqual(helperStart,-1,"missing OpenXML validator in "+path);
  const helperEnd=source.indexOf("\nfunction ",helperStart+10);
  const start=source.indexOf("function validateFileBinaryIntegrity(");
  assert.notEqual(start,-1,"missing validator in "+path);
  const next=source.indexOf("\nfunction ",start+10);
  return source.slice(helperStart,helperEnd<0?source.length:helperEnd)+"\n"+source.slice(start,next<0?source.length:next);
}
function dataUri(mime,bytes){return "data:"+mime+";base64,"+bytes.toString("base64");}
function makePng(){
  const signature=Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr=Buffer.concat([Buffer.from([0,0,0,13]),Buffer.from("IHDR"),Buffer.alloc(13),Buffer.alloc(4)]);
  const data=Buffer.from([1,2,3,4]);
  const idat=Buffer.concat([Buffer.from([0,0,0,data.length]),Buffer.from("IDAT"),data,Buffer.alloc(4)]);
  const iend=Buffer.from([0,0,0,0,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
  return Buffer.concat([signature,ihdr,idat,iend]);
}
function makeWebp(){
  const body=Buffer.concat([Buffer.from("WEBPVP8 "),Buffer.from([4,0,0,0]),Buffer.from([1,2,3,4])]);
  const head=Buffer.alloc(8);head.write("RIFF",0);head.writeUInt32LE(body.length,4);return Buffer.concat([head,body]);
}
function makeZip(entries){
  const locals=[],centrals=[];let offset=0;
  for(const entry of entries){
    const name=Buffer.from(entry.name,"ascii"),data=Buffer.from(entry.data||"<xml/>","utf8"),local=Buffer.alloc(30);
    const compressedSize=entry.compressedSize===undefined?data.length:Number(entry.compressedSize);
    const uncompressedSize=entry.uncompressedSize===undefined?data.length:Number(entry.uncompressedSize);
    local.writeUInt32LE(0x04034B50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0,6);local.writeUInt16LE(0,8);
    local.writeUInt16LE(0,10);local.writeUInt16LE(0,12);local.writeUInt32LE(0,14);local.writeUInt32LE(compressedSize,18);
    local.writeUInt32LE(uncompressedSize,22);local.writeUInt16LE(name.length,26);local.writeUInt16LE(0,28);
    locals.push(local,name,data);
    const central=Buffer.alloc(46);central.writeUInt32LE(0x02014B50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
    central.writeUInt16LE(0,8);central.writeUInt16LE(0,10);central.writeUInt16LE(0,12);central.writeUInt16LE(0,14);
    central.writeUInt32LE(0,16);central.writeUInt32LE(compressedSize,20);central.writeUInt32LE(uncompressedSize,24);
    central.writeUInt16LE(name.length,28);central.writeUInt16LE(0,30);central.writeUInt16LE(0,32);central.writeUInt16LE(0,34);
    central.writeUInt16LE(0,36);central.writeUInt32LE(0,38);central.writeUInt32LE(offset,42);centrals.push(central,name);
    offset+=local.length+name.length+data.length;
  }
  const centralBytes=Buffer.concat(centrals),eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054B50,0);eocd.writeUInt16LE(0,4);eocd.writeUInt16LE(0,6);
  eocd.writeUInt16LE(entries.length,8);eocd.writeUInt16LE(entries.length,10);
  eocd.writeUInt32LE(centralBytes.length,12);eocd.writeUInt32LE(offset,16);eocd.writeUInt16LE(0,20);
  return Buffer.concat([...locals,centralBytes,eocd]);
}
const pdf=Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nstartxref\n9\n%%EOF\n","ascii");
const jpeg=Buffer.from([0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0xFF,0xD9]);
const png=makePng(),webp=makeWebp();
const docx=makeZip([{name:"[Content_Types].xml"},{name:"word/document.xml"}]);
const xlsx=makeZip([{name:"[Content_Types].xml"},{name:"xl/workbook.xml"}]);
const scenarios=[
 ["valid PDF",()=>({data:dataUri("application/pdf",pdf),name:"evidence.pdf"}),true],
 ["PDF missing EOF/startxref",()=>({data:dataUri("application/pdf",Buffer.from("%PDF-1.4")),name:"broken.pdf"}),false],
 ["PDF with JavaScript action",()=>({data:dataUri("application/pdf",Buffer.from("%PDF-1.4\\n/JavaScript /OpenAction\\nstartxref\\n9\\n%%EOF\\n","ascii")),name:"active.pdf"}),false],
 ["executable hidden by double extension",()=>({data:dataUri("application/pdf",pdf),name:"payload.exe.pdf"}),false],
 ["valid JPEG",()=>({data:dataUri("image/jpeg",jpeg),name:"photo.jpg"}),true],
 ["JPEG missing EOI",()=>({data:dataUri("image/jpeg",jpeg.subarray(0,jpeg.length-2)),name:"broken.jpg"}),false],
 ["valid PNG",()=>({data:dataUri("image/png",png),name:"image.png"}),true],
 ["PNG missing IEND",()=>({data:dataUri("image/png",png.subarray(0,png.length-12)),name:"broken.png"}),false],
 ["valid WEBP",()=>({data:dataUri("image/webp",webp),name:"image.webp"}),true],
 ["WEBP wrong RIFF length",()=>({data:dataUri("image/webp",Buffer.concat([webp,Buffer.from([0])])),name:"broken.webp"}),false],
 ["valid DOCX OpenXML",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.wordprocessingml.document",docx),name:"form.docx"}),true],
 ["DOCX with VBA project",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.wordprocessingml.document",makeZip([{name:"[Content_Types].xml"},{name:"word/document.xml"},{name:"word/vbaProject.bin",data:"macro"}])),name:"macro.docx"}),false],
 ["DOCX ZIP bomb ratio",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.wordprocessingml.document",makeZip([{name:"[Content_Types].xml"},{name:"word/document.xml",data:"x",compressedSize:1,uncompressedSize:1000}])),name:"bomb.docx"}),false],
 ["DOCX missing document.xml",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.wordprocessingml.document",makeZip([{name:"[Content_Types].xml"}])),name:"bad.docx"}),false],
 ["valid XLSX OpenXML",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",xlsx),name:"grades.xlsx"}),true],
 ["XLSX missing workbook.xml",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",makeZip([{name:"[Content_Types].xml"}])),name:"bad.xlsx"}),false],
 ["unknown extension",()=>({data:dataUri("text/plain",Buffer.from("hello")),name:"readme.txt"}),false],
 ["MIME/extension mismatch",()=>({data:dataUri("image/png",pdf),name:"spoof.pdf"}),false],
 ["invalid base64",()=>({data:"data:application/pdf;base64,not*base64",name:"bad.pdf"}),false],
 ["empty file",()=>({data:"data:application/pdf;base64,",name:"empty.pdf"}),false],
 ["oversized file",()=>({data:dataUri("application/pdf",pdf),name:"large.pdf",options:{maxSizeBytes:8}}),false],
 ["extension allowlist",()=>({data:dataUri("application/pdf",pdf),name:"allowed.pdf",options:{allowedExtensions:[".png"]}}),false],
 ["path traversal filename",()=>({data:dataUri("application/pdf",pdf),name:"../outside.pdf"}),false],
 ["missing filename",()=>({data:dataUri("application/pdf",pdf),name:""}),false],
 ["missing file data",()=>({data:"",name:"missing.pdf"}),false],
 ["octet-stream MIME fallback",()=>({data:dataUri("application/octet-stream",pdf),name:"generic.pdf"}),true],
 ["raw base64 accepted",()=>({data:pdf.toString("base64"),name:"raw.pdf"}),true],
 ["ZIP path traversal rejected",()=>({data:dataUri("application/vnd.openxmlformats-officedocument.wordprocessingml.document",makeZip([{name:"[Content_Types].xml"},{name:"../word/document.xml"}])),name:"evil.docx"}),false]
];
const loaded=servicePaths.map(path=>({path,source:fs.readFileSync(path,"utf8")}));
const validators=loaded.map(item=>({path:item.path,fn:extractValidator(item.source,item.path)}));
assert.equal(validators[0].fn.trim(),validators[1].fn.trim(),"ACCOUNTING and USER validators must remain identical");
assert.equal(validators[0].fn.trim(),validators[2].fn.trim(),"ACADEMIC validator must remain aligned with ACCOUNTING and USER");
assert(validators[0].fn.includes("TargetMode") && validators[0].fn.includes("OPENXML_ACTIVE_CONTENT_NOT_ALLOWED"),"OpenXML external relationships and active content are rejected");
for(const validator of validators){
  const context={Buffer,Utilities:{base64Decode:value=>Buffer.from(value,"base64")}};
  vm.runInNewContext(validator.fn,context);
  for(const [label,make,shouldPass] of scenarios){
    const args=make();
    if(shouldPass){
      let result;
      try { result=context.validateFileBinaryIntegrity(args.data,args.name,args.options); }
      catch(error) { throw new Error(validator.path+": "+label+": "+String(error&&error.message||error)); }
      assert.equal(result.valid,true,validator.path+": "+label);
      assert.ok(result.byteLength>0,validator.path+": "+label+" byte length");
    }else{
      assert.throws(()=>context.validateFileBinaryIntegrity(args.data,args.name,args.options),undefined,validator.path+": "+label);
    }
  }
}
console.log("file-binary-validation-contract: PASS ("+(scenarios.length*validators.length)+" service/scenario combinations across ACADEMIC, ACCOUNTING and USER)");
