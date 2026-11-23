import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DASHBOARD, FIXTURE_FILE, PASSWORD, PORTAL, type Fixture } from "./fixture";
import { createUser, deleteUser, insert, remove, rpcAs, signIn, update } from "./supabase-admin";

// One fresh agency per run, so tests never depend on (or disturb) demo
// data: an owner who creates the agency the way signup does
// (create_agency as themselves), a sales agent and a portal customer
// linked the way an accepted invitation links them, and one booking.
// Playwright waits for one URL; both apps must answer before tests start
// (a first request on a cold server can take a while on a busy machine).
async function waitForApps(): Promise<void> {
  for (const base of [DASHBOARD, PORTAL]) {
    const deadline = Date.now() + 3 * 60 * 1000;
    for (;;) {
      const ok = await fetch(`${base}/login`).then((r) => r.ok, () => false);
      if (ok) break;
      if (Date.now() > deadline) throw new Error(`${base} did not come up`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export default async function globalSetup(): Promise<void> {
  await waitForApps();
  // If setup fails partway, remove what it already made: teardown only
  // knows about a run once the fixture file is written at the end.
  const createdUsers: string[] = [];
  let createdTenant: string | null = null;
  try {
    await build(createdUsers, (id) => (createdTenant = id));
  } catch (error) {
    if (createdTenant) await remove("tenants", `id=eq.${createdTenant}`).catch(() => undefined);
    for (const id of createdUsers) await deleteUser(id).catch(() => undefined);
    throw error;
  }
}

async function build(createdUsers: string[], tenantCreated: (id: string) => void): Promise<void> {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = (who: string) => `e2e-${runId}-${who}@local.test`;

  const ownerName = "E2E Owner";
  // account_type "agency" is what the signup form sends; without it a new
  // login is a customer account and create_agency refuses it.
  const ownerId = await createUser(email("owner"), PASSWORD, ownerName, { account_type: "agency" });
  createdUsers.push(ownerId);
  const ownerToken = await signIn(email("owner"), PASSWORD);
  const agencyName = `E2E Agency ${runId}`;
  const crNumber = String(Date.now()).slice(-10).padStart(10, "7");
  const tenant = await rpcAs<{ id: string }>(ownerToken, "create_agency", {
    agency_name: agencyName,
    agency_cr_number: crNumber,
  });
  tenantCreated(tenant.id);

  const agentName = "E2E Agent";
  const agentId = await createUser(email("agent"), PASSWORD, agentName);
  createdUsers.push(agentId);
  await update("profiles", `id=eq.${agentId}`, { tenant_id: tenant.id, role: "sales_agent", full_name: agentName });

  const customerName = "E2E Portal Customer";
  const customer = await insert<{ id: string }>("customers", {
    tenant_id: tenant.id,
    full_name: customerName,
    email: email("portal"),
    assigned_to: agentId,
  });
  const portalId = await createUser(email("portal"), PASSWORD, customerName);
  createdUsers.push(portalId);
  await update("profiles", `id=eq.${portalId}`, { tenant_id: tenant.id, role: "customer", customer_id: customer.id });

  const bookingTitle = "E2E Trip to Istanbul";
  const booking = await insert<{ id: string }>("bookings", {
    tenant_id: tenant.id,
    customer_id: customer.id,
    booking_number: `E2E-${runId}`.toUpperCase(),
    title: bookingTitle,
    status: "confirmed",
    start_date: "2027-01-10",
    end_date: "2027-01-15",
    total_amount: 4200,
    created_by: ownerId,
    assigned_to: agentId,
  });

  const fixture: Fixture = {
    runId,
    tenantId: tenant.id,
    agencyName,
    owner: { id: ownerId, email: email("owner"), fullName: ownerName },
    agent: { id: agentId, email: email("agent"), fullName: agentName },
    portalUser: { id: portalId, email: email("portal"), fullName: customerName },
    customerId: customer.id,
    customerName,
    bookingId: booking.id,
    bookingTitle,
  };
  mkdirSync(dirname(FIXTURE_FILE), { recursive: true });
  writeFileSync(FIXTURE_FILE, JSON.stringify(fixture, null, 2));
}
