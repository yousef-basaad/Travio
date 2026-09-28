import type { Route } from "next";
import type { RequireRoleResult } from "@travio/auth/server";

// Where (dashboard)/layout.tsx sends a requireRole() result, or null to
// render the dashboard. Kept pure so the routing decision is unit
// tested without rendering the layout.
//   - no session              -> /login
//   - session, no profile row -> /forbidden?reason=no_profile (its own
//     message + sign-out; "Back to dashboard" would just loop here)
//   - wrong role, or "error"  -> /forbidden (unchanged)
export function getDashboardGateRedirect(result: RequireRoleResult): Route | null {
  if (result.authorized) return null;
  if (result.reason === "unauthenticated") return "/login";
  if (result.reason === "forbidden" && result.detail === "no_profile") {
    return "/forbidden?reason=no_profile";
  }
  return "/forbidden";
}
