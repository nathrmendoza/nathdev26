'use client';

/**
 * PageTransition.tsx
 *
 * Route changes dissolve the current page out to transparent, swap, then
 * dissolve the next one in -- ContactForm's mask treatment at page scale,
 * so the live background shows through mid-transition rather than a solid
 * block. Header, footer, and background sit outside this and stay put.
 *
 * The router hands _app the next page as soon as its data is ready; this
 * holds the outgoing page on screen until its exit has played, then swaps.
 * Because of that, links never need to know about the transition -- except
 * that they must navigate with `scroll: false` (see useInternalLinkClick).
 * Next's own scroll-to-top would otherwise jerk the outgoing page to the
 * top mid-dissolve, so scrolling happens here instead, at the swap: to the
 * top on a fresh navigation (or the #section, for a `/#id` link), back to
 * where you were on back/forward.
 *
 * Navigating again mid-exit doesn't queue anything: the swap just lands on
 * whichever route is newest. Navigating back to the page still on screen
 * cancels the exit outright.
 *
 * The mask covers only the viewport (frame: 'viewport'), so the cost is the
 * same on a page one screen tall or ten. First load is the SplashCurtain's
 * job; this only plays on client-side changes.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import { DitherSurface } from '@/lib/dither-surface';
import { getLenis } from '@/lib/lenis';

const OUT_MS = 250;
// Easing rates (see DitherSurface `speed`), picked so each phase is ~95%
// done at its target duration: ln(20) / seconds.
const OUT_SPEED = 12; // ~250ms
const IN_SPEED = 7.5; // ~400ms

interface Page {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
  key: string;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PageTransition({ Component, pageProps }: Pick<AppProps, 'Component' | 'pageProps'>) {
  const router = useRouter();
  // Hash-only changes stay on the same page -- no transition.
  const routeKey = router.asPath.split('#')[0];

  const [shown, setShown] = useState<Page>({ Component, pageProps, key: routeKey });
  const latest = useRef<Page>(shown);
  const hostRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<DitherSurface | null>(null);
  const exitTimer = useRef(0);
  const prevKey = useRef(shown.key);
  const isPop = useRef(false);
  const scrollPositions = useRef(new Map<string, number>());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const surface = new DitherSurface(host, {
      mode: 'dissolve',
      output: 'mask',
      frame: 'viewport',
      pixel: 4,
      speed: IN_SPEED,
    });
    surfaceRef.current = surface;

    // Scroll restoration is handled at the swap below; the browser's own
    // would jump the outgoing page the moment back/forward is pressed.
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.clearTimeout(exitTimer.current);
      window.removeEventListener('popstate', onPop);
      history.scrollRestoration = prevRestoration;
      surface.destroy();
      surfaceRef.current = null;
    };
  }, []);

  // Route changed: start the exit, or cancel it if we're back where we started.
  useEffect(() => {
    latest.current = { Component, pageProps, key: routeKey };
    const host = hostRef.current;
    const surface = surfaceRef.current;

    if (routeKey === shown.key) {
      if (exitTimer.current) {
        window.clearTimeout(exitTimer.current);
        exitTimer.current = 0;
        isPop.current = false;
        if (host) host.style.pointerEvents = '';
        surface?.set({ speed: IN_SPEED });
        surface?.to(0);
      }
      return;
    }

    // Already on the way out -- the swap reads `latest`, so just let it run.
    if (exitTimer.current) return;

    // The outgoing page is on its way out; don't let it take another click.
    if (host) host.style.pointerEvents = 'none';
    surface?.set({ speed: OUT_SPEED });
    surface?.to(1);
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = 0;
      // Saved here, before the swap -- once a shorter page is in, the browser
      // has already clamped scrollY to fit it.
      scrollPositions.current.set(prevKey.current, window.scrollY);
      setShown(latest.current);
    }, reducedMotion() ? 0 : OUT_MS);
  }, [routeKey, Component, pageProps, shown.key]);

  // Swapped: scroll while nothing is visible, then dissolve the new page in.
  useLayoutEffect(() => {
    if (shown.key === prevKey.current) return;
    prevKey.current = shown.key;

    const section = !isPop.current && window.location.hash
      ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      : null;
    const y = section
      ? section.getBoundingClientRect().top + window.scrollY
      : isPop.current
        ? (scrollPositions.current.get(shown.key) ?? 0)
        : 0;
    isPop.current = false;
    const lenis = getLenis();
    if (lenis) {
      lenis.resize(); // pick up the new page's height before scrolling into it
      lenis.scrollTo(y, { immediate: true, force: true });
    } else {
      window.scrollTo(0, y);
    }

    if (hostRef.current) hostRef.current.style.pointerEvents = '';
    surfaceRef.current?.set({ speed: IN_SPEED });
    surfaceRef.current?.to(0);
  }, [shown.key]);

  // Same route re-rendered (fresh props, or an exit just got cancelled):
  // render what the router has now rather than the held copy.
  const page = routeKey === shown.key ? { Component, pageProps, key: routeKey } : shown;

  return (
    <div ref={hostRef} className="relative z-1">
      <page.Component key={page.key} {...page.pageProps} />
    </div>
  );
}
