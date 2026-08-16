import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

// Approved scope decision (Product-8.2 Design Gap Report): UI shell
// only, no fake AI responses or functionality - no AI backend exists
// anywhere in this codebase. This is the honest disabled/coming-soon
// state, not a working (or fake-working) assistant.
export default function AiAssistantPage() {
  return (
    <ComingSoon
      title="AI Assistant"
      description="Ask about your bookings, sales, and performance"
      icon={<Sparkles size={20} />}
      emptyTitle="AI Assistant is coming soon"
      emptyDescription="This is a preview of where your AI assistant will live - it isn't connected to a backend yet, so it can't answer questions today."
    />
  );
}
