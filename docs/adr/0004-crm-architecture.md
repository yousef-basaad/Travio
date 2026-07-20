# ADR-0004 – CRM Architecture

- **Status**: Proposed
- **Date**: 2026-07-20
- **Related**: Phase 2 (leads migration, Booking/Row reconciliation), Phase 3 CRM Foundation investigation

## 1. Context

### Current customer module

`public.customers` (`supabase/migrations/0002_core_tables.sql`) holds `tenant_id`, `branch_id`, `full_name`, `phone`, `email`, `nationality`, `passport_number`, `date_of_birth`, a single free-text `notes` column, and the standard `created_at`/`updated_at`/`deleted_at` triple. It is a flat profile record with no history, no ownership, and no lifecycle state — a customer simply exists or is soft-deleted.

### Existing bookings relationship

`public.bookings` (`supabase/migrations/20260718165026_booking_engine.sql`) links to a customer via `bookings.customer_id → customers.id`, with `booking_services` (flight/hotel/visa line items) hanging off each booking. This is the only relationship a customer currently participates in. Financial records (`invoices`, `payments`, `expenses`) are themselves rooted in bookings/tenants, never in leads — the entire finance layer assumes a customer already exists.

### Existing `public.leads` purpose

`public.leads` (added in Phase 2) captures inquiries submitted through `apps/website`'s public marketing site — prospective **travel agencies** asking to sign up for Travio itself. It intentionally has **no `tenant_id`** (no tenant exists yet for an unconverted signup), is insert-only via the service-role admin client, and carries **zero RLS policies** (RLS enabled, no policies = deny-all for `anon`/`authenticated`, bypassed only by the service role). This is Travio's own top-of-funnel, not a tenant-facing sales pipeline.

### Current RLS model

