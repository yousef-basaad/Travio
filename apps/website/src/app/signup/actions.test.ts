import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SignUpAgencyResult } from "@travio/auth";

// signUpAgency() is tested on its own in packages/auth; here it's mocked
// so each branch of the action (a / b / c) can be driven directly.
let signUpResult: SignUpAgencyResult;
const signUpAgency = vi.fn(async () => signUpResult);

vi.mock("@travio/auth", () => ({ signUpAgency: (...args: unknown[]) => signUpAgency(...(args as [])) }));

class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

import { signupAction } from "./actions";
import { SIGNUP_MESSAGES } from "@/features/signup/schemas/signup.schema";

const DASHBOARD_URL = "https://dashboard.example.com";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const fields = {
    fullName: "Owner Name",
    agencyName: "Acme Travel",
    crNumber: "1010000001",
    email: "owner@agency.test",
    password: "correct-horse",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const IDLE = { status: "idle" } as const;

describe("signupAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", DASHBOARD_URL);
    signUpAgency.mockClear();
    signUpResult = { status: "confirmation_required" };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("passes emailRedirectTo = <dashboard>/login?confirmed=1", async () => {
    await signupAction(IDLE, form());
    expect(signUpAgency).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyName: "Acme Travel",
        emailRedirectTo: `${DASHBOARD_URL}/login?confirmed=1`,
      }),
    );
  });

  it("normalizes a trailing slash in NEXT_PUBLIC_DASHBOARD_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", `${DASHBOARD_URL}/`);
    await signupAction(IDLE, form());
    expect(signUpAgency).toHaveBeenCalledWith(
      expect.objectContaining({ emailRedirectTo: `${DASHBOARD_URL}/login?confirmed=1` }),
    );
  });

  it("(a) session returned: redirects to <dashboard>/login?registered=1", async () => {
    signUpResult = { status: "agency_created" };
    await expect(signupAction(IDLE, form())).rejects.toMatchObject({
      url: `${DASHBOARD_URL}/login?registered=1`,
    });
  });

  it("(a) agency creation deferred: still redirects (first login finishes it)", async () => {
    signUpResult = { status: "agency_setup_deferred" };
    await expect(signupAction(IDLE, form())).rejects.toMatchObject({
      url: `${DASHBOARD_URL}/login?registered=1`,
    });
  });

  it("(b) no session: shows the check-your-email state, no redirect", async () => {
    await expect(signupAction(IDLE, form())).resolves.toEqual({
      status: "check_email",
      email: "owner@agency.test",
    });
  });

  it("email already registered: identical to (b), never reveals the account exists", async () => {
    signUpResult = { status: "confirmation_required" };
    const newEmailState = await signupAction(IDLE, form());

    signUpResult = { status: "error", code: "email_taken" };
    const takenEmailState = await signupAction(IDLE, form());

    expect(takenEmailState).toEqual({ status: "check_email", email: "owner@agency.test" });
    expect(takenEmailState).toEqual(newEmailState);
  });

  it("(c) rate limited: friendly form error", async () => {
    signUpResult = { status: "error", code: "rate_limited" };
    const state = await signupAction(IDLE, form());
    expect(state).toMatchObject({ status: "error", formError: SIGNUP_MESSAGES.rateLimited });
  });

  it("(c) unexpected throw from signup: generic form error, never rethrown", async () => {
    signUpAgency.mockRejectedValueOnce(new Error("network down"));
    const state = await signupAction(IDLE, form());
    expect(state).toMatchObject({ status: "error", formError: SIGNUP_MESSAGES.unknown });
  });

  it("validation errors never call signUp and never echo the password", async () => {
    const state = await signupAction(IDLE, form({ agencyName: "  ", password: "short" }));
    expect(signUpAgency).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { agencyName: expect.any(String), password: expect.any(String) },
    });
    expect(state.status === "error" && "password" in state.values).toBe(false);
  });

  it("missing NEXT_PUBLIC_DASHBOARD_URL: friendly error, logged config problem, no signUp", async () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", "");
    const state = await signupAction(IDLE, form());
    expect(signUpAgency).not.toHaveBeenCalled();
    expect(state).toMatchObject({ status: "error", formError: SIGNUP_MESSAGES.unavailable });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("NEXT_PUBLIC_DASHBOARD_URL"));
  });
});
