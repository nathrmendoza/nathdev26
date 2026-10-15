'use client';

/**
 * MobileNav.tsx
 *
 * Below `sm`, the header's nav collapses into a round burger button. Tapping
 * it folds the three lines into an X (top and bottom rotate in to meet at
 * the centre, the middle one collapses away) and pops a dropdown in below,
 * styled to match the CommandPalette's terminal panel -- same hairline
 * border, rounded corners and blurred backdrop.
 *
 * Closes on link tap, Escape, a tap anywhere outside, or when the header
 * slides out of view on scroll (it'd otherwise be left floating without
 * its button).
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { NavItem } from '@/components/Header';
import { useInternalLinkClick } from '@/lib/useInternalLinkClick';

const ITEM_STAGGER_MS = 40;

function MobileNavLink({
  item,
  index,
  active,
  open,
  onNavigate,
}: {
  item: NavItem;
  index: number;
  active: boolean;
  open: boolean;
  onNavigate: () => void;
}) {
  const internalClick = useInternalLinkClick(item.href);

  return (
    <a
      href={item.href}
      onClick={(e) => {
        onNavigate();
        internalClick(e);
      }}
      aria-current={active ? 'page' : undefined}
      className={`flex items-baseline justify-between gap-6 border-t border-line px-4 py-3.5 font-mono text-[16px] tracking-[0.14em] uppercase no-underline transition-all duration-300 ease-out first:border-t-0 motion-reduce:translate-y-0 ${
        active ? 'text-accent' : 'text-ink'
      } ${open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
      style={{ transitionDelay: open ? `${(index + 1) * ITEM_STAGGER_MS}ms` : '0ms' }}
    >
      {item.label}
      <span className="text-[13px] tracking-normal text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
    </a>
  );
}

export default function MobileNav({
  items,
  pathname,
  revealed,
  hidden,
}: {
  items: NavItem[];
  pathname: string;
  /** Header's entrance has reached the nav -- fades the button in. */
  revealed: boolean;
  /** Header has slid out of view -- forces the dropdown closed. */
  hidden: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Adjusting state during render, not in an effect, when the header hides
  // -- React's recommended pattern for resetting state off a prop change.
  if (hidden && open) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        data-dither-mask
        className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border bg-black/10 backdrop-blur-xl transition-all duration-500 ease-out ${
          open ? 'border-accent text-accent' : 'border-line-lit text-ink'
        } ${revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        {/* px, not rem: the root font-size is fluid, and these offsets have to
            land the outer lines exactly on the middle one to form the X. */}
        <span aria-hidden="true" className="relative block h-[12px] w-[18px]">
          <span
            className={`absolute top-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ease-out ${
              open ? 'translate-y-[5.25px] rotate-45' : ''
            }`}
          />
          <span
            className={`absolute top-[5.25px] left-0 h-[1.5px] w-full bg-current transition-all duration-200 ease-out ${
              open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ease-out ${
              open ? '-translate-y-[5.25px] -rotate-45' : ''
            }`}
          />
        </span>
      </button>

      <nav
        id={panelId}
        aria-label="Primary"
        inert={!open}
        data-dither-mask
        className={`absolute top-full right-0 mt-3 flex w-[240px] origin-top-right flex-col overflow-hidden rounded-sm border border-line-lit bg-black/10 backdrop-blur-xl transition-all duration-200 ease-out ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {items.map((item, i) => (
          <MobileNavLink
            key={item.href}
            item={item}
            index={i}
            active={pathname === item.href}
            open={open}
            onNavigate={() => setOpen(false)}
          />
        ))}
      </nav>
    </div>
  );
}
