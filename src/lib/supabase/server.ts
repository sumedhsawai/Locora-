import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Server-side Supabase client for Server Components / Route Handlers. */
export function supabaseServer() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: { sameSite: "none", secure: true },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // called from a Server Component — middleware refreshes sessions
        }
      },
    },
  });
}
