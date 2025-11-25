import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  delay?: number;
}

export function GlassCard({ children, className, title, subtitle, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "glass rounded-3xl p-6 flex flex-col relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {(title || subtitle) && (
        <div className="mb-6 z-10">
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
        </div>
      )}
      
      <div className="relative z-10 flex-1">
        {children}
      </div>
    </motion.div>
  );
}
