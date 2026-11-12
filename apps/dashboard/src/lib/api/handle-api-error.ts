import { NextResponse } from "next/server";
import { logger } from "@travio/logger";

export interface ApiErrorContext {
  /** e.g. "/api/bookings/:id" - not the raw request.url (which would include the real id). */
  route?: string;
  /** e.g. "GET", "POST" - the handler this catch block belongs to. */
  action?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

// Shared by every dashboard API route's catch block, replacing the
// duplicated `return NextResponse.json({ error: "internal_error" },
// { status: 500 })` that gave 43 route files zero visibility into what
// actually failed. Logs the real error + context server-side only -
// the client-facing response is byte-identical to what every route
// already returned, so no API contract changes.
// Postgres errors that mean "the request is wrong", not "the server
// broke". Each gets a status and a code the UI can explain.
const RULE_ERRORS = new Set(["payment_exceeds_balance", "invoice_total_below_paid", "invoice_number_taken"]);

function mapDatabaseError(error: unknown): NextResponse | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  switch (error.code) {
    // A money rule (20261112120000).
    case "PL002":
      return NextResponse.json({ error: RULE_ERRORS.has(message) ? message : "conflict" }, { status: 409 });
    // Unique violation: the value is already used.
    case "23505":
      return NextResponse.json({ error: RULE_ERRORS.has(message) ? message : "conflict" }, { status: 409 });
    // Check violation: a value the database doesn't accept.
    case "23514":
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    // Not a valid uuid/number, typically an id in the URL.
    case "22P02":
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    default:
      return null;
  }
}

export function handleApiError(error: unknown, context: ApiErrorContext = {}): NextResponse {
  const mapped = mapDatabaseError(error);
  if (mapped) return mapped;

  // Not a failure: the agency's plan doesn't allow this (20261110130000).
  if (typeof error === "object" && error !== null && "code" in error && error.code === "PL001") {
    const limit = "details" in error && typeof error.details === "string" ? error.details : "";
    return NextResponse.json({ error: "plan_limit_reached", limit }, { status: 403 });
  }

  logger.error({
    message: "Unhandled API error",
    error,
    ...context,
  });

  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
