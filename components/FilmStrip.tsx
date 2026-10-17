"use client";
import { useEffect, useRef } from "react";
import TLink from "./TLink";
import { gsap, getLenis, prefersReducedMotion } from "@/lib/motion";
import { FILM_STRIP } from "@/data/site";
import { driveCover, getProject, posterGradient } from "@/data/projects";

// H-02: a 35mm film strip of short silent clips that runs endlessly, speeds up and
// leans with scroll velocity. Clips only play while the strip is on screen.
export default function FilmStrip() {
  const band = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  const frames = FILM_STRIP.map((f) => ({ ...f, p: getProject(f.slug) })).filter((f) => f.p);

  useEffect(() => {
    const el = track.current;
    const root = band.current;
    if (!el || !root) return;
    const videos = Array.from(root.querySelectorAll("video"));

    // play clips only while visible (saves battery and bandwidth)
    const reduce = prefersReducedMotion();
    const loop = gsap.to(el, { xPercent: -50, duration: 60, ease: "none", repeat: -1, paused: reduce });
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      videos.forEach((v) => (visible ? v.play().catch(() => {}) : v.pause()));
      if (!reduce) visible ? loop.resume() : loop.pause();
    });
    io.observe(root);
    if (reduce) return () => { io.disconnect(); loop.kill(); };
    const skew = gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3" });
    let boost = 0;
    let lean = 0;
    const lenis = getLenis();
    const onScroll = (e: { velocity: number }) => {
      boost = Math.min(Math.abs(e.velocity) * 0.3, 7);
      lean = gsap.utils.clamp(-6, 6, e.velocity * -0.25);
    };
    lenis?.on("scroll", onScroll);
    let leaning = false;
    const speed = { v: 1 }; // eased down to 0.25 while hovering
    const tick = () => {
      if (!visible) return;
      boost *= 0.92;
      lean *= 0.9;
      loop.timeScale((1 + boost) * speed.v);
      // only touch the skew while it's actually moving
      if (Math.abs(lean) > 0.05) { skew(lean); leaning = true; }
      else if (leaning) { skew(0); leaning = false; }
    };
    gsap.ticker.add(tick);

    // slow down while the visitor is looking at a frame
    const slow = () => gsap.to(speed, { v: 0.25, duration: 0.6, overwrite: true });
    const resume = () => gsap.to(speed, { v: 1, duration: 0.6, overwrite: true });
    el.addEventListener("pointerenter", slow);
    el.addEventListener("pointerleave", resume);

    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
      lenis?.off("scroll", onScroll);
      el.removeEventListener("pointerenter", slow);
      el.removeEventListener("pointerleave", resume);
      loop.kill();
    };
  }, []);

  // two identical halves so the -50% loop is seamless
  const run = [...frames, ...frames];

  return (
    <section className="filmstrip" ref={band} aria-label="Clips from our work">
      <div className="fs-track" ref={track}>
        {run.map((f, i) => {
          const p = f.p!;
          const n = (i % frames.length) + 1;
          return (
            <TLink
              key={i}
              href={`/projects/${p.slug}`}
              className="fs-frame"
              data-cursor="Watch"
              aria-hidden={i >= frames.length}
              tabIndex={i >= frames.length ? -1 : undefined}
            >
              <span className="fs-edge">
                <span>RS {String(n).padStart(2, "0")}</span>
                <span>▸ 24</span>
              </span>
              <span className="fs-pic" style={{ ["--g" as string]: posterGradient(p) }}>
                {f.clip ? (
                  <video src={f.clip} muted loop playsInline preload="metadata" poster={p.coverImage} />
                ) : p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage.startsWith("/") ? p.coverImage : driveCover(p.slug, 800)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                ) : (
                  <span className="fs-name">{p.name}</span>
                )}
              </span>
              <span className="fs-cap">
                <b>{p.name}</b>
                <span>{p.typeTag}</span>
              </span>
            </TLink>
          );
        })}
      </div>
    </section>
  );
}
