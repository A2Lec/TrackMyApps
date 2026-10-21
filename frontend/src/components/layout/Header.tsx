import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersService } from '@/services/reminders.service';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, Menu, LogOut, User, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo, BrandName } from '@/components/BrandLogo';

export function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUIStore();

  const { data: reminderCount = 0 } = useQuery({
    queryKey: ['reminderCount'],
    queryFn: () => remindersService.getCount(),
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
    logout();
    queryClient.clear();
    navigate('/login');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="h-5 w-5" />;
    if (theme === 'light') return <Sun className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background/95 backdrop-blur border-b transition-all duration-300',
        'left-0 lg:left-20',
        sidebarOpen && 'lg:left-64'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo title="" className="h-7 w-7" />
            <BrandName className="text-lg" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-0.5 md:gap-4">
          {/* Theme switcher */}
          <DropdownMenu>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Changer de thème">
                    {getThemeIcon()}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Thème d'affichage</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Sombre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                Système
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/reminders')}
                aria-label="Rappels"
              >
                <Bell className={cn("h-5 w-5", reminderCount > 0 && "text-primary")} />
                {reminderCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-in zoom-in font-medium">
                    {reminderCount > 9 ? '9+' : reminderCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {reminderCount > 0 ? `${reminderCount} action(s) à faire` : 'Aucun rappel en attente'}
            </TooltipContent>
          </Tooltip>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl} alt={user?.firstName} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
