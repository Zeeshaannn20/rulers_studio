// Website behaviour analytics: Google Analytics 4 (traffic, journeys, conversions) and Microsoft Clarity
// (heatmaps, scroll maps, session recordings). Both switch on only when their ID is set in Vercel:
//   NEXT_PUBLIC_GA_ID       e.g. G-XXXXXXXXXX
//   NEXT_PUBLIC_CLARITY_ID  e.g. abcd1234ef
// Never put a name, email or phone number in any event.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (...args: unknown[]) => void;
  }
}

export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID || "").trim();
export const CLARITY_ID = (process.env.NEXT_PUBLIC_CLARITY_ID || "").trim();

type Params = Record<string, string | number | boolean | undefined>;

// Queues for GA4 and Clarity, so events fired before their scripts finish loading are kept, in order.
let ready = false;
export function initTrackers() {
  if (ready || typeof window === "undefined") return;
  ready = true;
  if (GA_ID && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    // gtag must push the real `arguments` object, exactly like Google's snippet
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }
  if (CLARITY_ID && !window.clarity) {
    const c = function (...args: unknown[]) {
      (c.q = c.q || []).push(args);
    } as ((...args: unknown[]) => void) & { q?: unknown[][] };
    window.clarity = c;
  }
}

// One call sends the event to GA4 (with its details) and to Clarity (so recordings can be filtered by it).
export function ev(name: string, params: Params = {}, beacon = false) {
  initTrackers();
  try {
    window.gtag?.("event", name, beacon ? { ...params, transport_type: "beacon" } : params);
  } catch {
    /* tracking must never break the site */
  }
  try {
    window.clarity?.("event", name);
  } catch {
    /* ignore */
  }
}

// Label a Clarity session (filterable in its dashboard), e.g. tag("source", "instagram").
export function tag(key: string, value: string) {
  initTrackers();
  try {
    window.clarity?.("set", key, value);
  } catch {
    /* ignore */
  }
}

// ───── where the visitor came from ─────
// First touch is kept for good (localStorage), last touch for this visit (sessionStorage), so every lead
// can say both "first found us via" and "came back via".
export type Touch = { source: string; medium: string; campaign?: string; content?: string; term?: string; landing: string; ref?: string; at: string };

const REF_MAP: [RegExp, string, string][] = [
  [/(^|\.)google\./, "google", "organic"],
  [/(^|\.)bing\.com$/, "bing", "organic"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organic"],
  [/(^|\.)yahoo\./, "yahoo", "organic"],
  [/(^|\.)instagram\.com$/, "instagram", "social"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/, "facebook", "social"],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, "linkedin", "social"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube", "social"],
  [/(^|\.)whatsapp\.com$|(^|\.)wa\.me$/, "whatsapp", "social"],
  [/(^|\.)t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "x", "social"],
  [/(^|\.)reddit\.com$/, "reddit", "social"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$|(^|\.)perplexity\.ai$|(^|\.)claude\.ai$|(^|\.)gemini\.google\.com$/, "ai-assistant", "referral"],
];

function readTouch(): Touch {
  const u = new URL(window.location.href);
  const q = (k: string) => u.searchParams.get(k)?.slice(0, 100) || undefined;
  const landing = u.pathname;
  const at = new Date().toISOString().slice(0, 16);
  let refHost = "";
  try {
    refHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    /* ignore */
  }
  if (refHost === window.location.hostname.replace(/^www\./, "")) refHost = "";

  if (q("utm_source")) {
    return { source: q("utm_source")!, medium: q("utm_medium") || "(none)", campaign: q("utm_campaign"), content: q("utm_content"), term: q("utm_term"), landing, ref: refHost || undefined, at };
  }
  // ad clicks without UTM tags still carry a click id
  if (u.searchParams.has("fbclid")) return { source: /instagram/.test(refHost) ? "instagram" : "facebook", medium: "paid-or-social", landing, ref: refHost || undefined, at };
  if (u.searchParams.has("gclid") || u.searchParams.has("gbraid") || u.searchParams.has("wbraid")) return { source: "google", medium: "cpc", landing, ref: refHost || undefined, at };
  if (refHost) {
    const hit = REF_MAP.find(([re]) => re.test(refHost));
    return hit ? { source: hit[1], medium: hit[2], landing, ref: refHost, at } : { source: refHost, medium: "referral", landing, ref: refHost, at };
  }
  return { source: "direct", medium: "(none)", landing, at };
}

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

// Call once per visit, on the first page the visitor lands on.
export function captureTouch(): { first: Touch; last: Touch } {
  const now = readTouch();
  const ls = store("local");
  const ss = store("session");
  let first: Touch | null = null;
  let last: Touch | null = null;
  try {
    first = JSON.parse(ls?.getItem("rs_first") || "null");
    last = JSON.parse(ss?.getItem("rs_last") || "null");
  } catch {
    /* ignore */
  }
  if (!first) {
    first = now;
    try {
      ls?.setItem("rs_first", JSON.stringify(now));
    } catch {
      /* ignore */
    }
  }
  if (!last) {
    last = now;
    try {
      ss?.setItem("rs_last", JSON.stringify(now));
    } catch {
      /* ignore */
    }
  }
  return { first, last };
}

const fmt = (t: Touch) => [t.source, t.medium, t.campaign, t.content].filter(Boolean).join(" / ") + ` (landed ${t.landing})`;

// Short text saved with every lead so the sheet shows where it came from.
export function leadSource(): string {
  try {
    const { first, last } = captureTouch();
    const same = first.source === last.source && first.campaign === last.campaign;
    return same ? fmt(last) : `${fmt(last)}, first found us: ${fmt(first)}`;
  } catch {
    return "";
  }
}
