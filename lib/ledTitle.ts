// LED lighting in the letters of the stage title "Rulers Studio": the letters switch on one by one,
// like LED profile strips being powered up in a chain, R first and o last.
//
// Built for smoothness: every lit letter is drawn ONCE (a static SVG of its outline as a white LED
// line with a lime halo, from the site's own font outlines) on its own layer, and the animation only
// changes opacity, which the browser runs on the GPU compositor (Web Animations API). Nothing is
// redrawn while it plays, so it stays smooth even while the page is busy.
//
// The layer sits inside .work-title, so it moves, scales and fades together with the title.

import { GLYPHS, GLYPH_UPM } from "./titleGlyphs";

const NS = "http://www.w3.org/2000/svg";
const GAP = 0.17; // seconds between letters
const FIRST = 0.12; // first letter starts after this
const RAMP = 0.4; // each letter powers up over this
const FLARE = 0.75; // the brief bloom as a letter comes on

export function createLedTitle(host: HTMLElement, word: HTMLElement) {
  let layer: HTMLDivElement | null = null;
  let anims: Animation[] = [];
  let parts: { main: HTMLElement; flare: HTMLElement }[] = [];

  function svgFor(contours: string[], w: number, h: number, ox: number, oy: number, k: number, kind: "main" | "flare", m: number) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", `0 0 ${w} ${h}`);
    s.setAttribute("width", String(w));
    s.setAttribute("height", String(h));
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${ox} ${oy}) scale(${k} ${-k})`);
    const d = contours.join("");
    const add = (attrs: Record<string, string>) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("vector-effect", "non-scaling-stroke");
      for (const a in attrs) p.setAttribute(a, attrs[a]);
      g.appendChild(p);
    };
    if (kind === "flare") {
      add({ fill: "none", stroke: "#d8ff00", "stroke-width": String(20 * m), "stroke-opacity": "0.22", "stroke-linejoin": "round" });
      add({ fill: "none", stroke: "#f4ffc8", "stroke-width": String(7 * m), "stroke-opacity": "0.45", "stroke-linejoin": "round" });
    } else {
      add({ fill: "#eaff9a", "fill-opacity": "0.07" });
      add({ fill: "none", stroke: "#d8ff00", "stroke-width": String(10 * m), "stroke-opacity": "0.14", "stroke-linejoin": "round" });
      add({ fill: "none", stroke: "#d8ff00", "stroke-width": String(3.6 * m), "stroke-opacity": "0.42", "stroke-linejoin": "round" });
      add({ fill: "none", stroke: "#fffbec", "stroke-width": String(1.8 * m), "stroke-linejoin": "round" });
    }
    s.appendChild(g);
    return s;
  }

  // Draw every lit letter once, hidden. Works mid-animation too: positions are taken in the title's
  // own (untransformed) coordinates.
  function build() {
    cancel();
    layer?.remove();
    parts = [];
    const wr = word.getBoundingClientRect();
    if (!wr.width || !word.offsetWidth) return;
    const sc = wr.width / word.offsetWidth; // the title's current GSAP scale
    const F = parseFloat(getComputedStyle(word).fontSize) || 160;
    const k = F / GLYPH_UPM;
    const m = Math.min(1.3, Math.max(0.5, F / 180));
    const base = word.querySelector<HTMLElement>(".ww-base");
    const baseline = base ? (base.getBoundingClientRect().top - wr.top) / sc : F * 0.8;

    layer = document.createElement("div");
    layer.className = "led-layer";
    layer.setAttribute("aria-hidden", "true");
    Object.assign(layer.style, { left: word.offsetLeft + "px", top: word.offsetTop + "px", width: word.offsetWidth + "px", height: word.offsetHeight + "px" });

    const walk = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const italic = !!n.parentElement?.closest(".ww-r");
      const set = GLYPHS[italic ? "italic" : "bold"];
      const text = n.textContent || "";
      for (let c = 0; c < text.length; c++) {
        const contours = set[text[c]];
        if (!contours) continue;
        range.setStart(n, c);
        range.setEnd(n, c + 1);
        const r = range.getBoundingClientRect();
        const x = (r.left - wr.left) / sc;
        const w = r.width / sc;
        // a generous box around the glyph: italic overhang plus room for the glow
        const padX = F * 0.35;
        const top = baseline - F * 1.05;
        const bw = Math.ceil(w + padX * 2);
        const bh = Math.ceil(F * 1.45);
        const make = (kind: "main" | "flare") => {
          const el = document.createElement("div");
          el.className = "led-l " + kind;
          Object.assign(el.style, { left: x - padX + "px", top: top + "px", width: bw + "px", height: bh + "px" });
          el.appendChild(svgFor(contours, bw, bh, padX, baseline - top, k, kind, m));
          layer!.appendChild(el);
          return el;
        };
        parts.push({ flare: make("flare"), main: make("main") });
      }
    }
    host.appendChild(layer);
  }

  // Letters come on one by one, left to right. Opacity only, on the compositor.
  function play() {
    if (!layer) build();
    cancel();
    host.classList.add("leds");
    parts.forEach((p, i) => {
      const delay = (FIRST + i * GAP) * 1000;
      anims.push(
        p.main.animate([{ opacity: 0 }, { opacity: 1 }], { duration: RAMP * 1000, delay, easing: "cubic-bezier(.33,0,.2,1)", fill: "both" }),
        p.flare.animate([{ opacity: 0 }, { opacity: 1, offset: 0.32 }, { opacity: 0.2 }], { duration: FLARE * 1000, delay, easing: "cubic-bezier(.4,0,.3,1)", fill: "both" })
      );
    });
    // once the whole name is lit it breathes slowly
    const lit = (FIRST + (parts.length - 1) * GAP + RAMP) * 1000;
    if (layer) anims.push(layer.animate([{ opacity: 1 }, { opacity: 0.86 }, { opacity: 1 }], { duration: 1800, delay: lit, iterations: Infinity, easing: "ease-in-out" }));
  }

  // fast-forward with the rest of the opening when the visitor skips it
  function speed(rate: number) {
    anims.forEach((a) => a.updatePlaybackRate(rate));
  }

  function cancel() {
    anims.forEach((a) => a.cancel());
    anims = [];
  }

  function destroy() {
    cancel();
    layer?.remove();
    layer = null;
    host.classList.remove("leds");
  }

  return { build, play, speed, destroy };
}
