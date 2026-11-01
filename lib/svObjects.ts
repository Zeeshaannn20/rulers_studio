// "What we do": one 3D object per service, built from plain DOM + CSS 3D (no WebGL, no images).
//   0 · AI Ad Creatives   a film slate that snaps shut ("ACTION!"), the take number counts up
//   1 · AI Product Videos a lit bottle with a wrap-around label spinning on a turntable, photo-shoot HUD
//   2 · AI Brand Stories  a hardcover book whose pages turn on their own
//   3 · UGC Ads           a phone scrolling real-looking reels, with notifications popping out of it
// Only the visible scene animates; everything pauses when the section is off screen.

type Api = { show: (i: number) => void; setVisible: (v: boolean) => void; pointer: (x: number, y: number) => void; destroy: () => void };

const el = (cls: string, css = "", html = "") => {
  const d = document.createElement("div");
  d.className = cls;
  if (css) d.style.cssText = css;
  if (html) d.innerHTML = html;
  return d;
};

// cuboid w×h×d centred on (x,y,z)
function box(w: number, h: number, d: number, cls: string, x = 0, y = 0, z = 0) {
  const b = el("so-bx " + cls, `left:${-w / 2}px;top:${-h / 2}px;width:${w}px;height:${h}px;transform:translate3d(${x}px,${y}px,${z}px)`);
  const face = (fw: number, fh: number, t: string, c: string) => {
    const i = document.createElement("i");
    i.className = c;
    i.style.cssText = `width:${fw}px;height:${fh}px;left:${(w - fw) / 2}px;top:${(h - fh) / 2}px;transform:${t}`;
    b.appendChild(i);
  };
  face(w, h, `translateZ(${d / 2}px)`, "f");
  face(w, h, `rotateY(180deg) translateZ(${d / 2}px)`, "k");
  face(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, "r");
  face(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, "l");
  face(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, "t");
  face(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, "b");
  return b;
}

