import { NextResponse } from "next/server";
import { logger } from "@travio/logger";

export interface ApiErrorContext {
  /** e.g. "/api/bookings/:id" - not the raw request.url. */
  route?: string;
  /** e.g. "GET", "POST" - the handler this catch block belongs to. */
  action?: string;
  userId?: string;
  customerId?: string;
  [key: string]: unknown;
}

// Mirrors apps/dashboard/src/lib/api/handle-api-error.ts exactly, keyed
// on customerId instead of tenantId - same logger, same client-facing
// { error: "internal_error" } shape, same "log real detail server-side
// only" reasoning.
export function handleApiError(error: unknown, context: ApiErrorContext = {}): NextResponse {
  logger.error({
    message: "Unhandled API error",
    error,
    ...context,
  });

  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
