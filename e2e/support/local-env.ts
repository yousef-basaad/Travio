import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The apps' .env.local files point at the PRODUCTION project. End-to-end
// tests create agencies and users, so they must only ever run against the
// local Supabase stack: the URL and keys come from `supabase status`, and
// anything that isn't 127.0.0.1 stops the run before a browser starts.

export interface LocalSupabase {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

let cached: LocalSupabase | null = null;

export function localSupabase(): LocalSupabase {
  if (cached) return cached;

  const output = execSync("supabase status -o env", { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const env = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => [match[1], match[2]]),
  );

  const url = env.API_URL ?? "";
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) {
    throw new Error(`Refusing to run end-to-end tests: Supabase API is "${url}", not a local 127.0.0.1 stack.`);
  }
  if (!env.ANON_KEY || !env.SERVICE_ROLE_KEY) {
    throw new Error("Refusing to run end-to-end tests: local Supabase keys are missing.");
  }

  cached = { url, anonKey: env.ANON_KEY, serviceRoleKey: env.SERVICE_ROLE_KEY };
  return cached;
}

// Environment for the app servers Playwright starts: local Supabase only.
export function appEnv(): Record<string, string> {
  const local = localSupabase();
  return {
    NEXT_PUBLIC_SUPABASE_URL: local.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: local.serviceRoleKey,
    NEXT_PUBLIC_DASHBOARD_URL: "http://localhost:3101",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}
