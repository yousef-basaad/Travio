import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

// Formalizes the "<h1> + actions" row repeated at the top of every
// top-level page (LeadsTable, BookingsTable, CustomersTable, the
// Analytics page) - each previously wrote its own
// "flex items-center justify-between" div with a hardcoded
// text-lg font-semibold h1. Lives under components/layout alongside
// AppSidebar/AppHeader/PageContainer - the other dashboard-shell
// primitives - rather than components/patterns.
//
// Phase UI-Premium-1: a hairline + bottom padding gives every page a
// clear "header band" separate from its content, the section
// separation a premium SaaS page structure needs - one change here
// reaches every page that already renders PageHeader (Analytics,
// Customers, Leads, Finance, Visa, ...) instead of touching each page
// file individually. min-w-0 on the title block and gap-4 on the row
// are the same defensive fix already applied to StatsCard's header
// row: without it, a long title/description next to wide actions can
// overflow instead of the title truncating/wrapping first.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="text-heading-lg text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
