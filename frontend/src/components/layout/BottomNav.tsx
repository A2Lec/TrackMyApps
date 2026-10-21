import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Sparkles,
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
      icon: Sparkles,
      isActive:
        location.pathname.startsWith('/interview-prep') ||
        location.pathname.startsWith('/interview-simulation'),
      badge: 'IA',
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-card/95 backdrop-blur-md border-t border-border/80 px-2 py-1.5 shadow-lg shadow-black/5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative group',
                item.isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center transition-all relative',
                  item.isActive && 'bg-primary/10 shadow-xs'
                )}
              >
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 transition-transform group-active:scale-95',
                    item.isActive ? 'text-primary stroke-[2.25]' : 'stroke-[1.75]'
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-highlight text-highlight-foreground rounded-full text-[9px] font-bold shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-0.5">
                {item.name}
              </span>
              {item.isActive && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Menu Drawer Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative group',
            sidebarOpen
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Ouvrir le menu complet"
        >
          <div
            className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
              sidebarOpen && 'bg-primary/10'
            )}
          >
            <Menu className="h-4.5 w-4.5 stroke-[1.75] group-active:scale-95" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
