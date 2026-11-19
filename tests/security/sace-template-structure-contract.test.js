"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root,
  "docs/architecture/Plantillas/SACE/manifest.json"), "utf8"));
const signature = "BIFF8|SHEETS=1|DIMENSION=A1:I31|MERGES=13|STUDENT_ROWS=8:29|PARTIALS=2|RECOVERY=H|FORMULAS=0|DATA_VALIDATIONS=0|PROTECTED=0";
assert.equal(manifest.status, "CANDIDATE");
assert.equal(manifest.officialSourceVerified, false);
assert.equal(manifest.layoutSignature, signature);
assert.equal(manifest.templates.length, 3);

function readWorkbook(filePath) {
  const bytes = fs.readFileSync(filePath);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = offset => view.getUint16(offset, true);
  const u32 = offset => view.getUint32(offset, true);
  const signatureBytes = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  assert.ok(signatureBytes.every((value, index) => bytes[index] === value), "invalid OLE signature");
  const sectorSize = 1 << u16(30);
  const miniStreamCutoff = u32(56);
  const firstDirectorySector = u32(48);
  const firstDifatSector = u32(68);
  const difatSectorCount = u32(72);
  const difat = [];
  for (let i = 0; i < 109; i++) {
    const value = u32(76 + i * 4);
    if (value < 0xfffffffa) difat.push(value);
  }
  let difatSector = firstDifatSector;
  for (let i = 0; i < difatSectorCount && difatSector < 0xfffffffa; i++) {
    const offset = (difatSector + 1) * sectorSize;
    const sector = new DataView(bytes.buffer, bytes.byteOffset + offset, sectorSize);
    for (let j = 0; j < sectorSize / 4 - 1; j++) {
      const value = sector.getUint32(j * 4, true);
      if (value < 0xfffffffa) difat.push(value);
    }
    difatSector = sector.getUint32(sectorSize - 4, true);
  }
  const fat = [];
  for (const id of difat) {
    const offset = (id + 1) * sectorSize;
    const sector = new DataView(bytes.buffer, bytes.byteOffset + offset, sectorSize);
    for (let i = 0; i < sectorSize / 4; i++) fat.push(sector.getUint32(i * 4, true));
  }
  function getChain(start) {
    const result = [], seen = new Set();
    let id = start;
    while (id < 0xfffffffa && !seen.has(id) && result.length < 10000) {
      seen.add(id);
      result.push(id);
      id = fat[id] ?? 0xfffffffe;
    }
    return result;
  }
  function joinSectors(ids) {
    const result = Buffer.alloc(ids.length * sectorSize);
    ids.forEach((id, index) => bytes.copy(result, index * sectorSize,
      (id + 1) * sectorSize, (id + 2) * sectorSize));
    return result;
  }
  const directoryBytes = joinSectors(getChain(firstDirectorySector));
  const directoryView = new DataView(directoryBytes.buffer, directoryBytes.byteOffset, directoryBytes.byteLength);
  const entries = [];
  for (let offset = 0; offset + 128 <= directoryBytes.length; offset += 128) {
    const nameLength = directoryView.getUint16(offset + 64, true);
    const type = directoryBytes[offset + 66];
    if (!type || nameLength < 2) continue;
    let name = "";
    for (let i = 0; i < nameLength - 2; i += 2) name += String.fromCharCode(directoryView.getUint16(offset + i, true));
    entries.push({ name, type, start: directoryView.getUint32(offset + 116, true),
      size: Number(directoryView.getBigUint64(offset + 120, true)) });
  }
  const workbook = entries.find(entry => /^(Workbook|Book)$/i.test(entry.name));
  assert.ok(workbook, "Workbook stream missing");
  assert.ok(workbook.size >= miniStreamCutoff, "unexpected mini-stream workbook");
  const workbookChain = getChain(workbook.start);
  const workbookBytes = joinSectors(workbookChain).subarray(0, workbook.size);
  const workbookView = new DataView(workbookBytes.buffer, workbookBytes.byteOffset, workbookBytes.byteLength);
  const records = [];
  for (let offset = 0; offset + 4 <= workbookBytes.length;) {
    const id = workbookView.getUint16(offset, true);
    const length = workbookView.getUint16(offset + 2, true);
    if (offset + 4 + length > workbookBytes.length) break;
    records.push({ id, length, offset, payload: offset + 4 });
    offset += 4 + length;
  }
  assert.ok(!records.some(record => record.id === 0x003c), "unexpected SST CONTINUE record");
  const sstRecord = records.find(record => record.id === 0x00fc);
  assert.ok(sstRecord && sstRecord.length >= 8, "shared string table missing");
  const sharedStrings = [];
  let cursor = sstRecord.payload + 8;
  const sstEnd = sstRecord.payload + sstRecord.length;
  while (cursor + 3 <= sstEnd) {
    const count = workbookView.getUint16(cursor, true); cursor += 2;
    const flags = workbookBytes[cursor++];
    const wide = !!(flags & 1), rich = !!(flags & 8), extended = !!(flags & 4);
    const runs = rich ? workbookView.getUint16(cursor, true) : 0;
    if (rich) cursor += 2;
    const extensionLength = extended ? workbookView.getUint32(cursor, true) : 0;
    if (extended) cursor += 4;
    const textBytes = count * (wide ? 2 : 1);
    if (cursor + textBytes > sstEnd) break;
    let value = "";
    for (let i = 0; i < count; i++) value += String.fromCharCode(wide
      ? workbookView.getUint16(cursor + i * 2, true) : workbookBytes[cursor + i]);
    cursor += textBytes + runs * 4 + extensionLength;
    sharedStrings.push(value);
  }
  const sheetRecords = records.filter(record => record.id === 0x0085);
  const sheets = sheetRecords.map(record => ({
    offset: workbookView.getUint32(record.payload, true),
    visibility: workbookBytes[record.payload + 4],
    type: workbookBytes[record.payload + 5]
  }));
  assert.equal(sheets.length, 1, "expected exactly one worksheet");
  assert.equal(sheets[0].visibility, 0, "worksheet must be visible");
  const workbookProtectionRecord = records.find(record => record.id === 0x0012 && record.offset < sheets[0].offset);
  const workbookPasswordRecord = records.find(record => record.id === 0x0013 && record.offset < sheets[0].offset);
  const workbookProtectionFlag = workbookProtectionRecord ? workbookView.getUint16(workbookProtectionRecord.payload, true) : null;
  const workbookPasswordHash = workbookPasswordRecord ? workbookView.getUint16(workbookPasswordRecord.payload, true) : null;
  const sheetRecordsOnly = records.filter(record => record.offset >= sheets[0].offset);
  const cells = new Map();
  const merges = [];
  let dimension = null, formulaCount = 0, protectionFlag = null, passwordHash = null, validations = 0;
  const colName = index => {
    let name = "";
    while (index >= 0) { name = String.fromCharCode(index % 26 + 65) + name; index = Math.floor(index / 26) - 1; }
    return name;
  };
  const setCell = (row, column, value, type) => cells.set(colName(column) + (row + 1), { value, type });
  const decodeRK = rk => {
    let value;
    if (rk & 2) value = rk >> 2;
    else {
      const buffer = new ArrayBuffer(8), numberView = new DataView(buffer);
      numberView.setUint32(4, rk & 0xfffffffc, true);
      value = numberView.getFloat64(0, true);
    }
    return rk & 1 ? value / 100 : value;
  };
  for (const record of sheetRecordsOnly) {
    const q = record.payload, length = record.length, id = record.id;
    if (id === 0x0200 && length >= 12) dimension = {
      firstRow: workbookView.getUint32(q, true), lastRowExclusive: workbookView.getUint32(q + 4, true),
      firstColumn: workbookView.getUint16(q + 8, true), lastColumnExclusive: workbookView.getUint16(q + 10, true)
    };
    if (id === 0x00e5 && length >= 2) {
      const count = workbookView.getUint16(q, true);
      for (let i = 0; i < count; i++) {
        const offset = q + 2 + i * 8;
        const firstRow = workbookView.getUint16(offset, true), lastRow = workbookView.getUint16(offset + 2, true);
        const firstColumn = workbookView.getUint16(offset + 4, true), lastColumn = workbookView.getUint16(offset + 6, true);
        merges.push(colName(firstColumn) + (firstRow + 1) + ":" + colName(lastColumn) + (lastRow + 1));
      }
    }
    if (id === 0x0012 && length >= 2) protectionFlag = workbookView.getUint16(q, true);
    if (id === 0x0013 && length >= 2) passwordHash = workbookView.getUint16(q, true);
    if (id === 0x01b2 || id === 0x01be) validations++;
    if (id === 0x0006) formulaCount++;
    if (id === 0x00fd && length >= 10) {
      const row = workbookView.getUint16(q, true), column = workbookView.getUint16(q + 2, true);
      const index = workbookView.getUint32(q + 6, true);
      setCell(row, column, sharedStrings[index], "string");
    } else if (id === 0x0204 && length >= 8) {
      const row = workbookView.getUint16(q, true), column = workbookView.getUint16(q + 2, true);
      const count = workbookView.getUint16(q + 6, true), wide = !!(workbookBytes[q + 8] & 1);
      let value = "";
      for (let i = 0; i < count; i++) value += String.fromCharCode(wide
        ? workbookView.getUint16(q + 9 + i * 2, true) : workbookBytes[q + 9 + i]);
      setCell(row, column, value, "string");
    } else if (id === 0x0203 && length >= 14) {
      setCell(workbookView.getUint16(q, true), workbookView.getUint16(q + 2, true),
        workbookView.getFloat64(q + 6, true), "number");
    } else if (id === 0x027e && length >= 10) {
      setCell(workbookView.getUint16(q, true), workbookView.getUint16(q + 2, true),
        decodeRK(workbookView.getUint32(q + 6, true)), "number");
    } else if (id === 0x00bd && length >= 12) {
      const row = workbookView.getUint16(q, true), firstColumn = workbookView.getUint16(q + 2, true);
      const lastColumn = workbookView.getUint16(q + length - 2, true);
      const count = (length - 6) / 6;
      assert.equal(firstColumn + count - 1, lastColumn, "invalid MULRK column bounds");
      for (let i = 0; i < count; i++) {
        const offset = q + 4 + i * 6;
        setCell(row, firstColumn + i, decodeRK(workbookView.getUint32(offset + 2, true)), "number");
      }
    }
  }
  const get = address => cells.get(address)?.value;
  return { bytes: bytes.length, workbookSize: workbook.size, allocatedWorkbookBytes: workbookChain.length * sectorSize,
    dimension, sheets, merges, formulaCount, workbookProtectionFlag, workbookPasswordHash,
    sheetProtectionFlag: protectionFlag, sheetPasswordHash: passwordHash, validations,
    cells, get };
}

