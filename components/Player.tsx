"use client";
import { useEffect, useRef, useState } from "react";
import { SoundIcon } from "./ProjectCard";
import { Play } from "./Icons";
import { gsap, toast, prefersReducedMotion } from "@/lib/motion";
import { posterGradient, type Project } from "@/data/projects";

// The full film: starts playing silently when it comes into view; one tap turns the sound on.
function FilmVideo({ src, poster }: { src: string; poster?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.4 });
    io.observe(el);
    const sync = () => setSound(!el.muted);
    el.addEventListener("volumechange", sync);
    return () => {
      io.disconnect();
      el.removeEventListener("volumechange", sync);
    };
  }, []);
  const toggle = () => {
    const el = v.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted) el.play().catch(() => {});
  };
  return (
    <>
      <video ref={v} src={src} poster={poster} muted loop playsInline controls preload="metadata" />
      <button type="button" className={"film-sound" + (sound ? " on" : "")} onClick={toggle} aria-label={sound ? "Mute" : "Turn sound on"} aria-pressed={sound}>
        <SoundIcon on={sound} />
        <span>{sound ? "Sound on" : "Tap for sound"}</span>
      </button>
    </>
  );
}

// PD-03: main video. Shows the cover frame until a hosted video is added.
export default function Player({ p }: { p: Project }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el, { clipPath: "inset(10% 6% 10% 6% round 24px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    }, el);
    return () => ctx.revert();
  }, []);

  const vertical = p.aspectRatio === "9:16";
  return (
    <div className={"player" + (vertical ? " vertical" : "")} ref={ref} style={{ ["--g" as string]: posterGradient(p) }}>
      {p.videoUrl ? (
        <FilmVideo src={p.videoUrl} poster={p.coverImage} />
      ) : (
        <>
          {p.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="player-cover" src={p.coverImage} alt="" referrerPolicy="no-referrer" />
          )}
          <button className="pbtn" type="button" aria-label={`Play ${p.title}`} onClick={() => toast("The full film plays here once it's hosted")}>
            <Play />
          </button>
        </>
      )}
    </div>
  );
}
