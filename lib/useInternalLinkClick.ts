import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';
import { scrollToId } from '@/lib/scroll-to';

/** Client-side routing for plain left-clicks on `/` hrefs; a `/#id` link on
 *  its own page just smooth-scrolls. Always `scroll: false` -- PageTransition
 *  owns scrolling. */
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
