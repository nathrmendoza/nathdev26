'use client';

/**
 * DitherButton.tsx
 *
 * A button whose fill dithers in radially from the exact point the cursor
 * crossed the border, landing on a completely solid background.
 *
 * Set `invert` for the secondary variant: starts fully filled and dissolves
 * away on hover instead -- the mirror image of the default direction.
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
  /** Secondary variant: starts filled, dissolves away on hover. */
  invert?: boolean;
}

export default function DitherButton({
  children,
  fill = 1,
  mode = 'radial',
  rgb = [217, 220, 214],
  invertedColor = '#0d0f10',
  invert = false,
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

    if (invert) {
      s.progress = 1;
      s.target = 1;
      s.render();
    }

    const restTarget = invert ? 1 : 0;
    const activeTarget = invert ? 0 : 1;

    const enter = (e: PointerEvent) => {
      s.to(activeTarget, localOrigin(el, e));
      el.classList.add('is-on');
    };
    const leave = (e: PointerEvent) => {
      s.to(restTarget, localOrigin(el, e));
      el.classList.remove('is-on');
    };
    const focus = () => {
      s.to(activeTarget, { x: 0.5, y: 0.5 });
      el.classList.add('is-on');
    };
    const blur = () => {
      s.to(restTarget);
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
      className={`dither-btn ${invert ? 'is-inverted' : ''} ${className}`.trim()}
      style={fill >= 1 ? ({ ['--dither-inverted' as string]: invertedColor }) : undefined}
      {...rest}
    >
      <span className="dither-btn-label">{children}</span>
    </button>
  );
}
