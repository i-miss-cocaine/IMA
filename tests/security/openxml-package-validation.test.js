"use strict";
// Runs against all standalone Apps Script service validators.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

function extractFunction(source,name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0,name+" exists");
  const open=source.indexOf("{",start);
  let depth=0,quote="",escape=false,line=false,block=false;
  for(let i=open;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(line){if(c==="\n")line=false;continue;}
    if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
    if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}
    if(c==="/"&&n==="/"){line=true;i++;continue;}
    if(c==="/"&&n==="*"){block=true;i++;continue;}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue;}
    if(c==="{")depth++;
    else if(c==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("Unbalanced "+name);
}

function crc32(buffer){
  let crc=0xFFFFFFFF;
  for(const byte of buffer){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);
  }
  return (crc^0xFFFFFFFF)>>>0;
}
function makeZip(items){
  const localParts=[],centralParts=[];
  let offset=0;
  items.forEach(item=>{
    const name=Buffer.from(item.name,"utf8"),data=Buffer.from(item.data||"","utf8");
    const crc=crc32(data),method=item.method||0,flags=item.flags||0;
    const compressed=item.compressedSizeOverride===undefined?data.length:item.compressedSizeOverride;
    const uncompressed=item.uncompressedSizeOverride===undefined?data.length:item.uncompressedSizeOverride;
    const local=Buffer.alloc(30+name.length+data.length);
    local.writeUInt32LE(0x04034B50,0);local.writeUInt16LE(20,4);
    local.writeUInt16LE(item.localFlags===undefined?flags:item.localFlags,6);
    local.writeUInt16LE(item.localMethod===undefined?method:item.localMethod,8);
    local.writeUInt32LE(item.localCrc===undefined?crc:item.localCrc,14);
    local.writeUInt32LE(item.localCompressedSize===undefined?compressed:item.localCompressedSize,18);
    local.writeUInt32LE(item.localUncompressedSize===undefined?uncompressed:item.localUncompressedSize,22);
    local.writeUInt16LE(name.length,26);local.writeUInt16LE(0,28);
    name.copy(local,30);data.copy(local,30+name.length);
    const central=Buffer.alloc(46+name.length);
    central.writeUInt32LE(0x02014B50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
    central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);
    central.writeUInt32LE(compressed,20);central.writeUInt32LE(uncompressed,24);
    central.writeUInt16LE(name.length,28);central.writeUInt16LE(0,30);central.writeUInt16LE(0,32);
    central.writeUInt16LE(0,34);central.writeUInt16LE(0,36);central.writeUInt32LE(0,38);
    central.writeUInt32LE(offset,42);name.copy(central,46);
    localParts.push(local);centralParts.push(central);offset+=local.length;
  });
  const centralOffset=offset,centralSize=centralParts.reduce((sum,item)=>sum+item.length,0);
  const eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054B50,0);eocd.writeUInt16LE(0,4);eocd.writeUInt16LE(0,6);
  eocd.writeUInt16LE(items.length,8);eocd.writeUInt16LE(items.length,10);
  eocd.writeUInt32LE(centralSize,12);eocd.writeUInt32LE(centralOffset,16);eocd.writeUInt16LE(0,20);
  return Buffer.concat([...localParts,...centralParts,eocd]);
}
function makeBlobs(items){
  return items.map(item=>{
    const bytes=Buffer.from(item.data||"","utf8");
    return {getName:()=>item.name,getBytes:()=>Array.from(bytes),getDataAsString:()=>bytes.toString("utf8")};
  });
}
function parseXml(xml){
  const token=/<\/?([A-Za-z_][A-Za-z0-9_.:-]*)(?:\s[^<>]*?)?\/?>/g;
  const stack=[];let root=null,match;
  while((match=token.exec(xml))){
    const tag=match[0];
    if(tag.startsWith("<?")||tag.startsWith("<!"))continue;
    const name=match[1].split(":").pop();
    if(tag.startsWith("</")){
      if(!stack.length||stack[stack.length-1].name!==name)throw new Error("mismatched XML");
      stack.pop();continue;
    }
    const node={name:name,children:[],getName(){return this.name;},getChildren(){return this.children;}};
    if(stack.length)stack[stack.length-1].children.push(node);else if(!root)root=node;else throw new Error("multiple roots");
    if(!tag.endsWith("/>"))stack.push(node);
  }
  if(!root||stack.length)throw new Error("malformed XML");
  return {getRootElement:()=>root};
}

const docxEntries=[
  {name:"[Content_Types].xml",data:'<Types><Default Extension="xml" ContentType="application/xml"/></Types>'},
  {name:"word/document.xml",data:'<w:document xmlns:w="urn:w"><w:body><w:p/><w:tbl/><w:sdt/><w:ffData/><w:fldChar/></w:body></w:document>'},
  {name:"word/_rels/document.xml.rels",data:'<Relationships/>'}
];
const xlsxEntries=[
  {name:"[Content_Types].xml",data:'<Types><Default Extension="xml" ContentType="application/xml"/></Types>'},
  {name:"xl/workbook.xml",data:'<workbook><sheets><sheet name="Datos" sheetId="1"/></sheets></workbook>'},
  {name:"xl/worksheets/sheet1.xml",data:'<worksheet><sheetData><row><c><v>1</v></c></row></sheetData></worksheet>'},
  {name:"xl/sharedStrings.xml",data:'<sst><si><t>Dato</t></si></sst>'}
];
let unzipEntries=[];
const context={
  Utilities:{
    base64Decode:value=>Array.from(Buffer.from(value,"base64")),
    newBlob:bytes=>({bytes:bytes}),
    unzip:()=>unzipEntries
  },
  XmlService:{parse:parseXml},
  Buffer,Date,String,Number,Array,Object,Math,JSON,RegExp,Error,isFinite
};

