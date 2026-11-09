"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { platformService } from "@travio/api";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";

const inputSchema = z.object({ tenantId: z.string().uuid(), active: z.boolean() });

// Server actions are public endpoints, so this checks the role itself;
// platform_set_agency_active() checks it again in Postgres.
export async function setAgencyActive(tenantId: string, active: boolean): Promise<{ ok: boolean }> {
  const input = inputSchema.safeParse({ tenantId, active });
  if (!input.success) return { ok: false };
  if (!(await requireRole(["travio_admin"])).authorized) return { ok: false };

  try {
    await platformService.setAgencyActive(await createServerSupabaseClient(), input.data.tenantId, input.data.active);
  } catch (error) {
    console.error("[admin] platform_set_agency_active failed", error);
    return { ok: false };
  }

  revalidatePath("/tenants");
  revalidatePath("/");
  return { ok: true };
}
