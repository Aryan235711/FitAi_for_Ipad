import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "animate-spin",
    "animate-pulse",
    "animate-bounce",
    "vitality-orb-spin",
    "glass",
    "glass-hover",
    "glass-strong",
    "touch-pan-y",
    "min-h-screen-safe",
    "h-screen-safe",
  ],
  theme: {
    extend: {},
  },
};

export default config;