Every tenant-scoped table follows one convention, established in `00000000000000_initial_schema.sql` and repeated in every migration since: `tenant_id uuid not null references tenants(id) on delete cascade`, RLS enabled, and a `"<table>_tenant_access"` policy using `tenant_id = public.current_tenant_id()` (a `security definer` function resolving the caller's tenant from `profiles`). `public.current_role()` exists alongside it and is used sparingly — today only for the `profiles`/`tenants` "own row or `travio_admin`" policies. **No table anywhere in the schema scopes access below the tenant level.** Any authenticated member of a tenant — `sales_agent` included — can read and write every row belonging to that tenant.

### Current limitations

- No tenant-facing lead concept exists — only the unrelated, pre-tenant `public.leads`.
- No lead → customer conversion path.
- Notes are one flat text field, not a history.
- No activity log, no tasks, no attachments, no timeline.
- No ownership/assignment column anywhere in the schema.
- RLS cannot express "my records only" — the finest grain available is "everyone in the tenant."
- `profiles` has no `branch_id`, so branch-level access boundaries aren't expressible yet.

## 2. Problem Statement

The current schema can store a customer and the bookings they eventually make, but it has no representation of the work that produces a customer in the first place, and no memory of what happens to them afterward. There is nowhere to record that a prospect was called, nowhere to track who is responsible for following up, nowhere to attach a passport scan or a quote, and no way to answer "what happened with this customer over the last six months" without querying five unrelated tables by hand. `public.leads` cannot be repurposed for this — it models a different actor (a prospective agency, not a prospective traveler) in a different bounded context (Travio's own sales, not a tenant's), with a security model (public, tenant-less, insert-only) that is the opposite of what a tenant CRM needs (authenticated, tenant-scoped, role- and assignment-aware). The tenant-wide RLS model, while correct for today's operational tables, is also too coarse for a CRM: a sales team's pipeline is only useful if individual agents' leads and notes aren't visible to and editable by every other agent in the tenant. None of this can be retrofitted onto `customers`/`bookings` without either overloading their meaning or blurring the boundary between "someone we're pursuing" and "someone we have a confirmed commercial relationship with." A dedicated, additive set of CRM tables is required.

## 3. Decision

Introduce a CRM subsystem as a set of new, additive tables, all following the existing tenant_id + RLS + `update_updated_at()` trigger convention. No existing table's shape changes as part of this decision.

| Table | Purpose |
|---|---|
| `crm_leads` | Tenant-scoped pipeline entity for a prospective *traveler* (not a prospective agency). Carries the lifecycle status, source, and assignment. |
| `customers` | *Unchanged.* Remains the record of a real, converted relationship — the target a `crm_leads` row converts into. |
| `bookings` | *Unchanged.* Remains linked to `customers` only. |
| `crm_notes` | Free-form, timestamped notes against a customer or a lead. Supersedes `customers.notes` as the going-forward mechanism; the existing column is left in place, unused by new code, rather than migrated in this ADR's scope. |
| `crm_activities` | Logged interactions — calls, emails, meetings, WhatsApp — against a customer or a lead. |
| `crm_tasks` | Follow-up work items with a due date and an assignee; optionally linked to a customer or lead, or standalone. |
| `crm_attachments` | Metadata for files (passport scans, quotes, contracts) stored in Supabase Storage, tenant-namespaced by path. |
| `crm_timeline` | A **SQL view**, not a table — a unioned, chronological read of notes, activities, status changes, bookings, and invoices for a given customer or lead. |

Every new table that references a customer or a lead does so with **two explicit, nullable foreign keys** — `customer_id` and `lead_id` — constrained by `check ((customer_id is not null) <> (lead_id is not null))`, rather than a generic `subject_type text` / `subject_id uuid` pair.

### Why `public.leads` remains dedicated to Travio SaaS website inquiries

`public.leads` and `crm_leads` share an English word and nothing else. `public.leads` rows have no tenant (none exists yet), are written by an unauthenticated public form, and are owned end-to-end by Travio's own sales process. `crm_leads` rows always belong to an existing tenant, are written by authenticated agency staff, and are owned by that agency's sales team. Merging them would force one of two bad outcomes: expose the agency-signup funnel through tenant RLS it structurally cannot satisfy (there is no tenant yet), or force every tenant's traveler pipeline through a deny-all, service-role-only table that cannot express per-tenant, per-agent permissions at all. Keeping them separate costs nothing and prevents both.

### Why `crm_leads` is a separate bounded context

Beyond the tenant boundary above, `crm_leads` has its own lifecycle (a status pipeline ending in `won`/`lost`), its own actors (`sales_agent`, `branch_manager`), and its own conversion semantics that `public.leads` has no equivalent of. Modeling it as its own table means its schema, RLS policies, and lifecycle can evolve independently of the website's inquiry form — a change to one can never accidentally break or leak into the other.

### Why Timeline is implemented as a SQL View

A view reads directly from `crm_notes`, `crm_activities`, lead status transitions, `bookings`, and `invoices` with no additional write path. Every source table already has (or will have, per the phases below) exactly one place that writes to it; nothing needs to remember to also fan out an event to a separate `crm_timeline_events` table, which removes an entire class of consistency bugs (a note written but not reflected in the timeline). It is also free to extend: a new event source is another `union all` branch, not a schema migration or a new trigger. The trade-off — read cost grows with data volume and branch count — is accepted for now and revisited in §7.

### Why explicit foreign keys are preferred over polymorphic `subject_type`/`subject_id`

Postgres has no native polymorphic foreign key. A `subject_type text, subject_id uuid` pair gives up referential integrity entirely: nothing stops `subject_id` from pointing at a row that doesn't exist or a table `subject_type` doesn't actually name, cascading deletes don't work, and every join needs an application-level `CASE` on `subject_type` instead of a real FK. Two nullable, real foreign keys plus a `CHECK` constraint keep full referential integrity (including `ON DELETE CASCADE`), let Postgres use normal FK indexes, and match how every other table in this schema already models relationships — explicit typed columns, never generic references. The cost is one extra nullable column per polymorphic table, which is cheap.

### Why Booking remains linked to Customer rather than Lead

A booking is a confirmed commercial transaction with real financial consequences — it is the parent of `booking_services`, and indirectly of `invoices` and `payments`. Allowing a booking to attach to an unconverted `crm_leads` row would let pipeline data (an inquiry that might still be lost) accumulate production financial data, and would force the entire finance schema to learn about leads. Keeping the foreign key on `customers` only means **conversion (`won`) is the single, unambiguous gate** between "someone we're pursuing" and "someone with a real financial record" — a gate every downstream table can keep assuming holds, exactly as it does today.

## 4. Lead Lifecycle

```
New → Contacted → Qualified → Proposal Sent → Won
                                             ↘ Lost
```

Stages advance forward in order; `Lost` is reachable from any stage (a lead can go cold at any point, not only after a proposal). Both `Won` and `Lost` are terminal — a resurrected prospect is a new `crm_leads` row, not a status reverted backward, so pipeline history stays honest.

**On `Won`:**
- A `customers` row is created (or, if the lead's contact details already match an existing customer, linked rather than duplicated).
- A first `bookings` row **may optionally** be created — conversion and the first booking are not required to happen in the same action, since the agent may not have finalized an itinerary the moment a lead says yes.
- `crm_leads.converted_customer_id` is set and never overwritten, forming a permanent, queryable link from pipeline history to the resulting customer.
- **The lead row is never deleted**, on `Won` or `Lost`. Full pipeline history is retained indefinitely so conversion-rate and pipeline analytics (§6) remain possible; "deleting" a lead means marking it `Lost`, not removing the row.

## 5. Ownership Model

`crm_leads` and `crm_tasks` use an `assigned_to → profiles.id` column, deliberately named **`assigned_to`, not `owner_id`**.

**Why assignment, not ownership**: a lead or task is a unit of work distributed by management to a team member — it can be reassigned, can sit unassigned in a shared queue awaiting triage, and the person working it today may not be the person who created it. "Owner" implies a permanent, possessive relationship, and is additionally ambiguous in this schema specifically because `agency_owner` is already a distinct **role** — a column named `owner_id` on a lead risks being misread as "the agency owner responsible for this tenant" rather than "the agent currently working this lead." `assigned_to` has no such collision and matches the vocabulary sales/ticketing tools already use, including a clean `null` state for "not yet claimed."

**Permissions by role:**

| Role | Access |
|---|---|
| `travio_admin` | Cross-tenant read, for platform support — consistent with its existing `profiles`/`tenants` access. No special write grant into tenant CRM data by default; tenant CRM data remains the tenant's own. |
| `agency_owner` | Full read/write across all CRM data in their tenant, regardless of assignment — consistent with their existing unrestricted access to every other tenant table. |
| `branch_manager` | Intended: full read/write scoped to their branch, via `crm_leads.branch_id`/`customers.branch_id`. **Blocked today**: `profiles` has no `branch_id`, so this cannot be enforced by RLS yet. Until that column exists, `branch_manager` is granted the same tenant-wide access as `agency_owner`, as an explicit, temporary gap — not a design choice — to be closed in a future phase. |
| `sales_agent` | Read/write only rows where `assigned_to = auth.uid()`. Read-only (not write) access to *unassigned* rows in their tenant, so they can self-serve from a shared queue without being able to reassign a colleague's lead away from them. No visibility into another agent's assigned leads, notes, or tasks. |

## 6. Future Expansion

This ADR defines the shape of the subsystem; the phases below (in the order agreed during the Phase 3 investigation) build it out incrementally:

- **Notes** — `crm_notes`, freeform history against a customer or lead.
- **Activities** — `crm_activities`, structured interaction log (calls, emails, meetings).
- **Timeline** — the `crm_timeline` view, once notes/activities/bookings exist to union.
- **Tasks** — `crm_tasks`, assignment and due-date driven follow-ups.
- **Attachments** — `crm_attachments` + a Supabase Storage bucket, for passport scans, quotes, contracts.
- **Analytics** — conversion funnels by source/stage, agent performance, lead response times — built on top of `crm_leads` + `crm_timeline` once enough history accumulates.
- **Automation** — round-robin or rules-based auto-assignment on lead creation, stale-lead nudges, status-change-triggered tasks.
- **WhatsApp integration** — inbound/outbound messages logged as `crm_activities` of type `whatsapp`, sourced from the WhatsApp Business API.
- **Email integration** — inbound/outbound email logged as `crm_activities` of type `email`, sourced from a connected mailbox or inbound-parse webhook.

None of these require a change to the core decision in §3; each is either a new table that follows the same convention, or a consumer of `crm_timeline`/`crm_activities` that already exist.

## 7. Consequences

### Advantages

- Clean separation between Travio's own SaaS acquisition funnel (`public.leads`) and a tenant's traveler pipeline (`crm_leads`) — no shared schema, no shared security model, no future migration risk of untangling them.
- Tenant isolation is preserved by strict adherence to the existing, already-battle-tested `tenant_id` + RLS convention — no new isolation mechanism to design or audit.
- Referential integrity is real (FK + `CHECK`), not application-enforced, for every note/activity/task/attachment.
- The timeline is nearly free to build and extend — a view over existing data, not a new write path or event pipeline.
- Immutable lead history (never deleted) makes pipeline and conversion analytics possible from day one without a separate audit log.
- `assigned_to` maps directly onto how a sales team already thinks about its own pipeline.

### Trade-offs

- Every polymorphic table (`crm_notes`, `crm_activities`, `crm_tasks`, `crm_attachments`) carries two nullable FK columns instead of one flexible reference — more schema surface for a small integrity guarantee, judged worth it here.
- `crm_timeline` as a view means read cost scales with the number of source tables and rows unioned; if it becomes a bottleneck at scale, the fix is a dedicated `crm_timeline_events` table or a materialized view, not a wholesale redesign — but that migration is deferred, not designed, by this ADR.
- `branch_manager` permission scoping is incomplete until `profiles.branch_id` is added; until then it is functionally identical to `agency_owner`, which is a real, if temporary, over-grant.
- Leads are never deleted, so `crm_leads` grows monotonically with every `Lost` outcome — acceptable for the analytics value it provides, but an eventual archival/retention strategy (not designed here) will be needed at sufficient scale or for data-retention compliance.
- Six new tables and their RLS policies are additional surface to maintain and reason about on every future schema change.

### Migration strategy

This ADR is additive-only: no existing table (`customers`, `bookings`, `public.leads`, or any finance table) changes shape as a result of this decision. Each table in §3 ships as its own migration, following the exact pattern already established since `0002_core_tables.sql` (`tenant_id` + `enable row level security` + `"<table>_tenant_access"` policy + `update_updated_at()` trigger), and each phase in §6 is independently deployable and typecheck-verified before the next begins — consistent with how the Phase 2 issues in this project were sequenced one migration and one verified commit at a time, rather than as a single large schema change.
