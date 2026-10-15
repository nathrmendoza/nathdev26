'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { GithubIcon, LinkedinIcon, MailIcon } from '@/components/icons';

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

/** 0 -> totalChars*2: first half glitches each position in, second half
 *  resolves it. Wall-clock driven, so the duration holds under load. */
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
// The live clock sits between the two labels, dot-separated.
const CLOCK_INDEX = 1;

const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/nathrmendoza', Icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nathaniel-mendoza-425203163/', Icon: LinkedinIcon },
  { label: 'Email', href: 'mailto:nathmendoza.dev@gmail.com', Icon: MailIcon },
];

// Same length as formatNZTime() output, so SSR and the first client render match.
const CLOCK_PLACEHOLDER = '00:00:00 NZT';

// Fixed length, so the sweep's character count never changes.
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

  const leftLabels = [LEFT_LABELS[0], clockSnapshot, LEFT_LABELS[1]];
  const leftOffsets = offsetsFor(leftLabels);
  const tickLeft = useSweepTick(sweepOn, leftOffsets.total);
  const leftDone = tickLeft >= leftOffsets.total * 2;

  useEffect(() => {
    if (!leftDone) return;
    const id = window.setInterval(() => setLiveClock(formatNZTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, [leftDone]);

  useEffect(() => {
    // Like --header-h, for layouts sized to one screen.
    const el = rootRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--footer-h', `${el.getBoundingClientRect().height}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={rootRef} data-dither-mask className="relative z-20 px-6 py-6 sm:px-12 sm:pt-8">
      <div
        className={`h-px w-full origin-left bg-line-lit transition-transform duration-700 ease-out ${
          lineOn ? 'scale-x-100' : 'scale-x-0'
        }`}
      />

      {/* lg+: the empty left column is where CommandPalette's hint lands;
          lg:pr-10 keeps BackToTop's slot clear. */}
      <div className="mt-6 flex flex-col items-center gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <div aria-hidden="true" className="hidden lg:block" />

        <div className="flex flex-col items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] text-ink-dim uppercase sm:flex-row sm:gap-6">
          {leftLabels.map((label, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`hidden h-1 w-1 shrink-0 rounded-full bg-ink-faint transition-opacity duration-400 sm:block ${
                    tickLeft > leftOffsets.offsets[i] ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
              <span className={i === CLOCK_INDEX ? 'tabular-nums' : undefined}>
                {i === CLOCK_INDEX && leftDone ? (
                  liveClock
                ) : (
                  <SweepChars
                    label={label}
                    charOffset={leftOffsets.offsets[i]}
                    totalChars={leftOffsets.total}
                    tick={tickLeft}
                  />
                )}
              </span>
            </Fragment>
          ))}
        </div>

        <nav aria-label="Footer" className="flex items-center gap-5 sm:gap-6 lg:justify-self-end lg:pr-10">
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
        </nav>
      </div>
    </footer>
  );
}
