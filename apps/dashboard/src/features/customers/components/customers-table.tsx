"use client";

import Link from "next/link";
import { Button } from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useCustomers } from "../api/customers.api";
import { EmptyState } from "./empty-state";

const COLUMNS = ["Full Name", "Email", "Phone", "Passport Expiry", "Preferred Language"];

function CustomersTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Loading customers">
        <thead>
          <tr className="border-b text-left">
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className="whitespace-nowrap py-2 pr-4">
                {column}
              </th>
            ))}
            <th scope="col" className="whitespace-nowrap py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody role="status" aria-label="Loading customers">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b">
              {Array.from({ length: COLUMNS.length + 1 }).map((_, cellIndex) => (
                <td key={cellIndex} className="py-2 pr-4">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomersErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive"
    >
      Something went wrong loading customers. Please try again later.
    </div>
  );
}

export function CustomersTable() {
  const { data: customers, isLoading, isError } = useCustomers();

  if (isLoading) {
    return <CustomersTableSkeleton />;
  }

  if (isError) {
    return <CustomersErrorState />;
  }

  if (!customers || customers.length === 0) {
    return <EmptyState message="No customers yet" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Customers">
        <caption className="sr-only">List of customers</caption>
        <thead>
          <tr className="border-b text-left">
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className="whitespace-nowrap py-2 pr-4">
                {column}
              </th>
            ))}
            <th scope="col" className="whitespace-nowrap py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b">
              <td className="py-2 pr-4">{customer.fullName}</td>
              <td className="py-2 pr-4">{customer.email ?? "—"}</td>
              <td className="py-2 pr-4">{customer.phone ?? "—"}</td>
              <td className="py-2 pr-4">
                {customer.passportExpiry ? formatDate(customer.passportExpiry) : "—"}
              </td>
              <td className="py-2 pr-4">{customer.preferredLanguage ?? "—"}</td>
              <td className="py-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/customers/${customer.id}`} aria-label={`View ${customer.fullName}`}>
                    View
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
