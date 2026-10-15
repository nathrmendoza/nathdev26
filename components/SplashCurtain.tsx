'use client';

/**
 * SplashCurtain.tsx
 *
 * Full-viewport dither reveal on first paint -- same DitherSurface engine
 * as ContactForm's dissolve and PageTransition, radial mode. Starts fully covering with no
 * fade-in, then clears after `hold`. Also masks the WebGL background's own
 * shader-compile flicker.
 *
 * Mounted once in _app.tsx: plays on every full page load, not on
 * client-side route changes (that's PageTransition, plus DitherBackground's
 * pulse).
 */

import { useEffect, useRef } from 'react';
import { DitherSurface, type RGB } from '@/lib/dither-surface';

function hexToRgb(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export interface SplashCurtainProps {
  /** Hex colour to dissolve from -- pass the background's own `ground`
   *  so the curtain matches exactly what it reveals. */
  ground: string;
  /** Milliseconds the curtain stays fully up before it starts dissolving. */
  hold?: number;
  /** Dissolve speed -- higher clears faster. */
  speed?: number;
}

export default function SplashCurtain({ ground, hold = 700, speed = 1.8 }: SplashCurtainProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const surface = new DitherSurface(host, {
      mode: 'radial',
      rgb: hexToRgb(ground),
      fill: 1,
      speed,
      className: 'dither-canvas',
    });

    // Radial mode clears the point furthest from origin first, so pinning
    // origin to top-left clears bottom-right first.
    surface.origin = { x: 0, y: 0 };

    surface.progress = 1;
    surface.target = 1;
    surface.render();

    const timer = window.setTimeout(() => surface.to(0), hold);

    return () => {
      window.clearTimeout(timer);
      surface.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- props are read once at mount, not meant to retrigger the curtain
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none fixed inset-0 isolate z-100 overflow-hidden" />;
}
