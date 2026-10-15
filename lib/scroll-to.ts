import { getLenis } from '@/lib/lenis';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function scrollTo(target: HTMLElement | number) {
  const lenis = getLenis();
  const immediate = reducedMotion();
  if (lenis) {
    lenis.scrollTo(target, { immediate });
    return;
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}

/** Scrolls to the element with this id. False if it isn't on this page. */
export function scrollToId(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  scrollTo(el);
  return true;
}

export function scrollToTop() {
  scrollTo(0);
}
