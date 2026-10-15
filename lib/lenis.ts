/**
 * lenis.ts
 *
 * Shared handle on the page's Lenis instance. DitherBackground owns it
 * (creates, drives, destroys); anything else that needs to scroll the page
 * programmatically goes through this instead of window.scrollTo, so it
 * doesn't fight Lenis's own smoothing loop.
 */

import type Lenis from 'lenis';

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis() {
  return instance;
}
