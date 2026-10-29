import { useEffect, useState } from 'react';
import { X, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

export function EmailVerificationBanner() {
  const { user, updateUser } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const needsCheck = !!user && !user.emailVerified;

  // The persisted user can be stale (e.g. emailVerified lost after a profile update):
  // confirm the real status with the server before asking for verification.
  useEffect(() => {
    if (!needsCheck) return;
    authService
      .getProfile()
      .then((profile) => {
        if (profile.emailVerified) updateUser({ emailVerified: true });
      })
      .catch(() => {});
  }, [needsCheck, updateUser]);

  // Don't show if no user, email is verified, or banner is dismissed
  if (!user || user?.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);

    try {
      const result = await authService.resendVerification();
      if (result?.alreadyVerified) {
        updateUser({ emailVerified: true });
        toast.success('Votre email est déjà vérifié.');
        return;
      }
      toast.success('Email de vérification envoyé ! Pensez à vérifier vos spams.', {
        icon: <CheckCircle2 className="h-4 w-4 text-success" />
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Erreur lors de l'envoi de l'email"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-warning-soft border-b border-warning/40 text-warning-strong text-xs sm:text-sm py-2.5 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-warning-soft flex items-center justify-center flex-shrink-0">
            <Mail className="h-3.5 w-3.5 text-warning-strong " />
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
            className="h-7 text-xs px-2.5 bg-warning-soft hover:bg-warning-soft border-warning/40 text-warning-strong transition-colors font-medium"
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
            className="h-7 w-7 text-warning-strong hover:text-warning-strong hover:bg-warning-soft"
            aria-label="Fermer la bannière"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
