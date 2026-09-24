/**
 * Marquee.tsx
 *
 * A continuously looping band of oversized text for a full-width statement.
 * Pure CSS transform animation (see `marquee` in tailwind.config.js), not a
 * rAF loop, so it doesn't compete with the dither background's or Lenis's.
 *
 * Content is duplicated exactly twice so the loop is seamless: at -50%
 * translateX the second copy sits where the first started.
 */

import { Fragment } from 'react';

export interface MarqueeProps {
  phrases: string[];
  /** Glyph between phrases. Defaults to a centered dot. */
  separator?: string;
  /** Seconds for one full loop -- lower is faster. */
  duration?: number;
  className?: string;
}

export default function Marquee({
  phrases,
  separator = '•',
  duration = 60,
  className = '',
}: MarqueeProps) {
  const line = (copy: 'a' | 'b') => (
    <span className="flex shrink-0 items-center">
      {phrases.map((phrase, i) => (
        <Fragment key={`${copy}-${i}`}>
          <span>{phrase}</span>
          <span aria-hidden className="mx-8 text-ink md:mx-12">
            {separator}
          </span>
        </Fragment>
      ))}
    </span>
  );

  return (
    <div
      data-dither-mask
      className={`relative overflow-hidden ${className}`.trim()}
      role="img"
      aria-label={phrases.join(' -- ')}
    >
      <div
        aria-hidden="true"
        style={{ animationDuration: `${duration}s` }}
        className="animate-marquee flex w-max items-center font-display text-[clamp(3rem,8vw,9rem)] font-extrabold tracking-tight whitespace-nowrap text-ink uppercase motion-reduce:animate-none"
      >
        {line('a')}
        {line('b')}
      </div>
    </div>
  );
}
