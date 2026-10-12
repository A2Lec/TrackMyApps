// Single source for page chunk imports: React.lazy and prefetching share them,
// so a prefetched chunk is the one the router renders.
export const pageLoaders = {
  login: () => import('@/pages/auth/Login'),
  register: () => import('@/pages/auth/Register'),
  forgotPassword: () => import('@/pages/auth/ForgotPassword'),
  resetPassword: () => import('@/pages/auth/ResetPassword'),
  verifyEmail: () => import('@/pages/VerifyEmail'),
  dashboard: () => import('@/pages/Dashboard'),
  applications: () => import('@/pages/Applications'),
  applicationDetail: () => import('@/pages/ApplicationDetail'),
  documents: () => import('@/pages/Documents'),
  reminders: () => import('@/pages/Reminders'),
  analytics: () => import('@/pages/Analytics'),
  calendar: () => import('@/pages/Calendar'),
  companies: () => import('@/pages/Companies'),
  interviewPrep: () => import('@/pages/InterviewPrep'),
  settings: () => import('@/pages/Settings'),
  privacyPolicy: () => import('@/pages/legal/PrivacyPolicy'),
  termsOfService: () => import('@/pages/legal/TermsOfService'),
  legalNotice: () => import('@/pages/legal/LegalNotice'),
};

export type PageKey = keyof typeof pageLoaders;

export const PROTECTED_PAGES: PageKey[] = [
  'dashboard',
  'applications',
  'applicationDetail',
  'reminders',
  'interviewPrep',
  'documents',
  'calendar',
  'companies',
  'settings',
  'analytics',
];

export function prefetchPages(keys: PageKey[]) {
  for (const key of keys) {
    // Failures are harmless: the page will simply load on navigation
    pageLoaders[key]().catch(() => {});
  }
}

/** Prefetch when the browser is idle, so it never competes with the current page */
export function prefetchPagesWhenIdle(keys: PageKey[]): () => void {
  const run = () => prefetchPages(keys);
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 2000);
  return () => window.clearTimeout(id);
}
