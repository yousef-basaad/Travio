# @travio/database

Application-side Supabase access layer for Travio: typed clients, queries, repositories, and
generated DB types. **No CLI config, no migrations, no seed data** — that's infrastructure and
lives in the root [`supabase/`](../../supabase) directory, managed by the Supabase CLI.

## Structure
```
src/
  clients/         Client factories — browser / server / middleware / admin
  queries/          Composable query functions
  repositories/      Per-entity repository objects (built on queries/)
  types/              Generated DB types (never hand-edit generated.ts)
  index.ts             Package entrypoint
```

## Clients
- `./browser` — Client Components (anon key, RLS-scoped)
- `./server` — Server Components / Server Actions / Route Handlers (anon key, RLS-scoped)
- `./middleware` — session refresh, used by each app's `middleware.ts`
- `./admin` — service-role, server-only, bypasses RLS. Use sparingly.

## Multi-tenancy
Every domain table carries `tenant_id` and enforces isolation via RLS (`current_tenant_id()`
helper). See [`supabase/migrations/00000000000000_init.sql`](../../supabase/migrations/00000000000000_init.sql)
for the pattern — apply that same convention in any new migration.

## Regenerating types
```
pnpm db:types
```
Writes `src/types/generated.ts` from the live Supabase schema. Never hand-edit.

## Related CLI commands (run from repo root)
```
pnpm db:start   # local Supabase stack (Docker)
pnpm db:reset   # reapply all migrations + supabase/seed.sql, local only
pnpm db:diff    # generate a new migration from local schema changes
pnpm db:push    # push migrations to the linked remote project
```
