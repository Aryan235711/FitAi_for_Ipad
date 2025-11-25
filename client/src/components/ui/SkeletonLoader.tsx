import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'chart' | 'metric' | 'text';
  className?: string;
}

export function SkeletonLoader({ variant = 'card', className = '' }: SkeletonLoaderProps) {
  const shimmer = {
    initial: { backgroundPosition: '200% 0' },
    animate: { backgroundPosition: '-200% 0' },
  };

  const baseClass = 'bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-lg';
  
  const variants = {
    card: `${baseClass} h-40 w-full`,
    chart: `${baseClass} h-64 w-full`,
    metric: `${baseClass} h-20 w-full`,
    text: `${baseClass} h-4 w-3/4`,
  };

  return (
    <motion.div
      className={`${variants[variant]} ${className}`}
      animate={{
        backgroundPosition: ['-200% 0', '200% 0'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6">
      <SkeletonLoader variant="text" className="h-6 w-1/3 mb-4" />
      <div className="flex-1 flex gap-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonLoader key={i} variant="chart" className="flex-1 h-32" />
        ))}
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <div className="flex justify-between items-start">
        <SkeletonLoader variant="metric" className="h-10 w-10 rounded-2xl" />
        <SkeletonLoader variant="text" className="h-3 w-16" />
      </div>
      <div className="space-y-2">
        <SkeletonLoader variant="text" className="h-8 w-20" />
        <SkeletonLoader variant="text" className="h-4 w-24" />
      </div>
    </div>
  );
}
