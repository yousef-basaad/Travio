"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { platformService } from "@travio/api";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import { parsePlanForm } from "../utils/plan-form";

// Server actions are public endpoints, so this validates and checks the
// role itself; platform_update_plan() does both again in Postgres.
export async function updatePlan(planId: string, price: string, limits: Record<string, string>): Promise<{ ok: boolean }> {
  const form = parsePlanForm(price, limits);
  if (!form || !z.string().uuid().safeParse(planId).success) return { ok: false };
  if (!(await requireRole(["travio_admin"])).authorized) return { ok: false };

  try {
    await platformService.updatePlan(await createServerSupabaseClient(), planId, form.price, form.limits);
  } catch (error) {
    console.error("[admin] platform_update_plan failed", error);
    return { ok: false };
  }

  revalidatePath("/platform-settings");
  revalidatePath("/billing");
  return { ok: true };
}
