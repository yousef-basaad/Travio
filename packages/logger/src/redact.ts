// Defense in depth: even though callers should never pass secrets into
// the logger, this walks every logged payload and strips known-sensitive
// key names regardless - a mistake at a single call site (e.g. spreading
// a whole request body into context) still can't leak a password/token/
// service-role key into logs.
const SENSITIVE_KEY_PATTERN =
  /password|token|secret|service_role|servicerole|api[-_]?key|authorization|cookie|jwt|refresh|access[-_]?key/i;

const REDACTED = "[REDACTED]";

// Bounded recursion (depth 6) - context objects are small, hand-built
// records (see HandleApiErrorContext), not arbitrary deeply-nested
// payloads; this is just a safety cap, not a real limit in practice.
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(val, depth + 1);
  }
  return result;
}
