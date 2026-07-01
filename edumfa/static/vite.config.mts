import babel from "@rolldown/plugin-babel";
import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    lingui(),
    babel({
      presets: [linguiTransformerBabelPreset()]
    })
  ],
  build: {
    emptyOutDir: true,
    manifest: true,
    outDir: "react-dist",
    rollupOptions: {
      input: "react-src/main.tsx",
      output: {
        assetFileNames: "assets/[name][extname]",
        chunkFileNames: "assets/[name].js",
        entryFileNames: "assets/[name].js"
      }
    }
  },
  test: {
    environment: "jsdom",
    include: ["react-src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"]
  }
});
