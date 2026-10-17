"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, setLenis, getLenis, prefersReducedMotion } from "@/lib/motion";

// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync.
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.3 });
    setLenis(lenis);

    // Keyboard scrolling with the same glide as the wheel (browsers jump by default)
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.body.classList.contains("intro-on")) return;
      const t = e.target instanceof Element ? e.target : document.body;
      if (t.closest("input,textarea,select,[contenteditable],[role=listbox],.menu")) return;
      if (e.key === " " && t.closest("button,a")) return;
      const vh = window.innerHeight;
      const step: Record<string, number> = { ArrowDown: vh * 0.32, ArrowUp: -vh * 0.32, PageDown: vh * 0.88, PageUp: -vh * 0.88 };
      let delta = step[e.key];
      if (e.key === " ") delta = (e.shiftKey ? -1 : 1) * vh * 0.88;
      if (e.key === "Home") delta = -lenis.targetScroll;
      if (e.key === "End") delta = lenis.limit - lenis.targetScroll;
      if (delta === undefined) return;
      e.preventDefault();
      lenis.scrollTo(Math.max(0, Math.min(lenis.limit, lenis.targetScroll + delta)), {
        duration: 1.1,
        easing: (x: number) => 1 - Math.pow(1 - x, 4),
      });
    };
    window.addEventListener("keydown", onKey);
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      window.removeEventListener("keydown", onKey);
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // New page: jump to top and re-measure scroll triggers
  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Decorative loops (sheens, rays, grain) pause while their section is off screen
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("is-off", !e.isIntersecting)), { rootMargin: "15% 0px" });
    const id = requestAnimationFrame(() => document.querySelectorAll(".stage-wrap,.sv,.light,.ftr,.fs,.reel").forEach((el) => io.observe(el)));
    return () => {
      cancelAnimationFrame(id);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
