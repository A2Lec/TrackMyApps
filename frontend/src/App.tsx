import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/auth/Login';
import { RegisterPage } from '@/pages/auth/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { ApplicationsPage } from '@/pages/Applications';
import { ApplicationDetailPage } from '@/pages/ApplicationDetail';
import { DocumentsPage } from '@/pages/Documents';
import { RemindersPage } from '@/pages/Reminders';
import { AnalyticsPage } from '@/pages/Analytics';
import { CalendarPage } from '@/pages/Calendar';
import { CompaniesPage } from '@/pages/Companies';
import { InterviewPrepPage } from '@/pages/InterviewPrep';
import { SettingsPage } from '@/pages/Settings';
import { useAuthStore } from '@/store/authStore';
import { setupNotificationChecker, showBrowserNotification, getNotificationPermission } from '@/utils/notifications';
import { remindersService } from '@/services/reminders.service';

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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
