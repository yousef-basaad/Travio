import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// What global-setup created for this run: one fresh agency with an owner,
// a sales agent, and a customer who has a portal login and one booking.

export const PASSWORD = "e2e-Travio-pass-1";
export const FIXTURE_FILE = fileURLToPath(new URL("../.auth/fixture.json", import.meta.url));

export interface Account {
  id: string;
  email: string;
  fullName: string;
}

export interface Fixture {
  runId: string;
  tenantId: string;
  agencyName: string;
  owner: Account;
  agent: Account;
  portalUser: Account;
  customerId: string;
  customerName: string;
  bookingId: string;
  bookingTitle: string;
}

export function fixture(): Fixture {
  return JSON.parse(readFileSync(FIXTURE_FILE, "utf8")) as Fixture;
}

export const DASHBOARD = "http://localhost:3101";
export const PORTAL = "http://localhost:3102";
