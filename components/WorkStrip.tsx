"use client";
import { useEffect, useRef } from "react";
import TLink from "./TLink";
import { Arrow } from "./Icons";
import { FILM_STRIP } from "@/data/site";
import { driveCover, getProject, posterGradient } from "@/data/projects";

// Phones: selected work as a plain swipe row. The browser scrolls it natively (no 3D, no WebGL,
// no scroll takeover), so it stays smooth on any phone. Only the film in view plays.
export default function WorkStrip() {
  const root = useRef<HTMLElement>(null);
  const films = FILM_STRIP.map((f) => ({ ...f, p: getProject(f.slug)! })).filter((f) => f.p);
  const N = films.length;

  useEffect(() => {
    const el = root.current!;
    if (getComputedStyle(el).display === "none") return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ws-card"));
    const vids = cards.map((c) => c.querySelector("video"));
    const bars = Array.from(el.querySelectorAll<HTMLElement>(".ws-bar i"));
    const count = el.querySelector<HTMLElement>(".ws-count b")!;
    let active = -1;
    let onScreen = false;

    const play = () => {
      vids.forEach((v, k) => {
        if (!v) return;
        if (onScreen && k === active) {
          if (v.preload !== "auto") v.preload = "auto";
          v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      });
    };
    const focus = (i: number) => {
      if (i === active) return;
      active = i;
      count.textContent = String(i + 1).padStart(2, "0");
      bars.forEach((b, k) => {
        b.classList.toggle("on", k === i);
        b.classList.toggle("done", k < i);
      });
      cards.forEach((c, k) => c.classList.toggle("on", k === i));
      play();
    };

    // the card that is mostly in view is the one that plays
    const seen = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && focus(cards.indexOf(e.target as HTMLElement))),
      { root: el.querySelector(".ws-track"), threshold: 0.6 }
    );
    cards.forEach((c) => seen.observe(c));
    // nothing plays while the section is off screen
    const near = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      play();
    });
    near.observe(el);
    focus(0);

    return () => {
      seen.disconnect();
      near.disconnect();
      vids.forEach((v) => v?.pause());
    };
  }, []);

  return (
    <section className="ws" ref={root} aria-label="Selected work">
      <div className="ws-head">
        <span className="eyebrow">Selected work</span>
        <span className="ws-count" aria-hidden="true">
          <b>01</b>/{String(N).padStart(2, "0")}
        </span>
      </div>
      <span className="ws-bar" aria-hidden="true">
        {films.map(({ p }, i) => (
          <i key={p.slug} className={i === 0 ? "on" : ""} />
        ))}
      </span>

      <div className="ws-track">
        {films.map(({ p, clip }, i) => (
          <TLink key={p.slug} href={`/projects/${p.slug}`} className={"ws-card" + (i === 0 ? " on" : "")}>
            <span className="ws-media" style={{ ["--g" as string]: posterGradient(p) }}>
              {clip ? (
                <video src={clip} muted loop playsInline preload="none" poster={p.coverImage} />
              ) : p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage.startsWith("/") ? p.coverImage : driveCover(p.slug, 800)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              ) : null}
            </span>
            <span className="ws-cap">
              <b>{p.name}</b>
              <em>
                {p.typeTag}
                {p.industry ? ` · ${p.industry}` : ""}
              </em>
            </span>
          </TLink>
        ))}
      </div>

      <div className="ws-foot">
        <TLink className="btn sm" href="/projects">
          All projects <Arrow />
        </TLink>
        <span className="ws-hint" aria-hidden="true">Swipe</span>
      </div>
    </section>
  );
}
