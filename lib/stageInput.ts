"use client";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./motion";

// One input model for every pinned "stage" (Hero, Services):
//   • wheel / trackpad / touch scrub the animation smoothly and it HOLDS wherever you stop
//     (no auto-complete, no snapping)
//   • one key press glides gently to the next resting point
//   • at the first / last resting point the page simply scrolls on, so nobody gets trapped
type Opts = {
  st: ScrollTrigger;
  steps: number;
  /** resting point the playhead is at or heading to */
  at: () => number;
  gliding: () => boolean;
  glideTo: (n: number) => void;
  keysLeftRight?: boolean;
  steppedWheel?: boolean;
  /** stop a key glide where it is and hand control back to scrolling */
  interrupt?: () => void;
};

export function bindStageInput(o: Opts) {
  const { st, steps } = o;
  const clamp = (n: number) => Math.max(0, Math.min(steps, n));
  const inside = () => window.scrollY >= st.start - 2 && window.scrollY <= st.end + 2;
  const blocked = (t: EventTarget | null) => {
    if (document.body.classList.contains("intro-on")) return true;
    const el = t instanceof Element ? t : document.body;
    return !!el.closest("input,textarea,select,[contenteditable],[role=listbox],.menu,[data-native-scroll]");
  };
  // where a gesture in direction `dir` should land
  const next = (dir: number) => {
    const p = o.at();
    return clamp(dir > 0 ? Math.floor(p + 0.02) + 1 : Math.ceil(p - 0.02) - 1);
  };

  // ── wheel / trackpad ──
  let locked = false;
  let lastT = 0;
  let lastMag = 0;
  let acc = 0;
  let stepAt = 0;
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || blocked(e.target)) return;
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 32;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    if (Math.abs(e.deltaX) > Math.abs(dy)) return;
    const now = performance.now();
    const mag = Math.abs(dy);
    // a pause, or a sudden jump in speed while inertia is fading, means a new flick
    // (never within 420 ms of the last step, so inertia or a dropped frame can't double-step)
    const since = now - stepAt;
    const fresh = since > 420 && (now - lastT > 220 || (mag > lastMag * 1.8 && mag > 24));
    lastT = now;
    lastMag = mag;
    if (fresh) {
      locked = false;
      acc = 0;
    }
    if (!inside()) return;
    const dir = Math.sign(dy);
    if (!dir) return;
    const p = o.at();
    const atEdge = dir > 0 ? p >= steps - 0.01 : p <= 0.01;
    if (atEdge && !locked && !o.gliding()) return; // let the page carry on past the stage
    e.preventDefault();
    e.stopImmediatePropagation();
    if (locked) return;
    acc += dy;
    if (Math.abs(acc) < 12) return;
    locked = true;
    acc = 0;
    stepAt = now;
    const n = next(dir);
    if (n !== p || o.gliding()) o.glideTo(n);
  };

  // ── keys ──
  let entering = 0;
  const enter = (n: number) => {
    const lenis = getLenis();
    const to = st.start + (st.end - st.start) * (n / steps);
    entering = performance.now() + 950;
    if (lenis) lenis.scrollTo(to, { duration: 0.85, easing: (x: number) => 1 - Math.pow(1 - x, 4), force: true });
    else window.scrollTo({ top: to, behavior: "smooth" });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || blocked(e.target)) return;
    const el = e.target instanceof Element ? e.target : document.body;
    if (e.key === " " && el.closest("button,a")) return;
    const lr = o.keysLeftRight !== false;
    const down = ["ArrowDown", "PageDown"].includes(e.key) || (lr && e.key === "ArrowRight") || (e.key === " " && !e.shiftKey);
    const up = ["ArrowUp", "PageUp"].includes(e.key) || (lr && e.key === "ArrowLeft") || (e.key === " " && e.shiftKey);
    if (!down && !up) return;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const take = () => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    if (performance.now() < entering) return take();
    const p = o.at();
    if (down) {
      if (y < st.start - 2 && y >= st.start - vh * 0.95) {
        take();
        enter(0);
      } else if (inside() && p < steps - 0.01) {
        take();
        if (!(e.repeat && o.gliding())) o.glideTo(next(1));
      }
    } else {
      if (y > st.end + 2 && y <= st.end + vh * 0.95) {
        take();
        enter(steps);
      } else if (inside() && p > 0.01) {
        take();
        if (!(e.repeat && o.gliding())) o.glideTo(next(-1));
      }
    }
  };

  // wheel is left to the page's smooth scrolling (it scrubs the stage and holds where you stop);
  // set `steppedWheel` to switch back to one-flick-one-step
  if (o.steppedWheel) window.addEventListener("wheel", onWheel, { passive: false, capture: true });
  // scrolling during a key glide takes over at once: the animation holds where it is and follows the scroll
  const grab = (e: Event) => {
    if (o.steppedWheel || !o.gliding() || !o.interrupt || blocked(e.target)) return;
    if (e.type === "wheel" && !inside()) return;
    o.interrupt();
  };
  window.addEventListener("wheel", grab, { passive: true, capture: true });
  window.addEventListener("touchstart", grab, { passive: true, capture: true });
  window.addEventListener("keydown", onKey, true);
  return () => {
    window.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
    window.removeEventListener("wheel", grab, { capture: true } as EventListenerOptions);
    window.removeEventListener("touchstart", grab, { capture: true } as EventListenerOptions);
    window.removeEventListener("keydown", onKey, true);
  };
}
