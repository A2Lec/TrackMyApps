import { useEffect, useState } from 'react';

/** True once `active` has stayed true for `delayMs`; resets as soon as it turns false. */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [flag, setFlag] = useState(false);

  // Reset during render rather than in an effect, so a stale `true` is never painted
  if (!active && flag) {
    setFlag(false);
  }

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => setFlag(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);

  return flag;
}
