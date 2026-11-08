import { AnalyticsPage } from "@/features/analytics";
import { NetProfitKpi } from "@/features/finance";

// The finance-only profit card is composed here, so the analytics
// feature never imports the finance feature (which imports analytics).
export default function Page() {
  return <AnalyticsPage profitKpi={<NetProfitKpi />} />;
}
