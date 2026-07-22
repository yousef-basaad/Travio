"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@travio/ui";
import { cn, formatDate } from "@travio/utils";
import type { Customer } from "@travio/api";
import { InfoRow } from "./customer-profile-card";

const TABS = [
  "Overview",
  "Timeline",
  "Bookings",
  "Invoices",
  "Payments",
  "Documents",
  "Visa Applications",
] as const;

type CustomerTab = (typeof TABS)[number];

function OverviewTab({ customer }: { customer: Customer }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <InfoRow label="Full Name" value={customer.fullName} />
      <InfoRow label="Email" value={customer.email ?? "—"} />
      <InfoRow label="Phone" value={customer.phone ?? "—"} />
      <InfoRow
        label="Passport Expiry"
        value={customer.passportExpiry ? formatDate(customer.passportExpiry) : "—"}
      />
      <InfoRow label="Preferred Language" value={customer.preferredLanguage ?? "—"} />
      <InfoRow label="Created At" value={formatDate(customer.createdAt)} />
      <InfoRow label="Updated At" value={formatDate(customer.updatedAt)} />
    </dl>
  );
}

// Tab shell only, per this issue's explicit scope - every tab besides
// Overview is an empty placeholder for a future module (Timeline,
// Bookings, Invoices, Payments, Documents, Visa Applications) to plug
// into later.
export function CustomerTabs({ customer }: { customer: Customer }) {
  const [activeTab, setActiveTab] = useState<CustomerTab>("Overview");

  return (
    <Card>
      <CardHeader className="space-y-0 p-0">
        <div
          role="tablist"
          aria-label="Customer sections"
          className="flex flex-wrap gap-1 border-b p-2"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === "Overview" ? (
          <OverviewTab customer={customer} />
        ) : (
          <p className="text-sm text-muted-foreground">Coming soon</p>
        )}
      </CardContent>
    </Card>
  );
}
