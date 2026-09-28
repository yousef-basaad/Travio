import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="How Travio handles your data"
      icon={<ShieldCheck size={20} />}
      emptyTitle="Privacy Policy coming soon"
      emptyDescription="This page's content hasn't been published yet."
    />
  );
}
