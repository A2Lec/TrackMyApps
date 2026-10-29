import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/errors';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Token de vérification manquant');
  const verifiedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // The token is single-use: avoid a second call (e.g. StrictMode double effect) turning success into an error
    if (!token || verifiedTokenRef.current === token) return;
    verifiedTokenRef.current = token;

    let redirectTimer: number | undefined;
    authService
      .verifyEmail(token)
      .then(() => {
        // Update the persisted user so the banner and guards unlock immediately
        if (useAuthStore.getState().user) {
          useAuthStore.getState().updateUser({ emailVerified: true });
        }
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
        redirectTimer = window.setTimeout(() => navigate('/'), 3000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(getErrorMessage(error, "Erreur lors de la vérification de l'email"));
      });

    return () => window.clearTimeout(redirectTimer);
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-success" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Vérification en cours...'}
            {status === 'success' && 'Email vérifié !'}
            {status === 'error' && 'Erreur de vérification'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Vous allez être redirigé vers le tableau de bord...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5" />
                <p>
                  Le lien de vérification a peut-être expiré. Vous pouvez demander un nouveau lien de vérification depuis votre profil.
                </p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full">
                Retour à la connexion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
