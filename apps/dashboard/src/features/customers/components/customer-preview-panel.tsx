"use client";

import Link from "next/link";
import type { Route } from "next";
import { Mail, MessageCircle, Phone, UserRound, type LucideIcon } from "lucide-react";
import { Avatar, Badge, Button, Card, InfoRow, LtrText } from "@travio/ui";
import type { CustomerListItem } from "@travio/api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { isActiveCustomer, whatsappNumber } from "../utils/customer-activity";
import { CustomerTimeline } from "./timeline/customer-timeline";

const RECENT_ACTIVITY_LIMIT = 4;

function QuickAction({ href, label, icon: Icon }: { href: string | null; label: MessageKey; icon: LucideIcon }) {
  const t = useT();
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card">
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="text-[11px]">{t(label)}</span>
    </>
  );
  const className = "flex flex-col items-center gap-1 text-muted-foreground";
  // Disabled look when there's nothing to call/email.
  if (!href) {
    return (
      <span className={`${className} opacity-40`} aria-disabled="true">
        {content}
      </span>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`${className} transition-colors duration-fast hover:text-primary`}
    >
      {content}
    </a>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-3 text-center">
      <p className="text-heading-sm font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// The Customer 360 summary beside the Customers list (TRAVIO design 03):
// who the customer is, quick contact links, their numbers and their
// latest activity, with a link to the full profile.
export function CustomerPreviewPanel({ customer }: { customer: CustomerListItem | null }) {
  const t = useT();
  const format = useFormat();

  if (!customer) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserRound size={22} aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">{t("customers.preview.empty")}</p>
      </Card>
    );
  }

  const active = isActiveCustomer(customer.stats.lastActivityAt);
  const whatsapp = whatsappNumber(customer.phone);

  return (
    <Card className="space-y-5 p-5" aria-label={t("customers.preview.title")}>
      <div className="flex items-start gap-3">
        <Avatar name={customer.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-heading-sm font-bold text-foreground">{customer.fullName}</h2>
            <Badge variant={active ? "success" : "danger"}>{t(active ? "customers.active" : "customers.inactive")}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("customers.since", { date: format.date(customer.createdAt) })}
          </p>
          {customer.nationality ? <p className="text-xs text-muted-foreground">{customer.nationality}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-4">
        <QuickAction icon={Phone} label="customers.action.call" href={customer.phone ? `tel:${customer.phone}` : null} />
        <QuickAction icon={Mail} label="customers.action.email" href={customer.email ? `mailto:${customer.email}` : null} />
        <QuickAction
          icon={MessageCircle}
          label="customers.action.whatsapp"
          href={whatsapp ? `https://wa.me/${whatsapp}` : null}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat value={customer.stats.bookingsCount} label={t("customers.col.bookings")} />
        <Stat
          value={
            <>
              {format.number(customer.stats.totalSpent)}{" "}
              <span className="text-xs font-semibold text-muted-foreground">{t("common.currencySar")}</span>
            </>
          }
          label={t("customers.col.spent")}
        />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("customers.preview.basicInfo")}</h3>
        <dl className="space-y-3">
          <InfoRow label={t("field.email")} value={customer.email ?? "—"} />
          <InfoRow label={t("field.phone")} value={customer.phone ? <LtrText>{customer.phone}</LtrText> : "—"} />
          <InfoRow label={t("field.nationality")} value={customer.nationality ?? "—"} />
          <InfoRow
            label={t("field.passportExpiry")}
            value={customer.passportExpiry ? format.date(customer.passportExpiry) : "—"}
          />
          <InfoRow label={t("field.preferredLanguage")} value={customer.preferredLanguage ?? "—"} />
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("customers.preview.recentActivity")}</h3>
        <CustomerTimeline customerId={customer.id} limit={RECENT_ACTIVITY_LIMIT} />
      </section>

      <Button asChild variant="outline" className="w-full">
        <Link href={`/customers/${customer.id}` as Route}>{t("customers.preview.openProfile")}</Link>
      </Button>
    </Card>
  );
}
