import { ShieldAlert } from "lucide-react";
import { Card, CardContent, EmptyState } from "@travio/ui";

// Stabilization Phase 1: customer-portal's equivalent of the dashboard
// app's own /forbidden page. Rendered by (portal)/layout.tsx's
// requireRole() gate whenever a real, authenticated session exists but
// the account's role isn't "customer" (e.g. agency staff signed into
// the wrong app), or requireRole() itself failed (see require-role.ts's
// "error" reason). Deliberately distinct from NoPortalAccess: that
// component is for a real "customer"-role session with no linked
// customer_id yet (an expected, honest "nothing to show yet" state,
// unchanged by this phase) - this page is for a session that isn't a
// customer at all.
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<ShieldAlert size={20} />}
            title="You don't have permission to view this"
            description="This portal is only available to Travio customers. If you're a travel agency staff member, please use the Travio dashboard instead."
          />
        </CardContent>
      </Card>
    </div>
  );
}
