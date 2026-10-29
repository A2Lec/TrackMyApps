import type { ReactNode } from 'react';
import { useEmailVerified } from '@/hooks/useEmailVerified';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface EmailVerifiedGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that wraps an action button and disables it if email is not verified
 * Shows a tooltip explaining why the action is disabled
 */
export function EmailVerifiedGuard({ children, fallback }: EmailVerifiedGuardProps) {
  const isEmailVerified = useEmailVerified();

  if (isEmailVerified) {
    return <>{children}</>;
  }

  // If fallback provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Otherwise, wrap children in a disabled state with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex cursor-not-allowed opacity-60">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Veuillez vérifier votre adresse email pour effectuer cette action.
              Consultez votre boîte de réception.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
