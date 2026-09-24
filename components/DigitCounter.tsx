'use client';

/**
 * DigitCounter.tsx
 *
 * A real incrementing count, 0 up to the target, zero-padded to the
 * target's own digit width for the whole count (100 counts 000, 001, ...
 * 100, not growing from 1 digit to 3). Eased, not linear. Triggers on
 * scroll-into-view via IntersectionObserver, not hover.
 */

import { useCallback, useEffect, useRef } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface DigitCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Zero-pads to at least this many digits. Defaults to the target value's
   *  own digit count, so the width is fixed for the whole count. */
  minDigits?: number;
  /** Seconds for the count to settle. */
  duration?: number;
  /** Fraction of the element visible before it triggers, 0-1. */
  threshold?: number;
  /** Re-run every time it re-enters view, instead of once. */
  replay?: boolean;
  className?: string;
}

export default function DigitCounter({
  value,
  prefix = '',
  suffix = '',
  minDigits,
  duration = 1.4,
  threshold = 0.3,
  replay = false,
  className = '',
}: DigitCounterProps) {
  const target = Math.max(0, Math.trunc(value));
  const pad = minDigits ?? String(target).length;

  const ref = useRef<HTMLSpanElement>(null);
  const state = useRef({ current: 0, target: 0, running: false, startedAt: 0 });

  const format = useCallback((n: number) => Math.round(n).toString().padStart(pad, '0'), [pad]);

  useEffect(() => {
    state.current.current = 0;
    state.current.target = 0;
    if (ref.current) ref.current.textContent = format(0);
  }, [target, format]);

  const run = useCallback(
    (to: number) => {
      const st = state.current;
      st.target = to;
      if (st.running) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      st.running = true;
      st.startedAt = performance.now();
      const from = st.current;

      const frame = (now: number) => {
        const el = ref.current;
        if (!el) {
          st.running = false;
          return;
        }

        const elapsed = (now - st.startedAt) / 1000;
        const t = reduced ? 1 : Math.min(elapsed / duration, 1);
        st.current = from + (st.target - from) * easeOutCubic(t);
        el.textContent = format(st.current);

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          st.current = st.target;
          el.textContent = format(st.current);
          st.running = false;
        }
      };
      requestAnimationFrame(frame);
    },
    [duration, format]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run(target);
            if (!replay) observer.unobserve(el);
          } else if (replay) {
            run(0);
          }
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [run, replay, threshold, target]);

  return (
    <span
      data-dither-mask
      className={`inline-flex items-baseline gap-2 font-mono text-h3 font-bold text-ink tabular-nums ${className}`.trim()}
    >
      {prefix && <span>{prefix}</span>}
      <span ref={ref} aria-label={String(target)}>
        {format(0)}
      </span>
      {suffix && <span className="text-h6 font-normal text-ink-faint">{suffix}</span>}
    </span>
  );
}
