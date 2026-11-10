import { AlertCircle } from "lucide-react";
import { platformService, type AgencyListPage } from "@travio/api";
import { isVerifiedAdmin } from "@/lib/auth/mfa";
import { createServerSupabaseClient } from "@travio/database/server";
import { TenantsView } from "@/features/tenants";
import { AGENCIES_PAGE_SIZE, parseAgencyParams } from "@/features/tenants/utils/agency-params";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Rendered alongside the layout's gate, so it checks the role itself.
  if (!(await isVerifiedAdmin())) return null;

  const params = parseAgencyParams(await searchParams);
  let data: AgencyListPage | null = null;
  try {
    data = await platformService.listAgencies(await createServerSupabaseClient(), { ...params, pageSize: AGENCIES_PAGE_SIZE });
  } catch (error) {
    console.error("[admin] platform_agencies failed", error);
  }

  if (!data) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {translate(await getLocale(), "agencies.error")}
      </div>
    );
  }

  return <TenantsView data={data} params={params} />;
}
