import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const isStylesheet = (id: string): boolean => /\.css(?:\?|$)/.test(id);

/**
 * Library chunk group. Stylesheets are left out on purpose: the Flask
 * template only links assets/main.css, so every imported stylesheet has to
 * end up in the entry's CSS file.
 */
const libraryChunk = (name: string, pattern: RegExp) => ({
  name,
  test: (id: string): boolean => pattern.test(id) && !isStylesheet(id)
});

export default defineConfig({
  plugins: [react(), lingui({ macroTransform: true })],
  build: {
    emptyOutDir: true,
    manifest: true,
    outDir: "react-dist",
    rolldownOptions: {
      input: "react-src/main.tsx",
      output: {
        assetFileNames: "assets/[name][extname]",
        chunkFileNames: "assets/[name].js",
        // Flask loads assets/main.js as an ES module and main.js imports the
        // chunks below statically, so no template change is needed. Keeping
        // the libraries apart from the app code means an app-only change
        // rewrites main.js alone and browsers keep the cached library chunks.
        codeSplitting: {
          groups: [
            libraryChunk(
              "react",
              /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/
            ),
            libraryChunk("mantine", /node_modules[\\/]@mantine[\\/]/),
            libraryChunk("vendor", /node_modules[\\/]/)
          ]
        },
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
