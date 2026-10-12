import { Briefcase } from 'lucide-react';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { SlowServerHint, SLOW_LOADING_DELAY_MS } from './SlowServerHint';

/**
 * Full-screen branded loader, shown while the first page of the app is downloading.
 * It carries its own slow-server hint, so it does not signal the top progress bar.
 */
export function AppLoader() {
  const isSlow = useDelayedFlag(true, SLOW_LOADING_DELAY_MS);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-gradient-to-br from-slate-50 via-background to-blue-50/40 dark:from-neutral-950 dark:via-background dark:to-blue-950/20"
      aria-busy="true"
      aria-label="Chargement de TrackMyApps"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse motion-reduce:animate-none" />
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-loader-float motion-reduce:animate-none">
          <Briefcase className="h-7 w-7 text-white" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="text-lg font-bold tracking-tight">TrackMyApps</span>
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce motion-reduce:animate-none"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="h-5">{isSlow && <SlowServerHint />}</div>
    </div>
  );
}
