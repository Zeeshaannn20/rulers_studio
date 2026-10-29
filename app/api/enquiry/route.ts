import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enquirySchema, toFieldErrors } from "@/lib/validation";
import { rateLimited } from "@/lib/rateLimit";
import { sendToSheet } from "@/lib/sheet";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // no limit while testing on your own computer; 8 messages per 10 minutes per visitor once live
  if (process.env.NODE_ENV === "production" && rateLimited("enquiry:" + ip, 8)) {
    return NextResponse.json({ ok: false, error: "Too many messages. Try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: toFieldErrors(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;
  if (d.rs_extra) return NextResponse.json({ ok: true }); // honeypot hit: pretend success

  const record = {
    name: d.name,
    mobile: "+91 " + d.mobile,
    email: d.email.toLowerCase(),
    services: d.services,
    projectDetails: d.details || null,
    budgetRange: d.budget || null,
    sourcePage: d.sourcePage || null,
  };

  try {
    if (db) await db.enquiry.create({ data: record });
    else console.log("[enquiry] DATABASE_URL not set — received:", record);
    await sendToSheet("enquiry", {
      name: record.name,
      mobile: record.mobile,
      email: record.email,
      requirements: record.services,
      details: record.projectDetails,
      budget: record.budgetRange,
      page: record.sourcePage,
    });
    // TODO: email business@rulersstudio.com + auto-reply (Resend / SES) — brief section 8.4
  } catch (e) {
    console.error("[enquiry] save failed", e);
    return NextResponse.json({ ok: false, error: "Couldn't send right now. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
