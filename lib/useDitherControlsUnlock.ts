'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dither-controls-unlocked';
const QUERY_PARAM = 'dithercontrols';

/** Reconciles the URL flag into localStorage. Browser-only. */
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
