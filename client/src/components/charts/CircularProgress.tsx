import { motion } from "framer-motion";

interface CircularProgressProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  delay?: number;
}

export function CircularProgress({ 
  value, 
  max = 100, 
  color = "currentColor", 
  size = 80, 
  strokeWidth = 8,
  label,
  delay = 0
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Animated Fluid Spill Background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            `inset 0 0 0 0 ${color}22, 0 0 15px 0 ${color}33`,
            `inset 0 0 20px 0 ${color}33, 0 0 25px 0 ${color}22`,
            `inset 0 0 0 0 ${color}22, 0 0 15px 0 ${color}33`,
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay
        }}
      />
      
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible drop-shadow-lg">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        
        {/* Main Fluid Filling Stroke with Wave Effect */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ 
            strokeDashoffset: targetOffset,
            opacity: 1,
            filter: ['drop-shadow(0 0 5px rgba(0,0,0,0.3))', 'drop-shadow(0 0 15px rgba(0,0,0,0.5))', 'drop-shadow(0 0 5px rgba(0,0,0,0.3))']
          }}
          transition={{ 
            strokeDashoffset: { duration: 2.5, ease: [0.34, 1.56, 0.64, 1] },
            opacity: { duration: 0.5, delay: delay + 0.1 },
            filter: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }
          }}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.4))' }}
        />
        
        {/* Outer Glow/Aura Layer - Spilling Effect */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 6}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ 
            strokeDashoffset: targetOffset, 
            opacity: [0, 0.4, 0.2, 0.4, 0],
          }}
          transition={{ 
            strokeDashoffset: { duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: delay + 0.15 },
            opacity: { duration: 2.5, ease: "easeInOut", delay: delay + 0.15 }
          }}
          strokeLinecap="round"
          className="blur-sm"
        />

        {/* Ripple/Wave Effect - Spilling illusion */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ 
            strokeDashoffset: targetOffset,
            opacity: [0, 0.6, 0],
          }}
          transition={{ 
            strokeDashoffset: { duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: delay + 0.3 },
            opacity: { duration: 2.5, ease: "easeInOut", delay: delay + 0.3 }
          }}
          strokeLinecap="round"
          className="blur-md"
        />
      </svg>
      
      {/* Animated Value Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.5 }}
          className="text-lg font-display font-bold text-white"
        >
          {value}
        </motion.span>
        {label && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.8 }}
            className="text-[8px] font-mono text-white/50"
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}
