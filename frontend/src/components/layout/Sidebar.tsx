import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { remindersService } from '@/services/reminders.service';
import { cn } from '@/lib/utils';
import { useUIStore, isDesktopViewport } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BrandLogo, BrandName } from '@/components/BrandLogo';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Candidatures', href: '/applications', icon: Briefcase },
  { name: 'Rappels', href: '/reminders', icon: Bell },
  { name: 'Entraînement IA', href: '/interview-prep', icon: Mic },
  { name: 'Documents', href: '/documents', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  // Same query as the header bell: shared cache
  const { data: reminderCount = 0 } = useQuery({
    queryKey: ['reminderCount'],
    queryFn: () => remindersService.getCount(),
    refetchInterval: 60000,
  });

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
          'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
          'lg:translate-x-0',
          sidebarOpen ? 'w-[232px] translate-x-0 shadow-popover lg:shadow-none' : 'w-[232px] -translate-x-full lg:w-20 lg:translate-x-0'
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-hidden flex-1 lg:flex-none"
          >
            <BrandLogo title={sidebarOpen ? '' : 'TrackMyApps'} className="h-[30px] w-[30px]" />
            <BrandName className={cn("text-lg", !sidebarOpen && "hidden lg:hidden")} />
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
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-none">
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
                  'group relative flex h-10 items-center gap-3 px-3 rounded-md text-sm transition-colors duration-150',
                  !sidebarOpen && 'lg:justify-center lg:px-2.5',
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-muted-foreground font-medium hover:bg-accent hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.8} />
                <span className={cn(
                  'truncate tracking-tight',
                  !sidebarOpen && 'hidden lg:hidden'
                )}>
                  {item.name}
                </span>
                {item.href === '/reminders' && reminderCount > 0 && (
                  sidebarOpen ? (
                    <span className="ml-auto rounded-sm bg-warning px-1.5 font-mono text-xs font-semibold text-warning-foreground">
                      {String(reminderCount).padStart(2, '0')}
                    </span>
                  ) : (
                    <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-[2px] bg-warning" />
                  )
                )}
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
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
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
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
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
