// Security headers shared by every Travio Next.js app (next.config.ts
// headers()). Plain .mjs so next.config.ts can load it without a build.
//
// The CSP sets only directives that can't break the app: it blocks
// framing (clickjacking), <base> hijacking, plugins, and forms posting to
// other origins. It deliberately sets no script-src/connect-src yet -
// Next's inline scripts and the Supabase URLs would need nonces and an
// allow-list, a separate change.
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
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

// For next.config.ts: headers: securityHeaders
export async function securityHeaders() {
  return [{ source: "/:path*", headers: SECURITY_HEADERS }];
}
