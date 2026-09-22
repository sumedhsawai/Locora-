"use client";

/* ------------------------------------------------------------------ */
/*  Locora — UI primitives                                            */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { FlaskConical, Star, X } from "lucide-react";
import { initials } from "@/lib/format";

/* ------------------------------ Button ---------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "danger" | "softBrand";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 select-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-lift",
  secondary: "bg-white text-ink-800 ring-1 ring-stone-200/90 hover:ring-stone-300 hover:bg-stone-50 shadow-soft",
  ghost: "text-ink-700 hover:bg-stone-100",
  dark: "bg-ink-900 text-white hover:bg-ink-800 shadow-soft hover:shadow-lift",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-soft",
  softBrand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ------------------------------ Avatar ---------------------------- */

const avatarSizes = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, "2xl": 80 } as const;

export function Avatar({
  user,
  size = "md",
  ring = true,
  className = "",
}: {
  user: { name: string; avatarFrom: string; avatarTo: string; verified?: boolean };
  size?: keyof typeof avatarSizes;
  ring?: boolean;
  className?: string;
}) {
  const px = avatarSizes[size];
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: px, height: px }}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full font-bold text-white ${
          ring ? "ring-2 ring-white" : ""
        }`}
        style={{
          background: `linear-gradient(135deg, ${user.avatarFrom}, ${user.avatarTo})`,
          fontSize: px * 0.36,
        }}
      >
        {initials(user.name)}
      </span>
    </span>
  );
}

/* ------------------------------ Chips ----------------------------- */

export function Chip({
  active = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-150 ${
        active
          ? "bg-ink-900 text-white shadow-soft"
          : "bg-white text-ink-700 ring-1 ring-stone-200/80 hover:ring-stone-300 hover:bg-stone-50"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  tone = "stone",
  className = "",
  title,
  children,
}: {
  tone?: "stone" | "brand" | "amber" | "rose" | "sky" | "violet" | "dark";
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600 ring-stone-200/70",
    brand: "bg-brand-50 text-brand-700 ring-brand-200/70",
    amber: "bg-accent-50 text-accent-700 ring-accent-200/70",
    rose: "bg-rose-50 text-rose-700 ring-rose-200/70",
    sky: "bg-sky-50 text-sky-700 ring-sky-200/70",
    violet: "bg-violet-50 text-violet-700 ring-violet-200/70",
    dark: "bg-ink-900/85 text-white backdrop-blur-sm",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------------------- DemoBadge ---------------------------- */

/**
 * Marks sample/demo content so visitors are never misled into thinking
 * a seeded listing, service, request or account is a real offer/person.
 */
export function DemoBadge({
  className = "",
  label = "Demo",
  title = "Sample data included to show how Locora works — not a real listing, service or person.",
}: {
  className?: string;
  label?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border border-dashed border-amber-400/90 bg-amber-100/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 ${className}`}
    >
      <FlaskConical size={10} className="shrink-0" />
      {label}
    </span>
  );
}

/* ------------------------------ Rating ---------------------------- */

export function RatingStars({ value, size = 14, showValue = true }: { value: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative inline-flex">
        <span className="flex gap-0.5 text-stone-300">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} strokeWidth={0} fill="currentColor" />
          ))}
        </span>
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
          <span className="flex gap-0.5 text-accent-400">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={size} strokeWidth={0} fill="currentColor" />
            ))}
          </span>
        </span>
      </span>
      {showValue && <span className="text-[13px] font-bold text-ink-800">{value.toFixed(1)}</span>}
    </span>
  );
}

/* ---------------------------- Skeletons --------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer-bg animate-shimmer rounded-lg ${className}`} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <Skeleton className="h-32 rounded-none" />
      <div className="space-y-2.5 p-4 pt-6">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  );
}

/* ---------------------------- EmptyState -------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300/80 bg-white/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------ Modal ----------------------------- */

export function Modal({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full max-w-md animate-slide-up rounded-t-3xl bg-white p-6 shadow-lift sm:animate-pop sm:rounded-3xl ${className}`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-stone-100 hover:text-ink-700"
        >
          <X size={17} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* --------------------------- TypingDots --------------------------- */

export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/* -------------------------- SectionHeading ------------------------ */

export function SectionHeading({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[17px] font-extrabold tracking-tight text-ink-900 sm:text-xl">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
