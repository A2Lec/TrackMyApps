import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { openCookieSettings } from '@/lib/cookieConsent';

const LINKS = [
  { to: '/legal-notice', label: 'Mentions légales' },
  { to: '/privacy-policy', label: 'Confidentialité' },
  { to: '/terms-of-service', label: 'CGU' },
];

/** Legal links reachable without an account (login, register, legal pages) */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Informations légales" className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      {LINKS.map((link) => (
        <Link key={link.to} to={link.to} className="hover:text-foreground hover:underline transition-colors">
          {link.label}
        </Link>
      ))}
      <button type="button" onClick={openCookieSettings} className="hover:text-foreground hover:underline transition-colors">
        Gérer les cookies
      </button>
    </nav>
  );
}
