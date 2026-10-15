'use client';

import { useState, type ReactNode } from 'react';
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
      className="absolute bottom-8 left-1/2 block h-8 w-8 -translate-x-1/2 sm:h-4 sm:w-4 text-ink-dim transition-colors motion-safe:animate-bounce-soft hover:text-accent"
    >
      <ArrowDownIcon />
    </button>
  );
}

export interface HeroProps {
  /** 3D headline -- see Hero3DText for the characters it supports. */
  text?: string;
  /** The page's <h1> (visually hidden). */
  heading?: string;
  tagline?: ReactNode;
  /** Shown under the tagline, in place of the scroll cue. */
  action?: ReactNode;
}

export default function Hero({
  text,
  heading,
  tagline = (
    <>
      Nath Mendoza — Web developer, Christchurch based. <br />
      Fast sites, clean code, no drama.
    </>
  ),
  action,
}: HeroProps) {
  const [landed, setLanded] = useState(false);

  return (
    <section
      id="hero"
      data-dither-mask
      className="relative flex min-h-[calc(100vh-var(--header-h,96px))] flex-col items-center justify-center px-6 text-center sm:px-12"
    >
      <div className="w-full max-w-4xl">
        <Hero3DText text={text} heading={heading} onLanded={() => setLanded(true)} />

        <p
          className={`mx-auto mt-6 max-w-xl text-body text-ink-dim transition-all duration-700 ease-out motion-reduce:transition-none ${
            landed ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {tagline}
        </p>

        {action && (
          <div
            className={`mt-10 transition-all delay-150 duration-700 ease-out motion-reduce:transition-none ${
              landed ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            {action}
          </div>
        )}
      </div>

      {!action && <ScrollCue />}
    </section>
  );
}
