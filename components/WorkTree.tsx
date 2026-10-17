"use client";
import { useEffect, useRef } from "react";
import TLink from "./TLink";
import { Arrow } from "./Icons";
import { FILM_STRIP } from "@/data/site";
import { driveCover, getProject, posterGradient } from "@/data/projects";
import { gsap, ScrollTrigger, getLenis, prefersReducedMotion } from "@/lib/motion";
import { bindStageInput } from "@/lib/stageInput";
import { createTrunk, type Trunk } from "@/lib/trunkField";

// Selected work as a 3D tree (reference: activetheory.net/work). Glass panels branch off a
// glowing organic trunk; scrolling, swiping or the arrow keys spiral the camera down the trunk,
// one film at a time — and it holds wherever you stop. Panels are CSS 3D (GPU layers), the trunk
// is a small WebGL point cloud drawn with the very same camera, so both move as one scene.
const ANG = 58; // degrees between branches
const GAPY = 150; // px each branch sits below the previous

export default function WorkTree() {
  const root = useRef<HTMLDivElement>(null);
  const films = FILM_STRIP.map((f) => ({ ...f, p: getProject(f.slug)! })).filter((f) => f.p);
  const N = films.length;
  const STEPS = N - 1;

  useEffect(() => {
    const el = root.current!;
    const world = el.querySelector<HTMLElement>(".wt-world")!;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".wt-card"));
    const vids = cards.map((c) => c.querySelector("video"));
    const names = Array.from(el.querySelectorAll<HTMLElement>(".wt-list button"));
    const count = el.querySelector<HTMLElement>(".wt-count b")!;
    const canvas = el.querySelector<HTMLCanvasElement>(".wt-canvas")!;
    const cleanups: Array<() => void> = [];
    const reduce = prefersReducedMotion();

    // geometry follows the viewport
    let R = 420;
    let persp = 1100;
    let off = 0; // panels hang off the side of the trunk, so the trunk stays in view
    let shift = 0; // how far the whole tree sits right of centre
    const base: string[] = []; // each panel's place on the tree
    const sizes: number[] = []; // last scale written, so unchanged panels aren't touched
    const measure = () => {
      const w = window.innerWidth;
      const mobile = w < 861;
      // big, cinematic panels: the film is the hero, the trunk peeks out from behind it
      const cw = mobile ? Math.min(w * 0.88, 560) : Math.min(w * 0.56, 1000);
      el.style.setProperty("--cw", cw + "px");
      R = cw * (mobile ? 0.6 : 0.62);
      off = cw * (mobile ? 0.12 : 0.34);
      // centre the facing film a little right of middle, clear of the list on the left
      shift = (mobile ? 0 : w * 0.06) + off;
      el.style.setProperty("--wt-shift", shift.toFixed(1) + "px");
      persp = Math.max(900, w * 0.8);
      el.style.setProperty("--persp", persp + "px");
      cards.forEach((c, i) => {
        base[i] = `rotateY(${i * ANG}deg) translateZ(${R.toFixed(1)}px) translate3d(${(-off).toFixed(1)}px,${i * GAPY}px,0)`;
      });
      sizes.fill(-1);
    };
    measure();

    // ── trunk (built lazily, rendered only while on screen) ──
    let trunk: Trunk | null = null;
    const cores = navigator.hardwareConcurrency || 4;
    const build = () => {
      if (trunk || reduce) return;
      trunk = createTrunk(canvas, window.innerWidth < 861 || cores <= 4 ? 4200 : 9000, -window.innerHeight, STEPS * GAPY + window.innerHeight);
      if (trunk) {
        trunk.resize();
        apply();
      }
    };

    // ── camera: one transform on the world per frame; panels never move on their own ──
    const head = { t: 0 };
    let shown = -1;
    let gliding = false;
    let target = 0;
    const apply = () => {
      const t = head.t;
      const rot = -t * ANG;
      const y = t * GAPY;
      world.style.transform = `translate3d(0,0,${(-R).toFixed(1)}px) rotateY(${rot.toFixed(3)}deg) translate3d(0,${(-y).toFixed(1)}px,0)`;
      trunk?.setCam({ rot: (rot * Math.PI) / 180, y, back: R, persp, offX: shift });
      // focus: the panel facing you is solid, its neighbours turn to glass, the far side hides
      // size follows distance from the centre: a film arrives small, grows to full size as it
      // reaches the middle, then shrinks and fades away as it leaves
      const ss = (e0: number, e1: number, x: number) => {
        const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
        return k * k * (3 - 2 * k);
      };
      cards.forEach((c, i) => {
        const u = Math.abs(i - t);
        const sc = 1 - 0.58 * ss(0, 1.15, u);
        const sk = Math.round(sc * 1000) / 1000;
        if (sizes[i] !== sk) {
          sizes[i] = sk;
          c.style.transform = `${base[i]} scale(${sk})`;
        }
        const o = u > 1.55 ? 0 : 1 - ss(0.05, 1.55, u);
        const os = o.toFixed(3);
        if (c.style.opacity !== os) c.style.opacity = os;
        const vis = o > 0 ? "visible" : "hidden";
        if (c.style.visibility !== vis) c.style.visibility = vis;
      });
      const idx = gliding ? target : Math.min(STEPS, Math.max(0, Math.round(t)));
      if (idx !== shown) {
        shown = idx;
        count.textContent = String(idx + 1).padStart(2, "0");
        names.forEach((b, k) => b.classList.toggle("on", k === idx));
        cards.forEach((c, k) => c.classList.toggle("focus", k === idx));
        vids.forEach((v, k) => {
          if (!v) return;
          if (k === idx) {
            if (v.preload !== "auto") v.preload = "auto";
            v.play().catch(() => {});
          } else if (!v.paused) v.pause();
        });
      }
    };

    if (reduce) {
      apply();
      return;
    }

    const wheel = { t: 0 };
    const follow = gsap.quickTo(wheel, "t", {
      duration: 0.16,
      ease: "power1.out",
      onUpdate: () => {
        if (gliding) return;
        head.t = wheel.t;
        apply();
      },
    });
    let glide: gsap.core.Tween | null = null;

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => "+=" + Math.round(window.innerHeight * 0.95 * STEPS),
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        measure();
        trunk?.resize();
        if (!gliding) {
          head.t = wheel.t = self.progress * STEPS;
          apply();
        }
      },
      onUpdate: (self) => {
        if (!gliding) follow(self.progress * STEPS);
      },
    });
    const posOf = (n: number) => st.start + (st.end - st.start) * (n / STEPS);

    const glideTo = (n: number) => {
      target = Math.max(0, Math.min(STEPS, n));
      const dist = Math.abs(head.t - target);
      gliding = true;
      glide?.kill();
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(posOf(target), { immediate: true, force: true });
        document.documentElement.classList.add("rs-glide");
        lenis.stop();
      } else window.scrollTo(0, posOf(target));
      apply();
      glide = gsap.to(head, {
        t: target,
        duration: 1.1 + Math.max(0, Math.min(dist, 3) - 1) * 0.4,
        ease: "power2.inOut",
        onUpdate: apply,
        onComplete: () => {
          follow(target, target);
          lenis?.start();
          document.documentElement.classList.remove("rs-glide");
          gliding = false;
        },
      });
    };
    cleanups.push(
      bindStageInput({
        st,
        steps: STEPS,
        at: () => (gliding ? target : head.t),
        gliding: () => gliding,
        glideTo,
        interrupt: () => {
          glide?.kill();
          gliding = false;
          const lenis = getLenis();
          document.documentElement.classList.remove("rs-glide");
          if (lenis) {
            lenis.start();
            lenis.scrollTo(posOf(head.t), { immediate: true, force: true });
          } else window.scrollTo(0, posOf(head.t));
          follow(head.t, head.t);
        },
      })
    );

    // the list and the side panels jump to their film; the facing panel opens the project
    names.forEach((b, i) => {
      const h = () => glideTo(i);
      b.addEventListener("click", h);
      cleanups.push(() => b.removeEventListener("click", h));
    });
    cards.forEach((c, i) => {
      const h = () => {
        if (i !== shown) glideTo(i);
      };
      c.addEventListener("click", h, true);
      cleanups.push(() => c.removeEventListener("click", h, true));
    });

    // pointer: the whole tree leans a touch toward the mouse
    const scene = el.querySelector<HTMLElement>(".wt-lean")!;
    if (window.matchMedia("(pointer:fine)").matches) {
      const rx = gsap.quickTo(scene, "rotationX", { duration: 1, ease: "power3" });
      const ry = gsap.quickTo(scene, "rotationY", { duration: 1, ease: "power3" });
      const move = (e: PointerEvent) => {
        rx(-(e.clientY / window.innerHeight - 0.5) * 5);
        ry((e.clientX / window.innerWidth - 0.5) * 7);
      };
      window.addEventListener("pointermove", move, { passive: true });
      cleanups.push(() => window.removeEventListener("pointermove", move));
    }

    const near = new IntersectionObserver(([e]) => e.isIntersecting && build(), { rootMargin: "120% 0px" });
    near.observe(el);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        build();
        trunk?.start();
      } else {
        trunk?.stop();
        vids.forEach((v) => v && !v.paused && v.pause());
      }
    });
    io.observe(el);
    cleanups.push(() => {
      near.disconnect();
      io.disconnect();
      glide?.kill();
      trunk?.destroy();
    });

    apply();
    return () => {
      cleanups.forEach((f) => f());
      st.kill();
    };
  }, [STEPS]);

  return (
    <div className="wt-host">
      <section className="wt" ref={root} aria-label="Selected work">
        <canvas className="wt-canvas" aria-hidden="true" />
        <div className="wt-scene">
          <div className="wt-lean">
            <div className="wt-world">
              {films.map(({ p, clip }, i) => (
                <div key={p.slug} className="wt-card" role="group" aria-label={`${p.name}, ${p.typeTag}`}>
                  <span className="wt-media" style={{ ["--g" as string]: posterGradient(p) }}>
                    {clip ? (
                      <video src={clip} muted loop playsInline preload={i === 0 ? "auto" : "none"} poster={p.coverImage} />
                    ) : p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage.startsWith("/") ? p.coverImage : driveCover(p.slug, 1000)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                    ) : null}
                  </span>
                  <span className="wt-glass" aria-hidden="true" />
                  <span className="wt-cap">
                    <i>RS {String(i + 1).padStart(2, "0")}</i>
                    <b>{p.name}</b>
                    <em>{p.typeTag}</em>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="wt-vignette" aria-hidden="true" />

        <div className="wt-ui">
          <span className="eyebrow">Selected work</span>
          <p className="wt-q">What are you looking for?</p>
          <div className="wt-list">
            {films.map(({ p }, i) => (
              <button type="button" key={p.slug} className={i === 0 ? "on" : ""}>
                <span>→</span> {p.name}
              </button>
            ))}
          </div>
          <TLink className="btn sm" href="/projects">
            All projects <Arrow />
          </TLink>
        </div>
        <div className="wt-count" aria-hidden="true">
          <b>01</b>/{String(N).padStart(2, "0")}
        </div>
      </section>
    </div>
  );
}
