'use client';

/**
 * Header.tsx
 *
 * Centred wordmark with nav clustered on either side of it, rather than the
 * standard logo-left/links-right split. Mounted once in _app.tsx, outside
 * the per-route fade-in wrapper, so it stays put across navigation.
 *
 * Plays a one-time entrance on mount: the logo slides up letter by letter,
 * then each nav group reveals as if its two labels were one continuous
 * string -- first every position pops in showing glitch noise (sweeping
 * from the end of the string nearest the logo outward), then a second
 * sweep in the same order resolves each position to its real character.
 * The right group sweeps the mirror direction of the left. Doesn't replay
 * on client-side route changes since this component doesn't remount for
 * those.
 *
 * Sticky, but not simply always-on-screen: while scrollY is still within
 * the header's own height it sits in normal flow. Past that, it stays
 * pinned to the top but slides out of view on scroll-down and back into
 * view on scroll-up -- so it reappears the moment you start scrolling back,
 * without waiting for a scroll back to the top.
 */

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useInternalLinkClick } from '@/lib/useInternalLinkClick';
import MobileNavDial from '@/components/MobileNavDial';

const GLYPHS = '#%&$@*+=~/\\|<>[]{}';
const LOGO = ['N', 'D', 'E', 'V'];

interface NavItem {
  label: string;
  href: string;
}

const LEFT_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Works', href: '/works' },
];
const RIGHT_NAV: NavItem[] = [
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

const SPLASH_CLEAR = 1600;
const LOGO_STAGGER = 70;
const LOGO_SETTLE = SPLASH_CLEAR + LOGO.length * LOGO_STAGGER + 300;
const NAV_START = LOGO_SETTLE + 150;

const GROW_MS = 50;
const RESOLVE_MS = 50;
const FLICKER_MS = 50;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Sweep order across a group's items, treating them as one continuous
 *  string. `reverse` sweeps from the last item's last character back to the
 *  first item's first character (for the group nearest the logo on the
 *  left); forward does the mirror, first character to last (right group). */
function buildSweepOrder(items: NavItem[], reverse: boolean) {
  const order: { itemIndex: number; charIndex: number }[] = [];
  const itemIndices = reverse ? [...items.keys()].reverse() : [...items.keys()];
  for (const itemIndex of itemIndices) {
    const len = items[itemIndex].label.length;
    const charIndices = reverse
      ? Array.from({ length: len }, (_, i) => len - 1 - i)
      : Array.from({ length: len }, (_, i) => i);
    for (const charIndex of charIndices) order.push({ itemIndex, charIndex });
  }
  return order;
}

type CharState = 'empty' | 'glitching' | 'resolved';

interface NavAnchorHandle {
  setCharState: (charIndex: number, state: CharState) => void;
}

function NavAnchor({
  item,
  active,
  ref,
}: {
  item: NavItem;
  active: boolean;
  ref?: Ref<NavAnchorHandle>;
}) {
  const internalClick = useInternalLinkClick(item.href);
  const containerRef = useRef<HTMLSpanElement>(null);
  const spans = useRef<HTMLElement[]>([]);
  const flickerIds = useRef<(number | null)[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.textContent = '';
    spans.current = item.label.split('').map((ch) => {
      const span = document.createElement('i');
      span.style.fontStyle = 'normal';
      span.style.opacity = '0';
      span.setAttribute('data-off', '');
      span.textContent = ch; // reserves the character's width from the start
      el.appendChild(span);
      return span;
    });
    flickerIds.current = item.label.split('').map(() => null);
  }, [item.label]);

  const setCharState = useCallback(
    (charIndex: number, state: CharState) => {
      const span = spans.current[charIndex];
      if (!span) return;
      const ch = item.label[charIndex];

      const flickerId = flickerIds.current[charIndex];
      if (flickerId) {
        window.clearInterval(flickerId);
        flickerIds.current[charIndex] = null;
      }

      if (state === 'empty') {
        span.style.opacity = '0';
        span.setAttribute('data-off', '');
        span.textContent = ch;
      } else if (state === 'glitching') {
        span.style.opacity = '1';
        span.setAttribute('data-off', '');
        if (ch !== ' ') {
          flickerIds.current[charIndex] = window.setInterval(() => {
            span.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }, FLICKER_MS);
        }
      } else {
        span.style.opacity = '1';
        span.textContent = ch;
        span.removeAttribute('data-off');
      }
    },
    [item.label]
  );

  useImperativeHandle(ref, () => ({ setCharState }), [setCharState]);

  // Quick synchronised glitch-flash on hover, once the entrance has settled.
  const hoverKick = () => {
    if (reducedMotion()) return;
    spans.current.forEach((span, i) => {
      const ch = item.label[i];
      if (ch === ' ') return;
      window.setTimeout(() => (span.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]), 0);
      window.setTimeout(() => (span.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]), 40);
      window.setTimeout(() => (span.textContent = ch), 80);
    });
  };

  return (
    <a
      href={item.href}
      onClick={internalClick}
      onPointerEnter={hoverKick}
      data-dither-mask
      aria-label={item.label}
      className={`font-mono text-[13px] tracking-[0.14em] uppercase no-underline transition-colors ${
        active ? 'text-accent' : 'text-ink'
      }`}
    >
      <span ref={containerRef} aria-hidden="true" />
    </a>
  );
}

