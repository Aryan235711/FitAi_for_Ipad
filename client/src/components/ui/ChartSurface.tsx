import { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { tokens } from "@/design";

type SpacingToken = keyof typeof tokens.spacing;
type RadiusToken = keyof typeof tokens.radii;

interface ChartSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: SpacingToken;
  radius?: RadiusToken;
  minHeight?: string | number;
  style?: CSSProperties;
}

export function ChartSurface({
  children,
  className,
  padding = "md",
  radius = "xl",
  minHeight = "220px",
  style,
  ...rest
}: ChartSurfaceProps) {
  const surfaceStyle: CSSProperties = {
    padding: tokens.spacing[padding],
    borderRadius: tokens.radii[radius],
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: tokens.glass.blur,
    minHeight,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    overscrollBehavior: "contain",
    touchAction: "pan-y",
    ...style,
  };

  return (
    <div className={cn("relative touch-pan-y", className)} style={surfaceStyle} {...rest}>
      {children}
    </div>
  );
}
