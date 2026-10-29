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
    // on the opening stage the reel is first seen through the letters, held on the eye close-up,
    // so its poster is that same frame (never a different shot flashing in first)
    const poster = controlled ? (phone ? "/media/showreel-reveal-mobile.jpg" : "/media/showreel-reveal.jpg") : phone ? SITE.showreelPosterMobile : SITE.showreelPoster;
    setSrc(phone ? { v: SITE.showreelMobile, p: poster } : { v: SITE.showreel, p: poster });
  }, [controlled]);

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
