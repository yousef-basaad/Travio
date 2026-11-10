import { AlertCircle } from "lucide-react";
import { platformService, type PlatformAuditPage } from "@travio/api";
import { createServerSupabaseClient } from "@travio/database/server";
import { AUDIT_PAGE_SIZE, AuditLogView } from "@/features/audit-log/components/audit-log-view";
import { isVerifiedAdmin } from "@/lib/auth/mfa";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  // Rendered alongside the layout's gate, so it checks for itself.
  if (!(await isVerifiedAdmin())) return null;

  const requested = Number((await searchParams).page);
  const page = Number.isInteger(requested) && requested >= 1 ? requested : 1;

  let data: PlatformAuditPage | null = null;
  try {
    data = await platformService.listAudit(await createServerSupabaseClient(), page, AUDIT_PAGE_SIZE);
  } catch (error) {
    console.error("[admin] platform_audit_entries failed", error);
  }

  if (!data) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {translate(await getLocale(), "audit.error")}
      </div>
    );
  }

  return <AuditLogView data={data} page={page} />;
}
