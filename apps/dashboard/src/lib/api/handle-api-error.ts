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
export function handleApiError(error: unknown, context: ApiErrorContext = {}): NextResponse {
  logger.error({
    message: "Unhandled API error",
    error,
    ...context,
  });

  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
