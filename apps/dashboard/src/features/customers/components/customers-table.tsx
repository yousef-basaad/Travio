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
  Pagination,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useCustomersPage } from "../api/customers.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { CreateCustomerDialog } from "./create-customer-dialog";

const COLUMNS = ["Full Name", "Email", "Phone", "Passport Expiry", "Preferred Language"];

// openCreate comes from /customers?new=1 (the Quick add menu's "New
// Customer"). It opens the dialog, then the param is dropped from the URL
// so a refresh or closing the dialog doesn't reopen it.
export function CustomersTable({ openCreate = false }: { openCreate?: boolean }) {
  const router = useRouter();
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
        title="Customers"
        description="Everyone your agency has booked travel for"
        actions={<Button onClick={() => setIsCreateOpen(true)}>New Customer</Button>}
      />

      <SearchInput
        placeholder="Search by name, email, or phone"
        aria-label="Search customers"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        containerClassName="max-w-sm"
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && customers.length === 0}
        loadingLabel="Loading customers"
        errorMessage="Something went wrong loading customers. Please try again later."
        emptyMessage={debouncedSearch ? "No customers match your search" : "No customers yet"}
        emptyAction={
          !debouncedSearch ? <Button onClick={() => setIsCreateOpen(true)}>New Customer</Button> : undefined
        }
        emptyIcon={<Users size={20} />}
        size="page"
      >
        <Table aria-label="Customers" caption="List of customers">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} header>
                  {column}
                </TableCell>
              ))}
              <TableCell header>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium text-foreground">{customer.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.passportExpiry ? formatDate(customer.passportExpiry) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.preferredLanguage ?? "—"}
                </TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/customers/${customer.id}`} aria-label={`View ${customer.fullName}`}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      {data && (
        <Pagination
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
