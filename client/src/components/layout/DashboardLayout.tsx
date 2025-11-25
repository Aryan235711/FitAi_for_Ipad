import { ReactNode, useMemo } from "react";
import { User, RefreshCw, LogOut, Loader2, Power } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleFit } from "@/hooks/useGoogleFit";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import bgImage from "@assets/generated_images/abstract_dark_neon_gradient_background_for_fitness_app.png";
import { formatDistanceToNow } from "date-fns";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isConnected, hasSyncedData, lastSyncedAt, connect, disconnect, sync, isSyncing, isDisconnecting } = useGoogleFit();

  const handleDisconnect = () => {
    if (!isConnected || isDisconnecting) return;
    const confirmed = window.confirm('Disconnect Google Fit? You can reconnect anytime.');
    if (confirmed) {
      disconnect();
    }
  };

  const statusDetails = useMemo(() => {
    const lastSyncDate = lastSyncedAt ? new Date(lastSyncedAt) : null;
    const relativeTime = lastSyncDate
      ? formatDistanceToNow(lastSyncDate, { addSuffix: true })
      : null;
    const isSyncStale = lastSyncDate
      ? Date.now() - lastSyncDate.getTime() > 24 * 60 * 60 * 1000
      : false;

    if (!isConnected) {
      return {
        color: "bg-rose-500",
        label: "Google Fit disconnected",
        tooltip: "Connect Google Fit to start syncing data.",
      };
    }

    if (hasSyncedData) {
      if (isSyncStale) {
        return {
          color: "bg-amber-400",
          label: relativeTime ? `Last sync ${relativeTime}` : "Data needs refresh",
          tooltip: "It's been more than a day since the last sync. Run a sync to keep insights fresh.",
        };
      }

      return {
        color: "bg-emerald-400",
        label: relativeTime ? `Synced ${relativeTime}` : "Google Fit synced",
        tooltip: relativeTime
          ? `Last sync completed ${relativeTime}.`
          : "Latest sync info not available yet, but Google Fit is connected.",
      };
    }

    return {
      color: "bg-sky-400",
      label: "Connected — waiting for first sync",
      tooltip: "Start a sync to import historical Google Fit data.",
    };
  }, [hasSyncedData, isConnected, lastSyncedAt]);

  const handleSync = () => {
    if (isConnected) {
      sync(undefined);
    } else {
      connect(undefined);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden relative font-sans selection:bg-primary/30">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Radial Gradient Overlay for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 min-h-[44px] cursor-default"
              aria-live="polite"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px] ${statusDetails.color}`}
              />
              <span className="text-xs font-medium text-white/80">
                {statusDetails.label}
              </span>
              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="ml-2 p-1 rounded-full bg-white/0 border border-transparent hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition disabled:opacity-50"
                  aria-label="Disconnect Google Fit"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-3.5 h-3.5 text-white/80 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5 text-white/80" />
                  )}
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {statusDetails.tooltip}
          </TooltipContent>
        </Tooltip>

        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-500 disabled:opacity-50 min-h-[44px] min-w-[44px]"
          data-testid="button-sync-fit"
          aria-label={isConnected ? "Sync fitness data" : "Connect Google Fit"}
          aria-pressed={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-primary group-hover:rotate-180 group-focus-within:rotate-180 transition-transform duration-700 ease-in-out" />
          )}
          <span className="text-xs font-medium text-white/80">
            {isConnected ? 'Sync Fit' : 'Connect Fit'}
          </span>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300 min-h-[44px] min-w-[44px]"
              data-testid="button-profile"
              aria-label="User profile menu"
            >
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-black/95 backdrop-blur-xl border-white/10" align="end">
            <DropdownMenuLabel className="text-white">
              {user?.email || 'My Account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => window.location.href = '/api/logout'}
              className="text-white hover:bg-white/10 cursor-pointer"
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
