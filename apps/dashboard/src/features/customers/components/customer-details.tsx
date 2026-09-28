"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, EmptyState, Skeleton, toast } from "@travio/ui";
import { useCustomer, useInviteCustomerToPortal, CustomerNotFoundError } from "../api/customers.api";
import { CustomerProfileCard } from "./customer-profile-card";
import { CustomerStatusBadge } from "./customer-status-badge";
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
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function CustomerNotFoundState() {
  return (
    <EmptyState
      className="p-12"
      icon={<SearchX size={20} />}
      title="Customer not found"
      action={<BackToCustomersLink />}
    />
  );
}

function CustomerDetailsErrorState() {
  return (
    <div className="space-y-4">
      <BackToCustomersLink />
      <div
        role="alert"
        className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
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
  const inviteToPortal = useInviteCustomerToPortal();

  // Design System v2.4 (Product-8.1): toast() (packages/ui) instead of
  // inline success/error text below the button - same mutation, same
  // useInviteCustomerToPortal hook, only the feedback's presentation
  // changed. Per-call onSuccess/onError (not a useEffect watching
  // isSuccess/isError) so this fires exactly once per invite attempt,
  // never re-firing on an unrelated re-render.
  const handleInvite = () => {
    if (!customer) return;
    inviteToPortal.mutate(customer.id, {
      onSuccess: (result) => {
        toast({
          variant: "success",
          title: "Invite sent",
          description: `Portal invite sent to ${result.email}.`,
        });
      },
      onError: (mutationError) => {
        toast({
          variant: "danger",
          title: "Couldn't send the invite",
          description: mutationError instanceof Error ? mutationError.message : undefined,
        });
      },
    });
  };

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
    <div className="space-y-8">
      <BackToCustomersLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading-lg text-foreground">{customer.fullName}</h1>
            <CustomerStatusBadge customer={customer} />
          </div>
          <p className="text-sm text-muted-foreground">
            {customer.email ?? "No email"} · {customer.phone ?? "No phone"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Product-5: sends a real Supabase Auth invite (see
              useInviteCustomerToPortal) - requires an email on file,
              same constraint the route itself enforces. No dialog: the
              invite uses this customer's already-known name/email,
              nothing to collect. Design System v2.4: feedback is now a
              toast (see handleInvite above), not inline text under the
              button. */}
          <Button
            variant="outline"
            disabled={!customer.email || inviteToPortal.isPending}
            title={customer.email ? undefined : "This customer has no email on file"}
            onClick={handleInvite}
          >
            {inviteToPortal.isPending ? "Sending…" : "Invite to Portal"}
          </Button>
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
