import Link from "next/link";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Locora — brand                                                    */
/*  The mark is the user-supplied logo (public/images/logo.png),       */
/*  shown as a rounded app-icon tile.                                  */
/* ------------------------------------------------------------------ */

export function LogoMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/images/logo.png"
      alt="Locora logo"
      width={size}
      height={size}
      priority
      className={`shrink-0 rounded-[28%] object-cover shadow-sm ring-1 ring-black/[.06] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({
  size = 34,
  dark = false,
  href = "/",
}: {
  size?: number;
  dark?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="Locora home">
      <LogoMark
        size={size}
        className="drop-shadow-sm transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:drop-shadow-lg"
      />
      <span
        className={`text-[21px] font-extrabold tracking-tight ${dark ? "text-white" : "text-ink-900"}`}
      >
        Locora
        <span className="text-brand-500">.</span>
      </span>
    </Link>
  );
}

/** Small "AI" pill used across the app to badge AI-powered things. */
export function AiPill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider ${
        dark ? "bg-white/10 text-brand-200 ring-1 ring-white/15" : "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
        <path
          d="M6 1l1.1 2.9L10 5l-2.9 1.1L6 9 4.9 6.1 2 5l2.9-1.1L6 1z"
          fill="currentColor"
        />
      </svg>
      {children}
    </span>
  );
}
