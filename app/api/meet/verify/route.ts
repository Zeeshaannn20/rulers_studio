import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { MEET_PRICE_PAISE, meetBookingUrl, razorpayKeys } from "@/lib/meet";
import { sendToSheet } from "@/lib/sheet";

// Checks Razorpay's signature; only a genuine, paid order gets the booking link.
export async function POST(req: Request) {
  const keys = razorpayKeys();
  if (!keys) return NextResponse.json({ ok: false, error: "Payments are not set up." }, { status: 503 });

  const b = (await req.json().catch(() => null)) as { orderId?: string; paymentId?: string; signature?: string } | null;
  if (!b?.orderId || !b.paymentId || !b.signature) return NextResponse.json({ ok: false, error: "Missing payment details." }, { status: 400 });

  const expected = createHmac("sha256", keys.secret).update(`${b.orderId}|${b.paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const s = Buffer.from(String(b.signature));
  if (a.length !== s.length || !timingSafeEqual(a, s)) {
    return NextResponse.json({ ok: false, error: "We couldn't verify this payment. If money was deducted, message us and we'll sort it out." }, { status: 400 });
  }
  console.log("[meet] paid", b.orderId, b.paymentId);
  await sendToSheet("meet", { paymentId: b.paymentId, orderId: b.orderId, amount: MEET_PRICE_PAISE / 100 });
  return NextResponse.json({ ok: true, url: meetBookingUrl() });
}
