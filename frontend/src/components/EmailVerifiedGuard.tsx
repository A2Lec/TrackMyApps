import { useAuthStore } from '@/store/authStore';
import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface EmailVerifiedGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Hook to check if the current user has verified their email
 */
export function useEmailVerified() {
  const { user } = useAuthStore();
  return user?.emailVerified ?? false;
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
              Veuillez verifier votre adresse email pour effectuer cette action. 
              Consultez votre boite de reception.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
