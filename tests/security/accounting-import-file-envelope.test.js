"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });
const start = source.indexOf("function validateImportWorkbookBinary_(");
assert.ok(start >= 0);
const open = source.indexOf("{", start);
let depth = 0, quote = "", escaped = false, line = false, block = false, end = -1;
for (let i = open; i < source.length; i++) {
  const ch = source[i], next = source[i + 1];
  if (line) { if (ch === "\n") line = false; continue; }
  if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
  if (quote) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === quote) quote = ""; continue; }
  if (ch === "/" && next === "/") { line = true; i++; continue; }
  if (ch === "/" && next === "*") { block = true; i++; continue; }
  if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
  if (ch === "{") depth++;
  else if (ch === "}" && --depth === 0) { end = i + 1; break; }
}
assert.ok(end > start);
const fn = source.slice(start, end);

let entries = [
  "[Content_Types].xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"
].map(name => ({ getName: () => name, getBytes: () => [1,2,3] }));
let unzipError = false;
const runtime = {
  Utilities: {
    DigestAlgorithm: { SHA_256: "SHA_256" },
    base64Decode: value => Array.from(Buffer.from(value, "base64")),
    newBlob: (bytes, mime, name) => ({ bytes, mime, name }),
    unzip: () => { if (unzipError) throw new Error("bad zip"); return entries; },
    computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest())
  }
};
vm.runInNewContext(fn + "\nthis.validate = validateImportWorkbookBinary_;", runtime);
const validBytes = Buffer.from([0x50,0x4b,0x03,0x04,0x10,0x20,0x30]);
const base = { nombreArchivo: "cursos.xlsx", mimeTypeArchivo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  fileDataBase64: validBytes.toString("base64") };
{
  const result = runtime.validate(base);
  assert.equal(result.valid, true);
  assert.equal(result.sizeBytes, validBytes.length);
  assert.equal(result.fileHash, crypto.createHash("sha256").update(validBytes).digest("hex"));
}
assert.equal(runtime.validate({ ...base, nombreArchivo: "cursos.xlsm" }).code, "IMPORT_FILE_INVALID");
assert.equal(runtime.validate({ ...base, mimeTypeArchivo: "application/pdf" }).code, "IMPORT_FILE_MIME_INVALID");
assert.equal(runtime.validate({ ...base, fileDataBase64: "not base64!" }).code, "IMPORT_FILE_BASE64_INVALID");
assert.equal(runtime.validate({ ...base, fileDataBase64: Buffer.from("not zip").toString("base64") }).code, "IMPORT_FILE_SIGNATURE_INVALID");
entries = [...entries, { getName: () => "xl/vbaProject.bin", getBytes: () => [1] }];
assert.equal(runtime.validate(base).code, "IMPORT_FILE_MACROS_NOT_ALLOWED");
entries = [{ getName: () => "../evil.xml", getBytes: () => [1] }];
assert.equal(runtime.validate(base).code, "IMPORT_FILE_PACKAGE_INVALID");
entries = [{ getName: () => "[Content_Types].xml", getBytes: () => [1] }];
assert.equal(runtime.validate(base).code, "IMPORT_FILE_PACKAGE_INVALID");
entries = [{ getName: () => "[Content_Types].xml", getBytes: () => new Array(15 * 1024 * 1024 + 1).fill(1) }];
assert.equal(runtime.validate(base).code, "IMPORT_FILE_UNCOMPRESSED_SIZE_LIMIT");
unzipError = true;
assert.equal(runtime.validate(base).code, "IMPORT_FILE_PACKAGE_INVALID");
process.stdout.write("Accounting XLSX binary envelope: signature, MIME, package, macros, decompression limits and SHA-256 PASS.\n");
