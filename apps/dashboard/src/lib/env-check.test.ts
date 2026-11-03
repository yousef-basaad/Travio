import { describe, it, expect, vi, afterEach } from "vitest";
import { checkEnv, findEnvProblems } from "@travio/config/next/env";

const SPEC = {
  required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  requiredInProduction: ["SUPABASE_SERVICE_ROLE_KEY"],
  urls: ["NEXT_PUBLIC_SUPABASE_URL"],
};

const COMPLETE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-value",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-value",
};

describe("findEnvProblems", () => {
  it("is clean when everything is set", () => {
    expect(findEnvProblems(SPEC, { ...COMPLETE, NODE_ENV: "production" })).toEqual({ errors: [], warnings: [] });
  });

  it("reports missing and blank required variables as errors", () => {
    const { errors } = findEnvProblems(SPEC, { ...COMPLETE, NEXT_PUBLIC_SUPABASE_ANON_KEY: "  ", NEXT_PUBLIC_SUPABASE_URL: undefined });
    expect(errors).toEqual(["NEXT_PUBLIC_SUPABASE_URL is not set", "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"]);
  });

  it("production-only variables: error in production, warning in development", () => {
    const env = { ...COMPLETE, SUPABASE_SERVICE_ROLE_KEY: "" };
    expect(findEnvProblems(SPEC, { ...env, NODE_ENV: "production" }).errors).toEqual([
      "SUPABASE_SERVICE_ROLE_KEY is not set",
    ]);
    expect(findEnvProblems(SPEC, { ...env, NODE_ENV: "development" })).toEqual({
      errors: [],
      warnings: ["SUPABASE_SERVICE_ROLE_KEY is not set"],
    });
  });

  it("rejects a URL variable that isn't an http(s) URL", () => {
    expect(findEnvProblems(SPEC, { ...COMPLETE, NEXT_PUBLIC_SUPABASE_URL: "abc.supabase.co" }).errors).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL is not a valid http(s) URL",
    ]);
    expect(findEnvProblems(SPEC, { ...COMPLETE, NEXT_PUBLIC_SUPABASE_URL: "ftp://x" }).errors).toHaveLength(1);
  });
});

describe("checkEnv", () => {
  afterEach(() => vi.restoreAllMocks());

  it("throws one message listing every problem, never the values", () => {
    const env = {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "not a url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "secret-anon-value",
    };
    let message = "";
    try {
      checkEnv("dashboard", SPEC, env);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("[dashboard] invalid environment");
    expect(message).toContain("NEXT_PUBLIC_SUPABASE_URL is not a valid http(s) URL");
    expect(message).toContain("SUPABASE_SERVICE_ROLE_KEY is not set");
    expect(message).not.toContain("secret-anon-value");
    expect(message).not.toContain("not a url");
  });

  it("only warns in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      checkEnv("dashboard", SPEC, { ...COMPLETE, SUPABASE_SERVICE_ROLE_KEY: undefined, NODE_ENV: "development" }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("SUPABASE_SERVICE_ROLE_KEY is not set"));
  });
});