for(const servicePath of ["backend/academic-service/Code.gs","backend/accounting-service/Code.gs","backend/user-service/Code.gs"]){
  const source=fs.readFileSync(servicePath,"utf8");
  const helper=extractFunction(source,"validateOpenXmlPackageStructure_");
  const validator=extractFunction(source,"validateFileBinaryIntegrity");
  const sandbox=Object.assign({},context);
  vm.createContext(sandbox);
  vm.runInContext(helper+"\n"+validator+"\nthis.validate=validateFileBinaryIntegrity;this.inspect=validateOpenXmlPackageStructure_;",sandbox);

  unzipEntries=makeBlobs(docxEntries);
  const docx=sandbox.validate(makeZip(docxEntries).toString("base64"),"evidence.docx");
  assert.equal(docx.valid,true,servicePath+" valid DOCX");
  assert.equal(docx.openXmlStructure.verified,true);
  assert.equal(docx.openXmlStructure.paragraphs,1);
  assert.equal(docx.openXmlStructure.tables,1);
  assert.equal(docx.openXmlStructure.contentControls,1);
  assert.equal(docx.openXmlStructure.formFields,2);

  unzipEntries=makeBlobs(xlsxEntries);
  const xlsx=sandbox.validate(makeZip(xlsxEntries).toString("base64"),"import.xlsx");
  assert.equal(xlsx.valid,true,servicePath+" valid XLSX");
  assert.equal(xlsx.openXmlStructure.sheetCount,1);
  assert.equal(xlsx.openXmlStructure.worksheetCount,1);
  const macroWorkbook = xlsxEntries.concat([{name:"xl/vbaProject.bin",data:"macro"}]);
  unzipEntries=makeBlobs(macroWorkbook);
  assert.throws(()=>sandbox.validate(makeZip(macroWorkbook).toString("base64"),"macro.xlsx"),/(?:XLSX_MACROS_NOT_ALLOWED|OPENXML_ACTIVE_CONTENT_NOT_ALLOWED)/);

  const malformed=docxEntries.map(item=>({...item}));
  malformed[1].data="<w:document><w:body></w:document>";
  unzipEntries=makeBlobs(malformed);
  assert.throws(()=>sandbox.validate(makeZip(malformed).toString("base64"),"bad.docx"),/OPENXML_XML_INVALID/);

  const mismatch=makeBlobs(docxEntries).map(blob=>blob);
  mismatch[1]={getName:()=> "word/document.xml",getBytes:()=>[1],getDataAsString:()=>"x"};
  unzipEntries=mismatch;
  assert.throws(()=>sandbox.validate(makeZip(docxEntries).toString("base64"),"mismatch.docx"),/OPENXML_ENTRY_SIZE_MISMATCH/);

  const missingDocx=[docxEntries[0]];
  unzipEntries=makeBlobs(missingDocx);
  assert.throws(()=>sandbox.validate(makeZip(missingDocx).toString("base64"),"missing.docx"),/DOCX_STRUCTURE_INVALID/);

  const encrypted=docxEntries.map(item=>({...item}));
  encrypted[1].flags=1;encrypted[1].localFlags=1;
  unzipEntries=makeBlobs(encrypted);
  assert.throws(()=>sandbox.validate(makeZip(encrypted).toString("base64"),"encrypted.docx"),/OPENXML_ZIP_INVALID/);

  const traversal=docxEntries.concat([{name:"../escape.xml",data:"<x/>"}]);
  unzipEntries=makeBlobs(traversal);
  assert.throws(()=>sandbox.validate(makeZip(traversal).toString("base64"),"traversal.docx"),/OPENXML_ZIP_INVALID/);

  const duplicate=docxEntries.concat([{name:"word/document.xml",data:"<document/>"}]);
  unzipEntries=makeBlobs(duplicate);
  assert.throws(()=>sandbox.validate(makeZip(duplicate).toString("base64"),"duplicate.docx"),/OPENXML_ZIP_INVALID/);

  const mismatchFlags=docxEntries.map(item=>({...item}));
  mismatchFlags[1].localFlags=1;
  unzipEntries=makeBlobs(mismatchFlags);
  assert.throws(()=>sandbox.validate(makeZip(mismatchFlags).toString("base64"),"flags.docx"),/OPENXML_ZIP_INVALID/);

  const ratioBomb=docxEntries.map(item=>({...item}));
  ratioBomb[1]={name:"word/document.xml",data:"x",uncompressedSizeOverride:1000};
  unzipEntries=makeBlobs(ratioBomb);
  assert.throws(()=>sandbox.validate(makeZip(ratioBomb).toString("base64"),"ratio.docx"),/OPENXML_ZIP_COMPRESSION_RATIO_EXCEEDED/);

  const expandedBomb=docxEntries.map(item=>({...item}));
  expandedBomb[1]={name:"word/document.xml",data:"x".repeat(300000),uncompressedSizeOverride:50*1024*1024+1};
  unzipEntries=makeBlobs(expandedBomb);
  assert.throws(()=>sandbox.validate(makeZip(expandedBomb).toString("base64"),"expanded.docx"),/OPENXML_EXPANDED_SIZE_EXCEEDED/);
}

console.log("OpenXML package validation passed for Academic, Accounting and User: DOCX paragraphs/tables/controls/forms, XLSX workbook/sheets, malformed XML, encrypted/duplicate/traversal ZIP entries, local-header mismatch and decompression limits.");
