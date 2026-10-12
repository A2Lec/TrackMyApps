import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import { getConsent, onCookieSettingsOpen, setConsent } from '@/lib/cookieConsent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(() => getConsent() === null);

  useEffect(() => onCookieSettingsOpen(() => setIsVisible(true)), []);

  const choose = (choice: 'accepted' | 'declined') => {
    setConsent(choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6" role="dialog" aria-labelledby="cookie-consent-title">
      <Card className="mx-auto max-w-3xl border-2 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="p-5 sm:p-6 flex items-start gap-4">
          <Cookie className="hidden sm:block h-8 w-8 text-primary flex-shrink-0" aria-hidden="true" />

          <div className="flex-1 space-y-3">
            <h3 id="cookie-consent-title" className="text-base font-semibold">
              Cookies et mesure d'audience
            </h3>
            <p className="text-sm text-muted-foreground">
              Le site utilise uniquement le stockage indispensable à son fonctionnement (connexion, préférences).
              Avec votre accord, nous mesurons aussi la fréquentation de façon anonyme avec Vercel Web Analytics,
              sans cookie publicitaire ni suivi d'un site à l'autre.
            </p>
            <p className="text-xs text-muted-foreground">
              Vous pouvez changer d'avis à tout moment avec le lien « Gérer les cookies » en bas de page.{' '}
              <Link to="/privacy-policy#cookies" className="text-primary underline hover:text-primary/80">
                En savoir plus
              </Link>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Same weight for both choices: refusing must be as easy as accepting */}
              <Button onClick={() => choose('accepted')} className="flex-1 sm:flex-none">
                Accepter
              </Button>
              <Button onClick={() => choose('declined')} variant="outline" className="flex-1 sm:flex-none">
                Refuser
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
