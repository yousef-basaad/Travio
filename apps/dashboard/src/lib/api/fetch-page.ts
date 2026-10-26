import type { Page } from "@travio/api";

export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
  /** Extra filters appended as query params when set (e.g. status). */
  filters?: Record<string, string | undefined>;
}

export function pageQueryString({ page, pageSize, search, filters }: PageQuery): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search?.trim()) params.set("q", search.trim());
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

// GET <path>?page=… from a paged list route (see lib/api/page-request.ts).
export async function fetchPage<T>(path: string, query: PageQuery): Promise<Page<T>> {
  const response = await fetch(`${path}?${pageQueryString(query)}`);

  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }

  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as Page<T>).items) ||
    typeof (data as Page<T>).total !== "number"
  ) {
    throw new Error(`Unexpected response from ${path}`);
  }

  return data as Page<T>;
}
