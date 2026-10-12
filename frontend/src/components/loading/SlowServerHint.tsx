import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SLOW_LOADING_DELAY_MS = 3000;

/** Explains a long wait (serverless + database cold start) instead of letting it look like a bug */
export function SlowServerHint({ className }: { className?: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'text-center text-xs text-muted-foreground animate-in fade-in-50 duration-500',
        className
      )}
    >
      {/* Inline icon so it stays next to the text when the message wraps */}
      <Coffee className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5 align-middle" aria-hidden="true" />
      Démarrage du serveur, la première connexion peut prendre quelques secondes…
    </p>
  );
}
