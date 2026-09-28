import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, Button, EmptyState } from "@travio/ui";

// Rendered by (dashboard)/layout.tsx's requireRole() gate whenever a real,
// authenticated session exists but the account's role isn't allowed into
// this app (or its profile row is missing) - distinct from /login, which
// is only for "no session at all". Standalone route (outside the
// (dashboard) route group), so it renders without the dashboard shell -
// a role-forbidden account shouldn't see nav for an app it can't use.
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<ShieldAlert size={20} />}
            title="You don't have permission to view this"
            description="Your account isn't authorized for this part of Travio. If you think this is a mistake, contact your agency owner or Travio support."
            action={
              <Button asChild>
                <Link href="/">Back to dashboard</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
