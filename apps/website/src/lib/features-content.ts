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

export interface FeatureContent {
  slug: string;
  icon: LucideIcon;
  title: string;
  /** Short card copy (Homepage's Features section). */
  summary: string;
  /** Longer copy (Features page's detail section). */
  description: string;
  benefits: readonly string[];
  visual?: ProductPreviewVariant;
}

// Single source of truth for the six real Travio capabilities - reused
// by the Homepage's feature grid and the Features page's detail
// sections, so the two never drift out of sync. Every capability listed
// here is a real, already-shipped module (CRM/Bookings/Visa/Finance/
// Documents/Analytics) - nothing invented.
export const FEATURES: readonly FeatureContent[] = [
  {
    slug: "crm",
    icon: Users,
    title: "CRM",
    summary: "Track leads and customers from first inquiry to lifetime traveler.",
    description:
      "Capture leads from every channel, convert them into customers, and keep every conversation, note, and activity in one place. A full Customer 360 view shows profile details, ownership, and history at a glance.",
    benefits: [
      "Lead pipeline with source and status tracking",
      "Customer 360 profile with assigned owner",
      "Activity timeline across every touchpoint",
    ],
    visual: "customer-360",
  },
  {
    slug: "bookings",
    icon: CalendarCheck2,
    title: "Booking Management",
    summary: "Manage flights, hotels, and transfers under one booking record.",
    description:
      "Every trip lives as a single booking, with flights, hotels, and transfers organized underneath it. Status changes, notes, and financial details stay attached to the booking end-to-end.",
    benefits: [
      "One record per trip, every service attached",
      "Status tracking from draft to completed",
      "Booking-level timeline and documents",
    ],
    visual: "booking-360",
  },
  {
    slug: "visa",
    icon: Stamp,
    title: "Visa Operations",
    summary: "Give your visa desk a dedicated queue and real ownership.",
    description:
      "Visa applications are tracked per customer and booking, with their own status lifecycle and assigned officer - so your visa desk has a clear, owned queue instead of a shared inbox.",
    benefits: [
      "Status lifecycle from draft to approved",
      "Assigned visa officer per application",
      "Linked to the originating booking and customer",
    ],
  },
  {
    slug: "finance",
    icon: Wallet,
    title: "Finance",
    summary: "Invoices, payments, and expenses without leaving the platform.",
    description:
      "Raise invoices against a customer or booking, record payments as they come in, and track outstanding balances - all reconciled against the same booking and customer records your team already works in.",
    benefits: [
      "Invoices with line items and tax",
      "Payments recorded against each invoice",
      "Outstanding balance visible at a glance",
    ],
  },
  {
    slug: "documents",
    icon: FileText,
    title: "Documents",
    summary: "Passports, visas, and vouchers attached to the right record.",
    description:
      "Upload and organize documents against a customer or a booking, with a typed catalog (passport, visa, voucher, and more) and secure, permissioned storage.",
    benefits: [
      "Documents attached to customers or bookings",
      "Typed document catalog",
      "Secure, permissioned file storage",
    ],
  },
  {
    slug: "analytics",
    icon: BarChart3,
    title: "Analytics",
    summary: "Revenue, bookings, and customer trends in one dashboard.",
    description:
      "A real-time view of revenue trends, booking status distribution, and customer growth - so agency owners and managers always know where the business stands.",
    benefits: [
      "Revenue trend across invoiced and paid totals",
      "Booking status and service distribution",
      "New customer and top-account tracking",
    ],
    visual: "analytics",
  },
] as const;
