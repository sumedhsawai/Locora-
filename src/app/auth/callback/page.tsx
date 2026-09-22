"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/auth";

/**
 * OAuth landing page. Supabase redirects here with `?code=...` (PKCE) after
 * Google consent. We exchange the code for a session, tell the tab that
 * opened us (usually the app inside a preview iframe) that we're done, and
 * continue into the app.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"working" | "done" | "error">("working");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const sb = REAL_MODE ? supabase() : null;
    if (!sb) {
      router.replace("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") || params.get("error");

    const run = async () => {
      try {
        if (oauthError) throw new Error(decodeURIComponent(oauthError));

        // detectSessionInUrl may already have consumed the code.
        let { data } = await sb.auth.getSession();
        if (!data.session && params.get("code")) {
          const res = await sb.auth.exchangeCodeForSession(window.location.href);
          if (res.error) throw res.error;
          data = (await sb.auth.getSession()).data;
        }

        if (!data.session) throw new Error("No session was returned — please try signing in again.");

        // Let the original tab (app inside the preview iframe) pick this up
        // immediately instead of waiting for its session poll.
        try {
          window.opener?.postMessage("locora:auth-complete", "*");
        } catch {
          /* opener may be closed — fine */
        }

        setStatus("done");
        window.setTimeout(() => router.replace("/home"), 700);
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Sign-in failed");
      }
    };

    void run();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand-500/25 blur-[110px]" />
        <div className="aurora-blob aurora-blob-2 absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-teal-400/20 blur-[100px]" />
      </div>

      <div className="reveal-up relative w-full max-w-sm rounded-3xl bg-white/95 p-8 text-center shadow-2xl ring-1 ring-white/40">
        <div className="flex flex-col items-center">
          <LogoMark size={52} className="drop-shadow-lg" />

          {status === "working" && (
            <>
              <h1 className="mt-4 text-[19px] font-extrabold tracking-tight text-ink-900">
                Finishing your sign-in…
              </h1>
              <p className="mt-2 text-[13px] font-medium text-ink-400">Just a second.</p>
              <Loader2 size={26} className="mt-5 animate-spin text-brand-500" />
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle2 size={44} className="mt-4 text-brand-500" />
              <h1 className="mt-3 text-[19px] font-extrabold tracking-tight text-ink-900">
                You&apos;re signed in!
              </h1>
              <p className="mt-2 text-[13px] font-medium text-ink-400">
                Taking you into Locora… The app in the original tab is ready too — you can close
                this one.
              </p>
              <Link
                href="/home"
                className="mt-6 inline-flex rounded-xl bg-brand-500 px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-brand-600"
              >
                Continue to Locora
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle size={44} className="mt-4 text-rose-400" />
              <h1 className="mt-3 text-[19px] font-extrabold tracking-tight text-ink-900">
                Sign-in didn&apos;t complete
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
                {friendlyAuthError(message)}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex rounded-xl bg-brand-500 px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-brand-600"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
