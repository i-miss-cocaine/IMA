(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SACETemplateTools = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this), function () {
  "use strict";

  const EXPECTED_MERGES = ["A1:I1", "A2:I2", "A3:I3", "A4:I4", "A5:I5", "A30:I30", "A31:I31",
    "A6:A7", "B6:B7", "C6:C7", "D6:E6", "F6:G6", "H6:H7"];
  const STUDENT_FIRST_ROW = 8;
  const STUDENT_LAST_ROW = 29;
  const STUDENT_COUNT = STUDENT_LAST_ROW - STUDENT_FIRST_ROW + 1;

  function toBytes(input) {
    if (input instanceof Uint8Array) return new Uint8Array(input);
    if (input instanceof ArrayBuffer) return new Uint8Array(input.slice(0));
    if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
    throw new Error("SACE_FILE_BYTES_REQUIRED");
  }
  function concat(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    parts.forEach(part => { output.set(part, offset); offset += part.length; });
    return output;
  }
  function colName(index) {
    let name = "";
    while (index >= 0) { name = String.fromCharCode(index % 26 + 65) + name; index = Math.floor(index / 26) - 1; }
    return name;
  }
  function decodeRK(rk) {
    let value;
    if (rk & 2) value = rk >> 2;
    else {
      const buffer = new ArrayBuffer(8), view = new DataView(buffer);
      view.setUint32(4, rk & 0xfffffffc, true);
      value = view.getFloat64(0, true);
    }
    return rk & 1 ? value / 100 : value;
  }
  function encodeRK(value, precision) {
    const scale = Math.pow(10, precision);
    const scaled = Math.round(value * scale);
    if (Math.abs(scaled / scale - value) > 1e-8) throw new Error("SACE_GRADE_PRECISION_UNSUPPORTED");
    if (scaled < -536870912 || scaled > 536870911) throw new Error("SACE_GRADE_VALUE_OUT_OF_RANGE");
    const flags = precision === 2 ? 3 : 2;
    return ((scaled << 2) | flags) >>> 0;
  }
  function isBlankValue(value) {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
  }
  function isNumericValue(value) {
    return (typeof value === "number" && Number.isFinite(value)) ||
      (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));
  }
  function parseCompound(input) {
    const bytes = toBytes(input);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const u16 = offset => view.getUint16(offset, true);
    const u32 = offset => view.getUint32(offset, true);
    const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    if (!signature.every((value, index) => bytes[index] === value)) throw new Error("SACE_OLE_SIGNATURE_INVALID");
    const sectorSize = 1 << u16(30);
    const miniStreamCutoff = u32(56);
    const firstDirectorySector = u32(48);
    const firstDifatSector = u32(68);
    const difatSectorCount = u32(72);
    if (sectorSize !== 512 && sectorSize !== 4096) throw new Error("SACE_OLE_SECTOR_SIZE_UNSUPPORTED");
    const difat = [];
    for (let i = 0; i < 109; i++) {
      const id = u32(76 + i * 4);
      if (id < 0xfffffffa) difat.push(id);
    }
    let difatSector = firstDifatSector;
    for (let i = 0; i < difatSectorCount && difatSector < 0xfffffffa; i++) {
      const offset = (difatSector + 1) * sectorSize;
      if (offset + sectorSize > bytes.length) throw new Error("SACE_OLE_DIFAT_OUT_OF_BOUNDS");
      const sector = new DataView(bytes.buffer, bytes.byteOffset + offset, sectorSize);
      for (let j = 0; j < sectorSize / 4 - 1; j++) {
        const id = sector.getUint32(j * 4, true);
        if (id < 0xfffffffa) difat.push(id);
      }
      difatSector = sector.getUint32(sectorSize - 4, true);
    }
    const fat = [];
    for (const id of difat) {
      const offset = (id + 1) * sectorSize;
      if (offset + sectorSize > bytes.length) throw new Error("SACE_OLE_FAT_OUT_OF_BOUNDS");
      const sector = new DataView(bytes.buffer, bytes.byteOffset + offset, sectorSize);
      for (let i = 0; i < sectorSize / 4; i++) fat.push(sector.getUint32(i * 4, true));
    }
    function getChain(start) {
      const chain = [], seen = new Set();
      let id = start;
      while (id < 0xfffffffa && !seen.has(id) && chain.length < 10000) {
        seen.add(id); chain.push(id); id = fat[id] === undefined ? 0xfffffffe : fat[id];
      }
      if (chain.length >= 10000) throw new Error("SACE_OLE_CHAIN_LIMIT");
      return chain;
    }
    function joinSectors(chain) {
      const output = new Uint8Array(chain.length * sectorSize);
      chain.forEach((id, index) => {
        const start = (id + 1) * sectorSize;
        if (start + sectorSize > bytes.length) throw new Error("SACE_OLE_SECTOR_OUT_OF_BOUNDS");
        output.set(bytes.subarray(start, start + sectorSize), index * sectorSize);
      });
      return output;
    }
    const directoryChain = getChain(firstDirectorySector);
    const directoryBytes = joinSectors(directoryChain);
    const directoryView = new DataView(directoryBytes.buffer, directoryBytes.byteOffset, directoryBytes.byteLength);
    let workbookEntry = null;
    for (let offset = 0; offset + 128 <= directoryBytes.length; offset += 128) {
      const nameLength = directoryView.getUint16(offset + 64, true);
      const type = directoryBytes[offset + 66];
      if (!type || nameLength < 2) continue;
      let name = "";
      for (let i = 0; i < nameLength - 2; i += 2) name += String.fromCharCode(directoryView.getUint16(offset + i, true));
      if (/^(Workbook|Book)$/i.test(name)) {
        workbookEntry = { name, offset, start: directoryView.getUint32(offset + 116, true),
          size: Number(directoryView.getBigUint64(offset + 120, true)) };
        break;
      }
    }
    if (!workbookEntry) throw new Error("SACE_WORKBOOK_STREAM_MISSING");
    if (workbookEntry.size < miniStreamCutoff) throw new Error("SACE_MINI_STREAM_WORKBOOK_UNSUPPORTED");
    const workbookChain = getChain(workbookEntry.start);
    const workbookCapacity = workbookChain.length * sectorSize;
    if (workbookEntry.size > workbookCapacity) throw new Error("SACE_WORKBOOK_STREAM_INVALID_SIZE");
    const workbookBytes = joinSectors(workbookChain).subarray(0, workbookEntry.size);
    const workbookView = new DataView(workbookBytes.buffer, workbookBytes.byteOffset, workbookBytes.byteLength);
    const records = [];
    for (let offset = 0; offset + 4 <= workbookBytes.length;) {
      const id = workbookView.getUint16(offset, true);
      const length = workbookView.getUint16(offset + 2, true);
      if (offset + 4 + length > workbookBytes.length) throw new Error("SACE_BIFF_RECORD_TRUNCATED");
      records.push({ id, length, offset, payload: offset + 4 });
      offset += 4 + length;
    }
    if (records.some(record => record.id === 0x003c)) throw new Error("SACE_SST_CONTINUE_UNSUPPORTED");
    const sstRecord = records.find(record => record.id === 0x00fc);
    if (!sstRecord || sstRecord.length < 8) throw new Error("SACE_SHARED_STRINGS_MISSING");
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
      if (cursor + textBytes > sstEnd) throw new Error("SACE_SHARED_STRING_TRUNCATED");
      let value = "";
      for (let i = 0; i < count; i++) value += String.fromCharCode(wide
        ? workbookView.getUint16(cursor + i * 2, true) : workbookBytes[cursor + i]);
      cursor += textBytes + runs * 4 + extensionLength;
      sharedStrings.push(value);
    }
    const boundSheets = records.filter(record => record.id === 0x0085).map(record => ({
      offset: workbookView.getUint32(record.payload, true),
      visibility: workbookBytes[record.payload + 4],
      type: workbookBytes[record.payload + 5]
    }));
    if (boundSheets.length !== 1 || boundSheets[0].visibility !== 0) throw new Error("SACE_WORKSHEET_LAYOUT_UNSUPPORTED");
    const sheetOffset = boundSheets[0].offset;
    const sheetRecords = records.filter(record => record.offset >= sheetOffset);
    const cells = new Map(), merges = [];
    let dimension = null, formulaCount = 0, validationCount = 0;
    let sheetProtectionFlag = null, sheetPasswordHash = null, recoveryStyle = null;
    function setCell(row, column, value, type, xf) {
      cells.set(colName(column) + (row + 1), { value, type, xf: xf === undefined ? null : xf });
    }
    for (const record of sheetRecords) {
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
      if (id === 0x0012 && length >= 2) sheetProtectionFlag = workbookView.getUint16(q, true);
      if (id === 0x0013 && length >= 2) sheetPasswordHash = workbookView.getUint16(q, true);
      if (id === 0x01b2 || id === 0x01be) validationCount++;
      if (id === 0x0006) formulaCount++;
      if (id === 0x00fd && length >= 10) {
        const row = workbookView.getUint16(q, true), column = workbookView.getUint16(q + 2, true);
        const index = workbookView.getUint32(q + 6, true);
        if (sharedStrings[index] === undefined) throw new Error("SACE_SHARED_STRING_INDEX_INVALID");
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
          workbookView.getFloat64(q + 6, true), "number", workbookView.getUint16(q + 4, true));
      } else if (id === 0x027e && length >= 10) {
        setCell(workbookView.getUint16(q, true), workbookView.getUint16(q + 2, true),
          decodeRK(workbookView.getUint32(q + 6, true)), "number", workbookView.getUint16(q + 4, true));
      } else if (id === 0x00bd && length >= 12) {
        const row = workbookView.getUint16(q, true), firstColumn = workbookView.getUint16(q + 2, true);
        const lastColumn = workbookView.getUint16(q + length - 2, true);
        const count = (length - 6) / 6;
        if (!Number.isInteger(count) || firstColumn + count - 1 !== lastColumn) throw new Error("SACE_MULRK_LAYOUT_INVALID");
        for (let i = 0; i < count; i++) {
          const offset = q + 4 + i * 6, xf = workbookView.getUint16(offset, true);
          const value = decodeRK(workbookView.getUint32(offset + 2, true));
          setCell(row, firstColumn + i, value, "number", xf);
          if (firstColumn + i === 7) recoveryStyle = xf;
        }
      } else if (id === 0x00be && length >= 8) {
        const row = workbookView.getUint16(q, true), firstColumn = workbookView.getUint16(q + 2, true);
        const lastColumn = workbookView.getUint16(q + length - 2, true), count = (length - 6) / 2;
        if (!Number.isInteger(count) || firstColumn + count - 1 !== lastColumn) throw new Error("SACE_MULBLANK_LAYOUT_INVALID");
        for (let i = 0; i < count; i++) {
          const xf = workbookView.getUint16(q + 4 + i * 2, true);
          setCell(row, firstColumn + i, null, "blank", xf);
          if (firstColumn + i === 7) recoveryStyle = xf;
        }
      } else if (id === 0x0201 && length >= 6) {
        setCell(workbookView.getUint16(q, true), workbookView.getUint16(q + 2, true),
          null, "blank", workbookView.getUint16(q + 4, true));
      }
    }
    const workbookProtectRecord = records.find(record => record.id === 0x0012 && record.offset < sheetOffset);
    const workbookPasswordRecord = records.find(record => record.id === 0x0013 && record.offset < sheetOffset);
    const workbookProtectionFlag = workbookProtectRecord ? workbookView.getUint16(workbookProtectRecord.payload, true) : null;
    const workbookPasswordHash = workbookPasswordRecord ? workbookView.getUint16(workbookPasswordRecord.payload, true) : null;
    const get = address => cells.get(address)?.value;
    const students = [];
    for (let row = STUDENT_FIRST_ROW; row <= STUDENT_LAST_ROW; row++) {
      students.push({ rowNumber: row, documentMarker: get("A" + row), identity: get("B" + row), name: get("C" + row) });
    }
    const metadata = { institution: get("A1"), modality: get("A2"), gradeSection: get("A3"),
      schedule: get("A4"), subject: get("A5") };
    const mergeSignature = merges.slice().sort();
    const expected = EXPECTED_MERGES.slice().sort();
    if (!dimension || dimension.firstRow !== 0 || dimension.lastRowExclusive !== 31 ||
        dimension.firstColumn !== 0 || dimension.lastColumnExclusive !== 9) throw new Error("SACE_DIMENSION_MISMATCH");
    if (mergeSignature.length !== expected.length || mergeSignature.some((value, index) => value !== expected[index])) {
      throw new Error("SACE_MERGED_CELLS_MISMATCH");
    }
    if (formulaCount !== 0) throw new Error("SACE_FORMULA_LAYOUT_UNSUPPORTED");
    if (validationCount !== 0) throw new Error("SACE_DATA_VALIDATION_LAYOUT_UNSUPPORTED");
    if (sheetProtectionFlag !== null || sheetPasswordHash !== null) throw new Error("SACE_SHEET_PROTECTION_LAYOUT_UNSUPPORTED");
    if (get("A6") !== "DOCUMENTO" || get("B6") !== "IDENTIDAD" || get("C6") !== "NOMBRE" ||
        get("D6") !== "PARCIAL I" || get("F6") !== "PARCIAL II" || get("H6") !== "RECUPERACIÓN" ||
        get("D7") !== "INASISTENCIAS" || get("E7") !== "NOTA TOTAL" ||
        get("F7") !== "INASISTENCIAS" || get("G7") !== "NOTA TOTAL") throw new Error("SACE_HEADER_LAYOUT_MISMATCH");
    if (!metadata.institution || !metadata.modality || !metadata.gradeSection || !metadata.schedule || !metadata.subject) {
      throw new Error("SACE_TEMPLATE_METADATA_INCOMPLETE");
    }
    if (students.some(student => !student.documentMarker || !student.identity || !student.name)) {
      throw new Error("SACE_STUDENT_ROSTER_INCOMPLETE");
    }
    return { bytes: bytes.length, sectorSize, workbookSize: workbookEntry.size, workbookCapacity,
      workbookSlack: workbookCapacity - workbookEntry.size, workbookChain, directoryChain,
      directoryEntryOffset: workbookEntry.offset, workbookStream: workbookBytes,
      records, sheetOffset, cells, merges, dimension, formulaCount, validationCount,
      workbookProtectionFlag, workbookPasswordHash, sheetProtectionFlag, sheetPasswordHash,
      recoveryStyle, metadata, students, get };
  }
  function makeRecord(id, payload) {
    const record = new Uint8Array(payload.length + 4), view = new DataView(record.buffer);
    view.setUint16(0, id, true);
    view.setUint16(2, payload.length, true);
    record.set(payload, 4);
    return record;
  }
  function makeRecoveryRecord(row, style, value) {
    if (isBlankValue(value)) {
      const payload = new Uint8Array(6), view = new DataView(payload.buffer);
      view.setUint16(0, row, true); view.setUint16(2, 7, true); view.setUint16(4, style, true);
      return makeRecord(0x0201, payload);
    }
    const payload = new Uint8Array(14), view = new DataView(payload.buffer);
    view.setUint16(0, row, true); view.setUint16(2, 7, true); view.setUint16(4, style, true);
    view.setFloat64(6, Number(value), true);
    return makeRecord(0x0203, payload);
  }
  function writeLogical(fileBytes, chain, sectorSize, logicalOffset, data) {
    for (let i = 0; i < data.length; i++) {
      const logical = logicalOffset + i, chainIndex = Math.floor(logical / sectorSize);
      if (chainIndex >= chain.length) throw new Error("SACE_OLE_STREAM_CAPACITY_EXCEEDED");
      const within = logical % sectorSize;
      const physical = (chain[chainIndex] + 1) * sectorSize + within;
      if (physical >= fileBytes.length) throw new Error("SACE_OLE_WRITE_OUT_OF_BOUNDS");
      fileBytes[physical] = data[i];
    }
  }
  function fill(input, rows, options) {
    const settings = options || {}, scale = settings.scale || {};
    if (!isNumericValue(scale.min) || !isNumericValue(scale.max) ||
        Number(scale.min) >= Number(scale.max)) throw new Error("SACE_SCALE_CONFIGURATION_REQUIRED");
    const precision = Number.isInteger(scale.precision) ? scale.precision : 2;
    if (precision !== 0 && precision !== 2) throw new Error("SACE_SCALE_PRECISION_UNSUPPORTED");
    if (!Array.isArray(rows) || rows.length !== STUDENT_COUNT) throw new Error("SACE_STUDENT_COUNT_MISMATCH");
    rows.forEach((item, index) => {
      ["partial1", "partial2"].forEach(field => {
        const value = item && item[field];
        if (!isNumericValue(value)) {
          throw new Error("SACE_GRADE_VALUE_REQUIRED:row-" + (STUDENT_FIRST_ROW + index) + ":" + field);
        }
        if (Number(value) < Number(scale.min) || Number(value) > Number(scale.max)) {
          throw new Error("SACE_GRADE_VALUE_OUT_OF_RANGE:row-" + (STUDENT_FIRST_ROW + index) + ":" + field);
        }
        encodeRK(Number(value), precision);
      });
      if (!isBlankValue(item.recovery)) {
        if (!isNumericValue(item.recovery) || Number(item.recovery) < Number(scale.min) ||
            Number(item.recovery) > Number(scale.max)) throw new Error("SACE_RECOVERY_VALUE_OUT_OF_RANGE:row-" + (STUDENT_FIRST_ROW + index));
      }
      ["partial1Absences", "partial2Absences"].forEach(field => {
        const value = item && item[field];
        if (isBlankValue(value)) return;
        if (!isNumericValue(value) || !Number.isInteger(Number(value)) || Number(value) < 0) {
          throw new Error("SACE_ABSENCE_VALUE_INVALID:row-" + (STUDENT_FIRST_ROW + index) + ":" + field);
        }
        encodeRK(Number(value), 0);
      });
    });
    const parsed = parseCompound(input);
    if (parsed.workbookProtectionFlag !== 0) throw new Error("SACE_WORKBOOK_PROTECTION_LAYOUT_UNSUPPORTED");
    const rowRecords = new Map(), rowLastRecordIndex = new Map(), replacementsByIndex = new Map();
    const workbookView = new DataView(parsed.workbookStream.buffer, parsed.workbookStream.byteOffset, parsed.workbookStream.byteLength);
    const stream = parsed.workbookStream;
    function getCellRange(record) {
      const q = record.payload, id = record.id;
      if (id === 0x00bd || id === 0x00be) return {
        row: workbookView.getUint16(q, true),
        firstColumn: workbookView.getUint16(q + 2, true),
        lastColumn: workbookView.getUint16(q + record.length - 2, true)
      };
      if ([0x00fd, 0x0204, 0x0203, 0x027e, 0x0201, 0x0006].includes(id)) {
        const row = workbookView.getUint16(q, true), column = workbookView.getUint16(q + 2, true);
        return { row, firstColumn: column, lastColumn: column };
      }
      return null;
    }
    function makeMulBlankRecord(row, firstColumn, styles) {
      const payload = new Uint8Array(4 + styles.length * 2 + 2), view = new DataView(payload.buffer);
      view.setUint16(0, row, true);
      view.setUint16(2, firstColumn, true);
      styles.forEach((style, index) => view.setUint16(4 + index * 2, style, true));
      view.setUint16(payload.length - 2, firstColumn + styles.length - 1, true);
      return makeRecord(0x00be, payload);
    }
    for (let index = 0; index < parsed.records.length; index++) {
      const record = parsed.records[index];
      if (record.offset < parsed.sheetOffset) continue;
      const range = getCellRange(record);
      if (!range || range.row < STUDENT_FIRST_ROW - 1 || range.row > STUDENT_LAST_ROW - 1) continue;
      rowLastRecordIndex.set(range.row, index);
      if (record.id === 0x00bd && range.firstColumn === 3) {
        const count = (record.length - 6) / 6;
        if ((count !== 4 && count !== 5) || range.lastColumn !== 3 + count - 1) {
          throw new Error("SACE_GRADE_ROW_LAYOUT_UNSUPPORTED:" + (range.row + 1));
        }
        if (rowRecords.has(range.row)) throw new Error("SACE_GRADE_ROW_DUPLICATE:" + (range.row + 1));
        rowRecords.set(range.row, { record, index, count });
      } else if (record.id === 0x00be && range.firstColumn <= 7 && range.lastColumn >= 7) {
        const styles = [];
        const count = (record.length - 6) / 2;
        for (let i = 0; i < count; i++) styles.push(workbookView.getUint16(record.payload + 4 + i * 2, true));
        const segments = [];
        let segmentStart = null, segmentStyles = [];
        for (let column = range.firstColumn; column <= range.lastColumn; column++) {
          if (column === 7) {
            if (segmentStyles.length) segments.push(makeMulBlankRecord(range.row, segmentStart, segmentStyles));
            segmentStart = null; segmentStyles = [];
            continue;
          }
          if (segmentStart === null) segmentStart = column;
          segmentStyles.push(styles[column - range.firstColumn]);
        }
        if (segmentStyles.length) segments.push(makeMulBlankRecord(range.row, segmentStart, segmentStyles));
        replacementsByIndex.set(index, segments);
      } else if (range.firstColumn === 7 && range.lastColumn === 7) {
        replacementsByIndex.set(index, []);
      }
    }
    if (rowRecords.size !== STUDENT_COUNT || rowLastRecordIndex.size !== STUDENT_COUNT) {
      throw new Error("SACE_GRADE_ROWS_INCOMPLETE");
    }
    if (!Number.isInteger(parsed.recoveryStyle)) throw new Error("SACE_RECOVERY_STYLE_UNAVAILABLE");
    for (let row = STUDENT_FIRST_ROW - 1; row <= STUDENT_LAST_ROW - 1; row++) {
      const entry = rowRecords.get(row), record = entry.record;
      const newLength = record.length - (entry.count === 5 ? 6 : 0);
      const updated = stream.slice(record.offset, record.offset + 4 + newLength);
      const updatedView = new DataView(updated.buffer, updated.byteOffset, updated.byteLength);
      updatedView.setUint16(2, newLength, true);
      if (entry.count === 5) updatedView.setUint16(4 + newLength - 2, 6, true);
      const firstColumn = 3;
      const partial1AbsencesOffset = 4 + 4 + (3 - firstColumn) * 6 + 2;
      const partial1Offset = 4 + 4 + (4 - firstColumn) * 6 + 2;
      const partial2AbsencesOffset = 4 + 4 + (5 - firstColumn) * 6 + 2;
      const partial2Offset = 4 + 4 + (6 - firstColumn) * 6 + 2;
      const rowValues = rows[row - (STUDENT_FIRST_ROW - 1)];
      if (rowValues.partial1Absences !== null && rowValues.partial1Absences !== undefined && rowValues.partial1Absences !== "") {
        updatedView.setUint32(partial1AbsencesOffset, encodeRK(Number(rowValues.partial1Absences), 0), true);
      }
      updatedView.setUint32(partial1Offset, encodeRK(Number(rowValues.partial1), precision), true);
      if (rowValues.partial2Absences !== null && rowValues.partial2Absences !== undefined && rowValues.partial2Absences !== "") {
        updatedView.setUint32(partial2AbsencesOffset, encodeRK(Number(rowValues.partial2Absences), 0), true);
      }
      updatedView.setUint32(partial2Offset, encodeRK(Number(rowValues.partial2), precision), true);
      replacementsByIndex.set(entry.index, [updated]);
    }
    const recoveryRecords = new Map();
    for (let row = STUDENT_FIRST_ROW - 1; row <= STUDENT_LAST_ROW - 1; row++) {
      recoveryRecords.set(row, makeRecoveryRecord(row, parsed.recoveryStyle, rows[row - (STUDENT_FIRST_ROW - 1)].recovery));
    }
    const parts = [];
    for (let index = 0; index < parsed.records.length; index++) {
      const record = parsed.records[index];
      if (record.offset < parsed.sheetOffset) {
        parts.push(stream.subarray(record.offset, record.offset + 4 + record.length));
        continue;
      }
      if (replacementsByIndex.has(index)) {
        parts.push(...replacementsByIndex.get(index));
      } else {
        parts.push(stream.subarray(record.offset, record.offset + 4 + record.length));
      }
      for (let row = STUDENT_FIRST_ROW - 1; row <= STUDENT_LAST_ROW - 1; row++) {
        if (rowLastRecordIndex.get(row) === index) parts.push(recoveryRecords.get(row));
      }
    }
    const newWorkbookStream = concat(parts);
    if (newWorkbookStream.length > parsed.workbookCapacity) throw new Error("SACE_WORKBOOK_STREAM_CAPACITY_EXCEEDED");
    const output = toBytes(input);
    const originalHeader = Array.from(output.subarray(0, 8));
    writeLogical(output, parsed.workbookChain, parsed.sectorSize, 0, newWorkbookStream);
    const sizeBytes = new Uint8Array(8), sizeView = new DataView(sizeBytes.buffer);
    sizeView.setBigUint64(0, BigInt(newWorkbookStream.length), true);
    writeLogical(output, parsed.directoryChain, parsed.sectorSize, parsed.directoryEntryOffset + 120, sizeBytes);
    if (originalHeader.some((value, index) => output[index] !== value)) {
      throw new Error("SACE_OLE_HEADER_CHANGED:" + Array.from(output.subarray(0, 8)).join(","));
    }
    let verified;
    try { verified = parseCompound(output); }
    catch (error) {
      throw new Error("SACE_VERIFY_PARSE_FAILED:" + Array.from(output.subarray(0, 8)).join(",") + ":" + error.message);
    }
    if (verified.workbookSize !== newWorkbookStream.length ||
        verified.merges.join("|") !== parsed.merges.join("|") ||
        verified.formulaCount !== parsed.formulaCount || verified.validationCount !== parsed.validationCount) {
      throw new Error("SACE_OUTPUT_INTEGRITY_CHECK_FAILED");
    }
    for (let index = 0; index < STUDENT_COUNT; index++) {
      const row = STUDENT_FIRST_ROW + index, expected = rows[index];
      if (Number(verified.get("E" + row)) !== Number(expected.partial1) ||
          Number(verified.get("G" + row)) !== Number(expected.partial2)) {
        throw new Error("SACE_OUTPUT_GRADE_VERIFICATION_FAILED:" + row);
      }
      const actualRecovery = verified.get("H" + row);
      if (isBlankValue(expected.recovery)) {
        if (actualRecovery !== null) throw new Error("SACE_OUTPUT_RECOVERY_NOT_CLEARED:" + row);
      } else if (Number(actualRecovery) !== Number(expected.recovery)) {
        throw new Error("SACE_OUTPUT_RECOVERY_VERIFICATION_FAILED:" + row + ":actual=" + actualRecovery + ":expected=" + expected.recovery);
      }
    }
    return output;
  }
  function normalizeText(value) {
    return String(value == null ? "" : value).normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  }
  function normalizeIdentity(value) {
    return String(value == null ? "" : value).replace(/[\s.-]/g, "").toUpperCase();
  }
  function inspectTemplate(input) {
    const parsed = parseCompound(input);
    const metadata = {
      institution: parsed.get("A1"),
      modality: parsed.get("A2"),
      gradeSection: parsed.get("A3"),
      schedule: parsed.get("A4"),
      subject: parsed.get("A5")
    };
    const students = [];
    for (let row = STUDENT_FIRST_ROW; row <= STUDENT_LAST_ROW; row++) {
      students.push({
        documentMarker: parsed.get("A" + row),
        identity: parsed.get("B" + row),
        name: parsed.get("C" + row)
      });
    }
    return { metadata, students };
  }

  function mapRowsToTemplate(templateInfo, sourceStudents, expectedContext) {
    if (!templateInfo || !Array.isArray(templateInfo.students) ||
        !Array.isArray(sourceStudents) || sourceStudents.length !== templateInfo.students.length) {
      throw new Error("SACE_STUDENT_COUNT_MISMATCH");
    }
    const metadata = templateInfo.metadata || {}, context = expectedContext || {};
    ["institution", "modality", "gradeSection", "schedule", "subject"].forEach(field => {
      if (!normalizeText(metadata[field]) || normalizeText(metadata[field]) !== normalizeText(context[field])) {
        throw new Error("SACE_TEMPLATE_CONTEXT_MISMATCH:" + field);
      }
    });
    const sourceByIdentity = new Map();
    sourceStudents.forEach(student => {
      const identity = normalizeIdentity(student && student.identity);
      if (!identity) throw new Error("SACE_STUDENT_IDENTITY_REQUIRED");
      if (sourceByIdentity.has(identity)) throw new Error("SACE_STUDENT_IDENTITY_DUPLICATE");
      if (!normalizeText(student && student.name)) throw new Error("SACE_STUDENT_NAME_REQUIRED");
      sourceByIdentity.set(identity, student);
    });
    const seenTemplateIdentities = new Set();
    return templateInfo.students.map(student => {
      const identity = normalizeIdentity(student && student.identity);
      if (!identity || seenTemplateIdentities.has(identity)) throw new Error("SACE_TEMPLATE_ROSTER_INVALID");
      seenTemplateIdentities.add(identity);
      const source = sourceByIdentity.get(identity);
      if (!source) throw new Error("SACE_STUDENT_ROSTER_MISMATCH");
      if (normalizeText(student.name) !== normalizeText(source.name)) {
        throw new Error("SACE_STUDENT_NAME_MISMATCH");
      }
      const templateDocumentMarker = normalizeText(student.documentMarker);
      const sourceDocumentMarker = normalizeText(source.documentMarker);
      if (!templateDocumentMarker || !sourceDocumentMarker || templateDocumentMarker !== sourceDocumentMarker) {
        throw new Error("SACE_STUDENT_DOCUMENT_TYPE_MISMATCH");
      }
      return {
        partial1Absences: source.partial1Absences,
        partial1: source.partial1,
        partial2Absences: source.partial2Absences,
        partial2: source.partial2,
        recovery: source.recovery
      };
    });
  }

  return { inspect: parseCompound, inspectTemplate, fill, mapRowsToTemplate, expectedMerges: EXPECTED_MERGES.slice(),
    studentFirstRow: STUDENT_FIRST_ROW, studentLastRow: STUDENT_LAST_ROW };
});
