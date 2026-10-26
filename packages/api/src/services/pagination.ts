// Shared server-side pagination for list endpoints. PostgREST caps any
// response at max_rows (1000), so a list that loads "everything" silently
// stops at 1000; paged lists ask for one page plus an exact total instead.

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

export interface PageRequest {
  /** 1-based. */
  page: number;
  pageSize: number;
  /** Free-text search; already passed through sanitizeSearch(). */
  search?: string;
}

export interface Page<T> {
  items: T[];
  /** Total rows matching the filters, across all pages. */
  total: number;
  page: number;
  pageSize: number;
}

// Inclusive [from, to] row offsets for .range().
export function toRange({ page, pageSize }: Pick<PageRequest, "page" | "pageSize">): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

// Search text goes into a PostgREST or=(...) filter as a double-quoted
// value (see ilikeAny), so , ( ) are safe and a name like "Sara (VIP), Ali"
// still matches. Only what could end the quoted value (" and \) or act as
// a wildcard (* and %) is dropped; the rest is matched as a plain
// case-insensitive substring. Returns undefined for blank input.
export function sanitizeSearch(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/["\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
  return cleaned || undefined;
}

// PostgREST answers a range that starts past the last matching row with
// 416 / PGRST103 instead of an empty list (e.g. page 3 after a search
// narrowed the results). listPage() turns that into an empty page.
export const RANGE_NOT_SATISFIABLE = "PGRST103";

// col.ilike."*term*" for each column, joined for an .or() filter. The
// quotes make PostgREST read , ( ) inside the term as literal text.
// `search` must come from sanitizeSearch() (no " or \ left in it).
export function ilikeAny(columns: readonly string[], search: string): string {
  return columns.map((column) => `${column}.ilike."*${search}*"`).join(",");
}
