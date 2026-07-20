import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "../types/generated";

// Refreshes the Supabase auth session on every request. Each app's
// middleware.ts calls this and then applies its own route-protection logic
// (see packages/auth for role/tenant guards built on top of this).
export async function updateSupabaseSession(request: NextRequest) {
    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));


  let response = NextResponse.next({ request });

  // Typed against @supabase/ssr's own CookieMethodsServer contract so the
  // getAll/setAll callback parameters are inferred from the library instead
  // of falling back to implicit any (createServerClient's cookies option is
  // overloaded, which defeats plain contextual typing on an untyped object
  // literal).
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
    },
  };


  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
