import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";

// Minimal, dependency-free fake for postgrest's chainable query builder
// (`.from(table).select().eq()....`, awaitable via `.then()`). No fake
// relational engine, no query-filter simulation - tests configure what
// each `.from(table)` call resolves to and assert on which chain methods
// were called with what arguments. This matches what this test suite
// actually needs to verify (mapper behavior, business rules, side
// effects, tenant-isolation *assumptions* the mapper/service layer must
// uphold) - not RLS/query-filtering correctness, which only a real
// Postgres instance can verify and which "do not require a live
// database" rules out testing here.

export interface FakeQueryResult<T = unknown> {
  data: T;
  error: { message: string; code?: string } | null;
}

export interface RecordedCall {
  method: string;
  args: unknown[];
}

export interface RecordedFrom {
  table: string;
  calls: RecordedCall[];
}

/**
 * Responses per table, in call order - e.g. bookingsService.update()
 * calls `.from("bookings")` twice (a pre-fetch, then the update itself),
 * so responsesByTable.bookings = [firstCallResult, secondCallResult].
 * A table called more times than it has responses repeats its last one.
 * An .rpc("fn_name", args) call is keyed the same way under
 * `rpc:fn_name` (e.g. responsesByTable["rpc:update_team_member_role"]) -
 * same call-order/repeat-last-response semantics, just not a real table.
 */
export type TableResponses = Record<string, FakeQueryResult[]>;

export function createFakeSupabaseClient(responsesByTable: TableResponses = {}) {
  const callCounts: Record<string, number> = {};
  const allCalls: RecordedFrom[] = [];

  function makeChain(table: string, calls: RecordedCall[]) {
    const index = callCounts[table] ?? 0;
    callCounts[table] = index + 1;

    const responses = responsesByTable[table] ?? [];
    const result: FakeQueryResult = responses[index] ??
      responses[responses.length - 1] ?? { data: null, error: null };

    const chain = new Proxy(
      // Base target must be callable - some real postgrest chains aren't
      // invoked as functions, but a Proxy needs a valid target; a no-op
      // function is the simplest one.
      function chainTarget() {},
      {
        get(_target, prop: string | symbol) {
          if (prop === "then") {
            return (resolve: (value: FakeQueryResult) => void) => resolve(result);
          }
          return (...args: unknown[]) => {
            calls.push({ method: String(prop), args });
            return chain;
          };
        },
      },
    );

    return chain;
  }

  const client = {
    from(table: string) {
      const calls: RecordedCall[] = [];
      allCalls.push({ table, calls });
      return makeChain(table, calls);
    },
    // Real supabase-js .rpc(fn, args) returns an awaitable builder
    // directly (no .from() involved) - keyed as "rpc:<fn>" here so
    // findCalls/findCallsByMethod work unchanged, and the returned chain
    // is awaitable via the same makeChain/Proxy `.then()` every .from()
    // chain already uses (teamMembersService.updateRole does a bare
    // `await supabase.rpc(...)`, no further chaining).
    rpc(fn: string, args?: Record<string, unknown>) {
      const key = `rpc:${fn}`;
      const calls: RecordedCall[] = [{ method: "rpc", args: [fn, args] }];
      allCalls.push({ table: key, calls });
      return makeChain(key, calls);
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    allCalls,
  };
}

export function findCalls(allCalls: RecordedFrom[], table: string): RecordedFrom[] {
  return allCalls.filter((entry) => entry.table === table);
}

export function findCallsByMethod(
  allCalls: RecordedFrom[],
  table: string,
  method: string,
): RecordedCall[] {
  return findCalls(allCalls, table).flatMap((entry) =>
    entry.calls.filter((call) => call.method === method),
  );
}

/** The first argument of every `.insert(...)` call against `table`, in order. */
export function getInsertedRows(allCalls: RecordedFrom[], table: string): unknown[] {
  return findCallsByMethod(allCalls, table, "insert").map((call) => call.args[0]);
}

/** The first argument of every `.update(...)` call against `table`, in order. */
export function getUpdatedRows(allCalls: RecordedFrom[], table: string): unknown[] {
  return findCallsByMethod(allCalls, table, "update").map((call) => call.args[0]);
}

export function wasCalled(allCalls: RecordedFrom[], table: string, method: string): boolean {
  return findCallsByMethod(allCalls, table, method).length > 0;
}
