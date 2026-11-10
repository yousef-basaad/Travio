// Security headers shared by every Travio Next.js app (next.config.ts
// headers()). Plain .mjs so next.config.ts can load it without a build.
//
// The CSP limits where scripts, data and images can come from. Scripts
// still allow 'unsafe-inline', because Next's inline scripts would
// otherwise need a nonce on every page, which rules out static rendering.
// External scripts are blocked, which is the main protection this adds.
// Supabase is the only outside origin the browser talks to: the auth and
// data APIs, realtime, file uploads, and logos and cover images.
export function buildContentSecurityPolicy(env = process.env) {
  const supabase = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "https://*.supabase.co";
  const realtime = supabase.replace(/^http/, "ws");
  const isDev = env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${realtime}${isDev ? " ws:" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Browsers ignore HSTS over plain http (local dev), so it only takes
  // effect on the deployed https origin. No "preload": that's a separate,
  // hard-to-undo decision about the production domain.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

// For next.config.ts: headers: securityHeaders
export async function securityHeaders() {
  return [{ source: "/:path*", headers: SECURITY_HEADERS }];
}
