import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-4xl border-2 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold">🍪 Gestion des cookies</h3>
              
              <p className="text-sm text-muted-foreground">
                Nous utilisons des cookies essentiels pour garantir le bon fonctionnement de notre site et des cookies analytiques pour comprendre comment vous l'utilisez. 
                Les cookies analytiques ne sont activés qu'avec votre consentement.
              </p>

              <p className="text-xs text-muted-foreground">
                En cliquant sur "Tout accepter", vous acceptez notre utilisation des cookies. 
                Vous pouvez consulter notre{' '}
                <a href="/privacy-policy" className="text-primary underline hover:text-primary/80">
                  Politique de confidentialité
                </a>{' '}
                pour plus d'informations.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={handleAccept} className="flex-1 sm:flex-none">
                  Tout accepter
                </Button>
                <Button onClick={handleDecline} variant="outline" className="flex-1 sm:flex-none">
                  Refuser les cookies analytiques
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="flex-shrink-0"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
