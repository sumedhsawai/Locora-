/* Supabase connection config shared by client, server and middleware. */

export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/**
 * True when the app should talk to the real Supabase backend.
 * False when env vars are missing or NEXT_PUBLIC_USE_MOCKS=true → the offline
 * demo (seed data + localStorage) stays fully functional.
 */
export const REAL_MODE =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0 && process.env.NEXT_PUBLIC_USE_MOCKS !== "true";
