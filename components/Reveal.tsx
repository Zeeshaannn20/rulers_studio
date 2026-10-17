"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

// Children marked [data-reveal] rise in as they enter the viewport, in small batches.
export default function Reveal({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const items = el.querySelectorAll<HTMLElement>("[data-reveal]");
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(items, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => gsap.from(batch, { y: 60, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
