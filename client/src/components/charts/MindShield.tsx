import { mockData } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function MindShield() {
  // Create a 4x7 grid (28 days)
  const data = mockData.slice(-28).reverse();

  const getColor = (score: number) => {
    if (score >= 90) return "bg-primary";
    if (score >= 70) return "bg-primary/60";
    if (score >= 50) return "bg-white/20";
    return "bg-destructive/60";
  };

  return (
    <div className="h-full w-full flex flex-col justify-center">
      <div className="grid grid-cols-7 gap-2 w-full">
        {data.map((day, i) => (
          <div 
            key={i} 
            className="group relative aspect-square rounded-md overflow-hidden"
          >
            <div 
              className={cn(
                "w-full h-full transition-all duration-300 group-hover:scale-110",
                getColor(day.sleepScore)
              )} 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-bold text-black">{day.sleepScore}</span>
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
