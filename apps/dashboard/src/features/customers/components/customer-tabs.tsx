"use client";

import { useState } from "react";
import { DetailLayout } from "@travio/ui";
import type { Customer } from "@travio/api";
import { CustomerOverviewTab } from "./customer-overview-tab";
import { CustomerTimeline } from "./timeline/customer-timeline";
import { CustomerBookingsTable } from "./bookings/customer-bookings-table";
import { VisaList } from "./visa/visa-list";
import { InvoiceList } from "@/features/finance";
import { DocumentsPage } from "@/features/documents";

// Phase UI-3: Customer 360 tabs, matching the spec's lettered sections
// A-F exactly. "Invoices" and "Payments" (previously two tabs, the
// second just pointing back at the first) are merged into one "Finance"
// tab - InvoiceList already shows each invoice's own Paid/Remaining and
// payment list inline (payments have no cross-invoice view of their
// own), so a separate Payments tab never showed anything Finance
// doesn't already cover.
const TABS = [
  "Overview",
  "Bookings",
  "Finance",
  "Documents",
  "Visa Applications",
  "Timeline",
] as const;

type CustomerTab = (typeof TABS)[number];

// Uses the design system's shared DetailLayout (Card + Tabs) instead of
// the raw role="tablist" markup this file previously defined for
// itself.
export function CustomerTabs({ customer }: { customer: Customer }) {
  const [activeTab, setActiveTab] = useState<CustomerTab>("Overview");

  return (
    <DetailLayout
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as CustomerTab)}
      ariaLabel="Customer sections"
    >
      {activeTab === "Overview" ? (
        <CustomerOverviewTab customer={customer} />
      ) : activeTab === "Bookings" ? (
        <CustomerBookingsTable customerId={customer.id} />
      ) : activeTab === "Finance" ? (
        <InvoiceList customerId={customer.id} />
      ) : activeTab === "Documents" ? (
        <DocumentsPage ownerType="customer" ownerId={customer.id} />
      ) : activeTab === "Visa Applications" ? (
        <VisaList customerId={customer.id} />
      ) : activeTab === "Timeline" ? (
        <CustomerTimeline customerId={customer.id} />
      ) : (
        <p className="text-sm text-muted-foreground">Coming soon</p>
      )}
    </DetailLayout>
  );
}
