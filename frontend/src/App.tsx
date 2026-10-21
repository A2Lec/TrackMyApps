import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Toaster, toast } from 'sonner';
import { AlertTriangle, Check } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { AppLoader } from '@/components/loading/AppLoader';
import { TopProgressBar } from '@/components/loading/TopProgressBar';
import { pageLoaders, PROTECTED_PAGES, prefetchPagesWhenIdle } from '@/lib/pageLoaders';
import { CookieConsent } from '@/components/CookieConsent';
import { useCookieConsent } from '@/lib/cookieConsent';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { setupNotificationChecker, showBrowserNotification, getNotificationPermission } from '@/utils/notifications';
import { remindersService } from '@/services/reminders.service';

// Lazy load pages
const LoginPage = lazy(() => pageLoaders.login().then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => pageLoaders.register().then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => pageLoaders.forgotPassword().then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => pageLoaders.resetPassword().then(module => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => pageLoaders.verifyEmail().then(module => ({ default: module.VerifyEmailPage })));
const DashboardPage = lazy(() => pageLoaders.dashboard().then(module => ({ default: module.DashboardPage })));
const ApplicationsPage = lazy(() => pageLoaders.applications().then(module => ({ default: module.ApplicationsPage })));
const ApplicationDetailPage = lazy(() => pageLoaders.applicationDetail().then(module => ({ default: module.ApplicationDetailPage })));
const DocumentsPage = lazy(() => pageLoaders.documents().then(module => ({ default: module.DocumentsPage })));
const RemindersPage = lazy(() => pageLoaders.reminders().then(module => ({ default: module.RemindersPage })));
const AnalyticsPage = lazy(() => pageLoaders.analytics().then(module => ({ default: module.AnalyticsPage })));
const CalendarPage = lazy(() => pageLoaders.calendar().then(module => ({ default: module.CalendarPage })));
const CompaniesPage = lazy(() => pageLoaders.companies().then(module => ({ default: module.CompaniesPage })));
const InterviewPrepPage = lazy(() => pageLoaders.interviewPrep().then(module => ({ default: module.InterviewPrepPage })));
const SettingsPage = lazy(() => pageLoaders.settings().then(module => ({ default: module.SettingsPage })));

// Legal pages
const PrivacyPolicyPage = lazy(() => pageLoaders.privacyPolicy().then(module => ({ default: module.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => pageLoaders.termsOfService().then(module => ({ default: module.TermsOfServicePage })));
const LegalNoticePage = lazy(() => pageLoaders.legalNotice().then(module => ({ default: module.LegalNoticePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.response?.data?.message
          || error?.message
          || 'Une erreur est survenue';
        toast.error(message);
      },
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { isAuthenticated } = useAuthStore();
  const analyticsEnabled = useCookieConsent() === 'accepted';

  // Once logged in, download the other pages in the background so their first visit is instant
  useEffect(() => {
    if (!isAuthenticated) return;
    return prefetchPagesWhenIdle(PROTECTED_PAGES);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkReminders = async () => {
      // Trigger backend email check (poor man's cron for free tier)
      remindersService.triggerEmailCheck().catch(console.error);

      if (getNotificationPermission() !== 'granted') return;

      try {
        const reminders = await remindersService.getAll();
        const now = new Date();
        const notifiedKey = 'notifiedReminders';
        const notified = JSON.parse(localStorage.getItem(notifiedKey) || '{}');

        reminders.forEach((reminder) => {
          if (reminder.isCompleted) return;
          if (notified[reminder.id]) return; // Already notified

          const dueDate = new Date(reminder.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();

          // Show notification if due time has passed or is within the next minute
          if (timeDiff <= 60 * 1000 && timeDiff > -5 * 60 * 1000) {
            showBrowserNotification(reminder.title, {
              body: reminder.description || 'Rappel maintenant',
              tag: `reminder-${reminder.id}`,
              requireInteraction: true,
            });
            
            // Mark as notified
            notified[reminder.id] = Date.now();
            localStorage.setItem(notifiedKey, JSON.stringify(notified));
          }
        });

        // Clean old entries (older than 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        Object.keys(notified).forEach(key => {
          if (notified[key] < oneDayAgo) {
            delete notified[key];
          }
        });
        localStorage.setItem(notifiedKey, JSON.stringify(notified));
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Setup checker that runs every minute
    const cleanup = setupNotificationChecker(checkReminders, 1);

    return cleanup;
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <BrowserRouter>
          <TopProgressBar />
          <Suspense fallback={<AppLoader />}>
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              {/* Not wrapped in PublicRoute: the emailed link must work even in a logged-in browser */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              
              {/* Legal pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/legal-notice" element={<LegalNoticePage />} />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="applications/:id" element={<ApplicationDetailPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="interview-prep" element={<InterviewPrepPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <CookieConsent />
        </BrowserRouter>
        {analyticsEnabled && <Analytics />}
        <Toaster
          position="bottom-right"
          mobileOffset={{ bottom: 80, left: 16, right: 16 }}
          icons={{
            success: <Check className="h-4 w-4 text-[#3FC2B2]" strokeWidth={2} />,
            error: <AlertTriangle className="h-4 w-4 text-[#EF6A5E]" strokeWidth={2} />,
          }}
          toastOptions={{
            unstyled: true,
            classNames: {
              // Sillage: inverse background, no, 6px radius
              toast:
                'flex w-full sm:w-[340px] items-start gap-2.5 rounded-md bg-inverse text-inverse-foreground px-4 py-3.5 font-sans text-sm',
              title: 'font-semibold',
              description: 'opacity-80',
              icon: 'mt-0.5',
              actionButton:
                'ml-auto shrink-0 rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground hover:bg-warning/90',
              cancelButton: 'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-inverse-foreground hover:bg-inverse-foreground/10',
              closeButton: 'text-inverse-foreground',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
