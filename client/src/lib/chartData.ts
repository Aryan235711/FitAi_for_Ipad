import type { FitnessMetric } from './api';

// Transform fitness metrics for RecoveryRadar (3D Bubble Chart)
export function transformRecoveryRadarData(metrics: FitnessMetric[]) {
  return metrics.map((m) => ({
    x: m.workoutIntensity || 0,
    y: m.sleepScore || 0,
    z: m.rhr || 60,
    name: m.date,
  })).slice(-7); // Last 7 days
}

// Transform fitness metrics for NerveCheck (Dual Line Chart)
export function transformNerveCheckData(metrics: FitnessMetric[]) {
  return metrics.map((m) => ({
    date: m.date,
    hrv: m.hrv || 0,
    sleepConsistency: m.sleepConsistency || 0,
  })).slice(-14); // Last 14 days
}

// Transform fitness metrics for MindShield (Heatmap)
export function transformMindShieldData(metrics: FitnessMetric[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = 4;
  
  const heatmapData = [];
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const index = week * 7 + day;
      const metric = metrics[metrics.length - 28 + index]; // Last 4 weeks
      heatmapData.push({
        day: days[day],
        week: `W${week + 1}`,
        value: metric?.sleepConsistency || 0,
      });
    }
  }
  return heatmapData;
}

// Transform fitness metrics for FuelAnalyzer (Radar Chart)
export function transformFuelAnalyzerData(metrics: FitnessMetric[]) {
  const latest = metrics[metrics.length - 1];
  if (!latest) return [];
  
  return [
    { subject: 'Protein', A: latest.protein || 0, fullMark: 200 },
    { subject: 'Carbs', A: latest.carbs || 0, fullMark: 300 },
    { subject: 'Fats', A: latest.fats || 0, fullMark: 100 },
    { subject: 'Calories', A: latest.calories || 0, fullMark: 3000 },
  ];
}

// Transform fitness metrics for LoadBalancer (Bar + Line Chart)
export function transformLoadBalancerData(metrics: FitnessMetric[]) {
  return metrics.map((m) => ({
    date: m.date,
    strain: m.workoutIntensity || 0,
    recovery: m.recoveryScore || 0,
  })).slice(-7); // Last 7 days
}

// Calculate Sync Index scores
export function calculateSyncIndexScores(metrics: FitnessMetric[]) {
  const latest = metrics[metrics.length - 1];
  if (!latest) {
    return {
      hrv: 0,
      sleep: 0,
      recovery: 0,
    };
  }
  
  return {
    hrv: latest.hrv || 0,
    sleep: latest.sleepScore || 0,
    recovery: latest.recoveryScore || 0,
  };
}
