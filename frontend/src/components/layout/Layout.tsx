import { Outlet, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { RouteFallback } from '@/components/loading/RouteFallback';
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
          'pt-16 pb-16 lg:pb-0 min-h-screen transition-all duration-300 flex-1 overflow-x-hidden w-full min-w-0',
          'pl-0 lg:pl-20',
          sidebarOpen && 'lg:pl-64'
        )}
      >
        <EmailVerificationBanner />
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <div
        className={cn(
          'pb-16 lg:pb-0 transition-all duration-300',
          'pl-0 lg:pl-20',
          sidebarOpen && 'lg:pl-64'
        )}
      >
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
