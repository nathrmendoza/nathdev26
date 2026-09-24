'use client';

/**
 * useDitherControlsUnlock.ts
 *
 * Gates <DitherControls> behind `?dithercontrols=1`, remembered in
 * localStorage after the first visit; `?dithercontrols=0` locks it back up.
 * Only decides whether to render -- pair with `next/dynamic({ ssr: false })`
 * so the code isn't shipped to visitors who never unlock it.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dither-controls-unlocked';
const QUERY_PARAM = 'dithercontrols';

/** Reads the URL flag, reconciles it into localStorage, and returns whether
 *  the panel should be unlocked. Browser-only -- never called during SSR. */
function syncAndRead(): boolean {
  const flag = new URLSearchParams(window.location.search).get(QUERY_PARAM);

  if (flag === '1') {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage unavailable -- the unlock just won't persist this session.
    }
    return true;
  }

  if (flag === '0') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useDitherControlsUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconciles the SSR-false default with the real client value, once
    setUnlocked(syncAndRead());
  }, []);

  return unlocked;
}
