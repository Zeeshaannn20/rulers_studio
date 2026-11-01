"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// The screenplay page. Lines are [screenplay element class, html].
const SCRIPT: [string, string][] = [
  ["sh", "INT. YOUR BRAND — DAY"],
  ["ac", "A product sits on a table. No camera. No crew. No lights."],
  ["ac", 'And yet, a <span class="sa-hl">cinema-grade film</span> begins to play.'],
  ["ch", "THE CLIENT"],
  ["dl", "Wait. Where's the shoot?"],
  ["ch", "RULERS STUDIO"],
  ["dl", "There isn't one. Just AI films, directed like real ones."],
  ["tr", "CUT TO: YOUR LAUNCH."],
];

const SLIPS = [
  { k: "Films delivered", n: 100, p: "+", u: "", d: "for brands worldwide", note: "that's a LOT of films" },
  { k: "Micro dramas", n: 200, p: "+", u: "MIN", d: "of episodes delivered", note: "binge-worthy!" },
  { k: "Brief to final film", n: 7, p: "", u: "DAYS", d: "every project, guaranteed", note: "1 week. done." },
  { k: "Shoot days", n: 0, p: "", u: "", d: "no camera, no crew, no reshoots", note: "ZERO. really." },
];
const TILT = [-1.6, 1.1, -0.7, 1.4];

// Timeline (ms). The whole run is 3.5 s when the page and the slips are on screen together.
const K = 1.4; // 3.5 s / 2.5 s base
const T = {
  type: 1000 * K, // script types out
  slipsAfterType: 420 * K, // slips can land this long after typing starts
  land: 380 * K,
  count: 520 * K,
  penStart: (1000 - 420) * K, // after the slips start landing
  penGap: 220 * K,
  sig: (2050 - 420) * K,
};

const CIRCLE = "M10 58 C4 24 52 6 86 22 C102 34 98 78 58 92 C26 100 2 82 8 48 C12 32 28 20 46 16";

