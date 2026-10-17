"use client";
import { useEffect, useRef } from "react";
import Words from "./Words";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { createStepScene, type StepKind, type StepScene } from "@/lib/stepScenes";

const STEPS: { no: string; title: string; day: string; clip: StepKind; body: string }[] = [
  { no: "01", title: "Brief", day: "Day 1", clip: "brief", body: "A short call to lock the product, the audience and the one feeling the film has to leave behind." },
  { no: "02", title: "Script & shot list", day: "Day 1 to 2", clip: "script", body: "Our writers and directors script it and plan every shot (angles, lenses, light) like a real production." },
  { no: "03", title: "AI production", day: "Day 2 to 4", clip: "production", body: "AI artists generate, direct and refine each frame until it holds up on a big screen and doesn't look like AI." },
  { no: "04", title: "Edit, sound & delivery", day: "Day 5", clip: "edit", body: "Cut, colour, music and sound design, then delivered in every size you need: 16:9, 9:16 and 1:1." },
];

// How we work: four cards that stack on top of each other as you scroll.
export default function Process() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const reduce = prefersReducedMotion();
    const cleanups: Array<() => void> = [];

    // each card gets its own 3D particle scene: built when the section gets close,
    // drawn only while its card is on screen, assembled the first time it is seen
    if (!reduce) {
      const mobile = window.matchMedia("(max-width: 860px)").matches;
      const cards = Array.from(el.querySelectorAll<HTMLElement>(".step"));
      const scenes = new Map<Element, StepScene>();
      const io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            let sc = scenes.get(e.target);
            if (e.isIntersecting && !sc) {
              const cv = e.target.querySelector<HTMLCanvasElement>(".step-3d");
              const kind = (e.target as HTMLElement).dataset.kind as StepKind;
              const made = cv ? createStepScene(cv, kind, mobile ? 1500 : 2600) : null;
              if (!made) return;
              sc = made;
              scenes.set(e.target, sc);
            }
            if (!sc) return;
            if (e.isIntersecting) {
              sc.assemble();
              sc.start();
            } else sc.stop();
          }),
        { rootMargin: "0px 0px -15% 0px" }
      );
      cards.forEach((c) => io.observe(c));
      const onPtr = (ev: PointerEvent) => {
        const x = (ev.clientX / window.innerWidth) * 2 - 1;
        const y = (ev.clientY / window.innerHeight) * 2 - 1;
        scenes.forEach((sc) => sc.pointer(x, y));
      };
      const onResize = () => scenes.forEach((sc) => sc.resize());
      window.addEventListener("pointermove", onPtr, { passive: true });
      window.addEventListener("resize", onResize);
      cleanups.push(() => {
        io.disconnect();
        window.removeEventListener("pointermove", onPtr);
        window.removeEventListener("resize", onResize);
        scenes.forEach((sc) => sc.destroy());
      });
    }

    if (reduce || !window.matchMedia("(min-width: 861px)").matches) return () => cleanups.forEach((f) => f());
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".step");
      cards.forEach((c, i) => {
        if (i === cards.length - 1) return;
        const st = { trigger: cards[i + 1], start: "top bottom", end: "top 140px", scrub: true };
        gsap.to(c, { scale: 0.94, ease: "none", scrollTrigger: st });
        gsap.to(c.querySelector(".step-dim"), { opacity: 0.65, ease: "none", scrollTrigger: { ...st } });
      });
    }, el);
    return () => {
      cleanups.forEach((f) => f());
      ctx.revert();
    };
  }, []);

  return (
    <section className="sec process light" ref={root}>
      <div className="wrap">
        <div className="sec-head">
          <div className="stack">
            <span className="eyebrow">How we work</span>
            <Words className="h-xl" text="Four steps" />
          </div>
          <p className="lede">From the first call to the final file, the same process for a 15-second ad or a full micro drama.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <article className={`step step-${s.clip}`} data-kind={s.clip} key={s.no} style={{ top: `calc(110px + ${i * 18}px)` }}>
              <span className="step-film" aria-hidden="true" />
              <i className="step-glass" aria-hidden="true" />
              <canvas className="step-3d" aria-hidden="true" />
              <div className="step-top">
                <span className="step-no">{s.no}</span>
              </div>
              <i className="step-dim" aria-hidden="true" />
              <div className="step-main">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
