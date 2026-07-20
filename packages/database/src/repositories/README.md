# repositories/

Table-level repository objects that group related queries/mutations for a single entity
(e.g. `bookingsRepository.list()`, `.getById()`, `.create()`, `.update()`).

Convention: one file per domain entity (`bookings.repository.ts`, `customers.repository.ts`, ...).
Repositories compose functions from `../queries` where useful, and are the layer that
`packages/api` and app-level feature `api/` folders call into — neither should construct raw
Supabase queries directly against `supabase-js`.
