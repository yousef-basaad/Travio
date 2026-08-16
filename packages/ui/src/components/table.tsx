import * as React from "react";
import { cn } from "@travio/utils";

// Formalizes the raw <table> markup previously copy-pasted independently
// in bookings-table.tsx/customers-table.tsx/leads-table.tsx (each with
// its own overflow-x-auto wrapper, "w-full text-sm" table, "border-b
// text-left" header row, "py-2 pr-4" cells). Same markup, now shared.
// text-left is hardcoded on the header row, matching every existing
// table's current behavior exactly - not newly RTL-aware, since fixing
// that is a design change outside this extraction's scope.
//
// Design System v2.0: header row gets a subtle bg-surface-muted tint
// (was plain background before) and uppercase/tracking caption-style
// labels; body rows get a hover tint + smooth transition; cell padding
// increased slightly (py-2 -> py-2.5) for a less cramped, higher-end
// feel. This is the shared primitive only - no page's data/columns
// change, every existing *-table.tsx keeps using these same exports.

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Rendered as a visually-hidden <caption> for screen readers. */
  caption?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, caption, children, ...props }, ref) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table ref={ref} className={cn("w-full text-sm", className)} {...props}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  ),
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-surface-muted", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => <tbody ref={ref} {...props} />);
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border text-left transition-colors duration-fast ease-default last:border-0 [tbody_&]:hover:bg-muted/40",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export interface TableCellProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> {
  /** Renders a <th scope="col"> instead of a <td>. */
  header?: boolean;
  /**
   * Text alignment - "end" is the standard convention for an actions
   * column (row-level buttons/menus right-aligned), matching every
   * existing table's actions column today. Named to shadow (not extend)
   * the native, deprecated HTML `align` attribute's incompatible value
   * set ("left"/"right"/"char"/...) - this is never forwarded to the DOM
   * as a raw attribute, only consumed here to build the className.
   */
  align?: "start" | "end" | "center";
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, header = false, align = "start", ...props }, ref) => {
    const Comp = header ? "th" : "td";
    return (
      <Comp
        ref={ref}
        scope={header ? "col" : undefined}
        className={cn(
          // Design System v2.2: comfortable row height (py-2.5 -> py-3),
          // matching the reference's more generous table spacing.
          // Phase UI-Premium-1: first:pl-4 - every column already gets a
          // 16px leading gap "for free" (inherited from the previous
          // cell's own pr-4), except the very first column, which had no
          // left inset at all and sat flush against the table's border.
          // This gives it the same 16px breathing room every other
          // column already has.
          "whitespace-nowrap py-3 pr-4 first:pl-4",
          header && "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
          align === "end" && "text-right",
          align === "center" && "text-center",
          className,
        )}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";
