"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import type { CrmActivity } from "@travio/api";
import { useLeadActivities, useDeleteLeadActivity } from "../../api/leads.api";
import { ActivityItem } from "./activity-item";
import { CreateActivityDialog } from "./create-activity-dialog";
import { EditActivityDialog } from "./edit-activity-dialog";
import { useT } from "@/lib/i18n/i18n-provider";

function ActivitiesSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("leads.activities.loading")} className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function ActivitiesErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      {t("leads.activities.error")}
    </div>
  );
}

function ActivitiesEmptyState({ onAddClick }: { onAddClick: () => void }) {
  const t = useT();
  return (
    <EmptyState
      icon={<ListChecks size={20} />}
      message={t("leads.activities.empty")}
      action={
        <Button size="sm" onClick={onAddClick}>
          {t("leads.activities.add")}
        </Button>
      }
    />
  );
}

export function ActivityList({ leadId }: { leadId: string }) {
  const t = useT();
  const { data: activities, isLoading, isError } = useLeadActivities(leadId);
  const deleteActivity = useDeleteLeadActivity();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CrmActivity | null>(null);

  const hasActivities = !isLoading && !isError && !!activities && activities.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">{t("nav.activities")}</h2>
        {hasActivities && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            {t("leads.activities.add")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ActivitiesSkeleton />
        ) : isError ? (
          <ActivitiesErrorState />
        ) : !hasActivities ? (
          <ActivitiesEmptyState onAddClick={() => setIsCreateOpen(true)} />
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onEdit={setEditingActivity}
                onDelete={(id) => deleteActivity.mutate({ id, leadId })}
                isDeleting={deleteActivity.isPending && deleteActivity.variables?.id === activity.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateActivityDialog leadId={leadId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditActivityDialog
        activity={editingActivity}
        leadId={leadId}
        open={editingActivity !== null}
        onOpenChange={(open) => {
          if (!open) setEditingActivity(null);
        }}
      />
    </Card>
  );
}
