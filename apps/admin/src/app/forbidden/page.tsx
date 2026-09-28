import { ShieldAlert } from "lucide-react";
import { Card, CardContent, EmptyState } from "@travio/ui";

// Stabilization Phase 1: admin's equivalent of the dashboard app's own
// /forbidden page (apps/dashboard/src/app/forbidden/page.tsx) - rendered
// by (admin)/layout.tsx's requireRole() gate whenever a real,
// authenticated session exists but the account isn't a travio_admin (or
// requireRole() itself failed - see require-role.ts's "error" reason).
// Distinct from /login, which is only for "no session at all". No
// "back" action: unlike the dashboard's forbidden page (which can safely
// link back to "/", a route the same account may still be allowed into
// once role-corrected), a forbidden admin account has nowhere in this
// app to go back to.
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<ShieldAlert size={20} />}
            title="You don't have permission to view this"
            description="This area is restricted to Travio staff administrators. If you think this is a mistake, contact Travio support."
          />
        </CardContent>
      </Card>
    </div>
  );
}
