import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@travio/database/admin";
import { logger } from "@travio/logger";

export interface ThrottleKeys {
  pair: string;
  address: string;
  email: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Hashed, so the database holds neither emails nor IP addresses.
export function throttleKeys(email: string, address: string): ThrottleKeys {
  const normalized = email.trim().toLowerCase();
  return {
    pair: hash(`pair:${normalized}:${address}`),
    address: hash(`address:${address}`),
    email: hash(`email:${normalized}`),
  };
}

export async function clientAddress(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0]?.trim() || store.get("x-real-ip") || "unknown";
}

// A broken throttle must never stop people signing in, so every failure
// here is logged and treated as "not blocked". The auth service's own
// limits still apply.
export async function isBlocked(keys: ThrottleKeys): Promise<boolean> {
  try {
    const { data, error } = await createAdminSupabaseClient().rpc("login_is_blocked", {
      pair_key: keys.pair,
      address_key: keys.address,
      email_key: keys.email,
    });
    if (error) throw error;
    return data === true;
  } catch (error) {
    logger.error({ message: "Sign-in throttle check failed", action: "login_is_blocked", error });
    return false;
  }
}

export async function recordFailure(keys: ThrottleKeys): Promise<void> {
  try {
    const { error } = await createAdminSupabaseClient().rpc("login_record_failure", {
      pair_key: keys.pair,
      address_key: keys.address,
      email_key: keys.email,
    });
    if (error) throw error;
  } catch (error) {
    logger.error({ message: "Sign-in throttle record failed", action: "login_record_failure", error });
  }
}

export async function clearFailures(keys: ThrottleKeys): Promise<void> {
  try {
    const { error } = await createAdminSupabaseClient().rpc("login_clear_failures", { pair_key: keys.pair });
    if (error) throw error;
  } catch (error) {
    logger.error({ message: "Sign-in throttle clear failed", action: "login_clear_failures", error });
  }
}
