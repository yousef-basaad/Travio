// Runs once when the server starts: stop with a clear message if the
// environment is incomplete, instead of failing on the first request that
// needs a missing value. The service-role key is used by team invites
// and customer portal invites. Skipped during `next build` and in the
// edge runtime (middleware).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { checkEnv } = await import("@travio/config/next/env");
  checkEnv("dashboard", {
    required: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ],
    requiredInProduction: [
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    urls: [
      "NEXT_PUBLIC_SUPABASE_URL",
    ],
  });
}
