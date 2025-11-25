import React, { Suspense, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap, Battery, Brain, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFitnessData } from "@/hooks/useFitnessData";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  transformRecoveryRadarData,
  transformNerveCheckData,
  transformWellnessTriangleData,
  transformLoadBalancerData,
  transformMindShieldData,
  calculateSyncIndexScores,
} from "@/lib/chartData";

// Lazy Load Heavy Chart Components
const RecoveryRadar = React.lazy(() => import("@/components/charts/RecoveryRadar").then(module => ({ default: module.RecoveryRadar })));
const NerveCheck = React.lazy(() => import("@/components/charts/NerveCheck").then(module => ({ default: module.NerveCheck })));
const MindShield = React.lazy(() => import("@/components/charts/MindShield").then(module => ({ default: module.MindShield })));
const WellnessTriangle = React.lazy(() => import("@/components/charts/WellnessTriangle").then(module => ({ default: module.WellnessTriangle })));
const SyncIndex = React.lazy(() => import("@/components/charts/SyncIndex").then(module => ({ default: module.SyncIndex })));
const LoadBalancer = React.lazy(() => import("@/components/charts/LoadBalancer").then(module => ({ default: module.LoadBalancer })));
const VitalityOrb = React.lazy(() => import("@/components/charts/VitalityOrb").then(module => ({ default: module.VitalityOrb })));


