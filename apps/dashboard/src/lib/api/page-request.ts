import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, sanitizeSearch, type PageRequest } from "@travio/api";

const pageParamsSchema = z.object({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PageRequestParse =
  | { kind: "legacy" }
  | { kind: "page"; request: PageRequest }
  | { kind: "invalid"; issues: z.ZodIssue[] };

// List routes answer in two modes:
//   - no ?page=      -> the full array, as before (callers that still need
//                      everything, e.g. pickers and lookups)
//   - ?page=N        -> { items, total, page, pageSize } for paged tables,
//                      with optional pageSize (1-100, default 25) and q
export function parsePageRequest(searchParams: URLSearchParams): PageRequestParse {
  if (!searchParams.has("page")) return { kind: "legacy" };

  const parsed = pageParamsSchema.safeParse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) return { kind: "invalid", issues: parsed.error.issues };

  const search = sanitizeSearch(searchParams.get("q"));
  return {
    kind: "page",
    request: { page: parsed.data.page, pageSize: parsed.data.pageSize, ...(search ? { search } : {}) },
  };
}
