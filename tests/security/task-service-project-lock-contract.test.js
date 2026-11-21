"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/task-service/Code.gs", "utf8");
function extractFunction(name) {
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

function makeHarness(lockAvailable) {
  const calls = { attempts: 0, releases: 0, folders: 0, creates: 0, trashes: 0, deletes: 0 };
  const rows = [
    ["UserId", "NombreArchivo", "archivoUrl", "codigo", "editor"],
    ["STU-1", "Proyecto.psc", "https://drive.google.com/uc?id=FILE-1", "print(1)", "Editor"]
  ];
  const file = {
    trashed: false,
    getId: () => "FILE-1",
    setContent: value => { file.content = value; },
    isTrashed: () => file.trashed,
    setTrashed: value => { file.trashed = value; calls.trashes++; },
    getLastUpdated: () => new Date("2026-11-21T12:00:00Z")
  };
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    getRange: (row, col) => ({ setValue: value => { rows[row - 1][col - 1] = value; } }),
    appendRow: row => rows.push(row.slice()),
    deleteRow: row => { rows.splice(row - 1, 1); calls.deletes++; }
  };
  const folder = {
    getFilesByName: () => ({ hasNext: () => false, next: () => null }),
    createFile: () => { calls.creates++; return file; }
  };
  const lock = {
    tryLock: () => { calls.attempts++; return lockAvailable; },
    releaseLock: () => { calls.releases++; }
  };
  const ss = { getSheetByName: name => name === "pseudocode" ? sheet : null };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    LockService: { getScriptLock: () => lock },
    SpreadsheetApp: { openById: () => ss },
    getStudentFolder: () => { calls.folders++; return folder; },
    getOrCreateFolder: () => folder,
    getOrCreateSheet: () => sheet,
    getSheetOrThrow: () => sheet,
    DriveApp: { getFileById: () => file },
    extractTaskServiceFileId: value => String(value || "").match(/FILE-1/) ? "FILE-1" : String(value || ""),
    getTaskServiceUserProfile: () => ({ nombre: "Estudiante Uno" }),
    logDebug: () => {},
    Date, String, Number, Object, Array, JSON
  };
  vm.createContext(runtime);
  const names = ["saveProject", "deleteProject", "loadProject", "getAllStudentProjects"];
  vm.runInContext(names.map(extractFunction).join("\n") +
    "\nthis.save=saveProject;this.remove=deleteProject;this.load=loadProject;this.list=getAllStudentProjects;", runtime);
  return { runtime, calls, rows, file };
}
const actor = { _verifiedUserId: "STU-1", _verifiedRole: "Estudiante" };

const save = makeHarness(true);
assert.equal(save.runtime.save(Object.assign({}, actor, { fileName: "Nuevo", code: "print(2)" })).status, "success");
assert.equal(save.calls.attempts, 1);
assert.equal(save.calls.releases, 1);
assert.equal(save.calls.folders, 1);

const saveBusy = makeHarness(false);
assert.throws(() => saveBusy.runtime.save(Object.assign({}, actor, { fileName: "Nuevo", code: "print(2)" })), /TASK_PROJECT_LOCK_TIMEOUT/);
assert.equal(saveBusy.calls.folders, 0);
assert.equal(saveBusy.calls.releases, 0);

const remove = makeHarness(true);
assert.equal(remove.runtime.remove(Object.assign({}, actor, { fileId: "FILE-1" })).status, "success");
assert.equal(remove.file.trashed, true);
assert.equal(remove.calls.deletes, 1);
assert.equal(remove.calls.releases, 1);

const removeBusy = makeHarness(false);
assert.throws(() => removeBusy.runtime.remove(Object.assign({}, actor, { fileId: "FILE-1" })), /TASK_PROJECT_LOCK_TIMEOUT/);
assert.equal(removeBusy.file.trashed, false);
assert.equal(removeBusy.calls.deletes, 0);

const read = makeHarness(true);
assert.equal(read.runtime.load(Object.assign({}, actor, { fileId: "FILE-1" })).status, "success");
assert.equal(read.runtime.list(actor).status, "success");
assert.equal(read.calls.attempts, 2);
assert.equal(read.calls.releases, 2);

console.log("task-service-project-lock: all assertions passed");
