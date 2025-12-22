import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  FileText,
  Bell,
  BarChart3,
  Calendar,
  Building2,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Candidatures', href: '/applications', icon: Briefcase },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Rappels', href: '/reminders', icon: Bell },
  { name: 'Statistiques', href: '/analytics', icon: BarChart3 },
  { name: 'Calendrier', href: '/calendar', icon: Calendar },
  { name: 'Entreprises', href: '/companies', icon: Building2 },
  { name: 'Préparation', href: '/interview-prep', icon: MessageSquare },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <>
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 lg:flex-none"
        >
          <img src="/logo.svg" alt="TrackMyApps" className="h-8 w-8" />
          <span className={cn(
            "font-bold text-xl",
            !sidebarOpen && "hidden lg:hidden"
          )}>TrackMyApps</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && "hidden")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => {
                // Fermer la sidebar sur mobile après sélection
                if (window.innerWidth < 1024) {
                  toggleSidebar();
                }
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn(!sidebarOpen && "hidden lg:hidden")}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <Link 
          to="/settings"
          className={cn(
            "border-t p-4 transition-colors hover:bg-accent/50",
            !sidebarOpen && "hidden lg:block"
          )}>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className={cn(
              "flex-1 min-w-0",
              !sidebarOpen && "hidden"
            )}>
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Toggle button when collapsed - desktop only */}
      {!sidebarOpen && (
        <div className="hidden lg:flex absolute bottom-4 left-0 right-0 justify-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
    </>
  );
}
