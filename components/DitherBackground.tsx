'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { setLenis } from '@/lib/lenis';

export interface DitherBackgroundConfig {
  /** CSS px per buffer pixel -- the main performance dial. */
  pixelSize: number;
  matrix: 2 | 4 | 8;
  levels: number;
  dither: number;
  /** Lower = bigger ribbons. */
  scale: number;
  /** 0 is plain FBM. Higher values produce the liquid ribbons. */
  warp: number;
  /** Cost is roughly octaves x 5 noise samples per pixel. */
  octaves: number;
  speed: number;
  /** Ambient band; the headroom above it is for the cursor glow. */
  ambientLow: number;
  ambientHigh: number;
  cursorRadius: number;
  cursorLift: number;
  cursorEase: number;
  /** Cursor glow fade speed across data-dither-mask edges. */
  cursorFadeSpeed: number;
  pulseDuration: number;
  pulseWidth: number;
  pulseLift: number;
  /** Darkest quantised step. */
  ground: string;
  /** Brightest the cursor can reach. */
  peak: string;
}

export const DEFAULT_CONFIG: DitherBackgroundConfig = {
  pixelSize: 3,
  matrix: 4,
  levels: 4,
  dither: 0.7,
  scale: 1.4,
  warp: 3.2,
  octaves: 6,
  speed: 0.2,
  ambientLow: 0.06,
  ambientHigh: 1,
  cursorRadius: 0.07,
  cursorLift: 0.39,
  cursorEase: 0.35,
  cursorFadeSpeed: 6,
  pulseDuration: 2,
  pulseWidth: 0.6,
  pulseLift: 0.13,
  ground: '#000000',
  peak: '#505855',
};

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;       // buffer size in device pixels
uniform float uTime;      // pre-scaled by speed on the CPU
uniform vec2  uMouse;     // 0..1, already eased
uniform float uScale;
uniform float uWarp;
uniform int   uOct;
uniform float uLo;        // ambient floor
uniform float uHi;        // ambient ceiling
uniform float uLevels;    // quantisation steps
uniform int   uMatrix;    // 2 | 4 | 8
uniform float uDither;    // dither strength
uniform float uCurR;
uniform float uCurS;
uniform float uPulse;     // 0..1 progress, <0 when idle
uniform float uPulseW;
uniform float uPulseS;
uniform vec3  uBg;
uniform vec3  uFg;

/* ---- gradient noise (Inigo Quilez) ---- */
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                 dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
             mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                 dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p, int oct) {
  float a = 0.5;
  float s = 0.0;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    s += a * gnoise(p);
    p = m * p;
    a *= 0.5;
  }
  return s;
}

/* ---- domain warping: fbm of fbm of fbm ---- */
float pattern(vec2 p, float t, int oct, float warp) {
  vec2 q = vec2(fbm(p + vec2(0.00, 0.00), oct),
                fbm(p + vec2(5.20, 1.30), oct));
  vec2 r = vec2(fbm(p + warp * q + vec2(1.70, 9.20) + 0.150 * t, oct),
                fbm(p + warp * q + vec2(8.30, 2.80) + 0.126 * t, oct));
  return fbm(p + warp * r, oct);
}

/* ---- ordered dithering: recursive Bayer ---- */
float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float threshold(vec2 c, int m) {
  if (m == 2) return bayer2(c);
  if (m == 4) return bayer4(c);
  return bayer8(c);
}

