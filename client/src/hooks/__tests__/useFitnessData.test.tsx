import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFitnessData } from '../useFitnessData';
import { createQueryClientWrapper } from '@/test/queryClientWrapper';
import type { FitnessMetric } from '@/lib/api';

const getMetricsMock = vi.fn();
const getLatestInsightMock = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getMetrics: (...args: unknown[]) => getMetricsMock(...args),
    getLatestInsight: (...args: unknown[]) => getLatestInsightMock(...args),
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

describe('useFitnessData', () => {
  const sampleMetrics: FitnessMetric[] = [
    {
      id: 1,
      userId: 'user',
      date: '2024-01-01',
      sleepScore: 80,
      recoveryScore: 75,
      hrv: 60,
      steps: 6000,
      workoutIntensity: 45,
    },
    {
      id: 2,
      userId: 'user',
      date: '2024-01-02',
      sleepScore: 85,
      recoveryScore: 85,
      hrv: 70,
      steps: 8000,
      workoutIntensity: 60,
    },
  ];

  beforeEach(() => {
    mockIsE2E = false;
    mockGetE2EState.mockReset();
    getMetricsMock.mockReset();
    getLatestInsightMock.mockReset();
  });

  it('returns loading placeholders when E2E fitness state is pending', () => {
    mockIsE2E = true;
    mockGetE2EState.mockReturnValue({ fitness: { isLoading: true } });

    const { result } = renderHook(() => useFitnessData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.metrics).toHaveLength(0);
    expect(result.current.readinessScore).toBeNull();
  });

  it('surfaces E2E injected errors', () => {
    mockIsE2E = true;
    mockGetE2EState.mockReturnValue({ fitness: { errorMessage: 'No metrics' } });

    const { result } = renderHook(() => useFitnessData());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('No metrics');
  });

  it('derives readiness and strain metrics from E2E data', () => {
    mockIsE2E = true;
    mockGetE2EState.mockReturnValue({
      fitness: {
        metrics: sampleMetrics,
        insight: 'Custom insight',
      },
    });

    const { result } = renderHook(() => useFitnessData());

    expect(result.current.readinessScore).toBe(81);
    expect(result.current.readinessChange).toBe(8);
    expect(result.current.strainScore).toBe(14);
    expect(result.current.insight).toBe('Custom insight');
  });

  it('fetches metrics and insights via react-query when not in E2E mode', async () => {
    mockIsE2E = false;
    mockGetE2EState.mockReturnValue(null);
    getMetricsMock.mockResolvedValue(sampleMetrics);
    getLatestInsightMock.mockResolvedValue({ content: 'Keep resting' });

    const { wrapper, queryClient } = createQueryClientWrapper();
    const { result, unmount } = renderHook(() => useFitnessData(), { wrapper });

    await waitFor(() => expect(result.current.metrics.length).toBeGreaterThan(0));

    expect(getMetricsMock).toHaveBeenCalledWith(30);
    expect(result.current.readinessScore).toBe(81);
    expect(result.current.insight).toBe('Keep resting');
    expect(result.current.isLoading).toBe(false);

    unmount();
    queryClient.clear();
  });
});
