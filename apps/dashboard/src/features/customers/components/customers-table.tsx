"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
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
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useCustomersPage } from "../api/customers.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { CreateCustomerDialog } from "./create-customer-dialog";

const COLUMNS: MessageKey[] = [
  "field.fullName",
  "field.email",
  "field.phone",
  "field.passportExpiry",
  "field.preferredLanguage",
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
  const { data, isLoading, isError, isFetching } = useCustomersPage({ page, pageSize, search: debouncedSearch });
  const customers = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);
  const [isCreateOpen, setIsCreateOpen] = useState(openCreate);

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

      <SearchInput
        placeholder={t("customers.searchPlaceholder")}
        aria-label={t("customers.searchLabel")}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        containerClassName="max-w-sm"
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && customers.length === 0}
        loadingLabel={t("customers.loading")}
        errorMessage={t("customers.loadError")}
        emptyMessage={debouncedSearch ? t("customers.emptySearch") : t("customers.empty")}
        emptyAction={
          !debouncedSearch ? <Button onClick={() => setIsCreateOpen(true)}>{t("customers.new")}</Button> : undefined
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
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium text-foreground">{customer.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{customer.phone ? <LtrText>{customer.phone}</LtrText> : "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.passportExpiry ? format.date(customer.passportExpiry) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.preferredLanguage ?? "—"}
                </TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/customers/${customer.id}`} aria-label={t("customers.viewNamed", { name: customer.fullName })}>
                      {t("common.view")}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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

      <CreateCustomerDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
