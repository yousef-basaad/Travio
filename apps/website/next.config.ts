import type { NextConfig } from "next";

// Public marketing website - SEO-first, mostly static/ISR, no auth.
const nextConfig: NextConfig = {
  transpilePackages: [
    "@travio/ui",
    "@travio/auth",
    "@travio/database",
    "@travio/api",
    "@travio/types",
    "@travio/hooks",
    "@travio/utils",
  ],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
