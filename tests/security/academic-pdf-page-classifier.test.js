"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const academic=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8");
function extract(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,name+" exists");const open=source.indexOf("{",start);
 let depth=0,quote="",escape=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="\`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}
 throw new Error("Unbalanced "+name);
}
const classify=new Function(extract(academic,"classifyPdfDocumentPages_")+"\nreturn classifyPdfDocumentPages_;")();
function bytes(text){return Array.from(text).map(ch=>ch.charCodeAt(0));}
const objects=[
"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
"2 0 obj\n<< /Type /Pages /Kids [3 0 R 6 0 R 12 0 R 16 0 R 17 0 R] /Count 5 >>\nendobj",
"3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /Contents 5 0 R >>\nendobj",
"4 0 obj\n<< /Font << /F1 10 0 R >> >>\nendobj",
"5 0 obj\n<< /Length 34 >>\nstream\nBT /F1 12 Tf (Hello) Tj ET\nendstream\nendobj",
"6 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 7 0 R /Contents 8 0 R >>\nendobj",
"7 0 obj\n<< /XObject << /Im0 11 0 R >> >>\nendobj",
"8 0 obj\n<< /Length 18 >>\nstream\nq /Im0 Do Q\nendstream\nendobj",
"11 0 obj\n<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length 0 >>\nstream\n\nendstream\nendobj",
"12 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 13 0 R /Contents 14 0 R >>\nendobj",
"13 0 obj\n<< /Font << /F1 10 0 R >> /XObject << /Im1 15 0 R >> >>\nendobj",
"14 0 obj\n<< /Length 50 >>\nstream\nBT /F1 12 Tf (Mixed) Tj ET q /Im1 Do Q\nendstream\nendobj",
"15 0 obj\n<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length 0 >>\nstream\n\nendstream\nendobj",
"16 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj",
"17 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 18 0 R >>\nendobj",
"18 0 obj\n<< /Filter /FlateDecode /Length 12 >>\nstream\ncompressed\nendstream\nendobj"
];
const syntheticPdf="%PDF-1.4\n"+objects.join("\n")+"\ntrailer << /Root 1 0 R >>\nstartxref\n1\n%%EOF";
const result=classify(bytes(syntheticPdf));
assert.equal(result.pageCount,5);
assert.equal(result.summary.vectorial,1);
assert.equal(result.summary.escaneada,1);
assert.equal(result.summary.mixta,1);
assert.equal(result.summary.vacia,1);
assert.equal(result.summary.noAnalizada,1);
assert.deepEqual(result.pages.map(page=>page.classification),["VECTORIAL","ESCANEADA","MIXTA","VACIA","NO_ANALIZADA"]);
assert.equal(result.verified,false);
assert.equal(result.requiresOcr,true);
const encrypted=classify(bytes("%PDF-1.4\n/Encrypt 8 0 R\n"));
assert.equal(encrypted.pages[0].classification,"NO_ANALIZADA");
assert.equal(encrypted.reason,"PDF_ENCRYPTED");
const noTree=classify(bytes("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj"));
assert.equal(noTree.pages[0].classification,"NO_ANALIZADA");
assert.equal(noTree.reason,"PDF_PAGE_TREE_UNAVAILABLE");
assert.match(academic,/pdfPageAnalysis: pdfPageAnalysis/);
assert.match(academic,/REQUIRED_NOT_REQUESTED/);
process.stdout.write("Academic PDF page classifier: vectorial, scanned, mixed, empty, encrypted and unsupported pages PASS.\n");
