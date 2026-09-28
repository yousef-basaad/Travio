import { HelpCircle } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function HelpCenterPage() {
  return (
    <ComingSoon
      title="Help Center"
      description="Guides and support for your agency"
      icon={<HelpCircle size={20} />}
      emptyTitle="Help Center is coming soon"
      emptyDescription="Guides, FAQs, and support contact details aren't published here yet."
    />
  );
}
