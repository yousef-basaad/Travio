import { Palette } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

// Per-agency white-label branding (logo, colors) isn't built yet - an
// honest placeholder instead of developer text. Not linked from the
// sidebar until it exists.
export default function BrandingPage() {
  return (
    <ComingSoon
      title="Branding"
      description="Your agency's logo and colors"
      icon={<Palette size={20} />}
      emptyTitle="Branding is coming soon"
      emptyDescription="Custom logos and colors for your agency aren't available yet. Your agency's name and contact details can be edited in Settings."
    />
  );
}
