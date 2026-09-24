'use client';

/**
 * ScrambleLink.tsx
 *
 * Text that scrambles out and resolves back in on hover -- the dithering
 * idea applied to characters instead of pixels.
 *
 * Each character resolves at a threshold from a bit-reversal sequence (the
 * 1D equivalent of a Bayer matrix), settling in a scattered, evenly
 * distributed order rather than randomly (cf. GSAP's ScrambleTextPlugin,
 * which reads as noise, not a pattern) or left-to-right.
 *
 * Use a monospace face -- proportional type jitters as glyphs resolve.
 */

import { useCallback, useEffect, useRef, type AnchorHTMLAttributes } from 'react';

const GLYPHS = '#%&$@*+=~/\\|<>[]{}';
const BITS = 5;
const SPAN = 1 << BITS; // sequence repeats every 32 characters

function bitrev(i: number): number {
  let r = 0;
  for (let b = 0; b < BITS; b++) r = (r << 1) | ((i >> b) & 1);
  return r / SPAN;
}

export interface ScrambleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  text: string;
  /** How long the text stays scrambled before resolving, in ms. */
  hold?: number;
  /** Resolve rate. Higher is snappier. */
  speed?: number;
}

export default function ScrambleLink({
  text,
  hold = 190,
  speed = 14,
  className = '',
  ...rest
}: ScrambleLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const cells = useRef<{ el: HTMLElement; ch: string; th: number }[]>([]);
  const state = useRef({ prog: 1, targ: 1, running: false, prev: 0, timer: 0 });

  // Build one span per character, each with its ordered threshold.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = state.current;
    el.textContent = '';
    cells.current = [];
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('i');
      span.style.fontStyle = 'normal';
      span.textContent = text[i];
      el.appendChild(span);
      cells.current.push({ el: span, ch: text[i], th: bitrev(i % SPAN) });
    }
    return () => {
      window.clearTimeout(st.timer);
    };
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

  const kick = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    run(0);
    window.clearTimeout(state.current.timer);
    state.current.timer = window.setTimeout(() => run(1), reduced ? 0 : hold);
  }, [run, hold]);

  return (
    <a
      ref={ref}
      data-dither-mask
      className={`dither-scramble ${className}`.trim()}
      onPointerEnter={kick}
      onFocus={kick}
      {...rest}
    >
      {text}
    </a>
  );
}
