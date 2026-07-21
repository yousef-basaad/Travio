import type { CrmLead } from "./crm-leads.mapper";
import type { CrmNote } from "./crm-notes.mapper";
import type { CrmActivity } from "./crm-activities.mapper";

export type CrmTimelineItemType = "lead_created" | "note" | "activity";

export interface CrmTimelineItem {
  id: string;
  type: CrmTimelineItemType;
  title: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// This layer never touches a generated Row type directly - it only maps
// already-mapped domain objects (CrmLead/CrmNote/CrmActivity, produced by
// their own services) into the unified timeline shape, so "keep Row types
// internal" holds automatically.

export function leadToTimelineItem(lead: CrmLead): CrmTimelineItem | null {
  // createdAt is nullable on CrmLead (the column has no NOT NULL
  // constraint) - if it's genuinely missing, there's nothing honest to
  // sort it by, so this event is omitted rather than backdated with a
  // fabricated timestamp.
  if (!lead.createdAt) return null;

  return {
    id: `lead_created:${lead.id}`,
    type: "lead_created",
    title: `Lead created: ${lead.fullName}`,
    createdAt: lead.createdAt,
    metadata: { leadId: lead.id, source: lead.source, status: lead.status },
  };
}

export function noteToTimelineItem(note: CrmNote): CrmTimelineItem {
  return {
    id: `note:${note.id}`,
    type: "note",
    title: "Note added",
    description: note.body,
    createdAt: note.createdAt,
    metadata: { noteId: note.id, createdBy: note.createdBy },
  };
}

export function activityToTimelineItem(activity: CrmActivity): CrmTimelineItem | null {
  // performedAt is the meaningful "when did this happen" timestamp (it's
  // what the Activities UI itself displays); createdAt is the fallback if
  // it's ever null. If both are missing there's nothing honest to sort
  // by, so this event is omitted.
  const createdAt = activity.performedAt ?? activity.createdAt;
  if (!createdAt) return null;

  return {
    id: `activity:${activity.id}`,
    type: "activity",
    title: activity.title,
    description: activity.description ?? undefined,
    createdAt,
    metadata: {
      activityId: activity.id,
      activityType: activity.type,
      performedBy: activity.performedBy,
    },
  };
}
