import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/lib/api';

export function useFitnessData(days: number = 30) {
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
  const derivedMetrics = useMemo(() => {
    const latestMetric = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
    const previousMetric = metrics && metrics.length > 1 ? metrics[metrics.length - 2] : null;

    // Calculate readiness score (simplified formula)
    const readinessScore = latestMetric
      ? Math.min(100, Math.round(
          ((latestMetric.sleepScore !== null && latestMetric.sleepScore !== undefined ? latestMetric.sleepScore : 70) * 0.4) +
          ((latestMetric.recoveryScore !== null && latestMetric.recoveryScore !== undefined ? latestMetric.recoveryScore : 70) * 0.3) +
          ((latestMetric.hrv !== null && latestMetric.hrv !== undefined ? latestMetric.hrv : 50) * 0.3)
        ))
      : null;

    const previousReadiness = previousMetric
      ? Math.min(100, Math.round(
          ((previousMetric.sleepScore !== null && previousMetric.sleepScore !== undefined ? previousMetric.sleepScore : 70) * 0.4) +
          ((previousMetric.recoveryScore !== null && previousMetric.recoveryScore !== undefined ? previousMetric.recoveryScore : 70) * 0.3) +
          ((previousMetric.hrv !== null && previousMetric.hrv !== undefined ? previousMetric.hrv : 50) * 0.3)
        ))
      : null;

    const readinessChange = (readinessScore !== null && previousReadiness !== null)
      ? readinessScore - previousReadiness
      : null;

    // Calculate strain (simplified - based on workout intensity and steps)
    const strainScore = latestMetric
      ? Math.min(20, Math.round(
          ((latestMetric.workoutIntensity !== null && latestMetric.workoutIntensity !== undefined ? latestMetric.workoutIntensity : 0) * 0.1) +
          ((latestMetric.steps !== null && latestMetric.steps !== undefined ? latestMetric.steps : 0) / 1000)
        ))
      : null;

    return {
      latestMetric,
      previousMetric,
      readinessScore,
      readinessChange,
      strainScore,
    };
  }, [metrics]);

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
