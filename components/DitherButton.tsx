'use client';

/**
 * DitherButton.tsx
 *
 * A button whose fill dithers in radially from the exact point the cursor
 * crossed the border, landing on a completely solid background.
 *
 * Set `fill` below 1 for a secondary button that holds a permanent half-tone
 * instead of going solid -- the screen-door texture is what marks it as
 * secondary, so you don't need a lighter colour.
 */

import { useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import { DitherSurface, localOrigin, type RGB, type DitherMode } from '@/lib/dither-surface';

export interface DitherButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 1 lands on a solid fill. Lower holds a permanent half-tone. */
  fill?: number;
  mode?: DitherMode;
  rgb?: RGB;
  /** Label colour once the fill is in. Ignored when fill < 1. */
  invertedColor?: string;
}

export default function DitherButton({
  children,
  fill = 1,
  mode = 'radial',
  rgb = [217, 220, 214],
  invertedColor = '#0d0f10',
  className = '',
  ...rest
}: DitherButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<DitherSurface | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const s = new DitherSurface(el, {
      mode,
      rgb,
      fill,
      speed: 10,
      drift: fill < 1,
      texture: fill < 1 ? 0.7 : 0,
      className: 'dither-canvas',
    });
    surfaceRef.current = s;

    const enter = (e: PointerEvent) => {
      s.to(1, localOrigin(el, e));
      el.classList.add('is-on');
    };
    const leave = (e: PointerEvent) => {
      s.to(0, localOrigin(el, e));
      el.classList.remove('is-on');
    };
    const focus = () => {
      s.to(1, { x: 0.5, y: 0.5 });
      el.classList.add('is-on');
    };
    const blur = () => {
      s.to(0);
      el.classList.remove('is-on');
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('focus', focus);
    el.addEventListener('blur', blur);

    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('focus', focus);
      el.removeEventListener('blur', blur);
      s.destroy();
      surfaceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options are read once at mount; use surfaceRef.current?.set() for live updates
  }, []);

  return (
    <button
      ref={ref}
      data-dither-mask
      className={`dither-btn ${className}`.trim()}
      style={fill >= 1 ? ({ ['--dither-inverted' as string]: invertedColor }) : undefined}
      {...rest}
    >
      <span className="dither-btn-label">{children}</span>
    </button>
  );
}
