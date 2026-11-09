import type { AgencyStatusFilter } from "@travio/api";

export const AGENCIES_PAGE_SIZE = 20;

export interface AgencyParams {
  search: string;
  status: AgencyStatusFilter;
  page: number;
}

const STATUSES: readonly AgencyStatusFilter[] = ["all", "active", "inactive"];

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// The page's URL parameters, cleaned: anything unrecognised falls back
// to the default rather than reaching the database.
export function parseAgencyParams(params: Record<string, string | string[] | undefined>): AgencyParams {
  const status = first(params.status) as AgencyStatusFilter;
  const page = Number(first(params.page));
  return {
    search: first(params.q).trim().slice(0, 100),
    status: STATUSES.includes(status) ? status : "all",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// The URL for a set of parameters; defaults are left out.
export function agenciesHref(params: AgencyParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("q", params.search);
  if (params.status !== "all") query.set("status", params.status);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/tenants?${text}` : "/tenants";
}
