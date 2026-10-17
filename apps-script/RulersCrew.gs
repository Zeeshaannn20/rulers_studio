/**
 * Rulers Studio — Join the Crew applications → Google Sheet
 *
 * 1. Open the "Join the Crew" sheet → Extensions → Apps Script → replace everything in Code.gs with this file → Save.
 * 2. Pick "setup" in the function menu → Run → allow access (it needs Sheets + Drive, to store CVs).
 * 3. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * 4. Copy the Web app URL (…/exec) into the website's .env.local as CREW_SHEET_URL.
 *
 * CVs are saved in your Google Drive in the folder below; the sheet links to each one.
 */

// Must match SHEETS_SECRET in the website's .env.local.
const SECRET = "PASTE_YOUR_SHEETS_SECRET_HERE";
const TZ = "Asia/Kolkata";
const CV_FOLDER = "Rulers Studio — Job applications (CVs)";
const STATUSES = ["New", "Shortlisted", "Interview", "Assignment sent", "Hired", "Rejected"];
const MIME = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const TAB = {
  name: "Applications",
  headers: ["Date & time (IST)", "Role", "Name", "Phone", "Email", "Experience", "Current CTC", "Expected CTC", "CV", "Portfolio", "Status", "Notes"],
  widths: [160, 150, 170, 140, 220, 140, 130, 130, 200, 260, 140, 280],
  bold: ["Role", "Name"],
};

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (d.secret !== SECRET) return out({ ok: false, error: "unauthorised" });
    if (d.type !== "application") return out({ ok: false, error: "unknown type" });

    // save the CV to Drive first
    let cvUrl = "";
    let cvLabel = "";
    if (d.cv && MIME.indexOf(d.cvType) !== -1) {
      const bytes = Utilities.base64Decode(d.cv);
      if (bytes.length > 5 * 1024 * 1024) return out({ ok: false, error: "cv too large" });
      const ext = d.cvType === MIME[0] ? ".pdf" : d.cvType === MIME[1] ? ".doc" : ".docx";
      const stamp = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH-mm");
      const fileName = [d.name, d.role, stamp].map(safe).join(" — ") + ext;
      const file = cvFolder().createFile(Utilities.newBlob(bytes, d.cvType, fileName));
      file.setDescription("Applied for " + d.role + " · " + d.email + " · original file: " + (d.cvName || ""));
      cvUrl = file.getUrl();
      cvLabel = "Open CV (" + ext.slice(1).toUpperCase() + ")";
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const sh = ensureTab();
      const values = [new Date(), d.role, d.name, d.phone, d.email, d.experience, d.currentCtc, d.expectedCtc, "", d.portfolio, "New", ""].map(clean);
      sh.insertRowAfter(1); // newest application on top
      sh.getRange(2, 1, 1, values.length).setValues([values]);
      if (cvUrl) {
        sh.getRange(2, TAB.headers.indexOf("CV") + 1).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(cvLabel).setLinkUrl(cvUrl).build());
      }
      styleRows(sh, 2, 1);
    } finally {
      lock.releaseLock();
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Run once from the editor to build the tab and the CV folder (and to grant Drive access).
function setup() {
  ensureTab();
  cvFolder();
  const ss = SpreadsheetApp.getActive();
  const first = ss.getSheetByName("Sheet1");
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
}

function cvFolder() {
  const it = DriveApp.getFoldersByName(CV_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CV_FOLDER);
}

function ensureTab() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  let sh = ss.getSheetByName(TAB.name);
  if (sh && sh.getRange(1, 1).getValue() === TAB.headers[0]) return sh;
  if (!sh) sh = ss.insertSheet(TAB.name, 0);

  const n = TAB.headers.length;
  sh.getRange(1, 1, 1, n).setValues([TAB.headers])
    .setFontWeight("bold").setFontColor("#d8ff00").setBackground("#0b0b0b")
    .setVerticalAlignment("middle").setFontFamily("Inter");
  sh.setRowHeight(1, 38);
  sh.setFrozenRows(1);
  TAB.widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, 1, sh.getMaxRows() - 1, n).setWrap(true).setVerticalAlignment("top").setFontFamily("Inter");
  sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat("dd mmm yyyy, h:mm am/pm");

  const statusCol = TAB.headers.indexOf("Status") + 1;
  sh.getRange(2, statusCol, sh.getMaxRows() - 1, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  sh.setConditionalFormatRules([]);

  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, sh.getMaxRows(), n).createFilter();
  return sh;
}

// Plain rows: white background, black text, Role and Name in bold.
function styleRows(sh, fromRow, count) {
  const n = TAB.headers.length;
  sh.getRange(fromRow, 1, count, n).setBackground(null).setFontColor("#000000").setFontWeight("normal")
    .setFontFamily("Inter").setWrap(true).setVerticalAlignment("top");
  sh.getRange(fromRow, 1, count, 1).setNumberFormat("dd mmm yyyy, h:mm am/pm");
  TAB.bold.forEach((h) => sh.getRange(fromRow, TAB.headers.indexOf(h) + 1, count, 1).setFontWeight("bold"));
}

function safe(v) {
  return String(v || "").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60);
}

function clean(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date || typeof v === "number") return v;
  const s = String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s; // never let an applicant's text run as a formula
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
