import {
  Users,
  CalendarCheck2,
  Stamp,
  Wallet,
  FileText,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { ProductPreviewVariant } from "@/components/product-preview";
import type { MessageKey } from "@/lib/i18n/messages/en";

export interface FeatureContent {
  slug: string;
  icon: LucideIcon;
  title: MessageKey;
  /** Short card copy (Homepage's Features section). */
  summary: MessageKey;
  /** Longer copy (Features page's detail section). */
  description: MessageKey;
  benefits: readonly MessageKey[];
  visual?: ProductPreviewVariant;
}

// Text is message keys (lib/i18n/messages), translated where shown.
// Single source of truth for the six real Travio capabilities - reused
// by the Homepage's feature grid and the Features page's detail
// sections, so the two never drift out of sync. Every capability listed
// here is a real, already-shipped module (CRM/Bookings/Visa/Finance/
// Documents/Analytics) - nothing invented.
export const FEATURES: readonly FeatureContent[] = [
  {
    slug: "crm",
    icon: Users,
    title: "feature.crm.title",
    summary: "feature.crm.summary",
    description: "feature.crm.description",
    benefits: ["feature.crm.benefit1", "feature.crm.benefit2", "feature.crm.benefit3"],
    visual: "customer-360",
  },
  {
    slug: "bookings",
    icon: CalendarCheck2,
    title: "feature.bookings.title",
    summary: "feature.bookings.summary",
    description: "feature.bookings.description",
    benefits: ["feature.bookings.benefit1", "feature.bookings.benefit2", "feature.bookings.benefit3"],
    visual: "booking-360",
  },
  {
    slug: "visa",
    icon: Stamp,
    title: "feature.visa.title",
    summary: "feature.visa.summary",
    description: "feature.visa.description",
    benefits: ["feature.visa.benefit1", "feature.visa.benefit2", "feature.visa.benefit3"],
  },
  {
    slug: "finance",
    icon: Wallet,
    title: "feature.finance.title",
    summary: "feature.finance.summary",
    description: "feature.finance.description",
    benefits: ["feature.finance.benefit1", "feature.finance.benefit2", "feature.finance.benefit3"],
  },
  {
    slug: "documents",
    icon: FileText,
    title: "feature.documents.title",
    summary: "feature.documents.summary",
    description: "feature.documents.description",
    benefits: ["feature.documents.benefit1", "feature.documents.benefit2", "feature.documents.benefit3"],
  },
  {
    slug: "analytics",
    icon: BarChart3,
    title: "feature.analytics.title",
    summary: "feature.analytics.summary",
    description: "feature.analytics.description",
    benefits: ["feature.analytics.benefit1", "feature.analytics.benefit2", "feature.analytics.benefit3"],
    visual: "analytics",
  },
] as const;
