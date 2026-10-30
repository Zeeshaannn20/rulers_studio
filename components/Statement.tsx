"use client";
import { Fragment, useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

const TEXT =
  "We're an AI film studio working with brands all over the world. We write, direct and finish AI ad creatives, product videos, brand stories and UGC ads. No shoot, no crew, no compromise on craft.";
// words shown in lime once lit
const ACCENT = new Set(["AI", "film", "studio"]);

const STATS = [
  { n: 100, suffix: "+", unit: "", label: "films made for brands" },
  { n: 200, suffix: "+", unit: "min", label: "of micro films made" },
  { n: 7, suffix: "", unit: "days", label: "from brief to final film, guaranteed" },
];

// About statement: the words light up one by one as you scroll, then the numbers count up.
export default function Statement({ children }: { children?: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".st-text .sw",
        { opacity: 0.14 },
        { opacity: 1, ease: "none", stagger: 0.08, scrollTrigger: { trigger: ".st-text", start: "top 82%", end: "bottom 45%", scrub: 0.4 } }
      );
      el.querySelectorAll<HTMLElement>(".stat-n b").forEach((b) => {
        const end = Number(b.dataset.n);
        const o = { v: 0 };
        gsap.to(o, {
          v: end,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: b, start: "top 90%", once: true },
          onUpdate: () => {
            b.textContent = String(Math.round(o.v));
          },
        });
      });
      gsap.from(".stat", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".stats", start: "top 88%" } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="sec statement light" ref={root}>
      <div className="wrap">
        <span className="eyebrow">About the studio</span>
        <p className="st-text">
          {TEXT.split(" ").map((w, i) => (
            <Fragment key={i}>
              <span className={"sw" + (ACCENT.has(w) ? " lime" : "")}>{w}</span>{" "}
            </Fragment>
          ))}
        </p>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-n">
                <b data-n={s.n}>{s.n}</b>
                <span>{s.suffix}</span>
                {s.unit && <small>{s.unit}</small>}
              </div>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}
