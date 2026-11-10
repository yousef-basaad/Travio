import { AlertCircle } from "lucide-react";
import { platformService, type PlatformPlan } from "@travio/api";
import { isVerifiedAdmin } from "@/lib/auth/mfa";
import { createServerSupabaseClient } from "@travio/database/server";
import { PlatformSettingsView } from "@/features/platform-settings";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  // Rendered alongside the layout's gate, so it checks the role itself.
  if (!(await isVerifiedAdmin())) return null;

  let plans: PlatformPlan[] | null = null;
  try {
    plans = await platformService.listPlans(await createServerSupabaseClient());
  } catch (error) {
    console.error("[admin] platform_plans failed", error);
  }

  if (!plans) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {translate(await getLocale(), "settings.error")}
      </div>
    );
  }

  return <PlatformSettingsView plans={plans} />;
}
