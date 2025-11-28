import { cn } from "@/lib/utils";
import { ReactNode, CSSProperties } from "react";
import { motion, type MotionProps } from "framer-motion";
import { tokens } from "@/design";
import "./glass-card-effects.css";

type MotionOverrides = Pick<MotionProps, "variants" | "initial" | "animate" | "exit" | "transition" | "whileInView" | "viewport">;

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  delay?: number;
  disableFloating?: boolean;
  "data-testid"?: string;
  motionConfig?: MotionOverrides;
}

export function GlassCard({ children, className, title, subtitle, delay = 0, disableFloating = false, motionConfig, "data-testid": testId }: GlassCardProps) {
  const cardRadius = tokens.radii["2xl"];
  const baseCardStyle: CSSProperties = {
    padding: tokens.spacing.lg,
    borderRadius: cardRadius,
    background: tokens.glass.background,
    border: tokens.glass.border,
    backdropFilter: tokens.glass.blur,
    boxShadow: tokens.glass.shadow,
  };

  const defaultInitial = { opacity: 0, y: 40, scale: 0.95 };
  const defaultAnimate = { opacity: 1, y: 0, scale: 1 };
  const defaultTransition = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
    mass: 1,
    delay,
  };

  const resolvedInitial =
    motionConfig?.initial !== undefined
      ? motionConfig.initial
      : motionConfig?.variants
        ? undefined
        : defaultInitial;

  const resolvedAnimate =
    motionConfig?.animate !== undefined
      ? motionConfig.animate
      : motionConfig?.variants
        ? undefined
        : defaultAnimate;

  const resolvedTransition = motionConfig?.transition ?? defaultTransition;

  return (
    <motion.div
      variants={motionConfig?.variants}
      initial={resolvedInitial}
      animate={resolvedAnimate}
      exit={motionConfig?.exit}
      transition={resolvedTransition}
      whileInView={motionConfig?.whileInView}
      viewport={motionConfig?.viewport}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{
        scale: 0.985,
        y: 2,
        transition: { type: "spring", stiffness: 600, damping: 40 }
      }}
      className={cn(
        "flex flex-col relative overflow-hidden group perspective-1000",
        className
      )}
      style={baseCardStyle}
      data-testid={testId}
      role="region"
      aria-label={title || "Card"}
    >
      {/* Subtle Floating Animation (Breathing) */}
      {!disableFloating && (
        <motion.div
           className="absolute inset-0 -z-10"
           animate={{ y: [0, -5, 0] }}
           transition={{ 
             duration: 6, 
             repeat: Infinity, 
             ease: "easeInOut",
             delay: Math.random() * 2 // Randomize start time so cards don't float in sync
           }}
        />
      )}

      {/* Liquid Hover Effect Background - iPad friendly */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700"
        style={{ borderRadius: cardRadius }}
      />
      
      {/* Animated Glow Border on Hover - iPad friendly */}
      <div
        className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none glass-card-shimmer"
        style={{ borderRadius: cardRadius }}
      />
      
      {/* Top Highlight Line - iPad friendly */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
      
      {(title || subtitle) && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
          className="z-10 relative"
          style={{ marginBottom: tokens.spacing.lg }}
        >
          {title && (
            <h3 className="text-lg font-display font-medium tracking-wide text-white/90 flex items-center gap-2">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs font-sans text-white/50 mt-1 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
      
      <div className="relative z-10 flex-1">
        {children}
      </div>
    </motion.div>
  );
}
