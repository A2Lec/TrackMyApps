import { useState } from 'react';
import { X, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Don't show if no user, email is verified, or banner is dismissed
  if (!user || user?.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);

    try {
      await authService.resendVerification();
      toast.success('Email de vérification envoyé ! Pensez à vérifier vos spams.', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs sm:text-sm py-2.5 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="leading-snug">
            <span className="font-semibold">Vérification requise :</span> un email a été envoyé à{' '}
            <span className="font-medium underline underline-offset-2">{user.email}</span>.
            <span className="hidden md:inline text-muted-foreground ml-1">
              Vérifiez vos spams si besoin.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
            className="h-7 text-xs px-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-900 dark:text-amber-200 transition-colors font-medium"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Envoi...
              </>
            ) : (
              'Renvoyer le lien'
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 text-amber-700/70 hover:text-amber-900 dark:text-amber-300/70 dark:hover:text-amber-100 hover:bg-amber-500/10"
            aria-label="Fermer la bannière"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
