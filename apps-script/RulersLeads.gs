/**
 * Rulers Studio — website leads → Google Sheet ("Website Sales Call")
 *
 * Paste this whole file into the sheet: Extensions → Apps Script → replace everything in Code.gs → Save.
 * Then: Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * Copy the Web app URL (…/exec) into the website's .env.local as SHEETS_WEBHOOK_URL.
 */

// Must match SHEETS_SECRET in the website's .env.local (stops strangers writing to your sheet).
const SECRET = "PASTE_YOUR_SHEETS_SECRET_HERE";
const TZ = "Asia/Kolkata";
const STATUSES = ["New", "Contacted", "In talks", "Proposal sent", "Won", "Lost"];

const TABS = {
  enquiry: {
    name: "Enquiries",
    headers: ["Date & time (IST)", "Name", "Mobile", "Email", "Requirements", "Project details", "Budget", "Sent from page", "Status", "Follow-up notes"],
    widths: [160, 170, 140, 220, 280, 320, 150, 140, 130, 280],
    row: (d) => [new Date(), d.name, d.mobile, d.email, d.requirements, d.details, d.budget, d.page],
    bold: ["Name", "Requirements", "Budget"],
  },
  meet: {
    name: "Strategy Meets (paid)",
    headers: ["Date & time (IST)", "Amount (₹)", "Mobile", "Email", "Paid via", "Razorpay payment ID", "Razorpay order ID", "Status", "Follow-up notes"],
    widths: [160, 110, 150, 230, 170, 220, 220, 130, 300],
    row: (d) => [new Date(), Number(d.amount) || 99, d.mobile, d.email, d.method, d.paymentId, d.orderId],
    bold: ["Amount (₹)", "Mobile"],
  },
};

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (d.secret !== SECRET) return out({ ok: false, error: "unauthorised" });
    const tab = TABS[d.type];
    if (!tab) return out({ ok: false, error: "unknown type" });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sh = ensureTab(tab);
      const values = tab.row(d).map(clean);
      const statusCol = tab.headers.indexOf("Status") + 1;
      while (values.length < statusCol - 1) values.push("");
      values.push("New");
      sh.insertRowAfter(1); // newest lead always on top, right under the headers
      sh.getRange(2, 1, 1, values.length).setValues([values]);
      styleRows(sh, tab, 2, 1);
    } finally {
      lock.releaseLock();
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Run once from the editor (select "setup" → Run) to build both tabs, or let the first lead do it.
function setup() {
  Object.keys(TABS).forEach((k) => ensureTab(TABS[k]));
  const first = SpreadsheetApp.getActive().getSheetByName("Sheet1");
  if (first && first.getLastRow() === 0 && SpreadsheetApp.getActive().getSheets().length > 1) SpreadsheetApp.getActive().deleteSheet(first);
}

function ensureTab(tab) {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  let sh = ss.getSheetByName(tab.name);
  if (sh && sh.getRange(1, 1).getValue() === tab.headers[0]) {
    // add any column that was introduced later (e.g. "Email") in its right place
    tab.headers.forEach((h, i) => {
      const current = sh.getRange(1, i + 1).getValue();
      if (current !== h) {
        sh.insertColumnBefore(i + 1);
        sh.getRange(1, i + 1).setValue(h).setFontWeight("bold").setFontColor("#d8ff00").setBackground("#0b0b0b").setFontFamily("Inter");
        if (tab.widths[i]) sh.setColumnWidth(i + 1, tab.widths[i]);
        if (sh.getMaxRows() > 1) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setBackground(null).setFontColor("#000000").setFontWeight("normal").setDataValidation(null);
      }
    });
    return sh;
  }
  if (!sh) sh = ss.insertSheet(tab.name);

  const n = tab.headers.length;
  sh.getRange(1, 1, 1, n).setValues([tab.headers])
    .setFontWeight("bold").setFontColor("#d8ff00").setBackground("#0b0b0b")
    .setVerticalAlignment("middle").setFontFamily("Inter");
  sh.setRowHeight(1, 38);
  sh.setFrozenRows(1);
  tab.widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, 1, sh.getMaxRows() - 1, n).setWrap(true).setVerticalAlignment("top").setFontFamily("Inter");
  sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat("dd mmm yyyy, h:mm am/pm");

  // Status dropdown, so the team can track each lead
  const statusCol = tab.headers.indexOf("Status") + 1;
  const statusRange = sh.getRange(2, statusCol, sh.getMaxRows() - 1, 1);
  statusRange.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  sh.setConditionalFormatRules([]); // no colours outside the header

  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, sh.getMaxRows(), n).createFilter();
  return sh;
}

// Plain rows: white background, black text, only key columns in bold (a new row would
// otherwise copy the black header style).
function styleRows(sh, tab, fromRow, count) {
  const n = tab.headers.length;
  const r = sh.getRange(fromRow, 1, count, n);
  r.setBackground(null).setFontColor("#000000").setFontWeight("normal").setFontFamily("Inter")
    .setWrap(true).setVerticalAlignment("top");
  sh.getRange(fromRow, 1, count, 1).setNumberFormat("dd mmm yyyy, h:mm am/pm");
  (tab.bold || []).forEach((h) => {
    const c = tab.headers.indexOf(h) + 1;
    if (c > 0) sh.getRange(fromRow, c, count, 1).setFontWeight("bold");
  });
}

// Run once (select "restyle" → Run) to clean up rows that came in before this update.
function restyle() {
  Object.keys(TABS).forEach((k) => {
    const tab = TABS[k];
    const sh = ensureTab(tab);
    sh.setConditionalFormatRules([]);
    const last = Math.max(sh.getLastRow(), 2);
    styleRows(sh, tab, 2, last - 1);
  });
}

function clean(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date || typeof v === "number") return v;
  const s = String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s; // never let a lead's text run as a formula
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
