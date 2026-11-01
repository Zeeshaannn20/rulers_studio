import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { MEET_PRICE_PAISE, calLink, meetBookingUrl, razorpayKeys } from "@/lib/meet";
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
  // The payer's mobile and email come from Razorpay itself (its checkout asks for them).
  const payer = await fetchPayer(b.paymentId, keys);
  await sendToSheet("meet", {
    paymentId: b.paymentId,
    orderId: b.orderId,
    amount: MEET_PRICE_PAISE / 100,
    mobile: payer.contact,
    email: payer.email,
    method: payer.method,
  });
  // With Cal.com set up, the booking calendar opens inside the site (one booking, then a confirmation).
  const cal = calLink();
  if (cal) return NextResponse.json({ ok: true, calLink: cal, email: payer.email, paymentId: b.paymentId });
  return NextResponse.json({ ok: true, url: meetBookingUrl() });
}

// Reads the payment back from Razorpay to get the mobile number and email the payer entered.
async function fetchPayer(paymentId: string, keys: { id: string; secret: string }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: "Basic " + Buffer.from(`${keys.id}:${keys.secret}`).toString("base64") },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(String(res.status));
    const p = (await res.json()) as { contact?: string; email?: string; method?: string; vpa?: string; wallet?: string; bank?: string };
    const via = [p.method, p.vpa || p.wallet || p.bank].filter(Boolean).join(" · ");
    return { contact: p.contact || "", email: p.email && !/void@razorpay/i.test(p.email) ? p.email : "", method: via };
  } catch (e) {
    console.error("[meet] couldn't read payer details", paymentId, String(e));
    return { contact: "", email: "", method: "" };
  } finally {
    clearTimeout(timer);
  }
}
