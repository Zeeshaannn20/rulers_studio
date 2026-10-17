"use client";
import { createElement, Fragment, useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

type Props = {
  as?: "h1" | "h2" | "h3";
  className?: string;
  text: string;
  accent?: string; // last word(s) shown in lime
  style?: React.CSSProperties;
  immediate?: boolean; // animate on mount instead of on scroll
};

// Heading whose words rise out of a mask when it scrolls into view.
export default function Words({ as = "h2", className, text, accent, style, immediate }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll(".w>span"), {
        yPercent: 105,
        duration: 1,
        ease: "expo.out",
        stagger: 0.06,
        ...(immediate ? { delay: 0.2 } : { scrollTrigger: { trigger: el, start: "top 88%" } }),
      });
    }, el);
    return () => ctx.revert();
  }, [immediate]);

  const split = (t: string, cls?: string): ReactNode[] =>
    t.split(" ").map((w, i) => (
      <Fragment key={(cls ?? "") + w + i}>
        <span className="w">
          <span className={cls}>
            {w.endsWith(".") && !cls ? w.slice(0, -1) : w}
          </span>
        </span>{" "}
      </Fragment>
    ));

  return createElement(as, { ref, className, style }, [...split(text), ...(accent ? split(accent, "lime dot") : [])]);
}
