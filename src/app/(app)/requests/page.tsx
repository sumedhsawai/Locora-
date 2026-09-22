"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, CheckCircle2, ChevronDown, IndianRupee, MapPin, Megaphone, MessageCircle,
  Sparkles, Trash2, Zap,
} from "lucide-react";
import { Avatar, Badge, Button, Modal, Skeleton, TypingDots } from "@/components/ui";
import { matchRequest } from "@/lib/ai";
import { REAL_MODE } from "@/lib/supabase/config";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, serviceCategoryEmoji, productCategoryEmoji } from "@/lib/categories";
import { inr, km as kmFmt, timeAgo } from "@/lib/format";
import { AREAS, areaName, distanceBetween, distanceBetweenAreas } from "@/lib/geo";
import { uid, useApp, useToast } from "@/lib/store";
import type { BuyRequest, NeedBy, RequestMatch } from "@/lib/types";

const NEED_BY: { id: NeedBy; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this-week", label: "This week" },
  { id: "weekend", label: "This weekend" },
  { id: "flexible", label: "Flexible" },
];

const NEED_BY_LABEL: Record<NeedBy, string> = {
  today: "Needed today",
  tomorrow: "Needed tomorrow",
  "this-week": "This week",
  weekend: "This weekend",
  flexible: "Flexible timing",
};

const catEmoji = (c: string) =>
  SERVICE_CATEGORIES.find((x) => x.id === c)?.emoji ?? PRODUCT_CATEGORIES.find((x) => x.id === c)?.emoji ?? "🔍";

/* --------------------------- composer ------------------------------ */

function Composer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, currentUser, dispatch, notify } = useApp();
  const { push } = useToast();
  const [text, setText] = React.useState("");  const [category, setCategory] = React.useState<string>("");
  const [budget, setBudget] = React.useState("");
  const [area, setArea] = React.useState(currentUser?.area ?? "viman");
  const [needBy, setNeedBy] = React.useState<NeedBy>("this-week");

  const post = () => {
    if (!currentUser) return;
    if (text.trim().length < 10) {
      push({ kind: "error", title: "Describe what you need in a few more words" });
      return;
    }
    const id = REAL_MODE && typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : uid("q");
    const request: BuyRequest = {
      id,
      buyerId: currentUser.id,
      text: text.trim(),
      category: (category || "general") as BuyRequest["category"],
      area,
      budgetMax: parseInt(budget, 10) || undefined,
      needBy,
      status: "open",
      createdAt: new Date().toISOString(),
      watching: false,
      matches: [],
    };
    dispatch({ type: "ADD_REQUEST", request });
    onClose();
    setText("");
    setCategory("");
    setBudget("");
    push({ kind: "success", title: "Request posted ✨", body: "Locora AI is matching nearby locals now" });
    notify({
      kind: "match",
      title: "AI is on it 🔍",
      body: `Matching providers near ${areaName(area)} for “${request.text.slice(0, 42)}…”`,
      href: "/requests",
    });

    // simulated AI matching pass
    setTimeout(() => {
      const { matches, watched } = matchRequest(request, state.services, state.products, state.users);
      dispatch({ type: "SET_REQUEST_MATCHES", requestId: id, matches });
      if (watched && matches.length === 0) {
        dispatch({ type: "UPDATE_REQUEST", id, patch: { watching: true } });
        notify({
          kind: "match",
          title: "No matches yet — AI is watching",
          body: "We'll ping you the moment a matching listing or provider appears nearby",
          href: "/requests",
        });
      } else {
        notify({
          kind: "match",
          title: `AI found ${matches.length} match${matches.length > 1 ? "es" : ""} 🎯`,
          body: `Top match: ${matches[0]?.reason ?? ""}`,
          href: "/requests",
        });
      }
    }, 1800);
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100">
          <Megaphone size={17} />
        </span>
        <div>
          <h2 className="text-[17px] font-extrabold text-ink-900">I&apos;m Looking For…</h2>
          <p className="text-[12px] text-ink-400">One request · AI notifies the right people nearby</p>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        autoFocus
        placeholder="e.g. Need a plumber today — kitchen sink is blocked"
        className="mt-4 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 text-[14px] outline-none ring-1 ring-stone-200 placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
      />
      <p className="mb-1.5 mt-4 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Category</p>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto thin-scrollbar">
        {[...SERVICE_CATEGORIES.slice(0, 8), ...PRODUCT_CATEGORIES.slice(0, 6)].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(category === c.id ? "" : c.id)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 transition ${
              category === c.id ? "bg-ink-950 text-white ring-ink-950" : "bg-stone-50 text-ink-600 ring-stone-200 hover:ring-stone-300"
            }`}
          >
            {c.emoji} {c.label.replace(" & Appliance Repair", " Repair").replace("Cooks & Tiffins", "Cooks")}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Budget (optional)</span>
          <span className="flex items-center gap-1.5 rounded-xl bg-stone-50 px-3.5 py-2.5 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-brand-500">
            <IndianRupee size={14} className="text-ink-400" />
            <input
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="600"
              className="w-full bg-transparent text-[14px] font-bold outline-none"
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Area</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full appearance-none rounded-xl bg-stone-50 px-3 py-3 text-[13.5px] font-semibold outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
          >
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-1.5 mt-4 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Needed by</p>
      <div className="flex flex-wrap gap-1.5">
        {NEED_BY.map((n) => (
          <button
            key={n.id}
            onClick={() => setNeedBy(n.id)}
            className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ring-1 transition ${
              needBy === n.id ? "bg-brand-50 text-brand-700 ring-brand-300" : "bg-stone-50 text-ink-500 ring-stone-200"
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>
      <Button size="lg" className="mt-5 w-full" onClick={post}>
        <Sparkles size={17} /> Post request &amp; let AI match
      </Button>
    </Modal>
  );
}

/* --------------------------- match row ----------------------------- */

function MatchRow({
  match,
  onChat,
  onView,
}: {
  match: RequestMatch;
  onChat: () => void;
  onView?: () => void;
}) {
  const { state } = useApp();
  const user = state.users.find((u) => u.id === match.userId);
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-stone-100/70">
      <Avatar user={user} size="md" ring={false} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[13.5px] font-extrabold text-ink-900">
          <span className="truncate">{user.name}</span>
          {user.verified && <BadgeCheck size={13} className="shrink-0 text-brand-600" />}
          <span className="shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-extrabold text-brand-700 ring-1 ring-brand-100">
            {match.score}%
          </span>
        </p>
        <p className="mt-0.5 truncate text-[11.5px] font-medium text-ink-500">{match.reason}</p>
        <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${match.score}%` }} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Button size="sm" onClick={onChat}><MessageCircle size={13} /> Chat</Button>
        {onView && (
          <Button size="sm" variant="ghost" onClick={onView}>View</Button>
        )}
      </div>
    </div>
  );
}

