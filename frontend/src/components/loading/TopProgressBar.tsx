import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { useRouteLoadingStore } from './routeLoadingStore';
import { SlowServerHint, SLOW_LOADING_DELAY_MS } from './SlowServerHint';

const SHOW_DELAY_MS = 150; // fast loads never flash the bar
const FINISH_MS = 300;

/**
 * Thin progress bar at the top of the screen while a page chunk or its first data is loading.
 * Background refetches of already displayed data are ignored so polling never makes it flicker.
 */
export function TopProgressBar() {
  const initialFetches = useIsFetching({ predicate: (query) => query.state.status === 'pending' });
  const pendingRoutes = useRouteLoadingStore((s) => s.pending);
  const loading = initialFetches > 0 || pendingRoutes > 0;

  const visible = useDelayedFlag(loading, SHOW_DELAY_MS);
  const isSlow = useDelayedFlag(loading, SLOW_LOADING_DELAY_MS);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'finishing'>('idle');

  useEffect(() => {
    if (visible) {
      setPhase('loading');
      return;
    }
    if (phase === 'loading') {
      setPhase('finishing');
      const id = window.setTimeout(() => setPhase('idle'), FINISH_MS);
      return () => window.clearTimeout(id);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {phase !== 'idle' && (
        <div
          className="fixed inset-x-0 top-0 z-[100] h-0.5 pointer-events-none"
          role="progressbar"
          aria-label="Chargement en cours"
          aria-busy={phase === 'loading'}
        >
          <div
            className={
              phase === 'loading'
                ? 'h-full origin-left bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-progress-grow motion-reduce:animate-none motion-reduce:scale-x-50'
                : 'h-full origin-left bg-primary scale-x-100 opacity-0 transition-[transform,opacity] duration-300 ease-out'
            }
          />
        </div>
      )}
      {isSlow && (
        <div className="fixed inset-x-0 top-[4.5rem] z-[100] mx-auto w-fit max-w-[calc(100vw-2rem)] rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur-md pointer-events-none">
          <SlowServerHint />
        </div>
      )}
    </>
  );
}
