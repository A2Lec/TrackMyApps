import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore, isDesktopViewport } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { RouteFallback } from '@/components/loading/RouteFallback';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { cn } from '@/lib/utils';

export function Layout() {
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { pathname } = useLocation();

  // On mobile the sidebar overlays the page: close it whenever the user navigates
  useEffect(() => {
    if (!isDesktopViewport()) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

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
          sidebarOpen && 'lg:pl-[232px]'
        )}
      >
        <EmailVerificationBanner />
        <div className="px-5 py-5 md:p-6 lg:px-8 lg:py-8 max-w-[1400px] mx-auto w-full min-w-0">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <div
        className={cn(
          'pb-16 lg:pb-0 transition-all duration-300',
          'pl-0 lg:pl-20',
          sidebarOpen && 'lg:pl-[232px]'
        )}
      >
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
