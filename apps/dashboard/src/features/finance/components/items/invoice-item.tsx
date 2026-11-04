"use client";

import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { cn } from "@travio/utils";
import type { InvoiceItem, InvoiceItemType } from "@travio/api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Message keys for the same types, for translated display.
export const ITEM_TYPE_KEYS: Record<InvoiceItemType, MessageKey> = {
  flight: "itemType.flight",
  hotel: "itemType.hotel",
  transfer: "itemType.transfer",
  visa: "itemType.visa",
  manual: "itemType.manual",
};

// Reuses only existing design tokens - manual items get the neutral
// "secondary" token, every service-linked type shares "accent" (there's
// no meaningful visual hierarchy between flight/hotel/transfer/visa
// items themselves, only between "linked to a service" and "not").
const ITEM_TYPE_STYLES: Record<InvoiceItemType, string> = {
  flight: "bg-accent text-accent-foreground",
  hotel: "bg-accent text-accent-foreground",
  transfer: "bg-accent text-accent-foreground",
  visa: "bg-accent text-accent-foreground",
  manual: "bg-secondary text-secondary-foreground",
};

// Named InvoiceItemRow (not InvoiceItem) - this feature's top-level
// invoice-item.tsx already exports a component called InvoiceItem (one
// row in the invoice list); this one is a row within a single invoice's
// item list, so the two must not share a name once both are re-exported
// from features/finance/index.ts.
type InvoiceItemRowProps = {
  item: InvoiceItem;
  onEdit: (item: InvoiceItem) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function InvoiceItemRow({ item, onEdit, onDelete, isDeleting }: InvoiceItemRowProps) {
  const t = useT();
  const format = useFormat();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{item.description}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              ITEM_TYPE_STYLES[item.itemType],
            )}
          >
            {t(ITEM_TYPE_KEYS[item.itemType])}
          </span>
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            aria-label={t("finance.items.editLabel")}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            aria-label={t("finance.items.deleteLabel")}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          {item.quantity} × {format.currency(item.unitPrice)}
        </p>
        <p className="text-xs text-muted-foreground">{format.currency(item.total)}</p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
