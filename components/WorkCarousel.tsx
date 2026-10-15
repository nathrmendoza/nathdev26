'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { getBayerMatrix } from '@/lib/ordered-noise';
import { imageSize } from '@/lib/image-sizes';
import { getLenis } from '@/lib/lenis';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import type { WorkMedia } from '@/lib/works-data';

const GLYPHS = '#%&$@*+=~/\\|<>[]{}';

/** Drift distance, as a fraction of box width. */
const SLIDE = 0.18;
/** Drag distance (fraction of width) that takes the transition all the way. */
const SCRUB_FULL = 0.6;
/** Drag distance (fraction of width) that commits on release. */
const COMMIT_DISTANCE = 0.3;
/** Release speed (px/ms) that commits, and the speeds that chain 2 or 3 images. */
const COMMIT_VELOCITY = 0.5;
const SKIP_2_VELOCITY = 1.2;
const SKIP_3_VELOCITY = 2;
/** Full transition length from rest; a drag release runs only the remainder. */
const TRANSITION_MS = 520;
const MIN_RELEASE_MS = 160;
/** Each extra image a flick chains through. */
const CHAIN_MS = 220;
const SPRING_BACK_MS = 280;
/** Gap kept above the carousel on scroll-back, on top of the header's height. */
const SCROLL_GAP = 24;
/** Scroll-back duration range -- scales with distance between these. */
const SCROLL_MIN_MS = 450;
const SCROLL_MAX_MS = 900;

const SCRAMBLE_GLYPH_MS = 45;

/** CSS px per Bayer cell. */
const DITHER_CELL = 3;
const MASK_STEPS = 32;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pad(n: number, width: number) {
  return String(n).padStart(width, '0');
}

function wrap(i: number, count: number) {
  return ((i % count) + count) % count;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

/** Bayer mask tiles, one per opacity step, cached as data URLs. */
let maskTiles: string[] | null = null;
function getMaskTiles() {
  if (maskTiles) return maskTiles;
  const { data, size } = getBayerMatrix(8);
  const tile = size * DITHER_CELL;
  const canvas = document.createElement('canvas');
  canvas.width = tile;
  canvas.height = tile;
  const ctx = canvas.getContext('2d')!;
  maskTiles = [];
  for (let step = 0; step <= MASK_STEPS; step++) {
    const level = step / MASK_STEPS;
    ctx.clearRect(0, 0, tile, tile);
    ctx.fillStyle = '#fff';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (data[y * size + x] < level) ctx.fillRect(x * DITHER_CELL, y * DITHER_CELL, DITHER_CELL, DITHER_CELL);
      }
    }
    maskTiles.push(canvas.toDataURL());
  }
  return maskTiles;
}

/** 0 hides, 1 removes the mask, anything between is a dither step. */
function setDither(el: HTMLElement, alpha: number) {
  const step = Math.round(Math.min(1, Math.max(0, alpha)) * MASK_STEPS);
  if (step >= MASK_STEPS) {
    el.style.visibility = 'visible';
    el.style.maskImage = '';
    el.style.webkitMaskImage = '';
    return;
  }
  if (step <= 0) {
    el.style.visibility = 'hidden';
    return;
  }
  const url = `url(${getMaskTiles()[step]})`;
  const tileSize = `${8 * DITHER_CELL}px ${8 * DITHER_CELL}px`;
  el.style.visibility = 'visible';
  el.style.maskImage = url;
  el.style.webkitMaskImage = url;
  el.style.maskSize = tileSize;
  el.style.webkitMaskSize = tileSize;
  el.style.maskRepeat = 'repeat';
  el.style.webkitMaskRepeat = 'repeat';
}

interface Transition {
  from: number;
  to: number;
  dir: 1 | -1;
  /** 0 = all `from`, 1 = all `to`. Already eased. */
  p: number;
  /** The outgoing image was pinned too (a chained hop). */
  outPinned: boolean;
}