const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t)))).join(",")})`;

export function createObjects(root: HTMLElement, lite = false): Api {
  const fitEl = el("so-fit");
  root.appendChild(fitEl);
  const scenes = [0, 1, 2, 3].map(() => {
    const s = el("so-scene");
    fitEl.appendChild(s);
    return s;
  });
  const pars: HTMLElement[] = [];
  const par = (host: HTMLElement) => {
    const p = el("so-par");
    host.appendChild(p);
    pars.push(p);
    return p;
  };
  const timers: number[] = [];
  let active = 0;
  let visible = false;
  const live = (i: number) => visible && active === i;

  // ── 0 · film slate ─────────────────────────────────────────────────────────
  {
    const s = scenes[0];
    const sh = el("so-shake");
    s.append(sh);
    sh.append(el("so-flash"), el("so-shadow", "transform:translateY(196px)"));
    const p = par(sh);
    const w = el("so-w3 so-clap-world");
    p.append(w);
    w.append(box(300, 200, 14, "so-dark", 0, 0, 0));
    w.append(box(300, 34, 16, "so-stripe", 0, -117, 0));
    const h = el("so-hinge");
    h.append(box(300, 34, 16, "so-stripe so-flip", 150, -17, 0));
    w.append(h);
    w.append(box(16, 16, 22, "so-dark", -150, -134, 0));
    const cells: [string, string, number, number, number, number, boolean?][] = [
      ["PRODUCTION", "Your Brand", 0, 0, 300, 52, true],
      ["ROLL", "A001", 0, 52, 100, 50],
      ["SCENE", "01", 100, 52, 100, 50],
      ["TAKE", '<span class="so-take">01</span>', 200, 52, 100, 50],
      ["DIRECTOR", "Rulers Studio", 0, 102, 180, 50],
      ["CAMERA", "None needed", 180, 102, 120, 50, true],
      ["DATE", "Today", 0, 152, 150, 48],
      ["SHOOT", "Zero days", 150, 152, 150, 48],
    ];
    const ch = el("so-chalk");
    cells.forEach(([k, v, x, y, cw, chh, lime], i) =>
      ch.append(el("so-cell", `left:${x}px;top:${y}px;width:${cw}px;height:${chh}px`, `${k}<b class="${lime ? "lime" : ""}" style="animation-delay:${i * 0.05}s">${v}</b>`))
    );
    [[0, 52, 300, 1], [0, 102, 300, 1], [0, 152, 300, 1], [100, 52, 1, 50], [200, 52, 1, 50], [180, 102, 1, 50], [150, 152, 1, 48]].forEach(([x, y, lw, lh]) =>
      ch.append(el("so-ln", `left:${x}px;top:${y}px;width:${lw}px;height:${lh}px`))
    );
    ch.append(el("so-glare"));
    w.append(ch);
    sh.append(el("so-snap", "", [-70, -40, -12, 15, 40, 70].map((r) => `<i style="--r:${r}deg"></i>`).join("")), el("so-action", "", "ACTION!"));
    s.append(el("so-meta", "", `<span>TAKE <b class="so-take">01</b></span><span>24 FPS</span><span>NO CREW · NO CAMERA</span>`));
    let take = 1;
    timers.push(
      window.setInterval(() => {
        if (!live(0)) return;
        take = (take % 99) + 1;
        s.querySelectorAll(".so-take").forEach((t) => (t.textContent = String(take).padStart(2, "0")));
      }, 2200)
    );
  }

  // ── 1 · product hero shot ──────────────────────────────────────────────────
  const strips: HTMLElement[] = [];
  const rim: HTMLElement[] = [];
  let spinner: HTMLElement;
  {
    const s = scenes[1];
    s.append(el("so-cone"), el("so-floorgl"), el("so-glow", "width:420px;height:300px;top:70%"));
    const p = par(s);
    const w = el("so-w3", "transform:translateY(80px) rotateX(-14deg)");
    p.append(w);
    spinner = el("so-w3");
    w.append(spinner);
    const N = lite ? 24 : 36;
    const C = 2 * Math.PI * 47;
    const label =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${C}' height='92'><text x='${C * 0.25}' y='40' text-anchor='middle' font-family='Montserrat,Arial' font-weight='800' font-size='15' letter-spacing='3' fill='#0a0a0a'>YOUR</text><text x='${C * 0.25}' y='60' text-anchor='middle' font-family='Montserrat,Arial' font-weight='800' font-size='15' letter-spacing='3' fill='#0a0a0a'>PRODUCT</text><rect x='${C * 0.25 - 40}' y='70' width='80' height='2' fill='#0a0a0a'/><text x='${C * 0.75}' y='52' text-anchor='middle' font-family='Georgia' font-style='italic' font-size='18' fill='#0a0a0a'>since 2026</text></svg>`
      );
    // lathe profile: [radius, top y, height, kind]
    const prof: [number, number, number, string][] = [[47, -150, 46, "body"], [47, -104, 92, "label"], [47, -12, 12, "body"]];
    const shoulder = lite ? 4 : 7;
    for (let k = 0; k < shoulder; k++) {
      const t = k / shoulder;
      const hh = 42 / shoulder;
      prof.push([47 - 28 * Math.sin((t * Math.PI) / 2), -150 - (k + 1) * hh, hh + 0.5, "body"]);
    }
    prof.push([19, -204, 14, "body"], [23, -232, 28, "cap"]);
    prof.forEach(([r, y, hh, kind]) => {
      const sw = (2 * Math.PI * r) / N + 1.4;
      for (let k = 0; k < N; k++) {
        const i = document.createElement("i");
        i.style.cssText = `width:${sw}px;height:${hh}px;left:${-sw / 2}px;top:${y}px;transform:rotateY(${(k * 360) / N}deg) translateZ(${r}px)`;
        i.dataset.a = String((k * 360) / N);
        i.dataset.kind = kind;
        if (kind === "label") {
          i.style.backgroundImage = `url("${label}")`;
          i.style.backgroundSize = `${C}px 92px`;
          i.style.backgroundPosition = `${-k * (C / N)}px 0`;
        }
        spinner.append(i);
        strips.push(i);
      }
    });
    const R = 130;
    const sw = (2 * Math.PI * R) / N + 1.2;
    for (let k = 0; k < N; k++) {
      const i = document.createElement("i");
      i.style.cssText = `width:${sw}px;height:16px;left:${-sw / 2}px;top:0;transform:rotateY(${(k * 360) / N}deg) translateZ(${R}px)`;
      i.dataset.a = String((k * 360) / N);
      spinner.append(i);
      rim.push(i);
    }
    spinner.append(el("so-plate", `left:-${R}px;top:-${R}px;width:${R * 2}px;height:${R * 2}px`));
    spinner.append(el("so-lid"));
    const vf = el(
      "so-vf",
      "",
      `<i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i><span class="rec">REC</span><span class="q">4K · HERO</span><span class="z">PACKSHOT · 360°</span><span class="shot">SHOT <b class="sn">01</b>/12</span><div class="af"></div>`
    );
    s.append(vf);
    const shut = el("so-shutter");
    s.append(shut);
    const calls: [string, string, string][] = [
      ["CLOSE-UP", "left:58%;top:28%", ""],
      ["PACKSHOT", "right:58%;top:44%", "r"],
      ["LAUNCH FILM", "left:60%;top:60%", ""],
    ];
    const callEls = calls.map(([t, pos, c]) => {
      const e = el("so-callout " + c, pos, `<i></i><em></em>${t}`);
      s.append(e);
      return e;
    });
    for (let k = 0; k < 8; k++) s.append(el("so-spark", `left:${20 + Math.random() * 60}%;top:${12 + Math.random() * 60}%;animation-delay:${Math.random() * 2.4}s`));
    let n = 1;
    let c = 0;
    const af = vf.querySelector<HTMLElement>(".af")!;
    const sn = vf.querySelector<HTMLElement>(".sn")!;
    timers.push(
      window.setInterval(() => {
        if (!live(1)) return;
        af.style.borderColor = "rgba(216,255,0,.9)";
        window.setTimeout(() => (af.style.borderColor = "rgba(216,255,0,0)"), 500);
        shut.animate([{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }], { duration: 260 });
        n = (n % 12) + 1;
        sn.textContent = String(n).padStart(2, "0");
        callEls.forEach((e, k) => e.classList.toggle("on", k <= c));
        c = (c + 1) % 4;
      }, 1200)
    );
  }
  const shadeBottle = (time: number) => {
    const rot = ((time / 1000) * 60) % 360;
    spinner.style.transform = `rotateY(${rot}deg)`;
    const L = (35 * Math.PI) / 180;
    const RL = (-140 * Math.PI) / 180;
    strips.forEach((i) => {
      const th = ((+i.dataset.a! + rot) * Math.PI) / 180;
      const key = Math.max(0, Math.cos(th - L));
      const rimL = Math.pow(Math.max(0, Math.cos(th - RL)), 6);
      const spec = Math.pow(key, 22);
      const k = i.dataset.kind;
      if (k === "label") i.style.backgroundColor = mix([60, 74, 0], [235, 255, 90], key * 0.85 + spec * 0.25);
      else if (k === "cap") i.style.background = mix([6, 6, 6], [80, 80, 80], key * 0.8 + spec);
      else i.style.background = mix([8, 8, 8], [120, 120, 120], key * 0.6 + spec * 0.9 + rimL * 0.5);
    });
    rim.forEach((i) => {
      const th = ((+i.dataset.a! + rot) * Math.PI) / 180;
      i.style.background = mix([18, 18, 18], [216, 255, 0], Math.pow(Math.max(0, Math.cos(th - L)), 3) * 0.8);
    });
  };

  // ── 2 · story book ─────────────────────────────────────────────────────────
  {
    const s = scenes[2];
    s.append(el("so-glow", "width:440px;height:340px"), el("so-quote", "", "“Every brand has a beginning.”"));
    const p = par(s);
    const w = el("so-w3 so-book-world");
    p.append(w);
    w.append(box(320, 214, 10, "so-cover", 0, 0, -12));
    w.append(box(150, 190, 14, "so-paper", -76, 0, 0), box(150, 190, 14, "so-paper", 76, 0, 0));
    w.append(el("so-pg", "left:-151px;transform:translateZ(7.5px)", `<b>Chapter one</b><span class="drop">B</span>efore the logo, before the launch, there was a reason.`));
    w.append(el("so-pg", "left:1px;transform:translateZ(7.5px)", `<b>The founder</b>A late night, an idea, and a product nobody had made yet.`));
    const words = [
      ["The struggle", "The first hundred customers came one at a time."],
      ["The turn", "Then one video changed everything."],
      ["The film", "Now the story gets told the way it deserves."],
    ];
    words.forEach(([b, t], k) => {
      const z = 8.5 + (3 - k) * 0.6;
      const st = (8 + k * 12) / 100;
      const lf = el("so-leaf", `transform:translateZ(${z}px)`, `<i><b>${b}</b>${t}</i><i class="bk"></i>`);
      w.append(lf);
      lf.animate(
        [
          { transform: `translateZ(${z}px) rotateY(0deg)` },
          { offset: st, transform: `translateZ(${z}px) rotateY(0deg)`, easing: "cubic-bezier(.45,0,.25,1)" },
          { offset: Math.min(0.95, st + 0.55), transform: `translateZ(${z + 0.4}px) rotateY(-178deg)` },
          { transform: `translateZ(${z + 0.4}px) rotateY(-178deg)` },
        ],
        { duration: 3600, iterations: Infinity }
      );
    });
    for (let k = 0; k < (lite ? 6 : 12); k++)
      s.append(el("so-mote", `left:${35 + Math.random() * 30}%;top:${50 + Math.random() * 12}%;--dx:${(Math.random() - 0.5) * 120}px;animation-delay:${Math.random() * 4}s`));
  }

  // ── 3 · phone feed ─────────────────────────────────────────────────────────
  {
    const s = scenes[3];
    s.append(el("so-glow", "width:380px;height:420px"), el("so-shadow", "transform:translateY(205px)"));
    const p = par(s);
    const w = el("so-w3 so-ph-world");
    p.append(w);
    w.append(box(180, 370, 16, "so-dark", 0, 0, 0));
    const reels = [
      ["linear-gradient(160deg,#d8ff00,#9fbb00)", "STOP.", "@yourbrand · wait for it", "98K"],
      ["linear-gradient(160deg,#f2f2f2,#bdbdbd)", "", "@yourbrand · honest review", "124K"],
      ["linear-gradient(160deg,#ff8a5c,#d8ff00)", "TAP TO BUY", "@yourbrand · limited drop", "210K"],
      ["linear-gradient(160deg,#1b1b1b,#3a3a3a)", "", "@yourbrand · unboxing", "76K"],
      ["linear-gradient(160deg,#d8ff00,#9fbb00)", "STOP.", "@yourbrand · wait for it", "98K"],
    ];
    const feed = reels
      .map(
        ([bg, big, cpt, likes]) =>
          `<div class="so-rl"><div class="bgx" style="background:${bg}"></div>${big ? `<div class="big">${big}</div>` : ""}<div class="who"></div><div class="ui"><em>♥</em>${likes}<em>✉</em>2.1K<em>↗</em></div><div class="cpt">${cpt}</div><div class="bar"></div></div>`
      )
      .join("");
    w.append(el("so-screen", "", `<div class="notch"></div><div class="so-feed">${feed}</div>`));
    const toasts: [string, string, string, string, string, number][] = [
      ["♥", "#ff3b6b", "12.4K likes", "in the last hour", "translate3d(80px,-150px,70px)", 0.02],
      ["₹", "#d8ff00", "New order · ₹2,499", "from your reel", "translate3d(-250px,-40px,110px)", 0.26],
      ["↑", "#ffffff", "CTR up 38%", "vs. studio shoot", "translate3d(90px,70px,90px)", 0.5],
      ["▶", "#d8ff00", "1.2M views", "this week", "translate3d(-240px,110px,60px)", 0.74],
    ];
    toasts.forEach(([ic, col, a, b, t, o]) => {
      const n = el("so-toast", `transform:${t}`, `<i style="background:${col}">${ic}</i><div>${a}<small>${b}</small></div>`);
      w.append(n);
      n.animate(
        [
          { opacity: 0, transform: `${t} translateY(12px) scale(.85)` },
          { offset: o, opacity: 0, transform: `${t} translateY(12px) scale(.85)`, easing: "cubic-bezier(.2,1.4,.3,1)" },
          { offset: o + 0.04, opacity: 1, transform: `${t} scale(1)` },
          { offset: o + 0.2, opacity: 1, transform: `${t} scale(1)` },
          { offset: o + 0.24, opacity: 0, transform: `${t} translateY(-10px)` },
          { opacity: 0, transform: `${t} translateY(-10px)` },
        ],
        { duration: 6000, iterations: Infinity }
      );
    });
  }

  // ── fit, play/pause, pointer tilt ─────────────────────────────────────────
  const fit = () => {
    const k = Math.min(1.15, root.clientWidth / 540, root.clientHeight / 510);
    fitEl.style.transform = `translate(-50%,-50%) scale(${Math.max(0.4, k)})`;
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(root);

  const playState = () => {
    scenes.forEach((s, i) => {
      const run = visible && i === active;
      s.classList.toggle("so-paused", !run);
      s.querySelectorAll("*").forEach((x) => (x as HTMLElement).getAnimations?.().forEach((a) => (run ? a.play() : a.pause())));
    });
  };
  let raf = 0;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    if (live(1)) shadeBottle(t);
  };
  raf = requestAnimationFrame(loop);

  const show = (i: number) => {
    active = i;
    scenes.forEach((s, k) => s.classList.toggle("on", k === i));
    // start the entering scene from the top
    scenes[i].querySelectorAll("*").forEach((x) => (x as HTMLElement).getAnimations?.().forEach((a) => (a.currentTime = 0)));
    playState();
  };
  show(0);

  return {
    show,
    setVisible(v) {
      visible = v;
      playState();
    },
    pointer(x, y) {
      pars.forEach((p) => {
        p.style.setProperty("--px", `${x * 6}deg`);
        p.style.setProperty("--py", `${-y * 4}deg`);
      });
    },
    destroy() {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearInterval(t));
      ro.disconnect();
      fitEl.remove();
    },
  };
}
