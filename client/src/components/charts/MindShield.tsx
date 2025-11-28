import { cn } from "@/lib/utils";
import { memo, CSSProperties } from "react";
import "./heatmap-effects.css";

interface MindShieldDataPoint {
  day: string;
  week: string;
  value: number;
}

interface MindShieldProps {
  data?: MindShieldDataPoint[];
}

function MindShieldComponent({ data = [] }: MindShieldProps) {
  // Use provided data or fallback to empty array  
  const heatmapData = data.length > 0 ? data : Array(28).fill({ day: 'Mon', week: 'W1', value: 0 });

  const getColor = (score: number) => {
    if (score >= 90) return "bg-primary";
    if (score >= 70) return "bg-primary/60";
    if (score >= 50) return "bg-white/20";
    return "bg-destructive/60";
  };

  return (
    <div className="h-full w-full flex flex-col justify-center mind-shield-animated">
      <div className="grid grid-cols-7 gap-2 w-full">
        {heatmapData.map((item, i) => (
          <div 
            key={i} 
            className="group relative aspect-square rounded-md overflow-hidden cursor-pointer"
          >
            <div 
              className={cn(
                "w-full h-full transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110 mind-shield-cell",
                getColor(item.value)
              )}
              style={{ "--cell-index": i } as CSSProperties}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
               <span className="text-[10px] font-bold text-white drop-shadow-lg">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 text-[10px] text-white/40 uppercase tracking-widest font-mono">
        <span>Less Stable</span>
        <span>Resilient</span>
      </div>
    </div>
  );
}

export const MindShield = memo(MindShieldComponent);
