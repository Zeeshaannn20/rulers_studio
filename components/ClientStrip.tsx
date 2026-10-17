"use client";
import { useEffect, useRef } from "react";
import RMark from "./RMark";
import { gsap, getLenis, prefersReducedMotion } from "@/lib/motion";
import { CLIENTS } from "@/data/site";

// H-02: endless client strip that speeds up with scroll velocity.
export default function ClientStrip() {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    const loop = gsap.to(el, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
    let boost = 0;
    const lenis = getLenis();
    const onScroll = (e: { velocity: number }) => (boost = Math.min(Math.abs(e.velocity) * 0.25, 6));
    lenis?.on("scroll", onScroll);
    const decay = () => {
      boost *= 0.92;
      loop.timeScale(1 + boost);
    };
    gsap.ticker.add(decay);
    return () => {
      gsap.ticker.remove(decay);
      lenis?.off("scroll", onScroll);
      loop.kill();
    };
  }, []);

  // Two identical halves so the -50% loop is seamless
  const half = Array.from({ length: 4 }).flatMap(() => CLIENTS);
  return (
    <section className="strip" aria-label="Clients">
      <div className="strip-track" ref={track}>
        {[...half, ...half].map((c, i) => (
          <div className="strip-item" key={i} aria-hidden={i >= half.length}>
            <b>{c}</b>
            <RMark />
          </div>
        ))}
      </div>
    </section>
  );
}
