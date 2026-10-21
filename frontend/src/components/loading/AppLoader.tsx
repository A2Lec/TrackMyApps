import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { SlowServerHint, SLOW_LOADING_DELAY_MS } from './SlowServerHint';
import { BrandLogo, BrandName } from '@/components/BrandLogo';

/**
 * Full-screen branded loader, shown while the first page of the app is downloading.
 * It carries its own slow-server hint, so it does not signal the top progress bar.
 */
export function AppLoader() {
  const isSlow = useDelayedFlag(true, SLOW_LOADING_DELAY_MS);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-background"
      aria-busy="true"
      aria-label="Chargement de TrackMyApps"
    >
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700 motion-reduce:animate-none">
        <BrandLogo title="" className="h-14 w-14" />
        <BrandName className="text-lg" />
      </div>
      <div className="h-5">{isSlow && <SlowServerHint />}</div>
    </div>
  );
}
