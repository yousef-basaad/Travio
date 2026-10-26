import { describe, it, expect } from "vitest";
import type { VisaApplicationWithCustomer } from "@travio/api";
import { filterVisaApplications } from "./filter-visas";

function visa(overrides: Partial<VisaApplicationWithCustomer>): VisaApplicationWithCustomer {
  return {
    id: "visa",
    tenantId: "tenant-1",
    customerId: "customer-1",
    bookingId: null,
    assignedTo: null,
    country: null,
    visaType: null,
    status: "draft",
    submittedAt: null,
    createdBy: null,
    createdAt: null,
    updatedAt: null,
    customer: null,
    ...overrides,
  };
}

const VISAS = [
  visa({ id: "a", status: "draft", country: "United Kingdom", customer: { id: "c1", fullName: "Sara Ali" } }),
  visa({ id: "b", status: "submitted", visaType: "Schengen", customer: { id: "c2", fullName: "Omar Saleh" } }),
  visa({ id: "c", status: "approved", country: "Japan", customer: null }),
];

const ids = (list: VisaApplicationWithCustomer[]) => list.map((v) => v.id);

describe("filterVisaApplications", () => {
  it("returns everything for an empty query and 'all'", () => {
    expect(ids(filterVisaApplications(VISAS, { query: "", status: "all" }))).toEqual(["a", "b", "c"]);
  });

  it("filters by status", () => {
    expect(ids(filterVisaApplications(VISAS, { query: "", status: "submitted" }))).toEqual(["b"]);
  });

  it("searches customer name, country and visa type, case-insensitively", () => {
    expect(ids(filterVisaApplications(VISAS, { query: "sara", status: "all" }))).toEqual(["a"]);
    expect(ids(filterVisaApplications(VISAS, { query: "JAPAN", status: "all" }))).toEqual(["c"]);
    expect(ids(filterVisaApplications(VISAS, { query: "schengen", status: "all" }))).toEqual(["b"]);
  });

  it("combines search and status", () => {
    expect(ids(filterVisaApplications(VISAS, { query: "sara", status: "approved" }))).toEqual([]);
  });

  it("handles a hidden customer (null) without throwing", () => {
    expect(ids(filterVisaApplications(VISAS, { query: "omar", status: "all" }))).toEqual(["b"]);
  });
});
