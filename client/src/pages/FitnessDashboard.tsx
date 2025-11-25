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
  
  // Use AI insight for vitality description, fallback to dynamic description
  const getVitalityDescription = () => {
    // If we have AI insight, use it for vitality description too
    if (insight && insight !== 'No insights yet. Sync your Google Fit data to get started!') {
      return insight;
    }
    
    // Fallback to dynamic description based on metrics
    if (!latestMetric) return 'Sync your Google Fit data to unlock personalized insights about your overall energy and readiness.';
    const hasHighHRV = syncIndexScores.hrv >= 70;
    const hasGoodSleep = syncIndexScores.sleep >= 70;
    if (hasHighHRV && hasGoodSleep) {
      return `Your combination of ${hasHighHRV ? 'high HRV' : 'moderate HRV'} and ${hasGoodSleep ? 'consistent sleep' : 'variable sleep'} indicates excellent recovery capacity.`;
    }
    return 'Continue tracking your metrics to optimize your vitality score over time.';
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

      {/* Bento Grid Layout - Refined for full width */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)] pb-8">
        
        {/* 1. Sync Index (Score Tiles) */}
        <GlassCard 
            className="col-span-1 md:col-span-2 row-span-1 bg-gradient-to-br from-white/[0.08] to-transparent" 
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
            className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2" 
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
            className="col-span-1 md:col-span-2 row-span-2" 
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
            className="col-span-1 md:col-span-1 row-span-2" 
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
            className="col-span-1 md:col-span-1 row-span-1 md:row-span-2" 
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
            className="col-span-1 md:col-span-2 row-span-2" 
            title="Load Balancer" 
            subtitle="Strain vs Recovery Trends"
            delay={0.55}
        >
             <Suspense fallback={<LoadingChart />}>
                <LoadBalancer data={loadBalancerData} />
            </Suspense>
        </GlassCard>

         {/* 9. Context Card - Adjusted to fill space better */}
         <GlassCard 
            className="col-span-1 md:col-span-2 row-span-1 bg-primary/5 border-primary/20" 
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

        {/* 10. NEW SURPRISE COMPONENT: Vitality Orb */}
        <GlassCard 
            className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 bg-gradient-to-r from-black to-primary/5" 
            delay={0.7}
        >
             <Suspense fallback={<LoadingChart />}>
                <div className="flex items-center justify-between h-full pr-8">
                   <div className="w-1/3 h-full">
                      <VitalityOrb score={vitalityScore} hrv={syncIndexScores.hrv} sleep={syncIndexScores.sleep} />
                   </div>
                   <div className="w-2/3 text-right">
                      <h2 className="text-3xl font-display font-bold text-white">Vitality Score</h2>
                      <p className="text-white/40 mt-2 text-sm">
                        {getVitalityDescription()}
                      </p>
                   </div>
                </div>
            </Suspense>
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
