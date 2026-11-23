// Builds the dashboard and the customer portal one after the other, then
// starts both. Playwright runs this as its single web server, with the
// local Supabase environment already checked and set by
// playwright.config.ts (building both at once was slow enough to time out
// on a laptop). Set E2E_SKIP_BUILD=1 to reuse the last builds.
import { spawn, spawnSync } from "node:child_process";

const APPS = [
  { name: "dashboard", port: 3101 },
  { name: "customer-portal", port: 3102 },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) {
  console.error(`Refusing to start: Supabase URL "${url}" is not a local 127.0.0.1 stack.`);
  process.exit(1);
}

const shell = process.platform === "win32";

if (process.env.E2E_SKIP_BUILD !== "1") {
  for (const app of APPS) {
    console.log(`[e2e] building ${app.name}…`);
    const result = spawnSync("pnpm", ["--filter", `@travio/${app.name}`, "build"], { stdio: "inherit", shell });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

const servers = APPS.map((app) =>
  spawn("pnpm", ["--filter", `@travio/${app.name}`, "exec", "next", "start", "-p", String(app.port)], {
    stdio: "inherit",
    shell,
  }),
);

const stop = () => {
  for (const server of servers) server.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const server of servers) server.on("exit", (code) => code && process.exit(code));
