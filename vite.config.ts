import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node20",
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      name: "i18n-iso-countries",
      formats: ["es"],
    },
  },
});
