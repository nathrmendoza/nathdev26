'use client';

/**
 * CallToAction.tsx
 *
 * Closing pitch for the homepage: one viewport, no scrolling required
 * within the section itself. Copy and both buttons are written to work
 * whichever way someone's leaning -- browsing the work first, or just
 * getting in touch -- rather than assuming one path.
 */

import DitherLinkButton from '@/components/DitherLinkButton';

export default function CallToAction() {
  return (
    <section className="flex flex-col items-center justify-between px-6 py-32 text-center sm:px-12 sm:py-40">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h2 className="mb-4">Ready when you are.</h2>
        <p className="mx-auto mb-10 max-w-xl text-ink-dim">
          Take a look at examples of my work, or skip straight to saying hello -- either way works.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <DitherLinkButton href="/works" className="px-8 py-4">
            View the Work
          </DitherLinkButton>
          <DitherLinkButton href="/contact" className="px-8 py-4">
            Get in Touch
          </DitherLinkButton>
        </div>
      </div>
    </section>
  );
}
