"use client";

import Link from "next/link";
import { ChevronDown, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@travio/ui";
import { useSession, signOut } from "@travio/auth";

// Design System v2.5 (Product-8.2 Phase 2): extracted so the header's
// own user menu and the sidebar's new bottom user card (the reference's
// avatar + name + role + dropdown-indicator card) share one dropdown
// implementation instead of two copies of the same Profile/Settings/
// Logout menu - "create missing shared primitives instead of local
// duplicates" applies just as much within an app as it does to
// @travio/ui. Same content/actions as before this phase: Profile still
// disabled (no dedicated page exists anywhere in this app yet, so it's
// honestly disabled rather than linking nowhere), Settings links to the
// real route, Logout calls the already-existing signOut() server action.
export function UserMenu({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const { profile } = useSession();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  // (dashboard)/layout.tsx only renders this tree once requireRole()
  // has confirmed a profile exists, but the type is Profile | null -
  // render nothing rather than fabricate a placeholder user.
  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className="flex w-full items-center gap-2.5 overflow-hidden rounded-md p-1.5 text-left transition-colors duration-fast ease-default hover:bg-sidebar-hover"
          >
            <Avatar name={profile.fullName} size="sm" />
            <span data-sidebar-block className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">
                {profile.fullName}
              </span>
              <span className="block truncate text-xs capitalize text-sidebar-foreground/60">
                {profile.role.replace(/_/g, " ")}
              </span>
            </span>
            <ChevronDown
              data-sidebar-block
              size={14}
              className="shrink-0 text-sidebar-foreground/50"
              aria-hidden="true"
            />
          </button>
        ) : (
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar name={profile.fullName} size="sm" />
            <span className="hidden text-sm font-medium sm:inline">{profile.fullName}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"}>
        <DropdownMenuLabel>{profile.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-2">
          <User size={15} />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link href="/settings">
            <SettingsIcon size={15} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger className="gap-2" onSelect={handleLogout}>
          <LogOut size={15} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
