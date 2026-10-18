"use client";
import { useEffect, useRef, useState } from "react";
import TLink from "./TLink";
import { posterGradient, type Project } from "@/data/projects";

// Only one film plays with sound at a time across the page
const SOUND_EVENT = "rs:film-sound";

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      )}
    </svg>
  );
}

// Project card: a light, silent preview loop plays while the card is on screen. The full film
// (with sound) is only downloaded when someone taps for sound, so the page stays fast.
export default function ProjectCard({ p }: { p: Project }) {
  const vid = useRef<HTMLVideoElement>(null);
  const [imgOk, setImgOk] = useState(true);
  const [sound, setSound] = useState(false);
  const src = p.previewUrl || p.videoUrl;
  const swapToFilm = !!(p.videoUrl && p.previewUrl && p.videoUrl !== p.previewUrl);
  const vertical = p.aspectRatio === "9:16";

  // play while visible, pause (and go quiet) when scrolled away
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload !== "auto") v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
          if (!v.muted) {
            v.muted = true;
            setSound(false);
          }
        }
      },
      { threshold: 0.55 }
    );
    io.observe(v);
    const other = (e: Event) => {
      if ((e as CustomEvent).detail !== p.slug && !v.muted) {
        v.muted = true;
        setSound(false);
      }
    };
    document.addEventListener(SOUND_EVENT, other);
    return () => {
      io.disconnect();
      document.removeEventListener(SOUND_EVENT, other);
    };
  }, [p.slug]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = vid.current;
    if (!v) return;
    const on = v.muted;
    if (on && swapToFilm && p.videoUrl && !v.src.endsWith(p.videoUrl)) {
      // first tap: swap the silent preview for the full film and play it from the start
      v.src = p.videoUrl;
      v.preload = "auto";
    }
    v.muted = !on;
    if (on) {
      document.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: p.slug }));
      v.play().catch(() => {});
    }
    setSound(on);
  };

  return (
    <TLink className="card" href={`/projects/${p.slug}`} data-cursor="Watch" data-reveal="">
      <div className="card-bar">
        <span className="card-title">{p.title}</span>
        <span className="tag">{p.typeTag}</span>
      </div>
      <div className={"card-media" + (vertical ? " v" : "") + (src ? " has-film" : "")} style={{ ["--g" as string]: posterGradient(p) }}>
        {p.coverImage && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImage} alt={`${p.title} still`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
        ) : (
          <span className="card-name">{p.name}</span>
        )}
        {src && <video ref={vid} src={src} poster={p.coverImage} muted loop playsInline preload="none" />}
        {p.videoUrl && (
          <button type="button" className={"card-sound" + (sound ? " on" : "")} onClick={toggle} aria-label={sound ? "Mute" : "Turn sound on"} aria-pressed={sound}>
            <SoundIcon on={sound} />
            <span>{sound ? "Sound on" : "Tap for sound"}</span>
          </button>
        )}
        <span className="card-watch">
          Watch film
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 1.5v13L14 8z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </TLink>
  );
}
