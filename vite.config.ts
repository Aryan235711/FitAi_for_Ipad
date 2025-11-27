import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

const vendorChunkRules: Array<{ name: string; matchers: RegExp[] }> = [
  {
    name: "vendor-react",
    matchers: [/node_modules\/(react|react-dom|scheduler)\//, /node_modules\/wouter\//],
  },
  {
    name: "vendor-query",
    matchers: [/node_modules\/(@tanstack|react-query)\//],
  },
  {
    name: "vendor-motion",
    matchers: [/node_modules\/framer-motion\//],
  },
  {
    name: "vendor-charts",
    matchers: [/node_modules\/(recharts|recharts-scale)\//],
  },
  {
    name: "vendor-icons",
    matchers: [/node_modules\/lucide-react\//],
  },
];

const matchVendorChunk = (id: string) => {
  if (!id.includes("node_modules")) return null;
  for (const rule of vendorChunkRules) {
    if (rule.matchers.some((matcher) => matcher.test(id))) {
      return rule.name;
    }
  }
  return "vendor-misc";
};

const enableRuntimeOverlay = process.env.VITE_DISABLE_OVERLAY !== "true";

export default defineConfig({
  plugins: [
    react(),
    ...(enableRuntimeOverlay ? [runtimeErrorOverlay()] : []),
    tailwindcss(),
    metaImagesPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => matchVendorChunk(id) ?? undefined,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
