import { useEffect } from 'react';
import { useRouteLoadingStore } from './routeLoadingStore';

/** Render inside a Suspense fallback: flags a page chunk download while mounted */
export function RouteLoadingSignal() {
  useEffect(() => {
    const { start, end } = useRouteLoadingStore.getState();
    start();
    return end;
  }, []);
  return null;
}
