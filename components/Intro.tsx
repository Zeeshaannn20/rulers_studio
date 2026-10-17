"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, getLenis, introState, INTRO_DONE, prefersReducedMotion } from "@/lib/motion";
import { RSegments, R_VIEWBOX } from "./RMark";
import { SITE } from "@/data/site";

/*
  Landing intro.
  - Only when the website is opened on the Home page (first visit or a refresh of Home):
    the typing scene (coded stand-in, or the AI clip when SITE.introVideo is set), ENTER press,
    the segmented R builds, the wordmark rises, then the curtain lifts.
  - Opening the website on any other page: the short logo-only version.
  - Moving between pages inside the site (including back to Home): no intro, just the page curtain.
  - "Skip intro" ends it at any point. Reduced-motion users get the short version.
*/
const PROMPT = "Make a film that rules.";

export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const firstPath = useRef(pathname); // the page the website was opened on

  useEffect(() => {
    const $ = <T extends Element = HTMLElement>(s: string) => root.current!.querySelector(s) as T;
    const intro = root.current!;
    const stage = $("#stage"), rig = $("#rig"), orbit = $("#orbit"), kb = $("#keyboard"), typed = $("#typed"), person = $("#person");
    const flash = $("#flash"), word = $("#word"), sub = $("#sub");
    const video = $<HTMLVideoElement>("#intro-clip");
    const segs = Array.from(intro.querySelectorAll("#mark .seg"));
    const rMark = person.querySelector(".face.flip svg svg") as Element;
    const personParts = person.querySelectorAll(".face,.side");
    const reduce = prefersReducedMotion();
    const ENTER_AT = SITE.introVideo ? SITE.introEnterAt : 7.0;

    // keyboard rows, nearest the man first; Enter sits under his right hand
    kb.innerHTML = "";
    ([["space"], ["enter", 10], [12], [13]] as (string | number)[][]).forEach((spec) => {
      const row = document.createElement("div");
      row.className = "row";
      const add = (cls?: string) => {
        const k = document.createElement("div");
        k.className = "key" + (cls ? " " + cls : "");
        row.appendChild(k);
        return k;
      };
      if (spec[0] === "space") { add("wide"); add(); add("space"); add(); add("wide"); }
      else if (spec[0] === "enter") { add("wide enter").id = "enter"; for (let i = 0; i < (spec[1] as number); i++) add(); }
      else for (let i = 0; i < (spec[0] as number); i++) add();
      kb.appendChild(row);
    });
    const keys = Array.from(kb.querySelectorAll(".key:not(.enter)"));
    const enter = $("#enter");

    word.innerHTML = "";
    "Rulers Studio".split("").forEach((c) => {
      const s = document.createElement("span");
      if (c === " ") s.className = "gap";
      else s.textContent = c;
      word.appendChild(s);
    });
    const letters = Array.from(word.querySelectorAll("span:not(.gap)"));


    // camera = rig (elevation, position, zoom); orbit = rotation around the man
    function frame(rot: { rx: number; ry: number }, target: Element, scale: number) {
      gsap.set(rig, { x: 0, y: 0, scale: 1, rotationX: rot.rx });
      gsap.set(orbit, { rotationY: rot.ry });
      const s = stage.getBoundingClientRect(), r = target.getBoundingClientRect();
      const dx = r.left + r.width / 2 - (s.left + s.width / 2), dy = r.top + r.height / 2 - (s.top + s.height / 2);
      return { cam: { rotationX: rot.rx, x: -dx * scale, y: -dy * scale, scale }, ry: rot.ry };
    }

    let tl: gsap.core.Timeline | null = null;
    const done = () => {
      introState.running = false;
      intro.classList.add("gone");
      document.body.classList.remove("intro-on");
      getLenis()?.start();
      document.dispatchEvent(new Event(INTRO_DONE));
    };

    function reset() {
      tl?.kill();
      intro.classList.remove("gone");
      introState.running = true;
      getLenis()?.stop();
      document.body.classList.add("intro-on");
      gsap.set(intro, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(stage, { autoAlpha: 1 });
      gsap.set(flash, { opacity: 0 });
      gsap.set(personParts, { opacity: 1 });
      typed.textContent = "";
      enter.classList.remove("down");
      gsap.set(segs, { autoAlpha: 0 });
      gsap.set(letters, { yPercent: 110 });
      gsap.set(sub, { autoAlpha: 0, y: 8 });
    }

    function logoTimeline(fast: boolean) {
      const t = gsap.timeline();
      const from = [
        { x: -70, y: -10, rotation: -8 }, { x: 70, y: 0, rotation: 8 }, { x: 50, y: 60, rotation: 12 }, { x: -40, y: 60, rotation: -14 },
      ];
      segs.forEach((s, i) => {
        t.fromTo(s, { autoAlpha: 0, ...from[i], transformOrigin: "50% 50%" }, { autoAlpha: 1, x: 0, y: 0, rotation: 0, duration: fast ? 0.4 : 0.75, ease: "expo.out" }, i * (fast ? 0.07 : 0.15));
      });
      t.fromTo($("#mark"), { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "power2.out" }, ">-0.15");
      t.to(letters, { yPercent: 0, duration: fast ? 0.55 : 0.85, ease: "expo.out", stagger: fast ? 0.035 : 0.055 }, fast ? "-=0.4" : "-=0.3");
      t.to(sub, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.35");
      return t;
    }

    function exit(t: gsap.core.Timeline, hold: number) {
      t.to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.2, ease: "expo.inOut", onComplete: () => { gsap.set(intro, { autoAlpha: 0 }); done(); } }, "+=" + hold);
    }

    function playFull() {
      reset();
      if (reduce) return playShort();

      // AI clip mode: play the video, build the logo when ENTER is pressed in the clip
      if (video && SITE.introVideo) {
        gsap.set(video, { autoAlpha: 1 });
        video.currentTime = 0;
        video.play().catch(() => {});
        tl = gsap.timeline();
        tl.to(video, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, ENTER_AT + 0.15).add(logoTimeline(false), ENTER_AT + 0.5);
        exit(tl, 1.0);
        return;
      }

      const head = person.querySelector(".face>svg") as Element;
      const cFront = frame({ rx: -32, ry: -18 }, head, 1.8);
      const cWide = { cam: { rotationX: -20, x: 0, y: 0, scale: 0.95 }, ry: -30 };
      const cBack = frame({ rx: -20, ry: -180 }, person, 1.2);
      const cOnR = frame({ rx: -18, ry: -180 }, rMark, 2.2);
      const cHand = frame({ rx: -48, ry: -200 }, enter, 5);
      gsap.set(rig, cFront.cam);
      gsap.set(orbit, { rotationY: cFront.ry });

      const t = gsap.timeline();
      tl = t;
      const move = (c: typeof cFront, at: number, dur: number, ease: string) => {
        t.to(rig, { ...c.cam, duration: dur, ease }, at).to(orbit, { rotationY: c.ry, duration: dur, ease }, at);
      };
      t.to(rig, { x: "+=6", duration: 1.8, ease: "none" }, 0); // slow drift on the face
      move(cWide, 1.8, 1.6, "power2.inOut"); // pull back
      move(cBack, 3.4, 2.0, "sine.inOut"); // orbit to his back
      move(cOnR, 5.4, 0.9, "sine.inOut"); // hold on the R
      move(cHand, 6.0, 1.0, "power3.in"); // push to the hand
      t.to(personParts, { opacity: 0.1, duration: 0.5, ease: "power1.in" }, 6.2);

      const step = 6.3 / PROMPT.length;
      PROMPT.split("").forEach((_, i) =>
        t.call(() => {
          typed.textContent = PROMPT.slice(0, i + 1);
          const k = keys[(Math.random() * keys.length) | 0];
          k.classList.add("down");
          setTimeout(() => k.classList.remove("down"), 110);
        }, undefined, 0.3 + i * step),
      );

      t.call(() => enter.classList.add("down"), undefined, ENTER_AT)
        .to(flash, { opacity: 1, duration: 0.18, ease: "power2.out" }, ENTER_AT)
        .to(stage, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, ENTER_AT + 0.15)
        .add(logoTimeline(false), ENTER_AT + 0.5);
      exit(t, 1.0);
    }

    function playShort() {
      reset();
      gsap.set(stage, { autoAlpha: 0 });
      if (video) gsap.set(video, { autoAlpha: 0 });
      tl = gsap.timeline();
      tl.add(logoTimeline(true), 0.15);
      exit(tl, 0.6);
    }

    let skipping = false;
    function skip() {
      if (skipping || !introState.running) return;
      skipping = true;
      tl?.kill();
      video?.pause();
      gsap.to(intro, { autoAlpha: 0, duration: 0.3, ease: "power2.out", onComplete: () => { skipping = false; done(); } });
    }
    // the visitor never waits: any scroll, swipe or key press during the intro skips straight to the site
    const KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", " ", "Enter", "Escape"];
    const onIntroKey = (e: KeyboardEvent) => {
      if (!introState.running || !KEYS.includes(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      skip();
    };
    const onIntroWheel = (e: WheelEvent) => {
      if (!introState.running) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (Math.abs(e.deltaY) > 4) skip();
    };
    const onIntroTouch = () => introState.running && skip();
    window.addEventListener("keydown", onIntroKey, true);
    window.addEventListener("wheel", onIntroWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", onIntroTouch, { passive: true });

    const skipBtn = $("#skip");
    skipBtn.addEventListener("click", skip);
    const replay = () => {
      window.scrollTo(0, 0);
      playFull();
    };
    document.addEventListener("rs:replay-intro", replay);

    // Start before the first paint of the page underneath
    introState.running = true;
    const start = () => (firstPath.current === "/" ? playFull() : playShort());
    const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    let cancelled = false;
    fontsReady.then(() => !cancelled && start());

    return () => {
      cancelled = true;
      tl?.kill();
      skipBtn.removeEventListener("click", skip);
      window.removeEventListener("keydown", onIntroKey, true);
      window.removeEventListener("wheel", onIntroWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", onIntroTouch);
      document.removeEventListener("rs:replay-intro", replay);
    };
  }, []);

  return (
    <div className="intro" id="intro" ref={root} role="dialog" aria-label="Rulers Studio intro">
      {SITE.introVideo && <video id="intro-clip" src={SITE.introVideo} muted playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}

      {/* Coded stand-in for the AI clip (hidden when introVideo is set) */}
      <div className="stage" id="stage" style={SITE.introVideo ? { display: "none" } : undefined}>
        <div className="rig" id="rig">
          <div className="orbit" id="orbit">
            <div className="p desk" />
            <div className="p keyboard" id="keyboard" />
            <div className="p monitor">
              <div className="face mon-back" />
              <div className="face flip mon-front">
                <div className="screen">
                  <div className="hint">rulers.studio · new project</div>
                  <div className="prompt">
                    <span className="arrow">&gt;</span> <span id="typed" />
                    <span className="caret" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p person" id="person">
              <div className="face">
                <svg viewBox="0 0 100 113" aria-hidden="true">
                  <path d="M6 113 C6 82 18 68 34 64 L66 64 C82 68 94 82 94 113 Z" fill="#131313" stroke="#252525" />
                  <ellipse cx="50" cy="36" rx="21" ry="27" fill="#131313" stroke="#252525" />
                  <ellipse cx="50" cy="40" rx="13" ry="17" fill="#272727" />
                  <ellipse cx="50" cy="44" rx="10" ry="12" fill="#363636" opacity=".7" />
                  <path d="M44 66 L42 84 M56 66 L58 84" stroke="#353535" strokeWidth="1.4" />
                </svg>
              </div>
              <div className="face flip">
                <svg viewBox="0 0 100 113" aria-hidden="true">
                  <path d="M6 113 C6 82 18 68 34 64 L66 64 C82 68 94 82 94 113 Z" fill="#131313" stroke="#252525" />
                  <ellipse cx="50" cy="36" rx="21" ry="27" fill="#131313" stroke="#252525" />
                  <path d="M50 10 L50 62" stroke="#1f1f1f" strokeWidth="1.2" />
                  <svg x="38" y="73" width="24" height="22" viewBox={R_VIEWBOX}>
                    <g fill="#d8ff00">
                      <RSegments />
                    </g>
                  </svg>
                </svg>
              </div>
              <div className="side">
                <svg viewBox="0 0 100 113" aria-hidden="true">
                  <path d="M24 113 C24 84 32 70 42 66 L60 66 C72 70 78 84 78 113 Z" fill="#131313" stroke="#252525" />
                  <ellipse cx="50" cy="36" rx="17" ry="27" fill="#131313" stroke="#252525" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flash" id="flash" />
      </div>

      <div className="logo">
        <div className="lockup">
          <svg className="mark" id="mark" viewBox={R_VIEWBOX} aria-hidden="true">
            <RSegments className="seg" />
          </svg>
          <div className="word" id="word" aria-label="Rulers Studio" />
          <div className="sub" id="sub">
            AI Film Studio
          </div>
        </div>
      </div>

      <button className="skip" id="skip" type="button">
        Skip intro
      </button>
    </div>
  );
}
