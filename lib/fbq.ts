import { ev } from "./analytics";

// Meta Pixel helpers. Never put a name, email or phone number in the params.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// The Pixel ID is public (it's visible in every page's code), so a fallback here is safe.
// Set NEXT_PUBLIC_META_PIXEL_ID in Vercel to change it without touching code.
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1614687364030894";

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

// The same conversion in Google Analytics' own names, so GA4 reports leads and bookings by traffic source.
const GA_NAME: Record<string, string> = {
  Lead: "generate_lead",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
  CrewApplication: "crew_application",
  Contact: "contact",
};

export function track(event: string, params: Record<string, unknown> = {}, custom = false) {
  const eventID = newId();
  try {
    window.fbq?.(custom ? "trackCustom" : "track", event, params, { eventID });
  } catch {
    // tracking must never break the site
  }
  const p = params as { value?: number; currency?: string; content_name?: string };
  ev(GA_NAME[event] || event.toLowerCase(), {
    value: p.value,
    currency: p.currency,
    item_name: p.content_name,
    transaction_id: event === "Purchase" ? eventID : undefined,
    page: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
  // keep the full recording of every converting visit in Clarity
  try {
    window.clarity?.("upgrade", event);
  } catch {
    /* ignore */
  }
  return eventID;
}
