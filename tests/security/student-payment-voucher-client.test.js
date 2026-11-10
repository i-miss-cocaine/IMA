const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "../../js/student.js"), "utf8");
assert.match(source, /fetchApi\('ACCOUNTING', 'getPaymentVouchers'/, "student finance view must request only the authenticated user's vouchers");
assert.match(source, /fetchApi\('ACCOUNTING', 'getPaymentVoucherFile'/, "file retrieval must use the protected server endpoint");
assert.match(source, /URL\.createObjectURL\(blob\)/, "preview must use a local Blob URL, not a Drive URL");
assert.match(source, /URL\.revokeObjectURL\(voucherPreviewObjectUrl\)/, "preview object URLs must be revoked");
assert.match(source, /tab-financial/, "the financial tab must be wired to the voucher view");
assert.match(source, /showStudentVoucherFile\(voucher\.comprobanteId, action\)/, "file retrieval must be keyed by the server-issued voucher ID");
assert.doesNotMatch(source, /window\.open\(voucher\.comprobanteUrl/, "client must not open the legacy Drive URL directly");

console.log("Student private payment voucher client contract passed.");
