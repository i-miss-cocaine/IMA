"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/task-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/task-service/Code.gs" });

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed " + name);
}

const endpoints = [
  ["initiateResumableUpload", "initiateResumableUploadUnlocked_"],
  ["uploadChunk", "uploadChunkUnlocked_"],
  ["getUploadProgress", "getUploadProgressUnlocked_"],
  ["cancelUploadSession", "cancelUploadSessionUnlocked_"],
  ["reconstructFileParts", "reconstructFilePartsUnlocked_"]
];
for (const [publicName, internalName] of endpoints) {
  const wrapper = extract(publicName);
  assert.match(wrapper, new RegExp("withTaskUploadSessionLock_"));
  assert.match(wrapper, new RegExp(internalName));
  assert.doesNotMatch(wrapper, /LockService\.getScriptLock/);
}
for (const internalName of ["initiateResumableUploadUnlocked_", "uploadChunkUnlocked_"]) {
  const body = extract(internalName);
  assert.match(body, /reconstructFilePartsUnlocked_\(/, "nested completion must reuse the already-held lock");
  assert.doesNotMatch(body, /\breconstructFileParts\s*\(/, "nested completion must not reacquire ScriptLock");
}

const calls = { attempts: 0, releases: 0, operations: 0 };
const context = {
  LockService: { getScriptLock: () => ({
    tryLock: () => { calls.attempts++; return true; },
    releaseLock: () => { calls.releases++; }
  }) }
};
vm.createContext(context);
vm.runInContext(extract("withTaskUploadSessionLock_") + "\nthis.run=withTaskUploadSessionLock_;", context);
assert.equal(context.run(() => { calls.operations++; return "ok"; }), "ok");
assert.deepEqual(calls, { attempts: 1, releases: 1, operations: 1 });
assert.throws(() => context.run(() => { throw new Error("operation failed"); }), /operation failed/);
assert.equal(calls.releases, 2, "lock must be released when an operation throws");

let lockHeld = false, overlappingOperations = 0;
const interleavingContext = {
  LockService: { getScriptLock: () => ({
    tryLock: () => { if (lockHeld) return false; lockHeld = true; return true; },
    releaseLock: () => { lockHeld = false; }
  }) }
};
vm.createContext(interleavingContext);
vm.runInContext(extract("withTaskUploadSessionLock_") + "\nthis.run=withTaskUploadSessionLock_;", interleavingContext);
const outerResult = interleavingContext.run(() => {
  overlappingOperations++;
  assert.throws(() => interleavingContext.run(() => { overlappingOperations++; }), /TASK_UPLOAD_SESSION_LOCK_TIMEOUT/,
    "a concurrent request must not mutate the same upload state while the first holds the lock");
  return "serialized";
});
assert.equal(outerResult, "serialized");
assert.equal(overlappingOperations, 1);
assert.equal(lockHeld, false, "outer request must release the lock after the overlapping request is rejected");

const busyContext = {
  LockService: { getScriptLock: () => ({
    tryLock: () => false,
    releaseLock: () => { throw new Error("must not release an unacquired lock"); }
  }) }
};
vm.createContext(busyContext);
vm.runInContext(extract("withTaskUploadSessionLock_") + "\nthis.run=withTaskUploadSessionLock_;", busyContext);
assert.throws(() => busyContext.run(() => { throw new Error("must not run"); }), /TASK_UPLOAD_SESSION_LOCK_TIMEOUT/);

const finderContext = {};
vm.createContext(finderContext);
vm.runInContext(extract("findTaskServiceUploadSession") + "\nthis.find=findTaskServiceUploadSession;", finderContext);
const duplicateSheet = { getDataRange: () => ({ getValues: () => [
  ["SessionKey", "UserId"], ["S-1", "U-1"], ["S-1", "U-1"]
] }) };
assert.throws(() => finderContext.find(duplicateSheet, "S-1"), /UPLOAD_SESSION_AMBIGUOUS/);
const uniqueSheet = { getDataRange: () => ({ getValues: () => [
  ["SessionKey", "UserId"], ["S-1", "U-1"]
] }) };
assert.equal(finderContext.find(uniqueSheet, "S-1").rowIndex, 2);
assert.equal(finderContext.find(uniqueSheet, "MISSING"), null);

function uploadHarness(duplicateSession) {
  const calls = { lockAttempts: 0, releases: 0, createdFiles: 0, writes: 0 };
  const header = ["SessionKey","UserId","FileName","FileSize","TotalChunks","ConfirmedChunks","Status","FolderId","OldSessionKey","CreatedFilesJson","CreatedAt","UpdatedAt","TareaID","FinalFileID","OwnerRole","FileHash","MimeType"];
  const row = ["S-1","STU-1","lesson.pdf",2,2,"[]","ACTIVE","FOLDER-1","","[]","created","updated","TASK-1","","Estudiante","","application/pdf"];
  const rows = [header, row];
  if (duplicateSession) rows.push(row.slice());
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(value => value.slice()) }),
    getRange: (r, col) => ({ setValue: value => { rows[r - 1][col - 1] = value; calls.writes++; } })
  };
  const folder = {
    createFile: blob => {
      calls.createdFiles++;
      return { getId: () => "CHUNK-" + calls.createdFiles, blob };
    }
  };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    LockService: { getScriptLock: () => ({
      tryLock: () => { calls.lockAttempts++; return true; },
      releaseLock: () => { calls.releases++; }
    }) },
    SpreadsheetApp: { openById: () => ({}) },
    getOrCreateSheet: (_ss, name) => { assert.equal(name, "SesionesCargaResumible"); return sheet; },
    findTaskServiceUploadSession: undefined,
    DriveApp: { getFolderById: id => { assert.equal(id, "FOLDER-1"); return folder; } },
    Utilities: {
      base64Decode: value => Buffer.from(value, "base64"),
      newBlob: (bytes, mimeType, name) => ({ bytes: Buffer.from(bytes), mimeType, name })
    },
    Date, String, Number, Object, Array, JSON, Error
  };
  vm.createContext(runtime);
  vm.runInContext([
    extract("withTaskUploadSessionLock_"),
    extract("findTaskServiceUploadSession"),
    extract("assertTaskServiceUploadSessionOwner"),
    extract("uploadChunkUnlocked_"),
    extract("uploadChunk")
  ].join("\n") + "\nthis.run=uploadChunk;", runtime);
  return { run: runtime.run, rows, calls };
}
const resumable = uploadHarness(false);
const firstChunk = resumable.run({
  _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  sessionKey: "S-1", chunkIndex: 0, totalChunks: 2, chunkData: "YQ=="
});
assert.equal(firstChunk.status, "success");
assert.deepEqual(Array.from(firstChunk.confirmedChunks), [0]);
assert.equal(resumable.calls.createdFiles, 1);
const retryChunk = resumable.run({
  _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  sessionKey: "S-1", chunkIndex: 0, totalChunks: 2, chunkData: "YQ=="
});
assert.deepEqual(Array.from(retryChunk.confirmedChunks), [0]);
assert.equal(resumable.calls.createdFiles, 1, "retries of an existing chunk index must not create duplicate Drive files");
assert.equal(resumable.calls.lockAttempts, 2);
assert.equal(resumable.calls.releases, 2);
const ambiguousUpload = uploadHarness(true);
assert.throws(() => ambiguousUpload.run({
  _verifiedUserId: "STU-1", _verifiedRole: "Estudiante",
  sessionKey: "S-1", chunkIndex: 0, totalChunks: 2, chunkData: "YQ=="
}), /UPLOAD_SESSION_AMBIGUOUS/);
assert.equal(ambiguousUpload.calls.createdFiles, 0, "ambiguous session IDs must be rejected before Drive writes");

console.log("task-service-resumable-upload-lock: all assertions passed");
