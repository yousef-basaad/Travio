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
import { formatCurrency } from "@travio/utils";

const ICON_SIZE = 16;
import { useCustomerAnalytics } from "../api/analytics.api";

export function CustomerInsights() {
  const { data: analytics, isLoading, isError } = useCustomerAnalytics();
  const topCustomers = analytics?.topCustomersByRevenue ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Customer Insights</h2>
        <p className="text-xs text-muted-foreground">New customers and top revenue accounts</p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          skeletonRows={3}
          loadingLabel="Loading customer analytics"
          errorMessage="Something went wrong loading customer analytics. Please try again later."
        >
          {analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/60 bg-surface-muted/40 p-4">
                <MiniStat
                  label="New This Month"
                  value={String(analytics.newCustomersThisMonth)}
                  icon={<UserPlus size={ICON_SIZE} />}
                  tone="success"
                />
                <MiniStat
                  label="New Last Month"
                  value={String(analytics.newCustomersLastMonth)}
                  icon={<UserPlus size={ICON_SIZE} />}
                  tone="info"
                />
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Customers by Revenue
                </h3>
                <DataTableState
                  isLoading={false}
                  isError={false}
                  isEmpty={topCustomers.length === 0}
                  emptyMessage="No customer revenue yet"
                  emptyIcon={<Trophy size={20} />}
                >
                  <Table aria-label="Top customers by revenue" caption="Top 5 customers ranked by total invoiced revenue">
                    <TableHeader>
                      <TableRow className="text-muted-foreground">
                        <TableCell header>Customer</TableCell>
                        <TableCell header>Revenue</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((customer, index) => (
                        <TableRow key={customer.customerId}>
                          <TableCell className="font-medium">
                            {index + 1}. {customer.customerName}
                          </TableCell>
                          <TableCell>{formatCurrency(customer.revenue)}</TableCell>
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
