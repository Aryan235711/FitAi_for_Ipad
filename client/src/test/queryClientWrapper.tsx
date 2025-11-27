import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const testLogger = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

export function createQueryClientWrapper(existingClient?: QueryClient) {
  const queryClient = existingClient ?? new QueryClient({
    logger: testLogger,
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, wrapper: Wrapper } as const;
}
