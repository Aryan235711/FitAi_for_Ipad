import type { Variants, Transition } from "framer-motion";
import { tokens } from "./tokens";

type TransitionPreset = "standard" | "emphasized" | "fast";

const durationMap: Record<TransitionPreset, number> = {
  standard: tokens.motion.durations.normal,
  emphasized: tokens.motion.durations.slow,
  fast: tokens.motion.durations.fast,
};

const easingMap: Record<TransitionPreset, Transition["ease"]> = {
  standard: tokens.motion.easings.standard,
  emphasized: tokens.motion.easings.emphasized,
  fast: tokens.motion.easings.entrance,
};

export const transitions = {
  spring: {
    type: "spring" as const,
    stiffness: tokens.motion.spring.stiffness,
    damping: tokens.motion.spring.damping,
    mass: tokens.motion.spring.mass,
  },
  preset(preset: TransitionPreset = "standard"): Transition {
    return {
      duration: durationMap[preset],
      ease: easingMap[preset],
    };
  },
};

export const variants = {
  fadeInUp: (offset: keyof typeof tokens.motion.offsets = "md"): Variants => ({
    hidden: {
      opacity: 0,
      y: tokens.motion.offsets[offset],
    },
    show: {
      opacity: 1,
      y: 0,
      transition: transitions.preset("standard"),
    },
  }),
  scaleIn: (scaleFrom = 0.92): Variants => ({
    hidden: { opacity: 0, scale: scaleFrom },
    show: {
      opacity: 1,
      scale: 1,
      transition: transitions.preset("emphasized"),
    },
  }),
  stagger: (staggerChildren = 0.08, delayChildren = 0.04): Variants => ({
    hidden: {},
    show: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  }),
};

export const motionTokens = {
  durations: tokens.motion.durations,
  easings: tokens.motion.easings,
};
