import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks only the two Supabase calls signUpAgency() makes.
type SignUpResponse = {
  data: { user: { id: string; identities?: unknown[] } | null; session: object | null };
  error: { code?: string; status?: number; message: string } | null;
};

let signUpResponse: SignUpResponse;
let rpcResponse: { data: unknown; error: { message: string } | null };
const signUp = vi.fn(async () => signUpResponse);
const rpc = vi.fn(async () => rpcResponse);

vi.mock("@travio/database/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { signUp }, rpc })),
}));

import { signUpAgency } from "./sign-up";

const INPUT = {
  email: "owner@agency.test",
  password: "correct-horse",
  fullName: "Owner Name",
  agencyName: "Acme Travel",
  crNumber: "1010000001",
  emailRedirectTo: "https://dashboard.example.com/login?confirmed=1",
};

const NEW_USER = { id: "user-1", identities: [{ id: "identity-1" }] };

describe("signUpAgency", () => {
  beforeEach(() => {
    signUp.mockClear();
    rpc.mockClear();
    signUpResponse = { data: { user: NEW_USER, session: null }, error: null };
    rpcResponse = { data: { id: "tenant-1" }, error: null };
  });

  it("passes emailRedirectTo and the agency metadata to signUp", async () => {
    await signUpAgency(INPUT);
    expect(signUp).toHaveBeenCalledWith({
      email: INPUT.email,
      password: INPUT.password,
      options: {
        emailRedirectTo: INPUT.emailRedirectTo,
        data: {
          full_name: INPUT.fullName,
          account_type: "agency",
          agency_name: INPUT.agencyName,
          cr_number: INPUT.crNumber,
        },
      },
    });
  });

  it("(a) session returned: creates the agency", async () => {
    signUpResponse = { data: { user: NEW_USER, session: { access_token: "t" } }, error: null };
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "agency_created" });
    expect(rpc).toHaveBeenCalledWith("create_agency", {
      agency_name: INPUT.agencyName,
      agency_cr_number: INPUT.crNumber,
    });
  });

  it("(a) session returned but create_agency fails: defers setup to first login", async () => {
    signUpResponse = { data: { user: NEW_USER, session: { access_token: "t" } }, error: null };
    rpcResponse = { data: null, error: { message: "boom" } };
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "agency_setup_deferred" });
  });

  it("(b) no session: confirmation required, create_agency is NOT called", async () => {
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "confirmation_required" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("(c) email already registered (error code)", async () => {
    signUpResponse = {
      data: { user: null, session: null },
      error: { code: "user_already_exists", status: 422, message: "User already registered" },
    };
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "error", code: "email_taken" });
  });

  it("(c) email already registered (confirmation ON: user with no identities)", async () => {
    signUpResponse = { data: { user: { id: "user-1", identities: [] }, session: null }, error: null };
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "error", code: "email_taken" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("(c) rate limited", async () => {
    signUpResponse = {
      data: { user: null, session: null },
      error: { code: "over_email_send_rate_limit", status: 429, message: "rate limit" },
    };
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "error", code: "rate_limited" });
  });

  it("(c) any other failure maps to unknown, never throws", async () => {
    signUpResponse = {
      data: { user: null, session: null },
      error: { status: 500, message: "Database error saving new user" },
    };
    await expect(signUpAgency(INPUT)).resolves.toEqual({ status: "error", code: "unknown" });
  });
});
