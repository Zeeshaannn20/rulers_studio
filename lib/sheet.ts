// Sends website leads to the "Website Sales Call" Google Sheet through a small Google Apps Script
// web app (see apps-script/RulersLeads.gs). Set in .env.local / host settings:
//   SHEETS_WEBHOOK_URL  — the Apps Script web-app URL (…/macros/s/…/exec)
//   SHEETS_SECRET       — the same secret word written in the script
// If it isn't set, or Google is slow, the visitor's submission still succeeds — we only log the problem.
export async function sendToSheet(
  type: "enquiry" | "meet" | "application",
  data: Record<string, string | number | null | undefined>,
  opts: { url?: string; timeoutMs?: number } = {},
): Promise<boolean | null> {
  const url = opts.url ?? process.env.SHEETS_WEBHOOK_URL;
  if (!url) {
    console.log(`[sheet] web-app URL not set — ${type} not sent to the sheet`);
    return null;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: process.env.SHEETS_SECRET || "", type, ...data }),
      signal: ctrl.signal,
      redirect: "follow",
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("[sheet] failed", res.status, text.slice(0, 300));
      return false;
    }
    try {
      const j = JSON.parse(text);
      if (j && j.ok === false) {
        console.error("[sheet] script said:", j.error);
        return false;
      }
    } catch {
      /* non-JSON reply — treat a 200 as delivered */
    }
    return true;
  } catch (e) {
    console.error("[sheet] failed", e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
