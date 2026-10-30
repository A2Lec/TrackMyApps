import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { CookieConsent } from '@/components/CookieConsent';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { getConsent, setConsent } from '@/lib/cookieConsent';
import { LegalNoticePage } from '@/pages/legal/LegalNotice';
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicy';
import { TermsOfServicePage } from '@/pages/legal/TermsOfService';
import { LEGAL } from '@/lib/legal';

const inRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Cookie consent', () => {
  beforeEach(() => localStorage.clear());

  it('asks on first visit and remembers the choice with its date', () => {
    inRouter(<CookieConsent />);

    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getConsent()).toBe('declined');
    expect(JSON.parse(localStorage.getItem('cookie-consent')!).date).toEqual(expect.any(Number));
  });

  it('asks again after 6 months and for the old plain-string format', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    expect(getConsent()).toBeNull();

    const sevenMonthsAgo = Date.now() - 7 * 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('cookie-consent', JSON.stringify({ choice: 'accepted', date: sevenMonthsAgo }));
    expect(getConsent()).toBeNull();
  });

  it('can be reopened from "Gérer les cookies" to withdraw consent', () => {
    setConsent('accepted');
    inRouter(
      <>
        <CookieConsent />
        <LegalLinks />
      </>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Gérer les cookies' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    expect(getConsent()).toBe('declined');
  });
});

describe('Legal pages', () => {
  it.each([
    ['Mentions légales', LegalNoticePage],
    ['Politique de confidentialité', PrivacyPolicyPage],
    ["Conditions générales d'utilisation", TermsOfServicePage],
  ])('%s: no placeholder left, publisher identified', (title, Page) => {
    const { container } = inRouter(<Page />);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(container.textContent).toContain(LEGAL.ownerName);
    expect(container.textContent).not.toMatch(/\[[^\]]*(À définir|Adresse|SIRET|Nom)[^\]]*\]/);
    expect(container.textContent).not.toMatch(/Privacy Shield|Stripe|SendGrid|Resend|trackmyapps\.com/);
  });

  it('the privacy policy discloses the AI provider and the CNIL complaint right', () => {
    const { container } = inRouter(<PrivacyPolicyPage />);
    expect(container.textContent).toContain('Google Gemini');
    expect(container.textContent).toContain('CNIL');
  });

  it('the privacy policy reflects that users bring their own Gemini key', () => {
    const { container } = inRouter(<PrivacyPolicyPage />);
    expect(container.textContent).toContain('votre propre clé API Google Gemini');
    expect(container.textContent).toContain('Offre gratuite');
    expect(container.textContent).not.toContain("Le service utilise l'offre payante");
  });
});
