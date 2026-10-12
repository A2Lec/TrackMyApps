import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ExternalLink } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { openCookieSettings } from '@/lib/cookieConsent';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card/30 backdrop-blur-xs text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-6 border-b border-border/40">
          {/* Brand & Status Column */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <BrandLogo title="" className="h-6 w-6" />
              <span className="font-semibold text-sm text-foreground tracking-tight">TrackMyApps</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-mono text-muted-foreground border border-border/60">
                v1.2
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Plateforme unifiée de suivi de candidatures, préparation aux entretiens et gestion documentaire pour candidats exigeants.
            </p>

            {/* System Status & Compliance */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Systèmes opérationnels</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Conforme RGPD</span>
              </div>
            </div>
          </div>

          {/* Product & Navigation */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Espace Candidat
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link to="/applications" className="hover:text-foreground transition-colors">
                  Candidatures & Pipeline
                </Link>
              </li>
              <li>
                <Link to="/interview-prep" className="hover:text-foreground transition-colors">
                  Simulateur IA & Méthode STAR
                </Link>
              </li>
              <li>
                <Link to="/documents" className="hover:text-foreground transition-colors">
                  Gestionnaire de Documents
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-foreground transition-colors">
                  Statistiques & Funnel
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Confidentialité & Légal
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
                  Conditions générales d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/legal-notice" className="hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <button type="button" onClick={openCookieSettings} className="hover:text-foreground transition-colors">
                  Gérer les cookies
                </button>
              </li>
              <li>
                <Link to="/settings" className="hover:text-foreground transition-colors">
                  Portabilité des données (Export)
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Assistance
            </h4>
            <div className="space-y-2">
              <a
                href="mailto:contact@trackmyapps.com"
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-medium group"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                <span>Nous contacter</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
              </a>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Une question ou une suggestion ? Notre équipe vous répond sous 24h ouvrées.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Micro-Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p>© {currentYear} TrackMyApps. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground transition-colors cursor-default">
              Hébergement sécurisé UE
            </span>
            <span>•</span>
            <span className="hover:text-foreground transition-colors cursor-default">
              Chiffrement AES-256
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
