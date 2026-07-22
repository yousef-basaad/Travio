"use client";

import Link from "next/link";
import { Button } from "@travio/ui";
import { useCustomer, CustomerNotFoundError } from "../api/customers.api";
import { CustomerProfileCard } from "./customer-profile-card";
import { CustomerTabs } from "./customer-tabs";

function BackToCustomersLink() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/customers">← Back to Customers</Link>
    </Button>
  );
}

function CustomerDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading customer" className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-48 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

function CustomerNotFoundState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
      <h1 className="text-lg font-medium">Customer not found</h1>
      <BackToCustomersLink />
    </div>
  );
}

function CustomerDetailsErrorState() {
  return (
    <div className="space-y-4">
      <BackToCustomersLink />
      <div
        role="alert"
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive"
      >
        Something went wrong loading this customer. Please try again later.
      </div>
    </div>
  );
}

// Customer 360 shell only, per this issue's explicit scope - Edit/Delete
// are disabled placeholders (no such flow exists yet for customers), and
// CustomerTabs' non-Overview tabs are empty placeholders for future
// modules to plug into.
export function CustomerDetails({ id }: { id: string }) {
  const { data: customer, isLoading, error } = useCustomer(id);

  if (isLoading) {
    return <CustomerDetailsSkeleton />;
  }

  if (error instanceof CustomerNotFoundError) {
    return <CustomerNotFoundState />;
  }

  if (error || !customer) {
    return <CustomerDetailsErrorState />;
  }

  return (
    <div className="space-y-6">
      <BackToCustomersLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{customer.fullName}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled
            aria-disabled="true"
            title="Editing customers isn't available yet"
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled
            aria-disabled="true"
            title="Deleting customers isn't available yet"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CustomerProfileCard customer={customer} />
        </div>
        <div className="lg:col-span-2">
          <CustomerTabs customer={customer} />
        </div>
      </div>
    </div>
  );
}
