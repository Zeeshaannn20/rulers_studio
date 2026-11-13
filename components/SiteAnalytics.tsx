"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CLARITY_ID, GA_ID, captureTouch, ev, initTrackers, tag } from "@/lib/analytics";

// Readable names for the home page sections (other pages fall back to the section's own class or id).
const SECTION_NAMES: [string, string][] = [
  ["stage-host", "hero"],
  ["wt-host", "selected_work"],
  ["ws", "selected_work"],
  ["statement", "about"],
  ["sv-host", "services"],
  ["process", "process"],
  ["contact", "contact"],
  ["faq", "faq"],
  ["ftr", "footer"],
  ["wrap", "page_content"],
];

function sectionName(el: Element | null): string {
  if (!el) return "page";
  const own = (el as HTMLElement).dataset?.section;
  if (own) return own;
  for (const [cls, name] of SECTION_NAMES) if (el.classList.contains(cls)) return name;
  return el.id || el.classList[0] || el.tagName.toLowerCase();
}

// the top-level block of the page an element sits in
function blockOf(el: Element): string {
  if (el.closest(".menu")) return "menu";
  if (el.closest("header")) return "header";
  if (el.closest(".mbk, [role=dialog]")) return "booking_window";
  const main = document.getElementById("main");
  let n: Element | null = el;
  while (n && n.parentElement && n.parentElement !== main) n = n.parentElement;
  return n && n.parentElement === main ? sectionName(n) : "page";
}

const clean = (s: string | null | undefined, max = 60) => (s || "").replace(/\s+/g, " ").trim().slice(0, max);

