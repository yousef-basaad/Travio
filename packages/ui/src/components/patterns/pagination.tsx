import { cn } from "@travio/utils";
import { Button } from "../button";

export interface PageInfo {
  /** 1-based index of the first row on this page (0 when empty). */
  from: number;
  /** 1-based index of the last row on this page (0 when empty). */
  to: number;
  pageCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// The numbers a pager shows for `total` rows split into pages of
// `pageSize`, on 1-based `page`. Pure, so it's unit tested.
export function pageInfo(total: number, page: number, pageSize: number): PageInfo {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) {
    return { from: 0, to: 0, pageCount, hasPrevious: page > 1, hasNext: false };
  }
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to, pageCount, hasPrevious: page > 1, hasNext: page < pageCount };
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Disables both buttons, e.g. while the next page is loading. */
  disabled?: boolean;
  className?: string;
  /** Translated text; English by default. */
  labels?: Partial<PaginationLabels>;
}

export interface PaginationLabels {
  navigation: string;
  range: (from: string, to: string, total: string) => string;
  previous: string;
  next: string;
  page: (page: number, pageCount: number) => string;
}

const DEFAULT_LABELS: PaginationLabels = {
  navigation: "Pagination",
  range: (from, to, total) => `${from}–${to} of ${total}`,
  previous: "Previous",
  next: "Next",
  page: (page, pageCount) => `Page ${page} of ${pageCount}`,
};

// "1–25 of 1,234" with Previous/Next, for server-paged tables. Renders
// nothing when everything fits on one page.
export function Pagination({ page, pageSize, total, onPageChange, disabled, className, labels }: PaginationProps) {
  const info = pageInfo(total, page, pageSize);
  const text = { ...DEFAULT_LABELS, ...labels };
  if (info.pageCount <= 1 && page <= 1) return null;

  return (
    <nav
      aria-label={text.navigation}
      className={cn("flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground", className)}
    >
      <p aria-live="polite">
        {text.range(info.from.toLocaleString("en-US"), info.to.toLocaleString("en-US"), total.toLocaleString("en-US"))}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || !info.hasPrevious}
        >
          {text.previous}
        </Button>
        <span>{text.page(page, info.pageCount)}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !info.hasNext}
        >
          {text.next}
        </Button>
      </div>
    </nav>
  );
}
