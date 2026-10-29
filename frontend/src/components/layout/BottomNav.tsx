import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Mic,
  Menu,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  const { toggleSidebar, sidebarOpen } = useUIStore();

  const navItems = [
    {
      name: 'Accueil',
      href: '/',
      icon: LayoutDashboard,
      isActive: location.pathname === '/' || location.pathname === '/dashboard',
    },
    {
      name: 'Candidatures',
      href: '/applications',
      icon: Briefcase,
      isActive: location.pathname.startsWith('/applications'),
    },
    {
      name: 'Rappels',
      href: '/reminders',
      icon: Bell,
      isActive: location.pathname.startsWith('/reminders'),
    },
    {
      name: 'Entretiens',
      href: '/interview-prep',
      icon: Mic,
      isActive:
        location.pathname.startsWith('/interview-prep') ||
        location.pathname.startsWith('/interview-simulation'),
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-background border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              aria-current={item.isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-[52px] flex-col items-center justify-center gap-1 border-t-2 pt-1.5 pb-1 transition-colors',
                item.isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground font-medium hover:text-foreground'
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
              <span className="text-[11px] leading-tight">{item.name}</span>
            </Link>
          );
        })}

        {/* Menu Drawer Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex min-h-[52px] flex-col items-center justify-center gap-1 border-t-2 pt-1.5 pb-1 transition-colors',
            sidebarOpen
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground font-medium hover:text-foreground'
          )}
          aria-label="Ouvrir le menu complet"
        >
          <Menu className="h-[22px] w-[22px]" strokeWidth={1.8} />
          <span className="text-[11px] leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
