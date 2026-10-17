// Small 3D particle scenes for the four "How we work" cards (same look as the Services stage).
// Each card gets its own scene, drawn with WebGL points. Points fly in and assemble when the card
// comes into view, the scene turns gently in 3D and follows the pointer, and a few parts animate:
//   brief       two speech bubbles, the client's message types out, our reply shows typing dots
//   script      script pages fanned in 3D, lines writing themselves, a storyboard grid
//   production  a prompt bar with a blinking cursor, a frame whose 3D surface is being generated
//   edit        a 3D timeline: clips, a moving audio waveform, a playhead, and 16:9 / 9:16 / 1:1 frames

export type StepKind = "brief" | "script" | "production" | "edit";

type P = { x: number; y: number; z: number; g: number; k: number };
// g = behaviour: 0 still, 1 pulse (typing dots / cursor), 2 surface wave, 3 playhead sweep,
//     4 orbit, 5 reveal (writing), 6 audio wave

const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

class Builder {
  pts: P[] = [];
  constructor(public r: () => number) {}
  j(s = 0.006) {
    return (this.r() - 0.5) * 2 * s;
  }
  add(x: number, y: number, z: number, g = 0, k = 0) {
    this.pts.push({ x: x + this.j(), y: y + this.j(), z: z + this.j(), g, k });
  }
  line(x0: number, y0: number, x1: number, y1: number, z: number, n: number, g = 0, kf?: (t: number) => number) {
    for (let i = 0; i < n; i++) {
      const t = this.r();
      this.add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z, g, kf ? kf(t) : 0);
    }
  }
  // rounded rectangle outline
  rect(cx: number, cy: number, z: number, w: number, h: number, rad: number, n: number, g = 0) {
    const sw = w - 2 * rad;
    const sh = h - 2 * rad;
    const per = 2 * (sw + sh) + 2 * Math.PI * rad;
    for (let i = 0; i < n; i++) {
      let d = this.r() * per;
      let x = 0;
      let y = 0;
      if (d < sw) [x, y] = [-sw / 2 + d, h / 2];
      else if ((d -= sw) < sh) [x, y] = [w / 2, sh / 2 - d];
      else if ((d -= sh) < sw) [x, y] = [sw / 2 - d, -h / 2];
      else if ((d -= sw) < sh) [x, y] = [-w / 2, -sh / 2 + d];
      else {
        d -= sh;
        const a = (d / (2 * Math.PI * rad)) * Math.PI * 2;
        const q = Math.floor(a / (Math.PI / 2));
        const c = [
          [sw / 2, sh / 2],
          [sw / 2, -sh / 2],
          [-sw / 2, -sh / 2],
          [-sw / 2, sh / 2],
        ][q % 4];
        const aa = Math.PI / 2 - a;
        [x, y] = [c[0] + Math.cos(aa) * rad, c[1] + Math.sin(aa) * rad];
      }
      this.add(cx + x, cy + y, z, g);
    }
  }
  fill(cx: number, cy: number, z: number, w: number, h: number, n: number, g = 0) {
    for (let i = 0; i < n; i++) this.add(cx + (this.r() - 0.5) * w, cy + (this.r() - 0.5) * h, z, g);
  }
  dust(n: number, sx = 1.1, sy = 0.9, sz = 0.6) {
    for (let i = 0; i < n; i++) this.add((this.r() - 0.5) * 2 * sx, (this.r() - 0.5) * 2 * sy, (this.r() - 0.5) * 2 * sz, 0, -1);
  }
  // move the points added since `from` (rotate around Y, then shift)
  place(from: number, ry: number, dx: number, dy: number, dz: number) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    for (let i = from; i < this.pts.length; i++) {
      const p = this.pts[i];
      const x = p.x * c + p.z * s;
      const z = -p.x * s + p.z * c;
      p.x = x + dx;
      p.y += dy;
      p.z = z + dz;
    }
  }
}

