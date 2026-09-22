"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, History, Megaphone, Search, ShieldCheck, SlidersHorizontal, Sparkles, X,
} from "lucide-react";
import { ListingCard, ServiceCard } from "@/components/cards";
import { Badge, Button, EmptyState, ListingCardSkeleton } from "@/components/ui";
import { SEARCH_EXAMPLES, parseSearchQuery, type SearchParse } from "@/lib/ai";
import { distanceBetweenAreas } from "@/lib/geo";
import { inr, km as kmFmt } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Condition, PriceCheckLabel, Product, ProductCategory, ServiceCategory, Service } from "@/lib/types";

interface Filters {
  category?: ProductCategory | ServiceCategory;
  priceMax?: number;
  area?: string;
  condition?: Condition;
}

const SORTS = [
  { id: "relevance", label: "Best match" },
  { id: "newest", label: "Newest first" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "nearest", label: "Nearest first" },
] as const;

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, hydrated, currentUser, dispatch } = useApp();

  const [input, setInput] = React.useState(params.get("q") ?? "");
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [thinking, setThinking] = React.useState(false);
  const [parse, setParse] = React.useState<SearchParse | null>(null);
  const [filters, setFilters] = React.useState<Filters>({});
  const [sort, setSort] = React.useState<(typeof SORTS)[number]["id"]>("relevance");
  const [recent, setRecent] = React.useState<string[]>([]);

  const myArea = currentUser?.area ?? "viman";
  const userById = React.useCallback((id: string) => state.users.find((u) => u.id === id), [state.users]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("locora:recent-searches");
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const runSearch = React.useCallback(async (q: string) => {
    if (!q.trim()) return;
    setThinking(true);
    setParse(null);
    setFilters({});
    const p = await parseSearchQuery(q);
    setParse(p);
    setFilters({ category: p.category, priceMax: p.priceMax, area: p.area, condition: p.condition });
    setThinking(false);
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 6);
      try {
        window.localStorage.setItem("locora:recent-searches", JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (query) runSearch(query);
  }, [query, runSearch]);

  /* ------------------------- compute results ------------------------ */

  const { products, services, hiddenCount } = React.useMemo(() => {
    if (!parse || !hydrated) return { products: [] as Product[], services: [] as Service[], hiddenCount: 0 };

    const keywordMatch = (p: Product) =>
      !parse?.keywords.length ||
      parse.keywords.some((k) =>
        `${p.title} ${p.description} ${p.aiTags.join(" ")} ${Object.values(p.attributes ?? {}).join(" ")}`
          .toLowerCase()
          .includes(k)
      );

    const areaFilter = (area: string) => !filters.area || area === filters.area;

    if (parse.kind === "service") {
      const svcs = state.services
        .filter((s) => !filters.category || s.category === filters.category)
        .filter((s) => areaFilter(s.area))
        .filter((s) => !state.users.find((u) => u.id === s.providerId)?.banned)
        .sort((a, b) => {
          if (sort === "nearest") return distanceBetweenAreas(myArea, a.area) - distanceBetweenAreas(myArea, b.area);
          return b.rating - a.rating;
        });
      return { products: [] as Product[], services: svcs, hiddenCount: 0 };
    }

    const active = state.products.filter((p) => p.status === "active");
    const hiddenCount = active.filter((p) => p.flagged).length;

    let prods = active
      .filter((p) => !p.flagged)
      .filter((p) => !filters.category || p.category === filters.category)
      .filter((p) => !filters.priceMax || p.price <= filters.priceMax!)
      .filter((p) => !filters.condition || p.condition === filters.condition)
      .filter((p) => areaFilter(p.area));

    const strict = prods.filter(keywordMatch);
    if (strict.length > 0) prods = strict;

    prods = [...prods].sort((a, b) => {
      switch (sort) {
        case "newest":
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "nearest":
          return distanceBetweenAreas(myArea, a.area) - distanceBetweenAreas(myArea, b.area);
        default: {
          const score = (p: Product) =>
            (keywordMatch(p) ? 30 : 0) +
            (p.priceCheck.label === "great" ? 12 : 0) +
            Math.max(0, 14 - distanceBetweenAreas(myArea, p.area)) +
            ((userById(p.sellerId)?.rating ?? 4.5) - 4.5) * 10 +
            Math.min(10, (+new Date(p.createdAt) - +new Date(Date.now() - 30 * 864e5)) / 864e5);
          return score(b) - score(a);
        }
      }
    });

    return { products: prods, services: [] as Service[], hiddenCount };
  }, [parse, filters, sort, state.products, state.services, state.users, hydrated, myArea, userById, parse?.keywords]);

  /* ---------------------------- render ------------------------------ */

  const chips: { key: keyof Filters; label: string }[] = [];
  if (filters.category) chips.push({ key: "category", label: String(filters.category).replace("-", " ") });
  if (filters.priceMax) chips.push({ key: "priceMax", label: `Under ${inr(filters.priceMax)}` });
  if (filters.area) chips.push({ key: "area", label: `📍 ${filters.area.replace("-", " ")}` });
  if (filters.condition) chips.push({ key: "condition", label: filters.condition.replace("-", " ") });

  const removeChip = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: undefined }));

  return (
    <div className="space-y-6">
      {/* search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input.trim());
          router.replace(`/search?q=${encodeURIComponent(input.trim())}`);
        }}
        className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-stone-200/70 transition focus-within:ring-2 focus-within:ring-brand-500"
      >
        <Search size={19} className="ml-2.5 shrink-0 text-ink-400" />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you need — “deep cleaning before Diwali, 2BHK”"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[14.5px] outline-none placeholder:text-ink-300"
          aria-label="Search Locora"
        />
        {input && (
          <button type="button" onClick={() => setInput("")} className="text-ink-300 transition hover:text-ink-500" aria-label="Clear">
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700 active:scale-95"
        >
          <Sparkles size={15} /> Search
        </button>
      </form>

      {/* no query yet */}
      {!query && !thinking && !parse && (
        <div className="animate-fade-up space-y-8 pt-4">
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-7 text-white shadow-glow sm:p-9">
            <Sparkles size={26} className="text-brand-200" />
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-[28px]">
              Search like you talk.
            </h1>
            <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-brand-50/85">
              No filters, no category digging. Tell Locora AI what you need in plain words — it
              understands the category, budget, area and condition, then ranks the best matches
              for you.
            </p>
          </div>
          {recent.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-ink-400">
                <History size={13} /> Recent searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setInput(r);
                      setQuery(r);
                    }}
                    className="rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-600 ring-1 ring-stone-200/80 transition hover:ring-brand-300 hover:text-brand-700"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-ink-400">
              <Sparkles size={13} className="text-brand-500" /> Try one of these
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {SEARCH_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setInput(ex);
                    setQuery(ex);
                  }}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-card ring-1 ring-stone-100/70 transition hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-200"
                >
                  <span className="text-[14px] font-semibold text-ink-700">“{ex}”</span>
                  <ArrowRight size={16} className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* thinking */}
      {thinking && (
        <div className="animate-fade-in rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Sparkles size={16} className="animate-pulse" />
            </span>
            <div className="flex-1 space-y-2">
              <div className="shimmer-bg animate-shimmer h-3.5 w-2/3 rounded-full" />
              <div className="shimmer-bg animate-shimmer h-3 w-1/3 rounded-full" />
            </div>
          </div>
          <p className="mt-3 pl-12 text-[12.5px] font-semibold text-ink-400">
            Locora AI is reading your request…
          </p>
        </div>
      )}

      {/* results */}
      {parse && !thinking && (
        <>
          {/* AI understood */}
          <div className="animate-fade-up rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Sparkles size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink-900">
                  AI understood: <span className="font-extrabold">{parse.summary || "everything nearby"}</span>
                </p>
                <p className="mt-0.5 text-[12px] italic text-ink-400">{parse.voice}</p>
                {chips.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {chips.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => removeChip(c.key)}
                        className="group inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11.5px] font-bold text-ink-600 capitalize transition hover:bg-rose-50 hover:text-rose-600"
                        title="Remove filter"
                      >
                        {c.label}
                        <X size={11} className="opacity-40 transition group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {hiddenCount > 0 && (
                <Badge tone="brand" className="hidden shrink-0 sm:inline-flex">
                  <ShieldCheck size={11} /> {hiddenCount} scam ad{hiddenCount > 1 ? "s" : ""} hidden
                </Badge>
              )}
            </div>
          </div>

          {/* header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] font-bold text-ink-900">
              {parse.kind === "service" ? (
                <>
                  {services.length} service{services.length === 1 ? "" : "s"}{" "}
                  <span className="font-medium text-ink-400">match your request</span>
                </>
              ) : (
                <>
                  {products.length} result{products.length === 1 ? "" : "s"}{" "}
                  <span className="font-medium text-ink-400">for “{query}”</span>
                </>
              )}
            </p>
            <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-500">
              <SlidersHorizontal size={14} className="text-ink-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as (typeof SORTS)[number]["id"])}
                className="rounded-lg bg-white py-1.5 pl-2.5 pr-7 text-[12.5px] font-bold text-ink-700 ring-1 ring-stone-200/80 outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hiddenCount > 0 && (
            <p className="-mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 sm:hidden">
              <ShieldCheck size={13} /> {hiddenCount} scam-flagged ad hidden by AI
            </p>
          )}

          {/* grid */}
          {parse.kind === "service" ? (
            services.length === 0 ? (
              <EmptyState
                icon={<Megaphone size={22} />}
                title="No services matched — yet"
                body="Post an 'I'm Looking For' request with your budget and timing. Locora AI will notify matching providers near you within minutes."
                action={<Button onClick={() => router.push("/requests")}>Post a request</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    provider={userById(s.providerId)}
                    distance={distanceBetweenAreas(myArea, s.area)}
                  />
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={22} />}
              title="No results — but AI can hunt for you"
              body={`Nothing matches “${query}” right now. Post an 'I'm Looking For' request and Locora AI will watch every new listing and ping you when something fits.`}
              action={<Button onClick={() => router.push("/requests")}>Post a request</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {products.map((p) => (
                <ListingCard
                  key={p.id}
                  product={p}
                  seller={userById(p.sellerId)}
                  distance={filters.area ? undefined : distanceBetweenAreas(myArea, p.area)}
                  favorited={state.favorites.includes(p.id)}
                  onToggleFavorite={() => dispatch({ type: "TOGGLE_FAVORITE", productId: p.id })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* initial skeletons */}
      {!hydrated && query && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<ListingCardSkeleton />}>
      <SearchInner />
    </React.Suspense>
  );
}
