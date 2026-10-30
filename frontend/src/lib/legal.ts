// Single source for the identity and dates shown in the legal pages, the footer and the forms.
// The publisher's identity comes from the environment so that each deployment shows its own.
export const LEGAL = {
  siteName: 'TrackMyApps',
  siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
  ownerName: import.meta.env.VITE_LEGAL_OWNER_NAME || "[Nom de l'éditeur]",
  contactEmail: import.meta.env.VITE_LEGAL_CONTACT_EMAIL || 'contact@example.com',
  minimumAge: 15,
  lastUpdated: '30 octobre 2026',
} as const;
