'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon } from '@/components/icons';
import { scrollToTop } from '@/lib/scroll-to';

export default function BackToTop() {
  // Hidden until half a screen down -- nothing to go back to above that.
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
      className={`fixed right-6 bottom-4 z-30 block h-8 w-8 cursor-pointer text-ink transition-all duration-400 ease-out hover:text-accent motion-reduce:translate-y-0 sm:right-12 sm:bottom-6 sm:h-4 sm:w-4 ${
        shown ? 'translate-y-0 opacity-100 hover:-translate-y-0.5' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUpIcon />
    </button>
  );
}
