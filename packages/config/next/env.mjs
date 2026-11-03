// Environment check for each Travio app's instrumentation.ts register(),
// which runs once when the server starts. A missing value fails fast with
// one clear message naming every problem, instead of a confusing error on
// the first request that happens to need it.
//
//   required             - must be set, always
//   requiredInProduction - must be set in production; in development a
//                          missing one is only a warning (e.g. the
//                          service-role key, which only a few routes use)
//   urls                 - names whose value, when set, must be an http(s) URL
//
// Values are never printed - only variable names.
export function findEnvProblems(spec, env = process.env) {
  const { required = [], requiredInProduction = [], urls = [] } = spec;
  const isProduction = env.NODE_ENV === "production";
  const missing = (name) => !env[name] || !String(env[name]).trim();

  const errors = [];
  const warnings = [];

  for (const name of required) {
    if (missing(name)) errors.push(`${name} is not set`);
  }
  for (const name of requiredInProduction) {
    if (missing(name)) (isProduction ? errors : warnings).push(`${name} is not set`);
  }
  for (const name of urls) {
    if (missing(name)) continue;
    let ok = false;
    try {
      const url = new URL(String(env[name]).trim());
      ok = url.protocol === "http:" || url.protocol === "https:";
    } catch {
      ok = false;
    }
    if (!ok) errors.push(`${name} is not a valid http(s) URL`);
  }

  return { errors, warnings };
}

// Throws (stopping the server from starting) when anything required is
// missing or malformed; logs warnings otherwise.
export function checkEnv(appName, spec, env = process.env) {
  const { errors, warnings } = findEnvProblems(spec, env);
  for (const warning of warnings) {
    console.warn(`[${appName}] environment: ${warning} (required in production)`);
  }
  if (errors.length > 0) {
    throw new Error(
      `[${appName}] invalid environment:\n` +
        errors.map((error) => `  - ${error}`).join("\n") +
        "\nSee .env.example and docs/deployment.md.",
    );
  }
}