export default function WorkCarousel({ media }: { media: WorkMedia[] }) {
  const count = media.length;
  const digits = Math.max(2, String(count).length);
  const multiple = count > 1;

  const [index, setIndex] = useState(0);
  const [counter, setCounter] = useState(() => pad(1, digits));

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const indexRef = useRef(0);
  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const transition = useRef<Transition | null>(null);
  const drag = useRef<{
    x0: number;
    y0: number;
    active: boolean;
    samples: { x: number; t: number }[];
  } | null>(null);

  useEffect(() => {
    aliveRef.current = true;
    getMaskTiles();
    return () => {
      aliveRef.current = false;
      document.documentElement.style.overflowAnchor = '';
    };
  }, []);

  const pinOffset = () =>
    (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 96) + SCROLL_GAP;

  /** Rendered height of image `i` at the box's current width. */
  const heightOf = (i: number, width: number) => {
    const el = imgRefs.current[i];
    if (!el) return 0;
    if (el.naturalWidth) return (el.naturalHeight / el.naturalWidth) * width;
    return el.offsetHeight || width * 0.625;
  };

  /** Writes the current transition state to the DOM, every frame while moving. */
  const apply = () => {
    const t = transition.current;
    const stage = stageRef.current;
    if (!t || !stage) return;
    const outEl = imgRefs.current[t.from];
    const inEl = imgRefs.current[t.to];
    if (!outEl || !inEl) return;

    const width = stage.clientWidth || 1;
    const pinY = Math.max(0, pinOffset() - stage.getBoundingClientRect().top);
    const outY = t.outPinned ? pinY : 0;
    const shift = SLIDE * width;

    // Whole pixels only -- fractional offsets make the dither mask shimmer.
    outEl.style.transform = `translate3d(${Math.round(-t.dir * shift * t.p)}px, ${Math.round(outY)}px, 0)`;
    inEl.style.transform = `translate3d(${Math.round(t.dir * shift * (1 - t.p))}px, ${Math.round(pinY)}px, 0)`;
    setDither(outEl, 1 - t.p);
    setDither(inEl, t.p);

    const outBottom = outY + heightOf(t.from, width);
    const inBottom = pinY + heightOf(t.to, width);
    stage.style.height = `${outBottom + (inBottom - outBottom) * t.p}px`;
  };

  /** Stacks both images out of flow in a box locked to the outgoing height. */
  const begin = (from: number, dir: 1 | -1, outPinned = false) => {
    const stage = stageRef.current;
    const to = wrap(from + dir, count);
    if (stage && !outPinned) stage.style.height = `${heightOf(from, stage.clientWidth)}px`;
    for (const i of [from, to]) {
      const el = imgRefs.current[i];
      if (!el) continue;
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
    }
    transition.current = { from, to, dir, p: 0, outPinned };
    apply();
  };

  /** Back to rest: `keep` in normal flow, the rest hidden. */
  const settle = (keep: number) => {
    const stage = stageRef.current;
    imgRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transform = '';
      setDither(el, i === keep ? 1 : 0);
      el.style.position = i === keep ? 'relative' : 'absolute';
    });
    if (stage) stage.style.height = '';
    transition.current = null;
  };

  /** Re-targets a drag that crosses back over its start. */
  const redirect = (dir: 1 | -1) => {
    const t = transition.current;
    if (!t || t.dir === dir) return;
    const old = imgRefs.current[t.to];
    if (old && t.to !== t.from) {
      old.style.transform = '';
      setDither(old, 0);
    }
    begin(t.from, dir);
  };

  const animateTo = (target: number, ms: number) =>
    new Promise<void>((resolve) => {
      const t = transition.current;
      if (!t) return resolve();
      const start = t.p;
      if (reducedMotion() || ms <= 0) {
        t.p = target;
        apply();
        return resolve();
      }
      const t0 = performance.now();
      const frame = (now: number) => {
        if (!aliveRef.current || transition.current !== t) return resolve();
        const k = Math.min(1, (now - t0) / ms);
        t.p = start + (target - start) * easeOutCubic(k);
        apply();
        if (k < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

  /** Scrolls the carousel back into view via Lenis, re-pinning from Lenis's own
   *  scroll event so the incoming image holds still. */
  const scrollBack = async () => {
    const root = rootRef.current;
    if (!root) return;
    const offset = pinOffset();
    const top = root.getBoundingClientRect().top;
    if (top >= offset) return;

    const from = window.scrollY;
    const target = Math.max(0, from + top - offset);
    const lenis = getLenis();
    if (reducedMotion() || !lenis) {
      window.scrollTo(0, target);
      apply();
      return;
    }
    const ms = Math.min(SCROLL_MAX_MS, Math.max(SCROLL_MIN_MS, (from - target) * 0.4));
    await new Promise<void>((resolve) => {
      const off = lenis.on('scroll', apply);
      lenis.scrollTo(target, {
        duration: ms / 1000,
        easing: easeInOutCubic,
        lock: true,
        force: true,
        onComplete: () => {
          off();
          resolve();
        },
      });
    });
    apply();
  };

  const scrambleTo = async (n: number) => {
    if (!reducedMotion()) {
      setCounter(Array.from({ length: digits }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join(''));
      await wait(SCRAMBLE_GLYPH_MS);
    }
    setCounter(pad(n + 1, digits));
  };

  /** Runs the transition to completion; `speed` is the drag release velocity. */
  const commit = async (dir: 1 | -1, steps = 1, speed = 0) => {
    if (count < 2) return;
    busyRef.current = true;
    const hops = Math.min(steps, count - 1);
    if (!transition.current) begin(indexRef.current, dir);
    // Stops scroll anchoring fighting scrollBack while the box height changes.
    document.documentElement.style.overflowAnchor = 'none';

    const scrolling = scrollBack();
    for (let hop = 1; hop <= hops; hop++) {
      const t = transition.current;
      if (!t) break;
      void scrambleTo(t.to);
      const ms =
        hop < hops
          ? CHAIN_MS
          : hops > 1
            ? TRANSITION_MS * 0.7
            : Math.max(MIN_RELEASE_MS, (TRANSITION_MS * (1 - t.p)) / Math.max(1, speed * 1.5));
      await animateTo(1, ms);
      if (!aliveRef.current) return;
      indexRef.current = t.to;
      setIndex(t.to);
      // Chain straight into the next hop from wherever this one landed,
      // keeping the pin -- settling to rest mid-scroll would jump.
      if (hop < hops) {
        const prev = imgRefs.current[t.from];
        if (prev) setDither(prev, 0);
        begin(t.to, dir, true);
      }
    }
    await scrolling;
    document.documentElement.style.overflowAnchor = '';
    if (!aliveRef.current) return;
    settle(indexRef.current);
    busyRef.current = false;
  };

  const go = (dir: 1 | -1) => {
    if (busyRef.current || drag.current) return;
    void commit(dir);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (busyRef.current || !multiple || e.button !== 0) return;
    drag.current = { x0: e.clientX, y0: e.clientY, active: false, samples: [] };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (!d || !stage) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;

    // Only claim the gesture once it's clearly horizontal -- vertical
    // movement is left to page scroll (touch-action: pan-y does the rest).
    if (!d.active) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        d.active = true;
        stage.setPointerCapture(e.pointerId);
        begin(indexRef.current, dx < 0 ? 1 : -1);
      } else if (Math.abs(dy) > 8) {
        drag.current = null;
      }
      return;
    }

    const now = performance.now();
    d.samples.push({ x: e.clientX, t: now });
    while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift();

    if (dx !== 0) redirect(dx < 0 ? 1 : -1);
    const t = transition.current;
    if (!t) return;
    t.p = Math.min(1, Math.abs(dx) / ((stage.clientWidth || 1) * SCRUB_FULL));
    apply();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    drag.current = null;
    const stage = stageRef.current;
    const t = transition.current;
    if (!d || !d.active || !stage || !t) return;
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);

    const dx = e.clientX - d.x0;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const velocity = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
    const speed = Math.abs(velocity);
    // A flick back against the drag doesn't count toward committing.
    const towardDir = Math.sign(velocity) === Math.sign(dx);
    const width = stage.clientWidth || 1;

    const commits =
      !cancelled && dx !== 0 && (Math.abs(dx) > width * COMMIT_DISTANCE || (towardDir && speed > COMMIT_VELOCITY));
    if (!commits) {
      busyRef.current = true;
      void animateTo(0, SPRING_BACK_MS).then(() => {
        if (!aliveRef.current) return;
        settle(t.from);
        busyRef.current = false;
      });
      return;
    }
    const steps = towardDir && speed > SKIP_3_VELOCITY ? 3 : towardDir && speed > SKIP_2_VELOCITY ? 2 : 1;
    void commit(t.dir, steps, towardDir ? speed : 0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  const current = media[index];

  return (
    <div
      ref={rootRef}
      data-dither-mask
      role="region"
      aria-roledescription="carousel"
      aria-label="Project screenshots"
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={multiple ? onKeyDown : undefined}
      className="relative rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
        className={`relative overflow-clip rounded-sm select-none ${
          multiple ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''
        }`}
      >
        {/* Every image rendered once; transitions only restyle them. */}
        {media.map((m, i) => {
          // Manifest sizes reserve each image's space before it loads.
          const size = imageSize(m.src);
          return (
            // eslint-disable-next-line @next/next/no-img-element -- screenshots vary in height; a plain img keeps natural aspect, and the files are pre-optimised (scripts/optimize-images.mjs)
            <img
              key={m.src}
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              src={m.src}
              width={size?.width}
              height={size?.height}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              alt={i === index ? m.alt : ''}
              aria-hidden={i === index ? undefined : true}
              draggable={false}
              className={`block h-auto w-full ${
                i === 0 ? 'relative' : 'invisible absolute top-0 left-0'
              }`}
            />
          );
        })}
      </div>

      {multiple && (
        // Sticky to the viewport bottom, resting on the image's bottom edge.
        <div className="pointer-events-none sticky bottom-6 z-10 -mt-16 flex h-16 items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-line-lit bg-black/10 px-1.5 py-1.5 backdrop-blur-xl">
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-ink transition-colors hover:text-accent"
            >
              <span className="block h-4 w-4">
                <ChevronLeftIcon />
              </span>
            </button>
            <span className="px-2 font-mono text-[12px] tracking-[0.12em] text-ink-dim tabular-nums">
              <span className="text-ink">{counter}</span> / {pad(count, digits)}
            </span>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-ink transition-colors hover:text-accent"
            >
              <span className="block h-4 w-4">
                <ChevronRightIcon />
              </span>
            </button>
          </div>
        </div>
      )}

      {current.caption && (
        <p className="mt-3 font-mono text-[11px] tracking-[0.12em] text-ink-faint uppercase">{current.caption}</p>
      )}

      <p className="sr-only" aria-live="polite">
        {`Image ${index + 1} of ${count}: ${current.alt}`}
      </p>
    </div>
  );
}