// About the studio: the script types itself out, the 4 slips land and count up,
// then the director's red pen circles each number, writes a note and signs off.
export default function Statement({ children }: { children?: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const page = el.querySelector<HTMLElement>(".sa-page")!;
    const out = el.querySelector<HTMLElement>(".sa-out")!;
    const stamp = el.querySelector<HTMLElement>(".sa-stamp")!;
    const slipsBox = el.querySelector<HTMLElement>(".sa-slips")!;
    const slips = Array.from(el.querySelectorAll<HTMLElement>(".sa-slip"));
    const sig = el.querySelector<HTMLElement>(".sa-sig")!;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    let raf = 0;

    // size each red circle around its number
    const fit = () =>
      slips.forEach((s) => {
        const n = s.querySelector<HTMLElement>(".sa-num")!;
        const c = s.querySelector<SVGElement>(".sa-circ")!;
        const pad = 16;
        c.style.left = n.offsetLeft - pad + "px";
        c.style.top = n.offsetTop - pad + "px";
        c.style.width = n.offsetWidth + pad * 2 + "px";
        c.style.height = n.offsetHeight + pad * 2 + "px";
      });
    fit();
    // re-measure once fonts load, but only if the numbers already show their final values
    document.fonts?.ready.then(() => {
      if (!el.classList.contains("sa-armed") || el.classList.contains("sa-done")) fit();
    });
    window.addEventListener("resize", fit);

    if (prefersReducedMotion()) {
      el.classList.add("sa-done");
      return () => window.removeEventListener("resize", fit);
    }

    // arm: hide everything that will animate in (the full text stays in the HTML for search engines)
    const lines = Array.from(out.children) as HTMLElement[];
    const texts = lines.map((l) => l.textContent || "");
    const total = texts.reduce((a, t) => a + t.length, 0);
    page.style.minHeight = page.offsetHeight + "px";
    lines.forEach((l) => (l.textContent = ""));
    slips.forEach((s) => (s.querySelector(".sa-v")!.textContent = "0"));
    el.classList.add("sa-armed");

    let typeStart = 0;
    let typed = false;
    let slipsSeen = false;
    let slipsRun = false;

    const type = () => {
      typeStart = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - typeStart) / T.type);
        let n = Math.floor(k * total);
        lines.forEach((l, i) => {
          const len = texts[i].length;
          if (n >= len) {
            if (!l.dataset.full) {
              l.innerHTML = SCRIPT[i][1];
              l.dataset.full = "1";
            }
            l.classList.remove("sa-caret");
          } else {
            l.textContent = n > 0 ? texts[i].slice(0, n) : "";
            l.classList.toggle("sa-caret", n > 0);
          }
          n -= len;
        });
        if (k < 1) raf = requestAnimationFrame(step);
        else stamp.classList.add("on");
      };
      raf = requestAnimationFrame(step);
      maybeSlips();
    };

    const runSlips = () => {
      slipsRun = true;
      slips.forEach((s, i) => {
        s.animate(
          [
            { opacity: 0, transform: `translateY(40px) rotate(${TILT[i] * 3}deg)` },
            { opacity: 1, transform: `rotate(${TILT[i]}deg)` },
          ],
          { duration: T.land, delay: i * 50 * K, fill: "both", easing: "cubic-bezier(.2,1.3,.4,1)" }
        );
        const v = s.querySelector<HTMLElement>(".sa-v")!;
        const end = SLIPS[i].n;
        const c0 = performance.now();
        const count = (t: number) => {
          const k = Math.min(1, (t - c0) / T.count);
          v.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(count);
        };
        requestAnimationFrame(count);
        later(T.penStart + i * T.penGap, () => {
          fit(); // measure now, when the number shows its final value
          s.classList.add("pen");
        });
      });
      later(T.sig, () => sig.classList.add("on"));
      later(T.sig + 1000, () => el.classList.add("sa-done"));
    };

    // the slips land once typing has had its head start and they're on screen
    const maybeSlips = () => {
      if (slipsRun || !typed || !slipsSeen) return;
      const wait = Math.max(0, typeStart + T.slipsAfterType - performance.now());
      later(wait, runSlips);
    };

    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          if (e.target === page && !typed) {
            typed = true;
            type();
          }
          if (e.target === slipsBox && !slipsSeen) {
            slipsSeen = true;
            if (!typed) {
              typed = true;
              type();
            } else maybeSlips();
          }
          io.unobserve(e.target);
        }),
      { threshold: 0.35 }
    );
    io.observe(page);
    io.observe(slipsBox);

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <section className="sec statement light sa" ref={root}>
      <div className="wrap">
        <span className="eyebrow">About the studio</span>
        <div className="sa-grid">
          <div className="sa-side">
            <h2 className="sa-h">
              Every film starts as a <em>script.</em> Ours just never needs a set.
            </h2>
            <p className="sa-p">We write, direct and finish cinema-grade AI films for brands worldwide.</p>
          </div>
          <div className="sa-page">
            <span className="sa-no" aria-hidden="true">1.</span>
            <div className="sa-out">
              {SCRIPT.map(([c, h], i) => (
                <div key={i} className={"sa-" + c} dangerouslySetInnerHTML={{ __html: h }} />
              ))}
            </div>
            <span className="sa-stamp" aria-hidden="true">APPROVED · NO RESHOOTS</span>
          </div>
        </div>

        <div className="sa-slips">
          {SLIPS.map((s, i) => (
            <div className="sa-slip" key={s.k} style={{ ["--r" as string]: `${TILT[i]}deg` }}>
              <svg className="sa-circ" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength={1} d={CIRCLE} />
              </svg>
              <span className="sa-note" aria-hidden="true">{s.note}</span>
              <div className="sa-k">
                SC. 0{i + 1} · {s.k}
              </div>
              <div className="sa-num">
                <span className="sa-v">{s.n}</span>
                {s.p && <span className="sa-plus">{s.p}</span>}
                {s.u && <small>{s.u}</small>}
              </div>
              <div className="sa-d">{s.d}</div>
            </div>
          ))}
          <span className="sa-sig" aria-hidden="true">approved, the director ✓</span>
        </div>
        {children}
      </div>
    </section>
  );
}
