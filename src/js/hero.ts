/**
 * Liquid-glass hero: 7 metaball blobs rendered in a single WebGL pass.
 * Blobs refract a procedural background AND the real headline (drawn to an
 * offscreen texture so the glass genuinely warps the wordmark). Pointer
 * attracts blobs + spawns click ripples. Degrades: no WebGL → CSS blobs;
 * prefers-reduced-motion → one static frame; hidden/offscreen → paused.
 */
import { createProgram, canvasToTexture, type GLProgram } from './gl';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
#define NB 7
#define NR 4

uniform vec2 uRes;
uniform float uTime;
uniform vec4 uBlobs[NB];      // xy center (px, origin bottom-left), z radius, w unused
uniform vec2 uPointer;        // px
uniform float uPointerAct;    // 0..1
uniform vec4 uRipples[NR];    // xy center, z start time, w speed
uniform sampler2D uText;
uniform vec3 uTextBox;        // xy bottom-left (px), z = 1/scale (backing px per texture px)
uniform vec2 uTextSize;       // texture size in px

const float T = 0.62;         // metaball surface threshold

void field(vec2 p, out float v, out vec2 g) {
  v = 0.0; g = vec2(0.0);
  for (int i = 0; i < NB; i++) {
    vec2 d = p - uBlobs[i].xy;
    float r2 = uBlobs[i].z * uBlobs[i].z;
    float e = dot(d, d) / r2;
    if (e < 1.0) {
      float k = 1.0 - e;
      float kv = k * k;
      v += kv;
      g += -4.0 * d * k / r2;
    }
  }
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 p = gl_FragCoord.xy;

  // --- metaball field ---
  float v; vec2 g;
  field(p, v, g);
  vec2 n2 = normalize(-g + 1e-5);

  float body = smoothstep(T - 0.30, T + 0.02, v);
  float rim  = smoothstep(T - 0.14, T, v) * smoothstep(T + 0.85, T + 0.02, v);
  float halo = smoothstep(T * 0.10, T, v);

  // --- refraction offset (rim bends strongest, interior lenses gently) ---
  vec2 off = n2 * (rim * 15.0 + body * 5.0) + g * 0.02 * body;

  // --- click ripples ---
  for (int i = 0; i < NR; i++) {
    float age = uTime - uRipples[i].z;
    if (uRipples[i].w > 0.0 && age > 0.0 && age < 1.4) {
      vec2 d = p - uRipples[i].xy;
      float dist = length(d) + 1e-4;
      float ring = exp(-pow((dist - age * uRipples[i].w) / 42.0, 2.0));
      float decay = exp(-age * 2.6);
      off += (d / dist) * ring * decay * 26.0;
    }
  }

  vec2 pd = p + off;

  // --- procedural background (aurora gradient) ---
  vec2 uv = pd / uRes;
  vec3 bg = mix(vec3(0.020, 0.028, 0.050), vec3(0.033, 0.055, 0.095), uv.y);
  float t = uTime * 0.05;
  vec2 c1 = vec2(0.78, 0.86) * uRes + vec2(sin(t * 0.9) * 120.0, cos(t * 0.7) * 70.0);
  vec2 c2 = vec2(0.10, 0.62) * uRes + vec2(cos(t * 0.8) * 100.0, sin(t * 1.1) * 60.0);
  bg += vec3(0.16, 0.42, 0.66) * 0.30 * exp(-length(pd - c1) / (0.42 * uRes.y));
  bg += vec3(0.38, 0.22, 0.66) * 0.24 * exp(-length(pd - c2) / (0.40 * uRes.y));
  float vig = 1.0 - 0.38 * pow(length(uv - 0.5) * 1.42, 2.0);
  bg *= vig;

  // --- headline texture (refracted, chromatic aberration) ---
  vec3 col = bg;
  {
    vec2 tp = (pd - uTextBox.xy) / uTextBox.z;      // px in texture space
    vec2 tuv = tp / uTextSize;
    if (all(greaterThan(tuv, vec2(0.0))) && all(lessThan(tuv, vec2(1.0)))) {
      vec2 soff = clamp(off, vec2(-18.0), vec2(18.0));
      vec3 tint = vec3(0.88, 0.96, 1.06);
      vec2 ca = soff * 0.08 / uTextSize;   // ≤ ~3px of RGB split, in texture units
      float aR = texture2D(uText, tuv + ca).a;
      float aG = texture2D(uText, tuv).a;
      float aB = texture2D(uText, tuv - ca).a;
      col += tint * vec3(aR, aG, aB) * 0.98;
    }
  }

  // --- glass shading ---
  vec3 tint = mix(vec3(0.49, 0.78, 1.0), vec3(0.65, 0.55, 0.98), uv.x * 0.85 + 0.1 * sin(uTime * 0.2));
  vec3 n3 = normalize(vec3(n2 * 0.55, 1.0));
  float fres = pow(1.0 - n3.z, 2.2);
  vec3 L = normalize(vec3(-0.4, 0.62, 0.68));
  float spec = pow(max(dot(reflect(-L, n3), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);

  col = mix(col, col * 0.90 + tint * 0.045, body * 0.9);
  col += mix(tint, vec3(0.85, 0.95, 1.0), 0.35) * fres * rim * 0.95;
  col += vec3(0.95) * spec * body * (0.55 + 0.45 * uPointerAct);
  col += tint * halo * (1.0 - body) * 0.13;

  // ripple shimmer
  for (int i = 0; i < NR; i++) {
    float age = uTime - uRipples[i].z;
    if (uRipples[i].w > 0.0 && age > 0.0 && age < 1.4) {
      float dist = length(p - uRipples[i].xy);
      float ring = exp(-pow((dist - age * uRipples[i].w) / 42.0, 2.0));
      col += tint * ring * exp(-age * 2.6) * 0.30;
    }
  }

  // grain
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.7) - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

const NB = 7;

interface Blob {
  ax: number; ay: number;           // anchor (fractions of viewport)
  fx: number; fy: number;           // drift frequencies
  phx: number; phy: number;         // drift phases
  amp: number;                      // drift amplitude (fraction)
  r: number;                        // base radius (fraction of min(vw,vh))
  x: number; y: number; vx: number; vy: number; // spring state (px)
}

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  const canvas = document.querySelector<HTMLCanvasElement>('#hero-canvas');
  const title = document.querySelector<HTMLElement>('.hero-title');
  if (!hero || !canvas || !title) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let prog: GLProgram | null = null;
  let gl: WebGLRenderingContext | null = null;
  let textTex: WebGLTexture | null = null;
  const textCv = document.createElement('canvas');

  let W = 0; let H = 0; let dpr = 1;
  let raf = 0;
  let running = false;
  let visible = !document.hidden;
  let heroOnScreen = true;
  let energy = 0;

  const pointer = { x: 0, y: 0, act: 0, px: 0, py: 0 };
  const ripples = new Float32Array(4 * 4); // x,y,t0,speed — speed 0 = inactive
  let rippleIdx = 0;

  const blobs: Blob[] = [];
  const seeds = [0.18, 0.30, 0.44, 0.56, 0.70, 0.84, 0.5];
  for (let i = 0; i < NB; i++) {
    blobs.push({
      ax: seeds[i],
      ay: 0.22 + 0.6 * ((i * 0.37) % 1),
      fx: 0.10 + 0.14 * ((i * 0.71) % 1),
      fy: 0.09 + 0.13 * ((i * 0.53) % 1),
      phx: i * 1.7,
      phy: i * 2.9,
      amp: 0.10 + 0.09 * ((i * 0.29) % 1),
      r: (i === 0 ? 0.13 : 0.10) + 0.05 * ((i * 0.61) % 1),
      x: 0, y: 0, vx: 0, vy: 0,
    });
  }

  // --- WebGL setup (may fail → CSS fallback) ---
  try {
    prog = createProgram(canvas, VERT, FRAG);
  } catch {
    prog = null;
  }
  if (!prog) {
    hero.classList.add('no-webgl');
    return;
  }
  gl = prog.gl;
  prog.setInt('uText', 0);

  const min = Math.min(innerWidth, innerHeight);

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    W = Math.max(2, Math.round(rect.width * dpr));
    H = Math.max(2, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    gl!.viewport(0, 0, W, H);
    buildTextTexture();
  }

  /** Draw the real headline into an offscreen canvas, aligned to the DOM h1. */
  const buildTextTexture = () => {
    const cs = getComputedStyle(title);
    const titleRect = title.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    if (titleRect.width < 2) return;

    const scale = dpr;
    const pad = 18 * scale;
    const fontSize = parseFloat(cs.fontSize) * scale;

    const probe = textCv.getContext('2d')!;
    probe.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
    const textW = Math.ceil(probe.measureText(title.textContent || '').width);

    textCv.width = Math.min(textW + pad * 2, 4096);
    textCv.height = Math.min(Math.ceil(fontSize * 1.5) + pad * 2, 1024);

    const ctx = textCv.getContext('2d')!;
    ctx.clearRect(0, 0, textCv.width, textCv.height);
    ctx.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.textContent || '', textCv.width / 2, textCv.height / 2);

    if (textTex) gl!.deleteTexture(textTex);
    textTex = canvasToTexture(gl!, textCv);

    // texture box centered on the h1's text (block h1 spans the container)
    const cx = (titleRect.left - heroRect.left + titleRect.width / 2) * scale;
    const cyTop = (titleRect.top - heroRect.top + titleRect.height / 2) * scale;
    const bx = cx - textCv.width / 2;
    const byBottom = H - cyTop - textCv.height / 2;
    prog!.setVec3('uTextBox', bx, byBottom, scale);
    prog!.setVec2('uTextSize', textCv.width, textCv.height);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, textTex);
  }

  const setUniforms = (t: number): void => {
    const data = new Float32Array(NB * 4);
    const R = min * dpr;
    const time = t * 0.001;
    const speedBoost = 1 + energy * 1.6;

    for (let i = 0; i < NB; i++) {
      const b = blobs[i];
      let tx: number; let ty: number;
      if (i === 0) {
        // pointer blob
        tx = pointer.x * dpr;
        ty = (H - pointer.y * dpr);
      } else {
        tx = (b.ax + Math.sin(time * b.fx * speedBoost + b.phx) * b.amp) * W;
        ty = (b.ay + Math.cos(time * b.fy * speedBoost + b.phy) * b.amp * 0.8) * H;
        // gentle attraction to pointer when nearby
        const dx = pointer.x * dpr - tx;
        const dy = H - pointer.y * dpr - ty;
        const dist = Math.hypot(dx, dy);
        const pull = Math.max(0, 1 - dist / (560 * dpr)) * 0.30;
        tx += dx * pull;
        ty += dy * pull;
      }
      // spring smoothing
      const k = i === 0 ? 0.16 : 0.045;
      b.vx += (tx - b.x) * k;
      b.vy += (ty - b.y) * k;
      b.vx *= 0.86;
      b.vy *= 0.86;
      b.x += b.vx;
      b.y += b.vy;

      const rBase = b.r * R * (1 + energy * 0.35 * Math.sin(time * 6 + i));
      data[i * 4] = b.x;
      data[i * 4 + 1] = b.y;
      data[i * 4 + 2] = Math.max(20, rBase);
    }
    prog!.setVec4Array('uBlobs', data);
    prog!.setVec2('uRes', W, H);
    prog!.setFloat('uTime', time);
    prog!.setVec2('uPointer', pointer.x * dpr, H - pointer.y * dpr);
    prog!.setFloat('uPointerAct', pointer.act);
    prog!.setVec4Array('uRipples', ripples);
  }

  const frame = (t: number): void => {
    if (!running) return;
    setUniforms(t);
    prog!.gl.drawArrays(prog!.gl.TRIANGLES, 0, 3);
    // decay transient values
    pointer.act *= 0.94;
    energy *= 0.965;
    raf = requestAnimationFrame(frame);
  }

  const play = (): void => {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  const pause = (): void => {
    running = false;
    cancelAnimationFrame(raf);
  }

  // --- pointer interaction ---
  const onMove = (e: PointerEvent) => {
    const rect = hero.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    pointer.act = Math.min(1, pointer.act + Math.hypot(nx - pointer.px, ny - pointer.py) / 260);
    pointer.px = nx;
    pointer.py = ny;
    pointer.x = nx;
    pointer.y = ny;
  };

  const onDown = (e: PointerEvent) => {
    const rect = hero.getBoundingClientRect();
    const i = (rippleIdx++ % 4) * 4;
    ripples[i] = e.clientX - rect.left;
    ripples[i + 1] = rect.height - (e.clientY - rect.top);
    ripples[i + 2] = performance.now() * 0.001;
    ripples[i + 3] = 780 * dpr;
    energy = Math.min(1, energy + 0.5);
  };

  // --- visibility control ---
  const io = new IntersectionObserver(([entry]) => {
    heroOnScreen = entry.isIntersecting;
    syncRun();
  });
  io.observe(hero);

  const onVis = () => {
    visible = !document.hidden;
    syncRun();
  };

  const syncRun = (): void => {
    if (visible && heroOnScreen) play();
    else pause();
  }

  // --- boot ---
  resize();
  pointer.x = innerWidth * 0.5;
  pointer.y = innerHeight * 0.68;
  // pre-settle springs so the first frame is composed
  for (const b of blobs) {
    b.x = b.ax * W;
    b.y = b.ay * H;
  }

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (reduced) renderStatic();
    }, 150);
  };

  const renderStatic = (): void => {
    setUniforms(7300); // a fixed, nicely composed moment
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  if (reduced) {
    // single static frame, no listeners, no loop
    document.fonts.ready.then(() => {
      resize();
      renderStatic();
    });
    hero.classList.add('webgl-on');
  } else {
    addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    hero.classList.add('webgl-on');
    // re-align text texture once fonts are ready
    document.fonts.ready.then(() => {
      resize();
      if (!running) play();
    });
    syncRun();
  }

  // easter egg: typing "glass" energizes the blobs (exposed for keyboard.ts)
  window.addEventListener('bq:energy', () => {
    energy = 1;
    if (!running && !reduced) play();
  });
}
