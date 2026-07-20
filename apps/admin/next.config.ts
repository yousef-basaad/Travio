import type { NextConfig } from "next";

// Travio SaaS admin panel - internal Travio staff, manages all tenants.
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
