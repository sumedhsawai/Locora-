"use client";

/* ------------------------------------------------------------------ */
/*  Locora — authenticated app shell (navbar, bottom nav, toasts)     */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Check, ChevronDown, Globe2, Home, LogOut, MapPin, Megaphone, MessageCircle, Plus,
  Search, ShieldCheck, Sparkles, TrendingDown, User as UserIcon,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Avatar } from "@/components/ui";
import { AREAS, CITY, areaName, isPune, placeLabel } from "@/lib/geo";
import { timeAgo } from "@/lib/format";
import { useApp, useToast } from "@/lib/store";
import { REAL_MODE } from "@/lib/supabase/config";
import { signOut } from "@/lib/supabase/auth";
import type { AppNotification } from "@/lib/types";

/* ---------------------------- dropdown ----------------------------- */

function Dropdown({
  button,
  children,
  align = "right",
  widthClass = "w-72",
}: {
  button: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  widthClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((s) => !s)} className="block" aria-expanded={open}>
        {button(open)}
      </button>
      {open && (
        <div
          className={`absolute top-[calc(100%+10px)] z-50 animate-pop rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-stone-200/70 ${
            align === "right" ? "right-0" : "left-0"
          } ${widthClass}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/* ------------------------- notifications --------------------------- */

const NOTIF_STYLE: Record<AppNotification["kind"], { icon: React.ElementType; classes: string }> = {
  match: { icon: Megaphone, classes: "bg-accent-50 text-accent-600 ring-accent-100" },
  message: { icon: MessageCircle, classes: "bg-sky-50 text-sky-600 ring-sky-100" },
  price: { icon: TrendingDown, classes: "bg-brand-50 text-brand-600 ring-brand-100" },
  system: { icon: Sparkles, classes: "bg-violet-50 text-violet-600 ring-violet-100" },
  review: { icon: Sparkles, classes: "bg-accent-50 text-accent-600 ring-accent-100" },
};

function NotificationsMenu() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <Dropdown
      widthClass="w-[340px] sm:w-[380px]"
      button={() => (
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-stone-100">
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-extrabold text-white ring-2 ring-white">
              {unread}
            </span>
          )}
        </span>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <p className="text-[13px] font-extrabold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => dispatch({ type: "MARK_NOTIF_READ" })}
                className="text-[11.5px] font-bold text-brand-600 transition hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto thin-scrollbar">
            {state.notifications.length === 0 && (
              <p className="px-3 py-8 text-center text-[13px] text-ink-400">You&apos;re all caught up 🌱</p>
            )}
            {state.notifications.slice(0, 12).map((n) => {
              const st = NOTIF_STYLE[n.kind]!;
              const Icon = st.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    dispatch({ type: "MARK_NOTIF_READ", id: n.id });
                    close();
                    if (n.href) router.push(n.href);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition hover:bg-stone-50 ${
                    !n.read ? "bg-brand-50/40" : ""
                  }`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${st.classes}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-bold text-ink-900">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[12px] leading-snug text-ink-500">{n.body}</span>
                    <span className="mt-1 block text-[10.5px] font-semibold text-ink-300">{timeAgo(n.at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Dropdown>
  );
}

/* --------------------------- area picker --------------------------- */

function AreaPicker({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useApp();
  const { push } = useToast();
  const current = state.browseArea;
  const loc = state.browseLocation;
  const pune = loc ? isPune(loc) : true;

  // Outside Pune (India demo city) the neighbourhood list doesn't apply —
  // show a worldwide city chip that reopens the location gate instead.
  if (loc && !pune) {
    return (
      <button
        onClick={() => dispatch({ type: "SET_LOCATION", location: null })}
        className={
          compact
            ? "flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[12px] font-bold text-ink-700 transition hover:bg-stone-200"
            : "flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-ink-800 ring-1 ring-stone-200/80 transition hover:ring-brand-300"
        }
        title="Change city"
      >
        <MapPin size={compact ? 13 : 15} className="text-brand-600" />
        <span className="max-w-[150px] truncate">{placeLabel(loc)}</span>
      </button>
    );
  }

  return (
    <Dropdown
      align="left"
      widthClass="w-64"
      button={() => (
        <span
          className={
            compact
              ? "flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[12px] font-bold text-ink-700"
              : "flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-ink-800 ring-1 ring-stone-200/80 transition hover:ring-stone-300"
          }
        >
          <MapPin size={compact ? 13 : 15} className="text-brand-600" />
          <span className="max-w-[130px] truncate">{current === "all" ? `All of ${CITY}` : areaName(current)}</span>
          <ChevronDown size={14} className="text-ink-400" />
        </span>
      )}
    >
      {(close) => (
        <div>
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
            Browse area
          </p>
          <div className="max-h-[320px] overflow-y-auto thin-scrollbar">
            {[{ id: "all", name: `All of ${CITY}` }, ...AREAS].map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  dispatch({ type: "SET_BROWSE_AREA", area: a.id });
                  if (a.id !== current)
                    push({ kind: "info", title: a.id === "all" ? `Showing all of ${CITY}` : `Now browsing near ${a.name}` });
                  close();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink-700 transition hover:bg-stone-50"
              >
                {a.name}
                {current === a.id && <Check size={15} className="text-brand-600" />}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              dispatch({ type: "SET_LOCATION", location: null });
              close();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-brand-700 transition hover:bg-brand-50"
          >
            <Globe2 size={15} /> Change city / country
          </button>
        </div>
      )}
    </Dropdown>
  );
}

/* ---------------------------- avatar menu -------------------------- */

function AvatarMenu() {
  const { currentUser, dispatch } = useApp();
  const router = useRouter();
  if (!currentUser) return null;

  return (
    <Dropdown
      button={() => (
        <span className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-stone-100">
          <Avatar user={currentUser} size="md" ring={false} />
          <ChevronDown size={14} className="hidden text-ink-400 sm:block" />
        </span>
      )}
    >
      {(close) => (
        <div>
          <div className="border-b border-stone-100 px-3.5 pb-3.5 pt-3">
            <p className="text-[13.5px] font-extrabold text-ink-900">{currentUser.name}</p>
            <p className="truncate text-[12px] text-ink-400">{currentUser.email}</p>
          </div>
          <div className="pt-1.5">
            {[
              { href: "/profile", icon: UserIcon, label: "My profile & listings" },
              { href: "/requests", icon: Megaphone, label: "I'm Looking For" },
              ...(currentUser.role === "admin"
                ? [{ href: "/admin", icon: ShieldCheck, label: "Admin dashboard" }]
                : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-700 transition hover:bg-stone-50"
              >
                <item.icon size={16} className="text-ink-400" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={async () => {
                dispatch({ type: "LOGOUT" });
                router.replace("/");
                // in real mode also clear the Supabase session (cookie + server)
                if (REAL_MODE) {
                  try {
                    await signOut();
                  } catch {
                    /* session already gone */
                  }
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}

/* ----------------------------- navbar ------------------------------ */

export function AppNavbar() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo href="/home" />

        {/* desktop search */}
        <button
          onClick={() => router.push("/search")}
          className="ml-6 hidden h-10 max-w-xs flex-1 items-center gap-2.5 rounded-full bg-stone-100 px-4 text-left text-[13.5px] font-medium text-ink-400 transition hover:bg-stone-200/70 lg:flex"
        >
          <Search size={16} />
          Search “used iPhone under 40k”…
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
            <Sparkles size={10} />
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <span className="hidden lg:block">
            <AreaPicker />
          </span>
          <span className="lg:hidden">
            <AreaPicker compact />
          </span>
          <NotificationsMenu />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}

/* ---------------------------- bottom nav --------------------------- */

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, currentUser } = useApp();

  const unreadChats = currentUser
    ? state.conversations.filter((c) => c.unreadFor.includes(currentUser.id)).length
    : 0;

  const items = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/chat", icon: MessageCircle, label: "Chats", badge: unreadChats },
    { href: "/profile", icon: UserIcon, label: "Profile" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-white/95 backdrop-blur-xl safe-bottom lg:hidden" aria-label="Primary">
      <div className="grid grid-cols-5 items-end px-2 pb-1.5 pt-1.5">
        {items.slice(0, 2).map((item) => (
          <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} onClick={() => router.push(item.href)} />
        ))}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/create")}
            aria-label="Post a listing or request"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow transition active:scale-90"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>
        {items.slice(2).map((item) => (
          <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} onClick={() => router.push(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  icon: Icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 transition ${
        active ? "text-brand-700" : "text-ink-400 hover:text-ink-600"
      }`}
    >
      <Icon size={21} strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[10px] font-bold ${active ? "text-brand-700" : "text-ink-400"}`}>{label}</span>
      {!!badge && (
        <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ---------------------------- toast viewport ----------------------- */

export function ToastViewport() {
  const { toasts } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[90] flex flex-col items-center gap-2 lg:bottom-6 lg:items-end lg:pr-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl bg-ink-950/95 px-4 py-3.5 text-white shadow-lift backdrop-blur"
          role="status"
        >
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              t.kind === "error" ? "bg-rose-500/20 text-rose-300" : t.kind === "info" ? "bg-sky-500/20 text-sky-300" : "bg-accent-500/20 text-accent-300"
            }`}
          >
            {t.kind === "error" ? "!" : t.kind === "info" ? "i" : "✓"}
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[12px] leading-snug text-white/60">{t.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
