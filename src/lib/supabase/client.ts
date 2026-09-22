"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase client (cookie-based sessions).
 * Cookies use SameSite=None + Secure so the session also works inside
 * cross-site iframes (e.g. embedded previews). Null when not configured.
 */
export function supabase(): ReturnType<typeof createBrowserClient> | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: { sameSite: "none", secure: true },
    });
  }
  return client;
}
