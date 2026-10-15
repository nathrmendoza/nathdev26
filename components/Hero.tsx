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

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ScrollCue() {
  const scrollToNext = () => {
    const next = document.getElementById('hero')?.nextElementSibling;
    const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth';
    if (next) next.scrollIntoView({ behavior, block: 'start' });
    else window.scrollBy({ top: window.innerHeight, behavior });
  };

  return (
    <button
      type="button"
      onClick={scrollToNext}
      aria-label="Scroll down"
      data-dither-mask
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-dim transition-colors motion-safe:animate-bounce-soft hover:text-accent"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16" />
        <path d="m5 13 7 7 7-7" />
      </svg>
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
