"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader } from "@travio/ui";
import type { CrmActivity } from "@travio/api";
import { useLeadActivities, useDeleteLeadActivity } from "../../api/leads.api";
import { ActivityItem } from "./activity-item";
import { CreateActivityDialog } from "./create-activity-dialog";
import { EditActivityDialog } from "./edit-activity-dialog";

function ActivitiesSkeleton() {
  return (
    <div role="status" aria-label="Loading activities" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-16 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

function ActivitiesErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
    >
      Something went wrong loading activities. Please try again later.
    </div>
  );
}

function ActivitiesEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">No activities yet</p>
      <Button size="sm" onClick={onAddClick}>
        Add Activity
      </Button>
    </div>
  );
}

export function ActivityList({ leadId }: { leadId: string }) {
  const { data: activities, isLoading, isError } = useLeadActivities(leadId);
  const deleteActivity = useDeleteLeadActivity();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CrmActivity | null>(null);

  const hasActivities = !isLoading && !isError && !!activities && activities.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Activities</h2>
        {hasActivities && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Add Activity
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
