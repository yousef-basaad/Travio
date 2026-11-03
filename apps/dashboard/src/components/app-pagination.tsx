"use client";

import { Pagination, type PaginationProps } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

// @travio/ui's Pagination with its text in the user's language.
export function AppPagination(props: Omit<PaginationProps, "labels">) {
  const t = useT();
  return (
    <Pagination
      {...props}
      labels={{
        navigation: t("pagination.label"),
        range: (from, to, total) => t("pagination.range", { from, to, total }),
        previous: t("pagination.previous"),
        next: t("pagination.next"),
        page: (page, count) => t("pagination.page", { page, count }),
      }}
    />
  );
}
