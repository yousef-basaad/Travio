import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mocks only the session refresh; the redirect decision is the real
// middleware code under test.
let currentUser: { id: string } | null = null;
let refreshedCookie: { name: string; value: string } | null = null;

vi.mock("@travio/database/middleware", () => ({
  updateSupabaseSession: vi.fn(async (request: NextRequest) => {
    const response = NextResponse.next({ request });
    if (refreshedCookie) response.cookies.set(refreshedCookie.name, refreshedCookie.value);
    return { response, user: currentUser };
  }),
}));

import { middleware } from "./middleware";

function requestFor(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3001"));
}

describe("dashboard middleware", () => {
  beforeEach(() => {
    currentUser = null;
    refreshedCookie = null;
  });

  it("redirects an authenticated user from /login to /", async () => {
    currentUser = { id: "user-1" };
    const response = await middleware(requestFor("/login"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });

  it("keeps refreshed session cookies on the /login redirect", async () => {
    currentUser = { id: "user-1" };
    refreshedCookie = { name: "sb-test-auth-token", value: "rotated" };
    const response = await middleware(requestFor("/login"));
    expect(response.cookies.get("sb-test-auth-token")?.value).toBe("rotated");
  });

  it("lets an unauthenticated user stay on /login", async () => {
    const response = await middleware(requestFor("/login"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not redirect an authenticated user on other routes", async () => {
    currentUser = { id: "user-1" };
    const response = await middleware(requestFor("/customers"));
    expect(response.headers.get("location")).toBeNull();
  });
});
