/**
 * dither-surface.ts
 *
 * One ordered-dithering Canvas 2D surface per component (button fills,
 * panel dissolves, focus states), all sharing a single requestAnimationFrame
 * loop. Canvas 2D, not WebGL: browsers cap live WebGL contexts around 8-16,
 * so one per button would hit the ceiling and start killing the oldest.
 * DitherBackground.tsx is WebGL instead, for the full viewport.
 */

import { getBayerMatrix, fbm2, NOISE_SCALE, type MatrixSize } from './ordered-noise';

export type DitherMode = 'radial' | 'linear' | 'dissolve';
export type { MatrixSize } from './ordered-noise';
export type RGB = [number, number, number];

export interface DitherOptions {
  /** How the reveal is ordered.
   *  radial   - grows outward from `origin` (set it to the cursor on enter)
   *  linear   - wipes left to right
   *  dissolve - threshold field is the noise itself, so pixels drop in
   *             scattered clumps. This is the one for covering a panel. */
  mode?: DitherMode;
  /** Fill colour as [r, g, b], 0-255. */
  rgb?: RGB;
  /** Alpha level at full reveal. 1 lands on a completely solid fill;
   *  anything lower holds a permanent half-tone (good for secondary buttons). */
  fill?: number;
  /** Easing rate toward the target. Higher is snappier. */
  speed?: number;
  /** Keep animating the noise while revealed. Only visible when fill < 1. */
  drift?: boolean;
  driftRate?: number;

  /** CSS pixels per buffer pixel. The performance dial, and the grain size. */
  pixel?: number;
  /** Output steps. 2 is a pure 1-bit dissolve. */
  levels?: number;
  /** Bayer matrix size. 8 is the PS1-like one. */
  matrix?: MatrixSize;
  /** How hard noise perturbs the reveal edge. 0 gives you a plain CSS-style wipe. */
  turbulence?: number;
  /** Width of the soft edge band, as a fraction of the reveal. */
  feather?: number;
  /** Modulates a flat fill by the noise. Without this, a low uniform fill
   *  through a Bayer matrix renders as a regular dot grid -- a printed
   *  halftone, which reads badly behind text. */
  texture?: number;

  /** paint - the dither is drawn as coloured pixels on a canvas over the host.
   *  mask  - the dither becomes the host's CSS mask instead, so covered pixels
   *          go transparent rather than coloured -- whatever sits behind the
   *          host (the live background) shows through. `rgb` is ignored. */
  output?: 'paint' | 'mask';
  /** Mask mode only. What the dither buffer covers.
   *  host     - the whole host element.
   *  viewport - just the visible part of it; the rest is hidden for the
   *             duration. Keeps the per-frame cost flat on a host many
   *             screens tall (a whole page), since only the viewport's
   *             worth of pixels is ever computed and encoded. */
  frame?: 'host' | 'viewport';

  className?: string;
}

const DEFAULTS = {
  mode: 'radial' as DitherMode,
  rgb: [217, 220, 214] as RGB,
  fill: 1,
  speed: 9,
  drift: false,
  driftRate: 0.35,
  pixel: 3,
  levels: 2,
  matrix: 8 as MatrixSize,
  turbulence: 0.55,
  feather: 0.3,
  texture: 0,
  output: 'paint' as 'paint' | 'mask',
  frame: 'host' as 'host' | 'viewport',
};

// Mask mode at full coverage -- nothing shows, no need to encode a frame.
const MASK_HIDDEN = 'linear-gradient(transparent, transparent)';

/* ------------------------------------------------------------------ *
 * Shared scheduler -- idle surfaces cost nothing
 * ------------------------------------------------------------------ */

const SURFACES: DitherSurface[] = [];
let raf = 0;
let last = 0;

function schedule() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

