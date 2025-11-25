import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useFitnessData(days: number = 30) {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['fitness-metrics', days],
    queryFn: () => api.getMetrics(days),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: insight } = useQuery({
    queryKey: ['latest-insight'],
    queryFn: () => api.getLatestInsight(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate derived metrics from the data
  const latestMetric = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const previousMetric = metrics && metrics.length > 1 ? metrics[metrics.length - 2] : null;

  // Calculate readiness score (simplified formula)
  const readinessScore = latestMetric
    ? Math.min(100, Math.round(
        ((latestMetric.sleepScore || 70) * 0.4) +
        ((latestMetric.recoveryScore || 70) * 0.3) +
        ((latestMetric.hrv || 50) * 0.3)
      ))
    : null;

  const previousReadiness = previousMetric
    ? Math.min(100, Math.round(
        ((previousMetric.sleepScore || 70) * 0.4) +
        ((previousMetric.recoveryScore || 70) * 0.3) +
        ((previousMetric.hrv || 50) * 0.3)
      ))
    : null;

  const readinessChange = readinessScore && previousReadiness
    ? readinessScore - previousReadiness
    : null;

  // Calculate strain (simplified - based on workout intensity and steps)
  const strainScore = latestMetric
    ? Math.min(20, Math.round(
        ((latestMetric.workoutIntensity || 0) * 0.1) +
        ((latestMetric.steps || 0) / 1000)
      ))
    : null;

  return {
    metrics: metrics || [],
    latestMetric,
    previousMetric,
    insight: insight?.content || null,
    isLoading,
    error,
    // Derived metrics
    readinessScore,
    readinessChange,
    strainScore,
  };
}
