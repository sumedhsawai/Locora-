"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { Button } from "@/components/ui";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/lib/store";

/**
 * Password-reset landing page. The "forgot password" email links here with a
 * one-time recovery code; Supabase exchanges it into a short-lived session,
 * and the user must choose a new password before continuing — like every
 * other app. We never drop them into the marketplace on a reset link.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { push } = useToast();
  const [phase, setPhase] = React.useState<"checking" | "form" | "expired">("checking");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
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
      setPhase("expired");
      return;
    }

    void (async () => {
      try {
        // detectSessionInUrl usually consumes the recovery code on client
        // boot; fall back to an explicit exchange if it hasn't.
        let { data } = await sb.auth.getSession();
        if (!data.session && new URLSearchParams(window.location.search).get("code")) {
          const res = await sb.auth.exchangeCodeForSession(window.location.href);
          if (res.error) throw res.error;
          data = (await sb.auth.getSession()).data;
        }
        setPhase(data.session ? "form" : "expired");
      } catch {
        setPhase("expired");
      }
    })();
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("Choose a password with at least 8 characters.");
    if (pw !== pw2) return setError("The two passwords don't match.");
    const sb = REAL_MODE ? supabase() : null;
    if (!sb) return;
    setBusy(true);
    try {
      const { error: err } = await sb.auth.updateUser({ password: pw });
      if (err) {
        setError(err.message.includes("different from the old") ? "Pick a password you haven't used before." : err.message);
        return;
      }
      push({ kind: "success", title: "Password updated 🎉", body: "You're signed in — your new password is active." });
      router.replace("/home");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand-500/25 blur-[110px]" />
        <div className="aurora-blob aurora-blob-2 absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent-500/15 blur-[100px]" />
      </div>

      <div className="reveal-up relative w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl ring-1 ring-white/40">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={46} className="drop-shadow-lg" />

          {phase === "checking" && (
            <div className="mt-6 flex items-center gap-2 text-[14px] font-semibold text-ink-500">
              <Loader2 size={16} className="animate-spin" /> Checking your reset link…
            </div>
          )}

          {phase === "expired" && (
            <>
              <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink-900">Link expired</h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
                This password-reset link has already been used or has expired — they're single-use
                and valid for a limited time.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-brand-600"
              >
                <KeyRound size={15} /> Request a new reset link
              </Link>
            </>
          )}

          {phase === "form" && (
            <>
              <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink-900">
                Choose a new password
              </h1>
              <p className="mt-1.5 text-[13.5px] text-ink-500">
                You're almost done — pick a new password to finish resetting your account.
              </p>

              <form onSubmit={submit} className="mt-6 w-full space-y-3.5">
                <label className="block">
                  <span className="mb-1.5 block text-left text-[13px] font-bold text-ink-700">New password</span>
                  <span className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
                    <KeyRound size={16} className="shrink-0 text-ink-400" />
                    <input
                      type={show ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full bg-transparent py-3 text-[14.5px] outline-none placeholder:text-ink-300"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button type="button" onClick={() => setShow(!show)} className="text-ink-400 transition hover:text-ink-600" aria-label={show ? "Hide password" : "Show password"}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-left text-[13px] font-bold text-ink-700">Confirm new password</span>
                  <span className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
                    <CheckCircle2 size={16} className="shrink-0 text-ink-400" />
                    <input
                      type={show ? "text" : "password"}
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      placeholder="Type it once more"
                      className="w-full bg-transparent py-3 text-[14.5px] outline-none placeholder:text-ink-300"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </span>
                </label>

                {error && <p className="text-left text-[13px] font-semibold text-rose-600">{error}</p>}

                <Button type="submit" size="lg" className="w-full" loading={busy}>
                  <ShieldCheck size={17} /> Save new password
                </Button>

                <p className="text-center text-[11.5px] text-ink-400">
                  You'll stay signed in after saving.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
