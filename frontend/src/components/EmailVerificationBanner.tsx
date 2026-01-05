import { useState } from 'react';
import { Mail, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Don't show if email is verified or banner is dismissed
  if (user?.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      await authService.resendVerification();
      setMessage({
        type: 'success',
        text: 'Email de vérification renvoyé ! Vérifiez votre boîte de réception.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="px-4 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                Vérification de votre adresse email requise
              </h3>
              <p className="text-sm text-yellow-800 leading-relaxed mb-2">
                Un email de vérification a été envoyé à <span className="font-medium">{user?.email}</span>. 
                Veuillez consulter votre boîte de réception et cliquer sur le lien de confirmation pour activer toutes les fonctionnalités de votre compte.
                Si vous ne trouvez pas l'email, pensez à vérifier vos spams.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={isResending}
                className="bg-yellow-100 border-yellow-300 text-yellow-900 hover:bg-yellow-200 hover:border-yellow-400 text-xs"
              >
                {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 flex-shrink-0 self-start"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {message && (
        <div className={`border-t ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="px-4 py-2">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
