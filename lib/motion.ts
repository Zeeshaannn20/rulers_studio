"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

// Shared smooth-scroll instance (set by <SmoothScroll/>)
let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => (lenis = l);
export const getLenis = () => lenis;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Intro state shared with the hero (hero waits for the intro to lift)
type IntroState = { running: boolean };
import { SHOW_INTRO } from "@/data/site";
export { SHOW_INTRO };
// true until <Intro/> finishes on first load
const intro: IntroState = { running: SHOW_INTRO };
export const introState = intro;
export const INTRO_DONE = "rs:intro-done";

export function afterIntro(fn: () => void) {
  if (intro.running) {
    const h = () => fn();
    document.addEventListener(INTRO_DONE, h, { once: true });
    return () => document.removeEventListener(INTRO_DONE, h);
  }
  fn();
  return () => {};
}

// Simple global toast
export function toast(message: string) {
  document.dispatchEvent(new CustomEvent("rs:toast", { detail: message }));
}

// Poster type: capped size; the longest word never takes more than `share` of the card width (Anton capitals run about 0.5em wide)
export function fitSize(name: string, cap: number, share = 0.92) {
  const lw = Math.max(4, ...name.split(" ").map((w) => w.length));
  return `min(${cap}cqi, ${((share * 100) / (lw * 0.5)).toFixed(2)}cqi)`;
}
