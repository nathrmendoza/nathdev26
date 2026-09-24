'use client';

/**
 * DitherImage.tsx
 *
 * Project thumbnail: full colour at rest. On hover, dissolves through the
 * same ordered-noise threshold as the rest of the kit into a desaturated,
 * downsampled/pixelated version, with a label fading in over it.
 *
 * Own small rAF loop, separate from DitherSurface's shared scheduler --
 * only runs while a hover transition is actually in flight.
 */

import { useEffect, useRef, useState } from 'react';
import { getBayerMatrix, fbm2, NOISE_SCALE } from '@/lib/ordered-noise';

export interface DitherImageProps {
  src: string;
  alt: string;
  label?: string;
  /** CSS pixels per buffer pixel -- the same performance/chunkiness dial
   *  as every other surface in the kit. */
  pixelSize?: number;
  /** Seconds for the transition to fully resolve. */
  duration?: number;
  className?: string;
}

function coverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  let sw = srcW;
  let sh = srcH;
  if (srcAspect > dstAspect) {
    sw = srcH * dstAspect;
  } else {
    sh = srcW / dstAspect;
  }
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}

export default function DitherImage({
  src,
  alt,
  label,
  pixelSize = 4,
  duration = 0.6,
  className = '',
}: DitherImageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);

  const bufs = useRef<{
    w: number;
    h: number;
    color: Uint8ClampedArray;
    mono: Uint8ClampedArray;
    out: ImageData;
  } | null>(null);
  const state = useRef({ progress: 0, target: 0, running: false });

  const draw = () => {
    const canvas = canvasRef.current;
    const b = bufs.current;
    if (!canvas || !b) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const feather = 0.35;
    const p = state.current.progress;
    const pp = p * (1 + 2 * feather) - feather;
    const M = getBayerMatrix(8);
    const { data: mData, size: mSize, mask: mMask } = M;

    const out = b.out.data;
    let i = 0;
    for (let y = 0; y < b.h; y++) {
      const mRow = (y & mMask) * mSize;
      for (let x = 0; x < b.w; x++) {
        const field = fbm2(x * NOISE_SCALE * 1.7, y * NOISE_SCALE * 1.7);
        const v = Math.min(1, Math.max(0, (pp - field) / feather));
        const th = mData[mRow + (x & mMask)];
        const useMono = v > th;
        const src_ = useMono ? b.mono : b.color;
        out[i] = src_[i];
        out[i + 1] = src_[i + 1];
        out[i + 2] = src_[i + 2];
        out[i + 3] = 255;
        i += 4;
      }
    }
    ctx.putImageData(b.out, 0, 0);
  };

  // Loads the image, then draws a colour and a desaturated pass into offscreen buffers.
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    let cancelled = false;

    const img = new Image();
    img.decoding = 'async';
    img.src = src;

    const build = () => {
      if (cancelled) return;
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width / pixelSize));
      const h = Math.max(1, Math.round(rect.height / pixelSize));

      const rect_ = coverRect(img.naturalWidth, img.naturalHeight, w, h);

      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = w;
      colorCanvas.height = h;
      const colorCtx = colorCanvas.getContext('2d')!;
      colorCtx.drawImage(img, rect_.sx, rect_.sy, rect_.sw, rect_.sh, 0, 0, w, h);

      const monoCanvas = document.createElement('canvas');
      monoCanvas.width = w;
      monoCanvas.height = h;
      const monoCtx = monoCanvas.getContext('2d')!;
      monoCtx.filter = 'grayscale(1) contrast(1.05) brightness(0.9)';
      monoCtx.drawImage(img, rect_.sx, rect_.sy, rect_.sw, rect_.sh, 0, 0, w, h);

      canvas.width = w;
      canvas.height = h;

      bufs.current = {
        w,
        h,
        color: colorCtx.getImageData(0, 0, w, h).data,
        mono: monoCtx.getImageData(0, 0, w, h).data,
        out: colorCtx.createImageData(w, h),
      };
      draw();
    };

    if (img.complete) build();
    else img.onload = build;

    const ro = new ResizeObserver(build);
    ro.observe(host);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [src, pixelSize]);

  const run = (to: number) => {
    const st = state.current;
    st.target = to;
    if (st.running) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      st.progress = to;
      draw();
      return;
    }

    st.running = true;
    let last = performance.now();
    // Exponential ease toward the current target -- retriggering mid-transition
    // (fast hover in/out) eases from wherever it is now, not from a snapshot.
    const speed = 4 / duration;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      st.progress += (st.target - st.progress) * (1 - Math.exp(-speed * dt));
      if (Math.abs(st.target - st.progress) < 0.004) st.progress = st.target;
      draw();
      if (st.progress !== st.target) requestAnimationFrame(frame);
      else st.running = false;
    };
    requestAnimationFrame(frame);
  };

  return (
    <div
      ref={hostRef}
      data-dither-mask
      className={`group relative isolate overflow-hidden ${className}`.trim()}
      onPointerEnter={() => {
        setHovered(true);
        run(1);
      }}
      onPointerLeave={() => {
        setHovered(false);
        run(0);
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className="block h-full w-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {label && (
        <div
          className={`pointer-events-none absolute inset-0 flex items-end p-4 font-display text-h4 font-bold text-ink uppercase transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {label}
        </div>
      )}
    </div>
  );
}
