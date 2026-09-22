"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, Crosshair, Download, Eye, Heart, Loader2, Megaphone, MessageCircle, Package,
  ShieldCheck, Sparkles, Star, Trash2, Wrench,
} from "lucide-react";
import { ListingCard } from "@/components/cards";
import { Avatar, Badge, Button, Modal, RatingStars, Skeleton } from "@/components/ui";
import { inr, joinedOn, responseLabel, timeAgo } from "@/lib/format";
import { areaName, browserLocate, nominatimReverse, placeLabel, placeOf } from "@/lib/geo";
import { useApp, useToast } from "@/lib/store";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

function MyListingRow({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-stone-100/70 transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover ring-1 ring-stone-200" />
      ) : (
        <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl">📦</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-[14px] font-extrabold text-ink-900">
          <span className="truncate">{product.title}</span>
          {product.status === "sold" ? (
            <Badge tone="stone">Sold</Badge>
          ) : (
            <Badge tone="brand">Live</Badge>
          )}
        </p>
        <p className="mt-0.5 text-[13px] font-bold text-brand-700">{inr(product.price)}</p>
        <p className="mt-1 flex items-center gap-3 text-[11.5px] font-semibold text-ink-400">
          <span className="flex items-center gap-1"><Eye size={12} /> {product.views}</span>
          <span className="flex items-center gap-1"><Heart size={12} /> {product.favorites}</span>
          <span>{timeAgo(product.createdAt)}</span>
        </p>
      </div>
      <span className="shrink-0 text-[12px] font-bold text-ink-300 transition group-hover:text-brand-600">view →</span>
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { state, hydrated, currentUser, dispatch } = useApp();
  const { push } = useToast();
  const [locating, setLocating] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  /** DPDP right to portability: download everything we hold about you. */
  const exportMyData = async () => {
    if (!REAL_MODE) {
      push({ kind: "info", title: "Demo mode", body: "Data export is available in the online version." });
      return;
    }
    const sb = supabase();
    if (!sb || !me) return;
    setExporting(true);
    try {
      const mine = <T extends { sellerId?: string; providerId?: string; buyerId?: string }>(rows: T[]) =>
        rows.filter((r) => r.sellerId === me.id || r.providerId === me.id || r.buyerId === me.id);
      const [products, services, requests, reviews, favorites] = await Promise.all([
        sb.from("products").select("*").eq("seller_id", me.id),
        sb.from("services").select("*").eq("provider_id", me.id),
        sb.from("buy_requests").select("*").eq("buyer_id", me.id),
        sb.from("reviews").select("*").or(`author.eq.${me.id},target_id.eq.${me.id}`),
        sb.from("favorites").select("product_id, created_at").eq("user_id", me.id),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        app: "Locora",
        profile: me,
        products: products.data ?? [],
        services: services.data ?? [],
        buyRequests: requests.data ?? [],
        reviews: reviews.data ?? [],
        favorites: favorites.data ?? [],
        notice: "Machine-readable export of your Locora data (DPDP Act, 2023 — right to portability).",
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `locora-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      push({ kind: "success", title: "Your data has been downloaded 📦" });
    } catch {
      push({ kind: "error", title: "Export failed", body: "Please try again in a moment." });
    } finally {
      setExporting(false);
    }
  };

  /** DPDP right to erasure: permanently deletes the account and all data. */
  const deleteMyAccount = async () => {
    const sb = supabase();
    if (!sb || !REAL_MODE) return;
    setDeleting(true);
    try {
      const { error } = await sb.rpc("delete_my_account");
      if (error) throw error;
      dispatch({ type: "LOGOUT" });
      dispatch({ type: "RESET" });
      try {
        await sb.auth.signOut();
      } catch {
        /* account already gone server-side */
      }
      push({ kind: "success", title: "Account deleted", body: "All your data has been erased. Goodbye 👋" });
      router.push("/");
    } catch (e) {
      push({
        kind: "error",
        title: "Could not delete account",
        body: e instanceof Error ? e.message : "Please try again or contact support.",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteText("");
    }
  };

  const detectLocation = async () => {
    setLocating(true);
    try {
      const { lat, lng } = await browserLocate();
      const loc = await nominatimReverse(lat, lng);
      if (!loc) throw new Error("could not name this place");
      dispatch({ type: "SET_LOCATION", location: loc });
      push({ kind: "success", title: `📍 Location set to ${placeLabel(loc)}` });
    } catch (e) {
      push({
        kind: "error",
        title: "Couldn\'t pin your location",
        body: e instanceof Error && /denied|permission/i.test(e.message)
          ? "Location permission is blocked for this site — enable it in your browser settings."
          : "No worries — set your city from the location picker instead.",
      });
    } finally {
      setLocating(false);
    }
  };
  const [tab, setTab] = React.useState<"listings" | "services" | "saved" | "reviews" | "requests">("listings");

  if (!hydrated || !currentUser) return <Skeleton className="mx-auto mt-10 h-96 max-w-3xl rounded-3xl" />;

  const me = currentUser;
  const myListings = state.products.filter((p) => p.sellerId === me.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const myServices = state.services.filter((s) => s.providerId === me.id);
  const sold = myListings.filter((p) => p.status === "sold").length;
  const totalViews = myListings.reduce((a, p) => a + p.views, 0);
  const receivedReviews = state.reviews.filter((r) => r.targetId === me.id);
  const givenReviews = state.reviews.filter((r) => r.author === me.name);
  const myRequests = state.requests.filter((r) => r.buyerId === me.id);
  const favorites = state.products.filter((p) => state.favorites.includes(p.id) && p.status === "active");
  const myArea = me.area;

  const tabs = [
    { id: "listings" as const, label: `Listings (${myListings.length})` },
    ...(myServices.length ? [{ id: "services" as const, label: `My services (${myServices.length})` }] : []),
    { id: "saved" as const, label: `Saved (${favorites.length})` },
    { id: "reviews" as const, label: `Reviews (${receivedReviews.length})` },
    { id: "requests" as const, label: `Requests (${myRequests.length})` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* header */}
      <div className="animate-fade-up overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-stone-100/70">
        <div className="relative h-28 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
          <div className="bg-grid-dark absolute inset-0 opacity-50" aria-hidden />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar user={me} size="2xl" />
            <Button variant="secondary" size="sm" onClick={() => { push({ kind: "info", title: "Profile editing lands with Supabase accounts" }); }}>
              Edit profile
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">{me.name}</h1>
            {me.verified && (
              <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-200">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
            <Badge tone="stone" className="capitalize">
              {me.role === "provider" ? "Service pro" : me.role}
            </Badge>
          </div>
          <p className="mt-1 text-[13px] font-medium text-ink-400">
            {placeLabel(placeOf(me))} · member since {joinedOn(me.joinedAt)} · replies in {responseLabel(me.responseMins ?? 15)}
          </p>
          {me.bio && <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-ink-600">{me.bio}</p>}

          {/* stats */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { v: myListings.length - sold, l: "live listings" },
              { v: sold, l: "sold" },
              { v: totalViews.toLocaleString("en-IN"), l: "total views" },
              { v: receivedReviews.length ? (receivedReviews.reduce((a, r) => a + r.rating, 0) / receivedReviews.length).toFixed(1) : "—", l: "avg rating" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-stone-50 px-2 py-3">
                <p className="text-[18px] font-extrabold tracking-tight text-ink-900">{s.v}</p>
                <p className="mt-0.5 text-[10.5px] font-bold text-ink-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* location card — where Locora thinks you are */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-stone-100/70 sm:flex-nowrap">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Crosshair size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-extrabold text-ink-900">
            Browsing from {placeLabel(state.browseLocation ?? placeOf(me))}
          </p>
          <p className="text-[11.5px] font-semibold text-ink-400">
            Listing feeds, distances and matches are scoped to this place.
          </p>
        </div>
        <button
          onClick={detectLocation}
          disabled={locating}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-stone-100 px-3.5 py-2 text-[12.5px] font-bold text-ink-700 ring-1 ring-stone-200 transition hover:bg-stone-200 disabled:opacity-60"
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          {locating ? "Locating…" : "Detect now"}
        </button>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2 text-[12.5px] font-bold text-brand-800 ring-1 ring-brand-100 select-none">
          <input
            type="checkbox"
            checked={state.autoLocate}
            onChange={(e) => dispatch({ type: "SET_AUTO_LOCATE", value: e.target.checked })}
            className="h-3.5 w-3.5 accent-brand-600"
          />
          Auto-detect
        </label>
      </div>

      {/* tabs */}
      <div className="mask-fade-r flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-bold ring-1 transition ${
              tab === t.id ? "bg-ink-950 text-white ring-ink-950" : "bg-white text-ink-600 ring-stone-200/80 hover:ring-stone-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* listings tab */}
      {tab === "listings" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-ink-900">Your ads</p>
            <Link href="/create/listing" className="text-[13px] font-bold text-brand-700 hover:text-brand-800">+ Post new ad</Link>
          </div>
          {myListings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/60 px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Package size={22} />
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-ink-900">No ads yet</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-500">
                Turn your pre-loved things into cash — AI writes the ad for you in seconds.
              </p>
              <Link href="/create/listing" className="mt-4 inline-block"><Button>Post your first ad</Button></Link>
            </div>
          ) : (
            myListings.map((p) => <MyListingRow key={p.id} product={p} />)
          )}
        </div>
      )}

      {/* services tab */}
      {tab === "services" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-ink-900">Your service profiles</p>
            <Link href="/create-service" className="text-[13px] font-bold text-brand-700 hover:text-brand-800">+ New service</Link>
          </div>
          {myServices.map((s) => (
            <Link
              key={s.id}
              href={`/service/${s.id}`}
              className="group flex items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-stone-100/70 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">
                <Wrench size={22} className="text-brand-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-extrabold text-ink-900">{s.title}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{s.tagline}</p>
                <p className="mt-1 flex items-center gap-2 text-[11.5px] font-semibold text-ink-400">
                  {s.reviewsCount > 0 ? <RatingStars value={s.rating} size={11} /> : <Badge tone="brand">✦ New</Badge>}
                  <span>from {inr(s.startingPrice)}</span>
                </p>
              </div>
              <span className="shrink-0 text-[12px] font-bold text-ink-300 transition group-hover:text-brand-600">view →</span>
            </Link>
          ))}
        </div>
      )}

      {/* saved tab */}
      {tab === "saved" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-accent-50/70 p-3.5 ring-1 ring-accent-100">
            <Sparkles size={15} className="shrink-0 text-accent-600" />
            <p className="text-[12.5px] font-semibold text-accent-800">
              AI watches your saved items — you get a notification the moment a price drops.
            </p>
          </div>
          {favorites.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/60 px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                <Heart size={22} />
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-ink-900">Nothing saved yet</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-500">
                Tap the heart on any listing to save it here and get price-drop alerts.
              </p>
              <Link href="/home" className="mt-4 inline-block"><Button variant="softBrand">Browse nearby</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {favorites.map((p) => (
                <ListingCard
                  key={p.id}
                  product={p}
                  seller={state.users.find((u) => u.id === p.sellerId)}
                  distance={undefined}
                  favorited={true}
                  onToggleFavorite={() => dispatch({ type: "TOGGLE_FAVORITE", productId: p.id })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* reviews tab */}
      {tab === "reviews" && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <div className="flex items-center justify-between">
              <h3 className="text-[14.5px] font-extrabold text-ink-900">Reviews you received</h3>
              {receivedReviews.length > 0 && (
                <RatingStars value={receivedReviews.reduce((a, r) => a + r.rating, 0) / receivedReviews.length} />
              )}
            </div>
            {receivedReviews.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-400">
                No reviews yet — complete a deal in chat and ask your counterpart to leave one.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {receivedReviews.map((r) => (
                  <div key={r.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-ink-800">{r.author}</p>
                      <RatingStars value={r.rating} size={12} showValue={false} />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">“{r.text}”</p>
                    <p className="mt-1 text-[11px] font-semibold text-ink-300">
                      {r.dealType === "service" ? "Service deal" : "Product deal"} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <h3 className="text-[14.5px] font-extrabold text-ink-900">Reviews you gave</h3>
            {givenReviews.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-400">
                After you mark a deal complete in chat, you can leave a review.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {givenReviews.map((r) => (
                  <div key={r.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-ink-800">for {state.users.find((u) => u.id === r.targetId)?.name ?? "a neighbour"}</p>
                      <RatingStars value={r.rating} size={12} showValue={false} />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">“{r.text}”</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* requests tab */}
      {tab === "requests" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-ink-900">Your I&apos;m Looking For requests</p>
            <Link href="/requests" className="text-[13px] font-bold text-brand-700 hover:text-brand-800">+ New request</Link>
          </div>
          {myRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/60 px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 ring-1 ring-accent-100">
                <Megaphone size={22} />
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-ink-900">No requests yet</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-500">
                Can&apos;t find something? Post a request and let AI hunt for you.
              </p>
              <Link href="/requests" className="mt-4 inline-block"><Button>Post a request</Button></Link>
            </div>
          ) : (
            myRequests.map((r) => (
              <Link
                key={r.id}
                href="/requests"
                className="group flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70 transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100">
                  <Megaphone size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink-800">“{r.text}”</p>
                  <p className="mt-1.5 flex items-center gap-2 text-[11.5px] font-semibold text-ink-400">
                    {r.status === "open" ? <Badge tone="brand">Open</Badge> : <Badge tone="stone">Fulfilled</Badge>}
                    {r.matches.length > 0 && <span className="flex items-center gap-1"><Sparkles size={11} className="text-accent-500" /> {r.matches.length} AI match{r.matches.length > 1 ? "es" : ""}</span>}
                    <span>{timeAgo(r.createdAt)}</span>
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* chats shortcut */}
      <button
        onClick={() => router.push("/chat")}
        className="flex w-full items-center gap-3.5 rounded-3xl bg-ink-950 p-5 text-left text-white shadow-soft transition hover:bg-ink-900"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <MessageCircle size={20} className="text-brand-300" />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-extrabold">Your chats</span>
          <span className="block text-[12.5px] text-white/50">Offers, negotiations and meetups — all in one place</span>
        </span>
        <span className="text-[13px] font-bold text-brand-300">open →</span>
      </button>

      {/* your data — DPDP rights: export, erasure, policies */}
      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-50 text-ink-600 ring-1 ring-ink-100">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-[14.5px] font-extrabold text-ink-900">Your data</p>
            <p className="text-[12px] font-medium text-ink-400">
              Download everything we hold about you, or delete your account permanently.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={exportMyData}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2.5 text-[12.5px] font-bold text-ink-700 ring-1 ring-stone-200 transition hover:bg-stone-200 disabled:opacity-60"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Preparing…" : "Download my data"}
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-[12.5px] font-bold text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100"
          >
            <Trash2 size={14} /> Delete account
          </button>
        </div>
        <p className="mt-3 text-[11.5px] font-medium leading-relaxed text-ink-400">
          Read our{" "}
          <Link href="/privacy" className="font-bold text-brand-700 underline">Privacy Policy</Link>{" "}
          and{" "}
          <Link href="/terms" className="font-bold text-brand-700 underline">Terms of Service</Link>.
          Deleting removes your profile, listings, services, requests, reviews and chats permanently.
        </p>
      </div>

      {/* delete confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} className="max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
            <Trash2 size={22} />
          </span>
          <h3 className="mt-3 text-[17px] font-extrabold text-ink-900">Delete your account?</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
            This permanently erases your profile, listings, services, requests, reviews and chats.
            There is no undo.
          </p>
          <input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="mt-4 w-full rounded-xl bg-stone-50 px-4 py-3 text-center text-[13.5px] font-bold outline-none ring-1 ring-stone-200 transition focus:ring-2 focus:ring-rose-400"
          />
          <div className="mt-4 flex w-full gap-2">
            <button
              onClick={() => setDeleteOpen(false)}
              className="h-11 flex-1 rounded-xl bg-stone-100 text-[13px] font-bold text-ink-600 transition hover:bg-stone-200"
            >
              Keep my account
            </button>
            <button
              onClick={deleteMyAccount}
              disabled={deleteText.trim().toUpperCase() !== "DELETE" || deleting}
              className="h-11 flex-1 rounded-xl bg-rose-600 text-[13px] font-bold text-white shadow-soft transition hover:bg-rose-700 disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
