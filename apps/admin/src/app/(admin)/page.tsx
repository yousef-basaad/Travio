import { AlertCircle } from "lucide-react";
import { platformService, type PlatformOverview } from "@travio/api";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import { PlatformOverviewView } from "@/features/overview/components/platform-overview-view";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

// Always fresh: these are live platform numbers.
export const dynamic = "force-dynamic";

// Next renders this page alongside (admin)/layout.tsx, so the page checks
// the role itself before asking for platform numbers (the layout then
// redirects anyone else). platform_overview() checks it a third time in
// Postgres.
export default async function OverviewPage() {
  if (!(await requireRole(["travio_admin"])).authorized) return null;

  let overview: PlatformOverview | null = null;
  try {
    overview = await platformService.getOverview(await createServerSupabaseClient());
  } catch (error) {
    console.error("[admin] platform_overview failed", error);
  }

  if (!overview) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {translate(await getLocale(), "overview.error")}
      </div>
    );
  }

  return <PlatformOverviewView overview={overview} />;
}
