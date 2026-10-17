"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { SHOWN_PROJECTS, driveCover } from "@/data/projects";

// Stand-in showreel: cross-fades through frames of the selected films with a slow push-in.
// Replaced automatically by SITE.showreel once a real reel is added.
export default function HeroSlides({ onChange }: { onChange?: (name: string) => void }) {
  const slides = SHOWN_PROJECTS.map((p) => ({ name: p.title, src: p.coverImage ?? driveCover(p.slug) })).filter((s) => s.src);
  const [i, setI] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length < 2 || prefersReducedMotion()) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (root.current) io.observe(root.current);
    const t = window.setInterval(() => visible && !document.hidden && setI((n) => (n + 1) % slides.length), 4200);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, [slides.length]);

  useEffect(() => {
    onChange?.(slides[i]?.name ?? "");
  }, [i, onChange, slides]);

  return (
    <div className="slides" ref={root}>
      {slides.map((s, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.src}
          src={s.src}
          alt=""
          className={k === i ? "on" : k === (i - 1 + slides.length) % slides.length ? "prev" : ""}
          loading={k < 2 ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      ))}
    </div>
  );
}
