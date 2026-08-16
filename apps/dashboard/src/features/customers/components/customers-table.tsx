"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useCustomers } from "../api/customers.api";

const COLUMNS = ["Full Name", "Email", "Phone", "Passport Expiry", "Preferred Language"];

// Phase UI-6: client-side search only (name/email/phone substring match
// over the already-fetched full list) - no new endpoint, no query
// params, same "filter what's already loaded" convention
// DocumentFilters already uses for its type filter.
function matchesSearch(
  customer: { fullName: string; email: string | null; phone: string | null },
  query: string,
): boolean {
  if (!query) return true;
  const haystack = `${customer.fullName} ${customer.email ?? ""} ${customer.phone ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function CustomersTable() {
  const { data: customers, isLoading, isError } = useCustomers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (customers ?? []).filter((customer) => matchesSearch(customer, query)),
    [customers, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Everyone your agency has booked travel for" />

      <SearchInput
        placeholder="Search by name, email, or phone"
        aria-label="Search customers"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        containerClassName="max-w-sm"
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && filtered.length === 0}
        loadingLabel="Loading customers"
        errorMessage="Something went wrong loading customers. Please try again later."
        emptyMessage={query ? "No customers match your search" : "No customers yet"}
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
            {filtered.map((customer) => (
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
    </div>
  );
}
