import { existsSync, rmSync } from "node:fs";
import { FIXTURE_FILE, fixture } from "./fixture";
import { deleteUser, remove } from "./supabase-admin";

// Removes this run's agency (everything under it cascades) and its three
// logins. Payments go first: the finance rules re-check invoice totals
// when items disappear, and an invoice that still has payments would
// refuse the cascade.
export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_KEEP_DATA === "1" || !existsSync(FIXTURE_FILE)) return;
  const run = fixture();

  try {
    await remove("payments", `tenant_id=eq.${run.tenantId}`);
    await remove("tenants", `id=eq.${run.tenantId}`);
  } catch (error) {
    console.warn(`[e2e] could not remove agency ${run.tenantId}:`, error);
  }
  for (const account of [run.owner, run.agent, run.portalUser]) {
    await deleteUser(account.id).catch((error) => console.warn(`[e2e] could not remove ${account.email}:`, error));
  }
  rmSync(FIXTURE_FILE);
}
