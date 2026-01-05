import { Outlet, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { cn } from '@/lib/utils';

export function Layout() {
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 flex-1',
          'pl-0 lg:pl-20',
          sidebarOpen && 'lg:pl-64'
        )}
      >
        <EmailVerificationBanner />
        <div className="p-4 md:p-6">
          <Suspense fallback={<LoadingSkeleton type="grid" count={6} />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <div
        className={cn(
          'transition-all duration-300',
          'pl-0 lg:pl-20',
          sidebarOpen && 'lg:pl-64'
        )}
      >
        <Footer />
      </div>
    </div>
  );
}
