'use client';

import { useCallback, useEffect, useRef } from 'react';

const GLYPHS = '#%&$@*+=~/\\|<>[]{}';
const BITS = 5;
const SPAN = 1 << BITS; // sequence repeats every 32 characters

function bitrev(i: number): number {
  let r = 0;
  for (let b = 0; b < BITS; b++) r = (r << 1) | ((i >> b) & 1);
  return r / SPAN;
}

export type ScrambleRevealTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

export interface ScrambleRevealProps {
  text: string;
  /** Tag to render as -- typically a heading level. */
  as?: ScrambleRevealTag;
  /** Resolve rate once triggered. Higher is snappier. */
  speed?: number;
  /** Fraction of the element visible before it triggers, 0-1. */
  threshold?: number;
  /** Re-run every time it re-enters view, instead of once. */
  replay?: boolean;
  className?: string;
}

export default function ScrambleReveal({
  text,
  as = 'span',
  speed = 4,
  threshold = 0.3,
  replay = false,
  className = '',
}: ScrambleRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const cells = useRef<{ el: HTMLElement; ch: string; th: number }[]>([]);
  const state = useRef({ prog: 0, targ: 0, running: false, prev: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = '';
    cells.current = [];
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('i');
      span.style.fontStyle = 'normal';
      span.setAttribute('data-off', '');
      span.textContent = text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.appendChild(span);
      cells.current.push({ el: span, ch: text[i], th: bitrev(i % SPAN) });
    }
    state.current.prog = 0;
    state.current.targ = 0;
  }, [text]);

  const run = useCallback(
    (to: number) => {
      const st = state.current;
      st.targ = to;
      if (st.running) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      st.running = true;
      st.prev = performance.now();

      const frame = (now: number) => {
        const dt = Math.min((now - st.prev) / 1000, 0.05);
        st.prev = now;

        if (reduced) st.prog = st.targ;
        else st.prog += (st.targ - st.prog) * (1 - Math.exp(-speed * dt));
        if (Math.abs(st.targ - st.prog) < 0.004) st.prog = st.targ;

        for (const c of cells.current) {
          if (st.prog > c.th) {
            if (c.el.textContent !== c.ch) {
              c.el.textContent = c.ch;
              c.el.removeAttribute('data-off');
            }
          } else {
            c.el.setAttribute('data-off', '');
            if (c.ch !== ' ') {
              c.el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
          }
        }

        if (st.prog !== st.targ) requestAnimationFrame(frame);
        else st.running = false;
      };
      requestAnimationFrame(frame);
    },
    [speed]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run(1);
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
  }, [run, replay, threshold]);

  const Tag = as;
  return (
    <Tag ref={ref as never} data-dither-mask className={`inline-block ${className}`.trim()}>
      {text}
    </Tag>
  );
}