const expectedMerges = ["A1:I1", "A2:I2", "A3:I3", "A4:I4", "A5:I5", "A30:I30", "A31:I31",
  "A6:A7", "B6:B7", "C6:C7", "D6:E6", "F6:G6", "H6:H7"];
const signatures = [];
for (const template of manifest.templates) {
  const filePath = path.join(root, "docs/architecture/Plantillas/SACE", template.fileName);
  const bytes = fs.readFileSync(filePath);
  const gitBlobSha = crypto.createHash("sha1")
    .update(Buffer.from("blob " + bytes.length + "\0"))
    .update(bytes).digest("hex");
  assert.equal(gitBlobSha, template.gitBlobSha, "template content changed: " + template.templateCode);
  const book = readWorkbook(filePath);
  assert.deepEqual(book.dimension, { firstRow: 0, lastRowExclusive: 31, firstColumn: 0, lastColumnExclusive: 9 });
  assert.deepEqual([...book.merges].sort(), [...expectedMerges].sort());
  assert.equal(book.formulaCount, 0, "worksheet formula count changed: " + template.templateCode);
  assert.equal(book.validations, 0, "data validation records changed: " + template.templateCode);
  assert.equal(book.workbookProtectionFlag, 0, "workbook structure protection changed: " + template.templateCode);
  assert.equal(book.workbookPasswordHash, 0, "unexpected workbook password hash: " + template.templateCode);
  assert.equal(book.sheetProtectionFlag, null, "unexpected worksheet protection record: " + template.templateCode);
  assert.equal(book.sheetPasswordHash, null, "unexpected worksheet password record: " + template.templateCode);
  assert.ok(book.allocatedWorkbookBytes >= book.workbookSize);
  assert.match(String(book.get("A2")), /BACHILLERATO TÉCNICO PROFESIONAL/);
  assert.match(String(book.get("A3")), /ONCEAVO GRADO SECCIÓN 1/);
  assert.match(String(book.get("A4")), /JORNADA/);
  assert.equal(String(book.get("A5")).trim(), template.subject);
  assert.equal(book.get("A6"), "DOCUMENTO");
  assert.equal(book.get("B6"), "IDENTIDAD");
  assert.equal(book.get("C6"), "NOMBRE");
  assert.equal(book.get("D6"), "PARCIAL I");
  assert.equal(book.get("F6"), "PARCIAL II");
  assert.equal(book.get("H6"), "RECUPERACIÓN");
  assert.equal(book.get("D7"), "INASISTENCIAS");
  assert.equal(book.get("E7"), "NOTA TOTAL");
  assert.equal(book.get("F7"), "INASISTENCIAS");
  assert.equal(book.get("G7"), "NOTA TOTAL");
  assert.ok(String(book.get("A30") || "").trim().length > 0);
  assert.ok(String(book.get("A31") || "").trim().length > 0);
  for (let row = 8; row <= 29; row++) {
    assert.ok(String(book.get("A" + row) || "").trim(), "missing student document marker at row " + row);
    assert.ok(String(book.get("B" + row) || "").trim(), "missing identity cell at row " + row);
    assert.ok(String(book.get("C" + row) || "").trim(), "missing student name cell at row " + row);
    for (const column of ["D", "E", "F", "G"]) {
      assert.ok(Number.isFinite(Number(book.get(column + row))), "missing numeric cell " + column + row);
    }
    const recovery = book.get("H" + row);
    assert.ok(recovery === undefined || Number.isFinite(Number(recovery)), "invalid recovery cell H" + row);
  }
  signatures.push(signature);
}
assert.equal(new Set(signatures).size, 1, "SACE templates do not share the registered layout");
process.stdout.write("sace-template-structure-contract: PASS (3 BIFF8 templates; no personal data emitted)\n");
