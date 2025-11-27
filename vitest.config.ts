import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rootDir = path.resolve(process.cwd());

export default defineConfig({
  plugins: [react(), tailwindcss()] as any,
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "client", "src"),
      "@shared": path.resolve(rootDir, "shared"),
      "@assets": path.resolve(rootDir, "attached_assets"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: path.resolve(rootDir, "client", "src", "test", "setupTests.ts"),
    css: true,
    include: [
      "client/src/**/*.{test,spec}.{ts,tsx}",
      "server/**/*.{test,spec}.{ts,tsx}",
      "shared/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
    },
  },
});