const LoadingChart = () => (
  <div className="w-full h-full flex items-center justify-center text-white/20">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

export default function FitnessDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { 
    metrics, 
    latestMetric, 
    insight, 
    isLoading, 
    readinessScore, 
    readinessChange,
    strainScore 
  } = useFitnessData();

  const userName = user?.firstName || user?.email?.split('@')[0] || 'User';

  // Transform data for charts
  const recoveryRadarData = transformRecoveryRadarData(metrics);
  const nerveCheckData = transformNerveCheckData(metrics);
  const wellnessTriangleData = transformWellnessTriangleData(metrics);
  const loadBalancerData = transformLoadBalancerData(metrics);
  const mindShieldData = transformMindShieldData(metrics);
  const syncIndexScores = calculateSyncIndexScores(metrics);
  
  // Calculate vitality score (combination of readiness and recovery)
  const vitalityScore = latestMetric 
    ? Math.round((syncIndexScores.recovery + syncIndexScores.hrv + syncIndexScores.sleep) / 3)
    : 0;
  
  // Algorithmic Biometric Signature Analyzer - Pattern-based insights (not AI)
  const getBiometricSignature = () => {
    if (!latestMetric || metrics.length < 3) {
      return 'Sync more data to unlock your unique biometric signature pattern analysis.';
    }
    
    // Calculate 7-day metrics for trend analysis - keep data aligned!
    const recent7Days = metrics.slice(-7);
    
    // Build aligned arrays: only include days where BOTH metrics exist
    const alignedPairs = recent7Days.reduce((acc, m) => {
      if (m.rhr && m.sleepScore) {
        acc.rhrSleep.rhr.push(m.rhr);
        acc.rhrSleep.sleep.push(m.sleepScore);
      }
      if (m.hrv) acc.hrvValues.push(m.hrv);
      if (m.sleepScore) acc.sleepValues.push(m.sleepScore);
      return acc;
    }, {
      rhrSleep: { rhr: [] as number[], sleep: [] as number[] },
      hrvValues: [] as number[],
      sleepValues: [] as number[],
    });
    
    // Calculate Pearson correlation between RHR and Sleep Quality
    const calculateCorrelation = (x: number[], y: number[]) => {
      if (x.length !== y.length || x.length < 3) return 0; // Need at least 3 points
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      return denominator === 0 ? 0 : numerator / denominator;
    };
    
    // Detect trend direction (last 3 days vs previous days)
    const getTrend = (values: number[]) => {
      if (values.length < 5) return 'stable';
      const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const prevCount = values.length - 3;
      const previous = values.slice(0, -3).reduce((a, b) => a + b, 0) / prevCount;
      if (previous === 0) return 'stable'; // Avoid division by zero
      const change = ((recent - previous) / previous) * 100;
      if (change > 5) return 'improving';
      if (change < -5) return 'declining';
      return 'stable';
    };
    
    const rhrSleepCorr = calculateCorrelation(alignedPairs.rhrSleep.rhr, alignedPairs.rhrSleep.sleep);
    const hrvTrend = getTrend(alignedPairs.hrvValues);
    const hrvValues = alignedPairs.hrvValues;
    const sleepValues = alignedPairs.sleepValues;
    
    // Generate signature pattern
    const signatures = [
      // Strong negative RHR-Sleep correlation (good: lower RHR = better sleep)
      rhrSleepCorr < -0.5 && `⚡ Strong sleep-recovery coupling detected (r=${rhrSleepCorr.toFixed(2)})`,
      
      // HRV trend analysis
      hrvTrend === 'improving' && latestMetric.hrv && latestMetric.hrv > 60 && hrvValues.length >= 2 && hrvValues[0] > 0 &&
        `📈 Nervous system resilience trending upward (+${((hrvValues[hrvValues.length-1] / hrvValues[0] - 1) * 100).toFixed(1)}% in 7d)`,
      
      // Optimal zone detection
      latestMetric.rhr && latestMetric.rhr < 55 && latestMetric.sleepScore && latestMetric.sleepScore > 85 &&
        `🎯 Elite recovery zone: RHR ${latestMetric.rhr}bpm + sleep ${latestMetric.sleepScore}/100`,
      
      // Circadian stability pattern
      sleepValues.length >= 5 && sleepValues.length > 0 &&
        Math.max(...sleepValues) - Math.min(...sleepValues) < 20 &&
        `🌙 Circadian rhythm locked: ±${(Math.max(...sleepValues) - Math.min(...sleepValues)).toFixed(0)} variance`,
      
      // Recovery acceleration pattern
      latestMetric.recoveryScore && latestMetric.recoveryScore > 90 && 
        latestMetric.hrv && latestMetric.rhr && latestMetric.rhr > 0 && latestMetric.hrv > latestMetric.rhr * 0.8 &&
        `⚙️ Peak adaptation state: Recovery ${latestMetric.recoveryScore}/100, HRV:RHR ratio ${(latestMetric.hrv / latestMetric.rhr).toFixed(2)}`,
    ].filter(Boolean);
    
    // Fallback with safe array access
    const rhrVariance = alignedPairs.rhrSleep.rhr.length > 0 
      ? Math.round(Math.max(...alignedPairs.rhrSleep.rhr) - Math.min(...alignedPairs.rhrSleep.rhr))
      : 0;
    const sleepConsistency = sleepValues.length > 0 
      ? (100 - (Math.max(...sleepValues) - Math.min(...sleepValues))).toFixed(0)
      : 0;
    
    return signatures[0] || `Biometric variance: RHR ±${rhrVariance}bpm, Sleep consistency ${sleepConsistency}%`;
  };

  // Handle Google Fit callback notifications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Google Fit connected successfully!');
      window.history.replaceState({}, '', '/');
    } else if (params.get('error') === 'connection_failed') {
      toast.error('Failed to connect Google Fit. Please try again.');
      window.history.replaceState({}, '', '/');
    }
  }, [location]);

  return (
    <DashboardLayout>
      {/* Header Area - Simplified since nav is gone */}
      <header className="flex justify-between items-end mb-8 pt-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
             <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(132,204,22,0.8)]" data-testid="indicator-live" />
             <span className="text-xs font-mono text-primary uppercase tracking-widest">Live Biometrics</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight"
          >
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary" data-testid="text-username">{userName}</span>
          </motion.h1>
        </div>
      </header>

      {/* Bento Grid Layout - iPad Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)] pb-8">
        
        {/* 1. Sync Index (Score Tiles) */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 row-span-1 bg-gradient-to-br from-white/[0.08] to-transparent" 
            title="The Sync Index" 
            subtitle="Composite Physiological Score"
        >
            <Suspense fallback={<LoadingChart />}>
                <SyncIndex hrv={syncIndexScores.hrv} sleep={syncIndexScores.sleep} recovery={syncIndexScores.recovery} />
            </Suspense>
        </GlassCard>

        {/* 2. Key Metric - Readiness */}
        <GlassCard className="col-span-1 row-span-1 flex flex-col justify-between group cursor-pointer" delay={0.1}>
            <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors duration-300 shadow-[0_0_15px_rgba(132,204,22,0.1)] group-hover:shadow-[0_0_20px_rgba(132,204,22,0.6)]">
                    <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Readiness</span>
            </div>
            <div>
                <div className="text-5xl font-display font-bold text-white mb-1 group-hover:text-primary transition-colors" data-testid="text-readiness">
                  {readinessScore !== null ? `${readinessScore}%` : '--'}
                </div>
                <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    {readinessChange !== null && readinessChange > 0 && <ArrowUpRight className="w-3 h-3" />}
                    <span data-testid="text-readiness-change">
                      {readinessChange !== null ? `${readinessChange > 0 ? '+' : ''}${readinessChange}% vs yesterday` : 'No data'}
                    </span>
                </div>
            </div>
        </GlassCard>

         {/* 3. Key Metric - Strain */}
         <GlassCard className="col-span-1 row-span-1 flex flex-col justify-between group cursor-pointer" delay={0.15}>
            <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(255,0,153,0.1)] group-hover:shadow-[0_0_20px_rgba(255,0,153,0.6)]">
                    <Battery className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Strain</span>
            </div>
            <div>
                <div className="text-5xl font-display font-bold text-white mb-1 group-hover:text-accent transition-colors" data-testid="text-strain">
                  {strainScore !== null ? strainScore.toFixed(1) : '--'}
                </div>
                <div className="flex items-center gap-1 text-white/60 text-xs font-medium">
                    <span>{strainScore && strainScore > 10 ? 'Optimal Zone' : 'Low Activity'}</span>
                </div>
            </div>
        </GlassCard>

        {/* 4. Recovery Radar (3D Bubble) */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 row-span-2" 
            title="Recovery Radar" 
            subtitle="Workout Intensity vs Sleep vs RHR"
            delay={0.2}
        >
            <Suspense fallback={<LoadingChart />}>
                <RecoveryRadar data={recoveryRadarData} />
            </Suspense>
        </GlassCard>

        {/* 5. Nerve Check (Dual Line) */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 row-span-2" 
            title="Nerve Check" 
            subtitle="HRV Trends & Sleep Consistency"
            delay={0.3}
        >
            <Suspense fallback={<LoadingChart />}>
                <NerveCheck data={nerveCheckData} />
            </Suspense>
        </GlassCard>

        {/* 6. Wellness Triangle (Radar) - Multi-dimensional Health Score */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-1 row-span-2" 
            title="Wellness Triangle" 
            subtitle="Holistic Health Dimensions"
            delay={0.4}
        >
            <Suspense fallback={<LoadingChart />}>
                <WellnessTriangle data={wellnessTriangleData} />
            </Suspense>
        </GlassCard>

        {/* 7. MindShield (Heatmap) */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1 row-span-1 md:row-span-2" 
            title="MindShield" 
            subtitle="Sleep Consistency Map"
            delay={0.5}
        >
             <Suspense fallback={<LoadingChart />}>
                <MindShield data={mindShieldData} />
            </Suspense>
        </GlassCard>
        
        {/* 8. Load Balancer (Bar + Line) */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 row-span-2" 
            title="Load Balancer" 
            subtitle="Strain vs Recovery Trends"
            delay={0.55}
        >
             <Suspense fallback={<LoadingChart />}>
                <LoadBalancer data={loadBalancerData} />
            </Suspense>
        </GlassCard>

         {/* 9. Context Card - Daily AI Insight */}
         <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 row-span-1 bg-primary/5 border-primary/20" 
            delay={0.6}
        >
            <div className="flex items-center gap-6 h-full">
                <div className="p-5 rounded-full bg-primary/20 text-primary shadow-[0_0_20px_rgba(132,204,22,0.3)] animate-pulse">
                    <Brain className="w-10 h-10" />
                </div>
                <div>
                    <h4 className="text-xl font-medium text-white mb-1">Daily Insight</h4>
                    <p className="text-base text-white/60 max-w-lg" data-testid="text-daily-insight">
                        {insight || 'Sync your Google Fit data to receive personalized AI insights about your health and performance trends.'}
                    </p>
                </div>
            </div>
        </GlassCard>

        {/* 10. Vitality Orb with Biometric Signature */}
        <GlassCard 
            className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 row-span-1 bg-gradient-to-r from-black to-primary/5" 
            delay={0.7}
        >
             <Suspense fallback={<LoadingChart />}>
                <div className="flex items-center justify-between h-full pr-8">
                   <div className="w-1/3 h-full">
                      <VitalityOrb score={vitalityScore} hrv={syncIndexScores.hrv} sleep={syncIndexScores.sleep} />
                   </div>
                   <div className="w-2/3 text-right">
                      <h2 className="text-3xl font-display font-bold text-white">Vitality Score</h2>
                      <p className="text-white/60 mt-2 text-sm font-mono">
                        {getBiometricSignature()}
                      </p>
                   </div>
                </div>
            </Suspense>
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
