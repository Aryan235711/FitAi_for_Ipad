import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getE2EState, isE2EMode } from '@/lib/e2eState';

export function useAuth() {
  if (isE2EMode) {
    const state = getE2EState()?.auth;

    if (state?.isLoading) {
      return {
        user: undefined,
        isLoading: true,
        isAuthenticated: false,
        error: null,
      } as const;
    }

    const isAuthenticated = state?.isAuthenticated ?? true;
    return {
      user: isAuthenticated ? { id: 'e2e-user', email: 'test@example.com', ...state?.user } : undefined,
      isLoading: false,
      isAuthenticated,
      error: null,
    } as const;
  }

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.getUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