void main() {
  vec2 uv  = gl_FragCoord.xy / uRes;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 ap  = uv * asp;

  // 1. continuous pattern, roughly -0.7..0.7
  float v = pattern(ap * uScale, uTime, uOct, uWarp);
  v = clamp(v * 0.9 + 0.5, 0.0, 1.0);

  // 2. squeeze into the ambient band, leaving headroom above
  float lum = mix(uLo, uHi, v);

  // 3. cursor proximity lift
  float d = distance(ap, uMouse * asp);
  lum += uCurS * smoothstep(uCurR, 0.0, d);

  // 4. navigation pulse: a ring expanding from centre
  if (uPulse >= 0.0) {
    float e = uPulse;
    float ease = 1.0 - pow(1.0 - e, 3.0);          // easeOutCubic
    float rad = ease * (0.5 * asp.x + 0.6);
    float ring = smoothstep(uPulseW, 0.0, abs(distance(ap, 0.5 * asp) - rad));
    lum += ring * (1.0 - e) * uPulseS;
  }

  lum = clamp(lum, 0.0, 1.0);

  // 5. ordered dither, then quantise
  float n = max(uLevels - 1.0, 1.0);
  float t = (threshold(gl_FragCoord.xy, uMatrix) - 0.5) * uDither / n;
  float q = clamp(floor((lum + t) * n + 0.5) / n, 0.0, 1.0);

  fragColor = vec4(mix(uBg, uFg, q), 1.0);
}`;

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function DitherBackground({
  config,
  pulseSignal,
}: {
  config?: Partial<DitherBackgroundConfig>;
  /** Bump to fire the pulse manually. */
  pulseSignal?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef(-1);
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const cfgRef = useRef(mergedConfig);

  // Keeps the render loop on the latest config without restarting it.
  useEffect(() => {
    cfgRef.current = mergedConfig;
  });

  const pathname = usePathname();

  useEffect(() => {
    pulseRef.current = performance.now();
  }, [pathname]);

  useEffect(() => {
    if (pulseSignal === undefined) return;
    pulseRef.current = performance.now();
  }, [pulseSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // autoRaf off: driven from this component's own loop below instead.
    const lenis = new Lenis({ autoRaf: false });
    setLenis(lenis);

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });

    const compile = (context: WebGL2RenderingContext, type: number, src: string) => {
      const sh = context.createShader(type)!;
      context.shaderSource(sh, src);
      context.compileShader(sh);
      if (!context.getShaderParameter(sh, context.COMPILE_STATUS)) {
        console.error(context.getShaderInfoLog(sh));
      }
      return sh;
    };

    let program: WebGLProgram | null = null;
    let U: Record<string, WebGLUniformLocation | null> = {};

    if (gl) {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        program = null;
      } else {
        gl.useProgram(program);
        gl.bindVertexArray(gl.createVertexArray());
        const u = (n: string) => gl.getUniformLocation(program!, n);
        U = {
          res: u('uRes'), time: u('uTime'), mouse: u('uMouse'),
          scale: u('uScale'), warp: u('uWarp'), oct: u('uOct'),
          lo: u('uLo'), hi: u('uHi'), levels: u('uLevels'),
          matrix: u('uMatrix'), dither: u('uDither'),
          curR: u('uCurR'), curS: u('uCurS'),
          pulse: u('uPulse'), pulseW: u('uPulseW'), pulseS: u('uPulseS'),
          bg: u('uBg'), fg: u('uFg'),
        };
      }
    }

    let bufW = 1;
    let bufH = 1;
    const resize = () => {
      const px = cfgRef.current.pixelSize;
      bufW = Math.max(1, Math.round(window.innerWidth / px));
      bufH = Math.max(1, Math.round(window.innerHeight / px));
      canvas.width = bufW;
      canvas.height = bufH;
      if (gl) gl.viewport(0, 0, bufW, bufH);
    };
    resize();
    window.addEventListener('resize', resize);

    // Never setState per pointermove -- that's how this drops frames.
    const m = { tx: 0.5, ty: 0.5, x: 0.5, y: 0.5 };
    let rawX = 0;
    let rawY = 0;
    const onMove = (e: PointerEvent) => {
      m.tx = e.clientX / window.innerWidth;
      m.ty = 1 - e.clientY / window.innerHeight; // GL origin is bottom-left
      rawX = e.clientX;
      rawY = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // Hit-tested once per frame, not per pointer event.
    let cursorActive = 1;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let t = 0;
    let last = performance.now();
    let alive = true;

    const frame = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);

      lenis.raf(now);

      const CFG = cfgRef.current;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced.matches) t += dt * CFG.speed;

      const k = reduced.matches ? 1 : CFG.cursorEase;
      m.x += (m.tx - m.x) * k;
      m.y += (m.ty - m.y) * k;

      const hit = document.elementFromPoint(rawX, rawY);
      const overMasked = !!(hit && hit !== canvas && hit.closest('[data-dither-mask]'));
      const activeTarget = overMasked ? 0 : 1;
      const activeK = reduced.matches ? 1 : 1 - Math.exp(-CFG.cursorFadeSpeed * dt);
      cursorActive += (activeTarget - cursorActive) * activeK;

      let pulse = -1;
      if (pulseRef.current >= 0) {
        pulse = (now - pulseRef.current) / (CFG.pulseDuration * 1000);
        if (pulse >= 1) {
          pulse = -1;
          pulseRef.current = -1;
        }
      }

      if (!gl || !program) return;

      const [bgR, bgG, bgB] = hexToRgb(CFG.ground);
      const [fgR, fgG, fgB] = hexToRgb(CFG.peak);

      gl.uniform2f(U.res, bufW, bufH);
      gl.uniform1f(U.time, t);
      gl.uniform2f(U.mouse, m.x, m.y);
      gl.uniform1f(U.scale, CFG.scale);
      gl.uniform1f(U.warp, CFG.warp);
      gl.uniform1i(U.oct, CFG.octaves);
      gl.uniform1f(U.lo, CFG.ambientLow);
      gl.uniform1f(U.hi, CFG.ambientHigh);
      gl.uniform1f(U.levels, CFG.levels);
      gl.uniform1i(U.matrix, CFG.matrix);
      gl.uniform1f(U.dither, CFG.dither);
      gl.uniform1f(U.curR, CFG.cursorRadius * cursorActive);
      gl.uniform1f(U.curS, CFG.cursorLift * cursorActive);
      gl.uniform1f(U.pulse, pulse);
      gl.uniform1f(U.pulseW, CFG.pulseWidth);
      gl.uniform1f(U.pulseS, CFG.pulseLift);
      gl.uniform3f(U.bg, bgR, bgG, bgB);
      gl.uniform3f(U.fg, fgR, fgG, fgB);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    // Stop burning GPU in a hidden tab.
    const onVis = () => {
      if (document.hidden) {
        alive = false;
        cancelAnimationFrame(raf);
      } else if (!alive) {
        alive = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
        imageRendering: 'pixelated',
        background: mergedConfig.ground,
      }}
    />
  );
}
