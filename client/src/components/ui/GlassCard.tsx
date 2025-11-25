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
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        delay: delay,
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className={cn(
        "glass rounded-3xl p-6 flex flex-col relative overflow-hidden group",
        className
      )}
    >
      {/* Liquid Hover Effect Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Top Highlight Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-20 group-hover:opacity-50 transition-opacity duration-500" />
      
      {(title || subtitle) && (
        <div className="mb-6 z-10 relative">
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
