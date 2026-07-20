# Travio

SaaS platform for Saudi travel agencies — booking, visa, and finance management.

## Structure

```
supabase/              Supabase CLI project (infrastructure, not app code)
  config.toml           CLI/local-dev project config
  seed.sql               Local dev seed data
  migrations/             Schema migrations (source of truth)

apps/
  dashboard/         Agency staff dashboard (bookings, customers, visa, finance, reports, branding, settings)
  website/            Public marketing site
  customer-portal/    End-customer self-service portal
  admin/              Travio's internal SaaS admin (cross-tenant)

packages/
  ui/            Design system (shadcn/ui pattern components)
  auth/          Auth actions, role guards, session context (built on Supabase)
  database/      Supabase clients (browser/server/middleware/admin) + queries/repositories/types
  api/           Shared service layer + TanStack Query hooks (cross-app data)
  types/         Shared Zod schemas / domain types
  hooks/         Cross-cutting React hooks (no domain logic)
  utils/         Pure helper functions (cn, currency, date)
  config/        Shared ESLint + Tailwind config
```

## Conventions

- **Feature-based architecture**: every app organizes domain logic under `src/features/<feature>/`
  with `components/`, `api/`, `hooks/`, `schemas/`, `types/`, and a single `index.ts` public API.
  Cross-feature imports must go through that `index.ts` — never reach into another feature's internals.
- **Multi-tenancy via Postgres RLS**: every tenant-scoped table carries `tenant_id` and is isolated by
  Row Level Security policies, not application-level filtering. See `supabase/migrations`.
- **Auth surfaces**: `dashboard`/`admin` use `requireRole()` layout guards; the Supabase service-role
  (admin) client is server-only and restricted in practice to `apps/admin` and background jobs.
- **Shared vs local data logic**: if data is read by more than one app (e.g. bookings, read by both
  `dashboard` and `customer-portal`), the query lives in `packages/api`. If it's single-app, it lives in
  that app's `features/<feature>/api/`.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase project credentials
pnpm dev                      # runs all 4 apps via Turborepo
pnpm dev:dashboard             # or run a single app
```

## Supabase setup

1. Create a Supabase project (or run locally with `pnpm db:start`, requires Docker).
2. Apply migrations in `supabase/migrations/` — `pnpm db:push` against a remote project, or
   `pnpm db:reset` for local dev (also runs `supabase/seed.sql`).
3. Run `pnpm db:types` to generate `packages/database/src/types/generated.ts` from your live schema.
4. Add new domain tables (bookings, visa_applications, invoices, …) as new files in
   `supabase/migrations/`, following the `tenant_id` + RLS policy convention already established
   for `tenants`/`profiles`. Query/repository code for them lives in `packages/database/src/queries`
   and `src/repositories`.

## Adding a shadcn/ui component

```bash
cd packages/ui
npx shadcn add <component>
```
Components land in `packages/ui/src/components/` and are re-exported from `src/index.ts`, available
to every app as `@travio/ui`.
