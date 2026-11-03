import type { UserRole } from "@travio/types";

// A navigation entry that only some roles may use. `roles` comes from
// lib/auth/domain-roles.ts - the same lists the API route guards enforce -
// so the sidebar never offers a page whose data would answer 403.
export interface RoleScopedItem {
  roles: readonly UserRole[];
}

export function itemsForRole<T extends RoleScopedItem>(items: readonly T[], role: UserRole | null | undefined): T[] {
  if (!role) return [];
  return items.filter((item) => item.roles.includes(role));
}