function brief(b: Builder, n: number) {
  const u = n / 100;
  // client's message: a big bubble with a tail, text writing itself
  b.rect(-0.22, 0.26, 0, 1.0, 0.5, 0.12, Math.round(18 * u));
  b.line(-0.6, 0.01, -0.68, -0.12, 0, Math.round(1.6 * u));
  b.line(-0.68, -0.12, -0.46, 0.01, 0, Math.round(1.6 * u));
  [0.38, 0.26, 0.14].forEach((y, li) => {
    const w = [0.72, 0.6, 0.42][li];
    b.line(-0.6, y, -0.6 + w, y, 0, Math.round(7 * u), 5, (t) => (li + t) / 3);
  });
  // our reply: a smaller bubble in front, three typing dots
  b.rect(0.34, -0.28, 0.26, 0.74, 0.34, 0.1, Math.round(15 * u));
  b.line(0.62, -0.45, 0.72, -0.56, 0.26, Math.round(1.4 * u));
  b.line(0.72, -0.56, 0.5, -0.45, 0.26, Math.round(1.4 * u));
  [0, 1, 2].forEach((d) => {
    for (let i = 0; i < Math.round(3.2 * u); i++) {
      const a = b.r() * Math.PI * 2;
      const rr = Math.sqrt(b.r()) * 0.035;
      b.add(0.2 + d * 0.14 + Math.cos(a) * rr, -0.28 + Math.sin(a) * rr, 0.26, 1, (d + 1) / 4);
    }
  });
  // two people: small rings for the client (left) and the studio (right)
  const head = (cx: number, cy: number, z: number, m: number) => {
    for (let i = 0; i < m; i++) {
      const a = b.r() * Math.PI * 2;
      b.add(cx + Math.cos(a) * 0.07, cy + Math.sin(a) * 0.07, z);
      if (i % 2) b.add(cx + Math.cos(a / 2 + Math.PI) * 0.13, cy - 0.17 - Math.sin(a / 2 + Math.PI) * 0.05, z);
    }
  };
  head(-0.82, -0.32, 0, Math.round(3 * u));
  head(0.88, 0.02, 0.26, Math.round(3 * u));
  b.dust(Math.round(12 * u));
}

function script(b: Builder, n: number) {
  const u = n / 100;
  // three script pages fanned in 3D, each writing its lines in turn
  [-1, 0, 1].forEach((side, pi) => {
    const from = b.pts.length;
    b.rect(0, 0, 0, 0.62, 0.84, 0.04, Math.round(11 * u));
    b.line(-0.22, 0.32, 0.12, 0.32, 0, Math.round(2.2 * u), 5, (t) => (pi * 0.33 + t * 0.06));
    for (let l = 0; l < 6; l++) {
      const y = 0.22 - l * 0.085;
      const w = l === 2 ? 0.26 : 0.44 - (l % 3) * 0.06;
      b.line(-0.22, y, -0.22 + w, y, 0, Math.round(1.5 * u), 5, (t) => pi * 0.33 + ((l + t) / 6) * 0.3);
    }
    b.place(from, side * 0.42, side * 0.52, side === 0 ? 0.1 : 0.04, side === 0 ? 0.18 : -0.1 * Math.abs(side));
  });
  // a storyboard strip below: 4 frames with little shot marks
  for (let f = 0; f < 4; f++) {
    const cx = -0.6 + f * 0.4;
    b.rect(cx, -0.56, 0.3, 0.32, 0.18, 0.02, Math.round(3.2 * u));
    b.add(cx - 0.08, -0.54, 0.3, 1, (f + 1) / 5);
  }
  b.dust(Math.round(10 * u));
}

function production(b: Builder, n: number) {
  const u = n / 100;
  // the frame being generated: a 3D surface that ripples like it's still forming
  b.rect(0, 0.18, 0, 1.4, 0.78, 0.05, Math.round(14 * u));
  const cols = 34;
  const rows = 15;
  const m = Math.round(36 * u);
  for (let i = 0; i < m; i++) {
    const c = Math.floor(b.r() * cols);
    const r = Math.floor(b.r() * rows);
    b.add(-0.62 + (c / (cols - 1)) * 1.24, -0.12 + (r / (rows - 1)) * 0.6, -0.1 + (r / rows) * 0.2, 2, 1);
  }
  // sparks orbiting the frame
  for (let i = 0; i < Math.round(8 * u); i++) b.add(0.82 + b.j(0.05), 0.18, 0, 4, b.r());
  // the prompt bar with text writing and a blinking cursor
  b.rect(0, -0.56, 0.22, 1.24, 0.17, 0.08, Math.round(10 * u));
  b.add(-0.52, -0.56, 0.22, 0, 0);
  b.line(-0.48, -0.56, 0.28, -0.56, 0.22, Math.round(9 * u), 5, (t) => t * 0.95);
  b.line(0.33, -0.6, 0.33, -0.52, 0.22, Math.round(2.4 * u), 1, () => 0);
  b.dust(Math.round(9 * u));
}

