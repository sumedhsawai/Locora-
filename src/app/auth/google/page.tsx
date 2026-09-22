"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/auth";

/**
 * Starts the Google OAuth flow from a TOP-LEVEL tab.
 *
 * Google refuses to render its consent screen inside embedded iframes, and a
 * PKCE verifier cookie written from a third-party iframe can be partitioned
 * or dropped by the browser — so when the app runs inside a preview iframe
 * we open this page in a new tab and let IT run the round-trip:
 *   /auth/google  →  Google consent  →  Supabase  →  /auth/callback
 */
export default function GoogleRedirectPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!REAL_MODE) {
      router.replace("/login");
      return;
    }
    const sb = supabase();
    if (!sb) {
      setError("Supabase is not configured on this deployment.");
      return;
    }

    void sb.auth
      .signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      .then((res: { error: { message: string } | null }) => {
        // On success the tab navigates away to Google automatically.
        if (res.error) setError(res.error.message);
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand-500/25 blur-[110px]" />
        <div className="aurora-blob aurora-blob-2 absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent-500/15 blur-[100px]" />
      </div>

      <div className="reveal-up relative w-full max-w-sm rounded-3xl bg-white/95 p-8 text-center shadow-2xl ring-1 ring-white/40">
        <div className="flex flex-col items-center">
          <LogoMark size={52} className="drop-shadow-lg" />

          {error ? (
            <>
              <h1 className="mt-4 text-[19px] font-extrabold tracking-tight text-ink-900">
                Couldn&apos;t reach Google
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{friendlyAuthError(error)}</p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-brand-600"
              >
                Back to sign in <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-[19px] font-extrabold tracking-tight text-ink-900">
                Redirecting to Google…
              </h1>
              <p className="mt-2 text-[13px] font-medium text-ink-400">
                One moment while we start your sign-in.
              </p>
              <Loader2 size={26} className="mt-5 animate-spin text-brand-500" />
              <Link href="/login" className="mt-6 text-[12.5px] font-bold text-ink-400 hover:text-ink-700">
                Cancel and go back
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
