import { describe, it, expect } from "vitest";
import { parsePageRequest } from "./page-request";

const parse = (query: string) => parsePageRequest(new URLSearchParams(query));

describe("parsePageRequest", () => {
  it("without ?page= keeps the legacy full-list mode", () => {
    expect(parse("")).toEqual({ kind: "legacy" });
    expect(parse("q=sara")).toEqual({ kind: "legacy" });
  });

  it("defaults pageSize to 25", () => {
    expect(parse("page=2")).toEqual({ kind: "page", request: { page: 2, pageSize: 25 } });
  });

  it("accepts pageSize and a sanitized search", () => {
    expect(parse('page=1&pageSize=50&q=  sara(ali)" ')).toEqual({
      kind: "page",
      request: { page: 1, pageSize: 50, search: "sara(ali)" },
    });
  });

  it("drops a blank search", () => {
    expect(parse("page=1&q=%20%20")).toEqual({ kind: "page", request: { page: 1, pageSize: 25 } });
  });

  it("rejects page < 1, non-numbers, and pageSize above 100", () => {
    expect(parse("page=0").kind).toBe("invalid");
    expect(parse("page=abc").kind).toBe("invalid");
    expect(parse("page=1&pageSize=101").kind).toBe("invalid");
    expect(parse("page=1.5").kind).toBe("invalid");
  });
});
