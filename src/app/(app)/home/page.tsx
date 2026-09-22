"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Megaphone, Plus, Search, Sparkles } from "lucide-react";
import { ListingCard, RequestCard, ServiceCard } from "@/components/cards";
import { Button, Chip, EmptyState, ListingCardSkeleton, SectionHeading, ServiceCardSkeleton } from "@/components/ui";
import { Globe2, MapPin, Rocket, Sprout } from "lucide-react";
import { isPune, placeOf, placeLabel, sameCity } from "@/lib/geo";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { distanceBetweenAreas } from "@/lib/geo";
import { SEARCH_EXAMPLES } from "@/lib/ai";
import { useApp } from "@/lib/store";
import type { ProductCategory } from "@/lib/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { state, hydrated, currentUser, dispatch } = useApp();
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory | "all">("all");
  const [everywhere, setEverywhere] = React.useState(false);

  const loc = state.browseLocation;
  const cityLabel = loc ? loc.city : "your city";
  const myArea = currentUser?.area ?? "viman";
  const inPune = loc ? isPune(loc) : false;

  const inBrowseArea = React.useCallback(
    (area: string) => state.browseArea === "all" || area === state.browseArea,
    [state.browseArea]
  );

  const inMyCity = React.useCallback(
    (item: { location?: import("@/lib/types").LocoraLocation; area: string }) =>
      !loc || sameCity(placeOf(item), loc),
    [loc]
  );

  const products = React.useMemo(
    () =>
      state.products
        .filter((p) => p.status === "active")
        .filter((p) => !state.users.find((u) => u.id === p.sellerId)?.banned)
        .filter((p) => category === "all" || p.category === category)
        .filter((p) => (everywhere ? true : inMyCity(p)))
        .filter((p) => !loc || !inPune || inBrowseArea(p.area))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [state.products, state.users, category, inMyCity, everywhere, inBrowseArea, loc, inPune]
  );

  const services = React.useMemo(
    () =>
      state.services
        .filter((s) => !state.users.find((u) => u.id === s.providerId)?.banned)
        .filter((s) => (everywhere ? true : inMyCity(s)))
        .sort((a, b) => distanceBetweenAreas(currentUser?.area ?? "viman", a.area) - distanceBetweenAreas(currentUser?.area ?? "viman", b.area)),
    [state.services, state.users, inMyCity, everywhere, currentUser]
  );

  const cityHasAnything = React.useMemo(
    () =>
      loc
        ? state.products.some((p) => p.status === "active" && sameCity(placeOf(p), loc)) ||
          state.services.some((s) => sameCity(placeOf(s), loc))
        : true,
    [state.products, state.services, loc]
  );

  const openRequests = React.useMemo(() => state.requests.filter((r) => r.status === "open").slice(0, 6), [state.requests]);
  const hasDemo = React.useMemo(
    () =>
      state.products.some((p) => p.isDemo) ||
      state.services.some((s) => s.isDemo) ||
      state.requests.some((r) => r.isDemo),
    [state.products, state.services, state.requests],
  );
  const userById = React.useCallback((id: string) => state.users.find((u) => u.id === id), [state.users]);

  const productCount = products.length;

  return (
    <div className="space-y-9">
      {/* ---------- greeting + search ---------- */}
      <section className="animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[27px]">
              {greeting()}, {currentUser?.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13.5px] font-medium text-ink-500">
              <MapPin size={14} className="text-brand-600" />
              <span className="font-bold text-ink-800">{everywhere ? "Everywhere" : cityLabel}</span>
              <span>· {productCount} item{productCount === 1 ? "" : "s"} & {services.length} services</span>
              <button
                onClick={() => setEverywhere((v) => !v)}
                className={`ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ring-1 transition ${
                  everywhere
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-ink-500 ring-stone-200 hover:text-ink-800"
                }`}
              >
                <Globe2 size={12} />
                {everywhere ? "Showing everywhere — back to my city" : "Show everywhere"}
              </button>
            </p>
          </div>
          <Button variant="dark" className="hidden lg:inline-flex" onClick={() => router.push("/create")}>
            <Plus size={16} /> Post an ad
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
          }}
          className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-stone-200/70 transition focus-within:ring-2 focus-within:ring-brand-500"
        >
          <Search size={19} className="ml-2.5 shrink-0 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search like you talk — “used iPhone under 40k near me”"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[14.5px] outline-none placeholder:text-ink-300"
            aria-label="Search Locora"
          />
          <button
            type="submit"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700 active:scale-95"
          >
            <Sparkles size={15} /> Search
          </button>
        </form>

        <div className="mask-fade-r mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="flex shrink-0 items-center gap-1 pr-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-300">
            <Sparkles size={11} className="text-brand-500" /> Try
          </span>
          {SEARCH_EXAMPLES.slice(0, 4).map((ex) => (
            <button
              key={ex}
              onClick={() => router.push(`/search?q=${encodeURIComponent(ex)}`)}
              className="shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-500 ring-1 ring-stone-200/80 transition hover:text-brand-700 hover:ring-brand-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      {hasDemo && (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 px-3.5 py-2.5 text-[12px] font-semibold leading-snug text-amber-800">
          <FlaskConical size={14} className="shrink-0" />
          Some listings below are marked <span className="font-extrabold uppercase tracking-wide">Demo</span> — they&apos;re sample
          data so you can see how Locora works. Everything else is posted by real neighbours.
        </p>
      )}

      {/* ---------- I'm looking for ---------- */}
      <section className="animate-fade-up" style={{ animationDelay: ".05s" }}>
        <SectionHeading
          title="I'm Looking For"
          sub="Neighbours asking, AI hunting — matches in minutes"
          action={
            <Link href="/requests" className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-700 transition hover:text-brand-800">
              See all <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <Link
            href="/requests"
            className="group flex w-[210px] shrink-0 flex-col items-start justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 transition hover:border-brand-400 hover:bg-brand-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-100 transition group-hover:scale-105">
              <Megaphone size={18} />
            </span>
            <p className="mt-3 text-[13.5px] font-extrabold leading-snug text-ink-900">Post what you need</p>
            <p className="mt-1 text-[11.5px] font-medium leading-snug text-ink-500">
              Can&apos;t find it? Let AI match sellers &amp; pros near you
            </p>
          </Link>
          {hydrated ? (
            openRequests.map((r) => <RequestCard key={r.id} request={r} buyer={userById(r.buyerId)} />)
          ) : (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 w-[300px] shrink-0 rounded-2xl bg-white p-4 shadow-card sm:w-[330px]">
                <div className="shimmer-bg animate-shimmer h-full w-full rounded-xl" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ---------- categories ---------- */}
      <section className="animate-fade-up" style={{ animationDelay: ".1s" }}>
        <div className="mask-fade-r flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            ✨ All categories
          </Chip>
          {PRODUCT_CATEGORIES.map((c) => {
            const count = state.products.filter((p) => p.category === c.id && p.status === "active").length;
            if (!count) return null;
            return (
              <Chip key={c.id} active={category === c.id} onClick={() => setCategory(category === c.id ? "all" : c.id)}>
                {c.emoji} {c.label}
              </Chip>
            );
          })}
        </div>
      </section>

      {/* ---------- products ---------- */}
      <section className="animate-fade-up" style={{ animationDelay: ".15s" }}>
        <SectionHeading
          title={category === "all" ? "Fresh near you" : `${PRODUCT_CATEGORIES.find((c) => c.id === category)?.label} near you`}
          sub="Ranked by AI for value and proximity"
        />
        {!hydrated ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 && !cityHasAnything && !everywhere ? (
          <div className="reveal-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-brand-950 to-ink-900 p-7 text-white shadow-lift sm:p-10">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="aurora-blob absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-400/30 blur-[80px]" />
              <div className="aurora-blob aurora-blob-2 absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-accent-400/20 blur-[70px]" />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11.5px] font-extrabold uppercase tracking-wider text-brand-200 ring-1 ring-white/15">
                <Sprout size={13} /> New city
              </span>
              <h3 className="mt-4 max-w-lg text-pretty text-[24px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
                Locora is just getting started in {cityLabel} 🌱
              </h3>
              <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/70">
                Be one of the first people in your area. Post what you&apos;re selling, offer a
                service, or tell everyone what you&apos;re looking for — Locora&apos;s AI starts
                matching the moment neighbours join.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Button className="!bg-white !text-ink-900 hover:!bg-stone-100" onClick={() => router.push("/create")}>
                  <Rocket size={16} /> Be the first to post
                </Button>
                <Button variant="ghost" className="!bg-white/5 !text-white ring-1 ring-inset ring-white/25 hover:!bg-white/10" onClick={() => router.push("/requests")}>
                  <Megaphone size={16} /> Ask for something
                </Button>
                <Button variant="ghost" className="!text-white/80 hover:!bg-white/10" onClick={() => setEverywhere(true)}>
                  <Globe2 size={16} /> Browse everywhere
                </Button>
              </div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={22} />}
            title="Nothing listed here yet"
            body={`No ${category === "all" ? "items" : category} ads here right now. Post an "I'm Looking For" request and Locora AI will alert you the moment something matching appears.`}
            action={<Button onClick={() => router.push("/requests")}>Post a request</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {products.map((p) => (
              <ListingCard
                key={p.id}
                product={p}
                seller={userById(p.sellerId)}
                distance={distanceBetweenAreas(myArea, p.area)}
                favorited={state.favorites.includes(p.id)}
                onToggleFavorite={() => dispatch({ type: "TOGGLE_FAVORITE", productId: p.id })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- services ---------- */}
      <section className="animate-fade-up" style={{ animationDelay: ".2s" }}>
        <SectionHeading
          title="Top-rated services near you"
          sub="Verified pros with real neighbour reviews"
          action={
            <Link href="/search?q=services" className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-700 transition hover:text-brand-800">
              Browse all <ArrowRight size={14} />
            </Link>
          }
        />
        {!hydrated ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.slice(0, 8).map((s) => (
              <ServiceCard key={s.id} service={s} provider={userById(s.providerId)} distance={distanceBetweenAreas(myArea, s.area)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
