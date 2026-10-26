import type { Profile } from "@travio/types";
import { createServerSupabaseClient } from "@travio/database/server";
import { logger } from "@travio/logger";

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type AgencySetupOutcome =
  | "not_needed"
  | "created"
  | "already_exists"
  | "missing_metadata"
  | "failed";

// create_agency()'s own message for a caller that already has a tenant
// (20260928120000 migration) - here it means another request finished
// the setup first, so it counts as success.
const ALREADY_IN_AGENCY_MESSAGE = "caller already belongs to an agency";

// Finishes an agency signup on the owner's first dashboard sign-in. With
// email confirmation ON, the website's signUp has no session, so it can't
// call create_agency(); it stores agency_name/cr_number in user_metadata
// instead, and this creates the agency with the owner's own session.
//
// Only an agency_owner without a tenant is touched - everyone else
// returns "not_needed" before any Supabase call. create_agency() itself
// refuses a second agency for the same user, so this is idempotent.
export async function completeAgencySetup(
  profile: Profile,
  getClient: () => Promise<ServerClient> = createServerSupabaseClient,
): Promise<AgencySetupOutcome> {
  if (profile.role !== "agency_owner" || profile.tenantId) {
    return "not_needed";
  }

  const supabase = await getClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.error({
      message: "First-login agency setup: could not load the signed-in user",
      action: "completeAgencySetup",
      userId: profile.id,
      error: userError,
    });
    return "failed";
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const agencyName = typeof metadata.agency_name === "string" ? metadata.agency_name.trim() : "";
  const crNumber = typeof metadata.cr_number === "string" ? metadata.cr_number.trim() : "";

  if (!agencyName || !crNumber) {
    return "missing_metadata";
  }

  const { error } = await supabase.rpc("create_agency", {
    agency_name: agencyName,
    agency_cr_number: crNumber,
  });

  if (!error) return "created";
  if (error.message?.includes(ALREADY_IN_AGENCY_MESSAGE)) return "already_exists";

  logger.error({
    message: "First-login agency setup: create_agency failed",
    action: "completeAgencySetup",
    userId: profile.id,
    error,
  });
  return "failed";
}
