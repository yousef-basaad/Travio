import { describe, it, expect } from "vitest";
import { getLoginNotice } from "./login-notice";

describe("getLoginNotice", () => {
  it("?registered=1 shows the account-created notice", () => {
    expect(getLoginNotice({ registered: "1" })).toBe("Account created — sign in to continue.");
  });

  it("?confirmed=1 shows the email-confirmed notice", () => {
    expect(getLoginNotice({ confirmed: "1" })).toBe(
      "Email confirmed — sign in to finish setting up your agency.",
    );
  });

  it("shows nothing without a recognized param", () => {
    expect(getLoginNotice({})).toBeNull();
    expect(getLoginNotice({ registered: "yes", confirmed: "0" })).toBeNull();
  });
});
