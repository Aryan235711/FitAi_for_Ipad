import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGoogleFit } from '../useGoogleFit';
import { createQueryClientWrapper } from '@/test/queryClientWrapper';

interface ApiErrorLike extends Error {
  status: number;
  errorType?: string;
}

type ApiErrorConstructor = new (message: string, status: number, errorType?: string) => ApiErrorLike;

const {
  getGoogleFitStatusMock,
  getGoogleFitAuthUrlMock,
  disconnectGoogleFitMock,
  syncGoogleFitMock,
  ApiErrorCtorRef,
} = vi.hoisted(() => ({
  getGoogleFitStatusMock: vi.fn(),
  getGoogleFitAuthUrlMock: vi.fn(),
  disconnectGoogleFitMock: vi.fn(),
  syncGoogleFitMock: vi.fn(),
  ApiErrorCtorRef: { value: null as ApiErrorConstructor | null },
}));

vi.mock('@/lib/api', () => {
  class MockApiError extends Error {
    status: number;
    errorType?: string;

    constructor(message: string, status: number, errorType?: string) {
      super(message);
      this.status = status;
      this.errorType = errorType;
    }
  }

  ApiErrorCtorRef.value = MockApiError;

  return {
    api: {
      getGoogleFitStatus: (...args: unknown[]) => getGoogleFitStatusMock(...args),
      getGoogleFitAuthUrl: (...args: unknown[]) => getGoogleFitAuthUrlMock(...args),
      disconnectGoogleFit: (...args: unknown[]) => disconnectGoogleFitMock(...args),
      syncGoogleFit: (...args: unknown[]) => syncGoogleFitMock(...args),
    },
    ApiError: MockApiError,
  };
});

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
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

describe('useGoogleFit', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: 'http://localhost' } as Location,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    mockIsE2E = false;
    mockGetE2EState.mockReset();
    getGoogleFitStatusMock.mockReset();
    getGoogleFitAuthUrlMock.mockReset();
    disconnectGoogleFitMock.mockReset();
    syncGoogleFitMock.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it('returns deterministic overrides while running E2E specs', () => {
    mockIsE2E = true;
    mockGetE2EState.mockReturnValue({
      googleFitStatus: {
        connected: false,
        hasSyncedData: false,
        lastSyncedAt: '2024-01-02T00:00:00Z',
      },
    });

    const { result } = renderHook(() => useGoogleFit());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.hasSyncedData).toBe(false);
    expect(result.current.lastSyncedAt).toBe('2024-01-02T00:00:00Z');
    expect(result.current.isLoading).toBe(false);
  });

  it('hydrates Google Fit status through react-query when not in E2E mode', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getGoogleFitStatusMock.mockResolvedValue({
      connected: true,
      hasSyncedData: true,
      lastSyncedAt: '2024-01-03T00:00:00Z',
    });

    const { wrapper, queryClient } = createQueryClientWrapper();
    const { result, unmount } = renderHook(() => useGoogleFit(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getGoogleFitStatusMock).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.lastSyncedAt).toBe('2024-01-03T00:00:00Z');

    unmount();
    queryClient.clear();
  });

  it('redirects to Google auth url when connect is called', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getGoogleFitStatusMock.mockResolvedValue({ connected: false });
    getGoogleFitAuthUrlMock.mockResolvedValue({ authUrl: 'https://accounts.google.com/auth' });

    const { wrapper, queryClient } = createQueryClientWrapper();
    const { result, unmount } = renderHook(() => useGoogleFit(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.connect();
    });

    await waitFor(() => expect(getGoogleFitAuthUrlMock).toHaveBeenCalled());
    expect(window.location.href).toBe('https://accounts.google.com/auth');

    unmount();
    queryClient.clear();
  });

  it('disconnects and invalidates cached status', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getGoogleFitStatusMock.mockResolvedValue({ connected: true });
    disconnectGoogleFitMock.mockResolvedValue({ success: true });

    const { wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result, unmount } = renderHook(() => useGoogleFit(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => expect(disconnectGoogleFitMock).toHaveBeenCalled());
    expect(toastSuccess).toHaveBeenCalledWith('Google Fit disconnected');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['google-fit-status'] });

    unmount();
    queryClient.clear();
  });

  it('syncs data, invalidates dependent queries, and surfaces success messaging', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getGoogleFitStatusMock.mockResolvedValue({ connected: true });
    syncGoogleFitMock.mockResolvedValue({ success: true, synced: 2, message: 'Synced 2 days' });

    const { wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result, unmount } = renderHook(() => useGoogleFit(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sync(undefined);
    });

    await waitFor(() => expect(syncGoogleFitMock).toHaveBeenCalled());

    expect(toastSuccess).toHaveBeenCalledWith('Synced 2 days');
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey?.[0]);
    expect(invalidatedKeys).toEqual(expect.arrayContaining(['fitness-metrics', 'latest-insight', 'google-fit-status']));

    unmount();
    queryClient.clear();
  });

  it('maps ApiError types to friendlier toast copy', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getGoogleFitStatusMock.mockResolvedValue({ connected: true });
    const ApiErrorCtor = ApiErrorCtorRef.value!;
    syncGoogleFitMock.mockRejectedValue(new ApiErrorCtor('Forbidden', 403, 'GoogleApiForbidden'));

    const { wrapper, queryClient } = createQueryClientWrapper();
    const { result, unmount } = renderHook(() => useGoogleFit(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sync(undefined);
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Google Fit denied the request. Reconnect and try again.'));

    unmount();
    queryClient.clear();
  });
});
