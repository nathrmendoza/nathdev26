'use client';

/**
 * Hero.tsx
 *
 * Full-viewport intro for `/`. The headline is real 3D geometry (see
 * Hero3DText) that faces the cursor with a small eased rotation; everything
 * else here is plain flat content around it. The tagline waits for the
 * headline's intro to land before fading in, so the two arrive in sequence.
 */

import { useState } from 'react';
import Hero3DText from '@/components/Hero3DText';
import { scrollToId } from '@/lib/scroll-to';
import { ArrowDownIcon } from '@/components/icons';

function ScrollCue() {
  const scrollToNext = () => scrollToId('background');

  return (
    <button
      type="button"
      onClick={scrollToNext}
      aria-label="Scroll down"
      data-dither-mask
      // h-4 w-4 + the shared icon: same size and stroke as BackToTop's arrow.
      className="absolute bottom-8 left-1/2 block h-4 w-4 -translate-x-1/2 text-ink-dim transition-colors motion-safe:animate-bounce-soft hover:text-accent"
    >
      <ArrowDownIcon />
    </button>
  );
}

export default function Hero() {
  const [landed, setLanded] = useState(false);

  return (
    <section
      id="hero"
      data-dither-mask
      className="relative flex min-h-[calc(100vh-var(--header-h,96px))] flex-col items-center justify-center px-6 text-center sm:px-12"
    >
      <div className="w-full max-w-4xl">
        <Hero3DText onLanded={() => setLanded(true)} />

        <p
          className={`mx-auto mt-6 max-w-xl text-body text-ink-dim transition-all duration-700 ease-out motion-reduce:transition-none ${
            landed ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          Nath Mendoza — Web developer, Christchurch based. <br/>Fast sites, clean code, no drama.
        </p>
      </div>

      <ScrollCue />
    </section>
  );
}
