import { describe, it, expect } from "vitest";
import type { FitnessMetric } from "../api";
import {
  transformRecoveryRadarData,
  transformMindShieldData,
  transformWellnessTriangleData,
  calculateSyncIndexScores,
} from "../chartData";

const buildMetric = (overrides: Partial<FitnessMetric>, index: number): FitnessMetric => ({
  id: index + 1,
  userId: "tester",
  date: `2024-01-${String(index + 1).padStart(2, "0")}`,
  rhr: 55 + (index % 5),
  hrv: 70 + (index % 10),
  sleepScore: 80 - (index % 7),
  sleepConsistency: 65 + (index % 6),
  workoutIntensity: 50 + (index % 8),
  recoveryScore: 75 + (index % 9),
  ...overrides,
});

const metrics: FitnessMetric[] = Array.from({ length: 30 }, (_, index) => buildMetric({}, index));

describe("chart data transformers", () => {
  it("returns only the last 7 entries for recovery radar", () => {
    const result = transformRecoveryRadarData(metrics);
    expect(result).toHaveLength(7);
    expect(result.at(-1)?.name).toBe("2024-01-30");
  });

  it("produces a fixed 28 cell heatmap for mind shield", () => {
    const result = transformMindShieldData(metrics);
    expect(result).toHaveLength(28);
    expect(result[0]).toHaveProperty("day");
    expect(result[0]).toHaveProperty("week");
  });

  it("normalizes rhr inside wellness triangle data", () => {
    const result = transformWellnessTriangleData(metrics);
    expect(result).toHaveLength(4);
    const rhrEntry = result.find((entry) => entry.subject === "RHR");
    expect(rhrEntry?.A).toBeGreaterThan(0);
    expect(rhrEntry?.A).toBeLessThanOrEqual(100);
  });

  it("falls back to zero sync scores when no metrics exist", () => {
    expect(calculateSyncIndexScores([])).toEqual({ hrv: 0, sleep: 0, recovery: 0 });
  });
});
