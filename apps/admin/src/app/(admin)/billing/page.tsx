import { AlertCircle } from "lucide-react";
import { platformService, type PlatformSubscriptionPage } from "@travio/api";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import { BillingView } from "@/features/billing";
import { BILLING_PAGE_SIZE, parseBillingParams } from "@/features/billing/utils/billing-params";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Rendered alongside the layout's gate, so it checks the role itself.
  if (!(await requireRole(["travio_admin"])).authorized) return null;

  const params = parseBillingParams(await searchParams);
  let data: PlatformSubscriptionPage | null = null;
  try {
    data = await platformService.listSubscriptions(await createServerSupabaseClient(), { ...params, pageSize: BILLING_PAGE_SIZE });
  } catch (error) {
    console.error("[admin] platform_subscriptions failed", error);
  }

  if (!data) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {translate(await getLocale(), "billing.error")}
      </div>
    );
  }

  return <BillingView data={data} params={params} />;
}
