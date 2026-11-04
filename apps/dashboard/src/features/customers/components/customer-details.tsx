"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, EmptyState, LtrText, Skeleton, toast } from "@travio/ui";
import { useCustomer, useInviteCustomerToPortal, CustomerNotFoundError } from "../api/customers.api";
import { CustomerProfileCard } from "./customer-profile-card";
import { CustomerStatusBadge } from "./customer-status-badge";
import { CustomerTabs } from "./customer-tabs";
import { useT } from "@/lib/i18n/i18n-provider";

function BackToCustomersLink() {
  const t = useT();
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/customers">{t("customers.back")}</Link>
    </Button>
  );
}

function CustomerDetailsSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("customers.loadingOne")} className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function CustomerNotFoundState() {
  const t = useT();
  return (
    <EmptyState
      className="p-12"
      icon={<SearchX size={20} />}
      title={t("customers.notFound")}
      action={<BackToCustomersLink />}
    />
  );
}

function CustomerDetailsErrorState() {
  const t = useT();
  return (
    <div className="space-y-4">
      <BackToCustomersLink />
      <div
        role="alert"
        className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
      >
        {t("customers.loadOneError")}
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
  const t = useT();

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
          title: t("customers.inviteSent"),
          description: t("customers.inviteSentDescription", { email: result.email }),
        });
      },
      onError: (mutationError) => {
        toast({
          variant: "danger",
          title: t("customers.inviteError"),
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
            {customer.email ?? t("customers.noEmail")} ·{" "}
            {customer.phone ? <LtrText>{customer.phone}</LtrText> : t("customers.noPhone")}
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
            title={customer.email ? undefined : t("customers.noEmailOnFile")}
            onClick={handleInvite}
          >
            {inviteToPortal.isPending ? t("common.sending") : t("customers.invite")}
          </Button>
          <Button
            variant="outline"
            disabled
            aria-disabled="true"
            title={t("customers.editUnavailable")}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="destructive"
            disabled
            aria-disabled="true"
            title={t("customers.deleteUnavailable")}
          >
            {t("common.delete")}
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
