# queries/

Composable, reusable Supabase query builders (e.g. `getBookingsByTenant(supabase, tenantId)`).

Convention: a query function takes a Supabase client instance as its first argument (so callers
control which client — browser/server/admin — executes it) and returns typed data using the types
from `../types`. Keep these free of caching/React concerns; that belongs in `packages/api` or the
consuming app's feature hooks.
