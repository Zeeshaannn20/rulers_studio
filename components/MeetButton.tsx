"use client";
import { useState } from "react";
import { Arrow } from "./Icons";
import { toast } from "@/lib/motion";

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpOptions = Record<string, unknown> & { handler: (r: RzpResponse) => void };
declare global {
  interface Window {
    Razorpay?: new (o: RzpOptions) => { open: () => void; on: (e: string, f: (r: { error?: { description?: string } }) => void) => void };
  }
}

const loadCheckout = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// "Book a strategy meet": pay ₹99 in the Razorpay window (UPI, cards, netbanking, wallets),
// then go straight to the Google booking page to pick a time.
export default function MeetButton({ className = "btn dark" }: { className?: string }) {
  const [busy, setBusy] = useState<"" | "opening" | "verifying">("");

  async function start() {
    if (busy) return;
    setBusy("opening");
    try {
      const [ok, res] = await Promise.all([loadCheckout(), fetch("/api/meet/order", { method: "POST" })]);
      const order = await res.json().catch(() => ({}));
      if (!ok || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      if (!res.ok || !order.ok) throw new Error(order.error || "Couldn't start the payment. Please try again.");

      const rzp = new window.Razorpay({
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Rulers Studio",
        description: "Strategy meet",
        theme: { color: "#0b0b0b" },
        modal: { ondismiss: () => setBusy("") },
        handler: async (r: RzpResponse) => {
          setBusy("verifying");
          const v = await fetch("/api/meet/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
          })
            .then((x) => x.json())
            .catch(() => ({ ok: false }));
          if (v.ok && v.url) {
            toast("Payment received. Pick your time");
            window.location.assign(v.url);
          } else {
            setBusy("");
            toast(v.error || "We couldn't confirm the payment. Please message us.");
          }
        },
      });
      rzp.on("payment.failed", (e) => toast(e.error?.description || "Payment failed. Please try again."));
      rzp.open();
    } catch (e) {
      toast((e as Error).message);
      setBusy("");
    }
  }

  return (
    <button type="button" className={className} onClick={start} disabled={!!busy} aria-busy={!!busy} style={{ alignSelf: "flex-start" }}>
      {busy === "opening" ? "Opening payment…" : busy === "verifying" ? "Confirming…" : "Book your 30 minutes"} <Arrow />
    </button>
  );
}
