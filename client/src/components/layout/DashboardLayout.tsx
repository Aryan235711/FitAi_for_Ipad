import { ReactNode, useMemo } from "react";
import { User, RefreshCw, LogOut, Loader2, Power } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleFit } from "@/hooks/useGoogleFit";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { StatusChip } from "@/components/ui/StatusChip";
import { DesignButton } from "@/design/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        tone: "danger" as const,
        label: "Google Fit disconnected",
        tooltip: "Connect Google Fit to start syncing data.",
      };
    }

    if (hasSyncedData) {
      if (isSyncStale) {
        return {
          tone: "warning" as const,
          label: relativeTime ? `Last sync ${relativeTime}` : "Data needs refresh",
          tooltip: "It's been more than a day since the last sync. Run a sync to keep insights fresh.",
        };
      }

      return {
        tone: "success" as const,
        label: relativeTime ? `Synced ${relativeTime}` : "Google Fit synced",
        tooltip: relativeTime
          ? `Last sync completed ${relativeTime}.`
          : "Latest sync info not available yet, but Google Fit is connected.",
      };
    }

    return {
      tone: "info" as const,
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
    <div className="min-h-screen-safe w-full bg-background text-foreground overflow-hidden relative font-sans selection:bg-primary/30">
      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusChip
              label={statusDetails.label}
              tone={statusDetails.tone}
              className="cursor-default select-none"
              aria-live="polite"
              data-testid="chip-sync-status"
            >
              {isConnected && (
                <DesignButton
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  tone="ghost"
                  size="sm"
                  isSquare
                  aria-label="Disconnect Google Fit"
                  className="ml-2 border border-transparent hover:border-white/30 min-h-0"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-3.5 h-3.5 text-white/80 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5 text-white/80" />
                  )}
                </DesignButton>
              )}
            </StatusChip>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {statusDetails.tooltip}
          </TooltipContent>
        </Tooltip>

        <DesignButton
          onClick={handleSync}
          disabled={isSyncing}
          tone={isConnected ? "secondary" : "primary"}
          size="lg"
          className="group gap-2 min-h-[44px] min-w-[44px] backdrop-blur-md"
          data-testid="button-sync-fit"
          aria-label={isConnected ? "Sync fitness data" : "Connect Google Fit"}
          aria-pressed={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-white group-hover:rotate-180 group-focus-within:rotate-180 transition-transform duration-700 ease-in-out" />
          )}
          <span className="text-xs font-medium tracking-wide uppercase">
            {isConnected ? 'Sync Fit' : 'Connect Fit'}
          </span>
        </DesignButton>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <DesignButton
              tone="ghost"
              size="md"
              isSquare
              className="p-1 bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/40 min-h-[44px] min-w-[44px]"
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
            </DesignButton>
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
      <main className="relative z-10 min-h-screen-safe overflow-y-auto overscroll-contain scrollbar-hide p-4 md:p-8 lg:p-12 touch-pan-y">
        <div className="max-w-[1600px] mx-auto flex flex-col min-h-full">
            {children}
        </div>
      </main>
    </div>
  );
}
