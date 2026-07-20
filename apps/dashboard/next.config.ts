import type { NextConfig } from "next";

// Internal travel agency dashboard - authenticated, agency staff (owner/agent).
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
