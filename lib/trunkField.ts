// The glowing organic "trunk" behind the Work tree (reference: activetheory.net/work).
// Points live in the same pixel space as the CSS 3D world, and the vertex shader applies the
// exact CSS camera (translateY → rotateY → translateZ → perspective), so the trunk and the
// DOM glass panels move as one scene.

type Cam = { rot: number; y: number; back: number; persp: number; offX: number };

const VS = `
precision highp float;
attribute vec3 aP; attribute vec4 aR;
uniform float uRot, uY, uBack, uPersp, uTime, uDpr, uPx, uOffX;
uniform vec2 uHalf;
varying vec3 vCol; varying float vA;
void main(){
  vec3 p = aP;
  // slow organic sway + a gentle twist of the whole trunk
  float tw = uTime * 0.05 + p.y * 0.0012;
  p.x += sin(uTime * 0.6 + aR.x * 20.0 + p.y * 0.01) * 6.0;
  p.z += cos(uTime * 0.5 + aR.y * 20.0 + p.y * 0.012) * 6.0;
  float ct = cos(tw), st = sin(tw);
  p = vec3(ct * p.x + st * p.z, p.y, -st * p.x + ct * p.z);
  // CSS camera: translateY(-y) → rotateY(rot) → translateZ(-back) → perspective
  p.y -= uY;
  float c = cos(uRot), s = sin(uRot);
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  p.z -= uBack;
  float k = uPersp / max(uPersp - p.z, 1.0);
  vec2 sc = p.xy * k;
  sc.x += uOffX;
  gl_Position = vec4(sc.x / uHalf.x, -sc.y / uHalf.y, 0.0, 1.0);
  float neb = step(0.86, aR.w);   // ~14% are large soft glows that give the trunk its volume
  gl_PointSize = mix(2.2 + aR.z * aR.z * aR.z * 14.0, 34.0 + aR.x * 70.0, neb) * k * uDpr * uPx;
  // iridescent palette drawn from the site: champagne, rose-gold, mist blue, ivory
  vec3 a = vec3(0.85, 1.0, 0.0);
  vec3 b = vec3(0.92, 0.95, 0.88);
  vec3 cc = vec3(0.62, 0.78, 0.0);
  vec3 d = vec3(1.0, 1.0, 1.0);
  float h = fract(aR.w + p.y * 0.0007 + uTime * 0.02);
  vec3 col = h < 0.33 ? mix(a, b, h * 3.0) : h < 0.66 ? mix(b, cc, (h - 0.33) * 3.0) : mix(cc, d, (h - 0.66) * 3.0);
  vCol = col;
  float tw2 = 0.7 + 0.3 * sin(uTime * 1.7 + aR.x * 50.0);
  // fade with depth so the far side of the trunk sits back
  vA = 1.25 * tw2 * clamp(0.45 + (p.z + uBack) / (uBack * 1.4), 0.3, 1.0) * mix(1.0, 0.09, neb);
}`;
const FS = `
precision mediump float;
varying vec3 vCol; varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float a = smoothstep(0.5, 0.0, r);
  a = a * a * vA;
  gl_FragColor = vec4(vCol * a, a);
}`;

export type Trunk = { setCam: (c: Cam) => void; resize: () => void; start: () => void; stop: () => void; destroy: () => void };

export function createTrunk(canvas: HTMLCanvasElement, count: number, yMin: number, yMax: number): Trunk | null {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return null;
  const sh = (t: number, src: string) => {
    const s = gl.createShader(t)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // seeded random so the trunk is the same on every visit
  let seed = 2026;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const g = () => (r() + r() + r() - 1.5) / 1.5;
  // the trunk: a chain of soft blobs stacked up a gently wandering spine, plus fine strands
  const pos = new Float32Array(count * 3);
  const rnd = new Float32Array(count * 4);
  const blobs: Array<[number, number, number, number]> = [];
  for (let y = yMin; y < yMax; y += 45 + r() * 50) {
    const sx = Math.sin(y * 0.004) * 70 + g() * 40;
    const sz = Math.cos(y * 0.0035) * 70 + g() * 40;
    blobs.push([sx, y, sz, 50 + r() * 90]);
  }
  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number;
    if (r() < 0.78) {
      const [bx, by, bz, br] = blobs[(r() * blobs.length) | 0];
      x = bx + g() * br;
      y = by + g() * br * 0.8;
      z = bz + g() * br;
    } else {
      // strands spiralling up the trunk
      const t = r();
      y = yMin + t * (yMax - yMin);
      const a = y * 0.012 + (i % 5) * 1.256;
      const rad = 70 + Math.sin(y * 0.006 + i) * 30;
      x = Math.cos(a) * rad + g() * 6;
      z = Math.sin(a) * rad + g() * 6;
    }
    pos.set([x, y, z], i * 3);
    rnd.set([r(), r(), r(), r()], i * 4);
  }
  const bufs: WebGLBuffer[] = [];
  const bind = (name: string, data: Float32Array, size: number) => {
    const b = gl.createBuffer()!;
    bufs.push(b);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  bind("aP", pos, 3);
  bind("aR", rnd, 4);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uOffX = U("uOffX");
  const uRot = U("uRot"), uY = U("uY"), uBack = U("uBack"), uPersp = U("uPersp"), uTime = U("uTime"), uDpr = U("uDpr"), uPx = U("uPx"), uHalf = U("uHalf");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let cam: Cam = { rot: 0, y: 0, back: 400, persp: 1100, offX: 0 };
  let raf = 0;
  let running = false;
  const t0 = performance.now();
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uHalf, w / 2, h / 2);
    gl.uniform1f(uDpr, dpr);
    gl.uniform1f(uPx, Math.max(0.7, Math.min(1.3, h / 900)));
  };
  const frame = () => {
    raf = requestAnimationFrame(frame);
    gl.uniform1f(uRot, cam.rot);
    gl.uniform1f(uY, cam.y);
    gl.uniform1f(uBack, cam.back);
    gl.uniform1f(uPersp, cam.persp);
    gl.uniform1f(uOffX, cam.offX);
    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, count);
  };
  resize();
  return {
    setCam: (c) => (cam = c),
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
      bufs.forEach((b) => gl.deleteBuffer(b));
      gl.deleteProgram(prog);
    },
  };
}
