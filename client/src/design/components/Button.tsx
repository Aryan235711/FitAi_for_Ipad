import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { tokens } from "@/design";
import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type ButtonTone = "primary" | "secondary" | "ghost";

type SizeToken = "sm" | "md" | "lg";

const buttonBase = cva(
  "inline-flex items-center justify-center font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      tone: {
        primary: "text-black",
        secondary: "text-white/90",
        ghost: "text-white/80",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-base",
      },
      isSquare: {
        true: "aspect-square",
        false: "",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
      isSquare: false,
    },
  }
);

const toneStyles: Record<ButtonTone, { background: string; border: string; hover: string }> = {
  primary: {
    background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
    border: "transparent",
    hover: "rgba(255,255,255,0.12)",
  },
  secondary: {
    background: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.15)",
    hover: "rgba(255,255,255,0.15)",
  },
  ghost: {
    background: "transparent",
    border: "rgba(255,255,255,0.15)",
    hover: "rgba(255,255,255,0.1)",
  },
};

const sizePadding: Record<SizeToken, string> = {
  sm: `${tokens.spacing.xs} ${tokens.spacing.md}`,
  md: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
  lg: `${tokens.spacing.md} ${tokens.spacing.xl}`,
};

type MotionButtonAttributes = HTMLMotionProps<"button">;

export interface DesignButtonProps
  extends Omit<MotionButtonAttributes, "tone" | "size" | "isSquare">,
    VariantProps<typeof buttonBase> {
  tone?: ButtonTone;
  size?: SizeToken;
  isSquare?: boolean;
}

const MotionButton = motion.button;

export const DesignButton = forwardRef<HTMLButtonElement, DesignButtonProps>(
  ({ className, tone = "primary", size = "md", isSquare = false, style, type = "button", ...props }, ref) => {
    const toneConfig = toneStyles[tone];

    return (
      <MotionButton
        ref={ref}
        className={cn(buttonBase({ tone, size, isSquare }), className)}
        style={{
          padding: isSquare ? tokens.spacing.sm : sizePadding[size],
          borderRadius: tokens.radii.xl,
          border: toneConfig.border === "transparent" ? undefined : `1px solid ${toneConfig.border}`,
          background: toneConfig.background,
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          ...style,
        }}
        data-variant={tone}
        type={type}
        whileTap={{ scale: 0.96 }}
        whileHover={{ translateY: -2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...props}
      />
    );
  }
);

designButtonHover();

function designButtonHover() {
  if (typeof document === "undefined") return;
  const existing = document.head.querySelector<HTMLStyleElement>('style[data-design-button]');
  if (existing) return;

  const style = document.createElement("style");
  style.dataset.designButton = "true";
  style.innerHTML = `
    button[data-variant="primary"]:hover:not(:disabled) { filter: brightness(1.1); }
    button[data-variant="secondary"]:hover:not(:disabled) { background: rgba(255,255,255,0.18); }
    button[data-variant="ghost"]:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
  `;
  document.head.appendChild(style);
}
