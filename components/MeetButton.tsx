"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Arrow } from "./Icons";
import { getLenis, toast } from "@/lib/motion";

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

// "Book a strategy meet": pay ₹199 in the Razorpay window (UPI, cards, netbanking, wallets),
// then go straight to the Google booking page to pick a time.
export default function MeetButton({ className = "btn dark", label: idle = "Book a call with founders" }: { className?: string; label?: React.ReactNode }) {
  const [busy, setBusy] = useState<"" | "opening" | "verifying">("");
  // paid but not booked yet: the button reopens the calendar instead of asking to pay again
  const [paid, setPaid] = useState<Paid | null>(null);
  // the payment the open calendar belongs to (kept after booking so the confirmation can show)
  const [session, setSession] = useState<Paid | null>(null);
  // a small "your name" step before the payment window (Razorpay doesn't ask for a name)
  const [asking, setAsking] = useState(false);
  useEffect(() => setPaid(readPaid()), []);

  function begin() {
    if (busy) return;
    if (paid) return setSession(paid);
    setAsking(true);
  }

  async function start(name: string) {
    setAsking(false);
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
        prefill: { name },
        notes: { name },
        modal: { ondismiss: () => setBusy("") },
        handler: async (r: RzpResponse) => {
          setBusy("verifying");
          const v = await fetch("/api/meet/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature, name }),
          })
            .then((x) => x.json())
            .catch(() => ({ ok: false }));
          if (v.ok && v.calLink) {
            setBusy("");
            const p: Paid = { calLink: v.calLink, email: v.email || "", name, paymentId: v.paymentId || r.razorpay_payment_id, at: Date.now() };
            savePaid(p);
            setPaid(p);
            setSession(p);
          } else if (v.ok && v.url) {
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

  const label = busy === "opening" ? "Opening payment…" : busy === "verifying" ? "Confirming…" : paid ? "Pick your time" : idle;
  return (
    <>
      <button type="button" className={className} onClick={begin} disabled={!!busy} aria-busy={!!busy} style={{ alignSelf: "flex-start" }}>
        {label} <Arrow />
      </button>
      {asking && <NameStep onSubmit={start} onClose={() => setAsking(false)} />}
      {session && (
        <BookingModal
          paid={session}
          onBooked={() => {
            clearPaid();
            setPaid(null);
          }}
          onClose={() => setSession(null)}
        />
      )}
    </>
  );
}

// ── one booking per payment ───────────────────────────────────────────────────────────────
// After a verified payment the Cal.com calendar opens inside the site. The moment a slot is
// booked the calendar closes, a confirmation shows once, and the paid state is cleared, so
// the same payment can't book a second time. If the visitor closes it without booking, the
// payment is remembered on this device and the button reopens the calendar.
type Paid = { calLink: string; email: string; name?: string; paymentId: string; at: number };
const PAID_KEY = "rs-meet-paid";
const readPaid = (): Paid | null => {
  try {
    const p = JSON.parse(localStorage.getItem(PAID_KEY) || "null") as Paid | null;
    return p && p.calLink && Date.now() - p.at < 30 * 864e5 ? p : null;
  } catch {
    return null;
  }
};
const savePaid = (p: Paid) => {
  try {
    localStorage.setItem(PAID_KEY, JSON.stringify(p));
  } catch {}
};
const clearPaid = () => {
  try {
    localStorage.removeItem(PAID_KEY);
  } catch {}
};

type CalFn = ((...a: unknown[]) => void) & { ns: Record<string, (...a: unknown[]) => void>; loaded?: boolean; q?: unknown[] };
declare global {
  interface Window {
    Cal?: CalFn;
  }
}
const NS = "rsmeet";
let calReady = false;
let onCalBooked: ((d: { startTime?: string }) => void) | null = null;
let onCalFailed: (() => void) | null = null;

// Cal.com's own loader (queues calls until embed.js has loaded)
function loadCal() {
  if (calReady) return;
  calReady = true;
  /* eslint-disable */
  (function (C: any, A: string, L: string) {
    const p = function (a: any, ar: any) {
      a.q.push(ar);
    };
    const d = C.document;
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: any = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  /* eslint-enable */
  const Cal = window.Cal!;
  Cal("init", NS, { origin: "https://cal.com" });
  const api = Cal.ns[NS];
  api("ui", { theme: "dark", cssVarsPerTheme: { dark: { "cal-brand": "#d8ff00" }, light: { "cal-brand": "#0b0b0b" } }, hideEventTypeDetails: false, layout: "month_view" });
  api("on", { action: "bookingSuccessfulV2", callback: (e: CustomEvent<{ data?: { startTime?: string } }>) => onCalBooked?.(e.detail?.data || {}) });
  api("on", { action: "linkFailed", callback: () => onCalFailed?.() });
}

function BookingModal({ paid, onBooked, onClose }: { paid: Paid; onBooked: () => void; onClose: () => void }) {
  const [state, setState] = useState<"picking" | "done" | "failed">("picking");
  const [when, setWhen] = useState("");

  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    document.documentElement.classList.add("modal-open");
    onCalBooked = (d) => {
      onBooked();
      if (d.startTime) {
        const t = new Date(d.startTime);
        setWhen(
          t.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })
        );
      }
      setState("done");
    };
    onCalFailed = () => setState("failed");
    loadCal();
    window.Cal!.ns[NS]("inline", {
      elementOrSelector: "#rs-cal-embed",
      calLink: paid.calLink,
      config: { layout: "month_view", theme: "dark", ...(paid.name ? { name: paid.name } : {}), ...(paid.email ? { email: paid.email } : {}), notes: `Paid ₹199 · ${paid.paymentId}` },
    });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      onCalBooked = null;
      onCalFailed = null;
      window.removeEventListener("keydown", esc);
      document.documentElement.classList.remove("modal-open");
      lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div className="mbk" role="dialog" aria-modal="true" aria-label="Book your call" data-lenis-prevent>
      <div className="mbk-scrim" onClick={state === "done" ? onClose : undefined} />
      <div className={"mbk-panel" + (state === "done" ? " is-done" : "")}>
        <button type="button" className="mbk-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        {state === "done" ? (
          <div className="mbk-done">
            <span className="mbk-tick" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <h3>Booking confirmed.</h3>
            {when && <p className="mbk-when">{when}</p>}
            <p>The calendar invite and call link are on their way to your email. See you there.</p>
            <button type="button" className="btn solid" onClick={onClose}>
              Done <Arrow />
            </button>
          </div>
        ) : (
          <>
            <div className="mbk-head">
              <span className="talk-tag">
                <i /> Payment received
              </span>
              <h3>Pick a time with the founders.</h3>
              <p>One booking per payment. Close this and come back any time; the button will bring you right here.</p>
            </div>
            {state === "failed" ? (
              <p className="mbk-fail">The calendar didn&apos;t load. Please refresh and try again, or message us and we&apos;ll book you in.</p>
            ) : (
              <div id="rs-cal-embed" className="mbk-cal" />
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// Step 1 of booking: ask for the visitor's name, then open the payment window.
function NameStep({ onSubmit, onClose }: { onSubmit: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    document.documentElement.classList.add("modal-open");
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.documentElement.classList.remove("modal-open");
      lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.replace(/\s+/g, " ").trim();
    if (n.length < 2) return setErr("Please enter your name.");
    onSubmit(n.slice(0, 80));
  };
  return createPortal(
    <div className="mbk" role="dialog" aria-modal="true" aria-label="Your name" data-lenis-prevent>
      <div className="mbk-scrim" onClick={onClose} />
      <form className="mbk-panel mbk-name" onSubmit={submit} noValidate>
        <button type="button" className="mbk-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="talk-tag">
          <i /> Founders&apos; desk
        </span>
        <h3>First, what should we call you?</h3>
        <label className="mbk-field">
          <span>Your name</span>
          <input
            autoFocus
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            maxLength={80}
            placeholder="Full name"
            onChange={(e) => {
              setName(e.target.value);
              if (err) setErr("");
            }}
          />
        </label>
        {err && <p className="mbk-err">{err}</p>}
        <button type="submit" className="btn solid">
          Continue to payment <Arrow />
        </button>
        <p className="mbk-note">Secure payment by Razorpay. Then pick a time that suits you.</p>
      </form>
    </div>,
    document.body
  );
}
