"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, InfoRow, LtrText, Skeleton } from "@travio/ui";
import { useLead, LeadNotFoundError } from "../api/leads.api";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import { EditLeadDialog } from "./edit-lead-dialog";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { LeadNotes } from "./notes/lead-notes";
import { ActivityList } from "./activities/activity-list";
import { LeadTimeline } from "./timeline/lead-timeline";
import { LEAD_SOURCE_KEYS } from "../utils/label-keys";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

function BackToLeadsLink() {
  const t = useT();
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/leads">{t("leads.back")}</Link>
    </Button>
  );
}

function LeadDetailsSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("leads.loadingOne")} className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function LeadNotFoundState() {
  const t = useT();
  return (
    <EmptyState
      className="p-12"
      icon={<SearchX size={20} />}
      title={t("leads.notFound")}
      action={<BackToLeadsLink />}
    />
  );
}

function LeadDetailsErrorState() {
  const t = useT();
  return (
    <div className="space-y-4">
      <BackToLeadsLink />
      <div
        role="alert"
        className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
      >
        {t("leads.loadOneError")}
      </div>
    </div>
  );
}

export function LeadDetails({ id }: { id: string }) {
  const t = useT();
  const format = useFormat();
  const { data: lead, isLoading, error } = useLead(id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  if (isLoading) {
    return <LeadDetailsSkeleton />;
  }

  if (error instanceof LeadNotFoundError) {
    return <LeadNotFoundState />;
  }

  if (error || !lead) {
    return <LeadDetailsErrorState />;
  }

  return (
    <div className="space-y-8">
      <BackToLeadsLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-heading-lg text-foreground">{lead.fullName}</h1>
          <LeadStatusBadge status={lead.status} />
          {lead.source && <LeadSourceBadge source={lead.source} />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            {t("common.edit")}
          </Button>
          {lead.status !== "won" && (
            <Button onClick={() => setIsConvertOpen(true)}>{t("leads.convert.title")}</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">{t("leads.information")}</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label={t("field.fullName")} value={lead.fullName} />
            <InfoRow label={t("field.email")} value={lead.email ?? "—"} />
            <InfoRow label={t("field.phone")} value={lead.phone ? <LtrText>{lead.phone}</LtrText> : "—"} />
            <InfoRow label={t("field.source")} value={lead.source ? t(LEAD_SOURCE_KEYS[lead.source]) : "—"} />
            <InfoRow label={t("common.status")} value={<LeadStatusBadge status={lead.status} />} />
            <InfoRow
              label={t("field.createdAt")}
              value={lead.createdAt ? format.date(lead.createdAt) : "—"}
            />
            <InfoRow
              label={t("field.updatedAt")}
              value={lead.updatedAt ? format.date(lead.updatedAt) : "—"}
            />
            {/* No profiles join here by design - assigned_to is displayed
                as-is (raw id) until a name-resolution path exists. */}
            <InfoRow label={t("field.assignedTo")} value={lead.assignedTo ?? t("common.unassigned")} />
          </dl>
        </CardContent>
      </Card>

      <LeadNotes leadId={lead.id} />

      <ActivityList leadId={lead.id} />

      <LeadTimeline leadId={lead.id} />

      <EditLeadDialog lead={lead} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <ConvertLeadDialog lead={lead} open={isConvertOpen} onOpenChange={setIsConvertOpen} />
    </div>
  );
}