/* --------------------------- request card -------------------------- */

function RequestCardDetailed({
  request,
  matching,
}: {
  request: BuyRequest;
  matching: boolean;
}) {
  const router = useRouter();
  const { state, currentUser, dispatch, startConversation } = useApp();
  const { push } = useToast();
  const buyer = state.users.find((u) => u.id === request.buyerId);
  const mine = currentUser?.id === request.buyerId;
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? request.matches : request.matches.slice(0, 2);

  const chatWith = (m: RequestMatch) => {
    if (!currentUser) return;
    const product = m.productId ? state.products.find((p) => p.id === m.productId) : undefined;
    const cid = startConversation(
      m.userId,
      product
        ? { type: "product", id: product.id, title: product.title, image: product.images[0], price: product.price }
        : {
            type: "request",
            id: request.id,
            title: `Request · ${request.text.slice(0, 40)}${request.text.length > 40 ? "…" : ""}`,
          }
    );
    router.push(`/chat?c=${encodeURIComponent(cid)}`);
  };

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-stone-100/70">
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          {buyer ? <Avatar user={buyer} size="lg" ring={false} /> : <span className="h-12 w-12 rounded-full bg-stone-200" />}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-[13.5px] font-extrabold text-ink-900">
              {buyer?.name ?? "Neighbour"}
              {mine && <Badge tone="brand">You</Badge>}
              {request.status === "fulfilled" && <Badge tone="stone"><CheckCircle2 size={10} /> Fulfilled</Badge>}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] font-semibold text-ink-400">
              <MapPin size={11} /> {areaName(request.area)} · {timeAgo(request.createdAt)}
            </p>
          </div>
          {request.needBy === "today" && request.status === "open" && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10.5px] font-extrabold text-rose-600 ring-1 ring-rose-200">
              <Zap size={10} /> Today
            </span>
          )}
        </div>

        <p className="mt-3.5 text-[15.5px] font-semibold leading-snug text-ink-800">“{request.text}”</p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-ink-600">{catEmoji(request.category)} {request.category.replace("-", " ")}</span>
          {request.budgetMax && <span className="rounded-full bg-stone-100 px-2.5 py-1 text-ink-600">Budget {inr(request.budgetMax)}</span>}
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-ink-400">{NEED_BY_LABEL[request.needBy]}</span>
        </div>

        {mine && (
          <div className="mt-4 flex gap-2">
            {request.status === "open" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  dispatch({ type: "UPDATE_REQUEST", id: request.id, patch: { status: "fulfilled" } });
                  push({ kind: "success", title: "Marked as fulfilled 🎉" });
                }}
              >
                <CheckCircle2 size={14} /> Mark fulfilled
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "UPDATE_REQUEST", id: request.id, patch: { status: "open" } })}>
                Reopen
              </Button>
            )}
            <Button size="sm" variant="ghost" className="!text-rose-500 hover:!bg-rose-50" onClick={() => dispatch({ type: "DELETE_REQUEST", id: request.id })}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* matches */}
      <div className="border-t border-stone-100 bg-stone-50/60 p-5">
        {matching ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-card">
            <Sparkles size={16} className="animate-pulse text-accent-500" />
            <p className="text-[13px] font-semibold text-ink-500">
              Locora AI is ranking nearby sellers &amp; providers <TypingDots className="text-ink-300" />
            </p>
          </div>
        ) : request.matches.length > 0 ? (
          <>
            <p className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">
              <Sparkles size={12} className="text-accent-500" />
              {request.matches.length} AI match{request.matches.length > 1 ? "es" : ""} · ranked by distance, rating &amp; response
            </p>
            <div className="space-y-2.5">
              {shown.map((m) => (
                <MatchRow
                  key={m.userId + (m.serviceId ?? m.productId ?? "")}
                  match={m}
                  onChat={() => chatWith(m)}
                  onView={
                    m.productId
                      ? () => router.push(`/product/${m.productId}`)
                      : m.serviceId
                        ? () => router.push(`/service/${m.serviceId}`)
                        : undefined
                  }
                />
              ))}
            </div>
            {request.matches.length > 2 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-700 transition hover:text-brand-800"
              >
                {expanded ? "Show less" : `Show all ${request.matches.length} matches`}
                <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-accent-50/70 px-4 py-3.5 ring-1 ring-accent-100">
            <Sparkles size={15} className="shrink-0 text-accent-600" />
            <p className="text-[12.5px] font-semibold leading-snug text-accent-800">
              No confident matches yet — AI is watching every new listing and provider nearby and will notify{" "}
              {mine ? "you" : buyer?.name.split(" ")[0]} automatically.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------ page ------------------------------- */

export default function RequestsPage() {
  const { state, hydrated, currentUser } = useApp();
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "near" | "mine">("all");
  const [matchingIds, setMatchingIds] = React.useState<Set<string>>(new Set());

  const myArea = currentUser?.area ?? "viman";

  // track freshly-posted (matchless) requests as "matching"
  React.useEffect(() => {
    const fresh = state.requests.filter((r) => r.matches.length === 0 && !r.watching);
    // requests created in the last 10 seconds are treated as mid-matching
    const now = Date.now();
    const inFlight = fresh.filter((r) => now - +new Date(r.createdAt) < 10000).map((r) => r.id);
    setMatchingIds(new Set(inFlight));
  }, [state.requests]);

  const requests = React.useMemo(() => {
    let list = [...state.requests];
    if (filter === "mine" && currentUser) list = list.filter((r) => r.buyerId === currentUser.id);
    if (filter === "near")
      list = list.filter((r) =>
        distanceBetween({ area: myArea, location: currentUser?.location }, r) <= 8
      );
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [state.requests, filter, currentUser, myArea]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[27px]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-accent-300">
              <Megaphone size={18} />
            </span>
            I&apos;m Looking For
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-500">
            Post what you need — Locora AI matches, ranks and notifies the right people nearby.
          </p>
        </div>
        <Button onClick={() => setComposerOpen(true)}>
          <Megaphone size={16} /> Post a request
        </Button>
      </div>

      {/* filter chips */}
      <div className="flex gap-2">
        {([
          { id: "all", label: "All requests" },
          { id: "near", label: `Near me (≤8 km)` },
          { id: "mine", label: "My requests" },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ring-1 transition ${
              filter === f.id ? "bg-ink-950 text-white ring-ink-950" : "bg-white text-ink-600 ring-stone-200/80 hover:ring-stone-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!hydrated ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/60 px-6 py-14 text-center">
          <p className="text-4xl">🔍</p>
          <h3 className="mt-3 text-base font-extrabold text-ink-900">
            {filter === "mine" ? "You haven't posted any requests yet" : "No requests here right now"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-500">
            Be the first — describe what you need and let AI find sellers and service providers near you.
          </p>
          <Button className="mt-5" onClick={() => setComposerOpen(true)}>Post what you need</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="animate-fade-up">
              <RequestCardDetailed request={r} matching={matchingIds.has(r.id)} />
            </div>
          ))}
        </div>
      )}

      {/* how it works */}
      <div className="rounded-3xl bg-ink-950 p-6 text-white">
        <p className="flex items-center gap-2 text-[15px] font-extrabold">
          <Sparkles size={17} className="text-brand-300" /> How AI matching works
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", t: "You post", d: "Plain words + budget + urgency. No forms, no categories to dig through." },
            { n: "2", t: "AI ranks locals", d: "Providers & sellers scored on distance, rating, response time and budget fit." },
            { n: "3", t: "Both sides get pinged", d: "Matched locals get notified instantly — chats usually start within minutes." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-white/[.06] p-4 ring-1 ring-white/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-400/15 text-[12px] font-extrabold text-brand-300">
                {s.n}
              </span>
              <p className="mt-2.5 text-[13.5px] font-extrabold">{s.t}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/55">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <Composer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
