import { ReactNode } from "react";
import { User, Moon, Sun, RefreshCw, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleFit } from "@/hooks/useGoogleFit";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import bgImage from "@assets/generated_images/abstract_dark_neon_gradient_background_for_fitness_app.png";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { isConnected, connect, disconnect, sync, isSyncing } = useGoogleFit();
  const { theme, setTheme } = useTheme();

  const handleSync = () => {
    if (isConnected) {
      sync(undefined);
    } else {
      connect(undefined);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden relative font-sans selection:bg-primary/30 transition-colors duration-300">
      {/* Background Image Layer - only in dark mode */}
      <div 
        className="absolute inset-0 z-0 opacity-0 dark:opacity-60 pointer-events-none transition-opacity duration-300"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Radial Gradient Overlay for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      
      {/* Light mode subtle gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-100 dark:opacity-0 pointer-events-none transition-opacity duration-300" />

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:border-primary/50 transition-all duration-500 disabled:opacity-50"
          data-testid="button-sync-fit"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
          )}
          <span className="text-xs font-medium text-black/80 dark:text-white/80">
            {isConnected ? 'Sync Fit' : 'Connect Fit'}
          </span>
        </button>
        
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all duration-300"
          data-testid="button-theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-white/80 hover:text-yellow-300 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800 hover:text-gray-600 transition-colors" />
          )}
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all duration-300"
              data-testid="button-profile"
            >
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-xl border-border" align="end">
            <DropdownMenuLabel className="text-foreground">
              {user?.firstName || user?.email || 'My Account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={() => window.location.href = '/api/logout'}
              className="text-foreground hover:bg-muted cursor-pointer"
              data-testid="menu-item-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <main className="relative z-10 h-screen overflow-y-auto scrollbar-hide p-4 md:p-8 lg:p-12">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
        </div>
      </main>
    </div>
  );
}
