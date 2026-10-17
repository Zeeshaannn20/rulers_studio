"use client";
import { useEffect, useRef, useState } from "react";
import TLink from "./TLink";
import RMark from "./RMark";
import { Arrow, Instagram, LinkedIn, XLogo, YouTube } from "./Icons";
import { gsap, getLenis, prefersReducedMotion, SHOW_INTRO } from "@/lib/motion";
import { SITE } from "@/data/site";

const RING = "AI FILM STUDIO  ·  FILMS BRANDS REMEMBER  ·  EST. 2026  ·  ";

// Closing credits: a glowing R seal with a slowly turning ring of words, one line of invitation,
// the details laid out like end credits, and a quiet bottom bar.
export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const [time, setTime] = useState("");

  // Bengaluru local time, updated every 20 s
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => setTime(fmt.format(new Date()).toUpperCase());
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);

  // everything rises gently into place as the footer arrives
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      tl.from(".fx-seal", { scale: 0.8, opacity: 0, duration: 1.4, ease: "expo.out" })
        .from(".fx-line > span", { yPercent: 110, duration: 1.1, stagger: 0.1, ease: "expo.out" }, 0.15)
        .from(".fx-cta > *", { y: 18, opacity: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" }, 0.45)
        .from(".fx-credit", { y: 22, opacity: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" }, 0.6);
    }, el);
    return () => ctx.revert();
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="ftr fx" ref={root}>
      <div className="fx-glow" aria-hidden="true" />
      <div className="in">
        <div className="fx-hero">
          <div className="fx-seal" aria-hidden="true">
            <svg className="fx-ring" viewBox="0 0 200 200">
              <defs>
                <path id="fx-circle" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
              </defs>
              <text>
                <textPath href="#fx-circle" textLength="512">
                  {RING}
                </textPath>
              </text>
            </svg>
            <span className="fx-halo" />
            <RMark className="fx-r" />
          </div>

          <h2 className="fx-title">
            <span className="fx-line">
              <span>Got a product?</span>
            </span>
            <span className="fx-line">
              <span>
                Let&apos;s make it a <em>film</em>
              </span>
            </span>
          </h2>

          <div className="fx-cta">
            <TLink className="btn solid" href="/contact">
              Start a project <Arrow />
            </TLink>
          </div>
        </div>

        <div className="fx-credits">
          <div className="fx-credit">
            <h5>The studio</h5>
            <p>AI film studio for brands. Ad films, brand stories, micro dramas, UGC and AI avatars.</p>
            <span className="fx-open">
              <b /> Booking new projects
            </span>
          </div>
          <div className="fx-credit">
            <h5>Explore</h5>
            <TLink href="/">Home</TLink>
            <TLink href="/projects">Projects</TLink>
            <TLink href="/join-the-crew">Join the Crew</TLink>
            <TLink href="/contact">Contact</TLink>
          </div>
          <div className="fx-credit">
            <h5>Say hello</h5>
            <a className="fx-ig" href={SITE.instagram} target="_blank" rel="noopener noreferrer">
              <Instagram /> Instagram
            </a>
            <a className="fx-ig" href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedIn /> LinkedIn
            </a>
            <a className="fx-ig" href={SITE.x} target="_blank" rel="noopener noreferrer">
              <XLogo /> X
            </a>
            <a className="fx-ig" href={SITE.youtube} target="_blank" rel="noopener noreferrer">
              <YouTube /> YouTube
            </a>
          </div>
          <div className="fx-credit">
            <h5>Bengaluru</h5>
            <p className="fx-time" suppressHydrationWarning>
              {time || " "} <small>IST</small>
            </p>
            <p>Working with brands across India and worldwide.</p>
          </div>
        </div>

        <div className="fbot fx-bot">
          <span>© 2026 Rulers Studio. All rights reserved.</span>
          <nav>
            <TLink href="/terms">Terms</TLink>
            <TLink href="/privacy">Privacy</TLink>
            {SHOW_INTRO && (
              <button type="button" onClick={() => document.dispatchEvent(new Event("rs:replay-intro"))}>
                Replay intro
              </button>
            )}
            <button type="button" className="fx-top" onClick={toTop} aria-label="Back to top">
              Back to top <span aria-hidden="true">↑</span>
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
