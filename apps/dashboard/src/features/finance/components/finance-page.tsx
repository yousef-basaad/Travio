import { PageHeader } from "@travio/ui";
import { FinanceMetrics } from "./finance-metrics";
import { RevenueSummary } from "./revenue-summary";
import { InvoiceTable } from "./invoice-table";
import { PaymentStatus } from "./payment-status";
import { ExpenseOverview } from "./expense-overview";
import { FinancialActivity } from "./financial-activity";

// Full page composition, mirroring AnalyticsPage's own shape - the route
// file (app/(dashboard)/finance/page.tsx) stays a thin shell rendering
// this.
export function FinancePage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Finance"
        description="Revenue, invoices, payments, and expenses across your agency"
      />

      <FinanceMetrics />

      <RevenueSummary />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <InvoiceTable />
        <PaymentStatus />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ExpenseOverview />
        <FinancialActivity />
      </div>
    </div>
  );
}
