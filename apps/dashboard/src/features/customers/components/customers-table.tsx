"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Users } from "lucide-react";
import {
  Button,
  PageHeader,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SearchInput,
  LtrText,
  Avatar,
  Badge,
  Card,
} from "@travio/ui";
import { cn } from "@travio/utils";
import { AppPagination } from "@/components/app-pagination";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useCustomersPage } from "../api/customers.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { CreateCustomerDialog } from "./create-customer-dialog";
import { CustomerPreviewPanel } from "./customer-preview-panel";
import { isActiveCustomer } from "../utils/customer-activity";

// Columns from the TRAVIO design (03). Bookings/spent/last activity come
// from customer_list_stats for the customers on the page.
const COLUMNS: MessageKey[] = [
  "customers.col.customer",
  "customers.col.contact",
  "field.nationality",
  "customers.col.bookings",
  "customers.col.spent",
  "customers.col.lastActivity",
  "common.status",
];

// openCreate comes from /customers?new=1 (the Quick add menu's "New
// Customer"). It opens the dialog, then the param is dropped from the URL
// so a refresh or closing the dialog doesn't reopen it.
export function CustomersTable({ openCreate = false }: { openCreate?: boolean }) {
  const router = useRouter();
  const t = useT();
  const format = useFormat();
  // Server-side paging + search (name/email/phone), so the list isn't
  // capped at the 1000 rows a single response can carry.
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging();
  const { data, isLoading, isError, isFetching } = useCustomersPage({
    page,
    pageSize,
    search: debouncedSearch,
  });
  const customers = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);
  const [isCreateOpen, setIsCreateOpen] = useState(openCreate);
  // The customer shown in the side panel (wide screens): the one picked,
  // or the first on the page.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = customers.find((customer) => customer.id === selectedId) ?? customers[0] ?? null;

  useEffect(() => {
    if (openCreate) {
      setIsCreateOpen(true);
      router.replace("/customers", { scroll: false });
    }
  }, [openCreate, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customers.title")}
        description={t("customers.description")}
        actions={<Button onClick={() => setIsCreateOpen(true)}>{t("customers.new")}</Button>}
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0 space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-foreground text-sm font-semibold">
              {t("customers.listTitle")}
              {data ? (
                <span className="text-muted-foreground ms-1 font-normal">
                  ({format.number(data.total)})
                </span>
              ) : null}
            </h2>
            <SearchInput
              placeholder={t("customers.searchPlaceholder")}
              aria-label={t("customers.searchLabel")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              containerClassName="w-full max-w-sm"
            />
          </div>

          <DataTableState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && customers.length === 0}
            loadingLabel={t("customers.loading")}
            errorMessage={t("customers.loadError")}
            emptyMessage={debouncedSearch ? t("customers.emptySearch") : t("customers.empty")}
            emptyAction={
              !debouncedSearch ? (
                <Button onClick={() => setIsCreateOpen(true)}>{t("customers.new")}</Button>
              ) : undefined
            }
            emptyIcon={<Users size={20} />}
            size="page"
          >
            <Table aria-label={t("customers.title")} caption={t("customers.tableCaption")}>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell key={column} header>
                      {t(column)}
                    </TableCell>
                  ))}
                  <TableCell header>
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const active = isActiveCustomer(customer.stats.lastActivityAt);
                  const isSelected = selected?.id === customer.id;
                  return (
                    <TableRow
                      key={customer.id}
                      onClick={() => setSelectedId(customer.id)}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "xl:bg-primary/5 xl:hover:bg-primary/5",
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={customer.fullName} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/customers/${customer.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="text-foreground hover:text-primary block truncate font-medium"
                            >
                              {customer.fullName}
                            </Link>
                            <p className="text-muted-foreground truncate text-xs">
                              {t("customers.since", { date: format.date(customer.createdAt) })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground text-sm">
                          {customer.phone ? <LtrText>{customer.phone}</LtrText> : "—"}
                        </p>
                        {customer.email ? (
                          <p className="text-muted-foreground truncate text-xs">{customer.email}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.nationality ?? "—"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {format.number(customer.stats.bookingsCount)}
                      </TableCell>
                      <TableCell className="text-foreground whitespace-nowrap">
                        {format.number(customer.stats.totalSpent)}{" "}
                        <span className="text-muted-foreground text-xs">
                          {t("common.currencySar")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {customer.stats.lastActivityAt
                          ? format.relativeTime(customer.stats.lastActivityAt)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={active ? "success" : "danger"}>
                          {t(active ? "customers.active" : "customers.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell align="end">
                        {/* Wide screens: show the summary panel; otherwise open the profile. */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hidden xl:inline-flex"
                          aria-label={t("customers.preview.select", { name: customer.fullName })}
                          aria-pressed={isSelected}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(customer.id);
                          }}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="xl:hidden">
                          <Link
                            href={`/customers/${customer.id}`}
                            aria-label={t("customers.viewNamed", { name: customer.fullName })}
                          >
                            {t("common.view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableState>

          {data && (
            <AppPagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
              disabled={isFetching}
            />
          )}
        </Card>

        <aside className="hidden xl:sticky xl:top-4 xl:block">
          <CustomerPreviewPanel customer={selected} />
        </aside>
      </div>

      <CreateCustomerDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
