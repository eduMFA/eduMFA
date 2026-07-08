import { defineConfig } from "@lingui/cli";

export default defineConfig({
  catalogs: [
    {
      include: ["react-src"],
      path: "<rootDir>/react-src/locales/{locale}/messages"
    }
  ],
  locales: ["en", "de"],
  sourceLocale: "en"
});
