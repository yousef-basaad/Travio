import { Inbox as InboxIcon } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

// No messaging/inbox system exists (per this phase's explicit scope
// decision: "do not create an inbox system, use the icon as a
// notification/activity shortcut only") - this placeholder points at
// the one real, related feature that does exist today (the header's
// notification bell) instead of implying a message inbox is here.
export default function InboxPage() {
  return (
    <ComingSoon
      title="Inbox"
      description="Messages and requests from your team and customers"
      icon={<InboxIcon size={20} />}
      emptyTitle="Inbox isn't available yet"
      emptyDescription="A unified message inbox hasn't been built yet - check the notification bell in the header for your latest updates in the meantime."
    />
  );
}