function NavGroup({
  items,
  reverse,
  start,
  pathname,
  ariaLabel,
}: {
  items: NavItem[];
  reverse: boolean;
  start: boolean;
  pathname: string;
  ariaLabel: string;
}) {
  const anchors = useRef<(NavAnchorHandle | null)[]>(items.map(() => null));

  useEffect(() => {
    if (!start) return;
    const order = buildSweepOrder(items, reverse);

    if (reducedMotion()) {
      order.forEach(({ itemIndex, charIndex }) => anchors.current[itemIndex]?.setCharState(charIndex, 'resolved'));
      return;
    }

    const timers: number[] = [];
    order.forEach(({ itemIndex, charIndex }, i) => {
      timers.push(
        window.setTimeout(() => anchors.current[itemIndex]?.setCharState(charIndex, 'glitching'), i * GROW_MS)
      );
    });
    const growDuration = order.length * GROW_MS;
    order.forEach(({ itemIndex, charIndex }, i) => {
      timers.push(
        window.setTimeout(
          () => anchors.current[itemIndex]?.setCharState(charIndex, 'resolved'),
          growDuration + i * RESOLVE_MS
        )
      );
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [start, items, reverse]);

  return (
    <nav aria-label={ariaLabel} className="hidden items-center gap-8 sm:flex sm:gap-12">
      {items.map((item, i) => (
        <NavAnchor
          key={item.href}
          item={item}
          active={pathname === item.href}
          ref={(el) => {
            anchors.current[i] = el;
          }}
        />
      ))}
    </nav>
  );
}

export default function Header() {
  const { pathname } = useRouter();
  const [logoOn, setLogoOn] = useState(false);
  const [navOn, setNavOn] = useState(false);
  const [visible, setVisible] = useState(true);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = reducedMotion();
    const timers = [
      window.setTimeout(() => setLogoOn(true), reduced ? 0 : SPLASH_CLEAR),
      window.setTimeout(() => setNavOn(true), reduced ? 0 : NAV_START),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    // Published so full-viewport sections (Hero) can size themselves to
    // exactly the space left below the header instead of guessing its
    // height, which shifts with the responsive padding and fluid type scale.
    const el = headerRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Anchor is the scroll position where visibility was last decided, not
    // just the previous frame -- comparing frame-to-frame is way too
    // sensitive to trackpad jitter and Lenis's own eased momentum, so it'd
    // flicker on the tiniest wobble. A real toggle needs TOGGLE_PX of
    // sustained movement past the anchor before it fires.
    const TOGGLE_PX = 24;
    let anchorY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;

      if (y <= headerHeight) {
        setVisible(true);
        anchorY = y;
        return;
      }

      const delta = y - anchorY;
      if (delta > TOGGLE_PX) {
        setVisible(false);
        anchorY = y;
      } else if (delta < -TOGGLE_PX) {
        setVisible(true);
        anchorY = y;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-dither-mask
      className={`sticky top-0 z-20 flex flex-wrap items-center justify-center gap-8 px-6 py-5 transition-transform duration-300 ease-out sm:gap-12 sm:py-8 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <NavGroup items={LEFT_NAV} reverse start={navOn} pathname={pathname} ariaLabel="Primary" />

      <Link href="/" className="block shrink-0 no-underline" aria-label="NDEV -- home">
        <span className="flex font-display text-h2 font-extrabold tracking-tight text-ink uppercase">
          {LOGO.map((ch, i) => (
            <span
              key={i}
              className={`inline-block transition-all duration-500 ease-out ${
                logoOn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${i * LOGO_STAGGER}ms` }}
            >
              {ch}
            </span>
          ))}
        </span>
      </Link>

      <NavGroup items={RIGHT_NAV} reverse={false} start={navOn} pathname={pathname} ariaLabel="Secondary" />

      <MobileNavDial />
    </header>
  );
}
