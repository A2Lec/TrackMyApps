import { useEffect, useState } from 'react';

export type ConsentChoice = 'accepted' | 'declined';

const STORAGE_KEY = 'cookie-consent';
const CHANGE_EVENT = 'cookie-consent:change';
const OPEN_EVENT = 'cookie-consent:open';
// CNIL recommends asking again after about 6 months
const CONSENT_MAX_AGE_MS = 6 * 30 * 24 * 60 * 60 * 1000;

interface StoredConsent {
  choice: ConsentChoice;
  date: number;
}

export function getConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed?.choice !== 'accepted' && parsed?.choice !== 'declined') return null;
    if (typeof parsed.date !== 'number' || Date.now() - parsed.date > CONSENT_MAX_AGE_MS) return null;
    return parsed.choice;
  } catch {
    // Legacy plain-string value or unreadable storage: ask again
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, date: Date.now() } satisfies StoredConsent));
  } catch {
    // Storage blocked: the choice still applies for this visit
  }
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CHANGE_EVENT, { detail: choice }));
}

/** Reopens the consent banner (footer "Gérer les cookies" link), so consent can be withdrawn as easily as given */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onCookieSettingsOpen(listener: () => void): () => void {
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}

/** Current choice, kept in sync with later changes */
export function useCookieConsent(): ConsentChoice | null {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => getConsent());

  useEffect(() => {
    const onChange = (event: Event) => setChoice((event as CustomEvent<ConsentChoice>).detail);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return choice;
}
