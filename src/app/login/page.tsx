"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ExternalLink, Eye, EyeOff,
  Lock, Mail, Sparkles, User,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Button, Spinner } from "@/components/ui";
import { useApp, useToast } from "@/lib/store";
import { uid } from "@/lib/store";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import {
  friendlyAuthError, loadSessionUser, sendPasswordReset, signInWithEmail,
  signInWithGoogle, signUpWithEmail,
} from "@/lib/supabase/auth";
import type { Role } from "@/lib/types";

const DEMO_ACCOUNTS: { email: string; label: string; sub: string; from: string; to: string }[] = [
  { email: "aarav@demo.locora", label: "Aarav Kulkarni", sub: "Buyer · Viman Nagar", from: "#0390E0", to: "#014093" },
  { email: "sneha@demo.locora", label: "Sneha Patil", sub: "Seller · Kothrud", from: "#6366F1", to: "#4338CA" },
  { email: "rohan@demo.locora", label: "Rohan Sharma", sub: "Plumber · Koregaon Park", from: "#F59E0B", to: "#D97706" },
  { email: "admin@demo.locora", label: "Locora Admin", sub: "Admin dashboard", from: "#1B3054", to: "#0B1F3C" },
];

const GRADIENTS: [string, string][] = [
  ["#0390E0", "#014093"],
  ["#6366F1", "#4338CA"],
  ["#F59E0B", "#D97706"],
  ["#EC4899", "#BE185D"],
  ["#06B6D4", "#0E7490"],
  ["#8B5CF6", "#6D28D9"],
];

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

