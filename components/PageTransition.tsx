'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import { DitherSurface } from '@/lib/dither-surface';
import { getLenis } from '@/lib/lenis';

const OUT_MS = 250;
// Easing rates: ln(20) / seconds, so each phase is ~95% done on time.
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

    // Scroll is restored at the swap; the browser's own would jump the outgoing page.
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

    if (host) host.style.pointerEvents = 'none';
    surface?.set({ speed: OUT_SPEED });
    surface?.to(1);
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = 0;
      // Saved before the swap -- a shorter incoming page would clamp scrollY.
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

  // Same route (fresh props, or a cancelled exit): render the router's current page.
  const page = routeKey === shown.key ? { Component, pageProps, key: routeKey } : shown;

  return (
    <div ref={hostRef} className="relative z-1">
      <page.Component key={page.key} {...page.pageProps} />
    </div>
  );
}
