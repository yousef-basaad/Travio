import { describe, it, expect } from "vitest";
import { itemsForRole } from "./nav-access";
import {
  AGENCY_OWNER_ROLES,
  ANALYTICS_ROLES,
  BOOKINGS_ROLES,
  CUSTOMERS_ROLES,
  DASHBOARD_ROLES,
  FINANCE_ROLES,
  LEADS_ROLES,
  VISA_ROLES,
} from "../auth/domain-roles";

// Mirrors the sidebar's real role assignments (dashboard-sidebar.tsx).
const ITEMS = [
  { href: "/", roles: DASHBOARD_ROLES },
  { href: "/customers", roles: CUSTOMERS_ROLES },
  { href: "/leads", roles: LEADS_ROLES },
  { href: "/bookings", roles: BOOKINGS_ROLES },
  { href: "/visa", roles: VISA_ROLES },
  { href: "/finance", roles: FINANCE_ROLES },
  { href: "/analytics", roles: ANALYTICS_ROLES },
  { href: "/team", roles: AGENCY_OWNER_ROLES },
  { href: "/subscription", roles: AGENCY_OWNER_ROLES },
  { href: "/settings", roles: AGENCY_OWNER_ROLES },
];

const hrefs = (role: Parameters<typeof itemsForRole>[1]) => itemsForRole(ITEMS, role).map((i) => i.href);

describe("itemsForRole", () => {
  it("agency owner sees everything", () => {
    expect(hrefs("agency_owner")).toEqual(ITEMS.map((i) => i.href));
  });

  it("sales agent: CRM, leads, bookings, visas, analytics - no finance or owner pages", () => {
    expect(hrefs("sales_agent")).toEqual(["/", "/customers", "/leads", "/bookings", "/visa", "/analytics"]);
  });

  it("branch manager: like a sales agent, still no finance or owner pages", () => {
    expect(hrefs("branch_manager")).toEqual(["/", "/customers", "/leads", "/bookings", "/visa", "/analytics"]);
  });

  it("visa officer: only the Visa Center (plus home)", () => {
    expect(hrefs("visa_officer")).toEqual(["/", "/visa"]);
  });

  it("accountant: only Finance (plus home)", () => {
    expect(hrefs("accountant")).toEqual(["/", "/finance"]);
  });

  it("no role (e.g. while the session loads) shows nothing", () => {
    expect(hrefs(null)).toEqual([]);
    expect(hrefs(undefined)).toEqual([]);
  });

  it("customer role never gets dashboard items", () => {
    expect(hrefs("customer")).toEqual([]);
  });
});
