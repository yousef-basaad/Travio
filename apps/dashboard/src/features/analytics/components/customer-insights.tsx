"use client";

import { UserPlus, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  MiniStat,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";

const ICON_SIZE = 16;
import { useCustomerAnalytics } from "../api/analytics.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

export function CustomerInsights() {
  const t = useT();
  const format = useFormat();
  const { data: analytics, isLoading, isError } = useCustomerAnalytics();
  const topCustomers = analytics?.topCustomersByRevenue ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("analytics.customers.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("analytics.customers.description")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          skeletonRows={3}
          loadingLabel={t("analytics.customers.loading")}
          errorMessage={t("analytics.customers.error")}
        >
          {analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/60 bg-surface-muted/40 p-4">
                <MiniStat
                  label={t("analytics.customers.newThisMonth")}
                  value={String(analytics.newCustomersThisMonth)}
                  icon={<UserPlus size={ICON_SIZE} />}
                  tone="success"
                />
                <MiniStat
                  label={t("analytics.customers.newLastMonth")}
                  value={String(analytics.newCustomersLastMonth)}
                  icon={<UserPlus size={ICON_SIZE} />}
                  tone="info"
                />
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("analytics.customers.topTitle")}
                </h3>
                <DataTableState
                  isLoading={false}
                  isError={false}
                  isEmpty={topCustomers.length === 0}
                  emptyMessage={t("analytics.customers.empty")}
                  emptyIcon={<Trophy size={20} />}
                >
                  <Table aria-label={t("analytics.customers.topLabel")} caption={t("analytics.customers.topCaption")}>
                    <TableHeader>
                      <TableRow className="text-muted-foreground">
                        <TableCell header>{t("common.customer")}</TableCell>
                        <TableCell header>{t("analytics.customers.revenue")}</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((customer, index) => (
                        <TableRow key={customer.customerId}>
                          <TableCell className="font-medium">
                            {index + 1}. {customer.customerName}
                          </TableCell>
                          <TableCell>{format.currency(customer.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTableState>
              </div>
            </div>
          ) : null}
        </DataTableState>
      </CardContent>
    </Card>
  );
}
