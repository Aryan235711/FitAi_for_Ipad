import React, { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap, Battery, Brain, Loader2 } from "lucide-react";

// Lazy Load Heavy Chart Components
const RecoveryRadar = React.lazy(() => import("@/components/charts/RecoveryRadar").then(module => ({ default: module.RecoveryRadar })));
const NerveCheck = React.lazy(() => import("@/components/charts/NerveCheck").then(module => ({ default: module.NerveCheck })));
const MindShield = React.lazy(() => import("@/components/charts/MindShield").then(module => ({ default: module.MindShield })));
const FuelAnalyzer = React.lazy(() => import("@/components/charts/FuelAnalyzer").then(module => ({ default: module.FuelAnalyzer })));
const SyncIndex = React.lazy(() => import("@/components/charts/SyncIndex").then(module => ({ default: module.SyncIndex })));
const LoadBalancer = React.lazy(() => import("@/components/charts/LoadBalancer").then(module => ({ default: module.LoadBalancer })));

const LoadingChart = () => (
  <div className="w-full h-full flex items-center justify-center text-white/20">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

export default function FitnessDashboard() {
  return (
    <DashboardLayout>
      {/* Header */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight"
          >
            Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Alex</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 mt-2 font-mono"
          >
            Your metabolic sync is <span className="text-primary">optimised</span> today.
          </motion.p>
        </div>
        <div className="flex gap-4">
           {/* Quick Stats */}
           <div className="glass rounded-full px-6 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <span className="text-sm font-mono text-white/80">Google Fit: Live</span>
           </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* 1. Sync Index (Score Tiles) - Large Feature */}
        <GlassCard 
            className="col-span-1 md:col-span-2 row-span-1 bg-gradient-to-br from-white/[0.08] to-transparent" 
            title="The Sync Index" 
            subtitle="Composite Physiological Score"
        >
            <Suspense fallback={<LoadingChart />}>
                <SyncIndex />
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
                <div className="text-4xl font-display font-bold text-white mb-1 group-hover:text-primary transition-colors">92%</div>
                <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+4% vs yesterday</span>
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
                <div className="text-4xl font-display font-bold text-white mb-1 group-hover:text-accent transition-colors">14.5</div>
                <div className="flex items-center gap-1 text-white/60 text-xs font-medium">
                    <span>Optimal Zone</span>
                </div>
            </div>
        </GlassCard>

        {/* 4. Recovery Radar (3D Bubble) - Large Visual */}
        <GlassCard 
            className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2" 
            title="Recovery Radar" 
            subtitle="Workout Intensity vs Sleep vs RHR"
            delay={0.2}
        >
            <Suspense fallback={<LoadingChart />}>
                <RecoveryRadar />
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
                <NerveCheck />
            </Suspense>
        </GlassCard>

        {/* 6. Fuel Analyzer (Radar) */}
        <GlassCard 
            className="col-span-1 md:col-span-1 row-span-2" 
            title="Fuel Analyzer" 
            subtitle="Nutrient Balance"
            delay={0.4}
        >
            <Suspense fallback={<LoadingChart />}>
                <FuelAnalyzer />
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
                <MindShield />
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
                <LoadBalancer />
            </Suspense>
        </GlassCard>

         {/* 9. Context Card */}
         <GlassCard 
            className="col-span-1 md:col-span-2 row-span-1 bg-primary/5 border-primary/20" 
            delay={0.6}
        >
            <div className="flex items-center gap-4 h-full">
                <div className="p-4 rounded-full bg-primary/20 text-primary shadow-[0_0_15px_rgba(132,204,22,0.3)]">
                    <Brain className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="text-lg font-medium text-white">Insight</h4>
                    <p className="text-sm text-white/60 max-w-md">
                        Your high protein intake yesterday correlated with a <span className="text-primary font-bold">12% boost</span> in Deep Sleep duration.
                    </p>
                </div>
            </div>
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
