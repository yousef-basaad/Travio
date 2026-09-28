import { describe, it, expect } from "vitest";
import { signupSchema } from "./signup.schema";

const VALID = {
  fullName: "Owner Name",
  agencyName: "Acme Travel",
  crNumber: "1010000001",
  email: "owner@agency.test",
  password: "correct-horse",
};

function errorsFor(input: Record<string, string>) {
  const result = signupSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path[0]);
}

describe("signupSchema", () => {
  it("accepts a complete, valid signup", () => {
    expect(signupSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects a blank agency name, including whitespace-only", () => {
    expect(errorsFor({ ...VALID, agencyName: "" })).toEqual(["agencyName"]);
    expect(errorsFor({ ...VALID, agencyName: "   " })).toEqual(["agencyName"]);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(errorsFor({ ...VALID, password: "short7!" })).toEqual(["password"]);
  });

  it("rejects an invalid email", () => {
    expect(errorsFor({ ...VALID, email: "not-an-email" })).toEqual(["email"]);
  });

  it("trims agency name and CR number", () => {
    const result = signupSchema.parse({ ...VALID, agencyName: "  Acme Travel ", crNumber: " 101 " });
    expect(result.agencyName).toBe("Acme Travel");
    expect(result.crNumber).toBe("101");
  });
});
