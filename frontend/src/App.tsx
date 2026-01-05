import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from '@/components/layout/Layout';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useAuthStore } from '@/store/authStore';
import { setupNotificationChecker, showBrowserNotification, getNotificationPermission } from '@/utils/notifications';
import { remindersService } from '@/services/reminders.service';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/Login').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/Register').then(module => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.DashboardPage })));
const ApplicationsPage = lazy(() => import('@/pages/Applications').then(module => ({ default: module.ApplicationsPage })));
const ApplicationDetailPage = lazy(() => import('@/pages/ApplicationDetail').then(module => ({ default: module.ApplicationDetailPage })));
const DocumentsPage = lazy(() => import('@/pages/Documents').then(module => ({ default: module.DocumentsPage })));
const RemindersPage = lazy(() => import('@/pages/Reminders').then(module => ({ default: module.RemindersPage })));
const AnalyticsPage = lazy(() => import('@/pages/Analytics').then(module => ({ default: module.AnalyticsPage })));
const CalendarPage = lazy(() => import('@/pages/Calendar').then(module => ({ default: module.CalendarPage })));
const CompaniesPage = lazy(() => import('@/pages/Companies').then(module => ({ default: module.CompaniesPage })));
const InterviewPrepPage = lazy(() => import('@/pages/InterviewPrep').then(module => ({ default: module.InterviewPrepPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then(module => ({ default: module.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
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
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingSkeleton type="grid" count={1} className="w-full max-w-md" /></div>}>
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
      </BrowserRouter>
      <Analytics />
    </QueryClientProvider>
  );
}

export default App;
