'use client';

/**
 * Experience.tsx
 *
 * Work history as a scroll-filled timeline: the spine draws in sync with
 * scroll position through the section instead of sitting fully revealed on
 * load. Each dot lights up, and its entry fades/slides in, the moment the
 * fill reaches it -- driven by the same progress value, not separate
 * per-entry triggers, so the line and the reveals never fall out of sync.
 *
 * Chronological, oldest first, so scrolling down = moving forward in time,
 * arriving at the most recent role at the bottom. Past that, the spine
 * continues as a dashed, fading tail -- the story isn't finished.
 *
 * Alternates sides on wider screens to use the section's full width (single
 * column on mobile, where there isn't room for that). Entries sit centered
 * on a single shared spine either way.
 */

import { useEffect, useRef, useState } from 'react';
import DigitCounter from '@/components/DigitCounter';

interface ExperienceEntry {
  startYear: number;
  endYear: number;
  text: string;
}

const EARLIEST_YEAR = 2019;

// Real history -- keep in sync with the old site if it changes there.
const ENTRIES: ExperienceEntry[] = [
  {
    startYear: 2019,
    endYear: 2021,
    text: 'Front-end developer at Optimind Technology Solutions -- websites and other digital collateral for clients in the Asia.',
  },
  {
    startYear: 2021,
    endYear: 2024,
    text: 'Web developer at Sonnet Digital, working with clients across Australia, New Zealand, and the U.S.',
  },
  {
    startYear: 2024,
    endYear: 2026,
    text: 'Web Developer at Imagic Creative Agency, Christchurch -- building and maintaining websites for clients across New Zealand.',
  },
];

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [dotFractions, setDotFractions] = useState<number[]>(ENTRIES.map(() => 1));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (reducedMotion()) {
      const id = window.setTimeout(() => setProgress(1), 0);
      return () => window.clearTimeout(id);
    }

    // Absolute document-space scrollY thresholds, not viewport-relative --
    // computed once (and on resize), then compared against scrollY directly.
    // Capped to the page's actual max scroll: if there's little content
    // after this section, the ideal "finished" point may be physically
    // unreachable, which would leave the fill permanently stuck short of
    // full without this.
    let startScrollY = 0;
    let endScrollY = 1;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.height) return;
      setDotFractions(
        dotRefs.current.map((dot) => {
          if (!dot) return 1;
          const dotRect = dot.getBoundingClientRect();
          return (dotRect.top + dotRect.height / 2 - rect.top) / rect.height;
        })
      );

      const docTop = window.scrollY + rect.top;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const idealStart = docTop - window.innerHeight * 0.8;
      const idealEnd = docTop + rect.height - window.innerHeight * 0.35;
      endScrollY = Math.min(idealEnd, maxScroll);
      startScrollY = Math.min(idealStart, endScrollY - 1);
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const p = (window.scrollY - startScrollY) / (endScrollY - startScrollY);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const years = new Date().getFullYear() - EARLIEST_YEAR;
  const lastLit = progress >= (dotFractions[dotFractions.length - 1] ?? 1);

  return (
    <section id="background" className="px-6 py-32 sm:px-12 sm:py-40">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-20 flex flex-wrap items-baseline gap-4">
          <DigitCounter value={years} />
          <span className="text-h4 font-bold text-ink-dim">Years Experience</span>
        </h2>

        <div ref={containerRef} className="relative">
          <div className="absolute top-2 bottom-2 left-2 w-px -translate-x-1/2 bg-line sm:left-1/2" />
          <div
            className="absolute top-2 left-2 w-px -translate-x-1/2 origin-top bg-accent sm:left-1/2"
            style={{ height: 'calc(100% - 1rem)', transform: `translateX(-50%) scaleY(${progress})` }}
          />

          <div className="flex flex-col gap-16 sm:gap-20">
            {ENTRIES.map((entry, i) => {
              const lit = progress >= (dotFractions[i] ?? 1);
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={entry.startYear}
                  className="relative grid gap-2 pl-10 sm:grid-cols-2 sm:gap-x-16 sm:gap-y-0 sm:pl-0"
                >
                  <div
                    ref={(el) => {
                      dotRefs.current[i] = el;
                    }}
                    className={`absolute top-1 left-2 h-4 w-4 -translate-x-1/2 rounded-full border-2 transition-colors duration-300 sm:left-1/2 ${
                      lit ? 'border-accent bg-accent' : 'border-line bg-ground'
                    }`}
                  />
                  <div
                    className={`transition-all duration-500 ease-out ${
                      lit ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    } ${isLeft ? 'sm:col-start-1 sm:text-right' : 'sm:col-start-2 sm:text-left'}`}
                  >
                    <div
                      className={`mb-2 flex items-baseline gap-3 ${isLeft ? 'sm:justify-end' : 'sm:justify-start'}`}
                    >
                      <DigitCounter value={entry.startYear} />
                      <span className="text-h3 font-bold text-ink-faint">—</span>
                      <DigitCounter value={entry.endYear} />
                    </div>
                    <p className="text-ink-dim">{entry.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The line continues past the most recent role, fading out --
              the work's still ongoing, not a closed book. */}
          <div
            aria-hidden="true"
            className={`absolute left-2 h-24 w-px -translate-x-1/2 bg-line-lit transition-opacity duration-700 sm:left-1/2 ${
              lastLit ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              top: 'calc(100% + 0.5rem)',
              maskImage: 'linear-gradient(to bottom, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
