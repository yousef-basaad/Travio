import { describe, it, expect, vi, afterEach } from "vitest";
import { pageInfo } from "@travio/ui";
import { fetchPage, pageQueryString } from "./fetch-page";

describe("pageQueryString", () => {
  it("always sends page and pageSize", () => {
    expect(pageQueryString({ page: 2, pageSize: 25 })).toBe("page=2&pageSize=25");
  });

  it("adds a trimmed search and only the filters that are set", () => {
    expect(
      pageQueryString({ page: 1, pageSize: 25, search: "  sara ", filters: { status: "confirmed", other: undefined } }),
    ).toBe("page=1&pageSize=25&q=sara&status=confirmed");
  });

  it("omits a blank search", () => {
    expect(pageQueryString({ page: 1, pageSize: 25, search: "   " })).toBe("page=1&pageSize=25");
  });
});

describe("fetchPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the page body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ items: [{ id: 1 }], total: 30, page: 1, pageSize: 25 }))),
    );
    await expect(fetchPage("/api/customers", { page: 1, pageSize: 25 })).resolves.toEqual({
      items: [{ id: 1 }],
      total: 30,
      page: 1,
      pageSize: 25,
    });
  });

  it("rejects a non-page body (e.g. the legacy array) and HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]))));
    await expect(fetchPage("/api/customers", { page: 1, pageSize: 25 })).rejects.toThrow("Unexpected response");

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 403 })));
    await expect(fetchPage("/api/customers", { page: 1, pageSize: 25 })).rejects.toThrow("(403)");
  });
});

describe("pageInfo (Pagination component)", () => {
  it("shows the row range of the current page", () => {
    expect(pageInfo(1234, 1, 25)).toEqual({ from: 1, to: 25, pageCount: 50, hasPrevious: false, hasNext: true });
    expect(pageInfo(1234, 50, 25)).toEqual({ from: 1226, to: 1234, pageCount: 50, hasPrevious: true, hasNext: false });
  });

  it("handles an empty list", () => {
    expect(pageInfo(0, 1, 25)).toEqual({ from: 0, to: 0, pageCount: 1, hasPrevious: false, hasNext: false });
  });
});
