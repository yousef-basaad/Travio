import { NextResponse } from "next/server";
import type { DomainAccessResult } from "@/lib/auth/require-domain-access";

// Shared pieces for route-handler tests: the routes are called directly
// with a Request, and the auth guard and services are mocked per file.

export const TENANT_ID = "00000000-0000-4000-8000-0000000000a1";
export const USER_ID = "00000000-0000-4000-8000-0000000000b1";
export const ID = "00000000-0000-4000-8000-0000000000c1";
export const OTHER_ID = "00000000-0000-4000-8000-0000000000d1";

export function allowed(role = "agency_owner"): DomainAccessResult {
  return {
    ok: true,
    access: { supabase: {}, tenantId: TENANT_ID, userId: USER_ID, role },
  } as unknown as DomainAccessResult;
}

export function refused(status = 403): DomainAccessResult {
  return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status }) };
}

export function jsonRequest(method: string, body: unknown, url = "http://localhost/api/x"): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function getRequest(url = "http://localhost/api/x"): Request {
  return new Request(url);
}

export function params(id = ID) {
  return { params: Promise.resolve({ id }) };
}

export function dbError(code: string, message = "") {
  return Object.assign(new Error(message), { code, message });
}
