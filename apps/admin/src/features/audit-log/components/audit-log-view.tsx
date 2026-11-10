"use client";

import { useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";
import { Card, EmptyState, LtrText, PageHeader, Pagination } from "@travio/ui";
import type { PlatformAuditEntry, PlatformAuditPage } from "@travio/api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

export const AUDIT_PAGE_SIZE = 25;

const ACTION_KEYS: Record<PlatformAuditEntry["action"], MessageKey> = {
  agency_deactivated: "audit.action.agency_deactivated",
  agency_activated: "audit.action.agency_activated",
  plan_updated: "audit.action.plan_updated",
};

const ACTION_TONE: Record<PlatformAuditEntry["action"], string> = {
  agency_deactivated: "bg-danger/10 text-danger",
  agency_activated: "bg-success/10 text-success",
  plan_updated: "bg-primary/10 text-primary",
};

function changes(entry: PlatformAuditEntry): string[] {
  if (!entry.before || !entry.after) return [];
  const lines: string[] = [];
  if (entry.before.price !== entry.after.price) lines.push(`${entry.before.price} → ${entry.after.price}`);
  for (const [key, value] of Object.entries(entry.after.limits)) {
    const previous = entry.before.limits[key];
    if (previous !== value) lines.push(`${key}: ${previous ?? "-"} → ${value}`);
  }
  return lines;
}

// Who changed what on the platform. Read-only: nothing here can be edited
// or removed.
export function AuditLogView({ data, page }: { data: PlatformAuditPage; page: number }) {
  const { t, format } = useI18n();
  const router = useRouter();
  const [isNavigating, startNavigating] = useTransition();

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.audit")} description={t("audit.description")} />
      <Card className="p-5">
        {data.items.length === 0 ? (
          <EmptyState icon={<ScrollText size={20} />} title={t("audit.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 text-start font-medium">{t("audit.when")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("audit.who")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("audit.action")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("audit.target")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("audit.changes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{format.dateTime(entry.createdAt)}</td>
                    <td className="max-w-[14rem] truncate px-3 py-3">{entry.actorEmail ? <LtrText>{entry.actorEmail}</LtrText> : t("agencies.none")}</td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_TONE[entry.action]}`}>{t(ACTION_KEYS[entry.action])}</span>
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-3 font-medium text-foreground">{entry.targetLabel}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {changes(entry).map((line) => (
                        <p key={line} dir="ltr" className="text-start">
                          {line}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          className="mt-4"
          page={page}
          pageSize={AUDIT_PAGE_SIZE}
          total={data.total}
          disabled={isNavigating}
          onPageChange={(next) => startNavigating(() => router.push(`/audit-log?page=${next}` as Route))}
          labels={{
            navigation: t("pagination.label"),
            range: (from, to, total) => t("pagination.range", { from, to, total }),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: (current, pages) => t("pagination.page", { page: current, pages }),
          }}
        />
      </Card>
    </div>
  );
}