type Mode = "signin" | "signup" | "forgot";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, dispatch } = useApp();
  const { push } = useToast();

  const [mode, setMode] = React.useState<Mode>(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  // only allow app-relative redirect targets (blocks ?next=https://phishing.site)
  const rawNext = params.get("next") || "/home";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<Role>("buyer");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [previewBlocked] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.self !== window.top &&
      window.location.hostname.endsWith(".e2b.app")
  );
  const [busy, setBusy] = React.useState(false);
  const [signedUp, setSignedUp] = React.useState(false); // "check your inbox" state
  const [resetSent, setResetSent] = React.useState(false);

  const go = (to: string) => {
    router.replace(to);
  };

  /* ---------------- real (Supabase) auth ---------------- */

  const realSignIn = async () => {
    setBusy(true);
    try {
      const { data, error: err } = await signInWithEmail(email, password);
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      if (data.session) {
        const user = await loadSessionUser(data.session);
        if (user) {
          dispatch({ type: "UPSERT_USER", user });
          dispatch({ type: "LOGIN", userId: user.id });
          push({ kind: "success", title: `Welcome back, ${user.name.split(" ")[0]}! 👋` });
        }
        go(next);
      }
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : "network"));
    } finally {
      setBusy(false);
    }
  };

  const realSignUp = async () => {
    setBusy(true);
    try {
      const { data, error: err } = await signUpWithEmail({
        email, password, name, role,
        area: state.browseLocation?.city ?? "viman",
      });
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      if (data.session) {
        // provider auto-confirmed — straight in
        const user = await loadSessionUser(data.session);
        if (user) {
          dispatch({ type: "UPSERT_USER", user });
          dispatch({ type: "LOGIN", userId: user.id });
        }
        push({ kind: "success", title: `Welcome to Locora, ${name.trim().split(" ")[0]}! 🌱` });
        go(next);
      } else {
        setSignedUp(true); // confirmation email sent
      }
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : "network"));
    } finally {
      setBusy(false);
    }
  };

  const realForgot = async () => {
    setBusy(true);
    try {
      const { error: err } = await sendPasswordReset(email);
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      setResetSent(true);
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : "network"));
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- demo (mock) auth ---------------- */

  const demoSignIn = (em: string) => {
    const user = state.users.find((u) => u.email.toLowerCase() === em.toLowerCase().trim());
    if (!user) {
      setError("No account found with this email. Try one of the demo accounts below 👇");
      return;
    }
    if (user.banned) {
      setError("This account has been suspended. Contact support@locora.in");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      dispatch({ type: "LOGIN", userId: user.id });
      push({ kind: "success", title: `Welcome back, ${user.name.split(" ")[0]}! 👋` });
      go(next);
    }, 550);
  };

  const demoSignUp = () => {
    setBusy(true);
    setTimeout(() => {
      const grad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]!;
      dispatch({
        type: "SIGNUP",
        user: {
          id: uid("u"),
          name: name.trim(),
          role,
          area: state.browseLocation?.city ?? "viman",
          location: state.browseLocation ?? undefined,
          email: email.toLowerCase().trim(),
          phone: "",
          joinedAt: new Date().toISOString(),
          avatarFrom: grad[0],
          avatarTo: grad[1],
          rating: 0,
          reviewsCount: 0,
          responseMins: 15,
        },
      });
      push({ kind: "success", title: `Welcome to Locora, ${name.trim().split(" ")[0]}! 🌱` });
      go(next);
    }, 650);
  };

  /* ---------------- shared ---------------- */

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (mode === "forgot") {
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
      if (REAL_MODE) return void realForgot();
      return setError("Password reset needs the real backend — use a demo account instead.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (REAL_MODE) {
      if (mode === "signin") return void realSignIn();
      if (name.trim().length < 2) return setError("Please enter your full name.");
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      return void realSignUp();
    }
    if (password.length < 4) return setError("Password must be at least 4 characters.");
    if (mode === "signin") return demoSignIn(email);
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim()))
      return setError("An account with this email already exists. Try signing in instead.");
    demoSignUp();
  };

  const google = async () => {
    setError("");
    setNotice("");
    try {
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      const { error: err } = await signInWithGoogle();
      if (err) {
        const m = err.message.toLowerCase();
        if (m.includes("redirect") || m.includes("303") || m.includes("origin") || m.includes("callback")) {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          setError(
            `One-time setup needed for Google sign-in on this address: in Supabase → Authentication → URL Configuration, add ${origin}/** to "Redirect URLs", then tap Continue with Google again.`
          );
        } else {
          setError(friendlyAuthError(err.message));
        }
      } else if (inIframe) {
        setNotice("Google sign-in opened in a new tab — finish there, then come back here.");
      }
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : "network"));
    }
  };

  /* -------- post-signup "check your inbox" panel -------- */
  if (signedUp) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Mail size={26} />
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink-900">
          Check your inbox 📬
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">
          We sent a confirmation link to <span className="font-bold text-ink-800">{email}</span>.
          Click it to activate your account, then sign in here.
          <span className="mt-2 block text-[13px] text-ink-400">
            (Didn&apos;t get it? Peek in spam, or sign up again after a minute.)
          </span>
        </p>
        <Button variant="softBrand" size="lg" className="mt-6 w-full" onClick={() => setSignedUp(false)}>
          <ArrowLeft size={17} /> Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink-900">
          {mode === "signin" && "Welcome back"}
          {mode === "signup" && "Join your neighbourhood"}
          {mode === "forgot" && "Reset your password"}
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-500">
          {mode === "signin" && "Sign in to chat, save favourites and close deals nearby."}
          {mode === "signup" && "Free forever — no commission, no hidden fees."}
          {mode === "forgot" && "We'll email you a secure link to set a new one."}
        </p>
      </div>

      {resetSent ? (
        <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
          <p className="flex items-center gap-2 text-[14px] font-bold text-brand-800">
            <CheckCircle2 size={18} /> Reset link sent
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-brand-700/80">
            Check <span className="font-bold">{email}</span> and follow the link to choose a new
            password.
          </p>
          <button
            onClick={() => { setResetSent(false); setMode("signin"); }}
            className="mt-4 text-[13px] font-bold text-brand-700 underline underline-offset-2"
          >
            ← Back to sign in
          </button>
        </div>
      ) : (
        <>
          {/* mode tabs */}
          {mode !== "forgot" && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError("");
    setNotice(""); }}
                  className={`rounded-xl py-2.5 text-[13.5px] font-bold transition-all ${
                    mode === m ? "bg-white text-ink-900 shadow-soft" : "text-ink-400 hover:text-ink-600"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          {/* Google (real mode only) */}
          {REAL_MODE && mode !== "forgot" && (
            <>
              <button
                onClick={google}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3 text-[14.5px] font-bold text-ink-700 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:ring-stone-300 disabled:opacity-60"
              >
                <GoogleIcon /> Continue with Google
              </button>
              {previewBlocked && (
                <p className="mt-2 text-center text-[11.5px] font-medium leading-snug text-ink-400">
                  Heads-up: this embedded preview blocks external tabs, so Google can&apos;t finish
                  here — use email above. Google sign-in works on the deployed site.
                </p>
              )}
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-stone-200" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                  or with email
                </span>
                <span className="h-px flex-1 bg-stone-200" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-ink-700">Full name</span>
                <span className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
                  <User size={16} className="text-ink-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Kulkarni"
                    className="w-full bg-transparent py-3 text-[14.5px] outline-none placeholder:text-ink-300"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink-700">Email</span>
              <span className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
                <Mail size={16} className="text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-3 text-[14.5px] outline-none placeholder:text-ink-300"
                  autoComplete="email"
                />
              </span>
            </label>

            {mode !== "forgot" && (
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-[13px] font-bold text-ink-700">
                  Password
                  {REAL_MODE && mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError("");
    setNotice(""); }}
                      className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </span>
                <span className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
                  <Lock size={16} className="text-ink-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={REAL_MODE ? "At least 8 characters" : "••••••••"}
                    className="w-full bg-transparent py-3 text-[14.5px] outline-none placeholder:text-ink-300"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-ink-400 transition hover:text-ink-600"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            )}

            {mode === "signup" && (
              <>
                <div>
                  <span className="mb-1.5 block text-[13px] font-bold text-ink-700">I am a…</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["buyer", "seller", "provider"] as Role[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`rounded-xl py-2.5 text-[13px] font-bold capitalize ring-1 transition ${
                          role === r
                            ? "bg-brand-50 text-brand-700 ring-brand-300"
                            : "bg-white text-ink-500 ring-stone-200 hover:ring-stone-300"
                        }`}
                      >
                        {r === "provider" ? "Service pro" : r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setError("");
    setNotice(""); setResetSent(false); }}
                className="text-[13px] font-bold text-ink-500 hover:text-ink-800"
              >
                ← Back to sign in
              </button>
            )}

            {notice && (
              <div
                className="mt-5 flex items-start gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-[13px] font-semibold text-brand-800 ring-1 ring-brand-200"
                role="status"
              >
                <ExternalLink size={15} className="mt-0.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] font-semibold text-rose-600 ring-1 ring-rose-100" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={busy}>
              {busy
                ? "One moment…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create my account"
                    : "Send reset link"}
              {!busy && mode !== "forgot" && <ArrowRight size={17} />}
            </Button>
          </form>

          {/* demo accounts (mock mode only) */}
          {!REAL_MODE && mode === "signin" && (
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-stone-200" />
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-600">
                  <Sparkles size={12} /> Demo accounts
                </span>
                <span className="h-px flex-1 bg-stone-200" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((d) => (
                  <button
                    key={d.email}
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("demo1234");
                      setError("");
    setNotice("");
                      push({ kind: "info", title: "Credentials filled", body: "Press Sign in to continue" });
                    }}
                    className="group flex items-center gap-2.5 rounded-2xl bg-white p-3 text-left ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-200"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                      style={{ background: `linear-gradient(135deg,${d.from},${d.to})` }}
                    >
                      {d.label.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-extrabold text-ink-900">{d.label}</span>
                      <span className="block truncate text-[11px] font-semibold text-ink-400">{d.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[12px] text-ink-400">
                Any password works for demo accounts (min 4 chars).
              </p>
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-center text-[12.5px] leading-relaxed text-ink-400">
        By continuing you agree to Locora&apos;s{" "}
        <Link href="/terms" className="font-semibold text-ink-600 underline underline-offset-2">Terms</Link> and{" "}
        <Link href="/privacy" className="font-semibold text-ink-600 underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { hydrated, currentUser, dispatch } = useApp();

  React.useEffect(() => {
    if (hydrated && currentUser) router.replace("/home");
  }, [hydrated, currentUser, router]);

  /**
   * Google-in-a-new-tab flow: the OAuth round-trip completes in another tab
   * on this same origin. Cookies are shared, but no event fires here — so
   * poll for the session (and listen for the callback page's postMessage)
   * and continue straight into the app once it lands.
   */
  React.useEffect(() => {
    if (!REAL_MODE || !hydrated || currentUser) return;
    const sb = supabase();
    if (!sb) return;

    let stopped = false;
    const check = async () => {
      if (stopped) return;
      try {
        const { data } = await sb.auth.getSession();
        if (!data.session || stopped) return;
        const user = await loadSessionUser(data.session);
        if (!user || stopped) return;
        dispatch({ type: "UPSERT_USER", user });
        dispatch({ type: "LOGIN", userId: user.id });
        router.replace("/home");
      } catch {
        /* keep polling */
      }
    };

    const onMessage = (e: MessageEvent) => {
      if (e.data === "locora:auth-complete") void check();
    };
    window.addEventListener("message", onMessage);
    const interval = window.setInterval(check, 2000);
    const stopAt = window.setTimeout(() => {
      stopped = true;
      window.clearInterval(interval);
    }, 180_000);
    void check();

    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.clearTimeout(stopAt);
      window.removeEventListener("message", onMessage);
    };
  }, [REAL_MODE, hydrated, currentUser, dispatch, router]);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* brand panel */}
      <aside className="relative hidden w-[46%] max-w-xl overflow-hidden bg-ink-950 lg:block">
        <div className="bg-grid-dark absolute inset-0" aria-hidden />
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-500/25 blur-[120px]" aria-hidden />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent-500/15 blur-[100px]" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo dark />
          <div>
            <h2 className="text-balance text-[34px] font-extrabold leading-tight tracking-tight text-white">
              Welcome back to your{" "}
              <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                neighbourhood.
              </span>
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                "18,400+ live listings within a few km of you",
                "AI that writes your listings and finds your requests",
                "Chat, meet and close the deal — safely, in person",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[14.5px] font-medium text-white/70">
                  <BadgeCheck size={18} className="mt-0.5 shrink-0 text-brand-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <figure className="rounded-2xl bg-white/[.06] p-5 ring-1 ring-white/10 backdrop-blur">
            <blockquote className="text-[14px] leading-relaxed text-white/80">
              “Posted ‘need a plumber today’ at 9 AM. Locora matched one 1.5 km away, we chatted,
              and the leak was fixed by lunch.”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                style={{ background: "linear-gradient(135deg,#EC4899,#BE185D)" }}
              >
                IR
              </span>
              <span className="text-[12.5px] font-bold text-white">Ishita Rao · Kalyani Nagar</span>
            </figcaption>
          </figure>
        </div>
      </aside>

      {/* form panel */}
      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <Link
          href="/"
          className="absolute left-5 top-5 text-[13px] font-semibold text-ink-400 transition hover:text-ink-700 sm:left-10 sm:top-8"
        >
          ← Back to home
        </Link>
        {!hydrated ? (
          <div className="flex flex-col items-center gap-3 text-ink-400">
            <Spinner className="h-6 w-6" />
            <p className="text-[13px] font-semibold">Loading Locora…</p>
          </div>
        ) : (
          <React.Suspense fallback={<Spinner className="h-6 w-6 text-ink-300" />}>
            <LoginForm />
          </React.Suspense>
        )}
      </main>
    </div>
  );
}
