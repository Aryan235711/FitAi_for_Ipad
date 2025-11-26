import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { tokens } from "@/design";

const toneMap = {
  success: {
    dot: tokens.colors.success,
    background: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.4)",
    text: "#A7F3D0",
  },
  warning: {
    dot: tokens.colors.warning,
    background: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.5)",
    text: "#FDE68A",
  },
  danger: {
    dot: tokens.colors.error,
    background: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.4)",
    text: "#FECACA",
  },
  info: {
    dot: tokens.colors.primary[500],
    background: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.4)",
    text: "#BFDBFE",
  },
} as const;

type StatusTone = keyof typeof toneMap;

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  children?: ReactNode;
  "aria-live"?: "off" | "polite" | "assertive";
}

export function StatusChip({ label, tone = "info", className, children, "aria-live": ariaLive }: StatusChipProps) {
  const palette = toneMap[tone];

  const chipStyle: CSSProperties = {
    padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
    borderRadius: tokens.radii.full,
    border: `1px solid ${palette.border}`,
    background: palette.background,
    color: palette.text,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: Number(tokens.typography.weights.medium),
    letterSpacing: "0.08em",
  };

  const dotStyle: CSSProperties = {
    backgroundColor: palette.dot,
    boxShadow: `0 0 12px ${palette.dot}`,
    height: "0.55rem",
    width: "0.55rem",
  };

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      style={chipStyle}
      aria-live={ariaLive}
    >
      <span className="rounded-full" style={dotStyle} />
      <span className="tracking-[0.08em] uppercase whitespace-nowrap">{label}</span>
      {children}
    </div>
  );
}
