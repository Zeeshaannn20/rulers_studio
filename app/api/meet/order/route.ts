import { NextResponse } from "next/server";
import { MEET_PRICE_PAISE, razorpayKeys } from "@/lib/meet";
import { rateLimited } from "@/lib/rateLimit";

// Creates a ₹199 Razorpay order for one strategy meet.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited("meet:" + ip, 10)) return NextResponse.json({ ok: false, error: "Too many tries. Please wait a few minutes." }, { status: 429 });

  const keys = razorpayKeys();
  if (!keys) return NextResponse.json({ ok: false, error: "Payments are being set up. Please send us a message for now." }, { status: 503 });

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keys.id}:${keys.secret}`).toString("base64"),
    },
    body: JSON.stringify({ amount: MEET_PRICE_PAISE, currency: "INR", receipt: `meet_${Date.now()}`, notes: { product: "Strategy meet" } }),
  }).catch(() => null);

  if (!res || !res.ok) {
    console.error("[meet] order failed", res && (await res.text().catch(() => "")));
    return NextResponse.json({ ok: false, error: "Couldn't start the payment. Please try again." }, { status: 502 });
  }
  const order = (await res.json()) as { id: string; amount: number; currency: string };
  return NextResponse.json({ ok: true, key: keys.id, orderId: order.id, amount: order.amount, currency: order.currency });
}
