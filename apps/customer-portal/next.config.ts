import type { NextConfig } from "next";

// Customer self-service portal - authenticated end-customers.
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
