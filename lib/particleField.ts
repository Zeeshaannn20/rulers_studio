// A small, dependency-free WebGL particle field for the Services stage.
// Every particle has one position per scene (SCENES); the vertex shader morphs between the
// scene we are leaving and the scene we are entering, scattering the particles mid-way
// (the "disintegrate and re-form" look), while a slice of particles drifts as ambient dust.

// Formations in the full set: 0 helix, 1 kernel, 2 constellation, 3 mosaic, 4 vortex, 5 phone, 6 avatar.
// KEEP picks which ones the Services stage shows, in order (one per service).
const KEEP = [0, 1, 2, 5];
export const SCENES = KEEP.length;

type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// two colours per scene: particles pick a mix of the pair
const ALL_PALETTES: Array<[string, string]> = [
  ["#d8ff00", "#dcdcdc"], // 01 ad films — sunlit amber helix
  ["#d8ff00", "#f6f6f6"], // 02 product — glowing haze kernel
  ["#d8ff00", "#e2e2e2"], // 03 brand stories — sand-gold constellation
  ["#898989", "#d8ff00"], // 04 films — mushroom & sand mosaic
  ["#aeaeae", "#e2e2e2"], // 05 micro dramas — cool fog vortex
  ["#e6e6e6", "#d8ff00"], // 06 UGC — ivory phone
  ["#d8ff00", "#ffffff"], // 07 avatars — haze bust
];
export const PALETTES = KEEP.map((k) => ALL_PALETTES[k]);

// ── formations ────────────────────────────────────────────────────────────
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type V3 = [number, number, number];
type Gen = (i: number, n: number, r: () => number, g: () => number) => V3;

const helix: Gen = (i, n, r, g) => {
  const k = r();
  if (k < 0.12) {
    // rungs between the two strands
    const u = Math.floor(r() * 16) / 15;
    const y = (u * 2 - 1) * 0.92;
    const a = u * Math.PI * 3.2;
    const R = 0.3 * (0.72 + 0.38 * Math.sin(u * Math.PI));
    const s = r() * 2 - 1;
    return [R * Math.cos(a) * s + g() * 0.01, y + g() * 0.01, R * Math.sin(a) * s + g() * 0.01];
  }
  if (k < 0.17) {
    const u = r();
    return [g() * 0.32, (u * 2 - 1) * 0.95, g() * 0.32];
  }
  const u = r();
  const strand = i % 2;
  const fiber = (i >> 1) % 7;
  const y = (u * 2 - 1) * 0.95;
  const a = u * Math.PI * 3.2 + strand * Math.PI + (fiber - 3) * 0.05;
  const R = (0.3 + (fiber - 3) * 0.012) * (0.72 + 0.38 * Math.sin(u * Math.PI)) + g() * 0.01;
  return [R * Math.cos(a), y + g() * 0.006, R * Math.sin(a)];
};

const kernel: Gen = (i, n, r, g) => {
  const k = r();
  if (k < 0.14) {
    // tilted orbit ring around the product
    const a = r() * Math.PI * 2;
    const R = 0.82 + g() * 0.012;
    const x = R * Math.cos(a);
    const z = R * Math.sin(a);
    return [x, z * 0.28 + g() * 0.01 - 0.04, z];
  }
  if (k < 0.3) {
    const R = Math.cbrt(r()) * 0.3;
    const t = r() * Math.PI * 2;
    const p = Math.acos(2 * r() - 1);
    return [R * Math.sin(p) * Math.cos(t), R * Math.cos(p) * 1.18, R * Math.sin(p) * Math.sin(t)];
  }
  // fibonacci shell, slightly egg-shaped like a kernel
  const j = i + 0.5;
  const p = Math.acos(1 - (2 * (j % n)) / n);
  const t = Math.PI * (1 + Math.sqrt(5)) * j;
  const R = 0.46 + g() * 0.006;
  const y = Math.cos(p);
  const taper = 1 - 0.18 * Math.max(0, -y);
  return [R * Math.sin(p) * Math.cos(t) * taper, R * y * 1.22, R * Math.sin(p) * Math.sin(t) * taper];
};

