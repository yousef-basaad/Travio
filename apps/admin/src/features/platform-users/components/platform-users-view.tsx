"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Button, Card, EmptyState, LtrText, PageHeader, Pagination } from "@travio/ui";
import type { PlatformUserPage } from "@travio/api";
import { RelativeTime } from "@/components/relative-time";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { USERS_PAGE_SIZE, USER_ROLES, usersHref, type UserParams, type UserRoleFilter } from "../utils/user-params";

function roleKey(role: string): MessageKey {
  return (USER_ROLES as readonly string[]).includes(role) ? (`role.${role}` as MessageKey) : "agencies.none";
}

// Every account on the platform: search, role filter and paging, all in
// the URL and read by the server page. Read-only for now.
export function PlatformUsersView({ data, params }: { data: PlatformUserPage; params: UserParams }) {
  const { t, format } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState(params.search);
  const [isNavigating, startNavigating] = useTransition();

  const go = (next: UserParams) => startNavigating(() => router.push(usersHref(next) as Route));
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    go({ ...params, search: search.trim(), page: 1 });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.users")} description={t("users.description")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md" role="search">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("users.search")}
              aria-label={t("users.search")}
              maxLength={100}
              className="w-full rounded-md border bg-background py-2 pe-3 ps-9 text-sm"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isNavigating}>
            {t("agencies.searchButton")}
          </Button>
        </form>
        <select
          value={params.role}
          onChange={(event) => go({ ...params, role: event.target.value as UserRoleFilter, page: 1 })}
          aria-label={t("users.role")}
          disabled={isNavigating}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t("users.allRoles")}</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(roleKey(role))}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-5">
        {data.items.length === 0 ? (
          <EmptyState icon={<Users size={20} />} title={t("users.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 text-start font-medium">{t("users.name")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("users.role")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.agency")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.joined")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("users.lastSignIn")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("users.emailStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((user) => (
                  <tr key={user.id}>
                    <td className="max-w-[16rem] px-3 py-3">
                      <p className="truncate font-medium text-foreground">{user.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <LtrText>{user.email}</LtrText>
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {t(roleKey(user.role))}
                      </span>
                    </td>
                    <td className="max-w-[14rem] px-3 py-3 text-muted-foreground">
                      <span className="block truncate">{user.agencyName ?? t("agencies.none")}</span>
                      {user.agencyActive === false ? <span className="text-xs text-danger">{t("overview.agencies.inactive")}</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{format.date(user.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {user.lastSignInAt ? <RelativeTime iso={user.lastSignInAt} /> : t("users.never")}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.emailConfirmed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}
                      >
                        {user.emailConfirmed ? t("users.confirmed") : t("users.unconfirmed")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          className="mt-4"
          page={params.page}
          pageSize={USERS_PAGE_SIZE}
          total={data.total}
          disabled={isNavigating}
          onPageChange={(page) => go({ ...params, page })}
          labels={{
            navigation: t("pagination.label"),
            range: (from, to, total) => t("pagination.range", { from, to, total }),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: (page, pages) => t("pagination.page", { page, pages }),
          }}
        />
      </Card>
    </div>
  );
}
