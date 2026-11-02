// LED profile lighting inside the letters of the stage title "Rulers Studio".
// Reference: curved LED profile lines set into walls and ceilings. Here the profile IS the outline
// of each letter: a white-hot line with a lime halo runs along every contour, letter after letter,
// with a bright head travelling in front of it. When all letters are lit they surge once, the
// insides fill with a soft glow, and the light breathes until the stage goes to black.
//
// SVG laid exactly over the HTML title (glyph outlines come from the site's own font files, placed
// at the browser's own letter positions), so it lines up on every screen size.
//   draw(p, t)  p 0 → 1 lighting progress during the hold · t stage playhead (fades out 0.96 → 1.1)

import { GLYPHS, GLYPH_UPM } from "./titleGlyphs";

const NS = "http://www.w3.org/2000/svg";
const HOLD = 2.4; // seconds the stage holds on the title (must match HeroStage)

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const easeTrace = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2; // sine in-out: no snap at either end

type Letter = { g: SVGGElement; core: SVGPathElement[]; halo: SVGPathElement[]; bloom: SVGPathElement[]; head: SVGPathElement[]; fill: SVGPathElement; start: number; dur: number };

export function createLedTitle(svg: SVGSVGElement, stage: HTMLElement, word: HTMLElement) {
  let letters: Letter[] = [];
  let m = 1; // stroke scale for the screen size

  function mk<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, String(attrs[k]));
    parent.appendChild(el);
    return el;
  }

  function layout() {
    svg.textContent = "";
    letters = [];
    const box = stage.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const size = parseFloat(getComputedStyle(word).fontSize) || 160;
    const k = size / GLYPH_UPM;
    m = clamp(size / 180, 0.5, 1.3);
    const base = word.querySelector<HTMLElement>(".ww-base");
    const baseline = base ? base.getBoundingClientRect().top - box.top : 0;

    const walk = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let i = 0;
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const italic = !!(n.parentElement && n.parentElement.closest(".ww-r"));
      const set = GLYPHS[italic ? "italic" : "bold"];
      const text = n.textContent || "";
      for (let c = 0; c < text.length; c++) {
        const contours = set[text[c]];
        if (!contours) continue;
        range.setStart(n, c);
        range.setEnd(n, c + 1);
        const r = range.getBoundingClientRect();
        const g = mk("g", { transform: `translate(${r.left - box.left} ${baseline}) scale(${k} ${-k})` }, svg);
        const fill = mk("path", { d: contours.join(""), class: "led-fill" }, g);
        const layer = (cls: string) =>
          contours.map((d) => mk("path", { d, class: cls, pathLength: 1, "vector-effect": "non-scaling-stroke" }, g));
        const bloom = layer("led-bloom");
        const halo = layer("led-halo");
        const core = layer("led-core");
        const head = layer("led-head");
        // the profiles come on one letter after another, left to right, overlapping like a chain
        letters.push({ g, core, halo, bloom, head, fill, start: 0.1 + i * 0.075, dur: 0.85 });
        i++;
      }
    }
    svg.style.setProperty("--m", String(m));
  }

  function draw(p: number, t: number) {
    const fade = 1 - smooth(0.96, 1.1, t);
    svg.style.opacity = String(fade);
    if (fade <= 0) return;
    const sec = p * HOLD;
    const last = letters.length ? letters[letters.length - 1].start + letters[letters.length - 1].dur : 1;
    // one surge once every letter is lit, then a slow breath
    const surge = Math.sin(clamp((sec - last) / 0.5) * Math.PI);
    const breathe = sec > last + 0.5 ? 0.92 + 0.08 * Math.cos((sec - last - 0.5) * 3.2) : 1;
    const full = smooth(last - 0.2, last + 0.3, sec);
    for (const L of letters) {
      const raw = clamp((sec - L.start) / L.dur);
      const f = easeTrace(raw);
      const off = String(1 - f);
      const headOff = String(0.05 - f);
      const headOn = raw > 0 && raw < 1 ? String(Math.sin(raw * Math.PI) * 0.6 + 0.4) : "0";
      for (const el of L.core) el.style.strokeDashoffset = off;
      for (const el of L.halo) el.style.strokeDashoffset = off;
      for (const el of L.bloom) el.style.strokeDashoffset = off;
      for (const el of L.head) {
        el.style.strokeDashoffset = headOff;
        el.style.opacity = headOn;
      }
      const lit = raw >= 1 ? 1 : 0;
      L.g.style.opacity = String(breathe);
      L.fill.style.opacity = String((0.06 * full + 0.07 * surge) * (lit || f));
      // brighter halo during the surge
      const h = 0.24 + 0.3 * surge;
      for (const el of L.halo) el.style.opacity = String(h);
      for (const el of L.bloom) el.style.opacity = String(0.12 + 0.22 * surge);
    }
  }

  function clear() {
    svg.textContent = "";
    letters = [];
    svg.style.opacity = "0";
  }

  return { layout, draw, clear };
}
