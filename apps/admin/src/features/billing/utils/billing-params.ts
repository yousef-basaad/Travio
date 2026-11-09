export const BILLING_PAGE_SIZE = 20;

export const BILLING_STATUSES = ["active", "trialing", "past_due", "cancelled", "expired", "none"] as const;

export type BillingStatusFilter = (typeof BILLING_STATUSES)[number] | "all";

export interface BillingParams {
  search: string;
  status: BillingStatusFilter;
  page: number;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// The page's URL parameters, cleaned: anything unrecognised falls back
// to the default rather than reaching the database.
export function parseBillingParams(params: Record<string, string | string[] | undefined>): BillingParams {
  const status = first(params.status);
  const page = Number(first(params.page));
  return {
    search: first(params.q).trim().slice(0, 100),
    status: (BILLING_STATUSES as readonly string[]).includes(status) ? (status as BillingStatusFilter) : "all",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// The URL for a set of parameters; defaults are left out.
export function billingHref(params: BillingParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("q", params.search);
  if (params.status !== "all") query.set("status", params.status);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/billing?${text}` : "/billing";
}
