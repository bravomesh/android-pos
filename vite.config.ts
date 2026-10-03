/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  // Legacy libs (material-ui beta et al.) expect a webpack-style `global`.
  define: { global: "globalThis" },
  server: { port: 3000 },
  // Capacitor's webDir is "build" (capacitor.config.json) — keep CRA's output dir.
  build: { outDir: "build" },
  optimizeDeps: { esbuildOptions: { loader: { ".js": "jsx" } } },
});
