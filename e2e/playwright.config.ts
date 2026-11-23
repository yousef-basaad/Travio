import { defineConfig, devices } from "@playwright/test";
import { appEnv } from "./support/local-env";
import { DASHBOARD, PORTAL } from "./support/fixture";

// Runs the real dashboard and customer portal (production builds) against
// the LOCAL Supabase stack only - appEnv() refuses anything else. They use
// their own ports (3101/3102) so a dev server on 3001/3002 is untouched.
const env = { ...process.env, ...appEnv() } as Record<string, string>;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./support/global-setup.ts",
  globalTeardown: "./support/global-teardown.ts",
  // The tests share one agency and some build on each other's data.
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: DASHBOARD,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // English UI for stable text selectors; the portal tests switch to
    // Arabic where the language itself is under test.
    locale: "en-US",
    ...devices["Desktop Chrome"],
    channel: CI ? undefined : "chrome",
  },
  // One server process: builds both apps (with the local values, since
  // NEXT_PUBLIC_* are baked in at build time), then starts them. Ready
  // once the portal - the second to start - answers.
  webServer: {
    command: "node scripts/serve-apps.mjs",
    url: `${PORTAL}/login`,
    env,
    reuseExistingServer: !CI,
    timeout: 20 * 60 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
