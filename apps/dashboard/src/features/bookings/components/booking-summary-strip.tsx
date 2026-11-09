"use client";

import Link from "next/link";
import type { Route } from "next";
import { MessageCircle } from "lucide-react";
import { Avatar, Badge, Card, LtrText } from "@travio/ui";
import type { Customer } from "@travio/api";
import { useBookingInvoices } from "@/features/finance";
import { whatsappNumber } from "@/features/customers/utils/customer-activity";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { countryName } from "@/lib/countries/countries";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Booking } from "../types/booking";
import { paymentState, type PaymentState } from "../utils/payment-state";

const PAYMENT_LABEL: Record<Exclude<PaymentState, "none">, { key: MessageKey; variant: "success" | "warning" | "danger" }> = {
  paid: { key: "bookings.payment.paid", variant: "success" },
  partial: { key: "bookings.payment.partial", variant: "warning" },
  unpaid: { key: "bookings.payment.unpaid", variant: "danger" },
};

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

// The strip under the booking header (TRAVIO design 04): customer with
// a WhatsApp link, destination, departure/return dates, travelers, and
// the total with how far it is paid.
export function BookingSummaryStrip({ booking, customer }: { booking: Booking; customer: Customer | null }) {
  const { t, locale, format } = useI18n();
  const { data: invoices } = useBookingInvoices(booking.id);
  const payment = invoices ? paymentState(invoices) : "none";
  const whatsapp = whatsappNumber(customer?.phone);

  const destination = [
    booking.destinationCity,
    booking.destinationCountry ? countryName(booking.destinationCountry, intlLocale(locale)) : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const travelers = [
    booking.adults ? t("bookings.travelers.adults", { count: booking.adults }) : null,
    booking.children ? t("bookings.travelers.children", { count: booking.children }) : null,
  ]
    .filter(Boolean)
    .join(locale === "ar" ? "، " : ", ");

  return (
    <Card className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-7 lg:divide-x lg:rtl:divide-x-reverse">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3 lg:col-span-2">
        <Avatar name={customer?.fullName ?? "?"} size="md" />
        <div className="min-w-0">
          {customer ? (
            <Link
              href={`/customers/${customer.id}` as Route}
              className="block truncate text-sm font-semibold text-foreground hover:text-primary"
            >
              {customer.fullName}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
          {customer?.phone ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <LtrText>{customer.phone}</LtrText>
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("customers.action.whatsapp")}
                  className="text-success hover:opacity-80"
                >
                  <MessageCircle size={14} aria-hidden="true" />
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <Cell label={t("bookings.strip.destination")}>{destination || "—"}</Cell>
      <Cell label={t("bookings.strip.departure")}>{booking.startDate ? format.date(booking.startDate) : "—"}</Cell>
      <Cell label={t("bookings.strip.return")}>{booking.endDate ? format.date(booking.endDate) : "—"}</Cell>
      <Cell label={t("bookings.strip.travelers")}>{travelers || "—"}</Cell>
      <Cell label={t("bookings.strip.total")}>
        <span className="whitespace-nowrap">
          {format.number(booking.totalAmount)} <span className="text-xs text-muted-foreground">{t("common.currencySar")}</span>
        </span>
        {payment !== "none" ? (
          <Badge variant={PAYMENT_LABEL[payment].variant} className="mt-1 block w-fit">
            {t(PAYMENT_LABEL[payment].key)}
          </Badge>
        ) : null}
      </Cell>
    </Card>
  );
}
