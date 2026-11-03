import type { NextConfig } from "next";
import { securityHeaders } from "@travio/config/next/security-headers";

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
  typedRoutes: true,
  // Shared security headers (packages/config/next/security-headers.mjs).
  headers: securityHeaders,
  poweredByHeader: false,
};

export default nextConfig;