function edit(b: Builder, n: number) {
  const u = n / 100;
  const from = b.pts.length;
  // the timeline: three tracks of clips, one audio track, a playhead
  const tracks = [
    [0.18, [[-0.78, -0.32], [-0.28, 0.1], [0.14, 0.5], [0.54, 0.78]]],
    [0.06, [[-0.78, -0.5], [-0.44, 0.22], [0.28, 0.78]]],
    [-0.06, [[-0.6, -0.1], [0.1, 0.46]]],
  ] as const;
  tracks.forEach(([y, clips], ti) =>
    clips.forEach(([x0, x1]) => {
      b.rect((x0 + x1) / 2, y, 0, x1 - x0 - 0.02, 0.085, 0.02, Math.round((x1 - x0) * 6 * u));
      if (ti === 0) b.fill((x0 + x1) / 2, y, 0, x1 - x0 - 0.05, 0.05, Math.round((x1 - x0) * 3 * u));
    })
  );
  b.line(-0.78, -0.22, 0.78, -0.22, 0, Math.round(16 * u), 6);
  b.line(0, 0.3, 0, -0.32, 0.02, Math.round(5 * u), 3, () => 0.78);
  b.place(from, 0, 0, -0.08, 0);
  // tilt the timeline back into space
  for (let i = from; i < b.pts.length; i++) {
    const p = b.pts[i];
    const a = -0.55;
    const y = p.y * Math.cos(a) - p.z * Math.sin(a);
    const z = p.y * Math.sin(a) + p.z * Math.cos(a);
    p.y = y - 0.12;
    p.z = z;
  }
  // delivered in every size: 16:9, 9:16 and 1:1 floating above
  b.rect(-0.5, 0.48, 0.15, 0.4, 0.225, 0.02, Math.round(5 * u));
  b.rect(0.02, 0.5, 0.25, 0.16, 0.285, 0.02, Math.round(4.5 * u));
  b.rect(0.44, 0.48, 0.15, 0.24, 0.24, 0.02, Math.round(4.5 * u));
  b.dust(Math.round(9 * u));
}

const BUILD: Record<StepKind, (b: Builder, n: number) => void> = { brief, script, production, edit };

const VS = `
precision highp float;
attribute vec3 aP; attribute vec2 aG; attribute vec4 aR;
uniform float uTime, uAsm, uAspect, uScale, uSize, uDpr;
uniform vec2 uPointer, uCenter;
varying vec3 vCol; varying float vA;
void main() {
  vec3 p = aP;
  float g = aG.x, k = aG.y, t = uTime, a = 1.0;
  if (g > 0.5 && g < 1.5) {            // pulse: typing dots, cursor
    float s = 0.5 + 0.5 * sin(t * 5.0 - k * 6.2832);
    p.y += s * 0.025 * step(0.01, k);
    a = 0.25 + 0.75 * (k > 0.001 ? s : step(0.5, fract(t * 1.1)));
  } else if (g < 2.5 && g > 1.5) {     // surface forming
    p.z += sin(p.x * 6.0 + t * 1.4) * 0.07 + cos(p.y * 9.0 - t * 1.1) * 0.05;
    p.y += sin(p.x * 4.0 - t * 0.9) * 0.02;
    a = 0.55 + 0.45 * sin(p.x * 3.0 + p.y * 5.0 + t * 2.0);
  } else if (g < 3.5 && g > 2.5) {     // playhead sweep
    p.x = -k + fract(t * 0.09) * 2.0 * k;
  } else if (g < 4.5 && g > 3.5) {     // orbit
    float an = k * 6.2832 + t * 0.6;
    p = vec3(cos(an) * 0.86, 0.18 + sin(an) * 0.5, sin(an) * 0.3);
  } else if (g < 5.5 && g > 4.5) {     // writing: lines appear in order, hold, then clear
    float cyc = fract(t * 0.085) * 1.35;
    a = smoothstep(k - 0.02, k + 0.01, cyc) * (1.0 - smoothstep(1.25, 1.35, cyc));
  } else if (g > 5.5) {                // audio waveform
    p.y += sin(p.x * 22.0 + t * 6.0) * 0.05 * (0.4 + 0.6 * abs(sin(p.x * 3.0 + t * 0.8)));
  }
  // assemble: fly in from a scattered cloud, each point on its own delay
  float d = clamp((uAsm - aR.x * 0.45) / 0.55, 0.0, 1.0);
  d = 1.0 - pow(1.0 - d, 3.0);
  vec3 sc = (aR.yzw - 0.5) * vec3(3.2, 2.4, 2.0);
  p = mix(sc, p, d);
  p += 0.008 * vec3(sin(t * 0.9 + aR.x * 40.0), cos(t * 0.8 + aR.y * 40.0), sin(t * 0.7 + aR.z * 30.0));
  // slow turn + pointer parallax
  float ry = sin(t * 0.22) * 0.32 + uPointer.x * 0.35;
  float rx = 0.1 + uPointer.y * 0.18;
  float cy = cos(ry), sy = sin(ry), cx = cos(rx), sx = sin(rx);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  p *= uScale;
  float depth = 2.6 - p.z;
  vec2 c = p.xy * 2.4 / depth;
  c.x /= uAspect;
  gl_Position = vec4(c + uCenter, 0.0, 1.0);
  float dust = step(k, -0.5);
  float big = aR.z > 0.97 ? 2.4 : 1.0;
  gl_PointSize = uSize * uDpr * (0.6 + aR.y * 0.8) * big * (2.6 / depth) * mix(1.0, 0.75, dust);
  vec3 lime = vec3(0.847, 1.0, 0.0), white = vec3(0.93, 0.94, 0.9);
  vCol = mix(lime, white, step(0.62, aR.w) * 0.85 + dust * 0.4);
  float tw = 0.78 + 0.22 * sin(t * 2.2 + aR.x * 60.0);
  vA = a * tw * mix(1.0, 0.35, dust) * mix(0.35, 1.0, d);
}`;
const FS = `
precision mediump float;
varying vec3 vCol; varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float a = smoothstep(0.5, 0.0, r);
  a = a * a * vA;
  float core = smoothstep(0.18, 0.0, r) * vA * 0.95;
  gl_FragColor = vec4(vCol * a + core, a);
}`;

