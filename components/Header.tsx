'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useInternalLinkClick } from '@/lib/useInternalLinkClick';
import MobileNav from '@/components/MobileNav';
import { scrollToTop } from '@/lib/scroll-to';

const GLYPHS = '#%&$@*+=~/\\|<>[]{}';
const LOGO = ['N', 'D', 'E', 'V'];

export interface NavItem {
  label: string;
  href: string;
}

// Section links on `/`. The Works and Contact pages are hidden (404) for now.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Background', href: '/#background' },
  { label: 'The Stack', href: '/#stack' },
  { label: 'Contact', href: '/#contact' },
];

const SPLASH_CLEAR = 1600;
const LOGO_STAGGER = 70;
const HOP_STAGGER = 60;
const LOGO_SETTLE = SPLASH_CLEAR + LOGO.length * LOGO_STAGGER + 300;
const NAV_START = LOGO_SETTLE + 150;

const GROW_MS = 50;
const RESOLVE_MS = 50;
const FLICKER_MS = 50;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Sweep order across every label, as one continuous string. */
function buildSweepOrder(items: NavItem[]) {
  const order: { itemIndex: number; charIndex: number }[] = [];
  items.forEach((item, itemIndex) => {
    for (let charIndex = 0; charIndex < item.label.length; charIndex++) order.push({ itemIndex, charIndex });
  });
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
      className={`font-mono text-[16px] tracking-[0.14em] uppercase no-underline transition-colors ${
        active ? 'text-accent' : 'text-ink'
      }`}
    >
      <span ref={containerRef} aria-hidden="true" />
    </a>
  );
}

function NavGroup({ items, start, pathname }: { items: NavItem[]; start: boolean; pathname: string }) {
  const anchors = useRef<(NavAnchorHandle | null)[]>(items.map(() => null));

  useEffect(() => {
    if (!start) return;
    const order = buildSweepOrder(items);

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
  }, [start, items]);

  return (
    <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex sm:gap-12">
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
  // Bumped per hover; keys the letters' inner spans so the animation replays.
  const [hopWave, setHopWave] = useState(0);
  const hopping = useRef(false);

  const startHop = () => {
    if (!logoOn || hopping.current || reducedMotion()) return;
    hopping.current = true;
    setHopWave((n) => n + 1);
  };

  useEffect(() => {
    const reduced = reducedMotion();
    const timers = [
      window.setTimeout(() => setLogoOn(true), reduced ? 0 : SPLASH_CLEAR),
      window.setTimeout(() => setNavOn(true), reduced ? 0 : NAV_START),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    // Published for full-viewport sections (Hero).
    const el = headerRef.current;
    if (!el) return;
    // Unrounded, so 100vh-minus-header layouts don't overflow by a sub-pixel.
    const publish = () =>
      document.documentElement.style.setProperty('--header-h', `${el.getBoundingClientRect().height}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Compared against the last toggle point, not the previous frame --
    // trackpad and Lenis jitter would make it flicker.
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
      className={`sticky top-0 z-20 flex items-center justify-between gap-8 px-6 py-5 transition-transform duration-300 ease-out sm:px-12 sm:py-8 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <Link
        href="/"
        scroll={false}
        // Already home: the logo is a back-to-top instead of a no-op navigation.
        onClick={(e) => {
          if (pathname !== '/' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          scrollToTop();
        }}
        onPointerEnter={startHop}
        onFocus={startHop}
        className="block shrink-0 no-underline"
        aria-label="NDEV — home"
      >
        <span className="flex font-display text-h2 font-extrabold tracking-tight text-ink uppercase">
          {LOGO.map((ch, i) => (
            <span
              key={i}
              className={`inline-block transition-all duration-500 ease-out ${
                logoOn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${i * LOGO_STAGGER}ms` }}
            >
              {/* Inner span carries the hop, so it never fights the entrance transition. */}
              <span
                key={hopWave}
                className={`inline-block ${hopWave ? 'animate-hop' : ''}`}
                style={hopWave ? { animationDelay: `${i * HOP_STAGGER}ms` } : undefined}
                onAnimationEnd={
                  i === LOGO.length - 1
                    ? () => {
                        hopping.current = false;
                      }
                    : undefined
                }
              >
                {ch}
              </span>
            </span>
          ))}
        </span>
      </Link>

      <NavGroup items={NAV_ITEMS} start={navOn} pathname={pathname} />

      <MobileNav items={NAV_ITEMS} pathname={pathname} revealed={navOn} hidden={!visible} />
    </header>
  );
}
