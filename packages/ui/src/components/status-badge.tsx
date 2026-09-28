import { Badge, type BadgeProps } from "./badge";

export interface StatusBadgeProps extends Omit<BadgeProps, "children"> {
  label: string;
}

// A thin, purpose-named wrapper over Badge for the common "status pill"
// use case (a required label instead of arbitrary children). Domain
// status badges with a status progression that doesn't cleanly map onto
// Badge's 5 tones (e.g. BookingStatusBadge's 5-tier draft/pending/
// confirmed/completed/cancelled scale, which uses an accent tier and a
// solid-primary tier neither of which is one of neutral/success/warning/
// danger/info) keep their own bespoke styling rather than being forced
// through this and subtly changing color - see BookingStatusBadge's own
// comment. CustomerStatusBadge's 2-state Active/Inactive maps onto
// neutral/danger exactly, so it uses this.
export function StatusBadge({ label, ...props }: StatusBadgeProps) {
  return <Badge {...props}>{label}</Badge>;
}
