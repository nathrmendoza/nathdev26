import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';
import { scrollToId } from '@/lib/scroll-to';

/** Intercepts a plain left-click on an internal (`/`-prefixed) href to route
 *  client-side instead of a full reload -- cmd/ctrl/middle-click and
 *  target="_blank" still fall through to native browser handling.
 *
 *  A section link (`/#id`) whose page is already on screen just smooth-
 *  scrolls to the section; from any other page it navigates, and
 *  PageTransition lands on the section at the swap.
 *
 *  Every client-side navigation passes `scroll: false` (`scroll={false}` on
 *  next/link): PageTransition scrolls at the swap instead, once the
 *  outgoing page has dissolved. */
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
      const [path, hash] = href.split('#');
      if (hash && path === router.pathname && scrollToId(hash)) return;
      router.push(href, undefined, { scroll: false });
    }
  };
}
