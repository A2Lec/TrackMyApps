import { useLocation } from 'react-router';
import { DashboardSkeleton } from './DashboardSkeleton';
import { PageSkeleton } from './PageSkeleton';
import { RouteLoadingSignal } from './RouteLoadingSignal';

/** Suspense fallback inside the app layout: a skeleton shaped like the page being opened */
export function RouteFallback() {
  const { pathname } = useLocation();

  return (
    <>
      <RouteLoadingSignal />
      {pathname === '/' ? <DashboardSkeleton /> : <PageSkeleton />}
    </>
  );
}
