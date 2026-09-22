"use client";

/* ------------------------------------------------------------------ */
/*  Locora — real authentication (Supabase Auth)                       */
/*  Email + password and Google OAuth. Every function here is only     */
/*  called when REAL_MODE is true; otherwise the demo flow is used.    */
/* ------------------------------------------------------------------ */

import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { Role, User } from "@/lib/types";
import { supabase } from "./client";

export interface ProfileRow {
  id: string;
  name: string;
  role: Role;
  area: string;
  email: string;
  phone: string;
  joined_at: string;
  avatar_from: string;
  avatar_to: string;
  verified: boolean | null;
  bio: string | null;
  rating: number | null;
  reviews_count: number | null;
  response_mins: number | null;
  banned: boolean | null;
  is_demo: boolean | null;
}

/** Map a Supabase profiles row (snake_case) → the app's User type. */
export function profileToUser(p: ProfileRow, fallbackEmail?: string): User {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    area: p.area,
    email: p.email || fallbackEmail || "",
    phone: p.phone ?? "",
    joinedAt: p.joined_at ?? new Date().toISOString(),
    avatarFrom: p.avatar_from || "#0390E0",
    avatarTo: p.avatar_to || "#014093",
    verified: p.verified ?? false,
    bio: p.bio ?? undefined,
    rating: Number(p.rating ?? 0),
    reviewsCount: p.reviews_count ?? 0,
    responseMins: p.response_mins ?? 15,
    banned: p.banned ?? false,
    isDemo: p.is_demo ?? false,
  };
}

/** Build a User from the auth record when the profiles row isn't there yet. */
export function authUserToUser(u: SupabaseUser): User {
  const meta = (u.user_metadata ?? {}) as Record<string, string>;
  return {
    id: u.id,
    name: meta.name || (u.email ? u.email.split("@")[0] : "New user"),
    role: (meta.role as Role) || "buyer",
    area: meta.area || "viman",
    email: u.email ?? "",
    phone: "",
    joinedAt: u.created_at ?? new Date().toISOString(),
    avatarFrom: meta.avatar_from || "#0390E0",
    avatarTo: meta.avatar_to || "#014093",
    rating: 0,
    reviewsCount: 0,
    responseMins: 15,
  };
}

/** Fetch (or best-effort derive) the Locora profile for a Supabase session. */
export async function loadSessionUser(session: Session): Promise<User | null> {
  const sb = supabase();
  if (!sb) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile) return profileToUser(profile as ProfileRow, session.user.email ?? undefined);
  // profiles table not migrated yet (or trigger missed) — fall back to metadata
  return authUserToUser(session.user);
}

export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Incorrect email or password. Double-check and try again.";
  if (m.includes("user already registered"))
    return "An account with this email already exists — try signing in instead.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("password should be at least"))
    return "Please choose a stronger password (at least 8 characters).";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts — this is a temporary safety limit. Please wait up to an hour and try again.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Can't reach the authentication server. Check your connection.";
  return "Something went wrong. Please try again.";
}

export async function signInWithEmail(email: string, password: string) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase is not configured");
  return sb.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpWithEmail(opts: {
  email: string;
  password: string;
  name: string;
  role: Role;
  area: string;
}) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase is not configured");
  return sb.auth.signUp({
    email: opts.email.trim().toLowerCase(),
    password: opts.password,
    options: {
      data: { name: opts.name.trim(), role: opts.role, area: opts.area },
      emailRedirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    },
  });
}

export async function signInWithGoogle(): Promise<{ data: null; error: { message: string } | null }> {
  // The whole OAuth round-trip must run TOP-LEVEL on our own origin:
  //  - Google refuses to render consent inside embedded iframes;
  //  - the PKCE verifier cookie written from a third-party iframe can be
  //    partitioned or dropped by the browser, breaking the code exchange.
  // So we always hand off to /auth/google (opened as a new tab when we're
  // inside an iframe) which starts the flow, and /auth/callback finishes it.
  if (typeof window === "undefined") return { data: null, error: null };

  const inIframe = window.self !== window.top;
  const url = "/auth/google";
  if (inIframe) {
    // window.open is called synchronously on the click, so popup blockers allow it.
    const tab = window.open(url, "_blank");
    if (!tab) window.location.assign(url); // popup blocked — best effort
  } else {
    window.location.assign(url);
  }
  return { data: null, error: null };
}

export async function sendPasswordReset(email: string) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase is not configured");
  return sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
  });
}

export async function signOut() {
  const sb = supabase();
  if (sb) await sb.auth.signOut();
}
