'use client';

/**
 * BackToTop.tsx
 *
 * The back-to-top arrow, pinned to the viewport's bottom-right instead of
 * living in the footer row -- same spot and padding the footer gives it,
 * so at the very bottom of the page it lines up where it used to sit.
 * Mounted once in _app.tsx.
 *
 * Hidden until you've scrolled half a screen down (there's nothing to go
 * back up to before that), then fades/slides in with the footer icons'
 * entrance motion.
 */

import { useEffect, useState } from 'react';
import { ArrowUpIcon } from '@/components/icons';
import { scrollToTop } from '@/lib/scroll-to';

export default function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setShown(window.scrollY > window.innerHeight * 0.5);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      inert={!shown}
      data-dither-mask
      className={`fixed right-6 bottom-6 z-30 block h-4 w-4 cursor-pointer text-ink transition-all duration-400 ease-out hover:text-accent motion-reduce:translate-y-0 sm:right-12 ${
        shown ? 'translate-y-0 opacity-100 hover:-translate-y-0.5' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUpIcon />
    </button>
  );
}
