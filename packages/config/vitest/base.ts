import { defineConfig } from "vitest/config";

// Shared Vitest base, mirrors packages/config/eslint's "./eslint" export
// convention - every package that needs tests extends this rather than
// each hand-rolling its own config.
export const vitestBaseConfig = defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    // Business logic only (packages/api) - no jsdom, no UI test runner.
    // apps/* and packages/ui have no tests yet; add jsdom only if/when
    // component tests are actually introduced.
  },
});

export default vitestBaseConfig;
