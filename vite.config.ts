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
  // The codebase has JSX inside .js files; Vite only assumes JSX in .jsx/.tsx.
  // Setting `include` overrides Vite's default file handling, so it must also
  // cover .ts/.tsx — the tsx loader parses JSX and TypeScript in all of them.
  esbuild: { loader: "tsx", include: /src\/.*\.[jt]sx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { ".js": "jsx" } } },
});
