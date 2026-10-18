"use client";
import { gsap, prefersReducedMotion } from "./motion";

// Page loader (reference: the Monster Energy logo reveal), GPU-friendly:
//   1. the screen falls to darkness
//   2. shafts of warm light sweep in from the left, embers drift through them
//   3. the R is traced in light, flashes white-hot, then cools to sand-gold
//   4. the new page is pushed while the logo holds; on mount it lifts away
// Everything moving is transform/opacity, except the R outline trace (a 300px SVG).
let coverTl: gsap.core.Timeline | null = null;
let readyAt = 0; // when the logo has settled and the loader may lift

const q = (el: Element, sel: string) => Array.from(el.querySelectorAll<HTMLElement | SVGElement>(sel));

function build(el: HTMLElement) {
  const beams = q(el, ".cl-beams i");
  const sparks = q(el, ".cl-sparks i");
  const edge = q(el, ".cl-edge path");
  const halo = q(el, ".cl-halo path");
  const tl = gsap.timeline();
  tl.set(el, { autoAlpha: 1, opacity: 0 })
    .set(".cl-stage", { scale: 1, opacity: 1 })
    .set([edge, halo], { strokeDasharray: 1, strokeDashoffset: 1, opacity: 1 })
    .set(".cl-hot", { opacity: 0 })
    .set(".cl-gold", { opacity: 0 })
    .set(".cl-glow", { opacity: 0, scale: 0.5 })
    .to(el, { opacity: 1, duration: 0.28, ease: "power2.out" }, 0);
  // light shafts sweep across from the left, flicker, then fade
  beams.forEach((b, i) => {
    tl.fromTo(
      b,
      { rotation: -38 + i * 9, opacity: 0, scaleX: 0.4 },
      { rotation: 6 + i * 7, opacity: 0.95 - i * 0.2, scaleX: 1, duration: 0.9, ease: "power2.out" },
      0.12 + i * 0.07
    ).to(b, { opacity: 0, duration: 0.45, ease: "power1.in" }, 0.95 + i * 0.05);
  });
  // embers: drift up and out from the logo, twinkle
  sparks.forEach((s, i) => {
    const a = Math.random() * Math.PI * 2;
    const d = 40 + Math.random() * 120;
    const at = 0.2 + (i % 8) * 0.05;
    const dur = 1.1 + Math.random() * 0.5;
    tl.fromTo(
      s,
      { x: Math.cos(a) * 20, y: Math.sin(a) * 20, scale: 0.4 + Math.random() * 0.8 },
      { x: Math.cos(a) * d + (Math.random() - 0.5) * 40, y: Math.sin(a) * d - 40 - Math.random() * 60, duration: dur, ease: "power1.out" },
      at
    )
      .fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, at)
      .to(s, { opacity: 0, duration: dur - 0.35, ease: "power1.in" }, at + 0.35);
  });
  // the R is traced in light (glow underneath, bright edge on top), piece by piece
  tl.to(halo, { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut", stagger: 0.06 }, 0.32)
    .to(edge, { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut", stagger: 0.06 }, 0.32)
    .to(".cl-glow", { opacity: 1, scale: 1.15, duration: 0.5, ease: "power2.out" }, 0.55)
    // white-hot flash, then it cools to gold
    .to(".cl-hot", { opacity: 1, duration: 0.14, ease: "power2.out" }, 0.82)
    .set(".cl-gold", { opacity: 1 }, 0.96)
    .to(".cl-hot", { opacity: 0, duration: 0.45, ease: "power2.inOut" }, 0.98)
    .to([edge, halo], { opacity: 0, duration: 0.4, ease: "power1.out" }, 0.98)
    .to(".cl-glow", { opacity: 0.55, scale: 1, duration: 0.5, ease: "power2.inOut" }, 0.98);
  return tl;
}

// Navigation goes straight away. The R loader only appears if the next page has not
// shown up within SLOW_MS (slow network); on a normal click there is no loader at all.
const SLOW_MS = 400;
let slowTimer = 0;
let pending = false;

export function coverThen(go: () => void) {
  const el = document.getElementById("curtain");
  if (!el || prefersReducedMotion()) return go();
  window.clearTimeout(slowTimer);
  pending = true;
  slowTimer = window.setTimeout(() => {
    if (!pending) return;
    coverTl?.kill();
    el.classList.add("live");
    coverTl = build(el);
    readyAt = performance.now() + 700; // once it shows, let the R form briefly so it doesn't flicker
    // safety net: never leave the logo on screen if the new page is slow to report in
    window.clearTimeout(guard);
    guard = window.setTimeout(uncover, 6000);
  }, SLOW_MS);
  go();
}
let guard = 0;

export function uncover() {
  pending = false;
  window.clearTimeout(slowTimer);
  window.clearTimeout(guard);
  const el = document.getElementById("curtain");
  if (!el || !el.classList.contains("live")) return;
  const wait = Math.max(0, readyAt - performance.now()) / 1000;
  gsap
    .timeline({ delay: wait, onComplete: () => el.classList.remove("live") })
    .to(".cl-stage", { scale: 1.12, opacity: 0, duration: 0.5, ease: "power2.in" }, 0)
    .to(el, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 0.12)
    .set(el, { autoAlpha: 0 });
}
