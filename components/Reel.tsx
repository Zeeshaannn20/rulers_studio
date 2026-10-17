"use client";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/data/site";

// Hero showreel: picks the 9:16 cut on phones and the 16:9 cut elsewhere,
// and only plays while the hero is on screen.
export default function Reel({ controlled = false }: { controlled?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<{ v: string; p: string } | null>(null);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches;
    setSrc(phone ? { v: SITE.showreelMobile, p: SITE.showreelPosterMobile } : { v: SITE.showreel, p: SITE.showreelPoster });
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || controlled) return; // the opening stage decides when it plays
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, [src, controlled]);

  if (!src) return null;
  return <video ref={ref} className="reel-video" src={src.v} poster={src.p} autoPlay={!controlled} muted loop playsInline preload={controlled ? "metadata" : "auto"} />;
}
