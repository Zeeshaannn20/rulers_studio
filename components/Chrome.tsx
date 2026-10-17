"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { R_PATHS, R_VIEWBOX } from "./RMark";

const SPARKS = 22;
const CUSTOM_CURSOR = false as boolean; // the gold cursor dot (off: the normal pointer is used)
const BEAMS = 3;

// Persistent page chrome: curtain for page transitions, custom cursor, toast.
export default function Chrome() {
  const cur = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("Play");
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);

  // Cursor follows the pointer; grows over anything with data-cursor
  useEffect(() => {
    const el = cur.current;
    // the custom cursor dot is switched off — the normal system pointer is used everywhere
    if (!el || !CUSTOM_CURSOR || !window.matchMedia("(pointer:fine)").matches || prefersReducedMotion()) return;
    // a short, light follow: the dot stays glued to the pointer but never jitters
    const xTo = gsap.quickTo(el, "x", { duration: 0.12, ease: "power2.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.12, ease: "power2.out" });
    const move = (e: PointerEvent) => {
      el.classList.add("on");
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (t) {
        setLabel(t.dataset.cursor || "");
        el.classList.add("big");
      } else el.classList.remove("big");
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
    };
  }, []);

  // Magnetic buttons: pills lean toward the pointer and spring back on leave
  useEffect(() => {
    if (!window.matchMedia("(pointer:fine)").matches || prefersReducedMotion()) return;
    let active: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(".btn, .acc-icon, .role .go, .soc a");
      if (active && active !== b) {
        gsap.to(active, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)", overwrite: "auto" });
        active = null;
      }
      if (!b) return;
      active = b;
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(b, { x: dx * 0.22, y: dy * 0.3, duration: 0.4, ease: "power3.out", overwrite: "auto" });
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const show = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      setOn(true);
      clearTimeout(t);
      t = setTimeout(() => setOn(false), 2600);
    };
    document.addEventListener("rs:toast", show);
    return () => document.removeEventListener("rs:toast", show);
  }, []);

  return (
    <>
      {/* page loader (reference: the Monster logo reveal): darkness, sweeping light beams,
          the R traced in light, a white-hot flash that cools to gold, drifting embers */}
      <div className="curtain" id="curtain" aria-hidden="true">
        <div className="cl-stage">
          <div className="cl-beams">
            {Array.from({ length: BEAMS }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="cl-glow" />
          <svg className="cl-r" viewBox={R_VIEWBOX}>
            <defs>
              <linearGradient id="cl-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e5e5e5" />
                <stop offset="0.5" stopColor="#d8ff00" />
                <stop offset="1" stopColor="#b4d400" />
              </linearGradient>
            </defs>
            <g className="cl-gold" fill="url(#cl-gold)">
              {R_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g className="cl-hot" fill="#f8f8f8">
              {R_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g className="cl-halo" fill="none" stroke="#d6d6d6" strokeWidth="3.2" strokeLinejoin="round">
              {R_PATHS.map((d, i) => (
                <path key={i} d={d} pathLength={1} />
              ))}
            </g>
            <g className="cl-edge" fill="none" stroke="#f3f3f3" strokeWidth="0.9" strokeLinejoin="round">
              {R_PATHS.map((d, i) => (
                <path key={i} d={d} pathLength={1} />
              ))}
            </g>
          </svg>
          <div className="cl-sparks">
            {Array.from({ length: SPARKS }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
      </div>
      <div className="cur" ref={cur} aria-hidden="true">
        <span>{label}</span>
      </div>
      <div className={"toast" + (on ? " on" : "")} role="status" aria-live="polite">
        {msg}
      </div>
    </>
  );
}