function tick(now: number) {
  raf = 0;
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  let live = false;
  for (const s of SURFACES) {
    if (s.active) {
      s.step(dt);
      if (s.active) live = true;
    }
  }
  if (live) raf = requestAnimationFrame(tick);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

export class DitherSurface {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ro: ResizeObserver;
  private onWindowResize = () => this.resize();
  private img: ImageData | null = null;
  private w = 0;
  private h = 0;
  private t = 0;

  private opts: Required<Omit<DitherOptions, 'className'>>;
  private get viewportFramed() {
    return this.opts.output === 'mask' && this.opts.frame === 'viewport';
  }

  progress = 0;
  target = 0;
  origin = { x: 0.5, y: 0.5 };
  active = false;

  constructor(host: HTMLElement, options: DitherOptions = {}) {
    this.host = host;
    this.opts = { ...DEFAULTS, ...options } as Required<Omit<DitherOptions, 'className'>>;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    if (options.className) this.canvas.className = options.className;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('DitherSurface: 2D context unavailable');
    this.ctx = ctx;
    // Mask mode never shows the canvas itself, only reads frames off it.
    if (this.opts.output === 'paint') host.appendChild(this.canvas);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    if (this.viewportFramed) window.addEventListener('resize', this.onWindowResize);
    SURFACES.push(this);
  }

  /** Change any option at runtime. Wakes the loop so it repaints. */
  set(patch: Partial<DitherOptions>) {
    Object.assign(this.opts, patch);
    if (patch.pixel !== undefined) {
      this.w = 0;
      this.h = 0;
      this.resize();
    }
    this.wake();
  }

  /** Animate toward a reveal amount, 0 (clear) to 1 (fully covered).
   *  `origin` is in 0-1 element space and only matters in radial mode. */
  to(target: number, origin?: { x: number; y: number }) {
    this.target = target;
    if (origin) this.origin = origin;
    if (prefersReduced()) this.progress = target;
    this.wake();
  }

  resize() {
    const r = this.viewportFramed
      ? { width: window.innerWidth, height: window.innerHeight }
      : this.host.getBoundingClientRect();
    const px = Math.max(1, this.opts.pixel);
    const w = Math.max(1, Math.round(r.width / px));
    const h = Math.max(1, Math.round(r.height / px));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    // Allocated once per size. Creating an ImageData every frame is the one
    // thing that will actually make this slow.
    this.img = this.ctx.createImageData(w, h);
    this.wake();
  }

  wake() {
    if (!this.active) {
      this.active = true;
      schedule();
    }
  }

  step(dt: number) {
    const reduced = prefersReduced();
    if (reduced) {
      this.progress = this.target;
    } else {
      const k = 1 - Math.exp(-this.opts.speed * dt);
      this.progress += (this.target - this.progress) * k;
      if (Math.abs(this.target - this.progress) < 0.002) this.progress = this.target;
      if (this.opts.drift) this.t += dt * this.opts.driftRate;
    }
    this.render();
    const settled = this.progress === this.target;
    const needsDrift = this.opts.drift && this.progress > 0.01 && !reduced;
    if (settled && !needsDrift) this.active = false;
  }

  render() {
    const { w, h } = this;
    const p = this.progress;
    if (!this.img) return;

    const { rgb, fill, output } = this.opts;
    const asMask = output === 'mask';

    if (p <= 0.004) {
      if (asMask) this.setMask(null);
      else this.ctx.clearRect(0, 0, w, h);
      return;
    }

    // Fully revealed and fully opaque: paint solid. Guarantees no stray unlit
    // pixels survive the dither at rest, and skips the per-pixel loop entirely.
    if (p >= 1 && fill >= 1) {
      if (asMask) {
        this.setMask(MASK_HIDDEN);
        return;
      }
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      this.ctx.fillRect(0, 0, w, h);
      return;
    }

    const data = this.img.data;
    const M = getBayerMatrix(this.opts.matrix);
    const { data: mData, size: mSize, mask: mMask } = M;
    const steps = this.opts.levels - 1;
    const { feather, turbulence: turb, texture: tex, mode } = this.opts;
    const [r, g, b] = rgb;
    const t = this.t;

    // Remap so 0 is fully clear and 1 fully covered. The turbulence term is
    // included because noise pushes `field` above 1 at the far corners --
    // without it the reveal stalls just short and leaves pixels stuck unlit.
    const pp = p * (1 + 2 * feather + turb) - feather;

    const { x: ox, y: oy } = this.origin;
    const asp = w / h;
    let maxD = 1;
    if (mode === 'radial') {
      const mx = Math.max(ox, 1 - ox) * asp;
      const my = Math.max(oy, 1 - oy);
      maxD = Math.sqrt(mx * mx + my * my) || 1;
    }

    let i = 0;
    for (let y = 0; y < h; y++) {
      const fy = (y + 0.5) / h;
      const mRow = (y & mMask) * mSize;
      for (let x = 0; x < w; x++) {
        const fx = (x + 0.5) / w;

        // Threshold field: 0 reveals first, 1 reveals last.
        let field: number;
        if (mode === 'radial') {
          const dx = (fx - ox) * asp;
          const dy = fy - oy;
          field = Math.sqrt(dx * dx + dy * dy) / maxD;
        } else if (mode === 'linear') {
          field = fx;
        } else {
          field = fbm2(x * NOISE_SCALE * 1.7, y * NOISE_SCALE * 1.7);
        }

        // Noise perturbs the edge so it never reads as a CSS wipe, and
        // modulates the fill so a flat area is clumps, not a halftone grid.
        let n = 0;
        if (turb > 0 || tex > 0) {
          n = fbm2(x * NOISE_SCALE + t, y * NOISE_SCALE - t * 0.6);
          field += (n - 0.5) * turb;
        }

        let v = (pp - field) / feather;
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        v *= fill;
        if (tex > 0) v *= 1 + (n - 0.5) * 2 * tex;

        const th = mData[mRow + (x & mMask)];
        let q = Math.floor(v * steps + th);
        if (q < 0) q = 0;
        else if (q > steps) q = steps;

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // A mask shows where alpha is high, so covered pixels flip to 0.
        const a = (q / steps) * 255;
        data[i + 3] = asMask ? 255 - a : a;
        i += 4;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
    if (asMask) this.setMask(`url(${this.canvas.toDataURL()})`);
  }

  /** Mask mode: apply a mask image to the host, or `null` to drop it so the
   *  host renders untouched (and crisp) at rest. The buffer is small, so
   *  encoding it each frame is cheap; `pixelated` keeps the grain hard-edged
   *  as it's stretched to the host's size. */
  private setMask(image: string | null) {
    const style = this.host.style;
    if (image === null) {
      for (const prop of ['mask-image', 'mask-size', 'mask-position', 'mask-repeat', 'image-rendering']) {
        style.removeProperty(prop);
        style.removeProperty(`-webkit-${prop}`);
      }
      return;
    }
    // Viewport frame: pin the mask to the visible window, re-read every frame
    // so it tracks scrolling. Outside it, no-repeat leaves nothing -- hidden.
    let size = '100% 100%';
    let position = '0 0';
    if (this.viewportFramed) {
      const r = this.host.getBoundingClientRect();
      size = `${window.innerWidth}px ${window.innerHeight}px`;
      position = `${-r.left}px ${-r.top}px`;
    }
    for (const prefix of ['', '-webkit-']) {
      style.setProperty(`${prefix}mask-image`, image);
      style.setProperty(`${prefix}mask-size`, size);
      style.setProperty(`${prefix}mask-position`, position);
      style.setProperty(`${prefix}mask-repeat`, 'no-repeat');
    }
    style.setProperty('image-rendering', 'pixelated');
  }

  /** Always call this in a React effect cleanup. */
  destroy() {
    this.ro.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
    const i = SURFACES.indexOf(this);
    if (i > -1) SURFACES.splice(i, 1);
    if (this.opts.output === 'mask') this.setMask(null);
    this.canvas.remove();
  }
}

/** Cursor position inside an element, normalised to 0-1. */
export function localOrigin(el: HTMLElement, e: { clientX: number; clientY: number }) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
  };
}
