import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api, type FitnessMetric } from '@/lib/api';
import { getE2EState, isE2EMode } from '@/lib/e2eState';

const mockMetrics: FitnessMetric[] = Array.from({ length: 10 }).map((_, idx) => {
  const day = idx + 1;
  return {
    id: day,
    userId: 'e2e-user',
    date: `2024-01-${String(day).padStart(2, '0')}`,
    recoveryScore: 70 + (idx % 10),
    sleepScore: 65 + (idx % 12),
    hrv: 60 + (idx % 8),
    steps: 5000 + idx * 500,
    workoutIntensity: 40 + idx,
    sleepConsistency: 70,
    rhr: 55 - (idx % 5),
  } as FitnessMetric;
});

function deriveMetrics(metrics: FitnessMetric[]) {
  const latestMetric = metrics.at(-1) ?? null;
  const previousMetric = metrics.length > 1 ? metrics.at(-2)! : null;

  const readinessScore = latestMetric
    ? Math.min(100, Math.round(
        ((latestMetric.sleepScore ?? 70) * 0.4) +
        ((latestMetric.recoveryScore ?? 70) * 0.3) +
        ((latestMetric.hrv ?? 50) * 0.3)
      ))
    : null;

  const previousReadiness = previousMetric
    ? Math.min(100, Math.round(
        ((previousMetric.sleepScore ?? 70) * 0.4) +
        ((previousMetric.recoveryScore ?? 70) * 0.3) +
        ((previousMetric.hrv ?? 50) * 0.3)
      ))
    : null;

  const readinessChange = readinessScore !== null && previousReadiness !== null
    ? readinessScore - previousReadiness
    : null;

  const strainScore = latestMetric
    ? Math.min(20, Math.round(
        ((latestMetric.workoutIntensity ?? 0) * 0.1) +
        ((latestMetric.steps ?? 0) / 1000)
      ))
    : null;

  return {
    latestMetric,
    previousMetric,
    readinessScore,
    readinessChange,
    strainScore,
  };
}

export function useFitnessData(days: number = 30) {
  if (isE2EMode) {
    const e2eState = getE2EState()?.fitness;
    if (e2eState?.isLoading) {
      return {
        metrics: [],
        latestMetric: null,
        previousMetric: null,
        insight: null,
        isLoading: true,
        error: null,
        readinessScore: null,
        readinessChange: null,
        strainScore: null,
      } as const;
    }

    const fitnessError = e2eState?.errorMessage ? new Error(e2eState.errorMessage) : null;
    const data = e2eState?.metrics ?? mockMetrics;
    const derived = deriveMetrics(data);
    return {
      metrics: data,
      latestMetric: derived.latestMetric,
      previousMetric: derived.previousMetric,
      insight: e2eState?.insight ?? 'Sync more data to unlock AI guidance.',
      isLoading: false,
      error: fitnessError,
      readinessScore: derived.readinessScore,
      readinessChange: derived.readinessChange,
      strainScore: derived.strainScore,
    } as const;
  }

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['fitness-metrics', days],
    queryFn: () => api.getMetrics(days),
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for better caching
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const { data: insight } = useQuery({
    queryKey: ['latest-insight'],
    queryFn: () => api.getLatestInsight(),
    staleTime: 10 * 60 * 1000, // 10 minutes - increased for better caching
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Memoize derived metrics to prevent unnecessary recalculations on every render
  const derivedMetrics = useMemo(() => deriveMetrics(metrics || []), [metrics]);

  return {
    metrics: metrics || [],
    latestMetric: derivedMetrics.latestMetric,
    previousMetric: derivedMetrics.previousMetric,
    insight: insight?.content || null,
    isLoading,
    error,
    // Derived metrics
    readinessScore: derivedMetrics.readinessScore,
    readinessChange: derivedMetrics.readinessChange,
    strainScore: derivedMetrics.strainScore,
  };
}
