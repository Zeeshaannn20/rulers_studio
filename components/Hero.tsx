"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import TLink from "./TLink";
import HeroSlides from "./HeroSlides";
import Reel from "./Reel";
import { Arrow } from "./Icons";
import { gsap, afterIntro, prefersReducedMotion } from "@/lib/motion";
import { SITE } from "@/data/site";

// H-01: showreel hero in a rounded frame. Plays /public/media/showreel.mp4 when SITE.showreel
// is set; until then it cross-fades frames from the selected films.
export default function Hero({ embedded = false }: { embedded?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [, setNow] = useState("");
  const onSlide = useCallback((n: string) => setNow(n), []);

  useEffect(() => {
    const el = root.current!;
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      if (embedded) return; // the stage above drives the motion
      // the frame eases open and the copy drifts as you scroll past
      if (!reduce) {
        gsap.to(".hero-copy", { yPercent: -12, opacity: 0.3, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
        gsap.fromTo(".hero-panel", { borderRadius: 28 }, { borderRadius: 44, scale: 0.97, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
      }
      const stop = afterIntro(() => {
        if (reduce) return;
        const t = gsap.timeline();
        t.from(".hero-panel", { clipPath: "inset(6% 4% 6% 4% round 28px)", duration: 1.4, ease: "expo.out" })
          .from(".hero-title .w>span", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.06 }, 0.15)
          .from(".hero-sub, .hero-ctas", { y: 18, opacity: 0, filter: "blur(6px)", duration: 0.9, ease: "power3.out", stagger: 0.05 }, 0.5);
      });
      return () => stop();
    }, el);

    return () => ctx.revert();
  }, [embedded]);

  const words = (t: string, cls?: string) =>
    t.split(" ").map((w, i) => (
      <Fragment key={w + i}>
        <span className="w">
          <span className={cls}>{w}</span>
        </span>{" "}
      </Fragment>
    ));

  return (
    <section className={"hero" + (embedded ? " hero-embed" : "")} ref={root}>
      <div className="hero-panel">
        <div className="reel" aria-hidden="true">
          {SITE.showreel ? <Reel controlled={embedded} /> : <HeroSlides onChange={onSlide} />}
          <div className="leaks">
            <i />
            <i />
            <b />
          </div>
          <div className="reel-grade" />
          <div className="reel-dim" />
        </div>

        <div className="hero-copy">
          <h1 className="hero-title">
            {words("We make films")}
            <br />
            {words("brands")}
            {words("remember", "lime")}
            <span className="sr-only">, AI ad film and AI video production studio</span>
          </h1>

          <div className="hero-bottom">
            <div className="hero-left">
              <p className="hero-sub">
                AI video production studio for brands worldwide. AI ad creatives, product videos, brand stories and UGC ads, directed like real productions and delivered in days.
              </p>
              <div className="hero-ctas">
                <TLink className="btn solid" href="/contact">
                  Start a project <Arrow />
                </TLink>
                <TLink className="btn glass" href="/projects">
                  View our work
                </TLink>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
