import { NextResponse } from "next/server";
import { applicationSchema, toFieldErrors, CV_MAX_BYTES, CV_TYPES } from "@/lib/validation";
import { rateLimited } from "@/lib/rateLimit";
import { sendToSheet } from "@/lib/sheet";
import { getRole } from "@/data/roles";

export const maxDuration = 60;

// Join the Crew applications → the "Join the Crew" Google Sheet (apps-script/RulersCrew.gs).
// The CV travels as base64; the script saves it to Google Drive and puts the link in the sheet.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (process.env.NODE_ENV === "production" && rateLimited("apply:" + ip, 5)) {
    return NextResponse.json({ ok: false, error: "Too many applications. Try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: toFieldErrors(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });

  const role = getRole(d.role);
  if (!role) return NextResponse.json({ ok: false, error: "That role isn't open any more." }, { status: 400 });

  // check the CV really is a PDF / Word file under 5 MB
  const cvBad = NextResponse.json({ ok: false, errors: { cv: "Attach your CV: PDF or Word, up to 5 MB." } }, { status: 400 });
  if (!d.cvType || !CV_TYPES.includes(d.cvType)) return cvBad;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(d.cv, "base64");
  } catch {
    return cvBad;
  }
  if (!bytes.length || bytes.length > CV_MAX_BYTES) return cvBad;
  const head = bytes.subarray(0, 4).toString("hex");
  const looksRight = head === "25504446" /* %PDF */ || head === "504b0304" /* docx (zip) */ || head === "d0cf11e0" /* old .doc */;
  if (!looksRight) return cvBad;

  const ok = await sendToSheet(
    "application",
    {
      role: role.title,
      name: d.name,
      phone: "+91 " + d.phone,
      email: d.email.toLowerCase(),
      experience: d.experience,
      currentCtc: d.currentCtc,
      expectedCtc: d.expectedCtc,
      portfolio: d.portfolio,
      cvName: (d.cvName || "cv").replace(/[\\/:*?"<>|]+/g, " ").slice(0, 120),
      cvType: d.cvType,
      cv: d.cv,
    },
    { url: process.env.CREW_SHEET_URL, timeoutMs: 45000 },
  );

  if (ok === false) {
    return NextResponse.json({ ok: false, error: "Couldn't send your application right now. Please try again in a minute." }, { status: 502 });
  }
  if (ok === null) console.log("[apply] CREW_SHEET_URL not set — application received:", { ...d, cv: `${bytes.length} bytes` });
  return NextResponse.json({ ok: true });
}