export type StepScene = {
  start: () => void;
  stop: () => void;
  resize: () => void;
  pointer: (x: number, y: number) => void;
  assemble: () => void;
  destroy: () => void;
};

export function createStepScene(canvas: HTMLCanvasElement, kind: StepKind, count: number): StepScene | null {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const r = mulberry({ brief: 11, script: 23, production: 37, edit: 53 }[kind]);
  const b = new Builder(r);
  BUILD[kind](b, count);
  const pts = b.pts;
  const n = pts.length;
  const pos = new Float32Array(n * 3);
  const grp = new Float32Array(n * 2);
  const rnd = new Float32Array(n * 4);
  pts.forEach((p, i) => {
    pos.set([p.x, p.y, p.z], i * 3);
    grp.set([p.g, p.k], i * 2);
    rnd.set([r(), r(), r(), r()], i * 4);
  });
  const buffers: WebGLBuffer[] = [];
  const bind = (name: string, data: Float32Array, size: number) => {
    const buf = gl.createBuffer()!;
    buffers.push(buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  bind("aP", pos, 3);
  bind("aG", grp, 2);
  bind("aR", rnd, 4);

  const U = (name: string) => gl.getUniformLocation(prog, name);
  const uTime = U("uTime"), uAsm = U("uAsm"), uAspect = U("uAspect"), uScale = U("uScale");
  const uSize = U("uSize"), uDpr = U("uDpr"), uPointer = U("uPointer"), uCenter = U("uCenter");
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let raf = 0;
  let running = false;
  const t0 = performance.now();
  let asmStart = -1;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = w / Math.max(1, h);
    gl.uniform1f(uAspect, aspect);
    // fit the scene (about 2 units wide, 1.6 tall) inside the canvas
    gl.uniform1f(uScale, Math.min(1.18, aspect * 1.02));
    gl.uniform1f(uSize, Math.max(2.2, (h / 320) * 3.0));
    gl.uniform1f(uDpr, dpr);
    gl.uniform2f(uCenter, 0, 0);
  };

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    ptr.x += (ptr.tx - ptr.x) * 0.06;
    ptr.y += (ptr.ty - ptr.y) * 0.06;
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform1f(uAsm, asmStart < 0 ? 0 : Math.min(1, (now - asmStart) / 2200));
    gl.uniform2f(uPointer, ptr.x, ptr.y);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, n);
  };

  resize();
  return {
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize,
    pointer(x, y) {
      ptr.tx = x;
      ptr.ty = y;
    },
    assemble() {
      if (asmStart < 0) asmStart = performance.now();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      buffers.forEach((x) => gl.deleteBuffer(x));
      gl.deleteProgram(prog);
    },
  };
}
