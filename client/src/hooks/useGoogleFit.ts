import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';

function getFriendlyErrorMessage(fallback: string, error: unknown) {
  if (error instanceof ApiError) {
    switch (error.errorType) {
      case 'MissingOAuthConsent':
        return 'Please connect Google Fit before syncing.';
      case 'StaleRefreshToken':
        return 'Google Fit access expired. Tap Connect to refresh permissions.';
      case 'GoogleApiForbidden':
        return 'Google Fit denied the request. Reconnect and try again.';
      default:
        return error.message || fallback;
    }
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function useGoogleFit() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['google-fit-status'],
    queryFn: () => api.getGoogleFitStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { authUrl } = await api.getGoogleFitAuthUrl();
      window.location.href = authUrl;
    },
    onError: (error: unknown) => {
      toast.error(getFriendlyErrorMessage('Failed to connect to Google Fit.', error));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.disconnectGoogleFit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-fit-status'] });
      toast.success('Google Fit disconnected');
    },
    onError: (error: unknown) => {
      toast.error(getFriendlyErrorMessage('Failed to disconnect Google Fit.', error));
    },
  });

  const syncMutation = useMutation({
    mutationFn: (params?: { startDate?: string; endDate?: string }) => 
      api.syncGoogleFit(params?.startDate, params?.endDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fitness-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['latest-insight'] });
      queryClient.invalidateQueries({ queryKey: ['google-fit-status'] });
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      toast.error(getFriendlyErrorMessage('Sync failed. Please try again.', error));
    },
  });

  return {
    status,
    isLoading,
    isConnected: status?.connected || false,
    hasSyncedData: status?.hasSyncedData || false,
    lastSyncedAt: status?.lastSyncedAt || null,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
