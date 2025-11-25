import { syncIndexScores } from "@/lib/mockData";
import { CircularProgress } from "./CircularProgress";

export function SyncIndex() {
  return (
    <div className="grid grid-cols-3 gap-4 h-full items-center">
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={syncIndexScores.recovery} color="var(--color-primary)" label="REC" delay={0.2} />
        <span className="text-xs font-mono text-white/50 uppercase mt-2">Recovery</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={syncIndexScores.adaptation} color="var(--color-secondary)" label="ADP" delay={0.4} />
        <span className="text-xs font-mono text-white/50 uppercase mt-2">Adaptation</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={syncIndexScores.metabolic} color="var(--color-accent)" label="MET" delay={0.6} />
        <span className="text-xs font-mono text-white/50 uppercase mt-2">Metabolic</span>
      </div>
    </div>
  );
}
