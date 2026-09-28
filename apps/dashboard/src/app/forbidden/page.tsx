import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, UserX } from "lucide-react";
import { signOut } from "@travio/auth";
import { Card, CardContent, Button, EmptyState } from "@travio/ui";

// Rendered by (dashboard)/layout.tsx's requireRole() gate whenever a real,
// authenticated session exists but the account's role isn't allowed into
// this app, or its profile row is missing (?reason=no_profile - see
// lib/auth/dashboard-gate.ts) - distinct from /login, which is only for
// "no session at all". Standalone route (outside the (dashboard) route
// group), so it renders without the dashboard shell - a role-forbidden
// account shouldn't see nav for an app it can't use.
//
// Every variant offers "Sign out": middleware redirects signed-in users
// away from /login, so this is the way to switch accounts from here.
async function signOutAndGoToLogin() {
  "use server";
  await signOut();
  redirect("/login");
}

function SignOutButton({ variant }: { variant?: "outline" }) {
  return (
    <form action={signOutAndGoToLogin}>
      <Button type="submit" variant={variant}>
        Sign out
      </Button>
    </form>
  );
}

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const isMissingProfile = reason === "no_profile";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {isMissingProfile ? (
            <EmptyState
              icon={<UserX size={20} />}
              title="Your account isn't set up yet"
              description="You're signed in, but this account has no Travio profile, so there's nothing to show. Contact your agency owner or Travio support to finish setting up your account."
              action={<SignOutButton />}
            />
          ) : (
            <EmptyState
              icon={<ShieldAlert size={20} />}
              title="You don't have permission to view this"
              description="Your account isn't authorized for this part of Travio. If you think this is a mistake, contact your agency owner or Travio support."
              action={
                <div className="flex items-center gap-2">
                  <Button asChild>
                    <Link href="/">Back to dashboard</Link>
                  </Button>
                  <SignOutButton variant="outline" />
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
