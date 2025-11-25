interface CircularProgressProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function CircularProgress({ 
  value, 
  max = 100, 
  color = "currentColor", 
  size = 80, 
  strokeWidth = 8,
  label
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-display font-bold text-white">{value}</span>
        {label && <span className="text-[8px] font-mono text-white/50">{label}</span>}
      </div>
    </div>
  );
}
