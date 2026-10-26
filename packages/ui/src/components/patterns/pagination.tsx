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
}

// "1–25 of 1,234" with Previous/Next, for server-paged tables. Renders
// nothing when everything fits on one page.
export function Pagination({ page, pageSize, total, onPageChange, disabled, className }: PaginationProps) {
  const info = pageInfo(total, page, pageSize);
  if (info.pageCount <= 1 && page <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground", className)}
    >
      <p aria-live="polite">
        {info.from.toLocaleString()}–{info.to.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || !info.hasPrevious}
        >
          Previous
        </Button>
        <span>
          Page {page} of {info.pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !info.hasNext}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
