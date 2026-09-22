"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, BadgeCheck, Ban, CheckCircle2, ChevronRight, Eye, Flag,
  LayoutDashboard, Megaphone, Package, Search, ShieldAlert, ShieldCheck, Sparkles, Trash2, UserRound, Users, Wrench,
} from "lucide-react";
import { Avatar, Badge, Button, DemoBadge, Skeleton } from "@/components/ui";
import { productCategoryLabel, serviceCategoryLabel } from "@/lib/categories";
import { inr, timeAgo } from "@/lib/format";
import { placeOf } from "@/lib/geo";
import { useApp, useToast } from "@/lib/store";
import type { Report } from "@/lib/types";

/* ---------------------------- stat card ---------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "brand" | "amber" | "rose" | "sky" | "violet";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 ring-brand-100",
    amber: "bg-accent-50 text-accent-600 ring-accent-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon size={16} />
        </span>
        <p className="text-[12px] font-extrabold uppercase tracking-wide text-ink-400">{label}</p>
      </div>
      <p className="mt-2.5 text-[24px] font-extrabold tracking-tight text-ink-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] font-semibold text-ink-400">{sub}</p>}
    </div>
  );
}

/* --------------------------- report card --------------------------- */

function ReportCard({ report }: { report: Report }) {
  const { state, dispatch } = useApp();
  const { push } = useToast();
  const [busy, setBusy] = React.useState(false);

  const setStatus = (status: Report["status"], label: string) => {
    dispatch({ type: "SET_REPORT_STATUS", id: report.id, status });
    push({ kind: "success", title: label });
  };

  const removeTarget = () => {
    setBusy(true);
    if (report.targetType === "product") {
      dispatch({ type: "REMOVE_PRODUCT", id: report.targetId });
    } else if (report.targetType === "service") {
      dispatch({ type: "REMOVE_SERVICE", id: report.targetId });
    }
    dispatch({ type: "SET_REPORT_STATUS", id: report.id, status: "resolved" });
    setBusy(false);
    push({ kind: "success", title: "Listing removed & report resolved" });
  };

  const statusTone = report.status === "open" ? "rose" : report.status === "reviewing" ? "amber" : "brand";
  const statusLabel = report.status === "open" ? "Open" : report.status === "reviewing" ? "Reviewing" : "Resolved";
  const isAi = report.by === "Locora AI";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone as "rose" | "amber" | "brand"}>{statusLabel}</Badge>
        <Badge tone={isAi ? "violet" : "stone"}>
          {isAi ? <Sparkles size={10} /> : <Flag size={10} />} {report.by}
        </Badge>
        <span className="ml-auto text-[11px] font-semibold text-ink-300">{timeAgo(report.createdAt)}</span>
      </div>
      <p className="mt-2.5 text-[14px] font-extrabold leading-snug text-ink-900">{report.reason}</p>
      <p className="mt-0.5 text-[12.5px] font-semibold text-ink-500">{report.targetLabel}</p>
      <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-500">{report.details}</p>
      {report.status !== "resolved" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(report.targetType === "product" || report.targetType === "service") && (
            <Button size="sm" variant="danger" loading={busy} onClick={removeTarget}>
              <Trash2 size={13} /> Remove listing
            </Button>
          )}
          {report.status === "open" && (
            <Button size="sm" variant="secondary" onClick={() => setStatus("reviewing", "Marked as reviewing")}>
              Reviewing
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setStatus("resolved", "Report dismissed")}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ page ------------------------------- */

export default function AdminPage() {
  const router = useRouter();
  const { state, hydrated, currentUser, dispatch } = useApp();
  const { push } = useToast();
  const [userQuery, setUserQuery] = React.useState("");

  const isAdmin = currentUser?.role === "admin";

  React.useEffect(() => {
    if (hydrated && !isAdmin) {
      push({ kind: "error", title: "Admins only", body: "Sign in with the admin demo account to view this page" });
      router.replace("/home");
    }
  }, [hydrated, isAdmin, router, push]);

  if (!hydrated || !isAdmin) return <Skeleton className="mx-auto mt-10 h-96 max-w-5xl rounded-3xl" />;

  const users = state.users;
  const activeProducts = state.products.filter((p) => p.status === "active");
  const flagged = state.products.filter((p) => p.flagged);
  const openReports = state.reports.filter((r) => r.status !== "resolved");
  const openRequests = state.requests.filter((r) => r.status === "open");
  const newThisMonth = users.filter((u) => Date.now() - +new Date(u.joinedAt) < 30 * 864e5).length;

  const filteredUsers = users
    .filter((u) => u.role !== "admin")
    .filter((u) => u.name.toLowerCase().includes(userQuery.toLowerCase()) || u.email.includes(userQuery.toLowerCase()))
    .sort((a, b) => a.joinedAt < b.joinedAt ? 1 : -1);

  const categoryCounts = Object.entries(
    state.products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = categoryCounts[0]?.[1] ?? 1;

  const areaCounts = Object.entries(
    [...state.products, ...state.services].reduce<Record<string, number>>((acc, x) => {
      const loc = placeOf(x);
      const label = loc.country ? `${loc.city}, ${loc.country}` : loc.city;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxArea = areaCounts[0]?.[1] ?? 1;

  return (
    <div className="space-y-7">
      {/* header */}
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[27px]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-brand-300">
              <LayoutDashboard size={18} />
            </span>
            Admin dashboard
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-500">Locora Pune · moderation, safety &amp; marketplace health</p>
        </div>
        <Badge tone="brand"><Activity size={10} /> live demo data</Badge>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users} label="Users" value={users.length} sub={`+${newThisMonth} this month`} tone="sky" />
        <StatCard icon={Package} label="Listings" value={activeProducts.length} sub={`${state.products.length - activeProducts.length} sold/removed`} />
        <StatCard icon={Wrench} label="Services" value={state.services.length} sub={`${state.services.filter((s) => s.verified).length} verified`} tone="violet" />
        <StatCard icon={Megaphone} label="Requests" value={openRequests.length} sub="I'm Looking For · open" tone="amber" />
        <StatCard icon={Flag} label="Reports" value={openReports.length} sub={`${state.reports.length - openReports.length} resolved`} tone="rose" />
        <StatCard icon={ShieldAlert} label="Scam flags" value={flagged.length} sub="AI-flagged listings" tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------------- left column ---------------- */}
        <div className="min-w-0 space-y-6">
          {/* reports queue */}
          <section>
            <h2 className="mb-3.5 flex items-center gap-2 text-[16px] font-extrabold tracking-tight text-ink-900">
              <Flag size={17} className="text-rose-500" /> Report queue
            </h2>
            <div className="space-y-3">
              {state.reports.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          </section>

          {/* users */}
          <section>
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[16px] font-extrabold tracking-tight text-ink-900">
                <Users size={17} className="text-sky-500" /> Users
              </h2>
              <span className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12.5px] ring-1 ring-stone-200/80">
                <Search size={13} className="text-ink-400" />
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search users…"
                  className="w-32 bg-transparent font-semibold outline-none placeholder:font-normal sm:w-44"
                />
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-stone-100/70">
              <div className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar user={u} size="md" ring={false} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[13.5px] font-extrabold text-ink-900">
                        <span className="truncate">{u.name}</span>
                        {u.verified && <BadgeCheck size={13} className="shrink-0 text-brand-600" />}
                        {u.isDemo && <DemoBadge />}
                        {u.banned && <Badge tone="rose">Banned</Badge>}
                      </p>
                      <p className="truncate text-[11.5px] font-medium text-ink-400">
                        {u.email} · {placeOf(u).city} · {u.role === "provider" ? "service pro" : u.role}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {u.rating ? (
                        <span className="hidden text-[11.5px] font-bold text-ink-500 sm:block">★ {u.rating.toFixed(1)}</span>
                      ) : null}
                      <button
                        onClick={() => {
                          dispatch({ type: "TOGGLE_BAN", userId: u.id });
                          push({
                            kind: u.banned ? "success" : "info",
                            title: u.banned ? `${u.name.split(" ")[0]} unbanned` : `${u.name.split(" ")[0]} banned`,
                            body: u.banned ? undefined : "Their listings are hidden from search & feeds",
                          });
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                          u.banned
                            ? "bg-brand-50 text-brand-600 ring-1 ring-brand-100 hover:bg-brand-100"
                            : "bg-stone-50 text-ink-400 ring-1 ring-stone-200 hover:bg-rose-50 hover:text-rose-600"
                        }`}
                        title={u.banned ? "Unban user" : "Ban user"}
                      >
                        {u.banned ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="px-4 py-8 text-center text-[13px] text-ink-400">No users match “{userQuery}”</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ---------------- right column ---------------- */}
        <aside className="space-y-6">
          {/* scam queue */}
          <section className="rounded-3xl bg-ink-950 p-5 text-white">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
              <ShieldAlert size={16} className="text-rose-400" /> AI scam queue
            </h2>
            <p className="mt-1 text-[12px] text-white/50">
              Listings flagged by Locora AI — remove them or release back to search.
            </p>
            <div className="mt-4 space-y-3">
              {flagged.length === 0 && (
                <p className="rounded-2xl bg-white/[.06] px-4 py-3.5 text-[12.5px] font-semibold text-white/60 ring-1 ring-white/10">
                  Queue is clear — no flagged listings right now 🛡️
                </p>
              )}
              {flagged.map((p) => {
                const seller = state.users.find((u) => u.id === p.sellerId);
                return (
                  <div key={p.id} className="rounded-2xl bg-white/[.06] p-3.5 ring-1 ring-white/10">
                    <p className="text-[13px] font-bold leading-snug text-white">{p.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-white/50">
                      {inr(p.price)} · {seller?.name} · risk {p.flagged?.score}/100
                    </p>
                    <ul className="mt-2 space-y-0.5">
                      {p.flagged?.reasons.slice(0, 2).map((r) => (
                        <li key={r} className="text-[11px] leading-snug text-rose-300/90">• {r}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          dispatch({ type: "REMOVE_PRODUCT", id: p.id });
                          push({ kind: "success", title: "Scam listing removed" });
                        }}
                      >
                        <Trash2 size={12} /> Remove
                      </Button>
                      {seller && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="!text-white/70 hover:!bg-white/10"
                          onClick={() => {
                            dispatch({ type: "TOGGLE_BAN", userId: seller.id });
                            dispatch({ type: "REMOVE_PRODUCT", id: p.id });
                            push({ kind: "success", title: `${seller.name.split(" ")[0]} banned & listing removed` });
                          }}
                        >
                          <Ban size={12} /> Ban seller
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* category distribution */}
          <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
              <Package size={15} className="text-brand-600" /> Listings by category
            </h2>
            <div className="mt-4 space-y-2.5">
              {categoryCounts.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-[12px] font-bold text-ink-600">
                    <span>{productCategoryLabel(cat)}</span>
                    <span className="text-ink-400">{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* top areas */}
          <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
              <Activity size={15} className="text-accent-500" /> Busiest cities
            </h2>
            <div className="mt-4 space-y-2.5">
              {areaCounts.map(([area, count], i) => (
                <div key={area} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${i === 0 ? "bg-accent-100 text-accent-700" : "bg-stone-100 text-ink-500"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13px] font-bold text-ink-700">{area}</span>
                  <span className="text-[12px] font-bold text-ink-400">{count} listings</span>
                </div>
              ))}
            </div>
          </section>

          {/* moderation log note */}
          <section className="rounded-3xl bg-brand-50/50 p-5 ring-1 ring-brand-100">
            <h3 className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink-900">
              <ShieldCheck size={15} className="text-brand-600" /> Safety posture
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] font-medium leading-relaxed text-ink-600">
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand-600" /> Every new listing passes the AI scam shield on publish</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand-600" /> Flagged ads are hidden from search until reviewed</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand-600" /> Banned users&apos; listings disappear from all feeds instantly</li>
              <li className="flex items-start gap-2"><Eye size={13} className="mt-0.5 shrink-0 text-brand-600" /> Chat reports involving advance-payment requests are prioritised</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/requests", icon: Megaphone, label: "Review request board" },
          { href: "/search", icon: Search, label: "Search as a user" },
          { href: "/profile", icon: UserRound, label: "My admin profile" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70 transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-ink-600 ring-1 ring-stone-200">
              <l.icon size={17} />
            </span>
            <span className="flex-1 text-[13.5px] font-extrabold text-ink-800">{l.label}</span>
            <ChevronRight size={16} className="text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}
