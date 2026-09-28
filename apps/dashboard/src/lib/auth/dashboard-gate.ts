import type { Route } from "next";
import type { RequireRoleResult } from "@travio/auth/server";
import type { AgencySetupOutcome } from "./complete-agency-setup";

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

// Where the layout goes after completeAgencySetup(), or null to render.
//   - created / already_exists -> "/" so the layout re-reads the profile
//     (now with its tenant); that render returns "not_needed", no loop
//   - missing_metadata         -> setup-incomplete page (sign out only)
//   - failed                   -> setup-failed page (manual retry + sign
//     out), never an automatic retry
export function getAgencySetupRedirect(outcome: AgencySetupOutcome): Route | null {
  switch (outcome) {
    case "not_needed":
      return null;
    case "created":
    case "already_exists":
      return "/";
    case "missing_metadata":
      return "/forbidden?reason=setup_incomplete";
    case "failed":
      return "/forbidden?reason=setup_failed";
  }
}
