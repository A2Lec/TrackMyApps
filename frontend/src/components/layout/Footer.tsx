import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">TrackMyApps</h3>
            <p className="text-sm text-muted-foreground">
              Gérez vos candidatures d'emploi de manière simple et efficace. 
              Centralisez tous vos processus de recrutement en un seul endroit.
            </p>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Mentions légales</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Conditions générales d'utilisation
              </Link>
              <Link
                to="/legal-notice"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Mentions légales
              </Link>
            </nav>
          </div>

          {/* Contact section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Contact</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Email :{' '}
                <a
                  href="mailto:contact@trackmyapps.com"
                  className="hover:text-primary transition-colors"
                >
                  contact@trackmyapps.com
                </a>
              </p>
              <p className="text-xs">
                Nous sommes à votre disposition pour toute question ou suggestion.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} TrackMyApps. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Conçu avec ❤️ pour simplifier votre recherche d'emploi
          </p>
        </div>
      </div>
    </footer>
  );
}
