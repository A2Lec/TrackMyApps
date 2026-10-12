import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore, isDesktopViewport } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Candidatures', href: '/applications', icon: Briefcase },
  { name: 'Rappels', href: '/reminders', icon: Bell },
  { name: 'Entraînement IA', href: '/interview-prep', icon: Sparkles },
  { name: 'Documents', href: '/documents', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  return (
    <>
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-card/95 backdrop-blur-md border-r border-border/80 transition-all duration-300 flex flex-col',
          'lg:translate-x-0',
          sidebarOpen ? 'w-64 translate-x-0 shadow-xl lg:shadow-none' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/70 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-hidden flex-1 lg:flex-none"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text",
              !sidebarOpen && "hidden lg:hidden"
            )}>
              TrackMyApps
            </span>
          </button>
          
          {sidebarOpen && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Réduire le menu</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-none">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  if (!isDesktopViewport()) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  !sidebarOpen && 'lg:justify-center lg:px-2.5',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-105',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )} />
                <span className={cn(
                  'truncate tracking-tight',
                  !sidebarOpen && 'hidden lg:hidden'
                )}>
                  {item.name}
                </span>
              </Link>
            );

            // In collapsed state on desktop, wrap each item in a tooltip
            if (!sidebarOpen) {
              return (
                <Tooltip key={item.name} delayDuration={100}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* User profile footer */}
        {user && (
          <div className="border-t border-border/70 p-3 flex-shrink-0">
            {!sidebarOpen ? (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link 
                    to="/settings"
                    className="flex justify-center p-2 rounded-lg hover:bg-accent/80 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <div className="text-xs">
                    <p className="font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link 
                to="/settings"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/80 transition-colors group"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                  <span className="text-xs font-semibold text-primary">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </Link>
            )}

            {/* Expand button when collapsed */}
            {!sidebarOpen && (
              <div className="hidden lg:flex justify-center pt-2">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleSidebar}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    Agrandir le menu
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
