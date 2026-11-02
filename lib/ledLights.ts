// LED profile lights that grow out of the giant "Rulers Studio" title on the home stage.
// Reference: luxury curved LED profile ceilings. Thin, white-hot lines with a lime halo rise out of
// each letter, branch, and sweep across the "ceiling" (top of the screen) in arches; a cove line runs
// out under the name and column lights rise at the edges. The room fills with a soft wash as they light.
//
// One canvas, redrawn only while the stage is lighting up. draw(p, t):
//   p  0 → 1  lighting progress (the stage holds on the title while this runs)
//   t         the stage playhead; the lights dim as the stage goes to black (t 0.96 → 1.1)

type Pt = { x: number; y: number };
type Seg = { pts: Pt[]; len: number[]; total: number; start: number; dur: number; w: number };
type Spark = { x: number; y: number; r: number; at: number };

const LIME = "216,255,0";
const CORE = "255,251,236"; // warm white, like a real LED strip

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
// slow start, long soft landing: like a dimmer being brought up along the profile
const easeLight = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function line(a: Pt, b: Pt, n = 12): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }));
}
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  });
}
function seg(pts: Pt[], start: number, dur: number, w = 1): Seg {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, len, total: len[len.length - 1], start, dur, w };
}

export function createLedLights(canvas: HTMLCanvasElement, stage: HTMLElement, word: HTMLElement) {
  const ctx = canvas.getContext("2d")!;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let s = 1; // stroke scale
  let segs: Seg[] = [];
  let sparks: Spark[] = [];
  let title = { left: 0, right: 0, top: 0, base: 0, mid: 0, h: 0 };
  let cove = 0;

  function letters() {
    const box = stage.getBoundingClientRect();
    const out: { x: number; top: number; mid: number; h: number }[] = [];
    const walk = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const text = n.textContent || "";
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue;
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        // the line box is taller than the glyphs: cap height sits roughly 18% down, baseline ~86%
        out.push({ x: r.left - box.left + r.width / 2, top: r.top - box.top + r.height * 0.2, mid: r.top - box.top + r.height * 0.55, h: r.height });
      }
    }
    return out;
  }

  function layout() {
    const box = stage.getBoundingClientRect();
    W = box.width;
    H = box.height;
    const small = W < 760;
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    s = clamp(W / 1440, 0.62, 1.25);

    const L = letters();
    segs = [];
    sparks = [];
    if (!L.length) return;
    const h = L[0].h;
    title = {
      left: Math.min(...L.map((l) => l.x)),
      right: Math.max(...L.map((l) => l.x)),
      top: Math.min(...L.map((l) => l.top)),
      base: L[0].top - h * 0.18 + h * 0.86,
      mid: L[0].mid,
      h,
    };
    const midX = (title.left + title.right) / 2;
    const half = Math.max(1, (title.right - title.left) / 2);
    const ceil = -8;
    const rand = rng(7);

    L.forEach((l, i) => {
      // phones: every other letter, so the lines stay elegant on a narrow screen
      if (small && i % 2 === 1) return;
      const d = (l.x - midX) / half; // -1 … 1 across the name
      const ad = Math.abs(d);
      const dir = d === 0 ? (i % 2 ? 1 : -1) : Math.sign(d);
      // the name powers on from its centre outward
      const t0 = 0.04 + ad * 0.2 + rand() * 0.03;
      sparks.push({ x: l.x, y: l.top + l.h * 0.06, r: l.h * 0.36, at: t0 });

      // trunk: straight up out of the letter
      const yb = title.top - H * (0.07 + 0.09 * (1 - ad) + rand() * 0.05);
      const trunk = line({ x: l.x, y: l.top + l.h * 0.06 }, { x: l.x, y: yb });
      const tDur = 0.16 + rand() * 0.04;
      segs.push(seg(trunk, t0, tDur, 1));

      const rise = yb - ceil;
      // outer sweep: arcs away from the centre and dies into the ceiling
      const reach = W * (0.1 + 0.3 * ad + rand() * 0.05);
      segs.push(
        seg(
          cubic({ x: l.x, y: yb }, { x: l.x, y: yb - rise * 0.55 }, { x: l.x + dir * reach * 0.45, y: ceil + rise * 0.12 }, { x: l.x + dir * reach, y: ceil }),
          t0 + tDur,
          0.36 + rand() * 0.08,
          0.95
        )
      );
      // inner arch on every other letter: curls back toward the centre, meeting its neighbours' sweeps
      if (i % 3 === 0 || ad < 0.12 || small) {
        const back = W * (0.05 + rand() * 0.06);
        segs.push(
          seg(
            cubic({ x: l.x, y: yb }, { x: l.x, y: yb - rise * 0.6 }, { x: l.x - dir * back * 0.35, y: ceil + rise * 0.1 }, { x: l.x - dir * back, y: ceil }),
            t0 + tDur + 0.04,
            0.34 + rand() * 0.08,
            0.75
          )
        );
      }
    });

    // cove line under the name, running out to both edges
    cove = Math.min(H - 12, title.base + h * 0.12);
    segs.push(seg(line({ x: midX, y: cove }, { x: -10, y: cove }, 24), 0.3, 0.5, 0.9));
    segs.push(seg(line({ x: midX, y: cove }, { x: W + 10, y: cove }, 24), 0.3, 0.5, 0.9));

    // column lights rising at the edges of the room
    const cols = small ? [0.05, 0.95] : [0.045, 0.075, 0.925, 0.955];
    cols.forEach((c, k) => segs.push(seg(line({ x: W * c, y: H + 10 }, { x: W * c, y: ceil }, 20), 0.42 + (k % 2) * 0.06, 0.42, 0.7)));
  }

  function stroke(sg: Seg, f: number) {
    const target = sg.total * f;
    ctx.beginPath();
    ctx.moveTo(sg.pts[0].x, sg.pts[0].y);
    let tip = sg.pts[0];
    for (let i = 1; i < sg.pts.length; i++) {
      if (sg.len[i] <= target) {
        ctx.lineTo(sg.pts[i].x, sg.pts[i].y);
        tip = sg.pts[i];
      } else {
        const a = sg.pts[i - 1];
        const b = sg.pts[i];
        const k = (target - sg.len[i - 1]) / Math.max(1e-6, sg.len[i] - sg.len[i - 1]);
        tip = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        ctx.lineTo(tip.x, tip.y);
        break;
      }
    }
    return tip;
  }

  function glow(x: number, y: number, r: number, a: number, core = CORE) {
    if (a <= 0.002 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${core},${a})`);
    g.addColorStop(0.25, `rgba(${LIME},${a * 0.45})`);
    g.addColorStop(1, `rgba(${LIME},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function draw(p: number, t: number) {
    const fade = 1 - smooth(0.96, 1.1, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fade <= 0 || p <= 0 || !segs.length) {
      canvas.style.opacity = "0";
      return;
    }
    canvas.style.opacity = "1";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // the room fills with light as the profiles come on, then breathes gently
    const breathe = p > 0.72 ? 0.94 + 0.06 * Math.sin((p - 0.72) * 14) : 1;
    const A = smooth(0.12, 0.75, p) * fade * breathe;
    if (A > 0) {
      let g = ctx.createLinearGradient(0, 0, 0, Math.max(1, title.top));
      g.addColorStop(0, `rgba(${LIME},${0.05 * A})`);
      g.addColorStop(1, `rgba(${LIME},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, title.top);
      // a soft pool of light under the cove line (an ellipse, so it has no hard edge)
      ctx.save();
      ctx.translate(W / 2, cove);
      ctx.scale(1, 0.32);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.55);
      pool.addColorStop(0, `rgba(${CORE},${0.05 * A})`);
      pool.addColorStop(0.4, `rgba(${LIME},${0.025 * A})`);
      pool.addColorStop(1, `rgba(${LIME},0)`);
      ctx.fillStyle = pool;
      ctx.fillRect(-W, -W, W * 2, W * 2);
      ctx.restore();
      glow((title.left + title.right) / 2, title.mid, (title.right - title.left) * 0.7, 0.045 * A);
    }

    // each letter powers on: a short bloom at its heart that settles to a soft glow
    for (const k of sparks) {
      const q = clamp((p - k.at) / 0.18);
      if (q <= 0) continue;
      const a = (Math.sin(Math.min(1, q) * Math.PI) * 0.55 + 0.18 * smooth(0.5, 1, q)) * fade;
      glow(k.x, k.y, k.r * (0.8 + 0.4 * q), a);
    }

    // three passes per profile: wide bloom, halo, white-hot core
    const passes: [number, string][] = [
      [18 * s, `rgba(${LIME},${0.03 * fade})`],
      [6 * s, `rgba(${LIME},${0.1 * fade})`],
      [2.1 * s, `rgba(${CORE},${fade})`],
    ];
    const tips: Pt[] = [];
    for (const sg of segs) {
      const raw = (p - sg.start) / sg.dur;
      if (raw <= 0) continue;
      const f = easeLight(clamp(raw));
      for (const [w, c] of passes) {
        ctx.lineWidth = w * sg.w;
        ctx.strokeStyle = c;
        const tip = stroke(sg, f);
        ctx.stroke();
        if (w === passes[2][0] && raw < 1) tips.push(tip);
      }
    }
    // the bright head travelling along each profile as it lights
    for (const tp of tips) glow(tp.x, tp.y, 16 * s, 0.85 * fade);
    ctx.globalCompositeOperation = "source-over";
  }

  function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.opacity = "0";
  }

  return { layout, draw, clear };
}
