'use client';

import ContactForm from '@/components/ContactForm';
import ScrambleLink from '@/components/ScrambleLink';

const EMAIL = 'nathmendoza.dev@gmail.com';
const PHONE_DISPLAY = '022 106 4237';
const PHONE_HREF = '0221064237';

export default function ContactSection() {
  return (
    <section id="contact" className="px-6 py-32 sm:px-12 sm:py-40">
      <div className="mx-auto grid w-full max-w-4xl gap-16 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <h2 className="mb-4">Get in Touch</h2>
          <p className="mb-8 max-w-md text-ink-dim">
            Got a project in mind, or just want to have a chat? Fill in the details below and I&rsquo;ll get back to you.
          </p>
          <ContactForm />
        </div>

        <div className="flex flex-col justify-center gap-10">
          <div>
            <p className="text-h4 font-bold text-ink">Nathan Mendoza</p>
            <p className="text-ink-dim">Christchurch, New Zealand</p>
          </div>

          <div className="flex flex-col gap-3 font-mono">
            <div className="flex items-baseline gap-3">
              <span className="text-ink-faint">E.</span>
              <ScrambleLink text={EMAIL} href={`mailto:${EMAIL}`} className="text-ink" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-ink-faint">P.</span>
              <ScrambleLink text={PHONE_DISPLAY} href={`tel:${PHONE_HREF}`} className="text-ink" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
