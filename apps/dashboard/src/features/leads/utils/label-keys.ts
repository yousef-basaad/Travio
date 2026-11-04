import type { CrmActivityType, CrmLeadSource, CrmLeadStatus } from "@travio/api";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Message keys for the CRM enums, so every badge, select and info row
// renders the same translated label.
export const LEAD_STATUS_KEYS: Record<CrmLeadStatus, MessageKey> = {
  new: "leadStatus.new",
  contacted: "leadStatus.contacted",
  qualified: "leadStatus.qualified",
  proposal_sent: "leadStatus.proposal_sent",
  won: "leadStatus.won",
  lost: "leadStatus.lost",
};

export const LEAD_SOURCE_KEYS: Record<CrmLeadSource, MessageKey> = {
  walk_in: "leadSource.walk_in",
  website: "leadSource.website",
  whatsapp: "leadSource.whatsapp",
  instagram: "leadSource.instagram",
  snapchat: "leadSource.snapchat",
  tiktok: "leadSource.tiktok",
  referral: "leadSource.referral",
  phone: "leadSource.phone",
  other: "leadSource.other",
};

export const ACTIVITY_TYPE_KEYS: Record<CrmActivityType, MessageKey> = {
  call: "activityType.call",
  email: "activityType.email",
  meeting: "activityType.meeting",
  whatsapp: "activityType.whatsapp",
  task: "activityType.task",
  follow_up: "activityType.follow_up",
};
