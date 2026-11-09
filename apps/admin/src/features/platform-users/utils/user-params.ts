export const USERS_PAGE_SIZE = 20;

export const USER_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
  "visa_officer",
  "accountant",
  "customer",
] as const;

export type UserRoleFilter = (typeof USER_ROLES)[number] | "all";

export interface UserParams {
  search: string;
  role: UserRoleFilter;
  page: number;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// The page's URL parameters, cleaned: anything unrecognised falls back
// to the default rather than reaching the database.
export function parseUserParams(params: Record<string, string | string[] | undefined>): UserParams {
  const role = first(params.role);
  const page = Number(first(params.page));
  return {
    search: first(params.q).trim().slice(0, 100),
    role: (USER_ROLES as readonly string[]).includes(role) ? (role as UserRoleFilter) : "all",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// The URL for a set of parameters; defaults are left out.
export function usersHref(params: UserParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("q", params.search);
  if (params.role !== "all") query.set("role", params.role);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/platform-users?${text}` : "/platform-users";
}
