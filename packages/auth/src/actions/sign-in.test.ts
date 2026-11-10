import { describe, it, expect, vi, beforeEach } from "vitest";

const signIn = vi.fn();
const rpc = vi.fn();
let forwardedFor: string | null = "203.0.113.9, 10.0.0.1";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: (name: string) => (name === "x-forwarded-for" ? forwardedFor : null) })),
}));
vi.mock("@travio/database/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { signInWithPassword: signIn } })),
}));
vi.mock("@travio/database/admin", () => ({
  createAdminSupabaseClient: vi.fn(() => ({ rpc })),
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn() } }));

import { signInWithPassword } from "./sign-in";
import { throttleKeys } from "./login-throttle";

function form(email = "A@Agency.test", password = "secret") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

const called = (name: string) => rpc.mock.calls.filter(([fn]) => fn === name);

beforeEach(() => {
  signIn.mockReset();
  rpc.mockReset();
  forwardedFor = "203.0.113.9, 10.0.0.1";
  rpc.mockResolvedValue({ data: false, error: null });
});

describe("signInWithPassword", () => {
  it("signs in and clears earlier failures", async () => {
    signIn.mockResolvedValue({ error: null });
    await expect(signInWithPassword({ error: null }, form())).resolves.toEqual({ error: null });
    expect(called("login_clear_failures")).toHaveLength(1);
    expect(called("login_record_failure")).toHaveLength(0);
  });

  it("records a wrong password", async () => {
    signIn.mockResolvedValue({ error: { code: "invalid_credentials", message: "Invalid login credentials" } });
    await expect(signInWithPassword({ error: null }, form())).resolves.toEqual({ error: "Invalid login credentials" });
    expect(called("login_record_failure")).toHaveLength(1);
  });

  it("does not count other errors against the user", async () => {
    signIn.mockResolvedValue({ error: { code: "unexpected_failure", message: "down" } });
    await signInWithPassword({ error: null }, form());
    expect(called("login_record_failure")).toHaveLength(0);
  });

  it("refuses without trying when blocked", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(signInWithPassword({ error: null }, form())).resolves.toMatchObject({ code: "too_many_attempts" });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("still signs in if the throttle itself fails", async () => {
    rpc.mockRejectedValue(new Error("no service key"));
    signIn.mockResolvedValue({ error: null });
    await expect(signInWithPassword({ error: null }, form())).resolves.toEqual({ error: null });
  });
});

describe("throttleKeys", () => {
  it("ignores email case and spaces, and never contains the raw values", () => {
    const keys = throttleKeys(" A@Agency.test ", "203.0.113.9");
    expect(keys).toEqual(throttleKeys("a@agency.test", "203.0.113.9"));
    expect(JSON.stringify(keys)).not.toContain("agency");
    expect(JSON.stringify(keys)).not.toContain("203.0.113.9");
  });

  it("gives the same email a different pair key from another address", () => {
    const first = throttleKeys("a@agency.test", "1.1.1.1");
    const second = throttleKeys("a@agency.test", "2.2.2.2");
    expect(first.pair).not.toBe(second.pair);
    expect(first.email).toBe(second.email);
  });
});
