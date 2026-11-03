// Runs once when the server starts: stop with a clear message if the
// environment is incomplete, instead of failing on the first request that
// needs a missing value. No service-role key until the admin console
// uses one. Skipped during `next build` and in the edge runtime
// (middleware).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { checkEnv } = await import("@travio/config/next/env");
  checkEnv("admin", {
    required: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ],
    requiredInProduction: [],
    urls: [
      "NEXT_PUBLIC_SUPABASE_URL",
    ],
  });
}
