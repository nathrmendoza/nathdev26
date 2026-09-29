'use client';

/**
 * Footer.tsx
 *
 * One straight line, then a single row: identity/location/local time on the
 * left, contact/back-to-top icons on the right. Mounted once in _app.tsx so
 * it doesn't remount per route.
 *
 * Plays its entrance once, the first time it scrolls into view (not on
 * mount, unlike Header): the divider line grows in from the left, then the
 * left text sweeps left to right with the same glitch-resolve character
 * effect as Header's nav, while the right icons fade/slide in with the same
 * stagger Header uses for its logo letters.
 *
 * The text sweep is driven entirely by a `tick` counter re-rendered through
 * normal state (not imperative DOM refs, unlike Header) -- a character's
 * visual state is a pure function of its position against the current tick.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GithubIcon, LinkedinIcon, MailIcon, ArrowUpIcon } from '@/components/icons';

const GLYPHS = '#%&$@*+=~/\\|<>[]{}';
const SWEEP_DURATION_MS = 1400;
const ICON_STAGGER_MS = 70;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function randomGlyph() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0];
}

function offsetsFor(labels: string[]) {
  const offsets: number[] = [];
  let total = 0;
  for (const label of labels) {
    offsets.push(total);
    total += label.length;
  }
  return { offsets, total };
}

/** Ticks from 0 to `totalChars * 2` once `active`: the first half is the
 *  growth pass (each position starts glitching), the second half resolve
 *  (each position settles), matching Header's two-phase sweep timing.
 *  Driven by elapsed wall-clock time via rAF rather than counting fixed
 *  setInterval firings, so the total duration holds even if individual
 *  frames drift or get delayed under load. */
function useSweepTick(active: boolean, totalChars: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active || totalChars === 0) return;
    const max = totalChars * 2;

    if (reducedMotion()) {
      const id = window.setTimeout(() => setTick(max), 0);
      return () => window.clearTimeout(id);
    }

    const stepMs = SWEEP_DURATION_MS / max;
    const start = performance.now();
    let frameId: number;
    const loop = (now: number) => {
      const next = Math.min(max, Math.floor((now - start) / stepMs));
      setTick((prev) => (next === prev ? prev : next));
      if (next < max) frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [active, totalChars]);
  return tick;
}

/** A label's characters, each resolving from noise to real text as `tick`
 *  sweeps past its position (`charOffset`) in the group's combined
 *  left-to-right sequence. */
function SweepChars({
  label,
  charOffset,
  totalChars,
  tick,
}: {
  label: string;
  charOffset: number;
  totalChars: number;
  tick: number;
}) {
  return (
    <>
      {label.split('').map((ch, i) => {
        const gi = charOffset + i;
        const resolved = tick > totalChars + gi;
        const glitching = !resolved && tick > gi;
        return (
          <i key={i} style={{ fontStyle: 'normal', opacity: resolved || glitching ? 1 : 0 }}>
            {ch === ' ' ? ' ' : resolved ? ch : glitching ? randomGlyph() : ch}
          </i>
        );
      })}
    </>
  );
}

/** Fades an icon in with the same slide-up + stagger Header uses for its
 *  logo letters -- icons don't have characters to glitch-sweep, so they get
 *  a simpler entrance instead of racing the left text's sweep. */
function IconReveal({ on, index, children }: { on: boolean; index: number; children: ReactNode }) {
  return (
    <span
      className={`inline-flex transition-all duration-400 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      style={{ transitionDelay: `${index * ICON_STAGGER_MS}ms` }}
    >
      {children}
    </span>
  );
}

interface SocialLink {
  label: string;
  href: string;
  Icon: () => ReactNode;
}

const LEFT_LABELS = ['Nathan — Web Developer', 'Christchurch based'];

// Placeholders -- swap in the real GitHub/LinkedIn URLs before shipping.
const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com', Icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: LinkedinIcon },
  { label: 'Email', href: 'mailto:nathmendoza.dev@gmail.com', Icon: MailIcon },
];

// Same length as a real formatNZTime() result -- rendered on both server and
// client's first pass so hydration matches; the real time only exists
// client-side (server and client would compute different seconds otherwise).
const CLOCK_PLACEHOLDER = '00:00:00 NZT';

// Fixed-length format (2-digit H/M/S + a 3-letter zone) so the entrance's
// character count never mismatches once the clock starts ticking live.
function formatNZTime(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Pacific/Auckland',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('hour')}:${get('minute')}:${get('second')} NZT`;
}

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const [lineOn, setLineOn] = useState(false);
  const [sweepOn, setSweepOn] = useState(false);
  const [clockSnapshot, setClockSnapshot] = useState(CLOCK_PLACEHOLDER);
  const [liveClock, setLiveClock] = useState(CLOCK_PLACEHOLDER);

  useEffect(() => {
    const real = formatNZTime(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- swaps the SSR-safe placeholder for the real (client-only) time once mounted
    setClockSnapshot(real);
    setLiveClock(real);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLineOn(true);
        if (reducedMotion()) setSweepOn(true);
        else window.setTimeout(() => setSweepOn(true), 150);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const leftLabels = [...LEFT_LABELS, clockSnapshot];
  const leftOffsets = offsetsFor(leftLabels);
  const tickLeft = useSweepTick(sweepOn, leftOffsets.total);
  const leftDone = tickLeft >= leftOffsets.total * 2;

  useEffect(() => {
    if (!leftDone) return;
    const id = window.setInterval(() => setLiveClock(formatNZTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, [leftDone]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });

  return (
    <footer ref={rootRef} data-dither-mask className="relative z-20 px-6 py-6 sm:px-12 sm:py-8">
      <div
        className={`h-px w-full origin-left bg-line-lit transition-transform duration-700 ease-out ${
          lineOn ? 'scale-x-100' : 'scale-x-0'
        }`}
      />

      <div className="mt-6 flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5 font-mono text-[11px] tracking-[0.1em] text-ink-dim uppercase sm:flex-row sm:items-center sm:gap-8">
          {LEFT_LABELS.map((label, i) => (
            <span key={label}>
              <SweepChars label={label} charOffset={leftOffsets.offsets[i]} totalChars={leftOffsets.total} tick={tickLeft} />
            </span>
          ))}
          <span className="tabular-nums">
            {leftDone ? (
              liveClock
            ) : (
              <SweepChars
                label={clockSnapshot}
                charOffset={leftOffsets.offsets[LEFT_LABELS.length]}
                totalChars={leftOffsets.total}
                tick={tickLeft}
              />
            )}
          </span>
        </div>

        <nav aria-label="Footer" className="flex items-center gap-5 sm:gap-6">
          {SOCIAL_LINKS.map((link, i) => (
            <IconReveal key={link.href} on={sweepOn} index={i}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                data-dither-mask
                className="block h-4 w-4 text-ink transition-all hover:-translate-y-0.5 hover:text-accent"
              >
                <link.Icon />
              </a>
            </IconReveal>
          ))}
          <IconReveal on={sweepOn} index={SOCIAL_LINKS.length}>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              data-dither-mask
              className="block h-4 w-4 cursor-pointer text-ink transition-all hover:-translate-y-0.5 hover:text-accent"
            >
              <ArrowUpIcon />
            </button>
          </IconReveal>
        </nav>
      </div>
    </footer>
  );
}
