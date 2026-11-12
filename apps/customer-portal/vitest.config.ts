import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import { vitestBaseConfig } from "@travio/config/vitest";

// Same shared base as every other package, plus the "@/*" -> src/*
// alias from tsconfig.json (Vite doesn't read tsconfig paths), same as
// the dashboard.
export default mergeConfig(vitestBaseConfig, {
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
