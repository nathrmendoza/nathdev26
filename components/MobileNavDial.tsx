'use client';

/**
 * MobileNavDial.tsx
 *
 * Mobile nav: a press-and-drag combination-lock dial instead of the desktop
 * text nav -- there's no room for four glitch-sweep labels at phone width.
 *
 * Press the icon and notches fan out around it. Drag: total rightward +
 * downward movement spins the dial clockwise, leftward + upward spins it
 * counter-clockwise -- a straight-line drag, not tracing an actual circular
 * path, since that's what a thumb can actually do on a phone screen. Small
 * notches between the four big ones are purely for the "combination lock"
 * feel; only a big notch can be selected. Whichever one lines up with the
 * fixed pointer on the left is the page that opens on release.
 */

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/router';

interface DialItem {
  label: string;
  href: string;
}

const ITEMS: DialItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Works', href: '/works' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

const SMALL_PER_GAP = 5;
const SLOTS_PER_ITEM = SMALL_PER_GAP + 1;
const TOTAL_SLOTS = ITEMS.length * SLOTS_PER_ITEM;
const STEP_DEG = 360 / TOTAL_SLOTS;
const SELECTOR_ANGLE = 180; // fixed pointer, pointing left
const SENSITIVITY = 0.6; // degrees of rotation per pixel of combined drag

const RADIUS = 24;
const BIG_LEN = 9;
const SMALL_LEN = 4;
const SNAP_MS = 320;

function normalize(angle: number) {
  return ((angle % 360) + 360) % 360;
}

// Rounded so the server and client render the exact same digit string --
// trig results otherwise differ in their last decimal place often enough
// between Node's and the browser's float-to-string conversion to fail
// hydration on these (static, rotation isn't baked in here) coordinates.
function toXY(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.round(Math.cos(rad) * radius * 100) / 100, y: Math.round(Math.sin(rad) * radius * 100) / 100 };
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function activeIndexFor(rotation: number) {
  const target = normalize(SELECTOR_ANGLE - rotation);
  const slot = Math.round(target / STEP_DEG) % TOTAL_SLOTS;
  return Math.round(slot / SLOTS_PER_ITEM) % ITEMS.length;
}

export default function MobileNavDial() {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const drag = useRef<{ startX: number; startY: number; startRotation: number } | null>(null);

  const activeIndex = activeIndexFor(rotation);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startRotation: rotation };
    setSnapping(false);
    setPressed(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setRotation(drag.current.startRotation + (dx + dy) * SENSITIVITY);
  };

  const commit = () => {
    if (!drag.current) return;
    drag.current = null;
    const index = activeIndex;

    // Snap to the exact angle for this item -- choosing whichever
    // equivalent turn (±360) is closest to the current rotation, so it
    // never visibly spins all the way back around to get there.
    const base = normalize(SELECTOR_ANGLE - index * SLOTS_PER_ITEM * STEP_DEG);
    let target = base;
    while (target - rotation > 180) target -= 360;
    while (target - rotation < -180) target += 360;

    setSnapping(true);
    setRotation(target);

    const hold = reducedMotion() ? 0 : SNAP_MS;
    window.setTimeout(() => {
      setPressed(false);
      router.push(ITEMS[index].href);
    }, hold);
  };

  return (
    <button
      type="button"
      aria-label="Open navigation"
      data-dither-mask
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={commit}
      onPointerCancel={commit}
      className="absolute top-1/2 right-4 flex h-14 w-14 -translate-y-1/2 touch-none items-center justify-center sm:hidden"
    >
      <svg
        viewBox="-100 -40 140 80"
        width={140}
        height={80}
        className="absolute overflow-visible"
        style={{ left: '50%', top: '50%', transform: 'translate(-100px, -40px)' }}
        aria-hidden="true"
      >
        <circle
          cx={0}
          cy={0}
          r={RADIUS}
          strokeWidth={1.5}
          className={`fill-none transition-colors duration-200 ${pressed ? 'stroke-accent' : 'stroke-ink-dim'}`}
        />

        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '0px 0px',
            opacity: pressed ? 1 : 0,
            transition: snapping
              ? `transform ${SNAP_MS}ms cubic-bezier(0.16,0.9,0.3,1), opacity 200ms ease-out`
              : 'opacity 200ms ease-out',
          }}
        >
          {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
            const isBig = slot % SLOTS_PER_ITEM === 0;
            const itemIndex = slot / SLOTS_PER_ITEM;
            const isActiveBig = isBig && itemIndex === activeIndex;
            const angle = slot * STEP_DEG;
            const len = isBig ? BIG_LEN : SMALL_LEN;
            const inner = toXY(angle, RADIUS);
            const outer = toXY(angle, RADIUS + len);
            return (
              <line
                key={slot}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={isBig ? 2 : 1}
                className={isActiveBig ? 'stroke-accent' : isBig ? 'stroke-ink' : 'stroke-ink-faint'}
              />
            );
          })}
        </g>

        {/* Fixed selector: doesn't rotate, always points left. */}
        <line
          x1={-(RADIUS - 2)}
          y1={0}
          x2={-(RADIUS + BIG_LEN + 6)}
          y2={0}
          className="stroke-accent transition-opacity duration-200"
          style={{ opacity: pressed ? 1 : 0 }}
          strokeWidth={1.5}
        />
        <text
          x={-(RADIUS + BIG_LEN + 12)}
          y={4}
          textAnchor="end"
          className="fill-accent font-mono text-[11px] tracking-[0.1em] uppercase transition-opacity duration-200"
          style={{ opacity: pressed ? 1 : 0 }}
        >
          {ITEMS[activeIndex].label}
        </text>
      </svg>
    </button>
  );
}
