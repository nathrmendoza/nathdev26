'use client';

import { useEffect, useRef, useState } from 'react';
import { imageSize } from '@/lib/image-sizes';

export interface StackedFigureItem {
  /** Omit for a placeholder card. */
  src?: string;
  alt: string;
}

export interface StackedFigureProps {
  items: StackedFigureItem[];
  /** Fan direction: back cards step up and to this side. */
  fan?: 'right' | 'left';
  /** Milliseconds each card spends at the front. */
  interval?: number;
  className?: string;
}

// As percentages of the card's own size. The sideways spread is shared
// across the stack, so card width doesn't shrink as cards are added; each
// extra card adds a vertical step, so the stack grows taller instead.
const SPREAD_X = 24;
const STEP_Y = 20;
const FALLBACK_RATIO = 16 / 10;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function StackedFigure({ items, fan = 'right', interval = 3200, className = '' }: StackedFigureProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // front = index of the card currently at the front; each card's depth follows from it.
  const [front, setFront] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const count = items.length;
  const depthSpan = count - 1;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Mostly on screen, not just peeking in at an edge.
    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.6), {
      threshold: [0, 0.6],
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || hovered || count < 2 || reducedMotion()) return;
    const id = window.setInterval(() => setFront((f) => (f + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [inView, hovered, count, interval]);

  const dir = fan === 'right' ? 1 : -1;
  // Cards take the first known image's shape (from the `npm run images`
  // manifest), so screenshots show in full instead of being cropped.
  const size = items.map((item) => item.src && imageSize(item.src)).find(Boolean);
  const ratio = size ? size.width / size.height : FALLBACK_RATIO;
  // Card and figure sized so the fan fits exactly.
  const stepX = depthSpan ? SPREAD_X / depthSpan : 0;
  const cardWidth = 100 / (1 + SPREAD_X / 100);
  const figureRatio = ratio / ((cardWidth / 100) * (1 + (depthSpan * STEP_Y) / 100));

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      data-dither-mask
      className={`relative w-full ${className}`}
      style={{ aspectRatio: figureRatio }}
    >
      {items.map((item, i) => {
        const depth = (i - front + count) % count;
        return (
          <div
            key={item.src ?? i}
            aria-hidden={depth !== 0}
            className={`absolute bottom-0 overflow-hidden rounded-sm border border-line-lit bg-ground transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              fan === 'right' ? 'left-0' : 'right-0'
            }`}
            style={{
              width: `${cardWidth}%`,
              aspectRatio: ratio,
              zIndex: count - depth,
              transform: `translate(${dir * depth * stepX}%, ${-depth * STEP_Y}%)`,
              filter: `brightness(${1 - (depth / Math.max(depthSpan, 1)) * 0.6})`,
            }}
          >
            {item.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- pre-optimised files (scripts/optimize-images.mjs)
              <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full w-full items-end bg-panel p-4">
                <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">{item.alt}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