// Everything visitors do, measured without touching each component:
// sections reached and time spent in each, scroll depth, every click, form starts, video plays,
// and the exact section and scroll depth when someone leaves.
export default function SiteAnalytics() {
  const pathname = usePathname();

  // where they came from (once per visit)
  useEffect(() => {
    initTrackers();
    const { first, last } = captureTouch();
    tag("source", last.source);
    tag("medium", last.medium);
    if (last.campaign) tag("campaign", last.campaign);
    tag("landing", last.landing);
    tag("first_source", first.source);
    try {
      window.gtag?.("set", "user_properties", { first_source: first.source, first_medium: first.medium, first_campaign: first.campaign || "(none)" });
    } catch {
      /* ignore */
    }
  }, []);

  // per page: sections, time per section, scroll depth, leaving point
  useEffect(() => {
    const page = pathname;
    const start = performance.now();
    let maxPct = 0;
    const marks = [25, 50, 75, 90, 100];
    const sent = new Set<number>();
    let current = "";
    let curSince = 0;
    const seen = new Set<string>();
    const dwell = new Map<string, number>();
    let raf = 0;
    let done = false;

    const pct = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      return h <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / h) * 100));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const p = pct();
        if (p > maxPct) maxPct = p;
        for (const m of marks) {
          if (p >= m && !sent.has(m)) {
            sent.add(m);
            ev("scroll_depth", { percent: m, page });
          }
        }
      });
    };

    const stopTimer = (beacon = false) => {
      if (!current || !curSince) return;
      const secs = (performance.now() - curSince) / 1000;
      curSince = 0;
      dwell.set(current, (dwell.get(current) || 0) + secs);
      if (secs >= 2) ev("section_time", { section: current, seconds: Math.round(secs), page }, beacon);
    };

    // the section crossing the middle of the screen is the one being looked at
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const name = sectionName(e.target);
          if (name === current) continue;
          stopTimer();
          current = name;
          curSince = document.visibilityState === "visible" ? performance.now() : 0;
          if (!seen.has(name)) {
            seen.add(name);
            const order = blocks.indexOf(e.target) + 1;
            ev("section_view", { section: name, position: order, page });
            try {
              window.fbq?.("trackCustom", "SectionView", { section: name, page });
            } catch {
              /* ignore */
            }
          }
        }
      },
      { rootMargin: "-49% 0px -50% 0px" }
    );
    let blocks: Element[] = [];
    const id = requestAnimationFrame(() => {
      const main = document.getElementById("main");
      blocks = main ? Array.from(main.children).filter((el) => (el as HTMLElement).offsetHeight > 120 && getComputedStyle(el).display !== "none") : [];
      blocks.forEach((b) => io.observe(b));
      onScroll();
    });

    const leave = () => {
      if (done) return;
      done = true;
      stopTimer(true);
      ev("page_exit", { page, last_section: current || "hero", max_scroll: maxPct, seconds_on_page: Math.round((performance.now() - start) / 1000), sections_seen: seen.size }, true);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        stopTimer(true);
        // a hidden tab often never comes back on phones, so record the leaving point now
        ev("page_hidden", { page, last_section: current || "hero", max_scroll: maxPct, seconds_on_page: Math.round((performance.now() - start) / 1000) }, true);
      } else if (current) curSince = performance.now();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", leave);

    // project pages count as "viewed content" for Meta audiences
    const m = page.match(/^\/projects\/([^/]+)/);
    if (m) {
      try {
        window.fbq?.("track", "ViewContent", { content_name: m[1], content_type: "film" });
      } catch {
        /* ignore */
      }
      ev("view_project", { project: m[1] });
    }

    return () => {
      // moving to another page inside the site
      leave();
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", leave);
    };
  }, [pathname]);

  // every click, form start and video play, site wide
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.("a,button,[role=button],summary,[data-track]");
      if (!t) return;
      const a = t.closest("a") as HTMLAnchorElement | null;
      const href = a?.getAttribute("href") || "";
      let kind = "button";
      let dest = "";
      if (a) {
        if (href.startsWith("mailto:")) kind = "email";
        else if (href.startsWith("tel:")) kind = "phone";
        else if (/wa\.me|whatsapp/.test(href)) kind = "whatsapp";
        else if (href.startsWith("#")) kind = "jump";
        else {
          try {
            const u = new URL(href, window.location.href);
            const ext = u.hostname.replace(/^www\./, "") !== window.location.hostname.replace(/^www\./, "");
            kind = ext ? "outbound" : "link";
            dest = ext ? u.hostname.replace(/^www\./, "") : u.pathname;
          } catch {
            kind = "link";
          }
        }
      }
      const label =
        clean((t as HTMLElement).dataset?.track) ||
        clean(t.getAttribute("aria-label")) ||
        clean((t as HTMLElement).innerText) ||
        clean(t.getAttribute("title")) ||
        clean(dest) ||
        "unlabelled";
      const where = blockOf(t);
      ev("ui_click", { label, kind, section: where, destination: dest || undefined, page: window.location.pathname });
      if (kind === "email" || kind === "phone" || kind === "whatsapp" || (kind === "outbound" && /instagram|linkedin|youtube|behance|vimeo/.test(dest))) {
        try {
          window.fbq?.("track", "Contact", { content_name: kind === "outbound" ? dest : kind });
        } catch {
          /* ignore */
        }
      }
    };

    const started = new WeakSet<HTMLFormElement>();
    const onFocus = (e: FocusEvent) => {
      const f = (e.target as Element | null)?.closest?.("form") as HTMLFormElement | null;
      if (!f || started.has(f)) return;
      started.add(f);
      ev("form_start", { form: f.getAttribute("aria-label") || f.id || blockOf(f), page: window.location.pathname });
    };

    // real video watching (not the silent looping previews)
    const progress = new WeakMap<HTMLVideoElement, Set<number>>();
    const isPreview = (v: HTMLVideoElement) => v.muted && v.loop && !v.controls;
    const vidName = (v: HTMLVideoElement) => clean(v.getAttribute("aria-label") || v.currentSrc.split("/").pop() || "video", 80);
    const onPlay = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      if (!(v instanceof HTMLVideoElement) || isPreview(v)) return;
      if (!progress.has(v)) {
        progress.set(v, new Set());
        ev("video_start", { video: vidName(v), page: window.location.pathname });
      }
    };
    const onTime = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      if (!(v instanceof HTMLVideoElement) || isPreview(v) || !v.duration) return;
      const done = progress.get(v);
      if (!done) return;
      const p = (v.currentTime / v.duration) * 100;
      for (const m of [25, 50, 75, 95]) {
        if (p >= m && !done.has(m)) {
          done.add(m);
          ev("video_progress", { video: vidName(v), percent: m === 95 ? 100 : m, page: window.location.pathname });
        }
      }
    };

    document.addEventListener("click", onClick, { capture: true, passive: true });
    document.addEventListener("focusin", onFocus, { passive: true });
    document.addEventListener("play", onPlay, { capture: true, passive: true });
    document.addEventListener("timeupdate", onTime, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("play", onPlay, { capture: true });
      document.removeEventListener("timeupdate", onTime, { capture: true });
    };
  }, []);

  return (
    <>
      {GA_ID && (
        <>
          {/* the config command is queued by initTrackers(); this only loads Google's library */}
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" onLoad={initTrackers} />
        </>
      )}
      {CLARITY_ID && (
        <Script id="clarity" strategy="lazyOnload">{`
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");
`}</Script>
      )}
    </>
  );
}