const NODES: V3[] = [
  [-0.62, 0.78, 0.05], [-0.34, 0.5, -0.1], [-0.42, 0.12, 0.12], [-0.08, 0.28, 0.0], [0.24, 0.62, -0.12],
  [0.18, -0.04, 0.1], [0.5, 0.24, 0.05], [0.62, -0.28, -0.1], [-0.18, -0.36, -0.08], [0.06, -0.66, 0.12],
  [0.38, -0.78, -0.05], [-0.56, -0.62, 0.08], [0.78, 0.6, 0.1],
];
const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6], [6, 12], [5, 7], [5, 8], [8, 9], [9, 10], [8, 11], [2, 8], [4, 12],
];
const constellation: Gen = (i, n, r, g) => {
  if (r() < 0.32) {
    const c = NODES[i % NODES.length];
    const s = i % 5 === 0 ? 0.05 : 0.022;
    return [c[0] + g() * s, c[1] + g() * s, c[2] + g() * s];
  }
  const [a, b] = EDGES[Math.floor(r() * EDGES.length)];
  const t = r();
  const A = NODES[a];
  const B = NODES[b];
  return [A[0] + (B[0] - A[0]) * t + g() * 0.006, A[1] + (B[1] - A[1]) * t + g() * 0.006, A[2] + (B[2] - A[2]) * t + g() * 0.006];
};

const MC = 26;
const MR = 17;
// each tile gets its own density, so the sheet reads as a mosaic of brighter and darker plots
const TILE_W = (() => {
  const r = mulberry(77);
  const w: number[] = [];
  let sum = 0;
  for (let i = 0; i < MC * MR; i++) {
    const v = Math.pow(r(), 2.2) + 0.08;
    sum += v;
    w.push(sum);
  }
  return w.map((v) => v / sum);
})();
const mosaic: Gen = (i, n, r) => {
  const u = r();
  let lo = 0;
  let hi = TILE_W.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (TILE_W[mid] < u) lo = mid + 1;
    else hi = mid;
  }
  const cx = lo % MC;
  const cy = (lo / MC) | 0;
  const cw = 2.1 / MC;
  const ch = 1.42 / MR;
  const x = -1.05 + (cx + 0.14 + r() * 0.72) * cw;
  const y = -0.71 + (cy + 0.14 + r() * 0.72) * ch;
  // the sheet curls like the field in the reference
  const z = 0.26 * Math.sin(x * 2.1 + y * 1.3) - 0.18 * x + 0.12 * Math.cos(y * 3.0);
  return [x, y, z];
};

const vortex: Gen = (i, n, r, g) => {
  const arm = i % 3;
  const rr = Math.pow(r(), 0.7) * 0.92;
  const th = rr * 4.4 + (arm * Math.PI * 2) / 3 + (g() * 0.22) / (rr + 0.25);
  const x = rr * Math.cos(th);
  const z = rr * Math.sin(th);
  const y = g() * 0.05 * (1.1 - rr);
  // tilt the disc toward the viewer
  const t = -1.05;
  return [x, y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)];
};

const phone: Gen = (i, n, r, g) => {
  const W = 0.29;
  const H = 0.62;
  const k = r();
  if (k < 0.5) {
    // rounded outline
    const per = 4 * (W + H);
    let d = r() * per;
    let x: number, y: number;
    if (d < 2 * W) { x = -W + d; y = H; }
    else if ((d -= 2 * W) < 2 * H) { x = W; y = H - d; }
    else if ((d -= 2 * H) < 2 * W) { x = W - d; y = -H; }
    else { d -= 2 * W; x = -W; y = -H + d; }
    const rad = 0.07;
    const ax = Math.max(Math.abs(x) - (W - rad), 0);
    const ay = Math.max(Math.abs(y) - (H - rad), 0);
    if (ax > 0 && ay > 0) {
      const a = Math.atan2(ay, ax);
      x = Math.sign(x) * (W - rad + rad * Math.cos(a));
      y = Math.sign(y) * (H - rad + rad * Math.sin(a));
    }
    return [x + g() * 0.005, y + g() * 0.005, g() * 0.01];
  }
  if (k < 0.6) {
    // play triangle
    const a = r();
    const b = r() * (1 - a);
    return [-0.06 + a * 0.15, 0.08 + (b - (1 - a) / 2) * 0.17, 0.02];
  }
  if (k < 0.82) {
    // feed lines
    const line = Math.floor(r() * 4);
    const len = [0.4, 0.3, 0.44, 0.22][line];
    return [-0.2 + r() * len, -0.2 - line * 0.075 + g() * 0.006, g() * 0.01];
  }
  // floating hearts drifting off the side (the reel "pops")
  const t = r() * Math.PI * 2;
  const s = 0.035 + r() * 0.03;
  const hx = 16 * Math.pow(Math.sin(t), 3);
  const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  const which = i % 3;
  const ox = [0.42, 0.52, 0.38][which];
  const oy = [0.1, 0.38, 0.62][which];
  return [ox + (hx / 16) * s, oy + (hy / 16) * s, 0.05];
};

