"use client";
import { useEffect, useRef } from "react";
import Hero from "./Hero";
import { R_PATHS, R_VIEWBOX } from "./RMark";
import { gsap, getLenis, afterIntro, prefersReducedMotion } from "@/lib/motion";

// Opening stage on Home (reference: alche.studio). One smooth, reversible timeline driven by
// scroll / swipe / arrow keys, settling on three resting points:
//   01 Mark      the R on a blueprint grid, with wireframe echoes
//   02 Studio    the R bursts into holographic shards, a giant "Rulers Studio." lights up behind
//   03 Showreel  the name lifts away and the showreel opens into the hero
// where each R piece flies when it blasts (x, y in vmin, rotation)
const FLY = [
  [-10, -58, -42],
  [66, -10, 32],
  [58, 54, 50],
  [-62, 48, -36],
];
// each R piece turns around its own centre (percent of the R's box), computed from the path bounds
const SEG_ORIGIN = ["50.7% 13.4%", "60.6% 49.2%", "74.4% 84.8%", "16.1% 73.2%"];
// the R silhouette as a CSS mask, so the glass sheen can run on the GPU instead of repainting the SVG
const R_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${R_VIEWBOX}'>${R_PATHS.map((d) => `<path d='${d}'/>`).join("")}</svg>`
)}")`;
const SHARDS = 18;
const RIBBONS = 6;
const STEPS = 2;
const LABELS = ["Mark", "Studio", "Showreel"];

