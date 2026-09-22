import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found · Locora" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
          <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
            <path
              d="M31 15c-6.4 0-11.5 5.1-11.5 11.5 0 8.3 9.7 19.7 10.4 20.5.6.7 1.7.7 2.3 0 .7-.8 10.3-12.2 10.3-20.5C42.5 20.1 37.4 15 31 15z"
              fill="#ffffff"
            />
            <circle cx="31" cy="26.5" r="4.4" fill="#0163DD" />
            <path
              d="M46.5 9.5l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z"
              fill="#13CA9E"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold tracking-widest text-brand-600">404 · OFF THE MAP</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
          This page packed up and moved
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          The link may be broken, or the listing was sold or removed by its owner. Let&apos;s get you
          back to the good stuff nearby.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/home"
            className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-lift"
          >
            Browse the marketplace
          </Link>
          <Link
            href="/"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-100"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
