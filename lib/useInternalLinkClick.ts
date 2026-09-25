import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';

/** Intercepts a plain left-click on an internal (`/`-prefixed) href to route
 *  client-side instead of a full reload -- cmd/ctrl/middle-click and
 *  target="_blank" still fall through to native browser handling. */
export function useInternalLinkClick(href?: string, target?: string) {
  const router = useRouter();
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      href?.startsWith('/') &&
      target !== '_blank' &&
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault();
      router.push(href);
    }
  };
}