export default function HeroStage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const reduce = prefersReducedMotion();
    const dots = Array.from(el.querySelectorAll<HTMLButtonElement>(".pager button"));
    const counter = el.querySelector<HTMLElement>(".pager-count b");
    const cleanups: Array<() => void> = [];


    const ctx = gsap.context(() => {
      const shards = gsap.utils.toArray<HTMLElement>(".shard, .ribbon");
      shards.forEach((s) => {
        const a = Math.random() * Math.PI * 2;
        const d = 36 + Math.random() * 70;
        s.dataset.x = String(Math.cos(a) * d);
        s.dataset.y = String(Math.sin(a) * d);
        s.dataset.r = String(gsap.utils.random(-300, 300));
        s.dataset.ry = String(gsap.utils.random(-180, 180));
      });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      // ── 0 → 1: blast ──────────────────────────────────────────────
      tl.to(".stage-hint, .stage-meta", { opacity: 0, y: 12, duration: 0.12 }, 0.04)
        .to(".blast-r", { scale: 1.08, duration: 0.1, ease: "power2.in" }, 0.06)
        .to(".r-echo", { scale: 2.2, opacity: 0, duration: 0.45, ease: "power2.out", stagger: 0.04 }, 0.12)
        .to(".r-glow", { scale: 2.8, opacity: 0, duration: 0.4, ease: "power2.out" }, 0.14)
        .to(".bp", { scale: 1.7, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.12)
        .fromTo(".ring-wave", { scale: 0, opacity: 1 }, { scale: 3.4, opacity: 0, duration: 0.55, ease: "power2.out" }, 0.16)
        .fromTo(".flash", { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.16)
        .to(".flash", { opacity: 0, duration: 0.32 }, 0.21)
        .to(".blast-r .seg", { fill: "url(#holo)", duration: 0.01 }, 0.16)
        .fromTo(".blast-r .facets, .blast-r .r-sheen", { opacity: 1 }, { opacity: 0, duration: 0.06, immediateRender: false }, 0.15);
      // pieces fly as separate GPU layers, in pixels (no unit conversion, no SVG repaint per frame)
      const vmin = () => Math.min(window.innerWidth, window.innerHeight) / 100;
      gsap.utils.toArray<HTMLElement>(".blast-r .seg-w").forEach((p, i) => {
        const [x, y, r] = FLY[i];
        tl.to(p, { x: () => x * vmin(), y: () => y * vmin(), rotation: r, scale: 2.4, duration: 0.62, ease: "power2.out" }, 0.17).to(p, { opacity: 0, duration: 0.18 }, 0.6);
      });
      shards.forEach((s, i) => {
        tl.fromTo(
          s,
          { x: 0, y: 0, opacity: 0, rotation: 0, rotationY: 0, scale: 0.5 },
          {
            x: `${s.dataset.x}vmin`,
            y: `${s.dataset.y}vmin`,
            rotation: Number(s.dataset.r),
            rotationY: Number(s.dataset.ry),
            opacity: 1,
            scale: s.classList.contains("ribbon") ? 1.6 : 1,
            duration: 0.5,
            ease: "power3.out",
          },
          0.17 + (i % 6) * 0.012
        ).to(s, { opacity: 0, duration: 0.2 }, 0.56);
      });
      tl.fromTo(".work-title", { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }, 0.36);

      // ── 1 → 2: the showreel pours INTO the letters of "Rulers Studio" (a black layer with the
      // name cut out of it, multiplied over the video). The video is held on one still frame (a
      // close-up of an eye) so nothing flickers inside the letters; a lime hairline traces them.
      // Then we zoom through the letters, the black falls away, the eye shot plays on and the
      // headline lands over a dimmed, graded video. ──
      tl.set(".knock", { autoAlpha: 1 }, 1.0)
        .set(".knock-line", { autoAlpha: 1 }, 1.0)
        .fromTo(".stage .hero-panel", { opacity: 0, scale: 1, yPercent: 0 }, { opacity: 1, duration: 0.001, immediateRender: false }, 1.0)
        .to(".work-title", { opacity: 0, duration: 0.06 }, 1.0)
        .fromTo(".knock .work-word", { color: "#000000" }, { color: "#ffffff", duration: 0.18, ease: "power1.inOut", immediateRender: false }, 1.0)
        .fromTo([".knock-in", ".knock-line-in"], { scale: 1 }, { scale: 1.035, duration: 0.3, ease: "sine.inOut", immediateRender: false }, 1.0)
        .to([".knock-in", ".knock-line-in"], { scale: 8, duration: 0.24, ease: "power3.in" }, 1.3)
        .to(".knock-line", { opacity: 0, duration: 0.08 }, 1.38)
        .to(".knock", { opacity: 0, duration: 0.12, ease: "power1.in" }, 1.44)
        .fromTo(".stage .reel-dim", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.inOut" }, 1.5)
        .fromTo(".stage .hero-copy", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.24, ease: "power3.out" }, 1.54)
        .to(".pager-wrap", { autoAlpha: 0, duration: 0.14 }, 1.7);
      tl.to({}, { duration: 0.05 }, 1.95); // ends at exactly 2

      if (reduce) {
        tl.progress(1);
        return;
      }

      // ── playhead: the timeline follows a smoothed playhead (not the raw scroll) ──
      // Wheel/trackpad/touch move the playhead with a short lag; keys, dots and the settle
      // move it with their own quick tween — so a key press reacts on the very next frame.
      const head = { t: 0 };
      let shown = -1;
      // the load-in animation hands over to the timeline the moment the visitor moves
      const entrance: gsap.core.Tween[] = [];
      const settleEntrance = () => {
        if (!entrance.length) return;
        entrance.splice(0).forEach((tw) => tw.progress(1).kill());
      };
      // the light sweep across "Rulers Studio." fires the moment the name appears, then repeats
      const workTitle = el.querySelector<HTMLElement>(".work-title")!;
      let titleOn = false;
      let reelClean = false;
      let seeded = false;
      let revealing = false;
      const REVEAL_FRAME = 7.05; // seconds into the showreel: the eye close-up
      const apply = () => {
        if (head.t > 0.001) settleEntrance();
        tl.time(head.t);
        const p = head.t;
        // once the showreel is up, every stage overlay (grain, light rays, vignette) steps aside
        const clean = p > 1.02;
        if (clean !== reelClean) {
          reelClean = clean;
          el.classList.toggle("reel-on", clean);
        }
        // the video is brightened while it is only seen through the letters
        const rev = p > 0.95 && p < 1.42;
        if (rev !== revealing) {
          revealing = rev;
          el.classList.toggle("revealing", rev);
        }
        const on = p > 0.4 && p < 1.04;
        if (on !== titleOn) {
          titleOn = on;
          workTitle.classList.remove("shine-go");
          if (on) requestAnimationFrame(() => workTitle.classList.add("shine-go"));
        }
        const reel = el.querySelector<HTMLVideoElement>(".reel-video");
        if (reel) {
          // hold one calm frame inside the letters, then let the reel run from there
          if (p > 0.2 && !seeded) {
            seeded = true;
            reel.pause();
            reel.preload = "auto";
            const go = () => {
              try {
                reel.currentTime = REVEAL_FRAME;
              } catch {}
            };
            if (reel.readyState >= 1) go();
            else reel.addEventListener("loadedmetadata", go, { once: true });
          }
          if (p >= 1.44 && reel.paused) {
            if (reel.currentTime < REVEAL_FRAME - 0.3 && reel.readyState >= 1) reel.currentTime = REVEAL_FRAME;
            reel.play().catch(() => {});
          } else if (p < 1.44 && !reel.paused) reel.pause();
        }
        // while a key/dot glide runs the pager already shows the destination — never flip it back
        const idx = gliding ? target : Math.min(STEPS, Math.round(p));
        if (idx !== shown) {
          shown = idx;
          dots.forEach((d, i) => d.classList.toggle("on", i === idx));
          if (counter) counter.textContent = "0" + (idx + 1);
        }
      };
      // ── autoplay: no scrolling needed. After the R builds in, the whole opening plays by itself
      // (blast → "Rulers Studio" → video through the letters → headline) in about 3.3 seconds.
      // Scrolling is held while it plays; any wheel, swipe or key press fast-forwards it. ──
      const gliding = false;
      const target = 0;
      const lenis = getLenis();
      let playing = true;
      document.body.classList.add("in-stage");
      window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true, force: true });
      lenis?.stop();
      const finish = () => {
        playing = false;
        lenis?.start();
        document.body.classList.remove("in-stage");
        el.classList.add("stage-done");
        removeSkip();
      };
      const run = gsap
        .timeline({ paused: true, onComplete: finish })
        .to(head, { t: 1, duration: 1.3, ease: "none", onUpdate: apply })
        .to(head, { t: STEPS, duration: 2.0, ease: "none", onUpdate: apply });
      // start right after the R has built in (the load-in below takes about a second)
      const kick = gsap.delayedCall(1.05, () => {
        settleEntrance();
        run.play();
      });
      const skip = (e: Event) => {
        if (!playing) return;
        if (e.type === "keydown" && !["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"].includes((e as KeyboardEvent).key)) return;
        kick.kill();
        settleEntrance();
        run.play().timeScale(3.5);
      };
      const opts = { passive: true } as AddEventListenerOptions;
      window.addEventListener("wheel", skip, opts);
      window.addEventListener("touchmove", skip, opts);
      window.addEventListener("keydown", skip);
      function removeSkip() {
        window.removeEventListener("wheel", skip, opts);
        window.removeEventListener("touchmove", skip, opts);
        window.removeEventListener("keydown", skip);
      }
      // the showreel only plays while the stage is on screen
      const seen = new IntersectionObserver(([en]) => {
        const reel = el.querySelector<HTMLVideoElement>(".reel-video");
        if (!reel) return;
        if (en.isIntersecting && head.t > 0.97) reel.play().catch(() => {});
        else if (!en.isIntersecting) reel.pause();
      });
      seen.observe(el);
      cleanups.push(() => {
        kick.kill();
        run.kill();
        removeSkip();
        seen.disconnect();
        if (playing) lenis?.start();
        document.body.classList.remove("in-stage");
      });

      // pointer parallax: the logo tilts with the mouse
      if (window.matchMedia("(pointer:fine)").matches) {
        const tilt = el.querySelector<HTMLElement>(".stage-tilt")!;
        const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3" });
        const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3" });
        const move = (e: PointerEvent) => {
          if (!document.body.classList.contains("in-stage")) return;
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          ry(nx * 10);
          rx(-ny * 8);
        };
        window.addEventListener("pointermove", move, { passive: true });
        cleanups.push(() => window.removeEventListener("pointermove", move));
      }

      cleanups.push(
        afterIntro(() => {
          if (head.t > 0.05) return; // already on the move: skip the load-in
          entrance.push(
            gsap.fromTo(".bp .ln", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power3.inOut", stagger: 0.02 }),
            gsap.fromTo(".bp-dots rect, .bp-label", { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.015, delay: 0.5 }),
            gsap.fromTo(".r-echo path", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", delay: 0.1 }),
            gsap.fromTo(".blast-r .seg-w", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: "expo.out", stagger: 0.05, delay: 0.15 }),
            gsap.fromTo(".r-glow", { opacity: 0 }, { opacity: 1, duration: 0.9, delay: 0.3 }),
            gsap.fromTo(".blast-r .facets, .blast-r .r-sheen", { opacity: 0 }, { opacity: 1, duration: 0.7, delay: 0.45 }),
            gsap.fromTo(".stage-hint, .stage-meta, .pager", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.5, stagger: 0.06 })
          );
        })
      );
    }, el);

    return () => {
      cleanups.forEach((f) => f());
      ctx.revert();
    };
  }, []);

  // The extra outer div stays a plain child of <main>, so React can unmount the page
  // cleanly even though ScrollTrigger wraps the pinned stage in its own spacer.
  return (
    <div className="stage-host">
    <div className="stage-wrap" ref={root}>
      <div className="stage">
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e5e5e5" />
              <stop offset="0.3" stopColor="#d8ff00" />
              <stop offset="0.55" stopColor="#d8ff00" />
              <stop offset="0.8" stopColor="#d8ff00" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>

        {/* giant title that lights up behind the blast */}
        <div className="work">
          <div className="work-title" aria-hidden="true">
            <div className="work-word">
              <span className="ww-r">Rulers</span> <em>Studio</em>
            </div>
            {/* a band of light that slides across the title (transform-only, so it costs nothing to animate) */}
            <div className="work-shine">
              <div className="work-shine-in">
                <div className="work-word solid">
                  <span className="ww-r">Rulers</span> <em>Studio</em>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stage-tilt">
          <svg className="bp" viewBox="-500 -500 1000 1000" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
              <line className="ln" pathLength={1} x1="-500" y1="0" x2="500" y2="0" />
              <line className="ln" pathLength={1} x1="0" y1="-500" x2="0" y2="500" />
              <line className="ln dim" pathLength={1} x1="-500" y1="-170" x2="500" y2="-170" />
              <line className="ln dim" pathLength={1} x1="-500" y1="170" x2="500" y2="170" />
              <line className="ln dim" pathLength={1} x1="-185" y1="-500" x2="-185" y2="500" />
              <line className="ln dim" pathLength={1} x1="185" y1="-500" x2="185" y2="500" />
              <circle className="ln" pathLength={1} r="240" />
              <circle className="ln dash" r="330" />
              <line className="ln acc" pathLength={1} x1="-90" y1="-260" x2="90" y2="-260" />
              <line className="ln acc" pathLength={1} x1="-90" y1="260" x2="90" y2="260" />
              <line className="ln acc" pathLength={1} x1="-260" y1="-90" x2="-260" y2="90" />
              <line className="ln acc" pathLength={1} x1="260" y1="-90" x2="260" y2="90" />
            </g>
            <g className="bp-dots" fill="currentColor">
              {[
                [-90, -260], [0, -260], [90, -260], [-90, 260], [0, 260], [90, 260],
                [-260, -90], [-260, 0], [-260, 90], [260, -90], [260, 0], [260, 90],
              ].map(([x, y], i) => (
                <rect key={i} x={x - 4} y={y - 4} width="8" height="8" />
              ))}
            </g>
            <g className="bp-labels">
              <text className="bp-label" x="100" y="-268">RS 001</text>
              <text className="bp-label" x="-232" y="-182">Ø 480</text>
              <text className="bp-label" x="196" y="164">R / 4 PIECES</text>
              <text className="bp-label" x="-300" y="300">GRID 24</text>
            </g>
          </svg>
          <div className="r-glow" aria-hidden="true" />
          {/* wireframe echoes of the mark */}
          {[0, 1].map((k) => (
            <svg key={k} className={"r-echo e" + k} viewBox={R_VIEWBOX} aria-hidden="true">
              {R_PATHS.map((d, i) => (
                <path key={i} d={d} pathLength={1} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          ))}
          <div className="blast-r" role="img" aria-label="Rulers Studio">
            {R_PATHS.map((d, i) => (
              <svg key={i} className="seg-w" viewBox={R_VIEWBOX} aria-hidden="true" style={{ transformOrigin: SEG_ORIGIN[i] }}>
                <path className="seg" d={d} />
              </svg>
            ))}
            {/* crystal facets cut into the mark */}
            <svg className="facets-w" viewBox={R_VIEWBOX} aria-hidden="true">
              <defs>
                <clipPath id="rclip">
                  {R_PATHS.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </clipPath>
              </defs>
              <g className="facets" clipPath="url(#rclip)">
                <polygon points="0,0 62,0 30,38" fill="#ffffff" opacity="0.22" />
                <polygon points="62,0 112,0 84,44" fill="#ffffff" opacity="0.1" />
                <polygon points="30,38 84,44 52,100" fill="#ffffff" opacity="0.16" />
                <polygon points="0,58 30,38 18,100" fill="#101010" opacity="0.14" />
                <polygon points="84,44 112,30 112,100" fill="#101010" opacity="0.12" />
                <polygon points="52,100 84,44 112,100" fill="#ffffff" opacity="0.06" />
              </g>
            </svg>
            <div className="r-sheen" aria-hidden="true" style={{ WebkitMaskImage: R_MASK, maskImage: R_MASK }}>
              <i />
            </div>
          </div>
        </div>

        <div className="flash" aria-hidden="true" />
        <div className="ring-wave" aria-hidden="true" />
        <div className="shards" aria-hidden="true">
          {Array.from({ length: SHARDS }, (_, i) => (
            <i key={i} className={"shard" + (i % 3 === 0 ? " lime" : "")} />
          ))}
          {Array.from({ length: RIBBONS }, (_, i) => (
            <i key={"r" + i} className="ribbon" />
          ))}
        </div>

        <Hero embedded />

        {/* "Rulers Studio" cut out of black: multiplied over the showreel, the video shows only inside the letters */}
        <div className="knock" aria-hidden="true">
          <div className="knock-in">
            <div className="work-word">
              <span className="ww-r">Rulers</span> <em>Studio</em>
            </div>
          </div>
        </div>
        {/* a fine lime hairline around the video-filled letters */}
        <div className="knock-line" aria-hidden="true">
          <div className="knock-line-in">
            <div className="work-word">
              <span className="ww-r">Rulers</span> <em>Studio</em>
            </div>
          </div>
        </div>

        <div className="stage-grain" aria-hidden="true" />

        <div className="stage-meta" aria-hidden="true">
          <span>Rulers Studio</span>
          <span>AI Studio</span>
        </div>

        <div className="pager-wrap">
          <nav className="pager" aria-label="Opening">
            {LABELS.map((l, i) => (
              <button key={l} type="button" className={i === 0 ? "on" : ""} aria-label={`Go to ${l}`}>
                <i />
                <span>{l}</span>
              </button>
            ))}
            <div className="pager-count">
              <b>01</b>
              <span>/03</span>
            </div>
          </nav>
        </div>

        <p className="stage-hint">
          <span className="kbd">↓</span>
          <span className="hint-desk">Scroll or press the arrow keys</span>
          <span className="hint-touch">Swipe up</span>
        </p>
      </div>
    </div>
    </div>
  );
}
