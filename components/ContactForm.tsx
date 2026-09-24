'use client';

/**
 * ContactForm.tsx
 *
 * Inputs stay plain -- dither texture behind live text fights legibility.
 * On submit the whole thing dissolves (noise-ordered, mode 'dissolve'),
 * content swaps underneath, then the same surface clears in reverse.
 */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { DitherSurface, type RGB } from '@/lib/dither-surface';
import DitherButton from './DitherButton';

const GROUND: RGB = [13, 15, 16];

type FieldKey = 'name' | 'email' | 'message';

const EMPTY_VALUES: Record<FieldKey, string> = { name: '', email: '', message: '' };
const EMPTY_ERRORS: Record<FieldKey, string> = { name: '', email: '', message: '' };

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Field({
  fieldRef,
  label,
  htmlFor,
  error,
  isFocus,
  children,
}: {
  fieldRef: (el: HTMLDivElement | null) => void;
  label: string;
  htmlFor: string;
  error: string;
  isFocus: boolean;
  children: ReactNode;
}) {
  return (
    <div
      ref={fieldRef}
      className={`dither-field border-t border-line first:border-t-0 ${isFocus ? 'is-focus' : ''} ${
        error ? 'is-bad' : ''
      }`.trim()}
    >
      <div className="relative z-[1] grid gap-1.5 py-4 pr-3.5 pl-[22px]">
        <label
          htmlFor={htmlFor}
          className={`text-[9px] tracking-[0.16em] uppercase transition-colors ${
            isFocus ? 'text-accent' : error ? 'text-warn' : 'text-ink-faint'
          }`}
        >
          {label}
        </label>
        {children}
        {error && <p className="text-[10px] tracking-wide text-warn">{error}</p>}
      </div>
    </div>
  );
}

export default function ContactForm() {
  const shellRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<DitherSurface | null>(null);
  const fieldRefs = useRef<Record<FieldKey, HTMLDivElement | null>>({
    name: null,
    email: null,
    message: null,
  });

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const host = shellRef.current;
    if (!host) return;
    const veil = new DitherSurface(host, {
      mode: 'dissolve',
      rgb: GROUND,
      fill: 1,
      speed: 7,
      className: 'dither-canvas dither-veil',
    });
    veilRef.current = veil;
    return () => {
      veil.destroy();
      veilRef.current = null;
    };
  }, []);

  const shake = (key: FieldKey) => {
    const el = fieldRefs.current[key];
    if (!el || prefersReducedMotion()) return;
    el.classList.remove('is-shake');
    void el.offsetWidth; // force reflow so the animation can restart
    el.classList.add('is-shake');
  };

  const handleInput = (key: FieldKey, v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    setErrors((s) => (s[key] ? { ...s, [key]: '' } : s));
  };

  const validate = () => {
    const next = { ...EMPTY_ERRORS };
    let ok = true;
    (Object.keys(values) as FieldKey[]).forEach((key) => {
      const v = values[key].trim();
      if (!v) {
        next[key] = 'Required';
        ok = false;
        shake(key);
        return;
      }
      if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        next[key] = 'That address doesn’t look right';
        ok = false;
        shake(key);
      }
    });
    setErrors(next);
    return ok;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const hold = prefersReducedMotion() ? 0 : 520;
    veilRef.current?.to(1);
    window.setTimeout(() => {
      setSubmitted(true);
      veilRef.current?.resize();
      veilRef.current?.to(0);
    }, hold);
  };

  const handleReset = () => {
    const hold = prefersReducedMotion() ? 0 : 520;
    veilRef.current?.to(1);
    window.setTimeout(() => {
      setSubmitted(false);
      setValues(EMPTY_VALUES);
      setErrors(EMPTY_ERRORS);
      veilRef.current?.resize();
      veilRef.current?.to(0);
    }, hold);
  };

  return (
    <div ref={shellRef} data-dither-mask className="dither-host relative">
      {!submitted && (
        <form onSubmit={handleSubmit} noValidate className="grid">
          <Field
            fieldRef={(el) => {
              fieldRefs.current.name = el;
            }}
            label="Name"
            htmlFor="cf-name"
            error={errors.name}
            isFocus={focused === 'name'}
          >
            <input
              id="cf-name"
              name="name"
              type="text"
              placeholder="Who’s writing?"
              autoComplete="name"
              value={values.name}
              onChange={(e) => handleInput('name', e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused((f) => (f === 'name' ? null : f))}
              className="w-full border-0 bg-transparent p-0 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </Field>

          <Field
            fieldRef={(el) => {
              fieldRefs.current.email = el;
            }}
            label="Email"
            htmlFor="cf-email"
            error={errors.email}
            isFocus={focused === 'email'}
          >
            <input
              id="cf-email"
              name="email"
              type="email"
              placeholder="you@studio.com"
              autoComplete="email"
              value={values.email}
              onChange={(e) => handleInput('email', e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused((f) => (f === 'email' ? null : f))}
              className="w-full border-0 bg-transparent p-0 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </Field>

          <Field
            fieldRef={(el) => {
              fieldRefs.current.message = el;
            }}
            label="Project"
            htmlFor="cf-message"
            error={errors.message}
            isFocus={focused === 'message'}
          >
            <textarea
              id="cf-message"
              name="message"
              placeholder="A couple of lines about what you’re building."
              value={values.message}
              onChange={(e) => handleInput('message', e.target.value)}
              onFocus={() => setFocused('message')}
              onBlur={() => setFocused((f) => (f === 'message' ? null : f))}
              className="min-h-[68px] w-full resize-none border-0 bg-transparent p-0 font-mono text-[13px] leading-[1.55] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-line pt-4">
            <span className="text-[10px] tracking-wide text-ink-faint">
              Prototype — nothing is sent anywhere.
            </span>
            <DitherButton type="submit" className="px-5 py-3.5 text-[11px] tracking-[0.14em] uppercase">
              Send it
            </DitherButton>
          </div>
        </form>
      )}

      {submitted && (
        <div className="grid place-items-start gap-2.5 px-3.5 py-8">
          <h3
            className="font-display text-xl tracking-wide uppercase"
            style={{ fontVariationSettings: '"wdth" 108, "wght" 700' }}
          >
            Message away
          </h3>
          <p className="text-xs leading-relaxed text-ink-dim">
            The form dissolved through the dither, swapped underneath, and resolved back. Two
            passes of the same surface, one covering and one clearing.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 rounded-sm border border-line-lit px-4 py-2.5 font-mono text-[10px] tracking-wide text-ink uppercase hover:border-ink-faint"
          >
            Run it again
          </button>
        </div>
      )}
    </div>
  );
}
