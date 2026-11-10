import { describe, it, expect } from "vitest";
import { buildContentSecurityPolicy } from "@travio/config/next/security-headers";

const production = { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co/" };

describe("content security policy", () => {
  it("allows only this site and the project's Supabase", () => {
    const policy = buildContentSecurityPolicy(production);
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(policy).toContain("img-src 'self' data: blob: https://abc.supabase.co");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("does not allow eval or websockets anywhere in production", () => {
    const policy = buildContentSecurityPolicy(production);
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toMatch(/ ws:/);
  });

  it("allows what the dev server needs", () => {
    const policy = buildContentSecurityPolicy({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" });
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("ws://127.0.0.1:54321");
  });

  it("falls back to Supabase hosts when the URL isn't set", () => {
    expect(buildContentSecurityPolicy({ NODE_ENV: "production" })).toContain("https://*.supabase.co");
  });
});
