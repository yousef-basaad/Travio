import { describe, it, expect, vi, beforeEach } from "vitest";

// Minimal fake of the service-role client: the two count queries resolve
// to perEmailCount / siteCount (in that order), and inserts are recorded.
let perEmailCount = 0;
let siteCount = 0;
let countQueries: { eq: unknown[][] }[] = [];
const inserted: unknown[] = [];

function countChain(count: number) {
  const record = { eq: [] as unknown[][] };
  countQueries.push(record);
  const chain = {
    eq: (...args: unknown[]) => {
      record.eq.push(args);
      return chain;
    },
    gte: () => chain,
    then: (resolve: (v: { count: number; error: null }) => void) => resolve({ count, error: null }),
  };
  return chain;
}

vi.mock("@travio/database/admin", () => ({
  createAdminSupabaseClient: () => {
    let selectCalls = 0;
    return {
      from: () => ({
        select: () => countChain(selectCalls++ === 0 ? perEmailCount : siteCount),
        insert: async (row: unknown) => {
          inserted.push(row);
          return { error: null };
        },
      }),
    };
  },
}));

import { submitInquiry } from "./submit-inquiry";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = { agencyName: "Acme Travel", email: "Owner@Acme.TEST", message: "Please contact me about a demo." };

describe("submitInquiry", () => {
  beforeEach(() => {
    perEmailCount = 0;
    siteCount = 0;
    countQueries = [];
    inserted.length = 0;
  });

  it("saves a valid inquiry with the email lowercased", async () => {
    await expect(submitInquiry(form(VALID))).resolves.toEqual({ status: "sent" });
    expect(inserted).toEqual([
      { agency_name: "Acme Travel", email: "owner@acme.test", message: "Please contact me about a demo." },
    ]);
    expect(countQueries[0]?.eq).toContainEqual(["email", "owner@acme.test"]);
  });

  it("honeypot filled: reports success but saves nothing and checks nothing", async () => {
    await expect(submitInquiry(form({ ...VALID, website: "http://spam.example" }))).resolves.toEqual({
      status: "sent",
    });
    expect(inserted).toHaveLength(0);
    expect(countQueries).toHaveLength(0);
  });

  it("refuses a 4th inquiry from the same email within the hour", async () => {
    perEmailCount = 3;
    await expect(submitInquiry(form(VALID))).resolves.toEqual({ status: "rate_limited" });
    expect(inserted).toHaveLength(0);
  });

  it("refuses when the whole site is being flooded", async () => {
    siteCount = 30;
    await expect(submitInquiry(form(VALID))).resolves.toEqual({ status: "rate_limited" });
    expect(inserted).toHaveLength(0);
  });

  it("rejects oversized input before touching the database", async () => {
    await expect(submitInquiry(form({ ...VALID, message: "x".repeat(5001) }))).rejects.toThrow();
    await expect(submitInquiry(form({ ...VALID, agencyName: "y".repeat(201) }))).rejects.toThrow();
    expect(countQueries).toHaveLength(0);
    expect(inserted).toHaveLength(0);
  });
});
