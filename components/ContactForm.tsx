'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { DitherSurface } from '@/lib/dither-surface';
import DitherButton from './DitherButton';
import {
  HONEYPOT_FIELD,
  contactSchema,
  fieldErrors,
  type ContactField,
  type ContactInput,
} from '@/lib/contact-schema';
import type { ContactResponse } from '@/pages/api/contact';

type FieldKey = ContactField;

const EMPTY_VALUES: ContactInput = { name: '', email: '', phone: '', subject: '', message: '' };
const EMPTY_ERRORS: Record<FieldKey, string> = { name: '', email: '', phone: '', subject: '', message: '' };

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
    phone: null,
    subject: null,
    message: null,
  });

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    const host = shellRef.current;
    if (!host) return;
    const veil = new DitherSurface(host, {
      mode: 'dissolve',
      output: 'mask',
      fill: 1,
      speed: 7,
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

  const showErrors = (next: Record<FieldKey, string>) => {
    setErrors(next);
    (Object.keys(next) as FieldKey[]).forEach((key) => next[key] && shake(key));
  };

  const validate = () => {
    const result = contactSchema.safeParse(values);
    showErrors(result.success ? EMPTY_ERRORS : fieldErrors(result.error));
    return result.success;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !validate()) return;

    setSending(true);
    setSendError('');
    let data: ContactResponse;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, [HONEYPOT_FIELD]: honeypot }),
      });
      data = await res.json();
    } catch {
      data = { ok: false, error: 'Couldn’t reach the server — check your connection and try again.' };
    }
    setSending(false);

    if (!data.ok) {
      setSendError(data.error);
      if (data.fieldErrors) showErrors(data.fieldErrors);
      return;
    }

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
      setSendError('');
      veilRef.current?.resize();
      veilRef.current?.to(0);
    }, hold);
  };

  return (
    <div ref={shellRef} data-dither-mask className="dither-host relative">
      {!submitted && (
        <form onSubmit={handleSubmit} noValidate className="grid">
          {/* Honeypot: hidden from people, so only bots fill it. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="cf-website">Website</label>
            <input
              id="cf-website"
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

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
              fieldRefs.current.phone = el;
            }}
            label="Phone (optional)"
            htmlFor="cf-phone"
            error={errors.phone}
            isFocus={focused === 'phone'}
          >
            <input
              id="cf-phone"
              name="phone"
              type="tel"
              placeholder="021 234 5678"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => handleInput('phone', e.target.value)}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused((f) => (f === 'phone' ? null : f))}
              className="w-full border-0 bg-transparent p-0 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </Field>

          <Field
            fieldRef={(el) => {
              fieldRefs.current.subject = el;
            }}
            label="Subject"
            htmlFor="cf-subject"
            error={errors.subject}
            isFocus={focused === 'subject'}
          >
            <input
              id="cf-subject"
              name="subject"
              type="text"
              placeholder="What's this about?"
              value={values.subject}
              onChange={(e) => handleInput('subject', e.target.value)}
              onFocus={() => setFocused('subject')}
              onBlur={() => setFocused((f) => (f === 'subject' ? null : f))}
              className="w-full border-0 bg-transparent p-0 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </Field>

          <Field
            fieldRef={(el) => {
              fieldRefs.current.message = el;
            }}
            label="Message"
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

          <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 border-t border-line pt-4">
            {sendError ? (
              <span role="alert" className="text-[10px] tracking-wide text-warn">
                {sendError}
              </span>
            ) : (
              <span className="text-[10px] tracking-wide text-ink-faint">Goes straight to my inbox.</span>
            )}
            <DitherButton
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className="px-5 py-3.5 text-[11px] tracking-[0.14em] uppercase disabled:cursor-wait disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send it'}
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
            MESSAGE SENT
          </h3>
          <p className="text-xs leading-relaxed text-ink-dim">
            Thanks{values.name.trim() ? `, ${values.name.trim().split(/\s+/)[0]}` : ''} — it’s in my
            inbox. I’ll get back to you soon.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 rounded-sm border border-line-lit px-4 py-2.5 font-mono text-[10px] tracking-wide text-ink uppercase hover:border-ink-faint"
          >
            Send another
          </button>
        </div>
      )}
    </div>
  );
}
