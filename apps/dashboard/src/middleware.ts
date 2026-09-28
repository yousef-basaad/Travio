import { updateSupabaseSession } from "@travio/database/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);

  // A signed-in user has nothing to do on /login - send them into the
  // app, where (dashboard)/layout.tsx decides dashboard vs /forbidden.
  // Cookies refreshed by updateSupabaseSession() are carried over so the
  // redirect doesn't drop a rotated session.
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
