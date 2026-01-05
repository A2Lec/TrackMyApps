import { useState } from 'react';
import { Mail, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      <Alert className="rounded-none border-0 bg-transparent">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <div className="flex items-center justify-between flex-1">
          <AlertDescription className="text-yellow-800 flex items-center gap-4">
            <Mail className="h-4 w-4" />
            <span>
              Veuillez vérifier votre adresse email pour accéder à toutes les fonctionnalités.
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="text-yellow-700 hover:text-yellow-900 p-0 h-auto font-semibold"
            >
              {isResending ? 'Envoi...' : 'Renvoyer l\'email'}
            </Button>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>

      {message && (
        <Alert className={`rounded-none border-0 border-t ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
