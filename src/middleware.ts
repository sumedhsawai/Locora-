import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session cookie fresh on app requests.
 *
 * Auth *gating* is intentionally client-side:
 *  - every (app) page server-renders only a splash screen — all private data
 *    is fetched client-side through RLS-protected APIs, so nothing can leak;
 *  - this also keeps sign-in working inside embedded/cross-site iframes where
 *    cookies may be blocked — a server-side gate there causes redirect loops.
 * In mock mode (no env / USE_MOCKS=true) the middleware does nothing.
 */
export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
    cookieOptions: { sameSite: "none", secure: true },
  });

  // refreshes the session cookie when needed (not used for gating — see above)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/home/:path*",
    "/search/:path*",
    "/create/:path*",
    "/chat/:path*",
    "/requests/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/product/:path*",
    "/service/:path*",
  ],
};
