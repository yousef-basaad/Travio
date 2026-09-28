import { describe, it, expect } from "vitest";
import { shouldRedirectAfterSignIn } from "./sign-in-redirect";

describe("shouldRedirectAfterSignIn", () => {
  it("redirects once a submitted sign-in succeeds", () => {
    expect(
      shouldRedirectAfterSignIn({ hasSubmitted: true, pending: false, state: { error: null } }),
    ).toBe(true);
  });

  it("does not redirect when sign-in returned an error", () => {
    expect(
      shouldRedirectAfterSignIn({
        hasSubmitted: true,
        pending: false,
        state: { error: "Invalid login credentials" },
      }),
    ).toBe(false);
  });

  it("does not redirect while the sign-in is still pending", () => {
    expect(
      shouldRedirectAfterSignIn({ hasSubmitted: true, pending: true, state: { error: null } }),
    ).toBe(false);
  });

  it("does not redirect on the initial render before anything was submitted", () => {
    expect(
      shouldRedirectAfterSignIn({ hasSubmitted: false, pending: false, state: { error: null } }),
    ).toBe(false);
  });
});