const avatar: Gen = (i, n, r, g) => {
  const k = r();
  const sph = (): V3 => {
    const t = r() * Math.PI * 2;
    const p = Math.acos(2 * r() - 1);
    return [Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
  };
  if (k < 0.44) {
    const [x, y, z] = sph();
    return [x * 0.25, 0.34 + y * 0.33, z * 0.28];
  }
  if (k < 0.5) {
    const a = r() * Math.PI * 2;
    return [Math.cos(a) * 0.1, -0.06 + r() * 0.14, Math.sin(a) * 0.1];
  }
  if (k < 0.84) {
    let [x, y, z] = sph();
    if (y < 0) y = -y * 0.15;
    return [x * 0.6, -0.5 + y * 0.42, z * 0.3];
  }
  // AI scan ring sweeping the head
  const a = r() * Math.PI * 2;
  const R = 0.42 + g() * 0.006;
  return [Math.cos(a) * R, 0.32 + Math.sin(a) * 0.06, Math.sin(a) * R];
};

const ALL_GENS: Gen[] = [helix, kernel, constellation, mosaic, vortex, phone, avatar];
const GENS: Gen[] = KEEP.map((k) => ALL_GENS[k]);

// ── GL ────────────────────────────────────────────────────────────────────
const VS = `
precision highp float;
${Array.from({ length: SCENES }, (_, i) => `attribute vec3 aP${i};`).join(" ")} attribute vec4 aR;
uniform float uWf[${SCENES}]; uniform float uWt[${SCENES}];
uniform vec3 uCa[${SCENES}]; uniform vec3 uCb[${SCENES}];
uniform int uFrom; uniform int uTo;
uniform float uMix, uTime, uAspect, uScale, uSize, uDpr;
uniform vec2 uOffset, uPointer;
varying vec3 vCol; varying float vA;
vec3 pick(float w[${SCENES}]) {
  return ${Array.from({ length: SCENES }, (_, i) => `aP${i}*w[${i}]`).join(" + ")};
}
void main() {
  float amb = step(aR.w, 0.05);
  float tt = clamp((uMix - aR.x * 0.38) / 0.62, 0.0, 1.0);
  tt = tt * tt * (3.0 - 2.0 * tt);
  vec3 pf = pick(uWf);
  vec3 pt = pick(uWt);
  vec3 p = mix(pf, pt, tt);
  float burst = sin(tt * 3.14159);
  vec3 dir = vec3(aR.y - 0.5, aR.z - 0.5, fract(aR.x * 7.13) - 0.5);
  p += dir * burst * 0.38;
  p.y += burst * burst * 0.06;
  float t = uTime;
  p += 0.012 * vec3(sin(t * 0.8 + aR.x * 40.0), cos(t * 0.7 + aR.y * 40.0), sin(t * 0.6 + aR.z * 30.0));
  // gentle turn + pointer parallax
  float ry = sin(t * 0.16) * 0.42 + uPointer.x * 0.35;
  float rx = 0.06 + uPointer.y * 0.18;
  float cy = cos(ry), sy = sin(ry), cx = cos(rx), sx = sin(rx);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  // ambient dust: its own slow upward drift, not part of any formation
  vec3 d = vec3(aP0.x * 1.5, mod(aP0.y * 1.6 + t * (0.02 + aR.x * 0.03) + 1.6, 3.2) - 1.6, aP0.z);
  d.x += sin(t * 0.3 + aR.y * 20.0) * 0.04;
  vec3 q = mix(p * uScale, d, amb);
  float depth = 2.6 - q.z;
  vec2 c = q.xy * 2.4 / depth;
  c.x /= uAspect;
  c += uOffset * (1.0 - amb);
  gl_Position = vec4(c, 0.0, 1.0);
  float big = aR.z > 0.975 ? 3.2 : 1.0;
  gl_PointSize = uSize * uDpr * (0.55 + aR.y * 0.9) * big * (2.6 / depth) * mix(1.0, 0.7, amb) * (1.0 + burst * 0.25);
  vec3 cf = mix(uCa[uFrom], uCb[uFrom], aR.y);
  vec3 ct = mix(uCa[uTo], uCb[uTo], aR.y);
  vCol = mix(mix(cf, ct, tt), vec3(0.95, 0.96, 0.92), amb * 0.6);
  float tw = 0.75 + 0.25 * sin(t * 2.0 + aR.x * 60.0);
  vA = mix(1.0, 0.22, amb) * tw * (1.0 - burst * 0.25);
}`;
const FS = `
precision mediump float;
varying vec3 vCol; varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float a = smoothstep(0.5, 0.0, r);
  a = a * a * vA;
  float core = smoothstep(0.16, 0.0, r) * vA * 0.75;
  gl_FragColor = vec4(vCol * a + core, a);
}`;

export type Field = {
  set: (from: number, to: number, mix: number) => void;
  pointer: (x: number, y: number) => void;
  resize: () => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
};

export function createField(canvas: HTMLCanvasElement, count: number): Field | null {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
  if (!gl) return null;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // build the formations once
  const r = mulberry(1317);
  const g = () => {
    // cheap gaussian
    return (r() + r() + r() - 1.5) / 1.5;
  };
  const rand = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    rand[i * 4] = r();
    rand[i * 4 + 1] = r();
    rand[i * 4 + 2] = r();
    rand[i * 4 + 3] = r();
  }
  const buffers: WebGLBuffer[] = [];
  const bind = (name: string, data: Float32Array, size: number) => {
    const b = gl.createBuffer()!;
    buffers.push(b);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  for (let s = 0; s < SCENES; s++) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let v: V3;
      if (rand[i * 4 + 3] <= 0.14) {
        // ambient particles: a random spot in a wide box (same in every scene)
        const rr = mulberry(i * 7919 + 3);
        v = [rr() * 2 - 1, rr() * 2 - 1, rr() * 1.8 - 0.9];
      } else v = GENS[s](i, count, r, g);
      pos.set(v, i * 3);
    }
    bind("aP" + s, pos, 3);
  }
  bind("aR", rand, 4);

  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uWf = U("uWf"), uWt = U("uWt"), uFrom = U("uFrom"), uTo = U("uTo"), uMix = U("uMix");
  const uTime = U("uTime"), uAspect = U("uAspect"), uScale = U("uScale"), uSize = U("uSize"), uDpr = U("uDpr");
  const uOffset = U("uOffset"), uPointer = U("uPointer");
  const ca = new Float32Array(SCENES * 3);
  const cb = new Float32Array(SCENES * 3);
  PALETTES.forEach(([a, b], i) => {
    ca.set(hex(a), i * 3);
    cb.set(hex(b), i * 3);
  });
  gl.uniform3fv(U("uCa"), ca);
  gl.uniform3fv(U("uCb"), cb);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  const state = { from: 0, to: 0, mix: 0 };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let dpr = 1;
  let raf = 0;
  let running = false;
  const t0 = performance.now();
  const wf = new Float32Array(SCENES);
  const wt = new Float32Array(SCENES);

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const narrow = w < 861;
    gl.uniform1f(uAspect, w / Math.max(1, h));
    gl.uniform1f(uScale, narrow ? 0.62 : 0.86);
    gl.uniform2f(uOffset, narrow ? 0 : 0.36, narrow ? 0.36 : 0);
    gl.uniform1f(uSize, Math.max(1.8, (h / 900) * 3.7));
    gl.uniform1f(uDpr, dpr);
  };

  const frame = () => {
    raf = requestAnimationFrame(frame);
    ptr.x += (ptr.tx - ptr.x) * 0.06;
    ptr.y += (ptr.ty - ptr.y) * 0.06;
    wf.fill(0);
    wt.fill(0);
    wf[state.from] = 1;
    wt[state.to] = 1;
    gl.uniform1fv(uWf, wf);
    gl.uniform1fv(uWt, wt);
    gl.uniform1i(uFrom, state.from);
    gl.uniform1i(uTo, state.to);
    gl.uniform1f(uMix, state.mix);
    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.uniform2f(uPointer, ptr.x, ptr.y);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, count);
  };

  resize();
  return {
    set(from, to, mix) {
      state.from = from;
      state.to = to;
      state.mix = mix;
    },
    pointer(x, y) {
      ptr.tx = x;
      ptr.ty = y;
    },
    resize,
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteProgram(prog);
    },
  };
}
