import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { createQueryClientWrapper } from '@/test/queryClientWrapper';

const getUserMock = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getUser: (...args: unknown[]) => getUserMock(...args),
  },
}));

const mockGetE2EState = vi.fn();
let mockIsE2E = false;

vi.mock('@/lib/e2eState', () => ({
  getE2EState: () => mockGetE2EState(),
  get isE2EMode() {
    return mockIsE2E;
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    mockIsE2E = false;
    mockGetE2EState.mockReset();
    getUserMock.mockReset();
  });

  it('returns loading placeholder when E2E auth is still resolving', () => {
    mockIsE2E = true;
    mockGetE2EState.mockReturnValue({ auth: { isLoading: true } });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeUndefined();
  });

  it('returns deterministic user state when E2E auth is hydrated', () => {
    mockIsE2E = true;
    mockGetE2EState.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { firstName: 'Testy' },
      },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toMatchObject({
      id: 'e2e-user',
      email: 'test@example.com',
      firstName: 'Testy',
    });
  });

  it('fetches the user via react-query when not in E2E mode', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    const mockUser = { id: 'user-1', email: 'dash@example.com' };
    getUserMock.mockResolvedValue(mockUser);

    const { wrapper, queryClient } = createQueryClientWrapper();
    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    unmount();
    queryClient.clear();
  });

  it('surfaces query errors and flags the user as unauthenticated', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getUserMock.mockRejectedValue(new Error('unauthorized'));

    const { wrapper, queryClient } = createQueryClientWrapper();
    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeUndefined();

    unmount();
    queryClient.clear();
  });
});
