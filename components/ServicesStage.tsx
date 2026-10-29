"use client";
import { useEffect, useRef, useState } from "react";
import TLink from "./TLink";
import { Arrow } from "./Icons";
import { SERVICES } from "@/data/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { createField, SCENES, type Field } from "@/lib/particleField";

// Services as one full-screen stage that plays through the four services on its own (reference: the Pioneer "Corn. Revolutionized." site).
// Each service owns a living background: a WebGL particle formation that disintegrates and
// re-forms into the next one, a colour-graded panel that sweeps up on a slanted edge, ambient dust
// and grain, and a headline that decodes in outline before it fills. Wheel, trackpad, touch and
// the arrow keys all drive the same playhead, one resting point per service.
const STEPS = SCENES - 1;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>=";
const SHORT = ["Ad Creatives", "Product Videos", "Brand Stories", "UGC Ads"];
const TAGS = [
  ["Brand ads", "TVC", "Campaigns"],
  ["Launch films", "Packshots", "Marketplaces"],
  ["Founder stories", "Origin films", "Campaigns"],
  ["Reels", "Meta ads", "Variations"],
];

export default function ServicesStage() {
  const root = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStill(true);
      return;
    }
    const el = root.current!;
    const canvas = el.querySelector<HTMLCanvasElement>(".sv-canvas")!;
    const panels = Array.from(el.querySelectorAll<HTMLElement>(".sv-bg"));
    const wraps = panels.map((p) => p.parentElement as HTMLElement);
    const title = el.querySelector<HTMLElement>(".sv-title")!;
    const no = el.querySelector<HTMLElement>(".sv-no")!;
    const body = el.querySelector<HTMLElement>(".sv-body")!;
    const tags = el.querySelector<HTMLElement>(".sv-tags")!;
    const count = el.querySelector<HTMLElement>(".sv-count b")!;
    const navs = Array.from(el.querySelectorAll<HTMLButtonElement>(".sv-nav button"));
    const cleanups: Array<() => void> = [];
    // false once this stage is torn down (page change, hot reload): late tweens must not touch it
    let alive = true;

    // the particle field is built only when the visitor gets close, in idle time,
    // so it never competes with the opening animation for the main thread
    let field: Field | null = null;

    // ── headline: old letters blow away, new ones decode in outline, then fill ──
    let token = 0;
    let decodeRaf = 0;
    const charsOf = (text: string) =>
      text
        .split(" ")
        .map((w) => `<span class="w">${w.split("").map((c) => `<span class="c ol">${c}</span>`).join("")}</span>`)
        .join(" ");
    const showText = (i: number, instant = false) => {
      if (!alive) return;
      const s = SERVICES[i];
      const my = ++token;
      cancelAnimationFrame(decodeRaf);
      no.textContent = s.no;
      const old = Array.from(title.querySelectorAll<HTMLElement>(".c"));
      gsap.killTweensOf([old, body, tags.children]);
      const swap = () => {
        if (my !== token) return;
        title.innerHTML = charsOf(s.title);
        const cs = Array.from(title.querySelectorAll<HTMLElement>(".c"));
        const real = cs.map((c) => c.textContent || "");
        body.textContent = s.body;
        tags.innerHTML = TAGS[i].map((t) => `<li>${t}</li>`).join("");
        gsap.fromTo(body, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.12 });
        gsap.fromTo(tags.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.05, delay: 0.2 });
        if (instant) {
          cs.forEach((c) => c.classList.remove("ol"));
          return;
        }
        const t0 = performance.now();
        const tick = () => {
          if (my !== token) return;
          const t = (performance.now() - t0) / 1000;
          let done = true;
          cs.forEach((c, k) => {
            const start = k * 0.022;
            if (t < start) {
              c.style.opacity = "0";
              done = false;
            } else if (t < start + 0.32) {
              c.style.opacity = "1";
              if (real[k] !== " " && Math.random() < 0.5) c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
              done = false;
            } else if (c.classList.contains("ol") || c.textContent !== real[k]) {
              c.style.opacity = "1";
              c.textContent = real[k];
              if (t > start + 0.5) c.classList.remove("ol");
              else done = false;
            }
          });
          if (!done) decodeRaf = requestAnimationFrame(tick);
        };
        decodeRaf = requestAnimationFrame(tick);
      };
      if (instant || !old.length) return swap();
      gsap.to(old, {
        opacity: 0,
        y: () => -10 - Math.random() * 30,
        x: () => (Math.random() - 0.5) * 40,
        filter: "blur(8px)",
        duration: 0.32,
        ease: "power2.in",
        stagger: { each: 0.008, from: "random" },
      });
      gsap.to([body, tags.children], { opacity: 0, y: -8, duration: 0.22, ease: "power2.in" });
      window.setTimeout(swap, 230);
    };
    cleanups.push(() => {
      token++;
      cancelAnimationFrame(decodeRaf);
    });

    // ── playhead → everything that is drawn (particles, colour panels, headline, tabs) ──
    const head = { t: 0 };
    let shown = -1;
    let gliding = false;
    let target = 0;
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const apply = () => {
      if (!alive || !el.isConnected) return;
      const t = head.t;
      const from = Math.min(STEPS, Math.floor(t));
      const to = Math.min(STEPS, from + 1);
      const m = Math.max(0, Math.min(1, (t - from - 0.2) / 0.6));
      field?.set(from, to, m);
      // slanted colour panels sweeping up from the bottom (right edge leads); transforms only
      const vh = window.innerHeight;
      const es = panels.map((_, i) => (i === 0 ? 1 : ease(Math.max(0, Math.min(1, (t - (i - 1) - 0.08) / 0.84)))));
      let top = 0;
      es.forEach((e, i) => e >= 1 && (top = i));
      for (let i = 0; i < panels.length; i++) {
        const e = es[i];
        const w = wraps[i];
        const show = i >= top && e > 0;
        const vis = show ? "visible" : "hidden";
        if (w.style.visibility !== vis) w.style.visibility = vis;
        if (!show || i === 0) continue;
        const Y = (1 - e) * vh * 1.45;
        w.style.transform = `translate3d(0,${Y.toFixed(1)}px,0) rotate(-5deg)`;
        panels[i].style.transform = `rotate(5deg) translate3d(0,${(-Y).toFixed(1)}px,0)`;
      }
      const idx = gliding ? target : Math.min(STEPS, Math.round(t));
      if (idx !== shown) {
        const first = shown < 0;
        shown = idx;
        count.textContent = "0" + (idx + 1);
        navs.forEach((b, k) => b.classList.toggle("on", k === idx));
        const bar = navs[idx]?.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: navs[idx].offsetLeft - 20, behavior: "smooth" });
        showText(idx, first);
      }
    };

    // ── autoplay: one screen, no long scroll. Each service holds for HOLD seconds while a bar fills
    // under its tab, then the next one plays in. Click a tab to jump, swipe on
    // phones, and hovering the text or tabs holds the current one. ──
    const HOLD = 2.8;
    const bars = navs.map((b) => b.querySelector<HTMLElement>(".sv-prog"));
    const fx = Array.from(el.querySelectorAll<HTMLElement>(".sv-bgw, .sv-canvas"));
    const prog = { p: 0 };
    let timer: gsap.core.Tween | null = null;
    let glide: gsap.core.Animation | null = null;
    let hovering = false;
    let visible = false;
    const setProg = () => {
      bars.forEach((b, k) => b && (b.style.transform = `scaleX(${k === target ? prog.p : 0})`));
    };
    const running = () => visible && !hovering && !document.hidden;
    const sync = () => {
      if (!timer) return;
      if (running() && !gliding) timer.play();
      else timer.pause();
    };
    const startTimer = () => {
      timer?.kill();
      prog.p = 0;
      setProg();
      timer = gsap.to(prog, { p: 1, duration: HOLD, ease: "none", paused: true, onUpdate: setProg, onComplete: () => glideTo(target + 1) });
      sync();
    };
    const done = () => {
      gliding = false;
      startTimer();
    };
    const glideTo = (n: number) => {
      if (!alive) return;
      const next = ((n % SCENES) + SCENES) % SCENES;
      const wrapped = n !== next;
      timer?.kill();
      timer = null;
      glide?.kill();
      target = next;
      prog.p = 0;
      setProg();
      gliding = true;
      apply(); // tabs and headline switch at once
      if (wrapped || Math.abs(head.t - next) > 1.5) {
        // last → first, or a long jump: cut through black instead of rewinding every panel
        glide = gsap
          .timeline({ onComplete: done })
          .to(fx, { opacity: 0, duration: 0.28, ease: "power2.in" })
          .call(() => {
            head.t = next;
            apply();
          })
          .to(fx, { opacity: 1, duration: 0.45, ease: "power2.out" });
      } else {
        glide = gsap.to(head, { t: next, duration: 0.95, ease: "power1.inOut", onUpdate: apply, onComplete: done });
      }
    };
    navs.forEach((b, i) => {
      const h = () => (i === target && !gliding ? startTimer() : glideTo(i));
      b.addEventListener("click", h);
      cleanups.push(() => b.removeEventListener("click", h));
    });
    // hold while the visitor is reading the text or choosing a tab
    const holdEls = Array.from(el.querySelectorAll<HTMLElement>(".sv-copy, .sv-nav"));
    const enter = () => {
      hovering = true;
      sync();
    };
    const leave = () => {
      hovering = false;
      sync();
    };
    holdEls.forEach((h) => {
      h.addEventListener("pointerenter", enter);
      h.addEventListener("pointerleave", leave);
    });
    // swipe left / right on phones
    let sx = 0;
    let sy = 0;
    const down = (e: PointerEvent) => {
      sx = e.clientX;
      sy = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - sy) * 1.3) glideTo(target + (dx < 0 ? 1 : -1));
    };
    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("visibilitychange", sync);
    cleanups.push(() => {
      holdEls.forEach((h) => {
        h.removeEventListener("pointerenter", enter);
        h.removeEventListener("pointerleave", leave);
      });
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      document.removeEventListener("visibilitychange", sync);
      timer?.kill();
      glide?.kill();
      gsap.killTweensOf([head, prog, fx]);
    });

    // build the field when the stage is ~1.5 screens away; render only while it is on screen
    const mobile = window.matchMedia("(max-width: 860px)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    let built = false;
    const build = () => {
      if (built) return;
      built = true;
      field = createField(canvas, mobile || cores <= 4 ? 4200 : 8200);
      if (!field) return el.classList.add("no-gl");
      field.resize();
      apply();
      const onResize = () => {
        field?.resize();
        apply();
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));
      if (visible) field.start();
    };
    const idle = (fn: () => void) => {
      const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 600 });
      else setTimeout(fn, 60);
    };
    const near = new IntersectionObserver(([en]) => en.isIntersecting && idle(build), { rootMargin: "150% 0px" });
    near.observe(el);
    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting;
        if (visible && !built) build();
        if (visible) field?.start();
        else field?.stop();
        if (visible && !timer && !gliding) startTimer();
        else sync();
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    const onPtr = (ev: PointerEvent) => field?.pointer((ev.clientX / window.innerWidth) * 2 - 1, (ev.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener("pointermove", onPtr, { passive: true });
    cleanups.push(() => {
      near.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPtr);
      field?.destroy();
    });

    apply();
    return () => {
      alive = false;
      cleanups.forEach((f) => f());
      cancelAnimationFrame(decodeRaf);
    };
  }, []);

  if (still) {
    return (
      <section className="sec sv-still">
        <div className="wrap">
          <span className="eyebrow">What we do</span>
          <ol>
            {SERVICES.map((s) => (
              <li key={s.no}>
                <span>{s.no}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <div className="sv-host">
      <section className="sv" ref={root} aria-label="Services">
        {SERVICES.map((s, i) => (
          <div className={i ? "sv-bgw" : "sv-bgw first"} key={s.no} aria-hidden="true">
            <div className={"sv-bg sv-bg-" + i} />
          </div>
        ))}
        <canvas className="sv-canvas" aria-hidden="true" />
        <div className="sv-vignette" aria-hidden="true" />
        <div className="sv-grain" aria-hidden="true" />

        <div className="sv-top">
          <span className="eyebrow">What we do</span>
          <span className="sv-count">
            <b>01</b>/0{SCENES}
          </span>
        </div>

        <div className="sv-copy" aria-hidden="true">
          <span className="sv-no">(01)</span>
          <h2 className="sv-title" />
          <p className="sv-body" />
          <ul className="sv-tags" />
          <TLink className="btn sm sv-cta" href="/contact">
            Start a project <Arrow />
          </TLink>
        </div>

        <ol className="sr-only">
          {SERVICES.map((s) => (
            <li key={s.no}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>

        <nav className="sv-nav" aria-label="Services">
          {SHORT.map((n, i) => (
            <button type="button" key={i}>
              <i>0{i + 1}</i>
              <span>{n}</span>
              <b className="sv-prog" aria-hidden="true" />
            </button>
          ))}
        </nav>

      </section>
    </div>
  );
}
